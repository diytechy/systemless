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
import {advanceStaticEnemyCallback,markEnemyOrphaned} from './enemy-transfer.mjs';
import {StaticDotRuntime} from './special-dot-runtime.mjs';
import {BombScene} from './bomb-scene.mjs';
import {ChildRoundScore} from './score.mjs';
import {createElevatorSystem,createUpDownState,upDownPlacement,findElevatorContact} from './elevators.mjs';

export const sourceFrame=angle=>Math.floor(angle/TAU*64+1e-9)&63;

export function worldOutline(profile,group,frame,point){
 const f=profile.groups[String(group)]?.frames[frame];
 if(!f)throw new Error(`Missing qualified source outline ${group}:${frame}`);
 if(f.collidable===false||f.outlineIndex===-1)return null;
 return {...f,left:f.left+point.x,right:f.right+point.x,top:f.top+point.y,bottom:f.bottom+point.y};
}

export class SourceRound extends MovementGame {
 constructor(board,{outlines,doorOutlines,elevatorOutlines,oilOutlines,dotOutlines,oilBounds,bombOutlines,bombRoutes,deathFactory,guestTicksPerSecond=60}={}){
  if(!outlines?.groups||typeof deathFactory!=='function')throw new Error('Source outlines and death lifecycle required');
  if(guestTicksPerSecond!==60)throw new Error('Only disclosed 60 guest-tick normalization is implemented');
  super(board);this.outlines=outlines;this.doorOutlines=doorOutlines;this.deathFactory=deathFactory;this.guestTicksPerSecond=guestTicksPerSecond;
  if(board.canonicalPlayerRules&&(!board.staticEnemyCallbacks||(board.player.speedClass??0)!==0||board.puddles?.length&&!board.canonicalOilRules||board.dots.some(d=>d.slideMask||d.motion&&d.motion!=='static'&&!(board.elevatorRules&&d.motion==='up-down'))))throw new Error('Canonical player requires static Child class0 callbacks without sliding');
  if(board.elevatorOilSpikeRules&&(!board.elevatorRules||!board.canonicalOilRules||board.canonicalOilSpikeRules||!board.puddles?.length||board.puddles.some(p=>p.kind!==3)||!board.spikes?.length))throw new Error('Separate group0 elevators, kind3 Oil and static spike scope required');
  if(board.elevatorRules&&(!board.canonicalPlayerRules||!board.staticEnemyCallbacks||!board.specialDotRules||!board.childScoreRules||board.difficulty!=='Child'||!board.elevators?.length||!elevatorOutlines?.groups?.['3400']||board.elevators.some(s=>s.group!==(board.elevatorOilSpikeRules?0:1)||s.subcell!==(board.elevatorOilSpikeRules?2:3))||board.puddles?.length&&!board.elevatorOilSpikeRules||board.bombRules||board.goodieOnlyRules||board.spikes?.length&&!board.elevatorOilSpikeRules||board.walls?.length||board.doors?.length||board.switches?.length||this.enemies.some(e=>![1,2,3].includes(e.sourceActorType)||e.speedClass!==1||e.checksWalls!==false)||!board.dots.some(d=>d.upDown)||board.dots.some(d=>d.ring||d.protected||d.waystation||d.upDown&&(d.upDown.group!==(board.elevatorOilSpikeRules?0:1)||d.upDown.initialLowered||d.color!==0||d.kind!=='dot'))))throw new Error('Qualified plain raised Child elevator composition and source outlines required');
  if(board.canonicalOilSpikeRules&&(!board.canonicalOilRules||!board.spikes?.length||board.puddles?.some(p=>p.kind!==2)||board.walls?.length||board.doors?.length||board.switches?.length||board.elevators?.length||this.enemies.some(e=>![1,2,3].includes(e.sourceActorType)||e.speedClass!==1||e.checksWalls!==false)||board.dots.some(d=>d.ring||d.protected||d.waystation||d.motion!=='static')))throw new Error('Qualified kind2 Oil, static spikes and ordinary class1 Child scope required');
  if(board.canonicalOilRules&&(!board.canonicalPlayerRules||!board.staticEnemyCallbacks||!board.specialDotRules||!board.childScoreRules||board.difficulty!=='Child'||!board.puddles?.length||board.bombRules||board.goodieOnlyRules||board.spikes?.length&&!board.canonicalOilSpikeRules&&!board.elevatorOilSpikeRules||board.doors?.length||board.switches?.length||this.enemies.some(e=>!([1,2,3].includes(e.sourceActorType)&&[1,3].includes(e.speedClass)&&e.checksWalls===false||board.staticEnemyWallRules&&e.sourceActorType===1&&e.speedClass===4&&e.program===null))||board.dots.some(d=>d.ring||d.protected||d.waystation&&d.color!==0)))throw new Error('Canonical Oil requires the qualified static Child ordinary-actor scope');
  if(board.goodieOnlyRules&&!board.specialDotRules)throw new Error('Goodie-only source timer state required');
  if(board.combinedGoalBonusRules&&!board.childScoreRules)throw new Error('Combined goal bonus requires Child score qualification');
  if(board.staticEnemyCallbacks&&!board.staticEnemyWallRules&&this.enemies.some(e=>e.checksWalls))throw new Error('Canonical enemy wall response requires qualification');
  if(this.enemies.some(e=>e.sourceActorType===4)&&(!board.rotatingSpikeRules||!board.staticEnemyCallbacks||!outlines.groups['3500']))throw new Error('Rotating spike rules, canonical clock and source outlines require qualification');
  if((board.doors?.length||board.switches?.length)&&!doorOutlines?.groups)throw new Error('Door source outlines required');
  if(board.puddles?.length)this.oil=new OilRuntime(board,{outlines:oilOutlines,dotOutlines,bounds:oilBounds});
  if(board.elevatorRules){
   this.elevatorOutlines=elevatorOutlines;
   this.elevators=createElevatorSystem(board.elevators,board.dots.filter(d=>d.upDown).map(d=>({id:d.id,...d.upDown})),{origin:board.origin,clockCount:this.actorClasses.snapshot().classes[1].count,surfaceCount:this.elevatorSurfaceClock.advance(0).clientCount});
   this.syncElevatorDots();
  }
  if(board.specialDotRules){
   this.dotAnimations=new StaticDotRuntime(board.dots,board.player,{originalTime:board.timeLimit,dotCount:this.dotClock.advance(0).clientCount,overlayCount:this.protectionClock.advance(0).clientCount});
   this.remainingTime=board.timeLimit;this.onHumanGrab(this.point(this.player));
  }
  if(board.bombRules||board.goodieOnlyRules)this.bombScene=new BombScene(this,{outlines:bombOutlines,routes:bombRoutes,worldOutline});
 }
 reset({preserveCheckpoint=false}={}){
  super.reset();this.enemies=(this.board.enemies||[]).map(h=>this.makeHand(h));
  if(this.board.childScoreRules){
   if(!this.childScore)this.childScore=new ChildRoundScore();
   else if(preserveCheckpoint)this.childScore.startRound();
   else this.childScore.resetGame();
  }
  this.spikeClock??=createSourceTimerChain(40,5);this.spikeCount??=0;this.guestTickRemainder??=0;
  this.deathClock??=createDeathClock();
  this.actorClock??=createSourceTimerChain(38,1);
  this.actorClasses??=createActorClocks(this.actorClock.advance(0).clientCount);
  if(this.board.elevatorRules)this.elevatorSurfaceClock??=createSourceTimerChain(160,1);
  const classes=this.actorClasses.snapshot().classes;
  for(const hand of [this.player,...this.enemies])hand.frameReference=classes[hand.speedClass??0].count;
  this.doorClock??=createSourceTimerChain(133,1);
  this.doorSystem??=createDoorSystem(this.board.doors||[],this.board.switches||[]);
  this.doorSystem.reset(this.doorClock.advance(0).clientCount);
  this.spikeStates=new Map((this.board.spikes||[]).map(s=>[s.id,{frame:s.phase,reference:Math.floor((this.spikeCount+s.phase)/4)}]));
  this.death=null;this.roundRestarts=0;this.elapsedTime=0;this.pendingReverse=false;

  this.bombScene?.reset({restartLevel:!preserveCheckpoint});
  this.guestTicks??=0;
  if(this.board.specialDotRules){
   this.dotClock??=createSourceTimerChain(40,2);this.protectionClock??=createSourceTimerChain(50,1);
   if(this.dotAnimations){
    const reset=this.dotAnimations.reset({restartLevel:!preserveCheckpoint,dotCount:this.dotClock.advance(0).clientCount,overlayCount:this.protectionClock.advance(0).clientCount});
    for(const key of ['pivot','angle','direction'])this.player[key]=reset.player[key];
    this.remainingTime=reset.remainingTime;
   }
  }
  // PU/DP follows the restored WY spawn, rather than the original level start.
  if(this.board.elevatorRules){this.elevators?.reset(this.actorClasses.snapshot().classes[1].count,this.elevatorSurfaceClock.advance(0).clientCount);this.syncElevatorDots();}
  this.oil?.reset(this.player.pivot);
  if(this.dotAnimations)this.onHumanGrab(this.point(this.player));
  if(this.board.canonicalPlayerRules){this.canonicalPlayerContact=false;this.player.frame=sourceFrame(this.player.angle);this.player.unwrappedFrame=this.player.frame;}
 }
 makeHand(hand){
  const result={...super.makeHand(hand),wallContacts:0,...(hand.program||hand.canonicalFrame?{presentationPhase:0}:{})};
  if(this.board.canonicalPlayerRules&&[0,6].includes(hand.sourceActorType))Object.assign(result,{canonicalFrame:true,frame:sourceFrame(result.angle),unwrappedFrame:sourceFrame(result.angle),presentationPhase:0});
  return result;
 }
 move(hand,dt,action){
  if(hand!==this.player||!this.board.canonicalPlayerRules)return super.move(hand,dt,action);
  const delta=this.actorClasses.snapshot().classes[hand.speedClass??0].delta;
  if(delta>1)throw new Error('Canonical player requires at most one Child callback per fixed update');
  if(!delta)return;
  hand.angle=hand.unwrappedFrame*TAU/64;
  if(hand.frame%16!==0)hand.blocked=null;
  const sequence=this.eventSequence;
  // WADirectHero only tests the current cardinal frame, then consumes Reverse.
  // A zero-duration direction request separates the grab from WA animation.
  super.move(hand,0,hand.frame%16===0?action:null);
  if(this.pendingReverse){
   this.pendingReverse=false;
   if(!this.canonicalPlayerContact&&this.eventSequence===sequence&&!this.death){hand.direction*=-1;this.event('reverse',hand);}
  }
  hand.unwrappedFrame=Math.round(hand.angle*64/TAU);
  if(!this.complete&&!this.death)hand.unwrappedFrame+=hand.direction;
  hand.frame=hand.unwrappedFrame&63;
  hand.angle=hand.unwrappedFrame*TAU/64;
 }
 reverse(){if(!this.death&&!this.paused&&!this.complete)this.pendingReverse=true;}
 setPlayerGroup(group){
  if(![700,4300].includes(group)||!this.outlines.groups[String(group)])throw new Error('Unqualified player artwork group');
  this.player.group=group;this.board.player.group=group;
 }
 spikeFrame(spike){return this.spikeStates.get(spike.id).frame;}
 advanceSpikes(){
  for(const spike of this.board.spikes){
   const state=this.spikeStates.get(spike.id),reference=Math.floor((this.spikeCount+spike.phase)/4);
   if(reference!==state.reference){state.reference=reference;state.frame=(state.frame+1)%4;}
  }
 }
 point(hand){return this.board.dots.find(d=>d.id===hand.pivot);}
 collider(hand){return hand.visible===false?null:worldOutline(this.outlines,hand.group,hand.program||hand.canonicalFrame?hand.frame:sourceFrame(hand.angle),this.point(hand));}
 spikeCollision(){
  const hero=this.collider(this.player);
  for(const spike of this.board.spikes)if(spike.visible!==false&&outlineCollision(hero,worldOutline(this.outlines,200,this.spikeFrame(spike),spike)))
   return {reason:'spike',object:spike.id};
  return null;
 }
 enemyCollision(){
  const hero=this.collider(this.player);
  for(const enemy of this.enemies)if(!(this.point(this.player).protected&&[1,2,3].includes(enemy.sourceActorType))&&enemyFrameGate(this.player.pivot,enemy.pivot,this.player.canonicalFrame?this.player.frame:sourceFrame(this.player.angle),enemy.program||enemy.canonicalFrame?enemy.frame:sourceFrame(enemy.angle))&&outlineCollision(hero,this.collider(enemy)))
   return {reason:'enemy',object:enemy.name,...(enemy.sourceActorType===4?{sourceReason:0}:{})};
  return null;
 }
 collision(){return this.spikeCollision()||this.enemyCollision();}
 wallCollision(hand){
  if(!hand.checksWalls)return null;
  const actor=this.collider(hand);
  return (this.board.walls||[]).find(w=>w.visible!==false&&outlineCollision(actor,worldOutline(this.outlines,800,w.frame,w)))||null;
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
  this.presentCanonicalEnemy(hand,timing,upstream);
 }
 animateStaticEnemy(hand,delta,timing,upstream,dispatched){
  if(dispatched){
   const previousVisible=hand.visible,result=advanceStaticEnemyCallback(hand,delta,{program:hand.program,dots:this.board.dots,guestTick:this.guestTicks,adjustPeriod:n=>Math.floor(n*100/60),allowRotatingSpikes:this.board.rotatingSpikeRules===true,allowFastRotatingSpikes:this.board.fastRotatingSpikeRules===true,allowSlowRotatingSpikes:this.board.slowRotatingSpikeRules===true,allowRotatingSpikeTransfers:this.board.rotatingSpikeTransferRules===true,allowRotatingSpikeBounces:this.board.rotatingSpikeBounceRules===true,allowUpDownDots:this.board.elevatorRules===true,
    afterAnimate:s=>{
     const wall=this.board.staticEnemyWallRules?this.wallCollision(s):null;
     if(wall){s.direction*=-1;this.event('enemy-wall-bounce',s,this.point(s));}
     this.contactSwitch(s);
     this.contactElevators(s);
    },onDotRelease:()=>{},onDotGrabFirst:()=>{},afterDotGrab:()=>{}});
   Object.assign(hand,result.state);
   if(previousVisible!==hand.visible)this.contactSwitch(hand);
   for(const event of result.events)if(event.type==='program-transfer'||event.type==='orphan-expired')this.event(event.type,hand,{id:hand.pivot});
  }
  this.presentCanonicalEnemy(hand,timing,upstream);
 }
 presentCanonicalEnemy(hand,timing,upstream){
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
  if(hand.sourceActorType===4)return;
  if(!this.board.switches?.length)return;
  const frames=this.doorSystem.snapshot().switches,actor=this.collider(hand);
  const index=this.board.switches.findIndex((s,i)=>s.visible!==false&&outlineCollision(actor,worldOutline(this.doorOutlines,1000,frames[i].frame,s)));
  for(const sound of this.doorSystem.contact(hand.name,index))this.event('door-toggle',hand,{id:sound.doorIndex});
 }
 syncElevatorDots(){
  const states=this.elevators?.snapshot().dots;
  for(const dot of this.board.dots)if(dot.upDown){
   const state=states?.find(d=>d.id===dot.id)??createUpDownState(dot.upDown);
   Object.assign(dot,upDownPlacement(state,dot.upDown));
  }
 }
 contactElevators(hand){
  if(!this.elevators)return;
  const index=hand.visible===false?-1:findElevatorContact(this.collider(hand),this.elevators.snapshot().controls,this.elevatorOutlines);
  for(const change of this.elevators.contact(hand.name,index)){
   const event=this.event('elevator-'+change.type,hand,{id:change.dot??change.index});Object.assign(event,change,{type:'elevator-'+change.type});
  }
 }
 bounceFromWall(hand,wall,type='wall-bounce'){
  // The source pose is an integer frame. Center the smooth interpolation in
  // that same collision frame so a shorter next clock interval can retreat to
  // its neighbor, rather than spuriously testing the identical pose again.
  // This changes neither pivot nor current outline and adds no source step.
  if(!this.board.canonicalPlayerRules||hand!==this.player)hand.angle=(sourceFrame(hand.angle)+.5)*TAU/64;
  hand.direction*=-1;hand.blocked=null;if(hand===this.player&&!this.board.canonicalPlayerRules)this.pendingReverse=false;
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
  if(this.death)return false;
  if(this.dotAnimations){
   const result=this.dotAnimations.humanGrab(dot.id,this.remainingTime);
   if(result.checkpointChanged)this.event('checkpoint',this.player,dot);
  }
  return true;
 }
 onHumanRelease(dot,hand){
  this.dotAnimations?.humanRelease(dot.id,{releasingActor:hand.name,orphanOccupants:id=>{
   for(const enemy of this.enemies)if(enemy.pivot===id)markEnemyOrphaned(enemy,{guestTick:this.guestTicks,adjustPeriod:n=>Math.floor(n*100/60)});
  }});
 }
 onBonus(){return this.childScore?.bonusDot();}
 onGoalBonus(){return this.childScore.bonusDotAfterGoal();}
 onGoal(){this.childScore?.complete();this.bombScene?.finish();}
 restartAfterDeath(){
  const history={steps:this.steps,activeSteps:this.activeSteps,eventSequence:this.eventSequence,
   events:this.events,roundRestarts:this.roundRestarts+1,elapsedTime:this.elapsedTime};
  this.reset({preserveCheckpoint:true});Object.assign(this,history);this.event('round-reset',this.player);
 }
 update(dt,input={}){
  if(!(dt>0&&dt<=1/60+1e-9))throw new RangeError('Round requires fixed steps no longer than one guest tick');
  if(this.paused||this.complete){this.steps++;return;}
  if(input.reverse&&!this.reverseHeld)this.reverse();this.reverseHeld=!!input.reverse;
  this.elapsedTime+=dt;
  this.guestTickRemainder+=dt*this.guestTicksPerSecond;
  const elapsed=Math.floor(this.guestTickRemainder+1e-9);this.guestTickRemainder-=elapsed;
  this.guestTicks+=elapsed;
  this.spikeCount=this.spikeClock.advance(elapsed).clientCount;
  this.deathClock.advance(elapsed);
  this.oil?.advanceClocks(elapsed);
  this.bombScene?.advanceClocks(elapsed);
  const doorCount=this.doorClock.advance(elapsed).clientCount;
  const actorTimer=this.actorClock.advance(elapsed),actorState=this.actorClasses.latch(actorTimer.clientCount),substeps=new Map();
  const elevatorSurfaceCount=this.elevatorSurfaceClock?.advance(elapsed).clientCount;
  for(const hand of [this.player,...this.enemies]){
   const timer=actorState.classes[hand.speedClass??0];if(timer.count!==hand.frameReference)substeps.set(hand,timer.delta);
   hand.frameReference=timer.count;
  }
  const actorSubstep=substeps.has(this.player);
  const dotCount=this.dotClock?.advance(elapsed).clientCount,overlayCount=this.protectionClock?.advance(elapsed).clientCount;
  if(this.dotAnimations&&!this.death)this.dotAnimations.observeClocks({dotCount,overlayCount,guestTick:this.guestTicks});
  if(!this.death)this.elevators?.observeClock(actorState.classes[1].count,{
   onPhase:()=>this.syncElevatorDots(),
   onLowered:id=>{
    if(this.player.pivot===id)this.beginDeath({reason:'lowered-dot',sourceReason:38,object:id});
    for(const enemy of this.enemies)if(enemy.pivot===id)markEnemyOrphaned(enemy,{guestTick:this.guestTicks,adjustPeriod:n=>Math.floor(n*100/60)});
   },isFrozen:()=>!!this.death
  });
  if(!this.death)this.elevators?.observeSurfaceClock(elevatorSurfaceCount);
  // Existing scenes retain their qualified phase. BO scenes place layer2
  // after the upper fuse/GO/Oil layers, before appended explosion callbacks.
  if(!this.death&&!this.bombScene)this.advanceSpikes();
  // Door callbacks observe one changed shared count, rather than catching up
  // every missed phase. Cross-layer source traversal phase remains approximate.
  if(!this.death)this.doorSystem.observeClock(doorCount);
  this.bombScene?.processUpper();
  // Physical source layer11 (PU/DP) precedes enemy1, then human0. A droplet
  // arrival may latch death and freeze the remaining sprite callbacks.
  if(!this.death)this.oil?.processSprites({onDeath:reason=>this.beginDeath({reason:'oil',sourceReason:reason}),isFrozen:()=>!!this.death});
  if(!this.death&&this.bombScene)this.advanceSpikes();
  this.bombScene?.processExplosions();
  if(!this.death)for(const enemy of this.enemies){
   if(enemy.sourceActorType!==4)this.bombScene?.runtime.checkMatch(enemy);
   if(this.board.staticEnemyCallbacks){this.animateStaticEnemy(enemy,substeps.get(enemy)||0,actorState.classes[enemy.speedClass??0],actorTimer,substeps.has(enemy));continue;}
   if(enemy.program){this.animateProgramEnemy(enemy,substeps.get(enemy)||0,actorState.classes[enemy.speedClass??0],actorTimer);continue;}
   enemy.angle+=this.board.angularSpeed*dt*enemy.direction*(enemy.speedScale??1);
   if(substeps.has(enemy)){const wall=this.wallCollision(enemy);if(wall)this.bounceFromWall(enemy,wall);this.contactSwitch(enemy);}
  }
  // Human spike/wall tests precede input and animation. The contact guard is
  // evaluated at source-class clock changes, never on every 120Hz update.
  // Earlier scenes retain continuous human timing; opted-in scenes use the
  // same canonical callbacks and independent presentation as static enemies.
  if(!this.death&&actorSubstep){
   if(this.board.canonicalPlayerRules)this.player.angle=this.player.unwrappedFrame*TAU/64;
   const spike=this.spikeCollision();
   if(spike)this.beginDeath(spike);
   this.bombScene?.runtime.checkGoodie(this.player);
   if(!spike||this.bombScene){
    this.oil?.contactHuman(this.collider(this.player));
    this.bombScene?.runtime.checkMatch(this.player);
    this.bombScene?.runtime.checkSpark(this.player);
    const wall=this.wallCollision(this.player),door=wall?null:this.doorCollision(this.player);
    if(this.board.canonicalPlayerRules)this.canonicalPlayerContact=!!wall||!!door?.guardContact;
    if(door?.lethal)this.beginDeath({reason:'door',object:door.doorIndex});
    else{
     const guard=advanceWallContactGuard(this.player.wallContacts,!!wall||!!door?.guardContact);
     this.player.wallContacts=guard.count;
     if(wall)this.bounceFromWall(this.player,wall);
     else if(door?.bounce)this.bounceFromWall(this.player,door,'door-bounce');
     this.contactSwitch(this.player);
     this.contactElevators(this.player);
     if(guard.lethal)this.beginDeath({reason:wall?'trapped-wall':'trapped-door',object:wall?.id??door?.doorIndex});
     else if(!this.board.canonicalPlayerRules&&!wall&&!door&&this.pendingReverse){this.pendingReverse=false;this.player.direction*=-1;this.event('reverse',this.player);}
    }
   }
  }
  this.bombScene?.processEffects();
  if(this.death){
   this.steps++;this.activeSteps++;
   this.death.update(elapsed);
   if(this.death.complete)this.restartAfterDeath();
  }else{
   super.update(dt,input);if(this.complete)return;
   // Hero/enemy overlaps are a separate periodic pass after sprite processing.
   if(!this.death){const hit=this.enemyCollision();if(hit)this.beginDeath(hit);}
   if(this.board.canonicalPlayerRules&&!this.death)this.presentCanonicalEnemy(this.player,actorState.classes[this.player.speedClass??0],actorTimer);
  }
 }
  snapshot(){return {...super.snapshot(),...(this.elevators?{elevators:this.elevators.snapshot()}:{}),enemies:this.enemies.map(h=>({...h})),actorClasses:this.actorClasses.snapshot(),actorUpstream:{...this.actorClock.advance(0),guestTickRemainder:this.guestTickRemainder},doors:this.doorSystem.snapshot(),oil:this.oil?.snapshot(),bombs:this.bombScene?.snapshot(),childScore:this.childScore?.snapshot(),specialDots:this.dotAnimations?.snapshot(),roundTimer:this.dotAnimations?{enabled:false,original:this.board.timeLimit,current:this.remainingTime,saved:this.dotAnimations.savedTime}:undefined,guestTicks:this.guestTicks,roundRestarts:this.roundRestarts,elapsedTime:this.elapsedTime,pendingReverse:this.pendingReverse,
  dying:!!this.death,deathParticles:this.death?.snapshot()||[],spikeFrames:this.board.spikes.map(s=>({id:s.id,frame:this.spikeFrame(s)}))};}
}
