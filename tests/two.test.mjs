import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { REGIONS, canLand, groundHeight, BOUND, WATER_Y, ROADS, riverZ, waterDepth, BUILDINGS, wrapDelta } from '../two/terrain.js';

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
  assert.ok(heights[0]>3.15 && heights[0]<3.5); assert.ok(heights[1]>6.3 && heights[1]<7); assert.ok(heights[2]>9);
});

test('a spent flight settles on the river at the landing point and can swim ashore', () => {
  const game = createGame(), p = game.state.player;
  const x = 46, z = riverZ(x);
  moveTo(game, x, z);
  assert.ok(waterDepth(x,z) > 1 && canLand(x,z));
  game.act('habutae');
  game.act('jump');
  Object.assign(p,{h:1.2, y:groundHeight(x,z)+1.2, vy:-2, mp:.01});
  const resumed = createGame(game.save());
  run(resumed,1);
  const swimmer = resumed.state.player;
  assert.equal(swimmer.mode,'normal');
  assert.equal(swimmer.inWater,true);
  assert.ok(Math.hypot(swimmer.x-x, swimmer.z-z) < .01);
  assert.ok(swimmer.y < WATER_Y);
  run(resumed,5,{z:1});
  assert.equal(swimmer.inWater,false);
  assert.ok(swimmer.z > z+18);
});

test('seventeen distinct landmarks give their stamps on arrival, not on district boundary',()=>{
  const game=createGame();
  assert.deepEqual(game.state.visited,['river']);
  for(const region of REGIONS.slice(1)) {
    moveTo(game,region.x+20,region.z); game.step(1/60);
    assert.equal(game.state.regionId,region.id); assert.ok(!game.state.visited.includes(region.id));
    moveTo(game,region.x,region.z);game.step(1/60);
    if(region.id==='ryugu') {
      assert.equal(game.state.visited.includes(region.id),false);
      run(game,6,{dive:true});
    }
    assert.ok(game.state.visited.includes(region.id),region.name);
  }
  assert.deepEqual(game.state.visited,REGIONS.map(r=>r.id));
  assert.equal(game.state.events.filter(e=>e.type==='stamp').length,REGIONS.length-1);
  run(game,.2);assert.equal(game.state.events.filter(e=>e.type==='stamp').length,REGIONS.length-1);
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

test('one kinako throw sends eight notices radially, with one cooldown and one call',()=>{
  for (const [mode, full, count] of [['kinako', 0, 8], ['kinako', 10, 24], ['normal', 10, 3], ['normal', 0, 1]]) {
    const game=createGame(), p=game.state.player;
    game.act(mode);
    p.heading=.91;
    p.buffs.full=full;
    assert.ok(game.act('throw'));
    assert.equal(game.act('throw'),false);
    const {shots,events}=game.state;
    assert.equal(shots.length,count);
    assert.equal(new Set(shots.map(s=>s.id)).size,count);
    assert.equal(events.filter(e=>e.type==='say' && e.text==='三条通知！').length,1);
    const angles=count>=8 ? Array.from({length:count},(_,i)=>i*(Math.PI*2/count)) : count===3 ? [-.28,0,.28] : [0];
    for (const [i,s] of shots.entries()) {
      assert.equal(s.age,0);
      assert.equal(s.heading,p.heading+angles[i]);
      assert.ok(Math.abs(s.x-p.x-.65*Math.sin(s.heading))<1e-10);
      assert.ok(Math.abs(s.z-p.z-.65*Math.cos(s.heading))<1e-10);
    }
  }
});

test('bath and belly wrap protect both vitals; manga speed and ramen size bonuses apply after the activity',()=>{
  const game=createGame(),p=game.state.player;
  p.hp=9;p.mp=3;collect(game,'onsen');assert.equal(p.activity,null);
  assert.ok(game.act('interact'));assert.equal(p.activity,'bath');
  run(game,3.8);assert.equal(p.hp,100);assert.equal(p.mp,100);assert.ok(p.buffs.warm>18);
  game.act('kinako');at(game,get(game,'rabbit'));run(game,.2);assert.equal(p.hp,100);assert.equal(p.mp,100);
  run(game,.8);game.act('normal');p.buffs.warm=0;
  const book=collect(game,'manga');assert.equal(p.activity,'read');assert.equal(book.active,false);
  run(game,2.5);assert.ok(p.buffs.swift>22);moveTo(game,0,62);run(game,.5,{x:-1});assert.ok(p.speed>8);
  p.buffs.swift=0;collect(game,'ramen');assert.equal(p.activity,'eat');run(game,3);assert.ok(p.buffs.full>27);
  p.mp=1;game.act('kinako');run(game,.25);assert.equal(p.mp,1);
  game.act('throw');assert.equal(game.state.shots.length,24);
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
  moveTo(game,0,62);run(game,.5,{x:1});assert.ok(p.speed>10 && p.speed<24);assert.equal(turtle.mounted,true);
  assert.ok(game.act('dismount'));assert.equal(turtle.mounted,false);assert.equal(p.mount,null);
});

test('bicycles travel between ports and validated version-two saves retain their real inventory',()=>{
  const game=createGame(),p=game.state.player;const port=get(game,'port'),target=get(game,'port',1);
  at(game,port);assert.ok(game.act('interact'));assert.equal(port.bikes,1);assert.equal(p.mount,'bike');
  moveTo(game,0,62);run(game,.45,{x:1});assert.ok(p.speed>6.4 && p.speed<15.3);
  assert.equal(game.act('dismount'),false);
  const other=createGame(JSON.parse(JSON.stringify(game.save())));
  assert.equal(other.state.player.mount,'bike');assert.equal(other.state.player.x,p.x);
  assert.equal(get(other,'port').bikes,1);at(other,target);assert.equal(other.nearest().action,'dismount');
  assert.ok(other.act('interact'));assert.equal(get(other,'port',1).bikes,3);
  const bad=other.save();bad.bikes[0]=200;
  for(const invalid of [bad,{version:1}, {version:2}, 'bad', null]) assert.equal(createGame(invalid).state.player.x,0);
});

test('a player can walk across the modeled bridge and stretch onto the riverbank shop roof',()=>{
  const game=createGame(); game.state.player.invulnerable=16; run(game,15,{z:-1});
  assert.ok(game.state.player.z < -30);
  assert.equal(game.state.player.hp,100);
  const landed=[];
  for(const mode of ['normal','dango']) {
    const g=createGame(),p=g.state.player;
    // Take off before reaching the gable so a high arc can clear its edge.
    moveTo(g,-26,49); const startingGround=p.y;
    g.act(mode);g.act('jump');
    for(let f=0;f<160;f++) g.step(1/60,{x:p.x>-33.6?-1:0});
    assert.equal(p.grounded,true);
    landed.push(p.y-startingGround);
  }
  assert.ok(landed[0]<.6);
  assert.ok(landed[1]>5.2);
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

test('a normal hop takes about a second, records touchdown compression, and accepts a late jump tap', () => {
  const game = createGame();
  const player = game.state.player;
  game.act('jump');
  while (!player.grounded && game.state.time < 2) game.step(1 / 120);

  assert.ok(game.state.time > 1.0 && game.state.time < 1.15);
  assert.ok(player.landing > .23 && player.impact > .85);
  run(game, .3);
  assert.equal(player.landing, 0);

  game.act('jump');
  while ((player.vy >= 0 || player.h > .55) && game.state.time < 4) game.step(1 / 120);
  assert.ok(game.act('jump'));
  assert.ok(player.airStretch > 0);
  run(game, .13);
  assert.ok(!player.grounded && player.vy > 8 && player.h > .25);
  const jumpLines = game.state.events.filter(event => event.type === 'say' && event.text === 'モチコラショッ');
  assert.equal(jumpLines.length, 3);
});

test('a jump just after leaving a rock works, and older saves have optional animation fields', () => {
  const game = createGame();
  const player = game.state.player;
  moveTo(game, -17.05, 53);
  for (let frame = 0; frame < 90 && player.grounded; frame++) game.step(1 / 120, { x: 1 });
  assert.equal(player.grounded, false);
  game.step(1 / 60, { x: 1 });
  assert.ok(game.act('jump'));
  assert.ok(player.vy > 10);
  assert.ok(game.act('jump'));
  assert.ok(player.airStretch > 0);

  const legacy = game.save();
  delete legacy.player.landing;
  delete legacy.player.impact;
  const restored = createGame(JSON.parse(JSON.stringify(legacy))).state.player;
  assert.equal(restored.x, player.x);
  assert.equal(restored.h, player.h);
  assert.equal(restored.landing, 0);
  assert.equal(restored.impact, 0);
});


test('fresh airborne presses accumulate in all five modes while a held key counts once', () => {
  for (const mode of ['normal','dango','kusa','kinako','habutae']) {
    const g = createGame(), p = g.state.player;
    g.act(mode);
    g.act('jump'); // keydown is dispatched before the next animation frame
    run(g,.08,{jump:true});
    assert.equal(p.airStretch,0,mode);
    for (let i = 0; i < 4; i++) {
      g.step(1/120,{jump:false});
      const before = p.airStretch;
      g.step(1/120,{jump:true});
      assert.ok(p.airStretch > before, mode);
      const now = p.airStretch;
      run(g,.03,{jump:true});
      assert.equal(p.airStretch,now);
    }
    const restored = createGame(g.save());
    assert.equal(restored.state.player.airStretch,p.airStretch);
    run(restored,4);
    assert.equal(restored.state.player.airStretch,0);
    assert.ok(restored.state.player.grounded);
  }
});

test('the ocean connects all four world edges with continuous movement and savable positions', () => {
  for (const [axis,sign] of [['x',1],['x',-1],['z',1],['z',-1]]) {
    const g = createGame(), p = g.state.player, edge = sign*(BOUND-.4);
    moveTo(g, axis === 'x' ? edge : 0, axis === 'z' ? edge : 0);
    run(g,.8,{[axis]:sign});
    assert.ok(sign*p[axis] < -BOUND+8);
    assert.ok(sign*wrapDelta(p[axis]-edge) > 1 && p.speed < 7);
    assert.equal(p.inWater,true);
    assert.equal(createGame(g.save()).state.player[axis],p[axis]);
  }
});

test('every house admits the player through its rotated doorway, has a floor and blocks its back wall', () => {
  for (const b of BUILDINGS) {
    const g = createGame(), p = g.state.player;
    const approach = b.d/2 + 2.5;
    moveTo(g,b.x + Math.sin(b.yaw)*approach,b.z + Math.cos(b.yaw)*approach);
    p.invulnerable=2.9; // ordinary mochi uses the floor, walls and ceiling
    for (const item of g.state.objects) item.active = false;
    const inward = { x:-Math.sin(b.yaw), z:-Math.cos(b.yaw) };
    for (let i = 0; i < 180 && Math.hypot(b.x-p.x,b.z-p.z) > .2; i++) g.step(1/60,inward);
    const desc = b.kind+' at '+[b.x,b.z];
    assert.ok(Math.hypot(b.x-p.x,b.z-p.z) < .22, desc);
    assert.ok(Math.abs(p.y-(b.y+.48)) < .02,desc);
    assert.equal(createGame(g.save()).state.player.y,p.y);
    g.act('jump');
    let peak=p.y;
    for (let i=0;i<90;i++) {g.step(1/60);peak=Math.max(peak,p.y);}
    assert.ok(peak < b.y+b.wall,desc);
    run(g,2,inward);
    const depth = b.kind === 'pagoda' ? .73*b.d : b.d;
    const v = (p.x-b.x)*Math.sin(b.yaw)+(p.z-b.z)*Math.cos(b.yaw);
    assert.ok(v > -depth/2 && v < -depth/2+.9, desc);
    run(g,2.5,{x:-inward.x,z:-inward.z});
    assert.ok((p.x-b.x)*Math.sin(b.yaw)+(p.z-b.z)*Math.cos(b.yaw)>b.d/2+.9,desc);
  }
});

test('version-two saves acquire new ports without losing an existing rental or stamps', () => {
  const g = createGame(), port = get(g,'port');
  at(g,port);g.act('interact');
  const old = g.save();
  old.version=2; old.items.length=36; old.bikes.length=6;
  delete old.player.airStretch; delete old.player.night;
  old.visited=REGIONS.slice(0,6).map(r=>r.id);
  const resumed=createGame(old);
  assert.deepEqual(resumed.state.visited,old.visited);
  assert.equal(resumed.state.player.mount,'bike');
  assert.equal(resumed.state.player.airStretch,0);
  assert.deepEqual(resumed.save().bikes,[...old.bikes,...Array(g.save().bikes.length-old.bikes.length).fill(2)]);
});

test('the outer roads reach all four seasonal landmarks and the coast from the maple valley', () => {
  for (const [index, required] of [[8,'snow'],[10,'autumn'],[11,'moon'],[12,'dawn'],[13,'autumn']]) {
    const game = createGame(), p = game.state.player, points = ROADS[index].points;
    moveTo(game,...points[0]);game.act('kusa');
    for (const [x,z] of points) {
      for (let frame=0;frame<110;frame++) {
        const dx=x-p.x, dz=z-p.z, length=Math.hypot(dx,dz);
        if (length<.47) break;
        p.mp=100; // follow the marked road without NPC knockback affecting the route
        game.step(1/30,{x:dx/length,z:dz/length});
      }
      assert.ok(Math.hypot(x-p.x,z-p.z)<.47, 'Blocked road near '+[x,z]);
    }
    assert.ok(game.state.visited.includes(required));
  }
});
