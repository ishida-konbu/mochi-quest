import { buildKaedeDragonShrine } from './kaede-dragon-shrine.js';
import { KAEDE_DRAGON_SHRINE } from './kaede-dragon-layout.js';
import { prepareKaedeGround } from './kaede-grove.js';
import { dressSnowBath } from './snow-bath.js';
import * as THREE from './vendor/three.module.min.js';
import { snowDaruma } from './snow-daruma.js';
import { visitSnowFixtures,visitMoonFixtures,visitMapleFixtures,visitDawnFixtures } from './seasonal-fixtures.js';
export { MAPLE_ROCK_GROUPS } from './seasonal-fixtures.js';
import { dressWinterCoast } from './winter-coast.js';
import { terrainHeight as height, terrainContactHeight, seeded, BUILDINGS, nearRoad, TSUKIMI, springRadius } from './terrain.js';

const tau = 2 * Math.PI;
const { sin, cos } = Math;
const point = (x, y, z) => new THREE.Vector3(x, y, z);

function lathe(profile, sides) {
  return new THREE.LatheGeometry(
    profile.map(([radius, y]) => new THREE.Vector2(radius, y)),
    sides,
  );
}

// Objects within a vignette are built in a shared local frame, so the pieces can be circled.
function frame(p, x, z, yaw = 0, base = height(x, z)) {
  const at = (a, b, c) => point(x + a * cos(yaw) + c * sin(yaw), base + b, z - a * sin(yaw) + c * cos(yaw));
  return {
    part(shape, a, b, c, w, h, d, color, mat = p.fine, ry = 0, rx = 0, rz = 0, shadow = true) {
      const q = at(a, b, c);
      p.part(shape, q.x, q.y, q.z, w, h, d, color, yaw + ry, rx, rz, mat, shadow, true);
    },
    link(a, b, r, color, mat = p.wood, shadow = true) {
      p.link(at(...a), at(...b), r, color, false, shadow, true, mat);
    },
  };
}

function snowTown(p, light) {
  visitSnowFixtures((...args)=>frame(p,...args),p,light,snowDaruma(p),seeded(238247),nearRoad,springRadius);
}

function bladeGeometry() {
  const rng = seeded(1964),
    pos = [],
    index = [];
  function blade(nodes, widths) {
    const offset = pos.length / 3;
    for (let j = 0; j < nodes.length; j++) {
      const [x, y, z] = nodes[j],
        w = widths[j];
      pos.push(x - w, y, z, x, y + 0.007, z + 0.022, x + w, y, z);
      if (j + 1 < nodes.length) {
        const k = offset + j * 3;
        index.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5);
      }
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = rng() * tau,
      l = 0.42 + 0.59 * rng(),
      lean = 0.12 + rng() * 0.35;
    const nodes = [],
      w = [];
    for (let j = 0; j <= 6; j++) {
      const q = j / 6;
      nodes.push([
        cos(a) * (0.04 + q * q * lean),
        l * q * (1 - 0.37 * q * q),
        sin(a) * (0.04 + q * q * lean),
      ]);
      w.push(0.017 * Math.sin(q * Math.PI) ** 0.65 + 0.001);
    }
    blade(nodes, w);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
function plumesGeometry() {
  const pos = [],
    cols = [],
    ix = [],
    rng = seeded(72563);
  for (let n = 0; n < 5; n++) {
    const a = n * 2.4 + 0.19,
      l = 0.78 + rng() * 0.44,
      lean = 0.12 + rng() * 0.32;
    const stem = (q) => point(cos(a) * q * q * lean, l * (q - 0.15 * q * q * q), sin(a) * q * q * lean);
    const ink = (q) => [0.65 + 0.3 * q, 0.55 + 0.3 * q, 0.37 + 0.32 * q];
    function ribbon(b, e, width, col) {
      const k = pos.length / 3;
      pos.push(
        b.x - width,
        b.y,
        b.z,
        b.x + width,
        b.y,
        b.z,
        e.x + width * 0.28,
        e.y,
        e.z,
        e.x - width * 0.28,
        e.y,
        e.z,
      );
      for (let j = 0; j < 4; j++) cols.push(...col);
      ix.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    for (let j = 0; j < 12; j++) ribbon(stem(j / 12), stem((j + 1) / 12), 0.006, ink(0.1));
    for (let j = 0; j < 19; j++) {
      const q = 0.64 + j * 0.0182,
        b = stem(q),
        side = j % 2 === 0 ? 1 : -1,
        fan = (1 - (q - 0.64) * 2.0) * (0.053 + rng() * 0.035);
      const tip = b
        .clone()
        .add(
          point(cos(a) * 0.045 + side * fan, 0.052 - 0.042 * (1 - q), sin(a) * 0.041 + fan * (rng() - 0.5)),
        );
      ribbon(b, tip, 0.007 + rng() * 0.003, ink(0.5 + 0.5 * rng()));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  return geo;
}
function moonField(p, light) {
  const silverSilk = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    emissive: '#818477',
    emissiveIntensity: 0.37,
  });
  const rng = seeded(395),
    f = frame(p, TSUKIMI.x, TSUKIMI.z, TSUKIMI.yaw);
  // A sanbō has a folded rim and three open sides beneath its tray.
  f.part('box', 0, 0.066, 0, 1.54, 0.13, 1.2, '#72503b', p.wood);
  f.part('box', 0, 0.3, 0, 0.89, 0.43, 0.78, '#bd9868', p.wood);
  for (const side of [-1, 1]) {
    f.part('ball', side * 0.449, 0.29, 0, 0.006, 0.11, 0.145, '#594534', p.wood);
    f.part('ball', 0, 0.29, side * 0.393, 0.13, 0.103, 0.007, '#594534', p.wood);
  }
  f.part('box', 0, 0.57, 0, 1.28, 0.108, 1.16, '#d0af7b', p.wood);
  f.part('box', 0, 0.634, 0, 1.15, 0.019, 1.02, '#f1e9d7', p.fine, 0.07);
  for (const side of [-1, 1]) {
    f.part('box', 0, 0.658, side * 0.564, 1.28, 0.091, 0.039, '#ab8355', p.wood);
    f.part('box', side * 0.626, 0.658, 0, 0.039, 0.091, 1.16, '#ab8355', p.wood);
  }
  for (let i = 0; i < 580; i++) {
    const angle = rng() * tau,
      rad = 3.7 + 39 * rng() ** 0.77;
    const x = -55 + cos(angle) * rad,
      z = 290 + sin(angle) * rad * 0.78;
    if (
      nearRoad(x, z, 0.22) ||
      (x + 69) ** 2 + (z - 282) ** 2 < 9 ** 2 ||
      Math.hypot(x + 51.7, z - 285.9) < 2.5
    )
      continue;
    const s = 0.92 + rng() * 0.9,
      y = height(x, z),
      yaw = rng() * tau;
    if (y < 0.6) continue;
    p.part('rush', x, y, z, s, s, s, '#869267', yaw, 0, 0, p.fine, false, true);
    p.part('plumes', x, y, z, s, s, s, i % 4 ? '#dec99b' : '#f3dcad', yaw, 0, 0, silverSilk, false, true);
  }
  for (let i = 0; i < 35; i++) {
    const x = -48.2 + rng() * 4.4,
      z = 280.3 + rng() * 7;
    const y = height(x, z),
      s = 0.97 + rng() * 0.95,
      yaw = rng() * tau;
    p.part('rush', x, y, z, s, s, s, '#8d966b', yaw, 0, 0, p.fine, false, true);
    p.part('plumes', x, y, z, s, s, s, '#f9e5b4', yaw, 0, 0, silverSilk, false, true);
  }
  visitMoonFixtures((...args)=>frame(p,...args),p,light,silverSilk);
}
function dawnShore(p) {
  visitDawnFixtures((...args)=>frame(p,...args),p);
}
export function* prepareSeasonalPlaces(p,kaedePaths) {
  p.shapes.snowLump = new THREE.SphereGeometry(1, 22, 14);
  p.shapes.muffler = lathe(
    [
      [0.87, -0.5],
      [0.98, -0.4],
      [1, -0.16],
      [0.96, 0.02],
      [0.995, 0.21],
      [0.96, 0.45],
      [0.86, 0.5],
    ],
    24,
  );
  p.shapes.bucket = lathe(
    [
      [0, 0],
      [1, 0],
      [1, 0.07],
      [0.97, 0.12],
      [0.82, 0.95],
      [0.78, 1],
      [0, 1],
    ],
    24,
  );
  p.shapes.vase = lathe(
    [
      [0.47, 0],
      [0.75, 0.05],
      [0.96, 0.34],
      [1, 0.58],
      [0.82, 0.79],
      [0.68, 0.88],
      [0.74, 0.96],
      [0.75, 1],
      [0.6, 0.99],
      [0.61, 0.85],
    ],
    26,
  );
  p.shapes.rush = bladeGeometry();
  p.shapes.plumes = plumesGeometry();
  const light = new THREE.MeshBasicMaterial();
  snowTown(p, light);
  dressWinterCoast(p);
  dressSnowBath(p,frame,light);
  moonField(p, light);
  yield* prepareKaedeGround(p,kaedePaths);
  visitMapleFixtures((...args)=>frame(p,...args),p);
  const shrine=buildKaedeDragonShrine();
  const {x,z,yaw}=KAEDE_DRAGON_SHRINE;
  p.shapes.kaedeDragonShrine=shrine.geometry;
  p.part('kaedeDragonShrine',x,terrainContactHeight(x,z),z,1,1,1,'#ffffff',yaw,0,0,shrine.material,true,true);
  dawnShore(p);
}
export function seasonalWeather(scene) {
  const geo = new THREE.BufferGeometry(),
    rng = seeded(837);
  const pos = [],
    phase = [];
  for (let i = 0; i < 3510; i++) {
    pos.push(rng() * 32, rng() * 17, rng() * 32);
    phase.push(rng());
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.Float32BufferAttribute(phase, 1));
  const roofs = BUILDINGS.filter((b) => b.snow);
  const frames = roofs.map((b) => new THREE.Vector4(b.x, b.z, cos(b.yaw), sin(b.yaw)));
  const eaves = roofs.map((b) => new THREE.Vector3(b.w * 0.61, b.d * 0.63, b.y + b.wall + 0.32));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      clock: { value: 0 },
      center: { value: point(0, 0, 0) },
      amount: { value: 0 },
      viewport: { value: new THREE.Vector2() },
      frames: { value: frames },
      eaves: { value: eaves },
    },
    vertexShader: `uniform float clock,amount; uniform vec2 viewport; uniform vec3 center;
    attribute float seed; varying float opacity,turn,tint;
    uniform vec4 frames[${roofs.length}]; uniform vec3 eaves[${roofs.length}];
    void main(){vec3 span=vec3(32.,17.,32.);
      float gust=clock*.57+position.z*.12, flutter=clock*(.8+seed*.5)+seed*50.;
      vec3 falling=position+vec3(clock*.35+.64*sin(gust)+.25*sin(flutter),
        -clock*(.68+.74*seed),.33*cos(gust*.81)+.22*cos(flutter));
      vec3 local=mod(falling-center+span*.5,span)-span*.5;
      vec4 eye=viewMatrix*vec4(center+local,1.);gl_Position=projectionMatrix*eye;
      // Physical size in metres, projected into the actual drawing buffer
      // so powder stays legible on the sea horizon and on high-density screens.
      float pixels=viewport.y*.5*projectionMatrix[1][1];
      float size=mix(.027,.072,seed*seed);
      float scale=clamp(viewport.y/770.,.72,2.5);
      gl_PointSize=clamp(pixels*size/max(1.,-eye.z),2.05*scale,9.*scale);
      opacity=amount*(.66+.31*seed)*(1.-smoothstep(11.,16.,length(local.xz)))*
        (1.-smoothstep(7.0,8.5,abs(local.y)))*smoothstep(.3,1.55,-eye.z);
      turn=flutter*.6;
      tint=.5+.5*cos(flutter*.77+position.y);
      vec3 world=center+local;
      for(int i=0;i<${roofs.length};i++){
        vec2 d=world.xz-frames[i].xy, axes=frames[i].zw;
        vec2 floorPlan=abs(vec2(d.x*axes.x-d.y*axes.y, dot(d,axes.yx)));
        if(all(lessThan(floorPlan,eaves[i].xy)) && world.y<eaves[i].z) opacity=0.;
      }
    }`,
    fragmentShader: `varying float opacity,turn,tint;
    void main(){
      vec2 p=gl_PointCoord*2.-1.;
      vec2 grain=vec2(p.x*cos(turn)-p.y*sin(turn),p.x*sin(turn)+p.y*cos(turn));
      float d=length(grain*vec2(1.,1.09+.27*tint));
      float cover=1.-smoothstep(.53,1.,d);
      // A cool turned edge and a warm paper-white face read against both
      // the dark pines and the almost-white sky without outlining every flake.
      float face=smoothstep(-.56,.58,grain.x*.77-grain.y*.55+.59*tint);
      vec3 snow=mix(vec3(.39,.50,.58),vec3(1.,.98,.91),face);
      gl_FragColor=vec4(snow,cover*opacity);
      #include <colorspace_fragment>
    }`,
  });
  const points = new THREE.Points(geo, mat);
  points.onBeforeRender = renderer => renderer.getDrawingBufferSize(mat.uniforms.viewport.value);
  points.frustumCulled = false;
  points.renderOrder = 3;
  scene.add(points);
  return (time, camera, amount) => {
    points.visible = amount > 0.015;
    if (!points.visible) return;
    mat.uniforms.amount.value = amount;
    mat.uniforms.clock.value = time;
    // Spend the middle distance on the view ahead. Individual trajectories
    // stay in world space as the player turns or climbs the pagoda.
    camera.getWorldDirection(mat.uniforms.center.value).multiplyScalar(5).add(camera.position);
  };
}
