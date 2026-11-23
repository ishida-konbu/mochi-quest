import * as T from './vendor/three.module.min.js';
import { FERRY_CURTAIN, ferryCurtainPoint } from './festival.js';
import { sculpture } from './pilgrimage-pigment.js';

// Ohana's shop stencil. One flower-topped cake rests on a single cherry leaf
// for the next traveller. The linen still shows through the diluted ink.
function printShopkeeper(c) {
  c.save();
  c.translate(14, 74);
  c.lineJoin = c.lineCap = 'round';
  const ink = '#494a3b';
  function silhouette(d) {
    const path = new Path2D(d);
    c.fillStyle = 'rgba(134, 137, 104, .32)';
    c.fill(path);
    c.strokeStyle = ink;
    c.lineWidth = 2.4;
    c.stroke(path);
  }
  function dab(d, colour = ink) {
    c.fillStyle = colour;
    c.fill(new Path2D(d));
  }
  // The bent far leg, fingers and webbed foot are visible past the haunch.
  silhouette('M50 71 Q67 70 75 83 Q79 93 64 102 L78 103 Q88 99 94 101 L81 106 L93 108 Q86 111 73 108 L51 109 Q47 107 51 102 L62 88 L45 85Z');
  silhouette('M40 101 C19 95 23 77 32 63 C37 53 41 49 46 37 Q52 23 65 17 Q70 5 78 8 Q84 9 85 15 Q96 14 103 18 Q108 21 101 25 Q93 31 81 35 Q76 46 64 51 C59 60 66 69 63 78 Q62 86 54 92Z');
  // Broad calligraphic marks along the brow and spine leave the throat pale.
  dab('M40 48 Q47 30 59 24 L64 24 Q48 36 44 46Z M38 55 Q41 48 47 47 Q43 56 38 58Z M33 65 Q38 57 41 58 Q41 63 34 69Z');
  dab('M65 19 Q69 9 76 10 Q81 10 82 16 Q74 11 65 21Z');
  c.fillStyle = ink;
  c.beginPath(); c.ellipse(76.5, 16.3, 2.4, 3, .22, 0, 2 * Math.PI); c.fill();
  dab('M98 19 q3 -1 2 1 q-2 2 -3 1Z M102 25 Q83 28 70 36 Q76 28 94 26Z M64 43 Q76 39 79 36 Q75 43 64 44Z');
  // Near thigh folds back into the shin, leaving three toes on the ground.
  silhouette('M51 70 C41 65 24 74 19 86 Q16 96 29 101 L45 102 Q33 107 22 108 Q16 110 15 114 L28 112 L18 117 Q25 118 36 114 L29 119 Q35 119 45 113 L62 105 Q67 101 58 97 L42 93 Q58 88 59 79 Q59 73 51 70Z');
  dab('M21 92 Q24 78 38 76 Q31 82 25 91Z M29 98 Q34 95 43 94 Q38 99 29 98Z M41 81 q5 -6 10 -5 q-4 6 -10 5Z');
  // A short shop apron ties at the back. The near arm carries the leaf level.
  dab('M44 57 Q52 54 60 49 L64 53 Q54 61 46 63Z M46 62 Q52 64 62 58 L66 75 Q63 78 59 79 L56 70 Q52 68 46 62Z M45 59 Q37 53 32 55 Q37 59 43 61 L35 65 Q41 65 47 62Z', '#797757');
  silhouette('M61 45 Q66 41 71 47 L79 60 Q85 60 94 55 L100 51 Q103 49 104 51 L101 55 L110 54 Q113 54 111 56 L103 60 L110 59 Q112 60 109 62 L99 64 Q84 72 75 70 Q70 68 66 61 L60 54');
  dab('M63 46 Q66 45 69 49 L75 60 Q69 54 63 51Z M76 67 Q84 67 93 62 Q87 68 78 69Z');
  // Shallow rice silhouette, pickled blossom and the curled ends of its leaf.
  dab('M85 49 Q113 53 145 39 Q137 54 110 56 Q94 56 85 49Z', '#66705a');
  dab('M92 49 C91 45 96 41 104 39 Q119 35 129 39 Q133 40 133 44 Q117 51 94 51Z', '#f2e8cf');
  dab('M92 49 Q89 43 103 39 Q119 34 128 38 Q113 36 103 41 Q94 44 94 50Z M94 51 Q116 50 133 43 Q124 52 94 52Z');
  dab('M111 39 Q106 39 108 36 Q109 34 112 36 Q111 31 114 32 Q116 32 115 36 Q119 32 121 35 Q122 37 116 39 Q120 40 117 42 Q115 43 113 40 Q111 43 109 41Z', '#996e62');
  c.restore();
}

function clothPrint() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const c = canvas.getContext('2d');
  c.fillStyle = '#e8dfc9';
  c.fillRect(0,0,640,256);
  // Warp, weft and the doubled hem show through the undyed areas.
  c.fillStyle = 'rgba(113,96,71,.14)';
  for (let x=1;x<640;x+=3) c.fillRect(x,0,1,256);
  for (let y=0;y<256;y+=4) c.fillRect(0,y,640,1);
  c.fillStyle = '#a69c87';
  c.fillRect(0,9,640,1); c.fillRect(0,243,640,2);
  c.fillStyle = '#c1b39a';
  for (let x=3;x<640;x+=7) c.fillRect(x,239,3,1);
  printShopkeeper(c);

  function brush(d, colour) {
    c.fillStyle = colour;
    c.fill(new Path2D(d));
  }
  // The blossom boat gives the shop a recognisable mark from across the ford.
  // The two sides of each stroke form its swollen belly and lifted tip.
  brush('M165 134 C216 173 333 196 441 122 C418 156 340 197 268 185 C223 177 182 154 165 134Z','#595e51');
  brush('M165 134 C238 163 348 172 439 123 C360 177 270 184 165 134Z','#a09d83');
  brush('M181 144 Q300 197 447 119 Q339 193 233 166Z','#4b4e42');
  for (let i=0;i<7;i++) {
    const x=212+i*27, y=160+12*Math.sin(i*.56);
    brush(`M${x} ${y} q15 3 29 -7 q-13 10 -29 7Z`,'#716f5c');
  }
  c.save(); c.translate(305,117);
  for (let i=0;i<5;i++) {
    c.save(); c.rotate(i*2*Math.PI/5+.17);
    brush('M0 2 C-20 -2 -39 -26 -24 -37 L-16 -34 L-14 -41 C4 -51 17 -20 0 2Z','#9e7869');
    brush('M-1 -1 C-8 -15 -14 -25 -23 -31 C-11 -23 -3 -12 -1 -1Z','#605347');
    c.restore();
  }
  for (let i=0;i<12;i++) {
    const a=i*2.399, r=2.5+1.06*i;
    c.fillStyle='#4f4b3f'; c.beginPath(); c.ellipse(Math.cos(a)*r,Math.sin(a)*r,1.9,1.3,a,0,Math.PI*2); c.fill();
  }
  c.restore();
  for (const [x,y,w] of [[188,193,82],[323,191,110],[236,207,103]]) {
    brush(`M${x} ${y} q${w*.5} 5 ${w} -2 q${-w*.49} 11 ${-w} 2Z`,'#888e80');
  }
  c.fillStyle='#47483f'; c.textAlign='center'; c.font='600 45px "Hiragino Mincho ProN","Yu Mincho",serif';
  for (const [i,glyph] of [...'花筏餅'].entries()) c.fillText(glyph,529,67+i*51);
  c.fillStyle='#986554'; c.fillRect(500,196,57,23);
  c.fillStyle='#f1e8d5'; c.font='15px "Hiragino Mincho ProN",serif'; c.fillText('おはな',529,212);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

function curtainGeometry() {
  const positions=[],uv=[],faces=[];
  for (let panel=0;panel<3;panel++) {
    const start=positions.length/3;
    for (let j=0;j<=9;j++) {
      const down=j/9;
      for (let i=0;i<=18;i++) {
        const t=i/18, across=(panel+t)/3, wave=across*31+.8*down;
        const x=(across-.5)*2.47+.011*down*(1-2*t)+.015*down*Math.sin(panel+1.3);
        const y=2.35-.96*down-.034*Math.sin(Math.PI*t)**2+.021*down*Math.sin(wave);
        positions.push(x,y,.065+down*down*(.043+.083*Math.sin(wave))+.026*Math.sin(across*38));
        uv.push(across,1-down);
        const k=start+j*19+i;
        if (i && j) faces.push(k-20,k-1,k-19,k-19,k-1,k);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(faces); g.computeVertexNormals();
  return g;
}

export function dressFerryShop(painter, ground) {
  const {x,z,yaw,span,height}=FERRY_CURTAIN;
  const base=ground(x,z), frame=sculpture(), half=span/2;
  const straw='#bfb18b', ink='#5f5745', stem='#95886b';
  for (const side of [-1,1]) {
    const u=side*half, floor=ground(...ferryCurtainPoint(u))-base-.065;
    frame.stroke(stem,[[u,floor,0],[u-.012,1.03,-.012],[u+.009,height+.19,0]],[.053,.049,.043],10);
    for (let i=0;i<7;i++) {
      const v=.17+i*.37;
      frame.post(ink,u,v,0,.052,.013,.053);
      frame.post(straw,u,v+.011,0,.054,.009,.053);
    }
    // Crossed turns with a frapping knot anchor the bamboo rail.
    for (let i=0;i<4;i++) {
      const v=height-.10+i*.03;
      frame.stroke(i%2?straw:ink,[[u-.055,v,-.012],[u-.032,v+.025,.07],[u+.034,v+.047,.073],[u+.052,v+.06,0]],[.010,.012,.012,.007],9);
    }
    frame.stroke(straw,[[u+.05,height-.044,.043],[u+.091,height-.123,.082],[u+.095,height-.225,.06]],[.012,.011,.003],8);
  }
  frame.stroke(stem,[[-half-.15,height,.051],[0,height-.031,.057],[half+.13,height+.01,.05]],[.045,.04,.036],18);
  for (let i=0;i<9;i++) {
    const u=(i-4)*.299;
    frame.stroke(straw,[[u,2.335,.069],[u-.005,2.487,.091],[u-.006,2.518,.052],[u,2.485,.014],[u,2.34,.018]],[.019,.020,.021,.019,.018],11);
  }
  painter.shapes.ferryBamboo = frame.finish();
  painter.part('ferryBamboo',x,base,z,1,1,1,'#fff',yaw,0,0,new T.MeshLambertMaterial({vertexColors:true}));
  painter.shapes.ferryCloth = curtainGeometry();
  const cloth=new T.MeshLambertMaterial({map:clothPrint(),side:T.DoubleSide});
  painter.part('ferryCloth',x,base,z,1,1,1,'#fff',yaw,0,0,cloth);
}
