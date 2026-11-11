// Child moving bonuses, static EX/WL, doors, kind3 Oil and one gun/trigger.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';
import {activePuddleSpecs} from './oil.mjs';
import {decodeDoorRecord,decodeSwitchRecord} from './doors.mjs';
import {connectorSpecs,validateConnectorBoard} from './sliding.mjs';

const fail=()=>{throw Error('Separate Child moving bonus, EX/door/Oil/gun composition required');};
const words=new Set([1,3,5,0x4001,0x4003,0x4011,0x4083]);
const frameOrigin={x:28,y:28},rawBounds={left:28,top:28,right:612,bottom:452};
const gunOK=(g,t)=>g.length===1&&g[0].color===0&&g[0].placement===2&&g[0].directions===8&&
 t.length===1&&t[0].color===0&&t[0].placement===3;
const doorsOK=d=>d.length===4&&d.every(x=>x.vertical&&x.initiallyClosed)&&
 d.filter(x=>x.color===0&&!x.long).length===2&&d.some(x=>x.color===1&&x.long)&&d.some(x=>x.color===2&&x.long);
const switchesOK=s=>s.length===6&&s.filter(x=>x.color===0).length===3&&s.filter(x=>x.color===1).length===1&&s.filter(x=>x.color===2).length===2;

export function assertMovingDoorOilActor(a,program=a?.program){
 if(!a||![1,3].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||
    program!==null&&(!/^[bfns]+$/.test(program??'')||!Number.isInteger(a.sourcePC)||a.sourcePC<1||a.sourcePC>program.length))fail();
}

export function movingDoorOilSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin.x!==74||origin.y!==72||!Array.isArray(level.cells)||!Array.isArray(level.blocks))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[],allowed=new Set(['EX','WL','DR','DS','PU','SP','GN','TR','WY','WP','WA','TX']);
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))fail();
 const geo={gridOrigin:origin,frameOrigin,activeMask:mask},guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo}),
  triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo}),puddles=activePuddleSpecs(records('PU'),mask);
 if(!gunOK(guns,triggers)||!doorsOK(records('DR').map(decodeDoorRecord))||!switchesOK(records('DS').map(decodeSwitchRecord))||
    !records('WL').length||puddles.length!==1||puddles[0].kind!==3||
    records('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask).length!==14)fail();
 const dots=level.cells.filter(c=>c.present),moving=dots.filter(c=>c.flagsRaw&0x80);
 if(dots.some(c=>!words.has(c.flagsRaw)||!(c.secondaryRaw&mask))||dots.filter(c=>c.flagsRaw===5).length!==1||
    dots.filter(c=>c.flagsRaw===0x4011).length!==1||moving.length!==6||moving.some(c=>c.flagsRaw!==0x4083))fail();
 for(const c of moving)assertClosedMovingProgram(movingProgramCell(c).text,{x:origin.x+48*c.column,y:origin.y+48*c.row});
 const ex=connectorSpecs(records('EX'),dots.map(c=>({...c,id:c.column+','+c.row,motion:c.flagsRaw&0x80?'moving-program':'static'})));
 if(ex.length!==5||ex.filter(x=>x.vertical).length!==1)fail();
 const programs=records('WP'),actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors.length!==4||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||
    actors.slice(0,2).some(a=>a.rawWords?.[7]!==0||a.programReferenceRaw!==-1)||
    actors.some(a=>!dots.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row&&[1,3,0x4001,0x4003].includes(c.flagsRaw))))fail();
 for(const a of actors.slice(2))assertMovingDoorOilActor({sourceActorType:a.actorTypeRaw,speedClass:a.rawWords?.[7],
  checksWalls:a.version12ByteRaw!==0,sourcePC:a.rawWords?.[6]},a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text);
 const wy=records('WY')[0]?.rawWords,cp=dots.find(c=>c.flagsRaw===0x4011);
 if(records('WY').length!==1||!Array.isArray(wy)||wy.length!==6||wy[0]!==cp.row||wy[1]!==cp.column||!((wy[4]*65536+wy[5])&mask))fail();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...rawBounds}};
}

export function assertMovingDoorOilBoard(b,{gunOutlines,doorOutlines,oilOutlines,dotOutlines}={}){
 const d=b.dots??[],c=b.gunTriggerChild;
 if(!b.movingDoorOilRules||!b.movingDotRules||!b.slidingConnectorRules||!b.canonicalOilRules||!b.gunTriggerProjectileRules||
    !b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||!b.combinedGoalBonusRules||
    b.activeMask!==1||b.difficulty!=='Child'||b.elevatorRules||b.bombRules||b.goodieOnlyRules||b.teleportRules||b.rotatingSpikeRules||
    b.markedTransferRules||b.slidingOilRules||b.pilotAbsentSlideRecoveryRules||!b.walls?.length||b.spikes?.length!==14||
    !doorsOK(b.doors??[])||!switchesOK(b.switches??[])||b.puddles?.length!==1||b.puddles[0].kind!==3||
    !c||!gunOK(c.guns,c.triggers)||b.connectors?.length!==5||
    d.filter(x=>x.motion==='moving-program').length!==6||d.filter(x=>x.kind==='goal').length!==1||
    d.filter(x=>x.waystation).length!==1||d.some(x=>x.protected||x.ring||x.teleport||x.upDown||x.transferDeath||x.slowdown||
      x.motion==='moving-program'&&(!x.bonus||x.slideMask))||b.player?.sourceActorType!==0||b.player.speedClass!==0||
    b.enemies?.length!==2||b.player.checksWalls!==true)fail();
 for(const a of b.enemies)assertMovingDoorOilActor(a);
 validateConnectorBoard(b.connectors,d);
 for(const x of d.filter(x=>x.motion==='moving-program'))assertClosedMovingProgram(x.movingProgram,x.sourceInitialPosition);
 if(!doorOutlines?.groups||!oilOutlines?.groups?.[1200]||!oilOutlines.groups[2200]||!dotOutlines?.groups?.[300])fail();
 assertGunTriggerOutlines(gunOutlines);
}
