// Story stations are surveyed against the original island. Retain their local
// metres when a district moves and take the walking floor from today's terrain.
import { locations, npcs as cast } from './mystery-data.js';
import { DISTRICT_SHIFT } from './geography.js';
import { BUILDINGS, groundHeight, terrainHeight, staticVolumeAt, wrapDelta } from './terrain.js';
import { COURT, COURT_GATE_Z } from './retreat-layout.js';
import { roomPlan,pagodaPlan } from './architecture.js';
import { updateHareRider } from './scroll-riders.js';
import { WEDDING_ROLES, weddingWalkerPose } from './pilgrimage-layout.js';
import { SPECIES,moveWildlife } from './bestiary.js';
import { createTravellerTalk } from './mystery-travellers.js';
import { SEA_SPECIES } from './ryugu-residents.js';
import { SCROLL_FAUNA } from './scroll-fauna.js';

// The witnesses work at these specific benches in the published story. A
// different candidate can otherwise win the distance tie when a forest moves.
const workstations={
  NPC_MASUME:{x:173,z:133}, NPC_YUKITSUZURI:{x:-59,z:-277},
  NPC_NAMISUKE:{x:-120,z:124}, NPC_YUKEMARU:{x:118,z:-123},
  NPC_AIZO:{x:274,z:-127}, NPC_SUZUNA:{x:-69,z:282},
  NPC_TAKEJI:{x:-103.41011170836231,z:-61.7052111399616,facing:2.2087},
};
export const storyResidentPosts = new Map(cast.filter(p=>p.sourceBinding.legacyId)
  .map(p=>[p.sourceBinding.legacyId,workstations[p.id]]));

const hall = {
  LOC_KYO_REQUEST: [-3.1, COURT_GATE_Z + 3.5],
  LOC_KYO_INTAKE: [3.5, COURT_GATE_Z - 5.4],
  LOC_KYO_COURT: [0, 2.8],
  LOC_KYO_JUDGE: [0, -5.5],
  LOC_KYO_WITNESS: [-4.8, 1.1],
};
const speciesNames = Object.fromEntries(Object.entries({ ...SPECIES, ...SEA_SPECIES, ...SCROLL_FAUNA })
  .map(([id, value]) => [id, value.label]));
Object.assign(speciesNames, { rabbit: '兎', frog: '蛙', turtle: 'ミツユビハコガメ' });
const terrainPoint = (x, z, floor) => ({ x, z, y: groundHeight(x, z, floor) });
const projected = (from, to, t) => ({
  x: from.x + t * wrapDelta(to.x - from.x),
  z: from.z + t * wrapDelta(to.z - from.z),
  y: from.y + t * (to.y - from.y),
});
function visible(from, to) {
  const length = Math.hypot(wrapDelta(to.x - from.x), to.y - from.y, wrapDelta(to.z - from.z));
  const steps = Math.ceil(length / .15);
  for (let i = 1; i < steps; i++) {
    const at = projected(from, to, i / steps);
    if (staticVolumeAt(at.x, at.z, at.y + .94, .035, .08)) return false;
  }
  return true;
}
function standAt(anchor, preferred, submerged) {
  function clear(p) {
    return Math.abs(p.y-anchor.y)<1.3 && !staticVolumeAt(p.x,p.z,p.y+.04,.27,1.42) && visible(p,anchor);
  }
  if (clear(preferred)) return preferred;
  const initial = Math.atan2(preferred.x-anchor.x, preferred.z-anchor.z);
  for (const radius of [1.65, 1.2, 2, .72]) for (let i=0; i<16; i++) {
    const a = initial + i*Math.PI/8;
    const x = anchor.x + radius*Math.sin(a), z = anchor.z + radius*Math.cos(a);
    const p = submerged ? {x,z,y:terrainHeight(x,z)+.45} : terrainPoint(x,z,anchor.y);
    if (clear(p)) return p;
  }
  return preferred;
}
function survey(location, bound) {
  const { id, regionId } = location;
  const shift = DISTRICT_SHIFT[regionId] || { x: 0, z: 0 };
  const a = location.position, b = location.interaction.playerStand;
  const submerged = location.yReference === 'seabed_offset';
  let x = a.x + shift.x, z = a.z + shift.z, floor;
  if (hall[id]) {
    x = COURT.x + hall[id][0];
    z = COURT.z + hall[id][1];
  } else if (bound?.area) {
    x = bound.homeX; z = bound.homeZ; floor = bound.y;
  } else if (location.floorBinding) {
    const f = location.floorBinding, cx = f.buildingCenter.x + shift.x, cz = f.buildingCenter.z + shift.z;
    const tower = BUILDINGS.find(building => building.kind === 'pagoda' && building.x === cx && building.z === cz);
    if (!tower) throw new Error('東塔の回廊が見つかりません');
    floor = tower.y + pagodaPlan(tower).storeys[f.storey].y;
    // The enlarged eave overlaps the old rail. The inner north-east bay is
    // connected to the stair landing and stays at the fifth storey's height.
    x = tower.x + 2.25*tower.cos - 2.14*tower.sin;
    z = tower.z - 2.25*tower.sin - 2.14*tower.cos;
  }
  const feet = (px,pz,dy=0) => submerged ? {x:px,z:pz,y:terrainHeight(px,pz)+.16+dy} : terrainPoint(px,pz,floor);
  const anchor = feet(x,z);
  let preferred = feet(x+b.x-a.x,z+b.z-a.z,.29);
  if (hall[id]) preferred = feet(x, z+1.75);
  if (bound?.area) {
    const direction=bound.room===undefined ? bound.heading : BUILDINGS[bound.room].yaw;
    preferred=feet(x+1.7*Math.sin(direction),z+1.7*Math.cos(direction));
  }
  const stand = standAt(anchor,preferred,submerged);
  const heading=Math.atan2(stand.x-x, stand.z-z);
  let furnishing=anchor, onWorkbench=false;
  if(bound?.room!==undefined) {
    const room=BUILDINGS[bound.room], bench=roomPlan(room).workbench;
    const u=bench.u-bench.width*.14, v=bench.v+bench.depth*.26;
    furnishing={x:room.x+u*room.cos+v*room.sin,z:room.z-u*room.sin+v*room.cos,
      y:room.y+.48+bench.height};
    onWorkbench=true;
  } else if(cast.some(p=>p.homeLocationId===id)) {
    for(const step of [1,-1]) {
      const point=feet(x+step*.94*Math.cos(heading),z-step*.94*Math.sin(heading));
      if(Math.abs(anchor.y-point.y)<.38 && !staticVolumeAt(point.x,point.z,point.y+.04,.32,1.0)){
        furnishing=point;break;
      }
    }
  }
  return { ...anchor, id, locationId:id, label:location.nameJa, regionId, stand, submerged,
    heading, furnishing,onWorkbench, radius:location.interaction.radiusMeters };
}

export function createMysteryWorld(gameState, mystery) {
  const travellerTalk = createTravellerTalk();
  const actorsById = new Map(gameState.npcs.map(entity=>[entity.id,entity]));
  const occupants = new Map();
  for (const person of cast) {
    const actor = actorsById.get(person.sourceBinding.legacyId);
    if (actor && person.species!==actor.type) throw new Error('人物の種類が一致しません '+person.id);
    if (actor && !occupants.has(person.homeLocationId)) occupants.set(person.homeLocationId,actor);
  }
  const stations = locations.map(l=>survey(l, occupants.get(l.id)));
  const stationById = new Map(stations.map(station=>[station.id,station]));
  const locate = id=>stationById.get(id);
  const homeOf = person=>{
    if (mystery.state.activeTrial) {
      if (person.id==='NPC_NAOKI') return 'LOC_KYO_JUDGE';
      if (person.id==='NPC_FUDEM') return 'LOC_KYO_WITNESS';
    }
    let home = person.homeLocationId;
    for (const next of person.locationOverrides) if (mystery.meets(next.condition)) home = next.locationId;
    return home;
  };
  // Bind the bride who is already walking the middle procession. The landing
  // also serves as a fixed place to call her over, without creating a double.
  function personAt(person) {
    const locationId=homeOf(person), station=locate(locationId);
    const actor=actorsById.get(person.sourceBinding.legacyId);
    let pose=actor || station;
    if (mystery.state.activeTrial) {
      // The clerk sits beside the magistrate; the claimant faces the witness.
      if (person.id==='NPC_NAOKI') pose=terrainPoint(station.x+2.45,station.z+.8,station.y);
      if (person.id==='NPC_FUDEM' && mystery.state.activeTrial!=='TR_C07')
        pose=terrainPoint(station.x+4.7,station.z-.1,station.y);
    }
    if (person.id==='NPC_KUZUHA') {
      const q=weddingWalkerPose(1,WEDDING_ROLES.indexOf('bride'),gameState.time);
      pose={...terrainPoint(q.x,q.z),heading:q.yaw};
    }
    return { npcId:person.id, legacyId:actor?.id, entity:actor, locationId,
      x:pose.x,y:pose.y,z:pose.z,heading:pose.heading,species:person.species,label:person.nameJa,
      role:person.roleJa, submerged:station.submerged, draw:!actor && person.id!=='NPC_KUZUHA' };
  }
  const rider = actorsById.get('rabbit-3'), deer = rider?.ridesDeer, tea = locate('LOC_RIVER_TEABENCH');
  let formerRoute;
  function update() {
    if (!deer || deer.id !== 'deer-623') return;
    // A scheduled stop during the rider's case uses the same two recipient
    // bodies and their normal seating animation in both physics and rendering.
    const stopped=mystery.state.status.C02==='active';
    if (stopped===Boolean(formerRoute)) return;
    if (stopped) {
      formerRoute={homeX:deer.homeX,homeZ:deer.homeZ,radius:deer.radius,trail:deer.trail,cruise:deer.cruise};
      Object.assign(deer,{homeX:tea.x,homeZ:tea.z,x:tea.x,y:tea.y,z:tea.z,radius:0,cruise:0,trail:null,speed:0});
      Object.assign(rider,{homeX:deer.x,homeZ:deer.z});
      updateHareRider(rider,gameState.time);
    } else {
      Object.assign(deer,formerRoute);
      moveWildlife(deer,gameState.time);
      updateHareRider(rider,gameState.time);
      Object.assign(rider,{homeX:deer.homeX,homeZ:deer.homeZ});
      formerRoute=null;
    }
  }

  function nearby() {
    update();
    const p=gameState.player, result=[];
    if (p.activity || p.mount || (!p.grounded && !p.diveDepth)) return result;
    function add(contact, radius, submerged) {
      if (submerged ? !(p.diveDepth>0) : !p.grounded) return;
      const dx=wrapDelta(contact.x-p.x), dz=wrapDelta(contact.z-p.z), dy=contact.y-p.y;
      if (Math.abs(dx)>radius || Math.abs(dz)>radius || Math.abs(dy)>radius) return;
      const distance=Math.hypot(dx,dy,dz);
      if (distance<=radius && visible(p,contact)) result.push({...contact,distance});
    }
    for (const station of stations) add(station,station.radius,station.submerged);
    for (const person of cast) {
      const here=personAt(person);
      add(here,2.85,here.submerged);
      if(person.id==='NPC_KUZUHA' && !result.some(x=>x.npcId===here.npcId)) {
        const meeting=locate(here.locationId);
        add({...here,x:meeting.x,y:meeting.y,z:meeting.z},meeting.radius,false);
      }
    }
    for (const n of gameState.nearbyNpcs) {
      if (storyResidentPosts.has(n.id) || n.mounted) continue;
      const submerged=n.y<-.8 && (n.seaResident || n.type==='fishfolk');
      add({entity:n, legacyId:n.id,locationId:null,label:speciesNames[n.type] || '里の住人',
        species:n.type,x:n.x,y:n.y,z:n.z},2.75,submerged);
    }
    for(const traveller of travellerTalk(gameState)) add({...traveller,locationId:null},2.75,false);
    return result.sort((a,b)=>a.distance-b.distance || (a.npcId||a.legacyId||a.locationId).localeCompare(b.npcId||b.legacyId||b.locationId));
  }
  update();
  return {locate, nearby, stations, people:()=>cast.map(personAt), update,
    solved:id=>mystery.state.status[id]==='resolved'};
}
