import test from 'node:test';
import assert from 'node:assert/strict';
import {inactiveImportedGunTrigger} from './elevator-oil-riders.mjs';

test('inactive imported gun records filter before capacity; malformed or active records stay gated',()=>{
 const level={schema:'clockwerx-rnd2-decoded-v1',header:{version:12},sha256:'a'.repeat(64),resourceId:142,byteLength:2048};
 for(const [kind,words] of [['GN',7],['TR',6]]){
  const records=Array.from({length:19},()=>({byteLength:words*2,rawWords:[...Array(words-1).fill(0),12]}));
  const block={kind,count:records.length,records};
  assert.equal(inactiveImportedGunTrigger(level,block,1),true);
  assert.equal(inactiveImportedGunTrigger({...level,schema:undefined},block,1),false);
  assert.equal(inactiveImportedGunTrigger(level,{...block,count:0},1),false);
  records[18].rawWords[words-1]=13;
  assert.equal(inactiveImportedGunTrigger(level,block,1),false);
  records[18].rawWords[words-1]=12;records[18].byteLength--;
  assert.equal(inactiveImportedGunTrigger(level,block,1),false);
 }
});
