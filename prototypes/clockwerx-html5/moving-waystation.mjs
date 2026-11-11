// Default-off plain moving pivots/bonuses with a static WY checkpoint.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate Child moving pivots and static waystation with free class1/3 red actors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertMovingWaystationRecipe(o){
 if(o?.allowMovingWaystation!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingWaystation'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingWaystationActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||a.program!==null||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(type!==1||![1,3].includes(a.speedClass)||a.checksWalls)fail();return true;
}
export function assertMovingWaystationSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let movers=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','WY'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,129,131,16401].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;if(!(c.secondaryRaw&1)||![0,1].includes(dotColorOffset(c.secondaryRaw)))fail();
  if(c.flagsRaw&4)goals++;
  if(c.flagsRaw&128){movers++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}else if(c.inlineProgram)fail();
 }
 if(!movers||movers>32||goals!==1||rows('WY').length!==1)fail();
 const w=rows('WY')[0].rawWords,c=s.cells[w?.[0]*11+w?.[1]];
 if(w?.length!==6||!c?.present||c.flagsRaw!==0x4011||dotColorOffset(c.secondaryRaw)!==0||!int(w[2],0,63)||![1,65535].includes(w[3])||!((w[4]*65536+w[5])&1)||s.cells.filter(c=>c.present&&c.flagsRaw&16).length!==1)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1);if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column];
  if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||i<2&&c.flagsRaw!==1)fail();
  assertMovingWaystationActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:null});
 }
 return true;
}
