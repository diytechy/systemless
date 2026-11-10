import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
const hex=n=>n.toString(16).padStart(4,'0');
const options={angularSpeed:Math.PI*2*960/(76*64),allowMovingMarkedOrdinary:true,allowMovingDots:true,allowMarkedTransfers:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true};
function fixture(){
 let offset=8;
 const cells=Array.from({length:88},(_,i)=>{
  const flagsRaw=({12:1,13:0x2081,14:0x2081,15:0x2081,16:5,23:0x6081,24:3,25:0x83})[i]??0,secondaryRaw=i===23?0x11e:15;
  const c={index:i,row:Math.floor(i/11),column:i%11,offset,flagsRaw,secondaryRaw,present:!!(flagsRaw&1),byteLength:4,rawHex:hex(flagsRaw)+hex(secondaryRaw)};
  if(flagsRaw&128){const text='neswp',rawHex='05'+Buffer.from(text).toString('hex');c.inlineProgram={text,offset:offset+4,rawHex,paddingHex:''};c.rawHex+=rawHex;c.byteLength+=rawHex.length/2;}
  offset+=c.byteLength;return c;
 });
 const record=(w)=>{const r={offset,byteLength:w.length*2,rawWords:w,rawHex:w.map(hex).join('')};offset+=r.byteLength;return r;};
 const wp={offset,text:'nsf',paddingHex:'',rawHex:'036e7366',byteLength:4};offset+=4;
 const actor=(type,row,col,ref,clock,walls)=>{const r=record([row,col,type,0,1,ref<0?65535:ref,1,clock,0,15,walls<<8]);return {...r,actorTypeRaw:type,programReferenceRaw:ref,activationMaskRaw:15,version12ByteRaw:walls,initialFrameHalfIndexRaw:0,gridPosition:{row,column:col}};};
 const actors=[actor(0,1,1,-1,0,1),actor(6,1,1,-1,0,1),actor(1,1,2,0,1,0),actor(3,1,4,-1,1,0)];
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,timeLimitRaw:120},cells,blocks:[{kind:'SP',count:1,records:[record([0,0,0,0,0,14])]},{kind:'WP',count:1,records:[wp]},{kind:'WA',count:4,records:actors}]};
}


import {SourceRound} from './round.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
// Invented map and tiny empty synthetic silhouettes; arranged branch states,
// never an original-map trajectory or native appearance claim.
const frame=()=>({left:0,top:0,right:1,bottom:1,flipY:false,outlineIndex:0,rows:[]});
const outlines={groups:Object.fromEntries([700,4300,500,4500].map(g=>[g,{frames:Array.from({length:64},frame)}]))};
const dotOutlines={groups:{300:{frames:Array.from({length:207},frame)}}};
let steps=0;const step=()=>assert.ok(++steps<=1000);
function round(){return new SourceRound(buildDecodedBoard(fixture(),options),{outlines,dotOutlines,deathFactory:()=>({update(){},snapshot(){return [];}})});}
function arrange(g){step();g.actorClasses.latch(2);for(const runtime of g.movingDots.values()){step();runtime.dispatch(1,1);}Object.assign(g.player,{pivot:'2,1',movingPivot:true,frame:0,unwrappedFrame:0,angle:0});}
test('moving marks: death37 at old pose, continued grab, terminal controls',()=>{
 for(const action of ['flip','swing']){
  const g=round();arrange(g);const h=g.player,old=g.point(h),target=g.board.dots.find(d=>d.id==='3,1'),order=[],score=g.childScore.snapshot();
  assert.notDeepEqual({x:target.x,y:target.y},target.sourceInitialPosition);const snapshot=g.actorClasses.snapshot,release=g.onHumanRelease,grab=g.slideGrabHuman;g.pendingReverse=true;g.actorClasses.snapshot=()=>({classes:[{delta:1}]});
  g.deathFactory=(p,a)=>{assert.deepEqual(p,old);assert.equal(a.pivot,'2,1');assert.ok(Object.is(a.direction,0));order.push('death');return {update(){},snapshot(){return [];}};};
  g.onHumanRelease=function(d,a){assert.ok(this.death);assert.equal(a.pivot,'2,1');order.push('release');return release.call(this,d,a);};
  g.slideGrabHuman=function(d,a){assert.equal(a.pivot,target.id);assert.equal(a.frame,32);const p=this.point(a);assert.deepEqual({x:p.x,y:p.y},{x:target.x,y:target.y});order.push('grab');return grab.call(this,d,a);};
  try{step();g.moveMovingHuman(h,action);assert.deepEqual(order,['death','release','grab']);assert.equal(h.pivot,target.id);assert.equal(h.frame,32);assert.ok(Object.is(h.direction,0));assert.equal(g.pendingReverse,false);assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,37);assert.equal(g.events.filter(e=>e.type==='reverse').length,0);assert.deepEqual(g.childScore.snapshot(),score);const transfers=h.transfers;step();g.moveMovingHuman(h,'flip');assert.equal(h.transfers,transfers);assert.equal(g.events.filter(e=>e.type==='death').length,1);assert.ok(Object.is(h.direction,0));}
  finally{g.actorClasses.snapshot=snapshot;g.onHumanRelease=release;g.slideGrabHuman=grab;g.reset();}
 }
});
test('Bounce across moving marks remains nonfatal',()=>{const g=round();arrange(g);const snapshot=g.actorClasses.snapshot;g.actorClasses.snapshot=()=>({classes:[{delta:1}]});try{step();g.moveMovingHuman(g.player,'bounce');assert.equal(g.death,null);assert.equal(g.player.pivot,'2,1');assert.equal(g.player.transfers,0);}finally{g.actorClasses.snapshot=snapshot;g.reset();}});
test('ordinary NPC crosses moving marks without human death',()=>{const g=round(),a=g.enemies[0];Object.assign(a,{frame:63,unwrappedFrame:63,angle:63*Math.PI*2/64,sourcePC:2,direction:1});const order=[];step();const r=advanceStaticEnemyCallback(a,1,{program:a.program,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,allowMovingDots:true,allowMovingMarkedOrdinary:true,movingMarkedOrdinaryScope:g.board,sourceQuery:h=>g.sourceGrabQuery(h,false),afterAnimate(){},onDotRelease:(h,d)=>order.push(['release',d.id]),onDotGrabFirst:(h,d)=>order.push(['grab',d.id]),afterDotGrab(){order.push(['after']);}});assert.equal(r.state.pivot,'3,1');assert.equal(r.state.frame,32);assert.deepEqual(order,[['release','2,1'],['grab','3,1'],['after']]);assert.equal(g.death,null);assert.equal(g.events.filter(e=>e.type==='death').length,0);g.reset();});
