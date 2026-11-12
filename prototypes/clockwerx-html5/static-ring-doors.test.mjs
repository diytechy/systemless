import test from 'node:test';import assert from 'node:assert/strict';
import {staticRingDoorRecipe,staticRingDoorSource} from './static-ring-doors.fixture.mjs';
import {assertStaticRingDoorSource,assertStaticRingDoorRecipe,assertStaticRingDoorBoard} from './static-ring-doors.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},doorOutlines:{groups:Object.fromEntries([1300,3800,2900,1000].map(g=>[g,frames(100)]))},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const board=()=>buildDecodedBoard(staticRingDoorSource(),staticRingDoorRecipe()),round=()=>new SourceRound(board(),profiles());
test('static ring doors is default off with an exact separate capability recipe',()=>{
 assert.deepEqual(levelRequirements(staticRingDoorSource(),staticRingDoorRecipe()),[]);assert.ok(levelRequirements(staticRingDoorSource()).length);
 for(const k of Object.keys(staticRingDoorRecipe()).filter(k=>k.startsWith('allow')))assert.throws(()=>assertStaticRingDoorRecipe({...staticRingDoorRecipe(),[k]:false}));
 for(const k of['MovingGoalRails','StaticRingRails','Teleports','MovingDots','Bombs','Goodies','SlidingConnectors'])assert.throws(()=>assertStaticRingDoorRecipe({...staticRingDoorRecipe(),['allow'+k]:true}));
});
test('imported out-of-range programs bind null while raw references and PC survive',()=>{
 const b=board();assert.equal(b.enemies[0].program,null);assert.equal(b.enemies[0].sourceProgramReference,9);assert.equal(b.enemies[0].sourceRawPC,1);assert.equal(b.enemies[1].program,'nnn');assert.equal(b.enemies[1].sourcePC,1);assert.equal(b.inactiveActorCount,1);assert.equal(b.staticRingDoorSource.blocks[0].records[5].programReferenceRaw,8);
 const s=staticRingDoorSource();s.blocks[0].records[2].programReferenceRaw=1;s.blocks[0].records[2].rawWords[5]=1;assert.throws(()=>assertStaticRingDoorSource(s));
});
test('active colored rings and inactive ring bodies remain distinct',()=>{
 const b=board(),blue=b.dots.find(d=>d.id==='1,1'),inactive=b.dots.find(d=>d.id==='2,1');assert.equal(blue.ring,true);assert.equal(blue.color,4);assert.equal(inactive.ring,false);assert.equal(inactive.cell,0x4001);assert.equal(b.staticRingDoorSource.cells[13].flagsRaw,0x4009);assert.ok(Object.isFrozen(b.staticRingDoorSource.cells));
 assert.equal(b.dots.find(d=>d.id==='1,2').protected,true);assert.deepEqual(b.dots.find(d=>d.id==='1,2').waystation,{halfIndex:8,direction:-1});
});
test('source admission rejects unsupported actors, active blocks and door variants',()=>{
 for(const mutate of[s=>s.blocks.push({kind:'EX',count:1,records:[{}]}),s=>s.cells[0].flagsRaw|=128,s=>s.blocks.find(b=>b.kind==='DR').records[0].rawWords[2]=257,s=>s.blocks[0].records[2].rawWords[7]=4,s=>s.blocks.find(b=>b.kind==='SP').records[0].rawWords[4]=1]){const s=staticRingDoorSource();mutate(s);assert.throws(()=>assertStaticRingDoorSource(s));}
});
test('frozen declarations and collision profile requirements reject mutation before construction',()=>{
 const b=board();assert.equal(assertStaticRingDoorBoard(b,profiles()),true);for(const mutate of[b=>b.enemies[0].program='n',b=>b.doors[0].color=1,b=>b.dots[0].x++,b=>b.movingGoalRailRules=true]){const b=board();mutate(b);assert.throws(()=>assertStaticRingDoorBoard(b));}
 const p=profiles();delete p.dotOutlines.groups[300].frames[51];assert.throws(()=>new SourceRound(board(),p));
});
test('static composition observes door contacts and resets consumed bonus and door state',()=>{
 const g=round(),bonus=g.board.dots.find(d=>d.bonus);g.onBonus(bonus);assert.equal(bonus.bonus,false);g.doorSystem.contact('invented',0);for(let n=0;n<20;n++)g.doorSystem.observeClock(n);assert.notEqual(g.doorSystem.snapshot().doors[0].phase,0);g.reset();assert.equal(bonus.bonus,true);assert.equal(g.doorSystem.snapshot().doors[0].phase,0);assert.equal(g.dotAnimations.renderState('2,0').goal.first,17);
});
test('static ring door callback requires original dot scope, synchronous query and bound program',()=>{
 const g=round(),a={...g.enemies[1]},noop=()=>{},o={program:a.program,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowStaticRingDoors:true,staticRingDoorScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 assert.ok(advanceStaticEnemyCallback(a,1,o));for(const m of[{dots:[...o.dots]},{sourceQuery:async()=>({allowed:false})},{program:null},{allowSliding:true},{allowStaticRingDoors:1}])assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,...m}));
});
test('ring release orphans an occupant while preserving its canonical kinematics',()=>{
 const g=round(),d=g.board.dots.find(d=>d.ring),a=g.enemies[0];a.pivot=d.id;const before={frame:a.frame,direction:a.direction};g.onHumanRelease(d,g.player);assert.equal(d.humanCanGrab,false);assert.equal(a.orphaned,true);assert.deepEqual({frame:a.frame,direction:a.direction},before);assert.equal(a.orphanDeadline,g.guestTicks+25);
});
test('protected checkpoint saves WY facing and round reset can preserve or restart it',()=>{
 const g=round(),d=g.board.dots.find(d=>d.waystation);g.remainingTime=75;g.player.pivot=d.id;g.onHumanGrab(d);assert.equal(g.dotAnimations.savedSpawn.pivot,d.id);assert.equal(g.dotAnimations.savedSpawn.direction,-1);assert.equal(g.dotAnimations.savedSpawn.angle,Math.PI/2);assert.equal(g.dotAnimations.savedTime,75);g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,d.id);g.reset();assert.equal(g.player.pivot,'0,0');
});
