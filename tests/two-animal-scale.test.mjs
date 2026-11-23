import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { SPECIES } from '../two/bestiary.js';
import { SCROLL_FAUNA } from '../two/scroll-fauna.js';
import { SEA_SPECIES } from '../two/ryugu-residents.js';
import { residentScale } from '../two/animal-scale-residents.js';
import { wildlifeScale } from '../two/animal-scale-wildlife.js';

test('the size book has a measured portrait for every delivery species and each comparison entry', async () => {
  const entries = [...residentScale, ...wildlifeScale];
  const ids = new Set(entries.map(a => a.id));
  assert.equal(ids.size, entries.length);
  for (const id of ['mochi', 'rabbit', 'frog', 'turtle', ...Object.keys(SPECIES), ...Object.keys(SCROLL_FAUNA), ...Object.keys(SEA_SPECIES)]) {
    assert.ok(ids.has(id), id);
  }
  for (const animal of entries) {
    assert.ok(animal.width > 0 && animal.height > 0 && Number.isFinite(animal.width + animal.height), animal.id);
    assert.ok(['主人公', '陸の動物', '空の動物', '水辺の動物'].includes(animal.group), animal.id);
    await access(new URL('../two/' + animal.image, import.meta.url));
  }
});
