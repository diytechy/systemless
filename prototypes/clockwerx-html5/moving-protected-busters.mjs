// Default-off Child moving protection/bonus/goal, ordinary n/s/f/b hands,
// fixed free busters, BO and WL. No EX, Slow, ring, Oil or elevator capability.
import {effectiveMovingCell,movingProgramCell,assertClosedMovingProgram} from './moving-dots.mjs';
import {decodeDot,dotColorOffset} from './dots.mjs';
import {compileWallTiles,validateBombWallTiles,actorChecksWalls} from './walls.mjs';
import {actorInitialFrame,actorTiming} from './hazards.mjs';
import {decodeBombRecord} from './bombs.mjs';
const fail=()=>{throw Error('Separate moving protected/buster/bomb/wall Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rows=(s,k)=>s.blocks.find(b=>b.kind===k)?.records??[];
const groups={0:700,6:4300,1:500,2:4400,5:3900};
const required=['CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','MovingDots','FreeBusters','Bombs','BombObjectInteractions','StaticEnemyWalls'];
const frozen=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))frozen(x);Object.freeze(v);}return v;};
export function assertMovingProtectedBusterRecipe(o){
 if(o?.allowMovingProtectedBusters!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingProtectedBusters'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingProtectedBusterActor(a,{program=a?.program}={}){
 const type=a?.sourceActorType,human=a?.sourceSlot<2;
 if(!int(a?.sourceSlot,0,30)||!groups[type]||a.group!==groups[type]&&!(a.sourceSlot===0&&type===0&&a.group===4300)||typeof a.checksWalls!=='boolean'||program!==a.program)fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else{
  if(![1,2,5].includes(type)||a.speedClass!==1||a.checksWalls)fail();
  if(type===5&&(program!==null||a.movingPivot||a.sliding))fail();
  if(program!==null&&(typeof program!=='string'||!/^[bfns]+$/.test(program)||!int(program.length,1,255)||!int(a.sourcePC,1,program.length)))fail();
 }return true;
}
export function assertMovingProtectedBusterSource(s){
 if(s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set();for(const b of s.blocks){if(seen.has(b.kind)||!Array.isArray(b.records)||b.count!==b.records.length||b.count&&!['WA','WP','WL','BO'].includes(b.kind))fail();seen.add(b.kind);}
 const cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);let movingProtected=0,staticProtected=0,movingBonus=0,movingGoal=0,goals=0;
 for(const[i,c]of s.cells.entries()){
  if(c.index!==i||c.row!==Math.floor(i/11)||c.column!==i%11||c.present!==!!(c.flagsRaw&1)||![0,1,3,0x83,0x85,0x4041,0x4043,0x40c1].includes(c.flagsRaw)||!int(c.secondaryRaw,0,65535))fail();
  if(!c.present){if(c.inlineProgram)fail();continue;}
  const e=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),color=dotColorOffset(c.secondaryRaw);
  if(e&64){if(![0,1,3].includes(color))fail();if(e&128){if(color!==0)fail();movingProtected++;}else staticProtected++;}
  if(e&4){if(color!==0)fail();goals++;if(e&128)movingGoal++;}
  if(e&128){if(e&2){if(![0,1].includes(color))fail();movingBonus++;}assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});}
  else if(c.inlineProgram)fail();
 }
 if(!movingProtected||!staticProtected||!movingBonus||movingGoal!==1||goals!==1||!rows(s,'WL').length||!rows(s,'BO').length||rows(s,'BO').length>60)fail();
 for(const r of rows(s,'WL')){const w=r.rawWords;if(w?.length!==6||![0,256].includes(w[0])||!int(w[1],0,w[0]?10:7)||!int(w[2],0,w[0]?7:10)||!int(w[4],w[2],w[0]?7:10)||!int(w[3],0,2)||!int(w[5],0,2))fail();}
 validateBombWallTiles(walls(s));const bombs=rows(s,'BO').map(decodeBombRecord),matches=bombs.filter(b=>b.kind>=10);
 if(!matches.length||matches.length>5||matches.some(b=>b.flags!==0)||bombs.some(b=>b.kind<4&&(b.row>6||b.column>9)))fail();
 const raw=rows(s,'WA'),actors=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 if(actors.length<5||actors.length>31||actors[0].actorTypeRaw!==0||actors[1].actorTypeRaw!==6||!actors.some(a=>a.actorTypeRaw===5)||!actors.some(a=>[1,2].includes(a.actorTypeRaw)&&a.programReferenceRaw>=0))fail();
 for(const p of ps)if(typeof p.text!=='string'||!int(p.text.length,1,255)||!/^[bfns]+$/.test(p.text))fail();
 const packs=new Map();
 for(const[i,a]of actors.entries()){
  const w=a.rawWords,c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw]?.text;
  if(!c||w?.length!==11||w[0]!==c.row||w[1]!==c.column||w[2]!==a.actorTypeRaw||!int(a.initialFrameHalfIndexRaw,0,63)||a.initialFrameHalfIndexRaw!==w[3]||a.programReferenceRaw!==(w[5]===65535?-1:w[5])||![1,65535].includes(w[4])||w[8]!==0||w[9]!==a.activationMaskRaw||w[10]!==256*a.version12ByteRaw||i<2&&(effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1)&0x3fe))fail();
  assertMovingProtectedBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:groups[a.actorTypeRaw],speedClass:w[7],checksWalls:actorChecksWalls(a.version12ByteRaw),program,sourcePC:w[6]});
  if(a.actorTypeRaw===5){if(c.flagsRaw&0x3fc)fail();const key=`${c.column},${c.row}`,fs=packs.get(key)??[];fs.push({frame:actorInitialFrame(a.initialFrameHalfIndexRaw),direction:w[4]});packs.set(key,fs);}
 }
 for(const pack of packs.values()){const fs=pack.map(a=>a.frame).sort((a,b)=>a-b);if(new Set(pack.map(a=>a.direction)).size!==1||new Set(fs).size!==fs.length||fs.some((f,i)=>fs[(i+1)%fs.length]+(i===fs.length-1?64:0)-f<4))fail();}
 return true;
}
function walls(s){return compileWallTiles(rows(s,'WL').map(({rawWords:w})=>({axis:w[0]>>>8,fixed:w[1],start:w[2],startInset:w[3],end:w[4],endInset:w[5]}))).map((w,id)=>({id,...w,x:74+w.column*48,y:72+w.row*48}));}
function declarations(s,{ordinal,title,angularSpeed}){
 const dots=s.cells.filter(c=>c.present).map(c=>{const cell=effectiveMovingCell(c.flagsRaw,c.secondaryRaw,1),state=decodeDot(cell),moving=!!(cell&128),p={x:74+c.column*48,y:72+c.row*48};return{id:`${c.column},${c.row}`,sourceIndex:c.index,row:c.row,column:c.column,...p,humanCanGrab:true,nonhumanCanGrab:true,sourceCollidable:true,present:true,motion:moving?'moving-program':'static',motionType:moving?1:0,sourceInitialPosition:{...p},...(moving?{movingProgram:c.inlineProgram.text,sourceMovingProgram:movingProgramCell(c)}:{}),slideMask:0,teleport:false,color:dotColorOffset(c.secondaryRaw),protected:!!(cell&64),ring:false,bonus:state.bonus,sourceInBackground:!moving&&!(cell&0x1e),sourceInitialBonus:state.bonus,sourceHasSprite:moving||!!(cell&0x1e),cell,flags:c.secondaryRaw,kind:state.goal?'goal':state.bonus?'bonus':'dot'};});
 const raw=rows(s,'WA'),actors=raw.filter(a=>a.activationMaskRaw&1),ps=rows(s,'WP');
 const hand=(a,i)=>{const program=a.programReferenceRaw<0?null:ps[a.programReferenceRaw].text,f=actorInitialFrame(a.initialFrameHalfIndexRaw);return{name:i===0?'player':`enemy-${i}`,pivot:`${a.gridPosition.column},${a.gridPosition.row}`,grabMask:15<<(a.actorTypeRaw*4),angle:f*Math.PI/32,direction:a.rawWords[4]===65535?-1:1,program,sourcePC:program?a.rawWords[6]:undefined,canonicalFrame:i>=2,frame:i>=2?f:undefined,unwrappedFrame:i>=2?f:undefined,visible:true,orphaned:false,hiddenUntil:0,group:groups[a.actorTypeRaw],sourceSlot:i,sourceRawRecord:raw.indexOf(a),sourceProgramReference:a.programReferenceRaw,...(program?{sourceStaticProgram:structuredClone(ps[a.programReferenceRaw])}:{}),sourceActorType:a.actorTypeRaw,speedClass:a.rawWords[7],...actorTiming(a.rawWords[7]),checksWalls:actorChecksWalls(a.version12ByteRaw)};};
 return{ordinal,title,resourceId:s.resourceId,origin:{x:74,y:72},dots,connectors:[],walls:walls(s),spikes:[],player:hand(actors[0],0),enemies:actors.slice(2).map((a,i)=>hand(a,i+2)),bombs:structuredClone(rows(s,'BO')),goodies:[],puddles:[],doors:[],switches:[],elevators:[],teleports:[],guns:[],triggers:[],demos:[],texts:[],radius:48,distanceTolerance:1,angularSpeed,handOffsetY:1,activeMask:1,difficulty:'Child',timeLimit:s.header.timeLimitRaw,inactiveActorCount:raw.length-actors.length,movingHumanStarts:actors.slice(0,2).map(a=>`${a.gridPosition.column},${a.gridPosition.row}`),sourceGrid:{version:12,displaySizeRaw:8,rows:8,columns:11},sourceProvenance:{sha256:s.sha256,byteLength:s.byteLength,resourceId:s.resourceId},canonicalPlayerRules:true,staticEnemyCallbacks:true,specialDotRules:true,childScoreRules:true,sourceDotPermissions:true,movingDotRules:true,freeBusterRules:true,bombRules:true,bombObjectInteractionRules:true,staticEnemyWallRules:true,movingProtectedBusterRules:true};
}
export function buildMovingProtectedBusterBoard(s,o){
 assertMovingProtectedBusterRecipe(o);assertMovingProtectedBusterSource(s);if(!int(o.ordinal,1,100)||typeof o.title!=='string'||!o.title||!(o.angularSpeed>0))fail();const source=frozen(structuredClone(s)),b=declarations(source,o);b.movingProtectedBusterSource=source;return b;
}
export function assertMovingProtectedBusterBoard(b,{outlines,dotOutlines,bombOutlines}={}){
 if(b?.movingProtectedBusterRules!==true||!Object.isFrozen(b.movingProtectedBusterSource)||!Object.isFrozen(b.movingProtectedBusterSource.cells))fail();const s=b.movingProtectedBusterSource;assertMovingProtectedBusterSource(s);const expected=declarations(s,b);
 for(const[k,v]of Object.entries(expected))if(!same(b[k],v))fail();for(const[k,v]of Object.entries(b))if(k.endsWith('Rules')&&v===true&&expected[k]!==true)fail();for(const a of[b.player,...b.enemies])assertMovingProtectedBusterActor(a);
 if(outlines){for(const g of[700,4300,500,4400,3900,200])for(let f=0;f<(g===200?4:64);f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color,92+d.color,...(d.protected?[117,118,119,120,121,122,123,124]:[])])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(bombOutlines)for(const[g,n]of[[1600,18],[1500,12],[1800,10]])for(let f=0;f<n;f++)if(!bombOutlines.groups?.[g]?.frames?.[f])fail();return true;
}
