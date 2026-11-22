import * as T from './vendor/three.module.min.js';
import { FERRY_CURTAIN, ferryCurtainPoint } from './festival.js';
import { sculpture } from './pilgrimage-pigment.js';

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
