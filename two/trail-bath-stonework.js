// These rocks are cut at local scale, then turned and bedded individually
// against the surveyed wet edge. Scanned erratics remain among the masonry.
import * as T from './vendor/three.module.min.js';
import { surface } from './village-bath-figures.js';
import { sculpture } from './pilgrimage-pigment.js';
import { bathFinish } from './bath-material-study.js';
const {sin,cos,PI}=Math,tau=2*PI;
// Fractional cleft depth, corner roundness, cap hue, face hue and stonework.
const strata={
  cedar:[.031,.81,'#9a9c80','#676e60','moss'],reed:[.046,.79,'#aea787','#818374','sediment'],
  slate:[.105,.57,'#9fa6a1','#606969','shale'],coast:[.034,.88,'#b8baaa','#7b8986','tideline'],
  maple:[.075,.68,'#bc9a7f','#7e675d','shale'],susuki:[.024,.94,'#aaa99b','#676e72','tideline'],
  snow:[.080,.68,'#c6cbc2','#737f80','frost'],sakai:[.045,.37,'#b4876c','#836454','brick'],
  peach:[.041,.88,'#b7a392','#877e70','moss'],tsuruga:[.092,.63,'#a1a699','#697573','shale'],
  capital:[.023,.40,'#aaa99c','#757974','dressed'],
};
function bankUnit(kind,seed){
  const [recess,round,light,dark,style]=strata[kind],s=sculpture(),base=new T.Color(dark),sun=new T.Color(light);
  const levels=[[-.36,.45],[-.16,.78],[.015,.965],[.16,1],[.29,.975],[.34,1],[.48,.923],[.52,.963],[.69,.87],[.79,.79],[.91,.64],[.97,.41],[.995,.012]];
  function ridge(a){return .038*cos(3*a+seed)+.034*cos(5*a+seed*1.7)+.017*sin(9*a+.24*seed);}
  function cut(a,k,h,r){
    const c=cos(a),d=sin(a),edge=r+ridge(a)*Math.min(1,r*1.9);
    const notch=recess*(.3+.7*sin(3*a+.7*k+seed)**2)*Math.max(0,sin(6*a-.6*k+seed))**4;
    return [Math.sign(c)*Math.abs(c)**round*(edge-notch)+.057*h,
      h+.041*r*sin(2*a+seed)+.013*cos(8*a+k)+.024*r*cos(4*a+.8*seed),
      Math.sign(d)*Math.abs(d)**round*(edge-.6*notch)-.057*h];
  }
  s.add(surface(28,levels.length-1,(u,v)=>{
    const j=Math.round(v*(levels.length-1)),[h,r]=levels[j];
    return cut(-tau*u,j,h,r);
  },(u,v)=>{
    const j=Math.round(v*(levels.length-1));
    const lamina=[4,6,8].includes(j)?-.13:.06;
    return base.clone().lerp(sun,.16+.52*v+.085*cos(tau*3*u+seed)+lamina);
  }),'#fff');
  // Inclusions follow the rock bedding, ending inside the face; short
  // drilled peck marks are confined to the dressed stones of the city.
  if(style==='shale'||style==='sediment'||style==='tideline'||style==='dressed'||style==='brick'){
    for(let j=0;j<(style==='dressed'?10:4);j++){
      const k=[4,6,8,9][j%4],[h,r]=levels[k],start=seed*.39+j*1.47,len=style==='dressed'?.12:.51+.68*cos(seed+j)**2;
      const pts=Array.from({length:11},(_,i)=>cut(start+len*i/10,k,h+.007*sin(i*.7+j),r+.004));
      s.stroke(j%2?light:dark,pts,pts.map((_,i)=>.003+.010*sin(PI*i/10)),10);
    }
  }else{
    const frost=style==='frost';
    s.add(surface(32,6,(u,v)=>{
      const a=-tau*u,lo=.58+.15*cos(3*a+seed)+.08*sin(7*a+1.2*seed);
      const h=lo+(1.025-lo)*v;
      let k=8;while(k<levels.length-1 && levels[k][0]<h)k++;
      const [h1,r1]=levels[k],[h0,r0]=levels[k-1],f=Math.min(1,Math.max(0,(h-h0)/(h1-h0)));
      return cut(a,k,h+.008,r0+(r1-r0)*f+(1-v)*.026);
    },(u,v)=>new T.Color(frost?'#b8c5c5':'#81866b').lerp(new T.Color(frost?'#f2f0df':'#a6a585'),.24+.47*v+.11*cos(u*tau*5))),'#fff');
  }
  return s.finish();
}
export function dressTrailStone(p,f,site,q){
  const name='trail-bank-'+site.kind+'-'+q.i%3;
  p.shapes[name]??=bankUnit(site.kind,site.index+.83*(q.i%3));
  f.put(name,q.u,.075,q.v,q.w,q.h,q.d,'#fff',bathFinish(site.kind==='sakai'?'clay':'slate'),q.angle);
}
const headworks={
  cedar:['trunk','#6c5a44','#b09a70'],reed:['cane','#7e805a','#b3ad78'],slate:['rock','#6b7276','#a6a799'],
  coast:['trunk','#786b57','#c2ab84'],maple:['rock','#876a5a','#b49d87'],
};
export function dressTrailInlet(p,f,s){
  const name='trail-source-'+s.kind,[type,dark,light]=headworks[s.kind];
  if(!p.shapes[name]){
    const g=sculpture();
    const r=type==='rock'?.31:type==='trunk'?.24:.174;
    // The flowing channel, exterior bark or broken rock, and both ends
    // share a sawn U-section. Water leaves precisely at its lowest point.
    const point=(u,v,inside)=>{
      const a=PI*(.035+.93*u),flute=.017*cos(9*a+.6*v+s.index);
      const w=(r+(inside?-.044:.024+flute))*(1+.073*sin(tau*v+s.index));
      return [w*cos(a),1.268-.065*v-(inside?.15:.218)*sin(a)+.016*cos(v*PI),-.78+1.61*v];
    };
    for(const inner of [false,true])g.add(surface(22,22,(u,v)=>point(inner?u:1-u,v,inner)),inner?light:dark);
    for(const end of [0,1])g.add(surface(22,2,(u,t)=>{
      const a=point(u,end,false),b=point(u,end,true);return a.map((n,k)=>n+(b[k]-n)*t);
    }),light);
    for(const u of [0,1])g.add(surface(20,1,(v,t)=>{
      const a=point(u,v,false),b=point(u,v,true);return a.map((n,k)=>n+(b[k]-n)*t);
    }),light);
    if(type!=='rock')for(const z of [.13,.48,.75]){
      const pts=Array.from({length:21},(_,i)=>point(i/20,z,false));
      g.stroke(type==='cane'?'#807d55':'#95825f',pts,pts.map(()=>.020),22);
    }
    const stone=bankUnit(s.kind,s.index*.84);
    g.add(stone,'#fff',0,.04,-.6,.65,1.00,.57);
    g.add(stone,'#fff',0,.57,-.64,.52,.61,.52,0,.52);
    p.shapes[name]=g.finish();
  }
  const u=-s.rx*.71,v=-s.rz*.51;
  f.put(name,u,0,v,1,1,1,'#fff',bathFinish(type==='cane'?'bamboo':type==='trunk'?'cedar':'slate'));
  f.put('springTrickle',u,.011,v+.83,1,1,1,'#c4d9c7',p.springFlow);
}
