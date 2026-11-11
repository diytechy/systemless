// First GN/TR composition: one east-firing gun, one same-color trigger,
// lowered white group-0/1 dots and ordinary Child callbacks. Other joins stay off.
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {activeElevatorSpecs} from './elevators.mjs';
import {dotColorOffset} from './dots.mjs';
import {activePuddleSpecs} from './oil.mjs';
import {activeTeleportSpecs,pairTeleportSpecs} from './teleports.mjs';

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
 assertGunTriggerOutlines(gunOutlines);
}

function assertGunTriggerOutlines(gunOutlines){
 for(const [group,n] of [[3300,6],[4200,3]])for(let i=0;i<n;i++){
  const f=gunOutlines?.groups?.[group]?.frames?.[i];
  if(!f||f.collidable===false||f.outlineIndex===-1||!['left','top','right','bottom'].every(k=>Number.isInteger(f[k]))||f.right<f.left||f.bottom<f.top||f.rows!==null&&(!Array.isArray(f.rows)||f.rows.length!==f.bottom-f.top))throw new Error(`Original collision frame ${group}:${i} required`);
 }
}

const failWalls=()=>{throw new Error('Separate Child multi-gun, wall and static-spike composition required');};
const wallGunsOK=(guns,triggers)=>guns.length===3&&guns.every((g,i)=>g.color===0&&g.placement===3&&g.directions===[8,1,8][i])&&
 triggers.length===1&&triggers[0].color===0&&triggers[0].placement===1;
const staticWords=new Set([1,3,5]);
const wallActorsOK=actors=>actors.length===5&&actors.every(a=>[1,2,3].includes(a.type)&&[1,3].includes(a.speed)&&!a.walls&&/^[fns]+$/.test(a.program??'')&&
 Number.isInteger(a.pc)&&a.pc>=1&&a.pc<=a.program.length)&&actors.filter(a=>a.speed===3).length===1;

export function gunTriggerWallSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin?.x!==74||origin?.y!==72||!Array.isArray(level.blocks)||!Array.isArray(level.cells))failWalls();
 const allowed=new Set(['GN','TR','WL','SP','PU','WP','WA','TX']);
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))failWalls();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const geo={gridOrigin:origin,frameOrigin,activeMask:mask};
 const guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo}),triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo});
 const spikes=records('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask),puddles=records('PU');
 if(!wallGunsOK(guns,triggers)||!records('WL').length||spikes.length!==2||spikes.some(r=>r.rawWords[4]!==0||r.rawWords[5]!==15)||
    activePuddleSpecs(puddles,mask).length)failWalls();
 const dots=level.cells.filter(c=>c.present),programs=records('WP');
 if(dots.some(c=>!staticWords.has(c.flagsRaw)||c.inlineProgram||!(c.secondaryRaw&mask))||dots.filter(c=>c.flagsRaw===5).length!==1)failWalls();
 const actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors[0]?.actorTypeRaw!==0||actors[1]?.actorTypeRaw!==6||
    actors.some(a=>!dots.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row&&c.flagsRaw!==5))||
    actors.slice(0,2).some(a=>a.programReferenceRaw!==-1||a.rawWords?.[7]!==0)||
    !wallActorsOK(actors.slice(2).map(a=>({type:a.actorTypeRaw,speed:a.rawWords?.[7],walls:a.version12ByteRaw!==0,
      program:programs[a.programReferenceRaw]?.text,pc:a.rawWords?.[6]}))))failWalls();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...sourceRawBounds}};
}

export function assertGunTriggerWallBoard(b,gunOutlines){
 const c=b.gunTriggerChild,dots=b.dots??[];
 if(!b.gunTriggerProjectileRules||!b.gunTriggerWallRules||b.difficulty!=='Child'||b.activeMask!==1||!b.canonicalPlayerRules||
    !b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||b.movingDotRules||b.bombRules||b.goodieOnlyRules||
    b.slidingConnectorRules||b.teleportRules||b.rotatingSpikeRules||b.elevatorRules||
    ['doors','switches','puddles'].some(k=>b[k]?.length)||!b.walls?.length||b.spikes?.length!==2||
    !c||!wallGunsOK(c.guns,c.triggers)||Object.keys(frameOrigin).some(k=>c.frameOrigin?.[k]!==frameOrigin[k])||
    Object.keys(sourceRawBounds).some(k=>c.rawBounds?.[k]!==sourceRawBounds[k])||b.player?.sourceActorType!==0||
    b.player.speedClass!==0||b.player.checksWalls!==true||
    !wallActorsOK((b.enemies??[]).map(a=>({type:a.sourceActorType,speed:a.speedClass,walls:a.checksWalls,program:a.program,pc:a.sourcePC})))||
    dots.filter(d=>d.kind==='goal').length!==1||dots.some(d=>d.motion!=='static'||d.waystation||d.protected||d.ring))failWalls();
 assertGunTriggerOutlines(gunOutlines);
}

const failTeleports=()=>{throw Error('Separate Child multi-color guns and paired teleport composition required');};
const teleportGunsOK=(g,t)=>g.length===3&&g.every((x,i)=>x.placement===3&&x.color===[1,0,0][i]&&x.directions===[4,8,2][i])&&
 t.length===2&&t.every((x,i)=>x.placement===3&&x.color===i);
const teleportActorsOK=a=>a.length===5&&a.every(x=>[1,3].includes(x.type)&&[1,2].includes(x.speed)&&!x.walls&&
 (x.program===null||/^[bfns]+$/.test(x.program)&&Number.isInteger(x.pc)&&x.pc>=1&&x.pc<=x.program.length))&&
 a.filter(x=>x.speed===2&&x.program===null).length===1&&a.filter(x=>x.speed===2).length===1;

export function gunTriggerTeleportSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin?.x!==74||origin?.y!==72||!Array.isArray(level.blocks)||!Array.isArray(level.cells))failTeleports();
 const allowed=new Set(['GN','TR','HY','SP','WP','WA','TX']),records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))failTeleports();
 const geo={gridOrigin:origin,frameOrigin,activeMask:mask};
 const guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo}),triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo});
 if(!teleportGunsOK(guns,triggers))failTeleports();
 const dots=level.cells.filter(c=>c.present),hy=activeTeleportSpecs(records('HY'),mask);
 if(dots.some(c=>!staticWords.has(c.flagsRaw)||c.inlineProgram||!(c.secondaryRaw&mask))||dots.filter(c=>c.flagsRaw===5).length!==1||
    hy.length!==22||records('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask).length!==2)failTeleports();
 const pairs=pairTeleportSpecs(hy,dots.map(c=>({...c,id:c.column+','+c.row})));
 if(new Set(pairs.map(x=>x.channel)).size!==11)failTeleports();
 const programs=records('WP'),actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors[0]?.actorTypeRaw!==0||actors[1]?.actorTypeRaw!==6||
    actors.some(a=>!dots.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row&&c.flagsRaw!==5))||
    actors.slice(0,2).some(a=>a.rawWords?.[7]!==0||a.programReferenceRaw!==-1||hy.some(h=>h.row===a.gridPosition.row&&h.column===a.gridPosition.column))||
    !teleportActorsOK(actors.slice(2).map(a=>({type:a.actorTypeRaw,speed:a.rawWords?.[7],walls:a.version12ByteRaw!==0,
      program:a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text,pc:a.rawWords?.[6]}))))failTeleports();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...sourceRawBounds}};
}

export function assertGunTriggerTeleportBoard(b,gunOutlines){
 const c=b.gunTriggerChild,dots=b.dots??[];
 if(!b.gunTriggerProjectileRules||!b.gunTriggerTeleportRules||!b.teleportRules||b.difficulty!=='Child'||b.activeMask!==1||
    !b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||
    b.gunTriggerWallRules||b.gunTriggerSlidingRules||b.slidingTeleportRules||b.slidingConnectorRules||b.movingDotRules||b.elevatorRules||
    b.bombRules||b.goodieOnlyRules||b.rotatingSpikeRules||['walls','doors','switches','puddles','bombs','goodies'].some(k=>b[k]?.length)||
    !c||!teleportGunsOK(c.guns,c.triggers)||b.teleports?.length!==22||b.spikes?.length!==2||
    Object.keys(frameOrigin).some(k=>c.frameOrigin?.[k]!==frameOrigin[k])||Object.keys(sourceRawBounds).some(k=>c.rawBounds?.[k]!==sourceRawBounds[k])||
    dots.some(d=>d.motion!=='static'||d.waystation||d.protected||d.ring)||dots.filter(d=>d.kind==='goal').length!==1||
    b.player?.sourceActorType!==0||b.player.speedClass!==0||b.player.checksWalls!==true||
    !teleportActorsOK((b.enemies??[]).map(a=>({type:a.sourceActorType,speed:a.speedClass,walls:a.checksWalls,program:a.program,pc:a.sourcePC}))))failTeleports();
 assertGunTriggerOutlines(gunOutlines);
}
