import {inkTree} from './landmark-tree.js';
import { inMountainStreamClearing } from './mountain-streams.js';
import { inHutYard } from './wayside-hut-layout.js';
import { GATE_PAVING, RASHOMON, inCapitalWard } from './kyo-layout.js';
import { kiyomizuClearing } from './kiyomizu-layout.js';
import { reservedScenery } from './retreat-layout.js';
import { prunePlantBatch } from './homestead-groundcover.js';
import * as THREE from './vendor/three.module.min.js';
import {
  BRIDGES,
  BUILDINGS,
  REGIONS,
  ROADS,
  TREES,
  LANDMARK_TREES,
  hasAutumnLeaves,
  WATER_Y,
  nearRoad,
  seasonAt,
  riverZ,
  riverHalfWidth,
  terrainHeight,
  seeded,
} from './terrain.js';

const TAU = Math.PI * 2;
const { sin, cos, min, max, abs } = Math;
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const h = terrainHeight;

class BarkBrush {
  constructor(scene, art) {
    this.scene = scene;
    this.wood = new THREE.MeshStandardMaterial({
      map: art.bark,
      bumpMap: art.bark,
      bumpScale: 0.061,
      roughness: 0.93,
      envMapIntensity: 0.27,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    this.buffers = new Map();
  }
  stroke(points, radii, sides, steps, seed, shade) {
    const root = points[0],
      key = Math.floor(root.x / 76) + ',' + Math.floor(root.z / 76);
    let batch = this.buffers.get(key);
    if (!batch) {
      batch = { p: [], uv: [], ink: [], ix: [], distant: [] };
      this.buffers.set(key, batch);
    }
    const { p, uv, ink, ix } = batch;
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal'),
      count = points.length;
    const offset = p.length / 3;
    const a = v(0, 0, 1),
      b = v(0, 0, 0),
      spot = v(0, 0, 0),
      dir = v(0, 0, 0),
      last = points[0].clone(),
      tint = new THREE.Color(shade);
    let length = 0;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      curve.getPoint(t, spot);
      curve.getTangent(t, dir);
      a.addScaledVector(dir, -a.dot(dir));
      if (a.lengthSq() < 0.003) a.set(1, 0, 0).addScaledVector(dir, -dir.x);
      a.normalize();
      b.crossVectors(dir, a).normalize();
      length += spot.distanceTo(last);
      last.copy(spot);
      const scaled = t * (count - 1),
        index = min(count - 2, Math.floor(scaled)),
        f = scaled - index;
      const radius = radii[index] * (1 - f) + radii[index + 1] * f;
      for (let k = 0; k <= sides; k++) {
        const angle = (k / sides) * TAU;
        const furrow = 1 + 0.095 * cos(angle * 5 + seed + t * 0.85) + 0.075 * sin(angle * 3 - seed - t * 1.5);
        const vx = a.x * cos(angle) + b.x * sin(angle),
          vy = a.y * cos(angle) + b.y * sin(angle),
          vz = a.z * cos(angle) + b.z * sin(angle);
        p.push(spot.x + vx * radius * furrow, spot.y + vy * radius * furrow, spot.z + vz * radius * furrow);
        uv.push(
          (k / sides) * max(0.6, radii[0] * 6.7) + seed * 0.731,
          length / (1.25 + radii[0] * 0.56) + seed * 0.39,
        );
        const value = 0.78 + 0.15 * max(0, vy) + 0.11 * (0.5 + 0.5 * sin(angle * 5 + seed + t * 1.32));
        ink.push(tint.r * value, tint.g * value, tint.b * value);
        if (j < steps && k < sides) {
          const i = offset + j * (sides + 1) + k,
            n = i + sides + 1;
          ix.push(i, i + 1, n, i + 1, n + 1, n);
        }
      }
    }
    // Distant bark uses the same painted vertices, with fewer trunk rings and
    // a coarser cross-section. Fine twigs disappear under the foliage.
    if (radii[0] >= .106) {
      const rings = Math.min(steps, radii[0]>.38 ? 5 : 3), facets = 4;
      for (let j=0; j<rings; j++) for (let k=0; k<facets; k++) {
        const a=offset+Math.round(j*steps/rings)*(sides+1);
        const b=offset+Math.round((j+1)*steps/rings)*(sides+1);
        const k0=Math.round(k*sides/facets), k1=Math.round((k+1)*sides/facets);
        batch.distant.push(a+k0,a+k1,b+k0,a+k1,b+k1,b+k0);
      }
    }
  }
  finish() {
    for (const b of this.buffers.values()) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(b.ink, 3));
      geo.setIndex(b.ix);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const tree = new THREE.Mesh(geo, this.wood);
      const distant=new THREE.BufferGeometry();
      // A first glimpse across the island only uploads the retained trunk
      // rings. Keep their original normals, inks and UVs for a matching outline.
      const vertices=[...new Set(b.distant)];
      const compact=new Map(vertices.map((original,index)=>[original,index]));
      for(const [name,source] of Object.entries(geo.attributes)){
        const attr=new THREE.BufferAttribute(new Float32Array(vertices.length*source.itemSize),source.itemSize);
        for(let i=0;i<vertices.length;i++)attr.copyAt(i,source,vertices[i]);
        distant.setAttribute(name,attr);
      }
      distant.setIndex(b.distant.map(original=>compact.get(original)));
      distant.boundingSphere=geo.boundingSphere;
      tree.userData.nearGeometry=geo;
      tree.userData.farGeometry=distant;
      tree.castShadow = true;
      tree.receiveShadow = true;
      this.scene.add(tree);
    }
  }
}
export function* plantInkTrees(p, art, boughs) {
  const brush = new BarkBrush(p.scene, art);
  for (const tree of LANDMARK_TREES) {
    const elder=tree===TREES[0];
    const near=elder || REGIONS.some(q=>(q.x-tree.x)**2+(q.z-tree.z)**2<38**2);
    if(tree.kind!=='bamboo')inkTree(brush,p,tree,seeded(tree.seed),h,elder,near,tree.kind==='maple' && hasAutumnLeaves(tree),boughs?.get(tree));
    yield;
  }
  brush.finish();
}

const HERB = { plume: 0, sedge: 1, butterbur: 2, fern: 3, flowers: 4, shrub: 5 };
const herbAspect = [1.0, 1.07, 1.0, 1.11, 0.99, 1.1];
function herbsMaterial(art, clock) {
  const mat = new THREE.MeshLambertMaterial({
    map: art.herbs,
    alphaTest: 0.33,
    side: THREE.DoubleSide,
    vertexColors: true,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.inkWind = clock;
    shader.vertexShader =
      'attribute vec2 atlasCell; uniform float inkWind;\n' +
      shader.vertexShader
        .replace(
          '#include <uv_vertex>',
          `#include <uv_vertex>
        vMapUv=(atlasCell+uv)/vec2(3.,2.);`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
        float phase=dot(instanceMatrix[3].xz,vec2(.15,.12))+inkWind;
        transformed.x += uv.y*uv.y*(sin(phase+.6*uv.y)*.032+sin(phase*1.93)*.009);
        transformed.z += uv.y*uv.y*cos(phase*.81)*.012;`,
        );
    // Leaves stay legible from either side while still receiving actual scene shadows.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
      normal=normalize(mix(normal,normalize(mat3(viewMatrix)*vec3(0.,1.,0.)),.74));`,
    );
  };
  return mat;
}
function herbGeometry() {
  const geo = new THREE.PlaneGeometry(1, 1, 2, 3),
    p = geo.attributes.position,
    col = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i) + 0.5;
    p.setXYZ(i, x * (0.74 + 0.26 * y), y, 0.11 * y * y + 0.085 * x * x);
    const lit = 0.65 + 0.35 * y;
    col.push(lit, lit, lit * 0.995);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}
function scatteredHerbs(p, art) {
  const rng = seeded(831453),
    patches = new Map(),
    d = new THREE.Object3D();
  function onGateStone(x,z,padding){
    const u=x-RASHOMON.x,v=z-RASHOMON.z;
    return abs(u)<20+padding && abs(v)<15+padding &&
      GATE_PAVING.some(b=>abs(u-b.x)<=b.w/2+padding && abs(v-b.z)<=b.d/2+padding);
  }
  const plant = (kind, x, z, size, width = 1, dir = rng() * TAU, count = 2, tint = '#f1f0dc') => {
    if(onGateStone(x,z,size*width*.68))return;
    const y = h(x, z);
    // A verge of one lane can cross the flagstones of the perpendicular one.
    if(inCapitalWard(x,z,3) && (nearRoad(x,z,1.4) || BUILDINGS.some(b=>{
      const dx=x-b.x,dz=z-b.z;
      return abs(dx*b.cos-dz*b.sin)<b.w/2+.80 && abs(dx*b.sin+dz*b.cos)<b.d/2+1.4;
    })))return;
    if (kiyomizuClearing(x,z) || inMountainStreamClearing(x,z) || inHutYard(x,z) || reservedScenery(x,z) || y < WATER_Y - 0.08 || (z < -185 && seasonAt(x,z).snow>.45)) return;
    const cell = HERB[kind],
      key = Math.floor(x / 68) + ',' + Math.floor(z / 68);
    let group = patches.get(key);
    if (!group) {
      group = [];
      patches.set(key, group);
    }
    for (let j = 0; j < count; j++) {
      const a = dir + j * 2.12 + (rng() - 0.5) * 0.52,
        off = j ? size * 0.12 : 0;
      d.position.set(x + cos(a) * off, y - 0.035, z + sin(a) * off);
      d.rotation.set(-0.05 + rng() * 0.15, a, (rng() - 0.5) * 0.12, 'YXZ');
      const wide = (0.9 + rng() * 0.18) * size * width * herbAspect[cell];
      d.scale.set(wide, size * (0.88 + rng() * 0.2), wide);
      d.updateMatrix();
      group.push({ m: d.matrix.clone(), cell, color: new THREE.Color(tint) });
    }
  };
  const stone = (x, z, s, yaw, shade) => {
    if (kiyomizuClearing(x,z) || inMountainStreamClearing(x,z) || inHutYard(x,z) || reservedScenery(x,z) || onGateStone(x,z,s*1.18)) return;
    p.part(
      'rock',
      x,
      h(x, z) + s * 0.19,
      z,
      s * 1.18,
      s * 0.68,
      s * 0.9,
      shade,
      yaw,
      0.06 + noise() * 0.1,
      0.1 * noise(),
      p.stone,
      true,
      true,
    );
  };
  const noise = () => rng() - 0.5;
  // Dense banks from the picture scroll leave the road open between massed
  // patches. Individual clumps splay in several planes and can be circled.
  for (let i = 0; i < 1050; i++) {
    const x = rng() * 482 - 241,
      side = rng() > 0.5 ? 1 : -1;
    const z = riverZ(x) + side * (riverHalfWidth(x) + 0.94 + rng() ** 1.55 * 7.8);
    if (BRIDGES.some((b) => abs(b.x - x) < b.halfWidth + 1.0)) continue;
    const size = 0.52 + rng() ** 1.2 * 1.18;
    plant(rng() < 0.67 ? 'sedge' : 'plume', x, z, size, 1.03, rng() * TAU, 2, '#e2e5cb');
    if (i % 4 === 0) plant('butterbur', x + 0.48, z - 0.22, size * 0.61, 1.22, rng() * TAU, 2);
  }
  // Woodland edges are irregular beds, with small shaded leaves under a
  // second taller layer. Terrain and road marks remain visible in the gaps.
  for (const t of LANDMARK_TREES) {
    if (t.kind === 'bamboo' && t.seed % 3 === 0) continue;
    const count = 3 + (t.seed % 4);
    for (let i = 0; i < count; i++) {
      const a = rng() * TAU,
        rad = 0.7 + rng() * 3.1,
        x = t.x + cos(a) * rad,
        z = t.z + sin(a) * rad;
      if (nearRoad(x, z, 0.0) || BUILDINGS.some((b) => abs(x - b.x) < b.w * 0.52 && abs(z - b.z) < b.d * 0.52))
        continue;
      const size = 0.48 + rng() * 0.65,
        choice = rng();
      plant(
        choice < 0.34 ? 'fern' : choice < 0.59 ? 'butterbur' : choice < 0.81 ? 'sedge' : 'shrub',
        x,
        z,
        size,
        1.17,
        rng() * TAU,
        2,
        '#dce4c9',
      );
    }
  }
  // Connected hedges and rushy hollows fill the land between the paths. Large
  // clearings are interleaved with close, uneven runs of flowers and scrub.
  for (let group = 0; group < 395; group++) {
    const cx = rng() * 474 - 237,
      cz = rng() * 474 - 237,
      phi = rng() * TAU;
    if (
      h(cx, cz) < WATER_Y + 0.28 ||
      nearRoad(cx, cz, 2.3) ||
      REGIONS.some((q) => (q.x - cx) ** 2 + (q.z - cz) ** 2 < 18 ** 2)
    )
      continue;
    const radius = 1.5 + rng() * 4.4;
    for (let j = 0; j < 8 + rng() * 9; j++) {
      const a = rng() * TAU,
        r = radius * Math.sqrt(rng());
      const x = cx + (cos(a) * cos(phi) - sin(a) * 0.54 * sin(phi)) * r;
      const z = cz + (cos(a) * sin(phi) + sin(a) * 0.54 * cos(phi)) * r;
      if (BUILDINGS.some((b) => abs(x - b.x) < b.w * 0.52 + 0.8 && abs(z - b.z) < b.d * 0.52 + 0.8)) continue;
      const pick = rng(),
        s = 0.4 + (1 - r / (radius * 1.35)) * (0.46 + rng() * 0.73);
      plant(
        pick < 0.36 ? 'shrub' : pick < 0.56 ? 'butterbur' : pick < 0.73 ? 'fern' : pick < 0.87 ? 'sedge' : 'plume',
        x,
        z,
        s,
        1.15,
        rng() * TAU,
        2,
        '#dce1c9',
      );
    }
  }
  for (const road of ROADS) {
    for (let j = 3; j < road.points.length; j += 5) {
      if (rng() < 0.28) continue;
      const [x, z] = road.points[j],
        prev = road.points[j - 1],
        dx = x - prev[0],
        dz = z - prev[1],
        len = Math.hypot(dx, dz) || 1;
      const side = rng() > 0.5 ? 1 : -1;
      for (let k = 0; k < 3 + rng() * 3; k++) {
        const edge = side * (road.width * 0.54 + rng() * 1.5),
          phase = (rng() - 0.5) * 3;
        const xx = x + (dz / len) * edge + (dx / len) * phase,
          zz = z - (dx / len) * edge + (dz / len) * phase;
        if (h(xx, zz) < WATER_Y + 0.07) continue;
        const pick = rng(),
          size = 0.37 + rng() * 0.68;
        plant(
          pick < 0.34
            ? 'sedge'
            : pick < 0.56
              ? 'plume'
              : pick < 0.75
                ? 'fern'
                : pick < 0.89
                  ? 'butterbur'
                  : 'flowers',
          xx,
          zz,
          size,
          1.0,
          rng() * TAU,
          2,
        );
      }
    }
  }
  // Deliberately composed foreground groupings at the first bend. Low leaves
  // hold the near corners, with higher plumes against the river and hills.
  const beds = [
    [-4.4, 64.1, 1.13],
    [8.4, 63.6, 1.13],
    [-3.57, 65.7, 0.83],
    [8.6, 66.7, 0.88],
    [-6.75, 58.3, 1.25],
    [6.65, 58.9, 1.17],
    [-9.42, 51.2, 1.43],
    [9.06, 50.65, 1.26],
    [-5.25, 45.4, 1.13],
    [5.38, 44.5, 1.14],
    [-7.9, 36.4, 1.16],
    [6.95, 34.2, 1.24],
  ];
  for (const [cx, cz, s] of beds) {
    const sign = cx < 0 ? -1 : 1;
    stone(cx + sign * 0.24, cz, s * 0.63, rng() * TAU, '#bac1b2');
    stone(cx + sign * 0.81, cz + 0.53, s * 0.41, rng() * TAU, '#abb7a1');
    plant('fern', cx + sign * 0.52, cz + 0.48, s * 0.78, 1.12, 0.08, 3);
    plant('plume', cx + sign * 0.96, cz - 0.23, s * 1.51, 0.94, sign * 0.23, 3, '#e6e4c9');
    plant('sedge', cx, cz - 0.36, s * 1.21, 1.12, sign * 0.32, 3);
    plant('butterbur', cx - sign * 0.19, cz + 0.64, s * 0.65, 1.22, sign * 0.12, 2, '#e5ead5');
    plant('flowers', cx + sign * 0.36, cz + 1.02, s * 0.52, 1.22, sign * 0.35, 2);
    for (let j = 0; j < 4; j++)
      plant(
        'sedge',
        cx + sign * rng() * 1.57,
        cz + (rng() - 0.5) * 2,
        s * (0.37 + rng() * 0.43),
        1.34,
        rng() * TAU,
        2,
      );
  }
  const material = herbsMaterial(art, p.sway),
    base = herbGeometry();
  const bedsByMesh=[];
  for (const arr of patches.values()) {
    const geo = base.clone(),
      cells = new Float32Array(arr.length * 2);
    const mesh = new THREE.InstancedMesh(geo, material, arr.length);
    arr.forEach(({ m, cell, color }, j) => {
      mesh.setMatrixAt(j, m);
      mesh.setColorAt(j, color);
      cells[j * 2] = cell % 3;
      cells[j * 2 + 1] = 1 - Math.floor(cell / 3);
    });
    geo.setAttribute('atlasCell', new THREE.InstancedBufferAttribute(cells, 2));
    mesh.computeBoundingSphere();
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    p.scene.add(mesh);
    p.closeDetails.push(mesh);
    bedsByMesh.push({mesh,hidden:new Map()});
  }
  return plots=>{
    for(const {mesh,hidden} of bedsByMesh){
      const {center,radius}=mesh.boundingSphere;
      const near=plots.filter(p=>Math.hypot(p.x-center.x,p.z-center.z)<radius+4);
      if(near.length || hidden.size)prunePlantBatch(mesh.instanceMatrix,12,0,0,hidden,near,.78);
    }
  };
}
export function plantUnderstory(p, art) {
  return scatteredHerbs(p, art);
}
