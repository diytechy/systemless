import {assertMovingMarkedGoalScope} from './marked-transfers.mjs';
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {assertMovingBombScope,importMovingGoodie} from './moving-bombs.mjs';
import {assertSlidingTeleportScope} from './sliding-teleports.mjs';
import {connectorSpecs,initializeConnectorBonuses} from './sliding.mjs';
// Adapter for source-decoded private round data. No original map/text/art lives
// here. Successful structural decoding alone never enables unsupported rules.
import {TAU} from './engine.mjs';
import {isQualifiedOrbitalProgram} from './enemy-transfer.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {spikeGridPoint,actorInitialFrame,actorTiming} from './hazards.mjs';
import {compileWallTiles,actorChecksWalls} from './walls.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {activePuddleSpecs} from './oil.mjs';
import {activeElevatorSpecs} from './elevators.mjs';
import {activeTeleportSpecs,pairTeleportSpecs} from './teleports.mjs';

import {assertSlidingOilScope} from './sliding-oil.mjs';
import {assertSlidingBombScope,initializeSlidingBombConnectors} from './sliding-bombs.mjs';

const GROUPS={0:700,1:500,2:4400,3:4500,4:3500,6:4300};
const signedWord=n=>n>32767?n-65536:n;

export function decodedGridOrigin(header){
 if(![7,8].includes(header?.displaySizeRaw))throw new Error('Unqualified display-size selector');
 const columns=header.displaySizeRaw===8?11:10,rows=header.displaySizeRaw===8?8:7;
 return {x:74+(11-columns)*24,y:72+(8-rows)*24};
}

export const sourceInitialFrame=actorInitialFrame;

export function levelRequirements(level,{activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowProtectedWaypoints=false,allowProtectedBonuses=false,allowInactiveProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCanonicalOil=false,allowCanonicalOilSpikes=false,allowElevators=false,allowElevatorGoodies=false,allowColoredElevatorGoodies=false,allowElevatorOilSpikes=false,allowBombOilElevators=false,allowSlidingBombs=false,allowSlidingBombCheckpoints=false,allowSlidingOil=false,allowSlidingOilGoodieRings=false,allowSlidingGoodiePrograms=false,allowSlidingGoodies=false,allowStaticSlidingPrograms=false,allowSlidingConnectors=false,allowTeleports=false,allowSlidingTeleports=false,allowMovingDots=false,allowMarkedTransfers=false,allowMovingMarkedGoals=false,allowMovingBombs=false,allowImportedGoodie169=false,allowCombinedGoalBonus=false,allowChildScoring=false}={}){
 const unsupported=[];
 if(allowMovingDots&&!allowMovingBombs&&!allowMovingMarkedGoals)unsupported.push('Moving core requires its separate qualified scene composition');
 if(allowImportedGoodie169&&!allowMovingBombs)unsupported.push('Imported GO169 requires the moving BO composition');

 if(allowMarkedTransfers&&!allowMovingMarkedGoals)unsupported.push('Marked core requires separate moving/goal composition');
 if(allowMovingMarkedGoals){
  if(!allowMovingDots||!allowMarkedTransfers||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('Separate canonical Child moving/static-mark/moving-goal composition required');
  if(allowMovingBombs||allowImportedGoodie169||allowBombs||allowGoodies||allowSlidingConnectors||allowTeleports||allowOil||allowCanonicalOil||allowElevators||allowRotatingSpikes||allowStaticEnemyWalls||level.blocks?.some(b=>b.count&&!['WP','WA','TX'].includes(b.kind)))unsupported.push('Moving marked goal additional families unqualified');
  const records=k=>level.blocks?.find(b=>b.kind===k)?.records||[],ps=records('WP').map(r=>r.text),as=records('WA').filter(a=>a.activationMaskRaw&activeMask);
  if(level.cells?.some(c=>c.present&&(!(c.secondaryRaw&activeMask)||(c.flagsRaw&~0x6087)||!(c.flagsRaw&1))))unsupported.push('Moving marked goal source dot bits/masks required');
  if(as.some((a,i)=>i<2?a.rawWords?.[7]!==0||a.programReferenceRaw>=0:![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^[nsf]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1||a.rawWords?.[6]>(ps[a.programReferenceRaw]?.length??0))))unsupported.push('Moving marked goal ordinary class1 n/s/f source actors required');
  try{for(const c of level.cells.filter(c=>c.present&&(c.flagsRaw&0x80))){movingProgramCell(c);if(!/^[epw]+$/.test(c.inlineProgram.text))throw new Error('Moving marked goal e/p/w movers required');const o=decodedGridOrigin(level.header);assertClosedMovingProgram(c.inlineProgram.text,{x:o.x+48*c.column,y:o.y+48*c.row});}}catch(e){unsupported.push(e.message);}
 }

 if(allowMovingBombs){
  if(!allowMovingDots||!allowSlidingConnectors||!allowBombs||!allowGoodies||!allowBombObjectInteractions||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('Separate canonical Child moving/BO/EX/GO composition required');
  if(allowSlidingBombs||allowSlidingBombCheckpoints||allowSlidingOil||allowSlidingGoodies||allowStaticSlidingPrograms||allowSlidingTeleports||allowTeleports||allowOil||allowCanonicalOil||allowElevators||allowRotatingSpikes||allowStaticEnemyWalls||level.blocks?.some(b=>b.count&&!['SP','BO','GO','EX','WP','WA','TX'].includes(b.kind)))unsupported.push('Moving BO additional families unqualified');
  const records=k=>level.blocks?.find(b=>b.kind===k)?.records||[],ps=records('WP').map(r=>r.text),as=records('WA').filter(a=>a.activationMaskRaw&activeMask);
  if(!records('BO').length||!records('GO').length||!records('SP').some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask))unsupported.push('Moving BO requires explicit BO/GO/SP inventories');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007,0x81,0x4081,0xc1,0x40c1].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask)||(c.flagsRaw&0x80)&&(!c.inlineProgram||typeof c.inlineProgram.text!=='string'||!c.inlineProgram.text.length||c.inlineProgram.text.length>127||!/^[npswe]+$/.test(c.inlineProgram.text)))))unsupported.push('Moving BO static plain dots and bounded ordinary n/p/s/w/e movers required');
  if(as.length>31||as.some(a=>{const c=level.cells?.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column);return [0,6].includes(a.actorTypeRaw)?a.rawWords?.[7]!==0||a.programReferenceRaw>=0||!c||![0xc1,0x40c1].includes(c.flagsRaw):![1,2].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||c?.flagsRaw&0x80||a.programReferenceRaw>=0&&(!/^[bfn]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1||a.rawWords?.[6]>(ps[a.programReferenceRaw]?.length??0));}))unsupported.push('Moving BO protected-mover human starts and static-start ordinary class1 kinds1/2 b/f/n PC1 NPCs required');
  if(records('BO').some(b=>b.rawWords[2]>=10&&(b.rawWords[3]>>>8)!==0))unsupported.push('Moving BO human-only starters required');
  try{for(const c of level.cells.filter(c=>c.present&&(c.flagsRaw&0x80))){movingProgramCell(c);const o=decodedGridOrigin(level.header);assertClosedMovingProgram(c.inlineProgram.text,{x:o.x+48*c.column,y:o.y+48*c.row});}const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:c.flagsRaw&0x80?'moving-program':'static'})),es=connectorSpecs(records('EX'),ds);if(!es.length||es.some(e=>[e.first,e.second].some(id=>ds.find(d=>d.id===id).flagsRaw&0x5c)))throw new Error('Moving BO requires static ordinary/bonus EX endpoints');for(const g of records('GO'))importMovingGoodie(g,{sha256:level.sha256,byteLength:level.byteLength,resourceId:level.resourceId},{allowImportedGoodie169});}catch(e){unsupported.push(e.message);}
 }

 if(allowSlidingTeleports){
  if(!allowTeleports||!allowSlidingConnectors||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('Separate canonical Child HY/EX composition required');
  if(allowRotatingSpikes||allowStaticSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowSlidingBombs||allowSlidingBombCheckpoints||allowOil||allowBombs||allowGoodies||allowElevators||allowBombOilElevators||allowCanonicalOil||allowStaticEnemyWalls||level.blocks?.some(b=>b.count&&!['HY','EX','WP','WA','TX'].includes(b.kind)))unsupported.push('HY/EX additional families unqualified');
  if(level.cells?.some(c=>c.present&&(![1,5,9,0x4001,0x4005,0x4009].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask)||(c.flagsRaw&8)&&dotColorOffset(c.secondaryRaw)!==0)))unsupported.push('HY/EX requires ordinary dots and disjoint white rings/goal');
  const ps=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[],as=level.blocks?.find(b=>b.kind==='WA')?.records.filter(a=>a.activationMaskRaw&activeMask)||[];
  if(as.length>31||as.some(a=>[0,6].includes(a.actorTypeRaw)?a.rawWords?.[7]!==0:![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^[bfns]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1||a.rawWords?.[6]>(ps[a.programReferenceRaw]?.length??0))))unsupported.push('HY/EX ordinary wall-free class1 b/f/n/s PC1 actors required');
  try{
   const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:'static',teleport:false})),es=connectorSpecs(level.blocks?.find(b=>b.kind==='EX')?.records||[],ds),hs=pairTeleportSpecs(activeTeleportSpecs(level.blocks?.find(b=>b.kind==='HY')?.records||[],activeMask),ds);
   if(!es.length||!hs.length)throw new Error('Explicit HY/EX inventory required');
   if(hs.some(e=>{const d=ds.find(d=>d.id===e.dot);return d.slideMask||(d.flagsRaw&0x5e);}))throw new Error('HY/EX endpoints must be disjoint from each other, rings and goal');
   if(es.some(e=>[e.first,e.second].some(id=>ds.find(d=>d.id===id).flagsRaw&0x5e)))throw new Error('HY/EX ordinary EX endpoints required');
   if(as.some((a,i)=>{const d=ds.find(d=>d.column===a.gridPosition?.column&&d.row===a.gridPosition?.row);return !d||hs.some(e=>e.dot===d.id)||i<2&&(![1,0x4001].includes(d.flagsRaw)||d.slideMask);}))throw new Error('HY/EX requires ordinary human starts and no initial NPC HY hook');
  }catch(e){unsupported.push(e.message);}
 }

 if(allowSlidingBombCheckpoints&&(!level.blocks?.find(b=>b.kind==='WL')?.count||!level.cells?.some(c=>c.present&&c.flagsRaw===0x4051&&(c.secondaryRaw&activeMask))||level.blocks?.find(b=>b.kind==='SP')?.records.some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask)))unsupported.push('BO/EX checkpoints require active protected WY and walls without SP');
 if(allowSlidingBombCheckpoints&&!allowSlidingBombs)unsupported.push('EX bomb checkpoints require EX bomb core');
 if(allowSlidingBombs){
  if(!allowSlidingConnectors||!allowBombs||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8||allowSlidingBombCheckpoints&&(!allowBombObjectInteractions||!allowProtectedWaypoints))unsupported.push('Separate canonical Child BO/static EX composition required');
  if(allowStaticSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowSlidingOil||allowGoodies||allowOil||allowElevators||allowTeleports||allowRotatingSpikes||allowBombOilElevators||level.blocks?.some(b=>b.count&&['DR','DS','GO','EL','HY','PU','GN','TR',...(!allowSlidingBombCheckpoints?['WL','WY']:[])].includes(b.kind)))unsupported.push('BO/EX additional families unqualified');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007,...(allowSlidingBombCheckpoints?[0x4051]:[9,0x4009])].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask))))unsupported.push('BO/EX plain dots and separate disjoint white ring or protected WY required');
  const ps=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&([0,6].includes(a.actorTypeRaw)?a.rawWords?.[7]!==0||((level.cells.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&4):![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^[bfns]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1))))unsupported.push('BO/EX wall-free ordinary class1 b/f/n/s PC1 actors required');
  const bs=level.blocks?.find(b=>b.kind==='BO')?.records||[];
  if(!bs.length||bs.some(b=>b.rawWords[2]>=10&&(b.rawWords[3]>>>8)!==0))unsupported.push('BO/EX human-only starter inventory required');
  try{const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:'static'}));const es=connectorSpecs(level.blocks?.find(b=>b.kind==='EX')?.records||[],ds);if(!es.length||es.some(e=>[e.first,e.second].some(id=>ds.find(d=>d.id===id).flagsRaw&0x5c)))throw new Error('BO/EX endpoints must be ordinary or bonus, without goal/ring/WY/protection');if(ds.some(d=>(d.flagsRaw&8)&&dotColorOffset(d.secondaryRaw)!==0))throw new Error('BO/EX only disjoint white rings qualified');}catch(e){unsupported.push(e.message);}
 }

 if(allowElevators&&!allowSlidingConnectors&&!allowBombOilElevators&&!allowElevatorGoodies&&!allowColoredElevatorGoodies){
  const group=allowElevatorOilSpikes?0:1,plain=allowElevatorOilSpikes?0x101:0x201;
  if(level.header?.displaySizeRaw!==8)unsupported.push('only large-display elevator geometry is qualified');
  if(!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring)unsupported.push('elevators require source Child player, static actors, dots and scoring');
  if(level.blocks?.some(b=>b.count&&[...(allowElevatorOilSpikes?[]:['SP']),'WL','DR','DS','BO','GO','WY','HY','EX','GN','TR'].includes(b.kind))||!allowElevatorOilSpikes&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length)unsupported.push('elevators with other hazards or special objects are unqualified');
  const controls=activeElevatorSpecs(level.blocks?.find(b=>b.kind==='EL')?.records||[],activeMask);
  if(!controls.length||controls.some(s=>s.group!==group||s.subcell!==(allowElevatorOilSpikes?2:3)))unsupported.push(allowElevatorOilSpikes?'only group0 left half-cell controls with Oil/spikes are qualified':'only active group1 half-cell elevator controls are qualified');
  const activeDots=level.cells?.filter(c=>c.present&&(c.flagsRaw&0x300)&&(c.secondaryRaw&activeMask))||[];
  if(!activeDots.length||activeDots.some(c=>c.flagsRaw!==plain||dotColorOffset(c.secondaryRaw)!==0))unsupported.push(allowElevatorOilSpikes?'only plain initially raised white group0 dots with Oil/spikes are qualified':'only plain initially raised white group1 dots are qualified');
  if(level.cells?.some(c=>c.present&&![1,3,5,0x4001,0x4003,0x4005].includes(c.flagsRaw)&&!((c.flagsRaw===plain)&&(c.secondaryRaw&activeMask))&&!(allowInactiveUpDownDots&&[0x101,0x4101].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask))))unsupported.push('elevator dot composition is unqualified');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1))))unsupported.push('elevators require wall-free ordinary class1 enemies');
 }
 // This composition is admitted separately: legacy elevator and Oil gates
 // retain their narrower scope. The caller still needs every actor capability.
 if(allowBombOilElevators){
  if(!allowElevators||!allowOil||!allowCanonicalOil||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowBombs||!allowBombObjectInteractions||allowElevatorOilSpikes||allowCanonicalOilSpikes||allowGoodies)unsupported.push('bomb/Oil/elevators require their separate source Child composition');
  if(level.header?.displaySizeRaw!==8||level.blocks?.some(b=>b.count&&['SP','DR','DS','HY','EX','GN','TR'].includes(b.kind)))unsupported.push('bomb/Oil/elevators require large geometry without other hazards');
  const controls=activeElevatorSpecs(level.blocks?.find(b=>b.kind==='EL')?.records||[],activeMask),puddles=activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask);
  if(!controls.some(c=>c.group===0)||!controls.some(c=>c.group===1)||controls.some(c=>!(c.group===0&&c.subcell===1||c.group===1&&c.subcell===3)))unsupported.push('bomb/Oil/elevators require group0 upper and group1 center controls');
  if(!puddles.length||puddles.some(p=>![0,2].includes(p.kind))||!level.blocks?.find(b=>b.kind==='BO')?.count)unsupported.push('bomb/Oil/elevators require kind0/2 Oil and a bomb inventory');
  const activeDots=level.cells?.filter(c=>c.present&&(c.flagsRaw&0x300)&&(c.secondaryRaw&activeMask))||[];
  if(!activeDots.length||activeDots.some(c=>![0x101,0x201].includes(c.flagsRaw)||dotColorOffset(c.secondaryRaw)!==0))unsupported.push('bomb/Oil/elevators require plain raised white group0/1 dots');
  if(level.cells?.some(c=>c.present&&![1,3,5,0x4001,0x4003,0x4005,0x4011].includes(c.flagsRaw)&&!([0x101,0x201].includes(c.flagsRaw)&&(c.secondaryRaw&activeMask))&&!(allowInactiveUpDownDots&&c.flagsRaw===0x301&&!(c.secondaryRaw&activeMask))))unsupported.push('bomb/Oil/elevators dot composition is unqualified');
  if(level.cells?.some(c=>c.present&&c.flagsRaw===0x4011&&dotColorOffset(c.secondaryRaw)!==0))unsupported.push('bomb/Oil/elevators require uncolored static checkpoints');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(actorChecksWalls(a.version12ByteRaw??1)||!([1,2,3].includes(a.actorTypeRaw)&&[1,3].includes(a.rawWords?.[7])||a.actorTypeRaw===4&&[1,2,4].includes(a.rawWords?.[7])&&a.programReferenceRaw<0))))unsupported.push('bomb/Oil/elevators actor composition is unqualified');
 }
 if(allowSlidingConnectors&&!allowStaticSlidingPrograms&&!allowSlidingGoodies&&!allowSlidingOil&&!allowSlidingBombs&&!allowSlidingTeleports&&!allowMovingBombs){
  if(!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowElevators||!allowProtectedWaypoints||!allowExtendedEnemyClocks||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('EX requires separate canonical Child elevator/checkpoint scope');
  if(allowOil||allowBombs||allowGoodies||allowTeleports||allowRotatingSpikes||allowElevatorGoodies||allowColoredElevatorGoodies||allowElevatorOilSpikes||allowBombOilElevators||level.blocks?.some(b=>b.count&&['DR','DS','BO','GO','HY','PU','GN','TR'].includes(b.kind)))unsupported.push('EX additional families unqualified');
  if(level.blocks?.find(b=>b.kind==='SP')?.records.some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask))unsupported.push('EX active spikes unqualified');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&[0,6].includes(a.actorTypeRaw)&&((level.cells.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&4)))unsupported.push('EX human initial goals unqualified');
  const controls=activeElevatorSpecs(level.blocks?.find(b=>b.kind==='EL')?.records||[],activeMask);
  if(!controls.length||controls.some(c=>c.group!==0||![2,3].includes(c.subcell)))unsupported.push('EX plain group0 controls required');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007,0x4051,0x101].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask)||[0x101,0x4051].includes(c.flagsRaw)&&dotColorOffset(c.secondaryRaw)!==0)))unsupported.push('EX static dots/white protected checkpoints/plain raised group0 required');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(![1,2,3].includes(a.actorTypeRaw)||![1,2].includes(a.rawWords?.[7])||a.programReferenceRaw>=0||actorChecksWalls(a.version12ByteRaw??1))))unsupported.push('EX free ordinary wall-disabled class1/2 required');
  try{const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:c.flagsRaw&0x300?'up-down':'static'}));const rs=level.blocks?.find(b=>b.kind==='EX')?.records||[];if(!rs.length)throw new Error('EX records required');connectorSpecs(rs,ds);}catch(e){unsupported.push(e.message);}
 }
 if(allowStaticSlidingPrograms){
  if(!allowSlidingConnectors||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowExtendedEnemyClocks||!allowClass3Enemies||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('Static EX requires separate canonical Child class1/2/3 scope');
  if(allowElevators||allowOil||allowBombs||allowGoodies||allowTeleports||allowRotatingSpikes||level.blocks?.some(b=>b.count&&['EL','WY','WL','DR','DS','BO','GO','HY','PU','GN','TR'].includes(b.kind)))unsupported.push('Static EX additional families unqualified');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask))))unsupported.push('Static EX plain static dots required');
  const ps=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&([0,6].includes(a.actorTypeRaw)?((level.cells.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&4):![1,2,3].includes(a.actorTypeRaw)||![1,2,3].includes(a.rawWords?.[7])||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^[fn]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1))))unsupported.push('Static EX ordinary free or f/n PC1 programs required');
  try{const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:'static'}));const rs=level.blocks?.find(b=>b.kind==='EX')?.records||[];if(!rs.length)throw new Error('EX records required');connectorSpecs(rs,ds);}catch(e){unsupported.push(e.message);}
 }
 if(allowSlidingOilGoodieRings&&!allowSlidingOil)unsupported.push('Oil/GO/rings require EX/Oil core');
 if(allowSlidingOil){
  if(!allowSlidingConnectors||!allowOil||!allowCanonicalOil||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==(allowSlidingOilGoodieRings?7:8))unsupported.push('Separate canonical Child EX/Oil geometry and callbacks required');
  if(allowStaticSlidingPrograms||allowSlidingGoodies||allowSlidingGoodiePrograms||allowElevators||allowTeleports||allowBombs||allowRotatingSpikes||allowCanonicalOilSpikes||allowElevatorOilSpikes||allowBombOilElevators||allowGoodies!==allowSlidingOilGoodieRings||level.blocks?.some(b=>b.count&&['WL','DR','DS','BO','EL','WY','HY','GN','TR'].includes(b.kind)))unsupported.push('EX/Oil additional families unqualified');
  const ps=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[],puddles=activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask);
  if(!puddles.length||puddles.some(p=>p.kind!==(allowSlidingOilGoodieRings?1:0))||!level.blocks?.find(b=>b.kind==='SP')?.count)unsupported.push('EX/Oil active kind0 or separate kind1 Oil and static SP required');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007,...(allowSlidingOilGoodieRings?[9,0x4009]:[])].includes(c.flagsRaw)||(c.flagsRaw&8)&&(c.secondaryRaw&activeMask)&&![0,4].includes(dotColorOffset(c.secondaryRaw)))))unsupported.push('EX/Oil static ordinary or qualified white/blue rings required');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&([0,6].includes(a.actorTypeRaw)?a.rawWords?.[7]!==0||![1,0x4001].includes(level.cells?.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw):![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^[fns]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1))))unsupported.push('EX/Oil ordinary free or n/s/f PC1 class1 actors required');
  try{const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:'static'})),rs=level.blocks?.find(b=>b.kind==='EX')?.records||[];if(!rs.length)throw new Error('EX records required');const es=connectorSpecs(rs,ds);if(ds.some(d=>(d.flagsRaw&8)&&(d.secondaryRaw&activeMask)&&es.some(e=>[e.first,e.second].includes(d.id))))throw new Error('Ring EX endpoints unqualified');}catch(e){unsupported.push(e.message);}
 }
 if(allowSlidingGoodiePrograms&&!allowSlidingGoodies)unsupported.push('Sliding goodie programs require sliding goodies');
 if(allowSlidingGoodies){
  if(!level.blocks?.find(b=>b.kind==='GO')?.records.some(r=>(r.rawWords[3]*65536+r.rawWords[4])&activeMask))unsupported.push('Sliding goodies requires active GO');
  if(!allowSlidingConnectors||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowExtendedEnemyClocks||!allowCombinedGoalBonus||activeMask!==1||level.header?.displaySizeRaw!==8)unsupported.push('Sliding goodies EX requires separate canonical Child class1/2/3 scope');
  if(!allowGoodies||allowStaticSlidingPrograms||allowElevators||allowOil||allowBombs||allowTeleports||allowRotatingSpikes||level.blocks?.some(b=>b.count&&['EL','WY','DR','DS','BO','HY','PU','GN','TR'].includes(b.kind)))unsupported.push('Sliding goodies EX additional families unqualified');
  if(level.cells?.some(c=>c.present&&(![1,3,5,7,0x4001,0x4003,0x4005,0x4007].includes(c.flagsRaw)||!(c.secondaryRaw&activeMask))))unsupported.push('Sliding goodies EX plain static dots required');
  const ps=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&([0,6].includes(a.actorTypeRaw)?((level.cells.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&4):![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!allowSlidingGoodiePrograms||!/^[bns]+$/.test(ps[a.programReferenceRaw]??'')||a.rawWords?.[6]<1))))unsupported.push('Sliding goodies EX free or explicitly enabled b/n/s ordinary class1 actors required');
  try{const ds=level.cells.filter(c=>c.present).map(c=>({...c,id:`${c.column},${c.row}`,motion:'static'}));const rs=level.blocks?.find(b=>b.kind==='EX')?.records||[];if(!rs.length)throw new Error('EX records required');connectorSpecs(rs,ds);}catch(e){unsupported.push(e.message);}
 }
 if(allowElevatorOilSpikes){
  if(!allowElevators||!allowCanonicalOil||!allowOil||allowCanonicalOilSpikes)unsupported.push('elevator Oil/spikes require the separate canonical group0 composition');
  const puddles=activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask);
  if(!puddles.length||puddles.some(p=>p.kind!==3)||!level.blocks?.find(b=>b.kind==='SP')?.records.some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask))unsupported.push('elevator Oil/spikes require kind3 puddles and active static spikes');
 }
 if(allowCanonicalPlayer&&(!allowEnemyStaticPrograms||allowOil&&!allowCanonicalOil&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length))unsupported.push("canonical player requires static Child actor callbacks without sliding");
 if(allowCanonicalOil&&!allowBombOilElevators&&!allowSlidingOil){
  if(!allowOil||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring)unsupported.push('canonical Oil requires Child movement, static actors, special dots and scoring');
  if(level.blocks?.some(b=>b.count&&[...(allowCanonicalOilSpikes||allowElevatorOilSpikes?[]:['SP']),'DR','DS','BO','GO'].includes(b.kind)))unsupported.push('canonical Oil with additional hazards is unqualified');
  if(level.cells?.some(c=>c.present&&((c.flagsRaw&~(allowElevatorOilSpikes?0x4117:0x4017))||(c.flagsRaw&6)===6||(c.flagsRaw&0x10)&&dotColorOffset(c.secondaryRaw)!==0)))unsupported.push('canonical Oil requires ordinary dots and uncolored static checkpoints');
  // The wall opt-in separately qualifies free slow red hands with Oil.
  // Other clocks, programmed slow hands and wall-reacting classes1/3 stay gated.
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&!([1,2,3].includes(a.actorTypeRaw)&&[1,3].includes(a.rawWords?.[7])&&!actorChecksWalls(a.version12ByteRaw??1)||allowStaticEnemyWalls&&a.actorTypeRaw===1&&a.rawWords?.[7]===4&&a.programReferenceRaw<0)))unsupported.push('canonical Oil enemy composition is unqualified');
 }
 if(allowCanonicalOilSpikes){
  if(!allowCanonicalOil||level.header?.displaySizeRaw!==8)unsupported.push('Oil spikes require canonical Oil and large-display geometry');
  const puddles=activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask);
  if(!puddles.length||puddles.some(p=>p.kind!==2)||!level.blocks?.find(b=>b.kind==='SP')?.records.some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask))unsupported.push('Oil spikes require kind2 puddles and active static spikes');
  if(level.blocks?.some(b=>b.count&&['WL','DR','DS','BO','GO','WY','EL','HY','EX','GN','TR'].includes(b.kind))||level.cells?.some(c=>c.present&&(c.flagsRaw&~0x4007)))unsupported.push('Oil spikes require ordinary static dots without other objects');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(![1,2,3].includes(a.actorTypeRaw)||a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1))))unsupported.push('Oil spikes require wall-free ordinary class1 enemies');
 }
 if(allowProtectedBonuses&&(!allowSpecialDots||!allowChildScoring||!allowCanonicalPlayer||!allowEnemyStaticPrograms))unsupported.push('protected bonuses require canonical Child dots and scoring');
 if(allowInactiveProtectedWaypoints&&(!allowSpecialDots||!allowProtectedWaypoints))unsupported.push('inactive protected waypoints require their separate checkpoint capability');
 if(allowCombinedGoalBonus&&(!allowChildScoring||!allowSpecialDots))unsupported.push('combined goal/bonus requires source Child scoring');
 if(allowBombs&&allowGoodies&&!allowMovingBombs)unsupported.push('exclusive bomb or goodie-only scope required');
 if(allowGoodies&&!allowSpecialDots)unsupported.push('goodie-only source timer qualification');
 if((allowClass2RotatingSpikes||allowClass3RotatingSpikes)&&(!allowRotatingSpikes||!allowEnemyStaticPrograms))unsupported.push('class2/3 orbitals require canonical rotating-spike callbacks');
 const programs=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
 // First HY family: static Child ordinary dots/rings, spikes and class1
 // free ordinary hands / n-only orbitals. Later combinations stay gated.
 if(allowTeleports&&!allowSlidingTeleports){
  if(!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||!allowRotatingSpikes||level.header?.displaySizeRaw!==8||allowOil||allowBombs||allowGoodies||allowElevators)unsupported.push('teleports require their separate static Child composition');
  if(level.blocks?.some(b=>b.count&&['WL','DR','DS','PU','BO','GO','WY','EX','EL','GN','TR'].includes(b.kind)))unsupported.push('teleports with other object families are unqualified');
  if(level.cells?.some(c=>c.present&&![1,3,5,9,0x4001,0x4003,0x4005,0x4009].includes(c.flagsRaw)))unsupported.push('teleport dot composition is unqualified');
  if(level.blocks?.find(b=>b.kind==='WA')?.records.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||!([1,2,3].includes(a.actorTypeRaw)&&a.programReferenceRaw<0||a.actorTypeRaw===4&&(a.programReferenceRaw<0||/^n+$/.test(programs[a.programReferenceRaw]??'')&&a.rawWords?.[6]>=1)))))unsupported.push('teleports require free ordinary class1 hands and free or n-only class1 orbitals');
  try{
   const specs=activeTeleportSpecs(level.blocks?.find(b=>b.kind==='HY')?.records||[],activeMask);
   if(!specs.length)unsupported.push('active paired HY records required');else pairTeleportSpecs(specs,(level.cells||[]).map(c=>({...c,id:`${c.column},${c.row}`})));
   const humans=level.blocks?.find(b=>b.kind==='WA')?.records.filter(a=>(a.activationMaskRaw&activeMask)&&[0,6].includes(a.actorTypeRaw))||[];
   if(humans.some(a=>{const {row,column}=a.gridPosition||{},cell=level.cells?.find(c=>c.row===row&&c.column===column);return !cell?.present||![1,0x4001].includes(cell.flagsRaw)||specs.some(s=>s.row===row&&s.column===column);}))unsupported.push('teleports require ordinary non-HY non-goal human starts');
  }catch(e){unsupported.push(e.message);}
 }

 if(allowElevatorGoodies){
  if(!allowElevators||!allowGoodies||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||allowBombs||allowBombOilElevators||allowElevatorOilSpikes||allowCanonicalOil||allowCanonicalOilSpikes)unsupported.push('elevator goodies require their separate canonical Child composition');
  if(level.header?.displaySizeRaw!==8||level.blocks?.some(b=>b.count&&['WL','DR','DS','BO','WY','HY','EX','GN','TR'].includes(b.kind)))unsupported.push('elevator goodies require large geometry without other object families');
  if(activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length||!level.blocks?.find(b=>b.kind==='GO')?.count)unsupported.push('elevator goodies require active GO and no active Oil');
  const controls=activeElevatorSpecs(level.blocks?.find(b=>b.kind==='EL')?.records||[],activeMask),dots=level.cells?.filter(c=>c.present&&(c.flagsRaw&0x300)&&(c.secondaryRaw&activeMask))||[];
  if(!controls.some(c=>c.group===1)||!controls.some(c=>c.group===2)||controls.some(c=>!(c.group===0&&c.subcell===1||c.group===1&&[1,3].includes(c.subcell)||c.group===2&&c.subcell===3)))unsupported.push('elevator goodies require qualified group0/1/2 controls');
  if(!dots.some(c=>c.flagsRaw===0x4201)||!dots.some(c=>c.flagsRaw===0x301)||dots.some(c=>![0x201,0x4201,0x301].includes(c.flagsRaw)||dotColorOffset(c.secondaryRaw)!==0))unsupported.push('elevator goodies require raised/lowered white group1 and raised group2 dots');
  if(level.cells?.some(c=>c.present&&![1,3,5,0x4001,0x4003,0x4005,0x4041].includes(c.flagsRaw)&&!([0x201,0x4201,0x301].includes(c.flagsRaw)&&(c.secondaryRaw&activeMask))&&!(allowInactiveUpDownDots&&[0x101,0x301].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask))))unsupported.push('elevator goodies dot composition is unqualified');
  const actors=level.blocks?.find(b=>b.kind==='WA')?.records||[];
  if(actors.some(a=>(a.activationMaskRaw&activeMask)&&((level.cells?.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&0x300)))unsupported.push('elevator goodies require static actor starting pivots');
  if(actors.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(![1,2,3].includes(a.actorTypeRaw)||![1,3,4].includes(a.rawWords?.[7])||actorChecksWalls(a.version12ByteRaw??1)||a.programReferenceRaw>=0&&(!/^n+$/.test(programs[a.programReferenceRaw]??'')||a.rawWords?.[6]<1))))unsupported.push('elevator goodies require ordinary wall-free clocks1/3/4 and free or n-only programs');
 }

 // Separate raised colored three-channel composition; the earlier gates stay narrow.
 if(allowColoredElevatorGoodies){
  if(!allowElevators||!allowGoodies||!allowRotatingSpikes||!allowCanonicalPlayer||!allowEnemyStaticPrograms||!allowSpecialDots||!allowChildScoring||allowElevatorGoodies||allowBombs||allowBombOilElevators||allowElevatorOilSpikes||allowCanonicalOil||allowCanonicalOilSpikes)unsupported.push('colored elevator goodies require their separate canonical Child composition');
  if(level.header?.displaySizeRaw!==8||level.blocks?.some(b=>b.count&&['WL','DR','DS','BO','PU','WY','HY','EX','GN','TR'].includes(b.kind))||!level.blocks?.find(b=>b.kind==='GO')?.records.some(r=>(r.rawWords[3]*65536+r.rawWords[4])&activeMask))unsupported.push('colored elevator goodies require large geometry, active GO and no other object families');
  const controls=activeElevatorSpecs(level.blocks?.find(b=>b.kind==='EL')?.records||[],activeMask),dots=level.cells?.filter(c=>c.present&&(c.flagsRaw&0x300)&&(c.secondaryRaw&activeMask))||[];
  if([0,1,2].some(g=>!controls.some(c=>c.group===g))||controls.some(c=>![1,2,3].includes(c.subcell)))unsupported.push('colored elevator goodies require three channels and subcell1/2/3 controls');
  if([0,1,2].some(g=>!dots.some(c=>c.flagsRaw===(g+1)*0x100+1))||dots.some(c=>![0x101,0x201,0x301].includes(c.flagsRaw)||dotColorOffset(c.secondaryRaw)!==[4,2,1][((c.flagsRaw>>8)&3)-1]))unsupported.push('colored elevator goodies require raised blue0/green1/red2 dots');
  if(level.cells?.some(c=>c.present&&![1,3,5,0x4001,0x4003,0x4005].includes(c.flagsRaw)&&!([0x101,0x201,0x301].includes(c.flagsRaw)&&((c.secondaryRaw&activeMask)||allowInactiveUpDownDots))))unsupported.push('colored elevator goodies dot composition is unqualified');
  const actors=level.blocks?.find(b=>b.kind==='WA')?.records||[];
  if(actors.some(a=>(a.activationMaskRaw&activeMask)&&((level.cells?.find(c=>c.row===a.gridPosition?.row&&c.column===a.gridPosition?.column)?.flagsRaw??0)&0x300)))unsupported.push('colored elevator goodies require static actor starting pivots');
  if(actors.some(a=>(a.activationMaskRaw&activeMask)&&![0,6].includes(a.actorTypeRaw)&&(a.rawWords?.[7]!==1||actorChecksWalls(a.version12ByteRaw??1)||!([1,2,3].includes(a.actorTypeRaw)&&(a.programReferenceRaw<0||/^[fns]+$/.test(programs[a.programReferenceRaw]??'')&&a.rawWords?.[6]>=1)||a.actorTypeRaw===4&&a.programReferenceRaw<0))))unsupported.push('colored elevator goodies require wall-free ordinary class1 f/n/s programs and free class1 orbitals');
 }
 if(allowBombObjectInteractions&&(!allowBombs||!allowSpecialDots||!allowEnemyStaticPrograms))unsupported.push('bomb object interactions require bomb, static actor and special-dot rules');
 if(activeMask!==1)unsupported.push('unqualified difficulty clock');
 if(level.structuralStatus!=='complete')unsupported.push('incomplete source stream');
 if(![7,8].includes(level.header?.displaySizeRaw))unsupported.push('unqualified display-size selector');
 for(const block of level.blocks||[]){
  if(block.count&&!['SP','WL','DR','DS','WP','WA','TX',...(allowSlidingConnectors?['EX']:[]),...(allowTeleports?['HY']:[]),...(block.kind==='EL'&&(allowElevators||allowInactiveElevators&&block.records.every(r=>r.rawWords.length===6&&!((r.rawWords[4]*65536+r.rawWords[5])&activeMask)))?['EL']:[]),...(allowOil?['PU']:[]),...(allowSpecialDots?['WY']:[]),...(allowBombs?['BO','GO']:allowGoodies?['GO']:[])].includes(block.kind))unsupported.push('object class '+block.kind);
  if(block.kind==='DR'&&!allowInitiallyOpenDoors&&block.records.some(r=>!decodeDoorRecord(r).initiallyClosed))unsupported.push('initially open doors');
  if(block.kind==='SP')for(const spike of block.records){
   const mask=spike.rawWords[4]*65536+spike.rawWords[5];
   if(mask!==15&&(!Number.isInteger(mask)||!(allowInactiveSpikes&&!(mask&activeMask))))unsupported.push('conditional spike activation');
   if(allowGoodies&&!allowSlidingGoodies&&!allowSlidingOilGoodieRings&&!allowElevatorGoodies&&!allowColoredElevatorGoodies&&!allowMovingBombs&&(mask&activeMask))unsupported.push('goodies with active spikes');
  }
  if(block.kind==='WA')for(const actor of block.records){
   if(!(actor.activationMaskRaw&activeMask))continue;
   if(!(actor.actorTypeRaw in GROUPS)||actor.actorTypeRaw===4&&!allowRotatingSpikes)unsupported.push('actor type '+actor.actorTypeRaw);
   if(actor.actorTypeRaw===4&&allowRotatingSpikes){
    if(!allowEnemyStaticPrograms||!(actor.rawWords?.[7]===1||allowFastRotatingSpikes&&actor.rawWords?.[7]===5||allowSlowRotatingSpikes&&actor.rawWords?.[7]===4||allowClass2RotatingSpikes&&actor.rawWords?.[7]===2||allowClass3RotatingSpikes&&actor.rawWords?.[7]===3)||actorChecksWalls(actor.version12ByteRaw??1))unsupported.push('rotating spike canonical clock without walls');
    if(actor.rawWords?.[7]===4&&actor.programReferenceRaw>=0)unsupported.push('slow rotating spike requires a free clock');
    if(actor.rawWords?.[7]===2&&actor.programReferenceRaw>=0)unsupported.push('class2 rotating spike requires a free clock');
    if(actor.rawWords?.[7]===3&&actor.programReferenceRaw>=0)unsupported.push('class3 rotating spike requires a free clock');
    if(actor.programReferenceRaw>=0&&!isQualifiedOrbitalProgram(programs[actor.programReferenceRaw],{allowRotatingSpikeTransfers,allowRotatingSpikeBounces}))unsupported.push('rotating spike program capability');
    if(actor.programReferenceRaw>=0&&actor.rawWords?.[6]<1)unsupported.push('rotating spike program PC must skip length byte');
   }
   if(actor.programReferenceRaw>=0&&!(allowSlidingTeleports&&[0,6].includes(actor.actorTypeRaw))){
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
   const extendedClock=allowExtendedEnemyClocks&&allowEnemyStaticPrograms&&[1,2,3,...(allowRotatingSpikes&&allowFastRotatingSpikes?[4]:[])].includes(actor.actorTypeRaw)&&[2,5].includes(actor.rawWords?.[7])||allowClass2RotatingSpikes&&allowRotatingSpikes&&allowEnemyStaticPrograms&&actor.actorTypeRaw===4&&actor.rawWords?.[7]===2||allowClass3RotatingSpikes&&allowRotatingSpikes&&allowEnemyStaticPrograms&&actor.actorTypeRaw===4&&actor.rawWords?.[7]===3;
   if(!extendedClock&&!((allowBombs||(allowClass3Enemies&&[1,2,3].includes(actor.actorTypeRaw)))?[0,1,3,4]:[0,1,4]).includes(actor.rawWords?.[7]))unsupported.push('actor speed class '+actor.rawWords?.[7]);
  }
 }
 for(const cell of level.cells||[]){
  if(!cell.present)continue;
  const inactiveUpDown=allowInactiveUpDownDots&&[0x101,0x4101,...(allowBombOilElevators||allowElevatorGoodies?[0x301]:allowColoredElevatorGoodies?[0x201,0x301]:[])].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const inactiveWaypoint=allowInactiveProtectedWaypoints&&cell.flagsRaw===0x4051&&!(cell.secondaryRaw&activeMask);
  const inactiveRing=allowInactiveRings&&[0x9,0x4009].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const allowed=(allowMarkedTransfers?0x2000:0)|(allowMovingDots?0x80:0)|(allowSpecialDots?0x405f:0x4007)|(inactiveUpDown?cell.flagsRaw&0x300:0)|(allowElevators&&(cell.flagsRaw===0x201||(allowElevatorOilSpikes||allowBombOilElevators||allowSlidingConnectors)&&cell.flagsRaw===0x101||allowElevatorGoodies&&[0x4201,0x301].includes(cell.flagsRaw)||allowColoredElevatorGoodies&&[0x101,0x201,0x301].includes(cell.flagsRaw))&&(cell.secondaryRaw&activeMask)?cell.flagsRaw&0x300:0);
  if(cell.flagsRaw&~allowed)unsupported.push('special dot flags 0x'+(cell.flagsRaw&~allowed).toString(16));
  if((cell.flagsRaw&6)===6&&!allowCombinedGoalBonus)unsupported.push('combined bonus/goal callback');
  if(allowGoodies&&!allowSlidingOilGoodieRings&&(cell.flagsRaw&8))unsupported.push('goodies with rings');
  if(allowSpecialDots&&(cell.flagsRaw&0x58)&&![0x9,0x4009,0x4011,0x4041,...(allowMovingBombs?[0xc1,0x40c1]:[]),...(allowProtectedWaypoints?[0x4051]:[]),...(allowProtectedBonuses?[0x4043]:[])].includes(cell.flagsRaw))unsupported.push('combined special dot properties');
  if(cell.secondaryRaw===null)unsupported.push('legacy dot permissions');
  // Mask matches need no property clearing. Plain mask misses retain their
  // pivots; optional properties on a mask miss still require qualification.
  else if((cell.secondaryRaw&15)!==15&&!(allowActiveDotMasks&&(cell.secondaryRaw&activeMask))&&!(allowInactivePlainDotMasks&&!(cell.secondaryRaw&activeMask)&&!(cell.flagsRaw&~0x4001))&&!inactiveUpDown&&!inactiveRing&&!inactiveWaypoint)unsupported.push('conditional dot activation');
 }
 if(allowEnemyStaticPrograms&&allowOil&&!allowCanonicalOil&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length)unsupported.push('static enemy transfer with active Oil');
 if(allowSpecialDots&&(!Number.isInteger(level.header?.timeLimitRaw)||level.header.timeLimitRaw<0))unsupported.push('source Child timer specification');
 return [...new Set(unsupported)];
}

export function buildDecodedBoard(level,{ordinal,title,angularSpeed,activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowChildScoring=false,allowProtectedWaypoints=false,allowProtectedBonuses=false,allowInactiveProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCanonicalOil=false,allowCanonicalOilSpikes=false,allowElevators=false,allowElevatorGoodies=false,allowColoredElevatorGoodies=false,allowElevatorOilSpikes=false,allowBombOilElevators=false,allowSlidingBombs=false,allowSlidingBombCheckpoints=false,allowSlidingOil=false,allowSlidingOilGoodieRings=false,allowSlidingGoodiePrograms=false,allowSlidingGoodies=false,allowStaticSlidingPrograms=false,allowSlidingConnectors=false,allowTeleports=false,allowSlidingTeleports=false,allowMovingDots=false,allowMarkedTransfers=false,allowMovingMarkedGoals=false,allowMovingBombs=false,allowImportedGoodie169=false,allowCombinedGoalBonus=false}={}){
 const unsupported=levelRequirements(level,{activeMask,allowOil,allowInactiveSpikes,allowEnemyBouncePrograms,allowEnemyStaticPrograms,allowSpecialDots,allowBombs,allowClass3Enemies,allowActiveDotMasks,allowInactivePlainDotMasks,allowProtectedWaypoints,allowProtectedBonuses,allowInactiveProtectedWaypoints,allowGoodies,allowStaticEnemyWalls,allowExtendedEnemyClocks,allowProgrammedEnemyWalls,allowInitiallyOpenDoors,allowRotatingSpikes,allowFastRotatingSpikes,allowSlowRotatingSpikes,allowClass2RotatingSpikes,allowClass3RotatingSpikes,allowRotatingSpikeTransfers,allowRotatingSpikeBounces,allowInactiveElevators,allowInactiveUpDownDots,allowInactiveRings,allowBombObjectInteractions,allowCanonicalPlayer,allowCanonicalOil,allowCanonicalOilSpikes,allowElevators,allowElevatorGoodies,allowColoredElevatorGoodies,allowElevatorOilSpikes,allowBombOilElevators,allowSlidingBombs,allowSlidingBombCheckpoints,allowSlidingOil,allowSlidingOilGoodieRings,allowSlidingGoodiePrograms,allowSlidingGoodies,allowStaticSlidingPrograms,allowSlidingConnectors,allowTeleports,allowSlidingTeleports,allowMovingDots,allowMarkedTransfers,allowMovingMarkedGoals,allowMovingBombs,allowImportedGoodie169,allowCombinedGoalBonus,allowChildScoring});
 if(unsupported.length)throw new Error('Unsupported level requirements: '+unsupported.join(', '));
 if(!(angularSpeed>0))throw new RangeError('Explicit qualified or disclosed angular speed required');
 const origin=decodedGridOrigin(level.header);
 const dots=level.cells.filter(c=>c.present).map(c=>{
  const maskedCell=allowInactiveProtectedWaypoints&&c.flagsRaw===0x4051&&!(c.secondaryRaw&activeMask)?c.flagsRaw&~0x50:c.flagsRaw;
  const rawCell=allowMovingDots?effectiveMovingCell(maskedCell,c.secondaryRaw,activeMask):allowInactiveRings&&[0x9,0x4009].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?maskedCell&~8:maskedCell;
  const cell=allowInactiveUpDownDots&&[0x101,0x4101,...(allowBombOilElevators||allowElevatorGoodies?[0x301]:allowColoredElevatorGoodies?[0x201,0x301]:[])].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?rawCell&~0x300:rawCell;
  const state=decodeDot(cell);
  const upDown=allowElevators&&(c.flagsRaw===0x201||(allowElevatorOilSpikes||allowBombOilElevators||allowSlidingConnectors)&&c.flagsRaw===0x101||allowElevatorGoodies&&[0x4201,0x301].includes(c.flagsRaw)||allowColoredElevatorGoodies&&[0x101,0x201,0x301].includes(c.flagsRaw))&&(c.secondaryRaw&activeMask)?{group:((c.flagsRaw>>8)&3)-1,initialLowered:allowElevatorGoodies&&!!(c.flagsRaw&0x4000),x:origin.x+c.column*48,y:origin.y+c.row*48}:null;
  return {id:`${c.column},${c.row}`,sourceIndex:c.row*11+c.column,row:c.row,column:c.column,x:origin.x+c.column*48,y:origin.y+c.row*48,
   humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,
   present:true,motion:allowMovingDots&&(cell&0x80)?'moving-program':upDown?'up-down':'static',...(allowMarkedTransfers?{transferDeath:!!(cell&0x2000)}:{}),...(allowMovingDots?{motionType:cell&0x80?1:0,sourceInitialPosition:{x:origin.x+c.column*48,y:origin.y+c.row*48},...(cell&0x80?{movingProgram:c.inlineProgram.text,sourceMovingProgram:{offset:c.inlineProgram.offset,rawHex:c.inlineProgram.rawHex,paddingHex:c.inlineProgram.paddingHex}}:{})}:{}),...(upDown?{upDown}:{}),slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw,0),
   ring:allowSpecialDots&&!!(cell&8),protected:allowSpecialDots&&!!(cell&0x40),
   bonus:state.bonus,sourceInBackground:!(allowMovingDots&&(cell&0x80))&&!upDown&&!(cell&0x1e),
   cell,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};
 });
 const records=kind=>level.blocks.find(b=>b.kind===kind)?.records||[];
 if(allowSpecialDots)for(const record of records('WY')){
  const w=record.rawWords;if(w.length!==6)throw new Error('Unqualified WY version');
  if(!(((w[4]*65536)+w[5])&activeMask))continue;
  const dot=dots.find(d=>d.id===`${w[1]},${w[0]}`);if(!dot)throw new Error('Checkpoint on an absent dot');
  dot.waystation={halfIndex:w[2],direction:signedWord(w[3])};
 }
 const connectors=allowSlidingConnectors?connectorSpecs(records('EX'),dots):[];
 if(allowSlidingConnectors)initializeConnectorBonuses(connectors,dots);
 if(allowSlidingBombs||allowMovingBombs)initializeSlidingBombConnectors(connectors);
 const teleports=allowTeleports?pairTeleportSpecs(activeTeleportSpecs(records('HY'),activeMask),dots):[];
 for(const e of teleports)dots.find(d=>d.id===e.dot).teleport=true;
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
   group:GROUPS[a.actorTypeRaw],sourceSlot:index,...((allowSlidingTeleports||allowMovingDots)?{sourceRawRecord:records('WA').indexOf(a),sourceProgramReference:a.programReferenceRaw}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw??1)};
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
 const board={ordinal,title,resourceId:level.resourceId,origin,dots,radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,...(allowMovingMarkedGoals?{movingDotRules:true,markedTransferRules:true,movingMarkedGoalRules:true,connectors:[],elevators:[],teleports:[],movingHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`)}:{}),
  ...(allowSlidingConnectors?{slidingConnectorRules:true,...(allowSlidingTeleports?{slidingTeleportRules:true}:{}),...(allowMovingDots?{movingDotRules:true}:{}),...(allowMovingBombs?{movingBombRules:true,importedGoodie169Rules:allowImportedGoodie169,sourceProvenance:{sha256:level.sha256,byteLength:level.byteLength,resourceId:level.resourceId},movingHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`)}:{}),...(allowSlidingBombs?{slidingBombRules:true,...(allowSlidingBombCheckpoints?{slidingBombCheckpointRules:true}:{})}:{}),...(allowSlidingOil?{slidingOilRules:true,...(allowSlidingOilGoodieRings?{slidingOilGoodieRingRules:true}:{})}:{}),...(allowStaticSlidingPrograms?{staticSlidingProgramRules:true}:{}),...(allowSlidingGoodies?{slidingGoodieRules:true,...(allowSlidingGoodiePrograms?{slidingGoodieProgramRules:true}:{})}:{}),connectors,slidingHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`)}:{}),...(allowBombOilElevators?{bombOilElevatorRules:true}:{}),...(allowElevatorOilSpikes?{elevatorOilSpikeRules:true}:{}),...(allowElevatorGoodies?{elevatorGoodieRules:true}:{}),...(allowColoredElevatorGoodies?{coloredElevatorGoodieRules:true}:{}),...(allowElevators?{elevatorRules:true,elevators:activeElevatorSpecs(records('EL'),activeMask)}:{}),
  player:hand(actors[0],0),demos:[],enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),spikes,walls,doors,switches,
  puddles:allowOil?activePuddleSpecs(records('PU'),activeMask):[],
  ...(allowTeleports?{teleportRules:true,teleports,teleportHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`)}:{}),...(allowCanonicalPlayer?{canonicalPlayerRules:true}:{}),...(allowCanonicalOil?{canonicalOilRules:true}:{}),...(allowCanonicalOilSpikes?{canonicalOilSpikeRules:true}:{}),...(allowBombObjectInteractions?{bombObjectInteractionRules:true}:{}),...(allowCombinedGoalBonus?{combinedGoalBonusRules:true}:{}),...(allowRotatingSpikes?{rotatingSpikeRules:true,...(allowFastRotatingSpikes?{fastRotatingSpikeRules:true}:{}),...(allowSlowRotatingSpikes?{slowRotatingSpikeRules:true}:{}),...(allowClass2RotatingSpikes?{class2RotatingSpikeRules:true}:{}),...(allowClass3RotatingSpikes?{class3RotatingSpikeRules:true}:{}),...(allowRotatingSpikeTransfers?{rotatingSpikeTransferRules:true}:{}),...(allowRotatingSpikeBounces?{rotatingSpikeBounceRules:true}:{})}:{}),bombRules:allowBombs,goodieOnlyRules:allowGoodies&&!allowMovingBombs,staticEnemyWallRules:allowStaticEnemyWalls,bombs:allowBombs?records('BO'):[],goodies:(allowBombs||allowGoodies)?records('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&activeMask).map(r=>allowMovingBombs?importMovingGoodie(r,{sha256:level.sha256,byteLength:level.byteLength,resourceId:level.resourceId},{allowImportedGoodie169}):({row:r.rawWords[0],column:r.rawWords[1],initialFrame:r.rawWords[2]})):[],
  activeMask,difficulty:'Child',childScoreRules:allowChildScoring,sourceDotPermissions:true,specialDotRules:allowSpecialDots,staticEnemyCallbacks:allowEnemyStaticPrograms,timeLimit:level.header.timeLimitRaw,
  inactiveActorCount:records('WA').length-actors.length,
  texts:records('TX').map(t=>({font:t.fontName,size:t.fontSize,face:t.fontFaceRaw,
   style:t.renderingStyleByteRaw,x:t.positionWords[0]+28,y:t.positionWords[1]+28,
   text:t.text.startsWith('@')?t.text.slice(2):t.text,condition:t.text.startsWith('@')?t.text.slice(0,2):null}))};
 if(allowSlidingBombs)assertSlidingBombScope({...board,actors:[board.player,...board.enemies],initial:true,checkpoints:allowSlidingBombCheckpoints,activeSections:Object.fromEntries(level.blocks.map(b=>[b.kind,b.count]))});
 if(allowSlidingOil)assertSlidingOilScope({...board,actors:[board.player,...board.enemies],rich:allowSlidingOilGoodieRings,initial:true,activeSections:Object.fromEntries(level.blocks.map(b=>[b.kind,b.count]))});
 if(allowSlidingTeleports)assertSlidingTeleportScope({...board,actors:[board.player,...board.enemies],initial:true,activeSections:Object.fromEntries(level.blocks.map(b=>[b.kind,b.count]))});
 if(allowMovingMarkedGoals)assertMovingMarkedGoalScope({...board,actors:[board.player,...board.enemies],initial:true,humanStarts:board.movingHumanStarts,allowMarkedTransfers,activeSections:Object.fromEntries(level.blocks.map(b=>[b.kind,b.count]))});
 if(allowMovingBombs)assertMovingBombScope({...board,actors:[board.player,...board.enemies],initial:true,humanStarts:board.movingHumanStarts,allowImportedGoodie169,activeSections:Object.fromEntries(level.blocks.map(b=>[b.kind,b.count]))});
 return board;
}
