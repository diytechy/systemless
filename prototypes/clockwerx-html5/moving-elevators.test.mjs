import test from 'node:test';import assert from 'node:assert/strict';
import {createSourceUpDownDot} from './elevators.mjs';
// Invented source TYPE2 contracts, no private map/program/native timing.
const spec={id:'invented-updown',sourceIndex:12,row:1,column:1,group:0,initialLowered:false,originalPixel:{x:122,y:120}};
const make=(extra={})=>createSourceUpDownDot(spec,{allowMovingElevators:true,onRiders(){},...extra});
test('source TYPE2 primitive is independently gated and retains exact declared source geometry',()=>{
 assert.throws(()=>createSourceUpDownDot(spec,{onRiders(){}}));
 for(const edit of[{group:1},{initialLowered:true},{sourceIndex:13},{originalPixel:{x:123,y:120}}])assert.throws(()=>createSourceUpDownDot({...spec,...edit},{allowMovingElevators:true,onRiders(){}}));
 assert.throws(()=>make({onRiders:async()=>{}}));const s=make().snapshot();assert.equal(s.phase,12);assert.equal(s.misc3.layer,5);assert.equal(s.misc4.layer,4);assert.equal(s.misc3.frame,127);assert.equal(s.misc4.visible,false);assert.deepEqual(s.mainPixel,spec.originalPixel);
});
test('source TYPE2 double dispatch moves main/shadow, calls riders before phase change and NEVER writes intermediate cache',()=>{
 const rows=[],m=make({onRiders:(id,p,o)=>rows.push({id,p,phase:o.state.phase,skip:o.skipSpecialMisc})});m.activate();const r=m.dispatch(2,2);
 assert.equal(r.callbacks,2);assert.deepEqual(rows,[{id:12,p:{x:121,y:121},phase:12,skip:true},{id:12,p:{x:120,y:122},phase:11,skip:true}]);assert.equal(r.state.phase,10);assert.deepEqual(r.state.shadowPixel,{x:118,y:120});assert.equal(r.state.intermediate.valid,false);assert.deepEqual(r.state.misc3.rawBase,{x:106,y:105});assert.deepEqual(r.state.misc4.rawBase,{x:106,y:105});assert.equal(r.state.humanAvailable,false);assert.equal(m.dispatch(2,200).callbacks,0);
});
test('source TYPE2 dispatch is capped at two callbacks and lowered hooks precede final cap paint',()=>{
 const rows=[],m=make({onLowered:(id,s)=>rows.push({id,phase:s.phase,cap:s.misc4.frame,point:s.mainPixel})});m.activate();m.dispatch(1,200);assert.equal(m.snapshot().phase,10);for(let n=2;n<=11;n++)m.dispatch(n,1);
 assert.deepEqual(rows,[{id:'invented-updown',phase:0,cap:157,point:{x:110,y:132}}]);assert.equal(m.snapshot().misc4.frame,158);assert.equal(m.snapshot().misc4.visible,true);assert.equal(m.snapshot().mainVisible,false);assert.equal(m.snapshot().step,0);assert.equal(m.snapshot().misc3.frame,126);assert.equal(m.snapshot().misc3.step,0);
});
test('source raised reset preserves TYPE3 frame/step/reference and main class reference while restoring TYPE2 parents',()=>{
 const m=make({classCount:9,surfaceCount:4});m.observeSurface(5);assert.equal(m.snapshot().misc3.frame,128);m.activate();for(let n=10;n<=21;n++)m.dispatch(n,1);const before=m.snapshot();m.reset();const after=m.snapshot();
 assert.deepEqual(after.mainPixel,spec.originalPixel);assert.deepEqual(after.shadowPixel,spec.originalPixel);assert.equal(after.phase,12);assert.equal(after.step,0);assert.equal(after.misc4.visible,false);assert.equal(after.misc4.frame,before.misc4.frame);assert.equal(after.misc3.frame,126);assert.equal(after.misc3.step,0);assert.equal(after.misc3.reference,before.misc3.reference);assert.equal(after.clockReference,before.clockReference);m.observeSurface(20);assert.equal(m.snapshot().misc3.frame,126);assert.throws(()=>m.observeSurface(19));assert.throws(()=>m.dispatch(20,1));
});
test('surface callback before a final raising callback retains126 until the next changed160 count',()=>{
 const m=make();m.activate();for(let n=1;n<=12;n++)m.dispatch(n,1);m.activate();for(let n=13;n<=23;n++)m.dispatch(n,1);assert.equal(m.snapshot().phase,11);m.observeSurface(1);m.dispatch(24,1);assert.equal(m.snapshot().phase,12);assert.equal(m.snapshot().misc3.frame,126);assert.equal(m.snapshot().misc3.step,1);m.observeSurface(1);assert.equal(m.snapshot().misc3.frame,126);m.observeSurface(2);assert.equal(m.snapshot().misc3.frame,127);
});

import {SourceRound} from './round.mjs';import {assertMovingElevatorScope} from './moving-elevators.mjs';
import {querySourceGrab,grabSourceActor} from './source-grab.mjs';import {reverseSliding,stopSliding} from './sliding.mjs';
// INVENTED joined source fixture. All pose edits below are synthetic contracts,
// never private-map gameplay, legal-route evidence or native clock calibration.
export function movingElevatorFixture({secondNPC=false}={}){
 const point=(c,r)=>({x:74+48*c,y:72+48*r}),dot=(c,r,e={})=>({id:`${c},${r}`,sourceIndex:r*11+c,column:c,row:r,...point(c,r),sourceInitialPosition:point(c,r),cell:1,flags:15,present:true,kind:'dot',bonus:false,color:0,transferDeath:false,protected:false,ring:false,teleport:false,slideMask:0,motion:'static',motionType:0,sourceInitialBonus:false,sourceHasSprite:false,sourceInBackground:true,sourceCollidable:true,humanCanGrab:true,nonhumanCanGrab:true,...e});
 const dots=[...(secondNPC?[dot(10,0)]:[]),dot(1,1,{cell:0x101,motion:'up-down',motionType:2,upDown:{...point(1,1),group:0,initialLowered:false},upDownPhase:12,sourceHasSprite:true,sourceInBackground:false}),dot(2,3,{slideMask:1}),dot(3,3,{slideMask:4}),dot(2,4,{cell:0x83,motion:'moving-program',motionType:1,movingProgram:'ew',bonus:true,kind:'bonus',sourceInitialBonus:true,sourceHasSprite:true,sourceInBackground:false}),dot(0,6),dot(0,7,{cell:5,kind:'goal',sourceHasSprite:true,sourceInBackground:false})];
 const actor=(slot,kind,pivot)=>({name:slot===0?'player':`ordinary-${slot}`,sourceSlot:slot,sourceActorType:kind,speedClass:slot===0?0:1,group:({0:700,1:500,3:4500})[kind],pivot,frame:0,unwrappedFrame:0,canonicalFrame:true,angle:0,direction:1,program:null,visible:true,orphaned:false,checksWalls:slot===0});
 const board={ordinal:0,title:'Invented moving/up-down join',origin:{x:74,y:72},radius:48,distanceTolerance:1,angularSpeed:1,timeLimit:90,difficulty:'Child',activeMask:1,sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},player:actor(0,0,'0,6'),enemies:[actor(2,1,'2,4'),...(secondNPC?[actor(3,3,'10,0')]:[])],demos:[],dots,spikes:[],bombs:[],goodies:[],connectors:[{id:0,first:'2,3',second:'3,3',vertical:false,bonus:false,sourceInitialBonus:false,sourceHasSprite:false,burnt:false}],walls:[{id:0,row:2,column:10,x:554,y:168,frame:0,visible:true}],doors:[],switches:[],puddles:[],elevators:[{row:2,column:3,subcell:3,group:0,activationMask:15}],teleports:[],movingHumanStarts:['0,6','0,6'],slidingHumanStarts:['0,6','0,6'],movingDotRules:true,movingElevatorRules:true,pilotAbsentSlideRecoveryRules:true,elevatorRules:true,slidingConnectorRules:true,combinedGoalBonusRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true};
 const shape={left:44,top:43,right:45,bottom:44,rows:null},frames=n=>Array.from({length:n},()=>({...shape}));const options={outlines:{groups:{700:{frames:frames(64)},4300:{frames:frames(64)},500:{frames:frames(64)},4500:{frames:frames(64)},800:{frames:frames(24)}}},dotOutlines:{groups:{300:{frames:frames(160)}}},elevatorOutlines:{groups:{3400:{frames:frames(10)}}},deathFactory:()=>{throw new Error('Invented fixture must not create death effects');}};
 return {board,options,create:()=>new SourceRound(board,options)};
}
const joinedScope=b=>({...b,actors:[b.player,...b.enemies],humanStarts:b.movingHumanStarts,initial:true});
test('invented join constructor retains ordinary bonus rider, static goal and source TYPE2 inventory',()=>{
 const f=movingElevatorFixture(),g=f.create();assert.equal(assertMovingElevatorScope(joinedScope(f.board)),true);assert.equal(g.enemies[0].movingPivot,true);assert.equal(g.elevators.snapshot().dots[0].phase,12);assert.equal(g.dotAnimations.renderState('0,7').goal.frame,17);assert.equal(g.pilotRecoveries,0);
});
test('joined normalized admission closes immutable grid, actual inventories, source modes and actor programs',()=>{
 for(const edit of[b=>b.pilotAbsentSlideRecoveryRules=false,b=>b.movingDotRules=false,b=>b.elevatorRules=false,b=>b.slidingConnectorRules=false,b=>b.spikes.push({}),b=>b.elevators=[],b=>b.walls=[],b=>b.teleports.push({}),b=>b.sourceGrid.displaySizeRaw=6,b=>b.dots[0].sourceInitialPosition.x++,b=>b.dots[0].intermediate={valid:true,moving:false,pixel:{x:122,y:120}},b=>b.dots[3].kind='unqualified',b=>b.dots[3].sourceInBackground=true,b=>b.dots[3].sourceHasSprite=false,b=>b.dots[3].flags=14,b=>b.dots[3].sourceMovingProgram={offset:4,rawHex:'02656500',paddingHex:'00'},b=>b.enemies[0].program='x',b=>b.enemies[0].sourceActorType=4,b=>b.enemies[0].pivot='1,1']){const f=movingElevatorFixture();edit(f.board);assert.throws(f.create);}
});
function syntheticNegativeEntry(g){
 const dots=g.movingQueryDots();dots.find(d=>d.id==='2,4').currentPixel={x:185,y:264};Object.assign(g.player,{pivot:'2,4',frame:48,unwrappedFrame:48,angle:Math.PI*1.5,direction:1,movingPivot:true});
 const result=querySourceGrab(dots,{originPixel:{x:185,y:264},offset:{row:-1,column:0},human:true,movingOrigin:true,connectors:g.board.connectors,allowMovingQueries:true});assert.equal(result.grab.realDot,false);
 grabSourceActor(g.player,result,{dots,connectors:g.board.connectors,physicalPoint:{x:185,y:264},allowMovingQueries:true,release(){},place(){},grab(){}});assert.equal(g.player.slideDelta,-1);assert.equal(g.player.slideDirection,2);reverseSliding(g.player);assert.equal(g.player.slideDelta,1);assert.equal(g.player.slideDirection,2);
}
test('negative ordinary entry plus Reverse recovers absent target before release and aborts whole human update',()=>{
 const g=movingElevatorFixture().create();g.childScore.bonusDot();const scoreBefore=g.childScore.snapshot().overallEarned;syntheticNegativeEntry(g);let releases=0,grabs=0;g.onHumanRelease=()=>releases++;g.slideGrabHuman=()=>grabs++;
 for(let n=0;n<300&&!g.pilotRecoveries;n++)g.update(1/120,{});assert.equal(g.pilotRecoveries,1);assert.equal(releases,0);assert.equal(grabs,0);assert.equal(g.death,null);assert.equal(g.complete,false);assert.equal(g.player.pivot,'0,6');assert.equal(g.roundRestarts,1);
 const e=g.events.find(e=>e.type==='unsupported-continuation');assert.equal(e.pilotRecovery.targetSourceIndex,34);assert.deepEqual(e.pilotRecovery.lastKnownPhysical,{x:218,y:216});assert.equal('targetPoint' in e.pilotRecovery,false);assert.equal('sourceDeathReason' in e.pilotRecovery,false);assert.deepEqual(g.events.slice(g.events.indexOf(e)).map(e=>e.type),['unsupported-continuation','pilot-round-restart']);assert.equal(g.childScore.roundBonus,0);assert.equal(g.childScore.totalCommitted,scoreBefore);assert.equal(g.childScore.snapshot().overallEarned,scoreBefore);assert.equal(g.pilotInputLatch,true);g.update(1/120,{flip:true});assert.equal(g.pilotInputLatch,true);g.update(1/120,{});assert.equal(g.pilotInputLatch,false);
});
test('NPC absent target recovery unwinds before a later NPC or helper continuation can execute',()=>{
 const g=movingElevatorFixture({secondNPC:true}).create(),a=g.enemies[0];Object.assign(a,{pivot:'2,3',sliding:true,slideProgress:15,slideDelta:1,slideDirection:2,slideVX:3,slideVY:0,slideX:215,slideY:216,frame:16,unwrappedFrame:16,direction:-1,movingPivot:false});
 const original=g.animateStaticEnemy.bind(g),seen=[];g.animateStaticEnemy=(a,...args)=>{seen.push(a.sourceSlot);return original(a,...args);};let guardCalls;
 for(let n=0;n<300&&!g.pilotRecoveries;n++){seen.length=0;g.update(1/120,{});if(g.pilotRecoveries)guardCalls=[...seen];}assert.equal(g.pilotRecoveries,1);assert.deepEqual(guardCalls,[2]);assert.equal(g.death,null);assert.equal(g.player.pivot,'0,6');assert.equal(g.events.at(-1).type,'pilot-round-restart');assert.equal(g.events.filter(e=>e.type==='program-transfer'||e.type==='slide-arrival').length,0);
});
test('present slide arrival remains source dispatched; missing callback is never used',()=>{
 const f=movingElevatorFixture(),a={...f.board.player,pivot:'2,3',sliding:true,slideProgress:16,slideDelta:1,slideDirection:0,slideVX:3,slideVY:0},calls=[];
 const r=stopSliding(a,f.board.dots,{release:d=>calls.push(['release',d.id]),grab:d=>calls.push(['grab',d.id]),onMissingTarget(){throw new Error('must not recover present target');}});assert.equal(r.to,'3,3');assert.deepEqual(calls,[['release','2,3'],['grab','3,3']]);assert.equal(a.pivot,'3,3');assert.equal(a.sliding,false);
});

test('TYPE2 current lookup has no intermediate cache or ordinary-human EX fallback',()=>{
 const g=movingElevatorFixture().create(),dots=g.movingQueryDots(),u=dots.find(d=>d.id==='1,1');u.currentPixel={x:185,y:264};assert.equal(u.intermediate.valid,false);
 const denied=querySourceGrab(dots,{originPixel:u.currentPixel,offset:{row:-1,column:0},human:true,movingOrigin:false,connectors:g.board.connectors,allowMovingQueries:true});assert.equal(denied.allowed,false);assert.equal(denied.grab,null);
 const ordinary=querySourceGrab(dots,{originPixel:u.currentPixel,offset:{row:-1,column:0},human:true,movingOrigin:true,connectors:g.board.connectors,allowMovingQueries:true});assert.equal(ordinary.grab.realDot,false);
});
test('joined lowering positions human then terminal38 and NPC orphan without moving TYPE3/TYPE4 parents',()=>{
 const f=movingElevatorFixture(),death=[];f.options.deathFactory=(p,h)=>{death.push({id:p.id,x:p.x,y:p.y});return {complete:false,update(){},snapshot(){return []}};};const g=f.create(),u=g.board.dots.find(d=>d.upDown);g.player.pivot=u.id;g.enemies[0].pivot=u.id;
 g.elevators.contact('invented',0);for(let n=1;n<=12;n++)g.elevators.dispatchDot(u.id,n,1);g.syncElevatorDots();
 assert.deepEqual(death,[{id:'1,1',x:110,y:132}]);assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,38);assert.equal(g.enemies[0].orphaned,true);assert.equal(u.humanCanGrab,false);assert.equal(u.sourceCollidable,false);const state=g.elevators.snapshot().dots[0];assert.deepEqual(state.misc3.rawBase,{x:106,y:105});assert.deepEqual(state.misc4.rawBase,{x:106,y:105});assert.equal(g.movingQueryDots().find(d=>d.id===u.id).intermediate.valid,false);
});
test('moving BONUS clears once with retained foreground identity and normal reset restores declared source bonus',()=>{
 const g=movingElevatorFixture().create(),d=g.board.dots.find(d=>d.motionType===1);g.slideGrabHuman(d,g.player);g.slideGrabHuman(d,g.player);assert.equal(g.childScore.roundBonus,1000);assert.equal(d.kind,'dot');assert.equal(d.bonus,false);assert.equal(d.cell,0x81);assert.equal(d.sourceHasSprite,true);assert.equal(d.sourceInitialBonus,true);assert.equal(d.sourceInBackground,false);const journal=g.sourcePaint.backgroundPaints;g.reset({preserveCheckpoint:true});assert.equal(g.childScore.totalCommitted,1000);assert.equal(d.bonus,true);assert.equal(d.kind,'bonus');assert.equal(d.cell,0x83);assert.notEqual(g.sourcePaint.backgroundPaints,journal);
});
test('static source TYPE1 goal clock and TYPE3 reset retention are independent of ordinary main motion',()=>{
 const g=movingElevatorFixture().create(),goal=g.dotAnimations.renderState('0,7').goal;g.dotAnimations.observeDotClocks('0,7',{dotCount:0,overlayCount:1,guestTick:0});const later=g.dotAnimations.renderState('0,7').goal;assert.equal(later.frame,18);assert.deepEqual(later.rawBase,goal.rawBase);g.reset();const reset=g.dotAnimations.renderState('0,7').goal;assert.equal(reset.frame,18);assert.equal(reset.reference,1);assert.deepEqual(reset.rawBase,goal.rawBase);
});

import {buildDecodedBoard,levelRequirements} from './level.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
export const movingElevatorOptions={angularSpeed:1,allowMovingDots:true,allowMovingElevators:true,allowPilotAbsentSlideRecovery:true,allowElevators:true,allowSlidingConnectors:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true,allowInactivePlainDotMasks:true,allowInactiveSpikes:true};
function inventedRawJoin(){
 const f=movingElevatorFixture(),cells=f.board.dots.map(d=>{const c={present:true,row:d.row,column:d.column,flagsRaw:d.cell,secondaryRaw:d.flags};if(d.motionType===1)Object.assign(c,{offset:100,byteLength:8,rawHex:'0083000f02657700',inlineProgram:{offset:104,text:'ew',rawHex:'02657700',paddingHex:'00'}});return c;});
 const actor=(kind,row,column)=>({actorTypeRaw:kind,programReferenceRaw:-1,initialFrameHalfIndexRaw:24,activationMaskRaw:15,version12ByteRaw:kind===0||kind===6?1:0,gridPosition:{row,column},rawWords:[row,column,kind,24,1,65535,1,kind===0||kind===6?0:1]});
 return {structuralStatus:'complete',resourceId:999,header:{version:12,displaySizeRaw:8,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:3,records:[actor(0,6,0),actor(6,6,0),actor(1,4,2)]},{kind:'WL',count:1,records:[{rawWords:[256,10,2,0,2,0]}]},{kind:'EX',count:1,records:[{rawWords:[3,2,0]}]},{kind:'EL',count:1,records:[{rawWords:[2,3,3,0,0,15]}]},{kind:'SP',count:1,records:[{rawWords:[0,0,0,0,0,14]}]}]};
}
test('portable invented raw join is default off and retains inactive plain presence separately from moving properties',()=>{
 const raw=inventedRawJoin();assert.deepEqual(levelRequirements(raw,movingElevatorOptions),[]);const b=buildDecodedBoard(raw,movingElevatorOptions);assert.equal(b.movingElevatorRules,true);assert.equal(b.spikes.length,0);assert.equal(b.enemies[0].pivot,'2,4');assert.equal(b.dots.find(d=>d.motionType===1).bonus,true);
 for(const key of['allowMovingElevators','allowPilotAbsentSlideRecovery','allowMovingDots','allowElevators','allowSlidingConnectors','allowCanonicalPlayer'])assert.throws(()=>buildDecodedBoard(raw,{...movingElevatorOptions,[key]:false}));
 raw.cells.push({present:true,row:6,column:9,flagsRaw:0x4001,secondaryRaw:0});raw.cells.sort((a,b)=>a.row*11+a.column-b.row*11-b.column);const inactive=buildDecodedBoard(raw,movingElevatorOptions).dots.find(d=>d.id==='9,6');assert.equal(inactive.present,true);assert.equal(inactive.kind,'dot');assert.equal(inactive.color,0);assert.equal(inactive.motionType,0);assert.equal(inactive.flags,0);
 for(const edit of[r=>r.header.version=11,r=>r.header.displaySizeRaw=6,r=>r.cells.find(c=>c.flagsRaw===0x83).inlineProgram.rawHex='02656500',r=>r.cells.find(c=>c.flagsRaw===0x83).secondaryRaw=14,r=>r.blocks.at(-1).records[0].rawWords[5]=15,r=>r.cells.find(c=>c.flagsRaw===0x101).flagsRaw=0x201,r=>r.blocks[0].records[2].rawWords[7]=2,r=>r.blocks[0].records[2].version12ByteRaw=1]){const r=inventedRawJoin();edit(r);assert.throws(()=>buildDecodedBoard(r,movingElevatorOptions));}
});
test('direct joined NPC helper requires actual matching inventory and synchronous recovery/query boundaries',()=>{
 const f=movingElevatorFixture(),s=f.board.enemies[0],noop=()=>{},base={program:null,dots:f.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowMovingElevators:true,allowUpDownDots:true,allowSliding:true,movingElevatorScope:f.board,sourceQuery:()=>({allowed:false,grab:null}),onMissingSlideTarget:()=>{throw new Error('fixture recovery');}};
 assert.equal(advanceStaticEnemyCallback(s,0,base).events.length,0);
 for(const edit of[o=>o.allowMovingElevators=false,o=>o.allowUpDownDots=false,o=>o.allowSliding=false,o=>o.onMissingSlideTarget=async()=>{},o=>o.sourceQuery=async()=>({}),o=>o.movingElevatorScope={...f.board,dots:[...f.board.dots]},o=>o.movingElevatorScope={...f.board,spikes:[{}]}]){const o={...base};edit(o);assert.throws(()=>advanceStaticEnemyCallback(s,0,o));}
});

test('existing persisted black human palette constructs, resets and round-trips without changing source/NPC identities',()=>{
 const f=movingElevatorFixture();f.board.player.group=4300;const g=f.create();assert.equal(g.player.group,4300);assert.equal(g.player.sourceActorType,0);assert.equal(g.board.player.group,4300);g.reset();assert.equal(g.player.group,4300);g.setPlayerGroup(700);assert.equal(g.player.group,700);assert.equal(g.board.player.group,700);g.setPlayerGroup(4300);g.reset({preserveCheckpoint:true});assert.equal(g.player.group,4300);assert.equal(g.board.player.group,4300);assert.equal(g.enemies[0].group,500);
 for(const edit of[b=>b.player.group=500,b=>b.enemies[0].group=4300,b=>b.enemies[0].group=4500]){const f=movingElevatorFixture();edit(f.board);assert.throws(f.create);}
});
