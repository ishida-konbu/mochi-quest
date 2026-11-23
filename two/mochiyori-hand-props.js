import { createSteam, steamSource } from './steam.js';
import * as T from './vendor/three.module.min.js';
const vec=(x,y,z)=>new T.Vector3(x,y,z);

export function makeSteam(){
  return createSteam([steamSource('steamer',0,0,0)]);
}

export function steamingBeat(spec,beat){
  return spec.code==='steamer' && ['single','stacked','spaced'].includes(beat.pose) ||
    spec.code==='food' && (spec.region==='spring'||spec.region==='snow') && beat.gesture==='divide';
}

// A lifted tier releases the steam from the remaining rice. Splitting a
// hot cake releases a smaller thread from the freshly exposed filling.
export function poseStorySteam(steam,stage,beat,item,node,grip,size,time,progress){
  const food=item.spec.code==='food';
  const strength=beat.pose==='stacked' ? 1-T.MathUtils.smoothstep(progress,.12,.72) :
    T.MathUtils.smoothstep(progress,.12,.54);
  steam.visible=steamingBeat(item.spec,beat) && strength>.001;
  if(!steam.visible)return;
  if(food){
    const cut=grip.localToWorld(steam.position.set(0,size.y*.44,0));
    stage.worldToLocal(cut);
    steam.scale.setScalar(.44);
  }else{
    const model=item.model || item.o;
    const tier=beat.pose==='spaced' && node.name==='蒸し箱の上段' ? node :
      model.getObjectByName('蒸し箱の下段') || model;
    stage.worldToLocal(tier.localToWorld(steam.position.set(0,.14,0)));
    steam.scale.setScalar(1);
  }
  steam.material.uniforms.steamTime.value=time;
  steam.material.uniforms.warmth.value=strength;
}

export function makeAccessories(group){
  function mesh(geo,color,parent,metal=0){
    const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.84,metalness:metal}));
    parent.add(m);return m;
  }
  const brush=new T.Group();group.add(brush);
  const barrel=mesh(new T.CylinderGeometry(.009,.012,.207,12),0xb58950,brush);barrel.position.y=.155;
  const binding=mesh(new T.CylinderGeometry(.013,.012,.031,14),0x534735,brush);binding.position.y=.057;
  const bristles=mesh(new T.LatheGeometry([[.001,0],[.006,.012],[.010,.023],[.011,.043]].map(([x,y])=>new T.Vector2(x,y)),12),0x352e24,brush);
  bristles.rotation.z=-.07;
  const inkMark=mesh(new T.SphereGeometry(.5,12,6),0x514b3a,group);inkMark.geometry.scale(1,.006,1);
  const cord=mesh(new T.TorusGeometry(1,.048,7,42),0x9c7652,group);cord.geometry.rotateX(Math.PI/2);
  const stream=mesh(new T.CylinderGeometry(.009,.005,.25,9),0xab9975,group);stream.geometry.translate(0,-.125,0);
  return {brush,inkMark,cord,stream};
}
