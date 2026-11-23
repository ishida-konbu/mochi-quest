import * as THREE from './vendor/three.module.min.js';
import { waterSurfaceAt, WATER_Y, wrapDelta } from './terrain.js';
import { waterWave } from './shoreline.js';

// Each brushstroke has a dense outer belly and a pale crest on its inner edge.
// Building the two colours into a single ribbon keeps each impression one draw.
function ripplePlate(moving) {
  const points = [], colours = [], indices = [];
  const ink = new THREE.Color('#62736b'), crest = new THREE.Color('#ece6d5');
  function arc(start, end, rx, rz, z, width, phase) {
    const offset = points.length / 3;
    const count = 34;
    for (let i = 0; i <= count; i++) {
      const u = i / count, angle = start + (end - start) * u;
      const sx = Math.sin(angle), sz = Math.cos(angle);
      const bend = 1 + .018 * Math.sin(3 * angle + phase);
      const pressure = width * Math.sin(Math.PI * u) ** .68 * (.86 + .14 * Math.cos(4 * angle + phase));
      for (const edge of [-1, -.15, 1]) {
        points.push(sx * (rx * bend + edge * pressure), 0, z + sz * (rz * bend + edge * pressure));
        const colour = edge > 0 ? ink : crest;
        colours.push(colour.r, colour.g, colour.b);
      }
      if (i < count) {
        const k = offset + 3 * i;
        indices.push(k,k+1,k+3,k+1,k+4,k+3, k+1,k+2,k+4,k+2,k+5,k+4);
      }
    }
  }
  if (moving) {
    // The halves peel off the two flanks. The short, broken strokes behind
    // them describe the return of a paw or paddle through the surface.
    arc(.45,2.83,.91,1.12,-.10,.050,.4);
    arc(-2.75,-.39,.87,1.08,-.08,.047,2);
    arc(1.37,2.50,1.03,1.30,-.16,.023,.2);
    arc(-2.37,-1.58,.99,1.21,-.11,.024,1.8);
  } else {
    arc(-2.93,.43,.86,.79,0,.042,.6);
    arc(.78,2.95,.88,.80,.02,.034,1.6);
    arc(-.53,.77,1.01,.92,0,.020,.8);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createWake(scene) {
  const still = ripplePlate(false), travelling = ripplePlate(true);
  const rings = Array.from({length: 7}, () => {
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    // The drawing is flat; front and back use the same translucent impression.
    material.forceSinglePass = true;
    const mesh = new THREE.Mesh(still, material);
    mesh.visible = false;
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, born: -Infinity, strength: 0, span: 1, level: 0, waves: false };
  });
  let next = 0, last = -Infinity;
  return (p, t) => {
    if (t < last) {
      // A photograph has its own clock. Discard its impressions on returning
      // to the journey so they cannot reappear a few seconds down the river.
      for (const ring of rings) ring.born = -Infinity;
      last = -Infinity;
    }
    const moving = p.speed > .3;
    const interval = moving ? Math.max(.18, .33 - p.speed * .012) : 1.12;
    if (p.inWater && !p.diveDepth && t - last > interval) {
      const ring = rings[next];
      next = (next + 1) % rings.length;
      ring.born = last = t;
      ring.strength = Math.min(1, .4 + p.speed * .13);
      ring.span = p.mount === 'turtle' ? 1.35 : p.mount === 'bike' ? .63 : 1;
      const bath = p.bathWaterY;
      ring.level = bath ?? waterSurfaceAt(p.x,p.z,t,p.y);
      ring.waves = bath == null && ring.level === WATER_Y;
      const heading = moving ? Math.atan2(p.vx, p.vz) : next * 2.4;
      const tail = moving ? ring.span * .36 : 0;
      ring.mesh.position.set(p.x - tail * Math.sin(heading), ring.level, p.z - tail * Math.cos(heading));
      ring.mesh.rotation.y = heading;
      ring.mesh.geometry = moving ? travelling : still;
    }
    for (const ring of rings) {
      const { mesh, born, strength, span } = ring;
      const age = (t - born) / 1.30;
      mesh.visible = age >= 0 && age < 1;
      if (!mesh.visible) continue;
      const at = mesh.position;
      at.x = p.x + wrapDelta(at.x - p.x);
      at.z = p.z + wrapDelta(at.z - p.z);
      at.y = ring.level + .032 + (ring.waves ? waterWave(at.x, at.z, t) : 0);
      mesh.scale.setScalar(span * (.68 + age * (1.05 + strength * .59)));
      mesh.material.opacity = (.35 + .42 * strength) * (1 - age) ** 1.45;
    }
  };
}
