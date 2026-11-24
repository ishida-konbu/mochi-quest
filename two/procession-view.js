// Each tile is an orthographic portrait of the actual articulated rig. The
// six haori dyes share one portrait and a smaller cloth-coverage plate.
import * as THREE from './vendor/three.module.min.js';
import { lightAtMinute } from './world-clock.js';
import { DYES, TRADES } from './procession.js';
import { SCROLL_FAUNA, FAUNA_SHEET, faunaDrawing, faunaFrequency } from './scroll-fauna.js';
import { SPECIES } from './bestiary.js';
import { dragonPitch } from './animal-motion.js';
import { dragonSkyHaze } from './dragon-flight.js';
import { seasonAt } from './terrain.js';
import { demandPaint } from './travel-paint.js';

import { WORKSHOP_TOOLS, workRate } from './trade-tools.js';

export const residentRoles=['porter','wander','sumo',...TRADES,...WORKSHOP_TOOLS];
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
export const VILLAGERS={poses:6,columns:42,rows:39,width:96,height:104,frameX:2.88,frameY:3.24,center:1.37};
export const residentFrameX=craft=>craft==='fisher'?3.48:VILLAGERS.frameX;
export const BEASTS={atlas:'beasts.webp?v=dragon-60m-1',columns:24,rows:Math.ceil(poseCount/3),width:160,height:160};
// Three-quarter and broadside views need room for the full brush tail,
// wingtips and dragon whiskers, including a gutter at the coarsest mip.
const paddedFrames={bird:4,fox:3.3,tiger:3.8};
export const beastFrame=type=>paddedFrames[type]??SPECIES[type].frame;
export const clothGround='#999999';
const base=new THREE.Color(clothGround);
const dyes=DYES.map(hex=>new THREE.Color(hex).multiplyScalar(1/base.r));
const white=new THREE.Color(1,1,1);
const roleIndex=new Map(residentRoles.map((name,i)=>[name,i]));
const tau=Math.PI*2;

// Sample the same gait cycle used by the live rig.
export function gaitFrequency(type) {
  return type==='bird' ? 4.35 : type==='dragon' ? 1.12 : type==='kirin' ? 2.18 : type==='tiger' ? 2.8 : 3.8;
}

const plates=new Map();
function plate(filename,color) {
  if (!plates.has(filename)) {
    const texture=new THREE.Texture();
    const url=new URL('./assets/residents/'+filename,import.meta.url).href;
    const request=demandPaint(()=>new THREE.ImageLoader().loadAsync(url).then(image=>{
      texture.image=image;
      texture.needsUpdate=true;
      return texture;
    }));
    // Weight the RGB by coverage before generating mip levels, then unweight
    // it in the shader. Transparent WebP texels otherwise introduce a black
    // fringe in the middle of each fine ear, feather and brush stroke.
    texture.premultiplyAlpha=color;
    texture.colorSpace=THREE.NoColorSpace;
    if (!color) texture.format=THREE.RedFormat;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    plates.set(filename,{texture,request});
  }
  const entry=plates.get(filename);
  entry.request();
  return entry.texture;
}

export const COSTUME_SHEET={columns:8,rows:10,width:128,height:128};
export const costumeFrame=role=>role<5 ? 2.28:role===8 ? 4.45:3.18;
export const costumeCentre=role=>role<5 ? .94:1.39;

export function preparePlates() {
  return Promise.all(Array.from(plates.values(), entry => entry.request()));
}

export function distantProcession(parent,shadowMaterial,capacity,beasts=false) {
  const scroll=beasts==='scroll',costumes=beasts==='costumes';
  const sheet=costumes?COSTUME_SHEET:scroll ? FAUNA_SHEET : beasts ? BEASTS : VILLAGERS;
  const geometry=new THREE.PlaneGeometry(1,1);
  const cells=new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('tileCell',cells);
  const motion=new THREE.InstancedBufferAttribute(new Float32Array(capacity*3),3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('nextPose',motion);
  const filename=costumes?'emaki-costumes.webp':scroll?FAUNA_SHEET.atlas:beasts?BEASTS.atlas:'procession.webp';
  const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.035});
  let cloth;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec3 tileCell; varying float presence;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        presence=abs(tileCell.z); if(tileCell.z<0.) vMapUv.x=1.-vMapUv.x; vMapUv=(tileCell.xy+vMapUv)/vec2(${sheet.columns}.0,${sheet.rows}.0);`);
    shader.vertexShader = 'attribute vec3 nextPose; varying vec3 poseBlend;\n' + shader.vertexShader.replace(
        '#include <uv_vertex>', `#include <uv_vertex>
        poseBlend = vec3(nextPose.xy/vec2(${sheet.columns}.0,${sheet.rows}.0), nextPose.z);`);
    if(beasts===true) {
      const dragon=beastDrawing('dragon');
      const tile=`(tileCell.x + (${sheet.rows-1}. - tileCell.y) * ${sheet.columns}.)`;
      dragonSkyHaze(shader,`${tile} >= ${dragon.start}. && ${tile} < ${dragon.start+8*dragon.poses}.`);
    }
    shader.fragmentShader = 'varying vec3 poseBlend;\n' + shader.fragmentShader;
    // The full next cell starts beyond the transparent gutter. Limit the
    // coarsest sample footprint before it can touch another animal's ink.
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float presence;');
    const cellFilter=`
      vec2 dx=dFdx(vMapUv), dy=dFdy(vMapUv);
      vec2 plateSize=vec2(textureSize(map,0));
      float footprint=max(length(dx*plateSize),length(dy*plateSize));
      float gutter=min(1.0,16.0/max(footprint,1.0));
      vec4 texel=textureGrad(map,vMapUv,dx*gutter,dy*gutter);
      texel=mix(texel,textureGrad(map,vMapUv+poseBlend.xy,dx*gutter,dy*gutter),poseBlend.z);
      texel.rgb=sRGBTransferEOTF(vec4(texel.rgb/max(texel.a,.001),1.)).rgb;
      diffuseColor*=texel;diffuseColor.a*=presence;`;
    if (cloth) {
      shader.uniforms.clothPlate={value:cloth};
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D clothPlate;')
        .replace('#include <map_fragment>',cellFilter)
        .replace('#include <color_fragment>', `
          float fabric=mix(textureGrad(clothPlate,vMapUv,dx*gutter,dy*gutter).r,
            textureGrad(clothPlate,vMapUv+poseBlend.xy,dx*gutter,dy*gutter).r,poseBlend.z);
          diffuseColor.rgb*=mix(vec3(1.),vColor,fabric);`);
    } else {
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',cellFilter);
    }
  };
  material.customProgramCacheKey=()=>costumes?'costume-plate':scroll?'fauna-plate':beasts?'beast-plate':'haori-plate';
  const figures=new THREE.InstancedMesh(geometry,material,capacity);
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),shadowMaterial,capacity);
  if (!beasts) {
    figures.setColorAt(0,white);
    figures.instanceColor.setUsage(THREE.DynamicDrawUsage);
  }
  figures.name=costumes?'旅装の遠景':beasts?'鳥獣の絵巻・遠景':'街道の旅人・遠景';
  shadows.visible=!!shadowMaterial;shadows.renderOrder=1;
  for(const batch of [figures,shadows]) {
    batch.frustumCulled=false;
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.count=0;
    batch.visible=false;
    parent.add(batch);
  }
  const transform=new THREE.Object3D(), shadow=new THREE.Object3D(), climate={};
  const headings=new WeakMap();
  transform.rotation.order='YXZ';
  shadow.rotation.x=-Math.PI/2;
  let count=0,shadowCount=0;
  function begin(player) {
    count=0;shadowCount=0;
    const {moon,dawn,snow,autumn}=lightAtMinute(seasonAt(player.x,player.z,climate),player.worldMinute);
    material.color.setRGB(1-.59*moon-.05*snow,1-.46*moon-.1*dawn-.035*autumn,1-.28*moon-.23*dawn-.075*autumn);
  }
  function warm() {
    if(material.map?.image && (beasts || cloth?.image))return;
    const first=!material.map;
    material.map=plate(filename,true);
    if (!beasts) cloth=plate('procession-dyes.webp',false);
    if (first) material.needsUpdate=true;
  }
  function add(n,x,z,camera,time,fade) {
    if(count===0)warm();
    const spec=SPECIES[n.type] || SCROLL_FAUNA[n.type], scale=n.stature||1;
    let center=n.y+(costumes?costumeCentre(n.costume):spec?.center??VILLAGERS.center)*scale;
    if(spec?.centerZ) {
      // The new tail puts the centre of the ink plate well behind the feet.
      // Pitch this offset around the same trunk origin as the live model.
      const pitch=dragonPitch(n), forward=(spec.centerZ*Math.cos(pitch)+spec.center*Math.sin(pitch))*scale;
      x+=Math.sin(n.heading)*forward;z+=Math.cos(n.heading)*forward;
      center=n.y+(spec.center*Math.cos(pitch)-spec.centerZ*Math.sin(pitch))*scale;
    }
    const vx=camera.position.x-x, vz=camera.position.z-z;
    const facing=Math.atan2(vx,vz);
    const handedness=n.room===undefined ? 1 : -1;
    const turn=(facing-(n.heading||0))*8/tau*handedness;
    const last=headings.get(n);
    // A small dead band straddles each sector boundary. Small back-and-forth
    // head motions no longer flash between two drawings.
    const drift=last===undefined ? Infinity : THREE.MathUtils.euclideanModulo(turn-last+4,8)-4;
    const direction=Math.abs(drift)>.58 ? THREE.MathUtils.euclideanModulo(Math.round(turn),8) : last;
    headings.set(n,direction);
    let start,poses,cycle;
    if(costumes){
      start=n.costume*8;poses=1;cycle=0;
    }else if (beasts) {
      const drawing=scroll?faunaDrawing(n):beastDrawing(n.type,n.variant);
      start=drawing.start;poses=drawing.poses;
      cycle=scroll?(time*faunaFrequency(n.type)+n.phase)/tau:(time+(n.phase||0))*gaitFrequency(n.type)/tau;
    } else {
      const craft=n.craft || n.role;
      const index=roleIndex.get(craft)+(n.type==='rabbit'?0:residentRoles.length);
      poses=sheet.poses;start=index*poses*8;
      cycle=(time*workRate(craft)+(n.phase||0))/tau;
    }
    const phase=THREE.MathUtils.euclideanModulo(cycle,1)*poses, pose=Math.floor(phase);
    const tile=start+pose*8+direction, next=start+(pose+1)%poses*8+direction;
    // Hold the ink drawing through the centre of a worker's gesture.
    // A short dissolve as the brush changes direction avoids double outlines.
    const mix=beasts ? phase-pose : THREE.MathUtils.smoothstep(phase-pose,.30,.70);
    motion.setXYZ(count,next%sheet.columns-tile%sheet.columns,
      Math.floor(tile/sheet.columns)-Math.floor(next/sheet.columns),mix);
    cells.setXYZ(count,tile%sheet.columns,sheet.rows-1-Math.floor(tile/sheet.columns),fade*handedness);
    if (cloth) figures.setColorAt(count,n.area ? dyes[n.dye] : white);
    const build=n.build||1;
    transform.position.set(x,center,z);
    transform.rotation.set(-Math.atan2(camera.position.y-center,Math.hypot(vx,vz)),facing,0,'YXZ');
    if(n.type==='dragon')transform.rotation.z=-dragonPitch(n)*Math.sin(n.heading-facing);
    const span=costumes?costumeFrame(n.costume):scroll ? spec.frame : spec ? beastFrame(n.type) : 0;
    transform.scale.set((span||residentFrameX(n.craft || n.role))*scale*build,(span||VILLAGERS.frameY)*scale,1);
    transform.updateMatrix();figures.setMatrixAt(count,transform.matrix);
    const contact=Math.max(0,1-(n.altitude||0)/12);
    if(shadowMaterial && n.type!=='fishfolk' && contact>0){
      shadow.position.set(x,n.y-(n.altitude||0)+.025,z);
      shadow.scale.set(1.12*scale*build*contact,.85*scale*contact,1);
      shadow.updateMatrix();shadows.setMatrixAt(shadowCount++,shadow.matrix);
    }
    count++;
  }
  function end() {
    figures.count=count;shadows.count=shadowCount;
    figures.visible=count>0;shadows.visible=shadowCount>0;
    if(shadowCount){
      shadows.instanceMatrix.clearUpdateRanges();
      shadows.instanceMatrix.addUpdateRange(0,shadowCount*16);
      shadows.instanceMatrix.needsUpdate=true;
    }
    if (!count) return;
    for(const attribute of [cells,motion,figures.instanceMatrix,figures.instanceColor]) {
      if (!attribute) continue;
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*attribute.itemSize);
      attribute.needsUpdate=true;
    }
  }
  return {begin,add,end,warm};
}
