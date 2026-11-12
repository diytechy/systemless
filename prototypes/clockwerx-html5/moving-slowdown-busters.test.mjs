import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingSlowdownBusterRecipe,assertMovingSlowdownBusterSource,assertMovingSlowdownBusterBoard,assertMovingSlowdownBusterActor} from './moving-slowdown-busters.mjs';
import {movingSlowSource,movingSlowRecipe,movingSlowBoard} from './moving-slowdown-busters.fixture.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';
import {dotBodyFrame} from './dots.mjs';
import {bombActors} from './bomb-runtime.mjs';

test('moving Slow composition requires explicit capabilities and retains earlier family gates',()=>{
 const o=movingSlowRecipe();assert.equal(assertMovingSlowdownBusterRecipe(o),true);
 for(const key of Object.keys(o).filter(k=>k.startsWith('allow'))){const bad={...o,[key]:false};assert.throws(()=>assertMovingSlowdownBusterRecipe(bad));}
 for(const extra of['StaticSlowdown','StaticSlowdownBusters','MovingBusterBombs','Goodies','Elevators','MarkedTransfers'])assert.throws(()=>assertMovingSlowdownBusterRecipe({...o,['allow'+extra]:true}));
 assert.throws(()=>assertMovingSlowdownBusterRecipe({...o,allowMovingSlowdownBusters:'true'}));
});
test('invented moving Slow source validates geometry, classes, programs and fixed buster packs',()=>{
 assert.equal(assertMovingSlowdownBusterSource(movingSlowSource()),true);
 for(const mutate of[
  s=>s.cells[1*11+3].secondaryRaw=31,
  s=>s.blocks.find(b=>b.kind==='WA').records[3].rawWords[7]=3,
  s=>s.blocks.find(b=>b.kind==='WA').records[4].actorTypeRaw=1,
  s=>s.blocks.find(b=>b.kind==='WA').records[6].rawWords[4]=65535,
  s=>s.blocks.find(b=>b.kind==='WA').records[2].programReferenceRaw=0,
  s=>s.cells[1*11+3].inlineProgram.rawHex='026e7301',
  s=>s.cells[2*11+2].secondaryRaw=31,
  s=>s.blocks.push({kind:'GO',count:1,records:[{rawWords:[1,1,0,0,15]}]}),
 ]){const s=movingSlowSource();mutate(s);assert.throws(()=>assertMovingSlowdownBusterSource(s));}
});
test('normalized moving Slow declaration guard is read-only and rejects source/board drift',()=>{
 const b=movingSlowBoard(),before=JSON.stringify(b);assert.equal(assertMovingSlowdownBusterBoard(b),true);assert.equal(JSON.stringify(b),before);
 assert.equal(Object.isFrozen(b.movingSlowdownBusterSource.cells),true);
 assert.equal(b.dots.filter(d=>d.slowdown).length,2);assert.equal(b.dots.filter(d=>d.motion==='moving-program').length,2);assert.equal(b.spikes.length,1);
 assert.equal(b.movingBusterBombRules,undefined);assert.equal(b.staticSlowdownRules,undefined);
 for(const mutate of[b=>b.dots[0].x++,b=>b.enemies[1].speedClass=1,b=>b.connectors[0].bonus=!b.connectors[0].bonus,b=>b.spikes[0].phase++,b=>b.movingBusterBombRules=true]){const q=movingSlowBoard();mutate(q);const bad=JSON.stringify(q);assert.throws(()=>assertMovingSlowdownBusterBoard(q));assert.equal(JSON.stringify(q),bad);}
 const green=b.enemies.find(a=>a.checksWalls);assert.equal(green.sourceActorType,2);assert.equal(assertMovingSlowdownBusterActor(green),true);assert.throws(()=>assertMovingSlowdownBusterActor({...green,sourceActorType:1,group:500}));
});
test('level adapter builds this composition through its own declarations and leaves the default path closed',()=>{
 const s=movingSlowSource(),o=movingSlowRecipe(),before=JSON.stringify(s);
 assert.deepEqual(levelRequirements(s,o),[]);const b=buildDecodedBoard(s,o);
 assert.equal(JSON.stringify(s),before);assert.equal(assertMovingSlowdownBusterBoard(b),true);
 assert.equal(b.movingDotRules,true);assert.equal(b.staticSlowdownRules,undefined);assert.equal(b.movingBusterBombRules,undefined);
 assert.throws(()=>buildDecodedBoard(s,{...o,allowMovingSlowdownBusters:false}));
 assert.ok(levelRequirements(s,{...o,allowMovingSlowdownBusters:1}).length);
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false};
const frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,3900,200,800].map(g=>[g,frames(g===200?4:g===800?32:64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:Object.fromEntries([[1600,18],[1500,12],[1800,10],[1900,17]].map(([g,n])=>[g,frames(n)]))},bombRoutes:[1,10,11].map(kind=>({kind,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false})),deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const round=()=>new SourceRound(buildDecodedBoard(movingSlowSource(),movingSlowRecipe()),profiles());
test('legal moving-family transfer resolves detached query release to the board dot',()=>{
 const s=movingSlowSource();Object.assign(s.cells[1],{present:true,flagsRaw:0x4001,secondaryRaw:15});
 const g=new SourceRound(buildDecodedBoard(s,movingSlowRecipe()),profiles());
 for(let i=0;i<256&&g.player.pivot==='0,0';i++)g.update(1/120,{flip:true});
 assert.equal(g.player.pivot,'1,0');assert.equal(g.player.transfers,1);assert.equal(g.slowdown.enabled,false);
});
test('joined invented moving Slow round dispatches ordinary class2, green wall checks and free busters',()=>{
 const g=round();for(let i=0;i<300;i++)g.update(1/120,{});
 assert.equal(g.board.movingSlowdownBusterRules,true);assert.equal(g.board.staticSlowdownRules,undefined);assert.equal(g.board.movingBusterBombRules,undefined);
 assert.equal(g.enemies.filter(a=>a.sourceActorType===5).length,2);assert.ok(g.movingDots.get('3,1').snapshot().clockReference>0);assert.equal(g.death,null);
});
test('green wall-checking callbacks bounce while the free red class2 hand keeps its own clock',()=>{
 const g=round(),green=g.enemies.find(a=>a.checksWalls),red=g.enemies.find(a=>a.speedClass===2),p=g.point(green),wall=g.board.walls[0];
 Object.assign(wall,{x:p.x,y:p.y});const solid={left:0,top:0,right:1,bottom:1,rows:[[0,1]],collidable:true,flipY:false};
 for(const f of g.outlines.groups[4400].frames)Object.assign(f,solid);Object.assign(g.outlines.groups[800].frames[wall.frame],solid);
 assert.equal(g.wallCollision(green),wall);const direction=green.direction;
 for(let i=0;i<120&&!g.events.some(e=>e.type==='enemy-wall-bounce'&&e.hand===green.name);i++)g.update(1/120,{});
 assert.ok(g.events.some(e=>e.type==='enemy-wall-bounce'&&e.hand===green.name));assert.notEqual(green.direction,direction);assert.equal(red.speedClass,2);assert.equal(red.checksWalls,false);
});
test('blast and reset retain moving Slow appearance, source programs, EX state and wall visibility',()=>{
 const g=round(),slow=g.board.dots.find(d=>d.slowdown&&d.motion==='moving-program'),program=slow.movingProgram;
 g.bombScene.unbonus(slow,true);assert.equal(slow.burnt,true);assert.equal(dotBodyFrame(slow),189);assert.equal(slow.movingProgram,program);
 g.onHumanGrab(slow);assert.equal(dotBodyFrame(slow),198);assert.equal(g.slowdown.enabled,true);
 g.board.walls[0].visible=false;g.board.connectors[0].burnt=true;g.reset();
 assert.equal(slow.burnt,undefined);assert.equal(slow.movingProgram,program);assert.equal(dotBodyFrame(slow),189);assert.equal(g.board.walls[0].visible,undefined);assert.equal(g.board.connectors[0].burnt,false);assert.equal(g.slowdown.enabled,false);
});
test('only the human toggles Slow mode and an attached moving human follows the same source dot',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown&&d.motion==='moving-program'),npc=g.enemies.find(a=>a.program);
 g.afterActorDotGrab(npc,d);assert.equal(g.slowdown.enabled,false);assert.equal(dotBodyFrame(d),189);
 g.player.pivot=d.id;g.syncMovingActors();g.onHumanGrab(d);const before={...g.point(g.player)};
 for(let i=0;i<120&&g.point(g.player).x===before.x&&g.point(g.player).y===before.y;i++)g.update(1/120,{});
 assert.equal(g.player.movingPivot,true);assert.equal(g.player.pivot,d.id);assert.deepEqual({x:g.point(g.player).x,y:g.point(g.player).y},{x:d.x,y:d.y});assert.notDeepEqual({x:d.x,y:d.y},{x:before.x,y:before.y});assert.equal(g.slowdown.enabled,true);assert.equal(dotBodyFrame(d),198);
});
test('ordinary callbacks test matches while free busters bypass the ordinary contact hook',()=>{
 const g=round(),types=[];g.bombScene.runtime.checkMatch=a=>{if(a.sourceSlot>=2)types.push(a.sourceActorType);return[];};
 for(let i=0;i<250;i++)g.update(1/120,{});assert.deepEqual([...new Set(types)].sort(),[1,2]);
});
test('new bomb actor capability preserves fixed-buster hide and strict 300-tick return',()=>{
 const g=round(),actors=[g.player,...g.enemies];
 assert.throws(()=>bombActors(actors,{guestTick:0,allowObjectInteractions:true,allowFreeBusters:true,allowMovingSlowdownBusters:'true',collides:()=>true,onDeath(){},onHidden(){}}));assert.ok(actors.every(a=>a.visible));
 const hits=bombActors(actors,{guestTick:0,allowObjectInteractions:true,allowFreeBusters:true,allowMovingSlowdownBusters:true,collides:a=>a.sourceActorType===5,onDeath:()=>{throw Error('Unexpected invented human hit');},onHidden:()=>{}});
 assert.deepEqual(hits,[2,6]);assert.ok(g.enemies.filter(a=>a.sourceActorType===5).every(a=>!a.visible&&a.hiddenUntil===300));
 for(let i=0;i<600;i++)g.update(1/120,{});assert.ok(g.enemies.filter(a=>a.sourceActorType===5).every(a=>!a.visible));
 for(let i=0;i<24;i++)g.update(1/120,{});assert.ok(g.enemies.filter(a=>a.sourceActorType===5).every(a=>a.visible));
});
test('bomb construction admits only the idle Slow field added after the strict pre-super declaration check',()=>{
 const b=movingSlowBoard(),d=b.dots.find(d=>d.slowdown);d.sourceSlowFrame=189;
 assert.throws(()=>assertMovingSlowdownBusterBoard(b));assert.equal(assertMovingSlowdownBusterBoard(b,{runtimeConstruction:true}),true);
 for(const change of[{burnt:true},{visible:false},{sourceSlowFrame:198}]){const q=movingSlowBoard();Object.assign(q.dots.find(d=>d.slowdown),change);assert.throws(()=>assertMovingSlowdownBusterBoard(q,{runtimeConstruction:true}));}
 assert.throws(()=>assertMovingSlowdownBusterBoard(movingSlowBoard(),{runtimeConstruction:'true'}));
});
test('moving Slow uses the shared class clock mode without resetting latches or moving-rider state',()=>{
 const g=round();for(let i=0;i<250;i++)g.update(1/120,{});const d=g.board.dots.find(d=>d.slowdown&&d.motion==='moving-program'),before=g.actorClasses.snapshot(),motion=g.movingDots.get(d.id).snapshot();
 g.onHumanGrab(d);const after=g.actorClasses.snapshot();assert.equal(after.classes[0].divisor,2);assert.equal(after.classes[1].divisor,4);assert.equal(after.classes[2].divisor,16);
 for(const[i,c]of after.classes.entries())assert.deepEqual({...c,divisor:before.classes[i].divisor},before.classes[i]);assert.equal(after.upstreamReference,before.upstreamReference);assert.deepEqual(g.movingDots.get(d.id).snapshot(),motion);assert.equal(dotBodyFrame(d),198);
 g.onHumanRelease(d,g.player);assert.equal(dotBodyFrame(d),189);assert.equal(g.slowdown.enabled,true);g.onHumanGrab(g.board.dots.find(d=>d.id==='0,0'));assert.equal(g.slowdown.enabled,false);
});
