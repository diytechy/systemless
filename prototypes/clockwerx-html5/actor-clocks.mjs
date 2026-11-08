// Canonical WATimer latch. Upstream values are scalable MT client counts,
// not guest ticks. Sprite callbacks consume this latch's delta, not the
// private difference since an actor was last processed while frozen.
const normal=[2,2,8,4,8,1],slow=[2,4,16,8,16,2],multipliers=[1,1,3,1,1,1];
export function createActorClocks(upstreamReference=0){
 if(!Number.isInteger(upstreamReference)||upstreamReference<0)throw new RangeError('Nonnegative upstream count required');
 const classes=normal.map((divisor,index)=>({count:0,delta:0,remainder:0,divisor,multiplier:multipliers[index],normalDivisor:divisor,slowDivisor:slow[index]}));
 let reference=upstreamReference;
 const snapshot=()=>({upstreamReference:reference,classes:classes.map(c=>({...c}))});
 return {
  latch(upstreamCount){
   if(!Number.isInteger(upstreamCount)||upstreamCount<reference)throw new RangeError('Monotonic upstream count required');
   const requested=upstreamCount-reference,cap=3*classes[0].divisor-1-classes[0].remainder,used=Math.min(requested,cap);
   for(const c of classes){
    const before=c.count;c.remainder+=used*c.multiplier;
    while(c.remainder>=c.divisor){c.remainder-=c.divisor;c.count++;}
    c.delta=c.count-before;
   }
   reference=upstreamCount;return {...snapshot(),requested,used,discarded:requested-used};
  },
  setSlowdown(enabled){
   if(typeof enabled!=='boolean')throw new TypeError('Boolean slowdown required');
   for(let i=1;i<classes.length;i++)classes[i].divisor=enabled?classes[i].slowDivisor:classes[i].normalDivisor;
  },
  snapshot
 };
}
