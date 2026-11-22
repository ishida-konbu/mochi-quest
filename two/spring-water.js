import { bathPools,poolLip } from './bath-places.js';
import { SUZURI_LEDGE } from './kyo-bath-layout.js';
import { addBathLeaves } from './bath-leaves.js';
import { springLip } from './retreat-layout.js';
import { bathCraft,regionalBathFittings,inletImpactV } from './regional-bath-fittings.js';
import * as T from './vendor/three.module.min.js';

const uniforms = {
  poolTime: { value: 0 },
  reflected: { value: null },
  reflectionVP: { value: new T.Matrix4() },
  poolCenter: { value: new T.Vector2(10000, 10000) },
  poolForward: { value: new T.Vector2(0,1) },
  floatSize: { value: new T.Vector2(.85,.85) },
  occupied: { value: 0 },
};
let poolMaterial, disc, paintedPool;
const regionalWater=new Map();
const mineralWash={
  sakura:'#a1afa0',bamboo:'#768e78',earthen:'#8c9d8a',sulfur:'#c3cabb',paddy:'#a4ab81',
  shore:'#91b1ad',maple:'#939b81',susuki:'#8d9199',dawn:'#b1a994',capital:'#526869',
  peach:'#b0aa98',temple:'#96a494',inari:'#899d88',tsuruga:'#7e9ba2',sakai:'#87a89a',
};
// The inlet and shallow mineral fringe travel with their particular basin.
// The hero's reflection and its displacement continue to use world space.
function regionalFinish(site,pool) {
  const craft=bathCraft[site.kind],main=site.rank==='main',key=pool??(main?site.id:craft);
  if(regionalWater.has(key))return regionalWater.get(key);
  const m=poolMaterial.clone();m.color.set(pool?.tint??(main?mineralWash[site.kind]:craft.water));
  m.roughness=craft.rim==='sinter'?.43:.36;
  // In these shallow baths the actual stone backs, woven beds and bamboo
  // gratings remain visible beneath a thin moving film of spring water.
  const shallow=main && ['dawn','shore','susuki','bamboo'].includes(site.kind);
  if(shallow){m.transparent=true;m.opacity=.54;}
  m.specularIntensity=.43;
  m.clearcoat=.14;
  m.clearcoatRoughness=.40;
  m.onBeforeCompile=shader=>{
    poolMaterial.onBeforeCompile(shader);
    shader.vertexShader='attribute vec3 springInflow; varying vec3 source;\n'+
      shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsource=springInflow;');
    shader.uniforms.inkPool={value:site.shape==='suzuri'?1:0};
    const seat=SUZURI_LEDGE,inlet=regionalBathFittings(site,springLip).inlet;
    shader.uniforms.suzuriSeat={value:new T.Vector4(seat.u-inlet.u,seat.v-inlet.v-inletImpactV,seat.w/2,seat.d/2)};
    shader.uniforms.chalkPool={value:site.kind==='sulfur'?1:0};
    shader.fragmentShader='varying vec3 source; uniform float inkPool, chalkPool; uniform vec4 suzuriSeat;\n'+shader.fragmentShader.replace('vec2 bed=poolPoint.xz*5.+wave;',`
      float range=length(source.xy), phase=range*19.-poolTime*3.4;
      float fan=exp(-2.15*range);
      float broken=.63+.37*sin(source.x*7.4+source.y*4.1+sin(poolTime*.51));
      wave=wave*.58+fan*.22*sin(phase)*source.xy/max(.06,range);
      float edge=smoothstep(.74,.997,source.z);
      float ring=pow(.5+.5*cos(phase+.35*sin(source.y*6.6)),8.)*fan*broken;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.47,.45,.30),edge*.34);
      diffuseColor.rgb+=vec3(.19,.20,.17)*ring;
      if(inkPool>.5){
        // The eddy behind the water dropper pulls two fine ribbons of ink
        // across the sea of the inkstone. The centre stays open for the face.
        vec2 flow=source.xy+vec2(-.28,.21);
        float angle=atan(flow.y,flow.x), radius=length(flow);
        float curl=radius*3.7+1.55*sin(angle+.65*radius)-poolTime*.20;
        float trace=pow(.5+.5*cos(curl*3.0),15.)*(1.-smoothstep(.3,4.2,radius));
        diffuseColor.rgb*=1.-.31*trace;
        // Refracted granite treads underneath the shallows. Their outlines
        // follow the same dimensions as the bench that supports the body.
        vec2 slab=source.xy-suzuriSeat.xy+wave*.30;
        vec2 margin=abs(slab)-(suzuriSeat.zw-vec2(.24));
        float cut=length(max(margin,vec2(0.)))+min(max(margin.x,margin.y),0.)-.24;
        vec2 small=abs(slab-vec2(suzuriSeat.z+.19,0.))-vec2(.14,suzuriSeat.w-.18);
        float toe=length(max(small,vec2(0.)))+min(max(small.x,small.y),0.)-.068;
        float bench=1.-smoothstep(-.018,.042,cut);
        float tread=1.-smoothstep(-.018,.048,toe);
        float polish=.45+.55*pebble(slab*9.+wave*1.1);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.26,.25)*polish,tread*.43);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.25,.34,.30)*polish,bench*.58);
        diffuseColor.rgb+=vec3(.040,.059,.047)*exp(-40.*abs(cut+.048));
      }
      if(chalkPool>.5){
        float cloud=pebble(source.xy*.53+wave*.35+vec2(poolTime*.022,0.));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.67,.71,.59),cloud*.49);
      }
      vec2 bed=poolPoint.xz*5.+wave;`);
  };
  m.customProgramCacheKey=()=> 'regional-spring-ink-and-sinter';
  regionalWater.set(key,m);return m;
}
export function addSpringSurface(parent, rx=1.96, rz=1.56, level=.189, site=null, waterWash=null) {
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
        uniform vec2 poolCenter,poolForward,floatSize;
        uniform mat4 reflectionVP;
        uniform sampler2D reflected;
        float n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float pebble(vec2 p){
          vec2 k=floor(p), u=fract(p); u=u*u*(3.-2.*u);
          return mix(mix(n(k),n(k+vec2(1,0)),u.x),mix(n(k+vec2(0,1)),n(k+1.),u.x),u.y);
        }
        float floatRadius(vec2 d) {
          return length(vec2(dot(d,poolForward),dot(d,vec2(poolForward.y,-poolForward.x)))/floatSize);
        }
        vec2 ripple(vec2 q,float t){
          vec2 d=q-poolCenter; float r=floatRadius(d);
          return .030*vec2(cos(q.x*9.+q.y*7.+t*1.6),sin(q.y*12.-t*1.4))
              +.019*vec2(sin(q.y*21.+q.x*5.-t*2.),cos(q.x*17.+t*1.8))
              +occupied*exp(-abs(r-1.)*2.2)*.078*sin(r*26.-t*3.8)*d/max(.015,length(d));
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
        if (occupied>.5 && floatRadius(poolPoint.xz-poolCenter)<2.55) {
          vec4 uvh=reflectionVP*vec4(poolPoint,1.);
          vec2 uv=uvh.xy/uvh.w*.5+.5+wave*vec2(.13,.095);
          vec2 soft=vec2(.0023,.0031);
          vec4 mochi=texture2D(reflected,clamp(uv,.003,.997))*.5
             +texture2D(reflected,clamp(uv+soft,.003,.997))*.25
             +texture2D(reflected,clamp(uv-soft,.003,.997))*.25;
          float fresnel=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);
          outgoingLight=mix(outgoingLight,mochi.rgb,mochi.a*(.18+.38*pow(fresnel,1.8)));
          float ring=floatRadius(poolPoint.xz-poolCenter)+wave.x*.34;
          float thread=pow(.5+.5*cos(ring*48.-poolTime*4.1+sin(bed.x*.61)*.72),10.);
          outgoingLight+=vec3(.126,.104,.060)*thread*exp(-abs(ring-1.06)*3.);
        }
        #include <opaque_fragment>
      `,
        );
    };
  }
  const pools=site?bathPools(site):undefined;
  if(pools){
    for(const pool of pools)placeWater(parent,pool.rx,pool.rz,level+pool.y,site,null,pool);
  }else placeWater(parent,rx,rz,level,site,waterWash);
}
function placeWater(parent,rx,rz,level,site,waterWash,pool){
  let shape=disc,material=poolMaterial;
  if(site) {
    shape=disc.clone();
    const points=shape.attributes.position;
    const lip=pool?(a=>poolLip(pool,a)):site.lip || (a=>springLip(site.index,a));
    for(let i=1;i<points.count;i++){
      const x=points.getX(i),z=points.getZ(i),r=lip(Math.atan2(z,x));
      points.setXYZ(i,x*r,0,z*r);
    }
    shape.computeBoundingSphere();
    if(site.regional){
      const {inlet}=regionalBathFittings(site,springLip),flow=[];
      // One attribute on the existing fan suffices: interpolating the offset
      // reproduces exact distances, while the last channel follows the shore.
      for(let i=0;i<points.count;i++){
        flow.push(points.getX(i)*rx-(pool?0:inlet.u),points.getZ(i)*rz-(pool?-pool.rz*.85:inlet.v+inletImpactV),i===0?0:1);
      }
      shape.setAttribute('springInflow',new T.Float32BufferAttribute(flow,3));
      material=regionalFinish(site,pool);
    }
  }
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
  surface.position.set(pool?.u??0,level,pool?.v??0);
  surface.receiveShadow = true;
  parent.add(surface);
  if(site)addBathLeaves(parent,site,level,uniforms.poolTime,pool);
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
    uniforms.occupied.value = player.bathPose?.wet ? 1 : 0;
    if (!uniforms.occupied.value) return;
    if (!target) {
      target = new T.WebGLRenderTarget(384, 256, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
      uniforms.reflected.value = target.texture;
    }
    const waterY = player.bathWaterY;
    const bath=player.bathPose;
    uniforms.poolCenter.value.set(bath.x,bath.z);
    uniforms.poolForward.value.set(Math.sin(hero.rotation.y),Math.cos(hero.rotation.y));
    const g=T.MathUtils.lerp(player.buffs.full>0?1.28:1,.90,bath.kettle?bath.settle:0);
    uniforms.floatSize.value.set(g*(.82+1.09*bath.melt),g*(.83+.05*bath.recline));
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
