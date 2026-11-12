// Invented map and program payloads only.
export const staticRingDoorRecipe=()=>({ordinal:94,title:'Invented colored ring doors',angularSpeed:1,activeMask:1,allowStaticRingDoors:true,allowCanonicalPlayer:true,allowEnemyStaticPrograms:true,allowSpecialDots:true,allowChildScoring:true});
export function staticRingDoorSource(){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,flagsRaw:0,secondaryRaw:0,present:false}));
 for(const[r,c,f,s=15]of[[0,0,1],[0,1,3],[0,2,5],[1,0,1],[1,1,0x4009,0x100f],[1,2,0x4009,14],[2,0,1],[2,1,0x4051,15],[2,2,0x4009,0x11],[3,0,1]])Object.assign(cells[r*11+c],{flagsRaw:f,secondaryRaw:s,present:true});
 const actor=(type,row,column,ref=-1,mask=15)=>({actorTypeRaw:type,activationMaskRaw:mask,gridPosition:{row,column},initialFrameHalfIndexRaw:0,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,0,1,ref<0?65535:ref,1,type===0||type===6?0:1,0,mask,type===0||type===6?256:0]});
 const blocks={WA:[actor(0,0,0),actor(6,0,0),actor(1,3,0,9),actor(2,2,0,0),actor(3,1,0,-1),actor(1,0,0,8,14)],WP:[{text:'nnn'},{text:'sfns'}],DR:[{rawWords:[4,5,1,256]}],DS:[{rawWords:[3,3,2,0]}],SP:[{rawWords:[6,8,3,3,0,15]}],WY:[{rawWords:[2,1,8,65535,0,7]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},sha256:'0'.repeat(64),byteLength:1024,resourceId:999,cells,blocks:Object.entries(blocks).map(([kind,records])=>({kind,count:records.length,records}))};
}
