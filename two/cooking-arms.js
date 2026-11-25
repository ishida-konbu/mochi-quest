// A pulled mitt is one rounded lobe of dough. Carry the same skin all the
// way from the walking pose to the tool, without an elbow or a separate grip.
import {Mesh,Matrix3,Matrix4,Quaternion,Vector3} from './vendor/three.module.min.js';
import {separateMitts} from './dough-surface.js';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function mittMaterial(original){
  const mat=original.clone();
  mat.onBeforeCompile=(shader,renderer)=>{
    original.onBeforeCompile(shader,renderer);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 doughRest; attribute vec3 doughGrain;')
      .replaceAll('vRiceRest=position;', 'vRiceRest=doughRest;').replaceAll('vRiceNormal=normal;', 'vRiceNormal=doughGrain;')
      .replaceAll('finishPosition=position;', 'finishPosition=doughRest;').replaceAll('finishNormal=normal;', 'finishNormal=doughGrain;');
  };
  mat.customProgramCacheKey=()=>original.customProgramCacheKey()+'/pulled-rice';
  return mat;
}
function pullMitt(hero,patch,side,materials){
  const body=hero.rice.body,root=hero.root;
  const {nodes,perimeter,inside,geometry,tip,samples,faces}=patch;
  const mesh=new Mesh(geometry,body.material);mesh.name=side<0?'右の餅の手':'左の餅の手';mesh.castShadow=true;mesh.frustumCulled=false;
  root.add(mesh);
  const basis=new Matrix4(),skinNormal=new Matrix3(),skinMatrix=new Matrix4();
  const skinMatrices=body.skeleton.bones.map(()=>new Matrix4());
  const {skinIndex,skinWeight,normal:restNormal}=body.geometry.attributes;
  const centre=new Vector3(),axis=new Vector3(),out=new Vector3(),end=new Vector3(),bindTip=new Vector3();
  const radialX=new Vector3(),radialY=new Vector3(),lead=new Vector3(),tail=new Vector3(),inertial=new Vector3(),oldEnd=new Vector3(),lag=new Vector3();
  const a=new Vector3(),b=new Vector3(),c=new Vector3(),d=new Vector3(),arc=new Quaternion();
  const segments=32,spine=Array.from({length:segments+1},()=>({p:new Vector3(),q:new Quaternion()}));
  let previousTime,previousBeat;
  function nativeNormal(p,n){
    skinMatrix.elements.fill(0);
    for(let k=0;k<4;k++){
      const w=skinWeight.getComponent(p.id,k);
      if(w===0)continue;
      const m=skinMatrices[skinIndex.getComponent(p.id,k)].elements;
      for(let j=0;j<16;j++)skinMatrix.elements[j]+=w*m[j];
    }
    skinMatrix.premultiply(body.bindMatrixInverse).multiply(body.bindMatrix);
    return n.fromBufferAttribute(restNormal,p.id).transformDirection(skinMatrix).applyNormalMatrix(skinNormal);
  }
  function update(target,scale,time,beat,surface,rest,work=1){
    if(!materials.has(body.material))materials.set(body.material,mittMaterial(body.material));
    mesh.material=materials.get(body.material);
    basis.copy(root.matrixWorld).invert().multiply(body.matrixWorld);
    skinNormal.getNormalMatrix(basis);
    for(const [i,m] of skinMatrices.entries())m.multiplyMatrices(body.skeleton.bones[i].matrixWorld,body.skeleton.boneInverses[i]);
    centre.set(0,0,0);axis.set(0,0,0);
    for(const p of perimeter){
      body.getVertexPosition(p.id,p.point).applyMatrix4(basis);centre.add(p.point);
      // Match the skinned cheek's shading at every shared boundary vertex.
      nativeNormal(p,p.normal);
      axis.add(p.normal);
    }
    centre.divideScalar(perimeter.length);axis.normalize();
    body.getVertexPosition(tip.id,bindTip).applyMatrix4(basis);
    // The free hand is the little mitt already modelled on the travelling
    // body. Only the held share of a sampled reach belongs to the tool.
    // Follow the outside of the cheek when reaching across the face.
    if(work===0)end.copy(bindTip);
    else {
      end.copy(target);
      if(work<1){
        end.addScaledVector(a.subVectors(bindTip,rest),1-work);
        const inward=Math.max(0,-a.subVectors(end,bindTip).dot(axis));
        const clearance=Math.min(.27*work*scale,inward+.11*work*scale);
        end.addScaledVector(axis,clearance*4*(1-work));
        if(!surface)end.y+=.19*scale*4*work*(1-work);
      }
    }
    const shift=end.distanceTo(bindTip)/scale,extend=smooth(.008,.22,shift);
    const reach=centre.distanceTo(end),dt=time-previousTime;
    const bend=smooth(.23,.85,shift);
    if(previousTime===undefined || dt<0 || dt>.18 || previousBeat!==beat || oldEnd.distanceTo(end)>.65*scale)inertial.copy(end);
    else inertial.lerp(end,-Math.expm1(-dt/.10));
    oldEnd.copy(end);previousTime=time;previousBeat=beat;
    lag.subVectors(inertial,end).clampLength(0,.085*scale);
    // Follow the round cheek as the mitt turns forward. An outward tangent
    // at its root leaves room for the skin to turn without doubling back.
    lead.copy(centre).addScaledVector(axis,Math.min(.32*scale,.10*scale+.25*reach));
    lead.z+=Math.min(.18*scale,reach*.13);
    tail.lerpVectors(lead,end,.62);
    tail.z+=.04*scale; tail.y-=Math.min(.055*scale,reach*.035);
    if(surface){
      // Carry the weight over the board. Approach the grip from above so
      // the rounded end comes to rest on the timber before the belly does.
      lead.y+=.075*scale*extend;
      tail.x+=(end.x-tail.x)*.23*extend;
      tail.z+=(end.z-tail.z)*.23*extend;
      tail.y+=.065*scale*extend;
      tail.y=Math.max(tail.y,end.y+.13*scale*extend);
    }
    let rimRadius=0;
    radialX.set(0,0,0);radialY.set(0,0,0);
    for(const p of perimeter){
      a.subVectors(p.point,centre);a.addScaledVector(axis,-a.dot(axis));
      rimRadius+=a.length();radialX.addScaledVector(a,p.cos);radialY.addScaledVector(a,p.sin);
    }
    rimRadius/=perimeter.length;
    radialX.normalize();
    radialY.addScaledVector(radialX,-radialX.dot(radialY)).normalize();
    const restDepth=centre.distanceTo(bindTip);
    const tipHeight=a.subVectors(bindTip,centre).dot(axis);
    // The wide collar is cheek, not the girth of the hand. Estimate the
    // rice available in the original nub and allow a little more to flow
    // from the cheek. Drawing it further reduces its section continuously.
    const drawn=Math.max(.090*scale,.80*restDepth*Math.sqrt((restDepth+.30*scale)/Math.max(.01,reach)));
    const thin=1-Math.min(.80,drawn/rimRadius);
    for(let k=0;k<=segments;k++){
      const f=k/segments,u=1-f,s=spine[k];
      s.p.copy(centre).multiplyScalar(u*u*u).addScaledVector(lead,3*f*u*u).addScaledVector(tail,3*f*f*u).addScaledVector(end,f*f*f)
        .addScaledVector(lag,Math.sin(f*Math.PI)**2);
      // A short pull is a shallow dome with parallel sections. Bending the
      // whole width of a cheek at this length would fold its underside.
      if(bend<1)s.p.lerp(a.lerpVectors(centre,end,f**1.65),1-bend);
    }
    for(let k=0;k<=segments;k++){
      out.subVectors(spine[Math.min(segments,k+1)].p,spine[Math.max(0,k-1)].p).normalize();
      out.lerp(axis,1-bend*smooth(0,.30,k/segments)).normalize();
      spine[k].q.setFromUnitVectors(axis,out);
    }
    for(const p of nodes){
      if(p.rim)p.native.copy(p.point);
      else if(p.from)p.native.lerpVectors(p.from.native,p.to.native,.5);
      else body.getVertexPosition(p.id,p.native).applyMatrix4(basis);
    }
    for(const p of inside){
      if(p===tip){p.point.copy(end);continue;}
      const f=1-p.r*p.r,k=Math.min(segments-1,Math.floor(f*segments)),g=f*segments-k;
      const l=spine[k],r=spine[k+1];
      b.copy(radialX).multiplyScalar(p.cos).addScaledVector(radialY,p.sin);
      // Evaluate the round cap at every native vertex. Interpolating a
      // square-root radius down to zero would turn its centre into a cone.
      const u=p.r*p.r,cap=1-Math.min(1,u*reach/Math.max(.001,rimRadius*(1-thin)));
      const longRadius=(1-thin*(1-u*u*u*u))*Math.sqrt(1-cap*cap);
      const radius=rimRadius*((1-bend)*p.r+bend*longRadius);
      arc.copy(l.q).slerp(r.q,g);b.applyQuaternion(arc).multiplyScalar(radius);
      p.point.lerpVectors(l.p,r.p,g).add(b);
      const polish=extend*smooth(.08,.63,f);
      if(polish<1){
        // Retain the moulded cheek around the attachment. The working
        // surface leaves its original triangles gradually towards the centre.
        c.copy(p.native);
        const height=a.subVectors(p.native,centre).dot(axis)/tipHeight;
        const carry=smooth(.10,.98,height)*smooth(0,.3,f);
        c.addScaledVector(d.subVectors(end,bindTip),carry*(1-extend)/(1-polish));
        p.point.lerp(c,1-polish);
      }
    }
    if(surface && work>0){
      // A soft pad compresses as it bears on the stock. The continuous
      // response retains the ordering of the skin, even right at contact.
      const cushion=.032*scale;
      for(const p of inside){
        if(p===tip)continue;
        const q=p.point,floor=surface(q.x,q.z),gap=q.y-floor;
        if(gap<cushion)q.y=floor+cushion*Math.exp((gap-cushion)/cushion);
      }
    }
    for(const p of inside)p.normal.set(0,0,0);
    for(let i=0;i<faces.length;i+=3){
      const p=nodes[faces[i]],q=nodes[faces[i+1]],r=nodes[faces[i+2]];
      a.subVectors(q.point,p.point).cross(b.subVectors(r.point,p.point));
      if(!p.rim)p.normal.add(a);if(!q.rim)q.normal.add(a);if(!r.rim)r.normal.add(a);
    }
    const nativeLight=1-smooth(0,.16,shift);
    for(const p of inside){
      p.normal.normalize();
      if(nativeLight>0){
        p.nativeLight??=new Vector3();
        if(p.from)p.nativeLight.lerpVectors(p.from.nativeLight??p.from.normal,p.to.nativeLight??p.to.normal,.5).normalize();
        else nativeNormal(p,p.nativeLight);
        p.normal.lerp(p.nativeLight,nativeLight).normalize();
      }
    }
    const {position,normal}=geometry.attributes;
    for(let i=0;i<samples.length;i++){
      const p=nodes[samples[i]],v=p.point,n=p.normal;
      position.setXYZ(i,v.x,v.y,v.z);normal.setXYZ(i,n.x,n.y,n.z);
    }
    position.needsUpdate=normal.needsUpdate=true;
  }
  return {update,mesh,patch};
}
export function makeCookingArms(hero){
  const patches=separateMitts(hero.rice.body,hero.rice.hands),materials=new Map();
  return patches.map((patch,i)=>pullMitt(hero,patch,i?1:-1,materials));
}
