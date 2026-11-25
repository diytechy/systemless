import {RoundScore} from './score.mjs';
import {createDeathEffect,createDeathClock} from './death.mjs';

// ClockWerx Movement mechanics reconstructed from original embedded controls text.
// No image-derived collision: dots and hand radius are logical coordinates.
export const TAU=Math.PI*2;
export function angleDelta(a,b){return ((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;}
export function secondPlayerSpawn(player,source){
  const angle=((player.angle??0)+Math.PI/2)%TAU;
  const frame=((player.initialFrame??player.frame??Math.round((player.angle??0)*64/TAU))+16)&63;
  return {...(source??{...player,angle,frame,unwrappedFrame:frame}),
    initialFrame:source?(source.initialFrame??source.frame):frame,
    name:'player2',sourceSlot:1,sourceActorType:6,group:player.group===4300?700:4300};
}
export const humanAction=input=>input.flip||input.swing&&input.bounce?'flip':input.swing?'swing':input.bounce?'bounce':null;

export class MovementGame {
  constructor(board,{players=board.players??1}={}){
    if(![1,2].includes(players))throw new RangeError('Expected one or two players');
    this.board=board;this.players=players;
    this.player2Spawn=players===2?secondPlayerSpawn(board.player,board.player2):null;
    this.reset();
  }
  get twoPlayer(){return this.players===2;}
  get humans(){return this.player2?[this.player,this.player2]:[this.player];}
  get death2(){return this.playerStates?.[1].death??null;}
  get player1Won(){return this.twoPlayer?this.playerStates[0].won:this.complete;}
  get player2Won(){return this.playerStates?.[1].won??false;}
  get player1Dead(){return this.twoPlayer?!this.playerStates[0].alive:!!this.death;}
  get player2Dead(){return this.twoPlayer&&!this.playerStates[1].alive;}

  humanIndex(hand){return hand===this.player?0:this.player2&&hand===this.player2?1:-1;}
  isHuman(hand){return this.humanIndex(hand)>=0;}
  humanActive(hand){
    if(!this.twoPlayer)return !this.death&&!this.complete;
    const state=this.playerStates[this.humanIndex(hand)];
    return !!state&&state.alive&&!state.won;
  }
  get worldFrozen(){return this.twoPlayer?!this.humans.some(hand=>this.humanActive(hand)):!!this.death;}
  getPlayerInputs(input,input2){
    if(input2!=null)return [input??{},input2];
    if(input?.player1||input?.player2)return [input.player1??{},input.player2??{}];
    return [input??{},{}];
  }
  setPlayerGroup(group){
    if(![700,4300].includes(group))throw new Error('Unqualified player artwork group');
    this.playerGroup=group;this.player.group=group;
    if(this.player2)this.player2.group=group===4300?700:4300;
  }
  resetPlayers(preserveScores){
    this.player2=this.player2Spawn?this.makeHand(this.player2Spawn):null;
    if(!this.twoPlayer)return;
    this.player2.group=this.player.group===4300?700:4300;
    this.player.visible=this.player2.visible=true;
    if(!this.scores)this.scores=this.humans.map(()=>new RoundScore({difficulty:this.board.difficulty,players:2}));
    else for(const score of this.scores)preserveScores?score.startRound():score.resetGame();
    this.roundScore=this.scores[0];
    this.playerStates=this.scores.map(score=>({
      alive:true,won:false,dying:false,death:null,finishedTime:null,
      get completionBonus(){return score.completionBonus;},
      get timeBonus(){return score.timeBonus;},
      get roundBonus(){return score.roundBonus;},
      get totalCommitted(){return score.totalCommitted;},
    }));
    this.humanControls=this.humans.map(()=>({reverseHeld:false,pendingReverse:false,canonicalPlayerContact:false}));
  }
  humanControl(hand){return this.twoPlayer?this.humanControls[this.humanIndex(hand)]:this;}
  updateReverseInput(hand,input){
    const control=this.humanControl(hand);
    if(input.reverse&&!control.reverseHeld)this.reverse(this.humanIndex(hand));
    control.reverseHeld=!!input.reverse;
  }

  reset({preserveCheckpoint=false}={}){this.time=0;this.paused=false;this.complete=false;this.events=[];this.steps=0;this.activeSteps=0;this.eventSequence=0;this.reverseHeld=false;this.death=null;this.remainingTime=this.board.timeLimit;this.countdownElapsed=0;this.deathTickRemainder=0;for(const d of this.board.dots)delete d.collected;this.player=this.makeHand(this.board.player);this.demos=this.board.demos.map(x=>this.makeHand(x));if(this.board.movement&&!this.twoPlayer)this.roundScore=new RoundScore({difficulty:this.board.difficulty});if(this.playerGroup)this.player.group=this.playerGroup;this.resetPlayers(preserveCheckpoint);}
  get timed(){return Boolean(this.board.difficulty&&this.board.difficulty!=='Child'&&this.board.timeLimit>0);}
  advanceCountdown(elapsed,second){
    if(!this.timed||this.paused||this.complete||this.worldFrozen)return;
    if(this.twoPlayer&&this.remainingTime<=0){this.timeoutUnfinishedPlayers();return;}
    this.countdownElapsed+=elapsed;
    while(this.countdownElapsed+1e-9>=second&&!this.worldFrozen){
      this.countdownElapsed=Math.max(0,this.countdownElapsed-second);
      this.remainingTime=Math.max(0,this.remainingTime-1);
      if(this.remainingTime<=10)Object.assign(this.event('sound',this.player),{soundId:14});
      if(this.remainingTime===0)this.timeoutUnfinishedPlayers();
    }
  }
  timeoutUnfinishedPlayers(){
    for(const [index,hand] of this.humans.entries())if(this.humanActive(hand))this.beginDeath({reason:'timeout',type:'timeout',sourceReason:7},index);
  }
  beginDeath(cause,playerIndex=0){
    const hand=this.humans[playerIndex];
    if(!hand||this.twoPlayer&&!this.humanActive(hand))return;
    const pivot=this.board.dots.find(d=>d.id===hand.pivot);
    const death=createDeathEffect({pivot,frame:Math.floor(hand.angle*64/TAU)&63,randomUnsigned:()=>Math.floor(Math.random()*65536),clock:createDeathClock()});
    this.recordDeath(hand,death,cause);
  }
  recordDeath(hand,death,cause){
    const index=this.humanIndex(hand);
    if(index===0)this.death=death;
    if(this.twoPlayer)Object.assign(this.playerStates[index],{alive:false,dying:true,death,finishedTime:this.time});
    Object.assign(this.event('death',hand),{cause});
    if(this.twoPlayer){
      this.onPlayerResolved?.(hand);
      this.checkRoundCompletion();
    }
  }
  stepPlayerDeaths(ticks){
    for(const [index,state] of this.playerStates.entries()){
      if(!state.dying)continue;
      state.death.update(ticks);
      if(state.death.heroVisible===false||state.death.complete)this.humans[index].visible=false;
      state.dying=!state.death.complete;
    }
    if(this.player1Dead&&this.player2Dead&&this.playerStates.every(state=>!state.dying))this.restartAfterDeath();
  }
  restartAfterDeath(){
    const history={steps:this.steps,activeSteps:this.activeSteps,eventSequence:this.eventSequence,events:this.events};
    this.reset({preserveCheckpoint:true});Object.assign(this,history);this.event('round-reset',this.player);
  }
  captureGoal(hand,dot){
    if(!this.humanActive(hand))return;
    const index=this.humanIndex(hand),state=this.playerStates[index];
    this.scores[index].complete(this.remainingTime,{second:this.playerStates.some(s=>s.won),timed:this.timed});
    Object.assign(state,{won:true,finishedTime:this.time});
    this.event('goal',hand,dot);
    this.onPlayerResolved?.(hand);
  }
  checkRoundCompletion(){
    if(this.complete||!this.worldFrozen||!this.playerStates.some(state=>state.won))return;
    this.complete=true;
    const [player1,player2]=this.playerStates.map(state=>({won:state.won,died:!state.alive,
      roundBonus:state.roundBonus,completionBonus:state.completionBonus,timeBonus:state.timeBonus,levelTotal:state.roundBonus}));
    const winner=player1.won!==player2.won?(player1.won?0:1):
      player1.levelTotal===player2.levelTotal?'tie':player1.levelTotal>player2.levelTotal?0:1;
    Object.assign(this.event('round-complete',this.player),{player1,player2,winner});
  }
  grabTwoPlayerDot(target,hand){
    if(!this.humanActive(hand)||this.onHumanGrab?.(target,hand)===false)return;
    const dot=this.board.dots.find(d=>d.id===target.id);
    const goal=dot.kind==='goal';
    if(goal)this.captureGoal(hand,dot);
    if(!dot.collected&&(dot.kind==='bonus'||dot.kind==='goal'&&dot.bonus&&this.board.combinedGoalBonusRules)){
      const points=this.onBonus(dot,hand);
      dot.collected=true;
      Object.assign(this.event('bonus',hand,target),{points});
    }
    if(goal)this.checkRoundCompletion();
    else this.onAfterHumanGrab?.(target,hand);
  }
  onBonus(dot,hand=this.player){
    const score=this.twoPlayer?this.scores[this.humanIndex(hand)]:this.roundScore;
    return this.twoPlayer&&dot?.kind==='goal'?score.bonusDotAfterGoal():score?.bonusDot();
  }
  onGoal(){this.roundScore?.complete(this.remainingTime);}
  makeHand(h){return {...h,angle:h.angle||0,direction:h.direction||1,blocked:null,transfers:0};}
  event(type,hand,dot){const e={sequence:++this.eventSequence,type,time:this.time,hand:hand.name,dot:dot?.id};if(this.twoPlayer&&this.isHuman(hand))e.playerIndex=this.humanIndex(hand);this.events.push(e);if(this.events.length>100)this.events.shift();return e;}
  reverse(playerIndex=0){
    const hand=this.humans[playerIndex];
    if(hand&&!this.paused&&!this.complete&&(!this.twoPlayer||this.humanActive(hand))){
      hand.direction*=-1;this.event('reverse',hand);
    }
  }
  update(dt,input={},input2=null){
    if(!this.twoPlayer)return this.updateSinglePlayer(dt,input,input2??undefined);
    this.steps++;
    if(this.paused)return;
    this.deathTickRemainder+=dt*60;
    const ticks=Math.floor(this.deathTickRemainder+1e-9);this.deathTickRemainder-=ticks;
    if(this.complete){this.stepPlayerDeaths(ticks);return;}
    this.activeSteps++;
    this.advanceCountdown(dt,1);
    if(!this.worldFrozen){
      this.time+=dt;
      const inputs=this.getPlayerInputs(input,input2);
      for(const [index,hand] of this.humans.entries())if(this.humanActive(hand)){
        this.updateReverseInput(hand,inputs[index]);
        this.move(hand,dt,humanAction(inputs[index]));
      }
      for(const h of this.demos)this.move(h,dt,h.action);
    }
    this.stepPlayerDeaths(ticks);
  }
  updateSinglePlayer(dt,input,{sourceClock=false}={}){
    this.steps++;if(this.paused||this.complete)return;this.activeSteps++;
    if(!sourceClock){
      if(this.death){
        this.deathTickRemainder+=dt*60;
        const ticks=Math.floor(this.deathTickRemainder+1e-9);this.deathTickRemainder-=ticks;
        this.death.update(ticks);
        if(this.death.complete){
          const history={steps:this.steps,activeSteps:this.activeSteps,eventSequence:this.eventSequence,events:this.events};
          const score=this.roundScore;score?.startRound();
          this.reset();Object.assign(this,history,{roundScore:score});this.event('round-reset',this.player);
        }
        return;
      }
      this.advanceCountdown(dt,1);
      if(this.death)return;
    }
    this.time+=dt;
    if(input.reverse&&!this.reverseHeld)this.reverse();this.reverseHeld=!!input.reverse;
    this.move(this.player,dt,input.flip?'flip':input.swing&&input.bounce?'flip':input.swing?'swing':input.bounce?'bounce':null);
    for(const h of this.demos)this.move(h,dt,h.action);
  }
  move(h,dt,action,{sourceWallContact=false}={}){
    if(typeof sourceWallContact!=='boolean')throw new TypeError('Explicit source wall contact required');
    const pivot=this.board.dots.find(d=>d.id===h.pivot),radius=this.board.radius;
    const advance=this.board.angularSpeed*dt*h.direction*(h.speedScale??1),old=h.angle,next=old+advance;
    if(h.blocked!==null&&Math.abs(angleDelta(next,h.blocked))>0.22)h.blocked=null;
    let target=null,nearest=Infinity;
    const sourceQuery=Boolean(this.board.elevatorRules&&this.isHuman(h)&&h.canonicalFrame);
    if(action&&sourceQuery){
      // DOCanGrab applies its +/-6 branch only to ordinary moving-dot type1.
      // Admitted static/up-down dots use exact current-pixel alignment, then
      // test the first source match's permission. A sinking rider can be off
      // the static grid even while its hand still draws above the surface.
      const x=pivot.x+Math.round(Math.cos(old)*radius),y=pivot.y+Math.round(Math.sin(old)*radius);
      const first=this.board.dots.find(d=>d.present&&d.x===x&&d.y===y);
      if(first&&first.id!==pivot.id&&first.humanCanGrab&&h.blocked===null){target=first;nearest=0;}
    }else if(action)for(const d of this.board.dots){
      if(d.id===pivot.id)continue;
      // Movement's per-dot actor nibbles are inferred from original resource
      // flags and the observed red/green demonstration extents. Bouncing does
      // not grab a dot, so it can reflect from a non-grabbable neighbor.
      if(this.board.sourceDotPermissions){if(this.isHuman(h)?d.humanCanGrab===false:d.nonhumanCanGrab===false)continue;}
      else if(action!=='bounce'&&h.grabMask&&d.flags!==undefined&&!(d.flags&h.grabMask))continue;
      if(Math.abs(Math.hypot(d.x-pivot.x,d.y-pivot.y)-radius)>this.board.distanceTolerance)continue;
      const a=Math.atan2(d.y-pivot.y,d.x-pivot.x),dist=angleDelta(a,old)*h.direction;
      if(dist>=-0.00001&&dist<=Math.abs(advance)+0.00001&&h.blocked===null&&dist<nearest){target=d;nearest=dist;}
    }
    h.angle=next;
    if(!target)return;
    const hit=sourceQuery?old:Math.atan2(target.y-pivot.y,target.x-pivot.x),remaining=Math.abs(advance)-nearest;
    if(action==='bounce'){
      if(!sourceWallContact)h.direction*=-1;h.angle=hit+remaining*h.direction;h.blocked=hit;this.event('bounce',h,target);return;
    }
    if((action==='swing')!==sourceWallContact)h.direction*=-1;
    if(this.isHuman(h))this.onHumanRelease?.(pivot,h);
    h.pivot=target.id;h.transfers++;
    h.angle=hit+Math.PI+remaining*h.direction;h.blocked=hit+Math.PI;this.event(action,h,target);
    if(this.twoPlayer&&this.isHuman(h)){this.grabTwoPlayerDot(target,h);return;}
    if(h===this.player){
      // DOGrabbed checks the latched death from DPWandGrabbed before bonus or
      // goal effects. Ordinary Movement has no additional grab observer.
      if(this.onHumanGrab?.(target)===false)return;
      if(this.board.combinedGoalBonusRules&&target.kind==='goal'&&target.bonus){
        // Source DOGrabbed latches ROWon before the same grab's bonus hook.
        // This opt-in keeps ordinary Movement and earlier scene paths intact.
        this.onGoal?.(target);this.complete=true;this.event('goal',h,target);
        if(!target.collected){target.collected=true;const points=this.onGoalBonus?.(target),event=this.event('bonus',h,target);if(points!==undefined)event.points=points;}
        this.onAfterHumanGrab?.(target);return;
      }
      if(target.kind==='bonus'&&!target.collected){target.collected=true;const points=this.onBonus?.(target),event=this.event('bonus',h,target);if(points!==undefined)event.points=points;}
      if(target.kind==='goal'){this.onGoal?.(target);this.complete=true;this.event('goal',h,target);}
      this.onAfterHumanGrab?.(target);
    }
  }
  twoPlayerSnapshot(){
    if(!this.twoPlayer)return {};
    return {twoPlayer:true,player2:{...this.player2},players:this.playerStates.map(({death,...state},index)=>({
      ...state,score:this.scores[index].snapshot(),
      deathParticles:death?.snapshot()??[],
    })),deathParticles:this.death?.snapshot()??[],deathParticles2:this.death2?.snapshot()??[]};
  }
  snapshot(){return {...this.twoPlayerSnapshot(),time:this.time,steps:this.steps,activeSteps:this.activeSteps,paused:this.paused,complete:this.complete,player:{...this.player},demos:this.demos.map(h=>({...h})),events:[...this.events],...(this.board.movement?{roundTimer:{enabled:this.timed,original:this.board.timeLimit,current:this.remainingTime},roundScore:this.roundScore.snapshot(),dying:Boolean(this.death)}:{})};}
}
