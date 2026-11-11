import test from 'node:test';import assert from 'node:assert/strict';
import {assertStaticTeleportBusterRecipe,assertStaticTeleportBusterActor,assertStaticTeleportBusterSource} from './static-teleport-busters.mjs';
const recipe={allowStaticTeleportBusters:true,...Object.fromEntries(['FreeBusters','Teleports','Bombs','BombObjectInteractions','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'].map(k=>['allow'+k,true]))};
const block=(kind,rows)=>({kind,count:rows.length,records:rows.map(rawWords=>({rawWords}))});
function fixture(){
 const actor=(type,row,column,programReferenceRaw=-1)=>({actorTypeRaw:type,gridPosition:{row,column},activationMaskRaw:1,initialFrameHalfIndexRaw:0,programReferenceRaw,version12ByteRaw:[0,6].includes(type)?1:0,rawWords:[row,column,type,0,1,programReferenceRaw<0?65535:programReferenceRaw,1,[0,6].includes(type)?0:1]});
 return {structuralStatus:'complete',header:{version:12,displaySizeRaw:8},cells:Array.from({length:88},(_,i)=>({row:Math.floor(i/11),column:i%11,present:true,flagsRaw:i===87?5:i===24?0x4011:1,secondaryRaw:15})),blocks:[{kind:'WA',count:5,records:[actor(0,0,0),actor(6,0,0),actor(5,4,4),actor(5,3,4,0),actor(2,5,5,0)]},{kind:'WP',count:1,records:[{text:'nbnb'}]},block('HY',[[1,1,1,0,15],[6,6,1,0,15]]),block('BO',[[2,2,10,0],[2,3,0,0]]),block('WY',[[2,2,24,65535,0,15]]),block('SP',[[6,4,2,0,0,15]]),block('WL',[[256,7,1,0,3,0]])]};
}
test('static teleport buster recipe is explicit and excludes borrowed moving/EX/gun capabilities',()=>{
 assert.equal(assertStaticTeleportBusterRecipe(recipe),true);for(const k of Object.keys(recipe))assert.throws(()=>assertStaticTeleportBusterRecipe({...recipe,[k]:false}));for(const k of ['allowMovingDots','allowSlidingConnectors','allowGunsTriggers','allowElevators'])assert.throws(()=>assertStaticTeleportBusterRecipe({...recipe,[k]:true}));
});
test('static source admits free and bounce packs, paired HY and an active ordinary WY',()=>{
 assert.equal(assertStaticTeleportBusterSource(fixture()),true);const mutators=[s=>s.blocks[1].records[0].text='ns',s=>s.blocks[0].records[3].rawWords[7]=3,s=>s.cells[0].flagsRaw=0x101,s=>s.blocks.find(b=>b.kind==='HY').records[1].rawWords[2]=2,s=>s.blocks.find(b=>b.kind==='WY').records[0].rawWords[5]=14,s=>s.blocks.find(b=>b.kind==='BO').records[0].rawWords[3]=256];
 for(const change of mutators){const s=fixture();change(s);assert.throws(()=>assertStaticTeleportBusterSource(s));}
});
test('programmed type5 admission requires fixed wall-free class1 n/b with a valid source PC',()=>{
 const a={sourceSlot:2,sourceActorType:5,group:3900,speedClass:1,program:'nb',sourcePC:1,checksWalls:false};assert.equal(assertStaticTeleportBusterActor(a),true);assert.equal(assertStaticTeleportBusterActor({...a,program:null}),true);for(const m of[{program:'f'},{sourcePC:0},{speedClass:3},{checksWalls:true},{movingPivot:true},{sliding:true},{group:500}])assert.throws(()=>assertStaticTeleportBusterActor({...a,...m}));
});
