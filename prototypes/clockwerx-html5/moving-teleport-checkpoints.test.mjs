import test from 'node:test';import assert from 'node:assert/strict';
import {movingTeleportCheckpointRecipe,movingTeleportCheckpointSource} from './moving-teleport-checkpoints.fixture.mjs';
import {assertMovingTeleportCheckpointSource,assertMovingTeleportCheckpointRecipe,assertMovingTeleportCheckpointBoard,assertMovingTeleportCheckpointActor} from './moving-teleport-checkpoints.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';import {TeleportRuntime} from './teleport-runtime.mjs';
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,800,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const board=(s=movingTeleportCheckpointSource())=>buildDecodedBoard(s,movingTeleportCheckpointRecipe()),round=(s)=>new SourceRound(board(s),profiles());
test('moving HY checkpoints requires its own literal recipe and rejects borrowed capabilities',()=>{
 assert.deepEqual(levelRequirements(movingTeleportCheckpointSource(),movingTeleportCheckpointRecipe()),[]);assert.ok(levelRequirements(movingTeleportCheckpointSource()).length);
 for(const k of Object.keys(movingTeleportCheckpointRecipe()).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingTeleportCheckpointRecipe({...movingTeleportCheckpointRecipe(),[k]:false}));
 for(const k of['MovingTeleportDoors','MovingWaystation','SlidingConnectors','Oil','Bombs','Goodies'])assert.throws(()=>assertMovingTeleportCheckpointRecipe({...movingTeleportCheckpointRecipe(),['allow'+k]:true}));
});
test('moving HY checkpoint source preserves inactive hazards and validates closed programs and static pairs',()=>{
 const b=board();assert.equal(b.dots.length,7);assert.equal(b.inactiveActorCount,1);assert.equal(b.spikes.length,1);assert.equal(b.puddles.length,0);assert.equal(b.teleports.length,2);assert.ok(Object.isFrozen(b.movingTeleportCheckpointSource.cells));
 for(const mutate of[s=>s.blocks.find(b=>b.kind==='PU').records[0].rawWords[4]=15,s=>s.cells[48].inlineProgram.text='eepp',s=>s.blocks.find(b=>b.kind==='HY').records[1].rawWords[2]=5,s=>s.blocks.push({kind:'DR',count:1,records:[{}]}),s=>s.blocks.find(b=>b.kind==='WY').records[0].rawWords[2]=40]){const s=movingTeleportCheckpointSource();mutate(s);assert.throws(()=>assertMovingTeleportCheckpointSource(s));}
});
test('ordinary class2 qualification excludes faster clocks, wall checking and orbital actors',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:2,checksWalls:false,program:'fnn',sourcePC:1};assert.equal(assertMovingTeleportCheckpointActor(a),true);
 for(const m of[{speedClass:3},{sourceActorType:2,group:4400},{checksWalls:true},{program:'b'},{sourcePC:0}])assert.throws(()=>assertMovingTeleportCheckpointActor({...a,...m}));
});
test('frozen moving HY declarations and WY collision frames reject mutation before construction',()=>{
 assert.equal(assertMovingTeleportCheckpointBoard(board(),profiles()),true);for(const mutate of[b=>b.teleports[0].partner='0,0',b=>b.dots[0].color=1,b=>b.walls[0].frame++,b=>b.movingTeleportDoorRules=true]){const b=board();mutate(b);assert.throws(()=>assertMovingTeleportCheckpointBoard(b));}
 const p=profiles();delete p.dotOutlines.groups[300].frames[79];assert.throws(()=>new SourceRound(board(),p));
});
test('class2 moving rider uses the original class delta and moving pivot callback',()=>{
 const g=round(),a=g.enemies[0],x=g.point(a).x;for(let n=0;n<400;n++)g.update(1/120,{});assert.notEqual(g.point(a).x,x);assert.equal(a.frame,g.actorClasses.snapshot().classes[2].count&63);assert.equal(g.death,null);
});
test('human HY arrival preserves current canonical phase and updates moving-pivot status',()=>{
 const g=round();for(let n=0;n<100&&!g.events.some(e=>e.type==='teleport');n++)g.update(1/120,{flip:true});assert.equal(g.player.pivot,'1,2');assert.equal(g.player.movingPivot,false);assert.equal(g.player.transfers,1);assert.ok(g.teleports.snapshot().faders.length);assert.equal(g.death,null);
});
test('HY wall arrival performs the wall bounce before source reason36 death',()=>{
 const p=profiles();for(const g of[700,800])for(const f of p.outlines.groups[g].frames)Object.assign(f,{left:-2,top:-2,right:2,bottom:2,rows:Array.from({length:4},()=>[0,4]),collidable:true});const g=new SourceRound(board(movingTeleportCheckpointSource({wallAtTeleport:true})),p);g.player.pivot='1,0';const direction=g.player.direction;g.afterActorDotGrab(g.player,g.board.dots.find(d=>d.id==='1,0'));assert.equal(g.player.pivot,'1,2');assert.equal(g.player.direction,-direction);assert.ok(g.death);assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,36);
});
test('reset restores moving bonuses and checkpoint spawn while HY animation retains its reference',()=>{
 const g=round(),d=g.board.dots.find(d=>d.bonus),wy=g.board.dots.find(d=>d.waystation);g.onBonus(d);g.player.pivot=wy.id;g.onHumanGrab(wy);g.teleports.observeHyperspace(2);const before=g.teleports.snapshot().endpoints.map(e=>[e.frame,e.clockReference]);g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,wy.id);assert.equal(d.bonus,true);assert.deepEqual(g.teleports.snapshot().endpoints.map(e=>[e.frame,e.clockReference]),before);g.reset();assert.equal(g.player.pivot,'0,0');
});
test('moving HY checkpoint callback and teleport runtime require matching synchronous scope',()=>{
 const g=round(),a={...g.enemies[0]},noop=()=>{},o={program:a.program,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowTeleports:true,allowMovingTeleportCheckpoints:true,movingTeleportCheckpointScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 assert.ok(advanceStaticEnemyCallback(a,3,o));for(const m of[{dots:[...o.dots]},{sourceQuery:async()=>({allowed:false})},{program:null},{allowSliding:true},{allowMovingTeleportCheckpoints:1}])assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,...m}));assert.throws(()=>new TeleportRuntime(g.board.teleports,[...g.board.dots],{}, {allowMovingTeleportCheckpoints:true,board:g.board}));
});
