// Coordinates and dimensions are metres. Positive Z is south.
export const BOUND = 240,
  WATER_Y = 0.38;
export const REGIONS = [
  { id: 'river', name: '桜川の渡し', x: 0, z: 59 },
  { id: 'shrine', name: '竹隠れの社', x: -153, z: -85 },
  { id: 'market', name: '蔵町の市', x: 17, z: -64 },
  { id: 'spring', name: '湯けむり峠', x: 144, z: -107 },
  { id: 'terraces', name: '月見の棚田', x: 156, z: 105 },
  { id: 'coast', name: '海風の松原', x: -149, z: 111 },
];
export const regionAt = (x, z) => {
  let best = 0,
    d = Infinity;
  REGIONS.forEach((r, i) => {
    const v = (x - r.x) ** 2 + (z - r.z) ** 2;
    if (v < d) {
      d = v;
      best = i;
    }
  });
  return best;
};
const { sin, cos, exp, abs, min, max, hypot } = Math;
const sat = (t) => max(0, min(1, t));
const smooth = (a, b, x) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hill = (x, z, cx, cz, rx, rz) => exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
export const riverZ = (x) => 18 + 9 * sin(x / 51) + 3.3 * sin(x / 25);
export const riverHalfWidth = (x) => 8.6 + 1.9 * sin(x / 38 + 0.35) + 0.95 * sin(x / 14);
export const coastX = (z) => -250 + 64 * exp(-(((z - 112) / 75) ** 2)) + 5.5 * sin(z / 23);
function naturalHeight(x, z) {
  const d = abs(z - riverZ(x)) - riverHalfWidth(x);
  const basic =
    3.9 +
    1.08 * sin(x * 0.028 + z * 0.023) +
    0.6 * cos(z * 0.049 - x * 0.026) +
    30 * hill(x, z, -142, -124, 60, 64) +
    13 * hill(x, z, -32, -134, 44, 51) +
    30 * hill(x, z, 162, -145, 70, 71) +
    18 * hill(x, z, 171, 148, 74, 56) +
    19 * hill(x, z, -71, 200, 64, 46) +
    12 * hill(x, z, 221, 3, 41, 47) +
    8 * hill(x, z, -208, -48, 47, 90) +
    6 * hill(x, z, -124, 159, 47, 59);
  const nearRiver = min(basic, 1.28 + max(0, d) * 0.11 + max(0, d) ** 2 * 0.0009);
  const land = -1.57 + (nearRiver + 1.57) * smooth(-3.5, 6.6, d);
  const shore = x - coastX(z);
  return -1.8 + (land + 1.8) * smooth(-3.3, 11, shore);
}
// This stone bathing pool was cut into the hillside on a level terrace.
const bathShelf = { x: 143, z: 96, height: naturalHeight(143, 96) };
export function terrainHeight(x, z) {
  const dx = x - bathShelf.x,
    dz = z - bathShelf.z;
  if (abs(dx) > 8.5 || abs(dz) > 8.5) return naturalHeight(x, z);
  const distance = hypot(dx, dz);
  if (distance <= 5) return bathShelf.height;
  const terrain = naturalHeight(x, z);
  return bathShelf.height + (terrain - bathShelf.height) * smooth(5, 8.5, distance);
}
export const BRIDGES = [-137, 0, 134].map((x) => ({
  x,
  z: riverZ(x),
  length: (riverHalfWidth(x) + 9) * 2,
  halfWidth: x === 0 ? 3.45 : 2.6,
}));
export function bridgeHeight(bridge, z) {
  const t = sat((z - bridge.z) / bridge.length + 0.5);
  const { x, length } = bridge,
    cz = bridge.z;
  return (
    terrainHeight(x, cz - length / 2) * (1 - t) +
    terrainHeight(x, cz + length / 2) * t +
    0.12 +
    (x === 0 ? 2.7 : 1.7) * sin(Math.PI * t)
  );
}
export function bridgeAt(x, z) {
  return BRIDGES.find((b) => abs(x - b.x) < b.halfWidth && abs(z - b.z) <= b.length / 2 + 0.12);
}

function road(width, knots) {
  const points = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[max(0, i - 1)],
      b = knots[i],
      c = knots[i + 1],
      d = knots[min(knots.length - 1, i + 2)];
    const n = Math.ceil(hypot(c[0] - b[0], c[1] - b[1]) / 2.3);
    for (let j = 0; j < n; j++) {
      const t = j / n,
        tt = t * t,
        ttt = tt * t;
      points.push(
        [0, 1].map(
          (k) =>
            0.5 *
            (2 * b[k] +
              (-a[k] + c[k]) * t +
              (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * tt +
              (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * ttt),
        ),
      );
    }
  }
  points.push(knots.at(-1));
  return { width, points };
}
export const ROADS = [
  road(6.8, [
    [7, 213],
    [13, 157],
    [-9, 107],
    [-5, 82],
    [0, 62],
    [-1, 48],
    [0, 36],
    [0, 0],
    [1, -18],
    [10, -39],
    [17, -64],
    [7, -89],
    [-21, -107],
  ]),
  road(4.7, [
    [-184, 133],
    [-149, 111],
    [-110, 108],
    [-68, 82],
    [-37, 73],
    [0, 62],
    [35, 66],
    [68, 83],
    [114, 93],
    [156, 105],
    [202, 136],
  ]),
  road(4, [
    [-148, 112],
    [-148, 65],
    [-137, 32],
    [-137, 9],
    [-137, -14],
    [-148, -49],
    [-153, -85],
    [-160, -114],
    [-176, -140],
  ]),
  road(4.8, [
    [-154, -85],
    [-111, -74],
    [-85, -67],
    [-39, -72],
    [17, -64],
    [50, -67],
    [83, -85],
    [117, -98],
    [144, -107],
    [178, -136],
  ]),
  road(4.3, [
    [156, 105],
    [154, 73],
    [134, 52],
    [134, 41],
    [134, 6],
    [130, -20],
    [124, -54],
    [144, -107],
  ]),
  road(2.6, [
    [-181.5, 104],
    [-165, 100],
    [-149, 111],
    [-117, 144],
    [-65, 160],
    [12, 156],
  ]),
  road(2.8, [
    [16, -65],
    [29, -96],
    [12, -123],
    [-9, -109],
    [-21, -99.5],
    [-36, -104],
    [-39, -126],
    [-37, -134],
  ]),
  road(2.8, [
    [143, -106],
    [166, -91],
    [183, -110],
    [177, -135],
  ]),
];
export function nearRoad(x, z, extra = 0) {
  for (const { width, points } of ROADS) {
    const r2 = (width / 2 + extra) ** 2;
    for (let i = 0; i < points.length; i += 2) {
      const p = points[i];
      if (abs(x - p[0]) < width + extra && (x - p[0]) ** 2 + (z - p[1]) ** 2 < r2) return true;
    }
  }
  return false;
}

const structures = [];
function house(x, z, w, d, wall, roof, yaw = 0, kind = 'cottage') {
  structures.push({ x, z, w, d, wall, roof, yaw, kind, y: terrainHeight(x, z) });
}
// The inhabited squares remain open around each region's center.
house(-15, -15, 9, 7, 3.2, 2.8, 0.15);
house(18, -20, 8, 6, 3, 2.6, -0.2, 'shop');
house(-11, -35, 9.2, 7, 3.5, 2.8, 0.15, 'shop');
house(22, -38, 8, 6, 3.4, 2.5, -0.15);
house(-8, -57, 8.5, 7.5, 3.2, 2.7, 0.04, 'shop');
house(37, -83, 9, 7, 3.5, 2.7, -0.17, 'shop');
house(44, -56, 8, 8, 3.3, 2.7, 0.1);
house(-3, -88, 8.8, 7.3, 3.5, 2.6, -0.1, 'shop');
house(-23, -117, 12, 11, 4.3, 14.5, 0, 'pagoda');
house(-48, -127, 11, 8, 4.6, 3.4, 0.09, 'temple');
house(-129, -105, 12, 9.5, 4.3, 3.4, 0.14, 'temple');
house(-174, -112, 8, 7, 3.8, 2.4, -0.12);
house(151, -137, 13, 9, 4.2, 3.2, 0.09, 'inn');
house(118, -123, 9, 7, 3.5, 2.8, -0.22);
house(173, 133, 8.5, 6.6, 3.4, 3.1, 0.25);
house(132, 127, 8, 7, 3.8, 2.8, -0.12);
house(-179, 139, 8, 6.8, 3, 2.6, 0.3);
house(-120, 124, 7, 6, 3.2, 2.6, 0.09);
house(-34, 49, 6.8, 6, 3.1, 2.5, 0.2, 'shop');
house(35, 61, 8, 6.4, 3, 2.7, -0.3);
export const BUILDINGS = structures;
export const MARKET_STALLS = [
  [5.8, -44.5, 1.73],
  [21.3, -44.5, -1.35],
  [8.7, -53, 1.63],
  [24.8, -55.3, -1.57],
  [6, -78.2, 1.35],
  [27, -72, -1.5],
];
export const GATES = [
  { x: -1, z: 47, w: 10.2, h: 7.25, yaw: 0 },
  { x: -151, z: -67, w: 7.6, h: 5.8, yaw: 0.24 },
  { x: -161, z: -99, w: 6.3, h: 5.2, yaw: 0.25 },
  { x: -20, z: -103, w: 7.4, h: 5.6, yaw: -0.18 },
];
export const ROCKS = [
  { x: -18.3, z: 53, rx: 1.65, rz: 1.35, h: 2.4 },
  { x: -20.5, z: 48.7, rx: 1.7, rz: 1.3, h: 2.7 },
  { x: 10.5, z: 44, rx: 1.2, rz: 0.92, h: 0.96 },
  { x: -9, z: 35.5, rx: 1.7, rz: 1.3, h: 1.1 },
];

const safeOffsets = [
  [-13, -9],
  [6, 14],
  [15, -11],
  [-9, 15],
  [-17, 4],
  [12, 5],
  [-4, 5],
  [4, -7],
  [6, -7],
  [-6, -12],
  [10, -15],
  [-19, 5],
];
const clearings = [
  [-10, 44],
  [8, 53],
  [-15, 68],
  [14, 37],
  [-18, 49],
  [12, 66],
  [-14, 54],
  [-4, 55],
  [4, 52],
  [6, 52],
  [-7, 44],
  [10, 40],
  [0, 62],
];
for (const r of REGIONS.slice(1)) for (const [dx, dz] of safeOffsets) clearings.push([r.x + dx, r.z + dz]);
const safe = (x, z, r) => clearings.some((p) => (p[0] - x) ** 2 + (p[1] - z) ** 2 < r * r);
export function seeded(seed) {
  return () => (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
}
const rng = seeded(821171);
const trees = [
  { x: -11.5, z: 54.8, h: 10.2, kind: 'pine', seed: 43 },
  { x: 11.3, z: 50.1, h: 8.6, kind: 'maple', seed: 31 },
  { x: -16, z: 68.8, h: 8.7, kind: 'maple', seed: 348 },
  { x: 16.6, z: 72.8, h: 10.2, kind: 'pine', seed: 17 },
  { x: -13.5, z: 30, h: 7.3, kind: 'willow', seed: 72 },
  { x: 13.2, z: 3.7, h: 8, kind: 'pine', seed: 32 },
  { x: -14.4, z: 1, h: 8, kind: 'maple', seed: 987 },
  { x: 26.5, z: 5.5, h: 8.8, kind: 'pine', seed: 701 },
  { x: -22, z: 40, h: 7.5, kind: 'oak', seed: 431 },
  { x: 24, z: 45, h: 7.8, kind: 'maple', seed: 27 },
];
for (let n = 0; n < 1600; n++) {
  const x = rng() * 486 - 243,
    z = rng() * 484 - 242;
  const rz = abs(z - riverZ(x));
  if (
    nearRoad(x, z, 2.1) ||
    safe(x, z, 4.3) ||
    terrainHeight(x, z) < 1.8 ||
    rz < riverHalfWidth(x) + 3 ||
    BUILDINGS.some((b) => abs(x - b.x) < b.w * 0.65 + 3 && abs(z - b.z) < b.d * 0.65 + 3)
  )
    continue;
  if (trees.some((t) => (x - t.x) ** 2 + (z - t.z) ** 2 < 21)) continue;
  const region = regionAt(x, z);
  const grove = 0.42 + 0.25 * sin(x * 0.068 + cos(z * 0.032)) + 0.26 * sin(z * 0.079 + x * 0.041);
  if (rng() > grove * (region === 4 ? 0.37 : region === 2 ? 0.48 : 1)) continue;
  const pick = rng(),
    kind =
      region === 1 && pick < 0.56
        ? 'bamboo'
        : region === 0 && pick < 0.24
          ? 'maple'
          : (region === 5 && pick < 0.85) || pick < 0.37
            ? 'pine'
            : pick < 0.63
              ? 'maple'
              : pick < 0.92
                ? 'oak'
                : 'willow';
  trees.push({ x, z, h: 5.1 + 5.8 * rng(), kind, seed: Math.floor(rng() * 1e6) });
}
export const TREES = trees;

const cells = new Map();
function cell(x, z) {
  return Math.floor(x / 16) + ',' + Math.floor(z / 16);
}
function putSolid(x, z, rx, rz, yaw, top, kind, support, roofRise = 0) {
  const item = { x, z, rx, rz, c: cos(yaw), s: sin(yaw), top, kind, support, roofRise };
  const r = hypot(rx, rz) + 1.0;
  for (let a = Math.floor((x - r) / 16); a <= Math.floor((x + r) / 16); a++)
    for (let b = Math.floor((z - r) / 16); b <= Math.floor((z + r) / 16); b++) {
      const id = a + ',' + b;
      if (!cells.has(id)) cells.set(id, []);
      cells.get(id).push(item);
    }
}
for (const b of BUILDINGS) {
  if (b.kind === 'pagoda') {
    let level = 0.36;
    for (let j = 0; j < 4; j++) {
      const k = 1 - j * 0.16,
        tier = 2.15 * k + 0.64,
        roof = 2.1 * k + 0.3;
      putSolid(b.x, b.z, b.w * k * 0.65, b.d * k * 0.65, b.yaw, b.y + level + tier, 'roof', true, roof);
      level += tier + roof - 0.5;
    }
  } else {
    putSolid(b.x, b.z, b.w * 0.55, b.d * 0.55, b.yaw, b.y + b.wall + 0.29, 'roof', true, b.roof);
  }
}
for (const [x, z, yaw] of MARKET_STALLS) {
  putSolid(x + 0.42 * sin(yaw), z + 0.42 * cos(yaw), 1.57, 0.42, yaw, terrainHeight(x, z) + 0.93, 'box', true);
}
putSolid(-161.7, -90.6, 1.65, 0.24, 1.18, terrainHeight(-161.7, -90.6) + 1.93, 'box', false);
for (const r of ROCKS) putSolid(r.x, r.z, r.rx, r.rz, 0, terrainHeight(r.x, r.z) + r.h, 'oval', true);
for (const t of TREES)
  putSolid(
    t.x,
    t.z,
    t.kind === 'bamboo' ? 0.3 : 0.37,
    t.kind === 'bamboo' ? 0.3 : 0.37,
    0,
    terrainHeight(t.x, t.z) + t.h * 0.68,
    'oval',
    false,
  );
for (const g of GATES)
  for (const sign of [-1, 1]) {
    const x = g.x + sign * g.w * 0.36 * cos(g.yaw),
      z = g.z - sign * g.w * 0.36 * sin(g.yaw);
    putSolid(x, z, g.w * 0.045, g.w * 0.045, 0, terrainHeight(g.x, g.z) + g.h, 'oval', false);
  }
function surfaceHeight(s, x, z, pad) {
  const dx = x - s.x,
    dz = z - s.z,
    a = dx * s.c - dz * s.s,
    b = dx * s.s + dz * s.c;
  if (s.kind === 'oval') return (a / (s.rx + pad)) ** 2 + (b / (s.rz + pad)) ** 2 <= 1 ? s.top : -Infinity;
  if (abs(a) > s.rx + pad || abs(b) > s.rz + pad) return -Infinity;
  if (s.kind === 'roof') {
    const v = min(1, abs(b) / (s.rz * 1.12)),
      end = min(1, abs(a) / s.rx);
    return s.top + s.roofRise * ((1 - v) ** 1.62 + end ** 5 * (0.045 + 0.12 * v));
  }
  return s.top;
}
function highest(x, z, pad, supportOnly) {
  const items = cells.get(cell(x, z));
  let h = -Infinity;
  if (items)
    for (const item of items) if (!supportOnly || item.support) h = max(h, surfaceHeight(item, x, z, pad));
  return h;
}
export const solidHeightAt = (x, z, clearance = 0) => highest(x, z, clearance, false);
export function groundHeight(x, z) {
  const b = bridgeAt(x, z);
  return max(b ? bridgeHeight(b, z) : terrainHeight(x, z), highest(x, z, 0, true));
}
export function canLand(x, z) {
  if (abs(x) > BOUND || abs(z) > BOUND || (!bridgeAt(x, z) && terrainHeight(x, z) < WATER_Y + 0.12)) return false;
  return highest(x, z, 0.18, false) <= groundHeight(x, z) + 0.3;
}
export function constrainMove(fromX, fromZ, toX, toZ, aboveGround = 0) {
  const dx = toX - fromX,
    dz = toZ - fromZ;
  let x = fromX,
    z = fromZ;
  const steps = Math.max(1, Math.ceil(hypot(dx, dz) / 0.8));
  for (let i = 0; i < steps; i++) {
    const feet = groundHeight(x, z) + aboveGround;
    function free(nx, nz) {
      if (abs(nx) > BOUND - 0.45 || abs(nz) > BOUND - 0.45) return false;
      if (highest(nx, nz, 0.33, false) > feet + 0.34) return false;
      return aboveGround > 0.52 || !!bridgeAt(nx, nz) || terrainHeight(nx, nz) >= WATER_Y + 0.12;
    }
    const nx = x + dx / steps,
      nz = z + dz / steps;
    if (free(nx, nz)) {
      x = nx;
      z = nz;
    } else if (free(nx, z)) x = nx;
    else if (free(x, nz)) z = nz;
  }
  return { x, z };
}
