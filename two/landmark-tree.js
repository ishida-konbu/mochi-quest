import * as THREE from './vendor/three.module.min.js';
const TAU=2*Math.PI,{cos,sin}=Math;
const v=(x,y,z)=>new THREE.Vector3(x,y,z);

// The painter and the contact survey run this same seeded branching pattern.
export function inkTree(brush, p, t, random, h, elder, near, autumn, boughs) {
  const { x, z, h: height, kind, seed } = t,
    r = random,
    ground = h(x, z);
  const pine = kind === 'pine',
    willow = kind === 'willow';
  const angle = elder ? 0.08 : r() * TAU,
    lean = pine ? 0.13 + r() * 0.14 : 0.06 + r() * 0.12;
  const tip = (dx, dy, dz) =>
    v(
      x + height * (cos(angle) * dx - sin(angle) * dz),
      ground + height * dy,
      z + height * (sin(angle) * dx + cos(angle) * dz),
    );
  const bend = pine ? 1 : 0.53;
  const spine = [
    tip(0, -0.04, 0),
    tip(-0.045 * bend, 0.15, 0.022),
    tip(0.012, 0.32, -0.045 * bend),
    tip(lean * 0.64, 0.46, 0.018),
    tip(0.042, 0.605, 0.075 * bend),
    tip(lean, 0.76, 0.01),
    tip(lean * 0.64, 0.886, -0.056 * bend),
    tip(lean + 0.045, 0.965, -0.061 * bend),
  ];
  const radius = height * (elder ? 0.068 : pine ? 0.051 : 0.04);
  const bark = willow ? '#d3d3b0' : pine ? '#dfdfd4' : '#d5c9b6';
  brush.stroke(
    spine,
    [1.42, 0.92, 0.79, 0.68, 0.54, 0.37, 0.22, 0.042].map((q) => q * radius),
    elder ? 19 : near ? 15 : 8,
    elder ? 42 : near ? 29 : 11,
    seed % 63,
    bark,
  );
  if (near) {
    for (let j = 0; j < (elder ? 9 : 5); j++) {
      const a = angle + (TAU * j) / (elder ? 9 : 5) + (r() - 0.5) * 0.36,
        l = height * (elder ? 0.22 : 0.13) * (0.72 + r() * 0.64);
      const e = v(x + cos(a) * l, 0, z + sin(a) * l);
      e.y = h(e.x, e.z) - 0.035;
      const mid = v(x + cos(a - 0.25) * l * 0.54, ground + height * 0.032, z + sin(a - 0.25) * l * 0.54);
      brush.stroke(
        [v(x + cos(a) * radius * 0.44, ground + radius * 1.35, z + sin(a) * radius * 0.44), mid, e],
        [radius * 0.54, radius * 0.31, 0.025],
        7,
        5,
        (seed % 35) + j,
        bark,
      );
    }
  }
  if (elder) {
    const start = new THREE.CatmullRomCurve3(spine).getPoint(0.42);
    brush.stroke(
      [
        start,
        start.clone().add(v(-0.59, 0.22, 0.39)),
        start.clone().add(v(-1.26, 0.34, 0.58)),
        start.clone().add(v(-1.54, 0.64, 0.71)),
      ],
      [0.22, 0.151, 0.073, 0.012],
      9,
      9,
      31,
      '#e0d7c1',
    );
  }
  const n = near ? (pine ? 10 : 9) : 6;
  const woodCurve = new THREE.CatmullRomCurve3(spine, false, 'centripetal');
  for (let j = 0; j < n; j++) {
    const level = j / (n - 1),
      a = elder && j === 2 ? 0.03 : angle + j * 2.399 + (r() - 0.5) * 0.43;
    const origin = woodCurve.getPoint(0.38 + level * 0.58);
    const reach = height * (elder ? 0.6 : pine ? 0.43 : 0.34) * (1 - level * 0.66) * (0.82 + r() * 0.44);
    const lift = height * (pine ? 0.072 : 0.2) * (0.8 + r() * 0.32);
    const swing = (0.16 + r() * 0.25) * (j % 2 ? 1 : -1);
    const elbow = origin
      .clone()
      .add(v(cos(a - swing) * reach * 0.26, lift * (pine ? -0.24 : 0.38), sin(a - swing) * reach * 0.26));
    const shoulder = origin
      .clone()
      .add(
        v(
          cos(a + swing * 0.62) * reach * 0.61,
          lift * 0.57 + height * (pine ? 0.026 : 0.008),
          sin(a + swing * 0.62) * reach * 0.61,
        ),
      );
    const end = origin.clone().add(v(cos(a) * reach, lift, sin(a) * reach));
    const branchRadius = radius * (1 - level * 0.64) * 0.49;
    const crotch = origin.clone().lerp(elbow, 0.53);
    crotch.y += height * (pine ? 0.021 : 0.016);
    const knuckle = shoulder.clone().lerp(end, 0.57);
    knuckle.y -= height * (pine ? 0.025 : 0.012);
    const arm = [origin, crotch, elbow, shoulder, knuckle, end];
    brush.stroke(
      arm,
      [branchRadius, branchRadius * 0.88, branchRadius * 0.75, branchRadius * 0.49, branchRadius * 0.27, 0.017],
      near ? 10 : 5,
      near ? 18 : 6,
      (seed % 67) + j,
      bark,
    );
    const branchCurve = new THREE.CatmullRomCurve3(arm, false, 'centripetal');
    const sprays = near ? 3 : 2;
    for (let k = 0; k < sprays; k++) {
      const fork = branchCurve.getPoint(0.43 + k * 0.22);
      const yaw = a + (k - 1) * (0.74 + r() * 0.32),
        side = reach * (0.22 + r() * 0.21);
      const tuft = fork.clone().add(v(cos(yaw) * side, height * (pine ? 0.043 : 0.087), sin(yaw) * side));
      if(boughs)boughs.push(tuft);
      if (near) {
        const knot = fork.clone().lerp(tuft, 0.57);
        knot.y -= height * 0.022;
        brush.stroke(
          [fork, knot, tuft],
          [branchRadius * 0.34, branchRadius * 0.2, 0.007],
          6,
          5,
          (seed % 31) + j + k,
          bark,
        );
      }
      const spread = height * (pine ? 0.255 : willow ? 0.205 : 0.248) * (1 - level * 0.24) * (0.83 + r() * 0.37);
      const material = p.sprays[t.snow>.5 && pine ? 'snow' : t.autumn>.45 && autumn ? 'autumn' :
        willow ? 'bamboo' : autumn ? 'maple' : pine ? 'pine' : 'oak'];
      for (let face = 0; face < (near ? 4 : 3); face++) {
        const dir = yaw + face * 2.2 + (r() - 0.5) * 0.6,
          distance = spread * (0.08 + r() * 0.29);
        let tint;
        if (pine) tint = ['#e0e5cf', '#c7d4bd', '#f1ecd5', '#c1cdb9'][face];
        else if(t.autumn>.45 && autumn) {
          const palettes=[['#e95b32','#bb3431','#ef7436','#c83e27'],['#e9a441','#f2b451','#c78638','#e6a24c'],
            ['#ba302e','#de3c35','#c52d26','#e65337'],['#d27334','#d85e2b','#efa447','#cf7235']];
          tint=palettes[seed%4][face];
        } else if (autumn) tint = ['#d7b4a0', '#f7d4b2', '#ebbb91', '#d8ba9e'][face];
        else tint = ['#dfe7c1', '#d2ddba', '#f3e4ad', '#bfccac'][face];
        p.part(
          'plane',
          tuft.x + cos(dir) * distance,
          tuft.y + (r() - 0.5) * spread * 0.19,
          tuft.z + sin(dir) * distance,
          spread * (pine ? 1.63 : 1.12),
          spread * (pine ? 0.69 : willow ? 1.42 : 1.1),
          1,
          tint,
          -dir + 1.57,
          0.1 + (r() - 0.5) * 0.71,
          (r() - 0.5) * (pine ? 0.34 : 0.65),
          material,
          near && k === 1 && face === 0,
          true,
        );
      }
    }
  }
}
export function landmarkCulms(tree,random) {
  const angle=random()*TAU;
  const stems=[];
  for(let j=0;j<5;j++){
    const x=tree.x+(random()-.5)*2.3,z=tree.z+(random()-.5)*2.3;
    const high=tree.h*(.7+random()*.42),lean=(random()-.5)*.6;
    stems.push({x,z,high,lean});
  }
  return {angle,stems};
}
