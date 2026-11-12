// Invented source declarations; no owned level bytes or artwork.
export const movingGoalRailRecipe=()=>({ordinal:1,title:'Invented moving goal rails',angularSpeed:1,allowMovingGoalRails:true,...Object.fromEntries(['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'].map(k=>['allow'+k,true]))});
export function movingGoalRailSource({goalColor=1}={}){
 const cells=Array.from({length:88},(_,i)=>({index:i,row:Math.floor(i/11),column:i%11,present:true,flagsRaw:1,secondaryRaw:15}));
 const secondary=goalColor===1?255:15;
 Object.assign(cells[24],{flagsRaw:0x4085,secondaryRaw:secondary,offset:104,byteLength:10,rawHex:'4085'+secondary.toString(16).padStart(4,'0')+'046570777000',inlineProgram:{text:'epwp',offset:108,rawHex:'046570777000',paddingHex:'00'}});
 cells[47].flagsRaw=3;cells[49].flagsRaw=0x4001;
 const actor=(row,column,type,program=-1,mask=15)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:mask,initialFrameHalfIndexRaw:24,programReferenceRaw:program,version12ByteRaw:type===0||type===6?1:0,rawWords:[row,column,type,24,1,program<0?65535:program,1,type===0||type===6?0:1,0,mask,type===0||type===6?256:0]});
 const wa=[actor(0,0,0),actor(0,0,6),actor(1,4,1,0),actor(5,7,3),actor(6,3,2),actor(7,5,2,1,14)];
 const block=(kind,records)=>({kind,count:records.length,records});
 return{structuralStatus:'complete',resourceId:1,header:{version:12,displaySizeRaw:8,timeLimitRaw:120},cells,blocks:[block('WA',wa),block('WP',[{text:'fns'},{text:'b'}]),block('SP',[{rawWords:[6,4,2,0,0,15]}]),block('EX',[{rawWords:[4,2,0]},{rawWords:[4,3,0]},{rawWords:[4,4,0]}])]};
}
