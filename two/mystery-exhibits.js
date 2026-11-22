import { assets, evidence } from './mystery-data.js';
import { districtPoint } from './geography.js';
import { daiFirebeds } from './higashiyama.js';
import { terrainHeight, BUILDINGS } from './terrain.js';
import { pagodaPlan } from './architecture.js';

const exhibits = new Map(evidence.map(item => [item.id, item]));
const files = new Map(assets.filter(item => item.file).map(item => [item.id, item.file]));

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, action) {
  const node = element('button', 'ex-button', label);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function plate(assetId, description) {
  const picture = element('img', 'ex-image');
  picture.src = new URL(files.get(assetId), import.meta.url).href;
  picture.alt = description;
  picture.decoding = 'async';
  return picture;
}

const exactPlates = {
  EV_C01_06: 'AS_FOLIO_C01_COMPLETE', EV_C01_07: 'AS_RESIGNATION_LETTER',
  EV_C03_02: 'AS_CLUE_MEASURE', EV_C03_03: 'AS_CLUE_MEASURE', EV_C03_08: 'AS_FOLIO_C03_COMPLETE',
  EV_C04_01: 'AS_CLUE_LETTER_CLOSED', EV_C04_04: 'AS_CLUE_LETTER_OPEN',
  EV_C06_01: 'AS_CLUE_PRAYER_FALSE', EV_C06_02: 'AS_CLUE_PRAYER_TEMPLATE',
  EV_C06_04: 'AS_CLUE_P21_COUNTER', EV_C06_05: 'AS_CLUE_P22_COUNTER', EV_C06_06: 'AS_CLUE_P23_COUNTER',
  EV_C07_12: 'AS_FOLIO_COMPARISON',
};

export function exhibitPlate(parent, evidenceId) {
  const record = exhibits.get(evidenceId);
  if (!record) return;
  const assetsToShow = exactPlates[evidenceId] ? [exactPlates[evidenceId]] :
    evidenceId === 'EV_C07_01' ? record.assetIds : [record.assetId];
  const shelf = element('div', 'ex-shelf');
  for (const id of assetsToShow) {
    if (!files.has(id)) continue;
    const viewport = element('div', 'ex-document');
    const picture = plate(id, record.nameJa);
    viewport.append(picture);
    const zoom = button('拡大して読む', () => {
      const enlarged = viewport.classList.toggle('ex-zoom');
      zoom.textContent = enlarged ? '元の大きさに戻す' : '拡大して読む';
      zoom.setAttribute('aria-expanded', String(enlarged));
      viewport.tabIndex = enlarged ? 0 : -1;
      if (enlarged) viewport.focus({preventScroll:true});
      else viewport.scrollTo(0,0);
    });
    zoom.className = 'ex-zoom-toggle';
    zoom.setAttribute('aria-expanded', 'false');
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', record.nameJa);
    shelf.append(viewport,zoom);
  }
  if (shelf.childElementCount) parent.append(shelf);
  return shelf;
}

function labelCard(label, text) {
  const card = element('div', 'ex-card');
  card.append(element('small', '', label), element('strong', '', text));
  return card;
}

function spread(leftLabel, leftText, rightLabel, rightText) {
  const row = element('div', 'ex-pair');
  row.append(labelCard(leftLabel, leftText), labelCard(rightLabel, rightText));
  return row;
}

// The right-hand footer spans authored coordinates 354..566 in a 600-wide sheet.
// Closing the two facing sides reflects x about 300 and leaves y unchanged.
function sampleFold(written, transferred, dry = false) {
  const sheet = element('div', 'ex-folio');
  sheet.append(element('span', 'ex-side-label', '相談時の困り事'), element('span', 'ex-side-label', '調べたあとの返事'));
  if (written) {
    const original = element('b', 'ex-ink', '受取済');
    original.classList.toggle('ex-dry', dry);
    sheet.append(original);
    if (transferred) sheet.append(element('b', 'ex-ink ex-mirror', '受取済'));
  }
  sheet.setAttribute('role', 'img');
  sheet.setAttribute('aria-label', transferred ? '見開きの右下の「受取済」が、左の余白の同じ高さに左右反転して写った。' :
    written ? '見開きの右下に「受取済」。向かいの余白は白い。' : '左右に折れる白い見本札。');
  return sheet;
}

function joinPlate(serial, part, description) {
  return plate('AS_CLUE_' + serial + '_' + part, description);
}

function partsBoard(parts) {
  const frame = element('div', 'ex-parts');
  for (const part of parts) frame.append(part);
  return frame;
}

function oneStep(view, prompt, correct, observation, alternatives = []) {
  return { view, prompt, correct, observation, alternatives };
}

const measurePlate = () => plate('AS_CLUE_MEASURE', '標準枡は五段すべてに米が入る。店の枡は底板が一段高く、四段しか入らない。');

function riceScoopBoard(count) {
  const board = element('div', 'ex-grain-board');
  for (let i = 0; i < 10; i++) {
    const scoop = element('span', 'ex-scoop' + (i < count ? ' ex-full' : ''), String(i + 1));
    board.append(scoop);
  }
  board.setAttribute('role', 'img');
  board.setAttribute('aria-label', '注文十杯のうち、標準枡で' + count + '杯。');
  return board;
}

const documentCases = [
  ['祝い杵は未返却', '祝い杵は返却済み。杵吉の祝い役は返上。'],
  ['横綱は所在不明', '芦ノ山は自分の意思で稽古に出た。'],
  ['蔵町の欠量は未補填', '上げ底の不足二杯は補填済み。'],
  ['稲荷の里が全員辞退', '葛葉は当日欠席。小雨は午前の使いを承諾した。'],
  ['指定三便が三十俵不足', '三便の現物は三十俵。中継の預かりを二度数えた。'],
  ['祈願者が取りやめに同意', '署名した紙の目的は各里の餅つき継続への祈願。'],
];

function compareReports() {
  const board = element('div', 'ex-dossier');
  for (const [claim, result] of documentCases) board.append(spread('提出本', claim, '確定した返事', result));
  return board;
}

function prayerMatches() {
  const names = { P21:'鈴菜', P22:'湯気丸', P23:'雪綴' };
  return ['P21', 'P22', 'P23'].map(serial => {
    const name = names[serial];
    const rest = Object.values(names).filter(other => other !== name);
    return oneStep(() => partsBoard([
      joinPlate(serial, 'UPPER', serial + '。寺の上段。番号と切れ目、割印の上半分がある。'),
      joinPlate(serial, 'COUNTER', name + 'の本人控え。上段と同じ番号と日付、祈願文。'),
    ]), '上段 ' + serial + ' と本人控えに合う署名片は？', name + 'の署名片 ' + serial,
    '番号、切れ目、割印、本人控えの祈願文が一致する。', rest.map(person => [person + 'の署名片 ' +
      Object.keys(names).find(key => names[key] === person), '番号と割印を確かめよう。別の祈願票の切れ目は重ならない。']))
  }).map((step, i) => ({ ...step, resultView: () => joinPlate(['P21','P22','P23'][i], 'JOINED', '寺の上段・署名片・本人控えが同じ票にそろった。') }));
}

function folioMatch(caseId, note, other) {
  const serial = 'Q' + caseId.substring(1);
  const label = serial + ' の返事「' + note + '」';
  return {
    ...oneStep(() => plate('AS_FOLIO_' + caseId + '_SUBMITTED', serial + 'の提出片。向かいの欄から写った薄い墨と、当時の受付印。'),
      '相談欄の受付印と反転墨に合う見開きを重ねよう。', label,
      '右欄の文字と左の薄い墨が、折り筋から等しい距離に重なった。', [
        ['別の見開き「' + other + '」', '文字の並びと受付印の番号が違う。'],
      ]),
    resultView: () => plate('AS_FOLIO_' + caseId + '_COMPLETE', '同じ日付の開いた控え。右下の訂正が向かいの左欄に反転している。')
  };
}

// Plot the actual current mountain hearths from three incident viewpoints, all
// looking in the same northward direction. Reframe uniformly, preserving angles.
function fireSketch(station) {
  const [x, z] = districtPoint('kyo', ...[[120,-424],[164,-467],[155,-482.1]][station]);
  let eye = terrainHeight(x,z) + 1.9;
  if (station === 2) {
    const [px, pz] = districtPoint('kyo',155,-479);
    const tower = BUILDINGS.find(b => b.kind === 'pagoda' && Math.hypot(b.x-px,b.z-pz) < 1);
    if (tower) eye = tower.y + pagodaPlan(tower).storeys.at(-1).y + 1.9;
  }
  const points = daiFirebeds(terrainHeight).map(([hx,hy,hz]) => [(hx-x)/(z-hz), (eye-hy)/(z-hz)]);
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const left = Math.min(...xs), top = Math.min(...ys), width = Math.max(...xs)-left, height = Math.max(...ys)-top;
  const scale = Math.min(350/width, 180/height);
  const canvas = element('canvas', 'ex-fire');
  canvas.width = 800; canvas.height = 440;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(2,2);
    const sky = ctx.createLinearGradient(0,0,0,220);
    sky.addColorStop(0,'#172933'); sky.addColorStop(1,'#394443');
    ctx.fillStyle = sky; ctx.fillRect(0,0,400,220);
    ctx.fillStyle = '#ffca80'; ctx.shadowBlur = 7; ctx.shadowColor = '#f1a950';
    for (const [u,v] of points) {
      ctx.beginPath(); ctx.arc(200+(u-left-width/2)*scale, 110+(v-top-height/2)*scale, 2.35,0,2*Math.PI); ctx.fill();
    }
  }
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', [
    '南大路からは横棒の両端がそろい、大の字が読める。',
    '東筋からは横棒と払いの重なり方が変わる。',
    '東塔の北回廊からは、地上より高い目線で火床を見る。大路と火の間隔が違う。',
  ][station]);
  return canvas;
}

function labSteps(id) {
  switch (id) {
    case 'EV_C01_06': return [
      oneStep(() => spread('継丸の手元','修理した祝い杵','杵吉の棚','祝い杵の置き跡'),
        '継丸が縄をほどき、修理した杵を杵吉へ差し出した。何を確かめる？',
        '杵吉が受け取り、棚へ戻すところ', '杵吉は木目をなぞり、預かり物を元の棚へ寝かせた。',
        [['杵吉が祝いの一搗きを引き受けること', '返してほしいと頼まれたのは里の杵だ。役については本人の書付がある。']]),
    ];
    case 'EV_C03_08': return [
      oneStep(() => riceScoopBoard(8), '受け渡し台に八杯。標準枡で不足分を計ろう。',
        '八杯に二杯を足す', '俵太、受取人、秤係の前で、標準十杯がそろった。',
        [['八杯に一杯を足す', '注文札は十杯。標準枡であと何杯必要か数えよう。']])
    ].map(step => ({...step, resultView: () => riceScoopBoard(10)}));
    case 'EV_C03_03': return [
      oneStep(() => spread('秤台', '空袋の重さを引く','標準枡', '同じ米を一杯、すり切る'), '一杯の重さを確かめる。', '秤の目盛を読む', '標準枡一杯の正味は秤目10。'),
      oneStep(measurePlate, '同じ米を店の枡五杯から標準枡に移す。何杯まで満ちる？', '四杯',
        '店の枡は標準の五分の四。十回すくっても標準では八杯、秤目80。',
        [['五杯', '店の枡は底板が一段高い。五段のうち米が入る段を数えよう。']]),
    ];
    case 'EV_C03_07': return [
      oneStep(() => spread('蓋付きの比較皿', '同じ日に採った同じ米','道具', '標準枡と店の枡'),
        '枡の違いだけを比べるには？','同じ控え米を両方の枡で量る','同じ控え米でも、店の五杯は標準の四杯。',
        [['雨に当てた米と乾いた米を使う','米の状態と器が同時に変わると、どちらが効いたか判らない。']])
    ];
    case 'EV_C04_02': return [
      oneStep(() => spread('中段の婚礼', '日が射す中、滴が仮札に落ちる。','庇の内側', '置かれた紙には滴がない。'),
        '当日の紙が雨に当たるのはどちら？','中段の行列で持った紙','日が射している間にも、行列だけに雨粒が当たった。',
        [['庇に置いた控え','庇の下の紙は乾いていた。日の光と雨は同時にある。']]),
    ];
    case 'EV_C04_03': return [
      {...oneStep(() => spread('試し紙の外側','仮札に米糊を塗る。','折返しの内側','雨粒は当たらない。'), '婚礼用の紙と米糊を使って、仮札のつき方を試そう。',
        '写しの糊を湿らせ、折って乾かす','乾くと折返しが仮札に留まり、最初の一行だけが見える。',
        [['手紙の原本を濡らす','原物は保存係が預かっている。同じ紙と糊で試せる。']]),
       resultView: () => spread('外に出た面','雨ににじんだ米糊の跡。','仮札の下','折返しが貼り付き、二行目が隠れた。')},
    ];
    case 'EV_C05_05': return [
      oneStep(() => spread('竜宮の預替札','R17 ← A17','中庭の箱','A17-01 から A17-12 まで連番'),
        '札の番号と、十二の箱の中身を確かめよう。','照合窓を波止場の係と一緒に開く',
        '共同開封の控えと箱の番号がそろい、当該十二箱すべてに米がある。',
        [['箱の数だけ書き込む','十二箱あっても中身が同じ荷かはまだ判らない。']]),
    ];
    case 'EV_C06_02': return [
      oneStep(() => plate('AS_CLUE_PRAYER_TEMPLATE','新しい見本S00。上段は日付と祈願文、下段が署名、右が本人控え。'),
        '署名したあと、祈願者自身が持ち帰るのは？','右の本人控え','寺には上段、整理係には署名片。本人控えには目的・日付・番号が残る。',
        [['下の署名片','署名片は整理係に渡す。目的と日付を自分で確かめられる片を見よう。']]),
    ];
    case 'EV_C06_06': return [
      oneStep(() => partsBoard([plate('AS_CLUE_PRAYER_TEMPLATE','新しい紙継ぎの見本 S00。'),joinPlate('P23','COUNTER','雪綴が当日持ち帰った本人控え P23。')]),
        '雪綴の机の二枚。切れ目を合わせる練習に使うのは？','練習用の新しい見本 S00','見本で割印のつながりを確認した。本人控えP23は当日から残る別の資料だ。',
        [['当日の本人控え P23','それは当時の目的と日付が残る原物。見本で接続の手順を試そう。']]),
    ];
    case 'EV_C06_08': return prayerMatches();
    case 'EV_C07_06': return [
      oneStep(() => fireSketch(0),'南大路からは横棒が平らに見える。次の目線へ。','東筋の路上に立つ','同じ火床も、東から見ると払いの間隔が変わる。'),
      oneStep(() => fireSketch(1),'東筋の地上から、高さも変えて比べよう。','東塔の北回廊へ上がる','火床そのものは同じまま、塔からは違う形に重なった。'),
      oneStep(() => fireSketch(2),'三つの写生で確かめたのは？','立つ場所で火の見え方が変わる','写生を整えることもできる。この観察だけで筆丸の居場所は決まらない。',
        [['絵だけで誰が書類を切ったか決まる','火床の重なりは紙を切った人物を示さない。']]),
    ];
    case 'EV_C07_09': return [
      oneStep(compareReports,'六件の控えと提出本を照らす。共通して変わったのは？','当時の相談が「現在も未解決」に組み替えられた',
        '元の相談は実際にあった。続きと時点を落としたため、見出しの意味が変わった。',
        [['過去の相談自体がすべて作り話だった','米の二杯不足など、実在した困り事と、その後の解決を読み分けよう。']]),
    ];
    case 'EV_C07_13': return [
      {...oneStep(() => sampleFold(true,false,true),'よく乾かした右の墨。右を左へ閉じて、もう一度開く。','乾いた札を折り比べる','左の余白は白いままだ。'),resultView: () => sampleFold(true,false,true)},
      oneStep(() => sampleFold(false,false),'新しい試し紙を開いた。同じ右側へ文字を書く。','右下に「受取済」と記す','まだ乾かない墨が右下にある。'),
      {...oneStep(() => sampleFold(true,false),'乾く前に右を左に重ねよう。','濡れた札を折って開く','「受取済」が左欄の同じ高さに裏返って写った。'),resultView: () => sampleFold(true,true)},
      oneStep(() => sampleFold(true,true),'墨の写りが残った面はどこ？','開いた時に向かい合う左の余白','折り筋を軸に左右が入れ替わる。乾いた見本には同じ跡がない。',
        [['紙を裏返した外側','右の墨が触れたのは、閉じた札の内側だ。']]),
    ];
    case 'EV_C07_12': return [
      folioMatch('C01','祝い杵は戻った','不足二杯、受取済'),
      folioMatch('C03','不足二杯、受取済','祝い杵は戻った'),
      oneStep(() => plate('AS_FOLIO_COMPARISON','二組の提出片と完了時の見開き。位置と反転した墨が一致する。'),
        '検分の途中で初めて墨がついた可能性は何で確かめる？','受付時にとった写しも比べる','受付の写しにも同じ跡がある。原票は結果を書き終えた後に分けられていた。',
        [['その場で原物を濡らし直す','原物には触れず、すでに残っている独立した写しを確かめよう。']]),
    ];
    default: return [];
  }
}

export function reconstruct(parent, evidenceId, onComplete) {
  const steps = labSteps(evidenceId);
  if (!steps.length) throw new RangeError('Unknown reconstruction ' + evidenceId);
  const bench = element('section','ex-bench');
  const visual = element('div','ex-visual');
  const question = element('p','ex-question');
  const message = element('p','ex-observation');
  message.setAttribute('role','status');
  const controls = element('div','ex-controls');
  bench.append(visual,question,message,controls);
  parent.append(bench);
  let progress = 0;
  let closed = false;
  function present(focus = false) {
    const step = steps[progress];
    visual.replaceChildren(step.view());
    question.textContent = step.prompt;
    message.textContent = '';
    controls.replaceChildren();
    const answer = button(step.correct, () => {
      if (step.resultView) visual.replaceChildren(step.resultView());
      message.textContent = step.observation;
      const next = button(progress + 1 === steps.length ? '確かめた' : '次を試す', () => {
        if (closed) return;
        progress++;
        if (progress === steps.length) { closed = true; onComplete(); }
        else present(true);
      });
      controls.replaceChildren(next);
      next.focus({preventScroll:true});
    });
    const options = step.alternatives.map(([label,feedback]) => button(label, () => { message.textContent = feedback; }));
    // Stable order on revisits, with the correct control at different positions.
    const hash = Array.from(evidenceId + progress).reduce((n,char) => n + char.charCodeAt(0),0);
    options.splice(hash % (options.length + 1),0,answer);
    controls.append(...options);
    if (focus) controls.firstElementChild.focus({preventScroll:true});
  }
  present();
  return bench;
}
