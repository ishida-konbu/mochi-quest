import * as THREE from './vendor/three.module.min.js';

let plate;
export function kaedeWaterRafts(){
  if(!plate){
    plate=new THREE.TextureLoader().load(new URL('./assets/world/kaede-water-rafts.webp',import.meta.url).href);
    // Linear data: each channel is the area covered by one impression of ink.
    plate.wrapS=THREE.RepeatWrapping;
    plate.wrapT=THREE.ClampToEdgeWrapping;
    plate.anisotropy=8;
  }
  return plate;
}

export const kaedeRaftGLSL=`
  uniform sampler2D kaedeRafts;
  const vec3 kaedeCarmine=vec3(.36,.006,.022),kaedeVermilion=vec3(.76,.068,.014),kaedeGold=vec3(1.,.54,.023);
  vec4 leafImpression(vec2 uv,float gold){
    // Only the downstream axis repeats. Outer strays thin out toward either
    // bank even where the flooded estuary becomes wider than the printed tile.
    float fringe=smoothstep(0.,.095,uv.y)*(1.-smoothstep(.905,1.,uv.y));
    vec3 ink=texture2D(kaedeRafts,uv).rgb*fringe;
    ink.r+=ink.b*(1.-gold);
    ink.b*=gold;
    float coverage=dot(ink,vec3(1.));
    // Transparent red lakes, vermilion and gamboge on blue-green water.
    vec3 color=ink.r*kaedeCarmine+ink.g*kaedeVermilion+ink.b*kaedeGold;
    return vec4(color/max(1.,coverage),min(1.,coverage));
  }
  vec4 leafImpression(vec2 uv){return leafImpression(uv,1.);}
  vec3 printLeaves(vec3 water,vec4 leaves,float weight){
    return water*(1.-weight*leaves.a)+weight*leaves.rgb;
  }`;
