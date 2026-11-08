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
test('source frame lattice wraps negative and positive continuous angles',()=>{
 assert.equal(sourceFrame(0),0);assert.equal(sourceFrame(TAU),0);
 assert.equal(sourceFrame(-TAU/64),63);assert.equal(sourceFrame(TAU*.75),48);
});
test('source outline placement preserves integer per-axis bounds and reflection',()=>{
 const {options}=fixture();const c=worldOutline(options.outlines,700,0,{x:74,y:72});
 assert.deepEqual([c.left,c.top,c.right,c.bottom],[73,71,75,73]);
 assert.throws(()=>worldOutline(options.outlines,500,0,{x:0,y:0}),/Missing qualified/);
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
 board.enemies=[{name:'green',pivot:'b',angle:0,direction:1,group:4400,divisor:8,multiplier:1,speedScale:.25}];
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
