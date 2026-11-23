import { onKaedeWaterStep } from './kaede-water-steps.js';
import { fireTrailDistance, inFireMeadow } from './higashiyama.js';
import { POUNDING } from './festival.js';
import { inMountainStreamClearing } from './mountain-streams.js';
import { WAYSIDE_SITES,inHutYard,onTeaFootpath } from './wayside-hut-layout.js';
import { SEAPORTS,portReserved } from './seaport-layout.js';
import { HERBS, HERB_FORMS } from './meadow-herbs.js';
// One repeatable planting plan per 26 m square. All coordinates here are canonical.
import { KIYOMIZU, kiyomizuClearing } from './kiyomizu-layout.js';
import { RASHOMON, GATE_STONE, GATE_WING, gateStoneRise } from './kyo-layout.js';
import { STREET_BEATS } from './street-watch-layout.js';
import { TERRAIN_TILES, TERRAIN_SUBDIVISIONS } from './geography.js';
import { LAKE_ISLET, isletRadius } from './snow-country.js';
import { COURT, RETREATS, reservedScenery } from './retreat-layout.js';
import { scrollCoverage } from './scroll-paper.js';
import { SNOW_SPRING, springRadius, BOUND, BUILDINGS, BRIDGES, GATES, gateFooting, MARKET_STALLS, ROCKS, REGIONS, TREES, WATER_Y,
  nearRoad, seeded, seasonAt, shoreDistance, riverZ, riverHalfWidth, terrainHeight, terrainMeshHeight } from './terrain.js';

export const MEADOW_TILES = 122;
export const MEADOW_TILE = 2 * BOUND / MEADOW_TILES;
const rows = 31;
const {abs, sin, cos, floor, hypot} = Math;

// Common companions occupy the open spaces between colonies of the dominant species.
const flora = {
  meadow: [0,0,0,1,1,6,6,7,8,9,10,16,17,18],
  bank:   [1,1,1,2,3,3,4,5,11,13,14,14],
  wood:   [0,4,4,4,5,5,8,12,12,13,13,17],
  ridge:  [0,0,1,2,2,7,9,10,12,12,15,16],
  autumn: [0,1,2,2,2,4,7,9,12,15,15,16],
  coast:  [0,0,1,1,1,2,2,6,10,19,19,19],
  snow:   [0,1,1,2,2,2,12,12,17],
  moon:   [0,1,2,2,2,2,6,9,10,15,15,16],
};

const spreading=new Set([0,1,2,4,5,6,12,13,17,19]);

function tileKey(x,z) { return floor((x + BOUND) / MEADOW_TILE) * MEADOW_TILES + floor((z + BOUND) / MEADOW_TILE); }

// A crown can shelter seedlings on either side of a streaming tile boundary.
const shadeCells=new Map();
const shadeKey=(i,j)=>i*1024+j;
for(const tree of TREES){
  const reach=tree.h*.44+1.3, crown={x:tree.x,z:tree.z,r2:reach*reach};
  for(let i=floor((tree.x-reach)/8);i<=floor((tree.x+reach)/8);i++){
    for(let j=floor((tree.z-reach)/8);j<=floor((tree.z+reach)/8);j++){
      const key=shadeKey(i,j);
      if(!shadeCells.has(key))shadeCells.set(key,[]);
      shadeCells.get(key).push(crown);
    }
  }
}

function colonySeed(i,j){
  const hash=Math.imul(i,73856093)^Math.imul(j,19349663);
  return Math.imul(hash^(hash>>>16),1597334677)>>>0;
}

export function meadowExclusions(objects,residents=[]) {
  const clearings = new Map();
  const add = (x,z,r,covered) => {
    for (let a=floor((x-r+BOUND)/MEADOW_TILE); a<=floor((x+r+BOUND)/MEADOW_TILE); a++)
      for (let b=floor((z-r+BOUND)/MEADOW_TILE); b<=floor((z+r+BOUND)/MEADOW_TILE); b++) {
        const key=a*MEADOW_TILES+b;
        if (!clearings.has(key)) clearings.set(key,[]);
        clearings.get(key).push(covered);
      }
  };
  const circle = (x,z,r) => add(x,z,r,(u,v)=>(u-x)**2+(v-z)**2 < r*r);
  const gateRadius=Math.hypot(GATE_STONE.width/2+GATE_STONE.count*GATE_STONE.going,
    GATE_STONE.depth/2+GATE_STONE.count*GATE_STONE.going+GATE_STONE.apronDepth);
  add(RASHOMON.x,RASHOMON.z,gateRadius,(x,z)=>{
    const u=x-RASHOMON.x,v=z-RASHOMON.z;
    return gateStoneRise(u,v)>0 || (abs(abs(u)-GATE_WING.x)<GATE_WING.w/2 && abs(v-GATE_WING.z)<GATE_WING.d/2+.12);
  });
  // The shrine steps and strand have their own low lakeside planting.
  add(LAKE_ISLET.x,LAKE_ISLET.z,LAKE_ISLET.rx*1.3,(x,z)=>isletRadius(x,z)<1.03);
  add(COURT.x,COURT.z+11.5,29,reservedScenery);
  add(KIYOMIZU.x,KIYOMIZU.z-16,36,kiyomizuClearing);
  for(const s of RETREATS)add(s.x,s.z,15,reservedScenery);
  const fishingBath=RETREATS.find(s=>s.kind==='shore'),ca=Math.cos(fishingBath.yaw),sa=Math.sin(fishingBath.yaw);
  add(fishingBath.x,fishingBath.z,25,(x,z)=>{
    const dx=x-fishingBath.x,dz=z-fishingBath.z,u=dx*ca-dz*sa,v=dx*sa+dz*ca;
    return (u>-11.64 && u<-8.36 && v>-2.32 && v<1.08) || (u>-25 && u<-5.7 && Math.abs(v+4.07)<.48);
  });
  for(const s of WAYSIDE_SITES)
    add(s.x,s.z,14,s.kind==='chaya' ? (x,z)=>inHutYard(x,z)||onTeaFootpath(s,x,z) : inHutYard);
  for(const p of SEAPORTS)add(p.x,p.z,72,portReserved);
  for(const beat of STREET_BEATS)for(const hearth of beat.hearths)circle(hearth.x,hearth.z,.80);
  add(SNOW_SPRING.x,SNOW_SPRING.z,17,(x,z)=>springRadius(x,z)<1.18);
  for (const b of BUILDINGS) add(b.x,b.z,hypot(b.w,b.d)*.65+5,(x,z)=>{
    const dx=x-b.x, dz=z-b.z;
    return abs(dx*b.cos-dz*b.sin)<b.w*.52+.45 && abs(dx*b.sin+dz*b.cos-.85)<b.d*.5+1.55;
  });
  for (const b of BRIDGES) add(b.x,b.z,b.length*.5+.9,(x,z)=>abs(x-b.x)<b.halfWidth+.4 && abs(z-b.z)<b.length*.5+.9);
  for(const g of GATES)for(const side of [-1,1])for(const lamp of [false,true]){
    const foot=gateFooting(g,side,lamp);
    circle(foot.x,foot.z,foot.radius+.35);
  }
  for (const [x,z] of MARKET_STALLS) circle(x,z,3.1);
  for (const b of ROCKS) circle(b.x,b.z,Math.max(b.rx,b.rz));
  for (const o of objects) circle(o.x,o.z,o.type==='onsen'?4.8:o.type==='port'?3.0:1.85);
  for (const n of residents) if(n.encounter) circle(n.homeX,n.homeZ,n.travel+2.3);
  for (const r of REGIONS) circle(r.x,r.z,4.4);
  circle(POUNDING.x,POUNDING.z,6); circle(-55,290,7); circle(143,96,5);
  // The earthen borders of the planted paddies are left as narrow green lanes.
  for (let row=0;row<4;row++) for (let col=0;col<6;col++) {
    const x=105+col*16.2+sin(row)*4,z=123+row*12.8;
    if (BUILDINGS.some(b=>hypot(x-b.x,z-b.z)<12)||nearRoad(x,z,3)) continue;
    add(x,z,9,(u,v)=>abs(x-u)<6.8 && abs(z-v)<5.4);
  }
  return clearings;
}

// The long lake escarpment turns south at the maple valley. Test the actual
// triangle supporting the root, so grass up on the lip can still meet bare
// slate one step down, and the fan at the foot keeps its meadow.
const groundStep=2*BOUND/(TERRAIN_TILES*TERRAIN_SUBDIVISIONS);
function onSlateFace(x,z,heightAt) {
  if(x<=0 || x>=314 || z< -308 || z>= -189 ||
     (abs(z+303.75)>3.8 && abs(x-308.75)>3.8))return false;
  const west=floor(x/groundStep)*groundStep,north=floor(z/groundStep)*groundStep;
  const east=heightAt(west+groundStep,north),south=heightAt(west,north+groundStep);
  const top=x-west+z-north<=groundStep ? heightAt(west,north) : heightAt(west+groundStep,north+groundStep);
  return (east-top)**2+(south-top)**2>(1.55*groundStep)**2;
}

// Each plant is emitted once, independent of camera, travel direction and budgets.
export function visitMeadowTile(i,j,clearings,visit) {
  const rng=seeded((i+1)*44017 ^ (j+8)*52973), x0=i*MEADOW_TILE-BOUND,z0=j*MEADOW_TILE-BOUND;
  // Discard deep sea before surveying the individual roots.
  if(shoreDistance(x0+MEADOW_TILE/2,z0+MEADOW_TILE/2) < -MEADOW_TILE) return 0;
  const masks=clearings.get(tileKey(x0+1,z0+1))||[];
  // Blend the open paper near processions continuously into surrounding fields.
  const nw=scrollCoverage(x0,z0),ne=scrollCoverage(x0+MEADOW_TILE,z0);
  const sw=scrollCoverage(x0,z0+MEADOW_TILE),se=scrollCoverage(x0+MEADOW_TILE,z0+MEADOW_TILE);
  // Adjacent stems share three lattice samples on the rendered ground.
  const lattice=new Map();
  function heightAt(x,z){
    const key=x*65536+z;
    if(!lattice.has(key))lattice.set(key,terrainHeight(x,z));
    return lattice.get(key);
  }
  const season={}; let count=0;
  for (let a=0;a<rows;a++) for (let b=0;b<rows;b++) {
    const x=x0+(a+.05+.9*rng())*MEADOW_TILE/rows, z=z0+(b+.05+.9*rng())*MEADOW_TILE/rows;
    const uTile=(x-x0)/MEADOW_TILE,vTile=(z-z0)/MEADOW_TILE;
    const scroll=(nw+(ne-nw)*uTile)*(1-vTile)+(sw+(se-sw)*uTile)*vTile;
    const shore=shoreDistance(x,z);
    if (shore<3 || nearRoad(x,z,.13) || masks.some(f=>f(x,z)) || inMountainStreamClearing(x,z)) continue;
    const y=terrainMeshHeight(x,z,heightAt);
    if (y<WATER_Y+.13) continue;
    seasonAt(x,z,season);
    const wave=sin(x*.177+2*sin(z*.127))+cos(z*.199+x*.071)+sin(z*.048-x*.125);
    // Draw separated banks of grass. Bare paper around the animal groups
    // shows the feet, instruments and the space between two facing figures.
    const cover=(.83+wave*.078-season.snow*.57)*(1-scroll*(.21-.19*wave));
    if (rng()>cover) continue;
    const wet=x>-250 && x<380 && y<9 && abs(z-riverZ(x))-riverHalfWidth(x)<9;
    const coast=shore<27;
    const crowns=shadeCells.get(shadeKey(floor(x/8),floor(z/8)));
    const shadeTree=crowns?.some(c=>(x-c.x)**2+(z-c.z)**2<c.r2);
    const palette=season.snow>.50?'snow':wet?'bank':coast?'coast':shadeTree?'wood':
      season.moon>.49?'moon':season.autumn>.43?'autumn':y>32?'ridge':'meadow';
    const list=flora[palette];
    // Colonies have a coherent centre. The edges dissolve into shorter grass
    // and scattered companions, with boundaries that run across streaming tiles.
    const u=x*.106+.27*sin(z*.16)+.31*cos((x+z)*.086), v=z*.121+.37*cos(x*.13-z*.05);
    const cellX=floor(u),cellZ=floor(v),bed=colonySeed(cellX,cellZ);
    const dx=u-cellX-.5,dz=v-cellZ-.5;
    const centre=Math.max(0,1-3.65*(dx*dx+dz*dz));
    const dominant=rng()<centre*.89;
    const family=list[dominant ? bed%list.length : floor(rng()*list.length)];
    const form=floor(rng()*HERB_FORMS);
    const size=(.55+rng()*.66+centre*.23)*(1+wave*.048)*(1-season.snow*.40)*(1-scroll*(.27-.06*wave));
    const [,stature,spread]=HERBS[family],height=size*stature,width=height*spread*(.84+rng()*.38);
    const shade=(shadeTree ? .74 : .80)+.23*rng(), hue=season.snow+season.autumn*.34+season.moon*.14+(coast ? .13 : 0)+scroll*.10;
    const angle=dominant ? (bed%997)*.0063+(rng()-.5)*2.20 : rng()*Math.PI*2;
    // Leave a single-file tread. Ferns along the bank can lean over its edge.
    const pathDistance=fireTrailDistance(x,z);
    if(pathDistance<.54+width*.25 || inFireMeadow(x,z,width*.25))continue;
    // Prune after drawing the seed. Adjacent ledges and the opposite bank
    // retain exactly the same plants, including the younger daughter shoots.
    if(!onSlateFace(x,z,heightAt) && !onKaedeWaterStep(x,z,width*.42)){
      visit(x,y-.022,z,width,height,angle,family*HERB_FORMS+form,shade,hue);
      count++;
    }
    // Rhizomes and stolons send up younger shoots a handspan from the parent.
    // These give the dense beds knots of stems and open paper between them.
    if(!spreading.has(family) || rng()>.10+centre*.32)continue;
    const bearing=angle+(rng()-.5)*3.4,step=.14+rng()*.36;
    const sx=x+cos(bearing)*step,sz=z+sin(bearing)*step;
    if(sx<x0 || sx>=x0+MEADOW_TILE || sz<z0 || sz>=z0+MEADOW_TILE)continue;
    const localShore=shoreDistance(sx,sz);
    if(localShore<3 || (family===19 && localShore>=27) || nearRoad(sx,sz,.13) || masks.some(f=>f(sx,sz)))continue;
    const sy=terrainMeshHeight(sx,sz,heightAt);
    if(sy<WATER_Y+.13)continue;
    const young=.45+rng()*.30;
    if(pathDistance<2 && fireTrailDistance(sx,sz)<.54+width*young*.25 ||
       inFireMeadow(sx,sz,width*young*.25))continue;
    const seedlingForm=family*HERB_FORMS+floor(rng()*2);
    if(!onSlateFace(sx,sz,heightAt) && !onKaedeWaterStep(sx,sz,width*young*.42)){
      visit(sx,sy-.022,sz,width*young*.91,height*young,bearing,seedlingForm,shade*.98,hue);
      count++;
    }
  }
  return count;
}
