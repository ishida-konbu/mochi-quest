// Conversations are transient. The notebook commits an accepted request, an
// exchange or a deduction only after the player finishes the corresponding turn.
import { CAST, SCENES } from './mochiyori-story.js';
import { CHAPTER_LINES, CLUE_LINES, PROOF_LINES } from './mochiyori-lines.js';
import { everydayReplies, tastes } from './mochiyori-smalltalk.js';
import { entries } from './mochiyori-progress.js';
import { performedScenes, sceneLocation } from './mochiyori-scenes.js';
import { storySite } from './story-sites.js';

const courier = '配達人のお餅';
const people = new Map(CAST.map(person => [person.name, person]));
const locations = new Map(SCENES.map(scene => [scene.region, scene]));

// These are discoveries, in addition to physical item and witness requirements.
// Independent witnesses and the two branches of the search can be visited either way.
const discoveredAfter = {
  'joined-cake': ['leaf-marks'],
  prototype: ['steam-test'],
  'packing-bars': ['prototype'],
  'terrace-letter': ['crescent-case', 'sakai-boards', 'tsuruga-plates', 'spare-case'],
  'palace-consent': ['broken-hinge'],
  'omission-copy': ['submission-check'],
};
// The witness must have a reason to expect a delivery before asking for it.
// For example, the ports do not anticipate 八重's new dates during the freight inquiry.
const expectedDeliveries = {
  'steam-test': [], 'steam-repair': ['steam-test','prototype'],
  'cloth-test': ['wedding-filling','walnut-filling'],
  'changed-day': discoveredAfter['terrace-letter'],
  'matched-hinge': ['palace-consent'],
  'returned-tools': ['matched-hinge'],
};
const sameSite = (a, b) => a.region === b.region && (a.place || '') === (b.place || '');
const action = (id, label, run) => ({ id, label, run });
const guestLines = {
  勘兵衛: '受取の印はみんなそろった。今日は算盤をしまうよ。やれ、やっと両手で餅が持てるわい。',
  ちよ: '次の盆はあの二人にお任せ。私はここで一服さ。お餅さん、熱いお茶をもう一杯どう？',
  弥平: 'こっちの皿を、わしに？　そうか、今日は客じゃった。ささ、ありがとう。',
  八重: 'この席、空いていますか。……ありがとうございます。今日はここで、ゆっくりいただきます。',
  桃子: 'あのとき一緒に飲んだお茶、覚えてる？　今日は、うちの桃しずく餅もひとつどうぞ。',
  墨八: '鉢の水は十分。どの餅を最初に取るかねえ。腕が八本あっても口は一つだよ。',
  お澄: '最後の盆も届いたよ。さあ、今度は私が好きな餅を選ぶ番だ。',
  ささ: '弥平さん、蒸籠は預かっていますよ。今日はお皿だけ持って、どうぞ。',
};

// At the second hearing the player can check alternative explanations with
// the people concerned. None of these conversations substitutes for evidence.
const hearingQuestions = {
  玄鐘: ['鐘の音で時刻が分かりますか。', '音だけで刻を決めるのは難しいですな。あの鐘、あなたの三条通知が当たっても鳴るでしょう。', '同じ音でも、誰がどう鳴らしたかまでは分からないんですね。'],
  勘兵衛: ['検分の日も動かしたのですか。', 'いいや。わしの会計の綴りには元の日しかなかった。だから蔵が空っぽなのを見て、運び手を疑っちまったんだ。', '検分の予定と、港で受けた指示を別々に確かめます。'],
  お澄: ['運ぶ日を決めたのは、どなたですか。', '便を組み直したのは私。いつ届けてほしいかを決めたのは世話役さんだよ。敦賀の積み順と変更料を見れば、便が本当に変わったかも確かめられるよ。', '荷を運ぶ人が、その土地の出品まで取りやめるわけじゃないんですね。'],
  すずり: ['提出のあとで、書き写したものはありますか。', '写しは作りました。でも、お預かりした束はそのままです。紐と受理の控え、両方お確かめください。', '写した字を眺めるより、預かった束と突き合わせるのが確かですね。'],
  八重: ['各地からは、どんな相談がありましたか。', '今年はこれまでと同じにはできない、と。皆さん、それぞれご事情がありましたから。', 'どの仕事をどれだけ引き受けたのか、私からもお一人ずつ伺ってきます。'],
};

export function createStoryDialogue(book, { onChange = () => {} } = {}) {
  let frame = null, person = null, site = null;
  let advance = null;
  let options = [];
  const script = () => CHAPTER_LINES[book.current()?.id];
  const at = (name, destination) => person.name === name && sameSite(site, destination);
  const verdictSite = () => storySite(book.current().verdictRegion, book.current().verdictPlace);
  function requestSite() {
    const { opener, host } = script();
    if (!opener || opener === host) return verdictSite();
    const clue = book.current().clues.find(c => c.speaker === opener);
    return clue ? storySite(clue.region, clue.place) : storySite(people.get(opener).region);
  }
  function discovered(clue) {
    return (discoveredAfter[clue.id] || []).every(id => book.has(id));
  }
  function available(clue) {
    return book.requested && !book.has(clue.id) && discovered(clue) &&
      clue.requires.every(id => book.has(id)) && book.hasParcelFor(clue.id);
  }
  function expecting(clue) {
    return book.requested && expectedDeliveries[clue.id]?.every(id => book.has(id)) &&
      !book.hasParcelFor(clue.id) && !!CLUE_LINES[clue.id].missing;
  }
  function leads() {
    const chapter = book.current();
    if (!chapter) return [];
    const { opener, host } = script();
    if (!book.requested) return [{ id: 'request', person: opener || host, site: requestSite(), label: (opener || host) + 'に話しかける' }];
    if (book.ready()) return [{ id: 'verdict', person: host, site: verdictSite(), label: host + (chapter.id === 'festival' ? 'と祭を開く' : 'に調べたことを話す') }];
    return chapter.clues.filter(available).map(c => ({
      id: c.id, person: c.speaker, site: storySite(c.region, c.place), label: c.action,
    }));
  }
  function close() {
    frame = null; person = null; site = null; advance = null; options = [];
    return null;
  }
  function show(speaker, text, { next = close, choices = [], key } = {}) {
    options = choices;
    advance = next;
    frame = {
      person, site, speaker, text, choices: choices.map(({ id, label }) => ({ id, label })),
      ...(key && performedScenes.has(key) && { action: { key } }),
    };
    return frame;
  }
  function lines(turns, next, key = null) {
    if (!turns.length) return next();
    let i = 0;
    function turn() {
      const [speaker, text] = turns[i];
      return show(speaker, text, {
        key: i === 0 ? key : null,
        next: () => ++i < turns.length ? turn() : next(),
      });
    }
    return turn();
  }
  function witness(key) {
    if (book.seenAt(key) === undefined && book.remember(key, sceneLocation(site))) onChange();
  }
  const goodbye = () => action('bye', 'またあとで', close);
  function startRequest() {
    const chapter = book.current(), story = script();
    return lines(story.intro.slice(0, -1), () => {
      const [speaker, text] = story.intro.at(-1);
      return show(speaker, text, { choices: [
        action('accept', story.request, () =>
          lines(story.accepted, () => {
            if (book.current() === chapter && book.acceptRequest()) onChange();
            return localMenu();
          })),
        action('decline', '今は引き受けず、また来ます。', () =>
          show(person.name, 'ええ、また声をかけてください。')),
        action('other', 'ほかの話を聞く', localMenu),
      ] });
    });
  }
  function ask(clue) {
    const exchange = CLUE_LINES[clue.id];
    const chapter = book.current();
    return show(person.name, exchange.ask, { choices: [
      action('do', exchange.choice, () => {
        // Recheck possession when the player actually offers the item. A
        // promise to help, or selecting an affirmative reply, cannot supply it.
        if (!available(clue)) return show(person.name, exchange.missing || '手がかりがそろったら、また一緒に確かめよう。');
        return lines(exchange.lines, () => {
          const previousLeads = new Set(leads().map(lead => lead.id));
          if (book.current() === chapter && available(clue) && book.record(clue.id)) {
            book.remember('clue/' + clue.id, sceneLocation(site));
            onChange();
          }
          return followThrough(previousLeads);
        }, 'clue/' + clue.id);
      }),
      action('decline', '今はやめておきます。', () =>
        show(person.name, exchange.decline || 'じゃあ、手が空いたときに。')),
      action('other', 'ほかの話を聞く', localMenu),
    ] });
  }
  function guide(previousLeads) {
    const next = leads();
    const local = next.find(row => sameSite(row.site,site));
    const discovered = previousLeads && next.find(row => !previousLeads.has(row.id));
    if (previousLeads && !local && !discovered && next.length > 1)
      return show(courier, '聞けたことは帳面に記した。ほかの人の話も聞いてみよう。');
    const lead = local || discovered || next[0];
    if (!lead) return close();
    if (sameSite(lead.site, site) && lead.person === person.name) {
      return show(courier, 'もう一つ、ここで確かめていこう。', { next: localMenu });
    }
    const name = lead.person === '茶屋の亭主' ? '茶屋のご亭主' : lead.person + 'さん';
    if (sameSite(lead.site, site)) return show(courier, 'あそこに' + name + 'がいる。声をかけてみよう。');
    return show(courier, '次は' + lead.site.name + 'の' + name + 'に話を聞こう。');
  }
  function proof() {
    const chapter = book.current();
    const i = book.proofIndex, test = chapter.proofs[i];
    if (!test) return conclude();
    const speech = PROOF_LINES[chapter.id][i];
    function evidence() {
      return show(person.name, speech.question, { choices: test.evidence.filter(id => book.has(id)).map(id => {
        const note = entries.get(id);
        return action('evidence/' + id, note.title + 'を示す', () => {
          if (id !== test.answer) return show(courier, 'この控えにあるのは……「' + note.note + '」か。もう一度、問いに合うものを探そう。', { next: evidence });
          return reason(id);
        });
      }) });
    }
    function reason(id) {
      return show(person.name, speech.reason, { choices: test.choices.map((choice, n) =>
        action('reason/' + n, choice.text, () => {
          if (n !== test.correct) return show(courier, choice.feedback, { next: () => reason(id) });
          return interviews(0, () => show(person.name, speech.success, {
            key: 'proof/' + chapter.id + '/' + i,
            next: () => {
              if (book.current() === chapter && book.proofIndex === i && book.prove(id, n)) {
                book.remember('proof/' + chapter.id + '/' + i, sceneLocation(site));
                onChange();
              }
              return proof();
            },
          }));
        })),
      });
    }
    function interviews(index, done) {
      const witness = test.interviews[index];
      if (!witness) return done();
      return show(courier, 'ご本人の言葉も聞かせてほしい。', { choices: [
        action('interview', witness.speaker + 'さん、' + witness.question, () =>
          show(witness.speaker, witness.text.replace(/^「|」$/g, ''), { next: () => interviews(index + 1, done) })),
      ] });
    }
    return evidence();
  }
  function conclude() {
    const chapter = book.current();
    return lines(script().ending, () => {
      if (book.current() === chapter && book.finish()) {
        book.remember('end/' + chapter.id, sceneLocation(site));
        onChange();
      }
      return close();
    }, 'end/' + chapter.id);
  }
  function ambient() {
    const guest = !book.current() && sameSite(site, storySite('kyo')) && guestLines[person.name];
    const resting = person.name === '弥平' && site.region === 'peach';
    const memory = (guest ? 'guest/' : resting ? 'rest/' : 'talk/') + person.id;
    const key = performedScenes.has(memory) ? memory : null;
    const greeting = guest || performedScenes.get(key)?.line || person.line || '道中、ひと息入れていっておくれ。';
    const reply = guest && person.name === 'ちよ' ? 'ええ、いただきます。ちよさんも、冷めないうちにどうぞ。'
      : guest ? '私もお皿を持ってきます。今日は一緒にいただきましょう。'
      : resting ? 'お湯が冷めないうちに。私もここで、一杯ご一緒します。' : everydayReplies[person.name];
    return lines([[person.name, greeting], [courier, reply]], () => {
      if (key) witness(key);
      return localMenu();
    }, key);
  }
  function sampleFood(food) {
    const key = 'food/' + food.region;
    return lines(tastes[food.region].map(text => [courier, text]), () => {
      witness(key);
      return close();
    }, key);
  }
  function followThrough(previousLeads) {
    if (book.ready()) {
      const host = script().host, destination = verdictSite();
      if (book.current().id === 'festival') return show(courier, destination.name + 'へ行こう。' + host + 'さんと一緒に、みんなを席に迎えよう。');
      // Leave the field interview before the hearing begins. This gives the
      // invited witnesses a place at the table even if the last clue was here.
      return show(courier, sameSite(site, destination)
        ? host + 'さんに声をかけて、皆さんと話をまとめよう。'
        : destination.name + 'へ戻ろう。' + host + 'さんに会って、調べたことをお話ししよう。');
    }
    const local = leads().some(lead => at(lead.person, lead.site));
    // Stay with a witness when the next question is theirs. Otherwise the
    // notebook now carries their testimony and the traveller can leave.
    if (local) return localMenu();
    return guide(previousLeads);
  }
  function localMenu() {
    const chapter = book.current();
    const choices = [];
    if (chapter && !book.requested && at(script().opener || script().host, requestSite())) {
      choices.push(action('request', '困りごとを聞く', startRequest));
    }
    if (chapter && book.requested) {
      if (book.ready() && at(script().host, verdictSite())) {
        choices.push(action('verdict', chapter.id === 'festival' ? 'みんなを席に迎えよう。' : '調べてきたことを話します。', proof));
      }
      const topics = chapter.clues.filter(c => c.speaker === person.name && !book.has(c.id) && sameSite(site, storySite(c.region, c.place)));
      for (const clue of topics.filter(available)) {
        choices.push(action('clue/' + clue.id, clue.action, () => ask(clue)));
      }
      // A real delivery can be attempted at the counter without the parcel.
      // Hide other locked discoveries, which often contain later revelations.
      if (!choices.length) {
        const missing = topics.find(expecting);
        if (missing) choices.push(action('clue/' + missing.id, '頼まれた品のことを聞く', () => ask(missing)));
      }
    }
    if (chapter && !choices.length) choices.push(action('guidance', '次は誰に会えばいいかな。', guide));
    const question = chapter?.id === 'mystery_07' && book.requested && hearingQuestions[person.name];
    if (question) choices.push(action('question', question[0], () =>
      lines([[person.name, question[1]], [courier, question[2]]], close)));
    choices.push(action('ambient', 'いつもの仕事の話を聞く', ambient));
    const food = locations.get(site.region);
    if (food && (!site.place || ['teahouse','court','shore'].includes(site.place)))
      choices.push(action('food', food.mochi + 'を味わう', () => sampleFood(food)));
    choices.push(goodbye());
    return show(courier, '何を話そうかな。', { choices });
  }
  function start(nextPerson, nextSite) {
    close();
    if (!nextPerson?.name || !nextSite?.region) return null;
    person = nextPerson; site = nextSite;
    if (book.current() && !book.requested && at(script().opener || script().host, requestSite())) return startRequest();
    if (book.index === 0 && !book.requested && site.region === 'river') {
      const call = person.name === '卯助'
        ? 'おっと、舟はまだ出せねえよ。餅がひとつ足りないって、おはなさんがあの籠を何度も数え直してるんだ。'
        : '渡し舟なら、もう少し待っておくれ。あそこで餅を数えているおはなさんが、困っているようだよ。';
      return show(person.name, call, { choices: [
        action('visit', 'おはなさんに事情を聞いてみます。', close),
        action('other', 'こちらでもう少し話を聞く', localMenu),
      ] });
    }
    const active = leads().filter(lead => at(lead.person, lead.site));
    if (active.length === 1 && active[0].id !== 'verdict') return ask(entries.get(active[0].id));
    if (active.length || book.current()?.clues.some(c => c.speaker === person.name && !book.has(c.id) &&
      sameSite(site, storySite(c.region, c.place)) && expecting(c))) return localMenu();
    return ambient();
  }
  function step(choiceId) {
    if (!frame) return null;
    if (options.length) {
      const selected = options.find(option => option.id === choiceId);
      return selected ? selected.run() : frame;
    }
    return choiceId == null ? advance() : frame;
  }
  return { start, step, close, leads, get frame() { return frame; } };
}
