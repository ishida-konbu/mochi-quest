import * as THREE from './vendor/three.module.min.js';

const TAU = Math.PI * 2;
const pigments = {
  // Original picture origin, then its position in our padded, opaque atlas.
  hare: [77, 0, 0, 0],
  frog: [175, 0, 320, 0],
  leaf: [18, 0, 580, 0],
};
let painted;
function illustrationMaterial() {
  if (painted) return painted;
  const map = new THREE.TextureLoader().load(
    new URL('./assets/residents/scroll-pigments.webp', import.meta.url).href,
  );
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  painted = new THREE.MeshStandardMaterial({ map, roughness: 0.96, side: THREE.DoubleSide });
  painted.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 inkWash; varying vec4 vInkWash;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInkWash=inkWash;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vInkWash;')
      .replace(
        '#include <map_fragment>',
        `
      #include <map_fragment>
      diffuseColor.rgb=mix(vInkWash.rgb,diffuseColor.rgb,vInkWash.a);
    `,
      )
      .replace(
        '#include <opaque_fragment>',
        `
      float edge = 1.0 - smoothstep(.025, .14, abs(dot(normalize(normal), normalize(vViewPosition))));
      outgoingLight *= 1.0 - .35 * edge;
      #include <opaque_fragment>
    `,
      );
  };
  brushWash(painted,.23);
  return painted;
}
function paintedMesh(parent, name, region, evaluate, rows = 32, sides = 48, closed = true) {
  const xyz = [],
    uv = [],
    ix = [];
  const [sx, sy, ax, ay] = pigments[region];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= sides; i++) {
      const [x, y, z, px, py] = evaluate(j / rows, i / sides);
      xyz.push(x, y, z);
      uv.push((px - sx + ax + 0.5) / 864, 1 - (py - sy + ay + 0.5) / 424);
      if (j < rows && i < sides) {
        const k = j * (sides + 1) + i;
        ix.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  if (closed) {
    const normals = geo.attributes.normal;
    const a = new THREE.Vector3(),
      b = new THREE.Vector3();
    for (let j = 0; j <= rows; j++) {
      const k = j * (sides + 1);
      a.fromBufferAttribute(normals, k)
        .add(b.fromBufferAttribute(normals, k + sides))
        .normalize();
      normals.setXYZ(k, a.x, a.y, a.z);
      normals.setXYZ(k + sides, a.x, a.y, a.z);
    }
  }
  const wash = [],
    normal = geo.attributes.normal,
    skin = new THREE.Color();
  const portrait = (region === 'hare' && name === '面相') || region === 'frog';
  skin.set(
    region === 'hare'
      ? '#e2cfb8'
      : name === '眉と上あご'
        ? '#baaa85'
        : '#dbc4a0',
  );
  for (let k = 0; k < normal.count; k++) {
    const t = Math.floor(k / (sides + 1)) / rows;
    const flank = Math.abs(normal.getX(k));
    const ink = portrait
      ? THREE.MathUtils.smoothstep(flank, 0.23, 0.81) * (1 - THREE.MathUtils.smoothstep(t, 0.87, 0.97))
      : 1;
    wash.push(skin.r, skin.g, skin.b, ink);
  }
  geo.setAttribute('inkWash', new THREE.Float32BufferAttribute(wash, 4));
  const mesh = new THREE.Mesh(geo, illustrationMaterial());
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  if(region==='hare'||region==='frog')brushContour(mesh);
  return mesh;
}

// A transverse section of the sculpt. Strokes stay fixed to the skin as the camera circles.
function sections(rows, t) {
  const u = t * (rows.length - 1);
  const i = Math.min(rows.length - 2, Math.floor(u)),
    f = u - i;
  const a = rows[Math.max(0, i - 1)],
    b = rows[i],
    c = rows[i + 1],
    d = rows[Math.min(rows.length - 1, i + 2)];
  return b.map((v, n) => {
    const a1 = 0.5 * (c[n] - a[n]),
      a2 = 0.5 * (d[n] - b[n]);
    return (
      (2 * f ** 3 - 3 * f * f + 1) * v +
      (f ** 3 - 2 * f * f + f) * a1 +
      (3 * f * f - 2 * f ** 3) * c[n] +
      (f ** 3 - f * f) * a2
    );
  });
}

function tracedVolume(parent, name, source, rows, options) {
  const { origin, scale, deform } = options;
  return paintedMesh(
    parent,
    name,
    source,
    (t, ring) => {
      const [px, top, bottom, thickness] = sections(rows, t);
      const a = ring * TAU,
        side = Math.cos(a),
        level = Math.sin(a);
      const py = (top + bottom - level * (bottom - top)) * 0.5;
      const sample = [
        Math.max(0.0005, thickness) * side,
        (origin[1] - py) * scale,
        (px - origin[0]) * scale,
        px,
        py,
      ];
      return deform ? deform(sample, side, level, t) : sample;
    },
    rows.length * 3,
    36,
  );
}

const hareHead = [
  [266, 83, 84, 0.015],
  [271, 73, 97, 0.088],
  [279, 57, 104, 0.155],
  [289, 47, 109, 0.195],
  [304, 45, 110, 0.207],
  [320, 46, 103, 0.196],
  [335, 49, 98, 0.165],
  [350, 55, 94, 0.13],
  [361, 63, 92, 0.103],
  [370, 68, 86, 0.065],
  [374, 74, 80, 0.027],
  [375, 76, 77, 0.004],
];
const hareEar = [
  [95, 80, 81, 0.001],
  [103, 70, 75, 0.006],
  [120, 60, 68, 0.012],
  [148, 48, 70, 0.021],
  [176, 38, 75, 0.03],
  [202, 33, 75, 0.035],
  [230, 32, 64, 0.029],
  [253, 36, 60, 0.024],
  [274, 46, 65, 0.026],
  [292, 50, 64, 0.017],
  [298, 55, 60, 0.006],
];
const frogCrown = [
  [227, 56, 62, 0.008],
  [235, 48, 78, 0.1],
  [249, 37, 89, 0.19],
  [270, 27, 97, 0.235],
  [293, 24, 99, 0.258],
  [309, 18, 92, 0.257],
  [325, 6, 79, 0.25],
  [340, 2, 71, 0.246],
  [354, 5, 66, 0.23],
  [367, 15, 62, 0.209],
  [380, 27, 58, 0.175],
  [394, 31, 55, 0.137],
  [406, 37, 53, 0.09],
  [415, 44, 52, 0.044],
  [418, 49, 50, 0.006],
];
const frogJaw = [
  [252, 75, 77, 0.007],
  [263, 69, 92, 0.13],
  [282, 67, 109, 0.2],
  [303, 69, 126, 0.227],
  [319, 81, 132, 0.224],
  [333, 77, 122, 0.207],
  [350, 72, 107, 0.191],
  [370, 70, 94, 0.15],
  [386, 73, 85, 0.108],
  [398, 76, 82, 0.049],
  [404, 79, 80, 0.006],
];

// The profile texture comes from the first game's picture. These tapered lines
// wrap its nose and lips so a three-quarter view still reads as brushwork.
let faceInk;
function finishFace(parent, kind) {
  const hare=kind==='rabbit',table=hare?hareHead:frogCrown;
  const [ox,oy,scale]=hare?[294,79,.0053]:[302,73,.00365],xyz=[],ix=[];
  const surface=(u,angle)=>{
    const [px,top,bottom,w]=sections(table,u),h=(bottom-top)*.5;
    return new THREE.Vector3((w+.002)*Math.cos(angle),
      (oy-(top+bottom)*.5)*scale+(h*scale+.002)*Math.sin(angle),(px-ox)*scale);
  };
  function line(points,width,out) {
    const curve=new THREE.CatmullRomCurve3(points),start=xyz.length/3;
    for(let i=0;i<=18;i++){
      const t=i/18,p=curve.getPoint(t),side=curve.getTangent(t).cross(out).normalize();
      const w=width*(.06+.94*Math.sin(t*Math.PI)**.65);
      xyz.push(...p.clone().addScaledVector(side,w).toArray(),...p.addScaledVector(side,-w).toArray());
      if(i){const k=start+2*i;ix.push(k-2,k-1,k,k-1,k+1,k);}
    }
  }
  for(const s of [-1,1]){
    const out=new THREE.Vector3(s,.04,.25).normalize(), on=(u,a)=>surface(u,s===1?a:Math.PI-a);
    if(hare){
      line([on(.976,.26),on(.933,.19),on(.894,.13),on(.863,.19)],.007,out);
      line([on(.980,-.32),on(.929,-.69),on(.854,-.81),on(.755,-.79)],.0048,out);
      for(let i=0;i<3;i++){
        const p=on(.823-.020*i,-.29-.115*i);
        line([p,p.clone().add(new THREE.Vector3(s*.068,.018-.008*i,.032)),
          p.clone().add(new THREE.Vector3(s*(.124+.017*i),.043-.029*i,.029-.012*i))],.0019,out);
      }
    }else{
      line([on(.93,-.87),on(.84,-.86),on(.72,-.81),on(.62,-.75)],.0064,out);
      line([on(.837,.54),on(.852,.65),on(.874,.67),on(.887,.60)],.0066,out);
      line([on(.32,-.33),on(.36,-.47),on(.405,-.54)],.0038,out);
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  geo.setIndex(ix);geo.computeVertexNormals();
  faceInk ||= new THREE.MeshStandardMaterial({color:'#554d40',side:THREE.DoubleSide,roughness:1});
  parent.add(new THREE.Mesh(geo,faceInk));
}

export function sculptHead(parent, kind, role) {
  finishFace(parent,kind);
  if (kind === 'rabbit') {
    tracedVolume(parent, '面相', 'hare', hareHead, { origin: [294, 79], scale: 0.0053 });
    for (const s of [-1, 1]) {
      const ear = tracedVolume(parent, '筆穂耳' + s, 'hare', hareEar, {
        origin: [286, 56],
        scale: 0.0042,
        deform: (p, side, level, t) => {
          // Splay the long pinnae and turn the ventral surface slightly toward the sky.
          const fan = 1 - t;
          p[0] += s * (0.077 + fan * 0.27 + fan * fan * 0.12);
          p[1] += 0.133 + fan * (s > 0 ? 0.25 : 0.14) + 0.13 * Math.sin(fan * Math.PI);
          p[0] += s*.019*Math.sin(Math.PI*t)*level*level;
          p[1] += .016*Math.sin(Math.PI*t)*side*side;
          p[2] -= 0.032;
          return p;
        },
      });
      if (role === 'sumo' || role === 'pounder') ear.rotation.x = s > 0 ? 0.79 : 0.66;
      else if (role === 'wander') ear.rotation.x = s > 0 ? 0.28 : 0.08;
    }
  } else {
    const scale = 0.00365,
      origin = [302, 73];
    tracedVolume(parent, '眉と上あご', 'frog', frogCrown, {
      origin,
      scale,
      deform: (p, side, level, t) => {
        // The inked orbits stand on either side of the low bridge of the nose.
        if (level > 0) p[1] -= 0.104 * Math.exp(-13 * side * side) * Math.exp(-28 * (t - 0.49) ** 2) * level;
        return p;
      },
    });
    const jaw = tracedVolume(parent, '喉袋と下あご', 'frog', frogJaw, { origin, scale });
    if (role === 'wander' || role === 'turner') jaw.rotation.x = 0.095;
  }
}

export function scrollParasol(parent) {
  // The original lotus leaf's veins converge at (154, 109). Shape every rib
  // in 3D, including its irregular scallops and the raised edge opposite the stalk.
  const outline = [
    [271, 53],
    [269, 72],
    [253, 84],
    [244, 101],
    [225, 101],
    [210, 118],
    [183, 127],
    [174, 147],
    [157, 151],
    [138, 170],
    [125, 193],
    [104, 193],
    [85, 188],
    [69, 204],
    [51, 201],
    [46, 184],
    [32, 180],
    [25, 167],
    [24, 146],
    [32, 131],
    [28, 116],
    [44, 103],
    [50, 85],
    [52, 69],
    [63, 50],
    [76, 42],
    [98, 40],
    [113, 28],
    [130, 16],
    [148, 12],
    [168, 14],
    [186, 7],
    [209, 4],
    [228, 5],
    [240, 16],
    [254, 18],
    [264, 29],
    [263, 39],
  ];
  const curve = new THREE.SplineCurve([...outline, outline[0]].map(([x, y]) => new THREE.Vector2(x, y)));
  const leaf = paintedMesh(
    parent,
    '葉脈の蓮傘',
    'leaf',
    (r, a) => {
      const edge = curve.getPoint(a);
      const u = 154 + (edge.x - 154) * r,
        w = 109 + (edge.y - 109) * r;
      const x = (u - 154) * 0.0038,
        z = (w - 109) * 0.00415;
      return [x, 0.1 * (1 - r * r) + 0.05 * r * r * Math.sin(a * TAU * 7 + 0.4), z, u, w];
    },
    14,
    88,
    false,
  );
  leaf.position.set(-0.46, 1.84, -0.055);
  leaf.rotation.set(-0.29, 0.08, 0.38);
  return leaf;
}

// Elliptic cross sections follow the spine from shoulder to wrist, or from hip
// through the hock to the ankle. A single skin crosses each joint.
export function inkVolume(b, stations, pigment, steps = 24, markings) {
  const xyz = [],
    ix = [],
    sides = 16,
    lateral = new THREE.Vector3(1, 0, 0);
  const along = new THREE.Vector3(),
    across = new THREE.Vector3(),
    depth = new THREE.Vector3();
  function frame(t) {
    const a = sections(stations, t);
    const lo = sections(stations, Math.max(0, t - 0.002)),
      hi = sections(stations, Math.min(1, t + 0.002));
    along.set(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]).normalize();
    across.copy(lateral).addScaledVector(along, -along.x).normalize();
    depth.crossVectors(along, across);
    return a;
  }
  function skin(a, theta, lift = 0) {
    const u = Math.cos(theta) * (Math.max(0.001, a[3]) + lift),
      v = Math.sin(theta) * (Math.max(0.001, a[4]) + lift);
    return [
      a[0] + across.x * u + depth.x * v,
      a[1] + across.y * u + depth.y * v,
      a[2] + across.z * u + depth.z * v,
    ];
  }
  for (let j = 0; j <= steps; j++) {
    const a = frame(j / steps);
    for (let i = 0; i < sides; i++) {
      xyz.push(...skin(a, (i * TAU) / sides));
      if (j < steps) {
        const k = j * sides + i,
          next = j * sides + ((i + 1) % sides);
        ix.push(k, next, k + sides, next, next + sides, k + sides);
      }
    }
  }
  for(let i=1;i<sides-1;i++){
    const last=steps*sides;
    ix.push(0,i+1,i,last,last+i,last+i+1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  b.add(g, pigment);
  g.dispose();

  if (!markings) return;
  // Dry-brush flicks on the hares, broken pools of olive pigment on the frogs.
  const spot = markings === 'frog',
    count = spot ? 29 : 21,
    dots = [],
    triangles = [];
  for (let k = 0; k < count; k++) {
    const ct = 0.16 + 0.7 * ((k * 0.618034 + 0.31) % 1),
      ca = k * 2.39996 + Math.sin(k * 1.7) * 0.26;
    if (spot && Math.sin(ca) < -0.75) continue;
    const off = dots.length / 3,
      extent = (spot ? 0.023 : 0.058) * (0.7 + 0.3 * Math.sin(k));
    dots.push(...skin(frame(ct), ca, 0.0028));
    for (let j = 0; j < 10; j++) {
      const angle = (TAU * j) / 10,
        jag = 1 + 0.16 * Math.sin(j * 2.4 + k * 0.53);
      const dt = extent * Math.cos(angle) * jag;
      const da = (spot ? 0.125 : 0.026) * Math.sin(angle) * jag + (spot ? 0 : dt * 2.1);
      dots.push(...skin(frame(ct + dt), ca + da, 0.0026));
      triangles.push(off, off + 1 + j, off + 1 + ((j + 1) % 10));
    }
  }
  const brush = new THREE.BufferGeometry();
  brush.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
  brush.setIndex(triangles);
  brush.computeVertexNormals();
  b.add(brush, spot ? '#89805c' : '#9c866e');
  brush.dispose();
}

export function brushWash(material,strength=.50) {
  const prior=material.onBeforeCompile,program=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer) {
    prior.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float density=dot(diffuseColor.rgb,vec3(.27,.59,.14));
        vec3 paperInk=vec3(1.055,1.008,.877)*density;
        paperInk=mix(paperInk,vec3(.84,.77,.62),.24*smoothstep(.076,.5,density));
        diffuseColor.rgb=mix(diffuseColor.rgb,paperInk,${strength.toFixed(2)});`)
      .replace('#include <opaque_fragment>',`
        float slope=abs(dot(normalize(normal),normalize(vViewPosition)));
        float penWidth=clamp(.045+1.55*fwidth(slope),.05,.25);
        float line=1.-smoothstep(.012,penWidth,slope);
        outgoingLight=mix(outgoingLight,outgoingLight*.17+vec3(.009,.007,.004),line*.86);
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>program+'-emaki-pen-'+strength;
  return material;
}

// A dry wash follows the local surface, so posed fingers, silk and skin have
// the same paper tooth at their joins without painting every small sculpt an atlas.
let brushGrain;
export function surfaceGrain(material, scale=3) {
  if(!brushGrain) {
    brushGrain=new THREE.TextureLoader().load(new URL('./assets/bestiary/brush-grain.webp',import.meta.url).href);
    brushGrain.wrapS=brushGrain.wrapT=THREE.MirroredRepeatWrapping;
  }
  const earlier=material.onBeforeCompile, key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    earlier.call(this,shader,renderer);
    shader.uniforms.grainOfBrush={value:brushGrain};
    shader.vertexShader=shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 inkPos, inkNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ninkPos=position; inkNormal=normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 inkPos, inkNormal; uniform sampler2D grainOfBrush;')
      .replace('#include <opaque_fragment>',`
        vec3 axis=pow(abs(normalize(inkNormal)),vec3(3.)); axis/=max(.001,dot(axis,vec3(1.)));
        vec3 p=inkPos*${scale.toFixed(2)};
        float mineral=dot(axis,vec3(texture2D(grainOfBrush,p.zy).r,texture2D(grainOfBrush,p.zx).r,texture2D(grainOfBrush,p.xy).r));
        outgoingLight*=.63+.44*mineral;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>key+'-dry-brush-'+scale;
  return material;
}

let contourMaterial;
export function brushContour(surface) {
  if(!contourMaterial) {
    contourMaterial=new THREE.MeshBasicMaterial({color:'#574f40',side:THREE.BackSide});
    contourMaterial.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float grain=.75+.19*sin(position.y*9.+position.z*4.)+.06*sin(position.x*17.);
        transformed+=normal*(.0085*grain);`);
    };
  }
  const edge=surface.isSkinnedMesh ? new THREE.SkinnedMesh(surface.geometry,contourMaterial) :
    new THREE.Mesh(surface.geometry,contourMaterial);
  edge.name='墨の輪郭';edge.castShadow=edge.receiveShadow=false;
  surface.add(edge);
  return edge;
}
