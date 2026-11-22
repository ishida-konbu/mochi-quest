// Model-space projection keeps the drawn marks on end grain and on cut faces
// even after the local pieces have been combined into one instanced mesh.
import * as T from './vendor/three.module.min.js';

const finishes={cedar:[0,1,.76],slate:[1,1,.74],clay:[0,0,.54],bamboo:[1,0,.64]};
const palette=new Map();
let atlas;
export function bathFinish(kind){
  if(palette.has(kind))return palette.get(kind);
  const [cx,cy,roughness]=finishes[kind];
  const m=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness});
  if(typeof document!=='undefined'){
    atlas??=new T.TextureLoader().load(new URL('./assets/world/bath-material-studies.webp',import.meta.url).href);
    atlas.anisotropy=4;
    m.onBeforeCompile=shader=>{
      shader.uniforms.artStudy={value:atlas};
      shader.vertexShader='varying vec3 studyP; varying vec3 studyN;\n'+shader.vertexShader
        .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nstudyN=normal;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nstudyP=position;');
      shader.fragmentShader=`varying vec3 studyP; varying vec3 studyN; uniform sampler2D artStudy;
        float materialDrawing(vec2 uv) {
          vec2 cell=vec2(${cx}.,${cy}.);
          vec2 folded=1.-abs(mod(uv,2.)-1.);
          return texture2D(artStudy,(cell+.006+.988*folded)*.5).r;
        }\n`+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 weights=pow(abs(normalize(studyN)),vec3(4.));
        weights/=max(.001,dot(weights,vec3(1.)));
        vec3 pos=studyP*${kind==='clay'?'.72':'.89'};
        float drawing=dot(weights,vec3(materialDrawing(pos.zy),materialDrawing(pos.xz),materialDrawing(pos.xy)));
        float wet=1.-smoothstep(.025,.26,studyP.y+.019*sin(studyP.x*5.1+studyP.z));
        diffuseColor.rgb*=(.55+.88*drawing)*(1.-.14*wet);`)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          vec3 tx=dFdx(vViewPosition),ty=dFdy(vViewPosition);
          vec3 by=cross(ty,normal),bx=cross(normal,tx);
          float jac=dot(tx,by);
          vec3 slope=(by*dFdx(drawing)+bx*dFdy(drawing))*sign(jac);
          normal=normalize(normal*max(abs(jac),1e-8)+slope*${kind==='slate'?'.022':kind==='clay'?'.008':'.012'});`)
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.22*(drawing-.49)-.20*wet,.19,.94);');
    };
    m.customProgramCacheKey=()=> 'bath-drawing-'+kind;
  }
  palette.set(kind,m);return m;
}
