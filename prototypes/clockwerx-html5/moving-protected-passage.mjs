// Default-off masked moving rings, static protection/ring, EX/WL/SP and open blue doors.
import {assertClosedMovingProgram,movingProgramCell,effectiveMovingCell} from './moving-dots.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {connectorSpecs,initializeConnectorBonuses,validateConnectorBoard} from './sliding.mjs';
import {compileWallTiles} from './walls.mjs';
import {spikeGridPoint} from './hazards.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate moving masked rings, static protection, rails and open blue doors required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','InactiveSpikes','InitiallyOpenDoors'];
export function assertMovingProtectedPassageRecipe(o){
 if(o?.allowMovingProtectedPassage!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingProtectedPassage'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingProtectedPassageActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2,group={0:700,6:4300,1:500,2:4400,3:4500}[type];
 if(!int(a?.sourceSlot,0,30)||!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300)||a.program!==null||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(a.checksWalls||![1,4].includes(a.speedClass)||a.speedClass===4&&type!==3)fail();return true;
}
export function assertMovingProtectedPassageSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[];let movers=0,goals=0,rings=0,protectedDots=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','DR','DS','EX'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x4005,0x4009,0x4041,0x4089].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw),color=dotColorOffset(c.secondaryRaw);if(![0,1,2,4].includes(color)||(e&0x4c)&&color!==0)fail();if(e&4)goals++;if(e&8)rings++;if(e&64)protectedDots++;
  if(c.flagsRaw&128){if(c.secondaryRaw&1||e&0x6e)fail();movers++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}else if(c.inlineProgram)fail();
 }
 if(!movers||movers>16||goals!==1||rings!==1||protectedDots!==1||!rows('SP').length||!rows('WL').length)fail();
 for(const r of rows('SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||w[4]!==0||![12,15].includes(w[5]))fail();}
 for(const r of rows('WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 const doors=rows('DR').map(decodeDoorRecord),switches=rows('DS').map(decodeSwitchRecord);
 if(doors.length!==2||switches.length!==2||doors.some(d=>d.vertical||d.initiallyClosed||!d.long||d.color!==2||!int(d.row,0,7)||!int(d.column,0,9))||switches.some(d=>d.color!==2||![1,2].includes(d.subcell)||!int(d.row,0,7)||!int(d.column,0,10)))fail();
 const dots=s.cells.filter(c=>c.present).map(c=>({id:`${c.column},${c.row}`,row:c.row,column:c.column,motion:c.flagsRaw&128?'moving-program':'static'})),ex=connectorSpecs(rows('EX'),dots);if(!ex.length)fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&1);if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column];if(!c?.present||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw)&~0x4000)!==0x41)fail();
  assertMovingProtectedPassageActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,2:4400,3:4500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:null});
 }
 return true;
}
export function assertMovingProtectedPassageBoard(b,{outlines,dotOutlines,doorOutlines,initial=true,actors=[b?.player,...(b?.enemies??[])]}={}){
 if(b?.movingProtectedPassageRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','slidingConnectorRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules'].every(k=>b[k]===true)||['teleportRules','bombRules','goodieOnlyRules','canonicalOilRules','elevatorRules','markedTransferRules','staticEnemyWallRules','rotatingSpikeRules','staticSlowdownRules','movingWaystationRules'].some(k=>b[k]))fail();
 for(const k of['puddles','bombs','goodies','elevators','teleports','guns','triggers'])if(b[k]?.length)fail();
 const s=b.movingProtectedPassageSource;assertMovingProtectedPassageSource(s);const rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),raw=rows('WA'),active=raw.filter(a=>a.activationMaskRaw&1);
 // Compile source copies only: connectorSpecs writes slide masks. A guard must
 // never repair the actual board while checking it.
 const expected=cells.map(c=>{const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw);return{id:`${c.column},${c.row}`,row:c.row,column:c.column,motion:e&128?'moving-program':'static',bonus:!!(e&2),cell:e,kind:e&4?'goal':e&2?'bonus':'dot'};});
 const ex=connectorSpecs(rows('EX'),expected);initializeConnectorBonuses(ex,expected);
 if(b.dots?.length!==cells.length||initial&&actors.length!==active.length-1||b.connectors?.length!==ex.length)fail();
 for(const[i,d]of b.dots.entries()){
  const c=cells[i],e=expected[i],moving=!!(e.cell&128),p=c.inlineProgram;
  if(d.id!==e.id||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||!Number.isInteger(d.x)||!Number.isInteger(d.y)||(initial||!moving)&&(d.x!==74+c.column*48||d.y!==72+c.row*48)||d.sourceInitialPosition?.x!==74+c.column*48||d.sourceInitialPosition?.y!==72+c.row*48||d.motion!==e.motion||d.motionType!==(moving?1:0)||d.color!==dotColorOffset(c.secondaryRaw)||d.ring!==!!(e.cell&8)||d.protected!==!!(e.cell&64)||d.teleport||d.upDown||d.transferDeath||d.burnt||d.slowdown||d.waystation||d.slideMask!==e.slideMask||d.sourceInitialBonus!==e.bonus||d.cell!==(initial||d.bonus?e.cell:e.cell&~2)||d.bonus!==!!(d.cell&2)||d.kind!==(e.cell&4?'goal':d.bonus?'bonus':'dot')||d.movingProgram!==(moving?p.text:undefined)||initial&&d.sourceInBackground!==(!moving&&!(e.cell&0x1e)))fail();
  if(moving&&(d.sourceMovingProgram?.offset!==p.offset||d.sourceMovingProgram.rawHex!==p.rawHex||d.sourceMovingProgram.paddingHex!==p.paddingHex))fail();
 }
 validateConnectorBoard(b.connectors,b.dots);for(const[i,e]of b.connectors.entries())if(e.id!==ex[i].id||e.first!==ex[i].first||e.second!==ex[i].second||e.vertical!==ex[i].vertical||e.sourceInitialBonus!==ex[i].bonus||e.burnt)fail();
 const tiles=compileWallTiles(rows('WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]}))),spikes=rows('SP').filter(r=>r.rawWords[5]&1);
 if(b.walls?.length!==tiles.length||b.spikes?.length!==spikes.length)fail();
 for(const[i,w]of b.walls.entries()){const t=tiles[i];if(w.id!==i||w.frame!==t.frame||w.row!==t.row||w.column!==t.column||w.x!==74+t.column*48||w.y!==72+t.row*48||w.visible===false)fail();}
 for(const[i,sp]of b.spikes.entries()){const r=spikes[i],p=spikeGridPoint(r,b.origin);if(sp.id!==i||sp.row!==r.rawWords[0]||sp.column!==r.rawWords[1]||sp.subrow!==r.rawWords[2]||sp.subcolumn!==r.rawWords[3]||sp.x!==p.x||sp.y!==p.y||sp.activationMask!==15)fail();}
 const same=(a,z)=>JSON.stringify(a)===JSON.stringify(z),arm=(row,column,mask)=>tiles.some(t=>t.row===row&&t.column===column&&t.frame>=4&&((t.frame-4)&mask));
 if(b.doors?.length!==rows('DR').length||b.switches?.length!==rows('DS').length)fail();
 for(const[i,d]of b.doors.entries()){const spec=decodeDoorRecord(rows('DR')[i]),v={id:i,...spec,...doorGeometry(spec,b.origin,arm)};for(const[k,x]of Object.entries(v))if(!same(d[k],x))fail();}
 for(const[i,d]of b.switches.entries()){const spec=decodeSwitchRecord(rows('DS')[i]),v={id:i,...spec,...switchGeometry(spec,b.origin)};for(const[k,x]of Object.entries(v))if(!same(d[k],x))fail();}
 const slots=new Set();for(const a of actors){assertMovingProtectedPassageActor(a);const r=active[a.sourceSlot];if(!r||a.sourceSlot===1||slots.has(a.sourceSlot)||a.sourceRawRecord!==raw.indexOf(r)||a.sourceActorType!==r.actorTypeRaw||a.speedClass!==r.rawWords[7]||!b.dots.some(d=>d.id===a.pivot)||initial&&a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`)fail();slots.add(a.sourceSlot);}
 if(outlines){for(const g of[700,4300,500,4400,4500,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(doorOutlines)for(const g of[1300,3800,2900,1000])if(!Array.isArray(doorOutlines.groups?.[g]?.frames))fail();return true;
}
