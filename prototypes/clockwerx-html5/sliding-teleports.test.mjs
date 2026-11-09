import test from 'node:test';import assert from 'node:assert/strict';
import {SourceRound} from './round.mjs';
import {levelRequirements,buildDecodedBoard} from './level.mjs';
import {advanceStaticEnemyCallback,markEnemyOrphaned} from './enemy-transfer.mjs';
import {TeleportRuntime} from './teleport-runtime.mjs';
import {pairTeleportSpecs as pair} from './teleports.mjs';
import {startSliding,animateSliding,stopSliding} from './sliding.mjs';
const outline={left:0,right:0,top:0,bottom:0,rows:[],collidable:false},frames=Array.from({length:64},()=>outline),profiles={outlines:{groups:Object.fromEntries([700,500,4400,4500].map(g=>[g,{frames}]))}};
const clone=structuredClone,none=()=>{},deathFactory=()=>({update(){},complete:false,snapshot(){return[];}});
const dot=(id,column,row,extra={})=>({id,column,row,x:column*48,y:row*48,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,sourceInBackground:true,motion:'static',slideMask:0,teleport:false,color:0,kind:'dot',ring:false,cell:1,flags:15,bonus:false,...extra});
function fixture(){
 const dots=[dot('a',0,0),dot('b',1,0,{teleport:true}),dot('c',1,2,{teleport:true}),dot('d',3,0,{slideMask:1}),dot('e',4,0,{slideMask:4}),dot('goal',5,0,{kind:'goal'}),dot('ring',5,1,{ring:true,sourceInBackground:false})];
 const board={dots,connectors:[{id:0,first:'d',second:'e',vertical:false,bonus:false}],teleports:pair([{row:0,column:1,channel:0},{row:2,column:1,channel:0}],dots),teleportHumanStarts:['a','a'],slidingHumanStarts:['a','a'],player:{name:'player',pivot:'a',angle:0,direction:1,sourceActorType:0,sourceSlot:0,group:700,speedClass:0,checksWalls:true},demos:[],enemies:[],spikes:[],walls:[],doors:[],switches:[],puddles:[],bombs:[],goodies:[],slidingConnectorRules:true,slidingTeleportRules:true,teleportRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,combinedGoalBonusRules:true,difficulty:'Child',timeLimit:150,radius:48,distanceTolerance:1,angularSpeed:Math.PI*2,sourceDotPermissions:true};
 return {board,options:{...profiles,deathFactory}};
}
const actor=(extra={})=>({name:'red',sourceActorType:1,sourceSlot:2,pivot:'a',frame:63,unwrappedFrame:63,direction:1,visible:true,orphaned:false,checksWalls:false,speedClass:1,sourcePC:1,...extra});
const adapters={guestTick:100,adjustPeriod:n=>n,afterAnimate:none,onDotRelease:none,onDotGrabFirst:none,afterDotGrab:none};

test('raw HY/EX gate is independent, requires canonical capabilities and keeps stored human programs manual',()=>{
 const present=new Set([0,1,2,3,4,5,13,16]);
 const cells=Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:present.has(i),flagsRaw:i===5?5:i===16?9:present.has(i)?1:0,secondaryRaw:15}));
 const actor=(type,column,program)=>({actorTypeRaw:type,gridPosition:{row:0,column},activationMaskRaw:15,initialFrameHalfIndexRaw:0,programReferenceRaw:program,version12ByteRaw:type===1?0:1,rawWords:[0,column,type,0,1,program,1,type===1?1:0,0,15,0]});
 const level={resourceId:0,structuralStatus:'complete',header:{displaySizeRaw:8,timeLimitRaw:150},cells,blocks:[{kind:'HY',count:2,records:[{rawWords:[0,2,0,0,15]},{rawWords:[1,2,0,0,15]}]},{kind:'EX',count:1,records:[{rawWords:[0,3,0]}]},{kind:'WA',count:3,records:[actor(0,0,0),actor(6,0,0),actor(1,1,1)]},{kind:'WP',count:2,records:[{text:'manual'},{text:'bfns'}]}]};
 const options={angularSpeed:Math.PI*2,allowSlidingTeleports:true,allowSlidingConnectors:true,allowTeleports:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true};
 assert.deepEqual(levelRequirements(level,options),[]);const board=buildDecodedBoard(level,options);assert.equal(board.player.program,'manual');assert.equal(board.player.sourceProgramReference,0);assert.equal(board.enemies[0].program,'bfns');assert.equal(board.slidingTeleportRules,true);
 for(const flag of Object.keys(options).filter(k=>k!=='angularSpeed'))assert.ok(levelRequirements(level,{...options,[flag]:false}).length,flag);
 for(const flag of ['allowRotatingSpikes','allowStaticSlidingPrograms','allowSlidingOil','allowSlidingBombs','allowElevators','allowStaticEnemyWalls'])assert.ok(levelRequirements(level,{...options,[flag]:true}).length,flag);
 const overlap=clone(level);overlap.blocks[0].records[0].rawWords[1]=3;assert.ok(levelRequirements(overlap,options).some(s=>s.includes('disjoint')));
 const pc=clone(level);pc.blocks[2].records[2].rawWords[6]=0;assert.ok(levelRequirements(pc,options).some(s=>s.includes('PC1')));
});

test('normalized/helper gates reject overlaps, forged subordinate flags, other clocks and orbitals',()=>{
 for(const change of [{ring:true},{kind:'goal'},{slideMask:1},{x:48.5},{column:1.5},{nonhumanCanGrab:false}]){const f=fixture();Object.assign(f.board.dots[1],change);assert.throws(()=>new SourceRound(f.board,f.options),/HY\/EX|EX/);}
 for(const flag of ['teleportRules','slidingConnectorRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules']){const f=fixture();f.board[flag]=false;assert.throws(()=>new SourceRound(f.board,f.options));}
 for(const start of ['b','d','ring','goal']){const f=fixture();f.board.slidingHumanStarts[1]=start;assert.throws(()=>new SourceRound(f.board,f.options));}
 const {board}=fixture();assert.throws(()=>new TeleportRuntime(board.teleports,board.dots),/capability/);
 for(const change of [
  endpoints=>{for(const e of endpoints){e.channel=25;e.firstFrame=51;e.lastFrame=52;e.initialFrame+=50;}},
  endpoints=>{for(const e of endpoints){e.channel=0.5;}},
  endpoints=>{for(const e of endpoints){e.firstFrame=49;e.lastFrame=50;e.initialFrame+=48;}},
  endpoints=>{endpoints[1].initialFrame=endpoints[0].initialFrame;},
  endpoints=>{[endpoints[0].initialFrame,endpoints[1].initialFrame]=[endpoints[1].initialFrame,endpoints[0].initialFrame];}
 ]){const f=fixture();change(f.board.teleports);assert.throws(()=>new SourceRound(f.board,f.options),/channels|complementary/);assert.throws(()=>new TeleportRuntime(f.board.teleports,f.board.dots,{}, {allowSlidingTeleports:true,connectors:f.board.connectors}),/channels|complementary/);}
 const four=fixture();four.board.dots.push(dot('h',2,1,{teleport:true}),dot('i',2,2,{teleport:true}));four.board.teleports.push({...four.board.teleports[0],index:2,dot:'h',partner:'i'},{...four.board.teleports[1],index:3,dot:'i',partner:'h'});assert.throws(()=>new SourceRound(four.board,four.options),/exactly two/);assert.throws(()=>new TeleportRuntime(four.board.teleports,four.board.dots,{}, {allowSlidingTeleports:true,connectors:four.board.connectors}),/exactly two/);
 const duplicate=fixture();Object.assign(duplicate.board.dots[1],{column:3,x:144});assert.throws(()=>new SourceRound(duplicate.board,duplicate.options),/Unique HY\/EX source grid/);assert.throws(()=>advanceStaticEnemyCallback(actor(),1,{...adapters,program:'bfns',dots:duplicate.board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true}),/Unique HY\/EX source grid/);
 const runtime=new TeleportRuntime(board.teleports,board.dots,{}, {allowSlidingTeleports:true,connectors:board.connectors});
 for(const extra of [{sourceActorType:4},{speedClass:2},{checksWalls:true},{sourceSlot:31},{program:'?',sourcePC:1}])assert.throws(()=>runtime.teleport(actor(extra),board.dots[1],{sound:none,place:none,checkWalls:()=>false,onWallDeath:none}),/HY\/EX/);
 for(const extra of [{sourceActorType:4},{speedClass:2},{checksWalls:true},{sourceSlot:31},{sourcePC:0}])assert.throws(()=>advanceStaticEnemyCallback(actor(extra),1,{...adapters,program:'bfns',dots:board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true}));
 assert.throws(()=>advanceStaticEnemyCallback(actor(),1,{...adapters,program:'bfns',dots:board.dots,allowSliding:true,allowTeleports:true}),/capability/);
});

test('normal human HY grab preserves canonical+32 and old-pivot fader before partner; no recursive destination effects',()=>{
 const f=fixture(),g=new SourceRound(f.board,f.options);for(let i=0;i<40&&!g.player.transfers;i++)g.update(1/120,{flip:true});
 assert.equal(g.player.pivot,'c');assert.equal(g.player.frame,33);assert.equal(g.player.direction,1);assert.equal(g.player.transfers,1);assert.equal(g.complete,false);
 assert.deepEqual(g.events.map(e=>e.type),['flip','teleport-sound','teleport']);assert.deepEqual(g.events[0].from,'a');assert.equal(g.events[0].to,'b');
 const fader=g.teleports.faders[0];assert.equal(fader.pivot,'b');assert.equal(fader.firstFrame,6);assert.equal(fader.x,4);assert.equal(fader.y,-43);
 const t=new TeleportRuntime(f.board.teleports,f.board.dots,{}, {allowSlidingTeleports:true,connectors:f.board.connectors});const a=actor({pivot:'b',frame:32,unwrappedFrame:32,sourcePC:3,orphaned:true,orphanDeadline:115});const d=f.board.dots.find(d=>d.id==='c');Object.assign(d,{kind:'goal',bonus:true,humanCanGrab:false});
 t.teleport(a,f.board.dots[1],{sound:()=>assert.fail('NPC sound'),place:none,checkWalls:()=>false,onWallDeath:none});assert.equal(a.pivot,'c');assert.equal(a.sourcePC,3);assert.equal(a.orphaned,true);assert.equal(d.collected,undefined);
});

test('NPC diagnostics capture original grab before synchronous HY and preserve multi-inner b/f/n/s PC order',()=>{
 const {board}=fixture(),log=[],t=new TeleportRuntime(board.teleports,board.dots,{}, {allowSlidingTeleports:true,connectors:board.connectors});
 const r=advanceStaticEnemyCallback(actor(),2,{...adapters,program:'fnbs',dots:board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true,onSourceEvent:(e,a)=>log.push([e.type,e.from,e.to,a.pivot,a.frame,a.sourcePC]),onDotRelease:a=>log.push(['release',a.pivot]),onDotGrabFirst:a=>log.push(['DP-first',a.pivot]),afterDotGrab:(a,d)=>{log.push(['HY',a.pivot]);t.teleport(a,d,{sound:none,place:none,checkWalls:()=>false,onWallDeath:none});log.push(['DP-destination',a.pivot]);}});
 assert.equal(r.state.pivot,'c');assert.equal(r.state.frame,33);assert.equal(r.state.sourcePC,2);assert.deepEqual(log.map(x=>x[0]),['program-command','release','program-transfer','DP-first','HY','DP-destination']);assert.deepEqual(log[2],['program-transfer','a','b','b',32,2]);
 for(const [op,reverse,grab]of [['b',true,false],['f',true,true],['s',false,true],['n',false,false]]){const events=[],r=advanceStaticEnemyCallback(actor(),1,{...adapters,program:op,dots:board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true,onSourceEvent:e=>events.push(e)});assert.equal(r.state.sourcePC,1);assert.equal(r.state.pivot,grab?'b':'a');assert.equal(r.state.direction,grab!==reverse?-1:1);assert.equal(events.filter(e=>e.type==='program-command').length,1);}
});

test('multiple inner steps consume one-based b/f/n/s only at unsliding cardinals and wrap before next command',()=>{
 const {board}=fixture(),events=[],r=advanceStaticEnemyCallback(actor({pivot:'c'}),65,{...adapters,program:'bfns',dots:board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true,onSourceEvent:e=>events.push(e)});
 assert.deepEqual(events.filter(e=>e.type==='program-command').map(e=>[e.step,e.frame,e.sourcePCBefore,e.sourcePCAfter,e.sourceOpcode,e.allowed]),[[0,0,1,2,'b',false],[16,16,2,3,'f',false],[32,32,3,4,'n',false],[48,48,4,1,'s',false],[64,0,1,2,'b',false]]);assert.equal(r.state.sourcePC,2);assert.equal(r.state.direction,1);assert.equal(r.state.pivot,'c');
 const sliding=actor({pivot:'d',frame:48,unwrappedFrame:48});startSliding(sliding,board.dots.find(d=>d.id==='d'));
 const order=[],arrived=advanceStaticEnemyCallback(sliding,16,{...adapters,program:'n',dots:board.dots,allowSliding:true,allowTeleports:true,allowSlidingTeleports:true,onSourceEvent:e=>order.push([e.type,e.step,e.from,e.to]),onDotRelease:()=>order.push(['release']),onDotGrabFirst:()=>order.push(['DP-first']),afterDotGrab:()=>order.push(['HY-stage'])});
 assert.equal(arrived.state.pivot,'e');assert.equal(arrived.state.frame,48);assert.equal(arrived.state.sliding,false);assert.deepEqual(order,[['release'],['slide-arrival',15,'d','e'],['DP-first'],['HY-stage'],['program-command',15,undefined,undefined]]);
});

test('source primitive only: EX arrival grabs while sliding, has no+32, queries post-HY pivot; backout has no hooks',()=>{
 // Deliberately unadmitted overlap fixture exercises the lower-level source
 // stop-slide boundary. The normalized/raw gates above still reject it.
 const dots=[dot('a',0,0,{slideMask:1}),dot('b',1,0,{teleport:true}),dot('c',3,2,{teleport:true})],t=new TeleportRuntime(pair([{row:0,column:1,channel:0},{row:2,column:3,channel:0}],dots),dots.map(d=>({...d,slideMask:0}))),a=actor({frame:48,unwrappedFrame:48}),log=[];
 startSliding(a,dots[0]);for(let i=0;i<16;i++)animateSliding(a);
 const e=stopSliding(a,dots,{currentPivot:true,release:d=>log.push(['release',d.id]),grab:(d,s)=>{log.push(['grab',d.id,s.frame,s.sliding]);t.teleport(s,d,{sound:none,place:none,checkWalls:()=>false,onWallDeath:none});}});
 assert.deepEqual(e,{type:'slide-arrival',from:'a',to:'b'});assert.deepEqual(log,[['release','a'],['grab','b',48,true]]);assert.equal(a.pivot,'c');assert.equal(a.frame,48);assert.equal(a.slideX,dots[2].x);assert.equal(a.slideY,dots[2].y);assert.equal(a.sliding,false);
 Object.assign(a,{pivot:'a',sliding:true,slideProgress:0,slideDelta:-1});assert.deepEqual(stopSliding(a,dots,{release:()=>assert.fail('release'),grab:()=>assert.fail('grab')}),{type:'slide-backout',dot:'a'});
});

test('source orphan prelude retains deadline through HY; strict expiry runs after all inner steps including delta0',()=>{
 // Existing primitive HY scope permits unavailable synthetic endpoints; this
 // does not admit unavailable HY/EX endpoints into the new composition.
 const dots=[dot('a',0,0),dot('b',1,0,{teleport:true,humanCanGrab:false}),dot('c',2,2,{teleport:true})],t=new TeleportRuntime(pair([{row:0,column:1,channel:0},{row:2,column:2,channel:0}],dots),dots);
 const r=advanceStaticEnemyCallback(actor(),1,{...adapters,program:'f',dots,allowTeleports:true,afterDotGrab:(a,d)=>{assert.equal(a.orphaned,true);t.teleport(a,d,{sound:none,place:none,checkWalls:()=>false,onWallDeath:none});}});
 assert.equal(r.state.pivot,'c');assert.equal(r.state.orphanDeadline,115);assert.equal(r.state.visible,false);assert.equal(markEnemyOrphaned(r.state,{guestTick:101,adjustPeriod:n=>n}),false);
 const at=advanceStaticEnemyCallback(r.state,0,{...adapters,guestTick:115,program:'f',dots,allowTeleports:true});assert.equal(at.state.visible,true);assert.equal(at.state.orphaned,true);
 const after=advanceStaticEnemyCallback(at.state,0,{...adapters,guestTick:116,program:'f',dots,allowTeleports:true});assert.equal(after.state.visible,false);assert.equal(after.state.orphaned,false);
});

test('new faders snapshot current count, avoid same-sweep advance; reset disposes one-shots and retains HY/actor clocks',()=>{
 const {board,options}=fixture(),g=new SourceRound(board,options);for(let i=0;i<70;i++)g.update(1/120,{});
 const clocks=clone(g.teleportClocks.snapshot()),actorClocks=clone(g.actorClasses.snapshot()),t=g.teleports;t.observeHyperspace(t.counts.hyperspace+1);const endpointState=t.endpoints.map(e=>[e.frame,e.clockReference]);
 const count=t.counts.fader;t.startFader(actor({pivot:'b',frame:32}));t.startFader(actor({pivot:'c',frame:16}));const old=t.faders;assert.equal(old.length,2);assert.deepEqual(old.map(f=>f.clockReference),[count,count]);t.observeFaders(count);assert.deepEqual(t.faders.map(f=>f.frame),[18,15]);t.observeFaders(count+1);assert.deepEqual(t.faders.map(f=>f.frame),[19,16]);
 g.reset();assert.notEqual(t.faders,old);assert.equal(t.faders.length,0);assert.deepEqual(t.endpoints.map(e=>[e.frame,e.clockReference]),endpointState);assert.deepEqual(g.teleportClocks.snapshot(),clocks);assert.deepEqual(g.actorClasses.snapshot(),actorClocks);assert.equal(g.player.pivot,'a');assert.equal(g.player.frame,0);
});
