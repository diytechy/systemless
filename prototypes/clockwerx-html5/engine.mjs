// ClockWerx Movement mechanics reconstructed from original embedded controls text.
// No image-derived collision: dots and hand radius are logical coordinates.
export const TAU=Math.PI*2;
export function angleDelta(a,b){return ((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;}
export class MovementGame {
  constructor(board){this.board=board;this.reset();}
  reset(){this.time=0;this.paused=false;this.complete=false;this.events=[];this.steps=0;this.activeSteps=0;this.eventSequence=0;this.reverseHeld=false;for(const d of this.board.dots)delete d.collected;this.player=this.makeHand(this.board.player);this.demos=this.board.demos.map(x=>this.makeHand(x));}
  makeHand(h){return {...h,angle:h.angle||0,direction:h.direction||1,blocked:null,transfers:0};}
  event(type,hand,dot){const e={sequence:++this.eventSequence,type,time:this.time,hand:hand.name,dot:dot?.id};this.events.push(e);if(this.events.length>100)this.events.shift();return e;}
  reverse(){if(!this.paused&&!this.complete){this.player.direction*=-1;this.event('reverse',this.player);}}
  update(dt,input={}){
    this.steps++;if(this.paused||this.complete)return;this.activeSteps++;this.time+=dt;
    if(input.reverse&&!this.reverseHeld)this.reverse();this.reverseHeld=!!input.reverse;
    this.move(this.player,dt,input.flip?'flip':input.swing&&input.bounce?'flip':input.swing?'swing':input.bounce?'bounce':null);
    for(const h of this.demos)this.move(h,dt,h.action);
  }
  move(h,dt,action){
    const pivot=this.board.dots.find(d=>d.id===h.pivot),radius=this.board.radius;
    const advance=this.board.angularSpeed*dt*h.direction*(h.speedScale??1),old=h.angle,next=old+advance;
    if(h.blocked!==null&&Math.abs(angleDelta(next,h.blocked))>0.22)h.blocked=null;
    let target=null,nearest=Infinity;
    if(action)for(const d of this.board.dots){
      if(d.id===pivot.id)continue;
      // Movement's per-dot actor nibbles are inferred from original resource
      // flags and the observed red/green demonstration extents. Bouncing does
      // not grab a dot, so it can reflect from a non-grabbable neighbor.
      if(this.board.sourceDotPermissions){if(h===this.player?d.humanCanGrab===false:d.nonhumanCanGrab===false)continue;}
      else if(action!=='bounce'&&h.grabMask&&d.flags!==undefined&&!(d.flags&h.grabMask))continue;
      if(Math.abs(Math.hypot(d.x-pivot.x,d.y-pivot.y)-radius)>this.board.distanceTolerance)continue;
      const a=Math.atan2(d.y-pivot.y,d.x-pivot.x),dist=angleDelta(a,old)*h.direction;
      if(dist>=-0.00001&&dist<=Math.abs(advance)+0.00001&&h.blocked===null&&dist<nearest){target=d;nearest=dist;}
    }
    h.angle=next;
    if(!target)return;
    const hit=Math.atan2(target.y-pivot.y,target.x-pivot.x),remaining=Math.abs(advance)-nearest;
    if(action==='bounce'){
      h.direction*=-1;h.angle=hit+remaining*h.direction;h.blocked=hit;this.event('bounce',h,target);return;
    }
    if(action==='swing')h.direction*=-1;
    if(h===this.player)this.onHumanRelease?.(pivot,h);
    h.pivot=target.id;h.transfers++;
    h.angle=hit+Math.PI+remaining*h.direction;h.blocked=hit+Math.PI;this.event(action,h,target);
    if(h===this.player){
      // DOGrabbed checks the latched death from DPWandGrabbed before bonus or
      // goal effects. Ordinary Movement has no additional grab observer.
      if(this.onHumanGrab?.(target)===false)return;
      if(this.board.combinedGoalBonusRules&&target.kind==='goal'&&target.bonus){
        // Source DOGrabbed latches ROWon before the same grab's bonus hook.
        // This opt-in keeps ordinary Movement and earlier scene paths intact.
        this.onGoal?.(target);this.complete=true;this.event('goal',h,target);
        if(!target.collected){target.collected=true;const points=this.onGoalBonus?.(target),event=this.event('bonus',h,target);if(points!==undefined)event.points=points;}
        return;
      }
      if(target.kind==='bonus'&&!target.collected){target.collected=true;const points=this.onBonus?.(target),event=this.event('bonus',h,target);if(points!==undefined)event.points=points;}
      if(target.kind==='goal'){this.onGoal?.(target);this.complete=true;this.event('goal',h,target);}
    }
  }
  snapshot(){return {time:this.time,steps:this.steps,activeSteps:this.activeSteps,paused:this.paused,complete:this.complete,player:{...this.player},demos:this.demos.map(h=>({...h})),events:[...this.events]};}
}
