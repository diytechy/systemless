import test from 'node:test';
import assert from 'node:assert/strict';
import {OilRuntime} from './oil-runtime.mjs';
import {MovementGame,TAU} from './engine.mjs';

function fixture(){
 const frame={outlineIndex:0,left:0,top:0,right:1,bottom:1,rows:null,flipY:false};
 const dot=(id,sourceIndex,x,y)=>({id,sourceIndex,x,y,cell:1,flags:15,kind:'dot',humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true});
 const board={origin:{x:0,y:0},player:{pivot:'a'},dots:[dot('a',0,0,0),dot('b',1,48,0),dot('c',12,48,48)],puddles:[{row:0,column:0,kind:1}]};
 const options={outlines:{groups:{1200:{frames:Array.from({length:52},(_,i)=>({...frame,outlineIndex:[0,1,2,4].includes(i)?0:-1}))},2200:{frames:Array.from({length:107},()=>({...frame}))}}},dotOutlines:{groups:{300:{frames:Array.from({length:16},()=>({...frame}))}}},bounds:{left:-100,top:-100,right:500,bottom:500}};
 return {board,options};
}
const context=()=>({deaths:[],isFrozen:()=>false,onDeath(reason){this.deaths.push(reason);}});

test('Oil dot contact uses the current burnt body outline and skips an invisible main sprite',()=>{
 const {board,options}=fixture(),shape=options.dotOutlines.groups['300'].frames[0];
 options.dotOutlines.groups['300'].frames=Array.from({length:100},()=>({...shape,left:100,top:100,right:101,bottom:101}));
 options.dotOutlines.groups['300'].frames[92]={...shape};
 const oil=new OilRuntime(board,options),droplet={frame:0,base:{x:-16,y:-15}};
 assert.equal(oil.collideDot(droplet),-1);board.dots[0].burnt=true;assert.equal(oil.collideDot(droplet),0);
 board.dots[0].sourceCollidable=false;assert.equal(oil.collideDot(droplet),-1);
});

test('a blast hides only overlapping droplets without freeing slots or changing puddles',()=>{
 const {board,options}=fixture(),oil=new OilRuntime(board,options),ctx=context();
 oil.createDroplet(1,ctx);oil.createDroplet(12,ctx);const puddles=structuredClone(oil.puddles);
 assert.deepEqual(oil.bomb({left:32,top:-15,right:33,bottom:-14,rows:null}),[0]);
 assert.equal(oil.droplets[0].state.visible,false);assert.equal(oil.droplets[0].state.clockAttached,false);assert.equal(oil.droplets[1].state.visible,true);
 assert.equal(oil.allocations,2);assert.deepEqual(oil.puddles,puddles);assert.deepEqual(oil.humanGrab('b'),[]);
 assert.deepEqual(oil.bomb({left:32,top:-15,right:33,bottom:-14,rows:null}),[]);
 oil.advanceClocks(10);oil.processSprites(ctx);assert.equal(oil.droplets[0].state.visible,false);
 oil.reset('a');assert.equal(oil.allocations,0);assert.deepEqual(oil.droplets,[]);
});

test('oil acquisition selects source-slot order and does not search past a denied first match',()=>{
 const {board,options}=fixture();board.dots[1].x=4;board.dots[0].nonhumanCanGrab=false;board.dots.reverse();
 const oil=new OilRuntime(board,options);
 assert.equal(oil.acquireDot({x:-14,y:-15}),null);
 board.dots.find(d=>d.id==='a').nonhumanCanGrab=true;
 assert.equal(oil.acquireDot({x:-14,y:-15}).index,0);
});
test('waking is harmless; delayed acquisition and eleven approach callbacks create one waiting droplet',()=>{
 const {board,options}=fixture(),oil=new OilRuntime(board,options),ctx=context();
 assert.deepEqual(oil.contactHuman({left:23,top:-15,right:24,bottom:-14,rows:null}),[{type:'sound',argument:29}]);
 for(let tick=0;tick<250;tick++){oil.advanceClocks(1);oil.processSprites(ctx);}
 assert.equal(oil.puddles[0].targetDot,-1);assert.equal(oil.droplets.length,0);assert.deepEqual(ctx.deaths,[]);
 for(let tick=0;tick<250&&oil.droplets.length===0;tick++){oil.advanceClocks(1);oil.processSprites(ctx);}
 assert.equal(oil.droplets.length,1);assert.equal(oil.puddles[0].visible,false);
 assert.equal(oil.droplets[0].state.dotIndex,1);assert.equal(oil.droplets[0].state.frame,0);
 assert.ok(oil.droplets[0].state.moveDeadline>oil.now);assert.deepEqual(ctx.deaths,[]);
 assert.deepEqual(oil.humanGrab('b'),[{type:'death',reason:10}]);
 oil.droplets[0].state.frame=9;assert.deepEqual(oil.humanGrab('b'),[]);
});
test('synchronous clone starts at the same dot, opposite preference, and waits for a new client count',()=>{
 const {board,options}=fixture(),oil=new OilRuntime(board,options),ctx=context();
 oil.createDroplet(12,ctx);
 for(let tick=0;tick<1170;tick++)oil.advanceClocks(1);
 oil.processSprites(ctx);
 assert.equal(oil.allocations,2);const [parent,clone]=oil.droplets;
 assert.equal(parent.state.frame,27);assert.equal(clone.state.frame,0);
 assert.equal(clone.state.preferVertical,false);assert.equal(clone.state.moveDeadline,1);
 assert.equal(clone.clockReference,oil.counts.droplet);
 oil.processSprites(ctx);assert.equal(clone.state.frame,0);
});
test('freeze keeps visible phases still while clocks run; reset clears transient actors without rewinding time',()=>{
 const {board,options}=fixture(),oil=new OilRuntime(board,options),ctx=context();
 oil.createDroplet(1,ctx);const before=oil.snapshot();
 oil.advanceClocks(20);oil.processSprites({...ctx,isFrozen:()=>true});
 assert.deepEqual(oil.snapshot().droplets,before.droplets);assert.ok(oil.now>before.now);
 const now=oil.now,counts={...oil.counts};oil.reset('a');
 assert.equal(oil.allocations,0);assert.equal(oil.droplets.length,0);assert.equal(oil.now,now);assert.deepEqual(oil.counts,counts);
 assert.equal(oil.puddles[0].triggered,false);
});
test('hidden droplets still consume the source lifetime budget until round reset',()=>{
 const {board,options}=fixture(),oil=new OilRuntime(board,options),ctx=context();
 board.dots[1].humanCanGrab=false;
 for(let i=0;i<40;i++)oil.createDroplet(1,ctx);
 assert.equal(oil.allocations,32);assert.equal(oil.droplets.length,32);assert.equal(oil.faders.length,32);
 assert.equal(oil.droplets.every(d=>!d.state.visible),true);
 oil.reset('a');oil.createDroplet(1,ctx);assert.equal(oil.allocations,1);
});
test('missing profiles/bounds/slot identity fail; an empty source layer is safe',()=>{
 const {board,options}=fixture();assert.throws(()=>new OilRuntime(board,{}),/outlines/);
 assert.throws(()=>new OilRuntime(board,{...options,bounds:null}),/bounds/);
 board.puddles=[];const oil=new OilRuntime(board,options);oil.processSprites(context());
 board.dots[1].sourceIndex=0;assert.throws(()=>new OilRuntime(board,options),/Unique source dot slots/);
});
test('a fatal human-grab observer suppresses bonus and goal effects after a legal transfer',()=>{
 class Guarded extends MovementGame{onHumanGrab(){return false;}}
 for(const kind of ['bonus','goal']){
  const board={radius:48,distanceTolerance:1,angularSpeed:TAU,dots:[{id:'a',x:0,y:0,kind:'dot'},{id:'b',x:48,y:0,kind}],player:{name:'player',pivot:'a',angle:0,direction:1},demos:[]};
  const g=new Guarded(board);g.update(1/120,{flip:true});
  assert.equal(g.player.pivot,'b');assert.equal(g.complete,false);assert.equal(board.dots[1].collected,undefined);
  assert.equal(g.events.some(e=>['goal','bonus'].includes(e.type)),false);
 }
});
