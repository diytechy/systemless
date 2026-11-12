// Invented source declarations only; no owned map or program payloads.
export const staticRingRailRecipe=()=>({ordinal:90,title:'Invented ring rails',angularSpeed:1,activeMask:1,allowStaticRingRails:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','SlidingConnectors','InactiveSpikes'].map(k=>['allow'+k,true]))});
export function staticRingRailSource(){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,offset:8+4*index,flagsRaw:0,secondaryRaw:0,present:false}));
 for(const[r,c,f]of[[0,0,1],[0,1,3],[1,1,1],[1,2,9],[2,0,1],[2,1,1],[2,3,5]])Object.assign(cells[r*11+c],{flagsRaw:f,secondaryRaw:15,present:true});
 const actor=(type,row,column,half=0)=>({activationMaskRaw:15,actorTypeRaw:type,gridPosition:{row,column},rawWords:[row,column,type,half,1,65535,1,type===0||type===6?0:1,0,15,type===0||type===6?256:0],programReferenceRaw:-1,initialFrameHalfIndexRaw:half,version12ByteRaw:type===0||type===6?1:0});
 const blocks={WA:[actor(0,0,0),actor(6,0,0,16),actor(1,2,0),actor(2,2,1)],WP:[{text:'bn'}],EX:[{rawWords:[0,0,0]}],SP:[{rawWords:[3,4,0,2,0,15]}],PU:[{rawWords:[1,1,3,0,14]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:100},sha256:'0'.repeat(64),byteLength:1024,resourceId:999,cells,blocks:Object.entries(blocks).map(([kind,records])=>({kind,count:records.length,records}))};
}
