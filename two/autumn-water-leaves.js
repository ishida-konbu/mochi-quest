import * as THREE from './vendor/three.module.min.js';
import { BOUND, WATER_Y, mapleStreamZ, riverMouthFlare, seeded, shoreDistance, wrapDelta } from './terrain.js';
import { MOUNTAIN_STREAMS, mountainStreamWaterAt, waterfallSurface } from './mountain-streams.js';
import { MAPLE_BRIDGE } from './maple-crossing.js';
import { waterWave, waterWaveGLSL } from './shoreline.js';
import { autumnLeafMaterial, autumnLeafPigments } from './autumn-leaf-art.js';

const { sin, PI }=Math;
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};

function waterRoute(stream){
  // Begin in the open pool just downstream of the source stones. The upper
  // section is slow enough for the broad faces of individual leaves to read.
  const points=stream.stations.slice(3);
  const fallIndex=stream.lipIndex-3;
  const {lip,toe,fx,fz}=stream.fall;
  points[fallIndex+1]={...toe,nx:fz,nz:-fx,width:Math.min(toe.width*.89,lip.width*1.16)};
  if(stream.id==='maple'){
    // A stone shoulder projects into the outside of the plunge pool's turn.
    for(let i=fallIndex+2;i<=fallIndex+5;i++)points[i]={...points[i],width:points[i].width*.73};
  }
  const mouth=points.at(-1),riverIndex=points.length-1;
  for(let x=mouth.x+1.6;x<410;x+=1.6){
    const z=mapleStreamZ(x),shore=shoreDistance(x,z);
    const slope=(mapleStreamZ(x+.25)-mapleStreamZ(x-.25))*2,normal=Math.hypot(1,slope);
    points.push({x,z,y:WATER_Y,nx:slope/normal,nz:-1/normal,shore,
      width:3.45+1.90*riverMouthFlare(x)});
    if(shore < -16)break;
  }
  let duration=0;
  const segments=points.slice(0,-1).map((a,i)=>{
    const b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,run=Math.hypot(dx,dz),drop=a.y-b.y;
    const fall=i===fallIndex,river=i>=riverIndex;
    const speed=river?1.12+.19*riverMouthFlare(a.x):.47+1.95*Math.min(1,Math.max(0,drop/run));
    const seconds=fall?Math.sqrt(2*drop/9.8):run/speed;
    const start=duration;
    duration+=seconds;
    return {a,b,fall,river,start,end:duration,pitch:Math.atan2(drop,run)};
  });
  return {stream,segments,duration};
}
export const autumnWaterRoutes=MOUNTAIN_STREAMS.filter(s=>s.id==='kaede-spring'||s.id==='maple').map(waterRoute);

// age is measured in seconds along one complete passage, with no live particle
// state to rewind on a camera cut or when returning to the valley.
function sampleChannel(route,age,u,out){
  const {segments,stream}=route;
  let first=0,last=segments.length-1;
  while(first<last){
    const mid=(first+last)>>>1;
    if(age>=segments[mid].end)first=mid+1;else last=mid;
  }
  const {a,b,start,end,fall,river,pitch}=segments[first];
  const t=Math.max(0,Math.min(1,(age-start)/(end-start)));
  out.river=river;
  let shore=10;
  if(fall){
    waterfallSurface(stream,u,t,out);
    const bow=sin(PI*t),{fx,fz,lip,toe,run}=stream.fall;
    out.x+=fx*.16*bow;out.z+=fz*.16*bow;
    out.y+=.039+.029*bow;
    out.pitch=Math.atan2(2*t*(lip.y-toe.y),run);
    out.heading=Math.atan2(-out.nz,out.nx);
  }else{
    // Interpolate the two edges of the same water strip as the painted
    // mesh. This also turns the leaf gently as a channel changes direction.
    if(river){
      // The richest stream of pigment winds from bank to bank, with room
      // for the tips of the rafts and occasional solitary leaves at its hems.
      const x=mix(a.x,b.x,t),w=mix(a.width,b.width,t);
      const ribbon=1.2*sin((x-285)*.145)+.48*sin((x-286)*.31);
      const weight=smooth((x-stream.stations.at(-1).x)/6);
      u=u*(1-.33*weight)-weight*ribbon/w;
      shore=mix(a.shore??10,b.shore,t);
    }
    out.x=mix(a.x+a.nx*a.width*u,b.x+b.nx*b.width*u,t);
    out.z=mix(a.z+a.nz*a.width*u,b.z+b.nz*b.width*u,t);
    out.heading=Math.atan2(-mix(a.nz,b.nz,t),mix(a.nx,b.nx,t));
    const level=mix(a.y,b.y,t);
    // At the confluence the creek and the tidal sheet overlap briefly.
    // The animated tidal displacement is applied after interpolation.
    const creek=river && level<=WATER_Y+.20?mountainStreamWaterAt(out.x,out.z):level;
    const tidal=creek<=WATER_Y && (river || stream.riverPool);
    out.y=tidal?WATER_Y-.16:creek+(level>WATER_Y+.20?.060:.058);
    out.pitch=pitch;
    if(first>0 && segments[first-1].fall){
      const {lip,toe,run}=stream.fall;
      const settle=smooth((age-start)/.49);
      out.pitch=mix(Math.atan2(2*(lip.y-toe.y),run),out.pitch,settle);
      if(tidal)out.y=mix(toe.y+.039,out.y,settle);
    }
  }
  out.shore=shore;
  return out;
}

export function sampleAutumnCurrent(route,age,lane,phase,time,out){
  const u=lane+.092*sin(age*.41+phase)+.066*sin(age*.67+.41*phase);
  sampleChannel(route,age,u,out);
  if(out.river){
    const bridge=smooth((5.1-Math.abs(out.x-MAPLE_BRIDGE.x))/2.5);
    out.z=mix(out.z,MAPLE_BRIDGE.z+(lane<0?1:-1)*(.64+Math.abs(lane)*1.5),bridge);
  }
  out.y=Math.max(out.y,WATER_Y+waterWave(out.x,out.z,time)+.046);
  out.opacity=smooth(age/(1.8+.45*sin(phase)))*(1-smooth((-out.shore-.3)/(8.5+2.5*sin(phase))));
  return out;
}

function driftingRafts(){
  const random=seeded(718063),scatter=seeded(983117),leaves=[];
  for(const route of autumnWaterRoutes){
    function addLeaf(kind,start,offset,rate,lane,size){
      const palette=autumnLeafPigments[kind];
      leaves.push({route,kind,start,offset,rate,lane,size,phase:random()*2*PI,
        spin:(.095+.11*random())*(random()<.5?-1:1),tint:palette[Math.floor(random()*palette.length)]});
      // Overlapping slender rafts fill the broad lower river. The narrow
      // source channels carry fewer, larger silhouettes between the ripples.
      const upper=start===0,count=upper?10:29,span=upper?1.55:2.65;
      for(let i=1;i<count;i++){
        const along=scatter()*2-1,edge=scatter()*2-1,belly=1-along*along;
        const neighborKind=kind==='ginkgo' && scatter()<.28?'maple':kind;
        const colors=autumnLeafPigments[neighborKind];
        const loose=i%7===0;
        const across=lane+.11*sin(along*PI)+edge*((loose?.33:.13)*belly+.04);
        leaves.push({route,kind:neighborKind,start,rate,offset:offset+along*span,
          lane:Math.max(-.72,Math.min(.72,across)),size:size*(.43+.42*scatter()),
          phase:scatter()*2*PI,spin:(.095+.11*scatter())*(scatter()<.5?-1:1),
          tint:colors[Math.floor(scatter()*colors.length)]});
      }
    }
    // The planting fixes the supply of drifting leaves. Changing the length
    // or level of the plunge pool only changes their transit time.
    const groups=route.stream.id==='kaede-spring'?64:36;
    for(let g=0;g<groups;g++){
      const lead=(g+random()*.75)*route.duration/groups;
      const lane=(random()-.5)*1.03,rate=.93+random()*.13;
      const count=2+Math.floor(random()*5);
      const gold=random();
      for(let i=0;i<count;i++){
        const kind=random()<.15+.49*gold?'ginkgo':'maple';
        addLeaf(kind,0,lead+(random()-.5)*2.3,rate,lane+.31*(random()-.5),.20+.14*random());
      }
    }
    if(route.stream.id==='kaede-spring'){
      // Leaves gather beneath the trees around the lower pool. Some travel in
      // long sweeps with a thread of gold on one margin and scattered tips.
      const start=route.segments.find(s=>s.river).start-2;
      const period=route.duration-start,rafts=Math.ceil(period/5.8);
      for(let g=0;g<rafts;g++){
        const lead=(g+.8*random())*period/rafts,rate=.96+random()*.07;
        const lane=(random()-.5)*.88,turn=random()<.5?-1:1;
        const span=1.05+1.55*random(),gold=random()<.12,count=23+Math.floor(random()*21);
        for(let i=0;i<count;i++){
          const along=random()*2-1,belly=1-along*along,edge=random()*2-1;
          const across=.20*turn*sin(PI*(along+.18))+edge*(.05+.135*belly);
          const yellow=gold?.21:edge*turn>.43?.24:.016;
          addLeaf(random()<yellow?'ginkgo':'maple',start,lead+along*span,rate,
            lane+across,.235+.16*random());
        }
      }
    }
  }
  return leaves;
}

// Two bilinear texture reads per vertex recover the surveyed channel and its
// orientation. Give the short ballistic drop its own interval so both the lip
// and the toe land on exact texels. Relative metres keep half-float precision.
const originX=332,originZ=-136,columns=1024,lipColumn=96,toeColumn=192;
const lanes=17,laneLimit=.90,rowsPerRoute=lanes+1;
const fallTimes=autumnWaterRoutes.map(r=>{
  const {start,end}=r.segments.find(s=>s.fall);
  return new THREE.Vector2(start,end);
});

let atlas;
function channelAtlas(){
  if(atlas)return atlas;
  const rows=rowsPerRoute*autumnWaterRoutes.length;
  const data=new Uint16Array(columns*rows*4),half=THREE.DataUtils.toHalfFloat,p={};
  function write(column,row,x,y,z,w){
    const at=4*(row*columns+column);
    data[at]=half(x);data[at+1]=half(y);data[at+2]=half(z);data[at+3]=half(w);
  }
  autumnWaterRoutes.forEach((route,index)=>{
    const {x:lip,y:toe}=fallTimes[index],firstRow=index*rowsPerRoute;
    for(let col=0;col<columns;col++){
      const age=col<=lipColumn?lip*col/lipColumn:col<=toeColumn?
        mix(lip,toe,(col-lipColumn)/(toeColumn-lipColumn)):
        mix(toe,route.duration,(col-toeColumn)/(columns-1-toeColumn));
      for(let j=0;j<lanes;j++){
        sampleChannel(route,age,laneLimit*(2*j/(lanes-1)-1),p);
        write(col,firstRow+j,p.x-originX,p.y,p.z-originZ,p.shore);
      }
      write(col,firstRow+lanes,Math.cos(p.heading),Math.sin(p.heading),p.pitch,p.river?1:0);
    }
  });
  atlas=new THREE.DataTexture(data,columns,rows,THREE.RGBAFormat,THREE.HalfFloatType);
  atlas.magFilter=atlas.minFilter=THREE.LinearFilter;atlas.needsUpdate=true;
  return atlas;
}

const currentVertex=`
  uniform float waterLeafTime;
  uniform sampler2D waterLeafRoute;
  uniform vec2 waterLeafFalls[2];
  attribute vec4 currentTravel, currentBlade;
  attribute float currentChannel;
  varying float leafVeil;
  ${waterWaveGLSL}

  void waterLeafPose(out mat3 basis,out vec3 center){
    float start=currentTravel.x, period=currentTravel.y;
    float age=start+mod(currentTravel.z+waterLeafTime*currentTravel.w,period);
    float lane=currentBlade.x,phase=currentBlade.y;
    float u=lane+.092*sin(age*.41+phase)+.066*sin(age*.67+.41*phase);
    vec2 falls=waterLeafFalls[int(currentChannel)];
    float col=age<falls.x?${lipColumn}. *age/falls.x:age<falls.y?
      mix(${lipColumn}.,${toeColumn}.,(age-falls.x)/(falls.y-falls.x)):
      mix(${toeColumn}.,${columns-1}.,(age-falls.y)/(start+period-falls.y));
    float tx=(.5+col)/${columns}.;
    float row=.5+currentChannel*${rowsPerRoute}.;
    float across=clamp(u/${laneLimit}*.5+.5,0.,1.)*${lanes-1}.;
    vec4 surf=texture2D(waterLeafRoute,vec2(tx,(row+across)/${rowsPerRoute*2}.));
    vec4 frame=texture2D(waterLeafRoute,vec2(tx,(row+${lanes}.)/${rowsPerRoute*2}.));
    center=surf.xyz+vec3(${originX}.,0.,${originZ}.);
    float bridge=smoothstep(0.,2.5,5.1-abs(center.x-${MAPLE_BRIDGE.x}.))*frame.w;
    center.z=mix(center.z,${MAPLE_BRIDGE.z}.+(lane<0.?1.:-1.)*(.64+abs(lane)*1.5),bridge);
    center.y=max(center.y,${WATER_Y} +waveHeight(center.xz,waterLeafTime)+.046);
    vec2 heading=normalize(frame.xy);
    float pitch=frame.z+.026*sin(age*1.16+phase);
    float cp=cos(pitch),sp=sin(pitch);
    vec3 side=vec3(heading.x,0.,-heading.y);
    vec3 up=vec3(heading.y*sp,cp,heading.x*sp);
    vec3 forward=vec3(heading.y*cp,-sp,heading.x*cp);
    float turn=phase+currentBlade.z*age+.22*sin(age*.51+phase);
    float c=cos(turn),s=sin(turn);
    basis=mat3(side*c-forward*s,up,side*s+forward*c);
    float fromSource=smoothstep(0.,1.8+.45*sin(phase),age)*smoothstep(0.,1.8,age-start);
    float offshore=1.-smoothstep(0.,8.5+2.5*sin(phase),-surf.w-.3);
    float distanceToEye=distance((modelMatrix*vec4(center,1.)).xyz,cameraPosition);
    leafVeil=fromSource*offshore*(1.-smoothstep(80.,100.,distanceToEye));
  }`;

function currentGeometry(kind,members){
  // A floating blade lies flat against the surface. Its painted silhouette,
  // stalk and veins live in the shared leaf plate; two triangles suffice.
  const geo=new THREE.InstancedBufferGeometry(),left=kind==='maple'?0:.5;
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,-.5, -.5,0,.5, .5,0,-.5, .5,0,.5],3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0, 0,1,0, 0,1,0, 0,1,0],3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute([left,0,left,1,left+.5,0,left+.5,1],2));
  geo.setIndex([0,1,2,2,1,3]);
  const travel=[],blade=[],channel=[],dyes=[],color=new THREE.Color();
  for(const leaf of members){
    travel.push(leaf.start,leaf.route.duration-leaf.start,leaf.offset,leaf.rate);
    blade.push(leaf.lane,leaf.phase,leaf.spin,leaf.size);
    channel.push(autumnWaterRoutes.indexOf(leaf.route));
    color.set(leaf.tint);dyes.push(color.r,color.g,color.b);
  }
  for(const [key,values,size] of [['currentTravel',travel,4],['currentBlade',blade,4],
    ['currentChannel',channel,1],['color',dyes,3]]){
    geo.setAttribute(key,new THREE.InstancedBufferAttribute(new Float32Array(values),size));
  }
  geo.instanceCount=members.length;
  geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(originX,11,originZ),70);
  return geo;
}

export function createAutumnWaterLeaves(scene){
  const leaves=driftingRafts(),root=new THREE.Group(),source=autumnLeafMaterial();
  const material=source.clone(),clock={value:0};
  root.name='楓峡の水に流れる紅葉と黄葉';root.visible=false;
  material.transparent=true;material.depthWrite=false;material.forceSinglePass=true;material.vertexColors=true;
  material.onBeforeCompile=function(shader,renderer){
    source.onBeforeCompile.call(this,shader,renderer);
    shader.uniforms.waterLeafTime=clock;
    shader.uniforms.waterLeafRoute={value:channelAtlas()};
    shader.uniforms.waterLeafFalls={value:fallTimes};
    shader.vertexShader=currentVertex+'\n'+shader.vertexShader
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        mat3 leafBasis; vec3 leafCenter; waterLeafPose(leafBasis,leafCenter);
        objectNormal=leafBasis*objectNormal;`)
      .replace('#include <begin_vertex>','vec3 transformed=leafCenter+leafBasis*(position*currentBlade.w);');
    shader.fragmentShader='varying float leafVeil;\n'+shader.fragmentShader.replace(
      '#include <alphatest_fragment>','#include <alphatest_fragment>\ndiffuseColor.a*=leafVeil;');
  };
  material.customProgramCacheKey=()=>source.customProgramCacheKey()+'-autumn-current-atlas';
  for(const kind of ['maple','ginkgo']){
    const mesh=new THREE.Mesh(currentGeometry(kind,leaves.filter(leaf=>leaf.kind===kind)),material);
    mesh.renderOrder=2;root.add(mesh);
  }
  scene.add(root);
  return (time,_player,camera)=>{
    const eye=camera.position,dx=wrapDelta(originX-eye.x),dz=wrapDelta(originZ-eye.z);
    root.visible=Math.hypot(Math.max(0,Math.abs(dx)-64),Math.max(0,Math.abs(dz)-12),Math.max(0,eye.y-28))<100;
    if(!root.visible)return;
    root.position.set(Math.round((eye.x+dx-originX)/(2*BOUND))*2*BOUND,0,Math.round((eye.z+dz-originZ)/(2*BOUND))*2*BOUND);
    clock.value=time;
  };
}
