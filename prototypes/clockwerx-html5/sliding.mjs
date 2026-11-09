// Source EX / WA sliding primitives. No source maps or art.
const vectors=[[3,0],[0,3],[-3,0],[0,-3]];
export function connectorSpecs(records,dots){
 if(!Array.isArray(records)||records.length>61)throw new RangeError('EX capacity61');
 const result=records.map((r,id)=>{
  const w=r.rawWords;
  if(!Array.isArray(w)||w.length!==3||!w.every(Number.isInteger)||![0,256].includes(w[2])||w[0]<0||w[0]>7||w[1]<0||w[1]>10)throw new Error('Qualified EX orientation0/1 and byte2zero required');
  const vertical=w[2]===256,a=dots.find(d=>d.row===w[0]&&d.column===w[1]),b=dots.find(d=>d.row===w[0]+(vertical?1:0)&&d.column===w[1]+(vertical?0:1));
  if(!a||!b||a.motion!=='static'||b.motion!=='static'||a.teleport||b.teleport)throw new Error('Static present EX endpoints required');
  return {id,first:a.id,second:b.id,vertical};
 });
 for(const d of dots){d.slideMask=0;for(const e of result){if(e.first===d.id)d.slideMask|=e.vertical?2:1;if(e.second===d.id)d.slideMask|=e.vertical?8:4;}}
 return result;
}
export function startSliding(actor,dot){
 if(actor.sliding||actor.frame%16)return false;
 const bit=(actor.direction>0?[2,4,8,1]:[8,1,2,4])[actor.frame/16];
 if(!(dot.slideMask&bit))return false;
 const dir={1:0,2:1,4:2,8:3}[bit],[vx,vy]=vectors[dir];
 Object.assign(actor,{sliding:true,slideProgress:0,slideDelta:1,slideDirection:dir,slideVX:vx,slideVY:vy,slideX:dot.x,slideY:dot.y});return true;
}
export function reverseSliding(actor){
 actor.direction*=-1;actor.sourceBlockedTarget=null;
 if(actor.sliding){actor.slideDelta*=-1;actor.slideVX*=-1;actor.slideVY*=-1;}
}
export function animateSliding(actor){
 if(!actor.sliding)return false;
 actor.slideProgress+=actor.slideDelta;actor.slideX+=actor.slideVX;actor.slideY+=actor.slideVY;return true;
}
export function stopSliding(actor,dots,{release,grab,currentPivot=false,arrival}={}){
 if(!actor.sliding)return null;
 if(actor.slideProgress>=16){
  const old=dots.find(d=>d.id===actor.pivot),[vx,vy]=vectors[actor.slideDirection],target=dots.find(d=>d.present&&d.row===old.row+vy/3&&d.column===old.column+vx/3);
  if(!target)throw new Error('Missing EX arrival dot');
  release?.(old,actor);actor.pivot=target.id;arrival?.({type:'slide-arrival',from:old.id,to:target.id},actor);grab?.(target,actor);
  const placed=currentPivot?dots.find(d=>d.id===actor.pivot):target;
  if(!placed)throw new Error('Missing current EX pivot after grab');
  actor.slideX=placed.x;actor.slideY=placed.y;actor.sliding=false;return {type:'slide-arrival',from:old.id,to:target.id};
 }
 if(actor.slideDelta<0&&actor.slideProgress<=0){actor.sliding=false;return {type:'slide-backout',dot:actor.pivot};}
 return null;
}
export function slidingPoint(actor,dot){return actor.sliding?{...dot,x:actor.slideX,y:actor.slideY}:dot;}
// EXMakeBonus / DOMakeBonus closure in source connector order; logical data only.
export function initializeConnectorBonuses(connectors,dots){
 const at=id=>dots.find(d=>d.id===id),added=[];
 const makeDot=d=>{if(d.bonus)return;d.bonus=true;d.cell|=2;if(d.kind!=='goal')d.kind='bonus';added.push(d.id);for(const e of connectors)if(e.first===d.id||e.second===d.id)makeLink(e);};
 const makeLink=e=>{if(e.bonus)return;e.bonus=true;makeDot(at(e.first));makeDot(at(e.second));};
 for(const e of connectors)e.bonus=false;
 for(const e of connectors)if(at(e.first).bonus||at(e.second).bonus)makeLink(e);
 return added;
}
// DOUnbonus only propagates when a link actually changes; one pickup awards once.
export function consumeConnectorBonus(connectors,dots,id){
 const changed=[],seen=new Set(),at=id=>dots.find(d=>d.id===id);
 const consumeDot=d=>{if(!d||seen.has(d.id))return;seen.add(d.id);d.collected=true;changed.push(d.id);for(const e of connectors)if((e.first===d.id||e.second===d.id)&&e.bonus){e.bonus=false;consumeDot(at(e.first));consumeDot(at(e.second));}};
 consumeDot(at(id));return changed;
}
export function connectorLook(connector,dots){
 const first=dots.find(d=>d.id===connector.first);
 if(!first||!Number.isInteger(first.color)||first.color<0||first.color>7)throw new Error('Source connector look required');
 // DOGetColorOffset normalizes runtime bits4000/2000/1000 to1/2/4.
 // EXGetLook indexes its DATA table directly with runtime bits1000/2000/4000.
 const sourceColor=((first.color&1)<<2)|(first.color&2)|((first.color&4)>>2);
 return (connector.burnt?18:connector.bonus?0:36)+(connector.vertical?4:0)+[0,2,3,10,1,9,8,11][sourceColor];
}
export function validateConnectorBoard(connectors,dots){
 if(!Array.isArray(connectors)||!connectors.length||connectors.length>61)throw new Error('Bounded EX connector board required');
 for(const e of connectors){const a=dots.find(d=>d.id===e.first),b=dots.find(d=>d.id===e.second);if(!a||!b||typeof e.vertical!=='boolean'||a.motion!=='static'||b.motion!=='static'||!a.present||!b.present||a.teleport||b.teleport||b.column!==a.column+(e.vertical?0:1)||b.row!==a.row+(e.vertical?1:0))throw new Error('Adjacent static EX endpoints required');}
 for(const d of dots){let mask=0;for(const e of connectors){if(e.first===d.id)mask|=e.vertical?2:1;if(e.second===d.id)mask|=e.vertical?8:4;}if(d.slideMask!==mask)throw new Error('EX source direction mask mismatch');}
 return true;
}
