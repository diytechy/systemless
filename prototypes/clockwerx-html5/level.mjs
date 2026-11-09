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

const GROUPS={0:700,1:500,2:4400,3:4500,4:3500,6:4300};
const signedWord=n=>n>32767?n-65536:n;

export function decodedGridOrigin(header){
 if(![7,8].includes(header?.displaySizeRaw))throw new Error('Unqualified display-size selector');
 const columns=header.displaySizeRaw===8?11:10,rows=header.displaySizeRaw===8?8:7;
 return {x:74+(11-columns)*24,y:72+(8-rows)*24};
}

export const sourceInitialFrame=actorInitialFrame;

export function levelRequirements(level,{activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowProtectedWaypoints=false,allowProtectedBonuses=false,allowInactiveProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCanonicalOil=false,allowCanonicalOilSpikes=false,allowElevators=false,allowElevatorGoodies=false,allowColoredElevatorGoodies=false,allowElevatorOilSpikes=false,allowBombOilElevators=false,allowTeleports=false,allowCombinedGoalBonus=false,allowChildScoring=false}={}){
 const unsupported=[];
 if(allowElevators&&!allowBombOilElevators&&!allowElevatorGoodies&&!allowColoredElevatorGoodies){
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
 if(allowElevatorOilSpikes){
  if(!allowElevators||!allowCanonicalOil||!allowOil||allowCanonicalOilSpikes)unsupported.push('elevator Oil/spikes require the separate canonical group0 composition');
  const puddles=activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask);
  if(!puddles.length||puddles.some(p=>p.kind!==3)||!level.blocks?.find(b=>b.kind==='SP')?.records.some(r=>(r.rawWords[4]*65536+r.rawWords[5])&activeMask))unsupported.push('elevator Oil/spikes require kind3 puddles and active static spikes');
 }
 if(allowCanonicalPlayer&&(!allowEnemyStaticPrograms||allowOil&&!allowCanonicalOil&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length))unsupported.push("canonical player requires static Child actor callbacks without sliding");
 if(allowCanonicalOil&&!allowBombOilElevators){
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
 if(allowBombs&&allowGoodies)unsupported.push('exclusive bomb or goodie-only scope required');
 if(allowGoodies&&!allowSpecialDots)unsupported.push('goodie-only source timer qualification');
 if((allowClass2RotatingSpikes||allowClass3RotatingSpikes)&&(!allowRotatingSpikes||!allowEnemyStaticPrograms))unsupported.push('class2/3 orbitals require canonical rotating-spike callbacks');
 const programs=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
 // First HY family: static Child ordinary dots/rings, spikes and class1
 // free ordinary hands / n-only orbitals. Later combinations stay gated.
 if(allowTeleports){
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
  if(block.count&&!['SP','WL','DR','DS','WP','WA','TX',...(allowTeleports?['HY']:[]),...(block.kind==='EL'&&(allowElevators||allowInactiveElevators&&block.records.every(r=>r.rawWords.length===6&&!((r.rawWords[4]*65536+r.rawWords[5])&activeMask)))?['EL']:[]),...(allowOil?['PU']:[]),...(allowSpecialDots?['WY']:[]),...(allowBombs?['BO','GO']:allowGoodies?['GO']:[])].includes(block.kind))unsupported.push('object class '+block.kind);
  if(block.kind==='DR'&&!allowInitiallyOpenDoors&&block.records.some(r=>!decodeDoorRecord(r).initiallyClosed))unsupported.push('initially open doors');
  if(block.kind==='SP')for(const spike of block.records){
   const mask=spike.rawWords[4]*65536+spike.rawWords[5];
   if(mask!==15&&(!Number.isInteger(mask)||!(allowInactiveSpikes&&!(mask&activeMask))))unsupported.push('conditional spike activation');
   if(allowGoodies&&!allowElevatorGoodies&&!allowColoredElevatorGoodies&&(mask&activeMask))unsupported.push('goodies with active spikes');
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
   const extendedClock=allowExtendedEnemyClocks&&allowEnemyStaticPrograms&&[1,2,3,...(allowRotatingSpikes&&allowFastRotatingSpikes?[4]:[])].includes(actor.actorTypeRaw)&&[2,5].includes(actor.rawWords?.[7])||allowClass2RotatingSpikes&&allowRotatingSpikes&&allowEnemyStaticPrograms&&actor.actorTypeRaw===4&&actor.rawWords?.[7]===2||allowClass3RotatingSpikes&&allowRotatingSpikes&&allowEnemyStaticPrograms&&actor.actorTypeRaw===4&&actor.rawWords?.[7]===3;
   if(!extendedClock&&!((allowBombs||(allowClass3Enemies&&[1,2,3].includes(actor.actorTypeRaw)))?[0,1,3,4]:[0,1,4]).includes(actor.rawWords?.[7]))unsupported.push('actor speed class '+actor.rawWords?.[7]);
  }
 }
 for(const cell of level.cells||[]){
  if(!cell.present)continue;
  const inactiveUpDown=allowInactiveUpDownDots&&[0x101,0x4101,...(allowBombOilElevators||allowElevatorGoodies?[0x301]:allowColoredElevatorGoodies?[0x201,0x301]:[])].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const inactiveWaypoint=allowInactiveProtectedWaypoints&&cell.flagsRaw===0x4051&&!(cell.secondaryRaw&activeMask);
  const inactiveRing=allowInactiveRings&&[0x9,0x4009].includes(cell.flagsRaw)&&!(cell.secondaryRaw&activeMask);
  const allowed=(allowSpecialDots?0x405f:0x4007)|(inactiveUpDown?cell.flagsRaw&0x300:0)|(allowElevators&&(cell.flagsRaw===0x201||(allowElevatorOilSpikes||allowBombOilElevators)&&cell.flagsRaw===0x101||allowElevatorGoodies&&[0x4201,0x301].includes(cell.flagsRaw)||allowColoredElevatorGoodies&&[0x101,0x201,0x301].includes(cell.flagsRaw))&&(cell.secondaryRaw&activeMask)?cell.flagsRaw&0x300:0);
  if(cell.flagsRaw&~allowed)unsupported.push('special dot flags 0x'+(cell.flagsRaw&~allowed).toString(16));
  if((cell.flagsRaw&6)===6&&!allowCombinedGoalBonus)unsupported.push('combined bonus/goal callback');
  if(allowGoodies&&(cell.flagsRaw&8))unsupported.push('goodies with rings');
  if(allowSpecialDots&&(cell.flagsRaw&0x58)&&![0x9,0x4009,0x4011,0x4041,...(allowProtectedWaypoints?[0x4051]:[]),...(allowProtectedBonuses?[0x4043]:[])].includes(cell.flagsRaw))unsupported.push('combined special dot properties');
  if(cell.secondaryRaw===null)unsupported.push('legacy dot permissions');
  // Mask matches need no property clearing. Plain mask misses retain their
  // pivots; optional properties on a mask miss still require qualification.
  else if((cell.secondaryRaw&15)!==15&&!(allowActiveDotMasks&&(cell.secondaryRaw&activeMask))&&!(allowInactivePlainDotMasks&&!(cell.secondaryRaw&activeMask)&&!(cell.flagsRaw&~0x4001))&&!inactiveUpDown&&!inactiveRing&&!inactiveWaypoint)unsupported.push('conditional dot activation');
 }
 if(allowEnemyStaticPrograms&&allowOil&&!allowCanonicalOil&&activePuddleSpecs(level.blocks?.find(b=>b.kind==='PU')?.records||[],activeMask).length)unsupported.push('static enemy transfer with active Oil');
 if(allowSpecialDots&&(!Number.isInteger(level.header?.timeLimitRaw)||level.header.timeLimitRaw<0))unsupported.push('source Child timer specification');
 return [...new Set(unsupported)];
}

export function buildDecodedBoard(level,{ordinal,title,angularSpeed,activeMask=1,allowOil=false,allowInactiveSpikes=false,allowEnemyBouncePrograms=false,allowEnemyStaticPrograms=false,allowSpecialDots=false,allowBombs=false,allowClass3Enemies=false,allowActiveDotMasks=false,allowInactivePlainDotMasks=false,allowChildScoring=false,allowProtectedWaypoints=false,allowProtectedBonuses=false,allowInactiveProtectedWaypoints=false,allowGoodies=false,allowStaticEnemyWalls=false,allowExtendedEnemyClocks=false,allowProgrammedEnemyWalls=false,allowInitiallyOpenDoors=false,allowRotatingSpikes=false,allowFastRotatingSpikes=false,allowSlowRotatingSpikes=false,allowClass2RotatingSpikes=false,allowClass3RotatingSpikes=false,allowRotatingSpikeTransfers=false,allowRotatingSpikeBounces=false,allowInactiveElevators=false,allowInactiveUpDownDots=false,allowInactiveRings=false,allowBombObjectInteractions=false,allowCanonicalPlayer=false,allowCanonicalOil=false,allowCanonicalOilSpikes=false,allowElevators=false,allowElevatorGoodies=false,allowColoredElevatorGoodies=false,allowElevatorOilSpikes=false,allowBombOilElevators=false,allowTeleports=false,allowCombinedGoalBonus=false}={}){
 const unsupported=levelRequirements(level,{activeMask,allowOil,allowInactiveSpikes,allowEnemyBouncePrograms,allowEnemyStaticPrograms,allowSpecialDots,allowBombs,allowClass3Enemies,allowActiveDotMasks,allowInactivePlainDotMasks,allowProtectedWaypoints,allowProtectedBonuses,allowInactiveProtectedWaypoints,allowGoodies,allowStaticEnemyWalls,allowExtendedEnemyClocks,allowProgrammedEnemyWalls,allowInitiallyOpenDoors,allowRotatingSpikes,allowFastRotatingSpikes,allowSlowRotatingSpikes,allowClass2RotatingSpikes,allowClass3RotatingSpikes,allowRotatingSpikeTransfers,allowRotatingSpikeBounces,allowInactiveElevators,allowInactiveUpDownDots,allowInactiveRings,allowBombObjectInteractions,allowCanonicalPlayer,allowCanonicalOil,allowCanonicalOilSpikes,allowElevators,allowElevatorGoodies,allowColoredElevatorGoodies,allowElevatorOilSpikes,allowBombOilElevators,allowTeleports,allowCombinedGoalBonus,allowChildScoring});
 if(unsupported.length)throw new Error('Unsupported level requirements: '+unsupported.join(', '));
 if(!(angularSpeed>0))throw new RangeError('Explicit qualified or disclosed angular speed required');
 const origin=decodedGridOrigin(level.header);
 const dots=level.cells.filter(c=>c.present).map(c=>{
  const maskedCell=allowInactiveProtectedWaypoints&&c.flagsRaw===0x4051&&!(c.secondaryRaw&activeMask)?c.flagsRaw&~0x50:c.flagsRaw;
  const rawCell=allowInactiveRings&&[0x9,0x4009].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?maskedCell&~8:maskedCell;
  const cell=allowInactiveUpDownDots&&[0x101,0x4101,...(allowBombOilElevators||allowElevatorGoodies?[0x301]:allowColoredElevatorGoodies?[0x201,0x301]:[])].includes(c.flagsRaw)&&!(c.secondaryRaw&activeMask)?rawCell&~0x300:rawCell;
  const state=decodeDot(cell);
  const upDown=allowElevators&&(c.flagsRaw===0x201||(allowElevatorOilSpikes||allowBombOilElevators)&&c.flagsRaw===0x101||allowElevatorGoodies&&[0x4201,0x301].includes(c.flagsRaw)||allowColoredElevatorGoodies&&[0x101,0x201,0x301].includes(c.flagsRaw))&&(c.secondaryRaw&activeMask)?{group:((c.flagsRaw>>8)&3)-1,initialLowered:allowElevatorGoodies&&!!(c.flagsRaw&0x4000),x:origin.x+c.column*48,y:origin.y+c.row*48}:null;
  return {id:`${c.column},${c.row}`,sourceIndex:c.row*11+c.column,row:c.row,column:c.column,x:origin.x+c.column*48,y:origin.y+c.row*48,
   humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,
   present:true,motion:upDown?'up-down':'static',...(upDown?{upDown}:{}),slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw,0),
   ring:allowSpecialDots&&!!(cell&8),protected:allowSpecialDots&&!!(cell&0x40),
   bonus:state.bonus,sourceInBackground:!upDown&&!(cell&0x1e),
   cell,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};
 });
 const records=kind=>level.blocks.find(b=>b.kind===kind)?.records||[];
 if(allowSpecialDots)for(const record of records('WY')){
  const w=record.rawWords;if(w.length!==6)throw new Error('Unqualified WY version');
  if(!(((w[4]*65536)+w[5])&activeMask))continue;
  const dot=dots.find(d=>d.id===`${w[1]},${w[0]}`);if(!dot)throw new Error('Checkpoint on an absent dot');
  dot.waystation={halfIndex:w[2],direction:signedWord(w[3])};
 }
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
  ...(allowBombOilElevators?{bombOilElevatorRules:true}:{}),...(allowElevatorOilSpikes?{elevatorOilSpikeRules:true}:{}),...(allowElevatorGoodies?{elevatorGoodieRules:true}:{}),...(allowColoredElevatorGoodies?{coloredElevatorGoodieRules:true}:{}),...(allowElevators?{elevatorRules:true,elevators:activeElevatorSpecs(records('EL'),activeMask)}:{}),
  player:hand(actors[0],0),demos:[],enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),spikes,walls,doors,switches,
  puddles:allowOil?activePuddleSpecs(records('PU'),activeMask):[],
  ...(allowTeleports?{teleportRules:true,teleports,teleportHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`)}:{}),...(allowCanonicalPlayer?{canonicalPlayerRules:true}:{}),...(allowCanonicalOil?{canonicalOilRules:true}:{}),...(allowCanonicalOilSpikes?{canonicalOilSpikeRules:true}:{}),...(allowBombObjectInteractions?{bombObjectInteractionRules:true}:{}),...(allowCombinedGoalBonus?{combinedGoalBonusRules:true}:{}),...(allowRotatingSpikes?{rotatingSpikeRules:true,...(allowFastRotatingSpikes?{fastRotatingSpikeRules:true}:{}),...(allowSlowRotatingSpikes?{slowRotatingSpikeRules:true}:{}),...(allowClass2RotatingSpikes?{class2RotatingSpikeRules:true}:{}),...(allowClass3RotatingSpikes?{class3RotatingSpikeRules:true}:{}),...(allowRotatingSpikeTransfers?{rotatingSpikeTransferRules:true}:{}),...(allowRotatingSpikeBounces?{rotatingSpikeBounceRules:true}:{})}:{}),bombRules:allowBombs,goodieOnlyRules:allowGoodies,staticEnemyWallRules:allowStaticEnemyWalls,bombs:allowBombs?records('BO'):[],goodies:(allowBombs||allowGoodies)?records('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&activeMask).map(r=>({row:r.rawWords[0],column:r.rawWords[1],initialFrame:r.rawWords[2]})):[],
  activeMask,difficulty:'Child',childScoreRules:allowChildScoring,sourceDotPermissions:true,specialDotRules:allowSpecialDots,staticEnemyCallbacks:allowEnemyStaticPrograms,timeLimit:level.header.timeLimitRaw,
  inactiveActorCount:records('WA').length-actors.length,
  texts:records('TX').map(t=>({font:t.fontName,size:t.fontSize,face:t.fontFaceRaw,
   style:t.renderingStyleByteRaw,x:t.positionWords[0]+28,y:t.positionWords[1]+28,
   text:t.text.startsWith('@')?t.text.slice(2):t.text,condition:t.text.startsWith('@')?t.text.slice(0,2):null}))};
}
