import { createSawingScene } from './homestead-sawing.js';

export function createForestryView({scene,camera,player,dialog,canStand,enter,draw,leave}) {
  let work=null;
  const overlay=document.createElement('section');
  overlay.className='cook-view';
  overlay.innerHTML='<div class="cook-strip"><h2 id="forest-work-title">木を挽く</h2><p role="status"></p><div class="cook-controls"><button type="button" data-back>手を止める</button><button type="button" data-finish>仕上げまで進める</button></div></div>';
  const sheet=document.createElement('div');
  sheet.className='forestry-paper';sheet.setAttribute('aria-hidden','true');
  overlay.prepend(sheet);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const status=overlay.querySelector('p'),back=overlay.querySelector('[data-back]'),finish=overlay.querySelector('[data-finish]');
  function end(report) {
    if (!work) return;
    const current=work;
    work=null;
    current.shot.dispose();
    overlay.remove();
    delete dialog.dataset.performance;
    dialog.dataset.living='';
    dialog.setAttribute('aria-labelledby','dialog-title');
    document.getElementById('stage').classList.remove('performing');
    leave();
    if(report) current.done(current.result ?? {ok:false,reason:'木はそのままにして、鋸を収めました。'});
  }
  function start(tree,commit,done) {
    const shot=createSawingScene(scene,camera,player,tree,canStand);
    work={shot,commit,done,time:0,last:null,result:null};
    delete dialog.dataset.living;dialog.dataset.performance='';
    dialog.setAttribute('aria-labelledby','forest-work-title');
    document.getElementById('stage').classList.add('performing');
    status.textContent='足場を決め、幹に鋸を当てます。';
    sheet.style.opacity='0';
    finish.disabled=back.disabled=false;
    dialog.append(overlay);enter();shot.update(0);draw(shot.scene);back.focus({preventScroll:true});
  }
  function frame(now) {
    if(!work)return;
    const dt=work.last===null?0:Math.min(.12,(now-work.last)/1000);
    work.last=now;work.time+=dt;
    if(!work.result) {
      work.shot.update(Math.min(work.time,work.shot.duration));
      const after=work.time-work.shot.duration;
      if(after>=0) {
        status.textContent='挽いた木を片づけ、持ち運べる長さにそろえます。';
        sheet.style.opacity=String(reduced.matches ? 1 : Math.min(1,after/.28));
      } else if(work.time/work.shot.duration>.78) status.textContent='鋸を収めて、足場から離れます。';
      else if(work.time/work.shot.duration>.28) status.textContent='両手で鋸を引いて、幹を挽いています。';
      if(after>=.46) {
        work.result=work.commit();
        if(work.result.ok)work.shot.felled?.();
        // Turn the paper over while the off-screen timber is cleared. The
        // revealed stump and received lumber belong to the same transaction.
        status.textContent=work.result.message || work.result.reason;
        finish.disabled=back.disabled=true;
      }
    }
    if(work.result) {
      const reveal=work.time-work.shot.duration-.48;
      sheet.style.opacity=String(reduced.matches ? Number(reveal<0) : Math.max(0,1-Math.max(0,reveal)/.36));
    }
    draw(work.shot.scene);
    if(work.time>=work.shot.duration+1.5)end(true);
  }
  back.onclick=()=>end(true);
  finish.onclick=()=>{if(work) work.time=Math.max(work.time,work.shot.duration-.48);};
  dialog.addEventListener('cancel',e=>{if(work){e.preventDefault();end(true);}});
  return {start,frame,close:()=>end(false),resetClock(){if(work)work.last=null;},get active(){return !!work;}};
}
