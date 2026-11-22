import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surfaceGrain, brushWash } from './scroll-sculpt.js';

const {sin,cos,PI}=Math;
const antique='#c6b080',shadow='#705e46',pale='#d0c6a5';
function carvedMaterial() {
  return surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.19),1.8);
}
function riceEar(a,side) {
  for(let k=0;k<3;k++){
    const ox=side*(.15+k*.13),y=.87-.14*k;
    a.stroke(antique,[[0,.05,0],[side*.19,.43,.03],[ox,y,.04],[ox+side*.19,y-.08,.06]],[.012,.021,.014,.002],12);
    for(let j=0;j<6;j++){
      const t=j/6;
      a.ball('#ccb88c',ox+side*.18*t,y-.085*t-.055,.062,.023,.061,.023,0,0,-side*(.49+t*.27));
    }
  }
}
// A pierced transom of foxfire and ripe ears of rice for the summit shrine.
export function summitJoinery(p,f) {
  const a=sculpture();
  for(const s of [-1,1]){
    riceEar(a,s);
    a.stroke(shadow,[[0,.09,.04],[s*.14,.16,.067],[s*.30,.39,.041],[s*.52,.45,.022]],[.013,.027,.017,.002]);
  }
  p.shapes.carvedRice=a.finish();const mat=carvedMaterial();
  for(const s of [-1,1]){
    f.part('carvedRice',s*2.08,2.42,2.77,1.72,1.41,1,'#fff',mat);
    for(let j=0;j<4;j++){
      const x=s*(1.32+.42*j);
      f.line([x,2.32,2.78],[x,1.01,2.78],.025,'#77533d');
    }
  }
  // Open slatted offertory chest with a visible well for coins.
  f.part('box',0,.49,3.52,1.86,.87,.85,'#73523b',p.boarding);
  f.part('box',0,.94,3.52,1.98,.054,.91,'#554635',p.wood);
  for(let i=0;i<9;i++)
    f.part('box',-.84+i*.21,1.02,3.52,.088,.125,.86,'#b48c5c',p.wood,0,.13);
  for(const s of [-1,1])f.part('box',0,1.02,3.52+s*.45,2.02,.15,.09,'#886943',p.wood);
  for(let i=0;i<26;i++){
    const a=i*PI*.44;f.part('ball',.066*cos(a),3.48-i*.057,3.0+.066*sin(a),
      .073,.107,.073,i%4===1?'#a3724b':'#c1a87a',p.wood);
  }
  f.part('ball',0,3.62,3.0,.155,.184,.155,antique,p.bronze);
  f.part('pole',0,1.91,3.02,.129,.33,.119,'#bcac83',p.fine);
}

export function orchardCarving(p,f){
  // Low relief is visible along the face and across the edge of the opening.
  // A crooked branch carries buds, open blossoms and two drooping fruit.
  const a=sculpture();
  a.stroke(shadow,[[-.64,-.95,0],[-.42,-.57,.038],[-.48,-.15,.08],[-.10,.24,.09],[.15,.63,.06],[.49,.97,0]],
    [.084,.081,.069,.047,.026,.005],26);
  const sprays=[
    [[-.47,-.26,.075],[-.21,-.27,.11],[.11,-.12,.14],[.40,-.19,.10]],
    [[-.29,.075,.085],[-.58,.24,.13],[-.56,.50,.15],[-.77,.65,.12]],
    [[.08,.47,.07],[.37,.48,.09],[.54,.65,.06],[.75,.68,.04]],
  ];
  for(const points of sprays){
    a.stroke(shadow,points,[.044,.034,.020,.003]);
    for(const [j,k] of [1,2,3].entries()){
      const [x,y,z]=points[k];
      for(let n=0;n<5;n++){
        const angle=n*PI*2/5+j*.71;
        a.ball(pale,x+.049*cos(angle),y+.052*sin(angle),z+.015,.055,.037,.021,0,0,angle);
      }
      a.ball(antique,x,y,z+.041,.026,.023,.013);
    }
  }
  for(const x of [-.04,.13]){
    a.stroke(shadow,[[.10,-.12,.14],[x,-.19,.15],[x-.02,-.26,.14]],[.011,.015,.005]);
    a.ball('#b29379',x,-.33,.14,.10,.126,.078,0,0,x*2);
  }
  p.shapes.peachCarving=a.finish();const mat=carvedMaterial();
  for(const s of [-1,1]){
    f.part('box',s*3.52,2.17,.305,1.92,2.88,.084,'#c2bda4',p.masonry);
    f.part('peachCarving',s*3.52,2.17,.367,1.06,1.22,.96,'#fff',mat);
    for(const dx of [-.97,.97])f.part('box',s*3.52+dx,2.17,.36,.042,2.92,.11,'#8a8a73',p.stone);
    for(const dy of [-1.45,1.45])f.part('box',s*3.52,2.17+dy,.36,1.95,.043,.11,'#8a8a73',p.stone);
  }
}

export function kesaMaterial() {
  // A woven diamond enclosing a lotus is stamped into the cast robe. The
  // continuous UVs on the garment carry both warp and motif through its folds.
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#dadcc9';g.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=3){g.fillStyle='rgba(85,90,73,.14)';g.fillRect(0,i,256,1);g.fillStyle='rgba(246,241,201,.37)';g.fillRect(i,0,1,256);}
  for(let j=-1;j<=2;j++)for(let i=-1;i<=2;i++){
    const x=i*128+(j%2)*64,y=j*128;
    g.strokeStyle='#b7b69b';g.lineWidth=2.5;g.beginPath();g.moveTo(x,y-61);g.lineTo(x+60,y);g.lineTo(x,y+61);g.lineTo(x-60,y);g.closePath();g.stroke();
    g.save();g.translate(x,y);
    for(let n=0;n<8;n++){g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-11,-14,-6,-25,0,-38);g.bezierCurveTo(9,-25,10,-13,0,0);g.stroke();g.rotate(PI/4);}
    g.restore();
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
  return brushWash(new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:.038,roughness:.83,metalness:.10,vertexColors:true,side:T.DoubleSide}),.14);
}
