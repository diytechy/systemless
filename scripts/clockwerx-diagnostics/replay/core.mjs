import fs from 'node:fs';
import path from 'node:path';
import {CompactReader,literalPlan} from './stream.mjs';
const json=JSON.stringify;
const save=(p,v)=>fs.writeFileSync(p,json(v,null,2)+'\n',{flag:'wx'});
export class ReplayMismatch extends Error {constructor(kind){super('Replay mismatch: '+kind);this.name='ReplayMismatch';}}
// factory and observerFactory are injected only for portable fake checks.
// The real runner supplies the fixed SourceRound adapter and public observer.
export function replay({directory,mode,maxUpdates,dt,literal,baseline,streams,factory,observerFactory,hookMethods,rngProvenance}){
 const candidate=mode==='candidate';
 if(!['candidate','witness','fresh-proof'].includes(mode)||dt!==1/120)throw Error('Explicit replay mode and fixed 1/120 required');
 const plan=literalPlan(literal,maxUpdates);
 if(!candidate&&(baseline?.status!=='GOAL'||baseline.goal!==true||baseline.death!==false||baseline.updates!==plan.total||!baseline.finalState||!baseline.observer?.digests||!['search','witness'].includes(baseline.observer.stats?.mode)||mode==='fresh-proof'&&baseline.observer.stats.mode!=='witness'))throw Error('Closed matching goal baseline required');
 fs.mkdirSync(directory,{recursive:false});
 const ledger={constructorsAttempted:0,constructorsCompleted:0,constructorResetsAttempted:0,constructorResetsCompleted:0,explicitResetAttempts:0,explicitResetsCompleted:0,attemptedUpdates:0,completedUpdates:0,RNGDraws:0,reservedUpperUpdates:0};
 const journal=fs.openSync(path.join(directory,'counter-journal.jsonl'),'wx');
 const durable=(phase,force=false)=>{fs.writeSync(journal,json({phase,...ledger})+'\n');if(force||phase.includes('constructor')||phase.includes('terminal'))fs.fsyncSync(journal);};
 const result={schema:'generic-chosen-replay-case-v1',mode,status:'STARTED',goal:false,death:false,updates:0,ledger,lineageComparisons:0,hookMetadataComparisons:0,mismatch:null,exception:null};
 let observer,game,board,lastSample,inUpdate=false,terminalWritten=false,closed=false;
 const readers={},restores=[];
 const mismatch=(kind,actual,expected)=>{if(!result.mismatch){result.mismatch={kind,step:observer?.step??0};save(path.join(directory,'first-mismatch.json'),{...result.mismatch,actualSerialized:actual,expectedSerialized:expected});}throw new ReplayMismatch(kind);};
 const expectedRow=(name,actual)=>{const expected=readers[name].next();if(expected===null||actual!==expected)mismatch(name,actual,expected);};
 const sample=input=>{lastSample=observer.sample(input);if(!candidate){expectedRow('lineage',json(lastSample));result.lineageComparisons++;}};
 const controls={
  beforeConstructor(){if(ledger.constructorsAttempted!==0)throw Error('Second construction forbidden');ledger.constructorsAttempted++;durable('constructor-before',true);},
  afterConstructor(){ledger.constructorsCompleted++;durable('constructor-after',true);},
  beforeReset(constructing){if(!constructing){ledger.explicitResetAttempts++;durable('forbidden-explicit-reset',true);throw Error('Explicit or natural reset forbidden');}if(ledger.constructorResetsAttempted!==0)throw Error('Second constructor reset forbidden');ledger.constructorResetsAttempted++;durable('constructor-reset-before',true);},
  afterReset(){ledger.constructorResetsCompleted++;durable('constructor-reset-after',true);},
  randomUnsigned(){const raw=Math.random(),value=Math.floor(raw*65536);ledger.RNGDraws++;observer.rng({raw,value,provenance:rngProvenance});durable('rng-draw');return value;}
 };
 try{
  durable('pre-constructor',true);
  if(!candidate){readers.lineage=new CompactReader(streams.lineage.path,streams.lineage);readers['hook-metadata']=new CompactReader(streams['hook-metadata'].path,streams['hook-metadata']);}
  observer=observerFactory({directory:path.join(directory,'observation'),mode:candidate?'search':'witness',checkpointEvery:128,failureWindow:128,bufferLimit:1048576});
  ({game,board}=factory(controls));
  if(ledger.constructorsAttempted!==1||ledger.constructorsCompleted!==1||ledger.constructorResetsAttempted!==1||ledger.constructorResetsCompleted!==1)throw Error('One fresh construction and one constructor reset required');
  observer.attach(game,board,factory.helpers);
  if(!candidate)for(const method of hookMethods){if(typeof game[method]!=='function')continue;const observed=game[method];game[method]=function(...args){const compare=metadata=>{expectedRow('hook-metadata',json(metadata));result.hookMetadataComparisons++;};compare({step:observer.step,inUpdate,phase:'beforeOriginal',method,args});let returned;try{returned=observed.apply(this,args);}catch(error){if(!(error instanceof ReplayMismatch))compare({step:observer.step,inUpdate,phase:'originalException',method,error:error.message});throw error;}compare({step:observer.step,inUpdate,phase:'afterOriginal',method,returned});return returned;};restores.push(()=>game[method]=observed);}
  sample(null);
  for(const input of plan.inputs()){
   if(ledger.completedUpdates%128===0){ledger.reservedUpperUpdates=Math.min(maxUpdates,ledger.attemptedUpdates+128);durable('reserve-update-chunk',true);observer.journal(ledger,'reserve-update-chunk');}
   if(ledger.attemptedUpdates>=maxUpdates)throw Error('Exact literal update cap exceeded');
   ledger.attemptedUpdates++;durable('beforeUpdate');observer.journal(ledger,'beforeUpdate');inUpdate=true;
   try{observer.update(dt,input);ledger.completedUpdates++;result.updates++;}finally{inUpdate=false;durable('afterUpdate',ledger.completedUpdates%128===0);observer.journal(ledger,'afterUpdate');}
   // Atomic source update completes before inspecting its immediate sample.
   result.goal=!!game.complete;result.death=!!game.death;
   sample(input);
   if(result.death){result.status='DEATH';break;}
   if(result.goal){result.status='GOAL';break;}
  }
  if(result.status==='STARTED')result.status='FINITE_CAP_NO_GOAL';
  if(!candidate&&(result.status!=='GOAL'||result.updates!==maxUpdates))throw Error('Exact goal literal did not complete');
  for(const [name,reader] of Object.entries(readers)){const read=reader.finish();result.baselineStreams??={};result.baselineStreams[name]=read;if(read.logicalSHA256!==baseline.observer.digests[name])mismatch(name+'-baseline-logical-digest',read.logicalSHA256,baseline.observer.digests[name]);}
 }catch(error){result.status=error instanceof ReplayMismatch?'MISMATCH':result.death?'DEATH':'EXCEPTION';result.exception={name:error.name,message:error.message,stack:error.stack};}
 finally{
  try{
   if(game){result.goal=!!game.complete;result.death=!!game.death;result.finalState=game.snapshot();observer.terminal(result.status==='GOAL'?'goal':result.death?'death':'exception');terminalWritten=true;}
  }catch(error){result.status='CLOSURE_EXCEPTION';result.closureException={message:error.message,stack:error.stack};}
  finally{
   for(const restore of restores.reverse())restore();
   if(observer){try{result.observer=observer.close();closed=true;}catch(error){result.status='OBSERVER_CLOSE_EXCEPTION';result.closeException={message:error.message};}}
   try{factory.close?.();}catch(error){result.status='FACTORY_CLOSE_EXCEPTION';result.factoryCloseException={message:error.message};}
   for(const reader of Object.values(readers))reader.close();
   // No future update can occur after this synchronous closure, including failures.
   ledger.reservedUpperUpdates=ledger.attemptedUpdates;durable('terminal-closed',true);fs.closeSync(journal);
  }
 }
 if(!candidate&&result.status==='GOAL'&&terminalWritten&&closed){
  const a=baseline.observer.digests,b=result.observer.digests;
  result.comparison={lineageEqual:a.lineage===b.lineage,hookMetadataEqual:a['hook-metadata']===b['hook-metadata'],inventoryEqual:a.inventory===b.inventory,terminalEqual:a.terminal===b.terminal,RNGEqual:a.rng===b.rng,RNGDrawCountEqual:baseline.RNGDraws===ledger.RNGDraws,finalStateEqual:json(baseline.finalState)===json(result.finalState),hookStatesEqual:mode==='fresh-proof'?a.hooks===b.hooks:null};
  if(Object.values(result.comparison).some(v=>v===false)){result.status='DIGEST_OR_FINAL_STATE_MISMATCH';save(path.join(directory,'digest-mismatch.json'),{comparison:result.comparison,expected:baseline.observer.digests,actual:result.observer.digests});}
 }
 result.accepted=result.status==='GOAL'&&!!result.comparison&&Object.values(result.comparison).every(v=>v===true||v===null)&&ledger.explicitResetAttempts===0;
 if(candidate)result.candidateGoal=result.status==='GOAL'&&result.goal&&!result.death&&result.updates===maxUpdates&&terminalWritten&&closed&&ledger.explicitResetAttempts===0;
 result.RNGDraws=ledger.RNGDraws;
 save(path.join(directory,'result.json'),result);return result;
}
