import * as THREE from './vendor/three.module.min.js';

// Work in linear light until the last pass, so a little reflected sun on the
// wet dough can be brighter than flour without turning the whole face white.
export function createInkPass(renderer, camera) {
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
      painted: { value: target.texture },
      depthMap: { value: target.depthTexture },
      pixel: { value: new THREE.Vector2() },
      lens: { value: new THREE.Vector2() },
      clip: { value: new THREE.Vector2(camera.near, camera.far) },
      focus: { value: 0 },
    },
    vertexShader: `
      varying vec2 paperUV;
      void main() { paperUV=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `
      varying vec2 paperUV;
      uniform sampler2D painted,depthMap;
      uniform vec2 pixel,lens,clip;
      uniform float focus;
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
      vec3 edgeColor(vec2 uv, vec3 base) {
        float nw=brightness(texture2D(painted,uv+vec2(-pixel.x,pixel.y)).rgb);
        float ne=brightness(texture2D(painted,uv+pixel).rgb);
        float sw=brightness(texture2D(painted,uv-pixel).rgb);
        float se=brightness(texture2D(painted,uv+vec2(pixel.x,-pixel.y)).rgb);
        float lo=min(min(nw,ne),min(sw,se)), hi=max(max(nw,ne),max(sw,se));
        if(hi-lo<max(.045,hi*.12))return base;
        vec2 dir=vec2(sw+se-nw-ne,nw+sw-ne-se);
        float norm=max(abs(dir.x),abs(dir.y));
        vec2 along=dir/(norm+.025)*pixel*.58;
        return base*.20+.40*(texture2D(painted,uv+along).rgb+texture2D(painted,uv-along).rgb);
      }
      void main() {
        vec2 uv=paperUV;
        float z=meters(uv);
        vec3 c=edgeColor(uv,texture2D(painted,uv).rgb);
        vec3 p=viewPoint(uv,z);
        vec3 n=normalize(cross(dFdx(p),dFdy(p)) + vec3(0.,0.,.00000001));
        float a=meters(uv+vec2(pixel.x,0.)), b=meters(uv-vec2(pixel.x,0.));
        float d=meters(uv+vec2(0.,pixel.y)), e=meters(uv-vec2(0.,pixel.y));
        float ridge=smoothstep(.012,.085,max(a+b-2.*z,d+e-2.*z)/max(z,1.2));
        c*=1.-.28*ridge*(1.-smoothstep(66.,190.,z));
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
    prepare(scene) {
      // Compile with the very same offscreen format, lights and camera as draw().
      // This lets the driver link shaders while the CPU stages texture uploads.
      renderer.setRenderTarget(target);
      try {
        const landscape = renderer.compileAsync(scene, camera);
        renderer.setRenderTarget(null);
        return Promise.all([landscape, renderer.compileAsync(screen, lens)]);
      } finally {
        renderer.setRenderTarget(null);
      }
    },
    resize() {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      const w = Math.min(1.35, Math.max(1, renderer.getPixelRatio()));
      material.uniforms.pixel.value.set(w / size.x, w / size.y);
      const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      material.uniforms.lens.value.set(camera.aspect * halfFov, halfFov);
    },
    draw(scene, focusDistance = 0) {
      material.uniforms.focus.value = focusDistance;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(screen, lens);
    },
  };
}
