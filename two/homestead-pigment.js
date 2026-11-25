import * as T from './vendor/three.module.min.js';
import { cookingAtlas } from './cooking-atlases.js';

let maps, finish;
// The shrine and the player's carpentry use the same photographs and normal
// relief. Both material programs sample one GPU copy of each atlas.
export function carpentryMaps() {
  if (maps) return maps;
  const loader = new T.TextureLoader();
  const map = loader.load(new URL('./assets/world/kaede-hokora-grain.webp',import.meta.url).href);
  const normalMap = loader.load(new URL('./assets/world/kaede-hokora-normal.webp',import.meta.url).href);
  map.colorSpace = T.SRGBColorSpace;
  normalMap.anisotropy = map.anisotropy = 4;
  maps = {map, normalMap};
  return maps;
}

export function homesteadFinish() {
  if (finish) return finish;
  finish = new T.MeshStandardMaterial({vertexColors:true, side:T.DoubleSide, roughness:.91});
  if (typeof document === 'undefined') return finish;
  Object.assign(finish,carpentryMaps());
  const cloth = cookingAtlas('materials');
  finish.onBeforeCompile = shader => {
    shader.uniforms.fibreSheet = {value:cloth};
    shader.vertexShader = 'attribute float finishId; varying float craftFinish;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n craftFinish = finishId;');
    shader.fragmentShader = `
      varying float craftFinish;
      uniform sampler2D fibreSheet;
      vec4 joinerySheet(sampler2D sheet, vec2 uv) {
        float id = craftFinish>9.5 ? 1. : floor(craftFinish+.5);
        vec2 cell = vec2(mod(id,2.), 1.-floor(id*.5));
        vec2 point = (cell+.03125+.9375*fract(uv))*.5;
        return textureGrad(sheet,point,.46875*dFdx(uv),.46875*dFdy(uv));
      }
      vec3 fibreTile(vec2 uv,vec2 cell) {
        vec2 point = (cell+vec2(.025)+.95*fract(uv))*vec2(.25,.5);
        return textureGrad(fibreSheet,point,dFdx(uv)*vec2(.2375,.475),dFdy(uv)*vec2(.2375,.475)).rgb;
      }
      float grainMark(vec2 uv,vec2 ctr,float tilt) {
        vec2 p=uv-ctr;
        p=mat2(cos(tilt),sin(tilt),-sin(tilt),cos(tilt))*p;
        float r=length(p/vec2(.069,.153));
        return 1.-smoothstep(.88,1.0+fwidth(r),r);
      }
    ` + shader.fragmentShader
      .replace('#include <map_fragment>', `
        if (craftFinish < 3.5) {
          vec3 woodOrStone = joinerySheet(map,vMapUv).rgb;
          diffuseColor.rgb *= mix(woodOrStone,vec3(dot(woodOrStone,vec3(.26,.55,.19))),.16);
        } else if (craftFinish>11.5) {
          // Waxed culm skin has a soft longitudinal sheen and narrow fibres.
          float rib=vMapUv.y*85.+.13*sin(vMapUv.x*11.);
          float fibre=dot(fibreTile(vMapUv*vec2(.46,1.3),vec2(2.,0.)),vec3(.27,.55,.18));
          float stria=cos(6.283*rib)*(1.-smoothstep(.22,.70,fwidth(rib)));
          diffuseColor.rgb*=(.77+.32*fibre)*(1.+.055*stria);
        } else if (craftFinish>10.5) {
          // Bundles appear as fine pores on a cut culm wall; its node below
          // the hollow is a sheet of pith with scattered short fibres.
          vec2 p=vMapUv*43.;
          vec2 cell=floor(p),jitter=fract(sin(vec2(dot(cell,vec2(13.3,7.9)),dot(cell,vec2(6.1,12.7))))*2513.);
          float pore=1.-smoothstep(.057,.19,length(fract(p)-(.21+.58*jitter)));
          float visible=1.-smoothstep(.21,.86,max(fwidth(p.x),fwidth(p.y)));
          float fibre=dot(fibreTile(vMapUv,vec2(2.,0.)),vec3(.27,.55,.18));
          diffuseColor.rgb*=(.72+.34*fibre)*(1.-.32*mix(.04,pore,visible));
        } else if (craftFinish>9.5) {
          // Standing trunks carry the wood's family dye. The bark atlas supplies
          // its fissures here without staining a pale birch cedar-brown.
          vec3 bark = joinerySheet(map,vMapUv).rgb;
          float relief = dot(bark,vec3(.26,.55,.19));
          diffuseColor.rgb *= .21 + .99*sqrt(relief);
        } else if (craftFinish>8.5) {
          diffuseColor.rgb *= fibreTile(vMapUv,vec2(2.,1.));
        } else if(craftFinish>7.5) {
          vec2 p=(vMapUv-vec2(.467,.515))*2.7;
          float angle=atan(p.y,p.x),radius=length(p);
          float ring=radius*(1.+.036*sin(3.*angle)+.021*cos(5.*angle));
          float phase=70.*ring+1.4*sin(11.*ring)+.16*sin(5.*angle);
          float bands=mix(.32,smoothstep(.34,.93,sin(phase)),1.-smoothstep(.8,3.1,fwidth(phase)));
          float grain=dot(fibreTile(vMapUv,vec2(2.,0.)),vec3(.27,.55,.18));
          float split=(1.-smoothstep(.004,.013,abs(p.y-.29*p.x-.014*sin(11.*p.x))))*smoothstep(.40,.77,p.x);
          diffuseColor.rgb*=(.73+.26*grain)*(.96-.19*bands-.46*split);
        } else {
          vec2 uv=vMapUv;
          if(craftFinish>6.5){
            // Alternating split rushes run across the bed. A dark doubled
            // warp dives beneath every other strand and appears on the next.
            float reed=uv.y*136., thread=uv.x*31., fade=1.-smoothstep(.12,.6,fwidth(reed));
            float ridge=cos(reed*6.283+.2*sin(uv.x*14.));
            float knot=(1.-smoothstep(.035,.12,abs(fract(thread)-.5)))*(.55+.45*cos(3.14159*reed));
            diffuseColor.rgb*=1.-fade*(.17*(.5+.5*ridge)+.23*knot);
            float border=step(.115,uv.y)*step(uv.y,.144)+step(.847,uv.y)*step(uv.y,.875);
            diffuseColor.rgb*=1.-.28*border;
            uv*=vec2(1.6,2.6);
          }
          float woven=dot(fibreTile(uv,vec2(0.)),vec3(.27,.55,.18));
          diffuseColor.rgb *= clamp(.20+1.12*woven,.48,1.17);
        }
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        if(craftFinish>5.5 && craftFinish<6.5){
          vec2 uv=vMapUv;
          float crest=max(grainMark(uv,vec2(.33,.48),-.84),max(
            grainMark(uv,vec2(.50,.36),0.),grainMark(uv,vec2(.67,.48),.84)));
          float hem=smoothstep(.856,.868,uv.y)*(1.-smoothstep(.883,.896,uv.y));
          float woven=dot(fibreTile(uv,vec2(0.)),vec3(.27,.55,.18));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.67,.63,.49)*(.65+.36*woven),max(crest,.67*hem));
        }
      `)
      .replace('#include <normal_fragment_maps>', `
        if (craftFinish < 3.5 || (craftFinish>9.5 && craftFinish<10.5)) {
          vec3 relief = joinerySheet(normalMap,vNormalMapUv).xyz*2.-1.;
          relief.xy *= .72;
          normal = normalize(tbn*relief);
        }
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if (craftFinish > 2.5 && craftFinish < 3.5) roughnessFactor = .60;
        if (craftFinish > 11.5) roughnessFactor = .60;
      `)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        if (craftFinish > 2.5 && craftFinish < 3.5) metalnessFactor = .25;
      `);
  };
  return finish;
}
