import {validateConnectorBoard,connectorLook} from './sliding.mjs';
import {validateBombWallTiles} from './walls.mjs';

// Separate BO/static EX capability. Current starter permission is human-only;
// class2/3, GO, moving pivots and richer object joins require their own scope.
export function assertSlidingBombScope({dots=[],actors=[],connectors=[],bombs=[],walls=[],activeSections={},initial=false,checkpoints=false}={}){
 if(!Array.isArray(dots)||!Array.isArray(actors)||!Array.isArray(bombs)||!bombs.length)throw new Error('Explicit BO/static EX inventory required');
 validateConnectorBoard(connectors,dots);
 if(checkpoints){if(!walls.length||!dots.some(d=>d.waystation&&d.protected)||activeSections.SP>0)throw new Error('Separate BO/EX/protected WY/wall composition without SP required');validateBombWallTiles(walls);}
 for(const e of connectors)if(typeof e.sourceInitialBonus!=='boolean'||typeof e.sourceHasSprite!=='boolean'||typeof e.burnt!=='boolean'||typeof e.bonus!=='boolean'||e.sourceHasSprite!==e.sourceInitialBonus||initial&&(e.sourceInitialBonus!==e.bonus||e.burnt))throw new Error('BO/EX requires immutable source initial bonus/optimized identity and clean initial links');
 for(const[k,n]of Object.entries(activeSections))if(!Number.isInteger(n)||n<0||n&&!['BO','EX','SP','WP','WA','TX',...(checkpoints?['WY','WL']:[])].includes(k))throw new Error('Unqualified BO/EX section '+k);
 if(activeSections.BO!==undefined&&activeSections.BO!==bombs.length||activeSections.EX!==undefined&&activeSections.EX!==connectors.length)throw new Error('Matching BO/EX inventory required');
 for(const b of bombs){const w=b.rawWords,kind=w?.[2]??b.kind,flags=w?(w[3]>>>8):(b.flags??0);if(!Number.isInteger(kind)||kind<0||kind>13||kind>=10&&flags!==0)throw new Error('BO/EX requires human-only starters');}
 for(const d of dots){
  if(d.motion!=='static'||d.moving||d.movingProgram||d.upDown||d.teleport!==false||d.transferDeath||d.slowdown||d.sourceBombDynamic||d.connector||d.present!==true||d.burnt!==undefined&&typeof d.burnt!=='boolean'||initial&&d.burnt||['present','humanCanGrab','nonhumanCanGrab','sourceInBackground','ring','bonus'].some(k=>typeof d[k]!=='boolean')||!Number.isInteger(d.color)||d.color<0||d.color>7||!d.ring&&d.humanCanGrab!==true||d.nonhumanCanGrab!==true||initial&&d.humanCanGrab!==true||!checkpoints&&(d.protected||d.waystation)||d.ring&&(checkpoints||d.color!==0||d.slideMask||d.bonus||d.kind!=='dot')||d.protected&&(!d.waystation||d.color!==0)||d.waystation&&(!checkpoints||!d.protected||d.color!==0)||d.slideMask&&(d.ring||d.protected||d.waystation||d.kind==='goal'||d.humanCanGrab!==true||d.nonhumanCanGrab!==true))throw new Error('BO/EX static ordinary endpoints and disjoint white ring or protected WY required');
 }
 let previous=-1;
 for(const a of actors){const human=[0,6].includes(a.sourceActorType);if(a.movingPivot||![0,1,2,3,6].includes(a.sourceActorType)||!Number.isInteger(a.sourceSlot)||a.sourceSlot<0||a.sourceSlot>30||a.sourceSlot<=previous||human!==(a.sourceSlot<2)||(human?a.speedClass!==0:a.speedClass!==1||a.checksWalls!==false||a.program!==null&&(!/^[bfns]+$/.test(a.program)||!Number.isInteger(a.sourcePC)||a.sourcePC<1||a.sourcePC>a.program.length)))throw new Error('BO/EX ordinary wall-free class1 b/f/n/s actors and source slots0..30 required');previous=a.sourceSlot;}
 return true;
}

// EXOptimize runs once after the initial bonus closure. A retained sprite is
// never optimized away when its bonus clears. Cache the raw reset declaration.
export function initializeSlidingBombConnectors(connectors){
 for(const e of connectors){e.sourceInitialBonus=e.bonus===true;e.sourceHasSprite=e.bonus===true;e.burnt=false;}
}

// DOUnbonus4944 -> EXUnbonus5efa -> DOUnbonus(first),DOUnbonus(second).
// A changed guard at both kinds of node terminates cycles. Burning changes
// state even when already unbonused; it never alters permissions/directions.
// Paint adapters run at their source call sites, including background repaint
// of unchanged burnt nodes after a new crater. This function never awards.
export function unbonusSlidingComponent(connectors,dots,id,{burnt=false,onDot=()=>{},onConnector=()=>{}}={}){
 if(typeof burnt!=='boolean'||typeof onDot!=='function'||typeof onConnector!=='function')throw new TypeError('Synchronous EX unbonus adapters required');
 const result={dots:[],connectors:[]},at=id=>{const d=dots.find(d=>d.id===id);if(!d)throw new Error('Unknown EX endpoint');return d;};
 const call=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw new TypeError('Synchronous EX paint adapter required');};
 const dot=d=>{
  if(!d.humanCanGrab)return;
  let changed=false;
  if(burnt&&!d.ring&&!d.burnt){d.burnt=true;changed=true;}
  if(d.bonus){d.bonus=false;d.cell&=~2;d.collected=true;if(d.kind==='bonus')d.kind='dot';changed=true;}
  if(changed){result.dots.push(d.id);for(const e of connectors)if(e.first===d.id||e.second===d.id)link(e);}
  if(changed||burnt&&d.sourceInBackground)call(onDot,d,{changed,paintBackground:burnt&&d.sourceInBackground,updateSpriteRange:changed&&!d.sourceInBackground,burnt});
 };
 const link=e=>{
  let changed=false;
  if(burnt&&!e.burnt){e.burnt=true;changed=true;}
  if(e.bonus){e.bonus=false;changed=true;}
  if(e.sourceHasSprite?changed:burnt)call(onConnector,e,{changed,paintBackground:!e.sourceHasSprite,updateSpriteRange:e.sourceHasSprite&&changed,frame:connectorLook(e,dots),burnt});
  if(changed){result.connectors.push(e.id);dot(at(e.first));dot(at(e.second));}
 };
 dot(at(id));return result;
}
