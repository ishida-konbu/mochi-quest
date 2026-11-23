import { BOUND, REGIONS } from './terrain.js';
import { CAST, CHAPTERS, SCENES, SUPPLY_REGISTER } from './mochiyori-story.js';
import { chapterLabel } from './mochiyori-progress.js';
import { memoryScene, performedScenes, sceneLocation } from './mochiyori-scenes.js';
import { CLUE_LINES } from './mochiyori-lines.js';
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

export function createBookView({dialog, body, heading, book, dialogue, save, track, perform}) {
  const study = createStudy();
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
  function overview() {
    const chapter = book.current();
    if (!chapter) return ending();
    const wrap = reset(book.index === 0 ? '配達人の旅控え' : '十七景もち寄り帖',chapterLabel(book.index+1),chapter.title);
    tabs(wrap,'いまの頼まれごと');
    if (book.index === 0) showArtwork(wrap);
    if (book.requested) wrap.append(el('blockquote','folio-question',chapter.question));
    const items = book.items();
    if (items.length) {
      appendHeading(wrap,'預かっている品');
      wrap.append(el('p','folio-note',items.join('、')));
    }
    appendHeading(wrap,'訪ねる相手');
    for (const lead of dialogue.leads()) {
      const {site, person, label, id} = lead;
      const detail = site.name + (book.pin === id ? '　·　道しるべ' : '　·　地図に印を付ける');
      addRow(wrap,label.includes(person) ? label : person+'　'+label,detail,() => {
        if (book.track(id)) { save(); track(site); }
      });
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
  function displayModel(container, spec) {
    const figure = el('figure','folio-study');
    const pane = el('div','study-pane');
    figure.append(pane);
    container.append(figure);
    if (!study.show(pane,spec)) pane.replaceWith(el('p','folio-note','品物の控えを手元に広げた。'));
    const controls = el('figcaption','study-controls');
    controls.append(button('左へ回す',()=>study.turn(-Math.PI/4,0)),button('右へ回す',()=>study.turn(Math.PI/4,0)));
    if (!spec.person) controls.append(button('裏を見る',()=>study.flip()));
    figure.append(controls);
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
    const wrap = reset('手掛かりの控え',regionName(c.region)+'　·　'+c.kind,titleOf(c));
    const grid = el('div','folio-spread'), words = el('div','folio-words');
    const person = c.kind === '証言' ? cast.get(c.characterId) : null;
    wrap.append(grid);
    const spec = person ? {person,label:c.speaker} : {prop:c.prop || 'ledger',clueId:c.id,label:titleOf(c)};
    const description = el('blockquote','folio-dialogue',c.note);
    displayModel(grid,spec);
    words.append(button('この場面をもう一度見る',()=>play('clue/'+c.id,null,()=>entry(c,back))));
    words.append(el('p','folio-speaker',c.speaker),description);
    grid.append(words);
    const exchange = CLUE_LINES[c.id];
    const transcript = el('details','folio-chapter');
    transcript.append(el('summary','','その場のやりとり'));
    const turns = [[c.speaker,exchange.ask],['配達人のお餅',exchange.choice],...exchange.lines];
    for (const [name,text] of turns) {
      const turn = el('p','folio-note');
      turn.append(el('strong','folio-speaker',name+'　'),document.createTextNode(text));
      transcript.append(turn);
    }
    wrap.append(transcript);
    if (['regional-returns','kyoto-set'].includes(c.id)) supplyRegister(wrap,c.id);
    words.append(button('戻る',back,'folio-link'));
  }
  function ending() {
    const wrap = reset('十七景もち寄り帖','結び','十七の土地が、同じ席につく');
    tabs(wrap,'いまの頼まれごと'); showArtwork(wrap,true);
    wrap.append(el('p','folio-resolution',CHAPTERS.at(-1).resolution),button('旅の記録を読む',archive,'folio-primary'));
  }
  return {open: overview, close() { study.clear(); delete dialog.dataset.folio; }};
}
