import test from 'node:test';import assert from 'node:assert/strict';
import {staticGunRailRecipe,staticGunRailSource} from './static-gun-rails.fixture.mjs';
import {assertStaticGunRailRecipe,assertStaticGunRailSource,assertStaticGunRailActor,assertStaticGunRailBoard} from './static-gun-rails.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';import {actorInitialFrame} from './hazards.mjs';
const empty={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},solid={left:0,top:0,right:1,bottom:1,rows:[[0,1]],collidable:true,flipY:false},frames=(n,s)=>({frames:Array.from({length:n},()=>({...s}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,200].map(g=>[g,frames(g===200?4:64,empty)]))},dotOutlines:{groups:{300:frames(207,empty)}},gunOutlines:{groups:{3300:frames(6,solid),4200:frames(3,solid)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const board=(s=staticGunRailSource())=>buildDecodedBoard(s,staticGunRailRecipe()),round=(s)=>new SourceRound(board(s),profiles());
test('static gun rails has its own literal recipe and excludes borrowed compositions',()=>{
 assert.deepEqual(levelRequirements(staticGunRailSource(),staticGunRailRecipe()),[]);assert.ok(levelRequirements(staticGunRailSource()).length);
 for(const k of Object.keys(staticGunRailRecipe()).filter(k=>k.startsWith('allow')))assert.throws(()=>assertStaticGunRailRecipe({...staticGunRailRecipe(),[k]:false}));
 for(const k of['GunTriggerSliding','GunSlidingBusters','Elevators','MovingDots','Bombs','RotatingSpikes'])assert.throws(()=>assertStaticGunRailRecipe({...staticGunRailRecipe(),['allow'+k]:true}));
});
test('static source preserves inactive orbitals/guns, raw PCs and wrapped gray half-indices',()=>{
 const b=board();assert.equal(b.inactiveActorCount,1);assert.equal(b.gunTriggerChild.guns.length,1);assert.equal(b.gunTriggerChild.guns[0].sourceIndex,0);assert.equal(b.staticGunRailSource.blocks.find(b=>b.kind==='GN').records.length,2);assert.equal(b.enemies[0].sourceRawPC,1);assert.equal(b.staticGunRailSource.blocks[0].records[1].initialFrameHalfIndexRaw,40);assert.equal(actorInitialFrame(40),16);assert.ok(Object.isFrozen(b.staticGunRailSource.cells));
});
test('source guard rejects active orbitals, extra families and unqualified gun/rail declarations',()=>{
 for(const mutate of[s=>s.blocks[0].records[4].activationMaskRaw=15,s=>s.blocks.find(b=>b.kind==='GN').records[0].rawWords[4]=8,s=>s.blocks.find(b=>b.kind==='EX').records[0].rawWords[2]=1,s=>s.blocks.push({kind:'EL',count:1,records:[{}]}),s=>s.cells[1].flagsRaw|=8]){const s=staticGunRailSource();mutate(s);assert.throws(()=>assertStaticGunRailSource(s));}
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:1,checksWalls:false,program:'bfns',sourcePC:1};assert.equal(assertStaticGunRailActor(a),true);for(const m of[{speedClass:3},{checksWalls:true},{sourcePC:0},{program:'x'},{sourceActorType:4}])assert.throws(()=>assertStaticGunRailActor({...a,...m}));
});
test('frozen declarations and projectile collision profiles are checked before construction',()=>{
 assert.equal(assertStaticGunRailBoard(board(),profiles()),true);for(const mutate of[b=>b.gunTriggerChild.rawBounds.right++,b=>b.connectors[0].second='0,0',b=>b.enemies[0].program='f',b=>b.gunTriggerSlidingRules=true]){const b=board();mutate(b);assert.throws(()=>assertStaticGunRailBoard(b));}
 const p=profiles();p.gunOutlines.groups[4200].frames[2].collidable=false;assert.throws(()=>new SourceRound(board(),p));assert.throws(()=>new SourceRound(board(),{...profiles(),gunOutlines:undefined}));
});
test('human enters EX through normal controls and reaches its first automatic arrival',()=>{
 const g=round();let reached=false;for(let n=0;n<1000;n++){g.update(1/120,g.player.pivot==='0,0'?{flip:true}:{});if(g.player.pivot==='2,0'&&!g.player.sliding){reached=true;break;}}
 assert.equal(reached,true);assert.equal(g.player.transfers,1);assert.equal(g.death,null);
});
test('ordinary f commands can enter EX and continue the next sliding callback',()=>{
 const s=staticGunRailSource();s.blocks.find(b=>b.kind==='WP').records[0].text='f';const g=round(s),a={...g.enemies[0],pivot:'1,0',frame:1,unwrappedFrame:1,direction:-1},noop=()=>{},o={program:'f',dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowSliding:true,allowStaticGunRails:true,staticGunRailScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 const first=advanceStaticEnemyCallback(a,1,o);assert.equal(first.state.pivot,'2,0');assert.equal(first.state.sliding,true);assert.doesNotThrow(()=>advanceStaticEnemyCallback(first.state,1,o));for(const m of[{dots:[...o.dots]},{sourceQuery:async()=>({allowed:false})},{program:null},{allowMovingDots:true},{allowStaticGunRails:1}])assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,...m}));
});
test('trigger contact launches a translated color2 projectile and source bounds dispose it',()=>{
 const g=round();g.gunTriggers.contact(g.player,()=>true);assert.equal(g.gunTriggers.insertionOrder.length,1);const p=g.gunTriggers.insertionOrder[0];assert.equal(p.frame,2);assert.deepEqual(p.rawBase,{x:462,y:345});assert.deepEqual(g.gunTriggers.pointFor(p.rawBase),{x:490,y:373});for(let n=1;n<=50;n++)g.gunTriggers.advance(n);assert.equal(g.gunTriggers.insertionOrder.length,0);
});
test('reset restores the bonus network, projectile pool and trigger occupancy',()=>{
 const g=round(),initial=g.board.dots.map(d=>[d.id,d.cell,d.bonus,d.kind]);g.onBonus(g.board.dots.find(d=>d.id==='1,0'));assert.ok(g.board.connectors.every(e=>!e.bonus));g.gunTriggers.contact(g.player,()=>true);assert.equal(g.gunTriggers.triggers[0].occupancy,1);g.reset();assert.deepEqual(g.board.dots.map(d=>[d.id,d.cell,d.bonus,d.kind]),initial);assert.ok(g.board.connectors.every(e=>e.bonus));assert.equal(g.gunTriggers.insertionOrder.length,0);assert.equal(g.gunTriggers.triggers[0].occupancy,0);
});
test('projectile death is latched before the dispatched human EX callback finishes',()=>{
 let atDeath;const p=profiles();p.outlines.groups[700]=frames(64,solid);p.gunOutlines.groups[4200]=frames(3,{...solid,right:7,rows:[[0,7]]});p.deathFactory=(point,hand)=>{atDeath={pivot:hand.pivot,transfers:hand.transfers};return{complete:false,update(){},snapshot(){return[];}};};const g=new SourceRound(board(),p);g.gunTriggers.contact(g.player,()=>true);const shot=g.gunTriggers.insertionOrder[0],point=g.point(g.player);shot.rawBase={x:point.x-31,y:point.y-28};for(let n=0;n<30&&!g.death;n++)g.update(1/120,{flip:true});assert.ok(g.death);assert.deepEqual(atDeath,{pivot:'0,0',transfers:0});assert.equal(g.player.transfers,1);assert.equal(g.events.find(e=>e.type==='death').cause.reason,'projectile');assert.ok(g.events.findIndex(e=>e.type==='death')<g.events.findIndex(e=>e.type==='flip'));
});
