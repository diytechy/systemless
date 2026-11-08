// First hazard-bearing round adapter. Source outlines remain private. Rendering
// may interpolate SVG poses; collisions use the original 64-angle pixel lattice.
import {MovementGame,TAU} from './engine.mjs';
import {outlineCollision,enemyFrameGate,createSourceTimerChain} from './hazards.mjs';
import {createDeathClock} from './death.mjs';

export const sourceFrame=angle=>Math.floor(angle/TAU*64+1e-9)&63;

export function worldOutline(profile,group,frame,point){
 const f=profile.groups[String(group)]?.frames[frame];
 if(!f)throw new Error(`Missing qualified source outline ${group}:${frame}`);
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
  this.spikeStates=new Map((this.board.spikes||[]).map(s=>[s.id,{frame:s.phase,reference:Math.floor((this.spikeCount+s.phase)/4)}]));
  this.death=null;this.roundRestarts=0;this.elapsedTime=0;
 }
 reverse(){if(!this.death)super.reverse();}
 setPlayerGroup(group){
  if(![700,4300].includes(group)||!this.outlines.groups[String(group)])throw new Error('Unqualified player artwork group');
  this.player.group=group;this.board.player.group=group;
 }
 spikeFrame(spike){return this.spikeStates.get(spike.id).frame;}
 point(hand){return this.board.dots.find(d=>d.id===hand.pivot);}
 collider(hand){return worldOutline(this.outlines,hand.group,sourceFrame(hand.angle),this.point(hand));}
 collision(){
  const hero=this.collider(this.player);
  for(const spike of this.board.spikes)if(outlineCollision(hero,worldOutline(this.outlines,200,this.spikeFrame(spike),spike)))
   return {reason:'spike',object:spike.id};
  for(const enemy of this.enemies)if(enemyFrameGate(this.player.pivot,enemy.pivot,sourceFrame(this.player.angle),sourceFrame(enemy.angle))&&outlineCollision(hero,this.collider(enemy)))
   return {reason:'enemy',object:enemy.name};
  return null;
 }
 restartAfterDeath(){
  const history={steps:this.steps,activeSteps:this.activeSteps,eventSequence:this.eventSequence,
   events:this.events,roundRestarts:this.roundRestarts+1,elapsedTime:this.elapsedTime};
  this.reset();Object.assign(this,history);this.event('round-reset',this.player);
 }
 update(dt,input={}){
  if(this.paused||this.complete){this.steps++;return;}
  this.elapsedTime+=dt;
  if(this.death){this.steps++;this.activeSteps++;}
  else super.update(dt,input);
  if(this.complete)return;
  if(!this.death)for(const enemy of this.enemies)enemy.angle+=this.board.angularSpeed*dt*enemy.direction;
  this.guestTickRemainder+=dt*this.guestTicksPerSecond;
  const elapsed=Math.floor(this.guestTickRemainder+1e-9);this.guestTickRemainder-=elapsed;
  this.spikeCount=this.spikeClock.advance(elapsed).clientCount;
  this.deathClock.advance(elapsed);
  if(!this.death)for(const spike of this.board.spikes){
   const state=this.spikeStates.get(spike.id),reference=Math.floor((this.spikeCount+spike.phase)/4);
   // SUProcessSprite advances once when the shared clock changes, including
   // a missed interval; it does not catch up by an arbitrary clock delta.
   if(reference!==state.reference){state.reference=reference;state.frame=(state.frame+1)%4;}
  }
  if(this.death){
   this.death.update(elapsed);
   if(this.death.complete)this.restartAfterDeath();
  }else{
   const hit=this.collision();
   if(hit){this.death=this.deathFactory(this.point(this.player),this.player,this.deathClock);this.event('death',this.player);this.events[this.events.length-1].cause=hit;}
  }
 }
 snapshot(){return {...super.snapshot(),enemies:this.enemies.map(h=>({...h})),roundRestarts:this.roundRestarts,elapsedTime:this.elapsedTime,
  dying:!!this.death,deathParticles:this.death?.snapshot()||[],spikeFrames:this.board.spikes.map(s=>({id:s.id,frame:this.spikeFrame(s)}))};}
}
