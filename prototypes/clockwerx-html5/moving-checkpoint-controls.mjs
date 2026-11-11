// Default-off Child join: ordinary movers, static WY/WL, and an initially
// lowered channel1 TYPE2 controlled by channel1 EL. No EX, Oil or projectiles.
import {effectiveMovingCell,assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {decodeElevatorRecord} from './elevators.mjs';
import {validateBombWallTiles} from './walls.mjs';
const fail=()=>{throw Error('Separate moving checkpoint/wall/lowered-control Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const groups={0:700,6:4300,1:500,2:4400,3:4500};
const required=['allowMovingDots','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowCombinedGoalBonus','allowElevators','allowInactiveSpikes','allowStaticEnemyWalls','allowProgrammedEnemyWalls'];
export function assertMovingCheckpointControlRecipe(o){
 if(o.allowMovingCheckpointControls!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingCheckpointControls'&&!required.includes(k))fail();return true;
}
export function assertMovingCheckpointControlActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||![0,6,1,2,3].includes(a.sourceActorType)||program!==a.program||typeof a.checksWalls!=='boolean')fail();
 const human=a.sourceSlot<2;
 if(human?a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null:a.speedClass!==1||![1,2,3].includes(a.sourceActorType)||program!==null&&(typeof program!=='string'||!/^[ns]+$/.test(program)||!int(a.sourcePC,1,program.length))||a.checksWalls&&(a.sourceActorType!==2||program===null))fail();
 if(a.group!==groups[a.sourceActorType]&&!(a.sourceSlot===0&&a.sourceActorType===0&&a.group===4300))fail();return true;
}
export function assertMovingCheckpointControlSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length)fail();seen.add(b.kind);if(!b.count||['WA','WP','WY','WL','EL','TX'].includes(b.kind))continue;
  const n=b.kind==='SP'?6:b.kind==='PU'?5:0;if(!n||b.records.some(r=>r.rawWords?.length!==n||((r.rawWords[n-2]*65536+r.rawWords[n-1])&mask)))fail();}
 let movers=0,up=0,goal=0,wy=0;
 for(const c of cells){const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask);if(![1,3,0x4001,0x4003,0x4005,0x4011,0x4081,0x4201].includes(e))fail();if(e&4)goal++;if(e&0x10)wy++;
  if(e&0x80){assertClosedMovingProgram(movingProgramCell(c).text,{x:74+48*c.column,y:72+48*c.row});movers++;}else if(c.inlineProgram)fail();if(e===0x4201)up++;}
 if(!movers||!up||!wy||goal!==1||!rows('WL').length)fail();
 const matched=new Set();for(const r of rows('WY')){const w=r.rawWords;if(w.length!==6)fail();if(!((w[4]*65536+w[5])&mask))continue;const c=at(w[0],w[1]);if(!c||matched.has(c)||effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)!==0x4011||!int(w[2],0,31)||![1,65535].includes(w[3]))fail();matched.add(c);}if(matched.size!==wy)fail();
 const el=rows('EL').map(decodeElevatorRecord).filter(e=>e.activationMask&mask);if(!el.length||el.some(e=>e.group!==1||e.subcell!==3))fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(a.rawWords[4])||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x39e))fail();assertMovingCheckpointControlActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});}
 return true;
}
export function assertMovingCheckpointControlBoard(b,{outlines,dotOutlines,elevatorOutlines}={}){
 if(!b?.movingCheckpointControlRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules','elevatorRules','staticEnemyWallRules'].every(k=>b[k]===true)||['slidingConnectorRules','bombRules','freeBusterRules','goodieOnlyRules','canonicalOilRules','teleportRules','movingElevatorRules','markedTransferRules','rotatingSpikeRules'].some(k=>b[k])||['spikes','bombs','goodies','puddles','doors','switches','connectors','teleports'].some(k=>b[k]?.length))fail();
 for(const a of[b.player,...b.enemies])assertMovingCheckpointControlActor(a);
 validateBombWallTiles(b.walls);if(!b.walls.length||!b.elevators?.length||b.elevators.some(e=>e.group!==1||e.subcell!==3)||!b.dots.some(d=>d.upDown))fail();
 for(const d of b.dots)if(!['static','moving-program','up-down'].includes(d.motion)||d.ring||d.protected||d.transferDeath||d.slowdown||d.teleport||d.slideMask||d.waystation&&d.motion!=='static'||d.upDown&&(d.upDown.group!==1||!d.upDown.initialLowered||d.color!==0||d.kind!=='dot')||d.motion==='moving-program'&&(d.kind!=='dot'||d.upDown))fail();
 if(outlines){for(const g of new Set([700,4300,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of d.waystation?Array.from({length:11},(_,i)=>79+i):[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(elevatorOutlines)for(const f of[1,5,6])if(!elevatorOutlines.groups?.[3400]?.frames?.[f])fail();return true;
}
