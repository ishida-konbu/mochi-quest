import * as T from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { buildHokoraJoinery } from './kaede-hokora-joinery.js';
import { buildHokoraRoof } from './kaede-hokora-roof.js';
import { buildHokoraStone } from './kaede-hokora-stone.js';

function shrineFinish() {
  const material = new T.MeshStandardMaterial({vertexColors:true, side:T.DoubleSide, roughness:.89});
  if (typeof document === 'undefined') return material;
  const loader = new T.TextureLoader();
  material.map = loader.load(new URL('./assets/world/kaede-hokora-grain.webp',import.meta.url).href);
  material.map.colorSpace = T.SRGBColorSpace;
  material.normalMap = loader.load(new URL('./assets/world/kaede-hokora-normal.webp',import.meta.url).href);
  material.map.anisotropy = material.normalMap.anisotropy = 4;
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute float finishId; varying float vFinish; varying vec3 vHokoraPoint;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFinish = finishId; vHokoraPoint = position;');
    // Each 512 px quadrant has a wrapped 16 px gutter. Take derivatives of
    // the continuous timber coordinates so mip levels stay stable at seams.
    shader.fragmentShader = `
      varying float vFinish;
      varying vec3 vHokoraPoint;
      vec4 hokoraSample(sampler2D sheet, vec2 uv) {
        float id = floor(vFinish + .5);
        vec2 tile = vec2(mod(id,2.), 1.-floor(id*.5));
        vec2 point = (tile + .03125 + .9375 * fract(uv)) * .5;
        return textureGrad(sheet, point, .46875*dFdx(uv), .46875*dFdy(uv));
      }
    ` + shader.fragmentShader
      .replace('#include <map_fragment>',`
        vec3 p = vHokoraPoint;
        float wetStone = 0.;
        if (vFinish < 3.5) {
          vec3 grain = hokoraSample(map,vMapUv).rgb;
          float lightness = dot(grain,vec3(.24,.62,.14));
          if (vFinish > 1.5 && vFinish < 2.5) {
            // Water darkens the low course. Moss follows a few chipped edges
            // on the spring side, broken by the actual mineral grain.
            float weather = .5 + .23*sin(14.*p.x + 3.*sin(12.*p.z + 7.*p.y))
                               + .17*cos(26.*p.z - 16.*p.y + 2.*cos(9.*p.x));
            float edge = smoothstep(.45,.75,max(abs(p.x),abs(p.z)*1.12));
            wetStone = (1.-smoothstep(-.03,.33,p.y))*(.51+.38*weather);
            float moss = smoothstep(.65,.85,weather + .13*edge + .14*(lightness-.28));
            moss *= .28 + .54*edge + .18*smoothstep(.10,.66,p.x);
            grain = mix(grain,vec3(.22,.225,.205),.33);
            grain = mix(grain,vec3(.094,.112,.054)*(.7+1.25*lightness),.73*moss);
            grain *= 1.-.30*wetStone;
          } else if (vFinish < .5) {
            // Grey exposed end boards, warmer sheltered panels and a low
            // tide-mark where the short posts seat on the damp granite.
            float exposed = smoothstep(.34,.56,max(abs(p.z),abs(p.x)*.78));
            grain = mix(grain,vec3(lightness*1.03,lightness,lightness*.90),.28*exposed);
            grain *= .82 + .18*smoothstep(.35,.56,p.y);
            float shelter = smoothstep(1.10,1.39,p.y)*(1.-smoothstep(1.38,1.50,p.y));
            grain *= 1.-.16*shelter;
          }
          diffuseColor.rgb *= grain;
        }
      `)
      .replace('#include <roughnessmap_fragment>',`
        #include <roughnessmap_fragment>
        roughnessFactor -= .24*wetStone;
        if (vFinish > 2.5 && vFinish < 3.5) roughnessFactor = .60;
      `)
      .replace('#include <metalnessmap_fragment>',`
        #include <metalnessmap_fragment>
        if (vFinish > 2.5 && vFinish < 3.5) metalnessFactor = .32;
      `)
      .replace('#include <normal_fragment_maps>',`
        if (vFinish < 3.5) {
          vec3 relief = hokoraSample(normalMap, vNormalMapUv).xyz * 2.-1.;
          normal = normalize(tbn * relief);
        }
      `);
  };
  return material;
}

export function buildKaedeDragonShrine() {
  const b = hokoraCarpentry();
  buildHokoraStone(b);
  buildHokoraJoinery(b);
  buildHokoraRoof(b);
  const mesh = new T.Mesh(b.finish(),shrineFinish());
  mesh.name = '楓清水の龍神祠';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
