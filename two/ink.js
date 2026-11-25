import * as THREE from './vendor/three.module.min.js';
import { peachHazeShader, peachHazeUniforms, updatePeachHaze } from './peach-haze.js';
import { submergedLightGLSL } from './underwater-light.js';

// Work in linear light until the last pass, so a little reflected sun on the
// wet dough can be brighter than flour without turning the whole face white.
export function createInkPass(renderer, camera) {
  // Use the same fine grain as the margin of the journal; a stationary sheet
  // avoids crawling noise on moving silhouettes and during camera turns.
  const paper = new THREE.TextureLoader().load(new URL('../assets/ui/paper.png', import.meta.url).href);
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  const hdr = renderer.extensions.has('EXT_color_buffer_float');
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
  });
  const size = new THREE.Vector2();
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...peachHazeUniforms(),
      painted: { value: target.texture },
      paperFibre: { value: paper },
      daylight: { value: 1 },
      depthMap: { value: target.depthTexture },
      pixel: { value: new THREE.Vector2() },
      lens: { value: new THREE.Vector2() },
      clip: { value: new THREE.Vector2(camera.near, camera.far) },
      focus: { value: 0 },
      joineryFaceDistance: { value: 0 },
      scroll: { value: 0 },
      inkFogDensity: { value: 0 },
      submergedWater: { value: new THREE.Vector3() },
      submergedFog: { value: new THREE.Color() },
      submergedEye: { value: new THREE.Vector4() },
      waterBasis: { value: new THREE.Matrix3() },
    },
    vertexShader: `
      varying vec2 paperUV;
      void main() { paperUV=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      varying vec2 paperUV;
      uniform sampler2D painted,depthMap,paperFibre;
      uniform vec2 pixel,lens,clip;
      uniform float focus,joineryFaceDistance,scroll,inkFogDensity,daylight;
      ${peachHazeShader}
      ${submergedLightGLSL}
      float meters(vec2 uv) {
        float d = texture2D(depthMap,uv).r;
        return clip.x*clip.y / (clip.y-d*(clip.y-clip.x));
      }
      vec3 viewPoint(vec2 uv,float z) {return vec3((uv*2.-1.)*lens*z, -z);}
      float occlusion(vec2 uv, vec3 p, vec3 n) {
        vec3 other=viewPoint(uv,meters(uv));
        vec3 diff=other-p;
        float dist=length(diff);
        return max(0.,dot(n,diff)/max(.001,dist)-.075) * (1.-smoothstep(.04,1.35,dist));
      }
      float brightness(vec3 c){ return sqrt(max(0.,dot(c,vec3(.2126,.7152,.0722)))); }
      vec3 edgeColor(vec2 uv, vec3 base, out float brush) {
        float nw=brightness(texture2D(painted,uv+vec2(-pixel.x,pixel.y)).rgb);
        float ne=brightness(texture2D(painted,uv+pixel).rgb);
        float sw=brightness(texture2D(painted,uv-pixel).rgb);
        float se=brightness(texture2D(painted,uv+vec2(pixel.x,-pixel.y)).rgb);
        float lo=min(min(nw,ne),min(sw,se)), hi=max(max(nw,ne),max(sw,se));
        // Deposit the colour contour on the darker bank only. This keeps
        // tiny eye highlights and the slivers of sky between branches open.
        brush=smoothstep(.055,.29,hi-lo)*smoothstep(.007,.14,hi-brightness(base));
        if(hi-lo<max(.045,hi*.12))return base;
        vec2 dir=vec2(sw+se-nw-ne,nw+sw-ne-se);
        float norm=max(abs(dir.x),abs(dir.y));
        vec2 along=dir/(norm+.025)*pixel*.58;
        return base*.20+.40*(texture2D(painted,uv+along).rgb+texture2D(painted,uv-along).rgb);
      }
      void main() {
        vec2 uv=paperUV;
        float z=meters(uv);
        float brush;
        vec3 c=edgeColor(uv,texture2D(painted,uv).rgb,brush);
        vec3 p=viewPoint(uv,z);
        vec3 n=normalize(cross(dFdx(p),dFdy(p)) + vec3(0.,0.,.00000001));
        float a=meters(uv+vec2(pixel.x,0.)), b=meters(uv-vec2(pixel.x,0.));
        float d=meters(uv+vec2(0.,pixel.y)), e=meters(uv-vec2(0.,pixel.y));
        float ridge=smoothstep(.012,.085,max(a+b-2.*z,d+e-2.*z)/max(z,1.2));
        // The lower, trailing side of a silhouette takes the belly of the
        // brush. The opposite side just catches its tip. Use the already
        // sampled depths so a fine twig costs the same as a broad roofline.
        vec2 outside=vec2(a-b,d-e);
        float drag=dot(outside,vec2(.52,-.85))/max(.04,length(outside));
        // The outline is applied after scene fog. Fade the ink along with
        // its tree so distant crowns do not draw dark wires over the haze.
        float inkVisibility=1.-peachHaze*smoothstep(22.,114.,z);
        c*=1.-.28*ridge*(1.-smoothstep(66.,190.,z))*inkVisibility;
        if (z<48.) {
          float portrait = focus>0. ? 1.-smoothstep(2.8,4.2,z) : 0.;
          vec2 stepUV=clamp(mix(.16,.064,portrait)/(z*lens),pixel*2.,pixel*32.);
          float occ=occlusion(uv+stepUV*vec2(.87,.39),p,n)
                   +occlusion(uv+stepUV*vec2(-.86,-.46),p,n)
                   +occlusion(uv+stepUV*vec2(-.29,.96),p,n)
                   +occlusion(uv+stepUV*vec2(.41,-.96),p,n)
                   +occlusion(uv+stepUV*vec2(.36,.27),p,n)
                   +occlusion(uv+stepUV*vec2(-.31,-.28),p,n);
          c*=exp(-mix(.235,.077,portrait)*occ*(1.-smoothstep(18.,48.,z)));
        }
        // The light portrait blur leaves small, distant ink silhouettes legible.
        if (focus>0. && z>focus+1.) {
          float blur=1.3*smoothstep(focus+1.,focus+16.,z);
          vec3 sum=c*3.; float count=3.;
          for(int i=0;i<4;i++) {
            float theta=(float(i)+.5)*1.5707963;
            vec2 tap=clamp(uv+pixel*blur*vec2(cos(theta),sin(theta)),pixel,1.-pixel);
            float accepted=smoothstep(focus+.5,focus+1.,meters(tap));
            sum+=texture2D(painted,tap).rgb*accepted;
            count+=accepted;
          }
          c=sum/count;
        }
        // On a face insert, the blade and grip lie ahead of the plane of
        // focus. Integrate a small aperture in linear colour before laying
        // down the ink; keep the crisp eyes and mouth behind that plane.
        if(joineryFaceDistance>0.){
          float defocus=smoothstep(.13,.70,(joineryFaceDistance-z)*joineryFaceDistance/max(.1,z));
          vec3 sum=c;float count=1.;
          for(int i=0;i<12;i++){
            float t=float(i)+.5;
            vec2 disk=sqrt(t/12.)*vec2(cos(t*2.39996),sin(t*2.39996));
            vec2 tap=clamp(uv+pixel*disk*7.*max(.68,defocus),pixel,1.-pixel);
            float source=meters(tap);
            // Light from a defocused near edge may spread over the focused
            // face just behind it. Other in-focus pixels retain their ink.
            float spread=smoothstep(.16,.74,(joineryFaceDistance-source)*joineryFaceDistance/max(.1,source));
            float weight=max(defocus,spread*smoothstep(.075,.24,z-source));
            sum+=weight*texture2D(painted,tap).rgb;count+=weight;
          }
          c=sum/count;brush*=1.-defocus;ridge*=1.-defocus;
        }
        c=valleyMist(c,viewPoint(uv,1.),z);
        c=underwaterLight(c,viewPoint(uv,1.),z);
        // Separate the drawing from the underlying wash. Reserved highlights
        // take the paper tone; only deep pools and contours carry dense ink.
        float paperLight = dot(c,vec3(.2126,.7152,.0722));
        float lean = smoothstep(.012,.31,paperLight) * (1.-smoothstep(.66,1.24,paperLight));
        float wash = paperLight + (.075 + .192*daylight) * lean;
        vec3 stock = mix(vec3(.99,1.,1.02),vec3(1.045,1.015,.934),daylight);
        float chroma = max(max(c.r,c.g),c.b) - min(min(c.r,c.g),c.b);
        // A pale distant wash gives way to the actual dye, glaze and lacquer at hand.
        float dye = smoothstep(.11,.54,chroma / (.038 + max(max(c.r,c.g),c.b)));
        float closeDye = 1.-smoothstep(12.,78.,z);
        vec3 drawing = wash*stock + (c-vec3(paperLight))*(.16+.21*dye+.55*dye*closeDye);
        vec3 glaze = c * (1. + .22*(wash-paperLight)/max(.018,paperLight));
        drawing=mix(drawing,glaze,.54*dye*closeDye);
        // A diluted wash exposes the sheet between distant trees and stones.
        // Keep the interior inks in night scenes and the colours of nearby clues.
        float reserve=smoothstep(13.,90.,z)*daylight*smoothstep(.09,.48,paperLight);
        drawing=mix(drawing,vec3(.90,.86,.76),.19*reserve);
        float fibre = texture2D(paperFibre,uv/(224.*pixel)).a;
        float fogPath = inkFogDensity*z;
        float stroke = max(ridge*(.86+.20*drag),brush*.72) * (1.-smoothstep(36.,168.,z));
        // Dry hairs skip a few raised fibres on light turns. A pressed line
        // remains full and tapers into those breaks as its direction changes.
        float skip=smoothstep(.021,.052,fibre)*(.20-.10*drag);
        float pressure=(.80+.08*scroll)*stroke*(1.-skip)*inkVisibility*exp(-fogPath*fogPath);
        drawing *= vec3(1.)-vec3(.94,.97,1.)*pressure;
        c = drawing*(1.-.53*fibre);
        // A gentle photographic shoulder preserves warm highlights in bright silk
        // and water, while leaving ordinary paper and ink at their original values.
        const float knee=.70;
        float peak=max(c.r,max(c.g,c.b));
        if (peak>knee) {
          float shoulder=knee+(1.-knee)*(1.-exp(-(peak-knee)/(1.-knee)));
          c*=shoulder/peak;
        }
        float l=dot(c,vec3(.2126,.7152,.0722));
        c=mix(vec3(l),c,1.025);
        gl_FragColor=vec4(max(c,vec3(0.)),1.);
        #include <colorspace_fragment>
      }`,
  });
  const screen = new THREE.Scene(),
    lens = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  screen.add(quad);
  return {
    paper,
    resize() {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      const w = Math.min(1.35, Math.max(1, renderer.getPixelRatio()));
      material.uniforms.pixel.value.set(w / size.x, w / size.y);
    },
    draw(scene, focusDistance = 0, scroll = 0, time = 0) {
      const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      material.uniforms.lens.value.set(camera.aspect * halfFov, halfFov);
      material.uniforms.clip.value.set(camera.near,camera.far);
      camera.updateWorldMatrix(true,false);
      updatePeachHaze(material.uniforms,camera,scene.fog,time);
      const water=scene.userData.submergedLight;
      material.uniforms.submergedWater.value.set(water?.amount || 0,water?.sun || 0,water?.marine || 0);
      if(water?.amount) {
        material.uniforms.submergedFog.value.copy(scene.fog.color);
        material.uniforms.waterBasis.value.setFromMatrix4(camera.matrixWorld);
        const eye=camera.position;
        material.uniforms.submergedEye.value.set(eye.x,eye.y-water.line,eye.z,time);
      }
      const light = scene.fog?.color;
      material.uniforms.daylight.value = light ? THREE.MathUtils.smoothstep(light.g, .085, .46) : 1;
      material.uniforms.scroll.value = scroll;
      material.uniforms.inkFogDensity.value = scene.fog?.density || 0;
      material.uniforms.focus.value = focusDistance;
      material.uniforms.joineryFaceDistance.value=camera.userData.joineryFaceDistance??0;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(screen, lens);
    },
  };
}
