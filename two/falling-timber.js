// Detach the painted crown and bole from the same geometry used by the island.
// The cut plane belongs to the hinge, so it stays attached as the crown turns.
import * as T from './vendor/three.module.min.js';
import { timberCut } from './homestead-timber-section.js';
import { terrainContactHeight, staticVolumeAt, timberWood } from './terrain.js';
import { GATE_PEACH } from './pilgrimage-layout.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';

const tau=2*Math.PI;
const tints=['#ffffff','#fff3f3','#ffe5eb','#fff3e0','#f7d5e4','#fff8f2'];
// Copy only the chosen bark triangles from a grove-wide brush batch. Whole
// models and foliage sprays can keep their original geometry and GPU atlas.
function woodSection(g,ranges){
  const used=new Map(),order=[],ix=[];
  for(const [lo,hi] of ranges)for(let j=lo;j<hi;j++){
    const old=g.index?g.index.getX(j):j;
    if(!used.has(old)){used.set(old,order.length);order.push(old);}
    ix.push(used.get(old));
  }
  const cut=new T.BufferGeometry();
  for(const [key,a] of Object.entries(g.attributes)){
    if(a.isInstancedBufferAttribute)continue;
    const array=new a.array.constructor(order.length*a.itemSize);
    for(let k=0;k<order.length;k++)for(let c=0;c<a.itemSize;c++)array[k*a.itemSize+c]=a.array[order[k]*a.itemSize+c];
    cut.setAttribute(key,new T.BufferAttribute(array,a.itemSize,a.normalized));
  }
  cut.setIndex(ix);return cut;
}
function cutShader(material,original,plane,fade){
  material.onBeforeCompile=(shader,renderer)=>{
    original.onBeforeCompile(shader,renderer);
    shader.uniforms.timberPresence=fade;shader.uniforms.timberPlane={value:plane};
    shader.vertexShader='uniform vec4 timberPlane; varying float timberSection;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      vec4 timberVertex=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        timberVertex=instanceMatrix*timberVertex;
      #endif
      timberSection=dot(timberPlane,timberVertex);
      #include <project_vertex>`);
    shader.fragmentShader='varying float timberSection; uniform float timberPresence;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      if(timberSection<-.001 || fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))))>=timberPresence)discard;`);
  };
  material.customProgramCacheKey=()=>original.customProgramCacheKey()+'/timber-cut';
}
function copyWood(scene,tree,group,hinge,fade,disposable,stalks){
  const source=tree.source,base=new T.Object3D(),matrix=new T.Matrix4(),tint=new T.Color();
  const shift=new T.Matrix4().makeTranslation(-hinge.x,-hinge.y,-hinge.z);
  scene.updateMatrixWorld(true);
  function add(node,geometry,count=0,parent=group){
    const sourceMat=node.material,m=sourceMat.clone(),basis=node.matrixWorld.elements;
    const plane=new T.Vector4(basis[1],basis[5],basis[9],basis[13]-hinge.y);
    m.defaultAttributeValues=sourceMat.defaultAttributeValues;
    cutShader(m,sourceMat,plane,fade);
    const part=count?new T.InstancedMesh(geometry,m,count):new T.Mesh(geometry,m);
    const rawDepth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:m.map,alphaTest:m.alphaTest,side:m.side});
    const depth=rawDepth.clone();cutShader(depth,rawDepth,plane,fade);part.customDepthMaterial=depth;
    part.matrix.multiplyMatrices(shift,node.matrixWorld);part.matrixAutoUpdate=false;
    part.castShadow=part.receiveShadow=true;part.frustumCulled=false;
    parent.add(part);disposable.push(m,depth,rawDepth);if(count)disposable.push(part);
    return part;
  }
  function stamps(node,ranges){
    const batches=new Map();
    for(const [lo,hi] of ranges)for(let i=lo/16;i<hi/16;i++){
      const parent=stalks.get(node.userData.culmSlots?.get(i))?.group??group;
      if(!batches.has(parent))batches.set(parent,[]);
      batches.get(parent).push(i);
    }
    for(const [parent,indices] of batches){
      const part=add(node,node.geometry,indices.length,parent);
      for(const [j,i] of indices.entries()){
        node.getMatrixAt(i,matrix);part.setMatrixAt(j,matrix);
        if(node.instanceColor){node.getColorAt(i,tint);part.setColorAt(j,tint);}
      }
    }
  }
  function direct(node){
    if(node.isInstancedMesh)stamps(node,[[0,node.count*16]]);
    else if(node.isMesh)add(node,node.geometry);
  }
  scene.traverse(node=>{
    const a=node.userData;
    if(a.timberSource===source){node.traverse(direct);return;}
    if(!node.isMesh)return;
    const ranges=a.timberMatrices?.get(source),indices=a.timberIndices?.get(source);
    if(ranges)stamps(node,ranges);
    if(indices){const g=woodSection(a.nearGeometry,indices);disposable.push(g);add(node,g);}
    if(source.form!==undefined && a.timberForm===source.form){
      const r=a.timberRecord(source);
      if(!r)return;
      // Preserve the hill wash, autumn dye, per-culm foot levels and the
      // forest's foreground-hole shader as the original boughs lean away.
      base.position.set(tree.x,r.ground,tree.z);base.rotation.y=r.rotation;base.scale.setScalar(tree.h);base.updateMatrix();
      const culms=node.geometry.userData.culms;
      for(let i=0;i<(culms?.length??1);i++){
        const stem=culms?.[i];
        const g=stem?woodSection(node.geometry,[[stem.firstIndex,stem.endIndex]]):node.geometry.clone();
        g.setAttribute('crownStyle',new T.InstancedBufferAttribute(new Float32Array([r.wash,r.bambooWash,r.reach,source.form]),4));
        g.setAttribute('leafDye',new T.InstancedBufferAttribute(new Float32Array([r.dye]),1));
        const part=add(node,g,1,stalks.get(i)?.group??group);
        disposable.push(g);part.setMatrixAt(0,base.matrix);part.setColorAt(0,tint.setScalar(r.tint));
      }
    }
    if(tree.kind==='peach' && source!==GATE_PEACH && source.size && a.timberPeach===(source.form??tree.seed%5)){
      base.position.set(tree.x,tree.ground,tree.z);base.rotation.y=source.turn;base.scale.setScalar(source.size);base.updateMatrix();
      const part=add(node,node.geometry,1);part.setMatrixAt(0,base.matrix);
      if(node.instanceColor)part.setColorAt(0,tint.set(tints[tree.seed%tints.length]));
    }
  });
}
function cutFace(cut,hinge){
  const b=hokoraCarpentry(),hollow=!!cut.culms;
  for(const stem of cut.culms??[cut]){
    const ring=(angle,r)=>[stem.x-hinge.x+Math.cos(angle)*r,0,stem.z-hinge.z+Math.sin(angle)*r];
    const uv=p=>[.5+(p[0]+hinge.x-stem.x)/(2*stem.radius),.5+(p[2]+hinge.z-stem.z)/(2*stem.radius)];
    for(let i=0;i<24;i++){
      const a=i*tau/24,beta=(i+1)*tau/24;
      const points=[ring(a,stem.radius),ring(beta,stem.radius)];
      if(hollow)points.push(ring(beta,stem.radius*.79),ring(a,stem.radius*.79));
      else points.push(ring(a,0));
      b.face(hollow?'culmCut':'endGrain',hollow?'#c9b881':'#c99d65',points,{uvs:points.map(uv)});
    }
  }
  return new T.Mesh(b.finish(),homesteadFinish());
}
// Reuse the solid boughs of this individual tree. A crown can strike an
// eave several metres to the side of a perfectly clear bole. Coalesce
// nearby samples and enclose their swept wood in one conservative sphere.
function timberProbes(tree,hinge,stalks){
  const solid=timberWood(tree.source),cells=new Map();
  if(!solid)return [];
  const step=Math.min(.68,Math.max(.32,tree.h*.060));
  for(const part of solid.wood){
    const count=Math.max(1,Math.ceil(Math.hypot(part.dx,part.dy,part.dz)*solid.scale/step));
    for(let i=0;i<=count;i++){
      const t=i/count,u=(part.x+part.dx*t)*solid.scale,v=(part.z+part.dz*t)*solid.scale;
      const x=solid.x+u*solid.c+v*solid.s-hinge.x,z=solid.z-u*solid.s+v*solid.c-hinge.z;
      const y=solid.base+(part.y+part.dy*t)*solid.scale-hinge.y;
      if(y<.20 || Math.hypot(x,z)<.34)continue;
      const key=(part.culm??'')+':'+[x,y,z].map(n=>Math.floor(n/step)).join(',');
      const radius=Math.max(.045,part.r*solid.scale)+Math.min(step*.35,.16);
      const q=cells.get(key);
      if(q)q.r=Math.max(q.r,Math.hypot(x-q.x,y-q.y,z-q.z)+radius);
      else cells.set(key,{x,y,z,r:radius,origin:stalks.get(part.culm)?.offset});
    }
  }
  return [...cells.values()];
}
export function fallingTimber(scene,tree,player,clear=()=>true){
  const cut=timberCut(tree),hinge=new T.Vector3(cut.x,cut.y,cut.z),group=new T.Group(),fade={value:1},disposable=[];
  const stalks=new Map(),ends=[];
  function cap(spec,parent){
    const mesh=cutFace(spec,hinge);parent.add(mesh);ends.push(mesh);disposable.push(mesh.geometry);
  }
  if(cut.culms?.length>1){
    // Keep each planted stalk, its rings, and its own spray of leaves on the
    // same hinge. In a wide clump one common axis would uproot the outer stems.
    for(const [i,stem] of cut.culms.entries()){
      const stalk=new T.Group(),offset=new T.Vector3(stem.x-cut.x,0,stem.z-cut.z);
      stalks.set(stem.culm??i,{group:stalk,offset});group.add(stalk);
      cap({culms:[stem]},stalk);
    }
  }
  copyWood(scene,tree,group,hinge,fade,disposable,stalks);
  if(!stalks.size)cap(cut,group);
  group.name='切り口から傾く樹冠';group.position.copy(hinge);
  let limit=0,axis=null;
  function chooseFall(){
    const away=Math.atan2(cut.x-player.x,cut.z-player.z);
    let heading=away;
    const blocks=(x,y,z,r)=>staticVolumeAt(x,z,y-r,r,2*r) || !clear(x,z,y-r,r,2*r);
    // Existing neighbouring boughs sometimes interlock in the standing
    // forest. A sample already inside scenery can leave its starting pose.
    const probes=timberProbes(tree,hinge,stalks).filter(p=>!blocks(cut.x+p.x,cut.y+p.y,cut.z+p.z,p.r));
    // Sweep the middle of the falling bole at several heights. In a cramped
    // grove let it lean and dissolve before touching another solid.
    for(const offset of [0,.45,-.45,.9,-.9,1.36,-1.36]){
      const a=away+offset,s=Math.sin(a),c=Math.cos(a);
      let stop=0;
      for(let angle=.08;angle<=1.53;angle+=.08){
        let blocked=false;
        for(const h of [.19,.38,.60,.82,.96]){
          const span=Math.max(.65,tree.h-.42)*h,reach=span*Math.sin(angle);
          const x=cut.x+s*reach,z=cut.z+c*reach,y=cut.y+span*Math.cos(angle);
          const pad=Math.min(.7,Math.max(.09,tree.h*(h>.58?.072:.031)));
          if(y-pad<terrainContactHeight(x,z) || staticVolumeAt(x,z,y-pad,pad,2*pad) || !clear(x,z,y-pad,pad,2*pad)){
            blocked=true;break;
          }
        }
        if(!blocked){
          const cos=Math.cos(angle),sin=Math.sin(angle);
          // In coordinates parallel to the fall, rotation is a 2D hinge.
          for(const p of probes){
            const along=(p.x-(p.origin?.x??0))*s+(p.z-(p.origin?.z??0))*c,shift=p.y*sin+along*(cos-1);
            const y=cut.y+p.y*cos-along*sin;
            if(blocks(cut.x+p.x+s*shift,y,cut.z+p.z+c*shift,p.r)){blocked=true;break;}
          }
        }
        if(blocked)break;
        stop=angle;
      }
      if(stop>limit){limit=stop;heading=a;}
      if(stop>1.42)break;
    }
    axis=new T.Vector3(Math.cos(heading),0,-Math.sin(heading));
  }
  const inverse=new T.Quaternion();
  group.visible=false;scene.add(group);
  return {group,update(progress){
    if(!axis)chooseFall();
    group.visible=true;const t=Math.min(1,Math.max(0,progress));
    group.quaternion.setFromAxisAngle(axis,limit*t*t*(3-2*t));
    inverse.copy(group.quaternion).invert();
    for(const stalk of stalks.values()){
      stalk.group.position.copy(stalk.offset).applyQuaternion(inverse).sub(stalk.offset);
    }
    const mist=Math.min(1,Math.max(0,(t-.30)/.70));fade.value=1-mist*mist*(3-2*mist);
    for(const end of ends)end.visible=fade.value>.34;
  },dispose(){group.removeFromParent();for(const o of disposable)o.dispose();}};
}
