import test from 'node:test';import assert from 'node:assert/strict';
import {movingTeleportDoorRecipe,movingTeleportDoorSource} from './moving-teleport-doors.fixture.mjs';
import {assertMovingTeleportDoorRecipe,assertMovingTeleportDoorSource,buildMovingTeleportDoorBoard,assertMovingTeleportDoorBoard} from './moving-teleport-doors.mjs';
import {levelRequirements,buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles=()=>({outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,200,800].map(g=>[g,frames(g===200?4:g===800?32:64)]))},dotOutlines:{groups:{300:frames(207)}},doorOutlines:{groups:Object.fromEntries([[1300,88],[3800,88],[2900,12],[1000,6]].map(([g,n])=>[g,frames(n)]))},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});
const round=()=>new SourceRound(buildDecodedBoard(movingTeleportDoorSource(),movingTeleportDoorRecipe()),profiles());
test('moving HY door recipe is explicit and separate from earlier families',()=>{
 const o=movingTeleportDoorRecipe();assert.equal(assertMovingTeleportDoorRecipe(o),true);for(const k of Object.keys(o).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingTeleportDoorRecipe({...o,[k]:false}));
 for(const k of['MovingProtectedPassage','SlidingTeleports','MovingProtectedBusters','Bombs','FreeBusters','Oil','Elevators'])assert.throws(()=>assertMovingTeleportDoorRecipe({...o,['allow'+k]:true}));
 assert.ok(levelRequirements(movingTeleportDoorSource(),{...o,allowMovingTeleportDoors:1}).length);assert.deepEqual(levelRequirements(movingTeleportDoorSource(),o),[]);
});
test('moving HY source validates independent moving bytes, door, HY pairs and active actors',()=>{
 assert.equal(assertMovingTeleportDoorSource(movingTeleportDoorSource()),true);
 for(const f of[s=>s.cells[14].inlineProgram.rawHex='026e7300',s=>s.blocks.find(b=>b.kind==='HY').records.pop(),s=>s.blocks.find(b=>b.kind==='DR').records[0].rawWords[2]=256,s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[7]=2,s=>s.blocks.push({kind:'BO',count:1,records:[{rawWords:[1,1,1,0]}]})]){const s=movingTeleportDoorSource();f(s);assert.throws(()=>assertMovingTeleportDoorSource(s));}
});
test('moving HY board is detached and its guard never repairs declarations',()=>{
 const s=movingTeleportDoorSource(),before=JSON.stringify(s),b=buildMovingTeleportDoorBoard(s,movingTeleportDoorRecipe());assert.equal(JSON.stringify(s),before);assert.equal(assertMovingTeleportDoorBoard(b),true);assert.ok(Object.isFrozen(b.movingTeleportDoorSource.cells));assert.equal(b.spikes.length,1);assert.equal(b.enemies.length,3);assert.equal(b.slidingTeleportRules,undefined);assert.equal(b.movingProtectedPassageRules,undefined);
 for(const f of[b=>b.dots[0].x++,b=>b.teleports[0].partner='0,0',b=>b.switches[0].x++,b=>b.movingProtectedPassageRules=true,b=>b.enemies[0].program='f']){const b=buildMovingTeleportDoorBoard(movingTeleportDoorSource(),movingTeleportDoorRecipe());f(b);const bad=JSON.stringify(b);assert.throws(()=>assertMovingTeleportDoorBoard(b));assert.equal(JSON.stringify(b),bad);}
});
test('moving HY symbols follow current dots while switch geometry remains fixed',()=>{
 const g=round(),d=g.board.dots.find(d=>d.id==='3,1'),x=d.x,switchState=structuredClone(g.board.switches),frames=g.teleports.snapshot().endpoints.map(e=>e.frame);
 for(let i=0;i<400;i++)g.update(1/120,{});assert.notEqual(d.x,x);assert.deepEqual(g.board.switches,switchState);const e=g.teleports.snapshot().endpoints.find(e=>e.dot===d.id);assert.equal(e.x,d.x-16);assert.equal(e.y,d.y-15);assert.ok(g.enemies.some(e=>e.sourceActorType===3));assert.equal(g.death,null);
 assert.equal(frames.length,4);assert.equal(g.slowdown,undefined);assert.equal(g.bombScene,undefined);
});
test('HY arrival uses current destination without recursively collecting its bonus',()=>{
 const g=round(),a=g.player,entry=g.board.dots.find(d=>d.id==='2,1'),dest=g.board.dots.find(d=>d.id==='4,1');for(let i=0;i<200;i++)g.update(1/120,{});
 a.pivot=entry.id;const frame=a.frame,dir=a.direction;g.afterActorDotGrab(a,entry);assert.equal(a.pivot,dest.id);assert.equal(a.movingPivot,true);assert.equal(a.frame,frame);assert.equal(a.direction,dir);assert.equal(dest.collected,undefined);assert.equal(g.teleports.faders.length,1);assert.equal(g.point(a).x,dest.x);assert.equal(g.point(a).y,dest.y);
 const back=g.board.dots.find(d=>d.id==='3,1');a.pivot=back.id;g.afterActorDotGrab(a,back);assert.equal(a.pivot,'1,1');assert.equal(a.movingPivot,false);
});
test('reset restores moving positions and doors while retaining HY clock phase',()=>{
 const g=round();for(let i=0;i<310;i++)g.update(1/120,{});const before=g.teleports.snapshot(),classes=g.actorClasses.snapshot();g.reset();assert.deepEqual(g.teleports.snapshot().endpoints.map(e=>e.frame),before.endpoints.map(e=>e.frame));assert.deepEqual(g.teleports.snapshot().counts,before.counts);assert.equal(g.teleports.faders.length,0);for(const d of g.board.dots.filter(d=>d.motion==='moving-program'))assert.deepEqual({x:d.x,y:d.y},d.sourceInitialPosition);assert.deepEqual(g.actorClasses.snapshot(),classes);assert.equal(g.doorSystem.snapshot().doors[0].phase,0);
});
test('legal human flip into HY reaches the moving partner once without destination bonus hooks',()=>{
 const s=movingTeleportDoorSource();for(const a of s.blocks.find(b=>b.kind==='WA').records.slice(0,2)){a.gridPosition={row:1,column:0};a.rawWords[0]=1;a.rawWords[1]=0;}
 const g=new SourceRound(buildDecodedBoard(s,movingTeleportDoorRecipe()),profiles());for(let i=0;i<200&&!g.events.some(e=>e.type==='teleport'&&e.hand==='player');i++)g.update(1/120,{flip:true});
 const es=g.events.filter(e=>e.type==='teleport'&&e.hand==='player');assert.equal(es.length,1);assert.equal(g.player.pivot,'3,1');assert.equal(g.player.movingPivot,true);assert.equal(g.death,null);assert.equal(g.player.transfers,1);assert.equal(g.complete,false);
});
test('ordinary program transfer uses the same moving HY arrival path',()=>{
 const s=movingTeleportDoorSource(),a=s.blocks.find(b=>b.kind==='WA').records[2];a.gridPosition={row:1,column:0};a.rawWords[0]=1;a.rawWords[1]=0;a.initialFrameHalfIndexRaw=31;a.rawWords[3]=31;s.blocks.find(b=>b.kind==='WP').records[0].text='f';
 const g=new SourceRound(buildDecodedBoard(s,movingTeleportDoorRecipe()),profiles());for(let i=0;i<170&&!g.events.some(e=>e.type==='teleport'&&e.hand==='enemy-2');i++)g.update(1/120,{});
 const e=g.enemies[0];assert.equal(e.pivot,'3,1');assert.equal(e.movingPivot,true);assert.ok(g.events.some(x=>x.type==='teleport'&&x.hand===e.name));assert.equal(e.sourcePC,1);assert.equal(g.death,null);
});
test('moving HY wall arrival performs the wall reversal before death36',()=>{
 const g=round(),a=g.player,entry=g.board.dots.find(d=>d.id==='3,1'),direction=a.direction,order=[];a.pivot=entry.id;
 g.wallCollision=()=>({id:'invented-contact'});const originalBounce=g.bounceFromWall.bind(g);g.bounceFromWall=(...args)=>{order.push('bounce');return originalBounce(...args);};const originalDeath=g.beginDeath.bind(g);g.beginDeath=cause=>{order.push(cause.sourceReason);return originalDeath(cause);};
 g.afterActorDotGrab(a,entry);assert.deepEqual(order,['bounce',36]);assert.equal(a.direction,-direction);assert.equal(a.pivot,'1,1');assert.ok(g.death);assert.equal(g.events.find(e=>e.type==='death').cause.reason,'teleport-wall');
});
test('no-wait moving program turns immediately at its sixteen-callback boundary',()=>{
 const g=round(),d=g.board.dots.find(d=>d.id==='3,1'),m=g.movingDots.get(d.id),origin={...d.sourceInitialPosition};
 let count=m.snapshot().clockReference;for(let i=0;i<16;i++)m.dispatch(++count,1);assert.deepEqual(m.snapshot().currentPixel,{x:origin.x+48,y:origin.y});
 m.dispatch(++count,1);assert.deepEqual(m.snapshot().currentPixel,{x:origin.x+45,y:origin.y});assert.equal(m.snapshot().opcode,'w');
});
