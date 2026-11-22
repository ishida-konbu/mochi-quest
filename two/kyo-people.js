import { costumeDistance } from './costume-distance.js';
import { districtPoint, DISTRICTS } from './geography.js';
import * as THREE from './vendor/three.module.min.js';
import { batchActorParts } from './actors.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { townPortrait, paintedSilk } from './emaki-costume.js';
import { ancientClothing, townBody, townHeadwear, TOWNSFOLK } from './heian-dress.js';
import { kyoNight } from './kyo-layout.js';
import { dressedRiceFace } from './mochi-model.js';
import { roadSurfaceHeight, wrapDelta } from './terrain.js';

const TAU = 2 * Math.PI;
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
function instances(parent,geo,mat,n,name) {
  const m=new THREE.InstancedMesh(geo,mat,n);m.name=name;
  m.frustumCulled=false;m.castShadow=m.receiveShadow=true;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(m);return m;
}

export function createStreetCrowd(scene) {
  const crowd=new THREE.Group(); crowd.name='京の辻をゆく餅たち';scene.add(crowd);
  const routes=lanes.map(streetWalk), reference=new THREE.Group(), parts=[], walkers=[];
  const shoes=batchActorParts(reference,b=>{
    b.box(0,.059,0,.137,.054,.215,'#79543d');
    for(const z of [-.061,.054])b.box(0,.023,z,.119,.052,.036,'#6f5039');
    b.ball(0,.101,-.006,.059,.038,.096,'#f4e7cb');
    b.stroke([[-.049,.103,-.025],[0,.135,.058],[.048,.103,-.024]],.009,'#9d5a4b');
  });
  const perKind=19, faces=[],headwear=[],counts=new Uint8Array(TOWNSFOLK.length);
  const distance=costumeDistance(scene,perKind*TOWNSFOLK.length);
  const faceFrame=new THREE.Matrix4().compose(new THREE.Vector3(0,.768,-.011),new THREE.Quaternion(),
    new THREE.Vector3(.423,.352,.347));
  const facePose=new THREE.Matrix4(),look=new THREE.Object3D(),crownPose=new THREE.Matrix4();
  const fromNeck=new THREE.Matrix4().makeTranslation(0,-1.17,0);
  const footwear=instances(crowd,shoes.geometry,shoes.material,TOWNSFOLK.length*perKind*2,'鼻緒と下駄');
  for(let kind=0;kind<TOWNSFOLK.length;kind++){
    const model=batchActorParts(reference,b=>townBody(b,kind));
    const crown=batchActorParts(reference,b=>townHeadwear(b,kind));
    headwear.push(instances(crowd,crown.geometry,scrollPigment(),perKind,'都のかぶりもの'));
    parts.push([
      instances(crowd,model.geometry,scrollPigment(),perKind,TOWNSFOLK[kind]),
      instances(crowd,ancientClothing(kind),paintedSilk(),perKind,'都の装束'),
    ]);
    const face=dressedRiceFace(kind,perKind,townPortrait(kind));
    crowd.add(face);faces.push(face);
    for(let i=0;i<perKind;i++){
      const dye=new THREE.Color().setHSL((kind*.18+i*.21)%1,.12,.91);
      const route=routes[(kind+i)%routes.length];
      walkers.push({kind,dye,costume:kind,route,length:route.getLength(),phase:(kind*.203+i*.371)%1, curfew:i===0?1.2:.10+.86*((i*17+kind*11)%37)/36,
        pace:.65+.24*((kind*1.7+i*.41)%1),scale:.87+.17*((kind*.31+i*.27)%1),direction:i%2?-1:1});
    }
  }
  const dummy=new THREE.Object3D(), at=new THREE.Vector3(), next=new THREE.Vector3();
  return (time,player,camera)=>{
    distance.begin(time,player,camera);
    const dx=wrapDelta(DISTRICTS.kyo.x-player.x),dz=wrapDelta(DISTRICTS.kyo.z-player.z);
    crowd.visible=Math.abs(dx)<210 && Math.abs(dz)<194;
    if(!crowd.visible){distance.end();return;}
    counts.fill(0);footwear.count=0;
    crowd.position.set(player.x+dx-DISTRICTS.kyo.x,0,player.z+dz-DISTRICTS.kyo.z);
    const night=kyoNight(time,player);
    for(const w of walkers){
      if(night>w.curfew)continue;
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
      const gait=time*w.pace*8.8+w.phase*TAU, ripple=Math.sin(gait);
      const y=roadSurfaceHeight(at.x,at.z);
      const bob=.012+Math.abs(ripple)*.033;
      if(!distance.close(w,at.x+crowd.position.x,y+bob,at.z+crowd.position.z,yaw,w.scale))continue;
      const instance=counts[w.kind]++;
      dummy.position.set(at.x,y+bob,at.z);
      const bend=w.kind===3?.081:w.kind===4?.049:w.kind===0?.033:.012;
      dummy.rotation.set(bend+.009*Math.cos(gait*2),yaw,.026*ripple,'YXZ');dummy.scale.setScalar(w.scale);
      dummy.updateMatrix();
      for(const m of parts[w.kind])m.setMatrixAt(instance,dummy.matrix);
      parts[w.kind][1].setColorAt(instance,w.dye);
      // The carrier inclines under his load while the market seller glances
      // from her basket to the next stall. The hat and veil follow the neck.
      const notice=(1-THREE.MathUtils.smoothstep(Math.hypot(dx,dz),.7,3.8));
      const glance=Math.sin(time*.81+w.phase*TAU)*(w.kind===2?.22:.11);
      look.position.set(0,1.17,0);
      look.rotation.set((w.kind===1?.055:w.kind===3?-.085:0)+.019*Math.cos(gait),
        glance+THREE.MathUtils.clamp(Math.atan2(across,ahead),-.7,.7)*notice*.42,.012*ripple,'YXZ');
      look.updateMatrix();
      crownPose.multiplyMatrices(dummy.matrix,look.matrix).multiply(fromNeck);
      headwear[w.kind].setMatrixAt(instance,crownPose);
      faces[w.kind].setMatrixAt(instance,facePose.multiplyMatrices(crownPose,faceFrame));
      for(const side of [-1,1]){
        const across=side*.17*w.scale, along=Math.cos(gait)*side*.164*w.scale;
        dummy.position.set(at.x+Math.cos(yaw)*across+Math.sin(yaw)*along,y+Math.max(0,ripple*side)*.062,
          at.z-Math.sin(yaw)*across+Math.cos(yaw)*along);
        dummy.rotation.set(-.10*ripple*side,yaw,0,'YXZ');dummy.updateMatrix();
        footwear.setMatrixAt(footwear.count++,dummy.matrix);
      }
    }
    for(let k=0;k<parts.length;k++){
      for(const mesh of [...parts[k],headwear[k],faces[k]]){
        mesh.count=counts[k];mesh.visible=mesh.count>0;
        if(mesh.count){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
      }
    }
    distance.end();
    footwear.instanceMatrix.needsUpdate=true;
  };
}
