// Each village draws its own band of travellers from the ten occupations.
// Feet stay off the graded road, so the original encounters and stamp routes stay open.
import { ORIGINAL_REGIONS as REGIONS, ROADS, villageSurveyHeight, waterDepth, nearRoad, solidHeightAt, seeded } from './terrain.js';
import { POUNDING } from './festival.js';

export const TRADES = ['flute','fan','lantern','scribe','tea','rake','fisher','drum','flowers','broom'];
export const DYES = ['#809897','#b47e66','#929a70','#a08a9d','#beaa78','#8296ac'];
const localTrades = [
  ['fisher','lantern','tea','flute'], ['scribe','broom','flowers','fan'],
  ['tea','drum','lantern','scribe'], ['broom','tea','flowers','flute'],
  ['rake','flowers','fan','drum'], ['fisher','rake','flute','lantern'],
  ['broom','scribe','lantern','tea'], ['fan','flowers','rake','flute'],
  ['flute','drum','lantern','fan'], ['fisher','drum','tea','flowers']
];
let recipes;
export function procession(objects, villagers) {
  if (recipes) return recipes;
  const random = seeded(0xd8479);
  // The original casting draw consumed a variable number of samples around
  // these fixtures. Keep its exclusion discs when recreating the cast from a
  // journey. The village route planner checks each home against today's props.
  const fixed = [...objects,...villagers,...REGIONS].map(p=>{
    if(p.id==='haramaki-46')return {x:308,z:189};
    if(p.id==='port-47')return {x:314,z:180};
    if(p.atMortar)return {x:p.x+(307-POUNDING.x),z:p.z+(169.8-POUNDING.z)};
    return p;
  });
  const streets = REGIONS.map(r => ROADS.flatMap(road =>
    road.points.filter((point,i) => i%2===0 && (point[0]-r.x)**2+(point[1]-r.z)**2 < 90**2)
      .map(point => ({ point, width:road.width }))));
  const spots = [], nextDye = new Map();
  for (let area=0; area<REGIONS.length; area++) {
    const village = REGIONS[area], positions = streets[area];
    for (let k=0; k<(area<6 ? 40 : 39); k++) {
      const rabbit = k<(area===0 ? 18 : 17);
      for (let attempt=0; attempt<3000; attempt++) {
        const {point,width} = positions[Math.floor(random()*positions.length)];
        const angle = random()*Math.PI*2, offset = width/2 + 2.4 + random()*12;
        const x = point[0]+Math.sin(angle)*offset, z = point[1]+Math.cos(angle)*offset;
        const y = villageSurveyHeight(x,z);
        if (waterDepth(x,z)>.06 || nearRoad(x,z,1.9) || solidHeightAt(x,z,1.15)>y+.2 ||
            Math.abs(y-villageSurveyHeight(x+1,z+1))>.5 || Math.abs(y-villageSurveyHeight(x-1,z-1))>.5 ||
            fixed.some(p=>(p.x-x)**2+(p.z-z)**2 < 5.6**2) ||
            spots.some(p=>(p.x-x)**2+(p.z-z)**2 < 3.7**2)) continue;
        const trade = k%3 ? localTrades[area][(k+Math.floor(k/5))%4] : TRADES[(k+3*area)%TRADES.length];
        const phase=random()*Math.PI*2;
        // The dye house rotates its six bolts for each trade and species.
        const bolt=Math.floor(random()*DYES.length), loom=trade+(rabbit?'hare':'frog');
        const dye=nextDye.get(loom) ?? bolt;
        nextDye.set(loom,(dye+5)%DYES.length);
        spots.push({type:rabbit?'rabbit':'frog',role:trade,x,z,phase,area:village.id,
          facing:Math.atan2(point[0]-x,point[1]-z), dye,
          stature:.87+random()*.23, build:.93+random()*.15});
        break;
      }
    }
  }
  recipes = spots;
  return recipes;
}
