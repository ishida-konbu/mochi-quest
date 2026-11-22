import { districtPoint } from './geography.js';
import { BRIDGES, CONNECTING_ROADS, WATER_Y, bridgeAt, bridgeHeight, roadSurfaceHeight, riverZ, coastX, eastCoastX } from './terrain.js';
import { waterWave } from './shoreline.js';
import { measureRoute, cartPosition } from './trade-routes.js';
import { MARKET_HIGHWAYS, THROUGH_MARKET_HIGHWAY } from './market-highways.js';
import { RASHOMON, gateStoneRise } from './kyo-layout.js';

const {sin,cos}=Math;
export const OX_HITCH=3.78, HORSE_SCALE=1.23;
const legacyRoad=id=>measureRoute(CONNECTING_ROADS.find(road=>road.id===id).points);
const templeTeam={id:'susuki-todaiji',route:legacyRoad('temple-road'),speed:1.63,offset:30};
function carriageStops(route,endStop=7.5){
  // The driver turns before the walkers' market stall. The yoke sweeps more
  // than five metres from the axle during the turn.
  const stop=7.5,first=cartPosition(route,stop,1),last=cartPosition(route,route.length-endStop,1);
  const inside=route.points.filter((_,i)=>route.distances[i]>stop && route.distances[i]<route.length-endStop);
  return {...route,...measureRoute([[first.x,first.z],...inside,[last.x,last.z]])};
}
// Sakai's turn is in the open quay, beyond the projecting warehouse corner.
const sakaiRoad=carriageStops(MARKET_HIGHWAYS.find(route=>route.id==='kyoto-sakai'),3);
const southernRoad=carriageStops(THROUGH_MARKET_HIGHWAY);
// In two complete market circuits the local ox team runs five. This keeps
// their passing places on the open southern road, away from the town turns.
const southernLeg=2.5*(templeTeam.route.length/templeTeam.speed+7);
const southernTeam={id:'kyoto-todaiji',route:southernRoad,
  speed:southernRoad.length/(southernLeg-7),offset:southernLeg*1.364,load:'silk'};
export const CARRIAGES=[
  {id:'snow-kyoto',route:legacyRoad('capital-road'),speed:1.85,offset:85},templeTeam,
  {id:'kyoto-sakai',route:sakaiRoad,speed:1.72,offset:sakaiRoad.length*.30/1.72,load:'sakai'},southernTeam,
];

export function carriageGroundHeight(x,z){
  const bridge=bridgeAt(x,z);
  if(bridge)return bridgeHeight(bridge,z);
  const paving=gateStoneRise(x-RASHOMON.x,z-RASHOMON.z)>0?0:.08;
  return roadSurfaceHeight(x,z)+paving;
}

export function carriageHorizontalPose(journey,time){
  const q=cartPosition(journey.route,time,journey.speed,journey.offset);
  // A long yoke follows the bend under the whole vehicle. Using only its
  // current polyline edge made the ox jump sideways at a surveyed knot.
  const before=cartPosition(journey.route,Math.max(0,q.distance-2.2),1);
  const after=cartPosition(journey.route,Math.min(journey.route.length,q.distance+2.2),1);
  const bearing=Math.atan2(after.x-before.x,after.z-before.z);
  q.yaw+=Math.atan2(sin(bearing-q.bearing),cos(bearing-q.bearing));q.bearing=bearing;
  // The two temple teams travel the same southern road. Approach the verge
  // gradually and keep a consistent side even when one team is overtaking.
  const local=journey.id===templeTeam.id;
  q.passing=0;
  if(local || journey.id===southernTeam.id){
    const partner=local?southernTeam:templeTeam;
    const other=cartPosition(partner.route,time,partner.speed,partner.offset);
    const gap=Math.hypot(other.x-q.x,other.z-q.z),u=Math.min(1,Math.max(0,(25-gap)/15));
    const side=(local?1:-1)*1.39*u*u*(3-2*u);
    q.passing=side;
    q.x+=side*cos(q.bearing); q.z-=side*sin(q.bearing);
  }
  return q;
}
export function carriagePose(journey,time,q=carriageHorizontalPose(journey,time)){
  // A wheel may already be on the bridge while the ox has reached the bank.
  // Fit the loaded frame to both wheel rims and the ox. The second fit uses
  // the actual foreshortening of those three supports on an inclined plane.
  const dx=sin(q.yaw),dz=cos(q.yaw);
  const floor=(u,v)=>carriageGroundHeight(q.x+u*dz+v*dx,q.z-u*dx+v*dz);
  let grade=0,bank=0;
  for(let fit=0;fit<2;fit++){
    const cg=1/Math.hypot(1,grade),sg=grade*cg;
    const cb=1/Math.hypot(1,bank*cg),sb=bank*cg*cb;
    // The rim is 1.05056m in radius, on an axle 1.035m above the frame datum.
    const rim=-.01556,midU=-sb*rim,midV=-.63*cg-sg*cb*rim;
    const halfU=1.055*cb,halfV=-1.055*sg*sb,foreV=OX_HITCH*cg;
    const lift=-rim*Math.hypot(1,grade,bank);
    const left=floor(midU-halfU,midV-halfV)+lift,right=floor(midU+halfU,midV+halfV)+lift;
    const axle=(left+right)*.5,across=(right-left)*.5,fore=floor(0,foreV);
    grade=(fore-axle+across*midU/halfU)/(foreV-midV+halfV*midU/halfU);
    bank=(across-grade*halfV)/halfU;
    q.y=fore-grade*foreV;
  }
  q.grade=grade;q.bank=bank;
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
