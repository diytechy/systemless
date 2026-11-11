import test from 'node:test';
import assert from 'node:assert/strict';
import {assertMovingCheckpointRailRecipe,assertMovingCheckpointRailActor} from './moving-checkpoint-rails.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
const recipe={angularSpeed:1,allowMovingCheckpointRails:true,allowMovingDots:true,allowSlidingConnectors:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true,allowInactiveSpikes:true};
const block=(kind,rs)=>({kind,count:rs.length,records:rs.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,ref=-1)=>({actorTypeRaw:type,gridPosition:type===2?{row:2,column:2}:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:type===6?40:0,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[type===2?2:0,type===2?2:0,type,type===6?40:0,1,ref<0?65535:ref,1,type===2?1:0,0,1,0]});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:300},cells:Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===26?0x4083:i===24?0x4091:1,secondaryRaw:15,...([24,26].includes(i)?{inlineProgram:{text:'npsp',offset:1,rawHex:'',paddingHex:''}}:{})})),blocks:[{kind:'WA',count:3,records:[actor(0),actor(6),actor(2,0)]},{kind:'WP',count:1,records:[{text:'nbns'}]},block('EX',[[3,3,0]]),block('WY',[[2,2,24,1,0,1]]),block('SP',[[5,5,0,2,0,15]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[[0,1]],flipY:false,collidable:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([200,500,700,4300,4400,4500].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({update(){},snapshot(){return[];}})};
test('moving checkpoint rails need their own literal recipe, matching WY and static endpoints',()=>{
 assert.equal(assertMovingCheckpointRailRecipe(recipe),true);
 for(const k of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingCheckpointRailRecipe({...recipe,[k]:false}));
 assert.throws(()=>assertMovingCheckpointRailRecipe({...recipe,allowMovingBombs:true}));
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowMovingCheckpointRails:false}));
 const s=fixture();s.blocks.find(b=>b.kind==='WY').records=[];s.blocks.find(b=>b.kind==='WY').count=0;assert.throws(()=>buildDecodedBoard(s,recipe));
 const e=fixture();e.blocks.find(b=>b.kind==='EX').records[0].rawWords=[2,2,0];assert.throws(()=>buildDecodedBoard(e,recipe));
});
test('ordinary moving/rail callbacks admit only wall-free class1 b/n/s actors',()=>{
 const a={sourceSlot:2,sourceActorType:2,group:4400,speedClass:1,checksWalls:false,program:'nbns',sourcePC:1,movingPivot:true,sliding:true};assert.equal(assertMovingCheckpointRailActor(a),true);
 for(const c of [{program:'f'},{checksWalls:true},{speedClass:3},{sourcePC:0},{group:4500},{sourceActorType:5}])assert.throws(()=>assertMovingCheckpointRailActor({...a,...c}));
});
test('moving checkpoint riders and reset preserve the earned logical spawn and retained clocks',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),d=g.board.dots.find(d=>d.waystation),initial={x:d.x,y:d.y};
 for(let i=0;i<80;i++)g.update(1/120,{});
 assert.notDeepEqual({x:d.x,y:d.y},initial);assert.deepEqual({x:g.point(g.enemies[0]).x,y:g.point(g.enemies[0]).y},{x:d.x,y:d.y});g.onHumanGrab(d);
 const count=g.actorClasses.snapshot().classes[1].count;g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,d.id);assert.equal(g.player.frame,48);assert.equal(g.player.movingPivot,true);assert.deepEqual({x:d.x,y:d.y},initial);assert.equal(g.actorClasses.snapshot().classes[1].count,count);
 g.reset();assert.equal(g.player.pivot,'0,0');assert.equal(g.player.movingPivot,false);
});
test('moving bonus collection clears current look and a restart restores source paint without a BombScene',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),d=g.board.dots.find(d=>d.bonus);assert.equal(g.bombScene,undefined);assert.ok(g.sourcePaint);assert.ok(g.dotAnimations.renderState('10,7').goal);
 g.onBonus(d);assert.equal(d.bonus,false);assert.equal(d.cell&2,0);g.reset();assert.equal(d.bonus,true);assert.equal(d.cell&2,2);assert.equal(g.childScore.roundBonus,0);assert.deepEqual(g.sourcePaint.backgroundPaints,[]);
});
