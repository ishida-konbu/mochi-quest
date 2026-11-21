import * as THREE from './vendor/three.module.min.js';
import { HDRLoader } from './vendor/HDRLoader.js';

const asset = (name) => new URL('./assets/world/' + name, import.meta.url).href;

// Paint on a distant cylinder in world space. Looking across a valley from
// another bank changes which spurs overlap the traversable hillside.
function mountainSky(scene, panorama) {
  const uniforms = {
    ridges: { value: panorama },
    sunrise: { value: new THREE.Vector3(0.3, 0.235, -0.94).normalize() },
    parchment: { value: new THREE.Color('#f5e4c4') },
    skyHigh: { value: new THREE.Color('#9bb9c4') },
    mist: { value: new THREE.Color('#d6d3bd') },
    pigment: { value: new THREE.Color('#545e58') },
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
      varying vec3 direction;
      uniform vec3 sunrise, parchment, skyHigh, mist, pigment;
      uniform sampler2D ridges;
      void main() {
        vec3 ray = normalize(direction);
        vec2 heading = normalize(ray.xz + vec2(.0000001));
        float along = dot(cameraPosition.xz, heading);
        float range = -along + sqrt(max(1., along*along + 680.*680. - dot(cameraPosition.xz,cameraPosition.xz)));
        vec2 place = cameraPosition.xz + range * heading;
        float angle = atan(place.x, -place.y);
        float elevation = cameraPosition.y + ray.y * range / max(.03, length(ray.xz));
        float u = angle / 3.14159265 + .095;
        float v = .20 + elevation / (215. + 24.*sin(angle*3. + .8));
        vec3 scan = texture2D(ridges,vec2(u,clamp(v,.006,.995))).rgb;
        float value = dot(scan,vec3(.28,.56,.16));
        // The antique silk is a local white reference, so the same printed
        // line can read russet in sunlight and cool blue in the far haze.
        float density = clamp(1.-value/.61,0.,1.);
        float relief = smoothstep(.09,.82,density);
        float zenith = smoothstep(.10,.92,ray.y);
        vec3 sky = mix(parchment,skyHigh,zenith);
        float sunDistance = length(ray-sunrise);
        sky += vec3(.15,.078,.021)*exp(-sunDistance*3.9);
        vec3 rangeColor = mix(sky,mix(pigment,scan,.15),relief*.79);
        rangeColor += (scan-vec3(value))*.090;
        float paper = (value-.50)*.10;
        vec3 col = mix(sky,rangeColor + paper,1.-smoothstep(.93,1.10,v));
        col = mix(mist,col,smoothstep(-60.,10.,elevation));
        float disc = 1.-smoothstep(.027,.0287,sunDistance);
        float flecks = dot(texture2D(ridges,vec2(u*3.,.97 + .012*sin(v*8.))).rgb,vec3(.3333));
        col = mix(col,vec3(1.,.51,.24)*(.96+.08*flecks),disc*(1.-relief));
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1050, 56, 28), material);
  dome.renderOrder = -100;
  dome.frustumCulled = false;
  scene.add(dome);
  return dome;
}

// A ring of low spurs sits beyond the playable terrain. It has a real near
// bank, shoulders and saddles: moving sideways separates these ink washes
// from the higher panoramic ridges behind them.
function foothills(scene, panorama) {
  const points = [],
    uvs = [],
    tones = [],
    indices = [];
  const slices = 400,
    rows = 18,
    tint = new THREE.Color();
  const valley = new THREE.Color('#c0bb9f'),
    slope = new THREE.Color('#858e78');
  const tau = Math.PI * 2;
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= slices; i++) {
      const a = (i / slices) * tau,
        dx = Math.sin(a),
        dz = -Math.cos(a);
      const w = a + 0.065 * Math.sin(a * 7) + 0.026 * Math.sin(a * 15 + v);
      const inner = 273 / Math.max(Math.abs(dx), Math.abs(dz));
      const radius = inner + 148 * v;
      const band = Math.pow(Math.sin(Math.PI * v), 1.4);
      const promontory =
        0.54 + 0.27 * Math.sin(w * 6 + 0.65) + 0.12 * Math.cos(w * 11) + 0.07 * Math.sin(w * 32);
      const ravine = 3.5 * Math.sin(21 * w + v * 6) + 1.7 * Math.cos(53 * w - v * 9);
      const height = -10 + band * (13 + 58 * promontory + ravine);
      points.push(radius * dx, height, radius * dz);
      uvs.push((a / Math.PI) * 3.0 + 0.16 * v, 0.19 + 0.54 * v + 0.1 * Math.sin(a * 9 + v * 5));
      tint.copy(valley).lerp(slope, band * (0.5 + promontory * 0.38));
      tint.toArray(tones, tones.length);
      if (i < slices && j < rows) {
        const k = j * (slices + 1) + i,
          l = k + slices + 1;
        indices.push(k, k + 1, l, k + 1, l + 1, l);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(tones, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const ink = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, map: panorama });
  ink.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      float stroke = dot(texture2D(map, vMapUv).rgb, vec3(.27,.57,.16));
      diffuseColor.rgb *= .74 + .54 * stroke;
    `,
    );
  };
  scene.add(new THREE.Mesh(geo, ink));
}

export function createAtmosphere(scene) {
  const panorama = new THREE.TextureLoader().load(asset('ridgelines.webp'));
  panorama.colorSpace = THREE.SRGBColorSpace;
  panorama.wrapS = THREE.MirroredRepeatWrapping;
  panorama.anisotropy = 4;
  scene.background = new THREE.Color('#eadfc6');
  scene.fog = new THREE.FogExp2('#d7d4bf', 0.00295);
  const dome = mountainSky(scene, panorama);
  foothills(scene, panorama);
  new HDRLoader().load(asset('spruit-dawn.hdr'), (light) => {
    light.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = light;
    scene.environmentIntensity = 0.67;
    scene.environmentRotation.y = 0.62;
  });
  return {
    panorama,
    update(time, player, camera) {
      if (camera) dome.position.copy(camera.position);
    },
  };
}
