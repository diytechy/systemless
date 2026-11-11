import {activeElevatorSpecs} from './elevators.mjs';
import {activePuddleSpecs} from './oil.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';

const groups=[0,2];
const fail=()=>{throw Error('Separate Child raised elevator/Oil rider composition required');};
const controlsOK=c=>c.length===2&&groups.every(g=>c.some(x=>x.group===g&&x.subcell===1));
const puddlesOK=p=>p.length===2&&[1,3].every(k=>p.some(x=>x.kind===k));
const staticCell=new Set([1,3,5,0x4001,0x4003,0x4005]);
const raisedCell=new Set([0x101,0x301]);

// Mode masking precedes allocation. Match the complete imported record layout
// and retain the decoded bytes; neither the GN nor TR runtime is instantiated.
export function inactiveImportedGunTrigger(level,block,mask){
 if(level.schema!=='clockwerx-rnd2-decoded-v1'||level.header?.version!==12||
    !/^[a-f0-9]{64}$/.test(level.sha256??'')||!Number.isInteger(level.resourceId)||
    !Number.isInteger(level.byteLength)||level.byteLength<=0)return false;
 const words=block.kind==='GN'?7:block.kind==='TR'?6:0;
 return !!words&&Array.isArray(block.records)&&block.count===block.records.length&&block.records.every(r=>
  Array.isArray(r.rawWords)&&r.rawWords.length===words&&r.byteLength===words*2&&
  r.rawWords.every(n=>Number.isInteger(n)&&n>=0&&n<=65535)&&
  !((r.rawWords[words-2]*65536+r.rawWords[words-1])&mask));
}

export function assertElevatorOilRiderSource(level,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||!Array.isArray(level.blocks)||!Array.isArray(level.cells))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const allowed=new Set(['SP','WL','PU','EL','WA','WP','TX']);
 if(level.blocks.some(b=>(b.count||b.records?.length)&&!allowed.has(b.kind)&&!inactiveImportedGunTrigger(level,b,mask))||
    !controlsOK(activeElevatorSpecs(records('EL'),mask))||!puddlesOK(activePuddleSpecs(records('PU'),mask))||
    !records('SP').length||!records('WL').length)fail();
 const dots=level.cells.filter(c=>c.present);
 if(dots.some(c=>!(c.secondaryRaw&mask)||!staticCell.has(c.flagsRaw)&&!(raisedCell.has(c.flagsRaw)&&dotColorOffset(c.secondaryRaw)===0))||
    ![0x101,0x301].every(k=>dots.some(c=>c.flagsRaw===k))||dots.filter(c=>c.flagsRaw&4).length!==1)fail();
 const actors=records('WA').filter(a=>a.activationMaskRaw&mask),programs=records('WP');
 if(actors.length<3||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||actors.some((a,i)=>{
  const d=dots.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column),cl=a.rawWords?.[7];
  if(!d||!staticCell.has(d.flagsRaw)||d.flagsRaw&4)return true;
  if(i<2)return cl!==0||a.programReferenceRaw!==-1;
  const program=programs[a.programReferenceRaw]?.text,pc=a.rawWords?.[6];
  return ![1,2,3].includes(a.actorTypeRaw)||![1,3].includes(cl)||actorChecksWalls(a.version12ByteRaw??1)||
   (a.programReferenceRaw>=0&&(!/^[bfns]+$/.test(program??'')||!Number.isInteger(pc)||pc<1||pc>program.length));
 }))fail();
}

export function assertElevatorOilRiderBoard(b,elevatorOutlines){
 if(b.difficulty!=='Child'||b.activeMask!==1||!b.elevatorRules||!b.canonicalOilRules||!b.canonicalPlayerRules||
    !b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||
    [b.gunTriggerProjectileRules,b.elevatorOilSpikeRules,b.canonicalOilSpikeRules,b.bombRules,b.goodieOnlyRules,b.slidingConnectorRules,b.teleportRules,b.rotatingSpikeRules,b.movingDotRules].some(Boolean)||
    ['doors','switches','bombs','goodies','teleports'].some(k=>b[k]?.length)||!b.walls?.length||!b.spikes?.length||
    !controlsOK(b.elevators??[])||!puddlesOK(b.puddles??[])||!elevatorOutlines?.groups?.[3400])fail();
 const dots=b.dots??[],raised=dots.filter(d=>d.upDown);
 if(!groups.every(g=>raised.some(d=>d.upDown.group===g))||
    raised.some(d=>!groups.includes(d.upDown.group)||d.upDown.initialLowered||d.color!==0||d.kind!=='dot')||
    dots.some(d=>d.ring||d.protected||d.waystation||d.teleport||!['static','up-down'].includes(d.motion))||
    dots.filter(d=>d.kind==='goal').length!==1||b.player?.sourceActorType!==0||b.player.speedClass!==0||
    [b.player,...(b.enemies??[])].some(h=>!dots.some(d=>d.id===h.pivot&&d.motion==='static'&&d.kind!=='goal'))||
    !b.enemies?.length||b.enemies.some(h=>![1,2,3].includes(h.sourceActorType)||![1,3].includes(h.speedClass)||h.checksWalls!==false||
      h.program!==null&&(!/^[bfns]+$/.test(h.program??'')||!Number.isInteger(h.sourcePC)||h.sourcePC<1)))fail();
}
