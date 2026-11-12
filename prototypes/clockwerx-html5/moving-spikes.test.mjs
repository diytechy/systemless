import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';
import {TAU} from './engine.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {assertMovingSpikeScope,assertMovingSpikePhysics,createMovingSpikeLifecycle,validateMovingSpikeAssets,sourceSpikeInitialFrame} from './moving-spikes.mjs';

// Entirely invented source declarations: no original map/program/art is here.
const budget={rawBuilds:0,roundConstructors:0,roundUpdates:0,helperInvocations:0,explicitResets:0,resetInvocations:0},diagnostics={},run={pid:process.pid,startUTC:new Date().toISOString()};
// Charge only this file's invented rounds when test files share a process.
class BudgetedRound extends SourceRound {
 reset(...a){budget.resetInvocations++;return super.reset(...a);}
 updateSource(...a){budget.roundUpdates++;assert.ok(budget.roundUpdates+budget.helperInvocations<=10000);return super.updateSource(...a);}
}
after(()=>{console.log('MOVING_SPI_SYNTHETIC_RUN '+JSON.stringify({...run,endUTC:new Date().toISOString()}));console.log('MOVING_SPI_SYNTHETIC_BUDGET '+JSON.stringify(budget));console.log('MOVING_SPI_SYNTHETIC_DIAGNOSTICS '+JSON.stringify(diagnostics));});
const clone=x=>structuredClone(x),wh=a=>a.map(x=>x.toString(16).padStart(4,'0')).join('');
const permission=color=>15+(color&1?16:0)+(color&2?256:0)+(color&4?4096:0);
const recipe={angularSpeed:TAU*960/(76*64),allowMovingDots:true,allowMovingSpikes:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowClass3Enemies:true,allowInactiveSpikes:true,allowActiveDotMasks:true};
function raw({movingNear=false,staticNear=false,humanSPI=false,npcSPI=false,maskMiss=false}={}){
 const mover=movingNear?1:74,bonus=staticNear?1:44;
 const specs=new Map([[0,[1,0]],[2,[5,0]],[bonus,[3,5]],[mover,[0x83,2]],[76,[1,0]]]);
 const cells=[];let offset=8;
 for(let i=0;i<88;i++){
  const [flags,color]=specs.get(i)??[0,0],secondary=maskMiss&&i===bonus?(permission(color)&~1):permission(color),c={index:i,row:Math.floor(i/11),column:i%11,offset,flagsRaw:flags,secondaryRaw:secondary,present:!!(flags&1),bonus:!!(flags&2),goal:!!(flags&4),byteLength:4};
  c.rawHex=wh([flags,secondary]);
  if(flags&128){const text=movingNear?'pewp':'ew',paddingHex=(1+text.length)%2?'00':'',rawHex=text.length.toString(16).padStart(2,'0')+[...text].map(c=>c.charCodeAt(0).toString(16)).join('')+paddingHex;c.inlineProgram={text,offset:offset+4,paddingHex,rawHex};c.byteLength+=rawHex.length/2;c.rawHex+=rawHex;}
  offset+=c.byteLength;cells.push(c);
 }
 const spikeWords=[[2,3,2,0,0,14],humanSPI?[0,0,0,0,0,15]:npcSPI?[4,0,0,0,0,15]:[5,7,2,0,0,15],[2,9,2,0,0,15]];
 const SP=spikeWords.map((w,i)=>({rawWords:w,offset:offset+4+i*12,byteLength:12,rawHex:wh(w)}));offset+=4+SP.length*12;
 const WP=[{text:'n',rawHex:'016e',offset:offset+2,byteLength:2}];offset+=4;
 const actor=(type,slot,speed,pivot,program=-1)=>{const w=[Math.floor(pivot/11),pivot%11,type,0,1,program<0?65535:program,1,speed,0,15,type===0||type===6?256:0];const a={actorTypeRaw:type,rawWords:w,rawHex:wh(w),offset,byteLength:22,activationMaskRaw:15,version12ByteRaw:w[10]>>>8,gridPosition:{row:w[0],column:w[1]},initialFrameHalfIndexRaw:0,programReferenceRaw:program};offset+=22;return a;};
 const WA=[actor(0,0,0,0),actor(6,1,0,0),actor(2,2,1,bonus,0),actor(1,3,3,76)];
 const kinds=['HY','SP','WL','DR','DS','PU','BO','GO','WY','WP','WA','TX','EX','EL','GN','TR'];
 return {structuralStatus:'complete',sha256:'a'.repeat(64),byteLength:offset+30,resourceId:1,header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,displayRows:8,displayColumns:11,timeLimitRaw:100},cells,blocks:kinds.map(kind=>{const records=({SP,WP,WA})[kind]??[];return {kind,count:records.length,records};})};
}
function board(opts,overrides={}){budget.rawBuilds++;return buildDecodedBoard(raw(opts),{...recipe,...overrides});}
const small={left:-1,right:1,top:-1,bottom:1,rows:[[0,1],[0,1]],flipY:false};
function profiles(){return {outlines:{groups:Object.fromEntries([700,4300,500,4400,4500].map(g=>[g,{frames:Array.from({length:64},()=>clone(small))}]).concat([['200',{frames:Array.from({length:4},(_,f)=>({left:[-5,-5,-6,-6][f],right:[13,13,12,12][f],top:[-4,-5,-5,-4][f],bottom:[14,13,13,14][f],rows:Array.from({length:18},()=>[0,17]),flipY:false}))}]]))},dotOutlines:{groups:{'300':{frames:Array.from({length:207},()=>clone(small))}}}};}
function game(opts){const b=board(opts);budget.roundConstructors++;return new BudgetedRound(b,{...profiles(),deathFactory:()=>({complete:false,update(){},snapshot(){return [];}})});}
function reset(g){budget.explicitResets++;g.reset();}
const noHooks={guestTick:0,adjustPeriod:n=>n,afterAnimate:()=>{},onDotRelease:()=>{},onDotGrabFirst:()=>{},afterDotGrab:()=>{}};
function helper(b,a=b.enemies[0],extra={}){budget.helperInvocations++;return advanceStaticEnemyCallback(a,0,{...noHooks,program:a.program,dots:b.dots,allowMovingDots:true,allowMovingSpikes:true,movingSpikeScope:b,sourceQuery:()=>({allowed:false}),...extra});}
function assets(){const body=[1,3,5,6,9,11,13,14];return {dotVariants:Object.fromEntries(body.map(f=>[`${f<9?'bonus':'normal'}:${f-(f<9?1:9)}`,{file:`body${f}.svg`,sourceGroup:300,sourceDescriptor:300+f,x:-5,y:-4,width:10,height:10}])),sourceDotShadows:{file:'shadows.svg',frames:body.map(frame=>({frame,x:20,y:20,width:10,height:10,sourceImage:frame<9?frame:0}))},sourceGoalMisc:{file:'goal.svg',frames:Array.from({length:6},(_,j)=>{const frame=17+j,size=[18,18,16,14,16,18][j];return {frame,sourceGroup:300,sourceFrame:frame,x:(32-size)/2,y:(32-size)/2,width:size,height:size};})},spikes:{frames:Array.from({length:4},(_,f)=>({file:`spike${f}.svg`,sourceGroup:200,sourceFrame:f,x:[-5,-5,-6,-6][f],y:[-4,-5,-5,-4][f],width:18,height:18}))}};}

test('default-off source; mask-before-ordinal/cap and inactive property stripping',()=>{
 const r=raw();assert.ok(levelRequirements(r,{...recipe,allowMovingSpikes:false}).length);assert.throws(()=>board(undefined,{allowMovingSpikes:false}));
 const b=board();assert.deepEqual(b.spikes.map(s=>[s.id,s.phase,s.row,s.column]),[[0,0,5,7],[1,1,2,9]]);assert.equal(b.movingSpikeSource.spikes.length,3);assert.equal(b.dots.find(d=>d.sourceIndex===44).color,5);
 const miss=board({maskMiss:true}),d=miss.dots.find(d=>d.sourceIndex===44);assert.equal(d.bonus,false);assert.equal(d.sourceInitialBonus,false);assert.equal(d.cell,1);assertMovingSpikeScope(miss,{initial:true});
});
test('malformed raw programs/mode/type/bytes and forbidden family joins reject',()=>{
 const changes=[r=>r.header.version=11,r=>r.header.displaySizeRaw=7,r=>r.cells[44].flagsRaw|=8,r=>r.blocks.find(b=>b.kind==='SP').records[1].rawWords[2]=4,r=>r.blocks.find(b=>b.kind==='WA').records[2].version12ByteRaw=1,r=>r.blocks.find(b=>b.kind==='WP').records[0].text='s',r=>r.blocks.find(b=>b.kind==='WA').records[3].rawWords[7]=2,r=>{const q=r.blocks.find(b=>b.kind==='BO');q.records=[{}];q.count=1;}];
 for(const mutate of changes){const r=raw();mutate(r);budget.rawBuilds++;assert.throws(()=>buildDecodedBoard(r,recipe));}
 for(const flag of ['allowMovingCheckpointRings','allowMovingMarkedBonuses','allowTeleports','allowSlidingConnectors','allowOil','allowExtendedEnemyClocks'])assert.throws(()=>board(undefined,{[flag]:true}));
 assert.throws(()=>board(undefined,{allowMovingSpikes:1}));assert.throws(()=>board(undefined,{allowCanonicalPlayer:'true'}));
});
test('normalized/delta0 boundaries reject mutation but permit consumed static bonus',()=>{
 const mutations=[b=>b.activeMask=2,b=>b.sourceGrid.rows=7,b=>b.resourceId++,b=>b.movingSpikeSource={...b.movingSpikeSource,sha256:new String('a'.repeat(64))},b=>b.enemies[0].group=700,b=>b.player.group=500,b=>b.enemies[0].frame=64,b=>b.enemies[0].sourcePC=0,b=>b.enemies[1].program='n',b=>b.spikes[0].phase=3,b=>b.spikes[0].x-=8,b=>b.goodies.push({}),b=>b.dots[0].humanCanGrab=false,b=>b.dots.find(d=>d.sourceIndex===44).sourceInitialBonus=false,b=>delete b.dots[0].sourceInBackground,b=>b.movingSpikeRules=false];
 for(const mutate of mutations){const b=clone(board());mutate(b);assert.throws(()=>assertMovingSpikeScope(b));assert.throws(()=>helper(b));budget.roundConstructors++;assert.throws(()=>new BudgetedRound(b,{...profiles(),deathFactory:()=>({complete:false,update(){},snapshot(){return [];}})}));}
 const b=board(),d=b.dots.find(d=>d.sourceIndex===44);d.bonus=false;d.cell&=~2;d.kind='dot';d.collected=true;assertMovingSpikeScope(b);helper(b);
 assert.throws(()=>helper(b,b.enemies[0],{program:'s'}));assert.throws(()=>helper(b,b.enemies[0],{sourceQuery:async()=>({allowed:false})}));
});
test('new assets/physics mandatory with correct source SPI DTOs',()=>{
 const b=board(),a=assets(),p=profiles();assertMovingSpikePhysics(b,p.outlines,p.dotOutlines);validateMovingSpikeAssets(b,a);
 const noSPI=clone(a);delete noSPI.spikes;assert.throws(()=>validateMovingSpikeAssets(b,noSPI));
 const mixed=clone(a);delete mixed.dotVariants['bonus:5'];assert.throws(()=>validateMovingSpikeAssets(b,mixed));
 const missing=clone(p);missing.outlines.groups['200'].frames.pop();assert.throws(()=>assertMovingSpikePhysics(b,missing.outlines,missing.dotOutlines));
 assert.throws(()=>createMovingSpikeLifecycle(b.spikes));
 const wrong=clone(a);wrong.spikes.frames[1].sourceFrame=0;assert.throws(()=>validateMovingSpikeAssets(b,wrong));
});
test('SPI mode filter precedes32 capacity; class1 bfns accepts while class3 programs reject',()=>{
 const r=raw(),sp=r.blocks.find(b=>b.kind==='SP'),start=sp.records[0].offset;
 sp.records=Array.from({length:33},(_,i)=>{const w=[2,3,0,0,0,i?15:14];return {rawWords:w,rawHex:wh(w),offset:start+12*i,byteLength:12};});sp.count=33;r.byteLength+=360;
 budget.rawBuilds++;const b=buildDecodedBoard(r,recipe);assert.equal(b.spikes.length,32);assert.equal(b.spikes[0].phase,0);assert.equal(b.spikes[31].phase,3);
 const life=createMovingSpikeLifecycle(b.spikes,{allowMovingSpikes:true,sourceScope:b});assert.deepEqual(life.snapshot().spikes.map(s=>s.frame),Array.from({length:32},(_,i)=>sourceSpikeInitialFrame(i)));assert.equal(sourceSpikeInitialFrame(1),1);assert.throws(()=>sourceSpikeInitialFrame(32));
 const bad=clone(r);bad.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=15;bad.blocks.find(b=>b.kind==='SP').records[0].rawHex=wh(bad.blocks.find(b=>b.kind==='SP').records[0].rawWords);budget.rawBuilds++;assert.throws(()=>buildDecodedBoard(bad,recipe));
 const p=raw(),wp=p.blocks.find(b=>b.kind==='WP').records[0];wp.text='bfns';wp.rawHex='0462666e73';wp.byteLength=5;budget.rawBuilds++;const programmed=buildDecodedBoard(p,recipe);helper(programmed);
 const badClass=clone(programmed);badClass.enemies[0].speedClass=3;assert.throws(()=>helper(badClass));
});
test('legally reached static bonus clears once, retains foreground identity and resets',()=>{
 const g=game({staticNear:true});assert.equal(g.board.dots.filter(d=>d.bonus).length,2);assert.equal(g.events.filter(e=>e.type==='bonus').length,0);assert.equal(g.childScore.snapshot().roundBonus,0);
 for(let i=0;i<80&&!g.events.some(e=>e.type==='bonus');i++)g.update(1/120,{swing:true});
 const events=g.events.filter(e=>e.type==='bonus');assert.equal(events.length,1);assert.equal(events[0].points,1000);const d=g.board.dots.find(d=>d.sourceIndex===1);assert.equal(d.bonus,false);assert.equal(d.sourceInitialBonus,true);assert.equal(d.sourceInBackground,false);assert.equal(d.sourceHasSprite,true);assertMovingSpikeScope(g.board);
 for(let i=0;i<32;i++)g.update(1/120,{});assert.equal(g.events.filter(e=>e.type==='bonus').length,1);
 const journal=g.sourcePaint.backgroundPaints;reset(g);assert.notEqual(g.sourcePaint.backgroundPaints,journal);assert.equal(d.bonus,true);assert.equal(d.sourceHasSprite,true);
});
test('legal moving bonus entry uses current rider point; no synthetic NPC initial collection',()=>{
 const g=game({movingNear:true});assert.equal(g.events.filter(e=>e.type==='bonus').length,0);
 for(let i=0;i<80&&!g.events.some(e=>e.type==='bonus');i++)g.update(1/120,{swing:true});
 assert.equal(g.events.filter(e=>e.type==='bonus').length,1);const d=g.board.dots.find(d=>d.sourceIndex===1);assert.equal(g.player.pivot,d.id);const start=g.point(g.player).x;let moved=false;
 for(let i=0;i<160;i++){g.update(1/120,{});assert.equal(g.point(g.player).x,d.x);if(d.x!==start)moved=true;}assert.ok(moved);assert.equal(g.events.filter(e=>e.type==='bonus').length,1);
});
test('nondefault SPI frame/ref retained across two resets; fresh instance initializes',()=>{
 const g=game();for(let i=0;i<256;i++)g.update(1/120,{});const before=g.movingSpikes.snapshot();assert.ok(before.spikes.some(s=>s.reference>0));assert.ok(before.spikes.some(s=>s.frame!==s.identity[7]));
 g.board.spikes[0].visible=false;reset(g);assert.equal(g.board.spikes[0].visible,true);assert.deepEqual(g.movingSpikes.snapshot(),before);reset(g);assert.deepEqual(g.movingSpikes.snapshot(),before);
 const fresh=game();assert.deepEqual(fresh.movingSpikes.snapshot().bank,[0,0,0,0]);assert.deepEqual(fresh.movingSpikes.snapshot().spikes.map(s=>s.frame),[0,1]);
 const bad=game();bad.board.spikes[0].phase=3;assert.throws(()=>reset(bad));
 const replaced=game();replaced.board.spikes=clone(replaced.board.spikes);assert.throws(()=>reset(replaced));
 const sourceChanged=game();sourceChanged.board.movingSpikeSource={...sourceChanged.board.movingSpikeSource,sha256:'b'.repeat(64)};assert.throws(()=>reset(sourceChanged));
});
test('upstream MT advances in death while derived bank/ref freeze; resumed legal poll zero then one',()=>{
 const g=game();for(let i=0;i<128;i++)g.update(1/120,{});g.beginDeath({reason:'synthetic-source-reset'});const bank=g.movingSpikes.snapshot(),count=g.spikeCount;
 for(let i=0;i<512;i++)g.update(1/120,{});assert.ok(g.spikeCount>count);assert.deepEqual(g.movingSpikes.snapshot(),bank);diagnostics.beforeDeath={upstream:count,state:bank};diagnostics.afterDeath={upstream:g.spikeCount,state:g.movingSpikes.snapshot()};
 reset(g);g.update(1/120,{});const first=g.movingSpikes.snapshot();assert.deepEqual(first.spikes,bank.spikes);assert.ok(first.bank.some((n,i)=>n!==bank.bank[i]));
 g.update(1/120,{});const next=g.movingSpikes.snapshot();for(const [i,s]of next.spikes.entries()){assert.equal(s.reference,first.bank[s.identity[7]]);assert.equal(s.frame,(bank.spikes[i].frame+1)%4);}diagnostics.recovery={first,next};
 g.movingSpikes.poll(g.board.spikes);budget.helperInvocations++;assert.deepEqual(g.movingSpikes.snapshot(),next);
});
test('human SPI contact precedes input; NPC SPI overlap adds no enemy death hook',()=>{
 const g=game({humanSPI:true});for(let i=0;i<32&&!g.death;i++)g.update(1/120,{swing:true});assert.ok(g.death);assert.equal(g.events.filter(e=>e.type==='transfer'||e.type==='bonus').length,0);
 const npc=game({npcSPI:true});for(let i=0;i<128;i++)npc.update(1/120,{});assert.equal(npc.death,null);assert.equal(npc.enemies[0].visible,true);
});
test('normal-stage bank latch follows SPI death-latch callback, then stops in death stage',()=>{
 const g=game({humanSPI:true}),ticks=[];let row=[];
 for(const [object,key,label]of [[g.movingSpikes,'poll','SPI-poll'],[g,'spikeCollision','human-SPI'],[g,'moveMovingHuman','input'],[g.movingSpikes,'latchBank','bank-latch']]){const old=object[key];object[key]=function(...a){row.push(label);return old.apply(this,a);};}
 for(let i=0;i<32&&!g.death;i++){row=[];g.update(1/120,{swing:true});ticks.push([...row]);}
 const kill=ticks.at(-1);assert.ok(kill.indexOf('SPI-poll')<kill.indexOf('human-SPI'));assert.ok(kill.indexOf('human-SPI')<kill.indexOf('bank-latch'));assert.equal(kill.includes('input'),false);
 row=[];g.update(1/120,{});assert.deepEqual(row,[]);diagnostics.deathLatchOrder={normalKillTick:kill,nextDeathTick:row};
});
