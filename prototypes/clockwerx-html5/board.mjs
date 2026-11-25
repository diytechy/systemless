import {TAU} from './engine.mjs';
import {decodeDot} from './dots.mjs';
import {DIFFICULTY_MASK,DIFFICULTY_MASTER_RATE,DIFFICULTIES} from './actor-clocks.mjs';
export function buildBoard(manifest,{difficulty='Child'}={}){
 if(!DIFFICULTIES.includes(difficulty))throw new RangeError('Unknown difficulty');
 const masterRate=DIFFICULTY_MASTER_RATE[difficulty],activeMask=DIFFICULTY_MASK[difficulty];
 const dots=manifest.board.cells.flatMap(([cell,flags],i)=>{const state=decodeDot(cell);if(!state.present)return[];const row=Math.floor(i/11),col=i%11;return[{id:`${col},${row}`,x:74+col*48,y:72+row*48,cell,flags,kind:state.goal?'goal':state.bonus?'bonus':'dot',group:row===4&&col<=5?'red':row===6&&col<=5?'green':row===7&&col>=6?'blue':'player'}]});
 return {dots,movement:true,difficulty,masterRate,activeMask,timeLimit:120,radius:48,distanceTolerance:1,angularSpeed:TAU/5.0554687787359045*(masterRate/60),player:{name:'player',grabMask:0x000f,pivot:'1,1',angle:24*TAU/64,direction:1,group:700},demos:[{name:'red',grabMask:0x00f0,pivot:'1,4',angle:24*TAU/64,direction:1,group:500,action:'swing'},{name:'green',grabMask:0x0f00,pivot:'1,6',angle:24*TAU/64,direction:1,group:4400,action:'flip'},{name:'blue',grabMask:0xf000,pivot:'8,7',angle:24*TAU/64,direction:1,group:4500,action:'bounce'}]};
}
