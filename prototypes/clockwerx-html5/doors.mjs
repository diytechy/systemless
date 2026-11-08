import {outlineCollision} from './hazards.mjs';

/** DRStream2Spec stores two signed words followed by FOUR bytes, not two words.
 * This bounded decoder supports the source's two axes, two lengths and three
 * colors. DR/DS have no difficulty activation mask. */
export function decodeDoorRecord(record) {
  const w=record?.rawWords;
  if (!Array.isArray(w)||w.length!==4||!w.every(Number.isInteger)) throw new TypeError('Expected four DR words');
  const bytes=[w[2]>>>8,w[2]&255,w[3]>>>8,w[3]&255];
  if (w.some(n=>n<0||n>65535)||bytes.slice(0,3).some(n=>n>1)||bytes[3]>2)
    throw new RangeError('Unsupported DR specification');
  return {row:w[0],column:w[1],vertical:Boolean(bytes[0]),initiallyClosed:Boolean(bytes[1]),long:Boolean(bytes[2]),color:bytes[3]};
}

export function decodeSwitchRecord(record) {
  const w=record?.rawWords;
  if (!Array.isArray(w)||w.length!==4||!w.every(Number.isInteger)) throw new TypeError('Expected four DS words');
  if(w.some(n=>n<0||n>65535)||w[2]>3||w[3]>2) throw new RangeError('Unsupported DS specification');
  return {row:w[0],column:w[1],subcell:w[2],color:w[3]};
}

function doorType(s) { return (s.vertical?0:1)+(s.long?2:0); }
function validateDoor(s) {
  if(!s||![s.row,s.column,s.color].every(Number.isInteger)||s.row<0||s.column<0||s.color<0||s.color>2||
    !['vertical','initiallyClosed','long'].every(k=>typeof s[k]==='boolean')) throw new RangeError('Invalid door');
}

/** Logical-grid-relative sprite placement. Add each source descriptor to the
 * returned base. Cap attachment uses the original merged wall cross mask.
 * hasWallArm(row,column,mask) must inspect that mask, not generic wall presence.
 */
export function doorGeometry(spec, origin={x:74,y:72}, hasWallArm=()=>false) {
  validateDoor(spec);
  const type=doorType(spec),base={x:origin.x+48*spec.column-6,y:origin.y+48*spec.row-5};
  const offsets=[[[27,-10],[27,58]],[[-10,27],[58,27]],[[27,0],[27,96]],[[0,27],[96,27]]][type];
  const deltaRow=[1,0,2,0][type],deltaColumn=[0,1,0,2][type],mask=spec.vertical?8:4;
  const firstFrame=spec.color*2+(spec.vertical?6:0);
  const attached=Boolean(hasWallArm(spec.row+deltaRow,spec.column+deltaColumn,mask));
  return {type,base,caps:offsets.map(([x,y],i)=>({x:base.x+x,y:base.y+y,frame:firstFrame+(i===1&&attached?1:0)}))};
}

export function switchGeometry(spec, origin={x:74,y:72}) {
  const s=decodeSwitchRecord({rawWords:[spec.row,spec.column,spec.subcell,spec.color]});
  return {x:origin.x+48*s.column-12+24*(s.subcell%2),y:origin.y+48*s.row-11+24*Math.floor(s.subcell/2)};
}

/** Source DRActivate. Direction +1 opens, -1 closes. A reversal in transit
 * always requests sound3, including a reversal back toward open. */
export function activateDoorState(state) {
  const endpoint=state.phase===0||state.phase===10;
  if(state.direction!==0) return {...state,direction:endpoint?0:-state.direction,soundArgument:endpoint?null:3};
  const direction=state.phase===0?1:-1;
  return {...state,direction,soundArgument:direction===1?1:3};
}

/** One DRFrameProc callback, never elapsed-count catch-up. */
export function advanceDoorState(state) {
  const phase=Math.max(0,Math.min(10,state.phase+state.direction));
  const endpoint=phase===0||phase===10;
  return {...state,phase,direction:endpoint?0:state.direction,soundArgument:endpoint&&state.direction<0?2:null};
}

/** Source state coordinator. Supply the persistent scalable80 MT client count;
 * call observeClock once at the door sprite-processing stage, even when still.
 * Freeze by not observing while frozen; reset snapshots the CURRENT count.
 * Contact calls belong to each eligible actor's collision stage, in source
 * traversal order. nextIndex is the first visible DS outline match, or -1.
 */
export function createDoorSystem(doorSpecs,switchSpecs,{clockCount=0}={}) {
  doorSpecs.forEach(validateDoor);
  switchSpecs.forEach(s=>decodeSwitchRecord({rawWords:[s.row,s.column,s.subcell,s.color]}));
  let doors=[],switches=[],contacts=new Map(),reference;
  function reset(count=reference??clockCount) {
    if(!Number.isInteger(count)||count<0) throw new RangeError('Invalid source clock count');
    reference=count;
    doors=doorSpecs.map(s=>({phase:s.initiallyClosed?0:10,direction:0}));
    switches=switchSpecs.map(()=>0);contacts.clear();
  }
  reset(clockCount);
  function activateColor(color) {
    const events=[];
    doors=doors.map((d,i)=>{
      if(doorSpecs[i].color!==color)return d;
      const next=activateDoorState(d);
      if(next.soundArgument!==null)events.push({doorIndex:i,soundArgument:next.soundArgument});
      return {phase:next.phase,direction:next.direction};
    });
    return events;
  }
  return {
    reset,
    contact(actorId,nextIndex) {
      if(!Number.isInteger(nextIndex)||nextIndex < -1||nextIndex>=switches.length) throw new RangeError('Invalid switch index');
      const old=contacts.get(actorId)??-1;
      if(old===nextIndex)return [];
      const events=[];
      // Source activates the new color BEFORE releasing the old occupancy.
      if(nextIndex!==-1){events.push(...activateColor(switchSpecs[nextIndex].color));switches[nextIndex]++;}
      if(old!==-1)switches[old]--;
      contacts.set(actorId,nextIndex);
      return events;
    },
    observeClock(count) {
      if(!Number.isInteger(count)||count<reference)throw new RangeError('Source clock must not go backwards');
      if(count===reference)return [];
      reference=count;
      const events=[];
      doors=doors.map((d,i)=>{
        const next=advanceDoorState(d);
        if(next.soundArgument!==null)events.push({doorIndex:i,soundArgument:next.soundArgument});
        return {phase:next.phase,direction:next.direction};
      });
      return events;
    },
    snapshot() {
      return {
        clockReference:reference,
        doors:doors.map((d,i)=>({...d,frame:doorType(doorSpecs[i])*11+d.phase,secondFrame:doorType(doorSpecs[i])*11+d.phase+44})),
        switches:switches.map((occupants,i)=>({occupants,frame:switchSpecs[i].color+(occupants?3:0)}))
      };
    }
  };
}

/** DRCheckCollisions with original scanlines, not SVG alpha. Each entry has
 * leaves[2], lethalLeaves[2], caps[2] already placed in integer world pixels.
 * Source checks both leaves and selects leaf1 when BOTH overlap. It then tests
 * only that leaf's matching group3800 outline. Caps are checked after ALL
 * doors. Lethal contact returns no bounce/guard increment (source returns -1).
 * Ordinary enemy WACollide does not invoke this routine.
 */
export function findDoorContact(doors,actorOutline,{checkLethal=true}={}) {
  for(let i=0;i<doors.length;i++) {
    const door=doors[i];let leaf=-1;
    if(outlineCollision(door.leaves[0],actorOutline))leaf=0;
    if(outlineCollision(door.leaves[1],actorOutline))leaf=1;
    if(leaf<0)continue;
    const lethal=checkLethal&&outlineCollision(door.lethalLeaves?.[leaf],actorOutline);
    return {doorIndex:i,leaf,part:'leaf',lethal,bounce:!lethal,guardContact:!lethal,soundArgument:lethal?13:null};
  }
  for(let i=0;i<doors.length;i++)for(let cap=0;cap<doors[i].caps.length;cap++)
    if(outlineCollision(doors[i].caps[cap],actorOutline))return {doorIndex:i,cap,part:'cap',lethal:false,bounce:true,guardContact:true,soundArgument:null};
  return null;
}
