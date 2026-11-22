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
    // Draw the laden willow behind the cakes so the face stays readable at HUD size.
    for (const side of [-1,1]) {
      g.save();
      g.scale(side,1);
      shape('M4 5 C9 -16 28 -34 34 -7 M10 -6 C21 -25 33 -22 37 0 M10 -6 C13 -23 16 -30 21 -20',null,'#846048',1.2);
      for (const [x,y,pink] of [[14,-15,1],[21,-21,0],[28,-21,1],[32,-15,0],[34,-8,1],[29,-17,0],[36,-5,0],[16,-23,1]]) {
        dab(x,y,1.45,1.85,pink?'#bf6874':'#b09a8a',-.35*side);
        dab(x-.15,y-.25,1.12,1.44,pink?'#e7a1ac':'#fff7e9',-.35*side);
      }
      g.restore();
    }
    // A corner of the red-edged ceremonial paper points toward the viewer.
    shape('M-33 16 L-3 7 L33 15 L3 26Z','#bb4838',ink,.9);
    shape('M-29 16 L-3 9 L29 15 L3 23.6Z','#fff9ea');
    // The fern lies on the paper and the weight of the lower cake covers its stem.
    for (const side of [-1,1]) {
      g.save();
      g.scale(side,1);
      shape('M5 17 Q17 24 32 19',null,'#63734e',1);
      for (let j=0;j<7;j++) {
        const u=j/7, x=12+21*u, y=19+2*Math.sin(Math.PI*u), length=3.4-1.5*u;
        dab(x,y-1.4,length,.9,'#6c855b',-.65);
        dab(x,y+1.4,length,1.1,'#b0c2a3',.78);
      }
      g.restore();
    }
    shape('M-27 13 C-27 5 -16 1 0 1 C16 1 27 5 27 13 C27 19 16 21 0 21 C-16 21 -27 19 -27 13Z',wash,ink,1.45);
    shape('M-1 -23 Q3 -29 12 -27 Q9 -22 2 -22Z','#687c55',ink,.9);
    dab(0,-21.1,5.8,4.4,'#d98632');
    g.save();
    g.translate(0,-4); g.scale(.8,.65);
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
  if (mode === 'kagami') {
    g.restore();
    const band = 'M-23 5.3 Q0 12.7 23 5.3';
    shape(band,null,'#96382e',3.2);
    shape(band,null,'#e5bd6a',1);
    for (const side of [-1,1]) {
      g.save();
      g.scale(side,1);
      shape('M14 6 L21 -.7',null,'#956d42',1.75);
      dab(15.6,4.2,2.9,2.2,ink,-.5);
      dab(15.5,3.8,2.55,1.95,'#f6e9cf',-.5);
      // The vermilion fold hangs closer to the body; the white fold fans out.
      shape('M16 3 L20 4 L20 9 L23 8 L23 14 L26 13 L26 20 L29 19 L28 24 L21 26 L22 19 L19 20 L19 14 L16 15 L17 9 L15 10Z','#c44838','#853e30',.9);
      shape('M20 2 L24 4 L25 8 L28 7 L29 12 L32 11 L32 16 L35 15 L35 20 L30 23 L30 18 L27 19 L26 14 L23 15 L22 10 L20 10Z','#fff9ea','#9b775a',1);
      shape('M23 10 L25 8 M27 14 L29 12 M30 18 L32 16',null,'#bfad92',.85);
      shape('M1 10 Q6 14 10 16 Q7 15 5 16',null,'#b14739',1.8);
      g.restore();
    }
    g.translate(0,9.5);
    for (let i=0;i<5;i++) {
      g.save();
      g.rotate(i * Math.PI * 2 / 5);
      const loop = 'M-.6 1 C-4 -1 -4 -5 -.5 -6 C2 -7 3.4 -3 .4 0';
      shape(loop,null,'#a83c33',2.4);
      shape(loop,null,'#efc879',.86);
      g.restore();
    }
    dab(0,0,1.5,1.5,'#845124');
    dab(-.3,-.3,1.1,1.1,'#f7d898');
  }
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
    ['海へ潜る', '海風の松原から沖へ泳ぎ、↓ を長押しすると潜水します。手を離すとその深さに留まり、Space を長押しすると浮上します。タッチでは「潜る」長押しで潜水、「跳ぶ」長押しで浮上します。竜宮城の御朱印は海底の楼門の先です。'],
    ['港と大船', '京の北東の辻から北山の裾を回る街道は敦賀の津へ、南西の街道は堺の津へ続きます。桟橋の渡し板から大船へ移り、甲板中央の階段を下りると船倉に入れます。定期船は両方の港で48秒間停まり、西の外洋を片道約4分半で渡ります。'],
    ['山の滝', '地図の「滝」は、楓橋の東にある楓渓の滝、竹隠れの社から桜川へ下る白糸の滝、桃源郷の南斜面にある桃霞の滝です。'],
    ['小屋の五右衛門風呂', '地図の「炭」は炭焼き小屋、「漁」は漁師小屋。五右衛門風呂のある小屋では、釜の前の木段を上り、湯の中で E（タッチでは「調べる」）を押すと体力とモッチポイントが回復します。'],
    ['街道の団子茶屋', '地図の「茶」が目印。店先の縁台に近づき、E（タッチでは「団子とお茶をいただく」）でひと休み。焼き団子を食べてお茶を飲むと、体力とモッチポイントが全回復します。'],
    ['新しい街道', '商人餅が荷を担いで村から村へ歩きます。雪灯りの都と京、薄野と東大寺の間では牛車が往復します。敦賀と堺の桟橋には、外洋を時計回り・反時計回りに一周する廻船が20秒ずつ停まります。'],
    [
      '御朱印',
      '十七の名所を訪ねると御朱印が集まります。地図で場所を選んで道しるべを付けると、行き先までの距離が表示されます。',
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
    ['野山の配達', '虎と獅子は、人家や街道を離れた野山を歩いています。配達帳で会いたい動物を選ぶと、地図にその一匹の居場所が映ります。'],
    ['空の配達', '龍と麒麟は十七景を渡り、道中で高さを変えます。画面を上へドラッグして空を見上げられます。配達帳で選び、道しるべの「上」「下」を頼りに羽二重餅で高さを合わせましょう。丹頂にも通知を届けられます。小さな渡り鳥の群れは配達の対象外です。'],
    ['鏡餅', '動物全員に三条通知を届けると、5 で鏡餅に変身できます。ジャンプを連打するか押し続けると、両手の御幣を羽ばたかせて上昇します。歩く速さは白餅の三倍、通知は常に八方向。地図に印を置いた場所へ瞬間移動できます。'],
    ['羽二重餅', '4 で羽二重餅に変身。ジャンプの連打か長押しで上昇し、手を休めると降下します。飛びながら進み続けると加速します。'],
    [
      'HPと温泉',
      '動物にぶつかると転びます。HPが尽きると眠って回復。地図の♨をたどると、山あいや浜辺にも野湯があります。湯に入って調べると、ひと休みできます。温泉はHP・MPを全回復し、湯上がりと腹巻きはしばらく消耗を防ぎます。',
    ],
    [
      '漫画・日本酒・ラーメン',
      '漫画を読むと速足に、お酒を飲むと千鳥足で左右の操作が逆に。背脂ラーメンで満腹になると大きくなり、MPの消費が止まります。通知は前方三方向に、きなこ餅なら周囲二十四方向に飛びます。',
    ],
    [
      '乗り物',
      '桜川にいる大きなミツユビハコガメは、乗って進むほど加速します。満腹の間は乗せてもらえません。陸の十四景に電動自転車のポートがあります。E で借りて、走り続けると加速。どのポートでも返せます。',
    ],
  ],
};
