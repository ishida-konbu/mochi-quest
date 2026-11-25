// The editor uses the exploration camera and the finished structures' actual meshes.
// CSS pixels are measured against the full canvas even when a tool shelf covers part of it.
import * as T from './vendor/three.module.min.js';
import { terrainContactHeight } from './terrain.js';
import { visibleWorkArea } from './build-craft-scene.js';

const TURN=Math.PI/12, TAU=Math.PI*2;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const point=e=>({x:e.clientX,y:e.clientY});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function buildGroundHit(ray,above=0,height=terrainContactHeight) {
  const p=new T.Vector3();
  const gap=t=>{ray.at(t,p);return p.y-height(p.x,p.z)-above;};
  // Find the first crossing, including rising terrain towards the horizon.
  let previous=0;
  if(gap(0)<0)return null;
  for(let t=.4;t<=145;t+=.4){
    if(gap(t)<=0){
      let lo=previous,hi=t;
      for(let i=0;i<12;i++){
        const mid=(lo+hi)/2;
        if(gap(mid)>0)lo=mid;else hi=mid;
      }
      return ray.at((lo+hi)/2,p);
    }
    previous=t;
  }
  return null;
}

function boxCorners(mesh){
  const g=mesh.geometry;
  if(!g.boundingBox)g.computeBoundingBox();
  const {min,max}=g.boundingBox,points=[];
  for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){
    points.push(new T.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld));
  }
  return points;
}
function objectCorners(mesh){
  const corners=boxCorners(mesh);
  if(mesh.userData.foundation)corners.push(...boxCorners(mesh.userData.foundation));
  return corners;
}
const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
function convexHull(points){
  const sorted=[...points].sort((a,b)=>a.x-b.x || a.y-b.y);
  const side=list=>{
    const chain=[];
    for(const p of list){
      while(chain.length>1 && cross(chain.at(-2),chain.at(-1),p)<=0)chain.pop();
      chain.push(p);
    }
    return chain.slice(0,-1);
  };
  return [...side(sorted),...side(sorted.reverse())];
}

// Intersection with the oriented screen hull avoids selecting a long fence just
// because a corner of its axis-aligned screen box falls inside the marquee.
export function buildMarqueeHit(points,a,b) {
  if(!points.length)return false;
  const hull=convexHull(points),x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);
  if(hull.every(p=>p.x<x0) || hull.every(p=>p.x>x1) || hull.every(p=>p.y<y0) || hull.every(p=>p.y>y1))return false;
  const corners=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
  return hull.every((from,i)=>corners.some(p=>cross(from,hull[(i+1)%hull.length],p)>=0));
}
function strokes(color,opacity){
  return new T.LineSegments(new T.BufferGeometry(),
    new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,toneMapped:false}));
}
function lines(mesh,coordinates){
  const old=mesh.geometry;mesh.geometry=new T.BufferGeometry();
  mesh.geometry.setAttribute('position',new T.Float32BufferAttribute(coordinates,3));old.dispose();
}
function guideGrid(){
  const g=new T.Group(),fine=strokes(0x526f63,.42),axes=strokes(0x374c45,.80);
  const grid=[],major=[];
  for(let i=-10;i<=10;i++){
    const stroke=i%5===0?major:grid;
    stroke.push(i,0,-10,i,0,10,-10,0,i,10,0,i);
  }
  lines(fine,grid);lines(axes,major);g.add(fine,axes);
  g.name='一メートルの水平グリッド';return g;
}

export function createBuildEditorViewport({scene,camera,canvas,world,draw}){
  let session=null,layer,grid,plumb,outline,ring,knob,marquee,observer,saved;
  let ghosts=[],selected=[],range=false,showGrid=true;
  let yaw=0,pitch=.76,zoom=1,pivot=null,radius=1,gesture=null,pinch=null;
  let frameBounds=new T.Box3(),layout=null,guideSignature='';
  const target=new T.Vector3(),pointer=new T.Vector2(),raycaster=new T.Raycaster(),contacts=new Map();

  function clientPoint(p){
    const projected=p.clone().project(camera),b=layout.canvas;
    return {x:b.left+(projected.x+1)*b.width/2,y:b.top+(1-projected.y)*b.height/2,z:projected.z};
  }
  function project(position){
    if(!session)return null;
    const p=clientPoint(new T.Vector3(position.x,position.y,position.z));
    return {x:p.x-layout.surface.left,y:p.y-layout.surface.top,z:p.z};
  }
  function rayAt(p){
    const b=layout.canvas;
    pointer.set(2*(p.x-b.left)/b.width-1,1-2*(p.y-b.top)/b.height);
    raycaster.setFromCamera(pointer,camera);
    return raycaster.ray;
  }
  function dimensions(){
    const a=layout.canvas,b=layout.surface,tan=Math.tan(camera.fov*Math.PI/360);
    const width=b.width<500 ? 7.8 : 10.6;
    return zoom*Math.max(width/(2*tan*camera.aspect*b.width/a.width),6.1/(2*tan*b.height/a.height));
  }
  function eyePosition(angle){
    const d=dimensions(),run=d*Math.cos(pitch),x=target.x+Math.sin(angle)*run,z=target.z+Math.cos(angle)*run;
    let y=target.y+Math.sin(pitch)*d;
    // A hill between the pivot and the lens can hide every handle even though
    // the lens itself is above ground. Lift just enough to see over its crest.
    for(let i=1;i<=18;i++){
      const t=i/18,ground=terrainContactHeight(target.x+(x-target.x)*t,target.z+(z-target.z)*t);
      y=Math.max(y,target.y+(ground+.18-target.y)/t);
    }
    return new T.Vector3(x,y,z);
  }
  function placeCamera(){
    const b=layout.canvas,s=layout.surface;
    camera.aspect=b.width/b.height;
    camera.position.copy(eyePosition(yaw));camera.lookAt(target);
    camera.setViewOffset(b.width,b.height,b.left+b.width/2-s.left-s.width/2,b.top+b.height/2-s.top-s.height/2,b.width,b.height);
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function initialBearing(){
    // Test the painted canopy as well as collision shapes. A short portrait
    // viewport can put the lens on the other side of an overhanging bough.
    const clear=visibleWorkArea(scene,layer,target,undefined,dimensions()+3);
    const origin=yaw,normalPitch=pitch;
    let best=-Infinity,bearing=yaw,tilt=pitch;
    for(const elevation of [normalPitch,1.12,1.32]){
      pitch=elevation;
      for(const offset of [0,.65,-.65,1.35,-1.35,Math.PI]){
        const a=origin+offset,end=eyePosition(a);
        const side=new T.Vector3(Math.cos(a)*.48,0,-Math.sin(a)*.48);
        const front=new T.Vector3(Math.sin(a)*.52,0,Math.cos(a)*.52).add(target);
        const samples=[front,front.clone().add(side),front.clone().sub(side).add(new T.Vector3(0,.42,0))];
        const rank=samples.filter(p=>clear(p,end)).length-.04*Math.abs(offset)-.20*Math.abs(elevation-normalPitch);
        if(rank>best){best=rank;bearing=a;tilt=elevation;}
        if(rank===3){yaw=a;return;}
      }
      if(best>2.5)break;
    }
    yaw=bearing;pitch=tilt;
  }
  function visibleObjects(){return world.getBuildEditorObjects();}
  function localGuides(){
    const active=ghosts.length?ghosts:visibleObjects().filter(s=>selected.includes(s.id)).map(s=>s.mesh);
    outline.visible=active.length>0 && !range;
    ring.visible=outline.visible;
    grid.visible=showGrid;plumb.visible=showGrid && outline.visible;
    const vertices=[],feet=[];
    frameBounds.makeEmpty();
    for(const mesh of active){
      mesh.updateWorldMatrix(true,true);
      frameBounds.expandByObject(mesh);
      const corners=boxCorners(mesh);
      feet.push(mesh.position);
      // Mark the exact authored footprint instead of a shared north-aligned box.
      for(const [a,b] of [[0,1],[0,4],[4,5],[1,5],[2,3],[2,6],[6,7],[3,7],[0,2],[1,3],[4,6],[5,7]]){
        const start=corners[a],delta=corners[b].clone().sub(start);
        const n=Math.min(.28,delta.length()*.24);delta.normalize().multiplyScalar(n);
        vertices.push(...start.toArray(),...start.clone().add(delta).toArray(),...corners[b].toArray(),...corners[b].clone().sub(delta).toArray());
      }
    }
    if(!active.length)pivot=null;
    else{
      pivot=frameBounds.getCenter(new T.Vector3());
      pivot.y=Math.max(...feet.map(p=>p.y))+.10;
      radius=Math.max(.95,Math.hypot(frameBounds.max.x-pivot.x,frameBounds.max.z-pivot.z)+.48);
    }
    const level=pivot??target;
    grid.position.set(Math.round(level.x),pivot?level.y-.06:terrainContactHeight(level.x,level.z)+.05,Math.round(level.z));
    const signature=[...vertices,showGrid,range,pivot?.y].join('/');
    if(signature===guideSignature)return;
    guideSignature=signature;
    lines(outline,vertices);
    if(!pivot)return;
    ring.position.copy(pivot);
    const arcs=[],uprights=[];
    for(let i=0;i<96;i++){
      const a=i*TAU/96,b=(i+1)*TAU/96,x=Math.sin(a)*radius,z=Math.cos(a)*radius;
      arcs.push(x,0,z,Math.sin(b)*radius,0,Math.cos(b)*radius);
      if(i%4===0){const inside=radius-(i%24===0?.22:.11);arcs.push(x,0,z,Math.sin(a)*inside,0,Math.cos(a)*inside);}
    }
    for(const x of [frameBounds.min.x,frameBounds.max.x])for(const z of [frameBounds.min.z,frameBounds.max.z]){
      const ground=terrainContactHeight(x,z),top=Math.max(frameBounds.max.y,ground+.35);
      uprights.push(x,ground,z,x,top,z);
      for(let h=Math.ceil(ground*5)/5;h<top;h+=.20)uprights.push(x-.055,h,z,x+.055,h,z);
    }
    lines(ring,arcs);lines(plumb,uprights);
  }
  function handlePosition(){
    knob.hidden=!pivot || range;
    if(knob.hidden)return;
    // Put the grab point on the right rim of the dial from the current viewing side.
    const p=clientPoint(new T.Vector3(pivot.x+Math.cos(yaw)*radius,pivot.y,pivot.z-Math.sin(yaw)*radius));
    const s=layout.surface;
    const active=gesture?.mode==='turn' && gesture.started ? gesture.last:p;
    if(p.z< -1 || p.z>1 || p.x<s.left-12 || p.x>s.right+12 || p.y<s.top-12 || p.y>s.bottom+12){knob.hidden=true;return;}
    knob.style.left=clamp(active.x-s.left,22,Math.max(22,s.width-22))+'px';
    knob.style.top=clamp(active.y-s.top,22,Math.max(22,s.height-22))+'px';
  }
  function repaint(){
    if(!session)return;
    handlePosition();draw();
  }
  function resize(){
    if(!session)return;
    const c=canvas.getBoundingClientRect(),s=session.surface.getBoundingClientRect();
    if(!c.width || !c.height || !s.width || !s.height)return;
    const initial=!layout;layout={canvas:c,surface:s};
    if(initial)initialBearing();
    placeCamera();localGuides();repaint();
  }
  function pick(p,touch){
    const ray=rayAt(p),hits=[];
    const ground=buildGroundHit(ray);
    const far=ground?ground.distanceTo(ray.origin)+.09:145;
    const solids=visibleObjects();
    for(const item of [...ghosts.map(mesh=>({mesh,ghost:true})),...solids]){
      item.mesh.updateWorldMatrix(true,true);
      // Preview lines can use a very broad default ray threshold. Intersect the
      // actual surfaces first, then the outlined, hollow volume of a preview.
      const shapes=[];item.mesh.traverse(o=>{if(o.isMesh)shapes.push(o);});
      const hit=raycaster.intersectObjects(shapes,false)[0];
      if(hit && hit.distance<=far)hits.push({...item,hit:hit.point,d:hit.distance});
    }
    const actual=hits.sort((a,b)=>a.d-b.d)[0];
    if(actual)return actual;
    const tolerance=touch?6:2;
    for(const mesh of ghosts){
      const corners=objectCorners(mesh).map(clientPoint).filter(v=>v.z>=-1 && v.z<=1);
      if(buildMarqueeHit(corners,{x:p.x-tolerance,y:p.y-tolerance},{x:p.x+tolerance,y:p.y+tolerance})){
        const plane=new T.Plane(new T.Vector3(0,1,0),-mesh.position.y);
        const hit=ray.intersectPlane(plane,new T.Vector3());
        if(hit)return {mesh,ghost:true,hit};
      }
    }
    return null;
  }
  function marqueeIds(from,to){
    return visibleObjects().filter(({mesh})=>{
      mesh.updateWorldMatrix(true,true);
      return buildMarqueeHit(objectCorners(mesh).map(clientPoint).filter(p=>p.z>=-1 && p.z<=1),from,to);
    }).map(s=>s.id);
  }
  function pointerDown(e){
    if(e.button>1 || !layout)return;
    e.preventDefault();
    const p=point(e);contacts.set(e.pointerId,p);session.surface.setPointerCapture(e.pointerId);
    if(contacts.size>=2){
      if(contacts.size===2){
        const [a,b]=[...contacts.values()];
        pinch={center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.max(1,distance(a,b))};
      }
      marquee.hidden=true;gesture=null;return;
    }
    const handle=e.target===knob || knob.contains(e.target);
    const hit=handle?null:pick(p,e.pointerType==='touch'),additive=e.shiftKey || e.metaKey || e.ctrlKey;
    const mode=range?'range':handle?'turn':hit?'object':e.button===1?'pan':'orbit';
    gesture={id:e.pointerId,origin:p,last:p,hit,mode,started:false,additive,touch:e.pointerType==='touch',turn:0,ticks:0};
    if(hit)gesture.above=hit.hit.y-terrainContactHeight(hit.hit.x,hit.hit.z);
    if(handle){const c=clientPoint(pivot);gesture.angle=Math.atan2(p.y-c.y,p.x-c.x);}
  }
  function flatPan(a,b){
    const plane=new T.Plane(new T.Vector3(0,1,0),-target.y);
    const from=rayAt(a).intersectPlane(plane,new T.Vector3()),to=rayAt(b).intersectPlane(plane,new T.Vector3());
    if(from && to){target.x+=from.x-to.x;target.z+=from.z-to.z;target.y=terrainContactHeight(target.x,target.z)+.75;}
  }
  function movePointer(e){
    const p=point(e);
    if(!contacts.has(e.pointerId))return;
    contacts.set(e.pointerId,p);
    if(pinch && contacts.size>=2){
      const [a,b]=[...contacts.values()],d=Math.max(1,distance(a,b)),c={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      flatPan(pinch.center,c);zoom=clamp(zoom*pinch.distance/d,.50,3.0);
      pinch={center:c,distance:d};placeCamera();repaint();return;
    }
    const g=gesture;if(!g || e.pointerId!==g.id)return;
    if(!g.started && distance(g.origin,p)<(g.touch?7:4))return;
    if(!g.started){
      g.started=true;
      if(g.mode==='object' && !g.hit.ghost){
        if(!selected.includes(g.hit.id))session.onSelect([g.hit.id],{additive:g.additive});
        session.onMoveStart?.();
      }
      if(g.mode==='turn' && !ghosts.length)session.onMoveStart?.();
    }
    const last=g.last;g.last=p;
    if(g.mode==='object'){
      const before=buildGroundHit(rayAt(last),g.above),after=buildGroundHit(rayAt(p),g.above);
      if(before && after)session.onMove(after.x-before.x,after.z-before.z);
    }else if(g.mode==='turn' && pivot){
      const c=clientPoint(pivot),angle=Math.atan2(p.y-c.y,p.x-c.x);
      if(distance(c,p)>8){
        g.turn-=Math.atan2(Math.sin(angle-g.angle),Math.cos(angle-g.angle));
        const ticks=Math.round(g.turn/TURN);
        if(ticks!==g.ticks)session.onTurn(ticks-g.ticks);
        g.ticks=ticks;g.angle=angle;
      }
      handlePosition();
    }else if(g.mode==='range'){
      const b=layout.surface;
      marquee.hidden=false;marquee.style.left=Math.min(g.origin.x,p.x)-b.left+'px';marquee.style.top=Math.min(g.origin.y,p.y)-b.top+'px';
      marquee.style.width=Math.abs(g.origin.x-p.x)+'px';marquee.style.height=Math.abs(g.origin.y-p.y)+'px';
    }else if(g.mode==='orbit' || g.mode==='pan'){
      if(g.mode==='pan')flatPan(last,p);
      else{yaw-=(p.x-last.x)*.006;pitch=clamp(pitch+(p.y-last.y)*.005,.28,1.34);}
      placeCamera();repaint();
    }
  }
  function finishPointer(e){
    const existed=contacts.delete(e.pointerId);
    if(!existed)return;
    if(pinch){if(contacts.size<2)pinch=null;gesture=null;return;}
    const g=gesture;
    if(!g || g.id!==e.pointerId)return;
    gesture=null;marquee.hidden=true;
    if(e.type==='pointerup'){
      if(g.mode==='range' && g.started)session.onSelect(marqueeIds(g.origin,point(e)),{additive:g.additive});
      else if(!g.started && g.mode==='turn'){
        if(!ghosts.length)session.onMoveStart?.();
        session.onTurn(g.additive?-1:1);
      }else if(!g.started && !g.hit?.ghost)session.onSelect(g.hit?[g.hit.id]:[],{additive:g.additive});
    }
    if(session)handlePosition();
  }
  function wheel(e){
    e.preventDefault();
    zoom=clamp(zoom*Math.exp(clamp(e.deltaY,-200,200)*.0017),.50,3.0);placeCamera();repaint();
  }
  function open(options){
    if(session)close();
    session=options;yaw=options.yaw||0;pitch=.76;zoom=1;
    target.set(options.center.x,options.center.y+.75,options.center.z);
    saved={p:camera.position.clone(),q:camera.quaternion.clone(),view:camera.view?{...camera.view}:null,
      fov:camera.fov,aspect:camera.aspect};
    camera.fov=49;
    const s=session.surface;
    s.classList.add('build-editor-surface');
    knob=document.createElement('button');knob.type='button';knob.className='build-turn-handle';knob.hidden=true;
    knob.title='ドラッグして回転・タップで15度回す';knob.setAttribute('aria-label','配置枠を15度回す');
    knob.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.8 9a7.5 7.5 0 1 0 .2 5.5M19 4v5.4h-5.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    knob.addEventListener('click',e=>{if(!e.detail){if(!ghosts.length)session.onMoveStart?.();session.onTurn(1);}});
    marquee=document.createElement('div');marquee.className='build-marquee';marquee.hidden=true;s.append(knob,marquee);
    layer=new T.Group();layer.name='普請の位置と寸法';
    grid=guideGrid();plumb=strokes(0x3f665c,.76);outline=strokes(0xffe8a8,.93);ring=strokes(0xa65338,.86);
    for(const mesh of [outline,ring]){mesh.material.depthTest=false;mesh.renderOrder=4;}
    layer.add(grid,plumb,outline,ring);scene.add(layer);
    for(const [name,fn] of Object.entries(handlers))s.addEventListener(name,fn,{passive:false});
    resize();observer=new ResizeObserver(resize);observer.observe(s);
  }
  const handlers={pointerdown:pointerDown,pointermove:movePointer,pointerup:finishPointer,
    pointercancel:finishPointer,lostpointercapture:finishPointer,wheel};
  function update(state){
    if(!session)return;
    selected=state.selectedIds??[];range=Boolean(state.range);showGrid=Boolean(state.grid);
    const sites=state.ghosts??[];
    world.setBuildEditorHidden(sites.map(s=>s.id).filter(Boolean));
    ghosts=world.setBuildingPreviews(sites);
    if(!layout)return;
    localGuides();
    // Keyboard nudges can carry a frame to the edge. Keep the grip under the
    // pointer during drags; only unattended previews are recentered.
    if(pivot && ghosts.length && !gesture && !pinch){
      const p=clientPoint(pivot),s=layout.surface;
      if(p.z< -1 || p.z>1 || p.x<s.left+24 || p.x>s.right-24 || p.y<s.top+20 || p.y>s.bottom-20){
        target.set(pivot.x,pivot.y+.65,pivot.z);placeCamera();
      }
    }
    repaint();
  }
  function focus(pos){
    if(!session || !pos)return;
    target.set(pos.x,pos.y+.75,pos.z);
    if(layout){placeCamera();draw();initialBearing();placeCamera();localGuides();repaint();}
  }
  function close(){
    if(!session)return;
    const s=session.surface;
    observer?.disconnect();
    for(const [name,fn] of Object.entries(handlers))s.removeEventListener(name,fn);
    for(const id of contacts.keys())if(s.hasPointerCapture(id))s.releasePointerCapture(id);
    contacts.clear();gesture=null;pinch=null;s.classList.remove('build-editor-surface');
    knob.remove();marquee.remove();layer.removeFromParent();
    layer.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    world.setBuildingPreviews([]);world.setBuildEditorHidden([]);
    camera.position.copy(saved.p);camera.quaternion.copy(saved.q);
    const c=canvas.getBoundingClientRect();camera.aspect=c.width&&c.height?c.width/c.height:saved.aspect;
    camera.fov=saved.fov;
    if(saved.view?.enabled){const v=saved.view;camera.setViewOffset(v.fullWidth,v.fullHeight,v.offsetX,v.offsetY,v.width,v.height);}
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
    session=null;layout=null;ghosts=[];selected=[];pivot=null;guideSignature='';draw();
  }
  return {open,update,resize,focus,project,close,bearing:()=>yaw};
}
