import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingProtectedPassageRecipe,assertMovingProtectedPassageActor,assertMovingProtectedPassageSource} from './moving-protected-passage.mjs';
const recipe={allowMovingProtectedPassage:true,...Object.fromEntries(['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','InactiveSpikes','InitiallyOpenDoors'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===0?0x4041:i===24?0x4009:i===87?0x4005:1,secondaryRaw:15}));Object.assign(cells[35],{flagsRaw:0x4089,secondaryRaw:14,offset:104,byteLength:10,rawHex:'4089000e046570777000',inlineProgram:{text:'epwp',offset:108,rawHex:'046570777000',paddingHex:'00'}});
 const actor=(type,cl)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,cl]});const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:4,records:[actor(0,0),actor(6,0),actor(3,4),actor(2,1)]},block('SP',[[2,2,2,3,0,15],[4,3,2,0,0,12]]),block('WL',[[0,3,2,1,4,0]]),block('DR',[[3,0,0,258],[3,7,0,258]]),block('DS',[[2,3,2,2],[2,3,1,2]]),block('EX',[[5,2,0]])]};
}
test('passage capability names moving, rail, inactive spike and initially open door behavior explicitly',()=>{
 assert.equal(assertMovingProtectedPassageRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingProtectedPassageRecipe({...recipe,[k]:false}));for(const k of['allowMovingDoorCheckpoint','allowMovingGoalOrdinary','allowOil','allowStaticSlowdown'])assert.throws(()=>assertMovingProtectedPassageRecipe({...recipe,[k]:true}));
});
test('passage source clears inactive mover rings while retaining active static ring and protected spawn',()=>{
 assert.equal(assertMovingProtectedPassageSource(fixture()),true);for(const change of[s=>s.cells[35].secondaryRaw=15,s=>s.cells[24].secondaryRaw=14,s=>s.cells[0].flagsRaw=1,s=>s.blocks[0].records[2].rawWords[7]=3,s=>s.blocks[3].records[0].rawWords[2]=1]){const s=fixture();change(s);assert.throws(()=>assertMovingProtectedPassageSource(s));}
});
test('passage free class4 blue actor remains separate from ordinary class1 and wall-checking callbacks',()=>{
 const a={sourceSlot:2,sourceActorType:3,group:4500,speedClass:4,checksWalls:false,program:null};assert.equal(assertMovingProtectedPassageActor(a),true);for(const m of[{sourceActorType:1,group:500},{program:'n'},{speedClass:3},{checksWalls:true}])assert.throws(()=>assertMovingProtectedPassageActor({...a,...m}));
});
