// Ordinary moving bonuses and goal, joined to static vertical EX rails.
import {inactiveImportedGunTrigger} from './elevator-oil-riders.mjs';
import {movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {connectorSpecs,validateConnectorBoard} from './sliding.mjs';
import {actorChecksWalls} from './walls.mjs';

const fail=()=>{throw Error('Separate Child moving dots, goal and vertical EX composition required');};
const plain=new Set([1,0x4001]),moving=new Set([0x4081,0x4083,0x4085]);
const group={0:700,6:4300,1:500,2:4400,3:4500};
export function assertMovingTubesSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin.x!==74||origin.y!==72||!Array.isArray(level.cells)||!Array.isArray(level.blocks))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const legal=new Set(['WP','WA','TX','EX']);
 if(level.blocks.some(b=>(b.count||b.records?.length)&&!legal.has(b.kind)&&!inactiveImportedGunTrigger(level,b,mask)))fail();
 const dots=level.cells.filter(c=>c.present).map(c=>{
  if(!(c.secondaryRaw&mask)||!plain.has(c.flagsRaw)&&!moving.has(c.flagsRaw)||(!moving.has(c.flagsRaw)&&c.inlineProgram))fail();
  const mover=moving.has(c.flagsRaw),p={x:origin.x+48*c.column,y:origin.y+48*c.row};
  if(mover)assertClosedMovingProgram(movingProgramCell(c).text,p);
  return {...c,id:c.column+','+c.row,motion:mover?'moving-program':'static'};
 });
 if(dots.filter(c=>c.flagsRaw===0x4085).length!==1||!dots.some(c=>c.flagsRaw===0x4083))fail();
 const ex=connectorSpecs(records('EX'),dots);
 if(!ex.length||ex.some(c=>!c.vertical))fail();
 const actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors.length<4||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||actors.some((a,i)=>{
  const d=dots.find(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row),clock=a.rawWords?.[7];
  return !d||d.flagsRaw&4||a.programReferenceRaw!==-1||(i<2?d.motion!=='static'||clock!==0:
   ![1,2,3].includes(a.actorTypeRaw)||![1,2,3].includes(clock)||actorChecksWalls(a.version12ByteRaw??1));
 }))fail();
}

export function assertMovingTubesActor(a,program){
 if(!a||![1,2,3].includes(a.sourceActorType)||![1,2,3].includes(a.speedClass)||a.checksWalls!==false||
    a.group!==group[a.sourceActorType]||a.program!==null||program!==null)fail();
}

export function assertMovingTubesBoard(b){
 const dots=b.dots??[],c=b.connectors??[];
 if(b.activeMask!==1||b.difficulty!=='Child'||!b.movingDotRules||!b.slidingConnectorRules||!b.canonicalPlayerRules||
    !b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||!b.combinedGoalBonusRules||
    [b.bombRules,b.goodieOnlyRules,b.elevatorRules,b.gunTriggerProjectileRules,b.teleportRules,b.rotatingSpikeRules,b.markedTransferRules].some(Boolean)||
    ['spikes','walls','doors','switches','puddles','bombs','goodies','elevators','teleports'].some(k=>b[k]?.length)||
    !c.length||c.some(e=>!e.vertical||e.bonus||e.sourceHasSprite)||
    b.player?.sourceActorType!==0||b.player.speedClass!==0||b.player.program!==null||
    !dots.some(d=>d.id===b.player.pivot&&d.motion==='static')||!b.enemies?.length)fail();
 for(const a of b.enemies){assertMovingTubesActor(a,a.program);if(!dots.some(d=>d.id===a.pivot&&d.kind!=='goal'))fail();}
 if(dots.filter(d=>d.kind==='goal'&&d.motion==='moving-program'&&!d.bonus).length!==1||
    !dots.some(d=>d.kind==='bonus'&&d.motion==='moving-program')||dots.some(d=>
      d.ring||d.protected||d.waystation||d.teleport||d.upDown||!d.humanCanGrab||!d.nonhumanCanGrab||
      d.x!==d.sourceInitialPosition?.x||d.y!==d.sourceInitialPosition?.y||
      (d.motion==='static'?d.kind!=='dot'||d.bonus||!!d.movingProgram:d.motion!=='moving-program'||d.slideMask||d.sourceInBackground)))fail();
 for(const d of dots.filter(d=>d.motion==='moving-program'))assertClosedMovingProgram(d.movingProgram,d.sourceInitialPosition);
 validateConnectorBoard(c,dots);
}
