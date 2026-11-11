import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticSlowdownRecipe,assertStaticSlowdownActor,assertStaticSlowdownSource} from './static-slowdown.mjs';
const recipe={allowStaticSlowdown:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','RotatingSpikes','RotatingSpikeTransfers'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?0x4021:1,secondaryRaw:15}));
 const actor=(type,cl=0,ref=-1)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,ref<0?65535:ref,1,cl]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:5,records:[actor(0),actor(6),actor(2,5,0),actor(3,1,0),actor(4,1,1)]},{kind:'WP',count:2,records:[{text:'bfns'},{text:'ns'}]},{kind:'SP',count:1,records:[{rawWords:[2,2,2,2,0,15]}]}]};
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
