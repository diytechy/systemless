import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecodedBoard,levelRequirements} from './level.mjs';
const hex=n=>n.toString(16).padStart(4,'0');
const options={angularSpeed:Math.PI*2*960/(76*64),allowMovingMarkedOrdinary:true,allowMovingDots:true,allowMarkedTransfers:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true};
function fixture(){
 let offset=8;
 const cells=Array.from({length:88},(_,i)=>{
  const flagsRaw=({12:1,13:0x2081,14:0x2081,15:0x2081,16:5,23:0x6081,24:3,25:0x83})[i]??0,secondaryRaw=i===23?0x11e:15;
  const c={index:i,row:Math.floor(i/11),column:i%11,offset,flagsRaw,secondaryRaw,present:!!(flagsRaw&1),byteLength:4,rawHex:hex(flagsRaw)+hex(secondaryRaw)};
  if(flagsRaw&128){const text='neswp',rawHex='05'+Buffer.from(text).toString('hex');c.inlineProgram={text,offset:offset+4,rawHex,paddingHex:''};c.rawHex+=rawHex;c.byteLength+=rawHex.length/2;}
  offset+=c.byteLength;return c;
 });
 const record=(w)=>{const r={offset,byteLength:w.length*2,rawWords:w,rawHex:w.map(hex).join('')};offset+=r.byteLength;return r;};
 const wp={offset,text:'nsf',paddingHex:'',rawHex:'036e7366',byteLength:4};offset+=4;
 const actor=(type,row,col,ref,clock,walls)=>{const r=record([row,col,type,0,1,ref<0?65535:ref,1,clock,0,15,walls<<8]);return {...r,actorTypeRaw:type,programReferenceRaw:ref,activationMaskRaw:15,version12ByteRaw:walls,initialFrameHalfIndexRaw:0,gridPosition:{row,column:col}};};
 const actors=[actor(0,1,1,-1,0,1),actor(6,1,1,-1,0,1),actor(1,1,2,0,1,0),actor(3,1,4,-1,1,0)];
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,timeLimitRaw:120},cells,blocks:[{kind:'SP',count:1,records:[record([0,0,0,0,0,14])]},{kind:'WP',count:1,records:[wp]},{kind:'WA',count:4,records:actors}]};
}

test('moving marked ordinary is default off',()=>{assert.throws(()=>buildDecodedBoard(fixture(),{...options,allowMovingMarkedOrdinary:false}));assert.deepEqual(levelRequirements(fixture(),options),[]);});
test('property misses retain source motion and mixed color',()=>{const b=buildDecodedBoard(fixture(),options),d=b.dots.find(d=>d.sourceIndex===23);assert.equal(d.motion,'moving-program');assert.equal(d.transferDeath,false);assert.equal(d.color,3);assert.equal(d.sourceMovingProgram.rawHex,'056e65737770');assert.equal(b.enemies[0].sourceStaticProgram.text,'nsf');});
test('ordinary source composition rejects orbital and Oil capabilities',()=>{for(const name of ['allowRotatingSpikes','allowOil','allowMovingMarkedGoals'])assert.throws(()=>buildDecodedBoard(fixture(),{...options,[name]:true}));});
