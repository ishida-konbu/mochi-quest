// Each sandal supports the body for half a stride, then swings to its next
// footprint. Survey those placements along the actual route, including turns.
const strideSeconds = .64;
const smooth = t => {
  t = Math.max(0,Math.min(1,t));
  return t*t*(3-2*t);
};

export function watchFooting(poseAt, surfaceAt) {
  const cache = [{}, {}], feet = [{}, {}], pose = {};
  function plant(time, side) {
    const q = poseAt(time, pose);
    const x = q.x + Math.cos(q.yaw) * side * .18;
    const z = q.z - Math.sin(q.yaw) * side * .18;
    return {x, z, y:surfaceAt(x,z), yaw:q.yaw};
  }
  return (time, phase = 0) => {
    for (let k=0; k<2; k++) {
      const side = k ? 1 : -1, turns = time / strideSeconds + (k + phase) * .5;
      const index = Math.floor(turns), saved = cache[k];
      if (saved.index !== index) {
        const center = (index + .25 - (k + phase) * .5) * strideSeconds;
        saved.from = index === saved.index + 1 ? saved.to : plant(center,side);
        saved.to = plant(center + strideSeconds,side);
        saved.index = index;
      }
      const {from,to} = saved, swing = Math.max(0, (turns-index)*2 - 1);
      const f = smooth((swing-.14)/.72);
      const foot = feet[k], span = Math.hypot(to.x-from.x,to.z-from.z);
      foot.x = from.x + (to.x-from.x)*f;
      foot.z = from.z + (to.z-from.z)*f;
      foot.ground = from.y + (to.y-from.y)*smooth(swing);
      const crest = Math.max(from.y,to.y) + Math.min(.095,span*.20);
      foot.y = from.y + (crest-from.y)*smooth(swing/.28) + (to.y-crest)*smooth((swing-.72)/.28);
      foot.yaw = from.yaw + Math.atan2(Math.sin(to.yaw-from.yaw),Math.cos(to.yaw-from.yaw))*f;
    }
    return feet;
  };
}
