// Default-off static Slow/WL/WY with programmed ordinary class1/2/5 clocks.
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate static slowdown wall and waystation with ordinary class1/2/5 programs required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertSlowdownWaystationRecipe(o){
 if(o?.allowSlowdownWaystation!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowSlowdownWaystation'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertSlowdownWaystationActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500,2:4400,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.checksWalls||a.speedClass!=={1:5,2:1,3:2}[type]||typeof a.program!=='string'||!(type===1?/^[bns]+$/:/^[ns]+$/).test(a.program)||!int(a.sourcePC,1,a.program.length))fail();return true;
}
export function assertSlowdownWaystationSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let slow=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','WL','WY'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,33,0x4011,0x4021].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;const e=c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x26;if(e&32){if(![0,1,2].includes(dotColorOffset(c.secondaryRaw)))fail();slow++;}if(e&4)goals++;
 }
 if(!slow||goals!==1||!rows('WL').length||rows('WY').length!==1)fail();
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 const w=rows('WY')[0].rawWords,c=s.cells[w?.[0]*11+w?.[1]];
 if(w?.length!==6||!c?.present||c.flagsRaw!==0x4011||dotColorOffset(c.secondaryRaw)!==0||!int(w[2],0,63)||![1,65535].includes(w[3])||!((w[4]*65536+w[5])&1)||s.cells.filter(c=>c.present&&c.flagsRaw&16).length!==1)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const x=a.rawWords,d=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;
  if(!d?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(x[4])||i<2&&d.flagsRaw!==1)fail();
  assertSlowdownWaystationActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[a.actorTypeRaw],speedClass:x[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:x[6]});
 }
 return true;
}
