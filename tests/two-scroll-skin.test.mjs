import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../two/vendor/three.module.min.js';
import { buildScrollBeast, bindScrollSkin } from '../two/handscroll-beasts.js';

function joint(parent, name, x = 0, y = 0, z = 0) {
  const node = new THREE.Group();
  node.name = name;
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

test('turning a cloned deer moves its ink outline and leaves its neighbour in place', () => {
  const template = new THREE.Group();
  buildScrollBeast(template, 'deer', { group: joint, batch() {} }, 0, () => new THREE.MeshStandardMaterial());
  const moving = template.clone(true);
  bindScrollSkin(moving);
  const still = template.getObjectByName('絵巻の一枚皮');
  const animal = moving.getObjectByName('絵巻の一枚皮');
  const line = animal.getObjectByName('墨の輪郭');
  assert.notEqual(animal.skeleton, still.skeleton);
  assert.equal(line.skeleton, animal.skeleton);
  assert.equal(animal.geometry, still.geometry);
  assert.ok(animal.skeleton.bones.every((bone, index) => bone !== still.skeleton.bones[index]));

  moving.getObjectByName('mask').rotation.y = .6;
  moving.getObjectByName('leg-1,-1').rotation.x = .5;
  moving.updateMatrixWorld(true);
  const joins = new Map(), rest = new THREE.Vector3(), posed = new THREE.Vector3(), neighbour = new THREE.Vector3();
  let duplicates = 0, furthest = 0;
  const vertices = animal.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    rest.fromBufferAttribute(vertices, i);
    animal.getVertexPosition(i, posed);
    still.getVertexPosition(i, neighbour);
    assert.ok(rest.distanceTo(neighbour) < 1e-6);
    furthest = Math.max(furthest, rest.distanceTo(posed));
    // Front and underside UV charts split render vertices along the shoulder.
    // Both copies must still meet after the neck and far hind leg turn.
    const key = rest.toArray().join(',');
    const twin = joins.get(key);
    if (twin) {
      duplicates++;
      assert.ok(twin.distanceTo(posed) < 1e-6);
    } else joins.set(key, posed.clone());
  }
  assert.ok(duplicates > 50);
  assert.ok(furthest > .2);
});
