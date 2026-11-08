// Generic, deterministic atlas-particle ring. Artwork and title-specific values
// are supplied by the private manifest; particles retain their birth position.
export function createSparkles({offsets,frameCount,frameSeconds,spawnFrame,direction=1}) {
  if (!Array.isArray(offsets)||!offsets.length||offsets.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))) throw new TypeError('Invalid offsets');
  if (!Number.isInteger(frameCount)||frameCount<1||!Number.isFinite(frameSeconds)||frameSeconds<=0||!Number.isInteger(spawnFrame)||spawnFrame<1||spawnFrame>=frameCount||![-1,1].includes(direction)) throw new RangeError('Invalid lifecycle');
  const positions=offsets.map(p=>[...p]), interval=spawnFrame*frameSeconds,lifetime=frameCount*frameSeconds;
  let time=0,nextBirth=interval,index=0,sequence=0,particles=[],enabled=true;
  const validate=anchor=>{if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y))throw new TypeError('Invalid anchor');};
  function spawn(anchor,born){const [x,y]=positions[index];particles.push({id:sequence++,x:anchor.x+x,y:anchor.y+y,born});index=(index+direction+positions.length)%positions.length;}
  return {
    reset(anchor){validate(anchor);time=0;nextBirth=interval;index=0;sequence=0;particles=[];enabled=true;spawn(anchor,0);},
    stopSpawning(){enabled=false;},
    update(dt,anchor){
      if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid elapsed time');
      validate(anchor);if(dt===0)return;
      time+=dt;
      // Skip already-expired births after a large time jump without allocating
      // them. All births use the explicit anchor supplied for this update.
      const skip=Math.max(0,Math.floor((time-lifetime-nextBirth)/interval)+1);
      if(enabled&&skip){nextBirth+=skip*interval;index=(index+direction*(skip%positions.length)+positions.length)%positions.length;sequence+=skip;}
      while(enabled&&nextBirth<=time+1e-10){spawn(anchor,nextBirth);nextBirth+=interval;}
      particles=particles.filter(p=>time-p.born<lifetime-1e-10);
    },
    snapshot(){return particles.map(({id,x,y,born})=>({id,x,y,frame:Math.min(frameCount-1,Math.floor((time-born+1e-10)/frameSeconds))}));}
  };
}
