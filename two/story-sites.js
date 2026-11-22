import { groundHeight, terrainHeight } from './terrain.js';
import { COURT } from './retreat-layout.js';
import { GATE_STONE, RASHOMON } from './kyo-layout.js';
import { KIYOMIZU_BELL } from './kiyomizu-layout.js';
import { PALACE_BED, PALACE_LEVELS, palacePoint } from './ryugu-layout.js';

// The origin is at the table's feet, +Z faces the visitor. Keep the interaction
// point on the correct floor even when a second storey occupies the same X/Z.
function site(region, name, x, z, yaw, place = null, feet = terrainHeight(x, z) + .4) {
  return Object.freeze({region, place, name, x, z, yaw, y: groundHeight(x, z, feet)});
}

const hall = palacePoint(3, -23);
const gateFloor = terrainHeight(RASHOMON.x, RASHOMON.z) + GATE_STONE.height + RASHOMON.base;

export const STORY_SITES = Object.freeze([
  site('river', '桜川の渡し場', 1.4, 59.5, .05),
  site('shrine', '笹舟の湯・竹細工の仕事場', -131.5, -129.25, 1.86),
  site('market', '蔵町の市・荷造り場', 18, -58, 1.7),
  site('spring', '峠の旅籠・蒸し場', 159, -130, .09),
  site('terraces', '棚田の米仕事場', 174, 144, .25),
  site('coast', '松原の網仕事場', -183.5, 146, 1.085),
  site('snow', '雪の宿の店先', 695, -1104, 2.35),
  site('autumn', '楓葉の湯・橋大工の仕事場', 329.8, -43.1, 1.4),
  site('moon', '薄野の小寺・供え台', -67, 289.25, -.34),
  site('dawn', '初日の出の浦・餅つき場', 300.5, 173.7, 0),
  site('kyo', '京の米屋・中央の蔵', 191, -869, Math.PI / 2),
  site('peach', '桃林の月門', -789.5, -180.1, Math.PI / 2),
  site('ryugu', '竜宮御殿一階・上陸段の板間', hall.x, hall.z, Math.PI / 2, null, PALACE_BED + PALACE_LEVELS[0].h),
  site('todaiji', '大仏殿前の仕事場', 440, 848, 0),
  site('inari', '狐の嫁入り道の荷置き場', 343, -439.5, -Math.PI / 2),
  site('tsuruga', '敦賀の昆布屋・積み場', 345, -1455, Math.PI),
  site('sakai', '堺の陶器屋・積み場', -197.7, -617, -Math.PI / 2),
  site('kyo', '評定所の白洲', COURT.x + 5, COURT.z + 20, 0, 'court'),
  site('kyo', '大路の茶屋・配膳所', 235.5, -850, Math.PI / 2, 'teahouse'),
  site('kyo', '羅生門の上階', RASHOMON.x - .25, RASHOMON.z - .44, Math.PI / 2, 'rashomon', gateFloor),
  site('kyo', '清水寺の鐘楼前', KIYOMIZU_BELL.x, KIYOMIZU_BELL.z + 5.5, 0, 'bell'),
  site('coast', '松原沖を望む浜', -179, 113, -Math.PI / 2, 'shore'),
  site('snow', '北山越の炭焼き小屋', 448.5, -1064, -1.83, 'charcoal'),
  site('peach', '桃山の団子茶屋・旅人の休み場', -362.5, -120.6, .3754, 'road-tea'),
]);

const sites = new Map(STORY_SITES.map(s => [s.region + '/' + (s.place || ''), s]));
export function storySite(regionId, place) {
  return sites.get(regionId + '/' + (place || '')) ?? sites.get(regionId + '/');
}
