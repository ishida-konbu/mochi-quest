// Conversation identities for people drawn by the scenery systems. Keep the
// original itineraries and curfews, and never add these IDs to delivery saves.
import { DISTRICTS } from './geography.js';
import { groundHeight, roadSurfaceHeight, terrainHeight, wrapDelta } from './terrain.js';
import { TOWNSFOLK, cityWalkerPose, makeCityWalkers } from './city-walkers.js';
import { kyoClock, kyoNight } from './kyo-layout.js';
import { STREET_BEATS, streetWatchPose } from './street-watch-layout.js';
import { watchPose } from './court-patrol.js';
import { COURT } from './retreat-layout.js';
import { KIYOMIZU } from './kiyomizu-layout.js';
import { TEMPLE_MONKS, templeMonkPose } from './temple-duties.js';
import { WEDDING_SITES, WEDDING_ROLES, weddingWalkerPose } from './pilgrimage-layout.js';
import { QUAY_MERCHANTS } from './seaport-layout.js';
import { MERCHANT_ROUTES, ROAD_MERCHANTS, roadMerchantPose } from './road-merchant-routes.js';

const traders = ['籠を携えた市女餅', '風呂敷包みの荷商い餅', '薬箱を背負った薬売り餅'];
const weddingNames = {lantern:'提灯持ち',groom:'花婿',bride:'花嫁',parasol:'傘持ち',flute:'笛吹き'};
const closeEnough = (p, q, width, depth = width) =>
  Math.abs(wrapDelta(p.x-q.x)) <= width && Math.abs(wrapDelta(p.z-q.z)) <= depth;

export function createTravellerTalk() {
  const routes = MERCHANT_ROUTES.map(route => ({
    route, walkers: ROAD_MERCHANTS.map((actor,i) => ({actor,i})).filter(({actor}) => actor.route === route)
  }));
  let cityWalkers;
  return ({player, time, regionId}) => {
    const contacts = [];
    function offer(id,label,pose,habitat,role,species = 'mochi',floor = terrainHeight) {
      if (!closeEnough(player, pose, 3)) return;
      contacts.push({legacyId:'traveller-'+id, label, species, entity:{type:species,habitat,role},
        x:pose.x,z:pose.z,y:pose.y ?? floor(pose.x,pose.z)});
    }
    if (closeEnough(player,DISTRICTS.kyo,113,99)) {
      cityWalkers ??= makeCityWalkers();
      const night = kyoNight(time,player);
      const clock = kyoClock(time,player);
      for (const [i,actor] of cityWalkers.entries()) {
        if (night > actor.curfew) continue;
        const pose = cityWalkerPose(actor,time,player,{});
        offer('city-'+i,TOWNSFOLK[actor.kind],pose,'kyo',actor.kind===3?'porter':'wander','mochi',roadSurfaceHeight);
      }
      for (const [i,beat] of STREET_BEATS.entries()) {
        offer('street-watch-'+i,beat.name+'の衛士',streetWatchPose(clock,beat,{}),'kyo','watch');
      }
      if (closeEnough(player,COURT,35)) {
        for (let i=0;i<2;i++) {
          const pose=watchPose(clock,i);
          pose.x+=COURT.x; pose.z+=COURT.z;
          offer('court-watch-'+i,'評定所の衛士',pose,'kyo','watch','mochi',
            (x,z)=>groundHeight(x,z,terrainHeight(COURT.x,COURT.z)+1.09));
        }
      }
    }
    if (closeEnough(player,KIYOMIZU,19,31)) {
      for (const monk of TEMPLE_MONKS)
        offer('monk-'+monk.duty,monk.name,templeMonkPose(monk,time,{}),regionId,monk.duty);
    }
    for (const [i,station] of QUAY_MERCHANTS.entries())
      offer('quay-'+i,station.name,station,regionId,'porter');
    for (const {route, walkers} of routes) {
      const {west,east,north,south}=route.bounds, pad=route.lane+3;
      if (player.x < west-pad || player.x > east+pad || player.z < north-pad || player.z > south+pad) continue;
      for (const {actor,i} of walkers)
        offer('merchant-'+i,traders[actor.costume-2],roadMerchantPose(actor,time),regionId,'porter','mochi',groundHeight);
    }
    for (const [i,site] of WEDDING_SITES.entries()) {
      if (!closeEnough(player,site,site.rx+4,site.rz+4)) continue;
      for (const [j,role] of WEDDING_ROLES.entries()) {
        if (i===1 && role==='bride') continue; // 葛葉 already has the named route.
        const label=(i===1?'婚礼の':'稽古中の')+weddingNames[role];
        offer('wedding-'+i+'-'+role,label,weddingWalkerPose(i,j,time),'inari',role,'fox');
      }
    }
    return contacts;
  };
}
