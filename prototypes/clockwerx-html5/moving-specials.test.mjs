import test from 'node:test';
import assert from 'node:assert/strict';
import {assertMovingSpecialScope,assertMovingSpecialDots,assertMovingSpecialActor,assertMovingSpecialSource} from './moving-specials.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {SourceRound} from './round.mjs';
import {markedGrabPrelude} from './marked-transfers.mjs';
import {queryIndexedSourceGrab} from './source-grab.mjs';
import {effectiveMovingCell} from './moving-dots.mjs';

const dot=(sourceIndex,cell=1)=>{
 const row=Math.floor(sourceIndex/11),column=sourceIndex%11,moving=!!(cell&0x80),bonus=!!(cell&2),goal=!!(cell&4),ring=!!(cell&8),waypoint=!!(cell&0x10),foreground=moving||bonus||goal||ring||waypoint;
 return {id:`${column},${row}`,sourceIndex,row,column,x:74+48*column,y:72+48*row,sourceInitialPosition:{x:74+48*column,y:72+48*row},cell,flags:15,color:0,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,motion:moving?'moving-program':'static',motionType:moving?1:0,...(moving?{movingProgram:'ew'}:{}),bonus,sourceInitialBonus:bonus,sourceHasSprite:foreground,kind:goal?'goal':bonus?'bonus':'dot',ring,protected:!!(cell&0x40),transferDeath:!!(cell&0x2000),sourceInBackground:!foreground,slideMask:0,teleport:false,...(waypoint?{waystation:{halfIndex:8,direction:-1}}:{})};
};
const actor=(sourceSlot,type,pivot,speedClass=1,program=null)=>({name:sourceSlot?'enemy':'player',sourceSlot,sourceActorType:type,group:type===0?700:type===2?4400:500,pivot,speedClass,program,sourcePC:program?1:undefined,checksWalls:sourceSlot===0,canonicalFrame:true,frame:0,unwrappedFrame:0,angle:0,direction:1,visible:true,orphaned:false});
function fixture(composition){
 const checkpoint=composition==='checkpoint-rings',dots=[dot(0),dot(1,5),dot(2,0x83),dot(3,checkpoint?0x4051:0x2001),dot(4,checkpoint?9:0x2001)];
 const actors=[actor(0,0,dots[0].id,0),actor(2,checkpoint?2:1,dots[2].id,1,checkpoint?'ns':null),...(checkpoint?[actor(3,1,dots[0].id,2)]:[])];
 return {composition,activeMask:1,difficulty:'Child',sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},movingDotRules:true,movingCheckpointRingRules:checkpoint,movingMarkedBonusRules:!checkpoint,markedTransferRules:!checkpoint,origin:{x:74,y:72},dots,actors,humanStarts:[dots[0].id,dots[0].id],spikes:[],bombs:[],goodies:[],connectors:[],walls:[],doors:[],switches:[],puddles:[],elevators:[],teleports:[]};
}
function round(composition){
 const s=fixture(composition),checkpoint=composition==='checkpoint-rings',board={...s,ordinal:1,title:'Synthetic moving special',radius:48,distanceTolerance:1,angularSpeed:1,handOffsetY:1,player:s.actors[0],enemies:s.actors.slice(1),demos:[],movingHumanStarts:s.humanStarts,movingDotRules:true,movingCheckpointRingRules:checkpoint,movingMarkedBonusRules:!checkpoint,markedTransferRules:!checkpoint,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,difficulty:'Child',timeLimit:90,sourceDotPermissions:true};
 const frames=Array.from({length:64},()=>({outlineIndex:-1,collidable:false})),outlines={groups:Object.fromEntries([700,4300,500,4400,4500].map(g=>[g,{frames}]))},dotOutlines={groups:{300:{frames:Array.from({length:207},()=>({outlineIndex:-1,collidable:false}))}}};
 return new SourceRound(board,{outlines,dotOutlines,deathFactory:()=>{throw new Error('No death trajectory in contract tests');}});
}

test('two explicit sibling scopes accept static goal/bonus movers and actual actor joins',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  const s=fixture(composition);assert.equal(assertMovingSpecialScope({...s,initial:true}),true);
  const black=structuredClone(s);black.actors[0].group=4300;assert.equal(assertMovingSpecialScope({...black,initial:true}),true);
  assert.throws(()=>assertMovingSpecialScope({...s,composition:undefined,initial:true}));
 }
});
test('strict dot boundary rejects moving specials, static bonuses, malformed identity and new families',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses'])for(const change of [
  s=>{s.dots[2].transferDeath=true;s.dots[2].cell|=0x2000;},
  s=>{s.dots[0].bonus=true;s.dots[0].sourceInitialBonus=true;s.dots[0].cell|=2;s.dots[0].kind='bonus';},
  s=>{s.dots[2].kind='goal';s.dots[2].cell|=4;},
  s=>{s.dots[2].motion='up-down';s.dots[2].motionType=2;},
  s=>{s.dots[2].teleport=true;},s=>{s.dots[2].slideMask=1;},s=>{s.dots[2].slowdown=true;},
  s=>{s.dots[2].sourceInitialPosition.x++;},s=>{s.dots[2].sourceHasSprite=false;},s=>{s.dots[1].id=s.dots[0].id;},
  s=>{s.guns=[{}];},s=>{s.triggers=[{}];},s=>{s.teleportRules=true;},s=>{s.pilotAbsentSlideRecoveryRules=true;},s=>{s.walls.push({});},s=>{s.puddles.push({});},s=>{s.bombs.push({});},s=>{s.spikes.push({});}
 ]){const s=fixture(composition);change(s);assert.throws(()=>assertMovingSpecialScope({...s,initial:true}));}
});
test('class2 stays FREE RED/static-start only; class1 n/s program permits a moving rider',()=>{
 const s=fixture('checkpoint-rings');assert.equal(assertMovingSpecialActor(s.actors[1],s),true);
 for(const change of [a=>a.program='n',a=>a.sourceActorType=2,a=>a.speedClass=3,a=>a.pivot=s.dots[2].id]){
  const a=structuredClone(s.actors[2]);change(a);assert.throws(()=>assertMovingSpecialActor(a,{...s,initial:true}));
 }
 const marked=fixture('marked-bonuses');marked.actors[1].program='n';marked.actors[1].sourcePC=1;assert.throws(()=>assertMovingSpecialScope({...marked,initial:true}));
});
test('direct NPC helper validates its scope and class2 free callback does not query or consume PC',()=>{
 const s=fixture('checkpoint-rings'),a=s.actors[2],calls=[];
 const options={program:null,dots:s.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:()=>calls.push('animate/collide'),onDotRelease:()=>{},onDotGrabFirst:()=>{},afterDotGrab:()=>{},allowMovingDots:true,allowMovingCheckpointRings:true,movingSpecialScope:s,sourceQuery:()=>{throw new Error('A free actor must not query');}};
 const result=advanceStaticEnemyCallback(a,2,options);assert.equal(result.state.frame,2);assert.equal(result.state.pivot,a.pivot);assert.deepEqual(calls,['animate/collide','animate/collide']);
 assert.throws(()=>advanceStaticEnemyCallback(a,1,{...options,allowMovingCheckpointRings:false}));
 assert.throws(()=>advanceStaticEnemyCallback(a,1,{...options,allowTeleports:true}));
 assert.throws(()=>advanceStaticEnemyCallback(a,1,{...options,movingSpecialScope:{...s,movingCheckpointRingRules:false}}));
 const programmed=s.actors[1];programmed.frame=15;programmed.unwrappedFrame=15;programmed.sourcePC=2;
 assert.throws(()=>advanceStaticEnemyCallback(programmed,1,{...options,program:'ns',sourceQuery:()=>Promise.resolve({allowed:false})}));
 assert.throws(()=>advanceStaticEnemyCallback(a,1,{...options,movingSpecialScope:{...s,puddles:[{}]}}));
});
test('moving source query respects live static-ring permission; initial ring invariants remain strict',()=>{
 const s=fixture('checkpoint-rings'),ring=s.dots[4];ring.humanCanGrab=false;ring.sourceCollidable=false;
 assert.equal(assertMovingSpecialDots(s.dots,s),true);assert.throws(()=>assertMovingSpecialDots(s.dots,{...s,initial:true}));
 const dots=s.dots.map(d=>({...d,currentPixel:{x:d.x,y:d.y},intermediate:{valid:false}}));
 const q=queryIndexedSourceGrab(dots,{originIndex:3,offset:{row:0,column:1},human:true,allowMovingQueries:true});assert.equal(q.allowed,false);assert.equal(q.grab.dot,ring.id);
});
test('new scopes consume moving bonus once and reset live fields/foreground identity without rewinding clocks',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  const g=round(composition),d=g.board.dots[2],before=g.actorClasses.snapshot();g.slideGrabHuman(d,g.player);
  assert.equal(d.bonus,false);assert.equal(d.cell&2,0);assert.equal(d.kind,'dot');assert.equal(d.sourceHasSprite,true);assert.equal(d.sourceInBackground,false);
  const bonus=g.childScore.roundBonus;g.slideGrabHuman(d,g.player);assert.equal(g.childScore.roundBonus,bonus);
  g.reset({preserveCheckpoint:true});assert.equal(d.bonus,true);assert.equal(d.kind,'bonus');assert.equal(d.sourceHasSprite,true);assert.deepEqual(g.actorClasses.snapshot(),before);
 }
});
test('checkpoint spawn/time and protection phase use existing reset rules; explicit restart restores original spawn',()=>{
 const g=round('checkpoint-rings'),d=g.board.dots[3];g.remainingTime=51;g.onHumanGrab(d);const overlay=g.dotAnimations.renderState(d.id).overlay;
 g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,d.id);assert.equal(g.remainingTime,51);assert.deepEqual(g.dotAnimations.renderState(d.id).overlay,overlay);
 g.reset();assert.equal(g.player.pivot,g.board.player.pivot);assert.equal(g.remainingTime,90);
});
test('white marks reuse the human-only real-grab prelude; primitive mask miss retains moving program bit',()=>{
 const s=fixture('marked-bonuses'),a=s.actors[0],old=s.dots[3],target=s.dots[4],calls=[];
 assert.equal(markedGrabPrelude(a,old,target,{realDot:true},{allowMarkedTransfers:true,onDeath:c=>calls.push(c.sourceReason)}),true);assert.deepEqual(calls,[37]);
 const npc=s.actors[1];assert.equal(markedGrabPrelude(npc,old,target,{realDot:true},{allowMarkedTransfers:true,onDeath:()=>assert.fail()}),false);
 assert.equal(effectiveMovingCell(0x2083,14,1),0x81);
});

const directOptions=(s,a)=>({program:a.program,dots:s.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:()=>{},onDotRelease:()=>{},onDotGrabFirst:()=>{},afterDotGrab:()=>{},allowMovingDots:true,allowMovingCheckpointRings:s.composition==='checkpoint-rings',allowMovingMarkedBonuses:s.composition==='marked-bonuses',movingSpecialScope:s,sourceQuery:()=>({allowed:false})});
function authoredConstructorProbe(composition,change){
 const g=round(composition),board=structuredClone(g.board);change(board);
 return new SourceRound(board,{outlines:g.outlines,dotOutlines:g.dotOutlines,deathFactory:g.deathFactory});
}
test('v2 actor type/group, human slot and authored canonical state reject before initialization',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  for(const change of [b=>b.enemies[0].group=700,b=>b.player.group=500,b=>{b.player.sourceActorType=6;b.player.group=4300;},b=>{b.enemies[0].frame=64;b.enemies[0].unwrappedFrame=0;},b=>b.enemies[0].unwrappedFrame=1,b=>b.enemies[0].canonicalFrame=false,b=>b.enemies[0].angle=Infinity,b=>b.player.angle=NaN])assert.throws(()=>authoredConstructorProbe(composition,change));
  const s=fixture(composition),a=s.actors[1];a.group=700;assert.throws(()=>advanceStaticEnemyCallback(a,0,directOptions(s,a)));
  const black=authoredConstructorProbe(composition,b=>b.player.group=4300);black.reset();assert.equal(black.player.group,4300);black.setPlayerGroup(700);assert.equal(black.player.sourceActorType,0);
  const alternate=actor(1,6,s.dots[0].id,0);alternate.group=4300;assert.equal(assertMovingSpecialActor(alternate,{...s,initial:true}),true);alternate.sourceActorType=0;assert.throws(()=>assertMovingSpecialActor(alternate,{...s,initial:true}));
 }
});
test('v2 normalized and direct helper boundaries require exact immutable Child/grid metadata',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses'])for(const change of [s=>s.activeMask=2,s=>s.difficulty='Adult',s=>delete s.sourceGrid,s=>s.sourceGrid.version=11,s=>s.sourceGrid.displaySizeRaw=6,s=>s.sourceGrid.rows=6,s=>s.sourceGrid.columns=9]){
  const s=fixture(composition);change(s);assert.throws(()=>assertMovingSpecialScope({...s,initial:true}));assert.throws(()=>advanceStaticEnemyCallback(s.actors[1],0,directOptions(s,s.actors[1])));
  assert.throws(()=>authoredConstructorProbe(composition,change));
 }
});
test('v2 retained program bytes, text, length and padding bind the live closed program when supplied',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  const s=fixture(composition);s.dots[2].sourceMovingProgram={offset:24,rawHex:'02657700',paddingHex:'00'};assert.equal(assertMovingSpecialScope({...s,initial:true}),true);
  for(const change of [d=>d.sourceMovingProgram.rawHex='026e7300',d=>d.sourceMovingProgram.paddingHex='',d=>d.sourceMovingProgram.text='ns',d=>d.sourceMovingProgram.offset=1,d=>d.sourceMovingProgram.rawHex='01657700']){const bad=structuredClone(s);change(bad.dots[2]);assert.throws(()=>assertMovingSpecialScope({...bad,initial:true}));assert.throws(()=>advanceStaticEnemyCallback(bad.actors[1],0,directOptions(bad,bad.actors[1])));}
  assert.throws(()=>authoredConstructorProbe(composition,b=>b.dots[2].sourceMovingProgram={offset:24,rawHex:'026e7300',paddingHex:'00'}));
 }
});
test('v2 inactive source properties and invented live bonus reject, while a genuine cleared bonus remains valid',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  assert.throws(()=>authoredConstructorProbe(composition,b=>b.dots[3].flags=14));
  const s=fixture(composition);s.dots.push(dot(5,0x83));s.dots[2].sourceInitialBonus=false;assert.throws(()=>assertMovingSpecialScope({...s,initial:false}));assert.throws(()=>advanceStaticEnemyCallback(s.actors[1],0,directOptions(s,s.actors[1])));
  const cleared=fixture(composition),d=cleared.dots[2];d.bonus=false;d.kind='dot';d.cell&=~2;d.collected=true;assert.equal(assertMovingSpecialScope({...cleared,initial:false}),true);assert.equal(advanceStaticEnemyCallback(cleared.actors[1],0,directOptions(cleared,cleared.actors[1])).state.pivot,d.id);
 }
});
test('v2 source property miss retains presence/color/ordinary program and runtime angle is not a pose equality gate',()=>{
 for(const composition of ['checkpoint-rings','marked-bonuses']){
  const s=fixture(composition);s.dots.push(dot(5,0x83));const d=s.dots[2];d.flags=254;d.color=1;d.cell=effectiveMovingCell(0x2083,d.flags,1);d.transferDeath=false;d.bonus=false;d.sourceInitialBonus=false;d.kind='dot';d.sourceMovingProgram={offset:24,rawHex:'02657700',paddingHex:'00'};
  assert.equal(assertMovingSpecialScope({...s,initial:true}),true);assert.equal(d.present,true);assert.equal(d.cell&0x80,0x80);assert.equal(d.color,1);
  const a=s.actors[1];a.frame=15;a.unwrappedFrame=79;a.angle=0.123;assert.equal(advanceStaticEnemyCallback(a,0,directOptions(s,a)).state.angle,0.123);
 }
});
