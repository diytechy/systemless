import {assertClosedMovingProgram} from './moving-dots.mjs';
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const sync=f=>{if(typeof f!=='function'||f.constructor?.name==='AsyncFunction')throw new TypeError('Synchronous marked death adapter required');};

// DODeathBecomesMe407a. This predicate belongs only to real human WAGrab,
// before release, never occupancy, Bounce, NPC or destination arrival hooks.
export function fatalMarkedGrab(actor,old,target,grab,{allowMarkedTransfers=false}={}){
 if(allowMarkedTransfers!==true)throw new Error('Separate marked-transfer capability required');
 if(typeof old?.transferDeath!=='boolean'||typeof target?.transferDeath!=='boolean'||typeof grab?.realDot!=='boolean')throw new TypeError('Explicit effective marks and real-dot GrabSpec required');
 return [0,6].includes(actor?.sourceActorType)&&grab.realDot&&old.transferDeath&&target.transferDeath;
}
export function markedGrabPrelude(actor,old,target,grab,{allowMarkedTransfers=false,onDeath}={}){
 const human=[0,6].includes(actor?.sourceActorType);
 if(!actor||![0,1,2,3,6].includes(actor.sourceActorType)||!integer(actor.sourceSlot,0,30)||human!==(actor.sourceSlot<2)||(human?actor.speedClass!==0:actor.speedClass!==1||actor.checksWalls!==false)||![-1,1].includes(actor.direction)||!integer(actor.frame,0,63)||!Number.isInteger(actor.unwrappedFrame)||(actor.unwrappedFrame&63)!==actor.frame)throw new Error('Live canonical source actor required before marked continuation');
 const fatal=fatalMarkedGrab(actor,old,target,grab,{allowMarkedTransfers});sync(onDeath);
 if(!fatal)return false;
 actor.direction=0;actor.sourceTerminalReason=37;
 const v=onDeath({reason:'marked-transfer',sourceReason:37,object:old.id,target:target.id},actor);
 if(v&&typeof v.then==='function')throw new TypeError('Synchronous marked death adapter required');return true;
}

export function assertMovingMarkedDots(dots,{origin={x:74,y:72},initial=false}={}){
 if(origin?.x!==74||origin?.y!==72||!Array.isArray(dots)||!dots.length||dots.length>88)throw new Error('Explicit large source grid/moving marked inventory required');
 let last=-1;const ids=new Set();let goals=0,movers=0,marks=0;
 for(const d of dots){
  const moving=d.motion==='moving-program';
  if(!integer(d.sourceIndex,0,87)||d.sourceIndex<=last||d.sourceIndex!==d.row*11+d.column||!integer(d.row,0,7)||!integer(d.column,0,10)||ids.has(d.id)||d.id===undefined||!integer(d.cell,0,65535)||(d.cell&~0x6087)||!(d.cell&1)||d.present!==true||d.sourceCollidable!==true||!Number.isInteger(d.x)||!Number.isInteger(d.y)||d.sourceInitialPosition?.x!==origin.x+48*d.column||d.sourceInitialPosition?.y!==origin.y+48*d.row||((initial||!moving)&&(d.x!==d.sourceInitialPosition.x||d.y!==d.sourceInitialPosition.y))||!['static','moving-program'].includes(d.motion)||d.motionType!==(moving?1:0)||!!(d.cell&0x80)!==moving||!integer(d.color,0,7)||['bonus','transferDeath','sourceInBackground','sourceCollidable'].some(k=>typeof d[k]!=='boolean')||!!(d.cell&0x2000)!==d.transferDeath||!!(d.cell&2)!==d.bonus||!['dot','bonus','goal'].includes(d.kind)||!!(d.cell&4)!==(d.kind==='goal')||d.kind==='bonus'&&!d.bonus||d.kind==='dot'&&d.bonus||d.humanCanGrab!==true||d.nonhumanCanGrab!==true||d.teleport!==false||d.slideMask!==0||d.ring||d.protected||d.waystation||d.upDown||d.slowdown||d.connector||d.sourceBombDynamic||d.burnt)throw new Error('Qualified source moving/marked/goal dot declarations required');
  if(moving){movers++;if(d.color!==0||d.transferDeath||d.bonus||!['dot','goal'].includes(d.kind)||d.sourceInBackground!==false||typeof d.movingProgram!=='string'||!/^[epw]+$/.test(d.movingProgram))throw new Error('Plain white e/p/w movers and separate moving goal required');assertClosedMovingProgram(d.movingProgram,d.sourceInitialPosition);}
  else if(d.movingProgram)throw new Error('Static dot cannot carry moving program');
  if(d.transferDeath){marks++;if(moving||d.kind!=='dot'||d.bonus||(d.color<2||d.color>6)||initial&&d.sourceInBackground!==true)throw new Error('Separate static unbonused colored marks required');}
  if(d.kind==='goal'){goals++;if(!moving||d.bonus||d.transferDeath)throw new Error('Separate white moving goal required');}
  if(initial&&!moving&&d.sourceInBackground===d.bonus)throw new Error('Initial static optimization identity required');
  last=d.sourceIndex;ids.add(d.id);
 }
 if(goals!==1||movers<2||marks<1)throw new Error('Explicit moving goal, plain movers and static marked inventory required');return true;
}
export function assertMovingMarkedActor(a,{program=a?.program,initial=false,dots}={}){
 const human=[0,6].includes(a?.sourceActorType),d=dots?.find(d=>d.id===a.pivot);
 if(!a||!integer(a.sourceSlot,0,30)||human!==(a.sourceSlot<2)||!d||(human?a.speedClass!==0:![1,2,3].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||program!==null&&(typeof program!=='string'||!program.length||program.length>255||!/^[nsf]+$/.test(program)||!integer(a.sourcePC,1,program.length)))||initial&&(d.motion!=='static'||human&&(d.transferDeath||d.bonus||d.kind!=='dot'))||![-1,1].includes(a.direction))throw new Error('Static source starts and ordinary class1 n/s/f actors required');return true;
}
export function assertMovingMarkedGoalScope({origin,dots=[],actors=[],humanStarts,activeSections={},allowMarkedTransfers=false,initial=false,...inventory}={}){
 if(allowMarkedTransfers!==true)throw new Error('Moving marked goal requires marked core');assertMovingMarkedDots(dots,{origin,initial});
 for(const k of ['spikes','bombs','goodies','connectors','walls','doors','switches','puddles','elevators','teleports'])if(!Array.isArray(inventory[k])||inventory[k].length)throw new Error('Moving marked goal requires actual empty '+k+' inventory');
 for(const[k,n]of Object.entries(activeSections))if(!integer(n,0,0x7fffffff)||n&&!['WP','WA','TX'].includes(k))throw new Error('Unqualified moving marked section '+k);
 let previous=-1;if(!Array.isArray(actors)||!actors.length)throw new Error('Explicit source actor inventory required');for(const a of actors){assertMovingMarkedActor(a,{dots,initial});if(a.sourceSlot<=previous)throw new Error('Ascending source actor slots required');previous=a.sourceSlot;}
 if(initial&&(!Array.isArray(humanStarts)||humanStarts.length!==2||humanStarts[0]!==actors[0].pivot||humanStarts.some(id=>{const d=dots.find(d=>d.id===id);return !d||d.motion!=='static'||d.transferDeath||d.kind!=='dot'||d.bonus;})))throw new Error('Both human source declarations require ordinary static starts');return true;
}
