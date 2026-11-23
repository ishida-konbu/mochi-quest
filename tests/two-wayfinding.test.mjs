import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { BOUND } from '../two/terrain.js';
import { atlasDestinations } from '../two/atlas-destinations.js';
import { guideBearing, mapPoint, restoreMapGoal, savedMapGoal } from '../two/wayfinding.js';
import { decodeTransfer, transferURL, PAGES_ORIGIN, WORKER_ORIGIN } from '../two/journey-transfer.js';

test('the pointing mochi follows camera-relative movement in all eight directions and across the seam', () => {
  const player = { x: 0, z: 0 };
  const poses = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  for (const [i, pose] of poses.entries()) {
    const angle = i * Math.PI / 4;
    const place = { x: 10 * Math.sin(angle), z: -10 * Math.cos(angle) };
    assert.equal(guideBearing(player, place, 0).pose, pose);
    assert.equal(guideBearing(player, place, Math.PI / 2).pose, poses[(i + 2) % 8]);
  }
  const across = guideBearing({ x: BOUND - 2, z: 0 }, { x: -BOUND + 3, z: 0 }, 0);
  assert.equal(across.pose, 'e');
  assert.equal(across.distance, 5);
  assert.equal(guideBearing(player, player, 0, 1).pose, 'arrived');
  assert.equal(guideBearing(player, player, 0, 12).label, '真上');
  assert.equal(guideBearing(player, player, 0, -12).label, '真下');
});

test('new and old map goals reopen at surveyed positions, and a custom pin retains its exact location on transfer', () => {
  const game = createGame();
  const destinations = atlasDestinations(game.state);
  assert.equal(new Set(destinations.map(place => place.id)).size, destinations.length);
  assert.equal(restoreMapGoal('moon', destinations).kind, 'region');
  for (const kind of ['port', 'bath']) {
    const place = destinations.find(entry => entry.kind === kind);
    assert.ok(place);
    assert.equal(restoreMapGoal(savedMapGoal(place), destinations), place);
  }
  const pin = mapPoint(184.63, -23.92);
  const transfers = [
    { goal: destinations.find(place => place.kind === 'port').id, minimap: { size: 'large', zoom: 2 } },
    { goal: savedMapGoal(pin), minimap: { size: 'mochi', zoom: .25 } },
  ];
  for (const { goal, minimap } of transfers) {
    // Only the chosen size and scale travel. Restore following the new player position.
    const settings = { sound: true, yaw: .35, minimap: { ...minimap, centerX: 18, centerZ: -40 }, goal };
    const hash = new URL(transferURL(PAGES_ORIGIN, game.save(), settings)).hash;
    const incoming = decodeTransfer(WORKER_ORIGIN, hash, createGame);
    assert.deepEqual(incoming.settings.goal, goal);
    assert.deepEqual(incoming.settings.minimap, minimap);
  }
  assert.deepEqual(restoreMapGoal(savedMapGoal(pin), destinations), pin);
  for (const x of [Infinity, '30', null, BOUND + 1]) {
    assert.equal(restoreMapGoal({ kind: 'point', x, z: 0 }, destinations), null);
  }
});
