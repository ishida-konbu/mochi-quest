// The first ten sights retain their surveyed coordinates. The five outer districts
// keep their streets and doorways at walking scale while their centres move apart.
export const DISTRICT_SHIFT = Object.freeze({
  kyo:     { x: 120, z: -424 },
  peach:   { x: -390, z: -91 },
  ryugu:   { x: -331, z: 135 },
  todaiji: { x: 215, z: 425 },
  inari:   { x: -153, z: -535 },
});

export function districtOffset(id) { return DISTRICT_SHIFT[id]; }
export function districtPoint(id, x, z) {
  const shift = districtOffset(id);
  return [x + shift.x, z + shift.z];
}

export const DISTRICTS = Object.fromEntries(Object.entries(DISTRICT_SHIFT).map(([id, shift]) =>
  [id, { x: 2 * shift.x, z: 2 * shift.z }]));

// Version five stored metre coordinates on the earlier island. Only positions
// within those districts move with them. Keep the original ten sights intact.
const oldFootprints = [
  ['ryugu', -331, 135, 78, 71],
  ['kyo', 119, -455, 135, 108],
  ['todaiji', 215, 426, 102, 79],
  ['peach', -392, -91, 130, 113],
  ['inari', -211, -456, 130, 113],
];
export function relocateLegacyPosition(x, z) {
  const district = oldFootprints.find(([, cx, cz, rx, rz]) =>
    ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 <= 1);
  return district ? districtPoint(district[0], x, z) : [x,z];
}
