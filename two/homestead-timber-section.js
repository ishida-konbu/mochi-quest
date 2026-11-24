import { groveWood } from './wood-contacts.js';

// Intersect the same planted woody strokes used by the forest painter. A
// forked seedling can have two or three boles already at this low height.
export function timberCut(tree) {
  const height = .42, level = height / tree.h, yaw = tree.seed * 2.39996323;
  const rings = [];
  for (const part of groveWood(tree.form)) {
    if (part.dy <= 0 || level < part.y || level > part.y + part.dy) continue;
    const t = (level - part.y) / part.dy;
    const u = (part.x + part.dx*t) * tree.h, v = (part.z + part.dz*t) * tree.h;
    rings.push({x:u*Math.cos(yaw)+v*Math.sin(yaw),z:-u*Math.sin(yaw)+v*Math.cos(yaw),r:part.r*tree.h});
  }
  if (!rings.length) return {x:tree.x,y:tree.ground+height,z:tree.z,radius:tree.h*.031};
  const extent = key => (Math.min(...rings.map(p=>p[key]-p.r))+Math.max(...rings.map(p=>p[key]+p.r)))/2;
  const x=extent('x'), z=extent('z');
  return {x:tree.x+x,y:tree.ground+height,z:tree.z+z,radius:Math.max(...rings.map(p=>Math.hypot(p.x-x,p.z-z)+p.r))};
}
