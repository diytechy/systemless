// Child fixed-pivot, unprogrammed class1 busters. Moving/programmed busters
// need a separate admission. PR clones keep the source clock and frozen art.
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const fail=()=>{throw Error('Separate static Child free-buster composition required');};
export function assertFreeBusterActor(a,gunBusters=false){
 if(typeof gunBusters!=='boolean')fail();
 if(!a||!int(a.sourceSlot,0,30)||a.sliding||a.movingPivot||![0,1,2,3,5,6].includes(a.sourceActorType))fail();
 const human=[0,6].includes(a.sourceActorType);
 if(gunBusters&&!human){
  if(a.checksWalls!==false||!(a.sourceActorType===5&&a.speedClass===1&&a.program===null||a.sourceActorType===1&&a.speedClass===1&&typeof a.program==='string'&&/^[fn]+$/.test(a.program)||a.sourceActorType===3&&a.speedClass===5&&typeof a.program==='string'&&/^[ns]+$/.test(a.program))||a.program!==null&&!int(a.sourcePC,1,a.program.length))fail();
  return true;
 }
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
// WAHitEnemy applies SANE FTTI ($16), then converts to a word ($2810),
// before applying the human angular sign. Components truncate toward zero.
export function busterVelocity(frame,direction){
 if(!int(frame,0,63)||![-1,1].includes(direction))fail();
 const theta=frame*Math.PI/32;
 return {x:Math.trunc(-6*Math.sin(theta))*direction||0,y:Math.trunc(6*Math.cos(theta))*direction||0};
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
// WLShatterSeg: one transient clone per wall hit. Segment collision probes
// run in source order against the unchanged incoming projectile shape.
export function shatterFreeBusterWall(w,overlaps){
 if(!w||![0,1,...Array.from({length:15},(_,i)=>i+5)].includes(w.frame)||typeof overlaps!=='function')fail();
 const cross=w.frame>=5;let removed=0;
 if(cross){
  const mask=w.frame-4;
  for(const [bit,frame]of [[4,22],[1,20],[8,23],[2,21]])if(mask&bit&&overlaps(frame))removed|=bit;
  const remaining=mask&~removed;w.frame=remaining+4;if(!remaining)w.visible=false;
 }else w.visible=false;
 const start=cross?(removed&5?0:9):(w.frame===0?27:18);
 return {group:cross?3700:3600,frame:start,last:start+8,reference:null,
  point:{x:w.x-11+(cross&&removed&1?19:0),y:w.y-9+(cross&&removed&2?19:0)},removed};
}
export function advanceBusterWallEffects(effects,count){
 if(!Array.isArray(effects)||!int(count,0,Number.MAX_SAFE_INTEGER))fail();
 for(const e of effects)if(e.reference!==count){e.reference=count;e.frame++;}
 return effects.filter(e=>e.frame<=e.last);
}
