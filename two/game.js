import { pairRiverTravellers, updateHareRider } from './scroll-riders.js';
import { groundHeight, landscapeFloor, solidHeightAt, constrainMove, overheadHeight, canLand, REGIONS, regionAt, BOUND, waterDepth, wrapDelta, wrapCoord, waterSurfaceAt, SNOW_SPRING, TSUKIMI, springRadius, seasonAt } from './terrain.js';

import { POUNDING, POUNDING_CREW } from './festival.js';
import { prepareVillageRoutes, animalRadius, openGround, walkCircuit } from './village-paths.js';
import { procession } from './procession.js';
import { walkingScore } from './animal-motion.js';
import { SPECIES, wildlifeHomes, moveWildlife, recipientContact } from './bestiary.js';

const MAX_VITAL = 100;
const RISE_GRAVITY = 20;
const FALL_GRAVITY = 27;
const JUMP_SPEED = 11.7;
const STRETCH_SPEED = 16.5;
const FLIGHT_CLIMB = 5.6;
const JUMP_BUFFER = .12;
const LEDGE_GRACE = .085;
const CEILING = 120;
const SPEED = { foot: 6.4, dango: 23.6, turtle: 105, bike: 45.9, flight: 32, kagami: 19.2 };
// Seconds to build from walking pace to cruising speed on open ground.
const RUN_UP = { dango: 1.8, bike: 3.2, flight: 2.2, turtle: 3.4 };
const SWIFT_FACTOR = 1.42;
const MAX_TRAVEL_SPEED = SPEED.turtle * SWIFT_FACTOR + .01;
const STAMP_RADIUS = 6;
const SEASONAL_STOPS = {
  snow: ['onsen','sake'], autumn: ['manga','haramaki'], moon: ['sake','manga'], dawn: ['ramen','haramaki']
};
const MODE_COST = { normal: 0, dango: 7, kusa: 6, kinako: 6, habutae: 10, kagami: 0 };
const MODE_DRAIN = { normal: 0, dango: 2.1, kusa: 1.5, kinako: 1.75, habutae: 2.75, kagami: 0 };
const MODE_NAME = { normal: 'ふつうのお餅', dango: '団子モード', kusa: '草餅', kinako: 'きなこ餅', habutae: '羽二重餅', kagami: '鏡餅' };
const NOTICE_FORWARD = [0], NOTICE_FAN = [-.28, 0, .28];
const ring = count => Array.from({ length: count }, (_, i) => i * (Math.PI * 2 / count));
const EIGHT_NOTICES = ring(8), FULL_KINAKO = ring(24);
const BUFF_TIME = { warm: 20, swift: 24, drunk: 18, full: 29, wrap: 24 };
const PICKUP_ACTION = {
  manga: { activity: 'read', duration: 2.3, label: '漫画を読む' },
  sake: { activity: 'drink', duration: 2.2, label: '日本酒を飲む' },
  ramen: { activity: 'eat', duration: 2.8, label: '背脂ラーメンを食べる' },
  tsukimi: { activity: 'tsukimi', duration: 2.6, label: '月見団子を食べる' },
  onsen: { activity: 'bath', duration: 3.5, label: '温泉に入る' },
  haramaki: { label: '腹巻きを巻く' }
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const distance = (a, b) => Math.hypot(wrapDelta(a.x - b.x), wrapDelta(a.z - b.z));

function makeWorld() {
  const objects = [];
  const npcs = [];
  function object(type, x, z, heading = 0) {
    const landmark = { id: type + '-' + objects.length, type, x, z, y: groundHeight(x, z), heading, active: true, cooldown: 0 };
    if (type === 'port') landmark.bikes = 2;
    objects.push(landmark);
  }
  function npc(type, role, x, z, phase, side = 1) {
    const heading = role === 'sumo' ? side * Math.PI / 2 : phase;
    npcs.push({
      id: type + '-' + npcs.length, type, role, x, z, y: groundHeight(x, z), homeX: x, homeZ: z,
      phase, side, heading, speed: 0, flash: 0, mounted: false
    });
  }
  REGIONS.forEach(({ id, x, z }, i) => {
    if (SEASONAL_STOPS[id]) {
      const [first, second] = SEASONAL_STOPS[id];
      object(first, x - 13, z - 9);
      object(second, x + 6, z + 14);
      object('port', x + 12, z + 5);
      if (id==='dawn') {
        const c=Math.cos(POUNDING.yaw), s=Math.sin(POUNDING.yaw);
        for (const member of POUNDING_CREW) {
          npc(member.type, member.role, POUNDING.x+c*member.u+s*member.v, POUNDING.z-s*member.u+c*member.v, 0);
          npcs.at(-1).atMortar=true;
          npcs.at(-1).y=groundHeight(POUNDING.x,POUNDING.z)+.012;
        }
      } else {
        npc('rabbit', 'wander', x - 7, z - 12, i + 1.4);
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
  objects.at(-1).grand = true;
  object('tsukimi',TSUKIMI.x,TSUKIMI.z,TSUKIMI.yaw);
  for (const visitor of procession(objects,npcs)) {
    const {type,role,x,z,phase} = visitor;
    npc(type,role,x,z,phase);
    Object.assign(npcs.at(-1), visitor, { heading:visitor.facing });
  }
  for (const visitor of wildlifeHomes([...objects,...npcs])) {
    const {type,role,x,z,phase}=visitor;
    npc(type,role,x,z,phase);
    Object.assign(npcs.at(-1),visitor);
  }
  prepareVillageRoutes(npcs,objects);
  for(const n of npcs) if(SPECIES[n.type]) moveWildlife(n,0);
  return { objects, npcs };
}

export function createGame(snapshot = null) {
  const { objects, npcs } = makeWorld();
  const riverRider = pairRiverTravellers(npcs);
  const turtle = npcs.find(n => n.type === 'turtle');
  const player = {
    x: 0, z: 62, y: groundHeight(0,62), h: 0, vx: 0, vz: 0, vy: 0, speed: 0, heading: 0,
    grounded: true, hp: MAX_VITAL, mp: MAX_VITAL, mode: 'normal', mount: null, activity: null,
    activityTime: 0, idleTime: 0, airStretch: 0, inWater: false, night: false, stretch: 0, landing: 0, impact: 0, throwTime: 0, invulnerable: 0,
    buffs: { warm: 0, swift: 0, drunk: 0, full: 0, wrap: 0 }
  };
  const region = REGIONS[regionAt(player.x,player.z)];
  const state = {
    time: 0, player, npcs, nearbyNpcs: [], objects, shots: [], events: [], score: 0,
    delivered: new Set(), recipientTotal:npcs.length, kagamiUnlocked:false,
    region: region.name, regionId: region.id, visited: [region.id]
  };
  const climate = {};
  let heldJump = false;
  let bufferedJump = 0;
  let ledgeGrace = 0;
  let lastBath = null;
  let shotId = 0;
  let throwCooldown = 0;
  let turtlePause = 0;
  let turtleLeg = 0;

  function emit(type, data) {
    if (state.events.length >= 160) state.events.shift();
    state.events.push({ type, x: player.x, y: player.y, z: player.z, h: player.h, ...data });
  }
  function say(text) { emit('say', { text }); }
  function message(text) { emit('message', { text }); }
  function sound(name) { emit('sound', { name }); }
  function protectedVitals() { return player.buffs.warm > 0 || player.buffs.wrap > 0; }
  function spendMP(cost) {
    if (player.buffs.full > 0 || protectedVitals()) return true;
    if (player.mp < cost) return false;
    player.mp -= cost;
    return true;
  }
  function gap(target) { return distance(player, target); }
  function nearest() {
    if (player.activity || !player.grounded) return null;
    if (player.mount === 'turtle') return { target: turtle, label: 'カメから降りる', action: 'dismount', distance: 0 };
    let best = null;
    for (const target of [...objects, turtle]) {
      if (!target.active && target !== turtle) continue;
      const distance = gap(target);
      if (Math.abs(target.y-player.y)>2.2) continue;
      let label;
      let radius;
      if (target.type === 'port') {
        label = player.mount === 'bike' ? 'ポートに返す' : '電動自転車に乗る';
        if (!target.bikes && !player.mount) continue;
        radius = 3.1;
      } else if (player.mount) {
        continue;
      } else if (target.type === 'turtle') {
        label = 'カメに乗る'; radius = 2.8;
      } else if (PICKUP_ACTION[target.type] && target !== lastBath) {
        label = PICKUP_ACTION[target.type].label;
        radius = target.grand ? (springRadius(player.x,player.z)<.88 ? SNOW_SPRING.rx : 0) : target.type === 'onsen' ? 3.1 : 2.2;
        if(target.grand) label='雪見の大露天風呂につかる';
      } else {
        continue;
      }
      if (distance <= radius && (!best || distance < best.distance)) {
        best = { target, label, action: player.mount ? 'dismount' : 'interact', distance };
      }
    }
    return best;
  }
  function beginActivity(activity, duration) {
    player.activity = activity;
    player.activityTime = duration;
    if (activity !== 'fall') player.vx = player.vz = player.speed = 0;
  }
  function collect(target) {
    if (target.type === 'onsen') {
      lastBath = target;
      if (!target.grand) {
        player.x = target.x; player.z = target.z; player.y = target.y;
      }
      player.h = player.vy = 0;
      player.grounded = true;
      sound('bath');
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
      beginActivity(pickup.activity, pickup.duration);
      const lines = { tsukimi: '満月を眺めながら、月見団子をひとくち。', bath: 'ほかほかの湯に、ひと休み。', read: '夢中で漫画を読んでいる。', drink: '日本酒をごくごく。', eat: '背脂ラーメンをもぐもぐ。' };
      message(lines[pickup.activity]);
    }
  }
  function finishActivity() {
    const activity = player.activity;
    player.activity = null;
    player.activityTime = 0;
    switch (activity) {
      case 'bath':
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
  function jump() {
    if (player.activity) return false;
    const footLaunch = player.grounded || ledgeGrace > 0;
    if (!footLaunch) {
      // Each fresh press pulls out more dough. A wingbeat still lifts the
      // flying mochi after its body has reached full extension.
      const before = player.airStretch;
      player.airStretch = Math.min(1, before + 0.23);
      player.vy += (player.airStretch - before) * 8;
      player.stretch = .23;
      if (!player.mount && player.mode === 'habutae') {
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
  function dismount() {
    if (player.activity || !player.mount || !player.grounded) return false;
    if (player.mount === 'bike') {
      const port = nearest();
      if (!port || port.target.type !== 'port') {
        message('電動自転車はポートで返そう。'); return false;
      }
      port.target.bikes++;
      message('電動自転車を返した。');
    } else {
      turtle.mounted = false;
      const position = constrainMove(player.x, player.z, player.x - Math.sin(player.heading), player.z - Math.cos(player.heading), 0, player.y,animalRadius(turtle));
      turtle.x = turtle.homeX = position.x;
      turtle.z = turtle.homeZ = position.z;
      turtle.y = groundHeight(turtle.x,turtle.z);
      turtleLeg = 0;
      turtlePause = 1.5;
      message('カメからそっと降りた。');
    }
    player.mount = null;
    player.speed = player.vx = player.vz = 0;
    sound('dismount');
    return true;
  }
  function interact() {
    if (player.mount) return dismount();
    const found = nearest();
    if (!found) return false;
    const target = found.target;
    if (target === turtle) {
      if (player.buffs.full > 0) {
        message('カメが首を引っ込めた。満腹のお餅はちょっと重い。'); return false;
      }
      player.mount = 'turtle';
      turtle.mounted = true;
      message('ミツユビハコガメに乗った！');
    } else if (target.type === 'port') {
      if (target.bikes < 1) return false;
      target.bikes--;
      player.mount = 'bike';
      message('電動自転車で出発。次のポートで返せる。');
    } else {
      collect(target);
      return true;
    }
    changeMode('normal');
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
    const height = player.mount === 'turtle' ? 1.98 : player.mount ? 1.45 : player.buffs.full > 0 ? 1.30 : .93;
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
  function changeMode(mode) {
    const leavingGrass = player.mode === 'kusa';
    player.mode = mode;
    if (!leavingGrass && mode !== 'kusa') return;
    if (leavingGrass) {
      // Find room for the whole mochi if the last point of MP expires inside a trunk or wall.
      const fits = (x,z) => {
        const floor = groundHeight(x,z,player.y);
        const feet = Math.max(player.y,floor);
        return floor <= player.y + .52 && solidHeightAt(x,z,.26,feet) <= feet + .34 &&
          overheadHeight(x,z,feet) >= feet + 1.66 * (player.buffs.full > 0 ? 1.28 : 1);
      };
      if (!fits(player.x,player.z)) {
        let found = false;
        for (let r=.35; !found && r<=20; r+=.35) {
          const directions = Math.ceil(2*Math.PI*r/.5);
          for (let i=0; i<directions; i++) {
            const a = player.heading + 2*Math.PI*i/directions;
            const x = wrapCoord(player.x + r*Math.sin(a)), z = wrapCoord(player.z + r*Math.cos(a));
            if (!fits(x,z)) continue;
            player.x=x; player.z=z; found=true;
            break;
          }
        }
      }
    }
    const floor = mode === 'kusa' ? landscapeFloor(player.x,player.z) : groundHeight(player.x,player.z,player.y);
    player.y = Math.max(floor,player.y);
    player.h = player.y-floor;
    player.grounded = player.h <= .001 && player.vy <= 0;
  }
  function act(action, facing) {
    if (action === 'jump') { heldJump = true; return jump(); }
    if (action === 'throw') return throwNotice(facing);
    if (action === 'dismount') return dismount();
    if (action === 'interact') return interact();
    if (!Object.hasOwn(MODE_COST, action) || player.activity) return false;
    if (player.mount) { message('変身するときは、乗り物から降りよう。'); return false; }
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
    // Its first stop is the sheltered nook between the two riverbank rocks.
    const route = [[-5,-4],[-3,-7],[2,-4],[0,0]];
    const [dx,dz] = route[turtleLeg];
    const tx = wrapDelta(turtle.homeX + dx - turtle.x), tz = wrapDelta(turtle.homeZ + dz - turtle.z);
    const length = Math.hypot(tx,tz);
    turtle.role = 'wander';
    if (length < .16) {
      turtlePause = turtleLeg === 0 ? 11 : 2.5;
      turtleLeg = (turtleLeg + 1) % route.length;
      return;
    }
    turtle.heading = Math.atan2(tx,tz);
    const step = Math.min(length, Math.min(2.3, turtle.speed + 1.8 * dt) * dt);
    const x=turtle.x+tx/length*step, z=turtle.z+tz/length*step;
    const at=openGround(x,z,animalRadius(turtle)) ? {x,z} : turtle;
    turtle.speed = distance(turtle,at) / dt;
    turtle.x = at.x; turtle.z = at.z; turtle.y = groundHeight(at.x,at.z);
    if (turtle.speed < .015) { turtlePause = 5; turtleLeg = (turtleLeg+1) % route.length; }
  }
  // Include both the width of a cell and the roaming range around each home.
  let crowdCellX, crowdCellZ;
  function refreshCrowd() {
    const cx=Math.floor(player.x/32), cz=Math.floor(player.z/32);
    if (cx===crowdCellX && cz===crowdCellZ) return;
    crowdCellX=cx; crowdCellZ=cz;
    const cellX=(cx+.5)*32, cellZ=(cz+.5)*32;
    state.nearbyNpcs=npcs.filter(n=>{
      if(n===turtle || n.type==='dragon')return true;
      // A crane's ellipse can swing two radii away from its original perch.
      // Stream the whole route before its edge reaches the 128 m view radius.
      const reach=n.type==='bird' ? 128+16+2*n.radius : n.type==='kirin' ? 165 : 150;
      return Math.abs(wrapDelta(n.homeX-cellX))<reach && Math.abs(wrapDelta(n.homeZ-cellZ))<reach;
    });
  }
  const streetScore={};
  function updateNPCs(dt) {
    moveTurtle(dt);
    refreshCrowd();
    for (const n of state.nearbyNpcs) {
      n.flash = Math.max(0, n.flash - dt);
      if (n === turtle || n.atMortar || n.ridesDeer) continue;
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
  }
  function updateShots(dt) {
    for (let i=state.shots.length-1;i>=0;i--) {
      const shot = state.shots[i];
      const dx = Math.sin(shot.heading), dz = Math.cos(shot.heading);
      const length = 18 * dt;
      let hit = null;
      let first = Infinity;
      for (const n of state.nearbyNpcs) {
        if(n.mounted) continue;
        const along=recipientContact(n,shot,dx,dz,length);
        if(along<first) { first=along; hit=n; }
      }
      shot.x = wrapCoord(shot.x + dx*length); shot.z = wrapCoord(shot.z + dz*length);
      shot.age += dt; shot.life -= dt;
      if (hit) {
        const points=SPECIES[hit.type]?.points ?? 10;
        hit.flash=.58; state.score+=points;
        state.delivered.add(hit.id);
        emit('score', { value:points, text:'+'+points, x:hit.x, z:hit.z, y:shot.y+1 });
        sound('score');
        if (!state.kagamiUnlocked && state.delivered.size===state.recipientTotal) {
          state.kagamiUnlocked=true;
          message('全員に三条通知が届いた！ 鏡餅に変身できるようになった。');
          sound('pickup');
        }
      }
      if (hit || shot.life <= 0 || shot.y < groundHeight(shot.x,shot.z)-.15) state.shots.splice(i,1);
    }
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
    if (!player.mount && player.mode === 'habutae' && !player.grounded) pace = 'flight';
    const waterDrag = player.inWater && !player.mount ? .72 : 1;
    const modifier = waterDrag * (player.buffs.swift>0 ? SWIFT_FACTOR : 1) * (player.buffs.full>0 ? .81 : 1);
    const speed = SPEED[pace] * modifier;
    if (dx || dz) player.heading = Math.atan2(dx,dz);
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
    const x = player.x+player.vx*dt, z = player.z+player.vz*dt;
    const phasing = player.mode === 'kusa';
    const at = phasing ? { x:wrapCoord(x), z:wrapCoord(z) } : constrainMove(player.x,player.z,x,z,player.h,player.y,player.mount==='turtle' ? animalRadius(turtle) : undefined);
    player.vx = wrapDelta(at.x-player.x)/dt;
    player.vz = wrapDelta(at.z-player.z)/dt;
    player.speed = Math.hypot(player.vx,player.vz);
    player.x = at.x; player.z = at.z;
    const floor = phasing ? landscapeFloor(at.x,at.z) : groundHeight(at.x,at.z,player.y);
    const ceiling = phasing ? Infinity : overheadHeight(at.x,at.z,player.y);
    const wasGrounded = player.grounded;
    if (player.grounded && floor >= player.y-.32 && player.vy<=0) player.y = floor;
    if (player.mode==='habutae' && !player.mount && input.jump && !player.activity) {
      // Ease out of the stronger takeoff into a steady wing-powered climb.
      player.vy = player.vy > FLIGHT_CLIMB
        ? Math.max(FLIGHT_CLIMB,player.vy-RISE_GRAVITY*dt)
        : Math.min(FLIGHT_CLIMB,player.vy+25*dt);
    } else {
      player.vy -= (player.vy > 0 ? RISE_GRAVITY : FALL_GRAVITY)*dt;
    }
    player.y += player.vy*dt;
    const bodyHeight = (1.66 + player.airStretch * 1.07) * (player.buffs.full > 0 ? 1.28 : 1);
    const seat = player.mount === 'turtle' ? 1.04 : player.mount === 'bike' ? .9 : 0;
    const headroom = Math.max(floor, ceiling - bodyHeight - seat);
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
    } else if (player.h >= CEILING) {
      player.y = floor + CEILING; player.vy = Math.min(0,player.vy);
    }
  }
  function checkContact() {
    if (lastBath && (lastBath.grand ? springRadius(player.x,player.z)>1 : gap(lastBath)>3.35)) lastBath=null;
    if (player.activity || player.h > 1.15 || player.mode === 'kusa') return;
    if (!player.mount && player.grounded) {
      for (const o of objects) {
        if (!o.grand && o.type !== 'tsukimi' && o.active && PICKUP_ACTION[o.type] && o !== lastBath && Math.abs(player.y-o.y)<1.6 &&
            gap(o) <= (o.type === 'onsen' ? 1.55 : .83)) { collect(o); return; }
      }
    }
    if (player.invulnerable > 0) return;
    for (const n of state.nearbyNpcs) {
      if (n.area || n.atMortar || n === turtle || Math.abs(n.y-player.y) > 1.25 || gap(n) > (player.buffs.full ? 1.07 : .84)) continue;
      player.invulnerable = 2.1;
      if (!protectedVitals()) player.hp = Math.max(0,player.hp-7);
      if (player.hp === 0) {
        player.mode = 'normal'; player.grounded = true; player.h = player.vy = 0;
        player.y = groundHeight(player.x,player.z,player.y);
        beginActivity('sleep',5);
        message('お餅はその場で、すやすや眠った。'); sound('sleep');
      } else {
        const dx = player.x-n.x, dz = player.z-n.z;
        const length = Math.hypot(dx,dz);
        player.vx = (length ? dx/length : -Math.sin(player.heading))*3.6;
        player.vz = (length ? dz/length : -Math.cos(player.heading))*3.6;
        beginActivity('fall',.68); sound('bump');
      }
      break;
    }
  }
  function updateRegion(collectStamp) {
    const region = REGIONS[regionAt(player.x,player.z)];
    state.region = region.name; state.regionId = region.id;
    player.night = seasonAt(player.x,player.z,climate).moon > .48;
    player.inWater = player.grounded && waterDepth(player.x,player.z) > .14 && player.y < waterSurfaceAt(player.x,player.z) - .08;
    if (!collectStamp || state.visited.includes(region.id) || distance(player,region)>STAMP_RADIUS || player.h>3) return;
    state.visited.push(region.id);
    const text = state.visited.length === REGIONS.length ? '十景踏破！ 旅の印がすべて揃った。' : region.name+'の旅の印をもらった。';
    emit('stamp',{ id:region.id, text }); message(text); sound('pickup');
  }
  function teleport(x, z) {
    if (!state.kagamiUnlocked || player.mode !== 'kagami' || player.activity || player.mount ||
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
      speed:0, grounded:true, airStretch:0, stretch:0, impact:0, landing:0, invulnerable:.8});
    lastBath = null;
    bufferedJump = ledgeGrace = 0;
    refreshCrowd();
    updateRegion(true);
    sound('mode');
    message('鏡餅が絵巻をひとっ飛び。');
    return true;
  }
  function advance(dt, input) {
    state.time += dt;
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
      if (player.activity === 'bath') {
        player.hp = Math.min(MAX_VITAL, player.hp + dt * 26);
        player.mp = Math.min(MAX_VITAL, player.mp + dt * 26);
      }
      if (player.activityTime <= 0) finishActivity();
    }
    updateMotion(dt, input);
    updateNPCs(dt);
    updateShots(dt);
    checkContact();
    updateRegion(true);
  }
  function step(elapsed, input = {}) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return;
    if (input.jump && !heldJump) jump();
    heldJump = !!input.jump;
    // Bounded substeps preserve contacts, landings and projectiles on a slow frame.
    let remaining = Math.min(.1, elapsed);
    while (remaining > .000001) {
      const dt = Math.min(1 / 60, remaining);
      advance(dt, input);
      remaining -= dt;
    }
  }

  function save() {
    return {
      version: 4, kagamiUnlocked: state.kagamiUnlocked, time: state.time, score: state.score, visited: [...state.visited], delivered:[...state.delivered],
      player: { ...player, buffs: { ...player.buffs } },
      items: objects.map(o => o.cooldown),
      bikes: objects.filter(o => o.type === 'port').map(o => o.bikes),
      turtle: { x:turtle.x, z:turtle.z, homeX:turtle.homeX, homeZ:turtle.homeZ, pause:turtlePause, leg:turtleLeg },
      lastBath: lastBath?.id ?? null
    };
  }
  function restore(data) {
    const finite = (n,min,max) => Number.isFinite(n) && n>=min && n<=max;
    const point = (x,z) => finite(x,-BOUND,BOUND) && finite(z,-BOUND,BOUND);
    if (!data || ![2,3,4].includes(data.version) || !data.player || !data.turtle || !Array.isArray(data.visited)) return;
    const p = data.player, t = data.turtle;
    const ports = objects.filter(o=>o.type==='port');
    // The original six districts occupy the prefix of the inventory. New
    // stops start stocked even when an old journey resumes on a borrowed bike.
    const old = data.version === 2;
    const savedPorts = old ? 6 : ports.length;
    const validItemCounts = old ? [36] : [48,objects.length];
    if (!finite(data.time,0,1e9) || !Number.isSafeInteger(data.score) || data.score<0 ||
        !data.visited.every(id=>REGIONS.some(region=>region.id===id)) ||
        !point(p.x,p.z) || !finite(p.h,0,CEILING) || !finite(p.y,-80,200) ||
        !finite(p.vx,-MAX_TRAVEL_SPEED,MAX_TRAVEL_SPEED) || !finite(p.vz,-MAX_TRAVEL_SPEED,MAX_TRAVEL_SPEED) || !finite(p.vy,-135,27) ||
        !finite(p.speed,0,MAX_TRAVEL_SPEED) || !finite(p.heading,-Math.PI,Math.PI) || typeof p.grounded!=='boolean' ||
        !finite(p.hp,0,100) || !finite(p.mp,0,100) || !Object.hasOwn(MODE_COST,p.mode) ||
        ![null,'turtle','bike'].includes(p.mount) || ![null,'fall','sleep','bath','read','drink','eat','tsukimi'].includes(p.activity) ||
        !finite(p.activityTime,0,6) || !p.buffs || !Object.keys(BUFF_TIME).every(k=>finite(p.buffs[k],0,BUFF_TIME[k])) ||
        ![p.stretch,p.invulnerable,p.throwTime].every(n=>finite(n,0,3)) ||
        !Array.isArray(data.items) || !validItemCounts.includes(data.items.length) || !data.items.every(n=>finite(n,0,65)) ||
        !Array.isArray(data.bikes) || data.bikes.length!==savedPorts ||
        !data.bikes.every(n=>Number.isInteger(n)&&finite(n,0,savedPorts*2)) ||
        data.bikes.reduce((total,n)=>total+n,p.mount==='bike'?1:0)!==savedPorts*2 ||
        !point(t.x,t.z) || !point(t.homeX,t.homeZ) || !finite(t.pause,0,12) ||
        !Number.isInteger(t.leg) || !finite(t.leg,0,3)) return;
    for (const key of Object.keys(player)) {
      if (!['idleTime','buffs','landing','impact','airStretch','night','inWater'].includes(key)) player[key]=p[key];
    }
    // These short pose cues were added after the first version-two saves.
    player.airStretch = !player.grounded && finite(p.airStretch,0,1) ? p.airStretch : 0;
    player.landing = finite(p.landing,0,.25) ? p.landing : 0;
    player.impact = finite(p.impact,0,1) ? p.impact : 0;
    for (const key of Object.keys(BUFF_TIME)) player.buffs[key]=p.buffs[key];
    if (player.mode === 'kusa') {
      const floor = landscapeFloor(player.x,player.z);
      // Older saves can start on a roof. Resume from the saved altitude and fall through it.
      player.h = clamp(p.y-floor,0,CEILING);
      player.y = floor+player.h;
      player.grounded = player.h <= .001 && player.vy <= 0;
    } else player.y = groundHeight(player.x,player.z,p.y - p.h)+player.h;
    // Older journals recorded points without identifying recipients. The score survives.
    const ids=new Set(npcs.map(n=>n.id));
    if(Array.isArray(data.delivered)) state.delivered=new Set(data.delivered.filter(id=>ids.has(id)));
    // The first 623 stable recipient IDs make up the complete third-edition scroll.
    // Keep an earned transformation when that traveller opens the new pages.
    const previousReward = (data.version === 3 || data.kagamiUnlocked === true) &&
      npcs.slice(0,623).every(n => state.delivered.has(n.id));
    state.kagamiUnlocked = state.delivered.size === state.recipientTotal || previousReward;
    if(player.mode==='kagami' && !state.kagamiUnlocked) player.mode='normal';
    state.score=data.score; state.time=data.time;
    state.visited=[...new Set(data.visited)];
    objects.forEach((o,i)=>{o.cooldown=data.items[i] ?? 0; o.active=o.cooldown===0;});
    ports.forEach((o,i)=>{o.bikes=data.bikes[i] ?? 2;});
    Object.assign(turtle, {x:t.x,z:t.z,homeX:t.homeX,homeZ:t.homeZ,y:groundHeight(t.x,t.z),mounted:p.mount==='turtle'});
    turtlePause=t.pause; turtleLeg=t.leg;
    lastBath=objects.find(o=>o.type==='onsen' && o.id===data.lastBath)??null;
    updateRegion(false);
    return true;
  }
  const restored = restore(snapshot) === true;
  refreshCrowd();
  return { state, act, step, nearest, teleport, save, restored };
}
