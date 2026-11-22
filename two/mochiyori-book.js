import { BOUND, REGIONS } from './terrain.js';
import { CAST, CHAPTERS, SCENES, SUPPLY_REGISTER } from './mochiyori-story.js';
import { chapterLabel, entries, placeKey } from './mochiyori-progress.js';
import { locationFor, peopleAt, siteActions, verdictHere } from './mochiyori-world.js';
import { memoryScene, performedScenes, sceneLocation } from './mochiyori-scenes.js';
import { createStudy } from './mochiyori-study.js';

const cast = new Map(CAST.map(person => [person.id, person]));
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = Array.isArray(text) ? text.join('　') : text;
  return node;
}
function button(label, fn, cls = 'folio-button') {
  const b = el('button',cls,label);
  b.type = 'button';
  b.onclick = fn;
  return b;
}
const regionName = region => SCENES.find(s => s.region === region)?.name || region;
const titleOf = clue => clue.title || clue.action;

export function createBookView({dialog, body, heading, book, save, track, here, invalidate, perform}) {
  const study = createStudy();
  let location = null;
  function reset(title, kicker, subtitle) {
    study.clear();
    dialog.dataset.folio = '';
    body.replaceChildren();
    heading.textContent = title;
    const inner = el('article','folio');
    const meta = el('p','folio-meta',kicker);
    inner.append(meta);
    if (subtitle) inner.append(el('h3','folio-heading',subtitle));
    body.append(inner);
    dialog.scrollTop = 0;
    return inner;
  }
  function showArtwork(container, festival = false) {
    const img = el('img','folio-art');
    img.src = './assets/world/'+(festival ? 'mochiyori-festival.webp' : 'mochiyori-frontispiece.webp');
    img.alt = festival ? '京の大路で卓を囲む動物たちに、新しい二つの盆が届く。' : '桜の下、兎と蛙が籠をのぞき、配達人のお餅が見守る。';
    container.append(img);
  }
  const appendHeading = (container, name) => container.append(el('h4','folio-section',name));
  function addRow(list, label, detail, fn, sealed = false) {
    const row = button('',fn,'folio-row');
    if (sealed) row.classList.add('recorded');
    row.append(el('span','row-main',label),el('small','row-note',detail),el('span','row-arrow','›'));
    row.lastChild.setAttribute('aria-hidden','true');
    list.append(row);
    return row;
  }
  function tabs(container, name) {
    const bar = el('nav','folio-tabs');
    bar.setAttribute('aria-label','帳面の頁');
    for (const [label,fn] of [['いまの頼まれごと',overview],['旅の記録',archive],['場面の回想',memories]]) {
      const b = button(label,fn);
      if (name === label) b.setAttribute('aria-current','page');
      bar.append(b);
    }
    container.prepend(bar);
  }
  function play(key, dest, done, cancel=done) {
    const score=memoryScene(book,key,dest);
    if(!score) throw new Error('未収録の場面 '+key);
    study.clear();
    perform(score,complete => (complete ? done : cancel)(),() => {
      if(!book.seen(key)){book.remember(key,sceneLocation(score.site));save();}
    });
  }
  function memories() {
    const wrap=reset('場面の回想','もち寄り帖','思い返す場面を選ぶ');
    tabs(wrap,'場面の回想');
    const groups=new Map();
    for(const [key,score] of performedScenes){
      if(!book.seen(key)) continue;
      const heading=score.chapter ? chapterLabel(CHAPTERS.indexOf(score.chapter)+1)+'　'+score.chapter.title : score.category;
      if(!groups.has(heading)){
        const group=el('details','folio-chapter');group.open=groups.size===0;
        group.append(el('summary','',heading));wrap.append(group);groups.set(heading,group);
      }
      const site=memoryScene(book,key).site;
      addRow(groups.get(heading),score.title,site.name+'　·　'+score.category,()=>play(key,null,memories),true);
    }
    if(!groups.size)wrap.append(el('p','folio-intro','土地の人と過ごした場面が、ここに残ります。桜川の渡し場で、まず一人に話を聞いてみよう。'));
  }
  function gotoLead(id, dest) {
    if (here()?.key === dest.key) return site(dest);
    if (book.track(id)) { save(); track(dest); }
  }
  function overview() {
    const chapter = book.current();
    if (!chapter) return ending();
    const wrap = reset(book.index === 0 ? '配達人の旅控え' : '十七景もち寄り帖',chapterLabel(book.index+1),chapter.title);
    tabs(wrap,'いまの頼まれごと');
    if (book.index === 0) showArtwork(wrap);
    wrap.append(el('p','folio-intro',chapter.opening));
    wrap.append(el('blockquote','folio-question',chapter.question));
    appendHeading(wrap,book.ready() ? (book.index === 7 ? '祭を開く場所' : '話をまとめる場所') : '次に確かめられること');
    if (book.ready()) {
      const dest = locationFor(chapter.verdictRegion,chapter.verdictPlace);
      addRow(wrap,dest.name,here()?.key === dest.key ? 'ここで話をまとめる' : regionName(dest.region) + 'へ道しるべを付ける',() => gotoLead('verdict',dest));
    } else {
      for (const clue of book.leads()) {
        const dest = locationFor(clue.region,clue.place);
        addRow(wrap,clue.action,regionName(clue.region)+'　·　'+dest.name+(book.pin === clue.id ? '　道しるべ' : ''),() => gotoLead(clue.id,dest));
      }
    }
    if (book.pin) wrap.append(button('道しるべを外す',() => {book.track(null); save(); overview();},'folio-link'));
  }
  function archive() {
    const wrap = reset('旅の記録','もち寄り帖','見たこと、聞いたこと');
    tabs(wrap,'旅の記録');
    let count = 0;
    const chapters = CHAPTERS.slice(0,book.index+1);
    for (const [i,ch] of chapters.entries()) {
      const notes = ch.clues.filter(c => book.has(c.id));
      if (!notes.length && i >= book.index) continue;
      count += notes.length;
      const group = el('details','folio-chapter');
      group.open = i === Math.min(book.index,CHAPTERS.length-1);
      group.append(el('summary','',chapterLabel(i+1)+'　'+ch.title+'　('+notes.length+')'));
      for (const kind of ['観察','証言']) {
        for (const c of notes.filter(c => c.kind === kind)) addRow(group,titleOf(c),kind+'　·　'+c.speaker,()=>entry(c,archive),true);
      }
      if (i < book.index) group.append(el('p','folio-resolution','推理　'+ch.resolution));
      wrap.append(group);
    }
    if (!count) wrap.append(el('p','folio-intro','桜川の渡しで、兎と蛙の話を聞いてみよう。見たもの、聞いた言葉はここで読み返せる。'));
  }
  function site(dest) {
    location = dest;
    const chapter = book.current();
    const relevant = chapter?.clues.some(c => placeKey(c.region,c.place) === dest.key) || verdictHere(dest,book);
    const wrap = reset(dest.name,regionName(dest.region),relevant ? chapter.title : chapter ? '土地の人に聞く' : '祭のあとの一服');
    const local = here()?.key === dest.key;
    if (!local) { overview(); return; }
    if (chapter) {
      if (relevant) wrap.append(el('p','folio-intro',chapter.clues.some(c => book.has(c.id)) ? chapter.question : chapter.opening));
      const choices = siteActions(dest,book);
      if (choices.length) {
        appendHeading(wrap,'調べる・尋ねる');
        for (const clue of choices) addRow(wrap,clue.action,clue.kind+'　·　'+clue.speaker,() => book.seen('clue/'+clue.id) ? entry(clue,()=>site(dest)) : play('clue/'+clue.id,dest,()=>entry(clue,()=>site(dest)),()=>site(dest)));
      }
      if (verdictHere(dest,book) && book.ready()) {
        wrap.append(button(book.index === 7 ? 'もち寄り祭を開く' : book.index >= 5 ? '白洲で証拠を示す' : '推理を話す',() => proof(),'folio-primary'));
      }
      const localNotes = chapter.clues.filter(c => placeKey(c.region,c.place) === dest.key && book.has(c.id));
      if (localNotes.length) {
        const group = el('details','folio-chapter');
        group.append(el('summary','','この場所で得た手掛かり　'+localNotes.length));
        for (const clue of localNotes) addRow(group,titleOf(clue),clue.kind,() => entry(clue,()=>site(dest)),true);
        wrap.append(group);
      }
    }
    const residents = peopleAt(dest,book);
    if (residents.length) {
      appendHeading(wrap,'そばにいる人');
      const choices = el('div','folio-people');
      for (const person of residents) choices.append(button(person.name,() => {
        const guestKey='guest/'+person.id;
        const resting=dest.region==='peach' && performedScenes.has('rest/'+person.id);
        const key=!book.current() && dest.key===placeKey('kyo') && performedScenes.has(guestKey) ? guestKey : resting ? 'rest/'+person.id : 'talk/'+person.id;
        play(key,dest,()=>conversation(person,dest),()=>site(dest));
      }));
      wrap.append(choices);
    }
    const landscape = SCENES.find(s => s.region === dest.region);
    if (landscape && dest.place !== 'road-tea') {
      const dish = el('details','folio-chapter');
      dish.append(el('summary','','土地の餅　'+landscape.mochi),el('p','folio-note',landscape.appearance+'　'+landscape.taste));
      dish.append(button(landscape.mochi+'を手に取る',() => play('food/'+dest.region,dest,() => {
        const view=reset(dest.name,landscape.name+'　·　土地の餅',landscape.mochi);
        displayModel(view,{food:dest.number,label:landscape.mochi});
        view.append(el('p','folio-note',landscape.appearance+'　'+landscape.taste),button('仕事場に戻る',()=>site(dest)));
      },()=>site(dest))));
      wrap.append(dish);
    }
    wrap.append(button('帳面を開く',overview,'folio-link'));
  }
  function displayModel(container, spec, interactive) {
    const figure = el('figure','folio-study');
    const pane = el('div','study-pane');
    figure.append(pane);
    container.append(figure);
    if (!study.show(pane,spec)) pane.replaceWith(el('p','folio-note','品物の控えを手元に広げた。'));
    const controls = el('figcaption','study-controls');
    controls.append(button('左へ回す',()=>study.turn(-Math.PI/4,0)),button('右へ回す',()=>study.turn(Math.PI/4,0)));
    if (!spec.person) controls.append(button('裏を見る',()=>study.flip()));
    figure.append(controls);
    if (interactive) interactive(figure,controls);
  }
  function conversation(person,dest) {
    const farewells = {
      弥平:'「ああ、手伝いを頼まれたんじゃなかったな。……こっちの皿を、わしに？　それじゃあ、いただこう」',
      八重:'「この席、空いていますか。……ありがとうございます。今日はここで、ゆっくりいただきます」',
      桃子:'「あのとき一緒に飲んだお茶、覚えてる？　今度はうちの桃しずく餅も、ひとつどうぞ」',
      墨八:'「鉢の水は十分。あとは皿だ。この腕が八本とも空いている日に、どの餅からいくかね」',
      お澄:'「最後の盆も届いたよ。さあ、今度は私が好きな餅を選ぶ番だ」',
      ささ:'「弥平さん。蒸籠はこちらで預かっていますよ。今日はお皿だけ持って、どうぞ」'
    };
    const festivalGuest = !book.current() && dest.key === placeKey('kyo');
    const wrap = reset(person.name,regionName(dest.region)+'　·　'+(person.occupation || person.role),person.name+'の話');
    const grid = el('div','folio-spread'),words=el('div','folio-words');
    wrap.append(grid);
    displayModel(grid,{person,festivalGuest,label:person.name});
    const resting=dest.region==='peach' && performedScenes.get('rest/'+person.id);
    words.append(el('blockquote','folio-dialogue',(festivalGuest && farewells[person.name]) || resting?.line || person.line));
    for (const c of siteActions(dest,book).filter(c => c.characterId === person.id))
      addRow(words,c.action,c.kind,()=>play('clue/'+c.id,dest,()=>entry(c,()=>site(dest)),()=>site(dest)));
    words.append(button('聞き込みに戻る',()=>site(dest)));
    grid.append(words);
  }
  function supplyRegister(container, clueId) {
    const local = SUPPLY_REGISTER.filter(record => {
      const source = record.region === 'kyo' ? 'kyoto-set' : 'regional-returns';
      return clueId === source || book.has(source);
    });
    const panel = el('section','supply-register');
    panel.append(el('h4','folio-section','道具の所在　'+local.length+'組／十五組'));
    const map = el('div','supply-map'), pin = el('span','supply-pin'), readout = el('p','folio-note');
    map.append(pin);
    const picker = el('select','supply-picker');
    const label = el('label','supply-select','受取先を選ぶ');
    label.append(picker);
    for (const item of local) {
      const opt=el('option','',regionName(item.region));
      opt.value=item.region;
      picker.append(opt);
    }
    function select() {
      const item = local.find(r => r.region === picker.value);
      const point = REGIONS.find(r => r.id === item.region);
      pin.style.left = (50+point.x*50/BOUND)+'%';
      pin.style.top = (50+point.z*50/BOUND)+'%';
      readout.textContent = item.holder+'　'+item.use;
      map.setAttribute('aria-label',regionName(item.region)+'の地図上の位置');
    }
    map.setAttribute('role','img');
    readout.setAttribute('aria-live','polite');
    picker.onchange = select;
    select();
    panel.append(map,label,readout);
    container.append(panel);
  }
  function entry(c,back) {
    const known = book.has(c.id);
    const wrap = reset(known ? '手掛かりの控え' : c.kind === '証言' ? '聞き込み' : '品物の検分',regionName(c.region)+'　·　'+c.kind,known ? titleOf(c) : c.action);
    const grid = el('div','folio-spread'), words = el('div','folio-words');
    const person = c.kind === '証言' ? cast.get(c.characterId) : null;
    wrap.append(grid);
    const spec = person ? {person,label:c.speaker} : {prop:c.prop || 'ledger',clueId:c.id,label:titleOf(c)};
    const canRecord = !known && here()?.key === placeKey(c.region,c.place) && book.leads().includes(c);
    const description = el('blockquote','folio-dialogue',c.text);
    const record = button('帳面に記す',() => {
      if (!book.record(c.id)) return;
      invalidate(); save();
      const localNext = book.leads().some(n => placeKey(n.region,n.place) === placeKey(c.region,c.place));
      if (localNext || (book.ready() && verdictHere(location,book))) site(location);
      else overview();
    },'folio-primary');
    displayModel(grid,spec);
    words.append(button('この場面をもう一度見る',()=>play('clue/'+c.id,null,()=>entry(c,back))));
    words.append(el('p','folio-speaker',c.speaker),description);
    if (known) words.append(el('p','folio-note',c.kind+'の控え　'+c.note));
    grid.append(words);
    if (['regional-returns','kyoto-set'].includes(c.id)) supplyRegister(wrap,c.id);
    if (canRecord && book.seen('clue/'+c.id)) words.append(record);
    words.append(button('戻る',back,'folio-link'));
  }
  function proof(feedback = '', selected = null) {
    const chapter = book.current();
    if (!chapter || !book.ready() || !here() || !verdictHere(here(),book)) return overview();
    const index = book.proofIndex, step = chapter.proofs[index];
    if (!step) return resolve(chapter);
    const wrap = reset(chapter.verdictPlace === 'court' ? '京の評定所' : '帳面をひもとく',
      chapterLabel(book.index+1)+'　·　'+(index+1)+' / '+chapter.proofs.length,step.title || chapter.title);
    wrap.append(el('blockquote','folio-question',selected ? step.reason : step.question));
    if (feedback) {
      const line = el('p','folio-feedback',feedback);
      line.setAttribute('role','status'); wrap.append(line);
    }
    if (!selected) {
      appendHeading(wrap,'どの手掛かりを示す？');
      for (const id of step.evidence) {
        const c = entries.get(id);
        if (!c || !book.has(id)) continue;
        addRow(wrap,titleOf(c),c.kind+'　·　'+c.note,() => {
          if (id === step.answer) proof('',id);
          else proof('「'+titleOf(c)+'」の控えにはこうある。'+c.note+'　今回の問いに直接答える手掛かりを探してみよう。');
        });
      }
    } else {
      const c = entries.get(selected);
      wrap.append(el('p','folio-note',titleOf(c)+'　'+c.note));
      for (const [i,choice] of step.choices.entries()) {
        wrap.append(button(choice.text,() => {
          if (i !== step.correct) return proof(choice.feedback || 'この説明を支える記録をもう一度読んでみよう。',selected);
          const conclude = () => play('proof/'+chapter.id+'/'+index,here(),() => {
            if (!book.prove(selected,i)) return;
            save();
            const success = reset('推理の控え',chapterLabel(book.index+1),step.title || chapter.title);
            success.append(el('p','folio-resolution',step.success || choice.text));
            success.append(button(book.proofIndex === chapter.proofs.length ? '話を結ぶ' : '次の問いへ',() => proof(),'folio-primary'));
          },()=>proof('',selected));
          if (!step.interviews?.length) return conclude();
          const panel = reset('二人の返事',chapter.title,'それぞれの言葉で聞く');
          const next = button('二人の話を記す',conclude,'folio-primary');
          next.disabled = true;
          const seen = new Set();
          for (const person of step.interviews) {
            const line = el('p','folio-dialogue',person.text);
            const open = button(person.speaker+'に聞く　'+person.question,() => {
              line.hidden = false;
              seen.add(person.speaker);
              next.disabled = seen.size !== step.interviews.length;
            },'folio-option');
            line.hidden = true;
            panel.append(open,line);
          }
          panel.append(next);
        },'folio-option'));
      }
      wrap.append(button('証拠を選び直す',()=>proof(),'folio-link'));
    }
  }
  function resolve(chapter) {
    play('end/'+chapter.id,here(),()=>finishChapter(chapter),()=>site(location));
  }
  function finishChapter(chapter) {
    if (!book.finish()) return overview();
    invalidate(); save();
    const last = !book.current();
    const wrap = reset(last ? 'もち寄り祭' : '一巻の結び',chapterLabel(book.index),chapter.title);
    if (last) showArtwork(wrap,true);
    wrap.append(el('p','folio-resolution',chapter.resolution));
    wrap.append(button(last ? '十七景の記録を読む' : '次の頼まれごとを読む',last ? archive : overview,'folio-primary'));
  }
  function ending() {
    const wrap = reset('十七景もち寄り帖','結び','十七の土地が、同じ席につく');
    tabs(wrap,'いまの頼まれごと'); showArtwork(wrap,true);
    wrap.append(el('p','folio-resolution',CHAPTERS.at(-1).resolution),button('旅の記録を読む',archive,'folio-primary'));
  }
  return {open(dest) { location = dest; dest ? site(dest) : overview(); }, close() { study.clear(); delete dialog.dataset.folio; }};
}
