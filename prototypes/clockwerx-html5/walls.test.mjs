import test from 'node:test';
import assert from 'node:assert/strict';
import {compileWallTiles,actorChecksWalls,advanceWallContactGuard} from './walls.mjs';
const spec=(axis,fixed,start,startInset,end,endInset)=>({axis,fixed,start,startInset,end,endInset});
test('inclusive thirds create tiny joints and merge opposing arms',()=>{
  assert.deepEqual(compileWallTiles([spec(1,0,0,0,1,0)],{rows:2,columns:1}),[
    {row:0,column:0,frame:0},{row:0,column:0,frame:14},{row:1,column:0,frame:0}
  ]);
});
test('crossing and duplicate specifications union without duplicate sprites',()=>{
  const a=spec(1,0,0,1,1,1),b=spec(0,0,0,1,1,1);
  assert.deepEqual(compileWallTiles([a,b,a],{rows:2,columns:2}),[{row:0,column:0,frame:19}]);
});
test('endpoint insets can select a single short arm or a tiny joint',()=>{
  assert.deepEqual(compileWallTiles([spec(0,1,0,2,1,1)],{rows:2,columns:2}),[{row:1,column:0,frame:5}]);
  assert.deepEqual(compileWallTiles([spec(1,1,1,0,1,0)],{rows:2,columns:2}),[{row:1,column:1,frame:0}]);
});
test('bad coordinates and reversed intervals fail before unsafe indexing',()=>{
  for(const s of [spec(2,0,0,0,1,0),spec(1,4,0,0,1,0),spec(1,0,1,2,1,2),spec(0,0,-1,0,1,0)])
    assert.throws(()=>compileWallTiles([s],{rows:2,columns:2}),RangeError);
});
test('wall permission is independent of type and activation mask',()=>{
  assert.equal(actorChecksWalls(0),false);assert.equal(actorChecksWalls(1),true);assert.equal(actorChecksWalls(255),true);
  assert.throws(()=>actorChecksWalls(-1),RangeError);
});
test('fourth consecutive callback is lethal and a gap clears the guard',()=>{
  let n=0;for(let i=1;i<=4;i++){const r=advanceWallContactGuard(n,true);n=r.count;assert.equal(r.lethal,i===4);}
  assert.deepEqual(advanceWallContactGuard(n,false),{count:0,lethal:false,soundArgument:null});
  assert.equal(advanceWallContactGuard(0,true).lethal,false);
});
