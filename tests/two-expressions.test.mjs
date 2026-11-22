import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpression } from '../two/actors.js';
import { createGame } from '../two/game.js';

test('actions interrupt a lingering flush, and the face settles back after the action', () => {
  const player = createGame().state.player;
  player.buffs.drunk = 10;
  assert.equal(getExpression(player), 'blush');
  for (const [activity, mood] of [
    ['read', 'joy'], ['eat', 'eating'], ['bath', 'bath'], ['fall', 'hurt'], ['sleep', 'sleepy'],
  ]) {
    player.activity = activity;
    assert.equal(getExpression(player), mood);
  }
  player.activity = null;
  player.throwTime = .2;
  assert.equal(getExpression(player), 'calling');
  player.throwTime = 0;
  assert.equal(getExpression(player), 'blush');
});

test('launch expressions change into a smile on every airborne pull, including under the moon', () => {
  const player = createGame().state.player;
  Object.assign(player, { grounded: false, h: 1, stretch: .2 });
  assert.equal(getExpression(player), 'surprise');
  player.mode = 'dango';
  assert.equal(getExpression(player), 'determined');
  player.mode = 'habutae';
  assert.equal(getExpression(player), 'joy');
  for (const mode of ['normal','kusa','kinako','habutae','dango','kagami']) {
    Object.assign(player, {mode, night:true, throwTime:.12});
    for (const airStretch of [.23,.46,.69,.92,1]) {
      player.airStretch=airStretch;
      assert.equal(getExpression(player), 'joy', mode);
    }
  }
  player.emote = 'sleepy';
  assert.equal(getExpression(player), 'sleepy');
  delete player.emote;
  assert.equal(getExpression(player), 'joy');
  Object.assign(player, {grounded:true, airStretch:0, throwTime:0});
  assert.equal(getExpression(player), 'sleepy');
});

test('the moon makes a strolling mochi drowsy and a rolling dango smiles at every speed', () => {
  const player = createGame().state.player;
  Object.assign(player, { night: true, grounded: true, speed: 2 });
  assert.equal(getExpression(player), 'sleepy');
  Object.assign(player, { mode: 'dango', speed: 9, stretch: .15 });
  assert.equal(getExpression(player), 'joy');
  player.speed = 1;
  assert.equal(getExpression(player), 'joy');
  player.speed = 0;
  assert.equal(getExpression(player), 'sleepy');
  Object.assign(player, { night: false, mode: 'normal', inWater: true, stretch: 0 });
  assert.equal(getExpression(player), 'bath');
});

test('E tips the bather back before the dough spreads, and a saved soak resumes in the same pose',()=>{
  const game=createGame(),p=game.state.player;
  const pool=game.state.objects.find(o=>o.grand);
  Object.assign(p,{x:pool.x,z:pool.z,y:pool.y,h:0,grounded:true,inWater:true,mode:'kusa'});
  assert.equal(getExpression(p),'bath');assert.equal(p.bathPose,undefined);
  assert.ok(game.act('interact',Math.PI*7+.3));
  assert.ok(Math.abs(p.heading)<=Math.PI);
  assert.equal(p.bathPose.melt,0);assert.equal(p.bathPose.recline,0);
  for(let i=0;i<6;i++)game.step(.1);
  assert.ok(p.bathPose.recline>p.bathPose.melt);
  for(let i=0;i<11;i++)game.step(.1);
  assert.equal(p.bathPose.melt,1);assert.equal(p.bathPose.recline,1);
  const saved=game.save(),resumed=createGame(saved);
  assert.ok(resumed.restored);assert.ok(!Object.hasOwn(saved.player,'bathPose'));
  assert.deepEqual(resumed.state.player.bathPose,p.bathPose);
  for(let i=0;i<16;i++)resumed.step(.1);
  assert.ok(resumed.state.player.bathPose.recline<.25);assert.equal(resumed.state.player.bathPose.melt,0);
  for(let i=0;i<3;i++)resumed.step(.1);
  assert.equal(resumed.state.player.bathPose,undefined);assert.equal(resumed.state.player.mode,'kusa');
});

test('the cyclist smiles through acceleration and coasting, including in the moonlight', () => {
  const player = createGame().state.player;
  Object.assign(player, { mount:'bike', night:true });
  for (const speed of [.5, 15.3, 45.9]) {
    player.speed = speed;
    assert.equal(getExpression(player), 'joy');
  }
  player.throwTime = .2;
  assert.equal(getExpression(player), 'calling');
  player.throwTime = 0;
  player.speed = 0;
  assert.equal(getExpression(player), 'sleepy');
});


test('the Blender smile lingers after a stop, then settles into the open-eyed normal face', () => {
  const game=createGame(), p=game.state.player;
  assert.equal(getExpression(p),'joy');
  for(let i=0;i<120;i++) game.step(1/60);
  assert.equal(getExpression(p),'joy');
  for(let i=0;i<48;i++) game.step(1/60);
  assert.equal(getExpression(p),'curious');
  for(let i=0;i<12;i++) game.step(1/60,{x:1});
  assert.equal(getExpression(p),'joy');
  for(let i=0;i<42;i++) game.step(1/60);
  assert.equal(getExpression(p),'joy');
});
