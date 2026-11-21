import { wrapDelta } from './terrain.js';
import * as THREE from './vendor/three.module.min.js';
import { buildPounding } from './mochi-pounding.js';
import { addSpringSurface } from './spring-water.js';
import { finishResident, residentLimb, residentTorso } from './resident-art.js';
import { inkVolume, sculptHead, scrollParasol, scrollShell, sculptTurtleHead } from './scroll-sculpt.js';
import { DYES } from './procession.js';
import { distantProcession } from './procession-view.js';
import { dressArtisan, poseArtisan } from './trade-tools.js';
import { makeRiceModel, poseRice } from './mochi-model.js';

const PI = Math.PI,
  TAU = PI * 2;
const straw = '#bb9465',
  wood = '#835d41';
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const transform = new THREE.Object3D();
const colored = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.91,
  side: THREE.DoubleSide,
});
colored.shadowSide = THREE.BackSide;
function inkRim(material, strength) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      float rimInk=(1.0-smoothstep(.025,.205,abs(dot(normalize(normal),normalize(vViewPosition)))))*${strength.toFixed(3)};
      outgoingLight=mix(outgoingLight,outgoingLight*.39+vec3(.013,.009,.005),rimInk);
      #include <opaque_fragment>
    `,
    );
  };
  material.customProgramCacheKey = () => 'ink-rim-' + strength;
}
inkRim(colored, 0.82);
const geometries = new Map();
const models = new Map();
function primitive(key, make) {
  if (!geometries.has(key)) geometries.set(key, make());
  return geometries.get(key);
}
const sphere = primitive('sphere', () => new THREE.SphereGeometry(1, 14, 10));
const smallSphere = primitive('smallSphere', () => new THREE.SphereGeometry(1, 9, 6));
const cube = primitive('cube', () => new THREE.BoxGeometry(1, 1, 1));
const cyl = primitive('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 12));
const unitUp = v(0, 1, 0);
function n3(x, y, z) {
  const p = Math.sin(157.24 * x + 313.56 * y + 76.33 * z) * 27637.345;
  return p - Math.floor(p);
}
const pigment = new Map();
function color(code) {
  if (!pigment.has(code)) pigment.set(code, new THREE.Color(code));
  return pigment.get(code);
}
// Each moving piece is one draw call. The wash and its fine ink marks share a mesh.
class Brush {
  constructor() {
    this.p = [];
    this.n = [];
    this.c = [];
    this.i = [];
  }
  add(geo, col, pos = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    transform.position.fromArray(pos);
    transform.scale.fromArray(scale);
    if (rotation.isQuaternion) transform.quaternion.copy(rotation);
    else transform.rotation.set(...rotation);
    transform.updateMatrix();
    const m = transform.matrix,
      normal = new THREE.Matrix3().getNormalMatrix(m);
    const a = geo.getAttribute('position'),
      norms = geo.getAttribute('normal');
    const off = this.p.length / 3,
      base = color(col),
      point = new THREE.Vector3(),
      direction = new THREE.Vector3();
    for (let k = 0; k < a.count; k++) {
      point.fromBufferAttribute(a, k).applyMatrix4(m);
      this.p.push(point.x, point.y, point.z);
      direction.fromBufferAttribute(norms, k).applyNormalMatrix(normal);
      this.n.push(direction.x, direction.y, direction.z);
      const wash =
        0.97 + 0.06 * n3(Math.round(point.x * 100), Math.round(point.y * 100), Math.round(point.z * 100));
      this.c.push(base.r * wash, base.g * wash, base.b * wash);
    }
    const ix = geo.getIndex();
    if (ix) for (const index of ix.array) this.i.push(index + off);
    else for (let k = 0; k < a.count; k++) this.i.push(k + off);
  }
  ball(x, y, z, rx, ry, rz, col, rot = [0, 0, 0]) {
    const geometry = Math.max(rx, ry, rz) <= 0.105 ? smallSphere : sphere;
    this.add(geometry, col, [x, y, z], [rx, ry, rz], rot);
  }
  box(x, y, z, w, h, d, col, rot = [0, 0, 0]) {
    this.add(cube, col, [x, y, z], [w, h, d], rot);
  }
  rod(a, b, r, col, end = r) {
    const start = v(...a),
      delta = v(...b).sub(start),
      length = delta.length();
    if (length < 0.0001) return;
    const sides = Math.max(end, r) < 0.035 ? 6 : 12;
    const geo =
      end === r && sides === 12
        ? cyl
        : primitive(
            'taper' + sides + '-' + Math.round((end / r) * 100),
            () => new THREE.CylinderGeometry(end / r, 1, 1, sides),
          );
    this.add(
      geo,
      col,
      start.addScaledVector(delta, 0.5).toArray(),
      [r, length, r],
      new THREE.Quaternion().setFromUnitVectors(unitUp, delta.normalize()),
    );
  }
  stroke(points, r, col, segments = Math.max(5, points.length * 3), sides = 5) {
    const path = new THREE.CatmullRomCurve3(points.map((p) => v(...p)));
    const geo = new THREE.TubeGeometry(path, segments, r, sides, false);
    this.add(geo, col);
    geo.dispose();
  }
  loop(x, y, z, rx, rz, r, col) {
    const geo = primitive('ring' + Math.round(r * 1000), () => new THREE.TorusGeometry(1, r, 5, 30));
    this.add(geo, col, [x, y, z], [rx, rz, (rx + rz) / 2], [PI / 2, 0, 0]);
  }
  mesh() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, colored);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
}
function batch(parent, fn, name, position) {
  const brush = new Brush();
  fn(brush);
  const m = brush.mesh();
  if (name) m.name = name;
  if (position) m.position.fromArray(position);
  parent.add(m);
  return m;
}
function group(parent, name, x = 0, y = 0, z = 0) {
  const part = new THREE.Group();
  part.name = name;
  part.position.set(x, y, z);
  parent?.add(part);
  return part;
}
function model(key, builder) {
  if (!models.has(key)) {
    const result = new THREE.Group();
    builder(result);
    models.set(key, result);
  }
  return models.get(key).clone(true);
}
function canvasTexture(w, h, paint) {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  const ctx = el.getContext('2d');
  paint?.(ctx, w, h);
  const texture = new THREE.CanvasTexture(el);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, ctx, el };
}
function line(ctx, points, stroke, width) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  if (points.length === 6) ctx.quadraticCurveTo(...points.slice(2));
  else if (points.length === 8) ctx.bezierCurveTo(...points.slice(2));
  else for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}
function dot(ctx, x, y, rx, ry, fill, angle = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
  ctx.fill();
}

export function getExpression(p, time = 0) {
  if (p.emote) return p.emote;
  if (p.activity === 'fall') return 'hurt';
  if (p.activity === 'sleep') return 'sleepy';
  if (p.activity === 'bath') return 'bath';
  if (p.activity === 'read') return 'joy';
  if (p.activity === 'drink') return 'blush';
  if (p.activity === 'eat') return 'eating';
  if (p.throwTime > 0) return 'calling';
  if (p.mode === 'dango' && p.grounded && p.speed > 0.25) return 'joy';
  if (p.night) return 'sleepy';
  if (p.mode === 'dango' && !p.grounded && p.stretch > 0.04) return 'determined';
  if (p.stretch > 0.025 || (!p.grounded && p.h > 0.25)) return p.mode === 'habutae' ? 'joy' : 'surprise';
  if (p.inWater) return 'bath';
  if (p.buffs?.drunk > 0) return 'blush';
  if (p.buffs?.warm > 0 || p.buffs?.wrap > 0) return 'calm';
  if (p.buffs?.full > 0) return 'eating';
  if (p.speed > 0.55) return p.speed > 8 ? 'determined' : 'joy';
  const phase = time % 15;
  return phase < 6 ? 'curious' : phase < 12 ? 'joy' : 'calm';
}

// A folded two-sided blade with a raised midrib. The paper feathers and
// deeply lobed mugwort share this topology but keep their own silhouettes.
function sculptBlade(brush, spine, halfWidth, tint, depth, leaf = false) {
  const count = leaf ? 44 : 26;
  const across = [-1, -0.48, 0, 0.48, 1];
  const vertices = [],
    indices = [];
  const positions = [],
    crossAxes = [];
  for (let row = 0; row <= count; row++) {
    const u = row / count;
    const point = spine(u);
    const before = spine(Math.max(0, u - 0.003)),
      after = spine(Math.min(1, u + 0.003));
    const tangent = after.sub(before).normalize();
    const cross = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const width = halfWidth(u);
    positions.push(point);
    crossAxes.push(cross);
    for (let col = 0; col < across.length; col++) {
      const v = across[col];
      const spot = point.clone().addScaledVector(cross, v * width);
      spot.z += depth * (1 - v * v) * Math.sin(PI * u) + width * v * 0.17;
      vertices.push(spot.x, spot.y, spot.z);
      if (row < count && col < across.length - 1) {
        const at = row * across.length + col,
          next = at + across.length;
        indices.push(at, next, at + 1, at + 1, next, next + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  brush.add(geometry, tint);
  geometry.dispose();
  const rib = [];
  for (let j = 1; j < count; j += 4) {
    const u = j / count,
      point = positions[j].clone();
    point.z += depth * Math.sin(PI * u) + 0.0025;
    rib.push(point.toArray());
  }
  brush.stroke(rib, leaf ? 0.0028 : 0.0032, leaf ? '#c8c990' : '#cab89c');
  if (leaf) {
    for (const side of [-1, 1])
      for (const u of [0.24, 0.41, 0.59, 0.73]) {
        const a = spine(u - 0.07),
          b = spine(u + 0.035),
          c = spine(u + 0.1);
        const axis = crossAxes[Math.round(u * count)],
          width = halfWidth(u);
        a.z += depth * Math.sin(PI * (u - 0.07)) + 0.003;
        b.addScaledVector(axis, side * 0.43 * width);
        b.z += depth * 0.81 + 0.0015;
        c.addScaledVector(axis, side * 0.82 * width);
        c.z += depth * 0.24 + 0.003;
        brush.stroke([a.toArray(), b.toArray(), c.toArray()], 0.00165, '#bbc283');
      }
  }
}
function mugwortSprig(b) {
  const stem = [-0.14, 1.6, 0.012];
  b.rod([-0.092, 1.53, -0.012], stem, 0.01, '#85874b', 0.007);
  for (const [dx, dy, dz, w, tint] of [
    [-0.32, 0.17, 0.049, 0.071, '#718b45'],
    [0.16, 0.225, -0.019, 0.057, '#91a85b'],
    [-0.12, 0.22, -0.09, 0.042, '#7d9550'],
  ]) {
    const spine = (u) =>
      v(
        stem[0] + dx * u,
        stem[1] + dy * u + 0.031 * Math.sin(PI * u),
        stem[2] + dz * u + 0.016 * Math.sin(PI * u),
      );
    const width = (u) =>
      w *
      Math.pow(Math.sin(PI * u), 0.72) *
      (1 - 0.49 * Math.pow(0.5 + 0.5 * Math.cos(u * PI * 9.6 + 0.55), 2.7));
    sculptBlade(b, spine, width, tint, 0.013, true);
  }
}
function habutaeWing(b, side) {
  // Primary and covert rows overlap like folded strips of silk. Roots
  // lie inside the shoulder and each tip curls out of the plane.
  for (let row = 0; row < 2; row++) {
    const count = row ? 4 : 5;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1),
        length = row ? 0.48 - 0.115 * t : 0.73 - 0.16 * t;
      const slope = row ? 0.42 - 0.51 * t : 0.72 - 0.91 * t;
      const startY = row ? 0.025 : 0.038 + 0.011 * t;
      const spine = (u) =>
        v(
          side * (0.03 + length * u),
          startY + length * slope * u + (0.04 + 0.017 * t) * Math.sin(u * PI),
          0.016 + row * 0.036 + t * 0.01 + 0.047 * Math.sin(PI * u) - 0.043 * u * u,
        );
      const width = (u) => (row ? 0.057 : 0.079) * Math.pow(Math.sin(PI * u), 0.7) * (0.77 + 0.26 * u);
      sculptBlade(
        b,
        spine,
        width,
        (row ? ['#f8e9d5', '#fff4e0'] : ['#e0cdb1', '#f6e7d1', '#fff3df'])[i % (row ? 2 : 3)],
        0.012,
      );
    }
  }
}

function makeHero() {
  const root = new THREE.Group(),
    pose = group(root, 'mochi'),
    rolling = group(pose, 'roll');
  const rice = makeRiceModel(rolling);
  const leaves = batch(rolling, mugwortSprig, 'leaves');
  const wingParts = [];
  for (const s of [-1, 1]) {
    const wing = group(rolling, 'wing', s * 0.65, 0.66, -0.01);
    batch(wing, (b) => habutaeWing(b, s));
    wingParts.push(wing);
  }
  const wrap = batch(
    rolling,
    (b) => {
      const rings = [
        [0.56, 0.27],
        [0.71, 0.39],
        [0.765, 0.48],
        [0.797, 0.56],
        [0.803, 0.66],
        [0.798, 0.73],
      ];
      const mat = '#bc945f';
      for (let i = 1; i < rings.length; i++) {
        const [ra, ya] = rings[i - 1],
          [rb, yb] = rings[i];
        const g = new THREE.CylinderGeometry(rb, ra, yb - ya, 52);
        b.add(g, mat, [0, (ya + yb) / 2, 0], [1, 1, 0.919]);
        g.dispose();
      }
      for (const y of [0.39, 0.43, 0.67, 0.713])
        b.loop(0, y, 0, y < 0.45 ? 0.733 : 0.797, (y < 0.45 ? 0.733 : 0.797) * 0.92, 0.014, '#d8b580');
      for (let j = 0; j < 72; j++) {
        const a = (j * TAU) / 72;
        b.stroke(
          [
            [0.727 * Math.sin(a), 0.393, 0.672 * Math.cos(a)],
            [0.786 * Math.sin(a + 0.009), 0.53, 0.729 * Math.cos(a + 0.009)],
            [0.804 * Math.sin(a), 0.703, 0.746 * Math.cos(a)],
          ],
          0.0085,
          j % 3 ? '#d4b180' : '#9f794c',
        );
      }
    },
    'wrap',
  );
  return {
    root,
    pose,
    rolling,
    rice,
    wingParts,
    wrap,
    leaves,
  };
}

const hare = '#e2d0b8',
  frog = '#b5a579',
  frogPale = '#dcc7a5';
function basket(b, x, y, z, size = 1) {
  const radius = (t) => 0.137 + 0.107 * Math.sin(t * 1.42);
  const at = (a, t, relief = 0) => [
    x + size * (radius(t) + relief) * Math.sin(a),
    y + size * (0.021 + 0.297 * t),
    z + size * (radius(t) + relief) * Math.cos(a),
  ];
  const form = new THREE.LatheGeometry(
    Array.from(
      { length: 13 },
      (_, i) => new THREE.Vector2(size * (radius(i / 12) - 0.004), size * (0.021 + (0.297 * i) / 12)),
    ),
    32,
  );
  b.add(form, '#927450', [x, y, z]);
  form.dispose();
  for (let h = 0; h <= 9; h++) {
    const t = 0.039 + 0.099 * h;
    const braid = Array.from({ length: 49 }, (_, i) => {
      const a = (i * TAU) / 48;
      return at(
        a,
        t + 0.009 * Math.sin(12 * a + h * Math.PI),
        0.003 + 0.0025 * Math.cos(12 * a + h * Math.PI),
      );
    });
    b.stroke(braid, (h === 0 || h === 9 ? 0.008 : 0.006) * size, h % 3 ? '#c3a171' : '#b49161', 48, 3);
  }
  for (let j = 0; j < 24; j++) {
    const a = (j * TAU) / 24;
    b.stroke(
      Array.from({ length: 11 }, (_, i) =>
        at(a + (0.022 * i) / 10, i / 10, 0.003 * Math.cos(Math.PI * (i + j))),
      ),
      0.0051 * size,
      j % 3 ? '#c3a578' : '#a2825b', 12, 3,
    );
  }
  b.stroke(
    Array.from({ length: 41 }, (_, i) => at((i * TAU) / 40, 1)),
    0.012 * size,
    '#bd9868', 40, 4,
  );
  for (let k = 0; k < 3; k++) {
    const a = (k * TAU) / 3 + 0.4,
      dx = x + size * 0.096 * Math.sin(a),
      dz = z + size * 0.091 * Math.cos(a),
      h = y + size * (0.287 + 0.014 * k);
    const point = (u, v, w, ra, rb) => [dx + u * size, h + v * size, dz + w * size, ra * size, rb * size];
    inkVolume(
      b,
      [
        point(-0.033, -0.124, -0.017, 0.003, 0.003),
        point(-0.022, -0.058, -0.008, 0.045, 0.04),
        point(0, 0.006, 0, 0.072, 0.069),
        point(0.012, 0.054, 0.005, 0.058, 0.054),
        point(0.014, 0.075, 0.008, 0.03, 0.024),
      ],
      '#ead9b1',
      18,
    );
    for (let n = 0; n < 4; n++) {
      const theta = a + n * 2.18,
        len = 0.109 + 0.048 * ((k + n) % 3),
        rise = 0.058 + 0.052 * ((k + 2 * n) % 3);
      const leaf = [],
        ind = [],
        mid = [];
      for (let j = 0; j <= 10; j++) {
        const t = j / 10,
          l = t * len,
          px = dx + size * (0.014 + l * Math.sin(theta)),
          py = h + size * (0.061 + rise * (1 - (1 - t) ** 2) - 0.036 * t * t),
          pz = dz + size * (0.008 + l * Math.cos(theta));
        const w = size * 0.032 * Math.sin(Math.PI * t) ** 0.75 * (j % 2 ? 0.67 : 1.13);
        leaf.push(
          px - w * Math.cos(theta),
          py - 0.01 * size,
          pz + w * Math.sin(theta),
          px,
          py,
          pz,
          px + w * Math.cos(theta),
          py - 0.009 * size,
          pz - w * Math.sin(theta),
        );
        mid.push([px, py + 0.002 * size, pz]);
        if (j) {
          const p = j * 3;
          ind.push(p - 3, p - 2, p, p - 2, p + 1, p, p - 2, p - 1, p + 1, p - 1, p + 2, p + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(leaf, 3));
      g.setIndex(ind);
      g.computeVertexNormals();
      b.add(g, n % 2 ? '#899357' : '#6f844b');
      g.dispose();
      b.stroke(mid, 0.0025 * size, '#abb274', 10, 3);
    }
  }
}
function muzzleInk(b, frogKind) {
  for (const s of [-1, 1]) {
    if (frogKind) {
      b.ball(s * 0.047, 0.105, 0.363, 0.012, 0.007, 0.011, '#625640');
    } else {
      for (let i = 0; i < 3; i++) {
        const base = [s * (0.089 - i * 0.004), -0.008 + i * 0.013, 0.344];
        b.stroke(
          [
            base,
            [s * (0.173 + i * 0.009), 0.005 + i * 0.028, 0.371],
            [s * (0.31 + i * 0.012), 0.003 + i * 0.055, 0.38 - i * 0.005],
          ],
          0.0031,
          '#705e4e',
        );
      }
      b.stroke(
        [
          [0, 0.002, 0.429],
          [s * 0.013, -0.023, 0.417],
          [s * 0.05, -0.041, 0.386],
        ],
        0.006,
        '#675143',
      );
    }
  }
  if (frogKind) {
    inkVolume(
      b,
      [
        [0, -0.021, 0.015, 0.091, 0.049],
        [0, 0.005, 0.099, 0.144, 0.103],
        [0, 0.02, 0.182, 0.134, 0.075],
        [0, 0.016, 0.229, 0.091, 0.039],
        [0, -0.012, 0.257, 0.048, 0.015],
      ],
      '#815e48',
    );
    inkVolume(
      b,
      [
        [0, -0.048, 0.114, 0.08, 0.027],
        [0, -0.034, 0.184, 0.13, 0.026],
        [0, -0.03, 0.259, 0.11, 0.017],
        [0, -0.033, 0.303, 0.053, 0.009],
        [0, -0.037, 0.329, 0.002, 0.001],
      ],
      '#b18869',
    );
  } else b.ball(0, 0.014, 0.424, 0.026, 0.02, 0.017, '#574338');
}
function armLimb(parent, s, kind, role) {
  const frogKind = kind === 'frog',
    sumo = role === 'sumo',
    port = role === 'porter';
  const skin = frogKind ? frog : hare,
    pos = [s * (frogKind ? 0.235 : 0.17), frogKind ? 1.0 : 1.21, 0.01];
  const arm = group(parent, 'arm' + s, ...pos);
  const grip = port && (frogKind || s < 0);
  const robed = role === 'wander' || role === 'artisan';
  const open = robed && s > 0;
  const elbow = [
    s * (sumo ? 0.22 : open ? 0.16 : 0.105),
    sumo ? -0.16 : -0.205,
    sumo ? 0.14 : grip ? 0.08 : -0.03,
  ];
  const paw = sumo
    ? [s * 0.105, -0.065, 0.5]
    : grip
      ? [s * 0.012, frogKind ? -0.01 : 0.045, 0.25]
      : open
        ? [s * 0.24, -0.105, 0.262]
        : robed
          ? [s * 0.045, -0.15, 0.19]
          : [s * 0.09, -0.38, -0.06];
  batch(arm, (b) => {
    inkVolume(
      b,
      [
        [0, 0.047, -0.015, 0.016, 0.023],
        [0, 0, 0, 0.082, 0.089],
        [elbow[0] * 0.6, elbow[1] * 0.56, elbow[2] * 0.54, 0.091, 0.076],
        [...elbow, 0.062, 0.058],
        [
          elbow[0] * 0.59 + paw[0] * 0.41,
          elbow[1] * 0.59 + paw[1] * 0.41,
          elbow[2] * 0.59 + paw[2] * 0.41,
          0.064,
          0.058,
        ],
        [paw[0], paw[1], paw[2] - 0.049, 0.041, 0.035],
        [...paw, 0.06, 0.038],
        [paw[0], paw[1], paw[2] + 0.045, 0.05, 0.022],
      ],
      skin,
      30,
      kind,
    );
    for (let k = -1; k <= 1; k++) {
      const start = [paw[0] + k * 0.023, paw[1], paw[2] + 0.025];
      const end = [
        paw[0] + k * (frogKind ? 0.085 : 0.029),
        paw[1] + (grip ? 0.044 : open ? 0.026 : -0.012),
        paw[2] + (grip ? 0.085 : frogKind ? 0.184 : 0.12) - Math.abs(k) * 0.027,
      ];
      inkVolume(
        b,
        [
          [...start, 0.018, 0.017],
          [
            (start[0] + end[0]) * 0.5,
            (start[1] + end[1]) * 0.5 + (grip ? 0.032 : 0.005),
            (start[2] + end[2]) * 0.5,
            0.017,
            0.014,
          ],
          [...end, frogKind ? 0.021 : 0.012, 0.013],
          [end[0] + k * 0.009, end[1] - 0.008, end[2] + 0.016, 0.001, 0.001],
        ],
        skin,
        12,
      );
    }
    if (role !== 'artisan') residentLimb(b, kind, role, s, elbow);
  });
  if (role==='artisan') batch(arm,b=>residentLimb(b,kind,'wander',s,elbow),'haori-sleeve'+s);
}
function legLimb(parent, s, kind, role) {
  const frogKind = kind === 'frog',
    sumo = role === 'sumo',
    skin = frogKind ? frog : hare;
  const leg = group(parent, 'leg' + s, s * (frogKind ? 0.17 : 0.111), frogKind ? 0.56 : 0.7, -0.048);
  const knee = [s * (sumo ? 0.1 : 0.04), -0.23, frogKind ? 0.13 : 0.081];
  const heel = [s * (sumo ? 0.18 : 0.04), frogKind ? -0.47 : -0.6, -0.11];
  batch(leg, (b) => {
    inkVolume(
      b,
      [
        [0, 0.059, 0, 0.04, 0.044],
        [s * 0.018, -0.044, -0.017, 0.116, 0.119],
        [s * 0.038, -0.16, 0.039, frogKind ? 0.144 : 0.128, 0.106],
        [...knee, 0.096, 0.097],
        [
          knee[0] * 0.6 + heel[0] * 0.4,
          knee[1] * 0.6 + heel[1] * 0.4,
          knee[2] * 0.6 + heel[2] * 0.4,
          0.068,
          0.076,
        ],
        [heel[0], heel[1] + 0.034, heel[2], 0.043, 0.057],
        [...heel, 0.055, 0.052],
        [heel[0], heel[1] - 0.018, heel[2] + 0.12, 0.059, 0.035],
        [heel[0], heel[1] - 0.014, heel[2] + 0.184, 0.051, 0.025],
      ],
      skin,
      34,
      kind,
    );
    for (let k = -1; k <= 1; k++) {
      const x = heel[0] + k * 0.019,
        y = heel[1] - 0.015,
        z = heel[2] + 0.15;
      const spread = k * (frogKind ? 0.093 : 0.04),
        tip = heel[2] + (frogKind ? 0.326 : 0.281) - Math.abs(k) * 0.033;
      inkVolume(
        b,
        [
          [x, y, z, 0.024, 0.022],
          [x + 0.44 * spread, y + 0.008, z * 0.5 + tip * 0.5, 0.022, 0.019],
          [heel[0] + spread, y, tip - 0.019, 0.022, 0.016],
          [heel[0] + spread * 1.02, y - 0.009, tip, 0.003, 0.003],
        ],
        skin,
        12,
      );
    }
  });
}
function animal(parent, kind, role) {
  const froggy = kind === 'frog';
  const torso = group(parent, 'torso');
  batch(torso, (b) => {
    if (froggy) {
      inkVolume(
        b,
        [
          [0, 0.422, -0.085, 0.086, 0.089],
          [0, 0.51, -0.082, 0.205, 0.18],
          [0, 0.677, -0.051, 0.299, 0.234],
          [0, 0.82, -0.006, 0.321, 0.229],
          [0, 0.976, 0.051, 0.262, 0.19],
          [0, 1.083, 0.101, 0.193, 0.149],
          [0, 1.23, 0.132, 0.139, 0.097],
        ],
        frog,
        32,
        kind,
      );
      inkVolume(
        b,
        [
          [0, 0.508, -0.066, 0.091, 0.08],
          [0, 0.623, 0.085, 0.21, 0.159],
          [0, 0.828, 0.104, 0.264, 0.183],
          [0, 0.983, 0.124, 0.2, 0.137],
          [0, 1.19, 0.141, 0.119, 0.079],
        ],
        frogPale,
      );
    } else {
      inkVolume(
        b,
        [
          [0, 0.504, -0.059, 0.078, 0.09],
          [0, 0.646, -0.065, 0.199, 0.18],
          [0, 0.788, -0.039, 0.225, 0.193],
          [0, 0.988, 0, 0.207, 0.181],
          [0, 1.166, 0.037, 0.187, 0.158],
          [0, 1.28, 0.064, 0.14, 0.13],
          [0, 1.444, 0.066, 0.112, 0.092],
        ],
        hare,
        36,
        kind,
      );
      inkVolume(
        b,
        [
          [0, 0.698, -0.158, 0.055, 0.045],
          [0, 0.715, -0.226, 0.085, 0.071],
          [0, 0.773, -0.282, 0.1, 0.083],
          [0, 0.827, -0.318, 0.078, 0.06],
          [0, 0.85, -0.371, 0.023, 0.022],
          [0, 0.863, -0.399, 0.002, 0.002],
        ],
        '#efe0c9',
        20,
        'rabbit',
      );
    }
    if (role === 'porter') {
      if (!froggy) {
        const py = 1.293,
          px = -0.18;
        b.stroke(
          [
            [px + 0.06, py - 0.105, -0.93],
            [px, py, 0.035],
            [px - 0.052, py - 0.094, 0.92],
          ],
          0.022,
          '#906c45',
        );
        for (const sign of [-1, 1]) {
          const x = px - sign * 0.045,
            z = sign * 0.73;
          for (const join of [-1, 1]) {
            b.stroke(
              [
                [x, py - 0.057, z],
                [x + join * 0.158, 1.035, z],
                [x + join * 0.198, 0.854, z],
              ],
              0.009,
              '#8d775a',
            );
            b.loop(x, py - 0.05, z, 0.029, 0.031, 0.12, '#b69870');
          }
          basket(b, x, 0.573, z, 0.93);
        }
      } else {
        for (let j = 0; j < 7; j++) {
          const x = (j - 3) * 0.048;
          b.rod(
            [x - 0.11, 0.645, -0.24],
            [x + 0.12, 1.19 + 0.035 * Math.sin(j * 2), -0.32],
            0.019,
            wood,
            0.014,
          );
        }
        b.rod([-0.169, 0.82, -0.37], [0.17, 0.82, -0.34], 0.025, straw);
        b.stroke(
          [
            [-0.19, 0.72, -0.2],
            [-0.21, 1.09, 0],
            [-0.15, 1.035, 0.17],
            [0.16, 0.67, 0.16],
          ],
          0.023,
          '#b49a6d',
        );
      }
    } else if (!froggy && role === 'wander') {
      b.stroke(
        [
          [-0.17, 1.21, 0.009],
          [0, 0.996, 0.189],
          [0.17, 0.809, 0.15],
        ],
        0.031,
        '#78857b',
      );
      b.ball(0.184, 0.805, 0.098, 0.11, 0.12, 0.064, '#6b7d77', [0, -0.3, 0.11]);
    }
    if (role !== 'artisan') residentTorso(b, kind, role);
  });
  if (role==='artisan') batch(torso,b=>residentTorso(b,kind,'wander'),'haori');
  const head = group(torso, 'head', 0, froggy ? 1.208 : 1.423, 0.072);
  batch(head, (b) => muzzleInk(b, froggy));
  for (const s of [-1, 1]) {
    if (role !== 'pounder' && role !== 'turner') armLimb(torso, s, kind, role);
    legLimb(parent, s, kind, role);
  }
  if (froggy && role === 'wander') {
    batch(torso, (b) =>
      b.stroke(
        [
          [-0.17, 0.84, 0.19],
          [-0.23, 1.11, 0.13],
          [-0.45, 1.932, -0.055],
        ],
        0.015,
        '#8c794e',
      ),
    );
  }
  finishResident(parent, kind);
  sculptHead(head, kind, role);
  if (froggy && role === 'wander') scrollParasol(torso);
}
export function createMochiPounding(parent) {
  return buildPounding(parent, { animal, batch, group, shadow });
}
function turtle(parent) {
  scrollShell(parent);
  batch(parent, b=>b.ball(0,.175,-.027,.345,.087,.449,'#ae8757'));
  for (const side of [-1,1]) for(const front of [-1,1]) {
    const joint=group(parent,'turtleFoot'+side+','+front,side*.235,.178,front*.226);
    joint.userData.stride=side*front;
    batch(joint, b=>{
      inkVolume(b,[[0,0,0,.08,.072],[side*.078,-.027,-.031,.087,.072],
        [side*.133,-.081,-.019,.071,.073],[side*.157,-.105,.043,.071,.051],
        [side*.191,-.13,.085,.054,.034]],'#ac8b5d',22,'frog');
      for(let i=-1;i<=1;i++)
        inkVolume(b,[[side*.166+i*.021,-.121,.055,.024,.022],
          [side*.194+i*.026,-.134,.109,.018,.019],[side*.213+i*.031,-.154,.148,.004,.006]],
          '#bfa477',12);
    });
  }
  const head=group(parent,'turtleNeck');
  sculptTurtleHead(head);
}
function turtleGait(mesh, time, movement, resting) {
  const phase=time*(movement>1?6.4:3.8);
  for(const part of mesh.children) {
    const diagonal=part.userData.stride;
    if(diagonal) {
      const swing=diagonal*Math.sin(phase)*Math.min(1,movement);
      part.rotation.y=swing*.27;
      part.position.y=.178+.031*Math.max(0,swing);
    } else if(part.name==='turtleNeck'){
      part.rotation.x=.025*Math.sin(phase)*(resting?.22:1);
      part.position.z=(resting?-.065:0)+.018*Math.cos(phase)*Math.min(1,movement);
    }
  }
}
function bike(parent) {
  batch(parent, (b) => {
    const green = '#699c8e',
      metal = '#b4b8a3',
      black = '#514d42';
    for (const z of [-0.65, 0.65]) {
      const rim = new THREE.TorusGeometry(0.351, 0.036, 7, 31);
      b.add(rim, black, [0, 0.374, z], [1, 1, 1], [0, PI / 2, 0]);
      rim.dispose();
      const rims = new THREE.TorusGeometry(0.311, 0.01, 5, 27);
      b.add(rims, metal, [0, 0.374, z], [1, 1, 1], [0, PI / 2, 0]);
      rims.dispose();
      for (let i = 0; i < 14; i++) {
        const a = (i * TAU) / 14;
        b.rod(
          [i % 2 ? 0.023 : -0.023, 0.374, z],
          [0, 0.374 + Math.cos(a) * 0.314, z + Math.sin(a) * 0.314],
          0.005,
          metal,
        );
      }
      b.rod([-0.085, 0.374, z], [0.085, 0.374, z], 0.032, metal);
    }
    for (const s of [-1, 1]) {
      b.rod([s * 0.075, 0.37, -0.65], [s * 0.08, 0.3, -0.02], 0.028, green);
      b.rod([s * 0.075, 0.37, -0.65], [s * 0.04, 0.82, -0.24], 0.019, metal);
      b.rod([s * 0.06, 0.37, 0.65], [s * 0.042, 0.86, 0.48], 0.026, green);
    }
    b.stroke(
      [
        [0, 0.85, -0.23],
        [0, 0.34, -0.03],
        [0, 0.37, 0.16],
        [0, 0.855, 0.48],
      ],
      0.052,
      green,
    );
    b.rod([0, 0.3, -0.04], [0, 0.88, -0.24], 0.044, green);
    b.rod([0, 0.83, -0.228], [0, 0.99, -0.28], 0.028, metal);
    b.ball(0, 1.015, -0.279, 0.12, 0.049, 0.14, '#735142');
    b.rod([0, 0.806, 0.477], [0, 1.09, 0.399], 0.03, metal);
    b.stroke(
      [
        [-0.292, 1.061, 0.385],
        [-0.212, 1.092, 0.48],
        [0, 1.085, 0.45],
        [0.212, 1.092, 0.48],
        [0.292, 1.061, 0.385],
      ],
      0.018,
      metal,
    );
    for (const s of [-1, 1]) b.rod([s * 0.22, 1.074, 0.43], [s * 0.297, 1.057, 0.379], 0.026, black);
    b.ball(0, 0.302, -0.043, 0.03, 0.091, 0.091, metal);
    for (const s of [-1, 1]) {
      b.rod([s * 0.04, 0.302, -0.04], [s * 0.085, 0.3 + s * 0.106, -0.041], 0.013, metal);
      b.box(s * 0.116, 0.3 + s * 0.106, -0.04, 0.105, 0.026, 0.062, black);
    }
    for (let y = 0; y <= 3; y++) {
      const h = 0.744 + y * 0.052,
        dx = 0.137 + y * 0.014,
        dz = 0.111 + y * 0.01,
        z = 0.654;
      b.stroke(
        [
          [-dx, h, z - dz],
          [0, h, z - dz],
          [dx, h, z - dz],
          [dx, h, z + dz],
          [0, h, z + dz],
          [-dx, h, z + dz],
          [-dx, h, z - dz],
        ],
        0.009,
        '#7f7f66',
      );
    }
    for (let i = 0; i < 7; i++) {
      const a = (i * TAU) / 7;
      b.rod(
        [0.137 * Math.sin(a), 0.744, 0.654 + 0.111 * Math.cos(a)],
        [0.181 * Math.sin(a), 0.905, 0.654 + 0.14 * Math.cos(a)],
        0.009,
        '#86876e',
      );
    }
  });
}

const textures = new Map();
function printed(name, w, h, paint) {
  if (!textures.has(name)) {
    const t = canvasTexture(w, h, paint).texture;
    textures.set(name, new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide }));
  }
  return textures.get(name);
}
function printPlane(parent, name, material, x, y, z, w, h, rx = 0, ry = 0, rz = 0) {
  const geom = primitive('plane', () => new THREE.PlaneGeometry(1, 1));
  const mesh = new THREE.Mesh(geom, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, 1);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
function manga(parent) {
  batch(parent, (b) => {
    for (const s of [-1, 1]) {
      b.box(s * 0.177, 0.034, 0, 0.355, 0.052, 0.49, '#a76249', [0, 0, s * 0.102]);
      b.box(s * 0.177, 0.065, 0, 0.34, 0.044, 0.46, '#e6d7ad', [0, 0, s * 0.102]);
      for (let k = 0; k < 3; k++)
        b.rod(
          [s * 0.019, 0.059 + k * 0.006, 0.222],
          [s * 0.332, 0.09 + k * 0.006, 0.222],
          0.0026,
          '#ab9876',
        );
    }
  });
  const mat = printed('manga', 256, 300, (c) => {
    c.fillStyle = '#f5e9c9';
    c.fillRect(0, 0, 256, 300);
    c.fillStyle = '#655c47';
    const panels = [
      [10, 13, 229, 91],
      [10, 112, 100, 78],
      [120, 112, 119, 78],
      [10, 201, 229, 85],
    ];
    for (const [k, [x, y, w, h]] of panels.entries()) {
      c.strokeStyle = '#655c47';
      c.lineWidth = 3;
      c.strokeRect(x, y, w, h);
      c.save();
      c.translate(x + w * (k % 2 ? 0.65 : 0.35), y + h * 0.62);
      c.beginPath();
      c.ellipse(0, 3, w * 0.2, 16, k % 2 ? 0.14 : -0.1, 0, TAU);
      c.stroke();
      c.beginPath();
      c.ellipse(12, -13, 12, 13, 0, 0, TAU);
      c.stroke();
      if (k % 2 === 0) {
        c.beginPath();
        c.ellipse(7, -32, 4.5, 13, -0.3, 0, TAU);
        c.stroke();
        c.beginPath();
        c.ellipse(16, -32, 4.5, 13, 0.26, 0, TAU);
        c.stroke();
      }
      dot(c, 16, -16, 1.5, 2.1, '#5c523d');
      line(c, [-17, 13, -22, 20, -33, 20], '#655c47', 2);
      c.restore();
      for (let j = 0; j < 5; j++) {
        const xx = x + w * (k % 2 ? 0.18 : 0.66) + j * 3;
        line(c, [xx, y + 9, xx, y + 18 + ((j * 9) % 19)], '#85795e', 1.7);
      }
    }
  });
  for (const s of [-1, 1]) {
    const p = group(parent, 'page', s * 0.171, 0.091, 0);
    p.rotation.z = s * 0.102;
    printPlane(p, 'print', mat, 0, 0, 0, 0.327, 0.448, -PI / 2, 0, s < 0 ? 0 : PI);
  }
}
function paintSakeCup(b, x, z) {
  const cup = new THREE.LatheGeometry(
    [[0.043, 0], [0.065, 0.015], [0.095, 0.108], [0.089, 0.119], [0.079, 0.117], [0.061, 0.063]].map(
      ([r, y]) => new THREE.Vector2(r, y),
    ),
    24,
  );
  b.add(cup, '#ede0bc', [x, 0, z]);
  cup.dispose();
  b.loop(x, 0.109, z, 0.095, 0.095, 0.04, '#587483');
  b.loop(x, 0.094, z, 0.090, 0.090, 0.02, '#758d91');
  b.ball(x, 0.098, z, 0.078, 0.005, 0.078, '#d1b986');
}
function sake(parent) {
  batch(parent, (b) => {
    const profile = [
      [0.09, 0],
      [0.13, 0.02],
      [0.147, 0.1],
      [0.146, 0.18],
      [0.079, 0.32],
      [0.047, 0.4],
      [0.048, 0.44],
      [0.068, 0.46],
      [0.064, 0.477],
      [0.044, 0.477],
    ];
    const g = new THREE.LatheGeometry(
      profile.map((a) => new THREE.Vector2(...a)),
      22,
    );
    b.add(g, '#eee0bf', [-0.045, 0, 0]);
    g.dispose();
    for (const [y, r] of [
      [0.028, 0.128],
      [0.061, 0.139],
      [0.224, 0.129],
      [0.468, 0.065],
    ])
      b.loop(-0.045, y, 0, r, r, 0.03, '#647e83');
    for (let i = 0; i < 11; i++) {
      const a = (i * TAU) / 11;
      b.ball(
        -0.045 + Math.sin(a) * 0.141,
        0.115 + Math.sin(i * 2) * 0.013,
        Math.cos(a) * 0.141,
        0.019,
        0.045,
        0.018,
        '#6a8182',
        [0, 0, Math.sin(a) * 0.45],
      );
    }
    paintSakeCup(b, 0.178, 0.085);
  });
}
function ramen(parent, restingChopsticks = true) {
  batch(parent, (b) => {
    const g = new THREE.LatheGeometry(
      [
        [0.12, 0],
        [0.16, 0.027],
        [0.2, 0.07],
        [0.3, 0.2],
        [0.34, 0.296],
        [0.335, 0.316],
        [0.312, 0.31],
        [0.27, 0.21],
      ].map((a) => new THREE.Vector2(...a)),
      28,
    );
    b.add(g, '#e3d5af');
    g.dispose();
    b.loop(0, 0.303, 0, 0.338, 0.338, 0.032, '#5f7981');
    b.loop(0, 0.067, 0, 0.196, 0.196, 0.025, '#66818a');
    for (let i = 0; i < 17; i++) {
      const a = (i * TAU) / 17;
      b.ball(Math.sin(a) * 0.267, 0.177, Math.cos(a) * 0.267, 0.018, 0.047, 0.015, '#748793', [
        0,
        0,
        Math.sin(a) * 0.42,
      ]);
    }
    b.ball(0, 0.257, 0, 0.305, 0.015, 0.305, '#bd8b4f');
    for (let k = 0; k < 7; k++) {
      const r = 0.05 + k * 0.025,
        a = k * 0.84;
      const points = [];
      for (let j = 0; j < 10; j++) {
        const t = a + j * 0.56;
        points.push([r * Math.cos(t), 0.278 + 0.004 * Math.sin(t * 5), r * Math.sin(t)]);
      }
      b.stroke(points, 0.008, '#e8ba76');
    }
    for (let i = 0; i < 2; i++) {
      b.ball(-0.1 + i * 0.104, 0.286, -0.063, 0.099, 0.016, 0.063, '#bb906d', [0, 0.4, 0]);
      b.stroke(
        [
          [-0.167 + i * 0.105, 0.3, -0.069],
          [-0.13 + i * 0.105, 0.305, -0.083],
          [-0.061 + i * 0.105, 0.3, -0.057],
        ],
        0.007,
        '#ebc69a',
      );
    }
    b.ball(0.142, 0.299, 0.08, 0.077, 0.029, 0.095, '#f1e2b5', [0, -0.4, 0]);
    b.ball(0.14, 0.326, 0.08, 0.037, 0.009, 0.046, '#d6a249');
    b.box(-0.1, 0.343, -0.174, 0.161, 0.148, 0.012, '#657449', [-0.49, 0, -0.14]);
    for (let i = 0; i < 22; i++) {
      const a = i * 2.4,
        r = 0.26 * Math.sqrt(i / 24);
      b.ball(Math.sin(a) * r, 0.283, Math.cos(a) * r, 0.01, 0.006, 0.009, i % 3 ? '#ead4a1' : '#79935d');
    }
    if (restingChopsticks) {
      b.rod([-0.331, 0.328, -0.127], [0.332, 0.342, 0.114], 0.009, '#845537');
      b.rod([-0.339, 0.331, -0.093], [0.321, 0.343, 0.148], 0.009, '#845537');
    }
  });
}
function ramenSpoon(parent) {
  batch(parent, (b) => {
    b.ball(0, 0, 0, 0.084, 0.019, 0.053, '#ece4ce');
    b.ball(-0.012, 0.017, 0, 0.046, 0.018, 0.031, '#c6a074');
    b.ball(-0.013, 0.03, 0.007, 0.014, 0.006, 0.011, '#e2c79a');
    b.stroke([[0.052, 0.004, 0], [0.12, 0.018, 0.005], [0.225, 0.077, 0.017], [0.279, 0.089, 0.025]], 0.016, '#ded7c4');
  });
}
function cuff(parent) {
  batch(parent, (b) => {
    const g = new THREE.LatheGeometry(
      [
        [0.24, 0.007],
        [0.253, 0.034],
        [0.218, 0.168],
        [0.243, 0.286],
        [0.24, 0.333],
        [0.201, 0.335],
        [0.188, 0.265],
        [0.195, 0.038],
      ].map((a) => new THREE.Vector2(...a)),
      32,
    );
    b.add(g, '#bc9663');
    g.dispose();
    for (let i = 0; i < 42; i++) {
      const a = (i * TAU) / 42;
      b.stroke(
        [
          [0.249 * Math.sin(a), 0.032, 0.249 * Math.cos(a)],
          [0.226 * Math.sin(a + 0.015), 0.165, 0.226 * Math.cos(a + 0.015)],
          [0.246 * Math.sin(a), 0.309, 0.246 * Math.cos(a)],
        ],
        0.006,
        i % 3 ? '#d3b17e' : '#a78052',
      );
    }
    b.loop(0, 0.034, 0, 0.252, 0.252, 0.027, '#dcc094');
    b.loop(0, 0.302, 0, 0.244, 0.244, 0.027, '#dcc094');
  });
}
function onsen(parent) {
  addSpringSurface(parent);
  batch(parent, (b) => {
    b.ball(0, 0.035, 0, 2.1, 0.1, 1.67, '#a59270');
    for (const x of [-1.98, -0.93]) b.rod([x, 0.12, -1.1], [x, 2.13, -1.1], 0.041, '#896d50');
    b.rod([-2.11, 2.05, -1.1], [-0.8, 2.05, -1.1], 0.054, wood);
    b.rod([1.64, 0.011, -0.6], [1.64, 0.74, -0.6], 0.081, '#a39563');
    b.rod([1.68, 0.72, -0.6], [1.26, 0.61, -0.6], 0.071, '#b1a36e');
    b.rod([1.26, 0.6, -0.6], [1.23, 0.2, -0.6], 0.026, '#bdd0b6');
    for (let j = 0; j < 14; j++) {
      const x = -1.37 + (j % 4) * 0.1,
        z = -1.26 + Math.sin(j * 6) * 0.15;
      b.ball(x, 0.37, z, 0.03, 0.24 + 0.1 * Math.cos(j * 2), 0.047, '#8c975c', [
        0,
        0,
        Math.sin(j * 3) * 0.55,
      ]);
    }
  });
  const mat = printed('bath-sign', 220, 180, (c, w, h) => {
    c.fillStyle = '#ac5545';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ecd5aa';
    c.font = 'bold 126px "Hiragino Mincho ProN",serif';
    c.textAlign = 'center';
    c.fillText('ゆ', 104, 136);
    c.fillRect(0, 12, w, 2);
    c.fillRect(0, 163, w, 2);
    c.fillStyle = '#8c483c';
    c.fillRect(108, 122, 4, 58);
  });
  printPlane(parent, 'curtain', mat, -1.455, 1.59, -1.09, 1.025, 0.828);
}
function bicyclePort(parent) {
  batch(parent, (b) => {
    b.box(-0.82, 0.087, -0.25, 0.38, 0.16, 0.36, '#a8a18a');
    b.box(-0.82, 0.71, -0.25, 0.2, 1.22, 0.15, '#99a092');
    b.box(-0.82, 1.42, -0.23, 0.38, 0.49, 0.13, '#688c7c');
    for (const x of [-0.16, 0.47])
      b.stroke(
        [
          [x - 0.07, 0.02, -0.47],
          [x - 0.07, 0.41, -0.47],
          [x + 0.07, 0.41, -0.47],
          [x + 0.07, 0.02, -0.47],
        ],
        0.018,
        '#898e80',
      );
  });
  const mat = printed('bike-sign', 128, 125, (c, w, h) => {
    c.fillStyle = '#608879';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ece4bb';
    c.textAlign = 'center';
    c.font = 'bold 59px Georgia,serif';
    c.fillText('P', 64, 76);
    c.font = '17px sans-serif';
    c.fillText('自転車', 64, 108);
    c.strokeStyle = '#c9d1aa';
    c.lineWidth = 3;
    c.strokeRect(4, 4, 120, 117);
  });
  printPlane(parent, 'sign', mat, -0.82, 1.425, -0.157, 0.345, 0.38);
  for (let i = 0; i < 2; i++) {
    const m = model('bicycle', bike);
    m.name = 'park' + i;
    m.position.set(-0.15 + i * 0.62, 0, 0);
    m.rotation.y = -0.21;
    parent.add(m);
  }
}
const objectModels = { manga, sake, ramen, haramaki: cuff, onsen, port: bicyclePort };
function accessory(item) {
  return model(item, objectModels[item]);
}

function shadowMap() {
  if (!textures.has('shadow')) {
    const { texture } = canvasTexture(96, 96, (c, w, h) => {
      const g = c.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.5);
      g.addColorStop(0, 'rgba(68,57,38,.56)');
      g.addColorStop(0.5, 'rgba(75,66,44,.28)');
      g.addColorStop(1, 'rgba(75,66,44,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    });
    textures.set(
      'shadow',
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
  }
  return textures.get('shadow');
}
function shadow(parent, w, d) {
  const m = new THREE.Mesh(
    primitive('plane', () => new THREE.PlaneGeometry(1, 1)),
    shadowMap(),
  );
  m.rotation.x = -PI / 2;
  m.position.y = 0.025;
  m.scale.set(w, d, 1);
  m.renderOrder = 1;
  parent.add(m);
  return m;
}
function particles(type, count) {
  const colors = { steam: '#fffcdf', dust: '#d9b674', stars: '#fff1ae' };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      tint: { value: new THREE.Color(colors[type]) },
      opacity: { value: type === 'steam' ? 0.22 : 0.82 },
      size: { value: type === 'steam' ? 178 : 30 },
    },
    vertexShader:
      'attribute float fade; varying float alpha; uniform float size; void main(){vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; gl_PointSize=clamp(size/max(1.,-p.z),1.5,43.); alpha=fade;}',
    fragmentShader: type === 'steam' ? `
      uniform vec3 tint; uniform float opacity; varying float alpha;
      void main() {
        vec2 q=gl_PointCoord-.5;
        float curl=.095*sin(q.y*10.+alpha*6.)+.052*sin(q.y*19.-alpha*4.);
        vec2 strand=vec2((q.x-curl)*6.4,(q.x+curl+.08)*9.);
        float ribbon=exp(-strand.x*strand.x)+.33*exp(-strand.y*strand.y);
        float a=opacity*alpha*ribbon*(1.-smoothstep(.20,.50,abs(q.y)));
        if(a<.006) discard;
        gl_FragColor=vec4(tint,a);
        #include <colorspace_fragment>
      }` :
      'uniform vec3 tint;uniform float opacity;varying float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,d))*opacity*alpha;if(a<.008)discard;gl_FragColor=vec4(tint,a);\n#include <colorspace_fragment>\n}',
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('fade', new THREE.Float32BufferAttribute(new Float32Array(count), 1));
  const p = new THREE.Points(g, mat);
  p.frustumCulled = false;
  p.renderOrder = 3;
  p.visible = false;
  return p;
}
function mistAt(m, t, steam = true, spread = 1) {
  const attr = m.geometry.getAttribute('position'),
    fade = m.geometry.getAttribute('fade');
  m.visible = true;
  for (let i = 0; i < attr.count; i++) {
    const age = (t * (steam ? 0.4 : 1.05) + i * 0.61803) % 1,
      a = i * 2.4;
    attr.setXYZ(
      i,
      Math.cos(a + age * 0.85) * spread * (steam ? 0.75 : 0.37),
      steam ? 0.32 + age * 1.11 : 0.12 + Math.sin(age * PI) * (0.24 + (i % 3) * 0.08),
      Math.sin(a + age * 0.65) * spread * (steam ? 0.56 : 0.23) - (steam ? 0 : age * 1.53),
    );
    fade.setX(i, Math.sin(age * PI) * (0.7 + 0.3 * Math.sin(i * 3.5)));
  }
  attr.needsUpdate = fade.needsUpdate = true;
}
function paperNotice() {
  return model('notice', (parent) => {
    batch(parent, (b) => {
      b.box(0, 0, 0, 0.42, 0.018, 0.259, '#f7ead0', [0, 0, 0.016]);
      b.stroke(
        [
          [-0.197, 0.012, -0.114],
          [0, 0.02, 0.015],
          [0.188, 0.012, -0.11],
        ],
        0.0055,
        '#9d8a68',
      );
      b.rod([-0.18, 0.014, 0.101], [-0.058, 0.016, -0.011], 0.003, '#a89770');
      b.box(0.121, 0.015, 0.063, 0.055, 0.007, 0.053, '#b44d3b');
    });
  });
}
function shortest(a, b) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}
function gaitHero(h, p, t, dt, camera, state) {
  const mood = getExpression(p, t),
    sit = p.activity,
    speed = p.speed || 0;
  const riding = !!p.mount,
    idle = speed < 0.22 && !riding;
  const faceCam = (idle || sit === 'read' || sit === 'eat' || sit === 'drink') && p.grounded !== false;
  let target = p.heading || 0;
  if (faceCam || p.emote) {
    target = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
  }
  if (state.photo && h.angle !== undefined) target = h.angle;
  if (h.angle === undefined) h.angle = target;
  h.angle += shortest(h.angle, target) * (1 - Math.exp(-dt * (idle ? 3.9 : 9)));
  const giant = p.buffs?.full > 0,
    dango = p.mode === 'dango',
    wings = p.mode === 'habutae';
  h.root.position.set(p.x, p.y, p.z);
  h.root.rotation.y = h.angle;
  const response=poseRice(h.rice,p,t,dt,mood);
  const g=giant?1.28:1;
  h.pose.scale.set(g*response.width,g*response.stretch,g*response.width);
  const mountHeight = p.mount === 'bike' ? .90 : p.mount === 'turtle' ? .52 : 0;
  h.pose.position.set(0,response.bob+mountHeight+(sit==='bath'?-.49+.018*Math.sin(t*2):0),riding?-.14:0);
  h.pose.rotation.set(response.pitch,0,response.lean);
  if(sit==='fall'){
    const fall=Math.sin(Math.min(1,(p.activityTime||.1)/.68)*PI);
    h.pose.rotation.z+=fall*.93;
    h.pose.position.set(-.11*fall,h.pose.position.y+.16*fall,0);
  }
  if(sit==='sleep'){h.pose.scale.y*=.76;h.pose.rotation.z=-.13;h.pose.position.y=.009;}
  if(sit==='bath'){h.pose.rotation.x=.11;h.pose.scale.set(g*1.08,g*.92,g*1.09);}
  if(p.buffs?.drunk>0) h.pose.rotation.z+=.115*Math.sin(t*3.7);
  h.leaves.visible = p.mode === 'kusa';
  h.leaves.position.y = response.extension;
  h.wrap.visible = p.buffs?.wrap > 0;
  const pull = response.pull;
  h.leaves.scale.set(1-.25*pull,1,1-.25*pull);
  h.wrap.position.y = response.extension * .51;
  h.wrap.scale.set(1.075-pull*.40,1+pull*.50,1.042-pull*.40);
  if (dango && !riding && !sit) {
    if ((!p.grounded && p.airStretch > 0) || speed < .22)
      h.spin += shortest(h.spin,0) * (1-Math.exp(-dt*14));
    else h.spin = (h.spin + (speed * dt) / 0.79) % TAU;
    h.rolling.rotation.x = h.spin;
    // Rotate about the centre of the ball while keeping its feet on the ground.
    h.rolling.position.set(0, 0.82 - 0.82 * Math.cos(h.spin), -0.82 * Math.sin(h.spin));
    h.pose.scale.y *= 1.02;
  } else {
    h.spin = 0;
    h.rolling.rotation.x = 0;
    h.rolling.position.set(0, 0, 0);
  }
  for (let i = 0; i < 2; i++) {
    const s=i?1:-1;
    h.wingParts[i].visible = wings;
    h.wingParts[i].position.set(s*(.65-.15*pull),.66+response.extension*.93,-.01);
    h.wingParts[i].rotation.z = s * (0.24 + Math.sin(t * (p.grounded ? 5 : 13)) * 0.47);
  }
  for (const key of ['read', 'drink', 'eat']) {
    const item = h.held[key];
    item.visible = sit === key;
    if (item.visible) {
      if (key === 'drink') {
        const sip = 0.5 + 0.5 * Math.sin(t * 4.3);
        item.position.set(0.203 - 0.068 * sip, 0.733 + 0.095 * sip, 0.879 - 0.035 * sip);
        item.rotation.set(-0.20 - sip * 0.57, 0, -0.12 - sip * 0.07);
        item.scale.setScalar(1.24);
      } else if (key === 'read') {
        item.position.set(0, 0.54, 0.94);
        item.scale.setScalar(1.24);
        item.rotation.x = 0.82 + Math.sin(t * 2) * 0.024;
      } else {
        item.position.set(0, 0.45, 1.085);
        item.rotation.x = 0.12;
      }
    }
  }
  h.spoon.visible = sit === 'eat';
  if (h.spoon.visible) {
    const bite = 0.5 + 0.5 * Math.sin(t * 4.2);
    h.spoon.position.set(0.084 - 0.060 * bite, 0.753 + 0.183 * bite, 1.079 - 0.275 * bite);
    h.spoon.rotation.set(-0.07, 0.16, -0.20 + 0.12 * bite);
  }
  h.bicycle.visible = p.mount === 'bike';
  h.ridingTurtle.visible = p.mount === 'turtle';
  if(h.ridingTurtle.visible) turtleGait(h.ridingTurtle,t,speed,false);
  const shadowScale = Math.max(0.25, 1 - (p.h || 0) * 0.1);
  h.shadow.scale.set(1.91 * shadowScale * g, 1.6 * shadowScale * g, 1);
  h.shadow.position.y = 0.036 - (p.h || 0);
  h.dust.visible = false;
  if (p.mode === 'kinako' && speed > 0.12) mistAt(h.dust, t, false, 1);
  h.warm.visible = false;
  if (p.buffs?.warm > 0 || sit === 'bath') {
    h.warm.position.y = 0.56;
    mistAt(h.warm, t, true, 1.24);
  }
}

function markerStand(parent) {
  batch(parent, (b) => {
    b.box(0, 0.34, 0, 0.94, 0.066, 0.63, '#ad8960');
    for (const x of [-0.363, 0.363])
      for (const z of [-0.23, 0.23]) b.box(x, 0.17, z, 0.067, 0.34, 0.075, wood);
    for (let i = 0; i < 5; i++)
      b.rod([-0.44, 0.379, -0.26 + i * 0.13], [0.44, 0.379, -0.26 + i * 0.13], 0.005, '#816b4b');
    b.box(0.012, 0.384, 0, 0.72, 0.013, 0.48, '#c0a889');
    b.box(-0.24, 0.393, 0, 0.018, 0.006, 0.46, '#9b6950');
    b.box(0.24, 0.393, 0, 0.018, 0.006, 0.46, '#9b6950');
  });
}
const dyedCloth=new Map();
export function makeNPC(entity, root) {
  const kind = entity.type;
  const role = kind === 'turtle' ? 'wander' : entity.area ? 'artisan' : entity.role;
  const mesh =
    kind === 'turtle' ? model('turtle', turtle) : model(kind + role, (p) => animal(p, kind, role));
  root.add(mesh);
  const limbs = {};
  for (const key of ['torso', 'head', 'leg-1', 'leg1', 'arm-1', 'arm1', '筆穂耳-1', '筆穂耳1'])
    limbs[key] = mesh.getObjectByName(key);
  if (entity.area) {
    const key=kind+entity.dye;
    const coat=mesh.getObjectByName('haori');
    if (!dyedCloth.has(key)) {
      const mat=coat.material.clone();
      mat.onBeforeCompile=coat.material.onBeforeCompile;
      mat.customProgramCacheKey=coat.material.customProgramCacheKey;
      mat.color.set(DYES[entity.dye]);
      dyedCloth.set(key,mat);
    }
    for(const part of [coat,mesh.getObjectByName('haori-sleeve-1'),mesh.getObjectByName('haori-sleeve1')])
      part.material=dyedCloth.get(key);
    dressArtisan(limbs,entity.role,model,batch);
    mesh.scale.set(entity.stature*entity.build,entity.stature,entity.stature);
  }
  const shadowMesh = shadow(mesh, kind === 'turtle' ? 1.19 : 1.2, kind === 'turtle' ? 1.32 : 1.0);
  return { mesh, limbs, shadow: shadowMesh };
}
export function animateNPC(record, n, t) {
  const { mesh, limbs } = record,
    isTurtle = n.type === 'turtle',
    sumo = n.role === 'sumo';
  mesh.position.set(n.x, n.y, n.z);
  mesh.rotation.y = n.heading || 0;
  if (isTurtle) {
    const rest = n.role === 'rest',
      step = rest ? 0 : Math.sin(t * 3.8);
    turtleGait(mesh,t,rest ? 0 : (n.speed || 0)*2,rest);
    mesh.rotation.z = step * 0.027;
    mesh.position.y += Math.abs(step) * 0.014;
    return;
  }
  const move = sumo ? 1 : Math.min(1, (n.speed || 0) * 2);
  const phase = t * (sumo ? 2.65 : 4.45) + (n.phase || 0);
  const bend = Math.sin(phase) * move;
  for (const s of [-1, 1]) {
    limbs['leg' + s].rotation.x = bend * s * (sumo ? 0.08 : 0.38);
    limbs['leg' + s].rotation.z = sumo ? -s * (0.14 + 0.065 * Math.cos(phase)) : 0.025 * s;
    const arm=limbs['arm'+s];
    const holdsYoke=n.type==='rabbit' && n.role==='porter' && s<0;
    const holdsLeaf=n.type==='frog' && n.role==='wander' && s<0;
    arm.rotation.x = holdsYoke || holdsLeaf ? 0 : -bend*s*(sumo ? .12 : n.role==='porter' ? .18 : .28);
    arm.rotation.z = sumo ? -.07*s*(1+Math.cos(phase)) : .03*s*Math.sin(phase);
    if(n.type==='rabbit'){
      const ear=limbs['筆穂耳'+s];
      ear.rotation.z=s*(.028*Math.sin(phase-.37)+.019*Math.sin(phase*2-.67));
    }
  }
  const body = limbs.torso;
  body.position.y = (sumo ? -0.109 : 0.02 * Math.abs(bend)) + 0.016 * Math.sin(phase * 2);
  body.rotation.x = sumo ? 0.22 + Math.sin(phase) * 0.085 : -0.026 * Math.cos(phase);
  body.rotation.z = sumo ? 0.023 * Math.cos(phase) : 0.026 * bend;
  limbs.head.rotation.set(
    sumo ? -0.11 : 0.036 * Math.sin(phase),
    0.15 * Math.sin(t * 1.3 + (n.phase || 0)),
    0.025 * bend,
  );
  if (n.area) poseArtisan(limbs,n,t);
  if (n.flash > 0) {
    mesh.position.y += 0.11 * Math.abs(Math.sin(n.flash * 12));
    limbs.head.rotation.z += 0.16;
  }
}
function makeObject(o, parent) {
  let mesh, feature, steam;
  if (o.type === 'port' || o.type === 'onsen') {
    mesh = accessory(o.type);
    if (o.type === 'onsen') {
      steam = particles('steam', 19);
      mesh.add(steam);
    }
  } else {
    mesh = model('stand', markerStand);
    feature = accessory(o.type);
    feature.position.y = 0.399;
    feature.scale.setScalar(o.type === 'sake' ? 1.28 : 1.08);
    mesh.add(feature);
  }
  parent.add(mesh);
  return { mesh, feature, steam };
}
function within(entity, player, limit) {
  return wrapDelta(entity.x - player.x) ** 2 + wrapDelta(entity.z - player.z) ** 2 < limit * limit;
}

export function createActors(scene) {
  const root = group(scene, '旅の仲間');
  const h = makeHero();
  h.spin = 0;
  h.held = {
    read: accessory('manga'),
    drink: model('sipping-cup', (parent) => batch(parent, (b) => paintSakeCup(b, 0, 0))),
    eat: model('held-ramen', (parent) => ramen(parent, false)),
  };
  h.spoon = model('ramen-spoon', ramenSpoon);
  h.spoon.visible = false;
  h.rolling.add(h.spoon);
  for (const item of Object.values(h.held)) {
    item.visible = false;
    h.rolling.add(item);
  }
  h.bicycle = model('bicycle', bike);
  h.ridingTurtle = model('turtle', turtle);
  h.ridingTurtle.scale.setScalar(1.13);
  h.root.add(h.bicycle, h.ridingTurtle);
  h.bicycle.visible = h.ridingTurtle.visible = false;
  h.shadow = shadow(h.root, 1.9, 1.6);
  h.dust = particles('dust', 25);
  h.warm = particles('steam', 11);
  h.root.add(h.dust, h.warm);
  root.add(h.root);
  const npcs = new Map(),
    objects = new Map(),
    notices = new Map(),
    spares = [];
  let processionView;
  const viewFrustum=new THREE.Frustum(), viewProjection=new THREE.Matrix4();
  const actorBounds=new THREE.Sphere(new THREE.Vector3(),1.7), restingNpcs=new Map();
  function update(state, dt, camera) {
    const p = state.player,
      t = state.time;
    gaitHero(h, p, t, dt, camera, state);
    if (!processionView) processionView=distantProcession(root,shadowMap(),state.npcs.length);
    processionView.begin(p);
    viewFrustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const visible=[], detailed=new Set();
    for (const n of state.nearbyNpcs) {
      if(n.mounted) continue;
      const distance=wrapDelta(n.x-p.x)**2+wrapDelta(n.z-p.z)**2;
      if (n.type==='turtle') {
        if (distance<68**2) detailed.add(n);
      } else if (distance<95**2) {
        // A little hysteresis keeps two equally close travellers from
        // exchanging their representation every time they take a step.
        actorBounds.center.set(p.x+wrapDelta(n.x-p.x),n.y+1,p.z+wrapDelta(n.z-p.z));
        const onScreen=viewFrustum.intersectsSphere(actorBounds);
        visible.push({n,priority:distance*(npcs.has(n.id) ? .88 : 1)*(onScreen ? 1 : 4)});
      }
    }
    visible.sort((a,b)=>a.priority-b.priority);
    for(let i=0;i<visible.length;i++){
      const {n,priority}=visible[i];
      if(i<5 && priority<24**2) detailed.add(n);
      else processionView.add(n,p,camera,t);
    }
    processionView.end();
    for (const [id,rec] of npcs) {
      if (!detailed.has(rec.entity)) {
        root.remove(rec.mesh);
        npcs.delete(id);
        restingNpcs.set(id,rec);
        if (restingNpcs.size>12) restingNpcs.delete(restingNpcs.keys().next().value);
      }
    }
    for(const n of detailed) {
      let rec=npcs.get(n.id);
      if(!rec) {
        rec=restingNpcs.get(n.id);
        if (rec) { restingNpcs.delete(n.id); root.add(rec.mesh); }
        else { rec=makeNPC(n,root); rec.entity=n; }
        npcs.set(n.id,rec);
      }
      animateNPC(rec,n,t);
      rec.mesh.position.x=p.x+wrapDelta(n.x-p.x);
      rec.mesh.position.z=p.z+wrapDelta(n.z-p.z);
    }
    for (const o of state.objects) {
      if (!objectModels[o.type]) continue;
      let rec = objects.get(o.id);
      const near = o.active && within(o, p, o.type === 'port' || o.type === 'onsen' ? 101 : 67);
      if (near && !rec) {
        rec = makeObject(o, root);
        objects.set(o.id, rec);
      }
      if (!rec) continue;
      rec.mesh.visible = near;
      if (!near) continue;
      rec.mesh.position.set(p.x + wrapDelta(o.x - p.x), o.y, p.z + wrapDelta(o.z - p.z));
      rec.mesh.rotation.y = o.heading || 0;
      if (rec.feature) {
        rec.feature.position.y = 0.395 + 0.011 * Math.sin(t * 2 + o.x);
        rec.feature.rotation.y = 0.15 * Math.sin(t * 0.8 + o.z);
      }
      if (rec.steam) mistAt(rec.steam, t + 0.01 * o.x, true, 1.65);
      if (o.type === 'port') {
        rec.mesh.getObjectByName('park0').visible = o.bikes > 0;
        rec.mesh.getObjectByName('park1').visible = o.bikes > 1;
      }
    }
    const active = new Set();
    for (const s of state.shots) {
      active.add(s.id);
      let mesh = notices.get(s.id);
      if (!mesh) {
        mesh = spares.pop() || paperNotice();
        root.add(mesh);
        notices.set(s.id, mesh);
      }
      mesh.visible = true;
      mesh.position.set(p.x + wrapDelta(s.x - p.x), s.y, p.z + wrapDelta(s.z - p.z));
      mesh.rotation.set(
        0.24 + Math.sin(s.age * 21) * 0.34,
        s.heading + s.age * 19,
        0.14 * Math.sin(s.age * 18),
      );
    }
    for (const [id, m] of notices)
      if (!active.has(id)) {
        m.visible = false;
        notices.delete(id);
        if (spares.length < 14) spares.push(m);
        else root.remove(m);
      }
  }
  return { update, hero: h.root };
}
