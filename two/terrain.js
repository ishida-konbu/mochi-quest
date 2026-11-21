import { forestForm, TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';
import { roomPlan } from './architecture.js';
// Coordinates and dimensions are metres. Positive Z is south.
export const BOUND = 416,
  WATER_Y = 0.38;
export const wrapCoord = (v) => v >= -BOUND && v < BOUND ? v : ((v + BOUND) % (2 * BOUND) + 2 * BOUND) % (2 * BOUND) - BOUND;
export const wrapDelta = wrapCoord;
export const REGIONS = [
  { id: 'river', name: '桜川の渡し', x: 0, z: 59 },
  { id: 'shrine', name: '竹隠れの社', x: -153, z: -85 },
  { id: 'market', name: '蔵町の市', x: 17, z: -64 },
  { id: 'spring', name: '湯けむり峠', x: 144, z: -107 },
  { id: 'terraces', name: '月見の棚田', x: 156, z: 105 },
  { id: 'coast', name: '海風の松原', x: -149, z: 111 },
  { id: 'snow', name: '雪灯りの都', x: -78, z: -290 },
  { id: 'autumn', name: '錦秋の楓峡', x: 285, z: -115 },
  { id: 'moon', name: '十五夜の薄野', x: -55, z: 290 },
  { id: 'dawn', name: '初日の出の浦', x: 302, z: 175 },
];
export const regionAt = (x, z) => {
  let best = 0,
    d = Infinity;
  REGIONS.forEach((r, i) => {
    const v = wrapDelta(x - r.x) ** 2 + wrapDelta(z - r.z) ** 2;
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
// Regional colour and weather follow a broad transition around each landmark.
function climate(x, z, cx, cz, rx, rz) {
  const a = wrapDelta(x - cx) / rx, b = wrapDelta(z - cz) / rz;
  return 1 - smooth(0.40, 1.02, a*a + b*b);
}
export function seasonAt(x, z, out = {}) {
  out.snow = climate(x,z,-78,-293,174,119);
  out.autumn = climate(x,z,292,-122,116,139);
  out.moon = climate(x,z,-55,300,162,116);
  out.dawn = climate(x,z,305,178,107,129);
  return out;
}
const hill = (x, z, cx, cz, rx, rz) => exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
export const riverZ = (x) => 18 + 9 * sin(x / 51) + 3.3 * sin(x / 25);
export const riverHalfWidth = (x) => 8.6 + 1.9 * sin(x / 38 + 0.35) + 0.95 * sin(x / 14);
export const coastX = (z) => -250 + 64 * exp(-(((z - 112) / 75) ** 2)) + 5.5 * sin(z / 23);
export const eastCoastX = (z) => 374 - 48 * exp(-(((z-176)/99)**2)) + 7 * sin(z/36);
export function shoreDistance(x, z) {
  // Four gently curving beaches meet a shared, level seabed before each seam.
  const ends = 375 + 7*sin(x/41) + 4*cos(x/22);
  return min(x-coastX(z), eastCoastX(z)-x, ends-abs(z));
}
const mapleStreamZ = x => -130 + 3.3*sin((x-292)/15);
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
    6 * hill(x, z, -124, 159, 47, 59) +
    31 * hill(x, z, -164, -331, 43, 28) + 21 * hill(x,z, 8,-324,60,33) +
    9 * hill(x,z,-112,-242,66,45) +
    38 * hill(x,z,272,-189,34,36) + 25 * hill(x,z,335,-151,36,38) +
    21 * hill(x,z,247,-65,30,31) + 14 * hill(x,z,259,-135,33,32) +
    17 * hill(x,z,-93,292,52,48) + 10 * hill(x,z,-3,311,40,49);
  const nearRiver = min(basic, 1.28 + max(0, d) * 0.11 + max(0, d) ** 2 * 0.0009);
  let land = -1.57 + (nearRiver + 1.57) * smooth(-3.5, 6.6, d);
  // Beyond the maple bridge a small ravine opens eastwards into the sea.
  if (x > 277 && z < -106 && z > -153) {
    const bed = max(0, abs(z-mapleStreamZ(x))-2.6), opening=smooth(277,288,x);
    const banks=smooth(.15,10.5,bed);
    land += (-1.15-land)*(1-banks)*opening;
  }
  const shore = shoreDistance(x,z);
  return -1.8 + (land + 1.8) * smooth(-3.3, 11, shore);
}
// This stone bathing pool was cut into the hillside on a level terrace.
const bathShelf = { x: 143, z: 96, height: naturalHeight(143, 96) };
function ungradedHeight(x, z) {
  const dx = x - bathShelf.x,
    dz = z - bathShelf.z;
  if (abs(dx) > 8.5 || abs(dz) > 8.5) return naturalHeight(x, z);
  const distance = hypot(dx, dz);
  if (distance <= 5) return bathShelf.height;
  const terrain = naturalHeight(x, z);
  return bathShelf.height + (terrain - bathShelf.height) * smooth(5, 8.5, distance);
}
// A building has a level earthen lot, feathered out into the hillside.
const lotGrid = new Map();
export function terrainHeight(x, z) {
  x = wrapCoord(x); z = wrapCoord(z);
  const base = ungradedHeight(x,z);
  const nearby = lotGrid.get(Math.floor(x / 24) * 64 + Math.floor(z / 24));
  if (!nearby) return base;
  let weight = 0, graded = base;
  for (const b of nearby) {
    const dx = x-b.x, dz = z-b.z, u = dx*b.cos - dz*b.sin, v = dx*b.sin + dz*b.cos;
    const edge = max(abs(u) - b.w/2 - .9, abs(v-.5) - b.d/2 - 1.5);
    const blend = 1 - smooth(0, 3.8, edge);
    if (blend > weight) { weight = blend; graded = base + (b.y-base)*blend; }
  }
  return graded;
}
export const BRIDGES = [-137, 0, 134].map((x) => ({
  x,
  z: riverZ(x),
  length: (riverHalfWidth(x) + 9) * 2,
  halfWidth: x === 0 ? 3.45 : 2.6,
}));
BRIDGES.push({x:292,z:mapleStreamZ(292),length:24.8,halfWidth:2.1,maple:true});
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
ROADS.push(
  road(5.4,[[-21,-107],[-36,-104],[-39,-119],[-37,-135],[-58,-150],[-74,-194],[-107,-222],[-97,-249],[-79,-269],[-78,-290],[-78,-317]]),
  road(4.3,[[-125,-289],[-103,-289],[-78,-290],[-55,-289],[-40,-282]]),
  road(4.4,[[144,-107],[178,-136],[204,-148],[229,-131],[253,-115],[273,-109],[285,-115],[291.7,-117.2],[292,-125],[292,-135],[292.2,-144],[308,-151],[331,-154]]),
  road(4.2,[[7,213],[-4,233],[-31,255],[-57,270],[-55,290],[-70,305],[-89,313]]),
  road(4.6,[[156,105],[202,136],[234,150],[250,176],[276,185],[290,182],[302,175],[311,173]]),
  road(3.3,[[285,-115],[303,-72],[296,-39],[283,0],[280,43],[266,80],[271,132],[290,182]]),
);
const roadCells = new Map();
let widestRoad = 0;
for (const {width, points} of ROADS) {
  widestRoad = max(widestRoad, width);
  for (let i=0; i<points.length; i+=2) {
    const [x,z] = points[i], key = Math.floor(x/16)*128+Math.floor(z/16);
    if (!roadCells.has(key)) roadCells.set(key, []);
    roadCells.get(key).push({x,z,width});
  }
}
export function nearRoad(x, z, extra = 0) {
  const reach = widestRoad/2 + abs(extra);
  for (let i=Math.floor((x-reach)/16); i<=Math.floor((x+reach)/16); i++) {
    for (let j=Math.floor((z-reach)/16); j<=Math.floor((z+reach)/16); j++) {
      const samples = roadCells.get(i*128+j);
      if (!samples) continue;
      for (const p of samples) {
        const dx = x-p.x;
        if (abs(dx)<p.width+extra && dx*dx+(z-p.z)**2 < (p.width/2+extra)**2) return true;
      }
    }
  }
  return false;
}

const structures = [];
function house(x, z, w, d, wall, roof, yaw = 0, kind = 'cottage') {
  const b = { x, z, w, d, wall, roof, yaw, kind, y: ungradedHeight(x, z), cos: cos(yaw), sin: sin(yaw), snow: z < -240 };
  structures.push(b);
  const extent = hypot(w/2+5,d/2+6);
  for (let i = Math.floor((x-extent)/24); i <= Math.floor((x+extent)/24); i++)
    for (let j = Math.floor((z-extent)/24); j <= Math.floor((z+extent)/24); j++) {
      const key = i*64+j;
      if (!lotGrid.has(key)) lotGrid.set(key,[]);
      lotGrid.get(key).push(b);
    }
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
// The snow capital has a processional avenue, a side market and a pagoda at its head.
house(-80,-323,13,12,4.4,14.5,.06,'pagoda');
house(-93,-306,10,8,3.9,3.6,.15,'temple');
house(-63,-305,9,8,3.6,3.1,-.12,'shop');
house(-99,-281,9.5,7,3.4,3.3,.14,'inn');
house(-59,-277,9,7.6,3.5,3.3,-.28,'shop');
house(-96,-264,7.6,7,3.2,3.2,.27);
house(-69,-258,8.8,7.5,3.4,3.3,-.24,'shop');
house(-114,-303,8.8,7.5,3.4,3.1,.1);
house(274,-127,8.6,6.6,3.3,2.8,.29,'shop');
house(-69,282,7.8,6.6,3.2,2.6,-.34,'temple');
house(288,160,8.6,6.6,3.3,2.7,.3,'inn');
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
  { x: -79, z: -273, w: 8.6, h: 6.3, yaw: .12 },
  { x: 258, z: -114, w: 6.4, h: 4.7, yaw: 1.3 },
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
// Compose the new groves around paths, keeping the festival shore and moonrise sightline open.
const outerRandom = seeded(532151);
for (let i=0; i<980; i++) {
  const x = outerRandom()*738-369, z = outerRandom()*748-374;
  if (abs(x)<225 && abs(z)<224 || terrainHeight(x,z)<2.2 || nearRoad(x,z,2.65)) continue;
  if (safe(x,z,6) || BUILDINGS.some(b => hypot(x-b.x,z-b.z) < max(b.w,b.d)*.76+3)) continue;
  const {snow,autumn,moon,dawn} = seasonAt(x,z);
  if (moon>.4 && z<302 && x> -77 || dawn>.5 && x>298 || snow>.45 && abs(x+78)<19 && z < -260) continue;
  const density = .14 + .44*autumn+.19*snow+.015*moon+.12*dawn;
  if (outerRandom()>density || trees.some(t => (t.x-x)**2+(t.z-z)**2<33)) continue;
  const kind = snow>.35 ? 'pine' : autumn>.2 ? 'maple' : outerRandom()<.6?'pine':'oak';
  trees.push({x,z,h:6.3+outerRandom()*5.3,kind,seed:Math.floor(outerRandom()*1e6), snow, autumn});
}
for (const [x,z,hue] of [[271,-102,0],[279,-120,1],[289,-105,2],[283,-137,1],[300,-118,2],[278,-94,0],[268,-116,1],[286,-145,2],[305,-141,1]]) {
  trees.push({x,z,h:9.3+hue*.9,kind:'maple',seed:1061+Math.floor(x*z+90213),autumn:1});
}
const fallRng = seeded(35444);
for (let i=0;i<120;i++) {
  const x=284+(fallRng()-.5)*121, z=-116+(fallRng()-.5)*108;
  if (terrainHeight(x,z)<2.1 || nearRoad(x,z,2.65) || safe(x,z,4.2) || hypot(x-285,z+115)<8 ||
      BUILDINGS.some(b=>hypot(b.x-x,b.z-z)<max(b.w,b.d)*.8+3) ||
      trees.some(t=>(x-t.x)**2+(z-t.z)**2<32)) continue;
  trees.push({x,z,h:6.4+fallRng()*4.1,kind:'maple',seed:Math.floor(fallRng()*1e6),autumn:1});
}
export const LANDMARK_TREES = trees.slice();

// Plant the woods in drifts. There is always walking room between the trunks.
// The open approach to each roadside scene continues well beyond its actors.
function populateForest() {
  const random = seeded(41985037), spacing = new Map(), season = {};
  const keyOf = (x,z) => Math.floor(x/6)*256+Math.floor(z/6);
  function remember(tree) {
    const key = keyOf(tree.x,tree.z);
    if (!spacing.has(key)) spacing.set(key,[]);
    spacing.get(key).push(tree);
  }
  trees.forEach(remember);
  const target = LANDMARK_TREES.length * 5;
  for (let tried=0; trees.length<target && tried<250000; tried++) {
    const x=random()*628-253, z=random()*748-374;
    const riverBank=abs(z-riverZ(x))-riverHalfWidth(x);
    if (shoreDistance(x,z)<9 || riverBank<10.5 || nearRoad(x,z,2.7)) continue;
    const region=regionAt(x,z), place=REGIONS[region];
    if (hypot(x-place.x,z-place.z)<20 || safe(x,z,5.8)) continue;
    if (BUILDINGS.some(b=>hypot(b.x-x,b.z-z)<hypot(b.w,b.d)*.52+4)) continue;
    if (BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+4 && abs(z-b.z)<b.length/2+4)) continue;
    if (GATES.some(g=>hypot(x-g.x,z-g.z)<g.w*.75)) continue;
    // Rice plots, bathing pool, the moon-viewing meadow and sunrise festival.
    if ((x>122 && x<184 && z>79 && z<135) || (x>125 && x<169 && z> -123 && z< -80)) continue;
    seasonAt(x,z,season);
    if (season.moon>.4 && x>-78 && z<307 || season.dawn>.48 && x>291 ||
        season.snow>.45 && abs(x+78)<18 && z< -260) continue;
    if (terrainHeight(x,z)<1.9) continue;
    const wave = .5+.24*sin(x*.065+cos(z*.061))+.22*cos(z*.049+sin(x*.039));
    if (random() > .10+wave*.87) continue;
    const cx=Math.floor(x/6), cz=Math.floor(z/6), gap=3.8+(1-wave)*1.9;
    let occupied=false;
    for (let i=cx-1; i<=cx+1 && !occupied; i++)
      for (let j=cz-1; j<=cz+1 && !occupied; j++)
        occupied=spacing.get(i*256+j)?.some(t=>(x-t.x)**2+(z-t.z)**2<gap*gap);
    if (occupied) continue;
    const form=forestForm(region,random), family=TREE_FAMILIES[Math.floor(form/TREE_FORMS_PER_FAMILY)];
    const young = random()<.22, h=(young?3.5:6.0)+random()*(young?2.2:5.4);
    const tree={x,z,h,kind:family[0],form,seed:Math.floor(random()*1e6)};
    trees.push(tree);
    remember(tree);
  }
}
populateForest();
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
  const plan = roomPlan(b);
  function localSolid(u, v, width, depth, height, kind, support) {
    const x = b.x + u * cos(b.yaw) + v * sin(b.yaw);
    const z = b.z - u * sin(b.yaw) + v * cos(b.yaw);
    putSolid(x, z, width / 2, depth / 2, b.yaw, b.y + height, kind, support);
  }
  localSolid(0, 0, b.w + 1.1, b.d + 1.08, 0.42, 'floor', true);
  localSolid(0, 0, plan.width, plan.depth, plan.floor, 'floor', true);
  for (let j = 0; j < 3; j++)
    localSolid(0, b.d / 2 + 0.48 + j * 0.39, b.w * 0.48, 0.46, 0.32 - j * 0.19, 'floor', true);
  for (const wall of plan.walls)
    localSolid(wall.u, wall.v, wall.width, wall.depth, plan.ceiling, 'wall', false);
  localSolid(0, 0, b.w * 1.08, b.d * 1.08, plan.ceiling, 'ceiling', false);
  // Roofs have an underside. A walker can pass beneath an eave while a
  // falling or flying visitor can land on the same surface from above.
  if (b.kind === 'pagoda') {
    let level = 0.36;
    for (let j = 0; j < 4; j++) {
      const k = 1 - j * 0.16, tier = 2.15 * k + 0.64, roof = 2.1 * k + 0.3;
      putSolid(b.x, b.z, b.w * k * 0.70, b.d * k * 0.70, b.yaw, b.y + level + tier, 'roof', true, roof);
      level += tier + roof - 0.5;
    }
  } else {
    putSolid(b.x, b.z, b.w * 0.61, b.d * 0.63, b.yaw, b.y + b.wall + 0.29, 'roof', true, b.roof);
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
    t.form !== undefined ? t.h*.027 : t.kind === 'bamboo' ? 0.3 : 0.37,
    t.form !== undefined ? t.h*.027 : t.kind === 'bamboo' ? 0.3 : 0.37,
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
// feet limits which storey can support an actor. Without a height hint,
// terrain queries (objects, spawn points and the atlas) use the lower storey.
function highest(x, z, pad, feet, supportOnly) {
  let height = -Infinity;
  const items = cells.get(cell(x, z));
  if (items) for (const item of items) {
    if (item.kind === 'ceiling' || (supportOnly && !item.support)) continue;
    if (item.kind === 'roof') {
      if (feet < item.top - 0.22) continue;
      if (supportOnly && surfaceHeight(item,x,z,pad) > feet + .34) continue;
    }
    height = max(height, surfaceHeight(item, x, z, pad));
  }
  return height;
}
export const solidHeightAt = (x, z, clearance = 0, y = Infinity) => highest(x, z, clearance, y, false);
const waterFloor = WATER_Y - 0.57;
export function groundHeight(x, z, feet = -Infinity) {
  const b = bridgeAt(x, z);
  const deck = b ? bridgeHeight(b, z) : -Infinity;
  const onBridge = b && (feet === -Infinity || feet >= deck - .36);
  return max(onBridge ? deck : -Infinity, waterFloor, terrainHeight(x, z), highest(x, z, 0, feet, true));
}
export function waterDepth(x, z) {
  return max(0, WATER_Y - terrainHeight(x, z));
}
export function overheadHeight(x, z, feet) {
  const bridge = bridgeAt(x, z);
  const deck = bridge ? bridgeHeight(bridge,z) : -Infinity;
  let ceiling = feet < deck - .36 ? deck - .17 : Infinity;
  const items = cells.get(cell(x, z));
  if (items) for (const item of items) {
    if (item.kind === 'ceiling' && feet < item.top - 0.15 && surfaceHeight(item,x,z,0) > -Infinity)
      ceiling = min(ceiling, item.top);
  }
  return ceiling;
}
export function canLand(x, z, feet) {
  const floor = groundHeight(x, z, feet);
  return highest(x, z, 0.12, feet ?? floor, false) <= floor + 0.33;
}
export function constrainMove(fromX, fromZ, toX, toZ, aboveGround = 0, feetY = groundHeight(fromX, fromZ) + aboveGround) {
  const dx = wrapDelta(toX - fromX), dz = wrapDelta(toZ - fromZ);
  const steps = max(1, Math.ceil(hypot(dx, dz) / 0.55));
  let x = fromX, z = fromZ;
  for (let i = 0; i < steps; i++) {
    const feet = max(feetY, groundHeight(x, z, feetY));
    const free = (nx, nz) => highest(nx, nz, 0.24, feet, false) <= feet + 0.34 &&
      overheadHeight(nx, nz, feet) >= feet + 1.42;
    const nx = wrapCoord(x + dx / steps), nz = wrapCoord(z + dz / steps);
    if (free(nx, nz)) { x = nx; z = nz; }
    else if (free(nx, z)) x = nx;
    else if (free(x, nz)) z = nz;
  }
  return { x, z };
}
