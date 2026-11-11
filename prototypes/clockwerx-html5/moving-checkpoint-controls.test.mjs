import test from 'node:test';import assert from 'node:assert/strict';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';
import {createSourceUpDownDot} from './elevators.mjs';
import {assertMovingCheckpointControlActor,assertMovingCheckpointControlBoard} from './moving-checkpoint-controls.mjs';
const recipe={angularSpeed:1,allowMovingCheckpointControls:true,allowMovingDots:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true,allowElevators:true,allowInactiveSpikes:true,allowStaticEnemyWalls:true,allowProgrammedEnemyWalls:true};
const block=(kind,rs)=>({kind,count:rs.length,records:rs.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type)=>({actorTypeRaw:type,gridPosition:type===2?{row:3,column:2}:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:type===2?0:-1,version12ByteRaw:1,rawWords:[type===2?3:0,type===2?2:0,type,24,1,type===2?0:65535,1,type===2?1:0,0,1,256]});
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===12?0x4011:i===24?0x4081:i===25?0x4201:i===26?0x4101:1,secondaryRaw:i===26?14:15}));
 Object.assign(cells[24],{offset:100,byteLength:8,rawHex:'4081000f02657700',inlineProgram:{offset:104,text:'ew',rawHex:'02657700',paddingHex:'00'}});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:3,records:[actor(0),actor(6),actor(2)]},{kind:'WP',count:1,records:[{text:'ns'}]},block('WY',[[1,1,24,65535,0,1]]),block('WL',[[256,4,3,0,4,0]]),block('EL',[[3,5,3,1,0,1],[2,2,3,0,0,14]]),block('SP',[[7,7,0,0,0,14]]),block('PU',[[5,5,1,0,14]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[],flipY:false,collidable:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([500,700,800,4300,4400,4500].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},elevatorOutlines:{groups:{3400:frames(10)}},deathFactory:()=>({update(){},snapshot(){return[];}})};
test('moving lower-control join is default off and filters inactive raw properties before allocation',()=>{
 const b=buildDecodedBoard(fixture(),recipe);assert.equal(b.movingCheckpointControlRules,true);assert.equal(b.spikes.length,0);assert.equal(b.puddles.length,0);assert.equal(b.elevators.length,1);
 assert.equal(b.dots.find(d=>d.id==='4,2').motion,'static');const u=b.dots.find(d=>d.id==='3,2');assert.equal(u.upDown.group,1);assert.equal(u.upDown.initialLowered,true);assert.equal(u.motionType,2);
 for(const k of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,[k]:false}));
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowSlidingConnectors:true}));
 const f=fixture();f.blocks.find(b=>b.kind==='PU').records[0].rawWords[4]=1;assert.throws(()=>buildDecodedBoard(f,recipe));
 const e=fixture();e.blocks.find(b=>b.kind==='EL').records[0].rawWords[3]=2;assert.throws(()=>buildDecodedBoard(e,recipe));
});
test('lowered channel1 TYPE2 has explicit initial permission, displaced parents and parked source decorations',()=>{
 const s={id:'invented',sourceIndex:12,row:1,column:1,group:1,initialLowered:true,originalPixel:{x:122,y:120}},o={allowMovingElevators:true,onRiders(){}};
 assert.throws(()=>createSourceUpDownDot(s,o));const m=createSourceUpDownDot(s,{...o,allowLoweredCheckpointControls:true});let a=m.snapshot();
 assert.equal(a.phase,0);assert.equal(a.humanAvailable,true);assert.equal(a.mainVisible,false);assert.equal(a.misc3.frame,135);assert.equal(a.misc3.step,0);assert.equal(a.misc4.frame,158);assert.equal(a.misc4.visible,true);assert.deepEqual(a.mainPixel,{x:110,y:132});assert.deepEqual(a.shadowPixel,{x:98,y:120});
 m.activate();m.dispatch(1,2);a=m.snapshot();assert.equal(a.phase,2);assert.equal(a.mainVisible,true);assert.equal(a.misc4.frame,156);assert.equal(a.intermediate.valid,false);for(let i=2;i<=11;i++)m.dispatch(i,1);assert.equal(m.snapshot().phase,12);assert.equal(m.snapshot().misc3.step,1);m.observeSurface(1);assert.equal(m.snapshot().misc3.frame,136);
 m.activate();m.dispatch(12,1);assert.equal(m.snapshot().humanAvailable,false);const before=m.snapshot();m.reset();a=m.snapshot();assert.equal(a.phase,0);assert.equal(a.humanAvailable,true);assert.equal(a.misc3.frame,135);assert.equal(a.clockReference,before.clockReference);assert.equal(a.surfaceReference,before.surfaceReference);
});
test('joined control raises the actual source dot, then reset restores initial lower state and checkpoint',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),u=g.board.dots.find(d=>d.upDown),wy=g.board.dots.find(d=>d.waystation);
 assert.equal(u.humanCanGrab,true);assert.equal(u.sourceCollidable,false);assert.equal(g.elevators.snapshot().dots[0].phase,0);
 const events=g.elevators.contact('invented-contact',0);assert.equal(events[0].type,'toggle');assert.equal(g.elevators.snapshot().controls[0].frame,6);
 for(let i=0;i<200;i++)g.update(1/120,{});assert.equal(g.elevators.snapshot().dots[0].phase,12);assert.equal(u.sourceCollidable,true);assert.equal(u.x,u.upDown.x);assert.equal(g.movingQueryDots().find(d=>d.id===u.id).intermediate.valid,false);
 g.onHumanGrab(wy);g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,wy.id);assert.equal(g.elevators.snapshot().dots[0].phase,0);assert.equal(g.elevators.snapshot().controls[0].occupants,0);assert.equal(u.humanCanGrab,true);assert.equal(u.sourceCollidable,false);assert.ok(g.sourcePaint.original.walls.length);assert.ok(g.dotAnimations.renderState('10,7').goal);
});
test('wall-reacting programmed TYPE2 is separately admitted and forged compositions reject',()=>{
 const b=buildDecodedBoard(fixture(),recipe),a=b.enemies[0];assert.equal(assertMovingCheckpointControlActor(a),true);assert.equal(assertMovingCheckpointControlBoard(b),true);
 for(const change of[{sourceActorType:1},{speedClass:3},{program:'b'},{program:null},{group:500}])assert.throws(()=>assertMovingCheckpointControlActor({...a,...change}));
 assert.throws(()=>assertMovingCheckpointControlBoard({...b,connectors:[{}]}));assert.throws(()=>assertMovingCheckpointControlBoard({...b,movingElevatorRules:true}));
});
