import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingGoalOrdinaryRecipe,assertMovingGoalOrdinaryActor,assertMovingGoalOrdinarySource,assertMovingGoalOrdinaryBoard} from './moving-goal-ordinary.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
const recipe={allowMovingGoalOrdinary:true,...Object.fromEntries(['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:1,secondaryRaw:15}));Object.assign(cells[24],{flagsRaw:0x4085,offset:104,byteLength:10,rawHex:'4085000f046570777000',inlineProgram:{text:'epwp',offset:108,rawHex:'046570777000',paddingHex:'00'}});
 const actor=(type,cl=0,program=-1)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:program,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,cl]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:5,records:[actor(0),actor(6),actor(1,3),actor(2,1,0),actor(3,1,0)]},{kind:'WP',count:1,records:[{text:'fns'}]},{kind:'SP',count:1,records:[{rawWords:[6,4,2,0,0,15]}]}]};
}
test('moving ordinary goal capability excludes borrowed rails, goodies and checkpoints',()=>{
 assert.equal(assertMovingGoalOrdinaryRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingGoalOrdinaryRecipe({...recipe,[k]:false}));for(const k of['allowMovingGoalGoodies','allowSlidingConnectors','allowGoodies','allowMovingWaystation'])assert.throws(()=>assertMovingGoalOrdinaryRecipe({...recipe,[k]:true}));
});
test('moving goal source retains closed pause programs and separate ordinary actor clocks',()=>{
 assert.equal(assertMovingGoalOrdinarySource(fixture()),true);for(const mutate of[s=>s.cells[24].flagsRaw=5,s=>s.cells[24].inlineProgram.text='eepp',s=>s.blocks[0].records[2].programReferenceRaw=0,s=>s.blocks[1].records[0].text='b',s=>s.blocks[2].records[0].rawWords[5]=8]){const s=fixture();mutate(s);assert.throws(()=>assertMovingGoalOrdinarySource(s));}
});
test('programmed ordinary actors require class1 and valid source PCs',()=>{
 const a={sourceSlot:3,sourceActorType:3,group:4500,speedClass:1,program:'fns',sourcePC:1,checksWalls:false};assert.equal(assertMovingGoalOrdinaryActor(a),true);for(const m of[{speedClass:3},{program:'b'},{sourcePC:0},{checksWalls:true},{sourceActorType:4}])assert.throws(()=>assertMovingGoalOrdinaryActor({...a,...m}));
});
test('normalized moving goal binds source programs, active spikes and ordinary actor inventory',()=>{
 const s=fixture(),b={movingGoalOrdinaryRules:true,activeMask:1,difficulty:'Child',origin:{x:74,y:72},movingDotRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,movingGoalOrdinarySource:s};
 b.dots=s.cells.map(c=>({id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,x:74+c.column*48,y:72+c.row*48,sourceInitialPosition:{x:74+c.column*48,y:72+c.row*48},motion:c.flagsRaw&128?'moving-program':'static',color:0,sourceInitialBonus:false,cell:c.flagsRaw,bonus:false,kind:c.flagsRaw&4?'goal':'dot',movingProgram:c.inlineProgram?.text}));
 const actors=s.blocks[0].records.map((r,sourceSlot)=>({sourceSlot,sourceRawRecord:sourceSlot,sourceActorType:r.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[r.actorTypeRaw],speedClass:r.rawWords[7],checksWalls:!!r.version12ByteRaw,program:r.programReferenceRaw<0?null:'fns',sourcePC:1,pivot:'0,0'}));b.player=actors[0];b.enemies=actors.slice(2);b.spikes=[{id:0,row:6,column:4,subrow:2,subcolumn:0,x:266,y:384,activationMask:15}];
 assert.equal(assertMovingGoalOrdinaryBoard(b),true);for(const mutate of[x=>x.spikes[0].x++,x=>x.dots[24].movingProgram='eepp',x=>x.dots[24].kind='dot',x=>x.enemies[0].speedClass=4,x=>x.connectors=[{}]]){const c=structuredClone(b);mutate(c);assert.throws(()=>assertMovingGoalOrdinaryBoard(c));}
 const moved=structuredClone(b);moved.dots[24].x+=3;assert.equal(assertMovingGoalOrdinaryBoard(moved,{initial:false}),true);moved.dots[1].x++;assert.throws(()=>assertMovingGoalOrdinaryBoard(moved,{initial:false}));
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,200].map(g=>[g,frames(g===200?4:64)]))},dotOutlines:{groups:{300:frames(207)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=(s=fixture())=>new SourceRound(buildDecodedBoard(s,{...recipe,angularSpeed:1}),profiles);
test('moving goal misc follows its current pivot and reset retains clock phases and goal identity',()=>{
 const g=round(),d=g.board.dots.find(d=>d.kind==='goal'),x=d.x;for(let i=0;i<240;i++)g.update(1/120,{});assert.notEqual(d.x,x);assert.deepEqual(g.dotAnimations.renderState(d.id).goal.rawBase,{x:d.x-16,y:d.y-15});const clocks=g.actorClasses.snapshot();g.player.pivot=d.id;g.player.movingPivot=true;g.slideGrabHuman(d,g.player);assert.equal(g.complete,true);assert.equal(g.childScore.roundBonus,1000);g.reset();assert.equal(g.complete,false);assert.equal(d.kind,'goal');assert.equal(d.motion,'moving-program');assert.deepEqual({x:d.x,y:d.y},d.sourceInitialPosition);assert.deepEqual(g.actorClasses.snapshot(),clocks);
});
test('class3 free rider follows the mover while its angular count stays half class1',()=>{
 const s=fixture(),a=s.blocks[0].records[2];a.gridPosition={row:2,column:2};a.rawWords[0]=a.rawWords[1]=2;const g=round(s),r=g.enemies[0],x=g.point(r).x,start=r.frame;for(let i=0;i<240;i++)g.update(1/120,{});const c=g.actorClasses.snapshot().classes;assert.ok(c[1].count===2*c[3].count||c[1].count===2*c[3].count+1);assert.equal(r.frame,(start+c[3].count)&63);assert.equal(g.point(r).x,x+48);
});
test('ordinary programmed transfer uses the synchronous current moving-dot query and exact scope',()=>{
 const s=fixture();Object.assign(s.cells[35],{flagsRaw:0x4083,secondaryRaw:0x0f0f,offset:120,byteLength:10,rawHex:'40830f0f046570777000',inlineProgram:{text:'epwp',offset:124,rawHex:'046570777000',paddingHex:'00'}});const g=round(s),a={...g.enemies[1],pivot:'1,3',frame:63,unwrappedFrame:63,sourcePC:1},noop=()=>{},o={program:a.program,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowMovingGoalOrdinary:true,movingGoalOrdinaryScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 const r=advanceStaticEnemyCallback(a,1,o);assert.equal(r.state.pivot,'2,3');assert.ok(r.events.some(e=>e.type==='program-transfer'));assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,dots:[...o.dots]}));assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,sourceQuery:async()=>({allowed:false})}));
});
