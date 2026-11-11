import test from 'node:test';import assert from 'node:assert/strict';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';import {bombActors} from './bomb-runtime.mjs';
import {assertMovingProgrammedBusterRecipe,assertMovingProgrammedBusterActor} from './moving-programmed-busters.mjs';
const recipe={angularSpeed:1,allowMovingProgrammedBusters:true,allowFreeBusters:true,allowMovingDots:true,allowSlidingConnectors:true,allowBombs:true,allowBombObjectInteractions:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true,allowInactiveSpikes:true,allowElevators:true};
const block=(kind,rs)=>({kind,count:rs.length,records:rs.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,row=0,column=0)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:type===5?7:24,programReferenceRaw:type===5?0:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,type===5?7:24,1,type===5?0:65535,1,[0,6].includes(type)?0:1,0,1,0]});
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===12?0x101:i===24?0x83:i===25?0x6081:1,secondaryRaw:i===25?8:15}));
 for(const i of[24,25]){const c=cells[i];Object.assign(c,{offset:100+8*i,byteLength:8,rawHex:c.flagsRaw.toString(16).padStart(4,'0')+c.secondaryRaw.toString(16).padStart(4,'0')+'02657700',inlineProgram:{offset:104+8*i,text:'ew',rawHex:'02657700',paddingHex:'00'}});}
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:4,records:[actor(0),actor(6),actor(5,2,2),actor(1,5,5)]},{kind:'WP',count:1,records:[{text:'snnn'}]},block('EX',[[4,3,0]]),block('WL',[[256,8,5,0,6,0]]),block('EL',[[3,1,3,0,0,15]]),block('SP',[[6,6,2,0,0,15]]),block('BO',[[4,2,10,0],[4,3,0,0]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=(n,s=shape)=>({frames:Array.from({length:n},()=>({...s}))});
const route=kind=>({kind,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false});
const profiles={outlines:{groups:Object.fromEntries([200,500,700,800,4300,3900].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:{1600:frames(18),1500:frames(12),1800:frames(10),1900:frames(17)}},elevatorOutlines:{groups:{3400:frames(10)}},bombRoutes:[route(10),route(0)],deathFactory:()=>({update(){},snapshot(){return[];}})};
test('programmed moving-buster composition is literal and retains motion on masked property misses',()=>{
 assert.equal(assertMovingProgrammedBusterRecipe(recipe),true);for(const k of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,[k]:false}));
 const b=buildDecodedBoard(fixture(),recipe);assert.equal(b.movingProgrammedBusterRules,true);assert.equal(b.dots.find(d=>d.id==='3,2').motion,'moving-program');assert.equal(b.dots.find(d=>d.id==='3,2').transferDeath,undefined);
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowMarkedTransfers:true}));
 const f=fixture();f.blocks.find(b=>b.kind==='WP').records[0].text='bn';assert.throws(()=>buildDecodedBoard(f,recipe));
 const a=b.enemies[0];assert.equal(assertMovingProgrammedBusterActor(a),true);for(const c of[{speedClass:3},{checksWalls:true},{program:'f'},{sourcePC:0},{group:500}])assert.throws(()=>assertMovingProgrammedBusterActor({...a,...c}));
});
test('programmed buster transfers from an actual moving pivot through source queries and skips ordinary EL contact',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),b=g.enemies[0];for(let i=0;i<100;i++)g.update(1/120,{});
 assert.ok(g.events.some(e=>e.type==='program-transfer'&&e.sourceActorType===5));assert.notEqual(b.pivot,'2,2');assert.equal(g.death,null);assert.equal(g.elevators.snapshot().controls[0].occupants,0);assert.ok(g.movingDots);assert.ok(g.gunTriggers);
 const count=g.actorClasses.snapshot().classes[1].count;g.gunTriggers.launchBuster(b,g.point(b),{x:1,y:0});assert.equal(g.gunTriggers.slots.filter(Boolean).length,1);g.reset();assert.equal(g.actorClasses.snapshot().classes[1].count,count);assert.equal(g.enemies[0].pivot,'2,2');assert.equal(g.enemies[0].visible,true);assert.equal(g.gunTriggers.slots.filter(Boolean).length,0);
});
function helper(g,state,tick,query=()=>({allowed:false,grab:null})){const noop=()=>{};return advanceStaticEnemyCallback(state,1,{program:state.program,dots:g.board.dots,guestTick:tick,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingProgrammedBusters:true,movingProgrammedBusterScope:g.board,allowMovingDots:true,allowSliding:true,allowUpDownDots:true,sourceQuery:query});}
test('hidden programmed buster keeps moving and returns strictly after its deadline; orphan expiry cancels return',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles);let s={...g.enemies[0],visible:false,hiddenUntil:100};const initial=s.frame;
 s=helper(g,s,100).state;assert.equal(s.visible,false);assert.notEqual(s.frame,initial);const r=helper(g,s,101);assert.equal(r.state.visible,true);assert.ok(r.events.some(e=>e.type==='buster-return'));
 s={...g.enemies[0],orphaned:true,orphanDeadline:100,visible:false,hiddenUntil:1};s=helper(g,s,101).state;assert.equal(s.visible,false);assert.equal(s.hiddenUntil,0);assert.equal(helper(g,s,102).state.visible,false);
});
test('bomb actor scan requires the new PR capability and retains type5 return metadata',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),call=extra=>bombActors([g.enemies[0]],{guestTick:10,collides:()=>true,onDeath(){},onHidden(){},allowMovingProgrammedBusters:true,...extra});
 assert.throws(()=>call({}));assert.deepEqual(call({allowFreeBusters:true}),[2]);assert.equal(g.enemies[0].hiddenUntil,310);assert.equal(g.enemies[0].visible,false);
});
test('joined source query stays synchronous and a PR wall shatter journals its source erasure',()=>{
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles),s={...g.enemies[0],frame:15,unwrappedFrame:15};
 assert.throws(()=>helper(g,s,1,async()=>({allowed:false})));assert.throws(()=>helper(g,s,1,()=>Promise.resolve({allowed:false})));
 const b=g.enemies[0];g.gunTriggers.launchBuster(b,g.point(b),{x:1,y:0});const w=g.board.walls.find(w=>w.frame===0);g.shatterBusterWall(w,g.gunTriggers.slots[0]);assert.equal(w.visible,false);assert.ok(g.bombScene.backgroundPaints.some(p=>p.kind==='WL'&&p.id===w.id&&p.frame===2));assert.equal(g.busterWallEffects.length,1);g.reset();assert.equal(g.busterWallEffects.length,0);assert.deepEqual(g.bombScene.backgroundPaints,[]);
});
test('mixed blast tests current up/down and mover outlines after stationary pass, paints bombed EL, and restores on reset',()=>{
 const p={...profiles,dotOutlines:{groups:{300:frames(207,{...shape,rows:[[0,1]],collidable:true})}},bombOutlines:{groups:{...profiles.bombOutlines.groups,1800:frames(10,{left:-1000,top:-1000,right:1000,bottom:1000,rows:null,flipY:false})}}};
 const g=new SourceRound(buildDecodedBoard(fixture(),recipe),p),u=g.board.dots.find(d=>d.upDown),m=g.board.dots.find(d=>d.id==='2,2');
 g.bombScene.effect({type:'stationary',target:'DO',grid:{row:1,column:1}});assert.equal(u.burnt,undefined);assert.equal(m.bonus,true);
 g.bombScene.effect({type:'moving',target:'DO',grid:{row:0,column:0},descriptorFrame:3});assert.equal(u.burnt,true);assert.equal(m.bonus,false);
 g.bombScene.effect({type:'stationary',target:'EL',grid:{row:3,column:1}});assert.equal(g.elevators.snapshot().controls[0].visible,false);assert.ok(g.bombScene.backgroundPaints.some(p=>p.kind==='EL'&&p.frame===9));
 g.reset();assert.equal(u.burnt,undefined);assert.equal(m.bonus,true);assert.equal(g.elevators.snapshot().controls[0].visible,true);assert.deepEqual(g.bombScene.backgroundPaints,[]);
});
