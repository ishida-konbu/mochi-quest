import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { SPECIES } from '../two/bestiary.js';
import { SCROLL_FAUNA } from '../two/scroll-fauna.js';
import { SEA_SPECIES } from '../two/ryugu-residents.js';
import { residentScale } from '../two/animal-scale-residents.js';

test('the size book contains the white mochi and exactly the delivery species in ledger order', async () => {
  const ledger = { frog: '蛙', rabbit: '兎', turtle: 'ミツユビハコガメ',
    ...Object.fromEntries(Object.entries({...SPECIES, ...SEA_SPECIES, ...SCROLL_FAUNA})
      .map(([id, spec]) => [id, id === 'bird' ? '丹頂鶴' : spec.label])) };
  assert.deepEqual(residentScale.map(a => [a.id, a.label]), [['mochi', '白餅'], ...Object.entries(ledger)]);
  for (const animal of residentScale) {
    assert.ok(animal.width > 0 && animal.height > 0 && Number.isFinite(animal.width + animal.height), animal.id);
    assert.ok(['主人公', '陸の動物', '空の動物', '水辺の動物'].includes(animal.group), animal.id);
    await access(new URL('../two/' + animal.image, import.meta.url));
  }
});
