import * as THREE from './vendor/three.module.min.js';
import { terrainHeight as height, seeded, TREES, BUILDINGS, nearRoad } from './terrain.js';

const tau = 2 * Math.PI;
const { sin, cos } = Math;
const point = (x, y, z) => new THREE.Vector3(x, y, z);
const chalk = ['#e6eff3', '#eef2ef', '#d9e4ea'];
const coals = ['#41414a', '#343d49', '#4c4c54'];

function lathe(profile, sides) {
  return new THREE.LatheGeometry(
    profile.map(([radius, y]) => new THREE.Vector2(radius, y)),
    sides,
  );
}

// Objects within a vignette are built in a shared local frame, so the pieces can be circled.
function frame(p, x, z, yaw = 0, base = height(x, z)) {
  const at = (a, b, c) => point(x + a * cos(yaw) + c * sin(yaw), base + b, z - a * sin(yaw) + c * cos(yaw));
  return {
    part(shape, a, b, c, w, h, d, color, mat = p.fine, ry = 0, rx = 0, rz = 0, shadow = true) {
      const q = at(a, b, c);
      p.part(shape, q.x, q.y, q.z, w, h, d, color, yaw + ry, rx, rz, mat, shadow, true);
    },
    link(a, b, r, color, mat = p.wood, shadow = true) {
      p.link(at(...a), at(...b), r, color, false, shadow, true, mat);
    },
  };
}

function snowman(p, x, z, s, heading, hat, shade) {
  const f = frame(p, x, z, heading);
  f.part('snowLump', 0, 0.67 * s, 0, 0.79 * s, 0.78 * s, 0.76 * s, chalk[0]);
  f.part('snowLump', -0.05 * s, 1.62 * s, 0.012 * s, 0.57 * s, 0.56 * s, 0.56 * s, chalk[1]);
  for (let j = 0; j < 2; j++) {
    const sign = j * 2 - 1;
    f.part(
      'ball',
      (-0.05 + sign * 0.192) * s,
      (1.73 + j * 0.018) * s,
      0.511 * s,
      0.056 * s,
      0.065 * s,
      0.04 * s,
      coals[j],
      p.stone,
    );
    f.link(
      [sign * 0.66 * s, 0.88 * s, 0.01 * s],
      [sign * 1.1 * s, (1.22 + j * 0.09) * s, (-0.03 + j * 0.12) * s],
      0.035 * s,
      '#635140',
    );
    f.link(
      [sign * 0.97 * s, 1.13 * s, 0.02 * s],
      [sign * 1.01 * s, 1.37 * s, 0.07 * s],
      0.023 * s,
      '#675745',
    );
  }
  for (let i = -2; i <= 2; i++) {
    let y = 1.495 + i * i * 0.013;
    f.part(
      'rock',
      (-0.044 + i * 0.076) * s,
      y * s,
      (0.541 - i * i * 0.007) * s,
      0.021 * s,
      0.026 * s,
      0.022 * s,
      coals[(i + 3) % 3],
      p.stone,
    );
  }
  f.part(
    'nose',
    -0.047 * s,
    1.603 * s,
    0.53 * s,
    0.091 * s,
    0.291 * s,
    0.088 * s,
    '#c47a42',
    p.fine,
    0,
    Math.PI / 2 + 0.1,
    -0.09,
  );
  for (let i = 0; i < 2; i++)
    f.part(
      'rock',
      0.052 * s,
      (0.65 + i * 0.26) * s,
      (0.75 - i * 0.026) * s,
      0.054 * s,
      0.056 * s,
      0.033 * s,
      coals[i],
      p.stone,
    );
  f.part('muffler', -0.026 * s, 1.235 * s, 0.01 * s, 0.58 * s, 0.145 * s, 0.565 * s, shade, p.solid);
  f.part('box', 0.3 * s, 1.018 * s, 0.55 * s, 0.193 * s, 0.49 * s, 0.088 * s, shade, p.solid, 0, -0.28, 0.22);
  for (let k = 0; k < 5; k++)
    f.link(
      [(0.25 + k * 0.034) * s, 0.792 * s, 0.621 * s],
      [(0.25 + k * 0.034) * s, 0.712 * s, 0.634 * s],
      0.009 * s,
      shade,
      p.fine,
    );
  if (hat) {
    f.part(
      'bucket',
      -0.16 * s,
      2.1 * s,
      0.015 * s,
      0.39 * s,
      0.4 * s,
      0.39 * s,
      '#865046',
      p.solid,
      0,
      -0.05,
      0.14,
    );
    f.part(
      'round',
      -0.18 * s,
      2.13 * s,
      0.015 * s,
      0.415 * s,
      0.045 * s,
      0.415 * s,
      '#613f38',
      p.wood,
      0,
      -0.05,
      0.14,
    );
    f.part(
      'snowLump',
      -0.19 * s,
      2.481 * s,
      0.015 * s,
      0.3 * s,
      0.068 * s,
      0.29 * s,
      chalk[0],
      p.fine,
      0,
      -0.05,
      0.14,
    );
  }
}
function snowCapital(p, light) {
  const rng = seeded(238247);
  for (const [x, z, s, yaw, hat, scarf] of [
    [-74, -293, 1.02, -0.48, true, '#a74642'],
    [-72.6, -293.2, 0.65, -0.7, false, '#526f86'],
    [-82.3, -277, 0.83, 0.49, true, '#635e90'],
    [-61, -290, 0.66, 0.91, false, '#a75c43'],
    [-86, -309, 0.93, 0.54, true, '#557269'],
  ])
    snowman(p, x, z, s, yaw, hat, scarf);
  for (let i = 0; i < 28; i++) {
    const x = -78 + (rng() - 0.5) * 90,
      z = -287 + (rng() - 0.5) * 70;
    if (nearRoad(x, z, 1.0)) continue;
    const s = 0.9 + rng() * 1.6;
    p.part(
      'snowLump',
      x,
      height(x, z) - 0.04,
      z,
      s,
      0.15 + rng() * 0.19,
      s * (0.51 + rng() * 0.4),
      chalk[i % 3],
      rng() * tau,
      0,
      0,
      p.fine,
      false,
      true,
    );
  }
  // Small snow lanterns have cut-in niches, rounded roofs and an amber candle set back inside.
  for (let i = 0; i < 7; i++)
    for (const side of [-1, 1]) {
      const z = -278 - i * 4.9,
        x = -78 + side * (4.2 + 0.27 * cos(i));
      const f = frame(p, x, z, side * -0.41);
      f.part('snowLump', 0, 0.38, 0, 0.5, 0.51, 0.47, '#d8e1e8');
      f.part('snowLump', 0, 0.49, 0.345, 0.228, 0.303, 0.092, '#7a858b');
      f.part('snowLump', 0, 0.458, 0.406, 0.168, 0.242, 0.05, '#e9ab61', light);
      f.part('ball', 0, 0.408, 0.461, 0.03, 0.09, 0.02, '#fff2ba', light);
      f.part('snowLump', 0, 0.777, -0.018, 0.504, 0.191, 0.454, chalk[1]);
    }
}

function bladeGeometry() {
  const rng = seeded(1964),
    pos = [],
    index = [];
  function blade(nodes, widths) {
    const offset = pos.length / 3;
    for (let j = 0; j < nodes.length; j++) {
      const [x, y, z] = nodes[j],
        w = widths[j];
      pos.push(x - w, y, z, x, y + 0.007, z + 0.022, x + w, y, z);
      if (j + 1 < nodes.length) {
        const k = offset + j * 3;
        index.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5);
      }
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = rng() * tau,
      l = 0.42 + 0.59 * rng(),
      lean = 0.12 + rng() * 0.35;
    const nodes = [],
      w = [];
    for (let j = 0; j <= 6; j++) {
      const q = j / 6;
      nodes.push([
        cos(a) * (0.04 + q * q * lean),
        l * q * (1 - 0.37 * q * q),
        sin(a) * (0.04 + q * q * lean),
      ]);
      w.push(0.017 * Math.sin(q * Math.PI) ** 0.65 + 0.001);
    }
    blade(nodes, w);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
function plumesGeometry() {
  const pos = [],
    cols = [],
    ix = [],
    rng = seeded(72563);
  for (let n = 0; n < 5; n++) {
    const a = n * 2.4 + 0.19,
      l = 0.78 + rng() * 0.44,
      lean = 0.12 + rng() * 0.32;
    const stem = (q) => point(cos(a) * q * q * lean, l * (q - 0.15 * q * q * q), sin(a) * q * q * lean);
    const ink = (q) => [0.65 + 0.3 * q, 0.55 + 0.3 * q, 0.37 + 0.32 * q];
    function ribbon(b, e, width, col) {
      const k = pos.length / 3;
      pos.push(
        b.x - width,
        b.y,
        b.z,
        b.x + width,
        b.y,
        b.z,
        e.x + width * 0.28,
        e.y,
        e.z,
        e.x - width * 0.28,
        e.y,
        e.z,
      );
      for (let j = 0; j < 4; j++) cols.push(...col);
      ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    for (let j = 0; j < 12; j++) ribbon(stem(j / 12), stem((j + 1) / 12), 0.006, ink(0.1));
    for (let j = 0; j < 19; j++) {
      const q = 0.64 + j * 0.0182,
        b = stem(q),
        side = j % 2 === 0 ? 1 : -1,
        fan = (1 - (q - 0.64) * 2.0) * (0.053 + rng() * 0.035);
      const tip = b
        .clone()
        .add(
          point(cos(a) * 0.045 + side * fan, 0.052 - 0.042 * (1 - q), sin(a) * 0.041 + fan * (rng() - 0.5)),
        );
      ribbon(b, tip, 0.007 + rng() * 0.003, ink(0.5 + 0.5 * rng()));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  return geo;
}
function moonField(p, light) {
  const silverSilk = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    emissive: '#818477',
    emissiveIntensity: 0.37,
  });
  const rice = new THREE.MeshStandardMaterial({
    roughness: 0.63,
    emissive: '#ada49b',
    emissiveIntensity: 0.2,
  });
  const rng = seeded(395),
    f = frame(p, -51.7, 285.9, -0.15);
  // A sanbō has a folded rim and three open sides beneath its tray.
  f.part('box', 0, 0.066, 0, 1.54, 0.13, 1.2, '#72503b', p.wood);
  f.part('box', 0, 0.3, 0, 0.89, 0.43, 0.78, '#bd9868', p.wood);
  for (const side of [-1, 1]) {
    f.part('ball', side * 0.449, 0.29, 0, 0.006, 0.11, 0.145, '#594534', p.wood);
    f.part('ball', 0, 0.29, side * 0.393, 0.13, 0.103, 0.007, '#594534', p.wood);
  }
  f.part('box', 0, 0.57, 0, 1.28, 0.108, 1.16, '#d0af7b', p.wood);
  f.part('box', 0, 0.634, 0, 1.15, 0.019, 1.02, '#f1e9d7', p.fine, 0.07);
  for (const side of [-1, 1]) {
    f.part('box', 0, 0.658, side * 0.564, 1.28, 0.091, 0.039, '#ab8355', p.wood);
    f.part('box', side * 0.626, 0.658, 0, 0.039, 0.091, 1.16, '#ab8355', p.wood);
  }
  const tones = ['#f1e6ce', '#fdedd0', '#f6e9d6', '#e9dbc1'];
  for (let j = -1; j <= 1; j++)
    for (let k = -1; k <= 1; k++)
      f.part('dumpling', j * 0.32, 0.787, k * 0.315, 0.18, 0.171, 0.174, tones[(j + 2 * k + 4) % 4], rice);
  for (let j of [-1, 1])
    for (let k of [-1, 1])
      f.part('dumpling', j * 0.157, 1.022, k * 0.151, 0.181, 0.169, 0.177, '#fff0d7', rice);
  for (let k of [-1, 1]) f.part('dumpling', k * 0.155, 1.261, 0, 0.172, 0.171, 0.171, '#f5e9ce', rice);
  const vase = frame(p, -50.46, 285.68);
  vase.part('vase', 0, 0, 0, 0.3, 0.58, 0.3, '#817469', p.stone);
  vase.part('plumes', 0, 0.43, 0, 1, 1.44, 1, '#f9dfaa', silverSilk, 0, 0, 0, false);
  for (let i = 0; i < 580; i++) {
    const angle = rng() * tau,
      rad = 3.7 + 39 * rng() ** 0.77;
    const x = -55 + cos(angle) * rad,
      z = 290 + sin(angle) * rad * 0.78;
    if (
      nearRoad(x, z, 0.22) ||
      (x + 69) ** 2 + (z - 282) ** 2 < 9 ** 2 ||
      Math.hypot(x + 51.7, z - 285.9) < 2.5
    )
      continue;
    const s = 0.92 + rng() * 0.9,
      y = height(x, z),
      yaw = rng() * tau;
    if (y < 0.6) continue;
    p.part('rush', x, y, z, s, s, s, '#869267', yaw, 0, 0, p.fine, false, true);
    p.part('plumes', x, y, z, s, s, s, i % 4 ? '#dec99b' : '#f3dcad', yaw, 0, 0, silverSilk, false, true);
  }
  for (let i = 0; i < 35; i++) {
    const x = -48.2 + rng() * 4.4,
      z = 280.3 + rng() * 7;
    const y = height(x, z),
      s = 0.97 + rng() * 0.95,
      yaw = rng() * tau;
    p.part('rush', x, y, z, s, s, s, '#8d966b', yaw, 0, 0, p.fine, false, true);
    p.part('plumes', x, y, z, s, s, s, '#f9e5b4', yaw, 0, 0, silverSilk, false, true);
  }
  for (const [x, z] of [
    [-58, 285],
    [-50, 282],
    [-61, 294],
    [-52, 296],
  ]) {
    const lamp = frame(p, x, z);
    lamp.part('box', 0, 0.12, 0, 0.55, 0.24, 0.55, '#45494b', p.wood);
    lamp.part('box', 0, 0.46, 0, 0.365, 0.56, 0.365, '#f6bc6a', light);
    for (const dx of [-0.19, 0.19])
      for (const dz of [-0.19, 0.19]) lamp.part('box', dx, 0.46, dz, 0.035, 0.64, 0.035, '#615543', p.wood);
    lamp.part('kasa', 0, 0.76, 0, 0.37, 0.3, 0.37, '#575b64', p.stone);
  }
}
function mapleLeaf() {
  const radius = [0.08, 0.24, 0.14, 0.39, 0.21, 0.51, 0.25, 0.59, 0.24, 0.52, 0.2, 0.37, 0.13, 0.21, 0.07];
  const pos = [0, 0.026, 0],
    ix = [];
  for (let j = 0; j < radius.length; j++) {
    const a = -2.45 + j * 0.35;
    pos.push(sin(a) * radius[j], 0.012 * sin(j * 1.5), cos(a) * radius[j]);
    ix.push(0, j + 1, 1 + ((j + 1) % radius.length));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
function mapleHollow(p) {
  const rng = seeded(191434),
    fall = ['#bd442d', '#cd6536', '#d98c41', '#9b4d32', '#df9f4f'];
  for (const t of TREES.filter((t) => t.autumn > 0.65)) {
    for (let i = 0; i < 14; i++) {
      const a = rng() * tau,
        r = rng() ** 0.7 * t.h * 0.63,
        x = t.x + cos(a) * r,
        z = t.z + sin(a) * r;
      const s = 0.12 + 0.19 * rng();
      p.part(
        'fallenMaple',
        x,
        height(x, z) + 0.09,
        z,
        s,
        1,
        s,
        fall[Math.floor(rng() * 5)],
        rng() * tau,
        0,
        0,
        p.fine,
        false,
        true,
      );
    }
  }
  for (let i = 0; i < 410; i++) {
    const x = 285 + (rng() - 0.5) * 38,
      z = -114 + (rng() - 0.5) * 30,
      y = height(x, z);
    if (y < 1 || (Math.abs(x - 292) < 2.4 && z < -117.6)) continue;
    const s = 0.13 + 0.21 * rng();
    p.part(
      'fallenMaple',
      x,
      y + (nearRoad(x, z, 0.1) ? 0.112 : 0.075),
      z,
      s,
      0.45,
      s,
      fall[i % 5],
      rng() * tau,
      0,
      0,
      p.fine,
      false,
      true,
    );
  }
  // Three rock groups act as quiet islands beneath the warm canopy.
  for (const [cx, cz, scale] of [
    [298, -110, 1.1],
    [280, -101, 1.35],
    [292, -132, 0.94],
  ])
    for (let j = 0; j < 4; j++) {
      const x = cx + cos(j * 2.2) * (j ? 1.65 : 0),
        z = cz + sin(j * 2.2) * (j ? 1.4 : 0),
        s = scale * (j === 0 ? 1.18 : 0.54 + rng() * 0.25);
      const f = frame(p, x, z, rng() * tau);
      f.part('rock', 0, s * 0.41, 0, s * 1.02, s * 0.84, s * 0.9, '#a7a399', p.stone);
      f.part('snowLump', 0, s * 1.08, 0, s * 0.72, s * 0.15, s * 0.68, '#8c9566', p.stone);
    }
  const f = frame(p, 289, -120, 0.76);
  f.part('vase', 0, 0, 0, 0.56, 0.68, 0.54, '#9a9783', p.stone);
  f.part('round', 0, 0.658, 0, 0.356, 0.012, 0.355, '#81a09c', p.fine);
  f.link([0.88, 0.06, -0.1], [0.74, 1.24, -0.12], 0.072, '#a39464');
  f.link([0.78, 1.1, -0.1], [0.1, 0.97, 0], 0.068, '#b3a16e');
  f.link([0.12, 0.93, 0], [0.12, 0.68, 0], 0.013, '#c5d7ca', p.fine, false);
}
function dawnShore(p) {
  const a = frame(p, 342, 164, 0, 0.38),
    b = frame(p, 349.8, 162.9, 0, 0.38);
  a.part('rock', 0, 0.41, 0, 3.15, 3.63, 2.13, '#666c69', p.stone, 0.55, 0.15, -0.16);
  b.part('rock', 0, 0.05, 0, 1.9, 1.95, 1.42, '#77796f', p.stone, -0.6, -0.08, 0.15);
  a.part('rock', 0.0, 3.63, 0.04, 1.04, 0.28, 0.69, '#858667', p.stone, 0.4, 0, -0.2);
  const rope = (q, strand) => {
    const arc = 1.02 * Math.sin(Math.PI * q),
      twist = q * tau * 9 + (strand * tau) / 3;
    return point(
      342.9 + 6.6 * q,
      3.76 - 1.48 * q - arc + 0.042 * sin(twist),
      164 - 0.94 * q + 0.042 * cos(twist),
    );
  };
  for (let n = 0; n < 3; n++)
    for (let j = 0; j < 45; j++)
      p.link(
        rope(j / 45, n),
        rope((j + 1) / 45, n),
        0.047,
        ['#b59d69', '#dfc589', '#aa8d5a'][n],
        false,
        false,
        true,
        p.solid,
      );
  for (let j = 1; j <= 6; j++) {
    const q = rope(j / 7, 0);
    p.part('streamer', q.x, q.y - 0.16, q.z, 0.34, 0.45, 1, '#efe8cf', 0.47, 0, 0.08, p.fine, false, true);
  }
  // Paired New Year bamboo arrangements flank the celebration.
  for (const [x, z, sign] of [
    [306.2, 177.3, -1],
    [313, 175.1, 1],
  ]) {
    const f = frame(p, x, z, sign * 0.22);
    f.part('bucket', 0, 0, 0, 0.36, 0.5, 0.33, '#ab8e59', p.wood);
    for (const y of [0.12, 0.3, 0.44]) f.part('muffler', 0, y, 0, 0.35, 0.032, 0.34, '#8b7350', p.solid);
    for (let j = 0; j < 3; j++) {
      const dx = (j - 1) * 0.137,
        z = 0.032 * (j % 2),
        top = 1.08 + (j === 1 ? 0.38 : 0.08 * j);
      f.part('round', dx, (top + 0.44) / 2, z, 0.088, top - 0.44, 0.088, '#8c9d60', p.wood);
      f.part('ball', dx, top, z, 0.09, 0.057, 0.09, '#d9d2a2', p.fine, 0, 0.51);
      f.part('ball', dx, top + 0.033, z - 0.011, 0.058, 0.026, 0.06, '#838358', p.fine, 0, 0.51);
      f.part('round', dx, top - 0.28, z, 0.091, 0.025, 0.091, '#67794c');
    }
    for (let j = 0; j < 6; j++)
      f.part(
        'plane',
        sin(j) * 0.24,
        0.58,
        cos(j) * 0.19,
        0.52,
        0.63,
        1,
        '#dfe7ce',
        p.sprays.pine,
        j * 1.58,
        -0.26,
        0,
        false,
      );
  }
}
export function dressSeasonalPlaces(p) {
  p.shapes.snowLump = new THREE.SphereGeometry(1, 22, 14);
  p.shapes.dumpling = lathe(
    [
      [0, -0.92],
      [0.53, -0.88],
      [0.85, -0.63],
      [1, -0.2],
      [0.98, 0.28],
      [0.77, 0.69],
      [0.43, 0.93],
      [0, 1],
    ],
    22,
  );
  p.shapes.nose = new THREE.ConeGeometry(1, 1, 14).translate(0, 0.5, 0);
  p.shapes.muffler = lathe(
    [
      [0.87, -0.5],
      [0.98, -0.4],
      [1, -0.16],
      [0.96, 0.02],
      [0.995, 0.21],
      [0.96, 0.45],
      [0.86, 0.5],
    ],
    24,
  );
  p.shapes.bucket = lathe(
    [
      [0, 0],
      [1, 0],
      [1, 0.07],
      [0.97, 0.12],
      [0.82, 0.95],
      [0.78, 1],
      [0, 1],
    ],
    24,
  );
  p.shapes.vase = lathe(
    [
      [0.47, 0],
      [0.75, 0.05],
      [0.96, 0.34],
      [1, 0.58],
      [0.82, 0.79],
      [0.68, 0.88],
      [0.74, 0.96],
      [0.75, 1],
      [0.6, 0.99],
      [0.61, 0.85],
    ],
    26,
  );
  p.shapes.fallenMaple = mapleLeaf();
  p.shapes.rush = bladeGeometry();
  p.shapes.plumes = plumesGeometry();
  const light = new THREE.MeshBasicMaterial();
  snowCapital(p, light);
  moonField(p, light);
  mapleHollow(p);
  dawnShore(p);
}
export function seasonalWeather(scene) {
  const geo = new THREE.BufferGeometry(),
    rng = seeded(837);
  const pos = [],
    phase = [];
  for (let i = 0; i < 390; i++) {
    pos.push(rng() * 32, rng() * 17, rng() * 32);
    phase.push(rng());
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.Float32BufferAttribute(phase, 1));
  const roofs = BUILDINGS.filter((b) => b.snow);
  const frames = roofs.map((b) => new THREE.Vector4(b.x, b.z, cos(b.yaw), sin(b.yaw)));
  const eaves = roofs.map((b) => new THREE.Vector3(b.w * 0.61, b.d * 0.63, b.y + b.wall + 0.32));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      clock: { value: 0 },
      center: { value: point(0, 0, 0) },
      amount: { value: 0 },
      frames: { value: frames },
      eaves: { value: eaves },
    },
    vertexShader: `uniform float clock,amount; uniform vec3 center; attribute float seed; varying float opacity;
    uniform vec4 frames[${roofs.length}]; uniform vec3 eaves[${roofs.length}];
    void main(){vec3 span=vec3(32.,17.,32.);
      vec3 falling=position+vec3(clock*.38+sin(clock+seed*50.)*.36,-clock*(.62+.65*seed),.23*cos(.7*clock+seed*24.));
      vec3 local=mod(falling-center+span*.5,span)-span*.5;
      vec4 eye=viewMatrix*vec4(center+local,1.);gl_Position=projectionMatrix*eye;
      gl_PointSize=clamp((11.+9.*seed)/max(1.,-eye.z),1.2,5.);
      opacity=amount*(.39+.51*seed)*(1.-smoothstep(11.,16.,length(local.xz)))*smoothstep(0.,1.5,-eye.z);
      vec3 world=center+local;
      for(int i=0;i<${roofs.length};i++){
        vec2 d=world.xz-frames[i].xy, axes=frames[i].zw;
        vec2 floorPlan=abs(vec2(d.x*axes.x-d.y*axes.y, dot(d,axes.yx)));
        if(all(lessThan(floorPlan,eaves[i].xy)) && world.y<eaves[i].z) opacity=0.;
      }
    }`,
    fragmentShader: `varying float opacity;void main(){float d=length(gl_PointCoord-.5);
      gl_FragColor=vec4(.90,.95,1.,(1.-smoothstep(.18,.50,d))*opacity);
      #include <colorspace_fragment>
    }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3;
  scene.add(points);
  return (time, p, amount) => {
    points.visible = amount > 0.015;
    mat.uniforms.amount.value = amount;
    mat.uniforms.clock.value = time;
    mat.uniforms.center.value.set(p.x, p.y + 4.7, p.z);
  };
}
