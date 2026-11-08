import test from 'node:test';
import assert from 'node:assert/strict';
import {createInputReplay} from './replay.mjs';
test('replay emits exact idle/action step counts then releases every input',()=>{
 const r=createInputReplay([[2,null],[1,'flip'],[2,'swing']]);
 assert.deepEqual(Array.from({length:7},()=>r.next()),[{},{},{flip:true},{swing:true},{swing:true},{},{}]);
 assert.equal(r.done,true);assert.equal(r.snapshot().step,5);
 assert.equal(r.snapshot().lastAction,null);
});
test('caller mutation cannot alter the bounded playback',()=>{
 const input=[[1,'bounce']];const r=createInputReplay(input);input[0][1]='flip';input.push([1,'swing']);
 assert.deepEqual(r.next(),{bounce:true});assert.equal(r.done,true);
});
test('invalid durations, ambiguous actions and unimplemented events fail explicitly',()=>{
 for(const input of [[],[[0,null]],[[.5,'flip']],[[1,'reverse']],[[1,'unknown']],[[1,null,2]]])
  assert.throws(()=>createInputReplay(input),TypeError);
});
