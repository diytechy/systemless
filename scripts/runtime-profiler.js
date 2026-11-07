/* Opt-in local diagnostics. profile_mhz=6/12/25 explicitly changes only the test boot budget. */
(function () {
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
      roundTripMs:stats('roundTripMs'),ticksBehind:stats('ticksBehind'),cpuBudgetMs:stats('cpuBudgetMs'),
      cpuMhz:last.cpuMhz,visualFrames:rows.filter(r=>r.visualWork).length};
  }
  if (typeof module !== 'undefined') module.exports = {summarize};
  if (typeof window === 'undefined' || new URLSearchParams(location.search).get('profile') !== '1') return;
  const requestedMhz=Number(new URLSearchParams(location.search).get('profile_mhz'));
  const testMhz=[6,12,25].includes(requestedMhz)?requestedMhz:null;
  let active = null, lastReport = null, output, startButton, downloadButton;
  const NativeWorker = window.Worker;
  window.Worker = class extends NativeWorker {
    constructor(url, options) {
      super(url, options);
      this.profileRuntime = new URL(url, location.href).pathname.endsWith('/emulator-worker.js');
      this.profileRequests = [];
      if (this.profileRuntime) this.addEventListener('message', event => {
        const d = event.data;
        if (d?.type !== 'frame') return;
        const sent = this.profileRequests.shift();
        if (!active || !sent || sent.token !== active.token) return;
        active.rows.push({at:performance.now(),guestTick:d.guestTick,totalInstructions:d.totalInstructions,
          ticksBehind:d.ticksBehind,cpuBudgetMs:d.cpuBudgetMs,cpuMhz:d.cpuMhz,
          visualWork:d.visualWork,roundTripMs:performance.now()-sent.at,...d.presentationMetrics});
      });
    }
    postMessage(message, ...rest) {
      if (this.profileRuntime && message?.type === 'boot' && testMhz) {
        const config=JSON.parse(message.config);
        config.runtime_pacing.cpu_mhz=testMhz;
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
    lastReport = {capturedAt:new Date().toISOString(),path:location.pathname,
      reason,testCpuMhz:testMhz,visible:!document.hidden,focused:document.hasFocus(),
      runtime:canvas?.dataset.runtimeWorker,renderer:canvas?.dataset.renderBackend,
      canvas:[canvas?.width,canvas?.height],userAgent:navigator.userAgent,
      animationCallbacksPerSecond:capture.rafs/(elapsed/1000),...summarize(rows,elapsed)};
    output.textContent = JSON.stringify(lastReport,null,2);
    output.closest('details').open = true;
    startButton.disabled = false; startButton.textContent = 'Capture 20 seconds';
    downloadButton.disabled = false;
  }
  function capture() {
    if (active) return;
    const canvas = document.querySelector('canvas.game-canvas');
    if (!canvas?.dataset.runtimeGameId) { output.textContent='Wait for the game to finish loading.';output.closest('details').open=true;return; }
    output.closest('details').open=false;
    const token={};
    active={token,rows:[],rafs:0,start:performance.now(),timer:setTimeout(()=>finish('complete'),20000)};
    window.__systemlessFrameTrace=[];
    const frame=()=>{if(active?.token===token){active.rafs++;requestAnimationFrame(frame);}};
    requestAnimationFrame(frame);
    startButton.disabled=true;startButton.textContent='Capturing for 20 seconds…';
    canvas.focus({preventScroll:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish('invalid: tab hidden');});
  window.addEventListener('blur',()=>finish('invalid: browser lost focus'));
  function attach() {
    const toolbar=document.querySelector('.koji-toolbar');
    if (!toolbar || document.getElementById('runtime-profile-panel')) return;
    const panel=document.createElement('section');panel.id='runtime-profile-panel';
    panel.style.cssText='border:1px solid #888;padding:8px;margin:8px 0;font:13px monospace;background:#f4f4ee;color:#171717';
    panel.innerHTML='<strong>Runtime timing — opt-in diagnostics</strong> <button type="button">Capture 20 seconds</button> <button type="button" disabled>Download timing JSON</button><details><summary>Timing results</summary><pre data-testid="runtime-profile-results" style="white-space:pre-wrap;max-height:400px;overflow:auto">Start gameplay, then capture with this tab visible and focused.</pre></details>';
    if(testMhz)panel.querySelector('strong').textContent='Runtime timing — TEST budget '+testMhz+' MHz';
    startButton=panel.querySelector('button');downloadButton=panel.querySelectorAll('button')[1];output=panel.querySelector('pre');
    startButton.onclick=capture;
    downloadButton.onclick=()=>{const a=document.createElement('a');const u=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));a.href=u;a.download='clockwerx-timing.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
    toolbar.after(panel);
  }
  new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});attach();
})();