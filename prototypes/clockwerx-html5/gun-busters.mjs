// Separate static Child join: shared gun/buster PR pool, BO and checkpoints.
// Moving/programmed busters and active Oil/SPI/EX remain outside this join.
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';
import {assertFreeBusterActor} from './free-busters.mjs';
const fail=()=>{throw Error('Separate static Child gun/buster/bomb/checkpoint composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const geometry={frameOrigin:{x:28,y:28},rawBounds:{left:0,top:0,right:584,bottom:424}};
export function gunBusterSource(s,origin,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||origin?.x!==74||origin?.y!==72)fail();
 const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];
 if(s.blocks.some(b=>b.count!==b.records.length||b.count&&!['WA','WP','TX','WL','GN','TR','WY','BO','GO','PU','SP'].includes(b.kind)))fail();
 if(rows('PU').some(r=>(r.rawWords[3]*65536+r.rawWords[4])&mask)||rows('SP').some(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask))fail();
 const cells=s.cells.filter(c=>c.present),programs=rows('WP');
 if(cells.some(c=>![1,3,0x4001,0x4011,0x4005].includes(c.flagsRaw)||!(c.secondaryRaw&mask)||c.inlineProgram)||cells.filter(c=>c.flagsRaw&4).length!==1)fail();
 const active=rows('WA').filter(a=>a.activationMaskRaw&mask);
 if(active.length<3||active.length>31||active[0].actorTypeRaw!==0||active[1].actorTypeRaw!==6||!active.some(a=>a.actorTypeRaw===5))fail();
 for(const [i,a]of active.entries()){
  const program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;
  assertFreeBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]},true);
  if(!int(a.initialFrameHalfIndexRaw,0,i<2?63:31)||![1,65535].includes(a.rawWords[4])||!cells.some(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column))fail();
 }
 for(const r of rows('WY')){const w=r.rawWords;if(w.length!==6)fail();if(!((w[4]*65536+w[5])&mask))continue;if(!int(w[2],0,31)||![1,65535].includes(w[3])||!cells.some(c=>c.row===w[0]&&c.column===w[1]&&c.flagsRaw===0x4011))fail();}
 if(rows('GO').some(r=>r.rawWords[2]!==169)||rows('GO').length>15||rows('BO').length>60)fail();
 const specs={gridOrigin:origin,frameOrigin:geometry.frameOrigin,activeMask:mask};
 const guns=activeGunTriggerSpecs(rows('GN'),{kind:'GN',...specs}),triggers=activeGunTriggerSpecs(rows('TR'),{kind:'TR',...specs});
 if(!guns.length||!triggers.length)fail();
 return {guns,triggers,...structuredClone(geometry)};
}
export function assertGunBusterBoard(b,{outlines,gunOutlines}={}){
 if(!b?.gunBusterRules||!b.freeBusterRules||!b.gunTriggerProjectileRules||b.activeMask!==1||b.difficulty!=='Child'||!b.bombRules||!b.bombObjectInteractionRules||!b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||!b.importedGoodie169Rules||['movingDotRules','slidingConnectorRules','teleportRules','elevatorRules','canonicalOilRules','rotatingSpikeRules','markedTransferRules'].some(k=>b[k])||['puddles','spikes','doors','switches','connectors','teleports','elevators'].some(k=>b[k]?.length))fail();
 for(const a of [b.player,...b.enemies])assertFreeBusterActor(a,true);
 if(b.dots.some(d=>d.motion!=='static'||d.slideMask||d.upDown||d.teleport||d.protected||d.ring||d.transferDeath||d.slowdown))fail();
 const c=b.gunTriggerChild;
 if(!c?.guns?.length||!c.triggers?.length||Object.keys(geometry.rawBounds).some(k=>c.rawBounds[k]!==geometry.rawBounds[k])||c.frameOrigin.x!==28||c.frameOrigin.y!==28)fail();
 if(outlines)for(let f=0;f<64;f++)if(!outlines.groups?.[3900]?.frames?.[f])fail();
 if(gunOutlines)assertGunTriggerOutlines(gunOutlines);
 return true;
}
