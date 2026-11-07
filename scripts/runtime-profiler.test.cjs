const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {summarize,captureCanvasPng}=require('./runtime-profiler.js');
test('WebGL PNG snapshots after one draw and restores the renderer method',async()=>{
  const events=[],blob={};
  const original=function(value){events.push(['draw',value]);return 7;};
  const gl={drawArrays:original};
  const canvas={dataset:{renderBackend:'webgl'},getContext:()=>gl,toBlob:cb=>{events.push(['snapshot']);cb(blob);}};
  const pending=captureCanvasPng(canvas);
  assert.equal(gl.drawArrays(3),7);
  assert.equal(await pending,blob);
  assert.equal(gl.drawArrays,original);
  assert.deepEqual(events,[['draw',3],['snapshot']]);
});
test('PNG timeout restores a paused renderer without a blank success',async()=>{
  const original=()=>{},gl={drawArrays:original};
  const canvas={dataset:{renderBackend:'webgl'},getContext:()=>gl,toBlob:()=>assert.fail('no draw')};
  await assert.rejects(captureCanvasPng(canvas,1),/resume gameplay/);
  assert.equal(gl.drawArrays,original);
});
test('a PNG serialization error does not turn a successful draw into a renderer failure',async()=>{
  const original=()=>9,gl={drawArrays:original};
  const canvas={dataset:{renderBackend:'webgl'},getContext:()=>gl,toBlob:()=>{throw new Error('export denied');}};
  const pending=captureCanvasPng(canvas);
  assert.equal(gl.drawArrays(),9);
  await assert.rejects(pending,/export denied/);
  assert.equal(gl.drawArrays,original);
});
test('rates use measured sample span; work distributions remain distinct',()=>{
  const rows=[0,1,2].map(i=>({at:i*500,guestTick:100+i*30,totalInstructions:i*1000000,
    guestMs:2+i,roundTripMs:5+i,visualWork:i!==1,cpuMhz:25,workerWasmLinearMemoryBytes:67108864}));
  const result=summarize(rows,1200);
  assert.equal(result.guestTicksPerSecond,60);
  assert.equal(result.runtimeFramesPerSecond,2);
  assert.equal(result.sampledSeconds,1);
  assert.equal(result.wallSeconds,1.2);
  assert.equal(result.guestExecutionMs.mean,3);
  assert.equal(result.roundTripMs.p95,7);
  assert.equal(result.visualFrames,2);
  assert.equal(result.snapshotMs,null);
  assert.equal(result.workerWasmLinearMemoryBytes.max,67108864);
  assert.ok(summarize(rows.slice(0,1),1).error);
  assert.ok(summarize([{at:0,guestTick:2},{at:1,guestTick:1}],1).error);
});
function workerFor(search,path='/emulator-worker.js') {
  class Worker { constructor(){this.sent=[];} addEventListener(){} postMessage(message){this.sent.push(message);} }
  const window={Worker,addEventListener(){}};
  const context={window,location:{search,href:'http://localhost/clockwerx/'}, URL, URLSearchParams,
    document:{documentElement:{},querySelector(){return null;},addEventListener(){}},
    MutationObserver:class{observe(){}},performance:{now:()=>42}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/runtime-profiler.js','utf8'),context);
  return new window.Worker(path);
}
test('only opt-in runtime worker receives a supported test pacing override',()=>{
  for(const [search,path,expected] of [['?profile=1&profile_mhz=6','/emulator-worker.js',6],
    ['?profile=1&profile_mhz=6','/renderer-worker.js',25],['?profile_mhz=6','/emulator-worker.js',25],
    ['?profile=1&profile_mhz=7','/emulator-worker.js',25]]) {
    const worker=workerFor(search,path);
    const config={id:'clockwerx-personal-10',runtime_pacing:{cpu_mhz:25,max_ticks_per_paint:2}};
    const message={type:'boot',config:JSON.stringify(config)};
    worker.postMessage(message);
    const sent=JSON.parse(worker.sent[0].config);
    assert.equal(sent.runtime_pacing.cpu_mhz,expected);
    assert.equal(sent.runtime_pacing.max_ticks_per_paint,2);
    assert.equal(sent.id,config.id);
    assert.equal(JSON.parse(message.config).runtime_pacing.cpu_mhz,25);
  }
});
