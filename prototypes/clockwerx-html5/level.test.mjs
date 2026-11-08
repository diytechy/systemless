import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceInitialFrame,levelRequirements,buildDecodedBoard} from './level.mjs';
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
test('source half-index selects actual 64-angle descriptor, including wrap',()=>{
 assert.equal(sourceInitialFrame(24),48);assert.equal(sourceInitialFrame(40),16);
 assert.equal(sourceInitialFrame(-1),62);assert.throws(()=>sourceInitialFrame(.5),TypeError);
});
test('decoded single-player board preserves duplicate spike cells and actor identity',()=>{
 const b=buildDecodedBoard(fixture(),{ordinal:2,title:'Synthetic',angularSpeed:TAU});
 assert.equal(b.player.angle,TAU*.75);assert.equal(b.enemies.length,1);
 assert.equal(b.enemies[0].group,4500);assert.equal(b.enemies[0].direction,-1);
 assert.deepEqual(b.spikes.map(s=>[s.x,s.y]),[[98,72],[74,96]]);
 assert.equal(b.dots[1].kind,'bonus');assert.equal(b.player.pivot,'0,0');
});
test('unsupported mechanics, programs and conditional activation fail explicitly',()=>{
 const b=fixture();b.blocks.push({kind:'DR',count:1,records:[]});
 b.blocks[0].records[2].programReferenceRaw=0;b.cells[0].flagsRaw|=0x2000;
 const requirements=levelRequirements(b);
 assert.ok(requirements.includes('object class DR'));assert.ok(requirements.includes('actor programs'));
 assert.ok(requirements.some(r=>r.startsWith('special dot flags')));
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU}),/Unsupported level/);
});
test('inactive difficulty records are not instantiated or program/type qualified',()=>{
 const b=fixture();b.blocks[0].records.push({actorTypeRaw:5,activationMaskRaw:14,programReferenceRaw:0});
 const board=buildDecodedBoard(b,{angularSpeed:TAU});
 assert.equal(board.enemies.length,1);assert.equal(board.inactiveActorCount,1);
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU,activeMask:2}),/unqualified difficulty/);
});
test('missing pivots, wrong human slots and unspecified clock never become playable',()=>{
 const b=fixture();b.blocks[0].records[0].gridPosition.column=9;
 assert.throws(()=>buildDecodedBoard(b,{angularSpeed:TAU}),/absent dot/);
 assert.throws(()=>buildDecodedBoard(fixture()),/angular speed/);
 const c=fixture();c.blocks[0].records[1].actorTypeRaw=2;
 assert.throws(()=>buildDecodedBoard(c,{angularSpeed:TAU}),/human actor slot/);
});
