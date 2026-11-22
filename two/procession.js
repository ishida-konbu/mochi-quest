// Each village draws its own band of travellers from the ten occupations.
// Feet stay off the graded road, so the original encounters and stamp routes stay open.
import { ORIGINAL_REGIONS as REGIONS, ROADS, seeded } from './terrain.js';

export const TRADES = ['flute','fan','lantern','scribe','tea','rake','fisher','drum','flowers','broom'];
export const DYES = ['#809897','#b47e66','#929a70','#a08a9d','#beaa78','#8296ac'];
const localTrades = [
  ['fisher','lantern','tea','flute'], ['scribe','broom','flowers','fan'],
  ['tea','drum','lantern','scribe'], ['broom','tea','flowers','flute'],
  ['rake','flowers','fan','drum'], ['fisher','rake','flute','lantern'],
  ['broom','scribe','lantern','tea'], ['fan','flowers','rake','flute'],
  ['flute','drum','lantern','fan'], ['fisher','drum','tea','flowers']
];
// Each rejected lot consumed three draws in the published village census.
// Preserve those counts so regrading a bank cannot change the trade, gait,
// dress or original address that an existing traveller has already visited.
// The route planner seats these residents and walks their circuits on today's terrain.
const rejectedLots=[
  [0,2,2,3,4,3,0,4,2,2,0,1,2,1,0,4,0,0,1,0,2,2,1,0,0,0,1,3,0,0,1,1,0,1,0,1,0,0,0,1],
  [0,6,0,0,1,2,10,0,2,0,0,1,2,3,0,4,1,0,0,1,0,1,0,1,0,3,4,3,1,0,2,4,6,0,0,2,0,9,0,1],
  [12,0,5,5,1,4,16,5,0,2,0,0,0,0,0,0,0,3,1,2,1,1,1,0,2,2,2,6,3,4,2,0,12,1,0,3,2,0,2,1],
  [1,1,1,1,3,2,0,2,3,3,2,0,1,0,0,2,0,1,0,0,0,0,3,7,1,0,1,1,1,0,0,4,2,0,0,1,3,0,0,4],
  [0,0,0,0,2,0,1,0,5,3,0,0,0,1,3,0,8,0,0,0,8,0,7,0,3,0,4,0,1,1,0,2,0,0,1,0,4,0,4,2],
  [0,2,0,0,0,1,2,0,0,2,0,0,1,0,0,0,0,0,0,0,0,2,2,6,4,1,0,1,0,3,3,1,0,3,0,1,0,1,3,0],
  [4,1,3,0,1,0,0,1,1,0,0,0,0,0,0,2,3,0,0,0,4,0,0,1,4,2,2,5,1,13,0,2,0,2,2,0,0,2,1],
  [0,2,2,0,2,3,0,1,0,0,10,0,2,0,0,0,3,1,0,1,1,2,0,0,0,4,0,8,3,1,0,2,0,0,4,4,1,0,1],
  [0,4,2,0,3,0,1,0,1,1,0,3,0,0,1,1,0,3,4,0,4,0,1,0,2,2,8,0,1,0,0,1,0,0,0,2,2,1,0],
  [0,0,0,0,0,1,1,0,1,0,0,0,1,0,0,1,4,0,0,0,1,0,1,3,1,0,0,0,1,0,4,2,3,1,0,1,0,4,2],
];
let recipes;
export function procession() {
  if (recipes) return recipes;
  const random = seeded(0xd8479);
  const streets = REGIONS.map(r => ROADS.flatMap(road =>
    road.points.filter((point,i) => i%2===0 && (point[0]-r.x)**2+(point[1]-r.z)**2 < 90**2)
      .map(point => ({ point, width:road.width }))));
  const spots = [], nextDye = new Map();
  for (let area=0; area<REGIONS.length; area++) {
    const village = REGIONS[area], positions = streets[area];
    for (let k=0; k<rejectedLots[area].length; k++) {
      for(let skip=3*rejectedLots[area][k]; skip>0; skip--)random();
      const rabbit = k<(area===0 ? 18 : 17);
      const {point,width} = positions[Math.floor(random()*positions.length)];
      const angle = random()*Math.PI*2, offset = width/2 + 2.4 + random()*12;
      const x = point[0]+Math.sin(angle)*offset, z = point[1]+Math.cos(angle)*offset;
      const trade = k%3 ? localTrades[area][(k+Math.floor(k/5))%4] : TRADES[(k+3*area)%TRADES.length];
      const phase=random()*Math.PI*2;
      // The dye house rotates its six bolts for each trade and species.
      const bolt=Math.floor(random()*DYES.length), loom=trade+(rabbit?'hare':'frog');
      const dye=nextDye.get(loom) ?? bolt;
      nextDye.set(loom,(dye+5)%DYES.length);
      spots.push({type:rabbit?'rabbit':'frog',role:trade,x,z,phase,area:village.id,
        facing:Math.atan2(point[0]-x,point[1]-z), dye,
        stature:.87+random()*.23, build:.93+random()*.15});
    }
  }
  recipes = spots;
  return recipes;
}
