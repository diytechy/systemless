// Default-off Child moving bonus/goal, static EX and ordinary GO0 join.
// Source-only admission; movement, callbacks and clocks remain separate.
import {assertClosedMovingProgram,movingProgramCell,effectiveMovingCell} from './moving-dots.mjs';
import {connectorSpecs,validateConnectorBoard} from './sliding.mjs';
const fail=()=>{throw Error('Separate moving bonus/goal with static rails and GO0 Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const required=['MovingDots','SlidingConnectors','Goodies','CanonicalPlayer','EnemyStaticPrograms','SpecialDots','ChildScoring','CombinedGoalBonus','InactiveSpikes'];
export function assertMovingGoalGoodieRecipe(o){
 if(o?.allowMovingGoalGoodies!==true||(o.activeMask??1)!==1||required.some(k=>o['allow'+k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowMovingGoalGoodies'&&!required.includes(k.slice(5)))fail();return true;
}
export function assertMovingGoalGoodieActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||program!==a.program||typeof a.checksWalls!=='boolean')fail();
 const human=a.sourceSlot<2,type=a.sourceActorType,group={0:700,6:4300,1:500}[type];
 if(!group||a.group!==group&&!(a.sourceSlot===0&&type===0&&a.group===4300))fail();
 if(human){if(type!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else if(type!==1||a.speedClass!==1||a.checksWalls||program!==null&&(typeof program!=='string'||!/^[fn]+$/.test(program)||!int(a.sourcePC,1,program.length)))fail();return true;
}
export function assertMovingGoalGoodieSource(s,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks))fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','EX','GO'].includes(b.kind))fail();seen.add(b.kind);}
 if(cells.some(c=>![1,0x4001,0x4083,0x4085].includes(c.flagsRaw)||!(c.secondaryRaw&mask))||cells.filter(c=>c.flagsRaw&4).length!==1||!cells.some(c=>c.flagsRaw&2))fail();
 const moving=cells.filter(c=>c.flagsRaw&0x80);if(!moving.length||moving.length>16||!moving.some(c=>c.flagsRaw&4))fail();
 for(const c of moving)assertClosedMovingProgram(movingProgramCell(c).text,{x:74+c.column*48,y:72+c.row*48});
 for(const c of cells)if(!(c.flagsRaw&0x80)&&c.inlineProgram)fail();
 const dots=cells.map(c=>({id:c.column+','+c.row,row:c.row,column:c.column,motion:c.flagsRaw&0x80?'moving-program':'static'})),ex=connectorSpecs(rows('EX'),dots);if(!ex.length)fail();
 if(rows('SP').some(r=>r.rawWords.length!==6||(r.rawWords[4]*65536+r.rawWords[5])&mask))fail();
 const goodies=rows('GO').filter(r=>(r.rawWords[3]*65536+r.rawWords[4])&mask);if(!goodies.length||goodies.length>15||goodies.some(r=>r.rawWords.length!==5||r.rawWords[2]!==0||!int(r.rawWords[0],0,7)||!int(r.rawWords[1],0,10)))fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');if(actors.length<3||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const w=a.rawWords,c=at(a.gridPosition?.row,a.gridPosition?.column),p=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(w[4])||i<2&&effectiveMovingCell(c.flagsRaw,c.secondaryRaw,mask)!==1&&c.flagsRaw!==0x4001)fail();assertMovingGoalGoodieActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500}[a.actorTypeRaw],speedClass:w[7],checksWalls:a.version12ByteRaw!==0,program:p,sourcePC:w[6]});}
 return true;
}
export function assertMovingGoalGoodieBoard(b,{outlines,dotOutlines}={}){
 if(!b?.movingGoalGoodieRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['movingDotRules','slidingConnectorRules','goodieOnlyRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['bombRules','bombObjectInteractionRules','canonicalOilRules','rotatingSpikeRules','markedTransferRules','staticEnemyWallRules','elevatorRules','teleportRules','gunTriggerProjectileRules'].some(k=>b[k])||['bombs','puddles','walls','spikes','doors','switches','elevators','teleports','guns','triggers'].some(k=>b[k]?.length))fail();
 for(const a of[b.player,...b.enemies])assertMovingGoalGoodieActor(a);validateConnectorBoard(b.connectors,b.dots);if(!b.connectors.length||!b.goodies.length||b.goodies.length>15||b.goodies.some(g=>g.initialFrame!==0))fail();
 for(const d of b.dots)if(!['static','moving-program'].includes(d.motion)||d.upDown||d.teleport||d.ring||d.protected||d.waystation||d.transferDeath||d.slowdown||d.motion==='moving-program'&&d.slideMask||d.motion==='static'&&(d.bonus||d.kind!=='dot'))fail();
 if(!b.dots.some(d=>d.motion==='moving-program'&&d.kind==='goal'))fail();
 if(outlines)for(const g of[700,4300,500])for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();
 if(dotOutlines)for(const d of b.dots)for(const f of[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();return true;
}
