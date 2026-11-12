// Default-off moving HY riders, static colored door/switch, vertical EX and rings.
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {compileWallTiles,actorChecksWalls} from './walls.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {connectorSpecs,initializeConnectorBonuses,validateConnectorBoard} from './sliding.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {activeTeleportSpecs,pairTeleportSpecs} from './teleports.mjs';
const fail=()=>{throw Error('Separate moving HY, door, vertical EX and ring Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const groups={0:700,6:4300,1:500,2:4400,3:4500};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','MovingDots','SlidingConnectors','Teleports','InactiveSpikes'];
const frozen=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))frozen(x);Object.freeze(v);}return v;};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function assertMovingTeleportDoorRecipe(o){
 if(o?.allowMovingTeleportDoors!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingTeleportDoors'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingTeleportDoorActor(a,{program=a?.program}={}){
 const t=a?.sourceActorType,h=a?.sourceSlot<2;
 if(!int(a?.sourceSlot,0,30)||!groups[t]||a.group!==groups[t]&&!(a.sourceSlot===0&&t===0&&a.group===4300)||program!==a.program||typeof a.checksWalls!=='boolean')fail();
 if(h){if(t!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else if(![1,2,3].includes(t)||a.speedClass!==1||a.checksWalls||program!==null&&(typeof program!=='string'||!/^[bfns]+$/.test(program)||!int(program.length,1,255)||!int(a.sourcePC,1,program.length)))fail();return true;
}
export function assertMovingTeleportDoorSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set();for(const b of s.blocks){if(seen.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!['WA','WP','WL','HY','SP','DR','DS','EX','TX'].includes(b.kind))fail();seen.add(b.kind);}
 let moving=0,rings=0,goals=0,bonuses=0,noWait=0;const cs=s.cells.filter(c=>c.present);
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,9,0x4001,0x4003,0x4005,0x4081,0x4083].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present){if(c.inlineProgram)fail();continue;}
  const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw),color=dotColorOffset(c.secondaryRaw);
  if(e&4){if(color!==0||e&128)fail();goals++;}if(e&8){if(e&128)fail();rings++;}if(e&2)bonuses++;
  if(e&128){const p=movingProgramCell(c).text;assertClosedMovingProgram(p,{x:74+c.column*48,y:72+c.row*48});moving++;if(!p.includes('p'))noWait++;}else if(c.inlineProgram)fail();
 }
 if(!moving||moving>32||!noWait||goals!==1||!rings||!bonuses||!rows(s,'WL').length)fail();
 for(const r of rows(s,'WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 for(const r of rows(s,'SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||w[4]!==0||![14,15].includes(w[5]))fail();}
 const ds=cs.map(c=>({id:`${c.column},${c.row}`,row:c.row,column:c.column,present:true,motion:c.flagsRaw&128?'moving-program':'static'})),hy=pairTeleportSpecs(activeTeleportSpecs(rows(s,'HY')),ds),ex=connectorSpecs(rows(s,'EX'),ds);
 if(!hy.length||!hy.some(h=>ds.find(d=>d.id===h.dot).motion==='moving-program')||!hy.some(h=>ds.find(d=>d.id===h.dot).motion==='static')||!ex.length||ex.some(e=>!e.vertical))fail();
 const doors=rows(s,'DR').map(decodeDoorRecord),switches=rows(s,'DS').map(decodeSwitchRecord);
 if(doors.length!==1||!doors[0].vertical||!doors[0].long||!doors[0].initiallyClosed||doors[0].color!==1||switches.length!==1||switches[0].color!==1||switches[0].subcell!==2)fail();
 for(const a of[...doors,...switches])if(!int(a.row,0,7)||!int(a.column,0,10))fail();
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');if(active.length<3||active.length>31)fail();
 for(const p of ps)if(typeof p.text!=='string'||!/^[bfns]+$/.test(p.text)||!int(p.text.length,1,255))fail();
 for(const[i,a]of active.entries()){
  const w=a.rawWords,c=cs.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column),program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c||w?.length!==11||w[0]!==c.row||w[1]!==c.column||w[2]!==a.actorTypeRaw||w[3]!==a.initialFrameHalfIndexRaw||!int(w[3],0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==(w[5]===65535?-1:w[5])||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||i<2&&(c.flagsRaw&0x3fe))fail();
  assertMovingTeleportDoorActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program,sourcePC:w[6]});
 }return true;
}
function declarations(s,{ordinal,title,angularSpeed}){
 const dots=s.cells.filter(c=>c.present).map(c=>{const cell=effectiveMovingCell(c.flagsRaw,c.secondaryRaw),v=decodeDot(cell),moving=!!(cell&128),p={x:74+48*c.column,y:72+48*c.row};return{id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,...p,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:moving?'moving-program':'static',motionType:moving?1:0,sourceInitialPosition:{...p},...(moving?{movingProgram:c.inlineProgram.text,sourceMovingProgram:movingProgramCell(c)}:{}),slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),protected:false,ring:!!(cell&8),bonus:v.bonus,sourceInitialBonus:v.bonus,sourceInBackground:!moving&&!(cell&0x1e),sourceHasSprite:moving||!!(cell&0x1e),cell,flags:c.secondaryRaw,kind:v.goal?'goal':v.bonus?'bonus':'dot'};});
 const connectors=connectorSpecs(rows(s,'EX'),dots);initializeConnectorBonuses(connectors,dots);
 const teleports=pairTeleportSpecs(activeTeleportSpecs(rows(s,'HY')),dots);for(const e of teleports)dots.find(d=>d.id===e.dot).teleport=true;
 const tiles=compileWallTiles(rows(s,'WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]}))),walls=tiles.map((w,id)=>({id,...w,x:74+w.column*48,y:72+w.row*48})),arm=(r,c,m)=>tiles.some(t=>t.row===r&&t.column===c&&t.frame>=4&&((t.frame-4)&m));
 const doors=rows(s,'DR').map((r,id)=>{const d=decodeDoorRecord(r);return{id,...d,...doorGeometry(d,{x:74,y:72},arm)};}),switches=rows(s,'DS').map((r,id)=>{const d=decodeSwitchRecord(r);return{id,...d,...switchGeometry(d,{x:74,y:72})};});
 const spikes=rows(s,'SP').filter(r=>r.rawWords[5]&1).map((r,id)=>({id,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],phase:id%4,...spikeGridPoint(r,{x:74,y:72}),activationMask:r.rawWords[5]}));
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 const hand=(a,i)=>{const program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw].text,f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:`${a.gridPosition.column},${a.gridPosition.row}`,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program,sourcePC:program?a.rawWords[6]:undefined,canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:a.programReferenceRaw,...(program?{sourceStaticProgram:structuredClone(ps[a.programReferenceRaw])}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin:{x:74,y:72},dots,connectors,walls,spikes,doors,switches,teleports,player:hand(active[0],0),enemies:active.slice(2).map((a,i)=>hand(a,i+2)),bombs:[],goodies:[],puddles:[],elevators:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-active.length,movingHumanStarts:active.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`),sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,movingDotRules:true,slidingConnectorRules:true,teleportRules:true,movingTeleportDoorRules:true};
}
export function buildMovingTeleportDoorBoard(s,o){assertMovingTeleportDoorRecipe(o);assertMovingTeleportDoorSource(s);if(!int(o.ordinal,1,100)||!o.title||!(o.angularSpeed>0))fail();const source=frozen(structuredClone(s)),b=declarations(source,o);b.slidingHumanStarts=[...b.movingHumanStarts];b.teleportHumanStarts=[...b.movingHumanStarts];b.movingTeleportDoorSource=source;return b;}
export function assertMovingTeleportDoorBoard(b,{outlines,dotOutlines,doorOutlines}={}){
 if(b?.movingTeleportDoorRules!==true||!Object.isFrozen(b.movingTeleportDoorSource)||!Object.isFrozen(b.movingTeleportDoorSource.cells))fail();const s=b.movingTeleportDoorSource;assertMovingTeleportDoorSource(s);const e=declarations(s,b);
 for(const[k,v]of Object.entries(e))if(!same(b[k],v))fail();if(!same(b.slidingHumanStarts,e.movingHumanStarts)||!same(b.teleportHumanStarts,e.movingHumanStarts))fail();for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&e[k]!==true)fail();validateConnectorBoard(b.connectors,b.dots);
 if(outlines){for(const g of[700,4300,500,4400,4500,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color,...(d.ring?Array.from({length:8},(_,i)=>23+7*d.color+i):[])])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(doorOutlines)for(const g of[1300,3800,2900,1000])if(!Array.isArray(doorOutlines.groups?.[g]?.frames))fail();return true;
}
