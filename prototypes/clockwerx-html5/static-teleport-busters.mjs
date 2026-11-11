// Default-off static Child HY/BO/WY/WL/SP join. No owned maps or programs.
import {activeTeleportSpecs,pairTeleportSpecs} from './teleports.mjs';
import {decodeBombRecord,BOMB_LIMITS} from './bombs.mjs';
import {effectiveMovingCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {validateBombWallTiles} from './walls.mjs';
const fail=()=>{throw Error('Separate static teleport/bomb/checkpoint/free-or-bounce buster Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['FreeBusters','Teleports','Bombs','BombObjectInteractions','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'];
export function assertStaticTeleportBusterRecipe(o){
 if(o?.allowStaticTeleportBusters!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticTeleportBusters'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertStaticTeleportBusterActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||program!==a.program||a.movingPivot||a.sliding||typeof a.checksWalls!=='boolean')fail();
 const human=a.sourceSlot<2,type=a.sourceActorType,group={0:700,6:4300,2:4400,3:4500,5:3900}[type];
 if(!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300))fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else if(![2,3,5].includes(type)||a.speedClass!==1||a.checksWalls||program!==null&&(typeof program!=='string'||!(type===5?/^[bn]+$/:/^[bfns]+$/).test(program)||!int(a.sourcePC,1,program.length)))fail();return true;
}
export function assertStaticTeleportBusterSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','HY','BO','WY'].includes(b.kind))fail();seen.add(b.kind);}
 if(!rows('WL').length||!rows('HY').length||rows('HY').length>22||cells.some(c=>c.inlineProgram||!int(c.secondaryRaw,0,65535)||![1,3,5,0x4001,0x4003,0x4005,0x4011].includes(c.flagsRaw))||cells.filter(c=>effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&4).length!==1)fail();
 const dots=cells.map(c=>({id:c.column+','+c.row,row:c.row,column:c.column,x:74+c.column*48,y:72+c.row*48,present:true}));pairTeleportSpecs(activeTeleportSpecs(rows('HY'),mask),dots);
 let wy=0;for(const r of rows('WY')){const w=r.rawWords;if(w.length!==6)fail();if(!(w[4]*65536+w[5]&mask))continue;const c=at(w[0],w[1]);if(!c||effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)!==0x4011||dotColorOffset(c.secondaryRaw)!==0||!int(w[2],0,31)||![1,65535].includes(w[3]))fail();wy++;}
 if(!wy||cells.filter(c=>effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&16).length!==wy)fail();
 const bombs=rows('BO').map(decodeBombRecord);if(!bombs.length||bombs.length>BOMB_LIMITS.fuses||!bombs.some(b=>b.kind>=10)||!bombs.some(b=>b.kind<4)||bombs.some(b=>b.flags!==0||b.kind<4&&(b.row>6||b.column>9)))fail();
 const spikes=rows('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask);if(spikes.some(r=>r.rawWords.length!==6||r.rawWords[4]!==0||r.rawWords[5]!==15))fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');let free=0,bounce=0;
 if(actors.length<4||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const w=a.rawWords,c=at(a.gridPosition?.row,a.gridPosition?.column),p=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x3fe))fail();assertStaticTeleportBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,2:4400,3:4500,5:3900}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:p,sourcePC:w[6]});if(a.actorTypeRaw===5){if(p===null)free++;else bounce++;}}
 if(!free||!bounce)fail();return true;
}
export function assertStaticTeleportBusterBoard(b,{outlines,dotOutlines}={}){
 if(!b?.staticTeleportBusterRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['freeBusterRules','teleportRules','bombRules','bombObjectInteractionRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['movingDotRules','slidingConnectorRules','goodieOnlyRules','canonicalOilRules','rotatingSpikeRules','markedTransferRules','staticEnemyWallRules','elevatorRules','gunTriggerProjectileRules'].some(k=>b[k])||['connectors','goodies','puddles','doors','switches','elevators','guns','triggers'].some(k=>b[k]?.length))fail();
 for(const a of[b.player,...b.enemies])assertStaticTeleportBusterActor(a);
 validateBombWallTiles(b.walls.map(w=>w.frame===4&&w.visible===false?{...w,frame:5}:w));if(!b.walls.length||!b.bombs.length||!b.teleports.length||!b.dots.some(d=>d.waystation))fail();
 for(const d of b.dots)if(d.motion!=='static'||d.upDown||d.movingProgram||d.slideMask||d.ring||d.protected||d.transferDeath||d.slowdown||d.waystation&&d.color!==0)fail();
 if(outlines){for(const g of new Set([700,4300,3900,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();for(let f=0;f<4;f++)if(!outlines.groups?.[200]?.frames?.[f])fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color,92+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();return true;
}
