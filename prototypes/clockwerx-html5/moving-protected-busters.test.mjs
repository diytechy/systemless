import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingProtectedBusterRecipe,assertMovingProtectedBusterSource,buildMovingProtectedBusterBoard,assertMovingProtectedBusterBoard} from './moving-protected-busters.mjs';
import {movingProtectedBusterSource,movingProtectedBusterRecipe} from './moving-protected-busters.fixture.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';
import {dotBodyFrame} from './dots.mjs';
import {bombActors} from './bomb-runtime.mjs';
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
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false};
const frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,3900,200,800].map(g=>[g,frames(g===200?4:g===800?32:64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:Object.fromEntries([[1600,18],[1500,12],[1800,10],[1900,17]].map(([g,n])=>[g,frames(n)]))},bombRoutes:[1,10].map(kind=>({kind,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false})),deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const round=()=>new SourceRound(buildDecodedBoard(movingProtectedBusterSource(),movingProtectedBusterRecipe()),profiles());
test('joined moving protection dispatches its own actors and keeps earlier family flags off',()=>{
 const s=movingProtectedBusterSource(),o=movingProtectedBusterRecipe();assert.deepEqual(levelRequirements(s,o),[]);assert.throws(()=>buildDecodedBoard(s,{...o,allowMovingProtectedBusters:false}));assert.ok(levelRequirements(s,{...o,allowMovingProtectedBusters:1}).length);
 const g=round();for(let i=0;i<250;i++)g.update(1/120,{});assert.equal(g.death,null);assert.equal(g.movingDots.size,3);assert.equal(g.enemies.length,4);assert.equal(g.slowdown,undefined);assert.equal(g.board.slidingConnectorRules,undefined);assert.equal(g.board.movingProtectedPassageRules,undefined);assert.equal(g.board.movingSlowdownBusterRules,undefined);
 assert.equal(g.bombScene.runtime.bombs[1].flags,64);assert.equal(g.bombScene.runtime.bombs[1].padding,248);
});
test('burning a protected bonus preserves protection and overlay phase while reset restores the source',()=>{
 const g=round(),d=g.board.dots.find(d=>d.protected&&d.bonus);for(let i=0;i<50;i++)g.update(1/120,{});const overlay=g.dotAnimations.renderState(d.id).overlay;
 g.bombScene.unbonus(d,true);assert.equal(d.protected,true);assert.equal(d.burnt,true);assert.equal(d.bonus,false);assert.equal(dotBodyFrame(d),92+d.color);assert.deepEqual(g.dotAnimations.renderState(d.id).overlay,overlay);
 g.bombScene.effect({type:'stationary',target:'WL',grid:{row:3,column:2}});assert.equal(g.board.walls[0].visible,false);assert.ok(g.bombScene.backgroundPaints.some(p=>p.kind==='WL'));
 g.reset();assert.equal(d.protected,true);assert.equal(d.burnt,undefined);assert.equal(d.bonus,true);assert.equal(g.board.walls[0].visible,undefined);assert.deepEqual(g.dotAnimations.renderState(d.id).overlay,overlay);
});
test('moving protected riders keep program and protection through a burn and release',()=>{
 const g=round(),d=g.board.dots.find(d=>d.protected&&d.motion==='moving-program'),program=d.movingProgram;g.player.pivot=d.id;g.syncMovingActors();g.onHumanGrab(d);const before={...g.point(g.player)},clocks=g.actorClasses.snapshot();
 for(let i=0;i<120&&g.point(g.player).y===before.y;i++)g.update(1/120,{});
 assert.equal(g.player.movingPivot,true);assert.equal(g.point(g.player).protected,true);assert.notEqual(g.point(g.player).y,before.y);assert.equal(g.actorClasses.snapshot().classes[0].divisor,clocks.classes[0].divisor);
 g.bombScene.unbonus(d,true);assert.equal(d.movingProgram,program);assert.equal(d.protected,true);assert.equal(d.burnt,true);assert.doesNotThrow(()=>g.onHumanRelease({...d},g.player));g.reset();assert.equal(d.burnt,undefined);assert.equal(d.movingProgram,program);assert.equal(d.protected,true);
});
test('ordinary hand immunity preserves free-buster contact and projectile launch',()=>{
 const g=round(),d=g.board.dots.find(d=>d.protected),red=g.enemies.find(a=>a.sourceActorType===1),buster=g.enemies.find(a=>a.sourceActorType===5);g.player.pivot=d.id;g.player.frame=0;g.player.unwrappedFrame=0;
 for(const a of g.enemies)a.visible=false;Object.assign(red,{visible:true,pivot:d.id,frame:0,unwrappedFrame:0});const solid={left:0,top:0,right:3,bottom:3,rows:null,collidable:true,flipY:false};g.collider=a=>a.visible===false?null:solid;
 assert.equal(g.enemyCollision(),null);d.protected=false;assert.equal(g.enemyCollision().reason,'enemy');d.protected=true;red.visible=false;Object.assign(buster,{visible:true,pivot:d.id,frame:0,unwrappedFrame:0});assert.equal(g.enemyCollision(),null);assert.equal(buster.visible,false);assert.ok(g.events.some(e=>e.type==='projectile-launch'));
});
test('blast actor scan ignores dot protection, retains slot order and requires the literal family',()=>{
 const g=round(),d=g.board.dots.find(d=>d.protected);g.player.pivot=d.id;const actors=[g.player,...g.enemies],common={guestTick:0,allowObjectInteractions:true,allowFreeBusters:true,collides:a=>a===g.player,onHidden(){},onDeath(){}};
 assert.throws(()=>bombActors(actors,{...common,allowMovingProtectedBusters:'true'}));let deaths=0;const hits=bombActors(actors,{...common,allowMovingProtectedBusters:true,onDeath:()=>deaths++});assert.deepEqual(hits,[0]);assert.equal(deaths,1);assert.equal(g.player.visible,false);assert.equal(d.protected,true);
});
test('human-only match is unchanged for a programmed ordinary actor in the protected family',()=>{
 const g=round(),r=g.bombScene.runtime,enemy=g.enemies.find(a=>a.program);assert.deepEqual(r.ignite(0,enemy),[]);assert.equal(r.armed[0],true);assert.ok(r.ignite(0,g.player).some(e=>e.type==='spark-activated'));assert.equal(r.armed[0],false);
});
test('travelling spark collision remains lethal on a protected pivot',()=>{
 const g=round(),d=g.board.dots.find(d=>d.protected),r=g.bombScene.runtime;g.player.pivot=d.id;r.ignite(0,g.player);r.adapters.collides=kind=>kind==='SR';r.sparks[0].travelling=true;
 assert.equal(r.checkSpark(g.player)[0].reason,15);assert.ok(g.death);assert.equal(d.protected,true);assert.equal(r.sparks[0].visible,true);
});
test('legal moving-family transfers enter and release protected dots without detached-record mutations',()=>{
 const s=movingProtectedBusterSource();for(const column of[1,2,3])Object.assign(s.cells[column],{flagsRaw:1,secondaryRaw:15,present:true});
 const d=s.cells[15];Object.assign(d,{inlineProgram:{text:'p',offset:d.offset+4,rawHex:'0170',paddingHex:''},byteLength:6,rawHex:'40c1000f0170'});
 const g=new SourceRound(buildDecodedBoard(s,movingProtectedBusterRecipe()),profiles()),targets=['1,0','2,0','3,0','3,1','4,1','3,1'];let target=0;
 for(let i=0;i<6000&&target<targets.length;i++){
  if(g.player.pivot===targets[target]){target++;if(target===targets.length)break;}
  const p=g.player,from=g.point(p),to=g.board.dots.find(d=>d.id===targets[target]),dx=to.x-from.x,dy=to.y-from.y,frame=dx>0?0:dx<0?32:dy>0?16:48;
  g.update(1/120,p.frame===frame?{flip:true}:{});
 }
 assert.equal(target,targets.length);assert.equal(g.player.transfers,6);assert.equal(g.death,null);assert.equal(g.point(g.player).protected,true);assert.ok(g.events.some(e=>e.type==='flip'&&e.dot==='4,1'&&e.realDot===true));
});
test('ordinary callbacks test matches while free busters retain their separate callback',()=>{
 const g=round(),types=[];g.bombScene.runtime.checkMatch=a=>{if(a.sourceSlot>=2)types.push(a.sourceActorType);return[];};for(let i=0;i<250;i++)g.update(1/120,{});assert.deepEqual([...new Set(types)].sort(),[1,2]);
});
test('reset preserves shared class latches and protection phase while restarting moving declarations',()=>{
 const g=round();for(let i=0;i<150;i++)g.update(1/120,{});const classes=g.actorClasses.snapshot(),d=g.board.dots.find(d=>d.protected&&d.motion==='moving-program'),overlay=g.dotAnimations.renderState(d.id).overlay;
 g.reset();assert.deepEqual(g.actorClasses.snapshot(),classes);assert.deepEqual(g.dotAnimations.renderState(d.id).overlay,overlay);assert.deepEqual(g.movingDots.get(d.id).snapshot().currentPixel,d.sourceInitialPosition);
});
