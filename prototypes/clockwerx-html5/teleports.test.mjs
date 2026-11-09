import test from 'node:test';
import assert from 'node:assert/strict';
import {activeTeleportSpecs,decodeTeleportRecord,pairTeleportSpecs,teleportOrdinaryActor} from './teleports.mjs';
const record=(row,column,channel,mask=15)=>({rawWords:[row,column,channel,0,mask]});
const dot=(id,row,column)=>({id,row,column,x:column*48,y:row*48,present:true,humanCanGrab:false,kind:'goal'});

test('HY filtering precedes capacity and preserves source endpoint order',()=>{
 const records=Array.from({length:30},()=>record(0,0,0,14));
 records.splice(8,0,record(1,2,4));records.push(record(2,2,4));
 const specs=activeTeleportSpecs(records);
 const dots=[dot('second',2,2),dot('first',1,2)];
 const endpoints=pairTeleportSpecs(specs,dots);
 assert.deepEqual(endpoints.map(e=>[e.dot,e.partner,e.initialFrame]),[['first','second',9],['second','first',10]]);
 assert.equal(records.length,32);assert.equal(dots[0].humanCanGrab,false);
 assert.throws(()=>activeTeleportSpecs(Array.from({length:23},()=>record(0,0,0))),/capacity/);
});

test('unmatched, duplicate, overfull channels and missing pivots remain rejected',()=>{
 const a=dot('a',0,0),b=dot('b',0,1),c=dot('c',0,2);
 const specs=records=>activeTeleportSpecs(records);
 assert.throws(()=>pairTeleportSpecs(specs([record(0,0,0)]),[a]),/Exactly two/);
 assert.throws(()=>pairTeleportSpecs(specs([record(0,0,0),record(0,0,0)]),[a]),/Duplicate/);
 assert.throws(()=>pairTeleportSpecs(specs([record(0,0,0),record(0,1,0),record(0,2,0)]),[a,b,c]),/Exactly two/);
 assert.throws(()=>pairTeleportSpecs(specs([record(0,0,0),record(0,1,0)]),[a]),/present/);
 assert.throws(()=>decodeTeleportRecord(record(0,0,25)),/channel/);
 assert.throws(()=>decodeTeleportRecord({rawWords:[0,0,0,15]}),/Five/);
});

test('wall-free teleport retains angular/action state and orders sound, old-pose fader and placement',()=>{
 const actor={sourceActorType:0,sourceSlot:0,pivot:'old',frame:17,unwrappedFrame:81,direction:-1,sourcePC:4,transfers:2,blocked:0};
 const before={...actor},destination=dot('new',2,3),events=[];
 const adapters={sound:(id,a)=>events.push(['sound',id,a.pivot]),startFader:a=>events.push(['fader',a.pivot,a.frame]),place:(a,d)=>events.push(['place',a.pivot,d.x,d.y]),checkWalls:a=>{events.push(['wall',a.pivot,a.frame]);return false;},onWallDeath:(a,e)=>events.push(['death',a.pivot,e.reason])};
 assert.equal(teleportOrdinaryActor(actor,destination,adapters),true);
 assert.deepEqual(events,[['sound',26,'old'],['fader','old',17],['place','new',144,96],['wall','new',17]]);
 assert.deepEqual(actor,{...before,pivot:'new'});
 assert.equal(destination.humanCanGrab,false,'WATeleport does not reject destination permission');
 assert.equal(destination.kind,'goal','destination goal is not consumed by this primitive');
});

test('full destination wall check applies its bounce before reason36',()=>{
 const actor={sourceActorType:0,sourceSlot:0,pivot:'old',frame:17,unwrappedFrame:81,direction:-1},events=[];
 const adapters={sound:()=>{},startFader:()=>{},place:()=>{},checkWalls:a=>{events.push(['wall',a.pivot,a.frame]);a.direction*=-1;events.push(['bounce',a.direction]);return true;},onWallDeath:(a,e)=>events.push(['death',a.direction,e.reason])};
 teleportOrdinaryActor(actor,dot('new',0,1),adapters);
 assert.deepEqual(events,[['wall','new',17],['bounce',1],['death',1,36]]);
 assert.equal(actor.frame,17);assert.equal(actor.pivot,'new');assert.equal(actor.direction,1);
});

test('ordinary enemies teleport without human sound; orbitals perform no teleport effects',()=>{
 const events=[],destination=dot('target',0,0);
 const adapters={sound:()=>events.push('sound'),startFader:()=>events.push('fader'),place:()=>events.push('place'),checkWalls:()=>false,onWallDeath:()=>events.push('death')};
 assert.equal(teleportOrdinaryActor({sourceActorType:2,sourceSlot:3,pivot:'old',frame:16,unwrappedFrame:80,direction:1},destination,adapters),true);
 assert.deepEqual(events,['fader','place']);events.length=0;
 const orbital={sourceActorType:4,sourceSlot:4,pivot:'old'};
 assert.equal(teleportOrdinaryActor(orbital,destination,adapters),false);
 assert.equal(orbital.pivot,'old');assert.deepEqual(events,[]);
 assert.throws(()=>teleportOrdinaryActor({sourceActorType:2,sourceSlot:0},destination,adapters),/slot/);
 assert.throws(()=>teleportOrdinaryActor({sourceActorType:2,sourceSlot:31},destination,adapters),/slot/);
});

test('missing adapters fail before pivot mutation and async faders cannot reorder teleport effects',()=>{
 const actor={sourceActorType:1,sourceSlot:2,pivot:'old',frame:0,unwrappedFrame:0,direction:1},destination=dot('new',0,0);
 assert.throws(()=>teleportOrdinaryActor(actor,destination,{}),/Complete/);assert.equal(actor.pivot,'old');
 assert.throws(()=>teleportOrdinaryActor(actor,destination,{sound:()=>{},startFader:()=>Promise.resolve(),place:()=>{},checkWalls:()=>false,onWallDeath:()=>{}}),/Asynchronous/);
 assert.equal(actor.pivot,'old');
});
