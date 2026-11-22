import test from 'node:test';
import assert from 'node:assert/strict';
import { courtFowl } from '../two/court-fowl.js';
import { poseFaunaPart } from '../two/scroll-fauna-art.js';
import { Object3D, Vector3 } from '../two/vendor/three.module.min.js';

test('both fowl peck at the road with the tip of their sculpted bill', () => {
  for (const variant of [0, 1]) {
    const parts = courtFowl(variant === 1);
    const head = parts.find(part => part.name === 'head');
    const vertices = head.geometry.getAttribute('position');
    let bill = 0;
    for (let i = 1; i < vertices.count; i++) {
      if (vertices.getZ(i) > vertices.getZ(bill)) bill = i;
    }
    const pose = new Object3D(), tip = new Vector3();
    const bird = {type:'chicken', variant, speed:0, phase:Math.PI / 3.2, gesture:0};
    function tipHeight() {
      poseFaunaPart(head, bird, 0, pose);
      return tip.fromBufferAttribute(vertices, bill).applyMatrix4(pose.matrix).y;
    }
    assert.ok(tipHeight() > .65);
    bird.gesture = 1;
    const height = tipHeight();
    assert.ok(height >= 0 && height < .05, 'bill should meet the ground above the toes');
    parts.forEach(part => part.geometry.dispose());
  }
});
