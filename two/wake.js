import * as THREE from './vendor/three.module.min.js';
import { waterSurfaceAt, wrapDelta } from './terrain.js';

export function createWake(scene) {
  // Rings stay where each stroke disturbed the water rather than following the feet.
  const geometry = new THREE.RingGeometry(0.965, 1, 48, 1);
  geometry.rotateX(-Math.PI / 2);
  const rings = Array.from({ length: 5 }, () => {
    const material = new THREE.MeshBasicMaterial({ color: '#e2eee4', transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, born: -Infinity, strength: 0 };
  });
  let next = 0,
    last = -Infinity;
  return (p, t) => {
    if (p.inWater && (t < last || t - last > (p.speed > 0.3 ? 0.27 : 1.12))) {
      const ring = rings[next];
      next = (next + 1) % rings.length;
      ring.born = last = t;
      ring.strength = Math.min(1, 0.39 + p.speed * 0.12);
      ring.mesh.position.set(p.x, waterSurfaceAt(p.x,p.z) + 0.029, p.z);
    }
    for (const { mesh, born, strength } of rings) {
      const age = (t - born) / 1.36;
      mesh.visible = age >= 0 && age < 1;
      if (!mesh.visible) continue;
      mesh.position.x = p.x + wrapDelta(mesh.position.x - p.x);
      mesh.position.z = p.z + wrapDelta(mesh.position.z - p.z);
      mesh.scale.setScalar(0.54 + age * (1.15 + strength * 0.65));
      mesh.material.opacity = strength * 0.47 * (1 - age) ** 1.8;
    }
  };
}
