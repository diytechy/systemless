import {assertClosedMovingProgram,movingProgramCell,effectiveMovingCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';

const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const variants=new Set(['checkpoint-rings','marked-bonuses']);
const variant=v=>{if(!variants.has(v))throw new Error('Explicit moving special composition required');return v;};

export function assertMovingSpecialSource(level,{composition,allowInactiveSpikes=false,allowOil=false}={}){
 variant(composition);const checkpoint=composition==='checkpoint-rings',records=k=>level.blocks?.find(b=>b.kind===k)?.records||[];
 if(level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8)throw new Error('Complete version12 large Child moving special source required');
 for(const b of level.blocks||[])if(b.count&&!['WA','WP','TX','SP',...(checkpoint?['WY']:['PU'])].includes(b.kind))throw new Error('Unqualified moving special raw section '+b.kind);
 if(records('SP').some(r=>r.rawWords?.length!==6||!allowInactiveSpikes||((r.rawWords[4]*65536+r.rawWords[5])&1)))throw new Error('Only source Child-inactive SP records are qualified');
 if(records('PU').some(r=>!allowOil||r.rawWords?.length!==5||((r.rawWords[3]*65536+r.rawWords[4])&1)))throw new Error('Only source Child-inactive PU records are qualified');
 const programs=records('WP').map(r=>r.text),actors=records('WA').filter(a=>a.activationMaskRaw&1);
 if(actors.length<2||actors.length>31||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||!checkpoint&&programs.length)throw new Error('Explicit two-human source layout and matching NPC program scope required');
 for(const [i,a]of actors.entries()){
  const human=i<2,program=a.programReferenceRaw>=0?programs[a.programReferenceRaw]:null,speed=a.rawWords?.[7],d=level.cells?.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column);
  if(!d?.present||!human&&actorChecksWalls(a.version12ByteRaw??1)||(human?![0,6].includes(a.actorTypeRaw)||speed!==0||program!==null:![1,2,3].includes(a.actorTypeRaw)||!(speed===1||checkpoint&&speed===2&&a.actorTypeRaw===1&&program===null)||program!==null&&(!checkpoint||speed!==1||typeof program!=='string'||!/^[ns]+$/.test(program)||!integer(a.rawWords?.[6],1,program.length))))throw new Error('Qualified moving special source actor types, clocks and programs required');
 }
 for(const c of level.cells||[]){
  if(!c.present)continue;const allowed=checkpoint?0x40df:0x6087,effective=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1);
  if((c.flagsRaw&~allowed)||!(c.flagsRaw&1)||(effective&0x80)&&(effective&(0x2000|0x40|0x10|0x8|0x4))||!(effective&0x80)&&(effective&2)||effective&4&&dotColorOffset(c.secondaryRaw)!==0)throw new Error('Separate static specials/goal and ordinary bonus movers required');
  if(c.flagsRaw&0x80){movingProgramCell(c);assertClosedMovingProgram(c.inlineProgram.text,{x:74+48*c.column,y:72+48*c.row});}
 }
 return true;
}

function sourceEnvelope(activeMask,sourceGrid){
 if(activeMask!==1||sourceGrid?.version!==12||sourceGrid.displaySizeRaw!==8||sourceGrid.rows!==8||sourceGrid.columns!==11)throw new Error('Immutable Child1/version12/display8/8x11 source envelope required');
}
function retainedProgram(program,source){
 if(source===undefined)return;
 const padding=(1+program.length)%2,encoded=program.length.toString(16).padStart(2,'0')+[...program].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
 if(!source||!integer(source.offset,4,0x7fffffff)||typeof source.rawHex!=='string'||typeof source.paddingHex!=='string'||source.paddingHex.length!==2*padding||padding&&!/^[0-9a-f]{2}$/.test(source.paddingHex)||source.rawHex!==encoded+source.paddingHex||source.text!==undefined&&source.text!==program)throw new Error('Retained moving Pascal bytes/text/padding must match live closed program');
}

// Sibling compositions reuse the ordinary DO and WA primitives. They do not
// widen the earlier moving-goal, moving-BO or moving/TYPE2/EX admissions.
export function assertMovingSpecialDots(dots,{composition,origin={x:74,y:72},activeMask,sourceGrid,initial=false}={}){
 variant(composition);sourceEnvelope(activeMask,sourceGrid);const checkpoint=composition==='checkpoint-rings';
 if(origin?.x!==74||origin?.y!==72||!Array.isArray(dots)||!dots.length||dots.length>88)throw new Error('Large source grid and explicit moving special dots required');
 let last=-1,goals=0,movers=0,bonusMovers=0,rings=0,waypoints=0,marks=0;const ids=new Set();
 for(const d of dots){
  const moving=d.motion==='moving-program',allowed=checkpoint?0x40df:0x6087;
  if(!integer(d.sourceIndex,0,87)||d.sourceIndex<=last||d.sourceIndex!==d.row*11+d.column||!integer(d.row,0,7)||!integer(d.column,0,10)||d.id===undefined||ids.has(d.id)||!integer(d.cell,0,65535)||(d.cell&~allowed)||!(d.cell&1)||d.present!==true||!integer(d.flags,0,65535)||d.color!==dotColorOffset(d.flags)||![0,1,2,4].includes(d.color)||!Number.isInteger(d.x)||!Number.isInteger(d.y)||d.sourceInitialPosition?.x!==origin.x+48*d.column||d.sourceInitialPosition?.y!==origin.y+48*d.row||((initial||!moving)&&(d.x!==d.sourceInitialPosition.x||d.y!==d.sourceInitialPosition.y))||!['static','moving-program'].includes(d.motion)||d.motionType!==(moving?1:0)||!!(d.cell&0x80)!==moving||['bonus','protected','sourceInBackground','sourceCollidable','sourceInitialBonus','sourceHasSprite','humanCanGrab','nonhumanCanGrab','ring','transferDeath'].some(k=>typeof d[k]!=='boolean')||!!(d.cell&2)!==d.bonus||!!(d.cell&8)!==d.ring||!!(d.cell&0x40)!==d.protected||!!(d.cell&0x2000)!==d.transferDeath||!!(d.cell&0x10)!==!!d.waystation||!['dot','bonus','goal'].includes(d.kind)||!!(d.cell&4)!==(d.kind==='goal')||d.kind==='bonus'&&!d.bonus||d.kind==='dot'&&d.bonus||d.teleport!==false||d.slideMask!==0||d.upDown||d.slowdown||d.connector||d.sourceBombDynamic||d.burnt||initial&&(d.collected||d.sourceInitialBonus!==d.bonus||!d.sourceCollidable||!d.humanCanGrab||!d.nonhumanCanGrab))throw new Error('Qualified moving special source dot declarations required');
  if(d.cell!==effectiveMovingCell(d.cell,d.flags,1)||!(d.flags&1)&&d.sourceInitialBonus||d.bonus&&!d.sourceInitialBonus)throw new Error('Child-effective properties and immutable bonus lifetime required');
  if(!d.ring&&(!d.humanCanGrab||!d.nonhumanCanGrab||!d.sourceCollidable))throw new Error('Only static rings may change availability in this composition');
  const foreground=moving||d.sourceInitialBonus||d.kind==='goal'||d.ring||!!d.waystation;
  if(d.sourceInBackground===foreground||d.sourceHasSprite!==foreground)throw new Error('Immutable source optimized/foreground identity required');
  if(moving){movers++;if(d.transferDeath||d.ring||d.protected||d.waystation||d.kind==='goal'||typeof d.movingProgram!=='string')throw new Error('Only ordinary or bonus movers are qualified');assertClosedMovingProgram(d.movingProgram,d.sourceInitialPosition);retainedProgram(d.movingProgram,d.sourceMovingProgram);if(d.sourceInitialBonus)bonusMovers++;}
  else if(d.movingProgram||d.sourceMovingProgram!==undefined||d.sourceInitialBonus)throw new Error('Static bonuses and static moving-program declarations are outside this composition');
  if(d.kind==='goal'){goals++;if(moving||d.color!==0||d.bonus||d.transferDeath||d.ring||d.protected||d.waystation)throw new Error('Separate static white unbonused goal required');}
  if(d.ring){rings++;if(!checkpoint||moving||d.color!==0||d.bonus||d.protected||d.waystation||d.transferDeath||d.kind!=='dot')throw new Error('Separate static white rings required');}
  if(d.waystation){waypoints++;if(!checkpoint||moving||d.color!==0||d.bonus||!d.protected||d.ring||d.transferDeath||d.kind!=='dot'||!integer(d.waystation.halfIndex,0,31)||![-1,1].includes(d.waystation.direction))throw new Error('Static protected white checkpoint required');}
  if(d.protected&&!d.waystation)throw new Error('Protection is qualified only on the static checkpoint');
  if(d.transferDeath){marks++;if(checkpoint||moving||d.color!==0||d.bonus||d.ring||d.protected||d.waystation||d.kind!=='dot')throw new Error('Separate static white unbonused marks required');}
  last=d.sourceIndex;ids.add(d.id);
 }
 if(goals!==1||!movers||!bonusMovers||(checkpoint?(!rings||waypoints!==1||marks):(rings||waypoints||!marks)))throw new Error('Explicit static goal, bonus movers and matching special inventory required');
 return true;
}

export function assertMovingSpecialActor(a,{composition,dots,program=a?.program,initial=false}={}){
 variant(composition);const human=[0,6].includes(a?.sourceActorType),d=dots?.find(d=>d.id===a?.pivot),checkpoint=composition==='checkpoint-rings';
 const expectedGroup={1:500,2:4400,3:4500,6:4300}[a?.sourceActorType],validGroup=a?.sourceActorType===0?[700,4300].includes(a.group):a?.group===expectedGroup;
 if(!a||!d||!integer(a.sourceSlot,0,30)||human!==(a.sourceSlot<2)||a.sourceSlot<2&&a.sourceActorType!==[0,6][a.sourceSlot]||!validGroup||initial&&!Number.isFinite(a.angle)||!human&&(a.canonicalFrame!==true||!integer(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||(a.unwrappedFrame&63)!==a.frame)||![-1,1].includes(a.direction)||typeof a.checksWalls!=='boolean'||!human&&a.checksWalls!==false||(human?a.speedClass!==0||program!==null:![1,2,3].includes(a.sourceActorType)||!([1,2].includes(a.speedClass)&&checkpoint||a.speedClass===1)||a.speedClass===2&&(a.sourceActorType!==1||program!==null||d.motion!=='static')||program!==null&&(!checkpoint||a.speedClass!==1||typeof program!=='string'||!program.length||program.length>255||!/^[ns]+$/.test(program)||!integer(a.sourcePC,1,program.length)))||initial&&(d.ring||d.waystation||d.protected||d.transferDeath||d.kind==='goal'||human&&(d.motion!=='static'||d.bonus)))throw new Error('Moving special class0 humans/class1 riders and separately free class2 RED actors required');
 return true;
}

export function assertMovingSpecialScope({composition,origin,activeMask,sourceGrid,dots=[],actors=[],humanStarts,initial=false,activeSections={},...inventory}={}){
 variant(composition);sourceEnvelope(activeMask,sourceGrid);if(inventory.difficulty!=='Child')throw new Error('Explicit Child difficulty required');assertMovingSpecialDots(dots,{composition,origin,activeMask,sourceGrid,initial});
 for(const k of ['movingBombRules','movingMarkedGoalRules','movingElevatorRules','pilotAbsentSlideRecoveryRules','bombRules','goodieOnlyRules','slidingConnectorRules','slidingBombRules','slidingBombCheckpointRules','slidingTeleportRules','staticSlidingProgramRules','slidingGoodieRules','slidingGoodieProgramRules','slidingOilRules','slidingOilGoodieRingRules','elevatorRules','teleportRules','canonicalOilRules','bombOilElevatorRules','elevatorGoodieRules','coloredElevatorGoodieRules','elevatorOilSpikeRules','canonicalOilSpikeRules','rotatingSpikeRules','staticEnemyWallRules'])if(inventory[k])throw new Error('Separate moving special composition excludes '+k);
 for(const k of ['guns','triggers'])if(inventory[k]!==undefined&&(!Array.isArray(inventory[k])||inventory[k].length))throw new Error('Unqualified moving special '+k+' inventory');
 for(const k of ['spikes','bombs','goodies','connectors','walls','doors','switches','puddles','elevators','teleports'])if(!Array.isArray(inventory[k])||inventory[k].length)throw new Error('Moving special composition requires actual empty '+k+' inventory');
 for(const[k,n]of Object.entries(activeSections))if(!integer(n,0,0x7fffffff)||n&&!['WA','WP','TX',...(composition==='checkpoint-rings'?['WY']:[])].includes(k))throw new Error('Unqualified active moving special section '+k);
 let previous=-1;if(!Array.isArray(actors)||!actors.length)throw new Error('Explicit moving special actors required');
 for(const a of actors){assertMovingSpecialActor(a,{composition,dots,initial});if(a.sourceSlot<=previous)throw new Error('Ascending source actor slots required');previous=a.sourceSlot;}
 if(initial&&(!Array.isArray(humanStarts)||humanStarts.length!==2||humanStarts[0]!==actors[0].pivot||humanStarts[1]!==humanStarts[0]||humanStarts.some(id=>{const d=dots.find(d=>d.id===id);return !d||d.motion!=='static'||d.kind!=='dot'||d.bonus||d.transferDeath||d.ring||d.protected||d.waystation;})))throw new Error('Both human specifications require the same ordinary static start');
 return true;
}
