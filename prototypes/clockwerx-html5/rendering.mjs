import {angleDelta,TAU} from './engine.mjs';
export function atlasFrame(animation,seconds){
 if(!animation||animation.type!=='atlas')return null;
 const {frameWidth,frameHeight,frameCount,frameSeconds}=animation;
 if(![frameWidth,frameHeight,frameSeconds].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(frameCount)||frameCount<1)throw new Error('Invalid animation atlas');
 const order=animation.frameOrder||Array.from({length:frameCount},(_,i)=>i);
 if(!order.length||!order.every(i=>Number.isInteger(i)&&i>=0&&i<frameCount))throw new Error('Invalid animation frame order');
 const phase=Math.floor(Math.max(0,seconds)/frameSeconds)%order.length;
 return {x:order[phase]*frameWidth,y:0,width:frameWidth,height:frameHeight};
}
export function presentedAngle(hand,previous,alpha,vector){
 if(vector)return renderAngle(hand,previous,alpha);
 const normalized=((hand.angle%TAU)+TAU)%TAU;
 return (Math.round(normalized/TAU*64)%64)*TAU/64;
}

// Presentation only: never blend between different pivots or across reversals.
// The 120Hz simulation and its collision/transfer decisions stay authoritative.
export function handPoses(game){
  return Object.fromEntries([...game.demos,game.player].map(h=>[h.name,{angle:h.angle,pivot:h.pivot,direction:h.direction}]));
}
export function renderAngle(hand,previous,alpha){
  if(!previous||previous.pivot!==hand.pivot||previous.direction!==hand.direction)return hand.angle;
  return previous.angle+angleDelta(hand.angle,previous.angle)*Math.max(0,Math.min(1,alpha));
}
export function resizeCanvas(canvas,ratio=1){
  const rect=canvas.getBoundingClientRect();
  const scale=Math.max(1,Math.min(4,ratio*rect.width/640));
  const width=Math.round(640*scale),height=Math.round(480*scale);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  return {scaleX:canvas.width/640,scaleY:canvas.height/480};
}
