import test from 'node:test';import assert from 'node:assert/strict';
import {bombStationaryWalls,validateBombWallTiles} from './walls.mjs';
const tile=(id,row,column,frame,visible=true)=>({id,row,column,frame,visible,x:74+column*48,y:72+row*48});
const tiles=()=>[tile(0,2,3,0),tile(1,2,3,1),tile(2,2,3,19),tile(3,3,3,0),tile(4,2,4,1),tile(5,3,4,19)];
test('WLBombed paints cross then vertical rows then horizontal columns before hiding each collider',()=>{
 const walls=tiles().reverse(),seen=[];const result=bombStationaryWalls(walls,{row:2,column:3},(p,w)=>{assert.equal(w.visible,true);seen.push([p.id,p.frame]);});
 assert.deepEqual(seen,[[2,4],[0,2],[3,2],[1,3],[4,3]]);assert.equal(walls.find(w=>w.id===5).visible,true);
 assert.ok(result.every(p=>p.x===74+p.column*48&&p.y===72+p.row*48&&p.rawBase.x===p.x-6&&p.rawBase.y===p.y-5&&p.invalidation.x===p.rawBase.x&&p.invalidation.y===p.rawBase.y&&p.invalidation.width===48&&p.invalidation.height===48));
});
test('hidden source topology still repaints on a later blast; original frames are retained',()=>{
 const walls=tiles(),once=bombStationaryWalls(walls,{row:2,column:3},()=>{}),twice=bombStationaryWalls(walls,{row:2,column:3},(p,w)=>assert.equal(w.visible,false));assert.deepEqual(twice,once);assert.deepEqual(walls.map(w=>w.frame),[0,1,19,0,1,19]);
});
test('adjacent wrong-axis and non-origin crosses stay untouched',()=>{
 const walls=[tile(0,3,3,1),tile(1,2,4,0),tile(2,3,3,5),tile(3,3,4,19)];assert.deepEqual(bombStationaryWalls(walls,{row:2,column:3},()=>assert.fail()),[]);assert.ok(walls.every(w=>w.visible));
});
test('source topology validation rejects duplicate class/id, erased input frames and dynamic coordinates',()=>{
 for(const walls of [[tile(0,2,3,2)],[tile(0,2,3,3)],[tile(0,2,3,4)],[tile(0,2,3,20)],[tile(0,8,3,0)],[tile(0,2,11,0)],[tile(0,2,3,0),tile(1,2,3,0)],[tile(0,2,3,0),tile(0,3,3,0)],[{...tile(0,2,3,0),x:1.5}]])assert.throws(()=>validateBombWallTiles(walls));
});
test('invalid blast bounds and asynchronous painter are rejected without clearing the current collider',()=>{
 const walls=[tile(0,2,3,0)];assert.throws(()=>bombStationaryWalls(walls,{row:7,column:3},()=>{}));assert.throws(()=>bombStationaryWalls(walls,{row:2,column:3},()=>Promise.resolve()),/Synchronous/);assert.equal(walls[0].visible,true);
});
