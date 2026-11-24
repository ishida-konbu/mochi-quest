import * as T from './vendor/three.module.min.js';
import { createCraftModel } from './living-craft-art.js';
import { normalizeRecipe } from './living-craft.js';

// Keep one GPU context while the player works through the recipe controls.
// A replacement canvas in a freshly drawn form can display the same study.
let renderer, scene, camera, model, canvas, key, observer, events, pending;
let yaw=0, heightAngle=.53;
const cache=new Map();
const aimHeight=.067;
// A sloping tray and its lifted rim can be wider than the mochi itself.
// Measure both once, in model space, so every orbit keeps the rim in frame.
function orbitBounds(object) {
  let radius=0, height=0;
  const vertex=new T.Vector3();
  object.updateMatrixWorld(true);
  object.traverse(part=>{
    if(!part.isMesh) return;
    const points=part.geometry.attributes.position;
    for(let i=0;i<points.count;i++) {
      vertex.fromBufferAttribute(points,i).applyMatrix4(part.matrixWorld);
      radius=Math.max(radius,Math.hypot(vertex.x,vertex.z));
      height=Math.max(height,Math.abs(vertex.y-aimHeight));
    }
  });
  return {radius,height};
}
function release(model) {
  model.traverse(part=>{if(part.userData.craftGeometry) part.geometry.dispose();});
}
function draw() {
  if(!canvas?.isConnected || !model) return;
  const w=canvas.clientWidth || 280, h=canvas.clientHeight || 150;
  const ratio=Math.min(1.6,window.devicePixelRatio||1);
  const width=Math.round(w*ratio), height=Math.round(h*ratio);
  if(canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
  renderer.setSize(width,height,false);
  const {radius,height:rise}=model.userData.orbitBounds, aspect=w/h;
  const vertical=radius*Math.sin(heightAngle)+rise*Math.cos(heightAngle);
  const half=Math.max(.235,.39/aspect,1.07*radius/aspect,1.07*vertical);
  camera.left=-half*aspect; camera.right=half*aspect; camera.top=half; camera.bottom=-half;
  camera.updateProjectionMatrix();
  camera.position.set(Math.sin(.34+yaw)*Math.cos(heightAngle),Math.sin(heightAngle)+aimHeight,Math.cos(.34+yaw)*Math.cos(heightAngle));
  camera.lookAt(0,aimHeight,0);
  renderer.render(scene,camera);
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,width,height); ctx.drawImage(renderer.domElement,0,0,width,height);
}
function paintWhenReady() {
  clearTimeout(pending);
  draw();
  // The shared village vessel can already be loading on the game renderer.
  // Redraw when its atlas arrives, even after a slow first visit.
  let waiting=false;
  model.traverse(part=>{
    if(!part.isMesh) return;
    const materials=Array.isArray(part.material)?part.material:[part.material];
    for(const mat of materials) for(const map of [mat.map,mat.bumpMap,mat.roughnessMap]) {
      if(map && !map.image) waiting=true;
    }
  });
  if(waiting) pending=setTimeout(()=>{if(model && canvas?.isConnected) paintWhenReady();},220);
}
function setCanvas(target) {
  if(canvas===target) return;
  observer?.disconnect(); events?.abort(); canvas=target;
  events=new AbortController(); const options={signal:events.signal};
  let pointer=null;
  const turn=(dx,dy)=>{ yaw-=dx; heightAngle=T.MathUtils.clamp(heightAngle+dy,.21,1.25); draw(); };
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0 || !e.isPrimary || pointer) return;
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY}; canvas.setPointerCapture(e.pointerId);
  },options);
  canvas.addEventListener('pointermove',e=>{
    if(pointer?.id!==e.pointerId || !canvas.hasPointerCapture(e.pointerId)) return;
    turn((e.clientX-pointer.x)*.012,(e.clientY-pointer.y)*.008);
    pointer.x=e.clientX; pointer.y=e.clientY;
  },options);
  canvas.addEventListener('lostpointercapture',e=>{ if(pointer?.id===e.pointerId) pointer=null; },options);
  canvas.addEventListener('keydown',e=>{
    const deltas={ArrowLeft:[-.21,0],ArrowRight:[.21,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]};
    if(!Object.hasOwn(deltas,e.key)) return;
    e.preventDefault();e.stopPropagation();turn(...deltas[e.key]);
  },options);
  canvas.tabIndex=0; canvas.setAttribute('role','img');canvas.setAttribute('aria-label','餅の立体見本。ドラッグか矢印キーで向きを変えられます。');
  canvas.style.touchAction='pan-y pinch-zoom';
  observer=new ResizeObserver(draw); observer.observe(canvas);
}
function init() {
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:false});
  renderer.setClearColor(0xeee6d3,0);
  scene=new T.Scene();camera=new T.OrthographicCamera(-.45,.45,.25,-.25,.01,6);
  scene.add(new T.HemisphereLight(0xfff6e4,0x95846d,1.76));
  const light=new T.DirectionalLight(0xffeed5,2.20);light.position.set(-2,4,3);scene.add(light);
}
export function renderCraftPreview(target,draft) {
  const recipe=normalizeRecipe(draft);
  if(!target || !recipe) return false;
  try {
    if(!renderer) init();
    setCanvas(target);
    const next=JSON.stringify(recipe);
    if(key!==next){
      if(model) scene.remove(model);
      if(!cache.has(next)) {
        if(cache.size>=4){ const old=cache.keys().next().value; release(cache.get(old));cache.delete(old); }
        const sample=createCraftModel(recipe);
        sample.userData.orbitBounds=orbitBounds(sample);
        cache.set(next,sample);
      }
      model=cache.get(next); scene.add(model); key=next;
    }
    paintWhenReady(); return true;
  } catch(error) {
    console.warn('餅の立体見本を開けませんでした。',error);
    disposeCraftPreview(); return false;
  }
}
export function disposeCraftPreview() {
  clearTimeout(pending); observer?.disconnect(); events?.abort();
  for(const object of cache.values()) release(object);
  cache.clear(); renderer?.dispose(); renderer?.forceContextLoss();
  renderer=scene=camera=model=canvas=key=observer=events=null;
  yaw=0; heightAngle=.53;
}
