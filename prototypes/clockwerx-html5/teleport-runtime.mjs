import {assertSlidingTeleportScope,assertSlidingTeleportActor} from './sliding-teleports.mjs';
// Static Child HY sprites and ordinary WA one-shots. Private maps and atlas
// descriptors are supplied externally. Presentation never chooses a collider.
import {createSourceTimerChain} from './hazards.mjs';
import {teleportOrdinaryActor} from './teleports.mjs';

const count=n=>{if(!Number.isSafeInteger(n)||n<0)throw new RangeError('Nonnegative source count required');};

export function actorFaderFrames(actor){
 if(!actor||![0,1,2,3,6].includes(actor.sourceActorType)||!Number.isInteger(actor.frame)||actor.frame<0||actor.frame>63)throw new TypeError('Ordinary source actor and canonical frame required');
 const type=actor.sourceActorType===6?4:actor.sourceActorType;
 const first=Math.floor((actor.frame&63)*3/16)+12*type;
 return {first,last:first+2};
}

export class TeleportRuntime {
 constructor(endpoints,dots,{hyperspace:hyperspaceCount=0,fader:faderCount=0}={},scope={}){
  count(hyperspaceCount);count(faderCount);
  if(!Array.isArray(endpoints)||!endpoints.length||endpoints.length>22||!Array.isArray(dots))throw new TypeError('Bounded paired HY endpoints and source dots required');
  if(dots.some(d=>d.slideMask)&&scope.allowSlidingTeleports!==true)throw new Error('Separate HY/EX runtime capability required');
  if(scope.allowSlidingTeleports===true)assertSlidingTeleportScope({...scope,dots,teleports:endpoints});
  this.slidingTeleportRules=scope.allowSlidingTeleports===true;
  this.dots=dots;
  this.endpoints=endpoints.map(e=>{
   if(!dots.some(d=>d.id===e.dot)||!endpoints.some(p=>p.dot===e.partner&&p.partner===e.dot)||!Number.isInteger(e.initialFrame)||e.initialFrame<e.firstFrame||e.initialFrame>e.lastFrame||e.lastFrame!==e.firstFrame+1)throw new Error('Qualified paired HY initial state required');
   return {...e,frame:e.initialFrame,clockReference:hyperspaceCount};
  });
  this.counts={hyperspace:hyperspaceCount,fader:faderCount};this.faders=[];this.nextFader=0;
 }
 dot(id){const dot=this.dots.find(d=>d.id===id);if(!dot)throw new Error('HY pivot missing');return dot;}
 // HYReset repositions only. It does not reset frame or its clock reference.
 // SUDisposeOneShots removes WA faders after the round reset callbacks.
 reset(){this.faders=[];}
 latchClocks(values){
  for(const key of ['hyperspace','fader']){count(values[key]);if(values[key]<this.counts[key])throw new RangeError('Monotonic source counts required');}
  this.counts={...values};
 }
 observeHyperspace(value){
  count(value);this.counts.hyperspace=value;
  for(const e of this.endpoints)if(e.clockReference!==value){e.clockReference=value;e.frame=e.frame===e.lastFrame?e.firstFrame:e.frame+1;}
 }
 observeFaders(value){
  count(value);this.counts.fader=value;
  for(const f of this.faders)if(f.visible&&f.clockReference!==value){
   f.clockReference=value;
   if(f.frame===f.lastFrame)f.visible=false;else f.frame++;
  }
  this.faders=this.faders.filter(f=>f.visible);
 }
 startFader(actor,{suppressed=false}={}){
  if(typeof suppressed!=='boolean')throw new TypeError('Explicit source fader suppression flag required');
  if(suppressed)return null;
  const {first,last}=actorFaderFrames(actor),dot=this.dot(actor.pivot);
  // WAGetPixel = current raw dot pixel plus DATA(-28,-28). The raw dot
  // base is logical center(-16,-15), so actor/fader base is(-44,-43).
  const fader={id:this.nextFader++,group:2100,actor:actor.name,pivot:dot.id,x:dot.x-44,y:dot.y-43,frame:first,firstFrame:first,lastFrame:last,visible:true,clockReference:this.counts.fader};
  this.faders.push(fader);return fader;
 }
 teleport(actor,grabbed,{sound,place,checkWalls,onWallDeath,suppressed=false}={}){
  if(this.slidingTeleportRules)assertSlidingTeleportActor(actor,{program:actor?.program??null,human:[0,6].includes(actor?.sourceActorType)});
  const endpoint=this.endpoints.find(e=>e.dot===grabbed.id);if(!endpoint)return false;
  return teleportOrdinaryActor(actor,this.dot(endpoint.partner),{sound,startFader:a=>this.startFader(a,{suppressed}),place,checkWalls,onWallDeath});
 }
 snapshot(){return {counts:{...this.counts},endpoints:this.endpoints.map(e=>({...e,x:this.dot(e.dot).x-16,y:this.dot(e.dot).y-15})),faders:this.faders.map(f=>({...f}))};}
}

// Registered unscaled40 cannot divide500 or100; the next registered
// unscaled50 timer supplies HY(divisor10) and WA fader(divisor2) clients.
export function createTeleportClocks(){
 const hyperspace=createSourceTimerChain(50,10),fader=createSourceTimerChain(50,2);
 return {advance(ticks){return {hyperspace:hyperspace.advance(ticks).clientCount,fader:fader.advance(ticks).clientCount};},snapshot(){return {hyperspace:{...hyperspace.advance(0)},fader:{...fader.advance(0)}};}};
}
