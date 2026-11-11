// Default-off static Slow/WL/SP with free ordinary class4 clocks.
// Masked PU records remain inactive; no Oil runtime is admitted.
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate static Child slowdown with walls and free class4 red/blue actors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertSlowdownClass4Recipe(o){
 if(o?.allowSlowdownClass4!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowSlowdownClass4'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertSlowdownClass4Actor(a){
 const human=a?.sourceSlot<2,type=a?.sourceActorType,group={0:700,6:4300,1:500,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||a.program!==null||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(![1,3].includes(type)||a.speedClass!==4||a.checksWalls)fail();return true;
}
export function assertSlowdownClass4Source(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let slow=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','PU'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x4003,0x4005,0x4021].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;const e=c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x26;if(e&32){if(![0,1,4].includes(dotColorOffset(c.secondaryRaw)))fail();slow++;}if(e&4)goals++;
 }
 if(!slow||goals!==1||!rows('SP').length||!rows('WL').length)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,2)||!int(w[3],0,2)||w[4]!==0||w[5]!==15)fail();}
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 for(const r of rows('PU')){const w=r.rawWords;if(w?.length!==5||!int(w[0],0,7)||!int(w[1],0,10)||![0,1].includes(w[2])||!int(w[3],0,65535)||!int(w[4],0,65535)||(w[3]*65536+w[4])&1)fail();}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1);if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column];if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||i<2&&(c.flagsRaw&0x26))fail();
  assertSlowdownClass4Actor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,3:4500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:null});
 }
 return true;
}
