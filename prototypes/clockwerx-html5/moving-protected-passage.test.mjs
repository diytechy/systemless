import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingProtectedPassageRecipe,assertMovingProtectedPassageActor,assertMovingProtectedPassageSource,assertMovingProtectedPassageBoard} from './moving-protected-passage.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
const recipe={allowMovingProtectedPassage:true,...Object.fromEntries(['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','InactiveSpikes','InitiallyOpenDoors'].map(k=>['allow'+k,true]))};
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===0?0x4041:i===24?0x4009:i===87?0x4005:1,secondaryRaw:15}));Object.assign(cells[35],{flagsRaw:0x4089,secondaryRaw:14,offset:104,byteLength:10,rawHex:'4089000e046570777000',inlineProgram:{text:'epwp',offset:108,rawHex:'046570777000',paddingHex:'00'}});
 const actor=(type,cl)=>({actorTypeRaw:type,gridPosition:{row:0,column:0},activationMaskRaw:1,initialFrameHalfIndexRaw:24,programReferenceRaw:-1,version12ByteRaw:type===0||type===6?1:0,rawWords:[0,0,type,24,1,65535,1,cl]});const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[{kind:'WA',count:4,records:[actor(0,0),actor(6,0),actor(3,4),actor(2,1)]},block('SP',[[2,2,2,3,0,15],[4,3,2,0,0,12]]),block('WL',[[0,3,2,1,4,0]]),block('DR',[[3,0,0,258],[3,7,0,258]]),block('DS',[[2,3,2,2],[2,3,1,2]]),block('EX',[[5,2,0]])]};
}
test('passage capability names moving, rail, inactive spike and initially open door behavior explicitly',()=>{
 assert.equal(assertMovingProtectedPassageRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingProtectedPassageRecipe({...recipe,[k]:false}));for(const k of['allowMovingDoorCheckpoint','allowMovingGoalOrdinary','allowOil','allowStaticSlowdown'])assert.throws(()=>assertMovingProtectedPassageRecipe({...recipe,[k]:true}));
});
test('passage source clears inactive mover rings while retaining active static ring and protected spawn',()=>{
 assert.equal(assertMovingProtectedPassageSource(fixture()),true);for(const change of[s=>s.cells[35].secondaryRaw=15,s=>s.cells[24].secondaryRaw=14,s=>s.cells[0].flagsRaw=1,s=>s.blocks[0].records[2].rawWords[7]=3,s=>s.blocks[3].records[0].rawWords[2]=1]){const s=fixture();change(s);assert.throws(()=>assertMovingProtectedPassageSource(s));}
});
test('passage free class4 blue actor remains separate from ordinary class1 and wall-checking callbacks',()=>{
 const a={sourceSlot:2,sourceActorType:3,group:4500,speedClass:4,checksWalls:false,program:null};assert.equal(assertMovingProtectedPassageActor(a),true);for(const m of[{sourceActorType:1,group:500},{program:'n'},{speedClass:3},{checksWalls:true}])assert.throws(()=>assertMovingProtectedPassageActor({...a,...m}));
});
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:{...Object.fromEntries([700,4300,500,4400,4500].map(g=>[g,frames(64)])),800:frames(20),200:frames(4)}},dotOutlines:{groups:{300:frames(207)}},doorOutlines:{groups:{1300:frames(88),3800:frames(88),2900:frames(12),1000:frames(6)}},deathFactory:()=>({complete:false,update(){},snapshot(){return[];}})};
const board=(s=fixture())=>buildDecodedBoard(s,{...recipe,angularSpeed:1}),round=(s=fixture())=>new SourceRound(board(s),profiles);
test('passage normalized guard is read-only and binds masks, rails, walls and door geometry',()=>{
 const b=board(),before=JSON.stringify(b);assert.equal(assertMovingProtectedPassageBoard(b,profiles),true);assert.equal(JSON.stringify(b),before);for(const mutate of[x=>x.dots[35].ring=true,x=>x.doors[0].initiallyClosed=true,x=>x.walls[0].visible=false,x=>x.connectors[0].first='0,0']){const c=structuredClone(b);mutate(c);assert.throws(()=>new SourceRound(c,profiles));}
});
test('passage join retains masked moving rings, protected spawn and initially open long blue doors',()=>{
 const g=round(),m=g.board.dots[35];assert.equal(m.motion,'moving-program');assert.equal(m.ring,false);assert.equal(g.board.dots[0].protected,true);assert.equal(g.board.spikes.length,1);assert.ok(g.board.doors.every(d=>d.long&&d.color===2&&!d.initiallyClosed));assert.ok(g.doorSystem.snapshot().doors.every(d=>d.phase===10));assert.equal(g.board.staticSlowdownRules,undefined);assert.equal(g.board.canonicalOilRules,undefined);
});
test('passage ring release orphans occupants and reset restores availability with retained clocks',()=>{
 const g=round(),d=g.board.dots[24];for(let i=0;i<100;i++)g.update(1/120,{});g.enemies[0].pivot=d.id;g.onHumanRelease(d,g.player);assert.equal(d.humanCanGrab,false);assert.equal(g.enemies[0].orphaned,true);const clocks=g.actorClasses.snapshot();g.reset();assert.equal(d.humanCanGrab,true);assert.equal(g.enemies[0].orphaned,false);assert.equal(g.player.pivot,'0,0');assert.equal(g.board.dots[0].protected,true);assert.deepEqual(g.actorClasses.snapshot(),clocks);assert.ok(g.doorSystem.snapshot().doors.every(d=>d.phase===10));
});
test('passage class4 free rider follows class1 mover pixels at a quarter angular count',()=>{
 const s=fixture(),a=s.blocks[0].records[2];a.gridPosition={row:3,column:2};a.rawWords[0]=3;a.rawWords[1]=2;const g=round(s),r=g.enemies[0],x=g.point(r).x,start=r.frame;for(let i=0;i<240;i++)g.update(1/120,{});const c=g.actorClasses.snapshot().classes;assert.ok(c[1].count>=4*c[4].count&&c[1].count<4*c[4].count+4);assert.equal(r.frame,(start+c[4].count)&63);assert.equal(g.point(r).x,x+48);
});
test('passage NPC callback requires the exact board inventory and synchronous current query',()=>{
 const g=round(),a=g.enemies[0],noop=()=>{},o={program:null,dots:g.board.dots,guestTick:0,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowSliding:true,allowMovingProtectedPassage:true,movingProtectedPassageScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};assert.equal(advanceStaticEnemyCallback(a,1,o).state.frame,(a.frame+1)&63);assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,dots:[...o.dots]}));assert.throws(()=>advanceStaticEnemyCallback(a,1,{...o,sourceQuery:async()=>({allowed:false})}));
});
