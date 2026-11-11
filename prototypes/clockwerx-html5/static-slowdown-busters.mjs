// Unlinked admission for static Slow/rings/EX/BO/GO with programmed busters
// and independent class1/class3 orbitals. No simulation or clock ownership.
import {effectiveMovingCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {compileWallTiles,validateBombWallTiles} from './walls.mjs';
import {decodeBombRecord} from './bombs.mjs';
const fail=()=>{throw Error('Separate static Slow/ring/buster/orbital/EX/bomb/goodie source composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const groups={0:700,6:4300,1:500,2:4400,3:4500,4:3500,5:3900};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','Bombs','BombObjectInteractions','SlidingConnectors','FreeBusters','RotatingSpikes','Class3RotatingSpikes','RotatingSpikeTransfers','StaticEnemyWalls','ImportedGoodie169'];
export function assertStaticSlowdownBusterRecipe(o){
 if(o?.allowStaticSlowdownBusters!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticSlowdownBusters'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertStaticSlowdownBusterActor(a,{program=a?.program}={}){
 const type=a?.sourceActorType,human=a?.sourceSlot<2;
 if(!int(a?.sourceSlot,0,30)||!groups[type]||a.group!==groups[type]&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean'||program!==a.program)fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else{
  if(![1,2,3,4,5].includes(type)||!(type===4?[1,3].includes(a.speedClass):a.speedClass===1))fail();
  if(a.checksWalls&&(type!==1||program!==null))fail();
  if([4,5].includes(type)&&a.checksWalls)fail();
  if(program===null){if([4,5].includes(type))fail();}
  else if(typeof program!=='string'||!int(program.length,1,255)||!([4,5].includes(type)?/^[ns]+$/:/^[bfns]+$/).test(program)||!int(a.sourcePC,1,program.length))fail();
 }
 return true;
}
export function assertStaticSlowdownBusterSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);let slow=0,rings=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','SP','WL','EX','BO','GO'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,9,0x4001,0x4003,0x4005,0x4009,0x4021].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),color=dotColorOffset(c.secondaryRaw);
  if(e&32){if(![0,1].includes(color))fail();slow++;}if(e&8)rings++;if(e&4){if(color!==0)fail();goals++;}
 }
 if(!slow||!rings||goals!==1||!rows('EX').length||rows('EX').length>61||!rows('WL').length||!rows('SP').length)fail();
 for(const r of rows('EX')){const w=r.rawWords;if(w?.length!==3||![0,256].includes(w[2])||!at(w[0],w[1])||!at(w[0]+(w[2]?1:0),w[1]+(w[2]?0:1)))fail();}
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 validateBombWallTiles(compileWallTiles(rows('WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]}))).map((t,id)=>({id,...t,x:74+48*t.column,y:72+48*t.row})));
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||!int(w[4],0,65535)||!int(w[5],0,65535))fail();}
 const bombs=rows('BO').map(decodeBombRecord);if(!bombs.length||bombs.length>60||!bombs.some(b=>b.kind>=10)||bombs.filter(b=>b.kind>=10).length>5||bombs.some(b=>b.kind>=10&&b.flags!==0||b.kind<4&&(b.row>6||b.column>9)))fail();
 const goodies=rows('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&1);if(!goodies.length||goodies.length>15||!goodies.some(r=>r.rawWords[2]===169))fail();
 for(const r of rows('GO')){const w=r.rawWords;if(w?.length!==5||!int(w[0],0,7)||!int(w[1],0,10)||![0,169].includes(w[2])||!int(w[3],0,65535)||!int(w[4],0,65535))fail();}
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1),ps=rows('WP');if(actors.length<5||actors.length>31||!actors.some(a=>a.actorTypeRaw===5)||!actors.some(a=>a.actorTypeRaw===4&&a.rawWords[7]===3))fail();
 for(const p of ps)if(typeof p.text!=='string'||!int(p.text.length,1,255)||!/^[bfns]+$/.test(p.text))fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c||w?.length!==11||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||i<2&&effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1)&0x3e)fail();
  assertStaticSlowdownBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:w[6]});
 }
 return true;
}
