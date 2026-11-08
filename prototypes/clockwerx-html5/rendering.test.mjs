import assert from 'node:assert/strict';
import {handPoses,renderAngle,resizeCanvas,presentedAngle} from './rendering.mjs';
import {MovementGame,TAU} from './engine.mjs';

const previous={pivot:'a',angle:TAU-.01,direction:1};
const current={pivot:'a',angle:.01,direction:1};
assert.ok(Math.abs(renderAngle(current,previous,.5)-TAU)<1e-12,'interpolate across angle wrap via shortest arc');
assert.equal(renderAngle({...current,pivot:'b'},previous,.5),.01,'never interpolate through empty space after a pivot transfer');
assert.equal(renderAngle({...current,direction:-1},previous,.5),.01,'reversal is authoritative immediately');
assert.ok(renderAngle(current,previous,.25)!==renderAngle(current,previous,.75),'sub-step poses must not be rounded to64 directions');
assert.equal(presentedAngle({angle:TAU+.01},null,0,false),0,'bitmap wraps into its actual nearest direction');
assert.equal(presentedAngle({angle:TAU/64*.6},null,0,false),TAU/64,'bitmap reports the selected frame angle');
assert.equal(presentedAngle(current,previous,.5,true),renderAngle(current,previous,.5),'diagnostics use the submitted SVG pose');

const board={radius:48,distanceTolerance:1,angularSpeed:TAU,dots:[{id:'a',x:0,y:0},{id:'b',x:48,y:0,kind:'goal'}],player:{name:'player',pivot:'a',angle:-.1,direction:1},demos:[]};
const game=new MovementGame(board),before=game.snapshot(),poses=handPoses(game);
renderAngle(game.player,poses.player,.5);
assert.deepEqual(game.snapshot(),before,'render interpolation must not mutate gameplay or events');
game.update(.02,{swing:true});
assert.equal(game.complete,true);assert.equal(game.player.pivot,'b');
assert.equal(renderAngle(game.player,poses.player,.5),game.player.angle,'completed transfer draws from the new pivot');
console.log('PASS: wrap, continuous sub-step poses, transfer/reversal boundaries and simulation isolation.');
const canvas={width:640,height:480,getBoundingClientRect:()=>({width:640})};
assert.deepEqual(resizeCanvas(canvas,2),{scaleX:2,scaleY:2});
assert.deepEqual([canvas.width,canvas.height],[1280,960],'HiDPI changes presentation backing, not game coordinates');
assert.deepEqual(resizeCanvas(canvas,20),{scaleX:4,scaleY:4},'bound backing allocation for extreme zoom/density');
