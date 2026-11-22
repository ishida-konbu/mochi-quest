import { cases, evidence, npcs } from './mystery-data.js';
import { element, button, section, disclosure, shuffled } from './mystery-paper.js';
import { exhibitPlate } from './mystery-exhibits.js';

export function createProofs({mystery, page, save, close, book, dialogue, stageCourt, seed}) {
  const state = mystery.state;
  function report(parent, text) {
    parent.textContent = text;
    parent.focus({preventScroll:true});
    parent.scrollIntoView({block:'nearest'});
  }
  function feedbackArea(parent) {
    const box = element(parent, 'p', '', 'mq-feedback');
    box.tabIndex = -1;
    box.setAttribute('role','status');
    return box;
  }
  function exhibitOptions(parent, caseId, relevantIds) {
    const chosen = new Set();
    const main = section(parent, '示す資料');
    const other = disclosure(main, 'ほかの事件の資料');
    const comparison = disclosure(main,'選んだ資料を並べて読む');
    const leaves = element(comparison,'div',null,'mq-comparison');
    function compare() {
      leaves.replaceChildren();
      if (!chosen.size) element(leaves,'p','上の資料に印を付けると、ここで読み比べられます。');
      for (const id of chosen) {
        const e = evidence.find(item=>item.id===id);
        const leaf = element(leaves,'article');
        element(leaf,'h4',e.nameJa); element(leaf,'p',e.descriptionJa);
        exhibitPlate(leaf,e.id);
      }
    }
    comparison.ontoggle=()=>{ if(comparison.open) compare(); };
    const visible = evidence.filter(e => state.evidence.includes(e.id));
    for (const e of visible) {
      const container = e.caseId === caseId || relevantIds.has(e.id) ? main : other;
      const row = element(container, 'div', null, 'mq-exhibit-option');
      if (container === main) main.insertBefore(row, other);
      const label = element(row, 'label');
      const input = element(label, 'input');
      input.type = 'checkbox';
      input.value = e.id;
      input.onchange = () => {
        if (input.checked) chosen.add(e.id); else chosen.delete(e.id);
        comparison.firstElementChild.textContent = chosen.size ? '選んだ資料を並べて読む　'+chosen.size+'件' : '選んだ資料を並べて読む';
        if (comparison.open) compare();
      };
      element(label, 'span', e.nameJa);
      const details = disclosure(row, '読む');
      details.ontoggle = () => {
        if (details.open && details.children.length === 1) {
          element(details,'p',e.descriptionJa);
          exhibitPlate(details, e.id);
        }
      };
    }
    if (other.children.length === 1) other.remove();
    return chosen;
  }
  function radioList(parent, title, list, name) {
    const group = element(parent,'fieldset',null,'mq-radios');
    element(group,'legend',title);
    for (const item of list) {
      const label = element(group, 'label');
      const input = element(label, 'input');
      input.type = 'radio'; input.name = name; input.value = item.id;
      element(label, 'span', item.textJa);
    }
    return () => group.querySelector('input:checked')?.value;
  }
  function hint(parent, challenge) {
    const panel = disclosure(parent, '考えがまとまらないとき');
    const show = index => {
      element(panel,'p',challenge.hintsJa[index]);
      next.remove();
      if (index < challenge.hintsJa.length - 1)
        next = button(panel,'もう一つヒントを読む', () => show(index + 1), 'mq-link');
    };
    let next = button(panel, '小さなヒントを読む', () => show(0), 'mq-link');
  }
  function infer(challenge) {
    const body = page('手帖で推理する', cases.find(c=>c.id===challenge.caseId).titleJa);
    element(body,'p',challenge.promptJa,'mq-lead');
    const chosen = exhibitOptions(body, challenge.caseId, new Set(challenge.requiredEvidenceIds));
    const answer = radioList(body,'そこから分かること', shuffled(challenge.choices,seed+challenge.id),'reason');
    const feedback = feedbackArea(body);
    button(body,'推理を確かめる',() => {
      const result = mystery.submitInference(challenge.id,[...chosen],answer());
      if (!result.ok) return report(feedback,result.feedback || '資料と、そこから分かることを選ぼう。');
      save();
      const done = page('推理がつながった', challenge.promptJa);
      element(done,'p',result.feedback || challenge.reasoningJa,'mq-lead');
      button(done,'事件の頁へ',()=>book(challenge.caseId),'mq-primary');
    },'mq-primary');
    hint(body,challenge);
    button(body,'事件の頁へ',()=>book(challenge.caseId),'mq-link');
  }
  function recess(parent) {
    button(parent,'休廷して調べ直す',() => { mystery.leaveTrial(); save(); close(); },'mq-link');
  }
  function hearing(trial) {
    const c = cases.find(c => c.id === trial.caseId);
    if (state.hearings[trial.id]?.won) return verdict(trial);
    const result = mystery.startTrial(trial.id);
    if (!result.ok) return book(c.id);
    save();
    stageCourt();
    const body = page('京の評定所', c.titleJa);
    body.classList.add('mq-court-opening');
    element(body,'p',trial.openingJa,'mq-lead');
    const round = state.hearings[trial.id].round;
    button(body,round ? '休廷したところから再開' : '証言を聞く',()=>testimony(trial),'mq-primary');
    recess(body);
  }
  function testimony(trial) {
    const index = state.hearings[trial.id].round;
    if (index === trial.rounds.length) return sequence(trial);
    const round = trial.rounds[index];
    const witness = npcs.find(n=>n.id===round.testimony.npcId);
    const body = page('京の評定所', '第' + (index + 1) + 'の証言　' + (witness?.nameJa || '証人'));
    const statement = radioList(body,'問い直す一文',round.testimony.lines,'statement');
    const chosen = exhibitOptions(body, trial.caseId, new Set(cases.find(c=>c.id===trial.caseId).mandatoryEvidenceIds));
    const answer = radioList(body,'資料を示す理由',shuffled(round.challenge.choices,seed+round.id),'reason');
    const tips = disclosure(body,'書記に相談する');
    const sufficient = round.challenge.acceptedEvidenceSets;
    const counts = [...new Set(sufficient.map(set=>set.length))].join('枚または');
    element(tips,'p','この一文を問い直すには、'+counts+'枚の資料を組み合わせます。');
    const alternative = sufficient[0]; let revealed=0;
    const tip = button(tips,'手掛かりを一つ聞く',()=>{
      const e=evidence.find(item=>item.id===alternative[revealed++]);
      const line=element(tips,'p',e.nameJa+'　―　'+e.establishesJa);
      tips.insertBefore(line,tip);
      tip.hidden = revealed===alternative.length;
    },'mq-link');
    const feedback = feedbackArea(body);
    button(body,'異議を申し立てる',() => {
      const result = mystery.submitRound(trial.id,statement(),[...chosen],answer());
      if (!result.ok) return report(feedback,result.feedback || round.failureJa);
      save();
      const done = page('京の評定所','確かめられたこと');
      element(done,'p',result.feedback || round.successJa,'mq-lead');
      button(done,'審理を進める',()=>testimony(trial),'mq-primary');
      recess(done);
    }, 'mq-primary');
    recess(body);
  }
  function sequence(trial) {
    const body = page('京の評定所','出来事を結ぶ');
    const puzzle = trial.reconstruction;
    element(body,'p',puzzle.promptJa,'mq-lead');
    const remaining = section(body,'次の出来事を選ぶ');
    const selected = section(body,'組み立てた順序');
    const list = element(selected,'ol',null,'mq-sequence');
    const feedback = feedbackArea(body);
    const order = [];
    const options = shuffled(puzzle.options,seed+trial.id);
    if (options.every((opt,i)=>opt.id===puzzle.correctOrder[i])) options.reverse();
    function draw() {
      remaining.querySelectorAll('button').forEach(b=>b.remove());
      list.replaceChildren();
      for (const item of options.filter(opt=>!order.includes(opt))) {
        button(remaining,item.textJa,()=>{ order.push(item); draw(); }).dataset.option = item.id;
      }
      for (const item of order) element(list,'li',item.textJa);
      undo.disabled = !order.length;
      submit.disabled = order.length !== options.length;
      if (remaining.querySelector('button')) remaining.querySelector('button').focus({preventScroll:true});
      else submit.focus({preventScroll:true});
    }
    const undo = button(selected,'ひとつ戻す',()=>{order.pop();draw();},'mq-link');
    const submit = button(body,'この順で記録する',() => {
      const result = mystery.reconstruct(trial.id,order.map(o=>o.id));
      if (!result.ok) return report(feedback,result.feedback || puzzle.wrongFeedbackJa);
      save(); verdict(trial);
    },'mq-primary');
    draw();
    recess(body);
  }
  function verdict(trial) {
    const body = page('京の評定所','裁定');
    element(body,'p',trial.verdictJa,'mq-lead');
    element(body,'p',trial.closingJa,'mq-lines');
    const c = cases.find(c=>c.id===trial.caseId);
    button(body, state.status[c.id]==='resolved' ? '裁定を閉じる' : '白枝に確かめたことを伝える',
      () => state.status[c.id]==='resolved' ? close() : dialogue(c.resolutionDialogueId),'mq-primary');
  }
  return {infer,hearing};
}
