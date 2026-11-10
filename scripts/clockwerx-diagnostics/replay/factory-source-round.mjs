import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// Called only after the real runner validates Root's closed-goal gates and pins.
export async function sourceRoundFactory(sourcePath,config){
 const imp=n=>import(pathToFileURL(path.join(sourcePath,n+'.mjs')).href);
 const [{buildDecodedBoard},{SourceRound,sourceFrame},{createDeathEffect},{dotBodyFrame}]=await Promise.all([imp('level'),imp('round'),imp('death'),imp('dots')]);
 const read=f=>JSON.parse(fs.readFileSync(f.path,'utf8'));
 const decoded=read(config.decoded),options=read(config.options),profiles=Object.fromEntries(Object.entries(config.profiles).map(([name,pin])=>[name,read(pin)]));
 if(Object.keys(profiles).some(k=>!['outlines','dotOutlines','bombOutlines','doorOutlines','oilOutlines','elevatorOutlines'].includes(k)))throw Error('Unknown source profile key');
 if(config.bombRoutes)profiles.bombRoutes=read(config.bombRoutes);
 const reset=SourceRound.prototype.reset;let constructing=false,installed=false;
 const factory=controls=>{
  if(installed)throw Error('Factory may construct once only');installed=true;
  SourceRound.prototype.reset=function(...args){controls.beforeReset(constructing);const result=reset.apply(this,args);controls.afterReset();return result;};
  const board=buildDecodedBoard(decoded,options);
  controls.beforeConstructor();constructing=true;
  let game;try{game=new SourceRound(board,{...profiles,deathFactory:(pivot,hand,clock)=>createDeathEffect({pivot,frame:hand.canonicalFrame?hand.frame:sourceFrame(hand.angle),randomUnsigned:controls.randomUnsigned,clock,advanceClock:false})});controls.afterConstructor();}finally{constructing=false;}
  return {game,board};
 };
 factory.helpers={dotBodyFrame,sourceFrame};
 factory.close=()=>{if(installed){SourceRound.prototype.reset=reset;installed=false;}};
 return factory;
}
