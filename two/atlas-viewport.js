import { WORLD_BOUND } from './geography.js';

const span = WORLD_BOUND * 2;
export const maxAtlasZoom = 32;
const clamp = (value, low, high) => Math.min(high,Math.max(low,value));

// Normalised canvas coordinates span [0,1] on the square sheet at every DPR.
export function atlasView(centerX = 0, centerZ = 0, zoom = 1) {
  zoom = clamp(zoom,1,maxAtlasZoom);
  const limit = WORLD_BOUND * (1 - 1 / zoom);
  return {centerX:clamp(centerX,-limit,limit),centerZ:clamp(centerZ,-limit,limit),zoom};
}
export function atlasWorldAt(view, pointer) {
  return {x:view.centerX + (pointer.u-.5)*span/view.zoom, z:view.centerZ + (pointer.v-.5)*span/view.zoom};
}
export function anchorAtlas(world, pointer, zoom) {
  zoom = clamp(zoom,1,maxAtlasZoom);
  return atlasView(world.x-(pointer.u-.5)*span/zoom, world.z-(pointer.v-.5)*span/zoom, zoom);
}
const centre = {u:.5,v:.5};

export function bindAtlasViewport(canvas, start, {draw, pick, moveMark, commitMark}) {
  let view = start;
  const pointers = new Map();
  let gesture = null, dragged = false;
  function position(e) {
    const {left,top,width,height} = canvas.getBoundingClientRect();
    return {u:(e.clientX-left)/width, v:(e.clientY-top)/height};
  }
  function midpoint() {
    const [a,b] = pointers.values();
    return b ? {u:(a.u+b.u)/2,v:(a.v+b.v)/2} : a;
  }
  function distance() {
    const [a,b] = pointers.values();
    return b ? Math.max(.002,Math.hypot(a.u-b.u,a.v-b.v)) : 1;
  }
  function beginGesture() {
    const at = midpoint();
    gesture = at ? {at,world:atlasWorldAt(view,at),distance:distance(),zoom:view.zoom} : null;
  }
  function render() {
    const width = canvas.clientWidth;
    if (!width) return;
    const pixels = Math.round(width * Math.min(window.devicePixelRatio || 1, 2));
    if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
    draw(view, pixels / width);
  }
  function set(next) { view = next; render(); }
  function zoomBy(factor, at = centre) { set(anchorAtlas(atlasWorldAt(view,at),at,view.zoom*factor)); }
  function focus(point, zoom = view.zoom) { set(atlasView(point.x,point.z,zoom)); }
  canvas.onpointerdown = e => {
    if (e.button !== 0 || pointers.size >= 2) return;
    canvas.focus({preventScroll:true});
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,position(e));
    if (pointers.size === 1) dragged = false;
    else dragged = true;
    beginGesture();
  };
  canvas.onpointermove = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId,position(e));
    const at = midpoint();
    if (!dragged) dragged = Math.hypot(at.u-gesture.at.u,at.v-gesture.at.v)*canvas.clientWidth > 5;
    if (dragged) {
      canvas.classList.add('atlas-dragging');
      set(anchorAtlas(gesture.world,at,gesture.zoom*distance()/gesture.distance));
    }
  };
  function release(e) {
    if (!pointers.has(e.pointerId)) return;
    const at = position(e);
    const tapped = e.type === 'pointerup' && !dragged && pointers.size === 1 &&
      Math.hypot(at.u-gesture.at.u,at.v-gesture.at.v)*canvas.clientWidth <= 5 &&
      at.u >= 0 && at.u <= 1 && at.v >= 0 && at.v <= 1;
    pointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (pointers.size === 0) canvas.classList.remove('atlas-dragging');
    beginGesture();
    if (tapped) pick(atlasWorldAt(view,at),at);
  }
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = release;
  canvas.addEventListener('wheel',e => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientWidth : 1;
    zoomBy(Math.exp(-clamp(e.deltaY*unit,-400,400)*.0025),position(e));
  }, {passive:false});
  canvas.onkeydown = e => {
    const delta = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if (delta) {
      const step = e.shiftKey ? 1 : 8;
      const point = moveMark(delta[0]*step,delta[1]*step);
      const margin = span/view.zoom*.4;
      if (Math.abs(point.x-view.centerX)>margin || Math.abs(point.z-view.centerZ)>margin) focus(point);
      else render();
    } else if (e.key === '+' || e.key === '=') zoomBy(1.5);
    else if (e.key === '-') zoomBy(1/1.5);
    else if (e.key === 'Home') set(atlasView());
    else if (e.key === 'Enter' || e.key === ' ') commitMark();
    else return;
    e.preventDefault();
  };
  const observer = new ResizeObserver(render);
  observer.observe(canvas);
  return { render, focus, zoomBy, fit:()=>set(atlasView()), dispose:()=>observer.disconnect() };
}
