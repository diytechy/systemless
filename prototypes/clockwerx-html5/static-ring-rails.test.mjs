import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticRingRailRecipe,assertStaticRingRailSource,buildStaticRingRailBoard,assertStaticRingRailBoard} from './static-ring-rails.mjs';
import {staticRingRailSource,staticRingRailRecipe} from './static-ring-rails.fixture.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';
test('static ring rails require their own explicit and closed recipe',()=>{
 const o=staticRingRailRecipe();assert.equal(assertStaticRingRailRecipe(o),true);
 for(const k of Object.keys(o).filter(k=>k.startsWith('allow')))assert.throws(()=>assertStaticRingRailRecipe({...o,[k]:false}));
 for(const k of['Oil','SlidingOil','Goodies','MovingDots','Bombs','Teleports','StaticSlidingPrograms','MovingSlowdownBusters'])assert.throws(()=>assertStaticRingRailRecipe({...o,['allow'+k]:true}));
 assert.throws(()=>assertStaticRingRailRecipe({...o,allowStaticRingRails:1}));
});
test('static ring rail source retains inactive PU and rejects new active mechanics',()=>{
 assert.equal(assertStaticRingRailSource(staticRingRailSource()),true);
 for(const mutate of[
  s=>s.blocks.find(b=>b.kind==='PU').records[0].rawWords[4]=15,
  s=>s.cells[13].secondaryRaw=31,
  s=>s.cells[13].secondaryRaw=14,
  s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[7]=2,
  s=>s.blocks.find(b=>b.kind==='WA').records[2].programReferenceRaw=0,
  s=>s.blocks.find(b=>b.kind==='EX').records[0].rawWords=[1,1,0],
  s=>s.blocks.push({kind:'BO',count:1,records:[{rawWords:[1,1,1,82]}]}),
 ]){const s=staticRingRailSource();mutate(s);assert.throws(()=>assertStaticRingRailSource(s));}
});
test('static ring rail declarations are detached, frozen and guarded read-only',()=>{
 const s=staticRingRailSource(),before=JSON.stringify(s),b=buildStaticRingRailBoard(s,staticRingRailRecipe());assert.equal(JSON.stringify(s),before);assert.equal(assertStaticRingRailBoard(b),true);
 assert.equal(b.puddles.length,0);assert.equal(b.enemies.length,2);assert.equal(b.dots.filter(d=>d.ring).length,1);assert.equal(b.slidingOilRules,undefined);assert.equal(b.combinedGoalBonusRules,undefined);assert.ok(Object.isFrozen(b.staticRingRailSource.cells));
 for(const mutate of[b=>b.dots[0].x++,b=>b.puddles.push({kind:3}),b=>b.enemies[0].checksWalls=true,b=>b.slidingOilRules=true,b=>b.dots[0].ring=true]){const q=buildStaticRingRailBoard(staticRingRailSource(),staticRingRailRecipe());mutate(q);const bad=JSON.stringify(q);assert.throws(()=>assertStaticRingRailBoard(q));assert.equal(JSON.stringify(q),bad);}
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false};
const frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const round=()=>new SourceRound(buildDecodedBoard(staticRingRailSource(),staticRingRailRecipe()),profiles());
test('level and joined round require this family while keeping inactive oil out',()=>{
 const s=staticRingRailSource(),o=staticRingRailRecipe();assert.deepEqual(levelRequirements(s,o),[]);assert.throws(()=>buildDecodedBoard(s,{...o,allowStaticRingRails:false}));
 assert.ok(levelRequirements(s,{...o,allowStaticRingRails:1}).length);const g=round();for(let i=0;i<256;i++)g.update(1/120,{});
 assert.equal(g.board.staticRingRailRules,true);assert.equal(g.board.puddles.length,0);assert.equal(g.oil,undefined);assert.equal(g.death,null);assert.equal(g.board.slidingOilRules,undefined);
});
test('legal transfers release a ring, disable human regrabs, and reset restores its source appearance',()=>{
 const g=round(),targets=['1,0','1,1','2,1','1,1'];let target=0;
 for(let i=0;i<5000&&target<targets.length;i++){
  if(g.player.pivot===targets[target]){target++;if(target===targets.length)break;}
  const p=g.player,to=g.board.dots.find(d=>d.id===targets[target]),from=g.point(p),dx=to.x-from.x,dy=to.y-from.y,frame=dx>0?0:dx<0?32:dy>0?16:48;
  g.update(1/120,!p.sliding&&p.frame===frame?{flip:true}:{});
 }
 assert.equal(target,targets.length);const ring=g.board.dots.find(d=>d.id==='2,1');assert.equal(ring.humanCanGrab,false);assert.equal(ring.nonhumanCanGrab,true);
 g.reset();assert.equal(ring.humanCanGrab,true);assert.equal(ring.nonhumanCanGrab,true);assert.equal(g.player.pivot,'0,0');assert.equal(g.board.connectors[0].bonus,true);
});
test('ring release orphans other occupants without extending the deadline on repeat releases',()=>{
 const g=round(),ring=g.board.dots.find(d=>d.ring),enemy=g.enemies[0];enemy.pivot=ring.id;
 g.onHumanRelease(ring,g.player);assert.equal(enemy.orphaned,true);const deadline=enemy.orphanDeadline;
 for(let i=0;i<100;i++)g.update(1/120,{});g.onHumanRelease(ring,g.player);assert.equal(enemy.orphanDeadline,deadline);assert.equal(ring.humanCanGrab,false);
});
test('the released ring completes its shared-clock return without changing NPC grab permission',()=>{
 const g=round(),ring=g.board.dots.find(d=>d.ring);g.onHumanRelease(ring,g.player);assert.equal(ring.humanCanGrab,false);
 let updates=0;while(!ring.humanCanGrab&&updates++<2000)g.update(1/120,{});
 assert.ok(updates>600&&updates<2000);assert.equal(ring.humanCanGrab,true);assert.equal(ring.nonhumanCanGrab,true);
});
