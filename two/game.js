import { createLivingWorld, validLivingWorld, JOURNEY_VERSION } from './living-save.js';
import { SKIFFS, skiffPose, skiffDeck, skiffApproaches } from './skiff-travel.js';
import { LIVING_SITES, nearLivingSite } from './living-sites.js';
import { deliveryReward, gatherResource } from './living-resources.js';
import { createStoryCollisions } from './story-collisions.js';
import { createNotebook } from './mochiyori-progress.js';
import { onSuzuriLand,okaFront } from './suzuri-basin-plan.js';
import { tideRise } from './pilgrim-bathing-plan.js';
import { SAZAE_SPRING } from './ryugu-shell-bath.js';
import { WAYSIDE_HUTS,KETTLE,CHAYA_SITES,CHAYA_SEAT } from './wayside-hut-layout.js';
import { SUZURI_COURT,suzuriParcel } from './kyo-bath-layout.js';
import { formerMatsuhamaSeat } from './village-bath-courses.js';
import { bathPools,bathStations,bathLocal,poolAt,stationAt,poolRadius,stationRadius } from './bath-places.js';
import { SOAK_SECONDS, floatBerth, bathingPose } from './bathing.js';
import { planTurtleLeg } from './turtle-trail.js';
import { BELL_FIRST, BELL_INTERVAL, noticeBellDistance, templeBellHour } from './kiyomizu-bell.js';
import { KIYOMIZU, onMountOtowa, kiyomizuClearing } from './kiyomizu-layout.js';
import { createPickupContacts } from './pickup-contacts.js';
import { createAmbientContacts } from './ambient-contacts.js';
import { createVoyage,restoreHarbourTraveller } from './ocean-voyage.js';
import { fromHokora } from './lake-hokora-layout.js';
import { lakeRadius, isletRadius, snowPoint } from './snow-country.js';
import { relocateLegacyPosition, relocateSixthEdition } from './geography.js';
import { COURT, RETREATS, bathRadius, wetRetreatRadius, sitePoint } from './retreat-layout.js';
import { SEAPORTS,relocateOldQuay } from './seaport-layout.js';
import { pairRiverTravellers, updateHareRider } from './scroll-riders.js';
import { RASHOMON, GATE_STONE, GATE_WING, GATE_LEAF, KYO_FOOD, KYO_ANIMALS, KYO_DAY_SECONDS } from './kyo-layout.js';
import { SECONDS_PER_MINUTE, legacyWorldMinute, lightAtMinute, waitTargetMinute } from './world-clock.js';
import { nearbyRestSite } from './rest-sites.js';
import { makeScrollResidents, updateScrollResident } from './scroll-encounters.js';
import { SCROLL_FAUNA, makeScrollFauna, moveScrollFauna } from './scroll-fauna.js';
import { SEA_SPECIES, retiredSeaIds, makeRyuguResidents, updateRyuguResident } from './ryugu-residents.js';
import { RYUGU, PALACE_BED, palacePoint, palaceInteriorAt, boardingHeightAt } from './ryugu-layout.js';
import { BUILDINGS, ORIGINAL_REGIONS, terrainHeight, terrainContactHeight, swimSurfaceAt, canDiveAt, groundHeight, landscapeFloor, constrainMove, canOccupy, staticVolumeAt, overheadHeight, canLand, REGIONS, regionAt, BOUND, waterDepth, wrapDelta, wrapCoord, springLevel, waterSurfaceAt, SNOW_SPRING, TSUKIMI, springRadius, seasonAt } from './terrain.js';

import { POUNDING, POUNDING_CREW } from './festival.js';
import { KAEDE_WATER_HARE_HOME, updateWaterHare } from './kaede-water-hare.js';
import { prepareVillageRoutes, animalRadius, openGround, walkCircuit } from './village-paths.js';
import { procession } from './procession.js';
import { walkingScore } from './animal-motion.js';
import { legendary } from './legend-flight.js';
import { SPECIES, wildlifeHomes, moveWildlife, sweepResident } from './bestiary.js';

const MAX_VITAL = 100;
const RISE_GRAVITY = 20;
const FALL_GRAVITY = 27;
const JUMP_SPEED = 11.7;
const STRETCH_SPEED = 16.5;
const FLIGHT_CLIMB = 5.6;
const KAGAMI_BEAT_DURATION = .36;
const JUMP_BUFFER = .12;
const LEDGE_GRACE = .085;
const CEILING = 180; // Metres above the local floor, including mountain summits.
const SPEED = { foot: 6.4, dango: 23.6, turtle: 105, bike: 45.9, flight: 32, kagami: 19.2 };
// Seconds to build from walking pace to cruising speed on open ground.
const RUN_UP = { dango: 1.8, bike: 3.2, flight: 2.2, turtle: 3.4 };
const SWIFT_FACTOR = 1.42;
const MAX_TRAVEL_SPEED = SPEED.turtle * SWIFT_FACTOR + .01;
// Metres along the local forward axis, radius, lower edge and upper edge.
// The open-ended span is the rider. The wheel ends and muzzle stay low under eaves.
const RIDE_PARTS = {
  bike: [[-.10,.42,.90,null],[0,.22,.19,.94],[.42,.32,.74,1.12],
    [-.62,.24,0,.76],[-.89,.15,.12,.65],[.62,.24,0,.96],[.89,.15,.12,.65]],
  turtle: [[-.09,.42,1.04,null],[0,.92,0,1.26],[-.69,.60,.10,1.13],[.82,.36,.32,1.02],[1.29,.31,.55,1.13]],
};
const FOOT_PARTS = [[0,0,0,null]];
const STAMP_RADIUS = 6;
const SEASONAL_STOPS = {
  snow: ['onsen','sake'], autumn: ['manga','haramaki'], moon: ['sake','manga'], dawn: ['ramen','haramaki']
};
const MODE_COST = { normal: 0, dango: 7, kusa: 6, kinako: 6, habutae: 10, kagami: 0 };
const MODE_DRAIN = { normal: 0, dango: 2.1, kusa: 1.5, kinako: 1.75, habutae: 2.75, kagami: 0 };
const MODE_NAME = { normal: 'ふつうのお餅', dango: '団子モード', kusa: '草餅', kinako: 'きなこ餅', habutae: '羽二重餅', kagami: '鏡餅' };
export const canUseModeOnMount = mode => mode === 'kusa' || mode === 'normal';
const NOTICE_FORWARD = [0], NOTICE_FAN = [-.28, 0, .28];
const ring = count => Array.from({ length: count }, (_, i) => i * (Math.PI * 2 / count));
const EIGHT_NOTICES = ring(8), FULL_KINAKO = ring(24);
const BUFF_TIME = { warm: 20, swift: 24, drunk: 18, full: 29, wrap: 24 };
const PICKUP_ACTION = {
  manga: { activity: 'read', duration: 2.3, label: '漫画を読む' },
  sake: { activity: 'drink', duration: 2.2, label: '日本酒を飲む' },
  ramen: { activity: 'eat', duration: 2.8, label: '背脂ラーメンを食べる' },
  kyoTea: { activity: 'tea', duration: 2.2, label: '宇治茶をいただく' },
  mitarashi: { activity: 'mitarashi', duration: 2.5, label: 'みたらし団子を食べる' },
  tsukimi: { activity: 'tsukimi', duration: 2.6, label: '月見団子を食べる' },
  onsen: { activity: 'bath', duration: SOAK_SECONDS, label: '温泉に入る' },
  haramaki: { label: '腹巻きを巻く' }
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const distance = (a, b) => Math.hypot(wrapDelta(a.x - b.x), wrapDelta(a.z - b.z));

// Editions through v11 saved cooldowns by position and used that position in
// each landmark ID. Keep the retired pass-side pool and kettle slots vacant.
const RETIRED_BATH_SLOTS = new Set([58, 64]);

function makeWorld() {
  const objects = [];
  const inventory = [];
  const npcs = [];
  function object(type, x, z, heading = 0, namedId) {
    if (!namedId && RETIRED_BATH_SLOTS.has(inventory.length)) inventory.push(null);
    const id = namedId ?? type + '-' + inventory.length;
    const landmark = { id, type, x, z, y: groundHeight(x, z), heading, active: true, cooldown: 0 };
    if (!namedId) inventory.push(landmark);
    if (type === 'port') landmark.bikes = 2;
    objects.push(landmark);
    return landmark;
  }
  const retiredVillageSites=[];
  function placeSpring(site) {
    const pool=object('onsen',site.x,site.z,site.yaw,site.regional ? 'onsen-'+site.id : undefined);
    pool.y=springLevel(site)-.52;
    pool.retreat=site; pool.rank=site.rank; pool.region=site.region;
  }
  function npc(type, role, x, z, phase, side = 1) {
    const heading = role === 'sumo' ? side * Math.PI / 2 : phase;
    npcs.push({
      id: type + '-' + npcs.length, type, role, x, z, y: groundHeight(x, z), homeX: x, homeZ: z,
      phase, side, heading, speed: 0, flash: 0, mounted: false
    });
  }
  ORIGINAL_REGIONS.forEach(({ id, x, z, port }, i) => {
    if (SEASONAL_STOPS[id]) {
      const [first, second] = SEASONAL_STOPS[id];
      object(first, x - 13, z - 9);
      if(first==='onsen')retiredVillageSites.push(objects.at(-1));
      if(id==='dawn') object(second,300,184.8);
      else object(second,x+6,z+14);
      object('port', ...(port || [x+12,z+5]));
      if (id==='dawn') {
        const c=Math.cos(POUNDING.yaw), s=Math.sin(POUNDING.yaw);
        for (const member of POUNDING_CREW) {
          npc(member.type, member.role, POUNDING.x+c*member.u+s*member.v, POUNDING.z-s*member.u+c*member.v, 0);
          npcs.at(-1).atMortar=true;
          npcs.at(-1).y=groundHeight(POUNDING.x,POUNDING.z)+.012;
        }
      } else {
        if(id==='autumn') {
          const {x:homeX,z:homeZ}=KAEDE_WATER_HARE_HOME;
          npc('rabbit','wander',homeX,homeZ,i+1.4);
          npcs.at(-1).waterHare=true;
        } else {
          npc('rabbit','wander',x-7,z-12,i+1.4);
        }
        npc('frog', 'porter', x - 19, z + 5, i + 2.8);
      }
      return;
    }
    const river = id === 'river';
    const places = river
      ? [[-10,44], [8,53], [-15,68], [14,37], [-18,49], [12,66]]
      : [[-13,-9], [6,14], [15,-11], [-9,15], [-17,4], [12,5]].map(([dx,dz]) => [x+dx,z+dz]);
    ['onsen','manga','sake','ramen','haramaki','port'].forEach((type, k) => {
      // Leave the bather visible through the open side of each noren.
      object(type, places[k][0], places[k][1], type === 'onsen' ? 0 : (i + k) * .47);
      if(type==='onsen')retiredVillageSites.push(objects.at(-1));
    });
    npc('rabbit', 'porter', x-4, river ? 55 : z+5, i * .8 + .2);
    npc('frog', 'sumo', x+4.1, river ? 52 : z-7, i, 1);
    npc(i % 2 ? 'rabbit' : 'frog', 'sumo', x+5.9, river ? 52 : z-7, i, -1);
    npc('rabbit', 'wander', x-7, river ? 44 : z-12, i + 1.4);
    npc('frog', 'wander', x+10, river ? 40 : z-15, i + .8);
    npc('frog', 'porter', x-19, river ? 61 : z+5, i + 2.8);
  });
  npc('turtle', 'wander', -14, 54, 0);
  object('onsen',SNOW_SPRING.x,SNOW_SPRING.z);
  Object.assign(objects.at(-1),{grand:true,site:SNOW_SPRING,y:SNOW_SPRING.level-.61,rank:SNOW_SPRING.rank,region:SNOW_SPRING.region});
  object('tsukimi',TSUKIMI.x,TSUKIMI.z,TSUKIMI.yaw);
  for (const visitor of procession()) {
    const {type,role,x,z,phase} = visitor;
    npc(type,role,x,z,phase);
    Object.assign(npcs.at(-1), visitor, { heading:visitor.facing });
  }
  for (const visitor of wildlifeHomes([...objects,...npcs])) {
    const {type,role,x,z,phase}=visitor;
    npc(type,role,x,z,phase);
    Object.assign(npcs.at(-1),visitor);
  }
  // The old village tubs were landmarks in the original population survey.
  // Reserve their inventory slots for existing journeys after casting the residents.
  for(const site of retiredVillageSites){
    inventory[inventory.indexOf(site)]=null;
    objects.splice(objects.indexOf(site),1);
  }
  // Move the reading table after casting the historic village and wildlife surveys.
  // Its inventory slot and the creatures drawn around the old shop stay stable.
  const readingTable=objects.find(o=>o.id==='manga-39');
  readingTable.x=299.5;
  readingTable.z=-112;
  readingTable.y=groundHeight(readingTable.x,readingTable.z);
  // New entries follow both historical inventories so imported item and recipient IDs stay stable.
  for (const r of REGIONS.slice(ORIGINAL_REGIONS.length,15)) {
    if (r.id !== 'ryugu') {
      const [x,z]=r.port || [r.x+12,r.z+5];
      object('port',x,z);
      objects.at(-1).region = r.id;
    }
  }
  for (const stop of KYO_FOOD) object(stop.type, stop.x, stop.z, stop.yaw);
  for (const resident of KYO_ANIMALS) {
    const { type, role, x, z, phase } = resident;
    npc(type,role,x,z,phase);
  }
  // Append to the item inventory after every legacy port and shop counter.
  for(const site of RETREATS)if(!site.regional)placeSpring(site);
  for(const harbour of SEAPORTS){
    object('port',...harbour.port);
    objects.at(-1).region=harbour.id;
  }
  for(const hut of WAYSIDE_HUTS){
    if(!hut.bath)continue;
    const slot=hut.inventorySlot;
    const kettle=object('onsen',hut.bath.x,hut.bath.z,hut.yaw,'onsen-'+(slot ?? hut.id));
    kettle.goemon=hut;
    if(slot!=null){
      while(inventory.length<=slot)inventory.push(null);
      inventory[slot]=kettle;
    }
  }
  for(const site of RETREATS)if(site.regional)placeSpring(site);
  const shell=object('onsen',SAZAE_SPRING.x,SAZAE_SPRING.z,SAZAE_SPRING.yaw,'onsen-'+SAZAE_SPRING.id);
  Object.assign(shell,{y:SAZAE_SPRING.level,retreat:SAZAE_SPRING,rank:SAZAE_SPRING.rank,region:SAZAE_SPRING.region});
  prepareVillageRoutes(npcs,objects);
  npcs.push(...makeScrollResidents(), ...makeRyuguResidents(), ...makeScrollFauna());
  return { objects, npcs, inventory };
}

// Reopen older journals in the same room or yard of the relocated court.
// Its southern boundary stops at the pavement so people on the avenue stay put.
function restoreKyotoLot(p,edition) {
  if(edition!==6 && edition!==7)return p;
  const older=edition===6;
  const oldX=older?162:155,oldZ=older?-872:-882;
  const datum=older?4.06465:5.09111;
  const u=p.x-oldX,v=p.z-oldZ,front=older?7:10;
  const side=v<front?(older?14.5:20.5):(older?13.3:18.9);
  if(Math.abs(u)<=side && v>=-front && v<=(older?20.5:30.5) && p.y<=datum+16)
    return {...p,x:COURT.x+u,z:COURT.z+v,y:p.y+terrainHeight(COURT.x,COURT.z)-datum};
  if(older)return p;
  // Two workshops moved across their lane. Carry their upper floors and
  // stairs with them, including the visitor's facing direction.
  for(const [craft,x,base] of [['rush',151.5,7.05777],['lacquer',170,5.36271]]){
    const dx=p.x-x,dz=p.z+904.06;
    if(Math.abs(dx)>3.5 || Math.abs(dz)>3.1 || p.y>base+9.5)continue;
    const shop=BUILDINGS.find(b=>b.kind==='wardShop' && b.craft===craft && b.x===x && b.z===-915.5);
    if(shop && Math.abs(dx)<=shop.w/2 && Math.abs(dz)<=shop.d/2){
      const heading=Math.atan2(-Math.sin(p.heading),-Math.cos(p.heading));
      return {...p,x:shop.x-dx,z:shop.z-dz,y:p.y+shop.y-base,heading,vx:-p.vx,vz:-p.vz};
    }
  }
  return p;
}

// Keep travellers on their original gallery, wooden stair or roof when the
// masonry is inserted underneath. New street-level floors are resolved by
// groundHeight during normal restore, including the stone treads.
function restoreGateVisitor(p,edition) {
  if(edition<7 || edition>=10 || p.mode==='kusa')return p;
  const u=p.x-RASHOMON.x,v=p.z-RASHOMON.z,wing=GATE_WING;
  if(Math.abs(u)>wing.x+wing.w/2+.35 || Math.abs(v)>5)return p;
  const ground=terrainHeight(RASHOMON.x,RASHOMON.z),feet=p.y-p.h-ground;
  const hall=Math.abs(u)<=9.80 && Math.abs(v)<=4.55;
  const gallery=u>=4.13 && u<=10.47 && Math.abs(v+4.04)<=.80;
  const steps=u>=8.56 && u<=10.48 && v>=-4.06 && v<=4.21;
  if(feet>.08 && (hall || gallery || steps))p={...p,y:p.y+GATE_STONE.height};
  // The new plaster wings and closed gate leaves both occupy formerly passable ground.
  for(const [wall,top] of [[wing,wing.eave],[GATE_LEAF,GATE_LEAF.y+GATE_LEAF.h/2]]){
    if(Math.abs(Math.abs(u)-wall.x)<=wall.w/2+.28 && Math.abs(v-wall.z)<=wall.d/2+.28 &&
       p.y<ground+GATE_STONE.height+top)
      return {...p,z:RASHOMON.z+wall.z+(v<wall.z?-1:1)*(wall.d/2+.34)};
  }
  return p;
}

// Walkers, bathers and roof climbers travel with their old neighbourhood.
function restoreSnowVisitor(p) {
  const dx=p.x-36.08,dz=p.z+328.20;
  if(Math.hypot(dx,dz)<6) {
    const pool=RETREATS.find(s=>s.id==='snow-nagoriyuki');
    // Carry the visitor's local position and bearing around the rotated pool.
    const angle=pool.yaw-4.0083, c=Math.cos(angle), s=Math.sin(angle);
    const x=pool.x+dx*c+dz*s, z=pool.z-dx*s+dz*c;
    if(p.y===undefined)return {x,z};
    return {...p,x,z,y:p.y+waterSurfaceAt(pool.x,pool.z)-27.5800905,
      vx:p.vx*c+p.vz*s,vz:p.vz*c-p.vx*s,heading:Math.atan2(Math.sin(p.heading+angle),Math.cos(p.heading+angle))};
  }
  // The footprint follows the old streets, pagoda yard and eastern bath.
  if(p.z < -338 || p.z > -248 || p.x < -123 || p.x > -15)return p;
  const [x,z]=snowPoint(p.x,p.z);
  if(p.y===undefined)return {x,z};
  const building=BUILDINGS.find(b=>b.oldY!==undefined &&
    Math.abs((x-b.x)*b.cos-(z-b.z)*b.sin)<b.w*.5+2.1 &&
    Math.abs((x-b.x)*b.sin+(z-b.z)*b.cos)<b.d*.5+2.1);
  const y=building ? p.y+building.y-building.oldY : groundHeight(x,z)+p.h;
  return {...p,x,z,y};
}

export function createGame(snapshot = null) {
  const { objects, npcs, inventory } = makeWorld();
  const riverRider = pairRiverTravellers(npcs);
  const turtle = npcs.find(n => n.type === 'turtle');
  // A tea service is always available. Only portable items have cooldowns in a journey save.
  const teaSeats=CHAYA_SITES.map(chaya=>{
    const [x,z]=sitePoint(chaya,CHAYA_SEAT.x,CHAYA_SEAT.z);
    return {type:'chaya',active:true,chaya,x,z,y:terrainHeight(chaya.x,chaya.z)+CHAYA_SEAT.top};
  });
  const interactables=[...objects,turtle,...teaSeats];
  const player = {
    x: 0, z: 62, y: groundHeight(0,62), h: 0, vx: 0, vz: 0, vy: 0, speed: 0, heading: 0,
    grounded: true, hp: MAX_VITAL, mp: MAX_VITAL, mode: 'normal', mount: null, skiff: null, activity: null,
    activityTime: 0, idleTime: 0, airStretch: 0, diveDepth: 0, inWater: false, night: false, kyoClockOffset: 0, stretch: 0, landing: 0, impact: 0, throwTime: 0, invulnerable: 0,
    buffs: { warm: 0, swift: 0, drunk: 0, full: 0, wrap: 0 }
  };
  const region = REGIONS[regionAt(player.x,player.z)];
  const state = {
    time: 0, livingWorld: createLivingWorld(), player, npcs, nearbyNpcs: [], objects, shots: [], events: [], score: 0, bellStrike: null,
    delivered: new Set(), recipientTotal:npcs.length, kagamiUnlocked:false,
    region: region.name, regionId: region.id, visited: [region.id]
  };
  const climate = {};
  // Render and contact code already share this player view. Keep one source
  // of time and leave this derived clock out of the saved player fields.
  Object.defineProperty(player, 'worldMinute', {get: () => state.livingWorld.worldMinute});
  const voyage = createVoyage();
  // The ship's local coordinates stay fixed while a standing passenger is carried.
  Object.defineProperty(player,'vessel',{get:() => voyage.passenger(player)});
  let passengerBoat=null, passengerPose=null;
  Object.defineProperty(player,'skiffPose',{get() {
    return passengerPose;
  }});
  let heldJump = false;
  let flapRemaining = 0;
  // The render rig reads this transient stroke without adding it to journey saves.
  Object.defineProperty(player, 'flapBeat', { get: () => flapRemaining / KAGAMI_BEAT_DURATION });
  let bufferedJump = 0;
  let ledgeGrace = 0;
  let lastBath = null;
  let lastPlace=null,berth=null;
  function waterDatum(target){
    return target.retreat?springLevel(target.retreat):target.grand?SNOW_SPRING.level:waterSurfaceAt(target.x,target.z);
  }
  Object.defineProperty(player, 'bathPose', {get() {
    if(player.activity!=='bath' || !lastBath)return;
    berth ??= floatBerth(player,lastBath,springRadius,lastPlace,waterDatum(lastBath));
    return bathingPose(player,berth,state.time);
  }});
  // Old journals remember the bath ID. Rebuild its waterline from the site
  // so the first frame of a resumed soak uses the same level as the mesh.
  Object.defineProperty(player, 'bathWaterY', {get() {
    if(player.activity!=='bath')return;
    if(lastBath)return waterDatum(lastBath)+(lastPlace?.y??0)+tideRise(lastBath.retreat,state.time);
    return waterSurfaceAt(player.x,player.z);
  }});
  let shotId = 0;
  let throwCooldown = 0;
  let turtlePause = 0;
  let turtleLeg = 0;
  let turtlePath = null, recoverRider = false, retryRecoveryAt=0;
  const ambientContact = createAmbientContacts(), pickupContact=createPickupContacts(objects);
  const storyCollisions = createStoryCollisions();
  const noticeContact = {};
  function propOverlap(x,z,y,height,radius,contact,ignoreSkiff=null) {
    return Math.max(storyCollisions.penetration(x,z,y,height,radius,contact),
      pickupContact(x,z,y,height,radius,state.time),Number(ambientContact(x,z,y,height,radius,state.time,player,true,ignoreSkiff)));
  }
  let bumped = null;
  const contactNormal={}, hitNormal={}, fromBody={};
  const bodyRadius = () => player.mount==='turtle' ? .92 : player.mount==='bike' ? .42 : player.buffs.full>0 ? .33 : .26;
  const bodyHeight = () => (1.66+player.airStretch*1.07)*(player.buffs.full>0?1.28:1)
    +(player.mount==='turtle'?1.04:player.mount==='bike'?.90:0);

  function shipFits(x,z,y,radius,height) {
    const q=voyage.sample(x,z,y,radius,height);
    return !q || q.solid<=y+.34 && q.ceiling>=y+height && q.floor<=y+.36;
  }
  function turtleFits(x,z,y,radius,height) {
    return canOccupy(x,z,y,radius,height) && shipFits(x,z,y,radius,height)
      && !propOverlap(x,z,y,height,radius);
  }
  function turtleFooting(x,z,feet,margin=0) {
    const floor=Math.max(groundHeight(x,z,feet),voyage.sample(x,z,feet)?.floor ?? -Infinity);
    if(Math.abs(floor-feet)>.36 || !turtleFits(x,z,floor,animalRadius(turtle)+margin,1.15))return NaN;
    return floor;
  }
  const footRadius = () => player.buffs.full>0 ? .33 : .26;
  function rideFits(x,z,y,heading,tall,mount=player.mount) {
    const s=Math.sin(heading),c=Math.cos(heading);
    for(const [offset,width,low,top] of RIDE_PARTS[mount] || FOOT_PARTS) {
      const px=wrapCoord(x+offset*s),pz=wrapCoord(z+offset*c),feet=y+low;
      const height=(top ?? tall)-low,radius=width || footRadius();
      if(!canOccupy(px,pz,feet,radius,height) || !shipFits(px,pz,feet,radius,height) ||
          propOverlap(px,pz,feet,height,radius))return false;
      Object.assign(fromBody,{x:px,y:feet+height*.5,z:pz});
      for(const n of state.nearbyNpcs){
        if(n.mounted || n===turtle && mount==='turtle')continue;
        if(sweepResident(n,fromBody,0,0,0,radius,height*.5)<1)return false;
      }
    }
    return true;
  }
  function nearbyFooting(x,z,y,heading,rings,accept) {
    for(let ring=0;ring<=rings;ring++) {
      const count=Math.max(1,Math.ceil(2*Math.PI*ring));
      for(let i=0;i<count;i++) {
        const a=heading+i*2*Math.PI/count, nx=wrapCoord(x+.4*ring*Math.sin(a)),nz=wrapCoord(z+.4*ring*Math.cos(a));
        const floor=Math.max(groundHeight(nx,nz,y),voyage.sample(nx,nz,y)?.floor ?? -Infinity);
        if(Math.abs(floor-y)<=.56 && accept(nx,nz,floor))return {x:nx,z:nz,y:floor};
      }
    }
  }

  function emit(type, data) {
    if (state.events.length >= 160) state.events.shift();
    state.events.push({ type, x: player.x, y: player.y, z: player.z, h: player.h, ...data });
  }
  function say(text) { emit('say', { text }); }
  function message(text) { emit('message', { text }); }
  function sound(name) { emit('sound', { name }); }
  function ringTempleBell(source, time) {
    if (state.bellStrike && time - state.bellStrike.time < .10) return;
    state.bellStrike = { time, source };
    if (source === 'notice') message('三条通知が清水寺の梵鐘を鳴らした。');
  }
  function protectedVitals() { return player.buffs.warm > 0 || player.buffs.wrap > 0; }
  function spendMP(cost) {
    if (player.buffs.full > 0 || protectedVitals()) return true;
    if (player.mp < cost) return false;
    player.mp -= cost;
    return true;
  }
  function gap(target) { return distance(player, target); }
  // false means dry ground outside a station, null means ordinary open water.
  function placeAt(target,leaving=false){
    if(target.goemon)return gap(target)<=KETTLE.widthScale*(leaving?1.65:.79)?null:false;
    const site=target.retreat || target.site;
    if(!site || gap(target)>26)return false;
    const [u,v]=bathLocal(site,player.x,player.z);
    const station=stationAt(site,u,v,leaving?1.08:1);
    if(station)return station;
    const pools=bathPools(site);
    if(pools)return poolAt(pools,u,v,leaving?1.05:.91)??false;
    const inside=target.grand?springRadius(player.x,player.z)<=(leaving?1:.88):
      wetRetreatRadius(site,player.x,player.z)<=(leaving?1.07:.92);
    return inside?null:false;
  }
  function stillAtPlace(target,place){
    const site=target.retreat || target.site;
    if(!site)return placeAt(target,true)!==false;
    const [u,v]=bathLocal(site,player.x,player.z);
    if(place){
      return bathPools(site)?.includes(place)?poolRadius(place,u,v)<=1.05:stationRadius(place,u,v)<=1.08;
    }
    if(bathPools(site))return false;
    return target.grand?springRadius(player.x,player.z)<=1:wetRetreatRadius(site,player.x,player.z)<=1.07;
  }
  function nearest() {
    if (player.activity || !player.grounded) return null;
    if (player.mount === 'turtle') return { target: turtle, label: 'カメから降りる', action: 'dismount', distance: 0 };
    if (passengerBoat) return {target:passengerBoat,label:'小舟から降りる',action:'dismount',distance:0};
    let best=null;
    if (!player.mount) {
      for (const boat of SKIFFS) {
        const pose=skiffPose(boat,state.time);
        if (gap(pose)>boat.length*.5+2.8) continue;
        const seat=skiffDeck(boat,state.time);
        if (Math.abs(seat.y-player.y)>2.1) continue;
        const reach=Math.min(gap(seat),...skiffApproaches(boat,state.time).map(gap));
        if (reach<=1.65 && (!best || reach<best.distance))
          best={target:boat,label:boat.name+'に乗る',action:'interact',distance:reach};
      }
    }
    for (const target of interactables) {
      if (!target.active && target !== turtle) continue;
      let distance = gap(target),place=null;
      if (Math.abs(target.y-player.y)>2.2) continue;
      let label;
      let radius;
      if (target.type === 'port') {
        label = player.mount === 'bike' ? 'ポートに返す' : '電動自転車に乗る';
        if (!target.bikes && !player.mount) continue;
        radius = 3.1;
      } else if (player.mount) {
        continue;
      } else if (target.chaya) {
        const front=(player.x-target.x)*Math.sin(target.chaya.yaw)+(player.z-target.z)*Math.cos(target.chaya.yaw);
        if(front<-.55 || Math.abs(target.y-player.y)>1)continue;
        label='団子とお茶をいただく'; radius=1.85;
      } else if (target.type === 'turtle') {
        label = 'カメに乗る'; radius = 2.8;
      } else if (PICKUP_ACTION[target.type]) {
        label = PICKUP_ACTION[target.type].label;
        radius = 2.2;
        if (target.type === 'onsen') {
          place=placeAt(target);
          if(place===false || (target===lastBath && place===lastPlace))continue;
          if(place){
            const [u,v]=bathLocal(target.retreat||target.site,player.x,player.z);
            distance=Math.hypot(u-place.u,v-place.v);
          }
          radius = Infinity;
          if (target.goemon) label = '五右衛門風呂につかる';
          if (target.rank) label = (target.rank==='main'?'主湯':'脇湯')+'・'+(target.retreat || SNOW_SPRING).name+(place?'・'+place.label:'につかる');
        }
      } else {
        continue;
      }
      if (distance <= radius && (!best || distance < best.distance)) {
        best = { target, place, label, action: player.mount ? 'dismount' : 'interact', distance };
      }
    }
    for (const site of LIVING_SITES) {
      if (!nearLivingSite(player,site)) continue;
      const distance=gap(site);
      if (!best || distance<best.distance) {
        const remaining = (state.livingWorld.nodeReadyAt[site.id] || 0) - Math.floor(player.worldMinute);
        const label = remaining > 0 ? site.name + '（あと' + remaining + '分）' : site.label;
        best={target:{livingSite:site}, label, action:'interact', distance};
      }
    }
    return best;
  }
  function beginActivity(activity, duration) {
    player.activity = activity;
    player.activityTime = duration;
    if (activity !== 'fall') player.vx = player.vz = player.speed = 0;
  }
  function collect(target,facing,place=null) {
    if (target.type === 'onsen') {
      lastBath=target;lastPlace=place;
      berth=null;
      if(Number.isFinite(facing))player.heading=Math.atan2(Math.sin(facing),Math.cos(facing));
      player.h = player.vy = 0;
      player.grounded = true;
      if(place?.action!=='rinse' && place?.action!=='steam')sound('bath');
    } else {
      target.active = false;
      target.cooldown = 65;
      sound('pickup');
    }
    const pickup = PICKUP_ACTION[target.type];
    if (target.type === 'haramaki') {
      player.buffs.wrap = BUFF_TIME.wrap;
      message('腹巻きでぽかぽか。体力とモッチポイントを守る！');
    } else {
      beginActivity(pickup.activity,place?.duration??pickup.duration);
      const lines = { tea: '香ばしいお茶を、両手でひと口。', mitarashi: '炙った団子に、とろりと甘いみたらしのたれ。', tsukimi: '満月を眺めながら、月見団子をひとくち。', bath: 'ほかほかの湯に、ひと休み。', read: '夢中で漫画を読んでいる。', drink: '日本酒をごくごく。', eat: '背脂ラーメンをもぐもぐ。' };
      message(place?.message ?? (target.goemon ? target.goemon.name+'の五右衛門風呂に身を沈めた。' : target.retreat ? target.retreat.name+'に身を沈めた。' : lines[pickup.activity]));
    }
  }
  function finishActivity() {
    const activity = player.activity;
    player.activity = null;
    player.activityTime = 0;
    switch (activity) {
      case 'bath':
        if(lastPlace?.action==='rinse'){
          message('肩から湯を流し、洗い場を立った。');
          break;
        }
        player.hp = player.mp = MAX_VITAL;
        player.buffs.warm = BUFF_TIME.warm;
        message('湯上がりほかほか。体力・モッチポイント全回復！');
        break;
      case 'read':
        player.buffs.swift = BUFF_TIME.swift;
        message('続きが楽しみ！ 足どりが軽くなった。');
        break;
      case 'drink':
        player.buffs.drunk = BUFF_TIME.drunk;
        message('ほろ酔い千鳥足。左右の操作が逆になった！');
        break;
      case 'eat':
        player.buffs.full = BUFF_TIME.full;
        message(player.mode === 'kinako' ? '満腹！ 三条通知が周囲二十四方向へ！' : player.mode === 'kagami' ? '満腹！ 鏡餅から八方へ福を届けよう。' : '満腹！ 三条通知が一度に三方向へ飛ぶ。');
        break;
      case 'chaya':
        player.hp=player.mp=MAX_VITAL;
        message('お茶を飲みほして、体力とモッチポイントが全回復！');
        break;
      case 'tea':
        player.mp = Math.min(MAX_VITAL,player.mp+32);
        message('宇治茶を飲んで、モッチポイントが32回復。');
        break;
      case 'mitarashi':
        player.hp = Math.min(MAX_VITAL,player.hp+26);
        player.buffs.full = BUFF_TIME.full;
        message('みたらし団子で体力が26回復。お腹もいっぱい！');
        break;
      case 'tsukimi':
        player.hp = Math.min(MAX_VITAL,player.hp+20);
        player.mp = Math.min(MAX_VITAL,player.mp+35);
        message('月見のひと休み。体力が20、モッチポイントが35回復！');
        break;
      case 'sleep':
        player.hp = MAX_VITAL;
        player.invulnerable = 2;
        message('ぐっすり眠って、元気いっぱい！');
        break;
    }
  }
  function canFly() {
    return !player.mount && (player.mode === 'habutae' || player.mode === 'kagami');
  }
  function jump() {
    if (player.activity || passengerBoat) return false;
    if (player.diveDepth > 0) return true; // Space strokes upward while submerged.
    if (player.mode === 'kagami' && !player.mount) flapRemaining = KAGAMI_BEAT_DURATION;
    const footLaunch = player.grounded || ledgeGrace > 0;
    if (!footLaunch) {
      // Each fresh press pulls out more dough. A wingbeat still lifts the
      // flying mochi after its body has reached full extension.
      const before = player.airStretch;
      player.airStretch = Math.min(1, before + 0.23);
      player.vy += (player.airStretch - before) * 8;
      player.stretch = .23;
      if (canFly()) {
        player.vy = clamp(player.vy + 3.2, 8.6, 13.5);
      }
      if (player.vy < 0 && player.h < .55) bufferedJump = JUMP_BUFFER;
      sound('elastic');
      return true;
    }
    player.airStretch = 0;
    const stretch = !player.mount && player.mode === 'dango';
    const takeoffSpeed = stretch ? STRETCH_SPEED : JUMP_SPEED;
    if (player.mount) player.vy = 8.6;
    else player.vy = takeoffSpeed;
    player.grounded = false;
    player.stretch = stretch ? .58 : .20;
    player.landing = 0;
    bufferedJump = ledgeGrace = 0;
    say('モチコラショッ');
    sound('jump');
    return true;
  }
  function canStepTo(x,z) {
    const r=footRadius(),tall=1.66*(player.buffs.full>0?1.28:1);
    const at=constrainMove(player.x,player.z,x,z,0,player.y,r,tall);
    if(distance(at,{x,z})>=.015)return false;
    const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
    const steps=Math.ceil(Math.hypot(dx,dz)/.18);
    let previous=propOverlap(player.x,player.z,player.y,tall,r);
    for(let i=1;i<=steps;i++){
      const px=wrapCoord(player.x+dx*i/steps),pz=wrapCoord(player.z+dz*i/steps);
      const depth=propOverlap(px,pz,player.y,tall,r);
      if(depth>previous+.000001 || !shipFits(px,pz,player.y,r,tall))return false;
      previous=depth;
    }
    return true;
  }
  function rideSkiff(boat,time) {
    const seat=skiffDeck(boat,time);
    passengerPose=seat;
    Object.assign(player,{x:seat.x,y:seat.y,z:seat.z,heading:seat.heading,
      h:0,speed:0,vx:0,vy:0,vz:0,airStretch:0,diveDepth:0,inWater:false,grounded:true});
  }
  // Step over the gunwale, keeping the transfer on the same side of piers,
  // bridge decks and other hulls. At the seat the traveller is crouching.
  function skiffPassage(boat,from,to) {
    const dx=wrapDelta(to.x-from.x),dz=wrapDelta(to.z-from.z);
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz,to.y-from.y)/.18));
    for (let i=1;i<=steps;i++) {
      const t=i/steps,x=wrapCoord(from.x+t*dx),z=wrapCoord(from.z+t*dz);
      const y=from.y+(to.y-from.y)*t+.45*Math.sin(Math.PI*t)+.035;
      if (staticVolumeAt(x,z,y,.18,.92) || !shipFits(x,z,y,.18,.92) ||
          propOverlap(x,z,y,.92,.18,null,boat.id)) return false;
    }
    return true;
  }
  function boardSkiff(boat) {
    const seat=skiffDeck(boat,state.time);
    if (!skiffPassage(boat,player,seat)) {
      message('舟べりの開けた側から乗ろう。');return false;
    }
    if (player.mode!=='kusa') changeMode('normal');
    passengerBoat=boat;player.skiff=boat.id;
    rideSkiff(boat,state.time);
    bufferedJump=ledgeGrace=flapRemaining=0;
    message(boat.name+'に腰を下ろした。');sound('mount');
    return true;
  }
  function leaveSkiff() {
    const boat=passengerBoat,seat=skiffDeck(boat,state.time),choices=[];
    for (const at of skiffApproaches(boat,state.time)) {
      const y=Math.max(groundHeight(at.x,at.z,seat.y),voyage.sample(at.x,at.z,seat.y)?.floor ?? -Infinity);
      const target={x:at.x,y,z:at.z};
      if (Math.abs(y-seat.y)>2.1 || !rideFits(at.x,at.z,y,player.heading,1.66*(player.buffs.full>0?1.28:1),null)) continue;
      if (skiffPassage(boat,seat,target))
        choices.push({target,wet:y<waterSurfaceAt(at.x,at.z,state.time,y)-.08,reach:gap(target)});
    }
    choices.sort((a,b)=>Number(a.wet)-Number(b.wet) || a.reach-b.reach);
    if (!choices.length) {message('舟べりが空いたところで降りよう。');return false;}
    Object.assign(player,choices[0].target,{skiff:null,inWater:choices[0].wet});
    passengerBoat=passengerPose=null;
    message(boat.name+'から降りた。');sound('dismount');return true;
  }
  function dismount() {
    if (passengerBoat) return leaveSkiff();
    if (player.activity || !player.mount || !player.grounded) return false;
    const standingHeight=1.66*(player.buffs.full>0?1.28:1);
    if (player.mount === 'bike') {
      const port = nearest();
      if (!port || port.target.type !== 'port') {
        message('電動自転車はポートで返そう。'); return false;
      }
      // The returned bike now occupies its slot. Step clear before completing the return.
      port.target.bikes++;
      const side=nearbyFooting(player.x,player.z,player.y,player.heading,7,
        (x,z,y)=>rideFits(x,z,y,player.heading,standingHeight,null) && canStepTo(x,z));
      if(!side){port.target.bikes--;message('ポートの開けた側から返そう。');return false;}
      Object.assign(player,side);
      message('電動自転車を返した。');
    } else {
      // Leave the turtle on connected footing. When a wall covers one side
      // of its shell the rider can step down on the other side.
      if(!rideFits(player.x,player.z,player.y,player.heading,bodyHeight())){
        message('少し開けた場所でカメから降りよう。');return false;
      }
      const origin={x:player.x,y:player.y,z:player.z};
      const side=nearbyFooting(origin.x,origin.z,origin.y,player.heading+Math.PI/2,7,(x,z,y)=>{
        return Math.hypot(wrapDelta(x-origin.x),wrapDelta(z-origin.z))>=1.65 &&
          rideFits(x,z,y,player.heading,standingHeight,null) && canStepTo(x,z);
      });
      if(!side){message('少し開けた場所でカメから降りよう。');return false;}
      Object.assign(turtle,origin,{homeX:origin.x,homeZ:origin.z,mounted:false,speed:0,heading:player.heading});
      Object.assign(player,side);
      turtlePath=null; turtleLeg=0; turtlePause=1.5;
      message('カメからそっと降りた。');
    }
    player.mount = null;
    player.speed = player.vx = player.vz = 0;
    sound('dismount');
    return true;
  }
  function interact(facing) {
    if (passengerBoat || player.mount) return dismount();
    const found = nearest();
    if (!found) return false;
    const target = found.target;
    if (target.livingSite) {
      const site=target.livingSite;
      if (site.kind==='gather') {
        const got=gatherResource(state.livingWorld,site.id);
        message(got.ok?got.message:got.reason);
        if (got.ok) { sound('pickup'); emit('livingChanged',{}); }
        return got.ok;
      }
      emit('living',{siteId:site.id});
      return true;
    }
    if (SKIFFS.includes(target)) return boardSkiff(target);
    if (target === turtle) {
      if (player.buffs.full > 0) {
        message('カメが首を引っ込めた。満腹のお餅はちょっと重い。'); return false;
      }
      const seat=nearbyFooting(turtle.x,turtle.z,turtle.y,turtle.heading,4,
        (x,z,y)=>rideFits(x,z,y,turtle.heading,2.70,'turtle') && canStepTo(x,z));
      if(!seat){message('カメの背に乗れる広さのある場所で待とう。');return false;}
      Object.assign(player,seat,{h:0,vx:0,vy:0,vz:0,speed:0,heading:turtle.heading,grounded:true});
      player.mount = 'turtle';
      turtle.mounted = true;
      message('ミツユビハコガメに乗った！');
    } else if (target.chaya) {
      Object.assign(player,{x:target.x,y:target.y,z:target.z,heading:target.chaya.yaw,h:0,vy:0,grounded:true});
      beginActivity('chaya',4.4);
      sound('pickup');
      message(target.chaya.name+'の縁台で、'+target.chaya.dango+'と'+target.chaya.tea+'をいただく。');
      return true;
    } else if (target.type === 'port') {
      if (target.bikes < 1) return false;
      target.bikes--;
      const tall=.90+1.66*(player.buffs.full>0?1.28:1);
      const seat=nearbyFooting(player.x,player.z,player.y,player.heading,7,
        (x,z,y)=>rideFits(x,z,y,player.heading,tall,'bike') && canStepTo(x,z));
      if(!seat){target.bikes++;message('ポートの開けた側から乗ろう。');return false;}
      Object.assign(player,seat,{h:0,vx:0,vy:0,vz:0,speed:0,grounded:true});
      player.mount = 'bike';
      message('電動自転車で出発。次のポートで返せる。');
    } else {
      collect(target,facing,found.place);
      return true;
    }
    if (player.mode !== 'kusa') changeMode('normal');
    sound('mount');
    return true;
  }
  function throwNotice(facing) {
    if (player.activity || throwCooldown > 0) return false;
    throwCooldown = .33;
    player.throwTime = .28;
    // Use the orientation actually shown at the instant of the gesture, including turns.
    const forward = Number.isFinite(facing) ? facing : player.heading;
    const full = player.buffs.full > 0;
    let angles = full ? NOTICE_FAN : NOTICE_FORWARD;
    if (player.mode === 'kinako') angles = full ? FULL_KINAKO : EIGHT_NOTICES;
    if (player.mode === 'kagami') angles = EIGHT_NOTICES;
    const height = passengerBoat ? .74 : player.mount === 'turtle' ? 1.98 : player.mount ? 1.45 : player.buffs.full > 0 ? 1.30 : .93;
    for (const angle of angles) {
      const heading = forward + angle;
      state.shots.push({
        id: 'shot-' + (++shotId), type: 'notice', angle, heading,
        x: player.x + Math.sin(heading) * .65, z: player.z + Math.cos(heading) * .65,
        y: player.y + height, life: 1.65, age: 0
      });
    }
    say('三条通知！'); sound('throw');
    return true;
  }
  function grassFloor(x,z,feet) {
    // The floating galleries are the shore of this air pocket. Grass mochi
    // can still pass through its furnishings and walk into the palace bath.
    if(!palaceInteriorAt(x,z,feet))return landscapeFloor(x,z,feet);
    const floor=groundHeight(x,z,feet);
    // An airborne grass mochi can pass through a ceiling. Only a walking
    // stride may step up to a support that is still above its feet.
    return !player.grounded && floor>feet+.001?groundHeight(x,z,feet-.35):floor;
  }
  function changeMode(mode) {
    const leavingGrass = player.mode === 'kusa';
    player.mode = mode;
    flapRemaining = 0;
    if (passengerBoat || !leavingGrass && mode !== 'kusa') return;
    if (player.diveDepth > 0) {
      // A swimmer may have phased inside a hall. Leave the solid by the
      // shortest upward stroke when the grass transformation wears off.
      if (leavingGrass) {
        while (staticVolumeAt(player.x,player.z,player.y,bodyRadius(),1.25) && player.diveDepth > 0) {
          player.diveDepth=Math.max(0,player.diveDepth-.15);
          player.y=swimSurfaceAt(player.x,player.z,player.y)-.57-player.diveDepth;
        }
        player.grounded=player.diveDepth===0;
      }
      return;
    }
    if (leavingGrass) {
      // Both cancellation and MP exhaustion need room for the rider and their mount.
      const fits = (x,z,y) => {
        const floor = Math.max(groundHeight(x,z,y), voyage.sample(x,z,y)?.floor ?? -Infinity);
        const feet=Math.max(y,floor);
        return floor <= y + .52 && canOccupy(x,z,feet,footRadius(),1.66) &&
          rideFits(x,z,feet,player.heading,bodyHeight());
      };
      if (!fits(player.x,player.z,player.y)) {
        let found = false;
        for (let r=.35; !found && r<=20; r+=.35) {
          const directions = Math.ceil(2*Math.PI*r/.5);
          for (let i=0; i<directions; i++) {
            const a = player.heading + 2*Math.PI*i/directions;
            const x = wrapCoord(player.x + r*Math.sin(a)), z = wrapCoord(player.z + r*Math.cos(a));
            if (!fits(x,z,player.y)) continue;
            player.x=x; player.z=z; found=true;
            break;
          }
        }
        // A tall plinth can cover every point at the grass mochi's current
        // height. Emerge above it and let the usual landing find the surface.
        if (!found) {
          const limit = landscapeFloor(player.x,player.z,player.y) + CEILING;
          while (player.y < limit && !fits(player.x,player.z,player.y))
            player.y = Math.min(limit,player.y + .5);
        }
      }
    }
    const floor = mode === 'kusa' ? grassFloor(player.x,player.z,player.y)
      : Math.max(groundHeight(player.x,player.z,player.y), voyage.sample(player.x,player.z,player.y)?.floor ?? -Infinity);
    player.y = Math.max(floor,player.y);
    player.h = player.y-floor;
    player.grounded = player.h <= .001 && player.vy <= 0;
  }
  function act(action, facing) {
    if (action === 'jump') { heldJump = true; return jump(); }
    if (action === 'throw') return throwNotice(facing);
    if (action === 'dismount') return dismount();
    if (action === 'interact') return interact(facing);
    if (!Object.hasOwn(MODE_COST, action) || player.activity) return false;
    if ((player.mount || player.skiff) && !canUseModeOnMount(action)) {
      message('乗ったまま変身できるのは草餅だよ。'); return false;
    }
    if (action === 'kagami' && !state.kagamiUnlocked) return false;
    if (action === player.mode) return true;
    if (!spendMP(MODE_COST[action])) {
      message('モッチポイントが回復するまで、ちょっとひと休み。'); return false;
    }
    changeMode(action);
    message(MODE_NAME[action] + 'になった。'); sound('mode');
    return true;
  }

  function moveTurtle(dt) {
    if (turtle.mounted) {
      turtle.x = player.x; turtle.z = player.z; turtle.y = player.y;
      turtle.heading = player.heading; turtle.speed = player.speed;
      return;
    }
    if (turtlePause > 0) {
      turtlePause = Math.max(0, turtlePause - dt);
      turtle.role = 'rest'; turtle.speed = 0;
      return;
    }
    if(!turtlePath) {
      // Recover old journeys left inside a fixture (or on the old terrain).
      if(!Number.isFinite(turtleFooting(turtle.x,turtle.z,turtle.y))){
        const safe=nearbyFooting(turtle.x,turtle.z,turtle.y,turtle.heading,30,
          (x,z,y)=>Number.isFinite(turtleFooting(x,z,y)));
        if(safe)Object.assign(turtle,safe,{homeX:safe.x,homeZ:safe.z});
      }
      turtlePath=planTurtleLeg(turtle,turtleLeg,turtleFooting);
    }
    turtle.role='wander';
    const target=turtlePath[0];
    if(!target){
      turtlePause=turtleLeg===0?11:2.5;
      turtleLeg=(turtleLeg+1)%4; turtlePath=null; turtle.speed=0;
      return;
    }
    const dx=wrapDelta(target.x-turtle.x),dz=wrapDelta(target.z-turtle.z);
    const length=Math.hypot(dx,dz);
    if(length<.035){turtlePath.shift();return;}
    turtle.heading=Math.atan2(dx,dz);
    const step=Math.min(length,Math.min(2.3,turtle.speed+1.8*dt)*dt);
    const x=wrapCoord(turtle.x+dx/length*step), z=wrapCoord(turtle.z+dz/length*step);
    const y=turtleFooting(x,z,turtle.y);
    if(!Number.isFinite(y)){turtlePath=null;turtle.speed=0;turtlePause=.28;return;}
    Object.assign(turtle,{x,y,z,speed:step/dt});

  }
  // Include both the width of a cell and the roaming range around each home.
  let crowdCellX, crowdCellZ, priorLetterCells;
  function refreshCrowd() {
    const cx=Math.floor(player.x/32), cz=Math.floor(player.z/32);
    // A swift mount or a map jump can leave a letter in another district.
    // Keep the recipients around it active until the delivery resolves.
    const distant=[];
    let letterCells='';
    for(const shot of state.shots) {
      if(Math.abs(wrapDelta(shot.x-player.x))<90 && Math.abs(wrapDelta(shot.z-player.z))<90)continue;
      const ix=Math.floor(shot.x/32),iz=Math.floor(shot.z/32),key='|'+ix+','+iz+'|';
      if(letterCells.includes(key))continue;
      letterCells+=key;distant.push([(ix+.5)*32,(iz+.5)*32]);
    }
    if (cx===crowdCellX && cz===crowdCellZ && priorLetterCells===letterCells) return;
    crowdCellX=cx; crowdCellZ=cz; priorLetterCells=letterCells;
    const cellX=(cx+.5)*32, cellZ=(cz+.5)*32;
    state.nearbyNpcs=npcs.filter(n=>{
      if(n===turtle || n.type==='hawk' || legendary(n.type))return true;
      // A crane's ellipse can swing two radii away from its original perch.
      // Stream the whole route before its edge reaches the 128 m view radius.
      const reach=n.type==='bird' ? 128+16+2*n.radius : 150;
      if(Math.abs(wrapDelta(n.homeX-cellX))<reach && Math.abs(wrapDelta(n.homeZ-cellZ))<reach)return true;
      const reachLetter=24+2*(n.radius||0);
      return distant.some(([x,z])=>Math.abs(wrapDelta(n.homeX-x))<reachLetter && Math.abs(wrapDelta(n.homeZ-z))<reachLetter);
    });
  }
  const streetScore={};
  function updateNPCs(dt) {
    refreshCrowd();
    for(const n of state.nearbyNpcs){
      n.contactX=n.x; n.contactY=n.y; n.contactZ=n.z;
    }
    moveTurtle(dt);
    for (const n of state.nearbyNpcs) {
      n.flash = Math.max(0, n.flash - dt);
      if (n === turtle || n.atMortar || n.ridesDeer) continue;
      if (n.waterHare) {updateWaterHare(n,state.time,player);continue;}
      if (n.encounter) {updateScrollResident(n,state.time);continue;}
      if (n.scrollFauna) {moveScrollFauna(n,state.time);continue;}
      if (n.seaResident) {updateRyuguResident(n,state.time);continue;}
      if (SPECIES[n.type]) {
        const far=Math.abs(wrapDelta(n.x-player.x))+Math.abs(wrapDelta(n.z-player.z))>55;
        const continuous=n.type==='bird'||n.type==='dragon'||n.type==='kirin';
        if(continuous || !far || Math.floor((state.time+n.phase)*6)!==Math.floor((state.time+n.phase-dt)*6)) moveWildlife(n,state.time);
        continue;
      }
      // Stationary workers face the passers-by. A short sidestep keeps dancers
      // and field hands within the clear ground sampled for their workstation.
      if (n.area) {
        const distance2=wrapDelta(n.x-player.x)**2+wrapDelta(n.z-player.z)**2;
        if (distance2>25**2 && Math.floor((state.time+n.phase)*4)===Math.floor((state.time+n.phase-dt)*4)) continue;
        if(n.room!==undefined) continue;
        const beat=state.time*.65+n.phase;
        const sway=n.role==='fan' ? .35 : n.role==='broom'||n.role==='rake' ? .15 : 0;
        n.heading=n.facing+.17*Math.sin(beat*.5);
        if (sway) {
          const d=Math.sin(beat)*sway;
          n.x=n.homeX+Math.cos(n.facing)*d; n.z=n.homeZ-Math.sin(n.facing)*d;
          n.y=groundHeight(n.x,n.z);
          n.speed=Math.abs(Math.cos(beat))*sway;
        }
        continue;
      }
      n.walkStart ??= walkingScore(0,n,streetScore).travel;
      walkingScore(state.time,n,streetScore);
      n.gesture=streetScore.gesture;
      n.variation=streetScore.variation;
      const t = (streetScore.travel-n.walkStart) * (n.role === 'porter' ? .32 : .44) + n.phase;
      let x, z;
      if (n.role === 'sumo') {
        const sway = state.time * 1.55 + n.phase;
        const bout=.5-.5*Math.cos((state.time+n.phase)*.82);
        x = n.homeX + Math.sin(sway) * .12 + n.side * (.18 + bout*.25);
        z = n.homeZ + Math.cos(sway) * .14;
        n.heading = n.side * Math.PI / 2;
      } else {
        walkCircuit(n,t,streetScore);
        x=streetScore.x;z=streetScore.z;
        n.heading=Math.atan2(Math.cos(t),-.66*Math.sin(t));
      }
      // Faraway routines still follow their paths; static terrain sampling is amortized.
      if (Math.abs(n.x-player.x)+Math.abs(n.z-player.z) > 85 && Math.floor(state.time*3) === Math.floor((state.time-dt)*3)) continue;
      if(n.role==='sumo' && !openGround(x,z,animalRadius(n))) continue;
      n.speed = Math.min(2.3, Math.hypot(x-n.x,z-n.z)/dt);
      n.x=x; n.z=z; n.y=groundHeight(x,z);
    }
    updateHareRider(riverRider, state.time);
    for(const n of state.nearbyNpcs) {
      // Streamed-in residents may have missed several minutes. Their return
      // to the current pose must not sweep through the intervening district.
      if(Math.abs(wrapDelta(n.x-n.contactX))+Math.abs(wrapDelta(n.z-n.contactZ))+Math.abs(n.y-n.contactY)>3) {
        n.contactX=n.x;n.contactY=n.y;n.contactZ=n.z;
      }
    }
  }
  function updateShots(dt) {
    for (let i=state.shots.length-1;i>=0;i--) {
      const shot = state.shots[i];
      const dx = Math.sin(shot.heading), dz = Math.cos(shot.heading);
      // The first sweep starts at the throwing hand, including the short
      // muzzle offset at which the flying letter first appears.
      const launch=shot.age===0?.65:0, length=18*dt+launch;
      const start={x:wrapCoord(shot.x-dx*launch),z:wrapCoord(shot.z-dz*launch),y:shot.y};
      let hit = null;
      let first = Infinity;
      for (const n of state.nearbyNpcs) {
        if(n.mounted) continue;
        const along=sweepResident(n,start,dx*length,0,dz*length,.105,.14,true)*length;
        if(along<first) { first=along; hit=n; }
      }
      const bellDistance=noticeBellDistance(start,dx,dz,length);
      const bellFirst=bellDistance<first;
      if(bellFirst){first=bellDistance;hit=null;}
      const travel=Math.min(first,length), samples=Math.max(1,Math.ceil(travel/.08));
      let stopped=false;
      for(let j=0;j<=samples;j++){
        const t=travel*j/samples, x=wrapCoord(start.x+dx*t), z=wrapCoord(start.z+dz*t);
        if(bellFirst && (travel===0 || j===samples)){
          ringTempleBell('notice',state.time);stopped=true;break;
        }
        const feet=shot.y-.045;
        const ship=voyage.sample(x,z,feet,.045,.09);
        noticeContact.person=null;
        if(staticVolumeAt(x,z,feet,.045,.09) || propOverlap(x,z,feet,.09,.045,noticeContact) || ship &&
          (ship.solid>feet || ship.floor>=feet && ship.floor<=feet+.09 || ship.ceiling<=feet+.09)) {
          if(noticeContact.person){message(noticeContact.person+'が三条通知を受け取った。');sound('pickup');}
          stopped=true;hit=null;break;
        }
      }
      shot.x=wrapCoord(start.x+dx*travel);shot.z=wrapCoord(start.z+dz*travel);
      shot.age += dt; shot.life -= dt;
      if (hit) {
        const points=(SPECIES[hit.type] || SEA_SPECIES[hit.type] || SCROLL_FAUNA[hit.type])?.points ?? 10;
        hit.flash=.58; state.score+=points;
        const reward=state.delivered.has(hit.id) ? null : deliveryReward(state.livingWorld,hit.id);
        state.delivered.add(hit.id);
        emit('score', { value:points, text:'+'+points, x:hit.x, z:hit.z, y:shot.y+1 });
        if (reward) {message('三条通知を届けたお礼に、'+reward+'を受け取りました。'); emit('livingChanged',{});}
        sound('score');
        if (!state.kagamiUnlocked && state.delivered.size===state.recipientTotal) {
          state.kagamiUnlocked=true;
          message('全員に三条通知が届いた！ 鏡餅に変身できるようになった。');
          sound('pickup');
        }
      }
      if (hit || stopped || shot.life <= 0) state.shots.splice(i,1);
    }
  }
  function residentSweep(x,y,z,dx,dy,dz,radius,halfHeight,moving) {
    let first=Infinity, hit;
    const s=Math.sin(player.heading),c=Math.cos(player.heading);
    for(const [offset,width,low,top] of RIDE_PARTS[player.mount] || FOOT_PARTS){
      const half=((top ?? 2*halfHeight)-low)*.5;
      Object.assign(fromBody,{x:wrapCoord(x+s*offset),y:y+low+half,z:wrapCoord(z+c*offset)});
      for(const n of state.nearbyNpcs){
        if(n.mounted || (n.waterHare && n.waterYield>.12 && !player.mount))continue;
        const t=sweepResident(n,fromBody,dx,dy,dz,width || radius,half,moving,contactNormal);
        if(t<first){
          first=t;hit=n;Object.assign(hitNormal,contactNormal);
          hitNormal.travelX=moving?wrapDelta(n.x-(n.contactX??n.x)):0;
          hitNormal.travelZ=moving?wrapDelta(n.z-(n.contactZ??n.z)):0;
        }
      }
    }
    if(hit && !bumped && !hit.area && !hit.encounter && !hit.scrollFauna &&
        !hit.seaResident && !hit.atMortar && !hit.waterHare && hit!==turtle)bumped=hit;
    return first;
  }
  function crowdMove(x,z,dx,dz,height,radius) {
    // Stop at the first surface, then sweep the remaining motion along its
    // tangent. The second sweep keeps a pair of adjacent actors solid.
    const r=player.mount ? radius : radius+.16;
    const first=residentSweep(x,player.y,z,dx,0,dz,r,height*.5,true);
    if(first<1 && (dx || dz || hitNormal.travelX || hitNormal.travelZ)) {
      const inside=Math.min(0,(dx-hitNormal.travelX)*hitNormal.x+(dz-hitNormal.travelZ)*hitNormal.z);
      const horizontal=hitNormal.x**2+hitNormal.z**2;
      const f=Math.max(0,first-.002/Math.max(.002,Math.hypot(dx,dz)));
      const rx=(1-f)*(horizontal>.0001?dx-inside*hitNormal.x/horizontal:0);
      const rz=(1-f)*(horizontal>.0001?dz-inside*hitNormal.z/horizontal:0);
      x=wrapCoord(x+f*dx);z=wrapCoord(z+f*dz);
      // A tangential second query starts just outside the first surface. If
      // an old save already overlaps it, its outward normal still permits exit.
      const k=rx || rz ? Math.min(1,residentSweep(x,player.y,z,rx,0,rz,r,height*.5,false)) : 0;
      dx=rx*k;dz=rz*k;
    }
    if(player.mount)return {x:wrapCoord(x+dx),z:wrapCoord(z+dz)};
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.38));
    for(let j=0;j<steps;j++){
      const nx=wrapCoord(x+dx/steps),nz=wrapCoord(z+dz/steps);
      const penetration=propOverlap(x,z,player.y,height,radius);
      const free=(a,b)=>{
        const next=propOverlap(a,b,player.y,height,radius);
        return next===0 || next<penetration;
      };
      if(free(nx,nz)){x=nx;z=nz;}
      else if(free(nx,z))x=nx;
      else if(free(x,nz))z=nz;
    }
    return {x,z};
  }
  function fixtureDepth(x,z,y,height,radius) {
    if(!player.mount)return propOverlap(x,z,y,height,radius);
    const s=Math.sin(player.heading),c=Math.cos(player.heading);
    let depth=0;
    for(const [offset,r,low,top] of RIDE_PARTS[player.mount]){
      const px=wrapCoord(x+offset*s),pz=wrapCoord(z+offset*c);
      depth=Math.max(depth,propOverlap(px,pz,y+low,(top ?? height)-low,r));
    }
    return depth;
  }
  function crowdLift(x,z,y,dy,height,radius) {
    if(!dy)return dy;
    const t=residentSweep(x,y,z,0,dy,0,radius,height*.5,false);
    const lifted=dy*Math.min(1,t);
    const steps=Math.max(1,Math.ceil(Math.abs(lifted)/.12));
    let depth=fixtureDepth(x,z,y,height,radius);
    for(let i=1;i<=steps;i++){
      const next=fixtureDepth(x,z,y+lifted*i/steps,height,radius);
      if(next>depth+.000001)return lifted*(i-1)/steps;
      depth=next;
    }
    return lifted;
  }
  function fixtureSlide(x,z,sx,sz,feet,tall,radius){
    const tx=wrapCoord(x+sx),tz=wrapCoord(z+sz);
    const depth=(a,b)=>fixtureDepth(wrapCoord(a),wrapCoord(b),feet,tall,radius);
    if(!depth(tx,tz))return null;
    const gx=depth(tx+.015,tz)-depth(tx-.015,tz),gz=depth(tx,tz+.015)-depth(tx,tz-.015);
    const length=gx*gx+gz*gz,into=sx*gx+sz*gz;
    if(length<1e-12 || into<=0)return null;
    return {x:wrapCoord(tx-gx*into/length),z:wrapCoord(tz-gz*into/length)};
  }
  // Check each intermediate pose against the same occupants. A slide along a
  // wall must still clear the rack, traveller or second wall alongside it.
  function mountedMove(x,z,targetX,targetZ,tall) {
    const dx=wrapDelta(targetX-x),dz=wrapDelta(targetZ-z);
    if(!dx && !dz)return {x,z};
    const count=Math.ceil(Math.hypot(dx,dz)/.18),sx=dx/count,sz=dz/count;
    const s=Math.sin(player.heading),c=Math.cos(player.heading);
    let feet=player.y;
    for(let i=0;i<count;i++){
      const tx=wrapCoord(x+sx),tz=wrapCoord(z+sz);
      const fits=(a,b)=>rideFits(a,b,feet,player.heading,tall);
      if(fits(tx,tz)){x=tx;z=tz;}
      else {
        let ax=tx,az=tz;
        for(const [offset,r,low,top] of RIDE_PARTS[player.mount]){
          const ox=s*offset,oz=c*offset;
          const at=constrainMove(wrapCoord(x+ox),wrapCoord(z+oz),wrapCoord(ax+ox),wrapCoord(az+oz),
            0,feet+low,r,(top ?? tall)-low);
          ax=wrapCoord(at.x-ox);az=wrapCoord(at.z-oz);
        }
        if((Math.abs(wrapDelta(ax-x))+Math.abs(wrapDelta(az-z))>1e-6) && fits(ax,az)){x=ax;z=az;}
        else {
          const slide=fixtureSlide(x,z,sx,sz,feet,tall,bodyRadius());
          if(slide && fits(slide.x,slide.z)){x=slide.x;z=slide.z;}
          else if(sx && fits(tx,z))x=tx;
          else if(sz && fits(x,tz))z=tz;
          else break;
        }
      }
      feet=Math.max(player.y,groundHeight(x,z,feet));
    }
    return {x,z};
  }
  function recoverMount() {
    const tall=bodyHeight(),h=player.h;
    if(rideFits(player.x,player.z,player.y,player.heading,tall))return;
    const safe=nearbyFooting(player.x,player.z,player.y-h,player.heading,32,
      (x,z,floor)=>rideFits(x,z,floor+h,player.heading,tall));
    if(safe)Object.assign(player,safe,{y:safe.y+h,vx:0,vz:0,speed:0});
  }
  function updateMotion(dt, input) {
    if (player.activity && player.activity !== 'fall') return;
    const moving = player.activity === 'fall' ? 0 : 1;
    let dx = clamp(Number(input.x) || 0,-1,1) * moving;
    let dz = clamp(Number(input.z) || 0,-1,1) * moving;
    if (player.buffs.drunk > 0) {
      const rightX = Number.isFinite(input.rightX) ? input.rightX : 1;
      const rightZ = Number.isFinite(input.rightZ) ? input.rightZ : 0;
      const len = Math.hypot(rightX,rightZ) || 1;
      const rx = rightX/len, rz = rightZ/len;
      const side = dx*rx + dz*rz;
      const sway = Math.sin(state.time*5) * Math.hypot(dx,dz)*.22;
      dx += rx*(sway-2*side); dz += rz*(sway-2*side);
    }
    const stick = Math.hypot(dx,dz);
    const amount = Math.max(1,stick);
    dx /= amount; dz /= amount;
    let pace = player.mount || 'foot';
    if (!player.mount && ['dango','kagami'].includes(player.mode)) pace = player.mode;
    if (!player.grounded && canFly()) pace = 'flight';
    const waterDrag = player.inWater && !player.mount ? .72 : 1;
    const modifier = waterDrag * (player.buffs.swift>0 ? SWIFT_FACTOR : 1) * (player.buffs.full>0 ? .81 : 1);
    const speed = SPEED[pace] * modifier;
    if(recoverRider){
      recoverRider=false;
      if(player.mount && player.mode!=='kusa')recoverMount();
    }
    if (dx || dz) {
      const heading=Math.atan2(dx,dz);
      if(!player.mount || player.mode==='kusa')player.heading=heading;
      else{
        // Turn through the available arc. Translation remains independent of
        // facing so reversing out of a slot never requires turning in place.
        const delta=Math.atan2(Math.sin(heading-player.heading),Math.cos(heading-player.heading));
        const turn=delta*(1-Math.exp(-dt*12));
        const steps=Math.abs(delta)<1e-6 ? 0 : Math.ceil(Math.abs(turn)/.14);
        for(let i=0;i<steps;i++){
          const next=player.heading+turn/steps;
          if(!rideFits(player.x,player.z,player.y,next,bodyHeight()))break;
          player.heading=Math.atan2(Math.sin(next),Math.cos(next));
        }
      }
    }
    const traction = player.activity==='fall' ? 4 : player.mode==='dango' ? 6 : 13;
    const ease = 1 - Math.exp(-dt*traction);
    player.vx += (dx*speed-player.vx)*ease;
    player.vz += (dz*speed-player.vz)*ease;
    if (RUN_UP[pace] && stick > 0) {
      // Pick up a walking stride promptly, then gain speed over several
      // seconds. Actual ground speed also resets the run-up against a wall.
      const throttle = Math.min(1,stick) * modifier;
      const startSpeed = SPEED.foot * throttle;
      const acceleration = (SPEED[pace] - SPEED.foot) * throttle / RUN_UP[pace];
      const speedLimit = player.speed + Math.max(0,startSpeed-player.speed)*ease + acceleration*dt;
      const steeringSpeed = Math.hypot(player.vx,player.vz);
      if (steeringSpeed > speedLimit) {
        const gain = speedLimit / steeringSpeed;
        player.vx *= gain; player.vz *= gain;
      }
    }
    if (Math.abs(player.vx)<.002) player.vx = 0;
    if (Math.abs(player.vz)<.002) player.vz = 0;
    const phasing = player.mode === 'kusa';
    const tall=bodyHeight(), radius=bodyRadius();
    const {x,z}=phasing ? {x:player.x+player.vx*dt,z:player.z+player.vz*dt}
      : crowdMove(player.x,player.z,player.vx*dt,player.vz*dt,player.diveDepth?1.25:tall,radius);
    // In the sea, the waterline is the resting swimming height. A diver holds
    // the chosen depth until the next stroke or a rising seabed lifts them.
    const wasDiving=player.diveDepth>0;
    const startDive=input.dive && player.grounded && player.inWater && canDiveAt(player.x,player.z,player.y);
    // A diver crosses the sealed sill at a fixed world altitude. Depth is
    // measured against the water surface on the side they have just entered.
    const wasInside=phasing && palaceInteriorAt(player.x,player.z,player.y);
    const throughWall=wasInside && !palaceInteriorAt(x,z,player.y);
    const enteringAir=phasing && wasDiving && palaceInteriorAt(x,z,player.y) && player.y>swimSurfaceAt(x,z,player.y);
    if (!enteringAir && (wasDiving || startDive || throughWall) && !player.mount && !player.activity) {
      const free=(xx,zz,yy)=>phasing || !staticVolumeAt(xx,zz,yy,radius,1.25) && shipFits(xx,zz,yy,radius,1.25);
      // Use the front of the swimmer's footprint on the submerged treads,
      // so each riser lifts the feet just before the torso reaches its face.
      const bottom=(xx,zz)=>Math.max(terrainContactHeight(xx,zz)+.16,boardingHeightAt(xx-radius,zz)+.001);
      const fits=(xx,zz)=>free(xx,zz,Math.max(player.y,bottom(xx,zz)));
      const strideX=wrapDelta(x-player.x),strideZ=wrapDelta(z-player.z);
      const steps=Math.max(1,Math.ceil(Math.hypot(strideX,strideZ)/.35));
      let nx=player.x,nz=player.z;
      for(let i=0;i<steps;i++){
        const tx=wrapCoord(nx+strideX/steps),tz=wrapCoord(nz+strideZ/steps);
        if(fits(tx,tz)){nx=tx;nz=tz;}
        else if(fits(tx,nz))nx=tx;
        else if(fits(nx,tz))nz=tz;
        else break;
      }
      const line=swimSurfaceAt(nx,nz,player.y)-.57,bed=bottom(nx,nz);
      const rate=line-bed>30?7:5.4;
      const stroke=(input.dive?-1:input.jump?1:0)*rate*dt;
      const lift=phasing?stroke:crowdLift(nx,nz,player.y,stroke,1.25,radius);
      const limit=Math.max(0,line-bed);
      let depth=clamp(line-(player.y+lift),0,limit);
      if(!free(nx,nz,line-depth))depth=clamp(line-player.y,0,limit);
      player.vx=wrapDelta(nx-player.x)/dt;player.vz=wrapDelta(nz-player.z)/dt;
      player.x=nx;player.z=nz;
      player.diveDepth=depth;player.y=Math.max(bed,line-depth);
      player.inWater=true;player.speed=Math.hypot(player.vx,player.vz);
      player.grounded=depth===0;player.airStretch=player.h=player.vy=0;
      return;
    }
    player.diveDepth=0;
    let land;
    if(phasing)land={x:wrapCoord(x),z:wrapCoord(z)};
    else if(player.mount)land=mountedMove(player.x,player.z,x,z,tall);
    else land=constrainMove(player.x,player.z,x,z,player.h,player.y,radius,tall);
    // Moving deck contacts are already included at every mounted substep.
    const at = phasing || player.mount ? land : voyage.move(player.x,player.z,land.x,land.z,player.y,radius,tall);
    if(player.mount && !phasing && stick && state.time>=retryRecoveryAt && distance(at,player)<.000001 &&
        !rideFits(player.x,player.z,player.y,player.heading,tall)){
      retryRecoveryAt=state.time+.35;
      recoverMount();
      at.x=player.x;at.z=player.z;
    }
    player.vx = wrapDelta(at.x-player.x)/dt;
    player.vz = wrapDelta(at.z-player.z)/dt;
    player.speed = Math.hypot(player.vx,player.vz);
    player.x = at.x; player.z = at.z;
    const ship = phasing ? null : voyage.sample(at.x,at.z,player.y);
    let floor = phasing ? grassFloor(at.x,at.z,player.y) : Math.max(groundHeight(at.x,at.z,player.y),ship?.floor ?? -Infinity);
    let headLimit=Infinity;
    if(!phasing && player.mount){
      const s=Math.sin(player.heading),c=Math.cos(player.heading);
      for(const [offset,r,low,top] of RIDE_PARTS[player.mount]){
        const px=wrapCoord(at.x+offset*s),pz=wrapCoord(at.z+offset*c),feet=player.y+low;
        const deck=voyage.sample(px,pz,feet,r,(top ?? tall)-low);
        floor=Math.max(floor,Math.max(groundHeight(px,pz,feet),deck?.floor ?? -Infinity)-low);
        const underside=Math.min(overheadHeight(px,pz,feet,r),deck?.ceiling ?? Infinity);
        headLimit=Math.min(headLimit,underside-(top ?? tall));
      }
    }else if(!phasing)headLimit=Math.min(overheadHeight(at.x,at.z,player.y,radius),ship?.ceiling ?? Infinity)-tall;
    const wasGrounded = player.grounded;
    if (player.grounded && floor >= player.y-.32 && player.vy<=0) player.y = floor;
    if (canFly() && input.jump && !player.activity) {
      // Ease out of the stronger takeoff into a steady wing-powered climb.
      if (player.mode === 'kagami' && flapRemaining === 0) flapRemaining = KAGAMI_BEAT_DURATION;
      player.vy = player.vy > FLIGHT_CLIMB
        ? Math.max(FLIGHT_CLIMB,player.vy-RISE_GRAVITY*dt)
        : Math.min(FLIGHT_CLIMB,player.vy+25*dt);
    } else {
      player.vy -= (player.vy > 0 ? RISE_GRAVITY : FALL_GRAVITY)*dt;
    }
    const dy=player.vy*dt;
    const lift=phasing || player.grounded && dy<0 ? dy : crowdLift(at.x,at.z,player.y,dy,tall,radius);
    player.y+=lift;
    // Grass can leave through the ceiling as well as the side panels. Start
    // swimming at the same height when the jump reaches the exterior water.
    if(wasInside && !player.mount && !palaceInteriorAt(at.x,at.z,player.y)){
      player.diveDepth=Math.max(0,swimSurfaceAt(at.x,at.z,player.y)-.57-player.y);
      player.grounded=false;player.airStretch=player.h=player.vy=0;
      return;
    }
    if(lift!==dy)player.vy=0;
    const headroom = Math.max(floor,headLimit);
    if (player.y > headroom && player.vy > 0) {
      player.y = headroom;
      player.vy = 0;
    }
    player.h = clamp(player.y-floor,0,CEILING);
    player.grounded = player.y <= floor && player.vy <= 0;
    if (wasGrounded && !player.grounded && player.vy <= 0) ledgeGrace = LEDGE_GRACE;
    if (player.grounded) {
      if (!wasGrounded && player.vy < -2) {
        player.impact = clamp((-player.vy-2)/12,0,1);
        player.landing = .25;
      }
      player.vy = 0;
      player.h = 0;
      player.y = floor;
      player.airStretch = 0;
      flapRemaining = 0;
    } else if (player.h >= CEILING) {
      player.y = floor + CEILING; player.vy = Math.min(0,player.vy);
    }
  }
  function checkContact() {
    if (!player.activity && lastBath && !stillAtPlace(lastBath,lastPlace)){lastBath=null;lastPlace=null;}
    if (passengerBoat || player.activity || player.mode === 'kusa') return;
    if (!player.mount && player.grounded) {
      for (const o of objects) {
        if (!['onsen','tsukimi','kyoTea','mitarashi'].includes(o.type) && o.active && PICKUP_ACTION[o.type] && o !== lastBath && Math.abs(player.y-o.y)<1.6 &&
            gap(o) <= .83) { collect(o); return; }
      }
    }
    const n=bumped;
    if (!n || player.invulnerable>0 || player.h>1.15 || player.diveDepth>0) return;
    player.invulnerable = 2.1;
    if (!protectedVitals()) player.hp = Math.max(0,player.hp-7);
    if (player.hp === 0) {
      player.mode = 'normal'; player.grounded = true; player.h = player.vy = 0;
      player.y = groundHeight(player.x,player.z,player.y);
      beginActivity('sleep',5);
      message('お餅はその場で、すやすや眠った。'); sound('sleep');
    } else {
      const dx=wrapDelta(player.x-n.x),dz=wrapDelta(player.z-n.z);
      const length = Math.hypot(dx,dz);
      player.vx = (length ? dx/length : -Math.sin(player.heading))*3.6;
      player.vz = (length ? dz/length : -Math.cos(player.heading))*3.6;
      beginActivity('fall',.68); sound('bump');
    }
  }
  const capital=REGIONS.find(r=>r.id==='kyo');
  function updateRegion(collectStamp) {
    const otowa=onMountOtowa(player.x,player.z);
    const region = otowa ? capital : REGIONS[regionAt(player.x,player.z)];
    const inPalace=palaceInteriorAt(player.x,player.z,player.y);
    const offshore = region.id === 'ryugu' && !inPalace && (player.diveDepth < 1 || player.y > terrainHeight(region.x,region.z) + 8);
    state.region = offshore ? '竜宮沖' : otowa && kiyomizuClearing(player.x,player.z) ? KIYOMIZU.name : region.name;
    state.regionId = region.id;
    state.onLake = lakeRadius(player.x,player.z)<1.29;
    player.night = lightAtMinute(seasonAt(player.x,player.z,climate), player.worldMinute).moon > .48;
    player.inWater = !passengerBoat && (player.diveDepth > 0 || player.grounded && waterDepth(player.x,player.z,state.time,player.y) > .14 && player.y < waterSurfaceAt(player.x,player.z,state.time,player.y) - .08);
    if (region.id === 'ryugu' && !inPalace && (offshore || player.y > terrainHeight(region.x,region.z) + 3)) return;
    if (!collectStamp || state.visited.includes(region.id) || !inPalace && distance(player,region)>STAMP_RADIUS || player.h>3) return;
    state.visited.push(region.id);
    const text = state.visited.length === REGIONS.length ? '十七景踏破！ 旅の印がすべて揃った。' : region.name+'の旅の印をもらった。';
    emit('stamp',{ id:region.id, text }); message(text); sound('pickup');
  }
  function teleport(x, z) {
    if (!state.kagamiUnlocked || player.mode !== 'kagami' || player.activity || player.mount || passengerBoat ||
        !Number.isFinite(x) || !Number.isFinite(z)) return false;
    x = wrapCoord(x); z = wrapCoord(z);
    // If a pin lands on a wall, use the nearest open footing around the pin.
    let destination = canLand(x,z) ? {x,z} : null;
    for (let radius = .55; !destination && radius <= 16; radius += .55) {
      for (let i = 0; i < 24; i++) {
        const a = i * Math.PI / 12;
        const nx = wrapCoord(x + radius * Math.sin(a)), nz = wrapCoord(z + radius * Math.cos(a));
        if (canLand(nx,nz)) { destination = {x:nx,z:nz}; break; }
      }
    }
    if (!destination) return false;
    Object.assign(player, destination, {y:groundHeight(destination.x,destination.z), h:0, vx:0, vz:0, vy:0,
      speed:0, grounded:true, diveDepth:0, airStretch:0, stretch:0, impact:0, landing:0, invulnerable:.8});
    lastBath=null;lastPlace=null;berth=null;
    bufferedJump = ledgeGrace = 0;
    flapRemaining = 0;
    refreshCrowd();
    updateRegion(true);
    sound('mode');
    message('鏡餅が絵巻をひとっ飛び。');
    return true;
  }
  function advance(dt, input) {
    const priorTime=state.time;
    state.time += dt;
    const offset=player.kyoClockOffset, hour=templeBellHour(state.time,offset);
    if(hour>templeBellHour(priorTime,offset))
      ringTempleBell('mallet',BELL_FIRST+hour*BELL_INTERVAL-offset);
    flapRemaining = Math.max(0, flapRemaining - dt);
    voyage.update(state.time,passengerBoat ? undefined : player);
    if (passengerBoat) rideSkiff(passengerBoat,state.time);
    player.idleTime = player.grounded && player.speed < .22 && !player.activity ? Math.min(3, (player.idleTime || 0) + dt) : 0;
    for (const name of Object.keys(player.buffs)) player.buffs[name] = Math.max(0, player.buffs[name] - dt);
    if (bufferedJump > 0 && player.grounded) jump();
    bufferedJump = Math.max(0,bufferedJump-dt);
    ledgeGrace = Math.max(0,ledgeGrace-dt);
    for (const name of ['stretch','landing','throwTime','invulnerable']) player[name] = Math.max(0, player[name] - dt);
    throwCooldown = Math.max(0, throwCooldown - dt);
    for (const o of objects) {
      if (o.cooldown > 0) {
        o.cooldown = Math.max(0, o.cooldown - dt);
        if (o.cooldown === 0) o.active = true;
      }
    }
    if (player.mode === 'normal' || player.activity) player.mp = Math.min(MAX_VITAL, player.mp + dt * 5.2);
    else if (!spendMP(MODE_DRAIN[player.mode] * dt)) {
      changeMode('normal'); player.mp = 0;
      message('モッチポイントを使い切って、ふつうのお餅に戻った。');
    }
    if (player.activity) {
      player.activityTime -= dt;
      if (player.activity === 'sleep') player.hp = Math.min(MAX_VITAL, player.hp + dt * 20);
      if (player.activity === 'bath' && lastPlace?.action!=='rinse') {
        player.hp = Math.min(MAX_VITAL, player.hp + dt * 26);
        player.mp = Math.min(MAX_VITAL, player.mp + dt * 26);
      }
      if (player.activityTime <= 0) finishActivity();
    }
    bumped=null;
    updateNPCs(dt);
    if (!passengerBoat) updateMotion(dt,input);
    if(turtle.mounted)moveTurtle(dt);
    updateShots(dt);
    checkContact();
    updateRegion(true);
  }
  function step(elapsed, input = {}) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;
    const activeSeconds = input.clockSeconds ?? elapsed;
    if (!input.pauseClock && Number.isFinite(activeSeconds) && activeSeconds > 0)
      state.livingWorld.worldMinute += activeSeconds / SECONDS_PER_MINUTE;
    if (input.jump && !input.dive && !heldJump) jump();
    heldJump = !!input.jump;
    // Bounded substeps preserve contacts, landings and projectiles on a slow frame.
    let remaining = Math.min(.1, elapsed);
    while (remaining > .000001) {
      const dt = Math.min(1 / 60, remaining);
      advance(dt, input);
      remaining -= dt;
    }
  }

  function restSite() {
    return nearbyRestSite(player)?.name ?? null;
  }
  function waitUntil(hour, inEvent = false) {
    if (inEvent || !restSite()) return {ok: false, reason: '宿の入口か茶屋の腰掛けのそばで、足を止めて休みましょう。'};
    const target = waitTargetMinute(player.worldMinute, hour);
    if (target === null) return {ok: false, reason: '休み終える時刻を選んでください。'};
    state.livingWorld.worldMinute = target;
    updateRegion(false);
    return {ok: true};
  }

  function save() {
    return {
      version: JOURNEY_VERSION, livingWorld: structuredClone(state.livingWorld), notebook: notebook.save(), flightSeed:state.flightSeed, kagamiUnlocked: state.kagamiUnlocked, time: state.time, score: state.score, visited: [...state.visited], delivered:[...state.delivered],
      player: { ...player, buffs: { ...player.buffs } },
      items: inventory.map(o => o?.cooldown ?? 0),
      bikes: objects.filter(o => o.type === 'port').map(o => o.bikes),
      turtle: { x:turtle.x, z:turtle.z, homeX:turtle.homeX, homeZ:turtle.homeZ, pause:turtlePause, leg:turtleLeg },
      lastBath: lastBath?.id ?? null, lastBathPlace:lastPlace?.id??null
    };
  }
  function restore(data) {
    const finite = (n,min,max) => Number.isFinite(n) && n>=min && n<=max;
    const point = (x,z) => finite(x,-BOUND,BOUND) && finite(z,-BOUND,BOUND);
    if (!data || ![2,3,4,5,6,7,8,9,10,11,12,JOURNEY_VERSION].includes(data.version) || !data.player || !data.turtle || !Array.isArray(data.visited)) return;
    if (data.version === JOURNEY_VERSION && !validLivingWorld(data.livingWorld)) return;
    let p = data.player, t = data.turtle;
    const ports = objects.filter(o=>o.type==='port');
    // The original six districts occupy the prefix of the inventory. New
    // stops start stocked even when an old journey resumes on a borrowed bike.
    const old = data.version === 2;
    const savedPorts = old ? 6 : data.version <= 4 ? 10 : data.version <= 6 ? 14 : ports.length;
    const validItemCounts = old ? [36] : data.version <= 4 ? [48,50] : data.version===5 ? [56] : data.version===6 ? [62] : data.version<=10 ? [64,inventory.length] : [inventory.length];
    if (!finite(data.time,0,1e9) || !Number.isSafeInteger(data.score) || data.score<0 ||
        !data.visited.every(id=>REGIONS.some(region=>region.id===id)) ||
        !point(p.x,p.z) || !finite(p.h,0,CEILING) || !finite(p.y,-80,CEILING+Math.max(160,terrainHeight(p.x,p.z)+20)) ||
        !finite(p.vx,-MAX_TRAVEL_SPEED,MAX_TRAVEL_SPEED) || !finite(p.vz,-MAX_TRAVEL_SPEED,MAX_TRAVEL_SPEED) || !finite(p.vy,-135,27) ||
        !finite(p.speed,0,MAX_TRAVEL_SPEED) || !finite(p.heading,-Math.PI,Math.PI) || typeof p.grounded!=='boolean' ||
        !finite(p.hp,0,100) || !finite(p.mp,0,100) || !Object.hasOwn(MODE_COST,p.mode) ||
        ![null,'turtle','bike'].includes(p.mount) || ![null,'fall','sleep','bath','read','drink','eat','tsukimi','tea','mitarashi','chaya'].includes(p.activity) ||
        !finite(p.activityTime,0,6) || !p.buffs || !Object.keys(BUFF_TIME).every(k=>finite(p.buffs[k],0,BUFF_TIME[k])) ||
        ![p.stretch,p.invulnerable,p.throwTime].every(n=>finite(n,0,3)) ||
        !Array.isArray(data.items) || !validItemCounts.includes(data.items.length) || !data.items.every(n=>finite(n,0,65)) ||
        !Array.isArray(data.bikes) || data.bikes.length!==savedPorts ||
        !data.bikes.every(n=>Number.isInteger(n)&&finite(n,0,savedPorts*2)) ||
        data.bikes.reduce((total,n)=>total+n,p.mount==='bike'?1:0)!==savedPorts*2 ||
        !point(t.x,t.z) || !point(t.homeX,t.homeZ) || !finite(t.pause,0,12) ||
        !Number.isInteger(t.leg) || !finite(t.leg,0,3)) return;
    if(data.version===5 || data.version===6) {
      const relocate=data.version===5 ? relocateLegacyPosition : relocateSixthEdition;
      let [x,z]=relocate(p.x,p.z);
      if(data.version===6){
        for(const [kind,bx,bz,yaw] of [['cedar',70.6414975,-547.0094339,1.0957856],['slate',-126.0135841,-869.3986739,-.6536359]]){
          const dx=p.x-bx,dz=p.z-bz;
          if(Math.hypot(dx,dz)<9.5){
            [x,z]=sitePoint(RETREATS.find(s=>s.kind===kind),dx*Math.cos(yaw)-dz*Math.sin(yaw),dx*Math.sin(yaw)+dz*Math.cos(yaw));
            break;
          }
        }
      }
      p={...p,x,z};
      const [tx,tz]=relocate(t.x,t.z);
      const [homeX,homeZ]=relocate(t.homeX,t.homeZ);
      t={...t,x:tx,z:tz,homeX,homeZ};
    }
    let visitor=restoreKyotoLot(p,data.version);
    if(data.version>=7 && data.version<=10)visitor=restoreHarbourTraveller(visitor,data.time,data.version);
    if(data.version===7 || data.version===8){
      const [x,z]=relocateOldQuay(t.x,t.z),[homeX,homeZ]=relocateOldQuay(t.homeX,t.homeZ);
      t={...t,x,z,homeX,homeZ};
    }
    visitor=restoreGateVisitor(visitor,data.version);
    if(data.version<12) {
      visitor=restoreSnowVisitor(visitor);
      const position=restoreSnowVisitor(t), home=restoreSnowVisitor({x:t.homeX,z:t.homeZ});
      t={...t,x:position.x,z:position.z,homeX:home.x,homeZ:home.z};
    }
    // The clerk's inkstone kept its landmark ID when it left the outskirts.
    // Only an active bather at that former site travels with the water.
    if(visitor.activity==='bath' && data.lastBath==='onsen-capital-suzuri' &&
       Math.hypot(visitor.x-121,visitor.z+911.75)<6.5) {
      const pool=objects.find(o=>o.id===data.lastBath);
      visitor={...visitor,x:pool.x,z:pool.z,y:pool.y};
    }
    if(visitor!==p && p.mount==='turtle')t={...t,x:visitor.x,z:visitor.z,homeX:visitor.x,homeZ:visitor.z};
    p=visitor;
    for (const key of Object.keys(player)) {
      if (!['idleTime','buffs','landing','impact','airStretch','night','kyoClockOffset','inWater','diveDepth','skiff'].includes(key)) player[key]=p[key];
    }
    // Doubling the old 144-second cycle doubles a saved phase. Add the old
    // elapsed time once to Kyoto's local clock; boats still use data.time.
    if(data.version>=5 && data.version<8)player.kyoClockOffset=data.time%KYO_DAY_SECONDS;
    else if(data.version>=8 && finite(p.kyoClockOffset,0,KYO_DAY_SECONDS))player.kyoClockOffset=p.kyoClockOffset%KYO_DAY_SECONDS;
    if (data.version === JOURNEY_VERSION) state.livingWorld = structuredClone(data.livingWorld);
    else state.livingWorld.worldMinute = legacyWorldMinute(data.time, player.kyoClockOffset);
    // These short pose cues were added after the first version-two saves.
    player.airStretch = !player.grounded && finite(p.airStretch,0,1) ? p.airStretch : 0;
    player.landing = finite(p.landing,0,.25) ? p.landing : 0;
    player.impact = finite(p.impact,0,1) ? p.impact : 0;
    for (const key of Object.keys(BUFF_TIME)) player.buffs[key]=p.buffs[key];
    voyage.update(data.time);
    if (player.mode === 'kusa') {
      const floor = grassFloor(player.x,player.z,player.y);
      // Older saves can start on a roof. Resume from the saved altitude and fall through it.
      player.h = clamp(p.y-floor,0,CEILING);
      player.y = floor+player.h;
      player.grounded = player.h <= .001 && player.vy <= 0;
    } else {
      let feet=p.y-p.h;
      // V12 journals may remember open water underneath the new island.
      // Retain that spot on the stone steps or the strand, moving a former
      // swimmer onto the forecourt only if the new timber or lantern blocks it.
      if(data.version===12 && isletRadius(p.x,p.z)<1 && feet<terrainHeight(p.x,p.z)-.01){
        feet=groundHeight(p.x,p.z,terrainHeight(p.x,p.z));
        if(!canOccupy(p.x,p.z,feet+p.h,bodyRadius(),bodyHeight())){
          [player.x,player.z]=fromHokora(0,3.9);
          feet=groundHeight(player.x,player.z);
          if(p.mount==='turtle')t={...t,x:player.x,z:player.z,homeX:player.x,homeZ:player.z};
        }
      }
      // A visitor saved in the old square can be inside the new plaster
      // perimeter. Restore an obstructed stance to the open street entrance.
      const inkstone=RETREATS.find(s=>s.shape==='suzuri');
      const dx=player.x-inkstone.x,dz=player.z-inkstone.z,c=Math.cos(inkstone.yaw),k=Math.sin(inkstone.yaw);
      const stance=groundHeight(player.x,player.z,feet)+player.h;
      if(suzuriParcel(dx*c-dz*k,dx*k+dz*c,bodyRadius()+.24) &&
         !canOccupy(player.x,player.z,stance,bodyRadius(),bodyHeight())){
        [player.x,player.z]=sitePoint(inkstone,0,SUZURI_COURT.front+1.86);
        feet=groundHeight(player.x,player.z);
        if(p.mount==='turtle')t={...t,x:player.x,z:player.z,homeX:player.x,homeZ:player.z};
      }
      const ship=voyage.sample(player.x,player.z,feet);
      player.y=Math.max(groundHeight(player.x,player.z,feet),ship?.floor ?? -Infinity)+player.h;
    }
    if (data.version >= 5 && finite(p.diveDepth,.000001,100) && !p.mount) {
      let line=swimSurfaceAt(p.x,p.z,p.y)-.57;
      // Older journals store an ocean-relative depth even where the new
      // palace now encloses dry air. Resume these swimmers at its open door.
      const legacyPocket=palaceInteriorAt(p.x,p.z,p.y) && Math.abs(line-p.diveDepth-p.y)>.05;
      if(legacyPocket || Math.abs(p.x-RYUGU.x)<44 && Math.abs(p.z-RYUGU.z)<24 &&
          p.mode!=='kusa' && staticVolumeAt(p.x,p.z,p.y,bodyRadius(),1.25)){
        Object.assign(player,palacePoint(0,-6.5));
        line=swimSurfaceAt(player.x,player.z,PALACE_BED+1)-.57;
        player.diveDepth=line-(PALACE_BED+1);
      }else{
        const floor=Math.max(terrainContactHeight(p.x,p.z)+.16,boardingHeightAt(p.x-bodyRadius(),p.z)+.001);
        player.diveDepth=clamp(p.diveDepth,0,Math.max(0,line-floor));
      }
      if(player.diveDepth>0){
        player.y=line-player.diveDepth;player.grounded=false;
        player.vy=player.h=player.airStretch=0;
      }
    }
    // Older journals recorded points without identifying recipients. The score survives.
    const ids=new Set(npcs.map(n=>n.id));
    if(Array.isArray(data.delivered)) state.delivered=new Set(data.delivered.filter(id=>ids.has(id)));
    // The first 623 stable recipient IDs make up the complete third-edition scroll.
    // Keep an earned transformation when that traveller opens the new pages.
    const previousReward = (data.version === 3 || data.kagamiUnlocked === true) &&
      npcs.slice(0,623).every(n => state.delivered.has(n.id));
    const completeFourthEdition = data.version === 4 && npcs.slice(0,675).every(n=>state.delivered.has(n.id));
    const completeFifthEdition = data.version === 5 && npcs.every(n=>n.scrollFauna || state.delivered.has(n.id)) &&
      retiredSeaIds.every(id=>data.delivered?.includes(id));
    state.kagamiUnlocked = state.delivered.size === state.recipientTotal || previousReward || completeFourthEdition || completeFifthEdition;
    if(player.mode==='kagami' && !state.kagamiUnlocked) player.mode='normal';
    state.score=data.score; state.time=data.time;
    state.visited=[...new Set(data.visited)];
    inventory.forEach((o,i)=>{
      if(!o)return;
      o.cooldown=data.items[i] ?? 0; o.active=o.cooldown===0;
    });
    ports.forEach((o,i)=>{o.bikes=data.bikes[i] ?? 2;});
    Object.assign(turtle, {x:t.x,z:t.z,homeX:t.homeX,homeZ:t.homeZ,y:groundHeight(t.x,t.z),mounted:p.mount==='turtle'});
    turtlePause=t.pause; turtleLeg=t.leg; recoverRider=!!player.mount;
    lastBath=objects.find(o=>o.type==='onsen' && o.id===data.lastBath)??null;
    lastPlace=null;berth=null;
    if(lastBath){
      const site=lastBath.retreat||lastBath.site;
      if(site?.shape==='suzuri' && player.activity==='bath' && !data.lastBathPlace){
        // Old journals could put a floating visitor underneath the present
        // grinding land. Keep the saved soak and move to its lower wet edge.
        const [u,v]=bathLocal(site,player.x,player.z);
        if(onSuzuriLand(u,v)){
          [player.x,player.z]=sitePoint(site,u,okaFront(u)+.63);
          player.y=groundHeight(player.x,player.z);
        }
      }
      const at=placeAt(lastBath);
      if(site && data.lastBathPlace){
        const [u,v]=bathLocal(site,player.x,player.z);
        const station=bathStations(site).find(q=>q.id===data.lastBathPlace && stationRadius(q,u,v)<=1.08);
        const pool=bathPools(site)?.find(q=>q.id===data.lastBathPlace && poolRadius(q,u,v)<=1.05);
        lastPlace=station??pool??null;
        // The old shore couches extended into today's divided working court.
        // Preserve a reclining traveller's named berth when it moved inland.
        if(!lastPlace && player.activity==='bath'){
          lastPlace=formerMatsuhamaSeat(site,data.lastBathPlace,u,v)??null;
          if(lastPlace){
            [player.x,player.z]=sitePoint(site,lastPlace.u,lastPlace.v);
            player.y=groundHeight(player.x,player.z);player.h=0;
          }
        }
        if(!lastPlace)lastBath=null;
      }else if(data.lastBathPlace===null && stillAtPlace(lastBath,null)){
        lastPlace=null;
      }else if(at!==false){
        lastPlace=at;
      }else if(site && player.activity==='bath' && bathPools(site) && bathRadius(site,player.x,player.z)<1.08){
        // A v12 bather may have been floating where there is now a dry aisle.
        const [u,v]=bathLocal(site,player.x,player.z);
        const choices=[...bathPools(site),...bathStations(site)].filter(q=>q.action!=='rinse');
        lastPlace=choices.reduce((a,b)=>Math.hypot(a.u-u,a.v-v)<Math.hypot(b.u-u,b.v-v)?a:b);
        [player.x,player.z]=sitePoint(site,lastPlace.u,lastPlace.v);
        player.y=groundHeight(player.x,player.z);
      }else lastBath=null;
    }
    if(player.activity==='bath' && !lastBath) {
      player.activity=null;
      player.activityTime=0;
    }
    if (p.skiff && !player.mount && !player.activity && !player.diveDepth) {
      passengerBoat=SKIFFS.find(boat=>boat.id===p.skiff) ?? null;
      if (passengerBoat) {
        player.skiff=passengerBoat.id;
        if (!canUseModeOnMount(player.mode)) player.mode='normal';
        rideSkiff(passengerBoat,state.time);
      }
    }
    updateRegion(false);
    return true;
  }
  const restored = restore(snapshot) === true;
  const notebook = createNotebook(restored ? snapshot.notebook : null);
  // Older scrolls have no sky seed. Give their existing journey a stable
  // migration, so a second import opens onto exactly the same stretch of sky.
  const savedSeed=restored ? snapshot.flightSeed : null;
  const validSeed=Number.isInteger(savedSeed) && savedSeed>=0 && savedSeed<=0xffffffff;
  state.flightSeed=restored ? (validSeed?savedSeed:0x82c6710b) : Math.floor(Math.random()*0x100000000);
  for(const n of npcs) {
    if(n.waterHare) updateWaterHare(n,state.time,player);
    else if(n.encounter) updateScrollResident(n,state.time);
    else if(n.scrollFauna) moveScrollFauna(n,state.time);
    else if(n.seaResident) updateRyuguResident(n,state.time);
    else if(SPECIES[n.type]) {
      if(legendary(n.type)) n.flightSeed=state.flightSeed;
      moveWildlife(n,state.time);
    }
  }
  updateHareRider(riverRider,state.time);
  refreshCrowd();
  return { state, act, step, nearest, teleport, save, restored, voyage, notebook, storyCollisions, restSite, waitUntil };
}
