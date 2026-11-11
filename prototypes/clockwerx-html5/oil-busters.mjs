// Separate static Child Oil3/SPI join with fixed free busters and ordinary
// class1 wall-check programs. No level identity, owned map or artwork here.
import {assertFreeBusterActor} from './free-busters.mjs';
import {activePuddleSpecs} from './oil.mjs';
const fail=()=>{throw Error('Separate static Oil/buster/programmed-wall Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['allowFreeBusters','allowOil','allowCanonicalOil','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowInactiveSpikes','allowStaticEnemyWalls','allowProgrammedEnemyWalls'];
export function assertOilBusterRecipe(o){
 if(o.allowOilBusters!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowOilBusters'&&!required.includes(k))fail();
 return true;
}
export function assertOilBusterActor(a){
 if(!a||!int(a.sourceSlot,0,30)||a.sliding||a.movingPivot||![0,1,2,5,6].includes(a.sourceActorType))fail();
 const human=[0,6].includes(a.sourceActorType);if(human!==(a.sourceSlot<2))fail();
 if(human){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||a.program!==null||a.checksWalls!==true)fail();}
 else if(a.sourceActorType===5)assertFreeBusterActor(a);
 else if(a.speedClass!==1||!(a.sourceActorType===1&&a.program===null&&a.checksWalls===false||a.checksWalls===true&&typeof a.program==='string'&&/^[ns]+$/.test(a.program)&&int(a.sourcePC,1,a.program.length)))fail();
 return true;
}
export function assertOilBusterSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const kinds=new Set();for(const b of s.blocks){if(kinds.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','WL','SP','PU','TX'].includes(b.kind))fail();kinds.add(b.kind);}
 const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 if(cells.some(c=>![1,3,0x4001,0x4003,0x4005].includes(c.flagsRaw)||!(c.secondaryRaw&mask)||c.inlineProgram)||cells.filter(c=>c.flagsRaw&4).length!==1)fail();
 const oil=activePuddleSpecs(rows('PU'),mask);if(!oil.length||oil.some(p=>p.kind!==3))fail();
 const spikes=rows('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask);if(!spikes.length||spikes.length>32||spikes.some(r=>r.rawWords.length!==6||r.rawWords.slice(0,4).some((w,i)=>!int(w,0,[7,10,3,3][i]))))fail();
 if(!rows('WL').length)fail();const programs=rows('WP'),actors=rows('WA').filter(a=>a.activationMaskRaw&mask);let busters=0,wallPrograms=0;
 if(actors.length<4||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;
  if(!at(a.gridPosition?.row,a.gridPosition?.column)||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(a.rawWords[4]))fail();
  assertOilBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});
  if(a.actorTypeRaw===5)busters++;else if(i>=2&&program!==null)wallPrograms++;
 }
 if(!busters||!wallPrograms)fail();return true;
}
export function assertOilBusterBoard(b,{outlines,oilOutlines,dotOutlines}={}){
 if(!b?.oilBusterRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['freeBusterRules','canonicalOilRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','staticEnemyWallRules'].every(k=>b[k]===true)||['bombRules','goodieOnlyRules','gunTriggerProjectileRules','movingDotRules','slidingConnectorRules','elevatorRules','teleportRules','rotatingSpikeRules','canonicalOilSpikeRules'].some(k=>b[k])||['bombs','goodies','doors','switches','connectors','elevators','teleports'].some(k=>b[k]?.length)||!b.puddles?.length||b.puddles.some(p=>p.kind!==3)||!b.spikes?.length)fail();
 for(const a of [b.player,...b.enemies])assertOilBusterActor(a);
 if(b.dots.some(d=>d.motion!=='static'||d.slideMask||d.upDown||d.teleport||d.ring||d.protected||d.waystation||d.transferDeath||d.slowdown))fail();
 if(outlines)for(const g of new Set([700,4300,3900,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(oilOutlines&&(!oilOutlines.groups?.[1200]||!oilOutlines.groups?.[2200]))fail();
 if(dotOutlines&&!dotOutlines.groups?.[300])fail();return true;
}
