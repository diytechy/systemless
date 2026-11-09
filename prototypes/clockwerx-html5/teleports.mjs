// Unlinked source preparation: HYStream2Spec/HYCreate and WATeleport.
// Admission, sprite clocks, fading and gameplay still need scene qualification.
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const sync=(callback,...args)=>{
 if(typeof callback!=='function')throw new TypeError('Synchronous teleport adapter required');
 const value=callback(...args);
 if(value&&typeof value.then==='function')throw new TypeError('Asynchronous teleport effects are unsupported');
 return value;
};

export function decodeTeleportRecord(record){
 const words=record?.rawWords;
 if(!Array.isArray(words)||words.length!==5||words.some(n=>!integer(n,0,65535)))throw new TypeError('Five version12 HY words required');
 const [row,column,channel,hi,lo]=words;
 // Original group2000 has frame0 plus25 complementary endpoint pairs.
 if(row>7||column>10||channel>24)throw new RangeError('Qualified HY position and source channel required');
 return {row,column,channel,activationMask:hi*65536+lo};
}

export function activeTeleportSpecs(records,activeMask=1){
 if(!Array.isArray(records)||!integer(activeMask,1,0xffffffff))throw new TypeError('Source HY records and explicit mask required');
 const specs=records.map(decodeTeleportRecord).filter(s=>(s.activationMask&activeMask)!==0);
 if(specs.length>22)throw new RangeError('Source HY capacity exceeded');
 return specs;
}

// Source supports order-dependent duplicate/unmatched records. This bounded
// adapter deliberately rejects them; a missing source property is not a pair.
export function pairTeleportSpecs(specs,dots){
 if(!Array.isArray(specs)||specs.length>22||!Array.isArray(dots))throw new TypeError('Bounded HY specs and source dots required');
 const seen=new Set(),channels=new Map();
 const endpoints=specs.map((s,index)=>{
  const checked=decodeTeleportRecord({rawWords:[s.row,s.column,s.channel,0,1]});
  const dot=dots.find(d=>d.row===checked.row&&d.column===checked.column&&d.present);
  if(!dot||dot.id===undefined)throw new Error('HY endpoint must name a present source dot');
  if(seen.has(dot.id))throw new Error('Duplicate HY endpoints require separate source qualification');
  seen.add(dot.id);
  const entries=channels.get(checked.channel)||[];entries.push(index);channels.set(checked.channel,entries);
  return {index,dot:dot.id,channel:checked.channel,firstFrame:2*checked.channel+1,lastFrame:2*checked.channel+2};
 });
 for(const entries of channels.values()){
  if(entries.length!==2)throw new Error('Exactly two active HY endpoints per channel required');
  const [a,b]=entries;
  endpoints[a].partner=endpoints[b].dot;endpoints[b].partner=endpoints[a].dot;
  endpoints[a].initialFrame=endpoints[a].firstFrame;endpoints[b].initialFrame=endpoints[b].lastFrame;
 }
 return endpoints;
}

// WATeleport does not perform WAGrab, release/arrival, destination permission
// or destination bonus/checkpoint hooks. DOGrabbed owns the later DP hook.
// The injected fader/placement/collision adapters are intentionally not guessed.
export function teleportOrdinaryActor(actor,destination,{sound,startFader,place,checkWalls,onWallDeath}={}){
 if(!actor||![0,1,2,3,4,6].includes(actor.sourceActorType)||!integer(actor.sourceSlot,0,30)||
   ((actor.sourceSlot<2)!==[0,6].includes(actor.sourceActorType)))throw new TypeError('Explicit source WA slot and type required');
 if(actor.sourceActorType===4)return false;
 if(!integer(actor.frame,0,63)||!Number.isInteger(actor.unwrappedFrame)||(actor.unwrappedFrame&63)!==actor.frame||![-1,1].includes(actor.direction))throw new TypeError('Canonical source actor phase required');
 if(!destination||destination.id===undefined||!integer(destination.x,-32768,32767)||!integer(destination.y,-32768,32767))throw new TypeError('Current source destination position required');
 if(![sound,startFader,place,checkWalls,onWallDeath].every(f=>typeof f==='function'))throw new TypeError('Complete synchronous teleport adapters required');
 if(actor.sourceSlot<2)sync(sound,26,actor);
 sync(startFader,actor);
 actor.pivot=destination.id;
 sync(place,actor,destination);
 // Full WACheckWalls includes WABounce/WAReverse side effects on a hit;
 // a pure overlap predicate is insufficient. They precede RODied(36).
 if(sync(checkWalls,actor))sync(onWallDeath,actor,{reason:36});
 return true;
}
