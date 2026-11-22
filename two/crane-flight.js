import * as T from './vendor/three.module.min.js';
import { poseBeast } from './beast-art.js';

// One articulated reference supplies native joint matrices to every crane.
// The eye, the ink hull and each side of every remex keep their real geometry,
// including when the camera flies above or below a flock.
export function createCraneFlight(parent, reference, capacity) {
  const { mesh: rig, limbs, shadow } = reference;
  shadow.removeFromParent();
  const pieces = [];

  function batch(geometry, material, name) {
    const mesh = new T.InstancedMesh(geometry, material, capacity);
    mesh.name = name;
    mesh.count = 0;
    mesh.frustumCulled = false; // The caller culls each bird's own flight volume.
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    parent.add(mesh);
    return mesh;
  }
  rig.traverse(part => {
    if (!part.isMesh) return;
    const mesh = batch(part.geometry, part.material, '空を舞う丹頂');
    mesh.receiveShadow = part.receiveShadow;
    // Ground contact is drawn once below, outside the wing and banking transforms.
    pieces.push({ part, mesh });
  });
  const shade = batch(shadow.geometry, shadow.material, '丹頂の地上の影');
  shade.renderOrder = shadow.renderOrder;
  const ground = new T.Object3D();
  ground.rotation.order = 'YXZ';
  let birds = 0, shadows = 0;
  function finish(mesh, count) {
    mesh.visible = count > 0;
    mesh.count = count;
    if (!count) return;
    mesh.instanceMatrix.clearUpdateRanges();
    mesh.instanceMatrix.addUpdateRange(0, count*16);
    mesh.instanceMatrix.needsUpdate = true;
  }
  return {
    begin() { birds = shadows = 0; },
    add(bird, x, z, time, presence) {
      // At the outer streaming boundary the projected ink footprint tapers
      // continuously to zero without a transparent/dither pass over the feathers.
      const size = (bird.stature || 1) * Math.sqrt(presence*presence*(3-2*presence));
      rig.position.set(x, bird.y, z);
      rig.rotation.y = bird.heading || 0;
      rig.scale.setScalar(size);
      poseBeast(limbs, bird, time);
      rig.updateMatrixWorld(true);
      for (const { part, mesh } of pieces) mesh.setMatrixAt(birds, part.matrixWorld);
      birds++;
      const clearance = bird.altitude || 0;
      if (clearance < 16) {
        const contact = size * (1 - T.MathUtils.smoothstep(clearance, 5, 16));
        ground.position.set(x, bird.y-clearance+.04, z);
        ground.rotation.set(-Math.PI/2, rig.rotation.y, 0, 'YXZ');
        ground.scale.set(shadow.scale.x*contact, shadow.scale.y*contact, 1);
        ground.updateMatrix();
        shade.setMatrixAt(shadows++,ground.matrix);
      }
    },
    end() {
      for (const {mesh} of pieces) finish(mesh,birds);
      finish(shade,shadows);
    },
  };
}
