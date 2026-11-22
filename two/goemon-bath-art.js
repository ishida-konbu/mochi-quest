import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { paintedPanels } from './wayside-hut-art.js';
import { KETTLE, KETTLE_STEPS } from './wayside-hut-layout.js';

const {PI,sin,cos,sqrt}=Math,tau=2*PI;
const iron=0,earth=1,timber=2;
const profiles=[
  [.37,.35],[.56,.39],[.77,.47],[.91,.62],[1.010,.79],[1.065,.99],
  [1.07,1.075],[KETTLE.radius,1.098],[KETTLE.radius+.018,1.120],[KETTLE.radius+.012,KETTLE.lip-.009],
  [KETTLE.radius-.011,KETTLE.lip],[1.020,KETTLE.lip-.011],[1.005,1.11],[1.007,1.04],[.990,.92],
  [.954,.80],[.87,.68],[.74,.58],[.48,.49],[.03,.48],
];
let ironWash,ink;
const kettleSets=new Map();
function bathMaterials(){
  if(!ironWash){
    const map=new T.TextureLoader().load(new URL('./assets/world/goemon-crafts.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    ironWash=new T.MeshStandardMaterial({map,vertexColors:true,roughness:.83,metalness:.10,side:T.DoubleSide});
    ink=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  }
  return [ironWash,ink];
}
function vessel(s,p,seed){
  const skin=(a,r,y)=>{
    // The small departures from round are a cast edge, continuous through
    // each flank, the rolled rim, then the inside of the vessel.
    const dr=.004*sin(13*a+.3*seed)+.005*cos(7*a+.5);
    return [(r+dr)*cos(a),y+.0031*sin(9*a+seed),(r+dr)*sin(a)];
  };
  for(let j=1;j<profiles.length;j++){
    const [lo,y0]=profiles[j-1],[hi,y1]=profiles[j];
    const tint=j>=8&&j<=12?'#fdebd3':j>12?'#aab0a8':'#e0d8c7';
    s.panel(iron,tint,72,2,(u,v)=>skin(u*tau,lo+(hi-lo)*v,y0+(y1-y0)*v),
      [0,Math.min(y0,y1)*.70+.025,1,Math.max(.02,Math.abs(y1-y0)*.72)]);
  }
  for(const [r,y,w,shade] of [[1.019,.821,.017,'#625f54'],[1.046,.920,.011,'#716a5a']]){
    const ring=Array.from({length:73},(_,i)=>skin(i*tau/72,r,y));
    p.stroke(shade,ring,ring.map(()=>w),72);
  }
  // Cast lugs hold loose lift rings. The central opening remains visible
  // from either side and the brown rub at the pivot follows the iron.
  for(const side of [-1,1]){
    const x=side*1.052;
    p.ball('#6d6456',x,.97,0,.081,.076,.174,0,0,side*.04);
    for(const z of [-.107,.107]){
      p.ball('#837762',x+side*.038,.98,z,.037,.037,.042);
    }
    const ring=[[x,.998,-.106],[side*1.119,.971,-.146],[side*1.194,.883,-.125],
      [side*1.215,.847,-.010],[side*1.196,.878,.132],[side*1.124,.964,.149],[x,.998,.106]];
    p.stroke('#57584e',ring,[.030,.036,.041,.041,.039,.035,.027],20);
  }
  // Fine broken strokes catch the burned-in seam and occasional hammer blow.
  for(const [a,y] of [[.49,.85],[1.08,.99],[2.39,.91],[4.7,.94],[5.75,.82]]){
    const r=1.015+(y-.82)*.27, pts=[0,.043,.08,.126].map((d,i)=>skin(a+d,r+.004,y+.003*sin(i)));
    p.stroke('#868177',pts,[.001,.006,.005,.001],5);
  }
}
function hearth(s,p,seed){
  const section=(a,v,inner=false)=>{
    const rough=.017*sin(8*a+seed)+.013*cos(13*a),rad=(inner?.935:1.18)-.106*v+.044*sin(PI*v)+rough;
    return [-rad*cos(a),.022+.575*v,rad*sin(a)];
  };
  const mouth=.55;
  const sectors=5;
  for(let j=0;j<sectors;j++){
    // Each flank picks up a few individual masonry blocks at their own scale.
    s.panel(earth,'#e9dfcc',12,6,(u,v)=>section(mouth+(j+u)/sectors*(tau-2*mouth),v),
      [.035*(j%3),.08+.04*(j%2),.9,.82]);
  }
  // Cut an arched opening out of the stoke side. Its reveal runs into the
  // firebox so the coals and split fuel can be seen through the opening.
  const top=a=>.12+.355*sqrt(Math.max(0,1-(a/mouth)**2));
  const reveal=(a,t,inner=false)=>{
    const y=top(a)+t*(.597-top(a));return section(a,(y-.022)/.575,inner);
  };
  s.panel(earth,'#b5987b',20,3,(u,v)=>reveal((2*u-1)*mouth,v));
  s.panel(earth,'#837465',20,3,(u,v)=>{
    const a=(2*u-1)*mouth,o=reveal(a,0),i=reveal(a,0,true);
    return o.map((c,k)=>c+v*(i[k]-c));
  });
  for(const side of [-1,1]){
    const a=side*mouth;
    s.panel(earth,'#8e7c64',2,2,(u,v)=>{
      const o=section(a,v*.171),i=section(a,v*.171,true);return o.map((c,k)=>c+u*(i[k]-c));
    });
  }
  s.panel(earth,'#655e51',22,3,(u,v)=>section(mouth+u*(tau-2*mouth),v,true));
  s.panel(earth,'#c7b197',54,2,(u,v)=>{
    const a=u*tau,o=section(a,1),r=.873+.012*cos(8*a);
    return [o[0]*(1-v)-r*cos(a)*v,.597+v*.051,o[2]*(1-v)+r*sin(a)*v];
  });
  // Individual cuts of the facing stones taper around the arch keystone.
  for(let k=-4;k<=4;k++){
    const a=k*.116,o=reveal(a,0),tip=section(a*1.10,.96);
    const mid=o.map((c,j)=>(c+tip[j])*.5);
    p.stroke('#6f6252',[o,mid,tip],[.007,.010,.002],4);
  }
  for(let i=0;i<13;i++){
    const a=mouth+.18+(tau-2*mouth-.33)*i/13,v=.16+.07*cos(i*2.9+seed),q=section(a,v);
    p.ball(i%3?'#988878':'#a79a84',q[0],q[1]-.046,q[2],.128+.04*sin(i*5),.085,.12,0,-a,.12*cos(i));
  }
  // A sooted back and stone hearth continue under the pot behind the fuel.
  // From a low camera the firemouth looks into a chamber closed on three sides.
  s.panel(earth,'#534c43',16,4,(u,v)=>{
    const a=(u-.5)*PI;return [-.48+.57*cos(a),v*.52,.55*sin(a)];
  });
  s.panel(earth,'#585248',8,2,(u,v)=>[-1.20+1.30*u,.052,(2*v-1)*.54]);
  p.ball('#635b4c',-.69,.071,0,.53,.026,.48);
  for(let j=0;j<10;j++){
    const x=-.91+(j%4)*.131,z=(Math.floor(j/4)-.8)*.13+.062*sin(j*4+seed);
    p.ball(j%3?'#7e4d3c':'#aa654a',x,.115+.023*cos(2*j),z,.105,.065,.079,0,j*.63,.10);
  }
  for(let j=0;j<3;j++){
    const a=[-1.22+.061*j,.085+j*.01,-.15+j*.135],b=[-.52+j*.06,.15,.009+j*.066],m=a.map((c,k)=>(c+b[k])/2);
    p.stroke('#625649',[a,m,b],[.062,.072,.042],8);
    m[1]+=.055;b[1]+=.036;p.stroke('#9c5d42',[m,b],[.012,.006],5);
  }
}
function slats(s){
  const r=.956,count=9,gap=.010;
  for(let i=0;i<count;i++){
    const a=(i/count*2-1)*r+gap,b=((i+1)/count*2-1)*r-gap;
    s.panel(timber,i%3?'#bfb49b':'#ccbea4',5,3,(u,v)=>{
      const x=a+(b-a)*u;return [x,KETTLE.board,(2*v-1)*sqrt(Math.max(0,r*r-x*x))];
    },[.10*(i%6),0,.19,1]);
  }
}
function steps(s,p,seed){
  for(const [i,step] of KETTLE_STEPS.entries()){
    const y=step.top,z=step.z,half=.58,t=.095;
    // Two mortised ledgers support the two tread planks, with a small
    // expansion gap between their wet upper faces.
    for(const side of [-1,1]){
      p.box('#766653',side*.45,y*.48,z,.13,y*.96,.21,0,0,side*.018);
      p.box('#99836b',side*.45,y-t-.024,z,.15,.09,.51);
    }
    for(const side of [-1,1]){
      const end=z+side*.255,start=z+side*.009;
      const tint=(i+seed)%3?'#d7c4a5':'#cbbba1';
      s.panel(timber,tint,3,3,(u,v)=>[-half+v*half*2,y,start+(end-start)*u],[.14*i,0,.27,1]);
      s.panel(timber,'#b8a183',4,1,(u,v)=>[-half+u*half*2,y-t+t*v,end],[0,.19,.96,.11]);
      for(const x of [-half,half])s.panel(timber,'#c4ad8c',2,1,(u,v)=>[x,y-t+t*v,start+u*(end-start)]);
      for(const x of [-.45,.45])p.ball('#736858',x,y+.002,(end+start)*.5,.018,.006,.020);
    }
  }
}
function pail(s,p,seed){
  const x=1.48,z=.84,rad=.265;
  const at=(a,y)=>[x+(rad*.79+y*.12)*cos(a),y+.016,z+(rad*.79+y*.12)*sin(a)];
  for(let j=0;j<13;j++){
    const a=j*tau/13,top=.40+.017*sin(j*2+seed);
    s.panel(timber,j%4?'#d7c5a3':'#bbac92',2,3,(u,v)=>at(a+.468*u,v*top),[(j%4)*.175,0,.18,1]);
  }
  for(const y of [.085,.314]){
    const ring=Array.from({length:27},(_,i)=>at(i*tau/26,y));
    p.stroke('#756d5d',ring,ring.map(()=>.018),28);
  }
  s.panel(timber,'#a7987c',18,2,(u,v)=>[x+rad*.76*v*cos(tau*u),.04,z+rad*.76*v*sin(tau*u)]);
  const handle=Array.from({length:11},(_,i)=>{
    const a=i*PI/10;return [x+.238*cos(a),.352+.302*sin(a),z+.036*sin(a)];
  });
  p.stroke('#998264',handle,handle.map(()=>.023),16);
  const bowlX=1.46,bowlZ=.89; // A bamboo dipper sits in the pail.
  s.panel(timber,'#d6bf96',18,4,(u,v)=>[bowlX+(.075+.049*v)*cos(tau*u),.30+.137*v,bowlZ+(.075+.049*v)*sin(tau*u)]);
  s.panel(timber,'#b5a07f',16,2,(u,v)=>[bowlX+.118*cos(tau*u)*v,.325+.10*v*v,bowlZ+.118*sin(tau*u)*v]);
  p.stroke('#ab9472',[[1.55,.393,.89],[1.72,.455,.91],[1.92,.55,.94],[2.10,.623,.96]],[.022,.023,.023,.021],12);
}
export function buildGoemonBath(variant=0){
  const seed=Math.abs(variant|0)%3;
  if(!kettleSets.has(seed)){
    const s=paintedPanels(),p=sculpture();
    vessel(s,p,seed);hearth(s,p,seed);slats(s);steps(s,p,seed);pail(s,p,seed);
    kettleSets.set(seed,[s.finish(),p.finish()]);
  }
  const group=new T.Group(),mats=bathMaterials();group.name='五右衛門風呂';
  group.scale.set(KETTLE.widthScale,1,KETTLE.widthScale);
  for(const [i,g] of kettleSets.get(seed).entries()){
    const m=new T.Mesh(g,mats[i]);m.name=i?'羽釜の環と熾火':'鉄肌と火床';m.castShadow=m.receiveShadow=true;group.add(m);
  }
  return group;
}
