import * as THREE from './vendor/three.module.min.js';

const TAU = Math.PI * 2;
const ink = '#574c3c';
const flax = '#ccbb93';
const indigo = '#5c7377';
const washMaterials = new Map();

// These samples come from unoutlined areas of the original scroll animals.
// Mirroring each quadrant gives the brush wash a seamless repeat in three dimensions.
const swatches = {
  rabbit: ['rabbit-porter', 266, 193, 29, 44],
  frog: ['frog-sumo', 145, 106, 48, 38],
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
  const [imageName, x, y, w, h] = swatches[kind];
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
  image.src = new URL('../assets/actors/' + imageName + '.webp', import.meta.url).href;
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

function ellipsoidPoint(center, radii, angle, elevation) {
  const level = Math.cos(elevation);
  return [
    center[0] + radii[0] * Math.sin(angle) * level,
    center[1] + radii[1] * Math.sin(elevation),
    center[2] + radii[2] * Math.cos(angle) * level,
  ];
}

export function residentHead(b, kind) {
  if (kind === 'frog') {
    const mouth = [];
    for (let k = -10; k <= 10; k++) {
      const x = k * 0.032,
        y = -0.05 + 0.046 * (k / 10) ** 2;
      const upper = 0.03 + 0.272 * Math.sqrt(Math.max(0, 1 - (x / 0.365) ** 2 - (y / 0.195) ** 2));
      const lower = 0.121 + 0.241 * Math.sqrt(Math.max(0, 1 - (x / 0.325) ** 2 - ((y + 0.092) / 0.096) ** 2));
      mouth.push([x, y, Math.max(upper, lower) + 0.004]);
    }
    ribbon(b, mouth, 0.008, '#665640');
  }
  for (const s of [-1, 1]) {
    if (kind === 'rabbit') {
      // Sumi tips and feathered nape strokes echo the river porter's long ears.
      const ear = new THREE.Euler(-0.27, 0, -s * 0.19);
      const point = (x, y, z) =>
        new THREE.Vector3(x * s, y, z)
          .applyEuler(ear)
          .add(new THREE.Vector3(s * 0.102, 0.377, -0.067))
          .toArray();
      for (const side of [-1, 1]) {
        const shade = side < 0 ? '#82715a' : '#594d3d';
        ribbon(
          b,
          [
            point(side * 0.035, 0.143, 0.067),
            point(side * 0.036, 0.219, 0.051),
            point(side * 0.02, 0.278, 0.036),
            point(0.002, 0.306, 0),
          ],
          0.01,
          shade,
        );
        ribbon(
          b,
          [point(side * 0.025, 0.166, -0.066), point(side * 0.02, 0.254, -0.047), point(0, 0.305, -0.012)],
          0.008,
          shade,
          [0, 0, -1],
        );
      }
      const center = [0, 0.023, 0.035],
        radii = [0.249, 0.295, 0.251];
      for (let i = 0; i < 7; i++) {
        const angle = s * (1.1 + i * 0.19),
          elev = 0.06 + Math.sin(i * 2.1) * 0.2;
        const pts = [
          [angle, elev],
          [angle + s * 0.12, elev - 0.1],
          [angle + s * 0.2, elev - 0.19],
        ];
        ribbon(
          b,
          pts.map(([a, e]) => ellipsoidPoint(center, radii, a, e)),
          i % 3 === 0 ? 0.006 : 0.0035,
          i % 3 === 0 ? '#89765b' : '#b39e80',
          [s, 0, 0],
        );
      }
      ribbon(
        b,
        [
          [s * 0.131, 0.102, 0.22],
          [s * 0.163, 0.119, 0.208],
          [s * 0.191, 0.095, 0.18],
        ],
        0.009,
        ink,
        [s * 0.6, 0.1, 0.8],
      );
      for (let i = 0; i < 3; i++)
        b.ball(s * (0.053 + 0.031 * i), -0.05 - i * 0.007, 0.402 - 0.009 * i, 0.007, 0.005, 0.005, '#8b7966');
    } else {
      // Warm golden iris, heavy lid and a thin tympanic ring are characteristic of the frog in the emaki.
      ribbon(
        b,
        [
          [s * 0.16, 0.141, 0.179],
          [s * 0.196, 0.207, 0.151],
          [s * 0.25, 0.208, 0.153],
          [s * 0.302, 0.145, 0.136],
        ],
        0.014,
        '#655e43',
        [s * 0.45, 0.1, 0.9],
      );
      ribbon(
        b,
        [
          [s * 0.08, -0.137, 0.305],
          [s * 0.14, -0.145, 0.276],
          [s * 0.205, -0.127, 0.233],
        ],
        0.005,
        '#9e916e',
      );
      const eardrum = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * TAU;
        eardrum.push([
          s * (0.34 + 0.012 * Math.cos(a)),
          0.002 + 0.045 * Math.sin(a),
          0.05 + 0.048 * Math.cos(a),
        ]);
      }
      ribbon(b, eardrum, 0.007, '#756f4e', [s, 0, 0.14]);
    }
  }
}

function robeShape(b, kind) {
  const frog = kind === 'frog';
  const levels = frog
    ? [
        [0.59, 0.34, 0.26],
        [0.72, 0.345, 0.29],
        [0.86, 0.322, 0.263],
        [1.0, 0.282, 0.22],
        [1.11, 0.224, 0.173],
      ]
    : [
        [0.57, 0.29, 0.255],
        [0.78, 0.267, 0.259],
        [0.98, 0.254, 0.244],
        [1.14, 0.233, 0.206],
        [1.29, 0.18, 0.152],
      ];
  function location(angle, row, puff = 0) {
    const [y, rx, rz] = levels[row];
    const hem = row === 0 ? 0.043 * Math.sin(angle * 3.0 - 0.4) : 0;
    const neck = row === levels.length - 1 ? -Math.pow(Math.max(0, Math.cos(angle - 0.1)), 4) * 0.16 : 0;
    return [
      Math.sin(angle) * (rx + puff),
      y + hem + neck,
      Math.cos(angle) * (rz + puff) + (frog ? 0.015 : 0.024),
    ];
  }
  const points = [],
    indices = [],
    sections = 32;
  for (let row = 0; row < levels.length; row++)
    for (let i = 0; i <= sections; i++) {
      points.push(...location((i / sections) * TAU, row));
      if (!i || !row) continue;
      const h = row * (sections + 1) + i;
      indices.push(h - sections - 2, h - sections - 1, h, h - sections - 2, h, h - 1);
    }
  addSurface(b, points, indices, frog ? '#a7987e' : '#ccb895');
  // Neck facing, hem, two front panels and the ties of a kosode.
  const rim = [];
  for (let i = 0; i <= 32; i++) rim.push(location((i * TAU) / 32, 0, 0.003));
  b.stroke(rim, 0.006, '#80715c');
  const top = levels.length - 1;
  const front = [
    location(-0.94, top, 0.007),
    location(-0.25, top, 0.012),
    location(0.3, 3, 0.009),
    location(0.63, 2, 0.006),
    location(0.94, 1, 0.008),
  ];
  ribbon(b, front, 0.027, '#8d7b60');
  ribbon(
    b,
    front.map(([x, y, z]) => [x - 0.004, y, z + 0.004]),
    0.017,
    frog ? '#d8c6a3' : '#ead7ae',
  );
  ribbon(
    b,
    front.map(([x, y, z]) => [x + 0.009, y, z + 0.005]),
    0.007,
    ink,
  );
  b.stroke([location(0.89, top, 0.005), location(0.56, top, 0.009), location(0.23, 3, 0.008)], 0.016, flax);
  const waist = levels[1];
  const beltPoints = [],
    beltIndex = [];
  for (let j = 0; j <= 32; j++) {
    const a = (j * TAU) / 32;
    const x = Math.sin(a) * (waist[1] + 0.012),
      z = Math.cos(a) * (waist[2] + 0.014) + (frog ? 0.015 : 0.024);
    const y = waist[0] + 0.01 * Math.sin(a + 0.2);
    beltPoints.push(x, y - 0.025, z, x, y + 0.025, z);
    if (j) beltIndex.push(2 * j - 2, 2 * j, 2 * j + 1, 2 * j - 2, 2 * j + 1, 2 * j - 1);
  }
  addSurface(b, beltPoints, beltIndex, '#ac813e');
  b.ball(0.073, waist[0], waist[2] + 0.012, 0.04, 0.033, 0.027, '#86653a');
  for (const s of [-1, 1]) {
    const x = 0.073;
    b.stroke(
      [
        [x, waist[0], waist[2] + 0.027],
        [x + s * 0.047, waist[0] - 0.039, waist[2] + 0.016],
        [x + s * 0.079, waist[0] - 0.103, waist[2] + 0.006],
      ],
      0.013,
      '#b98e50',
    );
  }
  // Tiny brush-painted sprigs or wave arcs follow the hem around the three-dimensional garment.
  for (let i = 0; i < 11; i++) {
    const a = (i * TAU) / 11 + 0.24;
    const c = location(a, 0, 0.008),
      tangent = [Math.cos(a), 0, -Math.sin(a)];
    const pos = (x, y) => [c[0] + tangent[0] * x, c[1] + y, c[2] + tangent[2] * x];
    const outward = [Math.sin(a), 0, Math.cos(a)];
    if (frog) {
      for (let j = 0; j < 2; j++) {
        const r = 0.033 + j * 0.016;
        ribbon(
          b,
          [-1, -0.5, 0, 0.5, 1].map((u) => pos(u * r, 0.038 + Math.sqrt(1 - u * u) * r)),
          0.004,
          '#827e68',
          outward,
        );
      }
    } else {
      ribbon(b, [pos(-0.032, 0.021), pos(-0.009, 0.051), pos(0.028, 0.097)], 0.004, '#98845f', outward);
      ribbon(b, [pos(-0.011, 0.047), pos(-0.032, 0.054), pos(-0.039, 0.07)], 0.008, '#ae9267', outward);
      ribbon(b, [pos(0.005, 0.067), pos(0.032, 0.071), pos(0.043, 0.084)], 0.007, '#a88f62', outward);
    }
  }
  if (!frog) {
    b.ball(0.21, 0.78, 0.13, 0.123, 0.126, 0.081, indigo, [0, -0.3, 0.11]);
    const tilt = new THREE.Euler(0, -0.3, 0.11);
    const satchel = (a, e) =>
      new THREE.Vector3(...ellipsoidPoint([0, 0, 0], [0.125, 0.128, 0.084], a, e))
        .applyEuler(tilt)
        .add(new THREE.Vector3(0.21, 0.78, 0.13))
        .toArray();
    for (let i = 0; i < 10; i++) {
      const a = (i * TAU) / 10;
      b.stroke(
        Array.from({ length: 7 }, (_, n) => satchel(a, -1 + n / 3)),
        0.0027,
        '#c5bda3',
      );
    }
    for (let j = -2; j <= 2; j++) {
      const e = j * 0.32;
      b.stroke(
        Array.from({ length: 21 }, (_, n) => satchel((n * TAU) / 20, e)),
        0.0027,
        '#b5baa6',
      );
    }
  }
}

export function residentTorso(b, kind, role) {
  const frog = kind === 'frog';
  if (role === 'wander') {
    robeShape(b, kind);
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
  if (!frog) {
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const a = s * (1.32 + i * 0.28),
          e = 0.29 + (i % 2) * 0.13;
        const pts = [
          [a, e],
          [a + s * 0.09, e - 0.07],
          [a + s * 0.11, e - 0.16],
        ];
        ribbon(
          b,
          pts.map(([a, e]) => ellipsoidPoint([0, 0.958, -0.012], [0.242, 0.431, 0.218], a, e)),
          0.005,
          '#9b886c',
          [s, 0, -0.15],
        );
      }
  }
}

export function residentLimb(b, kind, role, part, side, joint, tip) {
  const frog = kind === 'frog',
    s = side;
  if (role === 'wander' && part === 'arm') {
    const sleeve = frog ? '#a99b80' : '#cbb897';
    const edge = [joint[0] * 0.76, joint[1] * 0.76 - 0.036, joint[2] * 0.76];
    b.rod([0, 0.019, 0], edge, 0.096, sleeve, 0.135);
    b.ball(...edge, 0.139, 0.052, 0.129, sleeve, [0.28, 0, s * 0.15]);
    b.loop(edge[0], edge[1] - 0.023, edge[2], 0.125, 0.115, 0.036, '#89775d');
  }
  const [x, y, z] = joint;
  if (part === 'leg') {
    ribbon(
      b,
      [
        [x + s * 0.036, y + 0.066, z + 0.105],
        [x + s * 0.071, y + 0.021, z + 0.098],
        [x + s * 0.065, y - 0.038, z + 0.076],
      ],
      0.006,
      frog ? '#77764e' : '#99876b',
      [s * 0.65, 0, 0.78],
    );
    if (frog) {
      for (let i = 0; i < 3; i++)
        b.ball(
          s * (0.09 + 0.014 * i),
          -0.115 - i * 0.048,
          0.116 - i * 0.017,
          0.023,
          0.018,
          0.009,
          '#85845b',
          [0, s * 0.72, -s * 0.24],
        );
    }
  } else if (role !== 'wander') {
    const line = [
      [x + s * 0.045, y + 0.023, z + 0.033],
      [x + s * 0.059, y - 0.006, z + 0.034],
      [x + s * 0.048, y - 0.027, z + 0.027],
    ];
    ribbon(b, line, 0.005, frog ? '#74764e' : '#9b8565', [s * 0.8, 0, 0.5]);
  }
  if (frog && part === 'arm') {
    const [tx, ty, tz] = tip;
    ribbon(
      b,
      [
        [tx - 0.052 * s, ty + 0.026, tz + 0.024],
        [tx, ty + 0.046, tz + 0.049],
        [tx + 0.034 * s, ty + 0.035, tz + 0.038],
      ],
      0.0044,
      '#777650',
      [0, 1, 0.3],
    );
  }
}
