// Four bolts of painted cloth, reserved for the Kyoto street and the wedding.
// The strip below the paintings is plain weave for linings and narrow brushwork.
import * as T from './vendor/three.module.min.js';
import { brushWash } from './scroll-sculpt.js';

let silk;
export function paintedSilk() {
  if (!silk) {
    const map=new T.TextureLoader().load(new URL('./assets/residents/emaki-silk.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;
    map.anisotropy=4;
    silk=brushWash(new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide}),.34);
  }
  return silk;
}

// A flat stroke laid against the cut of the cloth. Offsetting both edges in
// pattern coordinates lets the stroke run over a pleat and disappear around a bend.
export function foldMark(panels, surface, points, width, tint, lift=.006) {
  const path=new T.SplineCurve(points.map(pair=>new T.Vector2(...pair)));
  const at=new T.Vector2(),tangent=new T.Vector2();
  panels.cut(12,2,(u,v)=>{
    path.getPoint(v,at);path.getTangent(v,tangent);
    const pressure=width*(.065+.935*Math.sin(Math.PI*v)**.65)*(.68+.52*v);
    const edge=(u-.5)*pressure;
    return surface(at.x-edge*tangent.y,at.y+edge*tangent.x,lift);
  },4,tint);
}

const portraits=new Map();
// Sparse features on the existing rice bust. The height of the eyelid, the
// direction of the pupil and the corner of the mouth read as one expression.
const faces=[
  {left:'M19 50 Q30 47 42 53 Q33 57 23 54Z',right:'M79 52 Q90 45 103 43 Q97 52 82 55Z',
   eyes:[[31,52],[91,49]],brows:['M19 39 Q31 41 38 40','M80 39 Q91 33 102 35'],mouth:'M47 77 Q57 81 64 79 Q74 76 80 70 Q77 81 65 84 Q54 84 47 77Z'},
  {left:'M20 52 Q30 46 44 49 Q36 55 26 57Z',right:'M77 49 Q88 44 101 46 Q97 54 83 54Z',
   eyes:[[36,51],[93,49]],brows:['M19 40 Q30 36 43 38','M79 39 Q91 33 105 37'],mouth:'M50 79 Q60 78 67 75 Q73 73 81 74 Q75 78 67 79 Q57 82 50 79Z'},
  {left:'M18 54 Q27 45 39 48 Q42 48 45 50 Q32 48 24 56Z',right:'M78 47 Q87 43 98 48 L106 54 Q95 49 89 48 Q83 48 78 49Z',
   eyes:[],brows:['M20 39 Q30 32 42 37','M78 36 Q94 30 103 39'],mouth:'M41 72 Q55 78 65 77 Q79 76 87 66 Q80 85 68 86 Q53 86 41 72Z'},
  {left:'M21 49 Q31 49 43 56 Q31 58 24 54Z',right:'M77 57 Q88 46 100 47 Q96 53 84 59Z',
   eyes:[[34,54],[90,52]],brows:['M19 36 Q32 41 44 44','M77 42 Q91 32 103 34'],mouth:'M46 76 Q55 72 62 73 Q74 75 83 72 Q78 78 67 78 Q55 76 46 76Z'},
  {left:'M17 52 Q29 42 44 50 Q33 55 22 55Z',right:'M78 51 Q90 46 103 51 Q95 59 82 55Z',
   eyes:[[27,51],[87,53]],brows:['M17 39 Q29 34 41 38','M80 41 Q90 39 103 44'],mouth:'M43 74 Q56 79 68 76 Q77 73 82 74 Q78 78 66 81 Q53 82 43 74Z'},
  {left:'M19 50 Q32 46 44 48 Q37 53 26 54Z',right:'M80 51 Q90 46 102 42 Q101 49 87 54Z',
   eyes:[[32,51],[92,48]],brows:['M20 38 Q31 34 42 38','M80 37 Q94 31 104 33'],mouth:'M48 78 Q58 81 68 77 Q79 73 82 70 Q80 79 68 81 Q57 83 48 78Z'},
];
export function townPortrait(kind) {
  if(portraits.has(kind))return portraits.get(kind);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.lineCap='round';ctx.lineJoin='round';
  const f=faces[kind];
  const fill=(d,color)=>{ctx.fillStyle=color;ctx.fill(new Path2D(d));};
  const stroke=(d,color,w)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke(new Path2D(d));};
  for(const d of [f.left,f.right]){
    fill(d,f.eyes.length?'#e6dac3':'#493e34');stroke(d,'#51453a',1.35);
    const upper=d.slice(0,d.lastIndexOf('Q'));
    if(f.eyes.length)stroke(upper,'#453c33',2.0);
  }
  for(const [x,y] of f.eyes){
    ctx.beginPath();ctx.ellipse(x,y,2.9,2.3,-.27,0,Math.PI*2);ctx.fillStyle='#3e3931';ctx.fill();
  }
  f.brows.forEach(d=>{stroke(d,'#776651',2.1);stroke(d,'#584c3d',.8);});
  fill(f.mouth,kind===2?'#8d6556':'#745747');
  stroke('M56 64 Q59 61 61 62 M62 65 Q65 65 67 63','#9f856e',1);
  for(const [x,y,d] of [[19,64,1],[104,62,-1]]){
    for(let i=0;i<3;i++)stroke('M'+(x+i*2)+' '+(y+i)+'q'+(d*2)+' -2 '+(d*4)+' -2.8','#b59a80',.6);
  }
  const map=new T.CanvasTexture(canvas);map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  map.userData.riceTint=['#fff4dc','#eeead8','#f5e6d4','#dcdfc3','#f1dab9','#fff2db'][kind];
  portraits.set(kind,map);return map;
}
