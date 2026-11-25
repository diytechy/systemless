import {DIFFICULTIES} from './actor-clocks.mjs';

export const DIFFICULTY_COMPLETION_BONUS=Object.freeze({Child:1000,Easy:5000,Medium:15000,Hard:50000});
export const TIME_BONUS_PER_SECOND=100;
export const completionBonusForDifficulty=(difficulty='Child')=>DIFFICULTY_COMPLETION_BONUS[difficulty];
export const timeBonusForDifficulty=(difficulty='Child',remainingTime=0)=>difficulty==='Child'?0:Math.max(0,Math.floor(remainingTime))*TIME_BONUS_PER_SECOND;

// Single-player SCBonusDot/SCStart contracts.
const amount=n=>{if(!Number.isSafeInteger(n)||n<0||n>0x7fffffff)throw new RangeError('Bounded source score required');return n;};
export class ChildRoundScore {
 constructor({mode='Child',players=1}={}){if(mode!=='Child'||players!==1)throw new Error('Only Child single-player scores are qualified');this.resetGame();}
 resetGame(){this.totalCommitted=0;this.roundBonus=0;this.nextDotAward=1000;this.completed=false;this.goalBonusAwarded=false;}
 addFlatBonus(points){amount(points);if(this.completed)throw new Error('Post-goal bonus combination is unqualified');this.roundBonus=amount(this.roundBonus+points);return points;}
 bonusDot(){const points=this.nextDotAward;this.addFlatBonus(points);this.nextDotAward=Math.min(5000,points+1000);return points;}
 complete(){if(this.completed)return 0;this.roundBonus=amount(this.roundBonus+1000);this.completed=true;return 1000;}
 bonusDotAfterGoal(){
  if(!this.completed||this.goalBonusAwarded)throw new Error('One bonus from the same combined goal grab required');
  const points=this.nextDotAward;this.roundBonus=amount(this.roundBonus+points);this.nextDotAward=Math.min(5000,points+1000);this.goalBonusAwarded=true;return points;
 }
 startRound(){this.totalCommitted=amount(this.totalCommitted+this.roundBonus);this.roundBonus=0;this.nextDotAward=1000;this.completed=false;this.goalBonusAwarded=false;}
 snapshot(){return {mode:'Child',roundBonus:this.roundBonus,totalCommitted:this.totalCommitted,nextDotAward:this.nextDotAward,completed:this.completed,overallEarned:this.totalCommitted+this.roundBonus};}
}

export class RoundScore extends ChildRoundScore {
 constructor({mode='Child',difficulty=mode,players=1}={}){
  if(!DIFFICULTIES.includes(difficulty))throw new RangeError('Unknown difficulty');
  if(![1,2].includes(players))throw new RangeError('Expected one or two players');
  super();
  this.players=players;
  this.difficulty=difficulty;
 }
 resetGame(){super.resetGame();this.completionBonus=0;this.timeBonus=0;}
 startRound(){super.startRound();this.completionBonus=0;this.timeBonus=0;}
 complete(remainingTime=0,{second=false,timed=this.difficulty!=='Child'}={}){
  if(this.completed)return 0;
  const base=completionBonusForDifficulty(this.difficulty);
  const completion=second?Math.floor(base/2):base,time=timed?Math.max(0,Math.floor(remainingTime))*TIME_BONUS_PER_SECOND:0;
  this.addFlatBonus(completion+time);
  this.completionBonus=completion;this.timeBonus=time;this.completed=true;
  return completion+time;
 }
 snapshot(){return {...super.snapshot(),mode:this.difficulty,difficulty:this.difficulty,completionBonus:this.completionBonus,timeBonus:this.timeBonus};}
}
