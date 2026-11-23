// Keep the underside and leading edge of the actual carved face clear of the
// joinery. The long ears, beaks and necks are articulated by different rigs.
import { Box3, Matrix4, Quaternion, Vector3 } from './vendor/three.module.min.js';

const samples=[new WeakMap(),new WeakMap()];
const contours=new WeakMap();
function faceSurface(actor,complete){
  const cache=samples[Number(complete)];
  if(cache.has(actor))return cache.get(actor);
  const head=['head','mask','首','襟首','turtleNeck','turtle-head','bream-body','octopus-mantle']
    .map(name=>actor.getObjectByName(name)).find(Boolean);
  const parts=[];
  head?.traverseVisible(mesh=>{
    if(!mesh.isMesh || mesh.geometry===mesh.parent?.geometry || mesh.isSkinnedMesh)return;
    const vertices=mesh.geometry.attributes.position;
    if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
    if(!contours.has(mesh.geometry)){
      const unique=new Map(),p=new Vector3();
      for(let i=0;i<vertices.count;i++){
        p.fromBufferAttribute(vertices,i);
        const key=p.x+','+p.y+','+p.z;
        if(!unique.has(key))unique.set(key,p.clone());
      }
      contours.set(mesh.geometry,[...unique.values()]);
    }
    let points=contours.get(mesh.geometry);
    if(!complete){
      const step=Math.max(.045,mesh.geometry.boundingBox.getSize(new Vector3()).length()/10),cells=new Map();
      for(const p of points){
        const key=Math.floor(p.x/step)+','+Math.floor(p.y/step)+','+Math.floor(p.z/step);
        if(!cells.has(key) || p.y<cells.get(key).y)cells.set(key,p);
      }
      points=[...cells.values()];
    }
    parts.push({mesh,points,box:mesh.geometry.boundingBox});
  });
  const face={head,parts};cache.set(actor,face);return face;
}

export function worktopHeadroom(actor,bench,plan,leaves=[],complete=true){
  const {head,parts}=faceSurface(actor,complete),m=new Matrix4(),p=new Vector3(),box=new Box3();
  bench.updateWorldMatrix(true,false);
  const inverse=bench.matrixWorld.clone().invert();
  const rectangles=[{x:0,z:0,w:plan.width/2,d:plan.depth/2,y:plan.top??plan.worktop},
    ...leaves.map(o=>({x:o.position.x,z:o.position.z,w:o.userData.width/2,d:o.userData.depth/2,y:o.userData.worktop}))];
  function depth(article){
    let worst=0;
    const surfaces=article ? [...rectangles,article] : rectangles;
    for(const {mesh,points,box:local} of parts){
      mesh.updateWorldMatrix(true,false);m.multiplyMatrices(inverse,mesh.matrixWorld);box.copy(local).applyMatrix4(m);
      for(const {x,z,w,d,y} of surfaces){
        if(box.min.y>y+.008 || box.max.x<x-w-.008 || box.min.x>x+w+.008 || box.max.z<z-d-.008 || box.min.z>z+d+.008)continue;
        for(const point of points){
          p.copy(point).applyMatrix4(m);
          worst=Math.max(worst,Math.min(w+.008-Math.abs(p.x-x),d+.008-Math.abs(p.z-z),y+.008-p.y));
        }
      }
    }
    return worst;
  }
  const rest=new Quaternion(),last=new Quaternion();let adjusted=false;
  function restoreNeck(){
    if(adjusted && head.quaternion.angleTo(last)<1e-6)head.quaternion.copy(rest);
    adjusted=false;
  }
  function clearNeck(article){
    if(!head)return;
    restoreNeck();
    let collision=depth(article);if(collision<.003)return;
    // Keep the neck attached to its collar. Raise the muzzle, or turn it
    // alongside the rim if the artisan is reaching sideways near a shelf.
    rest.copy(head.quaternion);
    const x=head.rotation.x,y=head.rotation.y;
    for(const [pitch,yaw] of [[-.16,0],[-.34,0],[-.52,0],[-.32,.36],[-.32,-.36],[-.54,.60],[-.54,-.60]]){
      head.rotation.x=x+pitch;head.rotation.y=y+yaw;
      const after=depth(article);
      if(after<collision){collision=after;last.copy(head.quaternion);adjusted=true;}
      if(collision<.003)break;
    }
    head.quaternion.copy(adjusted?last:rest);
    // A cup or platter can surround empty space in its rectangular bounds.
    // Give the solid counter priority when the two constraints disagree.
    if(article && depth()>.008)clearNeck();
  }
  return {depth,clearNeck,restoreNeck,head};
}
