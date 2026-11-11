import test from 'node:test';
import assert from 'node:assert/strict';
import {assertFreeBusterActor} from './free-busters.mjs';
import {GunTriggerRuntime,activeGunTriggerSpecs,gunTriggerBombHit,gunPaintFrames} from './gun-triggers.mjs';
import {assertBombRuntimeScope,bombActors} from './bomb-runtime.mjs';
import {SourceRound} from './round.mjs';
import {gunBusterSource} from './gun-busters.mjs';
const actor=(type=3)=>({sourceActorType:type,sourceSlot:2,speedClass:5,program:'nsns',sourcePC:1,checksWalls:false,visible:true});
const pool=()=>new GunTriggerRuntime({guns:activeGunTriggerSpecs([{rawWords:[2,2,3,1,2,0,1]}],{kind:'GN',gridOrigin:{x:74,y:72},frameOrigin:{x:28,y:28}}),triggers:activeGunTriggerSpecs([{rawWords:[2,2,3,1,0,1]}],{kind:'TR',gridOrigin:{x:74,y:72},frameOrigin:{x:28,y:28}}),rawBounds:{left:0,top:0,right:584,bottom:424},frameOrigin:{x:28,y:28},templateReference:0});
test('source human half-indices retain the original normalized second revolution',()=>{
 const wa=(type,half)=>({actorTypeRaw:type,activationMaskRaw:1,initialFrameHalfIndexRaw:half,programReferenceRaw:-1,version12ByteRaw:0,gridPosition:{row:0,column:0},rawWords:[0,0,type,half,1,65535,1,type===5?1:0]});
 const s={structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells:Array.from({length:88},(_,i)=>({present:true,row:Math.floor(i/11),column:i%11,flagsRaw:i===87?0x4005:1,secondaryRaw:1})),blocks:[{kind:'WA',count:3,records:[wa(0,40),wa(6,48),wa(5,0)]},...['GN','TR'].map(kind=>({kind,count:1,records:[{rawWords:kind==='GN'?[1,1,3,0,1,0,1]:[1,1,3,0,0,1]}]}))]};
 assert.equal(gunBusterSource(s,{x:74,y:72}).guns.length,1);s.blocks[0].records[2].initialFrameHalfIndexRaw=40;assert.throws(()=>gunBusterSource(s,{x:74,y:72}));
});
test('gun/buster class5 ordinary callbacks need their explicit composition',()=>{
 assert.throws(()=>assertFreeBusterActor(actor()));assert.equal(assertFreeBusterActor(actor(),true),true);
 for(const change of [{sourceActorType:2},{program:'b'},{speedClass:1},{sourcePC:5},{checksWalls:true},{movingPivot:true}])assert.throws(()=>assertFreeBusterActor({...actor(),...change},true));
 assert.throws(()=>assertBombRuntimeScope({allowGunBusters:true}));
 const a=actor();bombActors([a],{guestTick:10,allowFreeBusters:true,allowGunBusters:true,collides:()=>true,onDeath:()=>assert.fail(),onHidden:()=>{}});assert.equal(a.hiddenUntil,310);assert.equal(a.visible,false);
});
test('GN/TR bomb footprint follows placement rather than pixel collision',()=>{
 const g={row:3,column:4};
 for(const placement of [1,2,3])for(let row=2;row<=5;row++)for(let column=3;column<=6;column++)assert.equal(gunTriggerBombHit({row,column,placement},g),placement===1?column===4&&[3,4].includes(row):placement===2?row===3&&[4,5].includes(column):row===3&&column===4);
 assert.throws(()=>gunTriggerBombHit({row:0,column:0,placement:0},g));
});
test('bombing retains launched projectiles and occupied trigger cache until exit, reset restores sources',()=>{
 const p=pool(),h={sourceSlot:0,sourceActorType:0,visible:true};p.contact(h,()=>true);
 const bullet=p.slots[0];assert.equal(p.triggers[0].occupancy,1);
 assert.deepEqual(p.bomb('GN',{row:2,column:2}),[{type:'gun-bombed',id:0}]);assert.deepEqual(gunPaintFrames(p.guns[0]),[7]);
 assert.deepEqual(p.bomb('TR',{row:2,column:2}),[{type:'trigger-bombed',id:0}]);assert.equal(p.contacts.get(0),0);assert.equal(p.triggers[0].occupancy,1);assert.equal(p.slots[0],bullet);
 assert.deepEqual(p.activateColor(1),[]);p.contact(h,()=>true);assert.equal(p.triggers[0].occupancy,0);assert.equal(p.contacts.get(0),-1);
 p.reset();assert.equal(p.guns[0].enabled,true);assert.equal(p.triggers[0].visible,true);assert.equal(p.slots.filter(Boolean).length,0);
});
test('gun and buster clones share allocation and discriminate human hits and wall callbacks',()=>{
 const p=pool();p.launchBuster({sourceActorType:5,sourceSlot:3,frame:7,speedClass:1,frameReference:0},{x:200,y:200},{x:1,y:0});p.activateColor(1);
 assert.equal(p.slots[0].projectileType,1);assert.equal(p.slots[1].gun,0);
 const h={sourceActorType:0,visible:true};assert.equal(p.humanHit(h,q=>{assert.equal(q.slot,1);return true;}).object,1);
 let buster=0,bullet=0;p.advance(1,{classes:{1:{count:1}},busterWall:q=>{assert.equal(q.slot,0);buster++;return null;},wall:q=>{assert.equal(q.slot,1);bullet++;return true;}});
 assert.equal(buster,1);assert.equal(bullet,1);assert.ok(p.slots[0]);assert.equal(p.slots[1],null);
});
test('round enables human trigger and projectile checks only in the gun/buster join',()=>{
 const h={sourceActorType:0},r={board:{freeBusterRules:true,gunBusterRules:false},collider:()=>null,gunTriggers:{contact:()=>assert.fail(),humanHit:()=>assert.fail()}};
 SourceRound.prototype.contactGunTrigger.call(r,h);assert.equal(SourceRound.prototype.projectileCollision.call(r),null);
 let contacts=0;r.board.gunBusterRules=true;r.emitGunTriggerEvents=()=>{};r.gunTriggers.contact=()=>{contacts++;return[];};r.gunTriggers.humanHit=()=>({reason:'projectile'});r.player=h;
 SourceRound.prototype.contactGunTrigger.call(r,h);assert.equal(contacts,1);assert.deepEqual(SourceRound.prototype.projectileCollision.call(r),{reason:'projectile'});
 SourceRound.prototype.contactGunTrigger.call(r,{sourceActorType:5});assert.equal(contacts,1);
});
