import test from 'node:test';import assert from 'node:assert/strict';
import {createMovingDot,movingInstruction,positionMovingRiders,MOVING_RIDER_ORDER,effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {querySourceGrab,queryIndexedSourceGrab,grabSourceActor} from './source-grab.mjs';
const spec=(program='enpsw')=>({id:'mover',sourceIndex:0,row:0,column:0,originalPixel:{x:0,y:0},program});
const make=(program,onRiders=()=>{})=>createMovingDot(spec(program),{allowMovingDots:true,classCount:0,onRiders});
const dot=(sourceIndex,x,y,extra={})=>({id:'dot'+sourceIndex,sourceIndex,row:Math.floor(sourceIndex/11),column:sourceIndex%11,present:true,humanCanGrab:true,nonhumanCanGrab:true,motionType:0,currentPixel:{x,y},intermediate:{valid:false},...extra});
const options={allowMovingQueries:true,offset:{row:0,column:1},human:true,movingOrigin:false,originPixel:{x:0,y:0}};

test('mode mask miss preserves source presence, colors and inline motion while clearing optional specials',()=>{
 const raw=0x2000|0x80|0x40|0x20|0x8|0x4|0x2|0x300|1;
 assert.equal(effectiveMovingCell(raw,1),raw);assert.equal(effectiveMovingCell(raw,2),0x81);
 assert.throws(()=>effectiveMovingCell(raw,2,0));
});

test('first rich composition bounds a closed repeated cycle without changing primitive opcode semantics',()=>{
 assert.equal(assertClosedMovingProgram('nepsw',{x:0,y:0}),true);assert.throws(()=>assertClosedMovingProgram('nep',{x:0,y:0}),/closed/);assert.throws(()=>assertClosedMovingProgram('ew',{x:32760,y:0}),/word/);
 const m=make('e');m.dispatch(1,1);assert.equal(m.snapshot().mainPixel.x,3,'low-level primitive still implements a finite nonclosing source prefix');
});

test('inline Pascal source bytes, arbitrary alignment padding and decoder offsets must agree',()=>{
 const c={offset:20,flagsRaw:0x4081,secondaryRaw:15,byteLength:8,rawHex:'4081000f026e70da',inlineProgram:{offset:24,text:'np',rawHex:'026e70da',paddingHex:'da'}};
 assert.equal(movingProgramCell(c).text,'np');
 for(const edit of [d=>d.inlineProgram.text='ne',d=>d.inlineProgram.offset++,d=>d.rawHex='4081000f026e7000',d=>d.inlineProgram.paddingHex='',d=>d.byteLength--]){const d=structuredClone(c);edit(d);assert.throws(()=>movingProgramCell(d));}
 const odd={...c,byteLength:6,rawHex:'4081000f016e',inlineProgram:{offset:24,text:'n',rawHex:'016e',paddingHex:''}};assert.equal(movingProgramCell(odd).text,'n');
});

test('moving and query primitives are default off; source identity/opcode/cache boundaries reject malformed declarations',()=>{
 assert.throws(()=>createMovingDot(spec(),{onRiders:()=>{}}),/capability/);
 for(const change of [{sourceIndex:88},{sourceIndex:1},{program:''},{program:'x'},{program:'p'.repeat(128)},{originalPixel:{x:0.5,y:0}}])assert.throws(()=>createMovingDot({...spec(),...change},{allowMovingDots:true,onRiders:()=>{}}));
 assert.throws(()=>querySourceGrab([dot(0,0,0)],{...options,allowMovingQueries:false}),/capability/);
 assert.throws(()=>querySourceGrab([dot(1,0,0),dot(0,48,0)],options),/Ordered/);
 assert.throws(()=>querySourceGrab([dot(0,0,0,{intermediate:{valid:1,moving:true,pixel:{x:0,y:0}}})],options),/cache-valid/);
 assert.deepEqual(movingInstruction('?'),{opcode:'?',active:false,velocity:{x:0,y:0}});
});

test('source3px velocities,16-callback p wait, immediate first planning and one-based PC wrap',()=>{
 const log=[],m=make('enpsw',(id,p,s)=>log.push([id,p,s.progress,s.sourcePC]));let c=0;
 assert.equal(m.snapshot().sourcePC,2);assert.equal(m.snapshot().opcode,'e');assert.equal(log.length,1);
 const instruction=()=>{for(let i=0;i<16;i++)m.dispatch(++c,1);return m.snapshot();};
 assert.deepEqual(instruction().mainPixel,{x:48,y:0});assert.deepEqual(instruction().mainPixel,{x:48,y:-48});const before=log.length;
 assert.deepEqual(instruction().mainPixel,{x:48,y:-48});assert.equal(log.length,before,'p is sixteen callbacks without rider translation');
 assert.deepEqual(instruction().mainPixel,{x:48,y:0});const end=instruction();assert.deepEqual(end.mainPixel,{x:0,y:0});assert.equal(end.opcode,'e');assert.equal(end.sourcePC,2);assert.equal(end.progress,0);
 assert.deepEqual(log[16],[0,{x:48,y:0},16,2],'last moving callback positions riders before planning the next byte');
});

test('dispatched delta0/1 use one callback, delta2/255 use exactly two with the intermediate cache',()=>{
 const m=make('ew');assert.equal(m.dispatch(0,255).callbacks,0);
 assert.equal(m.dispatch(1,0).callbacks,1);assert.equal(m.snapshot().mainPixel.x,3);
 assert.equal(m.dispatch(2,1).callbacks,1);assert.equal(m.snapshot().mainPixel.x,6);assert.equal(m.snapshot().intermediate.valid,false);
 assert.equal(m.dispatch(3,2).callbacks,2);assert.deepEqual(m.snapshot().intermediate,{valid:true,moving:true,pixel:{x:9,y:0}});assert.equal(m.snapshot().mainPixel.x,12);
 assert.equal(m.dispatch(100,255).callbacks,2);assert.equal(m.snapshot().mainPixel.x,18);m.dispatch(101,1);assert.equal(m.snapshot().intermediate.valid,false);
});

test('reset restores program/main/shadow and latches current count, while retaining source cached bytes',()=>{
 const calls=[],m=make('ew',(id,p)=>calls.push(p));m.dispatch(3,2);const cache=m.snapshot().intermediate;
 const reset=m.reset(10);assert.deepEqual(reset.mainPixel,{x:0,y:0});assert.deepEqual(reset.shadowPixel,{x:0,y:0});assert.equal(reset.sourcePC,2);assert.equal(reset.clockReference,10);assert.deepEqual(reset.intermediate,cache);assert.equal(calls.length,4);
 assert.equal(m.dispatch(10,5).callbacks,0);assert.throws(()=>m.reset(9),/rewind/);m.dispatch(11,1);assert.equal(m.snapshot().intermediate.valid,false);
});

test('rider dispatcher is WA→HY→DO→DP→PU→DE, synchronous once per active inner translation',()=>{
 const log=[],handlers=Object.fromEntries(MOVING_RIDER_ORDER.map(k=>[k,(id,p,o)=>log.push([k,id,p.x,o.skipSpecialMisc])]));
 const m=make('ew',(id,p)=>positionMovingRiders(handlers,id,p));log.length=0;m.dispatch(2,2);
 assert.deepEqual(log.map(x=>[x[0],x[2]]),MOVING_RIDER_ORDER.map(k=>[k,3]).concat(MOVING_RIDER_ORDER.map(k=>[k,6])));assert.equal(log.every(x=>x[1]===0&&x[3]===false),true);
 assert.throws(()=>positionMovingRiders({...handlers,DP:async()=>{}},0,{x:0,y:0}),/Synchronous/);
});

test('moving origin/candidate gives inclusive±6; static and up/down otherwise require exact current point',()=>{
 for(const motionType of [0,2])assert.equal(querySourceGrab([dot(0,54,6,{motionType})],options).allowed,false);
 const moving=dot(0,54,6,{motionType:1});assert.equal(querySourceGrab([moving],options).allowed,true);
 moving.currentPixel.x=55;assert.equal(querySourceGrab([moving],options).allowed,false);
 assert.equal(querySourceGrab([dot(0,54,6)],{...options,movingOrigin:true}).allowed,true);
 assert.equal(querySourceGrab([dot(0,48,0,{motionType:2})],options).allowed,true);
});

test('first positional slot wins before permission, and denied real dots never enter EX fallback',()=>{
 const ds=[dot(0,48,0,{humanCanGrab:false}),dot(1,48,0)];const copy=structuredClone(ds),r=querySourceGrab(ds,options);
 assert.equal(r.allowed,false);assert.equal(r.grab.sourceIndex,0);assert.deepEqual(ds,copy);
 assert.equal(querySourceGrab(ds,{...options,human:false}).allowed,true);
});

test('indexed wrapper retries cached origin/candidates even after current permission denial',()=>{
 const ds=[dot(0,0,0,{motionType:1,intermediate:{valid:true,moving:true,pixel:{x:3,y:0}}}),dot(1,48,0,{humanCanGrab:false}),dot(2,400,400,{motionType:1,intermediate:{valid:true,moving:true,pixel:{x:51,y:0}}})];
 const r=queryIndexedSourceGrab(ds,{...options,originIndex:0});assert.equal(r.allowed,true);assert.equal(r.grab.sourceIndex,2);assert.equal(r.pass,'intermediate');assert.deepEqual(r.passes.map(p=>[p.allowed,p.grab?.sourceIndex]),[[false,1],[true,2]]);
 ds[2].intermediate.valid=false;const failed=queryIndexedSourceGrab(ds,{...options,originIndex:0});assert.equal(failed.allowed,false);assert.equal(failed.grab,null);
});

test('typed rail pickup uses real-dot precedence,source EX order and±3; nonhuman or nonmoving origin cannot fall back',()=>{
 const ds=[dot(0,24,45,{motionType:1}),dot(12,48,48),dot(13,96,48)],connectors=[{id:0,first:'dot12',second:'dot13',vertical:false},{id:1,first:'dot12',second:'dot13',vertical:false}],o={...options,originPixel:{x:24,y:45},movingOrigin:true,connectors};
 const rail=querySourceGrab(ds,o);assert.equal(rail.allowed,true);assert.deepEqual(rail.grab,{realDot:false,dot:'dot12',sourceIndex:12,connector:0,queryPixel:{x:72,y:45}});
 assert.equal(querySourceGrab(ds,{...o,originPixel:{x:24,y:44}}).allowed,false);assert.equal(querySourceGrab(ds,{...o,human:false}).allowed,false);assert.equal(querySourceGrab(ds,{...o,movingOrigin:false}).allowed,false,'already-sliding caller supplies movingOrigin=false');
 const denied=[ds[0],dot(1,72,45,{humanCanGrab:false}),...ds.slice(1)],r=querySourceGrab(denied,o);assert.equal(r.allowed,false);assert.equal(r.grab.realDot,true);assert.equal(r.grab.sourceIndex,1);
 const bad=structuredClone(ds);bad[1].motionType=1;assert.throws(()=>querySourceGrab(bad,o),/static source EX/);
});

test('WAGrab releases, assigns, adds32, positions and grabs in source order; real-dot pickup clears a slide',()=>{
 const ds=[dot(0,12,15,{motionType:1}),dot(1,60,15)],actor={sourceActorType:0,sourceSlot:0,speedClass:0,pivot:'dot0',frame:0,unwrappedFrame:64,direction:1,sliding:true,sourcePC:1},result={allowed:true,grab:{realDot:true,dot:'dot1',sourceIndex:1,connector:null}},log=[];
 grabSourceActor(actor,result,{allowMovingQueries:true,dots:ds,physicalPoint:{x:12,y:15},release:(d,a)=>log.push(['release',d.id,a.pivot,a.frame]),place:(a,p)=>log.push(['place',a.pivot,a.frame,p]),onTransfer:e=>log.push(['diagnostic',e.from,e.to]),grab:(d,a)=>log.push(['grab',d.id,a.sliding,a.frame])});
 assert.deepEqual(log,[['release','dot0','dot0',0],['place','dot1',32,{x:60,y:15}],['diagnostic','dot0','dot1'],['grab','dot1',false,32]]);assert.equal(actor.unwrappedFrame,96);assert.equal(actor.sourcePC,1);
});

test('rail WAGrab uses signed old-sprite difference/3, preserves unquantized entry placement and source direction table',()=>{
 for(const vertical of [false,true])for(const frameAfter of [0,16,32,48])for(const direction of [-1,1]){
  const ds=[dot(0,73,73,{motionType:1}),dot(12,48,48),dot(vertical?23:13,vertical?48:96,vertical?96:48)],connector={id:0,first:'dot12',second:ds[2].id,vertical},before=vertical?{x:10,y:73}:{x:73,y:10},pre=(frameAfter+32)&63,actor={sourceActorType:0,sourceSlot:0,speedClass:0,pivot:'dot0',frame:pre,unwrappedFrame:pre,direction,sourcePC:1},result={allowed:true,grab:{realDot:false,dot:'dot12',sourceIndex:12,connector:0}},log=[];
  const expected=vertical?((frameAfter===0&&direction===-1||frameAfter===32&&direction===1)?-1:1):((frameAfter===16&&direction===-1||frameAfter===48&&direction===1)?1:-1);
  grabSourceActor(actor,result,{allowMovingQueries:true,dots:ds,connectors:[connector],physicalPoint:before,release:()=>{},place:(a,p)=>log.push(p),grab:(d,a)=>{assert.equal(a.sliding,true);assert.equal(a.frame,frameAfter);}});
  assert.equal(actor.slideProgress,8);assert.equal(actor.slideDelta,expected);assert.deepEqual(log,[vertical?{x:48,y:73}:{x:73,y:48}]);assert.deepEqual({x:actor.slideX,y:actor.slideY},vertical?{x:48,y:72}:{x:72,y:48});assert.equal(actor.pivot,'dot12');
 }
 const ds=[dot(0,44,10,{motionType:1}),dot(12,48,48),dot(13,96,48)],a={sourceActorType:0,sourceSlot:0,speedClass:0,pivot:'dot0',frame:48,unwrappedFrame:48,direction:1};
 grabSourceActor(a,{allowed:true,grab:{realDot:false,dot:'dot12',sourceIndex:12,connector:0}},{allowMovingQueries:true,dots:ds,connectors:[{id:0,first:'dot12',second:'dot13',vertical:false}],physicalPoint:{x:44,y:10},release:()=>{},place:()=>{},grab:()=>{}});assert.equal(a.slideProgress,-1,'signed division truncates towardzero, not floor');
});
