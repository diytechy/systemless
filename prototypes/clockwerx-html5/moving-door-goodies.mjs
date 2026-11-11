// Separate Child moving DO/WY, static EX/WL/DR/SP, GO and GN/TR join.
import {assertClosedMovingProgram,movingProgramCell} from './moving-dots.mjs';
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';
import {decodeDoorRecord,decodeSwitchRecord} from './doors.mjs';
import {connectorSpecs,validateConnectorBoard} from './sliding.mjs';

const fail=()=>{throw Error('Separate Child moving checkpoint, EX/door/goodie/gun composition required');};
const words=new Set([1,3,0x4001,0x4003,0x4005,0x4041,0x4081,0x4091]);
const frameOrigin={x:28,y:28},rawBounds={left:28,top:28,right:612,bottom:452};
const gunOK=(g,t)=>g.length===1&&g[0].color===2&&g[0].placement===1&&g[0].directions===2&&
 t.length===1&&t[0].color===2&&t[0].placement===3;
const doorOK=(d,s)=>d.length===1&&d[0].vertical&&d[0].long&&d[0].initiallyClosed&&d[0].color===0&&
 s.length===1&&s[0].color===0&&s[0].subcell===3;

export function assertMovingDoorGoodieActor(a,program=a?.program){
 if(!a||![0,1,2,3,6].includes(a.sourceActorType))fail();
 if([0,6].includes(a.sourceActorType)){
  if(a.speedClass!==0||program!==null)fail();
 }else if(a.speedClass!==3||a.checksWalls!==false||program!==null&&
   (!/^[fn]+$/.test(program??'')||!Number.isInteger(a.sourcePC)||a.sourcePC<1||a.sourcePC>program.length))fail();
}

export function movingDoorGoodieSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin.x!==74||origin.y!==72||!Array.isArray(level.cells)||!Array.isArray(level.blocks))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[],allowed=new Set(['EX','WL','DR','DS','GO','SP','GN','TR','WY','WP','WA','TX']);
 if(level.blocks.some(b=>b.count&&!allowed.has(b.kind)))fail();
 const geo={gridOrigin:origin,frameOrigin,activeMask:mask},guns=activeGunTriggerSpecs(records('GN'),{kind:'GN',...geo}),
  triggers=activeGunTriggerSpecs(records('TR'),{kind:'TR',...geo});
 if(!gunOK(guns,triggers)||!doorOK(records('DR').map(decodeDoorRecord),records('DS').map(decodeSwitchRecord))||
    !records('WL').length||records('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask).length!==4)fail();
 const goodies=records('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&mask);
 if(goodies.length!==8||goodies.some(r=>r.rawWords.length!==5||r.rawWords[2]!==0))fail();
 const dots=level.cells.filter(c=>c.present),moving=dots.filter(c=>c.flagsRaw&0x80);
 if(dots.some(c=>!words.has(c.flagsRaw)||!(c.secondaryRaw&mask))||dots.filter(c=>c.flagsRaw===0x4005).length!==1||
    dots.filter(c=>c.flagsRaw===0x4041).length!==1||dots.filter(c=>c.flagsRaw===0x4091).length!==1||moving.length!==7)fail();
 for(const c of moving)assertClosedMovingProgram(movingProgramCell(c).text,{x:origin.x+48*c.column,y:origin.y+48*c.row});
 const ex=connectorSpecs(records('EX'),dots.map(c=>({...c,id:c.column+','+c.row,motion:c.flagsRaw&0x80?'moving-program':'static'})));
 if(ex.length!==2||ex.some(x=>!x.vertical))fail();
 const programs=records('WP'),actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors.length!==5||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||
    actors.some((a,i)=>!dots.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row&&
      (i<2?[1,0x4001]:[1,3,0x4001,0x4003,0x4041]).includes(c.flagsRaw))))fail();
 for(const a of actors)assertMovingDoorGoodieActor({sourceActorType:a.actorTypeRaw,speedClass:a.rawWords?.[7],
  checksWalls:a.version12ByteRaw!==0,sourcePC:a.rawWords?.[6]},a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text);
 const wy=records('WY')[0]?.rawWords,cp=dots.find(c=>c.flagsRaw===0x4091);
 if(records('WY').length!==1||!Array.isArray(wy)||wy.length!==6||wy[0]!==cp.row||wy[1]!==cp.column||!((wy[4]*65536+wy[5])&mask))fail();
 return {guns,triggers,frameOrigin:{...frameOrigin},rawBounds:{...rawBounds}};
}

export function assertMovingDoorGoodieBoard(b,{gunOutlines,doorOutlines,dotOutlines}={}){
 const d=b.dots??[],c=b.gunTriggerChild;
 if(!b.movingDoorGoodieRules||!b.movingDotRules||!b.slidingConnectorRules||!b.goodieOnlyRules||!b.gunTriggerProjectileRules||
    !b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||!b.combinedGoalBonusRules||
    b.activeMask!==1||b.difficulty!=='Child'||b.elevatorRules||b.bombRules||b.teleportRules||b.rotatingSpikeRules||
    b.markedTransferRules||b.slidingOilRules||b.pilotAbsentSlideRecoveryRules||b.canonicalOilRules||
    !b.walls?.length||b.spikes?.length!==4||!doorOK(b.doors??[],b.switches??[])||
    ['puddles','bombs','elevators','teleports'].some(k=>b[k]?.length)||b.goodies?.length!==8||b.goodies.some(x=>x.initialFrame!==0)||
    !c||!gunOK(c.guns,c.triggers)||b.connectors?.length!==2||b.connectors.some(x=>!x.vertical)||
    d.filter(x=>x.motion==='moving-program').length!==7||d.filter(x=>x.kind==='goal').length!==1||
    d.filter(x=>x.waystation).length!==1||d.filter(x=>x.protected).length!==1||
    d.some(x=>x.ring||x.teleport||x.upDown||x.transferDeath||x.slowdown||
      x.protected&&(x.motion!=='static'||x.waystation)||x.waystation&&x.motion!=='moving-program'||
      x.motion==='moving-program'&&(x.bonus||x.slideMask||x.protected))||
    b.player?.sourceActorType!==0||b.player.checksWalls!==true||b.enemies?.length!==3)fail();
 for(const a of [b.player,...b.enemies])assertMovingDoorGoodieActor(a);
 validateConnectorBoard(b.connectors,d);
 for(const x of d.filter(x=>x.motion==='moving-program'))assertClosedMovingProgram(x.movingProgram,x.sourceInitialPosition);
 if(!doorOutlines?.groups||!dotOutlines?.groups?.[300])fail();
 assertGunTriggerOutlines(gunOutlines);
}

export function assertMovingDoorGoodieRuntime(b,{dots,actors,connectors,goodies}){
 if(!b?.movingDoorGoodieRules||!b.movingDotRules||!b.goodieOnlyRules||b.bombRules||
    b.dots!==dots||b.connectors!==connectors||b.goodies!==goodies||goodies.length!==8)fail();
 for(const a of actors)assertMovingDoorGoodieActor(a);
 validateConnectorBoard(connectors,dots);
}
