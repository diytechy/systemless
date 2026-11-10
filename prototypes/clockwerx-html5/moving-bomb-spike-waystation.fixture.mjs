// Invented portable source declarations only. No original map or source art.
import {TAU} from './engine.mjs';
export const recipe={angularSpeed:TAU*960/(76*64),allowMovingBombSpikeWaystation:true,allowMovingDots:true,allowBombs:true,allowGoodies:true,allowBombObjectInteractions:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowInactiveSpikes:true,allowRotatingSpikes:true,allowClass3RotatingSpikes:true,allowImportedGoodie169:true};
const hex=n=>n.toString(16).padStart(4,'0'),wh=a=>a.map(hex).join('');
export function fixture({mover=74,program='pewp',color=2,maskMiss=true}={}){
 const specs=new Map([[0,1],[1,3],[10,5],[22,0x4011],[44,3],[45,1],[66,1],[mover,0x4081],[55,0x4009]]);let offset=8;
 const cells=Array.from({length:88},(_,index)=>{const flagsRaw=specs.get(index)??0,secondaryRaw=index===55&&maskMiss?14:index===44?15+(color&1?16:0)+(color&2?256:0)+(color&4?4096:0):15,c={index,row:Math.floor(index/11),column:index%11,offset,flagsRaw,secondaryRaw,present:!!(flagsRaw&1),byteLength:4,rawHex:wh([flagsRaw,secondaryRaw])};if(flagsRaw&128){const paddingHex=(1+program.length)%2?'37':'',rawHex=program.length.toString(16).padStart(2,'0')+Buffer.from(program).toString('hex')+paddingHex;c.inlineProgram={text:program,offset:offset+4,paddingHex,rawHex};c.rawHex+=rawHex;c.byteLength+=rawHex.length/2;}offset+=c.byteLength;return c;});
 const blocks=[],record=w=>{const r={offset,byteLength:w.length*2,rawWords:w,rawHex:wh(w)};offset+=r.byteLength;return r;},block=(kind,records)=>blocks.push({kind,count:records.length,records});
 block('SP',[record([2,3,2,0,0,14]),record([3,8,0,2,0,15]),record([5,7,2,0,0,15])]);
 block('PU',[record([1,5,2,0,14])]);block('BO',[record([4,8,10,248]),record([4,9,1,0x40f8])]);
 block('GO',[record([6,10,169,0,14]),record([1,9,169,0,15])]);block('WY',[record([2,0,10,65535,0,15])]);
 block('WL',[record([0,6,4,0,4,0]),record([256,7,1,1,2,2])]);
 const wp=t=>{const r={offset,text:t,rawHex:t.length.toString(16).padStart(2,'0')+Buffer.from(t).toString('hex'),paddingHex:'',byteLength:1+t.length};offset+=r.byteLength;return r;};block('WP',[wp('fn'),wp('ns'),wp('fn')]);
 const actor=(type,index,ref,clock,walls)=>{const row=Math.floor(index/11),column=index%11,r=record([row,column,type,0,1,ref<0?65535:ref,1,clock,0,15,walls<<8]);return {...r,actorTypeRaw:type,programReferenceRaw:ref,activationMaskRaw:15,version12ByteRaw:walls,initialFrameHalfIndexRaw:0,gridPosition:{row,column}};};
 block('WA',[actor(0,0,-1,0,1),actor(6,0,-1,0,1),actor(1,44,0,1,0),actor(2,45,1,1,0),actor(4,66,-1,3,0)]);
 return {structuralStatus:'complete',sha256:'a'.repeat(64),byteLength:offset+32,resourceId:7,header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,displayRows:8,displayColumns:11,timeLimitRaw:120},cells,blocks};
}
export const tiny={left:-1,right:1,top:-1,bottom:1,rows:[[0,1],[0,1]],flipY:false,outlineIndex:0};
export function profiles(){const frames=n=>Array.from({length:n},()=>structuredClone(tiny));return{outlines:{groups:Object.fromEntries([700,4300,500,4400,3500,200,800].map(g=>[g,{frames:frames(g===200?4:g===800?24:64)}]))},dotOutlines:{groups:{300:{frames:frames(207)}}},bombOutlines:{groups:Object.fromEntries([[1600,18],[1500,12],[1800,10],[1900,17]].map(([g,n])=>[g,{frames:frames(n)}]))}};}
export const routes=[10,1].map(kind=>({kind,points:[[0,0],[1,1]],entryLeg:4,forwardExit:8,reverseExit:2,bomb:kind<4,flipVertical:false,flipHorizontal:false,swap:false}));

