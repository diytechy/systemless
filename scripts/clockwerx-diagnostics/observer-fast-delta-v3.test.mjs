import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeDelta as legacy,decodeDelta} from './observer.mjs';
import {encodeDelta} from './observer-fast-delta-v3.mjs';

test('v3 observer changes only the pure encoder',()=>{
 const strip=s=>s.replace(/export function encodeDelta\([\s\S]*?(?=export function decodeDelta\()/,'ENCODER\n').replaceAll('\r\n','\n');
 assert.equal(strip(fs.readFileSync(new URL('./observer-fast-delta-v3.mjs',import.meta.url),'utf8')),
              strip(fs.readFileSync(new URL('./observer.mjs',import.meta.url),'utf8')));
});

test('escape lower bound preserves exact legacy rows across boundary and large JSON payloads',()=>{
 let seed=88;const next=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const text=n=>Array.from({length:n},()=>String.fromCharCode(next()%65536)).join('');
 const edges=['','a','\0','\ud800','\udc00','🕐','中文','a\n\\"','x'.repeat(8193)];
 for(const a of[null,...edges])for(const b of edges)for(const checkpoint of[false,true]){
  const d=encodeDelta(a,b,checkpoint);assert.deepEqual(d,legacy(a,b,checkpoint));assert.equal(decodeDelta(a,d),b);
 }
 for(let i=0;i<1200;i++){
  const p=text(next()%300),s=text(next()%300),a=p+text(next()%60)+s,b=p+text(next()%60)+s;
  const d=encodeDelta(a,b);assert.deepEqual(d,legacy(a,b));assert.equal(decodeDelta(a,d),b);
 }
 const payload=JSON.stringify({invented:Array.from({length:1600},(_,i)=>({i,text:'quote"slash\\newline\n'}))});
 for(const n of[0,1,2,4,8,16,32,64,128,256,512,4096]){
  const a='a'.repeat(n)+payload+'tail0',b='a'.repeat(n)+payload+'tail1';
  assert.deepEqual(encodeDelta(a,b),legacy(a,b));
  assert.deepEqual(encodeDelta('before'+a,'after'+b),legacy('before'+a,'after'+b));
 }
});
