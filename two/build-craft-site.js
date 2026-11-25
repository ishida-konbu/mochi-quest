// The unfinished frame is assembled from the very members the permanent
// structure will use. It is scenery until the final placement transaction.
import {Group,Mesh,Box3,Vector3,Raycaster} from './vendor/three.module.min.js';
import {assemblyParts} from './homestead-assembly-parts.js';
import {homesteadFinish} from './homestead-pigment.js';
import {BUILD_MODULES} from './living-build-state.js';

export function makeJoinerySite(parent,site){
  const group=new Group(),material=homesteadFinish(),parts=assemblyParts(site.kind,site.terrain,site);
  group.name='組みかけの建物';parent.add(group);
  const members=parts.map(part=>{
    const m=new Mesh(part.geometry,material);m.name=part.label;
    m.castShadow=m.receiveShadow=true;group.add(m);return m;
  });
  const lower=parts.reduce((y,p)=>Math.min(y,p.bounds.min[1]),0);
  // If a cramped plot has to be shown on the separate stage, the sockets
  // under a fitted wall or roof still need the supporting floor and uprights.
  const context=new Group();group.add(context);
  const floor=site.parentId && site.structures?.find(s=>s.id===site.parentId);
  if(floor){
    for(const s of site.structures.filter(s=>s===floor || s.parentId===floor.id)){
      for(const part of assemblyParts(s.kind,s.terrain)){
        const m=new Mesh(part.geometry,material);
        m.position.set(s.x-site.x,s.y-site.y,s.z-site.z);
        m.position.applyAxisAngle(new Vector3(0,1,0),-(site.yaw||0));
        m.rotation.y=s.yaw-(site.yaw||0);context.add(m);
      }
    }
  }
  const sight=new Raycaster(),hits=[];
  let active=[];
  function position(bench){
    const dx=site.x-bench.x,dz=site.z-bench.z,cos=Math.cos(bench.yaw),sin=Math.sin(bench.yaw);
    const def=BUILD_MODULES[site.kind];
    if(bench.detail)group.position.set(0,Math.max(-lower,floor?site.y-floor.y:0),-Math.hypot(def.width,def.depth)*.5-1.7);
    else group.position.set(cos*dx-sin*dz,site.y-bench.y,sin*dx+cos*dz);
    group.rotation.y=(site.yaw||0)-bench.yaw;context.visible=!!bench.detail;
    group.updateWorldMatrix(true,true);
  }
  function advance(index,count){
    // Leave the last member on the bench. Start with actual supports, then
    // reveal further work only across the paper cuts between components.
    const fraction=.24+.55*(count===1?.35:index/(count-1));
    const n=Math.max(1,Math.min(members.length-1,Math.ceil(members.length*fraction)));
    members.forEach((m,i)=>{m.visible=i<n;});
    active=members.slice(0,n);
    if(context.visible)active.push(...context.children);
  }
  function extents(){
    const bounds=new Box3(),temporary=new Box3();
    for(const m of active){
      if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
      temporary.copy(m.geometry.boundingBox).applyMatrix4(m.matrix).applyMatrix4(group.matrix);
      bounds.union(temporary);
    }
    const result=[];
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])
      for(const z of [bounds.min.z,bounds.max.z])result.push(new Vector3(x,y,z));
    return result;
  }
  function clear(target,eye){
    sight.set(eye,target.clone().sub(eye).normalize());sight.near=.035;sight.far=eye.distanceTo(target)-.055;
    hits.length=0;sight.intersectObjects(active,false,hits);
    return hits.length===0;
  }
  function dispose(){
    group.removeFromParent();
    for(const part of parts)if(part.siteGeometry)part.geometry.dispose();
  }
  return {position,advance,extents,clear,dispose};
}
