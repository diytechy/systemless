import {effectiveMovingCell} from './moving-dots.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorInitialFrame} from './hazards.mjs';
import {advanceStaticEnemyCallback} from './enemy-transfer.mjs';
import {queryIndexedSourceGrab,grabSourceActor} from './source-grab.mjs';

const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const word=n=>n.toString(16).padStart(4,'0');
const signed=n=>n>32767?n-65536:n;
const group={0:700,6:4300,1:500,2:4400,3:4500,4:3500};
const fail=()=>{throw new Error('Separate static marked/orbital source composition required');};
const records=(s,k)=>s.blocks?.find(b=>b.kind===k)?.records??[];
// This alias reuses the original property-mask operation without admitting motion.
export const effectiveStaticMarkedCell=effectiveMovingCell;
function words(r,n){if(!Array.isArray(r?.rawWords)||r.rawWords.length!==n||r.rawWords.some(x=>!int(x,0,65535))||r.byteLength!==2*n||r.rawHex!==r.rawWords.map(word).join('')||!int(r.offset,4,0x7fffffff))fail();return r.rawWords;}
function program(r){const text=r?.text,padding=r?.paddingHex;if(typeof text!=='string'||!text.length||text.length>255||typeof padding!=='string'||padding!==''||!int(r.offset,4,0x7fffffff)||r.rawHex!==text.length.toString(16).padStart(2,'0')+[...text].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('')+padding)fail();return text;}
export function assertStaticMarkedOrbitalSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.header.serializedRows!==8||s.header.serializedColumns!==11||!Array.isArray(s.cells)||s.cells.length!==88||!Array.isArray(s.blocks))fail();
 const kinds=new Set();for(const b of s.blocks){if(kinds.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||!['WA','WP','PU'].includes(b.kind)&&b.count)fail();kinds.add(b.kind);}
 let goals=0,marks=0;
 for(const [i,c]of s.cells.entries()){
  if(c.index!==i||c.offset!==8+4*i||c.row!==Math.floor(i/11)||c.column!==i%11||!int(c.flagsRaw,0,65535)||!int(c.secondaryRaw,0,65535)||c.byteLength!==4||c.rawHex!==word(c.flagsRaw)+word(c.secondaryRaw)||c.present!==!!(c.flagsRaw&1)||c.flagsRaw&~0x6007||c.inlineProgram)fail();
  const e=effectiveStaticMarkedCell(c.flagsRaw,c.secondaryRaw,1),color=dotColorOffset(c.secondaryRaw);
  if(c.present){if(![0,1,2,4].includes(color)||e&0x2000&&e&6||e&4&&(color!==0||e&2))fail();if(e&4)goals++;if(e&0x2000)marks++;}
 }
 if(goals!==1||!marks)fail();
 for(const r of records(s,'PU')){const w=words(r,5);if((w[3]*65536+w[4])&1)fail();}
 const ps=records(s,'WP').map(program),all=records(s,'WA');let active=0,orbitals=0;
 for(const r of all){
  const w=words(r,11),type=w[2],ref=signed(w[5]);if(r.actorTypeRaw!==type||r.programReferenceRaw!==ref||r.activationMaskRaw!==w[8]*65536+w[9]||r.version12ByteRaw!==(w[10]>>8)||r.initialFrameHalfIndexRaw!==signed(w[3])||r.gridPosition?.row!==w[0]||r.gridPosition?.column!==w[1])fail();
  if(!(r.activationMaskRaw&1))continue;
  const human=active<2,text=ref>=0?ps[ref]:null,c=s.cells[w[0]*11+w[1]];
  if(!c?.present||![-1,1].includes(signed(w[4]))||human&&(type!==[0,6][active]||w[7]!==0||ref!==-1)||!human&&(![1,2,3,4].includes(type)||w[7]!==1||r.version12ByteRaw!==0||type!==4&&ref!==-1||ref>=0&&(typeof text!=='string'||!/^[ns]+$/.test(text)||!int(w[6],1,text.length))))fail();
  if(type===4)orbitals++;active++;
 }
 if(active<3||active>31||!orbitals)fail();return true;
}
export function staticMarkedOrbitalSource(level){assertStaticMarkedOrbitalSource(level);return JSON.parse(JSON.stringify({structuralStatus:level.structuralStatus,header:level.header,cells:level.cells,blocks:level.blocks}));}
const excluded=['movingDotRules','movingSpikeRules','movingMarkedGoalRules','movingMarkedBonusRules','movingCheckpointRingRules','movingElevatorRules','movingBombRules','pilotAbsentSlideRecoveryRules','bombRules','goodieOnlyRules','slidingConnectorRules','elevatorRules','teleportRules','canonicalOilRules','staticEnemyWallRules','fastRotatingSpikeRules','slowRotatingSpikeRules','class2RotatingSpikeRules','class3RotatingSpikeRules','rotatingSpikeBounceRules'];
export function assertStaticMarkedOrbitalScope(b,{initial=false,actors=[b?.player,...(b?.enemies??[])]}={}){
 if(b?.staticMarkedOrbitalRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.canonicalPlayerRules!==true||b.staticEnemyCallbacks!==true||b.specialDotRules!==true||b.childScoreRules!==true||b.markedTransferRules!==true||b.rotatingSpikeRules!==true||b.rotatingSpikeTransferRules!==true||b.origin?.x!==74||b.origin.y!==72||excluded.some(k=>b[k]))fail();
 for(const k of ['spikes','puddles','walls','doors','switches','bombs','goodies','connectors','elevators','teleports','guns','triggers'])if(!Array.isArray(b[k])||b[k].length)fail();
 const s=b.staticMarkedOrbitalSource;assertStaticMarkedOrbitalSource(s);const present=s.cells.filter(c=>c.present);if(b.dots?.length!==present.length)fail();
 for(const [i,d]of b.dots.entries()){
  const c=present[i],e=effectiveStaticMarkedCell(c.flagsRaw,c.secondaryRaw,1),unbonused=e&~2;
  if(d.id!==`${c.column},${c.row}`||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||d.flags!==c.secondaryRaw||d.cell!==(initial?e:d.bonus?e:unbonused)||d.motion!=='static'||d.x!==74+48*c.column||d.y!==72+48*c.row||d.color!==dotColorOffset(c.secondaryRaw)||d.present!==true||d.humanCanGrab!==true||d.nonhumanCanGrab!==true||d.sourceCollidable!==true||d.transferDeath!==!!(e&0x2000)||d.bonus!==!!(d.cell&2)||d.sourceInitialBonus!==!!(e&2)||d.kind!==(e&4?'goal':d.bonus?'bonus':'dot')||d.sourceInBackground!==!(e&0x1e)||d.sourceHasSprite!==!!(e&0x1e)||d.slideMask!==0||d.teleport!==false||d.ring!==false||d.protected!==false||d.waystation||d.upDown||d.slowdown||d.movingProgram||d.burnt||initial&&d.collected)fail();
 }
 const raw=records(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=records(s,'WP');if(!Array.isArray(actors)||!actors.length||initial&&actors.length!==active.length-1)fail();
 const slots=new Set();for(const a of actors){
  const r=active[a?.sourceSlot],human=a?.sourceSlot===0,type=r?.actorTypeRaw,ref=r?.programReferenceRaw,text=ref>=0?ps[ref]?.text:null,d=b.dots.find(d=>d.id===a?.pivot);
  if(!r||a.sourceSlot===1||slots.has(a.sourceSlot)||a.sourceRawRecord!==raw.indexOf(r)||a.sourceActorType!==type||a.sourceProgramReference!==ref||a.program!==text||a.group!==group[type]&&!(human&&type===0&&a.group===4300)||typeof a.visible!=='boolean'||typeof a.orphaned!=='boolean'||initial&&(a.visible!==true||a.orphaned!==false)||a.speedClass!==r.rawWords[7]||a.checksWalls!==!!r.version12ByteRaw||!d||![-1,1].includes(a.direction)||!human&&(a.canonicalFrame!==true||!int(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||(a.unwrappedFrame&63)!==a.frame)||text!==null&&(!int(a.sourcePC,1,text.length)||JSON.stringify(a.sourceStaticProgram)!==JSON.stringify(ps[ref]))||text===null&&a.sourceStaticProgram!==undefined||initial&&(a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`||a.direction!==signed(r.rawWords[4])||a.angle!==actorInitialFrame(r.initialFrameHalfIndexRaw)*Math.PI*2/64||text!==null&&a.sourcePC!==r.rawWords[6]))fail();slots.add(a.sourceSlot);
 }
 return true;
}
export function assertStaticMarkedOrbitalPhysics(board,outlines,dotOutlines){
 assertStaticMarkedOrbitalScope(board,{initial:true});
 for(const g of new Set([4300,...[board.player,...board.enemies].map(a=>a.group)]))for(let i=0;i<64;i++){
  const f=outlines?.groups?.[g]?.frames?.[i];if(!f||!Array.isArray(f.rows)||!['left','top','right','bottom'].every(k=>Number.isInteger(f[k]))||typeof f.flipY!=='boolean')fail();
  if(g===3500&&(!Array.isArray(f.descriptorRaw)||f.descriptorRaw.length!==15||f.outlineIndex<0||!f.outline?.sha256||f.left!==f.descriptorRaw[10]-44||f.top!==f.descriptorRaw[9]-43||f.right!==f.left+f.descriptorRaw[14]||f.bottom!==f.top+f.descriptorRaw[13]||f.flipY!==!!(f.descriptorRaw[2]&256)))fail();
 }
 for(const d of board.dots){const i=d.transferDeath?108+d.color:d.bonus?1+d.color:9+d.color,f=dotOutlines?.groups?.[300]?.frames?.[i];if(!f||f.outlineIndex<0||!Array.isArray(f.rows))fail();}return true;
}
// Existing current-pixel query/WAGrab primitives are reused unchanged. Their
// explicit query permission is local; this composition never sets moving core.
export function staticMarkedHumanQuery(board,actor,{allowStaticMarkedOrbitals=false}={}){
 if(allowStaticMarkedOrbitals!==true)fail();assertStaticMarkedOrbitalScope(board,{actors:[actor]});if(actor.sourceActorType!==0||actor.sourceSlot!==0||actor.canonicalFrame!==true||!int(actor.frame,0,63)||!Number.isInteger(actor.unwrappedFrame)||(actor.unwrappedFrame&63)!==actor.frame||actor.frame%16)fail();
 const offset={0:{row:0,column:1},16:{row:1,column:0},32:{row:0,column:-1},48:{row:-1,column:0}}[actor.frame],dots=board.dots.map(d=>({...d,motionType:0,currentPixel:{x:d.x,y:d.y},intermediate:{valid:false}}));
 return {dots,result:queryIndexedSourceGrab(dots,{originIndex:dots.find(d=>d.id===actor.pivot).sourceIndex,offset,human:true,connectors:[],allowMovingQueries:true})};
}
export function grabStaticMarkedHuman(board,actor,query,adapters,{allowStaticMarkedOrbitals=false}={}){
 if(allowStaticMarkedOrbitals!==true)fail();const expected=staticMarkedHumanQuery(board,actor,{allowStaticMarkedOrbitals:true});if(JSON.stringify(query.result)!==JSON.stringify(expected.result))fail();
 return grabSourceActor(actor,expected.result,{...adapters,dots:expected.dots,connectors:[],allowMovingQueries:true,allowMarkedTransfers:true});
}
export function advanceStaticMarkedOrbitalCallback(board,state,delta,options,{allowStaticMarkedOrbitals=false}={}){
 if(allowStaticMarkedOrbitals!==true)fail();assertStaticMarkedOrbitalScope(board,{actors:[state]});if(state.sourceSlot<2||options.program!==state.program||options.dots!==board.dots||options.allowRotatingSpikes!==true||options.allowRotatingSpikeTransfers!==true||['allowMovingDots','allowMovingSpikes','allowMovingBombs','allowMovingMarkedGoals','allowMovingMarkedBonuses','allowMovingCheckpointRings','allowMovingElevators','allowSliding','allowTeleports','allowUpDownDots','allowRotatingSpikeBounces','allowFastRotatingSpikes','allowSlowRotatingSpikes','allowClass2RotatingSpikes','allowClass3RotatingSpikes'].some(k=>options[k]))fail();
 return advanceStaticEnemyCallback(state,delta,options);
}
