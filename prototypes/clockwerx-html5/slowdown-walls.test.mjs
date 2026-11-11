import test from 'node:test';import assert from 'node:assert/strict';
import {assertSlowdownWallRecipe,assertSlowdownWallSource,assertSlowdownWallActor} from './slowdown-walls.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {dotBodyFrame} from './dots.mjs';
const recipe={allowSlowdownWalls:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?33:1,secondaryRaw:i===24?31:15}));
 const actor=(type,ref=-1)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,ref<0?65535:ref,1,type===0||type===6?0:1]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(1,0),actor(2)]},{kind:'WP',count:1,records:[{text:'fns'}]},{kind:'SP',count:1,records:[{rawWords:[2,2,2,2,0,15]}]},{kind:'WL',count:1,records:[{rawWords:[256,3,0,0,1,0]}]}]};
}
test('slowdown wall capability remains separate from orbital and moving families',()=>{
 assert.equal(assertSlowdownWallRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertSlowdownWallRecipe({...recipe,[k]:false}));for(const k of['allowStaticSlowdown','allowRotatingSpikes','allowMovingDots','allowBombs'])assert.throws(()=>assertSlowdownWallRecipe({...recipe,[k]:true}));
});
test('static Slow wall source binds color, spike mask, actor clock and command bounds',()=>{
 assert.equal(assertSlowdownWallSource(fixture()),true);for(const change of[s=>s.cells[24].flagsRaw=35,s=>s.cells[24].secondaryRaw=4111,s=>s.blocks[0].records[2].rawWords[7]=5,s=>s.blocks[1].records[0].text='b',s=>s.blocks[2].records[0].rawWords[5]=14,s=>s.blocks[3].records[0].rawWords[4]=9]){const s=fixture();change(s);assert.throws(()=>assertSlowdownWallSource(s));}
});
test('ordinary free and f/n/s actors exclude nonhuman wall checks and orbitals',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:1,checksWalls:false,program:null};assert.equal(assertSlowdownWallActor(a),true);assert.equal(assertSlowdownWallActor({...a,program:'fns',sourcePC:3}),true);for(const m of[{speedClass:3},{checksWalls:true},{program:'b',sourcePC:1},{sourceActorType:4}])assert.throws(()=>assertSlowdownWallActor({...a,...m}));
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([700,4300,500,4400,200,800].map(g=>[g,frames(g===200?4:g===800?20:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('static wall profile shares slowdown arrival/release/reset without enabling orbital or moving rules',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown);assert.equal(g.board.rotatingSpikeRules,undefined);assert.equal(g.board.movingDotRules,undefined);assert.equal(dotBodyFrame(d),190);g.onHumanGrab(d);assert.equal(dotBodyFrame(d),199);assert.equal(g.slowdown.enabled,true);g.onHumanRelease(d,g.player);assert.equal(dotBodyFrame(d),190);assert.equal(g.slowdown.enabled,true);const before=g.actorClasses.snapshot();for(const c of before.classes)c.divisor=c.normalDivisor;g.reset();assert.equal(g.slowdown.enabled,false);assert.equal(dotBodyFrame(d),190);assert.deepEqual(g.actorClasses.snapshot(),before);
});
test('static Slow wall contact compensates Flip/Swing/Bounce after the wall already reversed the human',()=>{
 for(const[action,expected,pivot]of[['flip',1,'1,0'],['swing',-1,'1,0'],['bounce',-1,'0,0']]){
  const g=round();g.actorClasses.latch(2);Object.assign(g.player,{frame:0,unwrappedFrame:0,angle:0,direction:-1,blocked:null});g.canonicalPlayerContact=true;g.move(g.player,0,action);assert.equal(g.player.direction,expected,action);assert.equal(g.player.pivot,pivot,action);assert.ok(g.events.some(e=>e.type===action));
 }
});
test('normalized Slow walls are bound to source wall tiles and actor inventories',()=>{
 const b=buildDecodedBoard(fixture(),{...recipe,angularSpeed:1});b.walls[0].frame++;assert.throws(()=>new SourceRound(b,profiles));const a=buildDecodedBoard(fixture(),{...recipe,angularSpeed:1});a.enemies[0].speedClass=5;assert.throws(()=>new SourceRound(a,profiles));
});
