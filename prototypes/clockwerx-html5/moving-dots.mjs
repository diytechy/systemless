// Source moving primitive. Caller owns separate scene admission and clocks.
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const pixel=p=>{if(!p||!integer(p.x,-32768,32767)||!integer(p.y,-32768,32767))throw new TypeError('Qualified signed-word source pixel required');return {x:p.x,y:p.y};};
const callback=f=>{if(typeof f!=='function'||f.constructor?.name==='AsyncFunction')throw new TypeError('Synchronous moving-dot rider adapter required');return f;};
const invoke=(f,...a)=>{const value=f(...a);if(value&&typeof value.then==='function')throw new TypeError('Moving-dot rider adapter returned a Promise');};
const count=n=>{if(!integer(n,0,Number.MAX_SAFE_INTEGER))throw new RangeError('Nonnegative source class count required');};

export function effectiveMovingCell(raw,permissions,activeMask=1){
 if(!integer(raw,0,65535)||!integer(permissions,0,65535)||!integer(activeMask,1,15))throw new TypeError('Source dot words and explicit mode mask required');
 return permissions&activeMask?raw:raw&~(0x2000|0x40|0x20|0x8|0x4|0x2|0x300);
}

export function movingProgramCell(cell){
 const p=cell?.inlineProgram,text=p?.text;
 if(!(cell?.flagsRaw&0x80)||typeof text!=='string'||!text.length||text.length>127||!/^[npswe]+$/.test(text)||!Number.isInteger(cell.offset)||p.offset!==cell.offset+4||typeof p.rawHex!=='string'||!/^(?:[0-9a-f]{2})+$/.test(p.rawHex))throw new Error('Original inline moving Pascal program and byte offsets required');
 const expected=text.length.toString(16).padStart(2,'0')+[...text].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''),padding=(1+text.length)%2;
 if(typeof p.paddingHex!=='string'||p.paddingHex.length!==2*padding||padding&&!/^[0-9a-f]{2}$/.test(p.paddingHex)||p.rawHex!==expected+p.paddingHex||cell.byteLength!==4+p.rawHex.length/2||cell.rawHex!==cell.flagsRaw.toString(16).padStart(4,'0')+cell.secondaryRaw.toString(16).padStart(4,'0')+p.rawHex)throw new Error('Moving Pascal bytes/text/padding/source cell mismatch');
 return {text,offset:p.offset,rawHex:p.rawHex,paddingHex:p.paddingHex};
}

// DOPlanMove2460. Unknown source bytes consume a full stationary instruction;
// qualified declarations below deliberately require the observed n/p/s/w/e set.
export function movingInstruction(opcode){
 if(typeof opcode!=='string'||opcode.length!==1||opcode.charCodeAt(0)>255)throw new TypeError('One source program byte required');
 const vector={n:{x:0,y:-3},s:{x:0,y:3},w:{x:-3,y:0},e:{x:3,y:0}}[opcode];
 return {opcode,active:!!vector,velocity:vector??{x:0,y:0}};
}

// Admission bound for the first rich composition, not a source opcode rule.
// Closing the finite cycle keeps its whole repeated trajectory in word range.
export function assertClosedMovingProgram(program,origin){
 const p=pixel(origin);if(typeof program!=='string'||!program.length||program.length>127||!/^[npswe]+$/.test(program))throw new Error('Bounded ordinary moving program required');
 let x=p.x,y=p.y;for(const c of program){const {velocity:v}=movingInstruction(c);x+=16*v.x;y+=16*v.y;pixel({x,y});}
 if(x!==p.x||y!==p.y)throw new Error('First moving composition requires a closed bounded program cycle');return true;
}

export const MOVING_RIDER_ORDER=Object.freeze(['WA','HY','DO','DP','PU','DE']);
export function positionMovingRiders(handlers,sourceIndex,currentPixel,{skipSpecialMisc=false}={}){
 if(!integer(sourceIndex,0,87))throw new RangeError('Serialized source dot index0..87 required');
 if(typeof skipSpecialMisc!=='boolean')throw new TypeError('Explicit source rider skip flag required');
 const p=pixel(currentPixel);for(const key of MOVING_RIDER_ORDER)callback(handlers?.[key]);
 for(const key of MOVING_RIDER_ORDER)invoke(handlers[key],sourceIndex,{...p},{skipSpecialMisc});
}

export function createMovingDot(spec,{allowMovingDots=false,classCount=0,onRiders}={}){
 if(allowMovingDots!==true)throw new Error('Separate moving-dot primitive capability required');
 if(!spec||spec.id===undefined||!integer(spec.sourceIndex,0,87)||!integer(spec.row,0,7)||!integer(spec.column,0,10)||spec.sourceIndex!==spec.row*11+spec.column||typeof spec.program!=='string'||!spec.program.length||spec.program.length>127||!/^[npswe]+$/.test(spec.program))throw new Error('Explicit source slot, original grid and bounded n/p/s/w/e program required');
 count(classCount);callback(onRiders);
 const originalPixel=pixel(spec.originalPixel),identity=Object.freeze({id:spec.id,sourceIndex:spec.sourceIndex,row:spec.row,column:spec.column,program:spec.program});
 let state={...identity,originalPixel,mainPixel:{...originalPixel},shadowPixel:{...originalPixel},motionType:1,sourcePC:1,progress:0,duration:16,clockReference:classCount,intermediate:{valid:false,moving:false,pixel:null}};
 const snapshot=()=>structuredClone({...state,currentPixel:state.mainPixel});
 const plan=()=>{const instruction=movingInstruction(identity.program[state.sourcePC-1]);state.sourcePC=state.sourcePC===identity.program.length?1:state.sourcePC+1;Object.assign(state,instruction);};
 const riders=()=>invoke(onRiders,identity.sourceIndex,{...state.mainPixel},snapshot());
 const one=()=>{
  state.progress++;
  if(state.active){
   // This bounded primitive rejects word overflow rather than inventing an
   // unqualified wrap policy. Actual51 trajectories remain within these bounds.
   const main=pixel({x:state.mainPixel.x+state.velocity.x,y:state.mainPixel.y+state.velocity.y}),shadow=pixel({x:state.shadowPixel.x+state.velocity.x,y:state.shadowPixel.y+state.velocity.y});
   state.mainPixel=main;state.shadowPixel=shadow;riders();
  }
  if(state.progress>=state.duration){state.motionType=1;state.progress=0;state.duration=16;plan();}
 };
 const reset=currentCount=>{count(currentCount);if(currentCount<state.clockReference)throw new RangeError('Persistent source class count cannot rewind');state.motionType=1;state.progress=0;state.duration=16;state.sourcePC=1;plan();state.clockReference=currentCount;state.mainPixel={...originalPixel};state.shadowPixel={...originalPixel};riders();return snapshot();};
 // DOInitMoveInfo does not clear the intermediate cache on reset. A later
 // single dispatch clears its validity; cached bytes otherwise remain intact.
 reset(classCount);
 return {snapshot,reset,
  dispatch(currentCount,classDelta){
   count(currentCount);if(currentCount<state.clockReference||!integer(classDelta,0,255))throw new RangeError('Monotonic class count and bounded shared delta required');
   if(currentCount===state.clockReference)return {dispatched:false,callbacks:0,state:snapshot()};
   state.clockReference=currentCount;one();
   if(classDelta>1){state.intermediate={valid:true,moving:state.motionType===1,pixel:{...state.mainPixel}};one();return {dispatched:true,callbacks:2,state:snapshot()};}
   state.intermediate.valid=false;return {dispatched:true,callbacks:1,state:snapshot()};
  }
 };
}
