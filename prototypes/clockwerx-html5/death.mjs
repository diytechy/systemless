import {createSourceTimerChain} from './hazards.mjs';

const integer = (value, name, minimum=0) => {
  if (!Number.isSafeInteger(value) || value < minimum) throw new RangeError(`Invalid ${name}`);
  return value;
};

/** Keep this unscaled clock alive between effects. Advance once per simulation
 * pass, including passes with no death. Its phase is not reset on respawn.
 */
export function createDeathClock() {
  const timer=createSourceTimerChain(40,2);
  let guestTick=0, clientCount=0;
  return {
    advance(elapsedTicks) {
      integer(elapsedTicks,'elapsed guest ticks');
      guestTick+=elapsedTicks;
      clientCount=timer.advance(elapsedTicks).clientCount;
      return this.snapshot();
    },
    snapshot(){return {guestTick,clientCount};}
  };
}

/** Stationary, delayed atlas bursts sampled along an integer hand vector.
 * Source-style geometry truncates the endpoint BEFORE its random percentage.
 * Supply the original 64-frame index, not an interpolated render angle.
 * RNG is explicit: one unsigned 16-bit position draw then one delay draw for
 * each particle. Snapshot x/y are logical particle anchors; atlas descriptors
 * supply their own per-frame offsets. No artwork or resource tables live here.
 *
 * The caller owns the shared clock. With advanceClock=true, update advances it;
 * otherwise advance it before update. A pass observes at most one animation
 * event, even when several clock counts elapsed. This matches sprite callbacks.
 */
export function createDeathEffect({pivot,frame,randomUnsigned,clock,
  advanceClock=true,particleCount=15,frameCount=10,reach=48,
  positionModulo=100,delayModulo=60}={}) {
  if (!pivot || !Number.isInteger(pivot.x) || !Number.isInteger(pivot.y))
    throw new TypeError('Integer logical pivot required');
  integer(frame,'source frame');
  if(frame>63)throw new RangeError('Source frame must be in 0..63');
  for(const [name,value] of Object.entries({particleCount,frameCount,reach,positionModulo,delayModulo}))
    integer(value,name,1);
  if(typeof randomUnsigned!=='function' || typeof clock?.snapshot!=='function' || typeof clock?.advance!=='function')
    throw new TypeError('Explicit unsigned RNG and persistent death clock required');
  const sample=()=>integer(randomUnsigned(),'unsigned random value');
  const draw=()=>{const n=sample();if(n>65535)throw new RangeError('RNG must return an unsigned 16-bit value');return n;};
  const angle=frame*Math.PI*2/64;
  // Cardinal values are exact in the source model; avoid floating point dust.
  const trunc=n=>Math.abs(n)<1e-10?0:Math.trunc(n);
  const dx=trunc(reach*Math.cos(angle)),dy=trunc(reach*Math.sin(angle));
  const initial=clock.snapshot();
  let reference=initial.clientCount, heroVisible=true;
  let particles=Array.from({length:particleCount},(_,id)=>{
    const percent=draw()%positionModulo;
    return {id,x:pivot.x+trunc(dx*percent/positionModulo),y:pivot.y+trunc(dy*percent/positionModulo),
      startTick:initial.guestTick+draw()%delayModulo,frame:0,waiting:true};
  });
  return {
    update(elapsedTicks) {
      integer(elapsedTicks,'elapsed guest ticks');
      const current=advanceClock?clock.advance(elapsedTicks):clock.snapshot();
      if(current.clientCount===reference)return;
      reference=current.clientCount;
      particles=particles.filter(p=>{
        if(p.waiting){
          // Strictly greater: delay zero still waits for a later clock pass.
          if(current.guestTick>p.startTick)p.waiting=false;
          return true;
        }
        if(p.frame===frameCount-1){heroVisible=false;return false;}
        p.frame++;
        return true;
      });
    },
    get complete(){return particles.length===0;},
    get heroVisible(){return heroVisible;},
    get remaining(){return particles.length;},
    snapshot(){return particles.filter(p=>!p.waiting).map(({id,x,y,frame})=>({id,x,y,frame}));}
  };
}
