// Lay the kit out before the first pickup. All coordinates are relative to
// the building. Reserve the space for each piece, the carpenter's pickup
// stance, the building itself and the stairs before allowing the show to run.
import { BUILD_MODULES } from './living-build-state.js';
import { makeAssemblyTextile } from './homestead-assembly-textile.js';

const measured=new WeakMap();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const directions=[[0,1],[1,0],[0,-1],[-1,0]];
function layRotation(step){
  const {min,max}=step.bounds;
  if(/roof\.(back|front)-/.test(step.id)){
    const rise=max[1]-min[1]-.10, run=max[2]-min[2];
    return [Math.atan2(rise,run)*(step.id.includes('.back')?1:-1),0,0];
  }
  if(step.method==='raise' && max[1]-min[1]>1.25){
    // Lay a framed bent on its broad face. Narrow posts are also transported
    // horizontally, including the buried section at the foot.
    return max[0]-min[0]>=max[2]-min[2]?[Math.PI/2,0,0]:[0,0,Math.PI/2];
  }
  // The back wall is a joined panel, with runners built into its face.
  if(step.id.startsWith('wall.'))return [Math.PI/2,0,0];
  return [0,0,0];
}
function measuredStock(step){
  if(measured.has(step))return measured.get(step);
  const rotation=layRotation(step),[rx,,rz]=rotation;
  const textile=step.unfurl?makeAssemblyTextile(step):null;
  textile?.unroll(0);
  const pos=(textile?.geometry??step.geometry).attributes.position;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],soles=new Map();
  const ax=Math.cos(rx),bx=Math.sin(rx),az=Math.cos(rz),bz=Math.sin(rz);
  for(let i=0;i<pos.count;i++){
    const dx=pos.getX(i)-step.grip[0],dy=pos.getY(i)-step.grip[1],dz=pos.getZ(i)-step.grip[2];
    const x=dx*az-dy*bz,y0=dx*bz+dy*az;
    const y=y0*ax-dz*bx,z=y0*bx+dz*ax;
    min[0]=Math.min(min[0],x);min[1]=Math.min(min[1],y);min[2]=Math.min(min[2],z);
    max[0]=Math.max(max[0],x);max[1]=Math.max(max[1],y);max[2]=Math.max(max[2],z);
    const key=Math.round(x*8)+','+Math.round(z*8);
    if(!soles.has(key)||soles.get(key)[1]>y)soles.set(key,[x,y,z]);
  }
  textile?.geometry.dispose();
  const result={rotation,min,max,soles:[...soles.values()]};
  measured.set(step,result);
  return result;
}
function rect(x,z,w,d){return {x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2};}
function clips(a,b,pad){
  return a.x1+pad>b.x0 && b.x1+pad>a.x0 && a.z1+pad>b.z0 && b.z1+pad>a.z0;
}
function scaffoldFootprint(p){
  const n=p.normal, extent=p.depth+(p.count-1)*p.run, shift=(extent-p.depth)*.5;
  return rect(p.center[0]+n[0]*shift,p.center[2]+n[1]*shift,
    Math.abs(n[1])*p.width+Math.abs(n[0])*extent,Math.abs(n[0])*p.width+Math.abs(n[1])*extent);
}
function candidates(step,kit,kind,size,variant){
  const {min,max}=kit,sx=max[0]-min[0],sz=max[2]-min[2],candidates=[];
  const goal=[step.grip[0],step.grip[2]],limit=(kind==='hut'?9.2:7)+variant*1.1;
  // Grid centres are just candidate positions. The actual grip, stance, and
  // terrain contacts retain their continuous, authored local coordinates.
  for(let x=-limit;x<=limit;x+=.57)for(let z=-limit;z<=limit;z+=.57){
    const xy=[x-(max[0]+min[0])/2,z-(max[2]+min[2])/2];
    const footprint=rect(x,z,sx,sz);
    for(const n of directions){
      const inset=n[0]>0?max[0]:n[0]<0?-min[0]:n[1]>0?max[2]:-min[2];
      if(inset>.60*size)continue;
      const pick=[xy[0]+n[0]*1.12*size,xy[1]+n[1]*1.12*size];
      const preferred=[goal[0]+step.normal[0]*1.12*size,goal[1]+step.normal[1]*1.12*size];
      const detour=distance(pick,preferred);
      const sideBias=variant===1?Math.abs(x)*.19:variant===2?Math.abs(z)*.22:0;
      const score=distance(xy,goal)+.36*detour+sideBias+.32*Math.max(0,inset)+.23*(1-n[0]*step.normal[0]-n[1]*step.normal[1]);
      candidates.push({xy,n,pick,footprint,score});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);return candidates;
}

export function planAssemblyStock(steps,{kind,size=1,land,free,platforms=[],start,variant=0}){
  const {width,depth}=BUILD_MODULES[kind];
  const landscape=[rect(0,0,width,depth),...platforms.map(scaffoldFootprint)];
  if(start)landscape.push(rect(start[0],start[1],1.13*size,1.13*size));
  const occupied=[],stances=[],staging=[];
  const aisle=[.15,1.02,1.34][variant]??1.34;
  for(const step of steps){
    const kit=measuredStock(step),{min,max}=kit;
    let found;
    for(const c of candidates(step,kit,kind,size,variant)){
      const {xy,n,pick,footprint:r}=c;
      const stance=rect(pick[0],pick[1],.97*size,.97*size);
      if(landscape.some(b=>clips(r,b,.12)) || occupied.some(b=>clips(r,b,aisle)) ||
        stances.some(b=>clips(r,b,.10)) || occupied.some(b=>clips(stance,b,.09)))continue;
      // Avoid having to walk between an existing trestle's legs to pick up a panel.
      if(landscape.slice(0,platforms.length+1).some(b=>clips(stance,b,.015)))continue;
      const corners=[[r.x0,r.z0],[r.x0,r.z1],[r.x1,r.z0],[r.x1,r.z1],[(r.x0+r.x1)/2,(r.z0+r.z1)/2]];
      if(!free(pick,land(pick)) || corners.some(p=>!free(p,land(p))))continue;
      // Seat the complete part on the terrain, including the toes of a bent
      // placed flat. A thin paper roll and the feet of a box get different
      // ground supports although their final hands are at similar heights.
      let base=-Infinity;
      for(const [dx,y,dz] of kit.soles)base=Math.max(base,land([xy[0]+dx,xy[1]+dz])-y);
      base+=.012;
      if(base-land(pick)>1.76*size)continue;
      const grip=[xy[0],base,xy[1]];
      const bounds={min:min.map((a,i)=>a+grip[i]),max:max.map((a,i)=>a+grip[i])};
      found={offset:grip.map((v,i)=>v-step.grip[i]),rotation:kit.rotation,normal:n,bounds,grip};
      occupied.push(r);stances.push(stance);break;
    }
    if(!found)return null;
    staging.push(found);
  }
  return staging;
}
