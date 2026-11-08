import {MovementGame,TAU} from './engine.mjs';
import assert from 'node:assert/strict';
function fixture(){return {radius:48,distanceTolerance:1,angularSpeed:TAU,dots:[{id:'a',x:0,y:0,group:'p'},{id:'b',x:48,y:0,group:'p',kind:'goal'}],player:{name:'player',pivot:'a',angle:-.1,direction:1},demos:[]};}
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
