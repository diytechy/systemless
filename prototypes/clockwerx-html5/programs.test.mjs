import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveActorProgram,programActionFlags,stepActorProgram,stepSourceProgram,advanceBounceEnemy} from './programs.mjs';
test('signed program references never accidentally execute stored leftovers',()=>{
  assert.equal(resolveActorProgram(-1,['s','f']),null);assert.equal(resolveActorProgram(-32768,['s']),null);
  assert.equal(resolveActorProgram(2,['s','f']),null);assert.equal(resolveActorProgram(0,['s','f']),'s');
  assert.throws(()=>resolveActorProgram(65535,['s']),TypeError);
});
test('source bytes produce independent grab/reverse flags',()=>{
  assert.deepEqual(['s','b','f','n','X'].map(programActionFlags),[
    {grab:true,reverse:false},{grab:false,reverse:true},{grab:true,reverse:true},{grab:false,reverse:false},{grab:false,reverse:false}
  ]);
});
test('only eligible callbacks consume one instruction and wrap',()=>{
  assert.deepEqual(stepActorProgram('fb',0,{frame:15}),{cursor:0,action:null});
  assert.deepEqual(stepActorProgram('fb',0,{frame:16,sliding:true}),{cursor:0,action:null});
  const a=stepActorProgram('fb',0,{frame:16});assert.equal(a.cursor,1);assert.deepEqual(a.action,{grab:true,reverse:true});
  assert.deepEqual(stepActorProgram('fb',1,{frame:32}),{cursor:0,action:{grab:false,reverse:true}});
});
test('absent program remains absent and malformed cursors fail explicitly',()=>{
  assert.deepEqual(stepActorProgram(null,0,{frame:0}),{cursor:0,action:null});
  assert.throws(()=>stepActorProgram('',0,{frame:0}),RangeError);
  assert.throws(()=>stepActorProgram('s',1,{frame:0}),RangeError);
});
test('source PC1 selects first byte; PC0 reads length, including action-valued lengths',()=>{
 assert.deepEqual(stepSourceProgram('fb',1,{frame:0}),{sourcePC:2,action:{grab:true,reverse:true}});
 assert.deepEqual(stepSourceProgram('fb',2,{frame:16}),{sourcePC:1,action:{grab:false,reverse:true}});
 assert.deepEqual(stepSourceProgram('fb',0,{frame:0}),{sourcePC:1,action:{grab:false,reverse:false}});
 for(const [length,expected]of [[98,'b'],[102,'f'],[115,'s']])assert.deepEqual(stepSourceProgram('n'.repeat(length),0,{frame:0}).action,programActionFlags(expected));
 assert.throws(()=>stepSourceProgram('b',2,{frame:0}),/Source PC/);
});
test('a two-frame class delta applies a cardinal reversal before the second inner step',()=>{
 const state={frame:15,direction:1,pivot:12,sourcePC:1},order=[];
 const result=advanceBounceEnemy(state,2,{program:'bb',afterAnimate:s=>order.push(s.frame),findTarget:s=>{order.push('query'+s.frame);return 13;}});
 assert.deepEqual(order,[16,'query16',15]);assert.equal(result.state.frame,15);assert.equal(result.state.direction,-1);
 assert.equal(result.state.sourcePC,2);assert.equal(state.direction,1);assert.equal(result.state.pivot,12);
});
test('a denied target still advances PC; no cardinal decision occurs on initial pose or renders',()=>{
 const state={frame:0,direction:1,pivot:0,sourcePC:1};let queries=0;
 const hooks={program:'bb',findTarget:()=>{queries++;return null;}};
 assert.equal(advanceBounceEnemy(state,0,hooks).state.sourcePC,1);assert.equal(queries,0);
 const result=advanceBounceEnemy(state,16,hooks);assert.equal(result.state.frame,16);assert.equal(result.state.direction,1);
 assert.equal(result.state.sourcePC,2);assert.equal(queries,1);
});
test('frame wrap and collision reversal occur before a cardinal program decision',()=>{
 const hooks={program:'b',findTarget:s=>s.frame===0?0:null};
 const result=advanceBounceEnemy({frame:63,direction:1,pivot:2,sourcePC:1},1,hooks);
 assert.equal(result.state.frame,0);assert.equal(result.state.unwrappedFrame,64);assert.equal(result.state.direction,-1);
 const reversed=advanceBounceEnemy({frame:15,direction:1,pivot:2,sourcePC:1},2,{...hooks,afterAnimate:(s,i)=>{if(i===0)s.direction*=-1;},findTarget:()=>null});
 assert.equal(reversed.state.frame,15);assert.equal(reversed.state.sourcePC,1);
});
test('bounce-only qualification rejects transfers, sliding and inconsistent canonical state',()=>{
 const state={frame:0,direction:1,pivot:1,sourcePC:1},hooks={program:'b',findTarget:()=>true};
 assert.throws(()=>advanceBounceEnemy(state,1,{...hooks,program:'s'}),/bounce programs/);
 assert.throws(()=>advanceBounceEnemy({...state,sliding:true},1,hooks),/Static/);
 assert.throws(()=>advanceBounceEnemy({...state,unwrappedFrame:1},1,hooks),/mismatch/);
 assert.throws(()=>advanceBounceEnemy({...state,sourcePC:0,frame:15},1,{...hooks,program:'b'.repeat(102)}),/transfer/);
});
