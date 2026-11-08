// Static-dot single-player Oil coordinator. Private outlines and qualified
// source bounds are mandatory; preparing this module does not enable a level.
import {createSourceTimerChain,outlineCollision} from './hazards.mjs';
import {dotRenderSpec} from './dots.mjs';
import {createPuddleState,triggerPuddle,observePuddle,createDropletState,
 dropletArrived,dropletHumanGrab,dropletDirection,advanceDroplet,oilOutline,
 findDormantPuddleContact,OIL_LIMITS} from './oil.mjs';

export class OilRuntime {
 constructor(board,{outlines,dotOutlines,bounds}={}){
  if(!outlines?.groups?.['1200']||!outlines.groups['2200']||!dotOutlines?.groups?.['300'])throw new Error('Original oil and dot outlines required');
  if(!bounds||!['left','top','right','bottom'].every(k=>Number.isInteger(bounds[k])))throw new Error('Qualified source universe bounds required');
  this.board=board;this.outlines=outlines;this.dotOutlines=dotOutlines;this.bounds={...bounds};
  this.dots=[...board.dots].sort((a,b)=>a.sourceIndex-b.sourceIndex);
  if(this.dots.some(d=>!Number.isInteger(d.sourceIndex)||d.sourceIndex<0||d.sourceIndex>87)||new Set(this.dots.map(d=>d.sourceIndex)).size!==this.dots.length)throw new Error('Unique source dot slots required');
  this.puddleClock=createSourceTimerChain(83,2);this.dropletClock=createSourceTimerChain(83,1);this.faderClock=createSourceTimerChain(50,2);
  this.now=0;this.counts={puddle:0,droplet:0,fader:0};this.reset(board.player.pivot);
 }
 reset(heroPivot){
  this.puddles=(this.board.puddles||[]).map(spec=>createPuddleState(spec,this.board.origin));
  this.droplets=[];this.faders=[];this.sprites=this.puddles.map((_,index)=>({kind:'puddle',index}));
  this.heroPivot=this.index(heroPivot);this.allocations=0;
 }
 index(id){const dot=this.dots.find(d=>d.id===id);if(!dot)throw new Error('Source dot slot required');return dot.sourceIndex;}
 dot(index){const dot=this.dots.find(d=>d.sourceIndex===index);if(!dot)throw new Error('Absent source dot '+index);return dot;}
 pixel(index){const dot=this.dot(index);return {x:dot.x-16,y:dot.y-15};}
 canGrab(index,human){const dot=this.dot(index),value=human?dot.humanCanGrab:dot.nonhumanCanGrab;if(typeof value!=='boolean')throw new Error('Source dot permissions required');return value;}
 acquireDot(pixel){
  // First source slot wins, even when its permission denies the query.
  const dot=this.dots.find(dot=>{const p=this.pixel(dot.sourceIndex);return Math.abs(p.x-pixel.x)<=6&&Math.abs(p.y-pixel.y)<=6;});
  return dot&&this.canGrab(dot.sourceIndex,false)?{index:dot.sourceIndex,pixel:this.pixel(dot.sourceIndex)}:null;
 }
 collideDot(state){
  const shape=oilOutline(this.outlines.groups['2200'].frames[state.frame],state.base);
  for(const dot of this.dots){
   if(!dot.sourceCollidable)continue;
   const frame=dotRenderSpec(dot).sourceDescriptor-300;
   if(outlineCollision(shape,oilOutline(this.dotOutlines.groups['300'].frames[frame],this.pixel(dot.sourceIndex))))return dot.sourceIndex;
  }
  return -1;
 }
 advanceClocks(ticks){
  this.now+=ticks;
  this.counts={puddle:this.puddleClock.advance(ticks).clientCount,droplet:this.dropletClock.advance(ticks).clientCount,fader:this.faderClock.advance(ticks).clientCount};
 }
 contactHuman(handOutline){
  const index=findDormantPuddleContact(this.puddles,this.outlines.groups['1200'].frames,handOutline);
  if(index<0)return [];
  const result=triggerPuddle(this.puddles[index],{now:this.now,clockCount:this.counts.puddle,delay150:250});
  this.puddles[index]=result.state;return result.events;
 }
 humanGrab(id){
  this.heroPivot=this.index(id);
  return this.droplets.flatMap(({state})=>dropletHumanGrab(state,this.heroPivot));
 }
 createDroplet(index,context,clonePreference){
  if(this.allocations>=OIL_LIMITS.droplets)return;
  this.allocations++;
  let state=createDropletState(index,this.pixel(index),{now:this.now,delay150:250,delay700:1166});
  const arrival=dropletArrived(state,{humanCanGrab:this.canGrab(index,true),heroPivot:this.heroPivot,heroSliding:false});
  state=arrival.state;
  const entry={state,clockReference:this.counts.droplet};
  const slot=this.droplets.push(entry)-1;this.sprites.push({kind:'droplet',index:slot});
  this.dispatch(arrival.events,context);
  if(clonePreference!==undefined){
   Object.assign(state,dropletDirection(this.pixel(index),this.pixel(this.heroPivot),clonePreference),{moveDeadline:1});
  }
 }
 dispatch(events,context){
  for(const event of events){
   if(event.type==='death')context.onDeath(event.reason);
   else if(event.type==='createDroplet')this.createDroplet(event.dotIndex,context);
   else if(event.type==='fader'){
    const slot=this.faders.push({base:this.pixel(event.dotIndex),frame:104,visible:true,clockReference:this.counts.fader})-1;
    this.sprites.push({kind:'fader',index:slot});
   }
   context.onEvent?.(event);
  }
 }
 processSprites(context){
  if(typeof context?.onDeath!=='function'||typeof context?.isFrozen!=='function')throw new Error('Source death/freeze callbacks required');
  // Layer11 tail insertion with next cached before each source callback.
  // New actors snapshot their client count, so their first frame waits even
  // when an older successor lets traversal encounter the appended sprite.
  for(let cursor=this.sprites.length?0:-1;cursor>=0&&!context.isFrozen();){
   const next=cursor+1<this.sprites.length?cursor+1:-1,{kind,index}=this.sprites[cursor];
   if(kind==='puddle'){
    const result=observePuddle(this.puddles[index],{now:this.now,clockCount:this.counts.puddle,acquireDot:p=>this.acquireDot(p)});
    this.puddles[index]=result.state;this.dispatch(result.events,context);
   }else if(kind==='droplet'){
    const entry=this.droplets[index];
    if(entry.clockReference!==this.counts.droplet){
     entry.clockReference=this.counts.droplet;
     const result=advanceDroplet(entry.state,{now:this.now,delay150:250,delay700:1166,
      targetPixel:this.pixel(this.heroPivot),dotPixel:i=>this.pixel(i),collideDot:s=>this.collideDot(s),
      humanCanGrab:i=>this.canGrab(i,true),heroPivot:this.heroPivot,heroSliding:false,bounds:this.bounds,
      onClone:event=>this.createDroplet(event.dotIndex,context,event.preferVertical)});
     entry.state=result.state;this.dispatch(result.events.filter(e=>e.type!=='clone'),context);
    }
   }else{
    const fader=this.faders[index];
    if(fader.visible&&fader.clockReference!==this.counts.fader){fader.clockReference=this.counts.fader;if(fader.frame===106)fader.visible=false;else fader.frame++;}
   }
   cursor=next;
  }
 }
 snapshot(){return {now:this.now,counts:{...this.counts},heroPivot:this.heroPivot,allocations:this.allocations,
  puddles:this.puddles.map(s=>({...s,base:{...s.base}})),droplets:this.droplets.map(e=>({...e.state,base:{...e.state.base},clockReference:e.clockReference})),
  faders:this.faders.map(s=>({...s,base:{...s.base}}))};}
}
