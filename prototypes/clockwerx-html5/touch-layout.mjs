// Pure layout planner for the touch "play view": the 4:3 board takes the largest size the viewport
// allows while leaving a panel for touch instructions/controls, either beside the board ("side") or
// below it ("bottom"). It also reports whether turning the device would give a meaningfully larger
// board, so the app can ask the player to rotate. DOM-free for unit testing.

export const LAYOUT_DEFAULTS=Object.freeze({sidePanelMin:176,bottomPanelMin:120,rotateGain:1.15,aspect:4/3});

function arrange(width,height,o){
  const fit=(w,h)=>{const bw=Math.max(0,Math.min(w,h*o.aspect));return {w:bw,h:bw/o.aspect};};
  const side=fit(width-o.sidePanelMin,height),bottom=fit(width,height-o.bottomPanelMin);
  // Prefer the arrangement that gives the larger board; ties go to the side panel (thumb-friendly).
  const arrangement=side.w>=bottom.w?'side':'bottom',raw=arrangement==='side'?side:bottom;
  const w=Math.floor(raw.w),h=Math.floor(w/o.aspect);
  return {arrangement,board:{w,h},panel:arrangement==='side'?{w:width-w,h:height}:{w:width,h:height-h}};
}

export function planPlayLayout(width,height,options={}){
  const o={...LAYOUT_DEFAULTS,...options};
  if(!(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0))throw new RangeError('Positive viewport size required');
  for(const k of['sidePanelMin','bottomPanelMin','rotateGain','aspect'])if(!(Number.isFinite(o[k])&&o[k]>=0))throw new RangeError('Invalid layout option '+k);
  const plan=arrange(width,height,o),turned=arrange(height,width,o);
  const gain=plan.board.w>0?turned.board.w/plan.board.w:Infinity;
  return {...plan,orientation:width>=height?'landscape':'portrait',
    rotate:gain>=o.rotateGain?{to:width>=height?'portrait':'landscape',gain,board:turned.board}:null};
}
