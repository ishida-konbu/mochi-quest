import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, worldDelta, WORLD_WIDTH } from '../game.js';

function run(game, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) game.step(1 / 60, input);
}
function target(game, type, index = 0) {
  return [...game.state.objects, ...game.state.npcs].filter(o => o.type === type)[index];
}
function stand(game, o, offset = 0) {
  Object.assign(game.state.player, { x: o.x + offset, z: o.z, h: 0, vx: 0, vy: 0, grounded: true });
}
function quietArea(game) { Object.assign(game.state.player, { x: 22000, z: .92 }); }
function pickup(game, type) {
  const item = target(game, type);
  stand(game, item);
  game.step(1 / 60);
  return item;
}

test('fresh world has six districts, a unique turtle, porters and paired wrestlers', () => {
  const g = createGame();
  assert.deepEqual(g.state.visited, [0]);
  assert.equal(g.state.npcs.filter(n => n.type === 'turtle').length, 1);
  for (const type of ['onsen','manga','sake','ramen','haramaki','port']) {
    assert.equal(new Set(g.state.objects.filter(o => o.type === type).map(o => Math.floor(o.x / 4000))).size, 6);
  }
  const [a,b] = g.state.npcs.filter(n => n.role === 'sumo');
  assert.equal(a.facing, -b.facing);
  const turtle = target(g, 'turtle');
  const x = turtle.x;
  run(g, 2);
  assert.equal(g.state.player.x, 600); assert.equal(g.state.player.hp, 100);
  assert.ok(turtle.x > x && turtle.x < x + 36);
  assert.ok(Math.abs(b.x - a.x) < 70);
});

test('scroll loops in both directions and records main crossings', () => {
  const g = createGame();
  const p = g.state.player;
  p.x = WORLD_WIDTH - 12;
  run(g, .4, { x: 1 });
  assert.ok(p.x < 80);
  run(g, .9, { x: -1 });
  assert.ok(p.x > WORLD_WIDTH - 200);
  assert.deepEqual(g.state.visited, [0,5]);
  assert.equal(worldDelta(6, WORLD_WIDTH - 4), 10);
  assert.equal(worldDelta(WORLD_WIDTH - 4, 6), -10);
});

test('dango rolls faster and stretches onto a high shelf unreachable with a normal jump', () => {
  const baseline = createGame(); quietArea(baseline);
  const faster = createGame(); quietArea(faster);
  faster.act('dango');
  run(faster, 1, { x: 1 }); run(baseline, 1, { x: 1 });
  assert.ok(faster.state.player.vx > baseline.state.player.vx * 1.5);
  const ledge = target(faster, 'ledge', 1);
  stand(faster, ledge);
  assert.equal(faster.act('jump'), true);
  assert.ok(faster.state.events.some(e => e.type === 'say' && e.text === 'モチコラショッ'));
  run(faster, 1.2);
  assert.equal(faster.state.player.h, ledge.h);
  assert.equal(faster.state.player.grounded, true);
  run(faster, 1.2, { z: 1 });
  assert.equal(faster.state.player.h, 0);
  stand(baseline, ledge); baseline.act('jump'); run(baseline, 1.2);
  assert.equal(baseline.state.player.h, 0);
});

test('habutae climbs under held input, descends on release, MP runs out and regenerates', () => {
  const g = createGame(); quietArea(g);
  assert.equal(g.act('habutae'), true);
  run(g, 2.3, { jump: true }); assert.ok(g.state.player.h > 320);
  run(g, 1.3); assert.equal(g.state.player.h, 0);
  g.state.player.mp = .01; run(g, .1);
  assert.equal(g.state.player.mode, 'normal');
  const low = g.state.player.mp;
  assert.equal(g.act('kinako'), false);
  run(g, 3); assert.ok(g.state.player.mp > low);
  assert.equal(g.act('kinako'), true);
});

test('friendly animal collision tumbles and costs HP, camouflage prevents a bump', () => {
  const g = createGame();
  const n = target(g, 'rabbit');
  stand(g, n); g.step(1 / 60);
  assert.equal(g.state.player.activity, 'fall');
  assert.equal(g.state.player.hp, 93);
  const creatures = g.state.npcs.length;
  run(g, .9); assert.equal(g.state.player.activity, null);
  g.state.player.invulnerable = 0;
  g.act('kusa'); stand(g, n); run(g, .1);
  assert.equal(g.state.player.hp, 93); assert.equal(g.state.player.activity, null);
  assert.equal(g.state.npcs.length, creatures);
});

test('an exhausted mochi sleeps where it fell, recovers and wakes', () => {
  const g = createGame();
  g.state.player.hp = 5;
  stand(g, target(g, 'rabbit')); g.step(1 / 60);
  assert.equal(g.state.player.activity, 'sleep');
  const resting = g.state.player.x;
  run(g, 2, { x: 1 });
  assert.equal(g.state.player.x, resting); assert.ok(g.state.player.hp > 30);
  run(g, 3.1); assert.equal(g.state.player.hp, 100); assert.equal(g.state.player.activity, null);
});

test('notice scores on delivery; the recipient survives and the sheet disappears', () => {
  const g = createGame();
  const n = target(g, 'rabbit');
  stand(g, n, -105);
  assert.equal(g.act('throw'), true);
  assert.equal(g.act('throw'), false);
  assert.ok(g.state.events.some(e => e.type === 'say' && e.text === '三条通知！'));
  run(g, .35);
  assert.equal(g.state.score, 10);
  assert.equal(g.state.shots.length, 0); assert.equal(n.flash > 0, true);
  assert.ok(g.state.npcs.includes(n));
});

test('bath restores HP and MP, shields both, and requires exiting before another bath', () => {
  const g = createGame(); const p = g.state.player;
  p.hp = 14; p.mp = 2;
  pickup(g, 'onsen'); assert.equal(p.activity, 'bath');
  run(g, 4); assert.equal(p.hp, 100); assert.equal(p.mp, 100);
  assert.ok(p.buffs.warm > 18); assert.equal(p.activity, null);
  g.act('habutae'); assert.equal(p.mp, 100);
  stand(g, target(g, 'rabbit')); run(g, .1);
  assert.equal(p.hp, 100); assert.equal(p.mp, 100);
  run(g, 1); stand(g, target(g, 'onsen')); g.step(1 / 60);
  assert.equal(p.activity, 'bath');
});

test('manga pauses for reading then speeds up; sake reverses movement until sober', () => {
  const g = createGame(); const p = g.state.player;
  const book = pickup(g, 'manga');
  assert.equal(p.activity, 'read'); assert.equal(book.active, false);
  run(g, 2.5); assert.ok(p.buffs.swift > 20);
  quietArea(g); run(g, .6, { x: 1 }); assert.ok(p.vx > 250);
  pickup(g, 'sake'); assert.equal(p.activity, 'drink');
  run(g, 2.4); assert.ok(p.buffs.drunk > 15);
  quietArea(g); const before = p.z;
  run(g, .4, { x: 1 }); assert.ok(p.vx < -180); assert.notEqual(p.z, before);
  run(g, 19); assert.equal(p.buffs.drunk, 0);
  run(g, .4, { x: 1 }); assert.ok(p.vx > 160);
});

test('ramen adds bulk, slows walking, waives MP cost and fans out notices; wrap protects HP and MP', () => {
  const g = createGame(); const p = g.state.player;
  pickup(g, 'ramen'); assert.equal(p.activity, 'eat'); run(g, 3);
  assert.ok(p.buffs.full > 27); quietArea(g);
  run(g, .7, { x: 1 }); assert.ok(p.vx > 140 && p.vx < 165);
  p.mp = 1; g.act('kinako'); run(g, .4); assert.equal(p.mp, 1);
  g.act('throw'); assert.deepEqual(g.state.shots.map(s => s.angle), [-.21,0,.21]);
  const turtle = target(g, 'turtle'); stand(g, turtle);
  assert.equal(g.act('interact'), false); assert.equal(p.mount, null);
  p.buffs.full = 0;
  pickup(g, 'haramaki'); assert.ok(p.buffs.wrap > 23);
  const health = p.hp; g.act('dango'); stand(g, target(g, 'rabbit')); run(g, .1);
  assert.equal(p.hp, health); assert.ok(p.mp >= 1);
});

test('turtle can be ridden swiftly, dismounted anywhere and rests under a shelf', () => {
  const g = createGame(); const turtle = target(g, 'turtle');
  stand(g, turtle); assert.equal(g.nearest().target, turtle);
  assert.equal(g.act('interact'), true);
  run(g, .8, { x: 1 });
  assert.ok(g.state.player.vx > 600); assert.equal(turtle.mounted, true);
  assert.equal(g.act('dismount'), true);
  assert.equal(turtle.mounted, false); assert.equal(g.state.player.mount, null);
  const ledge = target(g, 'ledge', 1);
  turtle.x = ledge.x - ledge.width / 2 - 9;
  run(g, 2); assert.equal(turtle.role, 'rest');
});

test('a bicycle can only be returned at a port, preserving total inventory', () => {
  const g = createGame(); const port = target(g, 'port'); const destination = target(g, 'port', 1);
  stand(g, port); assert.equal(g.act('interact'), true);
  assert.equal(port.bikes, 1); assert.equal(g.state.player.mount, 'bike');
  run(g, 1, { x: 1 }); assert.ok(g.state.player.vx > 420);
  assert.equal(g.act('dismount'), false); assert.equal(g.state.player.mount, 'bike');
  stand(g, destination); assert.equal(g.nearest().action, 'dismount');
  assert.equal(g.act('interact'), true); assert.equal(destination.bikes, 3);
  assert.equal(g.state.player.mount, null);
});

test('serialised journeys keep a bicycle, collected item, status, score and visited districts', () => {
  const g = createGame(); pickup(g, 'manga'); run(g, 2.5);
  g.state.score = 70; stand(g, target(g, 'port', 1)); g.step(1/60); g.act('interact');
  const data = JSON.parse(JSON.stringify(g.save()));
  const resumed = createGame(data);
  assert.equal(resumed.state.player.mount, 'bike');
  assert.equal(resumed.state.player.x, g.state.player.x); assert.deepEqual(resumed.state.visited, [0,1]);
  assert.equal(resumed.state.score, 70); assert.equal(target(resumed,'port',1).bikes, 1);
  assert.equal(target(resumed, 'manga').active, false);
  assert.equal(resumed.state.player.buffs.swift, g.state.player.buffs.swift);
  resumed.act('dismount'); assert.equal(target(resumed, 'port', 1).bikes, 2);
  quietArea(resumed); run(resumed, 65.1); assert.equal(target(resumed, 'manga').active, true);
  data.player.mp = 'bad'; assert.equal(createGame(data).state.player.x, 600);
  for (const bad of [null,{},[],{version:1},'bad']) assert.equal(createGame(bad).state.player.x, 600);
});

test('a notice thrown at the visible wrestlers from the start reaches them', () => {
  const g = createGame();
  g.act('throw');
  run(g, 1.35);
  assert.equal(g.state.score, 10);
  assert.equal(g.state.shots.length, 0);
});
