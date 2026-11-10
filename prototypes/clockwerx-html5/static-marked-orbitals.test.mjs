import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard} from './level.mjs';
import {SourceRound} from './round.mjs';
import {queryIndexedSourceGrab,grabSourceActor} from './source-grab.mjs';
import {assertStaticMarkedOrbitalScope,assertStaticMarkedOrbitalPhysics,staticMarkedHumanQuery,grabStaticMarkedHuman,advanceStaticMarkedOrbitalCallback} from './static-marked-orbitals.mjs';

// Invented declarations and tiny outlines only; no original level, program or art.
const budget={updates:0,callbacks:0,constructors:0,resets:0};
const charge=kind=>{budget[kind]++;assert.ok(budget.updates+budget.callbacks<=2000,'finite synthetic execution budget');};
after(()=>console.log('STATIC_MARKED_ORBITALS_SYNTHETIC_BUDGET '+JSON.stringify(budget)));
const clone=x=>structuredClone(x),hex=words=>words.map(n=>(n&65535).toString(16).padStart(4,'0')).join('');
const recipe={angularSpeed:1,allowStaticMarkedOrbitals:true,allowMarkedTransfers:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowRotatingSpikes:true,allowRotatingSpikeTransfers:true};
function raw({oldMarked=true,targetMarked=true,targetBonus=false,halfIndex=0,orbitalProgram='s'}={}){
 const declarations=new Map([[12,oldMarked?0x2001:1],[13,targetMarked?0x2001:targetBonus?3:1],[25,3],[36,0x2001],[37,0x2001],[38,5]]);
 const cells=Array.from({length:88},(_,index)=>{const flagsRaw=declarations.get(index)??0;return {index,row:Math.floor(index/11),column:index%11,offset:8+4*index,flagsRaw,secondaryRaw:15,present:!!(flagsRaw&1),byteLength:4,rawHex:hex([flagsRaw,15])};});
 const actor=(type,pivot,index,{mask=1,program=-1,frame=0}={})=>{const rawWords=[Math.floor(pivot/11),pivot%11,type,frame,1,program<0?65535:program,1,type===0||type===6?0:1,0,mask,type===0||type===6?256:0];return {offset:600+22*index,byteLength:22,rawWords,rawHex:hex(rawWords),actorTypeRaw:type,programReferenceRaw:program,activationMaskRaw:mask,version12ByteRaw:rawWords[10]>>>8,initialFrameHalfIndexRaw:frame>32767?frame-65536:frame,gridPosition:{row:rawWords[0],column:rawWords[1]}};};
 const WA=[actor(0,12,0,{frame:halfIndex}),actor(6,12,1,{frame:40}),actor(1,25,2,{mask:8}),actor(4,36,3,{program:0}),actor(2,37,4)];
 const WP=[{offset:500,text:orbitalProgram,paddingHex:'',rawHex:orbitalProgram.length.toString(16).padStart(2,'0')+[...orbitalProgram].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('')}];
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:WA.length,records:WA},{kind:'WP',count:WP.length,records:WP}]};
}
function board(options,overrides={}){return buildDecodedBoard(raw(options),{...recipe,...overrides});}
function profiles(){
 const shape={left:-1,top:-1,right:1,bottom:1,flipY:false,rows:[[0,1],[0,1]],outlineIndex:0};
 const orbital=()=>{const descriptorRaw=Array(15).fill(0);Object.assign(descriptorRaw,{9:42,10:43,13:2,14:2});return {...clone(shape),descriptorRaw,outline:{sha256:'synthetic-outline'}};};
 return {outlines:{groups:Object.fromEntries([700,4300,500,4400,4500,3500].map(group=>[group,{frames:Array.from({length:64},()=>group===3500?orbital():clone(shape))}]))},dotOutlines:{groups:{300:{frames:Array.from({length:207},()=>clone(shape))}}}};
}
function game(options){budget.constructors++;return new SourceRound(board(options),{...profiles(),deathFactory:(pivot,hand)=>({oldPivot:pivot.id,oldFrame:hand.frame,complete:false,update(){},snapshot:()=>[]})});}
function action(g,kind){charge('callbacks');const clock=g.actorClasses;g.actorClasses={snapshot:()=>({classes:[{delta:1}]})};try{g.moveStaticMarkedHuman(g.player,kind);}finally{g.actorClasses=clock;}}
function callback(b,a,extra={}){charge('callbacks');return advanceStaticMarkedOrbitalCallback(b,a,1,{program:a.program,dots:b.dots,guestTick:0,adjustPeriod:n=>n,allowRotatingSpikes:true,allowRotatingSpikeTransfers:true,afterAnimate(){},onDotRelease(){},onDotGrabFirst(){},afterDotGrab(){},...extra},{allowStaticMarkedOrbitals:true});}

test('composition is opt-in and rejects unqualified mechanics before play',()=>{
 for(const flag of ['allowStaticMarkedOrbitals','allowMarkedTransfers','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowRotatingSpikes','allowRotatingSpikeTransfers'])assert.throws(()=>board(undefined,{[flag]:false}));
 for(const overrides of [{allowStaticMarkedOrbitals:1},{allowMovingDots:true},{allowOil:true},{allowSlidingConnectors:true},{activeMask:2}])assert.throws(()=>board(undefined,overrides));
 const b=board();assert.equal(b.movingDotRules,undefined);assert.equal(b.puddles.length,0);
 const corrupt=raw();corrupt.blocks[1].records[0].rawHex='0178';assert.throws(()=>buildDecodedBoard(corrupt,recipe));
 const joined=raw();joined.blocks.push({kind:'EX',count:1,records:[{}]});assert.throws(()=>buildDecodedBoard(joined,recipe));
 const normalized=board();normalized.dots[0].motion='moving-program';assert.throws(()=>assertStaticMarkedOrbitalScope(normalized));
});

test('mask misses retain ordinary pivots and source bit14 rather than deleting cells',()=>{
 const source=raw();Object.assign(source.cells[12],{flagsRaw:0x6001,secondaryRaw:0x10,rawHex:'60010010'});
 const b=buildDecodedBoard(source,recipe),d=b.dots.find(d=>d.sourceIndex===12);
 assert.equal(d.cell,0x4001);assert.equal(d.present,true);assert.equal(d.color,1);assert.equal(d.transferDeath,false);
 assert.equal(b.dots.length,6);assert.equal(b.dots.find(d=>d.sourceIndex===36).transferDeath,true);
});

test('active slots retain raw record/program identity across inactive declarations',()=>{
 const b=board({orbitalProgram:'nsn'}),a=b.enemies[0];assert.equal(a.sourceSlot,2);assert.equal(a.sourceRawRecord,3);assert.equal(a.sourceProgramReference,0);assert.equal(a.program,'nsn');assert.equal(a.sourceStaticProgram.rawHex,'036e736e');
 const changed=clone(b);changed.enemies[0].sourceRawRecord=2;assert.throws(()=>assertStaticMarkedOrbitalScope(changed));
 const rewritten=clone(b);rewritten.enemies[0].sourceStaticProgram.rawHex='036e6e6e';assert.throws(()=>assertStaticMarkedOrbitalScope(rewritten));
});

test('human marked-pair death captures old pose then continues release and target grab',()=>{
 for(const oldMarked of [false,true])for(const targetMarked of [false,true])for(const direction of [-1,1])for(const control of ['flip','swing','bounce'])for(const group of [700,4300]){
  const g=game({oldMarked,targetMarked});g.setPlayerGroup(group);const h=g.player;Object.assign(h,{frame:0,unwrappedFrame:0,angle:0,direction});
  const trace=[],death=g.beginDeath.bind(g),release=g.onHumanRelease.bind(g),grab=g.slideGrabHuman.bind(g);
  g.beginDeath=cause=>{trace.push(['death',h.pivot,h.frame,cause.sourceReason]);return death(cause);};
  g.onHumanRelease=(dot,actor)=>{trace.push(['release',h.pivot]);return release(dot,actor);};
  g.slideGrabHuman=(dot,actor)=>{trace.push(['grab',h.pivot,h.frame]);return grab(dot,actor);};
  action(g,control);const fatal=oldMarked&&targetMarked&&control!=='bounce';assert.equal(!!g.death,fatal);
  if(fatal){assert.deepEqual(trace,[['death','1,1',0,37],['release','1,1'],['grab','2,1',32]]);assert.equal(g.death.oldPivot,'1,1');assert.equal(h.direction,0);assert.equal(g.complete,false);assert.equal(g.childScore.snapshot().roundBonus,0);const transfers=h.transfers;action(g,'flip');assert.equal(h.transfers,transfers);}
  else assert.equal(h.pivot,control==='bounce'?'1,1':'2,1');
 }
});

test('held simultaneous controls cannot make a second fatal transfer',()=>{
 const g=game();for(let i=0;!g.death&&i<128;i++){charge('updates');g.update(1/120,{flip:true,swing:true,bounce:true});}
 assert.ok(g.death);assert.equal(g.player.pivot,'2,1');assert.equal(g.player.transfers,1);assert.equal(g.events.find(e=>e.type==='death').cause.sourceReason,37);
 for(let i=0;i<16;i++){charge('updates');g.update(1/120,{flip:true,swing:true,bounce:true});}assert.equal(g.player.transfers,1);assert.equal(g.complete,false);
});

test('direct human adapter rejects forged queries, omitted capability and async release',()=>{
 const g=game(),b=g.board,h=g.player;assert.throws(()=>staticMarkedHumanQuery(b,h));const query=staticMarkedHumanQuery(b,h,{allowStaticMarkedOrbitals:true}),forged=clone(query);forged.result.allowed=false;
 assert.throws(()=>grabStaticMarkedHuman(b,h,forged,{}, {allowStaticMarkedOrbitals:true}));charge('callbacks');assert.throws(()=>grabStaticMarkedHuman(b,h,query,{physicalPoint:b.dots[0],release:async()=>{},place(){},grab(){},onMarkedDeath(){}},{allowStaticMarkedOrbitals:true}));
 assert.throws(()=>staticMarkedHumanQuery(b,g.enemies[0],{allowStaticMarkedOrbitals:true}));
});

test('type4 crosses marked dots without human death and skips ordinary hooks',()=>{
 const b=board(),a=clone(b.enemies[0]);Object.assign(a,{frame:63,unwrappedFrame:63});const trace=[];
 const result=callback(b,a,{afterAnimate:s=>trace.push(['animate',s.pivot]),onDotRelease:s=>trace.push(['release',s.pivot]),onDotGrabFirst:s=>trace.push(['grab',s.pivot])});
 assert.deepEqual(trace,[['animate','3,3'],['release','3,3'],['grab','4,3']]);assert.equal(result.state.sourceTerminalReason,undefined);assert.equal(result.state.sourcePC,1);
 const ordinary=clone(b.enemies[1]);Object.assign(ordinary,{frame:63,unwrappedFrame:63});assert.equal(callback(b,ordinary).state.sourceTerminalReason,undefined);
 const crossing=clone(b.enemies[1]);Object.assign(crossing,{pivot:'3,3',frame:0,unwrappedFrame:0});
 const dots=b.dots.map(d=>({...d,motionType:0,currentPixel:{x:d.x,y:d.y}})),query=queryIndexedSourceGrab(dots,{originIndex:36,offset:{row:0,column:1},human:false,allowMovingQueries:true}),ordinaryTrace=[];
 charge('callbacks');grabSourceActor(crossing,query,{dots,physicalPoint:dots.find(d=>d.sourceIndex===36).currentPixel,allowMovingQueries:true,allowMarkedTransfers:true,onMarkedDeath(){throw Error('ordinary NPC acquired human marked death');},release:()=>ordinaryTrace.push('release'),place:()=>ordinaryTrace.push('place'),grab:()=>ordinaryTrace.push('grab')});
 assert.equal(crossing.pivot,'4,3');assert.equal(crossing.sourceTerminalReason,undefined);assert.deepEqual(ordinaryTrace,['release','place','grab']);
 const g=game();let calls=0;g.board.switches=[{}];g.doorSystem={snapshot(){calls++;throw Error('ordinary switch hook');}};g.elevators={snapshot(){calls++;throw Error('ordinary elevator hook');}};
 g.contactSwitch(g.enemies[0]);g.contactElevators(g.enemies[0]);assert.equal(calls,0);
});

test('bonus consumption resets and signed raw half-index survives canonical wrapping',()=>{
 const g=game({targetMarked:false,targetBonus:true});action(g,'flip');const target=g.board.dots.find(d=>d.id==='2,1');assert.equal(target.bonus,false);assert.equal(target.collected,true);
 budget.resets++;g.reset();assert.equal(target.bonus,true);assert.equal(target.collected,undefined);assert.equal(g.enemies[0].sourcePC,1);
 const wrapped=game({halfIndex:40});assert.equal(wrapped.board.staticMarkedOrbitalSource.blocks[0].records[0].initialFrameHalfIndexRaw,40);assert.equal(wrapped.player.frame,16);
 const signed=game({halfIndex:65535});assert.equal(signed.board.staticMarkedOrbitalSource.blocks[0].records[0].initialFrameHalfIndexRaw,-1);assert.equal(signed.player.frame,62);
});

test('original-profile dependency contract rejects incomplete metadata and wrong anchors',()=>{
 const b=board(),p=profiles();assertStaticMarkedOrbitalPhysics(b,p.outlines,p.dotOutlines);
 for(const mutate of [p=>delete p.outlines.groups[3500],p=>delete p.outlines.groups[4300],p=>delete p.outlines.groups[3500].frames[63].descriptorRaw,p=>p.outlines.groups[3500].frames[31].left++,p=>delete p.dotOutlines.groups[300].frames[108]]){const bad=profiles();mutate(bad);assert.throws(()=>assertStaticMarkedOrbitalPhysics(b,bad.outlines,bad.dotOutlines));}
});
