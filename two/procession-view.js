// Far travellers use eight views baked from the same inked rigs, including
// each tool and haori dye. One cutout pass and one contact-shadow pass draw
// the whole procession. Their facing, height and lighting track the 3D actors.
import * as THREE from './vendor/three.module.min.js';
import { DYES, TRADES } from './procession.js';
import { seasonAt, wrapDelta } from './terrain.js';
const oldRoles=['porter','wander','sumo'];
const forms=oldRoles.length+TRADES.length*DYES.length;
const tileCols=32, tileRows=32, tileWidth=64, tileHeight=72;
const skyAt={};
export function distantProcession(parent,shadowMaterial,capacity) {
  const geometry=new THREE.PlaneGeometry(1,1);
  const offsets=new THREE.InstancedBufferAttribute(new Float32Array(capacity*2),2);
  offsets.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('tileOffset',offsets);
  const atlas=new THREE.TextureLoader().load(new URL('./assets/residents/procession.webp',import.meta.url).href);
  atlas.colorSpace=THREE.SRGBColorSpace;
  // Avoid sampling the feet of adjacent postures when the procession is tiny.
  atlas.generateMipmaps=false;
  atlas.minFilter=THREE.LinearFilter;
  const material=new THREE.MeshBasicMaterial({map:atlas,alphaTest:.38});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec2 tileOffset;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        vMapUv=tileOffset+(vec2(${.5/tileWidth},${.5/tileHeight})+
          vMapUv*vec2(${1-1/tileWidth},${1-1/tileHeight}))/vec2(${tileCols}.0,${tileRows}.0);`);
  };
  const figures=new THREE.InstancedMesh(geometry,material,capacity);
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),shadowMaterial,capacity);
  figures.name='街道の旅人・遠景';
  shadows.renderOrder=1;
  for(const batch of [figures,shadows]) {
    batch.frustumCulled=false;
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.count=0;
    parent.add(batch);
  }
  const transform=new THREE.Object3D(), shadow=new THREE.Object3D();
  shadow.rotation.x=-Math.PI/2;
  let count=0;
  function begin(player) {
    count=0;
    const {moon,dawn,snow,autumn}=seasonAt(player.x,player.z,skyAt);
    material.color.setRGB(1-.59*moon-.05*snow,1-.46*moon-.1*dawn-.035*autumn,1-.28*moon-.23*dawn-.075*autumn);
  }
  function add(n,p,camera,time) {
    const x=p.x+wrapDelta(n.x-p.x), z=p.z+wrapDelta(n.z-p.z);
    const facing=Math.atan2(camera.position.x-x,camera.position.z-z);
    const direction=(Math.round((facing-n.heading)*4/Math.PI)%8+8)%8;
    const variant=(n.area ? oldRoles.length+TRADES.indexOf(n.role)*DYES.length+n.dye : oldRoles.indexOf(n.role))+
      (n.type==='rabbit'?0:forms);
    const tile=variant*8+direction;
    offsets.setXY(count,tile%tileCols/tileCols,1-(Math.floor(tile/tileCols)+1)/tileRows);
    const scale=n.stature||1, build=n.build||1;
    const pace=Math.sin(time*(n.role==='sumo'?2.65:3.12)+n.phase);
    transform.position.set(x,n.y+1.37*scale+.023*Math.abs(pace)*Math.min(1,n.speed+.09),z);
    transform.rotation.set(0,facing,.017*pace);
    transform.scale.set(2.88*scale*build,3.24*scale,1);
    transform.updateMatrix();figures.setMatrixAt(count,transform.matrix);
    shadow.position.set(x,n.y+.025,z);
    shadow.scale.set(1.12*scale*build,.85*scale,1);
    shadow.updateMatrix();shadows.setMatrixAt(count,shadow.matrix);
    count++;
  }
  function end() {
    figures.count=shadows.count=count;
    if(count) {
      offsets.needsUpdate=figures.instanceMatrix.needsUpdate=shadows.instanceMatrix.needsUpdate=true;
    }
  }
  return { begin,add,end };
}
