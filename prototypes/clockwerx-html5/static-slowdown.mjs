// Default-off first static Child slowdown composition. No clock/model creation.
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate static Child slowdown with class1/5 ordinary and class1 orbital actors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','RotatingSpikes','RotatingSpikeTransfers'];
export function assertStaticSlowdownRecipe(o){
 if(o?.allowStaticSlowdown!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticSlowdown'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertStaticSlowdownActor(a){
 const human=a?.sourceSlot<2,type=a?.sourceActorType,group={0:700,6:4300,2:4400,3:4500,4:3500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.checksWalls||![1,5].includes(a.speedClass)||type===4&&a.speedClass!==1||typeof a.program!=='string'||!(type===4?/^[ns]+$/:/^[bfns]+$/).test(a.program)||!int(a.sourcePC,1,a.program.length))fail();return true;
}
export function assertStaticSlowdownSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP'].includes(b.kind))fail();seen.add(b.kind);}
 let slow=0,goal=0;
 for(const c of s.cells){
  if(!int(c.flagsRaw,0,65535)||!int(c.secondaryRaw,0,65535)||c.flagsRaw&~0x4027||c.inlineProgram)fail();
  if(!c.present)continue;
  const active=!!(c.secondaryRaw&1),effective=active?c.flagsRaw:c.flagsRaw&~0x26,color=dotColorOffset(c.secondaryRaw);
  if(effective&32){if((effective&6)||![0,2,6].includes(color))fail();slow++;}
  if(effective&4)goal++;
 }
 if(!slow||goal!==1||!rows('SP').length)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,2)||!int(w[3],0,2)||!((w[4]*65536+w[5])&1))fail();}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1),ps=rows('WP');if(actors.length<3||actors.length>31||!actors.some(a=>a.actorTypeRaw===4))fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=at(a.gridPosition?.row,a.gridPosition?.column),p=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||i<2&&(c.flagsRaw&0x26))fail();
  assertStaticSlowdownActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,2:4400,3:4500,4:3500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:p,sourcePC:w[6]});
 }
 return true;
}
