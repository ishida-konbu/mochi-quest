import { BOUND, REGIONS, CONNECTING_ROADS, WATER_Y, terrainHeight, solidHeightAt, shoreDistance, seeded, wrapDelta } from './terrain.js';
import { OCEAN_ROUTES } from './ocean-voyage.js';
import { canopyHeight } from './village-paths.js';

const tau=Math.PI*2;
const gridSize=16, cellWidth=2*BOUND/gridSize;
const indexCell=value=>(Math.floor((value+BOUND)/cellWidth)%gridSize+gridSize)%gridSize;

// A low flock reads against an empty reach of sky. Reserve its stretch of
// coastline or valley before filling the quieter open sea and high sky.
function flightCentres(random) {
  const centres=[];
  function add(x,z,habitat,spacing) {
    x=wrapDelta(x);z=wrapDelta(z);
    if(centres.some(f=>Math.hypot(wrapDelta(f.x-x),wrapDelta(f.z-z))<spacing))return;
    centres.push({x,z,habitat});
  }
  function along(points,count,habitat,offset,spacing) {
    for(let j=0;j<count;j++) {
      const k=Math.floor((j+.24+.52*random())/count*(points.length-1));
      const [x,z]=points[k],a=random()*tau;
      add(x+offset*Math.cos(a),z+offset*Math.sin(a),habitat,spacing);
    }
  }
  // Mark both ends of the shipping passage before distributing groups
  // along its two different sea legs and the six overland approaches.
  add(-38,22,'river',122);
  add(307,242,'shore',140);
  for(const r of REGIONS.filter(r=>r.id==='tsuruga'||r.id==='sakai'))add(r.x,r.z,'shore',140);
  for(const road of CONNECTING_ROADS)along(road.points,Math.ceil(road.points.length/35),'road',15,122);
  for(const leg of OCEAN_ROUTES[0].legs)along(leg.points,Math.ceil(leg.length/152),'passage',31,148);
  for(let x=-BOUND+35;x<BOUND;x+=79)for(let z=-BOUND+35;z<BOUND;z+=79) {
    const shore=shoreDistance(x,z);
    if(shore>=-31 && shore<12 && random()<.43)add(x,z,'shore',178);
  }
  // One candidate per broad sector, with some sectors entirely empty.
  // Count density by area: a wide open sea can sustain a few distant skeins
  // while the closer land flights are concentrated around the routes above.
  for(let i=0;i<12;i++)for(let j=0;j<12;j++) {
    const x=-BOUND+(i+.17+.66*random())*(2*BOUND/12);
    const z=-BOUND+(j+.17+.66*random())*(2*BOUND/12);
    const land=shoreDistance(x,z)>0;
    if(random()<(land?.64:.48))add(x,z,land?'country':'offshore',172);
  }
  // High flights have longer wings and show up in the gaps between low flocks.
  for(let i=0;i<7;i++)for(let j=0;j<7;j++) {
    const x=-BOUND+(i+.12+.76*random())*(2*BOUND/7);
    const z=-BOUND+(j+.12+.76*random())*(2*BOUND/7);
    if(random()<.62)add(x,z,'migration',183);
  }
  return centres;
}

function localFlight(site,kind,members,random) {
  const {x,z,habitat}=site;
  const angle=random()*tau, high=habitat==='migration';
  const radius=high?24+random()*22:12+random()*22, birds=[];
  const sea=habitat==='shore'||habitat==='offshore'||habitat==='passage';
  // A swallow slips in and out of a loose party, while a tern follows the
  // bird ahead in a wavering file. Geese hold two staggered arms of a skein.
  for(let j=0;j<members;j++){
    const arm=Math.ceil(j/2),sign=j%2?1:-1;
    birds.push({
      forward:kind===0?-arm*(1.65+random()*.4):kind===2?-j*(.94+random()*.46):(random()-.5)*11,
      side:kind===0?sign*arm*(1.1+random()*.46):kind===2?2.8*Math.sin(j*.71)+1.8*(random()-.5):(random()-.5)*10,
      rise:random()*(kind===1?3.2:1.4), beat:random()*tau,
      scale:(kind===0?.94:kind===1?.61:.76)*(.84+random()*.34),
    });
  }
  // Survey the circuit and its inner and outer wing before choosing the height.
  // This costs nothing per frame, including where a shoreline rises into a cliff.
  let floor=WATER_Y;
  const sample=(sx,sz)=>{
    sx=wrapDelta(sx);sz=wrapDelta(sz);
    floor=Math.max(floor,terrainHeight(sx,sz),canopyHeight(sx,sz,3),solidHeightAt(sx,sz,3));
  };
  sample(x,z);
  for(let j=0;j<16;j++){
    const u=j*tau/16,dx=Math.sin(u),dz=Math.cos(u);
    sample(x+dx*radius*.72,z+dz*radius*.72);
    sample(x+dx*(radius+13),z+dz*(radius+13));
  }
  return {x,z,y:floor+(high?49:sea?7:11)+random()*(high?34:sea?18:14),angle,radius,
    cruise:(angle<Math.PI?1:-1)*(kind===0?3.7:kind===1?4.4:3.1)/radius,kind,birds,habitat};
}

export function createAmbientFlocks() {
  const random=seeded(0x73756261);
  const flocks=flightCentres(random).map(site=>{
    const sea=site.habitat==='shore'||site.habitat==='offshore'||site.habitat==='passage';
    const high=site.habitat==='migration';
    const kind=high?0:sea?(random()<.78?2:0):(random()<.83?1:0);
    const members=high?5+Math.floor(random()*4):3+Math.floor(random()*(kind===1?3:4));
    return localFlight(site,kind,members,random);
  });
  const cells=Array.from({length:gridSize*gridSize},()=>[]);
  for(const f of flocks){
    f.axis=f.angle;
    f.cosAxis=Math.cos(f.axis);f.sinAxis=Math.sin(f.axis);
    f.spread=3+Math.max(...f.birds.map(b=>Math.hypot(b.side,b.forward,b.rise)));
    cells[indexCell(f.x)*gridSize+indexCell(f.z)].push(f);
  }
  // A 240 m sightline plus the widest flight circuit and formation is below
  // two cells. Precompute the neighbourhood so render updates allocate nothing.
  const neighbourhoods=cells.map((_,i)=>{
    const local=[];
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const cx=(Math.floor(i/gridSize)+dx+gridSize)%gridSize,cz=(i%gridSize+dz+gridSize)%gridSize;
      local.push(...cells[cx*gridSize+cz]);
    }
    return local;
  });
  const capacity=[0,0,0];
  for(const local of neighbourhoods) {
    const count=[0,0,0];
    for(const f of local)count[f.kind]+=f.birds.length;
    for(let k=0;k<3;k++)capacity[k]=Math.max(capacity[k],count[k]);
  }
  return {flocks,capacity,near:(x,z)=>neighbourhoods[indexCell(x)*gridSize+indexCell(z)]};
}
