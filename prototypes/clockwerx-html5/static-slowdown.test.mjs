import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticSlowdownRecipe,assertStaticSlowdownActor,assertStaticSlowdownSource} from './static-slowdown.mjs';
import {StaticSlowdownRuntime} from './static-slowdown.mjs';
import {createActorClocks} from './actor-clocks.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {dotBodyFrame} from './dots.mjs';
const recipe={allowStaticSlowdown:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','RotatingSpikes','RotatingSpikeTransfers'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?0x4021:i===25?3:1,secondaryRaw:15}));
 const actor=(type,cl=0,ref=-1)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,ref<0?65535:ref,1,cl]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:5,records:[actor(0),actor(6),actor(2,5,0),actor(3,1,0),actor(4,1,1)]},{kind:'WP',count:2,records:[{text:'bfns'},{text:'ns'}]},{kind:'SP',count:1,records:[{rawWords:[2,2,2,2,0,15]}]}]};
}
test('static slowdown capability excludes unrelated mechanical families',()=>{
 assert.equal(assertStaticSlowdownRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertStaticSlowdownRecipe({...recipe,[k]:false}));for(const k of ['allowBombs','allowMovingDots','allowOil','allowFastRotatingSpikes'])assert.throws(()=>assertStaticSlowdownRecipe({...recipe,[k]:true}));
});
test('first slowdown source admits ordinary fast clocks and a separate class1 orbital',()=>{
 assert.equal(assertStaticSlowdownSource(fixture()),true);
 for(const change of[s=>s.cells[24].flagsRaw|=2,s=>s.cells[24].secondaryRaw=31,s=>s.blocks[0].records[4].rawWords[7]=5,s=>s.blocks[1].records[1].text='f',s=>s.blocks[0].records[2].version12ByteRaw=1,s=>s.blocks.push({kind:'BO',count:1,records:[{}]})]){const s=fixture();change(s);assert.throws(()=>assertStaticSlowdownSource(s));}
});
test('static slowdown actor predicate keeps human and nonhuman contracts explicit',()=>{
 const a={sourceSlot:2,sourceActorType:3,group:4500,speedClass:5,checksWalls:false,program:'bfns',sourcePC:1};assert.equal(assertStaticSlowdownActor(a),true);for(const m of[{speedClass:3},{sourceActorType:5},{program:null},{sourcePC:0},{checksWalls:true}])assert.throws(()=>assertStaticSlowdownActor({...a,...m}));
});
const shape={left:11,top:11,right:21,bottom:21,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([700,4300,4400,4500,3500,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('human slowdown transitions retain every count, remainder, multiplier, delta and upstream reference',()=>{
 const clocks=createActorClocks(50);clocks.latch(53);const before=clocks.snapshot(),dots=[{id:'slow',slowdown:true,color:2},{id:'normal',slowdown:false}],sounds=[],s=new StaticSlowdownRuntime(dots,clocks,e=>sounds.push(e.sound));
 assert.equal(s.humanGrab(dots[0]),true);const after=clocks.snapshot();assert.equal(after.upstreamReference,53);
 for(let i=0;i<6;i++){const a=after.classes[i],b=before.classes[i];for(const k of['count','remainder','delta','multiplier','normalDivisor','slowDivisor'])assert.equal(a[k],b[k]);assert.equal(a.divisor,i?b.slowDivisor:b.divisor);}
 s.humanGrab(dots[0]);assert.deepEqual(sounds,[24]);assert.equal(dots[0].sourceSlowFrame,200);s.humanRelease(dots[0]);assert.equal(dots[0].sourceSlowFrame,191);assert.equal(s.enabled,true);assert.deepEqual(clocks.snapshot(),after);
 s.humanGrab(dots[1]);assert.deepEqual(sounds,[24,25]);assert.deepEqual(clocks.snapshot(),before);assert.throws(()=>s.humanGrab({...dots[0]}));
});
test('joined slowdown uses occupied main/shadow frames while human and independent hazard clocks keep their rates',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown);assert.equal(d.sourceInBackground,false);assert.equal(dotBodyFrame(d),189);g.onHumanGrab(d);assert.equal(dotBodyFrame(d),198);
 for(let i=0;i<120;i++)g.update(1/120,{});const c=g.actorClasses.snapshot().classes;assert.equal(c[0].divisor,2);assert.equal(c[1].divisor,4);assert.equal(c[5].divisor,2);assert.equal(c[0].count,c[5].count);assert.equal(g.spikeClock.advance(0).clientCount,4);
 g.onHumanRelease(d,g.player);assert.equal(dotBodyFrame(d),189);assert.equal(g.slowdown.enabled,true);g.onHumanGrab(g.board.dots[0]);assert.equal(g.slowdown.enabled,false);
});
test('death-latched slowdown arrival still selects appearance and divisors before blocking scoring',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown);g.beginDeath({reason:'synthetic'});assert.equal(g.onHumanGrab(d),false);assert.equal(g.slowdown.enabled,true);assert.equal(d.sourceSlowFrame,198);assert.equal(g.childScore.roundBonus,0);
});
test('a dispatched non-EX callback retains its arrival prelude after a contact latches death',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown),from=g.board.dots.find(p=>p.row===d.row&&p.column===1);g.player.pivot=from.id;g.player.frame=0;g.player.unwrappedFrame=0;g.player.angle=0;g.player.blocked=null;g.spikeCollision=()=>({reason:'synthetic-contact'});
 for(let i=0;i<20&&!g.death;i++)g.update(1/120,{flip:true});assert.ok(g.death);assert.equal(g.player.pivot,d.id);assert.equal(g.slowdown.enabled,true);assert.equal(d.sourceSlowFrame,198);assert.equal(g.complete,false);assert.equal(g.childScore.roundBonus,0);
});
test('reset restores consumed bonuses and idle slowdown look without restarting retained clock phases',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown),bonus=g.board.dots.find(d=>d.bonus);for(let i=0;i<100;i++)g.update(1/120,{});g.onHumanGrab(d);g.onBonus(bonus);const before=g.actorClasses.snapshot(),spike=g.spikeClock.advance(0);g.reset();assert.equal(g.slowdown.enabled,false);assert.equal(d.sourceSlowFrame,189);assert.equal(bonus.bonus,true);assert.equal(bonus.kind,'bonus');assert.deepEqual(g.spikeClock.advance(0),spike);
 const after=g.actorClasses.snapshot();assert.equal(after.upstreamReference,before.upstreamReference);for(let i=0;i<6;i++){assert.equal(after.classes[i].count,before.classes[i].count);assert.equal(after.classes[i].remainder,before.classes[i].remainder);assert.equal(after.classes[i].divisor,after.classes[i].normalDivisor);}
});
