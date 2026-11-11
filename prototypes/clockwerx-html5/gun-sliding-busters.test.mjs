import test from 'node:test';import assert from 'node:assert/strict';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';
import {advanceFreeBuster} from './free-busters.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {assertGunSlidingBusterRecipe,assertGunSlidingBusterActor,assertGunSlidingBusterBoard} from './gun-sliding-busters.mjs';
import {shatterFreeBusterWall} from './free-busters.mjs';
const recipe={angularSpeed:1,allowGunSlidingBusters:true,allowFreeBusters:true,allowGunsTriggers:true,allowSlidingConnectors:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowCombinedGoalBonus:true,allowInactiveSpikes:true};
const block=(kind,rs)=>({kind,count:rs.length,records:rs.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,row,column,speed=1)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:0,programReferenceRaw:type===1?0:-1,version12ByteRaw:[0,6].includes(type)?1:0,rawWords:[row,column,type,0,1,type===1?0:65535,1,[0,6].includes(type)?0:speed,0,1,0]});
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===12?0x4009:[25,46].includes(i)?3:1,secondaryRaw:15}));
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:5,records:[actor(0,0,0),actor(6,0,0),actor(1,2,2),actor(5,4,2),actor(5,0,3,3)]},{kind:'WP',count:1,records:[{text:'fnnb'}]},block('EX',[[3,4,256]]),block('WL',[[256,7,5,0,6,0]]),block('SP',[[7,7,0,2,0,15]]),block('GN',[[0,5,1,0,4,0,15],[0,6,1,0,4,0,14]]),block('TR',[[3,5,1,0,0,15],[3,6,1,0,0,14]]),block('PU',[[0,0,0,0,14]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=(n,s=shape)=>({frames:Array.from({length:n},()=>({...s}))});
const profiles={outlines:{groups:Object.fromEntries([200,500,700,800,4300,3900].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},gunOutlines:{groups:{3300:frames(6,{...shape,rows:[[0,1]],collidable:true}),4200:frames(3,{...shape,rows:[[0,1]],collidable:true})}},deathFactory:()=>({update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),recipe),profiles);
test('removing the final cross arm admits only the hidden frame4 sentinel and reset restores its topology',()=>{
 const g=round(),w=g.board.walls.find(w=>w.frame>=5),original=w.frame;shatterFreeBusterWall(w,()=>true);assert.equal(w.frame,4);assert.equal(w.visible,false);assert.equal(assertGunSlidingBusterBoard(g.board),true);g.update(1/120,{});assert.throws(()=>assertGunSlidingBusterBoard({...g.board,walls:g.board.walls.map(x=>x===w?{...w,visible:true}:x)}));g.reset();assert.equal(w.frame,original);assert.equal(w.visible,undefined);
});
test('ordinary b/f/n callbacks transfer onto EX through static source coordinates and require synchronous diagnostics',()=>{
 const g=round(),s={...g.enemies[0],pivot:'4,2',frame:15,unwrappedFrame:15},noop=()=>{},o={program:s.program,dots:g.board.dots,guestTick:1,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowSliding:true,allowGunSlidingBusters:true,gunSlidingBusterScope:g.board};
 const r=advanceStaticEnemyCallback(s,1,o);assert.equal(r.state.pivot,'4,3');assert.ok(r.events.some(e=>e.type==='program-transfer'));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,allowGunSlidingBusters:false}));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,dots:[...g.board.dots]}));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,onSourceEvent:()=>Promise.resolve()}));
});
test('gun/EX/ring mixed-clock composition requires each explicit capability and filters inactive sources',()=>{
 assert.equal(assertGunSlidingBusterRecipe(recipe),true);for(const k of Object.keys(recipe).filter(k=>k.startsWith('allow')))assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,[k]:false}));
 assert.throws(()=>buildDecodedBoard(fixture(),{...recipe,allowBombs:true}));const g=round();assert.equal(g.board.gunSlidingBusterRules,true);assert.equal(g.gunTriggers.guns.length,1);assert.equal(g.gunTriggers.triggers.length,1);assert.equal(g.bombScene,undefined);assert.equal(g.elevators,undefined);
 const f=fixture();f.blocks.find(b=>b.kind==='WA').records[4].rawWords[7]=5;assert.throws(()=>buildDecodedBoard(f,recipe));
 const a=g.enemies.find(a=>a.speedClass===3);assert.equal(assertGunSlidingBusterActor(a),true);assert.throws(()=>assertGunSlidingBusterActor({...a,program:'f'}));assert.throws(()=>advanceFreeBuster(a,1,1));
});
test('class3 free busters follow their slower clock and return only on a callback strictly past deadline',()=>{
 const g=round(),a=g.enemies.find(a=>a.sourceActorType===5&&a.speedClass===1),b=g.enemies.find(a=>a.speedClass===3),af=a.unwrappedFrame,bf=b.unwrappedFrame;
 for(let i=0;i<200;i++)g.update(1/120,{});const c=g.actorClasses.snapshot().classes;
 assert.equal(a.unwrappedFrame-af,c[1].count);assert.equal(b.unwrappedFrame-bf,c[3].count);assert.equal(c[1].count,2*c[3].count);
 const s={...b,visible:false,hiddenUntil:100};advanceFreeBuster(s,0,101,{allowGunSlidingBusters:true,scope:g.board});assert.equal(s.visible,false);advanceFreeBuster(s,1,100,{allowGunSlidingBusters:true,scope:g.board});assert.equal(s.visible,false);assert.deepEqual(advanceFreeBuster(s,1,101,{allowGunSlidingBusters:true,scope:g.board}),[{type:'buster-return'}]);
});
test('class3 clones retain source clock and art, share guns pool, and reset without resetting actor clocks',()=>{
 const g=round(),b=g.enemies.find(a=>a.speedClass===3);g.gunTriggers.launchBuster(b,g.point(b),{x:1,y:0});const p=g.gunTriggers.slots[0],x=p.rawBase.x;assert.equal(p.speedClass,3);assert.equal(p.frame,b.frame);
 g.gunTriggers.activateColor(0);assert.ok(g.gunTriggers.slots[1]);g.gunTriggers.advance(1,{classes:{3:{count:p.reference}}});assert.equal(p.rawBase.x,x);g.gunTriggers.advance(2,{classes:{3:{count:p.reference+1}}});assert.equal(p.rawBase.x,x+1);
 const h=round();for(let i=0;i<20;i++)h.update(1/120,{});const c=h.actorClasses.snapshot().classes[3].count;h.reset();assert.equal(h.actorClasses.snapshot().classes[3].count,c);assert.equal(h.gunTriggers.slots.filter(Boolean).length,0);
});
test('bonus and white-ring lifecycles do not assume a bomb or elevator runtime',()=>{
 const g=round(),d=g.board.dots.find(d=>d.bonus),ring=g.board.dots.find(d=>d.ring);g.onBonus(d);assert.equal(d.bonus,false);assert.equal(d.kind,'dot');g.onGoal();g.onGoalBonus(d);
 g.onHumanRelease(ring,g.player);for(let i=0;i<20;i++)g.update(1/120,{});g.reset();assert.equal(d.bonus,true);assert.equal(ring.ring,true);
});
test('human gun contacts are active, type5 contacts excluded, and PR wall shatter uses its own paint journal',()=>{
 const h={sourceActorType:0},r={board:{freeBusterRules:true,gunSlidingBusterRules:true},collider:()=>null,gunTriggers:{contact:()=>{r.contacts++;return[];},humanHit:()=>({reason:'projectile'})},emitGunTriggerEvents(){},contacts:0,player:h};
 SourceRound.prototype.contactGunTrigger.call(r,h);assert.equal(r.contacts,1);SourceRound.prototype.contactGunTrigger.call(r,{sourceActorType:5});assert.equal(r.contacts,1);assert.deepEqual(SourceRound.prototype.projectileCollision.call(r),{reason:'projectile'});
 const g=round(),b=g.enemies.find(a=>a.speedClass===3);g.gunTriggers.launchBuster(b,g.point(b),{x:1,y:0});const w=g.board.walls.find(w=>w.frame===0);g.shatterBusterWall(w,g.gunTriggers.slots[0]);assert.equal(w.visible,false);assert.ok(g.sourcePaint.backgroundPaints.some(p=>p.kind==='WL'&&p.frame===2));assert.equal(g.busterWallEffects.length,1);g.reset();assert.equal(g.busterWallEffects.length,0);assert.deepEqual(g.sourcePaint.backgroundPaints,[]);
});
