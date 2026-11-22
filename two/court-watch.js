import * as T from './vendor/three.module.min.js';
import { COURT, COURT_BRAZIERS } from './retreat-layout.js';
import { watchPose } from './court-patrol.js';
import { kyoClock } from './kyo-layout.js';
import { terrainHeight,groundHeight,wrapDelta } from './terrain.js';
import { sculpture } from './pilgrimage-pigment.js';
import { sculptHead,brushWash } from './scroll-sculpt.js';
import { silkMaterial, SilkPanels } from './kosode.js';

const pi=Math.PI,tau=2*pi,{sin,cos}=Math;
function mesh(g,mat,parent){
  const m=new T.Mesh(g,mat);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
}
const pigment=()=>brushWash(new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.9}),.18);
function guard(index){
  const frog=index===1,skin=frog?'#b9ac84':'#dfc8a7',ink='#3e3f36',bronze='#af9567',sash=frog?'#87704e':'#9d6249';
  const root=new T.Group(),torso=new T.Group(),head=new T.Group(),arm=new T.Group(),feet=[],mat=pigment();
  root.name=frog?'蛙の衛士':'兎の衛士';root.add(torso);torso.add(head,arm);
  head.position.set(0,1.54,.041);sculptHead(head,frog?'frog':'rabbit','wander');
  const silk=new SilkPanels(),trim=sculpture(),hat=sculpture();
  const field=frog?'#6e7761':'#667f87',hem='#e0ceb0',hakama=frog?'#6b6062':'#596270';
  // A round standing collar, loose jacket, gathered side vents and divided
  // trousers. Each individual trouser leg has radiating enameled ink folds.
  for(const side of [-1,1]){
    const trouser=(u,v)=>{
      const a=tau*u,r=.094+.080*sin(pi*v*.91)+.057*v,pleat=1+.092*cos(6*a+v);
      return [side*(.154+.039*(1-v))+r*sin(a)*pleat,.17+.63*v+.023*cos(4*a)*(1-v),
        .01+r*.91*cos(a)*pleat];
    };
    silk.cut(14,32,trouser,4,hakama,(u,v)=>[u,.1+.8*v]);
    silk.cut(2,32,(u,v)=>trouser(u,.015+.044*v),4,'#99907a');
  }
  function coat(u,v,lift=0){
    const a=(u-.5)*tau,r=.284+.077*cos(v*pi*1.38)+.046*sin(2*pi*v)+.026*cos(6*a)*(1-v);
    return [(r+lift)*sin(a),.64+.78*v+.066*sin(a)*sin(a)*(1-v)**3,
      (r*.79+lift)*cos(a)+.024*v+.020*cos(7*a+.44*v)*(1-v)];
  }
  silk.cut(24,48,coat,4,field);
  silk.cut(3,48,(u,v)=>coat(u,.013+.035*v,.008),4,hem);
  const drawCloth=(s,points,widths,tint)=>s.stroke(tint,points.map(([u,v])=>coat(u,v,.008)),widths,11);
  // Broken paired lozenges are dyed into the jacket's skirt. They follow
  // its three-dimensional gathers, narrowing toward the tied waist.
  for(let k=0;k<16;k++)for(let row=0;row<2;row++){
    const u=(k+(row?.5:0))/16,v=.115+row*.165;
    drawCloth(trim,[[u-.018,v+.068],[u,v],[u+.019,v+.068]],[.002,.0042,.002],frog?'#829178':'#8c9ea0');
    drawCloth(trim,[[u-.018,v+.080],[u,v+.142],[u+.019,v+.080]],[.0015,.0034,.0015],frog?'#849481':'#8a9a9c');
  }
  // Linen neckband, frog-fastened cuffs and the narrow woven waist cord.
  for(const [height,band,tint] of [[.53,.13,sash],[.545,.018,hem],[.982,.018,hem]])
    silk.cut(3,48,(u,v)=>coat(u,height+v*band,.012),4,tint);
  for(const side of [-1,1]){
    const studX=side*.146,studY=1.31;
    for(let k=0;k<7;k++){
      const a=k*tau/7;
      trim.ball('#dfd4ba',studX+.023*sin(a),studY+.020*cos(a),.242,
        .013,.016,.012,0,0,-a);
    }
    trim.ball(sash,studX,studY,.257,.010,.010,.008);
    for(let k=0;k<2;k++){
      const x=studX+(k-.5)*.014;
      trim.stroke(hem,[[x,1.304,.249],[x-.018*side,1.272,.250],[x+.016*side,1.243,.239]],
        [.006,.007,.002],7);
    }
    trim.stroke(sash,[[side*.12,1.105,.286],[side*.15,1.001,.303],[side*.197,.88,.279]],[.021,.015,.006],9);
    for(let j=0;j<3;j++)trim.stroke('#445452',[[side*(.13+j*.064),.707,.25],[side*(.15+j*.057),.814,.203],
      [side*(.13+j*.049),.94,.159]],[.003,.007,.002],8);
  }
  function sleeve(parent,side,mobile) {
    const tube=new SilkPanels(),detail=sculpture();
    const hand=mobile?[.076,-.14,.235]:[-.225,.94,.14];
    const start=mobile?[0,0,0]:[side*.228,1.325,.0];
    const end=mobile?[.050,-.140,.205]:[side*.331,.97,.114];
    function cloth(u,v){
      const a=tau*u,w=.153+.025*sin(v*pi)-.028*v;
      return [start[0]+(end[0]-start[0])*v+side*.061*sin(pi*v)+w*sin(a),
        start[1]+(end[1]-start[1])*v + w*.50*cos(a)-.157*v*(1-cos(a))*.5,
        start[2]+(end[2]-start[2])*v + w*.64*cos(a)];
    }
    tube.cut(13,28,cloth,4,field);tube.cut(2,28,(u,v)=>cloth(u,.926+.060*v),4,hem);
    const cuff=cloth(.54,.956);
    detail.ball(sash,cuff[0]+side*.02,cuff[1]+.014,cuff[2],.033,.020,.023);
    for(const t of [-1,1])detail.stroke(hem,[cuff,[cuff[0]+side*.026,cuff[1]-.031,cuff[2]+t*.021],
      [cuff[0]+side*.011,cuff[1]-.065,cuff[2]+t*.047]],[.005,.006,.002],7);
    for(const j of [-1,0,1])detail.stroke(skin,[[hand[0]+j*.024,hand[1]+.036,hand[2]-.04],
      [hand[0]+j*.030,hand[1]-.020,hand[2]+.032],[hand[0]+j*.028,hand[1]-.033,hand[2]+.050]],
      [.027,.018,.006],8);
    detail.ball(skin,...hand,.071,.064,.076);
    mesh(tube.finish(),silkMaterial(),parent);mesh(detail.finish(),mat,parent);
  }
  arm.position.set(.268,1.29,.028);sleeve(arm,1,true);sleeve(torso,-1,false);
  // Bound pine taper carried in the grasp. Lowering the right shoulder
  // brings its burning tip over the firewood before the brazier catches.
  const taper=sculpture(),shaft=[.071,-.199,.177],tip=[.082,.407,.671];
  taper.stroke('#a27346',[shaft,[.073,.05,.381],tip],[.027,.035,.049],13);
  for(let j=0;j<5;j++){
    const x=.082+.030*cos(j*1.7),y=.37+.034*(j%3),z=.636+.024*sin(j*4.2);
    taper.stroke('#6e5140',[[.076,.23,.524],[x,y,z],[x,y+.045,z+.035]],[.026,.033,.019],7);
  }
  for(const f of [.69,.75,.81])taper.ball('#c2a66d',shaft[0]+.009*f,shaft[1]+.606*f,shaft[2]+.494*f,.050,.028,.050,-.59);
  mesh(taper.finish(),mat,arm);
  // Folded lacquered eboshi, pinched behind the crown, leave the eyes and
  // long hare ears exposed. Hand-sewn side seams meet at the back.
  const capShape=new T.LatheGeometry([[.01,0],[.19,.014],[.195,.084],[.152,.195],[.10,.31],[.07,.403],[.02,.422]]
    .map(([r,y])=>new T.Vector2(r,y)),23);
  hat.add(capShape,'#42423c',0,.13,-.10,.92,1,.81,-.35);
  hat.stroke('#6d6a57',[[.152,.18,-.107],[.112,.34,-.138],[.068,.459,-.193],[.024,.516,-.220]],
    [.008,.009,.006,.002],10);
  for(const side of [-1,1])hat.stroke('#796958',[[side*.156,.195,-.035],[side*.196,.075,-.011],
    [side*.154,-.074,.05],[side*.075,-.103,.092]],[.012,.007,.006,.006],11);
  mesh(hat.finish(),mat,head);
  // A closed watch tablet nestles in the sash, with lacquered edge and cord.
  trim.box('#8b7354',-.286,.971,-.033,.072,.497,.094,0,0,-.16);
  trim.box(bronze,-.246,1.19,-.030,.085,.032,.10,0,0,-.16);
  mesh(trim.finish(),mat,torso);mesh(silk.finish(),silkMaterial(),torso);
  for(const side of [-1,1]){
    const leg=new T.Group();root.add(leg);leg.position.x=.18*side;
    const g=sculpture();g.ball('#66533f',0,.075,.073,.107,.054,.19);
    g.ball(hem,0,.125,.024,.087,.078,.130);
    for(const s of [-1,1])g.stroke('#917854',[[s*.093,.101,.094],[s*.04,.166,.084],[0,.14,.151]],[.015,.018,.008],7);
    mesh(g.finish(),mat,leg);feet.push(leg);
  }
  return {root,torso,arm,head,feet,tip};
}

function woodBaskets(p,f){
  const iron='#5b5b50',ashes='#625445';
  const g=sculpture();
  // A pierced iron kagari basket supported on splayed legs. Firelight can
  // pass between each bent stave and reveal the stacked charred pine.
  for(let i=0;i<11;i++){
    const a=i*tau/11,c=cos(a),s=sin(a);
    g.stroke(iron,[[.17*c,1.10,.17*s],[.263*c,1.16,.263*s],[.48*c,1.59,.48*s]],
      [.021,.028,.020],9);
  }
  for(const [y,r] of [[1.13,.23],[1.35,.375],[1.56,.48]]){
    g.add(new T.TorusGeometry(r,.024,6,32),iron,0,y,0,1,1,1,pi/2);
  }
  for(let i=0;i<3;i++){
    const a=i*tau/3+.27;
    g.stroke(iron,[[.55*cos(a),.04,.55*sin(a)],[.39*cos(a),.39,.39*sin(a)],[.09*cos(a),1.13,.09*sin(a)]],
      [.041,.032,.036],9);
  }
  for(let i=0;i<9;i++){
    const a=i*2.4,l=.28+.16*sin(i+.4);
    g.stroke(i%2?ashes:'#79654c',[[-l*cos(a),1.26+i*.021,-l*sin(a)],[.02,1.33+i*.019,0],
      [l*cos(a),1.36+i*.022,l*sin(a)]],[.061,.065,.046],8);
  }
  p.shapes.courtBrazier=g.finish();
  for(const [x,z] of COURT_BRAZIERS){
    f.put('rock',x,.022,z,.78,.10,.76,'#999482',p.stone);
    f.put('courtBrazier',x,.08,z,1,1,1,'#fff',p.stems);
  }
}

// Three curling, notched ribbons share a single draw. Both rim and core have
// volume when the camera circles the ironwork, with a softened ash-colour tip.
function fireGeometry(){
  const xyz=[],uv=[],tri=[];
  for(let j=0;j<5;j++){
    const a=j*tau/5,b=xyz.length/3,dx=cos(a),dz=sin(a);
    for(let k=0;k<=9;k++)for(let edge=0;edge<2;edge++){
      const v=k/9,w=(.18+.08*(j%2))*(Math.sin(pi*(v*.83+.17))**.72)*(1-v*.81),
        o=(j? .12:0)+.105*sin(6*v+j)*v;
      xyz.push(dx*(edge-.5)*2*w-dz*o,(.69+.137*(j%3))*v,dz*(edge-.5)*2*w+dx*o);
      uv.push(edge,v);
      if(k<9&&edge===0){const n=b+2*k;tri.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(tri);return geo;
}
function flame(parent,geometry,seed){
  const mat=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,
    uniforms:{clock:{value:0},seed:{value:seed}},vertexShader:`
      uniform float clock,seed;varying vec2 v;
      void main(){v=uv;vec3 q=position;float t=clock+seed;
      q.x+=uv.y*uv.y*(.09*sin(4.8*t+uv.y*7.)+.05*sin(7.9*t+uv.y*5.));
      q.z+=uv.y*uv.y*.075*sin(5.7*t-uv.y*5.);q.y*=.9+.1*sin(6.*t+position.x*7.);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,
    fragmentShader:`varying vec2 v;uniform float clock,seed;
      void main(){float u=abs(v.x*2.-1.);float flick=.10*sin(clock*7.+seed+v.y*10.);
      float heat=1.-smoothstep(.10,1.,u*.63+v.y*.86+flick);float alpha=(1.-smoothstep(.44,1.,u))*(1.-smoothstep(.68,1.,v.y))*.90;
      vec3 c=mix(vec3(.94,.21,.058),vec3(1.,.81,.35),heat);
      gl_FragColor=vec4(c,alpha);
      #include <colorspace_fragment>
      }`});
  const m=new T.Mesh(geometry,mat);parent.add(m);m.renderOrder=5;return m;
}
function sandGlow(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const g=c.getContext('2d'),r=g.createRadialGradient(64,64,1,64,64,64);
  r.addColorStop(0,'rgba(255,205,126,.92)');r.addColorStop(.23,'rgba(252,171,83,.70)');r.addColorStop(.60,'rgba(221,112,56,.23)');r.addColorStop(1,'rgba(200,104,41,0)');
  g.fillStyle=r;g.fillRect(0,0,128,128);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return map;
}
export function dressCourtWatch(scene,p,f){
  woodBaskets(p,f);
  const root=new T.Group();root.name='京の評定所の夜回り';scene.add(root);
  const base=terrainHeight(COURT.x,COURT.z);root.position.set(COURT.x,base,COURT.z);
  const geometry=fireGeometry(),glowMap=sandGlow(),circle=new T.PlaneGeometry(1,1);
  const guards=[guard(0),guard(1)],poses=[{},{}],tipPoint=new T.Vector3();
  for(const [i,g] of guards.entries()){
    root.add(g.root);g.fire=flame(g.arm,geometry,4+i);g.fire.position.fromArray(g.tip);
  }
  const fires=COURT_BRAZIERS.map(([x,z],i)=>{
    const fire=flame(root,geometry,i*2);fire.position.set(x,1.48,z);
    const glow=new T.Mesh(circle,new T.MeshBasicMaterial({map:glowMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    glow.position.set(x,.109,z);glow.rotation.x=-pi/2;glow.scale.set(6.8,6.8,1);root.add(glow);
    return {x,z,fire,glow};
  });
  // Keep the lighting program stable across the night. Each pair of fires
  // shares one local light, selecting the nearest lit hearth on that side.
  const lights=guards.map(()=>{const l=new T.PointLight(0xffac67,0,8,2);root.add(l);return l;});
  return (time,player)=>{
    const dx=wrapDelta(COURT.x-player.x),dz=wrapDelta(COURT.z-player.z);
    root.visible=dx*dx+dz*dz<107**2;if(!root.visible)return;
    root.position.set(player.x+dx,base,player.z+dz);
    const watchTime=kyoClock(time,player);
    for(const [i,g] of guards.entries()){
      const q=watchPose(watchTime,i,poses[i]),stride=sin(time*5.23+i)*q.walk;
      const floor=groundHeight(COURT.x+q.x,COURT.z+q.z,base+1.09)-base;
      g.root.position.set(q.x,floor,q.z);g.root.rotation.y=q.yaw;
      g.torso.position.y=.018*Math.abs(stride)+.006*cos(time*2.3+i);
      g.torso.rotation.x=.092*q.reach;g.head.rotation.set(.07*q.reach+.018*sin(time*1.9),.087*sin(time*.66+i),0);
      g.arm.rotation.x=.61*q.reach+.045*stride;
      g.feet.forEach((leg,k)=>{const step=(k?1:-1)*stride;leg.position.z=.136*step;leg.position.y=.055*Math.max(0,step);});
      g.fire.visible=q.taper>.012;g.fire.scale.setScalar(.38*q.taper);g.fire.material.uniforms.clock.value=time;
      const lit=[q.front,q.inner],light=lights[i];
      let nearest=Infinity;light.intensity=0;
      if(q.taper>.01){
        // Follow the taper into the archive so the guard's face, the rolls
        // and the timber actually catch its light as the watch passes by.
        g.fire.getWorldPosition(tipPoint);
        nearest=(tipPoint.x-player.x)**2+(tipPoint.z-player.z)**2;
        light.position.copy(tipPoint).sub(root.position);
        light.intensity=7.8*q.taper*(.94+.06*sin(time*9+i));
      }
      for(let j=0;j<2;j++){
        const fire=fires[2*i+j],a=lit[j],flick=.91+.08*sin(8.2*time+i+2*j)+.045*cos(11.8*time+j);
        fire.fire.visible=fire.glow.visible=a>.004;
        fire.fire.scale.set(1.37*a,1.43*a*flick,1.37*a);fire.fire.material.uniforms.clock.value=time;
        fire.glow.material.opacity=.48*a*flick;
        const d=(dx+fire.x)**2+(dz+fire.z)**2;
        if(a>.01&&d<nearest){nearest=d;light.position.set(fire.x,1.98,fire.z);light.intensity=24*a*flick;}
      }
    }
  };
}
