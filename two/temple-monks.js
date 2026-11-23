import * as T from './vendor/three.module.min.js';
import { connectSceneHands } from './story-hands.js';
import { batchActorParts } from './actors.js';
import { townPortrait, paintedSilk } from './emaki-costume.js';
import { monasticHabit, townHand } from './heian-dress.js';
import { dressedRiceFace } from './mochi-model.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { KIYOMIZU } from './kiyomizu-layout.js';
import { TEMPLE_MONKS, templeMonkPose } from './temple-duties.js';
import { wrapDelta } from './terrain.js';

const tau=2*Math.PI, up=new T.Vector3(0,1,0);
const lower=new T.Vector3(), upper=new T.Vector3(), along=new T.Vector3(), grip=new T.Vector3();

function strawBroom(b){
  b.rod([0,.22,0],[0,1,0],.018,'#877046',.014);
  for(let j=0;j<31;j++){
    const spread=(j-15)/15, x=.175*spread, z=.026*Math.sin(j*2.4);
    b.stroke([[spread*.021,.32,z*.3],[x*.32,.19,z*.65],[x*.76,.061,z],[x,.009+.015*spread*spread,z+.016]],
      .0085,['#a99569','#baa87d','#8f7e56'][j%3],5);
  }
  for(const y of [.23,.26,.28])b.rod([0,y,0],[0,y+.012,0],.036,'#634f37');
}

function rosary(b){
  for(let j=0;j<28;j++){
    const t=j*tau/28;
    b.ball(.123*Math.sin(t),-.115+.115*Math.cos(t),.016*Math.sin(2*t),
      .016,.016,.016,j%7?'#74583c':'#a88c59');
  }
  b.ball(0,-.235,0,.022,.024,.022,'#594532');
  for(const s of [-1,1])b.rod([s*.004,-.247,0],[s*.019,-.324,.004],.005,'#a15341',.011);
}

function bellCord(){
  const sides=6, spans=6, geo=new T.BufferGeometry(), indices=[];
  const pos=new T.Float32BufferAttribute(new Float32Array((spans+1)*sides*3),3);
  const norm=pos.clone();
  pos.setUsage(T.DynamicDrawUsage);norm.setUsage(T.DynamicDrawUsage);
  geo.setAttribute('position',pos);geo.setAttribute('normal',norm);
  for(let i=0;i<spans;i++)for(let j=0;j<sides;j++){
    const a=i*sides+j,b=i*sides+(j+1)%sides;
    indices.push(a,b,a+sides,b,b+sides,a+sides);
  }
  geo.setIndex(indices);
  const mesh=new T.Mesh(geo,new T.MeshLambertMaterial({color:'#a18b62',side:T.DoubleSide}));
  mesh.frustumCulled=false;
  const tangent=new T.Vector3(),cross=new T.Vector3(),vertical=new T.Vector3(),n=new T.Vector3();
  function stretch(from,to,slack){
    for(let i=0;i<=spans;i++){
      const t=i/spans,sag=slack*4*t*(1-t);
      tangent.subVectors(to,from);tangent.y-=slack*4*(1-2*t);tangent.normalize();
      cross.crossVectors(tangent,up).normalize();vertical.crossVectors(tangent,cross);
      for(let j=0;j<sides;j++){
        const a=j*tau/sides;
        n.copy(cross).multiplyScalar(Math.cos(a)).addScaledVector(vertical,Math.sin(a));
        const k=i*sides+j;norm.setXYZ(k,n.x,n.y,n.z);
        pos.setXYZ(k,from.x+(to.x-from.x)*t+.015*n.x,from.y+(to.y-from.y)*t-sag+.015*n.y,from.z+(to.z-from.z)*t+.015*n.z);
      }
    }
    pos.needsUpdate=norm.needsUpdate=true;
  }
  return {mesh,stretch};
}

function sutraBook(){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
  const g=canvas.getContext('2d');
  g.fillStyle='#dfcfa8';g.fillRect(0,0,768,256);
  g.font='24px "Yu Mincho", "Hiragino Mincho ProN", serif';g.textAlign='center';
  const lines=['摩訶般若波羅蜜多心経','観自在菩薩','行深般若波羅蜜多時','照見五蘊皆空','度一切苦厄','舎利子'];
  for(let j=0;j<18;j++){
    const line=lines[j%6],x=738-j*42;
    g.fillStyle=j===0?'#914d39':'#564b3b';
    Array.from(line).forEach((c,i)=>g.fillText(c,x,33+i*22));
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const p=[],uv=[],indices=[];
  for(let j=0;j<=6;j++){
    const x=(j/6-.5)*.47,fold=.023*(j%2);
    p.push(x,-.068,fold,x,.087,.087+fold);uv.push(1-j/6,0,1-j/6,1);
    if(j<6){const k=2*j;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const geo=new T.BufferGeometry();geo.setIndex(indices);
  geo.setAttribute('position',new T.Float32BufferAttribute(p,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  // Ink faces the reader. The reverse is undyed paper between two indigo
  // backing boards, visible from the nave when the book is held open.
  geo.addGroup(0,36,0);geo.addGroup(0,6,1);geo.addGroup(6,24,2);geo.addGroup(30,6,1);
  return new T.Mesh(geo,[
    new T.MeshLambertMaterial({map}),
    new T.MeshLambertMaterial({color:'#4e6669',side:T.BackSide}),
    new T.MeshLambertMaterial({color:'#e3d5b0',side:T.BackSide}),
  ]);
}

function paintedPart(parent,build){
  const mesh=batchActorParts(parent,build);
  mesh.material=scrollPigment();
  return mesh;
}

function makeMonk(monk,parent,habit,sandal){
  const root=new T.Group(), torso=new T.Group(), neck=new T.Group();
  root.name=monk.name;root.scale.setScalar(monk.size);parent.add(root);
  root.add(torso);torso.add(neck);
  const robe=new T.Mesh(habit.body,paintedSilk());
  robe.castShadow=robe.receiveShadow=true;torso.add(robe);
  const face=dressedRiceFace(monk.face,0,townPortrait(monk.face));
  neck.position.y=1.13;face.position.set(0,.768-1.13,-.011);face.scale.set(.423,.352,.347);neck.add(face);
  const feet=[],arms=[];
  for(const [i,s] of [-1,1].entries()){
    const foot=sandal.clone();root.add(foot);feet.push(foot);
    const joint=new T.Group(),shoulder=new T.Vector3(s*.265,.861,-.03);
    joint.position.copy(shoulder);torso.add(joint);
    const sleeve=new T.Mesh(habit.sleeves[i],paintedSilk());
    sleeve.castShadow=sleeve.receiveShadow=true;joint.add(sleeve);
    const hand=paintedPart(joint,b=>townHand(b,0,s));
    sleeve.position.copy(shoulder).negate();hand.position.copy(sleeve.position);
    const reach=new T.Vector3(s*.50,.735,s>0?.393:.283).sub(shoulder);
    const length=reach.length(),axis=reach.normalize();
    // Stretch only along the sleeve. Its cuff keeps the same width while
    // the hands change their grip on the broom or prayer beads.
    const basis=new T.Quaternion().setFromUnitVectors(up,axis);
    const frame=new T.Matrix4().makeRotationFromQuaternion(basis);
    const palm=new T.Group();palm.position.copy(axis).multiplyScalar(length);joint.add(palm);
    arms.push({joint,length,bind:axis,frame,inverse:frame.clone().transpose(),palm});
    joint.matrixAutoUpdate=false;
  }
  let prop,cord;
  if(monk.duty==='sweep')prop=paintedPart(torso,strawBroom);
  if(monk.duty==='beads')prop=paintedPart(torso,rosary);
  if(monk.duty==='sutra'){prop=sutraBook();torso.add(prop);}
  if(monk.duty==='bell'){cord=bellCord();root.add(cord.mesh);}
  const actor={monk,root,torso,neck,arms,feet,prop,cord,at:{},targets:{}};
  if(monk.duty==='bell')connectSceneHands(root,{
    right:{grip:arms[1].palm,tool:cord.mesh},left:{grip:arms[0].palm},
    pose(targets){actor.targets=targets;}
  });
  return actor;
}

const stretch=new T.Matrix4();
function guideHand(arm,target){
  const {joint,bind,length,frame,inverse}=arm;
  along.subVectors(target,joint.position);
  stretch.makeScale(1,along.length()/length,1);
  joint.quaternion.setFromUnitVectors(bind,along.normalize());
  joint.matrix.makeRotationFromQuaternion(joint.quaternion).multiply(frame).multiply(stretch).multiply(inverse);
  joint.matrix.setPosition(joint.position);joint.matrixWorldNeedsUpdate=true;
}

function poseHands(actor,time,pull,anchor){
  const {monk,arms,prop,cord,at}=actor;
  switch(monk.duty){
    case 'sweep': {
      const arc=Math.sin(time*2.25);
      lower.set(.34+.40*arc,.017+.045*Math.max(0,Math.cos(time*2.25)),.65+.085*arc*arc);
      upper.set(-.11-.13*arc,1.16,.479);
      prop.position.copy(lower);
      along.subVectors(upper,lower);prop.scale.y=along.length();
      prop.quaternion.setFromUnitVectors(up,along.normalize());
      guideHand(arms[0],grip.lerpVectors(lower,upper,.76));
      guideHand(arms[1],grip.lerpVectors(lower,upper,.56));
      break;
    }
    case 'sutra': {
      const lift=.83+.014*Math.sin(time*.83);
      prop.position.set(0,lift,.46);
      guideHand(arms[0],grip.set(-.224,lift-.035,.47));
      guideHand(arms[1],grip.set(.224,lift-.035,.47));
      break;
    }
    case 'beads': {
      const rub=.011*Math.sin(time*2.4);
      prop.position.set(.013,.83+rub,.43);
      guideHand(arms[0],grip.set(-.066,.81+rub,.43));
      guideHand(arms[1],grip.set(.082,.82-rub,.43));
      break;
    }
    case 'bell':
      guideHand(arms[0],lower.set(0,.82-.09*pull,.42-.09*pull));
      guideHand(arms[1],upper.set(.012,.88-.09*pull,.46-.09*pull));
      cord.mesh.visible=!!anchor;
      if(anchor){
        // The keeper faces north. Convert the moving rope eye to his frame
        // so the line stays threaded through his hands as the log returns.
        grip.set(-wrapDelta(anchor.x-at.x),(anchor.y-at.y),-wrapDelta(anchor.z-at.z)).divideScalar(monk.size);
        cord.stretch(lower,grip,.043*(1-pull));
      }
      break;
  }
}

export function createTempleMonks(scene){
  const precinct=new T.Group();precinct.name='清水寺の勤行';scene.add(precinct);
  let actors;
  return (time,player,pull=0,anchor)=>{
    const dx=wrapDelta(KIYOMIZU.x-player.x),dz=wrapDelta(KIYOMIZU.z-player.z);
    precinct.visible=dx*dx+dz*dz<112**2;
    if(!precinct.visible)return;
    if(!actors){
      const habit=monasticHabit(),sandal=paintedPart(new T.Group(),b=>{
        b.ball(0,.037,.015,.088,.033,.139,'#ae986c');
        b.ball(0,.084,0,.067,.042,.101,'#ddd5be');
        b.stroke([[-.065,.087,-.036],[0,.122,.06],[.062,.086,-.039]],.01,'#73654b');
      });
      actors=TEMPLE_MONKS.map(m=>makeMonk(m,precinct,habit,sandal));
    }
    precinct.position.set(player.x+dx-KIYOMIZU.x,0,player.z+dz-KIYOMIZU.z);
    for(const a of actors){
      const {monk,root,torso,neck,feet,arms}=a;
      const at=templeMonkPose(monk,time,a.at);
      root.position.set(at.x,at.y,at.z);root.rotation.y=at.yaw;
      for(const [i,side] of [-1,1].entries()){
        const step=side*at.stride;
        feet[i].position.set(side*.168,Math.max(0,step)*.045,step*.145);
      }
      torso.position.y=Math.abs(at.stride)*.027;
      const sweep=monk.duty==='sweep',bell=monk.duty==='bell',sutra=monk.duty==='sutra';
      torso.rotation.y=sweep?.105*Math.sin(2.25*time):0;
      neck.rotation.x=sweep?.14+.046*Math.cos(time*2.25):bell?.035-.17*pull:sutra?.16+.055*Math.cos(.8*time):.06;
      neck.rotation.y=sweep?.12*Math.sin(time*2.25):sutra?.10*Math.sin(time*.53):.07*Math.sin(time*.64);
      poseHands(a,time,pull,anchor);
      for (const [side,target] of Object.entries(a.targets)){
        if(!target)continue;
        const arm=arms[side==='right'?1:0];
        const local=torso.worldToLocal(grip.copy(target));
        local.sub(arm.joint.position).clampLength(.08,arm.length*1.08).add(arm.joint.position);
        guideHand(arm,local);
      }
    }
  };
}
