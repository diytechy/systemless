import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticRingRailRecipe,assertStaticRingRailSource,buildStaticRingRailBoard,assertStaticRingRailBoard} from './static-ring-rails.mjs';
import {staticRingRailSource,staticRingRailRecipe} from './static-ring-rails.fixture.mjs';
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
