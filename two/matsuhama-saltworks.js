// The fishing village boils seawater on a bank above the strand. A sloping
// chain pump lifts it to the feed channel; the lower branches are gravity fed.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface,rod,dab,turning,bather } from './village-bath-figures.js';
import { villagePoolsPoint,villageCourseRim,MATSUHAMA_LIFT } from './village-bath-courses.js';
import { matsuhamaPine } from './matsuhama-pine.js';
import { scrollPigment } from './kyo-scrollwork.js';

const {PI,cos,sin}=Math,tau=2*PI;
const tar='#514c40',beam='#82694d',cedar='#a18965',grain='#c0a57b',iron='#61635a',hemp='#bba379';
const {tail:pumpTail,head:pumpHead}=MATSUHAMA_LIFT;
const delta=pumpHead.map((x,i)=>x-pumpTail[i]),slope=Math.atan2(delta[1],delta[0]),pumpLength=Math.hypot(...delta);
const pick=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
function stroke(s,tint,at,r,n=12){
  const points=Array.from({length:n+1},(_,j)=>at(j/n));
  s.stroke(tint,points,points.map(()=>r),n);
}
function timber(s,a,b,w,h,color){
  const vec=new T.Vector3(...b).sub(new T.Vector3(...a)),mag=vec.length(),centre=pick(a,b,.5);
  const yaw=Math.atan2(-vec.z,vec.x),pitch=Math.asin(vec.y/mag);
  s.box(color,...centre,mag,h,w,0,yaw,pitch);
}
function lath(s,a,b,w,h,col){timber(s,a,b,w,h,col);}
function flume(s,flow,a,b,w,h){
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  const shift=(pt,side,rise)=>[pt[0]+nx*side,pt[1]+rise,pt[2]+nz*side];
  lath(s,shift(a,0,-.069),shift(b,0,-.069),w+.08,.11,cedar);
  for(const side of [-1,1]){
    lath(s,shift(a,side*w/2,h/2-.04),shift(b,side*w/2,h/2-.04),.074,h,beam);
    lath(s,shift(a,side*w/2,h-.039),shift(b,side*w/2,h-.039),.089,.033,grain);
  }
  flow.add(surface(4,14,(u,t)=>shift(pick(a,b,t),(u-.5)*(w-.067),.01+.004*sin(16*t+.8*u))),'#b4c2a7');
}
function staveTub(s,x,bottom,z,r,h,filled=true){
  const rows=[[.76,0],[.81,.031],[.83,.089],[.93,.59],[1,.961],[.983,1],[.90,1],[.897,.94],[.74,.14],[.01,.13]];
  for(let j=0;j<22;j++)s.add(surface(3,rows.length-1,(u,v)=>{
    const a=-tau*(j+.015+.97*u)/22,[w,hp]=rows[Math.round(v*(rows.length-1))];
    return [x+w*r*cos(a),bottom+hp*h,z+w*r*sin(a)];
  }),[cedar,'#97805d','#a7916c','#ad9269','#947c59'][j%5]);
  for(const j of [.17,.66,.89]){
    const rad=r*(.812+.19*j),y=bottom+j*h;
    for(let k=0;k<3;k++)stroke(s,k===1?'#8b8669':hemp,t=>[x+(.012+rad)*cos(t*tau),y+k*.018+.009*sin(t*44*PI+k),z+(.012+rad)*sin(t*tau)],.017,54);
  }
  if(filled)dab(s,'#a4b5a4',x,bottom+.916*h,z,r*.91,.011,r*.91);
}
function vessel(s,p){
  const wetWood=new T.Color('#76664e'),light=new T.Color('#b9a17a');
  const material=t=>wetWood.clone().lerp(light,t);
  const rim=(a,side,y)=>{
    const f=villageCourseRim(p,a),l=villagePoolsPoint(p,a-.001),r=villagePoolsPoint(p,a+.001);
    const dx=r[0]-l[0],dz=r[1]-l[1],len=Math.hypot(dx,dz);
    return [f.u+side*dz/len,y,f.v-side*dx/len];};
  // Three scarph-jointed strakes are individually cut to the surveyed bath.
  // End grain, horizontal caulking seams and trenails carry across each joint.
  const n=24;
  for(let row=0;row<3;row++)for(let j=0;j<n;j++){
    const a=tau*(j+.5*(row%2))/n,span=tau/n,dark=.17+.15*(.5+.5*sin(j*1.67+row*2.6));
    const snap=(u,v,face)=>{
      const angle=a+span*(.002+u*.996)+.017*(v-.5),f=villageCourseRim(p,angle);
      const top=f.top+.012,base=p.y-.43,ratio=(row+.035+.94*v)/3;
      const y=base+(top-base)*ratio,side=face===0?-.068+.066*(1-ratio):.252+.06*ratio;
      return rim(angle,side,y);
    };
    for(const face of [0,1])s.add(surface(5,3,(u,v)=>snap(u,v,face),(u,v)=>material(dark+.18*v+.058*cos(17*u+5*row))),'#fff');
    const angle=a+.088,f=villageCourseRim(p,angle);
    if(f.gate>.72){
      const [x,y,z]=snap(.18,.53,1);dab(s,'#635d4e',x,y,z,.027,.028,.025);
    }
    if(row===2){
      s.add(surface(7,4,(u,v)=>{
        const a0=a+span*(.003+.994*u)+.014*(v-.5),r=villageCourseRim(p,a0);
        return rim(a0,-.11+.47*v,r.top+.022+.027*sin(PI*v));
      },(u,v)=>material(.74+.16*sin(j*.57)+.035*cos(19*u+.4*v))),'#fff');
      if(f.gate>.97&&j%3===0)stroke(s,'#635d4e',t=>{
        const aa=a+span*(.14+.33*t);return rim(aa,.09+.13*t,villageCourseRim(p,aa).top+.052);
      },.011,4);
    }
  }
  for(let i=0;i<22;i++){
    const a=(i+.31)*tau/22,f=villageCourseRim(p,a);
    if(f.gate<.76)continue;
    const [x,,z]=rim(a,.33,0);
    const g=sculpture();g.add(new T.DodecahedronGeometry(1,0),i%3?'#85867a':'#9b9886',0,0,0,.34,.24,.28,.19,i,.14);
    s.add(g.finish(),'#fff',x,p.y-.061,z);
    if(i%3===0){
      const [px,,pz]=rim(a,.37,0);
      s.box(tar,px,p.y+.13,pz,.13,.83,.13,0,a*.91);
      dab(s,'#b4a180',px,p.y+.545,pz,.073,.025,.075);
    }
  }
  for(const [f,h] of [[.57,-.38],[.77,-.21],[.98,-.09]]){
    const z=p.v+p.rz*f;
    for(const side of [-1,1])s.box(side<0?cedar:'#a78d67',p.u,p.y+h-.059,z+.117*side,1.64,.118,.229);
  }
}
function wovenBed(s){
  const x=2.58,z=.14;
  for(const side of [-1,1]){
    rod(s,beam,[x+side*.77,-.22,z-1.65],[x+side*.77,-.25,z+1.69],.094);
    for(const end of [-1,1])s.post(tar,x+side*.77,-.30,z+end*1.46,.069,.47,.069);
  }
  const point=(u,v)=>[x+u*1.54,-.072-.16*(1-u*u)+.077*cos(PI*v),z+1.55*v];
  for(const dir of [-1,1])for(let k=-23;k<=23;k++){
    const offset=k/12,lo=Math.max(-1,dir===1?-1-offset:offset-1),hi=Math.min(1,dir===1?1-offset:offset+1);
    if(hi-lo<.025)continue;
    s.add(surface(2,18,(u,t)=>{
      const v=lo+(hi-lo)*t,across=offset+dir*v+(u-.5)*.070;
      const [xx,y,zz]=point(across*.50,v);
      return [xx,y+dir*.013*sin(v*PI*12+k*PI),zz];
    }),dir===1?'#c6ad76':'#a58c60');
  }
  rod(s,'#b4a082',[x-.73,.026,-1.55],[x+.73,.026,-1.55],.12);
  for(const side of [-1,1])for(let n=0;n<3;n++)
    stroke(s,hemp,t=>[x+side*(.59+.034*n),.027+.121*cos(t*tau),-1.55+.121*sin(t*tau)],.019,20);
}
function grate(s,x,y,z){
  const dark=new T.Color('#574b3e'),buff=new T.Color('#aa947a');
  // Kiln-masonry voussoirs surround an actual black tunnel. Flames and
  // split ends remain visible through the flared arch from the bath.
  const r=.48;
  for(let j=0;j<13;j++){
    const a0=PI*(j+.013)/13,a1=PI*(j+.987)/13;
    const q=(u,v,zz)=>{const a=a0+(a1-a0)*u,radius=r+.223*v;return [x+radius*cos(a),y+radius*sin(a),zz];};
    s.add(surface(4,2,(u,v)=>q(u,v,z+.044),()=>dark.clone().lerp(buff,.37+.25*sin(j*3.13)**2)),'#fff');
    s.add(surface(4,2,(u,v)=>q(u,0,z+.043-.22*v)),tar);
  }
  s.add(surface(18,3,(u,v)=>[x+r*cos(PI*u)*v,y+r*sin(PI*u)*v,z-.20]),'#49413a');
  for(let j=0;j<5;j++){
    const xx=x-.32+j*.154;
    rod(s,j%2?tar:'#795e41',[xx+.05,y+.033,z-.20],[xx,y+.014,z+.38+j%2*.14],.061,.084);
    dab(s,'#bd8551',xx,y+.017,z+.38+j%2*.14,.078,.062,.021);
  }
}
function saltKiln(s,flow,pour){
  const x=-4.51,z=-4.04;
  const profile=[[1.00,-.30],[1.10,-.03],[1.09,.22],[1.04,.48],[1.05,.58],[.98,.81],[.94,1.15],[.99,1.24],[.95,1.34],[.82,1.35],[.79,1.17]];
  const basalt=new T.Color('#685d4c'),plaster=new T.Color('#b4a18a');
  function stone(a,v){
    const [r,h]=profile[Math.round(v*(profile.length-1))],sc=.014*sin(9*a+h)+1;
    return [x+1.33*r*sc*cos(a),h,z+1.09*r*sc*sin(a)];}
  for(let j=0;j<52;j++){
    const a=tau*j/52,b=tau*(j+1)/52;
    s.add(surface(2,profile.length-1,(u,v)=>{
      const angle=a+(b-a)*u,p=stone(angle,v);
      if(p[2]>z+.50&&p[1]<.81){
        const dx=Math.abs(p[0]-x),vault=.23+Math.sqrt(Math.max(0,.60**2-dx**2));
        if(dx<.61 && p[1]<vault)p[2]-=.45*(1-p[1]/vault);
      }return p;
    },(u,v)=>basalt.clone().lerp(plaster,.25+.31*v+.10*cos(j*.73+v*7))),'#fff');
  }
  for(let course=0;course<3;course++)for(let j=0;j<18;j++){
    const a=tau*(j+.47*(course%2))/18;
    if(sin(a)>.62 && course<2)continue;
    const xx=x+cos(a)*(1.43-course*.05),zz=z+sin(a)*(1.15-course*.049);
    s.add(new T.DodecahedronGeometry(1,0),j%3?'#8f8979':'#a39983',xx,.07+course*.25,zz,.265,.155,.105,.11,-a+1.57,.164*cos(j));
  }
  grate(s,x,.16,z+1.00);
  // A broad, shallow iron pan has a rolled rim, forged ears, blackened belly
  // and pale crystals gathering at the waterline beside the skimming rake.
  const pan=[[.71,.92],[.84,1.08],[.993,1.40],[1.055,1.46],[1.073,1.49],[1.055,1.52],[1.005,1.51],[.979,1.46],[.79,1.18],[.08,1.10]];
  const panGeom=new T.LatheGeometry(pan.map(([r,y])=>new T.Vector2(r,y)),72);
  s.add(panGeom,'#575b54',x,0,z,1.25,1,.93);
  dab(flow,'#bac3a8',x,1.47,z,1.234,.016,.907);
  for(const e of [-1,1])stroke(s,iron,t=>[x+e*(1.265+.18*sin(t*PI)),1.47+.065*sin(t*PI),z+.27*cos(t*PI)],.050,14);
  for(let j=0;j<50;j++){
    const a=tau*(j+.37*sin(j*1.33))/50,rad=.97-.047*(1+cos(j*2.69));
    if(sin(a)<-.17||j%4===0)dab(s,j%3?'#d5ccaf':'#ece0c4',x+1.26*rad*cos(a),1.481,z+.91*rad*sin(a),.047+.035*sin(j)**2,.021,.037);
  }
  rod(s,cedar,[x-.54,1.43,z-.28],[x+.64,2.21,z+.44],.033,.040);
  lath(s,[x-.75,1.47,z-.10],[x-.39,1.47,z-.51],.10,.074,'#9e825c');
  const stackX=x-.76,stackZ=z-.70;
  turning(s,'#817a68',stackX,1.07,stackZ,[[.29,0],[.30,.46],[.253,.49],[.21,1.12],[.245,1.16],[.245,1.26],[.172,1.26],[.16,.96]],28);
  const tubX=-2.54,tubZ=-3.58;
  for(const side of [-1,1])s.box(beam,tubX+side*.34,.35,tubZ,.139,.86,.58);
  staveTub(s,tubX,.58,tubZ,.56,.85);
  flume(s,flow,[x+.97,1.48,z+.14],[tubX-.38,1.41,tubZ-.12],.17,.12);
  flume(s,flow,[tubX+.04,1.32,tubZ+.28],[-2.15,1.15,-2.16],.276,.18);
  pour(flow,[-2.15,1.16,-2.16],[-2.15,.015,-1.31],.10,.083,.023);
  // The cooler vat gets its own low discharge, along the back of both tubs.
  flume(s,flow,[tubX+.36,1.17,tubZ],[1.53,.56,-3.02],.195,.15);
  flume(s,flow,[1.53,.56,-3.02],[1.53,.43,-2.13],.19,.14);
  pour(flow,[1.53,.44,-2.13],[1.53,-.082,-1.60],.084,.065,.017);
  for(const [u,v,h] of [[-1.48,-3.43,1.01],[-.04,-3.20,.77],[1.50,-2.94,.58],[-2.19,-2.36,1.19]])
    for(const side of [-1,1])rod(s,beam,[u+.14*side,-.10,v],[u+.14*side,h-.07,v],.044);
  // Two sliding stops are set with deliberately dissimilar lever handles.
  for(const [xx,zz,h] of [[-2.44,-3.10,1.32],[-1.91,-3.48,1.08]]){
    for(const side of [-1,1])s.box(tar,xx+side*.12,h+.09,zz,.047,.32,.073);
    s.box(cedar,xx,h+.10,zz,.20,.26,.048);
    rod(s,grain,[xx-.14,h+.35,zz],[xx+.13,h+.35,zz],.031);
  }
}
function pumpWorks(s,flow,pour){
  const a=pumpTail,b=pumpHead;
  flume(s,flow,[a[0],a[1]-.03,a[2]],[b[0],b[1]-.03,b[2]],.49,.31);
  for(const side of [-1,1]){
    const dz=side*.34;
    timber(s,[a[0],a[1]-.33,a[2]+dz],[b[0],b[1]-.33,b[2]+dz],.14,.22,beam);
    rod(s,'#79694f',[a[0],a[1]+.66,a[2]+side*.17],[b[0],b[1]+.66,b[2]+side*.17],.018);
  }
  const ground=[-4.89,-3.49,-1.94,-.56,.39,.72,.68];
  for(let j=0;j<ground.length;j++){
    const t=(j+.66)/7.28,p=pick(a,b,t),x=p[0],z=p[2],foot=ground[j]-.30;
    for(const side of [-1,1]){
      rod(s,beam,[x-.09,foot,z+side*.50],[x,p[1]+.33,z+side*.43],.069,.083);
      rod(s,tar,[x-.60,foot-.10,z+side*.47],[x,p[1]-.25,z+side*.43],.041,.047);
      for(let k=0;k<2;k++)s.post(hemp,x,p[1]-.30+k*.048,z+side*.43,.089,.036,.091);
    }
    lath(s,[x,p[1]-.41,z-.55],[x,p[1]-.41,z+.55],.14,.13,cedar);
  }
  const [x,y,z]=b;
  // Two massive upstands bear the drive shaft. The wheel is visible above
  // the collection box even from the bathing court; its tread moves in play.
  for(const side of [-1,1]){
    s.box(tar,x,.63+y*.39,z+side*.68,.20,y-.37,.228);
    s.box(cedar,x,y+.42,z+side*.68,.34,.15,.31);
    rod(s,beam,[x-1.19,.50,z+side*.71],[x,y+.10,z+side*.68],.065);
    rod(s,beam,[x+.96,.56,z+side*.64],[x,y+.10,z+side*.68],.065);
  }
  for(let j=0;j<9;j++)s.box(j%2?beam:cedar,x+.61,(y-.63),z+(j/8-.5)*1.06,1.49,.092,.124);
  for(const side of [-1,1]){
    s.box(beam,x+.61,y-.37,z+side*.564,1.57,.45,.081);
    s.box(beam,x+.61+side*.75,y-.37,z,.086,.45,1.19);
  }
  flume(s,flow,[x+1.34,y-.47,z],[-5.42,1.80,-4.28],.32,.16);
  const supports=[[-9.35,2.12],[-7.56,1.98],[-5.87,1.83]];
  for(const [i,[xx,hh]] of supports.entries())for(const sign of [-1,1]){
    const zz=-4.10-i*.062;
    s.box(beam,xx,hh*.43,zz+sign*.24,.093,hh*1.19,.104);
    timber(s,[xx-.42,hh-.88,zz+sign*.24],[xx,hh-.15,zz+sign*.24],.077,.067,tar);
  }
  pour(flow,[-5.42,1.80,-4.28],[-5.27,1.488,-4.24],.14,.11,.011);
  // Draw off a little unheated seawater before the pan. Its cool stream
  // visibly meets the hot supply in the vat which tempers the bathing water.
  flume(s,flow,[-5.89,1.86,-4.28],[-5.88,1.79,-5.42],.136,.10);
  flume(s,flow,[-5.88,1.79,-5.42],[-2.60,1.53,-4.02],.137,.10);
  pour(flow,[-2.60,1.53,-4.02],[-2.56,1.38,-3.88],.058,.038,.006);
  const intake=pumpTail;
  for(let j=-3;j<4;j++)
    rod(s,'#817258',[intake[0]-.80,-4.48,intake[2]+j*.13],[intake[0]+.23,-3.90,intake[2]+j*.13],.032);
}
function seine(s){
  const left=[-9.10,3.11,2.22],right=[-4.80,3.40,2.77];
  for(const [j,p] of [left,right].entries()){
    const [x,h,z]=p;
    rod(s,tar,[x+.11,-.20,z-.07],[x,h+.18,z],.126,.080);
    rod(s,beam,[x-.48,.02,z-.31],[x+.01,h-.46,z],.062,.049);
    const peg=[x+(j?.65:-.75),.13,z+.53];
    s.stroke(hemp,[p,[x+(j?.32:-.39),h*.53,z+.18],peg],[.023,.025,.023],7);
    rod(s,tar,[peg[0],-.06,peg[2]],[peg[0]+.04,.35,peg[2]+.05],.055,.066);
    for(let k=0;k<6;k++)s.post(k%2?hemp:'#b49973',x,h-.10+k*.029,z,.095,.026,.097);
  }
  function sheet(u,v){
    const [x,y,z]=pick(left,right,u),sag=sin(PI*u);
    return [x-.075*sin(PI*v)*sag,y-.51*sag-(1-v)*(1.73+.28*sin(PI*u*1.42))+.032*cos(9*PI*u)*(1-v),
      z+.18*sag+.20*sag*sin(PI*v)+.075*cos(tau*u*2.4)*(1-v)];
  }
  for(const edge of [0,1])stroke(s,edge?hemp:'#82765f',t=>sheet(t,edge),edge?.040:.033,34);
  for(const dir of [-1,1])for(let i=-22;i<=22;i++){
    const offset=i/17,m=.40*dir;
    const v0=(0-offset)/m,v1=(1-offset)/m,lo=Math.max(0,Math.min(v0,v1)),hi=Math.min(1,Math.max(v0,v1));
    if(hi-lo<.025)continue;
    stroke(s,i%4?'#87795e':'#a39373',t=>{const v=lo+(hi-lo)*t;return sheet(offset+m*v,v);},.012,10);
  }
  for(let i=0;i<16;i++){
    const t=(i+.36)/16,p=sheet(t,1),q=sheet(t,0);
    dab(s,i%3?'#c2a67a':'#b19768',...p,.114,.065,.060,.03,-.13);
    for(const side of [-1,1])stroke(s,'#88775a',a=>[p[0]+side*.057,p[1]+.057*cos(a*tau),p[2]+.054*sin(a*tau)],.010,9);
    rod(s,hemp,q,[q[0],q[1]-.096,q[2]],.012);
    if(i%2===0)dab(s,'#666a60',q[0],q[1]-.132,q[2],.048,.085,.043);
  }
}
function workman(s){
  // A net mender draws a shuttle through an open diamond across his knee.
  bather(s,'hare',{x:-.49,y:.09,z:-.08,yaw:.57,scale:.96,squat:.73,nod:.23,gaze:.17,
    reach:[[-.19,.71,.32],[.31,.76,.32]],cloth:'#506d69'});
  const x=.47,z=.26;
  for(const side of [-1,1])rod(s,beam,[x+side*.46,.014,z],[x+side*.46,.83,z],.042,.033);
  for(const d of [-1,1])for(let j=-7;j<15;j++){
    const c=j/7,lo=Math.max(0,d===1?-c:c-1),hi=Math.min(1,d===1?1-c:c);
    if(hi<=lo+.01)continue;
    stroke(s,hemp,t=>{const v=lo+(hi-lo)*t,u=c+d*v;return [x+(u-.5)*.92,.22+.54*v-.075*sin(PI*u),z+.055*sin(PI*u)];},.009,5);
  }
  rod(s,grain,[-.25,.68,.34],[.02,.78,.30],.025,.012);
  for(let j=0;j<4;j++)stroke(s,j%2?hemp:'#a58d66',t=>[.92+(.25-.03*j)*cos(t*tau),.031+.027*j,.05+(.15-.018*j)*sin(t*tau)],.024,21);
  for(const k of [0,1])dab(s,'#aa9169',.50+.23*k,.08,.54,.15,.083,.09,0,.23);
}
export function matsuhamaNetMender(s){workman(s);}
export function matsuhamaWorks(s,flow,pools,pour){
  for(const p of pools)vessel(s,p);
  const mat=sculpture();wovenBed(mat);s.add(mat.finish(),'#fff',0,-.10,0);
  pumpWorks(s,flow,pour);saltKiln(s,flow,pour);seine(s);
  const pine=sculpture();matsuhamaPine(pine);
  s.add(pine.finish(),'#fff',5.43,.11,.78,1.22,1.22,1.22,0,-.36);
}
function driveWheel(){
  const s=sculpture(),r=.42;
  for(const z of [-.20,.20]){
    for(let j=0;j<12;j++){
      const a=tau*j/12,b=tau*(j+1)/12;
      timber(s,[r*cos(a),r*sin(a),z],[r*cos(b),r*sin(b),z],.069,.081,cedar);
      if(j%2===0)rod(s,beam,[0,0,z],[r*cos(a),r*sin(a),z],.033,.039);
      rod(s,beam,[r*cos(a),r*sin(a),-.22],[r*cos(a),r*sin(a),.22],.027);
    }
  }
  rod(s,tar,[0,0,-.82],[0,0,.92],.093);
  s.add(new T.TorusGeometry(.73,.061,8,54),'#967f5f',0,0,.72);
  for(let k=0;k<8;k++){
    const a=tau*k/8;
    rod(s,cedar,[0,0,.72],[.72*cos(a),.72*sin(a),.72],.033,.050);
  }
  rod(s,tar,[.69,0,.70],[.69,0,.98],.040);
  return s.finish();
}
function risingHaze(group){
  const pos=[],uv=[],phase=[],ix=[];
  for(const [kind,cx,y,cz,radius,height] of [[0,-4.51,1.48,-4.04,.78,1.17],[1,-5.27,2.34,-4.74,.15,1.72],[2,-4.51,.20,-3.01,.29,.42]]){
    for(let i=0,n=kind===0?15:kind===1?9:7;i<n;i++){
      const a=i*2.399,b=Math.sqrt((i+.3)/n)*radius,start=pos.length/3,r=kind===2?.092:kind===1?.26:.265;
      for(let j=0;j<=7;j++)for(let k=0;k<3;k++){
        const t=j/7,u=k/2,h=height*(.72+.28*sin(i*2.13)),spread=(u-.5)*r*2*(kind===2?1.13-.80*t:.42+1.31*t);
        pos.push(cx+cos(a)*b+spread*cos(a+.29)-.29*t*t*(kind===1),y+h*t,
          cz+sin(a)*b+spread*sin(a+.29)+.08*sin(t*PI+i));
        uv.push(u,t);phase.push((i*.618)%1,kind);
        if(j<7&&k<2){const m=start+j*3+k;ix.push(m,m+1,m+3,m+1,m+4,m+3);}
      }
    }
  }
  const geo=new T.BufferGeometry();geo.setIndex(ix);geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('vapour',new T.Float32BufferAttribute(phase,2));
  const clock={value:0};
  const mat=new T.ShaderMaterial({uniforms:{clock},side:T.DoubleSide,transparent:true,depthWrite:false,
    vertexShader:`uniform float clock;attribute vec2 vapour;varying vec2 vPaper;varying vec2 vHeat;
      void main(){float fire=step(1.5,vapour.y),q=fract(clock*mix(.38,1.80,fire)+vapour.x);
        vec3 p=position;p.y+=q*mix(.54,.075,fire);
        p.x+=uv.y*(mix(-.16,.03,fire)*q+.095*sin(vapour.x*23.+clock*1.06+uv.y*4.));
        p.z+=uv.y*.079*cos(clock*.67+vapour.x*13.+uv.y*4.);vPaper=uv;vHeat=vec2(sin(q*3.14159),vapour.y);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying vec2 vPaper,vHeat;void main(){
      float fire=step(1.5,vHeat.y),smoke=step(.5,vHeat.y)*(1.-fire);
      vec3 col=mix(mix(vec3(.79,.81,.71),vec3(.36,.35,.31),smoke),mix(vec3(.90,.27,.05),vec3(1.,.74,.21),1.-vPaper.y),fire);
      float a=sin(vPaper.y*3.14159)*(1.-smoothstep(.05,1.,abs(vPaper.x*2.-1.)))*vHeat.x;
      gl_FragColor=vec4(col,a*mix(.41,.91,fire));
#include <colorspace_fragment>
}`});
  const mesh=new T.Mesh(geo,mat);mesh.renderOrder=6;group.add(mesh);return clock;
}
export function createMatsuhamaMachinery(parent,room){
  const group=new T.Group();group.position.set(-room.u,0,-room.v);parent.add(group);
  const material=scrollPigment(),wheel=new T.Mesh(driveWheel(),material);
  wheel.position.set(pumpHead[0],pumpHead[1]+.32,pumpHead[2]);group.add(wheel);
  const box=new T.BoxGeometry(.084,.192,.414),instance=new T.InstancedMesh(box,new T.MeshStandardMaterial({color:'#b09873',roughness:.78}),40);
  instance.frustumCulled=false;group.add(instance);
  const bottom=new T.Vector3(...pumpTail),top=new T.Vector3(...pumpHead),matrix=new T.Object3D();
  const leverGroup=new T.Group(),lever=sculpture();
  rod(lever,cedar,[0,0,0],[.06,.53,0],.034,.048);
  rod(lever,iron,[-.11,0,0],[.12,0,0],.04);
  leverGroup.add(new T.Mesh(lever.finish(),material));leverGroup.position.set(-2.42,1.47,-3.13);group.add(leverGroup);
  const clock=risingHaze(group);
  return (time,player)=>{
    clock.value=time;
    const pressure=player.activity==='bath'&&player.bathPose?.id==='shell-couch'?player.bathPose.settle:0;
    leverGroup.rotation.z=.32-.71*pressure;
    wheel.rotation.z=-time*.63;
    // A board returns on the upper strand before dipping back into the sea.
    for(let i=0;i<40;i++){
      const cycle=(time*.265/pumpLength+i/40)*.5,phase=(cycle*2)%1,returning=phase>=.5,t=returning?2*(1-phase):2*phase;
      matrix.position.lerpVectors(bottom,top,t);
      matrix.position.y+=returning?.67:.086;
      matrix.rotation.set(0,0,slope+(returning?PI:0));matrix.updateMatrix();instance.setMatrixAt(i,matrix.matrix);
    }
    instance.instanceMatrix.needsUpdate=true;
  };
}
