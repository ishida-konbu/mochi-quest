// At normal playing distance the working yards are the second silhouette
// after the roof: a ferry sail, bent-bamboo walk, kiln flue, mineral pans,
// rice-drying trestles, hanging seine, stream gallery and moon veranda.
import { surface,rod,dab } from './village-bath-figures.js';
import { sculpture } from './pilgrimage-pigment.js';
import { villageYard } from './village-workshop-plan.js';

const {PI,sin,cos}=Math,tau=2*PI;
const wood='#907454',peg='#645745',cord='#bba77f';
function curve(s,col,fn,rad,n=12){
  const pts=Array.from({length:n+1},(_,i)=>fn(i/n));
  s.stroke(col,pts,pts.map(()=>rad),n);
}
function deck(s,{w,d},height,n){
  for(let i=0;i<n;i++){
    let z=((i+.5)/n-.5)*d;
    s.box(i%3?'#a38b69':'#918165',0,height-.052,z,w,.102,d/n-.015);
  }
  for(const side of [-1,1]){
    s.box(peg,side*w*.36,height-.13,0,.093,.15,d);
    for(const end of [-1,0,1])s.post(peg,side*w*.36,.035,end*d*.39,.075,height+.24,.075);
  }
}
function ferry(s,a){
  const {w,d,post}=a;deck(s,a,.27,19);
  const px=-w*.41;
  for(const end of [-1,1]){
    const z=end*d*.42,top=end>0?post:post-.72;
    rod(s,wood,[px,-.21,z],[px,top,z],.093,.064);
    for(let j=0;j<3;j++)s.post(cord,px,top-.11-j*.035,z,.077,.023,.077);
  }
  const sail=(u,t)=>{
    const v=(u-.5)*d*.84,h=(post-.77)+u*.70;
    const hem=1.13+.70*u-.21*sin(PI*u);
    return [px+.05+.30*sin(PI*t)*sin(PI*u)+.041*cos(u*PI*7)*(1-t),
      hem+(h-hem)*t-.025*cos(u*PI*7)*(1-t),v];
  };
  s.add(surface(28,12,sail),'#d2bda0');
  for(let i=1;i<5;i++)curve(s,'#ac957c',t=>sail(i/5,t),.013,7);
  curve(s,'#977b66',u=>sail(u,.11),.028,23);
  curve(s,peg,u=>sail(u,1),.036,16);
  for(let j=0;j<3;j++){
    const u=.30+.21*j;
    for(let n=0;n<5;n++){
      const angle=tau*n/5;
      s.add(surface(4,7,(q,t)=>{
        const across=(q-.5)*sin(PI*t)*.042,r=.068*t;
        const p=sail(u+r*cos(angle)-across*sin(angle),.53+r*4*sin(angle)+across*4*cos(angle));
        p[0]+=.011;return p;
      }),j===1?'#ab7982':'#bc8c8f');
    }
  }
  for(const dz of [-.5,.33])rod(s,wood,[w*.24,.35,dz*d],[w*.24,1.08,dz*d],.073,.077);
}
function bamboo(s,{w,d,post}){
  const arch=(phase,t)=>{
    const angle=PI*t,flare=cos(angle);
    return [w*.5*flare*(1+.12*sin(angle)),post+.65*sin(angle),phase];
  };
  for(let j=0;j<4;j++){
    const z=d*(j/3-.5);
    for(const end of [-1,1]){
      rod(s,'#8b8a60',[end*w/2,-.25,z],[end*w/2,post,z],.051,.041);
      for(let n=0;n<5;n++)s.post('#777654',end*w/2,.24+n*.39,z,.055,.030,.055);
    }
    curve(s,'#aca579',t=>arch(z,t),.039,20);
  }
  for(let j=0;j<=8;j++){
    const t=(j+.2)/8.4;
    curve(s,j%2?'#9b976e':'#c0b78a',v=>arch(d*(v-.5),t),.024,7);
  }
  for(let j=0;j<3;j++)for(const side of [-1,1])for(let n=0;n<6;n++){
    const start=d*(j/3-.50),end=start+d/3;
    curve(s,n%2?'#95916d':'#b0a77c',t=>{
      const v=(n+t)/6,p=arch(start+(end-start)*t,side===1?v:1-v);p[1]+=.034;return p;},.012,8);
  }
}
function chimney(s,a){
  const {post,w,d}=a;
  for(let j=0;j<11;j++){
    const h=(post-.46)/11,y=.04+(j+.5)*h,sw=1-.014*j;
    s.box(j%2?'#816653':'#97785d',0,y,0,w*sw,h-.014,d*sw);
    if(j%2===0)s.box('#665343',0,y,d*.5*sw+.002,.016,h-.025,.009);
    if(y>3.2)for(const side of [-1,1])
      s.box('#705b4b',side*w*.501*sw,y,0,.015,h-.019,.014);
  }
  s.box('#907157',0,post-.38,0,w*.85,.36,d*.84);
  for(const side of [-1,1])for(const end of [-1,1])
    s.box('#765947',side*w*.29,post-.22,end*d*.29,w*.18,.29,d*.18);
  s.box('#6e6053',0,post-.037,0,w*1.05,.109,d*1.06);
}
function mineral(s,{w,d}){
  s.box(peg,0,.34,0,w,.48,d);
  const top=.64;
  for(const x of [-w*.48,0,w*.48])s.box(wood,x,top,0,.068,.22,d);
  for(const z of [-d*.48,0,d*.48])s.box(wood,0,top,z,w,.22,.058);
  for(let j=0;j<2;j++)for(const side of [-1,1]){
    const x=side*w*.24,z=(j-.5)*d*.5;
    s.add(surface(12,10,(u,v)=>[x+(u-.5)*w*.403,top-.02+.016*sin(PI*5*u)*cos(PI*6*v),z+(v-.5)*d*.45]),j?'#c1b77e':'#d4c497');
    for(let k=0;k<9;k++){
      const xx=x+.18*sin(5.3*k),zz=z+.43*cos(k*4.17);
      dab(s,k%2?'#d5c58a':'#d4caaa',xx,.658,zz,.075+.037*(k%2),.027+.018*(k%3),.049);
    }
  }
  for(const end of [-1,1]){
    for(const side of [-1,1])rod(s,peg,[side*w*.37,.11,end*d*.43],[side*.041,1.47,end*d*.43],.055);
  }
  rod(s,wood,[0,1.48,-d*.51],[0,1.48,d*.51],.040);
  const z=d*.27;
  for(const j of [-1,0,1])rod(s,wood,[.25*j-.09,.69,z+.14*j],[.25*j,1.59,z+.14*j],.024);
}
function paddy(s,{w,d,post}){
  for(const end of [-1,1])for(const side of [-1,1]){
    rod(s,wood,[side*w*.49,-.19,end*d*.44],[-side*.087,post+.07,end*d*.44],.067,.048);
    dab(s,cord,0,post-.18,end*d*.44,.094,.068,.095);
  }
  for(const top of [post-.19,1.15]){
    rod(s,'#a5895f',[0,top,-d*.50],[0,top,d*.50],.064);
    for(let i=0;i<14;i++){
      const z=(i/13-.5)*d*.83;
      const hang=.54+.10*cos(i*1.69);
      for(const side of [-1,1])for(let j=0;j<4;j++){
        const tilt=(j-1.5)*.035;
        s.stroke(j%3?'#b89a64':'#ceb378',[[.03*side,top+.047,z+tilt*.24],[.095*side,top-.09,z+tilt*.5],[.17*side,top-.31,z+tilt],[.24*side,top-hang+.06*sin(j),z+tilt*1.6]], [.020,.024,.031,.024],6);
        dab(s,'#c6aa70',.25*side,top-hang+.06*sin(j),z+tilt*1.6,.031,.068,.032,0,0,-.23*side);
      }
    }
  }
}
function shore(s,{d,post}){
  // A hung headrope folds into bights over teak pegs. Two wood netting
  // shuttles keep their tongue and real yarn wound inside the fork.
  for(const sign of [-1,1])rod(s,wood,[0,-.23,sign*d*.50],[0,post+.06,sign*d*.50],.068,.059);
  rod(s,wood,[0,post,-d*.52],[0,post,d*.52],.056,.051);
  rod(s,peg,[0,.72,-d*.42],[0,.72,d*.44],.043);
  for(let j=0;j<6;j++){
    const z=d*(j/5-.5)*.83;
    rod(s,wood,[-.02,post-.22,z],[.22,post-.14,z+.01],.032);
    for(let n=0;n<4;n++){
      const r=.13+.036*n,deep=.56+.075*n+.14*cos(j*1.71);
      const line=t=>{
        const a=t*tau;return [.124+.045*sin(a*2+j)+.018*n,post-.22-deep*(1-cos(a))/2,
          z+r*sin(a)*(1-.23*cos(a))+.02*n];};
      curve(s,n%2?'#958268':'#b39c72',line,.018,21);
      if(j%2===0&&n===2){
        const p=line(.46);dab(s,'#71766b',p[0],p[1]-.055,p[2],.037,.062,.044);
      }
    }
  }
  const z=.22;
  s.box(peg,.11,.65,z,.27,.082,1.18);
  for(let j=0;j<2;j++){
    const base=z-.34+j*.52,yy=.724;
    // Unbroken tail loop, the pointed fork and the central wooden tongue.
    for(const side of [-1,1]){
      s.stroke(j?'#b39a6e':'#9f815a',[[.08,yy,base-.24],[.08+side*.055,yy,base-.18],[.08+side*.064,yy,base+.13],[.08+side*.010,yy,base+.27]],
        [.017,.024,.018,.004],10);
    }
    rod(s,wood,[.08,yy,base-.06],[.08,yy,base+.15],.013,.006);
    for(let n=0;n<8;n++)rod(s,'#d0ba8f',[.03,yy+.018,base-.13+n*.026],[.132,yy+.017,base-.10+n*.026],.009);
  }
  for(let j=0;j<5;j++)
    curve(s,j%2?cord:'#ac9571',t=>[.04+.19*cos(t*tau),.24+j*.028,-d*.35+.32*sin(t*tau)],.023,25);
}
function maple(s,a){
  const {w,d}=a;deck(s,a,.36,13);
  const x=-w*.45;
  for(const end of [-1,0,1]){
    const z=d*.45*end;
    rod(s,'#795440',[x,-.13,z],[x,1.17,z],.072);
    dab(s,'#a38c68',x,1.21,z,.087,.069,.087);
  }
  for(const ht of [.66,.98])curve(s,'#97654a',t=>[x,ht+.13*(2*t-1)**2,(t-.5)*d],.052,13);
  for(let j=0;j<7;j++)rod(s,'#795a45',[x,.38,(j/6-.5)*d*.85],[x,.98,(j/6-.5)*d*.85],.028);
  for(const side of [-1,1])curve(s,peg,t=>[side*w*.40,-.19+.46*(1-(2*t-1)**2),(t-.5)*d],.071,13);
}
function moon(s,a){
  const {w,d,post}=a;deck(s,a,.32,20);
  for(const end of [-1,1]){
    rod(s,'#7b6c52',[-w*.43,-.20,end*d*.47],[-w*.43,post,end*d*.47],.067);
    rod(s,'#9e8768',[-w*.46,post-.13,end*d*.47],[w*.40,post-.29,end*d*.47],.041);
  }
  const screen=(u,t)=>[-w*.43+.057*sin(u*PI*13),.72+t*(post-.85)+.04*cos(PI*u*7)*(1-t),d*(u-.5)*.92];
  // Two rolled reed blinds and a central interruption frame a real view
  // through to the grassland. The bench faces away from the blind, into the bath.
  for(const side of [-1,1]){
    const x=side===1?.59:.03;
    for(let j=0;j<21;j++)curve(s,j%3?'#b4a581':'#c3ae86',v=>screen(x+v*.37,.06+j*.045),.022,6);
    for(let k=0;k<4;k++)curve(s,'#8a7b61',t=>{const p=screen(x+(k+.4)*.091,t);p[0]+=.027;return p;},.012,5);
  }
  for(const end of [-1,1])s.box('#7d6d52',-.26,.44,end*d*.28,.30,.24,.13);
  s.box('#a48d6e',-.26,.59,0,.40,.091,d*.69);
}
const settings={sakura:ferry,bamboo,earthen:chimney,sulfur:mineral,paddy,shore,maple,susuki:moon};
export function addVillageYard(s,site,plan){
  const r=plan.room,a=villageYard(site,plan),yard=sculpture();
  settings[site.kind](yard,a);
  s.add(yard.finish(),'#fff',a.x-r.u,0,a.z-r.v);
}
