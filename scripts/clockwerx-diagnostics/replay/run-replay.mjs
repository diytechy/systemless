import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {replay} from './core.mjs';
import {literalPlan} from './stream.mjs';
import {sourceRoundFactory} from './factory-source-round.mjs';
const [authPath,authHash]=process.argv.slice(2),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pin=p=>{if(!p||typeof p.path!=='string'||sha(p.path)!==p.sha256)throw Error('Pinned input mismatch: '+p?.path);};
const folder=path.dirname(fileURLToPath(import.meta.url));
let out;
try{
 if(!/^[0-9a-f]{64}$/.test(authHash)||sha(authPath)!==authHash)throw Error('Authorization hash mismatch');
 const auth=read(authPath),candidate=auth.mode==='candidate';out=auth.outputPath;
 const purpose=candidate?'clockwerx-generic-candidate-replay-v1':'clockwerx-generic-chosen-replay-v1';
 if(auth.schema!=='clockwerx-single-replay-authorization-v1'||auth.authority!=='Root'||auth.executionApproved!==true||auth.purpose!==purpose||!auth.invocationID||!['candidate','witness','fresh-proof'].includes(auth.mode))throw Error('Explicit fresh Root execution authorization required');
 if(auth.maxConstructors!==1||auth.maxConstructorResets!==1||auth.maxExplicitResets!==0||auth.wallBoundSeconds!==360||auth.dt!==1/120)throw Error('Replay bounds mismatch');
 if(candidate?auth.gates?.candidateLiteralReviewed!==true:auth.gates?.closedGoalLiteralReviewed!==true||auth.gates?.baselineReviewed!==true||auth.mode==='fresh-proof'&&auth.gates?.completedWitnessReviewed!==true)throw Error('Root literal review gates incomplete');
 const own=['run-replay.mjs','core.mjs','stream.mjs','factory-source-round.mjs','supervise.py'];
 for(const name of own){const p=auth.code.find(p=>path.resolve(p.path)===path.resolve(folder,name));if(!p)throw Error('Unpinned replay code: '+name);pin(p);}
 for(const p of [auth.sourceFreeze,auth.config,auth.literal,auth.observer,...(candidate?[]:[auth.baseline.caseResult])])pin(p);
 if(!['595f3ac1461b0d2a048df3970366db115e394a5af2502a401941abe313c32403','3995261bad511a709ec784ef0e1f255ea8761e419f74349b57702883836891f7','7ca0efc432485a3fbf2ff1122f5938fb6b7a39a210106f2f1af0749f0894665f'].includes(auth.observer.sha256))throw Error('Only frozen lossless observers are permitted');
 const frozen=read(auth.sourceFreeze.path).files;if(!Array.isArray(frozen)||!frozen.length)throw Error('Nonempty immutable source manifest required');const sourceNames=new Set();
 for(const p of frozen){const name=p.name??path.basename(p.path);if(name!==path.basename(name)||sourceNames.has(name))throw Error('Invalid or duplicate frozen source name');sourceNames.add(name);pin({path:path.join(auth.sourcePath,name),sha256:p.sha256});}
 for(const name of ['level.mjs','round.mjs','death.mjs','dots.mjs'])if(!sourceNames.has(name))throw Error('Required engine module missing from freeze: '+name);
 const config=read(auth.config.path);for(const p of [config.decoded,config.options,...Object.values(config.profiles??{}),...(config.bombRoutes?[config.bombRoutes]:[])])pin(p);
 if(typeof config.rngProvenance!=='string'||!config.rngProvenance.length)throw Error('Explicit RNG provenance required');
 const literal=read(auth.literal.path);literalPlan(literal,auth.maxUpdates);
 const baseline=candidate?null:read(auth.baseline.caseResult.path);
 if(!candidate){
 if(baseline.status!=='GOAL'||baseline.goal!==true||baseline.death!==false||baseline.updates!==auth.maxUpdates||!Number.isInteger(baseline.RNGDraws)||baseline.RNGDraws<0)throw Error('Closed baseline case contract invalid');
 if(baseline.observer?.stats?.mode!==(auth.mode==='witness'?'search':'witness'))throw Error('Witness requires search baseline; fresh proof requires completed witness baseline');
 for(const name of ['lineage','hook-metadata']){const p=auth.baseline.streams[name];if(!p?.path||!/^[0-9a-f]{64}$/.test(p.sha256))throw Error('Hash-bound baseline streams required');}
 }
 if(!fs.existsSync(path.join(out,'owned-process.json')))throw Error('Supervisor-owned output required');
 fs.writeFileSync(authPath+'.RUNNER-CONSUMED',JSON.stringify({PID:process.pid,authSHA256:authHash,invocationID:auth.invocationID})+'\n',{flag:'wx'});
 const {createObserver,hookMethods}=await import(pathToFileURL(auth.observer.path).href);
 const factory=await sourceRoundFactory(auth.sourcePath,config);
 const result=replay({directory:path.join(out,'case'),mode:auth.mode,maxUpdates:auth.maxUpdates,dt:auth.dt,literal,baseline,streams:auth.baseline?.streams,factory,observerFactory:createObserver,hookMethods,rngProvenance:config.rngProvenance});
 fs.writeFileSync(path.join(out,'invocation-result.json'),JSON.stringify({status:result.accepted?'CLOSED_ACCEPTED':result.candidateGoal?'CLOSED_CANDIDATE_GOAL':'CLOSED_FAILED_NO_RETRY',mode:auth.mode,authSHA256:authHash,invocationID:auth.invocationID,caseResultPath:path.join(out,'case/result.json'),caseResultSHA256:sha(path.join(out,'case/result.json')),ledger:result.ledger},null,2)+'\n',{flag:'wx'});
 if(!result.accepted&&!result.candidateGoal)process.exitCode=1;
}catch(error){const failure={status:'SETUP_OR_RUN_FAILURE_NO_RETRY',message:error.message,stack:error.stack,PID:process.pid};if(out&&fs.existsSync(out))fs.writeFileSync(path.join(out,'runner-failure.json'),JSON.stringify(failure,null,2)+'\n',{flag:'wx'});else fs.writeFileSync(authPath+'.RUNNER-FAILURE-'+process.pid+'.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});process.exitCode=1;}
