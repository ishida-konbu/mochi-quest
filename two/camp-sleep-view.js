// The open hut and the landscape stay on screen throughout the night. Only
// the presentation clock runs ahead; the journey commits once on waking.
import * as T from './vendor/three.module.min.js';
import {makeHero} from './actors.js';
import {poseRice} from './mochi-model.js';
import {campCover,drapeCover} from './camp-cover.js';
import {bedPoint,sleepApproach,sleepMotion} from './camp-sleep-motion.js';
import {visibleWorkArea} from './build-craft-scene.js';
import {worldClockLabel} from './world-clock.js';

let restingActor;
const lerp=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const clockFormat=n=>worldClockLabel(Math.floor(n));
function sleeper(root,player){
  const h=restingActor??makeHero();restingActor=null;
  const {rice,pose}=h;root.add(h.root);
  h.wrap.visible=player.buffs?.wrap>0;
  h.leaves.visible=player.mode==='kusa';
  h.wingParts.forEach(w=>w.visible=player.mode==='habutae');
  const v=new T.Vector3(),matrix=new T.Matrix4();
  const skin={...player,grounded:true,activity:null,gestureSample:{time:0,weight:1}};
  const large=player.buffs?.full>0?1.28:1;
  const nx=32,nz=48,field=new Float32Array(nx*nz);
  const pillowPose={recline:0,melt:0,settle:0};
  // Every longitudinal slice contributes actual skinned points. The
  // raised hem follows knees and belly even on the two-tier kagami model.
  const gx=x=>(x+.70)/1.4*(nx-1),gz=z=>(z+1.02)/2.06*(nz-1);
  function height(x,z){
    const u=gx(x),w=gz(z),i=Math.floor(u),j=Math.floor(w);
    if(i<0 || i>=nx-1 || j<0 || j>=nz-1)return 0;
    const a=i+j*nx,du=u-i,dv=w-j;
    return lerp(lerp(field[a],field[a+1],du),lerp(field[a+nx],field[a+nx+1],du),dv);
  }
  function update(f,dt){
    const q=f.recline,breath=Math.sin(f.time*2.30);
    skin.gestureSample.time=f.time;skin.speed=f.speed;
    rice.smile=0;
    // The standing Drowsy clip bows the chin down to the belly. Keep its
    // eyelids while reclined and let the pillow carry the head in bind pose.
    skin.gestureSample.weight=q;
    poseRice(rice,skin,f.time,dt,(f.doze>.1||f.yawn>.2)?'sleepy':'calm',pillowPose,false);
    // Fold the traveller's decorations towards the foot as the bed is made.
    // Long willow stems otherwise protrude through the covers and the hut.
    if(rice.kagami?.stack.visible){
      const ornaments=rice.kagami.ornaments;
      ornaments.scale.setScalar(1-.90*q);
      ornaments.position.set(.34*q,.03*q,-.11*q);
    }
    if(h.wrap.visible){
      h.wrap.scale.setScalar(1-.60*q);h.wrap.position.y=-.12*q;
    }
    if(f.doze>.5)rice.uniforms.riceCell.value=5;
    else if(f.yawn>.4)rice.uniforms.riceCell.value=4;
    h.root.position.fromArray(f.position);h.root.rotation.y=f.heading;
    h.root.position.z+=.49*q;
    const sizeX=lerp(large,player.mode==='kagami'?.52:.56,q);
    const sizeY=lerp(large,player.mode==='kagami'?1.24:.94,q);
    const sizeZ=lerp(large,.33,q);
    if(rice.kagami?.stack.visible){
      // The dough stretches flat, while the daidai on the pillow stays round.
      rice.kagami.citrus.scale.set(.91*lerp(1,.60/sizeX,q),.91*lerp(1,.60/sizeY,q),.91*lerp(1,.60/sizeZ,q));
    }
    pose.scale.set(sizeX*(1-.06*f.stretch),sizeY*(1+.14*f.stretch),sizeZ*(1+.027*f.doze*breath));
    pose.rotation.set(-1.51*q-.06*f.yawn,0,.025*Math.sin(1.2*f.time)*q);
    pose.position.set(0,.31*q,0);
    rice.chest.rotateX(-.13*f.yawn);
    rice.head.rotateX(-.15*f.yawn+.17*q);
    for(const [i,hand] of rice.hands.entries()){
      const side=i?1:-1;
      hand.position.x-=side*.18*q;
      hand.position.y+=.15*f.stretch+(i?.29:.15)*f.yawn+.21*f.pull;
      hand.position.z+=.21*f.pull+.12*q;
      hand.rotateX(-.30*f.yawn-.27*f.pull);hand.rotateZ(side*.32*f.stretch);
    }
    if(h.leaves.visible){
      rice.body.getVertexPosition(h.crown,h.leaves.position);
      h.rolling.worldToLocal(rice.body.localToWorld(h.leaves.position));
    }
    if(q>.005){
      root.updateWorldMatrix(true,false);root.updateMatrixWorld(true);
      let lift=-Infinity;
      field.fill(0);
      const meshes=[rice.body];
      if(rice.kagami?.stack.visible)meshes.push(rice.kagami.lower);
      if(h.wrap.visible)meshes.push(h.wrap);
      for(const mesh of meshes){
        matrix.copy(root.matrixWorld).invert().multiply(mesh.matrixWorld);
        for(let i=0;i<mesh.geometry.attributes.position.count;i+=5){
          mesh.getVertexPosition(i,v).applyMatrix4(matrix);
          // Rolled pillow and rush mat support the back; measure the lowest
          // vertices rather than assuming all playable skins have one radius.
          const pillow=Math.abs(v.x)<.45 && Math.abs(v.z+.54)<.13?
            .266+.12*Math.sqrt(Math.max(0,1-((v.z+.54)/.13)**2)):0;
          lift=Math.max(lift,Math.max(.132,pillow)-v.y);
          const ix=Math.round(gx(v.x)),iz=Math.round(gz(v.z));
          for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
            const u=ix+dx,w=iz+dz;
            if(u>=0&&u<nx&&w>=0&&w<nz){const k=u+w*nx;field[k]=Math.max(field[k],v.y);}
          }
        }
      }
      const offset=(Number.isFinite(lift)?lift:0)*q;
      pose.position.y+=offset;
      for(let i=0;i<field.length;i++)if(field[i])field[i]+=.023+offset;
      // Cotton and bundled straw bridge the small gaps between limbs.
      // Limit the gradient of the hanging sheet in both weave directions.
      for(let k=1;k<field.length;k++){
        if(k%nx)field[k]=Math.max(field[k],field[k-1]-.070);
        if(k>=nx)field[k]=Math.max(field[k],field[k-nx]-.061);
      }
      for(let k=field.length-2;k>=0;k--){
        if(k%nx<nx-1)field[k]=Math.max(field[k],field[k+1]-.070);
        if(k<field.length-nx)field[k]=Math.max(field[k],field[k+nx]-.061);
      }
      return height;
    }
    return undefined;
  }
  return {update,dispose(){h.root.removeFromParent();restingActor=h;}};
}
function bedLens(scene,root,bed,camera){
  const target=new T.Vector3(bed.x,bed.y+.67,bed.z);
  const narrow=camera.aspect<.8,dist=narrow?3.55:2.95;
  const ray=visibleWorkArea(scene,root,bed,undefined,dist+2.5);
  let best=-Infinity,where;
  for(const [dx,dz,up] of [[.98,.21,.76],[-.98,.21,.76],[.68,.73,.84],[-.68,.73,.84],[.94,-.33,.61],[-.94,-.33,.61],[0,1,.48],[0,1,1.3]]){
    const at=bedPoint(bed,dx*dist,dz*dist),eye=new T.Vector3(at.x,bed.y+.55+dist*up,at.z);
    const score=[[-.03,.65,-.37],[0,.85,.15],[.2,.47,.65],[0,1.2,.2]].reduce((n,[x,y,z])=>{
      const w=bedPoint(bed,x,z);return n+Number(ray(new T.Vector3(w.x,bed.y+y,w.z),eye));
    },0);
    if(score>best){best=score;where=eye;}
    if(score===4)break;
  }
  if(best<=1 && bed.parentId){
    const p=bedPoint(bed,.59,1.7);where.set(p.x,bed.y+1.65,p.z);
  }
  camera.clearViewOffset();camera.fov=narrow?59:47;camera.position.copy(where);camera.lookAt(target);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
}

export function createCampSleepView({scene,camera,player,dialog,enter,draw,leave,canStand}){
  const overlay=document.createElement('section');overlay.className='cook-view';overlay.style.justifyContent='flex-end';
  overlay.innerHTML='<div class="cook-strip"><div><strong class="cook-step" id="camp-sleep-step" role="status"></strong><span class="camp-sleep-time"></span></div><div class="cook-controls"><button type="button" data-rest="back">取りやめる</button><button type="button" data-rest="wake">起きるまで進める</button></div></div>';
  const status=overlay.querySelector('strong'),clock=overlay.querySelector('span'),wake=overlay.querySelector('[data-rest=wake]');
  let run;
  function finish(outcome){
    if(!run)return;
    const r=run;run=null;
    let result={ok:false,reason:'寝床から起きました。時刻はそのままです。'};
    try{if(outcome==='wake')result=r.commit();}
    finally{
      r.actor.dispose();r.cloth.geometry.dispose();r.root.removeFromParent();overlay.remove();
      delete dialog.dataset.performance;delete dialog.dataset.sleeping;
      dialog.setAttribute('aria-labelledby','dialog-title');
      if(dialog.open)dialog.dataset.living='';
      document.getElementById('stage').classList.remove('performing');leave();
    }
    if(outcome!=='close')r.done(result);
  }
  function render(dt){
    const r=run,f=r.motion.sample(r.elapsed);
    const profile=r.actor.update(f,dt);
    drapeCover(r.cloth.geometry,r.bed.beddingGrade??0,f.cover,Math.sin(Math.PI*f.cover),f.cover>.025?profile:undefined);
    if(status.textContent!==f.label)status.textContent=f.label;
    const visual=lerp(r.startMinute,r.targetMinute,f.clock),text=clockFormat(visual);
    if(clock.textContent!==text)clock.textContent=text;
    draw(visual,dt);
  }
  function start(bed,{startMinute,targetMinute,commit,done}){
    if(run || !dialog.open || !bed)return false;
    const path=sleepApproach(bed,player,canStand);
    if(!path){done({ok:false,reason:'寝床の手前に回り、もう一度休んでください。'});return false;}
    const root=new T.Group();root.name='野営地の夜支度';root.position.set(bed.x,bed.y,bed.z);root.rotation.y=bed.yaw;scene.add(root);
    const cloth=campCover(bed.beddingGrade??0,true);
    root.add(cloth);
    run={bed,root,cloth,actor:sleeper(root,player),motion:sleepMotion(path,player.heading,bed.yaw),elapsed:0,last:null,startMinute,targetMinute,commit,done};
    enter(bed);
    delete dialog.dataset.living;dialog.dataset.sleeping='';dialog.dataset.performance='';
    dialog.setAttribute('aria-labelledby','camp-sleep-step');document.getElementById('stage').classList.add('performing');
    dialog.append(overlay);bedLens(scene,root,bed,camera);render(0);wake.focus({preventScroll:true});return true;
  }
  function frame(now){
    if(!run)return;
    const dt=run.last===null?0:clamp((now-run.last)/1000,0,.13);run.last=now;
    run.elapsed=Math.min(run.motion.duration,run.elapsed+dt);render(dt);
    if(run.elapsed>=run.motion.duration)finish('wake');
  }
  wake.onclick=()=>finish('wake');overlay.querySelector('[data-rest=back]').onclick=()=>finish('back');
  dialog.addEventListener('cancel',e=>{if(run){e.preventDefault();finish('back');}});
  return {start,frame,resize(){if(run){bedLens(scene,run.root,run.bed,camera);render(0);}},close:()=>finish('close'),
    resetClock(){if(run)run.last=null;},get active(){return Boolean(run);}};
}
