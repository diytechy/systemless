// First hazard-bearing round adapter. Source outlines remain private. Rendering
// may interpolate SVG poses; collisions use the original 64-angle pixel lattice.
import {MovementGame,TAU} from './engine.mjs';
import {outlineCollision,enemyFrameGate,createSourceTimerChain} from './hazards.mjs';
import {createDeathClock} from './death.mjs';
import {advanceWallContactGuard} from './walls.mjs';
import {createDoorSystem,findDoorContact} from './doors.mjs';
import {OilRuntime} from './oil-runtime.mjs';
import {createActorClocks} from './actor-clocks.mjs';
import {advanceBounceEnemy} from './programs.mjs';

export const sourceFrame=angle=>Math.floor(angle/TAU*64+1e-9)&63;

export function worldOutline(profile,group,frame,point){
 const f=profile.groups[String(group)]?.frames[frame];
 if(!f)throw new Error(`Missing qualified source outline ${group}:${frame}`);
 if(f.collidable===false||f.outlineIndex===-1)return null;
 return {...f,left:f.left+point.x,right:f.right+point.x,top:f.top+point.y,bottom:f.bottom+point.y};
}

export class SourceRound extends MovementGame {
 constructor(board,{outlines,doorOutlines,oilOutlines,dotOutlines,oilBounds,deathFactory,guestTicksPerSecond=60}={}){
  if(!outlines?.groups||typeof deathFactory!=='function')throw new Error('Source outlines and death lifecycle required');
  if(guestTicksPerSecond!==60)throw new Error('Only disclosed 60 guest-tick normalization is implemented');
  super(board);this.outlines=outlines;this.doorOutlines=doorOutlines;this.deathFactory=deathFactory;this.guestTicksPerSecond=guestTicksPerSecond;
  if((board.doors?.length||board.switches?.length)&&!doorOutlines?.groups)throw new Error('Door source outlines required');
  if(board.puddles?.length)this.oil=new OilRuntime(board,{outlines:oilOutlines,dotOutlines,bounds:oilBounds});
 }
 reset(){
  super.reset();this.enemies=(this.board.enemies||[]).map(h=>this.makeHand(h));
  this.spikeClock??=createSourceTimerChain(40,5);this.spikeCount??=0;this.guestTickRemainder??=0;
  this.deathClock??=createDeathClock();
  this.actorClock??=createSourceTimerChain(38,1);
  this.actorClasses??=createActorClocks(this.actorClock.advance(0).clientCount);
  const classes=this.actorClasses.snapshot().classes;
  for(const hand of [this.player,...this.enemies])hand.frameReference=classes[hand.speedClass??0].count;
  this.doorClock??=createSourceTimerChain(133,1);
  this.doorSystem??=createDoorSystem(this.board.doors||[],this.board.switches||[]);
  this.doorSystem.reset(this.doorClock.advance(0).clientCount);
  this.spikeStates=new Map((this.board.spikes||[]).map(s=>[s.id,{frame:s.phase,reference:Math.floor((this.spikeCount+s.phase)/4)}]));
  this.death=null;this.roundRestarts=0;this.elapsedTime=0;this.pendingReverse=false;
  this.oil?.reset(this.player.pivot);
 }
 makeHand(hand){return {...super.makeHand(hand),wallContacts:0,...(hand.program?{presentationPhase:0}:{})};}
 reverse(){if(!this.death&&!this.paused&&!this.complete)this.pendingReverse=true;}
 setPlayerGroup(group){
  if(![700,4300].includes(group)||!this.outlines.groups[String(group)])throw new Error('Unqualified player artwork group');
  this.player.group=group;this.board.player.group=group;
 }
 spikeFrame(spike){return this.spikeStates.get(spike.id).frame;}
 point(hand){return this.board.dots.find(d=>d.id===hand.pivot);}
 collider(hand){return worldOutline(this.outlines,hand.group,hand.program?hand.frame:sourceFrame(hand.angle),this.point(hand));}
 spikeCollision(){
  const hero=this.collider(this.player);
  for(const spike of this.board.spikes)if(outlineCollision(hero,worldOutline(this.outlines,200,this.spikeFrame(spike),spike)))
   return {reason:'spike',object:spike.id};
  return null;
 }
 enemyCollision(){
  const hero=this.collider(this.player);
  for(const enemy of this.enemies)if(enemyFrameGate(this.player.pivot,enemy.pivot,sourceFrame(this.player.angle),enemy.program?enemy.frame:sourceFrame(enemy.angle))&&outlineCollision(hero,this.collider(enemy)))
   return {reason:'enemy',object:enemy.name};
  return null;
 }
 collision(){return this.spikeCollision()||this.enemyCollision();}
 wallCollision(hand){
  if(!hand.checksWalls)return null;
  const actor=this.collider(hand);
  return (this.board.walls||[]).find(w=>outlineCollision(actor,worldOutline(this.outlines,800,w.frame,w)))||null;
 }
 programTarget(hand){
  const offset={0:[48,0],16:[0,48],32:[-48,0],48:[0,-48]}[hand.frame];
  if(!offset)return null;
  const pivot=this.point(hand),target=this.board.dots.find(d=>d.x===pivot.x+offset[0]&&d.y===pivot.y+offset[1]);
  return target?.nonhumanCanGrab?target.id:null;
 }
 animateProgramEnemy(hand,delta,timing,upstream){
  if(delta){
   const result=advanceBounceEnemy(hand,delta,{program:hand.program,findTarget:s=>this.programTarget(s),afterAnimate:s=>this.contactSwitch(s)});
   Object.assign(hand,result.state);
   for(const event of result.events)this.event(event.type,hand,{id:event.target});
  }
  // Present the fraction toward the next pose from the shared clock phase.
  // The upstream strict> client starts with one uncounted base event. Clamp
  // prediction at the next pose until the canonical callback decides a turn.
  // Render frequency and displayed angle never choose program commands.
  const basePhase=(38-upstream.remaining+16*this.guestTickRemainder)/38;
  const pending=Math.max(0,basePhase+upstream.clientRemainder-1);
  hand.presentationPhase=Math.max(0,Math.min(1,(timing.remainder+pending*timing.multiplier)/timing.divisor));
  hand.angle=(hand.unwrappedFrame+hand.direction*hand.presentationPhase)*TAU/64;
 }
 doorCollision(hand){
  if(!this.board.doors?.length)return null;
  const state=this.doorSystem.snapshot();
  const shapes=this.board.doors.map((door,i)=>({
   leaves:[state.doors[i].frame,state.doors[i].secondFrame].map(f=>worldOutline(this.doorOutlines,1300,f,door.base)),
   lethalLeaves:[state.doors[i].frame,state.doors[i].secondFrame].map(f=>worldOutline(this.doorOutlines,3800,f,door.base)),
   caps:door.caps.map(cap=>worldOutline(this.doorOutlines,2900,cap.frame,cap))
  }));
  return findDoorContact(shapes,this.collider(hand));
 }
 contactSwitch(hand){
  if(!this.board.switches?.length)return;
  const frames=this.doorSystem.snapshot().switches,actor=this.collider(hand);
  const index=this.board.switches.findIndex((s,i)=>outlineCollision(actor,worldOutline(this.doorOutlines,1000,frames[i].frame,s)));
  for(const sound of this.doorSystem.contact(hand.name,index))this.event('door-toggle',hand,{id:sound.doorIndex});
 }
 bounceFromWall(hand,wall,type='wall-bounce'){
  // The source pose is an integer frame. Center the smooth interpolation in
  // that same collision frame so a shorter next clock interval can retreat to
  // its neighbor, rather than spuriously testing the identical pose again.
  // This changes neither pivot nor current outline and adds no source step.
  hand.angle=(sourceFrame(hand.angle)+.5)*TAU/64;
  hand.direction*=-1;hand.blocked=null;if(hand===this.player)this.pendingReverse=false;
  this.event(type,hand,this.point(hand));
 }
 beginDeath(cause){
  if(this.death)return;
  this.death=this.deathFactory(this.point(this.player),this.player,this.deathClock);
  this.event('death',this.player);this.events[this.events.length-1].cause=cause;
 }
 onHumanGrab(dot){
  const deaths=this.oil?.humanGrab(dot.id)||[];
  for(const event of deaths)this.beginDeath({reason:'oil',sourceReason:event.reason,object:dot.id});
  return !this.death;
 }
 restartAfterDeath(){
  const history={steps:this.steps,activeSteps:this.activeSteps,eventSequence:this.eventSequence,
   events:this.events,roundRestarts:this.roundRestarts+1,elapsedTime:this.elapsedTime};
  this.reset();Object.assign(this,history);this.event('round-reset',this.player);
 }
 update(dt,input={}){
  if(!(dt>0&&dt<=1/60+1e-9))throw new RangeError('Round requires fixed steps no longer than one guest tick');
  if(this.paused||this.complete){this.steps++;return;}
  this.elapsedTime+=dt;
  this.guestTickRemainder+=dt*this.guestTicksPerSecond;
  const elapsed=Math.floor(this.guestTickRemainder+1e-9);this.guestTickRemainder-=elapsed;
  this.spikeCount=this.spikeClock.advance(elapsed).clientCount;
  this.deathClock.advance(elapsed);
  this.oil?.advanceClocks(elapsed);
  const doorCount=this.doorClock.advance(elapsed).clientCount;
  const actorTimer=this.actorClock.advance(elapsed),actorState=this.actorClasses.latch(actorTimer.clientCount),substeps=new Map();
  for(const hand of [this.player,...this.enemies]){
   const timer=actorState.classes[hand.speedClass??0];if(timer.count!==hand.frameReference)substeps.set(hand,timer.delta);
   hand.frameReference=timer.count;
  }
  const actorSubstep=substeps.has(this.player);
  if(!this.death)for(const spike of this.board.spikes){
   const state=this.spikeStates.get(spike.id),reference=Math.floor((this.spikeCount+spike.phase)/4);
   // SUProcessSprite advances once when the shared clock changes, including
   // a missed interval; it does not catch up by an arbitrary clock delta.
   if(reference!==state.reference){state.reference=reference;state.frame=(state.frame+1)%4;}
  }
  // Door callbacks observe one changed shared count, rather than catching up
  // every missed phase. Cross-layer source traversal phase remains approximate.
  if(!this.death)this.doorSystem.observeClock(doorCount);
  // Physical source layer11 (PU/DP) precedes enemy1, then human0. A droplet
  // arrival may latch death and freeze the remaining sprite callbacks.
  if(!this.death)this.oil?.processSprites({onDeath:reason=>this.beginDeath({reason:'oil',sourceReason:reason}),isFrozen:()=>!!this.death});
  if(!this.death)for(const enemy of this.enemies){
   if(enemy.program){this.animateProgramEnemy(enemy,substeps.get(enemy)||0,actorState.classes[enemy.speedClass??0],actorTimer);continue;}
   enemy.angle+=this.board.angularSpeed*dt*enemy.direction*(enemy.speedScale??1);
   if(substeps.has(enemy)){const wall=this.wallCollision(enemy);if(wall)this.bounceFromWall(enemy,wall);this.contactSwitch(enemy);}
  }
  // Human spike/wall tests precede input and animation. The contact guard is
  // evaluated at source-class clock changes, never on every 120Hz update.
  // Continuous poses/input remain a disclosed approximation of WA callbacks.
  if(!this.death&&actorSubstep){
   const spike=this.spikeCollision();
   if(spike)this.beginDeath(spike);
   else{
    this.oil?.contactHuman(this.collider(this.player));
    const wall=this.wallCollision(this.player),door=wall?null:this.doorCollision(this.player);
    if(door?.lethal)this.beginDeath({reason:'door',object:door.doorIndex});
    else{
     const guard=advanceWallContactGuard(this.player.wallContacts,!!wall||!!door?.guardContact);
     this.player.wallContacts=guard.count;
     if(wall)this.bounceFromWall(this.player,wall);
     else if(door?.bounce)this.bounceFromWall(this.player,door,'door-bounce');
     this.contactSwitch(this.player);
     if(guard.lethal)this.beginDeath({reason:wall?'trapped-wall':'trapped-door',object:wall?.id??door?.doorIndex});
     else if(!wall&&!door&&this.pendingReverse){this.pendingReverse=false;this.player.direction*=-1;this.event('reverse',this.player);}
    }
   }
  }
  if(this.death){
   this.steps++;this.activeSteps++;
   this.death.update(elapsed);
   if(this.death.complete)this.restartAfterDeath();
  }else{
   super.update(dt,input);if(this.complete)return;
   // Hero/enemy overlaps are a separate periodic pass after sprite processing.
   if(!this.death){const hit=this.enemyCollision();if(hit)this.beginDeath(hit);}
  }
 }
 snapshot(){return {...super.snapshot(),enemies:this.enemies.map(h=>({...h})),actorClasses:this.actorClasses.snapshot(),actorUpstream:{...this.actorClock.advance(0),guestTickRemainder:this.guestTickRemainder},doors:this.doorSystem.snapshot(),oil:this.oil?.snapshot(),roundRestarts:this.roundRestarts,elapsedTime:this.elapsedTime,pendingReverse:this.pendingReverse,
  dying:!!this.death,deathParticles:this.death?.snapshot()||[],spikeFrames:this.board.spikes.map(s=>({id:s.id,frame:this.spikeFrame(s)}))};}
}
