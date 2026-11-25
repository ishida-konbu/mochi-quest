// The sleeper uses the walking skin and the hot-spring float shape, whose
// face and mitts travel together as the soft belly lengthens.
import * as T from './vendor/three.module.min.js';
import {makeHero} from './actors.js';
import {poseRice} from './mochi-model.js';
import {coverEdge} from './camp-cover.js';
import {campMattress} from './camp-bedding.js';
import {groundHeight} from './terrain.js';

const {lerp,clamp,smoothstep}=T.MathUtils;
let restingActor;
const NX=41,NZ=55;
const gridX=x=>(x+1.35)/2.7*(NX-1);
const gridZ=z=>(z+1.6)/3.2*(NZ-1);
function skinLandmarks(r){
  const g=r.body.geometry,pos=g.attributes.position,joints=g.attributes.skinIndex,weights=g.attributes.skinWeight;
  const indices=r.hands.map(hand=>r.body.skeleton.bones.indexOf(hand));
  const palms=[0,0],eyes=[0,0],eyeDistance=[Infinity,Infinity],mitt=new Uint8Array(pos.count);let chin=0,near=Infinity;const lowest=[Infinity,Infinity];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const d=(y-1.14)**2+x*x;
    if(z>.60){
      if(d<near){near=d;chin=i;}
      const side=x<0?0:1,dEye=(Math.abs(x)-.35)**2+(y-1.38)**2;
      if(dEye<eyeDistance[side]){eyeDistance[side]=dEye;eyes[side]=i;}
    }
    const side=indices.indexOf(joints.getX(i));
    if(side!==-1)mitt[i]=1;
    if(side!==-1 && weights.getX(i)>.78){
      // The pad on the underside of the resting mitt catches the hem.
      const score=y-.46*z;
      if(score<lowest[side]){palms[side]=i;lowest[side]=score;}
    }
  }
  return {palms,eyes,chin,mitt};
}
export function createSleeper(root,player,mat){
  const h=restingActor??makeHero();restingActor=null;
  const {rice,pose}=h;root.add(h.root);
  h.wrap.visible=player.buffs?.wrap>0;h.leaves.visible=player.mode==='kusa';
  h.wingParts.forEach(w=>w.visible=player.mode==='habutae');
  const large=player.buffs?.full>0?1.28:1,stack=player.mode==='kagami';
  // A visitor carrying the full-size buff settles four finger-widths clear
  // of the indoor chest, with the heels inside the doorway's corner post.
  const broadInHut=mat===campMattress(true) && large>1;
  const heelInset=broadInHut?.145:0;
  const v=new T.Vector3(),inv=new T.Matrix4(),matrix=new T.Matrix4();
  const grips=[new T.Vector3(),new T.Vector3()],target=new T.Vector3(),old=new T.Vector3();
  const marks=skinLandmarks(rice),field=new Float32Array(NX*NZ),tier=stack?new Float32Array(NX*NZ):null;
  const skin={...player,grounded:true,activity:null,gestureSample:{time:0,weight:1}};
  const bath={recline:0,melt:0,settle:0};
  const profile={height:undefined,edge:0,grips:undefined};
  let parked,wrapParent,upperRestArea;
  function putDown(mesh){
    root.attach(mesh);
    // The willow and the ceremonial paper sit on firm ground at the
    // entrance while the mochi walks to bed. Retain their actual scale.
    const atZ=mat.foot+1.55;
    const at=root.localToWorld(v.set(mat.x,0,atZ));
    const ground=groundHeight(at.x,at.z,root.position.y);
    mesh.position.set(mat.x,ground-root.position.y+.03,atZ);
  }
  function height(x,z){
    const u=gridX(x),w=gridZ(z),i=Math.floor(u),j=Math.floor(w);
    if(i<0||i>=NX-1||j<0||j>=NZ-1)return 0;
    const n=i+j*NX,du=u-i,dv=w-j;
    return lerp(lerp(field[n],field[n+1],du),lerp(field[n+NX],field[n+NX+1],du),dv);
  }
  // Measure in mattress coordinates; this same surface supports the rolled
  // pillow, heel and hip, and supplies the collision profile of the quilt.
  function scan(mesh,out){
    matrix.multiplyMatrices(inv,mesh.matrixWorld);
    out.fill(0);let lift=-Infinity;
    for(let k=0;k<mesh.geometry.attributes.position.count;k+=4){
      mesh.getVertexPosition(k,v).applyMatrix4(matrix);
      const dz=(v.z-mat.pillowZ)/.133;
      const cushion=Math.abs(v.x-mat.x)<mat.pillowWidth/2 && Math.abs(dz)<1?
        .266+.129*Math.sqrt(1-dz*dz):.132;
      lift=Math.max(lift,cushion-v.y);
      if(mesh===rice.body && marks.mitt[k])continue;
      // Splat at the skin's fractional position. A rounded cell footprint
      // made the hem jump one whole weave spacing as the belly breathed.
      const u=gridX(v.x),w=gridZ(v.z),ix=Math.floor(u),iz=Math.floor(w);
      for(let j=Math.max(0,iz-1);j<=Math.min(NZ-1,iz+2);j++){
        const y=v.y-.079*Math.max(0,Math.abs(j-w)-1);
        for(let i=Math.max(0,ix-1);i<=Math.min(NX-1,ix+2);i++){
          const n=i+j*NX;
          out[n]=Math.max(out[n],y-.092*Math.max(0,Math.abs(i-u)-1));
        }
      }
    }
    return lift;
  }
  function moveLocal(mesh,dx,dy,dz){
    old.set(0,0,0);root.localToWorld(old);mesh.parent.worldToLocal(old);
    v.set(dx,dy,dz);root.localToWorld(v);mesh.parent.worldToLocal(v);
    mesh.position.add(v.sub(old));mesh.updateMatrixWorld(true);
  }
  function skinPoint(index,out){
    rice.body.getVertexPosition(index,out);
    return out.applyMatrix4(rice.body.matrixWorld).applyMatrix4(inv);
  }
  function update(f,dt){
    const q=f.recline,load=smoothstep(q,.08,.99),breath=Math.sin(f.time*2.14);
    const length=mat.foot-mat.head;
    // The normal body is 1.64 m heel to crown; the Float shape adds 2.18 m
    // at full extension. A large traveller needs less draw on the same cot.
    const draw=stack?.24:clamp((length-.085-1.64*large)/(2.18*large),.025,.34);
    bath.melt=draw*load;bath.recline=(stack?.34:.85)*q;bath.settle=q;
    skin.gestureSample.time=f.time;skin.gestureSample.weight=q;skin.speed=f.speed;
    rice.smile=0;
    const response=poseRice(rice,skin,f.time,dt,(f.doze>.1||f.yawn>.2)?'sleepy':'calm',bath,false);
    if(f.doze>.5)rice.uniforms.riceCell.value=9;
    else if(f.yawn>.35)rice.uniforms.riceCell.value=4;
    const strain=response.stretch*(1+.100*f.stretch-.105*f.sit-.19*(f.duck??0));
    const shoulder=1/Math.sqrt(strain);
    // The authored Float adds belly length at almost fixed shoulder width.
    // Express its extra volume as back-to-mat compression. Do not scale
    // the traveller down to fit or remove the full-size buff in bed.
    const floatVolume=1+.671*bath.melt-.178*bath.melt*bath.melt;
    const side=lerp(1,large>1?1.025:.99,load)*(1+.038*f.settle);
    const bodyLength=stack?response.floatLength*large:large*(1.6426+2.1806*bath.melt);
    const fit=stack?1:Math.min(1,(length-.03)/bodyLength);
    // The large sleeper folds the heels in beside the doorway. The
    // same rice spreads through the thickness instead of losing volume.
    const long=lerp(1,fit,load)*(1-(broadInHut?.038:0)*load);
    // The back meets the pillow, spreads and gives one diminishing rebound.
    // Pressure and breathing let the shoulders spread while the crown stays on its roll.
    const breathing=1+.013*f.doze*breath-.010*f.settle;
    pose.scale.set(large*shoulder*side,large*strain*long/breathing,
      large*shoulder*breathing/(side*long*floatVolume));
    pose.rotation.set(response.pitch*(1-q)+.23*f.sit*(1-q)-1.49*q-.043*f.yawn,0,
      response.lean*(1-q)+.079*Math.sin(Math.PI*q)+.015*q*breath);
    // Turn around the weight in the centre instead of the traveller's feet.
    h.root.rotation.y=f.heading;h.root.position.fromArray(f.position);
    h.root.position.x=lerp(h.root.position.x,mat.x-(broadInHut?.278:large>1?.125:.045),q);
    h.root.position.z=lerp(h.root.position.z,mat.head+.036+bodyLength*long*strain/breathing-heelInset,q);
    if(broadInHut){
      // Roll the heavy shoulder around the inside corner of the chest,
      // then bring the heels back in before settling against the pillow.
      h.root.position.x-=.042*Math.sin(Math.PI*q);
      h.root.position.z+=.046*load+.16*smoothstep(q,.32,.72)*(1-smoothstep(q,.83,1));
    }
    pose.position.set(0,response.bob,0);
    rice.chest.rotateX(.15*f.sit-.11*f.yawn);rice.head.rotateX(-.15*f.yawn+.10*q);
    for(const [i,hand] of rice.hands.entries()){
      const sign=i?1:-1;
      hand.position.x-=sign*.15*(q+f.yawn);
      hand.position.y+=.14*f.stretch+(i?.24:.11)*f.yawn;
      hand.rotateZ(sign*(.21*f.stretch+.14*f.yawn));
    }
    if(stack){
      if(!parked){
        parked=rice.kagami.ornaments;
        putDown(parked);
      }
      // Float untelescopes the small crown. Each cake keeps its own
      // volume, including the lower tier which has no Float shape key.
      const area=rice.model.scale.x*rice.model.scale.y;
      upperRestArea??=area;rice.model.scale.z*=upperRestArea/area;
      rice.kagami.lower.scale.y=floatVolume;
      const fruit=rice.kagami.citrus;
      fruit.rotation.x=-pose.rotation.x*q;
      fruit.scale.set(.91*large/pose.scale.x,.91*large/pose.scale.y,.91*large/pose.scale.z);
    }
    if(h.wrap.visible && !wrapParent){
      wrapParent=h.wrap.parent;putDown(h.wrap);
      h.wrap.scale.set(large,.38*large,large);
      h.wrap.position.y-=.09*large;
    }
    if(h.leaves.visible){
      rice.body.getVertexPosition(h.crown,h.leaves.position);
      h.rolling.worldToLocal(rice.body.localToWorld(h.leaves.position));
    }
    profile.height=undefined;profile.grips=undefined;profile.edge=mat.foot-.42;
    if(q<=0 && f.grip<=0 && f.sit<=0)return profile;
    root.updateMatrixWorld(true);inv.copy(root.matrixWorld).invert();
    const contactWeight=stack?load:Math.max(q,f.grip,f.sit);
    const lift=scan(rice.body,field)*contactWeight;
    pose.position.y+=lift;root.updateMatrixWorld(true);
    let seat=0;
    if(stack){
      // Set the lower cake down like a soft cushion. Rotating both tiers
      // rigidly about their feet would stand the wide cake on its edge.
      const lower=rice.kagami.lower;
      lower.position.set(0,0,0);lower.rotation.x=-pose.rotation.x*.90*q;
      lower.updateMatrixWorld(true);
      lower.localToWorld(target.set(0,.26,0)).applyMatrix4(inv);
      const lowerZ=mat.foot-.80*large-heelInset;
      moveLocal(lower,0,0,(lowerZ-target.z)*q);
      seat=scan(lower,tier)*Math.max(q,f.grip,f.sit);
      moveLocal(lower,0,seat,0);
    }
    // A woven sheet bridges the negative spaces between toes. Only a laid
    // back body goes UNDER the cover: bent over to pick it up, it stays above.
    const underneath=smoothstep(q,.16,.88);
    for(let i=0;i<field.length;i++){
      const top=Math.max(field[i]+lift,stack?tier[i]+seat:0);
      field[i]=.135+underneath*Math.max(0,top+.018-.135);
    }
    for(let i=1;i<field.length;i++){
      if(i%NX)field[i]=Math.max(field[i],field[i-1]-.092);
      if(i>=NX)field[i]=Math.max(field[i],field[i-NX]-.079);
    }
    for(let i=field.length-2;i>=0;i--){
      if(i%NX<NX-1)field[i]=Math.max(field[i],field[i+1]-.092);
      if(i<field.length-NX)field[i]=Math.max(field[i],field[i+NX]-.079);
    }
    if(stack && q>0){
      // The daidai rolls into the hollow between the crown and the pillow.
      // When the mochi sits up the peel retraces the same short arc.
      const fruit=rice.kagami.citrus;
      fruit.getWorldPosition(target).applyMatrix4(inv);
      const x=mat.x-.30*large,z=mat.head+.30*large;
      const onPillow=Math.max(.34,height(x,z))+.125*large;
      moveLocal(fruit,(x-target.x)*load,(onPillow-target.y)*load,(z-target.z)*load);
    }
    const face=skinPoint(marks.chin,v);
    const edge=coverEdge(mat,f.cover,clamp(face.z+.43*large,mat.head+.47,mat.foot-.31));
    if(f.grip>.001)for(let i=0;i<2;i++){
      const sign=i?1:-1,hand=rice.hands[i],mid=skinPoint(marks.palms[i],grips[i]);
      const x=mat.x+sign*.59*(mat.width*.5-.028+f.cover*.086),z=edge;
      const y=Math.max(.21,height(x,z)+.036)+.11*Math.sin(Math.PI*f.cover);
      target.set(x,y,z).lerp(mid,1-f.grip);
      // Aim the skin pad and keep the curve beside the belly. The two
      // cloth pinches below then follow the actual achieved contact.
      for(let pass=0;pass<2;pass++){
        old.copy(mid);root.localToWorld(old);hand.parent.worldToLocal(old);
        v.copy(target);root.localToWorld(v);hand.parent.worldToLocal(v);
        hand.position.add(v.sub(old).clampLength(0,.48));
        h.root.updateMatrixWorld(true);skinPoint(marks.palms[i],mid);
      }
      // A full lower cake can still support the wrist as the edge returns
      // to the foot. Keep the real contact above that moving shoulder.
      const support=height(mid.x,mid.z)+.018;
      if(mid.y<support){
        moveLocal(hand,0,(support-mid.y)*f.grip,0);
        skinPoint(marks.palms[i],mid);
      }
      mid.weight=f.grip;
    }
    profile.edge=edge;profile.height=height;profile.grips=f.grip>.001?grips:undefined;
    return profile;
  }
  function framing(){
    root.updateMatrixWorld(true);inv.copy(root.matrixWorld).invert();
    const face=[...marks.eyes,marks.chin].map(i=>skinPoint(i,new T.Vector3()));
    const outline=new T.Box3(),silhouette=[];
    const surfaces=stack?[rice.body,rice.kagami.lower,rice.kagami.citrus]:[rice.body];
    for(const mesh of surfaces){
      matrix.multiplyMatrices(inv,mesh.matrixWorld);
      if(!mesh.geometry){outline.expandByPoint(v.setFromMatrixPosition(matrix));continue;}
      for(let k=0;k<mesh.geometry.attributes.position.count;k+=8){
        mesh.getVertexPosition(k,v).applyMatrix4(matrix);outline.expandByPoint(v);
        if(k%32===0)silhouette.push(v.clone());
      }
    }
    return {face,outline,silhouette,obstacles:stack?[rice.kagami.lower,rice.kagami.citrus]:[]};
  }
  return {update,framing,dispose(){
    if(parked){rice.kagami.lower.position.set(0,0,0);rice.kagami.lower.rotation.set(0,0,0);rice.kagami.lower.scale.y=1;rice.kagami.citrus.rotation.x=0;rice.kagami.stack.add(parked);parked.position.set(0,0,0);parked.rotation.set(0,0,0);parked.scale.setScalar(1);}
    if(wrapParent){wrapParent.add(h.wrap);h.wrap.position.set(0,0,0);h.wrap.rotation.set(0,0,0);h.wrap.scale.setScalar(1);}
    h.root.removeFromParent();restingActor=h;
  }};
}
