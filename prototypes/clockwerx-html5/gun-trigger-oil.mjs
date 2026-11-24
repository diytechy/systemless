// Default-off Child composition for static dots with GN/TR, sleeping Oil (PU kinds 0/2), rings,
// WL walls, unconditional SP spikes and ordinary class1/3/4 b/f/n/s actors (Crossfire99).
// It reuses the shared GunTriggerRuntime/OilRuntime; this module only admits and asserts the scope.
// Projectile coordinates are universe-local, so raw bounds use the 0..584/0..424 universe convention
// established by the static gun rail family (not the older 28-shifted Child bounds).
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {activePuddleSpecs} from './oil.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';

const frameOrigin=Object.freeze({x:28,y:28});
const rawBounds=Object.freeze({left:0,top:0,right:584,bottom:424});
const ALLOWED_BLOCKS=new Set(['GN','TR','WL','SP','PU','WP','WA','TX']);
const DOT_FLAGS=new Set([1,5,9]); // plain, goal, ring
const PUDDLE_KINDS=new Set([0,2]);
const fail=(why)=>{throw new Error('Separate Child GN/TR, Oil, ring and wall composition required'+(why?': '+why:''));};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;

function actorOK(a){
  if(![1,2,3].includes(a.type)||![1,3,4].includes(a.speed)||a.walls)return false;
  return a.program===null||typeof a.program==='string'&&/^[bfns]+$/.test(a.program)&&int(a.pc,1,a.program.length);
}

export function gunTriggerOilSource(level,origin,mask){
  if(mask!==1||level?.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
     origin?.x!==74||origin?.y!==72||!Array.isArray(level.blocks)||!Array.isArray(level.cells))fail('source header');
  if(level.blocks.some(b=>b.count&&!ALLOWED_BLOCKS.has(b.kind)))fail('block family');
  const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
  const geo={gridOrigin:origin,frameOrigin,activeMask:mask};
  const guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo}),triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo});
  if(!guns.length||!triggers.length)fail('guns/triggers');
  for(const r of records('SP')){const w=r.rawWords;if(w?.length!==6||w[4]!==0||((w[5]&mask)&&w[5]!==15))fail('spike activation');}
  const puddles=activePuddleSpecs(records('PU'),mask);
  if(!puddles.length||puddles.some(p=>!PUDDLE_KINDS.has(p.kind)))fail('puddle kinds');
  const dots=level.cells.filter(c=>c.present);
  if(dots.some(c=>!DOT_FLAGS.has(c.flagsRaw)||c.inlineProgram||!(c.secondaryRaw&mask)))fail('dot flags');
  const goals=dots.filter(c=>c.flagsRaw===5);
  if(goals.length!==1||dotColorOffset(goals[0].secondaryRaw)!==0)fail('goal');
  const programs=records('WP'),actors=records('WA').filter(a=>a.activationMaskRaw&mask);
  if(actors[0]?.actorTypeRaw!==0||actors[1]?.actorTypeRaw!==6||actors.length<3)fail('human slots');
  for(const a of actors.slice(0,2)){
    const c=dots.find(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row);
    if(!c||c.flagsRaw!==1||a.programReferenceRaw!==-1||a.rawWords?.[7]!==0)fail('human start');
  }
  for(const a of actors.slice(2)){
    if(!dots.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row))fail('actor pivot');
    const program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text??fail('program reference');
    if(!actorOK({type:a.actorTypeRaw,speed:a.rawWords?.[7],walls:actorChecksWalls(a.version12ByteRaw??1),program,pc:a.rawWords?.[6]}))fail('actor');
  }
  return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...rawBounds}};
}

export function assertGunTriggerOilBoard(b,gunOutlines){
  const c=b?.gunTriggerChild,dots=b?.dots??[];
  if(!b?.gunTriggerProjectileRules||!b.gunTriggerOilRules||!b.canonicalOilRules||b.difficulty!=='Child'||b.activeMask!==1||
     !b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules)fail('rules');
  for(const k of['movingDotRules','bombRules','goodieOnlyRules','slidingConnectorRules','teleportRules','rotatingSpikeRules','elevatorRules',
    'gunTriggerWallRules','gunTriggerSlidingRules','gunTriggerTeleportRules','canonicalOilSpikeRules','elevatorOilSpikeRules','staticEnemyWallRules'])
    if(b[k])fail(k);
  if(['doors','switches'].some(k=>b[k]?.length)||!b.puddles?.length||b.puddles.some(p=>!PUDDLE_KINDS.has(p.kind)))fail('objects');
  if(!c||!c.guns?.length||!c.triggers?.length||Object.keys(frameOrigin).some(k=>c.frameOrigin?.[k]!==frameOrigin[k])||
     Object.keys(rawBounds).some(k=>c.rawBounds?.[k]!==rawBounds[k]))fail('gun geometry');
  if(b.player?.sourceActorType!==0||b.player.speedClass!==0||b.player.checksWalls!==true)fail('player');
  if(!(b.enemies??[]).every(a=>actorOK({type:a.sourceActorType,speed:a.speedClass,walls:a.checksWalls,program:a.program,pc:a.sourcePC})))fail('enemies');
  if(dots.filter(d=>d.kind==='goal').length!==1||dots.some(d=>d.motion!=='static'||d.waystation||d.protected||d.upDown))fail('dots');
  if(b.spikes.some(s=>s.activationMask!==15))fail('spikes');
  assertGunTriggerOutlines(gunOutlines);
  return true;
}
