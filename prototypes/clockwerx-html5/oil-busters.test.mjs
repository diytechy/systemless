import test from 'node:test';
import assert from 'node:assert/strict';
import {assertOilBusterRecipe,assertOilBusterActor} from './oil-busters.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
const recipe={angularSpeed:1,allowOilBusters:true,allowFreeBusters:true,allowOil:true,allowCanonicalOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true,allowStaticEnemyWalls:true,allowProgrammedEnemyWalls:true};
const block=(kind,rs)=>({kind,count:rs.length,records:rs.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,speed,ref=-1,half=0)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:half,programReferenceRaw:ref,version12ByteRaw:ref>=0||type===0||type===6?1:0,rawWords:[0,0,type,half,1,ref<0?65535:ref,1,speed,0,1,0]});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:300},cells:Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:1,secondaryRaw:15})),blocks:[{kind:'WA',count:4,records:[actor(0,0),actor(6,0,-1,40),actor(5,1,-1,35),actor(2,1,0)]},{kind:'WP',count:1,records:[{text:'nsn'}]},block('PU',[[2,2,3,0,15]]),block('SP',[[5,5,0,2,0,15]]),block('WL',[[0,3,2,0,2,0]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[[0,1]],flipY:false,collidable:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([200,500,700,800,3900,4300,4400].map(g=>[g,frames(64)]))},oilOutlines:{groups:{1200:frames(32),2200:frames(104)}},dotOutlines:{groups:{300:frames(17)}},oilBounds:{left:28,top:28,right:612,bottom:452},deathFactory:()=>({update(){},snapshot(){return[];}})};
test('Oil3/buster wall composition is opt-in and rejects old mixed flags and wrong active Oil',()=>{
 assert.equal(assertOilBusterRecipe(recipe),true);
 for(const key of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>assertOilBusterRecipe({...recipe,[key]:false}));
 assert.throws(()=>assertOilBusterRecipe({...recipe,allowBombs:true}));
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowOilBusters:false}));
 const s=fixture();s.blocks.find(b=>b.kind==='PU').records[0].rawWords[2]=2;assert.throws(()=>buildDecodedBoard(s,recipe));
 const b=buildDecodedBoard(fixture(),recipe);assert.equal(b.bombRules,false);assert.equal(b.oilBusterRules,true);assert.equal(b.enemies[0].frame,6);
});
test('only ordinary n/s programs check walls, while free busters keep fixed class1 clocks',()=>{
 const a={sourceSlot:2,sourceActorType:2,speedClass:1,checksWalls:true,program:'nsn',sourcePC:1};assert.equal(assertOilBusterActor(a),true);
 for(const change of [{program:'b'},{checksWalls:false},{speedClass:3},{sourceActorType:3},{program:null},{movingPivot:true}])assert.throws(()=>assertOilBusterActor({...a,...change}));
 assert.throws(()=>assertOilBusterActor({...a,sourceActorType:5,program:null}));
});
test('Oil, wall programs and buster PR pool advance and reset without a BombScene',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),buster=g.enemies.find(a=>a.sourceActorType===5),start=buster.frame;
 assert.equal(g.bombScene,undefined);assert.ok(g.oil);assert.ok(g.gunTriggers);
 for(let i=0;i<100;i++)g.update(1/120,{});
 assert.notEqual(buster.frame,start);assert.equal(g.death,null);assert.ok(g.oil.now>0);
 g.gunTriggers.launchBuster(buster,g.point(buster),{x:1,y:0});assert.equal(g.gunTriggers.slots.filter(Boolean).length,1);
 const count=g.actorClasses.snapshot().classes[1].count,oilNow=g.oil.now;g.reset();assert.equal(g.gunTriggers.slots.filter(Boolean).length,0);assert.equal(g.oil.puddles[0].triggered,false);assert.equal(g.oil.now,oilNow);assert.equal(g.actorClasses.snapshot().classes[1].count,count);
});
