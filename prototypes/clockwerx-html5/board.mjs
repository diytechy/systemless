import {TAU} from './engine.mjs';
export function buildBoard(manifest){
 const dots=manifest.board.cells.flatMap(([cell,flags],i)=>{if(!(cell&0x3fff))return[];const row=Math.floor(i/11),col=i%11;return[{id:`${col},${row}`,x:74+col*48,y:72+row*48,cell,flags,kind:(cell&0x4000)?((cell&0x3fff)===5?'goal':(cell&0x3fff)===3?'bonus':'special'):'dot',group:row===4&&col<=5?'red':row===6&&col<=5?'green':row===7&&col>=6?'blue':'player'}]});
 return {dots,radius:48,distanceTolerance:1,angularSpeed:TAU/5.0554687787359045,player:{name:'player',grabMask:0x000f,pivot:'1,1',angle:24*TAU/64,direction:1,group:700},demos:[{name:'red',grabMask:0x00f0,pivot:'1,4',angle:24*TAU/64,direction:1,group:500,action:'swing'},{name:'green',grabMask:0x0f00,pivot:'1,6',angle:24*TAU/64,direction:1,group:4400,action:'flip'},{name:'blue',grabMask:0xf000,pivot:'8,7',angle:24*TAU/64,direction:1,group:4500,action:'bounce'}]};
}
