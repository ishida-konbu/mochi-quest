import * as THREE from './vendor/three.module.min.js';
import { districtPoint } from './geography.js';
import { wrapDelta } from './terrain.js';

export const TOWNSFOLK=['壺装束の旅餅','文使いの餅','市女の餅','荷担ぎの餅','薬売りの餅'];
export const WALKERS_PER_KIND=19;
const lanes=[
  [[118,-385],[118,-462],[121,-462],[121,-385]],
  [[119,-408],[162,-408],[162,-425],[119,-425]],
  [[72,-423],[121,-423],[121,-466],[72,-466]],
  [[119,-426],[162,-426],[162,-466],[119,-466]],
  [[72,-407],[122,-407],[122,-423],[72,-423]],
  [[119,-339],[119,-361],[194,-361],[194,-339]],
  [[46,-361],[94,-361],[94,-383],[46,-383]],
  [[194,-405],[219,-405],[219,-465],[194,-465]],
  [[95,-505],[119,-505],[119,-486],[95,-486]],
  [[144,-487],[193,-487],[193,-505],[144,-505]],
];
function streetWalk(coords) {
  // Rounded corners avoid snapping around on the heel of a geta.
  const points=coords.map(([u,v])=>{
    const [x,z]=districtPoint('kyo',u,v);
    return new THREE.Vector3(x,0,z);
  });
  const path=new THREE.CurvePath();
  const bend=points.map((p,i)=>{
    const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
    const rad=Math.min(1.6,.33*p.distanceTo(prev),.33*p.distanceTo(next));
    return [
      p.clone().addScaledVector(prev.clone().sub(p).normalize(),rad),
      p.clone().addScaledVector(next.clone().sub(p).normalize(),rad),
    ];
  });
  points.forEach((p,i)=>{
    path.add(new THREE.QuadraticBezierCurve3(bend[i][0],p,bend[i][1]));
    path.add(new THREE.LineCurve3(bend[i][1],bend[(i+1)%points.length][0]));
  });
  return path;
}
const routes=lanes.map(streetWalk);
export function makeCityWalkers(){
  const walkers=[];
  for(let kind=0;kind<TOWNSFOLK.length;kind++){
    for(let i=0;i<WALKERS_PER_KIND;i++){
      const route=routes[(kind+i)%routes.length];
      walkers.push({kind,costume:kind,route,length:route.getLength(),phase:(kind*.203+i*.371)%1, curfew:i===0?1.2:.10+.86*((i*17+kind*11)%37)/36,
        pace:.65+.24*((kind*1.7+i*.41)%1),scale:.87+.17*((kind*.31+i*.27)%1),direction:i%2?-1:1});
    }
  }
  return walkers;
}

const at=new THREE.Vector3(), next=new THREE.Vector3();
export function cityWalkerPose(w,time,player,out){
  const t=THREE.MathUtils.euclideanModulo(w.phase+w.direction*time*w.pace/w.length,1);
  w.route.getPoint(t,at);
  w.route.getPoint(THREE.MathUtils.euclideanModulo(t+w.direction*.001,1),next);
  const yaw=Math.atan2(next.x-at.x,next.z-at.z),co=Math.cos(yaw),si=Math.sin(yaw);
  // Keep to one side and leave room for a traveller who stops to look into a shop.
  at.x+=co*.37;at.z-=si*.37;
  const dx=wrapDelta(player.x-at.x), dz=wrapDelta(player.z-at.z);
  const ahead=dx*si+dz*co,across=dx*co-dz*si;
  if(Math.abs(ahead)<2.7 && Math.abs(across)<1.35 && (player.h||0)<2){
    w.shoulder??=across>0?-1:1;
    const offset=w.shoulder*(1.50-Math.abs(across))*(1-THREE.MathUtils.smoothstep(Math.abs(ahead),.5,2.7));
    at.x+=co*offset;at.z-=si*offset;
  } else w.shoulder=undefined;
  Object.assign(out,{x:at.x,z:at.z,yaw,dx,dz,across,ahead});
  return out;
}
