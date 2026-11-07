import test from 'node:test';
import assert from 'node:assert/strict';
import { keysForPad, PadKeys } from './koji-controls.mjs';
const pad = (buttons=[], x=0) => ({ mapping:'standard', axes:[x], buttons:Array.from({length:16}, (_,i)=>({pressed:buttons.includes(i)})) });
test('standard controller maps simultaneous movement, jump and tongue', () => {
  assert.deepEqual([...keysForPad(pad([0,2,14]))].sort(), [' ', 'i', 'j']);
  assert.deepEqual([...keysForPad(pad([3,4,5,9]))].sort(), ['k','o','p','u']);
  assert.deepEqual([...keysForPad(pad([],0.2))], []);
  assert.deepEqual([...keysForPad(pad([],0.8))], ['l']);
  assert.equal(keysForPad({...pad([0]),mapping:''}).size, 0);
});
test('held inputs do not repeat; disconnect releases every held key', () => {
  const events=[]; const state=new PadKeys((type,key)=>events.push([type,key]));
  state.update(keysForPad(pad([0,14])));
  state.update(keysForPad(pad([0,14])));
  assert.equal(events.length,2);
  state.update(keysForPad(pad([15])));
  assert.deepEqual(events.slice(2), [['keyup','j'],['keyup','i'],['keydown','l']]);
  state.release(); state.release();
  assert.deepEqual(events.at(-1), ['keyup','l']);
  assert.equal(events.length,6);
});
