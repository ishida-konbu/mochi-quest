import * as THREE from './vendor/three.module.min.js';

const TAU = Math.PI * 2;
const pigments = {
  // Original picture origin, then its position in our padded, opaque atlas.
  hare: [77, 0, 0, 0],
  frog: [175, 0, 320, 0],
  leaf: [18, 0, 580, 0],
  shell: [36, 0, 0, 170],
  turtle: [430, 50, 495, 228],
};
let painted;
function illustrationMaterial() {
  if (painted) return painted;
  const map = new THREE.TextureLoader().load(
    new URL('./assets/residents/scroll-pigments.webp', import.meta.url).href,
  );
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  painted = new THREE.MeshStandardMaterial({ map, roughness: 0.96, side: THREE.DoubleSide });
  painted.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 inkWash; varying vec4 vInkWash;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInkWash=inkWash;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vInkWash;')
      .replace(
        '#include <map_fragment>',
        `
      #include <map_fragment>
      diffuseColor.rgb=mix(vInkWash.rgb,diffuseColor.rgb,vInkWash.a);
    `,
      )
      .replace(
        '#include <opaque_fragment>',
        `
      float edge = 1.0 - smoothstep(.025, .14, abs(dot(normalize(normal), normalize(vViewPosition))));
      outgoingLight *= 1.0 - .35 * edge;
      #include <opaque_fragment>
    `,
      );
  };
  return painted;
}
function paintedMesh(parent, name, region, evaluate, rows = 32, sides = 48, closed = true) {
  const xyz = [],
    uv = [],
    ix = [];
  const [sx, sy, ax, ay] = pigments[region];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= sides; i++) {
      const [x, y, z, px, py] = evaluate(j / rows, i / sides);
      xyz.push(x, y, z);
      uv.push((px - sx + ax + 0.5) / 864, 1 - (py - sy + ay + 0.5) / 424);
      if (j < rows && i < sides) {
        const k = j * (sides + 1) + i;
        ix.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  if (closed) {
    const normals = geo.attributes.normal;
    const a = new THREE.Vector3(),
      b = new THREE.Vector3();
    for (let j = 0; j <= rows; j++) {
      const k = j * (sides + 1);
      a.fromBufferAttribute(normals, k)
        .add(b.fromBufferAttribute(normals, k + sides))
        .normalize();
      normals.setXYZ(k, a.x, a.y, a.z);
      normals.setXYZ(k + sides, a.x, a.y, a.z);
    }
  }
  const wash = [],
    normal = geo.attributes.normal,
    skin = new THREE.Color();
  const portrait = (region === 'hare' && name === '面相') || region === 'frog' || region === 'turtle';
  skin.set(
    region === 'hare'
      ? '#e2cfb8'
      : region === 'turtle'
        ? '#ad8c60'
        : name === '眉と上あご'
          ? '#baaa85'
          : '#dbc4a0',
  );
  for (let k = 0; k < normal.count; k++) {
    const t = Math.floor(k / (sides + 1)) / rows;
    const flank = Math.abs(normal.getX(k));
    const ink = portrait
      ? THREE.MathUtils.smoothstep(flank, 0.23, 0.81) * (1 - THREE.MathUtils.smoothstep(t, 0.87, 0.97))
      : 1;
    wash.push(skin.r, skin.g, skin.b, ink);
  }
  geo.setAttribute('inkWash', new THREE.Float32BufferAttribute(wash, 4));
  const mesh = new THREE.Mesh(geo, illustrationMaterial());
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// A transverse section of the sculpt. Strokes stay fixed to the skin as the camera circles.
function sections(rows, t) {
  const u = t * (rows.length - 1);
  const i = Math.min(rows.length - 2, Math.floor(u)),
    f = u - i;
  const a = rows[Math.max(0, i - 1)],
    b = rows[i],
    c = rows[i + 1],
    d = rows[Math.min(rows.length - 1, i + 2)];
  return b.map((v, n) => {
    const a1 = 0.5 * (c[n] - a[n]),
      a2 = 0.5 * (d[n] - b[n]);
    return (
      (2 * f ** 3 - 3 * f * f + 1) * v +
      (f ** 3 - 2 * f * f + f) * a1 +
      (3 * f * f - 2 * f ** 3) * c[n] +
      (f ** 3 - f * f) * a2
    );
  });
}

function tracedVolume(parent, name, source, rows, options) {
  const { origin, scale, deform } = options;
  return paintedMesh(
    parent,
    name,
    source,
    (t, ring) => {
      const [px, top, bottom, thickness] = sections(rows, t);
      const a = ring * TAU,
        side = Math.cos(a),
        level = Math.sin(a);
      const py = (top + bottom - level * (bottom - top)) * 0.5;
      const sample = [
        Math.max(0.0005, thickness) * side,
        (origin[1] - py) * scale,
        (px - origin[0]) * scale,
        px,
        py,
      ];
      return deform ? deform(sample, side, level, t) : sample;
    },
    rows.length * 3,
    36,
  );
}

const hareHead = [
  [266, 83, 84, 0.015],
  [271, 73, 97, 0.088],
  [279, 57, 104, 0.155],
  [289, 47, 109, 0.195],
  [304, 45, 110, 0.207],
  [320, 46, 103, 0.196],
  [335, 49, 98, 0.165],
  [350, 55, 94, 0.13],
  [361, 63, 92, 0.103],
  [370, 68, 86, 0.065],
  [374, 74, 80, 0.027],
  [375, 76, 77, 0.004],
];
const hareEar = [
  [95, 80, 81, 0.001],
  [103, 70, 75, 0.006],
  [120, 60, 68, 0.012],
  [148, 48, 70, 0.021],
  [176, 38, 75, 0.03],
  [202, 33, 75, 0.035],
  [230, 32, 64, 0.029],
  [253, 36, 60, 0.024],
  [274, 46, 65, 0.026],
  [292, 50, 64, 0.017],
  [298, 55, 60, 0.006],
];
const frogCrown = [
  [227, 56, 62, 0.008],
  [235, 48, 78, 0.1],
  [249, 37, 89, 0.19],
  [270, 27, 97, 0.235],
  [293, 24, 99, 0.258],
  [309, 18, 92, 0.257],
  [325, 6, 79, 0.25],
  [340, 2, 71, 0.246],
  [354, 5, 66, 0.23],
  [367, 15, 62, 0.209],
  [380, 27, 58, 0.175],
  [394, 31, 55, 0.137],
  [406, 37, 53, 0.09],
  [415, 44, 52, 0.044],
  [418, 49, 50, 0.006],
];
const frogJaw = [
  [252, 75, 77, 0.007],
  [263, 69, 92, 0.13],
  [282, 67, 109, 0.2],
  [303, 69, 126, 0.227],
  [319, 81, 132, 0.224],
  [333, 77, 122, 0.207],
  [350, 72, 107, 0.191],
  [370, 70, 94, 0.15],
  [386, 73, 85, 0.108],
  [398, 76, 82, 0.049],
  [404, 79, 80, 0.006],
];

export function sculptHead(parent, kind, role) {
  if (kind === 'rabbit') {
    tracedVolume(parent, '面相', 'hare', hareHead, { origin: [294, 79], scale: 0.0053 });
    for (const s of [-1, 1]) {
      const ear = tracedVolume(parent, '筆穂耳' + s, 'hare', hareEar, {
        origin: [286, 56],
        scale: 0.0042,
        deform: (p, side, level, t) => {
          // Splay the long pinnae and turn the ventral surface slightly toward the sky.
          const fan = 1 - t;
          p[0] += s * (0.077 + fan * 0.27 + fan * fan * 0.12);
          p[1] += 0.133 + fan * (s > 0 ? 0.25 : 0.14) + 0.13 * Math.sin(fan * Math.PI);
          p[2] -= 0.032;
          return p;
        },
      });
      if (role === 'sumo' || role === 'pounder') ear.rotation.x = s > 0 ? 0.79 : 0.66;
      else if (role === 'wander') ear.rotation.x = s > 0 ? 0.28 : 0.08;
    }
  } else {
    const scale = 0.00365,
      origin = [302, 73];
    tracedVolume(parent, '眉と上あご', 'frog', frogCrown, {
      origin,
      scale,
      deform: (p, side, level, t) => {
        // The inked orbits stand on either side of the low bridge of the nose.
        if (level > 0) p[1] -= 0.104 * Math.exp(-13 * side * side) * Math.exp(-28 * (t - 0.49) ** 2) * level;
        return p;
      },
    });
    const jaw = tracedVolume(parent, '喉袋と下あご', 'frog', frogJaw, { origin, scale });
    if (role === 'wander' || role === 'turner') jaw.rotation.x = 0.095;
  }
}

export function scrollShell(parent) {
  const rows = [
    [39, 209, 212, 0.008],
    [52, 192, 217, 0.113],
    [69, 169, 223, 0.181],
    [90, 139, 228, 0.252],
    [117, 102, 234, 0.303],
    [150, 66, 241, 0.35],
    [192, 37, 244, 0.387],
    [235, 17, 244, 0.407],
    [278, 5, 240, 0.412],
    [318, 4, 233, 0.403],
    [356, 11, 222, 0.384],
    [395, 28, 204, 0.342],
    [432, 49, 181, 0.273],
    [463, 73, 154, 0.201],
    [488, 88, 125, 0.128],
    [506, 93, 106, 0.057],
    [511, 98, 99, 0.004],
  ];
  return tracedVolume(parent, '甲羅の岩絵具', 'shell', rows, {
    origin: [277, 272],
    scale: 0.0021,
    deform: (p, side, level) => {
      p[1] += 0.072;
      p[2] -= 0.027;
      return p;
    },
  });
}

export function sculptTurtleHead(parent) {
  tracedVolume(
    parent,
    '首から嘴',
    'turtle',
    [
      [433, 164, 195, 0.041],
      [449, 154, 194, 0.085],
      [469, 133, 181, 0.092],
      [492, 110, 174, 0.098],
      [513, 96, 166, 0.091],
      [535, 81, 154, 0.091],
      [556, 74, 143, 0.101],
      [580, 66, 132, 0.112],
      [602, 60, 120, 0.117],
      [624, 58, 113, 0.1],
      [641, 62, 106, 0.081],
      [650, 71, 100, 0.049],
      [651, 91, 95, 0.006],
    ],
    {
      origin: [424, 262],
      scale: 0.0024,
      deform: (p) => {
        p[2] += 0.243;
        return p;
      },
    },
  );
}

export function scrollParasol(parent) {
  // The original lotus leaf's veins converge at (154, 109). Shape every rib
  // in 3D, including its irregular scallops and the raised edge opposite the stalk.
  const outline = [
    [271, 53],
    [269, 72],
    [253, 84],
    [244, 101],
    [225, 101],
    [210, 118],
    [183, 127],
    [174, 147],
    [157, 151],
    [138, 170],
    [125, 193],
    [104, 193],
    [85, 188],
    [69, 204],
    [51, 201],
    [46, 184],
    [32, 180],
    [25, 167],
    [24, 146],
    [32, 131],
    [28, 116],
    [44, 103],
    [50, 85],
    [52, 69],
    [63, 50],
    [76, 42],
    [98, 40],
    [113, 28],
    [130, 16],
    [148, 12],
    [168, 14],
    [186, 7],
    [209, 4],
    [228, 5],
    [240, 16],
    [254, 18],
    [264, 29],
    [263, 39],
  ];
  const curve = new THREE.SplineCurve([...outline, outline[0]].map(([x, y]) => new THREE.Vector2(x, y)));
  const leaf = paintedMesh(
    parent,
    '葉脈の蓮傘',
    'leaf',
    (r, a) => {
      const edge = curve.getPoint(a);
      const u = 154 + (edge.x - 154) * r,
        w = 109 + (edge.y - 109) * r;
      const x = (u - 154) * 0.0038,
        z = (w - 109) * 0.00415;
      return [x, 0.1 * (1 - r * r) + 0.05 * r * r * Math.sin(a * TAU * 7 + 0.4), z, u, w];
    },
    14,
    88,
    false,
  );
  leaf.position.set(-0.46, 1.84, -0.055);
  leaf.rotation.set(-0.29, 0.08, 0.38);
  return leaf;
}

// Elliptic cross sections follow the spine from shoulder to wrist, or from hip
// through the hock to the ankle. A single skin crosses each joint.
export function inkVolume(b, stations, pigment, steps = 24, markings) {
  const xyz = [],
    ix = [],
    sides = 16,
    lateral = new THREE.Vector3(1, 0, 0);
  const along = new THREE.Vector3(),
    across = new THREE.Vector3(),
    depth = new THREE.Vector3();
  function frame(t) {
    const a = sections(stations, t);
    const lo = sections(stations, Math.max(0, t - 0.002)),
      hi = sections(stations, Math.min(1, t + 0.002));
    along.set(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]).normalize();
    across.copy(lateral).addScaledVector(along, -along.x).normalize();
    depth.crossVectors(along, across);
    return a;
  }
  function skin(a, theta, lift = 0) {
    const u = Math.cos(theta) * (Math.max(0.001, a[3]) + lift),
      v = Math.sin(theta) * (Math.max(0.001, a[4]) + lift);
    return [
      a[0] + across.x * u + depth.x * v,
      a[1] + across.y * u + depth.y * v,
      a[2] + across.z * u + depth.z * v,
    ];
  }
  for (let j = 0; j <= steps; j++) {
    const a = frame(j / steps);
    for (let i = 0; i < sides; i++) {
      xyz.push(...skin(a, (i * TAU) / sides));
      if (j < steps) {
        const k = j * sides + i,
          next = j * sides + ((i + 1) % sides);
        ix.push(k, next, k + sides, next, next + sides, k + sides);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  b.add(g, pigment);
  g.dispose();

  if (!markings) return;
  // Dry-brush flicks on the hares, broken pools of olive pigment on the frogs.
  const spot = markings === 'frog',
    count = spot ? 29 : 21,
    dots = [],
    triangles = [];
  for (let k = 0; k < count; k++) {
    const ct = 0.16 + 0.7 * ((k * 0.618034 + 0.31) % 1),
      ca = k * 2.39996 + Math.sin(k * 1.7) * 0.26;
    if (spot && Math.sin(ca) < -0.75) continue;
    const off = dots.length / 3,
      extent = (spot ? 0.023 : 0.058) * (0.7 + 0.3 * Math.sin(k));
    dots.push(...skin(frame(ct), ca, 0.0028));
    for (let j = 0; j < 10; j++) {
      const angle = (TAU * j) / 10,
        jag = 1 + 0.16 * Math.sin(j * 2.4 + k * 0.53);
      const dt = extent * Math.cos(angle) * jag;
      const da = (spot ? 0.125 : 0.026) * Math.sin(angle) * jag + (spot ? 0 : dt * 2.1);
      dots.push(...skin(frame(ct + dt), ca + da, 0.0026));
      triangles.push(off, off + 1 + j, off + 1 + ((j + 1) % 10));
    }
  }
  const brush = new THREE.BufferGeometry();
  brush.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
  brush.setIndex(triangles);
  brush.computeVertexNormals();
  b.add(brush, spot ? '#89805c' : '#9c866e');
  brush.dispose();
}
