import {validateConnectorBoard} from './sliding.mjs';

// Independent static HY/EX composition. This does not qualify HY on an EX,
// ring or goal, orbital hands, moving pivots, walls or any other object family.
export function assertSlidingTeleportDots(dots,{initial=false}={}){
 if(!Array.isArray(dots)||!dots.length||!dots.some(d=>d.teleport)||!dots.some(d=>d.slideMask))throw new Error('Explicit static HY/EX dot inventory required');
 const origin={x:dots[0].x-48*dots[0].column,y:dots[0].y-48*dots[0].row};
 if(new Set(dots.map(d=>d.id)).size!==dots.length)throw new Error('Unique HY/EX dot identities required');
 if(new Set(dots.map(d=>`${d.column},${d.row}`)).size!==dots.length)throw new Error('Unique HY/EX source grid positions required');
 for(const d of dots)if(!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isInteger(d.column)||d.column<0||d.column>10||!Number.isInteger(d.row)||d.row<0||d.row>7||d.x-48*d.column!==origin.x||d.y-48*d.row!==origin.y)throw new Error('HY/EX requires current integer source grid coordinates');
 for(const d of dots)if(d.present!==true||d.motion!=='static'||typeof d.teleport!=='boolean'||typeof d.ring!=='boolean'||!Number.isInteger(d.slideMask)||d.slideMask<0||d.slideMask>15||typeof d.humanCanGrab!=='boolean'||d.nonhumanCanGrab!==true||initial&&d.humanCanGrab!==true||!d.ring&&d.humanCanGrab!==true||!Number.isInteger(d.color)||d.color<0||d.color>7||d.bonus||d.burnt||d.protected||d.waystation||d.upDown||d.moving||d.movingProgram||d.transferDeath||d.slowdown||d.sourceBombDynamic||d.connector||!['dot','goal'].includes(d.kind)||d.ring&&(d.color!==0||d.slideMask||d.teleport||d.kind!=='dot')||d.teleport&&(d.slideMask||d.kind!=='dot')||d.slideMask&&d.kind!=='dot')throw new Error('HY/EX requires plain static endpoints and disjoint white rings/goal');
 return true;
}

export function assertSlidingTeleportActor(a,{program=a?.program,human=false}={}){
 if(!a||a.movingPivot||!Number.isInteger(a.sourceSlot)||a.sourceSlot<0||a.sourceSlot>30||human!==(a.sourceSlot<2)||(human?![0,6].includes(a.sourceActorType)||a.speedClass!==0:![1,2,3].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||program!==null&&(typeof program!=='string'||!program.length||program.length>255||!/^[bfns]+$/.test(program)||!Number.isInteger(a.sourcePC)||a.sourcePC<1||a.sourcePC>program.length)))throw new Error('HY/EX requires source slots0..30, ordinary class1 b/f/n/s PC1 hands and class0 humans');
 return true;
}

export function assertSlidingTeleportScope({dots=[],connectors=[],teleports=[],actors=[],initial=false,activeSections={}}={}){
 assertSlidingTeleportDots(dots,{initial});validateConnectorBoard(connectors,dots);
 if(!Array.isArray(teleports)||!teleports.length||teleports.length>22||teleports.length!==dots.filter(d=>d.teleport).length)throw new Error('HY/EX requires complete paired HY inventory');
 const seen=new Set(),channels=new Map();
 for(const e of teleports){
  const d=dots.find(d=>d.id===e.dot),partner=teleports.find(p=>p.dot===e.partner);
  if(!d?.teleport||seen.has(e.dot)||!partner||partner===e||partner.partner!==e.dot||partner.channel!==e.channel)throw new Error('HY/EX requires distinct symmetric HY endpoints');
  if(!Number.isInteger(e.channel)||e.channel<0||e.channel>24||e.firstFrame!==2*e.channel+1||e.lastFrame!==e.firstFrame+1||![e.firstFrame,e.lastFrame].includes(e.initialFrame))throw new Error('HY/EX requires source channels0..24 and exact endpoint descriptor pairs');
  seen.add(e.dot);const pair=channels.get(e.channel)||[];pair.push(e);channels.set(e.channel,pair);
 }
 for(const pair of channels.values())if(pair.length!==2||pair[0].initialFrame!==pair[0].firstFrame||pair[1].initialFrame!==pair[1].lastFrame)throw new Error('HY/EX requires exactly two complementary initial endpoints per channel');
 for(const e of connectors)if(e.bonus||e.burnt)throw new Error('HY/EX requires ordinary unburnt connectors');
 for(const[k,n]of Object.entries(activeSections))if(!Number.isInteger(n)||n<0||n&&!['HY','EX','WP','WA','TX'].includes(k))throw new Error('Unqualified HY/EX section '+k);
 if(activeSections.HY!==undefined&&activeSections.HY!==teleports.length||activeSections.EX!==undefined&&activeSections.EX!==connectors.length)throw new Error('Matching HY/EX inventory required');
 let previous=-1;
 for(const a of actors){assertSlidingTeleportActor(a,{human:[0,6].includes(a.sourceActorType)});if(a.sourceSlot<=previous)throw new Error('Ordered unique HY/EX source slots required');previous=a.sourceSlot;const d=dots.find(d=>d.id===a.pivot);if(!d||initial&&(d.teleport||a.sourceSlot<2&&(d.slideMask||d.ring||d.kind!=='dot')))throw new Error('HY/EX requires ordinary human starts and no initial NPC HY hook');}
 return true;
}
