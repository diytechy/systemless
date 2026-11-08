/** WPFindPrograms: signed references select only in-range stored programs.
 * A negative reference is never a last-element index or an implicit default.
 */
export function resolveActorProgram(reference, programs) {
  if(!Number.isInteger(reference)||reference< -32768||reference>32767||!Array.isArray(programs))
    throw new TypeError('Signed source reference and program array required');
  return reference>=0 && reference<programs.length?programs[reference]:null;
}

/** WAControlFromPC's action bits; the full grab/action mechanics remain with
 * the engine. Unrecognized bytes pass both flags false in the source.
 */
export function programActionFlags(character) {
  if(typeof character!=='string'||character.length!==1||character.charCodeAt(0)>255) throw new TypeError('One source byte required');
  return {grab:character==='s'||character==='f',reverse:character==='b'||character==='f'};
}

/** One instruction per eligible WADirectEnemy call: source frame multiple16,
 * not sliding. Call at the source callback stage, not every render or tick.
 * This helper models only ordinary looping actor programs (not dot programs).
 */
export function stepActorProgram(program,cursor,{frame,sliding=false}) {
  if(!Number.isInteger(frame)||!Number.isInteger(cursor)||cursor<0) throw new RangeError('Integer frame/cursor required');
  if(program===null) return {cursor,action:null};
  if(typeof program!=='string'||program.length===0||program.length>255||[...program].some(c=>c.charCodeAt(0)>255))
    throw new RangeError('Nonempty Pascal byte program required');
  if(cursor>=program.length) throw new RangeError('Program cursor outside string');
  if(sliding||(frame&15)!==0) return {cursor,action:null};
  return {cursor:(cursor+1)%program.length,action:programActionFlags(program[cursor])};
}

/** Source PC is an offset into the complete Pascal string. PC0 reads its
 * length byte, which can itself decode to b/f/s; it is not cursor0. */
export function stepSourceProgram(program,sourcePC,{frame,sliding=false}){
 if(typeof program!=='string'||program.length<1||program.length>255||[...program].some(c=>c.charCodeAt(0)>255))throw new RangeError('Nonempty Pascal byte program required');
 if(!Number.isInteger(sourcePC)||sourcePC<0||sourcePC>program.length)throw new RangeError('Source PC outside Pascal string');
 if(!Number.isInteger(frame))throw new RangeError('Integer source frame required');
 if(sliding||(frame&15)!==0)return {sourcePC,action:null};
 const character=sourcePC===0?String.fromCharCode(program.length):program[sourcePC-1];
 const next=sourcePC+1;
 return {sourcePC:next>program.length?1:next,action:programActionFlags(character)};
}

/** Bounded static bounce-only enemy. Each class-delta inner step animates,
 * invokes collision hooks, then consumes at a canonical integer cardinal.
 * Presentation angle is separate. Transfers/sliding remain explicit gates.
 * afterAnimate receives the private working copy and may apply a wall bounce.
 */
export function advanceBounceEnemy(state,delta,{program,findTarget,afterAnimate=()=>{}}){
 if(!Number.isInteger(delta)||delta<0||delta>255||!Number.isInteger(state?.frame)||state.frame<0||state.frame>63||![-1,1].includes(state.direction))throw new RangeError('Bounded canonical enemy state/delta required');
 if(state.sliding||typeof findTarget!=='function'||typeof afterAnimate!=='function')throw new Error('Static target/collision adapters required');
 if(typeof program!=='string'||!program.length||[...program].some(c=>c!=='b'))throw new Error('Only bounce programs are qualified');
 if(program.length>255||!Number.isInteger(state.sourcePC)||state.sourcePC<0||state.sourcePC>program.length)throw new RangeError('Source PC outside Pascal string');
 const next={...state,unwrappedFrame:state.unwrappedFrame??state.frame},events=[];
 if(!Number.isInteger(next.unwrappedFrame)||(next.unwrappedFrame&63)!==next.frame)throw new RangeError('Canonical/unwrapped frame mismatch');
 for(let step=0;step<delta;step++){
  next.unwrappedFrame+=next.direction;next.frame=next.unwrappedFrame&63;
  afterAnimate(next,step);
  if((next.unwrappedFrame&63)!==next.frame||![-1,1].includes(next.direction))throw new Error('Unqualified collision state change');
  const result=stepSourceProgram(program,next.sourcePC,{frame:next.frame});next.sourcePC=result.sourcePC;
  if(!result.action)continue;
  if(result.action.grab)throw new Error('Length-byte transfer is unqualified in bounce-only mode');
  if(!result.action.reverse)continue;
  const target=findTarget(next);
  if(target!==null&&target!==undefined&&target!==false){next.direction*=-1;events.push({type:'program-bounce',frame:next.frame,target});}
 }
 return {state:next,events};
}
