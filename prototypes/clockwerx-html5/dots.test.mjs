import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeDot,dotColorOffset,dotRenderSpec} from './dots.mjs';

test('bonus and goal are independent bits; lowered flag does not classify them',()=>{
  assert.equal(decodeDot(3).bonus,true);
  assert.equal(decodeDot(0x4003).bonus,true);
  assert.equal(decodeDot(0x4001).bonus,false);
  assert.equal(decodeDot(5).goal,true);
  assert.equal(decodeDot(0x4005).goal,true);
  assert.equal(decodeDot(2).present,false);
});
test('colors derive from permissions, including mixed colors and alternate modes',()=>{
  assert.equal(dotColorOffset(0x000f),0);
  assert.equal(dotColorOffset(0x00ff),1);
  assert.equal(dotColorOffset(0x0f0f),2);
  assert.equal(dotColorOffset(0xf00f),4);
  assert.equal(dotColorOffset(0xffff),7);
  assert.equal(dotColorOffset(0x20,0),0);
  assert.equal(dotColorOffset(0x20,1),1);
  assert.throws(()=>dotColorOffset(15,4),RangeError);
});
test('collection switches ring to same-color sphere and occupancy has no effect',()=>{
  const dot={cell:3,flags:0xf00f};
  assert.equal(dotRenderSpec(dot).assetKey,'bonus:4');
  assert.equal(dotRenderSpec({...dot,occupied:true}).assetKey,'bonus:4');
  assert.deepEqual(dotRenderSpec({...dot,collected:true}),{present:true,bonus:false,color:4,assetKey:'normal:4',sourceDescriptor:313});
});
