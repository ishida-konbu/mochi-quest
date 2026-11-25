import { makeCraftScene } from './build-craft-scene.js';
import { BUILD_MODULES } from './living-build-state.js';

const stopped=()=>({ok:false,reason:'手を止めて材料を戻しました。'});

export function createConstructionView({scene,camera,player,dialog,canStand,enter,draw,leave,playSound}) {
  const overlay=document.createElement('section');
  overlay.className='cook-view';overlay.style.justifyContent='flex-end';
  overlay.innerHTML=`<div class="cook-strip"><div class="cook-step" role="status" id="assembly-step"></div>
    <div class="cook-progress" aria-hidden="true"><i></i></div><div class="cook-controls">
    <button type="button" data-assembly="back">取りやめる</button><button type="button" data-assembly="pause">一時停止</button>
    <button type="button" data-assembly="speed" aria-pressed="false">2倍速</button><button type="button" data-assembly="finish">仕上げまで進める</button></div></div>`;
  const paper=document.createElement('div');
  paper.className='forestry-paper';paper.setAttribute('aria-hidden','true');overlay.prepend(paper);
  const strip=overlay.querySelector('.cook-strip'), status=overlay.querySelector('.cook-step');
  const progress=overlay.querySelector('.cook-progress i');
  const button=key=>overlay.querySelector('[data-assembly="'+key+'"]');
  const pause=button('pause'),speed=button('speed'),stage=document.getElementById('stage');
  overlay.querySelector('.cook-controls').style.cssText='flex-wrap:wrap;justify-content:center';
  let run=null,take=0;

  function end(outcome) {
    const r=run;
    if(!r)return;
    run=null;
    let result=stopped();
    try {
      if(outcome==='complete')result=r.commit(r.shot.endPose);
    } catch(error) {
      console.error('普請の結果を確定できませんでした。',error);
      result={ok:false,reason:'建物を仕上げられませんでした。材料と場所を確かめてください。'};
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
    paper.style.opacity=String(f.cutOpacity||0);
    if(status.textContent!==f.label)status.textContent=f.label;
    progress.style.transform='scaleX('+Math.min(1,r.time/r.shot.duration)+')';
    if(f.cue){
      const key=f.index+'-'+f.cue;
      if(!r.heard.has(key)){r.heard.add(key);if(!mute)playSound?.(f.cue.split('-')[0]);}
    }
    draw(dt,r.shot.detail);
  }
  function failed(error){
    console.error('普請の実演を続けられませんでした。',error);
    end('back');
  }
  function start(site,commit,done) {
    if(run || !dialog.open)return false;
    let shot;
    try{shot=makeCraftScene(scene,camera,player,site,canStand,take++);}
    catch(error){
      console.error('普請の支度ができませんでした。',error);
      done({ok:false,reason:'普請の道具を用意できませんでした。もう一度試してください。'});
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
