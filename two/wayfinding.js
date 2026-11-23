import { BOUND, REGIONS, regionAt, wrapDelta } from './terrain.js';

export function mapPoint(x, z) {
  if (![x, z].every(Number.isFinite) || Math.abs(x) > BOUND || Math.abs(z) > BOUND) return null;
  return {
    kind: 'point', name: '地図に打った印', region: REGIONS[regionAt(x, z)].id,
    x: wrapDelta(x), z: wrapDelta(z),
  };
}

// Names and facility coordinates come from the current survey on every load.
// Original journeys already store scenic destinations by their region ID.
export function savedMapGoal(goal) {
  if (!goal) return null;
  return goal.kind === 'point' ? { kind: 'point', x: goal.x, z: goal.z } : goal.id;
}

export function restoreMapGoal(value, destinations) {
  if (typeof value === 'string') return destinations.find(place => place.id === value) ?? null;
  return value?.kind === 'point' ? mapPoint(value.x, value.z) : null;
}

const bearings = [
  ['n', '↑', 'まっすぐ'], ['ne', '↗', '右斜め前'], ['e', '→', '右へ'], ['se', '↘', '右斜め後ろ'],
  ['s', '↓', '後ろへ'], ['sw', '↙', '左斜め後ろ'], ['w', '←', '左へ'], ['nw', '↖', '左斜め前'],
];

export function guideBearing(player, destination, yaw, height = 0) {
  const dx = wrapDelta(destination.x - player.x);
  const dz = wrapDelta(destination.z - player.z);
  const distance = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, -dz) + yaw;
  const index = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  let [pose, mark, label] = bearings[index];
  if (distance <= 2.5) {
    if (Math.abs(height) <= 2) [pose, mark, label] = ['arrived', '着', '到着'];
    else [pose, mark, label] = height > 0 ? ['n', '↑', '真上'] : ['s', '↓', '真下'];
  }
  const elevation = Math.abs(height) > 2 ? (height > 0 ? '上 ' : '下 ') + Math.round(Math.abs(height)) + ' m' : '';
  return { pose, mark, label, distance: Math.round(distance), elevation };
}
