import test from 'node:test';
import assert from 'node:assert/strict';
import {connectorSpecs,startSliding,reverseSliding,animateSliding,stopSliding} from './sliding.mjs';
const dot=(id,row,column)=>({id,row,column,x:74+48*column,y:72+48*row,present:true,motion:'static',slideMask:0,teleport:false});
test('all cardinals and rotation signs choose source tangent bits',()=>{
 for(const direction of [-1,1])for(let frame=0;frame<64;frame+=16){
  const d=dot('a',1,1);d.slideMask=15;const a={frame,unwrappedFrame:frame,direction,pivot:'a'};
  assert.equal(startSliding(a,d),true);assert.equal(a.slideDirection,(frame/16+(direction>0?1:3))%4);assert.equal(a.slideProgress,0);
  const angle=a.frame;animateSliding(a);assert.equal(a.frame,angle);assert.equal(a.slideProgress,1);
 }
});
test('61 capacity, strict record flags, source-order endpoint mask',()=>{
 const ds=[dot('a',0,0),dot('b',0,1),dot('c',1,0)];
 assert.deepEqual(connectorSpecs([{rawWords:[0,0,256]},{rawWords:[0,0,0]}],ds).map(e=>e.id),[0,1]);assert.equal(ds[0].slideMask,3);assert.equal(ds[1].slideMask,4);assert.equal(ds[2].slideMask,8);
 assert.throws(()=>connectorSpecs(Array(62).fill({rawWords:[0,0,0]}),ds));assert.throws(()=>connectorSpecs([{rawWords:[0,0,1]}],ds));assert.throws(()=>connectorSpecs([{rawWords:[0,0,512]}],ds));
});
test('arrival16 release/grab order retains angular phase without32',()=>{
 const ds=[dot('a',0,0),dot('b',1,0)];connectorSpecs([{rawWords:[0,0,256]}],ds);const a={frame:0,unwrappedFrame:64,direction:1,pivot:'a'},calls=[];startSliding(a,ds[0]);
 for(let i=0;i<15;i++){animateSliding(a);assert.equal(stopSliding(a,ds),null);}
 animateSliding(a);assert.equal(stopSliding(a,ds,{release:d=>calls.push('release'+d.id),grab:d=>calls.push('grab'+d.id)}).to,'b');assert.deepEqual(calls,['releasea','grabb']);assert.equal(a.unwrappedFrame,64);assert.equal(a.frame,0);assert.equal(a.sliding,false);
});
test('reverse backs out at0 without release/grab, repeated reversal resumes',()=>{
 const ds=[dot('a',0,0),dot('b',1,0)];connectorSpecs([{rawWords:[0,0,256]}],ds);const a={frame:0,direction:1,pivot:'a'};startSliding(a,ds[0]);for(let i=0;i<5;i++)animateSliding(a);reverseSliding(a);assert.equal(a.direction,-1);assert.equal(a.slideVY,-3);for(let i=0;i<4;i++){animateSliding(a);assert.equal(stopSliding(a,ds),null);}animateSliding(a);assert.equal(stopSliding(a,ds).type,'slide-backout');assert.equal(a.pivot,'a');assert.equal(a.slideY,ds[0].y);
});
import {initializeConnectorBonuses,consumeConnectorBonus,connectorLook} from './sliding.mjs';
test('source EX bonus closure and recursive one-pickup chain consumption',()=>{
 const dots=[{id:'a',bonus:true,kind:'bonus',cell:3,color:0},{id:'b',bonus:false,kind:'dot',cell:1,color:0},{id:'c',bonus:false,kind:'goal',cell:5,color:0}],cs=[{first:'a',second:'b',vertical:false},{first:'b',second:'c',vertical:true}];
 assert.deepEqual(initializeConnectorBonuses(cs,dots),['b','c']);assert.ok(cs.every(e=>e.bonus));assert.equal(dots[2].kind,'goal');assert.equal(connectorLook(cs[0],dots),0);assert.equal(connectorLook(cs[1],dots),4);
 // Caller marks initiating dot collected before scoring hook, as Movement does.
 dots[0].collected=true;assert.deepEqual(consumeConnectorBonus(cs,dots,'a'),['a','b','c']);assert.ok(dots.every(d=>d.collected));assert.ok(cs.every(e=>!e.bonus));assert.equal(connectorLook(cs[1],dots),40);
 for(const d of dots)delete d.collected;initializeConnectorBonuses(cs,dots);assert.ok(cs.every(e=>e.bonus));
});
test('EX look uses runtime color bits rather than normalized DO color order',()=>{
 // Independent source EX table after DO normalized bit1/bit4 reversal.
 for(const [color,offset]of [0,1,3,8,2,9,10,11].entries()){
  const dots=[{id:'a',color,protected:false}];assert.equal(connectorLook({first:'a',vertical:true,bonus:false},dots),40+offset);
  dots[0].protected=true;assert.equal(connectorLook({first:'a',vertical:false,bonus:true},dots),offset);assert.equal(connectorLook({first:'a',vertical:false,bonus:true,burnt:true},dots),18+offset);
 }
});
