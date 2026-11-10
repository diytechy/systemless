// Invented DTOs, silhouettes and fuse paths only.
// These branch arrangements do not establish original-map or native fidelity.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,options} from './static-sliding-bomb-goodies.fixture.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
import {startSliding,animateSliding} from './sliding.mjs';
import {assertStaticSlidingBombGoodieScope} from './static-sliding-bomb-goodies.mjs';

const limits={constructors:5,explicitResets:6,updates:24,primitiveCalls:128};
const used={constructors:0,explicitResets:0,updates:0,primitiveCalls:0};
const primitive=fn=>{assert.ok(++used.primitiveCalls<=limits.primitiveCalls);return fn();};
const frame=()=>({left:0,top:0,right:1,bottom:1,flipY:false,outlineIndex:0,rows:[[0,0]]});
const groups=(pairs)=>({groups:Object.fromEntries(pairs.map(([g,n])=>[g,{frames:Array.from({length:n},frame)}]))});
const outlines=groups([[700,64],[4300,64],[500,64],[4400,64],[4500,64],[800,24]]);
const dotOutlines=groups([[300,207]]);
const bombOutlines=groups([[1400,15],[1500,12],[1600,18],[1800,10],[1900,17]]);
const routes=[10,1].map(kind=>({kind,points:[[0,0],[1,2]],entryLeg:4,forwardExit:4,reverseExit:1,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false}));
const clone=x=>structuredClone(x);
function round(){assert.ok(++used.constructors<=limits.constructors);return new SourceRound(buildDecodedBoard(fixture(),options),{outlines,dotOutlines,bombOutlines,bombRoutes:routes,deathFactory:()=>({update(){},snapshot(){return [];}})});}
function reset(g,opts){assert.ok(++used.explicitResets<=limits.explicitResets);g.reset(opts);}
function clockGraph(g){
 const objects={actor:g.actorClock,classes:g.actorClasses,spike:g.spikeClock,death:g.deathClock,door:g.doorClock,dot:g.dotClock,protection:g.protectionClock,...g.bombScene.clocks,flourish:g.bombScene.flourishClock,score:g.bombScene.scoreClock};
 return {objects,values:Object.fromEntries(Object.entries(objects).map(([k,v])=>[k,k==='classes'?v.snapshot():k==='death'?v.snapshot():v.advance(0)])),guestTicks:g.guestTicks,remainder:g.guestTickRemainder};
}
function unchangedClocks(g,before){const after=clockGraph(g);for(const[k,v]of Object.entries(before.objects))assert.equal(after.objects[k],v,k+' clock identity');assert.deepEqual(after.values,before.values);assert.equal(after.guestTicks,before.guestTicks);assert.equal(after.remainder,before.remainder);}
const actorState=a=>{const{frameReference,...rest}=a;return clone(rest);};
function declarations(g){return {actors:[g.player,...g.enemies].map(actorState),dots:g.board.dots.map(d=>({id:d.id,cell:d.cell,bonus:d.bonus,kind:d.kind,sourceInitialBonus:d.sourceInitialBonus,sourceHasSprite:d.sourceHasSprite})),connectors:clone(g.board.connectors),walls:clone(g.board.walls),armed:clone(g.bombScene.runtime.snapshot().armed)};}
function restored(g,authored){
 assert.deepEqual([g.player,...g.enemies].map(actorState),authored.actors);
 for(const a of[g.player,...g.enemies])assert.equal(a.frameReference,g.actorClasses.snapshot().classes[a.speedClass].count);
 assert.deepEqual(g.board.dots.map(d=>({id:d.id,cell:d.cell,bonus:d.bonus,kind:d.kind,sourceInitialBonus:d.sourceInitialBonus,sourceHasSprite:d.sourceHasSprite})),authored.dots);
 assert.ok(g.board.dots.every(d=>!d.burnt&&!d.collected));assert.deepEqual(g.board.connectors,authored.connectors);assert.deepEqual(g.board.walls,authored.walls);
 const bomb=g.bombScene.runtime.snapshot();assert.deepEqual(bomb.armed,authored.armed);assert.ok(bomb.matches.every(s=>s.visible));assert.ok(bomb.goodies.every(s=>s.visible&&!s.collected));assert.ok(bomb.sparks.every(s=>!s.visible&&!s.clockAttached));assert.ok(bomb.explosions.every(s=>!s.visible));
 assert.equal(g.bombScene.effects.length,0);assert.equal(g.bombScene.craters.length,0);assert.equal(g.bombScene.backgroundPaints.length,0);
 assert.equal(g.death,null);assert.equal(g.complete,false);assert.equal(g.pendingReverse,false);assert.equal(g.childScore.snapshot().roundBonus,0);assert.equal(g.remainingTime,g.board.timeLimit);
 assert.equal(assertStaticSlidingBombGoodieScope(g.board,{actors:[g.player,...g.enemies]}),true);
}

test('joined reset during real EX progression restores authored state and persistent clocks',()=>{
 const g=round(),authored=declarations(g),h=g.player,d=g.board.dots.find(d=>d.id===h.pivot);
 // A legal EX entry pose is an explicit invented branch arrangement.
 Object.assign(h,{frame:48,unwrappedFrame:48,angle:48*Math.PI*2/64});
 assert.equal(primitive(()=>startSliding(h,d)),true);for(let i=0;i<4;i++)primitive(()=>animateSliding(h));assert.equal(h.slideProgress,4);
 const clocks=clockGraph(g);reset(g);unchangedClocks(g,clocks);restored(g,authored);
});

test('joined reset after human fuse activation clears spark latch and rearms original match',()=>{
 const g=round(),authored=declarations(g),rt=g.bombScene.runtime;
 assert.deepEqual(primitive(()=>rt.ignite(0,g.enemies[1])),[]);assert.ok(rt.matches[0].visible);
 primitive(()=>rt.ignite(0,g.player));assert.equal(rt.armed[0],false);assert.ok(rt.sparks.some(s=>s.visible&&s.clockAttached));
 const clocks=clockGraph(g);reset(g);unchangedClocks(g,clocks);restored(g,authored);
});

test('joined reset after blast dispatch restores EX bonus identity, walls and effect pools',()=>{
 const g=round(),authored=declarations(g),scene=g.bombScene,rt=scene.runtime;
 primitive(()=>rt.activateExplosion(1));const initial=scene.clocks.explosion.advance(0).clientCount;
 for(let n=1;n<=4;n++)primitive(()=>rt.observeExplosion(0,initial+n));
 const wall=g.board.walls[0];primitive(()=>scene.effect({type:'stationary',target:'WL',grid:{row:wall.row,column:wall.column}}));
 primitive(()=>scene.effect({type:'stationary',target:'DO',grid:{row:2,column:2}}));
 assert.ok(g.board.walls.some(w=>w.visible===false));assert.ok(g.board.dots.some(d=>d.burnt));assert.ok(g.board.connectors.some(e=>e.burnt));assert.ok(scene.backgroundPaints.length);
 const clocks=clockGraph(g);reset(g);unchangedClocks(g,clocks);restored(g,authored);
});

test('joined reset after GO hide restores visibility while keeping GO clock/frame/reference',()=>{
 const g=round(),authored=declarations(g),rt=g.bombScene.runtime;
 const events=primitive(()=>rt.collectGoodie(0,g.player)),finish=events.find(e=>e.type==='flourish').finish;
 primitive(()=>finish());assert.equal(rt.goodies[0].visible,false);assert.equal(rt.goodies[0].collected,true);
 primitive(()=>g.bombScene.advanceClocks(200));primitive(()=>rt.observeGoodie(0));const phase={frame:rt.goodies[0].frame,count:rt.goodies[0].count},clocks=clockGraph(g);
 reset(g);unchangedClocks(g,clocks);restored(g,authored);assert.deepEqual({frame:rt.goodies[0].frame,count:rt.goodies[0].count},phase);
 primitive(()=>finish());assert.equal(rt.goodies[0].visible,true,'stale pre-reset flourish cannot hide restored GO');
});

test('joined WY reset preserves earned checkpoint then level restart restores original spawn',()=>{
 const g=round(),authored=declarations(g);
 for(let i=0;i<24;i++){assert.ok(++used.updates<=limits.updates);g.update(1/120,{});}
 primitive(()=>g.bombScene.runtime.collectGoodie(0,g.player));assert.equal(g.remainingTime,130);
 const cp=g.board.dots.find(d=>d.waystation);primitive(()=>g.onHumanGrab(cp));assert.equal(g.dotAnimations.savedSpawn.pivot,cp.id);assert.equal(g.dotAnimations.savedTime,130);
 const clocks=clockGraph(g);reset(g,{preserveCheckpoint:true});unchangedClocks(g,clocks);assert.equal(g.player.pivot,cp.id);assert.equal(g.remainingTime,130);assert.equal(g.dotAnimations.selectedCheckpoint,cp.id);
 reset(g);unchangedClocks(g,clocks);restored(g,authored);assert.equal(g.dotAnimations.savedSpawn.pivot,g.board.player.pivot);assert.equal(g.dotAnimations.savedTime,g.board.timeLimit);
});
