// Default-off masked moving rings, static protection/ring, EX/WL/SP and open blue doors.
import {assertClosedMovingProgram,movingProgramCell,effectiveMovingCell} from './moving-dots.mjs';
import {decodeDoorRecord,decodeSwitchRecord} from './doors.mjs';
import {connectorSpecs} from './sliding.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate moving masked rings, static protection, rails and open blue doors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','InactiveSpikes','InitiallyOpenDoors'];
export function assertMovingProtectedPassageRecipe(o){
 if(o?.allowMovingProtectedPassage!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingProtectedPassage'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingProtectedPassageActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500,2:4400,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||a.program!==null||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(a.checksWalls||![1,4].includes(a.speedClass)||a.speedClass===4&&type!==3)fail();return true;
}
export function assertMovingProtectedPassageSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let movers=0,goals=0,rings=0,protectedDots=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','DR','DS','EX'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x4005,0x4009,0x4041,0x4089].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw);if(![0,1,2,4].includes(dotColorOffset(c.secondaryRaw)))fail();if(e&4)goals++;if(e&8)rings++;if(e&64)protectedDots++;
  if(c.flagsRaw&128){if(c.secondaryRaw&1||e&0x6e)fail();movers++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}else if(c.inlineProgram)fail();
 }
 if(!movers||movers>16||goals!==1||rings!==1||protectedDots!==1||!rows('SP').length||!rows('WL').length)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||w[4]!==0||![12,15].includes(w[5]))fail();}
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 const doors=rows('DR').map(decodeDoorRecord),switches=rows('DS').map(decodeSwitchRecord);
 if(doors.length!==2||switches.length!==2||doors.some(d=>d.vertical||d.initiallyClosed||!d.long||d.color!==2||!int(d.row,0,7)||!int(d.column,0,9))||switches.some(d=>d.color!==2||![1,2].includes(d.subcell)||!int(d.row,0,7)||!int(d.column,0,10)))fail();
 const dots=s.cells.filter(c=>c.present).map(c=>({id:`${c.column},${c.row}`,row:c.row,column:c.column,motion:c.flagsRaw&128?'moving-program':'static'})),ex=connectorSpecs(rows('EX'),dots);if(!ex.length)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1);if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column];if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw)&~0x4000)!==0x41)fail();
  assertMovingProtectedPassageActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:null});
 }
 return true;
}
