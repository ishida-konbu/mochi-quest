import { districtPoint } from './geography.js';
import { CONNECTING_ROADS, WATER_Y, roadSurfaceHeight, riverZ, coastX, eastCoastX } from './terrain.js';
import { measureRoute, cartPosition } from './trade-routes.js';

const {sin,cos}=Math;
export const OX_HITCH=3.78, HORSE_SCALE=1.23;
export const CARRIAGES=CONNECTING_ROADS.slice(0,2).map((road,i)=>({
  route:measureRoute(road.points),speed:i===0?1.85:1.63,offset:i===0?85:30,
}));

export function carriagePose(journey,time){
  const q=cartPosition(journey.route,time,journey.speed,journey.offset);
  q.y=roadSurfaceHeight(q.x,q.z);
  const fore=roadSurfaceHeight(q.x+3*sin(q.yaw),q.z+3*cos(q.yaw));
  q.grade=(fore-q.y)/3;
  return q;
}

// A straight, paved stretch between the two gate crossings; the horse turns
// in place at each end while the central lane remains clear for the ox cart.
const horseRoute=measureRoute([[122.3,-352],[122.3,-367],[122.3,-382]].map(([x,z])=>districtPoint('kyo',x,z)));
export const horsePose=time=>cartPosition(horseRoute,time,.96,14);

export function merchantPosition(index,time) {
  const a=time*(index===2?.040:.021)+[0,1.75,2.4][index];
  if(index===2) {
    const x=69+38*sin(a);
    return {x,z:riverZ(x)+3.8*cos(a)};
  }
  const z=(index===0?159:210)+(index===0?83:117)*sin(a);
  const coast=index===0?coastX(z):eastCoastX(z);
  return {x:coast+(index===0?-1:1)*(23+12*cos(a)),z};
}
export function merchantPose(index,time){
  const a=merchantPosition(index,time), b=merchantPosition(index,time+.08);
  return {...a,y:WATER_Y+.045+.061*sin(time*1.34+index),yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
