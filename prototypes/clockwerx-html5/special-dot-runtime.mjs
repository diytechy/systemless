// FUTURE/UNLINKED: static Child rings, WY checkpoints and ordinary-hand
// protection. Caller supplies persistent unscaled80/unscaled50 counts and
// guest ticks at the actual sprite callback stage. No countdown is invented.
import {createStaticRingDot,createCheckpointDot,createProtectionOverlay,createGoalMisc} from './special-dots.mjs';
import {TAU} from './engine.mjs';

const count=n=>{if(!Number.isInteger(n)||n<0)throw new RangeError('Nonnegative source count required');};
const time=n=>{if(!Number.isInteger(n)||n<0)throw new RangeError('Nonnegative integer source time required');};
export class StaticDotRuntime {
 constructor(dots,playerSpec,{originalTime,dotCount=0,overlayCount=0,allowGoalMisc=false}={}){
  if(!Array.isArray(dots)||!playerSpec||!dots.some(d=>d.id===playerSpec.pivot))throw new TypeError('Static dots and original player spawn required');
  time(originalTime);count(dotCount);count(overlayCount);
  this.dots=dots;this.originalSpawn={...playerSpec};this.savedSpawn={...playerSpec};
  this.originalTime=originalTime;this.savedTime=originalTime;this.special=new Map();this.overlays=new Map();if(allowGoalMisc===true)this.goals=new Map();
  for(const dot of dots){
   if(dot.ring&&dot.waystation)throw new Error('Combined ring/checkpoint is unqualified');
   if(dot.ring)this.special.set(dot.id,createStaticRingDot({color:dot.color??0,clockCount:dotCount}));
   if(dot.waystation){
    if(!Number.isInteger(dot.waystation.halfIndex)||![-1,1].includes(dot.waystation.direction))throw new Error('Explicit WY reset specification required');
    this.special.set(dot.id,createCheckpointDot(dotCount));
   }
   if(this.goals&&dot.kind==='goal')this.goals.set(dot.id,createGoalMisc({clockCount:overlayCount,rawBase:{x:dot.x-16,y:dot.y-15},allowGoalMisc:true}));
   if(dot.protected)this.overlays.set(dot.id,createProtectionOverlay(overlayCount));
  }
  this.reset({dotCount,overlayCount});
 }
 reset({restartLevel=false,dotCount=this.dotCount,overlayCount=this.overlayCount}={}){
  count(dotCount);count(overlayCount);this.dotCount=dotCount;this.overlayCount=overlayCount;
  if(restartLevel){
   this.savedSpawn={...this.originalSpawn};this.savedTime=this.originalTime;
   if(this.selectedCheckpoint!=null)this.special.get(this.selectedCheckpoint).reset(dotCount);
  }
  this.selectedCheckpoint=null;
  for(const [id,animation]of this.special){
   const dot=this.dot(id);if(dot.ring)animation.reset(dotCount);else animation.resetRound(dotCount);
   dot.humanCanGrab=true;dot.nonhumanCanGrab=true;dot.sourceCollidable=true;
  }
  // Plain WY frame persists through DOReset. Explicit DORestartLevel first
  // resets only the selected WY; selecting another WY also resets the old one.
  // Misc protection is not visited by DOReset: its frame/direction/reference
  // survive freeze, then one callback coalesces any changed clock after thaw.
  return {player:{...this.savedSpawn},remainingTime:this.savedTime};
 }
 dot(id){const dot=this.dots.find(d=>d.id===id);if(!dot)throw new Error('Unknown source dot');return dot;}
 bombLookChanged(id){if(this.dot(id).waystation)this.special.get(id).lookChanged();}
 humanRelease(id,{releasingActor,orphanOccupants}={}){
  const dot=this.dot(id);if(!dot.ring)return {changed:false};
  if(typeof orphanOccupants!=='function')throw new TypeError('Synchronous ring occupant adapter required');
  const result=this.special.get(id).release({human:true,clockCount:this.dotCount});
  if(result.changed){dot.humanCanGrab=false;orphanOccupants(id,releasingActor);}
  return result;
 }
 humanGrab(id,currentTime){
  const dot=this.dot(id);time(currentTime);const sounds=[],result={checkpointChanged:false,sounds};
  if(dot.waystation){
   if(this.savedSpawn.pivot!==id){
    this.savedSpawn={...this.savedSpawn,pivot:id,angle:((dot.waystation.halfIndex*2)&63)*TAU/64,direction:dot.waystation.direction};
    this.savedTime=currentTime;result.checkpointChanged=true;
   }
   if(this.selectedCheckpoint!==null&&this.selectedCheckpoint!==id)this.special.get(this.selectedCheckpoint).reset(this.dotCount);
   this.selectedCheckpoint=id;this.special.get(id).activate(this.dotCount);sounds.push(23);
  }
  if(dot.protected)sounds.push(46);
  return result;
 }
 // Nonhuman release has no ring-collapse effect; nonhuman grab/orphan hooks
 // belong to the source-ordered enemy adapter, not this human arrival method.
 observeClocks({dotCount,overlayCount,guestTick,freshGuestTick=guestTick}){
  count(dotCount);count(overlayCount);count(guestTick);count(freshGuestTick);this.dotCount=dotCount;this.overlayCount=overlayCount;
  for(const [id,animation]of this.special){
   const state=animation.observeClock(dotCount,guestTick,freshGuestTick),dot=this.dot(id);
   if(dot.ring){dot.humanCanGrab=state.humanAvailable;dot.nonhumanCanGrab=state.nonhumanAvailable;dot.sourceCollidable=state.visible;}
  }
  for(const animation of this.overlays.values())animation.observeClock(overlayCount);for(const animation of this.goals?.values()??[])animation.observeClock(overlayCount);
 }
 observeDotClocks(id,{dotCount,overlayCount,guestTick,freshGuestTick=guestTick}){
  count(dotCount);count(overlayCount);count(guestTick);count(freshGuestTick);this.dotCount=dotCount;this.overlayCount=overlayCount;
  const animation=this.special.get(id),dot=this.dot(id);if(animation){const state=animation.observeClock(dotCount,guestTick,freshGuestTick);if(dot.ring){dot.humanCanGrab=state.humanAvailable;dot.nonhumanCanGrab=state.nonhumanAvailable;dot.sourceCollidable=state.visible;}}
  this.overlays.get(id)?.observeClock(overlayCount);this.goals?.get(id)?.observeClock(overlayCount);
 }
 positionRiders(sourceIndex){if(this.goals)for(const[id,g]of this.goals){const d=this.dot(id);if(d.sourceIndex===sourceIndex)g.position({x:d.x-16,y:d.y-15});}}
 renderState(id){return {...(this.goals?.has(id)?{goal:this.goals.get(id).snapshot()}:{}),main:this.special.get(id)?.snapshot()??null,overlay:this.overlays.get(id)?.snapshot()??null};}
 snapshot(){return {selectedCheckpoint:this.selectedCheckpoint,savedSpawn:{...this.savedSpawn},originalTime:this.originalTime,savedTime:this.savedTime,
  dotCount:this.dotCount,overlayCount:this.overlayCount,dots:[...new Set([...this.special.keys(),...this.overlays.keys(),...(this.goals?.keys()??[])])].map(id=>({id,...this.renderState(id)}))};}
}
