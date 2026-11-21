import { createGame, worldDelta, WORLD_WIDTH } from './game.js';
import { createLandscape } from './landscape.js';
import { drawActors, drawMochiPortrait, actorArtReady } from './actors.js';
import { createAudio } from './sound.js';
import { drawAtlas, atlasRegionAt } from './atlas.js';
import { modes, regions, numbers, guide, icon, paintIcons } from './ui.js';

const $ = id => document.getElementById(id);
const world = $('world');
const ctx = world.getContext('2d');
const panel = $('panel');
const progressKey = 'mochi-quest.journey.v1';
const audioKey = 'mochi-quest.sound.v1';
function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function store(key,data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* Private browsing can disable storage. */ } }
const game = createGame(read(progressKey));
const { state } = game;
const landscape = createLandscape($('backdrop'));
const audio = createAudio();
let soundEnabled = read(audioKey) !== false;
let activeTime = false;
let lastSave = 0;
let panelType = '';
let lastFocus;
let view = {w:1280,h:720,cameraX:state.player.x};
let sceneScale = 1, sceneTop = 0;
let selectedRegion = state.region;
let hudTime = 0, lastMode = '', lastBuff = '', lastRegion = -1;
let noticeUntil = 0, speechUntil = 0;
const scoreFlashes = [];
const keys = new Set();
const stick = { x:0, z:0, id:null };
let touchJump = false;
paintIcons();

function saveJourney() { if (activeTime) store(progressKey, game.save()); }
function unlock() { activeTime = true; audio.unlock(); }
function setSound(enabled) {
  soundEnabled = enabled;
  audio.setEnabled(enabled);
  $('sound').querySelector('i').innerHTML = icon(enabled ? 'sound' : 'mute');
  $('sound').setAttribute('aria-pressed', String(enabled));
  $('sound').ariaLabel = $('sound').title = enabled ? '音を切る' : '音を入れる';
}
setSound(soundEnabled);
$('sound').onclick = () => { setSound(!soundEnabled); unlock(); store(audioKey,soundEnabled); };
function paintPortrait(canvas,mode) {
  const g = canvas.getContext('2d');
  g.clearRect(0,0,canvas.width,canvas.height);
  drawMochiPortrait(g,canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)*.86,mode);
}
const cards = new Map();
for (const [index,[id,name,detail]] of modes.entries()) {
  const button = document.createElement('button');
  button.className = 'mode-card';
  button.dataset.mode = id;
  button.setAttribute('aria-label',name+'、'+detail+'、キー '+index);
  button.title = name+'（'+index+'）';
  button.innerHTML = '<canvas width="108" height="96" class="mode-art" aria-hidden="true"></canvas><span><b class="mode-name">'+name+'</b><small class="mode-desc">'+detail+'</small></span><kbd>'+index+'</kbd>';
  $('mode-list').append(button);
  cards.set(id,button);
  paintPortrait(button.querySelector('canvas'),id);
  button.onclick = () => { doAction(id); world.focus({preventScroll:true}); };
}
actorArtReady.then(()=>{
  for (const [mode,card] of cards) paintPortrait(card.querySelector('canvas'),mode);
  paintPortrait($('portrait'),state.player.mode);
  renderWorld();
});
function doAction(action) {
  if (panel.open) return;
  unlock();
  game.act(action);
  showEvents();
  updateHUD();
}
function notify(text,seconds=2.5) {
  const node = $('message');
  node.textContent = text;
  node.hidden = false;
  noticeUntil = state.time+seconds;
}
function showEvents() {
  for (const event of state.events.splice(0)) {
    audio.handle(event);
    if (event.type === 'message') notify(event.text);
    if (event.type === 'say') {
      $('speech').textContent = event.text;
      $('speech').hidden = false;
      speechUntil = state.time + .9;
    }
    if (event.type === 'score') {
      scoreFlashes.push({...event,until:state.time+1});
      $('score-tag').classList.remove('ping');
      void $('score-tag').offsetWidth;
      $('score-tag').classList.add('ping');
    }
  }
}
const buffLabels = {warm:'ほかほか',swift:'軽い足どり',drunk:'ほろ酔い',full:'満腹',wrap:'腹巻き'};
function updateHUD() {
  const p = state.player;
  for (const key of ['hp','mp']) {
    $(key).textContent = Math.ceil(p[key]);
    $(key+'-meter').style.width = p[key]+'%';
  }
  $('score').textContent = state.score.toLocaleString('ja-JP');
  if (p.mode !== lastMode) {
    for (const [mode,card] of cards) card.setAttribute('aria-pressed',String(mode===p.mode));
    paintPortrait($('portrait'),p.mode);
    lastMode = p.mode;
  }
  if (state.region !== lastRegion) {
    $('place').textContent = regions[state.region][0];
    $('chapter').textContent = '第'+numbers[state.region]+'景';
    lastRegion = state.region;
  }
  const buffs = [];
  if (p.mount) buffs.push(p.mount==='turtle' ? 'カメに騎乗中' : '自転車に乗車中');
  for (const [key,name] of Object.entries(buffLabels)) if (p.buffs[key]>0) buffs.push(name+' '+Math.ceil(p.buffs[key])+'秒');
  const buffString = buffs.join('|');
  if (buffString!==lastBuff) {
    $('buffs').replaceChildren(...buffs.map(label=>Object.assign(document.createElement('span'),{textContent:label})));
    lastBuff = buffString;
  }
  const nearby = game.nearest();
  $('context').hidden = !nearby || panel.open;
  if (nearby) $('context').querySelector('span').textContent = nearby.label;
}
$('context').onclick = () => doAction(game.nearest()?.action || 'interact');
function resize() {
  const w = world.clientWidth, h = world.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1,2,Math.sqrt(3000000 / (w*h)));
  world.width = Math.round(w*dpr);
  world.height = Math.round(h*dpr);
  sceneScale = h/(h<275 && w/h>2.4 ? 510 : 720);
  sceneTop = (h-720*sceneScale)*.68;
  view.w = w/sceneScale;
  ctx.setTransform(world.width/w*sceneScale,0,0,world.height/h*sceneScale,0,sceneTop*world.height/h);
  renderWorld();
  if (panelType==='map') drawAtlas($('atlas'),state,selectedRegion);
}
function renderWorld() {
  ctx.clearRect(0,0,view.w,720);
  landscape.draw(ctx,view,state);
  drawActors(ctx,view,state);
  for (let i=scoreFlashes.length-1;i>=0;i--) {
    const mark=scoreFlashes[i], left=mark.until-state.time;
    if (left<=0) { scoreFlashes.splice(i,1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.min(1,left*3);
    ctx.textAlign='center';
    ctx.font='bold 22px Georgia,serif';
    ctx.lineWidth=3;ctx.strokeStyle='#fff4d9';ctx.fillStyle='#a13e2c';
    const x=view.w/2+worldDelta(mark.x,view.cameraX),y=504+96*mark.z-mark.h-(1-left)*35;
    ctx.strokeText(mark.text,x,y);ctx.fillText(mark.text,x,y);
    ctx.restore();
  }
  if (!$('speech').hidden) {
    const p=state.player;
    const x = (view.w/2 + worldDelta(p.x,view.cameraX))*sceneScale;
    const y = (504+96*p.z-p.h-(p.buffs.full>0 ? 115 : 84)-(p.mount ? 32:0))*sceneScale+sceneTop;
    $('speech').style.left = Math.max(73,Math.min(world.clientWidth-73,x))+'px';
    $('speech').style.top = Math.max(38,y)+'px';
    if (state.time>=speechUntil) $('speech').hidden=true;
  }
  if (!$('message').hidden && state.time>=noticeUntil) $('message').hidden=true;
}
const pressed=(...codes)=>codes.some(code=>keys.has(code));
let previous;
function frame(now) {
  const dt = previous===undefined ? 0 : Math.min(.09,(now-previous)/1000);
  previous=now;
  if (!panel.open && !document.hidden) {
    game.step(dt,{
      x:Number(pressed('ArrowRight','KeyD'))-Number(pressed('ArrowLeft','KeyA'))+stick.x,
      z:Number(pressed('ArrowDown','KeyS'))-Number(pressed('ArrowUp','KeyW'))+stick.z,
      jump:keys.has('Space')||touchJump
    });
    const targetX=state.player.x+Math.max(-view.w*.15,Math.min(view.w*.15,state.player.vx*.24));
    view.cameraX=(view.cameraX+worldDelta(targetX,view.cameraX)*(1-Math.exp(-dt*7))+WORLD_WIDTH)%WORLD_WIDTH;
    showEvents();
    if (state.time-hudTime>.09 || hudTime===0) {updateHUD();hudTime=state.time;}
    renderWorld();
    if (state.time-lastSave>4) { saveJourney();lastSave=state.time; }
  }
  requestAnimationFrame(frame);
}
function clearInput() {
  keys.clear(); touchJump=false;stick.x=stick.z=0;stick.id=null;
  document.querySelector('.pad b').style.transform='';
}
window.addEventListener('blur',()=>{clearInput();saveJourney();});
document.addEventListener('visibilitychange',()=>{clearInput();previous=undefined;saveJourney();});
window.addEventListener('pagehide',saveJourney);
world.onpointerdown=()=>{unlock();world.focus({preventScroll:true});};
document.addEventListener('keydown',e=>{
  if (e.ctrlKey||e.metaKey||e.altKey||e.isComposing) return;
  if (panel.open) {
    if (!e.repeat && ((panelType==='map'&&e.code==='KeyM')||(panelType==='help'&&e.code==='KeyH')||(panelType==='pause'&&e.code==='KeyP'))) {
      e.preventDefault(); panel.close();
    }
    return;
  }
  if (e.code==='Space' && e.target.closest('button')) return;
  const mapped=['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','KeyD','KeyA','KeyW','KeyS','KeyZ','Space','KeyE','KeyM','KeyH','KeyP','Escape','Digit0','Digit1','Digit2','Digit3','Digit4'];
  if (!mapped.includes(e.code)) return;
  e.preventDefault();
  if (e.repeat) return;
  unlock();
  keys.add(e.code);
  if (/^Digit/.test(e.code)) doAction(modes[Number(e.code.slice(-1))][0]);
  if(e.code==='Space') doAction('jump');
  if(e.code==='KeyZ') doAction('throw');
  if(e.code==='KeyE') doAction('interact');
  if(e.code==='KeyM') openPanel('map');
  if(e.code==='KeyH') openPanel('help');
  if(['KeyP','Escape'].includes(e.code)) openPanel('pause');
});
document.addEventListener('keyup',e=>keys.delete(e.code));
const pad = document.querySelector('.pad');
function steer(e) {
  const pos=pad.getBoundingClientRect(),dx=e.clientX-pos.left-pos.width/2,dz=e.clientY-pos.top-pos.height/2;
  const limit=pos.width*.34,scale=Math.max(limit,Math.hypot(dx,dz));
  stick.x=Math.abs(dx/scale)<.12?0:dx/scale;
  stick.z=Math.abs(dz/scale)<.12?0:dz/scale;
  pad.querySelector('b').style.transform='translate('+stick.x*limit+'px,'+stick.z*limit+'px)';
}
pad.onpointerdown=e=>{if(stick.id!==null)return;unlock();e.preventDefault();pad.setPointerCapture(e.pointerId);stick.id=e.pointerId;steer(e);};
pad.onpointermove=e=>{if(stick.id===e.pointerId)steer(e);};
pad.onlostpointercapture=()=>{stick.x=stick.z=0;stick.id=null;pad.querySelector('b').style.transform='';};
$('touch-jump').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);touchJump=true;doAction('jump');};
$('touch-jump').onlostpointercapture=()=>{touchJump=false;};
$('touch-throw').onpointerdown=e=>{e.preventDefault();doAction('throw');};

function openPanel(type) {
  clearInput();saveJourney();
  lastFocus=document.activeElement;
  panelType=type;
  const titles={map:['道中案内','絵巻地図'],help:['旅の手引き','遊び方'],pause:['旅のひと休み','一時停止']};
  $('panel-sub').querySelector('span').textContent=titles[type][0];
  $('panel-title').textContent=titles[type][1];
  $('panel-body').replaceChildren();
  panel.showModal();
  if (type==='help') showGuide('操作');
  if (type==='map') {selectedRegion=state.region;showMap();}
  if (type==='pause') {
    $('panel-body').innerHTML='<div class="pause-content"><button class="resume">旅を続ける</button><p>旅の記録はこの端末に保存されます。</p></div>';
    $('panel-body').querySelector('button').onclick=()=>panel.close();
  }
}
function showGuide(tab) {
  const body=$('panel-body');
  body.innerHTML='<div class="help-tabs"></div><div class="help-rows"></div><p class="credit"><a href="./audio/CREDITS.txt" target="_blank" rel="noopener">掛け声の音声クレジット</a></p>';
  for (const name of Object.keys(guide)) {
    const b=document.createElement('button');
    b.className=name===tab?'active':'';
    b.setAttribute('aria-pressed',String(name===tab));
    b.textContent=name;b.onclick=()=>{showGuide(name);$('panel-body').querySelector('.active').focus();};
    body.querySelector('.help-tabs').append(b);
  }
  for (const [label,description] of guide[tab]) {
    const row=document.createElement('div');
    row.className='help-row';row.innerHTML='<b>'+label+'</b><span>'+description+'</span>';
    body.querySelector('.help-rows').append(row);
  }
}
function showMap() {
  const body=$('panel-body');
  body.innerHTML='<p class="atlas-heading"></p><canvas id="atlas" aria-label="六景を結ぶ周回路とお餅の現在地"></canvas><div class="map-list"></div><p class="map-note"></p>';
  body.querySelector('.atlas-heading').textContent='現在地　'+regions[state.region][0]+'　｜　訪ねた景色 '+state.visited.length+' / 6';
  for (const [i,region] of regions.entries()) {
    const b=document.createElement('button');
    b.className='map-stop';b.innerHTML='<span>'+['壱','弐','参','肆','伍','陸'][i]+'</span>'+region[0];
    b.onclick=()=>selectMap(i);body.querySelector('.map-list').append(b);
  }
  $('atlas').onclick=e=>{const i=atlasRegionAt($('atlas'),e.clientX,e.clientY);if(Number.isInteger(i))selectMap(i);};
  selectMap(selectedRegion);
}
function selectMap(i) {
  selectedRegion=i;
  for (const [index,b] of [...$('panel-body').querySelectorAll('.map-stop')].entries()) {
    b.classList.toggle('selected',index===i);b.setAttribute('aria-pressed',String(index===i));
  }
  $('panel-body').querySelector('.map-note').textContent=regions[i][1];
  drawAtlas($('atlas'),state,i);
}
$('map-button').onclick=()=>openPanel('map');
$('help-button').onclick=()=>openPanel('help');
$('pause').onclick=()=>openPanel('pause');
$('mobile-pause').onclick=()=>openPanel('pause');
$('close').onclick=()=>panel.close();
panel.addEventListener('click',e=>{if(e.target===panel)panel.close();});
panel.addEventListener('close',()=>{if(panel.open)return;panelType='';previous=undefined;(lastFocus?.tagName==='BUTTON'?lastFocus:world).focus({preventScroll:true});});
const root=document.documentElement;
const fullButton=$('fullscreen');
if (!root.requestFullscreen && !root.webkitRequestFullscreen) fullButton.hidden=true;
fullButton.onclick=async()=>{
  try {
    if(document.fullscreenElement||document.webkitFullscreenElement) await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
    else await (root.requestFullscreen||root.webkitRequestFullscreen).call(root);
  } catch { notify('このブラウザでは全画面表示に切り替えられません。'); }
};
function syncFull() {
  const full=!!(document.fullscreenElement||document.webkitFullscreenElement);
  fullButton.querySelector('i').innerHTML=icon(full?'exitfull':'fullscreen');
  fullButton.ariaLabel=fullButton.title=full?'全画面表示を終了':'全画面表示';
}
document.addEventListener('fullscreenchange',syncFull);
document.addEventListener('webkitfullscreenchange',syncFull);
updateHUD();
resize();
new ResizeObserver(resize).observe(world);
landscape.ready.then(renderWorld);
requestAnimationFrame(frame);
