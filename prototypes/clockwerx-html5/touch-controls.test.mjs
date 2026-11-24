import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchGestures,clientToLogical,TOUCH_DEFAULTS} from './touch-controls.mjs';

const none={swing:false,bounce:false,flip:false};

test('a short still tap emits exactly one reverse edge and never a held action',()=>{
  const g=createTouchGestures();
  g.down(1,100,100,0);assert.deepEqual(g.poll(50).held,none);assert.equal(g.poll(60).pending,true);
  g.up(1,90);const p=g.poll(100);assert.equal(p.taps,1);assert.deepEqual(p.held,none);assert.equal(g.poll(120).taps,0,'tap edges are consumed by poll');
});

test('one-finger hold commits swing after holdMs and releases cleanly',()=>{
  const g=createTouchGestures();
  g.down(1,10,10,1000);assert.deepEqual(g.poll(1000+TOUCH_DEFAULTS.holdMs-1).held,none,'not yet committed');
  assert.deepEqual(g.poll(1000+TOUCH_DEFAULTS.holdMs).held,{...none,swing:true});
  g.up(1,1400);const p=g.poll(1401);assert.deepEqual(p.held,none);assert.equal(p.taps,0,'a committed hold is not a tap');
});

test('release exactly at the threshold without an intervening poll is still a hold, not a tap',()=>{
  const g=createTouchGestures();g.down(1,0,0,0);g.up(1,TOUCH_DEFAULTS.holdMs);assert.equal(g.poll(TOUCH_DEFAULTS.holdMs+1).taps,0);
});

test('two-finger hold is flip immediately; lifting one finger returns to swing',()=>{
  const g=createTouchGestures();
  g.down(1,0,0,0);g.down(2,50,0,30);assert.deepEqual(g.poll(31).held,{...none,flip:true});
  g.up(2,400);assert.deepEqual(g.poll(401).held,{...none,swing:true});
  g.down(3,60,0,500);assert.deepEqual(g.poll(501).held,{...none,flip:true},'adding a finger to a swing hold switches action');
  g.up(1,600);g.up(3,610);const p=g.poll(620);assert.deepEqual(p.held,none);assert.equal(p.taps,0,'two-finger gestures never reverse');
});

test('a quick two-finger tap does nothing (no accidental reverse)',()=>{
  const g=createTouchGestures();g.down(1,0,0,0);g.down(2,40,0,10);g.up(1,60);g.up(2,70);const p=g.poll(80);assert.equal(p.taps,0);assert.deepEqual(p.held,none);
});

test('press-and-drag commits the optional bounce before holdMs; a small wobble is neither tap nor drag',()=>{
  const g=createTouchGestures();
  g.down(1,0,0,0);g.move(1,TOUCH_DEFAULTS.dragPx,0,40);assert.deepEqual(g.poll(41).held,{...none,bounce:true});g.up(1,500);
  const late=createTouchGestures();late.down(1,0,0,0);assert.deepEqual(late.poll(200).held,{...none,swing:true});late.move(1,80,0,250);assert.deepEqual(late.poll(260).held,{...none,swing:true},'sliding after a hold has committed keeps swing');
  const w=createTouchGestures();w.down(1,0,0,0);w.move(1,TOUCH_DEFAULTS.tapSlopPx+3,0,30);w.up(1,60);const p=w.poll(70);assert.equal(p.taps,0,'moved too far for a tap');assert.deepEqual(p.held,none);
});

test('mapping is configurable and validated; cancel and reset clear state',()=>{
  const g=createTouchGestures({twoFingerAction:'bounce',dragAction:'flip'});
  g.down(1,0,0,0);g.down(2,1,1,5);assert.deepEqual(g.poll(6).held,{...none,bounce:true});assert.equal(g.tracks(1),true);assert.equal(g.tracks(9),false);g.cancel(1);g.cancel(2);assert.deepEqual(g.poll(7).held,none);assert.equal(g.active,false);
  g.down(1,0,0,10);g.reset();assert.deepEqual(g.poll(1000).held,none);
  assert.throws(()=>createTouchGestures({twoFingerAction:'reverse'}));assert.throws(()=>createTouchGestures({holdMs:-1}));
  assert.throws(()=>g.down(1,NaN,0,0));
});

test('client coordinates map onto the logical board',()=>{
  assert.deepEqual(clientToLogical({left:10,top:20,width:1280,height:960},650,500),{x:320,y:240});
  assert.equal(clientToLogical({left:0,top:0,width:640,height:480},-1,10),null);
});

test('defaults follow the requested scheme: tap reverse, hold swing, two-finger hold flip',()=>{
  assert.equal(TOUCH_DEFAULTS.oneFingerAction,'swing');assert.equal(TOUCH_DEFAULTS.twoFingerAction,'flip');assert.equal(TOUCH_DEFAULTS.dragAction,'bounce');
});

test('the last tap position is reported for feedback',()=>{
  const g=createTouchGestures();g.down(7,42,24,0);g.up(7,50);assert.deepEqual(g.poll(60).lastTap,{x:42,y:24,t:50});
});