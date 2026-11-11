// Raised three-channel EL, static EX and bidirectional GN/TR Child composition.
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {activeElevatorSpecs} from './elevators.mjs';
import {connectorSpecs,validateConnectorBoard} from './sliding.mjs';
import {dotColorOffset} from './dots.mjs';
import {actorChecksWalls} from './walls.mjs';

const frameOrigin={x:28,y:28},rawBounds={left:28,top:28,right:612,bottom:452};
const plain=new Set([1,3,5,0x4001,0x4003,0x4005]);
const raised=new Set([0x101,0x201,0x301]);
const fail=()=>{throw Error('Separate Child bidirectional GN/TR, static EX, spikes and raised EL composition required');};
const controlsOK=c=>c.length===5&&c.filter(x=>x.group===0&&x.subcell===1).length===1&&
 c.filter(x=>x.group===0&&x.subcell===3).length===1&&c.filter(x=>x.group===1&&x.subcell===3).length===2&&
 c.filter(x=>x.group===2&&x.subcell===1).length===1;
const gunsOK=(g,t)=>g.length===1&&t.length===1&&g[0].directions===5&&g[0].color===1&&
 g[0].placement===3&&t[0].placement===1&&t[0].color===1;

export function gunTriggerSlidingSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin.x!==74||origin.y!==72||!Array.isArray(level.blocks)||!Array.isArray(level.cells))fail();
 const allowed=new Set(['SP','WP','WA','TX','EX','EL','GN','TR']);
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const geo={gridOrigin:origin,frameOrigin,activeMask:mask};
 const guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo});
 const triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo});
 const spikes=records('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask);
 if(!gunsOK(guns,triggers)||!controlsOK(activeElevatorSpecs(records('EL'),mask))||!spikes.length)fail();
 const dots=level.cells.filter(c=>c.present);
 if(dots.some(c=>!(c.secondaryRaw&mask)||!plain.has(c.flagsRaw)&&!(raised.has(c.flagsRaw)&&dotColorOffset(c.secondaryRaw)===0))||
    ![...raised].every(k=>dots.some(c=>c.flagsRaw===k))||dots.filter(c=>c.flagsRaw&4).length!==1)fail();
 const connectorDots=dots.map(c=>({...c,id:c.column+','+c.row,motion:raised.has(c.flagsRaw)?'up-down':'static'}));
 const ex=connectorSpecs(records('EX'),connectorDots);
 if(ex.length!==1||ex[0].vertical||[ex[0].first,ex[0].second].some(id=>connectorDots.find(d=>d.id===id).flagsRaw&4))fail();
 const actors=records('WA').filter(a=>a.activationMaskRaw&mask),programs=records('WP');
 if(actors.length!==6||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||actors.some((a,i)=>{
  const d=dots.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column),cl=a.rawWords?.[7];
  if(!d||!plain.has(d.flagsRaw)||d.flagsRaw&4)return true;
  if(i<2)return cl!==0||a.programReferenceRaw!==-1;
  const program=programs[a.programReferenceRaw]?.text,pc=a.rawWords?.[6];
  return ![1,2,3].includes(a.actorTypeRaw)||cl!==1||actorChecksWalls(a.version12ByteRaw??1)||
   a.programReferenceRaw>=0&&(!/^[fns]+$/.test(program??'')||!Number.isInteger(pc)||pc<1||pc>program.length);
 }))fail();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...rawBounds}};
}

export function assertGunTriggerSlidingBoard(b,gunOutlines,elevatorOutlines){
 const c=b.gunTriggerChild,dots=b.dots??[],up=dots.filter(d=>d.upDown);
 if(!b.gunTriggerProjectileRules||!b.gunTriggerSlidingRules||!b.slidingConnectorRules||!b.elevatorRules||
    b.activeMask!==1||b.difficulty!=='Child'||!b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||
    !b.childScoreRules||!b.combinedGoalBonusRules||b.movingDotRules||b.bombRules||b.goodieOnlyRules||
    b.teleportRules||b.rotatingSpikeRules||['walls','doors','switches','puddles'].some(k=>b[k]?.length)||
    !b.spikes?.length||!controlsOK(b.elevators??[])||!c||!gunsOK(c.guns,c.triggers)||
    Object.keys(frameOrigin).some(k=>c.frameOrigin?.[k]!==frameOrigin[k])||
    Object.keys(rawBounds).some(k=>c.rawBounds?.[k]!==rawBounds[k]))fail();
 if(![0,1,2].every(g=>up.some(d=>d.upDown.group===g))||
    up.some(d=>![0,1,2].includes(d.upDown.group)||d.upDown.initialLowered||d.color!==0||d.kind!=='dot')||
    dots.some(d=>d.ring||d.waystation||d.protected||d.teleport||!['static','up-down'].includes(d.motion))||
    dots.filter(d=>d.kind==='goal').length!==1||b.player?.sourceActorType!==0||b.player.speedClass!==0||
    b.enemies?.length!==4||[b.player,...b.enemies].some(h=>!dots.some(d=>d.id===h.pivot&&d.motion==='static'&&d.kind!=='goal'))||
    b.enemies.some(h=>![1,2,3].includes(h.sourceActorType)||h.speedClass!==1||h.checksWalls!==false||
     h.program!==null&&(!/^[fns]+$/.test(h.program??'')||!Number.isInteger(h.sourcePC)||h.sourcePC<1)))fail();
 if(b.connectors?.length!==1||b.connectors[0].vertical||
    dots.some(d=>d.slideMask&&(d.kind==='goal'||!d.humanCanGrab||!d.nonhumanCanGrab)))fail();
 validateConnectorBoard(b.connectors,dots);
 if(!elevatorOutlines?.groups?.[3400])throw Error('Original elevator outlines required');
 for(const [g,n]of [[3300,6],[4200,3]])for(let i=0;i<n;i++){
  const f=gunOutlines?.groups?.[g]?.frames?.[i];
  if(!f||f.collidable===false||f.outlineIndex===-1||!['left','top','right','bottom'].every(k=>Number.isInteger(f[k]))||
   f.right<f.left||f.bottom<f.top||f.rows!==null&&(!Array.isArray(f.rows)||f.rows.length!==f.bottom-f.top))throw Error('Original trigger/projectile collision frame required');
 }
}
