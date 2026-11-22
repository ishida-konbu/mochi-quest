import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { houseCandles, houseFrontLamps } from './lamp-layout.js';
import { kyoNight, kyoClock, KYO_DAY_SECONDS } from './kyo-layout.js';
import { terrainHeight, wrapDelta } from './terrain.js';

const TAU=2*Math.PI;
const lathe=(profile,sides=20)=>new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),sides);

// The open drip pan, the blackened wick and the flared shoulders of a
// Japanese candle stay legible against pale shoji even in full daylight.
function candleStand(){
  const s=sculpture(),bronze='#655344',edge='#b29263';
  s.add(lathe([[.01,0],[.198,0],[.215,.028],[.207,.055],[.137,.083],[.101,.105],
    [.078,.154],[.049,.166],[.042,.52],[.066,.543],[.085,.556],[.085,.584],[.05,.602],
    [.046,.66],[.103,.689],[.191,.714],[.204,.747],[.191,.751],[.118,.726],[.039,.716]]),bronze);
  for(const [r,y] of [[.188,.054],[.077,.565],[.196,.739]])
    s.add(new T.TorusGeometry(r,.009,4,20),edge,0,y,0,1,1,1,Math.PI/2);
  s.add(lathe([[.001,.712],[.047,.712],[.051,.74],[.054,.848],[.066,.951],[.068,.980],
    [.061,.992],[.046,.987],[.035,.979],[.013,.977]],16),'#eee1b5');
  s.post('#44372a',.003,.999,0,.010,.049,.010);
  return s.finish();
}

function andonFrame(){
  const s=sculpture(), wood='#554638',rim='#967650';
  s.box(wood,0,.136,0,.66,.106,.56);
  for(const x of [-.274,.274]) for(const z of [-.224,.224]){
    s.box(wood,x,.601,z,.063,1.20,.06);
    s.box(rim,x,.207,z,.076,.041,.071);
  }
  for(const y of [.265,.61,1.083]){
    for(const z of [-.223,.223])s.box(y===.61?rim:wood,0,y,z,.586,y===.61?.021:.049,.035);
    for(const x of [-.274,.274])s.box(wood,x,y,0,.034,y===.61?.021:.049,.466);
  }
  s.box(wood,0,1.151,0,.643,.058,.533);
  s.box(rim,0,1.189,0,.53,.029,.43);
  const handle=[[-.185,1.196,0],[-.178,1.274,0],[-.115,1.332,0],[.089,1.338,0],[.17,1.284,0],[.184,1.194,0]];
  s.stroke('#665646',handle,[.012,.015,.015,.015,.014,.012],18);
  return s.finish();
}

// A pool of yellow light diffuses through the fibre, leaving the printed
// reed and the little red seal legible when the lantern is lit.
function paperMaterial(stencil){
  const c=document.createElement('canvas');c.width=96;c.height=128;
  const g=c.getContext('2d'),wash=g.createRadialGradient(45,81,4,48,75,81);
  wash.addColorStop(0,'#fff0c4');wash.addColorStop(.36,'#f4dbab');wash.addColorStop(1,'#c6ac81');
  g.fillStyle=wash;g.fillRect(0,0,96,128);
  for(let i=0;i<160;i++){
    const x=(i*71)%97,y=(i*91)%131;
    g.strokeStyle=i%3?'rgba(91,68,42,.065)':'rgba(255,249,217,.47)';
    g.lineWidth=.58;g.beginPath();g.moveTo(x,y);g.lineTo(x+1.4,y+4+i%5);g.stroke();
  }
  if(stencil){
    g.strokeStyle='#7f755d';g.lineWidth=1.35;g.lineCap='round';
    for(const [x,y,lean] of [[27,48,12],[23,59,-9],[33,58,27]]){
      g.beginPath();g.moveTo(27,119);g.quadraticCurveTo(x,y+22,x+lean,y);g.stroke();
      for(let j=0;j<4;j++){
        const bx=x+lean+j*1.15,by=y-j*3.5;
        g.beginPath();g.moveTo(bx-3.5,by+2);g.lineTo(bx,by);g.lineTo(bx+4,by+.4);g.stroke();
      }
    }
    g.fillStyle='#a6573e';g.fillRect(72,99,8,10);
    g.fillStyle='#e6c59b';g.fillRect(74,101,1,5);g.fillRect(77,103,1,4);
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshLambertMaterial({map,emissiveMap:map,emissive:'#ffbd78',emissiveIntensity:.08});
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      #ifdef USE_INSTANCING_COLOR
        totalEmissiveRadiance*=vColor.rgb;
      #endif`);
  };
  material.userData.range=690;
  return material;
}

const vertex=`
  attribute vec4 lamp; attribute vec2 hours;
  varying vec2 glyph; varying vec4 lightInk;
  uniform float clock,night,watchTime;
  void main(){
    glyph=uv*2.-1.;
    float kind=lamp.x, size=lamp.y,seed=lamp.z;
    vec4 eye=modelViewMatrix*vec4(position,1.);
    float metres=max(0.,-eye.z);
    float flutter=.92+.048*sin(clock*4.9+seed)+.029*sin(clock*8.1+seed*.61);
    float strength=kind<.5?(.55+.45*night):night;
    if(kind>1.5)strength*=smoothstep(hours.x,hours.x+1.5,watchTime)*(1.-smoothstep(hours.y-8.,hours.y+2.,watchTime));
    strength*=flutter*(1.-smoothstep(565.,700.,metres));
    #ifdef WASH
      lightInk=vec4(kind,seed,metres,strength);
    #else
      // Covered lights clear the paper skin by its actual radius. Depth
      // testing still hides lamps behind roofs, folding screens and ridges.
      if(kind>.5 && kind<1.5)eye.z+=lamp.w;
      float width=kind<.5?size:max(size,metres*.0065);
      if(kind<.5)strength*=1.-smoothstep(38.,66.,metres);
      if(kind>1.5)strength*=smoothstep(84.,160.,metres);
      eye.xy+=glyph*width;
      lightInk=vec4(kind,seed,metres,strength);
    #endif
    gl_Position=projectionMatrix*eye;
  }`;
const fragment=`
  varying vec2 glyph; varying vec4 lightInk;uniform float clock;
  void main(){
    float r=length(glyph),kind=lightInk.x,t=clock+lightInk.y;
    vec3 tint;float a;
    #ifdef WASH
      float pool=max(0.,1.-r*r);
      a=pool*pool*(kind<.5?.185:.26);
      tint=mix(vec3(.72,.20,.036),vec3(1.,.58,.19),pool*pool);
    #else
      float halo=max(0.,1.-r);halo=halo*halo*halo;
      if(kind<.5){
        // The base is pinned to the wick. Only the thin nib moves in air.
        float v=clamp(glyph.y/.49,0.,1.);
        float curve=v*v*(.040*sin(5.2*t+v*3.)+.026*sin(8.7*t)+.016);
        float width=.115*pow(max(0.,sin(3.14159*pow(v,.76))),.84);
        float sd=width-abs(glyph.x-curve),aa=max(.009,fwidth(sd)*.7);
        float body=smoothstep(-aa,aa,sd)*smoothstep(-.009,.026,glyph.y)*(1.-smoothstep(.45,.50,glyph.y));
        float heart=body*(1.-smoothstep(.02,.12,abs(glyph.x)+v*.075));
        a=body+.14*halo;
        tint=mix(vec3(1.,.34,.055),vec3(1.,.90,.52),heart);
      } else {
        // The unresolved paper lantern keeps a small honey-coloured core;
        // close in, the crest and bindings on the physical shade take over.
        float distant=smoothstep(25.,115.,lightInk.z);
        float point=exp(-r*r*27.)*distant;
        a=halo*(kind>1.5?.84:.35)+point*.82;
        tint=mix(vec3(1.,.34,.065),vec3(1.,.82,.44),point);
      }
    #endif
    a*=lightInk.w;if(a<.003)discard;
    gl_FragColor=vec4(tint,min(1.,a));
    #include <colorspace_fragment>
  }`;

// Four verts per light. The map only uploads when the town is built. Per-frame
// uniforms also reconstruct the correct evening after a save or a time jump.
function makeLayer(sources,wash,material){
  const xyz=[],uv=[],lamps=[],hours=[],indices=[];
  for(const s of sources){
    if(wash && !s.pool)continue;
    const first=xyz.length/3;
    for(const [u,v] of [[0,0],[0,1],[1,1],[1,0]]){
      let {x,y,z}=s;
      if(wash){
        x+=(u*2-1)*s.pool;z+=(v*2-1)*s.pool;
        y=s.ground?terrainHeight(x,z)+.135:s.floor+.026;
      }
      xyz.push(x,y,z);uv.push(u,v);lamps.push(s.kind,s.size,s.phase,s.cover);
      hours.push(s.ignition||0,s.dawn||0);
    }
    indices.push(first,first+1,first+2,first,first+2,first+3);
  }
  if(!xyz.length)return;
  const g=new T.BufferGeometry();
  for(const [name,values,count] of [['position',xyz,3],['uv',uv,2],['lamp',lamps,4],['hours',hours,2]])
    g.setAttribute(name,new T.Float32BufferAttribute(values,count));
  g.setIndex(indices);g.computeBoundingSphere();g.boundingSphere.radius+=4;
  const mesh=new T.Mesh(g,material);mesh.name=wash?'灯に染まる板敷と石畳':'洛中の灯芯と灯影';
  mesh.userData.range=wash?490:705;mesh.renderOrder=wash?3:6;
  return mesh;
}

export function createLampCollection(p){
  p.shapes.candleStand=candleStand();p.shapes.andonFrame=andonFrame();
  const paper=paperMaterial(true),shoji=paperMaterial(false),sources=[];
  const uniforms={clock:{value:0},watchTime:{value:0},night:{value:0}};
  function add(x,y,z,kind,size,floor,pool,cover=0,ground=false){
    const s={x,y,z,kind,size,floor,pool,cover,ground,phase:(sources.length*2.39996)%TAU};
    sources.push(s);return s;
  }
  function put(shape,x,y,z,sx,sy,sz,tint,yaw=0,mat=p.stems){
    p.part(shape,x,y,z,sx,sy,sz,tint,yaw,0,0,mat,true,true);
  }
  function candle(x,y,z,scale=1){
    put('candleStand',x,y,z,scale,scale,scale,'#fff');
    add(x,y+scale*1.018,z,0,.52*scale,y,1.12*scale);
  }
  function covered(x,y,z,cover,floor,ground=true){
    add(x,y,z,1,cover*2.55,floor,ground?2.4:1.95,cover,ground);
  }
  function andon(x,y,z,yaw,scale){
    put('andonFrame',x,y,z,scale,scale,scale,'#fff',yaw);
    put('box',x,y+scale*.676,z,.527*scale,.835*scale,.432*scale,'#fff',yaw,paper);
    covered(x,y+.655*scale,z,.33*scale,y);
  }
  function stoneLantern(x,y,z,yaw=0,scale=1){
    const part=(shape,dx,h,dz,sx,sy,sz,tint,mat=p.stone)=>
      put(shape,x+scale*(dx*Math.cos(yaw)+dz*Math.sin(yaw)),y+h*scale,
        z+scale*(dz*Math.cos(yaw)-dx*Math.sin(yaw)),sx*scale,sy*scale,sz*scale,tint,yaw,mat);
    part('rock',0,.17,0,.73,.27,.65,'#848879');part('shaft',0,.26,0,.44,1.48,.44,'#8c9284');
    part('box',0,1.98,0,.58,.51,.52,'#fff',shoji);
    for(const dx of [-.31,.31])for(const dz of [-.28,.28])
      part('box',dx,1.99,dz,.09,.64,.095,'#697266');
    part('kasa',0,2.30,0,.81,.56,.77,'#879183');part('finial',0,2.86,0,.19,.34,.19,'#73796b');
    covered(x,y+1.98*scale,z,.39*scale,y);
  }
  function house(b){
    const at=(u,v)=>[b.x+u*b.cos+v*b.sin,b.z-u*b.sin+v*b.cos];
    for(const q of houseCandles(b)){
      const [x,z]=at(q.u,q.v);candle(x,b.y+q.y,z,q.scale);
    }
    for(const q of houseFrontLamps(b)){
      const [x,z]=at(q.u,q.v),y=q.plinth?b.y+q.plinth:terrainHeight(x,z);
      if(q.stone)stoneLantern(x,y,z,b.yaw,q.scale);
      else andon(x,y,z,b.yaw,q.scale);
    }
  }
  function hearth(x,y,z,ignition,dawn){
    Object.assign(add(x,y,z,2,1.42,0,0),{ignition,dawn});
  }
  function finish(scene,land){
    const cells=new Map();
    for(const s of sources){
      const key=Math.floor(s.x/72)+','+Math.floor(s.z/72);
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(s);
    }
    for(const wash of [true,false]){
      const material=new T.ShaderMaterial({uniforms,defines:wash?{WASH:1}:{},vertexShader:vertex,fragmentShader:fragment,
        transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
      for(const group of cells.values()){
        const layer=makeLayer(group,wash,material);if(layer)land.add(layer);
      }
    }
    // Two nearby wicks cast light onto moving robes and neighbouring timber.
    // Room height matters: a lamp on another gallery must not win by XZ alone.
    const lights=Array.from({length:2},()=>{
      const l=new T.PointLight(0xffbb7a,0,6.5,2);scene.add(l);return l;
    });
    return (time,player)=>{
      const night=kyoNight(time,player),clock=kyoClock(time,player);
      uniforms.clock.value=time;uniforms.night.value=night;
      uniforms.watchTime.value=((clock%KYO_DAY_SECONDS)+KYO_DAY_SECONDS)%KYO_DAY_SECONDS;
      paper.emissiveIntensity=.02+1.13*night;shoji.emissiveIntensity=.02+.83*night;
      const px=player.x,pz=player.z,eye=player.y+1.0;
      let best=null,second=null,d0=Infinity,d1=Infinity;
      const cx=Math.floor(px/72),cz=Math.floor(pz/72);
      for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const s of cells.get((cx+dx)+','+(cz+dz))||[]){
        if(s.kind===2 || (s.kind===1 && night<.015))continue;
        const d=(s.x-px)**2+(s.y-eye)**2+(s.z-pz)**2;
        if(d>85 || d>=d1)continue;
        if(d<d0){second=best;d1=d0;best=s;d0=d;}else{second=s;d1=d;}
      }
      for(let i=0;i<2;i++){
        const s=i?second:best,l=lights[i];if(!s){l.intensity=0;continue;}
        l.position.set(px+wrapDelta(s.x-px),s.y,pz+wrapDelta(s.z-pz));
        const strength=s.kind===0?s.size*(3.2+9*night):night*10;
        l.intensity=strength*(.94+.06*Math.sin(5.1*time+s.phase))*Math.max(0,1-(i?d1:d0)/85);
      }
    };
  }
  return {shoji,uniforms,candle,andon,covered,stoneLantern,house,hearth,finish};
}
