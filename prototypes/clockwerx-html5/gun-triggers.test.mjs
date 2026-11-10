import test from 'node:test';
import assert from 'node:assert/strict';
import {activeGunTriggerSpecs,gunPaintFrames,GunTriggerRuntime} from './gun-triggers.mjs';

const gridOrigin={x:74,y:72},frameOrigin={x:28,y:28};
const parse=(kind,records)=>activeGunTriggerSpecs(records.map(rawWords=>({rawWords})),{kind,gridOrigin,frameOrigin});
const gun=(color=1,dirs=2,mask=15)=>[2,2,1,color,dirs,0,mask];
const trigger=(color=1,col=4)=>[1,col,2,color,0,15];
const actor=(sourceSlot,sourceActorType=sourceSlot===0?0:1)=>({sourceSlot,sourceActorType,visible:true});
const setup=({guns=[gun()],triggers=[trigger()],rawBounds={left:0,top:0,right:500,bottom:400},templateReference=0}={})=>new GunTriggerRuntime({guns:parse('GN',guns),triggers:parse('TR',triggers),rawBounds,frameOrigin,templateReference});

test('GN/TR mask filtering precedes allocation; raw geometry and ordering stay explicit',()=>{
 const gs=parse('GN',[...Array(19).fill(gun(1,2,8)),gun(1,15)]);
 assert.deepEqual(gs,[{id:0,sourceIndex:19,row:2,column:2,placement:1,color:1,activationMask:15,rawBase:{x:131,y:107},directions:15}]);
 assert.deepEqual(parse('TR',[trigger()])[0].rawBase,{x:203,y:83});
 assert.throws(()=>parse('GN',Array(19).fill(gun())),/capacity/);
 assert.throws(()=>parse('GN',[gun(1,0)]),/geometry/);
 assert.throws(()=>parse('TR',[trigger(3)]),/geometry/);
});

test('GN launches in N/E/S/W order and retains one sound even if slots are exhausted',()=>{
 const g=setup({guns:[gun(1,15),gun(0,2),gun(1,8)]});
 assert.deepEqual(gunPaintFrames(g.guns[0]),[1,3,4,5,6]);
 const events=g.activateColor(1);
 assert.deepEqual(events.map(e=>e.type==='sound'?`s${e.gun}`:e.bit),[1,2,4,8,'s0',8,'s2']);
 assert.deepEqual(g.slots.slice(0,4).map(p=>[p.rawBase,p.velocity]),[
  [{x:155,y:111},{x:0,y:-3}],[{x:174,y:129},{x:3,y:0}],[{x:155,y:149},{x:0,y:3}],[{x:135,y:129},{x:-3,y:0}],
 ]);
 for(let n=0;n<7;n++)g.activateColor(1);
 assert.equal(g.slots.filter(Boolean).length,32);
 assert.deepEqual(g.activateColor(1).filter(e=>e.type==='sound').map(e=>e.gun),[0,2]);
 assert.equal(g.activateColor(1).filter(e=>e.type==='projectile-pool-full').length,5);
 g.guns[0].enabled=false;
 assert.deepEqual(gunPaintFrames(g.guns[0]),[7]);
 assert.deepEqual(g.activateColor(1).filter(e=>e.type==='sound').map(e=>e.gun),[2]);
});

test('TR first overlap, per-actor entry, hold, release and change-of-trigger preserve occupancy',()=>{
 const g=setup({triggers:[trigger(),trigger(1,5)]}),h=actor(0),npc=actor(2);
 const hit=()=>true,contact=(a,overlaps)=>g.contact(a,overlaps);
 assert.equal(contact(h,hit).filter(e=>e.type==='projectile-launch').length,1);
 assert.deepEqual(contact(h,hit),[]);
 assert.equal(contact(npc,hit).filter(e=>e.type==='projectile-launch').length,1);
 assert.deepEqual(g.triggers.map(t=>[t.occupancy,t.frame]),[[2,3],[0,2]]);
 assert.equal(contact(h,t=>t.id===1).filter(e=>e.type==='projectile-launch').length,1);
 assert.deepEqual(g.triggers.map(t=>[t.occupancy,t.frame]),[[1,3],[1,3]]);
 g.triggers[0].visible=false;
 contact({...npc,visible:false},hit);
 assert.deepEqual(g.triggers.map(t=>[t.occupancy,t.frame]),[[0,2],[1,3]]);
 assert.deepEqual(contact(actor(3,4),hit),[]);
 assert.deepEqual(contact(actor(4,5),hit),[]);
});

test('TR suppression caches identity without changing occupancy or firing',()=>{
 const g=setup(),h=actor(0);
 assert.deepEqual(g.contact(h,()=>true,{suppressed:true}),[]);
 assert.equal(g.contacts.get(0),0);
 assert.equal(g.triggers[0].occupancy,0);
 assert.deepEqual(g.contact(h,()=>true),[]);
 g.contact(h,()=>false);
 assert.equal(g.triggers[0].occupancy,-1); // source word decrement is not clamped
 assert.equal(g.slots.filter(Boolean).length,0);
});

test('PR inherits template clock, coalesces changed counts, clips inclusively and reuses slots',()=>{
 const g=setup({rawBounds:{left:0,top:0,right:180,bottom:400},templateReference:3});
 g.advance(12);g.activateColor(1);
 assert.equal(g.slots[0].reference,3);
 assert.deepEqual(g.advance(12),[]);assert.equal(g.slots[0].rawBase.x,177);
 assert.deepEqual(g.advance(12),[]);assert.equal(g.slots[0].rawBase.x,177);
 assert.deepEqual(g.advance(19),[]);assert.equal(g.slots[0].rawBase.x,180);
 assert.deepEqual(g.advance(20),[{type:'projectile-dispose',slot:0,reason:'bounds',rawBase:{x:183,y:129}}]);
 assert.equal(g.slots[0],null);g.activateColor(1);assert.equal(g.slots[0].reference,3);
 g.reset();assert.equal(g.templateReference,3);assert.equal(g.classCount,20);assert.deepEqual(g.insertionOrder,[]);assert.equal(g.contacts.size,0);
});

test('PR checks translated wall before door; human collision is slot-ordered and non-consuming',()=>{
 const g=setup();g.activateColor(1);g.activateColor(1);
 const h={...actor(0),protected:true};
 assert.deepEqual(g.humanHit(h,()=>true),{reason:'projectile',sourceReason:16,object:0});
 assert.equal(g.slots.filter(Boolean).length,2);
 assert.throws(()=>g.humanHit(actor(2),()=>true),/human/);
 const hits=g.advance(1,{wall:p=>p.slot===0&&p.rawBase.x===177,door:p=>{assert.equal(p.slot,1);return true;}});
 assert.deepEqual(hits.filter(e=>e.type==='sound').map(e=>e.id),[31,32]);
 assert.deepEqual(g.insertionOrder,[]);
});
