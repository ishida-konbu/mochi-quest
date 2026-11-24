// A mochi hand is part of its cheek in the authored mesh. Extending that
// single wrist bone across a whole workbench tears its four surrounding
// triangles. Loft the stretched dough from inside the same shoulder, with
// enough cross-sections for an elbow roll and a rounded pad around a grip.
import { BufferGeometry, Float32BufferAttribute, Mesh, Vector3, DynamicDrawUsage } from './vendor/three.module.min.js';

const rings=34, sides=18, tau=Math.PI*2;
function armMaterial(rice) {
  const mat=rice.plainSkin.clone();
  // Reuse the traveller's cheek material, including the brushed colour,
  // starch relief, mugwort flecks and warm wash from the shared uniforms.
  mat.onBeforeCompile=shader=>{
    rice.plainSkin.onBeforeCompile(shader);
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec3 cookRiceSkin;')
      .replace('vRiceRest=position;', 'vRiceRest=cookRiceSkin;');
  };
  mat.customProgramCacheKey=()=>'mochi-cooking-hand-1';
  return mat;
}
// Blend the little resting palm pads back into the cheek on this copy of
// the rig. The travel avatar keeps the original vertices, weights and clips.
// The radial section is measured from unbroken skin forward and aft of the
// pads at each height. This also keeps a second pair of mitts off the cook.
function smoothShoulders(rice) {
  const geo=rice.body.geometry.clone(),{position,normal,skinIndex,skinWeight}=geo.attributes;
  const bodyJoint=rice.body.skeleton.bones.indexOf(rice.hands[0].parent);
  const handJoints=rice.hands.map(b=>rice.body.skeleton.bones.indexOf(b));
  const profile=[[.35,.756,.876],[.46,.857,.981],[.60,.945,1.080],[.80,1.032,1.165],[1.00,1.071,1.205],[1.12,1.076,1.211]];
  const n=new Vector3(),slope=new Vector3();
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    for(let k=0;k<4;k++){
      if(handJoints.includes(skinIndex.getComponent(i,k)) && skinWeight.getComponent(i,k)>0)
        skinIndex.setComponent(i,k,bodyJoint);
    }
    const angle=Math.atan2(Math.abs(x),z);
    if(y<=.35 || y>=1.12 || angle<.64 || angle>1.40)continue;
    const j=profile.findIndex(row=>row[0]>=y);
    const [y0,z0,x0]=profile[j-1],[y1,z1,x1]=profile[j];
    const t=(y-y0)/(y1-y0),rz=z0+(z1-z0)*t,rx=x0+(x1-x0)*t;
    const fraction=Math.hypot(x/rx,z/rz);
    if(fraction<=1)continue;
    position.setXYZ(i,x/fraction,y,z/fraction);
    slope.set(x/(rx*rx),-(z*z*(z1-z0)/rz**3+x*x*(x1-x0)/rx**3)/(y1-y0),z/(rz*rz)).normalize();
    n.fromBufferAttribute(normal,i).lerp(slope,Math.min(1,(fraction-1)*49)).normalize();
    normal.setXYZ(i,n.x,n.y,n.z);
  }
  rice.body.geometry=geo;
}
function makeArm(root,side,material) {
  const geo=new BufferGeometry(),uv=[],rest=[],indices=[];
  for(let j=0;j<=rings;j++){
    const t=j/rings;
    for(let i=0;i<=sides;i++){
      const a=tau*i/sides;
      // This UV island is the unpainted palm of the source model. The
      // three-dimensional rest coordinate keeps grains steady as it bends.
      uv.push(.048+.017*Math.cos(a),.671+.024*t+.009*Math.sin(a));
      rest.push(side*(.88+.13*Math.cos(a)),.54+t*.48,.20+.13*Math.sin(a));
      if(j<rings && i<sides){
        const k=j*(sides+1)+i,n=k+sides+1;
        indices.push(k,k+1,n,n,k+1,n+1);
      }
    }
  }
  const pos=new Float32BufferAttribute(new Float32Array(rest.length),3);
  pos.setUsage(DynamicDrawUsage);
  geo.setAttribute('position',pos);
  geo.setAttribute('normal',new Float32BufferAttribute(new Float32Array(rest.length),3).setUsage(DynamicDrawUsage));
  geo.setAttribute('uv',new Float32BufferAttribute(uv,2));
  geo.setAttribute('cookRiceSkin',new Float32BufferAttribute(rest,3));geo.setIndex(indices);
  const mesh=new Mesh(geo,material);
  mesh.frustumCulled=false;mesh.castShadow=true;
  mesh.name=side<0?'右の餅の手':'左の餅の手';root.add(mesh);
  const p0=new Vector3(),p1=new Vector3(),p2=new Vector3(),p3=new Vector3();
  const spine=Array.from({length:rings+1},()=>new Vector3());
  const toTip=new Float32Array(rings+1);
  const tangent=new Vector3(),horizontal=new Vector3(),cross=new Vector3(),point=new Vector3();
  const out=new Vector3(side,0,0);
  const radius=t=>{
    // The wrist narrows before the soft working pad. The final quarter is
    // a curved fingertip; it can cup the side of a small cake independently.
    return .11+.053*Math.exp(-((t-.11)**2)/.062)-.021*Math.sin(t*Math.PI)+.023*Math.exp(-((t-.83)**2)/.009);
  };
  function update(shoulder,target,scale,torso) {
    p0.copy(shoulder);p3.copy(target);
    const reach=p0.distanceTo(p3);
    p1.copy(p0).addScaledVector(out,.075*scale).lerp(p3,.24);
    p1.y-=Math.min(.15,reach*.17);
    p1.z+=.19*scale;
    p2.copy(p3).lerp(p0,.23);
    p2.x+=side*Math.min(.09,.14*reach);
    p2.y+=Math.max(.006,reach*.046);
    // Aim the fingertip slightly inwards so the two pads meet opposite sides.
    p2.z+=.05*scale;
    for(let j=0;j<=rings;j++){
      const t=j/rings,u=1-t,center=spine[j];
      center.copy(p0).multiplyScalar(u*u*u).addScaledVector(p1,3*u*u*t)
        .addScaledVector(p2,3*u*t*t).addScaledVector(p3,t*t*t);
      // When a mitt crosses to the opposite side, trace the convex skin
      // outside the belly. The rig has no shoulder cavity to pass through.
      const xel=center.x/(torso.width*.82),yel=(center.y-torso.mid)/torso.height;
      const surface=torso.front+torso.depth*Math.sqrt(Math.max(0,1-xel*xel-yel*yel));
      const emerge=Math.min(1,Math.max(0,t/.22));
      const land=Math.min(1,Math.max(0,(1-t)/.19));
      center.z+=Math.max(0,surface+.055*scale-center.z)*emerge*emerge*(3-2*emerge)*land*land*(3-2*land);
    }
    // Transport each section along the finished curve. Taking the tangent
    // before the cheek clearance would fold a resting palm in on itself.
    for(let j=rings-1;j>=0;j--)toTip[j]=toTip[j+1]+spine[j].distanceTo(spine[j+1]);
    horizontal.copy(out);
    for(let j=0;j<=rings;j++){
      const t=j/rings,center=spine[j];
      tangent.subVectors(spine[Math.min(j+1,rings)],spine[Math.max(0,j-1)]).normalize();
      horizontal.addScaledVector(tangent,-horizontal.dot(tangent)).normalize();
      cross.crossVectors(tangent,horizontal).normalize();
      // Measure the round end in metres. A fraction of a short, bending
      // reach would leave a flat, sawn-off face on the resting palm.
      const cap=Math.max(0,1-toTip[j]/(.14*scale));
      const span=radius(t)*scale*Math.sqrt(1-cap*cap),flat=.82+.11*Math.sin(t*Math.PI)-.10*t;
      for(let i=0;i<=sides;i++){
        const a=tau*i/sides,r=span*(1+.015*Math.cos(3*a+t*1.7));
        point.copy(center).addScaledVector(horizontal,Math.cos(a)*r).addScaledVector(cross,Math.sin(a)*r*flat);
        pos.setXYZ(j*(sides+1)+i,point.x,point.y,point.z);
      }
    }
    pos.needsUpdate=true;geo.computeVertexNormals();
    // Smooth the circumferential UV seam; give the capped distal pole its
    // tangent normal rather than the normals of its coincident vertices.
    const normals=geo.attributes.normal;
    for(let j=0;j<rings;j++){
      const k=j*(sides+1);
      horizontal.fromBufferAttribute(normals,k);cross.fromBufferAttribute(normals,k+sides);
      horizontal.add(cross).normalize();
      normals.setXYZ(k,horizontal.x,horizontal.y,horizontal.z);
      normals.setXYZ(k+sides,horizontal.x,horizontal.y,horizontal.z);
    }
    for(let i=0;i<=sides;i++)normals.setXYZ(rings*(sides+1)+i,tangent.x,tangent.y,tangent.z);
    normals.needsUpdate=true;
  }
  return {update};
}
export function makeCookingArms(hero) {
  smoothShoulders(hero.rice);
  const material=armMaterial(hero.rice);
  return [-1,1].map(side=>makeArm(hero.root,side,material));
}
