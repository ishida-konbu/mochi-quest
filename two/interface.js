import { icon } from '../ui.js';

export const MODES = [
  ['normal', '白餅'],
  ['dango', '団子'],
  ['kusa', '草餅'],
  ['kinako', 'きなこ餅'],
  ['habutae', '羽二重餅'],
  ['kagami', '鏡餅'],
];
export const EMOTES = [
  ['auto', 'おまかせ'],
  ['joy', 'にっこり'],
  ['curious', 'つぶらな瞳'],
  ['blush', 'てれ笑い'],
  ['surprise', 'びっくり'],
  ['determined', 'むんっ'],
  ['sleepy', 'うとうと'],
];
const glyphs = {
  'open-book': '<path d="M2.5 5.8c3.1-1.4 6.7-.8 9.5 1.2 3-2 6.5-2.6 9.5-1.2v12.6c-3.7-1.2-6.6-.6-9.5 1.1-2.7-1.7-6.4-2.2-9.5-1.1zM12 7v12"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  camera: '<path d="M3 7h4l1.5-3h7l1.5 3h4v13H3z"/><circle cx="12" cy="13" r="3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  stamp: '<path d="M5 17h14v4H5zm3-3c0-3 2-3 2-6 0-1-2-3-1-5 1-2 5-2 6 0 1 2-1 4-1 5 0 3 2 3 2 6z"/>',
};
const alias = { volume: 'sound', notice: 'letter' };
export function glyph(name) {
  return glyphs[name]
    ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + glyphs[name] + '</svg>'
    : icon(alias[name] || name);
}
export function paintGlyphs(root = document) {
  for (const el of root.querySelectorAll('[data-glyph]')) el.innerHTML = glyph(el.dataset.glyph);
}

// The portraits share a brush contour. The feet, leaf and feathers keep each
// silhouette legible when a mode is only a few dozen pixels wide.
export function drawFace(canvas, mode, mood = 'joy') {
  const g = canvas.getContext('2d');
  const scale = Math.min(canvas.width / 76, canvas.height / 59);
  g.resetTransform();
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate(canvas.width / 2, canvas.height / 2 + scale);
  g.scale(scale, scale);
  g.lineJoin = g.lineCap = 'round';
  const ink = '#403c32';
  function shape(path, fill, edge = null, width = 1) {
    const drawing = new Path2D(path);
    if (fill) { g.fillStyle = fill; g.fill(drawing); }
    if (edge) {
      g.lineWidth = width; g.strokeStyle = edge; g.stroke(drawing);
    }
  }
  function dab(x,y,rx,ry,fill,rotation = 0) {
    g.beginPath();
    g.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);
    g.fillStyle = fill; g.fill();
  }
  const grass = mode === 'kusa', flour = mode === 'kinako';
  const wash = g.createLinearGradient(-8,-21,4,20);
  wash.addColorStop(0,grass ? '#d3d8a6' : flour ? '#f4d598' : '#fffdf4');
  wash.addColorStop(.62,grass ? '#abbc88' : flour ? '#e4b782' : '#faf6e9');
  wash.addColorStop(1,grass ? '#849572' : flour ? '#cb9965' : '#ddd8c9');
  dab(1,18.3,22,2.2,'#645f4830',-.025);
  if (mode === 'kagami') {
    shape('M-25 15 Q-24 7 -12 6 Q8 1 20 9 Q30 15 23 19 Q2 26 -21 21 Q-26 20 -25 15Z', wash, ink,1.4);
    g.translate(0,-3); g.scale(.77,.77);
    shape('M-1 -24 Q4 -33 13 -30 Q10 -24 2 -23Z','#687c55',ink,.9);
    dab(0,-22,6.7,5.2,'#b96c3b');
  }
  if (mode === 'habutae') {
    for (const side of [-1,1]) {
      g.save(); g.scale(side,1);
      shape('M16 5 Q23 -2 33 -17 Q34 -10 30 -3 L34 -7 Q34 0 27 4 L30 2 Q27 10 17 10Z','#f6f3e3',ink,1.35);
      shape('M19 7 Q28 0 31 -8',null,'#8d9082',.8);
      g.restore();
    }
  }
  if (mode === 'dango') {
    shape('M-29 -12 Q-24 -22 -15 -24 M-32 -5 L-29 -9 M15 19 Q24 16 27 11',null,'#72695a',1.1);
  } else {
    shape('M-15 11 Q-22 19 -11 19 Q-4 18 -4 13 M5 13 Q9 20 16 18 Q21 16 15 10',wash,ink,1.15);
  }
  const outline = mode === 'dango'
    ? 'M1 -21 C11 -22 21 -14 22 -2 C23 9 15 18 3 19 C-9 21 -20 13 -21 1 C-22 -10 -14 -20 1 -21Z'
    : 'M-1 -20 C10 -21 18 -13 21 -4 C24 5 25 10 18 14 C10 19 -6 19 -16 15 C-22 13 -24 10 -23 4 C-22 -6 -17 -17 -7 -19 Q-3 -20 -1 -20Z';
  shape(outline, wash,ink,1.45);
  shape('M-22 4 Q-23 13 -11 16 Q-6 18 1 17 Q-14 18 -20 13 Q-24 9 -22 4Z','#474636');
  shape('M-16 -12 Q-11 -19 -3 -19',null,'#817968',.7);
  if (grass) {
    shape('M-3 -16 Q-11 -21 -13 -26 Q-5 -26 0 -20 Q5 -27 15 -26 Q11 -20 -1 -17Z','#667e51',ink,1.1);
    shape('M-3 -17 L10 -24 M-2 -18 L-10 -24',null,'#ced2a3',.9);
  }
  if (grass || flour) {
    for (let i=0; i<34; i++) {
      const a=i*2.4, radius=Math.sqrt((i+.5)/34);
      const x=Math.cos(a)*radius*19, y=Math.sin(a)*radius*16;
      dab(x,y,.5+(i%4)*.22,.38+(i%3)*.16,grass ? '#546e432f' : '#8e552a39',a);
    }
  }
  for (const side of [-1,1]) {
    const x=side*7.4;
    dab(side*13.6,4.7,4.6,2.1,'#be776550',side*-.15);
    if (['curious','calm','surprise','blush'].includes(mood)) {
      dab(x,-2.3,1.65,mood==='surprise'?3.1:2.35,ink,side*.12);
    } else if (mood==='determined'||mood==='hurt') {
      shape('M'+(x-side*2.5)+' -5 l'+(side*4)+' 2.7 l'+(-side*3)+' 1.7',null,ink,1.7);
    } else {
      const arc=['sleepy','bath'].includes(mood)?1.3:-7.8;
      shape('M'+(x-3.1)+' -1.5 Q'+x+' '+arc+' '+(x+3.2)+' -2.1',null,ink,1.9);
    }
  }
  if (['sleepy','bath'].includes(mood)) dab(0,5,1.9,1,ink);
  else if (['surprise','calling'].includes(mood)) dab(0,5.3,2.7,3.9,'#764a3d');
  else shape('M-4 3.2 Q-.4 4.5 4 3 Q3 8.6 -.4 8.2 Q-2.7 8 -4 3.2Z','#995342',ink,.9);
  g.restore();
}

export const HELP = {
  歩き方: [
    ['前後左右', '↑ または W で画面の奥へ、↓ または S で手前へ。← → または A・D で横へ歩きます。'],
    ['見回す', '画面をドラッグして視点を一周できます。Q・R でも左右に回転、ホイールで遠近を調整します。'],
    [
      '跳ぶ・届ける',
      'Space でジャンプ、Z で三条通知。動物に通知が届くと得点が入ります。そばで E を押すと、物や乗り物を使えます。',
    ],
    ['もちのび', 'どの餅モードでも、空中でもう一度ジャンプすると体が伸びます。着地するまでに続けて押すと、さらに長く伸びます。'],
    ['水辺と家', '川や海へそのまま入って泳げます。沖を進み続けると反対の岸へ。戸口から建物へ。五重塔の中では階段をたどって最上階へ登れます。雪灯りの都には露天風呂、十五夜の薄野には食べられる月見団子があります。'],
    [
      '御朱印',
      '十の名所を訪ねると御朱印が集まります。地図で場所を選んで道しるべを付けると、行き先までの距離が表示されます。',
    ],
    [
      'お顔カメラ',
      'C またはカメラボタンでお餅を正面から眺められます。表情を選び、ドラッグで角度を決めて写真を保存できます。',
    ],
    [
      'タッチ操作',
      '左のスティックで移動し、空いている場所を指でなぞって視点を回します。右ボタンでジャンプと通知ができます。',
    ],
  ],
  '変身・道具': [
    [
      '白餅／団子',
      '0 で白餅に戻るとMPが回復。1 の団子は転がるほど速くなります。ジャンプすると体を伸ばして高く跳びます。',
    ],
    [
      '草餅／きなこ餅',
      '2 の草餅は地面に沿って進み、動物・木・岩・建物をすり抜けます。橋の下では泳げます。道具を使うときは E を押します。3 のきなこ餅は三条通知を周囲八方向へ届けます。',
    ],
    ['空の配達', '龍は十五夜の薄野の高い空にいます。羽二重餅で上昇し、龍と高さをそろえて通知を届けましょう。丹頂と雲を踏む麒麟にも通知が届きます。小さな渡り鳥の群れは配達の対象外です。'],
    ['鏡餅', '動物全員に三条通知を届けると、5 で鏡餅に変身できます。歩く速さは白餅の三倍、通知は常に八方向。地図に行き先の印を置くと、そこへ瞬間移動できます。'],
    ['羽二重餅', '4 で羽二重餅に変身。ジャンプの連打か長押しで上昇し、手を休めると降下します。飛びながら進み続けると加速します。'],
    [
      'HPと温泉',
      '動物にぶつかると転びます。HPが尽きると眠って回復。温泉はHP・MPを全回復し、湯上がりと腹巻きはしばらく消耗を防ぎます。',
    ],
    [
      '漫画・日本酒・ラーメン',
      '漫画を読むと速足に、お酒を飲むと千鳥足で左右の操作が逆に。背脂ラーメンで満腹になると大きくなり、MPの消費が止まります。通知は前方三方向に、きなこ餅なら周囲二十四方向に飛びます。',
    ],
    [
      '乗り物',
      '桜川にいる大きなミツユビハコガメは、乗って進むほど加速します。満腹の間は乗せてもらえません。全十景に電動自転車のポートがあります。E で借りて、走り続けると加速。どのポートでも返せます。',
    ],
  ],
};
