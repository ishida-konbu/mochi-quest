import { districtPoint } from './geography.js';
import { BRIDGES, CONNECTING_ROADS, WATER_Y, roadSurfaceHeight, riverZ, coastX, eastCoastX } from './terrain.js';
import { waterWave } from './shoreline.js';
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

const westRoadstead=-251, eastRoadstead=397, turnRadius=6, reach=eastRoadstead-westRoadstead;
const bend=Math.PI*turnRadius, circuit=2*(reach+bend), skiffSpeed=2.65;
export const RIVER_TRADE_PERIOD=circuit/skiffSpeed;
export const RIVER_SKIFFS=[{name:'桜川の米舟',color:'#9d6850',offset:272},
  {name:'桜川の反物舟',color:'#526f77',offset:272+circuit/3},
  {name:'桜川の茶舟',color:'#788261',offset:272+2*circuit/3}];
export const SKIFF_SCALE=.84;
function ramp(a,b,x) {
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
}
function sailingLane(x,side){
  let centre=riverZ(x);
  for(const b of BRIDGES){
    if(!b.maple)centre+=(b.z-centre)*(1-ramp(0,22,Math.abs(x-b.x)));
  }
  centre+=(riverZ(westRoadstead)-centre)*(1-ramp(0,12,x-westRoadstead));
  centre+=(riverZ(eastRoadstead)-centre)*(1-ramp(0,12,eastRoadstead-x));
  const offshore=Math.max(ramp(196,249,-x),ramp(343,395,x));
  // Leave the tied ferry at the Sakura landing on the inside of the bend.
  const berth=side>0?-5.5*Math.exp(-(((x+12.5)/8)**2)):0;
  return centre+side*(3.45+(turnRadius-3.45)*offshore)+berth;
}
function riverPosition(skiff,time){
  const d=((time*skiffSpeed+skiff.offset)%circuit+circuit)%circuit;
  if(d<reach){const x=westRoadstead+d;return {x,z:sailingLane(x,1)};}
  if(d<reach+bend){
    const angle=(d-reach)/turnRadius;
    return {x:eastRoadstead+turnRadius*sin(angle),z:riverZ(eastRoadstead)+turnRadius*cos(angle)};
  }
  if(d<2*reach+bend){const x=eastRoadstead-(d-reach-bend);return {x,z:sailingLane(x,-1)};}
  const angle=(d-2*reach-bend)/turnRadius;
  return {x:westRoadstead-turnRadius*sin(angle),z:riverZ(westRoadstead)-turnRadius*cos(angle)};
}
export function merchantPosition(index,time) {
  if(index>=2)return riverPosition(RIVER_SKIFFS[index-2],time);
  const a=time*.021+index*1.75;
  const z=(index===0?159:210)+(index===0?83:117)*sin(a);
  const coast=index===0?coastX(z):eastCoastX(z);
  return {x:coast+(index===0?-1:1)*(23+12*cos(a)),z};
}
export function merchantPose(index,time){
  const a=merchantPosition(index,time), b=merchantPosition(index,time+.08);
  const y=index>=2 ? WATER_Y+waterWave(a.x,a.z,time) : WATER_Y+.045+.061*sin(time*1.34+index);
  return {...a,y,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
