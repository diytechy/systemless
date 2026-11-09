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

/** Static WLBombed topology is retained after the collision-active byte clears.
 * Original cross, vertical and horizontal records are distinct at one cell.
 * This helper is called only by the separately qualified BO/EX/WY/WL join. */
export function validateBombWallTiles(walls){
 if(!Array.isArray(walls))throw new TypeError('Source wall tile declarations required');
 const keys=new Set(),ids=new Set();
 for(const w of walls){
  if(![w.id,w.row,w.column,w.x,w.y,w.frame].every(Number.isInteger)||w.id<0||w.row<0||w.row>7||w.column<0||w.column>10||![0,1,...Array.from({length:15},(_,i)=>i+5)].includes(w.frame)||w.visible!==undefined&&typeof w.visible!=='boolean')throw new Error('Static original wall tile identity required');
  const key=`${w.row},${w.column},${w.frame<2?w.frame:2}`;if(keys.has(key)||ids.has(w.id))throw new Error('Unique source wall topology required');keys.add(key);ids.add(w.id);
 }
 return true;
}

/** CODE6:b91c WLBombed: paint cross4, vertical2 by row, horizontal3 by column,
 * before clearing each collision byte. Presence is not the active byte, so an
 * already-hidden tile still repaints on a later blast. No visibility filter. */
export function bombStationaryWalls(walls,grid,onPaint){
 validateBombWallTiles(walls);
 if(!Number.isInteger(grid?.row)||!Number.isInteger(grid?.column)||grid.row<0||grid.row>6||grid.column<0||grid.column>9||typeof onPaint!=='function')throw new Error('Static source blast grid and synchronous wall paint required');
 const result=[],hit=(row,column,kind,frame)=>{
  const w=walls.find(w=>w.row===row&&w.column===column&&(kind==='cross'?w.frame>=5:w.frame===kind));if(!w)return;
  const rawBase={x:w.x-6,y:w.y-5},paint={kind:'WL',id:w.id,frame,row,column,x:w.x,y:w.y,rawBase,invalidation:{...rawBase,width:48,height:48}};
  const value=onPaint(paint,w);if(value&&typeof value.then==='function')throw new TypeError('Synchronous source wall painter required');
  w.visible=false;result.push(paint);
 };
 hit(grid.row,grid.column,'cross',4);
 for(let row=grid.row;row<=grid.row+1;row++)hit(row,grid.column,0,2);
 for(let column=grid.column;column<=grid.column+1;column++)hit(grid.row,column,1,3);
 return result;
}
