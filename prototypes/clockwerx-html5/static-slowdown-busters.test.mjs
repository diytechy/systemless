import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticSlowdownBusterRecipe,assertStaticSlowdownBusterActor,assertStaticSlowdownBusterSource,assertStaticSlowdownBusterBoard} from './static-slowdown-busters.mjs';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';import {dotBodyFrame} from './dots.mjs';
const recipe={allowStaticSlowdownBusters:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','Bombs','BombObjectInteractions','SlidingConnectors','FreeBusters','RotatingSpikes','Class3RotatingSpikes','RotatingSpikeTransfers','StaticEnemyWalls','ImportedGoodie169','InactiveSpikes'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?0x4005:i===24?0x4021:i===40?9:1,secondaryRaw:15}));
 const actor=(type,cl=1,checks=0,ref=0)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:ref,version12ByteRaw:checks,rawWords:[0,0,type,24,1,ref<0?65535:ref,1,cl,0,1,checks*256]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:6,records:[actor(0,0,1,-1),actor(6,0,1,-1),actor(5),actor(4),actor(4,3),actor(1,1,1,-1)]},{kind:'WP',count:1,records:[{text:'ns'}]},{kind:'EX',count:1,records:[{rawWords:[2,0,0]}]},{kind:'WL',count:1,records:[{rawWords:[0,2,4,0,10,0]}]},{kind:'SP',count:1,records:[{rawWords:[3,3,0,2,0,15]}]},{kind:'BO',count:2,records:[{rawWords:[6,0,10,82]},{rawWords:[6,1,0,82]}]},{kind:'GO',count:2,records:[{rawWords:[4,0,0,0,15]},{rawWords:[4,1,169,0,3]}]}]};
}
test('static Slow buster recipe requires real 169/bomb/rail/orbital capabilities and rejects borrowed movers',()=>{
 assert.equal(assertStaticSlowdownBusterRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertStaticSlowdownBusterRecipe({...recipe,[k]:false}));for(const k of['allowMovingDots','allowMovingProgrammedBusters','allowElevators','allowSlowdownWaystation','allowCombinedGoalBonus'])assert.throws(()=>assertStaticSlowdownBusterRecipe({...recipe,[k]:true}));
});
test('static Slow actor admission separates source programmed busters, orbital clocks and free wall checking',()=>{
 const b={sourceSlot:2,sourceActorType:5,group:3900,speedClass:1,checksWalls:false,program:'ns',sourcePC:1};assert.equal(assertStaticSlowdownBusterActor(b),true);assert.equal(assertStaticSlowdownBusterActor({...b,sourceActorType:4,group:3500,speedClass:3}),true);assert.equal(assertStaticSlowdownBusterActor({...b,sourceActorType:1,group:500,checksWalls:true,program:null}),true);for(const m of[{program:null},{program:'b'},{speedClass:3},{checksWalls:true},{sourcePC:0}])assert.throws(()=>assertStaticSlowdownBusterActor({...b,...m}));
});
test('static Slow source guard admits the explicit mixed source without mutating mask or geometry',()=>{
 const s=fixture(),before=JSON.stringify(s);assert.equal(assertStaticSlowdownBusterSource(s),true);assert.equal(JSON.stringify(s),before);
 for(const mutate of[x=>x.cells[24].secondaryRaw=271,x=>x.blocks[0].records[2].rawWords[7]=3,x=>x.blocks[0].records[4].programReferenceRaw=-1,x=>x.blocks[2].records[0].rawWords[2]=512,x=>x.blocks[6].records[1].rawWords[2]=1,x=>x.cells[40].flagsRaw=0x89]){const c=structuredClone(s);mutate(c);assert.throws(()=>assertStaticSlowdownBusterSource(c));}
});
test('normalized static Slow composition binds rails, ring and Slow masks, source actors, fuses and imported goodies without repairs',()=>{
 const s=fixture();Object.assign(s,{sha256:'0'.repeat(64),byteLength:4096,resourceId:1});s.header.timeLimitRaw=120;
 for(const[i,r]of s.blocks.find(b=>b.kind==='GO').records.entries())Object.assign(r,{offset:1024+10*i,byteLength:10,rawHex:r.rawWords.map(n=>n.toString(16).padStart(4,'0')).join('')});
 const b=buildDecodedBoard(s,{...recipe,ordinal:1,title:'Invented Slow buster fixture',angularSpeed:1}),before=JSON.stringify(b);assert.equal(assertStaticSlowdownBusterBoard(b),true);assert.equal(JSON.stringify(b),before);assert.equal(b.movingDotRules,undefined);assert.equal(b.elevatorRules,undefined);assert.equal(b.goodies[1].sourceInitialFrameRequest,169);assert.equal(b.enemies[2].speedClass,3);
 for(const mutate of[x=>x.dots[24].slowdown=false,x=>x.dots[40].ring=false,x=>x.dots[22].slideMask=0,x=>x.walls[0].frame++,x=>x.goodies[1].sourceImport.sha256='1'.repeat(64),x=>x.bombs[0].rawWords[2]=0,x=>x.enemies[0].sourceProgramReference=-1,x=>x.enemies[2].speedClass=1]){const c=structuredClone(b);mutate(c);assert.throws(()=>assertStaticSlowdownBusterBoard(c));}
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const routes=[{kind:10,points:[[0,0],[0,1]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:false,flipVertical:false,flipHorizontal:false,swap:false},{kind:0,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:true,flipVertical:false,flipHorizontal:false,swap:false}];
const profiles={outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,3500,3900,200,800].map(g=>[g,frames(g===200?4:g===800?32:64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:Object.fromEntries([[1600,18],[1500,12],[1800,10],[1900,17]].map(([g,n])=>[g,frames(n)]))},bombRoutes:routes,deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const round=()=>{const s=fixture();Object.assign(s,{sha256:'0'.repeat(64),byteLength:4096,resourceId:1});s.header.timeLimitRaw=120;for(const[i,r]of s.blocks.find(b=>b.kind==='GO').records.entries())Object.assign(r,{offset:1024+10*i,byteLength:10,rawHex:r.rawWords.map(n=>n.toString(16).padStart(4,'0')).join('')});return new SourceRound(buildDecodedBoard(s,{...recipe,angularSpeed:1}),profiles);};
test('joined static Slow busters preserve class3 programmed callback and every latched clock on mode changes',()=>{
 const g=round();for(let i=0;i<350;i++)g.update(1/120,{});const a=g.enemies.find(a=>a.sourceActorType===4&&a.speedClass===3);assert.ok(a.sourcePC>1);const before=g.actorClasses.snapshot(),slow=g.board.dots.find(d=>d.slowdown);g.onHumanGrab(slow);const after=g.actorClasses.snapshot();assert.equal(after.classes[3].divisor,8);assert.equal(after.classes[0].divisor,2);for(const[i,c]of after.classes.entries())assert.deepEqual({...c,divisor:before.classes[i].divisor},before.classes[i]);assert.equal(after.upstreamReference,before.upstreamReference);assert.equal(dotBodyFrame(slow),198+slow.color);g.onHumanRelease(slow,g.player);assert.equal(dotBodyFrame(slow),189+slow.color);assert.equal(g.slowdown.enabled,true);
});
test('joined blast preserves Slow frame priority and rings while propagating EX burn and resetting transients',()=>{
 const g=round(),slow=g.board.dots.find(d=>d.slowdown),ring=g.board.dots.find(d=>d.ring);g.bombScene.effect({type:'stationary',target:'DO',grid:{row:slow.row,column:slow.column}});assert.equal(slow.burnt,true);assert.equal(dotBodyFrame(slow),189+slow.color);g.onHumanGrab(slow);assert.equal(dotBodyFrame(slow),198+slow.color);g.bombScene.unbonus(ring,true);assert.equal(ring.burnt,undefined);assert.equal(ring.humanCanGrab,true);g.bombScene.unbonus(g.board.dots[22],true);assert.ok(g.board.connectors.every(e=>e.burnt));g.reset();assert.equal(slow.burnt,undefined);assert.equal(g.slowdown.enabled,false);assert.ok(g.board.connectors.every(e=>!e.burnt));assert.deepEqual(g.bombScene.backgroundPaints,[]);
});
test('joined static ring collapse orphans programmed busters and class3 orbitals before reset restores both',()=>{
 const g=round(),ring=g.board.dots.find(d=>d.ring),a=g.enemies.find(a=>a.sourceActorType===5),o=g.enemies.find(a=>a.sourceActorType===4&&a.speedClass===3);a.pivot=o.pivot=ring.id;g.onHumanRelease(ring,g.player);assert.equal(ring.humanCanGrab,false);assert.equal(a.orphaned,true);assert.equal(o.orphaned,true);g.reset();assert.equal(ring.humanCanGrab,true);assert.ok(g.enemies.every(a=>!a.orphaned));
});
test('joined programmed buster hidden deadline returns through the source callback without restarting its clock',()=>{
 const g=round(),a=g.enemies.find(a=>a.sourceActorType===5);a.visible=false;a.hiddenUntil=10;for(let i=0;i<100;i++)g.update(1/120,{});assert.equal(a.visible,true);assert.ok(g.events.some(e=>e.type==='buster-return'));assert.ok(g.actorClasses.snapshot().classes[1].count>0);assert.equal(g.roundRestarts,0);
});
test('joined collision-stage match contact belongs to human and ordinary callbacks',()=>{
 const g=round(),seen=[];g.bombScene.runtime.checkMatch=a=>seen.push(a.sourceActorType);for(let i=0;i<350;i++)g.update(1/120,{});assert.ok(seen.includes(0));assert.ok(seen.includes(1));assert.equal(seen.includes(4),false);assert.equal(seen.includes(5),false);
});
