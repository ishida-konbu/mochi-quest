import * as THREE from './vendor/three.module.min.js';
import { DISTRICTS } from './geography.js';

const orchard = DISTRICTS.peach;

// Radii follow the long axis of the valley. The low veils pool between the
// flowering trees; the higher, thinner ones cross the bare mountain shoulders.
// Each entry gives the centre relative to the orchard (y is elevation), the
// three radii in metres, and extinction per metre at the heart of the bank.
const banks = [
  [-18,  9, -16, 92,  6, 32, .023],
  [ 19, 14,  30, 98,  8, 29, .022],
  [-43, 29, -29, 72,  8, 42, .018],
  [ -7, 46, -33, 112, 7, 56, .017],
  [ 36, 72,  30, 148, 6, 70, .014],
  [ 98, 17,  14, 53,  9, 59, .025],
  [148, 22, -43, 77,  7, 33, .023],
  [206, 35,   6, 72, 10, 77, .015],
];

export function peachHazeWeight(x,z) {
  const radius = Math.hypot((x-orchard.x-40)/239,(z-orchard.z)/128);
  return 1 - THREE.MathUtils.smoothstep(radius,.78,1.38);
}

export function peachHazeUniforms() {
  return {
    peachHaze: {value:0},
    mistBasis: {value:new THREE.Matrix3()},
    mistTint: {value:new THREE.Color()},
    mistEye: {value:banks.map(()=>new THREE.Vector3())},
  };
}
export function updatePeachHaze(uniforms,camera,fog,time) {
  const eye = camera.position, weight = peachHazeWeight(eye.x,eye.z);
  uniforms.peachHaze.value = weight;
  if (!weight) return;
  uniforms.mistBasis.value.setFromMatrix4(camera.matrixWorld);
  uniforms.mistTint.value.copy(fog.color).multiplyScalar(1.10);
  for (const [i,[u,y,v,rx,ry,rz]] of banks.entries()) {
    const drift = time*.035+i*2.4;
    uniforms.mistEye.value[i].set(
      (eye.x-orchard.x-u-3.5*Math.sin(drift))/rx,
      (eye.y-y-.85*Math.cos(drift*.81))/ry,
      (eye.z-orchard.z-v-2*Math.cos(drift))/rz);
  }
}

// Integrate (1 - r²)² along the visible part of a ray inside each ellipsoid.
// The scene's existing depth buffer clips the integral at bark, roofs and cliffs.
// This also works looking down into a hollow, or standing inside the mist.
export const peachHazeShader = `
  uniform float peachHaze;
  uniform mat3 mistBasis;
  uniform vec3 mistTint, mistEye[${banks.length}];
  float mistPrimitive(float t) {
    float t2=t*t;
    return t*(1.+t2*(-.6666667+.2*t2));
  }
  float mistDepth(vec3 eye,vec3 ray,float depth) {
    float invSpeed=inversesqrt(dot(ray,ray));
    vec3 axis=ray*invSpeed;
    float along=-dot(eye,axis);
    vec3 closest=eye+along*axis;
    float strength=1.-dot(closest,closest);
    if(strength<=0.) return 0.;
    float radius=sqrt(strength);
    float start=clamp(-along/radius,-1.,1.);
    float end=clamp((depth/invSpeed-along)/radius,-1.,1.);
    return (mistPrimitive(end)-mistPrimitive(start))*radius*invSpeed*strength*strength;
  }
  vec3 valleyMist(vec3 painted,vec3 viewRay,float depth) {
    if(peachHaze<=0.) return painted;
    float rayLength=length(viewRay);
    vec3 ray=mistBasis*(viewRay/rayLength);
    float distanceToSurface=depth*rayLength;
    float opticalDepth=0.;
    ${banks.map(([, , ,rx,ry,rz,density],i)=>
      `opticalDepth+=${density}*mistDepth(mistEye[${i}],ray/vec3(${rx}.,${ry}.,${rz}.),distanceToSurface);`
    ).join('\n')}
    return mix(mistTint,painted,exp(-opticalDepth*peachHaze));
  }`;
