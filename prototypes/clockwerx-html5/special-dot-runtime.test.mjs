import test from 'node:test';import assert from 'node:assert/strict';
import {StaticDotRuntime} from './special-dot-runtime.mjs';
const create=()=>{
 const dots=[{id:'start'},{id:'ring',ring:true,color:0},{id:'a',waystation:{halfIndex:24,direction:-1}},{id:'b',waystation:{halfIndex:8,direction:1},protected:true}];
 return new StaticDotRuntime(dots,{pivot:'start',angle:0,direction:1},{originalTime:90});
};
test('ring release denies human actions before the synchronous occupant hook',()=>{
 const s=create(),seen=[];const result=s.humanRelease('ring',{releasingActor:'hero',orphanOccupants:(id,actor)=>seen.push([id,actor,s.dot(id).humanCanGrab])});
 assert.equal(result.changed,true);assert.deepEqual(seen,[['ring','hero',false]]);
 assert.equal(s.dot('ring').nonhumanCanGrab,true);
 for(let c=1;c<=6;c++)s.observeClocks({dotCount:c,overlayCount:0,guestTick:100+c});
 assert.equal(s.renderState('ring').main.visible,false);assert.equal(s.dot('ring').sourceCollidable,false);
 assert.equal(s.dot('ring').nonhumanCanGrab,true);
});
test('checkpoint retains only saved spawn/time while reset restores transient dots',()=>{
 const s=create();assert.equal(s.humanGrab('a',73).checkpointChanged,true);
 assert.equal(s.humanGrab('a',50).checkpointChanged,false);assert.equal(s.savedTime,73);
 s.humanRelease('ring',{orphanOccupants:()=>{}});
 const reset=s.reset({dotCount:100,overlayCount:80});assert.deepEqual([reset.player.pivot,reset.player.direction,reset.remainingTime],['a',-1,73]);
 assert.equal(reset.player.angle,Math.PI*1.5);assert.equal(s.dot('ring').humanCanGrab,true);
 assert.equal(s.selectedCheckpoint,null);assert.equal(s.renderState('a').main.frame,79);
 assert.equal(s.humanGrab('a',73).checkpointChanged,false);assert.equal(s.renderState('a').main.attached,true);
 assert.equal(s.reset({restartLevel:true}).player.pivot,'start');assert.equal(s.savedTime,90);
});
test('selecting another checkpoint resets old animation and protection has a separate clock',()=>{
 const s=create();s.humanGrab('a',90);s.observeClocks({dotCount:1,overlayCount:0,guestTick:10});
 assert.equal(s.renderState('a').main.frame,80);assert.deepEqual(s.humanGrab('b',90).sounds,[23,46]);
 assert.equal(s.renderState('a').main.frame,79);assert.equal(s.renderState('a').main.attached,false);
 s.observeClocks({dotCount:1,overlayCount:5,guestTick:11});assert.equal(s.renderState('b').main.frame,79);
 assert.equal(s.renderState('b').overlay.frame,118);assert.equal(s.savedSpawn.angle,Math.PI/2);
});

test('ordinary round reset retains checkpoint frame and protection phase across frozen clocks',()=>{
 const s=create();s.humanGrab('a',90);
 for(let c=1;c<=10;c++)s.observeClocks({dotCount:c,overlayCount:c,guestTick:c*5});
 assert.equal(s.renderState('a').main.frame,89);assert.equal(s.renderState('b').overlay.frame,121);
 s.reset({dotCount:99,overlayCount:77});
 assert.equal(s.renderState('a').main.frame,89);assert.equal(s.renderState('a').main.attached,false);
 assert.equal(s.renderState('b').overlay.frame,121);
 s.humanGrab('a',90);s.observeClocks({dotCount:99,overlayCount:77,guestTick:200});
 assert.equal(s.renderState('a').main.frame,89);assert.equal(s.renderState('b').overlay.frame,120);
 s.observeClocks({dotCount:100,overlayCount:77,guestTick:201});assert.equal(s.renderState('a').main.frame,79);
 s.reset({restartLevel:true});assert.equal(s.savedSpawn.pivot,'start');assert.equal(s.renderState('b').overlay.frame,120);
});

test('explicit restart additionally resets the selected checkpoint before the ordinary dot reset',()=>{
 const s=create();s.humanGrab('b',90);for(let c=1;c<=10;c++)s.observeClocks({dotCount:c,overlayCount:c,guestTick:c*5});
 assert.equal(s.renderState('b').main.frame,89);assert.equal(s.renderState('b').overlay.frame,121);
 const reset=s.reset({restartLevel:true,dotCount:100,overlayCount:100});
 assert.equal(reset.player.pivot,'start');assert.equal(s.renderState('b').main.frame,79);
 assert.equal(s.renderState('b').main.attached,false);assert.equal(s.renderState('b').overlay.frame,121);
});
