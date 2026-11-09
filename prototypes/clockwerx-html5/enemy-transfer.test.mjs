import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceStaticEnemyCallback,markEnemyOrphaned} from './enemy-transfer.mjs';

const dot=(id,x,y,extra={})=>({id,x,y,present:true,humanCanGrab:true,nonhumanCanGrab:true,motion:'static',slideMask:0,teleport:false,...extra});
const actor=(extra={})=>({sourceActorType:2,pivot:'a',frame:63,direction:1,sourcePC:1,sliding:false,visible:true,orphaned:false,hiddenUntil:0,...extra});
const options=(extra={})=>({program:'s',dots:[dot('a',0,0),dot('b',48,0)],guestTick:100,adjustPeriod:n=>Math.floor(n*100/60),afterAnimate:()=>{},onDotRelease:()=>{},onDotGrabFirst:()=>{},afterDotGrab:()=>{},...extra});

test('a separately enabled free class2 orbital visits each multiplied canonical frame',()=>{
 const spike=actor({sourceActorType:4,speedClass:2,checksWalls:false}),frames=[],o=options({allowRotatingSpikes:true,program:null,afterAnimate:s=>frames.push(s.frame)});
 assert.throws(()=>advanceStaticEnemyCallback(spike,3,o),/enabled clock/);
 const result=advanceStaticEnemyCallback(spike,3,{...o,allowClass2RotatingSpikes:true});
 assert.deepEqual(frames,[0,1,2]);assert.equal(result.state.frame,2);assert.equal(result.state.unwrappedFrame,66);assert.equal(result.state.pivot,'a');
 assert.throws(()=>advanceStaticEnemyCallback(spike,3,{...o,program:'nnnn',allowClass2RotatingSpikes:true}),/free clock/);
});
test('qualified up/down targets use their current pixel and orphan on human-unavailable arrival',()=>{
 const o=options({dots:[dot('a',0,0),dot('b',48,5,{motion:'up-down',humanCanGrab:false})]});
 assert.throws(()=>advanceStaticEnemyCallback(actor(),1,o),/Moving/);
 const r=advanceStaticEnemyCallback(actor(),1,{...o,allowUpDownDots:true});assert.equal(r.state.pivot,'b');assert.equal(r.state.frame,32);assert.equal(r.state.orphaned,true);
 o.dots[1].y=7;assert.equal(advanceStaticEnemyCallback(actor(),1,{...o,allowUpDownDots:true}).state.pivot,'a');
});

test('qualified rotating spike uses integer WA animation and n-only PC without transfers',()=>{
 const spike=actor({sourceActorType:4,speedClass:1,checksWalls:false}),o=options({allowRotatingSpikes:true,program:'nnnn'});
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,options()),/ordinary canonical/);
 const result=advanceStaticEnemyCallback(spike,2,o);
 assert.deepEqual([result.state.frame,result.state.pivot,result.state.sourcePC,result.state.direction],[1,'a',2,1]);
 assert.equal(result.events.some(e=>e.type==='program-transfer'),false);
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,{...o,program:'f'}),/no-action/);
 assert.throws(()=>advanceStaticEnemyCallback({...spike,sourcePC:0},1,{...o,program:'n'.repeat(115)}),/length byte/);
 assert.throws(()=>advanceStaticEnemyCallback({...spike,checksWalls:true},1,o),/no walls/);
 assert.throws(()=>advanceStaticEnemyCallback({...spike,sourceActorType:5},1,o),/ordinary canonical/);
});

test('fast orbital transfer reverses around the new pivot with continuous orb position',()=>{
 const spike=actor({sourceActorType:4,speedClass:5,checksWalls:false}),o=options({program:'s',allowRotatingSpikes:true});
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,o),/enabled clock/);
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,{...o,allowFastRotatingSpikes:true}),/program/);
 const r=advanceStaticEnemyCallback(spike,2,{...o,allowFastRotatingSpikes:true,allowRotatingSpikeTransfers:true});
 assert.deepEqual([r.state.pivot,r.state.frame,r.state.direction,r.state.sourcePC],['b',31,-1,1]);
 assert.equal(r.events.filter(e=>e.type==='program-transfer').length,1);
 // At the cardinal transfer instant, radius24 and a48-pixel pivot shift
 // leave the source orb at the same world coordinate after the half-turn.
 assert.equal(0+24,48+24*Math.cos(Math.PI));
});

test('free slow orbital qualification and normal orbital bounce permissions stay independent',()=>{
 const spike=actor({sourceActorType:4,speedClass:1,checksWalls:false}),seen=[],o=options({program:'b',allowRotatingSpikes:true,afterAnimate:s=>seen.push(['animate',s.frame]),onDotRelease:()=>seen.push(['release'])});
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,o),/program/);
 const enabled={...o,allowRotatingSpikeBounces:true};
 const result=advanceStaticEnemyCallback(spike,1,enabled);assert.deepEqual([result.state.pivot,result.state.frame,result.state.direction],['a',0,-1]);assert.deepEqual(seen,[['animate',0]]);
 const blocked=advanceStaticEnemyCallback(spike,1,{...enabled,dots:[dot('a',0,0),dot('b',48,0,{nonhumanCanGrab:false})]});assert.equal(blocked.state.direction,1);
 assert.throws(()=>advanceStaticEnemyCallback(spike,1,{...enabled,program:'f'}),/program/);
 const slow={...spike,speedClass:4};assert.throws(()=>advanceStaticEnemyCallback(slow,1,{...o,program:null}),/enabled clock/);
 const free=advanceStaticEnemyCallback(slow,2,{...o,program:null,allowSlowRotatingSpikes:true});assert.deepEqual([free.state.pivot,free.state.frame,free.state.direction],['a',1,1]);
 assert.throws(()=>advanceStaticEnemyCallback(slow,1,{...enabled,allowSlowRotatingSpikes:true}),/free clock/);
 assert.throws(()=>advanceStaticEnemyCallback({...spike,speedClass:5},1,{...enabled,allowSlowRotatingSpikes:true}),/enabled clock/);
});

test('s reverses before release, jumps pivot/frame, then runs ordered grab hooks',()=>{
  const seen=[];
  const hook=label=>(s,d,c)=>seen.push([label,s.pivot,s.frame,s.direction,d.id,c.human]);
  const result=advanceStaticEnemyCallback(actor(),1,options({onDotRelease:hook('release'),onDotGrabFirst:hook('DP'),afterDotGrab:hook('after')}));
  assert.deepEqual(seen,[['release','a',0,-1,'a',false],['DP','b',32,-1,'b',false],['after','b',32,-1,'b',false]]);
  assert.equal(result.state.pivot,'b');assert.equal(result.state.sliding,false);
});

test('n s b f truth table applies only after a successful target lookup',()=>{
  for(const [program,pivot,direction,frame] of [['n','a',1,0],['s','b',-1,32],['b','a',-1,0],['f','b',1,32]]) {
    const s=advanceStaticEnemyCallback(actor(),1,options({program})).state;
    assert.deepEqual([s.pivot,s.direction,s.frame],[pivot,direction,frame]);
  }
  const s=advanceStaticEnemyCallback(actor(),1,options({program:'bs',dots:[dot('a',0,0)]})).state;
  assert.deepEqual([s.sourcePC,s.direction,s.pivot],[2,1,'a']);
});

test('static lookups respect first match and nonhuman permission, not visibility',()=>{
  const blocked=advanceStaticEnemyCallback(actor(),1,options({dots:[dot('a',0,0),dot('blocked',48,0,{nonhumanCanGrab:false}),dot('b',48,0)]})).state;
  assert.equal(blocked.pivot,'a');
  const hidden=advanceStaticEnemyCallback(actor(),1,options({dots:[dot('a',0,0),dot('b',48,0,{visible:false})]})).state;
  assert.equal(hidden.pivot,'b');
});

test('shared multi-delta loop consumes at intermediate cardinal and uses new direction',()=>{
  const s=advanceStaticEnemyCallback(actor(),2,options()).state;
  assert.deepEqual([s.pivot,s.frame,s.direction],['b',31,-1]);
  const b=advanceStaticEnemyCallback(actor({frame:15}),2,options({program:'b',dots:[dot('a',0,0),dot('down',0,48)]})).state;
  assert.deepEqual([b.frame,b.direction],[15,-1]);
});

test('collision hook precedes program and affects XOR direction at that cardinal',()=>{
  const s=advanceStaticEnemyCallback(actor(),1,options({program:'b',afterAnimate:s=>{s.direction=-1;}})).state;
  assert.equal(s.frame,0);assert.equal(s.direction,1);
});

test('source PC0 reads length byte and preserves its one-shot prefix behavior',()=>{
  const s=advanceStaticEnemyCallback(actor({sourcePC:0}),1,options({program:'s'.repeat(115)})).state;
  assert.equal(s.sourcePC,1);assert.equal(s.pivot,'b');assert.equal(s.direction,-1);
});

test('collapsed ring arrival orphans after DP hook and flickers once after all steps',()=>{
  const order=[];
  const r=advanceStaticEnemyCallback(actor(),2,options({dots:[dot('a',0,0),dot('b',48,0,{humanCanGrab:false,visible:false})],onDotGrabFirst:s=>order.push(s.orphaned),afterDotGrab:s=>order.push(s.orphaned)}));
  assert.deepEqual(order,[false,true]);assert.equal(r.state.orphanDeadline,125);
  assert.equal(r.state.frame,31);assert.equal(r.state.visible,false);
  assert.equal(r.events.filter(e=>e.type==='orphan-flicker').length,1);
});

test('orphan is one-shot, strict expiry; motion continues and later good pivot does not cure it',()=>{
  const s=actor();assert.equal(markEnemyOrphaned(s,{guestTick:100,adjustPeriod:n=>25}),true);
  assert.equal(markEnemyOrphaned(s,{guestTick:110,adjustPeriod:n=>25}),false);
  assert.equal(s.orphanDeadline,125);
  const at=advanceStaticEnemyCallback(s,1,options({program:'f',guestTick:125})).state;
  assert.equal(at.pivot,'b');assert.equal(at.orphaned,true);assert.equal(at.visible,false);
  const expired=advanceStaticEnemyCallback(at,1,options({program:null,guestTick:126})).state;
  assert.equal(expired.frame,33);assert.equal(expired.visible,false);assert.equal(expired.orphaned,false);
  assert.equal(expired.hiddenUntil,0);
  const hidden=actor({visible:false});assert.equal(markEnemyOrphaned(hidden,{guestTick:100,adjustPeriod:n=>25}),false);
});

test('post-callback orphan handling also occurs with zero inner delta when dispatched',()=>{
  const s=actor({orphaned:true,orphanDeadline:120});
  const result=advanceStaticEnemyCallback(s,0,options());
  assert.equal(result.state.frame,63);assert.equal(result.state.visible,false);
});

test('true sliding and dynamic/teleport targets are explicit future gates',()=>{
  assert.throws(()=>advanceStaticEnemyCallback(actor({sliding:true}),1,options()),/sliding/);
  for(const extra of [{motion:'moving'},{slideMask:1},{teleport:true}])
    assert.throws(()=>advanceStaticEnemyCallback(actor(),1,options({dots:[dot('a',0,0),dot('b',48,0,extra)]})),/unqualified/);
});
