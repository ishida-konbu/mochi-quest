import {Float32BufferAttribute,MathUtils,Matrix4,Quaternion,Vector3} from './vendor/three.module.min.js';

const {clamp}=MathUtils;
export const workShapes=['workDraw','workSettle','workForward'];
export const footfallShapes=['Right','Left'].map(side=>['X','Y','Z'].map(axis=>'step'+side+axis));

// Move whole transverse sections together. A change confined to the short
// band below the hands leaves a ledge under the cheeks and a ridge on the
// back. Blend from the planted heel up to the eye line on both flanks.
export function addWorkingShapes(g,skeleton,mitt){
  const {position,normal,skinIndex,skinWeight}=g.attributes;
  const upper=skeleton.bones.map(b=>!['Root','Foot_R','Foot_L'].includes(b.name));
  const heel=.035;
  for(const key of workShapes){
    const forward=key==='workForward',draw=key==='workDraw';
    const shoulder=forward?1.30:draw?1.48:1.32;
    // The crown rises slightly less than the hand sockets at full extension.
    const travel=draw?.92:1;
    const displacement=new Float32Array(position.count*3),normals=new Float32Array(displacement.length);
    for(let i=0;i<position.count;i++){
      if(mitt.has(i))continue;
      const y=position.getY(i),u=clamp((y-heel)/(shoulder-heel),0,1);
      const offset=forward?u*u*(3-2*u):travel*u*(2-u);
      const slope=y>heel && y<shoulder?(forward?6*u*(1-u):2*travel*(1-u))/(shoulder-heel):0;
      // Cofactor of the section transform, for the same smooth painted
      // normal on the belly, both cheeks and the old shoulder patches.
      if(forward)normals[3*i+1]=-normal.getZ(i)*slope;
      else{
        normals[3*i]=normal.getX(i)*slope;
        normals[3*i+2]=normal.getZ(i)*slope;
      }
      let carried=0;
      for(let k=0;k<4;k++)if(upper[skinIndex.getComponent(i,k)])carried+=skinWeight.getComponent(i,k);
      displacement[3*i+(forward?2:1)]=offset-carried;
    }
    const shape=new Float32BufferAttribute(displacement,3);shape.name=key;
    g.morphAttributes.position.push(shape);g.morphAttributes.normal.push(new Float32BufferAttribute(normals,3));
  }
  // A planted foot draws its side of the soft lower belly with it. The
  // travelling costume's short toe bones crease if pulled a full stride.
  for(const [side,axes] of footfallShapes.entries())for(const [axis,name] of axes.entries()){
    const move=new Float32Array(position.count*3),shade=new Float32Array(move.length);
    // Lateral weight transfer ends below the waist. Forward travel and
    // lift spread farther up the flank without squeezing that section.
    const height=axis===0?.39:.65;
    for(let i=0;i<position.count;i++){
      if(mitt.has(i))continue;
      const u=clamp((position.getX(i)+.27)/.54,0,1),v=clamp((position.getY(i)-.055)/height,0,1);
      const across=u*u*(3-2*u),low=1-v*v*(3-2*v);
      const half=side?across:1-across;
      move[3*i+axis]=low*half;
      const gx=(side?1:-1)*low*6*u*(1-u)/.54,gy=-half*6*v*(1-v)/height;
      const n=normal.getComponent(i,axis),d=axis===0?gx:axis===1?gy:0;
      shade[3*i]=d*normal.getX(i)-n*gx;
      shade[3*i+1]=d*normal.getY(i)-n*gy;
      shade[3*i+2]=d*normal.getZ(i);
    }
    const shape=new Float32BufferAttribute(move,3);shape.name=name;
    g.morphAttributes.position.push(shape);g.morphAttributes.normal.push(new Float32BufferAttribute(shade,3));
  }
}

export function leanToWork(hero,frame,pads,rests,size){
  const {pose,rice}=hero;
  const home=hero.workingHome??=new Vector3(),goal=hero.workingGoal??=new Vector3();
  const undo=hero.workingRotation??=new Quaternion();
  home.set(0,0,0);goal.set(0,0,0);
  let weight=0,roll=0;
  for(let i=0;i<2;i++){
    const w=frame.handWork?.[i]??1,r=rests[i],p=pads[i];
    home.addScaledVector(r,w);goal.addScaledVector(p,w);weight+=w;
    roll+=(i?1:-1)*w*(p.y-r.y);
  }
  const stacked=Boolean(rice.kagami?.stack.visible);
  // Both the support point and the averaged mark have the same origin,
  // even as a hand is just beginning to touch the work.
  if(weight>0){home.divideScalar(weight);goal.divideScalar(weight);}
  const engage=Math.min(1,weight),tier=rice.model.scale;
  // A broad, flattened cake shifts its weight mostly in the dough itself.
  // Tip its seated upper layer in proportion to its height over its base.
  const balance=stacked && frame.worktops?tier.y/tier.z:1;
  const tilt=balance*clamp(roll/(size*Math.max(1,weight))*.99,-.195,.195);
  const pitch=engage*balance*clamp(((goal.z-home.z)*.19-(goal.y-home.y)*.13)/size,-.065,.12);
  const pivot=stacked?.35:.09;
  // The small upper cake can shift its seat across the broad, planted lower
  // cake. Share a long kitchen reach between that shift and the upper flank.
  const seatedReach=stacked && frame.worktops ?
    clamp((goal.z-home.z-.40*size)*.34,0,.17*size)*engage : 0;
  pose.position.set(0,pivot*size*(1-Math.cos(pitch))+.39*size*(Math.hypot(Math.sin(tilt),.014)-.014),seatedReach-pivot*size*Math.sin(pitch));
  pose.rotation.set(pitch,0,tilt);
  pose.updateMatrix();
  goal.sub(pose.position).applyQuaternion(undo.copy(pose.quaternion).invert()).sub(home).multiplyScalar(engage);
  if(frame.worktops){
    // For a one-handed reach the leading shoulder can roll forward on the
    // flank while the chest stays back from the rim of the work surface.
    const single=Math.abs(frame.handWork[0]-frame.handWork[1]);
    const height=pose.scale.y*tier.y;
    const lift=goal.y-clamp(goal.y,-.24*height,.78*height);
    const socketRange=.12*size;
    const available=stacked?clamp(.17*size*tier.x/.708-Math.hypot(goal.x,lift),0,socketRange):socketRange;
    const shoulder=single*clamp(goal.z/(.30*size),0,1)*available;
    goal.z-=shoulder;
    goal.y+=.4*shoulder;
  }
  const draw=clamp(goal.y/(pose.scale.y*tier.y),-.24,.78);
  const forward=clamp(goal.z/(pose.scale.z*tier.z),-.40,stacked && frame.worktops?1.65:1.15);
  rice.body.morphTargetInfluences[rice.body.morphTargetDictionary[draw>=0?'workDraw':'workSettle']]=draw;
  rice.body.morphTargetInfluences[rice.body.morphTargetDictionary.workForward]=forward;
  hero.workingBody.position.y+=draw;hero.workingBody.position.z+=forward;
  for(const wing of hero.wingParts){wing.position.y=.66+draw*tier.y;wing.position.z=-.01+forward*tier.z;}

  if(stacked){
    const flat=hero.plantedTier??=new Matrix4();
    flat.copy(pose.matrix).invert().scale(pose.scale);
    for(const part of [rice.kagami.lower,rice.kagami.ornaments]){
      part.matrixAutoUpdate=false;part.updateMatrix();part.matrix.premultiply(flat);
    }
  }
}
