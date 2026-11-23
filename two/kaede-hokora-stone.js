import { DRAGON_PLINTH } from './kaede-dragon-layout.js';

// Each stone has its own sawn bed, split sides and a hand-dressed arris.
// Carry the texture around the broken edges instead of restarting it on each facet.
function dressedStone(b, x0, x1, z0, z1, bottom, top, seed, tint, cap = false) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const rim = [];
  let distance = 0;
  for (let side = 0; side < 4; side++) {
    const [x, z] = corners[side];
    const [ex, ez] = corners[(side + 1) % 4];
    const dx = ex - x, dz = ez - z, length = Math.hypot(dx, dz);
    const cut = (.023 + .008 * Math.sin(seed + side * 2.4)) / length;
    const stops = [cut, .50 + .09 * Math.cos(seed * 3 + side), 1 - cut];
    if (cap && side === 2) stops.splice(1, 0, .20, .245, .28);
    for (const t of stops) {
      const wave = Math.sin(seed * 1.3 + side * 4.7 + 12 * t);
      const chip = cap && side === 2 && t === .245 ? .022 : 0;
      const roughness = (cap ? .003 : .006) * (.56 + .44 * wave);
      rim.push({
        x: x + t * dx - dz / length * roughness,
        z: z + t * dz + dx / length * roughness,
        u: (distance + length * t) / .90, wave, chip,
      });
    }
    distance += length;
  }

  const rings = rim.map(({x, z, wave, chip}) => {
    const point = (inset, y) => [x - (x - cx) * inset / hx, y, z - (z - cz) * inset / hz];
    const edge = cap ? .013 : .022;
    return [
      point(edge, bottom + .002 * wave),
      point(.002, bottom + edge + .004 * wave),
      point(0, top - edge - .005 * wave - chip),
      point(edge + .005 * wave + chip, top - (cap ? .0015 : .004) * (1 + wave)),
    ];
  });
  const bottomTint = cap ? '#b2b3a5' : '#989e87';
  const lowerSide = cap ? '#d4d1c1' : '#aeb2a0';
  const tones = [bottomTint, lowerSide, tint, tint];
  const capUV = ([x, , z]) => [x / .90, z / .90];
  const topCenter = [cx, top, cz], soleCenter = [cx, bottom, cz];
  for (let i = 0; i < rim.length; i++) {
    const j = (i + 1) % rim.length, a = rings[i], c = rings[j];
    const u = rim[i].u, v = rim[j].u + (j === 0 ? distance / .90 : 0);
    for (let band = 0; band < 3; band++) {
      const points = [a[band], a[band + 1], c[band + 1], c[band]];
      b.face('stone', tint, points, {
        seed, colors: [tones[band], tones[band + 1], tones[band + 1], tones[band]],
        uvs: points.map((p, n) => [n < 2 ? u : v, p[1] / .90]),
      });
    }
    const face = [topCenter, c[3], a[3]];
    b.face('stone', tint, face, {seed, uvs: face.map(capUV)});
    if (cap) {
      const underside = [soleCenter, a[0], c[0]];
      b.face('stone', bottomTint, underside, {seed, uvs: underside.map(capUV)});
    }
  }
}

export function buildHokoraStone(b) {
  const {width, depth, bottom, top} = DRAGON_PLINTH;
  // A sloping bank exposes the left end of the foundation course. Each course
  // breaks the joints below it, and each return is built from full-depth stones.
  dressedStone(b, -.690, .018, -.592, -.152, bottom, -.055, 2, '#b8b9aa');
  dressedStone(b, .018, .695, -.592, -.152, bottom, -.050, 4, '#c3c1b4');
  dressedStone(b, -.692, -.298, -.152, .595, bottom, -.048, 3, '#b7b8ac');
  dressedStone(b, -.298, .250, -.152, .595, bottom, -.049, 5, '#c5c1b1');
  dressedStone(b, .250, .696, -.152, .594, bottom, -.046, 7, '#babeaf');

  dressedStone(b, -.704, .242, -.612, .018, -.057, .210, 8, '#d2cfbe');
  dressedStone(b, .242, .704, -.609, .018, -.054, .207, 10, '#c9ccbd');
  dressedStone(b, -.704, -.106, .018, .606, -.057, .209, 11, '#d5d3c6');
  dressedStone(b, -.106, .708, .018, .606, -.054, .210, 13, '#d0cbbd');

  // The single cap sheds rain clear of the bed joints. One spall breaks its
  // front lip, while the central bearing surface stays level under the sill.
  dressedStone(b, -width/2, width/2, -depth/2, depth/2, .206, top, 17, '#e1ddcf', true);
}
