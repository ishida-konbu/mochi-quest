import * as THREE from './vendor/three.module.min.js';
import { applyClimateLights } from './atmosphere.js';
import { createWake } from './wake.js';
import { prepareWorld } from './world.js';
import { finishInSlices, uploadSceneTextures } from './preparation.js';
import { setRiverStones } from './scanned-stone.js';
import { createBathReflection } from './spring-water.js';
import { scrollCoverage } from './scroll-paper.js';
import { createInkPass } from './ink.js';
import { createActors, getExpression } from './actors.js';
import { loadRiceModel } from './mochi-model.js';
import { PAGES_ORIGIN, PAGES_GUIDE, WORKER_ORIGIN, SAVE_KEY as saveKey, SETTINGS_KEY as settingsKey,
  transferURL, decodeTransfer, storeTransfer } from './journey-transfer.js';
import { createGame } from './game.js';
import { SPECIES } from './bestiary.js';
import { SCROLL_FAUNA, faunaDrawing, FAUNA_SHEET } from './scroll-fauna.js';
import { SEA_SPECIES } from './ryugu-residents.js';
import { seaPortrait } from './ryugu-performers.js';
import { BEASTS, beastDrawing } from './procession-view.js';
import { preloadBeastCoats } from './beast-art.js';
import { RYUGU, palaceSolid } from './ryugu-layout.js';
import { REGIONS, WATER_Y, terrainHeight, shoreDistance, groundHeight, landscapeFloor, solidHeightAt, wrapDelta, BOUND } from './terrain.js';
import { createMeadow } from './meadow.js';
import { createSoundscape } from './soundscape.js';
import { createAudio } from '../sound.js';
import { MODES, EMOTES, HELP, glyph, paintGlyphs, drawFace } from './interface.js';
import { loadMapPaper, drawMap, mapHit, mapCoordinates, labels, regionPort } from './map.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene'),
  stage = $('stage'),
  dialog = $('dialog');
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
    return true;
  } catch {
    return false;
  }
}
const clamp = THREE.MathUtils.clamp;
const restingEyeHeightOffset = { bath: 0.35, sleep: 0.26 };
function confirmJourney(existing, incoming) {
  const describe = game => game.state.region + '、御朱印 ' + game.state.visited.length + ' 個、通知点 ' + game.state.score + ' 点';
  $('dialog-title').textContent = 'Cloudflare版に旅の記録を引き継ぐ';
  const body = $('dialog-content');
  body.innerHTML = '<p>このブラウザにあるCloudflare版の記録を、GitHub Pages版の記録で上書きしますか？</p>' +
    '<dl class="guide-list"><div><dt>現在の記録</dt><dd></dd></div><div><dt>引き継ぐ記録</dt><dd></dd></div></dl>' +
    '<form method="dialog" class="actions"><button class="choice" value="keep" autofocus>現在の記録を使う</button>' +
    '<button class="jump-link" value="replace">上書きして引き継ぐ</button></form>';
  const [current, offered] = body.querySelectorAll('dd');
  current.textContent = existing.restored ? describe(existing) : '保存済みの記録';
  offered.textContent = describe(incoming);
  dialog.returnValue = '';
  $('dismiss').onclick = () => dialog.close('keep');
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => {
    $('dismiss').onclick = null;
    resolve(dialog.returnValue === 'replace');
  }, { once: true }));
}
async function startJourney() {
  const local = { game: createGame(read(saveKey)), settings: read(settingsKey) || {} };
  const hash = window.pendingMochiJourney;
  delete window.pendingMochiJourney;
  if (!hash || location.origin !== WORKER_ORIGIN) return local;
  const incoming = decodeTransfer(location.origin, hash, createGame, REGIONS);
  if (!incoming) return { ...local, status: '引き継ぐ記録を読み取れませんでした。' };
  try {
    if (localStorage.getItem(saveKey) !== null && !await confirmJourney(local.game, incoming.game))
      return { ...local, status: 'Cloudflare版の現在の記録から再開しました。' };
    storeTransfer(localStorage, incoming);
    return { ...incoming, status: 'GitHub Pages版の旅の記録を引き継ぎました。' };
  } catch {
    return { ...local, status: '旅の記録を保存できませんでした。ブラウザの保存設定を確認してください。' };
  }
}
paintGlyphs();
const { game, settings: savedSettings, status: transferStatus } = await startJourney();
let hasJourney = game.restored;
const state = game.state,
  p = state.player;
const audio = createAudio(createSoundscape);
let audible = savedSettings.sound !== false;
let yaw = Number.isFinite(savedSettings.yaw) ? savedSettings.yaw : 0;
let pitch = 0.23,
  distance = 6.55,
  priorCamera = null,
  photoMode = false;
let goal = REGIONS.some((r) => r.id === savedSettings.goal) ? savedSettings.goal : null;
let trackedAnimal = null, trackedHabitat = null, jumpPin = null;
const speciesNames = { frog:'蛙', rabbit:'兎', turtle:'ミツユビハコガメ',
  ...Object.fromEntries(Object.entries({...SPECIES,...SEA_SPECIES,...SCROLL_FAUNA}).map(([type,spec])=>[type,type==='bird'?'丹頂鶴':spec.label])) };
function nearestUndelivered(type, habitat) {
  let result = null, best = Infinity;
  for (const n of state.npcs) {
    if (state.delivered.has(n.id) || (type && n.type!==type) || (habitat && n.habitat!==habitat)) continue;
    const d = wrapDelta(n.x-p.x)**2 + wrapDelta(n.z-p.z)**2 + (n.y-p.y)**2;
    if (d < best) { best = d; result = n; }
  }
  return result;
}
let photoTime = state.time,
  active = false,
  dialogKind = '',
  lastFocus = null,
  selectedPlace = state.regionId;
let speechExpires = 0,
  toastExpires = 0,
  nextHUD = 0,
  lastSave = state.time;
let nextFrame = 0,
  previous = 0,
  renderer,
  world,
  meadow,
  actors,
  bathReflection,
  wake,
  ink,
  contextLost = false;
const keys = new Set(),
  stick = { id: null, x: 0, y: 0 },
  look = { id: null, x: 0, y: 0 };
let jumpTouch = false, diveTouch = false,
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
const nativeRatio = Math.min(devicePixelRatio || 1, coarse ? 1.35 : 1.65);
let ratio = nativeRatio;
let frames = 0,
  workTime = 0,
  qualitySince = 0;
function journeySettings() {
  return { sound: audible, yaw: photoMode ? priorCamera.yaw : yaw, goal };
}
function persistSettings() {
  store(settingsKey, journeySettings());
}
function save() {
  if (active) {
    if (store(saveKey, game.save())) hasJourney = true;
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
  game.act(name, name === 'throw' ? actors?.hero.rotation.y : undefined);
  dispatchEvents();
  updateHUD();
}
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
  b.setAttribute('aria-label', name + '（' + i + '）');
  b.innerHTML = '<small aria-hidden="true">' + i + '</small><canvas width="104" height="80" aria-hidden="true"></canvas><span>' + name + '</span>';
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
  jumpTouch = diveTouch = false;
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
    distance = (camera.aspect < 0.83 ? 3.48 : 2.95) * (1 + .64 * p.airStretch);
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
  pitch = clamp(pitch + dy * 0.004, photoMode ? -0.06 : -1.25, 1.08);
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
$('dive').onpointerdown = e => {
  if (dialog.open || photoMode) return;
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  diveTouch = true;
  unlock();
};
$('dive').onlostpointercapture = () => { diveTouch = false; };
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
  'Digit5',
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
  if (!['KeyM','KeyH','KeyP','Escape'].includes(e.code)) unlock();
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
  audio.setPaused(document.hidden || dialog.open || contextLost);
  clearInput();
  previous = 0;
  save();
});
window.addEventListener('pagehide', () => { audio.setPaused(true); save(); });
function updateCamera(dt, snap = false) {
  const full = p.buffs.full > 0 ? 1.26 : 1,
    ride = p.mount === 'bike' ? 0.9 : p.mount === 'turtle' ? .99 : 0;
  // Let the body rise within the frame on takeoff. The camera catches up for
  // long flights, while a standing jump retains a visible point of departure.
  const rise = photoMode ? 0 : Math.min(p.h, 3.6) * 0.41;
  const resting = photoMode ? restingEyeHeightOffset[p.activity] || 0 : 0;
  heroAt.set(p.x, p.y + ride + 0.9 * full + p.airStretch * full * (photoMode ? .72 : .51) - rise - resting, p.z);
  if (snap || Math.abs(heroAt.x - focus.x) > BOUND || Math.abs(heroAt.z - focus.z) > BOUND) focus.copy(heroAt);
  else focus.lerp(heroAt, 1 - Math.exp(-dt * 13));
  const sx = Math.sin(yaw),
    sz = Math.cos(yaw),
    scenery = photoMode ? 0 : scrollCoverage(p.x,p.z),
    d = distance * (full > 1 && photoMode ? 1.18 : 1) * (1+.14*scenery);
  // At the horizon, hold the eye above ground and tilt up to follow an animal overhead.
  const orbitPitch = photoMode ? pitch : Math.max(0, pitch);
  const shoulder=scenery*Math.min(1,camera.aspect)*Math.min(1,d/5);
  const dx = sx * Math.cos(orbitPitch) * d + sz*1.58*shoulder,
    dy = Math.sin(orbitPitch) * d + (photoMode ? 0.1 : 0.62),
    dz = sz * Math.cos(orbitPitch) * d - sx*1.58*shoulder;
  let fraction = 1;
  // While the grass mochi is inside a trunk, start the camera ray on the
  // outward side of that trunk. A second wall still shortens the camera arm.
  const diving = p.diveDepth > 0, palaceBed = diving ? terrainHeight(RYUGU.x,RYUGU.z) : 0;
  let emerging = !diving && p.mode === 'kusa' && solidHeightAt(focus.x,focus.z,.2,focus.y) + .19 > focus.y;
  for (let i = 1, n = Math.ceil(Math.hypot(dx,dy,dz) / 0.4); i <= n; i++) {
    const t = i / n,
      x = focus.x + dx * t,
      z = focus.z + dz * t,
      y = focus.y + dy * t;
    if (diving) {
      if (terrainHeight(x,z)+.2 > y || palaceSolid(x,z,y-.15,palaceBed,.3,.15)) {
        fraction = Math.max(.12,(i-1)/n);
        break;
      }
      continue;
    }
    const solid = solidHeightAt(x,z,.2,y);
    if (emerging && solid + .19 <= y) emerging = false;
    const floor = emerging ? landscapeFloor(x,z) : Math.max(groundHeight(x,z,y),solid);
    if (floor + .19 > y) {
      fraction = Math.max(0.16, (i - 1) / n);
      break;
    }
  }
  eye.copy(focus);
  eye.x += dx * fraction;
  eye.y += dy * fraction;
  eye.z += dz * fraction;
  if (diving && focus.y < WATER_Y - .24) {
    // Pass through the waterline with the mochi even when the camera is tilted down.
    eye.y=Math.min(eye.y, WATER_Y-.24);
  }
  const eyeFloor = diving ? terrainHeight(eye.x,eye.z) : emerging ? landscapeFloor(eye.x,eye.z) : groundHeight(eye.x,eye.z,eye.y);
  eye.y = Math.max(eye.y, eyeFloor + .2);
  camera.position.copy(eye);
  aim.copy(focus);
  if (!photoMode) {
    // Give the page to the animal directly ahead. An off-centre mochi keeps
    // the letter trajectory visible between the hero and its recipient.
    aim.x += sz*.4*shoulder-sx*(1.65+.82*scenery);
    aim.z -= sx*.4*shoulder+sz*(1.65+.82*scenery);
    aim.y += .53+.25*scenery;
  } else aim.y -= .13;
  camera.lookAt(aim);
  if (!photoMode && pitch < 0) camera.rotateX(-pitch);
  camera.updateMatrixWorld();
}
const fullScore = new Intl.NumberFormat('ja-JP');
const shortScore = new Intl.NumberFormat('ja-JP', { notation:'compact', maximumFractionDigits:1 });
let lastScore = -1;
function updateHUD() {
  $('region').textContent = state.region;
  $('delivered-count').textContent = (state.delivered?.size || 0) + ' / ' + (state.recipientTotal ?? state.npcs.length);
  cards.get('kagami').hidden = !state.kagamiUnlocked;
  if(trackedAnimal && state.delivered.has(trackedAnimal.id)) {
    trackedAnimal=trackedHabitat ? nearestUndelivered(undefined,trackedHabitat) :
      nearestUndelivered(trackedAnimal.type) || nearestUndelivered();
    if(!trackedAnimal) trackedHabitat=null;
  }
  if (lastScore !== state.score) {
    const score = $('score'), exact = fullScore.format(state.score);
    score.textContent = state.score < 10000000 ? exact : shortScore.format(state.score);
    score.title = exact + ' 点';
    score.setAttribute('aria-label', score.title);
    lastScore = state.score;
  }
  $('visits').textContent = state.visited.length + ' / ' + REGIONS.length;
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
  const openSea = p.inWater && !p.mount && shoreDistance(p.x,p.z) < 0;
  $('dive').hidden = !openSea;
  $('leap').setAttribute('aria-label', p.diveDepth ? '浮上する' : 'ジャンプ');
  if (openSea) {
    const depth = Math.max(1,Math.round(p.diveDepth));
    effects.push(p.diveDepth ? '水深 '+depth+' m' + (coarse ? ' ・ 跳ぶ長押しで浮上' : ' ・ Spaceで浮上') :
      (coarse ? '泳ぎ ・ 潜る長押し' : '泳ぎ ・ ↓で潜る'));
  }
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
    directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
  compassTicks.forEach((el, i) => {
    const n = base + i - 4,
      angle = n * 15;
    el.style.left = 50 + (angle - deg) * 1.15 + '%';
    el.classList.toggle('major', n % 3 === 0);
    el.firstElementChild.textContent = n % 3 === 0 ? directions[(((n / 3) % 8) + 8) % 8] : '';
  });
  const dest = trackedAnimal || REGIONS.find(r => r.id === goal);
  $('target').hidden = !dest;
  if (dest) {
    const dx = wrapDelta(dest.x - p.x),
      dz = wrapDelta(dest.z - p.z),
      heading = Math.atan2(dx, -dz) + yaw;
    const pointer = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][
      ((Math.round(heading / (Math.PI / 4)) % 8) + 8) % 8
    ];
    const name = trackedAnimal ? speciesNames[dest.type] : dest.name;
    const height = trackedAnimal ? trackedAnimal.y - p.y : dest.id === 'ryugu' ? Math.min(0,terrainHeight(dest.x,dest.z)+1-p.y) : 0;
    const elevation = Math.abs(height) > 2 ? '　' + (height > 0 ? '上 ' : '下 ') + Math.round(Math.abs(height)) + ' m' : '';
    $('target').textContent = pointer + '　' + name + '　' + Math.round(Math.hypot(dx, dz)) + ' m' + elevation;
  }
  if (!photoMode) drawMap($('minimap'), state, yaw, goal, false, null, trackedAnimal);
}
function openDialog(kind) {
  if (!renderer || dialog.open) return;
  clearInput();
  save();
  lastFocus = document.activeElement;
  dialogKind = kind;
  $('dialog-title').textContent = kind === 'map' ? '十五景の地図' : kind === 'journal' ? '三条通知の配達帳' : '旅の手引き';
  dialog.showModal();
  if (kind === 'map') {
    selectedPlace = goal || state.regionId;
    jumpPin = null;
    mapDialog();
  } else if (kind === 'journal') journalDialog();
  else helpDialog('歩き方');
}
function mapDialog() {
  const body = $('dialog-content');
  body.innerHTML =
    '<div class="atlas-layout"><canvas class="map-canvas" id="atlas" width="540" height="540"></canvas><div class="map-caption"><div class="map-places"></div><p class="map-detail" aria-live="polite"></p><div class="actions"><button class="jump-link" id="set-goal">ここを道しるべにする</button><button class="choice" id="local-animal" hidden>この地の動物に届ける</button><button class="choice" id="clear-goal">道しるべを外す</button></div></div></div>';
  for (const [i, r] of REGIONS.entries()) {
    const b = document.createElement('button');
    b.innerHTML = '<em>' + labels[i] + '</em> ' + r.name;
    b.dataset.id = r.id;
    b.onclick = () => selectMap(r.id);
    body.querySelector('.map-places').append(b);
  }
  const caption = body.querySelector('.map-caption');
  if (p.mode === 'kagami') {
    const jump = document.createElement('button'); jump.className='jump-link'; jump.id='map-jump';
    jump.textContent='この印へ瞬間移動';
    const hint = document.createElement('p'); hint.className='map-hint';
    hint.textContent='地図をタップして移動先を選べます。矢印キーでも印を動かせます。';
    caption.append(hint); caption.querySelector('.actions').prepend(jump);
    jump.onclick = () => {
      const point = jumpPin || REGIONS.find(r=>r.id===selectedPlace);
      if (!game.teleport(point.x,point.z)) { hint.textContent='近くに降りられる場所を選んでください。'; return; }
      lastFocus=canvas; dialog.close(); updateCamera(0,true); dispatchEvents(); updateHUD(); save();
    };
    $('atlas').tabIndex=0;
    $('atlas').onkeydown = e => {
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
      if (!delta) return;
      e.preventDefault();
      const point=jumpPin || REGIONS.find(r=>r.id===selectedPlace);
      const step=e.shiftKey ? 1 : 8;
      jumpPin={x:wrapDelta(point.x+delta[0]*step),z:wrapDelta(point.z+delta[1]*step)};
      redrawAtlas();
    };
  }
  $('atlas').onclick = e => {
    const r = mapHit($('atlas'),e);
    if (r) selectMap(r.id);
    if (p.mode==='kagami') { jumpPin=mapCoordinates($('atlas'),e); redrawAtlas(); }
  };
  const bookLink=document.createElement('button');
  bookLink.className='choice'; bookLink.textContent='配達帳を開く';
  bookLink.onclick=()=>{dialogKind='journal';$('dialog-title').textContent='三条通知の配達帳';journalDialog();};
  body.querySelector('.actions').append(bookLink);
  $('set-goal').onclick = () => {
    trackedAnimal = trackedHabitat = null;
    goal = selectedPlace;
    lastFocus = canvas;
    persistSettings();
    dialog.close();
    updateHUD();
  };
  $('local-animal').onclick=()=>trackDelivery(nearestUndelivered(undefined,selectedPlace),selectedPlace);
  $('clear-goal').hidden = !goal && !trackedAnimal;
  $('clear-goal').onclick = () => {
    trackedAnimal = trackedHabitat = null;
    goal = null;
    lastFocus = canvas;
    persistSettings();
    dialog.close();
    updateHUD();
  };
  selectMap(selectedPlace);
}
function trackDelivery(animal, habitat=null) {
  if(!animal) return;
  trackedAnimal=animal; trackedHabitat=habitat; goal=null;
  persistSettings();lastFocus=canvas;dialog.close();updateHUD();
}
function journalDialog() {
  const body=$('dialog-content');
  body.innerHTML='<div id="delivery-book"><div class="ledger-head"><p id="ledger-note"></p><span id="ledger-count"></span></div><div class="ledger-animals"></div></div>';
  const count=state.delivered.size, total=state.recipientTotal;
  $('ledger-count').textContent=count+' / '+total;
  $('ledger-note').textContent=count===total ? '全員に配達しました。鏡餅で十五景の旅をどうぞ。' : state.kagamiUnlocked ? '鏡餅が使えます。新しく加わった動物にも通知を届けてみましょう。' : '動物を選ぶと、まだ届いていない一匹へご案内します。全員に届けると鏡餅が開きます。';
  if (state.score >= 10000000) $('ledger-note').append('　通知点 ' + fullScore.format(state.score) + ' 点。');
  for (const [type,name] of Object.entries(speciesNames)) {
    const group=state.npcs.filter(n=>n.type===type);
    const number=group.filter(n=>state.delivered.has(n.id)).length;
    const row=document.createElement('button'); row.className='ledger-entry';
    row.dataset.species=type;
    row.innerHTML='<i class="animal-print" aria-hidden="true"></i><span><b></b><small></small></span><strong></strong>';
    const print=row.firstElementChild;
    if (SCROLL_FAUNA[type]) {
      const tile=faunaDrawing({type,variant:0,perched:false}).start+1;
      const {columns,rows}=FAUNA_SHEET;
      print.style.backgroundImage="url('./assets/residents/scroll-fauna.webp')";
      print.style.backgroundSize=(columns*100)+'% '+(rows*100)+'%';
      print.style.backgroundPosition=(tile%columns)/(columns-1)*100+'% '+Math.floor(tile/columns)/(rows-1)*100+'%';
    } else if (SEA_SPECIES[type]) {
      print.style.backgroundImage='url("'+seaPortrait(type)+'")';
      print.style.backgroundSize='contain';
    } else if (SPECIES[type]) {
      const drawing = beastDrawing(type);
      print.style.backgroundImage="url('./assets/residents/beasts.webp')";
      const [angle,box,cx,cy] = {
        monkey:[1,63,44,50], bird:[1,61,54,43], fox:[2,72,54,49], tiger:[2,73,54,50],
        dragon:[2,80,52,43], kirin:[1,67,52,53], deer:[1,73,46,46], boar:[2,73,46,53], shishi:[1,68,47,48],
      }[type];
      const cell = drawing.start + angle, width = BEASTS.columns*96, height = BEASTS.rows*96;
      const x = cell%BEASTS.columns*96+cx-box/2, y = Math.floor(cell/BEASTS.columns)*96+cy-box/2;
      print.style.backgroundSize=(width/box*100)+'% '+(height/box*100)+'%';
      print.style.backgroundPosition=(x/(width-box)*100)+'% '+(y/(height-box)*100)+'%';
    } else {
      const art=type==='turtle' ? 'turtle' : type+'-wander';
      print.style.backgroundImage="url('../assets/actors/"+art+".webp')";
    }
    row.querySelector('b').textContent=name;
    row.querySelector('small').textContent=((SPECIES[type] || SEA_SPECIES[type] || SCROLL_FAUNA[type])?.points || 10).toLocaleString('ja-JP')+' 点';
    row.querySelector('strong').textContent=number+' / '+group.length;
    row.disabled=number===group.length;
    row.onclick=()=>trackDelivery(nearestUndelivered(type));
    body.querySelector('.ledger-animals').append(row);
  }
  dialog.scrollTop=0;
}
function redrawAtlas() {
  const point = jumpPin || (p.mode==='kagami' ? REGIONS.find(r=>r.id===selectedPlace) : null);
  const name = trackedAnimal ? speciesNames[trackedAnimal.type] : '';
  const atlas = $('atlas');
  atlas.setAttribute('aria-label', '十五の名所、お餅の現在地と選んだ名所の自転車ポート' + (name ? '、配達先の' + name + 'の現在地' : ''));
  drawMap(atlas,state,yaw,selectedPlace,true,point,trackedAnimal,name);
}
function selectMap(id) {
  selectedPlace = id;
  jumpPin = null;
  const r = REGIONS.find((r) => r.id === id);
  for (const b of document.querySelectorAll('.map-places button'))
    b.setAttribute('aria-pressed', String(b.dataset.id === id));
  $('local-animal').hidden=!nearestUndelivered(undefined,id);
  const detail = document.querySelector('.map-detail');
  detail.textContent =
    r.name +
    '　' +
    Math.round(Math.hypot(wrapDelta(p.x - r.x), wrapDelta(p.z - r.z))) +
    ' m　 ·　 ' +
    (state.visited.includes(id) ? '御朱印を獲得済み' : '未訪問の名所');
  const landmarks = {
    snow: '御朱印所の東に大きな露天風呂。雪だるまの並ぶ参道から湯気が見えます。',
    autumn: '楓の枝が重なる谷道。紅葉をくぐって峡へ。',
    moon: '北の空には十五夜の月。薄のそばの三方に近づくと、月見団子を食べられます。',
    dawn: '東の海から昇る初日。浜では臼を囲んで餅をつく。',
    kyo: '舞妓餅が行き交う都。広場の茶席で蛙が盆を差し出し、向かいの辻では兎と蛙が笛と太鼓を合わせます。西の辻から北へ入ると京の評定所。白洲の奥に裁きの座があります。茶とみたらし団子は店先で。夜は大通りから北の山に大の送り火が見えます。',
    peach: '東の峠を抜け、桃の花をたどって谷底へ。木陰では兎と蛙が相撲を取り、猿が土俵をのぞきこみます。',
    ryugu: '海風の松原から西へ泳ぎ、'+(coarse?'「潜る」':'↓ キー')+'を長押しして海底へ。真珠灯籠と海亀・鯛・蛸の一座をたどり、楼門の先の御朱印所へ。'+(coarse?'「跳ぶ」':'Space キー')+'を長押しすると浮上します。',
    todaiji: '回廊の先に、蓮の座に鎮まる大餅仏。参道で鹿が兎に一礼し、脇では猿と兎が筆を運びます。',
    inari: '朱の鳥居をくぐって雲上の奥社へ。日が差す雨の参道には、狐の嫁入りの行列が現れます。'
  };
  if (landmarks[id]) detail.append(document.createElement('br'), landmarks[id]);
  const port = regionPort(state, id);
  if (port) {
    const dx = wrapDelta(port.x - p.x), dz = wrapDelta(port.z - p.z);
    const bearing = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'][(Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8];
    const distance = Math.round(Math.hypot(dx, dz));
    const location = distance < 3 ? '足元' : '現在地から' + bearing + ' ' + distance + ' m';
    detail.append(document.createElement('br'), 'Ⓟ 電動自転車ポート　' + port.bikes + '台', document.createElement('br'), location);
  }
  redrawAtlas();
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
  if (location.origin === PAGES_ORIGIN && hasJourney) {
    const transfer = document.createElement('button');
    transfer.className = 'choice';
    transfer.textContent = 'Cloudflare版に旅の記録を引き継ぐ';
    transfer.onclick = () => {
      const url = transferURL(location.origin, read(saveKey), journeySettings());
      if (url) location.assign(url);
      else transfer.textContent = '旅の記録を読み取れませんでした';
    };
    body.querySelector('.actions').append(transfer);
  } else if (location.origin === WORKER_ORIGIN && !hasJourney) {
    const link = document.createElement('a');
    link.href = PAGES_GUIDE;
    link.textContent = '以前の旅を引き継ぐ（GitHub Pages版の手引き）';
    body.querySelector('.credit').append(document.createElement('br'),link);
  }
  $('continue').onclick = () => { lastFocus = canvas; dialog.close(); };
}
$('map').onclick = $('mini-button').onclick = () => openDialog('map');
$('journal').onclick = () => openDialog('journal');
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
let renderWidth = 0, renderHeight = 0;
function resize(force = false) {
  if (!renderer) return;
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (!w || !h) return;
  const photoRatio = Math.min(coarse ? 1.65 : 2, Math.max(1.6, devicePixelRatio || 1), Math.sqrt(4200000/(w*h)));
  const pixelRatio = photoMode ? photoRatio : ratio;
  if (force !== true && renderWidth === w && renderHeight === h && pixelRatio === renderer.getPixelRatio()) return;
  renderWidth = w;
  renderHeight = h;
  renderer.setDrawingBufferSize(w, h, pixelRatio);
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
  ink.draw(scene, focusDistance, scrollCoverage(p.x,p.z));
}
function frame(now) {
  requestAnimationFrame(frame);
  const paused = document.hidden || dialog.open || contextLost;
  audio.setPaused(paused);
  if (paused) {
    previous = 0;
    return;
  }
  // Carry the 60 Hz deadline forward: 75, 90 and 144 Hz screens must not
  // lose a whole refresh each time the display clock falls either side of it.
  const interval = 1000 / 60;
  if (!previous || now >= nextFrame + interval) nextFrame = now;
  if (now + .75 < nextFrame) return;
  nextFrame += interval;
  const delta = previous ? Math.min((now - previous) / 1000, 0.09) : 1 / 60;
  previous = now;
  const left = Number(keys.has('ArrowLeft') || keys.has('KeyA')),
    right = Number(keys.has('ArrowRight') || keys.has('KeyD'));
  const seaControls = p.inWater && !p.mount && shoreDistance(p.x,p.z) < 0;
  const forward =
    Number(keys.has('ArrowUp') || keys.has('KeyW')) -
    Number((!seaControls && keys.has('ArrowDown')) || keys.has('KeyS')) -
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
      dive: diveTouch || (seaControls && keys.has('ArrowDown')),
    });
    dispatchEvents();
  } else photoTime += delta;
  updateCamera(delta);
  sun.target.position.set(p.x, p.y, p.z);
  applyClimateLights(hemisphere, sun, bounce, p, photoMode ? photoTime : state.time);
  wake(p, photoMode ? photoTime : state.time);
  const sceneTime = photoMode ? photoTime : state.time;
  audio.updateWorld(state, sceneTime, yaw, photoMode);
  world.update(sceneTime, p, camera);
  meadow(sceneTime, p, camera);
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
      } else if (workTime / frames < .019 && ratio < nativeRatio && now - qualitySince > 10000) {
        ratio = Math.min(nativeRatio, ratio / .82);
        resize();
        qualitySince = now;
      }
      frames = 0;
      workTime = 0;
    }
  }
}
async function boot() {
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
    resize();
    updateCamera(1, true);
    setRiverStones(scene, state.objects);
    const [heroTextures, landscape, coats] = await Promise.all([
      loadRiceModel(), finishInSlices(prepareWorld(scene)), preloadBeastCoats(), loadMapPaper(),
    ]);
    world = landscape;
    meadow = createMeadow(scene, state.objects, coarse, state.npcs);
    wake = createWake(scene);
    sun.target.position.set(p.x,p.y,p.z);
    applyClimateLights(hemisphere, sun, bounce, p, state.time);
    wake(p, state.time);
    actors = createActors(scene, renderer);
    await actors.prepare(state);
    bathReflection = createBathReflection(renderer, scene, actors.hero);
    actors.update(state, 0, camera);
    world.update(state.time, p, camera);
    meadow(state.time, p, camera);
    await Promise.all([
      ink.prepare(scene),
      finishInSlices(uploadSceneTextures(renderer, scene, [...heroTextures, ...world.textures, ...coats])),
    ]);
    drawScene();
    updateHUD();
    $('loading').hidden = true;
    if (transferStatus) message(transferStatus,6);
    if (location.origin === PAGES_ORIGIN && location.hash === '#guide') {
      history.replaceState(history.state, '', location.pathname + location.search);
      openDialog('guide');
    }
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
      resize(true);
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
