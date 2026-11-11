// Default-off static Child join: guns/triggers, EX/WL/SP, a white ring,
// class1 ordinary b/f/n actor and fixed free class1/3 buster packs.
import {activeGunTriggerSpecs} from './gun-triggers.mjs';
import {assertGunTriggerOutlines} from './gun-trigger-child.mjs';
import {validateConnectorBoard} from './sliding.mjs';
import {validateBombWallTiles} from './walls.mjs';
import {dotColorOffset} from './dots.mjs';
const fail=()=>{throw Error('Separate static gun/EX/ring/class1+3 free-buster Child composition required');};
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const geometry={frameOrigin:{x:28,y:28},rawBounds:{left:0,top:0,right:584,bottom:424}};
const required=['allowFreeBusters','allowGunsTriggers','allowSlidingConnectors','allowCanonicalPlayer','allowEnemyStaticPrograms','allowSpecialDots','allowChildScoring','allowCombinedGoalBonus','allowInactiveSpikes'];
const gunsOK=(g,t)=>g.length>0&&g.length<=18&&t.length>0&&t.length<=18&&g.every(x=>x.color===0&&[1,2].includes(x.placement)&&[4,8].includes(x.directions))&&t.every(x=>x.color===0&&x.placement===1);
export function assertGunSlidingBusterRecipe(o){
 if(o.allowGunSlidingBusters!==true||(o.activeMask??1)!==1||required.some(k=>o[k]!==true))fail();
 for(const[k,v]of Object.entries(o))if(k.startsWith('allow')&&v!==false&&k!=='allowGunSlidingBusters'&&!required.includes(k))fail();return true;
}
export function assertGunSlidingBusterActor(a,{program=a?.program}={}){
 if(!a||!int(a.sourceSlot,0,30)||![0,6,1,5].includes(a.sourceActorType)||program!==a.program||typeof a.checksWalls!=='boolean'||a.movingPivot)fail();
 const human=a.sourceSlot<2;
 if(human){if(a.sourceActorType!==[0,6][a.sourceSlot]||a.speedClass!==0||!a.checksWalls||program!==null)fail();}
 else if(a.sourceActorType===5){if(a.checksWalls||![1,3].includes(a.speedClass)||program!==null||a.sliding)fail();}
 else if(a.sourceActorType!==1||a.checksWalls||a.speedClass!==1||typeof program!=='string'||!int(program.length,1,255)||!/^[bfn]+$/.test(program)||!int(a.sourcePC,1,program.length))fail();
 const group={0:700,6:4300,1:500,5:3900}[a.sourceActorType];if(a.group!==group&&!(a.sourceSlot===0&&a.sourceActorType===0&&a.group===4300))fail();return true;
}
export function gunSlidingBusterSource(s,origin,mask=1){
 if(mask!==1||s?.structuralStatus!=='complete'||s.header?.version!==12||s.header.displaySizeRaw!==8||s.cells?.length!==88||!Array.isArray(s.blocks)||origin?.x!==74||origin.y!==72)fail();
 const seen=new Set(),rows=k=>s.blocks.find(b=>b.kind===k)?.records??[],cells=s.cells.filter(c=>c.present),at=(r,c)=>cells.find(d=>d.row===r&&d.column===c);
 for(const b of s.blocks){if(seen.has(b.kind)||b.count!==b.records.length||b.count&&!['WA','WP','TX','SP','WL','EX','GN','TR','PU'].includes(b.kind))fail();seen.add(b.kind);}
 if(rows('PU').some(r=>r.rawWords?.length!==5||(r.rawWords[3]*65536+r.rawWords[4])&mask))fail();
 if(cells.some(c=>![1,3,5,0x4001,0x4003,0x4005,9,0x4009].includes(c.flagsRaw)||c.inlineProgram||!(c.secondaryRaw&mask)||c.flagsRaw&8&&dotColorOffset(c.secondaryRaw)!==0)||cells.filter(c=>c.flagsRaw&4).length!==1||cells.filter(c=>c.flagsRaw&8).length!==1||!rows('WL').length||!rows('EX').length||rows('EX').length>61)fail();
 const endpoints=new Set();for(const r of rows('EX')){const w=r.rawWords;if(w.length!==3||w[2]!==256)fail();const a=at(w[0],w[1]),b=at(w[0]+1,w[1]);if(!a||!b||[a,b].some(c=>c.flagsRaw&0x3fe))fail();endpoints.add(a);endpoints.add(b);}
 const sp=rows('SP').filter(r=>(r.rawWords[4]*65536+r.rawWords[5])&mask);if(!sp.length||sp.some(r=>r.rawWords.length!==6||r.rawWords[4]!==0||r.rawWords[5]!==15||r.rawWords.slice(0,4).some((n,i)=>!int(n,0,[7,10,3,3][i]))))fail();
 const actors=rows('WA').filter(a=>a.activationMaskRaw&mask),programs=rows('WP');let class1=0,class3=0;
 if(actors.length<4||actors.length>31)fail();
 for(const[i,a]of actors.entries()){const c=at(a.gridPosition?.row,a.gridPosition?.column),program=a.programReferenceRaw<0?null:programs[a.programReferenceRaw]?.text;if(!c||!int(a.initialFrameHalfIndexRaw,0,63)||![1,65535].includes(a.rawWords[4])||i<2&&(c.flagsRaw&0x3fe||endpoints.has(c))||a.actorTypeRaw===5&&(c.flagsRaw&0x3fc||endpoints.has(c)))fail();assertGunSlidingBusterActor({sourceSlot:i,sourceActorType:a.actorTypeRaw,group:{0:700,6:4300,1:500,5:3900}[a.actorTypeRaw],speedClass:a.rawWords[7],checksWalls:a.version12ByteRaw!==0,program,sourcePC:a.rawWords[6]});if(a.actorTypeRaw===5){if(a.rawWords[7]===1)class1++;else class3++;}}
 if(!class1||!class3)fail();const g={gridOrigin:origin,frameOrigin:geometry.frameOrigin,activeMask:mask},guns=activeGunTriggerSpecs(rows('GN'),{kind:'GN',...g}),triggers=activeGunTriggerSpecs(rows('TR'),{kind:'TR',...g});if(!gunsOK(guns,triggers))fail();return {guns,triggers,...structuredClone(geometry)};
}
export function assertGunSlidingBusterBoard(b,{outlines,gunOutlines,dotOutlines}={}){
 if(!b?.gunSlidingBusterRules||b.activeMask!==1||b.difficulty!=='Child'||b.origin?.x!==74||b.origin.y!==72||!['freeBusterRules','gunTriggerProjectileRules','slidingConnectorRules','canonicalPlayerRules','staticEnemyCallbacks','specialDotRules','childScoreRules','combinedGoalBonusRules'].every(k=>b[k]===true)||['movingDotRules','bombRules','bombObjectInteractionRules','goodieOnlyRules','canonicalOilRules','teleportRules','rotatingSpikeRules','markedTransferRules','staticEnemyWallRules','elevatorRules','gunBusterRules','gunTriggerSlidingRules','gunTriggerWallRules'].some(k=>b[k])||['bombs','goodies','puddles','doors','switches','teleports','elevators'].some(k=>b[k]?.length))fail();
 for(const a of[b.player,...b.enemies])assertGunSlidingBusterActor(a);validateBombWallTiles(b.walls);validateConnectorBoard(b.connectors,b.dots);
 if(!b.walls.length||!b.spikes.length||!b.connectors.length||b.dots.filter(d=>d.ring).length!==1)fail();
 for(const d of b.dots)if(d.motion!=='static'||d.upDown||d.movingProgram||d.waystation||d.protected||d.transferDeath||d.slowdown||d.teleport||d.ring&&(d.color!==0||d.slideMask||d.bonus)||d.slideMask&&(d.kind!=='dot'||d.bonus))fail();
 const c=b.gunTriggerChild;if(!c||!gunsOK(c.guns,c.triggers)||c.frameOrigin?.x!==28||c.frameOrigin.y!==28||Object.keys(geometry.rawBounds).some(k=>c.rawBounds?.[k]!==geometry.rawBounds[k]))fail();
 if(outlines){for(const g of[700,4300,3900,500])for(let f=0;f<64;f++)if(!Array.isArray(outlines.groups?.[g]?.frames?.[f]?.rows))fail();for(const w of b.walls)if(!Array.isArray(outlines.groups?.[800]?.frames?.[w.frame]?.rows))fail();for(let f=0;f<4;f++)if(!outlines.groups?.[200]?.frames?.[f])fail();}
 if(dotOutlines)for(const d of b.dots)for(const f of d.ring?Array.from({length:8},(_,i)=>23+i):[1+d.color,9+d.color])if(!dotOutlines.groups?.[300]?.frames?.[f])fail();
 if(gunOutlines)assertGunTriggerOutlines(gunOutlines);return true;
}
