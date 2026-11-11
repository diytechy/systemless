// Default-off moving goal/bonus, static SP and ordinary class1/3 actors.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate moving goal and static spikes with ordinary class1/3 actors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertMovingGoalOrdinaryRecipe(o){
 if(o?.allowMovingGoalOrdinary!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingGoalOrdinary'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingGoalOrdinaryActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500,2:4400,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.checksWalls||![1,3].includes(a.speedClass)||a.speedClass===3&&(type!==1||a.program!==null)||a.program!==null&&(typeof a.program!=='string'||!/^[fns]+$/.test(a.program)||!int(a.sourcePC,1,a.program.length)))fail();return true;
}
export function assertMovingGoalOrdinarySource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let movers=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x4081,0x4083,0x4085].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;if(!(c.secondaryRaw&1)||dotColorOffset(c.secondaryRaw)>5)fail();
  if(c.flagsRaw&4){if(!(c.flagsRaw&128)||dotColorOffset(c.secondaryRaw)!==0)fail();goals++;}
  if(c.flagsRaw&128){movers++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}else if(c.inlineProgram)fail();
 }
 if(!movers||movers>16||goals!==1||!rows('SP').length)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,2)||!int(w[3],0,2)||w[4]!==0||w[5]!==15)fail();}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;
  if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||i<2&&c.flagsRaw!==1)fail();
  assertMovingGoalOrdinaryActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:w[6]});
 }
 return true;
}
