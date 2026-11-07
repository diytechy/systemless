import test from 'node:test';
import assert from 'node:assert/strict';
import {keysForPad,PadKeys,hasControllerProfile} from './game-controls.mjs';
const pad=(buttons=[],axes=[0,0])=>({mapping:'standard',axes,buttons:Array.from({length:16},(_,i)=>({pressed:buttons.includes(i)}))});
const keys=(buttons,game)=>keysForPad(pad(buttons),.35,game);
test('each game has an isolated controller profile',()=>{
 assert.deepEqual([...keys([0,2,14],'koji-personal-204')].sort(),[' ','i','j']);
 assert.deepEqual([...keys([0,1,2,3],'clockwerx-personal-10')],['Meta','Alt','Control','c']);
 assert.deepEqual([...keys([0,14],'delirium-personal-11')],['ArrowLeft','Meta']);
 assert.equal(keys([0],'unknown').size,0);
 assert.equal(hasControllerProfile('unknown'),false);
 assert.equal(hasControllerProfile('clockwerx-personal-10'),true);
 assert.equal(keysForPad({...pad([0]),mapping:''}).size,0);
});
test('ClockWerx pause chord retains a shared swing modifier and releases keys first',()=>{
 const events=[],state=new PadKeys((type,key)=>events.push([type,key]));
 state.update(keys([0],'clockwerx-personal-10'));
 state.update(keys([0,9],'clockwerx-personal-10'));
 state.update(keys([0],'clockwerx-personal-10'));
 assert.deepEqual(events,[['keydown','Meta'],['keydown','p'],['keyup','p']]);
 state.release();assert.deepEqual(events.at(-1),['keyup','Meta']);
 events.length=0;state.update(keys([9],'clockwerx-personal-10'));state.release();
 assert.deepEqual(events.slice(-2),[['keyup','p'],['keyup','Meta']]);
});
test('held input is stable; deadzone and disconnect release work',()=>{
 const events=[],state=new PadKeys((type,key)=>events.push([type,key]));
 assert.equal(keysForPad(pad([],[.2,0])).size,0);
 state.update(keys([0,14],'koji-personal-204'));state.update(keys([0,14],'koji-personal-204'));
 assert.equal(events.length,2);state.release();state.release();assert.equal(events.length,4);
});
