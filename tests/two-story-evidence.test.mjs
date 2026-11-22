import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { createStoryEvidence, setEvidencePose } from '../two/story-crafts.js';

test('examining the basket exposes twelve portions without moving the cakes at the ferry', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture());
  const ferry = createStoryEvidence('basket');
  const study = createStoryEvidence('basket', 'joined-cake');
  const cleared = createStoryEvidence('basket', 'leaf-marks');
  const singles = [];
  ferry.traverse(object => { if (object.name === '花筏餅') singles.push(object); });
  assert.equal(singles.length, 10);
  assert.ok(ferry.getObjectByName('合わせ餅'));
  assert.equal(cleared.getObjectByName('合わせ餅'), undefined);
  assert.equal(cleared.getObjectByName('花筏餅'), undefined);

  const joined = study.getObjectByName('合わせ餅');
  const rest = joined.position.clone();
  setEvidencePose(study, 'lift');
  assert.ok(joined.position.y > rest.y + .3);
  assert.ok(new Vector3(0,-1,0).applyQuaternion(joined.quaternion).z > .8);
  assert.deepEqual(ferry.getObjectByName('合わせ餅').position, rest);
  setEvidencePose(study, 'rest');
  assert.deepEqual(joined.position, rest);
});

test('the three loose battens support the upper steamer in the spaced trial', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture());
  const sample = createStoryEvidence('steamer');
  const upper = sample.getObjectByName('蒸し箱の上段');
  const lower = sample.getObjectByName('蒸し箱の下段');
  const rails = [0,1,2].map(i => sample.getObjectByName('取り外し桟'+i));
  const bounds = mesh => new Box3().setFromObject(mesh);
  setEvidencePose(sample, 'single');
  assert.ok(bounds(upper).max.x < bounds(lower).min.x);

  setEvidencePose(sample, 'stacked');
  const stacked = upper.position.y, side = bounds(lower).max.x;
  assert.ok(rails.every(rail => bounds(rail).min.x > side));
  setEvidencePose(sample, 'spaced');
  const base = bounds(lower), raised = bounds(upper);
  for (const rail of rails) {
    const batten = bounds(rail);
    assert.ok(batten.min.x > base.min.x && batten.max.x < base.max.x);
    assert.ok(Math.abs(batten.min.y-base.max.y) < .007);
    assert.ok(Math.abs(batten.max.y-raised.min.y) < .009);
  }
  assert.ok(upper.position.y > stacked + .03);
  setEvidencePose(sample, 'stacked');
  assert.equal(upper.position.y, stacked);
});
