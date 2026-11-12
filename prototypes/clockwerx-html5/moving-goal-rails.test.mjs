import test from 'node:test';import assert from 'node:assert/strict';
import {movingGoalRailRecipe,movingGoalRailSource} from './moving-goal-rails.fixture.mjs';
import {assertMovingGoalRailRecipe,assertMovingGoalRailActor,assertMovingGoalRailSource,buildMovingGoalRailBoard,assertMovingGoalRailBoard} from './moving-goal-rails.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const round=(s=movingGoalRailSource())=>new SourceRound(buildDecodedBoard(s,movingGoalRailRecipe()),profiles());

test('moving goal rails has its own literal capability and excludes borrowed families',()=>{
 const o=movingGoalRailRecipe();assert.equal(assertMovingGoalRailRecipe(o),true);for(const k of Object.keys(o).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingGoalRailRecipe({...o,[k]:false}));
 for(const k of['MovingTeleportDoors','MovingGoalOrdinary','MovingProtectedPassage','Teleports','Bombs','Elevators','Goodies'])assert.throws(()=>assertMovingGoalRailRecipe({...o,['allow'+k]:true}));
 assert.deepEqual(levelRequirements(movingGoalRailSource(),o),[]);assert.ok(levelRequirements(movingGoalRailSource(),{...o,allowMovingGoalRails:1}).length);
});

test('moving goal rail source validates Pascal bytes, static horizontal endpoints and active records',()=>{
 assert.equal(assertMovingGoalRailSource(movingGoalRailSource()),true);assert.equal(assertMovingGoalRailSource(movingGoalRailSource({goalColor:0})),true);
 for(const mutate of[s=>s.cells[24].inlineProgram.text='eepp',s=>s.cells[24].inlineProgram.rawHex='0465707770ff',s=>s.blocks.find(b=>b.kind==='EX').records[0].rawWords=[2,2,0],s=>s.blocks.find(b=>b.kind==='EX').records[0].rawWords=[4,2,256],s=>s.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=14,s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[7]=3,s=>s.blocks.push({kind:'HY',count:1,records:[{}]})]){const s=movingGoalRailSource();mutate(s);assert.throws(()=>assertMovingGoalRailSource(s));}
});

test('moving goal rail actors bind class1 programs and separate human clocks',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:1,checksWalls:false,program:'fns',sourcePC:1};assert.equal(assertMovingGoalRailActor(a),true);
 for(const m of[{speedClass:3},{checksWalls:true},{program:'b'},{sourcePC:0},{group:4500},{sourceActorType:4}])assert.throws(()=>assertMovingGoalRailActor({...a,...m}));
});

test('moving goal rail declarations are detached, frozen and preserve inactive and lowered records',()=>{
 const s=movingGoalRailSource(),before=JSON.stringify(s),b=buildMovingGoalRailBoard(s,movingGoalRailRecipe());assert.equal(JSON.stringify(s),before);assert.equal(assertMovingGoalRailBoard(b),true);assert.ok(Object.isFrozen(b.movingGoalRailSource.cells[24]));assert.equal(b.inactiveActorCount,1);assert.equal(b.enemies.length,3);assert.equal(b.teleportRules,undefined);assert.equal(b.dots[49].cell&0x4000,0x4000);assert.ok(b.connectors.every(e=>e.bonus));
 for(const mutate of[b=>b.dots[0].x++,b=>b.connectors[0].second='0,0',b=>b.enemies[0].program='f',b=>b.movingGoalOrdinaryRules=true]){const x=buildMovingGoalRailBoard(movingGoalRailSource(),movingGoalRailRecipe());mutate(x);const prior=JSON.stringify(x);assert.throws(()=>assertMovingGoalRailBoard(x));assert.equal(JSON.stringify(x),prior);}
});

test('moving goal misc follows the current goal and retains its independent phase on reset',()=>{
 const g=round(),d=g.board.dots.find(d=>d.kind==='goal'),x=d.x;for(let i=0;i<240;i++)g.update(1/120,{});assert.notEqual(d.x,x);const misc=g.dotAnimations.renderState(d.id).goal;assert.deepEqual(misc.rawBase,{x:d.x-16,y:d.y-15});assert.equal(misc.first,17);assert.equal(misc.last,22);
 const classes=g.actorClasses.snapshot();g.reset();assert.deepEqual(g.actorClasses.snapshot(),classes);assert.deepEqual({x:d.x,y:d.y},d.sourceInitialPosition);assert.equal(g.dotAnimations.renderState(d.id).goal.frame,misc.frame);assert.equal(g.death,null);
});

test('goal body color does not change the source TYPE1 goal misc or completion award',()=>{
 for(const color of[0,1]){const g=round(movingGoalRailSource({goalColor:color})),d=g.board.dots.find(d=>d.kind==='goal');assert.equal(d.color,color);assert.equal(g.dotAnimations.renderState(d.id).goal.frame,17);g.player.pivot=d.id;g.player.movingPivot=true;g.slideGrabHuman(d,g.player);assert.equal(g.complete,true);assert.equal(g.childScore.roundBonus,1000);}
});

test('ordinary class1 riders retain canonical frames while the moving goal transports them',()=>{
 const s=movingGoalRailSource(),a=s.blocks.find(b=>b.kind==='WA').records[3];a.gridPosition={row:2,column:2};a.rawWords[0]=a.rawWords[1]=2;const g=round(s),r=g.enemies[1],x=g.point(r).x,f=r.frame;for(let i=0;i<240;i++)g.update(1/120,{});assert.notEqual(g.point(r).x,x);assert.equal(r.frame,(f+g.actorClasses.snapshot().classes[1].count)&63);assert.equal(g.death,null);
});

test('human rail entry uses ordinary source dispatch and keeps the original connector paint state',()=>{
 const s=movingGoalRailSource();for(const a of s.blocks.find(b=>b.kind==='WA').records.slice(0,2)){a.gridPosition={row:4,column:2};a.rawWords[0]=4;a.rawWords[1]=2;a.initialFrameHalfIndexRaw=31;a.rawWords[3]=31;}
 const g=round(s),target=g.board.dots.find(d=>d.id==='5,4'),arrived=()=>g.player.pivot===target.id&&!g.player.sliding&&g.point(g.player).x===target.x&&g.point(g.player).y===target.y;
 for(let i=0;i<1000&&!arrived();i++)g.update(1/120,{});
 assert.equal(arrived(),true);assert.equal(g.sourcePaint.original.connectors.length,3);assert.equal(g.death,null);
});

test('moving goal color remains separate from explicit human and nonhuman availability',()=>{
 const g=round(),red={...g.enemies[0],pivot:'2,1',frame:16,unwrappedFrame:16,angle:Math.PI/2,canonicalFrame:true},blue={...g.enemies[1],pivot:'2,1',frame:16,unwrappedFrame:16,angle:Math.PI/2,canonicalFrame:true};
 const d=g.board.dots.find(d=>d.id==='2,2'),r=g.sourceGrabQuery(red,false),b=g.sourceGrabQuery(blue,false);assert.equal(d.flags,255);assert.equal(d.color,1);assert.equal(r.allowed,true);assert.equal(r.grab.dot,d.id);assert.equal(b.allowed,true);assert.equal(b.grab.dot,d.id);
 d.nonhumanCanGrab=false;assert.equal(g.sourceGrabQuery(red,false).allowed,false);assert.equal(g.sourceGrabQuery(blue,false).allowed,false);assert.equal(g.sourceGrabQuery({...g.player,pivot:'2,1',frame:16},true).allowed,true);
});

test('reset restores the propagated connector bonus network after collecting it',()=>{
 const g=round(),initial=g.board.dots.map(d=>[d.id,d.cell,d.bonus,d.kind]),connectors=g.board.connectors.map(e=>e.bonus),d=g.board.dots.find(d=>d.id==='3,4');g.onBonus(d);assert.ok(g.board.connectors.every(e=>!e.bonus));g.reset();assert.deepEqual(g.board.connectors.map(e=>e.bonus),connectors);assert.deepEqual(g.board.dots.map(d=>[d.id,d.cell,d.bonus,d.kind]),initial);
});

test('moving goal rail callbacks require exact synchronous scope and program identity',()=>{
 const g=round(),a={...g.enemies[0]},noop=()=>{},o={program:a.program,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowSliding:true,allowMovingGoalRails:true,movingGoalRailScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 assert.ok(advanceStaticEnemyCallback(a,1,o));for(const m of[{dots:[...o.dots]},{sourceQuery:async()=>({allowed:false})},{program:'f'},{allowTeleports:true},{allowMovingGoalRails:1}])assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,...m}));
});
