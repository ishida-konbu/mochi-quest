import * as T from './vendor/three.module.min.js';

const finishes={
  inkstone:{tile:[0,1],scale:1.45,rough:.54,coat:.20,grain:.006},
  granite:{tile:[1,1],scale:1.72,rough:.81,coat:.05,grain:.004},
  celadon:{tile:[0,0],scale:2.12,rough:.26,coat:.57,grain:.002},
  moss:{tile:[1,0],scale:2.30,rough:.98,coat:0,grain:.011}
};
const cached=new Map();
let study;
function surfaceAtlas(){
  if(!study && typeof document!=='undefined'){
    study=new T.TextureLoader().load(new URL('./assets/world/suzuri-surface-studies.webp',import.meta.url).href);
    study.anisotropy=4;
  }
  return study;
}

// The studies supply small-scale variation. Larger colour changes, cut edges
// and wet boundaries belong to the carved vertex colours and the actual form.
export function suzuriSurface(kind){
  if(cached.has(kind))return cached.get(kind);
  const f=finishes[kind],m=new T.MeshPhysicalMaterial({vertexColors:true,side:T.DoubleSide,roughness:f.rough,
    metalness:0,clearcoat:f.coat,clearcoatRoughness:kind==='celadon'?.18:.35});
  m.customProgramCacheKey=()=>'suzuri tactile surface '+kind;
  m.onBeforeCompile=shader=>{
    shader.uniforms.suStudy={value:surfaceAtlas()};
    shader.vertexShader='varying vec3 studyP,studyN;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nstudyP=position;studyN=normal;');
    shader.fragmentShader=`uniform sampler2D suStudy;
      varying vec3 studyP,studyN;
      vec3 readStudy(vec2 p){
        vec2 fold=1.-abs(mod(p,2.)-1.);
        return texture2D(suStudy,(vec2(${f.tile[0]}.,${f.tile[1]}.)+.009+fold*.982)*.5).rgb;
      }
      float reliefTone(vec3 s){return dot(s,vec3(.28,.57,.15));}
    `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 planes=pow(abs(normalize(studyN)),vec3(5.));planes/=max(.0001,dot(planes,vec3(1.)));
      vec3 here=studyP*${f.scale.toFixed(2)};
      vec3 skin=planes.x*readStudy(here.zy)+planes.y*readStudy(here.xz)+planes.z*readStudy(here.xy);
      float grain=reliefTone(skin);
      diffuseColor.rgb*=clamp(vec3(.55)+skin*.83,vec3(.52),vec3(1.38));
    `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 dp1=dFdx(-vViewPosition),dp2=dFdy(-vViewPosition);
      vec3 n1=cross(dp2,normal),n2=cross(normal,dp1);
      float det=dot(dp1,n1);
      vec3 bump=sign(det)*(dFdx(grain)*n1+dFdy(grain)*n2);
      normal=normalize(max(abs(det),1e-8)*normal-${f.grain.toFixed(3)}*bump);
    `);
  };
  cached.set(kind,m);return m;
}
