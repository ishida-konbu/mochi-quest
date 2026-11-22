import * as T from './vendor/three.module.min.js';
import { DISTRICTS } from './geography.js';
import { kyoClock } from './kyo-layout.js';
import { terrainHeight,wrapDelta } from './terrain.js';
import { STREET_BEATS,streetWatchPose } from './street-watch-layout.js';
import { brazierGeometry,createWatchman,moveWatchman,createWatchFire,burnWatchFire } from './court-watch.js';

export function createStreetWatch(scene,painter){
  const ward=new T.Group();ward.name='洛中の辻番';scene.add(ward);
  painter.shapes.courtBrazier=brazierGeometry();
  const up=new T.Vector3(0,0,1),normal=new T.Vector3();
  const watches=STREET_BEATS.map((beat,i)=>{
    const group=new T.Group();group.name=beat.name;ward.add(group);
    const man=createWatchman(i);group.add(man.root);
    const fires=beat.hearths.map(({x,z},j)=>{
      const y=terrainHeight(x,z),heading=i*1.73+j*2.15;
      painter.part('rock',x,y+.06,z,.70,.14,.68,'#9d9784',heading,0,0,painter.stone,true,true);
      painter.part('courtBrazier',x,y+.10,z,1,1,1,'#ffffff',heading,0,0,painter.stems,true,true);
      painter.lamps.hearth(x,y+1.99,z,beat.ignition[j],beat.dawn);
      const hearth=createWatchFire(group,x,y+.10,z,y+.16,heading);
      // The pool lies across both the road and its graded verge.
      normal.set(terrainHeight(x-.5,z)-terrainHeight(x+.5,z),1,
        terrainHeight(x,z-.5)-terrainHeight(x,z+.5)).normalize();
      hearth.glow.quaternion.setFromUnitVectors(up,normal);
      return hearth;
    });
    return {man,beat,fires,pose:{}};
  });
  // A single local light follows the nearest bright source. Other baskets
  // keep their painted pool of light among the paving stones all night.
  const light=new T.PointLight(0xffac67,0,9,2),tip=new T.Vector3();
  ward.add(light);const city=DISTRICTS.kyo;
  return (time,player)=>{
    const dx=wrapDelta(city.x-player.x),dz=wrapDelta(city.z-player.z);
    ward.visible=Math.abs(dx)<244 && Math.abs(dz)<226;
    if(!ward.visible)return;
    ward.position.set(player.x+dx-city.x,0,player.z+dz-city.z);
    const px=city.x-dx,pz=city.z-dz,clock=kyoClock(time,player);
    let brightest=0;light.intensity=0;
    function illuminate(x,y,z,intensity){
      const d=(x-px)**2+(z-pz)**2;
      if(d>18**2)return;
      const apparent=intensity/(4+d);
      if(apparent>brightest){
        brightest=apparent;light.position.set(x,y,z);light.intensity=intensity;
      }
    }
    for(let i=0;i<watches.length;i++){
      const {man,beat,fires,pose}=watches[i];
      streetWatchPose(clock,beat,pose);
      const distance=(pose.x-px)**2+(pose.z-pz)**2;
      man.root.visible=distance<122**2;
      if(man.root.visible){
        const floor=terrainHeight(pose.x,pose.z)+.074;
        moveWatchman(man,pose,time,i,floor);
        if(pose.taper>.01 && distance<19**2){
          man.fire.getWorldPosition(tip).sub(ward.position);
          illuminate(tip.x,tip.y,tip.z,7.8*pose.taper*(.94+.06*Math.sin(time*9+i)));
        }
      }
      for(let j=0;j<fires.length;j++){
        const fire=fires[j],strength=burnWatchFire(fire,j?pose.second:pose.first,time,2*i+j);
        if(strength>.01)illuminate(fire.x,fire.fire.position.y+.50,fire.z,24*strength);
      }
    }
  };
}
