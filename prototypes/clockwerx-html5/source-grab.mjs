import {markedGrabPrelude} from './marked-transfers.mjs';
// DOFindGrabbable / indexed DOCanGrab and WAGrab source primitives. The
// caller owns scene admission, controller dispatch and effect/PC adapters.
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const point=p=>{if(!p||!integer(p.x,-32768,32767)||!integer(p.y,-32768,32767))throw new TypeError('Current integer source pixel required');return {x:p.x,y:p.y};};
function inventory(dots){
 if(!Array.isArray(dots)||!dots.length||dots.length>88)throw new Error('Bounded source dot inventory required');
 let previous=-1;const ids=new Set();
 for(const d of dots){if(!integer(d.sourceIndex,0,87)||d.sourceIndex<=previous||d.id===undefined||ids.has(d.id)||!['present','humanCanGrab','nonhumanCanGrab'].every(k=>typeof d[k]==='boolean')||![0,1,2].includes(d.motionType))throw new Error('Ordered unique serialized source identities and explicit permissions/motion required');point(d.currentPixel);if(d.intermediate&&typeof d.intermediate.valid!=='boolean')throw new TypeError('Explicit cache-valid flag required');if(d.intermediate?.valid){if(typeof d.intermediate.moving!=='boolean')throw new TypeError('Explicit cached ordinary-moving flag required');point(d.intermediate.pixel);}previous=d.sourceIndex;ids.add(d.id);}
}
function qualified(allowMovingQueries){if(allowMovingQueries!==true)throw new Error('Separate source moving-query capability required');}
function connectorRect(e,dots){
 const a=dots.find(d=>d.id===e.first),b=dots.find(d=>d.id===e.second);
 if(!a||!b||!a.present||!b.present||a.motionType!==0||b.motionType!==0||typeof e.vertical!=='boolean'||!Number.isInteger(a.row)||!Number.isInteger(a.column)||b.row!==a.row+(e.vertical?1:0)||b.column!==a.column+(e.vertical?0:1)||b.currentPixel.x-a.currentPixel.x!==(e.vertical?0:48)||b.currentPixel.y-a.currentPixel.y!==(e.vertical?48:0))throw new Error('Adjacent static source EX endpoints required');
 return {left:a.currentPixel.x,right:b.currentPixel.x,top:a.currentPixel.y,bottom:b.currentPixel.y};
}

export function querySourceGrab(dots,{originPixel,offset,human,movingOrigin,currentPass=true,connectors=[],allowMovingQueries=false}={}){
 qualified(allowMovingQueries);inventory(dots);const origin=point(originPixel);
 if(typeof human!=='boolean'||typeof movingOrigin!=='boolean'||typeof currentPass!=='boolean'||!offset||!integer(offset.row,-1,1)||!integer(offset.column,-1,1)||Math.abs(offset.row)+Math.abs(offset.column)!==1||!Array.isArray(connectors)||connectors.length>61)throw new Error('Explicit source WA cardinal query flags and bounded EX inventory required');
 const rects=connectors.map((e,index)=>{if(e.id!==index)throw new Error('Ordered source EX indices required');return connectorRect(e,dots);}),requested=point({x:origin.x+48*offset.column,y:origin.y+48*offset.row}),base={originPixel:origin,requestedPixel:requested,movingOrigin,pass:currentPass?'current':'intermediate'};
 for(const d of dots){
  if(!d.present||!currentPass&&!d.intermediate?.valid)continue;
  const p=currentPass?d.currentPixel:d.intermediate.pixel,candidateMoving=currentPass?d.motionType===1:d.intermediate.moving;
  const tolerance=movingOrigin||candidateMoving?6:0;
  if(Math.abs(p.x-requested.x)>tolerance||Math.abs(p.y-requested.y)>tolerance)continue;
  return {...base,allowed:human?d.humanCanGrab:d.nonhumanCanGrab,grab:{realDot:true,dot:d.id,sourceIndex:d.sourceIndex,connector:null,queryPixel:{...requested}}};
 }
 // A denied real match returned above. Only absence enters EX fallback.
 if(human&&movingOrigin)for(let i=0;i<connectors.length;i++){
  const r=rects[i];if(r.top>requested.y+3||r.bottom<requested.y-3||r.left>requested.x+3||r.right<requested.x-3)continue;
  const e=connectors[i],d=dots.find(d=>d.id===e.first);
  return {...base,allowed:true,grab:{realDot:false,dot:d.id,sourceIndex:d.sourceIndex,connector:e.id,queryPixel:{...requested}}};
 }
 return {...base,allowed:false,grab:null};
}

export function queryIndexedSourceGrab(dots,{originIndex,offset,human,connectors=[],allowMovingQueries=false}={}){
 qualified(allowMovingQueries);inventory(dots);const origin=dots.find(d=>d.sourceIndex===originIndex);
 if(!origin)throw new Error('Existing source origin identity required');
 const options={offset,human,connectors,allowMovingQueries:true},first=querySourceGrab(dots,{...options,originPixel:origin.currentPixel,movingOrigin:origin.motionType===1,currentPass:true}),passes=[first];
 if(first.allowed||!origin.intermediate?.valid)return {...first,passes};
 const second=querySourceGrab(dots,{...options,originPixel:origin.intermediate.pixel,movingOrigin:origin.intermediate.moving,currentPass:false});passes.push(second);return {...second,passes};
}

// WAGrab c3e4..c588. The caller owns human prelude/scoring or NPC DP/orphan
// hooks. A rail grab keeps the source first-endpoint pivot; it is not a dot
// fabricated at the requested point. Logical DO centers are raw DO+(16,15);
// logical WA pivots are raw WA+(44,43). Each source comparison uses two pixels
// of the same family, so these fixed translations cancel in signed differences.
export function grabSourceActor(actor,result,{dots,connectors=[],physicalPoint,release,place,grab,onTransfer=()=>{},allowMovingQueries=false,allowMarkedTransfers=false,onMarkedDeath}={}){
 qualified(allowMovingQueries);inventory(dots);
 const human=[0,6].includes(actor?.sourceActorType),old=dots.find(d=>d.id===actor?.pivot),g=result?.grab,target=dots.find(d=>d.id===g?.dot);
 if(!actor||![0,1,2,3,6].includes(actor.sourceActorType)||!integer(actor.sourceSlot,0,30)||human!==(actor.sourceSlot<2)||(human?actor.speedClass!==0:actor.speedClass!==1||actor.checksWalls!==false)||!integer(actor.frame,0,63)||!Number.isInteger(actor.unwrappedFrame)||(actor.unwrappedFrame&63)!==actor.frame||![-1,1].includes(actor.direction)||!old||!target||result.allowed!==true||typeof g.realDot!=='boolean'||g.sourceIndex!==target.sourceIndex||!allowMarkedTransfers&&(old.transferDeath||target.transferDeath))throw new Error('Qualified canonical ordinary source grab and explicit typed result required');
 for(const fn of [release,place,grab,onTransfer])if(typeof fn!=='function'||fn.constructor?.name==='AsyncFunction')throw new TypeError('Complete synchronous WAGrab adapters required');
 const sync=(fn,...a)=>{const v=fn(...a);if(v&&typeof v.then==='function')throw new TypeError('WAGrab adapter returned a Promise');};
 const before=point(physicalPoint),from=actor.pivot;let connector;
 if(!g.realDot){connector=connectors.find(e=>e.id===g.connector);if(!human||!connector||connector.first!==target.id)throw new Error('Moving-human source rail specification required');connectorRect(connector,dots);}
 if(allowMarkedTransfers)markedGrabPrelude(actor,old,target,g,{allowMarkedTransfers,onDeath:onMarkedDeath});
 sync(release,old,actor);actor.pivot=target.id;actor.unwrappedFrame+=32;actor.frame=actor.unwrappedFrame&63;
 let placed;
 if(g.realDot){actor.sliding=false;delete actor.sourceRailSpritePoint;placed={...target.currentPixel};}
 else{
  const first=target.currentPixel,vertical=connector.vertical,progress=Math.trunc(((vertical?before.y:before.x)-(vertical?first.y:first.x))/3),frame=actor.frame,direction=actor.direction;
  const delta=vertical?((frame===0&&direction===-1||frame===32&&direction===1)?-1:1):((frame===16&&direction===-1||frame===48&&direction===1)?1:-1);
  const travel=vertical?(delta>0?1:3):(delta>0?0:2),vectors=[[3,0],[0,3],[-3,0],[0,-3]],v=vectors[travel];
  Object.assign(actor,{sliding:true,slideProgress:progress,slideDelta:delta,slideDirection:travel,slideVX:v[0],slideVY:v[1],slideX:first.x+(vertical?0:3*progress),slideY:first.y+(vertical?3*progress:0),sourceRailAnchor:{...first}});
  placed=vertical?{x:first.x,y:before.y}:{x:before.x,y:first.y};actor.sourceRailSpritePoint={...placed};
 }
 sync(place,actor,placed);const receipt={type:g.realDot?'real-grab':'rail-grab',from,to:target.id,connector:g.connector,frame:actor.frame,progress:actor.slideProgress,physical:{...placed}};
 sync(onTransfer,{...receipt},actor);sync(grab,target,actor,g);return receipt;
}
