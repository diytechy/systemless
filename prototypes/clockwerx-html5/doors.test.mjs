import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry,activateDoorState,advanceDoorState,createDoorSystem,findDoorContact} from './doors.mjs';

const door=(extra={})=>({row:1,column:1,vertical:true,initiallyClosed:true,long:false,color:0,...extra});
const sw=(color=0)=>({row:2,column:2,subcell:3,color});
const box=(left,top,width=2,height=2)=>({left,top,right:left+width-1,bottom:top+height,rows:Array.from({length:height},()=>[0,width-1])});

test('DR fields are bytes: axis, initial state, length, color; DS fields are words',()=>{
  assert.deepEqual(decodeDoorRecord({rawWords:[2,7,0x0100,0x0102]}),door({row:2,column:7,initiallyClosed:false,long:true,color:2}));
  assert.deepEqual(decodeSwitchRecord({rawWords:[3,4,2,1]}),{row:3,column:4,subcell:2,color:1});
  assert.throws(()=>decodeDoorRecord({rawWords:[0,0,0x0200,0]}),RangeError);
  assert.throws(()=>decodeSwitchRecord({rawWords:[0,0,4,0]}),RangeError);
});

test('four door types keep distinct anchors and far wall attachment masks',()=>{
  for(let type=0;type<4;type++){
    const spec=door({vertical:type%2===0,long:type>=2,color:2});let request;
    const g=doorGeometry(spec,{x:0,y:0},(...args)=>{request=args;return true;});
    assert.equal(g.type,type);assert.deepEqual(g.base,{x:42,y:43});
    assert.deepEqual(request,[1+[1,0,2,0][type],1+[0,1,0,2][type],spec.vertical?8:4]);
    assert.equal(g.caps[0].frame,spec.vertical?10:4);assert.equal(g.caps[1].frame,g.caps[0].frame+1);
  }
  assert.deepEqual(doorGeometry(door({long:true}),{x:0,y:0}).caps,[{x:69,y:43,frame:6},{x:69,y:139,frame:6}]);
  assert.deepEqual([0,1,2,3].map(subcell=>switchGeometry({...sw(),subcell},{x:0,y:0})),[
    {x:84,y:85},{x:108,y:85},{x:84,y:109},{x:108,y:109}
  ]);
});

test('activation starts, reverses in transit, and preserves source sound choice',()=>{
  assert.deepEqual(activateDoorState({phase:0,direction:0}),{phase:0,direction:1,soundArgument:1});
  assert.deepEqual(activateDoorState({phase:10,direction:0}),{phase:10,direction:-1,soundArgument:3});
  assert.deepEqual(activateDoorState({phase:4,direction:-1}),{phase:4,direction:1,soundArgument:3});
  assert.deepEqual(activateDoorState({phase:4,direction:1}),{phase:4,direction:-1,soundArgument:3});
  assert.deepEqual(activateDoorState({phase:0,direction:1}),{phase:0,direction:0,soundArgument:null});
});

test('ten source callbacks reach the open endpoint, closing arrival has sound2',()=>{
  let s=activateDoorState({phase:0,direction:0});
  for(let n=1;n<=10;n++){s=advanceDoorState(s);assert.equal(s.phase,n);}
  assert.equal(s.direction,0);assert.equal(s.soundArgument,null);
  s=activateDoorState(s);
  for(let n=9;n>=0;n--){s=advanceDoorState(s);assert.equal(s.phase,n);assert.equal(s.soundArgument,n===0?2:null);}
  assert.deepEqual(advanceDoorState(s),{phase:0,direction:0,soundArgument:null});
});

test('switch entry toggles all matching colors; holding and release do not',()=>{
  const system=createDoorSystem([door(),door({long:true}),door({color:1})],[sw()],{clockCount:7});
  assert.equal(system.contact('hero',0).length,2);
  system.observeClock(8);
  assert.deepEqual(system.snapshot().doors.map(d=>[d.phase,d.direction]),[[1,1],[1,1],[0,0]]);
  assert.deepEqual(system.contact('hero',0),[]);
  assert.deepEqual(system.contact('hero',-1),[]);
  system.observeClock(9);
  assert.deepEqual(system.snapshot().switches,[{occupants:0,frame:0}]);
  assert.equal(system.snapshot().doors[0].phase,2);
});

test('each entering actor toggles even when occupied; last release restores color',()=>{
  const system=createDoorSystem([door({color:1})],[sw(1)]);
  system.contact('hero',0);system.observeClock(1);
  assert.deepEqual(system.contact('enemy',0),[{doorIndex:0,soundArgument:3}]);
  assert.deepEqual(system.snapshot().switches,[{occupants:2,frame:4}]);
  assert.equal(system.snapshot().doors[0].direction,-1);
  system.contact('hero',-1);assert.equal(system.snapshot().switches[0].frame,4);
  system.contact('enemy',-1);assert.equal(system.snapshot().switches[0].frame,1);
});

test('switch-to-switch transfer with the same color is a new activation',()=>{
  const system=createDoorSystem([door()],[sw(),sw()]);
  system.contact(2,0);system.observeClock(1);system.contact(2,1);
  assert.equal(system.snapshot().doors[0].direction,-1);
  assert.deepEqual(system.snapshot().switches,[{occupants:0,frame:0},{occupants:1,frame:3}]);
});

test('clock observation skips no more than one pose and reset clears occupancy',()=>{
  const system=createDoorSystem([door({initiallyClosed:false,long:true,vertical:false})],[sw()],{clockCount:91});
  assert.deepEqual(system.snapshot().doors[0],{phase:10,direction:0,frame:43,secondFrame:87});
  system.contact(0,0);assert.deepEqual(system.observeClock(91),[]);
  system.observeClock(1000);assert.equal(system.snapshot().doors[0].phase,9);
  system.observeClock(1000);assert.equal(system.snapshot().doors[0].phase,9);
  system.reset(1200);
  assert.deepEqual(system.snapshot().switches,[{occupants:0,frame:0}]);
  assert.equal(system.snapshot().doors[0].phase,10);
  assert.equal(system.contact(0,0).length,1);
  assert.throws(()=>system.observeClock(1199),RangeError);
});

test('leaf2 wins a dual overlap and only its lethal outline is tested',()=>{
  const hit=box(0,0),miss=box(20,20);
  const ds=[{leaves:[hit,hit],lethalLeaves:[hit,miss],caps:[]}];
  assert.deepEqual(findDoorContact(ds,hit),{doorIndex:0,leaf:1,part:'leaf',lethal:false,bounce:true,guardContact:true,soundArgument:null});
  ds[0].lethalLeaves=[miss,hit];
  assert.deepEqual(findDoorContact(ds,hit),{doorIndex:0,leaf:1,part:'leaf',lethal:true,bounce:false,guardContact:false,soundArgument:13});
  assert.equal(findDoorContact(ds,hit,{checkLethal:false}).bounce,true);
});

test('all leaves precede all caps; missing/empty outlines do not collide',()=>{
  const hit=box(0,0),miss=box(20,20);
  const ds=[{leaves:[null,miss],lethalLeaves:[],caps:[hit]},{leaves:[hit,null],lethalLeaves:[],caps:[]}];
  assert.equal(findDoorContact(ds,hit).doorIndex,1);
  ds[1].leaves[0]=null;assert.equal(findDoorContact(ds,hit).part,'cap');
  ds[0].caps[0]={...hit,rows:[[-1,-1],[-1,-1]]};assert.equal(findDoorContact(ds,hit),null);
});
