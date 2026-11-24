import { addCooksPlatformSolids, addCookwareSolids, addLivingSolids, marketCookCanopy, marketCooktop } from './living-layout.js';
import { rockParts } from './rock-forms.js';
import { mountRockContact, mountScannedContact, rockRange } from './rock-contact.js';
import {groveWood,groundedCulms,landmarkWood,pilgrimageWood,woodContact} from './wood-contacts.js';
import { onSuzuriLand,okaHeight,suzuriBedElevation } from './suzuri-basin-plan.js';
import { bathPools,bathLocal,poolAt,stationRadius } from './bath-places.js';
import { addPilgrimBathSolids,pilgrimStations,tideRise } from './pilgrim-bathing-plan.js';
import { pilgrimRoofContact,snowLamp } from './pilgrim-lodge-plan.js';
import { SNOW_TOWN, FOREST_LAKE, SNOW_PASS, LAKE_ISLET, isletRadius, snowPoint, lakeRadius, lakePoint } from './snow-country.js';
import { LAKE_WILLOWS, LAKE_ANIMALS } from './lake-grove-layout.js';
import { lakeHokoraSolids } from './lake-hokora-layout.js';
import { kaedeDragonShrineSolids } from './kaede-dragon-layout.js';
import { WINTER_REEFS } from './winter-reefs.js';
import { addSeasonalSolids } from './seasonal-fixtures.js';
import { houseCandles,houseFrontLamps,COURT_CANDLES } from './lamp-layout.js';
import { MOUNTAIN_STREAMS, SOURCE_STONES, mountainStreamTerrain, mountainStreamWaterAt, inMountainStreamClearing } from './mountain-streams.js';
import { MAPLE_BRIDGE, mapleDeckHeight, mapleApproachHeight, mapleBridgeFootings } from './maple-crossing.js';
import { nearbyHut, inHutYard, clearingWeight, hutSolids, KETTLE } from './wayside-hut-layout.js';
import { plantMountainWoods, growNishiyamaBamboo, isNishiyamaTree } from './mountain-woodland.js';
import { RYUGU, PALACE_BED, PALACE_SHELL, palacePoint, palaceSolid, palaceWaterlineAt, boardingHeightAt } from './ryugu-layout.js';
import { addSazaeBathSolids, SAZAE_SPRING, SAZAE_POOLS } from './ryugu-shell-bath.js';
import { KIYOMIZU_APPROACH, kiyomizuTerrain, kiyomizuSolids, kiyomizuClearing, kiyomizuViewTree } from './kiyomizu-layout.js';
import { HIGASHIYAMA, KITAYAMA, NISHIYAMA, KYO_LOOKOUTS, FIRE_COAST, earlierFireRidgeHeight, earlierWestRidgeHeight, kyoRidgeHeight, eastRidgeHeight, northRidgeHeight, westRidgeHeight, inFireMeadow, createFireTreeCeiling, fireTrailDistance } from './higashiyama.js';
import { offshoreReefs } from './tidal-reefs.js';
import { portTerrain,portShore,portSolids,portReserved,SEAPORTS,portPoint } from './seaport-layout.js';
import { DISTRICTS, districtPoint, WORLD_BOUND, WATER_Y, TERRAIN_TILES, TERRAIN_SUBDIVISIONS, wrapWorld } from './geography.js';
import { snowBathLip } from './main-bath-outlines.js';
import { springGroundSurvey } from './spring-ground-survey.js';
import { COURT, RETREATS, sitePoint, courtTerrain, bathTerrain, bathRadius, nearbyRetreat, reservedScenery, civicAndBathSolids } from './retreat-layout.js';
import { KYO_BUILDINGS, KYO_ROADS, KYO_FOOD, KYO_SCREENS, screenFold, inCapitalWard, wardFloorPlan, gateSolids, gateStoneRise, RASHOMON } from './kyo-layout.js';
import { FERRY_CURTAIN, ferryCurtainPoint } from './festival.js';
import { CEDAR_GROVES, CLIFF_PINES, PEACH_TREES, INARI_ROUTE, nearPeachTrunk, pilgrimageHeight, pilgrimageSolids } from './pilgrimage-layout.js';
import { TRADE_ROADS, freightRoadEarthwork } from './trade-routes.js';
import { STREET_BEATS } from './street-watch-layout.js';
import { forestForm, TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';
import { roomPlan, pagodaPlan, roofForm, roofProfile, houseRoof, roofSkinDepth, roofWallContacts } from './architecture.js';
// Coordinates and dimensions are metres. Positive Z is south.
const ORIGINAL_BOUND = 416;
export const BOUND = WORLD_BOUND;
export { WATER_Y };
export const wrapCoord = v => wrapWorld(v);
export const wrapDelta = wrapCoord;
export const ORIGINAL_REGIONS = [
  { id: 'river', name: '桜川の渡し', x: 0, z: 59 },
  { id: 'shrine', name: '竹隠れの社', x: -153, z: -85 },
  { id: 'market', name: '蔵町の市', x: 17, z: -64 },
  { id: 'spring', name: '湯けむり峠', x: 144, z: -107 },
  { id: 'terraces', name: '月見の棚田', x: 156, z: 105 },
  { id: 'coast', name: '海風の松原', x: -149, z: 111 },
  { id: 'snow', name: '雪灯りの街', ...SNOW_TOWN, districtScaleX:1.38 },
  { id: 'autumn', name: '錦秋の楓峡', x: 285, z: -115 },
  { id: 'moon', name: '十五夜の薄野', x: -55, z: 290 },
  { id: 'dawn', name: '初日の出の浦', x: 302, z: 175, port:[304,180] },
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
    const squared=(Math.min(dx,2*halfSpan-dx)*(place.districtScaleX ?? 1))**2 + Math.min(dz,2*halfSpan-dz)**2;
    if (squared < distance) { distance=squared; best=i; }
  }
  return best;
}
export const regionAt = (x,z) => nearestRegion(wrapCoord(x),wrapCoord(z),REGIONS,BOUND);
const plantingRegions = ORIGINAL_REGIONS.map(r=>r.id==='snow' ? FOREST_LAKE : r);
const originalRegionAt = (x,z) => nearestRegion(x,z,plantingRegions,ORIGINAL_BOUND);
const { sin, cos, exp, abs, min, max, hypot } = Math;
const sat = (t) => max(0, min(1, t));
const smooth = (a, b, x) => {
  const t = sat((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Regional colour and weather follow a broad transition around each landmark.
function seasonalFields(x,z,out,delta,snow) {
  function weight(cx,cz,rx,rz) {
    const a=delta(x-cx)/rx, b=delta(z-cz)/rz;
    return 1-smooth(.40,1.02,a*a+b*b);
  }
  out.snow=weight(snow.x,snow.z-3,174,119);
  out.autumn=weight(292,-122,116,139);
  out.moon=weight(-55,300,162,116);
  out.dawn=weight(305,178,107,129);
  return out;
}
export const seasonAt = (x,z,out={}) => seasonalFields(x,z,out,wrapDelta,SNOW_TOWN);
// The seed fields of established woodland use the dimensions of the original island.
const originalDelta = v => v > ORIGINAL_BOUND ? v-2*ORIGINAL_BOUND : v < -ORIGINAL_BOUND ? v+2*ORIGINAL_BOUND : v;
const originalSeasonAt = (x,z,out={}) => seasonalFields(x,z,out,originalDelta,FOREST_LAKE);
// Survey the same cubic bends in plan and elevation. A short cut into each
// spur keeps the cart road on a walkable grade, with feathered earth banks.
const passCells=new Map();
const passPoints=road(5.3,SNOW_PASS).points;
for(let i=1;i<passPoints.length;i++){
  const a=passPoints[i-1],b=passPoints[i];
  const dx=b[0]-a[0],dz=b[1]-a[1],length=hypot(dx,dz);
  const segment={x:a[0],z:a[1],base:a[2],dx,dz,rise:b[2]-a[2],length,inverse:1/(length*length)};
  for(let u=Math.floor((min(a[0],b[0])-15)/24);u<=Math.floor((max(a[0],b[0])+15)/24);u++)
    for(let v=Math.floor((min(a[1],b[1])-15)/24);v<=Math.floor((max(a[1],b[1])+15)/24);v++){
      const key=u*256+v;
      if(!passCells.has(key))passCells.set(key,[]);
      passCells.get(key).push(segment);
    }
}
function passHeight(x,z,ground) {
  if(x<350 || x>689 || z< -1133 || z> -929)return ground;
  const arcs=passCells.get(Math.floor(x/24)*256+Math.floor(z/24));
  if(!arcs)return ground;
  let best=225,elevation=0,weights=0,nearest=ground;
  for(const s of arcs) {
    const t=sat(((x-s.x)*s.dx+(z-s.z)*s.dz)*s.inverse);
    const distance=(x-s.x-s.dx*t)**2+(z-s.z-s.dz*t)**2;
    if(distance>=225)continue;
    const y=s.base+s.rise*t;
    if(distance<best){best=distance;nearest=y;}
    // Along the inside of a hairpin both branches shape the same bank.
    // Blend their cuttings by distance to leave one continuous earth slope.
    const taper=1-distance/225;
    const weight=s.length*taper*taper/(3+distance);
    weights+=weight;
    elevation+=weight*y;
  }
  if(!weights)return ground;
  const level=nearest+(elevation/weights-nearest)*smooth(.65,2.8,Math.sqrt(best));
  const blend=(1-smooth(4.5,15,Math.sqrt(best)))*smooth(350,366,x)*(1-smooth(670,689,x));
  return ground+(level-ground)*blend;
}
const hill = (x, z, cx, cz, rx, rz) => exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
export const riverZ = (x) => 18 + 9 * sin(x / 51) + 3.3 * sin(x / 25);
export const riverHalfWidth = (x) => 8.6 + 1.9 * sin(x / 38 + 0.35) + 0.95 * sin(x / 14);
// The last bends fan into tidal flats on either shore. Inland the old survey
// remains the centreline used for the three timber bridges and riparian woods.
export const riverMouthFlare = x => max(
  smooth(197,248,-x)*(1-smooth(252,269,-x)), smooth(340,392,x)*(1-smooth(398,415,x)));
export const coastX = (z) => -250 + 64 * exp(-(((z - 112) / 75) ** 2)) + 5.5 * sin(z / 23);
export const eastCoastX = (z) => 374 - 48 * exp(-(((z-176)/99)**2)) + 7 * sin(z/36);
function originalShore(x, z) {
  // Four gently curving beaches meet a shared, level seabed before each seam.
  const ends = 375 + 7*sin(x/41) + 4*cos(x/22);
  return min(x-coastX(z), eastCoastX(z)-x, ends-abs(z));
}
// Signed shore distances unite the original coast with three peninsulas. The
// western bay remains open to the sea between the peach valley and the temple.
const templeHeadland = [112,382,210,166];
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
  templeHeadland, [193,497,156,181], [256,616,180,165],
  [336,707,177,163], [427,837,181,175],
  // Pine-covered islets flank the Ryugu sea lane, with open water between.
  [-413,121,62,27], [-492,311,52,30], [-583,174,24,15],
  ...FIRE_COAST,
];
// A blended coast depends on the original order of the overlapping lobes.
// Index their existing survey bounds once so inland probes skip distant shores.
const shoreCells = new Map(), shoreCellSize = 128;
function shoreCell(x,z) {
  return Math.floor(x / shoreCellSize) * 128 + Math.floor(z / shoreCellSize);
}
for (const lobe of PENINSULAS) {
  const [x,z,rx,rz] = lobe;
  for (let i = Math.floor((x-rx-62)/shoreCellSize); i <= Math.floor((x+rx+62)/shoreCellSize); i++) {
    for (let j = Math.floor((z-rz-62)/shoreCellSize); j <= Math.floor((z+rz+62)/shoreCellSize); j++) {
      const key = i*128+j;
      if (!shoreCells.has(key)) shoreCells.set(key, []);
      shoreCells.get(key).push(lobe);
    }
  }
}
export function shoreDistance(x,z) {
  let shore=originalShore(x,z);
  const lobes=shoreCells.get(shoreCell(x,z));
  if(!lobes)return portShore(x,z,shore);
  const erosion=5.9*sin(x*.048+z*.025)+3.8*cos(z*.062-x*.033)+2.3*sin(x*.109-z*.089);
  for(const [cx,cz,rx,rz] of lobes) {
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
    const hills=rolls + eastRidgeHeight(x,z) + northRidgeHeight(x,z) + westRidgeHeight(x,z)
      + 18*hill(x,z,-89,-592,101,91) + 22*hill(x,z,184,-694,74,69)
      + 26*hill(x,z,-563,-198,87,46) + 18*hill(x,z,-451,-80,72,39) + 6.4*hill(x,z,-240,-84,28,27)
      + 25*hill(x,z,219,556,64,89) + 32*hill(x,z,382,677,84,81)
      + 21*hill(x,z,480,922,76,55) + 13*hill(x,z,-413,121,40,21);
    // The capital stands on a river terrace. The lookout rises beyond the last street.
    const streetEdge=max(abs(x-DISTRICTS.kyo.x)-102,abs(z-DISTRICTS.kyo.z)-84);
    const basin=x>DISTRICTS.kyo.x-124 && x<DISTRICTS.kyo.x+124 && z>DISTRICTS.kyo.z-106 && z<DISTRICTS.kyo.z+106
      ? rolls+(hills-rolls)*smooth(0,22,streetEdge):hills;
    const newLand=-1.8+(basin+1.8)*smooth(-3.3,11,shore);
    // Blend the added coastline into the sunrise beach. The old survey ends
    // at x=310, across the path from the mortar to the sea.
    const beachJoin=x>=310 && x<326 && abs(z-175)<46
      ? 1-(1-smooth(310,326,x))*(1-smooth(26,46,abs(z-175))) : 1;
    ground=base+(max(base,newLand)-base)*(1-smooth(11,22,originalShore(x,z)))*beachJoin;
  }
  if (shore>0) ground+=(pilgrimageHeight(x,z,ground)-ground)*smooth(0,20,shore);
  const gateVerge=max(abs(x-RASHOMON.x)-14,abs(z-RASHOMON.z-3)-19);
  if(gateVerge<20)ground+=(5-ground)*(1-smooth(0,20,gateVerge));
  if (shore < 0) {
    // Offshore shoals gradually give way to open water. A sandy terrace
    // holds the palace and its gate at the bottom of the western bay.
    ground-=7*smooth(1,37,-shore);
    const palace=hypot(x-DISTRICTS.ryugu.x,z-DISTRICTS.ryugu.z);
    ground+=(PALACE_BED-ground)*(1-smooth(56,160,palace));
    // The two sides of every ocean seam meet on a common deep shelf.
    const edge=BOUND-max(abs(x),abs(z));
    ground=-8.8+(ground+8.8)*smooth(0,18,edge);
  }
  // A low coastal bluff carries the pagoda. Its northern lip drops away to
  // the existing beach and its inland slopes meet the forested mountain pass.
  const u=x-SNOW_TOWN.x,v=z-SNOW_TOWN.z;
  if(abs(u)<102 && abs(v)<74 && shore>0){
    const terrace=(8.8-.088*v+.75*sin(u*.037))*smooth(0,15,shore);
    const blend=(1-smooth(51,102,abs(u)))*(1-smooth(42,74,abs(v)));
    ground+=(max(ground,terrace)-ground)*blend;
  }
  return passHeight(x,z,ground);
}
export const mapleStreamZ = x => -130 + 3.3*sin((x-292)/15);
function estuaryTerrain(x,z,native) {
  if ((x> -198 || x< -260) && (x<340 || x>402)) return native;
  const maple=x>340 && z < -110 && z > -152;
  if (!maple && (z<0 || z>55)) return native;
  const tide=riverMouthFlare(x);
  const width=maple ? 3.1+3.8*tide : riverHalfWidth(x)+6.4*tide;
  const across=abs(z-(maple?mapleStreamZ(x):riverZ(x)));
  if(across>width+10)return native;
  // Only remove material. The gravel shoulder descends into the channel,
  // then the offshore shelf takes over wherever it lies below the tidal bed.
  const bed=(maple?-1.15:-1.57)-1.30*tide;
  const bank=max(0,across-width);
  const profile=bed+(WATER_Y-bed)*smooth(.40,1,across/width)+bank*(.24+.025*bank);
  return native+(min(native,profile)-native)*smooth(0,.22,tide);
}
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
function lotWeight(x,z,b) {
  const dx=x-b.x,dz=z-b.z,u=dx*b.cos-dz*b.sin,v=dx*b.sin+dz*b.cos;
  return 1-smooth(0,3.8,max(abs(u)-b.w/2-.9,abs(v-.5)-b.d/2-1.5));
}
function landHeight(x, z, expanded = true) {
  x = wrapCoord(x); z = wrapCoord(z);
  const native = ungradedHeight(x,z);
  const base = expanded ? outerHeight(x,z,native) : native;
  const nearby = lotGrid.get(Math.floor(x / 24) * 128 + Math.floor(z / 24));
  if (!nearby) return base;
  let weight = 0, graded = base;
  for (const b of nearby) {
    const blend = lotWeight(x,z,b);
    if (blend > weight) { weight = blend; graded = base + (b.y-base)*blend; }
  }
  return graded;
}
// The baths sit in a hand-cut hollow; their waterline is independent of the sea.
const [bathX,bathZ]=snowPoint(-32,-292);
const capitalInkstone=RETREATS.find(s=>s.shape==='suzuri');
export const SNOW_SPRING = { name:'雪見の大露天風呂', region:'snow', rank:'main', kind:'snow', yaw:0, lip:snowBathLip, x:bathX, z:bathZ, rx:13.6, rz:8.8, level:landHeight(bathX,bathZ)-.12 };
export const TSUKIMI = { x: -51.7, z: 285.9, yaw: -.15 };
export function springRadius(x,z) {
  const u=(x-SNOW_SPRING.x)/SNOW_SPRING.rx,v=(z-SNOW_SPRING.z)/SNOW_SPRING.rz,r=hypot(u,v);
  return r>2?r:r/snowBathLip(Math.atan2(v,u));
}
function isletTerrain(x,z,bed) {
  const r=isletRadius(x,z);
  if(r>=1.86)return bed;
  // A level crown carries the shrine stones. The sandy rim continues under
  // water at the same grade, so a swimmer can walk ashore from any side.
  const crown=.55, rise=LAKE_ISLET.top-WATER_Y;
  if(r<=1){
    const t=sat((r-crown)/(1-crown));
    return LAKE_ISLET.top-rise*t*t*(2-t);
  }
  const ledge=WATER_Y-rise*(r-1)/(1-crown);
  return ledge+(bed-ledge)*smooth(1,1.86,r);
}
function groundBeforeBath(x,z) {
  // The littoral shelf makes a walkable, continuous transition from the
  // hills through the reed beds into deep swimming water at sea level.
  if(abs(x-FOREST_LAKE.x)<123 && abs(z-FOREST_LAKE.z)<83) {
    const r=lakeRadius(x,z);
    if(r<1.4){
      const shelf=WATER_Y-7.2*(1-smooth(.17,1,r)) + max(0,r-1)*12;
      if(r<.62)return isletTerrain(x,z,shelf);
      return shelf+(landHeight(x,z)-shelf)*smooth(1.06,1.40,r);
    }
  }
  const base=portTerrain(x,z,courtTerrain(x,z,landHeight(x,z),landHeight));
  return estuaryTerrain(x,z,kiyomizuTerrain(x,z,mountainStreamTerrain(x,z,mapleApproachHeight(x,z,base))));
}
// A waterline cut into the local slope. The lower of the upstream plot and
// its front approach keeps the entrance from projecting above the meadow.
const springLevels=new WeakMap();
export function springLevel(site) {
  if(Number.isFinite(site.level))return site.level;
  if(!springLevels.has(site)){
    const front=sitePoint(site,0,site.rz+1.7);
    const base=groundBeforeBath(site.x,site.z);
    const sill=groundBeforeBath(...front);
    springLevels.set(site,Math.max(base-.88,Math.min(base-.17,sill-.18)));
  }
  return springLevels.get(site);
}
const freightGround=freightRoadEarthwork(road);
export function terrainHeight(x,z) {
  const native=freightGround(x,z,groundBeforeBath(x,z));
  const hut=nearbyHut(x,z);
  if(hut){
    const w=clearingWeight(hut,x,z);
    if(w>0)return native+(landHeight(hut.x,hut.z)-native)*w;
  }
  const site=nearbyRetreat(x,z);
  if(site) return bathTerrain(site,x,z,native,springLevel(site));
  if (abs(x-SNOW_SPRING.x)>23 || abs(z-SNOW_SPRING.z)>16) return native;
  const r = springRadius(x,z);
  const deep=pilgrimStations(SNOW_SPRING)[0];
  const plunge=(deep.depth-.61)*(1-smooth(.52,1.30,stationRadius(deep,x-bathX,z-bathZ)));
  const bed = SNOW_SPRING.level-.61-plunge+smooth(.70,1.03,r)*.87;
  return bed+(native-bed)*smooth(1.08,1.60,r);
}
// Root a plant on the actual painted triangle. Across the crease of a rocky
// spur the analytic surface can differ visibly from its sampled vertices.
const groundSpacing=2*BOUND/(TERRAIN_TILES*TERRAIN_SUBDIVISIONS);
// Keep the near-vertical lip and the air below a waterfall in the same
// triangle survey as the walkable banks, including at the maple confluence.
const falls=MOUNTAIN_STREAMS.map(({fall:{lip,toe}})=>({
  x:(lip.x+toe.x)/2,z:(lip.z+toe.z)/2,rx:Math.abs(toe.x-lip.x)/2+5,rz:Math.abs(toe.z-lip.z)/2+5,
}));
const approaches=[
  ...[-1,1].map(side=>({x:MAPLE_BRIDGE.x,z:MAPLE_BRIDGE.z+side*MAPLE_BRIDGE.length/2,rx:3,rz:3})),
  {x:503,z:-731,rx:3,rz:3}, // The level forecourt joins the timber stage here.
];
export const springGround=springGroundSurvey([...falls,...approaches,...RETREATS,SNOW_SPRING,LAKE_ISLET],
  BOUND,groundSpacing,TERRAIN_SUBDIVISIONS);
export function terrainMeshHeight(x,z,heightAt=terrainHeight) {
  return springGround.height(x,z,heightAt);
}
// Contact probes revisit the three vertices of a visible ground triangle
// many times in one stride. The 1/40-cell lattice includes both the 1/5
// and 1/8 refinements used on the banks without quantizing the probe itself.
const surveyHeights=new Map(), surveyScale=40/groundSpacing, surveyWidth=Math.round(2*BOUND*surveyScale)+1;
function surveyedVertex(x,z) {
  const key=Math.round((x+BOUND)*surveyScale)+surveyWidth*Math.round((z+BOUND)*surveyScale);
  let value=surveyHeights.get(key);
  if (value===undefined) {
    if (surveyHeights.size>=16384) surveyHeights.clear();
    value=terrainHeight(x,z);
    surveyHeights.set(key,value);
  }
  return value;
}
export function terrainContactHeight(x,z) {
  return terrainMeshHeight(wrapCoord(x),wrapCoord(z),surveyedVertex);
}
// Street processions follow the stone walking level beneath the gatehouse.
export function roadSurfaceHeight(x,z) {
  const step=gateStoneRise(x-RASHOMON.x,z-RASHOMON.z);
  return step>0 ? terrainHeight(RASHOMON.x,RASHOMON.z)+step : terrainContactHeight(x,z);
}
export function waterSurfaceAt(x,z,time=0,feet=Infinity) {
  const shell=SAZAE_SPRING;
  if(feet>=shell.level-.05 && feet<shell.level+2.4 && Math.abs(x-shell.x)<1.5 &&
      Math.abs(z-shell.z)<1.5 && poolAt(SAZAE_POOLS,...bathLocal(shell,x,z)))
    return shell.level+SAZAE_POOLS[0].y;
  const pocket=palaceWaterlineAt(x,z,feet);
  if(pocket!==undefined)return pocket;
  const hut=nearbyHut(x,z);
  if(hut?.bath && (x-hut.bath.x)**2+(z-hut.bath.z)**2<KETTLE.widthScale**2) return terrainHeight(hut.x,hut.z)+KETTLE.water;
  const site=nearbyRetreat(x,z);
  if(site){
    const pools=bathPools(site);
    if(pools){
      const pool=poolAt(pools,...bathLocal(site,x,z));
      if(pool)return springLevel(site)+pool.y;
    }else if(bathRadius(site,x,z)<1 && (site.shape!=='suzuri'||!onSuzuriLand(...bathLocal(site,x,z))))
      return springLevel(site)+tideRise(site,time);
  }
  if(abs(x-SNOW_SPRING.x)<15 && abs(z-SNOW_SPRING.z)<10 && springRadius(x,z)<1)return SNOW_SPRING.level;
  return max(WATER_Y,mountainStreamWaterAt(x,z));
}
export const BRIDGES = [-137, 0, 134].map((x) => ({
  x,
  z: riverZ(x),
  length: (riverHalfWidth(x) + 9) * 2,
  halfWidth: x === 0 ? 3.45 : 2.6,
}));
BRIDGES.push(MAPLE_BRIDGE);
export function bridgeHeight(bridge, z) {
  if(bridge.maple)return mapleDeckHeight(z);
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
        b.map(
          (_,k) =>
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
  {...road(4.6,[[156,105],[202,136],[234,150],[250,176],[276,185],[290,182],[302,175],[311,173]]), fadeEnd:5.5},
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
// Preserve the planting survey's empty clearing at the former dye shop.
// Its footprint only affects seed draws; today's slopes carry no foundation.
const formerDyeLot={x:274,z:-127,w:8.6,d:6.6,cos:cos(.29),sin:sin(.29),y:landHeight(274,-127)};
const plantingLots = [formerDyeLot];
function house(x, z, w, d, wall, roof, yaw = 0, kind = 'cottage', craft) {
  const b = { x, z, w, d, wall, roof, yaw, kind, craft, y: outerHeight(x,z,ungradedHeight(x,z)), cos: cos(yaw), sin: sin(yaw), snow: seasonAt(x,z).snow > .55 };
  structures.push(b);
  plantingLots.push(b);
  const extent = hypot(w/2+5,d/2+6);
  for (let i = Math.floor((x-extent)/24); i <= Math.floor((x+extent)/24); i++)
    for (let j = Math.floor((z-extent)/24); j <= Math.floor((z+extent)/24); j++) {
      const key = i*128+j;
      if (!lotGrid.has(key)) lotGrid.set(key,[]);
      lotGrid.get(key).push(b);
    }
  return b;
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
// Keep the original lot survey for the seeded island woods. Only the new
// village lots enter the live foundation and collision grids.
function snowHouse(x,z,...plan) {
  const b=house(...snowPoint(x,z),...plan);
  b.oldY=ungradedHeight(x,z);
  plantingLots.push({...b,x,z,y:b.oldY});
}
snowHouse(-80,-323,13,12,4.4,14.5,.06,'pagoda');
snowHouse(-93,-306,10,8,3.9,3.6,.15,'temple');
snowHouse(-63,-305,9,8,3.6,3.1,-.12,'shop', 'brew');
snowHouse(-99,-281,9.5,7,3.4,3.3,.14,'inn');
snowHouse(-59,-277,9,7.6,3.5,3.3,-.28,'shop', 'dye');
snowHouse(-96,-264,7.6,7,3.2,3.2,.27, 'cottage', 'rice');
snowHouse(-69,-258,8.8,7.5,3.4,3.3,-.24,'shop', 'tea');
snowHouse(-114,-303,8.8,7.5,3.4,3.1,.1, 'cottage', 'ink');
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
  { x: 257.55, z: -112.90, w: 7.8, h: 4.7, yaw: 1.184, lamps: {side:3.2, approach:3.4} },
];
// The beam is level, but each stone socket sits on its own side of
// the slope. Sample the visible terrain triangles around the stone rim.
export function gateFooting(g,side,lamp=false) {
  const scale=g===GATES[0] ? 1.16 : 1;
  const u=side*(lamp ? (g.lamps?.side ?? .57*g.w) : .36*g.w);
  const v=lamp ? (g.lamps?.approach ?? 1.6) : 0;
  const x=g.x+u*cos(g.yaw)+v*sin(g.yaw), z=g.z-u*sin(g.yaw)+v*cos(g.yaw);
  const radius=lamp ? .44*scale : .071*g.w;
  let low=terrainMeshHeight(x,z), high=low;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const y=terrainMeshHeight(x+radius*cos(a),z+radius*sin(a));
    low=min(low,y);high=max(high,y);
  }
  return {x,z,radius,bottom:low-.12,top:high+.08};
}
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
for (const r of plantingRegions.slice(1)) for (const [dx, dz] of safeOffsets) clearings.push([r.x + dx, r.z + dz]);
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
    plantingLots.some((b) => abs(x - b.x) < b.w * 0.65 + 3 && abs(z - b.z) < b.d * 0.65 + 3)
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
  if (safe(x,z,6) || plantingLots.some(b => hypot(x-b.x,z-b.z) < max(b.w,b.d)*.76+3)) continue;
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
      plantingLots.some(b=>hypot(b.x-x,b.z-z)<max(b.w,b.d)*.8+3) ||
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
    const region=originalRegionAt(x,z), place=plantingRegions[region];
    if (hypot(x-place.x,z-place.z)<20 || safe(x,z,5.8)) continue;
    if (plantingLots.some(b=>hypot(b.x-x,b.z-z)<hypot(b.w,b.d)*.52+4)) continue;
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
const originalSpringRadius = (x,z)=>hypot((x+32)/13.6,(z+292)/8.8);
const isBamboo = t => t.kind === 'bamboo' || t.kind === 'moso';
const regular = trees.filter(t => !isBamboo(t));
const keep = new Set(trees.slice(0,10));
const forms = new Set();
for (const t of regular) {
  if (t.form !== undefined && !forms.has(t.form) && originalSpringRadius(t.x,t.z)>1.4) {
    forms.add(t.form); keep.add(t);
  }
}
for (const t of regular.slice().sort((a,b)=>a.seed-b.seed)) {
  if (keep.size >= Math.ceil(regular.length/2)) break;
  if (originalSpringRadius(t.x,t.z)>1.4) keep.add(t);
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
export const CONNECTING_ROADS = TRADE_ROADS.map(({id,width,knots,destination,origin})=>({
  ...road(width,knots),id,destination,origin,
}));
// Retire the old streets after the forest survey. The market road now meets
// the new lakeside trail; only these walkable paths reach the painter and atlas.
const lakesideApproach=road(4.1,[[-21,-107],[-36,-104],[-39,-119],[-37,-135],[-58,-150],
  [-74,-194],[-99,-213],lakePoint(1.96,1.18)]);
const villageAvenue=road(5.4,[[-78,-250],[-78,-271],[-78,-290],[-78,-308],[-79,-316]].map(([x,z])=>snowPoint(x,z)));
const bathLane=road(4.1,[[-78,-290],[-62,-290],[-49,-286],[-43,-285]].map(([x,z])=>snowPoint(x,z)));
villageAvenue.id='snow-avenue';
bathLane.id='snow-bath-lane';
lakesideApproach.id='lakeside-approach';
ROADS.splice(8,2,villageAvenue,bathLane);
ROADS.push(lakesideApproach);
roadCells.clear();
ROADS.forEach(indexRoad);
[GATES[4].x,GATES[4].z]=snowPoint(GATES[4].x,GATES[4].z);
const extensions = [...CONNECTING_ROADS, ...KYO_ROADS.map(([width,knots,paved])=>({...road(width,knots),paved})), {width:3.7,points:INARI_ROUTE}];
for (const avenue of extensions) { ROADS.push(avenue); indexRoad(avenue); }
for (const args of KYO_BUILDINGS) house(...args);
export const TREES = trees.filter(t => !portReserved(t.x,t.z) && !reservedScenery(t.x,t.z) && (isBamboo(t) || keep.has(t)) &&
  (t.form === undefined || !nearRoad(t.x,t.z,2.7)));
// Fill the boundary of the maple district and line the new country roads with
// loose stands of cedar, zelkova and red pine. Keep all gates and views open.
let saplings = seeded(0x5c311);
// Retain the seed sequence used for established trees and rocks across the islands.
// Current firebeds and footpaths receive their own local clearance below.
function earlierFireSurvey(x,z){
  const city=DISTRICTS.kyo,east=x-city.x,north=city.z-z;
  function clearing(along,across,rise,minimum,width){
    if(along<100 || along>369)return false;
    const irregular=10+4.8*sin(along*.082)+3.6*sin(along*.049+across*.025);
    return abs(across)<along*width+irregular && rise+14>(along-47)*minimum;
  }
  return east>100 && east<370 && clearing(east,z-city.z,earlierFireRidgeHeight(x,z,false),.128,.17) ||
    north>100 && north<370 && clearing(north,x-city.x,earlierFireRidgeHeight(x,z,true),.111,.157);
}
// Keep the earlier planting order and every seed draw. A new tree only tests
// trunks in its nine neighbouring 12 m parcels, including the last planting.
const saplingCells=new Map();
function saplingCell(x,z) { return Math.floor(x/12)*512+Math.floor(z/12); }
function rememberSapling(tree) {
  const cell=saplingCell(tree.x,tree.z);
  if (!saplingCells.has(cell)) saplingCells.set(cell,[]);
  saplingCells.get(cell).push(tree);
}
function plantSapling(tree) {
  TREES.push(tree);
  rememberSapling(tree);
}
function trunkWithin(x,z,radiusSq) {
  const cell=saplingCell(x,z);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++) {
    const neighbours=saplingCells.get(cell+i*512+j);
    if(neighbours?.some(t=>(t.x-x)**2+(t.z-z)**2<radiusSq))return true;
  }
  return false;
}
TREES.forEach(rememberSapling);
const lotClearances=plantingLots.map(b=>({x:b.x,z:b.z,radius:hypot(b.w,b.d)*.52+4.5}));
function transplant(x,z,family) {
  if(abs(x-RASHOMON.x)<19 && abs(z-RASHOMON.z)<29)return false;
  if(portReserved(x,z)||reservedScenery(x,z)||earlierFireSurvey(x,z))return false;
  if(nearPeachTrunk(x,z,5))return false;
  if (shoreDistance(x,z)<10 || landHeight(x,z)<2 || nearRoad(x,z,3.1) ||
      abs(z-riverZ(x))-riverHalfWidth(x)<11 || safe(x,z,6) ||
      lotClearances.some(b=>abs(b.x-x)<b.radius && abs(b.z-z)<b.radius && hypot(b.x-x,b.z-z)<b.radius) ||
      trunkWithin(x,z,24)) return false;
  plantSapling({x,z,kind:TREE_FAMILIES[family][0], form:family*TREE_FORMS_PER_FAMILY+Math.floor(saplings()*4),
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
// Each transplant consumes a variable number of seed draws. Resume each
// existing road's survey so rerouting the snow road cannot move other groves.
const avenueSeeds={'temple-road':0x9b6fcd3e,'peach-pass':0xc3454d7a,'inari-road':0xdcf1d981,
  'tsuruga-road':0x3cabd4d5,'sakai-road':0x48e975d7,'inland-road':0x76e798de,'spring-pass-road':0x96fa37d1};
for(const avenue of CONNECTING_ROADS) {
  if(avenueSeeds[avenue.id])saplings=seeded(avenueSeeds[avenue.id]);
  for(let i=5;i<avenue.points.length;i+=4) {
    const [ax,az]=avenue.points[i];
    for(let k=0;k<5;k++) wildTree(ax+(saplings()-.5)*92,az+(saplings()-.5)*92);
  }
}
saplings=seeded(0x76e798de);
// Woodland masses off the roads follow the aspect of each slope. Broken
// clusters create openings across the valleys and a distinct high timberline.
for (const headland of PENINSULAS) {
  // The southern coast starts a separate survey after the western valley.
  if(headland===templeHeadland)saplings=seeded(0x3a6f7a3b);
  const [cx,cz,rx,rz]=headland;
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
  const plant=seeded(east?0x46554b55:0x444149);
  for(let i=0;i<1750;i++){
    const along=(plant()-.55)*511, across=(plant()-.5)*573;
    const x=summit.x+(east?along:across),z=summit.z+(east?across:-along);
    const high=earlierFireRidgeHeight(x,z,!east);
    if(high<7 || earlierFireSurvey(x,z) || nearRoad(x,z,4) || portReserved(x,z) || protectedDistrict(x,z))continue;
    if(Math.sin(across*.044+along*.013)+Math.sin(along*.055-across*.018)>.93 && plant()<.86)continue;
    if(trunkWithin(x,z,68))continue;
    const family=(high>96?[0,0,1,2,3]:[0,1,2,2,3])[i%5];
    plantSapling({x,z,h:4.5+plant()*(high>116?4.8:7.3),kind:TREE_FAMILIES[family][0],
      form:family*TREE_FORMS_PER_FAMILY+i%4,seed:(east?181033:390901)+i*13});
  }
}
// Close ranks of sugi in sheltered ravines, oak on the lower skirts, and
// shorter wind-shaped red pines above. The openings between these copses
// expose the rock underneath, including the cut grass around 大 and 福.
{
  for(const [centre,height,seed,width,depth] of [
    [HIGASHIYAMA,(x,z)=>earlierFireRidgeHeight(x,z,false),7709,470,540],
    [KITAYAMA,(x,z)=>earlierFireRidgeHeight(x,z,true),4093,520,450],
    [NISHIYAMA,earlierWestRidgeHeight,2837,314,295],
  ]){
    const plant=seeded(seed);
    for(let grove=0;grove<220;grove++){
      const cx=centre.x+(plant()-.53)*width,cz=centre.z+(plant()-.50)*depth;
      const rise=height(cx,cz);
      if(rise<8)continue;
      const hx=height(cx+2,cz)-height(cx-2,cz),hz=height(cx,cz+2)-height(cx,cz-2);
      const angle=Math.atan2(hz,hx)+plant()*.48-.24,c=cos(angle),s=sin(angle);
      const exposed=rise>91 || (rise>54 && hx+hz>1.3);
      const family=exposed?(plant()<.78?1:0):rise<43 && plant()<.52?13:plant()<.64?2:3;
      const length=13+plant()*29,breadth=6+plant()*13,gap=exposed?6:4.6;
      for(let i=0;i<18;i++){
        const az=plant()*Math.PI*2,rad=Math.sqrt(plant());
        const u=cos(az)*length*rad,v=sin(az)*breadth*rad;
        const x=cx+u*c-v*s,z=cz+u*s+v*c;
        if(height(x,z)<6 || trunkWithin(x,z,gap*gap) || earlierFireSurvey(x,z) ||
           shoreDistance(x,z)<10 || nearRoad(x,z,4.5) || protectedDistrict(x,z) || reservedScenery(x,z))continue;
        const kind=plant()<.16?(exposed?9:12):family;
        const h=(exposed?4.8:6.3)+plant()*(exposed?4.2:5.5)+1.6*(1-rad);
        const tree={x,z,h,kind:TREE_FAMILIES[kind][0],form:kind*TREE_FORMS_PER_FAMILY+Math.floor(plant()*4),
          seed:seed*1000+grove*18+i};
        plantSapling(tree);
      }
    }
  }
}
// These shrine cedars use the same forked trunks, needle sprays and moving
// crowns as the surrounding woodland. A clear strip follows every gate.
for(const [i,t] of CEDAR_GROVES.entries()) {
  if(nearRoad(t.x,t.z,2.7) || reservedScenery(t.x,t.z)) continue;
  plantSapling({x:t.x,z:t.z,h:t.h,kind:'cedar',form:2*TREE_FORMS_PER_FAMILY+i%4,seed:61979+i*67});
}
// Fractured shoulders crop out in groups, their long axes sharing a strike.
// They stay clear of riding lanes, of the courtyards and of each bath entrance.
let stoneSeed=seeded(0x11e41);
for(const headland of PENINSULAS) {
  // Rock placement also depends on the local trunks.
  if(headland===templeHeadland)stoneSeed=seeded(0x569f83d3);
  const [cx,cz,rx,rz]=headland;
  for(let bed=0;bed<8;bed++){
    const ax=cx+(stoneSeed()-.5)*rx*1.85,az=cz+(stoneSeed()-.5)*rz*1.8;
    if(originalShore(ax,az)>9 || earlierFireSurvey(ax,az) || protectedDistrict(ax,az) || shoreDistance(ax,az)<9) continue;
    const yaw=.88*sin(az*.019)+.63, c=cos(yaw),s=sin(yaw);
    const high=terrainHeight(ax,az)>35;
    for(let n=0;n<5;n++){
      const along=stoneSeed()*14-7, side=stoneSeed()*6-3;
      const x=ax+c*along+s*side,z=az-s*along+c*side;
      const scale=(n===0?1.7:.48)+stoneSeed()*(high?2.05:1.56);
      const rx=scale*(1.04+stoneSeed()*.68),rz=scale*(.61+stoneSeed()*.34);
      if(nearRoad(x,z,rx+2.6) || earlierFireSurvey(x,z) || reservedScenery(x,z) || protectedDistrict(x,z) ||
         shoreDistance(x,z)<3 || trunkWithin(x,z,(rx+.45)**2))continue;
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
    if(nearRoad(x,z,3)||reservedScenery(x,z)||trunkWithin(x,z,9))continue;
    plantSapling({x,z,kind:TREE_FAMILIES[family][0],form:family*4+i,seed:94071+i+41*s.index,
      h:(s.kind==='cedar'?9.3:s.kind==='slate'?4.4:5.7)+i*.54});
  }
}
saplingCells.clear();
ROCKS.push(...offshoreReefs(terrainHeight,shoreDistance,seeded(0x687063)),
  ...WINTER_REEFS.map(r=>({...r,h:r.top-terrainHeight(r.x,r.z)})));
// Respect the same surveyed yards whatever the seeded planting sequence.
// Cut after planting so a cleared trunk does not reshuffle distant woods.
export const KIYOMIZU_ROAD={...road(3.85,KIYOMIZU_APPROACH),paved:true};
ROADS.push(KIYOMIZU_ROAD);indexRoad(KIYOMIZU_ROAD);
const onTempleApproach=(x,z,pad)=>x>334 && x<512 && z> -794 && z< -714 &&
  KIYOMIZU_ROAD.points.some(([px,pz])=>(px-x)**2+(pz-z)**2<pad**2);
for(let i=ROCKS.length-1;i>=0;i--){
  const r=ROCKS[i];
  if(kiyomizuClearing(r.x,r.z)||onTempleApproach(r.x,r.z,3+Math.max(r.rx,r.rz)))ROCKS.splice(i,1);
}
// Exposed pine shoulders frame the view. Prune only crowns that would
// interrupt the first stretch of a sightline from one of the three summits.
const valleyWindows=KYO_LOOKOUTS.map(({x,z})=>{
  const dx=DISTRICTS.kyo.x-x,dz=DISTRICTS.kyo.z-z,run=Math.hypot(dx,dz);
  const eye=terrainHeight(x,z)+1.7;
  return {x,z,eye,dx:dx/run,dz:dz/run,slope:(eye-terrainHeight(DISTRICTS.kyo.x,DISTRICTS.kyo.z)-2)/run};
});
function hidesValley(tree){
  for(const s of valleyWindows){
    const dx=tree.x-s.x,dz=tree.z-s.z,along=dx*s.dx+dz*s.dz;
    if(along < -5 || along>130 || Math.abs(dx*s.dz-dz*s.dx)>8+.27*along)continue;
    if(terrainHeight(tree.x,tree.z)+tree.h>s.eye-s.slope*along-2)return true;
  }
  return false;
}
// The original mountain census consumed a variable number of random samples
// at the head of the ravine. Survey the old ground there, then clear the water
// in one pass so opening a spring cannot move distant stands or wildlife.
const springParcel=(x,z)=>x>258 && x<299 && z> -145 && z< -114;
function mountainPlantingHeight(x,z){
  if(!springParcel(x,z))return terrainHeight(x,z);
  const soil=landHeight(x,z);
  return mapleApproachHeight(x,z,soil+(formerDyeLot.y-soil)*lotWeight(x,z,formerDyeLot));
}
for(let i=TREES.length-1;i>=0;i--){
  const {x,z}=TREES[i],hut=nearbyHut(x,z);
  const streamBank=!springParcel(x,z) && inMountainStreamClearing(x,z);
  // Two long-established bamboo clumps frame the lower stream on dry banks.
  // Keep their trunks if the channel's water never reaches their roots.
  if(hut && (hypot(x-hut.x,z-hut.z)<=8 || inHutYard(x,z)) ||
     streamBank && (!isBamboo(TREES[i]) || Number.isFinite(mountainStreamWaterAt(x,z)))) TREES.splice(i,1);
}
// Autumn maples occupy the edges of the ravine. The western rail retains its
// sightline to Kyoto and none of the crowns emerge through the timber stage.
for(const [i,[x,z,h]] of [[479,-701,9.7],[485.5,-695,11.6],[500,-694.6,10.7],
  [512,-696,8.3],[482.7,-729.3,7.4],[494,-755,6.4],[526,-764,8.3]].entries()){
  if(nearRoad(x,z,2)||TREES.some(t=>(x-t.x)**2+(z-t.z)**2<8.5))continue;
  TREES.push({x,z,h,kind:'maple',form:mapleFamily*TREE_FORMS_PER_FAMILY+i%4,seed:483331+i*17});
}
// Append the mountain understory after surveying the earlier rocks, perches and
// garden trees. All new trunks enter the same contacts and canopy as those trees.
function mountainGlade(x,z,ground){
  const parcel=springParcel(x,z);
  if(parcel && hypot(x-formerDyeLot.x,z-formerDyeLot.z)<=hypot(formerDyeLot.w,formerDyeLot.d)*.52+5)return false;
  if((!parcel && inMountainStreamClearing(x,z)) || nearRoad(x,z,3.8) || reservedScenery(x,z))return false;
  const orchardApron=hypot((x-DISTRICTS.peach.x)/133,(z-DISTRICTS.peach.z)/112);
  if(orchardApron<.58 || (orchardApron>=1.02 && protectedDistrict(x,z)))return false;
  const hut=nearbyHut(x,z);
  if(hut && (hypot(x-hut.x,z-hut.z)<=9 || inHutYard(x,z)))return false;
  if(abs(z-riverZ(x))<riverHalfWidth(x)+11 || shoreDistance(x,z)<10 || safe(x,z,6))return false;
  if(springRadius(x,z)<1.5 || (x>275 && abs(z-mapleStreamZ(x))<8))return false;
  if(Math.abs(terrainMeshHeight(x,z,parcel?mountainPlantingHeight:terrainHeight)-ground)>.14)return false;
  const lots=lotGrid.get(Math.floor(x/24)*128+Math.floor(z/24));
  return !lots || lots.every(b=>hypot(b.x-x,b.z-z)>hypot(b.w,b.d)*.52+5);
}
plantMountainWoods(TREES,ROCKS,PEACH_TREES,CLIFF_PINES,mountainPlantingHeight,
  (x,z,ground)=>!earlierFireSurvey(x,z) && mountainGlade(x,z,ground),seeded);
for(let i=TREES.length-1;i>=0;i--){
  const {x,z}=TREES[i];
  if(springParcel(x,z) && inMountainStreamClearing(x,z))TREES.splice(i,1);
}

const fireCeiling=createFireTreeCeiling(terrainHeight);
function trailBranchReach(h,form){
  const family=TREE_FAMILIES[Math.floor(form/TREE_FORMS_PER_FAMILY)];
  if(!family)return h*.50;
  // Low boughs need lateral room for a traveller and the trailing camera.
  // A tall, bare trunk can stand much nearer and frame the path overhead.
  const habit=[.065,-.025,.025,-.08][form%4];
  const firstBough=h*(family[4]+habit-(family[1]==='spire' ? .08 : .035));
  return h*(.10+(family[3]+.10)*(1-smooth(3.7,6.0,firstBough)));
}
function inFireOpening(x,z,h,crown,foot,ground){
  if(inFireMeadow(x,z,2) || fireTrailDistance(x,z)<1.25+foot)return true;
  const top=fireCeiling(x,z,crown);
  return Number.isFinite(top) && (ground ?? terrainHeight(x,z))+h>top;
}
// Prune individual obstructions. Low cover and tall trees beyond the fires
// remain on the same slopes as the cleared hearths.
for(let i=TREES.length-1;i>=0;i--){
  const t=TREES[i];
  if(inFireOpening(t.x,t.z,t.h,t.h*.56,trailBranchReach(t.h,t.form)))TREES.splice(i,1);
}
for(let i=ROCKS.length-1;i>=0;i--){
  const r=ROCKS[i],reach=Math.max(r.rx,r.rz);
  if(inFireOpening(r.x,r.z,r.h,reach,reach))ROCKS.splice(i,1);
}
// Loose bands of trees follow the contours around the firebeds and break up
// the old straight cut to the summits. The first few stands stay on the outer
// shoulders, leaving the city terrace and its avenues open.
const verges=[
  [true,[[131,-23],[153,23],[177,-9],[188,28],[212,-37],[244,47],
    [263,-49],[285,48],[302,-23],[311,-4],[318,21],[328,-33],
    [337,-7],[347,16],[357,-20],[362,38]]],
  [false,[[116,19],[136,-18],[158,8],[176,29],[209,-25],[225,34],
    [251,20],[258,-20],[278,-19],[283,13],[299,1],[307,30],
    [314,-23],[325,13],[340,-16],[346,2],[357,24]]],
];
for(const [east,pockets] of verges){
  const random=seeded(east?0x752bd:0x548b7),city=DISTRICTS.kyo;
  for(const [index,[depth,side]] of pockets.entries()){
    const cx=city.x+(east?depth:side),cz=city.z+(east?side:-depth);
    const neighbours=TREES.filter(t=>abs(t.x-cx)<25 && abs(t.z-cz)<25);
    const stones=ROCKS.filter(t=>abs(t.x-cx)<25 && abs(t.z-cz)<25);
    const across=6+random()*6,along=5+random()*4,lean=index%2 ? .40 : -.29;
    const target=depth<170 ? 3 : depth>275 ? 9 : 5;
    let planted=0;
    for(let i=0;i<target*6 && planted<target;i++){
      const a=i*2.4+random()*.7,r=Math.sqrt(random()),u=along*cos(a)*r,v=across*sin(a)*r+lean*u;
      const x=cx+(east?u:v),z=cz+(east?v:-u);
      if(neighbours.some(t=>(t.x-x)**2+(t.z-z)**2<(2.35+.23*t.h)**2) ||
         stones.some(t=>(t.x-x)**2+(t.z-z)**2<(1+max(t.rx,t.rz))**2))continue;
      const ground=terrainHeight(x,z);
      if(!mountainGlade(x,z,ground))continue;
      const family=[1,2,13,3][(index+(random()<.76?0:1))%4];
      const form=family*TREE_FORMS_PER_FAMILY+Math.floor(random()*TREE_FORMS_PER_FAMILY);
      const t={x,z,h:3.8+2.5*(1-r)+random()*3.2,kind:TREE_FAMILIES[family][0],form,seed:Math.floor(random()*1e8)};
      // A small pine fits below both the view from the avenue to the fires
      // and the view back down from the lookout. Test the crown at each size.
      while(t.h>=2.25 && (inFireOpening(x,z,t.h,t.h*.56,trailBranchReach(t.h,form),ground) || hidesValley(t)))t.h*=.79;
      if(t.h<2.25)continue;
      TREES.push(t);neighbours.push(t);planted++;
    }
  }
}
// Open the temple approach and preserve the stage and summit views.
for(let i=TREES.length-1;i>=0;i--){
  const t=TREES[i],{x,z}=t;
  if(kiyomizuClearing(x,z) || onTempleApproach(x,z,5.3) || hidesValley(t) ||
    x>=350 && x<=491 && z< -693 && z> -847 && kiyomizuViewTree(x,z,terrainHeight(x,z)+t.h))TREES.splice(i,1);
}
// The shoreline replaces the old village clearing. On the coastal terrace,
// keep the inhabited lots open and leave a window to sea behind the pagoda.
function inSnowSquare(x,z) {
  const u=x-SNOW_TOWN.x,v=z-SNOW_TOWN.z;
  return u> -47 && u<65 && v> -45 && v<41 ||
    v< -30 && v> -86 && abs(u+2)<18+.24*(-v-30);
}
function inLakeBed(x,z) {
  return abs(x-FOREST_LAKE.x)<100 && abs(z-FOREST_LAKE.z)<63 && lakeRadius(x,z)<1.055;
}
for(let i=TREES.length-1;i>=0;i--){
  const t=TREES[i];
  if(inLakeBed(t.x,t.z) || inSnowSquare(t.x,t.z))TREES.splice(i,1);
  else if(t.snow) t.snow=seasonAt(t.x,t.z).snow;
}
for(let i=ROCKS.length-1;i>=0;i--){
  const r=ROCKS[i];
  const hut=nearbyHut(r.x,r.z);
  if(inLakeBed(r.x,r.z) || inSnowSquare(r.x,r.z) && !r.winterReef ||
     hut && clearingWeight(hut,r.x,r.z)>.05)ROCKS.splice(i,1);
}
// Wind-pruned pines shelter the outer lanes and frame the winter bay. They
// use the established pine canopy and its snow-laden branch painting.
const winterPines=seeded(0x796b69);
for(let i=0;i<145;i++){
  const x=SNOW_TOWN.x+(winterPines()-.5)*186,z=SNOW_TOWN.z+(winterPines()-.5)*135;
  const u=x-SNOW_TOWN.x,v=z-SNOW_TOWN.z;
  if(inSnowSquare(x,z) || shoreDistance(x,z)<10 || nearRoad(x,z,4.5) || reservedScenery(x,z) ||
     Math.sin(u*.10+v*.046)+Math.cos(v*.085-u*.039)<-.4 || TREES.some(t=>hypot(x-t.x,z-t.z)<6.7))continue;
  const tree={x,z,h:4.4+winterPines()*4.3,kind:'pine',snow:seasonAt(x,z).snow,seed:Math.floor(winterPines()*1e6)};
  // Insert among the original individually-drawn trees, before the instanced groves.
  TREES.splice(TREES.findIndex(t=>t.form!==undefined),0,tree);
}
// Count only the sites left after opening the stage and summit sightlines.
growNishiyamaBamboo(TREES);
// Replant the low spreading boughs at the edges of the freight roads and
// the Inari gate. The stable planting seeds retain their size and crown.
const roadsideSites = new Map([
  [71761, [307.5, -464.8]], [207280, [224.8, 557.1]],
  [911866, [436.2, -1006.7]], [893519, [341, -956.1]],
  [757699, [110.4, -774.3]], [862608, [-81.4, -689]],
]);
for (const tree of TREES) {
  const site = roadsideSites.get(tree.seed);
  if (site) [tree.x, tree.z] = site;
}
const forestFootings=new WeakMap();
export function treeGround(tree) {
  const cached=forestFootings.get(tree);
  if(cached!==undefined)return cached;
  const {x,z}=tree;
  // Ground all three representations on the painted triangle. The planting
  // survey can stand above the tessellated surface on a narrow mountain spur.
  const onRidge=tree.form!==undefined && (kyoRidgeHeight(x,z)>0 || isNishiyamaTree(tree));
  const y=onRidge ? terrainMeshHeight(x,z) : tree.ground ?? terrainHeight(x,z);
  forestFootings.set(tree,y);
  return y;
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
  const lip=snowBathLip(a);
  const x=lip*dx*SNOW_SPRING.rx*(.98+.024*springRng()),z=lip*dz*SNOW_SPRING.rz*(.98+.025*springRng());
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
addLivingSolids(putSolid,terrainContactHeight);
for(const part of PALACE_SHELL) {
  const {x,z}=palacePoint(part.u,part.v);
  putSolid(x,z,part.d/2,part.w/2,0,PALACE_BED+part.top,part.kind,part.kind!=='wall',0,PALACE_BED+part.bottom);
}
for (const side of [-1,1]) {
  const [x,z] = ferryCurtainPoint(side * FERRY_CURTAIN.span / 2);
  putSolid(x,z,.056,.056,0,terrainHeight(FERRY_CURTAIN.x,FERRY_CURTAIN.z)+FERRY_CURTAIN.height+.19,'oval',false);
}
for(const [u,v,y,scale] of COURT_CANDLES){
  const base=terrainHeight(COURT.x,COURT.z);
  putSolid(COURT.x+u,COURT.z+v,.18*scale,.18*scale,0,base+y+scale,'oval',false,0,base+y);
}
for (const b of BUILDINGS) {
  const plan = roomPlan(b);
  function localSolid(u, v, width, depth, height, kind, support, bottom=-Infinity) {
    const x = b.x + u * cos(b.yaw) + v * sin(b.yaw);
    const z = b.z - u * sin(b.yaw) + v * cos(b.yaw);
    return putSolid(x, z, width / 2, depth / 2, b.yaw, b.y + height, kind, support,0,b.y+bottom);
  }
  for(const q of houseCandles(b))
    localSolid(q.u,q.v,.36*q.scale,.36*q.scale,q.y+q.scale,'oval',false,q.y);
  for(const q of houseFrontLamps(b)){
    const x=b.x+q.u*b.cos+q.v*b.sin,z=b.z-q.u*b.sin+q.v*b.cos,y=q.plinth?b.y+q.plinth:terrainHeight(x,z);
    putSolid(x,z,(q.stone?.53:.295)*q.scale,(q.stone?.49:.25)*q.scale,b.yaw,
      y+(q.stone?3.20:1.31)*q.scale,q.stone?'oval':'box',false,0,y);
  }
  function closedRoof(r,wallBottom) {
    const sheet=localSolid(0,0,r.width,r.depth,r.eave,r.form==='pagoda'?'pagodaEave':'roof',true);
    sheet.form=r.form;sheet.aperture=r.aperture;sheet.roofRise=r.rise;
    sheet.thickness=roofSkinDepth(r.form)*r.rise;
    roofWallContacts(r,(u,v,w,d)=>{
      localSolid(u,v,w,d,r.eave,'roofWall',false,wallBottom).sheet=sheet;
    });
  }
  localSolid(0, 0, b.w + 1.1, b.d + 1.08, 0.42, 'floor', true);
  localSolid(0, 0, plan.width, plan.depth, plan.floor, 'floor', true);
  for (let j = 0; j < 3; j++)
    localSolid(0, b.d / 2 + 0.48 + j * 0.39, b.w * 0.48, 0.46, 0.32 - j * 0.19, 'floor', true);
  for (const wall of plan.walls)
    localSolid(wall.u, wall.v, wall.width, wall.depth, plan.ceiling, 'wall', false);
  if(b.kind!=='wardShop')
    localSolid(0,plan.depth/2,plan.width+.12,.28,plan.ceiling+.04,'slab',true,plan.ceiling-.18);
  if (b.kind === 'pagoda') {
    const tower=pagodaPlan(b);
    for(const wall of tower.panels)
      localSolid(wall.u,wall.v,wall.width,wall.depth,wall.y+2.50*tower.scale,'wall',false,wall.y);
    for (const tread of tower.slabs)
      localSolid(tread.u,tread.v,tread.w,tread.d,tread.top,'slab',true,tread.top-tread.thickness);
    for (const [i,storey] of tower.storeys.entries()) {
      const {y,w,d,roof,wallTop}=storey;
      closedRoof(roof,wallTop);
      // Timber uprights and two continuous gallery rails are distinct from
      // the four cardinal openings in the wall around the staircase.
      for(const side of [-1,1]){
        for(const corner of [-1,1])
          localSolid(side*w*.413,corner*d*.414,.206,.206,y+2.52*tower.scale,'oval',false,y);
        if(i) for(const lift of [.24,.67]){
          const top=y+(lift+.0475)*tower.scale, bottom=y+(lift-.0475)*tower.scale;
          localSolid(side*w*.48,0,.09,d*.98,top,'slab',true,bottom);
          localSolid(0,side*d*.48,w*.98,.09,top,'slab',true,bottom);
        }
      }
      localSolid(0,0,.19,1.9,y+2.66*tower.scale,'ceiling',false);
      if(i===4){
        const apex=y+4.64*tower.scale;
        localSolid(0,0,.176,.176,apex+3.91*tower.scale,'oval',false,apex-.09*tower.scale);
        for(let j=0;j<9;j++){
          const diameter=2*(.49-j*.035),height=apex+(.26+j*.28)*tower.scale;
          localSolid(0,0,diameter,diameter,height+.0415*tower.scale,'oval',false,height-.0415*tower.scale);
        }
      }
    }
  } else {
    localSolid(0, 0, b.w * 1.08, b.d * 1.08, plan.ceiling, 'ceiling', false);
    closedRoof(houseRoof(b.w,b.d,b.wall+.29,b.roof,roofForm(b)),plan.ceiling);
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
        localSolid(0,b.d/2,b.w,.16,b.wall,'wall',false,3.38);
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
kiyomizuSolids(terrainHeight,putSolid);
const surveyedRims=new Map();
const rimKey=(site,index)=>site.index+'/'+index;
civicAndBathSolids(terrainHeight,putSolid,springLevel,(site,stone,solid)=>{
  surveyedRims.set(rimKey(site,stone.i),solid);
});
addSazaeBathSolids(putSolid);
hutSolids(terrainHeight,putSolid);
portSolids(putSolid);
lakeHokoraSolids(putSolid);
kaedeDragonShrineSolids(putSolid,terrainContactHeight);
addSeasonalSolids(putSolid,terrainHeight,seeded,nearRoad,springRadius);
for(const {x,z,rx,rz,yaw,top,rise} of SOURCE_STONES){
  putSolid(x,z,rx,rz,yaw,top,'springRock',true).roundHeight=rise;
}
addPilgrimBathSolids(SNOW_SPRING,(u,v,w,d,y,kind,support,angle=0)=>
  putSolid(bathX+u,bathZ+v,w/2,d/2,angle,SNOW_SPRING.level+y,kind,support),SNOW_SPRING.level);
for(const stone of SPRING_STONES) {
  putSolid(SNOW_SPRING.x+stone.x,SNOW_SPRING.z+stone.z,stone.w*.84,stone.d*.84,stone.yaw,
    SNOW_SPRING.level+.18+stone.h,'oval',true);
}
for(const step of BATH_STEPS) putSolid(SNOW_SPRING.x,SNOW_SPRING.z+step.z,1.32,.265,0,
  SNOW_SPRING.level+step.top,'floor',true);
// The snow pavilion has an open front and a slatted rear wall.
const pavilionZ=SNOW_SPRING.z-8.9, pavilionBase=SNOW_SPRING.level+.52;
putSolid(SNOW_SPRING.x+snowLamp.x,SNOW_SPRING.z+snowLamp.z,snowLamp.w/2,snowLamp.d/2,0,
  SNOW_SPRING.level+snowLamp.h,'springRock',true).roundHeight=1.85;
const snowyRoof=putSolid(SNOW_SPRING.x,pavilionZ,4.70,2.36,0,pavilionBase+3.56,'roof',true,1.46);
snowyRoof.pilgrimKind='snow';snowyRoof.pilgrimDepth=2.095;snowyRoof.thickness=.24;
for (const dx of [-3.67,0,3.67]) for (const dz of [-1.13,1.06])
  putSolid(SNOW_SPRING.x+dx,pavilionZ+dz,.095,.095,0,pavilionBase+3.50,'wall',false);
putSolid(SNOW_SPRING.x,pavilionZ-1.30,4.06,.11,0,pavilionBase+3,'wall',false);
putSolid(SNOW_SPRING.x,SNOW_SPRING.z-8.9,3.90,1.55,0,SNOW_SPRING.level+.61,'floor',true);
for (const [index,[x, z, yaw]] of MARKET_STALLS.entries()) {
  const base=terrainHeight(x,z), c=cos(yaw), s=sin(yaw);
  const cook=index===4, postX=cook?marketCookCanopy.postX:1.64, lift=cook?marketCookCanopy.lift:0;
  for (const u of [-postX,postX]) for (const v of [-.79,1.07])
    putSolid(x+u*c+v*s,z-u*s+v*c,.059,.059,0,base+lift+(v<0?3.28:2.53),'oval',false);
  putSolid(x+.12*s,z+.12*c,(cook?marketCookCanopy.width:3.83)/2,1.12,yaw,base+lift+2.65,'awning',true);
  putSolid(x + 0.42 * sin(yaw), z + 0.42 * cos(yaw), 1.57, 0.42, yaw, terrainHeight(x, z) + 0.93, 'box', true);
  // A jumping visitor lands on the brazier or bean basket before the counter.
  if (index===4) {
    const counter=marketCooktop(MARKET_STALLS[index]);
    addCookwareSolids(counter,base+.18,putSolid);
    addCooksPlatformSolids(counter,'market-mortar',base+.18,putSolid);
    // The dango seller's stock is on the low shelf behind the cooking surface.
    putSolid(x-.38*s,z-.38*c,1.33,.32,yaw,base+.94,'box',true,0,base+.87);
  }
  if (index===4) putSolid(x+1.36*c+.42*s,z-1.36*s+.42*c,.185,.285,yaw,base+1.13,'box',true,0,base+.93);
  if (index===5) putSolid(x-.91*c+.47*s,z+.91*s+.47*c,.30,.30,yaw,base+1.126,'oval',true,0,base+.93);
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
for(const {x,z,radius,height} of [...LAKE_WILLOWS,...LAKE_ANIMALS])
  putSolid(x,z,radius,radius,0,terrainMeshHeight(x,z)+height,'oval',false);
for (const r of ROCKS) {
  for (const part of rockParts(r,terrainHeight(r.x,r.z))) mountRockContact(part,putSolid);
}
// The same seed also feeds the painted road gravel after these stones.
// Quantised roll gives the tilted pebbles sixteen reusable contact meshes.
export function* riverbankStones(random) {
  for(let i=0;i<510;i++){
    const x=random()*488-244;
    const z=riverZ(x)+(random()>.5?1:-1)*(riverHalfWidth(x)+random()*5-1);
    if(abs(x)<16 || BRIDGES.some(b=>abs(x-b.x)<b.halfWidth+1.4))continue;
    const size=.19+random()**2*1.1;
    yield {form:'round',x,y:terrainHeight(x,z)-size*.12,z,sx:size*1.33,sy:size*.67,sz:size,
      yaw:random()*2*Math.PI,pitch:.22,roll:Math.round(random()*15)/60};
  }
}
for(const part of riverbankStones(seeded(27158)))mountRockContact(part,putSolid);

const paintedRims=new Set();
export function registerPaintedRim(site,index,shape,geometry,matrix) {
  const key=rimKey(site,index);
  const part=key+'/'+shape;
  if(paintedRims.has(part))return;
  // The renderer has supplied the real foundation or mineral cap. Retire
  // its survey proxy, which also serves callers that build no scene at all.
  const survey=surveyedRims.get(key);
  if(survey){
    survey.bottom=Infinity;
    survey.top=-Infinity;
    surveyedRims.delete(key);
  }
  mountScannedContact(geometry,matrix,putSolid);
  paintedRims.add(part);
}

const scannedBatches=new Set();
export function registerScannedStones(id,shapes,placements) {
  if(scannedBatches.has(id))return;
  for (const [i,matrices] of placements.entries()) {
    for (const matrix of matrices) mountScannedContact(shapes[i].geo,matrix,putSolid);
  }
  scannedBatches.add(id);
}


function plantWood(tree,base,scale,yaw,wood,surveyRadius,surveyTop) {
  // Thousands of grove instances share the same branch records. The spatial
  // index holds just one enclosing footprint per real tree.
  const culmFeet=wood.culms?groundedCulms(wood,tree,base,yaw,terrainContactHeight):null;
  const reach=max(wood.reach,culmFeet?.reach??0)*scale;
  const bottom=min(wood.bottom,culmFeet?.bottom??Infinity)*scale+base;
  const solid=putSolid(tree.x,tree.z,reach,reach,yaw,base+wood.top*scale,'wood',false,0,bottom);
  Object.assign(solid,{base,scale,wood,culmFeet,surveyRadius,surveyTop});
}
for(const tree of TREES){
  const grove=tree.form!==undefined,scale=grove?tree.h:1;
  const base=grove?treeGround(tree):terrainHeight(tree.x,tree.z);
  const near=!grove && REGIONS.some(q=>(q.x-tree.x)**2+(q.z-tree.z)**2<38**2);
  const wood=grove?groveWood(tree.form):landmarkWood(tree,seeded(tree.seed),terrainHeight,tree===TREES[0],near);
  plantWood(tree,base,scale,grove?tree.seed*2.39996323:0,wood,
    grove?tree.h*.027:tree.kind==='bamboo'?.3:.37,base+tree.h*.68);
}
for(const t of PEACH_TREES){
  plantWood(t,terrainMeshHeight(t.x,t.z),t.size,t.turn,pilgrimageWood('peach',t.form??t.seed%5,seeded),
    .25*t.size,terrainHeight(t.x,t.z)+2.6*t.size);
}
for(const t of CLIFF_PINES){
  plantWood(t,terrainMeshHeight(t.x,t.z),t.scale,t.yaw,pilgrimageWood('pine',t.type,seeded),
    .21*t.scale,terrainHeight(t.x,t.z)+4.8*t.scale);
}
for(const t of SHRINE_BAMBOO) {
  // One low and one high span approximate the lean without a thick invisible wall.
  for(let k=0;k<2;k++) {
    const f=(k+.5)/2, radius=t.radius+Math.hypot(t.sx,t.sz)*.25, y=terrainHeight(t.x,t.z);
    putSolid(t.x+t.sx*f,t.z+t.sz*f,radius,radius,0,y+t.height*(k+1)/2,'oval',false,0,y+t.height*k/2-.1);
  }
}
function lampSolid(x,z,scale,base=terrainHeight(x,z)) {
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
    const post=gateFooting(g,sign),lamp=gateFooting(g,sign,true);
    for(const foot of [post,lamp])
      putSolid(foot.x,foot.z,foot.radius,foot.radius,0,foot.top,'oval',true,0,foot.bottom);
    putSolid(post.x,post.z,g.w*.045,g.w*.045,0,base+g.h,'oval',false,0,post.top);
    lampSolid(lamp.x,lamp.z,g===GATES[0]?1.16:1,lamp.top);
  }
}
export const MAPLE_FOOTINGS=mapleBridgeFootings(terrainMeshHeight);
for(const s of [...MAPLE_FOOTINGS.piers,...MAPLE_FOOTINGS.abutments,...MAPLE_FOOTINGS.endStones]){
  putSolid(s.x,s.z,s.w/2,s.d/2,0,s.top,'wall',false,0,s.bottom);
}
for(const s of MAPLE_FOOTINGS.thresholds)putSolid(s.x,s.z,s.w/2,s.d/2,0,s.top,'floor',true,0,s.bottom);
for(const s of [...MAPLE_FOOTINGS.beams,...MAPLE_FOOTINGS.ties]){
  putSolid(s.x,s.z,s.w/2,s.d/2,0,s.top,'slab',true,0,s.bottom);
}
for (const b of BRIDGES) for (const sign of [-1,1]) {
  const x=b.x+sign*(b.halfWidth-.13);
  const rail=putSolid(x,b.z,.105,b.length/2,0,1.21,'bridgeRail',false);
  rail.bridge=b;
  if(!b.maple)for(let j=1;j<=14;j+=3) {
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
  if(s.stone) return rockRange(s.stone,a,b,pad).high;
  if(s.kind==='suzuriBasin'){
    if(onSuzuriLand(a,b))return s.top+okaHeight(a,b);
    const r=bathRadius(capitalInkstone,x,z);
    return r<=1?s.top+suzuriBedElevation(a,b,r):-Infinity;
  }
  if (s.pilgrimKind)return pilgrimRoofContact(s,a,b,pad);
  if (s.kind === 'bell') {
    // The bronze waist narrows toward the shoulder. Each vertical line meets
    // the same piecewise-conical profile used by the cast metal and notices.
    const radius=hypot(a,b)-pad,p=s.profile;
    if(radius>p[0][1])return -Infinity;
    for(let i=p.length-1;i>0;i--){
      const [h,r]=p[i],[h0,r0]=p[i-1];
      if(radius<=r)return s.bottom+h;
      if(radius<=r0)return s.bottom+h0+(h-h0)*(r0-radius)/(r0-r);
    }
  }
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
  if (s.kind === 'roofWall') return surfaceHeight(s.sheet,x,z,pad);
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
    if (feet + body < item.bottom && !(item.stone && feet === -Infinity && supportOnly)) continue;
    if (supportOnly && feet === -Infinity && !item.support) continue;
    if(item.kind==='wood'){
      // Heightless queries also cast the historic resident population and
      // reserve hawk perches. That survey measures the bole at ground level.
      // Physical walkers, jumps and projectiles always supply an altitude.
      if(feet===Infinity){
        if((x-item.x)**2+(z-item.z)**2<=(item.surveyRadius+pad)**2)height=max(height,item.surveyTop);
        continue;
      }
      const top=supportOnly?woodContact(item,x,z,pad,-Infinity,feet+.34,'floor'):
        woodContact(item,x,z,pad,-Infinity,feet+body,'top');
      height=max(height,top);continue;
    }
    const sheet = item.kind === 'roof' || item.kind === 'pagodaEave' ||
      item.kind === 'awning' || item.kind === 'toriiCrown';
    const top = surfaceHeight(item,x,z,item.kind==='slab' && feet!==Infinity ? 0 : pad);
    // Posts and upright walls block walking from the side. A falling
    // character can still come to rest on their exposed upper face.
    if (item.stone && feet !== -Infinity && feet+body <= lowerFace(item,top,x,z,pad)) continue;
    if (top === -Infinity || supportOnly && !item.support && feet < top-.015) continue;
    if (item.kind === 'slab' && feet < top-.34) continue;
    if (sheet) {
      if (feet < top - .34 && (supportOnly || feet + body <= lowerFace(item,top))) continue;
    }
    if ((item.kind === 'bridgeRail' || item.roundBottom) && feet+body <= lowerFace(item,top)) continue;
    height = max(height,top);
  }
  return height;
}
export const solidHeightAt = (x, z, clearance = 0, y = Infinity) => highest(x, z, clearance, y, false);
// The swimming line is part of locomotion even when grass mochi passes through scenery.
export function swimSurfaceAt(x,z,feet) {
  return palaceWaterlineAt(x,z,feet) ?? max(WATER_Y,mountainStreamWaterAt(x,z));
}
export function canDiveAt(x,z,feet) {
  const line=swimSurfaceAt(x,z,feet);
  return feet<=line+.01 && line-max(terrainContactHeight(x,z),boardingHeightAt(x,z))>.74 &&
    waterSurfaceAt(x,z,0,feet)===line;
}
export function landscapeFloor(x, z, feet=Infinity) {
  return max(swimSurfaceAt(x,z,feet)-.57,terrainContactHeight(x,z));
}
export function groundHeight(x, z, feet = -Infinity) {
  const b = bridgeAt(x, z);
  const deck = b ? bridgeHeight(b, z) : -Infinity;
  const onBridge = b && (feet === -Infinity || feet >= deck - .36);
  return max(onBridge ? deck : -Infinity, landscapeFloor(x, z, feet), highest(x, z, 0, feet, true));
}
export function waterDepth(x,z,time=0,feet=Infinity) {
  const line=waterSurfaceAt(x,z,time,feet);
  if(abs(x-capitalInkstone.x)<6.5 && abs(z-capitalInkstone.z)<4.5)
    return max(0,line-groundHeight(x,z,line+.15));
  return max(0,line-terrainContactHeight(x,z));
}
function lowerFace(item,top,x,z,pad) {
  if(item.stone) {
    const dx=x-item.x,dz=z-item.z;
    return rockRange(item.stone,dx*item.c-dz*item.s,dx*item.s+dz*item.c,pad).low;
  }
  if(item.roundBottom)return item.top-2*item.roundHeight+(item.top-top);
  if (item.kind === 'roof' || item.kind === 'pagodaEave') return top - (item.thickness ?? Math.max(.10,item.form==='hip'?.09*item.roofRise:0));
  if (item.kind === 'awning') return top-.044;
  if (item.kind === 'bridgeRail') return top-1.65;
  if (item.kind === 'toriiCrown') return top-item.thickness;
  return item.bottom;
}
export function overheadHeight(x, z, feet, radius = 0, roofsOnly = false) {
  const bridge = bridgeAt(x,z);
  const deck = bridge ? bridgeHeight(bridge,z) : -Infinity;
  let ceiling = feet < deck - .34 ? deck - .235 : Infinity;
  for (const item of cells.get(cell(x,z)) || []) {
    if (roofsOnly && item.kind !== 'roof' && item.kind !== 'awning' &&
        item.kind !== 'pagodaEave' && item.kind !== 'ceiling') continue;
    if(item.kind==='wood'){
      ceiling=min(ceiling,woodContact(item,x,z,radius,feet,Infinity,'ceiling'));continue;
    }
    const top = surfaceHeight(item,x,z,item.kind==='slab' ? 0 : radius);
    if (top <= feet + .34) continue;
    const bottom = lowerFace(item,top,x,z,radius);
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
  if (terrainContactHeight(x,z) > feet+.001 || palaceSolid(x,z,feet,palaceBed,body,radius)) return true;
  const bridge=bridgeAt(x,z);
  if (bridge) {
    const deck=bridgeHeight(bridge,z);
    if (deck > feet+.001 && deck-.235 < feet+body) return true;
  }
  for (const item of cells.get(cell(x,z)) || []) {
    if (item.bottom >= feet+body) continue;
    if(item.kind==='wood'){
      if(woodContact(item,x,z,radius,feet+.001,feet+body,'top')>feet+.001)return true;
      continue;
    }
    const top=surfaceHeight(item,x,z,radius);
    if (top > feet+.001 && lowerFace(item,top,x,z,radius) < feet+body) return true;
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
  if(item.kind==='wood')return woodContact(item,x,z,radius,feet+.34,feet+body,'depth');
  const top=surfaceHeight(item,x,z,radius);
  if (top <= feet+.34 || lowerFace(item,top,x,z,radius) >= feet+body) return 0;
  if (item.stone) return top - feet - .34;
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
    if(item.stone || item.kind==='wood'){
      const depth=(u,v)=>sidePenetration(item,u,v,feet,radius,body);
      if(!depth(nx,nz))continue;
      const gx=depth(nx+.005,nz)-depth(nx-.005,nz),gz=depth(nx,nz+.005)-depth(nx,nz-.005);
      const norm=gx*gx+gz*gz,into=dx*gx+dz*gz;
      if(norm>1e-12 && into>0){
        const tx=wrapCoord(nx-gx*into/norm),tz=wrapCoord(nz-gz*into/norm);
        if(free(tx,tz))return {x:tx,z:tz};
      }
      continue;
    }
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
