// Default-off static Child EX, color2 east-firing GN/TR and ordinary b/f/n/s actors.
// Optional, separately flagged hazard extension (Slaughter98): static SP spikes, WL walls and
// GN/TR of any source color/placement/direction. Box96 behaviour is unchanged when it is off.
import {decodeDot,dotColorOffset} from './dots.mjs';
import {actorInitialFrame,actorTiming,spikeGridPoint} from './hazards.mjs';
import {actorChecksWalls,compileWallTiles} from './walls.mjs';
import {connectorSpecs,initializeConnectorBonuses,validateConnectorBoard} from './sliding.mjs';
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';
const fail=()=>{throw Error('Separate static EX, color2 east-firing guns/triggers and ordinary class1 programs required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const groups={0:700,6:4300,1:500,2:4400,3:4500};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const v of Object.values(o))frozen(v);Object.freeze(o);}return o;};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','SlidingConnectors','GunsTriggers'];
const optional=['StaticGunRailHazards'];
const geometry={frameOrigin:{x:28,y:28},rawBounds:{left:0,top:0,right:584,bottom:424}};
const hazardsOf=o=>o?.allowStaticGunRailHazards===true||o?.staticGunRailHazardRules===true;
export function assertStaticGunRailRecipe(o){
 if(o?.allowStaticGunRails!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowStaticGunRails'&&!required.includes(k.slice(5))&&!optional.includes(k.slice(5)))fail();return true;
}
function wallSpecs(s){return rows(s,'WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]}));}
function assertHazardRecords(s){
 for(const r of rows(s,'WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 compileWallTiles(wallSpecs(s));
 for(const r of rows(s,'SP')){const w=r.rawWords;if(w?.length!==6||!int(w[0],0,7)||!int(w[1],0,10)||!int(w[2],0,3)||!int(w[3],0,3)||w[4]!==0||!int(w[5],0,65535))fail();}
 // Only unconditional (all-difficulty) static spikes are admitted; conditional masks stay unqualified.
 if(rows(s,'SP').some(r=>r.rawWords[5]&1&&r.rawWords[5]!==15))fail();
}
export function assertStaticGunRailActor(a,{program=a?.program}={}){
 const t=a?.sourceActorType,h=a?.sourceSlot<2;
 if(!int(a?.sourceSlot,0,30)||!groups[t]||a.group!==groups[t]&&!(a.sourceSlot===0&&t===0&&a.group===4300)||program!==a.program||typeof a.checksWalls!=='boolean'||a.movingPivot)fail();
 if(h){if(t!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else if(a.speedClass!==1||a.checksWalls||program!==null&&(typeof program!=='string'||!/^[bfns]+$/.test(program)||!int(program.length,1,255)||!int(a.sourcePC,1,program.length)))fail();return true;
}
function gunSpecs(s,hazards=false){
 const g={gridOrigin:{x:74,y:72},frameOrigin:geometry.frameOrigin,activeMask:1},guns=activeGunTriggerSpecs(rows(s,'GN'),{kind:'GN',...g}),triggers=activeGunTriggerSpecs(rows(s,'TR'),{kind:'TR',...g});
 if(!guns.length||!triggers.length)fail();
 // activeGunTriggerSpecs already range-checks color0-2/placement1-3/directions1-15 for the hazard extension.
 if(!hazards&&(guns.some(g=>g.color!==2||g.placement!==3||g.directions!==2)||triggers.some(t=>t.color!==2||t.placement!==2)))fail();return{guns,triggers,...structuredClone(geometry)};
}
export function assertStaticGunRailSource(s,{hazards=false}={}){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||!int(s.header.timeLimitRaw,1,65535)||s.cells?.length!==88||!Array.isArray(s.blocks)||typeof hazards!=='boolean')fail();
 const kinds=['WA','WP','EX','GN','TR','TX',...(hazards?['SP','WL']:[])];
 const seen=new Set();for(const b of s.blocks){if(seen.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!kinds.includes(b.kind))fail();seen.add(b.kind);}
 if(hazards){assertHazardRecords(s);if(!rows(s,'SP').some(r=>r.rawWords[5]&1)&&!rows(s,'WL').length)fail();}
 let goals=0;for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,5].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535)||c.inlineProgram)fail();
  if(!c.present)continue;if(!(c.secondaryRaw&1)||dotColorOffset(c.secondaryRaw)>5)fail();if(c.flagsRaw&4){goals++;if(dotColorOffset(c.secondaryRaw)!==0)fail();}
 }
 if(goals!==1||!rows(s,'EX').length||rows(s,'EX').length>61)fail();
 const ds=s.cells.filter(c=>c.present).map(c=>({id:c.column+','+c.row,row:c.row,column:c.column,present:true,motion:'static'})),ex=connectorSpecs(rows(s,'EX'),ds),endpoints=new Set(ex.flatMap(e=>[e.first,e.second]));
 if([...endpoints].some(id=>{const d=ds.find(d=>d.id===id);return s.cells[d.row*11+d.column].flagsRaw&4;}))fail();gunSpecs(s,hazards);
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');if(active.length<3||active.length>31)fail();
 for(const p of ps)if(typeof p.text!=='string'||!/^[bfns]+$/.test(p.text)||!int(p.text.length,1,255))fail();
 for(const[i,a]of active.entries()){
  const w=a.rawWords,c=s.cells[a.gridPosition?.row*11+a.gridPosition?.column],program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c?.present||w?.length!==11||w[0]!==c.row||w[1]!==c.column||w[2]!==a.actorTypeRaw||w[3]!==a.initialFrameHalfIndexRaw||!int(w[3],0,63)||![1,65535].includes(w[4])||a.programReferenceRaw!==(w[5]===65535?-1:w[5])||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||i<2&&(c.flagsRaw!==1||endpoints.has(c.column+','+c.row)))fail();
  assertStaticGunRailActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program,sourcePC:w[6]});
 }return true;
}
function declarations(s,o){
 const {ordinal,title,angularSpeed}=o,hazards=hazardsOf(o);
 const walls=hazards?compileWallTiles(wallSpecs(s)).map((t,id)=>({id,...t,x:74+48*t.column,y:72+48*t.row})):[];
 const spikes=hazards?rows(s,'SP').filter(r=>r.rawWords[5]&1).map((r,id)=>({id,row:r.rawWords[0],column:r.rawWords[1],subrow:r.rawWords[2],subcolumn:r.rawWords[3],...spikeGridPoint(r,{x:74,y:72}),phase:id%4,activationMask:r.rawWords[4]*65536+r.rawWords[5]})):[];
 const dots=s.cells.filter(c=>c.present).map(c=>{const v=decodeDot(c.flagsRaw);return{id:c.column+','+c.row,sourceIndex:c.index,row:c.row,column:c.column,x:74+48*c.column,y:72+48*c.row,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:'static',slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),protected:false,ring:false,bonus:v.bonus,sourceInitialBonus:v.bonus,sourceInBackground:!(c.flagsRaw&0x1e),sourceHasSprite:!!(c.flagsRaw&0x1e),cell:c.flagsRaw,flags:c.secondaryRaw,kind:v.goal?'goal':v.bonus?'bonus':'dot'};});
 const connectors=connectorSpecs(rows(s,'EX'),dots);initializeConnectorBonuses(connectors,dots);
 const raw=rows(s,'WA'),active=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 const hand=(a,i)=>{const program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw].text,f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:a.gridPosition.column+','+a.gridPosition.row,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program,sourcePC:program?a.rawWords[6]:undefined,sourceRawPC:a.rawWords[6],canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:a.programReferenceRaw,...(program?{sourceStaticProgram:structuredClone(ps[a.programReferenceRaw])}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin:{x:74,y:72},dots,connectors,walls,spikes,doors:[],switches:[],teleports:[],player:hand(active[0],0),enemies:active.slice(2).map((a,i)=>hand(a,i+2)),bombs:[],goodies:[],puddles:[],elevators:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-active.length,slidingHumanStarts:active.slice(0,2).map(a=>a.gridPosition.column+','+a.gridPosition.row),sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,slidingConnectorRules:true,gunTriggerProjectileRules:true,gunTriggerChild:gunSpecs(s,hazards),staticGunRailRules:true,...(hazards?{staticGunRailHazardRules:true}:{})};
}
export function buildStaticGunRailBoard(s,o){assertStaticGunRailRecipe(o);assertStaticGunRailSource(s,{hazards:hazardsOf(o)});if(!int(o.ordinal,1,100)||!o.title||!(o.angularSpeed>0))fail();const source=frozen(structuredClone(s)),b=declarations(source,o);b.staticGunRailSource=source;return b;}
export function assertStaticGunRailBoard(b,{outlines,dotOutlines,gunOutlines}={}){
 if(b?.staticGunRailRules!==true||!Object.isFrozen(b.staticGunRailSource)||!Object.isFrozen(b.staticGunRailSource.cells))fail();assertStaticGunRailSource(b.staticGunRailSource,{hazards:hazardsOf(b)});const e=declarations(b.staticGunRailSource,b);
 for(const[k,v]of Object.entries(e))if(!same(b[k],v))fail();for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&e[k]!==true)fail();validateConnectorBoard(b.connectors,b.dots);
 if(outlines)for(const g of[700,4300,500,4400,4500])for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(outlines&&hazardsOf(b)){for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();if(b.spikes.length)for(let f=0;f<4;f++)if(!Array.isArray(outlines.groups?.[200]?.frames?.[f]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();if(gunOutlines)assertGunTriggerOutlines(gunOutlines);return true;
}
