import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeathClock,createDeathEffect} from './death.mjs';

const sequence=values=>{let i=0;return ()=>values[i++%values.length];};
const fakeClock=()=>{let guestTick=0,clientCount=0;return {
 advance(ticks){guestTick+=ticks;return this.snapshot();},
 event(ticks=1,counts=1){guestTick+=ticks;clientCount+=counts;},
 snapshot(){return {guestTick,clientCount};}
};};
const effect=(options={})=>createDeathEffect({pivot:{x:100,y:100},frame:0,randomUnsigned:()=>0,clock:createDeathClock(),...options});

test('random draws interleave percent and delay; endpoint truncation precedes scaling',()=>{
 const clock=fakeClock();
 const e=effect({frame:8,clock,advanceClock:false,particleCount:2,randomUnsigned:sequence([99,0,50,59])});
 assert.equal(e.remaining,2);assert.deepEqual(e.snapshot(),[]);
 clock.event();e.update(0);
 assert.deepEqual(e.snapshot(),[{id:0,x:132,y:132,frame:0}]);
 clock.event(59);e.update(0);
 assert.deepEqual(e.snapshot(),[{id:0,x:132,y:132,frame:1},{id:1,x:116,y:116,frame:0}]);
});

test('negative vector percentages truncate toward zero and unsigned values wrap by modulus',()=>{
 const clock=fakeClock(),e=effect({frame:32,clock,advanceClock:false,particleCount:1,randomUnsigned:sequence([65535,65535])});
 clock.event(16);e.update(0);
 assert.deepEqual(e.snapshot(),[{id:0,x:84,y:100,frame:0}]);
});

test('start threshold is strict and only evaluated on a client clock change',()=>{
 const clock=fakeClock(),e=effect({clock,advanceClock:false,particleCount:1,randomUnsigned:sequence([0,5])});
 clock.event(5);e.update(0);assert.deepEqual(e.snapshot(),[]);
 clock.advance(1);e.update(0);assert.deepEqual(e.snapshot(),[]);
 clock.event(0);e.update(0);assert.equal(e.snapshot()[0].frame,0);
});

test('ten frames remain visible for ten events, and the last particle controls completion',()=>{
 const clock=fakeClock(),e=effect({clock,advanceClock:false,particleCount:2,randomUnsigned:sequence([0,0,50,5])});
 for(let i=1;i<=10;i++){clock.event();e.update(0);}
 assert.equal(e.snapshot()[0].frame,9);assert.equal(e.heroVisible,true);assert.equal(e.complete,false);
 clock.event();e.update(0);assert.equal(e.heroVisible,false);assert.equal(e.remaining,1);
 for(let i=0;i<5;i++){clock.event();e.update(0);}
 assert.equal(e.complete,true);assert.deepEqual(e.snapshot(),[]);
});

test('skipped counts produce one callback, not catch-up or instant expiration',()=>{
 const clock=fakeClock(),e=effect({clock,advanceClock:false,particleCount:1});
 clock.event(100,100);e.update(0);assert.equal(e.snapshot()[0].frame,0);
 clock.event(100,100);e.update(0);assert.equal(e.snapshot()[0].frame,1);
});

test('shared clock retains phase across effects and uses strict base40/divisor2 threshold',()=>{
 const clock=createDeathClock();assert.equal(clock.advance(5).clientCount,0);
 assert.equal(clock.advance(3).clientCount,1);
 const e=effect({clock,particleCount:1});e.update(0);assert.deepEqual(e.snapshot(),[]);
 e.update(5);assert.equal(e.snapshot()[0].frame,0);
 for(let i=0;i<10;i++)e.update(5);
 assert.equal(e.complete,true);
 const next=effect({clock,particleCount:1});next.update(0);assert.deepEqual(next.snapshot(),[]);
 next.update(5);assert.equal(next.snapshot()[0].frame,0);
});

test('invalid inputs are rejected without supplying implicit RNG or clock',()=>{
 assert.throws(()=>effect({frame:64}),RangeError);
 assert.throws(()=>effect({randomUnsigned:()=>-1}),RangeError);
 assert.throws(()=>effect({randomUnsigned:()=>65536}),RangeError);
 assert.throws(()=>effect({clock:null}),TypeError);
 assert.throws(()=>effect().update(0.5),RangeError);
});
