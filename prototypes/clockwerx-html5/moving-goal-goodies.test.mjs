import test from 'node:test';import assert from 'node:assert/strict';
import {assertMovingGoalGoodieRecipe,assertMovingGoalGoodieActor,assertMovingGoalGoodieSource} from './moving-goal-goodies.mjs';
const recipe={allowMovingGoalGoodies:true,...Object.fromEntries(['MovingDots','SlidingConnectors','Goodies','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'].map(k=>['allow'+k,true]))};
const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
function fixture(){
 const cells=Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===48?0x4085:i===37?0x4083:1,secondaryRaw:15}));
 for(const[i,c]of cells.entries())if(c.flagsRaw&0x80){const h=c.flagsRaw.toString(16).padStart(4,'0')+'000f',rawHex='02657700';Object.assign(c,{offset:100+i*8,byteLength:8,rawHex:h+rawHex,inlineProgram:{text:'ew',offset:104+i*8,rawHex,paddingHex:'00'}});}
 const actor=(type,row=0,column=0)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:type===6?40:0,programReferenceRaw:type===1?0:-1,version12ByteRaw:type===1?0:1,rawWords:[row,column,type,type===6?40:0,1,type===1?0:65535,1,type===1?1:0]});
 return{structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells,blocks:[{kind:'WA',count:3,records:[actor(0),actor(6),actor(1,5,5)]},{kind:'WP',count:1,records:[{text:'fnnf'}]},block('EX',[[1,1,0]]),block('GO',[[0,0,0,0,15]]),block('SP',[[0,0,2,0,0,14]])]};
}
test('moving goal/goodie recipe explicitly excludes borrowed door/bomb/teleport flags',()=>{
 assert.equal(assertMovingGoalGoodieRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertMovingGoalGoodieRecipe({...recipe,[k]:false}));for(const k of ['allowBombs','allowTeleports','allowMovingDoorGoodies','allowElevators'])assert.throws(()=>assertMovingGoalGoodieRecipe({...recipe,[k]:true}));
});
test('source-only moving goal/goodie guard accepts closed loops and masked spikes, rejecting new families',()=>{
 assert.equal(assertMovingGoalGoodieSource(fixture()),true);const mutators=[s=>s.blocks.find(b=>b.kind==='SP').records[0].rawWords[5]=15,s=>s.blocks.find(b=>b.kind==='GO').records[0].rawWords[2]=169,s=>s.blocks[1].records[0].text='b',s=>s.blocks[0].records[2].rawWords[7]=3,s=>s.cells[48].inlineProgram.text='ee'];for(const change of mutators){const s=fixture();change(s);assert.throws(()=>assertMovingGoalGoodieSource(s));}
});
test('moving goal/goodie ordinary actor admission retains class1 f/n and source PC bounds',()=>{
 const a={sourceSlot:2,sourceActorType:1,group:500,speedClass:1,program:'fnn',sourcePC:1,checksWalls:false};assert.equal(assertMovingGoalGoodieActor(a),true);for(const m of[{speedClass:3},{sourceActorType:5},{program:'b'},{sourcePC:0},{checksWalls:true}])assert.throws(()=>assertMovingGoalGoodieActor({...a,...m}));
});
