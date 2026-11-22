// Passing showers are tied to world metres and the saved journey clock. A
// pilgrim looking down from the sanctuary sees the same squall the foxes walk in.
import { REGIONS } from './terrain.js';
import { WORLD_BOUND, wrapWorld } from './geography.js';
import { WEDDING_SITES } from './pilgrimage-layout.js';

const district = REGIONS.find(place => place.id === 'inari');
const districts = REGIONS.map(place => ({
  x: place.district?.[0] ?? place.x, z: place.district?.[1] ?? place.z,
  scaleX: place.districtScaleX ?? 1, isInari: place === district,
}));
const [shrineX, shrineZ] = district.district;
const grid = 32, tile = 2 * WORLD_BOUND / grid;
const stormCache = new Array(grid * grid);
const maxDrift = 70, maxRadius = 73, thunderReach = 190;
const tau = 2 * Math.PI;

function smooth(value) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

// Use the same district centres, toroidal distances and stretched snow basin
// as the travel map. Inari extends beyond the mountainside and the torii route.
function districtMargin(x, z) {
  const own = Math.hypot(wrapWorld(x-shrineX), wrapWorld(z-shrineZ));
  let nearest = Infinity;
  for (const place of districts) {
    if (place.isInari) continue;
    const dx = wrapWorld(x-place.x) * place.scaleX, dz = wrapWorld(z-place.z);
    nearest = Math.min(nearest, dx*dx + dz*dz);
  }
  return Math.sqrt(nearest) - own;
}

function hash(value) {
  let h = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  return (h ^ (h >>> 15)) >>> 0;
}

function makePass(key, index, start, col, row) {
  const id = hash(key ^ Math.imul(index+1, 0x9e3779b9));
  let state = id;
  const random = () => (state=hash(state+0x9e3779b9)) / 4294967296;
  const angle = random()*tau, speed = 1.8 + random()*1.35;
  const windX = Math.cos(angle)*speed, windZ = Math.sin(angle)*speed;
  const duration = 39 + 10*random();
  const originX = (col+.5)*tile + (random()-.5)*50, originZ = (row+.5)*tile + (random()-.5)*50;
  const travel = 80 + 60*random(), vx = Math.cos(angle)*travel, vz = Math.sin(angle)*travel;
  const lightning = random() < .21;
  const strike = .3 + .42*random();
  return {
    id, index, start, duration, originX, originZ, vx, vz, windX, windZ,
    radius: 54 + 19*random(), peak: .9 + .1*random(),
    strikeAt: lightning ? start + duration*strike : Infinity,
    strikeX: wrapWorld(originX + vx*(strike-.5)), strikeZ: wrapWorld(originZ + vz*(strike-.5)),
    sampledAt: NaN, x: 0, z: 0, strength: 0,
  };
}

function showerAt(col, row, time, seed) {
  const c = ((col % grid) + grid) % grid, r = ((row % grid) + grid) % grid;
  const address = r*grid+c;
  let station = stormCache[address];
  if (!station || station.seed !== seed) {
    const key = hash(seed ^ Math.imul(address+1, 0x85ebca6b));
    const period = 54 + 13 * (key / 4294967296);
    station = {seed, key, period, offset: period * (hash(key+1) / 4294967296)};
    stormCache[address] = station;
  }
  const index = Math.floor((time+station.offset)/station.period);
  let pass = station.pass;
  if (!pass || pass.index !== index) {
    pass = makePass(station.key,index,index*station.period-station.offset,c,r);
    station.pass = pass;
  }
  if (pass.sampledAt !== time) {
    pass.sampledAt = time;
    const progress = (time-pass.start)/pass.duration;
    pass.x = wrapWorld(pass.originX + pass.vx*(progress-.5));
    pass.z = wrapWorld(pass.originZ + pass.vz*(progress-.5));
    const envelope = smooth(progress/.13) * smooth((1-progress)/.17);
    pass.strength = envelope * pass.peak;
    if(pass.strength)pass.strength *= smooth(districtMargin(pass.x,pass.z)/24);
  }
  return pass;
}

function eachNearby(x, z, time, seed, range, visit) {
  // Centres jitter by 25 m from their tile, then drift at most 70 m.
  const reach = range + 25 + maxDrift;
  const left = Math.ceil((x-reach)/tile-.5), right = Math.floor((x+reach)/tile-.5);
  const top = Math.ceil((z-reach)/tile-.5), bottom = Math.floor((z+reach)/tile-.5);
  for(let row=top; row<=bottom; row++) for(let col=left; col<=right; col++) {
    const pass = showerAt(col,row,time,seed);
    if(pass.strength>0)visit(pass);
  }
}

// The borrowed cell is valid for this callback. The range measures distance
// to the near edge of the rain curtain, so it can become visible from dry land.
export function visitInariShowers(x, z, time, seed, range, visit) {
  x=wrapWorld(x); z=wrapWorld(z);
  if (districtMargin(x,z) < -2.5*(range+maxRadius)) return;
  eachNearby(x,z,time,seed,range+maxRadius,pass=>{
    const dx=wrapWorld(x-pass.x), dz=wrapWorld(z-pass.z);
    if(dx*dx+dz*dz <= (range+pass.radius)**2)visit(pass);
  });
}

function weddingDrizzle(x, z, time) {
  let rain = 0;
  for (const [i,site] of WEDDING_SITES.entries()) {
    const dx = wrapWorld(x-site.x)/(site.rx+20), dz = wrapWorld(z-site.z)/22;
    const weight = smooth((1-Math.hypot(dx,dz))/.49);
    rain = Math.max(rain, weight*(.46+.10*Math.sin(time*.075+i*2.093)));
  }
  return rain;
}

export function inariWeatherAt(x, z, time, seed, out={}) {
  x=wrapWorld(x); z=wrapWorld(z);
  Object.assign(out, {seed, rain:0, downpour:0, windX:0, windZ:0,
    thunder:0, thunderId:-1, thunderAt:-Infinity, thunderX:0, thunderZ:0});
  const edge = smooth(districtMargin(x,z)/18);
  if (!edge) return out;
  const drizzle = weddingDrizzle(x,z,time);
  let windWeight=0;
  eachNearby(x,z,time,seed,thunderReach,pass=>{
    const dx = wrapWorld(x-pass.x), dz = wrapWorld(z-pass.z);
    const weight = pass.strength * smooth((1-Math.hypot(dx,dz)/pass.radius)/.52);
    out.downpour = Math.max(out.downpour, weight);
    out.windX += weight*pass.windX; out.windZ += weight*pass.windZ;
    windWeight += weight;

    if(time < pass.strikeAt || time > pass.strikeAt+2.3)return;
    const distance = Math.hypot(wrapWorld(x-pass.strikeX),wrapWorld(z-pass.strikeZ));
    const arrival = pass.strikeAt + Math.hypot(distance,43)/343;
    const loudness = edge * smooth(1-distance/thunderReach);
    if(time >= arrival && time-arrival < 1.6 && loudness>out.thunder) {
      out.thunder = loudness; out.thunderId = pass.id; out.thunderAt = arrival;
      out.thunderX = pass.strikeX; out.thunderZ = pass.strikeZ;
    }
  });
  // Gentle ambient wind persists through the wedding drizzle. Overlapping
  // gusts blend at their shared edges instead of flipping drop direction.
  out.windX = (.55 + out.windX)/(1+windWeight); out.windZ = (-.26 + out.windZ)/(1+windWeight);
  out.downpour *= edge;
  out.rain = Math.max(drizzle*edge,out.downpour);
  return out;
}
