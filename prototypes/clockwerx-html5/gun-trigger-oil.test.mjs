import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
import {SourceRound} from './round.mjs';
import {gunTriggerOilSource,assertGunTriggerOilBoard} from './gun-trigger-oil.mjs';

// Invented source data only (Crossfire-like family: GN/TR + Oil + ring + walls + spikes + class1/3/4 b/f/n/s).
const recipe={ordinal:99,title:'Invented',angularSpeed:1,allowGunsTriggers:true,allowGunTriggerOil:true,allowOil:true,allowCanonicalOil:true,
  allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true,allowClass3Enemies:true,allowActiveDotMasks:true};
const cell=(row,column,flagsRaw=1,secondaryRaw=15)=>({row,column,present:true,flagsRaw,secondaryRaw});
const wordBlock=(kind,values)=>({kind,count:values.length,records:values.map(rawWords=>({rawWords}))});
const actor=(row,column,type,{program=-1,clock=type===0||type===6?0:1,mask=15}={})=>({gridPosition:{row,column},actorTypeRaw:type,activationMaskRaw:mask,
  initialFrameHalfIndexRaw:0,programReferenceRaw:program,version12ByteRaw:type===0||type===6?1:0,
  rawWords:[row,column,type,0,1,program<0?65535:program,1,clock,0,mask,type===0||type===6?256:0]});
function fixture(){
  return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:180},
    cells:[...Array.from({length:6},(_,i)=>cell(0,i)),cell(1,0,9),cell(1,1),cell(1,2),cell(2,6,5)],
    blocks:[
      wordBlock('GN',[[5,3,3,1,2,0,15],[4,0,3,0,2,0,8]]), // one active color1 gun, one inactive
      wordBlock('TR',[[4,4,3,0,0,15]]),                     // active color0 trigger: no matching gun
      wordBlock('WL',[[256,3,2,0,2,0]]),
      wordBlock('SP',[[7,1,0,2,0,15],[7,2,0,2,0,14]]),
      {kind:'PU',count:2,records:[{byteLength:10,rawWords:[0,5,2,0,15]},{byteLength:10,rawWords:[1,2,0,0,15]}]},
      {kind:'WP',count:2,records:[{text:'nnbnnb'},{text:'fnffn'}]},
      {kind:'WA',count:6,records:[actor(0,0,0),actor(0,0,6),actor(0,2,1,{program:1,clock:3}),actor(0,3,2,{program:0,clock:4}),actor(1,1,3),actor(0,4,1,{mask:14})]},
    ]};
}
const rectangle=(left,top,right=left,bottom=top)=>({left,top,right,bottom,rows:null});
const frames=(n,f)=>({frames:Array.from({length:n},()=>({...f}))});
const profiles=()=>({
  outlines:{groups:Object.fromEntries([[700,64],[4300,64],[500,64],[4400,64],[4500,64],[200,4],[800,24]].map(([g,n])=>[g,frames(n,{...rectangle(0,0),collidable:false})]))},
  dotOutlines:{groups:{300:frames(207,rectangle(0,0))}},
  oilOutlines:{groups:{1200:frames(16,rectangle(0,0)),2200:frames(16,rectangle(0,0))}},oilBounds:{left:28,top:28,right:612,bottom:452},
  gunOutlines:{groups:{3300:frames(6,rectangle(35,9)),4200:frames(3,rectangle(10,10,12,12))}},
  deathFactory:()=>({complete:false,update(){},snapshot(){return[];}}),
});

test('GN/TR/Oil family is explicitly flagged and keeps the older wall and Child gun gates closed',()=>{
  assert.deepEqual(levelRequirements(fixture(),recipe),[]);
  assert.ok(levelRequirements(fixture(),{...recipe,allowGunTriggerOil:false}).length,'older families still reject Oil+rings+class4');
  for(const k of['allowGunTriggerWalls','allowElevators','allowBombs','allowSlidingConnectors','allowCanonicalOilSpikes'])assert.ok(levelRequirements(fixture(),{...recipe,[k]:true}).length,k);
  for(const k of['allowOil','allowCanonicalOil','allowGunsTriggers'])assert.ok(levelRequirements(fixture(),{...recipe,[k]:false}).length,k);
});
test('source guard admits mismatched trigger colors but rejects unqualified joins',()=>{
  const spec=gunTriggerOilSource(fixture(),{x:74,y:72},1);assert.equal(spec.guns.length,1);assert.equal(spec.guns[0].color,1);assert.equal(spec.triggers[0].color,0);
  assert.deepEqual(spec.rawBounds,{left:0,top:0,right:584,bottom:424});
  for(const mutate of[
    s=>s.blocks.push(wordBlock('EX',[[0,0,0]])),                       // connectors
    s=>s.blocks.find(b=>b.kind==='PU').records[0].rawWords[2]=3,       // kind3 elevator oil
    s=>s.blocks.find(b=>b.kind==='PU').records.forEach(r=>r.rawWords[4]=14), // no active Oil
    s=>s.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=13,      // conditional spike
    s=>s.cells[0].flagsRaw=0x11,                                       // checkpoint
    s=>s.blocks.find(b=>b.kind==='WA').records[2].rawWords[7]=5,       // class5
    s=>{const a=s.blocks.find(b=>b.kind==='WA').records[2];a.version12ByteRaw=1;a.rawWords[10]=256;}, // wall checking
  ]){const s=fixture();mutate(s);assert.throws(()=>gunTriggerOilSource(s,{x:74,y:72},1),/GN\/TR, Oil/);}
});
test('board builds, constructs and runs; mismatched trigger contact fires nothing',()=>{
  const b=buildDecodedBoard(fixture(),recipe);
  assert.equal(b.gunTriggerOilRules,true);assert.equal(b.canonicalOilRules,true);assert.equal(b.puddles.length,2);assert.equal(b.spikes.length,1);
  assert.equal(b.dots.filter(d=>d.ring).length,1);assert.deepEqual(b.enemies.map(e=>e.speedClass),[3,4,1]);
  assert.equal(assertGunTriggerOilBoard(b,profiles().gunOutlines),true);
  for(const mutate of[x=>x.gunTriggerWallRules=true,x=>x.puddles=[],x=>x.gunTriggerChild.rawBounds.left=28,x=>x.enemies[0].checksWalls=true])
    assert.throws(()=>{const y=buildDecodedBoard(fixture(),recipe);mutate(y);assertGunTriggerOilBoard(y,profiles().gunOutlines);});
  const g=new SourceRound(b,profiles());
  assert.ok(g.oil,'Oil runtime is created');
  const events=g.gunTriggers.contact(g.player,()=>true);
  assert.ok(events.some(e=>e.type==='trigger-contact'));assert.equal(g.gunTriggers.insertionOrder.length,0,'color0 trigger has no color0 gun');
  assert.equal(g.mainDotSprite(b.dots.find(d=>d.ring)).exists,true,'ring main sprite is visible to Oil collision');
  for(let n=0;n<1200;n++)g.update(1/120,n%300<150?{swing:true}:{});
  g.reset();assert.equal(g.gunTriggers.triggers[0].occupancy,0);
});
