import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingSlowdownBusterRecipe,assertMovingSlowdownBusterSource,assertMovingSlowdownBusterBoard,assertMovingSlowdownBusterActor} from './moving-slowdown-busters.mjs';
import {movingSlowSource,movingSlowRecipe,movingSlowBoard} from './moving-slowdown-busters.fixture.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';

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
