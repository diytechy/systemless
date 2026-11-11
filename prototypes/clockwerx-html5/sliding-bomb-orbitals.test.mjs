import test from 'node:test';import assert from 'node:assert/strict';import{buildDecodedBoard,levelRequirements}from './level.mjs';
const fixture=()=>{
 const cells=[[0,0,1],[0,1,1],[1,0,5],[1,1,0x4051]].map(([row,column,flagsRaw])=>({present:true,row,column,flagsRaw,secondaryRaw:15}));
 const actor=(type,ref=-1)=>({actorTypeRaw:type,programReferenceRaw:ref,initialFrameHalfIndexRaw:24,activationMaskRaw:15,version12ByteRaw:type===0||type===6?1:0,gridPosition:{row:0,column:0},rawWords:[0,0,type,24,1,ref<0?65535:ref,9,type===0||type===6?0:1]});
 return {structuralStatus:'complete',header:{displaySizeRaw:8,versionRaw:12,timeLimitRaw:90},cells,blocks:[{kind:'WA',count:3,records:[actor(0),actor(6),actor(4,5)]},{kind:'WP',count:1,records:[{text:'nn'}]},{kind:'BO',count:2,records:[{rawWords:[0,0,10,0]},{rawWords:[0,1,0,0]}]},{kind:'EX',count:1,records:[{rawWords:[0,0,0]}]},{kind:'SP',count:1,records:[{rawWords:[0,1,2,0,0,15]}]},{kind:'WY',count:1,records:[{rawWords:[1,1,24,65535,0,7],gridPosition:{row:1,column:1}}]}]};
};
const options={angularSpeed:1,activeMask:1,...Object.fromEntries(['allowSlidingConnectors','allowSlidingBombs','allowSlidingBombOrbitals','allowSlidingBombCheckpoints','allowBombs','allowBombObjectInteractions','allowRotatingSpikes','allowProtectedWaypoints','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowCombinedGoalBonus','allowActiveDotMasks'].map(k=>[k,true]))};
test('imported BO/EX orbital clears missing binding to null and PC1, retaining original reference and PC',()=>{
 const l=fixture();assert.ok(levelRequirements(l,{...options,allowSlidingBombOrbitals:false}).length);
 const b=buildDecodedBoard(l,options),a=b.enemies[0];assert.equal(a.program,null);assert.equal(a.sourcePC,1);assert.equal(a.sourceRawPC,9);assert.equal(a.sourceProgramReference,5);assert.equal(a.sourceProgramCleared,true);assert.equal(a.sourceRawRecord,2);
 l.blocks[0].records[2].programReferenceRaw=0;assert.ok(levelRequirements(l,options).length,'present orbital programs stay unqualified');
});
