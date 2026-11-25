import { Group, Mesh } from './vendor/three.module.min.js';
import { createCookingPerformer } from './cooking-performer.js';
import { assemblyParts } from './homestead-assembly-parts.js';
import { planAssembly } from './homestead-assembly-motion.js';
import { makeAssemblyCamera } from './homestead-assembly-camera.js';
import { homesteadFinish } from './homestead-pigment.js';
import { makeJoinersMallet, makeMalletLoop, makeWorkTrestle } from './homestead-work-trestle.js';
import { makeAssemblyTextile } from './homestead-assembly-textile.js';
import { BUILD_MODULES } from './living-build-state.js';

const zero=[0,0,0];
const stopped=()=>({ok:false,reason:'手を止めて材料を戻しました。場所を選び直せます。'});

function makeAssemblyScene(scene,camera,player,site,canStand) {
  const steps=assemblyParts(site.kind,site.terrain);
  const plan=planAssembly(player,site,steps,canStand);
  if(!plan)return null;
  const group=new Group();group.name='配達人の普請場';
  group.position.set(site.x,site.y,site.z);group.rotation.y=site.yaw;
  const owned=[];
  const parts=steps.map(step=>{
    const textile=step.unfurl?makeAssemblyTextile(step):null;
    if(textile)owned.push(textile.geometry);
    const pivot=new Group(), mesh=new Mesh(textile?.geometry ?? step.geometry,homesteadFinish());
    pivot.name=step.label;mesh.name=step.id;
    mesh.position.fromArray(step.grip).multiplyScalar(-1);
    mesh.castShadow=mesh.receiveShadow=true;
    pivot.add(mesh);group.add(pivot);
    return {step,pivot,mesh,textile};
  });
  const trestles=[];
  for(const platform of plan.platforms){
    const trestle=makeWorkTrestle(platform);
    group.add(trestle);owned.push(trestle.geometry);trestles.push(trestle);
  }
  const mallet=makeJoinersMallet(), belt=makeMalletLoop(player.buffs?.full>0?1.28:1);
  group.add(mallet,belt);owned.push(mallet.geometry,belt.geometry);
  const original={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,
    view:camera.view?.enabled?{...camera.view}:null};
  let performer, lens, framing, closed=false;
  function setPieces(frame) {
    for(let i=0;i<parts.length;i++){
      const {step,pivot,textile}=parts[i];
      const pose=i<frame.installedCount ? null : i===frame.index ? frame : plan.staging[i];
      const offset=pose?.offset ?? zero, rotation=pose?.rotation ?? zero;
      pivot.position.set(step.grip[0]+offset[0],step.grip[1]+offset[1],step.grip[2]+offset[2]);
      pivot.rotation.set(...rotation);
      if(textile)textile.unroll(i<frame.installedCount?1:i===frame.index?frame.work:0);
    }
  }
  function dispose() {
    if(closed)return;
    closed=true;
    performer?.dispose();
    group.removeFromParent();
    for(const geometry of owned)geometry.dispose();
    camera.position.copy(original.position);camera.quaternion.copy(original.quaternion);camera.fov=original.fov;
    if(original.view){
      const v=original.view;
      camera.setViewOffset(v.fullWidth,v.fullHeight,v.offsetX,v.offsetY,v.width,v.height);
    }else camera.clearViewOffset();
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  try {
    scene.add(group);group.updateMatrixWorld(true);
    framing=makeAssemblyCamera(group,parts,plan,player.buffs?.full>0?1.28:1,setPieces,trestles);
    performer=createCookingPerformer(group,player);
    performer.group.name='普請をするお餅の配達人';
  } catch(error){dispose();throw error;}
  return {
    duration:plan.duration,
    endPose:plan.endPose,
    layout(width,height,visibleHeight){lens=framing.fit(width,height,visibleHeight);},
    update(time){
      const frame=plan.sample(time);
      setPieces(frame);performer.update(frame);
      belt.position.fromArray(frame.hero);belt.rotation.y=frame.heading;
      mallet.visible=Boolean(frame.mallet);
      if(frame.mallet){
        mallet.position.fromArray(frame.mallet.position);
        mallet.rotation.set(...frame.mallet.rotation,'YXZ');
      }
      if(lens)framing.apply(camera,lens,frame);
      return frame;
    },
    dispose,
  };
}

export function createConstructionView({scene,camera,player,dialog,canStand,enter,draw,leave,playSound}) {
  const overlay=document.createElement('section');
  overlay.className='cook-view';overlay.style.justifyContent='flex-end';
  overlay.innerHTML=`<div class="cook-strip"><div class="cook-step" role="status" id="assembly-step"></div>
    <div class="cook-progress" aria-hidden="true"><i></i></div><div class="cook-controls">
    <button type="button" data-assembly="back">取りやめる</button><button type="button" data-assembly="pause">一時停止</button>
    <button type="button" data-assembly="speed" aria-pressed="false">2倍速</button><button type="button" data-assembly="finish">仕上げまで進める</button></div></div>`;
  const strip=overlay.querySelector('.cook-strip'), status=overlay.querySelector('.cook-step');
  const progress=overlay.querySelector('.cook-progress i');
  const button=key=>overlay.querySelector('[data-assembly="'+key+'"]');
  const pause=button('pause'),speed=button('speed'),stage=document.getElementById('stage');
  overlay.querySelector('.cook-controls').style.cssText='flex-wrap:wrap;justify-content:center';
  let run=null;

  function end(outcome) {
    const r=run;
    if(!r)return;
    run=null;
    let result=stopped();
    try {
      if(outcome==='complete')result=r.commit(r.shot.endPose);
    } catch(error) {
      console.error('普請の結果を確定できませんでした。',error);
      result={ok:false,reason:'建物を仕上げられませんでした。家づくりの頁で材料と場所を確かめてください。'};
    } finally {
      r.shot.dispose();overlay.remove();
      delete dialog.dataset.performance;delete dialog.dataset.assembly;
      if(dialog.open)dialog.dataset.living='';
      dialog.setAttribute('aria-labelledby','dialog-title');stage.classList.remove('performing');
      if(r.entered)leave();
    }
    if(outcome!=='close') r.done(result);
  }
  function layout() {
    const area=overlay.getBoundingClientRect();
    const w=Math.max(1,Math.round(area.width)),h=Math.max(1,Math.round(area.height));
    // Leave a full line spare for longer work captions in portrait.
    const open=Math.max(h*.36,Math.min(h,strip.getBoundingClientRect().top-area.top)-20);
    run.shot.layout(w,h,open);
    run.aspect=camera.aspect;
  }
  function render(dt,mute=false) {
    const r=run, f=r.shot.update(Math.min(r.time,r.shot.duration));
    if(status.textContent!==f.label)status.textContent=f.label;
    progress.style.transform='scaleX('+Math.min(1,r.time/r.shot.duration)+')';
    if(f.cue){
      const key=f.index+'-'+f.cue;
      if(!r.heard.has(key)){r.heard.add(key);if(!mute)playSound?.(f.cue);}
    }
    draw(dt);
  }
  function failed(error){
    console.error('普請の実演を続けられませんでした。',error);
    end('back');
  }
  function start(site,commit,done) {
    if(run || !dialog.open)return false;
    let shot,broken=false;
    try{shot=makeAssemblyScene(scene,camera,player,site,canStand);}
    catch(error){broken=true;console.error('普請の支度ができませんでした。',error);}
    if(!shot){
      done(broken?{ok:false,reason:'普請の道具を用意できませんでした。家づくりの頁からもう一度お試しください。'}:
        {ok:false,retrySite:true,reason:'作業の足場が取れません。建物の周りと自分の足元にゆとりのある場所を選んでください。'});
      return false;
    }
    run={shot,commit,done,time:0,last:null,aspect:0,paused:false,speed:1,entered:false,heard:new Set()};
    try{
      pause.textContent='一時停止';speed.setAttribute('aria-pressed','false');
      status.textContent=BUILD_MODULES[site.kind].name+'の普請を始めます。';
      delete dialog.dataset.living;dialog.dataset.performance='';dialog.dataset.assembly='';
      dialog.setAttribute('aria-labelledby','assembly-step');
      dialog.append(overlay);stage.classList.add('performing');
      run.entered=true;enter(site);layout();render(0,true);
      pause.focus({preventScroll:true});
      return true;
    }catch(error){failed(error);return false;}
  }
  function frame(now) {
    if(!run)return;
    try {
      const r=run;
      if(r.aspect!==camera.aspect){layout();render(0,true);}
      if(r.paused || (r.last!==null && now-r.last<1000/60-.6))return;
      const dt=r.last===null?0:Math.min(.14,Math.max(0,(now-r.last)/1000));
      r.last=now;r.time+=dt*r.speed;render(dt,r.skipped);
      if(r.time>=r.shot.duration+.42)end('complete');
    }catch(error){failed(error);}
  }
  function resize(){if(run){try{layout();render(0,true);}catch(error){failed(error);}}}
  button('back').onclick=()=>end('back');
  button('finish').onclick=()=>{
    if(!run)return;
    run.time=run.shot.duration;run.last=null;run.paused=false;run.skipped=true;
    pause.textContent='一時停止';render(0,true);
  };
  pause.onclick=()=>{
    if(!run)return;
    run.paused=!run.paused;run.last=null;
    pause.textContent=run.paused?'再開':'一時停止';
  };
  speed.onclick=()=>{
    if(!run)return;
    run.speed=run.speed===1?2:1;run.last=null;
    speed.setAttribute('aria-pressed',String(run.speed===2));
  };
  dialog.addEventListener('cancel',event=>{if(run){event.preventDefault();end('back');}});
  return {start,frame,resize,close:()=>end('close'),resetClock(){if(run)run.last=null;},
    get active(){return !!run;},get paused(){return !!run?.paused;}};
}
