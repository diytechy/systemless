import test from 'node:test';
import assert from 'node:assert/strict';
import {BombRuntime,BOMB_CLOCKS,assertBombRuntimeScope,applyBombDotHit,bombStationaryDots,bombActors} from './bomb-runtime.mjs';

// Invented two-point paths and tiny boards; no owned map or source samples.
const routes=()=>[10,4,0].map(kind=>({kind,points:[[0,0],[1,2]],entryLeg:4,forwardExit:4,reverseExit:1,bomb:kind===0,flipVertical:false,flipHorizontal:false,swap:false}));
const bombs=()=>[{row:1,column:1,kind:10,flags:0},{row:1,column:2,kind:4},{row:1,column:3,kind:0}];
const hero=()=>({sourceSlot:0,sourceActorType:0,visible:true});
const enemy=slot=>({sourceSlot:slot,sourceActorType:1,visible:true});
const dot=(id,row,column,extra={})=>({id,row,column,color:2,ring:false,bonus:false,burnt:false,humanCanGrab:true,nonhumanCanGrab:true,sourceInBackground:true,...extra});
function fixture(config={},overrides={}){
 const clocks={match:10,spark:20,explosion:30,goodie:40},time={latched:100,fresh:100},seen=[];
 const adapters={clock:k=>clocks[k],latchedTick:()=>time.latched,freshTick:()=>time.fresh,adjustPeriod:n=>n*2,
  gridPixel:(g,o)=>({x:g.column*48+o.x,y:g.row*48+o.y}),effect:e=>seen.push(e),collides:()=>true,...overrides};
 const runtime=new BombRuntime({bombs:bombs(),routes:routes(),...config},adapters);
 return {runtime,clocks,time,seen,adapters};
}
function startTravel(f,index=0){
 f.time.fresh=221;
 for(let i=0;i<5;i++)f.runtime.observeSpark(index,++f.clocks.spark);
 assert.equal(f.runtime.snapshot().sparks[index].travelling,true);
}

test('bounded construction rejects unsupported modes, masks, chains and records',()=>{
 assert.throws(()=>fixture({mode:'Expert'}),/Child/);
 assert.throws(()=>fixture({unsupported:['moving dots']}),/Child/);
 assert.throws(()=>fixture({bombs:[{row:1,column:1,kind:10}]}),/Unterminated/);
 assert.throws(()=>fixture({routes:[]}),/Missing/);
 assert.throws(()=>fixture({bombs:[{row:7,column:10,kind:0}]}),/integer/);
 assert.throws(()=>fixture({bombs:[{row:1,column:1,kind:0,flags:256}]}),/integer/);
 assert.throws(()=>fixture({goodies:[{row:0,column:0,activationMask:14}]}),/Filter/);
 assert.throws(()=>fixture({goodies:Array.from({length:16},()=>({row:0,column:0}))}),/capacity/);
 assert.throws(()=>fixture({bombs:[...Array.from({length:6},()=>({row:1,column:1,kind:10})),{row:1,column:2,kind:0}]}),/LI capacity/);
 assert.deepEqual(BOMB_CLOCKS,{match:{period:100,scaled:false},spark:{period:62,scaled:true},explosion:{period:150,scaled:false},goodie:{period:200,scaled:false}});
});
test('source mutation adapters cannot defer collision or effect dispatch',()=>{
 assert.throws(()=>fixture({}, {effect:async()=>{}}),/Synchronous/);
 const f=fixture({goodies:[{row:0,column:0}]},{collides:()=>Promise.resolve(false)});
 assert.throws(()=>f.runtime.checkGoodie(hero()),/Promise/);
 assert.throws(()=>applyBombDotHit(dot('d',0,0),async()=>{}),/Synchronous/);
});
test('mode-filtered board scope rejects future actors and active combinations',()=>{
 assert.equal(assertBombRuntimeScope({dots:[dot('d',1,1)],actors:[hero(),enemy(2)],activeSections:{SP:2,WL:3,PU:0,BO:8,GO:2}}),true);
 for(const kind of ['PU','DR','DS','EL','GN','TR','HY','EX'])assert.throws(()=>fixture({scope:{activeSections:{[kind]:1}}}),/Unqualified/);
 assert.throws(()=>fixture({scope:{actors:[{sourceSlot:2,sourceActorType:5}]}}),/ordinary/);
 assert.throws(()=>fixture({scope:{dots:[dot('d',1,1,{movingProgram:'n'})]}}),/Unsupported/);
});
test('ignition dispatch is synchronous and source armed latch follows spark, LI hide and sound',()=>{
 const f=fixture();const observations=[];
 f.adapters.effect=e=>{observations.push([e.type,f.runtime.snapshot().armed[0]]);};
 assert.deepEqual(f.runtime.ignite(0,enemy(2)),[]);
 const events=f.runtime.ignite(0,hero());
 assert.deepEqual(events.map(e=>e.type),['append-sprite','spark-activated','hide','sound']);
 assert.ok(observations.every(([,armed])=>armed));assert.equal(f.runtime.snapshot().armed[0],false);
 assert.deepEqual(f.runtime.ignite(0,hero()),[]);
 const flagged=fixture({bombs:[{row:1,column:1,kind:10,flags:1},{row:1,column:2,kind:0}]});
 assert.equal(flagged.runtime.ignite(0,enemy(2)).at(-1).id,11);
 assert.throws(()=>flagged.runtime.checkMatch({sourceSlot:2,sourceActorType:5}),/ordinary/);
});
test('waiting uses fresh strict tick, then ignition reaches 8 before any travelling step',()=>{
 const f=fixture();f.runtime.ignite(0,hero());
 assert.deepEqual(f.runtime.observeSpark(0,20),[]);
 f.time.fresh=220;f.runtime.observeSpark(0,200);let s=f.runtime.snapshot().sparks[0];
 assert.equal(s.frame,1);assert.equal(s.igniting,false);assert.equal(s.pathIndex,0);
 f.time.fresh=221;f.runtime.observeSpark(0,201);assert.equal(f.runtime.snapshot().sparks[0].frame,4);
 for(let n=202;n<=205;n++)f.runtime.observeSpark(0,n);
 s=f.runtime.snapshot().sparks[0];assert.equal(s.frame,8);assert.equal(s.travelling,true);assert.equal(s.pathIndex,0);
 f.runtime.observeSpark(0,999);assert.equal(f.runtime.snapshot().sparks[0].pathIndex,1); // One, not 794 steps.
});
test('serialized successor uses exit token and can reverse its own path',()=>{
 const r=routes();r[0].forwardExit=2;r[1].entryLeg=4;
 const f=fixture({routes:r});f.runtime.ignite(0,hero());startTravel(f);
 f.runtime.observeSpark(0,++f.clocks.spark);f.runtime.observeSpark(0,++f.clocks.spark);
 let s=f.runtime.snapshot().sparks[0];assert.equal(s.bombIndex,1);assert.equal(s.pathStep,-1);assert.equal(s.pathIndex,1);
 f.runtime.observeSpark(0,++f.clocks.spark);f.runtime.observeSpark(0,++f.clocks.spark);
 s=f.runtime.snapshot().sparks[0];assert.equal(s.bombIndex,2);assert.equal(s.pathStep,-1);
 f.runtime.observeSpark(0,++f.clocks.spark);const e=f.runtime.observeSpark(0,++f.clocks.spark);
 assert.equal(f.runtime.snapshot().sparks[0].visible,false);assert.equal(f.runtime.snapshot().sparks[0].clockAttached,false);
 assert.equal(f.runtime.snapshot().explosions[0].visible,true);
 assert.ok(e.findIndex(e=>e.id===12)<e.findIndex(e=>e.target==='SR'&&e.type==='hide'));
 assert.deepEqual(f.runtime.observeExplosion(0,30),[]); // Synchronous snapshot suppresses same-count callback.
});
test('path reflection is vertical, horizontal, swap, then raw grid offset',()=>{
 const r=routes();r[0]={...r[0],points:[[2,5]],flipVertical:true,flipHorizontal:true,swap:true};
 const f=fixture({routes:r});f.runtime.ignite(0,hero());
 assert.deepEqual(f.runtime.snapshot().sparks[0].point,{x:100,y:97});
});
test('spark capacity drops allocation but still consumes match; reset reuses insertion identity',()=>{
 const f=fixture();for(let i=0;i<17;i++)assert.equal(f.runtime.activateSpark(0,4),i);
 assert.equal(f.runtime.activateSpark(0,4),-1);
 const e=f.runtime.ignite(0,hero());assert.deepEqual(e.map(x=>x.type),['hide','sound']);
 assert.equal(f.runtime.snapshot().armed[0],false);
 f.runtime.reset();f.seen.length=0;f.runtime.ignite(0,hero());
 assert.equal(f.seen.some(e=>e.type==='append-sprite'),false);assert.equal(f.runtime.snapshot().sparks[0].frame,0);
});
test('explosion sound precedes allocation and fires even with all six slots occupied',()=>{
 const f=fixture(),counts=[];f.adapters.effect=e=>{if(e.type==='sound')counts.push(f.runtime.snapshot().explosions.filter(s=>s.visible).length);};
 for(let i=0;i<6;i++)assert.equal(f.runtime.activateExplosion(2),i);
 assert.equal(f.runtime.activateExplosion(2),-1);assert.deepEqual(counts,[0,1,2,3,4,5,6]);
});
test('explosion coalesces counts and dispatches frame 3 old descriptor in source order',()=>{
 const f=fixture();f.runtime.activateExplosion(2);f.runtime.observeExplosion(0,31);f.runtime.observeExplosion(0,99);
 const old=[];f.adapters.effect=e=>old.push([e.type,e.target,e.descriptorFrame,f.runtime.snapshot().explosions[0].frame]);
 f.runtime.observeExplosion(0,100);
 assert.deepEqual(old.map(e=>e.slice(0,2)),[['stationary','SP'],['stationary','DS'],['stationary','EL'],['stationary','GN'],['stationary','TR'],['stationary','WL'],['stationary','DO'],['moving','DO'],['moving','DP'],['moving','WA']]);
 assert.ok(old.every(e=>e[2]===2&&e[3]===2));assert.deepEqual(f.runtime.observeExplosion(0,100),[]);
});
test('frame 4 repaints burnt static dots after crater; frame 10 collides before hide',()=>{
 const f=fixture(),d=dot('d',1,3),order=[];
 f.adapters.effect=e=>{
  order.push(`${e.type}:${e.target??''}`);
  if(e.type==='stationary'&&e.target==='DO')bombStationaryDots([d],e.grid,(_,change)=>order.push(`repaint:${change.changed}`));
 };
 f.runtime.activateExplosion(2);for(let n=31;n<=33;n++)f.runtime.observeExplosion(0,n);
 assert.equal(d.burnt,true);order.length=0;f.runtime.observeExplosion(0,34);
 assert.deepEqual(order,['moving:DO','moving:DP','moving:WA','paint-crater:','stationary:DO','repaint:false']);
 for(let n=35;n<=39;n++)f.runtime.observeExplosion(0,n);order.length=0;
 const final=f.runtime.observeExplosion(0,40);
 assert.deepEqual(order,['moving:DO','moving:DP','moving:WA','hide:']);assert.ok(final.every(e=>e.descriptorFrame===9));
 assert.equal(f.runtime.snapshot().explosions[0].frame,9);assert.equal(f.runtime.snapshot().explosions[0].visible,false);
});
test('a death/freeze request inside the blast callback does not truncate its remaining effects',()=>{
 const f=fixture();f.runtime.activateExplosion(2);for(let n=31;n<=33;n++)f.runtime.observeExplosion(0,n);
 const order=[];f.adapters.effect=e=>{order.push([e.type,e.target]);if(e.type==='moving'&&e.target==='WA')f.runtime.freeze();};
 f.runtime.observeExplosion(0,34);
 assert.deepEqual(order,[['moving','DO'],['moving','DP'],['moving','WA'],['paint-crater',undefined],['stationary','DO']]);
 assert.equal(f.runtime.snapshot().explosions[0].frame,4);assert.deepEqual(f.runtime.observeExplosion(0,35),[]);
});
test('dot blast preserves pivots, colors, goals and permissions; rings cannot become burnt',()=>{
 const a=dot('a',1,1,{bonus:true,goal:true,sourceInBackground:false}),b=dot('b',2,1,{ring:true,bonus:true,sourceInBackground:false}),c=dot('c',1,2,{ring:true,humanCanGrab:false,bonus:true,sourceInBackground:false}),d=dot('d',2,2);
 const hits=[];assert.deepEqual(bombStationaryDots([a,b,c,d],{row:1,column:1},x=>hits.push(x.id)),['a','b','d']);
 assert.deepEqual(hits,['a','b','d']);assert.equal(a.goal,true);assert.equal(a.humanCanGrab,true);assert.equal(a.nonhumanCanGrab,true);
 assert.equal(a.burnt,true);assert.equal(a.color,2);assert.equal(a.bonus,false);assert.equal(b.burnt,false);assert.equal(b.bonus,false);assert.equal(c.bonus,true);
 assert.throws(()=>applyBombDotHit({...a,moving:true},()=>{}),/Unsupported/);
});
test('available ring keeps its range after bomb; changed live sprite look resets only frame/range',()=>{
 const ring=dot('r',1,1,{ring:true,color:1,sourceInBackground:false}),events=[];
 assert.equal(applyBombDotHit(ring,(_,e)=>events.push(e)),false);assert.deepEqual(events,[]);
 ring.bonus=true;assert.equal(applyBombDotHit(ring,(_,e)=>events.push(e)),true);
 assert.equal(ring.burnt,false);assert.equal(events[0].minimum,30);assert.equal(events[0].maximum,37);
 assert.equal(events[0].updateSpriteRange,true);assert.equal(events[0].paintBackground,false);assert.equal(ring.humanCanGrab,true);
 assert.throws(()=>applyBombDotHit({...ring,protected:true},()=>{}),/Unsupported/);
 assert.throws(()=>applyBombDotHit({...ring,waystation:{}},()=>{}),/Unsupported/);
});
test('bomb actor scan hides ordinary enemies until reset and continues after human death',()=>{
 const h=hero(),a=enemy(2),b=enemy(3),events=[];
 assert.deepEqual(bombActors([h,a,b],{guestTick:1000,collides:()=>true,onHidden:x=>events.push(`hide${x.sourceSlot}`),onDeath:(x,e)=>events.push(`death${x.sourceSlot}:${e.reason}`)}),[0,2,3]);
 assert.deepEqual(events,['hide0','death0:-1','hide2','hide3']);assert.equal(a.hiddenUntil,1300);assert.equal(a.visible,false);
 assert.throws(()=>bombActors([a,h],{guestTick:0,collides:()=>true,onHidden:()=>{},onDeath:()=>{}}),/ascending/);
 assert.throws(()=>bombActors([{sourceSlot:2,sourceActorType:5}],{guestTick:0,collides:()=>true,onHidden:()=>{},onDeath:()=>{}}),/ordinary/);
});
test('only travelling sparks kill humans; ordinary enemy spark query is excluded',()=>{
 const f=fixture();f.runtime.ignite(0,hero());assert.deepEqual(f.runtime.checkSpark(hero()),[]);startTravel(f);
 assert.deepEqual(f.runtime.checkSpark(enemy(2)),[]);assert.equal(f.runtime.checkSpark(hero())[0].reason,15);
 assert.equal(f.runtime.snapshot().sparks[0].visible,true); // Hit is not spark consumption.
});
test('goodie callbacks see source latch order and visibility lasts until flourish finishes',()=>{
 const f=fixture({goodies:[{row:2,column:2,initialFrame:59}]}),observations=[];let finish;
 f.adapters.effect=e=>{observations.push([e.type,f.runtime.snapshot().goodies[0].collected]);if(e.finish)finish=e.finish;};
 assert.equal(f.runtime.snapshot().goodies[0].frame,0);
 const e=f.runtime.checkGoodie(hero());assert.deepEqual(e.map(e=>e.type),['sound','flourish','floating-score','add-time','add-bonus']);
 assert.deepEqual(e[1].gridOffset,{x:18,y:18});assert.deepEqual(e[2].gridOffset,{x:10,y:16});
 assert.deepEqual(observations.map(x=>x[1]),[false,false,false,true,true]);assert.equal(e[3].seconds,10);assert.equal(e[4].points,1000);
 assert.equal(f.runtime.snapshot().goodies[0].visible,true);assert.deepEqual(f.runtime.checkGoodie(hero()),[]);
 finish();assert.equal(f.runtime.snapshot().goodies[0].visible,false);
});
test('collected visible goodie blocks later overlap, and Child enemies cannot collect',()=>{
 const f=fixture({goodies:[{row:1,column:1},{row:1,column:1}]});
 assert.deepEqual(f.runtime.checkGoodie(enemy(2)),[]);
 const e=f.runtime.checkGoodie(hero());assert.deepEqual(f.runtime.checkGoodie(hero()),[]);
 assert.equal(f.runtime.snapshot().goodies[1].collected,false);
 e.find(e=>e.finish).finish();assert.equal(f.runtime.checkGoodie(hero()).length,5);
});
test('LI and GO coalesce while hidden; round reset retains phase and rejects stale flourish hide',()=>{
 const f=fixture({goodies:[{row:1,column:1,initialFrame:16}]});
 const finish=f.runtime.checkGoodie(hero()).find(e=>e.finish).finish;finish();f.runtime.ignite(0,hero());
 f.runtime.observeGoodie(0,4000);f.runtime.observeMatch(0,1000);
 assert.equal(f.runtime.snapshot().goodies[0].frame,0);assert.equal(f.runtime.snapshot().matches[0].frame,1);
 f.runtime.reset();finish();let s=f.runtime.snapshot();assert.equal(s.goodies[0].visible,true);assert.equal(s.matches[0].frame,1);
 assert.deepEqual(f.runtime.observeGoodie(0,4000),[]);assert.deepEqual(f.runtime.observeMatch(0,1000),[]);
 assert.equal(s.sparks.some(s=>s.clockAttached),false);assert.equal(s.explosions.some(s=>s.visible),false);
});
test('freeze defers all callbacks and contact; thaw coalesces elapsed counts once',()=>{
 const f=fixture({goodies:[{row:1,column:1}]});f.runtime.ignite(0,hero());f.runtime.activateExplosion(2);f.runtime.freeze();
 const before=f.runtime.snapshot();f.time.fresh=9999;
 for(const [method,index]of [['observeMatch',0],['observeGoodie',0],['observeSpark',0],['observeExplosion',0]])assert.deepEqual(f.runtime[method](index,999),[]);
 assert.deepEqual(f.runtime.checkGoodie(hero()),[]);assert.deepEqual(f.runtime.snapshot(),before);
 f.runtime.freeze(false);f.runtime.observeSpark(0,999);f.runtime.observeExplosion(0,999);
 assert.equal(f.runtime.snapshot().sparks[0].frame,4);assert.equal(f.runtime.snapshot().explosions[0].frame,1);
});
