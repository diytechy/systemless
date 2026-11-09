import {validateConnectorBoard} from './sliding.mjs';

// A distinct normalized capability: physical EX movement, ordinary n/s/f
// actors and Oil. This never grants moving pivots, HY or blast callbacks.
export function assertSlidingOilScope({dots=[],actors=[],connectors=[],puddles=[],goodies=[],spikes=[],activeSections={},rich=false,initial=false}={}){
 if(!Array.isArray(dots)||!Array.isArray(actors)||!Array.isArray(puddles)||!connectors.length||!puddles.length||!spikes.length)throw new Error('Explicit EX/Oil/static SP inventory required');
 validateConnectorBoard(connectors,dots);
 for(const [kind,n]of Object.entries(activeSections))if(!Number.isInteger(n)||n<0||n&&!['SP','PU','EX','WP','WA','TX',...(rich?['GO']:[])].includes(kind))throw new Error('Unqualified EX/Oil section '+kind);
 for(const d of dots){
  if(d.motion!=='static'||d.moving||d.movingProgram||d.upDown||d.teleport!==false||d.protected||d.waystation||d.transferDeath||d.slowdown||d.sourceBombDynamic||d.burnt||d.connector||d.ring&&(!rich||![0,4].includes(d.color)||d.slideMask||d.bonus||d.kind!=='dot')||!d.ring&&d.humanCanGrab!==true||d.nonhumanCanGrab!==true||initial&&d.humanCanGrab!==true||['present','humanCanGrab','nonhumanCanGrab','sourceInBackground','ring','bonus'].some(k=>typeof d[k]!=='boolean')||d.present!==true)throw new Error('Unqualified EX/Oil dot');
 }
 for(const a of actors){
  if(a.movingPivot||![0,1,2,3,6].includes(a.sourceActorType)||!Number.isInteger(a.sourceSlot)||a.sourceSlot<0||a.sourceSlot>30||([0,6].includes(a.sourceActorType)!==(a.sourceSlot<2))||([0,6].includes(a.sourceActorType)?a.speedClass!==0:a.speedClass!==1||a.checksWalls!==false||a.program!==null&&(!/^[fns]+$/.test(a.program)||!Number.isInteger(a.sourcePC)||a.sourcePC<1)))throw new Error('EX/Oil requires ordinary wall-free class1 n/s/f actors');
 }
 if(puddles.some(p=>p.kind!==(rich?1:0))||(rich?(!goodies.length||goodies.some(g=>(g.initialFrame??g.frame)!==0)||!dots.some(d=>d.ring)):goodies.length||dots.some(d=>d.ring)))throw new Error('Separate simple Oil or Oil/GO/ring inventory required');
 return true;
}
