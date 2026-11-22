// Each unit follows the surveyed shoreline. End grain, bedding planes and cut
// ends turn in section with the rim, including the submerged entrance ramp.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface } from './village-bath-figures.js';
import { rimPoint,rimSection } from './main-bath-rims.js';

const tau=2*Math.PI,{sin,cos}=Math;
const paints={
  sakura:['#6e503a','#bb9269','#dec59b','#675341'],
  bamboo:['#526044','#a5a270','#d4c18a','#786b4e'],
  maple:['#4a4b44','#a49a85','#b6a28b','#777660'],
  susuki:['#424c50','#718080','#b0ae9b','#928b72'],
};
export const villageCoping=kind=>Object.hasOwn(paints,kind);
function station(site,a){
  const r=rimSection(site,a),l=rimPoint(site,a-.001),h=rimPoint(site,a+.001);
  const dx=h[0]-l[0],dz=h[1]-l[1],len=Math.hypot(dx,dz);
  return (w,y)=>[r.u+dz/len*w,r.top+y,r.v-dx/len*w];
}
function interval(s,c,from,to,steps,profile,tone){
  const stations=Array.from({length:steps+1},(_,i)=>from+(to-from)*i/steps);
  const section=(u,v)=>profile(stations[Math.round(u*steps)],Math.round(v*(c-1)),u);
  s.add(surface(steps,c-1,section,tone),'#fff');
  for(const last of [false,true]){
    const ring=Array.from({length:c-1},(_,j)=>section(last?1:0,j/(c-1)));
    const center=ring.reduce((p,q)=>p.map((x,k)=>x+q[k]/ring.length),[0,0,0]);
    s.add(surface(c-1,1,(u,v)=>{
      const p=ring[Math.round(u*(c-1))%ring.length];
      return v?center:p;
    }),last?'#8f806d':'#aa9476');
  }
}
function narrows(s,a,b,at,paints){
  const spans=10;
  for(let rail=0;rail<3;rail++){
    const centre=-.061+rail*.16;
    const contour=(angle,j,u)=>{
      const k=j/12*tau,r=(rail===1?.102:.097)*(1+.03*sin(u*9+rail));
      return at(angle)(centre-r*cos(k),-.085+(rail===1?.025:0)+r*sin(k));
    };
    interval(s,13,a,b,spans,contour,(u,v)=>paints[0].clone().lerp(paints[1],.50+.34*sin(v*tau)+.09*cos(v*31+rail)));
    for(const f of [.18+.04*rail,.68+.05*rail]){
      const k=a+(b-a)*f,width=.003;
      interval(s,13,k-width,k+width,2,(angle,j)=>at(angle)(centre-.106*cos(j*tau/12),-.085+(rail===1?.025:0)+.106*sin(j*tau/12)),()=>paints[2]);
    }
  }
  // Split culms are seated in a darker wattle-lined retaining side.
  const foot=[[-.14,-.055],[-.14,-.53],[.34,-.53],[.34,-.077],[-.14,-.055]];
  interval(s,foot.length,a,b,4,(angle,j)=>at(angle)(...foot[j]),()=>paints[0]);
}
function timber(s,a,b,at,col,i){
  const form=[[-.125,-.43],[-.136,-.094],[-.107,-.023],[-.076,.003],[.260,.012],[.314,-.023],[.326,-.10],[.31,-.46],[-.125,-.43]];
  interval(s,form.length,a,b,10,(ang,j,t)=>{
    const [w,h]=form[j],hewn=.012*sin(5*t+i)*sin(Math.PI*t);
    return at(ang)(w,h+hewn);
  },(u,v)=>col[0].clone().lerp(col[1],.31+.49*sin(v*Math.PI)+.085*sin(u*8+i)));
  for(const f of [.12,.89]){
    const p=at(a+(b-a)*f),peg=p(.17,.012);
    s.post('#665440',...peg,.030,.018,.030);
  }
}
function binding(s,angle,at,col){
  for(const stagger of [-.006,.006]){
    const wrap=[[-.14,-.27],[-.15,-.07],[-.10,.016],[.06,.045],[.265,.035],[.335,-.046],[.341,-.24]];
    const knots=wrap.map(([w,h],i)=>at(angle+stagger+.0017*i)(w,h));
    s.stroke(col,knots,[.014,.021,.024,.024,.023,.019,.012],10);
  }
}
function stone(s,a,b,at,col,i,course){
  const low=course===0,base=low?-.49:-.21,top=low?-.205:.01;
  const contour=[[-.14,base],[-.16,base+.07],[-.15,top-.053],[-.084,top],[.07,top+.012],[.235,top],[.326,top-.041],[.35,base+.046],[.31,base],[-.14,base]];
  const vein=.21*sin(i*53.27+course);
  interval(s,contour.length,a,b,7,(ang,j,u)=>{
    const [w,h]=contour[j],chipped=sin(Math.PI*u)*(.022*sin(9*u+3*i+j*.37)+.018*cos(4*u+.7*i));
    return at(ang)(w+chipped+.032*cos(i*3.8+j*.27),h+.024*sin(u*5+i)+.016*cos(u*10+.8*j+i));
  },(u,v)=>col[0].clone().lerp(col[1],.29+.49*sin(v*Math.PI)+vein+.079*sin(v*32+u*3+i)));
  if(!low && i%3!==1){
    const knots=Array.from({length:8},(_,j)=>at(a+(b-a)*(.14+.67*j/7))(.059+.067*sin(i+3*j/7),top+.021+.025*sin(5*j/7+i)));
    s.stroke(i%3?paints.maple[3]:'#b8b1a0',knots,[.002,.007,.009,.006,.010,.006,.005,.001],9);
  }
}
export function buildVillageCoping(site){
  const s=sculpture(),kind=site.kind,col=paints[kind].map(x=>new T.Color(x));
  const count={sakura:26,bamboo:18,maple:42,susuki:34}[kind],wood=kind==='sakura'||kind==='bamboo';
  const cache=new Map(),at=a=>{
    if(!cache.has(a))cache.set(a,station(site,a));
    return cache.get(a);
  };
  for(let row=0;row<(wood?1:2);row++){
    for(let i=0;i<count;i++){
      const edge=j=>tau*(j+row*.43+.10*sin(tau*j/count*7+.47))/count;
      const a=edge(i)+.0012,b=edge(i+1)-.0012;
      if(kind==='sakura')timber(s,a,b,at,col,i);
      else if(kind==='bamboo')narrows(s,a,b,at,col);
      else stone(s,a,b,at,col,i,row);
      if(wood && rimSection(site,b).bank>.30)binding(s,b,at,kind==='bamboo'?'#79623e':'#af986e');
    }
  }
  return s.finish();
}
