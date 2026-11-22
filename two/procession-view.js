// Each tile is an orthographic portrait of the actual articulated rig. The
// six haori dyes share one portrait and a smaller cloth-coverage plate.
import * as THREE from './vendor/three.module.min.js';
import { DYES, TRADES } from './procession.js';
import { SPECIES } from './bestiary.js';
import { seasonAt } from './terrain.js';
import { finishInSlices } from './preparation.js';

const roles=['porter','wander','sumo',...TRADES];
// Keep every atlas dimension under the 4096-pixel limit of smaller GPUs.
export const beastDrawings = [];
let poseCount = 0;
for (const type of Object.keys(SPECIES)) {
  // Cranes keep their articulated wings at every distance; only their journal portrait is baked.
  const poses = type === 'bird' ? 1 : type === 'dragon' || type === 'kirin' ? 8 : 4;
  for (let variant = 0; variant < (type === 'shishi' ? 2 : 1); variant++) {
    beastDrawings.push({type, variant, poses, start:poseCount * 8});
    poseCount += poses;
  }
}
const illustrations = new Map(beastDrawings.map(d => [d.type + d.variant, d]));
export function beastDrawing(type, variant=0) {
  return illustrations.get(type + (type === 'shishi' ? variant : 0));
}
export const VILLAGERS={columns:16,rows:13,width:144,height:160,frameX:2.88,frameY:3.24,center:1.37};
export const BEASTS={columns:24,rows:Math.ceil(poseCount/3),width:160,height:160};
// Three-quarter and broadside views need room for the full brush tail,
// wingtips and dragon whiskers, including a gutter at the coarsest mip.
const paddedFrames={bird:4,fox:3.3,tiger:3.8,dragon:8};
export const beastFrame=type=>paddedFrames[type]??SPECIES[type].frame;
export const clothGround='#999999';
const base=new THREE.Color(clothGround);
const dyes=DYES.map(hex=>new THREE.Color(hex).multiplyScalar(1/base.r));
const white=new THREE.Color(1,1,1);
const roleIndex=new Map(roles.map((name,i)=>[name,i]));
const tau=Math.PI*2;

// Sample the same gait cycle used by the live rig.
export function gaitFrequency(type) {
  return type==='bird' ? 4.35 : type==='dragon' ? 1.12 : type==='kirin' ? 2.18 : type==='tiger' ? 2.8 : 3.8;
}

const plates=new Map();
function plate(filename,color) {
  if (!plates.has(filename)) {
    let texture;
    const ready=new Promise((resolve,reject)=>{
      texture=new THREE.TextureLoader().load(new URL('./assets/residents/'+filename,import.meta.url).href,resolve,undefined,reject);
    });
    // Weight the RGB by coverage before generating mip levels, then unweight
    // it in the shader. Transparent WebP texels otherwise introduce a black
    // fringe in the middle of each fine ear, feather and brush stroke.
    texture.premultiplyAlpha=color;
    texture.colorSpace=THREE.NoColorSpace;
    if (!color) texture.format=THREE.RedFormat;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    plates.set(filename,{texture,ready});
  }
  return plates.get(filename);
}

export async function preparePlates(renderer) {
  const entries=[plate('procession.webp',true),plate('procession-dyes.webp',false),plate('beasts.webp',true)];
  await Promise.all(entries.map(entry=>entry.ready));
  function* upload() {
    for (const {texture} of entries) {renderer?.initTexture(texture);yield;}
  }
  await finishInSlices(upload());
}

export function distantProcession(parent,shadowMaterial,capacity,beasts=false) {
  const sheet=beasts ? BEASTS : VILLAGERS;
  const geometry=new THREE.PlaneGeometry(1,1);
  const cells=new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('tileCell',cells);
  const motion = beasts ? new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage) : null;
  if (motion) geometry.setAttribute('nextPose',motion);
  const atlas=plate(beasts?'beasts.webp':'procession.webp',true).texture;
  const cloth=beasts ? null : plate('procession-dyes.webp',false).texture;
  const material=new THREE.MeshBasicMaterial({map:atlas,transparent:true,alphaTest:.035});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec3 tileCell; varying float presence;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        presence=tileCell.z; vMapUv=(tileCell.xy+vMapUv)/vec2(${sheet.columns}.0,${sheet.rows}.0);`);
    if (beasts) {
      shader.vertexShader = 'attribute vec3 nextPose; varying vec3 poseBlend;\n' + shader.vertexShader.replace(
        '#include <uv_vertex>', `#include <uv_vertex>
        poseBlend = vec3(nextPose.xy/vec2(${sheet.columns}.0,${sheet.rows}.0), nextPose.z);`);
      shader.fragmentShader = 'varying vec3 poseBlend;\n' + shader.fragmentShader;
    }
    // The full next cell starts beyond the transparent gutter. Limit the
    // coarsest sample footprint before it can touch another animal's ink.
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float presence;');
    const cellFilter=`
      vec2 dx=dFdx(vMapUv), dy=dFdy(vMapUv);
      vec2 plateSize=vec2(textureSize(map,0));
      float footprint=max(length(dx*plateSize),length(dy*plateSize));
      float gutter=min(1.0,16.0/max(footprint,1.0));
      vec4 texel=textureGrad(map,vMapUv,dx*gutter,dy*gutter);
      ${beasts ? 'texel=mix(texel,textureGrad(map,vMapUv+poseBlend.xy,dx*gutter,dy*gutter),poseBlend.z);' : ''}
      texel.rgb=sRGBTransferEOTF(vec4(texel.rgb/max(texel.a,.001),1.)).rgb;
      diffuseColor*=texel;diffuseColor.a*=presence;`;
    if (cloth) {
      shader.uniforms.clothPlate={value:cloth};
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D clothPlate;')
        .replace('#include <map_fragment>',cellFilter)
        .replace('#include <color_fragment>', 'diffuseColor.rgb*=mix(vec3(1.),vColor,textureGrad(clothPlate,vMapUv,dx*gutter,dy*gutter).r);');
    } else {
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',cellFilter);
    }
  };
  material.customProgramCacheKey=()=>beasts?'beast-plate':'haori-plate';
  const figures=new THREE.InstancedMesh(geometry,material,capacity);
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),shadowMaterial,capacity);
  if (cloth) {
    figures.setColorAt(0,white);
    figures.instanceColor.setUsage(THREE.DynamicDrawUsage);
  }
  figures.name=beasts?'鳥獣の絵巻・遠景':'街道の旅人・遠景';
  shadows.renderOrder=1;
  for(const batch of [figures,shadows]) {
    batch.frustumCulled=false;
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.count=0;
    parent.add(batch);
  }
  const transform=new THREE.Object3D(), shadow=new THREE.Object3D(), climate={};
  const headings=new WeakMap();
  transform.rotation.order='YXZ';
  shadow.rotation.x=-Math.PI/2;
  let count=0;
  function begin(player) {
    count=0;
    const {moon,dawn,snow,autumn}=seasonAt(player.x,player.z,climate);
    material.color.setRGB(1-.59*moon-.05*snow,1-.46*moon-.1*dawn-.035*autumn,1-.28*moon-.23*dawn-.075*autumn);
  }
  function add(n,x,z,camera,time,fade) {
    const vx=camera.position.x-x, vz=camera.position.z-z;
    const facing=Math.atan2(vx,vz);
    const turn=(facing-(n.heading||0))*8/tau;
    const last=headings.get(n);
    // A small dead band straddles each sector boundary. Small back-and-forth
    // head motions no longer flash between two drawings.
    const drift=last===undefined ? Infinity : THREE.MathUtils.euclideanModulo(turn-last+4,8)-4;
    const direction=Math.abs(drift)>.58 ? THREE.MathUtils.euclideanModulo(Math.round(turn),8) : last;
    headings.set(n,direction);
    const spec=SPECIES[n.type];
    let tile;
    if (beasts) {
      const drawing = beastDrawing(n.type, n.variant);
      const phase = THREE.MathUtils.euclideanModulo((time+(n.phase||0))*gaitFrequency(n.type)/tau,1)*drawing.poses;
      const pose = Math.floor(phase);
      tile = drawing.start + pose*8 + direction;
      const next = drawing.start + (pose+1)%drawing.poses*8 + direction;
      motion.setXYZ(count, next%sheet.columns - tile%sheet.columns,
        Math.floor(tile/sheet.columns)-Math.floor(next/sheet.columns), phase-pose);
    } else {
      tile = (roleIndex.get(n.role)+(n.type==='rabbit'?0:roles.length))*8 + direction;
    }
    cells.setXYZ(count,tile%sheet.columns,sheet.rows-1-Math.floor(tile/sheet.columns),fade);
    if (cloth) figures.setColorAt(count,n.area ? dyes[n.dye] : white);
    const scale=n.stature||1, build=n.build||1;
    const center=n.y+(spec?.center??VILLAGERS.center)*scale;
    transform.position.set(x,center,z);
    transform.rotation.set(-Math.atan2(camera.position.y-center,Math.hypot(vx,vz)),facing,0,'YXZ');
    const span=spec ? beastFrame(n.type) : 0;
    transform.scale.set((span||VILLAGERS.frameX)*scale*build,(span||VILLAGERS.frameY)*scale,1);
    transform.updateMatrix();figures.setMatrixAt(count,transform.matrix);
    shadow.position.set(x,n.y-(n.altitude||0)+.025,z);
    const contact=Math.max(0,1-(n.altitude||0)/12);
    shadow.scale.set(1.12*scale*build*contact,.85*scale*contact,1);
    shadow.updateMatrix();shadows.setMatrixAt(count,shadow.matrix);
    count++;
  }
  function end() {
    figures.count=shadows.count=count;
    if (!count) return;
    for(const attribute of [cells,motion,figures.instanceMatrix,shadows.instanceMatrix,figures.instanceColor]) {
      if (!attribute) continue;
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*attribute.itemSize);
      attribute.needsUpdate=true;
    }
  }
  return {begin,add,end};
}
