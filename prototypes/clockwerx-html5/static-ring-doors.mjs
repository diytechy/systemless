// Default-off imported Child composition. Raw program references remain evidence;
// WPFindPrograms binds out-of-range references to null, never invented programs.
import {decodeDot,dotColorOffset} from './dots.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {actorChecksWalls} from './walls.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {resolveActorProgram} from './programs.mjs';
const fail=()=>{throw Error('Separate imported static colored-ring, checkpoint and door composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const groups={0:700,6:4300,1:500,2:4400,3:4500};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const x of Object.values(o))freeze(x);Object.freeze(o);}return o;};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring'];
export function assertStaticRingDoorRecipe(o){
 if(o?.allowStaticRingDoors!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticRingDoors'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertStaticRingDoorActor(a){
 if(!int(a?.sourceSlot,0,30)||a.group!==groups[a.sourceActorType]||typeof a.checksWalls!=='boolean')fail();
 if(a.sourceSlot<2){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||a.program!==null)fail();}
 else if(a.speedClass!==1||a.checksWalls||a.program!==null&&(typeof a.program!=='string'||!/^n+$/.test(a.program)||!int(a.sourcePC,1,a.program.length)))fail();return true;
}
export function effectiveStaticRingDoorCell(c){return c.secondaryRaw&1?c.flagsRaw:c.flagsRaw&~0x7e;}
export function assertStaticRingDoorSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||!int(s.header.timeLimitRaw,1,65535)||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set();for(const b of s.blocks){if(seen.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!['SP','DR','DS','WY','WP','WA','TX'].includes(b.kind))fail();seen.add(b.kind);}
 let rings=0,goal=0,checkpoint=0;
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5,0x4009,0x4051].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;const e=effectiveStaticRingDoorCell(c);if(dotColorOffset(c.secondaryRaw)>4)fail();
  if(e&8)rings++;if(e&4){goal++;if(dotColorOffset(c.secondaryRaw)!==0)fail();}if(e&16){checkpoint++;if(!(e&64)||dotColorOffset(c.secondaryRaw)!==0)fail();}
 }
 if(!rings||goal!==1||checkpoint!==1||!rows(s,'SP').length)fail();
 for(const r of rows(s,'SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||w[4]!==0||w[5]!==15)fail();}
 const doors=rows(s,'DR').map(decodeDoorRecord),switches=rows(s,'DS').map(decodeSwitchRecord);
 if(doors.length!==1||doors[0].vertical||!doors[0].long||!doors[0].initiallyClosed||doors[0].color!==0||switches.length!==1||switches[0].color!==0||switches[0].subcell!==2)fail();
 for(const a of[...doors,...switches])if(!int(a.row,0,7)||!int(a.column,0,10))fail();
 const wy=rows(s,'WY');if(wy.length!==1)fail();const w=wy[0].rawWords,c=s.cells[w?.[0]*11+w?.[1]];
 if(w?.length!==6||!c?.present||!(effectiveStaticRingDoorCell(c)&16)||!int(w[2],0,31)||![1,65535].includes(w[3])||w[4]!==0||!(w[5]&1))fail();
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');if(active.length<3||active.length>31)fail();
 for(const p of ps)if(typeof p.text!=='string'||!int(p.text.length,1,255)||!/^[bfns]+$/.test(p.text))fail();
 for(const[i,a]of active.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],p=resolveActorProgram(a.programReferenceRaw,ps);
  if(!c?.present||w?.length!==11||w[0]!==c.row||w[1]!==c.column||w[2]!==a.actorTypeRaw||w[3]!==a.initialFrameHalfIndexRaw||!int(w[3],0,31)||![1,65535].includes(w[4])||a.programReferenceRaw!==(w[5]===65535?-1:w[5])||w[6]!==1||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||i<2&&effectiveStaticRingDoorCell(c)!==1)fail();
  assertStaticRingDoorActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program:p?.text??null,sourcePC:w[6]});
 }return true;
}
function declarations(s,{ordinal,title,angularSpeed}){
 const origin={x:74,y:72};
 const dots=s.cells.filter(c=>c.present).map(c=>{const cell=effectiveStaticRingDoorCell(c),v=decodeDot(cell);return{id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,x:74+48*c.column,y:72+48*c.row,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:'static',slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),protected:!!(cell&64),ring:!!(cell&8),bonus:v.bonus,sourceInitialBonus:v.bonus,sourceInBackground:!(cell&0x1e),sourceHasSprite:!!(cell&0x1e),cell,flags:c.secondaryRaw,kind:v.goal?'goal':v.bonus?'bonus':'dot'};});
 for(const r of rows(s,'WY')){const w=r.rawWords;dots.find(d=>d.row===w[0]&&d.column===w[1]).waystation={halfIndex:w[2],direction:w[3]===65535?-1:1};}
 const doors=rows(s,'DR').map((r,id)=>{const d=decodeDoorRecord(r);return{id,...d,...doorGeometry(d,origin)};}),switches=rows(s,'DS').map((r,id)=>{const d=decodeSwitchRecord(r);return{id,...d,...switchGeometry(d,origin)};});
 const spikes=rows(s,'SP').map((r,id)=>({id,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],phase:id%4,...spikeGridPoint(r,origin),activationMask:r.rawWords[5]}));
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 const hand=(a,i)=>{const p=resolveActorProgram(a.programReferenceRaw,ps),program=p?.text??null,f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:`${a.gridPosition.column},${a.gridPosition.row}`,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program,sourcePC:p?a.rawWords[6]:undefined,sourceRawPC:a.rawWords[6],canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:a.programReferenceRaw,...(p?{sourceStaticProgram:structuredClone(p)}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin,dots,connectors:[],walls:[],spikes,doors,switches,teleports:[],player:hand(active[0],0),enemies:active.slice(2).map((a,i)=>hand(a,i+2)),bombs:[],goodies:[],puddles:[],elevators:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-active.length,sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,staticRingDoorRules:true};
}
export function buildStaticRingDoorBoard(s,o){assertStaticRingDoorRecipe(o);assertStaticRingDoorSource(s);if(!int(o.ordinal,1,100)||!o.title||!(o.angularSpeed>0))fail();const source=freeze(structuredClone(s)),b=declarations(source,o);b.staticRingDoorSource=source;return b;}
export function assertStaticRingDoorBoard(b,{outlines,dotOutlines,doorOutlines}={}){
 if(b?.staticRingDoorRules!==true||!Object.isFrozen(b.staticRingDoorSource)||!Object.isFrozen(b.staticRingDoorSource.cells))fail();assertStaticRingDoorSource(b.staticRingDoorSource);const e=declarations(b.staticRingDoorSource,b);
 for(const[k,v]of Object.entries(e))if(!same(b[k],v))fail();for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&e[k]!==true)fail();
 if(outlines)for(const g of[700,4300,500,4400,4500,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color,...(d.ring?Array.from({length:8},(_,i)=>23+7*d.color+i):[]),...(d.waystation?Array.from({length:11},(_,i)=>79+i):[]),...(d.protected?Array.from({length:8},(_,i)=>117+i):[])])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(doorOutlines)for(const g of[1300,3800,2900,1000])if(!Array.isArray(doorOutlines.groups?.[g]?.frames))fail();return true;
}
