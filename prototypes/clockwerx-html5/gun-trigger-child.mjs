// First GN/TR composition: one east-firing gun, one same-color trigger,
// lowered white group-0/1 dots and ordinary Child callbacks. Other joins stay off.
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {activeElevatorSpecs} from './elevators.mjs';
import {dotColorOffset} from './dots.mjs';

const frameOrigin=Object.freeze({x:28,y:28});
const sourceRawBounds=Object.freeze({left:28,top:28,right:612,bottom:452});
const legalCell=new Set([1,3,5,0x4011,0x4101,0x4201]);
const fail=()=>{throw new Error('Separate Child gun/trigger/projectile and lowered elevator composition required');};
const controlsOK=controls=>controls.length===4&&controls.filter(s=>s.group===0&&s.subcell===2).length===2&&controls.filter(s=>s.group===1&&s.subcell===1).length===1&&controls.filter(s=>s.group===1&&s.subcell===3).length===1;
const scopeOK=(guns,triggers)=>guns.length===1&&triggers.length===1&&guns[0].placement===1&&guns[0].directions===2&&guns[0].color===1&&triggers[0].placement===2&&triggers[0].color===1;

export function gunTriggerChildSource(level,origin,activeMask=1){
 if(activeMask!==1||level?.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||origin?.x!==74||origin?.y!==72||!Array.isArray(level.cells)||!Array.isArray(level.blocks))fail();
 const allowed=new Set(['GN','TR','WY','EL','WP','WA','TX']);
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const geometry={gridOrigin:origin,frameOrigin,activeMask},guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geometry}),triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geometry});
 if(!scopeOK(guns,triggers)||!controlsOK(activeElevatorSpecs(records('EL'),activeMask)))fail();
 const dots=level.cells.filter(c=>c.present),lowered=dots.filter(c=>c.flagsRaw&0x300),checkpoints=dots.filter(c=>c.flagsRaw===0x4011);
 if(dots.some(c=>!legalCell.has(c.flagsRaw)||!Number.isInteger(c.secondaryRaw)||!(c.secondaryRaw&activeMask)||![0,1].includes(dotColorOffset(c.secondaryRaw)))||dots.filter(c=>c.flagsRaw===5).length!==1||checkpoints.length!==1||lowered.length!==2||![0x4101,0x4201].every(k=>lowered.some(c=>c.flagsRaw===k&&dotColorOffset(c.secondaryRaw)===0)))fail();
 const wy=records('WY'),cp=checkpoints[0],w=wy[0]?.rawWords;
 if(wy.length!==1||!Array.isArray(w)||w.length!==6||w[0]!==cp.row||w[1]!==cp.column||![-1,1,65535].includes(w[3])||!((w[4]*65536+w[5])&activeMask)||dotColorOffset(cp.secondaryRaw)!==0)fail();
 const actors=records('WA').filter(a=>a.activationMaskRaw&activeMask),programs=records('WP');
 if(actors.length!==5||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||actors.some((a,i)=>{
  const d=dots.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column);
  if(!d||(d.flagsRaw&0x314)||!Array.isArray(a.rawWords)||a.rawWords[7]!==Number(i>=2))return true;
  if(i<2)return a.programReferenceRaw!==-1;
  const program=programs[a.programReferenceRaw]?.text;
  return a.actorTypeRaw!==1||a.version12ByteRaw!==0||typeof program!=='string'||!/^[bs]+$/.test(program)||!Number.isInteger(a.rawWords[6])||a.rawWords[6]<1||a.rawWords[6]>program.length;
 }))fail();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...sourceRawBounds}};
}

export function assertGunTriggerChildBoard(b,gunOutlines,elevatorOutlines){
 const c=b?.gunTriggerChild,low=b?.dots?.filter(d=>d.upDown)??[],actor=b?.player,others=b?.enemies??[];
 if(b?.gunTriggerProjectileRules!==true||b.difficulty!=='Child'||b.activeMask!==1||!b.elevatorRules||!b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||b.movingDotRules||b.bombRules||b.goodieOnlyRules||b.slidingConnectorRules||b.teleportRules||b.rotatingSpikeRules||['spikes','walls','doors','switches','puddles'].some(k=>b[k]?.length)||!c||!scopeOK(c.guns,c.triggers)||!controlsOK(b.elevators??[]))fail();
 if(c.frameOrigin.x!==frameOrigin.x||c.frameOrigin.y!==frameOrigin.y||Object.keys(sourceRawBounds).some(k=>c.rawBounds[k]!==sourceRawBounds[k]))fail();
 if(low.length!==2||![0,1].every(g=>low.some(d=>d.upDown.group===g&&d.upDown.initialLowered&&d.color===0&&d.kind==='dot'))||b.dots.filter(d=>d.kind==='goal').length!==1||b.dots.filter(d=>d.waystation).length!==1||b.dots.some(d=>d.ring||d.protected||d.teleport||d.motion==='moving-program')||actor?.sourceActorType!==0||actor.speedClass!==0||others.length!==3||others.some(e=>e.sourceActorType!==1||e.speedClass!==1||e.checksWalls!==false||!/^[bs]+$/.test(e.program??'')))fail();
 if(!elevatorOutlines?.groups?.['3400']||!gunOutlines?.groups)throw new Error('Original GN/TR/PR and elevator outlines required');
 for(const [group,n] of [[3300,6],[4200,3]])for(let i=0;i<n;i++){
  const f=gunOutlines.groups[String(group)]?.frames?.[i];
  if(!f||f.collidable===false||f.outlineIndex===-1||!['left','top','right','bottom'].every(k=>Number.isInteger(f[k]))||f.right<f.left||f.bottom<f.top||f.rows!==null&&(!Array.isArray(f.rows)||f.rows.length!==f.bottom-f.top))throw new Error(`Original collision frame ${group}:${i} required`);
 }
}
