import { SEAPORTS,portReserved } from './seaport-layout.js';
// One repeatable planting plan per 26 m square. All coordinates here are canonical.
import { RASHOMON, GATE_STONE, GATE_WING, gateStoneRise } from './kyo-layout.js';
import { STREET_BEATS } from './street-watch-layout.js';
import { COURT, RETREATS, reservedScenery } from './retreat-layout.js';
import { scrollCoverage } from './scroll-paper.js';
import { SNOW_SPRING, springRadius, BOUND, BUILDINGS, BRIDGES, MARKET_STALLS, ROCKS, REGIONS, WATER_Y,
  nearRoad, seeded, seasonAt, shoreDistance, riverZ, riverHalfWidth, terrainHeight } from './terrain.js';

export const MEADOW_TILES = 122;
export const MEADOW_TILE = 2 * BOUND / MEADOW_TILES;
const rows = 29;
const {abs, sin, cos, floor, hypot} = Math;

// The integer codes are the rows in the botanical atlas. Multiplicity controls
// which plants form the matrix around the occasional flowering patches.
const flora = {
  meadow: [0,0,0,1,1,2,6,6,7,8,9,10],
  bank:   [1,1,1,2,2,3,4,5,11],
  wood:   [0,2,4,4,4,5,5,6,8,11],
  autumn: [0,1,2,2,2,4,7,8,9,11],
  coast:  [0,0,1,1,1,2,3,6,7,10],
  snow:   [0,1,1,2,2,3,7,11],
  moon:   [0,1,1,2,2,2,3,6,9,11],
};
const heightScale = [.43,.55,.74,.67,.56,.38,.26,.38,.40,.45,.35,.47];
const widthScale  = [1.55,1.34,1.08,1.02,1.5,1.68,1.65,1.3,1.37,1.28,1.53,1.18];

function tileKey(x,z) { return floor((x + BOUND) / MEADOW_TILE) * MEADOW_TILES + floor((z + BOUND) / MEADOW_TILE); }

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
  add(COURT.x,COURT.z+11.5,29,reservedScenery);
  for(const s of RETREATS)add(s.x,s.z,11,reservedScenery);
  for(const p of SEAPORTS)add(p.x,p.z,72,portReserved);
  for(const beat of STREET_BEATS)for(const hearth of beat.hearths)circle(hearth.x,hearth.z,.80);
  add(SNOW_SPRING.x,SNOW_SPRING.z,17,(x,z)=>springRadius(x,z)<1.18);
  for (const b of BUILDINGS) add(b.x,b.z,hypot(b.w,b.d)*.65+5,(x,z)=>{
    const dx=x-b.x, dz=z-b.z;
    return abs(dx*b.cos-dz*b.sin)<b.w*.52+.45 && abs(dx*b.sin+dz*b.cos-.85)<b.d*.5+1.55;
  });
  for (const b of BRIDGES) add(b.x,b.z,b.length*.5+.9,(x,z)=>abs(x-b.x)<b.halfWidth+.4 && abs(z-b.z)<b.length*.5+.9);
  for (const [x,z] of MARKET_STALLS) circle(x,z,3.1);
  for (const b of ROCKS) circle(b.x,b.z,Math.max(b.rx,b.rz));
  for (const o of objects) circle(o.x,o.z,o.type==='onsen'?4.8:o.type==='port'?3.0:1.85);
  for (const n of residents) if(n.encounter) circle(n.homeX,n.homeZ,n.travel+2.3);
  for (const r of REGIONS) circle(r.x,r.z,4.4);
  circle(307,169.8,6); circle(-55,290,7); circle(143,96,5);
  // The earthen borders of the planted paddies are left as narrow green lanes.
  for (let row=0;row<4;row++) for (let col=0;col<6;col++) {
    const x=105+col*16.2+sin(row)*4,z=123+row*12.8;
    if (BUILDINGS.some(b=>hypot(x-b.x,z-b.z)<12)||nearRoad(x,z,3)) continue;
    add(x,z,9,(u,v)=>abs(x-u)<6.8 && abs(z-v)<5.4);
  }
  return clearings;
}

// Each plant is emitted once, independent of camera, travel direction and budgets.
export function visitMeadowTile(i,j,clearings,visit) {
  const rng=seeded((i+1)*44017 ^ (j+8)*52973), x0=i*MEADOW_TILE-BOUND,z0=j*MEADOW_TILE-BOUND;
  // Skip deep-water tiles before sampling 841 individual plants.
  if(shoreDistance(x0+MEADOW_TILE/2,z0+MEADOW_TILE/2) < -MEADOW_TILE) return 0;
  const masks=clearings.get(tileKey(x0+1,z0+1))||[];
  const scroll=scrollCoverage(x0+MEADOW_TILE/2,z0+MEADOW_TILE/2);
  const season={}; let count=0;
  for (let a=0;a<rows;a++) for (let b=0;b<rows;b++) {
    const x=x0+(a+.05+.9*rng())*MEADOW_TILE/rows, z=z0+(b+.05+.9*rng())*MEADOW_TILE/rows;
    if (shoreDistance(x,z)<3 || nearRoad(x,z,.08) || masks.some(f=>f(x,z))) continue;
    const y=terrainHeight(x,z);
    if (y<WATER_Y+.13) continue;
    seasonAt(x,z,season);
    const wave=sin(x*.177+2*sin(z*.127))+cos(z*.199+x*.071)+sin(z*.048-x*.125);
    // Draw separated banks of grass. Bare paper around the animal groups
    // shows the feet, instruments and the space between two facing figures.
    const cover=(.79+wave*.069-season.snow*.53)*(1-scroll*(.225-.20*wave));
    if (rng()>cover) continue;
    const wet=abs(z-riverZ(x))-riverHalfWidth(x)<9, coast=shoreDistance(x,z)<26;
    const palette=season.snow>.50?'snow':wet?'bank':season.moon>.49?'moon':season.autumn>.43?'autumn':
      coast||season.dawn>.53?'coast':(wave<-.55 || (x < -86 && z < -53))?'wood':'meadow';
    const list=flora[palette];
    // Colonies share a dominant herb; separate sprouts vary in age, spread and tilt.
    const bed=floor((sin(x*.080+cos(z*.102)*1.4)+cos(z*.109+x*.033)+2)*71);
    const family=list[rng()<.64 ? bed%list.length : floor(rng()*list.length)];
    const form=floor(rng()*5), size=(.58+rng()*.79)*(1+wave*.039)*(1-season.snow*.36)*(1-scroll*(.35-.085*wave));
    const height=size*heightScale[family], width=height*widthScale[family]*(.86+rng()*.36);
    const shade=.72+.26*rng(), hue=season.snow*.99+season.autumn*.29+season.moon*.11+(palette==='coast'?.16:0)+scroll*.14;
    visit(x,y-.038,z,width,height,rng()*Math.PI*2,family*5+form,shade,hue);
    count++;
  }
  return count;
}
