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
