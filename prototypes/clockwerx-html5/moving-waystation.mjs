// Default-off plain moving pivots/bonuses with a static WY checkpoint.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate Child moving pivots and static waystation with free class1/3 red actors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertMovingWaystationRecipe(o){
 if(o?.allowMovingWaystation!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingWaystation'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingWaystationActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||a.program!==null||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(type!==1||![1,3].includes(a.speedClass)||a.checksWalls)fail();return true;
}
export function assertMovingWaystationSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let movers=0,goals=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','WY'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,129,131,16401].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;if(!(c.secondaryRaw&1)||![0,1].includes(dotColorOffset(c.secondaryRaw)))fail();
  if(c.flagsRaw&4)goals++;
  if(c.flagsRaw&128){movers++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}else if(c.inlineProgram)fail();
 }
 if(!movers||movers>32||goals!==1||rows('WY').length!==1)fail();
 const w=rows('WY')[0].rawWords,c=s.cells[w?.[0]*11+w?.[1]];
 if(w?.length!==6||!c?.present||c.flagsRaw!==0x4011||dotColorOffset(c.secondaryRaw)!==0||!int(w[2],0,63)||![1,65535].includes(w[3])||!((w[4]*65536+w[5])&1)||s.cells.filter(c=>c.present&&c.flagsRaw&16).length!==1)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1);if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column];
  if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||i<2&&c.flagsRaw!==1)fail();
  assertMovingWaystationActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:null});
 }
 return true;
}
export function assertMovingWaystationBoard(b,{outlines,dotOutlines,initial=true,actors=[b?.player,...(b?.enemies??[])]}={}){
 if(b?.movingWaystationRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules'].every(k=>b[k]===true)||['slidingConnectorRules','teleportRules','bombRules','goodieOnlyRules','canonicalOilRules','elevatorRules','markedTransferRules','staticEnemyWallRules','rotatingSpikeRules','staticSlowdownRules'].some(k=>b[k]))fail();
 for(const k of['walls','spikes','doors','switches','puddles','bombs','goodies','connectors','elevators','teleports','guns','triggers'])if(b[k]?.length)fail();
 const s=b.movingWaystationSource;assertMovingWaystationSource(s);const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),raw=rows('WA'),active=raw.filter(a=>a.activationMaskRaw&1);
 if(b.dots?.length!==cells.length||initial&&actors.length!==active.length-1)fail();
 for(const[i,d]of b.dots.entries()){
  const c=cells[i],e=c.flagsRaw,moving=!!(e&128),bonus=!!(e&2),wy=rows('WY').find(r=>r.rawWords[0]===c.row&&r.rawWords[1]===c.column);
  if(d.id!==`${c.column},${c.row}`||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||!Number.isInteger(d.x)||!Number.isInteger(d.y)||initial&&(d.x!==74+c.column*48||d.y!==72+c.row*48)||d.motion!==(moving?'moving-program':'static')||d.sourceInitialPosition?.x!==74+c.column*48||d.sourceInitialPosition?.y!==72+c.row*48||d.color!==dotColorOffset(c.secondaryRaw)||d.ring||d.protected||d.teleport||d.slideMask||d.upDown||d.transferDeath||d.burnt||d.slowdown||d.sourceInitialBonus!==bonus||d.cell!==(initial||d.bonus?e:e&~2)||d.bonus!==!!(d.cell&2)||d.kind!==(e&4?'goal':d.bonus?'bonus':'dot')||d.movingProgram!==(moving?c.inlineProgram.text:undefined)||!!d.waystation!==!!wy)fail();
  if(wy&&(d.waystation.halfIndex!==wy.rawWords[2]||d.waystation.direction!==(wy.rawWords[3]===65535?-1:1)))fail();
 }
 const slots=new Set();for(const a of actors){
  assertMovingWaystationActor(a);const r=active[a.sourceSlot];if(!r||a.sourceSlot===1||slots.has(a.sourceSlot)||a.sourceRawRecord!==raw.indexOf(r)||a.sourceActorType!==r.actorTypeRaw||a.speedClass!==r.rawWords[7]||!b.dots.some(d=>d.id===a.pivot)||initial&&a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`)fail();slots.add(a.sourceSlot);
 }
 if(outlines)for(const g of[700,4300,500])for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!Array.isArray(dotOutlines.groups?.[300]?.frames?.[f]?.rows))fail();return true;
}
