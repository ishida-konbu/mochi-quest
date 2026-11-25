// Cut surfaces are sampled on the skin of the selected tree. In the cutting
// frame +Z points out of the mouth and y=0 is the remaining stump's top.
import * as T from './vendor/three.module.min.js';
import {hokoraCarpentry} from './kaede-hokora-mesh.js';
import {homesteadFinish} from './homestead-pigment.js';
import {timberWood} from './terrain.js';
import {isBambooStock} from './homestead-timber-section.js';

const steps=48,tau=Math.PI*2;
const slopes=[.77,.74,.72];
const fractions=[.32,.65,.81];
export function axeEdges(front,back){
  // The blade and both grips have a finite reach even on an old maple.
  // The remaining fibres part under the weight of the released crown.
  const span=Math.min(.70,front-back);
  return fractions.map(f=>front-f*span);
}
function cutFrame(stem,bearing){
  return new T.Matrix4().makeRotationY(-bearing).multiply(new T.Matrix4().makeTranslation(-stem.x,-stem.y,-stem.z));
}

// Keep triangles that actually cross the height of the notch. A grove model
// may have one matrix per spray, so reject distant instances before decoding
// any of their vertex buffers.
function barkAtHeight(root,stem,bearing,tree){
  const frame=cutFrame(stem,bearing),basis=new T.Matrix4(),instance=new T.Matrix4(),m=new T.Matrix4();
  const box=new T.Box3(),patch=new T.Box3();
  const r=Math.max(.045,stem.radius)*2.5;
  patch.min.set(-r,-r*.6,-r);patch.max.set(r,r,r);
  const result=[],foot=tree.source?.form!==undefined?timberWood(tree.source)?.culmFeet:null;
  root.updateWorldMatrix(true,true);
  root.traverse(mesh=>{
    if(!mesh.isMesh || mesh.userData.cutCap)return;
    basis.multiplyMatrices(frame,mesh.matrixWorld);
    const g=mesh.geometry,p=g.attributes.position,index=g.index,mark=g.attributes.bambooCulm;
    if(!g.boundingBox)g.computeBoundingBox();
    for(let n=0;n<(mesh.isInstancedMesh?mesh.count:1);n++){
      if(mesh.isInstancedMesh){mesh.getMatrixAt(n,instance);m.multiplyMatrices(basis,instance);}else m.copy(basis);
      box.copy(g.boundingBox).applyMatrix4(m);
      if(!mark && !box.intersectsBox(patch))continue;
      // The planted feet of grove bamboo are lowered in the vertex shader.
      // Apply the same drop from its surveyed centreline before slicing it.
      const vertices=new Array(p.count);
      const drops=mark && foot?new Map():null;
      if(drops){
        for(let i=0;i<p.count;i++){
          const k=mark.getX(i);
          if(k>0){const entry=drops.get(k)??[0,0];entry[0]+=p.getY(i);entry[1]++;drops.set(k,entry);}
        }
        for(const [k,[sum,count]] of drops)drops.set(k,(foot.find(seg=>seg.culm===k-1)?.y??sum/count)-sum/count);
      }
      const point=i=>{
        if(vertices[i])return vertices[i];
        const v=new T.Vector3().fromBufferAttribute(p,i);
        if(drops)v.y+=drops.get(mark.getX(i))??0;
        return vertices[i]=v.applyMatrix4(m);
      };
      for(let j=0;j<(index?.count??p.count);j+=3){
        const a=point(index?index.getX(j):j),b=point(index?index.getX(j+1):j+1),c=point(index?index.getX(j+2):j+2);
        box.makeEmpty().expandByPoint(a).expandByPoint(b).expandByPoint(c);
        if(box.intersectsBox(patch))result.push([a,b,c]);
      }
    }
  });
  return result;
}
function skinRing(triangles,radius,ridge,slope){
  const ray=new T.Ray(),cross=new T.Vector3(),ring=[];
  ray.origin.set(0,-ridge*slope,0);
  for(let i=0;i<steps;i++){
    const a=i*tau/steps,x=Math.cos(a),z=Math.sin(a);
    ray.direction.set(x,z*slope,z).normalize();
    let best=Infinity;
    for(const [p,q,r] of triangles){
      if(!ray.intersectTriangle(p,q,r,false,cross))continue;
      const hit=cross.x*x+cross.z*z;
      if(hit>.12*radius && hit<2.4*radius)best=Math.min(best,hit);
    }
    const length=Number.isFinite(best)?best:radius;
    ring.push([x*length,(z*length-ridge)*slope,z*length]);
  }
  return ring;
}
// Clip each face against the hinge line. This leaves the roof and floor
// touching along a real edge, including the hollow centre of a bamboo culm.
function clip(points,ridge,front){
  const out=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const da=(a[2]-ridge)*front,db=(b[2]-ridge)*front;
    if(da>=0)out.push(a);
    if((da<0&&db>0)||(da>0&&db<0)){
      const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,ridge]);
    }
  }
  return out;
}
function section(b,ring,ridge,slope,front,r,hollow,roof,whole=false){
  const flat=!slope;
  const tint=roof?(front<0?'#c8ad83':'#cdad7e'):'#f1d6a0';
  const inner=p=>[p[0]*.78,(p[2]*.78-ridge)*slope,p[2]*.78];
  for(let i=0;i<steps;i++){
    const a=ring[i],c=ring[(i+1)%steps],center=[0,-ridge*slope,0];
    // A short dark band at the back of the V shades the attached fibres.
    // Two or three earlywood bands remain readable at the exploration scale.
    const fractions=hollow?[.78,1]:[0,.25,.275,.47,.50,.73,.755,.94,1];
    const scaled=(p,k)=>[p[0]*k,(p[2]*k-ridge)*slope,p[2]*k];
    for(let band=1;band<fractions.length;band++){
      const a0=fractions[band-1],a1=fractions[band],innerA=scaled(a,a0),innerC=scaled(c,a0);
      const face=a0?[scaled(c,a1),scaled(a,a1),innerA,innerC]:[scaled(c,a1),scaled(a,a1),center];
      const points=whole?face:clip(face,ridge,front);
      if(points.length<3)continue;
      if(roof)points.reverse();
      const light=band%2===0 && band<7?.84:band===8?1.03:1;
      const colors=points.map(p=>{
        const gap=Math.max(0,(p[2]-ridge)/r);
        const occlusion=whole || front<0?1:.66+.34*Math.min(1,gap/.22);
        return new T.Color(tint).multiplyScalar(light*occlusion);
      });
      b.face(hollow?'culmCut':'endGrain',tint,points,{colors,uvs:points.map(p=>[.48+p[0]/(2.55*r),.49+p[2]/(2.55*r)])});
    }
    if(hollow && flat){
      // The bore is dark below the planted face; the missing wedge stays open.
      const a0=inner(a),b0=inner(c);
      if(whole || a0[2]<ridge && b0[2]<ridge)b.face('culmSkin','#655f44',[b0,a0,[a0[0],-.8*r,a0[2]],[b0[0],-.8*r,b0[2]]]);
    }
  }
}
export function stumpFace(group,stem,tree){
  const ring=skinRing(barkAtHeight(group,stem,0,tree),stem.radius,0,0),b=hokoraCarpentry();
  section(b,ring,0,0,1,stem.radius,isBambooStock(tree.kind),false,true);
  const mesh=new T.Mesh(b.finish(),homesteadFinish());
  mesh.castShadow=mesh.receiveShadow=true;mesh.userData.cutCap=true;mesh.userData.rim=ring;
  return mesh;
}
export function axeMouth(group,stem,bearing,tree,hollow){
  const triangles=barkAtHeight(group,stem,bearing,tree),r=stem.radius;
  const base=skinRing(triangles,r,0,0),front=base[steps/4][2],back=base[3*steps/4][2];
  const edges=axeEdges(front,back);
  const mouth=new T.Mesh(new T.BufferGeometry(),homesteadFinish());
  mouth.castShadow=mouth.receiveShadow=true;mouth.visible=false;mouth.userData.cutCap=true;
  mouth.name='斧が割り開いた木口';mouth.rotation.y=bearing;
  let previous,shape;
  return {mesh:mouth,front,edges,rim:base,
    update(bite,severed){
      // Make the incision while the bevel is advancing. Quantised fractions
      // keep the grain still when the blade recoils and bound transient meshes.
      const step=Math.max(0,Math.min(18,Math.round(bite*6)));
      const key=severed?'free':step;
      if(key!==previous){
        const strength=step/6,k=Math.min(2,Math.max(0,Math.ceil(strength)-1)),ratio=strength-k;
        const edge=severed?edges[2]:T.MathUtils.lerp(k?edges[k-1]:front,edges[k],ratio);
        const slope=slopes[k],roof=skinRing(triangles,r,edge,slope);
        const b=hokoraCarpentry();
        if(!severed)section(b,base,edge,0,1,r,hollow,false);
        section(b,roof,edge,slope,1,r,hollow,true);
        if(severed)section(b,base,edge,0,-1,r,hollow,true);
        mouth.geometry.dispose();mouth.geometry=b.finish();
        previous=key;shape={edge,slope};
      }
      mouth.visible=step>0;return shape;
    },
    dispose(){mouth.geometry.dispose();}
  };
}
