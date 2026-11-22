// Market traders keep to the road shoulder. Each side of the journey is
// timed from the game clock, so a returning player finds the convoy in place.
import { ROADS, CONNECTING_ROADS } from './terrain.js';
import { cartPosition, measureRoute } from './trade-routes.js';
import { MARKET_HIGHWAYS } from './market-highways.js';
import { CARRIAGES, carriageHorizontalPose } from './traveller-positions.js';

const pi=Math.PI, townStop=7;
const innerRoads=[
  [0,'桜川の渡し','蔵町の市',[0,62],[17,-64]],
  [1,'海風の松原','桜川の渡し',[-149,111],[0,62]],
  [2,'海風の松原','竹隠れの社',[-148,112],[-153,-85]],
  [3,'竹隠れの社','湯けむり峠',[-154,-85],[144,-107]],
  [4,'月見の棚田','湯けむり峠',[156,105],[144,-107]],
];

// Only streets with a market at both ends carry trade. Pilgrims can still
// follow the peach gorge and the shrine approach on the same physical roads.
const marketRoads=[
  ['capital-road',1.98],['temple-road',1.98],
  ['tsuruga-road',1.12],
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
  return {...measureRoute(points),id:road.id,origin,destination,lane,width:road.width,bounds};
}
// Peddlers unload on the two storehouse frontages, leaving the junction
// between them open for the longer turning radius of an ox team.
function marketFrontage(route){
  const start=route.id==='market-todaiji',end=route.id==='spring-market';
  if(!start && !end)return route;
  const distance=start?8:route.length-8,p=cartPosition(route,distance,1);
  const points=route.points.filter((_,i)=>start?route.distances[i]>distance:route.distances[i]<distance);
  if(start)points.unshift([p.x,p.z]);else points.push([p.x,p.z]);
  return {...route,...measureRoute(points)};
}
export const MERCHANT_ROUTES=[
  // The western bridge has a skewed approach and inset timber rails.
  ...innerRoads.map(([road,from,to,first,last])=>itinerary(ROADS[road],from,to,road===2?.85:1.12,first,last)),
  ...marketRoads.map(([id,lane])=>{
    const road=CONNECTING_ROADS.find(r=>r.id===id);
    return itinerary(road,road.origin,road.destination,lane);
  }),
  ...MARKET_HIGHWAYS.map(marketFrontage),
];

// Four Sakai traders now share the extended highway with six new arrivals.
// The longer journeys through the capital and the temple take more walkers
// to keep a traveller in sight than the short link between the two markets.
const highwayCrews = {
  'kyoto-sakai': 10,
  'kyoto-spring': 13,
  'spring-market': 4,
  'market-todaiji': 14,
};

// Local and long-distance travellers share the same shoulder between the
// pass and the market, and again for the last 846m to the temple. They
// interleave at the junction at the same pace. Time spent trading at the
// market absorbs the difference in journey length on each round trip.
const timetables=MERCHANT_ROUTES.map((route,index)=>{
  const count=highwayCrews[route.id] ?? Math.max(2,Math.ceil(route.length/110));
  const speed=.94+(index%4)*.09,travel=route.length/speed;
  const period=2*(travel+townStop),offset=period*((.073+index*.317)%1);
  return {route,count,speed,travel,period,offset,originHold:0,destinationHold:0};
});
function shareShoulder(local,through,localTrips,throughTrips){
  const marketAtOrigin=through.route.origin==='蔵町の市';
  const timetableLength=local.period*localTrips;
  through.speed=local.speed;
  through.travel=through.route.length/local.speed;
  through.period=timetableLength/throughTrips;
  const extra=through.period-2*(through.travel+townStop);
  if(marketAtOrigin)through.originHold=extra;
  else through.destinationHold=extra;
  // The midpoint between two local slots works in both directions since
  // crews spend the same seven seconds turning at their shared terminus.
  const localSlots=localTrips*local.count,throughSlots=throughTrips*through.count;
  let a=localSlots,b=throughSlots;
  while(b)[a,b]=[b,a%b];
  const halfSlot=timetableLength*a/(2*localSlots*throughSlots);
  const meeting=marketAtOrigin?through.travel-local.travel:-local.travel-townStop;
  through.offset=local.offset+meeting+halfSlot;
}
const service=id=>timetables.find(t=>t.route.id===id);
shareShoulder(service('temple-road'),service('market-todaiji'),3,2);
shareShoulder(timetables.find(t=>t.route.origin==='竹隠れの社'),service('spring-market'),1,2);

export const ROAD_MERCHANTS=timetables.flatMap(({route,count,speed,period,offset,originHold,destinationHold},index)=>
  Array.from({length:count},(_,i)=>({
    route,speed,period,originHold,destinationHold,offset:((offset+i*period/count)%period+period)%period,
    costume:2+(index+i)%3,size:.90+.03*((index*3+i)%6),stride:.35+.014*((index+i*3)%5),
  })));

// Leave room for the wheel hubs and the merchant's basket. Where two ox
// teams pass one another, both walkers ease further onto the grassy verge.
const cartClearance=1.88;
export const MAX_MERCHANT_SHOULDER=3.35;
let sampledTime=NaN, carts=[];
function passingLane(p,route,time){
  const lane=route.lane;
  // At either market, turning traders set their loads down in a fixed spot.
  const edge=Math.min(1,p.distance/5,(route.length-p.distance)/5);
  if(edge<=0)return lane;
  if(time!==sampledTime){
    sampledTime=time;
    carts=CARRIAGES.map(c=>carriageHorizontalPose(c,time));
  }
  let shoulder=lane;
  for(const c of carts){
    const dx=c.x-p.x,dz=c.z-p.z;
    if(Math.abs(dx)>16 || Math.abs(dz)>16)continue;
    const t=Math.min(1,Math.max(0,(16-Math.hypot(dx,dz))/10));
    const room=cartClearance+Math.abs(c.passing);
    shoulder=Math.max(shoulder,lane+(room-lane)*t*t*(3-2*t)*edge*edge*(3-2*edge));
  }
  return shoulder;
}

function scheduledMerchantPose(merchant,time) {
  const {route,offset,speed,period,originHold,destinationHold}=merchant;
  const travel=route.length/speed,leg=travel+townStop,clock=time+offset;
  const cycle=((clock%period)+period)%period;
  const stopAtDestination=cycle>=leg && cycle<leg+destinationHold;
  const stopAtOrigin=originHold>0 && cycle>=period-originHold;
  let walkingClock=cycle;
  if(cycle>=leg)walkingClock=stopAtDestination?leg:Math.min(2*leg,cycle-destinationHold);
  const p=cartPosition(route,walkingClock,speed);
  if(stopAtDestination || stopAtOrigin)p.moving=false;
  // At each market the laden traveller pauses, walks a small semicircle
  // into the opposing lane, then pauses again before the return journey.
  let turn=0;
  if(!p.moving && !stopAtDestination && !stopAtOrigin){
    const waiting=walkingClock%leg-travel;
    const u=Math.min(1,Math.max(0,(waiting-1)/(townStop-2)));
    turn=u*u*(3-2*u);
    p.yaw-=pi*(waiting/townStop+turn);
    p.moving=turn>0 && turn<1;
  }
  const laps=Math.floor(clock/period);
  p.travelled+=2*laps*route.length+(2*laps+Math.floor(walkingClock/leg)+turn)*pi*route.lane;
  return p;
}

// A yoke swings across the whole width of the road during a market turn.
// Inspect only the nearby endpoint's seven-second turning window. Once a
// walker has waited for a team, a brisker pace restores their own slot.
const turningTeams=CARRIAGES.flatMap(team=>{
  const travel=team.route.length/team.speed,period=2*(travel+townStop);
  return [[team.route.points[0],period-townStop],[team.route.points.at(-1),travel]].map(([[x,z],start])=>
    ({x,z,period,start:start-team.offset}));
});
const yields=new WeakMap();
function waitForCart(merchant,p,time){
  for(const stop of turningTeams){
    if(Math.abs(p.x-stop.x)>110 || Math.abs(p.z-stop.z)>110)continue;
    const turn=stop.start+Math.round((time-stop.start)/stop.period)*stop.period;
    if(time<turn-27 || time>turn+78)continue;
    let waits=yields.get(merchant);
    if(!waits)yields.set(merchant,waits=new Map());
    let visit=waits.get(stop);
    if(visit?.turn!==turn){
      const near=t=>{
        const q=scheduledMerchantPose(merchant,t);
        return Math.hypot(q.x-stop.x,q.z-stop.z)<6.4;
      };
      let from=turn-1;
      while(from<turn+townStop+1 && !near(from))from+=.5;
      const resume=turn+townStop+1;
      if(from<resume)while(from>turn-26 && near(from))from-=.5;
      visit={turn,from,resume};waits.set(stop,visit);
    }
    const delay=visit.resume-visit.from;
    if(delay<=0 || time<visit.from || time>=visit.resume+2*delay)continue;
    if(time<visit.resume){
      const waiting=scheduledMerchantPose(merchant,visit.from);waiting.moving=false;return waiting;
    }
    return scheduledMerchantPose(merchant,time-delay+(time-visit.resume)*.5);
  }
  return p;
}

export function roadMerchantPose(merchant,time){
  const scheduled=scheduledMerchantPose(merchant,time),p=waitForCart(merchant,scheduled,time);
  const {route}=merchant;
  let shoulder=passingLane(p,route,time);
  // The porter at the storehouse trades on the outside of the through lane.
  if(route.id==='spring-market')shoulder=Math.max(shoulder,route.lane+.56*Math.max(0,1-(route.length-p.distance)/7));
  p.x+=Math.cos(p.yaw)*shoulder;
  p.z-=Math.sin(p.yaw)*shoulder;
  return p;
}
