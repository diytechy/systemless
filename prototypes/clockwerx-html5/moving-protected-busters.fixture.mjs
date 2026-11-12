// Invented declarations only; no owned map/program payloads.
export const movingProtectedBusterRecipe=()=>({ordinal:91,title:'Invented moving protection',angularSpeed:1,activeMask:1,allowMovingProtectedBusters:true,...Object.fromEntries(['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','MovingDots','FreeBusters','Bombs','BombObjectInteractions','StaticEnemyWalls'].map(k=>['allow'+k,true]))});
export function movingProtectedBusterSource(){
 const cells=Array.from({length:88},(_,index)=>({index,row:Math.floor(index/11),column:index%11,offset:8+index*4,flagsRaw:0,secondaryRaw:0,present:false}));
 const dot=(r,c,flags=1,secondary=15,program)=>{const d=cells[r*11+c];Object.assign(d,{flagsRaw:flags,secondaryRaw:secondary,present:true});if(program){const rawHex=program.length.toString(16).padStart(2,'0')+[...program].map(x=>x.charCodeAt(0).toString(16)).join(''),paddingHex=(1+program.length)%2?'00':'';d.inlineProgram={text:program,offset:d.offset+4,rawHex:rawHex+paddingHex,paddingHex};d.byteLength=4+d.inlineProgram.rawHex.length/2;d.rawHex=flags.toString(16).padStart(4,'0')+secondary.toString(16).padStart(4,'0')+d.inlineProgram.rawHex;}};
 for(const[r,c]of[[0,0],[1,1],[2,1],[3,1]])dot(r,c);
 dot(1,3,0x4041,31);dot(2,3,0x4043,0x11f);dot(1,4,0x40c1,15,'ns');dot(0,4,0x83,15,'we');dot(0,5,0x85,15,'ew');
 const actor=(type,row,column,ref=-1,half=0)=>({activationMaskRaw:15,actorTypeRaw:type,gridPosition:{row,column},rawWords:[row,column,type,half,1,ref<0?65535:ref,1,[0,6].includes(type)?0:1,0,15,[0,6].includes(type)?256:0],programReferenceRaw:ref,initialFrameHalfIndexRaw:half,version12ByteRaw:[0,6].includes(type)?1:0});
 const records={WP:[{text:'ns'}],WA:[actor(0,0,0),actor(6,0,0),actor(1,1,1,0),actor(2,2,1),actor(5,3,1,-1,0),actor(5,3,1,-1,8)],WL:[{rawWords:[0,3,2,0,2,0]}],BO:[{rawWords:[5,0,10,248]},{rawWords:[5,1,1,0x40f8]}]};
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8,timeLimitRaw:90},sha256:'0'.repeat(64),resourceId:999,byteLength:2048,cells,blocks:Object.entries(records).map(([kind,records])=>({kind,count:records.length,records}))};
}
