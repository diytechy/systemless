import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keysForPad,PadKeys,hasControllerProfile,KioskPad,EXIT_HOLD_MS} from './game-controls.mjs';
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

test('shipped library and kiosk mappings leave the SpectreLaunch buttons reserved',()=>{
 const reserved=[4,6,8,16];
 for(const id of ['koji-personal-204','clockwerx-personal-10','delirium-personal-11']){
  assert.equal(keys(reserved,id).size,0,id);
 }
 const kiosk=JSON.parse(readFileSync(new URL('../www/src/ottertube-games.json',import.meta.url),'utf8'));
 for(const [id,{pad:{buttons}}] of Object.entries(kiosk)){
  for(const index of reserved)assert.equal(buttons[index],undefined,`${id}, button ${index}`);
 }
});

// The OtterTube add-on page's adapter: the mapping is data.
const kioskMap={buttons:{0:{key:'Meta',script:'start',script_when:['menu']},1:{key:'Shift'},11:{exit:true},9:{script:'start'}},directions:['Numpad8','Numpad2','Numpad4','Numpad6']};
test('kiosk pad: a direction and a button together, from the d-pad or the stick',()=>{
 const state=new KioskPad(kioskMap);
 assert.deepEqual(state.update(pad([12,1]),0),{keys:['Shift'],directions:['Numpad8'],scripts:[],exit:false});
 assert.deepEqual(state.update(pad([1],[0.9,0.9]),16).directions,['Numpad2','Numpad6']);
 assert.deepEqual(state.update(pad([],[0.3,-0.3]),32),{keys:[],directions:[],scripts:[],exit:false});
 assert.deepEqual(new KioskPad(kioskMap).update({...pad([0]),mapping:''},0),{keys:[],directions:[],scripts:[],exit:false});
});
test('kiosk pad: a script runs once on the press; where it does not apply the button is its key',()=>{
 const state=new KioskPad(kioskMap);
 assert.deepEqual(state.update(pad([0]),0,['menu']).scripts,['start']);
 const held=state.update(pad([0]),16,['playing']);
 assert.deepEqual([held.scripts,held.keys],[[],[]],'the press that ran a script is not also a key');
 state.update(pad([]),32,['playing']);
 const again=state.update(pad([0]),48,['playing']);
 assert.deepEqual([again.scripts,again.keys],[[],['Meta']]);
 assert.deepEqual(new KioskPad(kioskMap).update(pad([9]),0,['playing']).scripts,['start'],'no screens named: everywhere');
});
test('kiosk pad: holding the exit button for a second leaves, once',()=>{
 const state=new KioskPad(kioskMap);
 assert.equal(state.update(pad([11]),0).exit,false);
 assert.equal(state.update(pad([11]),EXIT_HOLD_MS-1).exit,false);
 assert.equal(state.update(pad([11]),EXIT_HOLD_MS).exit,true);
 assert.equal(state.update(pad([11]),EXIT_HOLD_MS+500).exit,false);
 const tapped=new KioskPad(kioskMap);tapped.update(pad([11]),0);tapped.update(pad([]),300);
 assert.equal(tapped.update(pad([11]),900).exit,false,'two short presses are not a hold');
});
test('kiosk pad: a game played a cell at a time gets one direction',()=>{
 const state=new KioskPad({...kioskMap,step:true});
 assert.deepEqual(state.update(pad([],[0.9,0.6]),0).directions,['Numpad6']);
 assert.deepEqual(state.update(pad([],[0.6,-0.9]),16).directions,['Numpad8']);
 assert.deepEqual(state.update(pad([13,15]),32).directions,['Numpad2']);
});
