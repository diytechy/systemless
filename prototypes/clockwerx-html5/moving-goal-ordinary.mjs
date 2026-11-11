// Default-off moving goal/bonus, static SP and ordinary class1/3 actors.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {spikeGridPoint} from './hazards.mjs';
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
export function assertMovingGoalOrdinaryBoard(b,{outlines,dotOutlines,initial=true,actors=[b?.player,...(b?.enemies??[])]}={}){
 if(b?.movingGoalOrdinaryRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules'].every(k=>b[k]===true)||['slidingConnectorRules','teleportRules','bombRules','goodieOnlyRules','canonicalOilRules','elevatorRules','markedTransferRules','staticEnemyWallRules','rotatingSpikeRules','staticSlowdownRules','movingWaystationRules'].some(k=>b[k]))fail();
 for(const k of['walls','doors','switches','puddles','bombs','goodies','connectors','elevators','teleports','guns','triggers'])if(b[k]?.length)fail();
 const s=b.movingGoalOrdinarySource;assertMovingGoalOrdinarySource(s);const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),raw=rows('WA'),active=raw.filter(a=>a.activationMaskRaw&1),programs=rows('WP');
 if(b.dots?.length!==cells.length||initial&&actors.length!==active.length-1||b.spikes?.length!==rows('SP').length)fail();
 for(const[i,d]of b.dots.entries()){
  const c=cells[i],e=c.flagsRaw,moving=!!(e&128),bonus=!!(e&2);
  if(d.id!==`${c.column},${c.row}`||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||!Number.isInteger(d.x)||!Number.isInteger(d.y)||(initial||!moving)&&(d.x!==74+c.column*48||d.y!==72+c.row*48)||d.motion!==(moving?'moving-program':'static')||d.sourceInitialPosition?.x!==74+c.column*48||d.sourceInitialPosition?.y!==72+c.row*48||d.color!==dotColorOffset(c.secondaryRaw)||d.ring||d.protected||d.teleport||d.slideMask||d.upDown||d.transferDeath||d.burnt||d.slowdown||d.waystation||d.sourceInitialBonus!==bonus||d.cell!==(initial||d.bonus?e:e&~2)||d.bonus!==!!(d.cell&2)||d.kind!==(e&4?'goal':d.bonus?'bonus':'dot')||d.movingProgram!==(moving?c.inlineProgram.text:undefined))fail();
 }
 for(const[i,sp]of b.spikes.entries()){const r=rows('SP')[i],p=spikeGridPoint(r,b.origin);if(sp.id!==i||sp.row!==r.rawWords[0]||sp.column!==r.rawWords[1]||sp.subrow!==r.rawWords[2]||sp.subcolumn!==r.rawWords[3]||sp.x!==p.x||sp.y!==p.y||sp.activationMask!==15)fail();}
 const slots=new Set();for(const a of actors){
  assertMovingGoalOrdinaryActor(a);const r=active[a.sourceSlot],program=r?.programReferenceRaw<0?null:programs[r?.programReferenceRaw]?.text;
  if(!r||a.sourceSlot===1||slots.has(a.sourceSlot)||a.sourceRawRecord!==raw.indexOf(r)||a.sourceActorType!==r.actorTypeRaw||a.speedClass!==r.rawWords[7]||a.program!==program||initial&&program!==null&&a.sourcePC!==r.rawWords[6]||!b.dots.some(d=>d.id===a.pivot)||initial&&a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`)fail();slots.add(a.sourceSlot);
 }
 if(outlines)for(const g of[700,4300,500,4400,4500,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!Array.isArray(dotOutlines.groups?.[300]?.frames?.[f]?.rows))fail();return true;
}
