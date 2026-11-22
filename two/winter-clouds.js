import * as THREE from './vendor/three.module.min.js';

// The red channel is an ink density, not a colour. The sky and the rippled
// reflection sample the same moving print at the same bearing and height.
let wash;
export function winterCloudTexture() {
  if(!wash){
    wash=new THREE.TextureLoader().load(new URL('./assets/world/winter-cloud-wash.webp',import.meta.url).href);
    wash.wrapS=wash.wrapT=THREE.RepeatWrapping;
  }
  return wash;
}

export const winterCloudGLSL = `
  uniform sampler2D winterWash;
  vec3 winterOvercast(vec3 ray,float t,vec3 horizonFog){
    // A low ceiling recedes towards a bright shelf of coastal fog. Mapping
    // the hemisphere onto the cloud base keeps the zenith and compass seam continuous.
    float skyHeight=max(0.,ray.y);
    vec2 wind=vec2(dot(ray.xz,vec2(.887,.462)),dot(ray.xz,vec2(-.462,.887)));
    vec2 plane=wind/(.52+.64*skyHeight);
    vec2 drift=vec2(t*.00029,-t*.00016);
    vec2 uv=plane*vec2(.159,.198)+vec2(.37,.58);
    float upper=texture2D(winterWash,uv+drift).r;
    float lower=texture2D(winterWash,vec2(.64,-.29)+uv*1.83+drift*1.58).r;
    float bank=smoothstep(.20,.80,.67*upper+.33*lower);
    vec3 ink=vec3(.133,.160,.182),silk=vec3(.375,.404,.420);
    vec3 sky=mix(silk,ink,bank);
    // Below the continuous ceiling a streak of drifting snow veils a few
    // bearings. This soft lower edge crosses the broader cloud masses.
    vec2 squallUV=vec2(wind.x*.41+wind.y*.24,ray.y*.97+.426);
    float veil=texture2D(winterWash,squallUV+drift*.39).r;
    float curtain=(1.-smoothstep(.055,.24,ray.y)) * smoothstep(.36,.77,veil);
    sky=mix(sky,vec3(.30,.338,.36),curtain*.49);
    // The prevailing light filters through the cover without a hard solar rim.
    float pale=pow(clamp(dot(ray,normalize(vec3(.28,.29,-.92))),0.,1.),7.);
    sky+=vec3(.048,.046,.039)*pale*(1.-.73*bank);
    float distanceHaze=1.-smoothstep(-.012,.30,ray.y);
    return mix(sky,horizonFog,distanceHaze*(.80+.20*(1.-smoothstep(0.,.055,ray.y))));
  }`;
