import { nearbyHut, inHutYard, clearingWeight, hutSolids, KETTLE } from './wayside-hut-layout.js';
import { RYUGU, palaceSolid } from './ryugu-layout.js';
import { HIGASHIYAMA, KITAYAMA, FIRE_COAST, eastRidgeHeight, northRidgeHeight, inFireMeadow } from './higashiyama.js';
import { offshoreReefs } from './tidal-reefs.js';
import { portTerrain,portShore,portSolids,portReserved,SEAPORTS,portPoint } from './seaport-layout.js';
import { DISTRICTS, districtPoint, WORLD_BOUND, TERRAIN_TILES, TERRAIN_SUBDIVISIONS, wrapWorld } from './geography.js';
import { RETREATS, sitePoint, courtTerrain, bathTerrain, bathRadius, nearbyRetreat, reservedScenery, civicAndBathSolids } from './retreat-layout.js';
import { KYO_BUILDINGS, KYO_ROADS, KYO_FOOD, KYO_SCREENS, screenFold, inCapitalWard, wardFloorPlan, gateSolids, gateStoneRise, RASHOMON } from './kyo-layout.js';
import { CEDAR_GROVES, INARI_ROUTE, nearPeachTrunk, pilgrimageHeight, pilgrimageSolids } from './pilgrimage-layout.js';
import { TRADE_ROADS } from './trade-routes.js';
import { STREET_BEATS } from './street-watch-layout.js';
import { forestForm, TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';
import { roomPlan, pagodaPlan, roofForm, roofProfile } from './architecture.js';
// Coordinates and dimensions are metres. Positive Z is south.
const ORIGINAL_BOUND = 416;
export const BOUND = WORLD_BOUND,
  WATER_Y = 0.38;
export const wrapCoord = v => wrapWorld(v);
export const wrapDelta = wrapCoord;
export const ORIGINAL_REGIONS = [
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
export const REGIONS = [
  ...ORIGINAL_REGIONS,
  { id: 'kyo', name: '花の京', ...DISTRICTS.kyo, port:districtPoint('kyo',137,-417) },
  { id: 'peach', name: '深山の桃源郷', ...DISTRICTS.peach },
  { id: 'ryugu', name: '海底の竜宮城', ...DISTRICTS.ryugu },
  { id: 'todaiji', name: '東大寺の大餅仏', ...DISTRICTS.todaiji },
  { id: 'inari', name: '伏見稲荷', ...DISTRICTS.inari, district: districtPoint('inari',-213,-445), port: districtPoint('inari',-148,-376) },
  ...SEAPORTS.map(p=>{
    const [x,z]=portPoint(p,-5,7);
    return {...p,x,z};
  }),
];
function nearestRegion(x, z, regions, halfSpan) {
  let best = 0, distance = Infinity;
  for (let i=0; i<regions.length; i++) {
    const place=regions[i];
    const dx=Math.abs(x-(place.district?.[0] ?? place.x)), dz=Math.abs(z-(place.district?.[1] ?? place.z));
    const squared=Math.min(dx,2*halfSpan-dx)**2 + Math.min(dz,2*halfSpan-dz)**2;
    if (squared < distance) { distance=squared; best=i; }
  }
  return best;
}
export const regionAt = (x,z) => nearestRegion(wrapCoord(x),wrapCoord(z),REGIONS,BOUND);
const originalRegionAt = (x,z) => nearestRegion(x,z,ORIGINAL_REGIONS,ORIGINAL_BOUND);
const { sin, cos, exp, abs, min, max, hypot } = Math;
const sat = (t) => max(0, min(1, t));
const smooth = (a, b, x) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Regional colour and weather follow a broad transition around each landmark.
function seasonalFields(x,z,out,delta) {
  function weight(cx,cz,rx,rz) {
    const a=delta(x-cx)/rx, b=delta(z-cz)/rz;
    return 1-smooth(.40,1.02,a*a+b*b);
  }
  out.snow=weight(-78,-293,174,119);
  out.autumn=weight(292,-122,116,139);
  out.moon=weight(-55,300,162,116);
  out.dawn=weight(305,178,107,129);
  return out;
}
export const seasonAt = (x,z,out={}) => seasonalFields(x,z,out,wrapDelta);
// The seed fields of established woodland use the dimensions of the original island.
const originalDelta = v => v > ORIGINAL_BOUND ? v-2*ORIGINAL_BOUND : v < -ORIGINAL_BOUND ? v+2*ORIGINAL_BOUND : v;
const originalSeasonAt = (x,z,out={}) => seasonalFields(x,z,out,originalDelta);
const hill = (x, z, cx, cz, rx, rz) => exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
export const riverZ = (x) => 18 + 9 * sin(x / 51) + 3.3 * sin(x / 25);
export const riverHalfWidth = (x) => 8.6 + 1.9 * sin(x / 38 + 0.35) + 0.95 * sin(x / 14);
export const coastX = (z) => -250 + 64 * exp(-(((z - 112) / 75) ** 2)) + 5.5 * sin(z / 23);
export const eastCoastX = (z) => 374 - 48 * exp(-(((z-176)/99)**2)) + 7 * sin(z/36);
function originalShore(x, z) {
  // Four gently curving beaches meet a shared, level seabed before each seam.
  const ends = 375 + 7*sin(x/41) + 4*cos(x/22);
  return min(x-coastX(z), eastCoastX(z)-x, ends-abs(z));
}
// Signed shore distances unite the original coast with three peninsulas. The
// western bay remains open to the sea between the peach valley and the temple.
export const PENINSULAS = [
  // The coastal lobe beneath each route supplies real foothills on either side.
  [0,-464,282,228], [93,-640,253,241], [108,-822,290,204], [237,-889,210,166],
  // Beyond the mountain pass the valley broadens into the north-facing harbour.
  [405,-1082,152,190], [430,-1228,148,196], [374,-1365,150,109],
  [287,-1402,120,74], [475,-1378,99,74],
  [-155,-859,270,148], [-366,-903,339,240], [-521,-932,268,207],
  [394,-547,249,214], [433,-641,166,141], [316,-402,192,148],
  [-304,-91,178,86], [-502,-142,230,101], [-714,-170,224,137], [-782,-187,198,153],
  [-913,-218,158,145], [-881,-306,163,121], [-746,-301,147,107],
  // A mountain coast shelves into the sea around the extended peach watershed.
  [-704,-269,248,122],[-575,-229,165,89],[-811,-101,203,145],[-661,-122,181,148],
  [112,382,210,166], [193,497,156,181], [256,616,180,165],
  [336,707,177,163], [427,837,181,175],
  // Pine-covered islets flank the Ryugu sea lane, with open water between.
  [-413,121,62,27], [-492,311,52,30], [-583,174,24,15],
  ...FIRE_COAST,
];
export function shoreDistance(x,z) {
  let shore=originalShore(x,z);
  const erosion=5.9*sin(x*.048+z*.025)+3.8*cos(z*.062-x*.033)+2.3*sin(x*.109-z*.089);
  for(const [cx,cz,rx,rz] of PENINSULAS) {
    // Ellipses outside this bounding box cannot contribute land, surf or shoals.
    if(abs(x-cx)>rx+62 || abs(z-cz)>rz+62) continue;
    const margin=(1-hypot((x-cx)/rx,(z-cz)/rz))*min(rx,rz)+erosion;
    const junction=max(0,1-abs(shore-margin)/24);
    shore=max(shore,margin)+6*junction*junction;
  }
  return portShore(x,z,shore);
}
function outerHeight(x,z,base) {
  if (z > -305 && z < 311 && x > -180 && x < 310) return base;
  const shore=shoreDistance(x,z);
  let ground=base;
  if (originalShore(x,z)<22 && shore> -3.3) {
    const rolls=4.8+2.2*sin(x*.025+z*.008)*cos(z*.021)
      + 1.35*cos(x*.013-z*.018)+1.10*sin(x*.043+z*.039);
    const hills=rolls + eastRidgeHeight(x,z) + northRidgeHeight(x,z)
      + 18*hill(x,z,-89,-592,101,91) + 22*hill(x,z,184,-694,74,69)
      + 26*hill(x,z,-563,-198,87,46) + 18*hill(x,z,-451,-80,72,39) + 6.4*hill(x,z,-240,-84,28,27)
      + 25*hill(x,z,219,556,64,89) + 32*hill(x,z,382,677,84,81)
      + 21*hill(x,z,480,922,76,55) + 13*hill(x,z,-413,121,40,21);
    // The capital stands on a river terrace. The lookout rises beyond the last street.
    const streetEdge=max(abs(x-DISTRICTS.kyo.x)-102,abs(z-DISTRICTS.kyo.z)-84);
    const basin=x>DISTRICTS.kyo.x-124 && x<DISTRICTS.kyo.x+124 && z>DISTRICTS.kyo.z-106 && z<DISTRICTS.kyo.z+106
      ? rolls+(hills-rolls)*smooth(0,22,streetEdge):hills;
    const newLand=-1.8+(basin+1.8)*smooth(-3.3,11,shore);
    ground=base+(max(base,newLand)-base)*(1-smooth(11,22,originalShore(x,z)));
  }
  if (shore>0) ground+=(pilgrimageHeight(x,z,ground)-ground)*smooth(0,20,shore);
  const gateVerge=max(abs(x-RASHOMON.x)-14,abs(z-RASHOMON.z-3)-19);
  if(gateVerge<20)ground+=(5-ground)*(1-smooth(0,20,gateVerge));
  if (shore < 0) {
    // Offshore shoals gradually give way to open water. A sandy terrace
    // holds the palace and its gate at the bottom of the western bay.
    ground-=7*smooth(1,37,-shore);
    const palace=hypot(x-DISTRICTS.ryugu.x,z-DISTRICTS.ryugu.z);
    ground+=(-28-ground)*(1-smooth(35,99,palace));
    // The two sides of every ocean seam meet on a common deep shelf.
    const edge=BOUND-max(abs(x),abs(z));
    ground=-8.8+(ground+8.8)*smooth(0,18,edge);
  }
  return ground;
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
  const shore = originalShore(x,z);
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
function landHeight(x, z, expanded = true) {
  x = wrapCoord(x); z = wrapCoord(z);
  const native = ungradedHeight(x,z);
  const base = expanded ? outerHeight(x,z,native) : native;
  const nearby = lotGrid.get(Math.floor(x / 24) * 128 + Math.floor(z / 24));
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
// The baths sit in a hand-cut hollow; their waterline is independent of the sea.
export const SNOW_SPRING = { x: -32, z: -292, rx: 13.6, rz: 8.8, level: naturalHeight(-32,-292)-.12 };
export const TSUKIMI = { x: -51.7, z: 285.9, yaw: -.15 };
export function springRadius(x,z) {
  return hypot((x-SNOW_SPRING.x)/SNOW_SPRING.rx,(z-SNOW_SPRING.z)/SNOW_SPRING.rz);
}
export function terrainHeight(x,z) {
  const native = portTerrain(x,z,courtTerrain(x,z,landHeight(x,z),landHeight));
  const hut=nearbyHut(x,z);
  if(hut){
    const w=clearingWeight(hut,x,z);
    if(w>0)return native+(landHeight(hut.x,hut.z)-native)*w;
  }
  const site=nearbyRetreat(x,z);
  if(site) return bathTerrain(site,x,z,native,landHeight(site.x,site.z)+.22);
  if (abs(x-SNOW_SPRING.x)>23 || abs(z-SNOW_SPRING.z)>16) return native;
  const r = springRadius(x,z);
  const bed = SNOW_SPRING.level-.61+smooth(.70,1.03,r)*.87;
  return bed+(native-bed)*smooth(1.08,1.60,r);
}
// Root a plant on the actual painted triangle. Across the crease of a rocky
// spur the analytic surface can differ visibly from its sampled vertices.
const groundSpacing=2*BOUND/(TERRAIN_TILES*TERRAIN_SUBDIVISIONS);
export function terrainMeshHeight(x,z) {
  const left=Math.floor((x+BOUND)/groundSpacing)*groundSpacing-BOUND;
  const north=Math.floor((z+BOUND)/groundSpacing)*groundSpacing-BOUND;
  const u=(x-left)/groundSpacing,v=(z-north)/groundSpacing;
  const east=terrainHeight(left+groundSpacing,north),south=terrainHeight(left,north+groundSpacing);
  return u+v<=1 ? terrainHeight(left,north)*(1-u-v)+east*u+south*v :
    terrainHeight(left+groundSpacing,north+groundSpacing)*(u+v-1)+east*(1-v)+south*(1-u);
}
// Street processions follow the stone walking level beneath the gatehouse.
export function roadSurfaceHeight(x,z) {
  const step=gateStoneRise(x-RASHOMON.x,z-RASHOMON.z);
  return step>0 ? terrainHeight(RASHOMON.x,RASHOMON.z)+step : terrainHeight(x,z);
}
export function waterSurfaceAt(x,z) {
  const hut=nearbyHut(x,z);
  if(hut?.bath && (x-hut.bath.x)**2+(z-hut.bath.z)**2<KETTLE.widthScale**2) return terrainHeight(hut.x,hut.z)+KETTLE.water;
  const site=nearbyRetreat(x,z);
  if(site && bathRadius(site,x,z)<1) return landHeight(site.x,site.z)+.22;
  return abs(x-SNOW_SPRING.x)<15 && abs(z-SNOW_SPRING.z)<10 && springRadius(x,z)<1 ? SNOW_SPRING.level : WATER_Y;
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
function indexRoad({width,points}) {
  widestRoad = max(widestRoad, width);
  for (let i=0; i<points.length; i+=2) {
    const [x,z] = points[i], key = Math.floor(x/16)*256+Math.floor(z/16);
    if (!roadCells.has(key)) roadCells.set(key, []);
    roadCells.get(key).push({x,z,width});
  }
}
ROADS.forEach(indexRoad);
export function nearRoad(x, z, extra = 0) {
  const reach = widestRoad/2 + abs(extra);
  for (let i=Math.floor((x-reach)/16); i<=Math.floor((x+reach)/16); i++) {
    for (let j=Math.floor((z-reach)/16); j<=Math.floor((z+reach)/16); j++) {
      const samples = roadCells.get(i*256+j);
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
function house(x, z, w, d, wall, roof, yaw = 0, kind = 'cottage', craft) {
  const b = { x, z, w, d, wall, roof, yaw, kind, craft, y: outerHeight(x,z,ungradedHeight(x,z)), cos: cos(yaw), sin: sin(yaw), snow: seasonAt(x,z).snow > .55 };
  structures.push(b);
  const extent = hypot(w/2+5,d/2+6);
  for (let i = Math.floor((x-extent)/24); i <= Math.floor((x+extent)/24); i++)
    for (let j = Math.floor((z-extent)/24); j <= Math.floor((z+extent)/24); j++) {
      const key = i*128+j;
      if (!lotGrid.has(key)) lotGrid.set(key,[]);
      lotGrid.get(key).push(b);
    }
}
// The inhabited squares remain open around each region's center.
house(-15, -15, 9, 7, 3.2, 2.8, 0.15, 'cottage', 'tea');
house(18, -20, 8, 6, 3, 2.6, -0.2, 'shop', 'brew');
house(-11, -35, 9.2, 7, 3.5, 2.8, 0.15, 'shop', 'dye');
house(22, -38, 8, 6, 3.4, 2.5, -0.15, 'cottage', 'rice');
house(-8, -57, 8.5, 7.5, 3.2, 2.7, 0.04, 'shop', 'tea');
house(37, -83, 9, 7, 3.5, 2.7, -0.17, 'shop', 'dye');
house(44, -56, 8, 8, 3.3, 2.7, 0.1, 'cottage', 'brew');
house(-3, -88, 8.8, 7.3, 3.5, 2.6, -0.1, 'shop', 'brew');
house(-23, -117, 12, 11, 4.3, 14.5, 0, 'pagoda');
house(-48, -127, 11, 8, 4.6, 3.4, 0.09, 'temple');
house(-129, -105, 12, 9.5, 4.3, 3.4, 0.14, 'temple');
house(-174, -112, 8, 7, 3.8, 2.4, -0.12, 'cottage', 'ink');
house(151, -137, 13, 9, 4.2, 3.2, 0.09, 'inn');
house(118, -123, 9, 7, 3.5, 2.8, -0.22, 'cottage', 'tea');
house(173, 133, 8.5, 6.6, 3.4, 3.1, 0.25, 'cottage', 'rice');
house(132, 127, 8, 7, 3.8, 2.8, -0.12, 'cottage', 'rice');
house(-179, 139, 8, 6.8, 3, 2.6, 0.3, 'cottage', 'net');
house(-120, 124, 7, 6, 3.2, 2.6, 0.09, 'cottage', 'net');
house(-34, 49, 6.8, 6, 3.1, 2.5, 0.2, 'shop', 'tea');
house(35, 61, 8, 6.4, 3, 2.7, -0.3, 'cottage', 'net');
// The snow capital has a processional avenue, a side market and a pagoda at its head.
house(-80,-323,13,12,4.4,14.5,.06,'pagoda');
house(-93,-306,10,8,3.9,3.6,.15,'temple');
house(-63,-305,9,8,3.6,3.1,-.12,'shop', 'brew');
house(-99,-281,9.5,7,3.4,3.3,.14,'inn');
house(-59,-277,9,7.6,3.5,3.3,-.28,'shop', 'dye');
house(-96,-264,7.6,7,3.2,3.2,.27, 'cottage', 'rice');
house(-69,-258,8.8,7.5,3.4,3.3,-.24,'shop', 'tea');
house(-114,-303,8.8,7.5,3.4,3.1,.1, 'cottage', 'ink');
house(274,-127,8.6,6.6,3.3,2.8,.29,'shop', 'dye');
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
for (const r of ORIGINAL_REGIONS.slice(1)) for (const [dx, dz] of safeOffsets) clearings.push([r.x + dx, r.z + dz]);
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
    landHeight(x,z,false) < 1.8 ||
    rz < riverHalfWidth(x) + 3 ||
    BUILDINGS.some((b) => abs(x - b.x) < b.w * 0.65 + 3 && abs(z - b.z) < b.d * 0.65 + 3)
  )
    continue;
  if (trees.some((t) => (x - t.x) ** 2 + (z - t.z) ** 2 < 21)) continue;
  const region = originalRegionAt(x, z);
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
  if (abs(x)<225 && abs(z)<224 || landHeight(x,z,false)<2.2 || nearRoad(x,z,2.65)) continue;
  if (safe(x,z,6) || BUILDINGS.some(b => hypot(x-b.x,z-b.z) < max(b.w,b.d)*.76+3)) continue;
  const {snow,autumn,moon,dawn} = originalSeasonAt(x,z);
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
  if (landHeight(x,z,false)<2.1 || nearRoad(x,z,2.65) || safe(x,z,4.2) || hypot(x-285,z+115)<8 ||
      BUILDINGS.some(b=>hypot(b.x-x,b.z-z)<max(b.w,b.d)*.8+3) ||
      trees.some(t=>(x-t.x)**2+(z-t.z)**2<32)) continue;
  trees.push({x,z,h:6.4+fallRng()*4.1,kind:'maple',seed:Math.floor(fallRng()*1e6),autumn:1});
}
const landmarkCount = trees.length;

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
  const target = landmarkCount * 5;
  for (let tried=0; trees.length<target && tried<250000; tried++) {
    const x=random()*628-253, z=random()*748-374;
    const riverBank=abs(z-riverZ(x))-riverHalfWidth(x);
    if (originalShore(x,z)<9 || riverBank<10.5 || nearRoad(x,z,2.7)) continue;
    const region=originalRegionAt(x,z), place=REGIONS[region];
    if (hypot(x-place.x,z-place.z)<20 || safe(x,z,5.8)) continue;
    if (BUILDINGS.some(b=>hypot(b.x-x,b.z-z)<hypot(b.w,b.d)*.52+4)) continue;
    if (BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+4 && abs(z-b.z)<b.length/2+4)) continue;
    if (GATES.some(g=>hypot(x-g.x,z-g.z)<g.w*.75)) continue;
    // Rice plots, bathing pool, the moon-viewing meadow and sunrise festival.
    if ((x>122 && x<184 && z>79 && z<135) || (x>125 && x<169 && z> -123 && z< -80)) continue;
    originalSeasonAt(x,z,season);
    if (season.moon>.4 && x>-78 && z<307 || season.dawn>.48 && x>291 ||
        season.snow>.45 && abs(x+78)<18 && z< -260) continue;
    if (landHeight(x,z,false)<1.9) continue;
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
// Thin the old planting in place. Bamboo positions and growth habits stay stable
// across saves, and all sixty crown forms remain represented.
const isBamboo = t => t.kind === 'bamboo' || t.kind === 'moso';
const regular = trees.filter(t => !isBamboo(t));
const keep = new Set(trees.slice(0,10));
const forms = new Set();
for (const t of regular) {
  if (t.form !== undefined && !forms.has(t.form) && springRadius(t.x,t.z)>1.4) {
    forms.add(t.form); keep.add(t);
  }
}
for (const t of regular.slice().sort((a,b)=>a.seed-b.seed)) {
  if (keep.size >= Math.ceil(regular.length/2)) break;
  if (springRadius(t.x,t.z)>1.4) keep.add(t);
}
export function hasAutumnLeaves(tree) {
  return tree.kind === 'ginkgo' || tree.kind === 'larch' ||
    (tree.kind === 'maple' && (tree.form !== undefined || tree.autumn > .4 || tree.seed % 4 !== 1));
}
// Replant the original clear sites in the maple valley. Roads, landing places
// and bamboo elsewhere keep the same spacing as the original planting.
const valley = trees.filter(t => REGIONS[regionAt(t.x,t.z)].id === 'autumn');
let autumnNeeded = 400 - valley.filter(t => keep.has(t) && hasAutumnLeaves(t)).length;
const emptySites = valley.filter(t => !keep.has(t) && !isBamboo(t));
const mapleFamily = TREE_FAMILIES.findIndex(f => f[0] === 'maple');
for (const t of emptySites.filter(hasAutumnLeaves)) {
  if (!autumnNeeded) break;
  keep.add(t);
  autumnNeeded--;
}
for (const t of emptySites) {
  if (!autumnNeeded) break;
  if (keep.has(t) || t.form === undefined) continue;
  t.kind = 'maple';
  t.form = mapleFamily * TREE_FORMS_PER_FAMILY + t.form % TREE_FORMS_PER_FAMILY;
  keep.add(t);
  autumnNeeded--;
}
// Add new roads after laying out the established groves. Clear only the
// actual verges of the connecting roads, preserving old woodland elsewhere.
export const CONNECTING_ROADS = TRADE_ROADS.map(({width,knots,destination,origin,merchants})=>({
  ...road(width,knots),destination,origin,merchants,
}));
const extensions = [...CONNECTING_ROADS, ...KYO_ROADS.map(([width,knots,paved])=>({...road(width,knots),paved})), {width:3.7,points:INARI_ROUTE}];
for (const avenue of extensions) { ROADS.push(avenue); indexRoad(avenue); }
for (const args of KYO_BUILDINGS) house(...args);
export const TREES = trees.filter(t => !portReserved(t.x,t.z) && !reservedScenery(t.x,t.z) && (isBamboo(t) || keep.has(t)) &&
  (t.form === undefined || !nearRoad(t.x,t.z,2.7)));
// Fill the boundary of the maple district and line the new country roads with
// loose stands of cedar, zelkova and red pine. Keep all gates and views open.
const saplings = seeded(0x5c311);
function transplant(x,z,family) {
  if(abs(x-RASHOMON.x)<19 && abs(z-RASHOMON.z)<29)return false;
  if(portReserved(x,z)||reservedScenery(x,z)||inFireMeadow(x,z))return false;
  if(nearPeachTrunk(x,z,5))return false;
  if (shoreDistance(x,z)<10 || landHeight(x,z)<2 || nearRoad(x,z,3.1) ||
      abs(z-riverZ(x))-riverHalfWidth(x)<11 || safe(x,z,6) ||
      BUILDINGS.some(b=>hypot(b.x-x,b.z-z)<hypot(b.w,b.d)*.52+4.5) ||
      TREES.some(t=>(t.x-x)**2+(t.z-z)**2<24)) return false;
  TREES.push({x,z,kind:TREE_FAMILIES[family][0], form:family*TREE_FORMS_PER_FAMILY+Math.floor(saplings()*4),
    h:5.6+saplings()*6,seed:Math.floor(saplings()*1e6)});
  return true;
}
autumnNeeded = 400 - TREES.filter(t => REGIONS[regionAt(t.x,t.z)].id==='autumn' && hasAutumnLeaves(t)).length;
for(let i=0;autumnNeeded>0 && i<3000;i++) {
  const x=225+saplings()*103,z=-195+saplings()*123;
  if(REGIONS[regionAt(x,z)].id==='autumn' && transplant(x,z,mapleFamily)) autumnNeeded--;
}
// Groves are separated by grassland and rocky shoulders along the longer
// country roads. Keep managed courtyards, pilgrimage paths and views clear.
function protectedDistrict(x,z) {
  return portReserved(x,z) || inCapitalWard(x,z,5) ||
    hypot(x-DISTRICTS.todaiji.x,z-DISTRICTS.todaiji.z+12)<67 ||
    hypot((x-DISTRICTS.peach.x)/133,(z-DISTRICTS.peach.z)/112)<1.02 ||
    (abs(x-DISTRICTS.inari.x+58)<100 && abs(z-DISTRICTS.inari.z-77)<106);
}
const mountainFamily=[0,1,2,2,3,3,4,9];
const lowlandFamily=[1,2,3,8,9,12,12,13];
function wildTree(x,z) {
  if(originalShore(x,z)>12 || protectedDistrict(x,z)) return;
  const highland=(Math.abs(x-DISTRICTS.inari.x+78)<260 && Math.abs(z-DISTRICTS.inari.z-60)<160 && terrainHeight(x,z)>25) || (x < -625 && z < -65 && terrainHeight(x,z)>29);
  const family=highland ? mountainFamily : lowlandFamily;
  transplant(x,z,family[Math.floor(saplings()*family.length)]);
}
for(const avenue of CONNECTING_ROADS) {
  for(let i=5;i<avenue.points.length;i+=4) {
    const [ax,az]=avenue.points[i];
    for(let k=0;k<5;k++) wildTree(ax+(saplings()-.5)*92,az+(saplings()-.5)*92);
  }
}
// Woodland masses off the roads follow the aspect of each slope. Broken
// clusters create openings across the valleys and a distinct high timberline.
for (const [cx,cz,rx,rz] of PENINSULAS) {
  for(let grove=0;grove<13;grove++){
    const x=cx+(saplings()-.5)*rx*1.77,z=cz+(saplings()-.5)*rz*1.77;
    for(let tree=0;tree<17;tree++) wildTree(x+(saplings()-.5)*79,z+(saplings()-.5)*65);
  }
}
// Red pine and cypress take root in pockets between exposed western ledges.
// The blooming floor of the valley and the eastern pass remain in view.
const mountainSaplings=seeded(0x7e382);
for(let i=0;i<1100;i++){
  const x=DISTRICTS.peach.x-250+mountainSaplings()*410,z=DISTRICTS.peach.z-172+mountainSaplings()*289;
  const dx=(x-DISTRICTS.peach.x)/123,dz=(z-DISTRICTS.peach.z)/108,alt=terrainHeight(x,z);
  if(hypot(dx,dz)<.75 || abs(Math.atan2(dz,dx))<.40 || alt<17 || alt>116)continue;
  const slope=hypot(terrainHeight(x+1,z)-alt,terrainHeight(x,z+1)-alt);
  if(slope>.95 || mountainSaplings()<slope*.46)continue;
  transplant(x,z,[0,1,1,2,3][i%5]);
}
// Broken stands trace the long ridges. Red pine favours exposed shoulders,
// while cypress and cedar gather in the lower folds beside the fire meadows.
for(const [east,summit] of [[true,HIGASHIYAMA],[false,KITAYAMA]]) {
  const plant=seeded(east?0x46554b55:0x444149),height=east?eastRidgeHeight:northRidgeHeight;
  for(let i=0;i<1750;i++){
    const along=(plant()-.55)*511, across=(plant()-.5)*573;
    const x=summit.x+(east?along:across),z=summit.z+(east?across:-along);
    const high=height(x,z);
    if(high<7 || inFireMeadow(x,z) || nearRoad(x,z,4) || portReserved(x,z) || protectedDistrict(x,z))continue;
    if(Math.sin(across*.044+along*.013)+Math.sin(along*.055-across*.018)>.93 && plant()<.86)continue;
    if(TREES.some(t=>(t.x-x)**2+(t.z-z)**2<68))continue;
    const family=(high>96?[0,0,1,2,3]:[0,1,2,2,3])[i%5];
    TREES.push({x,z,h:4.5+plant()*(high>116?4.8:7.3),kind:TREE_FAMILIES[family][0],
      form:family*TREE_FORMS_PER_FAMILY+i%4,seed:(east?181033:390901)+i*13});
  }
}
// These shrine cedars use the same forked trunks, needle sprays and moving
// crowns as the surrounding woodland. A clear strip follows every gate.
for(const [i,t] of CEDAR_GROVES.entries()) {
  if(nearRoad(t.x,t.z,2.7) || reservedScenery(t.x,t.z)) continue;
  TREES.push({x:t.x,z:t.z,h:t.h,kind:'cedar',form:2*TREE_FORMS_PER_FAMILY+i%4,seed:61979+i*67});
}
// Fractured shoulders crop out in groups, their long axes sharing a strike.
// They stay clear of riding lanes, of the courtyards and of each bath entrance.
const stoneSeed=seeded(0x11e41);
for(const [cx,cz,rx,rz] of PENINSULAS) {
  for(let bed=0;bed<8;bed++){
    const ax=cx+(stoneSeed()-.5)*rx*1.85,az=cz+(stoneSeed()-.5)*rz*1.8;
    if(originalShore(ax,az)>9 || inFireMeadow(ax,az) || protectedDistrict(ax,az) || shoreDistance(ax,az)<9) continue;
    const yaw=.88*sin(az*.019)+.63, c=cos(yaw),s=sin(yaw);
    const high=terrainHeight(ax,az)>35;
    for(let n=0;n<5;n++){
      const along=stoneSeed()*14-7, side=stoneSeed()*6-3;
      const x=ax+c*along+s*side,z=az-s*along+c*side;
      const scale=(n===0?1.7:.48)+stoneSeed()*(high?2.05:1.56);
      const rx=scale*(1.04+stoneSeed()*.68),rz=scale*(.61+stoneSeed()*.34);
      if(nearRoad(x,z,rx+2.6) || inFireMeadow(x,z) || reservedScenery(x,z) || protectedDistrict(x,z) ||
         shoreDistance(x,z)<3 || TREES.some(t=>(t.x-x)**2+(t.z-z)**2<(rx+.45)**2))continue;
      ROCKS.push({x,z,rx,rz,h:scale*(high?1.16:.78),yaw:yaw+(stoneSeed()-.5)*.32,
        stratum:(bed+n)%4,tint:high?'#b7beb9':cz>0?'#cbc2a9':'#c6cbaf'});
    }
  }
}
// The open side faces the wayfarer. Plant the back and side of each water
// garden with the same full branch and root models used in its native woods.
for(const s of RETREATS){
  const family={peach:7,cedar:2,coast:0,slate:3}[s.kind];
  if(family===undefined)continue;
  const spots=s.kind==='cedar'?[[-6,-8],[5,-9],[6,-6],[-7,-5]]:[[-6,-7],[6,-5],[-7,-2]];
  for(const [i,[u,v]] of spots.entries()){
    const [x,z]=sitePoint(s,u,v);
    if(nearRoad(x,z,3)||TREES.some(t=>hypot(t.x-x,t.z-z)<3))continue;
    TREES.push({x,z,kind:TREE_FAMILIES[family][0],form:family*4+i,seed:94071+i+41*s.index,
      h:(s.kind==='cedar'?9.3:s.kind==='slate'?4.4:5.7)+i*.54});
  }
}
ROCKS.push(...offshoreReefs(terrainHeight,shoreDistance,seeded(0x687063)));
// Respect the same surveyed yards whatever the seeded planting sequence.
// Cut after planting so a cleared trunk does not reshuffle distant woods.
for(let i=TREES.length-1;i>=0;i--){
  const {x,z}=TREES[i],hut=nearbyHut(x,z);
  if(hut && (hypot(x-hut.x,z-hut.z)<=8 || inHutYard(x,z))) TREES.splice(i,1);
}
export const LANDMARK_TREES = TREES.filter(t => t.form === undefined);

// The shrine's small bamboo stands are planted individually between its
// lanterns. Share the exact leaning culms with the painter and the path grid.
export const SHRINE_BAMBOO=[];
{
  const grove=REGIONS.find(r=>r.id==='shrine'), random=seeded(92327);
  const openings=[[-4,1],[-13,-9],[6,14],[15,-11],[-9,15],[-17,4],[12,5],
    [-4,5],[4,-7],[6,-7],[-7,-12],[10,-15],[-19,5],[-8.7,-5.6]];
  const clusters=[[-11,18],[10,21],[12,7],[-12,8],[-15,-2],[9,-4],[15,-13],
    [-14,-19],[4,-20],[-21,0],[16,-23],[13,25],[-10,23]];
  for(const [dx,dz] of clusters) for(let i=0;i<9;i++) {
    const x=grove.x+dx+(random()-.5)*6, z=grove.z+dz+(random()-.5)*6;
    if(nearRoad(x,z,1) || openings.some(([u,v])=>hypot(x-grove.x-u,z-grove.z-v)<2.4)) continue;
    const height=5.2+random()*3.8, sx=(random()-.5)*.94, sz=(random()-.5)*.86, radius=.063+random()*.04;
    const sprays=Array.from({length:3},()=>({angle:random()*2*Math.PI,width:1.68+random()*.71,
      height:1.03+random()*.53,tilt:(random()-.5)*.72}));
    SHRINE_BAMBOO.push({x,z,height,sx,sz,radius,sprays,tint:i%3?'#9ba575':'#b7bd86'});
  }
}
// Individual stones leave real bathing entrances on the avenue, at the
// south bank, and at the steps to the washing pavilion.
export const SPRING_STONES = [];
const springRng=seeded(82691);
for(let i=0;i<75;i++) {
  const a=i*Math.PI*2/75, dx=Math.cos(a), dz=Math.sin(a);
  if (dx<-.91 && abs(dz)<.26 || dz>.88 && dx>-.1 && dx<.46 || dz<-.90 && abs(dx)<.26) continue;
  const x=dx*SNOW_SPRING.rx*(.98+.024*springRng()),z=dz*SNOW_SPRING.rz*(.98+.025*springRng());
  const w=.65+.55*springRng(),h=.44+.79*springRng(),d=.64+.45*springRng();
  SPRING_STONES.push({x,z,w,h,d,yaw:-a+springRng()*.36,roll:springRng()*.2,index:i});
}
export const BATH_STEPS=Array.from({length:6},(_,i)=>({z:-4.70-i*.52,top:-.45+i*.197}));
const cells = new Map();
function cell(x, z) {
  return Math.floor(x / 16) + ',' + Math.floor(z / 16);
}
function putSolid(x, z, rx, rz, yaw, top, kind, support, roofRise = 0, bottom = -Infinity) {
  // A ceiling records the underside of a beam. A slab records its top.
  if (kind === 'ceiling') { bottom = top; top += .13; }
  if (kind === 'slab' && bottom === -Infinity) bottom = top - .13;
  const item = { x, z, rx, rz, c: cos(yaw), s: sin(yaw), top, kind, support, roofRise, bottom };
  // Include the turning clearance of the largest ground animal (the shishi).
  const r = hypot(rx, rz) + 6.8;
  for (let a = Math.floor((x - r) / 16); a <= Math.floor((x + r) / 16); a++)
    for (let b = Math.floor((z - r) / 16); b <= Math.floor((z + r) / 16); b++) {
      const id = a + ',' + b;
      if (!cells.has(id)) cells.set(id, []);
      cells.get(id).push(item);
    }
  return item;
}
for (const b of BUILDINGS) {
  const plan = roomPlan(b);
  function localSolid(u, v, width, depth, height, kind, support, bottom=-Infinity) {
    const x = b.x + u * cos(b.yaw) + v * sin(b.yaw);
    const z = b.z - u * sin(b.yaw) + v * cos(b.yaw);
    putSolid(x, z, width / 2, depth / 2, b.yaw, b.y + height, kind, support,0,b.y+bottom);
  }
  localSolid(0, 0, b.w + 1.1, b.d + 1.08, 0.42, 'floor', true);
  localSolid(0, 0, plan.width, plan.depth, plan.floor, 'floor', true);
  for (let j = 0; j < 3; j++)
    localSolid(0, b.d / 2 + 0.48 + j * 0.39, b.w * 0.48, 0.46, 0.32 - j * 0.19, 'floor', true);
  for (const wall of plan.walls)
    localSolid(wall.u, wall.v, wall.width, wall.depth, plan.ceiling, 'wall', false);
  if (b.kind === 'pagoda') {
    const tower=pagodaPlan(b);
    for(const wall of tower.panels)
      localSolid(wall.u,wall.v,wall.width,wall.depth,wall.y+2.50*tower.scale,'wall',false,wall.y);
    for (const tread of tower.slabs)
      localSolid(tread.u,tread.v,tread.w,tread.d,tread.top,'slab',true,tread.top-tread.thickness);
    for (const [i,storey] of tower.storeys.entries()) {
      const {y,w,d}=storey, eave=y+2.60*tower.scale, cap=i===4;
      const outerW=w*1.33, outerD=d*1.33;
      // The lower eaves shelter the outer gallery; the central well is open.
      const roof=putSolid(b.x,b.z,outerW/2,outerD/2,b.yaw,b.y+eave,'pagodaEave',true,(cap?2.05:1.19)*tower.scale);
      roof.aperture=cap?.052:.51;
      localSolid(0,0,.19,1.9,y+2.66*tower.scale,'ceiling',false);
    }
  } else {
    localSolid(0, 0, b.w * 1.08, b.d * 1.08, plan.ceiling, 'ceiling', false);
    const roof = putSolid(b.x, b.z, b.w * 0.62, b.d * 0.64, b.yaw, b.y + b.wall + 0.29, 'roof', true, b.roof);
    roof.form = roofForm(b);
    for (const cap of [plan.porch, plan.monitor]) {
      if (!cap) continue;
      const cx=b.x+cap.u*b.cos+cap.v*b.sin, cz=b.z-cap.u*b.sin+cap.v*b.cos;
      putSolid(cx,cz,cap.width*.5,cap.depth*.5,b.yaw+cap.rotation,
        b.y+cap.eave,'roof',true,cap.rise);
    }
    if (plan.porch) for (const side of [-1,1])
      localSolid(side*b.w*.207,plan.porch.v+b.d*.19,.15,.16,plan.porch.eave,'wall',false);
    if (b.kind === 'wardShop') {
      const awning = (v,w,d,y,rise) => putSolid(b.x+v*b.sin,b.z+v*b.cos,w/2,d/2,b.yaw,b.y+y,'roof',true,rise);
      awning(b.d/2+.15,b.w*1.01,1.29,2.90,.36);
      if (b.wall>5) {
        awning(b.d/2+.13,b.w+.20,.79,4.29,.25);
        localSolid(0,b.d/2,b.w,.16,5.64,'wall',false,3.38);
      }
    }
    if(b.kind==='wardShop' && b.wall>5)for(const q of wardFloorPlan(b).slabs)
      localSolid(q.x,q.z,q.w,q.d,q.top,'slab',true);
    if (plan.workbench) {
      const f = plan.workbench;
      localSolid(f.u, f.v, f.width, f.depth, plan.floor + f.height, 'box', true);
    }
  }
}
// A folded street screen can stand between a pilgrim and the orbiting
// camera. Give each leaf the same hinge position as its painted face.
for(const {x,z,width,height,yaw} of KYO_SCREENS) {
  const base=terrainHeight(x,z), c=cos(yaw), s=sin(yaw);
  putSolid(x,z,width*.5+.12,.34,yaw,base+.37,'box',true);
  for(let i=0;i<4;i++) {
    const u=((i+.5)/4-.5)*width, from=screenFold(i/4),to=screenFold((i+1)/4);
    const v=(from+to)*.5, turn=yaw-Math.atan2(to-from,width/4);
    putSolid(x+c*u+s*v,z-s*u+c*v,hypot(width/4,to-from)/2+.03,.056,turn,
      base+height+.54,'wall',false);
  }
}
for(const {hearths} of STREET_BEATS)for(const {x,z} of hearths)
  putSolid(x,z,.48,.48,0,terrainHeight(x,z)+1.68,'oval',false);
gateSolids(terrainHeight,putSolid);
pilgrimageSolids(terrainHeight,putSolid);
civicAndBathSolids(terrainHeight,putSolid);
hutSolids(terrainHeight,putSolid);
portSolids(putSolid);
for(const stone of SPRING_STONES) {
  putSolid(SNOW_SPRING.x+stone.x,SNOW_SPRING.z+stone.z,stone.w*.84,stone.d*.84,stone.yaw,
    SNOW_SPRING.level+.18+stone.h,'oval',true);
}
for(const step of BATH_STEPS) putSolid(SNOW_SPRING.x,SNOW_SPRING.z+step.z,1.32,.265,0,
  SNOW_SPRING.level+step.top,'floor',true);
// The snow pavilion has an open front and a slatted rear wall.
const pavilionZ=SNOW_SPRING.z-8.9, pavilionBase=SNOW_SPRING.level+.52;
putSolid(SNOW_SPRING.x,pavilionZ,4.70,2.095,0,pavilionBase+3.56,'roof',true,1.46);
for (const dx of [-3.67,0,3.67]) for (const dz of [-1.13,1.06])
  putSolid(SNOW_SPRING.x+dx,pavilionZ+dz,.095,.095,0,pavilionBase+3.50,'wall',false);
putSolid(SNOW_SPRING.x,pavilionZ-1.30,4.06,.11,0,pavilionBase+3,'wall',false);
putSolid(SNOW_SPRING.x,SNOW_SPRING.z-8.9,3.90,1.55,0,SNOW_SPRING.level+.61,'floor',true);
for (const [x, z, yaw] of MARKET_STALLS) {
  const base=terrainHeight(x,z), c=cos(yaw), s=sin(yaw);
  for (const u of [-1.64,1.64]) for (const v of [-.79,1.07])
    putSolid(x+u*c+v*s,z-u*s+v*c,.059,.059,0,base+(v<0?3.28:2.53),'oval',false);
  putSolid(x+.12*s,z+.12*c,3.83/2,1.12,yaw,base+2.65,'awning',true);
  putSolid(x + 0.42 * sin(yaw), z + 0.42 * cos(yaw), 1.57, 0.42, yaw, terrainHeight(x, z) + 0.93, 'box', true);
}
for(const {x,z,yaw} of KYO_FOOD) {
  const base=terrainHeight(x,z), c=cos(yaw), s=sin(yaw);
  putSolid(x,z,1.975,1.1,yaw,base+2.56,'roof',true,.79).form='hip';
  putSolid(x+.24*s,z+.24*c,1.49,.525,yaw,base+.963,'box',true);
  for(const u of [-1.57,1.57])for(const v of [-.78,.66])
    putSolid(x+u*c+v*s,z-u*s+v*c,.068,.068,0,base+2.58,'oval',false);
}
putSolid(-161.7,-90.6,1.84,.44,1.18,terrainHeight(-161.7,-90.6)+2.08,'roof',true,.44);
putSolid(-161.7, -90.6, 1.65, 0.24, 1.18, terrainHeight(-161.7, -90.6) + 1.93, 'box', false);
for (const r of ROCKS) putSolid(r.x, r.z, r.rx, r.rz, r.yaw || 0, terrainHeight(r.x, r.z) + r.h, 'oval', true);
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
for(const t of SHRINE_BAMBOO) {
  // One low and one high span approximate the lean without a thick invisible wall.
  for(let k=0;k<2;k++) {
    const f=(k+.5)/2, radius=t.radius+Math.hypot(t.sx,t.sz)*.25, y=terrainHeight(t.x,t.z);
    putSolid(t.x+t.sx*f,t.z+t.sz*f,radius,radius,0,y+t.height*(k+1)/2,'oval',false,0,y+t.height*k/2-.1);
  }
}
function lampSolid(x,z,scale) {
  const base=terrainHeight(x,z);
  putSolid(x,z,.23*scale,.23*scale,0,base+1.67*scale,'oval',false);
  putSolid(x,z,.50*scale,.50*scale,0,base+2.15*scale,'oval',false,0,base+1.23*scale);
}
for (const g of GATES) {
  const base=terrainHeight(g.x,g.z);
  putSolid(g.x,g.z,g.w*.455,.195,g.yaw,base+g.h*.754,'slab',true,0,base+g.h*.696);
  putSolid(g.x,g.z,.155,.15,g.yaw,base+g.h*.95,'wall',false,0,base+g.h*.74);
  const crown=putSolid(g.x,g.z,g.w*.55,g.w*.055,g.yaw,base+g.h*.973,'toriiCrown',true,g.h*.076);
  crown.thickness=g.h*.087;
  for (const sign of [-1, 1]) {
    const x = g.x + sign * g.w * 0.36 * cos(g.yaw),
      z = g.z - sign * g.w * 0.36 * sin(g.yaw);
    putSolid(x, z, g.w * 0.045, g.w * 0.045, 0, base + g.h, 'oval', false);
    lampSolid(g.x+sign*g.w*.57,g.z+1.6,g===GATES[0]?1.16:1);
  }
}
for (const b of BRIDGES) for (const sign of [-1,1]) {
  const x=b.x+sign*(b.halfWidth-.13);
  const rail=putSolid(x,b.z,.105,b.length/2,0,1.21,'bridgeRail',false);
  rail.bridge=b;
  for(let j=1;j<=14;j+=3) {
    const z=b.z+b.length*(j/14-.5);
    putSolid(x,z,.17,.17,0,bridgeHeight(b,z),'wall',false,0,-.95);
  }
  lampSolid(b.x+sign*(b.halfWidth+.94),b.z+b.length/2+.48,.91);
}

function surfaceHeight(s, x, z, pad) {
  const dx = x - s.x,
    dz = z - s.z,
    a = dx * s.c - dz * s.s,
    b = dx * s.s + dz * s.c;
  if (s.kind === 'kettleRim') {
    const r2=a*a+b*b;
    return r2<=(s.rx+.045+pad)**2 && r2>=(s.rx-.11-pad)**2 ? s.top : -Infinity;
  }
  if (s.kind === 'oval' || s.kind === 'springRock') {
    const r2 = (a / (s.rx + pad)) ** 2 + (b / (s.rz + pad)) ** 2;
    if (r2 > 1) return -Infinity;
    return s.kind === 'oval' ? s.top : s.top - s.roundHeight * (1 - Math.sqrt(1-r2));
  }
  if (abs(a) > s.rx + pad || abs(b) > s.rz + pad) return -Infinity;
  if (pad > 0 && max(0,abs(a)-s.rx)**2 + max(0,abs(b)-s.rz)**2 > pad*pad) return -Infinity;
  if (s.kind === 'roof' || s.kind === 'pagodaEave') {
    const h = roofProfile(s.kind === 'pagodaEave' ? 'pagoda' : s.form,
      a/s.rx,b/s.rz,s.aperture,pad/s.rx,pad/s.rz);
    return h === -Infinity ? h : s.top + h*s.roofRise;
  }
  if (s.kind === 'awning') {
    const u = sat(.5+a/(2*s.rx)), v = sat(.5+b/(2*s.rz));
    return s.top + 1.1*(.58-.72*v-.085*sin(Math.PI*u)-.07*sin(Math.PI*v)+.021*cos(u*8*Math.PI));
  }
  if (s.kind === 'bridgeRail') return bridgeHeight(s.bridge,z) + s.top;
  if (s.kind === 'toriiCrown') return s.top + s.roofRise*(min(1,abs(a)/s.rx)**2.8);
  return s.top;
}
// feet limits which storey can support an actor. Without a height hint,
// terrain queries (objects, spawn points and the atlas) use the lower storey.
function highest(x, z, pad, feet, supportOnly, body = 1.42) {
  let height = -Infinity;
  const items = cells.get(cell(x, z));
  if (items) for (const item of items) {
    if (feet + body < item.bottom) continue;
    if (supportOnly && feet === -Infinity && !item.support) continue;
    const sheet = item.kind === 'roof' || item.kind === 'pagodaEave' ||
      item.kind === 'awning' || item.kind === 'toriiCrown';
    const top = surfaceHeight(item,x,z,item.kind==='slab' && feet!==Infinity ? 0 : pad);
    // Posts and upright walls block walking from the side. A falling
    // character can still come to rest on their exposed upper face.
    if (top === -Infinity || supportOnly && !item.support && feet < top-.015) continue;
    if (item.kind === 'slab' && feet < top-.34) continue;
    if (sheet) {
      if (feet < top - .34 && (supportOnly || feet + body <= lowerFace(item,top))) continue;
    }
    if (item.kind === 'bridgeRail' && feet+body <= lowerFace(item,top)) continue;
    height = max(height,top);
  }
  return height;
}
export const solidHeightAt = (x, z, clearance = 0, y = Infinity) => highest(x, z, clearance, y, false);
// The swimming line is part of locomotion even when grass mochi passes through scenery.
export function landscapeFloor(x, z) {
  return max(WATER_Y - 0.57, terrainHeight(x, z));
}
export function groundHeight(x, z, feet = -Infinity) {
  const b = bridgeAt(x, z);
  const deck = b ? bridgeHeight(b, z) : -Infinity;
  const onBridge = b && (feet === -Infinity || feet >= deck - .36);
  return max(onBridge ? deck : -Infinity, landscapeFloor(x, z), highest(x, z, 0, feet, true));
}
export function waterDepth(x, z) {
  return max(0, waterSurfaceAt(x,z) - terrainHeight(x, z));
}
function lowerFace(item,top) {
  if (item.kind === 'roof' || item.kind === 'pagodaEave') return top - (item.thickness ?? Math.max(.10,item.form==='hip'?.09*item.roofRise:0));
  if (item.kind === 'awning') return top-.044;
  if (item.kind === 'bridgeRail') return top-1.65;
  if (item.kind === 'toriiCrown') return top-item.thickness;
  return item.bottom;
}
export function overheadHeight(x, z, feet, radius = 0) {
  const bridge = bridgeAt(x,z);
  const deck = bridge ? bridgeHeight(bridge,z) : -Infinity;
  let ceiling = feet < deck - .34 ? deck - .235 : Infinity;
  for (const item of cells.get(cell(x,z)) || []) {
    const top = surfaceHeight(item,x,z,item.kind==='slab' ? 0 : radius);
    if (top <= feet + .34) continue;
    const bottom = lowerFace(item,top);
    if (bottom === -Infinity) continue;
    // A footprint may overlap the next tread on its way upstairs. Landings
    // at the next storey still have a real underside above the climber.
    if (item.kind === 'slab' && bottom < feet+.42) continue;
    if (bottom > feet) ceiling = min(ceiling,bottom);
  }
  return ceiling;
}
const palaceBed = terrainHeight(RYUGU.x,RYUGU.z);
export function staticVolumeAt(x,z,feet,radius=.24,body=1.42) {
  if (terrainHeight(x,z) > feet+.001 || palaceSolid(x,z,feet,palaceBed,body,radius)) return true;
  const bridge=bridgeAt(x,z);
  if (bridge) {
    const deck=bridgeHeight(bridge,z);
    if (deck > feet+.001 && deck-.235 < feet+body) return true;
  }
  for (const item of cells.get(cell(x,z)) || []) {
    if (item.bottom >= feet+body) continue;
    const top=surfaceHeight(item,x,z,radius);
    if (top > feet+.001 && lowerFace(item,top) < feet+body) return true;
  }
  return false;
}
export function canOccupy(x,z,feet,radius=.24,bodyHeight=1.42) {
  return highest(x,z,radius,feet,false,bodyHeight) <= feet+.34 &&
    overheadHeight(x,z,feet,radius) >= feet+bodyHeight;
}
export function canLand(x, z, feet) {
  const floor = groundHeight(x, z, feet);
  return canOccupy(x,z,feet ?? floor,.12);
}
function sidePenetration(item,x,z,feet,radius,body) {
  const top=surfaceHeight(item,x,z,radius);
  if (top <= feet+.34 || lowerFace(item,top) >= feet+body) return 0;
  const dx=x-item.x,dz=z-item.z;
  const a=abs(dx*item.c-dz*item.s),b=abs(dx*item.s+dz*item.c);
  if(item.kind==='kettleRim'){
    const r=hypot(a,b);
    return min(item.rx+.045+radius-r,r-(item.rx-.11-radius));
  }
  if(item.kind==='oval' || item.kind==='springRock')
    return (1-hypot(a/(item.rx+radius),b/(item.rz+radius)))*min(item.rx+radius,item.rz+radius);
  return radius-hypot(max(0,a-item.rx),max(0,b-item.rz))-min(0,max(a-item.rx,b-item.rz));
}
function leavingOverlap(x,z,nx,nz,feet,radius,body) {
  // A restored position or a wider mount can begin just inside a corner.
  // Permit strides that reduce that overlap without entering another solid.
  let improves=false;
  for(const item of cells.get(cell(nx,nz)) || []) {
    const next=sidePenetration(item,nx,nz,feet,radius,body);
    if(next<=0)continue;
    const previous=sidePenetration(item,x,z,feet,radius,body);
    if(previous<=0 || next>previous+.000001)return false;
    if(next<previous-.000001)improves=true;
  }
  return improves;
}
// Project the blocked part of a stride along the face actually touched.
// Choosing a world axis here drifts sideways against rotated walls even
// when the player walks straight into them, then snags on the next post.
function wallSlide(x,z,nx,nz,feet,radius,body,free) {
  const dx=wrapDelta(nx-x),dz=wrapDelta(nz-z);
  for(const item of cells.get(cell(nx,nz)) || []) {
    const top=surfaceHeight(item,nx,nz,radius);
    if(top<=feet+.34 || lowerFace(item,top)>=feet+body)continue;
    const a=(x-item.x)*item.c-(z-item.z)*item.s;
    const b=(x-item.x)*item.s+(z-item.z)*item.c;
    let u,v;
    if(item.kind==='kettleRim'){
      const sign=hypot(a,b)<item.rx-.0325?-1:1;
      u=sign*a;v=sign*b;
    }else if(item.kind==='oval' || item.kind==='springRock') {
      u=a/(item.rx+radius)**2;v=b/(item.rz+radius)**2;
    }else{
      u=Math.sign(a)*max(0,abs(a)-item.rx);
      v=Math.sign(b)*max(0,abs(b)-item.rz);
      if(!u && !v)continue;
    }
    const span=hypot(u,v);
    if(!span)continue;
    const normalX=(u*item.c+v*item.s)/span, normalZ=(-u*item.s+v*item.c)/span;
    const inward=dx*normalX+dz*normalZ;
    if(inward>=0)continue;
    const tx=wrapCoord(nx-inward*normalX),tz=wrapCoord(nz-inward*normalZ);
    if(free(tx,tz))return {x:tx,z:tz};
  }
  return null;
}
export function constrainMove(fromX, fromZ, toX, toZ, aboveGround = 0, feetY = groundHeight(fromX, fromZ) + aboveGround, radius = .24, bodyHeight = 1.42) {
  const dx = wrapDelta(toX - fromX), dz = wrapDelta(toZ - fromZ);
  const steps = max(1, Math.ceil(hypot(dx, dz) / .25));
  let x = fromX, z = fromZ;
  for (let i = 0; i < steps; i++) {
    const feet = max(feetY, groundHeight(x, z, feetY));
    const free = (nx,nz) => canOccupy(nx,nz,feet,radius,bodyHeight);
    const nx = wrapCoord(x + dx / steps), nz = wrapCoord(z + dz / steps);
    if (free(nx,nz) || !free(x,z) && leavingOverlap(x,z,nx,nz,feet,radius,bodyHeight)) { x=nx; z=nz; }
    else {
      const slide=wallSlide(x,z,nx,nz,feet,radius,bodyHeight,free);
      if(slide){x=slide.x;z=slide.z;}
      else if (nx !== x && free(nx, z)) x = nx;
      else if (nz !== z && free(x, nz)) z = nz;
    }
  }
  return { x, z };
}
