import * as THREE from './vendor/three.module.min.js';
import { terrainHeight, terrainMeshHeight } from './terrain.js';

// The distant foliage is a painting, but each stalk still has its own foot,
// taper and lean. Sorting a clump into a single trunk billboard loses all
// the narrow windows through which the slope shows between the culms.
const supportRings=[0,2,3,4,6];

export function markCulms(shape) {
  const marks=new Int8Array(shape.attributes.position.count);
  for(const [slot,{firstVertex,endVertex}] of shape.userData.culms.entries()){
    // Positive marks identify the five-sided foot ring, including its UV seam.
    marks.fill(-slot-1,firstVertex,endVertex);
    marks.fill(slot+1,firstVertex,firstVertex+6);
  }
  shape.setAttribute('bambooCulm',new THREE.Int8BufferAttribute(marks,1));
}

// Shift only the bottom ring. Branches, nodes and the upper stem stay at
// their surveyed height. Evaluate all five corners on the actual triangles:
// on a cross slope the uphill foot and downhill foot can be a metre apart.
export function bambooFootDrops(record,shape,sample,values,offset=0) {
  const {tree,ground,rotation}=record, cs=Math.cos(rotation),sn=Math.sin(rotation);
  const vertices=shape.attributes.position;
  for(const [slot,{firstVertex}] of shape.userData.culms.entries()){
    let drop=0;
    for(let k=0;k<5;k++){
      const at=firstVertex+k,u=vertices.getX(at),v=vertices.getZ(at);
      const soil=sample(tree.x+tree.h*(cs*u+sn*v),tree.z+tree.h*(-sn*u+cs*v));
      // The distant hill surface may simplify four centimetres of relief.
      drop=Math.min(drop,(soil-.105-ground)/tree.h-vertices.getY(at));
    }
    values[offset+slot]=drop;
  }
}
export const bambooFootGLSL=`
  uniform sampler2D bambooFootLevels;
  float footDrop(float row,float stem){
    int slot=int(stem)-1;
    vec4 levels=texelFetch(bambooFootLevels,ivec2(slot/4,int(row)),0);
    return levels[slot%4];
  }
`;
export function distantCulms(culms) {
  const p=[],edge=[],indices=[];
  for(const [slot,{points,radii}] of culms.entries()){
    const start=p.length/3;
    for(const [j,ring] of supportRings.entries()){
      const q=points[ring];
      for(const sign of [-1,1]){
        p.push(q.x,q.y,q.z);
        const along=(q.y-points[0].y)/(points.at(-1).y-points[0].y);
        edge.push(sign*radii[ring],ring===0?slot+1:0,along);
      }
      if(j){
        const left=start+2*j;
        indices.push(left-2,left-1,left,left,left-1,left+1);
      }
    }
  }
  const geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geo.setAttribute('culmEdge',new THREE.Float32BufferAttribute(edge,3));
  geo.setIndex(indices);
  return geo;
}
export function prepareBambooCulms(scene,stands,near,footLevels){
  const byForm=new Map(),lattice=new Map();
  for(const {tree} of stands)byForm.set(tree.form,(byForm.get(tree.form)??0)+1);
  const columns=Math.max(1,...[...byForm.keys()].map(form=>Math.ceil(near[form].geometry.userData.culms.length/4)));
  const rows=Math.max(1,stands.length),data=new Float32Array(columns*4*rows);
  function sampleLattice(x,z){
    let column=lattice.get(x);
    if(!column)lattice.set(x,column=new Map());
    if(!column.has(z))column.set(z,terrainHeight(x,z));
    return column.get(z);
  }
  const soil=(x,z)=>terrainMeshHeight(x,z,sampleLattice);
  for(const [row,stand] of stands.entries()){
    bambooFootDrops(stand,near[stand.tree.form].geometry,soil,data,row*columns*4);
  }
  const texture=new THREE.DataTexture(data,columns,rows,THREE.RGBAFormat,THREE.FloatType);
  texture.needsUpdate=true;footLevels.value=texture;
  const material=new THREE.MeshLambertMaterial({color:0x636f4d});
  material.onBeforeCompile=shader=>{
    shader.uniforms.bambooFootLevels=footLevels;
    shader.vertexShader=bambooFootGLSL+
      'varying vec2 culmInk; attribute vec3 culmEdge; attribute vec4 standRoot; attribute vec3 standDirection;\n'+shader.vertexShader
      .replace('#include <beginnormal_vertex>','vec3 objectNormal=vec3(0.,1.,0.);')
      .replace('#include <begin_vertex>',`
        vec3 p=position;
        culmInk=vec2(sign(culmEdge.x),culmEdge.z);
        if(culmEdge.y>.5)p.y+=footDrop(standDirection.z,culmEdge.y);
        vec2 dir=standDirection.xy;
        vec2 rotated=vec2(dot(dir,p.xz),dot(vec2(-dir.y,dir.x),p.xz));
        vec3 transformed=standRoot.xyz+vec3(rotated.x,p.y,rotated.y)*standRoot.w;
        vec2 ray=normalize(cameraPosition.xz-transformed.xz+vec2(.00001));
        transformed.xz+=vec2(ray.y,-ray.x)*culmEdge.x*standRoot.w;
      `);
    // Keep the seven node rings visible in the middle distance. Filter them
    // away as the internodes shrink to pixels, without widening any stem.
    shader.fragmentShader='varying vec2 culmInk;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float t=culmInk.y/.121, width=max(.001,fwidth(t));
        float line=1.-smoothstep(.012,.028+width*.65,abs(fract(t+.5)-.5));
        float nodes=line*(1.-smoothstep(.16,.42,width))*step(.5,t)*(1.-step(7.5,t));
        diffuseColor.rgb*=(1.06-.17*culmInk.x*culmInk.x)*(1.-.26*nodes);
      `);
  };
  const batches=new Map();
  for(const [form,count] of byForm){
    const geo=distantCulms(near[form].geometry.userData.culms);
    const roots=new THREE.InstancedBufferAttribute(new Float32Array(count*4),4).setUsage(THREE.DynamicDrawUsage);
    const directions=new THREE.InstancedBufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('standRoot',roots);geo.setAttribute('standDirection',directions);
    geo.instanceCount=0;
    const mesh=new THREE.Mesh(geo,material);
    mesh.name='Distant bamboo culms • '+form;mesh.frustumCulled=false;mesh.visible=false;
    scene.add(mesh);
    batches.set(form,{mesh,roots,directions});
  }
  return {
    reset(){for(const {mesh} of batches.values())mesh.geometry.instanceCount=0;},
    add(record,x,z){
      const {mesh,roots,directions}=batches.get(record.tree.form),i=mesh.geometry.instanceCount++;
      roots.setXYZW(i,x,record.ground,z,record.tree.h);
      directions.setXYZ(i,record.cos,record.sin,record.bambooRow);
    },
    flush(){
      for(const {mesh,roots,directions} of batches.values()){
        const used=mesh.geometry.instanceCount;
        mesh.visible=used>0;
        if(used)for(const attr of [roots,directions]){
          attr.clearUpdateRanges();attr.addUpdateRange(0,used*attr.itemSize);attr.needsUpdate=true;
        }
      }
    }
  };
}
