import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';

export const hookMethods = Object.freeze(['sourceGrabQuery','sourceActorEvent','moveMovingHuman','moveStaticMarkedHuman','animateStaticEnemy','onHumanRelease','onHumanGrab','slideGrabHuman','onAfterHumanGrab','onBonus','onGoal','beginDeath','enemyCollision','spikeCollision','wallCollision','collision','collider']);
export function encodeDelta(previous, value, checkpoint = false) {
  if (previous === null || checkpoint) return ['full', value];
  const length = Math.min(previous.length, value.length), block = 2048;
  let prefix = 0, suffix = 0;
  if (previous === value) prefix = length;
  else {
    // Compare complete chunks in the VM, then locate the differing UTF16 unit.
    while (prefix + block <= length && previous.slice(prefix, prefix + block) === value.slice(prefix, prefix + block)) prefix += block;
    let low = 0, high = Math.min(block, length - prefix);
    while (low < high) {
      const middle = low + Math.ceil((high - low) / 2);
      if (previous.slice(prefix, prefix + middle) === value.slice(prefix, prefix + middle)) low = middle;
      else high = middle - 1;
    }
    prefix += low;
    while (suffix + block <= length - prefix && previous.slice(previous.length - suffix - block, previous.length - suffix) === value.slice(value.length - suffix - block, value.length - suffix)) suffix += block;
    low = 0; high = Math.min(block, length - prefix - suffix);
    while (low < high) {
      const middle = low + Math.ceil((high - low) / 2);
      if (previous.slice(previous.length - suffix - middle, previous.length - suffix) === value.slice(value.length - suffix - middle, value.length - suffix)) low = middle;
      else high = middle - 1;
    }
    suffix += low;
  }
  const row = ['delta', prefix, suffix, value.slice(prefix, value.length - suffix)];
  // Reject an already-too-large delta without serializing its entire payload.
  // Every JSON escape below adds at least one UTF16 unit. This lower bound can
  // only choose the same full row that the exact legacy length test chooses.
  const limit = value.length + 12;
  let minimum = JSON.stringify(['delta', prefix, suffix, '']).length + row[3].length;
  if (minimum >= limit) return ['full', value];
  // Bound the JavaScript escape walk. For larger potential savings the native
  // JSON serializer is faster than visiting thousands of individual matches.
  if (limit - minimum <= 64) {
    const escapes = /["\\\u0000-\u001f]/g;
    while (escapes.exec(row[3]) !== null) {
      if (++minimum >= limit) return ['full', value];
    }
  }
  return JSON.stringify(row).length < value.length + 12 ? row : ['full', value];
}
export function decodeDelta(previous, row) {
  if (row[0] === 'full') return row[1];
  if (row[0] !== 'delta' || previous === null || !Number.isInteger(row[1]) || !Number.isInteger(row[2]) || row[1] < 0 || row[2] < 0 || row[1]+row[2] > previous.length) throw Error('Malformed delta');
  return previous.slice(0,row[1]) + row[3] + (row[2] ? previous.slice(-row[2]) : '');
}

// JSON-level losslessness means exact reconstruction of the legacy serialized row,
// including key order, omitted undefined values and all represented state numbers.
export function createObserver({directory, mode, checkpointEvery = 128, failureWindow = 128, bufferLimit = 1024*1024}) {
  if (!['old','witness','search'].includes(mode)) throw Error('Unknown observer mode');
  if (!Number.isInteger(checkpointEvery)||checkpointEvery<1||!Number.isInteger(failureWindow)||failureWindow<1||bufferLimit<4096) throw Error('Invalid observer bounds');
  fs.mkdirSync(directory,{recursive:false});
  const stats={mode,rows:{},bytes:{},snapshotMs:0,serializationMs:0,encodingMs:0,outputMs:0,hashingMs:0,updateInclusiveMs:0,observerInsideUpdateMs:0,peakBufferedBytes:0,peakAggregateBufferedBytes:0};
  let step=0,inUpdate=false,game,board,dotBodyFrame,sourceFrame,insideMs=0;
  const streams=new Map(),restores=[],window=[];
  const measured=(key,fn)=>{const start=performance.now();try{return fn();}finally{const dt=performance.now()-start;stats[key]+=dt;if(inUpdate)insideMs+=dt;}};
  const serialize=v=>measured('serializationMs',()=>JSON.stringify(v));
  function stream(name){if(!streams.has(name))streams.set(name,{fd:fs.openSync(directory+'/'+name+'.jsonl','wx'),previous:null,chunks:[],buffered:0,count:0,hash:crypto.createHash('sha256')});return streams.get(name);}
  function flush(s){if(!s.buffered)return;measured('outputMs',()=>{fs.writeSync(s.fd,s.chunks.join(''));});s.chunks=[];s.buffered=0;}
  function row(name,value,{raw=false,forceCheckpoint=false,hash=true}={}){
    const s=stream(name),text=raw?value:serialize(value);
    if(hash)measured('hashingMs',()=>s.hash.update(text+'\n'));
    let output=text;
    if(mode!=='old')output=measured('encodingMs',()=>JSON.stringify(encodeDelta(s.previous,text,forceCheckpoint||s.count%checkpointEvery===0)));
    s.previous=text;s.count++;
    const bytes=Buffer.byteLength(output)+1;stats.rows[name]=s.count;stats.bytes[name]=(stats.bytes[name]??0)+bytes;
    if(mode==='old')measured('outputMs',()=>fs.writeSync(s.fd,output+'\n'));
    else {if(s.buffered+bytes>bufferLimit)flush(s);if(bytes>bufferLimit)measured('outputMs',()=>fs.writeSync(s.fd,output+'\n'));else{s.chunks.push(output+'\n');s.buffered+=bytes;stats.peakBufferedBytes=Math.max(stats.peakBufferedBytes,s.buffered);stats.peakAggregateBufferedBytes=Math.max(stats.peakAggregateBufferedBytes,[...streams.values()].reduce((n,s)=>n+s.buffered,0));}}
    return text;
  }
  function snapshot(){return measured('snapshotMs',()=>game.snapshot());}
  function attach(g,b,helpers){game=g;board=b;({dotBodyFrame,sourceFrame}=helpers);row('inventory',{dots:board.dots,spikes:board.spikes,walls:board.walls,enemies:board.enemies});
    for(const method of hookMethods){if(typeof game[method]!=='function')continue;const original=game[method];
      const writeHook=metadata=>{const metaText=serialize(metadata);row('hook-metadata',metaText,{raw:true});const hook={...metadata,...(mode==='search'?{}:{state:snapshot()})};row('hooks',hook);};
      game[method]=function(...args){writeHook({step,inUpdate,phase:'beforeOriginal',method,args});try{const returned=original.apply(this,args);writeHook({step,inUpdate,phase:'afterOriginal',method,returned});return returned;}catch(error){writeHook({step,inUpdate,phase:'originalException',method,error:error.message});throw error;}};
      restores.push(()=>game[method]=original);
    }
  }
  function sample(input){
    const state=snapshot();
    const dots=measured('snapshotMs',()=>board.dots.map(d=>({...d,body:{group:300,frame:dotBodyFrame(d),x:d.x,y:d.y},misc:game.dotAnimations?.renderState(d.id)})));
    const physicalActors=measured('snapshotMs',()=>[game.player,...game.enemies].map(a=>({sourceSlot:a.sourceSlot,sourceRawRecord:a.sourceRawRecord,canonicalFrame:a.canonicalFrame?a.frame:sourceFrame(a.angle),physical:{x:game.point(a).x,y:game.point(a).y}})));
    const value={step,input,state,dots,physicalActors},text=row('lineage',value,{forceCheckpoint:step%checkpointEvery===0});
    window.push(text);if(window.length>failureWindow)window.shift();return value;
  }
  function update(dt,input){step++;const prior=insideMs,start=performance.now();inUpdate=true;try{return game.update(dt,input);}finally{stats.updateInclusiveMs+=performance.now()-start;inUpdate=false;stats.observerInsideUpdateMs+=insideMs-prior;}}
  function terminal(reason){row('terminal',{step,reason,state:snapshot()},{forceCheckpoint:true});if(reason!=='goal')for(const text of window)row('failure-window',text,{raw:true});for(const s of streams.values()){flush(s);measured('outputMs',()=>fs.fsyncSync(s.fd));}}
  function rng(value){row('rng',{step,...value});}
  // Synchronous appends survive a killed diagnostic process. Flush to physical
  // storage at bounded checkpoints; no every-update power-loss durability claim.
  // Counters are ordinary JSONL in every mode, never delta rows.
  function journal(counters,phase){const s=stream('counters');flush(s);const text=JSON.stringify({phase,step,...counters})+'\n';measured('hashingMs',()=>s.hash.update(text));measured('outputMs',()=>{fs.writeSync(s.fd,text);if(phase.includes('constructor')||phase.includes('terminal')||(phase==='afterUpdate'&&step%checkpointEvery===0))fs.fsyncSync(s.fd);});stats.rows.counters=(stats.rows.counters??0)+1;stats.bytes.counters=(stats.bytes.counters??0)+Buffer.byteLength(text);}
  function close(){for(const restore of restores.reverse())restore();const digests={};for(const [name,s]of streams){flush(s);fs.closeSync(s.fd);digests[name]=s.hash.digest('hex');}stats.simulationResidualMs=stats.updateInclusiveMs-stats.observerInsideUpdateMs;return {stats,digests};}
  return {attach,sample,update,terminal,rng,journal,row,close,get step(){return step;}};
}
