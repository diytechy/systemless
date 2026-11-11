import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFreeBuster,busterVelocity} from './free-busters.mjs';
import {GunTriggerRuntime} from './gun-triggers.mjs';
import {bombActors} from './bomb-runtime.mjs';
const actor=()=>({sourceActorType:5,sourceSlot:2,speedClass:1,checksWalls:false,program:null,frame:0,unwrappedFrame:0,direction:1,frameReference:7,visible:true,orphaned:false,hiddenUntil:0});
const pool=()=>new GunTriggerRuntime({guns:[],triggers:[],rawBounds:{left:-1000,top:-1000,right:1000,bottom:1000},frameOrigin:{x:28,y:28},templateReference:0});
test('buster clone freezes art, inherits its clock, reflects without rollback and shatters before doors',()=>{
 const g=pool(),a=actor();g.launchBuster(a,{x:200,y:200},{x:6,y:0});a.frame=8;
 const p=g.slots[0],start={...p.rawBase};
 g.advance(9,{classes:{1:{count:7}}});assert.deepEqual(p.rawBase,start);assert.equal(p.frame,0);
 const e=g.advance(10,{classes:{1:{count:8}},busterDoor:()=>({vertical:true})});assert.equal(p.rawBase.x,start.x+6);assert.deepEqual(p.velocity,{x:-6,y:0});assert.equal(e[1].type,'projectile-reflect');
 let shatters=0;g.advance(11,{classes:{1:{count:9}},busterWall:()=>({id:2}),busterDoor:()=>assert.fail('wall must precede door'),shatter:()=>shatters++});assert.equal(shatters,1);assert.equal(g.slots[0],null);
});
test('bomb hides buster, hidden clock advances, strict deadline returns it; expired orphan does not return',()=>{
 const a=actor();bombActors([a],{guestTick:10,allowFreeBusters:true,collides:()=>true,onDeath:()=>assert.fail(),onHidden:()=>{}});
 assert.equal(a.hiddenUntil,310);advanceFreeBuster(a,1,310);assert.equal(a.visible,false);assert.equal(a.frame,1);
 advanceFreeBuster(a,1,311);assert.equal(a.visible,true);assert.equal(a.frame,2);
 Object.assign(a,{orphaned:true,orphanDeadline:312});advanceFreeBuster(a,1,313);assert.equal(a.hiddenUntil,0);advanceFreeBuster(a,1,1000);assert.equal(a.visible,false);
});
test('type1 shares all32 slots, skips human bullet test and reuses first empty slot',()=>{
 const g=pool();for(let i=0;i<32;i++)g.launchBuster(actor(),{x:200,y:200},{x:0,y:6});
 assert.equal(g.launchBuster(actor(),{x:200,y:200},{x:0,y:6})[0].type,'projectile-pool-full');
 assert.equal(g.humanHit({sourceActorType:0,visible:true},()=>assert.fail('type1 must be skipped')),null);
 g.slots[3]=null;assert.equal(g.launchBuster(actor(),{x:200,y:200},{x:0,y:6})[0].slot,3);
 assert.deepEqual(busterVelocity(0,1),{x:0,y:6});assert.deepEqual(busterVelocity(16,1),{x:-6,y:0});assert.deepEqual(busterVelocity(8,-1),{x:4,y:-4});
});
