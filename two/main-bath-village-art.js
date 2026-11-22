import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { matsuhamaNetMender } from './matsuhama-saltworks.js';
import { inkVolume } from './scroll-sculpt.js';
import { bather, surface, rod, turning, dab, ink, bone, reed, wood } from './village-bath-figures.js';

const {sin,cos,PI}=Math,tau=2*PI;
const bark='#705747',olive='#768365',rice='#c5a367';

function border(s,col,at,r,n=32){
  const points=Array.from({length:n+1},(_,i)=>at(i/n));
  s.stroke(col,points,points.map(()=>r),n);
}
function slab(s,x,y,z,w,h,d,seed,lower,upper){
  const strata=[[.12,-.01],[.73,0],[.96,.11],[1,.34],[.94,.46],[.995,.57],[.94,.74],[.80,.93],[.54,1],[.001,1.02]];
  const shade=new T.Color(lower),light=new T.Color(upper);
  s.add(surface(40,strata.length-1,(u,v)=>{
    const a=-u*tau,j=Math.round(v*(strata.length-1)),[r,level]=strata[j];
    const chip=1+.085*sin(3*a+seed)+.042*sin(7*a+seed*.6)+.029*sin(11*a+j*.39);
    return [r*w*chip*cos(a),h*(level+.045*r*sin(2*a+seed)),d*r*chip*sin(a)];
  },(u,v)=>shade.clone().lerp(light,Math.min(1,.13+.70*v+.12*cos(6*PI*v)+.045*sin(u*tau*7+seed)))),'#fff',x,y,z);
}
let flower;
function cherry(s,x,y,z,scale,roll){
  if(!flower){
    const f=sculpture();
    for(let j=0;j<5;j++){
      const a=j*tau/5;
      f.add(surface(6,6,(u,v)=>{
        const w=(u-.5)*.91*sin(PI*v*.79)**.85;
        const r=v*(1-.24*(sin(PI*u)**16)*v**3);
        return [r*cos(a)-w*sin(a),r*sin(a)+w*cos(a),.19*r-.19*Math.abs(w)+.06*sin(v*PI)];
      }),j%2?'#ecd1ba':'#dca8a0');
    }
    dab(f,'#b08959',0,0,.08,.16,.14,.10);flower=f.finish();
  }
  s.add(flower,'#fff',x,y,z,scale,scale,scale,-.63+.16*sin(roll),.21*cos(roll),roll);
}

function petalRaft(s){
  for(const x of [-.82,.73])s.box(bark,x,.060,-.06,.14,.12,.99);
  for(let j=0;j<6;j++){
    const z=-.47+j*.16,length=2.72+.14*cos(j*1.88),y=.19+.018*cos(j);
    rod(s,j%2?'#b19365':'#957951',[-length/2,y,z],[length/2,y,z],.113,.107);
    for(const side of [-1,1]){
      s.post('#c9ac7a',side*length*.5,y,z,.091,.012,.091,0,0,PI/2);
      s.post('#9e8058',side*(length*.5+.007),y+.015,z,.043,.008,.044,0,0,PI/2);
    }
    for(const x of [-.82,.73])for(const t of [-.047,.039]){
      s.stroke(reed,[[x+t,y+.016,z-.100],[x+t,y+.098,z-.071],[x+t+.016,y+.116,z],
        [x+t+.021,y+.101,z+.076],[x+t+.033,y+.064,z+.107]],[.022,.025,.025,.023,.021],8);
    }
  }
  const low=[-.39,.25,.54],high=[1.29,2.36,.18];
  const grip=t=>low.map((a,i)=>a+(high[i]-a)*t);
  rod(s,'#745e46',low,high,.044,.030);
  bather(s,'hare',{x:.35,y:.295,z:-.06,yaw:-.48,gaze:-.27,scale:.93,
    reach:[grip(.395),grip(.622)],cloth:'#6d8090'});
  const bough=[[-1.34,.31,-.02],[-1.14,.42,.05],[-.91,.48,-.10],[-.67,.41,-.11],[-.34,.53,-.23]];
  s.stroke(bark,bough,[.049,.041,.035,.021,.003],14);
  for(let j=0;j<7;j++){
    const x=-1.22+j*.128,y=.39+.053*sin(j),z=-.04-.022*j;
    const end=[x+.06*cos(j),y+.23+.07*sin(j),z+.21*cos(j*1.86)];
    s.stroke(bark,[[x,y,z],[(x+end[0])*.5,y+.12,(z+end[2])*.5],end],[.021,.012,.002],7);
    cherry(s,...end,.105+.024*(j%2),j*.73);
    cherry(s,x-.058,y+.096,z+.131,.086,j*.92+.37);
    if(j%2===0)cherry(s,x+.04,.332,.208+.082*cos(j),.092,j*2.1);
  }
}

function leafCanoe(s){
  // Both folded edges rise and close at the tied tips of one bamboo leaf.
  const hull=(u,v,inside=false)=>{
    const t=v*2-1,a=(u-.5)*2,w=sin(PI*v)**.73;
    return [1.57*t,.16+.64*(1-w)+w*(.36*a*a+.062*Math.abs(a))+(inside?.027:0),
      a*.60*w*(inside?.985:1)+.07*sin(t*PI)];
  };
  const wash=new T.Color('#7f906a'),sun=new T.Color('#bdba83');
  s.add(surface(24,42,(u,v)=>hull(u,v), (u,v)=>wash.clone().lerp(sun,.25+.19*cos(22*PI*u)+.23*Math.abs(u-.5)+.08*v)),'#fff');
  s.add(surface(20,42,(u,v)=>hull(1-u,v,true)), '#a4ad80');
  for(const side of [0,1]){
    s.add(surface(2,42,(u,v)=>{
      const a=hull(side,v),b=hull(side,v,true);
      return a.map((p,i)=>p+(b[i]-p)*u);
    }),olive);
    border(s,olive,t=>hull(side,.004+.992*t,true),.025,34);
    for(let j=1;j<=5;j++){
      const u=side===0?.5-j*.085:.5+j*.085;
      border(s,j===5?'#809171':'#bec29b',t=>hull(u,.018+.964*t,true),.007,23);
    }
  }
  for(const side of [-1,1]){
    const t=side===1?.92:.08,p=hull(.5,t,true);
    for(let i=0;i<3;i++){
      const x=p[0]+side*i*.037;
      s.stroke(reed,[[x,p[1]+.12,p[2]-.16],[x,p[1]+.15,p[2]+.002],[x,p[1]+.12,p[2]+.17]],
        [.015,.021,.015],7);
    }
  }
  const blade=[-.99,.13,.69],end=[.62,1.65,.22],grip=t=>blade.map((x,i)=>x+(end[i]-x)*t);
  rod(s,wood,grip(.12),end,.029,.039);
  s.add(surface(8,16,(u,v)=>{
    const p=grip(v*.30),across=(u-.5)*sin(PI*v)**.67;
    return [p[0]-.228*across,p[1]+.224*across,p[2]+.043*sin(PI*u)*sin(PI*v)];
  }),'#aa895e');
  border(s,'#755e49',t=>grip(.025+t*.255),.010,7);
  for(const x of [-.57,.59])slab(s,x,0,0,.40,.241,.28,x*6,'#797b69','#aba98a');
  s.box('#8f7956',.12,.358,-.003,.26,.065,.77);
  bather(s,'frog',{x:.16,y:.39,z:-.01,scale:1.02,yaw:-.84,gaze:-.30,squat:.99,
    reach:[grip(.52),grip(.69)],cloth:'#a08058'});
}

function kilnJar(s){
  // Ash pools on the fired clay. The lip rolls back into an open throat.
  const rows=[[.12,.015],[.45,.014],[.48,.075],[.415,.132],[.457,.237],[.557,.43],[.66,.7],
    [.695,.92],[.685,1.109],[.635,1.242],[.514,1.343],[.436,1.373],[.435,1.441],
    [.515,1.472],[.53,1.524],[.489,1.558],[.42,1.522],[.396,1.452],[.396,1.372],
    [.479,1.273],[.565,1.128],[.58,.83],[.481,.49],[.31,.30],[.001,.29]];
  const brown=new T.Color('#865b43'),ash=new T.Color('#b09c73'),soot=new T.Color('#49493b');
  s.add(surface(72,rows.length-1,(u,v)=>{
    const a=-tau*u,idx=Math.round(v*(rows.length-1)),[r,y]=rows[idx];
    const wobble=1+.011*sin(3*a+.5*y)+.008*cos(7*a-y);
    return [r*wobble*cos(a),y+.006*r*sin(5*a),r*wobble*sin(a)];
  },(u,v)=>{
    const a=-tau*u,i=Math.round(v*(rows.length-1)),y=rows[i][1];
    if(i>16)return soot.clone().lerp(brown,.2+.38*Math.max(0,y-.65));
    const run=.97-.14*sin(3*a)-.11*cos(5*a+.6)-.27*Math.max(0,sin(8*a-.2))**6;
    return brown.clone().lerp(ash,T.MathUtils.smoothstep(y,run,run+.18)*(.58+.19*cos(4*a)))
      .lerp(soot,.05+.11*cos(2*a+.4)**2+.09*cos(57*y));
  }),'#fff',-.18,0,0);
  for(let j=0;j<4;j++){
    const y=.49+j*.058,r=.583+j*.02;
    turning(s,j%2?'#a67650':'#714f3c',-.18,y,0,[[r-.008,0],[r+.011,.012],[r,.023]]);
  }
  bather(s,'frog',{x:-.16,y:.72,z:-.023,yaw:.48,scale:.84,nod:-.075,
    reach:[[-.46,1.51,.334],[.144,1.505,.311]],cloth:'#7f6952'});
  const lid=sculpture();
  turning(lid,'#aa8e65',0,0,0,[[.001,-.046],[.465,-.046],[.489,-.034],[.49,.032],[.47,.043],[.001,.043]],40,PI/2);
  for(const yy of [-.12,.14])lid.box('#695941',0,yy,.043,2*Math.sqrt(.48**2-yy**2),.017,.026);
  for(const xx of [-.265,.265])lid.box('#92754e',xx,0,.094,.071,.72,.09);
  s.add(lid.finish(),'#fff',.61,.47,.065,1,1,1,-.21,.20,-.26);
  for(const dx of [-.164,.164])rod(s,bark,[-1.34+dx,.019,.44],[-.65+dx,1.47,.28],.041);
  for(let j=1;j<6;j++){
    const t=j/6.4,x=-1.34+.69*t,y=.019+1.451*t,z=.44-.16*t+.025;
    rod(s,reed,[x-.189,y,z+.012],[x+.191,y,z-.012],.028);
  }
}

function sinterShelf(s){
  const ledges=[[-.26,.015,-.04,1.13,.35,.63],[-.48,.294,-.14,.91,.36,.55],
    [-.66,.57,-.22,.71,.30,.43],[-.68,.81,-.26,.57,.33,.36],[-.89,1.07,-.31,.42,.26,.30]];
  slab(s,-1.04,.026,-.27,.55,.74,.39,3.4,'#726d5c','#b3a282');
  slab(s,.36,.018,.16,.62,.25,.51,.8,'#837d68','#c1b293');
  slab(s,-1.14,.15,.09,.44,.25,.46,1.7,'#8b816b','#cfc09e');
  for(const [i,[x,y,z,w,h,d]] of ledges.entries()){
    slab(s,x,y,z,w,h,d,2+i*1.37,i%2?'#958469':'#89785f','#d8cba6');
    const at=t=>{
      const a=PI*(.025+.95*t),radius=.72+.045*cos(a*5+i);
      return [x+w*radius*cos(a),y+h*(.954+.067*sin(3*a+i)),z+d*radius*sin(a)];
    };
    border(s,'#e6d9b3',at,.031,23);
    s.ball('#96aa96',x-.07,y+h*1.020,z+.059,.57*w,.010,.48*d);
    for(let k=0;k<4;k++){
      const a=(.18+.17*k)*PI,p=at(a/PI);
      s.stroke('#d1c19b',[p,[p[0]+.03*cos(a),p[1]-.055,p[2]+.04*sin(a)],
        [p[0]+.026*cos(a),p[1]-.103-.035*cos(k),p[2]+.045*sin(a)]],[.017,.027,.014],5);
    }
  }
  const rakeLow=[-.53,.84,.51],rakeHigh=[1.17,1.29,.38],grip=t=>rakeLow.map((x,i)=>x+(rakeHigh[i]-x)*t);
  rod(s,wood,rakeLow,rakeHigh,.031);
  rod(s,bark,[-.62,.856,.21],[-.45,.83,.72],.046);
  for(let j=0;j<6;j++){
    const x=-.615+.029*j,z=.225+.092*j;
    s.stroke('#a18a64',[[x,.84,z],[x-.067,.78,z+.011],[x-.073,.68,z+.025]], [.016,.021,.012],5);
  }
  bather(s,'frog',{x:.95,y:.014,z:-.01,yaw:-.87,gaze:-.30,scale:1.11,nod:.10,
    reach:[grip(.60),grip(.77)],cloth:'#84654e'});
}

function riceWheel(s){
  const cx=-.42,cy=.87,cz=-.03,r=.81;
  for(const side of [-1,1]){
    const z=cz+side*.19;
    turning(s,bark,cx,cy,z,[[r-.078,-.054],[r,-.054],[r,.054],[r-.078,.054],[r-.078,-.054]],48,PI/2);
    for(let j=0;j<10;j++){
      const a=j*tau/10+.09;
      rod(s,j%2?wood:'#957958',[cx+.095*cos(a),cy+.095*sin(a),z],[cx+r*.985*cos(a),cy+r*.985*sin(a),z],.037,.046);
      if(side===1)dab(s,'#5d5543',cx+(r-.037)*cos(a),cy+(r-.037)*sin(a),z+.059,.029,.029,.012);
    }
  }
  for(let j=0;j<10;j++){
    const a=j*tau/10+.09;
    s.box(j%2?'#b0976a':'#a98a60',cx+r*cos(a),cy+r*sin(a),cz,.21,.064,.56,0,0,a+.24);
  }
  s.post(wood,cx,cy,cz,.139,.85,.139,PI/2);
  for(const side of [-1,1]){
    const z=cz+side*.357;
    for(const dir of [-1,1])rod(s,'#7d6851',[cx+dir*.31,.012,z],[cx+dir*.025,cy+.019,z],.068,.056);
    dab(s,reed,cx,cy,z+side*.033,.077,.077,.035);
  }
  for(const x of [.36,.82])s.box(bark,x,.51,.255,.093,1.01,.091);
  for(let j=0;j<4;j++)s.box(j%2?wood:'#ac9168',.59,.292+j*.116,.255,.41,.107,.072);
  rod(s,wood,[.59,.66,.255],[.59,1.01,.255],.030);
  rod(s,reed,[.45,1.01,.255],[.72,1.01,.255],.032);
  bather(s,'hare',{x:.99,y:.026,z:-.04,scale:.88,yaw:-.88,gaze:.22,nod:.06,squat:.27,
    reach:[[.48,1.01,.255],[.702,1.01,.254]],cloth:'#7a8270'});
  for(let j=0;j<7;j++){
    const x=-1.30+.055*(j%3),z=.23-.063*j,h=.75+.39*(.5+.5*sin(j*2.41)),bend=.17+.12*sin(j*.73);
    const head=[x-bend,h,z+.047];
    s.stroke('#958452',[[x,.036,z],[x+.006,h*.44,z],[x-.05,h*.85,z],head],[.018,.016,.013,.005],8);
    for(let k=0;k<6;k++){
      const t=k/6,px=head[0]-.098*t,py=h-.13*t;
      dab(s,rice,px,py,head[2]+.020*cos(k),.015,.038,.019,0,0,k%2?-.4:.45);
    }
  }
}

let mapleLeaf;
function maple(s,x,y,z,size,roll,pitch){
  if(!mapleLeaf){
    const f=sculpture();
    // Seven joined lobes with narrow cuts at their base and small sawteeth.
    for(let j=-3;j<=3;j++){
      const a=j*.446,len=1-.13*Math.abs(j),dir=[sin(a),cos(a)];
      const form=(u,t)=>{
        const serration=1-.18*(.5+.5*cos(t*tau*5))**3;
        const w=(u-.5)*.35*sin(PI*t)**.87*serration;
        return [dir[0]*len*t+dir[1]*w,dir[1]*len*t-dir[0]*w,.11*t*t+.09*sin(PI*t)*(1-Math.abs(2*u-1))];
      };
      f.add(surface(3,13,form),j%2?'#bc7653':'#a85e45');
      border(f,'#8b5442',t=>form(.5,t),.010,5);
    }
    rod(f,'#886649',[0,-.24,-.02],[0,.10,0],.022,.015);
    mapleLeaf=f.finish();
  }
  s.add(mapleLeaf,'#fff',x,y,z,size,size,size,pitch,.13*sin(roll),roll);
}
function mapleHart(s){
  // A reclining stag twists its neck toward the lowest leaf. Tapered antlers
  // and folded fetlocks keep its silhouette distinct at the water's edge.
  const d=sculpture(),hide='#b39671',cream='#dcc8a3';
  inkVolume(d,[[0,.42,-.75,.061,.079],[0,.44,-.58,.281,.275],[0,.435,-.31,.317,.276],
    [0,.409,.10,.267,.240],[0,.47,.31,.205,.261],[0,.64,.365,.158,.175],
    [0,.82,.384,.122,.124],[0,.928,.420,.126,.126]],hide,26);
  inkVolume(d,[[0,.927,.293,.043,.066],[0,.972,.38,.142,.144],[0,.999,.475,.164,.160],
    [0,1.015,.557,.140,.136],[0,1.071,.68,.097,.083],[0,1.11,.760,.070,.049]],hide,16);
  dab(d,ink,0,1.118,.756,.064,.041,.052);
  for(const side of [-1,1]){
    inkVolume(d,[[side*.111,1.02,.375,.049,.054],[side*.189,1.089,.324,.069,.089],
      [side*.287,1.153,.247,.048,.067],[side*.346,1.175,.203,.006,.011]],hide,12);
    d.stroke('#796c5a',[[side*.15,1.055,.36],[side*.224,1.115,.307],[side*.317,1.168,.241]], [.006,.023,.003],7);
    dab(d,ink,side*.139,1.05,.541,.028,.027,.029);
    d.stroke('#79654e',[[side*.154,1.083,.463],[side*.149,1.086,.509],[side*.123,1.07,.558]],
      [.004,.012,.004],7);
    const antler=[[side*.083,1.083,.429],[side*.129,1.23,.366],[side*.222,1.36,.234],
      [side*.258,1.48,.097],[side*.285,1.62,.046]];
    d.stroke('#77634c',antler,[.046,.041,.032,.023,.003],12);
    d.stroke('#816e56',[antler[1],[side*.157,1.322,.424],[side*.174,1.41,.47]], [.030,.022,.002],8);
    d.stroke('#816e56',[antler[3],[side*.302,1.56,.202],[side*.325,1.644,.237]], [.022,.015,.002],8);
    for(let j=0;j<9;j++){
      const z=-.52+(j%5)*.136,dy=.061*Math.floor(j/5),x=side*(.273-.032*cos(j)-.34*dy);
      dab(d,cream,x,.56+dy+.022*sin(j),z,.018,.020,.036,0,0,side*.23);
    }
    for(const fore of [true,false]){
      const z=fore?.21:-.45,x=side*(fore?.183:.23);
      inkVolume(d,[[x,.38,z,.078,.095],[x+side*.033,.245,z+.055,.067,.077],
        [x+side*.06,.117,z+.229,.054,.054],[x+side*.073,.068,z+.077,.038,.043],
        [x+side*.086,.055,z-.116,.035,.037]],hide,13);
      dab(d,'#655e4e',x+side*.084,.050,z-.137,.052,.043,.081);
    }
  }
  d.ball(cream,0,.51,-.708,.084,.123,.083,-.21);
  s.add(d.finish(),'#fff',.16,.015,.13,1.02,1.02,1.02,-.025,-.89);
  const branch=[[-1.05,.008,-.29],[-.91,.57,-.27],[-1.06,1.05,-.25],[-.95,1.45,-.19],[-.65,1.74,-.17],[-.26,1.94,-.11],[.23,1.98,-.10]];
  s.stroke(bark,branch,[.121,.10,.080,.063,.046,.023,.003],22);
  const forks=[
    [[-.99,1.40,-.19],[-1.23,1.55,-.16],[-1.37,1.72,-.14]],
    [[-.66,1.73,-.17],[-.72,1.50,.012],[-.66,1.30,.13]],
    [[-.53,1.81,-.14],[-.39,2.073,-.20],[-.23,2.21,-.22]],
    [[-.25,1.93,-.11],[-.08,1.84,.036],[.25,1.77,.07]],
    [[-.01,1.99,-.12],[.31,2.15,-.14],[.66,2.13,-.12]],
  ];
  for(const [i,twig] of forks.entries()){
    s.stroke(bark,twig,[.033,.019,.003],9);
    for(const [j,k] of [1,2].entries()){
      const [x,y,z]=twig[k];
      maple(s,x,y,z,.25+.045*j,1.07*i-2.35*j,.17*cos(i));
      maple(s,x+.052,y+.014,z-.04,.15+.035*j,1.69*i-.78,.43);
    }
  }
  maple(s,.71,.055,.26,.24,1.18,-1.3);maple(s,-.52,.057,.41,.28,.40,-1.45);
}

function crescentMoon(s){
  // A hammered bronze crescent has an open inner contour. Its three ridges
  // catch quite different lights when approached from the side of the court.
  const curve=t=>{
    const a=(-.78+1.48*t)*PI,r=1.035;
    return [-.23-r*cos(a),1.29+r*sin(a),-.16];
  };
  function arc(u,t){
    const a=(-.78+1.48*t)*PI,w=.013+.33*sin(PI*t)**1.26,q=curve(t),h=tau*u;
    return [q[0]+w*(.5+.50*cos(h))*cos(a),q[1]-w*(.5+.50*cos(h))*sin(a),q[2]+(.010+.082*sin(PI*t))*sin(h)];
  }
  const gold=new T.Color('#d7c28e'),tarnish=new T.Color('#8f8061');
  s.add(surface(22,62,arc,(u,t)=>tarnish.clone().lerp(gold,.42+.29*sin(u*tau)+.10*cos(16*PI*t))), '#fff');
  border(s,'#e0c99a',t=>arc(.28,t),.012,44);
  slab(s,-.36,.012,-.08,.86,.34,.40,2,'#747568','#a7a493');
  bather(s,'hare',{x:.226,y:.018,z:.11,yaw:-1.22,gaze:-.14,nod:-.38,scale:.87,squat:.85,
    reach:[[-.13,.934,.342],[-.175,.856,.294]],cloth:'#847889'});
  for(let j=0;j<9;j++){
    const x=.86+.056*(j%4),z=-.20+.065*(j%3),h=.72+.69*(.5+.5*cos(2.31*j)),sway=.12+.19*sin(j);
    s.stroke('#9d8d62',[[x,.014,z],[x+.014,h*.52,z+.024],[x+sway,h*.90,z],
      [x+sway+.105,h,z+.02]],[.013,.015,.011,.005],8);
    for(let k=0;k<6;k++){
      const t=k/6,px=x+sway+.102*t,py=h*(.91+.1*t),tip=[px+.076+.09*sin(PI*t),py+.068,z+.022];
      s.stroke('#ceb998',[[px,py,z],[px+.059,py+.056,z+.014],tip],[.007,.020,.003],5);
    }
  }
  // Tsukimi offerings on a low, pierced wooden sanpō.
  const x=.966,z=.359;
  for(const dx of [-.15,.15])s.box(wood,x+dx,.125,z,.045,.20,.31);
  s.box('#aa8e65',x,.23,z,.50,.054,.45);
  for(let j=0;j<3;j++)for(let k=0;k<3;k++)dab(s,bone,x-.128+.128*j,.31,z-.124+.124*k,.073,.073,.073);
  for(let j=0;j<2;j++)for(let k=0;k<2;k++)dab(s,'#e5dabe',x-.064+.128*j,.411,z-.062+.124*k,.073,.072,.073);
  dab(s,bone,x,.526,z,.072,.071,.072);
}

const carvings={sakura:petalRaft,bamboo:leafCanoe,earthen:kilnJar,sulfur:sinterShelf,
  paddy:riceWheel,shore:matsuhamaNetMender,maple:mapleHart,susuki:crescentMoon};
export function villageBathArt(s,kind){
  carvings[kind]?.(s);
}
