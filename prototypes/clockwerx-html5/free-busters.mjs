// Child fixed-pivot, unprogrammed class1 busters. Moving/programmed busters
// need a separate admission. PR clones keep the source clock and frozen art.
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const fail=()=>{throw Error('Separate static Child free-buster composition required');};
export function assertFreeBusterActor(a){
 if(!a||!int(a.sourceSlot,0,30)||a.sliding||a.movingPivot||![0,1,2,3,5,6].includes(a.sourceActorType))fail();
 const human=[0,6].includes(a.sourceActorType);
 if(human?(a.speedClass!==0||a.program!==null):a.speedClass!==1||a.checksWalls!==false||a.program!==null&&(![1,2,3].includes(a.sourceActorType)||!/^[fn]+$/.test(a.program)||!int(a.sourcePC,1,a.program.length)))fail();
 return true;
}
export function assertFreeBusterSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88)fail();
 const rows=k=>s.blocks?.find(b=>b.kind===k)?.records??[],allowed=['WA','WP','TX','SP','BO','GO','WL','DR','DS','PU'];
 if(s.blocks.some(b=>b.count!==b.records.length||b.count&&!allowed.includes(b.kind)))fail();
 if(rows('PU').some(r=>(r.rawWords[3]*65536+r.rawWords[4])&mask))fail();
 const cells=s.cells.filter(c=>c.present);
 if(cells.some(c=>![1,3,0x4001,0x4003,0x4005,9].includes(c.flagsRaw)||!(c.secondaryRaw&mask)||c.inlineProgram)||cells.filter(c=>c.flagsRaw&4).length!==1)fail();
 const active=rows('WA').filter(a=>a.activationMaskRaw&mask),ps=rows('WP');
 if(active.length<3||active.length>31||active[0].actorTypeRaw!==0||active[1].actorTypeRaw!==6||!active.some(a=>a.actorTypeRaw===5))fail();
 for(const [i,a]of active.entries()){
  const program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  assertFreeBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});
  if(!int(a.initialFrameHalfIndexRaw,0,31)||![1,65535].includes(a.rawWords[4])||!cells.some(c=>c.column===a.gridPosition?.column&&c.row===a.gridPosition?.row))fail();
 }
 if(rows('GO').some(r=>r.rawWords[2]!==169)||rows('GO').length>15||rows('BO').length>60)fail();
 return true;
}
export function assertFreeBusterBoard(b,outlines){
 if(!b?.freeBusterRules||b.activeMask!==1||b.difficulty!=='Child'||!b.bombRules||!b.bombObjectInteractionRules||!b.canonicalPlayerRules||!b.staticEnemyCallbacks||!b.specialDotRules||!b.childScoreRules||!b.importedGoodie169Rules||['movingDotRules','slidingConnectorRules','teleportRules','elevatorRules','canonicalOilRules','rotatingSpikeRules','markedTransferRules','gunTriggerProjectileRules'].some(k=>b[k])||['puddles','connectors','teleports','elevators'].some(k=>b[k]?.length))fail();
 for(const a of [b.player,...b.enemies])assertFreeBusterActor(a);
 if(b.dots.some(d=>d.motion!=='static'||d.slideMask||d.upDown||d.teleport||d.protected||d.waystation||d.transferDeath||d.slowdown))fail();
 if(outlines)for(let i=0;i<64;i++){const f=outlines.groups?.[3900]?.frames?.[i];if(!f||!Array.isArray(f.rows)||!['left','top','right','bottom'].every(k=>Number.isInteger(f[k])))fail();}
 return true;
}
// SANE computes 6*cos(theta), -6*sin(theta), rounds to integer, then applies
// the human angular sign. No sample is a half integer on the 64-angle lattice.
export function busterVelocity(frame,direction){
 if(!int(frame,0,63)||![-1,1].includes(direction))fail();
 const theta=frame*Math.PI/32,round=n=>Math.round(Math.abs(n))*Math.sign(n);
 return {x:round(-6*Math.sin(theta))*direction||0,y:round(6*Math.cos(theta))*direction||0};
}
export function advanceFreeBuster(a,delta,guestTick){
 assertFreeBusterActor(a);
 if(a.sourceActorType!==5||!int(delta,0,1)||!int(guestTick,0,Number.MAX_SAFE_INTEGER)||!int(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||![-1,1].includes(a.direction))fail();
 const events=[];
 if(delta){
  a.unwrappedFrame+=a.direction;a.frame=a.unwrappedFrame&63;
  if(!a.visible&&a.hiddenUntil&&guestTick>a.hiddenUntil){a.visible=true;events.push({type:'buster-return'});}
  if(a.orphaned){
   if(guestTick>a.orphanDeadline){a.visible=false;a.orphaned=false;a.hiddenUntil=0;events.push({type:'orphan-expired'});}
   else a.visible=!a.visible;
  }
 }
 return events;
}
