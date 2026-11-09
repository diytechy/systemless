// Child single-player SCBonusDot/SCStart contracts. Campaign persistence and
// other difficulties are deliberately outside this per-scene score state.
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
