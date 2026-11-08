import {MovementGame,TAU} from './engine.mjs';
import {buildBoard} from './board.mjs';
import {dotRenderSpec} from './dots.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound,sourceFrame} from './round.mjs';
import {createDeathEffect} from './death.mjs';
import {createInputReplay} from './replay.mjs';
import {createSparkles} from './sparkles.mjs';
import {handPoses,presentedAngle,resizeCanvas,atlasFrame} from './rendering.mjs';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const bootUtc=new Date().toISOString(),bootStart=performance.now(),KEY='systemless.clockwerx-html5.pilot.v1',STEP=1/120;
let settings={black:false,sound:false,completed:0};try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
settings.sound=false; // Every visit starts silent; audio is a deliberate user opt-in.
let sparkleSystems=[],renderPrevious=null,manifest,game,images={},audio={},ready=false,last=performance.now(),accumulator=0,renderCalls=0,rafCalls=0,droppedSeconds=0,held={},padHeld={},previousPad=[],capture=null,lastCapture=null,memoryResult=null,memoryPending=false,recordedUntil=0,lastEvent=0;
const startup={bootUtc,boundary:'module evaluation to required foreground/background image decode and manifest parse complete',assetReadyUtc:null,readyMs:null,resourceEntries:[]};
let inputReplay=null,checkedRoute=null;
let wallLayer=null,wallLayerBoard=null;
const movementScope=$('scope-description').textContent,movementFidelity=$('fidelity-description').textContent;
function persist(){try{localStorage.setItem(KEY,JSON.stringify({black:settings.black,completed:settings.completed}))}catch{}}
function message(s,error=false){$('status').textContent=s;$('status').className=error?'error':'';}
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function action(name,on){inputReplay=null;held[name]=on;canvas.focus({preventScroll:true})}
function pause(){if(!game)return;game.paused=!game.paused;$('pause').textContent=game.paused?'Resume (P)':'Pause (P)';message(game.paused?'Paused. Press P or Resume to continue.':'Movement resumed.');}
function restart(){if(!game)return;inputReplay=null;if(capture)capture.invalidReasons.add('board restart during capture');game.board.dots.forEach(d=>delete d.collected);game.reset();resetSparkles();renderPrevious=null;lastEvent=0;recordedUntil=0;held={};$('pause').textContent='Pause (P)';message((game.board.title||'Movement')+' restarted. Hold Space as the hand passes the next dot.');canvas.focus({preventScroll:true});}
$('pause').onclick=pause;$('restart').onclick=restart;$('reverse').onclick=()=>game?.reverse();$('black').onclick=()=>{if(capture)capture.invalidReasons.add('hand color changed during capture');settings.black=!settings.black;if(game instanceof SourceRound)game.setPlayerGroup(settings.black?4300:700);persist()};$('sound').checked=settings.sound;$('sound').onchange=()=>{if(capture)capture.invalidReasons.add('sound changed during capture');settings.sound=$('sound').checked;persist();if(settings.sound)playSound('ActionSwing')};
const keys={Space:'swing',KeyZ:'bounce',KeyX:'flip'};
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(keys[e.code]){e.preventDefault();inputReplay=null;held[keys[e.code]]=true;}if(!e.repeat&&e.code==='KeyC'){e.preventDefault();game?.reverse()}if(!e.repeat&&e.code==='KeyP'){e.preventDefault();pause()}});
window.addEventListener('keyup',e=>{if(keys[e.code]){e.preventDefault();held[keys[e.code]]=false}});
window.addEventListener('blur',()=>{held={};padHeld={};previousPad=[];if(capture)capture.invalidReasons.add('window blur');});
document.addEventListener('visibilitychange',()=>{if(capture&&document.hidden)capture.invalidReasons.add('document hidden');last=performance.now();accumulator=0;});
canvas.onclick=()=>canvas.focus({preventScroll:true});
for(const button of document.querySelectorAll('[data-action]')){button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);action(button.dataset.action,true)};button.onpointerup=()=>action(button.dataset.action,false);button.onpointercancel=()=>action(button.dataset.action,false);}
function padStatus(s){if($('padstatus').textContent!==s)$('padstatus').textContent=s;}
function pollGamepad(){
 padHeld={};if(document.hidden||!document.hasFocus()){previousPad=[];padStatus('Controller inactive while page is unfocused or hidden.');return;}
 let pads;try{pads=Array.from(navigator.getGamepads?.()||[]).filter(Boolean)}catch{previousPad=[];padStatus('Gamepad API unavailable in this browser context; use keyboard.');return;}const p=pads.find(p=>p.mapping==='standard');
 if(!p){previousPad=[];padStatus(pads.length?'Nonstandard controller mapping ignored; use keyboard.':'No standard gamepad detected. Physical hardware unqualified.');return;}
 padStatus('Standard gamepad adapter active; physical hardware unqualified.');const b=p.buttons.map(b=>b.pressed);padHeld={swing:b[0],bounce:b[1],flip:b[2]};if(b[3]&&!previousPad[3])game?.reverse();if(b[9]&&!previousPad[9])pause();previousPad=b;
}
function playSound(name){if(!settings.sound||!audio[name])return;const s=audio[name].cloneNode();s.volume=.45;s.play().catch(()=>{});}

function resetSparkles(){
 sparkleSystems=[];const spec=manifest.vectorAssets?.starbursts;if(!spec)return;
 const lifecycle=spec.lifecycle,animation=spec.animation;
 const add=(anchor,direction)=>{const system=createSparkles({offsets:lifecycle.offsets,frameCount:animation.frameCount,frameSeconds:animation.frameSeconds,spawnFrame:lifecycle.spawnFrame,direction});system.reset(anchor());sparkleSystems.push({system,anchor});};
 add(()=>game.board.dots.find(d=>d.id===game.player.pivot),lifecycle.playerDirection==='opposite-initial-hand'?-game.player.direction:game.player.direction);
 for(const dot of game.board.dots.filter(d=>d.kind==='goal'))add(()=>dot,lifecycle.goalDirection);
}
function stopSparkles(){for(const {system} of sparkleSystems)system.stopSpawning();}
function playerAttentionAction(e){return e.hand==='player'&&['swing','flip','bounce','reverse'].includes(e.type);}
function updateSparkles(dt){for(const {system,anchor} of sparkleSystems)system.update(dt,anchor());}
function drawSparkles(){
 const spec=manifest.vectorAssets?.starbursts;if(!spec)return;const a=spec.animation;
 for(const {system} of sparkleSystems)for(const p of system.snapshot()){const index=a.frameOrder?.[p.frame]??p.frame;ctx.drawImage(images[spec.file],index*a.frameWidth,0,a.frameWidth,a.frameHeight,p.x+spec.x,p.y+spec.y,spec.width,spec.height);}
}
function sprite(gid,index,x,y){const g=manifest.groups[gid],f=g.frames[index%g.frames.length],im=images[g.images[f.image]];if(!im)return;ctx.save();ctx.translate(Math.round(x+f.x),Math.round(y+f.y));if(f.flipY){ctx.scale(1,-1);ctx.drawImage(im,0,-im.height)}else ctx.drawImage(im,0,0);ctx.restore();}
function drawHand(h){
 const p=game.board.dots.find(d=>d.id===h.pivot),gid=h.name==='player'?(settings.black?'4300':'700'):String(h.group);
 if(manifest.vectorAssets){
  const asset=manifest.vectorAssets.hands[gid],angle=presentedAngle(h,renderPrevious?.[h.name],accumulator/STEP,true);
  ctx.save();ctx.translate(p.x,p.y+(game.board.handOffsetY||0));ctx.rotate(angle);ctx.drawImage(images[asset.file],asset.x,asset.y,asset.width,asset.height);ctx.restore();
 }else{const a=((h.angle%TAU)+TAU)%TAU;sprite(gid,Math.round(a/TAU*64)%64,p.x,p.y);}
}
function drawSpikes(){
 const spec=manifest.vectorAssets?.spikes;
 if(!spec)return;
 for(const spike of game.board.spikes||[]){const f=spec.frames[game.spikeFrame(spike)];ctx.drawImage(images[f.file],spike.x+f.x,spike.y+f.y,f.width,f.height);}
}
function drawWalls(){
 const spec=manifest.vectorAssets?.walls;if(!spec||!game.board.walls?.length)return;
 if(!wallLayer||wallLayer.width!==canvas.width||wallLayer.height!==canvas.height||wallLayerBoard!==game.board){
  wallLayer=document.createElement('canvas');wallLayer.width=canvas.width;wallLayer.height=canvas.height;
  const layer=wallLayer.getContext('2d'),frames=Object.fromEntries(spec.frames.map(f=>[f.frame,f]));
  layer.setTransform(canvas.width/640,0,0,canvas.height/480,0,0);
  for(const tile of game.board.walls){const f=frames[tile.frame];if(!f)throw new Error('Missing wall artwork '+tile.frame);layer.drawImage(images[f.file],tile.x+f.x,tile.y+f.y,f.width,f.height);}
  wallLayerBoard=game.board;
 }
 ctx.drawImage(wallLayer,0,0,640,480);
}
function drawDeath(){
 const spec=manifest.vectorAssets?.death;if(!spec||!game.death)return;
 for(const particle of game.death.snapshot()){
  const f=spec.frames[particle.frame];
  if(spec.file)ctx.drawImage(images[spec.file],f.sx,f.sy,f.width,f.height,particle.x+f.x,particle.y+f.y,f.width,f.height);
  else ctx.drawImage(images[f.file],particle.x+f.x,particle.y+f.y,f.width,f.height);
 }
}
function drawDoors(){
 const spec=manifest.vectorAssets?.doors;if(!spec||!game.doorSystem)return;
 const state=game.doorSystem.snapshot();
 const draw=(kind,index,base)=>{
  const atlas=spec[kind],f=atlas.frames[index];if(!f||!f.width||!f.height)return;
  ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,base.x+f.x,base.y+f.y,f.width,f.height);
 };
 for(const [i,door] of (game.board.doors||[]).entries()){
  for(const cap of door.caps)draw('caps',cap.frame,cap);
  draw('leaves',state.doors[i].frame,door.base);draw('leaves',state.doors[i].secondFrame,door.base);
 }
 for(const [i,s] of (game.board.switches||[]).entries())draw('switches',state.switches[i].frame,s);
}
function drawOil(){
 const spec=manifest.vectorAssets?.oil;if(!spec||!game.oil)return;
 const state=game.oil.snapshot();
 const draw=(atlas,s)=>{
  if(!s.visible)return;const f=atlas.frames[s.frame];if(!f||!f.width||!f.height)return;
  ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,s.base.x+f.x,s.base.y+f.y,f.width,f.height);
 };
 for(const puddle of state.puddles)draw(spec.puddles,puddle);
 for(const droplet of state.droplets)draw(spec.droplets,droplet);
 for(const fader of state.faders)draw(spec.droplets,fader);
}
function drawLevelText(){
 if(!game.board.texts)return false;
 ctx.fillStyle='white';ctx.textBaseline='top';
 for(const t of game.board.texts){
  if(t.condition==='@2'||t.condition==='@M')continue;
  ctx.font=`${t.face&2?'italic ':''}${t.face&1?'bold ':''}${t.size}px Arial,sans-serif`;
  ctx.fillText(t.text,t.x,t.y+(t.size===9?2:3));
 }
 ctx.textBaseline='alphabetic';return true;
}
function drawDot(d){
 const state=dotRenderSpec(d),vector=manifest.vectorAssets,goal=d.kind==='goal'&&vector?.goal;
 let spec,im;
 if(vector?.dotVariants){spec=vector.dotVariants[state.assetKey];if(!spec)throw new Error('Unsupported private dot artwork: '+state.assetKey);im=images[spec.file];}
 else if(vector){const index=state.bonus?(state.color===0?1:state.color===4?5:state.color===2?3:2):(state.color===4?5:state.color===2?3:state.color===1?2:0);im=images[vector.dots[index]];spec={x:-im.width/2,y:-im.height/2,width:im.width,height:im.height};}
 else{const group=manifest.groups['300'],frame=group.frames.find(f=>f.id===state.sourceDescriptor);if(!frame)throw new Error('Missing original dot descriptor '+state.sourceDescriptor);im=images[group.images[frame.image]];spec={x:frame.x,y:frame.y,width:im.width,height:im.height};}
 ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(d.x+8,d.y+9,5,4,0,0,TAU);ctx.fill();
 if(goal){ctx.save();ctx.translate(d.x,d.y);const frame=atlasFrame(goal.animation,game.time);if(frame)ctx.drawImage(images[goal.file],frame.x,frame.y,frame.width,frame.height,goal.x,goal.y,goal.width,goal.height);else{if(goal.rotationSeconds>0)ctx.rotate(game.time/goal.rotationSeconds*TAU);ctx.drawImage(images[goal.file],goal.x,goal.y,goal.width,goal.height);}ctx.restore();}
 ctx.drawImage(im,Math.round(d.x+spec.x),Math.round(d.y+spec.y),spec.width,spec.height);
}
function draw(){renderCalls++;const scale=resizeCanvas(canvas,window.devicePixelRatio||1);ctx.setTransform(scale.scaleX,0,0,scale.scaleY,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#909090';ctx.fillRect(0,0,640,480);if(!ready){ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText('Loading private original assets…',20,50);return;}
 ctx.drawImage(images[manifest.backdrop],0,0);ctx.imageSmoothingEnabled=!!manifest.vectorAssets;
 ctx.fillStyle='#808080';ctx.fillRect(68,69,504,360);ctx.fillStyle='white';ctx.font='bold 12px sans-serif';ctx.fillText('Level:',106,49);ctx.fillText(`${game.board.ordinal||1}: ${game.board.title||'Movement'}`,92,62);ctx.fillStyle='#ffff00';ctx.fillText('Pilot',441,50);ctx.fillText('Total Score:',493,49);ctx.fillText('—',544,62);
 if(game.paused){ctx.fillStyle='#ffff00';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('Paused',320,252);ctx.textAlign='left';return;}
 drawWalls();for(const d of game.board.dots)drawDot(d);
 drawDoors();
 drawOil();
 drawSpikes();
 ctx.fillStyle='white';ctx.font='10px sans-serif';
 const lines=[['You are the spinning gold (or black) hand.',88,150],['Player 1: Use Space to “swing” onto the next dot.',88,162],['The red hand is “swinging”.',109,292],['The green hand is “flipping”.',109,388],['Use X to “flip” onto the next dot.',137,174],['Use C to “instantly reverse”.',137,186],['Use Z to “bounce” off the next dot.',137,198],['The object of the game is to grab onto the “goal” dot.',148,80],['Bonus Dot',487,237],['Goal Dot',534,333],['“Bouncing” blue',410,360]];
 if(!drawLevelText())for(const [t,x,y] of lines)ctx.fillText(t,x,y);
 for(const h of [...game.demos,...(game.enemies||[])])drawHand(h);
 if(!game.death||game.death.heroVisible)drawHand(game.player);
 drawDeath();
 drawSparkles();
 if(game.complete){ctx.fillStyle='rgba(20,20,20,.88)';ctx.fillRect(120,170,400,120);ctx.fillStyle='#ffe66b';ctx.textAlign='center';ctx.font='bold 25px serif';ctx.fillText((game.board.title||'Movement')+' complete',320,214);ctx.font='16px sans-serif';ctx.fillText('Goal dot grabbed · Restart to play again',320,250);ctx.textAlign='left';}
}
function workloadTime(){return game.elapsedTime??game.time;}
function captureInfo(){return {visibility:document.visibilityState,focused:document.hasFocus()};}
function finishCapture(now){const c=capture;if(!c)return;lastCapture={schema:'clockwerx-html5-timing-v1',captureUtc:c.utc,completionUtc:new Date().toISOString(),durationMs:now-c.start,requestedDurationMs:20000,valid:c.invalidReasons.size===0,invalidReasons:[...c.invalidReasons],scene:(game.board.title||'Movement')+(c.fromRestart?'; atomic reset; no-input rotating scene':'; current state at capture start'),fromRestart:c.fromRestart,pageUrl:location.href,workload:c.workload,boundary:'main-thread rAF entry through fixed simulation and Canvas2D draw; SVG mode includes interpolated vector image rotation; not physical presentation or input latency',presentation:manifest.vectorAssets?'svg-continuous':'bitmap-64-directions',devicePixelRatio:window.devicePixelRatio||1,logicalSize:[640,480],backingSize:[canvas.width,canvas.height],cssSize:[canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height],sound:c.sound,handColor:c.handColor,startState:c.state,endState:game.snapshot(),startFocus:c.focus,endFocus:captureInfo(),counters:{rafCallbacks:rafCalls-c.raf,renderCalls:renderCalls-c.render,fixedStepCalls:game.steps-c.steps,activeSimulationSteps:game.activeSteps-c.activeSteps,droppedCatchupSeconds:droppedSeconds-c.dropped},frames:c.frames,startup,pageMemory:memoryResult,userAgent:navigator.userAgent};capture=null;$('capture').disabled=false;$('capture-reset').disabled=false;$('json').disabled=false;$('diagnostics').textContent=`Capture complete: ${lastCapture.valid?'valid':'INVALID — '+lastCapture.invalidReasons.join(', ')}. ${lastCapture.frames.length} raw rAF records. Download JSON.`;}
function beginCapture(fromRestart=false){if(!ready||capture||memoryPending)return;if(fromRestart){restart();accumulator=0;last=performance.now();padHeld={};previousPad=[];}const focus=captureInfo();capture={fromRestart,sound:settings.sound,handColor:settings.black?'black':'gold',start:performance.now(),utc:new Date().toISOString(),focus,state:game.snapshot(),workload:inputReplay?'checked input-only route replay':recordedUntil>workloadTime()?'recorded swing hold until simulation second12':'manual inputs only; idle comparison requires no input',raf:rafCalls,render:renderCalls,steps:game.steps,activeSteps:game.activeSteps,dropped:droppedSeconds,frames:[],invalidReasons:new Set()};if(document.hidden)capture.invalidReasons.add('started hidden');if(!focus.focused)capture.invalidReasons.add('started unfocused');$('capture').disabled=true;$('capture-reset').disabled=true;$('json').disabled=true;$('diagnostics').textContent='Capturing 20 seconds; keep this window visible and focused.';}
$('capture').onclick=()=>beginCapture();$('capture-reset').onclick=()=>beginCapture(true);
$('json').onclick=()=>{if(lastCapture)download(`clockwerx-html5-${lastCapture.captureUtc.replaceAll(':','-')}.json`,new Blob([JSON.stringify({...lastCapture,pageMemory:memoryResult},null,2)],{type:'application/json'}));};
$('png').onclick=()=>{if(capture)capture.invalidReasons.add('PNG export during timing capture');draw();canvas.toBlob(b=>{if(b)download('clockwerx-html5-canvas.png',b)},'image/png');};
$('memory').onclick=async()=>{if(capture){$('diagnostics').textContent='Memory measurement is disabled during capture.';return;}const start=new Date().toISOString();memoryPending=true;$('capture').disabled=true;$('capture-reset').disabled=true;$('memory').disabled=true;$('diagnostics').textContent='Measuring page memory…';try{if(performance.measureUserAgentSpecificMemory){const m=await performance.measureUserAgentSpecificMemory();memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'completed',method:'measureUserAgentSpecificMemory',boundary:'browser-reported page-associated memory; not process RSS or physical RAM',result:m};}else memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'unavailable',boundary:'No supported page memory API; no estimate invented'};}catch(e){memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'failed',error:String(e),boundary:'No memory result'}}finally{memoryPending=false;$('capture').disabled=false;$('capture-reset').disabled=false;$('memory').disabled=false;$('diagnostics').textContent=JSON.stringify(memoryResult);}};
$('route').onclick=()=>{restart();inputReplay=createInputReplay(checkedRoute);message('Replaying a checked input route through the current game rules.');};
$('workload').onclick=()=>{restart();recordedUntil=12;message('Recorded input demo: swing held for 12 simulation seconds; no other actions.');};
function frame(now){const entry=performance.now(),delta=Math.max(0,(now-last)/1000);last=now;rafCalls++;pollGamepad();if(game?.events.some(e=>e.sequence>lastEvent&&playerAttentionAction(e)))stopSparkles();let n=0,activeN=0;if(ready&&!document.hidden){const cap=Math.min(delta,.25);if(capture&&delta>.25)capture.invalidReasons.add('simulation catch-up capped');droppedSeconds+=Math.max(0,delta-cap);accumulator+=cap;while(accumulator>=STEP){let input={...held};for(const k of ['swing','bounce','flip'])input[k]=input[k]||padHeld[k];if(recordedUntil>workloadTime())input.swing=true;if(inputReplay&&!game.paused&&!game.complete)input=inputReplay.next();const activeBefore=game.activeSteps;renderPrevious=handPoses(game);const sequenceBefore=game.eventSequence;game.update(STEP,input);if(game.events.some(e=>e.sequence>sequenceBefore&&e.type==='death')){inputReplay=null;message('Caught. The round will restart after the effect.');}if(game.events.some(e=>e.sequence>sequenceBefore&&e.type==='round-reset')){resetSparkles();renderPrevious=null;message((game.board.title||'Movement')+' restarted after contact.');}if(game.events.some(e=>e.sequence>sequenceBefore&&playerAttentionAction(e)))stopSparkles();if(game.activeSteps>activeBefore&&!game.death)updateSparkles(STEP);activeN+=game.activeSteps-activeBefore;accumulator-=STEP;n++;}for(const e of game.events.filter(e=>e.sequence>lastEvent)){playSound(e.type==='flip'?'ActionFlip':e.type==='bounce'?'ActionBounce':e.type==='swing'?'ActionSwing':'');if(e.type==='goal'){settings.completed++;persist();message('Goal dot grabbed. '+(game.board.title||'Movement')+' complete.');}}lastEvent=game.eventSequence;}const drawStart=performance.now();draw();const end=performance.now();if(capture){if(document.hidden)capture.invalidReasons.add('document hidden');if(!document.hasFocus())capture.invalidReasons.add('window unfocused');capture.frames.push({tMs:now-capture.start,rafTimestampMs:now,rafDeltaMs:delta*1000,fixedStepCalls:n,activeSimulationSteps:activeN,renderCalls:1,updateAndInputMs:drawStart-entry,renderMs:end-drawStart,totalWorkMs:end-entry,visible:!document.hidden,focused:document.hasFocus(),gamePaused:game.paused,gameComplete:game.complete,gameTimeSeconds:game.time,recordedSwingActive:recordedUntil>workloadTime(),presentedStarbursts:sparkleSystems.map(({system})=>system.snapshot()),presentedPlayer:{angle:presentedAngle(game.player,renderPrevious?.player,accumulator/STEP,!!manifest.vectorAssets),pivot:game.player.pivot,direction:game.player.direction},replayedInput:inputReplay?.snapshot()||null,heldActions:{...held,...Object.fromEntries(Object.entries(padHeld).filter(([,v])=>v))}});if(now-capture.start>=20000)finishCapture(now);}requestAnimationFrame(frame);}
async function loadScene(scene){
 if(capture){capture.invalidReasons.add('scene changed');finishCapture(performance.now());}
 ready=false;held={};padHeld={};previousPad=[];inputReplay=null;recordedUntil=0;renderPrevious=null;lastEvent=0;
 const reference=scene.levelDefinition;
 if(reference){
  const profileResponse=await fetch('./assets/'+reference.outlinesFile);
  if(!profileResponse.ok)throw new Error('Source collision profile is unavailable');
  const outlines=await profileResponse.json();
  let doorOutlines;
  if(reference.doorOutlinesFile){const r=await fetch('./assets/'+reference.doorOutlinesFile);if(!r.ok)throw new Error('Door collision profile is unavailable');doorOutlines=await r.json();}
  const profile=async key=>{if(!reference[key])return undefined;const r=await fetch('./assets/'+reference[key]);if(!r.ok)throw new Error('Required source profile unavailable');return r.json();};
  const oilOutlines=await profile('oilOutlinesFile'),dotOutlines=await profile('dotOutlinesFile');
  const board=buildDecodedBoard(reference.data,{ordinal:reference.ordinal,title:reference.title,angularSpeed:TAU*960/(76*64),allowOil:reference.oilQualified===true});
  board.player.group=settings.black?4300:700;
  game=new SourceRound(board,{outlines,doorOutlines,oilOutlines,dotOutlines,oilBounds:reference.oilBounds,deathFactory:(pivot,hand,clock)=>createDeathEffect({pivot,frame:sourceFrame(hand.angle),randomUnsigned:()=>Math.floor(Math.random()*65536),clock,advanceClock:false})});
  $('presentation').textContent='Private SVG pilot · source map, collision outlines and death lifecycle. Continuous hand timing uses the source Child-speed average at 60 guest ticks/second.';
  $('scope-description').textContent=board.title+'. '+(board.puddles.length?'Touching sleeping oil wakes it. It pursues you across dots and can split. Avoid letting it grab your pivot. ':'Switch entry toggles matching doors; release changes only the switch art. ')+'A death freezes play, runs staggered explosions, then resets the round. Original scoring, full audio, campaign saves and physical controller hardware are unqualified or omitted.';
  $('fidelity-description').textContent='Source map, phases, placements and collision profiles; reconstructed smooth artwork and fonts. Hand motion uses the source Child-speed average with 60 guest ticks per second. Exact input cadence, random stream, reveal pacing and original hardware timing remain under review.';
 }else{
  game=new MovementGame(buildBoard(manifest));
  $('presentation').textContent=manifest.vectorAssets?'Private HTML5 pilot · SVG hands and map dots over the original bitmap background. Reconstructed rules and timing.':'Private HTML5 pilot using the original bitmap foreground and background. Reconstructed rules and timing.';
  $('scope-description').textContent=movementScope;$('fidelity-description').textContent=movementFidelity;
 }
 checkedRoute=scene.checkedRoute||null;$('route').hidden=!checkedRoute;
 const title=game.board.title||'Movement';document.title=`ClockWerx ${title} — HTML5 pilot`;
 document.querySelector('h1').textContent=`ClockWerx · ${title}`;canvas.setAttribute('aria-label',title+' game');
 $('pause').textContent='Pause (P)';resetSparkles();last=performance.now();accumulator=0;ready=true;
 message(`${title} ready · ${manifest.vectorAssets?'SVG foreground, continuous rotation':'original bitmap foreground'}. Space swing · Z bounce · X flip · C reverse.`);
}
async function load(){
 try{
  const r=await fetch('./assets/manifest.json');if(!r.ok)throw new Error(`manifest HTTP ${r.status}`);
  manifest=await r.json();const vector=manifest.vectorAssets;
  if(!vector)$('presentation').textContent='Private HTML5 pilot using the original bitmap foreground and background. One tutorial board; reconstructed rules and timing.';
  const foreground=vector?[
   ...Object.values(vector.hands).map(h=>h.file),...vector.dots,
   ...Object.values(vector.dotVariants||{}).map(d=>d.file),
   ...(vector.goal?[vector.goal.file]:[]),...(vector.starbursts?[vector.starbursts.file]:[]),
   ...(vector.spikes?.frames||[]).map(f=>f.file),
   ...(vector.walls?.frames||[]).map(f=>f.file),
   ...['leaves','caps','switches'].flatMap(key=>vector.doors?.[key]?[vector.doors[key].file]:[]),
   ...['puddles','droplets'].flatMap(key=>vector.oil?.[key]?[vector.oil[key].file]:[]),
   ...(vector.death?.file?[vector.death.file]:(vector.death?.frames||[]).map(f=>f.file))
  ]:Object.entries(manifest.groups).flatMap(([gid,g])=>gid==='401'?[]:gid==='300'?g.images.slice(0,16):g.images);
  const names=[...new Set([...foreground,manifest.backdrop])];
  await Promise.all(names.map(async name=>{const im=new Image();im.src='./assets/'+name;await im.decode();images[name]=im;}));
  for(const [name,fn] of Object.entries(manifest.sounds||{})){audio[name]=new Audio('./assets/'+fn);audio[name].preload='auto';}
  const scenes=manifest.scenes||[{id:'single',title:manifest.levelDefinition?.title||'Movement',levelDefinition:manifest.levelDefinition,checkedRoute:manifest.checkedRoute}];
  $('level').replaceChildren(...scenes.map((scene,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=(scene.ordinal?scene.ordinal+': ':'')+scene.title;return option;}));
  $('level-picker').hidden=scenes.length<2;
  $('level').onchange=()=>loadScene(scenes[Number($('level').value)]).catch(e=>message('Level unavailable: '+e.message,true));
  await loadScene(scenes[0]);
startup.assetReadyUtc=new Date().toISOString();startup.readyMs=performance.now()-bootStart;
  startup.resourceEntries=performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,durationMs:r.duration,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize}));
  message(`${game.board.title||'Movement'} ready · ${vector?'SVG foreground, continuous rotation':'original bitmap foreground'}. Space swing · Z bounce · X flip · C reverse.`);
 }catch(e){message(`Private ClockWerx assets missing or unreadable: ${e.message}. Run extract_assets.py on your owned copied fixture and place its output in this route’s assets/ folder.`,true);}
}
load();requestAnimationFrame(frame);
