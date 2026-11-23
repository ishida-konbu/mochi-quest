import * as T from './vendor/three.module.min.js';
import { wrapDelta } from './terrain.js';
import { palaceInteriorAt } from './ryugu-layout.js';
import { buildFaunaParts, poseFaunaPart, faunaForm, faunaPigment, faunaForms } from './scroll-fauna-art.js';
import { SCROLL_FAUNA, moveScrollFauna } from './scroll-fauna.js';
import { distantProcession } from './procession-view.js';

export function createScrollFaunaView(root,batch,shadowMaterial) {
  const cast={},base=new T.Object3D(),limb=new T.Object3D(),matrix=new T.Matrix4();
  const sphere=new T.Sphere(),frustum=new T.Frustum(),photoPose={};
  const total=Object.values(SCROLL_FAUNA).reduce((sum,spec)=>sum+spec.count,0);
  const shadow=new T.InstancedMesh(new T.PlaneGeometry(1,1),shadowMaterial,total);
  shadow.name='鳥獣の足もとの影';shadow.frustumCulled=false;shadow.renderOrder=1;shadow.count=0;
  root.add(shadow);
  const plates=distantProcession(root,shadowMaterial,total,'scroll');
  function partsFor(kind) {
    if (!cast[kind]) {
      const species=kind==='hen'?'chicken':kind==='courtier'?'fishfolk':kind;
      const count=SCROLL_FAUNA[species].count;
      cast[kind]=buildFaunaParts(kind,batch).map(part=>{
        const mesh=new T.InstancedMesh(part.geometry,part.material||faunaPigment(),count);
        mesh.name=kind+' / '+part.name;mesh.count=0;mesh.frustumCulled=false;
        mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        root.add(mesh);return {...part,mesh};
      });
    }
    return cast[kind];
  }
  const counts={};
  function update(state,camera,viewportHeight) {
    const {player,time}=state;
    frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const eye=camera.matrixWorldInverse.elements, focal=viewportHeight*camera.projectionMatrix.elements[5]*.5;
    shadow.count=0;plates.begin(player);
    const seaCourtVisible=player.diveDepth>0 || palaceInteriorAt(player.x,player.z,player.y);
    for(const kind of faunaForms)counts[kind]=0;
    for(const actor of state.nearbyNpcs) {
      if(!actor.scrollFauna || (actor.type==='fishfolk' && !seaCourtVisible))continue;
      const n=state.photo?moveScrollFauna(Object.assign(photoPose,actor),time):actor;
      const dx=wrapDelta(n.x-player.x),dz=wrapDelta(n.z-player.z),dist=Math.hypot(dx,dz);
      if(dist>129)continue;
      const x=player.x+dx,z=player.z+dz,spec=SCROLL_FAUNA[n.type],scale=n.stature;
      const y=n.y+spec.center*scale;
      sphere.center.set(x,y,z);sphere.radius=spec.frame*scale*.62;
      if(!frustum.intersectsSphere(sphere))continue;
      const depth=-(eye[2]*x+eye[6]*y+eye[10]*z+eye[14]);
      if(!n.courtier && spec.frame*scale*focal/Math.max(.1,depth)<63) {
        plates.add(n,x,z,camera,time,Math.min(1,(129-dist)/16));continue;
      }
      const kind=faunaForm(n), parts=partsFor(kind);
      const i=counts[kind]++;
      base.position.set(x,n.y,z);base.rotation.set(0,n.heading,0);
      base.scale.setScalar(scale);base.updateMatrix();
      for(const part of parts){
        poseFaunaPart(part,n,time,limb);
        part.mesh.setMatrixAt(i,matrix.multiplyMatrices(base.matrix,limb.matrix));
      }
      if(n.onBoards || (n.type!=='hawk' && n.type!=='fishfolk')){
        limb.position.set(x,n.y+.016,z);limb.rotation.set(-Math.PI/2,0,-n.heading);
        const r=spec.frame*scale;limb.scale.set(r*.46,r*.60,1);limb.updateMatrix();
        shadow.setMatrixAt(shadow.count++,limb.matrix);
      }
    }
    for(const [kind,parts] of Object.entries(cast))for(const {mesh} of parts) {
      mesh.count=counts[kind];
      mesh.visible=mesh.count>0;
      if(mesh.count){mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,16*mesh.count);mesh.instanceMatrix.needsUpdate=true;}
    }
    shadow.visible=shadow.count>0;
    if(shadow.count)shadow.instanceMatrix.needsUpdate=true;
    plates.end();
  }
  return {update,warm:plates.warm};
}
