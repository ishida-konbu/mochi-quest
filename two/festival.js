// The two artists at dawn share their coordinates with the illustrated scene and the delivery book.
export const POUNDING = Object.freeze({ x: 301, z: 168.5, yaw: -.73, period: 2.83, strike: .895 });
// The ferry vendor hangs her curtain at the shoulder of the path, clear of
// the bridge sightline and the customers gathered around the basket.
export const FERRY_CURTAIN = {x:4.6,z:55.9,yaw:-.34,span:2.76,height:2.52};
export function ferryCurtainPoint(u, v = 0) {
  const {x,z,yaw} = FERRY_CURTAIN;
  return [x + Math.cos(yaw)*u + Math.sin(yaw)*v, z - Math.sin(yaw)*u + Math.cos(yaw)*v];
}
export const KADOMATSU = [[298.6,171.6,-.22],[304.7,171.3,.22]];
export const POUNDING_CREW = [
  {type:'rabbit',role:'pounder',u:-.89,v:-.63},
  {type:'frog',role:'turner',u:.75,v:.44},
];
