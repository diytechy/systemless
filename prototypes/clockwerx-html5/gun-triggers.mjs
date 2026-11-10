// Source GN/TR and type-0 PR primitives. Scene admission and sprite order
// belong to the caller. Coordinates in this runtime are universe-local.
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const point=p=>p&&integer(p.x,-32768,32767)&&integer(p.y,-32768,32767);
const count=n=>Number.isSafeInteger(n)&&n>=0;
const table=Object.freeze([
 Object.freeze({bit:1,barrel:3,dx:24,dy:4,vx:0,vy:-3}),
 Object.freeze({bit:2,barrel:4,dx:43,dy:22,vx:3,vy:0}),
 Object.freeze({bit:4,barrel:5,dx:24,dy:42,vx:0,vy:3}),
 Object.freeze({bit:8,barrel:6,dx:4,dy:22,vx:-3,vy:0}),
]);

export function activeGunTriggerSpecs(records,{kind,activeMask=1,gridOrigin,frameOrigin}={}){
 if(!['GN','TR'].includes(kind)||!Array.isArray(records)||!integer(activeMask,1,0xffffffff)||!point(gridOrigin)||!point(frameOrigin))throw new TypeError('Explicit source gun/trigger geometry required');
 const words=kind==='GN'?7:6,active=[];
 for(const [sourceIndex,record] of records.entries()){
  const w=record?.rawWords;
  if(!Array.isArray(w)||w.length!==words||w.some(n=>!integer(n,0,65535)))throw new TypeError(`Qualified source ${kind} words required`);
  const activationMask=w[words-2]*65536+w[words-1];
  if(!(activationMask&activeMask))continue; // inactive records allocate no runtime slot
  const [row,column,placement,color,directions]=w;
  if(row>7||column>10||!integer(placement,1,3)||color>2||kind==='GN'&&!integer(directions,1,15))throw new RangeError(`Unqualified active ${kind} geometry`);
  if(active.length===18)throw new RangeError(`Source ${kind} capacity exceeded`);
  const rawBase={x:gridOrigin.x-frameOrigin.x+48*column-35+24*(placement%2),y:gridOrigin.y-frameOrigin.y+48*row-33+24*Math.floor(placement/2)};
  active.push({id:active.length,sourceIndex,row,column,placement,color,activationMask,rawBase,...(kind==='GN'?{directions}:{})});
 }
 return active;
}

export function gunPaintFrames(gun){
 if(!integer(gun?.color,0,2)||!integer(gun.directions,1,15)||typeof gun.enabled!=='boolean')throw new TypeError('Source GN paint state required');
 return gun.enabled?[gun.color,...table.filter(d=>gun.directions&d.bit).map(d=>d.barrel)]:[7];
}

export class GunTriggerRuntime {
 constructor({guns,triggers,rawBounds,frameOrigin,templateReference}){
  if(!point(frameOrigin)||!count(templateReference)||!rawBounds||!['left','top','right','bottom'].every(k=>integer(rawBounds[k],-32768,32767))||rawBounds.left>rawBounds.right||rawBounds.top>rawBounds.bottom)throw new TypeError('Explicit source projectile frame, bounds and template clock required');
  const specs=(rows,gun)=>Array.isArray(rows)&&rows.length<=18&&rows.every((d,i)=>d.id===i&&integer(d.sourceIndex,0,65535)&&(!i||d.sourceIndex>rows[i-1].sourceIndex)&&point(d.rawBase)&&integer(d.color,0,2)&&(!gun||integer(d.directions,1,15)));
  if(!specs(guns,true)||!specs(triggers,false))throw new TypeError('Ordered active source GN/TR inventory required');
  this.specs=structuredClone({guns,triggers});this.rawBounds={...rawBounds};this.frameOrigin={...frameOrigin};
  this.templateReference=templateReference;this.classCount=templateReference;this.reset();
 }
 reset(){
  this.guns=this.specs.guns.map(g=>({...g,rawBase:{...g.rawBase},enabled:true}));
  this.triggers=this.specs.triggers.map(t=>({...t,rawBase:{...t.rawBase},occupancy:0,frame:2*t.color,visible:true}));
  this.slots=Array(32).fill(null);this.insertionOrder=[];this.contacts=new Map();
 }
 pointFor(raw){return {x:raw.x+this.frameOrigin.x,y:raw.y+this.frameOrigin.y};}
 activateColor(color){
  if(!integer(color,0,2))throw new RangeError('Source GN color required');
  const events=[];
  for(const gun of this.guns){
   if(!gun.enabled||gun.color!==color)continue;
   for(const d of table){
    if(!(gun.directions&d.bit))continue;
    const slot=this.slots.indexOf(null);
    if(slot<0){events.push({type:'projectile-pool-full',gun:gun.id,bit:d.bit});continue;}
    const projectile={slot,gun:gun.id,frame:color,rawBase:{x:gun.rawBase.x+d.dx,y:gun.rawBase.y+d.dy},velocity:{x:d.vx,y:d.vy},reference:this.templateReference};
    this.slots[slot]=projectile;this.insertionOrder.push(projectile);
    events.push({type:'projectile-launch',slot,gun:gun.id,bit:d.bit,rawBase:{...projectile.rawBase}});
   }
   events.push({type:'sound',id:35,gun:gun.id});
  }
  return events;
 }
 contact(actor,overlaps,{suppressed=false}={}){
  if(!actor||!integer(actor.sourceSlot,0,30)||!integer(actor.sourceActorType,0,6)||typeof overlaps!=='function'||typeof suppressed!=='boolean')throw new TypeError('Source trigger actor and synchronous contact adapter required');
  if(![0,1,2,3,6].includes(actor.sourceActorType))return [];
  const old=this.contacts.get(actor.sourceSlot)??-1;
  const next=actor.visible===false?-1:this.triggers.find(t=>t.visible&&overlaps(t,actor)===true)?.id??-1;
  if(next===old)return [];
  this.contacts.set(actor.sourceSlot,next); // source updates cache even when suppressed
  if(suppressed)return [];
  const events=[];
  if(next!==-1){
   const t=this.triggers[next];events.push(...this.activateColor(t.color));
   if(t.occupancy===0)t.frame=2*t.color+1;
   t.occupancy=((t.occupancy+1)<<16)>>16;
  }
  if(old!==-1){
   const t=this.triggers[old];t.occupancy=((t.occupancy-1)<<16)>>16;
   if(t.occupancy===0)t.frame=2*t.color;
  }
  events.push({type:'trigger-contact',actor:actor.sourceSlot,from:old,to:next});return events;
 }
 advance(countNow,{wall=()=>false,door=()=>false}={}){
  if(!count(countNow)||countNow<this.classCount||typeof wall!=='function'||typeof door!=='function')throw new RangeError('Monotonic source class0 count and collision adapters required');
  this.classCount=countNow;
  const events=[],b=this.rawBounds;
  // This is the layer's entry inventory. Call before WA callbacks; their new
  // projectiles become visible immediately and first dispatch next traversal.
  for(const p of [...this.insertionOrder]){
   if(p.reference===countNow)continue;
   p.reference=countNow;p.rawBase.x+=p.velocity.x;p.rawBase.y+=p.velocity.y;
   const {x,y}=p.rawBase;
   const reason=x<b.left||x>b.right||y<b.top||y>b.bottom?'bounds':wall(p)===true?'wall':door(p)===true?'door':null;
   if(reason){
    this.slots[p.slot]=null;this.insertionOrder.splice(this.insertionOrder.indexOf(p),1);
    if(reason!=='bounds')events.push({type:'sound',id:reason==='wall'?31:32,slot:p.slot});
    events.push({type:'projectile-dispose',slot:p.slot,reason,rawBase:{...p.rawBase}});
   }
  }
  return events;
 }
 humanHit(actor,overlaps){
  if(!actor||![0,6].includes(actor.sourceActorType)||typeof overlaps!=='function')throw new TypeError('Source human projectile collision required');
  if(actor.visible===false)return null;
  const p=this.slots.find(p=>p&&overlaps(p,actor)===true);
  return p?{reason:'projectile',sourceReason:16,object:p.slot}:null;
 }
 snapshot(){return structuredClone({guns:this.guns,triggers:this.triggers,slots:this.slots,insertionOrder:this.insertionOrder.map(p=>p.slot),contacts:[...this.contacts],templateReference:this.templateReference,classCount:this.classCount});}
}
