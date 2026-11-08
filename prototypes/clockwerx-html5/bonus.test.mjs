import test from 'node:test';
import assert from 'node:assert/strict';
import {MovementGame,TAU} from './engine.mjs';
import {buildBoard} from './board.mjs';

function board(){return {radius:48,distanceTolerance:1,angularSpeed:TAU,
 dots:[{id:'a',x:0,y:0,kind:'dot'},{id:'b',x:48,y:0,kind:'bonus'}],
 player:{name:'player',pivot:'a',angle:-.1,direction:1},demos:[]};}

test('board treats special bits independently of initial lowered flag',()=>{
 const b=buildBoard({board:{cells:[[1,15],[3,15],[5,15],[0x4001,15],[0x4003,15],[0,15]]}});
 assert.deepEqual(b.dots.map(d=>d.kind),['dot','bonus','goal','dot','bonus']);
});
test('successful player grab consumes once, revisit does not reaward, reset restores',()=>{
 const g=new MovementGame(board());g.update(.02,{swing:true});
 assert.equal(g.board.dots[1].collected,true);
 for(let i=0;i<480;i++)g.update(1/120,{swing:true});
 assert.ok(g.player.transfers>2);assert.equal(g.events.filter(e=>e.type==='bonus').length,1);
 g.reset();assert.equal(g.board.dots[1].collected,undefined);
});
test('initial occupancy and bounce preserve bonus',()=>{
 const b=board();b.player.pivot='b';const initial=new MovementGame(b);
 assert.equal(initial.board.dots[1].collected,undefined);assert.deepEqual(initial.events,[]);
 const g=new MovementGame(board());g.update(.02,{bounce:true});
 assert.equal(g.player.pivot,'a');assert.equal(g.board.dots[1].collected,undefined);
});
test('tutorial demo grabs leave bonus available for human',()=>{
 const b=board();b.player.angle=Math.PI/2;
 b.demos=[{name:'demo',pivot:'a',angle:-.1,direction:1,action:'swing'}];
 const g=new MovementGame(b);g.update(.02);
 assert.equal(g.demos[0].pivot,'b');assert.equal(g.board.dots[1].collected,undefined);
 assert.equal(g.events.some(e=>e.type==='bonus'),false);
});
