import test from 'node:test';
import assert from 'node:assert/strict';
import {createSparkles} from './sparkles.mjs';
const config={offsets:[[0,-10],[10,0],[0,10],[-10,0]],frameCount:7,frameSeconds:.1,spawnFrame:3,direction:1};
const anchor={x:20,y:30};
test('successor overlaps old particle and each keeps its birth position',()=>{
  const s=createSparkles(config);s.reset(anchor);s.update(.3,{x:100,y:200});
  assert.deepEqual(s.snapshot(),[{id:0,x:20,y:20,frame:3},{id:1,x:110,y:200,frame:0}]);
  s.update(.4,{x:100,y:200});assert.equal(s.snapshot().some(p=>p.id===0),false);
});
test('fixed direction wraps the supplied ring',()=>{
  const s=createSparkles({...config,direction:-1});s.reset(anchor);s.update(.3,anchor);
  assert.deepEqual(s.snapshot()[1],{id:1,x:10,y:30,frame:0});
});
test('stopSpawning drains existing particles and reset restarts the chain',()=>{
  const s=createSparkles(config);s.reset(anchor);s.update(.3,anchor);s.stopSpawning();
  s.update(.3,anchor);assert.equal(s.snapshot().length,2);
  s.update(.5,anchor);assert.deepEqual(s.snapshot(),[]);
  s.reset(anchor);s.update(.3,anchor);assert.equal(s.snapshot().length,2);
});
test('fixed-step partition, zero elapsed pause, reset and large jump agree',()=>{
  const a=createSparkles(config),b=createSparkles(config);a.reset(anchor);b.reset(anchor);
  for(let i=0;i<120;i++)a.update(.01,anchor);b.update(1.2,anchor);assert.deepEqual(a.snapshot(),b.snapshot());
  const saved=a.snapshot();a.update(0,{x:999,y:999});assert.deepEqual(a.snapshot(),saved);
  a.reset(anchor);b.reset(anchor);a.update(100,anchor);for(let i=0;i<1000;i++)b.update(.1,anchor);assert.deepEqual(a.snapshot(),b.snapshot());
  a.reset(anchor);assert.deepEqual(a.snapshot(),[{id:0,x:20,y:20,frame:0}]);
});
test('caller cannot mutate offsets or snapshots and invalid time is rejected',()=>{
  const c={...config,offsets:[[0,0],[1,1]]},s=createSparkles(c);c.offsets[0][0]=999;s.reset(anchor);
  const saved=s.snapshot();saved[0].x=999;assert.equal(s.snapshot()[0].x,20);
  assert.throws(()=>s.update(-1,anchor),RangeError);assert.throws(()=>s.update(NaN,anchor),RangeError);
});
