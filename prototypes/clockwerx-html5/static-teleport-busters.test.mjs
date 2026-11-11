import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticTeleportBusterRecipe,assertStaticTeleportBusterActor,assertStaticTeleportBusterSource} from './static-teleport-busters.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {bombActors} from './bomb-runtime.mjs';
import {shatterFreeBusterWall} from './free-busters.mjs';import {bombStationaryWalls} from './walls.mjs';
const recipe={allowStaticTeleportBusters:true,...Object.fromEntries(['FreeBusters','Teleports','Bombs','BombObjectInteractions','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'].map(k=>['allow'+k,true]))};
const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,row,column,programReferenceRaw=-1)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:0,programReferenceRaw,version12ByteRaw:[0,6].includes(type)?1:0,rawWords:[row,column,type,0,1,programReferenceRaw<0?65535:programReferenceRaw,1,[0,6].includes(type)?0:1]});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:90},cells:Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?0x4011:1,secondaryRaw:15})),blocks:[{kind:'WA',count:5,records:[actor(0,0,0),actor(6,0,0),actor(5,4,4),actor(5,3,4,0),actor(2,5,5,0)]},{kind:'WP',count:1,records:[{text:'nbnb'}]},block('HY',[[1,1,1,0,15],[6,6,1,0,15]]),block('BO',[[2,2,10,0],[2,3,0,0]]),block('WY',[[2,2,24,65535,0,15]]),block('SP',[[6,4,2,0,0,15]]),block('WL',[[256,7,1,0,3,0]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const route=kind=>({kind,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false});
const profiles={outlines:{groups:Object.fromEntries([200,700,4300,3900,4400,4500,800].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:{1600:frames(18),1500:frames(12),1800:frames(10),1900:frames(17)}},bombRoutes:[route(10),route(0)],deathFactory:()=>({update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('an explosion repaints a previously shattered cross only in the explicit new family',()=>{
 const g=round(),w=g.board.walls.find(w=>w.frame>=5);shatterFreeBusterWall(w,()=>true);assert.equal(w.frame,4);assert.equal(w.visible,false);const grid={row:w.row,column:w.column};assert.throws(()=>bombStationaryWalls(g.board.walls,grid,()=>{}));g.bombScene.effect({type:'stationary',target:'WL',grid});assert.ok(g.bombScene.backgroundPaints.some(p=>p.kind==='WL'&&p.id===w.id&&p.frame===4));assert.throws(()=>bombStationaryWalls([{...w,visible:true}],grid,()=>{},{allowShatteredCrossFrames:true}));
});
function callback(g,state,tick,extra={}){const noop=()=>{};return advanceStaticEnemyCallback(state,1,{program:state.program,dots:g.board.dots,guestTick:tick,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowTeleports:true,allowStaticTeleportBusters:true,staticTeleportBusterScope:g.board,...extra});}
test('hidden n/b buster returns strictly after deadline; orphan expiry cancels later return',()=>{
 const g=round(),b=g.enemies[1];let s={...b,visible:false,hiddenUntil:100};assert.equal(callback(g,s,100).state.visible,false);const returned=callback(g,s,101);assert.equal(returned.state.visible,true);assert.ok(returned.events.some(e=>e.type==='buster-return'));
 s={...b,orphaned:true,orphanDeadline:100,visible:false,hiddenUntil:1};s=callback(g,s,101).state;assert.equal(s.visible,false);assert.equal(s.hiddenUntil,0);assert.equal(callback(g,s,102).state.visible,false);assert.throws(()=>callback(g,b,1,{dots:[...g.board.dots]}));
});
test('n/b commands obey adjacent source availability and diagnostics are synchronous',()=>{
 const g=round(),b={...g.enemies[1],frame:31,unwrappedFrame:31,sourcePC:2},left=g.board.dots.find(d=>d.id==='3,3');let r=callback(g,b,1);assert.equal(r.state.direction,-b.direction);assert.equal(r.state.pivot,b.pivot);left.nonhumanCanGrab=false;r=callback(g,b,1);assert.equal(r.state.direction,b.direction);assert.throws(()=>callback(g,b,1,{onSourceEvent:()=>Promise.resolve()}));
});
test('HY wall check reverses before death36 and fixed busters bypass ordinary teleport hooks',()=>{
 const g=round(),h=g.player,entry=g.board.dots.find(d=>d.id==='1,1');h.pivot=entry.id;h.frame=0;h.unwrappedFrame=0;const order=[],oldDir=h.direction;g.wallCollision=a=>{assert.equal(a.pivot,'6,6');order.push('wall');return {};};const bounce=g.bounceFromWall.bind(g);g.bounceFromWall=(a,w)=>{order.push('bounce');bounce(a,w);};g.beginDeath=c=>{assert.equal(h.direction,-oldDir);order.push(c.sourceReason);};g.afterActorDotGrab(h,entry);assert.deepEqual(order,['wall','bounce',36]);assert.equal(g.teleports.snapshot().faders.length,1);
 const b=g.enemies[0],before=b.pivot;g.afterActorDotGrab(b,entry);assert.equal(b.pivot,before);assert.equal(g.teleports.snapshot().faders.length,1);
});
test('blast burns a DO under HY without destroying its endpoint; reset preserves HY clock and restores walls',()=>{
 const g=round(),d=g.board.dots.find(d=>d.id==='1,1'),w=g.board.walls.find(w=>w.frame===0);g.bombScene.effect({type:'stationary',target:'DO',grid:{row:1,column:1}});assert.equal(d.burnt,true);assert.equal(g.teleports.snapshot().endpoints.length,2);g.teleports.observeHyperspace(4);const state=g.teleports.snapshot().endpoints.map(e=>e.frame);
 g.gunTriggers.launchBuster(g.enemies[0],g.point(g.enemies[0]),{x:1,y:0});g.shatterBusterWall(w,g.gunTriggers.slots[0]);assert.equal(w.visible,false);assert.ok(g.bombScene.backgroundPaints.some(p=>p.kind==='WL'&&p.frame===2));const count=g.actorClasses.snapshot().classes[1].count;g.reset();assert.equal(g.actorClasses.snapshot().classes[1].count,count);assert.equal(d.burnt,undefined);assert.deepEqual(g.teleports.snapshot().endpoints.map(e=>e.frame),state);assert.equal(g.gunTriggers.slots.filter(Boolean).length,0);assert.ok(g.board.walls.some(w=>w.frame===0&&w.visible!==false));
});
test('bomb actor scan requires the new family and retains programmed type5 return deadlines',()=>{
 const g=round(),b=g.enemies[1],options={guestTick:10,collides:()=>true,onDeath(){},onHidden(){},allowStaticTeleportBusters:true};assert.throws(()=>bombActors([b],options));assert.deepEqual(bombActors([b],{...options,allowFreeBusters:true}),[b.sourceSlot]);assert.equal(b.hiddenUntil,310);assert.equal(b.visible,false);
});
test('joined synthetic round advances free and n/b busters without ordinary HY/contact hooks',()=>{
 const g=round(),b=g.enemies[1],pivot=b.pivot;for(let i=0;i<200;i++)g.update(1/120,{});assert.equal(b.pivot,pivot);assert.ok(g.events.some(e=>e.type==='program-command'&&e.sourceActorType===5));assert.equal(g.death,null);assert.equal(g.teleports.snapshot().faders.length,0);assert.ok(g.gunTriggers);
});
test('static teleport buster recipe is explicit and excludes borrowed moving/EX/gun capabilities',()=>{
 assert.equal(assertStaticTeleportBusterRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertStaticTeleportBusterRecipe({...recipe,[k]:false}));for(const k of ['allowMovingDots','allowSlidingConnectors','allowGunsTriggers','allowElevators'])assert.throws(()=>assertStaticTeleportBusterRecipe({...recipe,[k]:true}));
});
test('static source admits free and bounce packs, paired HY and an active ordinary WY',()=>{
 assert.equal(assertStaticTeleportBusterSource(fixture()),true);const inactive=fixture();inactive.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=12;const b=buildDecodedBoard(inactive,{...recipe,angularSpeed:1});assert.equal(b.spikes.length,0);assert.ok(new SourceRound(b,profiles));const mutators=[s=>s.blocks[1].records[0].text='ns',s=>s.blocks[0].records[3].rawWords[7]=3,s=>s.cells[0].flagsRaw=0x101,s=>s.blocks.find(b=>b.kind==='HY').records[1].rawWords[2]=2,s=>s.blocks.find(b=>b.kind==='WY').records[0].rawWords[5]=14,s=>s.blocks.find(b=>b.kind==='BO').records[0].rawWords[3]=256];
 for(const change of mutators){const s=fixture();change(s);assert.throws(()=>assertStaticTeleportBusterSource(s));}
});
test('programmed type5 admission requires fixed wall-free class1 n/b with a valid source PC',()=>{
 const a={sourceSlot:2,sourceActorType:5,group:3900,speedClass:1,program:'nb',sourcePC:1,checksWalls:false};assert.equal(assertStaticTeleportBusterActor(a),true);assert.equal(assertStaticTeleportBusterActor({...a,program:null}),true);for(const m of[{program:'f'},{sourcePC:0},{speedClass:3},{checksWalls:true},{movingPivot:true},{sliding:true},{group:500}])assert.throws(()=>assertStaticTeleportBusterActor({...a,...m}));
});
