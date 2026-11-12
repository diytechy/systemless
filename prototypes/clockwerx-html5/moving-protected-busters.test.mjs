import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingProtectedBusterRecipe,assertMovingProtectedBusterSource,buildMovingProtectedBusterBoard,assertMovingProtectedBusterBoard} from './moving-protected-busters.mjs';
import {movingProtectedBusterSource,movingProtectedBusterRecipe} from './moving-protected-busters.fixture.mjs';
test('moving protection and busters require their own explicit closed recipe',()=>{
 const o=movingProtectedBusterRecipe();assert.equal(assertMovingProtectedBusterRecipe(o),true);
 for(const k of Object.keys(o).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingProtectedBusterRecipe({...o,[k]:false}));
 for(const k of['MovingSlowdownBusters','MovingBusterBombs','MovingProtectedPassage','SlidingConnectors','Oil','Goodies','Elevators','MarkedTransfers'])assert.throws(()=>assertMovingProtectedBusterRecipe({...o,['allow'+k]:true}));
 assert.throws(()=>assertMovingProtectedBusterRecipe({...o,allowMovingProtectedBusters:'true'}));
});
test('moving protection source validates typed cells, raw actors, fixed packs and human-only match',()=>{
 assert.equal(assertMovingProtectedBusterSource(movingProtectedBusterSource()),true);
 for(const mutate of[
  s=>s.cells[15].secondaryRaw=31,
  s=>s.cells[15].inlineProgram.rawHex='026e7301',
  s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[2]=5,
  s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[7]=2,
  s=>s.blocks.find(b=>b.kind==='WA').records[4].programReferenceRaw=0,
  s=>s.blocks.find(b=>b.kind==='WA').records[5].rawWords[4]=65535,
  s=>s.blocks.find(b=>b.kind==='BO').records[0].rawWords[3]=0x40f8,
  s=>s.blocks.push({kind:'EX',count:1,records:[{rawWords:[1,1,0]}]}),
 ]){const s=movingProtectedBusterSource();mutate(s);assert.throws(()=>assertMovingProtectedBusterSource(s));}
});
test('moving protected declarations are detached, frozen and guarded without repairing live fields',()=>{
 const s=movingProtectedBusterSource(),before=JSON.stringify(s),b=buildMovingProtectedBusterBoard(s,movingProtectedBusterRecipe());assert.equal(JSON.stringify(s),before);assert.equal(assertMovingProtectedBusterBoard(b),true);assert.ok(Object.isFrozen(b.movingProtectedBusterSource.cells));
 assert.equal(b.dots.filter(d=>d.protected).length,3);assert.equal(b.dots.filter(d=>d.motion==='moving-program').length,3);assert.equal(b.connectors.length,0);assert.equal(b.movingSlowdownBusterRules,undefined);assert.equal(b.movingBusterBombRules,undefined);
 for(const mutate of[b=>b.dots[0].x++,b=>b.enemies[0].program='f',b=>b.bombs[0].rawWords[3]=0x40f8,b=>b.slidingConnectorRules=true,b=>b.dots[0].protected=true]){const q=buildMovingProtectedBusterBoard(movingProtectedBusterSource(),movingProtectedBusterRecipe());mutate(q);const bad=JSON.stringify(q);assert.throws(()=>assertMovingProtectedBusterBoard(q));assert.equal(JSON.stringify(q),bad);}
});
