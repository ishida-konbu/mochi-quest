// A salt-pruned kuromatsu. Each crown grows from its own twig. Needle pairs
// are wide at the sheath and taper independently above a darker inner bough.
import * as T from './vendor/three.module.min.js';
import { surface,dab } from './village-bath-figures.js';

const {sin,cos,PI}=Math,tau=PI*2;
const umber='#514b3f',oldWood='#7c725e',deadWood='#b1a48b';
function random(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
export function matsuhamaPine(s){
  const rng=random(47338);
  const trunk=[[0,-.18,0],[.10,.43,.06],[-.14,1.05,.04],[-.47,1.62,-.06],[-.53,2.20,-.20],
    [-.32,2.64,-.22],[-.47,3.11,-.18],[-1.04,3.57,-.12],[-1.36,3.76,-.20]];
  const widths=[.32,.281,.247,.208,.169,.143,.119,.081,.027];
  s.stroke(umber,trunk,widths,42);
  // Broken bark ridges taper into each fork. Separating the fissures keeps
  // the dark trunk readable against both the sky and the pale plaster.
  const spine=new T.CatmullRomCurve3(trunk.map(v=>new T.Vector3(...v)));
  for(let j=0;j<38;j++){
    const start=rng()*.85,len=.07+.19*rng(),a=tau*rng(),points=[];
    for(let n=0;n<7;n++){
      const t=Math.min(.995,start+len*n/6),p=spine.getPoint(t),i=t*(widths.length-1),k=Math.floor(i);
      const rad=(widths[k]+(widths[k+1]-widths[k])*(i-k))*.88;
      const q=a+.25*sin(n*.69+j);
      points.push([p.x+cos(q)*rad,p.y,p.z+sin(q)*rad]);
    }
    s.stroke(j%4===0?deadWood:oldWood,points,[.004,.011,.017,.018,.015,.011,.002],7);
  }
  for(let i=0;i<7;i++){
    const a=tau*i/7+.31*rng(),length=.61+.43*rng();
    s.stroke(i%3?umber:oldWood,[[.05,.31,.04],[.25*cos(a),.08,.25*sin(a)],
      [length*.64*cos(a+.15),.039,length*.64*sin(a+.15)],[length*cos(a),-.09,length*sin(a)]],
      [.107,.13,.071,.014],12);
  }
  const p=[],c=[],idx=[],needleTone=['#38574b','#466652','#526f59','#627b60','#758369'].map(x=>new T.Color(x));
  function tuft(x,y,z,size,a){
    for(let i=0;i<16;i++){
      const t=i/15,b=a+(rng()-.5)*3.60,lean=.42+.63*rng(),length=(.18+.125*rng())*size;
      const xx=x+cos(b)*.045*size,zz=z+sin(b)*.045*size,col=needleTone[(rng()*5)|0];
      for(const split of [-1,1]){
        const phi=b+.15*split,dx=cos(phi),dz=sin(phi),w=(.013+.009*rng())*size,off=p.length/3;
        p.push(xx-w*dz,y,zz+w*dx,xx+w*dz,y,zz-w*dx,
          xx+dx*length*lean+w*.36*dz,y+.65*length*(.53+t*.42),zz+dz*length*lean-w*.36*dx,
          xx+dx*length*(1.18+.18*rng()),y+length*(.67+t*.41),zz+dz*length*(1.18+.18*rng()));
        for(const factor of [.63,.79,.97,1.09])c.push(col.r*factor,col.g*factor,col.b*factor);
        idx.push(off,off+1,off+2,off,off+2,off+3);
      }
    }
  }
  const limbs=[
    [[-.21,1.15,.03],[-.75,1.08,.19],[-1.37,1.20,.49],[-2.05,1.44,.71],[-2.58,1.69,.66]],
    [[-.40,1.70,-.08],[.03,1.47,.14],[.72,1.59,.56],[1.17,1.87,.86],[1.78,1.98,.88]],
    [[-.51,2.05,-.16],[-1.07,1.88,-.35],[-1.69,2.03,-.71],[-2.34,2.38,-.76],[-2.89,2.49,-.68]],
    [[-.37,2.48,-.19],[.13,2.39,-.38],[.67,2.50,-.72],[1.01,2.86,-.78],[1.42,2.93,-.89]],
    [[-.44,2.90,-.15],[-.87,2.81,.14],[-1.43,3.00,.39],[-1.78,3.28,.45],[-2.25,3.33,.54]],
    [[-.56,3.11,-.17],[-.13,3.04,.14],[.26,3.25,.37],[.54,3.43,.44],[.85,3.51,.56]],
    [[-.89,3.48,-.11],[-1.16,3.48,-.24],[-1.55,3.58,-.40],[-1.89,3.80,-.45],[-2.19,3.90,-.42]],
    [[-1.25,3.72,-.15],[-1.44,3.73,.02],[-1.67,3.84,.08],[-1.92,4.05,.15],[-2.14,4.12,.22]],
  ];
  for(const [j,limb] of limbs.entries()){
    const size=1.03-.043*j,heading=Math.atan2(limb[4][2]-limb[1][2],limb[4][0]-limb[1][0]);
    s.stroke(umber,limb,[.14*size,.104*size,.072*size,.040*size,.015],18);
    for(let k=1;k<5;k++)for(const side of [-1,1]){
      const [x,y,z]=limb[k],b=heading+side*(.69+.50*rng()),length=(.32+.39*rng())*size;
      const tip=[x+length*cos(b),y+.17+.12*rng(),z+length*sin(b)];
      s.stroke(oldWood,[[x,y,z],[x+.48*length*cos(b),y+.03,z+.48*length*sin(b)],tip],[.033*size,.023,.009],6);
      for(let n=0;n<5;n++){
        const a=b+(n-2)*.58,rr=(.16+.18*rng())*size;
        const xx=tip[0]+rr*cos(a),zz=tip[2]+rr*sin(a),yy=tip[1]+.11+.13*rng();
        s.stroke('#635f4a',[tip,[(tip[0]+xx)/2,yy-.11,(tip[2]+zz)/2],[xx,yy,zz]],[.013,.011,.005],4);
        tuft(xx,yy,zz,size,a);
      }
    }
  }
  const g=new T.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();s.add(g,'#fff');
  s.stroke(deadWood,[[-.45,2.20,-.23],[-.70,2.36,-.53],[-.92,2.58,-.58],[-.94,2.70,-.57]],[.075,.056,.032,.005],10);
  for(let i=0;i<4;i++)dab(s,i%2?'#89897a':'#a4a28a',.40*cos(i*2.34),-.043,.46*sin(i*2.34),.24,.15,.17,0,i);
}
