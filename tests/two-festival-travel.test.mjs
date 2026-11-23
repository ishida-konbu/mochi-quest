import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {BOUND,groundHeight,nearRoad,regionAt,REGIONS,staticVolumeAt,terrainHeight,terrainMeshHeight,waterSurfaceAt} from '../two/terrain.js';
import {KADOMATSU,POUNDING} from '../two/festival.js';
import {HIGASHIYAMA} from '../two/higashiyama.js';
import {visitMoonFixtures} from '../two/seasonal-fixtures.js';

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

test('habutae can climb 180 metres above Higashiyama and resume there',()=>{
  const game=createGame(),p=game.state.player;
  place(p,HIGASHIYAMA.x,HIGASHIYAMA.z);
  const summit=p.y;
  assert.ok(game.act('habutae'));
  tick(game,32.5,{jump:true});
  assert.equal(p.h,180);
  assert.equal(p.y,summit+180);
  assert.equal(p.mode,'habutae');
  const restored=createGame(game.save());
  assert.ok(restored.restored);
  assert.equal(restored.state.player.y,p.y);
  assert.equal(restored.state.player.h,180);
  tick(restored,5);
  assert.ok(restored.state.player.grounded);
  assert.equal(restored.state.player.y,summit);
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

test('kagami beats on each jump tap and sustained press, climbs without MP and lands after release', () => {
  const original = createGame();
  const saved = original.save();
  saved.delivered = original.state.npcs.map(n => n.id);
  const game = createGame(saved), p = game.state.player;
  place(p,310,380);
  p.mp = 0;
  assert.ok(game.act('kagami'));
  // One-frame presses continue to lift after the fifth stretch has reached its limit.
  for (let tap = 0; tap < 12; tap++) {
    const vy = p.vy;
    game.step(1/60, {jump:true, z:-.5});
    assert.ok(!p.grounded && p.vy > vy && p.flapBeat > .9);
    tick(game,19/60,{z:-.5});
    assert.ok(p.flapBeat < .2);
  }
  assert.equal(p.airStretch,1);
  assert.ok(p.h>19 && Math.abs(p.speed-16)<.05);

  let beats = 0;
  for (let frame = 0; frame < 32*60; frame++) {
    const before = p.flapBeat;
    game.step(1/60, {jump:true});
    if (p.flapBeat > before) beats++;
  }
  assert.ok(beats>50);
  assert.equal(p.h,180);
  assert.equal(p.mp,0);
  assert.equal(p.mode,'kagami');
  game.act('jump'); // An individual button press at the ceiling still starts a fresh stroke.
  assert.equal(p.flapBeat,1);
  const resumed = createGame(game.save());
  assert.ok(resumed.restored);
  assert.equal(resumed.state.player.h,180);
  tick(resumed,5);
  assert.ok(resumed.state.player.grounded);
  assert.equal(resumed.state.player.flapBeat,0);
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

test('the moon lanterns, grass vase, bamboo and mortar occupy their painted heights',()=>{
  const lanterns=[],vases=[];
  visitMoonFixtures((x,z)=>({part(shape){
    if(shape==='kasa')lanterns.push([x,z]);
    if(shape==='vase')vases.push([x,z]);
  }}),{});
  assert.equal(lanterns.length,4);
  assert.equal(vases.length,1);
  const hit=(x,z,y)=>staticVolumeAt(x,z,y,.008,.02);
  for(const [x,z] of lanterns) {
    const base=terrainHeight(x,z);
    assert.ok(hit(x,z,base+.46));
    assert.ok(hit(x+.24,z,base+.77),'overhanging roof');
    assert.ok(!hit(x+.25,z,base+.46),'beside the narrower paper lantern');
    assert.ok(!hit(x,z,base+1.15),'air above the finial');
  }
  for(const [x,z] of vases) {
    const base=terrainHeight(x,z);
    assert.ok(hit(x,z,base+.35));
    assert.ok(!hit(x,z,base+1.10),'susuki plumes bend out of the way');
  }
  for(const [x,z] of KADOMATSU) {
    const base=terrainHeight(x,z);
    assert.ok(hit(x,z,base+1.27),'tall central bamboo');
    assert.ok(!hit(x+.32,z,base+1.27),'open beside the culms');
  }
  const {x,z}=POUNDING,base=terrainHeight(x,z)+.012;
  assert.ok(hit(x,z,base+.48),'wooden bowl');
  assert.ok(hit(x+.43,z,base+.68),'mortar rim');
  assert.ok(!hit(x,z,base+.68),'hollow top');
});

test('the sunrise beach holds the mat, decorations and bicycle rack on dry, level ground',()=>{
  const game=createGame();
  const stops=game.state.objects.filter(o=>REGIONS[regionAt(o.x,o.z)].id==='dawn');
  const port=stops.find(o=>o.type==='port'), cuff=stops.find(o=>o.type==='haramaki');
  const fixtures=[
    [POUNDING.x,POUNDING.z,1.57,1.075,POUNDING.yaw-.27,.018],
    [port.x,port.z,1.05,1,0,.035],
    [cuff.x,cuff.z,.85,.65,0,.035],
    ...KADOMATSU.map(([x,z,yaw])=>[x,z,.5,.5,yaw,.02])
  ];
  for(const [x,z,halfWidth,halfDepth,yaw,tolerance] of fixtures){
    const base=groundHeight(x,z);
    assert.ok(base>waterSurfaceAt(x,z));
    assert.equal(nearRoad(x,z,.55),false);
    for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){
      const u=halfWidth*i/2,v=halfDepth*j/2;
      const surface=terrainMeshHeight(x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw));
      assert.ok(Math.abs(surface-base)<tolerance,`uneven footing at ${x}, ${z}`);
    }
  }
  // The older terrain survey ends on this meridian, near the path to the sea.
  for(let z=155;z<=194;z++)
    assert.ok(Math.abs(groundHeight(310.02,z)-groundHeight(309.98,z))<.02);
  place(game.state.player,port.x,port.z+1.2);
  game.step(1/60);
  assert.equal(game.nearest()?.target,port);
  assert.ok(game.act('interact'));
  assert.equal(game.state.player.mount,'bike');
});
