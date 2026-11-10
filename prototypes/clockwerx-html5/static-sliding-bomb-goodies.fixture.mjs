export const options={angularSpeed:Math.PI*2*960/(76*64),allowStaticSlidingBombGoodies:true,allowSlidingConnectors:true,allowBombs:true,allowBombObjectInteractions:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true,allowProtectedWaypoints:true,allowInactiveSpikes:true,allowExtendedEnemyClocks:true,allowClass3Enemies:true};
export function fixture(){
 const hex=n=>n.toString(16).padStart(4,'0');let offset=360;
 const cells=Array.from({length:88},(_,i)=>{const flagsRaw=({24:1,25:3,26:1,27:1,19:5,74:0x4051})[i]??0,secondaryRaw=15;return{index:i,row:Math.floor(i/11),column:i%11,offset:8+4*i,flagsRaw,secondaryRaw,present:!!(flagsRaw&1),byteLength:4,rawHex:hex(flagsRaw)+hex(secondaryRaw)};});
 const record=w=>{const r={offset,byteLength:2*w.length,rawWords:w,rawHex:w.map(hex).join('')};offset+=r.byteLength;return r;};
 const blocks=[],block=(kind,records)=>blocks.push({kind,count:records.length,records});
 block('SP',[record([1,1,2,0,0,14])]);block('EX',[record([2,2,0]),record([2,3,0]),record([2,4,0])]);block('BO',[record([4,2,10,248]),record([4,3,1,248])]);block('GO',[record([1,8,169,0,15])]);block('WY',[record([6,8,0,1,0,15])]);block('WL',[record([0,6,1,0,2,0])]);
 const t='bnsf',wp={offset,text:t,rawHex:'04'+Buffer.from(t).toString('hex'),paddingHex:'',byteLength:5};offset+=5;block('WP',[wp]);
 const actor=(type,row,col,ref,clock,walls)=>{const r=record([row,col,type,0,1,ref<0?65535:ref,1,clock,0,15,walls<<8]);return{...r,actorTypeRaw:type,programReferenceRaw:ref,activationMaskRaw:15,version12ByteRaw:walls,initialFrameHalfIndexRaw:0,gridPosition:{row,column:col}};};
 block('WA',[actor(0,2,2,-1,0,1),actor(6,2,2,-1,0,1),actor(1,2,3,0,1,0),actor(2,2,4,0,2,0),actor(3,2,5,-1,3,0)]);
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,serializedRows:8,serializedColumns:11,timeLimitRaw:120},cells,blocks};
}
