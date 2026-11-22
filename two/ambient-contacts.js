// These travellers are scenery actors. They have bodies but no delivery IDs.
// Each moving footprint is sampled from the same itinerary as its drawing.
import { DISTRICTS } from './geography.js';
import { terrainHeight, roadSurfaceHeight, groundHeight, wrapDelta } from './terrain.js';
import { CARRIAGES, OX_HITCH, HORSE_SCALE, carriagePose, merchantPose, horsePose } from './traveller-positions.js';
import { OX_SCALE } from './scroll-fauna.js';
import { QUAY_MERCHANTS } from './seaport-layout.js';
import { COURT } from './retreat-layout.js';
import { kyoNight, kyoClock } from './kyo-layout.js';
import { watchPose } from './court-patrol.js';
import { STREET_BEATS, streetWatchPose } from './street-watch-layout.js';
import { WEDDING_SITES, WEDDING_ROLES, weddingWalkerPose } from './pilgrimage-layout.js';
import { makeCityWalkers, cityWalkerPose } from './city-walkers.js';

// Each entry is [across, along, half width, half depth, bottom, top] in metres.
const carriage=[
  [0,-.54,1.04,1.27,.91,2.80],[0,-.54,1.22,1.49,2.79,3.05],
  ...[-1,1].flatMap(s=>[[s*1.05,-.54,.11,.92,.05,1.88],[s*.78,1.72,.066,1.45,1,1.17]]),
  [0,OX_HITCH-.16*OX_SCALE,.45*OX_SCALE,.91*OX_SCALE,.43*OX_SCALE,1.57*OX_SCALE],
  [0,OX_HITCH+.83*OX_SCALE,.28*OX_SCALE,.43*OX_SCALE,1.04*OX_SCALE,1.86*OX_SCALE],
  ...[-1,1].flatMap(s=>[-.62,.44].map(z=>[s*.29*OX_SCALE,OX_HITCH+z*OX_SCALE,.1*OX_SCALE,.14*OX_SCALE,0,.55*OX_SCALE])),
];
const boat=[[0,0,.71,1.89,-.13,.57],[0,2.17,.39,.68,.04,.65],[0,-2.17,.39,.68,.04,.65],
  [0,.56,.44,.32,.45,1.97],[0,-.58,.68,.055,1.57,3.16]];
const horse=[[0,-.14,.36,.89,.74,1.78],[0,.77,.24,.39,1.31,2.11],
  ...[-1,1].flatMap(s=>[-.69,.44].map(z=>[s*.24,z,.081,.13,0,.89]))];
const figure=[[0,0,.34,.28,0,1.86]];

function penetration(q,shapes,x,z,feet,height,radius,scale=1) {
  const dx=wrapDelta(x-q.x),dz=wrapDelta(z-q.z);
  if(Math.abs(dx)>7+radius || Math.abs(dz)>7+radius)return 0;
  const yaw=q.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
  const u=(dx*c-dz*s)/scale,v=(dx*s+dz*c)/scale,r=radius/scale;
  let depth=0;
  for(const [cx,cz,w,d,lo,hi] of shapes){
    const a=Math.max(0,Math.abs(u-cx)-w),b=Math.max(0,Math.abs(v-cz)-d);
    if(a*a+b*b>r*r)continue;
    const base=(q.y??(q.floor||terrainHeight)(q.x,q.z))+(q.grade||0)*v*scale;
    if(feet>=base+hi*scale || feet+height<=base+lo*scale)continue;
    const inside=Math.min(w-Math.abs(u-cx),d-Math.abs(v-cz));
    const gap=inside>=0 ? -inside : Math.hypot(a,b);
    depth=Math.max(depth,radius-gap*scale);
  }
  return depth;
}

export function createAmbientContacts(){
  let sampledTravel, sampledCity, cityOffset, vehicles=[], citizens=[], walkers;
  const courtBase=terrainHeight(COURT.x,COURT.z);
  return (x,z,feet,height,radius,time,player,measureDepth=false)=>{
    let depth=0;
    function check(q,shapes,size){
      depth=Math.max(depth,penetration(q,shapes,x,z,feet,height,radius,size));
      return !measureDepth && depth>0;
    }
    if(time!==sampledTravel){
      sampledTravel=time;
      vehicles=CARRIAGES.map(journey=>[carriagePose(journey,time),carriage,1]);
      vehicles.push([horsePose(time),horse,HORSE_SCALE]);
      for(let i=0;i<3;i++)vehicles.push([merchantPose(i,time),boat,1]);
    }
    for(const [q,shapes,scale] of vehicles)if(check(q,shapes,scale))return true;
    for(const q of QUAY_MERCHANTS)if(check(q,figure,q.size))return true;
    const inCity=Math.abs(wrapDelta(x-DISTRICTS.kyo.x))<200 && Math.abs(wrapDelta(z-DISTRICTS.kyo.z))<185;
    if(inCity){
      if(time!==sampledCity || cityOffset!==player.kyoClockOffset){
        sampledCity=time;cityOffset=player.kyoClockOffset;citizens.length=0;
        walkers??=makeCityWalkers();
        const night=kyoNight(time,player),clock=kyoClock(time,player);
        for(const w of walkers)if(night<=w.curfew){
          const q=cityWalkerPose(w,time,player,{});
          q.floor=roadSurfaceHeight;
          citizens.push([q,w.scale]);
        }
        for(const beat of STREET_BEATS)citizens.push([streetWatchPose(clock,beat,{}),1.06]);
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
