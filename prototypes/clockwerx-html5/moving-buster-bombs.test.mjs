import test from 'node:test';
import assert from 'node:assert/strict';
import {assertMovingBusterBombRecipe,assertMovingBusterBombActor} from './moving-buster-bombs.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
const recipe={angularSpeed:1,allowMovingBusterBombs:true,allowFreeBusters:true,allowMovingDots:true,allowSlidingConnectors:true,allowBombs:true,allowBombObjectInteractions:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true,allowMarkedTransfers:true,allowCombinedGoalBonus:true,allowClass3Enemies:true};
const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(row,column,type,speed=type===5?1:0,half=0)=>({gridPosition:{row,column},actorTypeRaw:type,activationMaskRaw:1,initialFrameHalfIndexRaw:half,programReferenceRaw:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,half,1,65535,1,speed,0,1,0]});
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===12?9:i===24||i===25?0x6001:i===26?0x4083:1,secondaryRaw:15,...(i===26?{inlineProgram:{text:'ppsn',offset:1,rawHex:'',paddingHex:''}}:{})}));
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:300},cells,blocks:[{kind:'WA',count:5,records:[actor(0,0,0),actor(0,0,6,0,40),actor(0,2,5),actor(3,3,1,1),actor(4,4,2,3)]},block('EX',[[3,3,0]]),block('BO',[[0,0,10,0],[0,0,0,0]]),block('SP',[[5,5,2,0,0,15]])]};
}
const shape={left:0,top:0,right:0,bottom:0,rows:[[0,0]],collidable:false,flipY:false};
const frames=(n,s=shape)=>({frames:Array.from({length:n},()=>({...s}))});
const profiles={outlines:{groups:Object.fromEntries([200,700,4300,3900,500,4400].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(116)}},bombOutlines:{groups:{1600:frames(18),1500:frames(12),1800:frames(10),1900:frames(17)}},bombRoutes:[{kind:10,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:false,flipVertical:false,flipHorizontal:false,swap:false},{kind:0,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:true,flipVertical:false,flipHorizontal:false,swap:false}],deathFactory:()=>({update(){},snapshot(){return[];}})};
test('moving buster bomb admission remains a separate literal recipe',()=>{
 assert.equal(assertMovingBusterBombRecipe(recipe),true);
 for(const key of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>assertMovingBusterBombRecipe({...recipe,[key]:false}));
 assert.throws(()=>assertMovingBusterBombRecipe({...recipe,allowGunsTriggers:true}));
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowMovingBusterBombs:false}));
 const inactive=fixture();for(const c of inactive.cells)if(c.flagsRaw&0x2000)c.secondaryRaw=8;assert.equal(buildDecodedBoard(inactive,recipe).dots.some(d=>d.transferDeath),false);
 const b=buildDecodedBoard(fixture(),recipe);assert.equal(b.movingBusterBombRules,true);assert.equal(b.dots.filter(d=>d.motion==='moving-program').length,1);
 const s=fixture();s.blocks[0].records[2].gridPosition={row:3,column:3};assert.throws(()=>buildDecodedBoard(s,recipe));
});
test('joined free ordinary class3 actor admits sliding; busters stay fixed and unprogrammed',()=>{
 const a={sourceSlot:2,sourceActorType:2,speedClass:3,checksWalls:false,program:null,sliding:true};assert.equal(assertMovingBusterBombActor(a),true);
 for(const change of [{sourceActorType:3},{program:'n'},{speedClass:5},{sourceSlot:0}])assert.throws(()=>assertMovingBusterBombActor({...a,...change}));
 assert.throws(()=>assertMovingBusterBombActor({...a,sourceActorType:5,speedClass:1}));
});
test('joined round advances ordinary sliding, fixed buster and moving bonus clocks and resets them together',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),d=g.board.dots.find(d=>d.motion==='moving-program');
 const initial={x:d.x,y:d.y},buster=g.enemies.find(a=>a.sourceActorType===5),frame=buster.frame;
 for(let i=0;i<80;i++)g.update(1/120,{});
 assert.notEqual(buster.frame,frame);assert.equal(g.death,null);assert.ok(g.movingDots.get(d.id));assert.ok(g.gunTriggers);
 const classCount=g.actorClasses.snapshot().classes[1].count;g.bombScene.effect({type:'stationary',target:'DO',grid:{row:2,column:3}});assert.equal(d.bonus,true);
 g.reset();assert.deepEqual({x:d.x,y:d.y},initial);assert.equal(d.bonus,true);assert.equal(g.actorClasses.snapshot().classes[1].count,classCount);assert.equal(g.gunTriggers.slots.filter(Boolean).length,0);
});
test('moving BO uses current bonus outlines after stationary traversal and reset restores source appearance',()=>{
 const p=structuredClone({...profiles,deathFactory:undefined});p.deathFactory=profiles.deathFactory;
 p.dotOutlines.groups[300]=frames(116,{left:0,top:0,right:1,bottom:1,rows:[[0,1]],flipY:false});
 p.bombOutlines.groups[1800]=frames(10,{left:-1000,top:-1000,right:1000,bottom:1000,rows:null,flipY:false});
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),p),d=g.board.dots.find(d=>d.motion==='moving-program'),cell=d.cell;
 g.bombScene.effect({type:'stationary',target:'DO',grid:{row:2,column:3}});assert.equal(d.bonus,true);
 g.bombScene.effect({type:'moving',target:'DO',grid:{row:0,column:0},descriptorFrame:3});assert.equal(d.bonus,false);assert.equal(d.burnt,true);assert.equal(d.cell,cell&~2);
 g.reset();assert.equal(d.bonus,true);assert.equal(d.burnt,undefined);assert.equal(d.cell,cell);
});
test('joined moving query retains fatal human mark-to-mark prelude before transfer',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles);
 while(!g.actorClasses.snapshot().classes[0].delta)g.update(1/120,{});
 Object.assign(g.player,{pivot:'2,2',frame:0,unwrappedFrame:0,direction:1,sliding:false,sourceBlockedTarget:null});
 g.moveMovingHuman(g.player,'flip');assert.equal(g.death!==null,true);assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,37);assert.equal(g.player.pivot,'3,2');assert.equal(g.player.direction,0);assert.equal(g.player.frame,32);
});
