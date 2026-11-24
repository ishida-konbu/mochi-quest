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

// Profile of the hollow keyaki mortar, from foot to lip and back into its bowl.
export const MORTAR_PROFILE = [
      [0.012, 0.015],
      [0.42, 0.015],
      [0.473, 0.048],
      [0.455, 0.13],
      [0.348, 0.255],
      [0.331, 0.34],
      [0.372, 0.42],
      [0.473, 0.56],
      [0.504, 0.681],
      [0.494, 0.739],
      [0.465, 0.757],
      [0.404, 0.754],
      [0.377, 0.731],
      [0.353, 0.663],
      [0.31, 0.59],
      [0.246, 0.519],
      [0.15, 0.47],
      [0.003, 0.458],
    ];
