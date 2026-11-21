import * as T from './vendor/three.module.min.js';

const PI = Math.PI;
const TAU = PI * 2;
const clamp = T.MathUtils.clamp;
const ease = (lo, hi, x) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const ivory = new T.Color('#fff6e9');
const matcha = new T.Color('#afc885');
const kinako = new T.Color('#e3b674');
const ink = new T.MeshPhysicalMaterial({
  color: '#2a201e',
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
  color: '#d9837f',
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
      new URL('./assets/actors/rice-surface.webp', import.meta.url).href,
    );
    powderTex.colorSpace = T.NoColorSpace;
    powderTex.wrapS = powderTex.wrapT = T.RepeatWrapping;
    powderTex.anisotropy = 4;
  }
  return powderTex;
}

function bodyDistance(x, y, z) {
  const cy = (y - 0.875) / 0.736;
  const rx = 0.836 - 0.07 * clamp(cy, -1, 1);
  const rz = 0.751 - 0.055 * clamp(cy, -1, 1);
  const horizontal = (x * x) / (rx * rx) + (z * z) / (rz * rz);
  // A soft shoulder over a broad, yielding base, with a very slight tilt in the crown.
  const py = cy + 0.015 * x - 0.009 * z;
  const exponent = py > 0 ? 2.02 : 2.54;
  let d =
    (Math.pow(Math.pow(horizontal, exponent / 2) + Math.pow(Math.abs(py), exponent), 1 / exponent) - 1) *
    0.735;
  if (z > 0.25 && y > 0.39 && y < 1.34) {
    const ax = Math.abs(x),
      front = ease(0.25, 0.58, z);
    const cheek = Math.exp(-(((ax - 0.385) / 0.151) ** 2 + ((y - 0.926) / 0.127) ** 2));
    const eye = Math.exp(-(((ax - 0.249) / 0.153) ** 2 + ((y - 1.108) / 0.077) ** 2));
    const muzzle = Math.exp(-((x / 0.24) ** 2 + ((y - 0.861) / 0.128) ** 2));
    d += front * (0.014 * eye - 0.033 * cheek - 0.012 * muzzle);
  }
  return d;
}
function capsule(x, y, z, a, b, r1, r2) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    dz = b[2] - a[2];
  const t = clamp(
    ((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / (dx * dx + dy * dy + dz * dz),
    0,
    1,
  );
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy, z - a[2] - t * dz) - (r1 + (r2 - r1) * t);
}
function smoothUnion(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const shoulder = [0.643, 0.653, 0.2],
  elbow = [0.778, 0.526, 0.288],
  palm = [0.745, 0.482, 0.473];
function armDistance(x, y, z) {
  return smoothUnion(
    capsule(x, y, z, shoulder, elbow, 0.131, 0.147),
    capsule(x, y, z, elbow, palm, 0.147, 0.14),
    0.052,
  );
}
function footDistance(x, y, z) {
  const px = x - 0.405 - 0.059 * (z - 0.16),
    py = y - 0.147 + 0.026 * (z - 0.16),
    pz = z - 0.17;
  const n = Math.sqrt((px / 0.218) ** 2 + (py / 0.148) ** 2 + (pz / 0.278) ** 2);
  return (n - 1) * 0.172;
}

// Surface nets resolve the belly, paws and feet as a single continuous skin.
// The same distance fields supply soft joint weights on either side of each fold.
function sculpt() {
  const nx = 75,
    ny = 65,
    nz = 63,
    step = 0.0275,
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
        const x = ox + ix * step,
          y = oy + iy * step,
          z = oz + iz * step,
          ax = Math.abs(x);
        let d = bodyDistance(x, y, z);
        if (ax > 0.38 && y < 0.91 && y > 0.22 && z > -0.22)
          d = smoothUnion(d, armDistance(ax, y, z), 0.082);
        if (ax > 0.1 && y < 0.47 && z > -0.26) d = smoothUnion(d, footDistance(ax, y, z), 0.064);
        values[ix + iy * nx + iz * slice] = d;
      }
  const pos = [],
    indices = [],
    weights = [],
    bones = [],
    press = [],
    sway = [],
    round = [];
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
        const x = ox + (ix + ax / count) * step,
          y = oy + (iy + ay / count) * step,
          z = oz + (iz + az / count) * step;
        cellIndices[at] = pos.length / 3;
        pos.push(x, y, z);
        const ab = Math.abs(x),
          base = bodyDistance(x, y, z),
          ad = armDistance(ab, y, z),
          fd = footDistance(ab, y, z);
        const aw = ease(-0.047, 0.121, base - ad) * ease(0.43, 0.665, ab) * ease(0.21, 0.43, y);
        const fw = ease(-0.052, 0.091, base - fd) * (1 - ease(0.245, 0.415, y)) * (1 - aw);
        bones.push(0, x < 0 ? 1 : 2, x < 0 ? 3 : 4, 0);
        weights.push(1 - aw - fw, aw, fw, 0);
        const faceMask =
          1 -
          ease(0.28, 0.52, z) *
            (1 - ease(0.49, 0.63, ab)) *
            (ease(0.61, 0.77, y) * (1 - ease(1.22, 1.38, y)));
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
  g.computeVertexNormals();
  g.morphTargetsRelative = true;
  g.morphAttributes.position = [press, sway, round].map((a) => new T.Float32BufferAttribute(a, 3));
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
  };
  const mat = new T.MeshPhysicalMaterial({
    color: ivory,
    roughness: 0.5,
    clearcoat: 0.47,
    clearcoatRoughness: 0.21,
    specularIntensity: 0.78,
    sheen: 0.31,
    sheenRoughness: 0.69,
    sheenColor: '#fff7eb',
    envMapIntensity: 0.91,
    emissive: '#ffe7d4',
    emissiveIntensity: 0.115,
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
      varying vec3 riceDirection; uniform sampler2D riceFlour;uniform float riceBlush,riceBath;
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
      vec3 grain=flourSample(ricePoint*.94,normalize(riceDirection));
      vec3 fleck=flourSample(ricePoint*2.41+vec3(.38,.19,.70),normalize(riceDirection));
      float powder=smoothstep(.27,.72,grain.r*.79+fleck.g*.21);
      diffuseColor.rgb*=mix(vec3(.990,.980,.975),vec3(1.012),powder);
      diffuseColor.rgb*=.991+.020*grain.g;
      float powderGrain=smoothstep(.545,.77,grain.g)*(.62+.38*powder);
      diffuseColor.rgb+=vec3(.051,.045,.040)*powderGrain;
      float glazedCrown=smoothstep(.74,1.47,ricePoint.y);
      vec2 cheekUV=vec2((abs(ricePoint.x)-.402)/.167,(ricePoint.y-.987)/.107);
      float blush=exp(-dot(cheekUV,cheekUV)*1.33)*smoothstep(.37,.57,ricePoint.z)*riceBlush;
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.03,.30,.34),blush*.82);
      vec2 cheeks=vec2(abs(ricePoint.x)-.399,ricePoint.y-.986);
      float hatchMask=exp(-pow(abs(cheeks.x/.067),4.)-pow(abs(cheeks.y/.027),4.));
      float hatch=1.-smoothstep(.024,.119,abs(fract((cheeks.x-cheeks.y*.44)*46.+.5)-.5));
      diffuseColor.rgb*=1.-vec3(.047,.153,.128)*hatch*hatchMask*blush;
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor=mix(.535+grain.b*.034,.240+.130*powder,glazedCrown*.94+riceBath*(1.-glazedCrown)*.79);
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>
      float skinHeight=(grain.g*.00091+fleck.g*.00024)*mix(.65,1.,glazedCrown);
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
        material.clearcoat*=.20+.76*glazedCrown+.14*riceBath;
        material.clearcoatRoughness=clamp(material.clearcoatRoughness+.12*(1.-glazedCrown)+.09*grain.r,.15,.70);
      #endif
    `,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      float edge=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.7);
      float behind=.17;
      #if NUM_DIR_LIGHTS > 0
        behind+=.74*max(dot(-normalize(vViewPosition),directionalLights[0].direction),0.);
      #endif
      outgoingLight+=vec3(.26,.118,.059)*behind*edge*diffuseColor.rgb+vec3(.021,.003,.001)*blush;
      // A long patch of bright morning sky catches the moist starch. Moving
      // around the bather moves the highlight across the flour and the cheeks.
      vec3 mirrorRay=inverseTransformDirection(reflect(-normalize(vViewPosition),normal),viewMatrix);
      vec3 skylight=normalize(vec3(.84,.89,.61));
      vec3 tangent=normalize(cross(skylight,vec3(0.,1.,0.)));
      vec3 bitangent=cross(skylight,tangent);
      vec2 windowCone=vec2(dot(mirrorRay,tangent)*2.2,dot(mirrorRay,bitangent)*4.8);
      float reflection=exp(-dot(windowCone,windowCone)*1.45)*smoothstep(.55,.95,dot(mirrorRay,skylight));
      float dewy=mix(.18,1.,glazedCrown)*(1.-.58*powder)+riceBath*.21;
      outgoingLight+=vec3(.49,.41,.32)*reflection*dewy*(.46+fleck.g*1.03);
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
function eye(parent, side) {
  return {
    side,
    line: stroke(parent),
    brow: stroke(parent),
    extra: stroke(parent),
    pupil: ellipse(parent, ink),
    light: ellipse(parent, glintMat),
  };
}
function setEye(e, mood, blink, time, look) {
  const s = e.side,
    x = s * 0.244 + look * 0.012,
    y = 1.129 + (s > 0 ? 0.011 : 0);
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
  e.brow.obj.visible = squeeze || surprised;
  if (e.pupil.visible) {
    const ry = 0.057 * wide * (1 - 0.91 * blink),
      rx = 0.039 * wide,
      px = x + 0.004 * sin(time * 0.71);
    const z = surface(px, y);
    e.pupil.position.set(px, y, z + 0.009);
    e.pupil.scale.set(rx, ry, 0.026);
    e.pupil.rotation.y = s * 0.2;
    e.pupil.rotation.z = -s * 0.045;
    e.light.position.set(px - rx * 0.3, y + ry * 0.35, z + 0.034);
    e.light.scale.set(0.01 * wide, 0.012 * wide, 0.0047);
  }
  if (e.line.obj.visible) {
    if (squeeze) {
      e.line.set((t) => [x + s * (0.067 - 0.123 * t), y + 0.043 - 0.052 * t, 0.009], 0.015);
      e.extra.set((t) => [x - s * 0.054 + s * 0.12 * t, y - 0.01 - 0.032 * t, 0.01], 0.0144);
    } else {
      const curve = blinkCurve ? 0.004 : doze ? -0.031 : 0.054;
      e.line.set(
        (t) => [
          x + (t - 0.5) * (doze ? 0.151 : 0.151),
          y + curve * Math.sin(PI * t) + (t - 0.5) * s * 0.012,
          0.009,
        ],
        doze ? 0.013 : 0.0155,
      );
    }
  }
  if (e.brow.obj.visible) {
    const browY = y + (surprised ? 0.108 : 0.086),
      tilt = squeeze ? 0.052 : 0.02;
    e.brow.set(
      (t) => [x + (t - 0.5) * 0.131, browY + (t - 0.5) * s * tilt + 0.016 * Math.sin(PI * t), 0.007],
      squeeze ? 0.012 : 0.009,
    );
  }
}

const mouths = {
  joy: [0.169, 0.015, 0.126, 0.03, -0.012],
  blush: [0.151, 0.019, 0.107, 0.024, 0.013],
  calm: [0.094, 0.009, 0.048, 0.018, 0.003],
  sleepy: [0.039, 0.011, 0.02, -0.002, 0.004],
  bath: [0.108, 0.016, 0.06, 0.024, 0.004],
  curious: [0.068, 0.004, 0.02, 0.015, 0.005],
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
  const shades = ['#92635b', '#5d3334', '#47252c', '#44232c', '#522c30', '#603638'];
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
    y: 0.952,
    slant: { value: 0 },
    update(mood, breath) {
      let [w, up, down, corners, tilt] = mouths[mood] || mouths.joy;
      if (['joy', 'calling', 'surprise', 'blush'].includes(mood)) down *= 1 + 0.084 * breath;
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
    arm.position.set(side * 0.648, 0.662, 0.171);
    base.add(arm);
    skeleton.push(arm);
    arms.push(arm);
  }
  for (const side of [-1, 1]) {
    const foot = new T.Bone();
    foot.name = 'Soft ankle ' + side;
    foot.position.set(side * 0.381, 0.226, 0.081);
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
    arms,
    feet,
    drop,
    press: 0,
    pressV: 0,
    lastFace: '',
    lastMouth: '',
    lastMode: '',
    phase: 0,
  };
}

export function colorRice(r, mode, activity, mood) {
  if (r.lastMode !== mode) {
    r.dye.mat.color.copy(mode === 'kusa' ? matcha : mode === 'kinako' ? kinako : ivory);
    r.lastMode = mode;
  }
  r.dye.shared.riceBath.value = activity === 'bath' ? 1 : 0;
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
  const breath = animated ? Math.round(sin(t * (mood === 'eating' ? 9.3 : 3.7)) * 3) / 3 : 0;
  if (r.lastMouth !== mood + '|' + breath) {
    r.mouth.update(mood, breath);
    r.lastMouth = mood + '|' + breath;
  }
  r.drop.visible = mood === 'determined' || mood === 'hurt';
  if (r.drop.visible) {
    const x = 0.492,
      y = 1.22 - 0.011 * sin(t * 2.1);
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
  const stride = walking ? Math.min(1, 0.15 + speed * 0.24) : 0;
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
    }
  }
  const tension =
    p.stretch > 0 ? sin(clamp(p.stretch / (dango ? 0.58 : 0.2), 0, 1) * PI) * (dango ? 0.66 : 0.097) : 0;
  const idleRise = !activity && !ride ? 0.011 * sin(t * 2.06) : 0;
  const stretch = clamp(1 + r.press + tension + idleRise, 0.68, 1.72);
  const width = 1 / Math.sqrt(stretch);
  r.body.morphTargetInfluences[0] = clamp(-r.press * 4.5 + Math.max(0, -plant) * stride * 0.18, 0, 1);
  r.body.morphTargetInfluences[1] = step * stride * 0.7 + (p.buffs?.drunk > 0 ? sin(t * 3.9) * 0.4 : 0);
  r.body.morphTargetInfluences[2] = dango ? 1 : 0;
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1,
      a = r.arms[i],
      f = r.feet[i],
      phase = s * step;
    const armLift = walking ? phase * stride * 0.2 : 0;
    const tucked = activity === 'read' || activity === 'eat' || activity === 'drink';
    a.scale.set(1, 1, 1);
    a.position.set(s * 0.648, 0.662 + Math.max(0, armLift) * 0.18, 0.171);
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
          a.rotation.set(-0.41 - 0.43 * bite, -0.70, 0.19);
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
    if (dango) {
      a.scale.setScalar(1);
      a.rotation.set(0, 0, 0);
      a.position.set(s * 0.648, 0.662, 0.171);
    }
    const lift = Math.max(0, phase) * stride;
    f.position.set(s * 0.381, 0.226 + lift * 0.088, 0.081 - phase * stride * 0.139);
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
      f.position.set(s * 0.381, 0.226, 0.081);
    }
  }
  colorRice(r, p.mode, activity, mood);
  faceAt(r, mood, t);
  return {
    stretch,
    width,
    bob: walking ? Math.abs(step) * stride * 0.067 : 0,
    lean: walking ? -step * stride * 0.051 : 0,
    pitch: walking ? -0.045 * stride + plant * 0.033 * stride : 0,
    breath: idleRise,
  };
}
