import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { REGIONS, canLand, groundHeight } from '../two/terrain.js';

function run(game, seconds, input = {}) {
  for (let frame=0; frame<Math.ceil(seconds*60); frame++) game.step(1/60,input);
}
function moveTo(game,x,z) {
  Object.assign(game.state.player,{ x,z, y:groundHeight(x,z), h:0, vx:0,vz:0,vy:0,speed:0,grounded:true });
}
function get(game,type,i=0) {
  return [...game.state.objects,...game.state.npcs].filter(e=>e.type===type)[i];
}
function at(game,target) { moveTo(game,target.x,target.z); }
function collect(game,type) {
  const obj = get(game,type); at(game,obj); game.step(1/60); return obj;
}

test('the 3D trail starts facing the camera and accepts independent world-axis movement',()=>{
  const game=createGame(), p=game.state.player;
  assert.deepEqual([p.x,p.z,p.h,p.heading],[0,62,0,0]);
  assert.equal(p.y,groundHeight(p.x,p.z));
  run(game,1,{z:-1});
  assert.ok(p.z<57); assert.ok(Math.abs(p.x)<.1); assert.ok(Math.cos(p.heading)<-.98);
  run(game,.6,{x:1});
  assert.ok(p.x>2); assert.ok(Math.sin(p.heading)>.98);
  assert.ok(Math.abs(p.y-groundHeight(p.x,p.z))<.01);
  const g2=createGame(), p2=g2.state.player;
  run(g2,.45,{x:1,z:-1});
  assert.ok(p2.speed>4 && p2.speed<6.5);
});

test('normal, dango and habutae have different jump envelopes and land on rendered ground',()=>{
  const heights=[];
  for (const mode of ['normal','dango','habutae']) {
    const game=createGame(),p=game.state.player;
    game.act(mode); assert.ok(game.act('jump'));
    let peak=0;
    for (let i=0;i<100;i++) {game.step(1/60,{jump:mode==='habutae'});peak=Math.max(peak,p.h);}
    heights.push(peak);
    run(game,2); assert.equal(p.grounded,true);
    assert.equal(p.y,groundHeight(p.x,p.z)); assert.equal(p.h,0);
    assert.ok(game.state.events.some(e=>e.text==='モチコラショッ'));
  }
  assert.ok(heights[0]>1 && heights[0]<2); assert.ok(heights[1]>4.6); assert.ok(heights[2]>7);
});

test('a spent flight over deep water returns to the dry shore saved before takeoff',()=>{
  const game=createGame(),p=game.state.player;
  run(game,.1);
  let wet;
  for(let z=8;z<35 && !wet;z+=.5) for(let x=10;x<35;x+=.5) if(!canLand(x,z)){ wet={x,z};break;}
  assert.ok(wet,'river has an inaccessible underwater cell off the bridge');
  game.act('habutae');game.act('jump');
  Object.assign(p,wet,{h:1.2,y:groundHeight(wet.x,wet.z)+1.2,vy:-2,grounded:false,mp:.01});
  const resumed=createGame(JSON.parse(JSON.stringify(game.save())));
  run(resumed,1);
  assert.equal(resumed.state.player.mode,'normal');
  assert.ok(canLand(resumed.state.player.x,resumed.state.player.z));
  assert.ok(Math.hypot(resumed.state.player.x,resumed.state.player.z-62)<1);
});

test('six distinct landmarks give their stamps on arrival, not on district boundary',()=>{
  const game=createGame();
  assert.deepEqual(game.state.visited,['river']);
  for(const region of REGIONS.slice(1)) {
    moveTo(game,region.x+20,region.z); game.step(1/60);
    assert.equal(game.state.region,region.name); assert.ok(!game.state.visited.includes(region.id));
    moveTo(game,region.x,region.z);game.step(1/60);
    assert.ok(game.state.visited.includes(region.id),region.name);
  }
  assert.deepEqual(game.state.visited,REGIONS.map(r=>r.id));
  assert.equal(game.state.events.filter(e=>e.type==='stamp').length,5);
  run(game,.2);assert.equal(game.state.events.filter(e=>e.type==='stamp').length,5);
});

test('friendly residents patrol in 3D, accept a notice, collide harmlessly and permit camouflage',()=>{
  const game=createGame(),p=game.state.player;
  const rabbit=get(game,'rabbit');
  const initial={x:rabbit.x,z:rabbit.z};run(game,.5);
  assert.ok(Math.hypot(initial.x-rabbit.x,initial.z-rabbit.z)>.1);
  moveTo(game,rabbit.x,rabbit.z+2.8);p.heading=Math.PI;
  game.act('throw');const shot=game.state.shots[0];assert.ok(shot.y>p.y && Math.cos(shot.heading)<0);
  run(game,.25);assert.equal(game.state.score,10);assert.ok(rabbit.flash>0);
  assert.ok(game.state.npcs.includes(rabbit));assert.ok(game.state.events.some(e=>e.text==='三条通知！'));
  at(game,rabbit);game.step(1/60);
  assert.equal(p.activity,'fall');assert.equal(p.hp,93);
  run(game,.8); game.act('kusa');p.invulnerable=0;at(game,rabbit);game.step(1/60);
  assert.equal(p.hp,93);assert.equal(p.activity,null);
});

test('zero health sleeps on the spot and recovers while waiting',()=>{
  const game=createGame(),p=game.state.player;
  at(game,get(game,'rabbit'));p.hp=1;game.step(1/60);assert.equal(p.activity,'sleep');
  const position=[p.x,p.z];run(game,2,{x:1,z:1});assert.deepEqual([p.x,p.z],position);assert.ok(p.hp>35);
  run(game,3.1);assert.equal(p.hp,100);assert.equal(p.activity,null);
});

test('bath and belly wrap protect both vitals; manga speed and ramen size bonuses apply after the activity',()=>{
  const game=createGame(),p=game.state.player;
  p.hp=9;p.mp=3;collect(game,'onsen');assert.equal(p.activity,'bath');
  run(game,3.8);assert.equal(p.hp,100);assert.equal(p.mp,100);assert.ok(p.buffs.warm>18);
  game.act('kinako');at(game,get(game,'rabbit'));run(game,.2);assert.equal(p.hp,100);assert.equal(p.mp,100);
  run(game,.8);game.act('normal');p.buffs.warm=0;
  const book=collect(game,'manga');assert.equal(p.activity,'read');assert.equal(book.active,false);
  run(game,2.5);assert.ok(p.buffs.swift>22);moveTo(game,0,62);run(game,.5,{x:-1});assert.ok(p.speed>8);
  p.buffs.swift=0;collect(game,'ramen');assert.equal(p.activity,'eat');run(game,3);assert.ok(p.buffs.full>27);
  p.mp=1;game.act('kinako');run(game,.25);assert.equal(p.mp,1);
  game.act('throw');assert.deepEqual(game.state.shots.map(s=>s.angle),[-.28,0,.28]);
  moveTo(game,0,62);run(game,.5,{x:-1});assert.ok(p.speed>4.8 && p.speed<5.4);
  const turtle=get(game,'turtle');at(game,turtle);assert.equal(game.act('interact'),false);
  p.buffs.full=0;game.act('normal');
  collect(game,'haramaki');assert.ok(p.buffs.wrap>23);p.mp=1;assert.equal(game.act('habutae'),true);
  run(game,.2);assert.equal(p.mp,1);p.invulnerable=0;at(game,get(game,'rabbit'));game.step(1/60);assert.equal(p.hp,100);
});

test('sake reverses camera-local lateral steering after rotating the camera',()=>{
  const game=createGame(),p=game.state.player;
  collect(game,'sake');assert.equal(p.activity,'drink');run(game,2.4);
  moveTo(game,0,62);
  run(game,.5,{x:0,z:1,rightX:0,rightZ:1});
  assert.ok(p.z<60 && p.vz<-3);
  run(game,19);moveTo(game,0,62);
  run(game,.5,{x:0,z:1,rightX:0,rightZ:1});assert.ok(p.z>64 && p.vz>3);
});

test('one slow turtle seeks shelter and becomes an agile mount, with a ground dismount',()=>{
  const game=createGame(),p=game.state.player;
  const turtle=get(game,'turtle');assert.equal(game.state.npcs.filter(n=>n.type==='turtle').length,1);
  let rested=false;
  for(let i=0;i<60*33;i++) { game.step(1/60); if(turtle.role==='rest'){rested=true;break;} }
  assert.ok(rested);
  at(game,turtle);assert.equal(game.nearest().target,turtle);assert.ok(game.act('interact'));
  moveTo(game,0,62);run(game,.5,{x:1});assert.ok(p.speed>19);assert.equal(turtle.mounted,true);
  assert.ok(game.act('dismount'));assert.equal(turtle.mounted,false);assert.equal(p.mount,null);
});

test('bicycles travel between ports and validated version-two saves retain their real inventory',()=>{
  const game=createGame(),p=game.state.player;const port=get(game,'port'),target=get(game,'port',1);
  at(game,port);assert.ok(game.act('interact'));assert.equal(port.bikes,1);assert.equal(p.mount,'bike');
  moveTo(game,0,62);run(game,.45,{x:1});assert.ok(p.speed>14);
  assert.equal(game.act('dismount'),false);
  const other=createGame(JSON.parse(JSON.stringify(game.save())));
  assert.equal(other.state.player.mount,'bike');assert.equal(other.state.player.x,p.x);
  assert.equal(get(other,'port').bikes,1);at(other,target);assert.equal(other.nearest().action,'dismount');
  assert.ok(other.act('interact'));assert.equal(get(other,'port',1).bikes,3);
  const bad=other.save();bad.bikes[0]=200;
  for(const invalid of [bad,{version:1}, {version:2}, 'bad', null]) assert.equal(createGame(invalid).state.player.x,0);
});

test('a player can walk across the modeled bridge and stretch onto the solid riverbank outcrop',()=>{
  const game=createGame(); game.act('kusa'); run(game,15,{z:-1});
  assert.ok(game.state.player.z < -30);
  assert.equal(game.state.player.hp,100);
  const landed=[];
  for(const mode of ['normal','dango']) {
    const g=createGame(),p=g.state.player;
    moveTo(g,-15.55,53); const startingGround=p.y;
    g.act(mode);g.act('jump');
    for(let f=0;f<160;f++) g.step(1/60,{x:p.x>-18.2?-1:0});
    assert.equal(p.grounded,true);
    landed.push(p.y-startingGround);
  }
  assert.ok(landed[0]<.6);
  assert.ok(landed[1]>2.1);
});

test('the signed-road circuit reaches all six stamps on foot, including the street east of the market',()=>{
  let game=createGame();
  const waypoints=[
    [0,37],[0,0],[1,-18],[10,-39],[17,-64],
    [-39,-72],[-85,-67],[-111,-74],[-153,-85],
    [-110,-74],[-85,-67],[-39,-72],[17,-64],[50,-67],[83,-85],[117,-98],[144,-107],
    [124,-54],[130,-20],[134,6],[134,41],[134,52],[154,73],[156,105],
    [114,93],[68,83],[35,66],[0,62],[-37,73],[-68,82],[-110,108],[-149,111]
  ];
  for(const [x,z] of waypoints) {
    const p=game.state.player;
    for(let frame=0;frame<2400;frame++) {
      const dx=x-p.x,dz=z-p.z,length=Math.hypot(dx,dz);
      if(length<.67)break;
      game.step(1/60,{x:(p.buffs.drunk?-dx:dx)/length,z:dz/length});
    }
    assert.ok(Math.hypot(x-p.x,z-p.z)<.67,'The road to '+[x,z]+' should stay walkable');
    game=createGame(JSON.parse(JSON.stringify(game.save())));
    assert.equal(game.state.player.x,p.x);
  }
  assert.equal(game.state.visited.length,6);
});
