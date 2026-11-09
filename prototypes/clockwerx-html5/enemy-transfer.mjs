import {stepSourceProgram} from './programs.mjs';

// Static WA callbacks. Qualified type4 actors are bounded to class1 with
// no transfer program; their nonordinary contact hooks belong to the caller.
// True EX sliding, moving/up-down dots, teleports and type5 remain unsupported.
const offsets={0:[1,0],16:[0,1],32:[-1,0],48:[0,-1]};
const integer=n=>Number.isInteger(n);
function validateState(s,allowRotatingSpikes=false) {
  if(!s||![1,2,3,...(allowRotatingSpikes?[4]:[])].includes(s.sourceActorType)||!integer(s.frame)||s.frame<0||s.frame>63||
     ![-1,1].includes(s.direction)||typeof s.visible!=='boolean'||typeof s.orphaned!=='boolean')
    throw new RangeError('Explicit ordinary canonical enemy state required');
  if(s.sliding)throw new Error('True source sliding is not a static transfer');
  if(!integer(s.unwrappedFrame)||(s.unwrappedFrame&63)!==s.frame)
    throw new RangeError('Canonical/unwrapped frame mismatch');
}
function validateDot(d) {
  if(!d||d.id===undefined||!integer(d.x)||!integer(d.y)||
     !['present','humanCanGrab','nonhumanCanGrab'].every(k=>typeof d[k]==='boolean'))
    throw new TypeError('Explicit static dot position and permissions required');
  if(d.motion!=='static'||d.slideMask!==0||d.teleport!==false)
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
  program,dots,guestTick,adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab,allowRotatingSpikes=false
}) {
  if(!integer(classDelta)||classDelta<0||classDelta>255||!integer(guestTick)||guestTick<0)
    throw new RangeError('Bounded class delta and latched guest tick required');
  if(!Array.isArray(dots)||![adjustPeriod,afterAnimate,onDotRelease,onDotGrabFirst,afterDotGrab].every(f=>typeof f==='function'))
    throw new TypeError('Source dot and synchronous collision/grab adapters required');
  dots.forEach(validateDot);
  const next={...state,unwrappedFrame:state.unwrappedFrame??state.frame},events=[];
  const validate=s=>validateState(s,allowRotatingSpikes);
  validate(next);
  if(next.sourceActorType===4&&(next.speedClass!==1||next.checksWalls!==false||program!==null&&!/^n+$/.test(program)))
    throw new Error('Qualified rotating spike requires class1, no walls and a no-action program');
  if(next.sourceActorType===4&&program!==null&&(!integer(next.sourcePC)||next.sourcePC<1||next.sourcePC>program.length))
    throw new Error('Qualified rotating spike PC must skip the Pascal length byte');
  if(program!==null)stepSourceProgram(program,next.sourcePC,{frame:1}); // validate without consuming
  const dotAt=id=>{const d=dots.find(d=>d.id===id);if(!d)throw new Error('Unknown pivot');return d;};
  dotAt(next.pivot);
  for(let step=0;step<classDelta;step++) {
    const context={human:false,step,guestTick};
    next.unwrappedFrame+=next.direction;next.frame=next.unwrappedFrame&63;
    // Source WACollide runs before stop-slide/direct-program/start-slide.
    afterAnimate(next,context);validate(next);
    if(program===null)continue;
    const instruction=stepSourceProgram(program,next.sourcePC,{frame:next.frame});
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
