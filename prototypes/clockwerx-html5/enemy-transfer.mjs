import {startSliding,animateSliding,stopSliding} from './sliding.mjs';
import {stepSourceProgram} from './programs.mjs';

// Static WA callbacks. Qualified type4 clock and transfer capabilities are explicit; their nonordinary contact hooks belong to the caller.
// Ordinary moving dots and type5 remain unsupported; EX and teleports have explicit gates.
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
function validateDot(d,allowUpDownDots=false,allowTeleports=false,allowSliding=false) {
  if(!d||d.id===undefined||!integer(d.x)||!integer(d.y)||
     !['present','humanCanGrab','nonhumanCanGrab'].every(k=>typeof d[k]==='boolean'))
    throw new TypeError('Explicit static dot position and permissions required');
  if(d.motion!=='static'&&!(allowUpDownDots&&d.motion==='up-down')||d.slideMask!==0&&!allowSliding||d.teleport!==false&&!(allowTeleports&&d.teleport===true))
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
  program,dots,guestTick,adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowUpDownDots=false,allowTeleports=false,allowSliding=false,allowSlidingPrograms=false,allowSlidingGoodiePrograms=false,allowSlidingGoodies=false
}) {
  if(!integer(classDelta)||classDelta<0||classDelta>255||!integer(guestTick)||guestTick<0)
    throw new RangeError('Bounded class delta and latched guest tick required');
  if(!Array.isArray(dots)||![adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab].every(f=>typeof f==='function'))
    throw new TypeError('Source dot and synchronous collision/grab adapters required');
  dots.forEach(d=>validateDot(d,allowUpDownDots,allowTeleports,allowSliding));
  if(allowSlidingPrograms&&dots.some(d=>d.slideMask&&d.humanCanGrab!==true))throw new Error('Static EX programs require human-available endpoints');
  if(allowSlidingPrograms&&(!allowSliding||![1,2,3].includes(state.sourceActorType)||![1,2,3].includes(state.speedClass)||state.checksWalls!==false||program!==null&&(!/^[fn]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)))throw new Error('Separate ordinary wall-free f/n sliding program scope required');
  if(allowSlidingGoodiePrograms&&!allowSlidingGoodies)throw new Error('Sliding goodie programs require sliding goodies');
  if(allowSlidingGoodies&&(allowUpDownDots||allowTeleports||state.movingPivot||dots.some(d=>d.motion!=='static'||d.teleport!==false||d.ring||d.protected||d.waystation||d.transferDeath||d.slowdown||d.moving||d.movingProgram||d.upDown||d.sourceBombDynamic||d.burnt)||!allowSliding||allowSlidingPrograms||![1,2,3].includes(state.sourceActorType)||state.speedClass!==1||state.checksWalls!==false||program!==null&&(!allowSlidingGoodiePrograms||!/^[bns]+$/.test(program)||!integer(state.sourcePC)||state.sourcePC<1)||dots.some(d=>d.slideMask&&(d.humanCanGrab!==true||d.nonhumanCanGrab!==true))))throw new Error('Separate ordinary free class1 sliding goodie scope required');
  const next={...state,unwrappedFrame:state.unwrappedFrame??state.frame},events=[];
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
    if(allowSliding){const e=stopSliding(next,dots,{release:(d,s)=>onDotRelease(s,d,context),grab:(d,s)=>{onDotGrabFirst(s,d,context);afterDotGrab(s,d,context);}});if(e)events.push(e);if(program!==null&&!allowSlidingPrograms&&!allowSlidingGoodiePrograms)throw new Error('EX programmed actors unqualified');}
    try {
    if(program===null)continue;
    const instruction=stepSourceProgram(program,next.sourcePC,{frame:next.frame,sliding:next.sliding});
    next.sourcePC=instruction.sourcePC;
    if(!instruction.action)continue;
    const oldDot=dotAt(next.pivot),[dx,dy]=offsets[next.frame];
    // Source selects the first present positional match, then checks its
    // nonhuman permission. Rendering visibility and color are not filters.
    const target=dots.find(d=>d.present&&d.x===oldDot.x+48*dx&&d.y===oldDot.y+48*dy);
    const allowed=Boolean(target?.nonhumanCanGrab),action=instruction.action;
    events.push({type:'program-command',step,frame:next.frame,allowed,action:{...action}});
    if(!allowed)continue;
    if(action.grab!==action.reverse)next.direction*=-1;
    if(!action.grab)continue;
    onDotRelease(next,oldDot,context);validate(next);
    next.pivot=target.id;next.unwrappedFrame+=32;next.frame=next.unwrappedFrame&63;
    events.push({type:'program-transfer',step,from:oldDot.id,to:target.id,frame:next.frame});
    // DOGrabbed calls its DP hook before testing human availability.
    onDotGrabFirst(next,target,context);validate(next);
    if(!target.humanCanGrab&&markEnemyOrphaned(next,{guestTick,adjustPeriod}))
      events.push({type:'orphaned',step,deadline:next.orphanDeadline});
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
      events.push({type:'orphan-expired'});
    } else {
      next.visible=!next.visible;events.push({type:'orphan-flicker',visible:next.visible});
    }
  }
  return {state:next,events};
}
