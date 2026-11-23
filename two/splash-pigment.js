import * as T from './vendor/three.module.min.js';
import { waterWave, waterWaveGLSL } from './shoreline.js';
import { BOUND, waterDepth, waterSurfaceAt, wrapDelta } from './terrain.js';

const tau=Math.PI*2;
const clamp=T.MathUtils.clamp;
const waterLight=`
  varying vec3 worldAt;
  uniform float dusk;
  vec3 wetPigment(vec3 n,float aeration){
    vec3 view=normalize(cameraPosition-worldAt);
    n=faceforward(normalize(n),-view,normalize(n));
    float fresnel=.09+.80*pow(1.-max(0.,dot(n,view)),2.4);
    vec3 sky=reflect(-view,n);
    float sheen=smoothstep(-.20,.70,sky.y);
    float glint=pow(max(0.,dot(sky,normalize(vec3(-.40,.79,.43)))),22.);
    vec3 pool=mix(vec3(.088,.210,.201),vec3(.27,.46,.40),sheen);
    vec3 colour=mix(pool,vec3(.82,.90,.81),.18*sheen+.72*fresnel);
    colour=mix(colour,vec3(.91,.94,.84),aeration)+vec3(.72,.66,.50)*glint;
    return colour*mix(vec3(1.),vec3(.60,.72,.81),dusk);
  }
`;

function batch(scene,name,source,capacity,fields,vertexShader,fragmentShader,uniforms){
  const geometry=new T.InstancedBufferGeometry();
  geometry.index=source.index;
  for(const [key,value] of Object.entries(source.attributes))geometry.setAttribute(key,value);
  const attributes={};
  for(const [key,size] of Object.entries(fields)){
    const attr=new T.InstancedBufferAttribute(new Float32Array(capacity*size),size);
    attr.setUsage(T.DynamicDrawUsage);
    geometry.setAttribute(key,attr);attributes[key]=attr;
  }
  const material=new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,
    depthWrite:false,side:T.DoubleSide});
  material.forceSinglePass=true;
  const mesh=new T.Mesh(geometry,material);
  mesh.name=name;mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=5;
  scene.add(mesh);
  return {attributes,finish(count){
    mesh.visible=!!count;geometry.instanceCount=count;
    if(count)for(const attr of Object.values(attributes)){
      attr.clearUpdateRanges();attr.addUpdateRange(0,count*attr.itemSize);attr.needsUpdate=true;
    }
  }};
}

export function createSplashPigment(scene){
  const dusk={value:0},clock={value:0},uniforms={dusk,clock};
  const crown=batch(scene,'水冠と波の返し',new T.PlaneGeometry(1,1,84,7),8,
    {origin:3,shape:4,stroke:4,swells:1},`
    ${waterWaveGLSL}
    uniform float clock;attribute float swells;
    attribute vec3 origin;attribute vec4 shape,stroke;
    varying vec3 worldAt;varying vec2 paper;varying float peak,fade,angle;
    void main(){
      float age=shape.x,span=shape.y,height=shape.z,seed=shape.w;
      angle=stroke.x+(uv.x-.5)*stroke.y;
      float fringe=stroke.y>6.28?.95:pow(max(.001,sin(3.14159*uv.x)),.63);
      float a=angle+seed, fold=sin(5.*a+.6*sin(3.*a))+.48*sin(11.*a+1.3);
      peak=pow(.5+.5*cos(9.*a+1.4*sin(3.*a)+.43*sin(17.*a)),4.6);
      float rise=(1.-exp(-age*12.))*(1.-age)*height*fringe;
      float blade=uv.y, wall=pow(blade,.8);
      float radius=span*(.54+.77*pow(age,.79)+.25*blade+.085*fold*wall+.10*peak*wall);
      float lift=rise*(.32+.10*fold+.51*peak)*wall;
      vec2 dir=vec2(sin(angle),cos(angle));
      worldAt=origin+vec3(dir.x*radius,lift+.008,dir.y*radius);
      worldAt.xz+=age*stroke.zw;
      vec2 q=mod(worldAt.xz+${BOUND.toFixed(1)},${(BOUND*2).toFixed(1)})-${BOUND.toFixed(1)};
      worldAt.y+=swells*waveHeight(q,clock);paper=uv;fade=fringe*(1.-smoothstep(.48,1.,age));
      gl_Position=projectionMatrix*viewMatrix*vec4(worldAt,1.);
    }`,waterLight+`
    varying vec2 paper;varying float peak,fade,angle;
    void main(){
      vec3 n=cross(dFdx(worldAt),dFdy(worldAt));
      float edge=smoothstep(.83,.98,paper.y);
      float filaments=pow(.5+.5*cos(21.*angle+1.7*sin(6.*angle)+paper.y*3.),8.);
      float clear=smoothstep(.25,.92,paper.y)*(1.-peak)*(.45+.55*filaments);
      float ink=smoothstep(.61,.81,paper.y)*(1.-edge)*(.36+.64*peak);
      vec3 col=wetPigment(n,edge*(.46+.40*peak)+.17*filaments);
      col*=1.-.21*ink;
      float alpha=fade*smoothstep(0.,.18,paper.y)*(.59-.28*clear+.26*edge);
      gl_FragColor=vec4(col,alpha);
      #include <colorspace_fragment>
    }`,uniforms);
  // The pointed trailing tip and round nose remain three-dimensional from
  // the low swimming camera as well as a photograph taken from overhead.
  const bead=new T.SphereGeometry(1,8,6),drop=batch(scene,'砕ける水玉',bead,240,
    {start:3,travel:3,dimensions:3},`
    attribute vec3 start,travel,dimensions;
    varying vec3 worldAt,beadNormal;varying float fade;
    void main(){
      vec3 axis=normalize(travel+vec3(.00001,0.,0.));
      vec3 side=normalize(cross(axis,abs(axis.y)>.94?vec3(0.,0.,1.):vec3(0.,1.,0.)));
      vec3 back=cross(axis,side);
      float narrow=.85+.17*position.y, r=dimensions.x;
      worldAt=start+side*position.x*r*narrow+axis*position.y*dimensions.y+back*position.z*r*narrow;
      beadNormal=normalize(side*normal.x+axis*normal.y*r/max(.001,dimensions.y)+back*normal.z);
      fade=dimensions.z;gl_Position=projectionMatrix*viewMatrix*vec4(worldAt,1.);
    }`,waterLight+`
    varying vec3 beadNormal;varying float fade;
    void main(){
      vec3 n=normalize(beadNormal);float rim=1.-abs(dot(normalize(cameraPosition-worldAt),n));
      vec3 c=wetPigment(n,.12+.23*max(n.y,0.));
      gl_FragColor=vec4(c,fade*(.72+.24*rim));
      #include <colorspace_fragment>
    }`,uniforms);
  // For a short distance the stream is still connected. Surface tension
  // necks these curved threads until their tips separate as individual beads.
  const thread=batch(scene,'ちぎれる湯の糸',new T.PlaneGeometry(1,1,6,9),40,
    {root:3,launch:3,flight:3},`
    attribute vec3 root,launch,flight;varying vec3 worldAt,threadNormal;varying float fade;
    void main(){
      float head=flight.x,tail=max(0.,head-.14),a=mix(tail,head,uv.y);
      vec3 axis=normalize(launch+vec3(0.,-9.8*a,0.));
      vec3 side=normalize(cross(axis,abs(axis.z)>.95?vec3(1.,0.,0.):vec3(0.,0.,1.)));
      float turn=uv.x*6.28318,neck=.72+.28*cos(uv.y*8.+head*12.);
      threadNormal=cos(turn)*side+sin(turn)*cross(axis,side);
      worldAt=root+launch*a+vec3(0.,-4.9*a*a,0.)+
        threadNormal*flight.y*neck*(1.-.38*uv.y)*(.40+.60*sin(3.14159*uv.y));
      fade=flight.z;gl_Position=projectionMatrix*viewMatrix*vec4(worldAt,1.);
    }`,waterLight+`
    varying vec3 threadNormal;varying float fade;
    void main(){gl_FragColor=vec4(wetPigment(threadNormal,.10),fade*.74);
      #include <colorspace_fragment>
    }`,uniforms);
  const ripple=batch(scene,'落ち雫の小波',new T.PlaneGeometry(1,1),48,{anchor:3,print:4},`
    attribute vec3 anchor;attribute vec4 print;
    varying vec2 p;varying vec3 worldAt;varying float fade,seed;
    void main(){
      p=uv*2.-1.;worldAt=anchor+vec3(p.x*print.x,0.,p.y*print.x);
      fade=print.y;seed=print.z;gl_Position=projectionMatrix*viewMatrix*vec4(worldAt,1.);
    }`,`
    varying vec2 p;varying float fade,seed;uniform float dusk;
    void main(){
      float a=atan(p.y,p.x),r=length(p)+.026*sin(3.*a+seed)+.013*cos(7.*a-seed);
      float aa=max(.018,fwidth(r)),crest=1.-smoothstep(.026,.026+aa,abs(r-.77));
      float trough=1.-smoothstep(.022,.022+aa,abs(r-.85));
      float breaks=smoothstep(-.80,.31,sin(a*3.+seed)+.60*cos(a*2.+seed));
      vec3 c=mix(vec3(.14,.25,.23),vec3(.83,.87,.77),crest);
      gl_FragColor=vec4(c*(1.-.29*dusk),fade*breaks*max(.65*crest,.38*trough));
      #include <colorspace_fragment>
    }`,uniforms);
  const crowns=Array.from({length:8},()=>({born:-Infinity}));
  const beads=Array.from({length:240},()=>({born:-Infinity}));
  const marks=Array.from({length:48},()=>({born:-Infinity}));
  let cNext=0,bNext=0,rNext=0,seed=13579;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
  function sheet(t,x,y,z,span,height,heading,arc,vx,vz,waves,duration){
    const s=crowns[cNext];cNext=(cNext+1)%crowns.length;
    Object.assign(s,{born:t,x,y,z,span,height,heading,arc,vx,vz,waves,duration,seed:random()*tau});
  }
  function fling(t,x,y,z,vx,vy,vz,r,level,waves,imprint,connected){
    const d=beads[bNext];bNext=(bNext+1)%beads.length;
    Object.assign(d,{born:t,x,y,z,vx,vy,vz,r,level,waves,imprint,connected});
  }
  function waterline(x,z,t,y,waves){return y+(waves?waterWave(x,z,t):0);}
  function footprint(t,x,z,level,waves,r){
    const m=marks[rNext];rNext=(rNext+1)%marks.length;
    Object.assign(m,{born:t,x,z,level,waves,r,seed:random()*tau});
  }
  return {clear(){
    for(const pool of [crowns,beads,marks])for(const q of pool)q.born=-Infinity;
  },hit(t,x,z,level,waves,vx,vz,energy,span,step=0){
    const heading=Math.atan2(vx,vz), y=waterline(x,z,t,level,waves);
    const direction=step?heading+step*1.53:heading;
    const r=span*(step?.39:.97),h=step?.16+energy*.48:.31+energy*1.14;
    const speed=Math.hypot(vx,vz), drift=step?.10:.16;
    sheet(t,x,level,z,r,h,direction,step?2.9:tau,Math.sin(heading)*Math.min(1.5,speed*drift),
      Math.cos(heading)*Math.min(1.5,speed*drift),waves,step?.43:.66+.16*energy);
    const n=Math.round(step?5+energy*7:16+energy*27),phase=random()*tau;
    for(let i=0;i<n;i++){
      const a=step?direction+(random()-.5)*2.55:phase+tau*(i+random()*.67)/n;
      const sin=Math.sin(a),cos=Math.cos(a), outward=(step?.5:.75)+(.45+1.6*energy)*random();
      const radius=r*(.53+.24*random()), vy=.83+(.70+2.8*energy)*random();
      fling(t,x+sin*radius,y+.045,z+cos*radius,sin*outward+clamp(vx*.17,-1.8,1.8),vy,
        cos*outward+clamp(vz*.17,-1.8,1.8),(.018+.028*random())*(.75+.50*energy),level,waves,i%3===0,i%6===0);
    }
  },deflect(t,hit,n,incoming,width,level){
    const flux=clamp(width*3,.26,1),number=Math.round(3+4*flux);
    const reflected=incoming.dot(n);
    for(let i=0;i<number;i++){
      const a=tau*random(),sx=Math.sin(a),sz=Math.cos(a),eject=.7+random()*(1.6+flux*1.1);
      const tangent=sx*n.x+sz*n.z,spread=width*(random()-.5);
      const vx=(sx-tangent*n.x)*eject+n.x*.62+(incoming.x-2*reflected*n.x)*.40;
      const vz=(sz-tangent*n.z)*eject+n.z*.62+(incoming.z-2*reflected*n.z)*.40;
      fling(t,hit.x+n.x*.026+sx*spread,hit.y+.025+.02*random(),hit.z+n.z*.026+sz*spread,
        vx,Math.max(-.45,(.45+1.9*random())*n.y-tangent*n.y*eject),vz,
        .011+(.019+.013*flux)*random()**1.2,level,false,i%3===0,i%3===1);
    }
  },update(p,t){
    dusk.value=p.night?1:0;clock.value=t;
    let n=0;const ca=crown.attributes;
    for(const s of crowns){
      const age=(t-s.born)/s.duration;
      if(!(age>=0 && age<1))continue;
      const x=p.x+wrapDelta(s.x-p.x),z=p.z+wrapDelta(s.z-p.z);
      ca.origin.setXYZ(n,x,s.y+.014,z);ca.swells.setX(n,Number(s.waves));
      ca.shape.setXYZW(n,age,s.span,s.height,s.seed);
      ca.stroke.setXYZW(n,s.heading,s.arc,s.vx,s.vz);n++;
    }
    crown.finish(n);n=0;let threads=0;const da=drop.attributes,ta=thread.attributes;
    for(const d of beads){
      const a=t-d.born;
      if(!(a>=0 && a<1.6))continue;
      const x=p.x+wrapDelta(d.x+d.vx*a-p.x),z=p.z+wrapDelta(d.z+d.vz*a-p.z);
      const y=d.y+(d.vy-4.9*a)*a, vy=d.vy-9.8*a;
      if(vy<0 && y<=waterline(x,z,t,d.level,d.waves)+.008){
        if(d.imprint && Math.abs(waterSurfaceAt(x,z,t,d.level-.25)-d.level)<.14 && waterDepth(x,z,t,d.level-.25)>.025)
          footprint(t,x,z,d.level,d.waves,d.r);
        d.born=-Infinity;continue;
      }
      if(d.connected && a>.012 && a<.24 && threads<40){
        ta.root.setXYZ(threads,x-d.vx*a,d.y,z-d.vz*a);ta.launch.setXYZ(threads,d.vx,d.vy,d.vz);
        ta.flight.setXYZ(threads,a,d.r*.67,1-T.MathUtils.smoothstep(a,.12,.24));threads++;
      }
      const speed=Math.hypot(d.vx,vy,d.vz);
      da.start.setXYZ(n,x,y,z);da.travel.setXYZ(n,d.vx,vy,d.vz);
      da.dimensions.setXYZ(n,d.r,d.r*(1.03+Math.min(2.2,speed*.31)),Math.min(1,.46+a*18));n++;
    }
    drop.finish(n);thread.finish(threads);n=0;const ra=ripple.attributes;
    for(const m of marks){
      const a=t-m.born;if(a<0 || a>.53)continue;
      const x=p.x+wrapDelta(m.x-p.x),z=p.z+wrapDelta(m.z-p.z);
      ra.anchor.setXYZ(n,x,waterline(x,z,t,m.level,m.waves)+.027,z);
      ra.print.setXYZW(n,m.r*1.4+.61*a,(1-a/.53)**1.40,m.seed,0);n++;
    }
    ripple.finish(n);
  }};
}
