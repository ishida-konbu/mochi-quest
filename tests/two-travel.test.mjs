import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { BUILDINGS, REGIONS, canLand, groundHeight, regionAt } from '../two/terrain.js';
import { regionPort } from '../two/map.js';

function stand(game, x, z) {
  Object.assign(game.state.player, {x, z, y:groundHeight(x,z), h:0, grounded:true, vx:0, vy:0, vz:0, speed:0});
}
function rent(game) {
  const port=game.state.objects.find(o=>o.type==='port');
  stand(game,port.x,port.z);
  assert.ok(game.act('interact'));
  assert.equal(game.state.player.mount,'bike');
}
function near(actual, expected, tolerance=.015) {
  assert.ok(Math.abs(actual-expected)<tolerance,`expected ${expected}, got ${actual}`);
}

test('rolling, cycling and winged travel start at walking pace and build to their own top speeds',()=>{
  for (const [mode,top] of [['dango',23.6],['bike',45.9],['habutae',32]]) {
    const game=createGame(), p=game.state.player;
    if (mode==='bike') rent(game);
    else assert.ok(game.act(mode));
    stand(game,0,70);
    p.invulnerable=5;
    if (mode==='habutae') game.act('jump');
    let early, middle;
    for (let i=1;i<=240;i++) {
      game.step(1/60,{z:-1,jump: mode==='habutae'});
      if(i===10) early=p.speed;
      if(i===60) middle=p.speed;
    }
    assert.ok(early>4 && early<7, mode+' launch');
    assert.ok(middle>early && middle<top*.75, mode+' run-up');
    near(p.speed,top,.04);
    for(let i=0;i<90;i++) game.step(1/60,{jump:mode==='habutae'});
    near(p.speed,0);
    for(let i=0;i<10;i++) game.step(1/60,{z:1,jump:mode==='habutae'});
    assert.ok(p.speed>4 && p.speed<7,mode+' restart');
  }
});

test('repeated brief habutae taps alone sustain flight after full extension, then release lands',()=>{
  const game=createGame(), p=game.state.player;
  game.act('habutae');
  let lastBeat=0;
  for (let i=0;i<240;i++) {
    // A single 60 Hz frame every third of a second, with the button released between taps.
    const beat=i%20===0;
    game.step(1/60,{x:.5,jump:beat});
    if(beat && i>0){assert.ok(p.vy>lastBeat); assert.ok(!p.grounded);}
    lastBeat=p.vy;
  }
  assert.equal(p.airStretch,1);
  assert.ok(p.h>19);
  near(p.speed,16,.04);
  for(let i=0;i<210;i++) game.step(1/60);
  assert.ok(p.grounded);
  assert.equal(p.airStretch,0);
  for(let i=0;i<60;i++) game.step(1/60,{x:1});
  near(p.speed,6.4);
});

test('each district has a reachable working bicycle port with independent stock',()=>{
  const game=createGame();
  const ports=game.state.objects.filter(o=>o.type==='port');
  assert.deepEqual(ports.map(p=>REGIONS[regionAt(p.x,p.z)].id), REGIONS.map(r=>r.id));
  for (const port of ports) {
    const district = REGIONS[regionAt(port.x,port.z)].id;
    assert.equal(regionPort(game.state,district),port);
    stand(game,port.x,port.z);
    assert.ok(canLand(port.x,port.z));
    assert.equal(game.nearest().target,port);
    assert.ok(game.act('interact'));
    assert.equal(regionPort(game.state,district).bikes,1);
    assert.ok(game.act('dismount'));
    assert.equal(port.bikes,2);
  }
});

test('a speed-boosted rental crosses the wrap, resumes at full speed and stops at a thin wall',()=>{
  const game=createGame(), p=game.state.player;
  rent(game);
  stand(game,380,0);
  p.buffs.swift=20;
  for(let i=0;i<40;i++) game.step(.1,{x:1});
  assert.ok(p.x<0);
  near(p.vx,45.9*1.42);
  const resumed=createGame(JSON.parse(JSON.stringify(game.save())));
  assert.equal(resumed.restored,true);
  near(resumed.state.player.vx,p.vx);
  resumed.step(1/60,{x:1});
  near(resumed.state.player.speed,p.speed);

  const b=BUILDINGS[0], dx=Math.sin(b.yaw), dz=Math.cos(b.yaw);
  const rear=b.d/2+2;
  stand(game,b.x-dx*rear,b.z-dz*rear);
  const top=45.9*1.42;
  Object.assign(p,{vx:dx*top, vz:dz*top, speed:top});
  for(let i=0;i<3;i++) game.step(.1,{x:dx,z:dz});
  assert.ok((p.x-b.x)*dx+(p.z-b.z)*dz < -b.d/2);
  assert.ok(p.speed<6.4);
});

test('MP is consumed at half the old per-second rates with the original transformation costs',()=>{
  for(const [mode,cost,rate] of [['dango',7,2.1],['kusa',6,1.5],['kinako',6,1.75],['habutae',10,2.75]]) {
    const game=createGame(), p=game.state.player;
    assert.ok(game.act(mode));
    near(p.mp,100-cost);
    for(let i=0;i<120;i++) game.step(1/60);
    near(p.mp,100-cost-rate*2);
    assert.ok(game.act('normal'));
    const before=p.mp;
    for(let i=0;i<30;i++) game.step(1/60);
    near(p.mp,before+2.6);
  }
});
