import * as T from './vendor/three.module.min.js';

// Radius is the footprint on the hot surface. Width is the half-width of
// the fully expanded plume, measured in metres, independent of the camera.
const profiles = {
  bath:    { height: 1.55, width: .49, alpha: .31, lowVeil:true, count: 7, rx: 1, rz: 1 },
  vent:    { height: 2.10, width: .49, alpha: .47, lowVeil:true, count: 4, rx: .14, rz: .12 },
  rice:    { height: .96, width: .20, alpha: .49, count: 4, rx: .40, rz: .32 },
  tea:     { height: .43, width: .088, alpha: .60, count: 2, rx: .052, rz: .042 },
  spout:   { height: .71, width: .132, alpha: .64, count: 2, rx: .015, rz: .014 },
  food:    { height: .54, width: .135, alpha: .54, count: 3, rx: .14, rz: .10 },
  steamer: { height: .61, width: .13, alpha: .60, count: 4, rx: .18, rz: .12 },
};

export function steamSource(kind, x, y, z, options = {}) {
  return { ...profiles[kind], x, y, z, ...options };
}

// One tessellated strip per current of rising air. The lower flow is laminar.
// Higher up, two transverse waves roll the plume over in three dimensions.
// Cross sections face the eye across a common buoyancy axis. They stay in
// order even where an upper eddy turns more tightly than the veil is wide.
const strip = new T.PlaneGeometry(2, 1, 1, 36).translate(0, .5, 0);
const vertexShader = `
  #include <fog_pars_vertex>
  attribute vec3 origin;
  attribute vec4 plume;
  attribute vec3 eddy;
  uniform float steamTime;
  uniform vec2 drift;
  varying vec2 paper;
  varying float seed, transport, density, veil;

  vec3 convection(float h, float t) {
    float roll = smoothstep(.09, .83, h);
    float curl = h * (3.4 + eddy.x * 2.2) - t;
    float turn = h * (9.2 + eddy.y * 2.8) - 1.56*t + seed;
    vec2 flow = vec2(sin(curl), cos(curl+.64)) * (.082*h+.121*roll);
    flow += vec2(sin(turn), .69*cos(turn)) * (.072*roll);
    float lift = h + .047*roll*cos(turn+.21);
    return vec3(flow.x + drift.x*h*h, lift, flow.y + drift.y*h*h);
  }
  void main() {
    paper = vec2(position.x, position.y);
    float h = paper.y;
    seed = plume.z;
    density = plume.w;
    veil = eddy.z;
    float breath = steamTime*(.74+.34*eddy.x);
    transport = breath*1.55;
    float t = breath + seed;
    vec3 foot = (modelMatrix * vec4(origin,1.)).xyz;
    float scale = length(modelMatrix[1].xyz);
    vec3 world = foot + scale * plume.x * convection(h,t);
    vec3 axis = mat3(viewMatrix) * vec3(drift.x,1.,drift.y);
    vec4 mvPosition = viewMatrix * vec4(world,1.);
    vec3 across = cross(axis, normalize(-(viewMatrix*vec4(foot,1.)).xyz));
    across = length(across)>.015 ? normalize(across) : vec3(1.,0.,0.);
    float swell = .25 + .77*smoothstep(.01,.86,h);
    float fold = .82 + .18*cos(8.9*h-1.28*t+eddy.y);
    mvPosition.xyz += across * paper.x * plume.y * scale * swell * fold;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const fragmentShader = `
  #include <fog_pars_fragment>
  uniform float warmth;
  varying vec2 paper;
  varying float seed, transport, density, veil;
  void main() {
    float u = paper.x, h = paper.y;
    float roll = smoothstep(.08,.80,h);
    float lift = 11.*h-transport+seed;
    // A condensed filament curls back into its broader, translucent veil.
    // Both soften into the paper before the next parcel rises through them.
    float fold = .35*sin(lift+.83*sin(6.*h+.73*seed)) * (.28+.72*roll);
    float hair = .10 + .14*roll + .045*(.5+.5*cos(lift+seed));
    float coreAt = (u-fold)/hair;
    float core = exp(-coreAt*coreAt);
    float returning = -.42*sin(lift+.72) + .16*cos(15.*h-transport);
    float laceAt = (u-returning)/(.10+.055*roll);
    float lace = exp(-laceAt*laceAt) * roll;
    float lobe = .5+.5*sin(2.1*lift + 3.*u + 1.7*sin(lift-u+seed));
    float bodyAt = u-.40*fold-.16*roll*(lobe-.5);
    float gauze = exp(-3.4*bodyAt*bodyAt);
    float billow = .5+.5*cos(lift+.86*sin(.61*lift+seed)+.76*u);
    float lifted = smoothstep(.005,.12,h)*(1.-smoothstep(.54,1.,h));
    float broken = 1.-roll*(.35+.50*roll)*(1.-billow);
    float rim = 1.-smoothstep(.72,1.,abs(u));
    float thread = .48*core+.24*lace+.36*gauze;
    // Broad, low banks collect over the warm water, then thin out with the
    // same breeze that carries the finer threads above them.
    float cloud = (.12*core+.09*lace+gauze*(.49+.37*lobe))*(.63+.37*billow);
    float alpha = mix(thread,cloud,veil)*lifted*broken*rim*density*warmth;
    if (alpha < .003) discard;
    vec3 ink = mix(vec3(.48,.54,.51), vec3(1.,.965,.865),
                   .48+.40*core+.12*billow);
    #ifdef USE_FOG
      ink *= .56+.44*smoothstep(.045,.52,dot(fogColor,vec3(.28,.57,.15)));
    #endif
    gl_FragColor = vec4(ink,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export function createSteam(sources, clock = { value: 0 }, phase = 0) {
  const geo = new T.InstancedBufferGeometry().copy(strip);
  const origins = [], plumes = [], eddies = [];
  const bounds = new T.Box3(), point = new T.Vector3();
  let reach = 0;
  for (const [j, s] of sources.entries()) {
    for (let i = 0; i < s.count; i++) {
      const a = i*2.399963 + j*.91 + phase;
      const r = Math.sqrt((i+.36)/s.count);
      const x = s.x + Math.cos(a)*r*s.rx, z = s.z + Math.sin(a)*r*s.rz;
      const seed = a + .48*Math.sin(2.3*i+phase);
      const veil = s.lowVeil && i%3===2;
      const height = s.height*(.94+.17*Math.cos(1.7*seed))*(veil?.48:1);
      const width = s.width*(.93+.14*Math.sin(1.3*seed))*(veil?1.70:1);
      origins.push(x,s.y,z);
      plumes.push(height,width,seed,s.alpha);
      eddies.push(.5+.5*Math.sin(3.7*seed),.5+.5*Math.cos(4.1*seed),veil?1:0);
      bounds.expandByPoint(point.set(x,s.y,z));
      reach = Math.max(reach, 1.9*height+width);
    }
  }
  for (const [name, data, size] of [['origin',origins,3],['plume',plumes,4],['eddy',eddies,3]]) {
    geo.setAttribute(name,new T.InstancedBufferAttribute(new Float32Array(data),size));
  }
  geo.instanceCount = origins.length/3;
  geo.boundingSphere = bounds.getBoundingSphere(new T.Sphere());
  geo.boundingSphere.radius += reach;
  const mat = new T.ShaderMaterial({
    uniforms: { ...T.UniformsUtils.clone(T.UniformsLib.fog), steamTime: clock,
      drift: { value: new T.Vector2(.11,.045) }, warmth: { value: 1 } },
    vertexShader, fragmentShader, fog:true, transparent:true, depthWrite:false,
    side:T.DoubleSide, forceSinglePass:true,
  });
  const mesh = new T.Mesh(geo,mat);
  mesh.name = '立ちのぼる湯気';
  mesh.renderOrder = 5;
  return mesh;
}
