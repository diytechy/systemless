import {validateMovingBombSpikeWaystationAssets} from './moving-bomb-spike-waystation.mjs';
import {validateMovingSpikeAssets} from './moving-spikes.mjs';
import {connectorLook} from './sliding.mjs';
import {sourceDotPaint,sourceDotLook,sourceGoalPaint,sourceSparkEraseRect,clipSourceUniverse,createSourceBackground} from './sliding-bomb-paint.mjs';
import {gunPaintFrames} from './gun-triggers.mjs';
import {MovementGame,TAU} from './engine.mjs';
import {buildBoard} from './board.mjs';
import {dotRenderSpec} from './dots.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound,sourceFrame} from './round.mjs';
import {createDeathEffect} from './death.mjs';
import {createInputReplay} from './replay.mjs';
import {createSparkles} from './sparkles.mjs';
import {handPoses,presentedAngle,presentedFaderFrame,resizeCanvas,atlasFrame} from './rendering.mjs';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const bootUtc=new Date().toISOString(),bootStart=performance.now(),KEY='systemless.clockwerx-html5.pilot.v1',STEP=1/120;
let settings={black:false,sound:false,completed:0};try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
settings.sound=false; // Every visit starts silent; audio is a deliberate user opt-in.
let sparkleSystems=[],renderPrevious=null,manifest,game,images={},audio={},ready=false,last=performance.now(),accumulator=0,renderCalls=0,rafCalls=0,droppedSeconds=0,held={},padHeld={},previousPad=[],capture=null,lastCapture=null,memoryResult=null,memoryPending=false,recordedUntil=0,lastEvent=0;
const startup={bootUtc,boundary:'module evaluation to required foreground/background image decode and manifest parse complete',assetReadyUtc:null,readyMs:null,resourceEntries:[]};
let inputReplay=null,checkedRoute=null,pilotInputBlocked=false;
let wallLayer=null,wallLayerBoard=null,wallLayerRevision=null;
let activeBackdrop,activePlayfield,activeScene;
const movementScope=$('scope-description').textContent,movementFidelity=$('fidelity-description').textContent;
function persist(){try{localStorage.setItem(KEY,JSON.stringify({black:settings.black,completed:settings.completed}))}catch{}}
function message(s,error=false){$('status').textContent=s;$('status').className=error?'error':'';}
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function action(name,on){inputReplay=null;held[name]=on;canvas.focus({preventScroll:true})}
function pause(){if(!game)return;game.paused=!game.paused;$('pause').textContent=game.paused?'Resume (P)':'Pause (P)';message(game.paused?'Paused. Press P or Resume to continue.':'Movement resumed.');}
function restart(){if(!game)return;inputReplay=null;if(capture)capture.invalidReasons.add('board restart during capture');game.board.dots.forEach(d=>delete d.collected);game.reset();resetSparkles();renderPrevious=null;lastEvent=0;recordedUntil=0;held={};$('pause').textContent='Pause (P)';message((game.board.title||'Movement')+' restarted. Hold Space as the hand passes the next dot.');canvas.focus({preventScroll:true});}
$('pause').onclick=pause;$('restart').onclick=restart;$('reverse').onclick=()=>{if(!pilotInputBlocked)game?.reverse();};$('black').onclick=()=>{if(capture)capture.invalidReasons.add('hand color changed during capture');settings.black=!settings.black;if(game instanceof SourceRound)game.setPlayerGroup(settings.black?4300:700);persist()};$('sound').checked=settings.sound;$('sound').onchange=()=>{if(capture)capture.invalidReasons.add('sound changed during capture');settings.sound=$('sound').checked;persist();if(settings.sound)playSound('ActionSwing')};
const keys={Space:'swing',KeyZ:'bounce',KeyX:'flip'};
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(keys[e.code]){e.preventDefault();inputReplay=null;held[keys[e.code]]=true;}if(!e.repeat&&e.code==='KeyC'){e.preventDefault();if(!pilotInputBlocked)game?.reverse()}if(!e.repeat&&e.code==='KeyP'){e.preventDefault();pause()}});
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
 padStatus('Standard gamepad adapter active; physical hardware unqualified.');const b=p.buttons.map(b=>b.pressed);padHeld={swing:b[0],bounce:b[1],flip:b[2]};if(b[3]&&!previousPad[3]&&!pilotInputBlocked)game?.reverse();if(b[9]&&!previousPad[9])pause();previousPad=b;
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
function drawBuster(p,angle){const a=manifest.vectorAssets.busters;if(!a)throw Error('Buster artwork required');ctx.drawImage(images[a.file],p.x+a.radius*Math.cos(angle)+a.x,p.y+(game.board.handOffsetY||0)+a.radius*Math.sin(angle)+a.y,a.width,a.height);}
function drawHand(h){
 if(h.visible===false)return;
 const p=game.point?game.point(h):game.board.dots.find(d=>d.id===h.pivot),gid=h.name==='player'?(settings.black?'4300':'700'):String(h.group);
 if(h.sourceActorType===5&&manifest.vectorAssets){drawBuster(p,presentedAngle(h,renderPrevious?.[h.name],accumulator/STEP,true));return;}
 if(h.sourceActorType===4&&manifest.vectorAssets){
  const asset=manifest.vectorAssets.rotatingSpikes;
  if(!asset)throw new Error('Qualified rotating spike artwork required');
  const angle=presentedAngle(h,renderPrevious?.[h.name],accumulator/STEP,true);
  // This source sprite is a small spiked orb orbiting the pivot, with fixed
  // screen-space lighting/shadow. It is not a rotating ordinary hand.
  ctx.drawImage(images[asset.file],p.x+asset.radius*Math.cos(angle)+asset.x,p.y+(game.board.handOffsetY||0)+asset.radius*Math.sin(angle)+asset.y,asset.width,asset.height);
  return;
 }
 if(manifest.vectorAssets){
  const asset=manifest.vectorAssets.hands[gid],angle=presentedAngle(h,renderPrevious?.[h.name],accumulator/STEP,true);
  ctx.save();ctx.translate(p.x,p.y+(game.board.handOffsetY||0));ctx.rotate(angle);ctx.drawImage(images[asset.file],asset.x,asset.y,asset.width,asset.height);ctx.restore();
 }else{const a=((h.angle%TAU)+TAU)%TAU;sprite(gid,Math.round(a/TAU*64)%64,p.x,p.y);}
}
function drawSpikes(){
 const spec=manifest.vectorAssets?.spikes;
 if(!spec)return;
 for(const spike of game.board.spikes||[]){if(spike.visible===false)continue;const f=spec.frames[game.spikeFrame(spike)];ctx.drawImage(images[f.file],spike.x+f.x,spike.y+f.y,f.width,f.height);}
}
function drawTeleportAtlas(atlas,frame,base){
 const f=atlas?.frames.find(f=>f.frame===frame);
 if(!f)throw new Error('Required teleport artwork frame unavailable: '+frame);
 if(!f.empty&&f.width&&f.height)ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,base.x+f.x,base.y+f.y,f.width,f.height);
}
function drawTeleports(){
 if(!game.teleports)return;
 const atlas=manifest.vectorAssets?.teleports?.symbols;
 for(const e of game.teleports.snapshot().endpoints)drawTeleportAtlas(atlas,e.frame,e);
}
function drawActorFaders(){
 if(!game.teleports)return;
 const atlas=manifest.vectorAssets?.teleports?.faders;
 for(const f of game.teleports.snapshot().faders)if(f.visible)drawTeleportAtlas(atlas,presentedFaderFrame(f,settings.black),f);
}
function drawConnectors(){
 if(!game.board.slidingConnectorRules)return;
 const spec=manifest.vectorAssets?.connectors,frames=spec?.frames;
 if(!frames)throw new Error('Qualified connector artwork required');
 for(const e of game.board.connectors){const d=game.board.dots.find(d=>d.id===e.first),i=connectorLook(e,game.board.dots),f=frames[i];if(!f)throw new Error('Missing source connector frame '+i);if(f.empty||!f.width||!f.height)continue;ctx.drawImage(images[spec.file],f.sx,f.sy,f.width,f.height,d.x-11+f.x,d.y-9+f.y,f.width,f.height);}
}
function drawWalls(){
 const spec=manifest.vectorAssets?.walls;if(!spec||!game.board.walls?.length)return;
 if(!wallLayer||wallLayer.width!==canvas.width||wallLayer.height!==canvas.height||wallLayerBoard!==game.board||wallLayerRevision!==game.board.wallRevision){
  wallLayer=document.createElement('canvas');wallLayer.width=canvas.width;wallLayer.height=canvas.height;
  const layer=wallLayer.getContext('2d'),frames=Object.fromEntries(spec.frames.map(f=>[f.frame,f]));
  layer.setTransform(canvas.width/640,0,0,canvas.height/480,0,0);
  for(const tile of game.board.walls){if(tile.visible===false)continue;const f=frames[tile.frame];if(!f)throw new Error('Missing wall artwork '+tile.frame);layer.drawImage(images[f.file],tile.x+f.x,tile.y+f.y,f.width,f.height);}
  wallLayerBoard=game.board;wallLayerRevision=game.board.wallRevision;
 }
 ctx.drawImage(wallLayer,0,0,640,480);
}
function drawBusterWallEffects(){
 if(!game.busterWallEffects?.length)return;
 const a=manifest.vectorAssets?.wallBursts;if(!a)throw Error('Wall burst artwork required');
 for(const e of game.busterWallEffects){
  const f=a.groups[e.group]?.[e.frame];if(!f)throw Error('Missing wall burst frame');
  ctx.drawImage(images[a.file],f.sx,f.sy,f.width,f.height,e.point.x+f.x,e.point.y+f.y,f.width,f.height);
 }
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
 for(const [i,s] of (game.board.switches||[]).entries())if(s.visible!==false)draw('switches',state.switches[i].frame,s);
}
function drawElevators(stage='all',paint){
 if(!game.elevators)return;const spec=manifest.vectorAssets?.elevators;
 if(!spec)throw new Error('Qualified elevator artwork required');
 const atlas=spec.controls,draw=(frame,c)=>{const f=atlas.frames.find(f=>f.frame===frame);if(!f)throw new Error('Missing elevator artwork');if(!f.empty)ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,c.x+f.x,c.y+f.y,f.width,f.height);};
 const controls=game.elevators.snapshot().controls;
 if(paint){draw(paint.frame,controls[paint.index]);return;}
 for(const c of controls){if(stage!=='glyphs')draw(c.group,c);if(stage!=='bodies'&&c.visible)draw(c.frame,c);}
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
 if(d.upDown){
  const state=game.elevators.snapshot().dots.find(s=>s.id===d.id),atlas=manifest.vectorAssets?.elevators?.surfaces;
  if(!atlas)throw new Error('Qualified up/down surface artwork required');
  const draw=frame=>{const f=atlas.frames.find(f=>f.frame===frame);if(!f)throw new Error('Missing up/down surface frame');if(!f.empty)ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,d.upDown.x-16+f.x,d.upDown.y-15+f.y,f.width,f.height);};
  draw(state.surfaceFrame);if(state.phase<6)draw(158-state.phase);if(!state.mainVisible)return;
 }
 const special=game.dotAnimations?.renderState(d.id),specialArt=manifest.vectorAssets?.specialDots;
 const drawSpecial=(group,frame)=>{
  const atlas=(d.burnt?manifest.vectorAssets?.bombDots?.[group]:null)||specialArt?.[group],f=atlas?.frames.find(f=>f.frame===frame);
  if(!f)throw new Error('Missing special dot artwork '+group+':'+frame);
  if(f.empty||!f.width||!f.height)return;
  ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,d.x-16+f.x,d.y-15+f.y,f.width,f.height);
 };
 if(d.slowdown){const atlas=manifest.vectorAssets?.slowDots,frame=d.sourceSlowFrame??189+d.color;for(const group of[4100,300]){const extra=game.board.slowdownWallRules?manifest.vectorAssets?.slowWallDots:null,blue=game.board.slowdownClass4Rules?manifest.vectorAssets?.slowClass4Dots:null,chosen=blue?.frames.some(f=>f.group===group&&f.frame===frame)?blue:extra?.frames.some(f=>f.group===group&&f.frame===frame)?extra:atlas,f=chosen?.frames.find(f=>f.group===group&&f.frame===frame);if(!f)throw Error('Missing slowdown artwork');ctx.drawImage(images[chosen.file],f.sx,f.sy,f.width,f.height,d.x-16+f.x,d.y-15+f.y,f.width,f.height);}return;}
 if(d.burnt){drawSpecial('4100',92+d.color);drawSpecial('300',92+d.color);return;}
 if(special?.main){
  if(special.main.visible){drawSpecial('4100',special.main.frame);drawSpecial('300',special.main.frame);}
  if(special.overlay)drawSpecial('300',special.overlay.frame);
  return;
 }
 const state=dotRenderSpec(d),vector=manifest.vectorAssets,goal=d.kind==='goal'&&vector?.goal;
 let spec,im;
 if(vector?.dotVariants){spec=vector.dotVariants[state.assetKey];if(!spec)throw new Error('Unsupported private dot artwork: '+state.assetKey);im=images[spec.file];}
 else if(vector){const index=state.bonus?(state.color===0?1:state.color===4?5:state.color===2?3:2):(state.color===4?5:state.color===2?3:state.color===1?2:0);im=images[vector.dots[index]];spec={x:-im.width/2,y:-im.height/2,width:im.width,height:im.height};}
 else{const group=manifest.groups['300'],frame=group.frames.find(f=>f.id===state.sourceDescriptor);if(!frame)throw new Error('Missing original dot descriptor '+state.sourceDescriptor);im=images[group.images[frame.image]];spec={x:frame.x,y:frame.y,width:im.width,height:im.height};}
 const shadow=d.upDown?{x:d.upDown.x+8-2*(12-d.upDownPhase),y:d.upDown.y+9}:{x:d.x+8,y:d.y+9};
 ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,5,4,0,0,TAU);ctx.fill();
 if(goal){ctx.save();ctx.translate(d.x,d.y);const frame=atlasFrame(goal.animation,game.time);if(frame)ctx.drawImage(images[goal.file],frame.x,frame.y,frame.width,frame.height,goal.x,goal.y,goal.width,goal.height);else{if(goal.rotationSeconds>0)ctx.rotate(game.time/goal.rotationSeconds*TAU);ctx.drawImage(images[goal.file],goal.x,goal.y,goal.width,goal.height);}ctx.restore();}
 ctx.drawImage(im,Math.round(d.x+spec.x),Math.round(d.y+spec.y),spec.width,spec.height);
 if(special?.overlay)drawSpecial('300',special.overlay.frame);
}
function drawBombs(stage){
 const scene=game.bombScene,spec=manifest.vectorAssets?.bombs;if(!scene||!spec)return;
 const draw=(group,frame,base)=>{const atlas=spec[group],f=atlas?.frames.find(f=>f.frame===frame);if(!f)throw new Error('Missing bomb artwork '+group+':'+frame);if(!f.empty&&f.width&&f.height)ctx.drawImage(images[atlas.file],f.sx,f.sy,f.width,f.height,base.x+f.x,base.y+f.y,f.width,f.height);};
 const grid=(g,x,y)=>scene.gridPixel(g,{x,y}),state=scene.snapshot();
 if(stage==='background'){
  for(const b of scene.runtime.bombs)draw('1400',b.kind,grid(b,6,6));
  if(game.board.bombOilElevatorRules){
   drawElevators('bodies');
   for(const paint of state.backgroundPaints)if(paint.kind==='EL')drawElevators('paint',paint);else draw('1400',14,grid(paint,6,6));
  }else for(const g of state.craters)draw('1400',14,grid(g,6,6));
 }
 if(stage==='upper'){
  for(const s of state.matches)if(s.visible)draw('1600',s.frame,grid(s.grid,31,31));
  for(const s of state.sparks)if(s.visible)draw('1500',s.frame,s.point);
  for(const s of state.goodies)if(s.visible)draw('1900',s.frame,grid(s.grid,4,4));
 }
 if(stage==='explosions')for(const s of state.explosions)if(s.visible)draw('1800',s.frame,grid(s.grid,5,5));
 if(stage==='effects')for(const e of state.effects)if(e.visible)draw(e.kind==='flourish'?'2400':'2500',e.frame,e.point);
}
// Scoped source painter: older scenes retain their existing drawing branch.
function sourceSprite(target,asset,base){
 if(asset.empty||!asset.width||!asset.height)return;
 const image=images[asset.file];if(!image)throw new Error('Required source paint image is unavailable: '+asset.file);
 if(asset.sx!==undefined)target.drawImage(image,asset.sx,asset.sy,asset.width,asset.height,base.x+asset.x,base.y+asset.y,asset.width,asset.height);
 else target.drawImage(image,base.x+asset.x,base.y+asset.y,asset.width,asset.height);
}
function gunTriggerPaint(group,frame){
 const f=manifest.vectorAssets?.gunTriggers?.[group]?.frames?.[frame];
 if(!f||f.sourceGroup!==group||f.sourceFrame!==frame||typeof f.file!=='string'||!f.file||!['x','y','width','height'].every(k=>Number.isInteger(f[k]))||f.width<=0||f.height<=0)throw new Error(`Required GN/TR/PR artwork ${group}:${frame} is unavailable`);
 return f;
}
function drawGunTriggerLayer(background){
 const g=game.gunTriggers;if(!g)return;
 const paint=(group,frame,rawBase)=>sourceSprite(ctx,gunTriggerPaint(group,frame),g.pointFor(rawBase));
 if(background){for(const gun of g.guns)for(const f of gunPaintFrames(gun))paint(3200,f,gun.rawBase);return;}
 for(const t of g.triggers)if(t.visible)paint(3300,t.frame,t.rawBase);
 for(const p of g.insertionOrder)if(p.projectileType===1)drawBuster(g.pointFor({x:p.rawBase.x+44,y:p.rawBase.y+43}),p.frame*TAU/64);else paint(4200,p.frame,p.rawBase);
}
function sourceDotPart(target,d,group,frame){sourceSprite(target,sourceDotPaint(manifest.vectorAssets,String(group),frame),{x:d.x-16,y:d.y-15});}
function validateSourcePaintInventory(board){
 if(board.staticMarkedOrbitalRules){const orb=manifest.vectorAssets?.rotatingSpikes;if(!orb||orb.sourceGroup!==3500||typeof orb.file!=='string'||!orb.file||!['radius','x','y','width','height'].every(k=>Number.isFinite(orb[k]))||orb.radius<=0||orb.width<=0||orb.height<=0)throw new Error('Qualified static marked orbital artwork required');}
 if(board.movingCheckpointControlRules){for(const [key,frames]of [['controls',[1,5,6]],['surfaces',[135,136,137,138,139,140,141,142,143,153,154,155,156,157,158]]])for(const frame of frames)if(!manifest.vectorAssets.elevators?.[key]?.frames.some(f=>f.frame===frame))throw Error('Required lowered channel1 artwork '+key+':'+frame);}
 if(board.movingElevatorRules||board.movingProgrammedBusterRules){for(const [key,frames]of [['controls',[0,3,4,...(board.movingProgrammedBusterRules?[9]:[])]],['surfaces',[126,127,128,129,130,131,132,133,134,153,154,155,156,157,158]]])for(const frame of frames)if(!manifest.vectorAssets.elevators?.[key]?.frames.some(f=>f.frame===frame))throw new Error('Required source TYPE2/EL artwork '+key+':'+frame);}
 if(board.movingGoalGoodieRules||board.staticTeleportBusterRules||board.gunSlidingBusterRules||board.movingProgrammedBusterRules||board.movingBusterBombRules||board.movingBombSpikeWaystationRules||board.slidingBombCheckpointRules||board.staticSlidingBombGoodieRules)for(const frame of [2,3,4])if(!manifest.vectorAssets.walls?.frames.some(f=>f.frame===frame))throw new Error('Required source wall-erasure artwork is unavailable');
 for(const d of board.dots){
  if(d.slowdown)for(const f of[189+d.color,198+d.color])for(const g of[300,4100])sourceDotPaint(manifest.vectorAssets,g,f);
  if(board.staticSlowdownBusterRules&&d.ring)for(let f=23+7*d.color;f<=30+7*d.color;f++)for(const g of[300,4100])sourceDotPaint(manifest.vectorAssets,g,f);
  for(const group of ['300','4100']){sourceDotPaint(manifest.vectorAssets,group,9+d.color);if(d.bonus)sourceDotPaint(manifest.vectorAssets,group,1+d.color);if(d.transferDeath)sourceDotPaint(manifest.vectorAssets,group,108+d.color);if(!board.movingSpikeRules&&!board.movingMarkedGoalRules&&!board.movingElevatorRules&&!board.movingCheckpointRingRules&&!board.movingMarkedBonusRules&&!board.staticMarkedOrbitalRules&&!board.movingMarkedOrdinaryRules&&!d.ring)sourceDotPaint(manifest.vectorAssets,group,92+d.color);}
  if((board.movingGoalGoodieRules||board.staticTeleportBusterRules||board.gunSlidingBusterRules||board.movingProgrammedBusterRules||board.movingCheckpointControlRules||board.movingCheckpointRailRules||board.movingBusterBombRules||board.movingDoorCheckpointRules||board.movingTubesRules||board.movingBombSpikeWaystationRules||board.movingSpikeRules||board.movingMarkedGoalRules||board.movingElevatorRules||board.movingCheckpointRingRules||board.movingMarkedBonusRules||board.staticMarkedOrbitalRules||board.movingMarkedOrdinaryRules||board.staticSlidingBombGoodieRules)&&d.kind==='goal')for(let frame=17;frame<=22;frame++)sourceGoalPaint(manifest.vectorAssets,frame);
  if((board.movingGoalGoodieRules||board.staticTeleportBusterRules||board.gunSlidingBusterRules||board.movingCheckpointRingRules)&&d.ring)for(let frame=23;frame<=30;frame++)for(const group of ['300','4100'])sourceDotPaint(manifest.vectorAssets,group,frame);
  if(d.waystation)for(let frame=79;frame<=89;frame++)for(const group of ['300','4100'])sourceDotPaint(manifest.vectorAssets,group,frame);
  if(d.protected)for(let frame=117;frame<=124;frame++)sourceDotPaint(manifest.vectorAssets,'300',frame);
 }
}
function sourceConnector(target,e,frame,round=game){
 const atlas=manifest.vectorAssets.connectors,f=atlas?.frames.find(f=>f.frame===frame),d=round.board.dots.find(d=>d.id===e.first);
 if(!f||!d)throw new Error('Required source connector paint is unavailable');
 sourceSprite(target,{file:atlas.file,...f},{x:d.x-11,y:d.y-9});
}
function sourceWall(target,w,frame=w.frame){
 const f=manifest.vectorAssets.walls?.frames.find(f=>f.frame===frame);if(!f)throw new Error('Required source wall paint is unavailable');sourceSprite(target,f,w);
}
function sourceBombBackground(target,round,grid,frame){
 const atlas=manifest.vectorAssets.bombs?.['1400'],f=atlas?.frames.find(f=>f.frame===frame);if(!f)throw new Error('Required source bomb background paint is unavailable');
 sourceSprite(target,{file:atlas.file,...f},round.bombScene.gridPixel(grid,{x:6,y:6}));
}
function seedSourceBackground(target,round){
 const b=round.board,original=round.bombScene?.original??round.sourcePaint.original;
 for(const saved of original.dots){const live=b.dots.find(d=>d.id===saved.id);if(!live.sourceInBackground)continue;const d={...live,...saved,burnt:false,collected:false},frame=sourceDotLook(d).frame;sourceDotPart(target,d,300,frame);sourceDotPart(target,d,4100,frame);}
 for(const e of original.connectors??[])if(!e.sourceHasSprite)sourceConnector(target,e,connectorLook(e,b.dots),round);
 for(const w of original.walls??[])if(w.visible!==false)sourceWall(target,w);
 if(b.movingProgrammedBusterRules||b.movingElevatorRules||b.movingCheckpointControlRules)for(const c of round.elevators.snapshot().controls)sourceElevator(target,'controls',c.group,c);
 for(const fuse of round.bombScene?.runtime.bombs??[])sourceBombBackground(target,round,fuse,fuse.kind);
}
function paintSourceBackground(target,paint,round,field){
 if(paint.kind==='DO'){const d=round.board.dots.find(d=>d.id===paint.id);if(!d)throw new Error('Unknown source dot paint');sourceDotPart(target,d,300,paint.frame);sourceDotPart(target,d,4100,paint.frame);}
 else if(paint.kind==='EX'){const e=round.board.connectors.find(e=>e.id===paint.id);if(!e)throw new Error('Unknown source connector paint');sourceConnector(target,e,paint.frame,round);}
 else if(paint.kind==='WL'){if(!round.board.movingSlowdownBusterRules&&!round.board.staticSlowdownBusterRules&&!round.board.staticTeleportBusterRules&&!round.board.gunSlidingBusterRules&&!round.board.movingProgrammedBusterRules&&!round.board.movingBusterBombRules&&!round.board.movingBombSpikeWaystationRules&&!round.board.slidingBombCheckpointRules&&!round.board.staticSlidingBombGoodieRules)throw new Error('Unqualified source wall-erasure paint');sourceWall(target,paint,paint.frame);}
 else if(paint.kind==='EL'&&round.board.movingProgrammedBusterRules)sourceElevator(target,'controls',paint.frame,round.elevators.snapshot().controls[paint.index]);
 else if(paint.kind==='crater')sourceBombBackground(target,round,paint,14);
 else if(paint.kind==='erase-spark-background'){const rect=sourceSparkEraseRect(paint,manifest.vectorAssets.bombs['1500'].frames);target.fillStyle=field.color;target.fillRect(rect.x,rect.y,rect.width,rect.height);}
 else throw new Error('Unknown source background operation '+paint.kind);
}
const sourceBackground=createSourceBackground({createCanvas:()=>document.createElement('canvas'),seed:seedSourceBackground,paint:paintSourceBackground});
function drawSourceGoal(d){
 if(game.board.movingTeleportCheckpointRules||game.board.movingTeleportDoorRules||game.board.movingProtectedPassageRules||game.board.staticRingDoorRules||game.board.staticGunRailRules||game.board.movingGoalRailRules||game.board.movingGoalOrdinaryRules||game.board.movingWaystationRules||game.board.staticSlowdownRules||game.board.movingGoalGoodieRules||game.board.staticTeleportBusterRules||game.board.gunSlidingBusterRules||game.board.movingProgrammedBusterRules||game.board.movingCheckpointControlRules||game.board.movingCheckpointRailRules||game.board.movingBusterBombRules||game.board.movingDoorCheckpointRules||game.board.movingTubesRules||game.board.movingBombSpikeWaystationRules||game.board.movingSpikeRules||game.board.movingMarkedGoalRules||game.board.movingElevatorRules||game.board.movingCheckpointRingRules||game.board.movingMarkedBonusRules||game.board.staticMarkedOrbitalRules||game.board.movingMarkedOrdinaryRules||game.board.staticSlidingBombGoodieRules){const state=game.dotAnimations.renderState(d.id).goal;if(!state||!state.visible)throw new Error('Current source goal misc required');sourceSprite(ctx,sourceGoalPaint(manifest.vectorAssets,state.frame),state.rawBase);return;}
 const goal=manifest.vectorAssets.goal;if(!goal)return;ctx.save();ctx.translate(d.x,d.y);const frame=atlasFrame(goal.animation,game.time);
 if(frame)ctx.drawImage(images[goal.file],frame.x,frame.y,frame.width,frame.height,goal.x,goal.y,goal.width,goal.height);
 else{if(goal.rotationSeconds>0)ctx.rotate(game.time/goal.rotationSeconds*TAU);ctx.drawImage(images[goal.file],goal.x,goal.y,goal.width,goal.height);}ctx.restore();
}
function sourceElevator(target,key,frame,base){
 const atlas=manifest.vectorAssets.elevators?.[key],f=atlas?.frames.find(f=>f.frame===frame);if(!f)throw new Error('Required source elevator frame '+key+':'+frame);sourceSprite(target,{file:atlas.file,...f},base);
}
function drawSourceForeground(){
 const dots=game.board.dots.filter(d=>!d.sourceInBackground),joined=game.board.movingProgrammedBusterRules===true||game.board.movingElevatorRules===true||game.board.movingCheckpointControlRules===true,states=joined?game.elevators.snapshot().dots:[];
 // Layer5 shadows and TYPE3 misc retain their own source parent positions.
 for(const d of dots){const special=game.dotAnimations?.renderState(d.id),look=sourceDotLook(d,special),u=states.find(s=>s.id===d.id);if(look.visible){if(u)sourceSprite(ctx,sourceDotPaint(manifest.vectorAssets,'4100',look.frame),{x:u.shadowPixel.x-16,y:u.shadowPixel.y-15});else sourceDotPart(ctx,d,4100,look.frame);}if(u&&u.misc3.visible)sourceElevator(ctx,'surfaces',u.misc3.frame,u.misc3.rawBase);}
 // Layer4 mains / goalTYPE1 / TYPE4, then retained EX and EL.
 for(const d of dots){const special=game.dotAnimations?.renderState(d.id),look=sourceDotLook(d,special),u=states.find(s=>s.id===d.id);if(look.visible){sourceDotPart(ctx,d,300,look.frame);if(d.kind==='goal')drawSourceGoal(d);}if(special?.overlay)sourceDotPart(ctx,d,300,special.overlay.frame);if(u&&u.misc4.visible)sourceElevator(ctx,'surfaces',u.misc4.frame,u.misc4.rawBase);}
 for(const e of game.board.connectors)if(e.sourceHasSprite)sourceConnector(ctx,e,connectorLook(e,game.board.dots));
 if(joined)for(const c of game.elevators.snapshot().controls)if(c.visible)sourceElevator(ctx,'controls',c.frame,c);
}
function draw(){renderCalls++;const scale=resizeCanvas(canvas,window.devicePixelRatio||1);ctx.setTransform(scale.scaleX,0,0,scale.scaleY,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#909090';ctx.fillRect(0,0,640,480);if(!ready){ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText('Loading private original assets…',20,50);return;}
 ctx.drawImage(images[activeBackdrop||manifest.backdrop],0,0);ctx.imageSmoothingEnabled=!!manifest.vectorAssets;
 const field=activePlayfield||{x:68,y:69,width:504,height:360,color:'#808080'};
 ctx.fillStyle=field.color;ctx.fillRect(field.x,field.y,field.width,field.height);ctx.fillStyle='white';ctx.font='bold 12px sans-serif';ctx.fillText('Level:',106,49);ctx.fillText(`${game.board.ordinal||1}: ${game.board.title||'Movement'}`,92,62);ctx.fillStyle='#ffff00';
 if(game.childScore){ctx.fillText('Round:',431,49);ctx.fillText('Total:',505,49);ctx.textAlign='right';ctx.fillText(game.childScore.roundBonus.toLocaleString(),477,62);ctx.fillText(game.childScore.totalCommitted.toLocaleString(),568,62);ctx.textAlign='left';}
 else{ctx.fillText('Pilot',441,50);ctx.fillText(game.bombScene?'Level Score:':'Total Score:',493,49);ctx.fillText(String(game.bombScene?.score??'—'),536,62);}
 if(game.paused){ctx.fillStyle='#ffff00';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('Paused',320,252);ctx.textAlign='left';return;}
 const sourcePaint=game.board.movingTeleportCheckpointRules||game.board.movingTeleportDoorRules||game.board.movingProtectedPassageRules||game.board.staticRingDoorRules||game.board.staticGunRailRules||game.board.movingGoalRailRules||game.board.movingGoalOrdinaryRules||game.board.movingWaystationRules||game.board.staticSlowdownRules||game.board.movingGoalGoodieRules||game.board.staticTeleportBusterRules||game.board.gunSlidingBusterRules||game.board.movingProgrammedBusterRules||game.board.movingCheckpointControlRules===true||game.board.movingCheckpointRailRules===true||game.board.movingBusterBombRules===true||game.board.movingDoorCheckpointRules===true||game.board.movingTubesRules===true||game.board.movingBombSpikeWaystationRules===true||game.board.movingSpikeRules===true||game.board.slidingBombRules===true||game.board.movingBombRules===true||game.board.movingMarkedGoalRules===true||game.board.movingElevatorRules===true||game.board.movingCheckpointRingRules===true||game.board.movingMarkedBonusRules===true||game.board.staticMarkedOrbitalRules===true||game.board.movingMarkedOrdinaryRules===true||game.board.staticSlidingBombGoodieRules===true;
 if(sourcePaint){ctx.save();clipSourceUniverse(ctx);ctx.drawImage(sourceBackground.draw(game,field,{width:canvas.width,height:canvas.height}),0,0,640,480);if(game.board.staticGunRailRules||game.board.gunSlidingBusterRules)drawGunTriggerLayer(true);if(game.board.movingTeleportCheckpointRules||game.board.movingTeleportDoorRules||game.board.movingProtectedPassageRules||game.board.staticRingDoorRules||game.board.staticGunRailRules||game.board.movingGoalRailRules||game.board.movingGoalOrdinaryRules||game.board.movingWaystationRules||game.board.staticSlowdownRules||game.board.movingGoalGoodieRules||game.board.staticTeleportBusterRules||game.board.gunSlidingBusterRules||game.board.movingProgrammedBusterRules)drawBusterWallEffects();drawSourceForeground();if(game.board.movingTeleportCheckpointRules||game.board.movingTeleportDoorRules||game.board.staticTeleportBusterRules)drawTeleports();drawGunTriggerLayer(false);if(game.board.staticRingDoorRules||game.board.movingTeleportCheckpointRules||game.board.movingTeleportDoorRules||game.board.movingProtectedPassageRules||game.board.movingDoorCheckpointRules)drawDoors();drawSpikes();drawBombs('upper');drawBombs('explosions');}
 else{
 drawBombs('background');drawGunTriggerLayer(true);drawWalls();drawBusterWallEffects();drawConnectors();for(const d of game.board.dots)drawDot(d);drawTeleports();
 drawDoors();
 drawElevators(game.board.bombOilElevatorRules?'glyphs':'all');
 drawGunTriggerLayer(false);
 drawBombs('upper');
 drawOil();
 drawSpikes();
 drawBombs('explosions');
 }

 ctx.fillStyle='white';ctx.font='10px sans-serif';
 const lines=[['You are the spinning gold (or black) hand.',88,150],['Player 1: Use Space to “swing” onto the next dot.',88,162],['The red hand is “swinging”.',109,292],['The green hand is “flipping”.',109,388],['Use X to “flip” onto the next dot.',137,174],['Use C to “instantly reverse”.',137,186],['Use Z to “bounce” off the next dot.',137,198],['The object of the game is to grab onto the “goal” dot.',148,80],['Bonus Dot',487,237],['Goal Dot',534,333],['“Bouncing” blue',410,360]];
 if(!drawLevelText())for(const [t,x,y] of lines)ctx.fillText(t,x,y);
 for(const h of [...game.demos,...(game.enemies||[])])drawHand(h);
 drawActorFaders();
 if(!game.death||game.death.heroVisible)drawHand(game.player);
 drawDeath();
 drawBombs('effects');
 drawSparkles();
 if(sourcePaint)ctx.restore();
 if(game.complete){ctx.fillStyle='rgba(20,20,20,.88)';ctx.fillRect(120,170,400,120);ctx.fillStyle='#ffe66b';ctx.textAlign='center';ctx.font='bold 25px serif';ctx.fillText((game.board.title||'Movement')+' complete',320,214);ctx.font='16px sans-serif';const points=game.childScore?.roundBonus??game.bombScene?.score;if(points!==undefined)ctx.fillText(points.toLocaleString()+' points · Child completion bonus 1,000',320,239);ctx.fillText('Goal dot grabbed · Restart to play again',320,points!==undefined?268:250);ctx.textAlign='left';}
}
function workloadTime(){return game.elapsedTime??game.time;}
function captureInfo(){return {visibility:document.visibilityState,focused:document.hasFocus()};}
function finishCapture(now){const c=capture;if(!c)return;lastCapture={schema:'clockwerx-html5-timing-v1',captureUtc:c.utc,completionUtc:new Date().toISOString(),durationMs:now-c.start,requestedDurationMs:20000,valid:c.invalidReasons.size===0,invalidReasons:[...c.invalidReasons],scene:(game.board.title||'Movement')+(c.fromRestart?'; atomic reset; no-input rotating scene':'; current state at capture start'),fromRestart:c.fromRestart,pageUrl:location.href,workload:c.workload,boundary:'main-thread rAF entry through fixed simulation and Canvas2D draw; SVG mode includes interpolated vector image rotation; not physical presentation or input latency',presentation:manifest.vectorAssets?'svg-continuous':'bitmap-64-directions',devicePixelRatio:window.devicePixelRatio||1,logicalSize:[640,480],backingSize:[canvas.width,canvas.height],cssSize:[canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height],sound:c.sound,handColor:c.handColor,startState:c.state,endState:game.snapshot(),startFocus:c.focus,endFocus:captureInfo(),counters:{rafCallbacks:rafCalls-c.raf,renderCalls:renderCalls-c.render,fixedStepCalls:game.steps-c.steps,activeSimulationSteps:game.activeSteps-c.activeSteps,droppedCatchupSeconds:droppedSeconds-c.dropped},frames:c.frames,startup,pageMemory:memoryResult,userAgent:navigator.userAgent};capture=null;$('capture').disabled=false;$('capture-reset').disabled=false;$('json').disabled=false;$('diagnostics').textContent=`Capture complete: ${lastCapture.valid?'valid':'INVALID — '+lastCapture.invalidReasons.join(', ')}. ${lastCapture.frames.length} raw rAF records. Download JSON.`;}
function beginCapture(fromRestart=false){if(!ready||capture||memoryPending)return;if(fromRestart){restart();accumulator=0;last=performance.now();padHeld={};previousPad=[];}const focus=captureInfo();capture={fromRestart,sound:settings.sound,handColor:settings.black?'black':'gold',start:performance.now(),utc:new Date().toISOString(),focus,state:game.snapshot(),workload:inputReplay?'checked input-only route replay':recordedUntil>workloadTime()?'recorded swing hold until simulation second12':'manual inputs only; idle comparison requires no input',raf:rafCalls,render:renderCalls,steps:game.steps,activeSteps:game.activeSteps,dropped:droppedSeconds,frames:[],invalidReasons:new Set()};if(document.hidden)capture.invalidReasons.add('started hidden');if(!focus.focused)capture.invalidReasons.add('started unfocused');$('capture').disabled=true;$('capture-reset').disabled=true;$('json').disabled=true;$('diagnostics').textContent='Capturing 20 seconds; keep this window visible and focused.';}
$('capture').onclick=()=>beginCapture();$('capture-reset').onclick=()=>beginCapture(true);
$('json').onclick=()=>{if(lastCapture)download(`clockwerx-html5-${lastCapture.captureUtc.replaceAll(':','-')}.json`,new Blob([JSON.stringify({...lastCapture,pageMemory:memoryResult},null,2)],{type:'application/json'}));};
$('png').onclick=()=>{if(capture)capture.invalidReasons.add('PNG export during timing capture');draw();canvas.toBlob(b=>{if(b)download('clockwerx-html5-canvas.png',b)},'image/png');};
$('memory').onclick=async()=>{if(capture){$('diagnostics').textContent='Memory measurement is disabled during capture.';return;}const start=new Date().toISOString();memoryPending=true;$('capture').disabled=true;$('capture-reset').disabled=true;$('memory').disabled=true;$('diagnostics').textContent='Measuring page memory…';try{if(performance.measureUserAgentSpecificMemory){const m=await performance.measureUserAgentSpecificMemory();memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'completed',method:'measureUserAgentSpecificMemory',boundary:'browser-reported page-associated memory; not process RSS or physical RAM',result:m};}else memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'unavailable',boundary:'No supported page memory API; no estimate invented'};}catch(e){memoryResult={startUtc:start,completionUtc:new Date().toISOString(),status:'failed',error:String(e),boundary:'No memory result'}}finally{memoryPending=false;$('capture').disabled=false;$('capture-reset').disabled=false;$('memory').disabled=false;$('diagnostics').textContent=JSON.stringify(memoryResult);}};
$('route').onclick=async()=>{if(!ready||!checkedRoute)return;try{await loadScene(activeScene);inputReplay=createInputReplay(checkedRoute);message('Replaying a checked input route from a new scene.');canvas.focus({preventScroll:true});}catch(e){message('Checked route unavailable: '+e.message,true);}};
$('workload').onclick=()=>{restart();recordedUntil=12;message('Recorded input demo: swing held for 12 simulation seconds; no other actions.');};
function frame(now){const entry=performance.now(),delta=Math.max(0,(now-last)/1000);last=now;rafCalls++;pollGamepad();if(game?.events.some(e=>e.sequence>lastEvent&&playerAttentionAction(e)))stopSparkles();let n=0,activeN=0;if(ready&&!document.hidden){const cap=Math.min(delta,.25);if(capture&&delta>.25)capture.invalidReasons.add('simulation catch-up capped');droppedSeconds+=Math.max(0,delta-cap);accumulator+=cap;while(accumulator>=STEP){let input={...held};for(const k of ['swing','bounce','flip'])input[k]=input[k]||padHeld[k];if(recordedUntil>workloadTime())input.swing=true;if(inputReplay&&!game.paused&&!game.complete)input=inputReplay.next();const activeBefore=game.activeSteps;renderPrevious=handPoses(game);const sequenceBefore=game.eventSequence;if(pilotInputBlocked){if(!Object.values(held).some(Boolean)&&!Object.values(padHeld).some(Boolean)&&!previousPad[3])pilotInputBlocked=false;input={};}game.update(STEP,input);if(game.events.some(e=>e.sequence>sequenceBefore&&e.type==='pilot-round-restart')){inputReplay=null;recordedUntil=0;pilotInputBlocked=true;resetSparkles();renderPrevious=null;message('Round restarted.');}if(game.events.some(e=>e.sequence>sequenceBefore&&e.type==='death')){inputReplay=null;message('Caught. The round will restart after the effect.');}if(game.events.some(e=>e.sequence>sequenceBefore&&e.type==='round-reset')){resetSparkles();renderPrevious=null;message((game.board.title||'Movement')+' restarted after contact.');}if(game.events.some(e=>e.sequence>sequenceBefore&&playerAttentionAction(e)))stopSparkles();if(game.activeSteps>activeBefore&&!game.death)updateSparkles(STEP);activeN+=game.activeSteps-activeBefore;accumulator-=STEP;n++;}for(const e of game.events.filter(e=>e.sequence>lastEvent)){playSound(e.type==='flip'?'ActionFlip':e.type==='bounce'?'ActionBounce':e.type==='swing'?'ActionSwing':'');if(e.type==='goal'){settings.completed++;persist();message('Goal dot grabbed. '+(game.board.title||'Movement')+' complete.');}}lastEvent=game.eventSequence;}const drawStart=performance.now();draw();const end=performance.now();if(capture){if(document.hidden)capture.invalidReasons.add('document hidden');if(!document.hasFocus())capture.invalidReasons.add('window unfocused');capture.frames.push({tMs:now-capture.start,rafTimestampMs:now,rafDeltaMs:delta*1000,fixedStepCalls:n,activeSimulationSteps:activeN,renderCalls:1,updateAndInputMs:drawStart-entry,renderMs:end-drawStart,totalWorkMs:end-entry,visible:!document.hidden,focused:document.hasFocus(),gamePaused:game.paused,gameComplete:game.complete,gameTimeSeconds:game.time,recordedSwingActive:recordedUntil>workloadTime(),presentedStarbursts:sparkleSystems.map(({system})=>system.snapshot()),presentedPlayer:{angle:presentedAngle(game.player,renderPrevious?.player,accumulator/STEP,!!manifest.vectorAssets),pivot:game.player.pivot,direction:game.player.direction},replayedInput:inputReplay?.snapshot()||null,heldActions:{...held,...Object.fromEntries(Object.entries(padHeld).filter(([,v])=>v))}});if(now-capture.start>=20000)finishCapture(now);}requestAnimationFrame(frame);}
async function loadScene(scene){
 if(capture){capture.invalidReasons.add('scene changed');finishCapture(performance.now());}
 ready=false;held={};padHeld={};previousPad=[];inputReplay=null;recordedUntil=0;renderPrevious=null;lastEvent=0;
 const reference=scene.levelDefinition;
 activeBackdrop=scene.backdrop||manifest.backdrop;activePlayfield=scene.playfield||null;
 if(reference){
  const profileResponse=await fetch('./assets/'+reference.outlinesFile);
  if(!profileResponse.ok)throw new Error('Source collision profile is unavailable');
  const outlines=await profileResponse.json();
  let doorOutlines;
  if(reference.doorOutlinesFile){const r=await fetch('./assets/'+reference.doorOutlinesFile);if(!r.ok)throw new Error('Door collision profile is unavailable');doorOutlines=await r.json();}
  const profile=async key=>{if(!reference[key])return undefined;const r=await fetch('./assets/'+reference[key]);if(!r.ok)throw new Error('Required source profile unavailable');return r.json();};
  const oilOutlines=await profile('oilOutlinesFile'),dotOutlines=await profile('dotOutlinesFile'),bombOutlines=await profile('bombOutlinesFile'),elevatorOutlines=await profile('elevatorOutlinesFile'),gunOutlines=await profile('gunOutlinesFile');
  const board=buildDecodedBoard(reference.data,{ordinal:reference.ordinal,title:reference.title,angularSpeed:TAU*960/(76*64),allowOil:reference.oilQualified===true,allowInactiveSpikes:reference.inactiveSpikesQualified===true,allowEnemyBouncePrograms:reference.enemyBounceProgramsQualified===true,allowEnemyStaticPrograms:reference.enemyStaticProgramsQualified===true,allowSpecialDots:reference.specialDotsQualified===true,allowBombs:reference.bombsQualified===true,allowGoodies:reference.goodiesQualified===true,allowProtectedWaypoints:reference.protectedWaypointsQualified===true,allowProtectedBonuses:reference.protectedBonusesQualified===true,allowInactiveProtectedWaypoints:reference.inactiveProtectedWaypointsQualified===true,allowStaticEnemyWalls:reference.staticEnemyWallsQualified===true,allowClass3Enemies:reference.class3EnemiesQualified===true,allowExtendedEnemyClocks:reference.extendedEnemyClocksQualified===true,allowProgrammedEnemyWalls:reference.programmedEnemyWallsQualified===true,allowInitiallyOpenDoors:reference.initiallyOpenDoorsQualified===true,allowRotatingSpikes:reference.rotatingSpikesQualified===true,allowFastRotatingSpikes:reference.fastRotatingSpikesQualified===true,allowSlowRotatingSpikes:reference.slowRotatingSpikesQualified===true,allowClass2RotatingSpikes:reference.class2RotatingSpikesQualified===true,allowClass3RotatingSpikes:reference.class3RotatingSpikesQualified===true,allowRotatingSpikeTransfers:reference.rotatingSpikeTransfersQualified===true,allowRotatingSpikeBounces:reference.rotatingSpikeBouncesQualified===true,allowInactiveElevators:reference.inactiveElevatorsQualified===true,allowInactiveUpDownDots:reference.inactiveUpDownDotsQualified===true,allowInactiveRings:reference.inactiveRingsQualified===true,allowBombObjectInteractions:reference.bombObjectInteractionsQualified===true,allowCanonicalPlayer:reference.canonicalPlayerQualified===true,allowCanonicalOil:reference.canonicalOilQualified===true,allowCanonicalOilSpikes:reference.canonicalOilSpikesQualified===true,allowElevators:reference.elevatorsQualified===true,allowElevatorGoodies:reference.elevatorGoodiesQualified===true,allowColoredElevatorGoodies:reference.coloredElevatorGoodiesQualified===true,allowElevatorOilSpikes:reference.elevatorOilSpikesQualified===true,allowBombOilElevators:reference.bombOilElevatorsQualified===true,allowSlidingConnectors:reference.slidingConnectorsQualified===true,allowStaticSlidingBombGoodies:reference.staticSlidingBombGoodiesQualified===true,allowSlidingBombs:reference.slidingBombsQualified===true,allowSlidingBombOrbitals:reference.slidingBombOrbitalsQualified===true,allowSlidingBombCheckpoints:reference.slidingBombCheckpointsQualified===true,allowSlidingOil:reference.slidingOilQualified===true,allowSlidingOilGoodieRings:reference.slidingOilGoodieRingsQualified===true,allowStaticSlidingPrograms:reference.staticSlidingProgramsQualified===true,allowSlidingGoodies:reference.slidingGoodiesQualified===true,allowSlidingGoodiePrograms:reference.slidingGoodieProgramsQualified===true,allowTeleports:reference.teleportsQualified===true,allowSlidingTeleports:reference.slidingTeleportsQualified===true,allowMovingDots:reference.movingDotsQualified===true,allowMovingDoorCheckpoint:reference.movingDoorCheckpointQualified===true,allowMovingDoorOil:reference.movingDoorOilQualified===true,allowStaticRingRails:reference.staticRingRailsQualified===true,allowStaticGunRails:reference.staticGunRailsQualified===true,allowMovingTeleportCheckpoints:reference.movingTeleportCheckpointsQualified===true,allowStaticRingDoors:reference.staticRingDoorsQualified===true,allowMovingGoalRails:reference.movingGoalRailsQualified===true,allowMovingTeleportDoors:reference.movingTeleportDoorsQualified===true,allowMovingProtectedBusters:reference.movingProtectedBustersQualified===true,allowMovingSlowdownBusters:reference.movingSlowdownBustersQualified===true,allowStaticSlowdownBusters:reference.staticSlowdownBustersQualified===true,allowSlowdownWaystation:reference.slowdownWaystationQualified===true,allowSlowdownClass4:reference.slowdownClass4Qualified===true,allowSlowdownWalls:reference.slowdownWallsQualified===true,allowStaticSlowdown:reference.staticSlowdownQualified===true,allowMovingProtectedPassage:reference.movingProtectedPassageQualified===true,allowMovingGoalOrdinary:reference.movingGoalOrdinaryQualified===true,allowMovingWaystation:reference.movingWaystationQualified===true,allowMovingGoalGoodies:reference.movingGoalGoodiesQualified===true,allowStaticTeleportBusters:reference.staticTeleportBustersQualified===true,allowGunSlidingBusters:reference.gunSlidingBustersQualified===true,allowMovingProgrammedBusters:reference.movingProgrammedBustersQualified===true,allowMovingCheckpointControls:reference.movingCheckpointControlsQualified===true,allowMovingCheckpointRails:reference.movingCheckpointRailsQualified===true,allowOilBusters:reference.oilBustersQualified===true,allowMovingBusterBombs:reference.movingBusterBombsQualified===true,allowGunBusters:reference.gunBustersQualified===true,allowFreeBusters:reference.freeBustersQualified===true,allowMovingDoorGoodies:reference.movingDoorGoodiesQualified===true,allowMovingTubes:reference.movingTubesQualified===true,allowGunsTriggers:reference.gunsTriggersQualified===true,allowGunTriggerSliding:reference.gunTriggerSlidingQualified===true,allowGunTriggerWalls:reference.gunTriggerWallsQualified===true,allowGunTriggerTeleports:reference.gunTriggerTeleportsQualified===true,allowElevatorOilRiders:reference.elevatorOilRidersQualified===true,allowMovingBombSpikeWaystation:reference.movingBombSpikeWaystationQualified===true,allowMovingSpikes:reference.movingSpikesQualified===true,allowStaticMarkedOrbitals:reference.staticMarkedOrbitalsQualified===true,allowMovingMarkedOrdinary:reference.movingMarkedOrdinaryQualified===true,allowMovingCheckpointRings:reference.movingCheckpointRingsQualified===true,allowMovingMarkedBonuses:reference.movingMarkedBonusesQualified===true,allowMovingElevators:reference.movingElevatorsQualified===true,allowPilotAbsentSlideRecovery:reference.pilotAbsentSlideRecoveryQualified===true,allowMarkedTransfers:reference.markedTransfersQualified===true,allowMovingMarkedGoals:reference.movingMarkedGoalsQualified===true,allowMovingBombs:reference.movingBombsQualified===true,allowImportedGoodie169:reference.importedGoodie169Qualified===true,allowCombinedGoalBonus:reference.combinedGoalBonusQualified===true,allowActiveDotMasks:reference.activeDotMasksQualified===true,allowInactivePlainDotMasks:reference.inactivePlainDotMasksQualified===true,allowChildScoring:reference.childScoringQualified===true});
  if(board.gunTriggerProjectileRules)for(const [group,count] of [[3200,8],[3300,6],[4200,3]])for(let frame=0;frame<count;frame++)gunTriggerPaint(group,frame);
  if(board.movingBombSpikeWaystationRules)validateMovingBombSpikeWaystationAssets(board,manifest.vectorAssets);
  if(board.movingSpikeRules)validateMovingSpikeAssets(board,manifest.vectorAssets);
  if(board.movingGoalGoodieRules||board.staticTeleportBusterRules||board.gunSlidingBusterRules||board.movingProgrammedBusterRules||board.movingCheckpointControlRules||board.movingCheckpointRailRules||board.movingBusterBombRules||board.movingDoorCheckpointRules||board.movingTubesRules||board.slidingBombRules||board.movingBombRules||board.movingBombSpikeWaystationRules||board.movingSpikeRules||board.movingMarkedGoalRules||board.movingElevatorRules||board.movingCheckpointRingRules||board.movingMarkedBonusRules||board.staticMarkedOrbitalRules||board.movingMarkedOrdinaryRules||board.staticSlidingBombGoodieRules)validateSourcePaintInventory(board);
  if(board.teleportRules&&(!manifest.vectorAssets?.teleports?.symbols||!manifest.vectorAssets?.teleports?.faders))throw new Error('Qualified HY endpoint and actor-fader artwork required');
  board.player.group=settings.black?4300:700;
   game=new SourceRound(board,{outlines,doorOutlines,elevatorOutlines,oilOutlines,dotOutlines,bombOutlines,gunOutlines,bombRoutes:reference.bombRoutes,oilBounds:reference.oilBounds,deathFactory:(pivot,hand,clock)=>createDeathEffect({pivot,frame:hand.canonicalFrame?hand.frame:sourceFrame(hand.angle),randomUnsigned:()=>Math.floor(Math.random()*65536),clock,advanceClock:false})});
  $('presentation').textContent=board.canonicalPlayerRules?'Private SVG pilot · source map and callback-stepped Child movement with smooth SVG drawing.': 'Private SVG pilot · source map, collision outlines and death lifecycle. Continuous hand timing uses the source Child-speed average at 60 guest ticks/second.';
  const rules=[];
  if(board.gunTriggerProjectileRules)rules.push('Hands entering a pressure trigger fire the matching gun. Avoid its projectiles.');
  if(board.puddles.length)rules.push('Touching sleeping oil wakes it. It pursues you across dots and can split. Avoid letting it grab your pivot.');
  if(board.doors.length)rules.push('Switch entry toggles matching doors; release changes only the switch art.');
  if(board.staticEnemyCallbacks)rules.push('Enemy hands rotate and follow their own timed patterns.');
  else if(board.enemies.some(h=>h.program))rules.push('Programmed hands reverse when facing an available neighboring dot.');
  if(board.rotatingSpikeRules)rules.push('Spiked orbs circle their pivots.');
  if(board.teleportRules)rules.push('Paired dots teleport your hand while keeping its current direction.');
  if(board.elevatorRules)rules.push('Hands touching round controls raise or lower the marked dots. Leave a marked dot while it is still fully raised.');
  if(board.dots.some(d=>d.ring))rules.push('Rings disappear after you leave them and later return.');
  if(board.dots.some(d=>d.waystation))rules.push('Checkpoints store your return position and time.');
  if(board.dots.some(d=>d.protected))rules.push('Protected dots stop ordinary enemy contact; spikes remain lethal.');
  if(board.bombRules)rules.push('Swing across a match to light its fuse. Avoid the travelling spark and blast. Hourglasses award 1000 points and ten seconds.');
  if(board.goodieOnlyRules)rules.push('Hourglasses award 1000 points and ten seconds. A checkpoint stores your time when you reach it.');
  $('scope-description').textContent=board.title+'. '+rules.join(' ')+' A death freezes play, runs staggered explosions, then resets the round. '+(board.childScoreRules?'Child bonus progression and round commits are tracked. Campaign totals, full pickup effects, full audio, saves and physical controller hardware remain unqualified.':'Original scoring, full audio, campaign saves and physical controller hardware are unqualified or omitted.');
  $('fidelity-description').textContent=board.canonicalPlayerRules?'Source map, collision outlines and callback-stepped Child movement; reconstructed smooth artwork and fonts. Original hardware input latency, audio and full campaign behavior remain under review.':'Source map, phases, placements and collision profiles; reconstructed smooth artwork and fonts. Hand motion uses the source Child-speed average with 60 guest ticks per second. Exact input cadence, random stream, reveal pacing and original hardware timing remain under review.';
 }else{
  game=new MovementGame(buildBoard(manifest));
  $('presentation').textContent=manifest.vectorAssets?'Private HTML5 pilot · SVG hands and map dots over the original bitmap background. Reconstructed rules and timing.':'Private HTML5 pilot using the original bitmap foreground and background. Reconstructed rules and timing.';
  $('scope-description').textContent=movementScope;$('fidelity-description').textContent=movementFidelity;
 }
 checkedRoute=scene.checkedRoute||null;$('route').hidden=!checkedRoute;
 const title=game.board.title||'Movement';document.title=`ClockWerx ${title} — HTML5 pilot`;
 document.querySelector('h1').textContent=`ClockWerx · ${title}`;canvas.setAttribute('aria-label',title+' game');
 activeScene=scene;pilotInputBlocked=false;$('pause').textContent='Pause (P)';resetSparkles();last=performance.now();accumulator=0;ready=true;
 message(`${title} ready · ${manifest.vectorAssets?'SVG foreground, continuous rotation':'original bitmap foreground'}. Space swing · Z bounce · X flip · C reverse.`);
}
async function load(){
 try{
  const r=await fetch('./assets/manifest.json');if(!r.ok)throw new Error(`manifest HTTP ${r.status}`);
  manifest=await r.json();const vector=manifest.vectorAssets;
  if(!vector)$('presentation').textContent='Private HTML5 pilot using the original bitmap foreground and background. One tutorial board; reconstructed rules and timing.';
  const foreground=vector?[
   ...Object.values(vector.hands).map(h=>h.file),...(vector.rotatingSpikes?[vector.rotatingSpikes.file]:[]),...vector.dots,
   ...Object.values(vector.dotVariants||{}).map(d=>d.file),
   ...(vector.goal?[vector.goal.file]:[]),...(vector.starbursts?[vector.starbursts.file]:[]),
   ...(vector.spikes?.frames||[]).map(f=>f.file),
   ...(vector.walls?.frames||[]).map(f=>f.file),
   ...(vector.connectors?[vector.connectors.file]:[]),
   ...(vector.sourceDotShadows?[vector.sourceDotShadows.file]:[]),
   ...Object.values(vector.sourceMarkedDots||{}).map(atlas=>atlas.file),
   ...(vector.sourceGoalMisc?[vector.sourceGoalMisc.file]:[]),
   ...['leaves','caps','switches'].flatMap(key=>vector.doors?.[key]?[vector.doors[key].file]:[]),
   ...['controls','surfaces'].flatMap(key=>vector.elevators?.[key]?[vector.elevators[key].file]:[]),
   ...['symbols','faders'].flatMap(key=>vector.teleports?.[key]?[vector.teleports[key].file]:[]),
   ...['puddles','droplets'].flatMap(key=>vector.oil?.[key]?[vector.oil[key].file]:[]),
   ...Object.values(vector.specialDots||{}).map(atlas=>atlas.file),
   ...(vector.slowDots?[vector.slowDots.file]:[]),
   ...(vector.slowWallDots?[vector.slowWallDots.file]:[]),
   ...(vector.slowClass4Dots?[vector.slowClass4Dots.file]:[]),
   ...(vector.busters?[vector.busters.file]:[]),...(vector.wallBursts?[vector.wallBursts.file]:[]),
   ...Object.values(vector.gunTriggers||{}).flatMap(g=>g.frames.map(f=>f.file)),
   ...Object.values(vector.bombs||{}).map(atlas=>atlas.file),...Object.values(vector.bombDots||{}).map(atlas=>atlas.file),
   ...(vector.death?.file?[vector.death.file]:(vector.death?.frames||[]).map(f=>f.file))
  ]:Object.entries(manifest.groups).flatMap(([gid,g])=>gid==='401'?[]:gid==='300'?g.images.slice(0,16):g.images);
  const names=[...new Set([...foreground,manifest.backdrop,...(manifest.scenes||[]).map(s=>s.backdrop).filter(Boolean)])];
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
