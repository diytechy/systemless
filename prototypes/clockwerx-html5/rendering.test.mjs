import assert from 'node:assert/strict';
import test from 'node:test';
import {handPoses,renderAngle,resizeCanvas,presentedAngle,atlasFrame,resolveSceneProfiles,difficultyDotPaint} from './rendering.mjs';
import {MovementGame,TAU} from './engine.mjs';

test('scene profiles prefer local frames and fill missing artwork and fuse routes from other scenes',async()=>{
 const localRoute={kind:1},sharedRoute={kind:2};
 const reference={outlinesFile:'preferred',oilOutlinesFile:'missing',bombRoutes:[localRoute]};
 const manifest={scenes:[{levelDefinition:{outlinesFile:'shared',oilOutlinesFile:'oil',bombRoutes:[{kind:1},sharedRoute]}}],
  oilBaseline:{bounds:{left:4,top:8,right:540,bottom:400}}};
 const profiles={
  preferred:{groups:{700:{frames:['preferred']}}},
  shared:{groups:{700:{frames:['shared','second']},3500:{frames:['rotating spike']}}},
  oil:{groups:{1200:{frames:['puddle']}}},
 };
 const board={multiDifficulty:true,bombs:[{kind:1},{kind:2}],puddles:[{}]};
 const result=await resolveSceneProfiles(manifest,reference,board,file=>profiles[file]);
 assert.deepEqual(result.outlines.groups[700].frames,['preferred','second']);
 assert.deepEqual(result.outlines.groups[3500].frames,['rotating spike']);
 assert.deepEqual(result.oilOutlines.groups[1200].frames,['puddle']);
 assert.equal(result.dotOutlines,undefined);
 assert.deepEqual(result.bombRoutes,[localRoute,sharedRoute]);
 assert.equal(result.oilBounds,manifest.oilBaseline.bounds);
});

test('a missing higher-difficulty ring color still uses the corresponding animation frame',()=>{
 const vector={specialDots:{300:{file:'ring',frames:[{frame:25,x:7,y:10}]}}};
 assert.equal(difficultyDotPaint(vector,300,60,{ring:true,color:5}).frame,25);
});
const animation={type:'atlas',frameWidth:18,frameHeight:18,frameCount:6,frameSeconds:1.25/24};
assert.deepEqual(atlasFrame(animation,0),{x:0,y:0,width:18,height:18});
assert.equal(atlasFrame(animation,animation.frameSeconds*.99).x,0);
assert.equal(atlasFrame(animation,animation.frameSeconds*1.01).x,18,'advance at the configured cadence');
assert.equal(atlasFrame(animation,animation.frameSeconds*6).x,0,'six phases loop');
assert.equal(atlasFrame({...animation,frameOrder:[2,1,0]},animation.frameSeconds*1.01).x,18);
assert.throws(()=>atlasFrame({...animation,frameSeconds:0},1),/Invalid animation/);
assert.throws(()=>atlasFrame({...animation,frameOrder:[6]},1),/Invalid animation frame order/);
assert.equal(atlasFrame(null,1),null,'static/legacy artwork remains supported');

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
