import * as T from './vendor/three.module.min.js';
import { SilkPanels } from './kosode.js';
import { foldMark } from './emaki-costume.js';
import { brushStroke } from './pilgrimage-pigment.js';

const tau=2*Math.PI,{sin,cos,abs,pow}=Math;
export { TOWNSFOLK } from './city-walkers.js';
const styles=[
  ['#a6473d','#b88060','#d1ac69','#c45840',0],
  ['#626f80','#586270','#ad9871','#50485a',1],
  ['#a28265','#c6ad81','#699197','#8b6052',2],
  ['#868a73','#98a292','#87775f','#645a49',4],
  ['#857593','#9b9395','#a79a68','#5d6664',2],
  ['#555b59','#a8a495','#87816e','#625c53',4],
];
const cache=new Map();
const monkKind=5, monkSleeves=[];
export function monasticHabit(){
  return {body:ancientClothing(monkKind),sleeves:monkSleeves};
}
export function ancientClothing(kind){
  if(cache.has(kind))return cache.get(kind);
  const [outer,lining,accent,hakama,bolt]=styles[kind],p=new SilkPanels();
  const officer=kind===1,journey=kind===0,monk=kind===monkKind,hem=monk?.19:journey?.33:officer?.38:kind===3?.57:.46;
  // The split hakama has separate tubular legs. Six pleats in each leg catch the wash.
  for(const side of [-1,1]){
    const leg=(u,v,pad=0)=>{
      const a=u*tau,r=pad+.143+.068*sin(Math.PI*v)+.030*v+.020*cos(a*6+.26*v);
      return [side*(.168+.022*(1-v))+r*sin(a),.090+.575*v+.021*cos(3*a)*(1-v),
        .73*r*cos(a)-.031+.031*v];
    };
    p.cut(15,32,leg,4,hakama);
    for(let j=0;j<6;j++){
      const a=j/6+.028;
      foldMark(p,leg,[[a-.04,.98],[a-.026,.66],[a+.018,.36],[a+.034,.043]],
        .026,'#706451',.003);
    }
    if(kind===3||kind===4)for(let j=0;j<3;j++)p.cut(2,26,(u,v)=>{
      const a=u*tau,r=.164+.012*cos(6*a);return [side*.184+r*sin(a),.116+j*.049+v*.016,r*.73*cos(a)-.031];
    },4,accent);
  }
  function coat(u,v,pad=0){
    const a=(u-.5)*tau,s=sin(a),c=cos(a),waist=.053*Math.exp(-((v-.43)**2)/.012);
    const gather=pow(1-v,1.2);
    const fold=(.030*cos(7*a+v*2.1)+.022*sin(4*a-2.6*v))*gather
      +.018*sin(5*a-3*v)*sin(Math.PI*v);
    const r=.45+.031*(1-v)-waist-.173*pow(v,4)+fold+pad;
    const sweep=journey?.072*(1-v)*(1-c):0;
    return [r*s+.023*gather,hem+(1.057-hem)*v+(.022*sin(a*3+.35)+.027*s)*gather,
      r*.78*c-sweep+.012*pow(v,3)];
  }
  p.cut(21,56,coat,bolt,bolt===4?outer:'#fff');
  for(const [start,colour] of [[.015,lining],[.052,accent]])p.cut(2,56,(u,v)=>coat(u,start+.022*v,.007),4,colour);
  // Radiating strokes converge beneath the sash. Broken, shorter counterfolds
  // at the haunch prevent the back from reading as another identical front.
  const field=officer?'#656870':kind===3?'#736f5e':'#9f8b71';
  for(let j=0;j<13;j++){
    const u=(j+.12)/13,a=u*tau,lean=.025*sin(2*a+.62*kind);
    const knots=[[u+lean,.49],[u+.7*lean,.37],[u-.45*lean,.17],[u-.73*lean,.052]];
    foldMark(p,coat,knots,.0055+(j%3)*.0008,field);
    if(j%3===1)foldMark(p,coat,knots.slice(1).map(([x,y])=>[x+.009,y+.014]),
      .008,'#d4c3a1',.007);
  }
  // The flat left overlap turns across the belly into the walking hem.
  p.cut(15,5,(u,v)=>{
    const cut=.49+.11*v-.025*sin(v*Math.PI);
    return coat(cut+(u-.5)*.019,.49*(1-v)+.031*v,.008+.009*sin(u*Math.PI));
  },4,lining);
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
  const beltV=(.706-hem)/(1.057-hem);
  for(const [base,thick,col] of [[-.028,.063,accent],[.008,.013,'#77664f']]){
    p.cut(4,48,(u,v)=>coat(u,beltV+(base+v*thick)/(1.057-hem),.022),4,col);
  }
  if(monk){
    // The kesa passes over one shoulder and under the opposite arm. Piece
    // its five columns on the same folded surface as the plain hemp robe.
    const kesa=(u,v,pad=0)=>{
      const a=(u-.5)*tau,shoulder=.5-.5*sin(a);
      const top=.57+.42*shoulder,hem=.22+.11*shoulder;
      return coat(u,hem+(top-hem)*v,.044+pad);
    };
    for(let i=0;i<5;i++){
      const seam=i%2?.35:.65;
      for(const [lo,hi] of [[0,seam],[seam,1]]){
        p.cut(7,12,(u,v)=>kesa((i+u)/5,lo+v*(hi-lo)),4,
          ['#ae8852','#997449','#a88859','#b09160'][(i+(lo?2:0))%4]);
      }
      p.cut(2,12,(u,v)=>kesa((i+u)/5,seam+(v-.5)*.032,.003),4,'#796341');
      p.cut(12,2,(u,v)=>kesa((i+u*.026)/5,v,.005),4,'#746043');
    }
    for(const band of [0,.96])p.cut(2,60,(u,v)=>kesa(u,band+v*.04,.007),4,'#c8ac77');
  }
  for(const side of [-1,1]){
    const sleevePanels=monk?new SilkPanels():p;
    const wide=officer||journey,forward=side===1?.212:.11;
    const wrist=kind===1&&side===1?.037:kind===3?-.052:0;
    const sleeve=(u,v)=>{
      const a=u*tau,dx=Math.sign(sin(a))*pow(abs(sin(a)),.72),dy=Math.sign(cos(a))*pow(abs(cos(a)),.76);
      return [side*(.265+.231*v+.039*sin(v*Math.PI))+.12*dx,.861-.107*v+
        (.13+(wide?.085:.023)*v)*dy-(wide?.07:.012)*v+wrist*v
          -.078*(1-dy)*.5*sin(Math.PI*v*.85),
        -.030+(.14+forward)*v+.036*sin(v*Math.PI)+.012*cos(a*5)];
    };
    sleevePanels.cut(16,36,sleeve,bolt,bolt===4?outer:'#fff');
    for(let j=0;j<4;j++){
      const start=side>0?.18+j*.08:.82-j*.08;
      foldMark(sleevePanels,(u,v,pad)=>{
        const q=sleeve(u,v),a=u*tau;q[0]+=pad*sin(a);q[1]+=pad*cos(a);return q;
      },[[start,.15],[start+.022*side,.40],[start+.056*side,.69],[start+.038*side,.94]],
      .023,field,.003);
    }
    // Sew the hanging lower cuff, leaving a wrist opening above its seam.
    const pocket=(u,v)=>{
      const a=.219+.281*v,l=sleeve(a,1),r=sleeve(1-a,1);
      return l.map((n,j)=>n+(r[j]-n)*u+(j===2?.012*sin(Math.PI*u)*sin(Math.PI*v):0));
    };
    sleevePanels.cut(10,12,pocket,bolt,bolt===4?outer:'#fff',(u,v)=>[.40+.43*u,.05+.33*v]);
    sleevePanels.cut(2,12,(u,v)=>pocket(u,.023+.028*v),4,lining);
    sleevePanels.cut(3,32,(u,v)=>sleeve(u,.962+.037*v),4,lining);
    sleevePanels.cut(6,32,(u,v)=>{
      const a=u*tau,edge=sleeve(u,1);return [edge[0]*(1-.16*v)+side*.073*v,
        edge[1]*(1-.22*v)+.157*v,edge[2]-.025*v+.004*sin(a)*v];
    },4,accent);
    if(monk)monkSleeves.push(sleevePanels.finish());
  }
  const g=p.finish();cache.set(kind,g);return g;
}
export function townHeadwear(b,kind){
  const hat=new SilkPanels(),travel=kind===0,ink=kind===4?'#827971':'#373638';
  if(travel){
    for(const side of [-1,1]){
      const veil=new SilkPanels();
      const cloth=(u,v,pad=0)=>{
        const a=side*(.78+2.33*u-.12*v),r=.515+(.022+.027*v)*sin(7*a-1.5*v)-.059*v+pad;
        return [r*sin(a),1.602-.498*v-.091*v*(1-cos(3*a))+.021*sin(5*a)+.04*u*v,
          r*.81*cos(a)-.044-.055*v*v];
      };
      veil.cut(20,33,cloth,4);
      b.add(veil.finish(),'#d5c7a7');
      for(let i=0;i<6;i++){
        const u=(i+.3)/6;
        b.add(brushStroke([[u-.028,.06],[u-.013,.34],[u+.020,.67],[u,.95]]
          .map(([x,y])=>cloth(x,y,.004)),[.0008,.0035,.0045,.0005],10,5),i%2?'#b3a180':'#c0ad8c');
      }
    }
  }
  if(kind!==3){
    // Fit the hair to measured horizontal sections of the rice bust. A
    // continuous parted hairline joins the crown, temples and nape.
    const contour=[[1.07,.487,.354],[1.15,.511,.374],[1.25,.505,.370],
      [1.30,.486,.358],[1.35,.465,.342],[1.40,.431,.318],[1.45,.387,.286],
      [1.50,.318,.238],[1.55,.216,.163],[1.57,.155,.117],[1.583,.050,.042]];
    function hair(u,v,pad=0){
      const a=(u-.5)*tau,side=abs(a),t=T.MathUtils.smoothstep(side,.57,1.48),
        back=T.MathUtils.smoothstep(side,1.49,2.45);
      const end=1.51-.182*t-.100*back-(travel?.052:0)*t+.012*sin(4*a)*t;
      const y=1.582+(end-1.582)*v;
      const i=contour.findIndex(q=>q[0]>=y),lo=contour[Math.max(0,i-1)],hi=contour[i];
      const mix=(y-lo[0])/Math.max(.0001,hi[0]-lo[0]);
      const rx=lo[1]+(hi[1]-lo[1])*mix+.010+pad,rz=lo[2]+(hi[2]-lo[2])*mix+.011+pad;
      return [rx*sin(a),y,rz*cos(a)-.010];
    }
    const crown=new SilkPanels();crown.cut(17,52,hair,4);b.add(crown.finish(),'#5d5144');
    for(let j=0;j<27;j++){
      const u=(j+.32)/27,side=u<.5?-1:1;
      const strand=[[u-side*.078,.11],[u-side*.066,.38],[u-side*.038,.67],[u,.975]]
        .map(([a,v])=>hair(a,v,.004));
      b.add(brushStroke(strand,[.0006,.0028,.0024,.0004],10,4),j%4?'#7d6f5d':'#a18c72');
    }
  }
  if(travel||kind===2){
    const R=travel?.61:.49,H=travel?.265:.225;
    hat.cut(14,56,(u,v)=>{
      const a=tau*u,r=R*pow(v,.79);return [r*sin(a)+.031*(1-v),1.55+H*(1-v)+(.032*cos(2*a)+.019*sin(a))*v*v,
        r*.84*cos(a)-.012];
    },4);b.add(hat.finish(),travel?'#c6b28b':'#b09d78');
    for(let j=0;j<33;j++){
      const a=j*tau/33;const knots=[[.08,1.55+H*.88],[R*.57,1.55+H*.47],[R*.99,1.556+.032*cos(2*a)+.019*sin(a)]].map(([r,y])=>[r*sin(a),y+.006,r*.84*cos(a)-.012]);
      b.add(brushStroke(knots,[.003,.006,.004],8,4),j%3?'#9c8b69':'#806d54');
    }
    const edge=Array.from({length:43},(_,i)=>{
      const a=tau*i/42;return [R*sin(a),1.55+.032*cos(2*a)+.019*sin(a),R*.84*cos(a)-.012];
    });
    b.add(brushStroke(edge,[.003,.007,.005,.006,.003],48,5),'#796b55');
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
export function townHand(b,kind,side){
  const z=side>0?.35:.24,wrist=kind===1&&side===1?.037:kind===3?-.052:0;
  const hand=[[side*.48,.749+wrist,z-.05],[side*.515,.754+wrist,z],
    [side*.512,.728+wrist,z+.049],[side*.484,.713+wrist,z+.077]];
  b.add(brushStroke(hand,[.045,.067,.054,.014],13,10),kind===4?'#e3ccae':'#ecdbc0');
  for(let j=0;j<2;j++)b.add(brushStroke([[side*(.476+j*.024),.716+wrist,z+.058],
    [side*(.484+j*.023),.732+wrist,z+.064],[side*(.495+j*.020),.736+wrist,z+.066]],
    [.001,.003,.0005],5,4),'#aa9176');
}
export function townBody(b,kind){
  for(const side of [-1,1])townHand(b,kind,side);
  if(kind===0){
    const staff=[[-.51,.116,.39],[-.532,.45,.332],[-.511,.735,.302],
      [-.538,1.18,.341],[-.58,1.48,.360],[-.572,1.542,.378]];
    b.add(brushStroke(staff,[.014,.020,.021,.017,.020,.012],22,7),'#775f41');
    b.add(brushStroke([[-.581,1.43,.36],[-.55,1.414,.358],[-.536,1.348,.344],[-.538,1.299,.354]],
      [.005,.010,.005,.001],9,5),'#9d684b');
    // Pilgrim's charm-case, knotted to a thin crossed cord.
    b.stroke([[-.25,1.017,.14],[-.12,.86,.309],[.09,.68,.34]],.010,'#8d6551');
    b.box(.10,.629,.351,.121,.134,.042,'#905e4a');
    for(let j=0;j<3;j++)b.rod([.053+j*.042,.568,.369],[.07+j*.041,.513,.374],.004,'#beaa79');
  }else if(kind===1){
    b.box(.443,.77,.386,.253,.156,.05,'#dfce9c',[.03,.37,-.15]);
    b.rod([.44,.65,.408],[.53,.93,.418],.006,'#54473b');
    for(let i=0;i<4;i++){
      const x=.415+.024*i;
      b.add(brushStroke([[x,.821-.004*i,.421],[x+.006,.81,.419],[x-.001,.798,.417],[x+.005,.786,.414]],
        [.0007,.002,.0014,.0004],5,4),'#786c56');
    }
    b.rod([-.333,.65,.269],[-.61,.73,.276],.049,'#d6c6a6');
    b.rod([-.461,.684,.272],[-.48,.691,.272],.052,'#a85f4e');
  }else if(kind===2){
    const bowl=new T.LatheGeometry([[.02,0],[.17,.015],[.237,.09],[.29,.159],[.292,.18],[.275,.18],[.21,.1]]
      .map(q=>new T.Vector2(...q)),28);b.add(bowl,'#a88b5f',[.24,.57,.47]);
    // Slender stakes turn up the basket's belly; a bound double rim
    // and alternating rings catch the opposite sides of each reed.
    for(let j=0;j<27;j++){
      const a=j*tau/27;
      const ribs=[[.11,.006],[.176,.028],[.242,.101],[.291,.168]].map(([r,y])=>[.24+r*sin(a),.574+y,.47+r*cos(a)]);
      b.add(brushStroke(ribs,[.002,.0045,.004,.002],7,4),j%2?'#c4ab79':'#866d4b');
    }
    for(const [r,y] of [[.222,.076],[.262,.129],[.288,.164],[.292,.179]]){
      const ring=Array.from({length:33},(_,i)=>{const a=i*tau/32;return [.24+r*sin(a),.571+y+.002*sin(14*a),.47+r*cos(a)];});
      b.add(brushStroke(ring,[.004,.005,.004],36,4),'#b79a68');
    }
    for(let j=0;j<9;j++)b.ball(.24+.17*cos(j*2.39),.721+.022*(j%2),.47+.12*sin(j*2.39),.058,.067,.058,j%3?'#97834e':'#a6855d');
  }else{
    if(kind===3){
      const bag=new SilkPanels();
      const wrap=(u,v,pad=0)=>{
        const a=tau*u,h=v*Math.PI,r=.011+.296*pow(sin(h),.64),knot=v**4;
        const gather=(.021+.018*knot)*cos(a*7+2.2*v)*sin(h);
        return [(.032+.054*knot)+(r+gather+pad)*sin(a),.49+.70*v+.020*cos(3*a)*sin(h),
          -.419+(r*.76+gather+pad)*cos(a)-.062*sin(h)];
      };
      bag.cut(22,41,wrap,4); b.add(bag.finish(),'#a79870');
      for(let j=0;j<10;j++){
        const a=(j+.17)/10;
        b.add(brushStroke([[a-.032,.20],[a+.036,.47],[a+.027,.74],[a,.944]].map(([u,v])=>wrap(u,v,.004)),
          [.001,.005,.008,.001],13,5),'#897952');
      }
      for(const d of [-1,1])b.add(brushStroke([[.083,1.13,-.432],[.09+d*.053,1.178,-.435],
        [.09+d*.093,1.151,-.448],[.09+d*.129,1.096,-.448]],[.015,.032,.024,.002],9,7),'#877b59');
    }else{
      // A lacquered dispensary on the back. Its drawers face away from the
      // carrier, with a lip, two corner bindings and recessed pull cords.
      b.box(0,.845,-.427,.425,.47,.245,'#7f6c55',[.035,0,0]);
      for(let j=0;j<3;j++){
        const y=.70+j*.132;b.box(0,y,-.556,.373,.116,.020,j%2?'#967c5e':'#a78d6c');
        b.add(brushStroke([[-.051,y+.021,-.572],[-.033,y-.008,-.579],[.016,y-.011,-.58],[.047,y+.018,-.573]],
          [.005,.007,.006,.003],8,5),'#5a5144');
      }
      for(const d of [-1,1])b.box(d*.184,.845,-.573,.021,.464,.020,'#b4a07a');
    }
    for(const s of [-1,1])b.stroke([[s*.16,.86,-.51],[s*.29,1,-.15],[s*.29,.91,.13],[s*.13,.66,.346]],.016,'#bba577',13);
    if(kind===4)for(let j=0;j<5;j++){
      const x=(j-2)*.048;b.rod([x,.98,-.45],[x*1.4,1.26+.02*cos(j),-.49],.009,'#798157');
      b.ball(x*1.3,1.19,-.49,.023,.064,.016,'#798b65',[.11,.2,x*3]);
    }
  }
}
