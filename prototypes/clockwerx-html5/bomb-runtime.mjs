import {validateConnectorBoard} from './sliding.mjs';
import {assertSlidingOilScope} from './sliding-oil.mjs';
import {assertSlidingBombScope} from './sliding-bombs.mjs';
// Source-derived Child BO/LI/SR/GO coordinator. No art, paths,
// map, timer implementation or sprite-list traversal is embedded here.
import {BOMB_LIMITS,decodeBombRecord,createExplosionPool} from './bombs.mjs';

export const BOMB_CLOCKS=Object.freeze({match:{period:100,scaled:false},spark:{period:62,scaled:true},explosion:{period:150,scaled:false},goodie:{period:200,scaled:false}});
export const BOMB_SPRITES=Object.freeze({match:{group:1600,layer:3,gridOffset:{x:31,y:31}},spark:{group:1500,layer:3,gridOffset:{x:6,y:6}},explosion:{group:1800,layer:2,gridOffset:{x:5,y:5}},goodie:{group:1900,layer:15,gridOffset:{x:4,y:4}},background:{group:1400,gridOffset:{x:6,y:6},craterFrame:14}});
const integer=(n,min=0,max=0x7fffffff)=>{if(!Number.isInteger(n)||n<min||n>max)throw new RangeError('Invalid source integer');return n;};
const fn=(f,name)=>{if(typeof f!=='function'||f.constructor?.name==='AsyncFunction')throw new TypeError(`Synchronous ${name} adapter required`);return f;};
const sync=(f,...args)=>{const result=f(...args);if(result&&typeof result.then==='function')throw new TypeError('Source adapter returned a Promise');return result;};
const copy=x=>structuredClone(x);
const sameGrid=(a,b)=>a.row===b.row&&a.column===b.column;
const grid=g=>{integer(g?.row,0,7);integer(g?.column,0,10);};
const human=a=>a.sourceActorType===0||a.sourceActorType===6;
function actor(a,allowObjectInteractions=false,allowSlidingGoodies=false,allowSlidingBombs=false){
 if(!a||![0,1,2,3,6,...(allowObjectInteractions?[4]:[])].includes(a.sourceActorType))throw new Error('Only human, ordinary and explicitly qualified orbital actors are supported');
 integer(a.sourceSlot,0,31);
 if(human(a)!==(a.sourceSlot<2))throw new Error('Explicit source WA slot/type correspondence required');
 if(a.movingPivot||a.sliding&&!allowSlidingGoodies)throw new Error('Dynamic actor combinations are unqualified');
 if(allowSlidingBombs&&(a.sourceSlot>30||(human(a)?a.speedClass!==0:![1,2,3].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||a.program!==null&&(!/^[bfns]+$/.test(a.program)||!Number.isInteger(a.sourcePC)||a.sourcePC<1||a.sourcePC>a.program.length))))throw new Error('BO/EX requires source slots0..30 and wall-free ordinary class1 actors');
 return a;
}
function staticDot(d,allowObjectInteractions=false){
 grid(d);integer(d.color??0,0,7);
 if(d.moving||d.movingProgram||d.upDown||(!allowObjectInteractions&&(d.protected||d.waystation))||d.transferDeath||d.slowdown||d.connector||d.sourceBombDynamic)throw new Error('Unsupported bomb/dynamic or special-dot combination');
 if(typeof d.humanCanGrab!=='boolean'||typeof d.sourceInBackground!=='boolean'||typeof d.ring!=='boolean'||typeof d.bonus!=='boolean')throw new TypeError('Explicit live dot permissions, source background +0x12, ring and bonus state required');
}

/** Call with the mode-filtered inventory before wiring a board. These are
 * normalized declarations, not a raw-level decoder. Empty absent sections
 * are permitted; future active combinations fail closed. */
export function assertBombRuntimeScope({mode='Child',dots=[],actors=[],activeSections={},allowObjectInteractions=false,allowMovingOilElevators=false,allowSlidingBombs=false,allowSlidingBombCheckpoints=false,connectors=[],bombs=[],walls=[]}={}){
 if(mode!=='Child')throw new Error('Only Child bomb scope is supported');
 if(allowSlidingBombCheckpoints&&!allowSlidingBombs)throw new Error('EX bomb checkpoints require EX bomb core');
 if(allowSlidingBombCheckpoints&&!allowObjectInteractions)throw new Error('EX bomb checkpoints require existing bomb object interactions');
 if(allowSlidingBombs)return assertSlidingBombScope({dots,actors,connectors,bombs,walls,activeSections,checkpoints:allowSlidingBombCheckpoints});
 if(!Array.isArray(dots)||!Array.isArray(actors))throw new TypeError('Normalized dots and actors required');
 if(allowMovingOilElevators&&!allowObjectInteractions)throw new Error('Moving Oil/elevator blasts require object interaction rules');
 for(const d of dots)if(allowMovingOilElevators&&d.upDown)plainUpDownDot(d);else staticDot(d,allowObjectInteractions);
 for(const a of actors)actor(a,allowObjectInteractions);
 for(const [kind,n]of Object.entries(activeSections)){
  integer(n);
  if(n&&!(allowMovingOilElevators?['WL','BO','GO','WP','WA','TX','PU','EL','WY']:['SP','WL','BO','GO','WP','WA','TX',...(allowObjectInteractions?['DR','DS','WY']:[])]).includes(kind))throw new Error(`Unqualified active bomb combination: ${kind}`);
 }
 return true;
}

/** GO callbacks compose with qualified static checkpoints/protection and doors.
 * The explicit static-EX variant also admits SP/WL; no fuse, blast, ring or Oil. */
export function assertGoodieRuntimeScope({mode='Child',dots=[],actors=[],activeSections={},allowElevatorGoodies=false,allowColoredElevatorGoodies=false,allowSlidingOilGoodieRings=false,puddles=[],spikes=[],goodies=[],allowSlidingGoodiePrograms=false,allowSlidingGoodies=false,connectors=[]}={}){
 if(mode!=='Child')throw new Error('Only Child goodie scope is supported');
 if(!Array.isArray(dots)||!Array.isArray(actors))throw new TypeError('Normalized dots and actors required');
 if(allowSlidingOilGoodieRings){
  if(allowSlidingGoodies||allowSlidingGoodiePrograms||allowElevatorGoodies||allowColoredElevatorGoodies||activeSections.GO!==goodies.length||activeSections.PU!==puddles.length||activeSections.SP!==spikes.length||activeSections.EX!==connectors.length)throw new Error('Explicit separate Oil/EX/GO/ring inventory required');
  return assertSlidingOilScope({dots,actors,connectors,puddles,spikes,goodies,activeSections,rich:true});
 }
 if(allowSlidingGoodiePrograms&&!allowSlidingGoodies)throw new Error('Sliding goodie programs require sliding goodies');
 if(allowSlidingGoodies){if(allowElevatorGoodies||allowColoredElevatorGoodies||!(activeSections.GO>0)||activeSections.EX!==connectors.length||!connectors.length||dots.some(d=>d.motion!=='static'||d.protected||d.waystation||d.humanCanGrab!==true||d.nonhumanCanGrab!==true))throw new Error('Separate static EX goodie scope required');validateConnectorBoard(connectors,dots);if(actors.some(a=>!([0,6].includes(a.sourceActorType)||[1,2,3].includes(a.sourceActorType)&&a.speedClass===1&&(a.program===null||allowSlidingGoodiePrograms&&/^[bns]+$/.test(a.program)&&Number.isInteger(a.sourcePC)&&a.sourcePC>=1)&&a.checksWalls===false)))throw new Error('Free ordinary class1 EX goodie actors required');}
 if((allowElevatorGoodies||allowColoredElevatorGoodies)&&(!(activeSections.EL>0)||!dots.some(d=>d.upDown)))throw new Error('Explicit active elevator/goodie composition required');
 for(const d of dots){
  grid(d);integer(d.color??0,0,7);
  if(d.motion==='up-down'&&!d.upDown||d.motion==='static'&&d.upDown)throw new Error('Explicit matching goodie motion/up-down state required');
  if((d.motion!=='static'&&!((allowElevatorGoodies||allowColoredElevatorGoodies)&&d.motion==='up-down'))||d.slideMask!==0&&!allowSlidingGoodies||d.teleport!==false||d.ring||d.moving||d.movingProgram||d.upDown&&(allowColoredElevatorGoodies?(![0,1,2].includes(d.upDown.group)||d.color!==[4,2,1][d.upDown.group]||d.upDown.initialLowered!==false||d.bonus||d.protected||d.waystation||d.sourceInBackground!==false):(!allowElevatorGoodies||![1,2].includes(d.upDown.group)||d.color!==0||d.bonus||d.protected||d.waystation||d.sourceInBackground!==false||typeof d.upDown.initialLowered!=='boolean'||d.upDown.group===2&&d.upDown.initialLowered))||d.transferDeath||d.slowdown||d.connector&&!allowSlidingGoodies||d.sourceBombDynamic)throw new Error('Unsupported goodie/dynamic dot combination');
  if(['present','humanCanGrab','nonhumanCanGrab','sourceInBackground','ring','bonus'].some(k=>typeof d[k]!=='boolean'))throw new TypeError('Explicit static goodie dot state required');
 }
 for(const a of actors)actor(a,allowColoredElevatorGoodies,allowSlidingGoodies);
 for(const [kind,n]of Object.entries(activeSections)){
  integer(n);
  if(n&&!(allowSlidingGoodies?['SP','WL','EX','GO','WP','WA','TX']:allowElevatorGoodies||allowColoredElevatorGoodies?['SP','EL','GO','WP','WA','TX']:['WL','DR','DS','WY','GO','WP','WA','TX']).includes(kind))throw new Error(`Unqualified active goodie combination: ${kind}`);
 }
 return true;
}

/** Mutates only transient burnt/bonus state. Never removes the pivot or changes
 * grab permissions. Caller owns DO redraw/background/secondary descriptors and
 * restores saved DO specifications on reset, alongside StaticDotRuntime. */
export function applyBombDotHit(dot,onChange,{allowObjectInteractions=false}={}){
 staticDot(dot,allowObjectInteractions);fn(onChange,'dot appearance');
 return mutateBombDotHit(dot,onChange);
}
function mutateBombDotHit(dot,onChange){
 if(!dot.humanCanGrab)return false;
 let changed=false;
 if(!dot.ring&&!dot.burnt){dot.burnt=true;changed=true;}
 if(dot.bonus){dot.bonus=false;changed=true;}
 // DOInfo +0x12 uses the background repaint path even with no state change.
 // This restores dots over frame 4's freshly painted crater.
 const minimum=dot.waystation?79:dot.ring?23+7*(dot.color??0):92+(dot.color??0);
 if(changed||dot.sourceInBackground)sync(onChange,dot,{changed,paintBackground:dot.sourceInBackground,
  updateSpriteRange:changed&&!dot.sourceInBackground,minimum,maximum:dot.waystation?89:dot.ring?minimum+7:minimum,
  burntFrame:dot.burnt&&!dot.waystation?92+(dot.color??0):null,sourceBomb:true});
 return changed;
}
function plainUpDownDot(dot){
 grid(dot);
 if(dot.motion!=='up-down'||![0,1].includes(dot.upDown?.group)||dot.moving||dot.movingProgram||dot.ring||dot.protected||dot.waystation||dot.transferDeath||dot.slowdown||dot.connector||dot.sourceBombDynamic||dot.sourceInBackground!==false||typeof dot.sourceCollidable!=='boolean'||typeof dot.humanCanGrab!=='boolean'||typeof dot.bonus!=='boolean')throw new Error('Explicit plain up/down main-sprite state required');
}
// The live mixed scene supplies current main-RO visibility and outlines.
export function bombMovingDots(dots,collides,onChange){
 if(!Array.isArray(dots))throw new TypeError('Source dot records required');
 fn(collides,'moving dot outline');fn(onChange,'dot appearance');const changed=[];
 for(const dot of dots){
  if(!dot.upDown)continue;
  plainUpDownDot(dot);
  if(!dot.sourceCollidable||!sync(collides,dot))continue;
  if(mutateBombDotHit(dot,onChange))changed.push(dot.id);
 }
 return changed;
}
export function bombStationaryDots(dots,origin,onChange,options){
 grid(origin);integer(origin.row,0,6);integer(origin.column,0,9);fn(onChange,'dot appearance');
 if(!Array.isArray(dots))throw new TypeError('Source dot records required');
 // Source visits row+1 before column+1. Missing serialized cells are absent.
 const changed=[];
 for(const [dr,dc]of [[0,0],[1,0],[0,1],[1,1]]){
  const dot=dots.find(d=>d.row===origin.row+dr&&d.column===origin.column+dc);
  if(dot&&!dot.upDown&&applyBombDotHit(dot,onChange,options))changed.push(dot.id);
 }
 return changed;
}

/** WABombed Child deadline is metadata for ordinary enemies, not a request to
 * resurrect them. Source WA reset owns restoring visibility. Death dispatch
 * does not stop the remaining source-slot scan. */
export function bombActors(actors,{guestTick,collides,onDeath,onHidden,allowObjectInteractions=false,allowSlidingBombs=false}){
 integer(guestTick);fn(collides,'actor outline collision');fn(onDeath,'human death');fn(onHidden,'actor visibility');
 if(!Array.isArray(actors))throw new TypeError('Live source-slot actor array required');
 let previous=-1;for(const a of actors){actor(a,allowObjectInteractions,allowSlidingBombs,allowSlidingBombs);if(a.sourceSlot<=previous)throw new Error('Actors must retain unique ascending source slots');previous=a.sourceSlot;}
 const hits=[];
 for(const a of actors){
  if(a.visible===false||!sync(collides,a))continue;
  a.visible=false;a.hiddenUntil=guestTick+300;hits.push(a.sourceSlot);sync(onHidden,a);
  if(human(a))sync(onDeath,a,{reason:-1,type:'bomb'});
 }
 return hits;
}

function routeMap(routes,bombs){
 if(!Array.isArray(routes))throw new TypeError('Private source fuse routes required');
 const map=new Map();
 for(const r of routes){
  integer(r.kind,0,13);if(map.has(r.kind))throw new Error('Duplicate route kind');
  if(!Array.isArray(r.points)||!r.points.length)throw new Error('Nonempty route points required');
  for(const p of r.points){if(!Array.isArray(p)||p.length!==2)throw new TypeError('Point word pair required');p.forEach(n=>integer(n,-128,127));}
  for(const k of ['entryLeg','forwardExit','reverseExit'])integer(r[k],0,15);
  for(const k of ['bomb','flipVertical','flipHorizontal','swap'])if(typeof r[k]!=='boolean')throw new TypeError('Explicit route flags required');
  if(r.bomb!==(r.kind<4))throw new Error('BO terminal classification disagrees with source kind');
  map.set(r.kind,copy(r));
 }
 for(const b of bombs)if(!map.has(b.kind))throw new Error('Missing source fuse route');
 // Every match must reach a terminal by source record index, never geometry.
 // Geometry continuity and original path hashes remain caller prerequisites.
 for(let i=0;i<bombs.length;i++)if(bombs[i].kind>=10){
  let n=i;while(n<bombs.length&&!map.get(bombs[n].kind).bomb)n++;
  if(n===bombs.length)throw new Error('Unterminated serialized fuse chain');
 }
 return map;
}

/** Adapters run synchronously; returned events are diagnostics only. Required:
 * clock(name), latchedTick(), freshTick(), adjustPeriod(n), gridPixel(grid,offset),
 * effect(event), collides(kind,sprite,actor). effect must dispatch stationary /
 * moving / crater / death / score / flourish and insertion at the call site.
 * Flourish receives finish(), which is invalidated on round reset.
 * Do not advance the pools as a snapshot: call one observe method at each
 * sprite's actual place in the caller's cached-next SU traversal. */
export class BombRuntime {
 constructor({bombs=[],goodies=[],routes,mode='Child',unsupported=[],scope,scopeMode='bombs'},adapters){
  if(mode!=='Child'||!Array.isArray(unsupported)||unsupported.length)throw new Error('Only bounded Child bomb combinations are supported');
  if(!Array.isArray(bombs)||bombs.length>BOMB_LIMITS.fuses)throw new RangeError('BO capacity exceeded');
  if(scopeMode==='goodies'){
   if(!scope)throw new Error('Explicit goodie scope required');
   if(bombs.length||(routes!==undefined&&(!Array.isArray(routes)||routes.length)))throw new Error('Goodie scope cannot include fuses or routes');
   assertGoodieRuntimeScope(scope);
   if((scope.allowSlidingGoodies||scope.allowSlidingOilGoodieRings)&&scope.activeSections?.GO!==goodies.length)throw new Error('Explicit matching GO inventory required');
  }else if(scopeMode==='bombs'){
   if(scope?.allowSlidingBombs&&goodies.length)throw new Error('BO/static EX core does not admit GO');
   if(scope)assertBombRuntimeScope({...scope,bombs});
  }else throw new Error('Unknown BO/GO scope');
  if(!Array.isArray(goodies)||goodies.length>BOMB_LIMITS.goodies)throw new RangeError('GO capacity exceeded after mode filtering');
  this.slidingBombs=scopeMode==='bombs'&&scope?.allowSlidingBombs===true;
  this.slidingGoodies=scopeMode==='goodies'&&(scope?.allowSlidingGoodies===true||scope?.allowSlidingOilGoodieRings===true);
  this.adapters=adapters??{};
  for(const name of ['clock','latchedTick','freshTick','adjustPeriod','gridPixel','effect','collides'])fn(this.adapters[name],name);
  this.bombs=bombs.map(b=>{
   if(b.rawWords)return decodeBombRecord(b);
   integer(b.flags??0,0,255);integer(b.padding??0,0,255);
   return decodeBombRecord({rawWords:[b.row,b.column,b.kind,(b.flags??0)*256+(b.padding??0)]});
  });
  for(const b of this.bombs)if(b.kind<4){integer(b.row,0,6);integer(b.column,0,9);}
  this.routes=routeMap(scopeMode==='goodies'?[]:routes,this.bombs);this.armed=this.bombs.map(b=>b.role==='match');
  const matchBombs=this.bombs.map((b,index)=>({...b,index})).filter(b=>b.role==='match');
  if(matchBombs.length>BOMB_LIMITS.matches)throw new RangeError('LI capacity exceeded');
  this.matches=matchBombs.map((b,index)=>{
   const first=3*[0,1,2,2][b.kind-10]+(b.flags?9:0);
   return {index,bombIndex:b.index,grid:{row:b.row,column:b.column},frame:first,first,last:first+2,visible:true,count:this.clock('match'),group:1600,layer:3};
  });
  this.goodies=goodies.map((g,index)=>{
   grid(g);integer(g.initialFrame??0,0,65535);
   if(g.activationMask!==undefined&&!(integer(g.activationMask,0,0xffffffff)&1))throw new Error('Filter GO mode masks before constructing this runtime');
   // SUSetFrameIndex ignores invalid requests, leaving the clone's frame 0.
   return {index,grid:{row:g.row,column:g.column},frame:(g.initialFrame??0)<17?(g.initialFrame??0):0,visible:true,collected:false,count:this.clock('goodie'),group:1900,layer:15};
  });
  this.sparks=Array.from({length:17},(_,index)=>({index,visible:false,inserted:false,clockAttached:false,frame:0,group:1500,layer:3}));
  this.explosions=createExplosionPool();this.generation=0;this.frozen=false;
 }
 clock(name){return integer(this.adapters.clock(name));}
 emit(events,event){events.push(event);sync(this.adapters.effect,event);}
 snapshot(){return {armed:[...this.armed],matches:copy(this.matches),goodies:copy(this.goodies),sparks:copy(this.sparks),explosions:this.explosions.snapshot(),frozen:this.frozen};}
 freeze(value=true){if(typeof value!=='boolean')throw new TypeError('Boolean freeze required');this.frozen=value;}
 reset(){
  // Caller restores external DO/WL/SP/WA state in source reset order. Persistent
  // LI/GO phase/reference and pool insertion identity survive this reset.
  this.generation++;this.armed=this.bombs.map(b=>b.role==='match');
  for(const s of this.matches)s.visible=true;
  for(const s of this.goodies){s.visible=true;s.collected=false;}
  for(const s of this.sparks){s.visible=false;s.clockAttached=false;}
  this.explosions.reset();this.frozen=false;
 }
 item(list,index){integer(index,0,list.length-1);return list[index];}
 observeMatch(index,count=this.clock('match')){return this.observeLoop(this.matches,index,count,'LI');}
 observeGoodie(index,count=this.clock('goodie')){return this.observeLoop(this.goodies,index,count,'GO');}
 observeLoop(list,index,count,target){
  integer(count);const s=this.item(list,index);if(this.frozen||s.count===count)return [];
  s.count=count;s.frame=s.frame===(s.last??16)?(s.first??0):s.frame+1;
  const events=[];this.emit(events,{type:'frame',target,index,frame:s.frame});return events;
 }
 ignite(bombIndex,who){
  actor(who,false,this.slidingBombs,this.slidingBombs);const b=this.item(this.bombs,bombIndex),events=[];
  if(this.frozen||b.role!=='match'||!this.armed[bombIndex]||(!human(who)&&!b.flags))return events;
  this.activateSpark(bombIndex,[4,8,1,2][b.kind-10],events);
  for(const s of this.matches)if(sameGrid(s.grid,b)){s.visible=false;this.emit(events,{type:'hide',target:'LI',index:s.index});}
  this.emit(events,{type:'sound',id:11});this.armed[bombIndex]=false;return events;
 }
 activateSpark(bombIndex,entryLeg,events=[]){
  if(this.item(this.bombs,bombIndex).role!=='match')throw new Error('Bounded spark allocation requires a match record');integer(entryLeg,0,15);
  if(this.frozen)return -1;
  const s=this.sparks.find(s=>!s.visible);if(!s)return -1;
  const append=!s.inserted;
  Object.assign(s,{visible:false,frame:0,first:0,last:3,count:this.clock('spark'),clockAttached:true,travelling:false,igniting:false,
   deadline:integer(this.adapters.latchedTick())+integer(this.adapters.adjustPeriod(60)),inserted:true});
  this.assignRoute(s,bombIndex,entryLeg);
  // Allocation is synchronous. A same-sweep callback sees the count snapshot.
  if(append)this.emit(events,{type:'append-sprite',target:'SR',index:s.index,layer:3});
  s.visible=true;this.emit(events,{type:'spark-activated',index:s.index,bombIndex});return s.index;
 }
 assignRoute(s,bombIndex,entryLeg){
  const b=this.item(this.bombs,bombIndex),r=this.routes.get(b.kind);
  s.bombIndex=bombIndex;s.pathStep=entryLeg===r.entryLeg?1:-1;s.pathIndex=s.pathStep>0?0:r.points.length-1;
  s.grid={row:b.row,column:b.column};this.positionSpark(s);
 }
 positionSpark(s){
  const b=this.bombs[s.bombIndex],r=this.routes.get(b.kind),p=r.points[s.pathIndex];
  if(!p)throw new Error('Visible spark path escaped validated source samples');
  let [v,h]=p;if(r.flipVertical)v=48-v;if(r.flipHorizontal)h=48-h;if(r.swap)[v,h]=[h,v];
  const base=this.adapters.gridPixel(s.grid,{x:6,y:6});
  if(!Number.isFinite(base?.x)||!Number.isFinite(base?.y))throw new TypeError('Finite raw sprite origin required');
  s.point={x:base.x+h,y:base.y+v};
 }
 observeSpark(index,count=this.clock('spark')){
  integer(count);const s=this.item(this.sparks,index),events=[];
  if(this.frozen||!s.visible||!s.clockAttached||s.count===count)return events;
  s.count=count;let next=s.frame===s.last?s.first:s.frame+1;
  if(s.travelling){
   this.emit(events,{type:'erase-spark-background',index,rawBase:{...s.point},group:1500,descriptorFrame:s.frame,width:6,height:6});
   s.pathIndex+=s.pathStep;const r=this.routes.get(this.bombs[s.bombIndex].kind);
   if(s.pathIndex<0||s.pathIndex>=r.points.length){
    if(r.bomb){
     this.activateExplosion(s.bombIndex,events);s.visible=false;s.clockAttached=false;
     this.emit(events,{type:'hide',target:'SR',index});
     // Original calls SRPosition once more after hiding, with an out-of-path
     // sample. Its unobservable private-memory read is intentionally omitted.
    }else this.assignRoute(s,s.bombIndex+1,s.pathStep>0?r.forwardExit:r.reverseExit);
   }else this.positionSpark(s);
  }else if(s.igniting){
   if(next===8){s.first=8;s.last=11;s.travelling=true;next=8;}
  }else if(integer(this.adapters.freshTick())>s.deadline){s.first=4;s.last=8;s.igniting=true;next=4;}
  s.frame=next;
  this.emit(events,{type:'frame',target:'SR',index,frame:s.frame});return events;
 }
 activateExplosion(bombIndex,events=[]){
  const b=this.item(this.bombs,bombIndex);if(b.role!=='bomb')throw new Error('Only terminal BO records explode');
  if(this.frozen)return -1;
  // Sound must run before first-free allocation, including pool exhaustion.
  this.emit(events,{type:'sound',id:12});
  const result=this.explosions.activate({row:b.row,column:b.column},this.clock('explosion'));
  for(const e of result.events)if(e.type!=='sound')this.emit(events,{...e,target:'BO'});
  return result.index;
 }
 observeExplosion(index,count=this.clock('explosion')){
  integer(count);if(this.frozen)return [];
  const events=[];
  this.explosions.observe(index,count,{onEffect:e=>this.emit(events,e)});
  // effect(stationary/moving) performs original tests now, before descriptor
  // commit; it must not defer mutations or replay these diagnostic events.
  return events;
 }
 checkMatch(who){
  actor(who,false,this.slidingGoodies||this.slidingBombs,this.slidingBombs);if(this.frozen)return [];
  const s=this.matches.find(s=>s.visible&&sync(this.adapters.collides,'LI',s,who));
  return s?this.ignite(s.bombIndex,who):[];
 }
 checkSpark(who){
  actor(who,false,this.slidingGoodies||this.slidingBombs,this.slidingBombs);if(this.frozen||!human(who))return [];
  const s=this.sparks.find(s=>s.visible&&s.travelling&&sync(this.adapters.collides,'SR',s,who)),events=[];
  if(s)this.emit(events,{type:'death',reason:15,actor:who,index:s.index});return events;
 }
 checkGoodie(who){
  actor(who,false,this.slidingGoodies||this.slidingBombs,this.slidingBombs);if(this.frozen||!human(who))return [];
  // GO collision ignores collected latch: first still-visible collected GO
  // blocks later overlapped GO until its flourish callback hides it.
  const s=this.goodies.find(s=>s.visible&&sync(this.adapters.collides,'GO',s,who));
  return s?this.collectGoodie(s.index,who):[];
 }
 collectGoodie(index,who){
  actor(who,false,this.slidingGoodies||this.slidingBombs,this.slidingBombs);const s=this.item(this.goodies,index),events=[];
  if(this.frozen||!human(who)||s.collected)return events;
  const generation=this.generation;
  this.emit(events,{type:'sound',id:22});
  this.emit(events,{type:'flourish',index,grid:{...s.grid},gridOffset:{x:18,y:18},finish:()=>{if(generation===this.generation)s.visible=false;}});
  this.emit(events,{type:'floating-score',index,grid:{...s.grid},gridOffset:{x:10,y:16},points:1000});
  s.collected=true; // Source latch follows flourish/score creation.
  this.emit(events,{type:'add-time',seconds:10});
  this.emit(events,{type:'add-bonus',actorIndex:who.sourceSlot,points:1000});return events;
 }
}
