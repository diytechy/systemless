import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceRound,sourceFrame,worldOutline} from './round.mjs';
import {TAU} from './engine.mjs';

function fixture(){
 const rectangle={left:-1,top:-1,right:1,bottom:1,rows:null};
 const frames=()=>Array.from({length:64},()=>({...rectangle}));
 const outlines={groups:{700:{frames:frames()},4400:{frames:frames()},200:{frames:frames().slice(0,4)}}};
 const board={radius:48,distanceTolerance:1,angularSpeed:TAU,
  dots:[{id:'a',x:0,y:0,kind:'dot'},{id:'b',x:48,y:0,kind:'bonus'}],
  player:{name:'player',pivot:'a',angle:0,direction:1,group:700},demos:[],
  enemies:[{name:'enemy',pivot:'b',angle:0,direction:-1,group:4400}],
  spikes:[{id:0,x:48,y:0,phase:0}]};
 const deathFactory=()=>{let n=0;return {update(ticks){n+=ticks;},get complete(){return n>=6;},snapshot(){return []}}};
 return {board,options:{outlines,deathFactory}};
}

function canonicalFixture(){
 const f=fixture();Object.assign(f.board,{canonicalPlayerRules:true,staticEnemyCallbacks:true,enemies:[],spikes:[]});
 Object.assign(f.board.player,{sourceActorType:0,speedClass:0});return f;
}
function canonicalOilFixture(){
 const f=canonicalFixture();Object.assign(f.board,{canonicalOilRules:true,specialDotRules:true,childScoreRules:true,difficulty:'Child',timeLimit:90,origin:{x:0,y:0},sourceDotPermissions:true,puddles:[{row:0,column:0,kind:1}]});
 f.board.dots.forEach((d,i)=>Object.assign(d,{sourceIndex:i,cell:1,flags:15,color:0,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,motion:'static',slideMask:0,teleport:false}));
 const frame={left:0,top:0,right:1,bottom:1,rows:null,outlineIndex:0,flipY:false};
 f.options.oilOutlines={groups:{1200:{frames:Array.from({length:52},()=>({...frame}))},2200:{frames:Array.from({length:107},()=>({...frame}))}}};
 f.options.dotOutlines={groups:{300:{frames:Array.from({length:17},()=>({...frame}))}}};f.options.oilBounds={left:-100,top:-100,right:500,bottom:500};return f;
}
function elevatorFixture(){
 const f=canonicalFixture();Object.assign(f.board,{elevatorRules:true,specialDotRules:true,childScoreRules:true,difficulty:'Child',timeLimit:90,origin:{x:12,y:11},sourceDotPermissions:true,elevators:[{row:0,column:0,subcell:3,group:1}]});
 f.board.dots.forEach((d,i)=>Object.assign(d,{sourceIndex:i,cell:1,flags:15,color:0,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,motion:'static',slideMask:0,teleport:false,kind:'dot'}));
 Object.assign(f.board.dots[0],{motion:'up-down',upDown:{group:1,initialLowered:false,x:0,y:0}});
 const shape={left:-1,top:-1,right:1,bottom:1,rows:null,outlineIndex:0,flipY:false};f.options.elevatorOutlines={groups:{3400:{frames:Array.from({length:9},()=>shape)}}};return f;
}

test('a lowering pivot carries the human to death and a natural restart restores dot/control state',()=>{
 const {board,options}=elevatorFixture(),g=new SourceRound(board,options);
 for(let i=0;i<2000&&!g.death;i++)g.update(1/120);
 assert.deepEqual(g.events.find(e=>e.type==='death').cause,{reason:'lowered-dot',sourceReason:38,object:'a'});assert.equal(g.point(g.player).x,-12);assert.equal(g.point(g.player).y,12);assert.equal(g.complete,false);
 for(let i=0;i<1000&&!g.roundRestarts;i++)g.update(1/120);
 assert.equal(g.roundRestarts,1);assert.equal(g.player.pivot,'a');assert.equal(g.point(g.player).x,0);assert.equal(g.point(g.player).y,0);assert.equal(g.point(g.player).humanCanGrab,true);assert.equal(g.elevators.snapshot().controls[0].occupants,0);
});

test('qualified group0 lowering updates Oil acquisition pixels and actor availability together',()=>{
 const {board,options}=elevatorFixture(),oil=canonicalOilFixture();
 Object.assign(board,{elevatorOilSpikeRules:true,canonicalOilRules:true,puddles:[{row:0,column:0,kind:3}],spikes:[{id:'far',x:200,y:200,phase:0}]});
 Object.assign(options,{oilOutlines:oil.options.oilOutlines,dotOutlines:oil.options.dotOutlines,oilBounds:oil.options.oilBounds});
 Object.assign(board.elevators[0],{group:0,subcell:2});board.dots[0].upDown.group=0;
 const g=new SourceRound(board,options);g.elevators.contact('test actor',0);
 for(let i=0;i<100&&g.board.dots[0].humanCanGrab;i++)g.update(1/120);
 assert.equal(g.board.dots[0].humanCanGrab,false);assert.equal(g.board.dots[0].nonhumanCanGrab,true);assert.ok(g.board.dots[0].x<0);
 const pixel=g.oil.pixel(0);assert.equal(g.oil.acquireDot(pixel).index,0);assert.deepEqual(g.oil.acquireDot(pixel).pixel,{x:g.board.dots[0].x-16,y:g.board.dots[0].y-15});
 board.puddles[0].kind=2;assert.throws(()=>new SourceRound(board,options),/Separate group0 elevators/);
});

test('qualified static spikes kill before an overlapping dormant Oil puddle wakes',()=>{
 const {board,options}=canonicalOilFixture();board.puddles[0].kind=2;board.spikes=[{id:'spike',x:0,y:0,phase:0}];
 assert.throws(()=>new SourceRound(board,options),/Canonical Oil requires/);
 board.canonicalOilSpikeRules=true;
 options.oilOutlines.groups['1200'].frames.forEach(f=>Object.assign(f,{left:-50,top:-50,right:50,bottom:50}));
 const g=new SourceRound(board,options);for(let i=0;i<100&&!g.death;i++)g.update(1/120);
 assert.equal(g.events.find(e=>e.type==='death').cause.reason,'spike');assert.equal(g.oil.puddles[0].triggered,false);
 board.puddles[0].kind=1;assert.throws(()=>new SourceRound(board,options),/Qualified kind2 Oil/);
});

test('canonical Oil arrival death precedes goal and score effects',()=>{
 const {board,options}=canonicalOilFixture();board.dots[1].kind='goal';const g=new SourceRound(board,options);
 g.oil.createDroplet(1,{onDeath:()=>assert.fail('The initial human is on the other dot'),isFrozen:()=>false});
 for(let i=0;i<100&&!g.death;i++)g.update(1/120,{flip:true});
 assert.equal(g.player.pivot,'b');assert.equal(g.player.transfers,1);assert.equal(g.complete,false);assert.equal(g.childScore.snapshot().overallEarned,0);
 assert.deepEqual(g.events.find(e=>e.type==='death').cause,{reason:'oil',sourceReason:10,object:'b'});assert.equal(g.events.some(e=>['goal','bonus'].includes(e.type)),false);
});

test('Oil reset follows the restored checkpoint and explicit restart follows the original spawn',()=>{
 const {board,options}=canonicalOilFixture();Object.assign(board.dots[1],{kind:'dot',cell:0x4011,waystation:{halfIndex:12,direction:-1}});const g=new SourceRound(board,options);
 for(let i=0;i<100&&g.player.pivot!=='b';i++)g.update(1/120,{flip:true});assert.equal(g.player.pivot,'b');assert.equal(g.oil.heroPivot,1);const now=g.oil.now;
 g.oil.createDroplet(1,{onDeath:()=>{},isFrozen:()=>false});assert.equal(g.oil.droplets.length,1);
 g.reset({preserveCheckpoint:true});assert.equal(g.player.pivot,'b');assert.equal(g.player.frame,24);assert.equal(g.oil.heroPivot,1);assert.equal(g.oil.now,now);assert.equal(g.oil.droplets.length,0);assert.equal(g.death,null);
 g.reset();assert.equal(g.player.pivot,'a');assert.equal(g.oil.heroPivot,0);assert.equal(g.oil.now,now);
});

test('a separately qualified slow red hand bounces from a wall without activating Oil',()=>{
 const {board,options}=canonicalOilFixture();
 board.enemies=[{name:'red',pivot:'b',angle:0,direction:1,sourceActorType:1,speedClass:4,group:500,program:null,canonicalFrame:true,frame:0,unwrappedFrame:0,checksWalls:true,visible:true,orphaned:false}];
 const near={left:-1,top:-1,right:1,bottom:1,rows:null},far={left:20,top:-1,right:22,bottom:1,rows:null};
 options.outlines.groups['500']={frames:Array.from({length:64},(_,i)=>({...((i===1)?near:far)}))};options.outlines.groups['800']={frames:[near]};board.walls=[{id:'w',x:48,y:0,frame:0}];
 assert.throws(()=>new SourceRound(board,options),/qualified static Child/);board.staticEnemyWallRules=true;
 const g=new SourceRound(board,options),enemy=g.enemies[0];g.animateStaticEnemy(enemy,3,{remainder:0,multiplier:1,divisor:8},{remaining:38,clientRemainder:0},true);
 assert.equal(enemy.frame,63);assert.equal(enemy.direction,-1);assert.equal(g.oil.puddles[0].triggered,false);assert.equal(g.oil.heroPivot,0);assert.equal(g.death,null);assert.equal(g.events.filter(e=>e.type==='enemy-wall-bounce').length,1);
});

test('canonical player waits for source callbacks and smooth drawing cannot choose its collision frame',()=>{
 const {board,options}=canonicalFixture(),g=new SourceRound(board,options);let fractional=false,callbacks=0;
 for(let i=0;i<240;i++){
  const previous=g.player.frame;g.update(1/120);
  const delta=g.actorClasses.snapshot().classes[0].delta;callbacks+=delta;
  assert.equal(g.player.frame,(previous+delta)&63);
  fractional||=Math.abs(g.player.angle*64/TAU-g.player.unwrappedFrame)>1e-6;
  assert.deepEqual(g.collider(g.player),worldOutline(options.outlines,700,g.player.frame,g.point(g.player)));
 }
 assert.ok(fractional);assert.ok(callbacks>0&&callbacks<240);
});
test('canonical grabs test the current cardinal frame and goal stops before animation',()=>{
 const {board,options}=canonicalFixture();board.dots[1].kind='goal';const g=new SourceRound(board,options);
 for(let i=0;i<100&&!g.complete;i++)g.update(1/120,{flip:true});
 assert.equal(g.complete,true);assert.equal(g.player.transfers,1);assert.equal(g.player.pivot,'b');
 assert.equal(g.player.frame,32);assert.equal(g.player.angle,Math.PI);
 const stopped=g.snapshot();g.update(1/120,{flip:true});assert.deepEqual(g.player,stopped.player);
});
test('canonical Reverse is consumed after direction requests and a successful grab wins',()=>{
 const {board,options}=canonicalFixture(),g=new SourceRound(board,options);
 for(let i=0;i<100&&!g.player.transfers;i++)g.update(1/120,{flip:true,reverse:true});
 assert.equal(g.player.transfers,1);assert.equal(g.player.direction,1);assert.equal(g.pendingReverse,false);
 assert.equal(g.events.some(e=>e.type==='reverse'),false);assert.equal(g.player.frame,33);
});
test('canonical wall bounce retains the logical pose and drops a colliding Reverse request',()=>{
 const {board,options}=canonicalFixture(),g=new SourceRound(board,options);g.wallCollision=()=>({id:0});
 for(let i=0;i<100&&!g.events.some(e=>e.type==='wall-bounce');i++)g.update(1/120,{reverse:true});
 assert.equal(g.player.direction,-1);assert.equal(g.player.frame,63);assert.equal(g.pendingReverse,false);
 assert.equal(g.events.some(e=>e.type==='reverse'),false);
});
test('canonical fresh reset restores logical frames and rejects future sliding scope',()=>{
 const {board,options}=canonicalFixture(),g=new SourceRound(board,options);
 for(let i=0;i<120;i++)g.update(1/120);assert.notEqual(g.player.frame,0);g.reset();
 assert.equal(g.player.frame,0);assert.equal(g.player.unwrappedFrame,0);assert.equal(g.player.presentationPhase,0);
 board.dots[0].slideMask=1;assert.throws(()=>new SourceRound(board,options),/without sliding/);
});

test('rotating spike contact bypasses ordinary protection with WA death reason0',()=>{
 const {board,options}=fixture();board.spikes=[];board.rotatingSpikeRules=true;board.staticEnemyCallbacks=true;
 board.dots[0].protected=true;
 const enemy=board.enemies[0];Object.assign(enemy,{sourceActorType:4,group:3500,canonicalFrame:true,frame:8,unwrappedFrame:8,speedClass:1,checksWalls:false,program:null});
 options.outlines.groups['3500']={frames:Array.from({length:64},()=>({left:-49,top:-1,right:-47,bottom:1,rows:null}))};
 const g=new SourceRound(board,options);assert.deepEqual(g.enemyCollision(),{reason:'enemy',object:'enemy',sourceReason:0});
 g.update(1/120);assert.equal(g.death!==null,true);assert.equal(g.events.at(-1).cause.sourceReason,0);
 enemy.sourceActorType=2;enemy.group=4400;options.outlines.groups['4400']=options.outlines.groups['3500'];
 assert.equal(new SourceRound(board,options).enemyCollision(),null);
});

test('rotating spikes suppress ordinary switch hooks and require qualified source outlines',()=>{
 const {board,options}=fixture();board.spikes=[];board.rotatingSpikeRules=true;board.staticEnemyCallbacks=true;
 Object.assign(board.enemies[0],{sourceActorType:4,group:3500,canonicalFrame:true,frame:8,unwrappedFrame:8,speedClass:1,checksWalls:false});
 assert.throws(()=>new SourceRound(board,options),/Rotating spike/);
 options.outlines.groups['3500']=options.outlines.groups['4400'];
 const g=new SourceRound(board,options);let calls=0;
 g.board.switches=[{x:48,y:0}];g.doorOutlines={groups:{1000:{frames:[{left:-1,top:-1,right:1,bottom:1,rows:null}]}}};
 g.doorSystem={snapshot:()=>({switches:[{frame:0}]}),contact:()=>{calls++;return [];}};
 g.contactSwitch(g.enemies[0]);assert.equal(calls,0);
 g.enemies[0].sourceActorType=2;g.contactSwitch(g.enemies[0]);assert.equal(calls,1);
});

test('rotating spike sprite processing cannot ignite ordinary matches',()=>{
 const {board,options}=fixture();board.spikes=[];board.rotatingSpikeRules=true;board.staticEnemyCallbacks=true;
 Object.assign(board.enemies[0],{sourceActorType:4,group:3500,canonicalFrame:true,frame:8,unwrappedFrame:8,speedClass:1,checksWalls:false,program:null});
 options.outlines.groups['3500']=options.outlines.groups['4400'];
 const g=new SourceRound(board,options),seen=[];
 g.bombScene={advanceClocks(){},processUpper(){},processExplosions(){},processEffects(){},runtime:{checkMatch(h){seen.push(h.name);},checkGoodie(){},checkSpark(){}}};
 g.update(1/120);assert.deepEqual(seen,[]);
 g.enemies[0].sourceActorType=2;g.update(1/120);assert.deepEqual(seen,['enemy']);
});

test('qualified combined goal latches completion before the same grab bonus',()=>{
 const {board,options}=fixture();board.spikes=[];board.enemies=[];board.childScoreRules=true;board.combinedGoalBonusRules=true;
 Object.assign(board.dots[1],{kind:'goal',bonus:true});
 const g=new SourceRound(board,options);g.update(1/120,{flip:true});
 assert.equal(g.complete,true);assert.deepEqual(g.events.filter(e=>['goal','bonus'].includes(e.type)).map(e=>e.type),['goal','bonus']);
 assert.equal(board.dots[1].collected,true);assert.equal(g.childScore.snapshot().overallEarned,2000);assert.equal(g.events.at(-1).points,1000);
 assert.equal(g.childScore.nextDotAward,2000);g.update(1/120,{flip:true});assert.equal(g.childScore.snapshot().overallEarned,2000);
});

test('latched grab death blocks combined goal and bonus effects',()=>{
 const {board,options}=fixture();board.spikes=[];board.enemies=[];board.childScoreRules=true;board.combinedGoalBonusRules=true;
 Object.assign(board.dots[1],{kind:'goal',bonus:true});const g=new SourceRound(board,options);
 g.onHumanGrab=()=>{g.beginDeath({reason:'fixture-grab-death'});return false;};g.update(1/120,{flip:true});
 assert.equal(g.complete,false);assert.equal(g.childScore.snapshot().overallEarned,0);assert.equal(board.dots[1].collected,undefined);
 assert.equal(g.events.some(e=>['goal','bonus'].includes(e.type)),false);
});
test('source frame lattice wraps negative and positive continuous angles',()=>{
 assert.equal(sourceFrame(0),0);assert.equal(sourceFrame(TAU),0);
 assert.equal(sourceFrame(-TAU/64),63);assert.equal(sourceFrame(TAU*.75),48);
});
test('source outline placement preserves integer per-axis bounds and reflection',()=>{
 const {options}=fixture();const c=worldOutline(options.outlines,700,0,{x:74,y:72});
 assert.deepEqual([c.left,c.top,c.right,c.bottom],[73,71,75,73]);
 assert.throws(()=>worldOutline(options.outlines,500,0,{x:0,y:0}),/Missing qualified/);
});
test('opted-in Child scores commit after a real spike death and fresh play clears both counters',()=>{
 const {board,options}=fixture();board.childScoreRules=true;board.enemies=[];const g=new SourceRound(board,options);
 g.update(1/120,{flip:true});assert.equal(g.childScore.roundBonus,1000);assert.equal(g.events.find(e=>e.type==='bonus').points,1000);
 for(let i=0;i<80&&!g.roundRestarts;i++)g.update(1/120);
 assert.equal(g.roundRestarts,1);assert.equal(g.events.find(e=>e.type==='death').cause.reason,'spike');assert.equal(g.childScore.totalCommitted,1000);assert.equal(g.childScore.roundBonus,0);assert.equal(g.childScore.nextDotAward,1000);
 g.reset();assert.equal(g.childScore.totalCommitted,0);assert.equal(g.childScore.roundBonus,0);
});
test('single-player death freezes actors then resets actors and bonuses after the effect',()=>{
 const {board,options}=fixture();const g=new SourceRound(board,options);
 g.player.pivot='b';board.dots[1].collected=true;
 const enemyBefore=g.enemies[0].angle;g.update(1/120);
 assert.equal(g.death!==null,true);assert.equal(g.snapshot().events.at(-1).cause.reason,'enemy');
 const frozen=g.player.angle,enemyFrozen=g.enemies[0].angle,clockBefore=g.deathClock.snapshot();
 g.reverse();g.update(1/120,{swing:true});assert.equal(g.player.angle,frozen);assert.equal(g.enemies[0].angle,enemyFrozen);
 assert.equal(board.dots[1].collected,true);
 for(let i=0;i<20&&g.roundRestarts===0;i++)g.update(1/120,{swing:true});
 assert.equal(g.player.pivot,'a');assert.equal(g.roundRestarts,1);assert.equal(board.dots[1].collected,undefined);
 assert.equal(g.enemies[0].angle,enemyBefore);assert.equal(g.time,0);assert.ok(g.elapsedTime>0);
 assert.ok(g.deathClock.snapshot().guestTick>clockBefore.guestTick);
 assert.equal(g.events.at(-1).type,'round-reset');
 g.reset();assert.equal(board.dots[1].collected,undefined);assert.equal(g.roundRestarts,0);
 assert.equal(g.enemies[0].angle,enemyBefore);
});
test('wall trapping counts source-class contacts rather than 120Hz updates',()=>{
 const {board,options}=fixture();board.enemies=[];board.spikes=[];board.player.checksWalls=true;
 board.walls=[{id:'w',x:0,y:0,frame:0}];
 options.outlines.groups['800']={frames:[{left:-1,top:-1,right:1,bottom:1,rows:null}]};
 const g=new SourceRound(board,options);
 for(let i=0;i<12;i++)g.update(1/120);
 assert.equal(g.player.wallContacts,0);
 for(let i=0;i<100&&!g.death;i++)g.update(1/120);
 assert.equal(g.player.wallContacts,4);assert.ok(g.elapsedTime>.25);
 assert.equal(g.events.at(-1).cause.reason,'trapped-wall');
});
test('smooth fractional phase cannot repeat the same wall pose into a false trap',()=>{
 const {board,options}=fixture();board.enemies=[];board.spikes=[];board.player.checksWalls=true;
 board.angularSpeed=TAU*960/(76*64);board.player.angle=(54+.84)*TAU/64;
 board.walls=[{id:'w',x:0,y:0,frame:0}];
 const near={left:-1,top:-1,right:1,bottom:1,rows:null},far={left:20,top:-1,right:22,bottom:1,rows:null};
 options.outlines.groups['700'].frames=Array.from({length:64},(_,i)=>({...([54,55].includes(i)?near:far)}));
 options.outlines.groups['800']={frames:[near]};
 const g=new SourceRound(board,options);g.actorClock.advance(7);
 const contact=g.wallCollision.bind(g),poses=[];
 g.wallCollision=hand=>{const hit=contact(hand);if(hit)poses.push(sourceFrame(hand.angle));return hit;};
 for(let i=0;i<120;i++)g.update(1/120);
 assert.deepEqual(poses,[54]);assert.equal(g.death,null);assert.equal(g.roundRestarts,0);
});
test('enemy wall permission controls response independently of its color',()=>{
 for(const enabled of [false,true]){
  const {board,options}=fixture();board.spikes=[];board.enemies[0].checksWalls=enabled;
  board.walls=[{id:'w',x:48,y:0,frame:0}];
  options.outlines.groups['800']={frames:[{left:-1,top:-1,right:1,bottom:1,rows:null}]};
  const g=new SourceRound(board,options);for(let i=0;i<20;i++)g.update(1/120);
  assert.equal(g.enemies[0].direction,enabled?1:-1);
 }
});
test('missing source outline pointers remain noncollidable',()=>{
 const {options}=fixture();options.outlines.groups['800']={frames:[{left:0,top:0,right:10,bottom:10,rows:null,collidable:false}]};
 assert.equal(worldOutline(options.outlines,800,0,{x:0,y:0}),null);
 options.outlines.groups['800'].frames[0]={left:0,top:0,right:10,bottom:10,rows:null,outlineIndex:-1};
 assert.equal(worldOutline(options.outlines,800,0,{x:0,y:0}),null);
});
test('queued reverse waits for an eligible source step and wall bounce suppresses it',()=>{
 for(const wall of [false,true]){
  const {board,options}=fixture();board.enemies=[];board.spikes=[];board.player.checksWalls=true;
  if(wall){board.walls=[{id:'w',x:0,y:0,frame:0}];options.outlines.groups['800']={frames:[{left:-1,top:-1,right:1,bottom:1,rows:null}]};}
  const g=new SourceRound(board,options);g.reverse();assert.equal(g.player.direction,1);
  for(let i=0;i<20;i++)g.update(1/120);
  assert.equal(g.player.direction,-1);assert.equal(g.pendingReverse,false);
  assert.equal(g.events.some(e=>e.type==='reverse'),!wall);
 }
});
test('pause freezes shared clocks and enemy animation',()=>{
 const {board,options}=fixture();const g=new SourceRound(board,options);g.paused=true;
 const before=g.snapshot();g.update(1/120,{swing:true});
 assert.equal(g.time,before.time);assert.deepEqual(g.enemies,before.enemies);
 assert.deepEqual(g.snapshot().spikeFrames,before.spikeFrames);
});
test('gold and black use their own source collision profiles and retain the choice on reset',()=>{
 const {board,options}=fixture();board.spikes[0].x=3;board.enemies=[];
 options.outlines.groups['4300']={frames:Array.from({length:64},()=>({left:-1,top:-1,right:3,bottom:1,rows:null}))};
 const g=new SourceRound(board,options);assert.equal(g.collision(),null);
 g.setPlayerGroup(4300);assert.equal(g.collision().reason,'spike');
 g.reset();assert.equal(g.player.group,4300);assert.throws(()=>g.setPlayerGroup(500),/Unqualified/);
});

function doorFixture(){
 const f=fixture();f.board.spikes=[];f.board.enemies=[];
 const rect={left:-2,top:-2,right:2,bottom:2,rows:null};
 const empty={...rect,collidable:false};
 f.options.doorOutlines={groups:{1300:{frames:Array.from({length:88},()=>({...empty}))},
  3800:{frames:Array.from({length:88},()=>({...empty}))},
  2900:{frames:Array.from({length:12},()=>({...empty}))},1000:{frames:Array.from({length:6},()=>({...rect}))}}};
 f.board.doors=[{row:0,column:0,color:1,vertical:true,initiallyClosed:true,long:false,base:{x:0,y:0},caps:[]}];
 f.board.switches=[{row:0,column:1,subcell:0,color:1,x:48,y:0}];
 return f;
}
test('door lethal zone kills before a bounce or wall/door guard increment',()=>{
 const {board,options}=doorFixture();
 for(const group of [1300,3800])options.doorOutlines.groups[group].frames[0].collidable=true;
 const g=new SourceRound(board,options);for(let i=0;i<30&&!g.death;i++)g.update(1/120);
 assert.ok(g.death);assert.equal(g.player.wallContacts,0);
 assert.equal(g.events.at(-1).cause.reason,'door');assert.equal(g.events.some(e=>e.type==='door-bounce'),false);
});
test('ordinary enemy ignores door leaves but activates a switch at its own slower clock',()=>{
 const {board,options}=doorFixture();
 board.doors[0].base.x=48;options.doorOutlines.groups[1300].frames[0].collidable=true;
 board.enemies=[{name:'green',pivot:'b',angle:0,direction:1,group:4400,speedClass:4,divisor:8,multiplier:1,speedScale:.25}];
 const g=new SourceRound(board,options);
 for(let i=0;i<40;i++)g.update(1/120);
 assert.equal(g.doorSystem.snapshot().switches[0].occupants,0);
 for(let i=0;i<50;i++)g.update(1/120);
 assert.equal(g.doorSystem.snapshot().switches[0].occupants,1);
 assert.equal(g.enemies[0].direction,1);assert.equal(g.events.some(e=>e.type==='door-bounce'),false);
 assert.ok(Math.abs(g.enemies[0].angle-board.angularSpeed*g.elapsedTime*.25)<1e-9);
});
test('death freezes door animation; round reset restores doors and switch occupancy on the continuing clock',()=>{
 const {board,options}=doorFixture();board.switches[0].x=0;
 const g=new SourceRound(board,options);for(let i=0;i<30;i++)g.update(1/120);
 assert.equal(g.doorSystem.snapshot().switches[0].occupants,1);
 const before=g.doorSystem.snapshot();g.beginDeath({reason:'test'});
 g.update(1/120);assert.deepEqual(g.doorSystem.snapshot(),before);
 for(let i=0;i<30&&g.roundRestarts===0;i++)g.update(1/120);
 const after=g.doorSystem.snapshot();assert.equal(g.roundRestarts,1);
 assert.deepEqual(after.doors[0],{phase:0,direction:0,frame:0,secondFrame:44});assert.equal(after.switches[0].occupants,0);
 assert.ok(after.clockReference>=before.clockReference);
});

function programFixture({permission=true,renderAngle=15*TAU/64}={}){
 const f=fixture();f.board.spikes=[];
 f.board.dots.push({id:'c',x:48,y:48,kind:'dot',flags:15,nonhumanCanGrab:permission});
 f.board.enemies=[{name:'blue',pivot:'b',angle:renderAngle,direction:1,group:4400,speedClass:1,program:'bb',sourcePC:1,frame:15,unwrappedFrame:15,checksWalls:false}];
 f.options.outlines.groups['4400'].frames[16]={left:4,top:-1,right:6,bottom:1,rows:null};
 return f;
}
test('program uses canonical frame and nonhuman permission independently of display angle/color',()=>{
 const {board,options}=programFixture({renderAngle:5.5}),g=new SourceRound(board,options);
 for(let i=0;i<20;i++)g.update(1/120);
 const enemy=g.enemies[0];assert.equal(enemy.frame,16);assert.equal(enemy.direction,-1);assert.equal(enemy.sourcePC,2);
 assert.equal(g.collider(enemy).left,52);assert.notEqual(sourceFrame(enemy.angle),16);
 assert.equal(g.events.filter(e=>e.type==='program-bounce').length,1);
});
test('program display moves between canonical steps without consuming more commands',()=>{
 const {board,options}=programFixture(),g=new SourceRound(board,options);
 for(let i=0;i<16;i++)g.update(1/120);
 const before=g.enemies[0].angle;
 for(let i=0;i<5;i++)g.update(1/120);
 assert.equal(g.enemies[0].frame,16);assert.ok(g.enemies[0].angle<before);
 assert.ok(g.enemies[0].presentationPhase>=0&&g.enemies[0].presentationPhase<=1);
 assert.equal(g.enemies[0].sourcePC,2);assert.equal(g.events.filter(e=>e.type==='program-bounce').length,1);
 g.reset();assert.equal(g.enemies[0].frame,15);assert.equal(g.enemies[0].sourcePC,1);
});
test('denied cardinal target consumes a program byte without reversing',()=>{
 const {board,options}=programFixture({permission:false}),g=new SourceRound(board,options);
 for(let i=0;i<20;i++)g.update(1/120);
 assert.equal(g.enemies[0].frame,16);assert.equal(g.enemies[0].direction,1);assert.equal(g.enemies[0].sourcePC,2);
 assert.equal(g.events.some(e=>e.type==='program-bounce'),false);
});
test('round consumes each capped class delta before checking the next integer frame',()=>{
 const {board,options}=programFixture(),g=new SourceRound(board,options);
 g.actorClock.advance(17);g.update(1/120);
 assert.equal(g.actorClasses.snapshot().classes[1].delta,2);
 assert.equal(g.enemies[0].frame,15);assert.equal(g.enemies[0].direction,-1);assert.equal(g.enemies[0].sourcePC,2);
});

function specialFixture({enemy=false}={}){
 const f=fixture();f.board.specialDotRules=true;f.board.sourceDotPermissions=true;f.board.staticEnemyCallbacks=true;f.board.timeLimit=90;
 f.board.spikes=[];f.board.dots[0].ring=true;f.board.dots[0].color=0;f.board.dots[1].kind='dot';f.board.dots[1].waystation={halfIndex:24,direction:-1};
 for(const d of f.board.dots)Object.assign(d,{present:true,humanCanGrab:true,nonhumanCanGrab:true,motion:'static',slideMask:0,teleport:false});
 f.board.player.angle=-.1;f.board.enemies=enemy?[{name:'enemy',pivot:'a',group:4400,sourceActorType:2,canonicalFrame:true,frame:32,unwrappedFrame:32,angle:Math.PI,direction:1,speedClass:1,program:null,visible:true,orphaned:false,hiddenUntil:0}]:[];
 return f;
}
test('human release collapses old ring; normal death restores saved WY while explicit restart restores original spawn',()=>{
 const {board,options}=specialFixture(),g=new SourceRound(board,options);
 for(let i=0;i<3;i++)g.update(1/120,{swing:true});
 assert.equal(g.player.pivot,'b');assert.equal(board.dots[0].humanCanGrab,false);assert.equal(board.dots[0].nonhumanCanGrab,true);
 assert.equal(g.dotAnimations.renderState('a').main.frame,24);assert.equal(g.dotAnimations.savedSpawn.pivot,'b');
 g.beginDeath({reason:'contract'});for(let i=0;i<40&&!g.roundRestarts;i++)g.update(1/120);
 assert.equal(g.roundRestarts,1);assert.equal(g.player.pivot,'b');assert.equal(g.player.direction,-1);assert.equal(g.player.angle,TAU*.75);
 assert.equal(board.dots[0].humanCanGrab,true);assert.deepEqual(g.snapshot().roundTimer,{enabled:false,original:90,current:90,saved:90});
 assert.equal(g.dotAnimations.selectedCheckpoint,'b');g.reset();assert.equal(g.player.pivot,'a');assert.equal(g.dotAnimations.selectedCheckpoint,null);
});
test('ring occupant orphaning flickers only on source callbacks then hides while canonical movement continues',()=>{
 const {board,options}=specialFixture({enemy:true}),g=new SourceRound(board,options);
 for(let i=0;i<3;i++)g.update(1/120,{flip:true});
 assert.equal(g.enemies[0].orphaned,true);const deadline=g.enemies[0].orphanDeadline;
 assert.equal(deadline,g.guestTicks+25);const visible=g.enemies[0].visible;g.update(1/120);assert.equal(g.enemies[0].visible,visible);
 for(let i=0;i<160;i++)g.update(1/120);
 assert.equal(g.death,null);assert.equal(g.enemies[0].visible,false);assert.equal(g.enemies[0].orphaned,false);
 const frame=g.enemies[0].frame;for(let i=0;i<30;i++)g.update(1/120);
 assert.notEqual(g.enemies[0].frame,frame);assert.equal(g.enemies[0].visible,false);
});
test('protection skips ordinary enemy contact while spike collision remains lethal',()=>{
 const {board,options}=fixture();board.dots[0].protected=true;board.enemies[0].pivot='a';board.enemies[0].sourceActorType=2;board.enemies[0].angle=0;
 const g=new SourceRound(board,options);assert.equal(g.enemyCollision(),null);
 board.spikes[0].x=0;assert.equal(g.spikeCollision().reason,'spike');
});
test('replayed reverse queues one source-clock action per rising edge, including held inputs',()=>{
 const {board,options}=fixture();board.spikes=[];board.enemies=[];const g=new SourceRound(board,options);
 for(let i=0;i<40;i++)g.update(1/120,{reverse:true});
 assert.equal(g.events.filter(e=>e.type==='reverse').length,1);assert.equal(g.player.direction,-1);
 g.update(1/120);for(let i=0;i<20;i++)g.update(1/120,{reverse:true});
 assert.equal(g.events.filter(e=>e.type==='reverse').length,2);assert.equal(g.player.direction,1);
});

test('canonical ordinary wall response reverses each actual source pose without a human trap guard',()=>{
 const {board,options}=specialFixture({enemy:true});board.dots[0].ring=false;
 Object.assign(board.enemies[0],{pivot:'b',frame:0,unwrappedFrame:0,angle:3,direction:1,checksWalls:true});
 const near={left:-1,top:-1,right:1,bottom:1,rows:null},far={left:20,top:-1,right:22,bottom:1,rows:null};
 options.outlines.groups['4400'].frames=Array.from({length:64},(_,i)=>({...((i===1)?near:far)}));
 options.outlines.groups['800']={frames:[near]};board.walls=[{id:'w',x:48,y:0,frame:0}];
 assert.throws(()=>new SourceRound(board,options),/requires qualification/);
 board.staticEnemyWallRules=true;const g=new SourceRound(board,options),enemy=g.enemies[0];
 g.animateStaticEnemy(enemy,3,{remainder:0,multiplier:1,divisor:2},{remaining:38,clientRemainder:0},true);
 assert.equal(enemy.frame,63);assert.equal(enemy.unwrappedFrame,-1);assert.equal(enemy.direction,-1);
 assert.equal(enemy.wallContacts,0);assert.equal(g.death,null);
 assert.equal(g.events.filter(e=>e.type==='enemy-wall-bounce').length,1);
});

test('programmed wall collision reverses before the cardinal program command and transfer',()=>{
 const {board,options}=specialFixture({enemy:true});board.dots[0].ring=false;board.staticEnemyWallRules=true;
 Object.assign(board.enemies[0],{pivot:'a',frame:63,unwrappedFrame:63,angle:0,direction:1,checksWalls:true,program:'f',sourcePC:1});
 const near={left:-1,top:-1,right:1,bottom:1,rows:null},far={left:20,top:-1,right:22,bottom:1,rows:null};
 options.outlines.groups['4400'].frames=Array.from({length:64},(_,i)=>({...((i===0)?near:far)}));
 options.outlines.groups['800']={frames:[near]};board.walls=[{id:'w',x:0,y:0,frame:0}];
 const g=new SourceRound(board,options),enemy=g.enemies[0];
 g.animateStaticEnemy(enemy,1,{remainder:0,multiplier:1,divisor:2},{remaining:38,clientRemainder:0},true);
 assert.equal(enemy.pivot,'b');assert.equal(enemy.frame,32);assert.equal(enemy.direction,-1);assert.equal(enemy.sourcePC,1);
 assert.deepEqual(g.events.map(e=>e.type),['enemy-wall-bounce','program-transfer']);
});

test('GO time and flat score compose with a protected WY return while a fresh restart clears progress',()=>{
 const {board,options}=specialFixture();board.dots[0].ring=false;board.dots[1].protected=true;
 board.goodieOnlyRules=true;board.childScoreRules=true;board.origin={x:0,y:0};
 board.bombs=[];board.goodies=[{row:0,column:0,initialFrame:169}];board.walls=[];board.doors=[];board.switches=[];board.puddles=[];
 board.player.sourceActorType=0;board.player.sourceSlot=0;
 board.dots.forEach((d,i)=>Object.assign(d,{row:0,column:i,ring:false,bonus:false,sourceInBackground:false}));
 options.bombOutlines={groups:{1900:{frames:Array.from({length:17},()=>({left:-1,top:-1,right:1,bottom:1,rows:null}))}}};
 const g=new SourceRound(board,options);assert.equal(g.bombScene.runtime.goodies[0].frame,0);
 g.bombScene.runtime.collectGoodie(0,g.player);g.player.pivot='b';g.onHumanGrab(board.dots[1]);
 assert.equal(g.remainingTime,100);assert.equal(g.dotAnimations.savedTime,100);assert.equal(g.childScore.roundBonus,1000);assert.equal(g.childScore.nextDotAward,1000);
 g.restartAfterDeath();assert.equal(g.player.pivot,'b');assert.equal(g.player.direction,-1);assert.equal(g.remainingTime,100);
 assert.equal(g.childScore.totalCommitted,1000);assert.equal(g.childScore.roundBonus,0);assert.equal(g.childScore.nextDotAward,1000);
 assert.equal(g.bombScene.runtime.goodies[0].collected,false);assert.equal(g.bombScene.runtime.goodies[0].visible,true);
 const appearance=g.dotAnimations.renderState('b');assert.ok(appearance.main);assert.ok(appearance.overlay);
 g.reset();assert.equal(g.player.pivot,'a');assert.equal(g.remainingTime,90);assert.equal(g.childScore.totalCommitted,0);
});
