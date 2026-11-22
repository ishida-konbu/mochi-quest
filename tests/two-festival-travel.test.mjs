import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {BOUND,groundHeight} from '../two/terrain.js';

const tick = (game,seconds,input={}) => {
  for(let frame=0; frame<Math.round(seconds*60); frame++) game.step(1/60,input);
};
function place(p,x,z) {
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,speed:0,vx:0,vz:0,vy:0,grounded:true});
}

test('a notice leaves along the visible facing, even while the simulation is steering elsewhere',()=>{
  const game=createGame(),p=game.state.player;
  p.heading=-1.1;
  game.act('throw',Math.PI/2);
  const [shot]=game.state.shots;
  const origin=shot.x;
  assert.equal(shot.z,p.z);
  game.step(.05);
  assert.ok(shot.x>origin);
  assert.equal(shot.z,p.z);
});

test('a turtle ride reaches five times its former top speed, with a continuous run-up and resumable swift speed',()=>{
  const game=createGame(),p=game.state.player, turtle=game.state.npcs.find(n=>n.type==='turtle');
  place(p,turtle.x,turtle.z);
  assert.ok(game.act('interact'));
  // The earlier eastern run now crosses a planted peninsula. An open sea
  // lane measures the ride's acceleration without hitting trees or rocks.
  place(p,0,BOUND-90);
  tick(game,.15,{x:1}); const start=p.speed;
  tick(game,.9,{x:1}); const cruise=p.speed;
  tick(game,3.5,{x:1});
  assert.ok(start<12 && cruise>start+10 && cruise<80);
  assert.ok(Math.abs(p.speed-105)<.05);
  p.buffs.swift=10;tick(game,3,{x:1});
  assert.ok(Math.abs(p.speed-149.1)<.1);
  assert.ok(createGame(game.save()).restored);
});

test('habutae can reach and save at the new 120 metre flight ceiling',()=>{
  const game=createGame(),p=game.state.player;
  place(p,310,380);
  game.act('habutae');tick(game,24,{jump:true});
  assert.equal(p.h,120);
  const restored=createGame(game.save());
  assert.equal(restored.state.player.h,120);
  tick(restored,5);
  assert.equal(restored.state.player.grounded,true);
});

test('only a completed delivery book unlocks a triple-speed kagami with map travel and eight notices even when full',()=>{
  const original=createGame();
  assert.equal(original.act('kagami'),false);
  assert.equal(original.teleport(101,86),false);
  const save=original.save();
  save.delivered=original.state.npcs.map(n=>n.id);
  const game=createGame(save), p=game.state.player;
  assert.ok(game.restored && game.state.kagamiUnlocked && game.act('kagami'));
  assert.ok(game.teleport(399.25,385));
  assert.equal(p.x,399.25);assert.equal(p.z,385);
  assert.ok(game.teleport(0,70));
  tick(game,1,{z:-1}); assert.ok(Math.abs(p.speed-19.2)<.1);
  p.buffs.full=10;
  game.act('throw'); assert.equal(game.state.shots.length,8);
  assert.ok(createGame(game.save()).state.kagamiUnlocked);
});

test('both animals at the dawn mortar accept notices at their actual workstations',()=>{
  for(const role of ['turner','pounder']){
    const game=createGame(),p=game.state.player;
    const artist=game.state.npcs.find(n=>n.role===role);
    const partner=game.state.npcs.find(n=>n.atMortar && n!==artist);
    const heading = Math.atan2(partner.x-artist.x,partner.z-artist.z);
    place(p,artist.x-1.6*Math.sin(heading),artist.z-1.6*Math.cos(heading));
    game.step(1/60); assert.ok(game.act('throw',heading)); tick(game,.12);
    assert.ok(game.state.delivered.has(artist.id));
  }
});
