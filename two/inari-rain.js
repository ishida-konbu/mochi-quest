// Falling threads catch the sun on one edge. Their landing points stay fixed
// in the landscape as the pilgrim walks, turns, or orbits the photo camera.
import * as T from './vendor/three.module.min.js';
import { seeded, solidHeightAt, terrainHeight, terrainMeshHeight, waterSurfaceAt, wrapDelta } from './terrain.js';
import { inariWeatherAt, visitInariShowers } from './inari-weather.js';
import { WEDDING_SITES } from './pilgrimage-layout.js';

const span=40, half=span/2, count=3200;
const fieldStep=half;
const quad=new T.PlaneGeometry(1,1);
function instances(attributes,total) {
  const geometry=new T.InstancedBufferGeometry();
  geometry.setIndex(quad.index);
  geometry.setAttribute('position',quad.attributes.position);
  for(const [key,value] of Object.entries(attributes))geometry.setAttribute(key,value);
  geometry.instanceCount=total;
  return geometry;
}
function ink(scene,name,geometry,uniforms,vertexShader,fragmentShader,order) {
  const material=new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,
    transparent:true,depthWrite:false,side:T.DoubleSide});
  material.forceSinglePass=true;
  const mesh=new T.Mesh(geometry,material);
  mesh.name=name;mesh.renderOrder=order;mesh.frustumCulled=false;mesh.visible=false;
  scene.add(mesh);
  return mesh;
}

const localField=`
  uniform float clock,field[9];
  uniform vec2 fieldOrigin,wind,viewport;
  attribute vec3 anchor;
  attribute vec4 variation;
  varying float opacity,shade;
  varying vec2 stroke;
  float rainAt(vec2 world){
    vec2 p=clamp((world-fieldOrigin)/${fieldStep.toFixed(1)}+1.,0.,2.);
    ivec2 tile=ivec2(min(floor(p),vec2(1.)));
    int i=tile.x+3*tile.y;
    vec2 f=p-vec2(tile);
    return mix(mix(field[i],field[i+1],f.x),mix(field[i+3],field[i+4],f.x),f.y);
  }
  float amount(float rain){
    return smoothstep(variation.z-.055,variation.z+.055,pow(rain,1.16))*smoothstep(.004,.045,rain)
      *(1.-smoothstep(14.,19.8,length(anchor.xz-cameraPosition.xz)));
  }
  float fallSpeed(){return 11.5+variation.y*6.4;}
  float fallHeight(){return mod(variation.x*22.-clock*fallSpeed(),22.);}
`;
const threadVertex=localField+`
  void main(){
    float rain=rainAt(anchor.xz);
    float bottom=max(0.,cameraPosition.y-anchor.y-8.);
    float h=bottom+mod(fallHeight()-bottom,22.);
    float thread=mix(.25,.53,rain)*(.70+.76*variation.w);
    thread*=smoothstep(.36,1.9,distance(anchor.xz,cameraPosition.xz))*.55+.45;
    vec3 up=vec3(-wind.x/fallSpeed(),1.,-wind.y/fallSpeed());
    // The wind tilts the whole falling trajectory, including its motion.
    float drift=22.*(1.-exp(-h/22.))/fallSpeed();
    vec3 tip=anchor+vec3(-wind.x*drift,h,-wind.y*drift);
    vec4 eye=viewMatrix*vec4(tip+up*thread*(position.y+.5),1.);
    vec4 clip=projectionMatrix*eye;
    vec3 direction=mat3(viewMatrix)*up;
    vec2 axis=vec2(projectionMatrix[0][0],projectionMatrix[1][1])*(direction.xy*(-eye.z)+eye.xy*direction.z)*viewport;
    vec2 side=normalize(vec2(-axis.y,axis.x)+vec2(.0001));
    float width=clamp(.94+(.018+.014*variation.y)*viewport.y/max(2.,-eye.z),1.05,2.7);
    clip.xy+=side*position.x*2.*width/viewport*clip.w;
    gl_Position=clip;
    opacity=amount(rain)*smoothstep(.3,1.5,-eye.z)*(1.-smoothstep(19.6,22.,h-bottom))*
      smoothstep(0.,.36,h)*(.58+.30*rain);
    shade=variation.w;stroke=position.xy*2.;
  }
`;
const threadFragment=`
  varying vec2 stroke;varying float opacity,shade;
  void main(){
    float taper=smoothstep(0.,.95,1.-abs(stroke.y));
    float coverage=1.-smoothstep(.23+.37*taper,.75+.25*taper,abs(stroke.x));
    float light=smoothstep(.28,.77,shade+.21*stroke.x);
    vec3 ink=mix(vec3(.088,.143,.162),vec3(1.,.946,.727),light);
    gl_FragColor=vec4(ink,opacity*coverage*(.25+.75*taper));
    #include <colorspace_fragment>
  }
`;
const splashVertex=localField+`
  attribute vec2 grade;
  varying float age;
  void main(){
    float rain=rainAt(anchor.xz);
    age=mod(22.-fallHeight(),22.)/(fallSpeed()*.26);
    float radius=(.035+.17*min(1.,age))*(.72+.52*variation.w)*(.71+.40*rain);
    vec2 dxz=position.xy*radius*2.;
    vec3 point=anchor+vec3(dxz.x,.075+dot(grade,dxz),dxz.y);
    gl_Position=projectionMatrix*viewMatrix*vec4(point,1.);
    opacity=amount(rain)*(1.-smoothstep(.18,1.,age))*(1.-smoothstep(9.,17.,distance(anchor,cameraPosition)));
    shade=variation.w;stroke=position.xy*2.;
  }
`;
const splashFragment=`
  varying vec2 stroke; varying float opacity,shade,age;
  void main(){
    if(opacity<.008)discard;
    float d=length(stroke), aa=clamp(fwidth(d),.05,.29);
    float ring=1.-smoothstep(.055,.055+aa,abs(d-.74));
    float arc=.40+.60*smoothstep(-.55,.40,dot(stroke,vec2(.83,.54))+sin(shade*31.)*.38);
    float spark=(1.-smoothstep(.08,.31+aa,d))*(1.-smoothstep(.07,.50,age));
    gl_FragColor=vec4(mix(vec3(.99,.94,.75),vec3(.15,.23,.25),.55*smoothstep(-.20,.32,stroke.y)),
      opacity*(.76*arc*ring+.79*spark));
    #include <colorspace_fragment>
  }
`;

function distantCurtains(scene,clock) {
  // Each cell produces a broken wash behind its rain. The lower end can sit
  // below a slope; the opaque ridge and torii occlude it using the depth buffer.
  const capacity=64,cell=new T.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(T.DynamicDrawUsage);
  const weather=new T.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(T.DynamicDrawUsage);
  const geometry=instances({cell,weather},0);
  const mesh=ink(scene,'山を渡る雨脚',geometry,{clock},`
    attribute vec4 cell,weather;
    varying vec2 paper; varying float strength,grain;
    void main(){
      vec2 d=cameraPosition.xz-cell.xz;
      vec2 right=vec2(d.y,-d.x)/max(.01,length(d));
      paper=position.xy*2.;grain=weather.y;
      float h=position.y+.5;
      vec2 footprint=cell.xz+right*paper.x*cell.w*.90-weather.zw*(h-.5)*4.;
      gl_Position=projectionMatrix*viewMatrix*vec4(footprint.x,cell.y+mix(-32.,64.,h),footprint.y,1.);
      strength=weather.x*smoothstep(cell.w*.66,cell.w*1.45,length(d))*(1.-smoothstep(165.,235.,length(d)));
    }`,`
    uniform float clock; varying vec2 paper;varying float strength,grain;
    void main(){
      float x=paper.x+.045*sin(paper.y*2.1+grain);
      float plume=pow(max(0.,1.-x*x),1.85)*(1.-smoothstep(.27,1.,paper.y))*smoothstep(-1.,-.35,paper.y);
      float rib=.51+.25*sin(x*17.+grain+.46*paper.y)+.19*sin(x*33.-grain*.57+paper.y*.38);
      float fine=.5+.5*sin(x*122.+.62*sin(paper.y*17.+clock*2.)+grain);
      float wash=strength*plume*(.075+.18*rib+.026*fine);
      gl_FragColor=vec4(mix(vec3(.158,.228,.236),vec3(.57,.606,.55),rib*.65),wash);
      #include <colorspace_fragment>
    }`,3);
  return (time,camera,seed)=>{
    let n=0,near=false;
    const p=camera.position;
    visitInariShowers(p.x,p.z,time,seed,200,pass=>{
      const dx=wrapDelta(pass.x-p.x),dz=wrapDelta(pass.z-p.z),distance=Math.hypot(dx,dz);
      if(distance<pass.radius+half*1.5)near=true;
      if(n===capacity || distance<pass.radius*.66 || distance>235 || pass.strength<.025)return;
      cell.setXYZW(n,p.x+dx,terrainHeight(pass.x,pass.z),p.z+dz,pass.radius);
      weather.setXYZW(n,pass.strength,(pass.id%65536)*.013,pass.windX,pass.windZ);
      n++;
    });
    geometry.instanceCount=n;mesh.visible=n>0;
    if(n){cell.needsUpdate=true;weather.needsUpdate=true;}
    return near;
  };
}

export function createInariRain(scene) {
  const random=seeded(36246), offsets=new Float32Array(count*2),params=new Float32Array(count*4);
  for(let i=0;i<count;i++){
    offsets[i*2]=random()*span;offsets[i*2+1]=random()*span;
    for(let j=0;j<4;j++)params[i*4+j]=random();
  }
  const anchor=new T.InstancedBufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const grade=new T.InstancedBufferAttribute(new Float32Array(count*2),2).setUsage(T.DynamicDrawUsage);
  const variation=new T.InstancedBufferAttribute(params,4), clock={value:0};
  const uniforms={clock,wind:{value:new T.Vector2()},viewport:{value:new T.Vector2(1,1)},
    field:{value:new Float32Array(9)},fieldOrigin:{value:new T.Vector2()}};
  const rain=ink(scene,'日を透かす雨糸',instances({anchor,variation},count),uniforms,threadVertex,threadFragment,5);
  const splashCount=Math.floor(count*.43);
  const splashes=ink(scene,'雨粒の水紋',instances({anchor,grade,variation},splashCount),uniforms,splashVertex,splashFragment,4);
  rain.onBeforeRender=renderer=>renderer.getDrawingBufferSize(uniforms.viewport.value);
  const curtains=distantCurtains(scene,clock),sample={},fallback={};
  let tileX=NaN,tileZ=NaN,lastSample=-Infinity;
  function plantColumns(cx,cz) {
    const cache=new Map();
    function groundVertex(x,z){
      const key=x*10000+z;
      if(!cache.has(key))cache.set(key,terrainHeight(wrapDelta(x),wrapDelta(z)));
      return cache.get(key);
    }
    function surface(x,z){
      const wx=wrapDelta(x),wz=wrapDelta(z);
      return Math.max(terrainMeshHeight(wx,wz,groundVertex),solidHeightAt(wx,wz),waterSurfaceAt(wx,wz));
    }
    for(let i=0;i<count;i++){
      const u=offsets[i*2],v=offsets[i*2+1];
      const x=Math.fround(u+span*Math.round((cx-u)/span)),z=Math.fround(v+span*Math.round((cz-v)/span));
      if(x===anchor.getX(i) && z===anchor.getZ(i))continue;
      const y=surface(x,z);
      anchor.setXYZ(i,x,y,z);
      if(i<splashCount)grade.setXY(i,T.MathUtils.clamp((surface(x+.20,z)-y)*5,-2,2),T.MathUtils.clamp((surface(x,z+.20)-y)*5,-2,2));
    }
    anchor.needsUpdate=true;grade.needsUpdate=true;
  }
  return (time,player,camera,weather)=>{
    weather ??= inariWeatherAt(player.x,player.z,time,0,fallback);
    clock.value=time;
    const near=curtains(time,camera,weather.seed);
    const nearWedding=WEDDING_SITES.some(s=>Math.abs(wrapDelta(s.x-camera.position.x))<s.rx+42 && Math.abs(wrapDelta(s.z-camera.position.z))<44);
    if(!near && !nearWedding && !weather.rain){
      rain.visible=splashes.visible=false;lastSample=-Infinity;
      return;
    }
    const p=camera.position,cx=Math.round(p.x/4)*4,cz=Math.round(p.z/4)*4;
    const moved=cx!==tileX || cz!==tileZ;
    if(moved || Math.abs(time-lastSample)>.12){
      uniforms.fieldOrigin.value.set(cx,cz);
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const x=cx+(col-1)*fieldStep,z=cz+(row-1)*fieldStep;
        uniforms.field.value[row*3+col]=inariWeatherAt(x,z,time,weather.seed,sample).rain;
      }
      lastSample=time;
    }
    rain.visible=splashes.visible=uniforms.field.value.some(amount=>amount>.006);
    if(!rain.visible)return;
    if(moved){plantColumns(cx,cz);tileX=cx;tileZ=cz;}
    uniforms.wind.value.set(weather.windX,weather.windZ);
  };
}
