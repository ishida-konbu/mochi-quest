// Market traders keep to the road shoulder. Each side of the journey is
// timed from the game clock, so a returning player finds the convoy in place.
import { ROADS, CONNECTING_ROADS } from './terrain.js';
import { cartPosition, measureRoute } from './trade-routes.js';

const pi=Math.PI, townStop=7;
const innerRoads=[
  [0,'桜川の渡し','蔵町の市',[0,62],[17,-64]],
  [1,'海風の松原','桜川の渡し',[-149,111],[0,62]],
  [2,'海風の松原','竹隠れの社',[-148,112],[-153,-85]],
  [3,'竹隠れの社','湯けむり峠',[-154,-85],[144,-107]],
  [4,'月見の棚田','湯けむり峠',[156,105],[144,-107]],
];

function stopIndex(road,stop) {
  let nearest=0,least=Infinity;
  for(const [i,[x,z]] of road.points.entries()){
    const distance=(x-stop[0])**2+(z-stop[1])**2;
    if(distance<least){least=distance;nearest=i;}
  }
  return nearest;
}
function itinerary(road,origin,destination,lane,first,last) {
  const points=road.points.slice(first?stopIndex(road,first):0,last?stopIndex(road,last)+1:undefined);
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
  const bounds={west:Math.min(...xs),east:Math.max(...xs),north:Math.min(...zs),south:Math.max(...zs)};
  return {...measureRoute(points),origin,destination,lane,width:road.width,bounds,merchants:road.merchants};
}
export const MERCHANT_ROUTES=[
  // The western bridge has a skewed approach and inset timber rails.
  ...innerRoads.map(([road,from,to,first,last])=>itinerary(ROADS[road],from,to,road===2?.85:1.12,first,last)),
  ...CONNECTING_ROADS.map((road,i)=>itinerary(road,road.origin,road.destination,
    i<2?1.98:i===2?.68:1.12,
    i===5?[142,-802]:null,i===3?[402,-425]:null)),
];

// Same pace on each road keeps neighbours from overtaking in a narrow pass.
// The two halves of each period already contain the outward and return trips.
export const ROAD_MERCHANTS=MERCHANT_ROUTES.flatMap((route,index)=>{
  const count=route.merchants ?? Math.max(2,Math.ceil(route.length/110)),speed=.94+(index%4)*.09;
  const period=2*(route.length/speed+townStop);
  return Array.from({length:count},(_,i)=>({
    route,speed,offset:period*((.073+index*.317+i/count)%1),
    costume:2+(index+i)%3,size:.90+.03*((index*3+i)%6),stride:.35+.014*((index+i*3)%5),
  }));
});

export function roadMerchantPose(merchant,time) {
  const {route,offset,speed}=merchant,travel=route.length/speed,leg=travel+townStop;
  const clock=time+offset,p=cartPosition(route,time,speed,offset);
  // At each market the laden traveller pauses, walks a small semicircle
  // into the opposing lane, then pauses again before the return journey.
  let turn=0;
  if(!p.moving){
    const waiting=clock%leg-travel;
    const u=Math.min(1,Math.max(0,(waiting-1)/(townStop-2)));
    turn=u*u*(3-2*u);
    p.yaw-=pi*(waiting/townStop+turn);
    p.moving=turn>0 && turn<1;
  }
  p.travelled+=(Math.floor(clock/leg)+turn)*pi*route.lane;
  p.x+=Math.cos(p.yaw)*route.lane;
  p.z-=Math.sin(p.yaw)*route.lane;
  return p;
}
