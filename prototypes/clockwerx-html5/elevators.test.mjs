import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeElevatorRecord,activeElevatorSpecs,elevatorGeometry,createUpDownState,activateUpDownState,advanceUpDownState,advanceUpDownSurface,upDownPlacement,createElevatorSystem,findElevatorContact} from './elevators.mjs';
const record=(mask=15)=>({rawWords:[2,3,3,1,0,mask]});
test('EL keeps subcell and group separate and filters activation before capacity',()=>{
 assert.deepEqual(decodeElevatorRecord(record()),{row:2,column:3,subcell:3,group:1,activationMask:15});
 assert.equal(activeElevatorSpecs([record(14),record(15)]).length,1);
 assert.equal(activeElevatorSpecs(Array.from({length:13},()=>record(14))).length,0);
 assert.throws(()=>activeElevatorSpecs(Array.from({length:13},()=>record(15))),/capacity/);
 assert.throws(()=>decodeElevatorRecord({rawWords:[2,3,4,1,0,15]}),/subcell/);
 assert.deepEqual(elevatorGeometry(decodeElevatorRecord(record())),{x:206,y:157});
});
test('a raised dot denies human grabs on the first lowering callback and sinks in twelve callbacks',()=>{
 let s=activateUpDownState(createUpDownState({group:1,clockCount:7}));
 assert.equal(s.humanAvailable,true);assert.equal(s.phase,12);
 const same=advanceUpDownState(s,7);assert.deepEqual(same.state,s);assert.deepEqual(same.events,[]);
 let lowered=0;for(let count=8;count<20;count++){const result=advanceUpDownState(s,count);s=result.state;lowered+=result.events.filter(e=>e.type==='lowered').length;assert.equal(s.humanAvailable,false);assert.equal(s.mainVisible,s.phase>=2);}
 assert.equal(s.phase,0);assert.equal(s.step,0);assert.equal(lowered,1);
 assert.deepEqual(advanceUpDownState(s,50).events,[]);
});
test('a changed counter advances once and rising becomes available only at the final callback',()=>{
 let s=activateUpDownState(createUpDownState({group:1,initialLowered:true}));
 s=advanceUpDownState(s,100).state;assert.equal(s.phase,1);assert.equal(s.humanAvailable,false);
 for(let count=101;count<112;count++)s=advanceUpDownState(s,count).state;
 assert.equal(s.phase,12);assert.equal(s.step,0);assert.equal(s.humanAvailable,true);assert.equal(s.mainVisible,true);
 assert.throws(()=>advanceUpDownState(s,111-1),/Monotonic/);
});
test('reversal changes direction in transit and a double activation at an endpoint cancels',()=>{
 let s=activateUpDownState(createUpDownState({group:1}));s=activateUpDownState(s);assert.equal(s.step,0);assert.equal(s.humanAvailable,true);
 s=activateUpDownState(s);s=advanceUpDownState(s,1).state;s=activateUpDownState(s);assert.equal(s.step,1);assert.equal(s.phase,11);assert.equal(s.humanAvailable,false);
 s=advanceUpDownState(s,2).state;assert.equal(s.phase,12);assert.equal(s.humanAvailable,true);
 s=activateUpDownState(activateUpDownState(createUpDownState({group:1,initialLowered:true})));assert.equal(s.step,0);assert.equal(s.phase,0);
});
test('each entrant toggles the shared group while occupancy only changes the button artwork',()=>{
 const spec=decodeElevatorRecord(record()),g=createElevatorSystem([spec,{...spec,column:4}],[{id:'a',group:1},{id:'b',group:1},{id:'c',group:0}]);
 assert.deepEqual(g.contact('human',0).map(e=>e.type),['toggle','toggle','enter']);assert.equal(g.snapshot().controls[0].frame,6);
 assert.deepEqual(g.contact('human',0),[]);g.contact('enemy',0);assert.equal(g.snapshot().controls[0].occupants,2);assert.equal(g.snapshot().dots[0].step,0);
 const events=g.contact('human',1);assert.deepEqual(events.map(e=>e.type),['toggle','toggle','enter','leave']);assert.equal(g.snapshot().controls[0].occupants,1);assert.equal(g.snapshot().controls[1].occupants,1);assert.equal(g.snapshot().dots[2].step,0);
 g.contact('enemy',-1);assert.equal(g.snapshot().controls[0].frame,5);
});
test('phase effects precede occupant loss and a latched death freezes later dot callbacks',()=>{
 const g=createElevatorSystem([decodeElevatorRecord(record())],[{id:'a',group:1},{id:'b',group:1}]);g.contact('human',0);let frozen=false;const effects=[];
 for(let count=1;count<=12;count++)g.observeClock(count,{onPhase:(id,s)=>effects.push([id,s.phase]),onLowered:id=>{effects.push(['occupants',id]);frozen=true;},isFrozen:()=>frozen});
 assert.deepEqual(effects.slice(-2),[['a',0],['occupants','a']]);assert.equal(g.snapshot().dots[1].phase,1);
 g.reset(20);assert.equal(g.snapshot().dots[0].phase,12);assert.equal(g.snapshot().controls[0].occupants,0);assert.deepEqual(g.contact('human',-1),[]);
});
test('contact uses the small source glyph outline and first source slot rather than the button body',()=>{
 const spec=decodeElevatorRecord(record()),g=createElevatorSystem([spec,{...spec}],[{id:'a',group:1}]),controls=g.snapshot().controls;
 const f={left:33,top:32,right:37,bottom:36,rows:null,outlineIndex:3,flipY:false},profile={groups:{3400:{frames:Array.from({length:9},()=>f)}}},base=controls[0];
 assert.equal(findElevatorContact({left:base.x+34,top:base.y+33,right:base.x+35,bottom:base.y+34,rows:null},controls,profile),0);
 assert.equal(findElevatorContact({left:base.x+24,top:base.y+23,right:base.x+25,bottom:base.y+24,rows:null},controls,profile),-1);
});
test('lowering moves the dot and its riders left/down while nonhuman presence permission remains',()=>{
 let s=activateUpDownState(createUpDownState({group:1}));s=advanceUpDownState(s,1).state;
 assert.deepEqual(upDownPlacement(s,{x:100,y:80}),{x:99,y:81,humanCanGrab:false,nonhumanCanGrab:true,sourceCollidable:true,upDownPhase:11,upDownVisible:true});
 for(let c=2;c<=12;c++)s=advanceUpDownState(s,c).state;
 const final=upDownPlacement(s,{x:100,y:80});assert.equal(final.x,88);assert.equal(final.y,92);assert.equal(final.nonhumanCanGrab,true);assert.equal(final.sourceCollidable,false);
});
test('surface glints use their separate clock, freeze in transit and resume after raising',()=>{
 let s=createUpDownState({group:1,surfaceCount:5});s=advanceUpDownSurface(s,6);assert.equal(s.surfaceFrame,137);assert.equal(advanceUpDownSurface(s,6).surfaceFrame,137);
 s=advanceUpDownState(activateUpDownState(s),1).state;assert.equal(s.phase,11);assert.equal(s.surfaceFrame,135);s=advanceUpDownSurface(s,100);assert.equal(s.surfaceFrame,135);
 s=advanceUpDownState(activateUpDownState(s),2).state;assert.equal(s.phase,12);assert.equal(advanceUpDownSurface(s,100).surfaceFrame,135);
 s=advanceUpDownSurface(s,101);assert.equal(s.surfaceFrame,136);s=advanceUpDownSurface(s,110);assert.equal(s.surfaceFrame,137,'a changed source counter advances once, without catch-up');
 assert.throws(()=>advanceUpDownSurface(s,109),/Monotonic/);
});
