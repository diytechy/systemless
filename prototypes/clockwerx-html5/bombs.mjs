// Bounded bomb source contracts. The scene adapter owns the
// persistent MT clock, sprite traversal, RAW outlines and synchronous effects.
export const BOMB_LIMITS=Object.freeze({fuses:60,matches:5,sparks:17,explosions:6,goodies:15});
function integer(n,min=0,max=0x7fffffff) {
  if(!Number.isInteger(n)||n<min||n>max) throw new RangeError('Invalid source integer');
  return n;
}
export function decodeBombRecord(record) {
  const w=record?.rawWords;
  if(!Array.isArray(w)||w.length!==4) throw new TypeError('Expected four version6+ BO words');
  w.forEach(n=>integer(n,0,65535));integer(w[0],0,7);integer(w[1],0,10);integer(w[2],0,13);
  return {row:w[0],column:w[1],kind:w[2],flags:w[3]>>>8,padding:w[3]&255,
    role:w[2]<4?'bomb':w[2]<10?'fuse':'match'};
}

/** Match ignition consumes the match even if the synchronous spark allocator
 * has no free slot. Nonhuman callers require any nonzero BO flags byte. */
export function createBombMatch({kind,flags=0,index=0}) {
  integer(kind,10,13);integer(flags,0,255);integer(index,0,59);
  let armed=true;
  return {
    snapshot:()=>({armed,visible:armed}),
    reset(){armed=true;},
    ignite({human,onSpark=()=>{}}={}) {
      if(typeof human!=='boolean'||typeof onSpark!=='function') throw new TypeError('Expected human flag and synchronous allocator');
      if(!armed||(!human&&!flags)) return [];
      const event={type:'spark',index,entryLeg:[4,8,1,2][kind-10]};
      onSpark(event); // Source SRActivate precedes LI hide, sound11 and disarm.
      armed=false;
      return [event,{type:'hide-match'},{type:'sound',id:11}];
    },
  };
}

/** Advance a single explosion at its place in SU traversal, never a whole pool
 * snapshot. onEffect runs before the descriptor frame commits. Returned events
 * are diagnostics and must not be dispatched a second time. */
export function createExplosionPool() {
  const slots=Array.from({length:6},()=>({visible:false,inserted:false,frame:0,count:0,grid:null}));
  return {
    snapshot:()=>slots.map(s=>({...s,grid:s.grid&&{...s.grid}})),
    reset(){for(const s of slots)s.visible=false;},
    activate(grid,count) {
      integer(grid?.row,0,6);integer(grid?.column,0,9);integer(count);
      const events=[{type:'sound',id:12}];
      const index=slots.findIndex(s=>!s.visible);
      if(index<0) return {index,events};
      const s=slots[index];Object.assign(s,{visible:true,frame:0,count,grid:{...grid}});
      if(!s.inserted) {s.inserted=true;events.push({type:'append-sprite',layer:2,index});}
      return {index,events};
    },
    observe(index,count,{onEffect=()=>{}}={}) {
      integer(index,0,5);integer(count);
      if(typeof onEffect!=='function') throw new TypeError('Expected synchronous effect handler');
      const s=slots[index],events=[];
      if(!s.visible||count===s.count)return events;
      s.count=count; // Coalesce all missed counts into one callback.
      const next=s.frame+1,descriptorFrame=s.frame;
      const emit=(type,target)=>{
        const event={type,...(target?{target}:{}),index,callbackFrame:next,descriptorFrame,grid:{...s.grid}};
        events.push(event);onEffect(event);
      };
      if(next>=3&&next<=10) {
        if(next===3)for(const target of ['SP','DS','EL','GN','TR','WL','DO'])emit('stationary',target);
        for(const target of ['DO','DP','WA'])emit('moving',target);
      }
      if(next===4) {
        emit('paint-crater');emit('stationary','DO');
        // WLAnnihilateSprites is an empty source function.
      } else if(next>=10) {s.visible=false;emit('hide');}
      s.frame=Math.min(next,9); // Ten is a callback sentinel, not an image.
      return events;
    },
  };
}

/** GO is a score/time goodie, not match inventory. Hiding is deferred until the
 * flourish completion callback; its collected latch prevents double awards. */
export function createBombGoodie() {
  let collected=false,visible=true;
  return {
    snapshot:()=>({collected,visible}),
    reset(){collected=false;visible=true;},
    finishFlourish(){visible=false;},
    collect(actorIndex) {
      integer(actorIndex,0,31);
      if(collected)return [];
      collected=true;
      return [{type:'sound',id:22},{type:'flourish'},{type:'floating-score',points:1000},
        {type:'add-time',seconds:10},{type:'add-bonus',actorIndex,points:1000}];
    },
  };
}
