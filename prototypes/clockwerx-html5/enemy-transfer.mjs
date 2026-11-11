import {assertMovingTubesActor} from './moving-tubes.mjs';
import {assertMovingBombSpikeWaystationScope,assertMovingBombSpikeWaystationActor} from './moving-bomb-spike-waystation.mjs';
import {assertStaticSlidingBombGoodieScope,assertStaticSlidingBombGoodieActor} from './static-sliding-bomb-goodies.mjs';
import {assertMovingMarkedOrdinaryScope} from './moving-marked-ordinary.mjs';
import {assertMovingSpikeScope,assertMovingSpikeActor} from './moving-spikes.mjs';
import {assertMovingSpecialScope,assertMovingSpecialActor} from './moving-specials.mjs';
import {assertMovingElevatorScope,assertMovingElevatorActor} from './moving-elevators.mjs';
import {assertMovingMarkedDots,assertMovingMarkedActor} from './marked-transfers.mjs';
import {assertSlidingTeleportDots,assertSlidingTeleportActor} from './sliding-teleports.mjs';
import {startSliding,animateSliding,stopSliding} from './sliding.mjs';
import {stepSourceProgram} from './programs.mjs';

// Static WA callbacks. Qualified type4 clock and transfer capabilities are explicit; their nonordinary contact hooks belong to the caller.
// Ordinary moving dots, EX and teleports have separate explicit gates; type5 remains unsupported.
// Up/down dots have an explicit capability and exact current-pixel queries.
const offsets={0:[1,0],16:[0,1],32:[-1,0],48:[0,-1]};
const integer=n=>Number.isInteger(n);
export function isQualifiedOrbitalProgram(program,{allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false}={}) {
 return typeof program==='string'&&program.length>0&&[...program].every(c=>c==='n'||c==='s'&&allowRotatingSpikeTransfers||c==='b'&&allowRotatingSpikeBounces);
}

function validateState(s,allowRotatingSpikes=false,allowSliding=false) {
  if(!s||![1,2,3,...(allowRotatingSpikes?[4]:[])].includes(s.sourceActorType)||!integer(s.frame)||s.frame<0||s.frame>63||
     ![-1,1].includes(s.direction)||typeof s.visible!=='boolean'||typeof s.orphaned!=='boolean')
    throw new RangeError('Explicit ordinary canonical enemy state required');
  if(s.sliding&&!allowSliding)throw new Error('True source sliding is not a static transfer');
  if(!integer(s.unwrappedFrame)||(s.unwrappedFrame&63)!==s.frame)
    throw new RangeError('Canonical/unwrapped frame mismatch');
}
function validateDot(d,allowUpDownDots=false,allowTeleports=false,allowSliding=false,allowMovingDots=false) {
  if(!d||d.id===undefined||!integer(d.x)||!integer(d.y)||
     !['present','humanCanGrab','nonhumanCanGrab'].every(k=>typeof d[k]==='boolean'))
    throw new TypeError('Explicit static dot position and permissions required');
  if(d.motion!=='static'&&!(allowUpDownDots&&d.motion==='up-down')&&!(allowMovingDots&&d.motion==='moving-program')||d.slideMask!==0&&!allowSliding||d.teleport!==false&&!(allowTeleports&&d.teleport===true))
    throw new Error('Moving, EX sliding, up/down and teleport dots are unqualified');
}

/** WAOrphan CODE6:eb46. Mutates a live actor, including when called from a
 * human ring-release adapter. Repeated calls never extend its deadline.
 * adjustPeriod is MTAdjustPeriod, not a conversion to wall-clock seconds.
 */
export function markEnemyOrphaned(actor,{guestTick,adjustPeriod}) {
  if(!integer(guestTick)||guestTick<0||typeof adjustPeriod!=='function')
    throw new TypeError('Guest tick and source period adjustment required');
  if(!actor.visible||actor.orphaned)return false;
  const delay=adjustPeriod(15);
  if(!integer(delay)||delay<0)throw new RangeError('Integer adjusted guest-tick delay required');
  actor.orphaned=true;actor.orphanDeadline=guestTick+delay;
  return true;
}

/** Invoke ONCE when the source sprite callback dispatches, supplying the
 * shared class delta. This function is not a per-render update. A dispatched
 * callback with delta0 still performs the outer orphan visibility step.
 * Hooks are synchronous, source-ordered effects; returned events are only
 * diagnostics and must not be dispatched a second time.
 */
export function advanceStaticEnemyCallback(state,classDelta,{
  program,dots,guestTick,adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowUpDownDots=false,allowTeleports=false,allowSliding=false,allowSlidingPrograms=false,allowGunTriggerSliding=false,allowSlidingGoodiePrograms=false,allowSlidingGoodies=false,allowStaticSlidingBombGoodies=false,staticSlidingBombGoodieScope,allowSlidingBombs=false,allowSlidingBombCheckpoints=false,allowSlidingOil=false,allowSlidingOilGoodieRings=false,allowSlidingTeleports=false,allowMovingBombSpikeWaystation=false,movingBombSpikeWaystationScope,allowMovingDots=false,allowMovingTubes=false,allowMovingMarkedOrdinary=false,movingMarkedOrdinaryScope,allowMovingSpikes=false,movingSpikeScope,allowMovingBombs=false,allowMovingMarkedGoals=false,allowMovingCheckpointRings=false,allowMovingMarkedBonuses=false,movingSpecialScope,allowMovingElevators=false,movingElevatorScope,onMissingSlideTarget,sourceQuery,onSourceEvent=()=>{}
}) {
  if(!integer(classDelta)||classDelta<0||classDelta>255||!integer(guestTick)||guestTick<0)
    throw new RangeError('Bounded class delta and latched guest tick required');
  if(typeof allowMovingBombSpikeWaystation!=='boolean')throw new Error('Literal moving BO/SPI/WY helper capability required');
  if(allowMovingBombSpikeWaystation){if(!allowMovingDots||!allowRotatingSpikes||!allowClass3RotatingSpikes||allowMovingSpikes||allowMovingBombs||allowMovingMarkedOrdinary||allowMovingMarkedGoals||allowMovingElevators||allowMovingCheckpointRings||allowMovingMarkedBonuses||allowSliding||allowTeleports||allowUpDownDots||movingBombSpikeWaystationScope?.dots!==dots||program!==state.program||typeof sourceQuery!=='function'||sourceQuery.constructor?.name==='AsyncFunction')throw new Error('Separate synchronous moving BO/SPI/WY callback required');assertMovingBombSpikeWaystationScope(movingBombSpikeWaystationScope,{actors:[state]});}
  if(allowStaticSlidingBombGoodies){
   if(allowStaticSlidingBombGoodies!==true||!allowSliding||allowSlidingPrograms||allowSlidingBombs||allowSlidingBombCheckpoints||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingOilGoodieRings||allowSlidingTeleports||allowMovingDots||allowTeleports||allowUpDownDots||allowRotatingSpikes||staticSlidingBombGoodieScope?.dots!==dots)throw new Error('Separate static EX/BO/GO helper required');
   assertStaticSlidingBombGoodieScope(staticSlidingBombGoodieScope,{actors:[state]});assertStaticSlidingBombGoodieActor(state,{program});
   const synchronous=f=>{if(typeof f!=='function'||f.constructor?.name==='AsyncFunction')throw new TypeError('Synchronous static EX/BO/GO adapter required');return(...args)=>{const v=f(...args);if(v&&typeof v.then==='function')throw new TypeError('Static EX/BO/GO adapter returned a Promise');return v;};};
   adjustPeriod=synchronous(adjustPeriod);afterAnimate=synchronous(afterAnimate);onDotRelease=synchronous(onDotRelease);onDotGrabFirst=synchronous(onDotGrabFirst);afterDotGrab=synchronous(afterDotGrab);

  }
  if(allowMovingMarkedOrdinary){
   if(allowMovingMarkedOrdinary!==true||!allowMovingDots||allowMovingSpikes||allowMovingMarkedGoals||allowMovingCheckpointRings||allowMovingMarkedBonuses||allowMovingElevators||allowMovingBombs||allowSliding||allowTeleports||allowUpDownDots||allowRotatingSpikes||movingMarkedOrdinaryScope?.dots!==dots||typeof sourceQuery!=='function'||sourceQuery.constructor?.name==='AsyncFunction'||program!==state.program)throw new Error('Separate synchronous moving marked ordinary helper required');
   assertMovingMarkedOrdinaryScope(movingMarkedOrdinaryScope,{actors:[state]});
  }
  if(typeof allowMovingSpikes!=='boolean')throw new Error('Explicit moving SPI helper boolean required');
  if(!Array.isArray(dots)||![adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab].every(f=>typeof f==='function'))
    throw new TypeError('Source dot and synchronous collision/grab adapters required');
  if(allowSliding&&allowTeleports&&!allowSlidingTeleports)throw new Error('Separate HY/EX helper capability required');
  if(allowSlidingTeleports){
   if(!allowSliding||!allowTeleports||allowUpDownDots||allowRotatingSpikes||allowSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingBombs||allowSlidingBombCheckpoints||typeof onSourceEvent!=='function')throw new Error('Separate static ordinary HY/EX helper scope required');
   assertSlidingTeleportDots(dots);assertSlidingTeleportActor(state,{program});
  }
  if(allowMovingSpikes){
   if(!allowMovingDots||allowMovingCheckpointRings||allowMovingMarkedBonuses||allowMovingMarkedGoals||allowMovingElevators||allowMovingBombs||allowSliding||allowTeleports||allowUpDownDots||allowRotatingSpikes||allowSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingOilGoodieRings||allowSlidingBombs||allowSlidingBombCheckpoints||allowSlidingTeleports||movingSpikeScope?.dots!==dots||movingSpikeScope?.movingSpikeRules!==true||typeof sourceQuery!=='function'||sourceQuery.constructor?.name==='AsyncFunction')throw new Error('Separate synchronous moving SPI helper composition required');
   assertMovingSpikeScope(movingSpikeScope);assertMovingSpikeActor(state,{dots,source:movingSpikeScope.movingSpikeSource,program});
  }
  if(allowMovingCheckpointRings||allowMovingMarkedBonuses){
   if(allowMovingCheckpointRings&&allowMovingMarkedBonuses||!allowMovingDots||allowMovingBombs||allowMovingMarkedGoals||allowMovingElevators||allowSliding||allowTeleports||allowUpDownDots||allowRotatingSpikes||allowSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingOilGoodieRings||allowSlidingBombs||allowSlidingBombCheckpoints||allowSlidingTeleports||typeof sourceQuery!=='function'||sourceQuery.constructor?.name==='AsyncFunction'||movingSpecialScope?.dots!==dots||movingSpecialScope?.movingDotRules!==true||movingSpecialScope?.movingCheckpointRingRules!==allowMovingCheckpointRings||movingSpecialScope?.movingMarkedBonusRules!==allowMovingMarkedBonuses||movingSpecialScope?.markedTransferRules!==allowMovingMarkedBonuses)throw new Error('Separate moving special helper composition required');
   const composition=allowMovingCheckpointRings?'checkpoint-rings':'marked-bonuses';assertMovingSpecialScope({...movingSpecialScope,composition,actors:[state],initial:false});assertMovingSpecialActor(state,{composition,program,dots});
  }
  if(allowMovingMarkedGoals){if(!allowMovingDots||allowMovingBombs||allowSliding||allowTeleports||allowUpDownDots||allowRotatingSpikes||allowSlidingBombs||allowSlidingGoodies||allowSlidingOil||typeof sourceQuery!=='function')throw new Error('Separate moving marked helper capability required');assertMovingMarkedDots(dots);assertMovingMarkedActor(state,{program,dots});}
  if(allowMovingElevators){if(!allowMovingDots||!allowSliding||!allowUpDownDots||allowMovingBombs||allowMovingMarkedGoals||allowTeleports||allowRotatingSpikes||allowSlidingPrograms||allowSlidingBombs||allowSlidingBombCheckpoints||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingOilGoodieRings||allowSlidingTeleports||typeof sourceQuery!=='function'||sourceQuery.constructor?.name==='AsyncFunction'||typeof onMissingSlideTarget!=='function'||onMissingSlideTarget.constructor?.name==='AsyncFunction'||movingElevatorScope?.dots!==dots)throw new Error('Separate moving/TYPE2/EX source helper and PILOT recovery adapters required');assertMovingElevatorScope({...movingElevatorScope,actors:[state],initial:false});assertMovingElevatorActor(state,{program,dots});}
  if(allowMovingTubes){
   if(!allowMovingDots||!allowSliding||allowUpDownDots||allowTeleports||allowRotatingSpikes||allowMovingBombs||
      allowMovingElevators||allowMovingMarkedGoals||allowSlidingBombs||allowSlidingOil)throw new Error('Separate moving bonus/goal and EX actor scope required');
   assertMovingTubesActor(state,program);
  }
  if(allowMovingDots&&!allowMovingTubes&&!allowMovingBombSpikeWaystation&&!allowMovingMarkedOrdinary&&!allowMovingSpikes&&!allowMovingMarkedGoals&&!allowMovingElevators&&!allowMovingCheckpointRings&&!allowMovingMarkedBonuses){
   if(!allowMovingBombs||!allowSliding||allowTeleports||allowUpDownDots||allowRotatingSpikes||allowSlidingBombs||allowSlidingPrograms||allowSlidingGoodies||allowSlidingOil||allowSlidingTeleports||typeof sourceQuery!=='function'||![1,2].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||program!==null&&(!/^[bfn]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1||state.sourcePC>program.length)||dots.some(d=>!['static','moving-program'].includes(d.motion)||d.teleport||d.ring||d.waystation||d.upDown||d.transferDeath||d.slowdown||d.motion==='moving-program'&&(d.slideMask||d.bonus||d.kind!=='dot')))throw new Error('Separate moving BO ordinary class1 b/f/n helper scope required');
  }else if(allowMovingBombs&&!allowMovingDots)throw new Error('Moving BO helper requires moving-dot core');
  dots.forEach(d=>validateDot(d,allowUpDownDots,allowTeleports,allowSliding,allowMovingDots));
  if(allowGunTriggerSliding&&(!allowSliding||!allowUpDownDots||allowSlidingPrograms||allowTeleports||allowMovingDots||allowRotatingSpikes||
    ![1,2,3].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||
    program!==null&&(!/^[fns]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1||state.sourcePC>program.length)||
    dots.some(d=>d.slideMask&&(d.motion!=='static'||d.humanCanGrab!==true||d.nonhumanCanGrab!==true))))throw new Error('Separate static EX with GN/TR and raised EL ordinary callback required');
  if(allowSlidingPrograms&&dots.some(d=>d.slideMask&&d.humanCanGrab!==true))throw new Error('Static EX programs require human-available endpoints');
  if(allowSlidingPrograms&&(!allowSliding||![1,2,3].includes(state.sourceActorType)||![1,2,3].includes(state.speedClass)||state.checksWalls!==false||program!==null&&(!/^[fn]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)))throw new Error('Separate ordinary wall-free f/n sliding program scope required');
  if(allowSlidingBombs&&(!allowSliding||allowUpDownDots||allowTeleports||allowSlidingPrograms||allowSlidingGoodies||allowSlidingOil||state.movingPivot||![1,2,3].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||program!==null&&(!/^[bfns]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)||dots.some(d=>d.motion!=='static'||d.teleport||d.upDown||d.moving||d.movingProgram||d.transferDeath||d.slowdown||d.sourceBombDynamic||d.ring&&(allowSlidingBombCheckpoints||d.slideMask||d.color!==0)||!allowSlidingBombCheckpoints&&(d.protected||d.waystation)||d.slideMask&&(d.ring||d.waystation||d.protected||d.kind==='goal'||d.humanCanGrab!==true||d.nonhumanCanGrab!==true))))throw new Error('Separate ordinary class1 BO/EX scope required');
  if(allowSlidingOilGoodieRings&&!allowSlidingOil)throw new Error('Oil/GO/ring helper requires EX/Oil core');
  if(allowSlidingOil&&(!allowSliding||allowUpDownDots||allowTeleports||allowSlidingPrograms||allowSlidingGoodies||state.movingPivot||![1,2,3].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||program!==null&&(!/^[fns]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)||dots.some(d=>d.motion!=='static'||d.teleport||d.upDown||d.protected||d.waystation||d.moving||d.movingProgram||d.transferDeath||d.slowdown||d.sourceBombDynamic||d.burnt||d.ring&&(!allowSlidingOilGoodieRings||d.slideMask||![0,4].includes(d.color))||d.slideMask&&(d.humanCanGrab!==true||d.nonhumanCanGrab!==true))))throw new Error('Separate ordinary n/s/f EX/Oil scope required');
  if(allowSlidingGoodiePrograms&&!allowSlidingGoodies)throw new Error('Sliding goodie programs require sliding goodies');
  if(allowSlidingGoodies&&(allowUpDownDots||allowTeleports||state.movingPivot||dots.some(d=>d.motion!=='static'||d.teleport!==false||d.ring||d.protected||d.waystation||d.transferDeath||d.slowdown||d.moving||d.movingProgram||d.upDown||d.sourceBombDynamic||d.burnt)||!allowSliding||allowSlidingPrograms||![1,2,3].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||program!==null&&(!allowSlidingGoodiePrograms||!/^[bns]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)||dots.some(d=>d.slideMask&&(d.humanCanGrab!==true||d.nonhumanCanGrab!==true))))throw new Error('Separate ordinary free class1 sliding goodie scope required');
  const next={...state,unwrappedFrame:state.unwrappedFrame??state.frame},events=[];
  const record=e=>{events.push(e);if(allowSlidingTeleports||allowMovingDots){const v=onSourceEvent({...e},{...next});if(v&&typeof v.then==='function')throw new TypeError('Synchronous source diagnostics required');}};
  const validate=s=>validateState(s,allowRotatingSpikes,allowSliding);
  validate(next);
  if(next.sourceActorType===4&&(!(next.speedClass===1||allowFastRotatingSpikes&&next.speedClass===5||allowSlowRotatingSpikes&&next.speedClass===4||allowClass2RotatingSpikes&&next.speedClass===2||allowClass3RotatingSpikes&&next.speedClass===3)||next.checksWalls!==false||program!==null&&!isQualifiedOrbitalProgram(program,{allowRotatingSpikeTransfers,allowRotatingSpikeBounces})))
    throw new Error('Qualified rotating spike requires an enabled clock, no walls and an enabled no-action/bounce/transfer program');
  if(next.sourceActorType===4&&next.speedClass===2&&program!==null)throw new Error('Qualified class2 rotating spike requires a free clock');
  if(next.sourceActorType===4&&next.speedClass===3&&program!==null)throw new Error('Qualified class3 rotating spike requires a free clock');
  if(next.sourceActorType===4&&next.speedClass===4&&program!==null)throw new Error('Qualified slow rotating spike requires a free clock');
  if(next.sourceActorType===4&&program!==null&&(!integer(next.sourcePC)||next.sourcePC<1||next.sourcePC>program.length))
    throw new Error('Qualified rotating spike PC must skip the Pascal length byte');
  if(program!==null)stepSourceProgram(program,next.sourcePC,{frame:1}); // validate without consuming
  const dotAt=id=>{const d=dots.find(d=>d.id===id);if(!d)throw new Error('Unknown pivot');return d;};
  dotAt(next.pivot);
  for(let step=0;step<classDelta;step++) {
    const context={human:false,step,guestTick};
    if(!allowSliding||!animateSliding(next)){next.unwrappedFrame+=next.direction;next.frame=next.unwrappedFrame&63;}
    // Source WACollide runs before stop-slide/direct-program/start-slide.
    afterAnimate(next,context);validate(next);
    if(allowSliding){const e=stopSliding(next,dots,{currentPivot:allowSlidingTeleports||allowMovingDots,onMissingTarget:allowMovingElevators?onMissingSlideTarget:undefined,arrival:allowSlidingTeleports||allowMovingDots?e=>record({...e,step,frame:next.frame}):undefined,release:(d,s)=>onDotRelease(s,d,context),grab:(d,s)=>{onDotGrabFirst(s,d,context);if((allowSlidingTeleports||allowMovingDots)&&!d.humanCanGrab&&markEnemyOrphaned(s,{guestTick,adjustPeriod}))record({type:'orphaned',step,deadline:s.orphanDeadline});afterDotGrab(s,d,context);}});if(e&&(!(allowSlidingTeleports||allowMovingDots)||e.type!=='slide-arrival'))record(e);if(program!==null&&!allowSlidingPrograms&&!allowGunTriggerSliding&&!allowSlidingGoodiePrograms&&!allowSlidingOil&&!allowSlidingBombs&&!allowStaticSlidingBombGoodies&&!allowSlidingTeleports&&!allowMovingDots)throw new Error('EX programmed actors unqualified');}
    try {
    if(program===null)continue;
    const commandPC=next.sourcePC,instruction=stepSourceProgram(program,next.sourcePC,{frame:next.frame,sliding:next.sliding});
    next.sourcePC=instruction.sourcePC;
    if(!instruction.action)continue;
    const oldDot=dotAt(next.pivot),[dx,dy]=offsets[next.frame];
    // Source selects the first present positional match, then checks its
    // nonhuman permission. Rendering visibility and color are not filters.
    const query=allowMovingDots?sourceQuery(next):null;if((allowMovingBombSpikeWaystation||allowMovingMarkedOrdinary||allowMovingSpikes||allowMovingElevators||allowMovingCheckpointRings||allowMovingMarkedBonuses)&&query&&typeof query.then==='function')throw new TypeError('Synchronous joined source query required');if(allowMovingDots&&query?.allowed&&query.grab?.realDot!==true)throw new Error('NPC moving query must return a real source dot');
    const target=allowMovingDots?(query?.allowed?dots.find(d=>d.id===query.grab.dot&&d.sourceIndex===query.grab.sourceIndex):null):dots.find(d=>d.present&&d.x===oldDot.x+48*dx&&d.y===oldDot.y+48*dy);
    const allowed=Boolean(target?.nonhumanCanGrab),action=instruction.action;
    record({type:'program-command',step,frame:next.frame,allowed,action:{...action},...((allowSlidingTeleports||allowMovingDots)?{sourcePCBefore:commandPC,sourcePCAfter:next.sourcePC,sourceOpcode:program[commandPC-1]}:{})});
    if(!allowed)continue;
    if(action.grab!==action.reverse)next.direction*=-1;
    if(!action.grab)continue;
    onDotRelease(next,oldDot,context);validate(next);
    next.pivot=target.id;next.unwrappedFrame+=32;next.frame=next.unwrappedFrame&63;
    record({type:'program-transfer',step,from:oldDot.id,to:target.id,frame:next.frame});
    // DOGrabbed calls its DP hook before testing human availability.
    onDotGrabFirst(next,target,context);validate(next);
    if(!target.humanCanGrab&&markEnemyOrphaned(next,{guestTick,adjustPeriod}))
      record({type:'orphaned',step,deadline:next.orphanDeadline});
    // Child nonhumans do not collect bonuses or activate human WY/goal hooks.
    afterDotGrab(next,target,context);validate(next);
    } finally {if(allowSliding)startSliding(next,dotAt(next.pivot));}
  }
  // WAEnemyFrameProc:da22 AFTER all inner steps, even if it already moved to
  // an available dot. Expiration hides; it does not detach the actor clock.
  if(next.orphaned) {
    if(!integer(next.orphanDeadline))throw new Error('Orphan deadline required');
    if(guestTick>next.orphanDeadline) {
      next.visible=false;next.orphaned=false;next.hiddenUntil=0;
      record({type:'orphan-expired'});
    } else {
      next.visible=!next.visible;record({type:'orphan-flicker',visible:next.visible});
    }
  }
  return {state:next,events};
}
