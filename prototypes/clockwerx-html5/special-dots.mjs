/** Bounded static-ring lifecycle from DOReleased/DOOneFrameProc. Moving,
 * up/down and combined special dots require separate qualification.
 * Supply the persistent unscaled80 MT client count (base40/divisor2).
 * Each observed count change invokes one callback; missed counts do not catch
 * up. Pause by not observing. Tick deadlines use Macintosh guest ticks.
 */
export function createStaticRingDot({color=0,difficulty=0,clockCount=0}={}) {
  if(!Number.isInteger(color)||color<0||color>7||
     !Number.isInteger(difficulty)||difficulty<0||difficulty>3)
    throw new RangeError('Unsupported ring color or difficulty');
  const minimum=23+7*color,maximum=minimum+7,delay=[300,600,900,1200][difficulty];
  let frame,step,visible,humanAvailable,attached,reference,deadline;
  const count=n=>{if(!Number.isInteger(n)||n<0)throw new RangeError('Nonnegative source count required');};
  const snapshot=()=>({frame,visible,humanAvailable,nonhumanAvailable:true,step,attached,deadline});
  function reset(currentCount=reference??clockCount) {
    count(currentCount);frame=minimum;step=0;visible=true;humanAvailable=true;
    attached=false;reference=currentCount;deadline=null;
    return snapshot();
  }
  reset(clockCount);
  return {
    snapshot,reset,
    release({human=true,clockCount:currentCount=reference}={}) {
      count(currentCount);
      if(!human||!humanAvailable)return {changed:false,...snapshot()};
      humanAvailable=false;frame++;step=1;attached=true;reference=currentCount;
      // The caller must orphan other occupants, excluding the releasing actor.
      return {changed:true,orphanOtherOccupants:true,soundArgument:42,...snapshot()};
    },
    observeClock(currentCount,latchedGuestTick,freshGuestTick=latchedGuestTick) {
      count(currentCount);count(latchedGuestTick);count(freshGuestTick);
      if(!attached||currentCount===reference)return snapshot();
      reference=currentCount;
      frame+=step;
      if(visible) {
        if(step>0&&frame===maximum) {
          visible=false;step=0;deadline=freshGuestTick+delay;
        } else if(step<=0&&frame===minimum) {
          reset(currentCount);
        }
      } else if(latchedGuestTick>deadline) {
        step=-1;visible=true;frame=maximum-1;
      }
      return snapshot();
    }
  };
}

// FUTURE/UNLINKED. DOGrabbed attaches the static unscaled80 client and sets
// step+1, without immediately advancing the frame. SUAutoFrame wraps before
// DOOneFrameProc stops at89, so grabbing89 replays79..89 on later callbacks.
export function createCheckpointDot(clockCount=0){
 let frame=79,step=0,attached=false,reference;
 const count=n=>{if(!Number.isInteger(n)||n<0)throw new RangeError('Nonnegative source count required');};
 const snapshot=()=>({frame,step,attached,visible:true});
 const reset=(currentCount=reference??clockCount)=>{count(currentCount);frame=79;step=0;attached=false;reference=currentCount;return snapshot();};
 reset(clockCount);
 return {snapshot,reset,
  resetRound(currentCount=reference){count(currentCount);reference=currentCount;step=0;attached=false;return snapshot();},
  activate(currentCount=reference){count(currentCount);reference=currentCount;step=1;attached=true;return snapshot();},
  observeClock(currentCount){
   count(currentCount);if(!attached||currentCount===reference)return snapshot();reference=currentCount;
   frame=frame+step>89?79:frame+step;
   if(frame===89){step=0;attached=false;}
   return snapshot();
  }
 };
}

// Separate miscellaneous type2 sprite: unscaled50 (base50/divisor1), not
// the ring/checkpoint clock. Each dispatch advances once and then reverses
// at the inclusive117/124 endpoints. It never changes dot grab permission.
export function createProtectionOverlay(clockCount=0){
 let frame,step,reference;
 const count=n=>{if(!Number.isInteger(n)||n<0)throw new RangeError('Nonnegative source count required');};
 const snapshot=()=>({frame,step,visible:true});
 const reset=(currentCount=reference??clockCount)=>{count(currentCount);frame=117;step=1;reference=currentCount;return snapshot();};
 reset(clockCount);
 return {snapshot,reset,
  observeClock(currentCount){
   count(currentCount);if(currentCount===reference)return snapshot();reference=currentCount;frame+=step;
   if(frame===117||frame===124)step*=-1;
   return snapshot();
  }
 };
}
