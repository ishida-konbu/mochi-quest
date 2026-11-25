import * as T from './vendor/three.module.min.js';
import { createCookingPerformer } from './cooking-performer.js';
import { cookingAtlas } from './cooking-atlases.js';
import { InkForm, surface } from './ryugu-ink.js';
import { staticVolumeAt, terrainContactHeight, waterSurfaceAt } from './terrain.js';
import { forestryCloseup } from './forestry-closeup.js';
import { timberCut } from './homestead-timber-section.js';

const pi = Math.PI, tau = 2*pi;
const clamp = v => Math.max(0,Math.min(1,v));
const ease = v => { const f=clamp(v); return f*f*(3-2*f); };
const lerp = (a,b,f) => a+(b-a)*f;
const blend = (a,b,f) => a.map((v,i)=>lerp(v,b[i],f));
const arc = (a,b,f) => a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*f;

function yawPoint(x,z,yaw,u,v) {
  return [x+u*Math.cos(yaw)+v*Math.sin(yaw), z-u*Math.sin(yaw)+v*Math.cos(yaw)];
}
function pointOnSaw(pos,pitch,yaw,u,y,v) {
  const h=y*Math.cos(pitch)-v*Math.sin(pitch), depth=y*Math.sin(pitch)+v*Math.cos(pitch);
  const [x,z]=yawPoint(pos[0],pos[2],yaw,u,depth);
  return [x,pos[1]+h,z];
}

// Split rattan wraps the grip; the blade's offset set of teeth, neck, peened
// rivet, dark back and rubbed cutting edge share the existing tool atlas.
export function makePullSaw(length) {
  const f=new InkForm({wood:0,end:6,iron:7,cloth:4},4,2);
  const w=(t)=>.05+.052*Math.sin(t*pi*.69);
  const shade=(t,face)=>face>0?(t>.77?'#b9b9a4':'#81847d'):'#6e736b';
  const edge=(u,q,y)=>[-.020+q*w(u),y,-u*length];
  const layers=[0,.76,1], steps=22, v=[], ix=[], uv=[];
  function face(points,tint,tile='iron') {
    const g=surface(points.flat(),[0,1,2,0,2,3],[.08,.04,.90,.06,.91,.90,.09,.88]);
    f.draw(g,[0,0,0],[1,1,1],tint,[0,0,0],tile);g.dispose();
  }
  for (const side of [-1,1]) for(let j=0;j<2;j++) {
    v.length=ix.length=uv.length=0;
    for(let i=0;i<=steps;i++) {
      const t=i/steps;
      for(const q of [layers[j],layers[j+1]]) {
        v.push(...edge(t,q,side*(.0038-.002*q)));uv.push(t,.18+.67*q);
      }
      if(i)ix.push(i*2-2,i*2,i*2-1,i*2-1,i*2,i*2+1);
    }
    const g=surface(v,ix,uv);
    f.draw(g,[0,0,0],[1,1,1],shade(layers[j+1],side),[0,0,0],'iron');g.dispose();
  }
  const teeth=Math.ceil(length/.021);
  for(let i=1;i<teeth;i++) {
    const t=i/teeth,next=(i+1)/teeth;
    const a=edge(t,1,.0018), b=edge(next,1,.0018);
    const tip=[a[0]+.012,(i%2?1:-1)*.0034,a[2]+.002];
    const g=surface([...a,...b,...tip],[0,1,2],[.25,.62,.44,.62,.30,.95]);
    f.draw(g,[0,0,0],[1,1,1],'#b5b4a3',[0,0,0],'iron');g.dispose();
  }
  face([edge(0,0,-.004),edge(1,0,-.004),edge(1,0,.004),edge(0,0,.004)],'#696d62');
  f.stroke([[0,0,-.045],[0,0,.085],[.002,0,.21],[.004,.006,.37],[.006,.013,.49]],
    [.021,.035,.033,.032,.028],'#b09466','wood',18,32);
  for(let i=0;i<17;i++) {
    const z=.09+i*.021, r=.034-.004*i/17;
    const ring=t=>[.003+r*Math.cos(t),.003+r*Math.sin(t),z+.006*t/tau];
    const path=Array.from({length:12},(_,k)=>ring(tau*k/11));
    f.stroke(path,.0034,i%3?'#baa278':'#806849','cloth',6,16);
  }
  f.oval([.003,.023,.042],[.011,.006,.011],'#86795e',[0,0,0],'iron');
  const mat = new T.MeshStandardMaterial({map:cookingAtlas('materials'),vertexColors:true,side:T.DoubleSide,roughness:.74});
  const mesh=new T.Mesh(f.geometry(),mat);
  mesh.scale.x=-1;
  mesh.name='籐巻き柄の枝挽き鋸';mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}

export function planSawing(player,tree,aspect=1,canStand=()=>true,detail=false) {
  if(!tree || !Number.isFinite(tree.ground) || !Number.isFinite(tree.seed) || !Number.isFinite(aspect) || aspect<=0)return null;
  if(!detail && (!player.grounded || player.activity || player.mount || player.vessel ||
      player.skiff || player.inWater || player.h>.12 || player.diveDepth>0))return null;
  const section=timberCut(tree);
  // A bamboo stand is several hollow stems. Keep the detailed stroke on
  // one real culm; clearing and the individual stumps use the whole clump.
  if(!detail && section.culms)return null;
  const stem=section.culms?.[0]??section;
  const cut=detail?{x:0,z:0,y:.42,radius:stem.radius}:section,r=cut.radius;
  const size=player.buffs?.full>0?1.28:1;
  const dx=player.x-cut.x,dz=player.z-cut.z,distance=detail?r+1.78*size:Math.hypot(dx,dz);
  if(!detail && (distance>3.16 || distance<r+.78*size || Math.abs(player.y-terrainContactHeight(player.x,player.z))>.27))return null;
  const yaw=detail?0:Math.atan2(dx,dz),localHeading=detail?pi:player.heading-yaw;
  const floor=detail?()=>0:(x,z)=>terrainContactHeight(...yawPoint(cut.x,cut.z,yaw,x,z))-tree.ground;
  const start=[0,distance], work=[-.19*size,r+1.72*size], span=Math.hypot(work[0],work[1]-distance);
  function clear(u,v,y,pad,height) {
    if(detail)return true;
    const [x,z]=yawPoint(cut.x,cut.z,yaw,u,v);
    return !staticVolumeAt(x,z,tree.ground+y,pad,height) && canStand(x,z,tree.ground+y,pad,height);
  }
  for(let i=0;!detail && i<=12;i++) {
    const [x,z]=blend(start,work,i/12), y=floor(x,z);
    const [wx,wz]=yawPoint(cut.x,cut.z,yaw,x,z);
    if(tree.ground+y-waterSurfaceAt(wx,wz)<.19 || !clear(x,z,y+.035,.77*size,1.53*size) ||
       Math.abs(floor(x-.35,z)-floor(x+.35,z))>.22 || Math.abs(floor(x,z+.32)-floor(x,z-.32))>.22) return null;
  }
  const bladeLength=Math.max(.79,2*r+.44), walking=.65+span/.95;
  const begin=walking+1.0, cutting=3.3, end=begin+cutting, retreat=end+1.0, duration=retreat+walking;
  function sample(t) {
    const time=Math.max(0,Math.min(t,duration)), progress=clamp((time-begin)/cutting);
    const travel=time<walking?ease(time/walking):time>retreat?1-ease((time-retreat)/walking):1;
    const [hx,hz]=blend(start,work,travel), heading=arc(localHeading,pi,travel);
    const strides=Math.max(1,Math.ceil((span+.21*Math.abs(arc(localHeading,pi,1)-localHeading))/.49));
    const stride=Math.min(strides-1,Math.floor(travel*strides));
    const feet=[-1,1].map((side,index)=>{
      const slice=clamp((travel*strides-stride)*2-index), q=(stride+ease(slice))/strides;
      const [x,z]=blend(start,work,q), ang=arc(localHeading,pi,q);
      const [fx,fz]=yawPoint(x,z,ang,side*.29*size,(.06+.066*side*q)*size);
      return [fx,floor(fx,fz)+.10*Math.sin(pi*slice),fz];
    });
    const hy=(feet[0][1]+feet[1][1])/2;
    const engage=ease((time-walking)/.48)*(1-ease((time-end-.52)/.48));
    const flat=ease((time-walking-.48)/.52)*(1-ease((time-end)/.52));
    const stroke=5*progress, phase=stroke%1;
    const cycle=(1-Math.cos(tau*phase))/2;
    // A Japanese pull saw bites on the draw. The return follows the same
    // slot without feeding sideways into untouched wood.
    const feed=(Math.floor(stroke)+ease(Math.min(1,phase*2)))/5;
    const [cx,cz]=yawPoint(hx,hz,heading,-.81*size,.77*size);
    const carry=[cx,hy+.83*size,cz];
    const tool=blend(carry,[lerp(r+.15,-r-.15,feed),.42+.51*(1-flat),r+.09+.30*cycle+(1-flat)*(.15+.39*bladeLength)],engage);
    const pitch=1.18*(1-flat), toolYaw=arc(heading-pi,0,engage);
    // Rattan contacts are fixed in tool space throughout the pull and return.
    const right=pointOnSaw(tool,pitch,toolYaw,.022,.010,.16);
    const held=pointOnSaw(tool,pitch,toolYaw,-.020,.010,.39);
    const [lx,lz]=yawPoint(hx,hz,heading,.75*size,.51*size);
    const left=blend([lx,hy+.72*size,lz],held,engage);
    // The free palm sweeps around the belly to join the heel of the grip.
    left[2]-=.29*size*Math.sin(pi*engage);
    const hands=[right,left];
    return {time,hero:[hx,hy,hz],heading,phase:'saw',feet,hands,
      focus:[0,.42,r],lean:(.22-.08*cycle)*engage,lift:(-.14+.021*cycle)*engage,effort:(.35+.44*cycle)*engage,
      tool,pitch,toolYaw,progress,engage};
  }

  // Fit the entire route and test both diagonals. A steady three-quarter view
  // keeps the work visible throughout the stroke without tracking the blade.
  const extent=Math.max(distance,work[1]), focus=new T.Vector3(0,.84*size,extent*.54);
  function cameraFrame(ratio) {
    const tan=Math.tan(41*pi/360);
    for(const forward of (detail?[-.34]:[-.92,-.66,-.45])) for(const mirror of [1,-1]) for(const tilt of (detail?[.58]:[.34,.53])) {
      const dir=new T.Vector3(mirror,tilt,forward).normalize();
      const right=new T.Vector3(dir.z,0,-dir.x).normalize(), up=dir.clone().cross(right);
      let fit=2.75;
      for (const x of [-.94*size,.94*size]) for(const z of [-r-.18,extent+.62*size]) for(const y of [.04,1.78*size]) {
        const p=new T.Vector3(x,y,z).sub(focus);
        fit=Math.max(fit,p.dot(dir)+Math.abs(p.dot(right))/(ratio*tan*.89),p.dot(dir)+Math.abs(p.dot(up))/(tan*.78));
      }
      const eye=focus.clone().addScaledVector(dir,fit);
      const targets=[[dir.x*(r+.055),.42,dir.z*(r+.055)],
        [work[0],1.10*size,work[1]-.72*size],[-.29*size,.13,work[1]],[0,1.08*size,distance]];
      for(let t=begin;t<=end;t+=.28)targets.push(...sample(t).hands);
      const sight=detail || targets.every(([x,y,z])=>{
        const steps=Math.ceil(Math.hypot(eye.x-x,eye.y-y,eye.z-z)/.12);
        for(let i=1;i<=steps;i++){
          const f=i/steps;
          if(!clear(lerp(x,eye.x,f),lerp(z,eye.z,f),lerp(y,eye.y,f),.035,.07))return false;
        }
        return true;
      });
      if(sight)return {eye,focus};
    }
    return null;
  }
  // Check the entire arm/tool sweep against branches, houses and neighbours.
  // Only the thin working plane inside the selected bole may touch solid wood.
  for(let time=0;!detail && time<=duration;time+=.10) {
    const f=sample(time);
    for(const palm of f.hands) if(!clear(palm[0],palm[2],palm[1]-.035,.045,.07))return null;
    for(let v=.48;v>=-bladeLength;v-=.072) {
      const [x,y,z]=pointOnSaw(f.tool,f.pitch,f.toolYaw,v<0?-.034:0,0,v);
      const cutContact=f.engage>.999 && f.pitch<.004 && v<0 && Math.hypot(x,z)<r+.11;
      if(!cutContact && !clear(x,z,y-.012,.047,.024))return null;
    }
  }
  const lens=cameraFrame(aspect);
  if(!lens)return null;
  return {cut,yaw,bladeLength,duration,sample,lens,cameraFrame};
}

export function createSawingScene(scene,camera,player,tree,canStand) {
  const local=planSawing(player,tree,camera.aspect,canStand);
  const plan=local??planSawing(player,tree,camera.aspect,canStand,true);
  const detail=local?null:forestryCloseup(tree,plan.cut);
  const group=new T.Group();
  group.name='木を挽く配達人';
  group.position.set(plan.cut.x,detail?0:tree.ground,plan.cut.z);group.rotation.y=plan.yaw;
  const saw=makePullSaw(plan.bladeLength);
  const performer=createCookingPerformer(group,player);
  group.add(saw);(detail?.scene??scene).add(group);group.updateMatrixWorld(true);
  const startEye=camera.position.clone(),startAim=camera.quaternion.clone(),startFov=camera.fov;
  let lens=plan.lens,aspect=camera.aspect,disposed=false;
  function update(t) {
    if(disposed)return;
    const frame=plan.sample(t);
    performer.update(frame);detail?.update(frame);
    saw.position.fromArray(frame.tool);
    saw.rotation.order='YXZ';saw.rotation.set(frame.pitch,frame.toolYaw,0,'YXZ');
    if(camera.aspect!==aspect) {
      lens=plan.cameraFrame(camera.aspect)||lens;
      aspect=camera.aspect;
    }
    if(camera.fov!==41){camera.fov=41;camera.updateProjectionMatrix();}
    camera.position.copy(group.localToWorld(lens.eye.clone()));
    camera.lookAt(group.localToWorld(lens.focus.clone()));camera.updateMatrixWorld();
  }
  return {duration:plan.duration,update,scene:detail?.scene,felled:detail?.felled,dispose(){
    if(disposed)return;
    disposed=true;
    detail?.dispose();performer.dispose();group.removeFromParent();saw.geometry.dispose();saw.material.dispose();
    camera.position.copy(startEye);camera.quaternion.copy(startAim);camera.fov=startFov;
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }};
}
