import test from 'node:test';
import assert from 'node:assert/strict';
import {BombScene} from './bomb-scene.mjs';

function fixture(){
 const dot=(r,c,extra={})=>({id:`${c},${r}`,row:r,column:c,color:0,humanCanGrab:true,nonhumanCanGrab:true,ring:false,bonus:false,sourceInBackground:true,kind:'dot',...extra});
 const player={name:'player',sourceSlot:0,sourceActorType:0,visible:true};
 const round={board:{origin:{x:74,y:72},bombs:[{rawWords:[1,1,10,0]},{rawWords:[1,2,0,0]}],goodies:[{row:0,column:0,initialFrame:59}],dots:[dot(1,2),dot(2,2,{ring:true,sourceInBackground:false}),dot(1,3,{bonus:true,kind:'bonus',sourceInBackground:false})],walls:[{row:1,column:2,frame:4},{row:2,column:2,frame:0},{row:1,column:3,frame:1},{row:4,column:4,frame:4}],spikes:[{id:0,row:1,column:2,subrow:2,subcolumn:0},{id:1,row:2,column:2,subrow:2,subcolumn:0}],doors:[],switches:[],puddles:[]},player,enemies:[],guestTicks:0,remainingTime:90,events:[],collider:a=>a.visible===false?null:{left:0,top:0,right:1,bottom:1,rows:null},event(type){this.events.push(type);},beginDeath(cause){this.death??={cause};}};
 const routes=[{kind:10,points:[[0,0],[0,1]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:false,flipVertical:false,flipHorizontal:false,swap:false},{kind:0,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:true,flipVertical:false,flipHorizontal:false,swap:false}];
 const scene=new BombScene(round,{outlines:{groups:{}},routes,worldOutline:()=>({left:0,top:0,right:1,bottom:1,rows:null})});return {round,scene};
}
test('RO coordinates use the independent grid anchor once for each sprite type',()=>{
 const {scene}=fixture();assert.deepEqual(scene.gridPixel({row:1,column:2},{x:6,y:6}),{x:164,y:115});
 assert.deepEqual(scene.gridPixel({row:0,column:0},{x:31,y:31}),{x:93,y:92});
});
test('blast topology removes only source wall joints and neighboring type2 spikes, preserving rings',()=>{
 const {scene,round:r}=fixture(),grid={row:1,column:2};
 for(const target of ['SP','WL','DO'])scene.effect({type:'stationary',target,grid});
 assert.deepEqual(r.board.walls.map(w=>w.visible!==false),[false,false,false,true]);assert.deepEqual(r.board.spikes.map(s=>s.visible!==false),[false,true]);
 assert.equal(r.board.dots[0].burnt,true);assert.equal(r.board.dots[1].burnt,undefined);assert.equal(r.board.dots[2].bonus,false);assert.equal(r.board.dots[2].kind,'dot');assert.equal(r.board.dots[2].humanCanGrab,true);
 scene.reset();assert.ok(r.board.walls.every(w=>w.visible!==false));assert.ok(r.board.spikes.every(s=>s.visible!==false));assert.equal(r.board.dots[2].bonus,true);assert.equal(r.board.dots[2].kind,'bonus');assert.equal(r.board.dots[0].burnt,undefined);
});
test('hourglass awards live time once, hides at flourish callback5 and shifts color-cycling score right for24 callbacks',()=>{
 const {scene,round:r}=fixture();scene.runtime.collectGoodie(0,r.player);scene.runtime.collectGoodie(0,r.player);
 assert.equal(r.remainingTime,100);assert.equal(scene.score,1000);const f=scene.effects[0],score=scene.effects[1],x=score.point.x,y=score.point.y;
 const advanceUntil=(clock,e,n)=>{for(let ticks=0;e.callbacks<n&&ticks<500;ticks++){clock.advance(1);scene.processEffects();}assert.equal(e.callbacks,n);};
 advanceUntil(scene.flourishClock,f,4);assert.equal(f.frame,4);assert.equal(scene.runtime.goodies[0].visible,true);
 advanceUntil(scene.flourishClock,f,5);assert.equal(f.frame,5);assert.equal(scene.runtime.goodies[0].visible,false);
 advanceUntil(scene.scoreClock,score,23);assert.equal(score.visible,true);assert.equal(score.point.x,x+23);assert.equal(score.point.y,y);
 advanceUntil(scene.scoreClock,score,24);assert.equal(score.visible,false);assert.equal(score.point.x,x+23);
 scene.reset();assert.equal(scene.runtime.goodies[0].visible,true);assert.equal(scene.score,1000);assert.equal(scene.effects.length,0);
});
test('cached successor traversal defers append at the current tail and reuses insertion identity after reset',()=>{
 const {scene}=fixture();const calls=[],list=[{kind:'a',index:0}];scene.traverse(list,s=>{calls.push(s.kind);list.push({kind:'b',index:1});});assert.deepEqual(calls,['a']);
 scene.runtime.ignite(0,{sourceSlot:0,sourceActorType:0});assert.equal(scene.layer3.length,2);scene.reset();scene.runtime.ignite(0,{sourceSlot:0,sourceActorType:0});assert.equal(scene.layer3.length,2);
});
test('Child completion adds1000 once without a time bonus, while a fresh play clears score',()=>{
 const {scene,round:r}=fixture();scene.runtime.collectGoodie(0,r.player);scene.finish();scene.finish();assert.equal(scene.score,2000);assert.equal(r.remainingTime,100);
 scene.reset({restartLevel:true});assert.equal(scene.score,0);assert.equal(scene.completed,false);
});
test('blast human death does not interrupt later ordinary actor hiding; reset restores external topology',()=>{
 const {scene,round:r}=fixture();r.enemies.push({name:'red',sourceSlot:2,sourceActorType:1,visible:true});
 scene.effect({type:'moving',target:'WA',grid:{row:1,column:2},descriptorFrame:2});assert.equal(r.death.cause.reason,'bomb');assert.equal(r.player.visible,false);assert.equal(r.enemies[0].visible,false);assert.deepEqual(r.events,['bomb-hidden','bomb-hidden']);
});
