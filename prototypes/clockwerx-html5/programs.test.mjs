import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveActorProgram,programActionFlags,stepActorProgram} from './programs.mjs';
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
