import * as THREE from './vendor/three.module.min.js';
import { inkVolume } from './scroll-sculpt.js';

import { POUNDING, POUNDING_CREW } from './festival.js';

const TAU = 2 * Math.PI;
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);

function turned(b, rings, color, origin = [0, 0, 0]) {
  const geo = new THREE.LatheGeometry(
    rings.map(([r, y]) => new THREE.Vector2(r, y)),
    56,
  );
  b.add(geo, color, origin);
  geo.dispose();
}

let woodMaterial;
function timbers() {
  if (woodMaterial) return woodMaterial;
  const grain = new THREE.TextureLoader().load(new URL('./assets/world/cedar.webp', import.meta.url).href);
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.anisotropy = 4;
  woodMaterial = new THREE.MeshStandardMaterial({
    color: '#cfa16e',
    map: grain,
    bumpMap: grain,
    bumpScale: 0.0045,
    roughness: 0.76,
    side: THREE.DoubleSide,
  });
  woodMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 timberPos; varying vec3 timberNorm;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntimberPos=position;timberNorm=normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 timberPos; varying vec3 timberNorm;')
      .replace(
        '#include <map_fragment>',
        `
        vec3 fibers=texture2D(map,vec2(2.*vMapUv.x,timberPos.y*1.07+.1)).rgb;
        float fiber=dot(fibers,vec3(.28,.59,.13));
        float endGrain=smoothstep(.56,.93,abs(normalize(timberNorm).y));
        float radius=length(timberPos.xz+vec2(.017,.023));
        float ring=sin(radius*476.+1.8*fiber+.38*sin(timberPos.x*18.));
        float rings=.97-.21*smoothstep(.2,.92,ring);
        diffuseColor.rgb*=mix(clamp(.51+1.95*fiber,.50,1.35),rings+.32*(fiber-.26),endGrain);
      `,
      );
  };
  return woodMaterial;
}
function carvedWood(parent, rings, name, z = 0) {
  const geo = new THREE.LatheGeometry(
    rings.map(([r, y]) => new THREE.Vector2(r, y)),
    80,
  );
  const attr = geo.attributes.position;
  for (let k = 0; k < attr.count; k++) {
    const x = attr.getX(k),
      y = attr.getY(k),
      z = attr.getZ(k),
      a = Math.atan2(x, z);
    const tool = 1 + 0.004 * Math.sin(7 * a + 0.8 * y) + 0.003 * Math.cos(11 * a - y);
    attr.setXYZ(k, x * tool, y + 0.0012 * Math.cos(9 * a) * Math.hypot(x, z), z * tool);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, timbers());
  mesh.position.z = z;
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
}
function strawMat(parent) {
  const w = 512,
    h = 320,
    canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ad9262';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    const shade = Math.round(164 + 12 * Math.sin(y * 1.53) + 7 * Math.cos(y * 0.091));
    ctx.fillStyle = 'rgb(' + shade + ',' + (shade - 21) + ',' + (shade - 60) + ')';
    ctx.fillRect(0, y, w, 2);
    for (let x = 12; x < w; x += 24) {
      ctx.fillStyle = (x / 24 + y / 3) % 2 < 1 ? '#8b764d' : '#c4ac78';
      ctx.fillRect(x, y, 2, 3);
    }
  }
  for (const edge of [0, h - 13]) {
    ctx.fillStyle = '#626a61';
    ctx.fillRect(0, edge, w, 13);
    ctx.strokeStyle = '#c3b48c';
    ctx.lineWidth = 1.3;
    for (let x = -4; x < w; x += 11) {
      ctx.beginPath();
      ctx.moveTo(x, edge + 2);
      ctx.lineTo(x + 4, edge + 6);
      ctx.lineTo(x, edge + 11);
      ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(3.14, 0.085, 2.15),
    new THREE.MeshStandardMaterial({ map, roughness: 0.99 }),
  );
  mat.name = '浜の莚';
  mat.rotation.y = -0.27;
  mat.position.set(0, -0.027, -0.01);
  mat.receiveShadow = true;
  parent.add(mat);
}

function mortar(b) {
  for (const [r, y, t, c] of [
    [0.422, 0.051, 0.021, '#86663e'],
    [0.338, 0.286, 0.027, '#735435'],
    [0.339, 0.308, 0.028, '#baa16f'],
    [0.337, 0.327, 0.026, '#ad9160'],
    [0.467, 0.753, 0.012, '#e3bd83'],
    [0.416, 0.754, 0.014, '#c69c67'],
    [0.379, 0.729, 0.014, '#8b673e'],
  ])
    b.loop(0, y, 0, r, r, t, c);
  for (let i = 0; i < 61; i++) {
    const a = (i * TAU) / 61 + 0.015 * Math.sin(i);
    const trace = [
      [0.448, 0.107],
      [0.36, 0.237],
      [0.333, 0.338],
      [0.37, 0.411],
      [0.474, 0.56],
      [0.501, 0.675],
      [0.49, 0.734],
    ];
    const start = i % 4 === 0 ? 0 : i % 3 === 0 ? 1 : 3,
      end = i % 4 === 0 ? 5 : trace.length;
    const line = trace.slice(start, end).map(([r, y], j) => {
      const theta = a + 0.01 * Math.sin(j * 1.64 + i) + j * 0.002;
      return [r * Math.sin(theta), y, r * Math.cos(theta)];
    });
    b.stroke(line, i % 6 === 0 ? 0.004 : 0.0021, i % 3 ? '#a07b50' : '#d0aa70', line.length + 1, 3);
  }
  for (let i = 0; i < 19; i++) {
    const a = (i * TAU) / 19;
    b.rod(
      [0.408 * Math.cos(a), 0.753, 0.408 * Math.sin(a)],
      [0.468 * Math.cos(a + 0.022), 0.756, 0.468 * Math.sin(a + 0.022)],
      0.0019,
      '#967147',
    );
  }
}

function kine(b) {
  b.rod([0, 0, -0.13], [0, 0, 0.81], 0.035, '#ab7c46', 0.027);
  b.rod([0, 0, -0.146], [0, 0, -0.118], 0.037, '#84603f');
  // Yokogine: the working end lies across the handle and is rounded on both faces.

  b.loop(0, -0.231, 0.81, 0.111, 0.111, 0.028, '#a5794e');
  for (let i = 0; i < 13; i++) {
    const a = (i * TAU) / 13;
    b.stroke(
      [
        [-0.001 + 0.111 * Math.sin(a), -0.224, 0.81 + 0.111 * Math.cos(a)],
        [0.112 * Math.sin(a + 0.03), -0.049, 0.81 + 0.112 * Math.cos(a + 0.03)],
        [0.102 * Math.sin(a), 0.173, 0.81 + 0.102 * Math.cos(a)],
      ],
      0.0019,
      '#a37a4e',
    );
  }
}
function bucket(b) {
  const x = 0.64,
    z = -0.63;
  turned(
    b,
    [
      [0.126, 0.014],
      [0.166, 0.042],
      [0.194, 0.323],
      [0.186, 0.351],
      [0.163, 0.344],
      [0.151, 0.304],
      [0.132, 0.063],
      [0, 0.052],
    ],
    '#be9869',
    [x, 0, z],
  );
  for (const [r, y] of [
    [0.164, 0.062],
    [0.19, 0.28],
  ])
    b.loop(x, y, z, r, r, 0.047, '#776246');
  b.stroke(
    [
      [x - 0.177, 0.284, z],
      [x - 0.14, 0.547, z],
      [x, 0.591, z],
      [x + 0.14, 0.542, z],
      [x + 0.18, 0.284, z],
    ],
    0.013,
    '#876741',
  );
  turned(
    b,
    [
      [0.001, 0.291],
      [0.167, 0.291],
    ],
    '#97a69c',
    [x, 0, z],
  );
}

const UP = new THREE.Vector3(0, 1, 0);
function armParts(actor, s, species, batch) {
  const upper = new THREE.Group(),
    lower = new THREE.Group(),
    hand = new THREE.Group();
  actor.add(upper, lower, hand);
  const frog = species === 'frog',
    skin = frog ? '#b5a579' : '#e2d0b8';
  // Segment length is normalized. Two-bone IK attaches both palms to the
  // moving shaft and lets the frog withdraw its hands before impact.
  batch(upper, (b) => {
    inkVolume(
      b,
      [
        [0, 0, 0, 0.055, 0.055],
        [0, 0.16, 0, 0.097, 0.088],
        [0, 0.59, 0, 0.088, 0.077],
        [0, 0.83, 0, 0.072, 0.065],
        [0, 0.981, 0, 0.055, 0.055],
        [0, 1.04, 0, 0.008, 0.009],
      ],
      skin,
      20,
      species,
    );
    inkVolume(
      b,
      [
        [0, -0.04, 0, 0.045, 0.05],
        [0, 0.04, 0, 0.111, 0.112],
        [0, 0.21, 0, 0.117, 0.108],
        [0, 0.39, 0, 0.132, 0.124],
        [0, 0.42, 0, 0.118, 0.11],
      ],
      frog ? '#b4ae96' : '#849094',
    );
  });
  batch(lower, (b) =>
    inkVolume(
      b,
      [
        [0, -0.05, 0, 0.044, 0.045],
        [0, 0.04, 0, 0.061, 0.058],
        [0, 0.32, 0, 0.07, 0.055],
        [0, 0.74, 0, 0.045, 0.041],
        [0, 1.035, 0, 0.037, 0.032],
      ],
      skin,
      20,
      species,
    ),
  );
  batch(hand, (b) => {
    b.ball(0, 0, 0.009, 0.055, 0.056, 0.051, skin);
    for (let f = -1; f <= 1; f++) {
      const x = f * (frog ? 0.034 : 0.021);
      inkVolume(
        b,
        [
          [x, -0.005, 0.015, 0.022, 0.019],
          [x * 1.35, -0.012, 0.048, 0.021, 0.017],
          [x * 1.58, frog ? -0.023 : -0.042, frog ? 0.104 : 0.057, 0.015, 0.013],
          [x * 1.59, -0.045, frog ? 0.121 : 0.041, 0.006, 0.008],
        ],
        skin,
        12,
      );
    }
  });
  const sh = new THREE.Vector3(s * (frog ? 0.232 : 0.185), frog ? 1.045 : 1.214, 0.048);
  const delta = new THREE.Vector3(),
    pole = new THREE.Vector3(),
    elbow = new THREE.Vector3(),
    direction = new THREE.Vector3();
  function link(node, a, b) {
    direction.subVectors(b, a);
    node.position.copy(a);
    node.scale.y = direction.length();
    node.quaternion.setFromUnitVectors(UP, direction.normalize());
  }
  return function solve(target, dip) {
    sh.y = (frog ? 1.045 : 1.214) + dip;
    delta.subVectors(target, sh);
    const reach = delta.length();
    delta.normalize();
    pole
      .set(s, -0.76, -0.45)
      .addScaledVector(delta, -(s * delta.x - 0.76 * delta.y - 0.45 * delta.z))
      .normalize();
    const length = frog ? 0.36 : 0.315,
      flex = Math.sqrt(Math.max(0.004, length * length - (reach / 2) ** 2));
    elbow
      .copy(sh)
      .addScaledVector(delta, reach * 0.5)
      .addScaledVector(pole, flex);
    link(upper, sh, elbow);
    link(lower, elbow, target);
    hand.position.copy(target);
    hand.rotation.x = frog ? 0.18 : 0.8;
  };
}

export function buildPounding(parent, { animal, batch, group, shadow }) {
  const root = group(parent, '初搗きの臼');
  strawMat(root);
  // The outer profile folds back into the carved bowl, with cut end grain on the lip.
  carvedWood(
    root,
    [
      [0.012, 0.015],
      [0.42, 0.015],
      [0.473, 0.048],
      [0.455, 0.13],
      [0.348, 0.255],
      [0.331, 0.34],
      [0.372, 0.42],
      [0.473, 0.56],
      [0.504, 0.681],
      [0.494, 0.739],
      [0.465, 0.757],
      [0.404, 0.754],
      [0.377, 0.731],
      [0.353, 0.663],
      [0.31, 0.59],
      [0.246, 0.519],
      [0.15, 0.47],
      [0.003, 0.458],
    ],
    '欅の臼',
  );
  batch(root, (b) => {
    mortar(b);
    bucket(b);
  });
  shadow(root, 1.25, 1.25);
  const rabbit = group(root, '杵を振るうさぎ', POUNDING_CREW[0].u, 0, POUNDING_CREW[0].v);
  const frog = group(root, '手返しの蛙', POUNDING_CREW[1].u, 0, POUNDING_CREW[1].v);
  rabbit.rotation.y = Math.atan2(0.89, 0.63);
  frog.rotation.y = Math.atan2(-0.75, -0.44);
  animal(rabbit, 'rabbit', 'pounder');
  animal(frog, 'frog', 'turner');
  shadow(rabbit, 0.95, 0.79);
  shadow(frog, 1.05, 0.9);
  const mallet = group(rabbit, '横杵');
  batch(mallet, kine);
  carvedWood(
    mallet,
    [
      [0.002, -0.275],
      [0.084, -0.271],
      [0.113, -0.244],
      [0.119, -0.167],
      [0.105, 0.181],
      [0.095, 0.218],
      [0.06, 0.233],
      [0.002, 0.233],
    ],
    '杵頭',
    0.81,
  );
  const dough = group(root, '搗きたての餅', 0, 0.639, 0);
  batch(dough, (b) =>
    turned(
      b,
      [
        [0.004, -0.071],
        [0.156, -0.06],
        [0.274, -0.026],
        [0.318, 0.008],
        [0.311, 0.073],
        [0.245, 0.117],
        [0.132, 0.148],
        [0.003, 0.155],
      ],
      '#f1e2c5',
    ),
  );
  const workers = [rabbit, frog].map((actor, i) => ({
    head: actor.getObjectByName('head'),
    torso: actor.getObjectByName('torso'),
    left: armParts(actor, -1, i ? 'frog' : 'rabbit', batch),
    right: armParts(actor, 1, i ? 'frog' : 'rabbit', batch),
  }));
  const target = new THREE.Vector3();
  function update(time) {
    const beat = (time / POUNDING.period) % 1;
    const lift = smooth(0.05, 0.43, beat) * (1 - smooth(0.73, POUNDING.strike, beat));
    const turn = smooth(0.22, 0.48, beat) * (1 - smooth(0.625, 0.765, beat));
    const impact = Math.max(0, 1 - Math.abs(beat - POUNDING.strike) / 0.077);
    const recovery = Math.max(0, 1 - Math.abs(beat - 0.961) / 0.037);
    mallet.position.set(0, 1.156 + 0.154 * lift - 0.034 * impact, 0.292 + 0.174 * lift);
    mallet.rotation.x = 0.19 - 1.68 * lift;
    mallet.updateMatrix();
    const [pounder, turner] = workers;
    const rdip = -0.08 * impact + 0.024 * lift,
      fdip = -0.092 * turn;
    pounder.torso.position.y = rdip;
    pounder.head.rotation.x = 0.14 * impact - 0.17 * lift;
    turner.torso.position.y = fdip;
    turner.head.rotation.x = 0.2 * turn - 0.07;
    for (const s of [-1, 1]) {
      const hand = s < 0 ? 'left' : 'right';
      target.set(s * 0.028, -0.009, s < 0 ? 0.098 : 0.347).applyMatrix4(mallet.matrix);
      pounder[hand](target, rdip);
      target.set(
        s * (0.178 - 0.08 * turn),
        0.914 - 0.188 * turn + 0.025 * s * turn,
        0.275 + (0.442 + s * 0.045) * turn,
      );
      turner[hand](target, fdip);
    }
    dough.scale.set(
      1 + 0.17 * impact - 0.08 * turn,
      1 - 0.58 * impact + 0.36 * turn + 0.16 * recovery,
      1 + 0.15 * impact,
    );
    dough.rotation.z = 0.21 * turn;
    dough.position.x = 0.046 * turn;
  }
  update(0);
  return { root, update };
}
