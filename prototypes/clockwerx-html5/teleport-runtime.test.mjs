import test from 'node:test';import assert from 'node:assert/strict';
import {TeleportRuntime,createTeleportClocks,actorFaderFrames} from './teleport-runtime.mjs';
import {pairTeleportSpecs} from './teleports.mjs';
import {SourceRound} from './round.mjs';
import {TAU} from './engine.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {levelRequirements,buildDecodedBoard} from './level.mjs';
import {presentedFaderFrame} from './rendering.mjs';

const dot=(id,column,row,extra={})=>({id,column,row,sourceIndex:row*11+column,x:column*48,y:row*48,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,motion:'static',slideMask:0,teleport:false,color:0,kind:'dot',ring:false,cell:1,flags:15,...extra});
function fixture({grabbed={},destination={},ring=false,enemy=false}={}){
 const dots=[dot('a',0,0,{ring}),dot('b',1,0,grabbed),dot('c',3,2,destination)],teleports=pairTeleportSpecs([{row:0,column:1,channel:0},{row:2,column:3,channel:0}],dots);
 for(const e of teleports)dots.find(d=>d.id===e.dot).teleport=true;
 const player={name:'player',pivot:'a',angle:0,direction:1,sourceActorType:0,sourceSlot:0,group:700,speedClass:0,checksWalls:true};
 const red={name:'red',pivot:'b',angle:0,direction:1,sourceActorType:1,sourceSlot:2,group:500,speedClass:1,checksWalls:false,program:null,canonicalFrame:true,frame:0,unwrappedFrame:0,visible:true,orphaned:false};
 const board={dots,teleports,teleportHumanStarts:['a','a'],player,demos:[],enemies:enemy?[red]:[],spikes:[],teleportRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,rotatingSpikeRules:true,difficulty:'Child',timeLimit:90,radius:48,distanceTolerance:1,angularSpeed:TAU,sourceDotPermissions:true};
 const none={left:0,right:0,top:0,bottom:0,rows:[],collidable:false},frames=Array.from({length:64},()=>none),options={outlines:{groups:{700:{frames},500:{frames},3500:{frames},200:{frames:frames.slice(0,4)}}},deathFactory:()=>({update(){},complete:false,snapshot(){return[];}})};
 return {board,options};
}

test('HY Child arrival awards the grabbed bonus, teleports at retained frame and does not collect the denied destination goal',()=>{
 const {board,options}=fixture({grabbed:{kind:'bonus',bonus:true},destination:{kind:'goal',humanCanGrab:false}}),g=new SourceRound(board,options);
 for(let i=0;i<40&&!g.player.transfers;i++)g.update(1/120,{flip:true});
 assert.equal(g.player.pivot,'c');assert.equal(g.player.frame,33);assert.equal(g.player.direction,1);assert.equal(g.player.transfers,1);assert.equal(g.childScore.snapshot().overallEarned,1000);assert.equal(g.complete,false);assert.equal(board.dots[2].collected,undefined);
 assert.deepEqual(g.events.map(e=>e.type),['flip','bonus','teleport-sound','teleport']);
 assert.deepEqual(g.teleports.snapshot().faders.map(f=>[f.pivot,f.frame,f.x,f.y]),[['b',6,4,-43]]);
});

test('goal handling precedes HY and still teleports without running the destination bonus hook',()=>{
 const {board,options}=fixture({grabbed:{kind:'goal'},destination:{kind:'bonus',bonus:true}}),g=new SourceRound(board,options);
 for(let i=0;i<40&&!g.complete;i++)g.update(1/120,{flip:true});
 assert.equal(g.complete,true);assert.equal(g.player.pivot,'c');assert.equal(g.player.frame,32);assert.equal(board.dots[2].collected,undefined);
 assert.deepEqual(g.events.map(e=>e.type),['flip','goal','teleport-sound','teleport']);assert.equal(g.childScore.snapshot().overallEarned,1000);
});

test('ordinary initial occupancy does not call DOInitialGrabbed; human ring release happens once before HY',()=>{
 const {board,options}=fixture({enemy:true});board.dots[0].ring=true;board.dots.push(dot('d',0,1));board.player.pivot='d';board.player.angle=48*TAU/64;board.teleportHumanStarts=['d','d'];const g=new SourceRound(board,options);
 assert.equal(g.enemies[0].pivot,'b');assert.equal(g.teleports.faders.length,0);
 for(let i=0;i<1000&&g.player.transfers<2;i++)g.update(1/120,{flip:true});
 assert.equal(g.player.pivot,'c');assert.equal(board.dots[0].humanCanGrab,false);assert.equal(board.dots[1].humanCanGrab,true);assert.equal(board.dots[2].humanCanGrab,true);
});

test('NPC source hooks run release, first DP, orphan prelude, HY and destination DP without recursively grabbing',()=>{
 const dots=[dot('a',0,0),dot('b',1,0,{teleport:true,humanCanGrab:false}),dot('c',2,2,{teleport:true,humanCanGrab:true})],log=[];
 const t=new TeleportRuntime(pairTeleportSpecs([{row:0,column:1,channel:0},{row:2,column:2,channel:0}],dots),dots);
 const s={name:'red',sourceActorType:1,sourceSlot:2,frame:63,unwrappedFrame:63,direction:1,pivot:'a',visible:true,orphaned:false,checksWalls:false,speedClass:1,sourcePC:1};
 const result=advanceStaticEnemyCallback(s,1,{program:'f',dots,guestTick:100,adjustPeriod:n=>n,allowTeleports:true,afterAnimate:()=>{},onDotRelease:a=>log.push(['release',a.pivot]),onDotGrabFirst:a=>log.push(['DP-first',a.pivot]),afterDotGrab:(a,d)=>{
  log.push(['orphan-before-HY',a.orphaned]);t.teleport(a,d,{sound:()=>assert.fail('NPC sound'),place:a=>log.push(['place',a.pivot]),checkWalls:()=>false,onWallDeath:()=>assert.fail('wall')});log.push(['DP-destination',a.pivot]);
 }});
 assert.equal(result.state.pivot,'c');assert.equal(result.state.frame,32);assert.equal(result.state.orphaned,true);assert.equal(result.state.orphanDeadline,115);
 assert.deepEqual(log,[['release','a'],['DP-first','b'],['orphan-before-HY',true],['place','c'],['DP-destination','c']]);
});

test('persistent HY and fader clocks coalesce callback changes, preserve HY reset phase and clear one-shots',()=>{
 const {board,options}=fixture(),g=new SourceRound(board,options);
 for(let i=0;i<40&&!g.player.transfers;i++)g.update(1/120,{flip:true});
 const f=g.teleports.faders[0],start=f.clockReference;
 assert.equal(f.frame,6);g.teleports.observeFaders(start);assert.equal(f.frame,6);
 g.teleports.observeFaders(start+5);assert.equal(f.frame,7,'missed counts invoke one source callback');
 g.teleports.observeFaders(start+6);assert.equal(f.frame,8);g.teleports.observeFaders(start+7);assert.equal(f.visible,false);
 const t=new TeleportRuntime(board.teleports,board.dots);t.observeHyperspace(7);assert.deepEqual(t.endpoints.map(e=>e.frame),[2,1]);t.reset();assert.deepEqual(t.endpoints.map(e=>[e.frame,e.clockReference]),[[2,7],[1,7]]);
 const clocks=createTeleportClocks();for(let i=0;i<31;i++)clocks.advance(1);assert.equal(clocks.advance(0).hyperspace,0);for(let i=0;i<4;i++)clocks.advance(1);assert.equal(clocks.advance(0).hyperspace,1);
});

test('WA fader uses three canonical cardinal frames for each type, including black human type6',()=>{
 for(const type of [0,1,2,3,6])for(const frame of [0,16,32,48]){
  const first=(type===6?4:type)*12+frame*3/16;assert.deepEqual(actorFaderFrames({sourceActorType:type,frame}),{first,last:first+2});
 }
 assert.throws(()=>actorFaderFrames({sourceActorType:4,frame:0}),/Ordinary/);
 const {board}=fixture(),t=new TeleportRuntime(board.teleports,board.dots);assert.equal(t.startFader({...board.player,frame:0},{suppressed:true}),null);assert.equal(t.faders.length,0);
});

function decodedFixture(){
 const cells=Array.from({length:88},(_,index)=>({row:Math.floor(index/11),column:index%11,present:index<3,flagsRaw:index<3?1:0,secondaryRaw:15}));
 const actor=type=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:15,initialFrameHalfIndexRaw:0,programReferenceRaw:-1,version12ByteRaw:0,rawWords:[0,0,type,0,1,65535,1,0,0,15,0]});
 const level={resourceId:0,structuralStatus:'complete',header:{displaySizeRaw:8,timeLimitRaw:90},cells,blocks:[{kind:'HY',count:2,records:[{rawWords:[0,1,0,0,15]},{rawWords:[0,2,0,0,15]}]},{kind:'WA',count:2,records:[actor(0),actor(6)]},{kind:'WP',count:0,records:[]}]};
 const options={angularSpeed:TAU,allowTeleports:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowRotatingSpikes:true};return {level,options};
}

test('HY admission is default off and requires each independent static Child capability and a complete active pair',()=>{
 const {level,options}=decodedFixture();assert.deepEqual(levelRequirements(level,options),[]);
 assert.ok(levelRequirements(level,{...options,allowTeleports:false}).includes('object class HY'));
 for(const flag of ['allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowRotatingSpikes'])assert.ok(levelRequirements(level,{...options,[flag]:false}).some(s=>s.includes('separate static Child composition')));
 const board=buildDecodedBoard(level,options);assert.equal(board.teleportRules,true);assert.equal(board.teleports.length,2);assert.equal(board.dots[1].teleport,true);assert.equal(board.dots[0].teleport,false);
 level.blocks[0].records[1].rawWords[4]=14;assert.ok(levelRequirements(level,options).some(s=>s.includes('Exactly two')));
});

test('unqualified HY combinations stay rejected by both decode admission and the round constructor',()=>{
 const {level,options}=decodedFixture();level.blocks.push({kind:'EX',count:1,records:[]});assert.ok(levelRequirements(level,options).some(s=>s.includes('other object families')));
 const f=fixture();f.board.walls=[{id:'wall'}];assert.throws(()=>new SourceRound(f.board,f.options),/static Child teleport composition/);
 for(const change of [{protected:true},{motion:'up-down'},{slideMask:1},{waystation:{halfIndex:0,direction:1}}]){const f=fixture();Object.assign(f.board.dots[0],change);assert.throws(()=>new SourceRound(f.board,f.options),/teleport composition|Canonical player/);}
 const f2=fixture({enemy:true});f2.board.enemies[0].program='f';f2.board.enemies[0].sourcePC=1;assert.throws(()=>new SourceRound(f2.board,f2.options),/static Child teleport composition/);
});

test('black fader presentation selects type6 artwork without changing stored source state or NPC frames',()=>{
 const f={actor:'player',frame:9};assert.equal(presentedFaderFrame(f,false),9);assert.equal(presentedFaderFrame(f,true),57);assert.equal(f.frame,9);
 assert.equal(presentedFaderFrame({actor:'red',frame:9},true),9);assert.equal(presentedFaderFrame({actor:'player',frame:49},true),49);
});

test('first HY family rejects initial HY or special pivots for either source human specification',()=>{
 for(const slot of [0,1]){
  const {level,options}=decodedFixture();level.blocks[1].records[slot].gridPosition.column=1;
  assert.ok(levelRequirements(level,options).includes('teleports require ordinary non-HY non-goal human starts'));
  assert.throws(()=>buildDecodedBoard(level,options),/ordinary non-HY non-goal human starts/);
 }
 for(const flags of [3,5,9]){
  const {level,options}=decodedFixture();level.cells[0].flagsRaw=flags;
  assert.ok(levelRequirements(level,options).includes('teleports require ordinary non-HY non-goal human starts'));
 }
 const {level,options}=decodedFixture();level.cells[0].flagsRaw=0x4001;assert.deepEqual(levelRequirements(level,options),[]);
 const board=buildDecodedBoard(level,options);assert.deepEqual(board.teleportHumanStarts,['0,0','0,0']);
});

test('normalized HY round requires both declared human starts to remain ordinary and outside HY endpoints',()=>{
 for(const slot of [0,1]){
  const {board,options}=fixture();board.teleportHumanStarts[slot]='b';if(slot===0)board.player.pivot='b';
  assert.throws(()=>new SourceRound(board,options),/ordinary non-HY non-goal human starts/);
 }
 for(const change of [{kind:'goal'},{kind:'bonus',bonus:true},{ring:true}]){
  const {board,options}=fixture();Object.assign(board.dots[0],change);
  assert.throws(()=>new SourceRound(board,options),/ordinary non-HY non-goal human starts/);
 }
 const {board,options}=fixture();delete board.teleportHumanStarts;assert.throws(()=>new SourceRound(board,options),/ordinary non-HY non-goal human starts/);
});
