// Default-off moving goal, horizontal rails, static spikes and ordinary class1 actors.
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {connectorSpecs,initializeConnectorBonuses,validateConnectorBoard} from './sliding.mjs';
const groups={0:700,6:4300,1:500,2:4400,3:4500};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const v of Object.values(o))frozen(v);Object.freeze(o);}return o;};
const fail=()=>{throw Error('Separate moving goal, horizontal rails, static spikes and ordinary class1 actors required');};
const required=['MovingDots','SlidingConnectors','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertMovingGoalRailRecipe(o){
 if(o?.allowMovingGoalRails!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingGoalRails'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingGoalRailActor(a){
 const type=a?.sourceActorType,human=a?.sourceSlot<2;
 if(!int(a?.sourceSlot,0,30)||!groups[type]||a.group!==groups[type]&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean')fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.checksWalls||a.speedClass!==1||a.program!==null&&(typeof a.program!=='string'||!/^[fns]+$/.test(a.program)||!int(a.sourcePC,1,a.program.length)))fail();return true;
}
export function assertMovingGoalRailSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set();let moving=0,goals=0,bonuses=0;
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','EX'].includes(b.kind))fail();seen.add(b.kind);}
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x4001,0x4085].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present)continue;if(!(c.secondaryRaw&1)||dotColorOffset(c.secondaryRaw)>5)fail();
  if(c.flagsRaw&4){if(!(c.flagsRaw&128)||![0,1].includes(dotColorOffset(c.secondaryRaw)))fail();goals++;}
  if(c.flagsRaw&2)bonuses++;
  if(c.flagsRaw&128){moving++;assertClosedMovingProgram(movingProgramCell(c).text,{x:74+48*c.column,y:72+48*c.row});}else if(c.inlineProgram)fail();
 }
 if(moving!==1||goals!==1||!bonuses||!rows(s,'SP').length)fail();
 for(const r of rows(s,'SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,2)||!int(w[3],0,2)||w[4]!==0||w[5]!==15)fail();}
 const ds=s.cells.filter(c=>c.present).map(c=>({id:`${c.column},${c.row}`,row:c.row,column:c.column,present:true,motion:c.flagsRaw&128?'moving-program':'static'})),ex=connectorSpecs(rows(s,'EX'),ds);
 if(!ex.length||ex.some(e=>e.vertical))fail();
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');if(active.length<3||active.length>31)fail();
 for(const p of ps)if(typeof p.text!=='string'||!/^[bfns]+$/.test(p.text)||!int(p.text.length,1,255))fail();
 for(const[i,a]of active.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c?.present||w?.length!==11||w[0]!==c.row||w[1]!==c.column||w[2]!==a.actorTypeRaw||w[3]!==a.initialFrameHalfIndexRaw||!int(w[3],0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==(w[5]===65535?-1:w[5])||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||i<2&&c.flagsRaw!==1)fail();
  assertMovingGoalRailActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program,sourcePC:w[6]});
 }return true;
}
function declarations(s,{ordinal,title,angularSpeed}){
 const dots=s.cells.filter(c=>c.present).map(c=>{const cell=effectiveMovingCell(c.flagsRaw,c.secondaryRaw),v=decodeDot(cell),moving=!!(cell&128),p={x:74+48*c.column,y:72+48*c.row};return{id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,...p,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:moving?'moving-program':'static',motionType:moving?1:0,sourceInitialPosition:{...p},...(moving?{movingProgram:c.inlineProgram.text,sourceMovingProgram:movingProgramCell(c)}:{}),slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),protected:false,ring:!!(cell&8),bonus:v.bonus,sourceInitialBonus:v.bonus,sourceInBackground:!moving&&!(cell&0x1e),sourceHasSprite:moving||!!(cell&0x1e),cell,flags:c.secondaryRaw,kind:v.goal?'goal':v.bonus?'bonus':'dot'};});
 const connectors=connectorSpecs(rows(s,'EX'),dots);initializeConnectorBonuses(connectors,dots);
 const teleports=[],walls=[],doors=[],switches=[];
 const spikes=rows(s,'SP').filter(r=>r.rawWords[5]&1).map((r,id)=>({id,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],phase:id%4,...spikeGridPoint(r,{x:74,y:72}),activationMask:r.rawWords[5]}));
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 const hand=(a,i)=>{const program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw].text,f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:`${a.gridPosition.column},${a.gridPosition.row}`,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program,sourcePC:program?a.rawWords[6]:undefined,canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:a.programReferenceRaw,...(program?{sourceStaticProgram:structuredClone(ps[a.programReferenceRaw])}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin:{x:74,y:72},dots,connectors,walls,spikes,doors,switches,teleports,player:hand(active[0],0),enemies:active.slice(2).map((a,i)=>hand(a,i+2)),bombs:[],goodies:[],puddles:[],elevators:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-active.length,movingHumanStarts:active.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`),sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,movingDotRules:true,slidingConnectorRules:true,movingGoalRailRules:true};
}
export function buildMovingGoalRailBoard(s,o){
 assertMovingGoalRailRecipe(o);assertMovingGoalRailSource(s);if(!int(o.ordinal,1,100)||!o.title||!(o.angularSpeed>0))fail();const source=frozen(structuredClone(s)),b=declarations(source,o);b.slidingHumanStarts=[...b.movingHumanStarts];b.movingGoalRailSource=source;return b;
}
export function assertMovingGoalRailBoard(b,{outlines,dotOutlines}={}){
 if(b?.movingGoalRailRules!==true||!Object.isFrozen(b.movingGoalRailSource)||!Object.isFrozen(b.movingGoalRailSource.cells))fail();const s=b.movingGoalRailSource;assertMovingGoalRailSource(s);const e=declarations(s,b);
 for(const[k,v]of Object.entries(e))if(!same(b[k],v))fail();if(!same(b.slidingHumanStarts,e.movingHumanStarts))fail();for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&e[k]!==true)fail();validateConnectorBoard(b.connectors,b.dots);
 if(outlines)for(const g of[700,4300,500,4400,4500,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();return true;
}
