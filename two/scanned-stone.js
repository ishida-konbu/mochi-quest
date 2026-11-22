import * as THREE from './vendor/three.module.min.js';
import { sitePoint, retreatStones } from './retreat-layout.js';
import { bathCraft } from './regional-bath-fittings.js';
import { GLTFLoader } from './vendor/GLTFLoader.min.js';
import { wetStone, contactRipples } from './stone-water.js';
import { WATER_Y, BRIDGES, coastX, riverZ, riverHalfWidth, seeded, terrainHeight } from './terrain.js';

// The models use the original UVs and tangent-space normals from six scanned
// rocks. Place them as shallow, partially submerged shoals off the footpaths.
export function setRiverStones(scene, objects) {
  const clock = scene.userData.waterClock ??= {value:0};
  const model = new URL('./assets/world/moss-stones.glb', import.meta.url).href;
  new GLTFLoader().load(model, ({ scene: collection }) => {
    const shapes = [];
    collection.traverse((part) => {
      if (!part.isMesh) return;
      const g = part.geometry;
      g.computeBoundingBox();
      const box = g.boundingBox,
        center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      g.translate(-center.x, -box.min.y, -center.z);
      g.scale(1 / size.x, 1 / size.y, 1 / size.z);
      shapes.push({ geo: g, material: part.material });
    });
    if (!shapes.length) return;
    const rng = seeded(45654);
    const stones = shapes.map(() => []);
    const transform = new THREE.Object3D();
    const groups = [
      [-9, 1, 6],
      [9.5, 1, 6],
      [-15, -1, 4],
      [12, -1, 5],
      [41, -1, 4],
      [-62, 1, 4],
      [-125, -1, 6],
      [126, 1, 5],
      [158, -1, 4],
    ];
    function pebble(x, z, span, shoreX, shoreZ) {
      const shape = Math.floor(rng() * shapes.length);
      const tall = span * (0.36 + rng() * 0.33);
      // Seat the rock in the channel bed and stagger it up the slope until
      // the larger stones break the surface. Keep the lower shoal submerged.
      for(let step=0;step<9 && (shoreX||shoreZ) && terrainHeight(x,z)+tall*.70<WATER_Y;step++){
        x+=shoreX*.40;z+=shoreZ*.40;
      }
      const y = terrainHeight(x, z) - tall * (.12 + rng() * .10);
      transform.position.set(x, y, z);
      transform.rotation.set((rng() - 0.5) * 0.18, rng() * Math.PI * 2, (rng() - 0.5) * 0.16);
      transform.scale.set(span, tall, span * (0.58 + rng() * 0.34));
      transform.updateMatrix();
      stones[shape].push(transform.matrix.clone());
    }
    for (const [base, side, count] of groups) {
      for (let n = 0; n < count; n++) {
        const x = base + (rng() - 0.5) * 8;
        const z = riverZ(x) + side * (riverHalfWidth(x) + (rng() - 0.5) * 3.2);
        if (BRIDGES.some((b) => Math.abs(x - b.x) < b.halfWidth + 1.7)) continue;
        if (Math.hypot(x + 11.9, z - 18.2) < 3) continue;
        pebble(x, z, n === 0 ? 2.9 : 0.58 + rng() * 1.8, 0, n%4===1 ? 0 : side);
      }
    }
    for (const z0 of [78, 98, 133, 147]) {
      for (let n = 0; n < 6; n++) {
        const z = z0 + (rng() - 0.5) * 9;
        pebble(coastX(z) + rng() * 3.1 - 1.6, z, 0.7 + rng() * 2.6, n%4===1 ? 0 : 1, 0);
      }
    }
    function drawGroups(batches, level, mineral) {
      shapes.forEach(({ geo, material }, i) => {
        if (!batches[i].length) return;
        material.map.anisotropy = 4;
        material.normalScale.setScalar(0.76);
        const finish = wetStone(material.clone(), level, clock);
        if(mineral) finish.color.lerp(new THREE.Color(mineral),.30);
        const mesh = new THREE.InstancedMesh(geo, finish, batches[i].length);
        batches[i].forEach((matrix, j) => mesh.setMatrixAt(j, matrix));
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        scene.add(mesh);
      });
    }
    drawGroups(stones, WATER_Y);
    contactRipples(scene, stones, shapes, clock);
    // Each bath has its own batch bounds. Only the spring in view spends
    // triangles on the lichen, chisel edges and dark stones at the waterline.
    for (const pool of objects.filter((o) => o.type === 'onsen' && !o.goemon)) {
      const rim = shapes.map(() => []);
      const yaw = pool.heading || 0,
        cy = Math.cos(yaw),
        sy = Math.sin(yaw);
      if(pool.retreat) {
        const site=pool.retreat;
        for(const q of retreatStones(site).filter(q=>q.scanned)){
          const [x,z]=sitePoint(site,q.u,q.v);
          transform.position.set(x,pool.y+.49-.31*q.h,z);
          transform.scale.set(q.w*2.08,q.h*1.49,q.d*2.11);
          transform.rotation.set(.03*Math.sin(q.i),yaw+q.angle,.05*Math.cos(q.i));
          transform.updateMatrix();
          rim[(q.i+site.index)%shapes.length].push(transform.matrix.clone());
        }
        drawGroups(rim,pool.y+.52,site.regional?bathCraft[site.kind].base:null);
        continue;
      }
      for (let i = 0; i < 23; i++) {
        const a = (i * Math.PI * 2) / 23, tub=pool.villageBath;
        const lip=tub ? tub.lip(a) : 1;
        const dx=((tub?.rx ?? 1.96)-.05)*lip*Math.cos(a),
          dz=((tub?.rz ?? 1.56)-.07)*lip*Math.sin(a);
        transform.position.set(pool.x + dx * cy + dz * sy, pool.y - 0.048, pool.z - dx * sy + dz * cy);
        transform.rotation.set(
          (rng() - 0.5) * 0.18,
          yaw - a + Math.PI / 2 + (rng() - 0.5) * 0.33,
          (rng() - 0.5) * 0.13,
        );
        transform.scale.set(0.48 + rng() * 0.28, 0.3 + rng() * 0.23, 0.37 + rng() * 0.23);
        transform.updateMatrix();
        rim[Math.floor(rng() * rim.length)].push(transform.matrix.clone());
      }
      drawGroups(rim, pool.y + .189);
    }
  });
}
