import { MARKET_STOCK_TOP, MARKET_STOCK_Z, marketCookCanopy } from './living-layout.js';
import { dressLivingSites, shareBeans } from './living-site-art.js';
import { createSteam, steamSource } from './steam.js';
import * as THREE from './vendor/three.module.min.js';
import { visitMooredFittings } from './skiff-travel.js';
import { BOATS, HULL_HEIGHT, HULL_DRAFT, halfBreadth, sheerHeight } from './shoreline.js';
import {
  BUILDINGS,
  MARKET_STALLS, SHRINE_BAMBOO,
  REGIONS,
  TREES,
  WATER_Y,
  coastX,
  nearRoad,
  seeded,
  terrainHeight,
} from './terrain.js';

const { sin, cos, PI } = Math;
const TAU = 2 * PI;
const timber = '#795d41',
  straw = '#b89a5d',
  rope = '#b39769',
  linen = '#eee2c1';
const byId = (id) => REGIONS.find((r) => r.id === id);
const v = (x, y, z) => new THREE.Vector3(x, y, z);

// Local Z points toward a visitor. Each upright has its own footing on the slope.
function fixture(p, x, z, yaw = 0, y = terrainHeight(x, z)) {
  const co = cos(yaw),
    si = sin(yaw);
  const at = (a, h, b) => v(x + a * co + b * si, y + h, z - a * si + b * co);
  const part = (
    shape,
    a,
    h,
    b,
    sx,
    sy,
    sz,
    tint,
    angle = 0,
    pitch = 0,
    roll = 0,
    mat = p.solid,
    shadow = true
  ) => {
    const q = at(a, h, b);
    p.part(shape, q.x, q.y, q.z, sx, sy, sz, tint, yaw + angle, pitch, roll, mat, shadow, true);
  };
  const line = (a, b, r, tint, mat = p.solid, solid = false, shadow = true) =>
    p.link(at(...a), at(...b), r, tint, solid, shadow, true, mat);
  const post = (a, b, top, r, tint = timber, mat = p.wood, square = false) => {
    const q = at(a, 0, b);
    p.link(v(q.x, terrainHeight(q.x, q.z) - 0.16, q.z), at(a, top, b), r, tint, square, true, true, mat);
  };
  return { part, line, post, at, painter:p };
}

function tex(w, h, paint, options = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'), w, h);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 3;
  return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide, ...options });
}
function paintedGrid(nx, ny, plot) {
  const positions = [],
    uv = [],
    index = [];
  for (let i = 0; i <= ny; i++)
    for (let j = 0; j <= nx; j++) {
      const u = j / nx,
        v = i / ny;
      positions.push(...plot(u, v));
      uv.push(u, 1 - v);
      if (i < ny && j < nx) {
        const a = i * (nx + 1) + j;
        index.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}
function polygonGraphic(coords) {
  const outline = new THREE.Shape();
  coords.forEach(([x, y], i) => (i ? outline.lineTo(x, y) : outline.moveTo(x, y)));
  outline.closePath();
  const g = new THREE.ShapeGeometry(outline);
  const pos = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + 0.5, pos.getY(i) + 0.5);
  return g;
}
function createArt(p) {
  const rng = seeded(71361);
  p.shapes.awning = paintedGrid(14, 5, (u, v) => [
    u - 0.5,
    0.58 - 0.72 * v - 0.085 * sin(u * PI) - 0.07 * sin(v * PI) + 0.021 * cos(u * 8 * PI),
    v - 0.5,
  ]);
  p.shapes.dyeCrest = new THREE.RingGeometry(0.35, 0.44, 24);
  p.shapes.basket = new THREE.LatheGeometry(
    [
      [0.26, 0.0],
      [0.32, 0.035],
      [0.5, 0.49],
      [0.508, 0.53],
      [0.46, 0.54],
      [0.435, 0.48],
      [0.28, 0.08],
    ].map((a) => new THREE.Vector2(...a)),
    16
  );
  p.shapes.jar = new THREE.LatheGeometry(
    [
      [0.24, 0],
      [0.35, 0.04],
      [0.48, 0.22],
      [0.484, 0.59],
      [0.33, 0.79],
      [0.19, 0.88],
      [0.185, 0.95],
      [0.24, 0.98],
      [0.23, 1],
      [0.15, 1],
    ].map((a) => new THREE.Vector2(...a)),
    17
  );
  p.shapes.ema = polygonGraphic([
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.17],
    [0, 0.5],
    [-0.5, 0.17],
  ]);
  p.shapes.shide = polygonGraphic([
    [-0.25, 0.5],
    [0.2, 0.5],
    [0.2, 0.17],
    [0.4, 0.17],
    [0.4, -0.12],
    [0.5, -0.12],
    [0.5, -0.5],
    [0.04, -0.5],
    [0.04, -0.27],
    [-0.15, -0.27],
    [-0.15, 0.04],
    [-0.25, 0.04],
  ]);
  p.shapes.net = paintedGrid(11, 7, (u, v) => [
    u - 0.5,
    0.45 - v + 0.07 * (2 * u - 1) ** 2 - 0.1 * sin(u * PI) * (1 - v),
    0.06 * sin(v * PI) + 0.06 * sin(u * 2 * PI + v * 2),
  ]);
  const awning = tex(256, 192, (c, w, h) => {
    c.fillStyle = '#f0e9d9';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,240,.34)';
    for (let j = 0; j < 4; j++) c.fillRect(j * 64 + 3, 0, 3, h);
    c.fillStyle = 'rgba(101,82,63,.17)';
    for (let j = 0; j < 4; j++) c.fillRect(j * 64 + 2, 0, 1, h);
    c.strokeStyle = 'rgba(246,239,217,.75)';
    c.lineWidth = 2;
    c.strokeRect(4, 4, w - 8, h - 8);
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = i % 3 ? 'rgba(255,254,239,.18)' : 'rgba(115,92,69,.10)';
      c.fillRect(rng() * w, rng() * h, 1 + rng() * 4, 0.8);
    }
  });
  const wicker = tex(192, 96, (c, w, h) => {
    c.fillStyle = '#a78a61';
    c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) {
      c.fillStyle = '#7d674c';
      c.fillRect(0, y, w, 1.2);
      for (let x = (y % 12 ? 6 : 0) - 12; x < w; x += 12) {
        c.fillStyle = y % 12 ? '#c4a67b' : '#d0b589';
        c.fillRect(x + 1, y + 1.6, 9, 2.1);
        c.fillStyle = '#b39569';
        c.fillRect(x + 3, y + 4, 7, 1.3);
      }
    }
    c.fillStyle = '#d9bf92';
    c.fillRect(0, 2, w, 4);
    c.fillRect(0, h - 6, w, 3);
  });
  const ema = tex(196, 162, (c, w, h) => {
    c.fillStyle = '#e4c58d';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(143,104,62,.19)';
    c.lineWidth = 1;
    for (let i = 0; i < 28; i++) {
      let y = rng() * h;
      c.beginPath();
      c.moveTo(0, y);
      c.bezierCurveTo(30, y - 4, 108, y + 6, w, y - 1);
      c.stroke();
    }
    c.fillStyle = '#965346';
    c.beginPath();
    c.arc(52, 86, 18, 0, TAU);
    c.fill();
    // Brush drawing of a running pony above a pair of waves.
    c.strokeStyle = '#68543d';
    c.lineCap = c.lineJoin = 'round';
    c.lineWidth = 4.5;
    c.beginPath();
    c.moveTo(39, 105);
    c.quadraticCurveTo(50, 88, 75, 101);
    c.quadraticCurveTo(94, 106, 103, 84);
    c.lineTo(111, 77);
    c.lineTo(115, 85);
    c.lineTo(129, 92);
    c.lineTo(125, 97);
    c.lineTo(114, 95);
    c.quadraticCurveTo(108, 112, 88, 117);
    c.lineTo(78, 129);
    c.lineTo(66, 130);
    c.moveTo(49, 105);
    c.lineTo(38, 120);
    c.lineTo(25, 122);
    c.moveTo(44, 101);
    c.quadraticCurveTo(30, 91, 23, 101);
    c.stroke();
    c.strokeStyle = '#897c61';
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(18, 138 + i * 4);
      c.quadraticCurveTo(60, adapt(i), 110, 142 + i * 3);
      c.stroke();
    }
    function adapt(i) {
      return 132 + i * 4;
    }
    c.fillStyle = '#73553d';
    c.textAlign = 'center';
    c.font = 'bold 24px "Hiragino Mincho ProN",serif';
    c.fillText('祈', 153, 105);
    c.fillStyle = '#a85e45';
    c.fillRect(151, 114, 10, 11);
    c.fillStyle = '#8c6948';
    c.beginPath();
    c.arc(w / 2, 24, 3, 0, TAU);
    c.fill();
  });
  const bamboo = tex(72, 230, (c, w, h) => {
    const grad = c.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#819161');
    grad.addColorStop(0.35, '#d5d5a0');
    grad.addColorStop(1, '#98a26b');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    for (let n = 0; n < 9; n++) {
      const y = (n * h) / 9;
      c.fillStyle = '#879062';
      c.fillRect(0, y, w, 2.2);
      c.fillStyle = '#d7d0a4';
      c.fillRect(0, y + 2, w, 1.4);
    }
    for (let i = 0; i < 90; i++) {
      c.fillStyle = 'rgba(79,85,50,.10)';
      c.fillRect(rng() * w, rng() * h, 0.6, 8 + rng() * 19);
    }
  });
  const net = tex(
    384,
    178,
    (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.strokeStyle = '#645d4b';
      c.lineWidth = 2;
      c.lineCap = 'round';
      for (let k = -180; k < w + 180; k += 15) {
        for (const s of [-1, 1]) {
          c.beginPath();
          c.moveTo(k, 0);
          c.bezierCurveTo(k + s * 40, 56, k + s * 82, 119, k + s * 122, h);
          c.stroke();
        }
      }
      c.strokeStyle = '#b49464';
      c.lineWidth = 6;
      c.strokeRect(1, 1, w - 2, h - 2);
    },
    { alphaTest: 0.3 }
  );
  const rice = tex(
    160,
    220,
    (c, w, h) => {
      c.lineCap = 'round';
      for (let n = 0; n < 94; n++) {
        const a = 74 + (rng() - 0.5) * 14,
          end = 80 + (rng() - 0.5) * 118,
          len = 122 + rng() * 91;
        c.lineWidth = 1 + rng() * 1.3;
        c.strokeStyle = ['#a17a40', '#c3a156', '#d9bb69', '#b5944c'][n % 4];
        c.beginPath();
        c.moveTo(a, 6 + rng() * 12);
        c.bezierCurveTo(a - 9, 48, end + 7, 110, end, len);
        c.stroke();
        for (let j = 0; j < 8; j++) {
          const y = len - 47 + j * 5,
            xx = end + (j % 2 ? 3 : -3) * (1 - j / 10);
          c.fillStyle = j % 3 ? '#cfb06b' : '#9d8043';
          c.beginPath();
          c.ellipse(xx, y, 1.7, 3.8, j % 2 ? 0.55 : -0.55, 0, TAU);
          c.fill();
        }
      }
      c.strokeStyle = '#9c7f46';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(66, 28);
      c.lineTo(90, 32);
      c.stroke();
    },
    { alphaTest: 0.3 }
  );
  const signs = {};
  function sign(label) {
    if (signs[label]) return signs[label];
    return (signs[label] = tex(112, 172, (c, w, h) => {
      c.fillStyle = '#efe0bf';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#9b805a';
      c.lineWidth = 2;
      c.strokeRect(5, 5, w - 10, h - 10);
      c.fillStyle = '#534634';
      c.font = 'bold 72px "Hiragino Mincho ProN","Yu Mincho",serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      [...label].forEach((ch, i, arr) => c.fillText(ch, w / 2, h / 2 + (i - (arr.length - 1) / 2) * 63));
      c.fillStyle = '#a14c3f';
      c.fillRect(w * 0.75, h * 0.82, 8, 9);
    }));
  }
  return { awning, wicker, ema, bamboo, net, rice, sign };
}

function woven(f, art, x, y, z, size) {
  f.part('basket', x, y, z, size, size * 0.66, size, '#fff5db', 0, 0, 0, art.wicker);
}
function pottery(f, x, y, z, s, tint) {
  f.part('jar', x, y, z, s, s * 1.4, s, tint);
  f.part('round', x, y + s * 1.404, z, s * 0.165, 0.012, s * 0.165, '#665544');
  f.part('round', x, y + s * 0.17, z, s * 0.43, 0.019, s * 0.43, '#678584');
}
function boxLid(f, x, y, z, w, d) {
  f.part('box', x, y, z, w, 0.061, d, '#96754e', 0, 0, 0);
  for (const a of [-1, 1]) {
    f.part('box', x + a * w * 0.47, y + 0.08, z, 0.038, 0.13, d, '#b0986f');
    f.part('box', x, y + 0.08, z + a * d * 0.47, w, 0.13, 0.038, '#b0986f');
  }
}
function marketGoods(f, a, id, r) {
  const y = 0.947;
  if (id === 0) {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.86;
      woven(f, a, x, y, 0.42, 0.67);
      for (let k = 0; k < 7; k++) {
        const ang = k * 2.4,
          rad = 0.19 * Math.sqrt(k / 7),
          xx = x + sin(ang) * rad,
          zz = 0.42 + cos(ang) * rad;
        if (i === 0) {
          f.part('ball', xx, y + 0.31, zz, 0.067, 0.161, 0.066, '#e9e3c4', 0, 0.26, cos(ang) * 0.49);
          f.part('leaf', xx, y + 0.38, zz, 0.16, 0.236, 0.21, '#73935c', ang, 0, 0.2);
        } else
          f.part(
            'ball',
            xx,
            y + 0.29 + (k % 3) * 0.041,
            zz,
            0.1,
            0.083,
            0.105,
            i === 1 ? '#d99056' : '#9eb489',
            ang
          );
      }
    }
  } else if (id === 1) {
    for (let k = 0; k < 8; k++)
      pottery(
        f,
        -1.02 + (k % 4) * 0.31,
        y,
        0.33 + Math.floor(k / 4) * 0.26,
        0.21 + (k % 3) * 0.035,
        k % 3 ? '#e8dab9' : '#86947a'
      );
    f.part('round', 0.9, y + 0.3, 0.43, 0.29, 0.6, 0.29, '#d1bb90');
    for (let k = 0; k < 3; k++)
      f.part('round', 0.9, y + 0.09 + 0.21 * k, 0.43, 0.302, 0.039, 0.302, '#826c47');
    f.part('plane', 0.9, y + 0.32, 0.73, 0.21, 0.28, 1, '#fff', 0, 0, 0, a.sign('酒'));
  } else if (id === 2) {
    for (let n = 0; n < 5; n++) {
      const x = -1.08 + n * 0.5;
      for (let i = 0; i < (n % 3) + 2; i++) {
        const yy = y + 0.043 + i * 0.065;
        f.part('box', x, yy, 0.46, 0.43, 0.055, 0.49, '#e8dcbd', n % 2 ? 0.12 : -0.09);
        f.part(
          'box',
          x,
          yy + 0.034,
          0.46,
          0.448,
          0.014,
          0.5,
          ['#707f82', '#a8685b', '#879268'][n % 3],
          n % 2 ? 0.12 : -0.09
        );
      }
      f.part('box', x - 0.09, y + 0.112 + ((n % 3) + 1) * 0.065, 0.43, 0.06, 0.01, 0.2, '#dccca6');
    }
  } else if (id === 3) {
    for (let i = 0; i < 4; i++) {
      const x = -1.04 + i * 0.44;
      f.part('basket', x, y, 0.47, 0.4, 0.4, 0.4, '#dcd9bc');
      f.part('round', x, y + 0.198, 0.47, 0.186, 0.023, 0.186, '#a8834f');
      f.part('ball', x + 0.04, y + 0.216, 0.5, 0.061, 0.014, 0.046, '#e4c797');
      f.line([x - 0.18, y + 0.23, 0.37], [x + 0.17, y + 0.24, 0.54], 0.008, '#84654b');
    }
    pottery(f, 0.92, y, 0.29, 0.33, '#7d8475');
  } else if (id === 4) {
    // Stock hangs from a shelf behind the rear uprights, leaving daylight
    // between the display trays and the cook's freestanding, lower bench.
    const {postX}=marketCookCanopy,stock=MARKET_STOCK_Z,shelf=MARKET_STOCK_TOP;
    f.part('box',0,shelf-.092,-.79,2*postX,.14,.08,'#836b4d',0,0,0,f.painter.wood);
    for(const u of [-1.15,0,1.15]){
      f.part('box',u,shelf-.205,-.79,.082,.31,.072,'#897351',0,0,0,f.painter.wood);
      f.line([u,shelf-.34,-.79],[u,shelf-.07,stock-.24],.043,'#927a58',f.painter.wood,true);
    }
    f.part('box',0,shelf-.034,stock,2.66,.068,.64,'#9c8b70',0,0,0,f.painter.wood);
    f.part('box',0,shelf+.023,stock-.315,2.66,.046,.028,'#81715a',0,0,0,f.painter.wood);
    for (let j = 0; j < 3; j++) {
      const x = -0.91 + j * 0.86;
      boxLid(f, x, shelf + .057, stock, 0.67, 0.53);
      for (let i = 0; i < 4; i++) {
        const xx = x - 0.2 + i * 0.124;
        f.line([xx, shelf + .112, stock-.27], [xx, shelf + .127, stock+.27], 0.009, '#ac915a');
        for (let k = 0; k < 3; k++)
          f.part(
            'ball',
            xx,
            shelf + .167,
            stock-.11 + k * .105,
            0.069,
            0.066,
            0.072,
            ['#d4a399', '#e4d8b3', '#a5b385'][k]
          );
      }
    }
  } else {
    shareBeans(f,a,f.painter);
    for (let i = 1; i < 3; i++) {
      const x = -0.9 + i * 0.45;
      f.part('ball', x, y + 0.15, 0.46, 0.21, 0.17, 0.21, '#b59a65', 0, 0, -0.16);
      f.part('round', x - 0.04, y + 0.3, 0.45, 0.077, 0.12, 0.063, '#9b8054');
    }
    pottery(f, 0.71, y, 0.43, 0.34, '#67786e');
    for (let i = 0; i < 3; i++)
      f.part('basket', 0.29 + i * 0.31, y, 0.76, 0.195, 0.22, 0.195, '#d8d4b2');
  }
}
const marketTypes = [
  ['菜', '#687c77'],
  ['酒', '#b47758'],
  ['本', '#697b86'],
  ['麺', '#a85544'],
  ['団子', '#9b9e72'],
  ['茶', '#8b7981'],
];
function market(p, a) {
  MARKET_STALLS.forEach(([x, z, yaw], id) => {
    const f = fixture(p, x, z, yaw),
      [name, tint] = marketTypes[id],
      rng = seeded(871 + id);
    const cook=id===4, lift=cook?marketCookCanopy.lift:0, postX=cook?marketCookCanopy.postX:1.64;
    const canopy=cook?fixture(p,x,z,yaw,terrainHeight(x,z)+lift):f;
    const frontPost=cook?marketCookCanopy.frontPostZ:1.07, backPost=-.79;
    for (const u of [-postX, postX]){
      f.post(u,backPost,lift+3.28,.059,'#816649');
      // The dango stall's projecting arms carry the front beam over an
      // open cooking aisle. No upright crosses the cook's carrying hands.
      const head=cook?3.23+(frontPost+.83)*(2.48-3.23)/1.93:2.53;
      f.post(u,frontPost,lift+head,.059,'#816649');
      if(cook)canopy.line([u,head-.74,frontPost],[u,2.46,1.05],.056,timber,p.wood,true);
    }
    canopy.line([-postX-.08, 3.23, -0.82], [postX+.08, 3.23, -0.82], 0.06, timber, p.wood);
    canopy.line([-postX-.12, 2.48, 1.05], [postX+.12, 2.48, 1.05], 0.049, timber, p.wood);
    for (const u of [-postX, 0, postX]) canopy.line([u, 3.23, -0.83], [u, 2.48, 1.1], 0.038, '#9a8059', p.wood);
    canopy.part('awning', 0, 2.65, 0.12, cook?marketCookCanopy.width:3.83, 1.1, 2.24, tint, 0, 0, 0, a.awning);
    for (let i = 0; i < 4; i++) {
      const u = (i - 1.5) * 0.82;
      canopy.part('box', u, 2.3, 1.16, 0.788, 0.36, 0.037, tint, 0, -0.08, Math.sin(i + id) * 0.01, a.awning);
      canopy.part('box', u, 2.157, 1.18, 0.745, 0.021, 0.021, '#ddd5b5');
      if (i === 1 || i === 2) {
        canopy.part('dyeCrest', u, 2.32, 1.19, .28, .28, 1, linen, 0, -.08, 0, p.fine, false);
        for (let k=0;k<3;k++){
          const a=k*TAU/3;
          canopy.part('ball',u+.04*sin(a),2.32+.04*cos(a),1.194,.025,.034,.006,linen,0,0,-a,p.fine,false);
        }
      }
    }
    if(!cook){
      for(const u of [-1.23,1.23])f.post(u,.42,.89,.073,timber,p.wood,true);
      f.part('box',0,.88,.42,3.14,.12,.84,'#b4986d',0,0,0,p.wood);
      f.part('box',0,.68,.31,2.64,.07,.56,'#8c7450',0,0,0,p.wood);
      for(const u of [-1.1,-.3,.53,1.12])
        f.part('box',u,.946,.42,.008,.004,.8,'#8f7957');
    }
    canopy.line([postX-.03, 2.57, 0.96], [postX-.07, 2.09, 1.28], 0.014, rope);
    canopy.part('box', postX-.065, 1.89, 1.28, 0.36, 0.48, 0.045, '#be9b66');
    canopy.part('plane', postX-.065, 1.89, 1.307, 0.32, 0.45, 1, '#fff', 0, 0, 0, a.sign(name), false);
    marketGoods(f, a, id, rng);
    if (id % 2 === 1) {
      woven(f, a, -1.7, 0.06, -0.45, 0.67);
      for (let i = 0; i < 3; i++)
        f.part(
          'ball',
          -1.82 + i * 0.14,
          0.32,
          -0.45 + sin(i) * 0.11,
          0.13,
          0.15,
          0.13,
          id === 3 ? '#a78656' : '#a99b6b'
        );
    }
  });
}

function emaRack(p, a) {
  const f = fixture(p, -161.7, -90.6, 1.18);
  for (const x of [-1.53, 1.53]) f.post(x, 0, 2.24, 0.09, '#816447', p.wood, true);
  f.part('roof', 0, 2.08, 0, 3.68, 0.44, 0.88, '#7e8071', 0, 0, 0, p.roofs);
  f.part('box', 0, 2.08, 0, 3.34, 0.13, 0.48, timber, 0, 0, 0, p.wood);
  for (const y of [0.89, 1.48]) f.line([-1.5, y, -0.036], [1.5, y, -0.036], 0.038, '#856747', p.wood);
  for (let i = 0; i < 12; i++) {
    const x = -1.2 + (i % 6) * 0.47 + (i > 5 ? 0.035 : 0),
      y = 1.47 - Math.floor(i / 6) * 0.59;
    f.line([x - 0.036, y + 0.008, 0.012], [x, y - 0.109, 0.086], 0.01, '#b09a6d', p.solid, false, false);
    f.line([x + 0.036, y + 0.008, 0.012], [x, y - 0.109, 0.086], 0.01, '#b09a6d', p.solid, false, false);
    const roll = 0.07 * Math.sin(i * 2.82);
    f.part('ema', x, y - 0.264, 0.079, 0.424, 0.39, 1, '#fff1d1', 0, 0.03, roll, a.ema, false);
  }
  // A laid strand and three twisted tassels hang above the ema.
  const sag = (x) => 1.974 - 0.155 * (1 - (x / 1.5) ** 2);
  for (let i = 0; i < 16; i++) {
    const x = -1.49 + i * 0.186,
      next = x + 0.186;
    f.line([x, sag(x), 0.2], [next, sag(next), 0.2], 0.036, i % 2 ? '#b39a64' : '#c2aa72');
    if (i % 3 === 1) {
      f.part('shide', x, sag(x) - 0.18, 0.205, 0.135, 0.33, 1, '#f3ebd4', 0, 0, -0.09, p.fine, false);
    }
  }
}
function grove(p, a) {
  for(const tree of SHRINE_BAMBOO) {
    const {x,z,height,sx,sz,radius,tint,sprays}=tree;
    p.treeSource=tree;
    const ground=terrainHeight(x,z);
    p.link(v(x,ground-.1,z),v(x+sx,ground+height,z+sz),radius,tint,false,true,true,a.bamboo);
    for(const [k,spray] of sprays.entries()) {
      const y=ground+height*(.61+.14*k);
      const xx=x+sx*.76+sin(spray.angle)*.54, zz=z+sz*.76+cos(spray.angle)*.54;
      p.link(v(x+sx*.73,y-.13,z+sz*.73),v(xx,y+.28,zz),.022,'#859263',false,false,true);
      p.part('plane',xx,y+.4,zz,spray.width,spray.height,1,'#d0d6ab',spray.angle,.11,
        spray.tilt,p.sprays.bamboo,false,true);
    }
  }
  p.treeSource=null;
  // Pairs of low votive lanterns draw the eye up the rising approach.
  for (const [x, z] of [
    [-155.8, -74],
    [-147.7, -72.5],
    [-158.2, -89.4],
    [-149.6, -89],
    [-161.8, -107],
    [-155.1, -107.4],
  ]) {
    const f = fixture(p, x, z, 0.1),
      scale = 0.84;
    f.part('rock', 0, 0.075, 0, 0.43, 0.16, 0.39, '#858a73');
    f.post(0, 0, 1.02, 0.104, '#98724f', p.wood, true);
    f.part('box', 0, 0.92, 0, 0.51, 0.096, 0.49, '#6d6954');
    f.part('box', 0, 1.135, 0, 0.35, 0.36, 0.35, '#e1cda0');
    for (const u of [-0.19, 0.19])
      for (const s of [-0.19, 0.19]) f.part('box', u, 1.14, s, 0.052, 0.41, 0.052, '#6b6351');
    f.part('pyramid', 0, 1.47, 0, 0.49, 0.35, 0.49, '#707a68', PI / 4);
    f.part('ball', 0, 1.68, 0, 0.09, 0.12, 0.09, '#827e61');
  }
  emaRack(p, a);
}
// The mineral vent is a natural feature above the pass. Bathing and the
// changing bays take place at the surveyed pool farther up the hillside.
function passVent(p) {
  const vents=createSteam([steamSource('vent',140.2,terrainHeight(140.2,-118.3)+.27,-118.3,{
    height:4.7,width:.93,count:7,rx:.37,rz:.26,
  })],p.sway);
  for (let j = 0; j < 6; j++) {
    const a = (j * TAU) / 6,
      xx = 140.2 + cos(a) * 0.51,
      zz = -118.3 + sin(a) * 0.43;
    p.part(
      'rock',
      xx,
      terrainHeight(xx, zz) + 0.12,
      zz,
      0.39,
      0.29,
      0.32,
      '#a5a28c',
      a,
      0,
      0.1,
      p.solid,
      true,
      true
    );
  }
  p.scene.add(vents);
}
function sheaf(f, art, x, y, z, s, angle = 0) {
  for (const a of [angle, angle + PI * 0.45])
    f.part('plane', x, y, z, 0.63 * s, 0.97 * s, 1, '#fff1c8', a, 0.025, 0, art.rice, false);
}
function dryingRack(p, a, x, z, yaw, width) {
  const f = fixture(p, x, z, yaw),
    top = 1.75;
  for (const u of [-width * 0.46, width * 0.46]) {
    for (const dir of [-1, 1]) {
      const foot = f.at(u, 0, dir * 0.53),
        tip = f.at(u, top + 0.13, -dir * 0.05);
      p.link(
        v(foot.x, terrainHeight(foot.x, foot.z) - 0.12, foot.z),
        tip,
        0.058,
        '#927d54',
        false,
        true,
        true,
        p.wood
      );
    }
  }
  f.line([-width * 0.55, top, 0], [width * 0.55, top, 0], 0.06, '#a88a54', p.wood);
  const n = Math.floor(width / 0.35);
  for (let j = 0; j < n; j++) {
    const u = (j - (n - 1) / 2) * 0.35,
      s = 0.85 + 0.18 * sin(j * 2.4);
    sheaf(f, a, u, top - 0.43 * s, 0.08, s, -0.12 + sin(j) * 0.13);
    if (j % 3 === 0) sheaf(f, a, u, top - 0.36, -0.13, s * 0.82, PI + 0.18);
  }
}
function scarecrow(p, x, z, yaw) {
  const f = fixture(p, x, z, yaw);
  f.post(0, 0, 2.28, 0.056, '#937555', p.wood);
  f.line([-0.78, 1.53, 0], [0.76, 1.62, 0], 0.04, '#ae9265', p.wood);
  f.part('ball', 0, 1.25, 0, 0.269, 0.384, 0.155, '#758781', 0, 0, 0.09);
  f.part('box', -0.01, 1.05, 0.015, 0.41, 0.1, 0.32, '#ad955d', 0, 0, 0.12);
  for (const s of [-1, 1]) {
    f.line([s * 0.12, 1.52, 0], [s * 0.54, 1.47 + s * 0.09, 0], 0.147, '#7f8d83');
    f.part('box', s * 0.46, 1.49 + s * 0.08, 0.1, 0.14, 0.13, 0.027, '#aab1a0', 0, -0.06, 0.21);
  }
  f.part('ball', 0, 1.83, 0.025, 0.184, 0.202, 0.168, '#d7c7a5');
  for (const u of [-0.068, 0.068]) f.part('ball', u, 1.85, 0.176, 0.014, 0.016, 0.009, '#605745');
  f.part('box', 0, 1.782, 0.185, 0.075, 0.014, 0.012, '#8a7158', 0, 0, 0.035);
  f.part('round', 0, 1.98, 0.015, 0.362, 0.028, 0.357, '#bd9b5f', 0, 0, -0.09);
  f.part('pyramid', 0, 2.075, 0.01, 0.396, 0.208, 0.39, '#b99c63', PI / 4, 0, -0.1);
  f.part('box', 0.06, 1.65, 0.12, 0.12, 0.2, 0.035, '#ab6852', 0, 0.08, 0.26);
}
function field(p, x, z, width, depth, yaw, index) {
  const f = fixture(p, x, z, yaw),
    y = terrainHeight(x, z);
  const shape = 'field' + index;
  p.shapes[shape] = paintedGrid(8, 6, (u, v) => {
    const xx = (u - 0.5) * width,
      zz = (v - 0.5) * depth,
      pt = f.at(xx, 0, zz);
    return [xx, terrainHeight(pt.x, pt.z) - y + 0.058, zz];
  });
  f.part(shape, 0, 0, 0, 1, 1, 1, index % 2 ? '#9aab87' : '#aaa67a', 0, 0, 0, p.solid, false);
  const corners = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2],
    [-width / 2, depth / 2],
  ];
  for (let k = 0; k < 4; k++) {
    const [ax, az] = corners[k],
      [bx, bz] = corners[(k + 1) % 4];
    let prev = null;
    for (let j = 0; j <= 5; j++) {
      const q = f.at(ax + ((bx - ax) * j) / 5, 0, az + ((bz - az) * j) / 5);
      q.y = terrainHeight(q.x, q.z) + 0.075;
      if (prev) p.link(prev, q, 0.1, '#a99f72', true, false, true, p.solid);
      prev = q;
    }
  }
  for (let j = 0; j < 5; j++)
    for (let k = 0; k < 10; k++) {
      const a = ((k - 4.5) * width) / 10,
        b = ((j - 2) * depth) / 5,
        pt = f.at(a, 0, b);
      p.part(
        'leaf',
        pt.x,
        terrainHeight(pt.x, pt.z) + 0.062,
        pt.z,
        0.43 + 0.05 * cos(k),
        0.38 + 0.062 * sin(k + j),
        0.63,
        index % 2 ? '#869753' : '#a4a157',
        index * 0.35 + k * 0.54,
        0,
        0.06,
        p.stems,
        false,
        true
      );
    }
}
function terraces(p, a) {
  field(p, 166.9, 82.8, 10.6, 5.5, 0.05, 0);
  field(p, 175.9, 89.0, 9.4, 5.15, -0.065, 1);
  field(p, 175.4, 81.3, 5.2, 5.4, 0.05, 2);
  dryingRack(p, a, 146.5, 89.6, 0.17, 5.7);
  dryingRack(p, a, 164.2, 95.6, -0.26, 4.1);
  scarecrow(p, 162.5, 86.5, 0.16);
  scarecrow(p, 173.8, 94.4, -0.34);
}

function makeBoatShape() {
  const positions = [], indices = [], uv = [], colors = [], sections = 30;
  // Paired side planks, solid gunwales, inner lining and a continuous keel.
  // Each strake has its own UV strip and face normal across the hard chine.
  function profile(t) {
    const w=halfBreadth(t), rim=sheerHeight(t), k=.035+t*t*.15, chine=.285+Math.abs(t)*.1;
    return [[-w*.47,k],[-w*.87,chine],[-w,rim],[-w*.90,rim+.012],[-w*.80,chine+.025],[-w*.42,k+.059],
      [w*.42,k+.059],[w*.80,chine+.025],[w*.90,rim+.012],[w,rim],[w*.87,chine],[w*.47,k]];
  }
  const finish=['#8e7056','#a58968','#d9bb87','#bca17d','#b59a75','#b09972','#b59a75','#bca17d','#d9bb87','#a58968','#8e7056','#746556'];
  for(let j=0;j<finish.length;j++) {
    const base=positions.length/3;
    const tint=new THREE.Color(finish[j]);
    for(let i=0;i<=sections;i++){
      const t=i/sections*2-1, section=profile(t);
      for(let edge=0;edge<2;edge++){
        const [x,y]=section[(j+edge)%section.length];
        positions.push(x,y,t*.5);
        uv.push(.08+j*.083+edge*.138,i/sections*1.65);
        colors.push(tint.r,tint.g,tint.b);
      }
      if(i<sections){const a=base+2*i;indices.push(a,a+1,a+2,a+2,a+1,a+3);}
    }
  }
  for(const t of [-1,1]){
    const base=positions.length/3;
    for(const [x,y] of profile(t)){
      positions.push(x,y,t*.5); uv.push(x+.5,y); colors.push(.36,.24,.13);
    }
    for(let j=1;j<10;j++)indices.push(base,base+j,base+j+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices); geo.computeVertexNormals();
  return geo;
}
function boat(p, vessel) {
  const {x,z,yaw,width,length}=vessel;
  const f=fixture(p,x,z,yaw,WATER_Y-HULL_DRAFT);
  f.part('boatHull',0,0,0,width,HULL_HEIGHT,length,'#ffffff',0,0,0,p.hullWood,true);
  visitMooredFittings(f,p,vessel);
}
function netRack(p, a, x, z, yaw, width = 4.2) {
  const f = fixture(p, x, z, yaw),
    top = 2.54;
  for (const side of [-1, 1]) {
    f.post(side * width * 0.51, 0, top + 0.16 + side * 0.06, 0.066, '#968561', p.wood);
    f.line([side * width * 0.5, 0.61, -0.03], [side * width * 0.5 - 0.24, 0.18, -0.53], 0.04, '#9c8963');
  }
  f.line([-width * 0.52, top + 0.066, 0], [width * 0.52, top + 0.02, 0], 0.042, rope);
  f.part('net', 0, 1.65, 0.02, width, 1.74, 0.69, '#efe2bd', 0, 0, -0.018, a.net, false);
  for (let i = 0; i < 9; i++) {
    const xx = -width * 0.46 + i * width * 0.115;
    f.part(
      'ball',
      xx,
      2.52 - 0.1 * Math.cos(xx),
      0.05,
      0.079,
      0.056,
      0.06,
      i % 3 ? '#bd9562' : '#9f7155'
    );
    if (i % 2 === 0)
      f.part('rock', xx, 0.82 + 0.06 * Math.cos(xx), 0.074, 0.059, 0.076, 0.046, '#6f7566');
  }
}
function fishRack(p, a, x, z, yaw) {
  const f = fixture(p, x, z, yaw);
  for (const x of [-1.01, 1.01]) f.post(x, 0, 1.91, 0.049, '#9d895e');
  f.line([-1.1, 1.77, 0], [1.1, 1.77, 0], 0.039, '#9b8a64');
  for (let i = 0; i < 7; i++) {
    const xx = -0.85 + i * 0.283,
      yy = 1.56 - 0.08 * sin(i * 4);
    f.line([xx, 1.77, 0], [xx, yy - 0.04, 0.01], 0.008, rope);
    f.part(
      'ball',
      xx,
      yy - 0.21,
      0.013,
      0.07,
      0.19,
      0.033,
      i % 2 ? '#afae91' : '#c2b89a',
      0,
      0.04,
      sin(i * 2) * 0.11
    );
    f.part('pyramid', xx + 0.013, yy - 0.39, 0.024, 0.07, 0.11, 0.031, '#938b71', PI / 4, 0.0, 0.19);
    f.part('ball', xx + 0.016, yy - 0.087, 0.046, 0.012, 0.012, 0.008, '#665f4a');
  }
  woven(f, a, 0.71, 0.0, 0.3, 0.71);
  woven(f, a, 0.12, 0.0, 0.34, 0.56);
}
function coast(p, a) {
  netRack(p, a, -155.9, 95.5, -0.12, 3.8);
  fishRack(p, a, -165.8, 111.3, 0.53);
  netRack(p, a, -174.8, 107.4, 0.34, 4.6);
  for (const boat of BOATS.filter(v=>v.mooring)) {
    const {x,z,yaw,length,mooring:s}=boat;
    const bow=fixture(p,x,z,yaw,WATER_Y-HULL_DRAFT);
    const a=bow.at(0,sheerHeight(.83)*HULL_HEIGHT+.01,length*.415);
    const xx=coastX(z)+2.3, zz=z+s*.83;
    const b=v(xx,Math.max(WATER_Y,terrainHeight(xx,zz))+.87,zz);
    p.link(v(b.x, terrainHeight(b.x, b.z) - 0.3, b.z), b, 0.084, '#857252', false, true, true, p.wood);
    const mid = a.clone().lerp(b, 0.49);
    mid.y = Math.min(a.y, b.y) - 0.23;
    p.link(a, mid, 0.018, rope, false, false, true, p.solid);
    p.link(mid, b, 0.018, rope, false, false, true, p.solid);
  }
  // The rocky coast's little stopping place faces the moorings to the west.
  const f = fixture(p, -183.3, 109.6, 1.72);
  for (const [x, z, r] of [
    [-0.72, -0.24, 0.68],
    [0.05, 0.21, 0.58],
    [0.64, -0.18, 0.68],
  ]) {
    woven(f, a, x, 0.0, z, r);
    f.part('ball', x, 0.22, z, r * 0.38, 0.1, r * 0.34, '#73827b');
    for (let k = 0; k < 3; k++)
      f.part('ball', x - 0.1 + k * 0.09, 0.3, z + 0.07 * sin(k), 0.052, 0.048, 0.051, '#ad9769');
  }
}
export function dressPlaces(p) {
  const art = createArt(p);
  p.shapes.boatHull = makeBoatShape();
  p.shapes.ropeCoil = new THREE.TorusGeometry(1,.059,6,48).rotateX(Math.PI/2);
  p.hullWood = p.wood.clone();
  p.hullWood.onBeforeCompile = p.wood.onBeforeCompile;
  p.hullWood.vertexColors = true;
  market(p, art);
  grove(p, art);
  passVent(p);
  terraces(p, art);
  dressLivingSites(p,art,fixture);
  coast(p, art);
  for(const vessel of BOATS) boat(p,vessel);
}
