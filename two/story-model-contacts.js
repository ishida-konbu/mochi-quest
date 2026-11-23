// The worktables share their structural plan with physics. Their exhibits
// and the actors' limbs, clothing and tools follow individual mesh transforms.
import { BackSide, Box3, Matrix4, Vector3 } from './vendor/three.module.min.js';

const geometryParts=new WeakMap();
const a=new Vector3(),b=new Vector3(),c=new Vector3(),size=new Vector3();

function partBoxes(geometry) {
  let parts=geometryParts.get(geometry);
  if (parts) return parts;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bounds=geometry.boundingBox;
  const indices=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight;
  const skinBounds=new Map();
  bounds.getSize(size);
  // Partition joined ink meshes too, or a gap between legs or handles would
  // become a solid wall. Include all three vertices even across a cell edge.
  const step=Math.max(.16,size.x/6,size.y/6,size.z/6);
  const cols=Math.floor(size.x/step)+1,rows=Math.floor(size.y/step)+1;
  const buckets=new Map(),pos=geometry.attributes.position,index=geometry.index;
  const count=index ? index.count : pos.count;
  for (let i=0;i+2<count;i+=3) {
    a.fromBufferAttribute(pos,index ? index.getX(i) : i);
    b.fromBufferAttribute(pos,index ? index.getX(i+1) : i+1);
    c.fromBufferAttribute(pos,index ? index.getX(i+2) : i+2);
    const x=Math.floor(((a.x+b.x+c.x)/3-bounds.min.x)/step);
    const y=Math.floor(((a.y+b.y+c.y)/3-bounds.min.y)/step);
    const z=Math.floor(((a.z+b.z+c.z)/3-bounds.min.z)/step);
    const key=x+cols*(y+rows*z);
    let piece=buckets.get(key);
    if (!piece) { piece={box:new Box3(),bones:new Map()}; buckets.set(key,piece); }
    piece.box.expandByPoint(a).expandByPoint(b).expandByPoint(c);
    if (weights) {
      for (let j=0;j<3;j++) {
        const vertex=index ? index.getX(i+j) : i+j, point=j===0 ? a : j===1 ? b : c;
        for (let k=0;k<4;k++) {
          if (weights.getComponent(vertex,k)<=0) continue;
          const bone=indices.getComponent(vertex,k);
          for (const group of [piece.bones,skinBounds]) {
            if (!group.has(bone)) group.set(bone,new Box3());
            group.get(bone).expandByPoint(point);
          }
        }
      }
    }
  }
  parts={pieces:[...buckets.values()],skinBounds};
  geometryParts.set(geometry,parts);
  return parts;
}

function overlap(box,x,z,feet,head,radius) {
  if (feet>=box.max.y || head<=box.min.y) return 0;
  const dx=Math.max(box.min.x-x,x-box.max.x),dz=Math.max(box.min.z-z,z-box.max.z);
  if (dx>=radius || dz>=radius) return 0;
  return radius-Math.hypot(Math.max(0,dx),Math.max(0,dz))-Math.min(0,Math.max(dx,dz));
}

export function createModelContacts(root,skip=null) {
  const meshes=[],worldBox=new Box3(),limbBox=new Box3();
  function posedBox(bones,matrices,target) {
    target.makeEmpty();
    for (const [bone,bounds] of bones) target.union(limbBox.copy(bounds).applyMatrix4(matrices[bone]));
    return target;
  }
  function collect(node) {
    if (!node.visible || node===skip) return;
    const outline=node.isMesh && node.geometry===node.parent?.geometry && node.material.side===BackSide;
    if (node.isMesh && !outline && node.material.visible && !(node.material.transparent && !node.material.depthWrite)) {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      const matrices=node.isSkinnedMesh ? node.skeleton.bones.map(()=>new Matrix4()) : null;
      meshes.push({node,box:new Box3(),matrices});
    }
    for (const child of node.children) collect(child);
  }
  collect(root);
  let lastPose=-1;
  return (x,z,feet,height,radius,pose)=>{
    if (pose!==lastPose) {
      root.updateWorldMatrix(true,false);
      root.updateMatrixWorld(true);
      for (const {node,box,matrices} of meshes) {
        if (matrices) {
          for (const [i,bone] of node.skeleton.bones.entries()) {
            matrices[i].multiplyMatrices(node.matrixWorld,node.bindMatrixInverse)
              .multiply(bone.matrixWorld).multiply(node.skeleton.boneInverses[i]).multiply(node.bindMatrix);
          }
          posedBox(partBoxes(node.geometry).skinBounds,matrices,box);
        } else box.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
      }
      lastPose=pose;
    }
    let depth=0;
    for (const {node,box,matrices} of meshes) {
      if (overlap(box,x,z,feet,feet+height,radius)<=depth) continue;
      for (const part of partBoxes(node.geometry).pieces) {
        if (matrices) posedBox(part.bones,matrices,worldBox);
        else worldBox.copy(part.box).applyMatrix4(node.matrixWorld);
        depth=Math.max(depth,overlap(worldBox,x,z,feet,feet+height,radius));
      }
    }
    return depth;
  };
}
