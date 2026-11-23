// The village hare keeps her place in the delivery book. Her whole round is
// anchored to game time so returning to the gorge restores the same trip.
import { terrainContactHeight, terrainHeight } from './terrain.js';

// The old stone basin at the bridgehead and the near bank of the upper spring.
export const KAEDE_WATER_HARE_HOME={x:288.47,z:-119.57};
const basin={x:289,z:-120};
const scoop={x:273.10,z:-124.42};

const facing = (a,b) => Math.atan2(b.x-a.x,b.z-a.z);
const turnAngle = (from,to) => Math.atan2(Math.sin(to-from),Math.cos(to-from));
function ease(t) {
  t=Math.min(1,Math.max(0,t));
  return t*t*(3-2*t);
}

function waterRound() {
  // Follow the open shoulder west, wind back up the contour below the
  // shrine, then step onto the dry margin of the source pool.
  const path=[
    KAEDE_WATER_HARE_HOME, {x:278.96,z:-118}, {x:273.8,z:-119.5},
    {x:269.5,z:-120.15}, {x:274.8,z:-122.95}, scoop,
  ];
  const stance=path.map(p=>({...p,y:terrainContactHeight(p.x,p.z)}));
  // The right paw reaches across the bank. At this angle the tipped rim
  // enters the water by the source rocks, with both feet still on land.
  const springHeading=1.20, basinHeading=facing(path[0],basin)-.84;
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
  const home=stance[0], edge=stance.at(-1);
  append('rest',home,home,1.8,heading,0);
  walk(stance,1.06,0);
  pivot(edge,springHeading,0);
  append('scoop',edge,edge,3.8,heading,0);
  walk([...stance].reverse(),.83,1);
  pivot(home,basinHeading,1);
  append('pour',home,home,3.5,heading,1);
  return {stops,duration:end,basinWaterHeight:terrainHeight(basin.x,basin.z)+.658};
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
  hare.y=terrainContactHeight(hare.x,hare.z);
  hare.heading=s.heading+s.change*ease(u);
  hare.waterYield=passer ? (1-ease((Math.hypot(passer.x-hare.x,passer.z-hare.z)-.75)/1.65)) *
    (1-ease((Math.abs(passer.y-hare.y)-.35)/1.15)) : 0;
  hare.basinWaterHeight=round.basinWaterHeight;
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
