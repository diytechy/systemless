import test from 'node:test';import assert from 'node:assert/strict';
import {fatalMarkedGrab,markedGrabPrelude,assertMovingMarkedGoalScope} from './marked-transfers.mjs';
import {grabSourceActor,queryIndexedSourceGrab,querySourceGrab} from './source-grab.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {createGoalMisc} from './special-dots.mjs';import {SourceRound} from './round.mjs';
import {sourceDotLook,sourceGoalPaint,sourceDotPaint,createSourceBackground} from './sliding-bomb-paint.mjs';

// Invented source-contract fixture. No private map, programs, art or paths.
export function markedFixture(){
 const point=(c,r)=>({x:74+48*c,y:72+48*r});
 const dot=(c,r,e={})=>({id:`${c},${r}`,sourceIndex:r*11+c,column:c,row:r,...point(c,r),sourceInitialPosition:point(c,r),cell:1,present:true,kind:'dot',bonus:false,color:0,transferDeath:false,protected:false,ring:false,teleport:false,slideMask:0,motion:'static',motionType:0,sourceInBackground:true,sourceCollidable:true,humanCanGrab:true,nonhumanCanGrab:true,...e});
 const dots=[dot(0,0,{cell:0x81,motion:'moving-program',motionType:1,movingProgram:'epwp',sourceInBackground:false}),dot(1,0,{cell:0x85,motion:'moving-program',motionType:1,movingProgram:'epwp',sourceInBackground:false,kind:'goal'}),dot(0,1,{cell:0x2001,transferDeath:true,color:2}),dot(1,1,{cell:0x2001,transferDeath:true,color:3}),dot(0,2),dot(1,2,{cell:3,kind:'bonus',bonus:true,sourceInBackground:false}),dot(2,2)];
 const player={name:'player',sourceSlot:0,sourceActorType:0,speedClass:0,group:700,pivot:'0,2',frame:0,unwrappedFrame:0,canonicalFrame:true,angle:0,direction:1,program:null,visible:true,orphaned:false,checksWalls:true};
 const enemy={name:'ordinary',sourceSlot:2,sourceActorType:3,speedClass:1,group:4500,pivot:'2,2',frame:16,unwrappedFrame:16,canonicalFrame:true,angle:Math.PI/2,direction:1,program:'nsf',sourcePC:1,visible:true,orphaned:false,checksWalls:false};
 const board={ordinal:0,title:'Invented marked/moving goal',origin:{x:74,y:72},radius:48,distanceTolerance:1,angularSpeed:1,timeLimit:90,difficulty:'Child',player,enemies:[enemy],demos:[],dots,spikes:[],bombs:[],goodies:[],connectors:[],walls:[],doors:[],switches:[],puddles:[],elevators:[],teleports:[],movingHumanStarts:['0,2','0,2'],movingDotRules:true,markedTransferRules:true,movingMarkedGoalRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true};
 const shape={left:0,top:0,right:1,bottom:1,rows:null},frames=n=>Array.from({length:n},()=>({...shape})),options={outlines:{groups:{700:{frames:frames(64)},4500:{frames:frames(64)}}},dotOutlines:{groups:{300:{frames:frames(125)}}},deathFactory:()=>({update(){},complete:false,snapshot(){return []}})};
 return {board,options,create:()=>new SourceRound(board,options)};
}
const queryDots=ds=>ds.map(d=>({...d,currentPixel:{x:d.x,y:d.y},intermediate:{valid:false}}));
const scope=b=>({...b,actors:[b.player,...b.enemies],allowMarkedTransfers:true});

test('marked predicate is default off and only both-marked real human WAGrab is fatal',()=>{
 assert.throws(()=>fatalMarkedGrab({sourceActorType:0},{transferDeath:true},{transferDeath:true},{realDot:true}));
 for(const kind of[0,6,1,2,3])for(const realDot of[false,true])for(const old of[false,true])for(const target of[false,true])assert.equal(fatalMarkedGrab({sourceActorType:kind},{transferDeath:old},{transferDeath:target},{realDot},{allowMarkedTransfers:true}),[0,6].includes(kind)&&realDot&&old&&target);
});
test('marked WAGrab latches terminal37 at old pose then still releases/assigns/+32/places/grabs',()=>{
 const f=markedFixture(),ds=queryDots(f.board.dots),a={...f.board.player,pivot:'0,1',frame:0,unwrappedFrame:64},log=[],result={allowed:true,grab:{realDot:true,dot:'1,1',sourceIndex:12,connector:null}};
 grabSourceActor(a,result,{allowMovingQueries:true,allowMarkedTransfers:true,dots:ds,physicalPoint:{x:74,y:120},onMarkedDeath:(cause,h)=>log.push(['death',cause.sourceReason,h.pivot,h.frame,h.direction]),release:(d,h)=>log.push(['release',d.id,h.pivot,h.direction]),place:(h,p)=>log.push(['place',h.pivot,h.frame,p]),onTransfer:e=>log.push(['event',e.to]),grab:(d,h)=>log.push(['grab',d.id,h.direction])});
 assert.deepEqual(log,[['death',37,'0,1',0,0],['release','0,1','0,1',0],['place','1,1',32,{x:122,y:120}],['event','1,1'],['grab','1,1',0]]);assert.equal(a.unwrappedFrame,96);assert.equal(a.sourceTerminalReason,37);
});
test('missing or async marked death adapters reject before terminal mutation and old helper remains fail closed',()=>{
 const f=markedFixture(),old=f.board.dots[2],target=f.board.dots[3];
 for(const onDeath of[undefined,async()=>{}]){const a={...f.board.player};assert.throws(()=>markedGrabPrelude(a,old,target,{realDot:true},{allowMarkedTransfers:true,onDeath}));assert.equal(a.direction,1);}
 assert.throws(()=>grabSourceActor({...f.board.player,pivot:old.id},{allowed:true,grab:{realDot:true,dot:target.id,sourceIndex:12}},{dots:queryDots(f.board.dots),allowMovingQueries:true,physicalPoint:{x:74,y:120},release(){},place(){},grab(){}}));
});
test('marked normalized scope checks actual empty families, original grid, live kind and source actor closure',()=>{
 assert.equal(assertMovingMarkedGoalScope(scope(markedFixture().board)),true);
 for(const edit of[b=>b.spikes.push({}),b=>delete b.connectors,b=>{b.dots[0].x+=3;b.dots[0].sourceInitialPosition.x+=3;},b=>b.dots[2].transferDeath=false,b=>b.dots[2].bonus=true,b=>b.dots[4].kind='other',b=>b.dots[4].sourceCollidable=false,b=>b.enemies[0].speedClass=2,b=>b.enemies[0].sourceActorType=4,b=>b.dots[2].motion='moving-program']){const f=markedFixture();edit(f.board);assert.throws(f.create);}
 assert.throws(()=>assertMovingMarkedGoalScope({...scope(markedFixture().board),activeSections:{BO:1}}));
});
test('new family is default off independently of the previously qualified moving BO family',()=>{
 for(const key of['movingDotRules','markedTransferRules','movingMarkedGoalRules']){const f=markedFixture();f.board[key]=false;assert.throws(f.create);}
 const f=markedFixture();f.board.movingBombRules=true;assert.throws(f.create);
});
test('source goal misc starts17, wraps22, coalesces changed count and preserves original variable DTO geometry',()=>{
 assert.throws(()=>createGoalMisc({rawBase:{x:0,y:0}}));const m=createGoalMisc({allowGoalMisc:true,clockCount:7,rawBase:{x:10,y:20}});
 assert.equal(m.snapshot().frame,17);m.observeClock(7);assert.equal(m.snapshot().frame,17);m.observeClock(100);assert.equal(m.snapshot().frame,18);for(let n=101;n<=105;n++)m.observeClock(n);assert.equal(m.snapshot().frame,17);m.position({x:16,y:20});assert.deepEqual(m.snapshot().rawBase,{x:16,y:20});assert.throws(()=>m.observeClock(99));
 const vector={sourceGoalMisc:{file:'invented.svg',frames:[17,18,19,20,21,22].map(frame=>{const size=frame===19||frame===21?16:frame===20?14:18,offset=(32-size)/2;return {frame,sourceGroup:300,sourceFrame:frame,x:offset,y:offset,width:size,height:size,sx:0,sy:0};})}};
 for(let frame=17;frame<=22;frame++)assert.equal(sourceGoalPaint(vector,frame).frame,frame);vector.sourceGoalMisc.frames[2].x=7;assert.throws(()=>sourceGoalPaint(vector,19));assert.throws(()=>sourceGoalPaint({goal:{file:'legacy.svg'}},17));
});
test('moving goal rider updates physical base synchronously while the goal frame uses its own50 counter',()=>{
 const g=markedFixture().create(),goal=g.movingDots.get('1,0'),before=g.dotAnimations.renderState('1,0').goal;goal.dispatch(2,2);const after=g.dotAnimations.renderState('1,0').goal;
 assert.equal(after.frame,17);assert.equal(after.rawBase.x,before.rawBase.x+6);assert.equal(after.rawBase.y,before.rawBase.y);
 g.dotAnimations.observeDotClocks('1,0',{dotCount:0,overlayCount:50,guestTick:1});assert.equal(g.dotAnimations.renderState('1,0').goal.frame,18);assert.equal(goal.snapshot().progress,2);
});
test('ordinary reset restores moving goal before initial grab, retains goal frame/reference and recreates only journal identity',()=>{
 const g=markedFixture().create();for(let n=0;n<400;n++)g.update(1/120,{});const saved=g.dotAnimations.renderState('1,0').goal,oldJournal=g.sourcePaint.backgroundPaints,count=g.actorClasses.snapshot().classes[1].count;
 const grab=g.onHumanGrab.bind(g);let atGrab;g.onHumanGrab=d=>{atGrab=g.dotAnimations.renderState('1,0').goal;return grab(d);};g.reset();
 assert.equal(atGrab.frame,saved.frame);assert.equal(atGrab.reference,saved.reference);assert.deepEqual(atGrab.rawBase,{x:106,y:57});assert.notEqual(g.sourcePaint.backgroundPaints,oldJournal);assert.equal(g.actorClasses.snapshot().classes[1].count,count);assert.equal(g.movingDots.get('1,0').snapshot().sourcePC,2);
});
test('synthetic fatal marked round keeps death origin old but target/frame changes and later score is suppressed',()=>{
 const f=markedFixture(),g=f.create();for(let n=0;n<30&&!g.actorClasses.snapshot().classes[0].delta;n++)g.update(1/120,{});
 Object.assign(g.player,{pivot:'0,1',frame:0,unwrappedFrame:0,angle:0,direction:1,sourceBlockedTarget:null});let deathPose;g.deathFactory=(p,h)=>{deathPose={pivot:p.id,x:p.x,y:p.y,frame:h.frame,direction:h.direction};return {update(){},complete:false,snapshot(){return []}};};g.moveMovingHuman(g.player,'flip');
 assert.deepEqual(deathPose,{pivot:'0,1',x:74,y:120,frame:0,direction:0});assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,37);assert.equal(g.player.pivot,'1,1');assert.equal(g.player.frame,32);assert.equal(g.player.direction,0);assert.equal(g.complete,false);assert.equal(g.childScore.roundBonus,0);assert.deepEqual(g.events.slice(-2).map(e=>e.type),['death','flip']);g.reset();assert.equal(g.player.direction,1);assert.equal(g.player.sourceTerminalReason,undefined);
});
test('synthetic Bounce does not call marked WAGrab or latch death',()=>{
 const g=markedFixture().create();for(let n=0;n<30&&!g.actorClasses.snapshot().classes[0].delta;n++)g.update(1/120,{});Object.assign(g.player,{pivot:'0,1',frame:0,unwrappedFrame:0,angle:0,direction:1,sourceBlockedTarget:null});g.moveMovingHuman(g.player,'bounce');assert.equal(g.death,null);assert.equal(g.player.pivot,'0,1');assert.equal(g.player.direction,-1);assert.equal(g.events.at(-1).type,'bounce');
});

test('synthetic simultaneous pending Reverse continues after marked Grab without reviving its source angular zero',()=>{
 const g=markedFixture().create();for(let n=0;n<30&&!g.actorClasses.snapshot().classes[0].delta;n++)g.update(1/120,{});
 Object.assign(g.player,{pivot:'0,1',frame:0,unwrappedFrame:0,angle:0,direction:1,sourceBlockedTarget:null});g.pendingReverse=true;g.moveMovingHuman(g.player,'flip');
 assert.equal(g.player.sourceTerminalReason,37);assert.equal(Math.abs(g.player.direction),0);assert.equal(g.player.frame,32);assert.equal(g.player.pivot,'1,1');assert.equal(g.pendingReverse,false);assert.deepEqual(g.events.slice(-3).map(e=>e.type),['death','flip','reverse']);assert.equal(g.childScore.roundBonus,0);assert.equal(g.complete,false);
});
test('NPC source n/s/f program may acquire a marked dot without human terminal predicate',()=>{
 const f=markedFixture(),dots=f.board.dots,s={...f.board.enemies[0],pivot:'0,1',frame:63,unwrappedFrame:63,program:'s',sourcePC:1};
 const r=advanceStaticEnemyCallback(s,1,{program:'s',dots,guestTick:1,adjustPeriod:n=>n,afterAnimate(){},onDotRelease(){},onDotGrabFirst(){},afterDotGrab(){},allowMovingDots:true,allowMovingMarkedGoals:true,sourceQuery:a=>queryIndexedSourceGrab(queryDots(dots),{originIndex:dots.find(d=>d.id===a.pivot).sourceIndex,offset:{row:0,column:1},human:false,allowMovingQueries:true})});
 assert.equal(r.state.pivot,'1,1');assert.equal(r.state.frame,32);assert.equal(Math.abs(r.state.direction),1);assert.ok(r.events.some(e=>e.type==='program-transfer'));
});
test('marked source look and explicit atlas selection preserve opaque main/shadow DTO identities',()=>{
 const d={color:3,transferDeath:true,bonus:false,sourceCollidable:true};assert.equal(sourceDotLook(d).frame,111);assert.equal(sourceDotLook({...d,burnt:true}).frame,95);assert.equal(sourceDotLook(d,{main:{frame:79,visible:true}}).frame,79);
 const vector={sourceMarkedDots:{300:{file:'main.svg',frames:[{frame:111,x:11,y:11,width:10,height:10}]},4100:{file:'shadow.svg',frames:[{frame:111,sourceImage:22,x:20,y:20,width:10,height:10}]}}};assert.equal(sourceDotPaint(vector,'4100',111).sourceImage,22);assert.equal(sourceDotPaint(vector,'300',111).file,'main.svg');
});
test('nonBO source background uses explicit empty journal and reseeds on reset array identity',()=>{
 const log=[],ctx={setTransform(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){}};const layer=createSourceBackground({createCanvas:()=>({getContext:()=>ctx}),seed:()=>log.push('seed'),paint:(_,p)=>log.push(p.kind)}),g={board:{},sourcePaint:{backgroundPaints:[]}},field={x:0,y:0,width:10,height:10,color:'#828282'};
 layer.draw(g,field);layer.draw(g,field);assert.deepEqual(log,['seed']);g.sourcePaint.backgroundPaints=[];layer.draw(g,field);assert.deepEqual(log,['seed','seed']);
});

test('direct terminal helper cannot admit forged or already-terminal source actors',()=>{
 const f=markedFixture(),old=f.board.dots[2],target=f.board.dots[3];for(const change of[{sourceSlot:31},{direction:0},{unwrappedFrame:1},{sourceActorType:4},{speedClass:1}]){const a={...f.board.player,...change};assert.throws(()=>markedGrabPrelude(a,old,target,{realDot:true},{allowMarkedTransfers:true,onDeath(){}}));}
 const npc={...f.board.enemies[0],speedClass:2};assert.throws(()=>markedGrabPrelude(npc,old,target,{realDot:true},{allowMarkedTransfers:true,onDeath(){}}));
});

test('moving goal queries use current source identity and retain first-slot precedence on overlap',()=>{
 const g=markedFixture().create();for(let n=1;n<=16;n++)for(const m of g.movingDots.values())m.dispatch(n,1);const dots=g.movingQueryDots(),o={allowMovingQueries:true,human:true,movingOrigin:true,originPixel:{x:122,y:72},offset:{row:0,column:1}};
 const r=querySourceGrab(dots,o);assert.equal(r.grab.dot,'1,0');assert.equal(r.grab.sourceIndex,1);assert.equal(dots.find(d=>d.id==='1,0').currentPixel.x,170);assert.equal(dots.find(d=>d.id==='1,0').sourceInitialPosition.x,122);
 dots[0].currentPixel={x:170,y:72};assert.equal(querySourceGrab(dots,o).grab.dot,'0,0','earlier source identity wins even when later one is the goal');
});

test('synthetic actor placement followed by current moving-goal acquisition completes only its real identity',()=>{
 const g=markedFixture().create();for(let n=0;n<30&&!g.actorClasses.snapshot().classes[0].delta;n++)g.update(1/120,{});const target=g.board.dots.find(d=>d.id==='1,0');assert.equal(target.x,125);
 Object.assign(g.player,{pivot:'0,0',movingPivot:true,frame:0,unwrappedFrame:0,angle:0,direction:1,sourceBlockedTarget:null});g.moveMovingHuman(g.player,'flip');assert.equal(g.complete,true);assert.equal(g.player.pivot,'1,0');assert.equal(g.childScore.roundBonus,1000);assert.equal(g.events.at(-1).type,'goal');assert.equal(g.death,null);
});
