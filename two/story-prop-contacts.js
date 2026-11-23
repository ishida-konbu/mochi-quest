import { Box3, Matrix4, Raycaster, Vector3 } from './vendor/three.module.min.js';

// A tray can have raised battens at its far end. Sample the actual wood
// under the article rather than resting the dish on the tallest repair peg.
export function bearingHeight(frame,board,center,size){
  const ray=new Raycaster(),down=new Vector3(0,-1,0);
  let highest=-Infinity;
  board.updateWorldMatrix(true,true);
  for(const [x,z] of [[0,0],[-.26,-.26],[.26,-.26],[-.26,.26],[.26,.26]]){
    const point=frame.localToWorld(new Vector3(center.x+x*size.x,center.y+1,center.z+z*size.z));
    ray.set(point,down);
    const contact=ray.intersectObject(board,true)[0];
    if(contact)highest=Math.max(highest,frame.worldToLocal(contact.point.clone()).y);
  }
  return Number.isFinite(highest)?highest:center.y;
}

// Keep the narrow ends of a pestle, the rim of a dish and the corners of a
// turning sheet separate. One bounding box would make a tilted dish float.
const shapeCache = new WeakMap();
function shapeOf(geometry) {
  if (shapeCache.has(geometry)) return shapeCache.get(geometry);
  geometry.computeBoundingBox();
  const {min, max} = geometry.boundingBox;
  const points=geometry.attributes.position, index=geometry.index, cells=new Map();
  const vertices=[new Vector3(),new Vector3(),new Vector3()], centroid=new Vector3();
  const side=Math.max(.012,Math.max(max.x-min.x,max.y-min.y,max.z-min.z)/8);
  for(let i=0,n=index?index.count:points.count;i+2<n;i+=3){
    centroid.set(0,0,0);
    for(let j=0;j<3;j++)centroid.add(vertices[j].fromBufferAttribute(points,index?index.getX(i+j):i+j));
    centroid.multiplyScalar(1/3);
    const key=Math.floor((centroid.x-min.x)/side)+16*Math.floor((centroid.y-min.y)/side)+256*Math.floor((centroid.z-min.z)/side);
    if(!cells.has(key))cells.set(key,new Box3());
    for(const v of vertices)cells.get(key).expandByPoint(v);
  }
  const pieces = [...cells.values()];
  shapeCache.set(geometry,pieces);
  return pieces;
}

function rigidPieces(frame, model) {
  const inverse = frame.matrixWorld.clone().invert(), transform = new Matrix4(), pieces = [];
  model.updateWorldMatrix(true,true);
  model.traverseVisible(mesh => {
    if (!mesh.isMesh || mesh.material?.visible === false || !mesh.geometry.attributes.position) return;
    transform.multiplyMatrices(inverse,mesh.matrixWorld);
    for (const part of shapeOf(mesh.geometry)) pieces.push(part.clone().applyMatrix4(transform));
  });
  return pieces;
}

// A dish coming down from a steamer may travel lower once its rim has
// cleared the basket. Survey the other articles when the hand takes the
// load, after earlier jobs at this station have finished.
export function tabletopCarryFloor(bench,model,neighbors){
  let obstacles,shape;
  const local=new Matrix4(),footprint=new Box3(),point=new Vector3();
  return ()=>{
    bench.updateWorldMatrix(true,false);
    if(!obstacles){
      shape=new Box3();
      for(const piece of rigidPieces(model,model))shape.union(piece);
      obstacles=neighbors.filter(other=>other!==model && other.visible).flatMap(other=>rigidPieces(bench,other));
    }
    model.updateWorldMatrix(true,false);
    local.copy(bench.matrixWorld).invert().multiply(model.matrixWorld);
    footprint.copy(shape).applyMatrix4(local);
    let top=-Infinity;
    for(const part of obstacles){
      if(part.max.x<footprint.min.x || part.min.x>footprint.max.x ||
         part.max.z<footprint.min.z || part.min.z>footprint.max.z)continue;
      top=Math.max(top,part.max.y);
    }
    return Number.isFinite(top)?bench.localToWorld(point.set(0,top,0)).y:-Infinity;
  };
}

// Fit soft tissue and garments to the actual named mesh. Arms, trunks used as
// hands, bills and fingers remain free to grasp. Each core follows its joint.
const actorCores=new WeakMap();
const riceEnvelopes=new WeakMap();
// The geometry bounds include every squash and stretch morph at once.
// Sample the current skinned cheeks and trunk, omitting the grasping mitts.
function riceEnvelope(mesh){
  let shape=riceEnvelopes.get(mesh);
  if(!shape){
    const {position,skinIndex}=mesh.geometry.attributes,point=new Vector3(),directions=[];
    for(const x of [-1,0,1])for(const y of [-1,0,1])for(const z of [-1,0,1]){
      if(x || y || z)directions.push({axis:new Vector3(x,y,z),best:-Infinity,i:0});
    }
    for(let i=0;i<position.count;i++){
      if(/Hand|Foot/.test(mesh.skeleton.bones[skinIndex.getX(i)]?.name))continue;
      point.fromBufferAttribute(position,i);
      for(const d of directions){
        const radius=point.dot(d.axis);if(radius>d.best){d.best=radius;d.i=i;}
      }
    }
    shape={indices:[...new Set(directions.map(d=>d.i))],box:new Box3(),point,center:new Vector3(),radius:new Vector3()};
    riceEnvelopes.set(mesh,shape);
  }
  mesh.updateWorldMatrix(true,false);mesh.updateMatrixWorld();
  for(const bone of mesh.skeleton.bones)bone.updateWorldMatrix(true,false);
  shape.box.makeEmpty();
  for(const i of shape.indices)shape.box.expandByPoint(mesh.getVertexPosition(i,shape.point));
  shape.box.getCenter(shape.center);shape.box.getSize(shape.radius).multiplyScalar(.48);
  return shape;
}
const coreNames=new Set(['haori','土地染めの仕事着','面相','眉と上あご','喉袋と下あご','猿の面相','亀甲と腹甲',
  '背へ結んだ土地染めの荷布','絵巻の一枚皮','にっこり餅の面相','body','head','octopus-mantle','bream-body',
  'turtle-shell','差配役の肩掛け','Nikkori']);
export function storyBodyCores(actor) {
  if(actorCores.has(actor))return actorCores.get(actor);
  const cores=[];
  actor.traverse(mesh=>{
    if(!mesh.isMesh || !coreNames.has(mesh.name) || !mesh.geometry.attributes.position)return;
    mesh.geometry.computeBoundingBox();
    const box=mesh.geometry.boundingBox,center=box.getCenter(new Vector3()),radius=box.getSize(new Vector3()).multiplyScalar(.48);
    if(mesh.name==='絵巻の一枚皮'){
      // A quadruped's bound includes legs, long nose, ears and antlers.
      radius.multiply(new Vector3(.86,.52,.65));
    }else if(mesh.name==='Nikkori')radius.multiply(new Vector3(.78,.85,.87));
    if(Math.min(radius.x,radius.y,radius.z)>.012)cores.push({mesh,center,radius});
  });
  actorCores.set(actor,cores);
  return cores;
}

// The axes are the worktop's own axes, including at a rotated roadside bench.
// Exclude parts that fit inside a socket from the socket's obstacle list.
export function createWorkContact(pivot, model, bench, plan, otherModels = []) {
  pivot.updateWorldMatrix(true,false);
  bench.updateWorldMatrix(true,false);
  const inverse = bench.matrixWorld.clone().invert(), matrix = new Matrix4();
  const pieces = rigidPieces(pivot,model), bounds = new Box3(), pieceBounds = new Box3();
  const top = new Box3(new Vector3(-plan.width/2,plan.top-.10,-plan.depth/2),new Vector3(plan.width/2,plan.top,plan.depth/2));
  const orientedBounds=new Box3(),axes=new Float64Array(11).fill(NaN),translation=new Vector3();
  function measure() {
    pivot.updateWorldMatrix(true,false);
    matrix.multiplyMatrices(inverse,pivot.matrixWorld);
    translation.setFromMatrixPosition(matrix);
    // A handoff tries several translations with the same rotation. Compute
    // the rotated contour once, including when a reader pauses on that pose.
    const m=matrix.elements;
    if(!axes.every((v,i)=>Math.abs(v-m[i])<1e-10)){
      axes.set(m.slice(0,11));orientedBounds.makeEmpty();matrix.setPosition(0,0,0);
      for(const part of pieces)orientedBounds.union(pieceBounds.copy(part).applyMatrix4(matrix));
    }
    bounds.copy(orientedBounds).translate(translation);
  }
  function separation(part){
    const gap=Math.max(bounds.min.x-part.max.x,part.min.x-bounds.max.x,bounds.min.z-part.max.z,part.min.z-bounds.max.z);
    if(gap>=.075)return 0;
    const u=Math.max(0,gap/.075);
    return Math.max(0,part.max.y+.002-bounds.min.y)*(1-u*u*(3-2*u));
  }
  measure();
  const initial=bounds.getCenter(new Vector3());
  const obstacles=otherModels.filter(Boolean).map(other=>{
    const box=new Box3(), contacts=rigidPieces(bench,other).map(part=>{
      box.union(part);
      return {part,rest:bounds.max.y<part.min.y-.003?0:separation(part)};
    });
    return {box,contacts};
  });
  const point = new Vector3(), center = new Vector3(), extent = new Vector3(), grip = new Vector3();
  const localBox = new Box3();
  for (const part of pieces) localBox.union(part);
  localBox.getCenter(center); localBox.getSize(extent);
  const pads = [-1,1].map(sign => {
    const target = new Vector3(center.x+sign*extent.x*.52,center.y+extent.y*.05,center.z-extent.z*.22);
    let closest = Infinity, contact = target.clone();
    for (const part of pieces) {
      part.clampPoint(target,grip);
      const distance = grip.distanceToSquared(target);
      if (distance<closest) { closest=distance; contact.copy(grip); }
    }
    return contact;
  });
  function lift() {
    if (!pivot.visible || !pieces.length) return;
    measure();
    let correction=separation(top);
    const moved=bounds.getCenter(point).distanceTo(initial);
    for(const {box,contacts} of obstacles){
      if(!separation(box))continue;
      for(const {part,rest} of contacts){
        if(bounds.max.y<part.min.y-.003)continue;
        // Preserve a leaf initially tucked into a basket or fitted between
        // boards. Only fresh penetration can dislodge it on the first frame.
        correction=Math.max(correction,separation(part)-Math.max(0,rest-moved));
      }
    }
    // Both the work stand and scene use metre units with a vertical world Y.
    pivot.position.y+=correction;
  }
  function penetration(worldPoint,radius) {
    point.copy(worldPoint).applyMatrix4(inverse);
    const gap=Math.max(Math.abs(point.x)-plan.width/2,Math.abs(point.z)-plan.depth/2);
    return gap>=radius ? 0 : Math.max(0,Math.min(radius-gap,plan.top+radius-point.y));
  }
  const coreBox=new Box3(), intoCore=new Matrix4(), localPoint=new Vector3(), correction=new Vector3();
  const lastSafe=new Vector3(),back=new Vector3(),oldBox=new Box3(),outward=new Vector3(),halfSize=new Vector3();
  let hasLastSafe=false;
  function rememberSupport(){pivot.getWorldPosition(lastSafe);hasLastSafe=true;}
  function clearBodies(actors,maintainSide=true) {
    if(!pieces.length)return;
    for(const actor of actors)for(const core of storyBodyCores(actor)){
      const mesh=core.mesh;
      if(!mesh.visible)continue;
      const {center,radius}=!maintainSide && mesh.isSkinnedMesh && mesh.name==='Nikkori'?riceEnvelope(mesh):core;
      mesh.updateWorldMatrix(true,false);
      pivot.updateWorldMatrix(true,false);
      intoCore.copy(mesh.matrixWorld).invert().multiply(pivot.matrixWorld);
      coreBox.copy(localBox).applyMatrix4(intoCore);
      coreBox.clampPoint(center,localPoint).sub(center);
      const ry=localPoint.y/radius.y;
      if(Math.abs(ry)>=1)continue;
      const section=Math.sqrt(1-ry*ry),rx=radius.x*section,rz=radius.z*section;
      const distance=Math.hypot(localPoint.x/rx,localPoint.z/rz);
      if(distance>=1)continue;
      let keptSide=false;
      if(hasLastSafe && maintainSide){
        // A broad tray may cover the centre of two coats at once. Follow the
        // side on which the tray arrived, instead of alternating between the
        // nearest face of each coat as the actors pass shoulder to shoulder.
        const inv=intoCore.copy(mesh.matrixWorld).invert();
        back.copy(lastSafe).applyMatrix4(inv).sub(point.setFromMatrixPosition(pivot.matrixWorld).applyMatrix4(inv));
        oldBox.copy(coreBox).translate(back);
        oldBox.clampPoint(center,outward).sub(center).setY(0);
        if(outward.lengthSq()>1e-6){
          outward.set(outward.x/(rx*rx),0,outward.z/(rz*rz)).normalize();
          coreBox.getSize(halfSize).multiplyScalar(.5);
          const min=(coreBox.getCenter(localPoint).sub(center)).dot(outward)-Math.abs(outward.x)*halfSize.x-Math.abs(outward.z)*halfSize.z;
          const tangent=Math.hypot(outward.x*rx,outward.z*rz);
          correction.copy(outward).multiplyScalar(Math.max(0,tangent-min));keptSide=true;
        }
      }
      if(!keptSide && distance>.00001){
        correction.set(localPoint.x*(1/distance-1),0,localPoint.z*(1/distance-1));
      }else if(!keptSide){
        // When a thin paper enters the chest centre, exit by its nearest face.
        const dx=[center.x-rx-coreBox.max.x,center.x+rx-coreBox.min.x].reduce((a,b)=>Math.abs(a)<Math.abs(b)?a:b);
        const dz=[center.z-rz-coreBox.max.z,center.z+rz-coreBox.min.z].reduce((a,b)=>Math.abs(a)<Math.abs(b)?a:b);
        correction.set(Math.abs(dx)<Math.abs(dz)?dx:0,0,Math.abs(dx)<Math.abs(dz)?0:dz);
      }
      const a=point.setFromMatrixPosition(pivot.matrixWorld);
      intoCore.copy(mesh.matrixWorld).invert();a.applyMatrix4(intoCore).add(correction).applyMatrix4(mesh.matrixWorld);
      pivot.position.copy(pivot.parent.worldToLocal(a));
    }
  }
  function nearest(worldPalm) {
    const palm=pivot.worldToLocal(worldPalm.clone()), hit=palm.clone();
    let best=Infinity;
    for(const part of pieces){
      part.clampPoint(palm,grip);
      const d=grip.distanceToSquared(palm);
      if(d<best){best=d;hit.copy(grip);}
      if(!d)break;
    }
    return pivot.localToWorld(hit);
  }
  // If neither set of fingers spans the handoff, the giver slides the piece
  // across the board and the recipient collects it from the near edge.
  function restOnWorktop(amount,actors,palms=[]) {
    if(amount<=0 || !pieces.length)return;
    measure();
    const before=pivot.position.clone(), mid=bounds.getCenter(new Vector3());
    const insetX=Math.min(plan.width*.18,(bounds.max.x-bounds.min.x)*.21);
    const insetZ=Math.min(plan.depth*.18,(bounds.max.z-bounds.min.z)*.21);
    const x=Math.max(top.min.x+insetX,Math.min(top.max.x-insetX,mid.x));
    const z=Math.max(top.min.z+insetZ,Math.min(top.max.z-insetZ,mid.z));
    const at=new Vector3().setFromMatrixPosition(pivot.matrixWorld).applyMatrix4(inverse);
    at.x+=x-mid.x;at.z+=z-mid.z;at.y+=plan.top+.002-bounds.min.y;
    pivot.position.copy(pivot.parent.worldToLocal(bench.localToWorld(at)));
    if(actors)clearBodies(actors);
    lift();
    const best=pivot.position.clone();
    let cost=before.distanceTo(best);
    // Crossing all the way back to a distant worktop would pull the article
    // out of a nearby hand. Try an actual joint support before that detour.
    for(const palm of palms){
      pivot.position.copy(before);
      const delta=palm.clone().sub(nearest(palm));
      if(delta.length()>=cost)continue;
      pivot.position.copy(pivot.parent.worldToLocal(pivot.getWorldPosition(point).add(delta)));
      if(actors)clearBodies(actors);
      lift();
      const residual=nearest(palm).distanceTo(palm);
      const effort=before.distanceTo(pivot.position)+residual*3;
      if(effort<cost){cost=effort;best.copy(pivot.position);}
    }
    pivot.position.copy(best).lerp(before,1-amount);
    lift();
  }
  // A withdrawn hand needs a stable patch on the board itself. The open
  // space between a dish's feet, or inside the bounding box of a standing
  // display, cannot support paper after that display moves away.
  function parkOnWorktop(){
    restOnWorktop(1);
    measure();
    if(bounds.min.y<=plan.top+.006)return;
    const origin=pivot.position.clone(),mid=bounds.getCenter(new Vector3());
    const ext=bounds.getSize(new Vector3()),halfX=Math.min(ext.x*.45,plan.width*.38);
    const halfZ=Math.min(ext.z*.45,plan.depth*.38),away=mid.y-bounds.min.y;
    const offsets=[];
    for(const x of [-.88,-.66,-.42,-.22,0,.22,.42,.66,.88])for(const z of [-1,-.55,0,.55,1]){
      const px=(plan.width/2-halfX)*x,pz=(plan.depth/2-halfZ)*z;
      offsets.push({x:px-mid.x,z:pz-mid.z,d:Math.hypot(px-mid.x,pz-mid.z)});
    }
    offsets.sort((a,b)=>a.d-b.d);
    const originalFrame=bench.worldToLocal(pivot.getWorldPosition(new Vector3()));
    for(const offset of offsets){
      const at=originalFrame.clone().add(new Vector3(offset.x,plan.top+.002+away-mid.y,offset.z));
      pivot.position.copy(pivot.parent.worldToLocal(bench.localToWorld(at)));
      lift();measure();
      if(bounds.min.y<=plan.top+.006)return;
    }
    pivot.position.copy(origin);
  }
  // A low hand can sit behind an apron or below the rim of a tall dish.
  // Bring the article around the receiver's shoulder until a contact patch
  // is genuinely reachable without lowering the object through the worktop.
  function handoff(palm,body,actors,reach,amount) {
    if(amount<=0)return;
    const patch=nearest(palm),initial=pivot.getWorldPosition(new Vector3());
    let distance=patch.distanceTo(palm);
    if(distance<=reach+.008)return;
    const outward=palm.clone().sub(body.getWorldPosition(new Vector3())).setY(0).normalize();
    const tangent=new Vector3(-outward.z,0,outward.x), best=pivot.position.clone();
    const pull=palm.clone().sub(patch).multiplyScalar(amount);
    for(const [forward,side] of [[0,0],[0,.14],[0,-.14],[.14,0],[-.14,0],[0,.30],[0,-.30],[.26,.16],[.26,-.16]]){
      const next=initial.clone().add(pull).addScaledVector(outward,forward*amount).addScaledVector(tangent,side*amount);
      pivot.position.copy(pivot.parent.worldToLocal(next));
      clearBodies(actors);lift();
      const gap=nearest(palm).distanceTo(palm);
      if(gap<distance){distance=gap;best.copy(pivot.position);}
      if(distance<=reach)break;
    }
    pivot.position.copy(best);
  }
  return {lift,clearBodies,rememberSupport,penetration,nearest,handoff,restOnWorktop,parkOnWorktop,edge:sign=>pivot.localToWorld(pads[sign<0?0:1].clone())};
}

// Keep the exhibit under its authored parent so lids, leaves and food can still
// be found on the following beat. Its world pose follows the receiver's joint.
export function followStoryGrip(object,grip) {
  object.updateWorldMatrix(true,false);
  grip.updateWorldMatrix(true,false);
  const offset=grip.matrixWorld.clone().invert().multiply(object.matrixWorld), local=new Matrix4();
  return () => {
    object.parent.updateWorldMatrix(true,false);
    grip.updateWorldMatrix(true,false);
    local.copy(object.parent.matrixWorld).invert().multiply(grip.matrixWorld).multiply(offset);
    local.decompose(object.position,object.quaternion,object.scale);
    object.updateMatrixWorld(true);
  };
}
