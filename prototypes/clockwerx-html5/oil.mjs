import {outlineCollision} from './hazards.mjs';

// Source-only, static-dot single-player primitives. This module does not enable
// a campaign level. The caller owns source sprite traversal and persistent MT
// clocks, human pivot notifications, freeze/death barriers and original outlines.
export const OIL_LIMITS=Object.freeze({puddles:11,droplets:32});
const initialFrames=[4,0,1,2];
const spriteOffsets=[[-25,-15],[23,-15],[-4,10],[21,12]];
const targetOffsets=[[0,0],[1,0],[0,1],[1,1]];
const riderOffsets=[[-9,0],[-9,0],[-1,-8],[-11,-8]];
const travelBases=[26,0,78,52];
const collisionPhases=new Set([4,5,6,7,8,19,20,21,22,23,24,25]);
function integer(n,min=0,max=0x7fffffff) {
  if(!Number.isInteger(n)||n<min||n>max) throw new RangeError('Invalid source integer');
  return n;
}
function point(p) {integer(p?.x,-32768,32767);integer(p?.y,-32768,32767);return p;}
function plus(p,dx,dy) {return {x:p.x+dx,y:p.y+dy};}
function deadline(now,delay) {integer(now);integer(delay,1);return integer(now+delay);}
function wrapFrame(s) {return s.frame>=s.max?s.min:s.frame+1;}

export function decodePuddleRecord(record) {
  const w=record?.rawWords;
  if(!Array.isArray(w)||w.length!==5) throw new TypeError('Expected five version8+ PU words');
  w.forEach(n=>integer(n,0,65535));integer(w[0],0,7);integer(w[1],0,10);integer(w[2],0,3);
  return {row:w[0],column:w[1],kind:w[2],activationMask:(w[3]*65536+w[4])>>>0};
}
export function activePuddleSpecs(records,activeMask=1) {
  integer(activeMask,1,0xffffffff);
  const specs=records.map(decodePuddleRecord).filter(s=>(s.activationMask&activeMask)!==0);
  if(specs.length>OIL_LIMITS.puddles) throw new RangeError('PU source capacity exceeded');
  return specs;
}

/** Bases are raw source sprite positions expressed in logical board coordinates.
 * Add RAW descriptors once. Target pixel is DOGetInitialPixel, not dot center. */
export function puddleGeometry(spec,origin={x:74,y:72}) {
  integer(spec.kind,0,3);integer(spec.row,0,7);integer(spec.column,0,10);point(origin);
  const grid=plus(origin,48*spec.column,48*spec.row),[x,y]=spriteOffsets[spec.kind];
  const [column,row]=targetOffsets[spec.kind];
  return {base:plus(grid,x,y),targetPixel:plus(grid,48*column-16,48*row-15)};
}
export function createPuddleState(spec,origin) {
  return {kind:spec.kind,...puddleGeometry(spec,origin),frame:initialFrames[spec.kind],
    min:0,max:0,triggered:false,visible:true,clockAttached:false,clockReference:0,
    wakeDeadline:0,targetDot:-1,endFrame:0};
}
export function puddleRiderBase(kind,pixel) {
  const [x,y]=riderOffsets[integer(kind,0,3)];
  return plus(point(pixel),x,y);
}
export function dropletRiderBase(state,pixel) {
  // Source keeps the grab displacement until arrival clears both words.
  // Travelling droplets have no acquired dot and never call this helper.
  return plus(point(pixel),state.moveDeadline===0&&state.dx>0?-48:0,state.moveDeadline===0&&state.dy>0?-48:0);
}
/** PUActivate: first eligible outline match only; one activation for each reset.
 * now is a fresh TickCount sample; delay150 is MTAdjustPeriod(150), in ticks. */
export function triggerPuddle(s,{now,clockCount,delay150}) {
  integer(clockCount);
  if(s.triggered)return {state:{...s},events:[]};
  return {state:{...s,triggered:true,min:s.kind===0?4:0,max:s.kind===0?7:3,
    clockAttached:true,clockReference:clockCount,wakeDeadline:deadline(now,delay150)},
    events:[{type:'sound',argument:29}]};
}
/** One observed source client-count change advances once, even after a jump.
 * acquireDot must reproduce DOCanGrab(false,targetPixel,GridPos(0,0),false,true)
 * and return {index,pixel} with the dot's RAW current sprite base, or null. */
export function observePuddle(s,{now,clockCount,acquireDot}) {
  integer(now);integer(clockCount);
  if(!s.clockAttached||clockCount===s.clockReference)return {state:{...s},events:[]};
  const n={...s,frame:wrapFrame(s),clockReference:clockCount},events=[];
  if(n.wakeDeadline!==0) {
    if(now<=n.wakeDeadline)return {state:n,events};
    const dot=acquireDot({...n.targetPixel});
    if(!dot)return {state:n,events};
    integer(dot.index,0,87);point(dot.pixel);
    const start=8+11*n.kind;
    Object.assign(n,{targetDot:dot.index,base:puddleRiderBase(n.kind,dot.pixel),min:start,max:start+11,
      frame:start,endFrame:start+11,wakeDeadline:0});
  } else if(n.frame>=n.endFrame) {
    n.visible=false;n.clockAttached=false;
    events.push({type:'createDroplet',dotIndex:n.targetDot});
  }
  return {state:n,events};
}

/** DP direction uses current dot pixels, never a shortest-path graph. */
export function dropletDirection(current,target,preferVertical=true) {
  point(current);point(target);
  if(preferVertical&&current.y===target.y)preferVertical=false;
  if(!preferVertical&&current.x===target.x)preferVertical=true;
  const dx=preferVertical?0:(current.x>target.x?-1:1);
  const dy=preferVertical?(current.y>target.y?-1:1):0;
  const direction=dx>0?3:dx<0?2:dy>0?1:0;
  return {preferVertical,dx,dy,direction,travelBase:travelBases[direction]};
}
/** Caller enforces lifetime allocation count <=32, including hidden droplets.
 * After creation call dropletArrived immediately, before the first callback. */
export function createDropletState(dotIndex,pixel,{now,delay150,delay700}) {
  integer(dotIndex,0,87);point(pixel);
  return {dotIndex,previousDot:-1,base:{...pixel},visible:true,clockAttached:true,
    frame:0,min:0,max:0,preferVertical:true,dx:0,dy:0,travelBase:0,
    moveDeadline:deadline(now,delay150),cloneDeadline:deadline(now,delay700)};
}
/** DPGrabbed uses human DOCanGrab permission, then pivot occupancy. No
 * protected-dot exemption. Sliding is checked here, not in DPWandGrabbed. */
export function dropletArrived(s,{humanCanGrab,heroPivot,heroSliding=false}) {
  const n={...s},events=[];
  if(!humanCanGrab) {
    n.visible=false;n.clockAttached=false;events.push({type:'fader',dotIndex:n.dotIndex});
  } else if(n.visible&&n.dotIndex===heroPivot&&!heroSliding)events.push({type:'death',reason:10});
  return {state:n,events};
}
export function dropletHumanGrab(s,dotIndex) {
  return s.visible&&s.dotIndex===dotIndex&&s.frame===0?[{type:'death',reason:10}]:[];
}

/** One DPFrameProc invocation. Hooks must use source raw pixels/outlines.
 * targetPixel is cached human pivot's current pixel. collideDot returns the
 * FIRST source DOInfo index, even when it is previousDot; do not skip it in
 * collision enumeration. onClone(event,parentSnapshot) runs synchronously at
 * the source direction stage, before parent base/frame/dot/deadline mutation.
 * Caller creates the clone, runs arrival, computes inverse-preference direction
 * and sets moveDeadline=1. The same event is retained in the returned diagnostic
 * events; do not dispatch it twice. Source appends the clone to layer11 and
 * snapshots its current MT count, preventing a same-count frame callback.
 */
export function advanceDroplet(s,{now,delay150,delay700,targetPixel,dotPixel,
  collideDot,humanCanGrab,heroPivot,heroSliding=false,getHumanSliding,bounds,onClone}) {
  integer(now);point(targetPixel);
  const n={...s,base:{...s.base}},events=[];
  if(!n.clockAttached)return {state:n,events};
  if(n.moveDeadline!==0) {
    if(now<=n.moveDeadline)return {state:n,events};
    const current=point(dotPixel(n.dotIndex));
    Object.assign(n,dropletDirection(current,targetPixel,n.preferVertical));
    if(now>n.cloneDeadline&&current.x!==targetPixel.x&&current.y!==targetPixel.y) {
      const event={type:'clone',dotIndex:n.dotIndex,preferVertical:!n.preferVertical};
      events.push(event);
      onClone?.({...event},{...n,base:{...n.base}});
      n.cloneDeadline=deadline(now,delay700);
    }
    n.base=plus(current,n.dx<0?-48:0,n.dy<0?-48:0);
    n.min=n.travelBase;n.max=n.travelBase+18;n.frame=n.travelBase;
    n.previousDot=n.dotIndex;n.dotIndex=-1;n.moveDeadline=0;
  }
  n.frame=wrapFrame(n);
  let phase=n.frame-n.travelBase;
  if(phase===0) {
    if(n.dotIndex<0)throw new RangeError('Arrival requires an acquired dot');
    const arrived=dropletArrived(n,{humanCanGrab:humanCanGrab(n.dotIndex),heroPivot,heroSliding:getHumanSliding?getHumanSliding():heroSliding});
    Object.assign(n,arrived.state);events.push(...arrived.events);
    n.moveDeadline=deadline(now,delay150);n.base={...point(dotPixel(n.dotIndex))};
    n.min=0;n.max=0;n.frame=0;phase=0;
  }
  if(phase===9) {n.min=n.travelBase+19;n.max=n.travelBase+25;n.frame=n.min;phase=19;}
  if(phase===19)n.base=plus(n.base,48*n.dx,48*n.dy);
  if(collisionPhases.has(phase)) {
    const index=collideDot({...n,base:{...n.base}});
    integer(index,-1,87);
    if(index>=0&&index!==n.previousDot) {
      n.dotIndex=index;n.min=n.travelBase;n.max=n.travelBase+18;n.frame=n.travelBase+9;phase=9;
      n.base=plus(point(dotPixel(index)),n.dx>0?-48:0,n.dy>0?-48:0);
    }
    if(!bounds||!['left','top','right','bottom'].every(k=>Number.isInteger(bounds[k])))
      throw new TypeError('Source universe clipping bounds required');
    if(n.base.x<bounds.left||n.base.x>bounds.right||n.base.y<bounds.top||n.base.y>bounds.bottom) {
      n.visible=false;n.clockAttached=false;
    }
  }
  if(phase===9)events.push({type:'sound',argument:9});
  return {state:n,events};
}

/** Original frame profile uses RAW descriptor coordinates and outlineIndex -1
 * means no collider. Source rows=null is a rectangle, not a missing outline. */
export function oilOutline(frame,base) {
  if(!frame||frame.outlineIndex<0)return null;
  point(base);
  return {left:base.x+frame.left,top:base.y+frame.top,right:base.x+frame.right,
    bottom:base.y+frame.bottom,rows:frame.rows,flipY:frame.flipY};
}
export function findDormantPuddleContact(states,frames,handOutline) {
  return states.findIndex(s=>!s.triggered&&s.visible&&outlineCollision(handOutline,oilOutline(frames[s.frame],s.base)));
}

/** Explicit integration gate; preparing helper tests never enables gameplay. */
export function oilUnsupportedReasons({multiplayer=false,dynamicDots=false,hyperDots=false,
  otherDotPrograms=false,otherOilInteractions=false,sourceTraversalQualified=false,
  sourceDotCollisionQualified=false,deathResetQualified=false,nativeTimingQualified=false,
  nativeVisualsQualified=false}={}) {
  return Object.entries({multiplayer,dynamicDots,hyperDots,otherDotPrograms,otherOilInteractions})
    .filter(([,v])=>v).map(([k])=>`unsupported:${k}`).concat(Object.entries({sourceTraversalQualified,
      sourceDotCollisionQualified,deathResetQualified,nativeTimingQualified,nativeVisualsQualified})
      .filter(([,v])=>!v).map(([k])=>`unqualified:${k}`));
}
