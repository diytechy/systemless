import test from 'node:test';import assert from 'node:assert/strict';
import {assertSlowdownClass4Recipe,assertSlowdownClass4Actor,assertSlowdownClass4Source,assertSlowdownClass4Board} from './slowdown-class4.mjs';
import {compileWallTiles} from './walls.mjs';
import {dotColorOffset} from './dots.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
const recipe={allowSlowdownClass4:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===24?0x4021:1,secondaryRaw:i===24?4111:15}));const actor=(type)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,type===0||type===6?0:4]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(1),actor(3)]},{kind:'SP',count:1,records:[{rawWords:[2,2,2,2,0,15]}]},{kind:'WL',count:1,records:[{rawWords:[256,3,0,0,1,0]}]},{kind:'PU',count:1,records:[{rawWords:[5,3,0,0,8]}]}]};
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
test('normalized class4 board pins source dots, actors and live wall outlines',()=>{
 const s=fixture(),b={slowdownClass4Rules:true,slowdownWallRules:true,staticSlowdownRules:true,activeMask:1,difficulty:'Child',origin:{x:74,y:72},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,staticSlowdownSource:s};
 b.dots=s.cells.map(c=>{const e=c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x26;return{id:`${c.column},${c.row}`,sourceIndex:c.index,x:74+c.column*48,y:72+c.row*48,slowdown:!!(e&32),color:dotColorOffset(c.secondaryRaw),cell:e,bonus:!!(e&2),kind:e&4?'goal':e&2?'bonus':'dot',motion:'static',sourceInBackground:!(e&0x3e)};});
 const actors=s.blocks[0].records.map((r,sourceSlot)=>({sourceSlot,sourceRawRecord:sourceSlot,sourceActorType:r.actorTypeRaw,group:{0:700,6:4300,1:500,3:4500}[r.actorTypeRaw],speedClass:r.rawWords[7],checksWalls:!!r.version12ByteRaw,program:null,pivot:'0,0'}));b.player=actors[0];b.enemies=actors.slice(2);
 b.walls=compileWallTiles([{axis:1,fixed:3,start:0,startInset:0,end:1,endInset:0}]).map(t=>({...t,x:74+t.column*48,y:72+t.row*48}));b.spikes=[{}];
 const frames=n=>({frames:Array.from({length:n},()=>({rows:[]}))}),outlines={groups:Object.fromEntries([700,4300,500,4500].map(g=>[g,frames(64)]))};outlines.groups[200]=frames(4);outlines.groups[800]=frames(20);const dotOutlines={groups:{300:frames(207)}};
 assert.equal(assertSlowdownClass4Board(b,{outlines,dotOutlines}),true);for(const mutate of[x=>x.dots[24].color=0,x=>x.enemies[1].group=4400,x=>x.walls[0].frame=100,x=>x.puddles=[{}],x=>x.slowdownClass4Rules=false]){const c=structuredClone(b);mutate(c);assert.throws(()=>assertSlowdownClass4Board(c,{outlines,dotOutlines}));}
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:{700:frames(64),4300:frames(64),500:frames(64),4500:frames(64),800:frames(20),200:frames(4)}},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('class4 join keeps blue Slow out of the background and inactive Oil absent',()=>{
 const g=round(),d=g.board.dots.find(d=>d.slowdown);assert.equal(g.board.slowdownClass4Rules,true);assert.equal(g.board.slowdownWallRules,true);assert.equal(g.board.puddles.length,0);assert.equal(g.board.movingDotRules,undefined);assert.equal(d.color,4);assert.equal(d.sourceInBackground,false);assert.equal(d.sourceSlowFrame,193);g.onHumanGrab(d);assert.equal(d.sourceSlowFrame,202);g.onHumanRelease(d,g.player);assert.equal(d.sourceSlowFrame,193);assert.equal(g.slowdown.enabled,true);
});
test('class4 slowdown preserves latched counts and remainders while selecting divisor16',()=>{
 const g=round();for(let i=0;i<101;i++)g.update(1/120,{});const before=g.actorClasses.snapshot(),d=g.board.dots.find(d=>d.slowdown);g.onHumanGrab(d);const after=g.actorClasses.snapshot();assert.equal(after.classes[4].divisor,16);assert.equal(after.classes[0].divisor,2);for(const [i,c]of after.classes.entries())assert.deepEqual({...c,divisor:before.classes[i].divisor},before.classes[i]);assert.equal(after.upstreamReference,before.upstreamReference);g.onHumanGrab(g.board.dots.find(d=>!d.slowdown));assert.equal(g.actorClasses.snapshot().classes[4].divisor,8);
});
test('class4 reset restores initial appearance and ordinary spawn without rewinding clocks',()=>{
 const g=round();for(let i=0;i<101;i++)g.update(1/120,{});const d=g.board.dots.find(d=>d.slowdown);g.onHumanGrab(d);const expected=g.actorClasses.snapshot();for(const c of expected.classes)c.divisor=c.normalDivisor;g.reset();assert.deepEqual(g.actorClasses.snapshot(),expected);assert.equal(g.slowdown.enabled,false);assert.equal(g.board.dots.find(d=>d.slowdown).sourceSlowFrame,193);
});
