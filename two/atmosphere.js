import { HIGASHIYAMA, KITAYAMA, NISHIYAMA } from './higashiyama.js';
import { DISTRICTS } from './geography.js';
import { peachHazeWeight } from './peach-haze.js';
import { winterCloudGLSL, winterCloudTexture } from './winter-clouds.js';
import * as THREE from './vendor/three.module.min.js';
import { HDRLoader } from './vendor/HDRLoader.js';
import { kyoNight, kyoInfluence } from './kyo-layout.js';
import { seasonAt } from './terrain.js';

const asset = (name) => new URL('./assets/world/' + name, import.meta.url).href;
const color = (value) => new THREE.Color(value);
const palette = {
  sun: color(0xffe5bd),
  sky: color(0xfff5e3),
  earth: color(0x9a8675),
  fill: color(0xe6efff),
  ice: color('#cedefa'),
  cloudLight: color('#d4dfe6'),
  snowBounce: color('#bfccd3'),
  snow: color('#ecf4ff'),
  ember: color('#ffba7e'),
  blue: color('#9fb8e8'),
  darkEarth: color('#4a566c'),
  twilight: color('#ffdbb6'),
  fog: color('#d7d4bf'),
  peachFog: color('#d9d7cb'),
  winterFog: color('#b4bfc5'),
  fallFog: color('#d9bc99'),
  nightFog: color('#273b56'),
  dawnFog: color('#f5c3a3'),
};
const lighting = {};
function climateAtTime(player,time,out) {
  const climate=seasonAt(player.x,player.z,out);
  climate.moon=Math.max(climate.moon,kyoNight(time,player)*kyoInfluence(player.x,player.z));
  return climate;
}
export function applyClimateLights(hemisphere, sun, bounce, player,time=0) {
  const { snow, autumn, moon, dawn } = climateAtTime(player,time,lighting);
  sun.color
    .copy(palette.sun)
    .lerp(palette.snow, snow)
    .lerp(palette.ember, 0.47 * autumn + dawn)
    .lerp(palette.blue, moon);
  // A bank of snow cloud supplies mostly diffuse light. The weak remnant
  // of the key still shapes the roofs, with a broad, shallow cast shadow.
  sun.intensity = 2.35 - 1.78 * snow - 0.22 * autumn - 1.5 * moon - 0.35 * dawn;
  sun.shadow.intensity = 1 - .67 * snow;
  sun.shadow.radius = 1 + 2.4 * snow;
  sun.position.set(player.x + 35 + 30 * dawn - 20 * moon, player.y + 38 - 19 * dawn, player.z - 51 + 29 * dawn);
  hemisphere.color.copy(palette.sky).lerp(palette.cloudLight, snow).lerp(palette.twilight, dawn).lerp(palette.blue, moon);
  hemisphere.groundColor
    .copy(palette.earth)
    .lerp(palette.snowBounce, snow)
    .lerp(palette.darkEarth, moon);
  hemisphere.intensity = 1.02 + 0.45 * snow - 0.5 * moon;
  bounce.color
    .copy(palette.fill)
    .lerp(palette.snowBounce, snow)
    .lerp(palette.ice, moon)
    .lerp(palette.ember, 0.28 * dawn);
  bounce.intensity = 0.65 - 0.34 * moon - .38 * snow;
}

// The sky is painted in directions rather than positions so its horizon is
// continuous across the ocean seam. The real mountains below supply parallax.
function mountainSky(scene, panorama, winterWash) {
  const uniforms = {
    ridges: { value: panorama },
    winterWash: { value: winterWash },
    climate: { value: new THREE.Vector4() },
    clock: { value: 0 },
    horizonInk: { value: 1 },
    valleyHaze: {value:0}, valleyMist: {value:new THREE.Color()},
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      varying vec3 direction; uniform sampler2D ridges; uniform vec4 climate; uniform float clock,horizonInk,valleyHaze; uniform vec3 valleyMist;
      ${winterCloudGLSL}
      float hash(vec2 p) {
        vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);
        return fract((p3.x+p3.y)*p3.z);
      }
      float noise2(vec2 p) {
        vec2 i=floor(p), u=fract(p);u=u*u*(3.-2.*u);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);
      }
      float starField(vec2 at,float density) {
        vec2 cell=floor(at), local=fract(at);
        vec2 c=.15+.7*vec2(hash(cell),hash(cell+12.4));
        float brightness=hash(cell+84.3);
        return smoothstep(density,1.,brightness)*(1.-smoothstep(.012,.073,length(local-c)))*
          (.82+.18*sin(2.*clock+brightness*81.));
      }
      void main(){
        vec3 ray=normalize(direction);
        float snow=climate.x, fall=climate.y, night=climate.z, dawn=climate.w;
        float angle=atan(ray.x,-ray.z);
        float elevation=ray.y/max(.075,length(ray.xz));
        float high=smoothstep(.025,.78,ray.y);
        vec3 low=mix(vec3(.909,.776,.555),vec3(.70,.80,.88),snow);
        vec3 top=mix(vec3(.327,.486,.550),vec3(.298,.481,.66),snow);
        low=mix(low,vec3(.89,.62,.386),.43*fall);
        low=mix(low,vec3(1.,.449,.222),dawn);
        top=mix(top,vec3(.263,.288,.507),dawn);
        low=mix(low,vec3(.061,.098,.170),night);
        top=mix(top,vec3(.003,.008,.038),night);
        vec3 sky=mix(low,top,high);
        float cloudU=ray.x*.7+ray.z*.52;
        vec2 cloud=vec2(cloudU*3.2+clock*.002,ray.y*18.+ray.z*1.2);
        float vapour=.59*noise2(cloud)+.27*noise2(cloud*2.6)+.14*noise2(cloud*6.1);
        float silk=smoothstep(.49,.75,vapour)*smoothstep(.018,.14,ray.y)*(1.-smoothstep(.60,.94,ray.y));
        vec3 lining=mix(vec3(.96,.916,.814),vec3(1.,.71,.51),dawn);
        lining=mix(lining,vec3(.16,.19,.30),night);
        sky=mix(sky,lining,silk*(.19+.21*dawn-.05*night));
        vec3 sun=normalize(mix(vec3(.3,.235,-.94),vec3(.976,.094,-.192),dawn));
        float sunDist=length(ray-sun), halo=exp(-sunDist*(8.+5.*dawn));
        sky+=vec3(.19,.10,.033)*halo*(1.-night)*(1.+2.7*dawn);
        vec3 moon=normalize(vec3(.13,.26,-.96));
        float moonDist=length(ray-moon), glow=exp(-moonDist*14.);
        sky+=vec3(.115,.162,.228)*glow*night;
        vec2 chart=vec2(angle*23.,asin(clamp(ray.y,-1.,1.))*26.);
        float stars=starField(chart,.70)+starField(chart*2.19+100.,.89)*.46;
        sky+=vec3(.64,.79,1.)*stars*night*smoothstep(.07,.27,ray.y)*(1.-smoothstep(.052,.14,.15-moonDist))*(1.-silk*.7);
        float radius=.056;
        vec3 tangent=normalize(cross(moon,vec3(0,1,0))), up=cross(tangent,moon);
        vec2 lunar=vec2(dot(ray,tangent),dot(ray,up))/radius;
        float maria=.60*noise2(lunar*3.9+14.)+.26*noise2(lunar*8.3)+.14*noise2(lunar*21.);
        float relief=smoothstep(.46,.70,maria);
        vec3 lunarColor=mix(vec3(1.30,1.20,.9),vec3(.83,.79,.66),relief*.77);
        sky=mix(sky,lunarColor,(1.-smoothstep(radius-.001,radius+.001,moonDist))*night);
        sky=mix(sky,mix(vec3(1.12,.60,.30),vec3(1.48,1.15,.69),dawn),
                    (1.-smoothstep(.028,.030,sunDist))*(1.-night)*(1.-snow));
        // A low bank of cold cloud meets the horizon out beyond the northern bay.
        float winterOpening=snow*smoothstep(.08,.69,dot(ray.xz,vec2(.16,-.987)));
        float seaOpening=max(winterOpening,dawn*smoothstep(.18,.83,ray.x));
        float v=.20+elevation*(3.30+seaOpening*13.);
        float u=angle/3.14159265+.095;
        if(snow>.001) {
          sky=mix(sky,winterOvercast(ray,clock,valleyMist),snow);
          low=mix(low,valleyMist,snow);
        }
        vec3 scan=texture2D(ridges,vec2(u,clamp(v,.006,.995))).rgb;
        float value=dot(scan,vec3(.28,.56,.16));
        float ridge=smoothstep(.08,.87,1.-value/.61)*(1.-smoothstep(.87,1.02,v));
        ridge*=1.-seaOpening*.90;
        vec3 ink=mix(vec3(.185,.21,.17),vec3(.27,.38,.49),snow);
        ink=mix(ink,vec3(.012,.024,.051),night);
        ink=mix(ink,vec3(.42,.248,.245),dawn);
        vec3 col=mix(sky,ink,ridge*.75*horizonInk);
        col=mix(col,low,(1.-smoothstep(-.13,.01,ray.y)));
        col=mix(col,valleyMist,valleyHaze*(1.-smoothstep(-.030,.13,ray.y)));
        // The distant sea ends in scene fog. Carry its colour just over the
        // sunrise horizon so the edge of the water mesh leaves no orange stripe.
        col=mix(col,valleyMist,seaOpening*(1.-smoothstep(-.015,.048,ray.y)));
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1050, 48, 20), material);
  dome.renderOrder = -100;
  dome.frustumCulled = false;
  scene.add(dome);
  return dome;
}

export function createAtmosphere(scene) {
  const panorama = new THREE.TextureLoader().load(asset('ridgelines.webp'));
  panorama.colorSpace = THREE.SRGBColorSpace;
  panorama.wrapS = THREE.MirroredRepeatWrapping;
  panorama.anisotropy = 4;
  scene.background = new THREE.Color('#eadfc6');
  scene.fog = new THREE.FogExp2(palette.fog, 0.0057);
  const winterWash = winterCloudTexture();
  const dome = mountainSky(scene, panorama, winterWash);
  const region = {};
  new HDRLoader().load(asset('spruit-dawn.hdr'), (light) => {
    light.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = light;
    scene.environmentRotation.y = 0.62;
  });
  return {
    panorama, winterWash,
    climate: dome.material.uniforms.climate,
    update(time, player, camera) {
      const s = climateAtTime(player,time,region);
      dome.position.copy(camera.position);
      dome.material.uniforms.clock.value = time;
      dome.material.uniforms.climate.value.set(s.snow, s.autumn, s.moon, s.dawn);
      scene.fog.color
        .copy(palette.fog)
        .lerp(palette.winterFog, s.snow)
        .lerp(palette.fallFog, s.autumn)
        .lerp(palette.nightFog, s.moon)
        .lerp(palette.dawnFog, s.dawn);
      // Keep a distinct near slope, middle spur and pale far divide above
      // the valley mist. Fade the painted horizon behind the real mountains.
      const peachDistance=Math.hypot((player.x-DISTRICTS.peach.x-24)/318,(player.z-DISTRICTS.peach.z+23)/210);
      const peachAir=peachHazeWeight(player.x,player.z);
      scene.fog.color.lerp(palette.peachFog,peachAir*.86*(1-s.moon));
      const mountainDistance=Math.min(peachDistance,
        Math.hypot((player.x-DISTRICTS.inari.x+88)/292,(player.z-DISTRICTS.inari.z-99)/206));
      const mountain=1-THREE.MathUtils.smoothstep(mountainDistance,.6,1.35);
      const clearAir=mountain*(.67+.33*THREE.MathUtils.smoothstep(player.y,8,65));
      // Leave enough space between ink values to see the middle spurs
      // and the far ridge from either avenue, through a thin veil of haze.
      const view=camera.matrixWorld.elements;
      let hillView=0;
      for(const summit of [HIGASHIYAMA,KITAYAMA,NISHIYAMA]){
        const dx=summit.x-player.x,dz=summit.z-player.z,range=Math.hypot(dx,dz);
        const facing=-(dx*view[8]+dz*view[10])/Math.max(1,range);
        hillView=Math.max(hillView,(1-THREE.MathUtils.smoothstep(range,495,650))*THREE.MathUtils.smoothstep(facing,.26,.79));
      }
      // On the return view the rooftops lie hundreds of metres below the
      // summits. Give the valley the same evening air as its facing slope.
      const city=DISTRICTS.kyo,dx=city.x-player.x,dz=city.z-player.z,r=Math.hypot(dx,dz);
      const cityFacing=-(dx*view[8]+dz*view[10])/Math.max(r,1);
      const valleyView=THREE.MathUtils.smoothstep(player.y,13,55)*(1-THREE.MathUtils.smoothstep(r,480,660))*
        THREE.MathUtils.smoothstep(cityFacing,.25,.80);
      hillView=Math.max(hillView,.86*valleyView);
      dome.material.uniforms.valleyHaze.value=Math.max(valleyView,peachAir);
      dome.material.uniforms.valleyMist.value.copy(scene.fog.color);
      dome.material.uniforms.horizonInk.value=1-Math.max(.70*peachAir,.42*clearAir,.42*hillView);
      const openAir=.0057-Math.max(.0025*clearAir,.00415*hillView);
      const valleyAir=.0062-.0016*THREE.MathUtils.smoothstep(player.y,28,90);
      // Clear salt air leaves the fishing sail and ink-coloured reefs legible
      // from the pagoda. Snow is still visible on the inland approach.
      scene.fog.density = THREE.MathUtils.lerp(THREE.MathUtils.lerp(openAir,valleyAir,peachAir),.0048,s.snow) - .0008*s.dawn;
      scene.environmentIntensity = 0.67 - 0.51 * s.moon - .33 * s.snow;
      return valleyView;
    },
  };
}
