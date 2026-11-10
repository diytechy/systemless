import {assertMovingBombSpikeWaystationScope,assertMovingBombSpikeWaystationActor} from './moving-bomb-spike-waystation.mjs';
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';
import {spikeGridPoint} from './hazards.mjs';
import {sourceDotPaint,sourceGoalPaint} from './sliding-bomb-paint.mjs';

const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const words=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>int(v,0,65535));
const hex=a=>a.map(v=>v.toString(16).padStart(4,'0')).join('');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const signed=n=>n>32767?n-65536:n;
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
const excluded=['movingBombSpikeWaystationRules','movingCheckpointRingRules','movingMarkedBonusRules','movingMarkedGoalRules','movingElevatorRules','movingBombRules','markedTransferRules','pilotAbsentSlideRecoveryRules','bombRules','goodieOnlyRules','bombObjectInteractionRules','importedGoodie169Rules','combinedGoalBonusRules','slidingConnectorRules','slidingBombRules','slidingBombCheckpointRules','slidingTeleportRules','staticSlidingProgramRules','slidingGoodieRules','slidingGoodieProgramRules','slidingOilRules','slidingOilGoodieRingRules','elevatorRules','teleportRules','canonicalOilRules','canonicalOilSpikeRules','elevatorOilSpikeRules','bombOilElevatorRules','elevatorGoodieRules','coloredElevatorGoodieRules','rotatingSpikeRules','staticEnemyWallRules'];

function envelope(s){
 if(s?.activeMask!==1||s.difficulty!=='Child'||s.origin?.x!==74||s.origin?.y!==72||s.sourceGrid?.version!==12||s.sourceGrid.displaySizeRaw!==8||s.sourceGrid.rows!==8||s.sourceGrid.columns!==11)throw new Error('Explicit Child1/version12/large moving SPI source envelope required');
}
function sourceIdentity(s){
 if(!s||typeof s.sha256!=='string'||!/[0-9a-f]{64}/.test(s.sha256)||s.sha256.length!==64||!int(s.byteLength,8,0x7fffffff)||!int(s.resourceId,-32768,32767))throw new Error('Retained original moving SPI source identity required');
}
function spRecords(records,byteLength){
 if(!Array.isArray(records))throw new Error('Actual raw SPI inventory required');
 let end=8;const active=[];
 for(const [rawIndex,r]of records.entries()){
  if(!words(r.rawWords,6)||!int(r.offset,end,byteLength-12)||r.rawHex!==hex(r.rawWords))throw new Error('Original ordered SPI words/bytes/offsets required');
  end=r.offset+12;const w=r.rawWords,mask=w[4]*65536+w[5];
  if(!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3))throw new Error('SPI grid/subgrid outside qualified large universe');
  if(!(mask&1))continue; // Source mode filtering precedes allocation/cap/ordinal.
  if(mask!==15||active.length>=32)throw new Error('Qualified static SPI activation/capacity required');
  active.push({rawIndex,record:r});
 }
 if(!active.length)throw new Error('Explicit active static group200 SPI inventory required');
 return active;
}
function rawActor(a,slot,programs,cells){
 const human=slot<2,kind=a.actorTypeRaw,speed=a.rawWords?.[7],program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw],c=cells[a.gridPosition?.row*11+a.gridPosition?.column];
 if(!words(a.rawWords,11)||a.rawHex!==hex(a.rawWords)||kind!==a.rawWords[2]||a.gridPosition?.row!==a.rawWords[0]||a.gridPosition.column!==a.rawWords[1]||a.initialFrameHalfIndexRaw!==a.rawWords[3]||a.programReferenceRaw!==signed(a.rawWords[5])||a.activationMaskRaw!==a.rawWords[8]*65536+a.rawWords[9]||a.version12ByteRaw!==(a.rawWords[10]>>>8)||!int(a.version12ByteRaw,0,255)||!int(a.activationMaskRaw,0,0xffffffff)||!(a.activationMaskRaw&1)||!c?.present||human&&(kind!==[0,6][slot]||speed!==0||program!==null||!actorChecksWalls(a.version12ByteRaw)||c.flagsRaw&0x86)||!human&&(![1,2,3].includes(kind)||actorChecksWalls(a.version12ByteRaw)||!(speed===1||speed===3&&kind===1&&program===null&&!(c.flagsRaw&0x80))||program!==null&&(speed!==1||typeof program!=='string'||!/^[bfns]+$/.test(program)||!int(a.rawWords[6],1,program.length))))throw new Error('Qualified moving SPI source actor types/clocks/programs/starts required');
 return {rawRecord:a,sourceSlot:slot,sourceType:kind,speedClass:speed,checksWalls:actorChecksWalls(a.version12ByteRaw),program,initialPivot:`${c.column},${c.row}`};
}

export function assertMovingSpikeSource(level,{allowInactiveSpikes=false}={}){
 if(level?.structuralStatus!=='complete'||level.header?.version!==12||level.header.displaySizeRaw!==8||level.header.serializedRows!==8||level.header.serializedColumns!==11||level.header.displayRows!==8||level.header.displayColumns!==11)throw new Error('Complete original version12 large moving SPI source required');
 sourceIdentity(level);const records=k=>level.blocks?.find(b=>b.kind===k)?.records??[];
 if(!Array.isArray(level.blocks)||level.blocks.some(b=>b.count!==b.records?.length||b.count&&!['SP','WA','WP','TX'].includes(b.kind)))throw new Error('Moving SPI source excludes other object families');
 if(!allowInactiveSpikes&&records('SP').some(r=>!(r.rawWords?.[5]&1)))throw new Error('Explicit inactive SPI source mask filtering required');
 spRecords(records('SP'),level.byteLength);
 if(!Array.isArray(level.cells)||level.cells.length!==88)throw new Error('Complete source grid required');
 let goals=0,movers=0,bonuses=0;
 for(const [index,c]of level.cells.entries()){
  if(c.index!==index||c.row!==Math.floor(index/11)||c.column!==index%11||!int(c.flagsRaw,0,65535)||!int(c.secondaryRaw,0,65535)||c.present!==!!(c.flagsRaw&1)||!int(c.offset,8,level.byteLength-4))throw new Error('Original source cell identity required');
  if(!c.present)continue;
  const cell=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),moving=!!(cell&0x80);
  if(c.flagsRaw&~0x4087||![0,2,4,5].includes(dotColorOffset(c.secondaryRaw))||moving&&(cell&4)||cell&4&&(cell&2||dotColorOffset(c.secondaryRaw)!==0))throw new Error('Ordinary static/moving bonuses and separate static white goal required');
  if(cell&4)goals++;if(cell&2)bonuses++;
  if(moving){movers++;movingProgramCell(c);assertClosedMovingProgram(c.inlineProgram.text,{x:74+48*c.column,y:72+48*c.row});}
 }
 if(goals!==1||!movers||!bonuses)throw new Error('Moving SPI composition requires movers, bonuses and static goal');
 for(const a of records('WA'))if(!words(a.rawWords,11)||a.rawHex!==hex(a.rawWords)||a.actorTypeRaw!==a.rawWords[2]||a.activationMaskRaw!==a.rawWords[8]*65536+a.rawWords[9]||a.version12ByteRaw!==(a.rawWords[10]>>>8))throw new Error('Raw WA mode/type/byte identity required before Child filtering');
 const programs=records('WP').map(p=>p.text),actors=records('WA').filter(a=>a.activationMaskRaw&1);
 if(actors.length<2||actors.length>31)throw new Error('Two source human specs and bounded WA slots required');
 for(const a of actors)if(a.programReferenceRaw>=0){const p=records('WP')[a.programReferenceRaw],length=1+(p?.text?.length??0);if(!p||typeof p.text!=='string'||p.byteLength!==undefined&&p.byteLength!==length||!int(p.offset,8,level.byteLength-length)||p.rawHex!==p.text.length.toString(16).padStart(2,'0')+[...p.text].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))throw new Error('Referenced original WP Pascal bytes/text required');}
 actors.forEach((a,i)=>rawActor(a,i,programs,level.cells));
 return true;
}

export function movingSpikeSource(level){
 assertMovingSpikeSource(level,{allowInactiveSpikes:true});const records=k=>level.blocks.find(b=>b.kind===k)?.records??[],programs=records('WP').map(r=>r.text);
 return freeze({sha256:level.sha256,byteLength:level.byteLength,resourceId:level.resourceId,
  cells:level.cells.map(c=>({index:c.index,row:c.row,column:c.column,present:c.present,flagsRaw:c.flagsRaw,secondaryRaw:c.secondaryRaw,offset:c.offset,...(c.inlineProgram?{inlineProgram:{...c.inlineProgram}}:{}),byteLength:c.byteLength,rawHex:c.rawHex})),
  spikes:records('SP').map(r=>({offset:r.offset,rawHex:r.rawHex,rawWords:[...r.rawWords]})),
  actors:records('WA').filter(a=>a.activationMaskRaw&1).map((a,i)=>{const x=rawActor(a,i,programs,level.cells);return {sourceSlot:i,sourceRawRecord:records('WA').indexOf(a),sourceActorType:x.sourceType,speedClass:x.speedClass,checksWalls:x.checksWalls,program:x.program,sourceProgramReference:a.programReferenceRaw,initialPivot:x.initialPivot};})});
}

export function assertMovingSpikeActor(a,{dots,source,program=a?.program,initial=false}={}){
 const spec=source?.actors?.[a?.sourceSlot],d=dots?.find(d=>d.id===a?.pivot),human=a?.sourceSlot<2,group={1:500,2:4400,3:4500,6:4300}[a?.sourceActorType];
 if(!a||!spec||!d||a.sourceSlot!==spec.sourceSlot||a.sourceActorType!==spec.sourceActorType||a.sourceRawRecord!==spec.sourceRawRecord||a.sourceProgramReference!==spec.sourceProgramReference||a.speedClass!==spec.speedClass||a.checksWalls!==spec.checksWalls||program!==spec.program||a.program!==program||![-1,1].includes(a.direction)||typeof a.visible!=='boolean'||typeof a.orphaned!=='boolean'||(a.sourceActorType===0?![700,4300].includes(a.group):a.group!==group)||initial&&!Number.isFinite(a.angle)||human&&(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||program!==null)||!human&&(![1,2,3].includes(a.sourceActorType)||a.canonicalFrame!==true||!int(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||(a.unwrappedFrame&63)!==a.frame||a.checksWalls!==false||!(a.speedClass===1||a.speedClass===3&&a.sourceActorType===1&&program===null&&d.motion==='static')||program!==null&&(!/^[bfns]+$/.test(program)||!int(a.sourcePC,1,program.length)))||initial&&(a.pivot!==spec.initialPivot||human&&(d.motion!=='static'||d.kind!=='dot'||d.bonus)))throw new Error('Retained source moving SPI actor identity/type/group/PC required');
 return true;
}

export function assertMovingSpikeScope(s,{initial=false}={}){
 envelope(s);if(s.movingSpikeRules!==true||s.movingDotRules!==true||s.canonicalPlayerRules!==true||s.staticEnemyCallbacks!==true||s.specialDotRules!==true||s.childScoreRules!==true||excluded.some(k=>s[k]!==undefined&&s[k]!==false))throw new Error('Separate default-off moving SPI composition required');
 for(const k of ['bombs','goodies','connectors','walls','doors','switches','puddles','elevators','teleports','guns','triggers'])if(s[k]!==undefined&&(!Array.isArray(s[k])||s[k].length)||!['guns','triggers'].includes(k)&&!Array.isArray(s[k]))throw new Error('Moving SPI requires actual empty '+k+' inventory');
 const source=s.movingSpikeSource;sourceIdentity(source);if(s.resourceId!==source.resourceId)throw new Error('Normalized board/original source resource identity mismatch');
 if(!Array.isArray(source.cells)||source.cells.length!==88||!Array.isArray(source.actors)||source.actors.length<2||source.actors.length>31)throw new Error('Retained complete source SPI declaration required');
 let cellEnd=8;
 for(const [i,c]of source.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||!int(c.flagsRaw,0,65535)||!int(c.secondaryRaw,0,65535)||c.present!==!!(c.flagsRaw&1)||c.offset!==cellEnd||!int(c.offset,8,source.byteLength-4)||c.rawHex!==hex([c.flagsRaw,c.secondaryRaw])+(c.inlineProgram?.rawHex??'')||c.byteLength!==c.rawHex.length/2||c.offset+c.byteLength>source.byteLength)throw new Error('Original retained source grid schema/word identity required');
  cellEnd+=c.byteLength;
 }
 if(source.spikes.some((r,i)=>r.offset!==cellEnd+4+12*i))throw new Error('Retained SPI section offsets must follow source grid/emptyHY count');
 for(const [i,a]of source.actors.entries()){
  const human=i<2,c=source.cells.find(c=>`${c.column},${c.row}`===a.initialPivot);
  if(a.sourceSlot!==i||!int(a.sourceRawRecord,0,65535)||i&&a.sourceRawRecord<=source.actors[i-1].sourceRawRecord||!int(a.sourceProgramReference,-1,65535)||(a.program===null)!==(a.sourceProgramReference===-1)||a.program!==null&&(typeof a.program!=='string'||!a.program.length||a.program.length>255||!/^[bfns]+$/.test(a.program))||!c?.present||(human?(a.sourceActorType!==[0,6][i]||a.speedClass!==0||a.program!==null||a.checksWalls!==true||c.flagsRaw&0x86):(![1,2,3].includes(a.sourceActorType)||a.checksWalls!==false||!(a.speedClass===1||a.speedClass===3&&a.sourceActorType===1&&a.program===null&&!(c.flagsRaw&0x80)))))throw new Error('Original source WA slot/type/class/byte/program schema required');
 }
 const present=source.cells.filter(c=>c.present);if(!Array.isArray(s.dots)||s.dots.length!==present.length)throw new Error('Original source dot inventory required');
 let goals=0,movers=0,bonuses=0;const ids=new Set();
 for(const [i,d]of s.dots.entries()){
  const c=present[i],cell=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),moving=!!(cell&0x80),live=cell&~(d.bonus?0:2),point={x:74+48*c.column,y:72+48*c.row};
  if(c.index!==c.row*11+c.column||!int(c.index,0,87)||i&&present[i-1].index>=c.index||d.id!==`${c.column},${c.row}`||ids.has(d.id)||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||c.flagsRaw&~0x4087||d.cell!==live||d.flags!==c.secondaryRaw||d.color!==dotColorOffset(c.secondaryRaw)||![0,2,4,5].includes(d.color)||!same(d.sourceInitialPosition,point)||!int(d.x,-32768,32767)||!int(d.y,-32768,32767)||(initial||!moving)&&(d.x!==point.x||d.y!==point.y)||d.motion!==(moving?'moving-program':'static')||d.motionType!==(moving?1:0)||d.present!==true||d.humanCanGrab!==true||d.nonhumanCanGrab!==true||d.sourceCollidable!==true||typeof d.bonus!=='boolean'||['sourceInBackground','ring','protected','transferDeath'].some(k=>typeof d[k]!=='boolean')||d.sourceInitialBonus!==!!(cell&2)||d.bonus&&!d.sourceInitialBonus||initial&&d.bonus!==d.sourceInitialBonus||d.kind!==(cell&4?'goal':d.bonus?'bonus':'dot')||d.sourceHasSprite!==(moving||!!(cell&6))||d.sourceInBackground===d.sourceHasSprite||d.teleport!==false||d.slideMask!==0||d.ring||d.protected||d.waystation||d.transferDeath||d.upDown||d.slowdown||d.connector||d.burnt||d.sourceBombDynamic)throw new Error('Original effective moving SPI dot identity/properties required');
  if(moving){movers++;movingProgramCell(c);if(d.movingProgram!==c.inlineProgram.text||!same(d.sourceMovingProgram,{offset:c.inlineProgram.offset,rawHex:c.inlineProgram.rawHex,paddingHex:c.inlineProgram.paddingHex}))throw new Error('Retained moving program mismatch');assertClosedMovingProgram(d.movingProgram,point);}
  else if(d.movingProgram||d.sourceMovingProgram!==undefined)throw new Error('Static moving-program declaration forbidden');
  if(cell&4){goals++;if(moving||d.color!==0||cell&2)throw new Error('Separate static white goal required');}if(cell&2)bonuses++;ids.add(d.id);
 }
 if(goals!==1||!movers||!bonuses)throw new Error('Moving SPI inventory composition required');
 const active=spRecords(source.spikes,source.byteLength);if(!Array.isArray(s.spikes)||s.spikes.length!==active.length)throw new Error('Active filtered SPI inventory mismatch');
 for(const [i,p]of s.spikes.entries()){
  const w=active[i].record.rawWords,q=spikeGridPoint({rawWords:w},s.origin);
  if(p.id!==i||p.row!==w[0]||p.column!==w[1]||p.subrow!==w[2]||p.subcolumn!==w[3]||p.activationMask!==w[4]*65536+w[5]||p.phase!==i%4||p.x!==q.x||p.y!==q.y||typeof p.visible!=='boolean'||initial&&!p.visible)throw new Error('Immutable original SPI grid/subgrid/order/reference-point required');
 }
 if(!Array.isArray(s.enemies)||s.enemies.length!==source.actors.length-2||s.player?.sourceSlot!==0||s.enemies.some((a,i)=>a.sourceSlot!==i+2)||source.actors[1].initialPivot!==source.actors[0].initialPivot)throw new Error('Complete ordered source WA inventory and shared human start required');
 const actors=[s.player,...s.enemies];let last=-1;
 for(const a of actors){assertMovingSpikeActor(a,{dots:s.dots,source,initial});if(a.sourceSlot<=last)throw new Error('Ordered unique WA slots required');last=a.sourceSlot;}
 if(initial&&(!Array.isArray(s.movingHumanStarts)||s.movingHumanStarts.length!==2||source.actors[0].sourceActorType!==0||source.actors[1].sourceActorType!==6||s.movingHumanStarts.some((id,i)=>id!==source.actors[i].initialPivot)||s.movingHumanStarts[0]!==s.player?.pivot))throw new Error('Original human source slots/starts required');
 return true;
}

export function assertMovingSpikePhysics(board,outlines,dotOutlines){
 for(const group of new Set([700,4300,...[board.player,...board.enemies].map(a=>a.group)]))for(let f=0;f<64;f++)if(!outlines?.groups?.[group]?.frames?.[f])throw new Error('All64 original moving SPI actor outlines required');
 for(let f=0;f<4;f++){const s=outlines?.groups?.['200']?.frames?.[f];if(!s||!['left','right','top','bottom'].every(k=>Number.isInteger(s[k]))||!Array.isArray(s.rows)||s.rows.length!==s.bottom-s.top)throw new Error('All4 original group200 scanline outlines required');}
 for(const d of board.dots)for(const f of[9+d.color,...(d.sourceInitialBonus?[1+d.color]:[])])if(!dotOutlines?.groups?.['300']?.frames?.[f])throw new Error('Original mixed/static/moving DOT outlines required');
}

export function validateMovingSpikeAssets(board,assets){
 assertMovingSpikeScope(board,{initial:true});
 for(const d of board.dots)for(const group of ['300','4100'])for(const frame of[9+d.color,...(d.sourceInitialBonus?[1+d.color]:[])])sourceDotPaint(assets,group,frame);
 for(let f=17;f<=22;f++)sourceGoalPaint(assets,f);
 const spikes=assets?.spikes;if(!spikes||!Array.isArray(spikes.frames)||spikes.frames.length!==4)throw new Error('Required4 source SPI artwork frames unavailable');
 for(const [i,f]of spikes.frames.entries())if(!f||typeof f.file!=='string'||!f.file||f.sourceGroup!==200||f.sourceFrame!==i||!['x','y','width','height'].every(k=>Number.isInteger(f[k]))||f.width<=0||f.height<=0)throw new Error('Source SPI artwork DTO/anchor/ordered identity required');
 return true;
}

const identity=s=>[s.id,s.row,s.column,s.subrow,s.subcolumn,s.x,s.y,s.phase,s.activationMask];
// _SPCreate passes allocated ordinal. SPSpec2Info:990c..991c uses signed
// remainder helper58c with divisor4 for SUSetFrameIndex. The later &3 selects
// a phase-bank POINTER independently; its VALUE initializes the reference.
export function sourceSpikeInitialFrame(createdOrdinal){if(!int(createdOrdinal,0,31))throw new Error('Allocated source SPI ordinal0..31 required');return createdOrdinal%4;}
export function createMovingSpikeLifecycle(spikes,{allowMovingSpikes=false,allowMovingBombSpikeWaystation=false,sourceScope}={}){
 if(typeof allowMovingBombSpikeWaystation!=='boolean'||allowMovingBombSpikeWaystation&&allowMovingSpikes||!allowMovingBombSpikeWaystation&&allowMovingSpikes!==true||sourceScope?.spikes!==spikes)throw new Error('Explicit separate SPI lifecycle capability and source inventory required');
 if(allowMovingBombSpikeWaystation)assertMovingBombSpikeWaystationScope(sourceScope);else assertMovingSpikeScope(sourceScope);
 let bank=[0,0,0,0],shared=0; // Fresh constructed source clock graph/DATA bank.
 const objects=[...spikes],stamp=()=>{const s=allowMovingBombSpikeWaystation?sourceScope.movingBombSpikeWaystationSource:sourceScope.movingSpikeSource;return JSON.stringify([s.sha256,s.byteLength,s.resourceId,s.spikes]);},sourceStamp=stamp();
 const original=freeze(spikes.map(identity)),states=new Map(spikes.map(s=>[s.id,{frame:sourceSpikeInitialFrame(s.id),reference:bank[s.phase]}]));
 const check=ss=>{if(ss!==spikes||sourceScope.spikes!==spikes||stamp()!==sourceStamp||ss.some((s,i)=>s!==objects[i])||!same(ss.map(identity),original))throw new Error('Existing SPI source/instance identity/inventory changed across reset');};
 return {
  reset(ss){check(ss);for(const s of ss)s.visible=true;},
  poll(ss){check(ss);for(const s of ss){const v=states.get(s.id),r=bank[s.phase];if(!int(v?.frame,0,3)||!int(v.reference,0,r))throw new Error('Invalid persistent SPI frame/reference');if(v.reference!==r){v.reference=r;v.frame=(v.frame+1)%4;}}},
  latchBank(count){check(spikes);if(!int(count,shared,Number.MAX_SAFE_INTEGER))throw new Error('Source SPI shared count cannot rewind');shared=count;bank=bank.map((_,n)=>Math.floor((count+n)/4));},
  frame(s){check(spikes);if(!objects.includes(s))throw new Error('SPI lookup must use retained source instance');return states.get(s.id).frame;},
  snapshot(){check(spikes);return {sharedCount:shared,bank:[...bank],spikes:spikes.map(s=>({id:s.id,frame:states.get(s.id).frame,reference:states.get(s.id).reference,identity:[...original[s.id]]}))};}
 };
}
