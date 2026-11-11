import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingGoalGoodieRecipe,assertMovingGoalGoodieActor,assertMovingGoalGoodieSource} from './moving-goal-goodies.mjs';
import {buildDecodedBoard} from './level.mjs';import {SourceRound} from './round.mjs';import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';import {assertGoodieRuntimeScope} from './bomb-runtime.mjs';
const recipe={allowMovingGoalGoodies:true,...Object.fromEntries(['MovingDots','SlidingConnectors','Goodies','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'].map(k=>['allow'+k,true]))};
const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===48?0x4085:i===37?0x4083:1,secondaryRaw:15}));
 for(const[i,c]of cells.entries())if(c.flagsRaw&0x80){const h=c.flagsRaw.toString(16).padStart(4,'0')+'000f',rawHex='02657700';Object.assign(c,{offset:100+i*8,byteLength:8,rawHex:h+rawHex,inlineProgram:{text:'ew',offset:104+i*8,rawHex,paddingHex:'00'}});}
 const actor=(type,row=0,column=0)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:type===6?40:0,programReferenceRaw:type===1?0:-1,version12ByteRaw:type===1?0:1,rawWords:[row,column,type,type===6?40:0,1,type===1?0:65535,1,type===1?1:0]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:3,records:[actor(0),actor(6),actor(1,5,5)]},{kind:'WP',count:1,records:[{text:'fnnf'}]},block('EX',[[1,1,0]]),block('GO',[[0,0,0,0,15]]),block('SP',[[0,0,2,0,0,14]])]};
}
const shape={left:0,top:0,right:1,bottom:1,rows:[],collidable:false,flipY:false},frames=n=>({frames:Array.from({length:n},()=>({...shape}))});
const profiles={outlines:{groups:Object.fromEntries([700,4300,500].map(g=>[g,frames(64)]))},dotOutlines:{groups:{300:frames(207)}},bombOutlines:{groups:{1900:frames(17)}},deathFactory:()=>({update(){},snapshot(){return[];}})};
const round=()=>new SourceRound(buildDecodedBoard(fixture(),{...recipe,angularSpeed:1}),profiles);
test('joined synthetic round preserves source motion after collecting a moving bonus',()=>{
 const g=round(),d=g.board.dots.find(d=>d.bonus);g.onBonus(d);assert.equal(d.bonus,false);assert.equal(d.kind,'dot');assert.equal(d.motion,'moving-program');const start={x:d.x,y:d.y};for(let i=0;i<80;i++)g.update(1/120,{});assert.notDeepEqual({x:d.x,y:d.y},start);g.reset();assert.equal(d.bonus,true);assert.equal(d.kind,'bonus');assert.deepEqual({x:d.x,y:d.y},d.sourceInitialPosition);
});
test('GO uses the new unscaled200 client and coalesces missed counts once per traversal',()=>{
 const g=round(),p=g.bombScene,go=p.runtime.goodies[0];p.advanceClocks(100);assert.equal(p.clocks.goodie.advance(0).clientCount,7);p.processUpper();assert.equal(go.frame,1);p.processUpper();assert.equal(go.frame,1);p.advanceClocks(13);p.processUpper();assert.equal(go.frame,2);
});
test('pickup awards once, defers hide, excludes NPC collection and reset keeps the GO clock and phase',()=>{
 const g=round(),p=g.bombScene,go=p.runtime.goodies[0];assert.deepEqual(p.runtime.checkGoodie(g.enemies[0]),[]);const before=g.remainingTime;p.runtime.collectGoodie(0,g.player);assert.equal(g.childScore.roundBonus,1000);assert.equal(g.remainingTime,before+10);assert.equal(go.visible,true);assert.equal(go.collected,true);p.runtime.collectGoodie(0,g.player);assert.equal(g.childScore.roundBonus,1000);for(let i=0;i<100;i++)g.update(1/120,{});assert.equal(go.visible,false);const frame=go.frame,count=p.clocks.goodie.advance(0).clientCount;g.reset();assert.equal(go.visible,true);assert.equal(go.collected,false);assert.equal(go.frame,frame);assert.equal(p.clocks.goodie.advance(0).clientCount,count);assert.equal(g.childScore.roundBonus,0);
});
test('ordinary NPC transfers onto a real moving pivot with synchronous queries and matching inventory',()=>{
 const g=round(),s={...g.enemies[0],pivot:'3,3',frame:63,unwrappedFrame:63,sourcePC:1},noop=()=>{},o={program:s.program,dots:g.board.dots,guestTick:1,adjustPeriod:n=>n,afterAnimate:noop,onDotRelease:noop,onDotGrabFirst:noop,afterDotGrab:noop,allowMovingDots:true,allowSliding:true,allowMovingGoalGoodies:true,movingGoalGoodieScope:g.board,sourceQuery:a=>g.sourceGrabQuery(a,false)};
 const r=advanceStaticEnemyCallback(s,1,o);assert.equal(r.state.pivot,'4,3');assert.ok(r.events.some(e=>e.type==='program-transfer'));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,dots:[...g.board.dots]}));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,sourceQuery:async()=>({allowed:false})}));assert.throws(()=>advanceStaticEnemyCallback(s,1,{...o,sourceQuery:()=>Promise.resolve({allowed:false})}));
});
test('moving goal retains its source lifecycle and Child completion score through reset',()=>{
 const g=round(),d=g.board.dots.find(d=>d.kind==='goal');g.player.pivot=d.id;g.player.movingPivot=true;g.slideGrabHuman(d,g.player);assert.equal(g.complete,true);assert.equal(g.childScore.roundBonus,1000);assert.ok(g.dotAnimations.renderState(d.id).goal);g.reset();assert.equal(g.complete,false);assert.equal(d.kind,'goal');assert.equal(d.motion,'moving-program');assert.equal(g.player.pivot,'0,0');
});
test('goodie runtime join requires the actual current board inventories',()=>{
 const g=round(),b=g.board,o={dots:b.dots,actors:[g.player,...g.enemies],connectors:b.connectors,goodies:b.goodies,allowMovingGoalGoodies:true,movingGoalGoodieScope:b};assert.equal(assertGoodieRuntimeScope(o),true);assert.throws(()=>assertGoodieRuntimeScope({...o,allowMovingGoalGoodies:false}));assert.throws(()=>assertGoodieRuntimeScope({...o,goodies:[...b.goodies]}));assert.throws(()=>assertGoodieRuntimeScope({...o,allowMovingDoorGoodies:true}));
});
test('moving goal/goodie recipe explicitly excludes borrowed door/bomb/teleport flags',()=>{
 assert.equal(assertMovingGoalGoodieRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingGoalGoodieRecipe({...recipe,[k]:false}));for(const k of ['allowBombs','allowTeleports','allowMovingDoorGoodies','allowElevators'])assert.throws(()=>assertMovingGoalGoodieRecipe({...recipe,[k]:true}));
});
test('source-only moving goal/goodie guard accepts closed loops and masked spikes, rejecting new families',()=>{
 assert.equal(assertMovingGoalGoodieSource(fixture()),true);const mutators=[s=>s.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=15,s=>s.blocks.find(b=>b.kind==='GO').records[0].rawWords[2]=169,s=>s.blocks[1].records[0].text='b',s=>s.blocks[0].records[2].rawWords[7]=3,s=>s.cells[48].inlineProgram.text='ee'];for(const change of mutators){const s=fixture();change(s);assert.throws(()=>assertMovingGoalGoodieSource(s));}
});
test('moving goal/goodie ordinary actor admission retains class1 f/n and source PC bounds',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:1,program:'fnn',sourcePC:1,checksWalls:false};assert.equal(assertMovingGoalGoodieActor(a),true);for(const m of[{speedClass:3},{sourceActorType:5},{program:'b'},{sourcePC:0},{checksWalls:true}])assert.throws(()=>assertMovingGoalGoodieActor({...a,...m}));
});
