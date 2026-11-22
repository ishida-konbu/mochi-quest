import { grindingRill,inkWellVapour } from './suzuri-rill.js';
import { surface } from './pilgrim-roofcraft.js';
import * as T from './vendor/three.module.min.js';
import { rinseDipperAt,rinsingPalms } from './bath-gestures.js';
import { surface as washSurface } from './village-bath-figures.js';
import { suzuriWashTimber } from './suzuri-washhouse.js';
import { sculpture,brushStroke } from './pilgrimage-pigment.js';
import { RINSING_TUB,SUZURI_LEDGE,suzuriStations } from './kyo-bath-layout.js';
import { RETREATS } from './retreat-layout.js';
import { waterSurfaceAt,wrapDelta } from './terrain.js';

const {PI,sin,cos,abs}=Math,tau=2*PI;

// The soaking ledge is a pair of cuts through the same slate. The raised
// side is a low, polished back with a hollow for the spine and polished ends.
export function suzuriSeatStone(){
  const s=sculpture(),b=SUZURI_LEDGE;
  const slab=(x,z,w,d,h)=>{
    const rim=(u,t)=>{
      const a=tau*u,c=cos(a),v=sin(a),r=1-.047*t**4;
      const y=-.76+(h+.76)*t;
      return [x+r*w*.5*Math.sign(c)*abs(c)**.34,y,z+r*d*.5*Math.sign(v)*abs(v)**.34];
    };
    surface(s,'#fff',10,60,(q,t)=>rim(1-q,t),(u,t)=>[t>.88?'#849285':t>.80?'#6e7b72':'#5a6967',.91+.072*t+.033*cos(23*u)]);
    surface(s,'#74817a',6,58,(q,v)=>{const [a,y,c]=rim(q,1);
      return [x+(a-x)*v,y-.022*(1-v)**2,z+(c-z)*v];});
  };
  slab(b.u+b.w*.5+.19,b.v,.42,b.d-.18,b.tread);
  slab(b.u-.125,b.v,b.w+.25,b.d,b.top);
  function wall(q,v,back=0){
    const t=q*2-1,lobe=1-t*t;
    const summit=.26+.13*lobe+.115*Math.exp(-(((abs(t)-.64)/.21)**2));
    const x=-4.87+.09*lobe+.17*sin(PI*v*.93)-.14*v*v*lobe-.12*abs(t)**4;
    return [x-back,b.top-.13+(summit-b.top+.13)*v,b.v+t*1.48];
  }
  surface(s,'#fff',16,47,(q,v)=>wall(1-q,v),(q,v)=>[v>.88?'#828b7f':v>.64?'#687570':'#596765',
    .92+.056*sin(PI*q)+.030*sin(16*q+5*v)]);
  surface(s,'#515f5e',7,36,(q,v)=>wall(q,v,.22));
  surface(s,'#838c80',5,40,(q,t)=>wall(1-q,1,t*.22));
  for(const q of [0,1])surface(s,'#5c6964',9,4,(t,v)=>wall(q,v,t*.22));
  for(let j=0;j<5;j++){
    const wave=Array.from({length:25},(_,i)=>{const t=i/24,q=.04+.92*t,v=.19+.054*j+.024*cos(8*t+j);
      const [x,y,z]=wall(q,v);return [x+.007,y,z];});
    s.stroke(j%2?'#728078':'#53615e',wave,wave.map((_,i)=>.001+.009*sin(i*PI/24)),25);
  }
  return s.finish();
}

function ladle(){
  const s=sculpture(),n=15;
  const rows=[[.005,0],[.091,.004],[.109,.013],[.116,.032],[.138,.147],[.141,.156],
    [.138,.164],[.127,.164],[.123,.158],[.103,.041],[.096,.030],[.004,.030]];
  const tones=['#b89a70','#c8a87c','#d0b38b','#baa078','#c7ad83'];
  for(let j=0;j<n;j++){
    s.add(washSurface(4,rows.length-1,(u,v)=>{
      const a=-tau*(j+.014+.972*u)/n,[r,y]=rows[Math.round(v*(rows.length-1))];
      return [r*cos(a),y,r*sin(a)];
    }),tones[j%5]);
  }
  for(const [y,r] of [[.040,.119],[.133,.138]]){
    for(let k=0;k<2;k++)s.add(new T.TorusGeometry(r,.0035,6,38),'#777b60',0,y+.005*k,0,1,1,1,PI/2);
    s.box('#93845d',r,.001+y+.004,.012,.009,.015,.024,0,.12);
  }
  // The paddle shaft is a solid oval, widening towards the last finger.
  // Its flat tang crosses the wall of the dipper and is locked by a peg.
  const stain=new T.Color('#a58a62'),pale=new T.Color('#d6be98');
  s.add(washSurface(24,22,(u,t)=>{
    const a=-u*tau,w=.026+.019*t+.008*sin(PI*t)**3,h=.017+.006*sin(PI*t);
    return [.010*t+w*cos(a),.102+.101*t+.011*sin(PI*t)+h*sin(a),.090+.55*t];
  },(u,t)=>stain.clone().lerp(pale,.36+.28*sin(17*u+.53*t)**2+.12*t)),'#fff');
  s.add(new T.SphereGeometry(1,12,8),'#ccaf80',.010,.203,.64,.044,.017,.017);
  s.box('#8c7453',0,.118,.147,.062,.024,.055,-.19);
  s.post('#796a4d',0,.133,.152,.006,.013,.006);
  return s.finish();
}
export function createSuzuriRinsing(scene){
  const site=RETREATS.find(r=>r.shape==='suzuri'),stations=suzuriStations(site).filter(q=>q.action==='rinse');
  const group=new T.Group();group.name='花京の掛け湯';group.visible=false;group.rotation.y=site.yaw;
  const level=waterSurfaceAt(site.x,site.z);
  let vessels=[],fall,drops,holder,activeVessel,phase,blend=0,seconds=0;
  const clock={value:0},floatOffset=RINSING_TUB.water-.011-rinseDipperAt(0).y;
  function build(){
    const geo=ladle(),wood=suzuriWashTimber();
    const liquid=new T.MeshPhysicalMaterial({color:'#c6d8ca',clearcoat:.55,roughness:.18,
      transparent:true,opacity:.73,depthWrite:false,side:T.DoubleSide});
    const water=new T.CircleGeometry(.119,22);water.rotateX(-PI/2);
    vessels=stations.map(station=>{
      const head=new T.Mesh(geo,wood),surface=new T.Mesh(water,liquid);
      head.name='汲み柄杓';head.castShadow=head.receiveShadow=true;head.frustumCulled=false;surface.position.y=.125;
      const traces=[0,1].map(()=>{
        const ink=new T.MeshBasicMaterial({color:'#d5dfce',transparent:true,opacity:.4,depthWrite:false});
        const m=new T.Mesh(new T.TorusGeometry(1,.024,5,40),ink);m.rotation.x=-PI/2;
        m.visible=false;group.add(m);return m;
      });
      const vessel={station,head,surface,traces,planned:new T.Vector3()};
      // The game updates the world before the skinned mochi. Sample again
      // at draw time so a turning handle stays in its actual mitt this frame.
      head.onBeforeRender=()=>{if(vessel===activeVessel)alignHeld();};
      head.add(surface);group.add(head);return vessel;
    });
    // Model the stream in the direction of gravity, independently of the
    // turning ladle, so its last drop actually reaches the bather's shoulder.
    const stream=brushStroke([[0,0,0],[.044,-.112,.036],[.083,-.32,.071],[.102,-.60,.103]],
      [.030,.024,.017,.010],20,9);
    fall=new T.Mesh(stream,liquid);group.add(fall);fall.visible=false;
    drops=new T.InstancedMesh(new T.SphereGeometry(.022,7,6),liquid,11);
    drops.instanceMatrix.setUsage(T.DynamicDrawUsage);drops.frustumCulled=false;group.add(drops);drops.visible=false;
    group.add(grindingRill(clock),inkWellVapour(clock));
    scene.add(group);
  }
  const localLip=new T.Vector3(),palm=new T.Vector3(),handle=new T.Vector3(),dummy=new T.Object3D();
  function alignHeld(){
    const {head,planned}=activeVessel;
    const sample=rinsingPalms.get(holder);
    if(sample && blend>.001){
      handle.set(.008,.172,.45).applyQuaternion(head.quaternion);
      group.worldToLocal(palm.copy(sample)).sub(handle);
      head.position.lerpVectors(planned,palm,blend);
      head.updateWorldMatrix(true,true);
    }
    if(phase.pour<.025)return;
    localLip.set(.071,.142,.074).applyQuaternion(head.quaternion).add(head.position);
    fall.visible=drops.visible=true;fall.position.copy(localLip);
    fall.scale.setScalar(phase.pour);fall.updateWorldMatrix(true,false);
    for(let i=0;i<drops.count;i++){
      const t=(seconds*2.52+i*.227)%1,angle=i*2.40,spread=.056+.081*t;
      dummy.position.set(localLip.x+.10+cos(angle)*spread*t,localLip.y-.60*phase.pour+.08*sin(t*PI)-t*t*.28,
        localLip.z+.10+sin(angle)*spread*t);
      dummy.scale.setScalar((1-t*.87)*phase.pour);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate=true;
  }
  return (time,player)=>{
    const dx=wrapDelta(site.x-player.x),dz=wrapDelta(site.z-player.z);
    if(dx*dx+dz*dz>70**2){group.visible=false;return;}
    if(!vessels.length)build();
    group.visible=true;group.position.set(player.x+dx,level,player.z+dz);
    const pose=player.bathPose;
    activeVessel=null;holder=player;seconds=time;fall.visible=drops.visible=false;
    for(const vessel of vessels){
      const {station,head,surface,traces,planned}=vessel,washing=pose?.action==='rinse' && pose.id===station.id;
      const t=washing?station.duration-player.activityTime:0,q=rinseDipperAt(t,Boolean(player.buffs?.full));
      // The empty dipper floats with 11 mm of draft in this pail. Transfer
      // the height back to the shoulder path as the hand takes its weight.
      const draft=floatOffset*(1-q.hold);
      planned.set(station.u+q.u,q.y+draft,q.v);head.position.copy(planned);head.rotation.set(q.pitch,-.51,q.roll,'YXZ');
      surface.visible=q.wet>.027;surface.scale.setScalar(.94*q.wet);
      // The shaft enters near the left side of the pail. Two displaced
      // fronts expand out from the scoop and fade before they reach its rim.
      for(const [j,m] of traces.entries()){
        const wave=(t-.61-j*.12)/.70;
        m.visible=wave>0 && wave<1;
        if(m.visible){
          m.position.set(station.u-.16,RINSING_TUB.water+.004,-3.282);
          m.scale.setScalar(.051+.222*wave);m.material.opacity=.43*(1-wave);
        }
      }
      if(!washing)continue;
      activeVessel=vessel;phase=q;blend=q.hold*(pose.settle??0);
      alignHeld();
    }
  };
}
