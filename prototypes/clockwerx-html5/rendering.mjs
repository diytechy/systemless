import {angleDelta} from './engine.mjs';

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
