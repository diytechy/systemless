// Gated Child BO/GO scene adapter. Original paths and outlines are injected.
import {BombRuntime,BOMB_CLOCKS,BOMB_SPRITES,bombStationaryDots,bombMovingDots,bombActors} from './bomb-runtime.mjs';
import {createSourceTimerChain,outlineCollision} from './hazards.mjs';
import {bombHitsStationarySpike,bombHitsSwitch} from './bombs.mjs';
import {dotBodyFrame} from './dots.mjs';

export class BombScene {
 constructor(round,{outlines,routes,worldOutline}){
  if(!outlines?.groups||typeof worldOutline!=='function')throw new Error('Bomb source profiles required');
  this.round=round;this.outlines=outlines;this.worldOutline=worldOutline;
  const b=round.board;
  if(b.goodieOnlyRules&&(b.bombs.length||routes?.length))throw new Error('Goodie-only scene cannot include fuses or routes');
  if(!b.goodieOnlyRules){
   if(b.bombObjectInteractionRules){
    for(const s of b.spikes)bombHitsStationarySpike(s,s);
    for(const s of b.switches)bombHitsSwitch(s,s);
   }else if(b.spikes.some(s=>s.subrow!==2||s.subcolumn!==0))throw new Error('Unqualified bomb/spike topology');
  }
  this.original={walls:structuredClone(b.walls),spikes:structuredClone(b.spikes),switches:structuredClone(b.switches),dots:b.dots.map(d=>({id:d.id,bonus:d.bonus,kind:d.kind}))};
  this.clocks=Object.fromEntries(Object.entries(BOMB_CLOCKS).map(([k,v])=>[k,createSourceTimerChain(v.scaled?Math.floor(v.period*100/60):v.period,1)]));
  if(b.slidingGoodieRules)this.clocks.goodie=createSourceTimerChain(40,5);
  this.flourishClock=createSourceTimerChain(40,1);this.scoreClock=createSourceTimerChain(80,1);this.effects=[];this.craters=[];this.backgroundPaints=[];this.score=0;this.layer3=[];this.layer2=[];
  this.runtime=new BombRuntime({bombs:b.bombs,goodies:b.goodies,routes,scopeMode:b.goodieOnlyRules?'goodies':'bombs',scope:{allowSlidingGoodies:b.slidingGoodieRules===true,connectors:b.connectors, dots:b.dots,actors:[round.player,...round.enemies],allowObjectInteractions:b.bombObjectInteractionRules===true,allowMovingOilElevators:b.bombOilElevatorRules===true,allowElevatorGoodies:b.elevatorGoodieRules===true,allowColoredElevatorGoodies:b.coloredElevatorGoodieRules===true,activeSections:{GO:b.goodies.length,EX:b.connectors?.length??0,SP:b.spikes.length,WL:b.walls.length,DR:b.doors.length,DS:b.switches.length,PU:b.puddles.length,EL:b.elevators?.length??0}}},{
   clock:k=>this.clocks[k].advance(0).clientCount,latchedTick:()=>round.guestTicks,freshTick:()=>round.guestTicks,adjustPeriod:n=>Math.floor(n*100/60),
   gridPixel:(g,o)=>this.gridPixel(g,o),effect:e=>this.effect(e),collides:(kind,s,a)=>outlineCollision(this.shape(kind,s),round.collider(a))});
  this.layer3.push(...this.runtime.matches.map((_,index)=>({kind:'LI',index})));
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
   if(e.target==='SP')for(const s of b.spikes)if(b.bombObjectInteractionRules?bombHitsStationarySpike(s,g):s.row===g.row&&(s.column===g.column||s.column===g.column+1))s.visible=false;
   if(e.target==='DS'&&b.bombObjectInteractionRules)for(const s of b.switches)if(bombHitsSwitch(s,g))s.visible=false;
   if(e.target==='WL'){
    for(const w of b.walls)if((w.frame>=4&&w.row===g.row&&w.column===g.column)||(w.frame===0&&w.column===g.column&&[g.row,g.row+1].includes(w.row))||(w.frame===1&&w.row===g.row&&[g.column,g.column+1].includes(w.column)))w.visible=false;
    b.wallRevision=(b.wallRevision??0)+1;
   }
   if(e.target==='EL'&&b.bombOilElevatorRules)for(const change of r.elevators.bomb(g))this.backgroundPaints.push({kind:'EL',index:change.index,frame:change.backgroundFrame});
   if(e.target==='DO')bombStationaryDots(b.dots,g,(d,change)=>{if(!d.bonus&&d.kind==='bonus')d.kind='dot';if(b.bombObjectInteractionRules&&change.changed)r.dotAnimations?.bombLookChanged(d.id);},{allowObjectInteractions:b.bombObjectInteractionRules===true});
  }
  if(e.type==='moving'&&b.bombOilElevatorRules&&['DO','DP'].includes(e.target)){
   const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);
   if(e.target==='DP')for(const index of r.oil.bomb(blast))r.event('bomb-droplet-hidden',r.player,{id:index});
   else bombMovingDots(b.dots,d=>outlineCollision(blast,this.worldOutline(r.elevatorOutlines,300,dotBodyFrame(d),{x:d.x-16,y:d.y-15})),(d,change)=>{if(!d.bonus&&d.kind==='bonus')d.kind='dot';if(change.changed)r.dotAnimations?.bombLookChanged(d.id);});
  }
  if(e.type==='moving'&&e.target==='WA'){
   const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);
   bombActors([r.player,...r.enemies],{guestTick:r.guestTicks,allowObjectInteractions:b.bombObjectInteractionRules===true,collides:a=>outlineCollision(blast,r.collider(a)),onDeath:()=>r.beginDeath({reason:'bomb',sourceReason:-1}),onHidden:a=>r.event('bomb-hidden',a)});
  }
  if(e.type==='paint-crater'){this.craters.push({...e.grid});if(b.bombOilElevatorRules)this.backgroundPaints.push({kind:'crater',...e.grid});}
  if(e.type==='death')r.beginDeath({reason:'spark',sourceReason:e.reason});
  if(e.type==='flourish'||e.type==='floating-score')this.effects.push({kind:e.type,point:this.gridPixel(e.grid,e.gridOffset),frame:0,visible:true,callbacks:0,count:(e.type==='flourish'?this.flourishClock:this.scoreClock).advance(0).clientCount,finish:e.finish});
  if(e.type==='add-time')r.remainingTime+=e.seconds;
  if(e.type==='add-bonus'){this.score+=e.points;r.childScore?.addFlatBonus(e.points);r.event('goodie',r.player);}
  if(['spark-activated','paint-crater'].includes(e.type))r.event(e.type,r.player);
 }
 finish(){if(!this.completed){this.completed=true;this.score+=1000;this.round.event('completion-bonus',this.round.player);}}
 reset({restartLevel=false}={}){
  const r=this.round,b=r.board;b.walls=structuredClone(this.original.walls);b.spikes=structuredClone(this.original.spikes);b.wallRevision=(b.wallRevision??0)+1;
  for(const saved of this.original.dots){const d=b.dots.find(d=>d.id===saved.id);if(b.bombObjectInteractionRules&&d.burnt)r.dotAnimations?.bombLookChanged(d.id);Object.assign(d,saved);delete d.burnt;}
  for(let i=0;i<b.switches.length;i++){delete b.switches[i].visible;Object.assign(b.switches[i],this.original.switches[i]);}
  this.craters=[];this.backgroundPaints=[];this.effects=[];this.runtime.reset();this.completed=false;if(restartLevel)this.score=0;
 }
 snapshot(){return {...this.runtime.snapshot(),...(this.round.board.bombOilElevatorRules?{backgroundPaints:structuredClone(this.backgroundPaints)}:{}),craters:structuredClone(this.craters),effects:this.effects.map(({finish,...e})=>({...e,point:{...e.point}})),score:this.score,completed:!!this.completed};}
}
