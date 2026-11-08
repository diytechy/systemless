import test from 'node:test';
import assert from 'node:assert/strict';
import {ChildRoundScore} from './score.mjs';
test('Child dot awards increase by1000 and remain capped at5000',()=>{
 const s=new ChildRoundScore();assert.deepEqual(Array.from({length:7},()=>s.bonusDot()),[1000,2000,3000,4000,5000,5000,5000]);assert.equal(s.roundBonus,25000);
});
test('flat goodies do not advance the next dot award and Child has a fixed completion bonus',()=>{
 const s=new ChildRoundScore();s.addFlatBonus(1000);assert.equal(s.bonusDot(),1000);assert.equal(s.complete(),1000);assert.equal(s.complete(),0);assert.equal(s.roundBonus,3000);assert.equal(s.nextDotAward,2000);
 assert.throws(()=>s.bonusDot(),/Post-goal/);
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
