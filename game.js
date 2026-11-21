export const WORLD_WIDTH = 24000;
export const REGION_WIDTH = 4000;

const MAX_VITAL = 100;
const DEPTH_SCALE = 220;
const GRAVITY = 1080;
const MODE_COST = { normal: 0, dango: 7, kusa: 6, kinako: 6, habutae: 10 };
const MODE_DRAIN = { normal: 0, dango: 4.2, kusa: 3, kinako: 3.5, habutae: 5.5 };
const MODE_NAME = { normal: 'ふつうのお餅', dango: '団子モード', kusa: '草餅', kinako: 'きなこ餅', habutae: '羽二重餅' };
const BUFF_TIME = { warm: 20, swift: 24, drunk: 18, full: 29, wrap: 24 };
const PICKUP_ACTION = {
  manga: { activity: 'read', duration: 2.3, label: '漫画を読む' },
  sake: { activity: 'drink', duration: 2.2, label: '日本酒を飲む' },
  ramen: { activity: 'eat', duration: 2.8, label: '背脂ラーメンを食べる' },
  onsen: { activity: 'bath', duration: 3.5, label: '温泉に入る' },
  haramaki: { label: '腹巻きを巻く' }
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = x => ((x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
export const worldDelta = (to, from) => wrap(to - from + WORLD_WIDTH / 2) - WORLD_WIDTH / 2;

function makeWorld() {
  const objects = [];
  const npcs = [];
  function object(type, x, z, extra = {}) {
    objects.push({ id: type + '-' + objects.length, type, x, z, h: 0, active: true, cooldown: 0, ...extra });
  }
  function npc(type, role, x, z, phase, side = 1) {
    npcs.push({
      id: type + '-' + npcs.length, type, role, x, z, h: 0, homeX: x, homeZ: z,
      phase, side, facing: side, speed: 0, flash: 0, mounted: false
    });
  }
  for (let region = 0; region < 6; region++) {
    const start = region * REGION_WIDTH;
    // Each district has a distinct itinerary. The first starts beside the river.
    const offsets = [
      [120,1045,2590,3200,3610,2180,1340,1900],
      [2560,650,3415,1650,2080,400,1150,3030],
      [1250,2830,1790,530,3600,2230,825,3260],
      [3460,2420,700,1850,1300,120,2860,3730],
      [530,1830,3000,3480,2260,1160,1450,2650],
      [2200,3400,230,1390,2720,3650,850,1840]
    ][region];
    const [spring, book, sake, ramen, wrapItem, port, lowShelf, highShelf] = offsets;
    object('onsen', start + spring, .32);
    object('manga', start + book, .68);
    object('sake', start + sake, .40);
    object('ramen', start + ramen, .63);
    object('haramaki', start + wrapItem, .53);
    object('port', start + port, .56, { bikes: 2 });
    object('ledge', start + lowShelf, .45, { h: 74, width: 154 });
    object('ledge', start + highShelf, .34, { h: 138, width: 190 });
    npc('rabbit', 'porter', start + 345, .72, region * .7 + .2);
    const sumoX = start + 888 + (region % 3) * 103;
    npc('frog', 'sumo', sumoX - 22, .32, region, 1);
    npc(region % 2 ? 'rabbit' : 'frog', 'sumo', sumoX + 22, .32, region, -1);
    npc('rabbit', 'wander', start + 1530, .43, region + 1.7);
    npc('frog', 'porter', start + 2360, .69, region + 2.4, -1);
    npc('rabbit', 'sumo', start + 2920, .38, region + 2, 1);
    npc('frog', 'sumo', start + 2964, .38, region + 2, -1);
    npc('frog', 'wander', start + 3740, .68, region + 1.1);
  }
  npc('turtle', 'wander', 1620, .76, 0);
  return { objects, npcs };
}

export function createGame(snapshot = null) {
  const { objects, npcs } = makeWorld();
  const turtle = npcs.find(npc => npc.type === 'turtle');
  const player = {
    x: 600, z: .53, h: 0, vx: 0, vy: 0, facing: 1, grounded: true,
    hp: MAX_VITAL, mp: MAX_VITAL, mode: 'normal', mount: null, activity: null,
    activityTime: 0, stretch: 0, throwTime: 0, invulnerable: 0,
    buffs: { warm: 0, swift: 0, drunk: 0, full: 0, wrap: 0 }
  };
  const state = { time: 0, player, npcs, objects, shots: [], events: [], score: 0, visited: [0], region: 0 };
  let throwCooldown = 0;
  let lastBath = null;
  let heldJump = false;
  let shotId = 0;
  let turtlePause = 0;
  let turtleRestedAt = null;

  function emit(type, data) {
    if (state.events.length >= 160) state.events.shift();
    state.events.push({ type, x: player.x, z: player.z, h: player.h, ...data });
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
  function gap(target) {
    return Math.hypot(worldDelta(target.x, player.x), (target.z - player.z) * DEPTH_SCALE);
  }
  function nearest() {
    if (player.activity || !player.grounded) return null;
    if (player.mount === 'turtle') return { target: turtle, label: 'カメから降りる', action: 'dismount', distance: 0 };
    if (player.h > 50) return null;
    let best = null;
    for (const target of [...objects, turtle]) {
      if (!target.active && target !== turtle) continue;
      const distance = gap(target);
      let label;
      let radius;
      if (target.type === 'port') {
        label = player.mount === 'bike' ? 'ポートに返す' : '電動自転車に乗る';
        if (!target.bikes && !player.mount) continue;
        radius = 88;
      } else if (player.mount) {
        continue;
      } else if (target.type === 'turtle') {
        label = 'カメに乗る'; radius = 72;
      } else if (PICKUP_ACTION[target.type] && target !== lastBath) {
        label = PICKUP_ACTION[target.type].label;
        radius = target.type === 'onsen' ? 88 : 68;
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
    if (activity !== 'fall') player.vx = 0;
  }
  function collect(target) {
    if (target.type === 'onsen') {
      lastBath = target;
      player.x = target.x;
      player.z = target.z;
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
      const lines = { bath: 'ほかほかの湯に、ひと休み。', read: '夢中で漫画を読んでいる。', drink: '日本酒をごくごく。', eat: '背脂ラーメンをもぐもぐ。' };
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
        message('満腹！ 三条通知が一度に三方向へ飛ぶ。');
        break;
      case 'sleep':
        player.hp = MAX_VITAL;
        player.invulnerable = 2;
        message('ぐっすり眠って、元気いっぱい！');
        break;
    }
  }
  function jump() {
    if (player.activity || (!player.grounded && player.mode !== 'habutae')) return false;
    if (!player.grounded && player.vy > 100) return false;
    const stretch = !player.mount && player.mode === 'dango';
    player.vy = stretch ? 633 : player.mode === 'habutae' && !player.mount ? 325 : 405;
    player.grounded = false;
    player.stretch = stretch ? .58 : .20;
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
      turtle.x = wrap(player.x - player.facing * 32);
      turtle.z = player.z;
      turtle.h = 0;
      turtle.homeZ = player.z;
      turtlePause = 1.5;
      message('カメからそっと降りた。');
    }
    player.mount = null;
    player.vx = 0;
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
    player.mode = 'normal';
    sound('mount');
    return true;
  }
  function throwNotice() {
    if (player.activity || throwCooldown > 0) return false;
    throwCooldown = .33;
    player.throwTime = .28;
    for (const angle of player.buffs.full > 0 ? [-.21, 0, .21] : [0]) {
      state.shots.push({
        id: 'shot-' + (++shotId), type: 'notice', x: wrap(player.x + 18 * player.facing), z: player.z,
        h: player.h + 34, facing: player.facing, angle, life: 1.35, age: 0
      });
    }
    say('三条通知！'); sound('throw');
    return true;
  }
  function act(action) {
    if (action === 'jump') return jump();
    if (action === 'throw') return throwNotice();
    if (action === 'dismount') return dismount();
    if (action === 'interact') return interact();
    if (!Object.hasOwn(MODE_COST, action) || player.activity) return false;
    if (player.mount) { message('変身するときは、乗り物から降りよう。'); return false; }
    if (action === player.mode) return true;
    if (!spendMP(MODE_COST[action])) {
      message('モッチポイントが回復するまで、ちょっとひと休み。'); return false;
    }
    player.mode = action;
    message(MODE_NAME[action] + 'になった。'); sound('mode');
    return true;
  }
  function updateNPCs(dt) {
    for (const n of npcs) {
      n.flash = Math.max(0, n.flash - dt);
      if (n === turtle) {
        if (n.mounted) {
          n.x = player.x; n.z = player.z; n.h = player.h;
          n.facing = player.facing; n.speed = Math.abs(player.vx);
        } else if (turtlePause > 0) {
          turtlePause -= dt; n.speed = 0; n.role = 'rest';
        } else {
          // The turtle lingers in the sheltered gap beneath the next rocky shelf.
          n.role = 'wander'; n.speed = 16; n.facing = 1;
          n.x = wrap(n.x + n.speed * dt);
          n.z += (.54 + .18 * Math.sin(n.x / 160) - n.z) * dt * .23;
          const shelf = objects.find(o => o.type === 'ledge' && Math.abs(worldDelta(n.x, o.x - o.width / 2)) < 7);
          if (shelf && turtleRestedAt !== shelf.id) { turtleRestedAt = shelf.id; turtlePause = 10; n.z = shelf.z; }
          else if (!shelf) turtleRestedAt = null;
        }
        continue;
      }
      const oldX = n.x;
      if (n.role === 'sumo') {
        const sway = state.time * 1.55 + n.phase;
        n.x = wrap(n.homeX + Math.sin(sway) * 8 + n.side * (3 + Math.sin(sway * 2) * 3));
        n.z = n.homeZ + Math.cos(sway) * .014;
        n.facing = n.side;
      } else {
        const rate = n.role === 'porter' ? .31 : .44;
        const t = state.time * rate + n.phase;
        const amplitude = n.role === 'porter' ? 66 : 88;
        n.x = wrap(n.homeX + (Math.sin(t) - Math.sin(n.phase)) * amplitude);
        n.z = n.homeZ + (Math.sin(t * .7) - Math.sin(n.phase * .7)) * .08;
        n.facing = Math.cos(t) < 0 ? -1 : 1;
      }
      n.speed = Math.abs(worldDelta(n.x, oldX)) / dt;
    }
  }
  function updateShots(dt) {
    for (let i = state.shots.length - 1; i >= 0; i--) {
      const shot = state.shots[i];
      const stepX = shot.facing * Math.cos(shot.angle) * 510 * dt;
      const from = shot.x;
      shot.x = wrap(shot.x + stepX);
      shot.z += Math.sin(shot.angle) * dt * 2.4;
      shot.h += Math.sin(shot.angle) * dt * 60;
      shot.age += dt; shot.life -= dt;
      let hit = null;
      for (const n of npcs) {
        const relative = worldDelta(n.x, from) * shot.facing;
        if (n.type !== 'turtle' && relative >= -17 && relative <= Math.abs(stepX) + 17 &&
            Math.abs(n.z - shot.z) < .23 && shot.h >= 1 && shot.h < n.h + 92) {
          hit = n; break;
        }
      }
      if (hit) {
        hit.flash = .58; state.score += 10;
        emit('score', { value: 10, text: '+10', x: hit.x, z: hit.z, h: hit.h + 68 });
        sound('score');
      }
      if (hit || shot.life <= 0 || shot.z < -.3 || shot.z > 1.3) state.shots.splice(i, 1);
    }
  }
  function shelfHeight(oldH, newH) {
    let top = 0;
    for (const o of objects) {
      if (o.type === 'ledge' && o.h <= oldH + .01 && o.h >= newH &&
          Math.abs(worldDelta(player.x, o.x)) < o.width / 2 && Math.abs(player.z - o.z) < .17) top = Math.max(top, o.h);
    }
    return top;
  }
  function updateMotion(dt, input) {
    if (player.activity && player.activity !== 'fall') return;
    const movement = player.activity === 'fall' ? 0 : 1;
    let dx = clamp(Number(input.x) || 0, -1, 1) * movement;
    let dz = clamp(Number(input.z) || 0, -1, 1) * movement;
    if (player.buffs.drunk > 0) {
      dx *= -1;
      dz += Math.sin(state.time * 5) * Math.abs(dx) * .32;
    }
    const magnitude = Math.max(1, Math.hypot(dx, dz));
    dx /= magnitude; dz /= magnitude;
    const base = player.mount === 'turtle' ? 625 : player.mount === 'bike' ? 460 : player.mode === 'dango' ? 349 : 188;
    const speed = base * (player.buffs.swift > 0 ? 1.42 : 1) * (player.buffs.full > 0 ? .81 : 1);
    if (dx) player.facing = Math.sign(dx);
    const traction = player.activity === 'fall' ? 4 : player.mode === 'dango' ? 6 : 13;
    player.vx += (dx * speed - player.vx) * (1 - Math.exp(-traction * dt));
    if (Math.abs(player.vx) < .06) player.vx = 0;
    player.x = wrap(player.x + player.vx * dt);
    player.z = clamp(player.z + dz * speed / DEPTH_SCALE * dt, .035, .97);
    const oldH = player.h;
    if (!player.mount && player.mode === 'habutae' && input.jump && !player.activity) {
      player.vy = Math.min(177, player.vy + 870 * dt);
    } else player.vy -= GRAVITY * dt;
    player.h = clamp(oldH + player.vy * dt, 0, 362);
    if (player.h >= 362) player.vy = Math.min(player.vy, 0);
    const surface = shelfHeight(oldH, player.h);
    player.grounded = player.vy <= 0 && player.h <= surface;
    if (player.grounded) { player.h = surface; player.vy = 0; }
  }
  function checkContact() {
    if (player.activity || player.h > 38) return;
    if (!player.mount && player.grounded) {
      if (lastBath && gap(lastBath) > 107) lastBath = null;
      for (const o of objects) {
        if (o.active && PICKUP_ACTION[o.type] && o !== lastBath &&
            gap(o) <= (o.type === 'onsen' ? 42 : 23)) { collect(o); return; }
      }
    }
    if (player.invulnerable > 0 || player.mode === 'kusa') return;
    for (const n of npcs) {
      if (n === turtle || Math.abs(worldDelta(n.x, player.x)) > 24 || Math.abs(n.z - player.z) > .105) continue;
      player.invulnerable = 2.1;
      if (!protectedVitals()) player.hp = Math.max(0, player.hp - 7);
      if (player.hp === 0) {
        player.mode = 'normal';
        player.h = player.vy = 0;
        player.grounded = true;
        beginActivity('sleep', 5);
        message('お餅はその場で、すやすや眠った。'); sound('sleep');
      } else {
        player.vx = (worldDelta(player.x, n.x) < 0 ? -1 : 1) * 126;
        beginActivity('fall', .68); sound('bump');
      }
      break;
    }
  }
  function advance(dt, input) {
    state.time += dt;
    for (const name of Object.keys(player.buffs)) player.buffs[name] = Math.max(0, player.buffs[name] - dt);
    for (const name of ['stretch','throwTime','invulnerable']) player[name] = Math.max(0, player[name] - dt);
    throwCooldown = Math.max(0, throwCooldown - dt);
    for (const o of objects) {
      if (o.cooldown > 0) {
        o.cooldown = Math.max(0, o.cooldown - dt);
        if (o.cooldown === 0) o.active = true;
      }
    }
    if (player.mode === 'normal' || player.activity) player.mp = Math.min(MAX_VITAL, player.mp + dt * 5.2);
    else if (!spendMP(MODE_DRAIN[player.mode] * dt)) {
      player.mode = 'normal'; player.mp = 0;
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
    state.region = Math.floor(player.x / REGION_WIDTH);
    if (!state.visited.includes(state.region)) state.visited.push(state.region);
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
      version: 1, time: state.time, score: state.score, visited: [...state.visited],
      player: { ...player, buffs: { ...player.buffs } },
      items: objects.map(o => o.cooldown),
      bikes: objects.filter(o => o.type === 'port').map(o => o.bikes),
      turtle: { x: turtle.x, z: turtle.z, pause: turtlePause, shelteredAt: turtleRestedAt },
      lastBath: lastBath?.id ?? null
    };
  }
  function restore(data) {
    const finite = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
    if (!data || data.version !== 1 || !data.player || !data.turtle || !Array.isArray(data.visited)) return;
    const p = data.player;
    const ports = objects.filter(o => o.type === 'port');
    if (!finite(data.time, 0, 1e9) || !Number.isSafeInteger(data.score) || data.score < 0 ||
        !data.visited.every(n => Number.isInteger(n) && n >= 0 && n < 6) ||
        !finite(p.x, 0, WORLD_WIDTH) || !finite(p.z, 0, 1) || !finite(p.h, 0, 362) ||
        !finite(p.vx, -1200, 1200) || !finite(p.vy, -1200, 700) ||
        ![-1,1].includes(p.facing) || typeof p.grounded !== 'boolean' ||
        !finite(p.hp, 0, 100) || !finite(p.mp, 0, 100) ||
        !Object.hasOwn(MODE_COST, p.mode) || ![null,'turtle','bike'].includes(p.mount) ||
        ![null,'fall','sleep','bath','read','drink','eat'].includes(p.activity) ||
        !finite(p.activityTime, 0, 6) || !p.buffs ||
        !Object.keys(BUFF_TIME).every(key => finite(p.buffs[key], 0, BUFF_TIME[key])) ||
        ![p.stretch,p.invulnerable,p.throwTime].every(n => finite(n, 0, 3)) ||
        !Array.isArray(data.items) || data.items.length !== objects.length ||
        !data.items.every(n => finite(n, 0, 65)) ||
        !Array.isArray(data.bikes) || data.bikes.length !== ports.length ||
        !data.bikes.every(n => Number.isInteger(n) && finite(n, 0, ports.length * 2)) ||
        data.bikes.reduce((total, n) => total + n, p.mount === 'bike' ? 1 : 0) !== ports.length * 2 ||
        !finite(data.turtle.x, 0, WORLD_WIDTH) || !finite(data.turtle.z, 0, 1) ||
        !finite(data.turtle.pause, -.1, 12)) return;
    for (const key of Object.keys(player)) if (key !== 'buffs') player[key] = p[key];
    for (const key of Object.keys(BUFF_TIME)) player.buffs[key] = p.buffs[key];
    player.x = wrap(player.x);
    state.score = data.score; state.time = data.time;
    state.region = Math.floor(player.x / REGION_WIDTH);
    state.visited = [...new Set([...data.visited, state.region])];
    objects.forEach((o, i) => { o.cooldown = data.items[i]; o.active = o.cooldown === 0; });
    ports.forEach((port, i) => { port.bikes = data.bikes[i]; });
    turtle.x = wrap(data.turtle.x); turtle.z = data.turtle.z; turtle.mounted = player.mount === 'turtle';
    turtlePause = Math.max(0, data.turtle.pause);
    turtleRestedAt = objects.find(o => o.type === 'ledge' && o.id === data.turtle.shelteredAt)?.id ?? null;
    lastBath = objects.find(o => o.type === 'onsen' && o.id === data.lastBath) ?? null;
    // Patrols derive from the scroll's clock, so their phase survives a reload.
    updateNPCs(1 / 60000);
  }
  restore(snapshot);
  return { state, step, act, nearest, save };
}
