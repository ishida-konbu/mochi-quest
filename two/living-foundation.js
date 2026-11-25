import { terrainContactHeight } from './terrain.js';

const corners = (xs,zs) => xs.flatMap(x=>zs.map(z=>[x,z]));
const floor = corners([-1.44,1.44],[-1.23,1.23]);
const bearings = {
  floor, hut:floor,
  camp:[...corners([-.44,.44],[-.70,.85]),[-.78,-.72]],
  stand:corners([-.75,.75],[-.38,.33]),
  chest:corners([-.40,.40],[-.21,.21]),
  fence:[[-.84,0],[.84,0]],
};

// Use the same contact mesh as the traveller. The local axes match the
// workshop, while heights are world elevations so all pier heads stay level.
export function foundationPiers(kind,site) {
  if (site.parentId || !bearings[kind]) return [];
  const c=Math.cos(site.yaw||0),s=Math.sin(site.yaw||0);
  return bearings[kind].map(([x,z])=>({
    x,z,groundY:terrainContactHeight(site.x+x*c+z*s,site.z-x*s+z*c),topY:site.y,
  }));
}

export function foundationWood(kind,relief) {
  // Each base kit already covers a handspan of uneven ground. Reserve the
  // longest required cut for each bearing from 2.4 m timber stock.
  return Math.ceil(Math.max(0,relief-.18)*(bearings[kind]?.length??0)/2.4);
}
