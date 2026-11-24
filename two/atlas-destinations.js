import { BUILD_MODULES } from './living-build-state.js';
import { LIVING_SITES } from './living-sites.js';
import { REST_SITES } from './rest-sites.js';
import { REGIONS, SNOW_SPRING, regionAt } from './terrain.js';
import { WAYSIDE_SITES } from './wayside-hut-layout.js';
import { KIYOMIZU } from './kiyomizu-layout.js';
import { COURT } from './retreat-layout.js';
import { HIGASHIYAMA, KITAYAMA } from './higashiyama.js';
import { MOUNTAIN_STREAMS } from './mountain-streams.js';

export const sceneNumbers = ['壱','弐','参','肆','伍','陸','漆','捌','玖','拾','十一','十二','十三','十四','十五','十六','十七'];
const nearest = ({x,z}) => REGIONS[regionAt(x,z)];
const waysideTypes = {chaya:['茶','茶屋'], fisher:['漁','漁師小屋'], charcoal:['炭','炭焼き小屋']};

export function atlasDestinations(state) {
  const places = REGIONS.map(({id,name,x,z}, index) => ({
    id, name, x, z, kind:'region', region:id, glyph:sceneNumbers[index], category:'名所',
  }));
  for (const object of state.objects) {
    const {id,x,z,y} = object;
    if (object.type === 'port') {
      const region = nearest(object);
      places.push({id, x, z, y, kind:'port', region:region.id, name:region.name+'の自転車ポート',
        glyph:'P', category:'自転車ポート', object});
    } else if (object.type === 'onsen') {
      const site = object.retreat || (object.grand && SNOW_SPRING);
      if (site) {
        places.push({id,x,z,y,kind:'bath',region:site.region,name:site.name,glyph:site.rank === 'main' ? '♨' : '湯',category:site.rank === 'main' ? '主湯' : '脇湯'});
      } else if (object.goemon) {
        places.push({id,x,z,y,kind:'bath',region:nearest(object).id,name:object.goemon.name+'の五右衛門風呂',glyph:'湯',category:'五右衛門風呂'});
      }
    }
  }
  for (const site of WAYSIDE_SITES) {
    const [glyph,category] = waysideTypes[site.kind];
    places.push({id:'wayside-'+(site.id || site.name),x:site.x,z:site.z,kind:site.kind,region:nearest(site).id,name:site.name,glyph,category});
  }
  const landmarks = [
    ['kiyomizu', KIYOMIZU, KIYOMIZU.name, '清', '寺院'], ['court', COURT, COURT.name, '裁', '評定所'],
    ['kitayama', KITAYAMA, '北山の送り火', '大', '送り火'], ['higashiyama', HIGASHIYAMA, '東山の送り火', '福', '送り火'],
    ...MOUNTAIN_STREAMS.map(s => ['fall-'+s.id,s.fall.toe,s.name,'滝','滝']),
  ];
  for (const [id,site,name,glyph,category] of landmarks) {
    places.push({id:'landmark-'+id,x:site.x,z:site.z,kind:'landmark',region:nearest(site).id,name,glyph,category});
  }
  const livingTypes = { workshop:['臼','公共工房'], shop:['市','食材の店'], gather:['採','採集'] };
  for (const site of LIVING_SITES) {
    const [glyph,category] = livingTypes[site.kind];
    places.push({...site,glyph,category});
  }
  for (const {id,name,x,y,z,regionId} of REST_SITES) {
    places.push({id,name:id.startsWith('bench-') ? name+'の腰掛け' : name,x,y,z,region:regionId,kind:'rest',glyph:'休',category:'休み処'});
  }
  for (const s of state.livingWorld?.structures ?? []) {
    if (s.parentId || s.kind==='fence') continue;
    const glyph={stand:'商',camp:'営',chest:'櫃',floor:'床'}[s.kind];
    places.push({id:s.id,x:s.x,y:s.y,z:s.z,kind:'homestead',region:s.regionId,
      name:BUILD_MODULES[s.kind].name,glyph,category:'自分の建物'});
  }
  return places;
}
