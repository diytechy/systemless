import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFreeBuster,busterVelocity,shatterFreeBusterWall,advanceBusterWallEffects} from './free-busters.mjs';
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
test('source FTTI truncates oblique buster components before applying angular sign',()=>{
 assert.deepEqual(busterVelocity(38,-1),{x:-3,y:4});
 assert.deepEqual(busterVelocity(37,-1),{x:-2,y:5});
 assert.deepEqual(busterVelocity(35,-1),{x:-1,y:5});
 assert.deepEqual(busterVelocity(11,1),{x:-5,y:2});
 for(let f=0;f<64;f++){
  const a=busterVelocity(f,1),b=busterVelocity(f,-1);
  assert.equal(a.x+b.x,0);assert.equal(a.y+b.y,0);
  assert.ok(a.x*a.x+a.y*a.y<=36);
 }
});
test('buster clipping tests the raw base; translated art may remain inside after disposal',()=>{
 const g=new GunTriggerRuntime({guns:[],triggers:[],rawBounds:{left:0,top:0,right:584,bottom:424},frameOrigin:{x:28,y:28},templateReference:0});
 g.launchBuster(actor(),{x:73,y:100},{x:-1,y:0});
 g.advance(1,{classes:{1:{count:8}}});assert.equal(g.slots[0].rawBase.x,0);
 assert.deepEqual(g.pointFor(g.slots[0].rawBase),{x:28,y:57});
 const e=g.advance(2,{classes:{1:{count:9}}});assert.equal(g.slots[0],null);
 assert.equal(e[0].reason,'bounds');assert.equal(e[0].rawBase.x,-1);
});
test('wall shatter removes only collided source segments and leaves one finite debris clone',()=>{
 const wall={x:200,y:160,frame:19,visible:true},probes=[];
 const e=shatterFreeBusterWall(wall,f=>{probes.push(f);return [22,20].includes(f);});
 assert.deepEqual(probes,[22,20,23,21]);assert.equal(wall.frame,14);assert.equal(wall.visible,true);
 assert.deepEqual(e,{group:3700,frame:0,last:8,reference:null,point:{x:208,y:151},removed:5});
 e.reference=20;assert.equal(advanceBusterWallEffects([e],20)[0].frame,0);
 assert.equal(advanceBusterWallEffects([e],25)[0].frame,1);
 for(let i=26;i<=32;i++)advanceBusterWallEffects([e],i);
 assert.equal(e.frame,8);assert.deepEqual(advanceBusterWallEffects([e],33),[]);
 const vertical={x:200,y:160,frame:0,visible:true};
 assert.equal(shatterFreeBusterWall(vertical,()=>assert.fail()).frame,27);assert.equal(vertical.visible,false);
 assert.equal(shatterFreeBusterWall({x:200,y:160,frame:1},()=>assert.fail()).frame,18);
 const last={x:200,y:160,frame:6};assert.equal(shatterFreeBusterWall(last,()=>true).frame,9);assert.equal(last.visible,false);
});
