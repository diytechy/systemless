// Default-off Child composition: static white rings, EX, static spikes and
// free class1 red/green hands. Inactive PU records grant no Oil capability.
import {decodeDot,dotColorOffset} from './dots.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {actorChecksWalls} from './walls.mjs';
import {connectorSpecs,initializeConnectorBonuses,validateConnectorBoard} from './sliding.mjs';
const fail=()=>{throw Error('Separate static white ring/EX/spike Child composition required');};
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const groups={0:700,6:4300,1:500,2:4400};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','SlidingConnectors','InactiveSpikes'];
const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export function assertStaticRingRailRecipe(o){
 if(o?.allowStaticRingRails!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticRingRails'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertStaticRingRailActor(a){
 if(!integer(a?.sourceSlot,0,30)||a.group!==groups[a.sourceActorType]||typeof a.checksWalls!=='boolean'||a.program!==null)fail();
 if(a.sourceSlot<2){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls)fail();}
 else if(![1,2].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls)fail();return true;
}
export function assertStaticRingRailSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||!integer(s.header.timeLimitRaw,1,65535)||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set();for(const b of s.blocks){if(seen.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!['WA','WP','EX','SP','PU'].includes(b.kind))fail();seen.add(b.kind);}
 const cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);let rings=0,goals=0;
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,9,0x4001,0x4003,0x4005,0x4009].includes(c.flagsRaw)||!integer(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;
  if(c.flagsRaw&8){if(!(c.secondaryRaw&1)||dotColorOffset(c.secondaryRaw)!==0)fail();rings++;}
  if(c.flagsRaw&4){if(dotColorOffset(c.secondaryRaw)!==0)fail();goals++;}
 }
 if(!rings||goals!==1||!rows(s,'EX').length||rows(s,'EX').length>61||!rows(s,'SP').length)fail();
 for(const r of rows(s,'EX')){const w=r.rawWords,a=at(w?.[0],w?.[1]),b=at(w?.[0]+(w?.[2]?1:0),w?.[1]+(w?.[2]?0:1));if(w?.length!==3||![0,256].includes(w[2])||!a||!b||[a,b].some(c=>c.flagsRaw&12))fail();}
 for(const r of rows(s,'SP')){const w=r.rawWords;if(w?.length!==6||!integer(w[0],0,7)||!integer(w[1],0,10)||!integer(w[2],0,3)||!integer(w[3],0,3)||!integer(w[4],0,65535)||!integer(w[5],0,65535))fail();}
 if(!rows(s,'SP').some(r=>(r.rawWords[4]*65536+r.rawWords[5])&1))fail();
 for(const r of rows(s,'PU')){const w=r.rawWords;if(w?.length!==5||!integer(w[0],0,7)||!integer(w[1],0,10)||!integer(w[2],0,3)||!integer(w[3],0,65535)||!integer(w[4],0,65535)||((w[3]*65536+w[4])&1))fail();}
 for(const p of rows(s,'WP'))if(typeof p.text!=='string'||!integer(p.text.length,1,255)||!/^[bfns]+$/.test(p.text))fail();
 const actors=rows(s,'WA').filter(a=>a.activationMaskRaw&1);if(actors.length<4||actors.length>31||!actors.some(a=>a.actorTypeRaw===1)||!actors.some(a=>a.actorTypeRaw===2))fail();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,d=at(a.gridPosition?.row,a.gridPosition?.column);
  if(!d||w?.length!==11||w[0]!==d.row||w[1]!==d.column||w[2]!==a.actorTypeRaw||w[3]!==a.initialFrameHalfIndexRaw||!integer(w[3],0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==-1||w[5]!==65535||w[6]!==1||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||d.flagsRaw&8||i<2&&d.flagsRaw&6)fail();
  assertStaticRingRailActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program:null});
 }
 return true;
}
function declarations(s,{ordinal,title,angularSpeed}){
 const origin={x:74,y:72};
 const dots=s.cells.filter(c=>c.present).map(c=>{const state=decodeDot(c.flagsRaw);return{id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,x:74+c.column*48,y:72+c.row*48,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:'static',slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),ring:!!(c.flagsRaw&8),protected:false,bonus:state.bonus,sourceInBackground:!(c.flagsRaw&0x1e),cell:c.flagsRaw,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};});
 const connectors=connectorSpecs(rows(s,'EX'),dots);initializeConnectorBonuses(connectors,dots);
 const raw=rows(s,'WA'),actors=raw.filter(a=>a.activationMaskRaw&1);
 const hand=(a,i)=>{const f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:`${a.gridPosition.column},${a.gridPosition.row}`,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program:null,canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:-1,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin,dots,connectors,player:hand(actors[0],0),enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),spikes:rows(s,'SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&1).map((r,id)=>({id,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],...spikeGridPoint(r,origin),phase:id%4,activationMask:r.rawWords[4]*65536+r.rawWords[5]})),walls:[],bombs:[],goodies:[],puddles:[],doors:[],switches:[],elevators:[],teleports:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-actors.length,slidingHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`),sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,slidingConnectorRules:true,staticRingRailRules:true};
}
export function buildStaticRingRailBoard(s,o){
 assertStaticRingRailRecipe(o);assertStaticRingRailSource(s);if(!integer(o.ordinal,1,100)||typeof o.title!=='string'||!o.title||!(o.angularSpeed>0))fail();
 const source=freeze(structuredClone(s)),b=declarations(source,o);b.staticRingRailSource=source;return b;
}
export function assertStaticRingRailBoard(b,{outlines,dotOutlines}={}){
 if(b?.staticRingRailRules!==true||!Object.isFrozen(b.staticRingRailSource)||!Object.isFrozen(b.staticRingRailSource.cells))fail();assertStaticRingRailSource(b.staticRingRailSource);
 const expected=declarations(b.staticRingRailSource,b);for(const[k,v]of Object.entries(expected))if(!same(b[k],v))fail();
 for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&expected[k]!==true)fail();
 validateConnectorBoard(b.connectors,b.dots);for(const a of[b.player,...b.enemies])assertStaticRingRailActor(a);
 if(outlines)for(const g of[700,4300,500,4400,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of d.ring?[23,24,25,26,27,28,29,30]:[1+d.color,9+d.color])if(!Array.isArray(dotOutlines.groups?.[300]?.frames?.[f]?.rows))fail();return true;
}
export function assertStaticRingRailRuntime(b,{actors=[]}={}){
 if(b?.staticRingRailRules!==true||!Object.isFrozen(b.staticRingRailSource)||['puddles','bombs','goodies','walls','doors','switches','elevators','teleports','guns','triggers'].some(k=>b[k]?.length))fail();
 for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&!['canonicalPlayerRules','specialDotRules','childScoreRules','sourceDotPermissions','slidingConnectorRules','staticRingRailRules'].includes(k))fail();
 for(const d of b.dots)if(d.motion!=='static'||d.teleport!==false||d.protected||d.waystation||d.transferDeath||d.slowdown||d.upDown||d.movingProgram||d.burnt||typeof d.ring!=='boolean'||typeof d.humanCanGrab!=='boolean'||d.nonhumanCanGrab!==true||d.ring&&(d.color!==0||d.slideMask)||!d.ring&&!d.humanCanGrab)fail();
 validateConnectorBoard(b.connectors,b.dots);for(const a of actors)assertStaticRingRailActor(a);return true;
}
