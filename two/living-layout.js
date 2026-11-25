// Positions are the visitor's footing. Free-standing worktops face local +Z.
export const WORKTOPS = Object.freeze({
  'river-mortar': { x: 5.8, z: 65.3, yaw: Math.PI, width: 2.72, depth: 1.02 },
  'terraces-mortar': { x: 150.4, z: 95.5, yaw: .12, width: 2.72, depth: 1.02 },
});
export const HERB_PATCH = {x: -6.8, z: 67.9};
export const RICE_BASKET = {x: 164.2, z: 97.1};
export const RICE_SHOP = {x: 146.5, z: 90.6};
export const MALLET_HANDLE_END = .918;
// Rest the cross-head alongside the mortar with its handle facing the cook.
export const MALLET_RACK = [-1.18,1.18,-.34];
export function worktopPoint(table,u,v) {
  const c=Math.cos(table.yaw), s=Math.sin(table.yaw);
  return {x:table.x+u*c+v*s,z:table.z-u*s+v*c};
}

// The cooking stand has to clear a cook on its raised tread and a lifted pestle.
export const marketCookCanopy = {lift:.68,postX:1.88,width:4.32};

// Local height zero is the foot of the trestle. The market counter is .18 m
// taller and sits .42 m forward of its awning.
export function marketCooktop([x,z,yaw]) {
  return {...worktopPoint({x,z,yaw},0,.42), yaw, width:3.14, depth:.84};
}

export function addCookwareSolids(table, floor, put) {
  function solid(u,v,rx,rz,bottom,top,kind) {
    const {x,z}=worktopPoint(table,u,v);
    put(x,z,rx,rz,table.yaw,floor+top,kind,true,0,floor+bottom);
  }
  solid(-.68,0,.365,.365,.76,1.302,'oval');
  solid(.50,.02,.295,.295,.76,1.22,'oval');
  solid(1.02,.14,.172,.172,.76,.90,'oval');
  const edge=-table.width/2;
  solid((edge-1.90)/2,.085,(edge+1.90)/2,.375,.694,.76,'box');
}

// Fitted steps put a small mochi's eyes above the rim of a working mortar.
// The terrace has rising ground on the right; its tread clears that bank.
export function cooksPlatform(id) {
  const high=id==='terraces-mortar'?.54:.41;
  const steps=[
    {z:1.20,depth:1.14,width:3.24,top:high},
    {z:2.01,depth:.48,width:3.24,top:high-.20},
  ];
  if(id!=='river-mortar') steps.push({z:2.49,depth:.48,width:3.24,top:high-.40});
  if(id==='market-mortar') steps.push({z:2.97,depth:.48,width:3.24,top:high-.60});
  return steps;
}

export function addCooksPlatformSolids(table,id,floor,put) {
  for(const {z,depth,width,top} of cooksPlatform(id)) {
    const p=worktopPoint(table,0,z);
    put(p.x,p.z,width/2,depth/2,table.yaw,floor+top,'floor',true);
  }
}

// Register the same feet, work surface and vessels that the painter draws.
export function addLivingSolids(put,height) {
  for (const [id,table] of Object.entries(WORKTOPS)) {
    const floor=height(table.x,table.z);
    function solid(u,v,rx,rz,bottom,top,kind) {
      const {x,z}=worktopPoint(table,u,v);
      put(x,z,rx,rz,table.yaw,floor+top,kind,true,0,bottom==null?-Infinity:floor+bottom);
    }
    solid(0,0,table.width*.5,table.depth*.5,.64,.76,'box');
    for (const u of [-1.12,1.12]) for (const v of [-.35,.35]) solid(u,v,.073,.073,null,.65,'box');
    addCookwareSolids(table,floor,put);
    addCooksPlatformSolids(table,id,floor,put);
  }
  for(const [p,r,h] of [[RICE_BASKET,.40,.40],[RICE_SHOP,.48,.46]])
    put(p.x,p.z,r,r,0,height(p.x,p.z)+h,'oval',true);
}
