import test from 'node:test';
import assert from 'node:assert/strict';
import {createActorClocks} from './actor-clocks.mjs';

test('class counts share one upstream reference and drain with >= divisor',()=>{
 const clocks=createActorClocks();let s=clocks.latch(1);
 assert.equal(s.classes[0].count,0);assert.equal(s.classes[0].remainder,1);assert.equal(s.classes[5].count,1);
 s=clocks.latch(2);assert.equal(s.classes[0].count,1);assert.equal(s.classes[1].count,1);
 assert.equal(s.classes[2].remainder,6);assert.equal(s.classes[4].count,0);
 s=clocks.latch(3);assert.equal(s.classes[2].count,1);assert.equal(s.classes[2].remainder,1);
});
test('upstream cap uses class0 remainder and discards full observed backlog',()=>{
 const clocks=createActorClocks();clocks.latch(1);
 const s=clocks.latch(100);assert.equal(s.used,4);assert.equal(s.discarded,95);assert.equal(s.upstreamReference,100);
 assert.equal(s.classes[0].count,2);assert.equal(s.classes[0].remainder,1);
 const again=clocks.latch(100);assert.equal(again.used,0);assert.equal(again.classes.every(c=>c.delta===0),true);
});
test('slowdown preserves remainders and does not alter human divisor',()=>{
 const clocks=createActorClocks();clocks.latch(1);clocks.setSlowdown(true);
 let s=clocks.snapshot();assert.equal(s.classes[0].divisor,2);assert.equal(s.classes[1].divisor,4);assert.equal(s.classes[1].remainder,1);
 s=clocks.latch(3);assert.equal(s.classes[0].count,1);assert.equal(s.classes[1].count,0);assert.equal(s.classes[1].remainder,3);
 clocks.setSlowdown(false);s=clocks.latch(3);assert.equal(s.classes[1].count,1);assert.equal(s.classes[1].delta,1);assert.equal(s.classes[1].remainder,1);
});
test('frozen actors use latest delta rather than accumulated private count difference',()=>{
 const clocks=createActorClocks();let old=0;
 for(let n=1;n<=10;n++)clocks.latch(n);
 const s=clocks.latch(11);assert.equal(s.classes[0].count-old,5);assert.equal(s.classes[0].delta,0);
 const copy=clocks.snapshot();copy.classes[0].count=999;assert.equal(clocks.snapshot().classes[0].count,5);
 assert.throws(()=>clocks.latch(10),/Monotonic/);
});
