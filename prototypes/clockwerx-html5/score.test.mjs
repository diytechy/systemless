import test from 'node:test';
import assert from 'node:assert/strict';
import {ChildRoundScore,RoundScore,completionBonusForDifficulty,timeBonusForDifficulty,TIME_BONUS_PER_SECOND} from './score.mjs';

test('every difficulty awards the source finish bonus and whole remaining seconds',()=>{
 const cases=[['Child',1000,0],['Easy',5000,1200],['Medium',15000,1200],['Hard',50000,1200]];
 assert.equal(TIME_BONUS_PER_SECOND,100);
 for(const [difficulty,completionBonus,timeBonus] of cases){
  const score=new RoundScore({mode:'campaign',difficulty,players:1});
  assert.equal(completionBonusForDifficulty(difficulty),completionBonus);
  assert.equal(timeBonusForDifficulty(difficulty,12.9),timeBonus);
  assert.equal(score.bonusDot(),1000);
  assert.equal(score.complete(12.9),completionBonus+timeBonus);
  assert.deepEqual([score.snapshot().completionBonus,score.snapshot().timeBonus],[completionBonus,timeBonus]);
  assert.equal(score.complete(99),0);
  assert.equal(score.bonusDotAfterGoal(),2000);
  score.startRound();
  assert.equal(score.snapshot().overallEarned,3000+completionBonus+timeBonus);
  assert.equal(score.snapshot().timeBonus,0);
 }
 assert.equal(timeBonusForDifficulty('Hard',-10),0);
});
test('Child dot awards increase by1000 and remain capped at5000',()=>{
 const s=new ChildRoundScore();assert.deepEqual(Array.from({length:7},()=>s.bonusDot()),[1000,2000,3000,4000,5000,5000,5000]);assert.equal(s.roundBonus,25000);
});
test('flat goodies do not advance the next dot award and Child has a fixed completion bonus',()=>{
 const s=new ChildRoundScore();s.addFlatBonus(1000);assert.equal(s.bonusDot(),1000);assert.equal(s.complete(),1000);assert.equal(s.complete(),0);assert.equal(s.roundBonus,3000);assert.equal(s.nextDotAward,2000);
 assert.throws(()=>s.bonusDot(),/Post-goal/);
});

test('combined goal callback awards its dot after completion once, preserving progression',()=>{
 const s=new ChildRoundScore();assert.throws(()=>s.bonusDotAfterGoal(),/same combined goal/);
 s.bonusDot();s.bonusDot();s.complete();assert.equal(s.bonusDotAfterGoal(),3000);
 assert.equal(s.roundBonus,7000);assert.equal(s.nextDotAward,4000);assert.equal(s.completed,true);
 assert.throws(()=>s.bonusDotAfterGoal(),/same combined goal/);assert.throws(()=>s.addFlatBonus(1000),/Post-goal/);
 s.startRound();s.complete();assert.equal(s.bonusDotAfterGoal(),1000);assert.equal(s.snapshot().overallEarned,9000);
});
test('round start commits earned points and resets dot progression without erasing the total',()=>{
 const s=new ChildRoundScore();s.bonusDot();s.bonusDot();s.startRound();assert.equal(s.roundBonus,0);assert.equal(s.totalCommitted,3000);assert.equal(s.bonusDot(),1000);assert.equal(s.snapshot().overallEarned,4000);
});
test('fresh play clears both counters and snapshots cannot mutate score state',()=>{
 const s=new ChildRoundScore();s.bonusDot();s.startRound();const state=s.snapshot();state.totalCommitted=0;assert.equal(s.totalCommitted,1000);s.resetGame();assert.deepEqual(s.snapshot(),{mode:'Child',roundBonus:0,totalCommitted:0,nextDotAward:1000,completed:false,overallEarned:0});
});
test('unsupported modes, players, invalid points and source-score overflow fail closed',()=>{
 assert.throws(()=>new ChildRoundScore({mode:'Hard'}),/Only Child/);assert.throws(()=>new ChildRoundScore({players:2}),/single-player/);const s=new ChildRoundScore();for(const p of [-1,.5,Infinity,0x80000000])assert.throws(()=>s.addFlatBonus(p),/Bounded/);s.addFlatBonus(0x7fffffff);assert.throws(()=>s.complete(),/Bounded/);
});
