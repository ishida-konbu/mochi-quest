import { icon } from '../ui.js';

export const MODES = [
  ['normal', '白餅'],
  ['dango', '団子'],
  ['kusa', '草餅'],
  ['kinako', 'きなこ餅'],
  ['habutae', '羽二重餅'],
];
export const EMOTES = [
  ['auto', 'おまかせ'],
  ['joy', 'にっこり'],
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
  oval(-10, 17, 7, 4, colors[2]);
  oval(10, 17, 7, 4, colors[2]);
  oval(0, -1, mode === 'dango' ? 19 : 22, 19, body);
  if (mode === 'kusa') {
    g.save();
    g.rotate(-0.4);
    oval(1, -20, 8, 3, '#647e49');
    g.restore();
  } else if (mode === 'normal') {
    g.beginPath();
    g.moveTo(-17, -12);
    g.quadraticCurveTo(0, -19, 17, -12);
    g.strokeStyle = '#be594c';
    g.lineWidth = 2.3;
    g.stroke();
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
    [
      '御朱印',
      '六つの名所を訪ねると御朱印が集まります。地図で場所を選んで道しるべを付けると、行き先までの距離が表示されます。',
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
      '0 で白餅に戻るとMPが回復。1 の団子は速く転がり、ジャンプすると体を伸ばして高く跳びます。',
    ],
    [
      '草餅／きなこ餅',
      '2 の草餅は緑に染まって自然に同化し、住人との衝突を避けます。3 のきなこ餅は、歩いたあとに粉が舞います。',
    ],
    ['羽二重餅', '4 で羽二重餅に変身。ジャンプを押し続けて上昇、離すと降下します。変身にはMPを使います。'],
    [
      'HPと温泉',
      '動物にぶつかると転びます。HPが尽きると眠って回復。温泉はHP・MPを全回復し、湯上がりと腹巻きはしばらく消耗を防ぎます。',
    ],
    [
      '漫画・日本酒・ラーメン',
      '漫画を読むと速足に、お酒を飲むと千鳥足で左右の操作が逆に。背脂ラーメンで満腹になると大きくなり、MP消費なしで三方向に通知を飛ばせます。',
    ],
    [
      '乗り物',
      '一匹だけのミツユビハコガメは、乗ると俊足。満腹の間は乗せてもらえません。電動自転車はポートで借りて、ポートで返します。',
    ],
  ],
};
