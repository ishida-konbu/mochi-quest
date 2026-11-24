// Positions are the visitor's footing. Free-standing worktops face local +Z.
export const WORKTOPS = Object.freeze({
  'river-mortar': { x: 5.8, z: 65.3, yaw: Math.PI, width: 2.72, depth: 1.02 },
  'terraces-mortar': { x: 150.4, z: 95.5, yaw: .12, width: 2.72, depth: 1.02 },
});
export const HERB_PATCH = {x: -6.8, z: 67.9};
export const RICE_BASKET = {x: 164.2, z: 97.1};
export const RICE_SHOP = {x: 146.5, z: 90.6};
export function worktopPoint(table,u,v) {
  const c=Math.cos(table.yaw), s=Math.sin(table.yaw);
  return {x:table.x+u*c+v*s,z:table.z-u*s+v*c};
}

// Register the same feet, work surface and vessels that the painter draws.
export function addLivingSolids(put,height) {
  for (const table of Object.values(WORKTOPS)) {
    const floor=height(table.x,table.z);
    function solid(u,v,rx,rz,bottom,top,kind) {
      const {x,z}=worktopPoint(table,u,v);
      put(x,z,rx,rz,table.yaw,floor+top,kind,true,0,bottom==null?-Infinity:floor+bottom);
    }
    solid(0,0,table.width*.5,table.depth*.5,.64,.76,'box');
    for (const u of [-1.12,1.12]) for (const v of [-.35,.35]) solid(u,v,.073,.073,null,.65,'box');
    solid(-.68,0,.365,.365,.76,1.302,'oval');
    solid(.50,.02,.295,.295,.76,1.22,'oval');
    solid(1.02,.14,.172,.172,.76,.90,'oval');
  }
  for(const [p,r,h] of [[RICE_BASKET,.40,.40],[RICE_SHOP,.48,.46]])
    put(p.x,p.z,r,r,0,height(p.x,p.z)+h,'oval',true);
}
