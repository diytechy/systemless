// Default-off Child join of fixed free busters, moving bonus dots, static
// connectors, marks/rings, bombs and stationary spikes. No owned data here.
import {assertFreeBusterActor} from './free-busters.mjs';
import {effectiveMovingCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeBombRecord,bombHitsStationarySpike} from './bombs.mjs';
import {validateConnectorBoard} from './sliding.mjs';
const fail=()=>{throw Error('Separate moving/EX/buster/BO/marked Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['allowFreeBusters','allowMovingDots','allowSlidingConnectors','allowBombs','allowBombObjectInteractions','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowInactiveSpikes','allowMarkedTransfers','allowCombinedGoalBonus','allowClass3Enemies'];
export function assertMovingBusterBombRecipe(o){
 if(o.allowMovingBusterBombs!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingBusterBombs'&&!required.includes(k))fail();
 return true;
}
export function assertMovingBusterBombActor(a){
 if(!a||!int(a.sourceSlot,0,30)||![0,1,2,5,6].includes(a.sourceActorType))fail();
 const human=[0,6].includes(a.sourceActorType);
 if(human!==(a.sourceSlot<2)||a.program!==null)fail();
 if(human){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||a.checksWalls!==true)fail();}
 else if(a.sourceActorType===5)assertFreeBusterActor(a);
 else if(![1,3].includes(a.speedClass)||a.checksWalls!==false)fail();
 return true;
}
export function assertMovingBusterBombSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const kinds=new Set();for(const b of s.blocks){if(kinds.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','WL','EX','BO','SP','PU'].includes(b.kind))fail();kinds.add(b.kind);}
 const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 if(rows('PU').some(r=>(r.rawWords[3]*65536+r.rawWords[4])&mask))fail();
 let goals=0,movers=0,marks=0,rings=0;
 for(const c of cells){
  const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask);
  if(![1,3,9,0x4001,0x4003,0x4005,0x6001,0x4083].includes(e))fail();
  if(e&4)goals++;if(e&8)rings++;if(e&0x2000)marks++;
  if(e&0x80){if(typeof c.inlineProgram?.text!=='string'||!/^[pnswe]+$/.test(c.inlineProgram.text))fail();assertClosedMovingProgram(c.inlineProgram.text,{x:74+48*c.column,y:72+48*c.row});movers++;}
  else if(c.inlineProgram)fail();
 }
 if(goals!==1||!movers||!rings)fail();
 const endpoints=new Set();for(const r of rows('EX')){const w=r.rawWords;if(w.length!==3||![0,256].includes(w[2]))fail();const a=at(w[0],w[1]),b=at(w[0]+(w[2]?1:0),w[1]+(w[2]?0:1));if(!a||!b||[a,b].some(c=>c.flagsRaw&0x20dc))fail();endpoints.add(`${w[1]},${w[0]}`);endpoints.add(`${w[1]+(w[2]?0:1)},${w[0]+(w[2]?1:0)}`);}
 if(!rows('EX').length||rows('EX').length>61||!rows('BO').length||rows('BO').length>60)fail();
 let matches=0;for(const r of rows('BO')){const b=decodeBombRecord(r);if(b.kind>=10&&(b.flags||++matches>5)||b.kind<4&&(b.row>6||b.column>9))fail();}if(!matches)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w.length!==6)fail();if((w[4]*65536+w[5])&mask)bombHitsStationarySpike({row:w[0],column:w[1],subrow:w[2],subcolumn:w[3]},{row:w[0],column:w[1]});}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask);let busters=0,ordinary=0;
 if(actors.length<4||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const c=at(a.gridPosition?.row,a.gridPosition?.column);if(!c||a.programReferenceRaw!==-1||!int(a.initialFrameHalfIndexRaw,0,i<2?63:31)||![1,65535].includes(a.rawWords[4]))fail();
  assertMovingBusterBombActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program:null});
  if(i<2&&c.flagsRaw&0x209e)fail();
  if(a.actorTypeRaw===5){if(c.flagsRaw&0x380||endpoints.has(`${c.column},${c.row}`))fail();busters++;}else if(i>=2)ordinary++;
 }
 if(!busters||!ordinary)fail();return true;
}
export function assertMovingBusterBombBoard(b,{outlines,dotOutlines,bombOutlines}={}){
 if(!b?.movingBusterBombRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['freeBusterRules','movingDotRules','slidingConnectorRules','bombRules','bombObjectInteractionRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','markedTransferRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['gunTriggerProjectileRules','movingBombRules','goodieOnlyRules','canonicalOilRules','teleportRules','elevatorRules','rotatingSpikeRules'].some(k=>b[k])||['puddles','goodies','doors','switches','elevators','teleports'].some(k=>b[k]?.length))fail();
 for(const a of [b.player,...b.enemies])assertMovingBusterBombActor(a);
 for(const d of b.dots){if(!['static','moving-program'].includes(d.motion)||d.upDown||d.teleport||d.protected||d.waystation||d.slowdown||d.motion==='moving-program'&&(d.ring||d.transferDeath||d.slideMask)||d.ring&&(d.transferDeath||d.slideMask)||d.transferDeath&&d.slideMask)fail();}
 validateConnectorBoard(b.connectors,b.dots);
 if(outlines)for(const g of new Set([700,4300,3900,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of [d.transferDeath?108+d.color:9+d.color,1+d.color,92+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(bombOutlines)for(const[g,n]of[[1600,18],[1500,12],[1800,10]])for(let f=0;f<n;f++)if(!bombOutlines.groups?.[g]?.frames?.[f])fail();
 return true;
}
