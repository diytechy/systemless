import {validateConnectorBoard} from './sliding.mjs';
import {assertClosedMovingProgram} from './moving-dots.mjs';
import {bombHitsStationarySpike} from './bombs.mjs';
const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const hash=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const wordsHex=words=>words.map(w=>w.toString(16).padStart(4,'0')).join('');

// Explicit imported-source exception. Effective0 is the retained clone frame;
// authored169 and its byte/hash provenance stay separate. No modulo rule and
// no normalization of generated/direct default-invalid GO declarations.
export function importMovingGoodie(record,source,{allowImportedGoodie169=false}={}){
 const w=record?.rawWords;if(!Array.isArray(w)||w.length!==5||w.some(n=>!integer(n,0,65535)))throw new TypeError('Original version12 GO words required');
 const base={row:w[0],column:w[1],initialFrame:w[2],activationMask:w[3]*65536+w[4]};
 if(w[2]<17)return base;
 if(w[2]!==169||allowImportedGoodie169!==true||!hash(source?.sha256)||!integer(source?.byteLength,10,0x7fffffff)||!integer(record.offset,0,source.byteLength-10)||record.byteLength!==10||record.rawHex!==wordsHex(w))throw new Error('Qualified imported GO169 bytes/hash required; generated frames remain0..16');
 return {...base,initialFrame:0,sourceInitialFrameRequest:169,sourceInitialFrameIgnored:true,sourceImport:{sha256:source.sha256,byteLength:source.byteLength,resourceId:source.resourceId,offset:record.offset,rawHex:record.rawHex}};
}

export function assertMovingGoodie(g,source,{allowImportedGoodie169=false}={}){
 if(!integer(g?.row,0,7)||!integer(g?.column,0,10)||!integer(g?.initialFrame,0,16))throw new Error('Effective source GO frame0..16 and grid required');
 if(g.sourceInitialFrameRequest===undefined){if(g.sourceInitialFrameIgnored||g.sourceImport)throw new Error('Unexpected ignored GO provenance');return true;}
 const p=g.sourceImport;
 if(g.sourceInitialFrameRequest!==169||g.sourceInitialFrameIgnored!==true||g.initialFrame!==0||allowImportedGoodie169!==true||!hash(source?.sha256)||!hash(p?.sha256)||p.sha256!==source.sha256||p.byteLength!==source.byteLength||p.resourceId!==source.resourceId||!integer(p.offset,0,p.byteLength-10)||!(/^[0-9a-f]{20}$/.test(p.rawHex)))throw new Error('Explicit matching imported GO169 source provenance required');
 const words=Array.from({length:5},(_,i)=>parseInt(p.rawHex.slice(i*4,i*4+4),16));
 if(words[0]!==g.row||words[1]!==g.column||words[2]!==169||words[3]*65536+words[4]!==g.activationMask)throw new Error('Imported GO169 raw/effective declaration mismatch');return true;
}

export function assertMovingBombScope({origin,dots=[],actors=[],connectors=[],bombs=[],goodies=[],spikes=[],activeSections={},sourceProvenance,allowImportedGoodie169=false,initial=false,humanStarts}={}){
 if(!Array.isArray(dots)||!dots.length||!Array.isArray(actors)||!Array.isArray(bombs)||!bombs.length||!Array.isArray(goodies)||!goodies.length||!dots.some(d=>d.motion==='moving-program')||!dots.some(d=>d.motion==='moving-program'&&d.protected))throw new Error('Separate moving/BO/staticEX/GO/protection inventory required');
 if(origin?.x!==74||origin?.y!==72)throw new Error('Moving composition requires serialized large-grid origin74/72');
 if(!Array.isArray(spikes)||!spikes.length)throw new Error('Actual nonempty source SP declarations required');
 for(const s of spikes){if(!integer(s?.row,0,7)||!integer(s?.column,0,10))throw new Error('Actual source SP grid declarations required');bombHitsStationarySpike(s,s);}
 validateConnectorBoard(connectors,dots);
 let previous=-1;const slots=new Set();
 for(const d of dots){
  const moving=d.motion==='moving-program';
  if(!integer(d.sourceIndex,0,87)||d.sourceIndex<=previous||d.sourceIndex!==d.row*11+d.column||slots.has(d.id)||!integer(d.row,0,7)||!integer(d.column,0,10)||!Number.isInteger(d.x)||!Number.isInteger(d.y)||d.present!==true||d.humanCanGrab!==true||d.nonhumanCanGrab!==true||!integer(d.color,0,2)||!['static','moving-program'].includes(d.motion)||d.motionType!==(moving?1:0)||moving&&(typeof d.movingProgram!=='string'||!d.movingProgram.length||d.movingProgram.length>127||!/^[npswe]+$/.test(d.movingProgram)||d.sourceInBackground!==false||d.slideMask||d.bonus||d.kind!=='dot')||!moving&&d.movingProgram||d.teleport!==false||d.ring||d.waystation||d.upDown||d.transferDeath||d.slowdown||d.connector||d.sourceBombDynamic||['bonus','protected','sourceInBackground','sourceCollidable'].some(k=>typeof d[k]!=='boolean')||d.protected&&(!moving||d.color!==0||d.kind!=='dot'||d.bonus)||initial&&d.burnt)throw new Error('Qualified ordinary movers/static colored dots and protected plain white mover required');
  if(d.sourceInitialPosition?.x!==origin.x+48*d.column||d.sourceInitialPosition?.y!==origin.y+48*d.row)throw new Error('Immutable source initial position must equal serialized grid');
  if(initial&&(d.x!==d.sourceInitialPosition.x||d.y!==d.sourceInitialPosition.y))throw new Error('Source initial moving/static positions required');
  if(!['dot','bonus','goal'].includes(d.kind)||!integer(d.cell,0,65535)||!!(d.cell&2)!==d.bonus||!!(d.cell&4)!==(d.kind==='goal')||d.kind==='bonus'&&!d.bonus||d.kind==='dot'&&d.bonus)throw new Error('Source dot/bonus/goal kind and live cell state must agree');
  if(moving)assertClosedMovingProgram(d.movingProgram,d.sourceInitialPosition);
  previous=d.sourceIndex;slots.add(d.id);
 }
 for(const e of connectors)if(typeof e.sourceInitialBonus!=='boolean'||e.sourceHasSprite!==e.sourceInitialBonus||typeof e.bonus!=='boolean'||typeof e.burnt!=='boolean'||initial&&(e.sourceInitialBonus!==e.bonus||e.burnt)||[e.first,e.second].some(id=>{const d=dots.find(d=>d.id===id);return d.protected||d.kind==='goal';}))throw new Error('Immutable source EX initial bonus/sprite identity and ordinary static endpoints required');
 for(const b of bombs){const w=b.rawWords,kind=w?.[2]??b.kind,flags=w?(w[3]>>>8):b.flags;if(!integer(kind,0,13)||kind>=10&&flags!==0)throw new Error('Moving BO composition requires human-only starters');}
 for(const g of goodies)assertMovingGoodie(g,sourceProvenance,{allowImportedGoodie169});
 previous=-1;
 for(const a of actors){const human=[0,6].includes(a.sourceActorType),d=dots.find(d=>d.id===a.pivot);if(!d||!integer(a.sourceSlot,0,30)||a.sourceSlot<=previous||human!==(a.sourceSlot<2)||(human?a.speedClass!==0:![1,2].includes(a.sourceActorType)||a.speedClass!==1||a.checksWalls!==false||a.program!==null&&(typeof a.program!=='string'||!a.program.length||!/^[bfn]+$/.test(a.program)||!integer(a.sourcePC,1,a.program.length)))||initial&&!human&&d.motion!=='static')throw new Error('Moving BO requires class0 humans and ordinary class1 kinds1/2 free/b/f/n PC1 NPCs');previous=a.sourceSlot;}
 if(initial&&(!Array.isArray(humanStarts)||humanStarts.length!==2||humanStarts.some(id=>{const d=dots.find(d=>d.id===id);return !d||d.motion!=='moving-program'||!d.protected||d.bonus||d.kind!=='dot';})))throw new Error('Both source humans must start on a protected ordinary mover');
 for(const[k,n]of Object.entries(activeSections))if(!integer(n,0,0x7fffffff)||n&&!['SP','BO','GO','EX','WP','WA','TX'].includes(k))throw new Error('Unqualified moving BO section '+k);
 for(const[k,n]of Object.entries({BO:bombs.length,GO:goodies.length,EX:connectors.length,SP:spikes.length}))if(activeSections[k]!==undefined&&activeSections[k]!==n)throw new Error('Matching moving BO inventory required');return true;
}
