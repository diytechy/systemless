import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';

const recipe={ordinal:0,title:'Invented',angularSpeed:1,allowGunsTriggers:true,allowElevators:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowActiveDotMasks:true};
const cell=(row,column,flagsRaw=1,secondaryRaw=15)=>({row,column,present:true,flagsRaw,secondaryRaw});
const wordBlock=(kind,values)=>({kind,count:values.length,records:values.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(row,column,actorTypeRaw,programReferenceRaw=-1)=>({gridPosition:{row,column},actorTypeRaw,activationMaskRaw:15,initialFrameHalfIndexRaw:0,programReferenceRaw,version12ByteRaw:0,rawWords:[row,column,actorTypeRaw,0,1,programReferenceRaw<0?65535:programReferenceRaw,1,actorTypeRaw===1?1:0,0,15,0]});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:300},cells:[cell(7,1),cell(1,6,5),cell(4,2,0x4011,7),cell(3,4,0x4101),cell(5,4,0x4201),cell(0,1),cell(0,4),cell(0,7)],blocks:[
  wordBlock('GN',[[7,0,1,1,2,0,15],[3,3,1,0,1,0,8]]),wordBlock('TR',[[7,1,2,1,0,15]]),wordBlock('EL',[[0,2,2,0,0,15],[1,2,2,0,0,15],[2,4,1,1,0,15],[2,5,3,1,0,15]]),wordBlock('WY',[[4,2,8,65535,0,7]]),
  {kind:'WP',count:1,records:[{text:'sbsb'}]},
  {kind:'WA',count:5,records:[actor(7,1,0),actor(7,1,6),actor(0,1,1,0),actor(0,4,1,0),actor(0,7,1,0)]},
 ]};
}
const rectangle=(left,top,right=left,bottom=top)=>({left,top,right,bottom,rows:null});
const frames=(n,f)=>({frames:Array.from({length:n},()=>({...f}))});
const profiles={
 outlines:{groups:{700:frames(64,rectangle(0,0)),500:frames(64,rectangle(0,0))}},
 elevatorOutlines:{groups:{3400:frames(12,{...rectangle(0,0),collidable:false})}},
 gunOutlines:{groups:{3300:frames(6,rectangle(35,9)),4200:frames(3,rectangle(10,10,12,12))}},
 deathFactory:()=>({update(){},snapshot(){return[];}}),
};

test('GN/TR is opt-in, limited to its exact Child join, and needs original collision frame shapes',()=>{
 const level=fixture();
 assert.ok(levelRequirements(level,{...recipe,allowGunsTriggers:false}).includes('object class GN'));
 assert.ok(levelRequirements(level,{...recipe,allowGunsTriggers:false}).includes('object class TR'));
 assert.throws(()=>buildDecodedBoard(level,{...recipe,allowBombs:true}),/separate Child GN\/TR recipe/);
 const b=buildDecodedBoard(level,recipe);
 assert.deepEqual(b.dots.filter(d=>d.upDown).map(d=>[d.upDown.group,d.upDown.initialLowered]),[[0,true],[1,true]]);
 assert.equal(b.gunTriggerChild.guns.length,1);assert.equal(b.gunTriggerChild.triggers.length,1);
 assert.throws(()=>new SourceRound(b,{...profiles,gunOutlines:undefined}),/Original GN\/TR\/PR/);
});

test('WA trigger birth follows PR layer; a later bullet callback can kill, and reset clears live pool without resetting template clock',()=>{
 const game=new SourceRound(buildDecodedBoard(fixture(),recipe),profiles);
 assert.equal(game.gunTriggers.templateReference,0);
 assert.equal(game.board.dots.filter(d=>d.upDown).every(d=>d.humanCanGrab===false&&d.sourceCollidable===false),true);
 for(let i=0;i<120&&!game.gunTriggers.slots[0];i++)game.update(1/120,{});
 const launch=game.events.find(e=>e.type==='projectile-launch');assert.ok(launch);assert.equal(launch.hand,'player');
 const p=game.gunTriggers.slots[0],before=p.rawBase.x;assert.equal(p.reference,0);assert.equal(game.gunTriggers.triggers[0].occupancy,1);assert.equal(!!game.death,false);
 game.update(1/120,{});assert.equal(p.rawBase.x,before+3);assert.ok(p.reference>0);
 for(let i=0;i<120&&!game.death;i++)game.update(1/120,{});
 const death=game.events.find(e=>e.type==='death');assert.deepEqual(death?.cause,{reason:'projectile',sourceReason:16,object:0});assert.ok(game.gunTriggers.slots[0]);
 const observed=game.gunTriggers.classCount;game.reset();
 assert.equal(game.gunTriggers.classCount,observed);assert.equal(game.gunTriggers.templateReference,0);
 assert.equal(game.gunTriggers.slots.filter(Boolean).length,0);assert.equal(game.gunTriggers.triggers[0].occupancy,0);assert.equal(game.gunTriggers.contacts.size,0);
});

test('multi-gun wall scope clips a translated bullet against a placed wall outline',()=>{
 const level=fixture();
 const actor=(column,type,clock=0)=>({gridPosition:{row:0,column},actorTypeRaw:type,activationMaskRaw:15,
  initialFrameHalfIndexRaw:0,programReferenceRaw:clock?0:-1,version12ByteRaw:clock?0:1,
  rawWords:[0,column,type,0,1,clock?0:65535,1,clock,0,15,clock?0:256]});
 level.cells=[...Array.from({length:6},(_,i)=>cell(0,i)),cell(1,6,5)];
 level.blocks=[
  wordBlock('GN',[[2,3,3,0,8,0,15],[4,4,3,0,1,0,15],[6,8,3,0,8,0,15]]),
  wordBlock('TR',[[6,3,1,0,0,15]]),wordBlock('WL',[[256,3,2,0,2,0]]),
  wordBlock('SP',[[7,1,0,2,0,15],[7,2,0,2,0,15]]),
  {kind:'PU',count:1,records:[{byteLength:10,rawWords:[1,1,2,0,12]}]},
  {kind:'WP',count:1,records:[{text:'n'}]},
  {kind:'WA',count:7,records:[actor(0,0),actor(0,6),...Array.from({length:5},(_,i)=>actor(i+1,1,i?1:3))]},
 ];
 const opts={...recipe,allowElevators:false,allowGunTriggerWalls:true,allowClass3Enemies:true,allowInactiveSpikes:true};
 assert.throws(()=>buildDecodedBoard(level,{...opts,allowGunTriggerWalls:false}),/GN\/TR/);
 const board=buildDecodedBoard(level,opts);
 const game=new SourceRound(board,{...profiles,outlines:{groups:{...profiles.outlines.groups,
  800:frames(1,rectangle(-10,13)),200:frames(4,{...rectangle(0,0),collidable:false})}},
  gunOutlines:{groups:{...profiles.gunOutlines.groups,4200:frames(3,rectangle(0,0))}}});
 const births=game.gunTriggers.activateColor(0).filter(e=>e.type==='projectile-launch');
 assert.deepEqual(births.map(e=>e.bit),[8,1,8]);
 assert.equal(game.projectileHitsWall(game.gunTriggers.slots[0]),false);
 for(let i=0;i<30&&game.gunTriggers.slots[0];i++)game.update(1/120,{});
 assert.deepEqual(game.events.filter(e=>e.type==='projectile-dispose').map(e=>e.gunTrigger.reason),['wall']);
 assert.ok(game.events.some(e=>e.type==='gun-sound'&&e.gunTrigger.id===31));
 assert.equal(game.gunTriggers.slots.filter(Boolean).length,2);
});
