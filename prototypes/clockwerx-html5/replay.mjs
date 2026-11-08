// Bounded input-only playback for reproducible route checks. This never edits
// game state, skips hazards or claims a route is valid in the original engine.
export function createInputReplay(segments){
 if(!Array.isArray(segments)||!segments.length)throw new TypeError('Input segments required');
 const copy=segments.map(segment=>{
  if(!Array.isArray(segment)||segment.length!==2||!Number.isSafeInteger(segment[0])||segment[0]<1||
   ![null,'swing','flip','bounce'].includes(segment[1]))throw new TypeError('Invalid input segment');
  return [...segment];
 });
 let index=0,remaining=copy[0][0],step=0;
 return {
  next(){
   if(index===copy.length)return {};
   const action=copy[index][1];step++;remaining--;
   if(remaining===0){index++;remaining=copy[index]?.[0]??0;}
   return action?{[action]:true}:{};
  },
  get done(){return index===copy.length;},
  snapshot(){return {step,segment:index,remaining,done:index===copy.length};}
 };
}
