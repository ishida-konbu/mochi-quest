import * as T from './vendor/three.module.min.js';
import { SilkPanels } from './kosode.js';
import { brushStroke } from './pilgrimage-pigment.js';

const tau=2*Math.PI,{sin,cos,abs,pow}=Math;
export const TOWNSFOLK=['壺装束の旅餅','文使いの餅','市女の餅','荷担ぎの餅','薬売りの餅'];
const styles=[
  ['#a6473d','#b88060','#d1ac69','#c45840',0],
  ['#626f80','#586270','#ad9871','#50485a',1],
  ['#a28265','#c6ad81','#699197','#8b6052',4],
  ['#868a73','#98a292','#87775f','#645a49',4],
  ['#857593','#9b9395','#a79a68','#5d6664',2],
];
const cache=new Map();
function wrap(p,y,thick,rx,rz,color){
  p.cut(3,38,(u,v)=>[rx*sin(tau*u),y+v*thick,rz*cos(tau*u)],4,color);
}
export function ancientClothing(kind){
  if(cache.has(kind))return cache.get(kind);
  const [outer,lining,accent,hakama,bolt]=styles[kind],p=new SilkPanels();
  const officer=kind===1,journey=kind===0,hem=journey?.33:officer?.38:kind===3?.57:.46;
  // The split hakama has separate tubular legs. Six pleats in each leg catch the wash.
  for(const side of [-1,1]){
    p.cut(12,26,(u,v)=>{
      const a=u*tau,r=.143+.068*sin(Math.PI*v)+.030*v+.020*cos(a*6+.26*v);
      return [side*(.168+.022*(1-v))+r*sin(a),.090+.575*v+.021*cos(3*a)*(1-v),
        .73*r*cos(a)-.031+.031*v];
    },4,hakama);
    if(kind===3||kind===4)for(let j=0;j<3;j++)p.cut(2,26,(u,v)=>{
      const a=u*tau,r=.164+.012*cos(6*a);return [side*.184+r*sin(a),.116+j*.049+v*.016,r*.73*cos(a)-.031];
    },4,accent);
  }
  function coat(u,v,pad=0){
    const a=(u-.5)*tau,s=sin(a),c=cos(a),waist=.053*Math.exp(-((v-.43)**2)/.012);
    const fold=(.022*cos(7*a+v*2.1)+.012*sin(4*a-v))*pow(1-v,1.2);
    const r=.45+.031*(1-v)-waist-.173*pow(v,4)+fold+pad;
    const sweep=journey?.072*(1-v)*(1-c):0;
    return [r*s,hem+(1.057-hem)*v+.018*(1-v)*sin(a*3+.35),
      r*.78*c-sweep+.012*pow(v,3)];
  }
  p.cut(21,56,coat,bolt,bolt===4?outer:'#fff');
  for(const [start,colour] of [[.015,lining],[.052,accent]])p.cut(2,56,(u,v)=>coat(u,start+.022*v,.007),4,colour);
  // The traveller's gathered uchiki exposes the inner layers at her walking hem.
  if(journey)for(let j=0;j<3;j++)p.cut(3,50,(u,v)=>{
    const a=(u-.5)*tau,r=.475-.008*j+.027*cos(7*a+.2*j);
    return [r*sin(a),hem-.034*j-.022+.035*v+.021*sin(a*3),.79*r*cos(a)-.078*(1-cos(a))];
  },4,['#ddd0ad','#8e9c79','#b77864'][j]);
  if(officer){
    p.cut(6,42,(u,v)=>{const a=u*tau;return [(.294+.032*v)*sin(a),1.03+.064*v,(.245+.025*v)*cos(a)];},4,'#6b6b69');
  } else for(const side of [-1,1])for(const [offset,c] of [[.013,'#d5c5a3'],[.027,lining]]){
    p.cut(17,4,(u,v)=>coat(.5+side*(.225*(1-v)-.08*v+offset+(u-.5)*.021),1-.49*v,.023),4,c);
  }
  for(const [base,thick,col] of [[.686,.056,accent],[.713,.016,'#7b6850']])wrap(p,base,thick,.426,.342,col);
  for(const side of [-1,1]){
    const wide=officer||journey,forward=side===1?.212:.11;
    const sleeve=(u,v)=>{
      const a=u*tau,dx=Math.sign(sin(a))*pow(abs(sin(a)),.72),dy=Math.sign(cos(a))*pow(abs(cos(a)),.76);
      return [side*(.265+.231*v+.039*sin(v*Math.PI))+.12*dx,.861-.107*v+
        (.13+(wide?.085:.023)*v)*dy-(wide?.07:.012)*v,
        -.030+(.14+forward)*v+.036*sin(v*Math.PI)+.012*cos(a*5)];
    };
    p.cut(12,32,sleeve,bolt,bolt===4?outer:'#fff');
    p.cut(3,32,(u,v)=>sleeve(u,.958+.04*v),4,lining);
    p.cut(6,32,(u,v)=>{
      const a=u*tau,edge=sleeve(u,1);return [edge[0]*(1-.16*v)+side*.073*v,
        edge[1]*(1-.22*v)+.157*v,edge[2]-.025*v+.004*sin(a)*v];
    },4,accent);
  }
  if(journey){
    // Thin travel veil opens over the face; its two front corners fall independently.
    for(const side of [-1,1])p.cut(17,30,(u,v)=>{
      const a=side*(.62+2.45*u),r=.531+.026*sin(8*a+v*2)-.068*v;
      return [r*sin(a),1.658-.50*v-.071*v*(1-cos(3*a))+.02*sin(5*a),r*.81*cos(a)-.022];
    },4,'#dfd4b7');
  }
  const g=p.finish();cache.set(kind,g);return g;
}
function cap(b,kind){
  const hat=new SilkPanels(),travel=kind===0,ink=kind===4?'#827971':'#373638';
  if(travel||kind===2){
    const R=travel?.61:.49,H=travel?.265:.225;
    hat.cut(14,56,(u,v)=>{
      const a=tau*u,r=R*pow(v,.79);return [r*sin(a),1.55+H*(1-v)+.032*cos(2*a)*v*v,
        r*.84*cos(a)-.012];
    },4);b.add(hat.finish(),travel?'#c6b28b':'#b09d78');
    for(let j=0;j<33;j++){
      const a=j*tau/33;const knots=[[.08,1.55+H*.88],[R*.57,1.55+H*.47],[R*.99,1.56+.032*cos(2*a)]].map(([r,y])=>[r*sin(a),y+.006,r*.84*cos(a)-.012]);
      b.add(brushStroke(knots,[.003,.006,.004],8,4),j%3?'#9c8b69':'#806d54');
    }
    for(const side of [-1,1]){
      const lock=[[side*.28,1.52,-.11],[side*.37,1.32,-.14],[side*.32,1.04,-.21],[side*.19,.83,-.23]];
      b.add(brushStroke(lock,[.071,.077,.050,.005],14,8),'#4d403d');
    }
  }else if(kind===1||kind===4){
    hat.cut(22,40,(u,v)=>{
      const a=tau*u,r=.34*(1-.64*v-.32*v**8)+.018*cos(6*a)*sin(Math.PI*v);
      return [r*sin(a)-.05*v*v,1.412+v*(kind===1?.55:.36),r*.85*cos(a)-.024-.21*v**1.8];
    },4);b.add(hat.finish(),ink);
    const crown=[[0,1.44,.267],[-.012,1.62,.177],[-.025,1.77,.028],[-.05,kind===1?1.947:1.762,-.196]];
    if(kind===1)b.stroke(crown,.006,'#736862',14);
    for(const side of [-1,1])b.stroke([[side*.32,1.45,.04],[side*.31,1.31,-.04],[side*.18,1.24,-.11]],.008,'#786653',10);
  }else{
    hat.cut(14,40,(u,v)=>{
      const a=u*tau,r=.42*cos(v*1.49);return [r*sin(a),1.425+.19*sin(v*1.49),r*.74*cos(a)-.024];
    },4);b.add(hat.finish(),'#9c9a80');
    for(const s of [-1,1])b.add(brushStroke([[-.32,1.46,-.16],[-.39,1.44,-.21],[s*.11-.38,1.33,-.25]],[.03,.053,.007],9,8),'#aaa284');
  }
}
export function townBody(b,kind){
  cap(b,kind);
  for(const s of [-1,1])b.ball(s*.50,.726,s===1?.35:.24,.081,.069,.082,kind===4?'#e6ceab':'#f4e4c6');
  if(kind===0){
    // Pilgrim's charm-case, knotted to a thin crossed cord.
    b.stroke([[-.25,1.017,.14],[-.12,.86,.309],[.09,.68,.34]],.010,'#8d6551');
    b.box(.10,.629,.351,.121,.134,.042,'#905e4a');
    for(let j=0;j<3;j++)b.rod([.053+j*.042,.568,.369],[.07+j*.041,.513,.374],.004,'#beaa79');
  }else if(kind===1){
    b.box(.443,.77,.386,.253,.156,.05,'#dfce9c',[.03,.37,-.15]);
    b.rod([.44,.65,.408],[.53,.93,.418],.006,'#54473b');
    b.rod([-.333,.65,.269],[-.61,.73,.276],.049,'#d6c6a6');
    b.rod([-.461,.684,.272],[-.48,.691,.272],.052,'#a85f4e');
  }else if(kind===2){
    const bowl=new T.LatheGeometry([[.02,0],[.17,.015],[.237,.09],[.29,.159],[.292,.18],[.275,.18],[.21,.1]]
      .map(q=>new T.Vector2(...q)),28);b.add(bowl,'#a88b5f',[.24,.57,.47]);
    for(let j=0;j<9;j++)b.ball(.24+.17*cos(j*2.39),.721+.022*(j%2),.47+.12*sin(j*2.39),.058,.067,.058,j%3?'#97834e':'#a6855d');
  }else{
    b.ball(0,.78,-.43,.255,.233,.196,kind===3?'#9c8c62':'#977d69');
    for(const s of [-1,1])b.stroke([[s*.16,.86,-.51],[s*.29,1,-.15],[s*.29,.91,.13],[s*.13,.66,.346]],.016,'#bba577',13);
    if(kind===4)for(let j=0;j<5;j++){
      const x=(j-2)*.048;b.rod([x,.98,-.45],[x*1.4,1.26+.02*cos(j),-.49],.009,'#798157');
      b.ball(x*1.3,1.19,-.49,.023,.064,.016,'#798b65',[.11,.2,x*3]);
    }
  }
}
