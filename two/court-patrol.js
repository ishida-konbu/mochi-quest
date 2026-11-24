// Local metres and seconds on the same noon-to-noon clock as the capital.
// Rebuilding a saved night midway through the rounds reproduces every ember.
import { COURT_BRAZIERS, COURT_GATE_Z } from './retreat-layout.js';
import { WORLD_DAY_SECONDS } from './world-clock.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const fade=x=>{const t=clamp(x);return t*t*(3-2*t);};
function itinerary(i){
  const side=i?1:-1, gate=COURT_GATE_Z, delay=i*2.35, first=COURT_BRAZIERS[i*2],second=COURT_BRAZIERS[i*2+1];
  const home=[side*5.88,gate+2.30,0,0];
  const reach=([x,z])=>[x+.35,z+.78,Math.PI,1];
  const aim=([x,z])=>[x+.35,z+.78,Math.PI,0];
  const depart=WORLD_DAY_SECONDS*.22+delay;
  const leaveHall=WORLD_DAY_SECONDS*3/4-5+delay;
  const knots=[
    [0,home],[depart,home],[depart+2.6,[side*2.75,gate+1,Math.PI]],
    [depart+4.4,[side*2.75,gate-2.61,Math.PI]],[depart+8.3,aim(first)],
    [depart+10.4,reach(first)],[depart+11.9,reach(first)],[depart+13.3,aim(first)],
    [depart+15.1,[side*6.45,first[1]+.64,Math.PI]],[depart+20.5,aim(second)],
    [depart+22.6,reach(second)],[depart+24.1,reach(second)],[depart+25.5,aim(second)],
    [depart+29.6,[side*3.66,13.65,Math.PI]],[depart+34.7,[side*3.68,6.9,Math.PI]],
  ];
  // Walk the clerks' aisle at the usual pace. Additional time in the longer
  // night buys extra rounds and a short watch at the clerk's desk each lap.
  const enterHall=depart+34.7, lapWalk=31.6;
  const laps=Math.max(1,Math.floor((leaveHall-enterHall)/lapWalk));
  const lap=(leaveHall-enterHall)/laps, stand=lap-lapWalk;
  for(let j=0;j<laps;j++){
    const start=enterHall+j*lap;
    knots.push([start+7.7,[side*10.5,4.9,side*Math.PI*.5]],
      [start+13.8,[side*13.65,-2.7,Math.PI]],
      [start+16.4+stand,[side*13.65,-2.7,side*Math.PI*.5]],
      [start+24.4+stand,[side*10.7,4.7,0]],[start+lap,[side*3.68,6.8,0]]);
  }
  const homeAt=leaveHall+22.1;
  knots.push([leaveHall+6.2,[side*3.66,15.2,0]],
    [leaveHall+19.1,[side*2.75,gate+1,0]],[homeAt,home],[WORLD_DAY_SECONDS,home]);
  return {knots,depart,homeAt,lights:[depart+10.25,depart+22.45]};
}
const rounds=[itinerary(0),itinerary(1)];
export function watchPose(time,index,out={}){
  const t=((time%WORLD_DAY_SECONDS)+WORLD_DAY_SECONDS)%WORLD_DAY_SECONDS;
  const {knots,depart,homeAt,lights}=rounds[index];
  let startIndex=1,end=knots.length-1;
  while(startIndex<end){
    const middle=Math.floor((startIndex+end)/2);
    if(t>=knots[middle][0])startIndex=middle+1;
    else end=middle;
  }
  const [start,a]=knots[end-1],[finish,b]=knots[end],f=clamp((t-start)/(finish-start));
  const dx=b[0]-a[0],dz=b[1]-a[1],distance=Math.hypot(dx,dz);
  out.x=a[0]+dx*f;out.z=a[1]+dz*f;
  // Enter a station with both shoulders squared to the basket. Walk each
  // straight stretch facing along the route, allowing a beat for the turn.
  const turn=(u,v,k)=>u+Math.atan2(Math.sin(v-u),Math.cos(v-u))*k;
  const facing=distance>.01?Math.atan2(dx,dz):a[2];
  const enter=turn(a[2],facing,fade(f/.13));
  out.yaw=turn(enter,b[2],fade((f-.79)/.21));
  out.reach=(a[3]||0)+((b[3]||0)-(a[3]||0))*fade(f);
  out.walk=distance>.01?Math.min(1,distance/(finish-start))*Math.min(f/.12,1,(1-f)/.12):0;
  out.taper=fade((t-depart+2)/2.1)*fade((homeAt+1.6-t)/3);
  const embers=fade((homeAt-t)/12);
  out.front=fade((t-lights[0])/.85)*embers;
  out.inner=fade((t-lights[1])/.85)*embers;
  return out;
}
