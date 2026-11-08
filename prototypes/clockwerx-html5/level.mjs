// Adapter for source-decoded private round data. No original map/text/art lives
// here. Successful structural decoding alone never enables unsupported rules.
import {TAU} from './engine.mjs';
import {decodeDot} from './dots.mjs';
import {spikeGridPoint,actorInitialFrame,actorTiming} from './hazards.mjs';
import {compileWallTiles,actorChecksWalls} from './walls.mjs';
import {decodeDoorRecord,decodeSwitchRecord,doorGeometry,switchGeometry} from './doors.mjs';
import {activePuddleSpecs} from './oil.mjs';

const GROUPS={0:700,1:500,2:4400,3:4500,6:4300};
const signedWord=n=>n>32767?n-65536:n;

export function decodedGridOrigin(header){
 if(![7,8].includes(header?.displaySizeRaw))throw new Error('Unqualified display-size selector');
 const columns=header.displaySizeRaw===8?11:10,rows=header.displaySizeRaw===8?8:7;
 return {x:74+(11-columns)*24,y:72+(8-rows)*24};
}

export const sourceInitialFrame=actorInitialFrame;

export function levelRequirements(level,{activeMask=1,allowOil=false,allowEnemyBouncePrograms=false}={}){
 const unsupported=[];
 const programs=level.blocks?.find(b=>b.kind==='WP')?.records.map(r=>r.text)||[];
 if(activeMask!==1)unsupported.push('unqualified difficulty clock');
 if(level.structuralStatus!=='complete')unsupported.push('incomplete source stream');
 if(![7,8].includes(level.header?.displaySizeRaw))unsupported.push('unqualified display-size selector');
 for(const block of level.blocks||[]){
  if(block.count&&!['SP','WL','DR','DS','WP','WA','TX',...(allowOil?['PU']:[])].includes(block.kind))unsupported.push('object class '+block.kind);
  if(block.kind==='WA')for(const actor of block.records){
   if(!(actor.activationMaskRaw&activeMask))continue;
   if(!(actor.actorTypeRaw in GROUPS))unsupported.push('actor type '+actor.actorTypeRaw);
   if(actor.programReferenceRaw>=0){
    const program=programs[actor.programReferenceRaw],pc=actor.rawWords?.[6];
    if(!allowEnemyBouncePrograms)unsupported.push('actor programs');
    else{
     if(![1,2,3].includes(actor.actorTypeRaw)||typeof program!=='string'||!program.length||program.length>255||[...program].some(c=>c!=='b'))unsupported.push('non-bounce actor program');
     if(!Number.isInteger(pc)||pc<0||pc>(program?.length??0))unsupported.push('source program PC');
     if(pc===0&&[102,115].includes(program?.length))unsupported.push('length-byte program transfer');
     if(actorChecksWalls(actor.version12ByteRaw??1))unsupported.push('programmed wall-reacting actor');
    }
   }
   if(![0,1,4].includes(actor.rawWords?.[7]))unsupported.push('actor speed class '+actor.rawWords?.[7]);
  }
 }
 for(const cell of level.cells||[]){
  if(!cell.present)continue;
  if(cell.flagsRaw&~0x4007)unsupported.push('special dot flags 0x'+(cell.flagsRaw&~0x4007).toString(16));
  if(cell.secondaryRaw===null)unsupported.push('legacy dot permissions');
  else if((cell.secondaryRaw&15)!==15)unsupported.push('conditional dot activation');
 }
 return [...new Set(unsupported)];
}

export function buildDecodedBoard(level,{ordinal,title,angularSpeed,activeMask=1,allowOil=false,allowEnemyBouncePrograms=false}={}){
 const unsupported=levelRequirements(level,{activeMask,allowOil,allowEnemyBouncePrograms});
 if(unsupported.length)throw new Error('Unsupported level requirements: '+unsupported.join(', '));
 if(!(angularSpeed>0))throw new RangeError('Explicit qualified or disclosed angular speed required');
 const origin=decodedGridOrigin(level.header);
 const dots=level.cells.filter(c=>c.present).map(c=>{
  const state=decodeDot(c.flagsRaw);
  return {id:`${c.column},${c.row}`,sourceIndex:c.row*11+c.column,x:origin.x+c.column*48,y:origin.y+c.row*48,
   humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,
   cell:c.flagsRaw,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};
 });
 const records=kind=>level.blocks.find(b=>b.kind===kind)?.records||[];
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
   program,sourcePC:program?a.rawWords[6]:undefined,frame:program?frame:undefined,unwrappedFrame:program?frame:undefined,
   group:GROUPS[a.actorTypeRaw],sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw??1)};
 };
 const spikes=records('SP').map((r,index)=>({id:index,...spikeGridPoint(r,origin),phase:index%4,activationMask:r.rawWords[4]*65536+r.rawWords[5]}));
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
  activeMask,difficulty:'Child',inactiveActorCount:records('WA').length-actors.length,
  texts:records('TX').map(t=>({font:t.fontName,size:t.fontSize,face:t.fontFaceRaw,
   style:t.renderingStyleByteRaw,x:t.positionWords[0]+28,y:t.positionWords[1]+28,
   text:t.text.startsWith('@')?t.text.slice(2):t.text,condition:t.text.startsWith('@')?t.text.slice(0,2):null}))};
}
