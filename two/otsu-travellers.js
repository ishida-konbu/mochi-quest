import * as T from './vendor/three.module.min.js';
import { otsuParts } from './otsu-beasts.js';
import { districtPoint } from './geography.js';
import { measureRoute, cartPosition } from './trade-routes.js';
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
    legs.push({joint,height:joint.position.y,angle:(side===1?Math.PI:0)+(fore===1?Math.PI*.54:0)});
  }
  return {root,pose(time,speed,phase){
    const head=joints.get('head'),stride=horse?.38:.24;
    head.rotation.x=speed*.065*Math.cos(phase*2)+(1-speed)*(.14+.115*Math.sin(time*.85));
    head.rotation.y=.083*Math.sin(time*.66);head.rotation.z=.021*Math.sin(time*1.07);
    if(horse){const tail=joints.get('tail');tail.rotation.z=.17*Math.sin(time*1.7)+.08*Math.sin(time*2.73);tail.rotation.x=-.27-.10*Math.cos(phase)*speed;}
    for(const {joint,height,angle} of legs){
      const step=phase+angle; joint.rotation.x=stride*Math.sin(step)*speed;
      joint.position.y=height+.055*speed*Math.max(0,-Math.cos(step));
    }
  }};
}

// A straight, paved stretch between the two gate crossings; the horse turns
// in place at each end while the central lane remains clear for the ox cart.
const horseRoute=measureRoute([[122.3,-352],[122.3,-367],[122.3,-382]].map(([x,z])=>districtPoint('kyo',x,z)));
export function capitalHorse(scene){
  let mounted;
  return (time,player)=>{
    const q=cartPosition(horseRoute,time,.96,14),dx=wrapDelta(q.x-player.x),dz=wrapDelta(q.z-player.z);
    if(dx*dx+dz*dz>120**2){if(mounted)mounted.root.visible=false;return;}
    mounted??=harnessBeast(scene,'horse',1.23);
    const {root,pose}=mounted,y=terrainHeight(q.x,q.z);
    root.visible=true;root.position.set(player.x+dx,y,player.z+dz);
    root.rotation.order='YXZ';root.rotation.y=q.yaw;
    root.rotation.x=-Math.atan2(terrainHeight(q.x+Math.sin(q.yaw),q.z+Math.cos(q.yaw))-y,1);
    pose(time,Number(q.moving),q.travelled*2.49);
  };
}
