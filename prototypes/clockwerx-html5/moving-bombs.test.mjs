import test from 'node:test';import assert from 'node:assert/strict';
import {importMovingGoodie,assertMovingGoodie,assertMovingBombScope} from './moving-bombs.mjs';
import {initializeConnectorBonuses} from './sliding.mjs';import {initializeSlidingBombConnectors} from './sliding-bombs.mjs';
import {SourceRound} from './round.mjs';import {BombRuntime,assertBombRuntimeScope} from './bomb-runtime.mjs';

// Invented contract fixture. No private resource, map, program or art is used.
const source={sha256:'a'.repeat(64),byteLength:40,resourceId:3};
const record={offset:10,byteLength:10,rawWords:[1,3,169,0,1],rawHex:'0001000300a900000001'};
const p=(column,row)=>({x:74+48*column,y:72+48*row});
export function movingFixture(){
 const dot=(column,row,extra={})=>({id:`${column},${row}`,sourceIndex:row*11+column,column,row,...p(column,row),sourceInitialPosition:p(column,row),motion:'static',motionType:0,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,sourceInBackground:true,kind:'dot',bonus:false,ring:false,protected:false,teleport:false,slideMask:0,color:0,cell:1,...extra});
 const dots=[dot(0,0,{motion:'moving-program',motionType:1,movingProgram:'enpsw',sourceInBackground:false,protected:true,cell:0xc1}),dot(0,1,{bonus:true,kind:'bonus',cell:3}),dot(1,1)];
 const connectors=[{id:0,first:'0,1',second:'1,1',vertical:false}];dots[1].slideMask=1;dots[2].slideMask=4;initializeConnectorBonuses(connectors,dots);initializeSlidingBombConnectors(connectors);
 const human=(sourceSlot,sourceActorType,group)=>({name:sourceSlot?'human2':'player',sourceSlot,sourceActorType,pivot:'0,0',speedClass:0,group,angle:0,direction:1,program:null,canonicalFrame:true,frame:0,unwrappedFrame:0,visible:true,orphaned:false,checksWalls:true});
 const board={ordinal:0,title:'Invented moving contract',radius:48,distanceTolerance:1,angularSpeed:1,origin:{x:74,y:72},timeLimit:90,difficulty:'Child',demos:[],dots,connectors,player:human(0,0,700),enemies:[{...human(2,1,500),pivot:'1,1',speedClass:1,checksWalls:false}],slidingHumanStarts:['0,0','0,0'],movingHumanStarts:['0,0','0,0'],movingDotRules:true,movingBombRules:true,importedGoodie169Rules:true,sourceProvenance:source,slidingConnectorRules:true,bombRules:true,bombObjectInteractionRules:true,canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,combinedGoalBonusRules:true,sourceDotPermissions:true,bombs:[{rawWords:[5,5,10,0]},{rawWords:[5,6,0,0]}],goodies:[importMovingGoodie(record,source,{allowImportedGoodie169:true})],spikes:[{id:0,row:6,column:9,subrow:2,subcolumn:0,...p(9,6),phase:0}],walls:[],doors:[],switches:[],puddles:[],elevators:[],teleports:[]};
 const shape={left:0,top:0,right:1,bottom:1,rows:null},frames=n=>Array.from({length:n},()=>({...shape}));
 const options={outlines:{groups:{700:{frames:frames(64)},4300:{frames:frames(64)},500:{frames:frames(64)},200:{frames:frames(4)}}},dotOutlines:{groups:{300:{frames:frames(125)}}},bombOutlines:{groups:{1500:{frames:frames(3)},1600:{frames:frames(18)},1800:{frames:frames(5)},1900:{frames:frames(17)}}},bombRoutes:[{kind:10,points:[[0,0],[0,1]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:false,flipVertical:false,flipHorizontal:false,swap:false},{kind:0,points:[[0,0]],entryLeg:4,forwardExit:4,reverseExit:4,bomb:true,flipVertical:false,flipHorizontal:false,swap:false}],deathFactory:()=>({update(){},complete:false,snapshot(){return []}})};
 return {board,options,create:()=>new SourceRound(board,options)};
}

test('GO169 requires explicit original-byte/hash provenance; generated frames stay0..16',()=>{
 assert.throws(()=>importMovingGoodie(record,source),/qualified/i);const g=importMovingGoodie(record,source,{allowImportedGoodie169:true});assert.equal(g.initialFrame,0);assert.equal(g.sourceInitialFrameRequest,169);assert.equal(assertMovingGoodie(g,source,{allowImportedGoodie169:true}),true);
 for(const request of[17,168,170,65535])assert.throws(()=>importMovingGoodie({...record,rawWords:[1,3,request,0,1]},source,{allowImportedGoodie169:true}));
 for(const edit of[d=>d.sourceImport.sha256='b'.repeat(64),d=>d.initialFrame=16,d=>d.sourceImport.rawHex='00010003001000000001',d=>delete d.sourceImport]){const d=structuredClone(g);edit(d);assert.throws(()=>assertMovingGoodie(d,source,{allowImportedGoodie169:true}));}
 assert.throws(()=>assertMovingGoodie({row:1,column:3,initialFrame:169},source,{allowImportedGoodie169:true}));
 assert.equal(importMovingGoodie({...record,rawWords:[1,3,16,0,1]},source).initialFrame,16);
});

test('moving rich gate rejects omitted core, dynamic EX endpoints, goal/protected EX and nonordinary joins',()=>{
 for(const edit of[b=>b.movingBombRules=false,b=>b.movingDotRules=false,b=>b.goodieOnlyRules=true,b=>b.teleportRules=true,b=>b.dots[1].motion='moving-program',b=>b.dots[1].kind='goal',b=>b.enemies[0].sourceSlot=31]){const f=movingFixture();edit(f.board);assert.throws(f.create);}
 const f=movingFixture(),scope={...f.board,actors:[f.board.player,...f.board.enemies],allowImportedGoodie169:true};assert.equal(assertMovingBombScope(scope),true);
 assert.throws(()=>assertMovingBombScope({...scope,activeSections:{HY:1}}));
 assert.throws(()=>assertMovingBombScope({...scope,activeSections:{GO:2}}));
});

test('actual helper inventories cannot hide invalid GO declarations behind an empty scope list',()=>{
 const f=movingFixture(),b=f.board;
 assert.throws(()=>new BombRuntime({bombs:b.bombs,goodies:[{row:1,column:3,initialFrame:169}],routes:f.options.bombRoutes,scope:{allowMovingBombs:true,allowObjectInteractions:true,...b,goodies:[],actors:[b.player,...b.enemies]}},{}),/frame/);
});

test('moving source DOT and protection dispatch before BO/WA; reset restores positions before human grab without rewinding clocks',()=>{
 const g=movingFixture().create(),m=g.movingDots.get('0,0'),log=[];let calls=0;
 const dispatch=m.dispatch;m.dispatch=(...a)=>{const result=dispatch(...a);if(result.dispatched){log.push('DO');calls++;}return result;};
 const observe=g.dotAnimations.observeDotClocks.bind(g.dotAnimations);g.dotAnimations.observeDotClocks=(id,c)=>{if(id==='0,0'&&calls)log.push('misc');return observe(id,c);};
 const upper=g.bombScene.processUpper.bind(g.bombScene);g.bombScene.processUpper=()=>{if(calls)log.push('BO');return upper();};
 for(let i=0;i<30&&!calls;i++)g.update(1/120);
 assert.deepEqual(log.slice(0,3),['DO','misc','BO']);assert.equal(g.point(g.player).x,77);assert.equal(g.point(g.enemies[0]).x,122);assert.equal(g.player.pivot,'0,0');
 const count=g.actorClasses.snapshot().classes[1].count,overlay=g.dotAnimations.renderState('0,0').overlay;
 const onGrab=g.onHumanGrab.bind(g);let grabPoint;g.onHumanGrab=d=>{grabPoint={x:d.x,y:d.y};return onGrab(d);};g.reset();
 assert.deepEqual(grabPoint,p(0,0));assert.equal(g.actorClasses.snapshot().classes[1].count,count);assert.equal(m.snapshot().clockReference,count);assert.deepEqual(g.dotAnimations.renderState('0,0').overlay,overlay);assert.equal(g.player.movingPivot,true);
});

test('moving blasts use current original main outline, stationary grid branch skips movers, and protection gives no blast immunity',()=>{
 const g=movingFixture().create(),d=g.board.dots[0],scene=g.bombScene;
 scene.effect({type:'stationary',target:'DO',grid:{row:0,column:0}});assert.equal(d.burnt,undefined);const stationaryPaints=scene.backgroundPaints.length;
 scene.shape=()=>({left:d.x-16,top:d.y-15,right:d.x-15,bottom:d.y-14,rows:null});scene.effect({type:'moving',target:'DO',grid:{row:5,column:6},descriptorFrame:2});
 assert.equal(d.burnt,true);assert.equal(d.protected,true);assert.equal(d.humanCanGrab,true);assert.equal(d.sourceInBackground,false);assert.equal(scene.backgroundPaints.length,stationaryPaints);
 const oldJournal=scene.backgroundPaints;g.reset();assert.notEqual(scene.backgroundPaints,oldJournal);assert.equal(d.burnt,undefined);assert.equal(d.protected,true);assert.equal(g.board.connectors[0].sourceHasSprite,true);
});

test('GO imported frame0 uses its shared changed-count callback even while hidden, and reset keeps phase/reference',()=>{
 const g=movingFixture().create(),runtime=g.bombScene.runtime,s=runtime.goodies[0];assert.equal(s.frame,0);assert.equal(s.createdFrame,0);
 runtime.observeGoodie(0,1);s.visible=false;runtime.observeGoodie(0,22);assert.equal(s.frame,2);assert.equal(s.count,22);runtime.observeGoodie(0,22);assert.equal(s.frame,2);
 g.bombScene.reset();assert.equal(s.frame,2);assert.equal(s.count,22);assert.equal(s.visible,true);assert.equal(s.sourceInitialFrameRequest,169);
});

test('ignored authored169 is not a pickup type: source GOActivate keeps sound/flourish/score/latch/time/award order',()=>{
 const g=movingFixture().create(),r=g.bombScene.runtime,order=[],effect=r.adapters.effect;
 r.adapters.effect=e=>{order.push([e.type,r.goodies[0].collected]);return effect(e);};r.collectGoodie(0,g.player);
 assert.deepEqual(order,[['sound',false],['flourish',false],['floating-score',false],['add-time',true],['add-bonus',true]]);assert.equal(g.remainingTime,100);assert.equal(g.childScore.roundBonus,1000);assert.equal(r.goodies[0].sourceInitialFrameRequest,169);
 const n=order.length;r.collectGoodie(0,g.player);assert.equal(order.length,n);
});

test('a later ordinary EX start replaces a previous rail-entry presentation point (synthetic prior backout)',()=>{
 const g=movingFixture().create();for(let n=0;n<30&&!g.actorClasses.snapshot().classes[0].delta;n++)g.update(1/120);
 Object.assign(g.player,{pivot:'1,1',movingPivot:false,frame:16,unwrappedFrame:16,direction:1,sliding:false,sourceRailSpritePoint:{x:999,y:998}});
 g.moveMovingHuman(g.player,null);assert.equal(g.player.sliding,true);assert.equal(g.player.sourceRailSpritePoint,undefined);assert.deepEqual({x:g.point(g.player).x,y:g.point(g.player).y},{x:119,y:120});
});

test('normalized immutable source positions cannot be shifted together off the serialized large grid',()=>{
 for(const index of[0,1])for(const axis of['x','y']){const f=movingFixture(),d=f.board.dots[index];d[axis]+=3;d.sourceInitialPosition[axis]+=3;assert.throws(f.create,/serialized grid/);}
 const f=movingFixture();f.board.origin.x+=3;assert.throws(()=>assertMovingBombScope({...f.board,actors:[f.board.player,...f.board.enemies],allowImportedGoodie169:true}),/origin/);
});

test('actual nonempty SP declarations reach both normalized and direct helper boundaries; count-only declarations reject',()=>{
 for(const spikes of[[],null,[{}]]){const f=movingFixture();f.board.spikes=spikes;assert.throws(f.create);}
 const f=movingFixture(),scope={...f.board,actors:[f.board.player,...f.board.enemies],allowObjectInteractions:true,allowMovingBombs:true,allowImportedGoodie169:true,activeSections:{SP:1}};
 assert.equal(assertBombRuntimeScope(scope),true);
 for(const change of[{spikes:[]},{spikes:undefined},{spikes:[{}]},{activeSections:{SP:0}},{activeSections:{SP:2}}])assert.throws(()=>assertBombRuntimeScope({...scope,...change}));
 assert.throws(()=>new BombRuntime({bombs:f.board.bombs,goodies:f.board.goodies,routes:f.options.bombRoutes,scope:{...scope,spikes:[]}},{}),/SP/);
});

test('static dot, bonus and goal kind must match live bonus and goal cell bits',()=>{
 for(const change of[{kind:'unqualified'},{kind:'dot'},{kind:'goal'},{bonus:false},{cell:1},{cell:7},{kind:'bonus',bonus:false,cell:1}]){const f=movingFixture();Object.assign(f.board.dots[1],change);assert.throws(f.create,/kind|endpoint/);}
 for(const bonus of[false,true]){const f=movingFixture();f.board.dots.push({id:'2,2',sourceIndex:24,column:2,row:2,...p(2,2),sourceInitialPosition:p(2,2),motion:'static',motionType:0,present:true,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,sourceInBackground:false,kind:'goal',bonus,ring:false,protected:false,teleport:false,slideMask:0,color:0,cell:bonus?7:5});assert.doesNotThrow(f.create);}
});

test('live motion, intermediate cache and reset remain legal, while cleared bonuses retain background and EX sprite history',()=>{
 const g=movingFixture().create(),runtime=g.movingDots.get('0,0'),scope=()=>({...g.board,actors:[g.player,...g.enemies],allowImportedGoodie169:true});runtime.dispatch(2,2);
 assert.equal(g.board.dots[0].x,80);assert.deepEqual(runtime.snapshot().intermediate.pixel,{x:77,y:72});assert.equal(assertMovingBombScope(scope()),true);assert.throws(()=>assertMovingBombScope({...scope(),initial:true,humanStarts:g.board.movingHumanStarts}),/initial/);
 const history=g.board.dots.slice(1).map(d=>d.sourceInBackground),sprite=g.board.connectors[0].sourceHasSprite;g.bombScene.unbonus(g.board.dots[1],false);assert.ok(g.board.dots.slice(1).every(d=>d.kind==='dot'&&!d.bonus&&!(d.cell&2)));assert.deepEqual(g.board.dots.slice(1).map(d=>d.sourceInBackground),history);assert.equal(g.board.connectors[0].sourceHasSprite,sprite);assert.equal(assertMovingBombScope(scope()),true);
 runtime.reset(2);assert.equal(g.board.dots[0].x,74);assert.equal(runtime.snapshot().intermediate.valid,true);assert.equal(assertMovingBombScope(scope()),true);
});
