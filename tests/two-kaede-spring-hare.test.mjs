import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { animateNPC, makeNPC } from '../two/actors.js';
import { MOUNTAIN_STREAMS } from '../two/mountain-streams.js';
import { canOccupy, groundHeight, terrainContactHeight, waterSurfaceAt } from '../two/terrain.js';

const spring = MOUNTAIN_STREAMS.find(stream => stream.id === 'kaede-spring');

test('the maple hare walks the dry bank, dips the actual pail into the headpool and brings the load back', t => {
  // The articulated mesh uses one canvas to paint its shadow.
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture());
  const canvas = {getContext: () => ({createRadialGradient: () => ({addColorStop(){}}), fillRect(){}})};
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {configurable:true, value:{createElement:() => canvas}});
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else delete globalThis.document;
  });

  const game = createGame(), {state} = game;
  const hare = state.npcs.find(n => n.id === 'rabbit-38');
  assert.ok(hare?.waterHare);
  const rig = makeNPC(hare, new Group());
  // Keep the spring in the active cell while leaving the worker's path clear.
  Object.assign(state.player, {x:292, z:-115.8, y:groundHeight(292,-115.8), grounded:true});
  const bridgehead = terrainContactHeight(289,-120); // Soil beneath the original stone basin.
  let previous = {...hare}, filled = false, resumed = false, emptied = false;
  for (let time = 0; time < 180 && !emptied; time += .1) {
    state.time = time;
    game.step(1/60, {});
    const {x,y,z} = hare;
    assert.ok(y >= bridgehead-.05, 'the entire trip stays above the foot of the bridge');
    assert.ok(y > waterSurfaceAt(x,z), 'the hare stands on dry ground');
    assert.ok(Math.abs(y - terrainContactHeight(x,z)) < .05, 'feet follow the actual bank');
    assert.ok(canOccupy(x,z,y,.28), 'the hare clears rocks and shrine timbers');
    const stride = Math.hypot(x-previous.x, z-previous.z);
    assert.ok(stride < .2 && Math.abs(y-previous.y) <= stride + .025, 'continuous walk on the slope');
    previous = {x,y,z};

    if (!filled && hare.waterDip > .995 && hare.pailLevel > .15) {
      animateNPC(rig, hare, state.time, null);
      const lip = rig.limbs.pail.localToWorld(new Vector3(0,-.238,.126));
      const surface = waterSurfaceAt(lip.x,lip.z);
      assert.ok(lip.x < spring.fall.lip.x && surface > spring.fall.lip.y, 'water comes from above the falls');
      assert.ok(terrainContactHeight(lip.x,lip.z) < lip.y && lip.y < surface, 'the tilted rim enters open spring water');
      filled = true;
    }
    if (filled && !resumed && hare.speed > .2 && hare.pailLevel === 1) {
      const loaded = createGame(game.save()).state.npcs.find(n => n.id === hare.id);
      assert.ok(Math.hypot(loaded.x-x,loaded.y-y,loaded.z-z) < .02);
      assert.equal(loaded.pailLevel,1);
      resumed = true;
    }
    if (resumed && hare.waterPour > .8 && hare.pailLevel < .1) emptied = true;
  }
  assert.ok(filled && resumed && emptied, 'filled at the spring, resumed while carrying water, then delivered it');
});
