// Both travellers visit the whole toroidal map. Each saved journey has its
// own sequence of destinations, times, headings and flight levels.
import { BOUND, REGIONS, seeded, wrapCoord, wrapDelta } from './terrain.js';

export const legendary=type=>type==='dragon' || type==='kirin';
const grid=5, sectors=grid*grid, stops=sectors+REGIONS.length, width=2*BOUND/grid;
const cache=new WeakMap();
const mod=(value,size)=>(value%size+size)%size;
export const circuitTime=n=>n.type==='dragon'?1380:1860;

function circuitSeed(n,lap) {
  return n.flightSeed ^ (n.type==='dragon'?0x51fa87:0x72bc39) ^ Math.imul(lap+1,0x9e3779b1);
}
function location(n,seed,cell) {
  const random=seeded(seed ^ Math.imul(cell+1,0x85ebca77));
  return {
    x:wrapCoord(n.homeX+(cell%grid+(random()-.5)*.70)*width),
    z:wrapCoord(n.homeZ+(Math.floor(cell/grid)+(random()-.5)*.70)*width)
  };
}
function startCell(seed) {
  return Math.floor(seeded(seed ^ 0x67ae3f1)()*sectors);
}
const firstValley=seed=>(seed&1)?'shrine':'spring';
function landmarkStops(random,openingExit) {
  return REGIONS.map(place=>{
    const x=place.x+(random()-.5)*27,z=place.z+(random()-.5)*27;
    // Enter from the opposite side of the starting view to the valley we'll
    // turn toward, so the entire length passes in front of the ferry.
    return {district:place.id,x:place.id==='market' && openingExit==='spring'?-x:x,z};
  });
}
function drawCircuit(n,lap) {
  const dragon=n.type==='dragon', opening=dragon && lap===0;
  const seed=circuitSeed(n,lap), random=seeded(seed), points=[], durations=[], arrivals=[];
  const cells=Array.from({length:sectors},(_,i)=>location(n,seed,i));
  // The larger island has a wide open sea. Link the open-sky turns with one
  // approach over each landmark so every district can still see the travellers.
  cells.push(...landmarkStops(random,opening && firstValley(seed)));
  const nextSeed=circuitSeed(n,lap+1);
  const nextStart=dragon && lap===-1 ? landmarkStops(seeded(nextSeed),firstValley(nextSeed)).find(p=>p.district==='market')
    : location(n,nextSeed,startCell(nextSeed));
  const levels=dragon?[23,42,70,106,142]:[3.2,6,18,38,66];
  const deck=cells.map((_,i)=>levels[i%levels.length]);
  let chosen=opening ? cells.findIndex(p=>p.district==='market') : startCell(seed), vx=0, vz=0;
  // Draw unvisited cells without replacement. Moderately long flights and
  // turns have substantial weight; neither latitude nor longitude orders them.
  while(cells.length) {
    const point=cells.splice(chosen,1)[0];
    const band=deck.splice(Math.floor(random()*deck.length),1)[0];
    // On a new journey the first pass crosses the market skyline directly
    // ahead of the ferry. The rest of the circuit belongs to this save's seed.
    const level=opening && points.length<2 ? (points.length===0?23:36) : band;
    point.clearance=level*(.92+.16*random());
    points.push(point);
    if(!cells.length) break;
    let total=0;
    const weights=cells.map(candidate=>{
      const dx=wrapDelta(candidate.x-point.x),dz=wrapDelta(candidate.z-point.z);
      const distance=Math.max(.01,Math.hypot(dx,dz));
      const alignment=(vx*dx+vz*dz)/distance;
      const proximity=1/(1+(distance/(n.type==='dragon'?265:220))**4);
      total+=proximity*(1+.34*alignment);
      return total;
    });
    const draw=random()*total;
    chosen=weights.findIndex(weight=>weight>draw);
    if(opening && points.length===1) {
      chosen=cells.findIndex(p=>p.district===firstValley(seed));
    }
    const next=cells[chosen],dx=wrapDelta(next.x-point.x),dz=wrapDelta(next.z-point.z);
    const length=Math.max(.01,Math.hypot(dx,dz));
    vx=dx/length;vz=dz/length;
  }
  let sum=0;
  for(let i=0;i<points.length;i++) {
    const from=points[i],to=points[i+1] || nextStart;
    const length=Math.hypot(wrapDelta(to.x-from.x),wrapDelta(to.z-from.z));
    durations.push(length);sum+=length;
  }
  const tourTime=circuitTime(n), pause=n.type==='dragon'?3:5;
  let elapsed=0;
  for(let i=0;i<stops;i++) {
    arrivals.push(elapsed);
    durations[i]=pause+(tourTime-stops*pause)*durations[i]/sum;
    elapsed+=durations[i];
  }
  return {points,durations,arrivals};
}

function itinerary(record,n,lap) {
  let tour=record.circuits.get(lap);
  if(!tour) {
    tour=drawCircuit(n,lap);
    if(record.circuits.size===4) record.circuits.delete(record.circuits.keys().next().value);
    record.circuits.set(lap,tour);
  }
  return tour;
}

// The same velocity leaves and enters a waypoint even when the two flight
// times differ. Limit its magnitude to keep short turns inside their valley.
function tangent(dx,dz,nx,nz,beforeTime,afterTime,dragon,firstPass) {
  const before=Math.max(.01,Math.hypot(dx,dz)), after=Math.max(.01,Math.hypot(nx,nz));
  const speed=Math.min(before/beforeTime,after/afterTime);
  if(dragon) {
    // A bisector with finite speed describes a sweeping turn even when the
    // next valley lies back along the approach. Averaging the velocities
    // would stop the long body and spin the tail through the skyline.
    const turn=Math.atan2(dz*nx-dx*nz,dx*nx+dz*nz);
    const heading=firstPass ? Math.atan2(nx,nz) : Math.atan2(dx,dz)+turn*.5;
    return {x:.86*speed*Math.sin(heading),z:.86*speed*Math.cos(heading)};
  }
  const scale=.47*speed;
  return {x:(dx/before+nx/after)*scale,z:(dz/before+nz/after)*scale};
}
function segment(record,n,key) {
  let leg=record.legs.get(key);
  if(leg) return leg;
  const index=mod(key,stops), lap=Math.floor(key/stops), tour=itinerary(record,n,lap);
  const prior=index===0?itinerary(record,n,lap-1):tour;
  const next=index>=stops-2?itinerary(record,n,lap+1):tour;
  const a=prior.points[mod(index-1,stops)],b=tour.points[index];
  const c=index+1<stops?tour.points[index+1]:next.points[0];
  const d=index+2<stops?tour.points[index+2]:next.points[mod(index+2,stops)];
  const duration=tour.durations[index],previousTime=prior.durations[mod(index-1,stops)];
  const nextTime=index+1<stops?tour.durations[index+1]:next.durations[0];
  const dx=wrapDelta(c.x-b.x), dz=wrapDelta(c.z-b.z);
  const dragon=n.type==='dragon';
  const from=tangent(wrapDelta(b.x-a.x),wrapDelta(b.z-a.z),dx,dz,previousTime,duration,dragon,key===0);
  const to=tangent(dx,dz,wrapDelta(d.x-c.x),wrapDelta(d.z-c.z),duration,nextTime,dragon,key===-1);
  leg={b,c,dx,dz,from,to,duration};
  if(record.legs.size===8) record.legs.delete(record.legs.keys().next().value);
  record.legs.set(key,leg);
  return leg;
}

export function legendPath(n,time,out) {
  let record=cache.get(n);
  if(!record || record.seed!==n.flightSeed) {
    record={seed:n.flightSeed,circuits:new Map(),legs:new Map()};
    cache.set(n,record);
  }
  const total=circuitTime(n), lap=Math.floor(time/total), local=time-lap*total;
  const tour=itinerary(record,n,lap);
  let i=0;
  while(i+1<stops && tour.arrivals[i+1]<=local) i++;
  const {b,c,dx,dz,from,to,duration}=segment(record,n,lap*stops+i);
  const u=Math.min(1,(local-tour.arrivals[i])/duration);
  const ease=u*u*(3-2*u), lift=u*(1-u)*(1-u)*duration, settle=u*u*(u-1)*duration;
  out.x=wrapCoord(b.x+dx*ease+from.x*lift+to.x*settle);
  out.z=wrapCoord(b.z+dz*ease+from.z*lift+to.z*settle);
  const rate=6*u*(1-u)/duration, push=(1-u)*(1-3*u), pull=u*(3*u-2);
  const vx=dx*rate+from.x*push+to.x*pull, vz=dz*rate+from.z*push+to.z*pull;
  out.speed=Math.hypot(vx,vz);
  out.heading=Math.atan2(vx,vz);
  out.clearance=b.clearance+(c.clearance-b.clearance)*ease;
  return out;
}
