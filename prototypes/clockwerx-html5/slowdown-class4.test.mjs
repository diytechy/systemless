import test from 'node:test';import assert from 'node:assert/strict';
import {assertSlowdownClass4Recipe,assertSlowdownClass4Actor,assertSlowdownClass4Source} from './slowdown-class4.mjs';
const recipe={allowSlowdownClass4:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===24?0x4021:1,secondaryRaw:i===24?4111:15}));const actor=(type)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,type===0||type===6?0:4]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(1),actor(3)]},{kind:'SP',count:1,records:[{rawWords:[2,2,2,2,0,15]}]},{kind:'WL',count:1,records:[{rawWords:[256,3,0,0,1,0]}]},{kind:'PU',count:1,records:[{rawWords:[5,3,0,0,8]}]}]};
}
test('class4 slowdown capability excludes active Oil and unrelated mechanics',()=>{
 assert.equal(assertSlowdownClass4Recipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertSlowdownClass4Recipe({...recipe,[k]:false}));for(const k of['allowOil','allowSlowdownWalls','allowMovingDots','allowBombs'])assert.throws(()=>assertSlowdownClass4Recipe({...recipe,[k]:true}));
});
test('class4 source preserves blue Slow and excludes active PU or programmed ordinary actors',()=>{
 assert.equal(assertSlowdownClass4Source(fixture()),true);for(const change of[s=>s.cells[24].secondaryRaw=271,s=>s.blocks[0].records[2].rawWords[7]=1,s=>s.blocks[0].records[3].programReferenceRaw=0,s=>s.blocks[3].records[0].rawWords[4]=9]){const s=fixture();change(s);assert.throws(()=>assertSlowdownClass4Source(s));}
});
test('class4 free red and blue actor admission keeps normal and slowed clock selection explicit',()=>{
 const a={sourceSlot:2,sourceActorType:3,group:4500,speedClass:4,program:null,checksWalls:false};assert.equal(assertSlowdownClass4Actor(a),true);for(const m of[{speedClass:3},{sourceActorType:4},{program:'n'},{checksWalls:true}])assert.throws(()=>assertSlowdownClass4Actor({...a,...m}));
});
