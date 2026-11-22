// The first ten sights retain their surveyed coordinates. The five outer districts
// keep their streets and doorways at walking scale while their centres move apart.
export const FIFTH_EDITION_CENTRES = Object.freeze({
  kyo:     { x: 120, z: -424 },
  peach:   { x: -390, z: -91 },
  ryugu:   { x: -331, z: 135 },
  todaiji: { x: 215, z: 425 },
  inari:   { x: -153, z: -535 },
});

// The original Fushimi survey supplies the local metres of all gates and weddings.
export const DISTRICT_SHIFT = {...FIFTH_EDITION_CENTRES, inari:{x:558,z:-54}};
export function districtOffset(id) { return DISTRICT_SHIFT[id]; }
export function districtPoint(id, x, z) {
  const shift = districtOffset(id);
  return [x + shift.x, z + shift.z];
}

export const DISTRICTS = Object.fromEntries(Object.entries(DISTRICT_SHIFT).map(([id, shift]) =>
  [id, { x: FIFTH_EDITION_CENTRES[id].x+shift.x, z: FIFTH_EDITION_CENTRES[id].z+shift.z }]));

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

// Version six placed the shrine north-west of the capital. Carry only its
// old mountain and approaches (not travellers in the adjoining capital).
export function relocateSixthEdition(x,z) {
  const dx=x+306,dz=z+1070;
  if (Math.hypot((dx+71)/188,(dz-77)/133) <= 1 || Math.hypot(dx,dz)<36)
    return [DISTRICTS.inari.x+dx,DISTRICTS.inari.z+dz];
  return [x,z];
}
