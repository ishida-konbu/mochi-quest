// A mochi hand is part of its cheek in the authored mesh. Extending that
// single wrist bone across a whole workbench tears its four surrounding
// triangles. Loft the stretched dough from inside the same shoulder, with
// enough cross-sections for an elbow roll and a rounded pad around a grip.
import { BufferGeometry, Float32BufferAttribute, Mesh, Vector3, DynamicDrawUsage } from './vendor/three.module.min.js';

const rings=40, sides=24, tau=Math.PI*2;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
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
  mat.customProgramCacheKey=()=>'mochi-cooking-hand-2';
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
export function makeDoughArm(root,side,material) {
  const geo=new BufferGeometry(),uv=[],rest=[],indices=[];
  for(let j=0;j<=rings;j++){
    const t=j/rings;
    for(let i=0;i<=(j===rings?0:sides);i++){
      const a=tau*i/sides;
      // This UV island is the unpainted palm of the source model. The
      // three-dimensional rest coordinate keeps grains steady as it bends.
      uv.push(.048+.017*Math.cos(a),.671+.024*t+.009*Math.sin(a));
      rest.push(side*(.88+.13*Math.cos(a)),.54+t*.48,.20+.13*Math.sin(a));
      if(j<rings && i<sides){
        const k=j*(sides+1)+i,n=k+sides+1;
        if(j+1===rings)indices.push(k,k+1,rings*(sides+1));
        else indices.push(k,k+1,n,n,k+1,n+1);
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
  const lagged=new Vector3(),drag=new Vector3(),padAxis=new Vector3(),up=new Vector3(0,1,0);
  const lastTip=new Vector3();
  let lastTime,previousBeat;
  function update(shoulder,target,scale,torso,time=0,pressure=0,beat) {
    p0.copy(shoulder);p3.copy(target);
    const reach=p0.distanceTo(p3),dt=time-lastTime,load=clamp(pressure,0,1);
    // The middle of a pulled piece of dough takes a fraction of a beat to
    // follow the palm. Both ends remain attached, including on a quick strike.
    if(lastTime===undefined || dt<0 || dt>.18 || beat!==previousBeat || lastTip.distanceTo(target)>.55*scale)lagged.copy(target);
    else lagged.lerp(target,-Math.expm1(-dt/.085));
    lastTime=time;previousBeat=beat;lastTip.copy(target);
    drag.subVectors(lagged,target).clampLength(0,.09*scale);
    const slack=1-smooth((reach/scale-.45)/1.05);
    p1.copy(p0).lerp(p3,.26).addScaledVector(out,(.10+.16*slack)*scale);
    p1.y-=(.045+.11*slack)*scale;p1.z+=.14*scale;
    p2.copy(p3).lerp(p0,.23);
    p2.x+=side*(.035+.083*slack)*scale;
    p2.y+=(.018+.065*slack)*scale;p2.z+=.04*scale;
    for(let j=0;j<=rings;j++){
      const t=j/rings,u=1-t,center=spine[j];
      center.copy(p0).multiplyScalar(u*u*u).addScaledVector(p1,3*u*u*t)
        .addScaledVector(p2,3*u*t*t).addScaledVector(p3,t*t*t)
        .addScaledVector(drag,Math.sin(t*Math.PI)**2);
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
    const length=toTip[0]/scale;
    // Preserve dough through the forearm as it stretches. The dough gathered
    // at the heel of the palm stays broad enough to carry a dish or grip wood.
    const girth=clamp(Math.sqrt(.92/Math.max(.20,length)),.64,1.24);
    horizontal.copy(out);
    for(let j=0;j<rings;j++){
      const t=j/rings,center=spine[j],distance=toTip[j]/scale;
      tangent.subVectors(spine[j+1],spine[Math.max(0,j-1)]).normalize();
      horizontal.addScaledVector(tangent,-horizontal.dot(tangent));
      if(horizontal.lengthSq()<1e-8)horizontal.crossVectors(tangent,Math.abs(tangent.y)<.94?up:out);
      horizontal.normalize();
      cross.crossVectors(tangent,horizontal).normalize();
      // A forearm flows out of a flared shoulder, narrows at the wrist, then
      // gathers into a flattened palm. Measure the palm in metres so its size
      // does not balloon when the performer reaches across the table.
      const palm=Math.exp(-((distance-.105)**2)/.0105);
      const neck=Math.exp(-((distance-.29)**2)/.012);
      const root=.105*Math.exp(-((t-.045)**2)/.030);
      const belly=.020*Math.sin(Math.PI*t);
      const shaft=(.091+root+belly-.023*neck)*girth;
      const radius=(shaft+(.048+.014*load)*palm)*scale;
      const cap=clamp(1-distance/.125,0,1),span=radius*Math.sqrt(1-cap*cap);
      // The underside meets the handle like a thumb pad. Orient the broad
      // face towards the work independently of how the shoulder has rolled.
      padAxis.crossVectors(up,tangent);
      const horizontalPalm=padAxis.lengthSq()>.0001?padAxis.normalize().dot(horizontal):1;
      const crossPalm=padAxis.dot(cross);
      const flat=.16+.13*palm+.09*load*palm;
      for(let i=0;i<=sides;i++){
        const a=tau*i/sides,ca=Math.cos(a),sa=Math.sin(a);
        const across=ca*horizontalPalm+sa*crossPalm;
        const thickness=ca*(-crossPalm)+sa*horizontalPalm;
        const spread=1+.11*palm,depth=1-flat;
        const h=across*spread*horizontalPalm-thickness*depth*crossPalm;
        const v=across*spread*crossPalm+thickness*depth*horizontalPalm;
        const r=span*(1+.027*slack*Math.cos(2*a+.55)*Math.sin(t*Math.PI));
        point.copy(center).addScaledVector(horizontal,h*r).addScaledVector(cross,v*r);
        pos.setXYZ(j*(sides+1)+i,point.x,point.y,point.z);
      }
    }
    pos.setXYZ(rings*(sides+1),p3.x,p3.y,p3.z);
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
    normals.setXYZ(rings*(sides+1),tangent.x,tangent.y,tangent.z);
    normals.needsUpdate=true;
  }
  return {update};
}
export function makeCookingArms(hero) {
  smoothShoulders(hero.rice);
  const material=armMaterial(hero.rice);
  return [-1,1].map(side=>makeDoughArm(hero.root,side,material));
}
