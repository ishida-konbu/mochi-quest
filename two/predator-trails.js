// Centres are surveyed clearings, in metres on the island. Each tiger keeps
// its own range, from the floodplain coppice to the pines inland of the Cape.
const tigerRanges = {
  river:    [52, 168, 5.8, -.35],
  shrine:   [-208, -193, 6.5, .42],
  market:   [42, -187, 7.2, -.62],
  spring:   [175, -226, 5.8, .85],
  terraces: [105, 217, 6.5, -.38],
  coast:    [-131, 212, 7.2, .55],
  snow:     [-187, -297, 5.8, .31],
  autumn:   [239, -40, 6.5, -.74],
  moon:     [-150, 337, 7.2, .48],
  dawn:     [240, 245, 5.8, -.53],
};
// The two shishi guard separate wooded ridges beyond the snow capital and
// upstream of the maple gorge. Neither shares a courtyard or shrine gate.
const shishiRanges = [[47, -309, 5.4, -.27], [240, -210, 5.4, .45]];

export function predatorRange(n) {
  const entry = n.type === 'shishi' ? shishiRanges[n.variant] : tigerRanges[n.habitat];
  const [x, z, radius, turn] = entry;
  return { x, z, radius, cos: Math.cos(turn), sin: Math.sin(turn) };
}

// A bent contour around the clearing, with a broad side and a narrow turn.
// Use its derivative for the head's bearing and the speed of the paws.
export function patrolAt(trail, x, z, angle, out) {
  const sn = Math.sin(angle), cs = Math.cos(angle), twice = cs*cs-sn*sn;
  const u = trail.radius*sn*(1+.12*cs);
  const v = trail.radius*(.64*cs+.20*sn*cs);
  out.x = x+u*trail.cos+v*trail.sin;
  out.z = z-u*trail.sin+v*trail.cos;
  const du = cs+.12*twice, dv = -.64*sn+.20*twice;
  out.heading = Math.atan2(du*trail.cos+dv*trail.sin, -du*trail.sin+dv*trail.cos);
  out.pathSpeed = trail.radius*Math.hypot(du,dv);
  return out;
}
