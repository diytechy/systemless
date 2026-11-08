import test from 'node:test';
import assert from 'node:assert/strict';
import {activePuddleSpecs,puddleGeometry,createPuddleState,triggerPuddle,observePuddle,
  dropletDirection,createDropletState,dropletArrived,dropletHumanGrab,advanceDroplet,
  oilOutline,findDormantPuddleContact,oilUnsupportedReasons} from './oil.mjs';
const spec={row:0,column:0,kind:1};
const timing={now:0,delay150:250,delay700:1166};
const dotPixel=i=>({x:i*48,y:0});
const context={now:251,delay150:250,delay700:1166,targetPixel:{x:48,y:0},dotPixel,
  collideDot:()=>-1,humanCanGrab:()=>true,heroPivot:9,bounds:{left:-100,top:-100,right:600,bottom:450}};
test('activation filtering precedes source capacity and retains all kind bits',()=>{
  const records=Array.from({length:12},()=>({rawWords:[0,0,0,0,12]}));
  records.push({rawWords:[0,0,3,0,15]});
  assert.equal(activePuddleSpecs(records).length,1);
  assert.equal(activePuddleSpecs(records)[0].kind,3);
  assert.throws(()=>activePuddleSpecs(records,4),/capacity/);
});
test('both board origins, kind offsets and raw target pixels are distinct',()=>{
  assert.deepEqual(puddleGeometry(spec),{base:{x:97,y:57},targetPixel:{x:106,y:57}});
  assert.deepEqual(puddleGeometry({...spec,kind:2},{x:98,y:96}),{base:{x:94,y:106},targetPixel:{x:82,y:129}});
});
test('PU activation latches clock and strict deadline; skipped counts advance once',()=>{
  let s=createPuddleState(spec);
  const r=triggerPuddle(s,{...timing,clockCount:5});s=r.state;
  assert.deepEqual(r.events,[{type:'sound',argument:29}]);
  assert.deepEqual(triggerPuddle(s,{...timing,clockCount:6}).events,[]);
  assert.equal(observePuddle(s,{now:251,clockCount:5}).state.frame,0);
  let called=0;const acquireDot=()=>{called++;return null;};
  s=observePuddle(s,{now:250,clockCount:100,acquireDot}).state;
  assert.equal(s.frame,1);assert.equal(called,0);
  s=observePuddle(s,{now:251,clockCount:101,acquireDot}).state;
  assert.equal(called,1);assert.equal(s.wakeDeadline,250);
});
test('all PU approaches preserve source endpoints and emit exactly one spawn',()=>{
  for(let kind=0;kind<4;kind++) {
    let s=triggerPuddle(createPuddleState({...spec,kind}),{...timing,clockCount:0}).state;
    s=observePuddle(s,{now:251,clockCount:1,acquireDot:()=>({index:2,pixel:{x:96,y:0}})}).state;
    assert.equal(s.frame,8+11*kind);assert.equal(s.targetDot,2);
    for(let i=2;i<=11;i++){const r=observePuddle(s,{now:300,clockCount:i});s=r.state;assert.deepEqual(r.events,[]);}
    const r=observePuddle(s,{now:300,clockCount:12});s=r.state;
    assert.deepEqual(r.events,[{type:'createDroplet',dotIndex:2}]);assert.equal(s.visible,false);
    assert.deepEqual(observePuddle(s,{now:300,clockCount:20}).events,[]);
    const reset=createPuddleState({...spec,kind});assert.equal(reset.triggered,false);assert.equal(reset.targetDot,-1);
  }
});
test('pursuit axis preference, equality and source direction bases',()=>{
  assert.deepEqual(dropletDirection({x:0,y:0},{x:48,y:0}),{preferVertical:false,dx:1,dy:0,direction:3,travelBase:52});
  assert.equal(dropletDirection({x:48,y:48},{x:0,y:0}).travelBase,26);
  assert.equal(dropletDirection({x:48,y:48},{x:0,y:0},false).travelBase,78);
  assert.equal(dropletDirection({x:0,y:0},{x:0,y:0},false).dy,1);
});
test('arrival permission/fader, sliding immunity and grab hook differ',()=>{
  const s=createDropletState(0,dotPixel(0),timing);
  assert.deepEqual(dropletArrived(s,{humanCanGrab:true,heroPivot:0,heroSliding:true}).events,[]);
  assert.deepEqual(dropletHumanGrab(s,0),[{type:'death',reason:10}]);
  assert.deepEqual(dropletHumanGrab({...s,frame:9},0),[]);
  const r=dropletArrived(s,{humanCanGrab:false,heroPivot:0});
  assert.equal(r.state.clockAttached,false);assert.deepEqual(r.events,[{type:'fader',dotIndex:0}]);
});
test('strict move delay, source outline contact then arrival ten callbacks later',()=>{
  let s=createDropletState(0,dotPixel(0),timing);
  assert.equal(advanceDroplet(s,{...context,now:250}).state.frame,0);
  for(let i=0;i<3;i++)s=advanceDroplet(s,context).state;
  assert.equal(s.frame,55);assert.equal(s.dotIndex,-1);
  let r=advanceDroplet(s,{...context,collideDot:()=>1});s=r.state;
  assert.equal(s.frame,61);assert.equal(s.dotIndex,1);assert.equal(s.base.x,0);
  assert.deepEqual(r.events,[{type:'sound',argument:9}]);
  for(let i=0;i<9;i++){r=advanceDroplet(s,{...context,heroPivot:1});s=r.state;assert.deepEqual(r.events,[]);}
  r=advanceDroplet(s,{...context,heroPivot:1});s=r.state;
  assert.equal(s.frame,0);assert.equal(s.base.x,48);assert.equal(s.moveDeadline,501);
  assert.deepEqual(r.events,[{type:'death',reason:10}]);
});
test('gap extension offsets each phase19 cycle; first old-dot contact is ignored',()=>{
  let s=createDropletState(0,dotPixel(0),timing),calls=0;
  for(let i=0;i<9;i++)s=advanceDroplet(s,{...context,collideDot:()=>{calls++;return 0;}}).state;
  assert.equal(s.frame,71);assert.equal(s.base.x,48);assert.equal(s.dotIndex,-1);assert.equal(calls,6);
  for(let i=0;i<7;i++)s=advanceDroplet(s,context).state;
  assert.equal(s.frame,71);assert.equal(s.base.x,96);
  s=advanceDroplet(s,{...context,bounds:{left:0,top:0,right:95,bottom:10}}).state;
  assert.equal(s.visible,false);assert.equal(s.clockAttached,false);
});
test('clone threshold requires strict deadline and both axes different',()=>{
  const s=createDropletState(0,dotPixel(0),timing),targetPixel={x:48,y:48};
  assert.deepEqual(advanceDroplet(s,{...context,now:1166,targetPixel}).events,[]);
  const r=advanceDroplet(s,{...context,now:1167,targetPixel});
  assert.deepEqual(r.events,[{type:'clone',dotIndex:0,preferVertical:false}]);
  assert.equal(r.state.cloneDeadline,2333);
  assert.deepEqual(advanceDroplet(s,{...context,now:1167}).events,[]);
});
test('clone hook runs before parent leaves dot; later collisions observe its side effects',()=>{
  const before=createDropletState(0,dotPixel(0),timing),order=[];
  let cloned=false;
  const c={...context,now:1167,targetPixel:{x:48,y:48},
    onClone(event,parent){
      order.push('clone');cloned=true;
      assert.equal(parent.dotIndex,0);assert.equal(parent.previousDot,-1);
      assert.equal(parent.frame,0);assert.deepEqual(parent.base,dotPixel(0));
      assert.equal(parent.moveDeadline,250);assert.equal(parent.cloneDeadline,1166);
      assert.equal(parent.dy,1);assert.equal(event.preferVertical,false);
      parent.base.x=999;event.dotIndex=99; // Callback snapshots cannot mutate reducer state/events.
    },
    collideDot(){order.push('collision');assert.equal(cloned,true);return -1;}};
  let result=advanceDroplet(before,c),s=result.state;
  assert.deepEqual(result.events,[{type:'clone',dotIndex:0,preferVertical:false}]);
  assert.equal(s.dotIndex,-1);assert.equal(s.previousDot,0);assert.equal(s.frame,1);
  assert.equal(s.base.x,0);assert.equal(s.moveDeadline,0);assert.equal(s.cloneDeadline,2333);
  for(let i=0;i<3;i++)s=advanceDroplet(s,c).state;
  assert.deepEqual(order,['clone','collision']);
});
test('raw outlines retain sparse spans and first eligible puddle order',()=>{
  const f={outlineIndex:0,left:0,top:0,right:2,bottom:1,rows:[[1,1]],flipY:false};
  const s={triggered:false,visible:true,frame:0,base:{x:10,y:20}};
  assert.equal(oilOutline({...f,outlineIndex:-1},s.base),null);
  const hand={left:11,top:20,right:12,bottom:21,rows:null};
  assert.equal(findDormantPuddleContact([{...s,triggered:true},s],[f],hand),1);
  assert.equal(findDormantPuddleContact([s],[f],{...hand,left:10,right:10}),-1);
});
test('source helpers stay gated until independent integration and native review',()=>{
  assert.equal(oilUnsupportedReasons().length,5);
  assert.ok(oilUnsupportedReasons({hyperDots:true}).includes('unsupported:hyperDots'));
});
