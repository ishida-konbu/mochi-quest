import * as THREE from './vendor/three.module.min.js';

// Ink collects on the near side of a silhouette. Sampling the depth buffer keeps
// contours attached to real geometry as the player turns or moves around it.
export function createInkPass(renderer, camera) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
    colorSpace: THREE.SRGBColorSpace,
  });
  const size = new THREE.Vector2();
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      painted: { value: target.texture },
      depthMap: { value: target.depthTexture },
      stepUV: { value: new THREE.Vector2(1, 1) },
      clip: { value: new THREE.Vector2(camera.near, camera.far) },
    },
    vertexShader: `varying vec2 paperUV;
      void main(){paperUV=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `varying vec2 paperUV;uniform sampler2D painted,depthMap;uniform vec2 stepUV,clip;
      float meters(vec2 uv){
        float d=texture2D(depthMap,uv).r;
        return clip.x*clip.y/(clip.y-d*(clip.y-clip.x));
      }
      void main(){
        vec2 uv=paperUV;
        vec3 c=texture2D(painted,uv).rgb;
        float z=meters(uv);
        float dx=meters(uv+vec2(stepUV.x,0.))+meters(uv-vec2(stepUV.x,0.))-2.*z;
        float dy=meters(uv+vec2(0.,stepUV.y))+meters(uv-vec2(0.,stepUV.y))-2.*z;
        float ink=smoothstep(.011,.065,max(dx,dy)/max(1.2,z))*(1.-smoothstep(80.,250.,z));
        float fiber=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453)-.5;
        c=mix(c,c*vec3(.36,.37,.34),ink*(.59+.09*fiber));
        // A little paper shows through in shaded ink, as in diluted sumi.
        float value=dot(c,vec3(.2126,.7152,.0722));
        c=mix(vec3(value),c,1.055);
        c=c*vec3(.991,1.003,1.037)+vec3(.006,.007,.009)*(1.-smoothstep(.05,.67,value));
        gl_FragColor=vec4(max(c*(1.+fiber*.011),vec3(0.)),1.);
        #include <colorspace_fragment>
      }`,
  });
  const screen = new THREE.Scene(),
    lens = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  screen.add(quad);
  return {
    resize() {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      const w = Math.min(1.4, Math.max(1, renderer.getPixelRatio()));
      material.uniforms.stepUV.value.set(w / size.x, w / size.y);
    },
    draw(scene) {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(screen, lens);
    },
  };
}
