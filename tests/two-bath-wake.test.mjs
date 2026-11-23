import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { createWake } from '../two/wake.js';

test('a soak clears the swim wake at the bank until the bather gets out', () => {
  const scene = new Group(), wake = createWake(scene);
  const game = createGame(), player = game.state.player;
  const bath = game.state.objects.find(object => object.grand);
  Object.assign(player,{x:bath.x, z:bath.z+7.2, y:bath.y, grounded:true, inWater:true});
  const ripples = () => scene.children.filter(mesh => mesh.visible).length;
  wake(player,game.state.time);
  assert.equal(ripples(),1);

  assert.ok(game.act('interact'));
  wake(player,game.state.time);
  assert.equal(ripples(),0,'removes the existing ring on entry');
  let drift = 0;
  for (let i=0; i<32; i++) {
    game.step(.1);
    assert.equal(player.activity,'bath');
    assert.equal(player.inWater,true);
    drift = Math.max(drift,Math.hypot(player.bathPose.x-player.x,player.bathPose.z-player.z));
    wake(player,game.state.time);
    assert.equal(ripples(),0);
  }
  assert.ok(drift>1,'the visible float moves away from the entry point');
  for (let i=0; i<5; i++) game.step(.1);
  assert.equal(player.activity,null);
  wake(player,game.state.time);
  assert.equal(ripples(),1,'swimming rings resume at the waterline');
});
