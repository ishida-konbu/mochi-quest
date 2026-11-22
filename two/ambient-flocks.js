// Ambient birds live entirely in the scenery. The original high migration keeps
// its routes and seed while smaller flocks follow the coast and the country roads.
import { BOUND, REGIONS, CONNECTING_ROADS, WATER_Y, terrainHeight, solidHeightAt, shoreDistance, seeded, wrapDelta } from './terrain.js';
import { OCEAN_ROUTES } from './ocean-voyage.js';
import { canopyHeight } from './village-paths.js';

const tau=Math.PI*2;
const gridSize=16, cellWidth=2*BOUND/gridSize;
const indexCell=value=>(Math.floor((value+BOUND)/cellWidth)%gridSize+gridSize)%gridSize;

function originalMigration() {
  const random=seeded(0x5a09e88), flocks=[];
  for(let i=0;i<48;i++) {
    const village=REGIONS[i%REGIONS.length], angle=random()*tau, r=16+random()*64;
    const x=i<30?village.x+Math.cos(angle)*r:2*BOUND*(random()-.5);
    const z=i<30?village.z+Math.sin(angle)*r:2*BOUND*(random()-.5);
    const kind=i%2, birds=[], members=6+Math.floor(random()*11);
    for(let j=0;j<members;j++){
      const arm=Math.ceil(j/2),side=j%2?1:-1;
      const line=i%3===0;
      birds.push({forward:(line?-j:-arm)*(1.5+random()*.65),
        side:(line?Math.sin(j*.65)*2:side*arm*(1.2+random()*.45))+random()*.7,
        rise:random()*1.3, beat:random()*tau, scale:(kind?.71:.96)*(.80+random()*.34)});
    }
    flocks.push({x,z,y:Math.max(WATER_Y,terrainHeight(x,z))+45+random()*49,
      angle,radius:17+random()*28,cruise:.065+random()*.045,kind,birds,habitat:'migration'});
  }
  return flocks;
}

// Space one group within each open-country cell, then favour the actual places
// a traveller can see from the road, a fishing beach, or a ship's deck.
function flightCentres(random) {
  const centres=[];
  for(let i=0;i<gridSize;i++)for(let j=0;j<gridSize;j++){
    const x=-BOUND+(i+.22+.56*random())*cellWidth, z=-BOUND+(j+.22+.56*random())*cellWidth;
    centres.push({x,z,habitat:shoreDistance(x,z)>0?'country':'offshore'});
  }
  function along(points,count,habitat,offset) {
    for(let j=0;j<count;j++){
      // Road and sea curves both supply samples at approximately even intervals.
      const k=Math.floor((j+.25+.5*random())/count*(points.length-1));
      const [x,z]=points[k],angle=random()*tau,drift=offset*(.4+.6*random());
      centres.push({x:wrapDelta(x+drift*Math.cos(angle)),z:wrapDelta(z+drift*Math.sin(angle)),habitat});
    }
  }
  const total=CONNECTING_ROADS.reduce((n,r)=>n+r.points.length,0);
  let used=0, samples=0;
  for(const road of CONNECTING_ROADS) {
    samples+=road.points.length;
    const end=Math.round(samples*60/total);
    along(road.points,end-used,'road',16);used=end;
  }
  // Both directions follow the same two sides of the island, a few ship lengths
  // apart. Offset the birds from the fairway so a deck passenger sees them abeam.
  const legs=OCEAN_ROUTES[0].legs;
  const longLegCount=Math.round(68*legs[0].length/(legs[0].length+legs[1].length));
  along(legs[0].points,longLegCount,'passage',38);
  along(legs[1].points,68-longLegCount,'passage',38);

  const strand=[];
  for(let x=-BOUND+35;x<BOUND;x+=68)for(let z=-BOUND+35;z<BOUND;z+=68){
    const shore=shoreDistance(x,z);
    if(shore>=-38 && shore<10)strand.push({x,z,habitat:'shore',spacing:Infinity});
  }
  // Farthest-point sampling keeps these groups on separate reaches of beach,
  // including coves and outlying islets which the shipping lanes pass by.
  let next=strand[Math.floor(random()*strand.length)];
  for(let i=0;i<48;i++){
    centres.push(next);
    next.spacing=0;
    let best=next;
    for(const site of strand) {
      const dx=wrapDelta(site.x-next.x),dz=wrapDelta(site.z-next.z);
      site.spacing=Math.min(site.spacing,dx*dx+dz*dz);
      if(site.spacing>best.spacing)best=site;
    }
    next=best;
  }
  return centres;
}

function localFlight(site,kind,members,random) {
  const {x,z,habitat}=site;
  const angle=random()*tau,radius=12+random()*22, birds=[];
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
  return {x,z,y:floor+(sea?7:11)+random()*(sea?18:14),angle,radius,
    cruise:(angle<Math.PI?1:-1)*(kind===0?3.7:kind===1?4.4:3.1)/radius,kind,birds,habitat};
}

export function createAmbientFlocks() {
  const flocks=originalMigration(), random=seeded(0x73756261);
  const centres=flightCentres(random);
  for(const [i,site] of centres.entries()) {
    const sea=site.habitat==='shore'||site.habitat==='offshore'||site.habitat==='passage';
    const kind=sea?(random()<.78?2:0):(random()<.83?1:0);
    // Repeat the distribution of sizes in the original census nine times.
    flocks.push(localFlight(site,kind,flocks[i%48].birds.length,random));
  }
  const cells=Array.from({length:gridSize*gridSize},()=>[]);
  for(const f of flocks){
    f.axis=f.habitat==='migration'?0:f.angle;
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
