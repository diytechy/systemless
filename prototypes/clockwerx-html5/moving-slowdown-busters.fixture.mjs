// Invented declarations only; no game map/program payloads.
import {buildMovingSlowdownBusterBoard} from './moving-slowdown-busters.mjs';
export const movingSlowRecipe=()=>({ordinal:89,title:'Invented moving Slow composition',angularSpeed:1,activeMask:1,allowMovingSlowdownBusters:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','MovingDots','FreeBusters','SlidingConnectors','Bombs','BombObjectInteractions','InactiveSpikes','InactiveRings','StaticEnemyWalls'].map(k=>['allow'+k,true]))});
export function movingSlowSource(){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,offset:8+4*index,flagsRaw:0,secondaryRaw:0,present:false}));
 const dot=(r,c,flags=0x4001,secondary=15,program)=>{
  const d=cells[r*11+c];Object.assign(d,{flagsRaw:flags,secondaryRaw:secondary,present:true});
  if(program){const prefix=program.length.toString(16).padStart(2,'0')+[...program].map(x=>x.charCodeAt(0).toString(16)).join(''),paddingHex=(1+program.length)%2?'00':'';d.inlineProgram={text:program,offset:d.offset+4,rawHex:prefix+paddingHex,paddingHex};d.byteLength=4+d.inlineProgram.rawHex.length/2;d.rawHex=flags.toString(16).padStart(4,'0')+secondary.toString(16).padStart(4,'0')+d.inlineProgram.rawHex;}
  return d;
 };
 for(const[r,c]of[[0,0],[1,1],[1,2],[0,2],[3,0],[3,1],[3,3]])dot(r,c);
 dot(3,0,0x4003);dot(1,3,0x40a1,15,'ns');dot(1,4,0x4081,15,'sn');dot(1,5,0x4021);dot(2,2,0x4009,24);dot(2,4,0x4005);
 const actor=(type,row,column,speed=1,wall=0,ref=-1,half=0,direction=1)=>({activationMaskRaw:15,actorTypeRaw:type,gridPosition:{row,column},rawWords:[row,column,type,half,direction,ref<0?65535:ref,1,speed,0,0,15],programReferenceRaw:ref,initialFrameHalfIndexRaw:half,version12ByteRaw:wall});
 const records={WP:[{text:'ns'}],WA:[actor(0,0,0,0,1),actor(6,0,0,0,1),actor(5,1,1,1,0,-1,5),actor(1,0,2,2),actor(2,1,2,1,1),actor(2,3,3,1,0,0),actor(5,1,1,1,0,-1,13)],EX:[{rawWords:[3,0,0]}],WL:[{rawWords:[0,2,3,0,3,0]}],SP:[{rawWords:[2,3,2,2,0,15]},{rawWords:[6,3,0,2,0,14]}],BO:[{rawWords:[5,0,10,82]},{rawWords:[5,1,11,82]},{rawWords:[4,1,1,82]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:120},sha256:'0'.repeat(64),byteLength:2048,resourceId:999,cells,blocks:Object.entries(records).map(([kind,rs])=>({kind,count:rs.length,records:rs}))};
}
export const movingSlowBoard=()=>buildMovingSlowdownBusterBoard(movingSlowSource(),movingSlowRecipe());
