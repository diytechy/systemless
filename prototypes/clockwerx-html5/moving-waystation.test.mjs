import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingWaystationRecipe,assertMovingWaystationActor,assertMovingWaystationSource} from './moving-waystation.mjs';
const recipe={allowMovingWaystation:true,...Object.fromEntries(['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?131:i===56?0x4011:1,secondaryRaw:15}));const c=cells[24],rawHex='046570777000';Object.assign(c,{offset:104,byteLength:10,rawHex:'0083000f'+rawHex,inlineProgram:{text:'epwp',offset:108,rawHex,paddingHex:'00'}});
 const actor=(type,cl=0)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===1?0:1,rawWords:[0,0,type,24,1,65535,1,cl]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(1,1),actor(1,3)]},{kind:'WP',count:0,records:[]},{kind:'WY',count:1,records:[{rawWords:[5,1,24,65535,0,15]}]}]};
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
