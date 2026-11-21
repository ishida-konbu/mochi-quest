import * as THREE from './vendor/three.module.min.js';
import { inkVolume } from './scroll-sculpt.js';

const TAU = Math.PI * 2;
const indigo = '#5c7377';
const washMaterials = new Map();

// These samples come from unoutlined areas of the original scroll animals.
// Mirroring each quadrant gives the brush wash a seamless repeat in three dimensions.
const swatches = {
  rabbit: [811, 258, 28, 40],
  frog: [743, 250, 36, 36],
};

function scrollWash(kind) {
  const paper = document.createElement('canvas');
  paper.width = paper.height = 128;
  const paint = paper.getContext('2d');
  paint.fillStyle = '#888';
  paint.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(paper);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 2;
  const [x, y, w, h] = swatches[kind];
  const image = new Image();
  image.onload = () => {
    for (let q = 0; q < 4; q++) {
      const right = q % 2 === 1,
        lower = q >= 2;
      paint.save();
      paint.translate(right ? 128 : 0, lower ? 128 : 0);
      paint.scale(right ? -1 : 1, lower ? -1 : 1);
      paint.drawImage(image, x, y, w, h, 0, 0, 64, 64);
      paint.restore();
    }
    const pixels = paint.getImageData(0, 0, 128, 128);
    const bytes = pixels.data;
    let mean = 0;
    for (let i = 0; i < bytes.length; i += 4)
      mean += 0.26 * bytes[i] + 0.62 * bytes[i + 1] + 0.12 * bytes[i + 2];
    mean /= bytes.length / 4;
    for (let i = 0; i < bytes.length; i += 4) {
      const shade = 0.26 * bytes[i] + 0.62 * bytes[i + 1] + 0.12 * bytes[i + 2];
      const normalized = Math.round(136 + (shade - mean) * (kind === 'frog' ? 2.6 : 3.3));
      bytes[i] = bytes[i + 1] = bytes[i + 2] = normalized;
      bytes[i + 3] = 255;
    }
    paint.putImageData(pixels, 0, 0);
    texture.needsUpdate = true;
  };
  image.src = new URL('./assets/residents/scroll-pigments.webp', import.meta.url).href;
  return texture;
}

function paintedMaterial(base, kind) {
  const material = base.clone();
  const wash = scrollWash(kind);
  material.roughness = 0.99;
  material.metalness = 0;
  material.onBeforeCompile = (shader) => {
    base.onBeforeCompile(shader);
    shader.uniforms.residentWash = { value: wash };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 residentPosition;\nvarying vec3 residentNormal;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nresidentPosition=position; residentNormal=normal;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D residentWash;\nvarying vec3 residentPosition;\nvarying vec3 residentNormal;',
      )
      .replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        vec3 brushAxis = pow(abs(normalize(residentNormal)),vec3(4.0));
        brushAxis /= max(dot(brushAxis,vec3(1.0)),.001);
        vec3 p = residentPosition * vec3(3.1,2.4,3.1);
        float granules = dot(brushAxis,vec3(
          texture2D(residentWash,p.zy).r,
          texture2D(residentWash,p.xz).r,
          texture2D(residentWash,p.xy).r)) - .533;
        float pale = smoothstep(.14,.42,diffuseColor.r+diffuseColor.g);
        float olive = smoothstep(.015,.095,(diffuseColor.g-diffuseColor.r)/(diffuseColor.r+.01))
                    * smoothstep(.16,.36,(diffuseColor.g-diffuseColor.b)/(diffuseColor.g+.01));
        float washStrength = ${kind === 'frog' ? 'mix(.085,.59,olive)' : 'mix(.11,.38,pale)'};
        diffuseColor.rgb *= vec3(1.) + granules * washStrength;
      `,
      );
  };
  material.customProgramCacheKey = () => base.customProgramCacheKey() + '-scroll-resident-' + kind;
  return material;
}

// The cloned NPCs share their species' one opaque material and original draw batches.
export function finishResident(parent, kind) {
  parent.traverse((mesh) => {
    if (!mesh.isMesh) return;
    if (!washMaterials.has(kind)) washMaterials.set(kind, paintedMaterial(mesh.material, kind));
    mesh.material = washMaterials.get(kind);
  });
}

function ribbon(b, points, width, shade, facing = [0, 0, 1]) {
  // A brush line tapers to a point at both ends. A flat strip avoids raised wire-like contours.
  const positions = [],
    indices = [];
  const normal = new THREE.Vector3(...facing).normalize();
  const path = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const sections = Math.max(4, points.length * 2);
  for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const point = path.getPoint(t),
      tangent = path.getTangent(t);
    const side = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    const measure = width * (0.1 + 0.9 * Math.pow(Math.sin(t * Math.PI), 0.54));
    for (const sign of [-1, 1])
      positions.push(
        ...point
          .clone()
          .addScaledVector(side, measure * sign)
          .toArray(),
      );
    if (i) {
      const j = i * 2;
      indices.push(j - 2, j - 1, j, j - 1, j + 1, j);
    }
  }
  addSurface(b, positions, indices, shade);
}

function addSurface(b, positions, indices, shade) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  b.add(geometry, shade);
  geometry.dispose();
}

function robeShape(b, kind, working = false) {
  const frog = kind === 'frog',
    width = frog ? [0.37, 0.368, 0.34, 0.33, 0.275, 0.207] : [0.3, 0.285, 0.273, 0.26, 0.215, 0.16];
  const depth = frog
    ? [0.31, 0.345, 0.328, 0.294, 0.224, 0.163]
    : [0.276, 0.282, 0.277, 0.256, 0.206, 0.143];
  const dye = working ? (frog ? '#aaa998' : '#829098') : frog ? '#c4b59c' : '#dec7ac';
  const thread = working ? '#c2ba9e' : '#a28b65';
  function cloth(a, t, offset = 0) {
    const i = Math.min(4, Math.floor(t * 5)),
      f = t * 5 - i;
    const r = THREE.MathUtils.lerp(width[i], width[i + 1], f),
      d = THREE.MathUtils.lerp(depth[i], depth[i + 1], f);
    const fold =
      (0.012 + 0.012 * (1 - t)) * (0.7 * Math.cos(7 * a + 2.2 * t) + 0.4 * Math.sin(11 * a - 0.8 * t));
    const hem = (1 - t) ** 3 * (0.045 * Math.sin(3 * a - 0.4) + 0.034 * Math.sin(5 * a + 0.2));
    const neck = t ** 3 * Math.max(0, Math.cos(a + 0.06)) ** 7 * (frog ? 0.085 : 0.125);
    return [
      Math.sin(a) * (r + fold + offset),
      (frog ? 0.532 : 0.557) + (frog ? 0.659 : 0.82) * t + hem - neck,
      (frog ? 0.036 : 0.012) + 0.075 * t + Math.cos(a) * (d + fold + offset),
    ];
  }
  function panel(where, low, high, shade, count = 48) {
    const pts = [],
      ix = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      pts.push(...where(t, low), ...where(t, high));
      if (i) {
        const k = i * 2;
        ix.push(k - 2, k, k + 1, k - 2, k + 1, k - 1);
      }
    }
    addSurface(b, pts, ix, shade);
  }
  const pts = [],
    ix = [],
    rows = 20,
    count = 64;
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= count; i++) {
      pts.push(...cloth((i * TAU) / count, j / rows));
      if (j && i) {
        const k = j * (count + 1) + i;
        ix.push(k - count - 2, k - count - 1, k, k - count - 2, k, k - 1);
      }
    }
  addSurface(b, pts, ix, dye);
  const band = (t, v) => cloth(t * TAU, v, 0.004);
  panel(band, 0.009, 0.022, working ? '#b2ab95' : '#947e66', 64);
  panel(band, 0.027, 0.033, thread, 64);
  panel(
    (a, t) => cloth(a * TAU, t + 0.014 * Math.sin(a * TAU + 0.2), 0.007),
    0.306,
    0.382,
    working ? '#b49769' : '#aa8354',
    64,
  );
  panel((a, t) => cloth(a * TAU, t + 0.014 * Math.sin(a * TAU + 0.2), 0.01), 0.364, 0.372, '#d4b58a', 64);
  // Continuous overlapping lapels follow the same draped surface as the folds.
  for (const side of [-1, 1]) {
    const end = side < 0 ? 0.393 : 0.72;
    const where = (u, w) => cloth(side * (1.03 - 1.76 * u) + w, 1 - u * (1 - end), 0.008);
    panel(where, -0.14, 0.14, working ? '#b9bdb0' : '#c2a98b', 32);
    panel(where, 0.095, 0.125, '#8d7c68', 32);
  }
  panel(band, 0.969, 1, working ? '#abb0a6' : '#b6a388', 64);
  for (let k = 0; k < 15; k++) {
    const a = (k * TAU) / 15 + 0.22,
      h = 0.012 * Math.sin(a * 3);
    const outward = [Math.sin(a), 0, Math.cos(a)];
    const line = (samples, weight, shade) =>
      ribbon(
        b,
        samples.map(([x, t]) => cloth(a + x, t + h, 0.006)),
        weight,
        shade,
        outward,
      );
    if (frog) {
      for (let n = 0; n < 2; n++) {
        const r = 0.08 + 0.046 * n;
        line(
          [-1, -0.66, 0, 0.66, 1].map((u) => [r * u, 0.1 + 0.071 * Math.sqrt(1 - u * u) + n * 0.015]),
          0.0033,
          thread,
        );
      }
    } else {
      line(
        [
          [-0.101, 0.057],
          [-0.024, 0.11],
          [0.092, 0.19],
        ],
        0.0038,
        thread,
      );
      line(
        [
          [-0.028, 0.107],
          [-0.086, 0.122],
          [-0.116, 0.15],
        ],
        0.0086,
        thread,
      );
      line(
        [
          [0.012, 0.132],
          [0.069, 0.139],
          [0.095, 0.154],
        ],
        0.0067,
        thread,
      );
    }
  }
  const knot = cloth(0.44, 0.34, 0.03);
  for (const s of [-1, 1]) {
    const [x, y, z] = knot;
    b.stroke(
      [knot, [x + 0.05 * s, y - 0.03, z + 0.026], [x + 0.087 * s, y - 0.12, z + 0.012]],
      0.014,
      '#b18b57',
    );
  }
  b.ball(...knot, 0.042, 0.033, 0.026, '#957550');
  if (!frog && !working) {
    const x = 0.28,
      y = 0.776,
      z = 0.147;
    b.ball(x, y, z, 0.124, 0.143, 0.093, indigo, [0, -0.22, 0.12]);
    for (let k = -3; k <= 3; k++) {
      const n = k * 0.23,
        span = Math.sqrt(1 - n * n);
      const line = (cross) =>
        Array.from({ length: 13 }, (_, i) => {
          const v = span * (i / 6 - 1),
            u = cross ? n : v,
            w = cross ? v : n;
          return [x + u * 0.128, y + w * 0.145, z + Math.sqrt(Math.max(0.003, 1 - u * u - w * w)) * 0.1];
        });
      b.stroke(line(false), 0.0028, '#d0c4a9');
      b.stroke(line(true), 0.0028, '#aea990');
    }
    b.stroke(
      [
        [x, y + 0.08, z],
        [0.23, 0.997, 0.217],
        [0.184, 1.233, 0.193],
        [0.135, 1.296, 0.064],
        [0.161, 1.184, -0.08],
        [0.25, 0.93, -0.073],
        [x, y + 0.04, z],
      ],
      0.019,
      '#68737a',
    );
  }
}

export function residentTorso(b, kind, role) {
  const frog = kind === 'frog';
  if (['wander', 'pounder', 'turner'].includes(role)) {
    robeShape(b, kind, role !== 'wander');
    return;
  }
  if (role === 'sumo') {
    const y = frog ? 0.661 : 0.79,
      rx = frog ? 0.325 : 0.25,
      rz = frog ? 0.272 : 0.23;
    b.ball(0, y, 0, rx, 0.102, rz, '#796550');
    for (let i = 0; i < 3; i++)
      b.loop(
        0,
        y - 0.016 + i * 0.021,
        0,
        rx * (1 - i * 0.008),
        rz * (1 - i * 0.008),
        0.015,
        i === 0 ? '#584c3c' : '#927d5e',
      );
    b.box(0, y - 0.081, rz - 0.008, 0.132, 0.163, 0.029, '#74604c', [0.11, 0, 0]);
    for (const s of [-1, 1]) {
      ribbon(
        b,
        [
          [s * 0.018, y - 0.014, rz + 0.008],
          [s * 0.029, y - 0.091, rz + 0.014],
          [s * 0.044, y - 0.15, rz + 0.02],
        ],
        0.005,
        '#514c41',
      );
      b.ball(s * 0.063, y - 0.025, -rz - 0.014, 0.092, 0.058, 0.058, '#806a53', [0, 0, s * 0.45]);
    }
  } else {
    // A short, indigo tenugui stays clear of the pole and baskets.
    const y = frog ? 1.03 : 1.245,
      rx = frog ? 0.223 : 0.17;
    b.loop(0, y, 0.013, rx, rx * 0.88, 0.11, indigo);
    b.stroke(
      [
        [rx * 0.65, y + 0.012, rx * 0.66],
        [0.062, y - 0.046, rx * 0.86],
        [-0.059, y - 0.125, rx * 0.94],
      ],
      0.027,
      indigo,
    );
    ribbon(
      b,
      [
        [rx * 0.65, y + 0.019, rx * 0.69],
        [0.062, y - 0.04, rx * 0.89],
        [-0.047, y - 0.116, rx * 0.99],
      ],
      0.006,
      '#c6c3a8',
    );
  }
}

export function residentLimb(b, kind, role, side, joint) {
  const frog = kind === 'frog',
    s = side;
  if (role === 'wander') {
    const sleeve = frog ? '#a99b80' : '#cbb897';
    const edge = [joint[0] * 0.76, joint[1] * 0.76 - 0.036, joint[2] * 0.76];
    inkVolume(
      b,
      [
        [0, 0.042, 0, 0.052, 0.055],
        [0, 0.003, 0, 0.102, 0.094],
        [joint[0] * 0.42, joint[1] * 0.36, joint[2] * 0.36, 0.104, 0.108],
        [edge[0], edge[1] + 0.044, edge[2], 0.124, 0.125],
        [...edge, 0.135, 0.134],
        [edge[0], edge[1] - 0.014, edge[2], 0.113, 0.108],
      ],
      sleeve,
      25,
    );
    const facing = [s, 0, 0.25];
    for (let i = 0; i < 3; i++) {
      const ox = s * (0.091 + i * 0.006);
      ribbon(
        b,
        [
          [ox, 0, -0.016],
          [ox + s * 0.034, joint[1] * 0.39, 0.01 - i * 0.018],
          [edge[0] + s * 0.121, edge[1] + 0.023, edge[2] + 0.025 - i * 0.024],
        ],
        0.006,
        '#95816c',
        facing,
      );
    }
    b.loop(edge[0], edge[1] - 0.008, edge[2], 0.128, 0.128, 0.036, '#7b6957');
  }
}
