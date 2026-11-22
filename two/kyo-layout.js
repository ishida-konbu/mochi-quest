// The main avenue is kept open from the southern gate right up to the hillside fires.
export const KYO_ROADS = [
  [8.0, [[120, -377], [120, -401], [120, -424], [120, -454], [120, -478]], true],
  [7.0, [[62, -424], [90, -424], [120, -424], [151, -424], [175, -424]], true],
  [3.8, [[70, -392], [71, -411], [71, -424], [71, -443], [72, -467]]],
  [4.2, [[163, -386], [164, -401], [164, -424], [164, -442], [164, -464]]],
  [3.7, [[69, -407], [91, -407], [120, -408], [142, -407], [164, -407]]],
  [4.1, [[71, -466], [96, -466], [120, -466], [145, -466], [164, -466]]],
];

const houses = [];
const streetTrades = ['dye', 'tea', 'brew', 'ink', 'rice'];
for (const side of [-1, 1]) {
  // Rows of narrow-fronted townhouses face each other across the processional street.
  for (const [i, z] of [-388, -400, -445, -457].entries()) {
    houses.push([120 + side * 11, z, 8.1 + i % 2, 8.5, 3.8 + i % 2 * .55, 2.9,
      -side * Math.PI / 2, i === 0 ? 'inn' : 'shop', streetTrades[(i + side + 1) % 5]]);
  }
  for (const [i, x] of [81, 94, 146, 156].entries()) {
    houses.push([x, -424 + side * 10, 8.0 + i % 2, 7.6, 3.15 + (i % 3) * .48, 2.55,
      side === 1 ? Math.PI : 0, i % 3 ? 'shop' : 'cottage', streetTrades[(2 * i + side + 2) % 5]]);
  }
}
houses.push(
  [91,-449,13.6,10.0,5.3,4.4,0,'temple','ink'],
  [149,-451,12.4,10.2,4.9,3.8,0,'temple','ink'],
  [93,-477,12.0,11.4,4.3,14.5,0,'pagoda'],
  [155,-479,12.8,11.0,4.4,14.5,0,'pagoda'],
  [90,-391,11.6,8.4,4.1,3.3,Math.PI,'inn','lodge'],
  [149,-389,10.8,8.8,3.7,2.9,Math.PI,'inn','lodge'],
  [61,-441,9.4,7.8,3.7,3.0,Math.PI/2,'shop','rice'],
  [175,-444,9.8,7.6,4.1,3.6,-Math.PI/2,'shop','dye'],
  [62,-406,9.2,7.0,3.9,2.9,Math.PI/2,'cottage','tea'],
  [175,-401,9.0,7.4,3.5,2.7,-Math.PI/2,'shop','brew'],
);
export const KYO_BUILDINGS = houses;

export const KYO_FOOD = [
  {type: 'kyoTea', x: 115, z: -432, yaw: Math.PI / 2},
  {type: 'mitarashi', x: 125, z: -417, yaw: -Math.PI / 2},
];

export const KYO_ANIMALS = [
  [119,-386], [122,-396], [127,-408], [121,-410], [119,-438], [122,-454],
  [111,-424], [104,-423], [87,-425], [76,-423], [135,-424], [152,-423],
  [160,-437], [72,-451], [103,-467], [142,-466],
].map(([x,z], i) => ({
  type: i % 3 === 1 ? 'frog' : 'rabbit', role: i % 4 === 1 ? 'porter' : 'wander',
  x, z, phase: i * 2.39996,
}));

const smooth = (a,b,x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function kyoInfluence(x,z) {
  return 1 - smooth(.52, 1.08, Math.hypot((x - 120) / 156, (z + 435) / 130));
}
export function kyoNight(time) {
  // 144 seconds from noon to the next noon, with a long dusk for the mountain lookout.
  const phase = -Math.cos(time * Math.PI * 2 / 144);
  return smooth(-.35, .48, phase);
}
