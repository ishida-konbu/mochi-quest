import { cases, npcs, locations, evidence, dialogues, inferences, trials, ambient } from './mystery-data.js';
import { REGIONS } from './terrain.js';
import { element, section, button, disclosure } from './mystery-paper.js';
import { createProofs } from './mystery-proofs.js';
import { exhibitPlate, reconstruct } from './mystery-exhibits.js';

const index = records => new Map(records.map(record => [record.id, record]));
const character = index(npcs), place = index(locations), node = index(dialogues), clue = index(evidence);
const regionName = id => REGIONS.find(r=>r.id===id)?.name || '';
const ordinal = ['一','二','三','四','五','六','七'];
const chapter = c => '第' + ordinal[cases.indexOf(c)] + '話';
const artRoot = './assets/mystery/ui/';
const fieldNames = [
  ['棚板の米粉','落ちている木片','添え木の跡','受付の半券','修繕台の杵','返ってきた杵','杵吉の書付'],
  ['橋の上で何を見た？','白い綱の刺繡','茶屋の貸出帳','折り畳んだ覚書','稽古台の白玉','稽古の予約帳','ここへ来たわけを聞く'],
  ['荷受けの注文札','米売りの桝','二つの桝','出発前の秤札','合わせ板の控え','引渡しの記録','宿に残った控え米','米の補填に立ち会う'],
  ['閉じた手紙','踊り場の空','染め工房の仮札','軒下の手紙','招待状の控え','手渡しの控え','読み返しの控え'],
  ['前庭の申し立て','棚田の発送控え','松原の荷札','竜宮の石札','前庭の荷箱','浦の出荷札','楓峡の預替控え','雪灯りの蔵札','桃源郷の発送控え','竹隠れの控え','蔵町の在庫控え','荷継ぎの見本札'],
  ['寺に届いた連名書','朝の祈りに立ち会う','寺の紙綴り','鈴菜の手元に残る札','湯気丸の手元に残る札','雪綴の紙継ぎ見本','川の使いの半券','三組の紙片','工房の印刷見本'],
  ['受理された申し立て','読み返しの受領簿','受付の提出控え','綴じ渡しの控え','清書の割付','送り火の見え方','回廊の写生','里の約定','原本と要約','受取刻の立会い記録','事前確認の控え','二枚の相談欄','二つ折りの見本'],
];
const afterword = {
  dawn:'継ぎ目の残る祝い杵が台に戻った。前の席は空いたまま。少し離れたところから、杵吉が普段の餅をつく音が聞こえる。',
  river:'鳴吉の番付には、名前のない欄がひとつある。見物席では、綱を外した芦ノ山が茶を飲んでいる。',
  market:'米売りの店先には、標準桝と、運び賃を別に書いた札。俵九郎は値を伝え、客の返事を待っている。',
  terraces:'手返しの稽古台に、小さな白玉が残っている。次のひとつを返す時刻は、稽古をする者が決める。',
  moon:'鈴菜の稽古帳の今日の欄に、引き受けた時間だけが書いてある。続きの行には、まだ何もない。',
  spring:'共同の便が峠まで来るようになった。湯気丸は宿を開けたまま、届いた荷を受け取れる。',
  shrine:'古い約定の横に、訂正の写しが掛かった。小さい札には、全文の控えを読める場所が書いてある。',
  coast:'新しい荷札は、預かった時刻の隣に渡した時刻を書く。波助の名の下には、ほかの引受人の名も並ぶ。',
  autumn:'工房の包みはふたつ。水に濡らせない手紙は内へ、受取時刻を書いた札は外へ。',
  snow:'雪綴の仕事台がひとつ閉まっている。受付の札には、次に引き渡せる日だけが書いてある。',
  peach:'桃音のところには、出席の返事と欠席の返事が、同じ高さに並んでいる。',
  inari:'小雨の当番札には「午前」とある。その下を空けたまま、婚礼の列は先へ進む。',
  ryugu:'潮蔵の控えに、届いた米の番号が並ぶ。次の共同便については、別の紙で相談が始まった。',
  todaiji:'祈願票には、今日も祈りに来た者の名がある。明日の当番の相談には、別の紙が用意されている。',
  kyo:'受付には、元の相談と、その後に届いた返事が一緒に綴じてある。共同便に乗る者も、今年は休む者も、ここへ自分の返事を持ってこられる。',
};
function objectName(e) {
  const [,c,n] = e.id.match(/^EV_C(\d+)_(\d+)$/);
  return fieldNames[Number(c)-1]?.[Number(n)-1] || e.nameJa;
}

export function createMysteryUI({game, title, content, close, save, guide, useLegacy, speciesName, stageCourt}) {
  const mystery = game.mystery, state = mystery.state;
  const owned = id => state.evidence.includes(id);
  const conversations = new Map();
  let currentContact = null;
  const caseEvidence = c => evidence.filter(e => e.caseId===c.id || c.mandatoryEvidenceIds.includes(e.id));
  function page(heading, context) {
    title.textContent = heading;
    content.replaceChildren();
    const body = element(content,'div',null,'mq-page');
    if (context) element(body,'p',context,'mq-context');
    const dialog = content.closest('dialog');
    if (dialog) dialog.scrollTop = 0;
    title.tabIndex = -1;
    title.focus({preventScroll:true});
    return body;
  }
  const proofs = createProofs({mystery, page, save, close, book, dialogue, stageCourt, seed:game.state.flightSeed});
  function addDestination(parent, locId, label) {
    const location = place.get(locId);
    const b = button(parent,label || regionName(location.regionId)+'　'+location.nameJa,()=>guide(locId),'mq-route');
    b.dataset.location = locId;
    return b;
  }
  function front() {
    const body = page('謎解き帖','十五景もち寄り帖');
    const cover = element(body,'div',null,'mq-cover');
    const art = element(cover,'img'); art.src=artRoot+'journal.webp'; art.alt='';
    const imprint = element(cover,'div');
    element(imprint,'h3','消された続き');
    const solved = cases.filter(c=>state.status[c.id]==='resolved').length;
    element(imprint,'p',solved ? '全七話のうち、'+solved+'話を記録' : '初日の出の浦に、いつもどおり杵の音が響く。');
    for (const c of cases.filter(c=>mystery.meets(c.prerequisites))) {
      const status = state.status[c.id];
      const item = button(body,'',()=>book(c.id),'mq-chapter');
      element(item,'small',chapter(c)+'　'+regionName(c.originRegion));
      element(item,'strong',c.titleJa);
      element(item,'span',status==='resolved'?'結び':status==='active'?'調査中':'頼み事');
      item.dataset.case=c.id;
    }
    const early = evidence.filter(e=>owned(e.id) && !cases.some(c=>state.status[c.id]!=='unaccepted' && caseEvidence(c).includes(e)));
    if (early.length) {
      const notes = disclosure(body,'旅の途中で記録した資料');
      for (const e of early) button(notes,e.nameJa,()=>record(e,front));
    }
  }
  function nextRequests(parent) {
    for (const next of cases.filter(c=>state.status[c.id]!=='resolved' && mystery.meets(c.prerequisites))) {
      const title = regionName(next.originRegion)+'の'+(state.status[next.id]==='active'?'調査に戻る':'頼み事');
      button(parent,title,()=>book(next.id),'mq-route');
    }
  }
  function ending(parent) {
    const scene = section(parent,'空けておく場所');
    element(scene,'p','白枝が手帖を閉じると、廊下の向こうから食器の重なる音がした。浦では、今ごろ何の音がしているだろう。');
    addDestination(scene,'LOC_DAWN_RACK','初日の出の浦を再訪する');
  }
  function book(caseId) {
    currentContact = null;
    const c = cases.find(c=>c.id===caseId);
    if (!c || !mystery.meets(c.prerequisites)) return front();
    const status = state.status[c.id];
    const body = page(c.titleJa,chapter(c)+'　／　'+regionName(c.originRegion));
    if (status === 'unaccepted') {
      element(body,'p',c.premiseJa,'mq-lead');
      addDestination(body,c.startLocationId,character.get(c.requesterNpcId).nameJa+'を訪ねる');
    } else {
      const resolved = status==='resolved';
      element(body,'p',resolved ? clue.get(c.resolvedFactId).descriptionJa : c.premiseJa,'mq-lead');
      const items = caseEvidence(c);
      if (!resolved) {
        const court = trials.find(t=>t.id===c.trialId);
        const ready = court && mystery.meets(court.readyCondition);
        if (ready) addDestination(body,court.venueLocationId,'京の評定所へ');
        else if (mystery.meets(c.completionCondition)) addDestination(body,c.startLocationId,character.get(c.requesterNpcId).nameJa+'に報告する');
        const puzzles = inferences.filter(i=>i.caseId===c.id && i.stage==='field' && !state.inferences.includes(i.id));
        const available = puzzles.filter(i=>mystery.canInfer(i.id));
        if (available.length) {
          const group = section(body,'推理');
          for (const i of available) button(group,i.promptJa,()=>proofs.infer(i),'mq-primary').dataset.inference=i.id;
        }
        const prospects = items.filter(e=>!owned(e.id) && e.acquisition.mode!=='resolution' && mystery.meets(e.acquisition.condition));
        if (prospects.length) {
          const leads = disclosure(body,'調べに行く場所');
          for (const id of new Set(prospects.map(e=>e.locationId))) addDestination(leads,id);
        }
        if (puzzles.length && !available.length) {
          const tips = disclosure(body,'調査の手引き');
          const puzzle = puzzles[0]; let step = 0;
          const more = button(tips,'ヒントを読む',() => {
            const p = element(tips,'p',puzzle.hintsJa[step++]);
            tips.insertBefore(p,more); more.hidden=step>=puzzle.hintsJa.length;
          },'mq-link');
        }
      }
      const files = items.filter(e=>owned(e.id));
      if (files.length) {
        const shelf = disclosure(body,'記録した資料　'+files.length+'件');
        for (const e of files) button(shelf,e.nameJa,()=>record(e,()=>book(c.id)));
      }
      const known = inferences.filter(i=>i.caseId===c.id && state.inferences.includes(i.id));
      if (known.length) {
        const findings = disclosure(body,'確かめた推理');
        for (const i of known) { element(findings,'h4',i.promptJa); element(findings,'p',i.reasoningJa); }
      }
      if (resolved) {
        nextRequests(body);
        if (c.id==='C07') ending(body);
      }
    }
    button(body,'謎解き帖の目次へ',front,'mq-link');
  }
  function record(e,back) {
    if (!owned(e.id)) return;
    const body = page(e.nameJa,'謎解き帖　／　'+place.get(e.locationId).nameJa);
    element(body,'p',e.descriptionJa,'mq-lead');
    exhibitPlate(body,e.id);
    if (e.establishesJa) element(section(body,'確かめたこと'),'p',e.establishesJa);
    if (e.doesNotProveJa) element(section(body,'まだ分からないこと'),'p',e.doesNotProveJa);
    if (e.acquisition.mode==='reconstruct') button(body,'検分を振り返る',()=>{
      const area = page(e.nameJa,'手帖の記録');
      reconstruct(area,e.id,()=>record(e,back));
    });
    button(body,'手帖に戻る',back,'mq-link');
  }
  function heard(e, main) {
    return e.acquisition.mode==='talk' && e.npcId===main.npcId && mystery.meets(e.acquisition.condition);
  }
  function dialogue(id) {
    const d = node.get(id);
    if (!d || !mystery.meets(d.condition)) return close();
    const e = clue.get(d.evidenceId);
    const body = page(e && d.speakerJa==='調べる' ? objectName(e) : d.speakerJa,
      d.speakerJa==='調べる' ? place.get(d.locationId)?.nameJa : character.get(d.npcId)?.nameJa === d.speakerJa ? place.get(currentContact?.locationId || d.locationId)?.nameJa : '');
    body.dataset.node = d.id;
    element(body,'p',d.textJa,'mq-lines mq-lead');
    if (e && (d.id===e.acquisition.dialogueId || d.id.endsWith('_RECORDED'))) {
      const facsimile = disclosure(body,'資料を手に取る');
      facsimile.ontoggle=()=>{if(facsimile.open && facsimile.children.length===1) exhibitPlate(facsimile,e.id);};
    }
    const buttons = element(body,'div',null,'mq-actions');
    for (const choice of d.choices.filter(ch=>mystery.meets(ch.condition))) {
      const click = () => {
        const result = mystery.choose(d.id,choice.id);
        if (!result.ok) { element(body,'p',result.feedback,'mq-feedback'); return; }
        save();
        const action = result.uiAction || choice.uiAction;
        if (d.id.endsWith('_COURT_ROUTE')) return guide('LOC_KYO_COURT');
        const next = () => result.nextId ? dialogue(result.nextId) : close();
        if (action?.type==='openCaseNotebook') return book(action.caseId);
        if (action?.type==='openNotebook') return book(d.caseId);
        if (action?.type==='openInference') return proofs.infer(inferences.find(i=>i.id===action.inferenceId));
        if (action?.type==='playEvidenceReconstruction') {
          const area = page(objectName(clue.get(action.evidenceId)),'検分');
          return reconstruct(area,action.evidenceId,next);
        }
        next();
      };
      const b = button(buttons,choice.labelJa,click,choice.effects?.length || d.choices.length===1?'mq-primary':'mq-choice');
      b.dataset.choice=choice.id;
      if (d.choices.length===1 && choice.nextId && !choice.effects.length) b.dataset.advance='true';
    }
    if (currentContact?.npcId && d.npcId===currentContact.npcId &&
      (d.id===mystery.requesterDialogue(cases.find(c=>c.requesterNpcId===d.npcId)?.id) || d.id==='D_'+d.npcId+'_INTRO')) {
      for (const ev of evidence.filter(ev=>heard(ev,currentContact))) {
        const b = button(buttons,objectName(ev),()=>dialogue(ev.acquisition.dialogueId));
        b.dataset.evidence=ev.id;
      }
      const intro = 'D_'+d.npcId+'_INTRO';
      if (d.id!==intro && node.has(intro)) button(buttons,'近ごろのことを聞く',()=>dialogue(intro),'mq-link');
    }
    if (currentContact?.npcId && state.status.C07==='resolved') {
      const after='D_'+currentContact.npcId+'_EPILOGUE';
      if (node.has(after) && d.id!==after) button(buttons,'祭のその後を聞く',()=>dialogue(after),'mq-link');
    }
    if (/^D_C0[1-6]_POST$/.test(d.id)) nextRequests(buttons);
    if (d.id==='D_C07_POST_L2') ending(body);
  }
  function ordinary(entry) {
    const actor = entry.entity || game.state.npcs.find(n=>n.id===entry.legacyId);
    const town = ambient.find(a=>a.selector.regionId===(actor?.habitat || game.state.regionId)) ||
      ambient.find(a=>a.selector.regionId===game.state.regionId);
    const banks = [town, ambient.find(a=>a.selector.roleOrCraft && [actor?.role,actor?.craft].includes(a.selector.roleOrCraft)),
      ambient.find(a=>a.selector.species===actor?.type)].filter(Boolean);
    if (!banks.length) banks.push(ambient.find(a=>a.id==='AMB_DEFAULT'));
    const times = conversations.get(entry.legacyId) || 0;
    conversations.set(entry.legacyId,times+1);
    const bank = banks[times % banks.length];
    const body = page(entry.label || speciesName(actor?.type) || '里の住人',regionName(town?.selector.regionId));
    element(body,'p',bank.linesJa[Math.floor(times / banks.length) % bank.linesJa.length],'mq-lead');
    if (town?.onboardingHint && state.status.C01==='unaccepted') {
      element(body,'p',town.onboardingHint.textJa);
      addDestination(body,cases[0].startLocationId,'杵吉への道しるべを付ける');
    } else if(town?.rumor && mystery.meets(town.rumor.condition) && state.status[town.rumor.caseId]==='unaccepted') {
      element(body,'p',town.rumor.textJa);
    }
    button(body,'話を終える',close);
  }
  function interact(entry) {
    currentContact = entry;
    if (entry.npcId) {
      const c = cases.find(c=>c.requesterNpcId===entry.npcId);
      return dialogue(c ? mystery.requesterDialogue(c.id) : 'D_'+entry.npcId+'_INTRO');
    }
    if (entry.legacyId) return ordinary(entry);
    const loc = place.get(entry.locationId);
    if (!loc) return close();
    const body = page(loc.nameJa,regionName(loc.regionId));
    if (state.status.C07==='resolved') element(body,'p',afterword[loc.regionId],'mq-lead');
    const items = evidence.filter(e=>e.locationId===loc.id && !['talk','resolution'].includes(e.acquisition.mode) && mystery.meets(e.acquisition.condition));
    for (const e of items) {
      const b=button(body,(owned(e.id)?'✓　':'')+objectName(e),()=>dialogue(e.acquisition.dialogueId));
      b.dataset.evidence=e.id;
    }
    if (loc.id==='LOC_KYO_COURT' || loc.id==='LOC_KYO_JUDGE') {
      const hearings=trials.filter(t=>mystery.meets(t.readyCondition) || state.hearings[t.id]?.won);
      for (const t of hearings) {
        const c=cases.find(c=>c.id===t.caseId);
        button(body,c.titleJa+'　'+(state.hearings[t.id]?.won?'裁定を読む':'審理へ'),()=>proofs.hearing(t),'mq-primary').dataset.trial=t.id;
      }
      if (!hearings.length) element(body,'p','白洲は静かだ。審理の資料が揃ったら、ここで白枝と確かめよう。');
    } else if (!items.length) element(body,'p','今は静かだ。');
    button(body,'その場を離れる',close,'mq-link');
  }
  function contacts(entries) {
    currentContact=null;
    if (entries.length===1 && entries[0].action==='story') return interact(entries[0].target);
    const body=page('手をのばす',game.state.region);
    for (const choice of entries) {
      const b=button(body,choice.label,()=>choice.action==='story'?interact(choice.target):useLegacy());
      b.dataset.target=choice.target.npcId || choice.target.legacyId || choice.target.locationId || 'journey';
    }
  }
  return { book, contacts, interact, onClose() { currentContact=null; mystery.leaveTrial(); } };
}
