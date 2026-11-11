// Default-off Child join for ordinary movers, raised channel0 TYPE2/EL,
// static EX/WL/SP/BO and class1 free or n/s-programmed moving busters.
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {validateConnectorBoard} from './sliding.mjs';
import {validateBombWallTiles} from './walls.mjs';
import {decodeBombRecord,bombHitsStationarySpike} from './bombs.mjs';
import {decodeElevatorRecord} from './elevators.mjs';
const fail=()=>{throw Error('Separate moving programmed-buster/bomb/raised-elevator Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const groups={0:700,6:4300,1:500,2:4400,3:4500,5:3900};
const required=['allowFreeBusters','allowMovingDots','allowSlidingConnectors','allowBombs','allowBombObjectInteractions','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowCombinedGoalBonus','allowInactiveSpikes','allowElevators'];
export function assertMovingProgrammedBusterRecipe(o){
 if(o.allowMovingProgrammedBusters!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingProgrammedBusters'&&!required.includes(k))fail();return true;
}
export function assertMovingProgrammedBusterActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||![0,6,1,2,3,5].includes(a.sourceActorType)||program!==a.program||typeof a.checksWalls!=='boolean')fail();
 const human=a.sourceSlot<2;
 if(human?a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null:![1,2,3,5].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls||program!==null&&(typeof program!=='string'||!int(program.length,1,255)||!/^[ns]+$/.test(program)||!int(a.sourcePC,1,program.length)))fail();
 if(a.group!==groups[a.sourceActorType]&&!(a.sourceSlot===0&&a.sourceActorType===0&&a.group===4300))fail();return true;
}
export function assertMovingProgrammedBusterSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','BO','EX','EL'].includes(b.kind))fail();seen.add(b.kind);}
 let goals=0,movers=0,up=0;
 for(const c of cells){const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask);if(![1,3,5,0x4001,0x4003,0x4005,0x81,0x83,0x4081,0x4083,0x101].includes(e))fail();if(e&4)goals++;if(e===0x101)up++;
  if(e&0x80){assertClosedMovingProgram(movingProgramCell(c).text,{x:74+48*c.column,y:72+48*c.row});movers++;}else if(c.inlineProgram)fail();}
 if(goals!==1||!movers||!up||!rows('WL').length||!rows('SP').length||!rows('EX').length||rows('EX').length>61||!rows('BO').length||rows('BO').length>60)fail();
 for(const r of rows('EX')){const w=r.rawWords;if(w.length!==3||![0,256].includes(w[2]))fail();const a=at(w[0],w[1]),b=at(w[0]+(w[2]?1:0),w[1]+(w[2]?0:1));if(!a||!b||[a,b].some(c=>effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x3fe))fail();}
 const el=rows('EL').map(decodeElevatorRecord).filter(e=>e.activationMask&mask);if(!el.length||el.some(e=>e.group!==0||e.subcell!==3))fail();
 let matches=0;for(const r of rows('BO')){const b=decodeBombRecord(r);if(b.kind>=10&&(b.flags||++matches>5)||b.kind<4&&(b.row>6||b.column>9))fail();}if(!matches)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w.length!==6)fail();if((w[4]*65536+w[5])&mask){if((w[4]*65536+w[5])!==15)fail();bombHitsStationarySpike({row:w[0],column:w[1],subrow:w[2],subcolumn:w[3]},{row:w[0],column:w[1]});}}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');let busters=0,programmed=0;
 if(actors.length<4||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(a.rawWords[4])||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x39e))fail();assertMovingProgrammedBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});if(a.actorTypeRaw===5){busters++;if(program!==null)programmed++;}}
 if(!busters||!programmed)fail();return true;
}
export function assertMovingProgrammedBusterBoard(b,{outlines,dotOutlines,bombOutlines,elevatorOutlines}={}){
 if(!b?.movingProgrammedBusterRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['freeBusterRules','movingDotRules','slidingConnectorRules','elevatorRules','bombRules','bombObjectInteractionRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['gunTriggerProjectileRules','goodieOnlyRules','canonicalOilRules','teleportRules','rotatingSpikeRules','markedTransferRules','staticEnemyWallRules','movingElevatorRules','movingBusterBombRules','pilotAbsentSlideRecoveryRules'].some(k=>b[k])||['goodies','puddles','doors','switches','teleports'].some(k=>b[k]?.length))fail();
 for(const a of[b.player,...b.enemies])assertMovingProgrammedBusterActor(a);
 validateBombWallTiles(b.walls);validateConnectorBoard(b.connectors,b.dots);if(!b.walls.length||!b.spikes.length||!b.bombs.length||!b.connectors.length||!b.elevators?.length||b.elevators.some(e=>e.group!==0||e.subcell!==3)||!b.dots.some(d=>d.upDown))fail();
 for(const d of b.dots)if(!['static','moving-program','up-down'].includes(d.motion)||d.ring||d.protected||d.waystation||d.transferDeath||d.slowdown||d.teleport||d.upDown&&(d.upDown.group!==0||d.upDown.initialLowered||d.color!==0||d.kind!=='dot')||d.motion==='moving-program'&&(d.slideMask||d.upDown)||d.slideMask&&(d.motion!=='static'||d.kind!=='dot'||d.bonus))fail();
 if(outlines){for(const g of new Set([700,4300,3900,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();for(let f=0;f<4;f++)if(!outlines.groups?.[200]?.frames?.[f])fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color,92+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(bombOutlines)for(const[g,n]of[[1600,18],[1500,12],[1800,10]])for(let f=0;f<n;f++)if(!bombOutlines.groups?.[g]?.frames?.[f])fail();
 if(elevatorOutlines)for(const f of[0,3,4,9])if(!elevatorOutlines.groups?.[3400]?.frames?.[f])fail();return true;
}
