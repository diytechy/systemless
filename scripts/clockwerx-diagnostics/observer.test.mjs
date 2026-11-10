import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeDelta,decodeDelta} from './observer.mjs';
import {createObserver} from './observer.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

test('delta reconstructs exact serialized rows, checkpoints, shortening and Unicode',()=>{
 const rows=[JSON.stringify({same:'x'.repeat(400),frame:1,undefinedValue:undefined}),JSON.stringify({same:'x'.repeat(400),frame:2}),JSON.stringify({same:'x'.repeat(400),frame:2,events:['♥','😀']}),'',JSON.stringify({reset:true}),JSON.stringify({reset:true})];
 let previous=null;
 for(const [index,text]of rows.entries()){const encoded=encodeDelta(previous,text,index===4);assert.equal(decodeDelta(previous,JSON.parse(JSON.stringify(encoded))),text);previous=text;}
 assert.equal(encodeDelta(rows[0],rows[1])[0],'delta');
 assert.equal(encodeDelta(rows[0],rows[1],true)[0],'full');
});
test('malformed deltas fail rather than hiding lineage loss',()=>{
 for(const row of [['delta',-1,0,''],['delta',3,3,''],['other',0,0,'']])assert.throws(()=>decodeDelta('hello',row));
 assert.throws(()=>decodeDelta(null,['delta',0,0,'']));
});
test('counter digest covers raw journal bytes and terminal flushes compact buffers',()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'clockwerx-observer-')),directory=path.join(parent,'records');
 try{
  const observer=createObserver({directory,mode:'search',bufferLimit:4096,checkpointEvery:2});
  const game={snapshot:()=>({time:0,events:[]}),player:{angle:0},enemies:[],point:()=>({x:1,y:2})};
  observer.attach(game,{dots:[],spikes:[],walls:[],enemies:[]},{dotBodyFrame:()=>0,sourceFrame:()=>0});
  observer.journal({attemptedUpdates:0,completedUpdates:0},'constructor');
  const rows=Array.from({length:10},(_,i)=>({i,payload:'x'.repeat(2000)}));
  for(const row of rows)observer.row('example',row);
  observer.sample(null);observer.terminal('finite-test');
  const {stats,digests}=observer.close();
  const bytes=fs.readFileSync(path.join(directory,'counters.jsonl'));
  assert.equal(digests.counters,crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.equal(JSON.parse(bytes.toString()).phase,'constructor');
  let previous=null;
  const actual=fs.readFileSync(path.join(directory,'example.jsonl'),'utf8').trimEnd().split('\n').map(line=>{previous=decodeDelta(previous,JSON.parse(line));return JSON.parse(previous);});
  assert.deepEqual(actual,rows);assert.ok(stats.peakBufferedBytes<=4096);
  assert.equal(stats.rows['failure-window'],1);
 }finally{assert.ok(path.resolve(parent).startsWith(path.resolve(os.tmpdir())+path.sep));assert.ok(path.basename(parent).startsWith('clockwerx-observer-'));fs.rmSync(parent,{recursive:true,force:true});}
});
