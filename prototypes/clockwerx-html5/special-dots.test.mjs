import test from 'node:test';
import assert from 'node:assert/strict';
import {createStaticRingDot,createCheckpointDot,createProtectionOverlay} from './special-dots.mjs';

test('human release immediately denies human grabs and orphans other occupants',()=>{
  const ring=createStaticRingDot({color:2,clockCount:20});
  assert.equal(ring.release({human:false}).changed,false);
  const s=ring.release({clockCount:20});
  assert.equal(s.frame,38);assert.equal(s.humanAvailable,false);
  assert.equal(s.nonhumanAvailable,true);assert.equal(s.visible,true);
  assert.equal(s.orphanOtherOccupants,true);assert.equal(s.soundArgument,42);
  assert.equal(ring.observeClock(20,100).frame,38);
  assert.equal(ring.observeClock(100,100).frame,39); // one callback despite 80 counts
});

test('hidden delay starts at shrink completion; strict expiry and reverse revival',()=>{
  const ring=createStaticRingDot();ring.release();
  for(let i=1;i<=6;i++)ring.observeClock(i,100+i,200+i);
  let s=ring.snapshot();assert.equal(s.frame,30);assert.equal(s.visible,false);
  assert.equal(s.deadline,506);assert.equal(s.humanAvailable,false);
  assert.equal(ring.observeClock(7,506).visible,false);
  s=ring.observeClock(8,507);assert.equal(s.visible,true);assert.equal(s.frame,29);
  assert.equal(s.humanAvailable,false);
  for(let i=9;i<=14;i++)ring.observeClock(i,508+i);
  s=ring.snapshot();assert.equal(s.frame,23);assert.equal(s.humanAvailable,true);
  assert.equal(s.attached,false);assert.equal(s.step,0);
});

test('a deadline cannot revive a ring without a sprite clock callback',()=>{
  const ring=createStaticRingDot({difficulty:3});ring.release();
  for(let i=1;i<=6;i++)ring.observeClock(i,100);
  assert.equal(ring.snapshot().deadline,1300);
  assert.equal(ring.observeClock(6,2000).visible,false);
  assert.equal(ring.observeClock(7,2000).visible,true);
});

test('round reset restores availability and snapshots the current clock',()=>{
  const ring=createStaticRingDot();ring.release();ring.observeClock(1,10);
  assert.equal(ring.reset(90).humanAvailable,true);
  ring.release({clockCount:90});assert.equal(ring.observeClock(90,100).frame,24);
  assert.equal(ring.observeClock(91,101).frame,25);
  assert.throws(()=>createStaticRingDot({difficulty:4}),RangeError);
});

test('checkpoint grab waits for a changed count and coalesces missed counts',()=>{
 const d=createCheckpointDot(20);assert.deepEqual(d.activate(22),{frame:79,step:1,attached:true,visible:true});
 assert.equal(d.observeClock(22).frame,79);assert.equal(d.observeClock(90).frame,80);
 for(let c=91;c<=99;c++)d.observeClock(c);
 assert.deepEqual(d.snapshot(),{frame:89,step:0,attached:false,visible:true});
 assert.equal(d.observeClock(1000).frame,89);
});

test('regrabbing a completed checkpoint wraps on its next callback; partial regrab resumes',()=>{
 const d=createCheckpointDot();d.activate();for(let c=1;c<=10;c++)d.observeClock(c);
 assert.equal(d.activate(12).frame,89);assert.equal(d.observeClock(12).frame,89);
 assert.equal(d.observeClock(13).frame,79);assert.equal(d.observeClock(14).frame,80);
 assert.equal(d.activate(20).frame,80);assert.equal(d.observeClock(21).frame,81);
 assert.deepEqual(d.reset(50),{frame:79,step:0,attached:false,visible:true});
 assert.equal(d.observeClock(51).frame,79);
});

test('protection overlay includes both endpoints and uses its separate callback count',()=>{
 const d=createProtectionOverlay(100),frames=[];
 for(let c=101;c<=114;c++)frames.push(d.observeClock(c).frame);
 assert.deepEqual(frames,[118,119,120,121,122,123,124,123,122,121,120,119,118,117]);
 assert.equal(d.snapshot().step,1);assert.equal(d.observeClock(114).frame,117);
 assert.equal(d.observeClock(1000).frame,118);
 assert.deepEqual(d.reset(1000),{frame:117,step:1,visible:true});
 assert.throws(()=>d.observeClock(-1),RangeError);
});
