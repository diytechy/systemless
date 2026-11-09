import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceInitialFrame,levelRequirements,buildDecodedBoard,decodedGridOrigin} from './level.mjs';
import {TAU} from './engine.mjs';

function fixture(){
 const actor=(type,col,direction=1)=>({actorTypeRaw:type,programReferenceRaw:-1,
  initialFrameHalfIndexRaw:24,activationMaskRaw:15,gridPosition:{row:0,column:col},
  rawWords:[0,col,type,24,direction,65535,1,type===0?0:1]});
 return {structuralStatus:'complete',header:{displaySizeRaw:8},resourceId:999,
  cells:[{present:true,flagsRaw:1,secondaryRaw:15,row:0,column:0},
   {present:true,flagsRaw:3,secondaryRaw:15,row:0,column:1}],
  blocks:[{kind:'WA',count:3,records:[actor(0,0),actor(6,0),actor(3,1,65535)]},
   {kind:'SP',count:2,records:[{rawWords:[0,0,0,2,0,15]},{rawWords:[0,0,2,0,0,15]}]}]};
}

test('bomb object interactions require an explicit compatible scene opt-in',()=>{
 const level=fixture();level.header.timeLimitRaw=90;
 assert.ok(levelRequirements(level,{allowBombObjectInteractions:true}).some(s=>s.includes('bomb object interactions')));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowBombs:true,allowSpecialDots:true,allowEnemyStaticPrograms:true,allowStaticEnemyWalls:true,allowBombObjectInteractions:true});
 assert.equal(board.bombObjectInteractionRules,true);
 assert.equal(buildDecodedBoard(level,{angularSpeed:TAU}).bombObjectInteractionRules,undefined);
});

test('canonical player decoding requires explicit static Child callback qualification',()=>{
 const level=fixture();assert.ok(levelRequirements(level,{allowCanonicalPlayer:true}).some(s=>s.includes('canonical player')));
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowStaticEnemyWalls:true,allowCanonicalPlayer:true};
 assert.equal(buildDecodedBoard(level,options).canonicalPlayerRules,true);
 assert.equal(buildDecodedBoard(level,{angularSpeed:TAU}).canonicalPlayerRules,undefined);
 assert.equal(buildDecodedBoard(level,{...options,allowOil:true}).puddles.length,0);
 level.blocks.push({kind:'PU',count:1,records:[{rawWords:[0,0,1,0,15]}]});
 assert.ok(levelRequirements(level,{...options,allowOil:true}).some(s=>s.includes('without sliding')));
});

test('active elevators require the raised group1 scope and retain inactive source records',()=>{
 const level=fixture();level.header.timeLimitRaw=120;level.blocks=level.blocks.filter(b=>b.kind!=='SP');
 const npc=level.blocks[0].records[2];npc.actorTypeRaw=1;npc.rawWords[2]=1;npc.version12ByteRaw=0;
 level.cells[0].flagsRaw=0x201;
 level.blocks.push({kind:'EL',count:2,records:[{rawWords:[0,0,3,1,0,15]},{rawWords:[0,1,3,0,0,14]}]},{kind:'PU',count:1,records:[{rawWords:[0,0,0,0,12]}]});
 const options={angularSpeed:TAU,allowElevators:true,allowOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveUpDownDots:true};
 const board=buildDecodedBoard(level,options);assert.equal(board.elevatorRules,true);assert.equal(board.elevators.length,1);assert.equal(board.elevators[0].group,1);assert.equal(board.puddles.length,0);assert.equal(board.dots[0].motion,'up-down');assert.equal(board.dots[0].sourceInBackground,false);assert.deepEqual(board.dots[0].upDown,{group:1,initialLowered:false,x:74,y:72});
 assert.ok(levelRequirements(level,{...options,allowElevators:false}).includes('object class EL'));
 for(const flags of [0x101,0x301,0x4201,0x203]){level.cells[0].flagsRaw=flags;assert.ok(levelRequirements(level,options).includes('only plain initially raised white group1 dots are qualified'));}level.cells[0].flagsRaw=0x201;
 npc.rawWords[7]=4;assert.ok(levelRequirements(level,options).includes('elevators require wall-free ordinary class1 enemies'));npc.rawWords[7]=1;
 level.blocks.at(-1).records[0].rawWords[4]=15;assert.ok(levelRequirements(level,options).includes('elevators with other hazards or special objects are unqualified'));level.blocks.at(-1).records[0].rawWords[4]=12;
 level.cells[1].flagsRaw=0x101;level.cells[1].secondaryRaw=12;const inactive=buildDecodedBoard(level,options).dots[1];assert.equal(inactive.motion,'static');assert.equal(inactive.upDown,undefined);assert.equal(inactive.present,true);
});

test('group0 elevators with Oil and static spikes require a separate kind3 composition',()=>{
 const level=fixture();level.header.timeLimitRaw=270;level.cells[0].flagsRaw=0x101;level.blocks[0].records[2].version12ByteRaw=0;
 level.blocks.push({kind:'PU',count:1,records:[{rawWords:[0,0,3,0,15]}]},{kind:'EL',count:1,records:[{rawWords:[0,0,2,0,0,15]}]});
 const options={angularSpeed:TAU,allowElevators:true,allowOil:true,allowCanonicalOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true};
 assert.ok(levelRequirements(level,options).includes('elevators with other hazards or special objects are unqualified'));
 const qualified={...options,allowElevatorOilSpikes:true},board=buildDecodedBoard(level,qualified);
 assert.equal(board.elevatorOilSpikeRules,true);assert.equal(board.dots[0].upDown.group,0);assert.equal(board.puddles[0].kind,3);
 assert.ok(levelRequirements(level,{...qualified,allowCanonicalOilSpikes:true}).includes('elevator Oil/spikes require the separate canonical group0 composition'));
 level.blocks.at(-2).records[0].rawWords[2]=2;assert.ok(levelRequirements(level,qualified).includes('elevator Oil/spikes require kind3 puddles and active static spikes'));level.blocks.at(-2).records[0].rawWords[2]=3;
 level.blocks.at(-1).records[0].rawWords[2]=3;assert.ok(levelRequirements(level,qualified).includes('only group0 left half-cell controls with Oil/spikes are qualified'));
});

test('canonical Oil composition is explicit and retains its ordinary static Child boundary',()=>{
 const level=fixture();level.header.timeLimitRaw=90;level.blocks=level.blocks.filter(b=>b.kind!=='SP');level.blocks[0].records[2].version12ByteRaw=0;
 level.blocks.push({kind:'PU',count:1,records:[{rawWords:[0,0,1,0,15]}]});
 const options={angularSpeed:TAU,allowOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowClass3Enemies:true};
 assert.ok(levelRequirements(level,options).includes('static enemy transfer with active Oil'));
 const board=buildDecodedBoard(level,{...options,allowCanonicalOil:true});assert.equal(board.canonicalOilRules,true);assert.equal(board.puddles.length,1);
 assert.ok(levelRequirements(level,{...options,allowCanonicalOil:true,allowCanonicalPlayer:false}).some(x=>x.includes('canonical Oil requires Child movement')));
 for(const flags of [0x4009,0x4041,7]){level.cells[1].flagsRaw=flags;assert.ok(levelRequirements(level,{...options,allowCanonicalOil:true}).includes('canonical Oil requires ordinary dots and uncolored static checkpoints'));}
 level.cells[1].flagsRaw=0x4011;level.cells[1].secondaryRaw=31;assert.ok(levelRequirements(level,{...options,allowCanonicalOil:true}).includes('canonical Oil requires ordinary dots and uncolored static checkpoints'));level.cells[1].flagsRaw=3;level.cells[1].secondaryRaw=15;
 level.blocks[0].records[2].rawWords[7]=4;assert.ok(levelRequirements(level,{...options,allowCanonicalOil:true}).includes('canonical Oil enemy composition is unqualified'));
 level.blocks[0].records[2].rawWords[7]=3;assert.equal(buildDecodedBoard(level,{...options,allowCanonicalOil:true}).enemies[0].divisor,4);
 level.blocks.push({kind:'SP',count:1,records:[{rawWords:[0,0,0,2,0,15]}]});assert.ok(levelRequirements(level,{...options,allowCanonicalOil:true}).includes('canonical Oil with additional hazards is unqualified'));
});

test('static spikes with canonical Oil require a bounded kind2 composition opt-in',()=>{
 const level=fixture();level.header.timeLimitRaw=150;level.blocks[0].records[2].version12ByteRaw=0;
 level.blocks.push({kind:'PU',count:1,records:[{rawWords:[0,0,2,0,15]}]});
 const options={angularSpeed:TAU,allowOil:true,allowCanonicalOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true};
 assert.ok(levelRequirements(level,options).includes('canonical Oil with additional hazards is unqualified'));
 const qualified={...options,allowCanonicalOilSpikes:true};
 assert.equal(buildDecodedBoard(level,qualified).canonicalOilSpikeRules,true);
 assert.ok(levelRequirements(level,{...qualified,allowCanonicalOil:false}).includes('Oil spikes require canonical Oil and large-display geometry'));
 level.blocks.at(-1).records[0].rawWords[2]=1;assert.ok(levelRequirements(level,qualified).includes('Oil spikes require kind2 puddles and active static spikes'));level.blocks.at(-1).records[0].rawWords[2]=2;
 level.blocks[0].records[2].rawWords[7]=3;assert.ok(levelRequirements(level,qualified).includes('Oil spikes require wall-free ordinary class1 enemies'));level.blocks[0].records[2].rawWords[7]=1;
 level.blocks.push({kind:'WL',count:1,records:[]});assert.ok(levelRequirements(level,qualified).includes('Oil spikes require ordinary static dots without other objects'));
});

test('Oil with free slow red hands requires separate static wall qualification',()=>{
 const level=fixture();level.header.timeLimitRaw=90;level.blocks=level.blocks.filter(b=>b.kind!=='SP');level.blocks.push({kind:'PU',count:1,records:[{rawWords:[0,0,1,0,15]}]});
 const actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:1,version12ByteRaw:1});actor.rawWords[2]=1;actor.rawWords[7]=4;
 const options={angularSpeed:TAU,allowOil:true,allowCanonicalOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true};
 assert.ok(levelRequirements(level,options).includes('canonical Oil enemy composition is unqualified'));
 const qualified={...options,allowStaticEnemyWalls:true},board=buildDecodedBoard(level,qualified);assert.equal(board.enemies[0].checksWalls,true);assert.equal(board.enemies[0].divisor,8);
 actor.version12ByteRaw=0;assert.equal(buildDecodedBoard(level,qualified).enemies[0].checksWalls,false);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'n'}]});assert.ok(levelRequirements(level,qualified).includes('canonical Oil enemy composition is unqualified'));actor.programReferenceRaw=-1;
 for(const type of [2,3]){actor.actorTypeRaw=type;assert.ok(levelRequirements(level,qualified).includes('canonical Oil enemy composition is unqualified'));}
 actor.actorTypeRaw=1;actor.rawWords[7]=1;actor.version12ByteRaw=1;assert.ok(levelRequirements(level,qualified).includes('canonical Oil enemy composition is unqualified'));
});

test('rotating spikes require their own bounded opt-in and preserve noncardinal pose',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];actor.actorTypeRaw=4;actor.rawWords[2]=4;actor.version12ByteRaw=0;actor.initialFrameHalfIndexRaw=4;
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowRotatingSpikes:true};
 assert.ok(levelRequirements(level,{allowEnemyStaticPrograms:true}).includes('actor type 4'));
 const board=buildDecodedBoard(level,options),spike=board.enemies[0];
 assert.equal(board.rotatingSpikeRules,true);assert.equal(spike.group,3500);assert.equal(spike.frame,8);assert.equal(spike.canonicalFrame,true);
 assert.equal(spike.direction,-1);assert.equal(spike.checksWalls,false);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'nnnn'}]});
 assert.equal(buildDecodedBoard(level,options).enemies[0].sourcePC,1);
 actor.rawWords[6]=0;assert.ok(levelRequirements(level,options).includes('rotating spike program PC must skip length byte'));actor.rawWords[6]=1;
 level.blocks.at(-1).records[0].text='s';assert.ok(levelRequirements(level,options).includes('rotating spike program capability'));
 actor.programReferenceRaw=-1;actor.rawWords[7]=3;assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 actor.rawWords[7]=1;actor.version12ByteRaw=1;assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 actor.version12ByteRaw=0;assert.ok(levelRequirements(level,{allowRotatingSpikes:true}).includes('rotating spike canonical clock without walls'));
 actor.actorTypeRaw=5;assert.ok(levelRequirements(level,options).includes('actor type 5'));
});

test('free class2 orbitals require a separate capability and retain divisor8 multiplier3',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:4,version12ByteRaw:0});actor.rawWords[7]=2;
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowRotatingSpikes:true};
 assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 const qualified={...options,allowClass2RotatingSpikes:true},board=buildDecodedBoard(level,qualified);
 assert.equal(board.class2RotatingSpikeRules,true);assert.equal(board.enemies[0].divisor,8);assert.equal(board.enemies[0].multiplier,3);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'nnnn'}]});assert.ok(levelRequirements(level,qualified).includes('class2 rotating spike requires a free clock'));
 actor.programReferenceRaw=-1;actor.actorTypeRaw=2;assert.ok(levelRequirements(level,qualified).includes('actor speed class 2'));
});

test('free class3 orbitals require a separate capability and retain divisor4 multiplier1',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:4,version12ByteRaw:0});actor.rawWords[7]=3;
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowRotatingSpikes:true};
 assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 const qualified={...options,allowClass3RotatingSpikes:true},board=buildDecodedBoard(level,qualified);
 assert.equal(board.class3RotatingSpikeRules,true);assert.equal(board.enemies[0].divisor,4);assert.equal(board.enemies[0].multiplier,1);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'nnnn'}]});assert.ok(levelRequirements(level,qualified).includes('class3 rotating spike requires a free clock'));
 actor.programReferenceRaw=-1;actor.version12ByteRaw=1;assert.ok(levelRequirements(level,qualified).includes('rotating spike canonical clock without walls'));
 actor.version12ByteRaw=0;actor.rawWords[7]=2;assert.ok(levelRequirements(level,qualified).includes('rotating spike canonical clock without walls'));
});

test('fast rotating-spike clocks and n/s transfers require independent capabilities',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:4,version12ByteRaw:0,programReferenceRaw:0});actor.rawWords[7]=5;
 level.blocks.push({kind:'WP',count:1,records:[{text:'nsns'}]});
 const options={angularSpeed:TAU,allowRotatingSpikes:true,allowEnemyStaticPrograms:true,allowExtendedEnemyClocks:true};
 assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 assert.ok(levelRequirements(level,options).includes('rotating spike program capability'));
 options.allowFastRotatingSpikes=true;assert.ok(levelRequirements(level,options).includes('rotating spike program capability'));
 options.allowRotatingSpikeTransfers=true;const board=buildDecodedBoard(level,options);
 assert.equal(board.enemies[0].divisor,1);assert.equal(board.enemies[0].speedClass,5);assert.equal(board.fastRotatingSpikeRules,true);assert.equal(board.rotatingSpikeTransferRules,true);
 level.blocks.at(-1).records[0].text='f';assert.ok(levelRequirements(level,options).includes('rotating spike program capability'));
 level.blocks.at(-1).records[0].text='ns';delete options.allowExtendedEnemyClocks;assert.ok(levelRequirements(level,options).includes('actor speed class 5'));
});

test('orbital bounces require separate program qualification from transfers',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:4,version12ByteRaw:0,programReferenceRaw:0});actor.rawWords[2]=4;
 level.blocks.push({kind:'WP',count:1,records:[{text:'nnnb'}]});
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowRotatingSpikes:true,allowRotatingSpikeTransfers:true};
 assert.ok(levelRequirements(level,options).includes('rotating spike program capability'));
 const board=buildDecodedBoard(level,{...options,allowRotatingSpikeBounces:true});assert.equal(board.rotatingSpikeBounceRules,true);assert.equal(board.enemies[0].program,'nnnb');
 level.blocks.at(-1).records[0].text='f';assert.ok(levelRequirements(level,{...options,allowRotatingSpikeBounces:true}).includes('rotating spike program capability'));
});

test('slow class4 orbitals require their own capability without widening other clocks or walls',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];Object.assign(actor,{actorTypeRaw:4,version12ByteRaw:0});actor.rawWords[2]=4;actor.rawWords[7]=4;
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true,allowRotatingSpikes:true};
 assert.ok(levelRequirements(level,options).includes('rotating spike canonical clock without walls'));
 assert.ok(levelRequirements(level,{...options,allowFastRotatingSpikes:true}).includes('rotating spike canonical clock without walls'));
 const board=buildDecodedBoard(level,{...options,allowSlowRotatingSpikes:true});
 assert.equal(board.slowRotatingSpikeRules,true);assert.equal(board.enemies[0].speedClass,4);assert.equal(board.enemies[0].divisor,8);assert.equal(board.enemies[0].multiplier,1);assert.equal(board.enemies[0].canonicalFrame,true);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'n'}]});assert.ok(levelRequirements(level,{...options,allowSlowRotatingSpikes:true}).includes('slow rotating spike requires a free clock'));actor.programReferenceRaw=-1;
 for(const speedClass of [2,3,5]){actor.rawWords[7]=speedClass;assert.ok(levelRequirements(level,{...options,allowSlowRotatingSpikes:true}).includes('rotating spike canonical clock without walls'));}
 actor.rawWords[7]=4;actor.version12ByteRaw=1;assert.ok(levelRequirements(level,{...options,allowSlowRotatingSpikes:true}).includes('rotating spike canonical clock without walls'));
});

test('inactive elevator controls and up/down properties preserve plain usable pivots',()=>{
 const level=fixture();level.cells[1].flagsRaw=0x101;level.cells[1].secondaryRaw=8;
 level.blocks.push({kind:'EL',count:1,records:[{rawWords:[0,1,3,0,0,8]}]});
 assert.ok(levelRequirements(level).includes('object class EL'));
 assert.throws(()=>buildDecodedBoard(level,{angularSpeed:TAU}),/Unsupported/);
 const options={angularSpeed:TAU,allowInactiveElevators:true,allowInactiveUpDownDots:true};
 const dot=buildDecodedBoard(level,options).dots[1];assert.equal(dot.cell,1);assert.equal(dot.present,true);assert.equal(dot.motion,'static');assert.equal(dot.humanCanGrab,true);assert.equal(dot.nonhumanCanGrab,true);assert.equal(dot.kind,'dot');
 level.blocks.at(-1).records[0].rawWords[5]=1;assert.ok(levelRequirements(level,options).includes('object class EL'));
 level.blocks.at(-1).records[0].rawWords[5]=8;level.cells[1].secondaryRaw=15;
 assert.ok(levelRequirements(level,options).some(x=>x.startsWith('special dot flags')));
 level.cells[1].secondaryRaw=8;level.cells[1].flagsRaw=0x103;assert.throws(()=>buildDecodedBoard(level,options),/Unsupported/);
});

test('combined bonus and goal requires explicit Child callback qualification',()=>{
 const level=fixture();level.header.timeLimitRaw=150;level.cells[1].flagsRaw=7;
 assert.ok(levelRequirements(level).includes('combined bonus/goal callback'));
 assert.ok(levelRequirements(level,{allowCombinedGoalBonus:true}).includes('combined goal/bonus requires source Child scoring'));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowCombinedGoalBonus:true,allowChildScoring:true,allowSpecialDots:true});
 assert.equal(board.combinedGoalBonusRules,true);assert.equal(board.dots[1].kind,'goal');assert.equal(board.dots[1].bonus,true);assert.equal(board.dots[1].cell,7);
});
test('source half-index selects actual 64-angle descriptor, including wrap',()=>{
 assert.equal(sourceInitialFrame(24),48);assert.equal(sourceInitialFrame(40),16);
 assert.equal(sourceInitialFrame(-1),62);assert.throws(()=>sourceInitialFrame(.5),TypeError);
});
test('display size centers dot/object grids while leaving text in its fixed frame',()=>{
 assert.deepEqual(decodedGridOrigin({displaySizeRaw:8}),{x:74,y:72});
 assert.deepEqual(decodedGridOrigin({displaySizeRaw:7}),{x:98,y:96});
 const level=fixture();level.header.displaySizeRaw=7;
 level.blocks.push({kind:'TX',count:1,records:[{fontName:'Geneva',fontSize:12,fontFaceRaw:0,renderingStyleByteRaw:0,positionWords:[20,30],text:'Synthetic'}]});
 const board=buildDecodedBoard(level,{angularSpeed:TAU});
 assert.deepEqual([board.dots[0].x,board.dots[0].y],[98,96]);
 assert.deepEqual([board.texts[0].x,board.texts[0].y],[48,58]);
 assert.throws(()=>decodedGridOrigin({displaySizeRaw:9}),/Unqualified/);
});
test('decoded single-player board preserves duplicate spike cells and actor identity',()=>{
 const b=buildDecodedBoard(fixture(),{ordinal:2,title:'Synthetic',angularSpeed:TAU});
 assert.equal(b.player.angle,TAU*.75);assert.equal(b.enemies.length,1);
 assert.equal(b.enemies[0].group,4500);assert.equal(b.enemies[0].direction,-1);
 assert.deepEqual(b.spikes.map(s=>[s.x,s.y]),[[98,72],[74,96]]);
 assert.equal(b.dots[1].kind,'bonus');assert.equal(b.player.pivot,'0,0');
});
test('unsupported mechanics, programs and conditional activation fail explicitly',()=>{
 const b=fixture();b.blocks.push({kind:'PU',count:1,records:[]});
 b.blocks[0].records[2].programReferenceRaw=0;b.cells[0].flagsRaw|=0x2000;
 const requirements=levelRequirements(b);
 assert.ok(requirements.includes('object class PU'));assert.ok(requirements.includes('actor programs'));
 assert.ok(requirements.some(r=>r.startsWith('special dot flags')));
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU}),/Unsupported level/);
});
test('actor speed class is word7 and preserves a quarter-rate class4 enemy',()=>{
 const level=fixture();level.blocks[0].records[2].rawWords[7]=4;
 const board=buildDecodedBoard(level,{angularSpeed:TAU});
 assert.equal(board.player.speedScale,1);assert.equal(board.enemies[0].divisor,8);assert.equal(board.enemies[0].speedScale,.25);
 level.blocks[0].records[2].rawWords[7]=2;
 assert.ok(levelRequirements(level).includes('actor speed class 2'));
});
test('class3 ordinary enemies qualify independently of bombs without enabling other actors or classes',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];actor.rawWords[7]=3;actor.version12ByteRaw=0;
 assert.ok(levelRequirements(level).includes('actor speed class 3'));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowClass3Enemies:true,allowEnemyStaticPrograms:true});
 assert.equal(board.enemies[0].speedClass,3);assert.equal(board.enemies[0].divisor,4);
 assert.equal(board.enemies[0].canonicalFrame,true);assert.equal(board.bombRules,false);
 actor.rawWords[7]=2;assert.ok(levelRequirements(level,{allowClass3Enemies:true}).includes('actor speed class 2'));
 actor.rawWords[7]=3;level.blocks[0].records[0].rawWords[7]=3;
 assert.ok(levelRequirements(level,{allowClass3Enemies:true}).includes('actor speed class 3'));
 level.blocks.push({kind:'BO',count:1,records:[]});
 assert.ok(levelRequirements(level,{allowClass3Enemies:true}).includes('object class BO'));
});
test('inactive difficulty records are not instantiated or program/type qualified',()=>{
 const b=fixture();b.blocks[0].records.push({actorTypeRaw:5,activationMaskRaw:14,programReferenceRaw:0});
 const board=buildDecodedBoard(b,{angularSpeed:TAU});
 assert.equal(board.enemies.length,1);assert.equal(board.inactiveActorCount,1);
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU,activeMask:2}),/unqualified difficulty/);
});

test('extended enemy clocks require canonical ordinary actors and preserve class2/5 timing',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];actor.version12ByteRaw=0;
 const options={angularSpeed:TAU,allowExtendedEnemyClocks:true,allowEnemyStaticPrograms:true};
 for(const speedClass of [2,5]){
  actor.rawWords[7]=speedClass;
  assert.ok(levelRequirements(level,{allowEnemyStaticPrograms:true}).includes('actor speed class '+speedClass));
  assert.ok(levelRequirements(level,{allowExtendedEnemyClocks:true}).includes('actor speed class '+speedClass));
  const enemy=buildDecodedBoard(level,options).enemies[0];
  assert.equal(enemy.speedClass,speedClass);assert.equal(enemy.canonicalFrame,true);
  assert.equal(enemy.divisor,speedClass===2?8:1);assert.equal(enemy.multiplier,speedClass===2?3:1);
 }
 level.blocks[0].records[0].rawWords[7]=2;
 assert.ok(levelRequirements(level,options).includes('actor speed class 2'));
 level.blocks[0].records[0].rawWords[7]=0;actor.rawWords[7]=6;
 assert.ok(levelRequirements(level,options).includes('actor speed class 6'));
});

test('initially open doors require an independent gate while existing closed doors remain available',()=>{
 const level=fixture(),door={rawWords:[0,0,0,0x100]};
 level.blocks.push({kind:'DR',count:1,records:[door]});
 assert.ok(levelRequirements(level).includes('initially open doors'));
 assert.throws(()=>buildDecodedBoard(level,{angularSpeed:TAU}),/initially open doors/);
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowInitiallyOpenDoors:true});
 assert.equal(board.doors[0].initiallyClosed,false);assert.equal(board.doors[0].long,true);
 door.rawWords[2]=1;assert.ok(!levelRequirements(level).includes('initially open doors'));
 assert.equal(buildDecodedBoard(level,{angularSpeed:TAU}).doors[0].initiallyClosed,true);
});
test('inactive spikes require qualification and do not consume an active sprite phase',()=>{
 const level=fixture(),spikes=level.blocks.find(b=>b.kind==='SP').records;
 spikes[0].rawWords[5]=14;
 assert.ok(levelRequirements(level).includes('conditional spike activation'));
 assert.throws(()=>buildDecodedBoard(level,{angularSpeed:TAU}),/conditional spike activation/);
 let board=buildDecodedBoard(level,{angularSpeed:TAU,allowInactiveSpikes:true});
 assert.equal(board.spikes.length,1);assert.equal(board.spikes[0].id,0);assert.equal(board.spikes[0].phase,0);
 assert.deepEqual([board.spikes[0].x,board.spikes[0].y],[74,96]);
 spikes[1].rawWords[5]=12;board=buildDecodedBoard(level,{angularSpeed:TAU,allowInactiveSpikes:true});
 assert.equal(board.spikes.length,0);assert.equal(board.dots.length,2);
 spikes[0].rawWords[5]=3;
 assert.ok(levelRequirements(level,{allowInactiveSpikes:true}).includes('conditional spike activation'));
 spikes[0].rawWords.pop();
 assert.ok(levelRequirements(level,{allowInactiveSpikes:true}).includes('conditional spike activation'));
});
test('explicit matching dot masks preserve active properties and color without opening mask-miss behavior',()=>{
 const b=fixture();b.cells[1].secondaryRaw=0x13;
 assert.ok(levelRequirements(b).includes('conditional dot activation'));
 const board=buildDecodedBoard(b,{angularSpeed:TAU,allowActiveDotMasks:true});
 assert.equal(board.dots[1].present,true);assert.equal(board.dots[1].kind,'bonus');assert.equal(board.dots[1].color,1);assert.equal(board.dots[1].humanCanGrab,true);
 b.cells[1].secondaryRaw=12;assert.ok(levelRequirements(b,{allowActiveDotMasks:true}).includes('conditional dot activation'));
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU,allowActiveDotMasks:true}),/conditional dot activation/);
});
test('plain mask misses retain pivots, Child colors and serialized stride through a separate gate',()=>{
 const level=fixture();level.header.displaySizeRaw=7;
 Object.assign(level.cells[1],{flagsRaw:0x4001,secondaryRaw:0xe00c,row:2,column:3});
 level.blocks[0].records[2].gridPosition={row:2,column:3};
 assert.ok(levelRequirements(level,{allowActiveDotMasks:true}).includes('conditional dot activation'));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowInactivePlainDotMasks:true});
 const dot=board.dots[1];assert.equal(dot.id,'3,2');assert.equal(dot.sourceIndex,25);
 assert.deepEqual([dot.x,dot.y,dot.color],[242,192,0]);
 assert.equal(dot.present,true);assert.equal(dot.humanCanGrab,true);assert.equal(dot.nonhumanCanGrab,true);
 assert.equal(dot.kind,'dot');assert.equal(dot.sourceInBackground,true);
 level.cells[1].flagsRaw=0x4003;
 assert.ok(levelRequirements(level,{allowInactivePlainDotMasks:true}).includes('conditional dot activation'));
 level.cells[1].flagsRaw=0x4001;level.cells[1].secondaryRaw=3;
 assert.ok(levelRequirements(level,{allowInactivePlainDotMasks:true}).includes('conditional dot activation'));
});
test('missing pivots, wrong human slots and unspecified clock never become playable',()=>{
 const b=fixture();b.blocks[0].records[0].gridPosition.column=9;
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU}),/absent dot/);
 assert.throws(()=>buildDecodedBoard(fixture()),/angular speed/);
 const c=fixture();c.blocks[0].records[1].actorTypeRaw=2;
 assert.throws(()=>buildDecodedBoard(c,{angularSpeed:TAU}),/human actor slot/);
});
test('Oil activation requires explicit opt-in, filters source masks and preserves slot permissions',()=>{
 const level=fixture();level.blocks.push({kind:'PU',count:2,records:[{rawWords:[0,0,0,0,12]},{rawWords:[0,0,1,0,15]}]});
 assert.ok(levelRequirements(level).includes('object class PU'));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowOil:true});
 assert.equal(board.puddles.length,1);assert.equal(board.puddles[0].kind,1);
 assert.equal(board.dots[1].sourceIndex,1);assert.equal(board.dots[1].humanCanGrab,true);
 assert.equal(board.dots[1].nonhumanCanGrab,true);assert.equal(board.dots[1].sourceCollidable,true);
});
test('bounce program qualification preserves Pascal PC/frame and rejects transfers/wall coupling',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];actor.programReferenceRaw=0;actor.version12ByteRaw=0;
 level.blocks.push({kind:'WP',count:1,records:[{text:'bb'}]});
 assert.ok(levelRequirements(level).includes('actor programs'));
 const board=buildDecodedBoard(level,{angularSpeed:TAU,allowEnemyBouncePrograms:true});
 assert.equal(board.enemies[0].program,'bb');assert.equal(board.enemies[0].sourcePC,1);assert.equal(board.enemies[0].frame,48);
 actor.version12ByteRaw=1;assert.ok(levelRequirements(level,{allowEnemyBouncePrograms:true}).includes('programmed wall-reacting actor'));
 actor.version12ByteRaw=0;level.blocks.at(-1).records[0].text='sf';
 assert.ok(levelRequirements(level,{allowEnemyBouncePrograms:true}).includes('non-bounce actor program'));
});

test('static special-dot opt-in preserves WY reset definitions, runtime permissions and enemy PCs',()=>{
 const level=fixture();level.header.timeLimitRaw=90;level.cells[0].flagsRaw=9;level.cells[1].flagsRaw=0x4011;
 const actor=level.blocks[0].records[2];actor.version12ByteRaw=0;actor.programReferenceRaw=0;
 level.blocks.push({kind:'WP',count:1,records:[{text:'nsbf'}]},{kind:'WY',count:1,records:[{rawWords:[0,1,24,65535,0,15]}]});
 assert.ok(levelRequirements(level).some(r=>r.includes('special dot')));
 const b=buildDecodedBoard(level,{angularSpeed:TAU,allowSpecialDots:true,allowEnemyStaticPrograms:true});
 assert.equal(b.specialDotRules,true);assert.equal(b.staticEnemyCallbacks,true);assert.equal(b.dots[0].ring,true);
 assert.deepEqual(b.dots[1].waystation,{halfIndex:24,direction:-1});assert.equal(b.dots[0].nonhumanCanGrab,true);
 assert.equal(b.enemies[0].canonicalFrame,true);assert.equal(b.enemies[0].visible,true);assert.equal(b.enemies[0].sourcePC,1);
 level.cells[0].flagsRaw=0x49;assert.ok(levelRequirements(level,{allowSpecialDots:true}).includes('combined special dot properties'));
 level.cells[0].flagsRaw=7;assert.ok(levelRequirements(level).includes('combined bonus/goal callback'));
});
test('protected waypoints need their own composition gate and preserve both specifications',()=>{
 const level=fixture();level.header.timeLimitRaw=90;level.cells[1].flagsRaw=0x4051;level.cells[1].secondaryRaw=7;
 level.blocks.push({kind:'WY',count:1,records:[{rawWords:[0,1,24,65535,0,7]}]});
 const options={angularSpeed:TAU,allowSpecialDots:true,allowActiveDotMasks:true};
 assert.ok(levelRequirements(level,options).includes('combined special dot properties'));
 const board=buildDecodedBoard(level,{...options,allowProtectedWaypoints:true});
 assert.equal(board.dots[1].protected,true);assert.equal(board.dots[1].ring,false);
 assert.deepEqual(board.dots[1].waystation,{halfIndex:24,direction:-1});
 level.cells[1].flagsRaw=0x4049;
 assert.ok(levelRequirements(level,{...options,allowProtectedWaypoints:true}).includes('combined special dot properties'));
});
test('goodies qualify separately from BO and retain an ignored out-of-range frame request',()=>{
 const level=fixture();level.header.timeLimitRaw=120;
 level.blocks.find(b=>b.kind==='SP').records.forEach(r=>r.rawWords[5]=14);
 level.blocks.push({kind:'GO',count:1,records:[{rawWords:[0,0,169,0,3]}]});
 assert.ok(levelRequirements(level).includes('object class GO'));
 const options={angularSpeed:TAU,allowSpecialDots:true,allowInactiveSpikes:true,allowGoodies:true};
 const board=buildDecodedBoard(level,options);
 assert.equal(board.bombRules,false);assert.equal(board.goodieOnlyRules,true);assert.deepEqual(board.bombs,[]);
 assert.equal(board.goodies[0].initialFrame,169);assert.equal(board.spikes.length,0);
 assert.ok(levelRequirements(level,{...options,allowSpecialDots:false}).includes('goodie-only source timer qualification'));
 assert.ok(levelRequirements(level,{...options,allowBombs:true}).some(r=>r.includes('exclusive')));
 const spikes=level.blocks.find(b=>b.kind==='SP').records;
 spikes.forEach(r=>r.rawWords[5]=15);assert.ok(levelRequirements(level,options).includes('goodies with active spikes'));
 spikes.forEach(r=>r.rawWords[5]=14);level.cells[1].flagsRaw=0x4009;
 assert.ok(levelRequirements(level,options).includes('goodies with rings'));level.cells[1].flagsRaw=1;
 level.blocks.push({kind:'BO',count:1,records:[]});assert.ok(levelRequirements(level,options).includes('object class BO'));
});
test('canonical wall response is qualified independently while programmed walls stay gated',()=>{
 const level=fixture(),actor=level.blocks[0].records[2];actor.version12ByteRaw=1;
 const options={angularSpeed:TAU,allowEnemyStaticPrograms:true};
 assert.ok(levelRequirements(level,options).includes('canonical enemy wall response'));
 const board=buildDecodedBoard(level,{...options,allowStaticEnemyWalls:true});
 assert.equal(board.staticEnemyWallRules,true);assert.equal(board.enemies[0].checksWalls,true);
 actor.programReferenceRaw=0;level.blocks.push({kind:'WP',count:1,records:[{text:'b'}]});
 assert.ok(levelRequirements(level,{...options,allowStaticEnemyWalls:true}).includes('programmed wall-reacting actor'));
 const qualified={...options,allowStaticEnemyWalls:true,allowProgrammedEnemyWalls:true};
 assert.equal(buildDecodedBoard(level,qualified).enemies[0].program,'b');
 assert.ok(levelRequirements(level,{...qualified,allowStaticEnemyWalls:false}).includes('programmed wall-reacting actor'));
 assert.ok(levelRequirements(level,{...qualified,allowEnemyStaticPrograms:false,allowEnemyBouncePrograms:true}).includes('programmed wall-reacting actor'));
});


test('inactive ring qualification preserves a plain pivot and permission color without enabling active rings',()=>{
 const level=fixture();level.header.timeLimitRaw=90;level.cells[1]={...level.cells[1],flagsRaw:0x4009,secondaryRaw:0xf00e};
 const base={angularSpeed:TAU,allowSpecialDots:true};
 assert.ok(levelRequirements(level,base).includes('conditional dot activation'));
 const options={...base,allowInactiveRings:true},dot=buildDecodedBoard(level,options).dots[1];
 assert.equal(dot.cell,0x4001);assert.equal(dot.ring,false);assert.equal(dot.sourceInBackground,true);
 assert.equal(dot.flags,0xf00e);assert.equal(dot.color,4);assert.equal(dot.humanCanGrab,true);assert.equal(dot.nonhumanCanGrab,true);
 level.cells[1].secondaryRaw=14;assert.equal(buildDecodedBoard(level,options).dots[1].color,0);
 level.cells[1].secondaryRaw=1;assert.ok(levelRequirements(level,options).includes('conditional dot activation'),'inactive gate does not qualify a mask match');
 level.cells[1].secondaryRaw=14;level.cells[1].flagsRaw=0x4019;assert.ok(levelRequirements(level,options).includes('combined special dot properties'),'other optional properties remain gated');
});


test('bomb/Oil/two-group elevators have an explicit gate and clear only qualified inactive properties',()=>{
 const level=fixture();level.header.timeLimitRaw=270;level.blocks=level.blocks.filter(b=>b.kind!=='SP');
 Object.assign(level.cells[0],{flagsRaw:0x101});Object.assign(level.cells[1],{flagsRaw:0x201});
 level.cells.push({present:true,flagsRaw:0x301,secondaryRaw:8,row:1,column:0});
 level.blocks[0].records[2].version12ByteRaw=0;
 level.blocks.push({kind:'EL',count:2,records:[{rawWords:[0,0,1,0,0,15]},{rawWords:[0,1,3,1,0,15]}]},
  {kind:'PU',count:2,records:[{rawWords:[0,0,0,0,15]},{rawWords:[0,1,2,0,15]}]},
  {kind:'BO',count:1,records:[{rawWords:[0,0,0,0]}]});
 const options={angularSpeed:TAU,allowElevators:true,allowOil:true,allowCanonicalOil:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowBombs:true,allowBombObjectInteractions:true,allowInactiveUpDownDots:true};
 assert.ok(levelRequirements(level,options).length>0);
 const qualified={...options,allowBombOilElevators:true},board=buildDecodedBoard(level,qualified);
 assert.equal(board.bombOilElevatorRules,true);assert.deepEqual(board.dots.slice(0,2).map(d=>d.upDown.group),[0,1]);
 assert.equal(board.dots[2].cell,1);assert.equal(board.dots[2].motion,'static');assert.equal(board.dots[2].present,true);assert.equal(level.cells[2].flagsRaw,0x301);
 assert.ok(levelRequirements(level,{...qualified,allowInactiveUpDownDots:false}).length>0);
 level.cells[2].secondaryRaw=15;assert.ok(levelRequirements(level,qualified).includes('bomb/Oil/elevators require plain raised white group0/1 dots'));level.cells[2].secondaryRaw=8;
 level.blocks.find(b=>b.kind==='PU').records[0].rawWords[2]=3;assert.ok(levelRequirements(level,qualified).includes('bomb/Oil/elevators require kind0/2 Oil and a bomb inventory'));level.blocks.find(b=>b.kind==='PU').records[0].rawWords[2]=0;
 level.blocks.find(b=>b.kind==='EL').records[0].rawWords[2]=2;assert.ok(levelRequirements(level,qualified).includes('bomb/Oil/elevators require group0 upper and group1 center controls'));
});
