import test from 'node:test';import assert from 'node:assert/strict';
import {sourceDotPaint,sourceDotLook,sourceSparkEraseRect,SOURCE_UNIVERSE_CLIP,createSourceBackground} from './sliding-bomb-paint.mjs';

test('normal source shadow aliases79 only with exact source image and geometry; bonus shadow is never guessed',()=>{
 const vector={specialDots:{4100:{file:'normal.svg',frames:[{frame:79,sourceImage:0,x:20,y:20,width:10,height:10,sx:0,sy:0}]}}};
 for(let f=9;f<=16;f++)assert.equal(sourceDotPaint(vector,'4100',f).frame,f);assert.throws(()=>sourceDotPaint(vector,'4100',1),/Missing/);
 assert.throws(()=>sourceDotPaint({specialDots:{4100:{file:'wrong.svg',frames:[{...vector.specialDots[4100].frames[0],sourceImage:1}]}}},'4100',9),/Missing/);
});
test('atlas choice follows requested frame, retaining burnt WY/protection availability',()=>{
 const vector={sourceDotShadows:{file:'bonus-shadow.svg',frames:[{frame:1}]},bombDots:{300:{file:'burnt.svg',frames:[{frame:92}]}},specialDots:{300:{file:'special.svg',frames:[{frame:79},{frame:117}]}}};
 assert.equal(sourceDotPaint(vector,'300',92).file,'burnt.svg');assert.equal(sourceDotPaint(vector,'300',79).file,'special.svg');assert.equal(sourceDotPaint(vector,'300',117).file,'special.svg');assert.equal(sourceDotPaint(vector,'4100',1).file,'bonus-shadow.svg');
 assert.deepEqual(sourceDotLook({burnt:true,color:2},{main:{frame:84,visible:true},overlay:{frame:119}}),{frame:84,visible:true});
});
test('ordinary main variants normalize logical anchor into raw descriptor anchor once',()=>{
 const p=sourceDotPaint({dotVariants:{'normal:3':{file:'n.svg',sourceFrame:12,x:-5,y:-4,width:10,height:10}}},'300',12);assert.equal(p.x,11);assert.equal(p.y,11);
 assert.throws(()=>sourceDotPaint({dotVariants:{'normal:3':{file:'wrong.svg',sourceFrame:13,x:-5,y:-4}}},'300',12),/identity/);
});
test('source Slow foreground uses idle and occupied glyphs before burnt appearance',()=>{
 assert.deepEqual(sourceDotLook({slowdown:true,color:1,burnt:true}),{frame:190,visible:true});assert.deepEqual(sourceDotLook({slowdown:true,color:1,sourceSlowFrame:199,sourceCollidable:false}),{frame:199,visible:false});
 const atlas={file:'slow.svg',frames:[{group:300,frame:190,x:11},{group:4100,frame:190,x:20},{group:300,frame:199,x:11}]},v={slowWallDots:atlas};assert.equal(sourceDotPaint(v,'300',190).x,11);assert.equal(sourceDotPaint(v,'4100',190).x,20);assert.equal(sourceDotPaint(v,'300',199).file,'slow.svg');assert.throws(()=>sourceDotPaint(v,'4100',199),/Missing/);
});
test('additional colored ring frames preserve existing atlas frame choices',()=>{
 const v={sourceRingDots:{300:{file:'yellow.svg',frames:[{frame:45}]}},specialDots:{300:{file:'retained.svg',frames:[{frame:44},{frame:51}]}}};assert.equal(sourceDotPaint(v,'300',45).file,'yellow.svg');for(const f of[44,51])assert.equal(sourceDotPaint(v,'300',f).file,'retained.svg');assert.throws(()=>sourceDotPaint(v,'300',46),/Missing/);
});
test('SR erase uses original bounds, signed integer centering and a6x6 destructive fill rectangle',()=>{
 const frames=[{frame:8,x:3,y:2,width:8,height:9},{frame:9,x:2,y:2,width:8,height:9},{frame:10,x:1,y:2,width:8,height:9},{frame:11,x:2,y:2,width:8,height:9}];
 for(let i=0;i<4;i++)assert.deepEqual(sourceSparkEraseRect({descriptorFrame:8+i,rawBase:{x:100,y:200},width:6,height:6},frames),{x:100+[4,3,2,3][i],y:203,width:6,height:6});
 assert.deepEqual(sourceSparkEraseRect({descriptorFrame:1,rawBase:{x:0,y:0},width:6,height:6},[{frame:1,x:-3,y:-2,width:7,height:7}]),{x:-2,y:-1,width:6,height:6});
 // WPCenterWithin truncates the absolute sum, including the translated base.
 assert.deepEqual(sourceSparkEraseRect({descriptorFrame:1,rawBase:{x:100,y:200},width:6,height:6},[{frame:1,x:-3,y:-2,width:7,height:7}]),{x:97,y:198,width:6,height:6});
 assert.deepEqual(sourceSparkEraseRect({descriptorFrame:1,rawBase:{x:-100,y:-200},width:6,height:6},[{frame:1,x:3,y:2,width:7,height:7}]),{x:-96,y:-197,width:6,height:6});
 assert.throws(()=>sourceSparkEraseRect({descriptorFrame:4,rawBase:{x:0,y:0},width:6,height:6},frames),/geometry/);
});
test('persistent background preserves chronological duplicate writes and invalidates by journal reset identity',()=>{
 const ops=[],calls=[],context=new Proxy({},{get:(t,k)=>t[k]??((...a)=>calls.push([k,...a])),set:(t,k,v)=>(t[k]=v,true)}),layer={getContext:()=>context},round={board:{},bombScene:{backgroundPaints:ops}},field={x:68,y:67,width:504,height:363,color:'#828282'};
 const cache=createSourceBackground({createCanvas:()=>layer,seed:()=>calls.push(['seed']),paint:(_,op)=>calls.push([op.kind,op.frame])});cache.draw(round,field);assert.equal(calls.filter(x=>x[0]==='seed').length,1);
 ops.push({kind:'EX',frame:20},{kind:'crater',frame:14},{kind:'DO',frame:92},{kind:'DO',frame:92});cache.draw(round,field);assert.deepEqual(calls.slice(-5,-1),[['EX',20],['crater',14],['DO',92],['DO',92]]);assert.equal(cache.snapshot().applied,4);
 cache.draw(round,field);assert.equal(calls.filter(x=>x[0]==='EX').length,1);
 round.bombScene.backgroundPaints=ops.map(x=>({...x}));cache.draw(round,field);assert.equal(calls.filter(x=>x[0]==='seed').length,2);assert.equal(calls.filter(x=>x[0]==='EX').length,2);
 assert.deepEqual(SOURCE_UNIVERSE_CLIP,{x:28,y:28,width:584,height:424});assert.ok(calls.some(x=>x[0]==='rect'&&x[1]===28&&x[3]===584));
 cache.draw(round,field,{width:1280,height:960});assert.equal(calls.filter(x=>x[0]==='seed').length,3);assert.equal(layer.width,1280);assert.ok(calls.some(x=>x[0]==='setTransform'&&x[1]===2&&x[4]===2));
});
