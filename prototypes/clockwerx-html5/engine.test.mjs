import {MovementGame,TAU} from './engine.mjs';
import {buildBoard} from './board.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
function fixture(){return {radius:48,distanceTolerance:1,angularSpeed:TAU,dots:[{id:'a',x:0,y:0,group:'p'},{id:'b',x:48,y:0,group:'p',kind:'goal'}],player:{name:'player',pivot:'a',angle:-.1,direction:1},demos:[]};}

test('Movement uses a 120-second countdown and scaled motion, and resumes play after timeout',()=>{
 const manifest={board:{cells:Array.from({length:88},()=>[1,15])}};
 const child=buildBoard(manifest),hard=buildBoard(manifest,{difficulty:'Hard'});
 assert.equal(hard.angularSpeed,child.angularSpeed*2.5);
 const game=new MovementGame(hard);
 assert.equal(game.remainingTime,120);
 game.remainingTime=11;
 for(let i=0;i<120;i++)game.update(1/120);
 assert.equal(game.remainingTime,10);
 assert.equal(game.events.at(-1).soundId,14);
 game.remainingTime=1;
 for(let i=0;i<120;i++)game.update(1/120);
 assert.equal(game.events.at(-1).cause.sourceReason,7);
 assert.ok(game.death);
 for(let i=0;game.death&&i<360;i++)game.update(1/120);
 assert.equal(game.death,null);
 assert.equal(game.player.pivot,hard.player.pivot);
 assert.equal(game.remainingTime,120);
 assert.equal(game.events.at(-1).type,'round-reset');
});
test('up/down queries require exact current pixels and preserve the cardinal transfer frame',()=>{
 const b=fixture();b.elevatorRules=true;b.sourceDotPermissions=true;Object.assign(b.player,{angle:0,canonicalFrame:true,frame:0});b.dots.forEach(d=>Object.assign(d,{present:true,humanCanGrab:true}));
 const aligned=new MovementGame(b);aligned.update(0,{flip:true});assert.equal(aligned.player.pivot,'b');assert.equal(aligned.player.angle,Math.PI);
 // A rider has moved left/down with its dot. The old rectangular query
 // falsely accepted this escape to a static neighbor; the original misses it.
 Object.assign(b.dots[0],{x:-3,y:3,humanCanGrab:false});const rider=new MovementGame(b);rider.update(0,{swing:true});assert.equal(rider.player.pivot,'a');
 Object.assign(b.dots[0],{x:0,y:0,humanCanGrab:true});b.dots[1].y=1;const offset=new MovementGame(b);offset.update(0,{flip:true});assert.equal(offset.player.pivot,'a');
 b.dots[1].y=0;b.dots[1].humanCanGrab=false;b.dots.push({id:'c',x:48,y:0,present:true,humanCanGrab:true});const first=new MovementGame(b);first.update(0,{flip:true});assert.equal(first.player.pivot,'a','first exact source match denies the query before later overlaps');
});

for(const [action,expectedPivot,expectedDirection] of [['swing','b',-1],['flip','b',1],['bounce','a',-1]]){
 const g=new MovementGame(fixture());g.update(.02,{[action]:true});assert.equal(g.player.pivot,expectedPivot);assert.equal(g.player.direction,expectedDirection);assert.equal(g.complete,action!=='bounce');
}
{
 const g=new MovementGame(fixture());g.update(.01,{swing:true});g.update(.01,{});assert.equal(g.player.pivot,'a','released action before encounter must not transfer');g.reverse();assert.equal(g.player.direction,-1);assert.equal(g.player.pivot,'a');
 g.paused=true;const before=g.snapshot();g.update(1,{flip:true});assert.equal(g.time,before.time);assert.equal(g.player.angle,before.player.angle);g.reverse();assert.equal(g.player.direction,-1);g.reset();assert.equal(g.complete,false);assert.equal(g.time,0);
}
{
 const g=new MovementGame(fixture());g.update(.02,{swing:true,bounce:true});assert.equal(g.player.direction,1,'swing+bounce combines into flip');assert.equal(g.complete,true);g.update(1,{});assert.equal(g.activeSteps,1,'completion freezes active simulation');
}
console.log('PASS: documented swing/flip/bounce/reverse semantics, early release, pause, restart, goal, combined flip.');
{
 const b=fixture();b.sourceDotPermissions=true;b.dots[1].humanCanGrab=false;
 for(const action of ['swing','flip','bounce']){const g=new MovementGame(b);g.update(.02,{[action]:true});assert.equal(g.player.pivot,'a');assert.equal(g.player.direction,1,'source bounce also requires runtime human permission');}
 b.dots[1].humanCanGrab=true;b.dots[1].flags=0;const g=new MovementGame(b),hooks=[];
 g.onHumanRelease=(d,h)=>hooks.push(['release',d.id,h.pivot,h.direction]);g.onHumanGrab=d=>hooks.push(['grab',d.id,g.player.pivot,g.player.direction]);
 g.update(.02,{swing:true});assert.deepEqual(hooks,[['release','a','a',-1],['grab','b','b',-1]]);
}
{
 const b=fixture();b.player.grabMask=0x00f0;b.dots[1].flags=0x000f;b.dots[1].kind='dot';const g=new MovementGame(b);g.update(.02,{swing:true});assert.equal(g.player.pivot,'a','inferred actor mask blocks grabbing a neighbor');
 const h=new MovementGame(b);h.update(.02,{bounce:true});assert.equal(h.player.direction,-1,'bounce reflects without grabbing a masked neighbor');
 const c=fixture();c.player.grabMask=0x000f;c.dots[1].flags=0x00ff;const p=new MovementGame(c);p.update(.02,{flip:true});assert.equal(p.player.pivot,'b','player nibble permits colored demonstration dots');
}

test('Movement creates opposite-color hands on the same start with a quarter-turn offset',()=>{
 const manifest={board:{cells:Array.from({length:88},()=>[1,15])}};
 const board=buildBoard(manifest,{players:2});
 const game=new MovementGame(board);
 assert.equal(game.player2.pivot,game.player.pivot);
 assert.equal(game.player2.angle,(game.player.angle+Math.PI/2)%TAU);
 assert.equal(game.player2.initialFrame,(board.player.initialFrame+16)&63);
 assert.equal(game.player2.direction,game.player.direction);
 assert.deepEqual([game.player2.name,game.player2.sourceSlot,game.player2.sourceActorType,game.player2.group],['player2',1,6,4300]);
 assert.equal(new MovementGame(buildBoard(manifest)).player2,null);

 game.setPlayerGroup(4300);
 game.reset();
 assert.deepEqual([game.player.group,game.player2.group],[4300,700]);
 assert.equal(board.player.group,700);
 game.reverse(1);
 assert.deepEqual([game.player.direction,game.player2.direction],[1,-1]);
 game.reverse();
 assert.deepEqual([game.player.direction,game.player2.direction],[-1,-1]);
});

test('Movement dispatches swing, flip, bounce and reverse independently through both input forms',()=>{
 for(const [action,pivot,direction] of [['swing','2,1',-1],['flip','2,1',1],['bounce','1,1',-1]]){
  const board=buildBoard({board:{cells:Array.from({length:88},()=>[1,15])}},{players:2});
  const game=new MovementGame(board);
  game.player2.angle=0;
  const before=game.player.angle;
  game.update(1/60,{}, {[action]:true});
  assert.notEqual(game.player.angle,before);
  assert.deepEqual([game.player.pivot,game.player.direction],['1,1',1]);
  assert.deepEqual([game.player2.pivot,game.player2.direction],[pivot,direction]);
  assert.ok(game.events.some(e=>e.type===action&&e.playerIndex===1&&e.hand==='player2'));
 }
 const game=new MovementGame(fixture(),{players:2});
 game.update(0,{player2:{reverse:true}});
 game.update(0,{player2:{reverse:true}});
 assert.deepEqual([game.player.direction,game.player2.direction],[1,-1]);
 game.update(0,{reverse:true,player2:{reverse:true}},{});
 assert.deepEqual([game.player.direction,game.player2.direction],[-1,-1]);
});
