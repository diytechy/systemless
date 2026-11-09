// Adapter for source-decoded private round data. No original map/text/art lives
// here. Successful structural decoding alone never enables unsupported rules.
import {TAU} from './engine.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {spikeGridPoint,actorInitialFrame,actorTiming} from './hazards.mjs';
import {compileWallTiles,actorChecksWalls} from './walls.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {activePuddleSpecs} from './oil.mjs';

const GROUPS={0:700,1:500,2:4400,3:4500,4:3500,6:4300};
const signedWord=n=>n>32767?n-65536:n;

export function decodedGridOrigin(header){
 if(![7,8].includes(header?.displaySizeRaw))throw new Error('Unqualified display-size selector');
 const columns=header.displaySizeRaw===8?11:10,rows=header.displaySizeRaw===8?8:7;
 return {x:74+(11-columns)*24,y:72+(8-rows)*24};
}

export const sourceInitialFrame=actorInitialFrame;

export function levelRequirements(level,{activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowRotatingSpikeTransfers=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCombinedGoalBonus=false,allowChildScoring=false}={}){
 const unsupported=[];
 if(allowCanonicalPlayer&&(!allowEnemyStaticPrograms||allowOil))unsupported.push("canonical player requires static Child actor callbacks without sliding");
 if(allowCombinedGoalBonus&&(!allowChildScoring||!allowSpecialDots))unsupported.push('combined goal/bonus requires source Child scoring');
 if(allowBombs&&allowGoodies)unsupported.push('exclusive bomb or goodie-only scope required');
 if(allowGoodies&&!allowSpecialDots)unsupported.push('goodie-only source timer qualification');
 const programs=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
 if(allowBombObjectInteractions&&(!allowBombs||!allowSpecialDots||!allowEnemyStaticPrograms))unsupported.push('bomb object interactions require bomb, static actor and special-dot rules');
 if(activeMask!==1)unsupported.push('unqualified difficulty clock');
 if(level.structuralStatus!=='complete')unsupported.push('incomplete source stream');
 if(![7,8].includes(level.header?.displaySizeRaw))unsupported.push('unqualified display-size selector');
 for(const block of level.blocks||[]){
  if(block.count&&!['SP','WL','DR','DS','WP','WA','TX',...(allowInactiveElevators&&block.kind==='EL'&&block.records.every(r=>r.rawWords.length===6&&!((r.rawWords[4]*65536+r.rawWords[5])&activeMask))?['EL']:[]),...(allowOil?['PU']:[]),...(allowSpecialDots?['WY']:[]),...(allowBombs?['BO','GO']:allowGoodies?['GO']:[])].includes(block.kind))unsupported.push('object class '+block.kind);
  if(block.kind==='DR'&&!allowInitiallyOpenDoors&&block.records.some(r=>!decodeDoorRecord(r).initiallyClosed))unsupported.push('initially open doors');
  if(block.kind==='SP')for(const spike of block.records){
   const mask=spike.rawWords[4]*65536+spike.rawWords[5];
   if(mask!==15&&(!Number.isInteger(mask)||!(allowInactiveSpikes&&!(mask&activeMask))))unsupported.push('conditional spike activation');
   if(allowGoodies&&(mask&activeMask))unsupported.push('goodies with active spikes');
  }
  if(block.kind==='WA')for(const actor of block.records){
   if(!(actor.activationMaskRaw&activeMask))continue;
   if(!(actor.actorTypeRaw in GROUPS)||actor.actorTypeRaw===4&&!allowRotatingSpikes)unsupported.push('actor type '+actor.actorTypeRaw);
   if(actor.actorTypeRaw===4&&allowRotatingSpikes){
    if(!allowEnemyStaticPrograms||!(actor.rawWords?.[7]===1||allowFastRotatingSpikes&&actor.rawWords?.[7]===5)||actorChecksWalls(actor.version12ByteRaw??1))unsupported.push('rotating spike canonical clock without walls');
    if(actor.programReferenceRaw>=0&&!(allowRotatingSpikeTransfers?/^[ns]+$/:/^n+$/).test(programs[actor.programReferenceRaw]||''))unsupported.push('rotating spike program capability');
    if(actor.programReferenceRaw>=0&&actor.rawWords?.[6]<1)unsupported.push('rotating spike program PC must skip length byte');
   }
   if(actor.programReferenceRaw>=0){
    const program=programs[actor.programReferenceRaw],pc=actor.rawWords?.[6];
    if(!allowEnemyBouncePrograms&&!allowEnemyStaticPrograms)unsupported.push('actor programs');
    else{
     if(![1,2,3,...(allowRotatingSpikes?[4]:[])].includes(actor.actorTypeRaw)||typeof program!=='string'||!program.length||program.length>255||[...program].some(c=>!(allowEnemyStaticPrograms?'nsbf':'b').includes(c)))unsupported.push(allowEnemyStaticPrograms?'non-static actor program':'non-bounce actor program');
     if(!Number.isInteger(pc)||pc<0||pc>(program?.length??0))unsupported.push('source program PC');
     if(!allowEnemyStaticPrograms&&pc===0&&[102,115].includes(program?.length))unsupported.push('length-byte program transfer');
     if(actorChecksWalls(actor.version12ByteRaw??1)&&!(allowProgrammedEnemyWalls&&allowEnemyStaticPrograms&&allowStaticEnemyWalls))unsupported.push('programmed wall-reacting actor');
    }
   }
   if(allowEnemyStaticPrograms&&[1,2,3].includes(actor.actorTypeRaw)&&actorChecksWalls(actor.version12ByteRaw??1)&&!allowStaticEnemyWalls)unsupported.push('canonical enemy wall response');
   const extendedClock=allowExtendedEnemyClocks&&allowEnemyStaticPrograms&&[1,2,3,...(allowRotatingSpikes&&allowFastRotatingSpikes?[4]:[])].includes(actor.actorTypeRaw)&&[2,5].includes(actor.rawWords?.[7]);
   if(!extendedClock&&!((allowBombs||(allowClass3Enemies&&[1,2,3].includes(actor.actorTypeRaw)))?[0,1,3,4]:[0,1,4]).includes(actor.rawWords?.[7]))unsupported.push('actor speed class '+actor.rawWords?.[7]);
  }
 }
 for(const cell of level.cells||[]){
  if(!cell.present)continue;
  const inactiveUpDown=allowInactiveUpDownDots&&[0x101,0x4101].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const inactiveRing=allowInactiveRings&&[0x9,0x4009].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const allowed=(allowSpecialDots?0x405f:0x4007)|(inactiveUpDown?0x100:0);
  if(cell.flagsRaw&~allowed)unsupported.push('special dot flags 0x'+(cell.flagsRaw&~allowed).toString(16));
  if((cell.flagsRaw&6)===6&&!allowCombinedGoalBonus)unsupported.push('combined bonus/goal callback');
  if(allowGoodies&&(cell.flagsRaw&8))unsupported.push('goodies with rings');
  if(allowSpecialDots&&(cell.flagsRaw&0x58)&&![0x9,0x4009,0x4011,0x4041,...(allowProtectedWaypoints?[0x4051]:[])].includes(cell.flagsRaw))unsupported.push('combined special dot properties');
  if(cell.secondaryRaw===null)unsupported.push('legacy dot permissions');
  // Mask matches need no property clearing. Plain mask misses retain their
  // pivots; optional properties on a mask miss still require qualification.
  else if((cell.secondaryRaw&15)!==15&&!(allowActiveDotMasks&&(cell.secondaryRaw&activeMask))&&!(allowInactivePlainDotMasks&&!(cell.secondaryRaw&activeMask)&&!(cell.flagsRaw&~0x4001))&&!inactiveUpDown&&!inactiveRing)unsupported.push('conditional dot activation');
 }
 if(allowEnemyStaticPrograms&&allowOil&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length)unsupported.push('static enemy transfer with active Oil');
 if(allowSpecialDots&&(!Number.isInteger(level.header?.timeLimitRaw)||level.header.timeLimitRaw<0))unsupported.push('source Child timer specification');
 return [...new Set(unsupported)];
}

export function buildDecodedBoard(level,{ordinal,title,angularSpeed,activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowChildScoring=false,allowProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowRotatingSpikeTransfers=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCombinedGoalBonus=false}={}){
 const unsupported=levelRequirements(level,{activeMask,allowOil,allowInactiveSpikes,allowEnemyBouncePrograms,allowEnemyStaticPrograms,allowSpecialDots,allowBombs,allowClass3Enemies,allowActiveDotMasks,allowInactivePlainDotMasks,allowProtectedWaypoints,allowGoodies,allowStaticEnemyWalls,allowExtendedEnemyClocks,allowProgrammedEnemyWalls,allowInitiallyOpenDoors,allowRotatingSpikes,allowFastRotatingSpikes,allowRotatingSpikeTransfers,allowInactiveElevators,allowInactiveUpDownDots,allowInactiveRings,allowBombObjectInteractions,allowCanonicalPlayer,allowCombinedGoalBonus,allowChildScoring});
 if(unsupported.length)throw new Error('Unsupported level requirements: '+unsupported.join(', '));
 if(!(angularSpeed>0))throw new RangeError('Explicit qualified or disclosed angular speed required');
 const origin=decodedGridOrigin(level.header);
 const dots=level.cells.filter(c=>c.present).map(c=>{
  const rawCell=allowInactiveRings&&[0x9,0x4009].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?c.flagsRaw&~8:c.flagsRaw;
  const cell=allowInactiveUpDownDots&&[0x101,0x4101].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?rawCell&~0x300:rawCell;
  const state=decodeDot(cell);
  return {id:`${c.column},${c.row}`,sourceIndex:c.row*11+c.column,row:c.row,column:c.column,x:origin.x+c.column*48,y:origin.y+c.row*48,
   humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,
   present:true,motion:'static',slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw,0),
   ring:allowSpecialDots&&!!(cell&8),protected:allowSpecialDots&&!!(c.flagsRaw&0x40),
   bonus:state.bonus,sourceInBackground:!(cell&0x1e),
   cell,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};
 });
 const records=kind=>level.blocks.find(b=>b.kind===kind)?.records||[];
 if(allowSpecialDots)for(const record of records('WY')){
  const w=record.rawWords;if(w.length!==6)throw new Error('Unqualified WY version');
  if(!(((w[4]*65536)+w[5])&activeMask))continue;
  const dot=dots.find(d=>d.id===`${w[1]},${w[0]}`);if(!dot)throw new Error('Checkpoint on an absent dot');
  dot.waystation={halfIndex:w[2],direction:signedWord(w[3])};
 }
 const actors=records('WA').filter(a=>a.activationMaskRaw&activeMask);
 const programs=records('WP').map(r=>r.text);
 if(actors.length<2||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6)
  throw new Error('Unqualified human actor slot layout');
 const hand=(a,index)=>{
  const pivot=`${a.gridPosition.column},${a.gridPosition.row}`;
  if(!dots.some(d=>d.id===pivot))throw new Error('Actor starts on an absent dot');
  const direction=signedWord(a.rawWords[4]);
  if(![-1,1].includes(direction))throw new Error('Unqualified actor direction');
  const program=a.programReferenceRaw>=0?programs[a.programReferenceRaw]:null,frame=sourceInitialFrame(a.initialFrameHalfIndexRaw);
  return {name:index===0?'player':`enemy-${index}`,pivot,grabMask:15<<(a.actorTypeRaw*4),
   angle:sourceInitialFrame(a.initialFrameHalfIndexRaw)*TAU/64,direction,
   program,sourcePC:program?a.rawWords[6]:undefined,canonicalFrame:allowEnemyStaticPrograms&&index>=2,
   frame:program||(allowEnemyStaticPrograms&&index>=2)?frame:undefined,unwrappedFrame:program||(allowEnemyStaticPrograms&&index>=2)?frame:undefined,
   visible:true,orphaned:false,hiddenUntil:0,
   group:GROUPS[a.actorTypeRaw],sourceSlot:index,sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw??1)};
 };
 const spikes=records('SP').filter(r=>!allowInactiveSpikes||((r.rawWords[4]*65536+r.rawWords[5])&activeMask)).map((r,index)=>({id:index,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],...spikeGridPoint(r,origin),phase:index%4,activationMask:r.rawWords[4]*65536+r.rawWords[5]}));
 if(spikes.some(s=>s.activationMask!==15))throw new Error('Conditional spike activation is unqualified');
 const wallTiles=compileWallTiles(records('WL').map(r=>({axis:r.rawWords[0]>>>8,
  fixed:signedWord(r.rawWords[1]),start:signedWord(r.rawWords[2]),startInset:signedWord(r.rawWords[3]),
  end:signedWord(r.rawWords[4]),endInset:signedWord(r.rawWords[5])})));
 const walls=wallTiles.map((t,id)=>({id,...t,x:origin.x+t.column*48,y:origin.y+t.row*48}));
 const hasWallArm=(row,column,mask)=>wallTiles.some(t=>t.row===row&&t.column===column&&t.frame>=4&&((t.frame-4)&mask));
 const doors=records('DR').map((r,id)=>{const spec=decodeDoorRecord(r);return {id,...spec,...doorGeometry(spec,origin,hasWallArm)};});
 const switches=records('DS').map((r,id)=>{const spec=decodeSwitchRecord(r);return {id,...spec,...switchGeometry(spec,origin)};});
 return {ordinal,title,resourceId:level.resourceId,origin,dots,radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,
  player:hand(actors[0],0),demos:[],enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),spikes,walls,doors,switches,
  puddles:allowOil?activePuddleSpecs(records('PU'),activeMask):[],
  ...(allowCanonicalPlayer?{canonicalPlayerRules:true}:{}),...(allowBombObjectInteractions?{bombObjectInteractionRules:true}:{}),...(allowCombinedGoalBonus?{combinedGoalBonusRules:true}:{}),...(allowRotatingSpikes?{rotatingSpikeRules:true,...(allowFastRotatingSpikes?{fastRotatingSpikeRules:true}:{}),...(allowRotatingSpikeTransfers?{rotatingSpikeTransferRules:true}:{})}:{}),bombRules:allowBombs,goodieOnlyRules:allowGoodies,staticEnemyWallRules:allowStaticEnemyWalls,bombs:allowBombs?records('BO'):[],goodies:(allowBombs||allowGoodies)?records('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&activeMask).map(r=>({row:r.rawWords[0],column:r.rawWords[1],initialFrame:r.rawWords[2]})):[],
  activeMask,difficulty:'Child',childScoreRules:allowChildScoring,sourceDotPermissions:true,specialDotRules:allowSpecialDots,staticEnemyCallbacks:allowEnemyStaticPrograms,timeLimit:level.header.timeLimitRaw,
  inactiveActorCount:records('WA').length-actors.length,
  texts:records('TX').map(t=>({font:t.fontName,size:t.fontSize,face:t.fontFaceRaw,
   style:t.renderingStyleByteRaw,x:t.positionWords[0]+28,y:t.positionWords[1]+28,
   text:t.text.startsWith('@')?t.text.slice(2):t.text,condition:t.text.startsWith('@')?t.text.slice(0,2):null}))};
}
