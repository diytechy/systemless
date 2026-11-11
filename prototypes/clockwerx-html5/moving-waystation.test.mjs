import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingWaystationRecipe,assertMovingWaystationActor,assertMovingWaystationSource} from './moving-waystation.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
const recipe={allowMovingWaystation:true,...Object.fromEntries(['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?131:i===56?0x4011:1,secondaryRaw:i===24?255:15}));const c=cells[24],rawHex='046570777000';Object.assign(c,{offset:104,byteLength:10,rawHex:'008300ff'+rawHex,inlineProgram:{text:'epwp',offset:108,rawHex,paddingHex:'00'}});
 const actor=(type,cl=0)=>{const row=cl===3?2:0,column=cl===3?2:0;return{actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===1?0:1,rawWords:[row,column,type,24,1,65535,1,cl]};};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(1,1),actor(1,3)]},{kind:'WP',count:0,records:[]},{kind:'WY',count:1,records:[{rawWords:[5,1,24,65535,0,15]}]}]};
}
test('moving waystation capability excludes borrowed EX/door/bomb flags',()=>{
 assert.equal(assertMovingWaystationRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingWaystationRecipe({...recipe,[k]:false}));for(const k of['allowSlidingConnectors','allowMovingDoorCheckpoint','allowBombs','allowRotatingSpikes'])assert.throws(()=>assertMovingWaystationRecipe({...recipe,[k]:true}));
});
test('moving source retains pause opcodes and explicit static checkpoint identity',()=>{
 assert.equal(assertMovingWaystationSource(fixture()),true);for(const change of[s=>s.cells[24].inlineProgram.text='eepp',s=>s.cells[56].flagsRaw=0x4091,s=>s.blocks[0].records[2].rawWords[7]=5,s=>s.blocks[0].records[3].programReferenceRaw=0,s=>s.blocks[2].records[0].rawWords[5]=14]){const s=fixture();change(s);assert.throws(()=>assertMovingWaystationSource(s));}
});
test('free red class3 is half the class1 clock and remains a separately admitted actor class',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:3,checksWalls:false,program:null};assert.equal(assertMovingWaystationActor(a),true);for(const m of[{speedClass:5},{sourceActorType:2},{checksWalls:true},{program:'n'}])assert.throws(()=>assertMovingWaystationActor({...a,...m}));
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([700,4300,500].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('moving bonus consumption leaves source motion running and reset restores the bonus',()=>{
 const g=round(),d=g.board.dots.find(d=>d.bonus);g.onBonus(d);assert.equal(d.bonus,false);assert.equal(d.motion,'moving-program');for(let i=0;i<240;i++)g.update(1/120,{});assert.equal(d.x,d.sourceInitialPosition.x+48);g.reset();assert.equal(d.bonus,true);assert.equal(d.kind,'bonus');assert.deepEqual({x:d.x,y:d.y},d.sourceInitialPosition);
});
test('class3 rider follows class1 pivot motion while its angular count advances at half rate',()=>{
 const g=round(),r=g.enemies.find(a=>a.speedClass===3),d=g.point(r),start=d.x,frame=r.frame;for(let i=0;i<240;i++)g.update(1/120,{});const c=g.actorClasses.snapshot().classes;assert.ok(c[1].count===2*c[3].count||c[1].count===2*c[3].count+1);assert.equal(r.frame,(frame+c[3].count)&63);assert.equal(g.point(r).x,start+48);assert.equal(g.point(r),d);
});
test('static checkpoint death reset uses its saved spawn and time with retained moving clocks',()=>{
 const g=round(),wy=g.board.dots.find(d=>d.waystation);for(let i=0;i<200;i++)g.update(1/120,{});g.remainingTime=70;g.onHumanGrab(wy);const clocks=g.actorClasses.snapshot();g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,wy.id);assert.equal(g.player.direction,-1);assert.equal(g.player.frame,48);assert.equal(g.remainingTime,70);assert.deepEqual(g.actorClasses.snapshot(),clocks);g.reset();assert.equal(g.player.pivot,'0,0');assert.equal(g.remainingTime,120);
});
test('human current source query grabs a moving bonus and keeps the moving pivot identity',()=>{
 const g=round();for(let i=0;i<20;i++){g.update(1/120,{});if(g.actorClasses.snapshot().classes[0].delta)break;}const d=g.board.dots.find(d=>d.bonus);Object.assign(g.player,{pivot:'2,1',frame:16,unwrappedFrame:16,angle:Math.PI/2,direction:1,blocked:null,movingPivot:false});g.move(g.player,0,'flip');assert.equal(g.player.pivot,d.id);assert.equal(g.player.movingPivot,true);assert.equal(d.bonus,false);assert.equal(g.childScore.roundBonus,1000);
});
test('free rider helper requires exact live scope and a synchronous current source query',()=>{
 const g=round(),s=g.enemies.find(a=>a.speedClass===3),noop=()=>{},o={program:null,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowMovingWaystation:true,movingWaystationScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};assert.equal(advanceStaticEnemyCallback(s,1,o).state.frame,(s.frame+1)&63);assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,dots:[...g.board.dots]}));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,sourceQuery:async()=>({allowed:false})}));
});
