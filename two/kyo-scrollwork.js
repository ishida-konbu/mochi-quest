import * as THREE from './vendor/three.module.min.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';

// Four original paintings share one sheet: tea, dumplings, an ox team and a ferry crew.
const panels=new Map();
let silk, pigment;
export function scrollPaper() {
  if (!silk) {
    const map=new THREE.TextureLoader().load(new URL('./assets/world/kyo-scrollwork.webp',import.meta.url).href);
    map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    silk=new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide,emissiveMap:map,
      emissive:'#f2dfba',emissiveIntensity:.095});
  }
  return silk;
}
export function scrollPigment() {
  return pigment??=surfaceGrain(brushWash(new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:.93,side:THREE.DoubleSide,
  }),.32),6);
}

// All coordinates are in a one-metre local frame. Each work has actual folds,
// with aligned ink across a paper hinge or a gap in the hanging dyed cloth.
export function printSurface(picture, form='screen'){
  const key=picture+'-'+form;
  if(panels.has(key))return panels.get(key);
  const xyz=[],uv=[],indices=[];
  const curtains=form==='curtain',screen=form==='screen',sail=form==='sail';
  const cols=screen?4:curtains?3:1,nu=screen?1:8,nv=screen?1:9;
  for(let panel=0;panel<cols;panel++){
    const off=xyz.length/3;
    for(let j=0;j<=nv;j++)for(let k=0;k<=nu;k++){
      const a=(panel+k/nu)/cols, v=j/nv;
      const gap=curtains?(k===0&&panel>0?.009:k===nu&&panel+1<cols?-.009:0)*(1-v**3):0;
      let x=a-.5+gap,y=v-.5,z=0;
      if(screen) z=.17*(1-Math.abs(2*((a*2)%1)-1));
      else if(curtains){
        z=.14*Math.cos(a*Math.PI*10+.35)*(1.18-.77*v)+.05*Math.sin(v*Math.PI);
        y+=.016*Math.sin(a*17)*((1-v)**4);
      } else if(sail){
        x*=.91+.12*(1-v);
        z=.24*Math.sin(Math.PI*v)*(.75+.25*Math.sin(Math.PI*a))+.029*Math.cos(a*Math.PI*8)*(1-v);
        y+=.036*(Math.cos(a*Math.PI*2)-1)*(1-v);
      }
      xyz.push(x,y,z);
      // Inset each quadrant by one texel to avoid bleeding between pictures at the seam.
      uv.push((picture%2+.002+a*.996)*.5,(picture<2?.5:0)+(.002+v*.996)*.5);
      if(j<nv&&k<nu){
        const n=off+j*(nu+1)+k;
        indices.push(n,n+1,n+nu+1,n+1,n+nu+2,n+nu+1);
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  panels.set(key,g);return g;
}
export function illustratedMesh(parent,picture,form) {
  const mesh=new THREE.Mesh(printSurface(picture,form),scrollPaper());
  mesh.receiveShadow=mesh.castShadow=true;parent.add(mesh);return mesh;
}
