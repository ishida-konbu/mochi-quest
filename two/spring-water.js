import { springLip } from './retreat-layout.js';
import { waterSurfaceAt } from './terrain.js';
import * as T from './vendor/three.module.min.js';

const poolLevel = 0.189;
const uniforms = {
  poolTime: { value: 0 },
  reflected: { value: null },
  reflectionVP: { value: new T.Matrix4() },
  poolCenter: { value: new T.Vector2(10000, 10000) },
  occupied: { value: 0 },
};
let poolMaterial, disc, paintedPool;
export function addSpringSurface(parent, rx=1.96, rz=1.56, level=poolLevel, site=null, waterWash=null) {
  if (!poolMaterial) {
    disc = new T.CircleGeometry(1, 80);
    disc.rotateX(-Math.PI / 2);
    poolMaterial = new T.MeshPhysicalMaterial({
      color: 0x5d6e56,
      roughness: 0.16,
      metalness: 0,
      ior: 1.333,
      clearcoat: 0.56,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.3,
    });
    poolMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        'varying vec3 poolPoint;\n' +
        shader.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\npoolPoint=(modelMatrix*vec4(transformed,1.)).xyz;',
        );
      shader.fragmentShader =
        `
        varying vec3 poolPoint;
        uniform float poolTime,occupied;
        uniform vec2 poolCenter;
        uniform mat4 reflectionVP;
        uniform sampler2D reflected;
        float n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float pebble(vec2 p){
          vec2 k=floor(p), u=fract(p); u=u*u*(3.-2.*u);
          return mix(mix(n(k),n(k+vec2(1,0)),u.x),mix(n(k+vec2(0,1)),n(k+1.),u.x),u.y);
        }
        vec2 ripple(vec2 q,float t){
          vec2 d=q-poolCenter; float r=length(d);
          return .030*vec2(cos(q.x*9.+q.y*7.+t*1.6),sin(q.y*12.-t*1.4))
              +.019*vec2(sin(q.y*21.+q.x*5.-t*2.),cos(q.x*17.+t*1.8))
              +occupied*exp(-abs(r-.83)*1.9)*.087*sin(r*28.-t*3.8)*d/max(.015,r);
        }\n` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          `
        #include <color_fragment>
        vec2 wave=ripple(poolPoint.xz,poolTime);
        vec2 bed=poolPoint.xz*5.+wave;
        float speck=pebble(bed)*.58+pebble(bed*3.8)*.31+pebble(bed*14.)*.11;
        diffuseColor.rgb*=.63+speck*.83;
        diffuseColor.rgb+=vec3(.019,.014,.007)*pow(max(0.,sin(speck*18.+bed.x*.84+poolTime*.14)),5.);
      `,
        )
        .replace(
          '#include <normal_fragment_maps>',
          `
        #include <normal_fragment_maps>
        normal=normalize(mat3(viewMatrix)*vec3(wave.x,1.,wave.y));
      `,
        )
        .replace(
          '#include <opaque_fragment>',
          `
        if (occupied>.5 && distance(poolPoint.xz,poolCenter)<2.2) {
          vec4 uvh=reflectionVP*vec4(poolPoint,1.);
          vec2 uv=uvh.xy/uvh.w*.5+.5+wave*vec2(.13,.095);
          vec2 soft=vec2(.0023,.0031);
          vec4 mochi=texture2D(reflected,clamp(uv,.003,.997))*.5
             +texture2D(reflected,clamp(uv+soft,.003,.997))*.25
             +texture2D(reflected,clamp(uv-soft,.003,.997))*.25;
          float fresnel=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);
          outgoingLight=mix(outgoingLight,mochi.rgb,mochi.a*(.18+.38*pow(fresnel,1.8)));
          float ring=length((poolPoint.xz-poolCenter)*vec2(.92,1.10))+wave.x*.34;
          float thread=pow(.5+.5*cos(ring*48.-poolTime*4.1+sin(bed.x*.61)*.72),10.);
          outgoingLight+=vec3(.126,.104,.060)*thread*exp(-abs(ring-.91)*2.7);
        }
        #include <opaque_fragment>
      `,
        );
    };
  }
  let shape=disc;
  if(site) {
    shape=disc.clone();
    const points=shape.attributes.position;
    for(let i=1;i<points.count;i++){
      const x=points.getX(i),z=points.getZ(i),r=springLip(site.index,Math.atan2(z,x));
      points.setXYZ(i,x*r,0,z*r);
    }
    shape.computeBoundingSphere();
  }
  let material=poolMaterial;
  if(waterWash){
    if(!paintedPool){
      const paintedDisc=disc.clone(), uv=paintedDisc.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,.51+.48*uv.getX(i),.01+.48*uv.getY(i));
      const finish=poolMaterial.clone();
      finish.map=waterWash;finish.color.setHex(0x839785);
      finish.onBeforeCompile=poolMaterial.onBeforeCompile;
      paintedPool={shape:paintedDisc,material:finish};
    }
    shape=paintedPool.shape;material=paintedPool.material;
  }
  const surface = new T.Mesh(shape, material);
  surface.scale.set(rx, 1, rz);
  surface.position.y = level;
  surface.receiveShadow = true;
  parent.add(surface);
}

// Only the bather needs a second view. Trees and dawn light already reach the
// pool through image-based lighting. The small transparent target is created
// on the first bath and shared by every spring in the village.
export function createBathReflection(renderer, scene, hero) {
  const mirror = new T.PerspectiveCamera(),
    eye = new T.Vector3(),
    fwd = new T.Vector3();
  const skyColor = new T.Color(),
    up = new T.Vector3(0, 1, 0);
  let target;
  hero.traverse((part) => part.layers.enable(3));
  scene.traverse((part) => {
    if (part.isLight) part.layers.enable(3);
  });
  return (player, time, camera) => {
    uniforms.poolTime.value = time;
    uniforms.occupied.value = player.activity === 'bath' ? 1 : 0;
    if (!uniforms.occupied.value) return;
    if (!target) {
      target = new T.WebGLRenderTarget(384, 256, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
      uniforms.reflected.value = target.texture;
    }
    const waterY = player.inWater ? waterSurfaceAt(player.x,player.z) : player.y + poolLevel;
    uniforms.poolCenter.value.set(player.x, player.z);
    const clearAlpha = renderer.getClearAlpha(),
      bg = scene.background;
    const autoShadow = renderer.shadowMap.autoUpdate,
      last = renderer.getRenderTarget();
    renderer.getClearColor(skyColor);
    mirror.copy(camera);
    mirror.layers.set(3);
    eye.copy(camera.position);
    eye.y = 2 * waterY - eye.y;
    camera.getWorldDirection(fwd);
    fwd.y *= -1;
    mirror.position.copy(eye);
    mirror.up.set(0, 1, 0).applyQuaternion(camera.quaternion).reflect(up);
    mirror.lookAt(eye.add(fwd));
    mirror.updateMatrixWorld();
    uniforms.reflectionVP.value.multiplyMatrices(mirror.projectionMatrix, mirror.matrixWorldInverse);
    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0, 0);
    renderer.render(scene, mirror);
    renderer.setRenderTarget(last);
    renderer.setClearColor(skyColor, clearAlpha);
    renderer.shadowMap.autoUpdate = autoShadow;
    scene.background = bg;
  };
}
