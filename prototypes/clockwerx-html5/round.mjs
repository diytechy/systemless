// First hazard-bearing round adapter. Source outlines remain private. Rendering
// may interpolate SVG poses; collisions use the original 64-angle pixel lattice.
import {MovementGame,TAU} from './engine.mjs';
import {outlineCollision,enemyFrameGate,createSourceTimerChain} from './hazards.mjs';
import {createDeathClock} from './death.mjs';
import {advanceWallContactGuard} from './walls.mjs';

export const sourceFrame=angle=>Math.floor(angle/TAU*64+1e-9)&63;

export function worldOutline(profile,group,frame,point){
 const f=profile.groups[String(group)]?.frames[frame];
 if(!f)throw new Error(`Missing qualified source outline ${group}:${frame}`);
 if(f.collidable===false)return null;
 return {...f,left:f.left+point.x,right:f.right+point.x,top:f.top+point.y,bottom:f.bottom+point.y};
}

export class SourceRound extends MovementGame {
 constructor(board,{outlines,deathFactory,guestTicksPerSecond=60}={}){
  if(!outlines?.groups||typeof deathFactory!=='function')throw new Error('Source outlines and death lifecycle required');
  if(guestTicksPerSecond!==60)throw new Error('Only disclosed 60 guest-tick normalization is implemented');
  super(board);this.outlines=outlines;this.deathFactory=deathFactory;this.guestTicksPerSecond=guestTicksPerSecond;
 }
 reset(){
  super.reset();this.enemies=(this.board.enemies||[]).map(h=>this.makeHand(h));
  this.spikeClock??=createSourceTimerChain(40,5);this.spikeCount??=0;this.guestTickRemainder??=0;
  this.deathClock??=createDeathClock();
  this.actorClock??=createSourceTimerChain(38,1);
  this.actorFrameReference=Math.floor(this.actorClock.advance(0).clientCount/2);
  this.spikeStates=new Map((this.board.spikes||[]).map(s=>[s.id,{frame:s.phase,reference:Math.floor((this.spikeCount+s.phase)/4)}]));
  this.death=null;this.roundRestarts=0;this.elapsedTime=0;this.pendingReverse=false;
 }
 makeHand(hand){return {...super.makeHand(hand),wallContacts:0};}
 reverse(){if(!this.death&&!this.paused&&!this.complete)this.pendingReverse=true;}
 setPlayerGroup(group){
  if(![700,4300].includes(group)||!this.outlines.groups[String(group)])throw new Error('Unqualified player artwork group');
  this.player.group=group;this.board.player.group=group;
 }
 spikeFrame(spike){return this.spikeStates.get(spike.id).frame;}
 point(hand){return this.board.dots.find(d=>d.id===hand.pivot);}
 collider(hand){return worldOutline(this.outlines,hand.group,sourceFrame(hand.angle),this.point(hand));}
 spikeCollision(){
  const hero=this.collider(this.player);
  for(const spike of this.board.spikes)if(outlineCollision(hero,worldOutline(this.outlines,200,this.spikeFrame(spike),spike)))
   return {reason:'spike',object:spike.id};
  return null;
 }
 enemyCollision(){
  const hero=this.collider(this.player);
  for(const enemy of this.enemies)if(enemyFrameGate(this.player.pivot,enemy.pivot,sourceFrame(this.player.angle),sourceFrame(enemy.angle))&&outlineCollision(hero,this.collider(enemy)))
   return {reason:'enemy',object:enemy.name};
  return null;
 }
 collision(){return this.spikeCollision()||this.enemyCollision();}
 wallCollision(hand){
  if(!hand.checksWalls)return null;
  const actor=this.collider(hand);
  return (this.board.walls||[]).find(w=>outlineCollision(actor,worldOutline(this.outlines,800,w.frame,w)))||null;
 }
 bounceFromWall(hand,wall){
  // The source pose is an integer frame. Center the smooth interpolation in
  // that same collision frame so a shorter next clock interval can retreat to
  // its neighbor, rather than spuriously testing the identical pose again.
  // This changes neither pivot nor current outline and adds no source step.
  hand.angle=(sourceFrame(hand.angle)+.5)*TAU/64;
  hand.direction*=-1;hand.blocked=null;if(hand===this.player)this.pendingReverse=false;
  this.event('wall-bounce',hand,this.point(hand));
 }
 beginDeath(cause){
  this.death=this.deathFactory(this.point(this.player),this.player,this.deathClock);
  this.event('death',this.player);this.events[this.events.length-1].cause=cause;
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
  const actorFrame=Math.floor(this.actorClock.advance(elapsed).clientCount/2);
  const actorSubstep=actorFrame!==this.actorFrameReference;this.actorFrameReference=actorFrame;
  if(!this.death)for(const spike of this.board.spikes){
   const state=this.spikeStates.get(spike.id),reference=Math.floor((this.spikeCount+spike.phase)/4);
   // SUProcessSprite advances once when the shared clock changes, including
   // a missed interval; it does not catch up by an arbitrary clock delta.
   if(reference!==state.reference){state.reference=reference;state.frame=(state.frame+1)%4;}
  }
  // Human spike/wall tests precede input and animation. The contact guard is
  // evaluated at source-class clock changes, never on every 120Hz update.
  // Continuous poses/input remain a disclosed approximation of WA callbacks.
  if(!this.death&&actorSubstep){
   const spike=this.spikeCollision();
   if(spike)this.beginDeath(spike);
   else{
    const wall=this.wallCollision(this.player),guard=advanceWallContactGuard(this.player.wallContacts,!!wall);
    this.player.wallContacts=guard.count;
    if(wall)this.bounceFromWall(this.player,wall);
    if(guard.lethal)this.beginDeath({reason:'trapped-wall',object:wall.id});
    else if(!wall&&this.pendingReverse){this.pendingReverse=false;this.player.direction*=-1;this.event('reverse',this.player);}
   }
  }
  if(this.death){
   this.steps++;this.activeSteps++;
   this.death.update(elapsed);
   if(this.death.complete)this.restartAfterDeath();
  }else{
   super.update(dt,input);if(this.complete)return;
   for(const enemy of this.enemies){
    enemy.angle+=this.board.angularSpeed*dt*enemy.direction;
    if(actorSubstep){const wall=this.wallCollision(enemy);if(wall)this.bounceFromWall(enemy,wall);}
   }
   // Hero/enemy overlaps are a separate periodic pass after sprite processing.
   const hit=this.enemyCollision();if(hit)this.beginDeath(hit);
  }
 }
 snapshot(){return {...super.snapshot(),enemies:this.enemies.map(h=>({...h})),roundRestarts:this.roundRestarts,elapsedTime:this.elapsedTime,pendingReverse:this.pendingReverse,
  dying:!!this.death,deathParticles:this.death?.snapshot()||[],spikeFrames:this.board.spikes.map(s=>({id:s.id,frame:this.spikeFrame(s)}))};}
}
