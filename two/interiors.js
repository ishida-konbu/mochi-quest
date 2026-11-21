import * as THREE from './vendor/three.module.min.js';
import { roomPlan } from './architecture.js';

function roomMaterials() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d4c899';
  ctx.fillRect(0, 0, 256, 128);
  // Long igusa rushes interlace with a darker weft. Mipmaps soften them at a distance.
  for (let row = 0; row < 64; row++) {
    const tone = 0.08 + 0.06 * Math.sin(row * 7.3);
    ctx.fillStyle = 'rgba(82,81,49,' + tone + ')';
    ctx.fillRect(0, row * 2, 256, 1);
    for (let col = 0; col < 16; col++) {
      ctx.fillStyle = (row + col) % 2 ? '#adab7d' : '#b6b389';
      ctx.fillRect(col * 16 + (row % 2), row * 2, 1, 2);
    }
  }
  const weave = new THREE.CanvasTexture(canvas);
  weave.colorSpace = THREE.SRGBColorSpace;
  weave.anisotropy = 4;
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(2, 3);
  const loader = new THREE.TextureLoader();
  const print = (name, aspect) => {
    const map = loader.load(new URL('../assets/actors/' + name + '-wander.webp', import.meta.url).href);
    map.colorSpace = THREE.SRGBColorSpace;
    return { aspect, material: new THREE.MeshLambertMaterial({ map, alphaTest: 0.15 }) };
  };
  return {
    tatami: new THREE.MeshLambertMaterial({ map: weave }),
    paper: new THREE.MeshLambertMaterial({ emissive: '#b9a687', emissiveIntensity: 0.48 }),
    hare: print('rabbit', 379 / 560),
    frog: print('frog', 461 / 560),
  };
}

export function furnishRoom(p, b, index, part, local) {
  const wood = '#69513b',
    deep = '#554b3e',
    plaster = '#ded0a3';
  const plan = roomPlan(b);
  const { width, depth, door, floor, ceiling } = plan;
  const art = (p.roomArt ??= roomMaterials());
  const innerHeight = ceiling - floor;
  // Timber-framed shell, with a genuinely open central bay.
  for (const panel of plan.walls) {
    part('box', panel.u, floor + innerHeight / 2, panel.v, panel.width, innerHeight, panel.depth, plaster);
    part(
      'box',
      panel.u,
      floor + 0.19,
      panel.v,
      panel.width + 0.025,
      0.38,
      panel.depth + 0.025,
      '#a08b70',
      p.boarding,
    );
  }
  for (const sign of [-1, 1]) {
    for (const u of [-width / 2, width / 2])
      part('box', u, floor + innerHeight / 2, (sign * depth) / 2, 0.21, innerHeight, 0.21, wood, p.wood);
    const u = (sign * door) / 2;
    part('box', u, floor + innerHeight / 2, depth * 0.5, 0.16, innerHeight, 0.24, wood, p.wood);
  }
  part('box', 0, ceiling - 0.07, depth / 2, width + 0.12, 0.22, 0.28, deep, p.wood);
  // Tatami seams turn around the central mat, leaving a clear path from the engawa.
  part('box', 0, floor - 0.038, 0, width, 0.078, depth, '#777958', p.deck);
  const mats = [
    [-0.25, -0.33, 0.49, 0.32],
    [0.25, -0.33, 0.49, 0.32],
    [-0.375, 0.17, 0.24, 0.65],
    [0.375, 0.17, 0.24, 0.65],
    [0, 0, 0.49, 0.32],
    [0, 0.335, 0.49, 0.32],
  ];
  for (const [u, v, wu, dv] of mats)
    part('box', u * width, floor - 0.009, v * depth, wu * width, 0.024, dv * depth, '#fff5d6', art.tatami);
  const back = -depth * 0.5 + 0.15;
  part('box', 0, floor + 0.13, back + 0.33, width * 0.54, 0.26, 0.72, '#9d7955', p.wood);
  // A hanging scroll in the tokonoma, a red seal and a single arranged branch.
  part('box', 0, floor + innerHeight * 0.54, back, 0.92, innerHeight * 0.66, 0.052, '#5e7063');
  part('box', 0, floor + innerHeight * 0.54, back + 0.03, 0.72, innerHeight * 0.47, 0.033, '#f2e3c4');
  const paintedHeight = Math.min(1.08, innerHeight * 0.44);
  const painting = index % 2 ? art.hare : art.frog;
  part(
    'plane',
    0,
    floor + innerHeight * 0.54,
    back + 0.062,
    paintedHeight * painting.aspect,
    paintedHeight,
    1,
    '#eedfc3',
    painting.material,
  );
  part('box', 0.24, floor + innerHeight * 0.36, back + 0.065, 0.07, 0.07, 0.02, '#aa503b');
  for (const end of [-1, 1])
    part('box', 0, floor + innerHeight * (0.54 + end * 0.33), back + 0.02, 1.06, 0.048, 0.09, wood, p.wood);

  // Backlit shoji and their kumiko lattice bring the daylight down to tatami height.
  const screenHeight = innerHeight * 0.51;
  const screenWidth = depth * 0.53;
  const mid = floor + innerHeight * 0.55;
  for (const side of [-1, 1]) {
    const sideX = side * (width * 0.5 - 0.135);
    part('box', sideX, mid, 0, 0.035, screenHeight, screenWidth, '#fff2cf', art.paper);
    const trim = sideX - side * 0.028;
    for (let j = -3; j <= 3; j++)
      part(
        'box',
        trim,
        mid,
        (j * screenWidth) / 6,
        0.045,
        screenHeight + 0.095,
        j % 3 ? 0.029 : 0.065,
        wood,
        p.wood,
      );
    for (let j = -2; j <= 2; j++)
      part(
        'box',
        trim,
        mid + (j * screenHeight) / 4,
        0,
        0.05,
        j % 2 ? 0.029 : 0.055,
        screenWidth + 0.04,
        wood,
        p.wood,
      );
    part('box', 0, mid + screenHeight * 0.57, side * (depth * 0.5 - 0.12), width, 0.105, 0.13, wood, p.wood);
  }
  part('box', 0, ceiling - 0.015, 0, width - 0.12, 0.08, depth - 0.12, '#bb9d7c', p.deck);
  for (let j = -1; j <= 1; j++)
    part('box', 0, ceiling - 0.1, j * depth * 0.32, width, 0.16, 0.17, deep, p.wood);
  const vaseX = -width * 0.19;
  part('ball', vaseX, floor + 0.43, back + 0.34, 0.18, 0.23, 0.17, '#637971');
  part('round', vaseX, floor + 0.62, back + 0.34, 0.099, 0.13, 0.099, '#55665e');
  for (let j = 0; j < 3; j++) {
    const end = local(vaseX + (j - 1) * 0.18, floor + 0.96 + 0.12 * (j % 2), back + 0.34 + j * 0.033);
    p.link(local(vaseX, floor + 0.64, back + 0.34), end, 0.017, '#746045');
    p.part('ball', end.x, end.y, end.z, 0.076, 0.065, 0.07, b.snow ? '#b04439' : '#d59c88');
  }
}
