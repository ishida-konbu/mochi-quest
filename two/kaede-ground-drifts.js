import { onKaedeWaterStep } from './kaede-water-steps.js';
import * as THREE from './vendor/three.module.min.js';
import { nearRoad, terrainContactHeight, waterSurfaceAt } from './terrain.js';
import { WORLD_BOUND, TERRAIN_TILES, TERRAIN_SUBDIVISIONS } from './geography.js';
import { MAPLE_BRIDGE } from './maple-crossing.js';
import { reservedScenery } from './retreat-layout.js';

const shapes = { maple: 'mapleWindrow', ginkgo: 'ginkgoWindrow' };
const geometryByKind = {};
let material;

// Each impression carries over a hundred leaves. The transparent space
// between blades lets the existing paper, moss and soil supply the background.
export function groundWindrows(painter) {
  if (!material) {
    const map = new THREE.TextureLoader().load(new URL('./assets/world/autumn-windrows.webp', import.meta.url).href);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    material = new THREE.MeshLambertMaterial({map, vertexColors:true, alphaTest: .26, polygonOffset: true,
      polygonOffsetFactor: -1, polygonOffsetUnits: -1});
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\ndiffuseColor.a *= 1.0-smoothstep(3364.0,6400.0,dot(vViewPosition,vViewPosition));');
    };
  }
  for (const [kind, name] of Object.entries(shapes)) {
    if (!geometryByKind[kind]) {
      const geometry = new THREE.PlaneGeometry().rotateX(-Math.PI/2);
      const uv = geometry.attributes.uv;
      for (let i=0; i<uv.count; i++) uv.setX(i,(uv.getX(i)+(kind==='ginkgo'?1:0))/2);
      geometry.setAttribute('color',new THREE.Uint8BufferAttribute(new Uint8Array(uv.count*4).fill(255),4,true));
      geometry.userData.range = 82;
      geometryByKind[kind] = geometry;
    }
    painter.shapes[name] = geometryByKind[kind];
  }

  const offset = new THREE.Vector3(), rotation = new THREE.Euler(0,0,0,'YXZ');
  const positions=[], texcoords=[], colors=[], indices=[];
  const step=2*WORLD_BOUND/(TERRAIN_TILES*TERRAIN_SUBDIVISIONS*5);
  const bridge=MAPLE_BRIDGE;
  const originY=terrainContactHeight(bridge.x,bridge.z);
  function clearBank(x,z,y) {
    return y>=waterSurfaceAt(x,z)+.12 && !onKaedeWaterStep(x,z,.04) && !reservedScenery(x,z) && !nearRoad(x,z,.35) &&
      (Math.abs(x-bridge.x)>=bridge.halfWidth+.2 || Math.abs(z-bridge.z)>=bridge.length/2+1.12);
  }
  // At the crossing the ground uses a half-metre survey. Use its actual
  // diagonal and heights so pigment follows the folds right up to the gorge.
  function printBank(kind,x,z,length,width,bearing) {
    const c=Math.cos(bearing),s=Math.sin(bearing);
    const rx=(Math.abs(c)*length+Math.abs(s)*width)/2, rz=(Math.abs(s)*length+Math.abs(c)*width)/2;
    const left=Math.floor((x-rx)/step), right=Math.ceil((x+rx)/step);
    const north=Math.floor((z-rz)/step), south=Math.ceil((z+rz)/step);
    const stride=right-left+1, vertices=[];
    for(let j=north;j<=south;j++)for(let i=left;i<=right;i++) {
      const px=i*step,pz=j*step,y=terrainContactHeight(px,pz);
      const u=.5+((px-x)*c+(pz-z)*s)/length, v=.5-((pz-z)*c-(px-x)*s)/width;
      vertices.push({px,pz,y,clear:clearBank(px,pz,y),u,v,index:-1,edge:false});
    }
    function vertex(point) {
      if(point.index<0) {
        point.index=positions.length/3;
        positions.push(point.px-bridge.x,point.y-originY+.006,point.pz-bridge.z);
        texcoords.push(((kind==='ginkgo'?1:0)+Math.min(1,Math.max(0,point.u)))/2,Math.min(1,Math.max(0,point.v)));
        colors.push(255,255,255,255);
      }
      return point.index;
    }
    function triangle(a,b,c) {
      if(!a.clear || !b.clear || !c.clear || Math.hypot(a.y-b.y,a.y-c.y)>step*1.02) {
        a.edge=b.edge=c.edge=true;
        return;
      }
      if(Math.max(a.u,b.u,c.u)<=0 || Math.min(a.u,b.u,c.u)>=1 ||
         Math.max(a.v,b.v,c.v)<=0 || Math.min(a.v,b.v,c.v)>=1) return;
      indices.push(vertex(a),vertex(b),vertex(c));
    }
    for(let j=north;j<south;j++)for(let i=left;i<right;i++) {
      const k=(j-north)*stride+i-left;
      triangle(vertices[k],vertices[k+stride],vertices[k+1]);
      triangle(vertices[k+stride+1],vertices[k+1],vertices[k+stride]);
    }
    // Thin out the outer half metre against a cliff or footpath, so that a
    // cut in the survey cannot leave a straight edge in the painted leaves.
    for(const point of vertices) if(point.edge && point.index>=0)colors[point.index*4+3]=12;
  }
  function stamp(kind,x,z,length,width,bearing) {
    if(Math.hypot(x-bridge.x,z-bridge.z)<32) {
      printBank(kind,x,z,length,width,bearing);
      return;
    }
    const ground = terrainContactHeight(x,z);
    if (!clearBank(x,z,ground)) return;
    const sx = (terrainContactHeight(x+.15,z)-terrainContactHeight(x-.15,z))/.30;
    const sz = (terrainContactHeight(x,z+.15)-terrainContactHeight(x,z-.15))/.30;
    if (sx*sx+sz*sz > .95) return;
    const yaw = -bearing, c = Math.cos(yaw), s = Math.sin(yaw);
    const pitch = -Math.atan(sx*s+sz*c);
    const roll = Math.asin((sx*c-sz*s)/Math.hypot(1,sx,sz));
    rotation.set(pitch,yaw,roll);

    // Test the footprint in its tilted plane. Fit a smaller pocket on a
    // narrow shoulder. Where the bank breaks sharply, keep only loose leaves.
    for (const scale of [1,.65]) {
      let high=0, low=0, fits=true;
      for (let u=-2; u<=2 && fits; u++) for (let v=-1; v<=1; v++) {
        offset.set(u*length*scale/4,0,v*width*scale/2).applyEuler(rotation);
        const px=x+offset.x, pz=z+offset.z, y=terrainContactHeight(px,pz);
        if (!clearBank(px,pz,y)) {
          fits=false;
          break;
        }
        const difference=y-ground-offset.y;
        high=Math.max(high,difference);
        low=Math.min(low,difference);
        if (high-low>.028) { fits=false; break; }
      }
      if (fits) {
        painter.part(shapes[kind],x,ground+high+.004,z,length*scale,1,width*scale,
          '#ffffff',yaw,pitch,roll,material,false,40);
        return;
      }
    }
  }
  function finish() {
    if(!indices.length)return;
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));
    geometry.setAttribute('color',new THREE.Uint8BufferAttribute(colors,4,true));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.userData.range=82;
    painter.shapes.bridgeBankLeaves=geometry;
    painter.part('bridgeBankLeaves',bridge.x,originY,bridge.z,1,1,1,'#ffffff',0,0,0,material,false,40);
  }
  return {stamp,finish};
}
