// The village hare keeps her place in the delivery book. Her whole round is
// anchored to game time so returning to the gorge restores the same trip.
import { KAEDE_WATER_TREADS } from './kaede-water-steps.js';
import { groundHeight } from './terrain.js';

const facing = (a,b) => Math.atan2(b.x-a.x,b.z-a.z);
const turnAngle = (from,to) => Math.atan2(Math.sin(to-from),Math.cos(to-from));
function ease(t) {
  t=Math.min(1,Math.max(0,t));
  return t*t*(3-2*t);
}

function waterRound() {
  const treads=KAEDE_WATER_TREADS;
  const basin={x:289,z:-120};
  const verge=[
    [288.47,-119.57], [288,-118.97], [287.63,-118.24],
  ].map(([x,z])=>({x,z,y:groundHeight(x,z)}));
  const bottom=treads[treads.length-1];
  // Stand towards the river edge, clear of the last step, to reach over water.
  const scoop={x:bottom.x+.29,z:bottom.z-.16,y:bottom.y};
  const path=[...verge,...treads,scoop];
  // The pail swings from the right paw, off the centreline of her stance.
  const riverHeading=facing(scoop,{x:bottom.x+.54,z:bottom.z-.25})-.56;
  const basinHeading=facing(verge[0],basin)-.84;
  let end=0, heading=basinHeading;
  const stops=[];
  function append(action,from,to,seconds,face,load,change=0) {
    stops.push({action,from,to,start:end,end:end+seconds,heading:face,load,change});
    end+=seconds;
  }
  function pivot(at,next,load) {
    const delta=turnAngle(heading,next);
    if(Math.abs(delta)>.03) append('turn',at,at,Math.abs(delta)/2.5,heading,load,delta);
    heading=next;
  }
  function walk(points,pace,load) {
    for(let i=1;i<points.length;i++) {
      const from=points[i-1],to=points[i];
      const dir=facing(from,to);
      pivot(from,dir,load);
      const distance=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);
      append('walk',from,to,distance/pace,dir,load);
    }
  }
  append('rest',path[0],path[0],1.8,heading,0);
  walk(path,1.06,0);
  pivot(scoop,riverHeading,0);
  append('scoop',scoop,scoop,3.8,heading,0);
  walk([...path].reverse(),.83,1);
  pivot(path[0],basinHeading,1);
  append('pour',path[0],path[0],3.5,heading,1);
  return {stops,duration:end};
}

let round;
export function updateWaterHare(hare,time,passer) {
  round??=waterRound();
  const t=time%round.duration;
  let low=0,high=round.stops.length-1;
  while(low<high) {
    const mid=(low+high)>>1;
    if(t<round.stops[mid].end) high=mid;
    else low=mid+1;
  }
  const s=round.stops[low], u=(t-s.start)/(s.end-s.start);
  const {from,to}=s,dx=to.x-from.x,dz=to.z-from.z;
  hare.x=from.x+dx*u;
  hare.z=from.z+dz*u;
  const height=from.y+(to.y-from.y)*u;
  hare.heading=s.heading+s.change*ease(u);
  hare.waterYield=passer ? (1-ease((Math.hypot(passer.x-hare.x,passer.z-hare.z)-.75)/1.65)) *
    (1-ease((Math.abs(passer.y-height)-.35)/1.15)) : 0;
  if(hare.waterYield && (from.width || to.width)) {
    // The hare gathers her pail and makes room at the edge of the flagstone.
    const onStone=(from.width ? 1-u : 0)+(to.width ? u : 0);
    const offset=.25*hare.waterYield*onStone;
    hare.x+=Math.cos(hare.heading)*offset;
    hare.z-=Math.sin(hare.heading)*offset;
  }
  // Pick the actual tread below the paw, including its overlap on a landing.
  // The height hint excludes the overhead bridge deck and trestle cross-ties.
  hare.y=groundHeight(hare.x,hare.z,height+.12);
  hare.speed=Math.hypot(dx,dz)/(s.end-s.start);
  hare.waterDip=0;
  hare.waterPour=0;
  hare.pailLevel=s.load;
  if(s.action==='scoop' || s.action==='pour') {
    const reach=ease(u/.32)*(1-ease((u-.68)/.32));
    const transferred=ease((u-.34)/.31);
    if(s.action==='scoop') {
      hare.waterDip=reach;
      hare.pailLevel=transferred;
    } else {
      hare.waterPour=reach;
      hare.pailLevel=1-transferred;
    }
  }
}
