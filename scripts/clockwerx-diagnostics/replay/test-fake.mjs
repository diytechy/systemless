import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {replay} from './core.mjs';
import {literalPlan} from './stream.mjs';
const [out,observerPath]=process.argv.slice(2);fs.mkdirSync(out,{recursive:false});
const {createObserver,hookMethods}=await import(pathToFileURL(observerPath).href);
const budget={fakeConstructors:0,fakeUpdates:0,fakeConstructorResets:0,actualSourceRoundImports:0,actualDataImports:0};
const literal={inputRuns:[{count:2,input:{}},{count:2,input:{swing:true}}]},plan=literalPlan(literal,4),checks=[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
class Fake {
 constructor(controls,death=false){assert.ok(budget.fakeConstructors<6);budget.fakeConstructors++;this.controls=controls;this.deathAtOne=death;this.reset();}
 reset(){this.controls?.beforeReset(true);budget.fakeConstructorResets++;this.steps=0;this.complete=false;this.death=null;this.player={sourceSlot:0,sourceRawRecord:0,canonicalFrame:true,frame:0,pivot:'invented',ownUndefined:undefined};this.enemies=[];this.events=[];this.controls?.afterReset();}
 point(){return {x:this.steps,y:0};}
 sourceGrabQuery(actor,human){return {allowed:human,owner:actor.sourceSlot};}
 update(dt,input){assert.ok(budget.fakeUpdates<100);budget.fakeUpdates++;this.steps++;this.player.frame=this.steps;if(this.steps===2)this.events.push(this.sourceGrabQuery(this.player,true));if(this.deathAtOne&&this.steps===1)this.death={reason:'invented-original-collision'};if(this.steps===4)this.complete=true;}
 snapshot(){return {steps:this.steps,complete:this.complete,dying:!!this.death,player:{...this.player},enemies:[],events:this.events.map(e=>({...e})),optional:undefined};}
}
const board=()=>({dots:[{id:'invented',x:0,y:0}],spikes:[],walls:[],enemies:[]});
const helpers={dotBodyFrame:()=>0,sourceFrame:()=>0};
function factory(death=false){const f=controls=>{controls.beforeConstructor();const game=new Fake(controls,death);controls.afterConstructor();return {game,board:board()};};f.helpers=helpers;return f;}
let result;
try{
 const g=new Fake(),b=board(),baselineDir=path.join(out,'baseline');
 const o=createObserver({directory:baselineDir,mode:'witness',checkpointEvery:128,failureWindow:128,bufferLimit:4096});o.attach(g,b,helpers);o.sample(null);
 o.row('planning-only',{invented:'must not become a consumed hook'});
 for(const input of plan.inputs()){o.update(1/120,input);o.sample(input);}o.terminal('goal');
 const baseline={status:'GOAL',goal:true,death:false,updates:4,finalState:g.snapshot(),observer:o.close(),RNGDraws:0};
 const streams=Object.fromEntries(['lineage','hook-metadata'].map(n=>[n,{path:path.join(baselineDir,n+'.jsonl'),sha256:hash(path.join(baselineDir,n+'.jsonl'))}]));
 const searchProjection={...baseline,observer:{...baseline.observer,stats:{...baseline.observer.stats,mode:'search'},digests:{...baseline.observer.digests,hooks:baseline.observer.digests['hook-metadata']}}};
 const args={maxUpdates:4,dt:1/120,literal,streams,observerFactory:createObserver,hookMethods,rngProvenance:'Invented fake only; unused'};
 const candidate=replay({...args,streams:undefined,directory:path.join(out,'candidate'),mode:'candidate',factory:factory()});
 assert.equal(candidate.candidateGoal,true);assert.equal(candidate.accepted,false);assert.equal(candidate.observer.stats.mode,'search');assert.equal(candidate.observer.digests.lineage,baseline.observer.digests.lineage);assert.equal(candidate.observer.digests['hook-metadata'],baseline.observer.digests['hook-metadata']);checks.push('Candidate captures a comparable search baseline without claiming a witness or acceptance.');
 const failedCandidate=replay({...args,streams:undefined,directory:path.join(out,'candidate-death'),mode:'candidate',factory:factory(true)});
 assert.equal(failedCandidate.candidateGoal,false);assert.equal(failedCandidate.status,'DEATH');assert.equal(failedCandidate.ledger.completedUpdates,1);checks.push('Candidate retains terminal death and stops without further updates.');
 const witness=replay({...args,directory:path.join(out,'witness'),mode:'witness',baseline:searchProjection,factory:factory()});
 assert.equal(witness.accepted,true);assert.equal(witness.lineageComparisons,5);assert.equal(witness.hookMetadataComparisons,2);assert.equal(witness.comparison.hookStatesEqual,null);checks.push('Witness accepts exact search core projection and ignores planning-only rows; raw undefined values compare at serialized JSON boundary.');
 const proof=replay({...args,directory:path.join(out,'fresh-proof'),mode:'fresh-proof',baseline,factory:factory()});
 assert.equal(proof.accepted,true);assert.equal(proof.comparison.hookStatesEqual,true);checks.push('Fresh proof accepts complete perupdate, hook states, metadata, inventory, terminal, RNG absence, and final source state.');
 const stopped=replay({...args,directory:path.join(out,'death-mismatch'),mode:'witness',baseline:searchProjection,factory:factory(true)});
 assert.equal(stopped.accepted,false);assert.equal(stopped.status,'MISMATCH');assert.equal(stopped.death,true);assert.equal(stopped.ledger.attemptedUpdates,1);assert.equal(stopped.ledger.completedUpdates,1);assert.equal(stopped.mismatch.step,1);assert.equal(fs.existsSync(path.join(out,'death-mismatch/first-mismatch.json')),true);checks.push('First divergent death sample stops at one attempted/completed update and preserves exact mismatch and failure window.');
 const rows=fs.readFileSync(path.join(out,'death-mismatch/counter-journal.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.at(-1).phase,'terminal-closed');assert.equal(rows.at(-1).reservedUpperUpdates,1);assert.equal(rows.find(r=>r.phase==='reserve-update-chunk').reservedUpperUpdates,4);assert.equal(rows.filter(r=>r.phase==='constructor-before').length,1);checks.push('Durable journal retains one constructor, a capped update reservation, immediate before/after counts, and exact closed counters.');
 const before=budget.fakeConstructors;assert.throws(()=>literalPlan(literal,5));assert.throws(()=>literalPlan({inputRuns:[{count:16001,input:{}}]},16001));assert.throws(()=>literalPlan({inputRuns:[{count:1,input:{cheat:true}}]},1));assert.equal(budget.fakeConstructors,before);checks.push('Exact literal length, 16000-update bound, and legal input guard reject before construction.');
 assert.equal(budget.fakeConstructors,6);assert.equal(budget.fakeUpdates,18);assert.equal(budget.fakeConstructorResets,6);
 result={status:'PASS',checks,budget};
}catch(error){result={status:'FAIL_RETAINED_NO_AUTOMATIC_RETRY',checks,budget,error:{message:error.message,stack:error.stack}};process.exitCode=1;}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
