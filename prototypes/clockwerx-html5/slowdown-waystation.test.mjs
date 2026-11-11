import test from 'node:test';import assert from 'node:assert/strict';
import {assertSlowdownWaystationRecipe,assertSlowdownWaystationActor,assertSlowdownWaystationSource} from './slowdown-waystation.mjs';
const recipe={allowSlowdownWaystation:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?0x4021:i===56?0x4011:1,secondaryRaw:i===87?255:i===24?271:i===56?7:15}));
 const actor=(type,cl=0)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:type===0||type===6?-1:0,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,cl]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:5,records:[actor(0),actor(6),actor(1,5),actor(2,1),actor(3,2)]},{kind:'WP',count:1,records:[{text:'ns'}]},{kind:'WL',count:1,records:[{rawWords:[0,2,4,0,10,0]}]},{kind:'WY',count:1,records:[{rawWords:[5,1,24,65535,0,7]}]}]};
}
test('slowdown checkpoint capability keeps class2 clocks distinct from borrowed class1 wall profile',()=>{
 assert.equal(assertSlowdownWaystationRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertSlowdownWaystationRecipe({...recipe,[k]:false}));for(const k of['allowSlowdownWalls','allowSlowdownClass4','allowMovingWaystation','allowRotatingSpikes'])assert.throws(()=>assertSlowdownWaystationRecipe({...recipe,[k]:true}));
});
test('slowdown checkpoint source preserves white WY, colored goal and programmed ordinary clocks',()=>{
 assert.equal(assertSlowdownWaystationSource(fixture()),true);for(const change of[s=>s.cells[24].secondaryRaw=4111,s=>s.blocks[0].records[2].rawWords[7]=1,s=>s.blocks[0].records[4].programReferenceRaw=-1,s=>s.blocks[3].records[0].rawWords[5]=8,s=>s.cells[56].flagsRaw=0x4031]){const s=fixture();change(s);assert.throws(()=>assertSlowdownWaystationSource(s));}
});
test('slowdown checkpoint blue class2 and fast red class5 programs retain bounded source PCs',()=>{
 const a={sourceSlot:2,sourceActorType:3,group:4500,speedClass:2,checksWalls:false,program:'ns',sourcePC:1};assert.equal(assertSlowdownWaystationActor(a),true);assert.equal(assertSlowdownWaystationActor({...a,sourceActorType:1,group:500,speedClass:5,program:'nbn'}),true);for(const m of[{speedClass:1},{program:'b'},{sourcePC:0},{checksWalls:true}])assert.throws(()=>assertSlowdownWaystationActor({...a,...m}));
});
