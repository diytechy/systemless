// Separate default-off ordinary moving DO / BO-GO-WY-WL-SPI composition.
// No private map, ordinal, coordinates, resource hash or exact count allowlist.
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {compileWallTiles,validateBombWallTiles} from './walls.mjs';
import {decodeBombRecord,BOMB_LIMITS} from './bombs.mjs';
import {sourceDotPaint,sourceGoalPaint} from './sliding-bomb-paint.mjs';
import {importMovingGoodie} from './moving-bombs.mjs';
const fail=()=>{throw new Error('Separate moving DO/BO/GO/WY/WL/SPI source composition required');};
const int=(n,a=0,b=65535)=>Number.isInteger(n)&&n>=a&&n<=b;
const word=n=>n.toString(16).padStart(4,'0'),signed=n=>n>32767?n-65536:n;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rec=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const immutable=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))immutable(v);Object.freeze(o);}return o;};
function words(s,r,n){if(!Array.isArray(r?.rawWords)||r.rawWords.length!==n||r.rawWords.some(x=>!int(x))||r.byteLength!==n*2||!int(r.offset,8,s.byteLength-n*2)||r.rawHex!==r.rawWords.map(word).join(''))fail();return r.rawWords;}
const wallTiles=s=>compileWallTiles(rec(s,'WL').map(r=>{const w=r.rawWords;return{axis:w[0]>>>8,fixed:signed(w[1]),start:signed(w[2]),startInset:signed(w[3]),end:signed(w[4]),endInset:signed(w[5])};})).map((t,id)=>({id,...t,x:74+t.column*48,y:72+t.row*48}));
const required=['allowMovingDots','allowBombs','allowGoodies','allowBombObjectInteractions','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowInactiveSpikes','allowRotatingSpikes','allowClass3RotatingSpikes','allowImportedGoodie169'];
export function assertMovingBombSpikeWaystationRecipe(options){
 if(options.allowMovingBombSpikeWaystation!==true||(options.activeMask??1)!==1||required.some(k=>options[k]!==true))fail();
 for(const[k,v]of Object.entries(options))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingBombSpikeWaystation'&&!required.includes(k))fail();return true;
}
export function assertMovingBombSpikeWaystationSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.header.serializedRows!==8||s.header.serializedColumns!==11||s.header.displayRows!==8||s.header.displayColumns!==11||!int(s.header.timeLimitRaw)||!int(s.byteLength,8,0x7fffffff)||!int(s.resourceId,-32768,32767)||!/^[0-9a-f]{64}$/.test(s.sha256)||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const kinds=new Set();for(const b of s.blocks){if(kinds.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!['BO','GO','WY','WL','SP','PU','WP','WA'].includes(b.kind))fail();kinds.add(b.kind);}
 let end=8,goals=0,movers=0,wyCount=0,bonuses=0;
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.offset!==end||!int(c.flagsRaw)||!int(c.secondaryRaw)||c.present!==!!(c.flagsRaw&1)||!int(c.byteLength,4,260)||c.rawHex!==word(c.flagsRaw)+word(c.secondaryRaw)+(c.inlineProgram?.rawHex??'')||c.byteLength!==c.rawHex.length/2||c.offset+c.byteLength>s.byteLength||c.flagsRaw&~0x409f)fail();end+=c.byteLength;
  if(!c.present){if(c.flagsRaw||c.inlineProgram)fail();continue;}
  const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),color=dotColorOffset(c.secondaryRaw),moving=!!(e&0x80);
  if(e&8||e&0x10&&((e&~0x4000)!==0x11||color!==0)||e&4&&(moving||e&2||color!==0)||moving&&(e&~0x4000)!==0x81)fail();
  if(e&4)goals++;if(e&2)bonuses++;if(e&0x10)wyCount++;
  if(moving){movers++;movingProgramCell(c);assertClosedMovingProgram(c.inlineProgram.text,{x:74+48*c.column,y:72+48*c.row});}else if(c.inlineProgram)fail();
 }
 if(goals!==1||movers!==1||!wyCount||!bonuses)fail();
 const dotAt=(row,col)=>s.cells.find(c=>c.present&&c.row===row&&c.column===col);
 let activeSP=0;for(const r of rec(s,'SP')){const w=words(s,r,6),mask=w[4]*65536+w[5];if(w[0]>7||w[1]>10||w[2]>3||w[3]>3)fail();if(mask&1){if(mask!==15||w[2]!==2&&w[3]!==2||++activeSP>32)fail();}}if(!activeSP)fail();
 for(const r of rec(s,'PU')){const w=words(s,r,5);if(w[0]>7||w[1]>10||w[2]>3||(w[3]*65536+w[4])&1)fail();}
 let starters=0;const bs=rec(s,'BO');if(!bs.length||bs.length>BOMB_LIMITS.fuses)fail();for(const r of bs){words(s,r,4);const b=decodeBombRecord(r);if(b.kind>=10&&(b.flags||++starters>BOMB_LIMITS.matches))fail();if(b.kind<4&&(b.row>6||b.column>9))fail();}if(!starters)fail();for(let i=0;i<bs.length;i++)if(bs[i].rawWords[2]>=10&&!bs.slice(i+1).some(r=>r.rawWords[2]<4))fail();
 let gs=0;for(const r of rec(s,'GO')){const w=words(s,r,5);if(w[0]>7||w[1]>10)fail();if((w[3]*65536+w[4])&1){importMovingGoodie(r,s,{allowImportedGoodie169:true});gs++;}}if(!gs||gs>BOMB_LIMITS.goodies)fail();
 const wys=new Set();for(const r of rec(s,'WY')){const w=words(s,r,6);if(!((w[4]*65536+w[5])&1))continue;const c=dotAt(w[0],w[1]);if(!c||wys.has(c.index)||(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1)&~0x4000)!==0x11||w[2]>31||![-1,1].includes(signed(w[3])))fail();wys.add(c.index);}if(wys.size!==wyCount)fail();
 if(!rec(s,'WL').length)fail();for(const r of rec(s,'WL'))words(s,r,6);validateBombWallTiles(wallTiles(s));
 const ps=rec(s,'WP').map(r=>{const t=r.text,byteLength=1+(t?.length??0);if(typeof t!=='string'||!t.length||t.length>255||Object.hasOwn(r,'byteLength')&&r.byteLength!==byteLength||r.paddingHex!==''||!int(r.offset,8,s.byteLength-byteLength)||r.rawHex!==t.length.toString(16).padStart(2,'0')+[...t].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))fail();return t;});
 let slot=0,ordinary=0,orbital=0;for(const r of rec(s,'WA')){const w=words(s,r,11),type=w[2],ref=signed(w[5]);if(r.actorTypeRaw!==type||r.activationMaskRaw!==w[8]*65536+w[9]||r.programReferenceRaw!==ref||r.version12ByteRaw!==w[10]>>>8||r.initialFrameHalfIndexRaw!==signed(w[3])||r.gridPosition?.row!==w[0]||r.gridPosition.column!==w[1])fail();if(!(r.activationMaskRaw&1))continue;
  const human=slot<2,t=ref<0?null:ps[ref],c=dotAt(w[0],w[1]);if(!c||ref < -1||![-1,1].includes(signed(w[4]))||human&&(type!==[0,6][slot]||w[7]!==0||ref!==-1||r.version12ByteRaw!==1||effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1)&0x9e)||!human&&(r.version12ByteRaw!==0||!([1,2].includes(type)&&w[7]===1&&(t===null||/^[fns]+$/.test(t)&&int(w[6],1,t.length))||type===4&&w[7]===3&&t===null&&!(c.flagsRaw&0x80))))fail();if(!human){if(type===4)orbital++;else ordinary++;}slot++;
 }if(slot>31||slot<4||!ordinary||!orbital)fail();return true;
}
export function movingBombSpikeWaystationSource(level){assertMovingBombSpikeWaystationSource(level);return immutable(structuredClone({structuralStatus:level.structuralStatus,header:level.header,sha256:level.sha256,byteLength:level.byteLength,resourceId:level.resourceId,cells:level.cells,blocks:level.blocks,spikes:rec(level,'SP').map(r=>({offset:r.offset,rawHex:r.rawHex,rawWords:[...r.rawWords]}))}));}
export function assertMovingBombSpikeWaystationActor(a){
 if(!a||!int(a.sourceSlot,0,30)||a.sourceSlot===1||![-1,1].includes(a.direction)||typeof a.visible!=='boolean'||typeof a.orphaned!=='boolean'||a.sliding)fail();
 const human=a.sourceSlot===0;if(human){if(a.sourceActorType!==0||a.speedClass!==0||a.checksWalls!==true||a.program!==null||![700,4300].includes(a.group))fail();}
 else if(a.canonicalFrame!==true||!int(a.frame,0,63)||!Number.isInteger(a.unwrappedFrame)||(a.unwrappedFrame&63)!==a.frame||a.checksWalls!==false||!([1,2].includes(a.sourceActorType)&&a.speedClass===1&&a.group===({1:500,2:4400}[a.sourceActorType])&&(a.program===null||/^[fns]+$/.test(a.program)&&int(a.sourcePC,1,a.program.length))||a.sourceActorType===4&&a.speedClass===3&&a.group===3500&&a.program===null&&!a.movingPivot))fail();return true;
}
const excluded=['movingSpikeRules','movingBombRules','staticSlidingBombGoodieRules','slidingConnectorRules','slidingBombRules','slidingBombCheckpointRules','slidingGoodieRules','slidingGoodieProgramRules','slidingOilRules','slidingOilGoodieRingRules','staticSlidingProgramRules','slidingTeleportRules','movingMarkedOrdinaryRules','staticMarkedOrbitalRules','markedTransferRules','movingMarkedGoalRules','movingMarkedBonusRules','movingCheckpointRingRules','movingElevatorRules','pilotAbsentSlideRecoveryRules','combinedGoalBonusRules','teleportRules','elevatorRules','canonicalOilRules','canonicalOilSpikeRules','bombOilElevatorRules','elevatorOilSpikeRules','elevatorGoodieRules','coloredElevatorGoodieRules','staticEnemyWallRules','goodieOnlyRules','fastRotatingSpikeRules','slowRotatingSpikeRules','class2RotatingSpikeRules','rotatingSpikeTransferRules','rotatingSpikeBounceRules'];
export function assertMovingBombSpikeWaystationScope(b,{initial=false,actors=[b?.player,...(b?.enemies??[])]}={}){
 if(b?.movingBombSpikeWaystationRules!==true||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||b.radius!==48||b.distanceTolerance!==1||b.handOffsetY!==1||!['movingDotRules','bombRules','bombObjectInteractionRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','sourceDotPermissions','rotatingSpikeRules','class3RotatingSpikeRules','importedGoodie169Rules'].every(k=>b[k]===true)||excluded.some(k=>b[k]))fail();
 for(const k of ['connectors','doors','switches','puddles','elevators','teleports','guns','triggers'])if(!Array.isArray(b[k])||b[k].length)fail();
 const s=b.movingBombSpikeWaystationSource;assertMovingBombSpikeWaystationSource(s);if(!same(b.sourceGrid,{version:12,displaySizeRaw:8,rows:8,columns:11})||b.resourceId!==s.resourceId||b.timeLimit!==s.header.timeLimitRaw||!same(b.sourceProvenance,{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId})||!same(s.spikes,rec(s,'SP').map(r=>({offset:r.offset,rawHex:r.rawHex,rawWords:r.rawWords}))))fail();
 const cs=s.cells.filter(c=>c.present);if(b.dots?.length!==cs.length||!same(b.bombs,rec(s,'BO')))fail();
 for(const[i,d]of b.dots.entries()){const c=cs[i],e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),moving=!!(e&0x80),point={x:74+48*c.column,y:72+48*c.row};if(d.id!==`${c.column},${c.row}`||d.sourceIndex!==c.index||d.row!==c.row||d.column!==c.column||d.flags!==c.secondaryRaw||d.color!==dotColorOffset(c.secondaryRaw)||d.motion!==(moving?'moving-program':'static')||d.motionType!==(moving?1:0)||!same(d.sourceInitialPosition,point)||!int(d.x,-32768,32767)||!int(d.y,-32768,32767)||(initial||!moving)&&(d.x!==point.x||d.y!==point.y)||d.cell!==(d.bonus?e:e&~2)||d.kind!==(e&4?'goal':d.bonus?'bonus':'dot')||d.bonus!==!!(d.cell&2)||d.sourceInitialBonus!==!!(e&2)||d.sourceInBackground!==(!moving&&!(e&0x1e))||d.sourceHasSprite!==!d.sourceInBackground||d.present!==true||d.humanCanGrab!==true||d.nonhumanCanGrab!==true||d.sourceCollidable!==true||d.teleport!==false||d.slideMask!==0||d.ring!==false||d.protected!==false||d.transferDeath!==false||d.upDown||d.slowdown||d.sourceBombDynamic||initial&&(d.bonus!==!!(e&2)||d.burnt||d.collected))fail();
  if(moving){if(d.movingProgram!==c.inlineProgram.text||!same(d.sourceMovingProgram,{offset:c.inlineProgram.offset,rawHex:c.inlineProgram.rawHex,paddingHex:c.inlineProgram.paddingHex}))fail();}else if(d.movingProgram||d.sourceMovingProgram)fail();
  const wy=rec(s,'WY').find(r=>r.rawWords[0]===c.row&&r.rawWords[1]===c.column&&((r.rawWords[4]*65536+r.rawWords[5])&1));if(!same(d.waystation,wy?{halfIndex:wy.rawWords[2],direction:signed(wy.rawWords[3])}:undefined))fail();
 }
 const ss=rec(s,'SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&1);if(b.spikes?.length!==ss.length)fail();for(const[i,p]of b.spikes.entries()){const w=ss[i].rawWords,q=spikeGridPoint(ss[i],b.origin);if(p.id!==i||p.row!==w[0]||p.column!==w[1]||p.subrow!==w[2]||p.subcolumn!==w[3]||p.phase!==i%4||p.activationMask!==w[4]*65536+w[5]||p.x!==q.x||p.y!==q.y||typeof p.visible!=='boolean'||initial&&!p.visible)fail();}
 const gs=rec(s,'GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&1);if(!same(b.goodies,gs.map(r=>importMovingGoodie(r,s,{allowImportedGoodie169:true}))))fail();validateBombWallTiles(b.walls);const ws=wallTiles(s);if(b.walls.length!==ws.length||b.walls.some((w,i)=>!same(Object.fromEntries(Object.keys(ws[i]).map(k=>[k,w[k]])),ws[i]))||initial&&!same(b.walls,ws))fail();
 const wa=rec(s,'WA'),active=wa.filter(r=>r.activationMaskRaw&1),ps=rec(s,'WP');if(!Array.isArray(actors)||!actors.length||initial&&actors.length!==active.length-1||!same(b.movingHumanStarts,active.slice(0,2).map(r=>`${r.gridPosition.column},${r.gridPosition.row}`))||b.movingHumanStarts[0]!==b.movingHumanStarts[1])fail();let previous=-1;
 for(const a of actors){assertMovingBombSpikeWaystationActor(a);const r=active[a.sourceSlot],ref=r?.programReferenceRaw,text=ref>=0?ps[ref]?.text:null,timing=actorTiming(r?.rawWords[7]);if(a.sourceSlot<=previous||!r||a.sourceRawRecord!==wa.indexOf(r)||a.sourceProgramReference!==ref||a.sourceActorType!==r.actorTypeRaw||a.program!==text||a.speedClass!==r.rawWords[7]||a.divisor!==timing.divisor||a.multiplier!==timing.multiplier||!b.dots.some(d=>d.id===a.pivot)||text!==null&&!same(a.sourceStaticProgram,ps[ref])||text===null&&a.sourceStaticProgram!==undefined||initial&&(a.pivot!==`${r.gridPosition.column},${r.gridPosition.row}`||a.direction!==signed(r.rawWords[4])||a.angle!==actorInitialFrame(r.initialFrameHalfIndexRaw)*Math.PI*2/64||text!==null&&a.sourcePC!==r.rawWords[6]))fail();previous=a.sourceSlot;}return true;
}
export function assertMovingBombSpikeWaystationPhysics(b,outlines,dots,bombs){
 assertMovingBombSpikeWaystationScope(b,{initial:true});for(const g of new Set([700,4300,...b.enemies.map(a=>a.group)]))for(let f=0;f<64;f++)if(!outlines?.groups?.[g]?.frames?.[f]?.rows)fail();
 for(const[g,frames]of [[200,[0,1,2,3]],[800,b.walls.map(w=>w.frame)]])for(const f of frames)if(!outlines?.groups?.[g]?.frames?.[f]?.rows)fail();
 for(const f of new Set([...b.dots.flatMap(d=>[1+d.color,9+d.color,92+d.color]),...Array.from({length:11},(_,i)=>79+i)]))if(!dots?.groups?.[300]?.frames?.[f]?.rows)fail();
 for(const[g,n]of [[1600,18],[1500,12],[1800,10],[1900,17]])for(let f=0;f<n;f++)if(!bombs?.groups?.[g]?.frames?.[f]||bombs.groups[g].frames[f].outlineIndex!==-1&&!bombs.groups[g].frames[f].rows)fail();return true;
}

export function validateMovingBombSpikeWaystationAssets(b,assets){
 assertMovingBombSpikeWaystationScope(b,{initial:true});
 for(const d of b.dots)for(const group of ['300','4100'])for(const frame of [9+d.color,92+d.color,...(d.sourceInitialBonus?[1+d.color]:[]),...(d.waystation?Array.from({length:11},(_,i)=>79+i):[])])sourceDotPaint(assets,group,frame);
 for(let f=17;f<=22;f++)sourceGoalPaint(assets,f);
 for(let f=0;f<4;f++){const a=assets?.spikes?.frames?.[f];if(!a||a.sourceGroup!==200||a.sourceFrame!==f||typeof a.file!=='string'||!a.file||!['x','y','width','height'].every(k=>Number.isInteger(a[k]))||a.width<=0||a.height<=0)fail();}
 for(const f of new Set([...b.walls.map(w=>w.frame),2,3,4]))if(!assets?.walls?.frames?.some(a=>a.frame===f))fail();
 for(const[g,n]of [[1400,15],[1500,12],[1600,18],[1800,10],[1900,17]])for(let f=0;f<n;f++)if(!assets?.bombs?.[g]?.frames?.some(a=>a.frame===f))fail();
 const a=assets?.rotatingSpikes;if(!a||a.sourceGroup!==3500||typeof a.file!=='string'||!a.file||!['radius','x','y','width','height'].every(k=>Number.isFinite(a[k]))||a.radius<=0||a.width<=0||a.height<=0)fail();return true;
}
