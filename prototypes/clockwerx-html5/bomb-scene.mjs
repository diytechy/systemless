// Gated Child BO/GO scene adapter. Original paths and outlines are injected.
import {BombRuntime,BOMB_CLOCKS,BOMB_SPRITES,bombStationaryDots,bombMovingDots,bombActors} from './bomb-runtime.mjs';
import {createSourceTimerChain,outlineCollision} from './hazards.mjs';
import {bombHitsStationarySpike,bombHitsSwitch} from './bombs.mjs';
import {dotBodyFrame} from './dots.mjs';
import {bombStationaryWalls} from './walls.mjs';
import {unbonusSlidingComponent} from './sliding-bombs.mjs';

export class BombScene {
 constructor(round,{outlines,routes,worldOutline}){
  if(!outlines?.groups||typeof worldOutline!=='function')throw new Error('Bomb source profiles required');
  this.round=round;this.outlines=outlines;this.worldOutline=worldOutline;
  const b=round.board;
  if(b.goodieOnlyRules&&(b.bombs.length||routes?.length))throw new Error('Goodie-only scene cannot include fuses or routes');
  if(!b.goodieOnlyRules){
   if(b.bombObjectInteractionRules||(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)){
    for(const s of b.spikes)bombHitsStationarySpike(s,s);
    for(const s of b.switches)bombHitsSwitch(s,s);
   }else if(!(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)&&b.spikes.some(s=>s.subrow!==2||s.subcolumn!==0))throw new Error('Unqualified bomb/spike topology');
  }
  this.original={walls:structuredClone(b.walls),spikes:structuredClone(b.spikes),switches:structuredClone(b.switches),dots:b.dots.map(d=>({id:d.id,bonus:d.bonus,kind:d.kind,...((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)?{cell:d.cell}: {})})),...((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)?{connectors:structuredClone(b.connectors)}:{})};
  this.clocks=Object.fromEntries(Object.entries(BOMB_CLOCKS).map(([k,v])=>[k,createSourceTimerChain(v.scaled?Math.floor(v.period*100/60):v.period,1)]));
  if((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)){this.clocks.match=createSourceTimerChain(50,2);this.clocks.explosion=createSourceTimerChain(50,3);}
  if(b.movingGoalGoodieRules||b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingGoodieRules||b.slidingOilGoodieRingRules||b.staticSlidingBombGoodieRules||b.movingBombRules)this.clocks.goodie=createSourceTimerChain(40,5);
  this.flourishClock=createSourceTimerChain(40,1);this.scoreClock=createSourceTimerChain(80,1);this.effects=[];this.craters=[];this.backgroundPaints=[];this.score=0;this.layer3=[];this.layer2=[];
  this.runtime=new BombRuntime({bombs:b.bombs,goodies:b.goodies,routes,scopeMode:b.goodieOnlyRules?'goodies':'bombs',scope:{allowMovingSlowdownBusters:b.movingSlowdownBusterRules===true,allowStaticSlowdownBusters:b.staticSlowdownBusterRules===true,allowStaticTeleportBusters:b.staticTeleportBusterRules===true,allowMovingProgrammedBusters:b.movingProgrammedBusterRules===true,allowMovingBusterBombs:b.movingBusterBombRules===true,allowGunBusters:b.gunBusterRules===true,allowFreeBusters:b.freeBusterRules===true,freeBusterScope:b,allowMovingGoalGoodies:b.movingGoalGoodieRules===true,movingGoalGoodieScope:b,allowMovingDoorGoodies:b.movingDoorGoodieRules===true,movingDoorGoodieScope:b,allowMovingBombSpikeWaystation:b.movingBombSpikeWaystationRules===true,movingBombSpikeWaystationScope:b,origin:b.origin,allowMovingBombs:b.movingBombRules===true,sourceProvenance:b.sourceProvenance,allowImportedGoodie169:b.importedGoodie169Rules===true,walls:b.walls,allowStaticSlidingBombGoodies:b.staticSlidingBombGoodieRules===true,staticSlidingBombGoodieScope:b,allowSlidingBombOrbitals:b.slidingBombOrbitalRules===true,allowSlidingBombs:b.slidingBombRules===true,allowSlidingBombCheckpoints:b.slidingBombCheckpointRules===true,allowSlidingOilGoodieRings:b.slidingOilGoodieRingRules===true,puddles:b.puddles,spikes:b.spikes,goodies:b.goodies,allowSlidingGoodiePrograms:b.slidingGoodieProgramRules===true,allowSlidingGoodies:b.slidingGoodieRules===true,connectors:b.connectors, dots:b.dots,actors:[round.player,...round.enemies],allowObjectInteractions:b.bombObjectInteractionRules===true,allowMovingOilElevators:b.bombOilElevatorRules===true,allowElevatorGoodies:b.elevatorGoodieRules===true,allowColoredElevatorGoodies:b.coloredElevatorGoodieRules===true,activeSections:{GO:b.goodies.length,EX:b.connectors?.length??0,SP:b.spikes.length,WL:b.walls.length,DR:b.doors.length,DS:b.switches.length,PU:b.puddles.length,EL:b.elevators?.length??0}}},{
   clock:k=>this.clocks[k].advance(0).clientCount,latchedTick:()=>round.guestTicks,freshTick:()=>round.guestTicks,adjustPeriod:n=>Math.floor(n*100/60),
   gridPixel:(g,o)=>this.gridPixel(g,o),effect:e=>this.effect(e),collides:(kind,s,a)=>outlineCollision(this.shape(kind,s),round.collider(a))});
  this.layer3.push(...this.runtime.matches.map((_,index)=>({kind:'LI',index})));
 }
 unbonus(dot,burnt){
  const r=this.round;
  return unbonusSlidingComponent(r.board.connectors,r.board.dots,dot.id,{burnt,
   onDot:(d,change)=>{if(change.changed)r.dotAnimations?.bombLookChanged(d.id);if(change.paintBackground)this.backgroundPaints.push({kind:'DO',id:d.id,frame:dotBodyFrame(d),...change});},
   onConnector:(e,change)=>{if(change.paintBackground)this.backgroundPaints.push({kind:'EX',id:e.id,...change});}});
 }
 gridPixel(g,o){const p=this.round.board.origin;return {x:p.x+48*g.column-12+o.x,y:p.y+48*g.row-11+o.y};}
 shape(kind,s,frame=s.frame){const spec=BOMB_SPRITES[{LI:'match',SR:'spark',GO:'goodie',BO:'explosion'}[kind]];return this.worldOutline(this.outlines,spec.group,frame,kind==='SR'?s.point:this.gridPixel(s.grid,spec.gridOffset));}
 advanceClocks(ticks){for(const c of Object.values(this.clocks))c.advance(ticks);this.flourishClock.advance(ticks);this.scoreClock.advance(ticks);}
 traverse(list,visit){let index=0;while(index<list.length){const item=list[index],next=index+1<list.length?index+1:null;visit(item);if(next===null)break;index=next;}}
 processUpper(){
  this.runtime.freeze(!!this.round.death);
  this.traverse(this.layer3,s=>{if(this.round.death)return;this.runtime[s.kind==='LI'?'observeMatch':'observeSpark'](s.index);});
  for(const s of this.runtime.goodies){if(this.round.death)break;this.runtime.observeGoodie(s.index);}
 }
 processExplosions(){this.runtime.freeze(!!this.round.death);this.traverse(this.layer2,s=>{if(!this.round.death)this.runtime.observeExplosion(s.index);});}
 processEffects(){
  if(this.round.death)return;
  for(const e of this.effects){if(!e.visible)continue;const count=(e.kind==='flourish'?this.flourishClock:this.scoreClock).advance(0).clientCount;if(e.count===count)continue;e.count=count;e.callbacks++;
   if(e.kind==='flourish'){e.frame++;if(e.frame===5)e.finish();if(e.frame>10)e.visible=false;}
   else{e.frame=(e.frame+1)%4;if(e.callbacks>=24)e.visible=false;else e.point.x++;}
  }
 }
 effect(e){
  const r=this.round,b=r.board;
  if(e.type==='append-sprite'){(e.layer===3?this.layer3:this.layer2).push({kind:e.layer===3?'SR':'BO',index:e.index});return;}
  if(e.type==='stationary'){
   const g=e.grid;
   if(b.gunBusterRules&&['GN','TR'].includes(e.target))r.emitGunTriggerEvents(r.gunTriggers.bomb(e.target,g),r.player);
   if(e.target==='SP')for(const s of b.spikes)if(b.bombObjectInteractionRules||(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)?bombHitsStationarySpike(s,g):s.row===g.row&&(s.column===g.column||s.column===g.column+1))s.visible=false;
   if(e.target==='DS'&&b.bombObjectInteractionRules)for(const s of b.switches)if(bombHitsSwitch(s,g))s.visible=false;
   if(e.target==='WL'){
    if((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)&&(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombCheckpointRules||b.staticSlidingBombGoodieRules)&&b.bombObjectInteractionRules)bombStationaryWalls(b.walls,g,paint=>this.backgroundPaints.push(paint),{allowShatteredCrossFrames:b.staticTeleportBusterRules===true});
    else for(const w of b.walls)if((w.frame>=4&&w.row===g.row&&w.column===g.column)||(w.frame===0&&w.column===g.column&&[g.row,g.row+1].includes(w.row))||(w.frame===1&&w.row===g.row&&[g.column,g.column+1].includes(w.column)))w.visible=false;
    b.wallRevision=(b.wallRevision??0)+1;
   }
   if(e.target==='EL'&&(b.movingProgrammedBusterRules||b.bombOilElevatorRules))for(const change of r.elevators.bomb(g))this.backgroundPaints.push({kind:'EL',index:change.index,frame:change.backgroundFrame});
   if(e.target==='DO'&&(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules)){for(const[dr,dc]of[[0,0],[1,0],[0,1],[1,1]]){const d=b.dots.find(d=>d.row===g.row+dr&&d.column===g.column+dc);if(d&&!((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombRules||b.movingBombSpikeWaystationRules)&&(d.motion==='moving-program'||b.movingProgrammedBusterRules&&d.motion==='up-down')))this.unbonus(d,true);}}
   if(e.target==='DO'&&!(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules))bombStationaryDots(b.dots,g,(d,change)=>{if(!d.bonus&&d.kind==='bonus')d.kind='dot';if(b.bombObjectInteractionRules&&change.changed)r.dotAnimations?.bombLookChanged(d.id);},{allowObjectInteractions:b.bombObjectInteractionRules===true});
  }
  if(e.type==='moving'&&(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombRules||b.movingBombSpikeWaystationRules)&&e.target==='DO'){const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);for(const d of b.dots)if((d.motion==='moving-program'||b.movingProgrammedBusterRules&&d.motion==='up-down')&&d.sourceCollidable&&outlineCollision(blast,this.worldOutline(r.dotOutlines,300,dotBodyFrame(d),{x:d.x-16,y:d.y-15})))this.unbonus(d,true);}
  if(e.type==='moving'&&b.bombOilElevatorRules&&['DO','DP'].includes(e.target)){
   const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);
   if(e.target==='DP')for(const index of r.oil.bomb(blast))r.event('bomb-droplet-hidden',r.player,{id:index});
   else bombMovingDots(b.dots,d=>outlineCollision(blast,this.worldOutline(r.elevatorOutlines,300,dotBodyFrame(d),{x:d.x-16,y:d.y-15})),(d,change)=>{if(!d.bonus&&d.kind==='bonus')d.kind='dot';if(change.changed)r.dotAnimations?.bombLookChanged(d.id);});
  }
  if(e.type==='moving'&&e.target==='WA'){
   const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);
   bombActors([r.player,...r.enemies],{guestTick:r.guestTicks,allowMovingSlowdownBusters:b.movingSlowdownBusterRules===true,allowStaticSlowdownBusters:b.staticSlowdownBusterRules===true,allowStaticTeleportBusters:b.staticTeleportBusterRules===true,allowMovingProgrammedBusters:b.movingProgrammedBusterRules===true,allowMovingBusterBombs:b.movingBusterBombRules===true,allowGunBusters:b.gunBusterRules===true,allowFreeBusters:b.freeBusterRules===true,allowMovingBombSpikeWaystation:b.movingBombSpikeWaystationRules===true,allowMovingBombs:b.movingBombRules===true,allowStaticSlidingBombGoodies:b.staticSlidingBombGoodieRules===true,staticSlidingBombGoodieScope:b,allowSlidingBombOrbitals:b.slidingBombOrbitalRules===true,allowSlidingBombs:b.slidingBombRules===true,allowObjectInteractions:b.bombObjectInteractionRules===true,collides:a=>outlineCollision(blast,r.collider(a)),onDeath:()=>r.beginDeath({reason:'bomb',sourceReason:-1}),onHidden:a=>r.event('bomb-hidden',a)});
  }
  if(e.type==='paint-crater'){this.craters.push({...e.grid});if(b.bombOilElevatorRules||(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules))this.backgroundPaints.push({kind:'crater',...e.grid});}
  if(e.type==='erase-spark-background'&&(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules))this.backgroundPaints.push({kind:'erase-spark-background',...structuredClone(e)});
  if(e.type==='sound'&&(b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules))r.event('bomb-sound',r.player).soundId=e.id;
  if(e.type==='death')r.beginDeath({reason:'spark',sourceReason:e.reason});
  if(e.type==='flourish'||e.type==='floating-score')this.effects.push({kind:e.type,point:this.gridPixel(e.grid,e.gridOffset),frame:0,visible:true,callbacks:0,count:(e.type==='flourish'?this.flourishClock:this.scoreClock).advance(0).clientCount,finish:e.finish});
  if(e.type==='add-time')r.remainingTime+=e.seconds;
  if(e.type==='add-bonus'){this.score+=e.points;r.childScore?.addFlatBonus(e.points);r.event('goodie',r.player);}
  if(['spark-activated','paint-crater'].includes(e.type))r.event(e.type,r.player);
 }
 finish(){if(!this.completed){this.completed=true;this.score+=1000;this.round.event('completion-bonus',this.round.player);}}
 reset({restartLevel=false}={}){
  const r=this.round,b=r.board;b.walls=structuredClone(this.original.walls);if(b.movingBombSpikeWaystationRules){for(const spike of b.spikes)spike.visible=true;}else b.spikes=structuredClone(this.original.spikes);b.wallRevision=(b.wallRevision??0)+1;
  for(const saved of this.original.dots){const d=b.dots.find(d=>d.id===saved.id);if(b.bombObjectInteractionRules&&d.burnt)r.dotAnimations?.bombLookChanged(d.id);Object.assign(d,saved);delete d.burnt;}
  for(let i=0;i<b.switches.length;i++){delete b.switches[i].visible;Object.assign(b.switches[i],this.original.switches[i]);}
  if((b.movingSlowdownBusterRules||b.staticSlowdownBusterRules||b.staticTeleportBusterRules||b.movingProgrammedBusterRules||b.movingBusterBombRules||b.movingBombSpikeWaystationRules||b.slidingBombRules||b.staticSlidingBombGoodieRules||b.movingBombRules))for(let i=0;i<b.connectors.length;i++){for(const key of Object.keys(b.connectors[i]))delete b.connectors[i][key];Object.assign(b.connectors[i],structuredClone(this.original.connectors[i]));}
  this.craters=[];this.backgroundPaints=[];this.effects=[];this.runtime.reset();this.completed=false;if(restartLevel)this.score=0;
 }
 snapshot(){return {...this.runtime.snapshot(),...(this.round.board.movingSlowdownBusterRules||this.round.board.staticTeleportBusterRules||this.round.board.movingBusterBombRules||this.round.board.movingBombSpikeWaystationRules||this.round.board.bombOilElevatorRules||this.round.board.slidingBombRules||this.round.board.staticSlidingBombGoodieRules||this.round.board.movingBombRules?{backgroundPaints:structuredClone(this.backgroundPaints)}:{}),craters:structuredClone(this.craters),effects:this.effects.map(({finish,...e})=>({...e,point:{...e.point}})),score:this.score,completed:!!this.completed};}
}
