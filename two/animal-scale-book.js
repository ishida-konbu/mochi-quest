import { residentScale } from './animal-scale-residents.js';
import { wildlifeScale } from './animal-scale-wildlife.js';

const animals = [...residentScale, ...wildlifeScale];
const byId = new Map(animals.map(animal => [animal.id, animal]));
const groups = ['主人公', '陸の動物', '空の動物', '水辺の動物'];
const selections = ['mochi', 'kirin', 'dragon'];
const formatter = new Intl.NumberFormat('ja-JP', { maximumSignificantDigits: 3 });
const longMeasure = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
const metres = value => (value >= 100 ? longMeasure : formatter).format(value) + ' m';
let view = 'compare', group = '';

function option(value, text) {
  return new Option(text, value);
}

// Choose a round ruler length close to the requested physical span.
function rulerStep(span) {
  const unit = 10 ** Math.floor(Math.log10(span));
  return [1, 2, 5, 10].map(n => n * unit).reduce((a, b) =>
    Math.abs(Math.log(span / a)) < Math.abs(Math.log(span / b)) ? a : b);
}

function portrait(animal) {
  const img = document.createElement('img');
  img.src = animal.image;
  img.alt = '';
  img.draggable = false;
  return img;
}

function drawLineup(panel) {
  const selected = selections.map(id => byId.get(id)).filter(Boolean);
  const maxHeight = Math.max(...selected.map(a => a.height));
  const totalWidth = selected.reduce((sum, a) => sum + a.width, 0);
  // All dimensions are percentages of the paper's width, including height.
  const scale = Math.min((94 - 7 * selected.length) / totalWidth, 29 / maxHeight);
  const margin = (94 - totalWidth * scale) / selected.length;
  const step = rulerStep(14 / scale);
  const stage = panel.querySelector('.scale-scene');
  stage.replaceChildren();
  stage.style.setProperty('--scale-step', step * scale + 'cqw');
  const ruler = document.createElement('span');
  ruler.className = 'scale-ruler';
  ruler.textContent = metres(step);
  stage.append(ruler);
  const rows = panel.querySelector('tbody');
  rows.replaceChildren();
  let left = 3;
  for (const animal of selected) {
    const width = animal.width * scale;
    const figure = document.createElement('figure');
    figure.style.left = left + '%';
    figure.style.width = (width + margin) + '%';
    const img = portrait(animal);
    img.style.width = width + 'cqw';
    img.style.height = animal.height * scale + 'cqw';
    const label = document.createElement('figcaption');
    label.textContent = animal.label;
    figure.append(img, label);
    stage.append(figure);
    left += width + margin;

    const row = rows.insertRow();
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = animal.label;
    if (animal.note) {
      const note = document.createElement('small');
      note.textContent = animal.note;
      name.append(note);
    }
    row.append(name);
    row.insertCell().textContent = metres(animal.height);
    row.insertCell().textContent = metres(animal.width);
  }
  panel.querySelector('.scale-plate-link').hidden = selections.join(',') !== 'mochi,kirin,dragon';
}

function compare(panel) {
  panel.innerHTML = `<div class="scale-pickers"></div>
    <div class="scale-frame"><div class="scale-scene" role="img" aria-label="選んだ動物を同じ縮尺で並べた図"></div></div>
    <table class="scale-table"><thead><tr><th scope="col">動物</th><th scope="col">高さ</th><th scope="col">横幅</th></tr></thead><tbody></tbody></table>
    <a class="scale-plate-link" href="./assets/bestiary/legend-size.webp?v=long-tail-1" target="_blank" rel="noopener">白餅・麒麟・龍の図を拡大</a>`;
  const pickers = panel.querySelector('.scale-pickers');
  selections.forEach((id, i) => {
    const label = document.createElement('label');
    label.textContent = (i + 1) + '体目';
    const select = document.createElement('select');
    if (i) select.add(option('', '表示しない'));
    for (const habitat of groups) {
      const choices = document.createElement('optgroup');
      choices.label = habitat;
      for (const a of animals.filter(a => a.group === habitat)) choices.append(option(a.id, a.label));
      if (choices.children.length) select.append(choices);
    }
    select.value = id;
    select.onchange = () => { selections[i] = select.value; drawLineup(panel); };
    label.append(select);
    pickers.append(label);
  });
  drawLineup(panel);
}

function list(panel, selectAnimal) {
  panel.innerHTML = `<div class="scale-list-tools"><label>表示する動物 <select></select></label>
      <span>動物を選ぶと白餅と並びます</span></div>
    <div class="scale-list"></div>`;
  const filter = panel.querySelector('select');
  filter.add(option('', 'すべて'));
  for (const habitat of groups) filter.add(option(habitat, habitat));
  filter.value = group;
  const entries = panel.querySelector('.scale-list');
  function draw() {
    entries.replaceChildren();
    const visible = animals.filter(a => !group || a.group === group).sort((a, b) => b.width - a.width);
    const max = Math.max(...visible.map(a => a.width));
    const step = rulerStep(max / 4);
    entries.style.setProperty('--scale-step', step / max * 94 + '%');
    const head = document.createElement('div');
    head.className = 'scale-list-head';
    head.innerHTML = '<span>動物</span><div class="scale-list-rule"></div><span>横幅</span>';
    head.querySelector('div').textContent = metres(step);
    entries.append(head);
    for (const animal of visible) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'scale-list-row';
      row.dataset.animal = animal.id;
      const name = document.createElement('b');
      name.textContent = animal.label;
      const track = document.createElement('span');
      track.className = 'scale-track';
      const img = portrait(animal);
      img.loading = 'lazy';
      img.style.width = animal.width / max * 94 + '%';
      track.append(img);
      const measure = document.createElement('span');
      measure.textContent = metres(animal.width);
      row.append(name, track, measure);
      row.onclick = () => selectAnimal(animal.id);
      entries.append(row);
    }
  }
  filter.onchange = () => { group = filter.value; draw(); };
  draw();
}

export function openAnimalScale(host, back) {
  host.innerHTML = `<section class="scale-book"><div class="scale-toolbar">
      <button type="button" class="scale-back">‹ 配達帳</button>
      <div class="scale-modes" role="group" aria-label="比較の表示方法">
        <button type="button" data-mode="compare">並べて比べる</button>
        <button type="button" data-mode="list">全員を見る</button>
      </div></div><div class="scale-panel"></div>
      <p class="scale-footnote">ゲーム内の姿を同じ縮尺で計測。個体や姿勢によって寸法は変わります。</p></section>`;
  const panel = host.querySelector('.scale-panel');
  const buttons = host.querySelectorAll('[data-mode]');
  function show(mode) {
    view = mode;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    if (mode === 'compare') compare(panel);
    else list(panel, id => {
      selections.splice(0, 3, 'mochi', id === 'mochi' ? '' : id, '');
      show('compare');
      buttons[0].focus({ preventScroll: true });
      host.closest('dialog').scrollTop = 0;
    });
  }
  buttons.forEach(b => { b.onclick = () => show(b.dataset.mode); });
  host.querySelector('.scale-back').onclick = back;
  show(view);
  host.closest('dialog').scrollTop = 0;
  host.querySelector('.scale-back').focus({ preventScroll: true });
}
