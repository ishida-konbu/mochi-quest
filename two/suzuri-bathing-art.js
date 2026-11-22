import * as T from './vendor/three.module.min.js';
import { rinseDipperAt,rinsingPalms } from './bath-gestures.js';
import { sculpture,brushStroke } from './pilgrimage-pigment.js';
import { SUZURI_LEDGE,suzuriStations } from './kyo-bath-layout.js';
import { RETREATS } from './retreat-layout.js';
import { waterSurfaceAt,wrapDelta } from './terrain.js';

const {PI,sin,cos,abs}=Math,tau=2*PI;

// Two submerged steps are cut from the flank of the inkstone. The wall
// behind the bench rises above water as one scalloped shoulder-rest.
export function suzuriSeatStone(){
  const s=sculpture(),b=SUZURI_LEDGE;
  function slab(u,v,w,d,dy){
    const xyz=[],ix=[],color=[],n=64;
    const dyes=['#4d5a5b','#6a7571','#8a9386','#7f8e86','#778a82'];
    for(const [j,[scale,y]] of [[.98,-.53],[1,dy-.09],[1,dy-.025],[.97,dy],[.01,dy]].entries()){
      const tint=new T.Color(dyes[j]);
      for(let i=0;i<n;i++){
        const angle=tau*i/n,c=cos(angle),k=sin(angle);
        xyz.push(u+scale*w*.5*Math.sign(c)*Math.abs(c)**.34,y,v+scale*d*.5*Math.sign(k)*Math.abs(k)**.34);
        color.push(tint.r,tint.g,tint.b);
        const a=j*n+i,q=j*n+(i+1)%n;
        if(j)ix.push(a-n,a,q-n,q-n,a,q);
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(ix);g.computeVertexNormals();s.add(g,'#fff');
  }
  slab(b.u+b.w*.5+.19,b.v,.42,b.d-.18,b.tread);
  slab(b.u,b.v,b.w,b.d,b.top);
  const xyz=[],ix=[],col=[],n=40,steps=12,slate=new T.Color('#5e6e70'),edge=new T.Color('#b0b2a0');
  for(let j=0;j<=steps;j++)for(let i=0;i<=n;i++){
    const t=i/n,h=j/steps,shoulder=Math.pow(Math.max(0,sin(t*PI)),.70);
    const crown=.13+.12*(.5-.5*cos(t*tau*2)),y=-.19+(crown+.19)*shoulder*h;
    const x=-4.935+.160*sin(.91*PI*h)*shoulder;
    xyz.push(x,y,b.v+(t-.5)*2.72);
    const tint=slate.clone().lerp(edge,.16+.55*h**5);col.push(tint.r,tint.g,tint.b);
    const k=j*(n+1)+i;if(i<n && j<steps)ix.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);
  }
  const back=new T.BufferGeometry();back.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  back.setAttribute('color',new T.Float32BufferAttribute(col,3));back.setIndex(ix);back.computeVertexNormals();s.add(back,'#fff');
  // The seated shoulder-rest is a solid, overturned lotus leaf. Its rolled
  // edge and vein channels stand clear of the water, with two little elbow
  // shelves that die back into the original submerged landing.
  const relief=(u,v)=>{
    const a=(u-.5)*1.50*PI,t=v,spread=.23+.73*v;
    const dx=sin(a)*spread,z=b.v+dx;
    const root=v**.55,curled=(.035+.035*cos(7*a))*(1-cos(t*PI));
    return [-4.81+.196*cos(a)*v+.079*v*v+.028*cos(a*9)*v*v,
      -.12+.52*root-.29*abs(a/PI)**1.76*v+curled,z];};
  const leafPos=[],leafColor=[],leafIx=[],nx=54,ny=11;
  const green=new T.Color('#697a75'),silver=new T.Color('#97a394');
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny;
    leafPos.push(...relief(u,v));
    const dye=green.clone().lerp(silver,.14+.56*(j/ny)**7+.11*sin(18*u)**2);
    leafColor.push(dye.r,dye.g,dye.b);
    const k=j*(nx+1)+i;if(i<nx && j<ny)leafIx.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);
  }
  const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute(leafPos,3));
  leaf.setAttribute('color',new T.Float32BufferAttribute(leafColor,3));leaf.setIndex(leafIx);leaf.computeVertexNormals();
  s.add(leaf,'#fff');
  const crest=Array.from({length:42},(_,i)=>relief(i/41,1));
  s.stroke('#939e94',crest,crest.map((_,i)=>.012+.026*sin(PI*i/41)),45);
  for(let j=-3;j<=3;j++){
    const vein=Array.from({length:8},(_,i)=>{const t=.18+.77*i/7,q=relief(.5+.12*j*t**.30,t);q[0]+=.007;return q;});
    s.stroke('#87948a',vein,[.016,.013,.011,.009,.008,.007,.005,.003],11);
  }
  for(const side of [-1,1]){
    const z=b.v+side*.98;
    s.stroke('#717f7b',[[-4.81,-.12,z],[-4.66,.024,z+.047*side],[-4.46,.105,z+.052*side],
      [-4.25,.115,z],[-4.11,.018,z-.022*side]],[.133,.105,.096,.084,.058],20);
  }
  return s.finish();
}

function ladle(){
  const s=sculpture(),profile=[[.002,0],[.092,.009],[.116,.024],[.138,.138],[.140,.158],
    [.132,.163],[.122,.155],[.103,.049],[.095,.032],[.003,.031]];
  s.add(new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),28),'#bf9c67');
  for(let i=0;i<14;i++){
    const a=tau*i/14;
    s.stroke(i%3?'#a18354':'#d2b783',[[.108*sin(a),.025,.108*cos(a)],[.122*sin(a),.080,.122*cos(a)],
      [.138*sin(a),.152,.138*cos(a)]],[.002,.003,.002],4);
  }
  for(const y of [.048,.132]){
    const radius=.115+.15*y;
    s.add(new T.TorusGeometry(radius,.007,5,28),'#7d8069',0,y,0,1,1,1,PI/2);
  }
  // The short, flat hinoki handle keys into the stave below the rim.
  s.stroke('#ba9b6d',[[0,.101,.103],[0,.132,.245],[.008,.173,.445],[.014,.197,.63]],
    [.030,.032,.039,.044],13);
  s.box('#8a795d',0,.121,.154,.069,.028,.055,-.19);
  return s.finish();
}
export function createSuzuriRinsing(scene){
  const site=RETREATS.find(r=>r.shape==='suzuri'),stations=suzuriStations(site).filter(q=>q.action==='rinse');
  const group=new T.Group();group.name='花京の掛け湯';group.visible=false;group.rotation.y=site.yaw;
  const level=waterSurfaceAt(site.x,site.z);
  let vessels=[],fall,drops;
  function build(){
    const geo=ladle(),wood=new T.MeshStandardMaterial({vertexColors:true,roughness:.67,side:T.DoubleSide});
    const liquid=new T.MeshPhysicalMaterial({color:'#c6d8ca',clearcoat:.55,roughness:.18,
      transparent:true,opacity:.73,depthWrite:false,side:T.DoubleSide});
    const water=new T.CircleGeometry(.119,22);water.rotateX(-PI/2);
    vessels=stations.map(station=>{
      const head=new T.Mesh(geo,wood),surface=new T.Mesh(water,liquid);
      head.name='汲み柄杓';head.castShadow=head.receiveShadow=true;surface.position.y=.125;
      head.add(surface);group.add(head);return {station,head,surface};
    });
    // Model the stream in the direction of gravity, independently of the
    // turning ladle, so its last drop actually reaches the bather's shoulder.
    const stream=brushStroke([[0,0,0],[.044,-.112,.036],[.083,-.32,.071],[.102,-.60,.103]],
      [.030,.024,.017,.010],20,9);
    fall=new T.Mesh(stream,liquid);group.add(fall);fall.visible=false;
    drops=new T.InstancedMesh(new T.SphereGeometry(.022,7,6),liquid,11);
    drops.instanceMatrix.setUsage(T.DynamicDrawUsage);drops.frustumCulled=false;group.add(drops);drops.visible=false;
    scene.add(group);
  }
  const localLip=new T.Vector3(),palm=new T.Vector3(),handle=new T.Vector3(),dummy=new T.Object3D();
  return (time,player)=>{
    const dx=wrapDelta(site.x-player.x),dz=wrapDelta(site.z-player.z);
    if(dx*dx+dz*dz>70**2){group.visible=false;return;}
    if(!vessels.length)build();
    group.visible=true;group.position.set(player.x+dx,level,player.z+dz);
    const pose=player.bathPose;
    fall.visible=drops.visible=false;
    for(const {station,head,surface} of vessels){
      const washing=pose?.action==='rinse' && pose.id===station.id;
      const t=washing?station.duration-player.activityTime:0;
      const q=rinseDipperAt(t,Boolean(player.buffs?.full));
      head.position.set(station.u+q.u,q.y,q.v);head.rotation.set(q.pitch,-.51,q.roll,'YXZ');
      const sample=washing && rinsingPalms.get(player);
      if(sample && q.hold>.001){
        handle.set(.008,.172,.45).applyQuaternion(head.quaternion);
        group.worldToLocal(palm.copy(sample)).sub(handle);
        head.position.lerp(palm,q.hold*pose.settle);
      }
      surface.visible=q.wet>.027;surface.scale.setScalar(.94*q.wet);
      if(q.pour<.025)continue;
      localLip.set(.071,.142,.074).applyQuaternion(head.quaternion).add(head.position);
      fall.visible=drops.visible=true;fall.position.copy(localLip);
      fall.scale.set(q.pour,q.pour,q.pour);
      for(let i=0;i<drops.count;i++){
        const phase=(time*2.52+i*.227)%1,angle=i*2.40;
        const spread=.056+.081*phase;
        dummy.position.set(localLip.x+.10+cos(angle)*spread*phase,localLip.y-.60*q.pour+.08*sin(phase*PI)-phase*phase*.28,
          localLip.z+.10+sin(angle)*spread*phase);
        dummy.scale.setScalar((1-phase*.87)*q.pour);dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
      }
      drops.instanceMatrix.needsUpdate=true;
    }
  };
}
