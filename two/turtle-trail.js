// Each leg starts wherever the turtle was left, including a shore or rooftop.
// Search connected footing locally so an unreachable nook never pins the
// animal against the same post on every circuit.
import { wrapCoord, wrapDelta } from './terrain.js';

const shelterStops = [[-5,-4],[-3,-7],[2,-4],[0,0]];
const stride = .9, reach = 10;
const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];

export function planTurtleLeg(turtle, leg, footing) {
  const [u,v]=shelterStops[leg];
  const dx=wrapDelta(turtle.homeX+u-turtle.x),dz=wrapDelta(turtle.homeZ+v-turtle.z);
  function trace(from,to) {
    const x=wrapDelta(to.x-from.x), z=wrapDelta(to.z-from.z);
    const count=Math.max(1,Math.ceil(Math.hypot(x,z)/.22));
    let y=from.y;
    for(let i=1;i<=count;i++){
      y=footing(wrapCoord(from.x+x*i/count),wrapCoord(from.z+z*i/count),y,Math.hypot(x,z)/count/2);
      if(!Number.isFinite(y))return false;
    }
    to.y=y; return true;
  }
  const start={i:0,j:0,x:turtle.x,y:turtle.y,z:turtle.z,parent:null};
  const end={x:wrapCoord(start.x+dx),z:wrapCoord(start.z+dz)};
  if(Math.hypot(dx,dz)<=reach*stride && trace(start,end))return [end];
  const queue=[start],visited=new Set([0]);
  let nearest=start, best=dx*dx+dz*dz;
  for(let k=0;k<queue.length;k++){
    const here=queue[k];
    for(const [di,dj] of directions) {
      const i=here.i+di,j=here.j+dj,key=i*(2*reach+1)+j;
      if(Math.abs(i)>reach || Math.abs(j)>reach || visited.has(key))continue;
      const next={i,j,parent:here,x:wrapCoord(start.x+i*stride),z:wrapCoord(start.z+j*stride)};
      if(di && dj && (!Number.isFinite(footing(next.x,here.z,here.y)) ||
          !Number.isFinite(footing(here.x,next.z,here.y))))continue;
      if(!trace(here,next))continue;
      visited.add(key); queue.push(next);
      const d=(dx-i*stride)**2+(dz-j*stride)**2;
      if(d<best){nearest=next;best=d;}
      if(d<stride*stride && trace(next,end)) {
        end.parent=next; nearest=end; break;
      }
    }
    if(nearest===end)break;
  }
  // If the stop is behind a wall at our nose, explore another accessible
  // direction instead of sleeping at the contact for the entire next leg.
  if(nearest===start && queue.length>1) nearest=queue[Math.min(queue.length-1,18)];
  const path=[];
  for(let n=nearest;n.parent;n=n.parent) path.push(n);
  return path.reverse();
}
