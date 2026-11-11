// Child composition of ordinary moving dots, same-color doors, WY and a free
// orbital spike. The two literal l/r bytes are full stationary instructions.
import {inactiveImportedGunTrigger} from './elevator-oil-riders.mjs';
import {movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeDoorRecord,decodeSwitchRecord} from './doors.mjs';
import {actorChecksWalls} from './walls.mjs';
import {dotColorOffset} from './dots.mjs';

const fail=()=>{throw Error('Separate Child moving-dot, door, checkpoint and free-orbital composition required');};
const dotWords=new Set([1,3,5,0x81,0x83,0x4001,0x4011]);
const recipe=Object.freeze({allowStationaryLR:true});
const doorsOK=d=>d.length===2&&d.every(x=>!x.vertical&&x.initiallyClosed&&!x.long&&x.color===0);
const switchesOK=s=>s.length===1&&s[0].color===0&&s[0].subcell===3;
export const inactivePuddles=(block,mask)=>block.kind==='PU'&&Array.isArray(block.records)&&
 block.count===block.records.length&&block.records.every(r=>r.byteLength===10&&
  Array.isArray(r.rawWords)&&r.rawWords.length===5&&r.rawWords.every(n=>Number.isInteger(n)&&n>=0&&n<=65535)&&
  !((r.rawWords[3]*65536+r.rawWords[4])&mask));

export function assertMovingDoorCheckpointSource(level,origin,mask){
 if(mask!==1||level.structuralStatus!=='complete'||level.header?.version!==12||level.header?.displaySizeRaw!==8||
    origin.x!==74||origin.y!==72||!Array.isArray(level.cells)||!Array.isArray(level.blocks))fail();
 const records=k=>level.blocks.find(b=>b.kind===k)?.records??[];
 const allowed=new Set(['WL','DR','DS','WY','WA','WP','TX']);
 if(level.blocks.some(b=>(b.count||b.records?.length)&&!allowed.has(b.kind)&&
    !inactiveImportedGunTrigger(level,b,mask)&&!inactivePuddles(b,mask)))fail();
 if(!records('WL').length||!doorsOK(records('DR').map(decodeDoorRecord))||!switchesOK(records('DS').map(decodeSwitchRecord)))fail();
 const d=level.cells.filter(c=>c.present),w=d.filter(c=>c.flagsRaw===0x4011);
 if(w.length!==1||dotColorOffset(w[0].secondaryRaw)!==0||d.filter(c=>c.flagsRaw===5).length!==1||
    d.some(c=>!dotWords.has(c.flagsRaw)||!(c.secondaryRaw&mask)))fail();
 const wy=records('WY'),wr=wy[0]?.rawWords;
 if(wy.length!==1||!Array.isArray(wr)||wr.length!==6||wr[0]!==w[0].row||wr[1]!==w[0].column||
    !((wr[4]*65536+wr[5])&mask))fail();
 let moving=0,stationaryLR=0;
 for(const c of d)if(c.flagsRaw&0x80){
  const p=movingProgramCell(c,recipe).text;
  assertClosedMovingProgram(p,{x:origin.x+48*c.column,y:origin.y+48*c.row},recipe);
  moving++;if(/[lr]/.test(p))stationaryLR++;
 }else if(c.inlineProgram)fail();
 if(!moving||!stationaryLR)fail();
 const actors=records('WA').filter(a=>a.activationMaskRaw&mask);
 if(actors.length!==4||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||
    !actors.slice(2).some(a=>a.actorTypeRaw===4)||!actors.slice(2).some(a=>a.actorTypeRaw===1)||
    actors.some((a,i)=>{
     const dot=d.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column);
     return !dot||dot.flagsRaw&0x94||a.programReferenceRaw!==-1||a.rawWords?.[7]!==Number(i>=2)||
      i>=2&&actorChecksWalls(a.version12ByteRaw??1);
    }))fail();
}

export function assertMovingDoorCheckpointActor(a,program){
 if(!a||![1,4].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||program!==null||a.program!==null)fail();
}

export function assertMovingDoorCheckpointBoard(b,doorOutlines){
 if(b.activeMask!==1||b.difficulty!=='Child'||!b.movingDotRules||!b.canonicalPlayerRules||!b.staticEnemyCallbacks||
    !b.specialDotRules||!b.childScoreRules||!b.rotatingSpikeRules||b.slidingConnectorRules||b.elevatorRules||
    b.teleportRules||b.bombRules||b.goodieOnlyRules||b.gunTriggerProjectileRules||b.markedTransferRules||
    ['spikes','puddles','bombs','goodies','elevators','teleports','connectors'].some(k=>b[k]?.length)||
    !b.walls?.length||!doorsOK(b.doors??[])||!switchesOK(b.switches??[])||!doorOutlines?.groups||
    b.player?.sourceActorType!==0||b.player.speedClass!==0||b.player.program!==null||
    b.enemies?.length!==2||!b.enemies.some(a=>a.sourceActorType===4)||!b.enemies.some(a=>a.sourceActorType===1))fail();
 for(const a of b.enemies)assertMovingDoorCheckpointActor(a,a.program);
 const d=b.dots??[],m=d.filter(x=>x.motion==='moving-program');
 if(!m.length||!m.some(x=>/[lr]/.test(x.movingProgram))||d.filter(x=>x.kind==='goal').length!==1||
    d.filter(x=>x.waystation).length!==1||d.some(x=>x.ring||x.protected||x.upDown||x.teleport||x.slideMask||
      x.waystation&&(x.motion!=='static'||x.color!==0)||x.x!==x.sourceInitialPosition?.x||x.y!==x.sourceInitialPosition?.y)||
    m.some(x=>x.kind==='goal'||x.waystation||x.sourceInBackground)||
    [b.player,...b.enemies].some(a=>!d.some(x=>x.id===a.pivot&&x.motion==='static'&&x.kind==='dot')))fail();
 for(const x of m)assertClosedMovingProgram(x.movingProgram,x.sourceInitialPosition,recipe);
}
