import * as THREE from './vendor/three.module.min.js';
import { applyClimateLights } from './atmosphere.js';
import { createWake } from './wake.js';
import { createWorld } from './world.js';
import { setRiverStones } from './scanned-stone.js';
import { createBathReflection } from './spring-water.js';
import { createInkPass } from './ink.js';
import { createActors, getExpression } from './actors.js';
import { createGame } from './game.js';
import { REGIONS, groundHeight, solidHeightAt, wrapDelta, BOUND } from './terrain.js';
import { createAudio } from '../sound.js';
import { MODES, EMOTES, HELP, glyph, paintGlyphs, drawFace } from './interface.js';
import { drawMap, mapHit, labels } from './map.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene'),
  stage = $('stage'),
  dialog = $('dialog');
const saveKey = 'mochi-quest.two.journey.v1',
  settingsKey = 'mochi-quest.two.settings.v1';
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}
const clamp = THREE.MathUtils.clamp;
const restingEyeHeightOffset = { bath: 0.35, sleep: 0.26 };
const savedSettings = read(settingsKey) || {};
const game = createGame(read(saveKey)),
  state = game.state,
  p = state.player;
const audio = createAudio();
let audible = savedSettings.sound !== false;
let yaw = Number.isFinite(savedSettings.yaw) ? savedSettings.yaw : 0;
let pitch = 0.23,
  distance = 6.55,
  priorCamera = null,
  photoMode = false;
let goal = REGIONS.some((r) => r.id === savedSettings.goal) ? savedSettings.goal : null;
let photoTime = state.time,
  active = false,
  dialogKind = '',
  lastFocus = null,
  selectedPlace = state.regionId;
let speechExpires = 0,
  toastExpires = 0,
  nextHUD = 0,
  lastSave = state.time;
let previous = 0,
  renderer,
  world,
  actors,
  bathReflection,
  wake,
  ink,
  contextLost = false;
const keys = new Set(),
  stick = { id: null, x: 0, y: 0 },
  look = { id: null, x: 0, y: 0 };
let jumpTouch = false,
  lastFace = '',
  lastMode = '',
  lastEffects = '';
const compassTicks = [];
const cards = new Map();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(57, 1, 0.09, 1500);
const hemisphere = new THREE.HemisphereLight(0xfff5e3, 0x9a8675, 1.02);
const bounce = new THREE.DirectionalLight(0xe6efff, 0.65);
const sun = new THREE.DirectionalLight(0xffe5bd, 2.35);
const aim = new THREE.Vector3(),
  eye = new THREE.Vector3(),
  focus = new THREE.Vector3(),
  projected = new THREE.Vector3(),
  heroAt = new THREE.Vector3();
const coarse = matchMedia('(pointer:coarse)').matches;
let ratio = Math.min(devicePixelRatio || 1, coarse ? 1.35 : 1.65);
let frames = 0,
  workTime = 0,
  qualitySince = 0;
function persistSettings() {
  store(settingsKey, { sound: audible, yaw: photoMode ? priorCamera.yaw : yaw, goal });
}
function save() {
  if (active) {
    store(saveKey, game.save());
    persistSettings();
  }
}
function unlock() {
  active = true;
  audio.unlock();
}
function setAudio(value) {
  audible = value;
  audio.setEnabled(value);
  $('audio').querySelector('i').innerHTML = glyph(value ? 'volume' : 'mute');
  $('audio').setAttribute('aria-pressed', String(value));
  $('audio').ariaLabel = $('audio').title = value ? '音を切る' : '音を入れる';
}
function message(text, seconds = 2.7) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastExpires = performance.now() + seconds * 1000;
}
function dispatchEvents() {
  for (const e of state.events.splice(0)) {
    audio.handle(e);
    if (e.type === 'say') {
      $('speech').hidden = false;
      $('speech').textContent = e.text;
      speechExpires = performance.now() + 950;
    }
    if (e.type === 'message') message(e.text);
    if (e.type === 'score') message('三条通知が届いた　＋' + e.value, 1.1);
    if (e.type === 'stamp' && goal === e.id) {
      goal = null;
      persistSettings();
    }
  }
}
function action(name) {
  if (dialog.open || photoMode) return;
  unlock();
  game.act(name);
  dispatchEvents();
  updateHUD();
}
paintGlyphs();
setAudio(audible);
$('audio').onclick = () => {
  setAudio(!audible);
  unlock();
  persistSettings();
};
for (let i = -4; i <= 4; i++) {
  const mark = document.createElement('span');
  mark.className = 'tick';
  mark.innerHTML = '<b></b>';
  $('compass').append(mark);
  compassTicks.push(mark);
}
for (const [i, [id, name]] of MODES.entries()) {
  const b = document.createElement('button');
  b.className = 'mode';
  b.dataset.mode = id;
  b.title = name + '（' + i + '）';
  b.innerHTML =
    '<canvas width="64" height="52" aria-hidden="true"></canvas><span>' +
    name +
    '<small>' +
    i +
    '</small></span>';
  drawFace(b.querySelector('canvas'), id);
  b.onclick = () => {
    action(id);
    canvas.focus({ preventScroll: true });
  };
  $('modes').append(b);
  cards.set(id, b);
}
for (const [id, name] of EMOTES) {
  const b = document.createElement('button');
  b.className = 'choice';
  b.textContent = name;
  b.dataset.emote = id;
  b.onclick = () => {
    state.player.emote = id === 'auto' ? null : id;
    updateEmotes();
  };
  $('emotes').append(b);
}
function updateEmotes() {
  for (const b of $('emotes').children)
    b.setAttribute('aria-pressed', String(b.dataset.emote === (p.emote || 'auto')));
}
function clearInput() {
  keys.clear();
  jumpTouch = false;
  stick.id = null;
  stick.x = stick.y = 0;
  look.id = null;
  $('stick').firstElementChild.style.transform = '';
}
function togglePhoto() {
  if (!actors || dialog.open) return;
  clearInput();
  if (!photoMode) {
    priorCamera = { yaw, pitch, distance };
    photoMode = true;
    state.photo = true;
    photoTime = state.time;
    yaw = actors.hero.rotation.y;
    pitch = 0.105;
    distance = (camera.aspect < 0.83 ? 3.48 : 2.95) * (1 + .94 * p.airStretch);
    p.emote = null;
    updateEmotes();
  } else {
    photoMode = false;
    state.photo = false;
    delete p.emote;
    ({ yaw, pitch, distance } = priorCamera);
    priorCamera = null;
  }
  stage.classList.toggle('photo-mode', photoMode);
  resize();
  $('photo-dock').hidden = !photoMode;
  $('photo').setAttribute('aria-pressed', String(photoMode));
  $('photo').ariaLabel = photoMode ? 'お顔カメラを閉じる' : 'お顔カメラ';
  $('speech').hidden = true;
  $('toast').hidden = true;
  updateCamera(0.15, true);
  canvas.focus({ preventScroll: true });
}
$('photo').onclick = togglePhoto;
$('leave-photo').onclick = togglePhoto;
$('download').onclick = () => {
  if (!renderer || contextLost) return;
  drawScene();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'Mochi-Quest-2-' + state.region + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }, 'image/png');
};
function moveCamera(dx, dy) {
  yaw -= dx * 0.0055;
  pitch = clamp(pitch + dy * 0.004, photoMode ? -0.06 : 0.045, 1.08);
}
canvas.onpointerdown = (e) => {
  if (look.id !== null || dialog.open) return;
  unlock();
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(e.pointerId);
  look.id = e.pointerId;
  look.x = e.clientX;
  look.y = e.clientY;
};
canvas.onpointermove = (e) => {
  if (look.id !== e.pointerId) return;
  moveCamera(e.clientX - look.x, e.clientY - look.y);
  look.x = e.clientX;
  look.y = e.clientY;
};
canvas.onlostpointercapture = (e) => {
  if (look.id === e.pointerId) look.id = null;
};
canvas.onwheel = (e) => {
  e.preventDefault();
  distance = clamp(
    distance * Math.exp(clamp(e.deltaY, -200, 200) * 0.0015),
    photoMode ? 2.25 : 4.0,
    photoMode ? 6 : 12.5,
  );
};
const joystick = $('stick');
function moveStick(e) {
  const r = joystick.getBoundingClientRect(),
    x = e.clientX - r.x - r.width / 2,
    y = e.clientY - r.y - r.height / 2,
    limit = r.width * 0.36,
    n = Math.max(limit, Math.hypot(x, y));
  stick.x = Math.abs(x / n) > 0.1 ? x / n : 0;
  stick.y = Math.abs(y / n) > 0.1 ? y / n : 0;
  joystick.firstElementChild.style.transform =
    'translate(' + stick.x * limit + 'px,' + stick.y * limit + 'px)';
}
joystick.onpointerdown = (e) => {
  if (stick.id !== null) return;
  e.preventDefault();
  unlock();
  joystick.setPointerCapture(e.pointerId);
  stick.id = e.pointerId;
  moveStick(e);
};
joystick.onpointermove = (e) => {
  if (stick.id === e.pointerId) moveStick(e);
};
joystick.onlostpointercapture = () => {
  stick.id = null;
  stick.x = stick.y = 0;
  joystick.firstElementChild.style.transform = '';
};
$('leap').onpointerdown = (e) => {
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  jumpTouch = true;
  action('jump');
};
$('leap').onlostpointercapture = () => {
  jumpTouch = false;
};
$('send').onpointerdown = (e) => {
  e.preventDefault();
  action('throw');
};
$('context').onclick = () => action(game.nearest()?.action || 'interact');
const bindings = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyR',
  'KeyC',
  'KeyE',
  'KeyZ',
  'KeyM',
  'KeyH',
  'KeyP',
  'Escape',
  'Space',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
]);
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || !bindings.has(e.code)) return;
  if (dialog.open) {
    if (
      !e.repeat &&
      ((dialogKind === 'map' && e.code === 'KeyM') ||
        (dialogKind === 'guide' && ['KeyH', 'KeyP'].includes(e.code)))
    ) {
      e.preventDefault();
      dialog.close();
    }
    return;
  }
  if (e.code === 'Space' && e.target.closest('button,a')) return;
  e.preventDefault();
  if (e.repeat) return;
  unlock();
  keys.add(e.code);
  if (e.code === 'KeyC') {
    togglePhoto();
    return;
  }
  if (e.code === 'Escape' && photoMode) {
    togglePhoto();
    return;
  }
  if (e.code === 'KeyM') {
    openDialog('map');
    return;
  }
  if (['KeyH', 'KeyP', 'Escape'].includes(e.code)) {
    openDialog('guide');
    return;
  }
  if (photoMode) return;
  if (/^Digit/.test(e.code)) action(MODES[+e.code.slice(-1)][0]);
  if (e.code === 'KeyZ') action('throw');
  if (e.code === 'KeyE') action('interact');
  if (e.code === 'Space') action('jump');
});
document.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  clearInput();
  save();
});
document.addEventListener('visibilitychange', () => {
  clearInput();
  previous = 0;
  save();
});
window.addEventListener('pagehide', save);
function updateCamera(dt, snap = false) {
  const full = p.buffs.full > 0 ? 1.26 : 1,
    ride = p.mount === 'bike' ? 0.9 : p.mount === 'turtle' ? 0.48 : 0;
  // Let the body rise within the frame on takeoff. The camera catches up for
  // long flights, while a standing jump retains a visible point of departure.
  const rise = photoMode ? 0 : Math.min(p.h, 3.6) * 0.41;
  const resting = photoMode ? restingEyeHeightOffset[p.activity] || 0 : 0;
  heroAt.set(p.x, p.y + ride + 0.9 * full + p.airStretch * (photoMode ? .97 : .65) - rise - resting, p.z);
  if (snap || Math.abs(heroAt.x - focus.x) > BOUND || Math.abs(heroAt.z - focus.z) > BOUND) focus.copy(heroAt);
  else focus.lerp(heroAt, 1 - Math.exp(-dt * 13));
  const sx = Math.sin(yaw),
    sz = Math.cos(yaw),
    d = distance * (full > 1 && photoMode ? 1.18 : 1);
  const dx = sx * Math.cos(pitch) * d,
    dy = Math.sin(pitch) * d + (photoMode ? 0.1 : 0.62),
    dz = sz * Math.cos(pitch) * d;
  let fraction = 1;
  for (let i = 1, n = Math.ceil(d / 0.4); i <= n; i++) {
    const t = i / n,
      x = focus.x + dx * t,
      z = focus.z + dz * t,
      y = focus.y + dy * t;
    if (Math.max(groundHeight(x, z, y), solidHeightAt(x, z, 0.2, y)) + 0.19 > y) {
      fraction = Math.max(0.16, (i - 1) / n);
      break;
    }
  }
  eye.copy(focus);
  eye.x += dx * fraction;
  eye.y += dy * fraction;
  eye.z += dz * fraction;
  eye.y = Math.max(eye.y, groundHeight(eye.x, eye.z, eye.y) + 0.2);
  camera.position.copy(eye);
  aim.copy(focus);
  if (!photoMode) {
    aim.x -= sx * 1.65;
    aim.z -= sz * 1.65;
    aim.y += 0.53;
  } else aim.y -= .13;
  camera.lookAt(aim);
  camera.updateMatrixWorld();
}
function updateHUD() {
  $('region').textContent = state.region;
  $('score').textContent = state.score;
  $('visits').textContent = state.visited.length + '/' + REGIONS.length;
  for (const k of ['hp', 'mp']) {
    $(k).textContent = Math.ceil(p[k]);
    $(k + '-bar').style.width = p[k] + '%';
  }
  if (lastMode !== p.mode) {
    for (const [id, b] of cards) b.setAttribute('aria-pressed', String(id === p.mode));
    lastMode = p.mode;
  }
  const expression = getExpression(p, photoMode ? photoTime : state.time),
    faceKey = p.mode + expression;
  if (lastFace !== faceKey) {
    drawFace($('face'), p.mode, expression);
    lastFace = faceKey;
  }
  const effects = [];
  if (p.mount) effects.push(p.mount === 'bike' ? '電動自転車' : 'カメに騎乗中');
  for (const [k, n] of Object.entries({
    warm: 'ほかほか',
    full: '満腹',
    swift: '速足',
    drunk: 'ほろ酔い',
    wrap: '腹巻き',
  }))
    if (p.buffs[k] > 0) effects.push(n + ' ' + Math.ceil(p.buffs[k]) + '秒');
  const effectsText = effects.join(' ・ ');
  if (lastEffects !== effectsText) {
    $('effects').textContent = effectsText;
    lastEffects = effectsText;
  }
  const near = game.nearest();
  $('context').hidden = !near || dialog.open || photoMode;
  if (near) $('context').querySelector('span').textContent = near.label;
  const deg = -THREE.MathUtils.radToDeg(yaw),
    base = Math.round(deg / 15),
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  compassTicks.forEach((el, i) => {
    const n = base + i - 4,
      angle = n * 15;
    el.style.left = 50 + (angle - deg) * 1.15 + '%';
    el.classList.toggle('major', n % 3 === 0);
    el.firstElementChild.textContent = n % 3 === 0 ? directions[(((n / 3) % 8) + 8) % 8] : '';
  });
  const dest = REGIONS.find((r) => r.id === goal);
  $('target').hidden = !dest;
  if (dest) {
    const dx = wrapDelta(dest.x - p.x),
      dz = wrapDelta(dest.z - p.z),
      heading = Math.atan2(dx, -dz) + yaw;
    const pointer = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][
      ((Math.round(heading / (Math.PI / 4)) % 8) + 8) % 8
    ];
    $('target').textContent = pointer + '　' + dest.name + '　' + Math.round(Math.hypot(dx, dz)) + ' m';
  }
  if (!photoMode) drawMap($('minimap'), state, yaw, goal);
}
function openDialog(kind) {
  if (!renderer || dialog.open) return;
  clearInput();
  save();
  lastFocus = document.activeElement;
  dialogKind = kind;
  $('dialog-title').textContent = kind === 'map' ? '十景の地図' : '旅の手引き';
  dialog.showModal();
  if (kind === 'map') {
    selectedPlace = goal || state.regionId;
    mapDialog();
  } else helpDialog('歩き方');
}
function mapDialog() {
  const body = $('dialog-content');
  body.innerHTML =
    '<div class="atlas-layout"><canvas class="map-canvas" id="atlas" width="540" height="540" aria-label="十の名所とお餅の現在地"></canvas><div class="map-caption"><div class="map-places"></div><p class="map-detail"></p><div class="actions"><button class="jump-link" id="set-goal">ここを道しるべにする</button><button class="choice" id="clear-goal">道しるべを外す</button></div></div></div>';
  for (const [i, r] of REGIONS.entries()) {
    const b = document.createElement('button');
    b.innerHTML = '<em>' + labels[i] + '</em> ' + r.name;
    b.dataset.id = r.id;
    b.onclick = () => selectMap(r.id);
    body.querySelector('.map-places').append(b);
  }
  $('atlas').onclick = (e) => {
    const r = mapHit($('atlas'), e);
    if (r) selectMap(r.id);
  };
  $('set-goal').onclick = () => {
    goal = selectedPlace;
    lastFocus = canvas;
    persistSettings();
    dialog.close();
    updateHUD();
  };
  $('clear-goal').hidden = !goal;
  $('clear-goal').onclick = () => {
    goal = null;
    lastFocus = canvas;
    persistSettings();
    dialog.close();
    updateHUD();
  };
  selectMap(selectedPlace);
}
function selectMap(id) {
  selectedPlace = id;
  const r = REGIONS.find((r) => r.id === id);
  for (const b of document.querySelectorAll('.map-places button'))
    b.setAttribute('aria-pressed', String(b.dataset.id === id));
  document.querySelector('.map-detail').textContent =
    r.name +
    '　' +
    Math.round(Math.hypot(wrapDelta(p.x - r.x), wrapDelta(p.z - r.z))) +
    ' m　 ·　 ' +
    (state.visited.includes(id) ? '御朱印を獲得済み' : '未訪問の名所');
  const landmarks = {
    snow: '雪灯籠の灯る都。軒先に雪だるまが並ぶ。',
    autumn: '楓の枝が重なる谷道。紅葉をくぐって峡へ。',
    moon: '薄の穂越しに北の空を見上げると、十五夜の月。',
    dawn: '東の海から昇る初日。浜では臼を囲んで餅をつく。'
  };
  if (landmarks[id]) document.querySelector('.map-detail').append(document.createElement('br'), landmarks[id]);
  drawMap($('atlas'), state, yaw, selectedPlace, true);
}
function helpDialog(tab) {
  const body = $('dialog-content');
  body.innerHTML =
    '<div class="guide-tabs"></div><dl class="guide-list"></dl><div class="actions" style="margin-top:12px"><button class="jump-link" id="continue">旅を続ける</button></div><p class="credit">旅はこのブラウザに自動保存されます。　<a href="../audio/CREDITS.txt" target="_blank" rel="noopener">音声クレジット</a> · <a href="./vendor/THREE-LICENSE.txt" target="_blank" rel="noopener">Three.js</a></p>';
  for (const name of Object.keys(HELP)) {
    const b = document.createElement('button');
    b.className = 'choice';
    b.textContent = name;
    b.setAttribute('aria-pressed', String(tab === name));
    b.onclick = () => helpDialog(name);
    body.querySelector('.guide-tabs').append(b);
  }
  for (const [k, v] of HELP[tab]) {
    const row = document.createElement('div');
    row.innerHTML = '<dt>' + k + '</dt><dd>' + v + '</dd>';
    body.querySelector('dl').append(row);
  }
  $('continue').onclick = () => { lastFocus = canvas; dialog.close(); };
}
$('map').onclick = $('mini-button').onclick = () => openDialog('map');
$('guide').onclick = () => openDialog('guide');
$('dismiss').onclick = () => dialog.close();
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  previous = 0;
  dialogKind = '';
  (lastFocus?.tagName === 'BUTTON' ? lastFocus : canvas).focus({ preventScroll: true });
});
function resize() {
  if (!renderer) return;
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (!w || !h) return;
  const photoRatio = Math.min(coarse ? 1.65 : 2, Math.max(1.6, devicePixelRatio || 1), Math.sqrt(4200000/(w*h)));
  renderer.setPixelRatio(photoMode ? photoRatio : ratio);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 65 : 57;
  camera.updateProjectionMatrix();
  ink?.resize();
}
function settingsForLighting() {
  scene.add(hemisphere);
  sun.position.set(35, 38, -51);
  sun.castShadow = true;
  const cam = sun.shadow.camera;
  cam.left = cam.bottom = -19;
  cam.right = cam.top = 19;
  cam.near = 0.5;
  cam.far = 110;
  sun.shadow.mapSize.set(coarse ? 1024 : 1536, coarse ? 1024 : 1536);
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.026;
  bounce.position.set(-28, 20, 25);
  scene.add(bounce, sun, sun.target);
}
function drawScene() {
  bathReflection(p, photoMode ? photoTime : state.time, camera);
  const focusDistance = photoMode ? Math.max(0.3, camera.position.distanceTo(aim) - 0.55) : 0;
  ink.draw(scene, focusDistance);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || dialog.open || contextLost) {
    previous = 0;
    return;
  }
  const delta = previous ? Math.min((now - previous) / 1000, 0.09) : 1 / 60;
  if (previous && now - previous < 1000 / 63) return;
  previous = now;
  const left = Number(keys.has('ArrowLeft') || keys.has('KeyA')),
    right = Number(keys.has('ArrowRight') || keys.has('KeyD'));
  const forward =
    Number(keys.has('ArrowUp') || keys.has('KeyW')) -
    Number(keys.has('ArrowDown') || keys.has('KeyS')) -
    stick.y;
  yaw += (Number(keys.has('KeyQ')) - Number(keys.has('KeyR'))) * delta * 1.65;
  if (!photoMode) {
    const side = right - left + stick.x,
      c = Math.cos(yaw),
      s = Math.sin(yaw);
    game.step(delta, {
      x: c * side - s * forward,
      z: -s * side - c * forward,
      rightX: c,
      rightZ: -s,
      jump: jumpTouch || keys.has('Space'),
    });
    dispatchEvents();
  } else photoTime += delta;
  updateCamera(delta);
  sun.target.position.set(p.x, p.y, p.z);
  applyClimateLights(hemisphere, sun, bounce, p);
  wake(p, photoMode ? photoTime : state.time);
  world.update(photoMode ? photoTime : state.time, p, camera);
  // Keep the photographic pose alive while the travel clock is paused.
  if (photoMode) {
    const playTime = state.time;
    state.time = photoTime;
    try {
      actors.update(state, delta, camera);
    } finally {
      state.time = playTime;
    }
  } else actors.update(state, delta, camera);
  drawScene();
  if (now >= nextHUD) {
    updateHUD();
    nextHUD = now + 95;
  }
  if (now > toastExpires) $('toast').hidden = true;
  if (!$('speech').hidden) {
    if (now > speechExpires) $('speech').hidden = true;
    else {
      projected.set(p.x, p.y + (p.mount ? 2.7 : 1.95), p.z).project(camera);
      $('speech').style.left = clamp((projected.x + 1) * 50, 10, 90) + '%';
      $('speech').style.top = clamp((1 - projected.y) * 50, 8, 87) + '%';
    }
  }
  if (state.time - lastSave > 4) {
    save();
    lastSave = state.time;
  }
  // Drop a resolution step only after sustained slow frames, avoiding startup shader compilation.
  if (!photoMode && now > qualitySince + 3000) {
    frames++;
    workTime += delta;
    if (frames >= 70) {
      if (workTime / frames > 0.032 && ratio > 0.85) {
        ratio = Math.max(0.85, ratio * 0.82);
        resize();
        qualitySince = now;
      }
      frames = 0;
      workTime = 0;
    }
  }
}
function boot() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    ink = createInkPass(renderer, camera);
    settingsForLighting();
    world = createWorld(scene);
    wake = createWake(scene);
    sun.target.position.set(p.x,p.y,p.z);
    applyClimateLights(hemisphere, sun, bounce, p);
    wake(p, state.time);
    setRiverStones(scene, state.objects);
    actors = createActors(scene);
    bathReflection = createBathReflection(renderer, scene, actors.hero);
    resize();
    updateCamera(1, true);
    actors.update(state, 0, camera);
    world.update(state.time, p, camera);
    drawScene();
    updateHUD();
    $('loading').hidden = true;
    qualitySince = performance.now();
    new ResizeObserver(resize).observe(canvas);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      clearInput();
      save();
      contextLost = true;
      $('loading-copy').textContent = '描画を再開しています…';
      $('loading').hidden = false;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      contextLost = false;
      previous = 0;
      resize();
      $('loading').hidden = true;
    });
    requestAnimationFrame(frame);
  } catch (error) {
    console.error(error);
    $('loading').hidden = false;
    $('loading-copy').textContent = '3D画面を開けませんでした。WebGL 2 対応のブラウザで開いてください。';
    $('load-back').hidden = false;
  }
}
boot();
