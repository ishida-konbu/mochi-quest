import * as T from './vendor/three.module.min.js';

const TAU = 2 * Math.PI;
let starchMap;

// A tile of starch dust with broad wiped areas and much smaller clumps. The
// blue channel carries the flour veil, green the roughness, red its relief and
// alpha the fine grain suspended within each patch.
function starch() {
  if (starchMap) return starchMap;
  const size = 128;
  let seed = 0xab57fa;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  function cloud(n) {
    const lattice = Float32Array.from({length:n*n}, random);
    return (x,y) => {
      const u=x*n/size, v=y*n/size, i=Math.floor(u), j=Math.floor(v);
      const a=T.MathUtils.smoothstep(u-i,0,1), b=T.MathUtils.smoothstep(v-j,0,1);
      const sample=(dx,dy)=>lattice[((i+dx)%n+n)%n+n*(((j+dy)%n+n)%n)];
      return T.MathUtils.lerp(T.MathUtils.lerp(sample(0,0),sample(1,0),a),
        T.MathUtils.lerp(sample(0,1),sample(1,1),a),b);
    };
  }
  const wipe=cloud(3), dust=cloud(11), grains=new Float32Array(size*size);
  for (let grain=0;grain<430;grain++) {
    const cx=random()*size, cy=random()*size, r=.7+random()**2*2.1;
    for (let y=Math.floor(cy-r);y<=cy+r;y++) {
      for (let x=Math.floor(cx-r);x<=cx+r;x++) {
        const d=((x-cx)**2+(y-cy)**2)/(r*r);
        if (d<1) grains[(y+size)%size*size+(x+size)%size] += (1-d)**2;
      }
    }
  }
  const pixels=new Uint8Array(size*size*4);
  for (let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const i=y*size+x;
    const u=TAU*x/size, v=TAU*y/size;
    const patch=T.MathUtils.smoothstep(wipe(x+6*Math.sin(v),y)+.18*dust(x,y),.40,.80);
    const clump=Math.min(1,grains[i]);
    const flour=Math.min(1,patch*(.40+.44*dust(x,y)+.27*clump));
    // Pulled, slightly ridged grain peeks through where fingers wiped the flour.
    const grain=Math.sin(7*v+2*u+2*Math.sin(u)+2.5*Math.sin(v+u));
    const ridge=(.5+.5*grain)**4*(1-patch)*dust(x+12,y);
    pixels[4*i]   = 89+43*flour+clump*(15+39*patch)+69*ridge+(random()-.5)*6;
    pixels[4*i+1] = 94+133*flour+16*ridge;
    pixels[4*i+2] = Math.round(255*flour);
    pixels[4*i+3] = Math.round(255*T.MathUtils.clamp(.5+(clump-.12)*(.11+.67*patch)+.23*(dust(x,y)-.5),0,1));
  }
  starchMap=new T.DataTexture(pixels,size,size);
  starchMap.wrapS=starchMap.wrapT=T.RepeatWrapping;
  starchMap.minFilter=T.LinearMipmapLinearFilter;
  starchMap.magFilter=T.LinearFilter;
  starchMap.generateMipmaps=true;
  starchMap.needsUpdate=true;
  return starchMap;
}

function riceMaterial() {
  const texture=starch();
  const material=new T.MeshPhysicalMaterial({vertexColors:true, bumpMap:texture,
    bumpScale:.00042, roughnessMap:texture, roughness:.99, sheen:.13, sheenRoughness:.69,
    sheenColor:'#ffe7d8', specularIntensity:.48});
  material.onBeforeCompile = shader => {
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec4 riceSurface = texture2D(bumpMap,vBumpMapUv);
      float riceFlour = riceSurface.b;
      vec3 compressedRice = diffuseColor.rgb * vec3(.90,.875,.86);
      diffuseColor.rgb = mix(compressedRice, mix(diffuseColor.rgb,vec3(1.,.964,.90),.26), riceFlour)
                       * (1. + .23*(riceSurface.a-.5));`)
      .replace('#include <transmission_fragment>', `#include <transmission_fragment>
      // A trace of ambient light scatters through the soft, exposed rim of the dough.
      float softRim = pow(1. - saturate(dot(geometryNormal,geometryViewDir)), 1.7);
      totalDiffuse += reflectedLight.indirectDiffuse * vec3(1.,.80,.64) * .24 * softRim * (1. - .6*riceFlour);`);
  };
  return material;
}

// Start from a hand-rolled ball. Shape only the shallow thumb impression and
// the two places where the willow enters the dough.
export function addMochibanaRice(bouquet,morsels) {
  if (!morsels.length) return;
  const columns=20, rows=18;
  const mould=new T.SphereGeometry(1,columns,rows);
  const base=mould.getAttribute('position'), uv=mould.getAttribute('uv');
  const positions=[], indices=[], colors=[], texcoords=[], normals=[];
  const local=mould.clone(), press=local.getAttribute('position');
  const p=new T.Vector3(), n=new T.Vector3(), seamNormal=new T.Vector3();
  const up=new T.Vector3(0,1,0), orientation=new T.Quaternion(), roll=new T.Quaternion();
  const tint=new T.Color(), litFlour=new T.Color('#ffefdd');
  for(const [index,m] of morsels.entries()) {
    const phase=(index*2.39996+m.roll)%TAU;
    const stride=positions.length/3;
    const stalk=T.MathUtils.clamp((m.stemRadius || .006)/m.scale.x,.08,.50);
    orientation.setFromUnitVectors(up,m.direction);
    orientation.multiply(roll.setFromAxisAngle(up,m.roll));
    for(let i=0;i<base.count;i++) {
      const x=base.getX(i), y=base.getY(i), z=base.getZ(i);
      const sine=Math.hypot(x,z), a=Math.atan2(z,x), across=Math.cos(a-phase), around=Math.sin(a-phase);
      const foldY=.12+.22*around+.13*Math.sin(phase);
      const hollow=Math.exp(-((y-foldY)**2)/.047) * (.33+.67*(.5+.5*across)**2);
      const lobe=.010*Math.sin(3*a+.6*y+phase)+.006*Math.sin(2*a-2*y-phase);
      const thumb=Math.max(0,across)**5*Math.exp(-((y+.14)**2)/.31);
      // The skin gathers at one edge of the thumb pad. Only part of this
      // oblique crease is visible, depending on the way the morsel is turned.
      const gathered=Math.exp(-((y+.24-.27*around)**2)/.026)*Math.max(0,.75*across+.55*around)**3;
      const skin=1+sine*lobe-m.pinchDepth*hollow-.026*thumb-.014*gathered;
      const socket=Math.exp(-((sine/(stalk+.17))**2));
      press.setXYZ(i,x*skin, y*(1-.042*socket), z*skin);
      const pressure=T.MathUtils.clamp(.44*socket+.24*hollow*(.5+.5*across)+.10*thumb+.18*gathered,0,1);
      const milk=.03+.10*T.MathUtils.smoothstep(.5+.5*Math.sin(x*3.7+phase)*Math.cos(z*3.2-y*2.3),.30,.90);
      tint.copy(m.color).lerp(litFlour,milk);
      colors.push(tint.r*(1-.15*pressure),tint.g*(1-.25*pressure),tint.b*(1-.31*pressure));
      texcoords.push(uv.getX(i)*2.0 + index*.37, uv.getY(i) + index*.21);
    }
    local.computeVertexNormals();
    const localNormals=local.getAttribute('normal');
    // The stamp has a continuous skin across the longitude texture seam.
    for(let j=0;j<=rows;j++) {
      const left=j*(columns+1), right=left+columns;
      if (j===0 || j===rows) {
        for(let k=left;k<=right;k++) localNormals.setXYZ(k,0,j===0?1:-1,0);
      } else {
        seamNormal.fromBufferAttribute(localNormals,left).add(n.fromBufferAttribute(localNormals,right)).normalize();
        localNormals.setXYZ(left,seamNormal.x,seamNormal.y,seamNormal.z);
        localNormals.setXYZ(right,seamNormal.x,seamNormal.y,seamNormal.z);
      }
    }
    for(let i=0;i<press.count;i++) {
      p.fromBufferAttribute(press,i).multiply(m.scale).applyQuaternion(orientation).add(m.center);
      positions.push(p.x,p.y,p.z);
      n.fromBufferAttribute(localNormals,i).divide(m.scale).normalize().applyQuaternion(orientation);
      normals.push(n.x,n.y,n.z);
    }
    for(const idx of mould.index.array) indices.push(stride+idx);
  }
  mould.dispose(); local.dispose();
  const geo=new T.BufferGeometry();
  for(const [attribute, array, width] of [['position',positions,3],['normal',normals,3],
    ['color',colors,3],['uv',texcoords,2]]) geo.setAttribute(attribute,new T.Float32BufferAttribute(array,width));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  const rice=new T.Mesh(geo,riceMaterial());
  rice.name='紅白の餅花';
  rice.castShadow=true;
  rice.receiveShadow=true;
  bouquet.add(rice);
}
