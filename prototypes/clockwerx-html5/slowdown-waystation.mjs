// Default-off static Slow/WL/WY with programmed ordinary class1/2/5 clocks.
import {dotColorOffset} from './dots.mjs';
import {compileWallTiles} from './walls.mjs';
const fail=()=>{throw Error('Separate static slowdown wall and waystation with ordinary class1/2/5 programs required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertSlowdownWaystationRecipe(o){
 if(o?.allowSlowdownWaystation!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowSlowdownWaystation'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertSlowdownWaystationActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500,2:4400,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.checksWalls||a.speedClass!=={1:5,2:1,3:2}[type]||typeof a.program!=='string'||!(type===1?/^[bns]+$/:/^[ns]+$/).test(a.program)||!int(a.sourcePC,1,a.program.length))fail();return true;
}
export function assertSlowdownWaystationSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let slow=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','WL','WY'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,33,0x4011,0x4021].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;const e=c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x26;if(e&32){if(![0,1,2].includes(dotColorOffset(c.secondaryRaw)))fail();slow++;}if(e&4)goals++;
 }
 if(!slow||goals!==1||!rows('WL').length||rows('WY').length!==1)fail();
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 const w=rows('WY')[0].rawWords,c=s.cells[w?.[0]*11+w?.[1]];
 if(w?.length!==6||!c?.present||c.flagsRaw!==0x4011||dotColorOffset(c.secondaryRaw)!==0||!int(w[2],0,63)||![1,65535].includes(w[3])||!((w[4]*65536+w[5])&1)||s.cells.filter(c=>c.present&&c.flagsRaw&16).length!==1)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const x=a.rawWords,d=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;
  if(!d?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(x[4])||i<2&&d.flagsRaw!==1)fail();
  assertSlowdownWaystationActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[a.actorTypeRaw],speedClass:x[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:x[6]});
 }
 return true;
}
export function assertSlowdownWaystationBoard(b,{outlines,dotOutlines}={}){
 if(b?.slowdownWaystationRules!==true||b.slowdownWallRules!==true||b.staticSlowdownRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules'].every(k=>b[k]===true)||['movingDotRules','slidingConnectorRules','teleportRules','bombRules','goodieOnlyRules','canonicalOilRules','elevatorRules','markedTransferRules','staticEnemyWallRules','rotatingSpikeRules','slowdownClass4Rules'].some(k=>b[k]))fail();
 for(const k of['spikes','doors','switches','puddles','bombs','goodies','connectors','elevators','teleports','guns','triggers'])if(b[k]?.length)fail();
 const s=b.staticSlowdownSource;assertSlowdownWaystationSource(s);const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),raw=rows('WA'),active=raw.filter(a=>a.activationMaskRaw&1),programs=rows('WP');
 if(b.dots?.length!==cells.length||1+b.enemies?.length!==active.length-1)fail();
 for(const[i,d]of b.dots.entries()){
  const c=cells[i],e=c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x26,w=rows('WY').find(r=>r.rawWords[0]===c.row&&r.rawWords[1]===c.column);
  if(d.id!==`${c.column},${c.row}`||d.sourceIndex!==c.index||d.x!==74+c.column*48||d.y!==72+c.row*48||d.slowdown!==!!(e&32)||d.color!==dotColorOffset(c.secondaryRaw)||d.cell!==e||d.bonus!==!!(e&2)||d.kind!==(e&4?'goal':e&2?'bonus':'dot')||d.motion!=='static'||d.ring||d.protected||d.teleport||d.slideMask||d.upDown||d.transferDeath||d.burnt||!!d.waystation!==!!w||d.sourceInBackground!==!(e&0x3e))fail();
  if(w&&(d.waystation.halfIndex!==w.rawWords[2]||d.waystation.direction!==(w.rawWords[3]===65535?-1:1)))fail();
 }
 for(const[i,a]of[b.player,...b.enemies].entries()){
  assertSlowdownWaystationActor(a);const slot=i?i+1:0,r=active[slot],program=r.programReferenceRaw<0?null:programs[r.programReferenceRaw]?.text;
  if(a.sourceSlot!==slot||a.sourceRawRecord!==raw.indexOf(r)||a.sourceActorType!==r.actorTypeRaw||a.speedClass!==r.rawWords[7]||a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`||a.program!==program||program!==null&&a.sourcePC!==r.rawWords[6])fail();
 }
 const tiles=compileWallTiles(rows('WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]})));if(b.walls?.length!==tiles.length)fail();
 for(const[i,w]of b.walls.entries()){const t=tiles[i];if(w.id!==i||w.frame!==t.frame||w.row!==t.row||w.column!==t.column||w.x!==74+48*t.column||w.y!==72+48*t.row||w.visible===false)fail();}
 if(outlines){for(const g of[700,4300,500,4400,4500])for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of d.slowdown?[189+d.color,198+d.color]:[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();return true;
}
