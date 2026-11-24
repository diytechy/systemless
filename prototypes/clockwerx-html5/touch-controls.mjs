// Touch gesture recognizer for the ClockWerx HTML5 pilot. Pure and DOM-free: the caller forwards
// pointer down/move/up/cancel events (client pixels, ms timestamps) and polls once per frame.
//
// Default mapping (all configurable):
//   tap (one finger, short, still)        -> reverse   (edge event, like the C key)
//   one-finger hold                        -> swing     (held, like Space)
//   two-finger hold                        -> flip      (held, like X: hop over to the next dot)
//   one-finger press-and-drag, then hold   -> bounce    (held, like Z; optional, rarely needed:
//                                             a well-timed tap reverses almost identically)
//
// Why a hold threshold instead of arming swing on touch-down: the game samples held actions only when
// the hand reaches a cardinal pose, while Reverse is queued to the next actor callback. Committing a
// hold after `holdMs` therefore costs at most `holdMs` of early-press margin, and it guarantees a quick
// tap can never become an unintended pivot transfer when it happens to coincide with a dot.
// The finger count decides the action while held, so adding a second finger to a swing hold switches
// to the two-finger action and lifting it switches back (mirroring held keys).

export const TOUCH_DEFAULTS=Object.freeze({holdMs:150,tapMaxMs:250,tapSlopPx:12,dragPx:28,twoFingerAction:'flip',dragAction:'bounce',oneFingerAction:'swing',maxPointers:4});
const ACTIONS=new Set(['swing','bounce','flip']);

export function createTouchGestures(options={}){
  const o={...TOUCH_DEFAULTS,...options};
  for(const k of['holdMs','tapMaxMs','tapSlopPx','dragPx','maxPointers'])if(!(Number.isFinite(o[k])&&o[k]>=0))throw new RangeError('Invalid touch option '+k);
  for(const k of['twoFingerAction','dragAction','oneFingerAction'])if(!ACTIONS.has(o[k]))throw new RangeError('Invalid touch action '+k);
  const pointers=new Map();
  let session=null,taps=0,lastTap=null;
  const finite=(...v)=>v.every(Number.isFinite);
  function start(t){session={startT:t,maxPointers:0,dragged:false,committed:false,moved:false};}
  function classify(){
    if(!session||!pointers.size)return null;
    if(pointers.size>=2)return o.twoFingerAction;
    return session.dragged?o.dragAction:o.oneFingerAction;
  }
  function maybeCommit(t){
    if(!session||session.committed||!pointers.size)return;
    if(t-session.startT>=o.holdMs||session.dragged||pointers.size>=2)session.committed=true;
  }
  return {
    options:o,
    down(id,x,y,t){
      if(!finite(x,y,t))throw new TypeError('Finite pointer coordinates and time required');
      if(pointers.has(id)||pointers.size>=o.maxPointers)return false;
      if(!pointers.size)start(t);
      pointers.set(id,{x0:x,y0:y,x,y,t0:t});session.maxPointers=Math.max(session.maxPointers,pointers.size);
      maybeCommit(t); // a second finger can never be a reverse tap, so it commits immediately
      return true;
    },
    move(id,x,y,t){
      const p=pointers.get(id);if(!p||!finite(x,y,t))return;
      p.x=x;p.y=y;const d=Math.hypot(x-p.x0,y-p.y0);
      if(d>o.tapSlopPx)session.moved=true;
      if(d>=o.dragPx&&pointers.size===1&&!session.committed){session.dragged=true;maybeCommit(t);}
    },
    up(id,t){
      const p=pointers.get(id);if(!p)return;
      if(!Number.isFinite(t))throw new TypeError('Finite pointer time required');
      maybeCommit(t);pointers.delete(id);if(!pointers.size)session.last={x:p.x,y:p.y};
      if(pointers.size)return;
      const s=session;session=null;
      if(!s.committed&&s.maxPointers===1&&!s.moved&&t-s.startT<=o.tapMaxMs){taps++;lastTap={...s.last,t};}
    },
    cancel(id){if(pointers.delete(id)&&!pointers.size)session=null;},
    tracks(id){return pointers.has(id);},
    reset(){pointers.clear();session=null;taps=0;},
    // Call once per animation frame. `held` is level state; `taps` counts reverse edges since the last poll.
    poll(t){
      maybeCommit(t);
      const action=session?.committed?classify():null,held={swing:false,bounce:false,flip:false};
      if(action)held[action]=true;
      const out={held,taps,pending:!!session&&!session.committed,action,pointers:[...pointers.values()].map(p=>({x:p.x,y:p.y})),lastTap};
      taps=0;return out;
    },
    get active(){return pointers.size>0;},
  };
}

// Map a client-space point to the 640x480 logical board, or null outside the canvas.
export function clientToLogical(rect,x,y){
  if(!rect||!(rect.width>0&&rect.height>0))return null;
  const lx=(x-rect.left)*640/rect.width,ly=(y-rect.top)*480/rect.height;
  return lx<0||ly<0||lx>640||ly>480?null:{x:lx,y:ly};
}
