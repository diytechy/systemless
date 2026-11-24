import test from 'node:test';
import assert from 'node:assert/strict';
import {planPlayLayout,LAYOUT_DEFAULTS} from './touch-layout.mjs';

test('landscape phone: board fills the height, instructions get the remaining side strip, no rotate prompt',()=>{
  const p=planPlayLayout(844,390);
  assert.equal(p.arrangement,'side');assert.deepEqual(p.board,{w:520,h:390});assert.deepEqual(p.panel,{w:324,h:390});
  assert.equal(p.orientation,'landscape');assert.equal(p.rotate,null);
});

test('portrait phone: board on top, panel below, and a rotate prompt with the size gain',()=>{
  const p=planPlayLayout(390,844);
  assert.equal(p.arrangement,'bottom');assert.deepEqual(p.board,{w:390,h:292});assert.deepEqual(p.panel,{w:390,h:552});
  assert.equal(p.rotate.to,'landscape');assert.equal(p.rotate.board.w,520);assert.ok(Math.abs(p.rotate.gain-520/390)<1e-9);
});

test('4:3 tablet: landscape keeps a bottom strip; portrait is close enough that it does not ask to rotate',()=>{
  const l=planPlayLayout(1024,768);assert.equal(l.arrangement,'bottom');assert.deepEqual(l.board,{w:864,h:648});assert.equal(l.panel.h,120);assert.equal(l.rotate,null);
  const p=planPlayLayout(768,1024);assert.equal(p.arrangement,'bottom');assert.equal(p.board.w,768);assert.equal(p.rotate,null,'864/768 = 1.125x is below the 1.15x prompt threshold');assert.equal(planPlayLayout(768,1024,{rotateGain:1.1}).rotate.to,'landscape');
});

test('the board always respects the panel minimum and the 4:3 aspect',()=>{
  for(const [w,h] of[[320,568],[568,320],[1920,1080],[1080,1920],[2000,300],[300,300],[700,500]]){
    const p=planPlayLayout(w,h);
    assert.ok(p.board.w<=w&&p.board.h<=h,`${w}x${h} fits`);assert.ok(Math.abs(p.board.w/p.board.h-4/3)<0.02);
    if(p.arrangement==='side')assert.ok(p.panel.w>=LAYOUT_DEFAULTS.sidePanelMin);else assert.ok(p.panel.h>=LAYOUT_DEFAULTS.bottomPanelMin);
    if(p.rotate)assert.ok(p.rotate.gain>=LAYOUT_DEFAULTS.rotateGain);
  }
});

test('small gains do not nag; invalid input is rejected',()=>{
  assert.equal(planPlayLayout(800,700).rotate,null);
  assert.throws(()=>planPlayLayout(0,100));assert.throws(()=>planPlayLayout(100,NaN));assert.throws(()=>planPlayLayout(100,100,{rotateGain:-1}));
});
