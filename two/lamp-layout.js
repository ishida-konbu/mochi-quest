// Local metres on the finished floors. The tower lights stand on the side
// galleries, clear of the stairwell even on the smallest, fifth storey.
import { roomPlan, pagodaPlan } from './architecture.js';
import { wardFloorPlan, inCapitalWard } from './kyo-layout.js';

export function houseCandles(b) {
  if(b.kind==='pagoda') return pagodaPlan(b).storeys.flatMap(({w,d,y})=>
    [-1,1].map(side=>({u:side*w*.287,v:side*d*.235,y,scale:1.10})));
  const {width,depth,floor}=roomPlan(b);
  if(b.kind==='wardShop'){
    const lamps=[{u:width*.36,v:-depth*.15,y:floor,scale:.80}];
    if(b.wall>5) lamps.push({u:width*.35,v:depth*.26,y:wardFloorPlan(b).loft,scale:.81});
    return lamps;
  }
  return [{u:-width*.36,v:depth*.23,y:floor,scale:b.kind==='temple'?1.20:.90}];
}

export const COURT_CANDLES=[
  [-4.36,-5.35,1.38,1.70],[4.36,-5.35,1.38,1.70],
  [-8.35,3.40,1.05,1.60],[8.35,3.40,1.05,1.60],
  [-16.82,1.20,1.05,1.33],[16.82,1.20,1.05,1.33],
];

export function houseFrontLamps(b){
  if(!inCapitalWard(b.x,b.z))return [];
  if(b.kind==='temple'||b.kind==='pagoda')return [-1,1].map(side=>({
    stone:true,u:side*(b.w*.47+.15),v:b.d*.5+1.29,scale:.79,
  }));
  if(b.kind==='wardShop')return [{u:b.w*.46,v:b.d*.5+.34,plinth:.42,scale:.89}];
  return [{u:b.w*.422,v:b.d*.5+1.09,scale:1.05}];
}
