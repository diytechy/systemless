// Adapter for source-decoded private round data. No original map/text/art lives
// here. Successful structural decoding alone never enables unsupported rules.
import {TAU} from './engine.mjs';
import {decodeDot} from './dots.mjs';
import {spikeGridPoint,actorInitialFrame} from './hazards.mjs';

const GROUPS={0:700,1:500,2:4400,3:4500,6:4300};
const signedWord=n=>n>32767?n-65536:n;

export const sourceInitialFrame=actorInitialFrame;

export function levelRequirements(level){
 const unsupported=[];
 if(level.structuralStatus!=='complete')unsupported.push('incomplete source stream');
 if(level.header?.displaySizeRaw!==8)unsupported.push('unqualified small-board origin');
 for(const block of level.blocks||[]){
  if(block.count&&!['SP','WP','WA','TX'].includes(block.kind))unsupported.push('object class '+block.kind);
  if(block.kind==='WA')for(const actor of block.records){
   if(!(actor.actorTypeRaw in GROUPS))unsupported.push('actor type '+actor.actorTypeRaw);
   if(actor.programReferenceRaw>=0)unsupported.push('actor programs');
   if(![0,1].includes(actor.rawWords?.[7]))unsupported.push('actor speed class '+actor.rawWords?.[7]);
   if((actor.activationMaskRaw&15)!==15)unsupported.push('conditional actor activation');
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

export function buildDecodedBoard(level,{ordinal,title,angularSpeed}={}){
 const unsupported=levelRequirements(level);
 if(unsupported.length)throw new Error('Unsupported level requirements: '+unsupported.join(', '));
 if(!(angularSpeed>0))throw new RangeError('Explicit qualified or disclosed angular speed required');
 const origin={x:74,y:72};
 const dots=level.cells.filter(c=>c.present).map(c=>{
  const state=decodeDot(c.flagsRaw);
  return {id:`${c.column},${c.row}`,x:origin.x+c.column*48,y:origin.y+c.row*48,
   cell:c.flagsRaw,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};
 });
 const records=kind=>level.blocks.find(b=>b.kind===kind)?.records||[];
 const actors=records('WA');
 if(actors.length<2||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6)
  throw new Error('Unqualified human actor slot layout');
 const hand=(a,index)=>{
  const pivot=`${a.gridPosition.column},${a.gridPosition.row}`;
  if(!dots.some(d=>d.id===pivot))throw new Error('Actor starts on an absent dot');
  const direction=signedWord(a.rawWords[4]);
  if(![-1,1].includes(direction))throw new Error('Unqualified actor direction');
  return {name:index===0?'player':`enemy-${index}`,pivot,grabMask:15<<(a.actorTypeRaw*4),
   angle:sourceInitialFrame(a.initialFrameHalfIndexRaw)*TAU/64,direction,
   group:GROUPS[a.actorTypeRaw],sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7]};
 };
 const spikes=records('SP').map((r,index)=>({id:index,...spikeGridPoint(r,origin),phase:index%4,activationMask:r.rawWords[4]*65536+r.rawWords[5]}));
 if(spikes.some(s=>s.activationMask!==15))throw new Error('Conditional spike activation is unqualified');
 return {ordinal,title,resourceId:level.resourceId,dots,radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,
  player:hand(actors[0],0),demos:[],enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),spikes,
  texts:records('TX').map(t=>({font:t.fontName,size:t.fontSize,face:t.fontFaceRaw,
   style:t.renderingStyleByteRaw,x:t.positionWords[0]+28,y:t.positionWords[1]+28,
   text:t.text.startsWith('@')?t.text.slice(2):t.text,condition:t.text.startsWith('@')?t.text.slice(0,2):null}))};
}
