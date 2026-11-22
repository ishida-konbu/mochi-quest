import * as T from './vendor/three.module.min.js';
import { rillPoint } from './suzuri-basin-plan.js';

const {PI,sin,cos}=Math;
// A physical surface is kept for the receiving well, the meander, and the
// very short drop at its end. The animated glints travel at a shared speed.
export function grindingRill(clock){
  const pos=[],colors=[],uv=[],kind=[],index=[];
  function patch(nx,ny,type,at){
    const base=pos.length/3;
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny,point=at(u,v);
      pos.push(...point);uv.push(u,v);kind.push(type);
      const col=new T.Color(type===2?'#839790':'#5b706a');colors.push(col.r,col.g,col.b);
      if(i<nx&&j<ny){
        const a=base+j*(nx+1)+i;index.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);
      }
    }
  }
  const [x,h,z]=rillPoint(0),[ex,eh,ez]=rillPoint(1);
  patch(54,13,0,(u,v)=>[x+.357*v*cos(u*2*PI),h+.0012*cos(26*v),z+.237*v*sin(u*2*PI)]);
  patch(11,78,1,(q,t)=>{const [u,h,v]=rillPoint(t),half=.052+.017*(1-t)+.009*sin(PI*t);
    return [u+(1-2*q)*half,h+.002*sin(PI*q),v];});
  patch(10,19,2,(q,t)=>[ex+(q*2-1)*(.052+.021*t),eh*(1-t*t)-.004*t,ez+.048*t+.053*sin(t*PI*.76)]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('waterPart',new T.Float32BufferAttribute(kind,1));g.setIndex(index);g.computeVertexNormals();
  const mat=new T.MeshPhysicalMaterial({vertexColors:true,side:T.DoubleSide,roughness:.25,
    specularIntensity:.46,clearcoat:.30,clearcoatRoughness:.18,transparent:true,opacity:.84,depthWrite:false});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.rillTime=clock;
    shader.vertexShader='attribute float waterPart; varying float ribbonPart; varying vec2 rillUV;\n'+
      shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nribbonPart=waterPart;rillUV=uv;');
    shader.fragmentShader='uniform float rillTime; varying float ribbonPart;varying vec2 rillUV;\n'+
      shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float wave=ribbonPart<.5 ? rillUV.y*41.-rillTime*5.3+.22*cos(rillUV.x*25.13) :
          rillUV.y*36.-rillTime*6.4+.64*cos(rillUV.x*17.+rillUV.y*12.);
        float edge=ribbonPart<.5 ? 1.-smoothstep(.86,1.,rillUV.y):
          smoothstep(.0,.18,min(rillUV.x,1.-rillUV.x));
        float crest=pow(.5+.5*cos(wave),7.)*edge;
        diffuseColor.rgb+=vec3(.027,.044,.038)*crest;
        diffuseColor.a*=.56+.43*edge;`);
  };
  const water=new T.Mesh(g,mat);water.renderOrder=3;water.name='硯滴の受けと硯海を結ぶ湯筋';return water;
}

export function inkWellVapour(clock){
  const cloud=new T.BufferGeometry(),idx=[],pos=[],uv=[],source=[],codes=[];
  // Warm air rises from the three wet areas and drifts towards the open
  // street. Its sources stay clear of the dry grinding field and apron.
  const vents=[[-1.91,.276,-1.75,.48],[-.87,.032,-.73,.70],[1.78,.046,.08,1.22],[-3.3,.035,.56,.84]];
  for(let i=0;i<26;i++){
    const origin=vents[i%vents.length],phase=i*2.3999,r=.26*Math.sqrt((i%6)/6);
    const x=origin[0]+r*cos(phase),z=origin[2]+r*sin(phase),n=i*4;
    for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]]){
      pos.push(a-.5,b-.5,0);uv.push(a,b);source.push(x,origin[1],z);
      codes.push((.38196*i)%1,origin[3],phase,.80+.24*(i%4)/3);
    }
    idx.push(n,n+1,n+2,n+2,n+1,n+3);
  }
  cloud.setIndex(idx);
  for(const [name,v,size] of [['position',pos,3],['uv',uv,2],['source',source,3],['code',codes,4]])
    cloud.setAttribute(name,new T.Float32BufferAttribute(v,size));
  const m=new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{springTime:clock},
    vertexShader:`uniform float springTime;attribute vec3 source;attribute vec4 code;
    varying vec2 vapourUv;varying float age,phase;void main(){
      vapourUv=uv;age=fract(code.x+springTime*.184*code.w);phase=code.z;
      vec3 p=source;p.y+=age*code.y*.96;p.x+=age*.22*sin(phase+age*3.3);
      p.z+=age*(.18+.12*cos(phase+age*4.));
      vec4 mv=modelViewMatrix*vec4(p,1.);
      mv.xy+=position.xy*vec2(1.10,1.55)*(.14+age*.87)*code.y;
      gl_Position=projectionMatrix*mv;
    }`,
    fragmentShader:`varying vec2 vapourUv;varying float age,phase;void main(){
      vec2 p=vapourUv-.5;p.x+=.046*sin(phase+5.3*p.y+age*5.);
      float plume=exp(-dot(p*vec2(4.2,3.3),p*vec2(4.2,3.3)));
      float soft=(1.-smoothstep(.34,.49,abs(p.x)))*(1.-smoothstep(.34,.49,abs(p.y)));
      float alive=smoothstep(.02,.28,age)*(1.-smoothstep(.40,1.,age));
      gl_FragColor=vec4(.76,.78,.74,plume*soft*alive*.099);
      #include <colorspace_fragment>
    }`
  });
  const mist=new T.Mesh(cloud,m);mist.frustumCulled=false;mist.renderOrder=5;return mist;
}
