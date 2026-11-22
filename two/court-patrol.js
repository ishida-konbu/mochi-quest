// Local metres and seconds on the same noon-to-noon clock as the capital.
// Rebuilding a saved night midway through the rounds reproduces every ember.
import { COURT_BRAZIERS, COURT_GATE_Z } from './retreat-layout.js';
const day=144,clamp=x=>Math.max(0,Math.min(1,x));
const fade=x=>{const t=clamp(x);return t*t*(3-2*t);};
function itinerary(i){
  const side=i?1:-1, gate=COURT_GATE_Z, delay=i*2.35, first=COURT_BRAZIERS[i*2],second=COURT_BRAZIERS[i*2+1];
  const home=[side*5.88,gate+2.30,0,0];
  const reach=([x,z])=>[x+.35,z+.78,Math.PI,1];
  const aim=([x,z])=>[x+.35,z+.78,Math.PI,0];
  const knots=[
    [0,home],[28+delay,home],[30.6+delay,[side*2.75,gate+1,Math.PI]],
    [32.4+delay,[side*2.75,gate-2.61,Math.PI]],[36.3+delay,aim(first)],
    [38.4+delay,reach(first)],[39.9+delay,reach(first)],[41.3+delay,aim(first)],
    [43.1+delay,[side*6.45,first[1]+.64,Math.PI]],[48.5+delay,aim(second)],[50.6+delay,reach(second)],[52.1+delay,reach(second)],[53.5+delay,aim(second)],
    [57.6+delay,[side*3.66,13.65,Math.PI]],[62.7+delay,[side*3.68,6.9,Math.PI]],
    [70.4+delay,[side*10.5,4.9,side*Math.PI*.5]],[76.5+delay,[side*13.65,-2.7,Math.PI]],
    [79.1+delay,[side*13.65,-2.7,side*Math.PI*.5]],
    [87.1+delay,[side*10.7,4.7,0]],[94.3+delay,[side*3.68,6.8,0]],
    [100.5+delay,[side*3.66,15.2,0]],[113.4+delay,[side*2.75,gate+1,0]],
    [116.4+delay,home],[day,home],
  ];
  return {knots,lights:[38.25+delay,50.45+delay]};
}
const rounds=[itinerary(0),itinerary(1)];
export function watchPose(time,index,out={}){
  const t=((time%day)+day)%day,{knots,lights}=rounds[index];
  let end=1;while(end<knots.length-1 && t>=knots[end][0])end++;
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
  out.taper=fade((t-26-index*2.35)/2.1)*fade((118+index*2.35-t)/3);
  out.front=fade((t-lights[0])/.85)*fade((117-t)/10);
  out.inner=fade((t-lights[1])/.85)*fade((117-t)/10);
  return out;
}
