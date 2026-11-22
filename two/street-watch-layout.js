import { DISTRICTS } from './geography.js';
import { KYO_DAY_SECONDS } from './kyo-layout.js';

const pi=Math.PI;
const ease=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);};
const phase=t=>((t%KYO_DAY_SECONDS)+KYO_DAY_SECONDS)%KYO_DAY_SECONDS;
const turn=(a,b,f)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*f;
const city=DISTRICTS.kyo;

// The coordinates follow the kerbs, just outside the paving. Each man serves
// two nearby hearths. The torch in his right hand comes down over the basket.
const quarters=[
  ['朱雀の辻',[4.90,-5,pi/2],[-18,4.50,0],[[3.81,3.45]],-3],
  ['羅生門前',[4.88,73,pi/2],[4.90,45,pi/2],[],3],
  ['北大路',[-4.85,-69,-pi/2],[-4.85,-38,-pi/2],[],4],
  ['西の市',[-85,4.60,0],[-51,4.60,0],[],-3],
  ['東の市',[74,-4.57,pi],[42,-4.57,pi],[[74.35,-2.28],[42.35,-2.28]],2],
  ['西南の辻',[-79.20,48,-pi/2],[-79.20,72,-pi/2],[],3],
  ['東南の辻',[76.20,49,pi/2],[76.20,28,pi/2],[],-3],
  ['北東の辻',[31,-64.12,pi],[61,-64.12,pi],[],4],
  ['北西の辻',[-94,-83.12,pi],[-61,-83.12,pi],[],3],
];

function makeBeat([name,first,second,corners,offset],index){
  const hearths=[first,second].map(([x,z,yaw])=>({x:city.x+x,z:city.z+z,yaw}));
  const stands=hearths.map(({x,z,yaw})=>({
    x:x-.35*Math.cos(yaw)-.83*Math.sin(yaw),z:z+.35*Math.sin(yaw)-.83*Math.cos(yaw),yaw,
  }));
  const home={x:stands[0].x+offset*Math.cos(first[2]),z:stands[0].z-offset*Math.sin(first[2]),
    yaw:first[2]+pi};
  const path=[stands[0],...corners.map(([x,z])=>({x:city.x+x,z:city.z+z})),stands[1]];
  const speed=1.22+.08*(index%3),depart=KYO_DAY_SECONDS/4+8+(index*3%11);
  const dawn=KYO_DAY_SECONDS*3/4+3+(index%4);
  const stops=[],ignition=[];let time=0,last=home;
  function wait(at,duration,yaw=at.yaw,reach=0){
    time+=duration;stops.push({time,x:at.x,z:at.z,yaw,reach});last=at;
  }
  function walk(to){
    const yaw=Math.atan2(to.x-last.x,to.z-last.z);
    // Turn in place while the leading foot settles, then cover the actual
    // distance. This keeps even the diagonal at the central crossing natural.
    wait(last,.66,yaw);
    wait(to,Math.hypot(to.x-last.x,to.z-last.z)/speed,yaw);
  }
  function kindle(at){
    wait(at,.72,at.yaw);wait(at,1.00,at.yaw,1);
    ignition.push(time);wait(at,1.12,at.yaw,1);wait(at,1.06,at.yaw);
  }
  wait(home,0);wait(home,depart);walk(stands[0]);kindle(stands[0]);
  for(const point of path.slice(1))walk(point);
  kindle(stands[1]);
  // Hear the watch at the far crossing, then retrace the beat. The first
  // and last pass carry living fire, even if the player arrives mid-round.
  wait(stands[1],4.4+index%4,stands[1].yaw+pi);
  for(const point of path.slice(0,-1).reverse())walk(point);
  walk(home);wait(home,1.6,home.yaw);
  const leg=Math.hypot(home.x-stands[0].x,home.z-stands[0].z)/speed;
  // During the last watch he revisits the nearest hearth to stir the coals.
  wait(home,Math.max(0,dawn-13-time-leg*2),home.yaw);
  walk(stands[0]);wait(stands[0],1.3,stands[0].yaw,1);wait(stands[0],1.8,stands[0].yaw,1);
  wait(stands[0],1,stands[0].yaw);walk(home);wait(home,1.2,home.yaw);
  wait(home,KYO_DAY_SECONDS-time,home.yaw);
  return {name,home,hearths,stops,ignition,depart,dawn};
}
export const STREET_BEATS=quarters.map(makeBeat);

export function streetWatchPose(elapsed,beat,out={}){
  const t=phase(elapsed),knots=beat.stops;
  let end=1;while(end<knots.length-1 && t>=knots[end].time)end++;
  const a=knots[end-1],b=knots[end],f=(t-a.time)/(b.time-a.time);
  const dx=b.x-a.x,dz=b.z-a.z;
  out.x=a.x+dx*f;out.z=a.z+dz*f;
  out.yaw=turn(a.yaw,b.yaw,ease(f));
  out.reach=a.reach+(b.reach-a.reach)*ease(f);
  out.walk=Math.min(1,Math.hypot(dx,dz)/(b.time-a.time))*Math.min(1,f/.09,(1-f)/.09);
  out.taper=ease((t-beat.depart+.8)/1.25)*ease((beat.dawn+1-t)/4);
  const embers=ease((beat.dawn+2-t)/10);
  out.first=ease((t-beat.ignition[0])/1.5)*embers;
  out.second=ease((t-beat.ignition[1])/1.5)*embers;
  return out;
}
