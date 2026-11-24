import { BUILDINGS, REGIONS, regionAt, terrainHeight, wrapDelta } from './terrain.js';
import { CHAYA_SITES, CHAYA_SEAT } from './wayside-hut-layout.js';
import { clearHandReach } from './living-sites.js';
import { sitePoint } from './retreat-layout.js';

// Waypoints point to open footing in front of a bench or an inn threshold.
// Keep the old tea-service interaction on the bench itself.
function restStop(id, name, building, u, v, floor, radius) {
  const [x, z] = sitePoint(building, u, v);
  return { id, name, regionId: REGIONS[regionAt(x, z)].id, x, z, y: floor, radius };
}

const benches = CHAYA_SITES.map(site => restStop('bench-' + site.x + '-' + site.z,
  site.name, site, CHAYA_SEAT.x, CHAYA_SEAT.z + .95, terrainHeight(site.x, site.z), 2.2));
const inns = BUILDINGS.filter(b => b.kind === 'inn' && (!b.craft || b.craft === 'lodge')).map(b => {
  const region = REGIONS[regionAt(b.x, b.z)];
  const name = region.id === 'kyo' ? (b.x < region.x ? '西の旅籠' : '東の旅籠') : region.name + 'の宿';
  return restStop('inn-' + b.x + '-' + b.z, name, b, 0, b.d / 2 + .85, b.y, 2);
});
export const REST_SITES = [...benches, ...inns].filter(site => !['peach', 'ryugu'].includes(site.regionId));

export function nearbyRestSite(player) {
  if (!player.grounded || player.mount || player.vessel || player.skiff || player.activity ||
      player.h > .12 || player.inWater || player.diveDepth > 0) return null;
  return REST_SITES.find(site =>
    Math.hypot(wrapDelta(player.x - site.x), wrapDelta(player.z - site.z)) <= site.radius &&
    Math.abs(player.y - site.y) <= .85 && clearHandReach(player,site)) ?? null;
}
