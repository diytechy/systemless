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
 assert.equal(g.death!==null,true);assert.equal(g.snapshot().events.at(-1).cause.reason,'spike');
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
