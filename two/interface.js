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

export function drawFace(canvas, mode, mood = 'joy') {
  const g = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  const s = Math.min(w / 61, h / 50);
  g.translate(w / 2, h / 2 + 1 * s);
  g.scale(s, s);
  const oval = (x, y, rx, ry, fill) => {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    g.fillStyle = fill;
    g.fill();
  };
  const body = g.createRadialGradient(-8, -11, 2, 1, 4, 28);
  const colors =
    mode === 'kusa'
      ? ['#d3dc98', '#a3b96e', '#859959']
      : mode === 'kinako'
        ? ['#ffe4ad', '#dcb16d', '#bd8a45']
        : ['#fffdf5', '#fbefda', '#d9c6a7'];
  colors.forEach((c, i) => body.addColorStop([0, 0.74, 1][i], c));
  if (mode === 'kagami') {
    g.translate(0, -2);
    oval(0, 13, 23, 9.4, '#dccbab');
    oval(0, 11.6, 22, 9, body);
    g.scale(.76,.73);
    oval(0,-22,6.4,5.6,'#ce7739');
    oval(4,-27,4.6,1.8,'#557345');
  }
  if (mode === 'habutae') {
    for (const side of [-1, 1]) {
      g.save();
      g.scale(side, 1);
      g.beginPath();
      g.moveTo(15, 4);
      g.quadraticCurveTo(30, -18, 29, -7);
      g.quadraticCurveTo(30, 8, 17, 9);
      g.strokeStyle = '#ac9e80';
      g.fillStyle = '#fff9e7';
      g.fill();
      g.stroke();
      g.restore();
    }
  }
  oval(-10, 16.4, 6.4, 4.4, body);
  oval(10, 16.4, 6.4, 4.4, body);
  g.beginPath();
  if (mode === 'dango') g.ellipse(0, -1, 18.4, 19, 0, 0, 2 * Math.PI);
  else {
    g.moveTo(0, -20.8);
    g.bezierCurveTo(11.2, -20.8, 20.8, -12, 21.2, 0);
    g.bezierCurveTo(22, 13.3, 16.7, 17.4, 0, 17.4);
    g.bezierCurveTo(-16.6, 17.4, -22.3, 13, -21.6, 0.1);
    g.bezierCurveTo(-21.2, -11.8, -12, -20.5, 0, -20.8);
  }
  g.fillStyle = body;
  g.fill();
  if (mode === 'kusa') {
    g.save();
    g.rotate(-0.4);
    oval(1, -20, 8, 3, '#647e49');
    g.restore();
  }
  for (const side of [-1, 1]) {
    const x = side * 13;
    const blush = g.createRadialGradient(x, 2, 1, x, 2, 6);
    blush.addColorStop(0, '#ed9c8e');
    blush.addColorStop(1, 'rgba(230,145,126,0)');
    oval(x, 2, 6, 4, blush);
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    g.strokeStyle = '#503c32';
    g.beginPath();
    const a = side * 7;
    if (['surprise', 'curious', 'calm', 'blush'].includes(mood))
      oval(a, -3, 1.7, mood === 'surprise' ? 3 : 2.3, '#44322b');
    else if (mood === 'determined' || mood === 'hurt') {
      g.moveTo(a - side * 2, -4);
      g.lineTo(a + side * 2, -6);
      g.moveTo(a - side * 2, -4);
      g.lineTo(a + side * 2, -2);
      g.stroke();
    } else {
      g.moveTo(a - 3, -2);
      g.quadraticCurveTo(a, ['sleepy', 'bath'].includes(mood) ? 2 : -8, a + 3, -2);
      g.stroke();
    }
  }
  if (mood === 'sleepy' || mood === 'bath') {
    oval(0, 4, 2.2, 1.3, '#7d5241');
  } else {
    oval(0, 4, mood === 'surprise' ? 3 : 4, mood === 'surprise' ? 5 : 3.8, '#814b3b');
    oval(0.3, 6, 2.6, 1.6, '#e99183');
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
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
      '2 の草餅は緑に染まって自然に同化し、住人との衝突を避けます。3 のきなこ餅は足元に粉を舞わせ、三条通知を周囲八方向へ同時に届けます。',
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
