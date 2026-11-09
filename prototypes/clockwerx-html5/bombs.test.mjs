import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeBombRecord,createBombMatch,createExplosionPool,createBombGoodie,bombHitsStationarySpike,bombHitsSwitch} from './bombs.mjs';

test('stationary spike destruction follows its arm topology across grid boundaries',()=>{
 const cases=[[0,2,[-1,0]],[1,2,[-1,0]],[2,0,[0,-1]],[2,1,[0,-1]],[2,2,[0,0]],[2,3,[0,1]],[3,2,[1,0]]];
 for(const [subrow,subcolumn,other]of cases)for(let row=3;row<=5;row++)for(let column=3;column<=5;column++){
  const expected=row===4&&column===4||row===4+other[0]&&column===4+other[1];
  assert.equal(bombHitsStationarySpike({row:4,column:4,subrow,subcolumn},{row,column}),expected);
 }
 assert.throws(()=>bombHitsStationarySpike({row:4,column:4,subrow:1,subcolumn:1},{row:4,column:4}),/topology/);
});

test('switch blast bounds are independent of visual flame overlap',()=>{
 for(const [subcell,extra]of [[1,[1,0]],[2,[0,1]],[3,[0,0]]])for(let dr=-1;dr<=2;dr++)for(let dc=-1;dc<=2;dc++){
  const expected=dr===0&&dc===0||dr===extra[0]&&dc===extra[1];
  assert.equal(bombHitsSwitch({row:4+dr,column:4+dc,subcell},{row:4,column:4}),expected);
 }
 assert.throws(()=>bombHitsSwitch({row:4,column:4,subcell:0},{row:4,column:4}),/topology/);
});

test('BO flags are the high byte; ignored padding is not a difficulty mask',()=>{
  assert.deepEqual(decodeBombRecord({rawWords:[1,2,10,0x20e0]}),
    {row:1,column:2,kind:10,flags:32,padding:224,role:'match'});
  assert.equal(decodeBombRecord({rawWords:[1,2,2,224]}).role,'bomb');
  assert.throws(()=>decodeBombRecord({rawWords:[1,2,14,0]}));
});
test('human-only match and synchronous allocation failure still consume ignition',()=>{
  const m=createBombMatch({kind:10}),calls=[];
  assert.deepEqual(m.ignite({human:false}),[]);
  const events=m.ignite({human:true,onSpark:e=>{calls.push(e);assert.equal(m.snapshot().armed,true);return false;}});
  assert.equal(calls[0].entryLeg,4);assert.equal(events.at(-1).id,11);
  assert.equal(m.snapshot().armed,false);assert.deepEqual(m.ignite({human:true}),[]);
  m.reset();assert.equal(m.snapshot().visible,true);
  assert.equal(createBombMatch({kind:13,flags:1}).ignite({human:false})[0].entryLeg,2);
});
test('explosion pool has six slots, sounds on exhaustion and reuses inserted slots',()=>{
  const p=createExplosionPool();
  for(let i=0;i<6;i++)assert.equal(p.activate({row:1,column:1},8).index,i);
  assert.deepEqual(p.activate({row:1,column:1},8),{index:-1,events:[{type:'sound',id:12}]});
  p.reset();assert.equal(p.activate({row:2,column:2},9).events.length,1);
  assert.throws(()=>p.activate({row:7,column:10},9)); // No unsafe neighbor indexing.
});
test('snapshot count suppresses same-count callback; missed counts do not catch up',()=>{
  const p=createExplosionPool();p.activate({row:1,column:1},10);
  p.observe(0,10);assert.equal(p.snapshot()[0].frame,0);
  p.observe(0,99);assert.equal(p.snapshot()[0].frame,1);
  p.observe(0,99);assert.equal(p.snapshot()[0].frame,1);
});
test('frame3 destroys stationary objects before moving collisions using old outline',()=>{
  const p=createExplosionPool();p.activate({row:1,column:1},0);p.observe(0,1);p.observe(0,2);
  const seen=[];
  const events=p.observe(0,3,{onEffect:e=>{seen.push(e.target);assert.equal(e.descriptorFrame,2);assert.equal(p.snapshot()[0].frame,2);}});
  assert.deepEqual(seen,['SP','DS','EL','GN','TR','WL','DO','DO','DP','WA']);
  assert.equal(events.length,10);assert.equal(p.snapshot()[0].frame,3);
});
test('frame4 collision precedes crater and second stationary dot pass',()=>{
  const p=createExplosionPool();p.activate({row:1,column:1},0);for(let i=1;i<4;i++)p.observe(0,i);
  assert.deepEqual(p.observe(0,4).map(e=>[e.type,e.target]),
    [['moving','DO'],['moving','DP'],['moving','WA'],['paint-crater',undefined],['stationary','DO']]);
});
test('final sentinel collides with descriptor9 before hiding and never exposes image10',()=>{
  const p=createExplosionPool();p.activate({row:1,column:1},0);for(let i=1;i<10;i++)p.observe(0,i);
  const events=p.observe(0,10);
  assert.deepEqual(events.map(e=>e.type),['moving','moving','moving','hide']);
  assert.ok(events.every(e=>e.descriptorFrame===9&&e.callbackFrame===10));
  assert.equal(p.snapshot()[0].visible,false);assert.equal(p.snapshot()[0].frame,9);
  assert.deepEqual(p.observe(0,11),[]);
});
test('goodie awards once while still visible and reset restores collection',()=>{
  const g=createBombGoodie(),e=g.collect(0);
  assert.deepEqual(e.map(x=>x.type),['sound','flourish','floating-score','add-time','add-bonus']);
  assert.equal(e[3].seconds,10);assert.equal(e[4].points,1000);
  assert.deepEqual(g.snapshot(),{collected:true,visible:true});assert.deepEqual(g.collect(0),[]);
  g.finishFlourish();assert.equal(g.snapshot().visible,false);
  g.reset();assert.equal(g.collect(0).length,5);
});
