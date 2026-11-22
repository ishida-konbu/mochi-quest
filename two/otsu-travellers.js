import * as T from './vendor/three.module.min.js';
import { otsuParts } from './otsu-beasts.js';
import { horsePose, HORSE_SCALE } from './traveller-positions.js';
import { terrainHeight, wrapDelta } from './terrain.js';

// The ox in the shafts and the open-road horse share the same metre-scale
// hides as the illustrated menagerie; each retains its own four-beat gait.
export function harnessBeast(parent,type,scale,z=0){
  const root=new T.Group(),horse=type==='horse';
  root.name=horse?'都大路の白馬':'車を牽く牛';root.position.z=z;root.scale.setScalar(scale);parent.add(root);
  const parts=otsuParts(type),joints=new Map();
  for(const p of parts){
    const mesh=new T.Mesh(p.geometry,p.material);mesh.position.fromArray(p.pivot);
    mesh.name=p.name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);joints.set(p.name,mesh);
  }
  const legs=[];
  for(const side of [-1,1])for(const fore of [-1,1]){
    const joint=joints.get('leg'+side+','+fore);
    legs.push({joint,hip:joint.position.clone(),angle:(side===1?Math.PI:0)+(fore===1?Math.PI*.54:0)});
  }
  const inverse=new T.Matrix4(),sole=new T.Vector3(),up=new T.Vector3();
  return {root,pose(time,speed,phase,road){
    const head=joints.get('head'),stride=horse?.38:.24;
    head.rotation.x=speed*.065*Math.cos(phase*2)+(1-speed)*(.14+.115*Math.sin(time*.85));
    head.rotation.y=.083*Math.sin(time*.66);head.rotation.z=.021*Math.sin(time*1.07);
    if(horse){const tail=joints.get('tail');tail.rotation.z=.17*Math.sin(time*1.7)+.08*Math.sin(time*2.73);tail.rotation.x=-.27-.10*Math.cos(phase)*speed;}
    if(road){
      root.updateWorldMatrix(true,false);
      inverse.copy(root.matrixWorld).invert();up.setFromMatrixColumn(inverse,1);
    }
    for(const {joint,hip,angle} of legs){
      const step=phase+angle; joint.rotation.x=stride*Math.sin(step)*speed;
      const lift=.055*speed*Math.max(0,-Math.cos(step));
      joint.position.copy(hip);joint.position.y+=lift;
      if(road){
        // The centre of the split hoof comes from the lowest ring of the ox
        // model. Keep a loaded foot planted while the other lifts and swings.
        sole.set(0,-.995*hip.y,.101).applyQuaternion(joint.quaternion)
          .add(joint.position).applyMatrix4(root.matrixWorld);
        joint.position.addScaledVector(up,road(sole.x,sole.z)+lift*scale-sole.y);
      }
    }
  }};
}

export function capitalHorse(scene){
  let mounted;
  return (time,player)=>{
    const q=horsePose(time),dx=wrapDelta(q.x-player.x),dz=wrapDelta(q.z-player.z);
    if(dx*dx+dz*dz>120**2){if(mounted)mounted.root.visible=false;return;}
    mounted??=harnessBeast(scene,'horse',HORSE_SCALE);
    const {root,pose}=mounted,y=terrainHeight(q.x,q.z);
    root.visible=true;root.position.set(player.x+dx,y,player.z+dz);
    root.rotation.order='YXZ';root.rotation.y=q.yaw;
    root.rotation.x=-Math.atan2(terrainHeight(q.x+Math.sin(q.yaw),q.z+Math.cos(q.yaw))-y,1);
    pose(time,Number(q.moving),q.travelled*2.49);
  };
}
