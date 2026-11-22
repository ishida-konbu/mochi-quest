import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface,rod,turning } from './village-bath-figures.js';

const {PI,sin,cos}=Math,tau=2*PI;
const roofs={
  bark:['#716657','#a4977a'],thatch:['#8d7b58','#c4b084'],slate:['#666d6c','#94958a'],
  hull:['#74685a','#aa977b'],shake:['#766854','#aa9473'],tile:['#565b59','#868882'],
  snow:['#92958e','#e9e8dd'],
};

function cover(s,plan,seed){
  const {cover,room:r}=plan,w=r.w/2+.33,d=r.d/2+.325;
  const [dark,pale]=roofs[cover].map(col=>new T.Color(col));
  const rows=cover==='tile'?4:cover==='thatch'?5:cover==='slate'?4:6;
  // Each run of shingles overlaps the one below. The exposed edges include
  // the dark end grain. The eaves of the overturned hull turn up at the ends.
  const shape=(side,x,t,course,lift=0)=>{
    const edge=x/w, bow=cover==='hull'?.14*edge**4:cover==='tile'?.060*edge**4:.02*edge**2;
    const sag=cover==='hull'?.21:cover==='bark'?.10:cover==='snow'?.04:.073;
    const grain=cover==='thatch'?.014*sin(x*67+course*1.92)+.011*sin(x*41-seed):0;
    return [x,r.eave+r.rise*t-sag*sin(PI*t)+bow*(1-t)+lift+grain,
      side*(d*(1-t)+grain+.012*cos(x*9+course+seed))];
  };
  for(const side of [-1,1]){
    s.add(surface(20,8,(u,t)=>shape(side,(2*u-1)*w,t,0,-.025)),'#736958');
    for(let course=0;course<rows;course++){
      const t0=course/rows,t1=Math.min(1,(course+1.32)/rows);
      const count=cover==='tile'?16:cover==='slate'?6:cover==='thatch'?12:10;
      for(let cell=-(course%2);cell<count;cell++){
        const stagger=(course%2)*.5;
        const left=Math.max(-w,(2*(cell+stagger)/count-1)*w),
          right=Math.min(w,(2*(cell+1+stagger)/count-1)*w);
        if(right-left<.01)continue;
        const phase=cell*2.399+course*1.82+seed;
        function board(u,v){
          const x=left+(right-left)*u;
          const split=(cover==='tile'?0:.012)*(sin(phase)+.40*sin(PI*u*4+phase))*(1-v);
          const t=t0+(t1-t0)*v+split;
          const arch=cover==='tile'?.047*cos(u*tau):cover==='snow'?.014*sin(PI*u):.004*sin(PI*u);
          return shape(side,x,t,course,.013+(1-v)*.028+arch);
        }
        const colour=(u,v)=>dark.clone().lerp(pale,T.MathUtils.clamp(.42+.14*cos(phase)+.12*v+
          (cover==='thatch'?.17*sin(u*PI*14+phase):.08*cos(u*PI*2)),0,1));
        const nu=cover==='tile'?8:cover==='thatch'?14:4;
        s.add(surface(nu,4,board,colour),'#fff');
        s.add(surface(nu,1,(u,v)=>{
          const a=board(u,0);a[1]-=(1-v)*(cover==='thatch'?.069:cover==='slate'?.035:.023);
          return a;
        }),cover==='snow'?'#b5b7af':dark);
      }
    }
    if(cover==='slate'||cover==='shake'){
      for(const t of [.22,.65]){
        const ends=[shape(side,-w+.04,t,0,.082),shape(side,w-.04,t,0,.082)];
        rod(s,'#746951',...ends,.035);
        for(const i of [-1,1]){
          const p=shape(side,.63*w*i,t,0,.14);
          s.ball(i>0?'#918d7f':'#777a71',...p,.16,.079,.13,0,seed+i);
        }
      }
    }
    if(cover==='thatch'){
      for(let j=0;j<32;j++){
        const x=w*(-.98+j*.063),q=shape(side,x,.09,0,.035),b=shape(side,x+.02*cos(j),0,0,-.055-.023*cos(j));
        s.stroke(j%4?'#b6a277':'#8e7c5c',[q,[x,q[1]-.06,(q[2]+b[2])*.5],b],[.009,.012,.002],4);
      }
    }
    // Solid triangular end-grain and the visible soffit beneath the covering.
    for(const end of [-1,1]){
      s.add(surface(8,1,(u,v)=>{const a=shape(side,end*(w-.11),u,0,-.04);
        a[1]=r.eave-.08+(a[1]-r.eave+.08)*v;return a;
      }),'#85755d');
    }
    for(let i=-3;i<=3;i++){
      const x=i*w/3.4;
      rod(s,plan.wood,shape(side,x,0,0,-.09),shape(side,x,1,0,-.11),.044,.054);
    }
  }
  const y=r.eave+r.rise;
  if(cover==='tile'){
    for(let i=0;i<12;i++){
      const left=-w+i*w/6;
      s.add(surface(9,2,(u,v)=>[left+v*(w/6+.012),y+.04+.074*sin(PI*u),.083*cos(PI*u)]),'#787b73');
    }
  }else{
    rod(s,plan.wood,[-w-.06,y+.035,0],[w+.06,y+.044,0],cover==='thatch'?.082:.055);
    if(cover==='thatch')for(let i=-2;i<=2;i++)for(const side of [-1,1])
      rod(s,'#8b7959',[i*w*.39,y-.22,side*.28],[i*w*.39+.016,y+.14,-side*.12],.032,.026);
  }
}

function sideHook(s,x,y,z,shade){
  s.stroke(shade,[[x-.079,y,z-.13],[x-.05,y-.075,z],[x+.015,y-.079,z+.053],
    [x+.031,y-.01,z+.074]],[.018,.022,.019,.010],9);
}
function splitBasket(s,x,y,z,w,h,kind){
  const shade=kind==='peach'?'#bba17c':'#a89770';
  const point=(a,v)=>[x+w*(.65+.35*v)*cos(a),y+h*v,z+w*(.51+.28*v)*sin(a)];
  for(let j=0;j<16;j++)rod(s,shade,point(j*tau/16,0),point(j*tau/16,1),.013);
  for(let j=0;j<=7;j++){
    const v=j/7,ring=Array.from({length:33},(_,k)=>point(k*tau/32,v+.012*cos(k*PI)));
    s.stroke(j%2?shade:'#938162',ring,ring.map(()=>j===7?.016:.010),32);
  }
}
function benchWork(s,kind,r){
  const z=-.20, back=-r.d/2+.095;
  if(['slate','cedar','maple'].includes(kind)){
    // A real pair of geta, with a three-point thong and two cross-grain teeth.
    for(const side of [-1,1]){
      const x=-.65+.126*side;
      s.add(surface(18,3,(u,v)=>{const a=u*tau;return [x+.102*Math.sign(cos(a))*Math.abs(cos(a))**.58,
        .226+.054*v,z+.22*Math.sign(sin(a))*Math.abs(sin(a))**.67];}),'#ae9470');
      s.add(surface(18,2,(u,v)=>{const a=u*tau;return [x+.102*v*Math.sign(cos(a))*Math.abs(cos(a))**.58,
        .28,z+.22*v*Math.sign(sin(a))*Math.abs(sin(a))**.67];}),'#bcaa85');
      for(const k of [-1,1]){
        s.box('#8b795d',x,.211,z+.12*k,.16,.05,.046);
        s.stroke('#625445',[[x+.082*k,.277,z-.068],[x+.063*k,.35,z+.012],
          [x+.012*k,.332,z+.102],[x,.277,z+.14]],[.014,.021,.018,.012],7);
      }
    }
    if(kind==='maple')splitBasket(s,.88,.19,z,.22,.24,kind);
  }else if(['reed','peach','susuki'].includes(kind)){
    const x=-.84;
    splitBasket(s,x,.19,z,.28,kind==='reed'?.49:.34,kind);
    for(let i=-2;i<=2;i++)s.stroke(kind==='peach'?'#805c48':'#97835e',[[x+.033*i,.40,z],[x+.037*i,.63,z],
      [x+.075*i,.85+.063*cos(i*2),z-.05]],[.011,.010,.004],5);
  }else if(['tsuruga','coast'].includes(kind)){
    // A loosely hung coil of hemp, with its own wall peg above the oar.
    const x=-.63;
    sideHook(s,x,1.45,back+.07,'#695747');
    for(let j=0;j<4;j++){
      const pts=Array.from({length:31},(_,k)=>{
        const a=k*tau/30;return [x+(.183+.011*j)*sin(a)+.011*j,
          1.15+.26*cos(a),back+.092+j*.014+.021*sin(2*a)];});
      s.stroke(j%2?'#aa9571':'#938263',pts,pts.map(()=>.017),30);
    }
    s.stroke('#9b8664',[[x+.13,1.27,back+.12],[x+.25,1.09,back+.16],[x+.24,.88,back+.15],[x+.32,.80,back+.20]],[.017,.018,.017,.013],9);
  }else if(kind==='snow'){
    for(const side of [-1,1]){
      const x=-.66+.17*side;
      const loop=Array.from({length:37},(_,k)=>{const a=k*tau/36;return [x+.13*sin(a),1.19+.29*cos(a),back+.07];});
      s.stroke('#967e5d',loop,loop.map(()=>.029),36);
      for(let j=-2;j<=2;j++){
        const y=1.19+.08*j,w=.118*Math.sqrt(1-(.08*j/.29)**2);
        rod(s,'#b19b72',[x-w,y-.018,back+.068],[x+w,y+.018,back+.074],.012);
      }
      sideHook(s,x,1.48,back+.09,'#705e48');
    }
  }else{
    const glaze=kind==='capital'?'#a2aba0':'#918b7c';
    const x=.83;
    turning(s,glaze,x,.18,z,[[.01,.00],[.16,0],[.17,.05],[.21,.13],[.236,.30],
      [.222,.41],[.14,.48],[.138,.52],[.163,.53],[.163,.56],[.11,.56],[.11,.49],[.01,.37]],28);
    for(let j=0;j<3;j++)s.stroke('#77654f',[[x+.036*j,.62,z],[x+.051*j,.86,z+.048*j],[x+.16*j,1.13-.079*j,z+.064*j]],
      [.015,.013,.008],5);
  }
}

export function dressWaysideShelter(p,f,plan,site){
  const {room:r}=plan,key='wayside-roof-'+site.kind;
  if(!p.shapes[key]){
    const s=sculpture();
    cover(s,plan,site.index*.81);
    benchWork(s,site.kind,r);
    p.shapes[key]=s.finish();
  }
  f.put(key,r.u,0,r.v,1,1,1,'#fff',p.stems);
}
