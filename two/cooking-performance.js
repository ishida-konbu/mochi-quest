import { Vector3 } from './vendor/three.module.min.js';
import { createCookingStage } from './cooking-stage.js';
import { createCookingScore } from './cooking-motion.js';
import { createCookingPerformer } from './cooking-performer.js';
import { createCookingProps } from './cooking-props.js';

// Commit the recipe only after the cook sets down the last serving.
export function createCookingPerformance({scene, camera, dialog, player, enter, draw, leave, playSound}) {
  const overlay = document.createElement('section');
  overlay.className = 'cook-view';
  overlay.innerHTML = `<header class="cook-heading"><div><span class="cook-place"></span>
    <h2 id="cook-title"></h2></div><button type="button" data-cook="back">配合に戻る</button></header>
    <div class="cook-strip"><div class="cook-step" role="status"></div><div class="cook-progress" aria-hidden="true"><i></i></div>
    <div class="cook-controls"><button type="button" data-cook="pause">一時停止</button>
    <button type="button" data-cook="detail" aria-pressed="false">手元を拡大</button>
    <button type="button" data-cook="finish">完成まで早送り</button></div></div>`;
  const control = name => overlay.querySelector('[data-cook="'+name+'"]');
  const pause = control('pause'), detail = control('detail');
  const step = overlay.querySelector('.cook-step'), progress = overlay.querySelector('.cook-progress i');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const startPoint = new Vector3();
  let run = null;

  function finish(outcome) {
    const current = run;
    if (!current) return;
    run = null;
    try {
      current.performer?.dispose();
      current.props?.dispose();
    } finally {
      current.stage?.dispose();
      overlay.remove();
      delete dialog.dataset.performance;
      delete dialog.dataset.cooking;
      dialog.setAttribute('aria-labelledby','dialog-title');
      if (dialog.open) dialog.dataset.living = '';
      document.getElementById('stage').classList.remove('performing');
      if (current.entered) leave();
    }
    if (outcome === 'complete') current.complete();
    if (outcome === 'back') current.back();
  }

  function render(dt, cut = false) {
    const {stage, performer, props, score, elapsed, closeUp} = run;
    const frame = score.sample(elapsed);
    performer.update(frame);
    props.update(frame);
    stage.positionCamera(camera,frame,{detail:closeUp,reducedMotion:reduced.matches,dt,cut});
    draw(dt);
    run.aspect = camera.aspect;
    if (step.textContent !== frame.label) step.textContent = frame.label;
    progress.style.transform = 'scaleX(' + Math.min(1,elapsed / score.duration) + ')';
  }

  function start({site, draft, name, complete, back}) {
    if (run || !site || !dialog.open) return false;
    run = {complete, back, elapsed:0, last:null, cue:0, paused:false, closeUp:false, entered:false};
    try {
      const stage = run.stage = createCookingStage(scene,site);
      stage.group.updateWorldMatrix(true,false);
      stage.group.worldToLocal(startPoint.set(player.x,player.y,player.z));
      run.score = createCookingScore(draft,stage.layout,{
        start:startPoint.toArray(), heading:player.heading - stage.group.rotation.y, full:player.buffs?.full>0,
      });
      run.performer = createCookingPerformer(stage.group,player);
      run.props = createCookingProps(draft,stage.layout);
      stage.group.add(run.props.group);
      overlay.querySelector('.cook-place').textContent = site.name;
      overlay.querySelector('#cook-title').textContent = name;
      pause.textContent = '一時停止';
      detail.textContent = '手元を拡大';
      detail.setAttribute('aria-pressed','false');
      step.textContent = '';
      delete dialog.dataset.living;
      dialog.dataset.performance = '';
      dialog.dataset.cooking = '';
      dialog.setAttribute('aria-labelledby','cook-title');
      dialog.append(overlay);
      document.getElementById('stage').classList.add('performing');
      run.entered = true;
      enter();
      render(0);
      pause.focus({preventScroll:true});
      return true;
    } catch (error) {
      console.error('餅作りの描画を開始できませんでした。',error);
      finish('abort');
      return false;
    }
  }

  function frame(now) {
    if (!run) return;
    // Frozen work needs another draw only after a resize, seek or lens change.
    if (run.last !== null && run.aspect === camera.aspect) {
      if (run.paused || now-run.last < 1000/60-.6) return;
    }
    const dt = run.last === null || run.paused ? 0 : Math.min(.15, Math.max(0,(now-run.last)/1000));
    run.last = now;
    run.elapsed = Math.min(run.score.duration,run.elapsed+dt);
    const cues = run.score.cues;
    while (run.cue < cues.length && cues[run.cue].time <= run.elapsed) playSound(cues[run.cue++].name);
    try {
      render(dt);
    } catch (error) {
      console.error('餅作りの描画を続けられませんでした。',error);
      finish('back');
      return;
    }
    if (run.elapsed >= run.score.duration) finish('complete');
  }

  control('back').onclick = () => finish('back');
  control('finish').onclick = () => {
    if (!run) return;
    // Show the finished platter for a moment even when shortening the work.
    run.elapsed = Math.max(run.elapsed,run.score.duration-1.4);
    run.cue = run.score.cues.length;
    run.last = null;
    run.paused = false;
    pause.textContent = '一時停止';
    render(0,true);
  };
  pause.onclick = () => {
    if (!run) return;
    run.paused = !run.paused;
    run.last = null;
    pause.textContent = run.paused ? '再開' : '一時停止';
  };
  detail.onclick = () => {
    if (!run) return;
    run.closeUp = !run.closeUp;
    detail.setAttribute('aria-pressed',String(run.closeUp));
    detail.textContent = run.closeUp ? '全景に戻る' : '手元を拡大';
    render(0);
  };
  dialog.addEventListener('cancel',event => {
    if (!run) return;
    event.preventDefault();
    finish('back');
  });
  return {
    start, frame, close:() => finish('abort'),
    resetClock() { if (run) run.last=null; },
    get active() {return Boolean(run);},
    get paused() {return Boolean(run?.paused);},
  };
}
