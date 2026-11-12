// Invented source data only.
export const staticGunRailRecipe=()=>({ordinal:96,title:'Invented static gun rails',angularSpeed:1,activeMask:1,allowStaticGunRails:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','SlidingConnectors','GunsTriggers'].map(k=>['allow'+k,true]))});
export function staticGunRailSource(){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,flagsRaw:0,secondaryRaw:0,present:false}));
 for(const[r,c,f]of[[0,0,1],[0,1,3],[0,2,1],[1,2,1],[0,3,5],[2,0,1],[2,1,1],[2,2,1]])Object.assign(cells[r*11+c],{flagsRaw:f,secondaryRaw:15,present:true});
 const actor=(type,row,column,half=0,ref=-1,mask=15)=>({actorTypeRaw:type,activationMaskRaw:mask,gridPosition:{row,column},initialFrameHalfIndexRaw:half,programReferenceRaw:ref,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,half,65535,ref<0?65535:ref,1,type===0||type===6?0:1,0,mask,type===0||type===6?256:0]});
 const blocks={WA:[actor(0,0,0),actor(6,0,0,40),actor(1,2,0,0,0),actor(2,2,1,0,1),actor(4,2,2,24,0,14)],WP:[{text:'bfns'},{text:'nsnn'}],EX:[{rawWords:[0,1,0]},{rawWords:[0,2,256]}],GN:[{rawWords:[6,8,3,2,2,0,15]},{rawWords:[5,6,1,1,8,0,14]}],TR:[{rawWords:[6,7,2,2,0,15]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:150},sha256:'0'.repeat(64),byteLength:1024,resourceId:999,cells,blocks:Object.entries(blocks).map(([kind,records])=>({kind,count:records.length,records}))};
}
