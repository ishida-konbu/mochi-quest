// The open hut and the landscape stay on screen throughout the night. Only
// the presentation clock runs ahead; the journey commits once on waking.
import * as T from './vendor/three.module.min.js';
import {createSleeper} from './camp-sleep-body.js';
import {campMattress} from './camp-bedding.js';
import {campCover,drapeCover} from './camp-cover.js';
import {SLEEP_DURATION,sleepApproach,sleepMotion} from './camp-sleep-motion.js';
import {visibleWorkArea} from './build-craft-scene.js';
import {worldClockLabel} from './world-clock.js';

const lerp=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const clockFormat=n=>worldClockLabel(Math.floor(n));
// Measure the two expressions and the draped textile on the same rig that
// performs the scene. The travel buff and the two-tier shape move each
// painted eye to a different place on the pillow.
function measureBed(r){
  const arrival=(r.motion.duration-SLEEP_DURATION)/2;
  const pose=t=>{
    const f=r.motion.sample(t),surface=r.actor.update(f,0);
    drapeCover(r.cloth.geometry,r.bed.beddingGrade??0,f.cover,0,surface.height,surface.edge,surface.grips);
    return r.actor.framing();
  };
  pose(0);
  const awake=pose(arrival+.60),sleep=pose(arrival+5.3);
  const {position,uv}=r.cloth.geometry.attributes,hem=[];
  for(const u of [.18,.5,.82]){
    let distance=Infinity,vertex=0;
    for(let i=0;i<uv.count/2;i++){
      if(uv.getY(i)!==1)continue;
      const gap=Math.abs(uv.getX(i)-u);
      if(gap<distance){distance=gap;vertex=i;}
    }
    hem.push(new T.Vector3().fromBufferAttribute(position,vertex));
  }
  return {awake,sleep,hem};
}

function bedLens(scene,r,camera){
  const {root,bed}=r,mat=campMattress(bed),{awake,sleep,hem}=measureBed(r);
  const world=p=>root.localToWorld(p.clone());
  const centre=awake.outline.clone().union(sleep.outline).getCenter(new T.Vector3());
  centre.z=lerp(centre.z,(mat.foot+mat.head)/2,.48);
  const target=world(centre);
  // A large sleeper can bring its upturned face level with the lintel.
  // In a furnished hut use the same roofless view as a painted interior;
  // its rafters still cast their shadow. Restore the roof when play resumes.
  const highRoom=bed.parentId && (sleep.face[2].y>1.68 || r.large && sleep.obstacles.length);
  if(highRoom && r.roof && !r.roofFinish){
    r.roofFinish=r.roof.material;
    r.shadowOnly=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
    r.roof.material=r.shadowOnly;
  }
  const ray=visibleWorkArea(scene,root,bed,undefined,8,Boolean(r.roofFinish));
  const points=[...awake.silhouette,...sleep.silhouette];
  for(const z of [mat.head,mat.foot])for(const x of [-.5,.5])
    points.push(new T.Vector3(mat.x+x*mat.width,.14,z));
  const view=new T.Matrix4(),projected=new T.Vector3();
  const face=pose=>{
    const [left,right,lip]=pose.face,eyes=left.clone().lerp(right,.5);
    const normal=right.clone().sub(left).cross(eyes.clone().sub(lip)).normalize();
    return {spots:pose.face.map(world),normal:normal.transformDirection(root.matrixWorld)};
  };
  const sitting=face(awake),lying=face(sleep),seams=hem.map(world);
  const narrow=camera.aspect<.85,dist=narrow?1.44:1;
  const locations=highRoom?[[1.22,4.35,1.20],[.84,4.12,1.48],[1.54,4.18,.72],[-1.16,4.25,1.02],
    [.78,4.63,.75],[1.72,3.76,.68],[-1.38,3.88,.74]]:bed.parentId?[[2.35,1.99,.18],[2.75,2.03,-.41],[-2.42,1.96,.16],
    [1.9,2.08,.16],[-1.92,2.06,.14],[1.54,2.24,.12],
    [.8,1.98,2.7],[-.44,1.96,2.8]]:[[2.47,2.47,.93],[-2.47,2.47,.93],
      [2.75,2.27,.18],[-2.75,2.27,.18],[1.6,2.68,2.48],[-1.6,2.68,2.48],[.18,2.1,3.3]];
  const clothRay=new T.Raycaster(),dir=new T.Vector3();
  let best=-Infinity,pose;
  camera.clearViewOffset();
  for(const [x,y,z] of locations){
    const eye=world(new T.Vector3(mat.x+x*dist,y,z*dist));
    camera.position.copy(eye);camera.lookAt(target);camera.updateMatrixWorld();
    view.multiplyMatrices(camera.matrixWorldInverse,root.matrixWorld);
    let aperture=Math.tan((narrow?54:48)*Math.PI/360);
    for(const point of points){
      const p=projected.copy(point).applyMatrix4(view),depth=Math.max(.10,-p.z);
      aperture=Math.max(aperture,Math.abs(p.x)/(depth*camera.aspect*.82),Math.abs(p.y)/(depth*(p.y<0?.71:.88)));
    }
    const fov=2*Math.atan(aperture)*180/Math.PI;
    let score=0,clearEyes=0;
    for(const [features,inBed] of [[sitting,false],[lying,true]]){
      const direction=dir.subVectors(eye,features.spots[2]).normalize().dot(features.normal);
      const readable=T.MathUtils.smoothstep(direction,.04,.57);
      for(const spot of features.spots){
        if(!ray(spot,eye))continue;
        if(inBed){
          dir.subVectors(spot,eye);clothRay.far=dir.length()-.015;
          clothRay.set(eye,dir.normalize());
          if(clothRay.intersectObjects([r.cloth,...sleep.obstacles],true).length)continue;
        }
        if(inBed)clearEyes++;
        score+=(inBed?3:1.6)*(.24+.76*readable);
      }
    }
    for(const p of seams)if(ray(p,eye))score+=1.65;
    // Seen end-on, the quilt and feet can hide the depth of the reclining
    // body even with a clear ray to both eyes. Keep the readable profile
    // when the hut has a clear side and the whole face can be seen.
    if(Math.abs(x)>Math.abs(z)){
      score+=.6;
      if(!highRoom && bed.parentId && clearEyes===3){
        const alongRail=Math.abs(z)/Math.abs(x);
        score+=5.2-2*alongRail+Math.min(1,Math.abs(x)-1.4);
      }
    }
    score-=Math.max(0,fov-(narrow?72:61))*.16;
    if(score>best){best=score;pose={eye,fov};}
  }
  camera.position.copy(pose.eye);camera.lookAt(target);camera.fov=Math.min(89,pose.fov);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
}

export function createCampSleepView({scene,camera,player,dialog,enter,draw,leave,canStand,getRoof}){
  const overlay=document.createElement('section');overlay.className='cook-view';overlay.style.justifyContent='flex-end';
  overlay.innerHTML='<div class="cook-strip"><div><strong class="cook-step" id="camp-sleep-step" role="status"></strong><span class="camp-sleep-time"></span></div><div class="cook-controls"><button type="button" data-rest="back">取りやめる</button><button type="button" data-rest="wake">起きるまで進める</button></div></div>';
  const status=overlay.querySelector('strong'),clock=overlay.querySelector('span'),wake=overlay.querySelector('[data-rest=wake]');
  let run;
  function finish(outcome){
    if(!run)return;
    const r=run;run=null;
    let result={ok:false,reason:'休むのを取りやめました。時刻はそのままです。'};
    try{if(outcome==='wake')result=r.commit();}
    finally{
      if(r.roofFinish){r.roof.material=r.roofFinish;r.shadowOnly.dispose();}
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
    const {height,edge,grips}=r.actor.update(f,dt);
    drapeCover(r.cloth.geometry,r.bed.beddingGrade??0,f.cover,Math.sin(Math.PI*f.cover),height,edge,grips);
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
    const mattress=campMattress(bed),cloth=campCover(bed.beddingGrade??0,true,mattress);
    root.add(cloth);
    run={bed,root,cloth,roof:getRoof?.(bed),large:player.buffs?.full>0,actor:createSleeper(root,player,mattress),motion:sleepMotion(path,player.heading,bed.yaw),elapsed:0,last:null,startMinute,targetMinute,commit,done};
    enter(bed);
    delete dialog.dataset.living;dialog.dataset.sleeping='';dialog.dataset.performance='';
    dialog.setAttribute('aria-labelledby','camp-sleep-step');document.getElementById('stage').classList.add('performing');
    dialog.append(overlay);bedLens(scene,run,camera);render(0);wake.focus({preventScroll:true});return true;
  }
  function frame(now){
    if(!run)return;
    const dt=run.last===null?0:clamp((now-run.last)/1000,0,.13);run.last=now;
    run.elapsed=Math.min(run.motion.duration,run.elapsed+dt);render(dt);
    if(run.elapsed>=run.motion.duration)finish('wake');
  }
  wake.onclick=()=>finish('wake');overlay.querySelector('[data-rest=back]').onclick=()=>finish('back');
  dialog.addEventListener('cancel',e=>{if(run){e.preventDefault();finish('back');}});
  return {start,frame,resize(){if(run){bedLens(scene,run,camera);render(0);}},close:()=>finish('close'),
    resetClock(){if(run)run.last=null;},get active(){return Boolean(run);}};
}
