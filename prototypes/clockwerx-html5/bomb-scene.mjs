// Static Child BO/GO scene adapter. Original paths and outlines are injected.
import {BombRuntime,BOMB_CLOCKS,BOMB_SPRITES,bombStationaryDots,bombActors} from './bomb-runtime.mjs';
import {createSourceTimerChain,outlineCollision} from './hazards.mjs';

export class BombScene {
 constructor(round,{outlines,routes,worldOutline}){
  if(!outlines?.groups||typeof worldOutline!=='function')throw new Error('Bomb source profiles required');
  this.round=round;this.outlines=outlines;this.worldOutline=worldOutline;
  const b=round.board;
  if(b.spikes.some(s=>s.subrow!==2||s.subcolumn!==0))throw new Error('Unqualified bomb/spike topology');
  this.original={walls:structuredClone(b.walls),spikes:structuredClone(b.spikes),dots:b.dots.map(d=>({id:d.id,bonus:d.bonus,kind:d.kind}))};
  this.clocks=Object.fromEntries(Object.entries(BOMB_CLOCKS).map(([k,v])=>[k,createSourceTimerChain(v.scaled?Math.floor(v.period*100/60):v.period,1)]));
  this.flourishClock=createSourceTimerChain(40,1);this.scoreClock=createSourceTimerChain(80,1);this.effects=[];this.craters=[];this.score=0;this.layer3=[];this.layer2=[];
  this.runtime=new BombRuntime({bombs:b.bombs,goodies:b.goodies,routes,scope:{dots:b.dots,actors:[round.player,...round.enemies],activeSections:{SP:b.spikes.length,WL:b.walls.length,DR:b.doors.length,DS:b.switches.length,PU:b.puddles.length}}},{
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
   if(e.target==='SP')for(const s of b.spikes)if(s.row===g.row&&(s.column===g.column||s.column===g.column+1))s.visible=false;
   if(e.target==='WL'){
    for(const w of b.walls)if((w.frame>=4&&w.row===g.row&&w.column===g.column)||(w.frame===0&&w.column===g.column&&[g.row,g.row+1].includes(w.row))||(w.frame===1&&w.row===g.row&&[g.column,g.column+1].includes(w.column)))w.visible=false;
    b.wallRevision=(b.wallRevision??0)+1;
   }
   if(e.target==='DO')bombStationaryDots(b.dots,g,d=>{if(!d.bonus&&d.kind==='bonus')d.kind='dot';});
  }
  if(e.type==='moving'&&e.target==='WA'){
   const blast=this.shape('BO',{grid:e.grid},e.descriptorFrame);
   bombActors([r.player,...r.enemies],{guestTick:r.guestTicks,collides:a=>outlineCollision(blast,r.collider(a)),onDeath:()=>r.beginDeath({reason:'bomb',sourceReason:-1}),onHidden:a=>r.event('bomb-hidden',a)});
  }
  if(e.type==='paint-crater')this.craters.push({...e.grid});
  if(e.type==='death')r.beginDeath({reason:'spark',sourceReason:e.reason});
  if(e.type==='flourish'||e.type==='floating-score')this.effects.push({kind:e.type,point:this.gridPixel(e.grid,e.gridOffset),frame:0,visible:true,callbacks:0,count:(e.type==='flourish'?this.flourishClock:this.scoreClock).advance(0).clientCount,finish:e.finish});
  if(e.type==='add-time')r.remainingTime+=e.seconds;
  if(e.type==='add-bonus'){this.score+=e.points;r.event('goodie',r.player);}
  if(['spark-activated','paint-crater'].includes(e.type))r.event(e.type,r.player);
 }
 finish(){if(!this.completed){this.completed=true;this.score+=1000;this.round.event('completion-bonus',this.round.player);}}
 reset({restartLevel=false}={}){
  const b=this.round.board;b.walls=structuredClone(this.original.walls);b.spikes=structuredClone(this.original.spikes);b.wallRevision=(b.wallRevision??0)+1;
  for(const saved of this.original.dots){const d=b.dots.find(d=>d.id===saved.id);Object.assign(d,saved);delete d.burnt;}
  this.craters=[];this.effects=[];this.runtime.reset();this.completed=false;if(restartLevel)this.score=0;
 }
 snapshot(){return {...this.runtime.snapshot(),craters:structuredClone(this.craters),effects:this.effects.map(({finish,...e})=>({...e,point:{...e.point}})),score:this.score,completed:!!this.completed};}
}
