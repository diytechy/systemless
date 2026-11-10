// Separate ordinary TYPE1 / channel0 TYPE2 / static EX-WL-EL composition.
// No ordinal, private data, timer epoch or artwork is part of admission.
import {assertClosedMovingProgram} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {validateConnectorBoard} from './sliding.mjs';
import {decodeElevatorRecord} from './elevators.mjs';
import {validateBombWallTiles} from './walls.mjs';
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
// Intentional PILOT recovery signal, not a source death or target point.
// The Round controller catches it only after the entire update stack unwinds.
export class PilotAbsentSlideContinuation extends Error {
 constructor(details){super('Source absent-slot slide continuation is unqualified');this.name='PilotAbsentSlideContinuation';this.details=structuredClone(details);}
}
export function assertMovingElevatorDots(dots,{origin={x:74,y:72},initial=false}={}){
 if(origin?.x!==74||origin?.y!==72||!Array.isArray(dots)||!dots.length||dots.length>88)throw new Error('Large source moving/up-down inventory required');
 let previous=-1,movers=0,updown=0,goals=0;const ids=new Set();
 for(const d of dots){
  const moving=d.motion==='moving-program',up=d.motion==='up-down',type=moving?1:up?2:0;
  if(!integer(d.sourceIndex,0,87)||d.sourceIndex<=previous||!integer(d.row,0,7)||!integer(d.column,0,10)||d.sourceIndex!==d.row*11+d.column||d.id===undefined||ids.has(d.id)||!integer(d.cell,0,65535)||(d.cell&~0x4187)||!(d.cell&1)||d.present!==true||!integer(d.flags,0,65535)||d.color!==dotColorOffset(d.flags,0)||!['static','moving-program','up-down'].includes(d.motion)||d.motionType!==type||!!(d.cell&0x80)!==moving||!!(d.cell&0x100)!==up||d.sourceInitialPosition?.x!==origin.x+48*d.column||d.sourceInitialPosition?.y!==origin.y+48*d.row||!integer(d.x,-32768,32767)||!integer(d.y,-32768,32767)||!['bonus','sourceInitialBonus','sourceHasSprite','sourceInBackground','sourceCollidable'].every(k=>typeof d[k]==='boolean')||d.sourceHasSprite===d.sourceInBackground||d.bonus&&!d.sourceInitialBonus||!!(d.cell&2)!==d.bonus||!!(d.cell&4)!==(d.kind==='goal')||!['dot','bonus','goal'].includes(d.kind)||d.kind==='dot'&&d.bonus||d.kind==='bonus'&&!d.bonus||d.ring||d.protected||d.waystation||d.teleport!==false||d.transferDeath||d.slowdown||d.burnt||d.sourceBombDynamic||d.connector||d.nonhumanCanGrab!==true)throw new Error('Explicit source TYPE1/TYPE2/static dot, color, kind and retained sprite identity required');
  if(!(d.flags&1)&&(type!==0||d.sourceInitialBonus||d.kind!=='dot'||(d.cell&~0x4000)!==1))throw new Error('Inactive Child source masks retain only ordinary plain static presence');
  if(initial&&(d.sourceInitialBonus!==d.bonus||d.collected||d.x!==d.sourceInitialPosition.x||d.y!==d.sourceInitialPosition.y))throw new Error('Initial declarations must precede bonus/reset repair');
  if(moving){movers++;if(d.upDown||d.slideMask||d.kind==='goal'||d.sourceInBackground||typeof d.movingProgram!=='string')throw new Error('Separate ordinary bonus/plain movers required');assertClosedMovingProgram(d.movingProgram,d.sourceInitialPosition);if(d.sourceMovingProgram){const p=d.sourceMovingProgram,pad=(1+d.movingProgram.length)%2,expected=d.movingProgram.length.toString(16).padStart(2,'0')+[...d.movingProgram].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');if(!integer(p.offset,0,0x7fffffff)||p.paddingHex?.length!==2*pad||pad&&!/^[0-9a-f]{2}$/.test(p.paddingHex)||p.rawHex!==expected+p.paddingHex)throw new Error('Retained inline source program bytes must match declared ordinary program');}}
  else if(d.movingProgram)throw new Error('Only TYPE1 has an inline program');
  if(up){
   updown++;if(d.color!==0||d.bonus||d.kind!=='dot'||d.slideMask||d.sourceInBackground||d.upDown?.group!==0||d.upDown.initialLowered!==false||d.upDown.x!==d.sourceInitialPosition.x||d.upDown.y!==d.sourceInitialPosition.y||!integer(d.upDownPhase,0,12)||d.x!==d.upDown.x+d.upDownPhase-12||d.y!==d.upDown.y+12-d.upDownPhase||d.humanCanGrab!==(d.upDownPhase===12)||d.sourceCollidable!==(d.upDownPhase>=2)||d.intermediate?.valid)throw new Error('Raised white channel0 TYPE2 current-main geometry, permission and NO cache required');
  }else if(d.upDown||d.humanCanGrab!==true||d.sourceCollidable!==true||!moving&&(d.x!==d.sourceInitialPosition.x||d.y!==d.sourceInitialPosition.y))throw new Error('Static/current ordinary positions and permissions required');
  if(d.kind==='goal'){goals++;if(type!==0||d.color!==0||d.bonus||d.sourceInBackground)throw new Error('Separate static white nonbonus goal required');}
  if(initial&&d.sourceInBackground!==(type===0&&d.kind==='dot'&&!d.bonus))throw new Error('Immutable original DO optimization required');
  if(d.intermediate?.valid&&(type!==1||d.intermediate.moving!==true||!integer(d.intermediate.pixel?.x,-32768,32767)||!integer(d.intermediate.pixel?.y,-32768,32767)))throw new Error('Only ordinary TYPE1 source caches are valid');
  previous=d.sourceIndex;ids.add(d.id);
 }
 if(!movers||!updown||goals!==1)throw new Error('Explicit ordinary movers, TYPE2 dots and static goal required');return true;
}
export function assertMovingElevatorActor(a,{program=a?.program,dots,initial=false}={}){
 const human=[0,6].includes(a?.sourceActorType),d=dots?.find(d=>d.id===a?.pivot),groups={0:700,6:4300,1:500,2:4400,3:4500};
 if(!a||!d||!integer(a.sourceSlot,0,30)||human!==(a.sourceSlot<2)||(a.sourceActorType===0?![700,4300].includes(a.group):a.group!==groups[a.sourceActorType])||![-1,1].includes(a.direction)||(initial&&!Number.isFinite(a.angle))||(!human&&(!integer(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||(a.unwrappedFrame&63)!==a.frame))||(human?a.speedClass!==0||program!==null:![1,2,3].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||program!==null&&(typeof program!=='string'||!program.length||program.length>255||!/^[nsf]+$/.test(program)||!integer(a.sourcePC,1,program.length)))||initial&&(d.motion==='up-down'||human&&(d.motion!=='static'||d.kind!=='dot'||d.bonus||d.slideMask)))throw new Error('Source class0 static humans and ordinary class1 n/s/f actors; initial TYPE1 NPC riders allowed');return true;
}
export function assertMovingElevatorScope({origin,dots=[],actors=[],connectors,walls,elevators,activeSections={},humanStarts,initial=false,activeMask,difficulty,sourceGrid,pilotAbsentSlideRecoveryRules,...inventory}={}){
 if(activeMask!==1||difficulty!=='Child'||sourceGrid?.version!==12||sourceGrid.displaySizeRaw!==8||sourceGrid.rows!==8||sourceGrid.columns!==11)throw new Error('Explicit immutable Child/version12/display8 source grid required');
 if(pilotAbsentSlideRecoveryRules!==true)throw new Error('Separate explicit PILOT absent-slide recovery capability required');
 assertMovingElevatorDots(dots,{origin,initial});
 for(const key of['spikes','bombs','goodies','doors','switches','puddles','teleports'])if(!Array.isArray(inventory[key])||inventory[key].length)throw new Error('Moving/up-down requires actual empty '+key+' inventory');
 validateConnectorBoard(connectors,dots);for(const[eIndex,e]of connectors.entries())if(e.id!==eIndex||e.bonus!==false||e.sourceInitialBonus!==false||e.sourceHasSprite!==false||e.burnt!==false||[e.first,e.second].some(id=>{const d=dots.find(d=>d.id===id);return d.kind!=='dot'||d.bonus||d.sourceInitialBonus;}))throw new Error('Separate unbonused static source EX endpoints required');
 validateBombWallTiles(walls);if(!walls.length)throw new Error('Actual stationary WL inventory required');for(const[i,w]of walls.entries())if(w.id!==i||w.x!==origin.x+48*w.column||w.y!==origin.y+48*w.row||w.visible===false)throw new Error('Original static wall positions required');
 if(!Array.isArray(elevators)||!elevators.length||elevators.length>12)throw new Error('Actual EL controls required');for(const e of elevators){decodeElevatorRecord({rawWords:[e.row,e.column,e.subcell,e.group,0,1]});if(e.group!==0||![1,2,3].includes(e.subcell)||!integer(e.activationMask,1,0xffffffff)||!(e.activationMask&1))throw new Error('Active channel0 source pressure controls required');}
 let previous=-1;if(!Array.isArray(actors)||!actors.length)throw new Error('Actual source actor inventory required');for(const a of actors){assertMovingElevatorActor(a,{dots,initial});if(a.sourceSlot<=previous)throw new Error('Ascending unique source actor slots required');previous=a.sourceSlot;}
 if(initial&&(!Array.isArray(humanStarts)||humanStarts.length!==2||humanStarts[0]!==actors[0].pivot||humanStarts.some(id=>{const d=dots.find(d=>d.id===id);return !d||d.motion!=='static'||d.kind!=='dot'||d.bonus||d.slideMask;})))throw new Error('Both source human declarations require ordinary static starts');
 for(const[k,n]of Object.entries(activeSections))if(!integer(n,0,0x7fffffff)||n&&!['SP','WL','EX','EL','WA','WP','TX'].includes(k))throw new Error('Unqualified moving/up-down source section '+k);
 return true;
}
