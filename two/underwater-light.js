import * as THREE from './vendor/three.module.min.js';
import { seeded } from './terrain.js';

// Plankton and grains of suspended silt give scale to the space between the
// lens and the bed. Recycle positions at the invisible rim of a 26 m volume.
export function createWaterMotes(scene) {
  const random=seeded(48273), positions=[], seeds=[], corners=[], indices=[];
  for(let i=0;i<256;i++) {
    const x=random()*26, y=random()*26, z=random()*26;
    const radius=.008+.024*random()**2, phase=random()*6.283;
    for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      positions.push(x,y,z); seeds.push(radius,phase); corners.push(u,v);
    }
    const k=i*4; indices.push(k,k+1,k+2,k+2,k+1,k+3);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,2));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(corners,2));
  geometry.setIndex(indices);
  const uniforms={time:{value:0}, waterline:{value:0}, weight:{value:0}};
  const material=new THREE.ShaderMaterial({
    uniforms, transparent:true,depthWrite:false,
    vertexShader:`
      uniform float time, waterline, weight; attribute vec2 seed; varying vec2 grain; varying float alpha;
      void main(){
        vec3 drift=vec3(.07*time+.27*sin(.47*time+seed.y),.041*time+.16*cos(.59*time+seed.y),.19*sin(.35*time+seed.y));
        vec3 relative=mod(position+drift-cameraPosition+13.,26.)-13.;
        vec3 at=cameraPosition+relative;
        vec4 eye=viewMatrix*vec4(at,1.);
        float wave=.5+.5*sin(at.x*1.4-at.z*.86+time*.42+sin(at.z*.67));
        alpha=weight*(.14+.41*wave*wave)*smoothstep(.6,1.8,-eye.z)
          *(1.-smoothstep(8.,12.85,length(relative)))*smoothstep(.04,.42,waterline-at.y);
        eye.xy+=uv*seed.x*vec2(.73+.22*sin(seed.y),1.);
        gl_Position=projectionMatrix*eye;grain=uv;
      }`,
    fragmentShader:`
      varying vec2 grain; varying float alpha;
      void main(){
        float r=dot(grain,grain);
        gl_FragColor=vec4(vec3(.68,.77,.62),alpha*(1.-smoothstep(.05,.98,r)));
        #include <colorspace_fragment>
      }`,
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='水中に漂う微粒子';mesh.frustumCulled=false;mesh.renderOrder=2;mesh.visible=false;scene.add(mesh);
  return (time,waterline,weight)=>{
    mesh.visible=weight>.005;
    if(!mesh.visible)return;
    uniforms.time.value=time; uniforms.waterline.value=waterline; uniforms.weight.value=weight;
  };
}

// The depth already used by the ink pass stops each shaft at the first
// surface (including the swimmer). Sample in world space to leave the
// moving light anchored to the waves as the viewer turns or dives.
export const submergedLightGLSL = /* glsl */ `
  uniform vec4 submergedEye;
  uniform mat3 waterBasis;
  uniform vec3 submergedWater;
  uniform vec3 submergedFog;
  vec3 underwaterLight(vec3 color, vec3 viewRay,float depth) {
    if(submergedWater.x<=.001)return color;
    // At a level gaze the ray can reach the far clip without crossing the
    // surface or the bottom. Continue the water wash through that gap.
    color=mix(color,submergedFog,submergedWater.x*smoothstep(.98*clip.y,clip.y,depth));
    vec3 ray=waterBasis*viewRay;
    float end=min(depth,20./length(ray));
    if(ray.y>.001)end=min(end,max(0.,-submergedEye.y/ray.y));
    // The warm ink fades first in salt water. A silty river keeps more of
    // its ochre. Include the illuminating path down to the swimmer's skin
    // so even the near side of the white dough takes on the local wash.
    float path=end*length(ray);
    float sunDepth=max(0.,-submergedEye.y-end*ray.y);
    vec3 loss=mix(vec3(.035,.016,.031),vec3(.064,.026,.015),submergedWater.z);
    vec3 through=exp(-loss*(path+.52*min(24.,sunDepth)));
    vec3 tint=mix(vec3(.091,.142,.115),vec3(.054,.130,.146),submergedWater.z);
    color=mix(color,color*through+tint*(1.-through),submergedWater.x);
    vec2 lightSlope=vec2(.40,-.58);
    vec2 start=submergedEye.xz-submergedEye.y*lightSlope;
    vec2 travel=(ray.xz-ray.y*lightSlope)*end;
    float t=submergedEye.w, light=0.;
    for(int j=0;j<4;j++){
      float fraction=(float(j)+.5)*.25;
      vec2 q=start+fraction*travel;
      // Broad lanes split around a slower eddy. The separated tips leave
      // dark water between the shafts even in an upward view.
      float lane=cos(dot(q,vec2(.81,.39))+.83*sin(q.y*.58-t*.25)+t*.32);
      float crossing=cos(dot(q,vec2(-.29,.58))+.64*sin(q.x*.34+t*.16));
      light+=smoothstep(.55,.97,lane)*(.29+.71*smoothstep(-.4,.85,crossing))
        *exp(.13*min(0.,submergedEye.y+fraction*end*ray.y));
    }
    float scatter=(1.-exp(-.095*path))*submergedWater.y;
    return color+vec3(.10,.145,.11)*(.045+.25*light)*scatter;
  }
`;
