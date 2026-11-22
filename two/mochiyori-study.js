import * as T from './vendor/three.module.min.js';
import { createStoryCharacter, createStoryFood, createStoryEvidence, poseStoryCharacter, setEvidencePose } from './story-models.js';

// One small renderer serves every study. The travelling camera and the saved mochi position stay put.
export function createStudy() {
  let renderer, scene, camera, pivot, object, pane, width, height, drag, viewYaw, pitch;
  const models = new Map();
  function draw() {
    if (!pane || !object || !pane.isConnected) return;
    const w = Math.max(1, pane.clientWidth), h = Math.max(1, pane.clientHeight);
    if (w !== width || h !== height) {
      width = w; height = h;
      renderer.setSize(w,h,false);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
    pivot.rotation.order = 'YXZ';
    pivot.rotation.set(pitch, viewYaw, 0);
    renderer.render(scene,camera);
  }
  function turn(dx,dy) {
    viewYaw += dx;
    pitch = T.MathUtils.clamp(pitch+dy,-1.6,1.6);
    draw();
  }
  function init() {
    renderer = new T.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.6));
    renderer.setClearColor(0xfff8e7,0);
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(32,1,.01,50);
    camera.position.set(0,0,3.25);
    scene.add(new T.HemisphereLight(0xfff4db,0xc1ad8f,1.95));
    const light = new T.DirectionalLight(0xfff5e1,2.5);
    light.position.set(-3,4,5);
    scene.add(light);
    pivot = new T.Group();
    scene.add(pivot);
    const canvas = renderer.domElement;
    canvas.setAttribute('role','img');
    canvas.onpointerdown = e => {
      canvas.setPointerCapture(e.pointerId);
      drag = [e.clientX,e.clientY];
    };
    canvas.onpointermove = e => {
      if (!drag || !canvas.hasPointerCapture(e.pointerId)) return;
      turn((e.clientX-drag[0])*.013, (e.clientY-drag[1])*.011);
      drag = [e.clientX,e.clientY];
    };
    canvas.onlostpointercapture = () => { drag = null; };
  }
  function clear() {
    pane = null;
    object = null;
    pivot?.clear();
    renderer?.domElement.remove();
  }
  function frameObject() {
    pivot.clear();
    const group = new T.Group();
    group.add(object);
    const box = new T.Box3().setFromObject(object);
    const center = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());
    const scale = 1.52 / Math.max(size.x,size.y,size.z,.01);
    group.scale.setScalar(scale);
    group.position.copy(center).multiplyScalar(-scale);
    pivot.add(group);
  }
  function show(container, {person, prop, clueId, food, festivalGuest, label}) {
    clear();
    try {
      if (!renderer) init();
      const id = person ? person.id+(festivalGuest ? '/festival' : '') : clueId || prop || 'food/'+food;
      if (!models.has(id)) {
        const model = person ? createStoryCharacter(person,{festivalGuest}) : food ? createStoryFood(food) : createStoryEvidence(prop,clueId);
        if (person) poseStoryCharacter(model,.65,true);
        models.set(id,model);
      }
      object = models.get(id);
      if (prop === 'basket') setEvidencePose(object,'rest');
      if (['steam-test','prototype','steam-repair'].includes(clueId)) setEvidencePose(object,clueId === 'prototype' ? 'spaced' : 'stacked');
      frameObject();
      pane = container;
      pane.append(renderer.domElement);
      renderer.domElement.setAttribute('aria-label',label+'の立体図');
      viewYaw = person ? -.22 : -.36;
      pitch = person ? .02 : .46;
      width = height = 0;
      draw();
      // Painted hide and grain can arrive after the first render.
      for (const ms of [100,550,1400]) setTimeout(() => { if (pane === container) draw(); },ms);
      return true;
    } catch (error) {
      console.warn('品物の立体表示を開けませんでした。',error);
      clear();
      return false;
    }
  }
  window.addEventListener('resize',draw);
  return {show, clear, turn, pose(mode) { if (object) { setEvidencePose(object,mode); frameObject(); draw(); } }, flip() { pitch = pitch < 0 ? .46 : -1.5; draw(); }};
}
