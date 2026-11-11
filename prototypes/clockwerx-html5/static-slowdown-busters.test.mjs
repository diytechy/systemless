import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticSlowdownBusterRecipe,assertStaticSlowdownBusterActor,assertStaticSlowdownBusterSource} from './static-slowdown-busters.mjs';
const recipe={allowStaticSlowdownBusters:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','Bombs','BombObjectInteractions','SlidingConnectors','FreeBusters','RotatingSpikes','Class3RotatingSpikes','RotatingSpikeTransfers','StaticEnemyWalls','ImportedGoodie169'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===24?0x4021:i===40?9:1,secondaryRaw:15}));
 const actor=(type,cl=1,checks=0,ref=0)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:ref,version12ByteRaw:checks,rawWords:[0,0,type,24,1,ref<0?65535:ref,1,cl,0,1,checks*256]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:6,records:[actor(0,0,1,-1),actor(6,0,1,-1),actor(5),actor(4),actor(4,3),actor(1,1,1,-1)]},{kind:'WP',count:1,records:[{text:'ns'}]},{kind:'EX',count:1,records:[{rawWords:[2,0,0]}]},{kind:'WL',count:1,records:[{rawWords:[0,2,4,0,10,0]}]},{kind:'SP',count:1,records:[{rawWords:[3,3,0,2,0,15]}]},{kind:'BO',count:2,records:[{rawWords:[6,0,10,82]},{rawWords:[6,1,0,82]}]},{kind:'GO',count:2,records:[{rawWords:[4,0,0,0,15]},{rawWords:[4,1,169,0,3]}]}]};
}
test('static Slow buster recipe requires real 169/bomb/rail/orbital capabilities and rejects borrowed movers',()=>{
 assert.equal(assertStaticSlowdownBusterRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertStaticSlowdownBusterRecipe({...recipe,[k]:false}));for(const k of['allowMovingDots','allowMovingProgrammedBusters','allowElevators','allowSlowdownWaystation','allowCombinedGoalBonus'])assert.throws(()=>assertStaticSlowdownBusterRecipe({...recipe,[k]:true}));
});
test('static Slow actor admission separates source programmed busters, orbital clocks and free wall checking',()=>{
 const b={sourceSlot:2,sourceActorType:5,group:3900,speedClass:1,checksWalls:false,program:'ns',sourcePC:1};assert.equal(assertStaticSlowdownBusterActor(b),true);assert.equal(assertStaticSlowdownBusterActor({...b,sourceActorType:4,group:3500,speedClass:3}),true);assert.equal(assertStaticSlowdownBusterActor({...b,sourceActorType:1,group:500,checksWalls:true,program:null}),true);for(const m of[{program:null},{program:'b'},{speedClass:3},{checksWalls:true},{sourcePC:0}])assert.throws(()=>assertStaticSlowdownBusterActor({...b,...m}));
});
test('static Slow source guard admits the explicit mixed source without mutating mask or geometry',()=>{
 const s=fixture(),before=JSON.stringify(s);assert.equal(assertStaticSlowdownBusterSource(s),true);assert.equal(JSON.stringify(s),before);
 for(const mutate of[x=>x.cells[24].secondaryRaw=271,x=>x.blocks[0].records[2].rawWords[7]=3,x=>x.blocks[0].records[4].programReferenceRaw=-1,x=>x.blocks[2].records[0].rawWords[2]=512,x=>x.blocks[6].records[1].rawWords[2]=1,x=>x.cells[40].flagsRaw=0x89]){const c=structuredClone(s);mutate(c);assert.throws(()=>assertStaticSlowdownBusterSource(c));}
});
