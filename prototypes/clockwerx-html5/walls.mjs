/** Build the source wall tile union (WLSpec2Globals, CODE6:ad5a).
 * axis is 1 for vertical, 0 for horizontal. fixed is the column/row;
 * the inclusive subsegment interval is 3*start+startInset..3*end-endInset.
 * These are tile selectors, NOT uniform 16px collision line segments.
 */
export function compileWallTiles(specs, {rows=8, columns=11}={}) {
  if (![rows,columns].every(n=>Number.isInteger(n)&&n>0)) throw new RangeError('Invalid grid');
  const cells=Array.from({length:rows*columns},(_,i)=>({row:Math.floor(i/columns),column:i%columns,vertical:false,horizontal:false,mask:0}));
  for (const s of specs) {
    if (![s.axis,s.fixed,s.start,s.startInset,s.end,s.endInset].every(Number.isInteger) ||
        ![0,1].includes(s.axis) || ![0,1,2].includes(s.startInset) || ![0,1,2].includes(s.endInset))
      throw new RangeError('Unsupported wall specification');
    const first=3*s.start+s.startInset,last=3*s.end-s.endInset;
    if (first<0 || last<first || s.fixed<0 || s.fixed>=(s.axis?columns:rows) || Math.floor(last/3)>=(s.axis?rows:columns))
      throw new RangeError('Wall interval outside grid');
    for(let q=first;q<=last;q++) {
      const index=Math.floor(q/3),part=q%3;
      const c=cells[(s.axis?index:s.fixed)*columns+(s.axis?s.fixed:index)];
      if(part===0) c[s.axis?'vertical':'horizontal']=true;
      else c.mask|=s.axis?(part===1?8:2):(part===1?4:1);
    }
  }
  // Source scans row-major, vertical tiny tile, horizontal tiny tile, then cross.
  return cells.flatMap(c=>[
    ...(c.vertical?[{row:c.row,column:c.column,frame:0}]:[]),
    ...(c.horizontal?[{row:c.row,column:c.column,frame:1}]:[]),
    ...(c.mask?[{row:c.row,column:c.column,frame:4+c.mask}]:[])
  ]);
}

/** WACheckWalls gates on the saved version-12 byte, not actor color. */
export function actorChecksWalls(version12Byte) {
  if (!Number.isInteger(version12Byte)||version12Byte<0||version12Byte>255) throw new RangeError('Expected source byte');
  return version12Byte!==0;
}

/** WAHeroOneFrame's consecutive wall/door contact guard. Once per source
 * callback, after collision checks and before input and animation. A normal
 * contact reverses direction; this guard alone reports the fourth-hit death.
 */
export function advanceWallContactGuard(previousCount, collided) {
  if (!Number.isInteger(previousCount)||previousCount<0) throw new RangeError('Invalid contact count');
  const count=collided?previousCount+1:0;
  return {count, lethal:count>3, soundArgument:count>3?36:null};
}
