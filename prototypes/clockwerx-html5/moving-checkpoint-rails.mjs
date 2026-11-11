// Default-off Child join: ordinary moving bonuses/checkpoint, static EX/SPI
// and ordinary class1 b/n/s callbacks. No owned map, programs or artwork here.
import {effectiveMovingCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {validateConnectorBoard} from './sliding.mjs';
const fail=()=>{throw Error('Separate moving checkpoint/EX/SPI Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const group={0:700,6:4300,1:500,2:4400,3:4500};
const required=['allowMovingDots','allowSlidingConnectors','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowCombinedGoalBonus','allowInactiveSpikes'];
export function assertMovingCheckpointRailRecipe(o){
 if(o.allowMovingCheckpointRails!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingCheckpointRails'&&!required.includes(k))fail();return true;
}
export function assertMovingCheckpointRailActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||![0,1,2,3,6].includes(a.sourceActorType)||program!==a.program)fail();
 const human=[0,6].includes(a.sourceActorType);if(human!==(a.sourceSlot<2)||a.group!==group[a.sourceActorType]&&!(human&&a.sourceSlot===0&&a.group===4300))fail();
 if(human){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||a.checksWalls!==true||program!==null)fail();}
 else if(a.speedClass!==1||a.checksWalls!==false||program!==null&&(typeof program!=='string'||!/^[bns]+$/.test(program)||!int(a.sourcePC,1,program.length)))fail();return true;
}
export function assertMovingCheckpointRailSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const kinds=new Set();for(const b of s.blocks){if(kinds.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','WY','SP','EX','TX'].includes(b.kind))fail();kinds.add(b.kind);}
 const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 let movers=0,checkpoints=0,goals=0;
 for(const c of cells){const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask);if(![1,3,0x4001,0x4003,0x4005,0x4081,0x4083,0x4091].includes(e))fail();
  if(e&4)goals++;if(e&0x10)checkpoints++;
  if(e&0x80){if(typeof c.inlineProgram?.text!=='string'||!/^[nps]+$/.test(c.inlineProgram.text))fail();assertClosedMovingProgram(c.inlineProgram.text,{x:74+48*c.column,y:72+48*c.row});movers++;}else if(c.inlineProgram)fail();
 }
 if(goals!==1||!movers||!checkpoints)fail();
 const wy=new Set();for(const r of rows('WY')){const w=r.rawWords;if(w.length!==6)fail();if(!((w[4]*65536+w[5])&mask))continue;const c=at(w[0],w[1]);if(!c||wy.has(c)||effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)!==0x4091||!int(w[2],0,31)||![1,65535].includes(w[3]))fail();wy.add(c);}if(wy.size!==checkpoints)fail();
 if(!rows('EX').length||rows('EX').length>61)fail();for(const r of rows('EX')){const w=r.rawWords;if(w.length!==3||![0,256].includes(w[2]))fail();const a=at(w[0],w[1]),b=at(w[0]+(w[2]?1:0),w[1]+(w[2]?0:1));if(!a||!b||[a,b].some(c=>effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x9c))fail();}
 const spikes=rows('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask);if(!spikes.length||spikes.length>32||spikes.some(r=>r.rawWords.length!==6||r.rawWords.slice(0,4).some((n,i)=>!int(n,0,[7,10,3,3][i]))))fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(a.rawWords[4])||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)&0x9e))fail();assertMovingCheckpointRailActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:group[a.actorTypeRaw],speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});}
 return true;
}
export function assertMovingCheckpointRailBoard(b,{outlines,dotOutlines}={}){
 if(!b?.movingCheckpointRailRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','slidingConnectorRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['bombRules','goodieOnlyRules','freeBusterRules','gunTriggerProjectileRules','elevatorRules','teleportRules','canonicalOilRules','rotatingSpikeRules','markedTransferRules','staticEnemyWallRules'].some(k=>b[k])||['bombs','goodies','puddles','walls','doors','switches','elevators','teleports'].some(k=>b[k]?.length)||!b.spikes?.length)fail();
 for(const a of [b.player,...b.enemies])assertMovingCheckpointRailActor(a);
 for(const d of b.dots)if(!['static','moving-program'].includes(d.motion)||d.ring||d.protected||d.transferDeath||d.slowdown||d.upDown||d.teleport||d.motion==='moving-program'&&d.slideMask||d.waystation&&(d.motion!=='moving-program'||d.bonus||d.kind==='goal'))fail();
 if(!b.dots.some(d=>d.waystation))fail();validateConnectorBoard(b.connectors,b.dots);
 if(outlines)for(const g of new Set([700,4300,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of d.waystation?Array.from({length:11},(_,i)=>79+i):[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();return true;
}
