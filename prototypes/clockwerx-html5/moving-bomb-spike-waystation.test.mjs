import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {describe,test,after} from 'node:test';
import {fixture,recipe,profiles,routes,tiny} from './moving-bomb-spike-waystation.fixture.mjs';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound,worldOutline} from './round.mjs';
import {BombScene} from './bomb-scene.mjs';
import {bombActors} from './bomb-runtime.mjs';
import {bombHitsStationarySpike,createExplosionPool} from './bombs.mjs';
import {bombStationaryWalls} from './walls.mjs';
import {assertMovingBombSpikeWaystationScope,assertMovingBombSpikeWaystationPhysics} from './moving-bomb-spike-waystation.mjs';
import {assertMovingSpikeScope} from './moving-spikes.mjs';
import {assertMovingBombScope} from './moving-bombs.mjs';
import {assertStaticSlidingBombGoodieScope} from './static-sliding-bomb-goodies.mjs';
import {dotBodyFrame} from './dots.mjs';
// Invented source only. Four independent synthetic rounds; no private paths/data.
const budget={rawBuilds:0,constructorsAttempted:0,constructorsCompleted:0,updatesAttempted:0,updatesCompleted:0,explicitResets:0,helperCallbacks:0};
const board=(options={})=>{budget.rawBuilds++;return buildDecodedBoard(fixture(options),recipe);};
const construct=()=>{assert.ok(budget.constructorsAttempted<4);budget.constructorsAttempted++;const g=new SourceRound(board(),{...profiles(),bombRoutes:routes,deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})});budget.constructorsCompleted++;return g;};
const update=(g,input={})=>{assert.ok(budget.updatesAttempted<600);budget.updatesAttempted++;g.update(1/120,input);budget.updatesCompleted++;};
const reset=(g,options)=>{budget.explicitResets++;assert.ok(budget.explicitResets<=4);g.reset(options);};
const helper=f=>{budget.helperCallbacks++;assert.ok(budget.helperCallbacks<=64);return f();};
function appOptions(value){
 const source=readFileSync(new URL('./app.mjs',import.meta.url),'utf8'),begin='const board=buildDecodedBoard(reference.data,{',start=source.indexOf(begin);assert.ok(start>=0);assert.equal(source.indexOf(begin,start+1),-1);const end=source.indexOf('});',start);assert.ok(end>start);
 const reference={data:{invented:true},movingBombSpikeWaystationQualified:value};
 return vm.runInNewContext('(()=>{'+source.slice(start,end+3)+'return board;})()',{reference,TAU:Math.PI*2,buildDecodedBoard:(data,options)=>{assert.strictEqual(data,reference.data);return options;}},{timeout:1000});
}
describe('separate moving DO/BO-GO-WY-WL-SPI invented contracts',{concurrency:false,timeout:30000},()=>{
after(()=>{assert.ok(budget.constructorsAttempted<=4&&budget.updatesAttempted<=600&&budget.helperCallbacks<=64&&budget.explicitResets<=4);console.log('MOVING_BOMB_SPI_WY_SYNTHETIC_BUDGET '+JSON.stringify(budget));});
 test('default off and exclusive paired capability; changed invented layout/program/color also admitted',()=>{
  for(const value of [undefined,false,true,'true',1])assert.equal(appOptions(value).allowMovingBombSpikeWaystation,value===true);
  const r=fixture();assert.ok(levelRequirements(r,{...recipe,allowMovingBombSpikeWaystation:false}).length);assert.ok(levelRequirements(r,{...recipe,allowMovingBombSpikeWaystation:1}).length);for(const k of ['allowMovingDots','allowCanonicalPlayer','allowImportedGoodie169','allowClass3RotatingSpikes'])assert.ok(levelRequirements(r,{...recipe,[k]:false}).length);
  for(const k of ['allowMovingBombs','allowMovingSpikes','allowStaticSlidingBombGoodies','allowSlidingConnectors','allowOil'])assert.ok(levelRequirements(r,{...recipe,[k]:true}).length);
  const a=board(),b=board({mover:75,program:'ns',color:5});assert.notEqual(a.dots.find(d=>d.motion==='moving-program').sourceIndex,b.dots.find(d=>d.motion==='moving-program').sourceIndex);assertMovingBombSpikeWaystationScope(b,{initial:true});assert.throws(()=>assertMovingSpikeScope(a));assert.throws(()=>assertMovingBombScope(a));assert.throws(()=>assertStaticSlidingBombGoodieScope(a));
  const ringMiss=a.dots.find(d=>d.sourceIndex===55);assert.equal(ringMiss.cell,0x4001);assert.equal(ringMiss.ring,false);assert.equal(a.spikes.length,2);assert.deepEqual(a.spikes.map(s=>s.phase),[0,1]);assert.equal(a.goodies.length,1);assert.equal(a.goodies[0].initialFrame,0);assert.equal(a.goodies[0].sourceInitialFrameRequest,169);assert.equal(a.puddles.length,0);assert.equal(a.connectors.length,0);
 });
 test('raw and normalized forgery guards and mandatory original physics',()=>{
  for(const mutate of [r=>r.header.version=11,r=>r.blocks.find(b=>b.kind==='PU').records[0].rawWords[4]=15,r=>r.cells[74].inlineProgram.text='s',r=>r.blocks.find(b=>b.kind==='WA').records[4].rawWords[7]=1,r=>r.blocks.push({kind:'EX',count:1,records:[{}]})]){const r=fixture();mutate(r);assert.throws(()=>buildDecodedBoard(r,recipe));}
  for(const mutate of [b=>b.movingBombSpikeWaystationRules=false,b=>b.movingSpikeRules=true,b=>b.dots[0].sourceIndex=1,b=>b.enemies[2].program='n',b=>b.spikes[0].phase=3,b=>b.walls[0].x++,b=>b.sourceGrid.rows=7,b=>b.goodies[0].initialFrame=16]){const b=structuredClone(board());mutate(b);assert.throws(()=>assertMovingBombSpikeWaystationScope(b));}
  const b=board(),p=profiles();assertMovingBombSpikeWaystationPhysics(b,p.outlines,p.dotOutlines,p.bombOutlines);p.outlines.groups[200].frames.pop();assert.throws(()=>assertMovingBombSpikeWaystationPhysics(b,p.outlines,p.dotOutlines,p.bombOutlines));
 });
 test('raw signed-word WA phases and omitted WP byte lengths preserve exact decoder DTOs',()=>{
  const phase=(r,index,raw)=>{const a=r.blocks.find(b=>b.kind==='WA').records[index];a.rawWords[3]=raw;a.initialFrameHalfIndexRaw=raw>32767?raw-65536:raw;a.rawHex=a.rawWords.map(w=>w.toString(16).padStart(4,'0')).join('');};
  for(const[raw,expectedFrame]of [[40,16],[65535,62],[32768,0],[32767,62]]){
   const r=fixture(),programs=r.blocks.find(b=>b.kind==='WP').records;
   for(const p of programs)delete p.byteLength;
   for(const index of [0,1,2])phase(r,index,raw);
   budget.rawBuilds++;const b=buildDecodedBoard(r,recipe);
   assert.equal(b.player.angle,expectedFrame*Math.PI*2/64);assert.equal(b.enemies[0].frame,expectedFrame);assert.equal(b.enemies[0].angle,expectedFrame*Math.PI*2/64);
   assert.ok(programs.every(p=>!Object.hasOwn(p,'byteLength')));assert.ok(b.movingBombSpikeWaystationSource.blocks.find(b=>b.kind==='WP').records.every(p=>!Object.hasOwn(p,'byteLength')));
  }
  for(const mutate of [
   r=>r.blocks.find(b=>b.kind==='WP').records[0].byteLength++,
   r=>r.blocks.find(b=>b.kind==='WP').records[0].byteLength=null,
   r=>r.blocks.find(b=>b.kind==='WP').records[0].byteLength=undefined,
   r=>r.blocks.find(b=>b.kind==='WP').records[0].offset=r.byteLength,
   r=>r.blocks.find(b=>b.kind==='WP').records[0].rawHex='00',
   r=>{phase(r,0,65535);r.blocks.find(b=>b.kind==='WA').records[0].initialFrameHalfIndexRaw=65535;},
   r=>{phase(r,2,40);r.blocks.find(b=>b.kind==='WA').records[2].rawWords[3]=39;},
   r=>phase(r,0,65536)
  ]){const r=fixture();mutate(r);budget.rawBuilds++;assert.throws(()=>buildDecodedBoard(r,recipe));}
 });
 test('joined cold synthetic updates; type4 class3 remains outside ordinary match hooks',()=>{
  const g=construct();
  const matched=[],old=g.bombScene.runtime.checkMatch.bind(g.bombScene.runtime);g.bombScene.runtime.checkMatch=a=>{matched.push(a.sourceActorType);return old(a);};
  for(let i=0;i<256;i++)update(g);assert.equal(g.death,null);assert.ok(matched.includes(0)&&matched.includes(1)&&matched.includes(2));assert.ok(!matched.includes(4));assert.ok(g.movingSpikes.snapshot().spikes.some(s=>s.reference>0));assert.ok(g.enemies[2].unwrappedFrame>0);
 });
 test('bomb-hidden retained SPI identities and nondefault bank/frame/ref survive normal and checkpoint resets',()=>{
  const g=construct();
  for(let i=0;i<256;i++)update(g);
  const spikes=g.board.spikes,objects=[...spikes],state=g.movingSpikes.snapshot();helper(()=>g.bombScene.effect({type:'stationary',target:'SP',grid:{row:3,column:8}}));assert.equal(spikes[0].visible,false);
  reset(g);assert.strictEqual(g.board.spikes,spikes);spikes.forEach((s,i)=>assert.strictEqual(s,objects[i]));assert.deepEqual(g.movingSpikes.snapshot(),state);assert.ok(spikes.every(s=>s.visible));helper(()=>g.movingSpikes.poll(spikes));
  const order=[],spy=(object,key,label)=>{const old=object[key];object[key]=function(...args){order.push(label);return old.apply(this,args);};return()=>object[key]=old;};
  const wy=g.board.dots.find(d=>d.waystation);g.player.pivot=wy.id;g.remainingTime=83;helper(()=>g.onHumanGrab(wy));helper(()=>g.bombScene.unbonus(wy,true));assert.ok(wy.burnt);
  const clean=[spy(g.movingSpikes,'reset','SPI'),spy(g.bombScene,'reset','BO'),spy(g.dotAnimations,'reset','WY'),spy(g,'onHumanGrab','human-grab')];reset(g,{preserveCheckpoint:true});clean.forEach(f=>f());assert.deepEqual(order,['SPI','BO','WY','human-grab']);assert.equal(g.player.pivot,wy.id);assert.equal(g.player.direction,-1);assert.equal(g.remainingTime,83);assert.equal(wy.burnt,undefined);assert.strictEqual(g.board.spikes,spikes);assert.deepEqual(g.movingSpikes.snapshot(),state);helper(()=>g.movingSpikes.poll(spikes));update(g);
  const replacement=[...spikes];g.board.spikes=replacement;assert.throws(()=>helper(()=>g.movingSpikes.poll(replacement)));g.board.spikes=spikes;
 });
 test('moving DO blast unbonus preserves mover, riders and permissions; independent WA blast includes class3 type4',()=>{
  const g=construct();
  const d=g.board.dots.find(d=>d.motion==='moving-program'),motion=g.movingDots.get(d.id).snapshot();g.player.pivot=d.id;g.player.movingPivot=true;const hand=structuredClone(g.player),dotIdentity={id:d.id,sourceIndex:d.sourceIndex,program:d.movingProgram,humanCanGrab:d.humanCanGrab,nonhumanCanGrab:d.nonhumanCanGrab,sourceCollidable:d.sourceCollidable};
  const old=g.bombScene.shape;g.bombScene.shape=()=>worldOutline(profiles().dotOutlines,300,dotBodyFrame(d),{x:d.x-16,y:d.y-15});helper(()=>g.bombScene.effect({type:'moving',target:'DO',descriptorFrame:2,grid:{row:4,column:8}}));g.bombScene.shape=old;assert.equal(d.burnt,true);assert.deepEqual(g.movingDots.get(d.id).snapshot(),motion);assert.deepEqual(g.player,hand);assert.deepEqual({id:d.id,sourceIndex:d.sourceIndex,program:d.movingProgram,humanCanGrab:d.humanCanGrab,nonhumanCanGrab:d.nonhumanCanGrab,sourceCollidable:d.sourceCollidable},dotIdentity);assert.equal(g.death,null);
  const human=structuredClone(g.player),orbital=structuredClone(g.enemies[2]),calls=[];human.visible=true;orbital.visible=true;orbital.orphaned=true;orbital.orphanDeadline=17;const hits=helper(()=>bombActors([human,orbital],{guestTick:100,allowMovingBombSpikeWaystation:true,allowObjectInteractions:true,collides:()=>true,onHidden:a=>calls.push(a.sourceSlot),onDeath:()=>calls.push('death')}));assert.deepEqual(hits,[0,4]);assert.deepEqual(calls,[0,'death',4]);assert.equal(orbital.hiddenUntil,400);assert.equal(orbital.orphaned,true);assert.equal(orbital.orphanDeadline,17);assert.equal(orbital.visible,false);
 });
 test('partial WL topology, SP arm hits and ordered explosion descriptor semantics',()=>{
  const walls=structuredClone(board().walls),paints=[];assert.ok(walls.some(w=>w.frame===1));const hit=helper(()=>bombStationaryWalls(walls,{row:6,column:4},p=>paints.push(p)));assert.equal(hit.length,1);assert.equal(hit[0].frame,3);assert.equal(walls.find(w=>w.id===hit[0].id).visible,false);assert.equal(helper(()=>bombStationaryWalls(structuredClone(board().walls),{row:2,column:2},()=>{})).length,0);
  const sp={row:3,column:8,subrow:0,subcolumn:2};assert.equal(helper(()=>bombHitsStationarySpike(sp,{row:2,column:8})),true);assert.equal(helper(()=>bombHitsStationarySpike(sp,{row:3,column:7})),false);
  const pool=createExplosionPool();pool.activate({row:2,column:2},0);const events=[];for(let count=1;count<=10;count++)helper(()=>pool.observe(0,count,{onEffect:e=>events.push(e)}));const third=events.filter(e=>e.callbackFrame===3);assert.deepEqual(third.map(e=>e.target),['SP','DS','EL','GN','TR','WL','DO','DO','DP','WA']);assert.ok(third.every(e=>e.descriptorFrame===2));const tenth=events.filter(e=>e.callbackFrame===10);assert.deepEqual(tenth.map(e=>e.target??e.type),['DO','DP','WA','hide']);assert.ok(tenth.every(e=>e.descriptorFrame===9));
 });
 test('GO ignored169 provenance, one award, flourish hide, stale finish and persistent frame/reference reset',()=>{
  const g=construct();
  reset(g);const rt=g.bombScene.runtime,go=rt.goodies[0],count=rt.clock('goodie');helper(()=>rt.observeGoodie(0,count+1));const frame=go.frame,reference=go.count;assert.equal(go.sourceInitialFrameRequest,169);const beforeTime=g.remainingTime,beforeScore=g.childScore.snapshot().roundBonus;
  const first=helper(()=>rt.collectGoodie(0,g.player)),again=helper(()=>rt.collectGoodie(0,g.player));assert.equal(first.filter(e=>e.type==='add-bonus').length,1);assert.deepEqual(again,[]);assert.equal(g.remainingTime,beforeTime+10);assert.equal(g.childScore.snapshot().roundBonus,beforeScore+1000);const stale=g.bombScene.effects.find(e=>e.kind==='flourish').finish;assert.equal(go.visible,true);
  for(let i=1;i<=5;i++){helper(()=>g.bombScene.flourishClock.advance(50));helper(()=>g.bombScene.processEffects());}assert.equal(go.visible,false);reset(g);assert.equal(go.visible,true);assert.equal(go.collected,false);assert.equal(go.frame,frame);assert.equal(go.count,reference);stale();assert.equal(go.visible,true);
 });
 test('legacy flags retain existing clone reset contract',()=>{
  const spikes=[{id:0,visible:false}],walls=[{id:0}],fake={round:{board:{walls,spikes,dots:[{id:'x',bonus:false}],switches:[],connectors:[],wallRevision:0}},original:{walls:[{id:0}],spikes:[{id:0,visible:true}],dots:[{id:'x',bonus:true,kind:'bonus'}],switches:[],connectors:[]},runtime:{reset(){}},craters:[],backgroundPaints:[],effects:[],score:5};
  helper(()=>BombScene.prototype.reset.call(fake));assert.notStrictEqual(fake.round.board.spikes,spikes);assert.notStrictEqual(fake.round.board.walls,walls);assert.deepEqual(fake.round.board.spikes,[{id:0,visible:true}]);assert.equal(spikes[0].visible,false);assert.deepEqual(fake.round.board.dots,[{id:'x',bonus:true,kind:'bonus'}]);assert.equal(fake.round.board.wallRevision,1);assert.equal(fake.score,5);
 });
});
