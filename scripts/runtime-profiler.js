/* Opt-in local diagnostics. profile_mhz=6/12/25 explicitly changes only the test boot budget. */
(function () {
  function captureCanvasPng(canvas, timeoutMs=3000) {
    return new Promise((resolve,reject)=>{
      const save=()=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Canvas export unavailable')),'image/png');
      let gl;
      try {gl=canvas.dataset.renderBackend==='webgl'?canvas.getContext('webgl'):null;}
      catch(error){reject(error);return;}
      if(!gl){save();return;}
      // WebGL clears its drawing buffer after composition. Snapshot immediately
      // after the next draw, and restore the method before exporting the bitmap.
      const original=gl.drawArrays;
      const restore=()=>{if(gl.drawArrays===nextDraw)gl.drawArrays=original;};
      const timer=setTimeout(()=>{restore();reject(new Error('No new frame; resume gameplay before exporting'));},timeoutMs);
      function nextDraw(...args){
        let result;
        try {result=original.apply(this,args);}
        catch(error){restore();clearTimeout(timer);reject(error);throw error;}
        restore();clearTimeout(timer);
        try{save();}catch(error){reject(error);}
        return result;
      }
      gl.drawArrays=nextDraw;
    });
  }
  function summarize(rows, wallMs) {
    if (rows.length < 2) return {error: 'Too few runtime frames'};
    const first = rows[0], last = rows.at(-1);
    const seconds = (last.at - first.at) / 1000;
    if (!(seconds > 0) || last.guestTick < first.guestTick) return {error:'Clock reset during capture'};
    const stats = key => {
      const a = rows.map(r => r[key]).filter(Number.isFinite).sort((a,b)=>a-b);
      return a.length ? {mean:a.reduce((s,v)=>s+v,0)/a.length,p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)} : null;
    };
    return {frames:rows.length, wallSeconds:wallMs/1000, sampledSeconds:seconds,
      runtimeFramesPerSecond:(rows.length-1)/seconds,
      guestTicksPerSecond:(last.guestTick-first.guestTick)/seconds,
      guestMips:(last.totalInstructions-first.totalInstructions)/seconds/1e6,
      firstGuestTick:first.guestTick,lastGuestTick:last.guestTick,
      guestExecutionMs:stats('guestMs'),snapshotMs:stats('snapshotMs'),jsCopyMs:stats('jsCopyMs'),
      workerWasmLinearMemoryBytes:stats('workerWasmLinearMemoryBytes'),
      roundTripMs:stats('roundTripMs'),ticksBehind:stats('ticksBehind'),cpuBudgetMs:stats('cpuBudgetMs'),
      cpuMhz:last.cpuMhz,visualFrames:rows.filter(r=>r.visualWork).length};
  }
  if (typeof module !== 'undefined') module.exports = {summarize,captureCanvasPng};
  if (typeof window === 'undefined' || new URLSearchParams(location.search).get('profile') !== '1') return;
  const requestedMhz=Number(new URLSearchParams(location.search).get('profile_mhz'));
  const testMhz=[6,12,25].includes(requestedMhz)?requestedMhz:null;
  let active = null, lastReport = null, output, startButton, downloadButton, memoryButton;
  let memoryPending = false, screenshotPending = false, lastMemory = null, bootMetadata = null, firstFrameAfterBootMs = null;
  const NativeWorker = window.Worker;
  window.Worker = class extends NativeWorker {
    constructor(url, options) {
      super(url, options);
      this.profileRuntime = new URL(url, location.href).pathname.endsWith('/emulator-worker.js');
      this.profileRequests = [];
      if (this.profileRuntime) this.addEventListener('message', event => {
        const d = event.data;
        if (d?.type !== 'frame') return;
        if (this.profileBootAt != null && firstFrameAfterBootMs == null) firstFrameAfterBootMs = performance.now()-this.profileBootAt;
        const sent = this.profileRequests.shift();
        if (!active || !sent || sent.token !== active.token) return;
        active.rows.push({at:performance.now(),guestTick:d.guestTick,totalInstructions:d.totalInstructions,
          ticksBehind:d.ticksBehind,cpuBudgetMs:d.cpuBudgetMs,cpuMhz:d.cpuMhz,
          visualWork:d.visualWork,workerWasmLinearMemoryBytes:d.wasmLinearMemoryBytes,
          roundTripMs:performance.now()-sent.at,...d.presentationMetrics});
      });
    }
    postMessage(message, ...rest) {
      if (this.profileRuntime && message?.type === 'boot') {
        const config=JSON.parse(message.config);
        if (testMhz) config.runtime_pacing.cpu_mhz=testMhz;
        this.profileBootAt=performance.now();firstFrameAfterBootMs=null;
        bootMetadata={id:config.id,architecture:config.architecture,screenSize:config.screen_size,
          screenDepth:config.screen_depth,partition:config.application_partition_size,pacing:config.runtime_pacing};
        message={...message,config:JSON.stringify(config)};
      }
      if (this.profileRuntime && message?.type === 'frame') {
        this.profileRequests.push({at:performance.now(),token:active?.token});
        if (active) message = {...message,measurePresentation:true};
      }
      return super.postMessage(message,...rest);
    }
  };
  function finish(reason) {
    const capture = active;
    if (!capture) return;
    active = null;
    clearTimeout(capture.timer);
    const elapsed = performance.now()-capture.start;
    let rows = capture.rows;
    if (!rows.length && Array.isArray(window.__systemlessFrameTrace)) {
      rows = window.__systemlessFrameTrace.map(r=>({...r,at:r.t,guestMs:r.runMs,snapshotMs:r.renderMs}));
    }
    delete window.__systemlessFrameTrace;
    const canvas = document.querySelector('canvas.game-canvas');
    lastReport = {schemaVersion:3,captureStartedAt:capture.startedAt,capturedAt:new Date().toISOString(),path:location.pathname,
      reason,testCpuMhz:testMhz,visible:!document.hidden,focused:document.hasFocus(),
      runtime:canvas?.dataset.runtimeWorker,renderer:canvas?.dataset.renderBackend,
      canvas:[canvas?.width,canvas?.height],userAgent:navigator.userAgent,
      boot:bootMetadata,firstFrameAfterBootMs,
      firstFrameBoundary:'Worker boot postMessage to first returned frame; excludes earlier navigation/download/user readiness',
      pageMemory:lastMemory,
      wasmMemoryBoundary:'Emulator worker WebAssembly linear allocation length; not resident RAM, and excludes main-page Wasm and renderer memory. Report separately from the browser API estimate.',
      windowLoadTiming:{navigation:performance.getEntriesByType('navigation').map(entry=>entry.toJSON()),
        resources:performance.getEntriesByType('resource').map(entry=>entry.toJSON()),
        boundary:'Main-window ResourceTiming only; dedicated-worker fetches are not included. Cache state is not inferred from transferSize alone.'},
      animationCallbacksPerSecond:capture.rafs/(elapsed/1000),...summarize(rows,elapsed)};
    output.textContent = JSON.stringify(lastReport,null,2);
    lastReport.rawFrames=rows;
    output.closest('details').open = true;
    startButton.disabled = false; startButton.textContent = 'Capture 20 seconds';
    memoryButton.disabled = false;
    downloadButton.disabled = false;
  }
  function capture() {
    if (active || memoryPending || screenshotPending) return;
    const canvas = document.querySelector('canvas.game-canvas');
    if (!canvas?.dataset.runtimeGameId) { output.textContent='Wait for the game to finish loading.';output.closest('details').open=true;return; }
    output.closest('details').open=false;
    const token={};
    active={token,rows:[],rafs:0,startedAt:new Date().toISOString(),start:performance.now(),timer:setTimeout(()=>finish('complete'),20000)};
    window.__systemlessFrameTrace=[];
    const frame=()=>{if(active?.token===token){active.rafs++;requestAnimationFrame(frame);}};
    requestAnimationFrame(frame);
    startButton.disabled=true;startButton.textContent='Capturing for 20 seconds…';
    memoryButton.disabled=true;
    canvas.focus({preventScroll:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish('invalid: tab hidden');});
  window.addEventListener('blur',()=>finish('invalid: browser lost focus'));
  function attach() {
    const toolbar=document.querySelector('.koji-toolbar');
    if (!toolbar || document.getElementById('runtime-profile-panel')) return;
    const panel=document.createElement('section');panel.id='runtime-profile-panel';
    panel.style.cssText='border:1px solid #888;padding:8px;margin:8px 0;font:13px monospace;background:#f4f4ee;color:#171717';
    panel.innerHTML='<strong>Runtime timing — opt-in diagnostics</strong> <button type="button">Capture 20 seconds</button> <button type="button" disabled>Download timing JSON</button> <button type="button">Measure page memory</button><p data-testid="runtime-memory-results">Page memory not sampled; sample outside timed captures.</p><details><summary>Timing results</summary><pre data-testid="runtime-profile-results" style="white-space:pre-wrap;max-height:400px;overflow:auto">Start gameplay, then capture with this tab visible and focused.</pre></details>';
    if(testMhz)panel.querySelector('strong').textContent='Runtime timing — TEST budget '+testMhz+' MHz';
    startButton=panel.querySelector('button');downloadButton=panel.querySelectorAll('button')[1];output=panel.querySelector('pre');
    memoryButton=panel.querySelectorAll('button')[2];
    memoryButton.onclick=async()=>{
      if(active || memoryPending)return;
      memoryPending=true;memoryButton.disabled=true;startButton.disabled=true;
      const memoryOutput=panel.querySelector('[data-testid="runtime-memory-results"]');
      memoryOutput.textContent='Waiting for page memory estimate (may wait for garbage collection)…';
      lastMemory={at:new Date().toISOString(),secureContext:Boolean(globalThis.isSecureContext),crossOriginIsolated:Boolean(globalThis.crossOriginIsolated),
        boundary:'Experimental browser application estimate, including attributed workers; not unique physical/GPU RAM'};
      try {
        if(typeof performance.measureUserAgentSpecificMemory !== 'function') lastMemory.status='unsupported';
        else {lastMemory.result=await performance.measureUserAgentSpecificMemory();lastMemory.status='measured';}
      } catch(error){lastMemory.status='unavailable';lastMemory.error=String(error);}
      finally {lastMemory.completedAt=new Date().toISOString();memoryPending=false;memoryButton.disabled=false;startButton.disabled=false;}
      memoryOutput.textContent=JSON.stringify(lastMemory);
      if(lastReport)lastReport.pageMemory=lastMemory;
    };
    startButton.onclick=capture;
    const screenshotButton=document.createElement('button');
    screenshotButton.type='button';screenshotButton.textContent='Download game PNG';
    screenshotButton.onclick=async()=>{
      if(active || memoryPending || screenshotPending)return;
      const canvas=document.querySelector('canvas[data-presentation-canvas="worker"]') || document.querySelector('canvas.game-canvas');
      if(!canvas)return;
      screenshotPending=true;screenshotButton.disabled=true;startButton.disabled=true;memoryButton.disabled=true;
      try {
        const blob=await captureCanvasPng(canvas);
        const a=document.createElement('a'),u=URL.createObjectURL(blob);
        a.href=u;a.download=(bootMetadata?.id || 'runtime')+'-game-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';
        a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
      }catch(error){output.textContent=String(error);output.closest('details').open=true;}
      finally{screenshotPending=false;screenshotButton.disabled=false;startButton.disabled=false;memoryButton.disabled=false;}
    };
    panel.querySelector('details').before(screenshotButton);
    const motionButton=document.createElement('button');
    motionButton.type='button';motionButton.textContent='Record 5s motion JSON';
    motionButton.onclick=async()=>{
      if(active || memoryPending || screenshotPending)return;
      const canvas=document.querySelector('canvas.game-canvas');if(!canvas)return;
      screenshotPending=true;motionButton.disabled=true;screenshotButton.disabled=true;startButton.disabled=true;memoryButton.disabled=true;
      const frames=[],startedAt=new Date().toISOString(),deadline=performance.now()+5000;
      try{
        while(performance.now()<deadline && frames.length<40){
          const requestedAt=new Date().toISOString(),blob=await captureCanvasPng(canvas),completedAt=new Date().toISOString();
          const png=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
          frames.push({requestedAt,completedAt,png});
          await new Promise(resolve=>setTimeout(resolve,125));
        }
        const report={schemaVersion:1,startedAt,completedAt:new Date().toISOString(),game:bootMetadata?.id,
          boot:bootMetadata,visible:!document.hidden,focused:document.hasFocus(),canvas:[canvas.width,canvas.height],userAgent:navigator.userAgent,
          boundary:'Diagnostic rendered PNG sequence, outside performance capture. Snapshot falls between request/completion timestamps; encoding and sampling add work. Contains private game artwork.',frames};
        const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(report)],{type:'application/json'}));
        a.href=u;a.download=(bootMetadata?.id || 'runtime')+'-motion-'+startedAt.replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
      }catch(error){output.textContent=String(error);output.closest('details').open=true;}
      finally{screenshotPending=false;motionButton.disabled=false;screenshotButton.disabled=false;startButton.disabled=false;memoryButton.disabled=false;}
    };
    panel.querySelector('details').before(motionButton);
    downloadButton.onclick=()=>{const a=document.createElement('a');const u=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));a.href=u;a.download=(bootMetadata?.id || 'runtime')+'-timing-'+lastReport.capturedAt.replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
    toolbar.after(panel);
  }
  new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});attach();
})();
