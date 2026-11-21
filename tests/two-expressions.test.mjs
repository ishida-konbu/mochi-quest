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

test('jumping, stretching and flying have distinct faces, and a camera pose is temporary', () => {
  const player = createGame().state.player;
  Object.assign(player, { grounded: false, h: 1, stretch: .2 });
  assert.equal(getExpression(player), 'surprise');
  player.mode = 'dango';
  assert.equal(getExpression(player), 'determined');
  player.mode = 'habutae';
  assert.equal(getExpression(player), 'joy');
  player.emote = 'sleepy';
  assert.equal(getExpression(player), 'sleepy');
  delete player.emote;
  assert.equal(getExpression(player), 'joy');
});
