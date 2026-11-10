// Gated source preparation. An active scene still requires independent
// qualification of moving positions, riders, sprite order and presentation.
import {outlineCollision} from './hazards.mjs';

const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function decodeElevatorRecord(record){
 const w=record?.rawWords;
 if(!Array.isArray(w)||w.length!==6||w.some(n=>!integer(n,0,65535)))throw new TypeError('Six source EL words required');
 const [row,column,subcell,group,hi,lo]=w;
 if(row>7||column>10||subcell>3||group>2)throw new RangeError('Unqualified EL grid, subcell or group');
 return {row,column,subcell,group,activationMask:hi*65536+lo};
}
export function activeElevatorSpecs(records,activeMask=1){
 if(!integer(activeMask,1,0xffffffff))throw new RangeError('Explicit active mask required');
 const specs=records.map(decodeElevatorRecord).filter(s=>(s.activationMask&activeMask)!==0);
 if(specs.length>12)throw new RangeError('Source EL capacity exceeded');
 return specs;
}
export function elevatorGeometry(spec,origin={x:74,y:72}){
 const s=decodeElevatorRecord({rawWords:[spec.row,spec.column,spec.subcell,spec.group,0,1]});
 if(!Number.isInteger(origin.x)||!Number.isInteger(origin.y))throw new RangeError('Integer logical origin required');
 // RAW3400 descriptors are added once. Native cold geometry independently
 // fixes this origin; the 23px background body is not the collision shape.
 return {x:origin.x+s.column*48-36+24*(s.subcell%2),y:origin.y+s.row*48-35+24*Math.floor(s.subcell/2)};
}
// ELBombed uses orientation-specific source grid bounds, independently of
// the pressure glyph's collision outline or the round background body.
export function bombHitsElevatorControl(control,grid){
 if(!integer(control?.row,0,7)||!integer(control?.column,0,10)||!integer(control?.subcell,1,3)||!integer(grid?.row,0,6)||!integer(grid?.column,0,9))throw new RangeError('Qualified EL blast grid and subcell1..3 required');
 const dr=control.row-grid.row,dc=control.column-grid.column;
 return control.subcell===1?dc===0&&dr>=0&&dr<2:control.subcell===2?dr===0&&dc>=0&&dc<2:dr===0&&dc===0;
}
export function createUpDownState({group,initialLowered=false,clockCount=0,surfaceCount=0}){
 if(!integer(group,0,2)||typeof initialLowered!=='boolean'||!integer(clockCount,0,Number.MAX_SAFE_INTEGER)||!integer(surfaceCount,0,Number.MAX_SAFE_INTEGER))throw new RangeError('Explicit source up/down state required');
 return {group,phase:initialLowered?0:12,step:0,humanAvailable:!initialLowered,mainVisible:!initialLowered,clockReference:clockCount,surfaceFrame:126+9*group+(initialLowered?0:1),surfaceReference:surfaceCount};
}
function valid(s){
 if(!s||!integer(s.group,0,2)||!integer(s.phase,0,12)||![-1,0,1].includes(s.step)||typeof s.humanAvailable!=='boolean'||typeof s.mainVisible!=='boolean'||!integer(s.clockReference,0,Number.MAX_SAFE_INTEGER)||!integer(s.surfaceReference,0,Number.MAX_SAFE_INTEGER)||!integer(s.surfaceFrame,126+9*s.group,134+9*s.group))throw new RangeError('Bounded source up/down state required');
}
export function activateUpDownState(state){
 valid(state);const s={...state};
 if(s.step){s.step=-s.step;if(s.step>0&&s.phase===12||s.step<0&&s.phase===0)s.step=0;}
 else s.step=s.phase===12?-1:1;
 return s;
}
export function advanceUpDownState(state,clockCount){
 valid(state);if(!integer(clockCount,state.clockReference,Number.MAX_SAFE_INTEGER))throw new RangeError('Monotonic source class1 count required');
 const s={...state},events=[];
 if(clockCount===s.clockReference)return {state:s,events};
 s.clockReference=clockCount;if(!s.step)return {state:s,events};
 if(s.step<0&&s.phase===12)s.humanAvailable=false;
 s.phase+=s.step;
 if(s.phase===12){s.step=0;s.humanAvailable=true;}
 if(s.phase===0){s.step=0;events.push({type:'lowered'});}
 s.mainVisible=s.phase>=2;
 if(s.phase<12)s.surfaceFrame=126+9*s.group;
 events.unshift({type:'phase',phase:s.phase});
 return {state:s,events};
}
export function advanceUpDownSurface(state,clockCount){
 valid(state);if(!integer(clockCount,state.surfaceReference,Number.MAX_SAFE_INTEGER))throw new RangeError('Monotonic source surface count required');
 const s={...state};if(clockCount===s.surfaceReference)return s;s.surfaceReference=clockCount;
 const base=126+9*s.group;s.surfaceFrame=s.phase===12?(s.surfaceFrame>=base+8?base+1:s.surfaceFrame+1):base;return s;
}
export function upDownPlacement(state,origin){
 valid(state);if(!Number.isInteger(origin?.x)||!Number.isInteger(origin?.y))throw new RangeError('Original integer dot position required');
 const depth=12-state.phase;
 return {x:origin.x-depth,y:origin.y+depth,humanCanGrab:state.humanAvailable,nonhumanCanGrab:true,sourceCollidable:state.mainVisible,upDownPhase:state.phase,upDownVisible:state.mainVisible};
}

// Opt-in DO TYPE2 sprite primitive for the ordinary-moving/up-down join.
// DOFrameProc262e runs once, then once more for delta>1. Only TYPE1 writes
// its intermediate cache. DOInitUpDownInfo332e leaves sprite clock refs and
// TYPE3 frame/step untouched on an ordinary raised reset.
export function createSourceUpDownDot(spec,{allowMovingElevators=false,classCount=0,surfaceCount=0,onRiders,onLowered=()=>{}}={}){
 if(allowMovingElevators!==true)throw new Error('Separate moving/up-down capability required');
 const sync=f=>{if(typeof f!=='function'||f.constructor?.name==='AsyncFunction')throw new TypeError('Synchronous TYPE2 rider/lowered adapters required');};
 const invoke=(f,...args)=>{const v=f(...args);if(v&&typeof v.then==='function')throw new TypeError('TYPE2 adapter returned a Promise');};
 if(!spec||spec.id===undefined||!integer(spec.sourceIndex,0,87)||!integer(spec.row,0,7)||!integer(spec.column,0,10)||spec.sourceIndex!==spec.row*11+spec.column||spec.group!==0||spec.initialLowered!==false||spec.originalPixel?.x!==74+48*spec.column||spec.originalPixel?.y!==72+48*spec.row)throw new Error('Raised channel0 TYPE2 source grid declaration required');
 sync(onRiders);sync(onLowered);const base={...spec.originalPixel};
 let s={id:spec.id,sourceIndex:spec.sourceIndex,row:spec.row,column:spec.column,...createUpDownState({group:0,initialLowered:false,clockCount:classCount,surfaceCount}),motionType:2,mainPixel:{...base},shadowPixel:{...base},surfaceStep:1,capFrame:158,capVisible:false};
 const snapshot=()=>structuredClone({...s,originalPixel:base,currentPixel:s.mainPixel,intermediate:{valid:false,moving:false,pixel:null},misc3:{group:300,frame:s.surfaceFrame,first:127,last:134,step:s.surfaceStep,reference:s.surfaceReference,visible:true,layer:5,rawBase:{x:base.x-16,y:base.y-15}},misc4:{group:300,frame:s.capFrame,visible:s.capVisible,layer:4,rawBase:{x:base.x-16,y:base.y-15}}});
 const one=()=>{
  if(!s.step)return;
  const step=s.step;if(step<0&&s.phase===12)s.humanAvailable=false;
  s.mainPixel={x:s.mainPixel.x+step,y:s.mainPixel.y-step};s.shadowPixel={x:s.shadowPixel.x+2*step,y:s.shadowPixel.y};
  // Source translates and positions riders BEFORE changing the phase word.
  invoke(onRiders,s.sourceIndex,{...s.mainPixel},{skipSpecialMisc:true,state:snapshot()});s.phase+=step;
  if(s.phase===12){s.step=0;s.humanAvailable=true;}
  if(s.phase===0){s.step=0;invoke(onLowered,s.id,snapshot());}
  s.mainVisible=s.phase>=2;s.capVisible=s.phase<6;if(s.capVisible)s.capFrame=158-s.phase;
  if(s.phase<12){s.surfaceFrame=126;s.surfaceStep=0;}else s.surfaceStep=1;
 };
 return {snapshot,
  activate(){const a=activateUpDownState(s);s.step=a.step;return snapshot();},
  dispatch(currentCount,classDelta){
   if(!integer(currentCount,s.clockReference,Number.MAX_SAFE_INTEGER)||!integer(classDelta,0,255))throw new RangeError('Persistent TYPE2 class count and bounded delta required');
   if(currentCount===s.clockReference)return {dispatched:false,callbacks:0,state:snapshot()};
   s.clockReference=currentCount;one();if(classDelta>1)one();return {dispatched:true,callbacks:classDelta>1?2:1,state:snapshot()};
  },
  observeSurface(currentCount){
   if(!integer(currentCount,s.surfaceReference,Number.MAX_SAFE_INTEGER))throw new RangeError('Persistent TYPE3 count required');
   if(currentCount!==s.surfaceReference){s.surfaceReference=currentCount;s.surfaceFrame+=s.surfaceStep;if(s.surfaceFrame>134)s.surfaceFrame=127;}return snapshot();
  },
  reset(){s.mainPixel={...base};s.shadowPixel={...base};s.phase=12;s.step=0;s.humanAvailable=true;s.mainVisible=true;s.capVisible=false;return snapshot();}
 };
}

export function createElevatorSystem(specs,dotSpecs,{origin={x:74,y:72},clockCount=0,surfaceCount=0,allowSourceDotDispatch=false,onRiders,onLowered}={}){
 if(!Array.isArray(specs)||specs.length>12||!Array.isArray(dotSpecs)||dotSpecs.length>88)throw new RangeError('Source EL/dot capacities required');
 const ids=new Set();for(const d of dotSpecs){if(ids.has(d.id))throw new Error('Unique source dot identities required');ids.add(d.id);createUpDownState({...d,clockCount});}
 if(allowSourceDotDispatch&&(!dotSpecs.length||origin.x!==74||origin.y!==72||specs.some(s=>s.group!==0||![1,2,3].includes(s.subcell))))throw new Error('Separate channel0 source TYPE2 dispatcher required');
 const sourceDots=allowSourceDotDispatch?dotSpecs.map(d=>createSourceUpDownDot(d,{allowMovingElevators:true,classCount:clockCount,surfaceCount,onRiders,onLowered})):null;
 const controls=specs.map((spec,index)=>({...spec,...elevatorGeometry(spec,origin),index,visible:true,occupants:0,frame:3+2*spec.group})),contacts=new Map();let dots;
 const currentDots=()=>sourceDots?sourceDots.map(d=>d.snapshot()):dots;
 const reset=(count,surface=0)=>{if(!integer(count,0,Number.MAX_SAFE_INTEGER))throw new RangeError('Source count required');contacts.clear();for(const c of controls){c.occupants=0;c.frame=3+2*c.group;c.visible=true;delete c.burnt;}if(sourceDots)sourceDots.forEach(d=>d.reset());else dots=dotSpecs.map(d=>({id:d.id,...createUpDownState({...d,clockCount:count,surfaceCount:surface})}));};reset(clockCount,surfaceCount);
 return {
  reset,
  // Unlinked blast preparation: the scene must also reproduce the source
  // frame9 background stamp. Hiding retains contacts until the actor leaves.
  bomb(grid){
   return controls.filter(c=>bombHitsElevatorControl(c,grid)).map(c=>{c.visible=false;c.burnt=true;return {type:'bombed',index:c.index,backgroundFrame:9};});
  },
  contact(actor,nextIndex){
   if(typeof actor!=='string'||!integer(nextIndex,-1,controls.length-1))throw new RangeError('Actor identity and first source contact required');
   const old=contacts.get(actor)??-1;if(old===nextIndex)return [];
   const events=[],next=controls[nextIndex];
   // ELActivate enters before releasing the previous control. Every entry
   // toggles the group, even while another actor holds the same button.
   if(next?.visible){
    for(const [i,d] of currentDots().entries())if(d.group===next.group){const changed=sourceDots?sourceDots[i].activate():(dots[i]={id:d.id,...activateUpDownState(d)});events.push({type:'toggle',dot:d.id,group:d.group,phase:changed.phase,step:changed.step});}
    next.occupants++;if(next.occupants===1)next.frame=4+2*next.group;
    events.push({type:'enter',actor,index:nextIndex,occupants:next.occupants});
   }
   if(old>=0){const previous=controls[old];previous.occupants--;if(previous.occupants<0)throw new Error('Source control occupancy underflow');if(!previous.occupants)previous.frame=3+2*previous.group;events.push({type:'leave',actor,index:old,occupants:previous.occupants});}
   contacts.set(actor,next?.visible?nextIndex:-1);return events;
  },
  observeClock(count,{onPhase=()=>{},onLowered=()=>{},isFrozen=()=>false}={}){
   if(sourceDots)throw new Error('Joined TYPE2 must dispatch in source DOT cell order');
   const events=[];
   for(const [i,d]of dots.entries()){
    if(isFrozen())break;
    const result=advanceUpDownState(d,count);dots[i]={id:d.id,...result.state};
    for(const e of result.events){const event={...e,dot:d.id};events.push(event);if(e.type==='phase')onPhase(d.id,{...dots[i]});else onLowered(d.id);}
   }
   return events;
  },
  dispatchDot(id,count,delta){if(!sourceDots)throw new Error('Separate source TYPE2 dispatcher required');const d=sourceDots.find(d=>d.snapshot().id===id);if(!d)throw new Error('Unknown source TYPE2 identity');return d.dispatch(count,delta);},
  observeSurfaceClock(count){if(sourceDots)sourceDots.forEach(d=>d.observeSurface(count));else dots=dots.map(d=>({id:d.id,...advanceUpDownSurface(d,count)}));},
  snapshot(){return {controls:controls.map(c=>({...c})),dots:currentDots().map(d=>({...d}))};}
 };
}
export function findElevatorContact(handOutline,controls,profile){
 if(!profile?.groups?.['3400']?.frames)throw new Error('Original3400 collision profile required');
 return controls.findIndex(c=>{
  if(c.visible===false)return false;const f=profile.groups['3400'].frames[c.frame];
  if(!f)throw new Error('Missing source EL frame');
  return outlineCollision(handOutline,{...f,left:f.left+c.x,right:f.right+c.x,top:f.top+c.y,bottom:f.bottom+c.y});
 });
}
