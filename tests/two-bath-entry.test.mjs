import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../two/game.js';
import { groundHeight } from '../two/terrain.js';

test('the iron kettle eases a bather in from the board and back to the same footing', () => {
  let game = createGame();
  const kettle = game.state.objects.find(o => o.goemon);
  const x = kettle.x + .73, z = kettle.z;
  const y = groundHeight(x, z, kettle.y);
  const footing = { x, y, z };
  Object.assign(game.state.player, footing);
  assert.equal(game.nearest()?.target, kettle);
  assert.ok(game.act('interact'));

  let previousX = x, reachedCentre = false;
  for (let frame = 0; frame < 240 && game.state.player.activity === 'bath'; frame++) {
    const p = game.state.player, berth = p.bathPose;
    assert.deepEqual({ x:p.x, y:p.y, z:p.z }, footing);
    assert.ok(Math.abs(berth.x - previousX) < .035, 'a continuous entry and exit at 60 Hz');
    assert.ok(Math.abs(berth.z - z) < 1e-8);
    if (Math.abs(berth.x - kettle.x) < 1e-8) reachedCentre = true;
    previousX = berth.x;
    if (frame === 18) {
      game = createGame(game.save());
      assert.ok(game.restored);
      assert.deepEqual(game.state.player.bathPose, berth);
    }
    game.step(1 / 60);
  }
  assert.equal(game.state.player.activity, null);
  assert.ok(reachedCentre);
  assert.ok(Math.abs(previousX - x) < .001);
  assert.deepEqual({ x:game.state.player.x, y:game.state.player.y, z:game.state.player.z }, footing);
});
