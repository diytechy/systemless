import test from 'node:test';import assert from 'node:assert/strict';
import {assertSlowdownWaystationRecipe,assertSlowdownWaystationActor,assertSlowdownWaystationSource,assertSlowdownWaystationBoard} from './slowdown-waystation.mjs';
import {compileWallTiles} from './walls.mjs';import {dotColorOffset} from './dots.mjs';
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
test('normalized slowdown checkpoint guard binds source checkpoint spawn and ordinary clocks without mutation',()=>{
 const s=fixture(),b={slowdownWaystationRules:true,slowdownWallRules:true,staticSlowdownRules:true,activeMask:1,difficulty:'Child',origin:{x:74,y:72},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,staticSlowdownSource:s,spikes:[]};
 b.dots=s.cells.map(c=>({id:`${c.column},${c.row}`,sourceIndex:c.index,x:74+c.column*48,y:72+c.row*48,slowdown:!!(c.flagsRaw&32),color:dotColorOffset(c.secondaryRaw),cell:c.flagsRaw,bonus:!!(c.flagsRaw&2),kind:c.flagsRaw&4?'goal':c.flagsRaw&2?'bonus':'dot',motion:'static',sourceInBackground:!(c.flagsRaw&0x3e),...(c.index===56?{waystation:{halfIndex:24,direction:-1}}:{})}));
 const a=s.blocks[0].records.map((r,sourceSlot)=>({sourceSlot,sourceRawRecord:sourceSlot,sourceActorType:r.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[r.actorTypeRaw],speedClass:r.rawWords[7],checksWalls:!!r.version12ByteRaw,program:sourceSlot<2?null:'ns',sourcePC:1,pivot:'0,0'}));b.player=a[0];b.enemies=a.slice(2);b.walls=compileWallTiles([{axis:0,fixed:2,start:4,startInset:0,end:10,endInset:0}]).map((t,id)=>({id,...t,x:74+t.column*48,y:72+t.row*48}));
 const before=JSON.stringify(b);assert.equal(assertSlowdownWaystationBoard(b),true);assert.equal(JSON.stringify(b),before);for(const mutate of[x=>x.dots[56].waystation.direction=1,x=>x.enemies[2].speedClass=1,x=>x.walls[0].frame++,x=>x.dots[24].color=4]){const c=structuredClone(b);mutate(c);assert.throws(()=>assertSlowdownWaystationBoard(c));}
});
