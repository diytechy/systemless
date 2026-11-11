import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeDelta as legacy,decodeDelta} from './observer.mjs';
import {encodeDelta} from './observer-fast-delta.mjs';

test('fast observer differs only in its pure encoder',()=>{
 const strip=s=>s.replace(/export function encodeDelta\([\s\S]*?(?=export function decodeDelta\()/,'ENCODER\n').replaceAll('\r\n','\n');
 assert.equal(strip(fs.readFileSync(new URL('./observer-fast-delta.mjs',import.meta.url),'utf8')),
              strip(fs.readFileSync(new URL('./observer.mjs',import.meta.url),'utf8')));
});

test('chunk encoder preserves legacy UTF16 deltas, overlap and full-row decisions',()=>{
 let seed=70;const next=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const text=n=>Array.from({length:n},()=>String.fromCharCode(next()%65536)).join('');
 const edges=['','a','\0','\ud800','\udc00','🕐','中文','a\n\\"','x'.repeat(8193)];
 for(const a of[null,...edges])for(const b of edges)for(const checkpoint of[false,true]){
  const delta=encodeDelta(a,b,checkpoint);assert.deepEqual(delta,legacy(a,b,checkpoint));
  assert.equal(decodeDelta(a,delta),b);
 }
 for(let i=0;i<1200;i++){
  const p=text(next()%300),s=text(next()%300),a=p+text(next()%60)+s,b=p+text(next()%60)+s;
  const delta=encodeDelta(a,b);assert.deepEqual(delta,legacy(a,b));assert.equal(decodeDelta(a,delta),b);
 }
});
