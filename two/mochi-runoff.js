// Threads of water adhere to the posed dough from the point of impact to the
// shoulder. Sample the actual upper surface on both edges of each thin film.
import * as T from './vendor/three.module.min.js';

const strands=9, stations=7, maxHits=3;
export function createMochiRunoff(scene){
  const geometry=new T.BufferGeometry(), n=maxHits*strands*stations*2;
  const position=new T.Float32BufferAttribute(new Float32Array(n*3),3);
  const uv=new T.Float32BufferAttribute(new Float32Array(n*2),2);
  const seed=new T.Float32BufferAttribute(new Float32Array(n),1),index=[];
  for(let i=0;i<maxHits*strands;i++)for(let k=0;k<stations;k++){
    const j=(i*stations+k)*2,t=k/(stations-1);
    for(let a=0;a<2;a++){uv.setXY(j+a,a,t);seed.setX(j+a,i*2.39996);}
    if(k<stations-1)index.push(j,j+2,j+1,j+1,j+2,j+3);
  }
  position.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',position);geometry.setAttribute('uv',uv);geometry.setAttribute('phase',seed);
  geometry.setIndex(index);
  const clock={value:0},material=new T.ShaderMaterial({uniforms:{clock},side:T.DoubleSide,
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
    vertexShader:`attribute float phase; varying vec2 p;varying float thread;
      void main(){p=uv;thread=phase;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float clock;varying vec2 p;varying float thread;
      void main(){
        float travelling=sin(p.y*18.-clock*9.+thread);
        float bend=.10*sin(4.*p.y+thread)+.035*travelling;
        float u=p.x-bend;
        float edge=smoothstep(.0,.15,u)*(1.-smoothstep(.83,1.,u));
        float vein=1.-smoothstep(.02,.15,abs(u-.29-.04*travelling));
        float threadEnd=(1.-smoothstep(.58,1.,p.y))*smoothstep(0.,.13,p.y);
        float flash=vein*(.35+.65*smoothstep(-.55,.43,travelling));
        vec3 c=mix(vec3(.105,.27,.26),vec3(.88,.94,.88),.19+.78*flash);
        gl_FragColor=vec4(c,edge*threadEnd*(.46+.32*flash));
        #include <colorspace_fragment>
      }`});
  material.forceSinglePass=true;
  const mesh=new T.Mesh(geometry,material);mesh.name='もち肌を伝う湯筋';
  mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=4;scene.add(mesh);
  let count=0;
  return {begin(t){clock.value=t;count=0;},paint(hit,normal,width,surfaceY){
    if(count>=maxHits)return;
    const time=clock.value,flux=T.MathUtils.clamp(width,.05,.38);
    for(let i=0;i<strands;i++){
      const phase=i*2.39996+count*.91;
      const angle=i*2*Math.PI/strands+.21*Math.sin(phase*2)+.14*Math.sin(time*2.1+phase);
      const sx=Math.sin(angle)+.42*normal.x,sz=Math.cos(angle)+.42*normal.z;
      const length=(.32+flux*.68)*(.92+.29*Math.cos(phase))+.10;
      const start=(count*strands+i)*stations*2;
      let lastX=hit.x,lastZ=hit.z,lastY=hit.y,ended=false;
      for(let k=0;k<stations;k++){
        const t=k/(stations-1),r=.008+t*length;
        const winding=.055*t*Math.sin(t*5.5+phase+.65*Math.sin(time*1.9+phase));
        const x=hit.x+r*sx+winding*sz,z=hit.z+r*sz-winding*sx;
        const w=(.018+flux*.20)*Math.sin(Math.PI*(t*.92+.035))**.65;
        const left=ended?-Infinity:surfaceY(x+sz*w,z-sx*w);
        const right=ended?-Infinity:surfaceY(x-sz*w,z+sx*w);
        if(Math.min(left,right)<hit.y-.85 || Math.max(left,right)>hit.y+.06)ended=true;
        const j=start+2*k;
        if(ended){
          position.setXYZ(j,lastX,lastY,lastZ);position.setXYZ(j+1,lastX,lastY,lastZ);
        }else{
          // The skinned proxy is inscribed in the smooth rendered surface.
          const lift=.014+.01*(1-t);
          position.setXYZ(j,x+sz*w,left+lift,z-sx*w);position.setXYZ(j+1,x-sz*w,right+lift,z+sx*w);
          lastX=x;lastY=(left+right)/2+lift;lastZ=z;
        }
      }
    }
    count++;
  },end(){
    mesh.visible=count>0;
    if(!count)return;
    geometry.setDrawRange(0,count*strands*(stations-1)*6);
    position.clearUpdateRanges();position.addUpdateRange(0,count*strands*stations*6);position.needsUpdate=true;
  }};
}
