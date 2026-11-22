import { inMountainStreamClearing } from './mountain-streams.js';
import { inHutYard } from './wayside-hut-layout.js';
import { GATE_PAVING, RASHOMON, inCapitalWard } from './kyo-layout.js';
import { reservedScenery } from './retreat-layout.js';
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
      for (const [name,attribute] of Object.entries(geo.attributes)) distant.setAttribute(name,attribute);
      distant.setIndex(b.distant);
      distant.boundingSphere=geo.boundingSphere;
      tree.userData.nearGeometry=geo;
      tree.userData.farGeometry=distant;
      tree.castShadow = true;
      tree.receiveShadow = true;
      this.scene.add(tree);
    }
  }
}
function inkTree(brush, p, t) {
  const { x, z, h: height, kind, seed } = t,
    r = seeded(seed),
    ground = h(x, z);
  const pine = kind === 'pine',
    willow = kind === 'willow';
  const elder = t === TREES[0],
    near = elder || REGIONS.some((q) => (q.x - x) ** 2 + (q.z - z) ** 2 < 38 ** 2);
  const angle = elder ? 0.08 : r() * TAU,
    lean = pine ? 0.13 + r() * 0.14 : 0.06 + r() * 0.12;
  const tip = (dx, dy, dz) =>
    v(
      x + height * (cos(angle) * dx - sin(angle) * dz),
      ground + height * dy,
      z + height * (sin(angle) * dx + cos(angle) * dz),
    );
  const bend = pine ? 1 : 0.53;
  const spine = [
    tip(0, -0.04, 0),
    tip(-0.045 * bend, 0.15, 0.022),
    tip(0.012, 0.32, -0.045 * bend),
    tip(lean * 0.64, 0.46, 0.018),
    tip(0.042, 0.605, 0.075 * bend),
    tip(lean, 0.76, 0.01),
    tip(lean * 0.64, 0.886, -0.056 * bend),
    tip(lean + 0.045, 0.965, -0.061 * bend),
  ];
  const radius = height * (elder ? 0.068 : pine ? 0.051 : 0.04);
  const bark = willow ? '#d3d3b0' : pine ? '#dfdfd4' : '#d5c9b6';
  brush.stroke(
    spine,
    [1.42, 0.92, 0.79, 0.68, 0.54, 0.37, 0.22, 0.042].map((q) => q * radius),
    elder ? 19 : near ? 15 : 8,
    elder ? 42 : near ? 29 : 11,
    seed % 63,
    bark,
  );
  if (near) {
    for (let j = 0; j < (elder ? 9 : 5); j++) {
      const a = angle + (TAU * j) / (elder ? 9 : 5) + (r() - 0.5) * 0.36,
        l = height * (elder ? 0.22 : 0.13) * (0.72 + r() * 0.64);
      const e = v(x + cos(a) * l, 0, z + sin(a) * l);
      e.y = h(e.x, e.z) - 0.035;
      const mid = v(x + cos(a - 0.25) * l * 0.54, ground + height * 0.032, z + sin(a - 0.25) * l * 0.54);
      brush.stroke(
        [v(x + cos(a) * radius * 0.44, ground + radius * 1.35, z + sin(a) * radius * 0.44), mid, e],
        [radius * 0.54, radius * 0.31, 0.025],
        7,
        5,
        (seed % 35) + j,
        bark,
      );
    }
  }
  if (elder) {
    const start = new THREE.CatmullRomCurve3(spine).getPoint(0.42);
    brush.stroke(
      [
        start,
        start.clone().add(v(-0.59, 0.22, 0.39)),
        start.clone().add(v(-1.26, 0.34, 0.58)),
        start.clone().add(v(-1.54, 0.64, 0.71)),
      ],
      [0.22, 0.151, 0.073, 0.012],
      9,
      9,
      31,
      '#e0d7c1',
    );
  }
  const n = near ? (pine ? 10 : 9) : 6;
  const woodCurve = new THREE.CatmullRomCurve3(spine, false, 'centripetal');
  for (let j = 0; j < n; j++) {
    const level = j / (n - 1),
      a = elder && j === 2 ? 0.03 : angle + j * 2.399 + (r() - 0.5) * 0.43;
    const origin = woodCurve.getPoint(0.38 + level * 0.58);
    const reach = height * (elder ? 0.6 : pine ? 0.43 : 0.34) * (1 - level * 0.66) * (0.82 + r() * 0.44);
    const lift = height * (pine ? 0.072 : 0.2) * (0.8 + r() * 0.32);
    const swing = (0.16 + r() * 0.25) * (j % 2 ? 1 : -1);
    const elbow = origin
      .clone()
      .add(v(cos(a - swing) * reach * 0.26, lift * (pine ? -0.24 : 0.38), sin(a - swing) * reach * 0.26));
    const shoulder = origin
      .clone()
      .add(
        v(
          cos(a + swing * 0.62) * reach * 0.61,
          lift * 0.57 + height * (pine ? 0.026 : 0.008),
          sin(a + swing * 0.62) * reach * 0.61,
        ),
      );
    const end = origin.clone().add(v(cos(a) * reach, lift, sin(a) * reach));
    const branchRadius = radius * (1 - level * 0.64) * 0.49;
    const crotch = origin.clone().lerp(elbow, 0.53);
    crotch.y += height * (pine ? 0.021 : 0.016);
    const knuckle = shoulder.clone().lerp(end, 0.57);
    knuckle.y -= height * (pine ? 0.025 : 0.012);
    const arm = [origin, crotch, elbow, shoulder, knuckle, end];
    brush.stroke(
      arm,
      [branchRadius, branchRadius * 0.88, branchRadius * 0.75, branchRadius * 0.49, branchRadius * 0.27, 0.017],
      near ? 10 : 5,
      near ? 18 : 6,
      (seed % 67) + j,
      bark,
    );
    const branchCurve = new THREE.CatmullRomCurve3(arm, false, 'centripetal');
    const sprays = near ? 3 : 2;
    for (let k = 0; k < sprays; k++) {
      const fork = branchCurve.getPoint(0.43 + k * 0.22);
      const yaw = a + (k - 1) * (0.74 + r() * 0.32),
        side = reach * (0.22 + r() * 0.21);
      const tuft = fork.clone().add(v(cos(yaw) * side, height * (pine ? 0.043 : 0.087), sin(yaw) * side));
      if (near) {
        const knot = fork.clone().lerp(tuft, 0.57);
        knot.y -= height * 0.022;
        brush.stroke(
          [fork, knot, tuft],
          [branchRadius * 0.34, branchRadius * 0.2, 0.007],
          6,
          5,
          (seed % 31) + j + k,
          bark,
        );
      }
      const spread = height * (pine ? 0.255 : willow ? 0.205 : 0.248) * (1 - level * 0.24) * (0.83 + r() * 0.37);
      const autumn = kind === 'maple' && hasAutumnLeaves(t);
      const material = p.sprays[t.snow>.5 && pine ? 'snow' : t.autumn>.45 && autumn ? 'autumn' :
        willow ? 'bamboo' : autumn ? 'maple' : pine ? 'pine' : 'oak'];
      for (let face = 0; face < (near ? 4 : 3); face++) {
        const dir = yaw + face * 2.2 + (r() - 0.5) * 0.6,
          distance = spread * (0.08 + r() * 0.29);
        let tint;
        if (pine) tint = ['#e0e5cf', '#c7d4bd', '#f1ecd5', '#c1cdb9'][face];
        else if(t.autumn>.45 && autumn) {
          const palettes=[['#de6740','#b84236','#ed8849','#bd492c'],['#e9a441','#f2b451','#c78638','#e6a24c'],
            ['#b94236','#db5342','#b84331','#da6142'],['#d27334','#d85e2b','#efa447','#cf7235']];
          tint=palettes[seed%4][face];
        } else if (autumn) tint = ['#d7b4a0', '#f7d4b2', '#ebbb91', '#d8ba9e'][face];
        else tint = ['#dfe7c1', '#d2ddba', '#f3e4ad', '#bfccac'][face];
        p.part(
          'plane',
          tuft.x + cos(dir) * distance,
          tuft.y + (r() - 0.5) * spread * 0.19,
          tuft.z + sin(dir) * distance,
          spread * (pine ? 1.63 : 1.12),
          spread * (pine ? 0.69 : willow ? 1.42 : 1.1),
          1,
          tint,
          -dir + 1.57,
          0.1 + (r() - 0.5) * 0.71,
          (r() - 0.5) * (pine ? 0.34 : 0.65),
          material,
          near && k === 1 && face === 0,
          true,
        );
      }
    }
  }
}
export function* plantInkTrees(p, art) {
  const brush = new BarkBrush(p.scene, art);
  for (const tree of LANDMARK_TREES) {
    if (tree.kind !== 'bamboo') inkTree(brush, p, tree);
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
    if (inMountainStreamClearing(x,z) || inHutYard(x,z) || reservedScenery(x,z) || y < WATER_Y - 0.08 || (z < -185 && seasonAt(x,z).snow>.45)) return;
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
    if (inMountainStreamClearing(x,z) || inHutYard(x,z) || reservedScenery(x,z) || onGateStone(x,z,s*1.18)) return;
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
    [4.7, 63.6, 1.13],
    [-3.57, 65.7, 0.83],
    [3.85, 65.3, 0.88],
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
  }
}
export function plantUnderstory(p, art) {
  scatteredHerbs(p, art);
}
