import { BUILD_MODULES } from './living-build-state.js';

// A stand or floor clears its own patch of brush. Retain every plant's base
// height so moving a module restores exactly the original planting pattern.
export function plantedFootprints(structures) {
  return structures.filter(s=>!s.parentId).map(s=>{
    const d=BUILD_MODULES[s.kind];
    return {x:s.x,z:s.z,w:d.width*.5,d:d.depth*.5,c:Math.cos(s.yaw),s:Math.sin(s.yaw)};
  });
}
export function prunePlantBatch(attr,offset,x0,z0,previous,plots,pad) {
  const a=attr.array,stride=attr.itemSize;
  for(const [index,height] of previous)a[index]=height;
  let dirty=previous.size>0;
  previous.clear();
  if(plots.length){
    for(let i=offset;i<a.length;i+=stride) {
      const x=a[i]+x0,z=a[i+2]+z0;
      for(const plot of plots) {
        const dx=x-plot.x,dz=z-plot.z;
        if(Math.abs(dx)>3.5 || Math.abs(dz)>3.5)continue;
        if(Math.abs(dx*plot.c-dz*plot.s)>plot.w+pad || Math.abs(dx*plot.s+dz*plot.c)>plot.d+pad)continue;
        previous.set(i+1,a[i+1]);a[i+1]=-1000;dirty=true;
        break;
      }
    }
  }
  if(dirty)attr.needsUpdate=true;
}
