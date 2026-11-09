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

export function createElevatorSystem(specs,dotSpecs,{origin={x:74,y:72},clockCount=0,surfaceCount=0}={}){
 if(!Array.isArray(specs)||specs.length>12||!Array.isArray(dotSpecs)||dotSpecs.length>88)throw new RangeError('Source EL/dot capacities required');
 const ids=new Set();for(const d of dotSpecs){if(ids.has(d.id))throw new Error('Unique source dot identities required');ids.add(d.id);createUpDownState({...d,clockCount});}
 const controls=specs.map((spec,index)=>({...spec,...elevatorGeometry(spec,origin),index,visible:true,occupants:0,frame:3+2*spec.group})),contacts=new Map();let dots;
 const reset=(count,surface=0)=>{if(!integer(count,0,Number.MAX_SAFE_INTEGER))throw new RangeError('Source count required');contacts.clear();for(const c of controls){c.occupants=0;c.frame=3+2*c.group;c.visible=true;}dots=dotSpecs.map(d=>({id:d.id,...createUpDownState({...d,clockCount:count,surfaceCount:surface})}));};reset(clockCount,surfaceCount);
 return {
  reset,
  contact(actor,nextIndex){
   if(typeof actor!=='string'||!integer(nextIndex,-1,controls.length-1))throw new RangeError('Actor identity and first source contact required');
   const old=contacts.get(actor)??-1;if(old===nextIndex)return [];
   const events=[],next=controls[nextIndex];
   // ELActivate enters before releasing the previous control. Every entry
   // toggles the group, even while another actor holds the same button.
   if(next?.visible){
    for(const [i,d] of dots.entries())if(d.group===next.group){dots[i]={id:d.id,...activateUpDownState(d)};events.push({type:'toggle',dot:d.id,group:d.group,phase:dots[i].phase,step:dots[i].step});}
    next.occupants++;if(next.occupants===1)next.frame=4+2*next.group;
    events.push({type:'enter',actor,index:nextIndex,occupants:next.occupants});
   }
   if(old>=0){const previous=controls[old];previous.occupants--;if(previous.occupants<0)throw new Error('Source control occupancy underflow');if(!previous.occupants)previous.frame=3+2*previous.group;events.push({type:'leave',actor,index:old,occupants:previous.occupants});}
   contacts.set(actor,nextIndex);return events;
  },
  observeClock(count,{onPhase=()=>{},onLowered=()=>{},isFrozen=()=>false}={}){
   const events=[];
   for(const [i,d]of dots.entries()){
    if(isFrozen())break;
    const result=advanceUpDownState(d,count);dots[i]={id:d.id,...result.state};
    for(const e of result.events){const event={...e,dot:d.id};events.push(event);if(e.type==='phase')onPhase(d.id,{...dots[i]});else onLowered(d.id);}
   }
   return events;
  },
  observeSurfaceClock(count){dots=dots.map(d=>({id:d.id,...advanceUpDownSurface(d,count)}));},
  snapshot(){return {controls:controls.map(c=>({...c})),dots:dots.map(d=>({...d}))};}
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
