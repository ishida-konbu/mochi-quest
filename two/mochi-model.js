import * as T from './vendor/three.module.min.js';

const PI = Math.PI;
const TAU = PI * 2;
const clamp = T.MathUtils.clamp;
const ease = (lo, hi, x) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const ivory = new T.Color('#fff5e4');
const matcha = new T.Color('#afc885');
const kinako = new T.Color('#e3b674');
const ink = new T.MeshPhysicalMaterial({
  color: '#382014',
  roughness: 0.25,
  clearcoat: 0.53,
  clearcoatRoughness: 0.18,
  specularIntensity: 0.82,
  envMapIntensity: 0.73,
});
const mouthInk = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.56,
  metalness: 0,
  side: T.DoubleSide,
  envMapIntensity: 0.44,
});
const tongueMat = new T.MeshPhysicalMaterial({
  color: '#ee9193',
  roughness: 0.5,
  clearcoat: 0.13,
  clearcoatRoughness: 0.35,
  specularIntensity: 0.46,
  envMapIntensity: 0.55,
});
const toothMat = new T.MeshStandardMaterial({ color: '#ffecdc', roughness: 0.53, envMapIntensity: 0.6 });
const glintMat = new T.MeshBasicMaterial({ color: '#fff4db' });
const sweatMat = new T.MeshPhysicalMaterial({
  color: '#efdac4',
  roughness: 0.1,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: 1.76,
});
const pearl = new T.SphereGeometry(1, 20, 14);
let powderTex;
function riceSurfaceTexture() {
  if (!powderTex) {
    powderTex = new T.TextureLoader().load(
      new URL('./assets/actors/rice-surface.webp?v=2.2', import.meta.url).href,
    );
    powderTex.colorSpace = T.NoColorSpace;
    powderTex.wrapS = powderTex.wrapT = T.RepeatWrapping;
    powderTex.anisotropy = 4;
  }
  return powderTex;
}

// Horizontal sections measured on the supplied rear and right views. The two
// near-poles use squared radii so the surface has a round tangent at the top.
const sections = [
  // Image row, half-width, half-depth, lateral centre, fore/aft centre (pixels).
  [151, 0, 0, 624, 621],
  [156, 62, 61, 628, 617],
  [174, 136, 139, 624, 619],
  [194, 188, 185, 624, 621],
  [222, 239, 230, 623, 618],
  [260, 296, 278, 620, 617],
  [305, 342, 320, 620, 612],
  [361, 388, 358, 618, 612],
  [424, 426, 389, 619, 609],
  [495, 455, 412, 616, 607],
  [576, 474, 425, 616, 605],
  [640, 477, 426, 617, 607],
  [706, 470, 418, 617, 607],
  [776, 451, 400, 616, 608],
  [845, 419, 368, 616, 609],
  [902, 379, 328, 617, 610],
  [950, 329, 278, 617, 609],
  [984, 280, 225, 617, 609],
  [1007, 215, 172, 618, 609],
  [1018, 164, 127, 619, 608],
  [1026, 104, 78, 619, 609],
  [1031, 0, 0, 619, 610],
];
const pixelScale = 0.00176;
const contour = sections
  .map(([row, width, depth, cx, cz]) => [
    (1077 - row) * pixelScale,
    (width * pixelScale) ** 2,
    (depth * pixelScale) ** 2,
    (cx - 617) * pixelScale,
    (cz - 611) * pixelScale,
  ])
  .reverse();
// Cache a smoothly interpolated contour so the field and its normal are cheap
// enough to sample while building the unified, skinned surface.
const profileStep = 0.002;
const profile = [];
for (let i = 0, segment = 0; i < 890; i++) {
  const y = i * profileStep;
  while (segment < contour.length - 2 && y > contour[segment + 1][0]) segment++;
  const a = contour[segment],
    b = contour[segment + 1];
  const before = contour[Math.max(0, segment - 1)],
    after = contour[Math.min(contour.length - 1, segment + 2)];
  const t = (y - a[0]) / (b[0] - a[0]),
    u = clamp(t, 0, 1);
  const values = [];
  for (let col = 1; col <= 4; col++) {
    const span = b[0] - a[0];
    const m0 = ((b[col] - before[col]) / (b[0] - before[0])) * span;
    const m1 = ((after[col] - a[col]) / (after[0] - a[0])) * span;
    const p =
      (1 + 2 * u) * (1 - u) ** 2 * a[col] +
      u * (1 - u) ** 2 * m0 +
      u * u * (3 - 2 * u) * b[col] +
      u * u * (u - 1) * m1;
    values.push(p + (t < 0 ? t * m0 : t > 1 ? (t - 1) * m1 : 0));
  }
  profile.push(values);
}
for (let i = 0; i < profile.length; i++) {
  const lo = Math.max(0, i - 1),
    hi = Math.min(profile.length - 1, i + 1);
  profile[i][4] = (profile[hi][0] - profile[lo][0]) / ((hi - lo) * profileStep);
}
function bodyDistance(x, y, z) {
  const t = clamp(y / profileStep, 0, profile.length - 1.001),
    i = Math.floor(t),
    f = t - i;
  const a = profile[i],
    b = profile[i + 1];
  const rx2 = a[0] + (b[0] - a[0]) * f;
  const rz2 = a[1] + (b[1] - a[1]) * f;
  const ratio = Math.abs(rz2) > 0.00004 ? clamp(rx2 / rz2, 0.82, 1.85) : 1.16;
  const px = x - (a[2] + (b[2] - a[2]) * f),
    pz = z - (a[3] + (b[3] - a[3]) * f);
  const dy = a[4] + (b[4] - a[4]) * f;
  let d = (px * px + pz * pz * ratio - rx2) / Math.max(0.25, Math.hypot(2 * px, 2 * pz * ratio, dy));
  if (z > 0.38 && y > 0.6 && y < 1.25) {
    const ax = Math.abs(x);
    const cheek = Math.exp(-(((ax - 0.393) / 0.151) ** 2 + ((y - 0.867) / 0.121) ** 2));
    const eye = Math.exp(-(((ax - 0.276) / 0.119) ** 2 + ((y - 0.994) / 0.075) ** 2));
    d += ease(0.37, 0.61, z) * (0.009 * eye - 0.021 * cheek);
  }
  return d;
}
function smoothUnion(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function armDistance(x, y, z) {
  // The hand is a small, forward-facing fold of dough. In profile its
  // rounded palm sits in front of the shoulder; from behind the belly covers it.
  const t = clamp((z - 0.31) / 0.19, 0, 1);
  const px = x - (0.648 + 0.057 * t);
  const py = y - (0.557 - 0.051 * t);
  const pz = z - 0.433;
  return (Math.hypot(px / 0.139, py / 0.143, pz / 0.19) - 1) * 0.143;
}
function footDistance(x, y, z) {
  const px = x - 0.31 - 0.055 * z,
    py = y - 0.123 + 0.026 * z,
    pz = z - 0.034;
  return (
    (Math.pow((px / 0.166) ** 2 + Math.pow(Math.abs(py / 0.121), 2.68) + (pz / 0.199) ** 2, 0.5) - 1) *
    0.141
  );
}
function doughDistance(x, y, z) {
  let d = bodyDistance(x, y, z);
  const ax = Math.abs(x);
  if (ax > 0.38 && y < 0.88 && y > 0.23 && z > 0.1) d = smoothUnion(d, armDistance(ax, y, z), 0.038);
  if (ax > 0.05 && y < 0.39 && z > -0.25) d = smoothUnion(d, footDistance(ax, y, z), 0.028);
  return d;
}

// Surface nets resolve the belly, paws and feet as a single continuous skin.
// The same distance fields supply soft joint weights on either side of each fold.
function sculpt() {
  const nx = 91,
    ny = 83,
    nz = 81,
    step = 0.0215,
    ox = (-(nx - 1) * step) / 2,
    oy = -0.06,
    oz = -0.819;
  const slice = nx * ny,
    total = slice * nz;
  const values = new Float32Array(total),
    cellIndices = new Int32Array(total);
  cellIndices.fill(-1);
  for (let iz = 0; iz < nz; iz++)
    for (let iy = 0; iy < ny; iy++)
      for (let ix = 0; ix < nx; ix++) {
        values[ix + iy * nx + iz * slice] = doughDistance(ox + ix * step, oy + iy * step, oz + iz * step);
      }
  const pos = [],
    indices = [],
    weights = [],
    bones = [],
    press = [],
    sway = [],
    round = [],
    pull = [],
    normals = [];
  const C = [0, 1, nx, nx + 1, slice, slice + 1, slice + nx, slice + nx + 1];
  const edges = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  for (let iz = 0; iz < nz - 1; iz++)
    for (let iy = 0; iy < ny - 1; iy++)
      for (let ix = 0; ix < nx - 1; ix++) {
        const at = ix + iy * nx + iz * slice;
        let mask = 0;
        for (let i = 0; i < 8; i++) if (values[at + C[i]] < 0) mask |= 1 << i;
        if (mask === 0 || mask === 255) continue;
        let ax = 0,
          ay = 0,
          az = 0,
          count = 0;
        for (const [a, b] of edges) {
          const va = values[at + C[a]],
            vb = values[at + C[b]];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb),
            x0 = a & 1,
            y0 = (a >> 1) & 1,
            z0 = (a >> 2) & 1;
          ax += x0 + ((b & 1) - x0) * t;
          ay += y0 + (((b >> 1) & 1) - y0) * t;
          az += z0 + (((b >> 2) & 1) - z0) * t;
          count++;
        }
        let x = ox + (ix + ax / count) * step,
          y = oy + (iy + ay / count) * step,
          z = oz + (iz + az / count) * step;
        // Snap the surface-net vertex back onto the sculpt; sample its analytic
        // gradient to keep smooth folds even where the grid changes direction.
        const e = 0.0018;
        const gx = doughDistance(x + e, y, z) - doughDistance(x - e, y, z);
        const gy = doughDistance(x, y + e, z) - doughDistance(x, y - e, z);
        const gz = doughDistance(x, y, z + e) - doughDistance(x, y, z - e);
        const mag = Math.hypot(gx, gy, gz) || 1;
        const error = doughDistance(x, y, z) / mag;
        x -= gx * error;
        y -= gy * error;
        z -= gz * error;
        cellIndices[at] = pos.length / 3;
        pos.push(x, y, z);
        normals.push(gx / mag, gy / mag, gz / mag);
        // The hands and head rise together while a waist of soft starch
        // follows below them. The smile keeps its proportions on a long pull.
        const ab = Math.abs(x),
          base = bodyDistance(x, y, z),
          ad = armDistance(ab, y, z),
          fd = footDistance(ab, y, z);
        const aw = ease(-0.047, 0.121, base - ad) * ease(0.43, 0.665, ab) * ease(0.22, 0.38, y);
        const fw = ease(-0.052, 0.091, base - fd) * (1 - ease(0.19, 0.31, y)) * (1 - aw);
        const pullAt = ease(0.035, 0.76, y);
        const palmLift = ease(0.035, 0.76, 0.5);
        const lift = pullAt + (palmLift - pullAt) * aw * 0.91;
        const waist = Math.exp(-(((y - 0.395) / 0.255) ** 2)) * (1 - ease(0.54, 0.74, y));
        const narrow = -0.25 - 0.17 * waist;
        pull.push(x * narrow, 1.12 * lift, z * narrow);
        bones.push(0, x < 0 ? 1 : 2, x < 0 ? 3 : 4, 0);
        weights.push(1 - aw - fw, aw, fw, 0);
        const faceMask =
          1 -
          ease(0.28, 0.52, z) *
            (1 - ease(0.49, 0.63, ab)) *
            (ease(0.55, 0.69, y) * (1 - ease(1.2, 1.35, y)));
        const lower = Math.exp(-(((y - 0.53) / 0.4) ** 2));
        press.push(
          x * 0.08 * lower * faceMask,
          -0.06 * (Math.max(0, y) / 1.62) ** 1.72 * faceMask,
          z * 0.076 * lower * faceMask,
        );
        sway.push(
          0.05 * ease(0.22, 1.6, y) * faceMask,
          -0.024 * x * ease(0.2, 1.18, y) * faceMask,
          -0.02 * ease(0.45, 1.6, y) * faceMask,
        );
        const l = Math.hypot(x, y - 0.819, z) || 1,
          r = 0.801 / l;
        round.push((x * r - x) * faceMask, (y - 0.819) * (r - 1) * faceMask, (z * r - z) * faceMask);
      }
  function quad(a, b, c, d, flip) {
    const i = cellIndices[a],
      j = cellIndices[b],
      k = cellIndices[c],
      l = cellIndices[d];
    if (i < 0 || j < 0 || k < 0 || l < 0) return;
    if (flip) indices.push(i, k, j, i, l, k);
    else indices.push(i, j, k, i, k, l);
  }
  for (let iz = 1; iz < nz - 1; iz++)
    for (let iy = 1; iy < ny - 1; iy++)
      for (let ix = 1; ix < nx - 1; ix++) {
        const n = ix + iy * nx + iz * slice,
          inside = values[n] < 0;
        if (inside !== values[n + 1] < 0) quad(n, n - nx, n - nx - slice, n - slice, !inside);
        if (inside !== values[n + nx] < 0) quad(n, n - slice, n - slice - 1, n - 1, !inside);
        if (inside !== values[n + slice] < 0) quad(n, n - 1, n - 1 - nx, n - nx, !inside);
      }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex(indices);
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(bones, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.morphTargetsRelative = true;
  g.morphAttributes.position = [press, sway, round, pull].map((a) => new T.Float32BufferAttribute(a, 3));
  // Interpolated pull normals keep highlights moving with the thinner waist.
  const pulled = new T.BufferGeometry();
  pulled.setIndex(g.index);
  pulled.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      pos.map((v, i) => v + pull[i]),
      3,
    ),
  );
  pulled.computeVertexNormals();
  const pulledNormals = pulled.attributes.normal.array;
  const neutralNormals = new T.Float32BufferAttribute(new Float32Array(normals.length), 3);
  g.morphAttributes.normal = [
    neutralNormals,
    neutralNormals,
    neutralNormals,
    new T.Float32BufferAttribute(
      normals.map((n, i) => pulledNormals[i] - n),
      3,
    ),
  ];
  g.computeBoundingSphere();
  return g;
}

// Return a face position on the same sculpt used by the skin, including the cheek relief.
function surface(x, y) {
  let low = 0.19,
    high = 0.89;
  for (let i = 0; i < 14; i++) {
    const mid = (low + high) * 0.5;
    if (bodyDistance(x, y, mid) > 0) high = mid;
    else low = mid;
  }
  return (low + high) * 0.5;
}
const apertureCode = `
  float mouthU=(ricePoint.x-mouthX)/mouthSize.x;
  if(ricePoint.z>.43 && abs(mouthU)<1.){
    float span=sqrt(max(0.,1.-mouthU*mouthU));
    float mid=mouthY+mouthSize.w*mouthU*mouthU+mouthSlant*mouthU;
    if(ricePoint.y<mid+mouthSize.y*span && ricePoint.y>mid-mouthSize.z*span)discard;
  }
`;
const apertureUniforms =
  'uniform vec4 mouthSize;uniform float mouthX,mouthY,mouthSlant;varying vec3 ricePoint;';
function skinMaterial(mouth) {
  const shared = {
    mouthSize: { value: mouth.size },
    mouthX: { value: mouth.x },
    mouthY: { value: mouth.y },
    mouthSlant: mouth.slant,
    riceFlour: { value: riceSurfaceTexture() },
    riceBlush: { value: 1 },
    riceBath: { value: 0 },
    riceBran: { value: 0 },
    riceNight: { value: 0 },
    riceEffort: { value: 0 },
  };
  const mat = new T.MeshPhysicalMaterial({
    color: ivory,
    roughness: 0.5,
    clearcoat: 0.65,
    clearcoatRoughness: 0.21,
    specularIntensity: 0.78,
    sheen: 0.31,
    sheenRoughness: 0.69,
    sheenColor: '#fff7eb',
    envMapIntensity: 0.91,
    emissive: '#ffe7d4',
    emissiveIntensity: 0.052,
  });
  mat.shadowSide = T.BackSide;
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader =
      'varying vec3 ricePoint;varying vec3 riceDirection;\n' +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nricePoint=position;riceDirection=normal;',
      );
    s.fragmentShader =
      apertureUniforms +
      `
      varying vec3 riceDirection; uniform sampler2D riceFlour;uniform float riceBlush,riceBath,riceBran,riceNight,riceEffort;
      vec3 flourSample(vec3 p,vec3 n){
        vec3 w=pow(abs(n),vec3(4.));w/=max(.0001,w.x+w.y+w.z);
        return texture2D(riceFlour,p.zy+vec2(.17,.07)).rgb*w.x+
          texture2D(riceFlour,p.xz+vec2(.41,.28)).rgb*w.y+
          texture2D(riceFlour,p.xy).rgb*w.z;
      }
    ` +
      s.fragmentShader;
    s.fragmentShader = s.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      ${apertureCode}
      vec3 rawNormal=normalize(riceDirection);
      vec3 grain=flourSample(ricePoint*1.16,rawNormal);
      vec3 fleck=flourSample(ricePoint*2.73+vec3(.38,.19,.70),rawNormal);
      float starch=grain.r-.5+(fleck.r-.5)*.19;
      float powder=smoothstep(.435,.557,grain.g);
      float glazedCrown=smoothstep(.62,1.47,ricePoint.y);
      float glaze=clamp(.28+.73*glazedCrown+.34*riceBath-.46*riceBran,0.,1.)*
        smoothstep(.18,.73,mix(grain.b,fleck.b,.19));
      // The packed reference grain separates broad translucency, relief and
      // specular flecks, so sunlight still travels over the body as it turns.
      diffuseColor.rgb*=1.+starch*vec3(.44,.60,.91);
      diffuseColor.rgb+=vec3(.027,.024,.017)*powder;
      diffuseColor.rgb*=mix(vec3(.998,.953,.903),vec3(1.),smoothstep(.12,1.27,ricePoint.y));
      vec2 cheekUV=vec2((abs(ricePoint.x)-.392)/.193,(ricePoint.y-.867)/.136);
      float blush=exp(-dot(cheekUV,cheekUV)*1.28)*smoothstep(.38,.57,ricePoint.z)*riceBlush;
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.05,.35,.34),clamp(blush*.86,0.,.94));
      vec2 cheeks=vec2(abs(ricePoint.x)-.395,ricePoint.y-.876);
      float hatchMask=exp(-pow(abs(cheeks.x/.072),4.)-pow(abs(cheeks.y/.025),4.));
      float hatch=1.-smoothstep(.019,.115,abs(fract((cheeks.x-cheeks.y*.43)*36.+.5)-.5));
      diffuseColor.rgb*=1.-vec3(.028,.115,.095)*hatch*hatchMask*blush;
      float bran=smoothstep(.511,.575,fleck.r)*riceBran;
      diffuseColor.rgb*=mix(vec3(1.),vec3(.76,.63,.49),bran);
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor=mix(.45,.23,glaze)+.03*(1.-glazedCrown)+.11*riceBran;
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>
      float skinHeight=(grain.g*.010+fleck.g*.0009)*mix(.36,1.,.66*glazedCrown+.34*glaze);
      if (ricePoint.z>.47) {
        float ux=ricePoint.x/max(.025,mouthSize.x);
        vec2 dimple=vec2((abs(ricePoint.x)-mouthSize.x-.01)/.029,
          (ricePoint.y-mouthY-mouthSize.w-mouthSlant*sign(ux))/.034);
        skinHeight-=.003*exp(-dot(dimple,dimple));
        vec2 brow=vec2((abs(ricePoint.x)-.158)/.053,(ricePoint.y-1.068-.39*(abs(ricePoint.x)-.158))/.027);
        skinHeight+=.010*riceEffort*exp(-dot(brow,brow));
      }
      vec3 pDx=dFdx(-vViewPosition),pDy=dFdy(-vViewPosition);
      vec3 xSurf=cross(pDy,normal),ySurf=cross(normal,pDx);
      float det=dot(pDx,xSurf);
      normal=normalize(normal-sign(det)*(dFdx(skinHeight)*xSurf+dFdy(skinHeight)*ySurf)/max(abs(det),.0000005));
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <lights_physical_fragment>',
      `
      #include <lights_physical_fragment>
      #ifdef USE_CLEARCOAT
        material.clearcoat=clamp(.14+.86*glaze+.20*riceBath,0.,1.);
        material.clearcoatRoughness=mix(.33,.11,glaze);
      #endif
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      float facing=clamp(dot(normal,normalize(vViewPosition)),0.,1.);
      float edge=pow(1.-facing,1.9);
      float daylight=mix(1.,.21,riceNight);
      // Rice scatters skylight in the starchy interior, with warmer transmitted
      // light at the thin silhouette and a softer terminator across the cheeks.
      float back=0.;
      #if NUM_DIR_LIGHTS > 0
        back=max(dot(-normalize(vViewPosition),directionalLights[0].direction),0.);
      #endif
      vec3 milk=mix(vec3(.154,.139,.122),vec3(.240,.213,.151),edge);
      outgoingLight+=diffuseColor.rgb*daylight*(milk+vec3(.42,.255,.109)*edge*(.38+.62*back));
      vec3 mirrorRay=inverseTransformDirection(reflect(-normalize(vViewPosition),normal),viewMatrix);
      vec3 skylight=normalize(vec3(.78,.99,.51));
      vec3 tangent=normalize(cross(skylight,vec3(0.,1.,0.)));
      vec3 bitangent=cross(skylight,tangent);
      vec2 windowCone=vec2(dot(mirrorRay,tangent)*2.5,dot(mirrorRay,bitangent)*3.7);
      float softbox=exp(-dot(windowCone,windowCone))*smoothstep(.40,.93,dot(mirrorRay,skylight));
      float skyDome=smoothstep(.12,.96,mirrorRay.y);
      // Small pools between fused grains catch broken reflections across the
      // crown and the shoulders. The reflections follow the view and lighting.
      float wetSpec=softbox*(.21+.98*glaze)+skyDome*(.03+.36*glaze*glaze)*glazedCrown;
      outgoingLight+=daylight*vec3(.85,.78,.69)*wetSpec*(1.-riceBran*.60);
      #include <opaque_fragment>
    `,
    );
  };
  const depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
  depth.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, shared);
    s.vertexShader =
      'varying vec3 ricePoint;\n' +
      s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nricePoint=position;');
    s.fragmentShader =
      apertureUniforms +
      '\n' +
      s.fragmentShader.replace(
        '#include <alphatest_fragment>',
        '#include <alphatest_fragment>\n' + apertureCode,
      );
  };
  return { mat, depth, shared };
}
function mesh(parent, geom, material) {
  const m = new T.Mesh(geom, material);
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}
function ellipse(parent, material) {
  return mesh(parent, pearl, material);
}
function dynGeometry(count, indices, colors) {
  const g = new T.BufferGeometry();
  g.setAttribute(
    'position',
    new T.BufferAttribute(new Float32Array(count * 3), 3).setUsage(T.DynamicDrawUsage),
  );
  if (colors) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.boundingSphere = new T.Sphere(V(0, 0.9, 0.66), 0.93);
  return g;
}
// A tapered curved bead of dark glaze catches thin highlights like the reference eyelids.
function stroke(parent, mat = ink) {
  const rings = 15,
    sides = 8,
    idx = [];
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < sides; k++) {
      const a = i * sides + k,
        b = i * sides + ((k + 1) % sides);
      idx.push(a, b, a + sides, b, b + sides, a + sides);
    }
  const g = dynGeometry((rings + 1) * sides, idx);
  const obj = mesh(parent, g, mat);
  return {
    obj,
    set(points, radius) {
      const attr = g.attributes.position;
      for (let j = 0; j <= rings; j++) {
        const t = j / rings,
          p = points(t),
          po = points(Math.max(0, t - 0.005)),
          pn = points(Math.min(1, t + 0.005));
        const dx = pn[0] - po[0],
          dy = pn[1] - po[1],
          l = Math.hypot(dx, dy) || 1,
          rr = radius * (0.1 + 0.9 * Math.pow(Math.max(0, Math.sin(t * PI)), 0.38));
        const z = surface(p[0], p[1]) + (p[2] ?? 0.01);
        for (let k = 0; k < sides; k++) {
          const a = (k * TAU) / sides;
          attr.setXYZ(
            j * sides + k,
            p[0] - (dy / l) * rr * cos(a),
            p[1] + (dx / l) * rr * cos(a),
            z + rr * Math.sin(a),
          );
        }
      }
      attr.needsUpdate = true;
      g.computeVertexNormals();
    },
  };
}
const sin = Math.sin,
  cos = Math.cos;
// The dark brown eyes in the open-eye reference have amber transmitted light
// along the lower edge, a deep centre and a small, sharp reflected window.
const eyeLens = new T.SphereGeometry(1, 32, 24);
const lensColors = [];
const darkIris = new T.Color('#2b160d'),
  amberIris = new T.Color('#995827');
for (let i = 0; i < eyeLens.attributes.position.count; i++) {
  const y = eyeLens.attributes.position.getY(i);
  const edge = ease(0.14, 0.92, -y);
  const shade = darkIris.clone().lerp(amberIris, edge * 0.85);
  lensColors.push(shade.r, shade.g, shade.b);
}
eyeLens.setAttribute('color', new T.Float32BufferAttribute(lensColors, 3));
const eyeGlaze = new T.MeshPhysicalMaterial({
  vertexColors: true,
  roughness: 0.18,
  clearcoat: 0.85,
  clearcoatRoughness: 0.14,
  envMapIntensity: 0.54,
});
function eye(parent, side) {
  return {
    side,
    line: stroke(parent),
    brow: stroke(parent),
    extra: stroke(parent),
    pupil: mesh(parent, eyeLens, eyeGlaze),
    light: ellipse(parent, glintMat),
  };
}
function setEye(e, mood, blink, time, look) {
  const s = e.side,
    x = s * 0.273 + look * 0.01,
    y = 0.985 + (s > 0 ? 0.004 : 0);
  const surprised = mood === 'surprise' || mood === 'calling',
    squeeze = mood === 'determined' || mood === 'hurt';
  const doze = ['sleepy', 'bath', 'calm'].includes(mood);
  const open = !['joy', 'blush', 'eating'].includes(mood) && !doze && !squeeze;
  const wide = surprised ? 1.17 : 1,
    blinkCurve = blink > 0.62;
  e.pupil.visible = open && !blinkCurve;
  e.light.visible = e.pupil.visible;
  e.line.obj.visible = !e.pupil.visible;
  e.extra.obj.visible = squeeze;
  e.brow.obj.visible = squeeze || surprised || mood === 'sleepy';
  if (e.pupil.visible) {
    const ry = 0.067 * wide * (1 - 0.91 * blink),
      rx = 0.052 * wide,
      px = x + 0.004 * sin(time * 0.71);
    const z = surface(px, y);
    e.pupil.position.set(px, y, z + 0.009);
    e.pupil.scale.set(rx, ry, 0.029);
    e.pupil.rotation.y = s * 0.2;
    e.pupil.rotation.z = -s * 0.045;
    e.light.position.set(px + rx * 0.27, y + ry * 0.37, z + 0.037 - s * 0.004);
    e.light.scale.set(0.01 * wide, 0.011 * wide, 0.005);
  }
  if (e.line.obj.visible) {
    if (squeeze) {
      e.line.set((t) => [x + s * (0.067 - 0.123 * t), y + 0.043 - 0.052 * t, 0.009], 0.015);
      e.extra.set((t) => [x - s * 0.054 + s * 0.12 * t, y - 0.01 - 0.032 * t, 0.01], 0.0144);
    } else {
      const curve = blinkCurve ? 0.004 : mood === 'sleepy' ? -0.009 : doze ? -0.02 : 0.043;
      e.line.set(
        (t) => [
          x + (t - 0.5) * (doze ? 0.145 : 0.162),
          y +
            (doze ? -0.001 : -0.012) +
            curve * Math.sin(PI * t) +
            (t - 0.5) * s * (mood === 'sleepy' ? -0.026 : 0.006),
          0.009,
        ],
        doze ? 0.012 : 0.015,
      );
    }
  }
  if (e.brow.obj.visible) {
    const browY = y + (surprised ? 0.108 : mood === 'sleepy' ? 0.077 : 0.086),
      tilt = squeeze ? 0.052 : mood === 'sleepy' ? -0.047 : 0.02;
    e.brow.set(
      (t) => [
        x + (t - 0.5) * (mood === 'sleepy' ? 0.094 : 0.131),
        browY + (t - 0.5) * s * tilt + (mood === 'sleepy' ? -0.01 : 0.016) * Math.sin(PI * t),
        0.007,
      ],
      squeeze ? 0.012 : 0.009,
    );
  }
}

const mouths = {
  joy: [0.105, 0.01, 0.108, 0.02, 0.002],
  blush: [0.106, 0.012, 0.098, 0.024, 0.01],
  calm: [0.094, 0.009, 0.048, 0.018, 0.003],
  sleepy: [0.03, 0.007, 0.009, -0.006, 0.003],
  bath: [0.108, 0.016, 0.06, 0.024, 0.004],
  curious: [0.101, 0.009, 0.102, 0.02, 0.003],
  surprise: [0.086, 0.08, 0.104, 0.001, 0.002],
  calling: [0.118, 0.077, 0.142, -0.004, -0.014],
  determined: [0.13, 0.044, 0.056, -0.024, 0.01],
  hurt: [0.136, 0.053, 0.061, -0.03, -0.017],
  eating: [0.05, 0.008, 0.02, 0.004, 0.007],
};
// A convex, gridded inset is fitted to the lip contour for every expression.
// Its boundary sits under the lip, even when photographed from below or in profile.
function innerPatch(parent, material) {
  const cols = 23,
    rows = 8,
    idx = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = y * (cols + 1) + x;
      idx.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
    }
  const g = dynGeometry((cols + 1) * (rows + 1), idx),
    obj = mesh(parent, g, material);
  return {
    obj,
    set(cx, cy, w, up, down, corners, tilt, kind) {
      const tongue = kind === 'tongue',
        upper = kind === 'upper';
      const cap = tongue ? 0.81 : 0.94;
      for (let i = 0; i <= cols; i++) {
        const u = (i / cols) * 2 - 1,
          q = u * cap + (tongue ? 0.046 : 0),
          x = cx + w * q;
        const span = Math.sqrt(Math.max(0, 1 - q * q)),
          falloff = Math.sqrt(Math.max(0, 1 - u * u));
        const middle = cy + corners * q * q + tilt * q;
        const floor = middle - down * span,
          ceiling = middle + up * span;
        const available = ceiling - floor;
        const tongueCrest = cy - down * (0.46 + 0.47 * u * u) + 0.009 * u;
        const thickness = tongue
          ? Math.max(0, tongueCrest - floor - 0.004) * falloff
          : available * (upper ? 0.44 : 0.34) * falloff;
        for (let j = 0; j <= rows; j++) {
          const t = j / rows;
          const gap = tongue ? 0.0035 : 0.008;
          const y = upper ? ceiling - gap - thickness * (1 - t) : floor + gap + thickness * t;
          const depth = (tongue ? 0.015 : 0.01) + 0.017 * (1 - falloff) + 0.014 * (upper ? 1 - t : t);
          const ridge = Math.sin(t * PI) * falloff * 0.014;
          const groove = tongue ? 0.0035 * Math.exp(-((u / 0.059) ** 2)) * t : 0;
          g.attributes.position.setXYZ(j * (cols + 1) + i, x, y, surface(x, y) - depth + ridge - groove);
        }
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
    },
  };
}
function buildMouth(parent) {
  const count = 58,
    levels = [1.032, 0.972, 0.84, 0.59, 0.3, 0.001],
    ids = [],
    cols = [];
  const shades = ['#935349', '#74392e', '#662d29', '#5b2221', '#55211f', '#602828'];
  for (let j = 0; j < levels.length; j++)
    for (let k = 0; k < count; k++) {
      const i = j * count + k,
        next = j * count + ((k + 1) % count);
      const col = new T.Color(shades[j]);
      cols.push(col.r, col.g, col.b);
      if (j + 1 < levels.length) ids.push(i, next, i + count, next, next + count, i + count);
    }
  const g = dynGeometry(count * levels.length, ids, cols);
  mesh(parent, g, mouthInk);
  const tongue = innerPatch(parent, tongueMat),
    upperTooth = innerPatch(parent, toothMat),
    lowerTooth = innerPatch(parent, toothMat);
  return {
    size: new T.Vector4(),
    x: 0.006,
    y: 0.88,
    slant: { value: 0 },
    update(mood, breath) {
      let [w, up, down, corners, tilt] = mouths[mood] || mouths.joy;
      if (['joy', 'calling', 'surprise', 'blush'].includes(mood)) down *= 1 + 0.084 * breath;
      if (mood === 'sleepy') {
        down += 0.074 * breath;
        up += 0.021 * breath;
      }
      if (mood === 'eating') {
        w *= 0.89 + 0.16 * breath;
        down *= 1 + 0.84 * breath;
      }
      this.size.set(w, up, down, corners);
      this.slant.value = tilt;
      const attrs = g.attributes.position;
      const depth = 0.038 + (up + down) * 0.44;
      for (let j = 0; j < levels.length; j++)
        for (let k = 0; k < count; k++) {
          const theta = (k * TAU) / count,
            cs = Math.cos(theta),
            sn = Math.sin(theta),
            scale = levels[j];
          const x = this.x + w * cs * scale,
            y =
              this.y +
              tilt * cs * scale +
              corners * (cs * scale) ** 2 +
              (sn >= 0 ? up : down) * sn * scale;
          const recess = depth * Math.pow(Math.max(0, 1 - scale), 0.58);
          attrs.setXYZ(j * count + k, x, y, surface(x, y) - 0.0035 - recess);
        }
      attrs.needsUpdate = true;
      g.computeVertexNormals();
      const teeth = mood === 'determined' || mood === 'hurt';
      upperTooth.obj.visible = teeth || mood === 'calling';
      lowerTooth.obj.visible = teeth;
      tongue.obj.visible = !teeth && down > 0.032;
      if (upperTooth.obj.visible) upperTooth.set(this.x, this.y, w, up, down, corners, tilt, 'upper');
      if (lowerTooth.obj.visible) lowerTooth.set(this.x, this.y, w, up, down, corners, tilt, 'lower');
      if (tongue.obj.visible) tongue.set(this.x, this.y, w, up, down, corners, tilt, 'tongue');
    },
  };
}
let bodyGeom;
function limbRig(body) {
  const base = new T.Bone();
  base.name = 'Rice body';
  body.add(base);
  const skeleton = [base],
    arms = [],
    feet = [];
  for (const side of [-1, 1]) {
    const arm = new T.Bone();
    arm.name = 'Soft shoulder ' + side;
    arm.position.set(side * 0.648, 0.591, 0.298);
    base.add(arm);
    skeleton.push(arm);
    arms.push(arm);
  }
  for (const side of [-1, 1]) {
    const foot = new T.Bone();
    foot.name = 'Soft ankle ' + side;
    foot.position.set(side * 0.31, 0.184, 0.02);
    base.add(foot);
    skeleton.push(foot);
    feet.push(foot);
  }
  body.bind(new T.Skeleton(skeleton));
  return { arms, feet };
}
export function makeRiceModel(parent) {
  const face = new T.Group();
  parent.add(face);
  const mouth = buildMouth(face);
  mouth.update('joy', 0);
  const dye = skinMaterial(mouth);
  bodyGeom ??= sculpt();
  const body = new T.SkinnedMesh(bodyGeom, dye.mat);
  body.name = '練りたてのお餅';
  body.castShadow = body.receiveShadow = true;
  body.customDepthMaterial = dye.depth;
  // Bone motion may temporarily stretch a waving hand beyond the rest bounds.
  body.frustumCulled = false;
  parent.add(body);
  const { arms, feet } = limbRig(body),
    eyes = [eye(face, -1), eye(face, 1)];
  const drop = ellipse(face, sweatMat);
  return {
    body,
    dye,
    mouth,
    eyes,
    face,
    arms,
    feet,
    drop,
    press: 0,
    pressV: 0,
    lastFace: '',
    lastMouth: '',
    lastMode: '',
    phase: 0,
    pull: 0,
    pullSpeed: 0,
  };
}

export function colorRice(r, mode, activity, mood) {
  if (r.lastMode !== mode) {
    r.dye.mat.color.copy(mode === 'kusa' ? matcha : mode === 'kinako' ? kinako : ivory);
    r.lastMode = mode;
  }
  r.dye.shared.riceBran.value = mode === 'kinako' ? 1 : 0;
  r.dye.shared.riceBath.value = activity === 'bath' ? 1 : 0;
  r.dye.shared.riceEffort.value = mood === 'hurt' || mood === 'determined' ? 1 : 0;
  r.dye.shared.riceBlush.value = mood === 'blush' ? 1.29 : mood === 'determined' ? 0.83 : 1;
}
function faceAt(r, mood, t) {
  const blinkAge = Math.min(Math.abs((t % 4.86) - 4.58), Math.abs((t % 11.73) - 9.15));
  const blink = 1 - ease(0.012, 0.122, blinkAge),
    gaze = Math.round(sin(t * 0.84) * 2) / 2;
  const eyeKey = mood + '|' + Math.round(blink * 5) + '|' + gaze;
  if (r.lastFace !== eyeKey) {
    for (const eye of r.eyes) setEye(eye, mood, blink, t, gaze);
    r.lastFace = eyeKey;
  }
  const animated = ['joy', 'calling', 'surprise', 'blush', 'eating'].includes(mood);
  const breath =
    mood === 'sleepy'
      ? Math.round(6 * Math.pow(Math.max(0, sin(t * 0.83)), 8)) / 6
      : animated
        ? Math.round(sin(t * (mood === 'eating' ? 9.3 : 3.7)) * 3) / 3
        : 0;
  if (r.lastMouth !== mood + '|' + breath) {
    r.mouth.update(mood, breath);
    r.lastMouth = mood + '|' + breath;
  }
  r.drop.visible = mood === 'determined' || mood === 'hurt';
  if (r.drop.visible) {
    const x = 0.475,
      y = 1.152 - 0.011 * sin(t * 2.1);
    r.drop.position.set(x, y, surface(x, y) + 0.018);
    r.drop.scale.set(0.02, 0.035, 0.015);
    r.drop.rotation.set(-0.32, 0.44, -0.22);
  }
}
export function poseRice(r, p, t, dt, mood) {
  const speed = p.speed || 0,
    ride = !!p.mount,
    activity = p.activity;
  const dango = p.mode === 'dango',
    grounded = p.grounded !== false;
  const walking = grounded && !ride && !activity && !dango;
  const pullTarget = grounded ? 0 : clamp(p.airStretch || 0, 0, 1);
  const stride = walking ? ease(0.06, 3.9, speed) : 0;
  r.phase += dt * (walking ? 2.28 + Math.min(8.6, speed * 1.36) : 2.05);
  const step = sin(r.phase),
    plant = cos(r.phase * 2),
    flair = p.emote;
  const landing = p.landing || 0,
    impact = p.impact || 0;
  const landingLoad = landing > 0.155 ? -0.12 - 0.15 * impact : landing > 0.045 ? 0.105 * impact : 0;
  const target =
    landingLoad +
    (!grounded ? clamp((p.vy || 0) * 0.011, -0.055, 0.14) : 0) +
    stride * plant * 0.055 +
    (activity === 'sleep' ? -0.12 : 0);
  if (dt > 0) {
    // A damped spring stores the landing and releases it through the shoulders.
    const total = Math.min(0.13, dt),
      n = Math.ceil(total / 0.012),
      s = total / n;
    for (let i = 0; i < n; i++) {
      r.pressV += (target - r.press) * 235 * s;
      r.pressV *= Math.exp(-s * 12.4);
      r.press += r.pressV * s;
      r.pullSpeed += (pullTarget - r.pull) * 260 * s;
      r.pullSpeed *= Math.exp(-15.8 * s);
      r.pull += r.pullSpeed * s;
    }
  }
  const tension =
    p.stretch > 0
      ? sin(clamp(p.stretch / (dango ? 0.58 : 0.2), 0, 1) * PI) *
        (dango ? 0.25 : 0.098) *
        (1 - 0.65 * pullTarget)
      : 0;
  const idleRise = !activity && !ride ? 0.009 * sin(t * 2.06) : 0;
  const pull = clamp(r.pull, 0, 1.025);
  const stretch = clamp(1 + r.press + tension + idleRise + pull * 0.28, 0.67, 1.62);
  const width = 1 / Math.sqrt(stretch);
  r.body.morphTargetInfluences[3] = pull;
  r.face.position.y = pull * 1.12;
  r.face.scale.set(1 - 0.25 * pull, 1, 1 - 0.25 * pull);
  r.body.morphTargetInfluences[0] = clamp(-r.press * 4.5 + Math.max(0, -plant) * stride * 0.18, 0, 1);
  r.body.morphTargetInfluences[1] = step * stride * 0.7 + (p.buffs?.drunk > 0 ? sin(t * 3.9) * 0.4 : 0);
  r.body.morphTargetInfluences[2] = dango ? 1 - pull : 0;
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1,
      a = r.arms[i],
      f = r.feet[i],
      phase = s * step;
    const armLift = walking ? phase * stride * 0.2 : 0;
    const tucked = activity === 'read' || activity === 'eat' || activity === 'drink';
    a.scale.set(1, 1, 1);
    a.position.set(s * 0.648, 0.591 + Math.max(0, armLift) * 0.18, 0.298);
    a.rotation.set(phase * stride * 0.39, -s * 0.31, s * (0.01 + armLift));
    if (tucked) {
      a.position.set(s * 0.66, 0.636 + 0.012 * cos(t * 4 + s), 0.34);
      a.scale.set(1.02, 1, 1.52);
      a.rotation.set(-0.23, -s * 0.5, s * 0.15);
      if (activity === 'drink' && s > 0) {
        const sip = 0.5 + 0.5 * sin(t * 4.3);
        a.position.set(0.59, 0.71 + 0.055 * sip, 0.372);
        a.scale.z = 1.66;
        a.rotation.set(-0.5 - 0.21 * sip, -0.7, 0.22);
      } else if (activity === 'eat') {
        if (s > 0) {
          const bite = 0.5 + 0.5 * sin(t * 4.2);
          a.position.set(0.595, 0.651 + 0.097 * bite, 0.46 - 0.07 * bite);
          a.scale.z = 1.64;
          a.rotation.set(-0.41 - 0.43 * bite, -0.7, 0.19);
        } else {
          a.position.set(-0.56, 0.596, 0.49);
          a.rotation.set(-0.12, 0.78, -0.16);
        }
      }
    } else if (flair === 'joy') {
      a.position.y += 0.014 + 0.013 * sin(t * 2.6 + s);
      a.rotation.set(-0.22 - (s > 0 ? 0.11 : 0), -s * 0.46, s * (0.27 + 0.072 * sin(t * 3 + s)));
    } else if (flair === 'surprise') {
      a.rotation.set(-0.62, -s * 0.59, s * 0.5);
    } else if (activity === 'bath') {
      a.position.set(s * 0.65, 0.754, 0.27);
      a.rotation.set(-0.61, -s * 0.37, s * 0.49);
    } else if (activity === 'sleep') {
      a.rotation.set(-0.08, -s * 0.71, s * 0.05);
    } else if (!grounded) {
      a.rotation.set(-0.26, -s * 0.11, s * (0.79 + 0.15 * sin(t * 5)));
    }
    if (p.throwTime > 0 && s > 0) {
      const snap = sin(clamp(p.throwTime / 0.28, 0, 1) * PI);
      a.rotation.set(-0.8 * snap, -0.76 * snap, 0.25 + 0.46 * snap);
      a.position.z += 0.12 * snap;
    }
    if (pull > 0.015) {
      // A skinned hand should trail the stretch instead of rotating around
      // its old, unstretched shoulder.
      a.rotation.x *= 1 - pull;
      a.rotation.z *= 1 - pull;
    }
    if (dango) {
      a.scale.setScalar(1);
      a.rotation.set(0, 0, 0);
      a.position.set(s * 0.648, 0.591, 0.298);
    }
    const lift = Math.max(0, phase) * stride;
    f.position.set(s * 0.31, 0.184 + lift * 0.088, 0.02 - phase * stride * 0.139);
    f.rotation.set(-phase * stride * 0.44, s * 0.055, s * (-0.06 + lift * 0.07));
    f.scale.set(1 + (1 - lift) * stride * 0.08, 1 - lift * 0.065, 1 + lift * 0.105);
    if (ride || tucked) {
      f.rotation.x = -0.22;
      f.position.z += 0.14;
    }
    if (!grounded) {
      f.position.y += 0.079;
      f.rotation.x = 0.42;
    }
    if (dango) {
      f.scale.setScalar(1);
      f.rotation.set(0, 0, 0);
      f.position.set(s * 0.31, 0.184, 0.02);
    }
  }
  r.dye.shared.riceNight.value = p.night ? 1 : 0;
  colorRice(r, p.mode, activity, mood);
  faceAt(r, mood, t);
  return {
    stretch,
    width,
    bob: walking ? Math.abs(step) * stride * 0.067 : 0,
    lean: walking ? -step * stride * 0.051 : 0,
    pitch: walking ? -0.045 * stride + plant * 0.033 * stride : 0,
    breath: idleRise,
    extension: pull * 1.12,
    pull,
  };
}
