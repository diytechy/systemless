// Invented declarations, unrelated to any owned level payload.
export const movingTeleportCheckpointRecipe=()=>({ordinal:95,title:'Invented moving HY checkpoint',angularSpeed:1,activeMask:1,allowMovingTeleportCheckpoints:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','MovingDots','Teleports','InactiveSpikes'].map(k=>['allow'+k,true]))});
export function movingTeleportCheckpointSource({wallAtTeleport=false}={}){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,flagsRaw:0,secondaryRaw:0,present:false}));
 for(const[r,c,f]of[[0,0,1],[0,1,1],[0,2,0x4011],[2,1,1],[4,4,0x83],[5,7,1],[7,9,5]])Object.assign(cells[r*11+c],{flagsRaw:f,secondaryRaw:15,present:true});
 Object.assign(cells[48],{offset:200,byteLength:10,rawHex:'0083000f046570777000',inlineProgram:{text:'epwp',offset:204,rawHex:'046570777000',paddingHex:'00'}});
 const actor=(type,row,column,ref=-1,speed=1,mask=15)=>({actorTypeRaw:type,activationMaskRaw:mask,gridPosition:{row,column},initialFrameHalfIndexRaw:0,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,0,1,ref<0?65535:ref,1,type===0||type===6?0:speed,0,mask,type===0||type===6?256:0]});
 const blocks={WA:[actor(0,0,0),actor(6,0,0),actor(1,4,4,0,2),actor(2,5,7,1),actor(4,4,4,-1,5,14)],WP:[{text:'fnn'},{text:'nsn'}],HY:[{rawWords:[0,1,4,0,15]},{rawWords:[2,1,4,0,15]}],WY:[{rawWords:[0,2,9,65535,0,3]}],SP:[{rawWords:[6,9,3,3,0,15]},{rawWords:[5,4,2,1,0,14]}],WL:[{rawWords:wallAtTeleport?[0,2,1,0,1,0]:[0,7,5,0,7,0]}],PU:[{rawWords:[3,5,2,0,14]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},sha256:'0'.repeat(64),byteLength:1024,resourceId:999,cells,blocks:Object.entries(blocks).map(([kind,records])=>({kind,count:records.length,records}))};
}
