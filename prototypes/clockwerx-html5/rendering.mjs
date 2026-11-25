import {angleDelta,TAU} from './engine.mjs';
import {sourceDotPaint,sourceGoalPaint} from './sliding-bomb-paint.mjs';
import {connectorLook} from './sliding.mjs';
import {resolveBombRoutes} from './bombs.mjs';

export async function resolveSceneProfiles(manifest,reference,board,loadProfile){
 const definitions=(manifest.scenes??[]).flatMap(scene=>scene.levelDefinition?[scene.levelDefinition]:[]);
 const required={
  outlines:true,doorOutlines:board.doors?.length||board.switches?.length,
  elevatorOutlines:board.elevatorRules,oilOutlines:board.puddles?.length,
  dotOutlines:board.puddles?.length||board.movingDotRules||board.bombRules,
  bombOutlines:board.bombRules||board.goodieOnlyRules,gunOutlines:board.gunTriggerProjectileRules,
 };
 const profiles=await Promise.all(Object.entries(required).map(async ([key,needed])=>{
  const fileKey=key+'File',local=reference[fileKey];
  if(!local&&!needed)return [key,undefined];
  const candidates=new Set([local,manifest.levelDefinition?.[fileKey],...definitions.map(d=>d[fileKey])]);
  let result;
  for(const file of candidates){
   if(!file)continue;
   const profile=await loadProfile(file);
   if(!profile?.groups)continue;
   if(!board.multiDifficulty)return [key,profile];
   result??={...profile,groups:{}};
   for(const [group,body] of Object.entries(profile.groups)){
    const existing=result.groups[group],frames=[...(existing?.frames??[])];
    body.frames.forEach((frame,index)=>{frames[index]??=frame;});
    result.groups[group]={...(existing??body),frames};
   }
  }
  return [key,result];
 }));
 const bombRoutes=board.multiDifficulty&&board.bombs.length
  ? resolveBombRoutes(board.bombs,reference.bombRoutes,...definitions.map(d=>d.bombRoutes))
  : reference.bombRoutes;
 return {...Object.fromEntries(profiles),bombRoutes,
  oilBounds:reference.oilBounds??manifest.oilBaseline?.bounds??{left:0,top:0,right:584,bottom:424}};
}

// The retained SVG bundle omits some color variants used only above Child.
// Use the same shape and animation in an available authored color.
export function difficultyDotPaint(vector,group,frame,dot){
 try{return sourceDotPaint(vector,group,frame);}
 catch(error){
  if(!error.message.startsWith('Missing required source dot paint'))throw error;
  const ringStart=23+7*dot.color;
  const fallback=dot.ring&&frame>=ringStart&&frame<=ringStart+7?23+(frame-ringStart)
   :dot.slowdown&&frame===189+dot.color?189
   :dot.slowdown&&frame===198+dot.color?198
   :dot.transferDeath&&frame===108+dot.color?108:undefined;
  if(fallback===undefined)throw error;
  return sourceDotPaint(vector,group,fallback);
 }
}

const frameRange=(first,count)=>Array.from({length:count},(_,index)=>first+index);

export function validateRoundPaintInventory(board,manifest){
 const vector=manifest.vectorAssets;
 const files=new Set((manifest.files??[]).map(entry=>entry.name));
 const asset=(file,label)=>{
  if(!file||(files.size&&!files.has(file)))throw new Error('Missing sprite artwork '+label);
 };
 const atlas=(spec,frames,label)=>{
  asset(spec?.file,label);
  for(const frame of frames)if(!spec.frames?.some(f=>f.frame===frame))throw new Error('Missing sprite frame '+label+':'+frame);
 };
 for(const group of new Set([700,4300,...[...(board.demos??[]),...(board.enemies??[])].map(hand=>hand.group)])){
  if(group===3500||group===3900)asset(vector?.[group===3500?'rotatingSpikes':'busters']?.file,group);
  else if(vector)asset(vector.hands?.[group]?.file,group);
  else for(const file of manifest.groups?.[group]?.images??[])asset(file,group);
 }
 if(!vector)return;
 if(board.dots.some(d=>d.kind==='goal')&&vector.goal)asset(vector.goal.file,'goal');
 if(vector.death?.file)asset(vector.death.file,'death');
 else for(const frame of vector.death?.frames??[])asset(frame.file,'death');
 for(const dot of board.dots){
  if(board.multiDifficulty){
   const frames=[9+dot.color];
   if(dot.bonus)frames.push(1+dot.color);
   if(dot.transferDeath)frames.push(108+dot.color);
   if(dot.waystation)frames.push(...frameRange(79,11));
   if(dot.ring)frames.push(...frameRange(23+7*dot.color,8));
   if(dot.slowdown)frames.push(189+dot.color,198+dot.color);
   if(board.bombRules)frames.push(92+dot.color);
   for(const frame of frames)for(const group of [300,4100])asset(difficultyDotPaint(vector,group,frame,dot).file,`${group}:${frame}`);
   if(dot.protected)for(const frame of frameRange(117,8))asset(sourceDotPaint(vector,300,frame).file,'protection');
  }
  if(dot.upDown)atlas(vector.elevators?.surfaces,[...frameRange(126+9*dot.upDown.group,9),...frameRange(153,6)],'elevator surface');
 }
 if(board.spikes?.length)for(const frame of frameRange(0,4))asset(vector.spikes?.frames?.[frame]?.file,'spike');
 if(board.walls?.length)for(const wall of board.walls)asset(vector.walls?.frames?.find(f=>f.frame===wall.frame)?.file,'wall');
 if(board.doors?.length){atlas(vector.doors?.leaves,frameRange(0,48),'door');atlas(vector.doors?.caps,frameRange(0,12),'cap');}
 if(board.switches?.length)atlas(vector.doors?.switches,frameRange(0,6),'switch');
 if(board.elevators?.length)atlas(vector.elevators?.controls,frameRange(0,10),'elevator control');
 if(board.teleports?.length){
  atlas(vector.teleports?.symbols,board.teleports.flatMap(e=>[e.firstFrame,e.lastFrame]),'teleport');
  atlas(vector.teleports?.faders,frameRange(0,60),'teleport fader');
 }
 for(const e of board.connectors??[])atlas(vector.connectors,[connectorLook(e,board.dots)],'connector');
 if(board.puddles?.length){
  atlas(vector.oil?.puddles,frameRange(0,52),'puddle');
  atlas(vector.oil?.droplets,frameRange(0,107),'droplet');
 }
 if(board.bombs?.length)for(const [group,count] of [[1400,15],[1500,12],[1600,18],[1800,10]])atlas(vector.bombs?.[group],frameRange(0,count),group);
 if(board.goodies?.length)for(const [group,count] of [[1900,16],[2400,11],[2500,4]])atlas(vector.bombs?.[group],frameRange(0,count),group);
 if(board.gunTriggerProjectileRules)for(const [group,count] of [[3200,8],[3300,6],[4200,3]]){
  for(const index of frameRange(0,count))asset(vector.gunTriggers?.[group]?.frames?.[index]?.file,group+':'+index);
 }
}
export function atlasFrame(animation,seconds){
 if(!animation||animation.type!=='atlas')return null;
 const {frameWidth,frameHeight,frameCount,frameSeconds}=animation;
 if(![frameWidth,frameHeight,frameSeconds].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(frameCount)||frameCount<1)throw new Error('Invalid animation atlas');
 const order=animation.frameOrder||Array.from({length:frameCount},(_,i)=>i);
 if(!order.length||!order.every(i=>Number.isInteger(i)&&i>=0&&i<frameCount))throw new Error('Invalid animation frame order');
 const phase=Math.floor(Math.max(0,seconds)/frameSeconds)%order.length;
 return {x:order[phase]*frameWidth,y:0,width:frameWidth,height:frameHeight};
}
export function presentedAngle(hand,previous,alpha,vector){
 if(vector)return renderAngle(hand,previous,alpha);
 const normalized=((hand.angle%TAU)+TAU)%TAU;
 return (Math.round(normalized/TAU*64)%64)*TAU/64;
}
// Presentation selection only. The stored actor type and canonical source
// fader phase remain unchanged when the pilot selects black player artwork.
export function presentedFaderFrame(fader,black=false){
 return black&&fader.actor==='player'&&fader.frame>=0&&fader.frame<12?fader.frame+48:fader.frame;
}

// Presentation only: never blend between different pivots or across reversals.
// The 120Hz simulation and its collision/transfer decisions stay authoritative.
export function handPoses(game){
  return Object.fromEntries([...game.demos,...(game.enemies||[]),game.player,...(game.player2?[game.player2]:[])].map(h=>[h.name,{angle:h.angle,pivot:h.pivot,direction:h.direction}]));
}
export function renderAngle(hand,previous,alpha){
  if(!previous||previous.pivot!==hand.pivot||previous.direction!==hand.direction)return hand.angle;
  return previous.angle+angleDelta(hand.angle,previous.angle)*Math.max(0,Math.min(1,alpha));
}
export function resizeCanvas(canvas,ratio=1){
  const rect=canvas.getBoundingClientRect();
  // Match device pixels exactly (also below 1x) so the browser never resamples the finished frame.
  const scale=Math.max(0.5,Math.min(4,ratio*rect.width/640));
  const width=Math.round(640*scale),height=Math.round(480*scale);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  return {scaleX:canvas.width/640,scaleY:canvas.height/480};
}

export function validateSourcePaintInventory(board,manifest){
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
