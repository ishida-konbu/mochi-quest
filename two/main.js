import { createCookingPerformance } from './cooking-performance.js';
import { createExplorationFelling } from './exploration-felling.js';
import { createCampSleepView } from './camp-sleep-view.js';
import { createConstructionView } from './living-construction-view.js';
import { syncBuildTerrain, fellTree } from './living-build.js';
import { routeBlocked } from './living-build-land.js';
import { createBuildEditor } from './build-editor.js';
import { createBuildEditorViewport } from './build-editor-viewport.js';
import { createLivingBook } from './living-book.js';
import { LIVING_SITES } from './living-sites.js';
import { worldClockLabel, waitTargetMinute } from './world-clock.js';
import { claimJourneyWriter, openJourneyStorage } from './journey-storage.js';
import { showJourneyFiles } from './journey-files.js';
import * as THREE from './vendor/three.module.min.js';
import { applyClimateLights } from './atmosphere.js';
import { createWake } from './wake.js';
import { canFollowTravel, createTravelCamera, chopCameraArc } from './travel-camera.js';
import { prepareWorld } from './world.js';
import { DEFAULT_SCENERY_QUALITY, sceneryQualityPreference } from './scenery-quality.js';
import { finishInSlices, watchArrivalPaint } from './preparation.js';
import { setRiverStones } from './scanned-stone.js';
import { bathPosture,seatedFeet } from './bath-gestures.js';
import { createBathReflection } from './spring-water.js';
import { scrollCoverage } from './scroll-paper.js';
import { createInkPass } from './ink.js';
import { createActors, getExpression } from './actors.js';
import { loadRiceModel } from './mochi-model.js';
import { PAGES_ORIGIN, PAGES_GUIDE, WORKER_ORIGIN, BACKUP_KEY, PREVIOUS_KEY, SETTINGS_KEY as settingsKey,
  travelCameraPreference, transferURL, decodeTransfer, storeTransfer, replaceJourney } from './journey-transfer.js';
import { createGame, canUseModeOnMount } from './game.js';
import { createStoryWorld } from './mochiyori-world.js';
import { createPerformance } from './mochiyori-performance.js';
import { createStoryDialogue } from './mochiyori-dialogue.js';
import { createSpeechView } from './mochiyori-bubbles.js';
import { createBookView } from './mochiyori-book.js';
import { chapterLabel } from './mochiyori-progress.js';
import { SPECIES, legendDeliveryPoint } from './bestiary.js';
import { legendary } from './legend-flight.js';
import { SCROLL_FAUNA, faunaDrawing, FAUNA_SHEET } from './scroll-fauna.js';
import { SEA_SPECIES } from './ryugu-residents.js';
import { seaPortrait } from './ryugu-performers.js';
import { BEASTS, beastDrawing } from './procession-view.js';
import { openAnimalScale } from './animal-scale-book.js';
import { openAtlas } from './atlas-dialog.js';
import { REGIONS, canDiveAt, waterSurfaceAt, terrainHeight, terrainContactHeight, groundHeight, landscapeFloor, staticVolumeAt, wrapDelta, BOUND } from './terrain.js';
import { palaceInteriorAt, palaceStoreyAt } from './ryugu-layout.js';
import { createMeadow } from './meadow.js';
import { createSoundscape } from './soundscape.js';
import { inariWeatherAt } from './inari-weather.js';
import { createAudio, normalizeVolumes } from '../sound.js';
import { createAudioSettings } from './audio-settings.js';
import { createMiniMap } from './mini-map.js';
import { atlasDestinations } from './atlas-destinations.js';
import { guideBearing, mapPoint, restoreMapGoal, savedMapGoal } from './wayfinding.js';
import { MODES, EMOTES, HELP, glyph, paintGlyphs, drawFace } from './interface.js';
import { loadMapPaper, drawMap } from './map.js';

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
const restingEyeHeightOffset = { sleep: 0.26 };
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
let journeyStorage = null;
const writer = await claimJourneyWriter();
try { journeyStorage = openJourneyStorage(localStorage); } catch { /* Saving may be disabled by the browser. */ }
function sourceGame() {
  try { return createGame(JSON.parse(journeyStorage?.original ?? 'null')); }
  catch { return createGame(); }
}
async function startJourney() {
  const local = { game: sourceGame(), settings: read(settingsKey) || {} };
  const hash = window.pendingMochiJourney;
  delete window.pendingMochiJourney;
  if (!hash || location.origin !== WORKER_ORIGIN) return local;
  const incoming = decodeTransfer(location.origin, hash, createGame);
  if (!incoming) return { ...local, status: '引き継ぐ記録を読み取れませんでした。' };
  try {
    if (!writer || !journeyStorage?.current()) throw new Error();
    if (journeyStorage.original !== null && !await confirmJourney(local.game, incoming.game))
      return { ...local, status: 'Cloudflare版の現在の記録から再開しました。' };
    storeTransfer(localStorage, incoming);
    journeyStorage = openJourneyStorage(localStorage);
    return { ...incoming, status: 'GitHub Pages版の旅の記録を引き継ぎました。' };
  } catch {
    return { ...local, status: '旅の記録を保存できませんでした。ブラウザの保存設定を確認してください。' };
  }
}
paintGlyphs();
const { game, settings: savedSettings, status: transferStatus } = await startJourney();
let hasJourney = game.restored;
const unreadable = journeyStorage?.original != null && !game.restored;
let saveWarning = !writer ? '別のタブで旅を保存中です。そちらを閉じて、この画面を読み込み直してください。'
  : unreadable ? '保存元の記録を読み取れません。手引きの「旅の記録」で控えを書き出せます。'
  : !journeyStorage ? 'ブラウザに保存できません。手引きの「旅の記録」から書き出せます。' : '';
function showSaveWarning(text) {
  saveWarning = text;
  $('save-notice').textContent = text && '未保存 · 旅の記録';
  $('save-notice').hidden = !text;
  $('save-notice').title = text;
}
showSaveWarning(saveWarning);
const state = game.state,
  p = state.player;
syncBuildTerrain(state.livingWorld);
const miniMap = createMiniMap($('mini-chart'), savedSettings.minimap, persistSettings, p,
  () => redrawMiniMap(pinnedStorySite()));
state.inariWeather = inariWeatherAt(p.x, p.z, state.time, state.flightSeed);
const audio = createAudio(createSoundscape);
let audible = savedSettings.sound !== false;
let volumes = normalizeVolumes(savedSettings.volumes);
let sceneryQuality = sceneryQualityPreference(savedSettings.sceneryQuality) ?? DEFAULT_SCENERY_QUALITY;
let travelCameraEnabled = travelCameraPreference(savedSettings) ?? true;
audio.setVolumes(volumes);
let yaw = Number.isFinite(savedSettings.yaw) ? savedSettings.yaw : 0;
const travelCamera = createTravelCamera();
let chopOrbit = null;
let pitch = 0.23,
  distance = 6.55,
  priorCamera = null,
  photoMode = false;
let mapDestinations = atlasDestinations(state), mappedStructures = state.livingWorld.structures;
let goal = restoreMapGoal(savedSettings.goal, mapDestinations);
let trackedAnimal = null, trackedHabitat = null;
const guideTorso = {};
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
  lastFocus = null;
let speechExpires = 0,
  toastExpires = 0,
  nextHUD = 0,
  lastSave = state.time;
let nextFrame = 0,
  previous = 0,
  renderer,
  world,
  storyWorld,
  meadow,
  actors,
  bathReflection,
  wake,
  ink,
  contextLost = false,
  playable = false;
const keys = new Set(),
  stick = { id: null, x: 0, y: 0 },
  look = { id: null, x: 0, y: 0 };
const swimmingControls = () => !p.activity && !p.mount && p.inWater && (p.diveDepth>0 || canDiveAt(p.x,p.z,p.y));
const backwardHeld = () => keys.has('ArrowDown') || keys.has('KeyS');
// Allow the two dive keys to arrive in either order. A short Space tap
// jumps on release, even when it falls entirely between animation frames.
const diveChordWindowMs = 80;
let surfaceJumpAt = Infinity;
let jumpTouch = false, diveTouch = false,
  lastFace = '',
  lastMode = '',
  lastMount = null,
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
// A tab opened before a reset must not autosave its old journey on pagehide.
let restarting = false, hasWritten = false;
function restartJourney() {
  if (restarting) return;
  restarting = true;
  location.reload();
}
function canSaveJourney() {
  if (!restarting && read(settingsKey)?.resetAt !== savedSettings.resetAt) restartJourney();
  return !restarting && writer && Boolean(journeyStorage?.current());
}
window.addEventListener('pageshow', event => { if (event.persisted) restartJourney(); });
window.addEventListener('storage', event => {
  if (event.key === settingsKey && read(settingsKey)?.resetAt !== savedSettings.resetAt) restartJourney();
});
function journeySettings() {
  return {
    sound: audible, volumes, sceneryQuality, travelCamera: travelCameraEnabled, yaw: photoMode ? priorCamera.yaw : yaw,
    goal: savedMapGoal(goal), minimap: miniMap.settings, resetAt: savedSettings.resetAt,
  };
}
function persistSettings() {
  if (canSaveJourney()) store(settingsKey, journeySettings());
}
function save() {
  if (mappedStructures!==state.livingWorld.structures) {
    mapDestinations=atlasDestinations(state);
    mappedStructures=state.livingWorld.structures;
    if(goal?.kind==='homestead') goal=mapDestinations.find(d=>d.id===goal.id) ?? null;
  }
  if (!active || unreadable || !writer || !journeyStorage || restarting) return;
  try {
    if (!canSaveJourney()) {
      showSaveWarning('別の画面で記録が更新されました。旅を続けるには読み込み直してください。');
      return;
    }
    const snapshot = game.save();
    snapshot.livingWorld.revision++;
    if (!hasWritten && !createGame(snapshot).restored) throw new Error();
    journeyStorage.write(snapshot);
    state.livingWorld.revision = snapshot.livingWorld.revision;
    hasWritten = hasJourney = true;
    store(settingsKey, journeySettings());
    if (saveWarning) showSaveWarning('');
  } catch {
    showSaveWarning('旅を保存できませんでした。手引きの「旅の記録」から今の旅を書き出せます。');
  }
}
function unlock() {
  active = true;
  audio.unlock();
}
function setAudio(value) {
  audible = value;
  audio.setEnabled(value);
  audioSettings.setMuted(!value);
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
    if (e.type === 'livingChanged') save();
    if(e.type==='chop' && !chopping.active){
      clearInput();
      if(chopping.start(e.tree)){
        const stem=e.tree.stem??e.tree;
        const axis=Math.atan2(wrapDelta(p.x-stem.x),wrapDelta(p.z-stem.z));
        chopOrbit=chopCameraArc(yaw,axis,chopCameraClearance);
      }
    }
    if (e.type === 'living') {
      const site = LIVING_SITES.find(s => s.id === e.siteId);
      if (e.section) openDialog('living',e.section==='build'?'materials':e.section);
      else if (site) openDialog('living',site.kind === 'workshop' ? 'craft' : 'supplies');
    }
    if (e.type === 'say') {
      $('speech').hidden = false;
      $('speech').textContent = e.text;
      speechExpires = performance.now() + 950;
    }
    if (e.type === 'message') message(e.text);
    if (e.type === 'score') message('三条通知が届いた　＋' + e.value, 1.1);
    if (e.type === 'stamp' && goal?.id === e.id) {
      goal = null;
      persistSettings();
    }
  }
}
function nearbyAction() {
  const original = game.nearest();
  if (p.skiff) return original;
  const encounter = storyWorld?.nearest(p);
  return encounter && (!original || encounter.distance < original.distance + .3) ? encounter : original;
}
let cinemaViewer, localResidentName, localResident, residentVisibility;
const performancePlayer = createPerformance({
  scene,camera,dialog,
  enter(site) {
    localResidentName={rashomon:'羅生門の老婆餅',bell:'鐘を守る僧餅'}[site.place];
    localResident=null;
    storyWorld.visible(false);
    actors.visible(false);
    cinemaViewer = {...p,worldMinute:p.worldMinute,x:site.x,y:site.y,z:site.z,activity:null,mount:null};
    sun.target.position.set(site.x,site.y,site.z);
    applyClimateLights(hemisphere,sun,bounce,cinemaViewer,state.time);
  },
  draw(site,time) {
    const t=state.time+time;
    world.update(t,cinemaViewer,camera,state.time,state.bellStrike,state.inariWeather);
    if(localResidentName){
      if(!localResident){localResident=scene.getObjectByName(localResidentName);residentVisibility=localResident?.visible;}
      if(localResident)localResident.visible=false;
    }
    meadow(t,cinemaViewer,camera);
    bathReflection(cinemaViewer,t,camera);
    ink.draw(scene,0,scrollCoverage(site.x,site.z),t);
  },
  leave() {
    if(localResident)localResident.visible=residentVisibility;
    localResident=null;localResidentName=null;
    storyWorld.visible(true);actors.visible(true);
    sun.target.position.set(p.x,p.y,p.z);
    applyClimateLights(hemisphere,sun,bounce,p,state.time);
    // A phone may have rotated while the notebook used its own inspection lens.
    camera.fov=camera.aspect<1?65:57;
    camera.updateProjectionMatrix();
    updateCamera(0,true);
    world.update(state.time,p,camera,state.time,state.bellStrike,state.inariWeather);
    meadow(state.time,p,camera);storyWorld.update(state.time,p);
    drawScene();previous=0;updateHUD();
  }
});
let carried = game.notebook.inventory();
const dialogue = createStoryDialogue(game.notebook, {
  onChange() {
    const next = game.notebook.inventory();
    const given = carried.filter(item => !next.includes(item));
    const received = next.filter(item => !carried.includes(item));
    carried = next;
    const receipt = [];
    if (given.length) receipt.push(given.map(item => item.name).join('、') + 'を渡した');
    if (received.length) receipt.push(received.map(item => item.name).join('、') + 'を風呂敷にしまった');
    if (receipt.length) message(receipt.join('。'), 5);
    storyLeads = dialogue.leads();
    storyWorld.invalidate(receipt.length>0); save(); updateHUD();
  }
});
let storyLeads = dialogue.leads();
function pinnedStorySite() {
  const id = game.notebook.pin;
  return id && storyLeads.find(lead => lead.id === id)?.site;
}
function applyAtlasGoal(destination) {
  game.notebook.track(null);
  trackedAnimal = trackedHabitat = null;
  goal = destination;
  unlock();
  save();
  updateHUD();
}
let conversationShot = null, shotVisible = false, dissolvingFrame = null;
// Cross a large change of viewpoint with a short dissolve. A flying camera
// would carry the player through the other side of the table or through a wall.
function dissolveView() {
  if (!playable || contextLost || document.hidden) return;
  dissolvingFrame?.remove();
  const still = document.createElement('canvas');
  const scale = Math.min(1, 1080 / Math.max(canvas.width, canvas.height));
  still.width = Math.max(1,Math.round(canvas.width * scale));
  still.height = Math.max(1,Math.round(canvas.height * scale));
  const drawing = still.getContext('2d', {alpha:false});
  if (!drawing) return;
  drawScene();
  drawing.drawImage(canvas, 0, 0, still.width, still.height);
  still.className = 'conversation-dissolve';
  still.setAttribute('aria-hidden','true');
  canvas.after(still);
  dissolvingFrame = still;
  const fade = still.animate([{opacity:1},{opacity:0}], {duration:260,easing:'ease-in-out',fill:'forwards'});
  fade.onfinish = () => {
    still.remove();
    if (dissolvingFrame === still) dissolvingFrame = null;
  };
}
const speech = createSpeechView({
  destination: () => game.notebook.pin ? storyLeads.find(lead => lead.id === game.notebook.pin)
    : storyLeads.length === 1 ? storyLeads[0] : null,
  stage, canvas, camera, player:p, dialogue, world:()=>storyWorld,
  activate(){unlock();clearInput();},
  approach() {
    conversationShot = storyWorld.conversationShot(camera.aspect, yaw);
  },
  inspectHands(closeUp) {
    const prior=conversationShot;
    if (!prior) return false;
    const next=closeUp ? storyWorld.conversationShot(camera.aspect,prior.yaw,true) : prior.wide;
    if (!next) return false;
    dissolveView();
    if (closeUp) next.wide=prior;
    conversationShot=next;
    focus.copy(next.focus);
    return true;
  }
});
const notebook = createBookView({
  dialog, body: $('dialog-content'), heading: $('dialog-title'), book: game.notebook,
  save, dialogue, perform: performancePlayer.start,
  track(dest) {
    trackedAnimal = trackedHabitat = goal = null;
    persistSettings();
    lastFocus = canvas;
    dialog.close();
    message(dest.name + 'に道しるべを付けました');
    updateHUD();
  }
});
const cooking = createCookingPerformance({
  scene, camera, dialog, player:p,
  enter() {
    clearInput();
    actors.hero.visible = false;
    sun.target.position.set(p.x,p.y,p.z);
    audio.setPaused(false);
    unlock();
  },
  draw(dt) {
    game.stepCookingScenery(dt);
    const time = state.time;
    storyWorld.update(time,p);
    actors.update(state,dt,camera);
    world.update(time,p,camera,state.time,state.bellStrike,state.inariWeather);
    meadow(time,p,camera);
    bathReflection(p,time,camera);
    ink.draw(scene,0,scrollCoverage(p.x,p.z),time);
  },
  leave() {
    actors.hero.visible = true;
    audio.setPaused(quietWorld());
    previous = 0;
    camera.fov = camera.aspect < 1 ? 65 : 57;
    camera.updateProjectionMatrix();
    updateCamera(0,true);
    world.update(state.time,p,camera,state.time,state.bellStrike,state.inariWeather);
    meadow(state.time,p,camera);
    if (!contextLost) drawScene();
  },
  playSound(name) {audio.handle({type:'sound',name:'cook-'+name});},
});
const outdoorWork={
  scene,camera,player:p,dialog,
  canStand(x,z,y,radius,height) {
    if (game.storyCollisions.penetration(x,z,y,height,radius)>0) return false;
    return !state.nearbyNpcs.some(n=>Math.abs(n.y-y)<2 && Math.hypot(wrapDelta(n.x-x),wrapDelta(n.z-z))<radius+.75);
  },
  enter(){ clearInput();actors.hero.visible=false; },
  draw(){
    world.update(state.time,p,camera,state.time,state.bellStrike,state.inariWeather);
    meadow(state.time,p,camera);drawScene();
  },
  leave(){
    actors.hero.visible=true;previous=0;
    camera.clearViewOffset();
    camera.fov=camera.aspect<1?65:57;camera.updateProjectionMatrix();
    updateCamera(0,true);
    world.update(state.time,p,camera,state.time,state.bellStrike,state.inariWeather);
    meadow(state.time,p,camera);if(!contextLost)drawScene();
  },
};
const chopping=createExplorationFelling({
  scene,player:p,hero:()=>actors.hero,
  canStand:(x,z,y,radius,height)=>outdoorWork.canStand(x,z,y,radius,height),
  commit(tree){
    const result=fellTree(state.livingWorld,tree.id);
    if(result.ok)save();
    return result;
  },
  impact(){audio.handle({type:'sound',name:'axe-chop'});},
  done(result){chopOrbit=null;clearInput();if(result?.ok)save();if(result)message(result.message||result.reason);updateHUD();},
});
const sleepingViewer=Object.create(p,{worldMinute:{value:0,writable:true}});
const sleepingWorld=Object.create(state,{player:{value:sleepingViewer}});
const sleeping=createCampSleepView({scene,camera,player:p,dialog,canStand:outdoorWork.canStand,
  enter(bed){clearInput();actors.hero.visible=false;world.setOccupiedBed(bed.id);},
  draw(visualMinute,dt=0){
    sleepingViewer.worldMinute=visualMinute;
    game.stepCookingScenery(dt);
    const time=state.time;
    sun.target.position.set(p.x,p.y,p.z);
    applyClimateLights(hemisphere,sun,bounce,sleepingViewer);
    actors.update(state,dt,camera);storyWorld.update(time,p);
    world.update(time,sleepingViewer,camera,time,state.bellStrike,state.inariWeather);
    meadow(time,sleepingViewer,camera);
    audio.updateWorld(sleepingWorld,time,yaw,false);
    if(!contextLost)drawScene();
  },
  leave(){
    world.setOccupiedBed(null);
    applyClimateLights(hemisphere,sun,bounce,p);
    outdoorWork.leave();
  },
});
const construction=createConstructionView({...outdoorWork,
  canStand(x,z,y,radius,height) {
    return game.storyCollisions.penetration(x,z,y,height,radius)<=0 &&
      !routeBlocked({npcs:state.nearbyNpcs}, {x,z}, radius);
  },
  enter(site){ world.setConstructionSite(site);outdoorWork.enter();unlock();audio.setPaused(false); },
  draw(dt,detailScene){
    if(detailScene){ink.draw(detailScene,0,0,state.time);return;}
    game.stepCookingScenery(dt);
    actors.update(state,dt,camera);storyWorld.update(state.time,p);
    outdoorWork.draw();
  },
  leave(){
    world.setConstructionSite(null);
    actors.faceHeading(p.heading);actors.update(state,0,camera);
    outdoorWork.leave();
  },
  playSound(name){audio.handle({type:'sound',name:'build-'+name});},
});
const makeBuildViewport=()=>createBuildEditorViewport({scene,camera,canvas,world,draw(){
  world.update(state.time,p,camera,state.time,state.bellStrike,state.inariWeather);
  meadow(state.time,p,camera);if(!contextLost)drawScene();
}});
const editor=createBuildEditor({dialog,game,makeViewport:makeBuildViewport,bearing:()=>yaw,save,
  guideTree(tree){guideTo({...tree,name:'伐る木'});},
  openMaterials(){livingBook.open('materials');},
  construct(site,commit,done) {
    return construction.start(site,exit=>{
      dissolveView();
      const result=commit(exit);
      if(result.ok){
        yaw=Math.atan2(-Math.sin(exit.heading),-Math.cos(exit.heading));
        persistSettings();
      }
      return result;
    },done);
  },
});
const livingBook = createLivingBook({
  dialog, body:$('dialog-content'), heading:$('dialog-title'), game, save, editor,
  cook:cooking.start,
  sleep(bed,hour,back){
    const startMinute=state.livingWorld.worldMinute,targetMinute=waitTargetMinute(startMinute,hour);
    sleeping.start(bed,{startMinute,targetMinute,
      commit(){const r=game.waitUntil(hour);if(r.ok)save();return r;},
      done(r){
        if(r.ok){dialog.close();message(worldClockLabel(state.livingWorld.worldMinute)+'　寝床で目を覚ましました。');}
        else back(r);
      },
    });
  },
  guide:guideTo,
});
function guideTo(site){
  const destination=mapDestinations.find(d=>d.id===site.id)??{...mapPoint(site.x,site.z),name:site.name};
  applyAtlasGoal(destination);
  lastFocus=canvas;
  dialog.close();
  message(site.name+'に道しるべを付けました。');
}
function action(name) {
  if (dialog.open || photoMode || chopping.active) return;
  unlock();
  const found = (name === 'interact' || name === 'story') && nearbyAction();
  if (speech.active && (name === 'interact' || name === 'story')) { speech.advance(); return; }
  if (found?.person) { speech.start(found); updateHUD(); return; }
  // As the traveller lies back, the toes drift towards the near corner
  // of the frame. The direction is saved with the rest of the journey.
  game.act(name, name === 'throw' ? actors?.hero.rotation.y : name==='interact' ? yaw+.77 : undefined);
  dispatchEvents();
  updateHUD();
}
const audioSettings = createAudioSettings({
  volumes,
  sceneryQuality,
  onSceneryQualityChange(value) {
    sceneryQuality = value;
    world?.setSceneryQuality(value);
    persistSettings();
  },
  goalUpEnabled: miniMap.settings.goalUp,
  onGoalUpChange: miniMap.setGoalUp,
  travelCameraEnabled,
  onTravelCameraChange(enabled) {
    travelCameraEnabled = enabled;
    persistSettings();
  },
  onOpen() {
    speech.stop();
    clearInput();
    unlock();
  },
  onReset() {
    if (!canSaveJourney()) return;
    const preferences = { ...journeySettings(), yaw: 0, goal: null, resetAt: Date.now() };
    try {
      replaceJourney(localStorage, preferences, null);
    } catch {
      message('リセットできませんでした。ブラウザの保存設定を確認してください。', 6);
      return;
    }
    restartJourney();
  },
  onChange(nextVolumes) {
    volumes = nextVolumes;
    audio.setVolumes(volumes);
    persistSettings();
  },
});
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
  travelCamera.reset();
  surfaceJumpAt = Infinity;
  jumpTouch = diveTouch = false;
  stick.id = null;
  stick.x = stick.y = 0;
  look.id = null;
  $('stick').firstElementChild.style.transform = '';
}
function togglePhoto() {
  if (!actors || dialog.open || chopping.active) return;
  speech.stop();
  clearInput();
  if (!photoMode) {
    priorCamera = { yaw, pitch, distance };
    photoMode = true;
    state.photo = true;
    photoTime = state.time;
    const bath=p.bathPose,reclining=bath?.recline || 0;
    const seated=bathPosture(bath?.action);
    const shellBath=bath?.id==='sazae-mouth';
    yaw=shellBath?bath.heading-.74:actors.hero.rotation.y+(bath?.action==='rinse' ? 1.34 : seated ? .48 : -.77*reclining);
    pitch=seated?seated.camera:.105+.68*reclining;
    const portrait=camera.aspect<.83;
    const floatingDistance=portrait ? Math.max(5.63,3.18/camera.aspect) : 3.99;
    distance = shellBath ? (portrait?6.4:5.3) :
      THREE.MathUtils.lerp(portrait?3.48:2.95,floatingDistance,reclining)*(1+.64*p.airStretch);
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
  const turn = -dx * .0055;
  if (speech.active && conversationShot) {
    conversationShot.yaw += turn;
    conversationShot.pitch = clamp(conversationShot.pitch + dy * .004, .04, .92);
    return;
  }
  if (dx || dy) {
    chopOrbit=null;
    travelCamera.manualLook(turn);
  }
  yaw += turn;
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
  if(!speech.active)conversationShot=null;
  if (speech.active && conversationShot) {
    conversationShot.distance = clamp(conversationShot.distance * Math.exp(clamp(e.deltaY,-200,200)*.0015), 2.1, 9);
    return;
  }
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
  if (stick.id !== null || chopping.active) return;
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
  if (!diveTouch) action('jump');
};
$('leap').onlostpointercapture = () => {
  jumpTouch = false;
};
$('dive').onpointerdown = e => {
  if (dialog.open || photoMode) return;
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  surfaceJumpAt = Infinity;
  diveTouch = true;
  unlock();
};
$('dive').onlostpointercapture = () => { diveTouch = false; };
$('send').onpointerdown = (e) => {
  e.preventDefault();
  action('throw');
};
$('context').onclick = () => action(nearbyAction()?.action || 'interact');
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
  'KeyJ',
  'KeyI',
  'KeyL',
  'KeyH',
  'KeyP',
  'Escape',
  'Space',
  'KeyB',
  'Digit0',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
]);
document.addEventListener('keydown', (e) => {
  if (!playable || contextLost) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  if (!dialog.open && speech.handleKey(e)) return;
  if (!bindings.has(e.code)) return;
  if(chopping.active && e.code!=='KeyQ' && e.code!=='KeyR'){e.preventDefault();return;}
  if (dialog.open) {
    if (cooking.active || sleeping.active || construction.active) return;
    if(editor.active && e.code==='KeyB' && !e.repeat){e.preventDefault();dialog.close();return;}
    if (dialogKind === 'living' && e.code === 'KeyL' && !e.repeat && !e.target.closest('input,textarea,select')) {
      e.preventDefault();
      dialog.close();
      return;
    }
    if (dialogKind === 'story' && e.code === 'KeyI' && !e.repeat && !performancePlayer.active) {
      e.preventDefault();
      if ($('dialog-title').textContent === '旅の風呂敷') dialog.close();
      else notebook.inventory();
      return;
    }
    if (
      !e.repeat &&
      ((dialogKind === 'story' && e.code === 'KeyJ') || (dialogKind === 'map' && e.code === 'KeyM') ||
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
  if (backwardHeld()) surfaceJumpAt = Infinity;
  if (e.code === 'KeyC') {
    togglePhoto();
    return;
  }
  if (e.code === 'Escape' && photoMode) {
    togglePhoto();
    return;
  }
  if (e.code === 'KeyB' && !photoMode) { openDialog('living','build'); return; }
  if (e.code === 'KeyL' && !photoMode) { openDialog('living'); return; }
  if (e.code === 'KeyI' && !photoMode) { openDialog('inventory'); return; }
  if (e.code === 'KeyJ' && !photoMode) { openDialog('story'); return; }
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
  if (e.code === 'Space') {
    if (!swimmingControls()) action('jump');
    else if (!p.diveDepth && !backwardHeld() && !diveTouch) surfaceJumpAt = performance.now() + diveChordWindowMs;
  }
});
document.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'Space' && Number.isFinite(surfaceJumpAt)) {
    surfaceJumpAt = Infinity;
    action('jump');
  }
});
window.addEventListener('blur', () => {
  clearInput();
  save();
});
document.addEventListener('visibilitychange', () => {
  cooking.resetClock();
  sleeping.resetClock();
  construction.resetClock();
  audio.setPaused(quietWorld());
  clearInput();
  previous = 0;
  save();
});
window.addEventListener('pagehide', event => {
  audio.setPaused(true);
  save();
  // Keep the live context for back/forward cache restores. Release the GPU
  // promptly on an actual navigation away, including repeated reloads.
  if (event.persisted === false && renderer && !renderer.getContext().isContextLost()) renderer.forceContextLoss();
});
function chopCameraClearance(angle) {
  const dx=Math.sin(angle), dz=Math.cos(angle), reach=Math.min(distance,6.5);
  const rise=Math.tan(Math.max(0,pitch))+.62/distance;
  for(let r=.4;r<reach;r+=.26){
    const x=p.x+r*dx,z=p.z+r*dz,y=focus.y+rise*r;
    if(staticVolumeAt(x,z,y-.16,.16,.32) || landscapeFloor(x,z)+.18>y)return r/reach;
  }
  return 1;
}
function updateCamera(dt, snap = false) {
  // Staying by the counter keeps the same shot through the last set-down.
  // Walking away, looking around, or opening the map immediately frees it.
  const watching=storyWorld?.tidying && !photoMode && !dialog.open && !p.activity && !p.skiff &&
    conversationShot && Math.hypot(p.x-conversationShot.focus.x,p.z-conversationShot.focus.z)<9;
  if(!speech.active && !watching)conversationShot=null;
  const action=speech.active && dialogue.frame?.action?.key;
  if(action && conversationShot && !conversationShot.wide && conversationShot.action!==action){
    const hand=storyWorld.actionFocus;
    if(hand){
      // The greeting can precede the choice of a dish or drawer. Once the
      // worker reaches for it, reserve a view of that real working position.
      const prior=conversationShot, next=storyWorld.conversationShot(camera.aspect,prior.yaw,false,hand);
      if(next){
        if(Math.cos(next.yaw-prior.yaw)<.94){
          dissolveView();snap=true;conversationShot=next;
        }
        conversationShot.action=action;
      }
    }
  }
  const framed = !!conversationShot && (speech.active || watching);
  if (shotVisible !== framed) {
    dissolveView();
    shotVisible = framed;
    snap = true;
  }
  const full = p.buffs.full > 0 ? 1.26 : 1,
    ride = p.mount === 'bike' ? 0.9 : p.mount === 'turtle' ? .99 : 0;
  // Let the body rise within the frame on takeoff. The camera catches up for
  // long flights, while a standing jump retains a visible point of departure.
  const rise = photoMode ? 0 : Math.min(p.h, 3.6) * 0.41;
  const resting = photoMode ? restingEyeHeightOffset[p.activity] || 0 : 0;
  const bath=p.bathPose, settle=bath?.settle || 0;
  const standingEye=p.y + ride + .9*full + p.airStretch*full*(photoMode ? .72 : .51) - rise - resting;
  const seated=bathPosture(bath?.action);
  const bathEye=seated?seatedFeet(p,bath)+seated.eye*full:(p.bathWaterY??p.y)+.32*full;
  // Keep the travel camera on the visitor's footing. Orbiting the moving
  // berth sweeps the camera arm across low rims and roof posts during a soak.
  if (photoMode && bath) heroAt.set(bath.x, THREE.MathUtils.lerp(standingEye,bathEye,settle), bath.z);
  else heroAt.set(p.x, standingEye, p.z);
  if (framed) {
    const shot=conversationShot;
    const subject=shot.wide && speech.active && storyWorld.actionFocus;
    if (subject && dt>0 && !snap) {
      // Hold the inspection lens still for a turn of the wrist. Follow only
      // when the object is leaving the central area, as in a walking handoff.
      projected.copy(subject).project(camera);
      const overflow=Math.max(0,Math.abs(projected.x)-.42,Math.abs(projected.y)-.40);
      if(overflow && projected.z<1){
        heroAt.subVectors(subject,shot.focus);
        const amount=Math.min(heroAt.length(),dt*Math.min(1.65,overflow*4.8));
        shot.focus.addScaledVector(heroAt.normalize(),amount);
      }
    }
    heroAt.copy(shot.focus);
  }
  if (snap || Math.abs(heroAt.x - focus.x) > BOUND || Math.abs(heroAt.z - focus.z) > BOUND) focus.copy(heroAt);
  else focus.lerp(heroAt, 1 - Math.exp(-dt * 13));
  const azimuth = framed ? conversationShot.yaw : yaw;
  const sx = Math.sin(azimuth),
    sz = Math.cos(azimuth),
    scenery = photoMode ? 0 : scrollCoverage(p.x,p.z),
    travelDistance=distance*(full > 1 && photoMode ? 1.18 : 1)*(1+.14*scenery),
    d = framed ? conversationShot.distance : travelDistance;
  // At the horizon, hold the eye above ground and tilt up to follow an animal overhead.
  const orbitPitch = framed ? conversationShot.pitch : photoMode ? pitch : Math.max(0,pitch);
  const shoulder = framed ? 0 : scenery*Math.min(1,camera.aspect)*Math.min(1,d/5);
  const dx = sx * Math.cos(orbitPitch) * d + sz*1.58*shoulder,
    dz = sz * Math.cos(orbitPitch) * d - sx*1.58*shoulder;
  let dy = Math.sin(orbitPitch) * d + (photoMode ? 0.1 : 0.62);
  // Looking across the lake puts the camera uphill from the traveller.
  // Lift the arm to clear the bank before testing it against trunks or walls.
  if (state.onLake && !photoMode && !p.diveDepth) {
    for(const t of [.25,.5,.75,1]){
      const bank=landscapeFloor(focus.x+t*dx,focus.z+t*dz);
      dy=Math.max(dy,Math.min(d,(bank+.45-focus.y)/t));
    }
  }
  let fraction = 1;
  // While the grass mochi is inside a trunk, start the camera ray on the
  // outward side of that trunk. A second wall still shortens the camera arm.
  const diving = p.diveDepth > 0;
  const inPalace = palaceInteriorAt(p.x,p.z,p.y);
  let emerging = !diving && p.mode === 'kusa' && staticVolumeAt(focus.x,focus.z,focus.y-.15,.15,.30);
  for (let i = 1, n = Math.ceil(Math.hypot(dx,dy,dz) / .25); i <= n; i++) {
    const t = i / n,
      x = focus.x + dx * t,
      z = focus.z + dz * t,
      y = focus.y + dy * t;
    if (diving || inPalace) {
      if (staticVolumeAt(x,z,y-.15,.15,.30)) {
        fraction = (i-1)/n;
        break;
      }
      continue;
    }
    const hull = game.voyage.sample(x,z,y,.12);
    if (hull && focus.y<hull.ceiling && y+.18>hull.ceiling) {
      fraction=Math.max(.16,(i-1)/n);break;
    }
    const blocked = staticVolumeAt(x,z,y-.16,.16,.32);
    if (emerging && !blocked) emerging = false;
    const floor = Math.max(landscapeFloor(x,z),hull?.solid ?? -Infinity,hull?.floor ?? -Infinity);
    if (floor + .16 > y || !emerging && blocked) {
      fraction = Math.max(0.16, (i - 1) / n);
      break;
    }
  }
  eye.copy(focus);
  eye.x += dx * fraction;
  eye.y += dy * fraction;
  eye.z += dz * fraction;
  if (diving) {
    // Pass through the waterline with the mochi even when the camera is tilted down.
    const line=waterSurfaceAt(p.x,p.z,state.time,p.y);
    if(focus.y < line-.24)eye.y=Math.min(eye.y,line-.24);
  }
  const eyeFloor = diving || inPalace ? terrainContactHeight(eye.x,eye.z) : emerging ? landscapeFloor(eye.x,eye.z) : groundHeight(eye.x,eye.z,eye.y);
  eye.y = Math.max(eye.y, eyeFloor + .2);
  camera.position.copy(eye);
  aim.copy(focus);
  if (!photoMode && !framed) {
    if (bath) {
      aim.x += bath.x - p.x;
      aim.z += bath.z - p.z;
      aim.y += (bathEye - standingEye) * settle;
    }
    // Give the page to the animal directly ahead. An off-centre mochi keeps
    // the letter trajectory visible between the hero and its recipient.
    const lookAhead = 1.65 + .82*scenery + 1.9*travelCamera.lead*fraction;
    aim.x += (sz*.4*shoulder-sx*lookAhead)*(1-settle);
    aim.z -= (sx*.4*shoulder+sz*lookAhead)*(1-settle);
    aim.y += (.53+.25*scenery)*(1-settle)+(camera.aspect<.83 ? .27*settle : 0);
  } else if (photoMode) aim.y -= .13;
  camera.lookAt(aim);
  if (!photoMode && !framed && pitch < 0) camera.rotateX(-pitch*(1-settle));
  camera.updateMatrixWorld();
}
const fullScore = new Intl.NumberFormat('ja-JP');
const shortScore = new Intl.NumberFormat('ja-JP', { notation:'compact', maximumFractionDigits:1 });
const palaceRooms=['','竜宮城・一階','竜宮城・二階','竜宮城・三階湯殿'];
let lastScore = -1;
function updateHUD() {
  $('region').textContent = palaceRooms[palaceStoreyAt(p.x,p.z,p.y)] || state.region;
  $('region').parentElement.hidden = !!state.onLake;
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
  const ride=p.mount || p.skiff;
  if (lastMode !== p.mode || lastMount !== ride) {
    for (const [id, b] of cards) {
      b.setAttribute('aria-pressed', String(id === p.mode));
      b.disabled = !!ride && !canUseModeOnMount(id);
    }
    lastMode = p.mode;
    lastMount = ride;
  }
  const expression = getExpression(p, photoMode ? photoTime : state.time),
    faceKey = p.mode + expression;
  if (lastFace !== faceKey) {
    drawFace($('face'), p.mode, expression);
    lastFace = faceKey;
  }
  const effects = [];
  const swimming = swimmingControls();
  $('dive').hidden = !swimming;
  $('leap').setAttribute('aria-label', p.diveDepth ? '長押しで浮上する' : 'ジャンプ');
  $('space-hint').textContent = p.diveDepth ? '浮上・↓と同時で潜る' : swimming ? '水面から跳ぶ・↓と同時で潜る' : '跳ぶ・連打で伸びる';
  if (swimming) {
    const depth = Math.max(1,Math.round(p.diveDepth));
    effects.push(p.diveDepth ? '水深 '+depth+' m' + (coarse ? ' ・ 跳ぶ長押しで浮上' : ' ・ Spaceで浮上') :
      (coarse ? '泳ぎ ・ 潜る長押し' : '泳ぎ ・ Space＋↓で潜る'));
  }
  if (p.skiff) effects.push('小舟に乗船中');
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
  $('living-wallet').textContent = state.livingWorld.wallet + '文';
  $('time-band').textContent = worldClockLabel(state.livingWorld.worldMinute).split('　')[1].split(' ')[0];
  $('parcel-count').textContent = carried.length + '品';
  const chapter = game.notebook.current();
  $('story-volume').textContent = chapter ? chapterLabel(game.notebook.index+1) + (game.notebook.index ? '　·　もち寄り帖' : '　·　旅控え') : '結び　·　もち寄り帖';
  $('story-title').textContent = chapter?.title || '祭のあとの一服';
  const near = nearbyAction();
  $('context').hidden = !near || chopping.active || dialog.open || photoMode || speech.active;
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
  const targetSite = pinnedStorySite();
  const dest = targetSite || trackedAnimal || goal;
  $('target').hidden = !dest;
  if (dest) {
    const aim = dest === trackedAnimal && legendary(dest.type) ? legendDeliveryPoint(dest, guideTorso) : dest;
    const height = Number.isFinite(aim.y) ? aim.y - p.y :
      dest.id === 'ryugu' ? Math.min(0, terrainHeight(dest.x, dest.z) + 1 - p.y) : 0;
    const cue = guideBearing(p, aim, yaw, height);
    $('target').dataset.pose = cue.pose;
    $('target-name').textContent = trackedAnimal && !targetSite ? speciesNames[dest.type] : dest.name;
    $('target-mark').textContent = cue.mark;
    $('target-direction').textContent = cue.label;
    $('target-distance').textContent = cue.distance + ' m';
    $('target-elevation').textContent = cue.elevation;
  }
  redrawMiniMap(targetSite);
}
function redrawMiniMap(targetSite) {
  if (photoMode) return;
  const region = goal?.kind === 'region' ? goal.id : null;
  const pin = goal && goal.kind !== 'region' ? goal : null;
  const tracked = targetSite || trackedAnimal;
  drawMap(miniMap.canvas, state, yaw, region, false, pin, tracked, '', miniMap.projection(tracked || goal));
}
function openDialog(kind, section) {
  if (!playable || dialog.open || chopping.active) return;
  speech.stop();
  const folio = kind === 'story' || kind === 'inventory';
  if (folio || kind === 'living') unlock();
  clearInput();
  save();
  audioSettings.close();
  lastFocus = document.activeElement;
  dialogKind = folio ? 'story' : kind;
  $('dialog-title').textContent = kind === 'map' ? '十七景の地図' : kind === 'journal' ? '三条通知の配達帳' : '旅の手引き';
  dialog.showModal();
  if (kind === 'living') { livingBook.open(section); return; }
  if (folio) { (kind === 'inventory' ? notebook.inventory : notebook.open)(); return; }
  if (kind === 'map') mapDialog();
  else if (kind === 'journal') journalDialog();
  else helpDialog('歩き方');
}
function mapDialog() {
  const story = pinnedStorySite();
  openAtlas($('dialog-content'), {
    state, yaw, destinations:mapDestinations, initialRegion:story?.region || trackedAnimal?.habitat || state.regionId,
    goal, recipient:story || trackedAnimal,
    recipientName:story?.name || (trackedAnimal ? speciesNames[trackedAnimal.type] : ''), coarse,
    setGoal:applyAtlasGoal, close:()=>{ lastFocus=canvas; dialog.close(); },
    canDeliver:id=>Boolean(nearestUndelivered(undefined,id)),
    deliver:id=>trackDelivery(nearestUndelivered(undefined,id),id),
    openBook:()=>{ dialogKind='journal'; $('dialog-title').textContent='三条通知の配達帳'; journalDialog(); },
    teleport:point=>{
      if (!game.teleport(point.x,point.z)) return false;
      lastFocus=canvas; dialog.close(); updateCamera(0,true); dispatchEvents(); updateHUD(); save();
      return true;
    },
  });
}
function trackDelivery(animal, habitat=null) {
  if(!animal) return;
  game.notebook.track(null);
  trackedAnimal=animal; trackedHabitat=habitat; goal=null;
  unlock();save();lastFocus=canvas;dialog.close();updateHUD();
}
function journalDialog() {
  const body=$('dialog-content');
  body.innerHTML=`<div id="delivery-book">
    <div class="ledger-head"><p id="ledger-note"></p><span id="ledger-count"></span></div>
    <button type="button" class="ledger-scale-open">配達先の動物の大きさを比べる</button>
    <div class="ledger-animals"></div></div>`;
  body.querySelector('.ledger-scale-open').onclick = () => {
    $('dialog-title').textContent = '動物の大きさ比べ';
    openAnimalScale(body, speciesNames, () => {
      $('dialog-title').textContent = '三条通知の配達帳';
      journalDialog();
      body.querySelector('.ledger-scale-open').focus();
    });
  };
  const count=state.delivered.size, total=state.recipientTotal;
  $('ledger-count').textContent=count+' / '+total;
  $('ledger-note').textContent=count===total ? '全員に配達しました。鏡餅で十七景の旅をどうぞ。' : state.kagamiUnlocked ? '鏡餅が使えます。新しく加わった動物にも通知を届けてみましょう。' : '動物を選ぶと、まだ届いていない一匹へご案内します。全員に届けると鏡餅が開きます。';
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
      print.style.backgroundImage="url('./assets/residents/"+FAUNA_SHEET.atlas+"')";
      print.style.backgroundSize=(columns*100)+'% '+(rows*100)+'%';
      print.style.backgroundPosition=(tile%columns)/(columns-1)*100+'% '+Math.floor(tile/columns)/(rows-1)*100+'%';
    } else if (SEA_SPECIES[type]) {
      print.style.backgroundImage='url("'+seaPortrait(type)+'")';
      print.style.backgroundSize='contain';
    } else if (SPECIES[type]) {
      const drawing = beastDrawing(type);
      print.style.backgroundImage="url('./assets/residents/"+BEASTS.atlas+"')";
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
      const url = transferURL(location.origin, game.save(), journeySettings());
      if (url) location.assign(url);
      else { fileDialog(); $('dialog-content').querySelector('[role=status]').textContent = 'リンクに収まらない大きさです。ファイルに書き出し、引き継ぎ先で読み込んでください。'; }
    };
    body.querySelector('.actions').append(transfer);
  } else if (location.origin === WORKER_ORIGIN && !hasJourney) {
    const link = document.createElement('a');
    link.href = PAGES_GUIDE;
    link.textContent = '以前の旅を引き継ぐ（GitHub Pages版の手引き）';
    body.querySelector('.credit').append(document.createElement('br'),link);
  }
  const files = document.createElement('button');
  files.className = 'choice';
  files.textContent = '旅の記録';
  files.onclick = fileDialog;
  body.querySelector('.actions').append(files);
  $('continue').onclick = () => { lastFocus = canvas; dialog.close(); };
}
function fileDialog() {
  $('dialog-title').textContent = '旅の記録';
  let backup = null, previousRecord = null;
  try {
    backup = localStorage.getItem(BACKUP_KEY);
    previousRecord = localStorage.getItem(PREVIOUS_KEY);
  } catch { /* Export still works. */ }
  showJourneyFiles($('dialog-content'), {
    game, settings:journeySettings, original:journeyStorage?.original, backup, previousRecord, warning:saveWarning, createGame,
    back() { $('dialog-title').textContent = '旅の手引き'; helpDialog('歩き方'); },
    replace(incoming) {
      if (!canSaveJourney()) throw new Error();
      incoming.settings.resetAt = Date.now();
      storeTransfer(localStorage, incoming);
      restartJourney();
    },
  });
}
$('save-notice').onclick = () => { openDialog('guide'); fileDialog(); };
$('map').onclick = $('mini-button').onclick = () => openDialog('map');
$('journal').onclick = () => openDialog('journal');
$('build-mode').onclick = () => openDialog('living','build');
$('living-book').onclick = () => openDialog('living');
$('parcel-bag').onclick = () => openDialog('inventory');
$('guide').onclick = () => openDialog('guide');
$('story-book').onclick = () => openDialog('story');
$('dismiss').onclick = () => dialog.close();
dialog.addEventListener('click', (e) => {
  if (e.target === dialog && !cooking.active && !sleeping.active && !construction.active) dialog.close();
});
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  previous = 0;
  if (cooking.active) cooking.close();
  if (sleeping.active) sleeping.close();
  if (construction.active) construction.close();
  if (dialogKind === 'living') livingBook.close();
  if (dialogKind === 'story') { performancePlayer.close(); notebook.close(); }
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
  const aspect = w / h;
  if (conversationShot && shotVisible && camera.aspect !== aspect) {
    const ratio=conversationShot.fit(aspect)/conversationShot.fit(camera.aspect);
    const wide=conversationShot.wide;
    if (wide) wide.distance *= wide.fit(aspect)/wide.fit(camera.aspect);
    conversationShot.distance *= ratio;
  }
  camera.aspect = aspect;
  camera.fov = w < h ? 65 : 57;
  camera.updateProjectionMatrix();
  ink?.resize();
  if (construction.active) construction.resize();
  if (sleeping.active) sleeping.resize();
  if (editor.active) editor.resize();
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
  ink.draw(scene, focusDistance, scrollCoverage(p.x,p.z), photoMode ? photoTime : state.time);
}
function quietWorld() {
  return document.hidden || contextLost || (dialog.open && dialogKind!=='living');
}
function frame(now) {
  requestAnimationFrame(frame);
  const paused = document.hidden || dialog.open || contextLost;
  audio.setPaused(quietWorld());
  if (paused) {
    if(!sleeping.active && !quietWorld())audio.updateWorld(state,state.time,yaw,false);
    if (sleeping.active && !document.hidden && !contextLost) sleeping.frame(now);
    if (construction.active && !document.hidden && !contextLost) construction.frame(now);
    if (cooking.active && !document.hidden && !contextLost) cooking.frame(now);
    if (performancePlayer.active && !document.hidden && !contextLost) performancePlayer.frame(now);
    previous = 0;
    return;
  }
  // Carry the 60 Hz deadline forward: 75, 90 and 144 Hz screens must not
  // lose a whole refresh each time the display clock falls either side of it.
  const interval = 1000 / 60;
  if (!previous || now >= nextFrame + interval) nextFrame = now;
  if (now + .75 < nextFrame) return;
  nextFrame += interval;
  const activeSeconds = previous ? (now - previous) / 1000 : 0;
  const delta = previous ? Math.min(activeSeconds, 0.09) : 1 / 60;
  previous = now;
  const left = Number(keys.has('ArrowLeft') || keys.has('KeyA')),
    right = Number(keys.has('ArrowRight') || keys.has('KeyD'));
  if (now >= surfaceJumpAt) {
    surfaceJumpAt = Infinity;
    action('jump');
  }
  const swimming=swimmingControls(), backward=backwardHeld();
  const diveChord=swimming && keys.has('Space') && backward;
  const forward =
    Number(keys.has('ArrowUp') || keys.has('KeyW')) -
    Number(backward && !diveChord) -
    stick.y;
  const orbit = (Number(keys.has('KeyQ')) - Number(keys.has('KeyR'))) * delta * 1.65;
  if (orbit && speech.active && conversationShot) conversationShot.yaw += orbit;
  else if (orbit) {
    chopOrbit=null;
    travelCamera.manualLook(orbit);
    yaw += orbit;
  }
  if(chopping.active){
    if(chopOrbit && look.id===null)yaw=chopOrbit(delta);
    game.stepCookingScenery(delta,activeSeconds);
  }else if (!photoMode) {
    const side = right - left + stick.x,
      assist = travelCameraEnabled && !speech.active,
      following = assist && canFollowTravel(p),
      steering = travelCamera.movementYaw(yaw, side, forward, following),
      c = Math.cos(steering),
      s = Math.sin(steering),
      magnitude = following ? Math.max(1, Math.hypot(side, forward)) : 1;
    if(Math.hypot(side,forward)>.14 || keys.has('Space') || jumpTouch){
      if(speech.active)speech.stop();
      conversationShot=null;
    }
    if(!speech.active && (orbit || look.id!==null))conversationShot=null;
    const staging=speech.active && storyWorld.walkInput(p,delta);
    game.step(delta, {
      clockSeconds: activeSeconds,
      pauseClock: speech.active || audioSettings.open,
      x: staging ? staging.x : (c * side - s * forward) / magnitude,
      z: staging ? staging.z : (-s * side - c * forward) / magnitude,
      rightX: c,
      rightZ: -s,
      jump: (!swimming || p.diveDepth>0 || !p.grounded) && !diveChord && !diveTouch && (jumpTouch || keys.has('Space')),
      dive: diveTouch || diveChord,
    });
    yaw = travelCamera.follow(yaw, p, delta, assist, look.id !== null || keys.has('KeyQ') || keys.has('KeyR'));
    dispatchEvents();
  } else photoTime += delta;
  updateCamera(delta);
  sun.target.position.set(p.x, p.y, p.z);
  const sceneTime = photoMode ? photoTime : state.time;
  inariWeatherAt(p.x, p.z, sceneTime, state.flightSeed, state.inariWeather);
  applyClimateLights(hemisphere, sun, bounce, p, sceneTime);
  audio.updateWorld(state, sceneTime, yaw, photoMode);
  storyWorld.update(sceneTime, p);
  world.update(sceneTime, p, camera, state.time, state.bellStrike, state.inariWeather);
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
  if(chopping.active)chopping.update(delta);
  wake(p, sceneTime, actors.riceBody);
  speech.update(photoMode);
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
async function openGraphics() {
  // Choose the GPU without changing the framebuffer format. Some dual-GPU
  // browsers reject the discrete adapter while the default adapter is usable.
  const attributes = { antialias: true, alpha: false, stencil: false };
  let context = canvas.getContext('webgl2', { ...attributes, powerPreference: 'high-performance' });
  if (!context) {
    await new Promise(resolve => setTimeout(resolve, 150));
    context = canvas.getContext('webgl2', { ...attributes, powerPreference: 'default' });
  }
  if (!context) {
    throw new DOMException('Unable to acquire a WebGL 2 context', 'WebGLUnavailableError');
  }
  return new THREE.WebGLRenderer({ canvas, context, ...attributes });
}

let loadingCaption = '';
function setLoadingCaption(caption) {
  loadingCaption = caption;
  if (!contextLost) $('loading-copy').textContent = caption;
}
function blockGameplay(blocked) {
  for (const child of stage.children) {
    if (child !== $('loading')) child.inert = blocked;
  }
}
function onContextLost(event) {
  event.preventDefault();
  contextLost = true;
  cooking.resetClock();
  sleeping.resetClock();
  construction.resetClock();
  clearInput();
  save();
  audio.setPaused(true);
  blockGameplay(true);
  $('loading-copy').textContent = '描画の復帰を待っています…';
  $('load-actions').hidden = false;
  $('loading').hidden = false;
}
function onContextRestored() {
  contextLost = false;
  previous = 0;
  resize(true);
  $('loading-copy').textContent = loadingCaption;
  $('load-actions').hidden = true;
  if (playable) {
    drawScene();
    blockGameplay(false);
    $('loading').hidden = true;
  }
}
async function waitForGraphics() {
  // A driver may mark the context lost before dispatching the DOM event.
  while (contextLost || renderer.getContext().isContextLost()) {
    await new Promise(resolve => canvas.addEventListener('webglcontextrestored', resolve, { once: true }));
  }
}
async function boot() {
  renderer = await openGraphics();
  const preparation = new AbortController();
  const paint = watchArrivalPaint(THREE.DefaultLoadingManager);
  // Register after Three's renderer so its GL state is rebuilt first.
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    ink = createInkPass(renderer, camera);
    settingsForLighting();
    resize();
    updateCamera(1, true);
    setLoadingCaption(state.region + 'の景色をひらいています…');
    const arrivalAssets = Promise.all([loadRiceModel(), loadMapPaper(), setRiverStones(scene, state.objects)]);
    const preparingWorld = prepareWorld(scene, camera, sceneryQuality);
    [world] = await Promise.all([finishInSlices(preparingWorld, preparation.signal), arrivalAssets]);
    world.setLivingWorld(state.livingWorld);
    world.setSceneryQuality(sceneryQuality);
    storyWorld = createStoryWorld(scene, game.notebook, game.storyCollisions, () => actors?.hero, site => dialogue.pickupAt(site));
    storyWorld.update(state.time, p);
    meadow = createMeadow(scene, state.objects, coarse, state.npcs);
    wake = createWake(scene);
    sun.target.position.set(p.x, p.y, p.z);
    applyClimateLights(hemisphere, sun, bounce, p, state.time);
    wake(p, state.time);
    setLoadingCaption('旅の仲間を描いています…');
    actors = createActors(scene, renderer);
    actors.update(state, 0, camera);
    await actors.prepare();
    bathReflection = createBathReflection(renderer, scene, actors.hero);
    world.update(state.time, p, camera, state.time, state.bellStrike, state.inariWeather);
    meadow(state.time, p, camera);
    // The normal render submits just this view (including its shadows and
    // reflections). Distant districts get their GPU resources on first use.
    for (;;) {
      await waitForGraphics();
      drawScene();
      if (renderer.getContext().isContextLost()) continue;
      const pending = paint.waitFor(renderer, scene, ink.paper);
      if (!pending) break;
      await pending;
    }
    updateHUD();
    playable = true;
    blockGameplay(false);
    $('loading').hidden = true;
    if (saveWarning || transferStatus) message(saveWarning || transferStatus,6);
    if (location.origin === PAGES_ORIGIN && location.hash === '#guide') {
      history.replaceState(history.state, '', location.pathname + location.search);
      openDialog('guide');
    }
    qualitySince = performance.now();
    new ResizeObserver(resize).observe(canvas);
    requestAnimationFrame(frame);
  } catch (error) {
    preparation.abort();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    playable = false;
    blockGameplay(true);
    renderer.dispose();
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
    renderer = null;
    throw error;
  } finally {
    paint.close();
  }
}
await boot();
