// These travellers are scenery actors. They have bodies but no delivery IDs.
// Each moving footprint is sampled from the same itinerary as its drawing.
import { DISTRICTS } from './geography.js';
import { terrainHeight, roadSurfaceHeight, groundHeight, wrapDelta } from './terrain.js';
import { CARRIAGES, OX_HITCH, HORSE_SCALE, carriageHorizontalPose, carriagePose, horsePose } from './traveller-positions.js';
import { skiffContact } from './skiff-travel.js';
import { OX_SCALE } from './scroll-fauna.js';
import { MAX_MERCHANT_SHOULDER, MERCHANT_ROUTES, ROAD_MERCHANTS, roadMerchantPose } from './road-merchant-routes.js';
import { QUAY_MERCHANTS } from './seaport-layout.js';
import { COURT } from './retreat-layout.js';
import { kyoNight, watchClock } from './kyo-layout.js';
import { watchPose } from './court-patrol.js';
import { STREET_BEATS, streetWatchPose } from './street-watch-layout.js';
import { WEDDING_SITES, WEDDING_ROLES, weddingWalkerPose } from './pilgrimage-layout.js';
import { makeCityWalkers, cityWalkerPose } from './city-walkers.js';
import { KIYOMIZU } from './kiyomizu-layout.js';
import { TEMPLE_MONKS, templeMonkPose } from './temple-duties.js';

// Each entry is [across, along, half width, half depth, bottom, top] in metres.
const carriage=[
  [0,-.54,1.04,1.27,.91,2.80],[0,-.54,1.22,1.49,2.79,3.05],
  ...[-1,1].flatMap(s=>[[s*1.05,-.54,.11,.92,.05,1.88],[s*.78,1.72,.066,1.45,1,1.17]]),
  [0,OX_HITCH-.16*OX_SCALE,.45*OX_SCALE,.91*OX_SCALE,.43*OX_SCALE,1.57*OX_SCALE],
  [0,OX_HITCH+.83*OX_SCALE,.28*OX_SCALE,.43*OX_SCALE,1.04*OX_SCALE,1.86*OX_SCALE],
  ...[-1,1].flatMap(s=>[-.62,.44].map(z=>[s*.29*OX_SCALE,OX_HITCH+z*OX_SCALE,.1*OX_SCALE,.14*OX_SCALE,0,.55*OX_SCALE])),
];
const horse=[[0,-.14,.36,.89,.74,1.78],[0,.77,.24,.39,1.31,2.11],
  ...[-1,1].flatMap(s=>[-.69,.44].map(z=>[s*.24,z,.081,.13,0,.89]))];
const figure=[[0,0,.34,.28,0,1.86]];
const riceBody=[[0,0,.27,.23,0,.59],[0,0,.44,.33,.39,1.07],[0,-.01,.475,.34,1.04,1.55]];
const traderBody=[...riceBody,...[-1,1].map(s=>[s*.48,.17,.115,.15,.60,.91])];
const traderShapes=[
  [...traderBody,[0,-.01,.48,.39,1.53,1.69],[.24,.47,.27,.25,.565,.821]], // hat and market basket
  [...traderBody,[0,-.02,.34,.27,1.50,1.62],[.05,-.51,.266,.177,.52,1.16]], // hood and knotted bundle
  [...traderBody,[0,-.095,.27,.21,1.50,1.78],[0,-.442,.215,.124,.602,1.09],[0,-.49,.11,.043,1.08,1.27]], // cap, medicine drawers and herbs
];

function penetration(q,shapes,x,z,feet,height,radius,scale=1) {
  const dx=wrapDelta(x-q.x),dz=wrapDelta(z-q.z);
  if(Math.abs(dx)>7+radius || Math.abs(dz)>7+radius)return 0;
  const yaw=q.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
  const u=(dx*c-dz*s)/scale,v=(dx*s+dz*c)/scale,r=radius/scale;
  let depth=0;
  for(const [cx,cz,w,d,lo,hi] of shapes){
    const a=Math.max(0,Math.abs(u-cx)-w),b=Math.max(0,Math.abs(v-cz)-d);
    if(a*a+b*b>r*r)continue;
    const base=(q.y??(q.floor||terrainHeight)(q.x,q.z))+((q.grade||0)*v+(q.bank||0)*u)*scale;
    if(feet>=base+hi*scale || feet+height<=base+lo*scale)continue;
    const inside=Math.min(w-Math.abs(u-cx),d-Math.abs(v-cz));
    const gap=inside>=0 ? -inside : Math.hypot(a,b);
    depth=Math.max(depth,radius-gap*scale);
  }
  return depth;
}

export function createAmbientContacts(){
  let sampledTravel, sampledCity, sampledWatch, vehicles=[], citizens=[], walkers;
  const courtBase=terrainHeight(COURT.x,COURT.z);
  const monkPose={};
  const tradingRoads=MERCHANT_ROUTES.map(route=>({
    route,traders:ROAD_MERCHANTS.filter(t=>t.route===route),lastTime:NaN,poses:[],
  }));
  return (x,z,feet,height,radius,time,player,measureDepth=false,ignoreSkiff=null)=>{
    let depth=skiffContact(x,z,feet,height,radius,time,ignoreSkiff);
    if(depth && !measureDepth)return true;
    function check(q,shapes,size){
      depth=Math.max(depth,penetration(q,shapes,x,z,feet,height,radius,size));
      return !measureDepth && depth>0;
    }
    if(time!==sampledTravel){
      sampledTravel=time;
      vehicles=CARRIAGES.map(journey=>[carriageHorizontalPose(journey,time),carriage,1,journey]);
      vehicles.push([horsePose(time),horse,HORSE_SCALE]);
    }
    for(const [q,shapes,scale,journey] of vehicles){
      if(Math.abs(wrapDelta(x-q.x))>7+radius || Math.abs(wrapDelta(z-q.z))>7+radius)continue;
      if(journey && q.y===undefined)carriagePose(journey,time,q);
      if(check(q,shapes,scale))return true;
    }
    // Outside a road's bounds even its outermost load is out of reach.
    // Reuse its poses across all the mount, body and sweep probes in a step.
    const wx=wrapDelta(x),wz=wrapDelta(z);
    for(const road of tradingRoads){
      const {west,east,north,south}=road.route.bounds,pad=MAX_MERCHANT_SHOULDER+radius+1;
      if(wx<west-pad||wx>east+pad||wz<north-pad||wz>south+pad)continue;
      if(time!==road.lastTime){
        road.lastTime=time;
        for(const [i,m] of road.traders.entries()){
          const q=roadMerchantPose(m,time);
          q.floor=groundHeight; // includes the bridge deck and Rashomon's stone steps
          road.poses[i]=q;
        }
      }
      for(const [i,m] of road.traders.entries()){
        if(check(road.poses[i],traderShapes[m.costume-2],m.size))return true;
      }
    }
    for(const q of QUAY_MERCHANTS)if(check(q,figure,q.size))return true;
    if(Math.abs(wx-KIYOMIZU.x)<18+radius && Math.abs(wz-KIYOMIZU.z)<31+radius){
      for(const monk of TEMPLE_MONKS){
        if(check(templeMonkPose(monk,time,monkPose),riceBody,monk.size))return true;
      }
    }
    const inCity=Math.abs(wrapDelta(x-DISTRICTS.kyo.x))<200 && Math.abs(wrapDelta(z-DISTRICTS.kyo.z))<185;
    if(inCity){
      const clock=watchClock(time,player);
      if(time!==sampledCity || clock!==sampledWatch){
        sampledCity=time;sampledWatch=clock;citizens.length=0;
        walkers??=makeCityWalkers();
        const night=kyoNight(time,player);
        for(const w of walkers)if(night<=w.curfew){
          const q=cityWalkerPose(w,time,player,{});
          q.floor=roadSurfaceHeight;
          citizens.push([q,w.scale]);
        }
        for(const beat of STREET_BEATS){
          const q=streetWatchPose(clock,beat,{});
          q.floor=roadSurfaceHeight;
          citizens.push([q,1.06]);
        }
        for(let i=0;i<2;i++){
          const q=watchPose(clock,i);
          q.x+=COURT.x;q.z+=COURT.z;
          q.y=groundHeight(q.x,q.z,courtBase+1.09);
          citizens.push([q,1.06]);
        }
      }
      for(const [q,size] of citizens)if(check(q,figure,size))return true;
    }
    for(const [i,site] of WEDDING_SITES.entries()){
      if(Math.abs(wrapDelta(x-site.x))>site.rx+3 || Math.abs(wrapDelta(z-site.z))>site.rz+3)continue;
      for(let j=0;j<WEDDING_ROLES.length;j++){
        if(check(weddingWalkerPose(i,j,time),figure,1.075))return true;
      }
    }
    return measureDepth?depth:false;
  };
}
