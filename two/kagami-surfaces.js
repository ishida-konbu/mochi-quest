import * as T from './vendor/three.module.min.js';

const textures = new Map();

// Seamless channels: slow colour changes, a relief map and local surface roughness.
// Bake once, then use mipmapped lookups so the detail settles at gameplay distances.
function surfaceTexture(fruit) {
  if (textures.has(fruit)) return textures.get(fruit);
  const size = 192;
  let seed = fruit ? 14976 : 71103;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function noise(cells) {
    const values = Float32Array.from({ length: cells * cells }, random);
    return (x, y) => {
      const u = x * cells / size, v = y * cells / size;
      const col = Math.floor(u), row = Math.floor(v);
      const a = T.MathUtils.smootherstep(u - col, 0, 1), b = T.MathUtils.smootherstep(v - row, 0, 1);
      const sample = (i,j) => values[(i % cells) + (j % cells) * cells];
      return T.MathUtils.lerp(T.MathUtils.lerp(sample(col,row),sample(col+1,row),a),
        T.MathUtils.lerp(sample(col,row+1),sample(col+1,row+1),a), b);
    };
  }
  const cloud = noise(5), bloom = noise(14), stipple = noise(40);
  const pits = new Float32Array(size * size);
  // Deep oil glands on citrus; shallower, stretched impressions in pressed rice.
  for (let i = 0; i < (fruit ? 620 : 280); i++) {
    const cx = random() * size, cy = random() * size;
    const rx = fruit ? 1.8 + random() ** 2 * 3.3 : 1.6 + random() ** 2 * 4.8;
    const ry = rx * (fruit ? .80 + .28 * random() : .32 + .58 * random());
    const angle = random() * Math.PI, cosine = Math.cos(angle), sine = Math.sin(angle);
    const reach = Math.ceil(Math.max(rx, ry) * 1.4), depth = .45 + .55 * random();
    for (let y = Math.floor(cy) - reach; y <= cy + reach; y++) {
      for (let x = Math.floor(cx) - reach; x <= cx + reach; x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.hypot((dx*cosine + dy*sine) / rx, (dy*cosine - dx*sine) / ry);
        if (d > 1.36) continue;
        const core = Math.max(0, 1 - d*d);
        const lip = Math.max(0, 1 - Math.abs(d - .91) * 3.6);
        pits[((y + size) % size) * size + (x + size) % size] += depth * (.24 * lip - core * core);
      }
    }
  }
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const mist = cloud(x,y)*.54 + bloom(x,y)*.32 + stipple(x,y)*.14;
      const fine = random() - .5, pit = pits[i];
      pixels[4*i] = 255 * T.MathUtils.clamp(mist + fine*.044, 0, 1);
      pixels[4*i+1] = 255 * T.MathUtils.clamp(.48 + (mist-.5)*.32 + pit*.42 + fine*.065, 0, 1);
      pixels[4*i+2] = 255 * T.MathUtils.clamp(.37 + mist*.3 + pit*.26 + fine*.14, 0, 1);
      pixels[4*i+3] = 255;
    }
  }
  const texture = new T.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  textures.set(fruit, texture);
  return texture;
}

const sampleSurface = `
  uniform sampler2D finishMap;
  varying vec3 finishPosition, finishNormal;
  vec3 sampleFinish(vec3 p) {
    vec3 w = pow(abs(normalize(finishNormal)), vec3(5.));
    w /= max(dot(w,vec3(1.)),.001);
    return texture2D(finishMap,p.yz).rgb*w.x + texture2D(finishMap,p.zx).rgb*w.y +
           texture2D(finishMap,p.xy).rgb*w.z;
  }`;

function finishShader(shader, fruit) {
  shader.uniforms.finishMap = { value: surfaceTexture(fruit) };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 finishPosition, finishNormal;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nfinishPosition=position; finishNormal=normal;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + sampleSurface);
}

function relief(strength) {
  return `
    vec3 ex = dFdx(-vViewPosition), ey = dFdy(-vViewPosition);
    vec3 tx = cross(ey,normal), ty = cross(normal,ex);
    float orientation = dot(ex,tx);
    float skinHeight = detail.g * ${strength};
    normal = normalize(normal - sign(orientation)*(tx*dFdx(skinHeight) + ty*dFdy(skinHeight))
                                / max(abs(orientation),1.e-10));`;
}

// Share the upper tier's rig, expressions and painted cheeks with the original
// character. Its distinct material is selected only while wearing the kagami.
export function riceFinish(original = null) {
  const upper = original !== null;
  const material = upper ? original.clone() : new T.MeshPhysicalMaterial({color: '#f4e7cf'});
  if (upper) {
    material.defines = { ...original.defines, KAGAMI_STARCH: 1 };
    material.normalScale.set(.075,.075);
  }
  material.roughness = .47;
  material.clearcoat = .12;
  material.clearcoatRoughness = .44;
  material.sheen = .18;
  material.sheenRoughness = .78;
  material.sheenColor.set('#ffe1b9');
  material.customProgramCacheKey = () => upper ? 'kagami-painted-flour' : 'kagami-pressed-flour';
  material.onBeforeCompile = shader => {
    if (upper) original.onBeforeCompile(shader);
    finishShader(shader, false);
    const start = upper ? 'diffuseColor.rgb=mix(dough,features.rgb,paint);' : '#include <map_fragment>';
    const mask = upper ? 'skinMask' : '1.';
    shader.fragmentShader = shader.fragmentShader
      .replace(start, start + `
        vec3 detail = sampleFinish(finishPosition * ${upper ? 'vec3(.79,.49,.79)' : '1.55'});
        float flour = smoothstep(.28,.78,detail.r);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.98,.946,.862), flour*.32*${mask});
        diffuseColor.rgb *= 1. + ${mask}*((detail.r-.5)*.15 + (detail.g-.5)*.10);
      ` + (upper ? '' : `
        // Soft contact where the upper cake rests in the shoulder below it.
        float seat = smoothstep(.38,.53,finishPosition.y)*(1.-smoothstep(.48,.72,length(finishPosition.xz)));
        diffuseColor.rgb *= mix(vec3(1.),vec3(.72,.65,.57),seat);
      `))
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor += (flour-.46)*.26*${mask};`)
      .replace('#include <clearcoat_normal_fragment_begin>', relief(upper ? '.00065*skinMask' : '.00082') + '\n#include <clearcoat_normal_fragment_begin>');
  };
  return material;
}

function peelMaterial() {
  const peel = new T.MeshPhysicalMaterial({color: '#ec870e', roughness: .47,
    clearcoat: .16, clearcoatRoughness: .40, sheen: .11, sheenColor: '#ffbb56'});
  peel.onBeforeCompile = shader => {
    finishShader(shader, true);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec3 detail = sampleFinish(finishPosition*5.1);
        float gland = smoothstep(.13,.51,detail.g);
        float yellow = smoothstep(.29,.80,detail.r + .07*finishNormal.y);
        diffuseColor.rgb = mix(vec3(.87,.226,.006),vec3(.99,.34,.013),yellow);
        diffuseColor.rgb *= .94 + .06*gland;
        float shoulder = smoothstep(.76,.99,finishNormal.y) * (.18 + smoothstep(.46,.76,detail.r)*.32);
        diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.48,.28,.024),shoulder);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor += (detail.b-.5)*.43;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + relief('.00085'));
  };
  return peel;
}

function citrusLeaf() {
  const positions = [], uvs = [], indices = [];
  const rows = 30, columns = 8;
  for (let i = 0; i <= rows; i++) {
    const u = i/rows, sin = Math.sin(Math.PI*u);
    const breadth = .060 * Math.pow(sin,.78) * (1.13 - .16*u);
    for (let j = 0; j <= columns; j++) {
      const t = 2*j/columns-1;
      const edge = t*breadth*(1+.028*Math.sin(u*36 + t));
      positions.push(.292*u-.012*t*sin,
        .174+.047*sin+.007*u+.82*edge-.016*t*t*sin,
        .017+.045*sin+.088*u-.66*edge+.014*t*t*sin);
      uvs.push(u,j/columns);
      if (i && j) {
        const p=i*(columns+1)+j;
        indices.push(p-1,p-columns-2,p, p,p-columns-2,p-columns-1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const material = new T.MeshPhysicalMaterial({side:T.DoubleSide, color:'#41672c',
    roughness:.43, clearcoat:.13, clearcoatRoughness:.32});
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec2 leafUV;').replace('#include <begin_vertex>', '#include <begin_vertex>\nleafUV=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec2 leafUV;').replace('#include <color_fragment>', `#include <color_fragment>
        float u=leafUV.x, v=leafUV.y*2.-1., side=abs(v);
        float mid=1.-smoothstep(.014,.055,side);
        float branchPhase=u*7.7-.93*pow(side,1.28) + step(0.,v)*.16;
        float branch=1.-smoothstep(.012,.077,abs(fract(branchPhase+.5)-.5));
        vec3 leaf=mix(vec3(.032,.090,.019),vec3(.090,.212,.042),u*.43+.45*(1.-side));
        leaf*=1.+.08*sin(leafUV.x*97.+v*13.)*sin(v*23.);
        leaf=mix(leaf,vec3(.29,.40,.091),branch*(1.-side)*.78);
        diffuseColor.rgb=mix(leaf,vec3(.38,.46,.12),mid*.86);`);
  };
  const mesh = new T.Mesh(geometry,material);
  mesh.castShadow=true;
  return mesh;
}

export function daidai() {
  const fruit = new T.Group();
  const shape = new T.SphereGeometry(.166,48,32);
  const p = shape.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i), angle=Math.atan2(z,x);
    const pole=y/.166, waist=Math.max(0,1-pole*pole);
    const ribs=1+waist*(.014*Math.cos(angle*7+.4*pole)+.008*Math.sin(angle*3-.7*pole));
    p.setXYZ(i,x*ribs*1.045,y*.89 - .022*Math.max(0,pole)**13 + .010*Math.max(0,-pole)**11,z*ribs);
  }
  shape.computeVertexNormals();
  // Join normals on the sphere's duplicate UV seam and gently cupped poles.
  const normals=shape.attributes.normal, joined=new T.Vector3(), other=new T.Vector3();
  for(let row=0;row<=32;row++){
    const a=row*49,b=a+48;
    if(row===0 || row===32){
      for(let i=a;i<=b;i++) normals.setXYZ(i,0,row===0 ? 1 : -1,0);
    } else {
      joined.fromBufferAttribute(normals,a).add(other.fromBufferAttribute(normals,b)).normalize();
      for(const i of [a,b]) normals.setXYZ(i,joined.x,joined.y,joined.z);
    }
  }
  const orange=new T.Mesh(shape,peelMaterial());
  orange.castShadow=true;
  fruit.add(orange);
  // Curl the five sepals down against the little hollow around the stalk.
  const positions=[], colors=[], indices=[];
  const moss=new T.Color('#5c702e'), tip=new T.Color('#8a8a39');
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5+.28;
    for(const [r,bend,y,c] of [[.004,0,.144,moss],[.023,-.64,.136,moss],[.030,.10,.142,tip],[.057,.24,.132,tip],[.023,.74,.136,moss]]){
      positions.push(r*Math.cos(a+bend),y,r*Math.sin(a+bend)); colors.push(c.r,c.g,c.b);
    }
    const j=5*i;
    indices.push(j,j+2,j+1,j+1,j+2,j+3,j+3,j+2,j+4,j+4,j+2,j);
  }
  const calyx=new T.BufferGeometry();
  calyx.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  calyx.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  calyx.setIndex(indices); calyx.computeVertexNormals();
  fruit.add(new T.Mesh(calyx,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.68})));
  const stem = new T.Mesh(new T.CylinderGeometry(.008,.013,.046,9),new T.MeshStandardMaterial({color:'#655534',roughness:.83}));
  stem.position.set(-.003,.157,0); stem.rotation.z=.13;
  fruit.add(stem,citrusLeaf());
  return fruit;
}
