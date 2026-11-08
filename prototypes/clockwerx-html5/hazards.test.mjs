import test from 'node:test';
import assert from 'node:assert/strict';
import {outlineCollision,spikeGridPoint,enemyFrameGate,isProtectedDot,createSourceTimerChain,actorInitialFrame} from './hazards.mjs';
const box = (left, top, rows, width = 10) => ({left,top,right:left+width,bottom:top+rows.length,rows});
test('source outlines reject overlapping art bounds with separated spans', () => {
  assert.equal(outlineCollision(box(0,0,[[0,1],[-1,-1]]),box(0,0,[[8,9],[0,1]])),false);
});
test('inclusive span endpoints collide, with exclusive scanline bottom', () => {
  assert.equal(outlineCollision(box(0,0,[[0,2]]),box(2,0,[[0,1]])),true);
  assert.equal(outlineCollision(box(0,0,[[0,2]]),box(0,1,[[0,1]])),false);
});
test('vertical reflection reverses outline rows independently of the SVG', () => {
  const a=box(0,0,[[0,1],[8,9]]), b=box(0,0,[[8,9],[-1,-1]]);
  assert.equal(outlineCollision(a,b),false);
  assert.equal(outlineCollision({...a,flipY:true},b),true);
});
test('missing outline disables collision; null rows retains source rectangle path', () => {
  const a={left:0,top:0,right:10,bottom:10,rows:null};
  assert.equal(outlineCollision(undefined,a),false);
  assert.equal(outlineCollision(a,{...a,left:10,right:20}),true);
  assert.equal(outlineCollision(a,box(4,4,[[0,1]])),true);
});
test('nonpixel coordinates fail instead of silently changing the collision lattice', () => {
  assert.throws(()=>outlineCollision(box(.5,0,[[0,1]]),box(0,0,[[0,1]])),TypeError);
});
test('SP offsets are independent row and column positions', () => {
  assert.deepEqual(spikeGridPoint({rawWords:[3,5,2,0]},{x:74,y:72}),{x:314,y:240});
  assert.throws(()=>spikeGridPoint({rawWords:[0,0,4,0]},{x:0,y:0}),RangeError);
});
test('same-pivot collision gate handles frame wrap and different pivots', () => {
  assert.equal(enemyFrameGate(1,1,0,60),true);
  assert.equal(enemyFrameGate(1,1,0,59),false);
  assert.equal(enemyFrameGate(1,1,4,0),true);
  assert.equal(enemyFrameGate(1,2,32,0),true);
});
test('protection requires a present flag-bearing dot and active mask', () => {
  const cell={present:true,flagsRaw:0x2001,activationMaskRaw:2};
  assert.equal(isProtectedDot(cell,2),true);
  assert.equal(isProtectedDot(cell,1),false);
  assert.equal(isProtectedDot({...cell,present:false},2),false);
  assert.equal(isProtectedDot({...cell,flagsRaw:0x4003},2),false);
});
test('serialized half-index doubles into actual 64-angle source frame', () => {
  assert.equal(actorInitialFrame(24),48);
  assert.equal(actorInitialFrame(40),16);
  assert.equal(actorInitialFrame(-1),62);
  assert.equal(actorInitialFrame(32),0);
});
test('source timer has strict client threshold and 16 units per guest tick', () => {
  const clock=createSourceTimerChain(40,5);
  assert.deepEqual(clock.advance(12),{baseCount:4,clientCount:0,remaining:8,clientRemainder:4});
  assert.equal(clock.advance(1).clientCount,0);
  assert.equal(clock.advance(2).clientCount,1);
  assert.equal(clock.advance(45).clientCount,4);
});
test('long source timer gap collapses to one base event', () => {
  const clock=createSourceTimerChain(40,5);
  assert.deepEqual(clock.advance(400),{baseCount:1,clientCount:0,remaining:40,clientRemainder:1});
  assert.throws(()=>clock.advance(.5),RangeError);
});
