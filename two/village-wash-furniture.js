import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface,rod,dab,turning } from './village-bath-figures.js';
import { villageStations } from './village-bath-courses.js';
import { rinseDipperAt } from './bath-gestures.js';

const {PI,sin,cos}=Math,tau=2*PI,cedar='#93795b',inlay='#c5b695',water='#b0c2b0';
function line(s,ink,at,r,n=20){
  const pts=Array.from({length:n+1},(_,i)=>at(i/n));
  s.stroke(ink,pts,pts.map(()=>r),n);
}
function pottery(s,x,y,z,r,h,material,filled=true){
  const profile=[[.14,0],[.46,0],[.49,.079],[.44,.13],[.53,.20],[.75,.37],[.89,.66],[1,.93],[.99,1],[.925,1],[.89,.91],[.79,.65],[.65,.42],[.45,.24],[.13,.16],[.001,.16]].map(([a,b])=>[a*r,b*h]);
  turning(s,material,x,y,z,profile,36);
  turning(s,inlay,x,y+h*.83,z,[[.947*r,0],[.953*r,h*.028],[.945*r,h*.035]],30);
  if(filled)dab(s,water,x,y+h*.84,z,r*.861,.012,r*.861);
}
function plankBasin(s,x,y,z,w,d,h,shade){
  s.box('#796b50',x,y+.028,z,w-.053,.055,d-.049);
  for(const side of [-1,1]){
    s.box(shade,x+side*(w/2-.036),y+h/2,z,.072,h,d);
    s.box(shade,x,y+h/2,z+side*(d/2-.031),w,h,.062);
    s.box('#bb9e75',x,y+h,z+side*(d/2-.031),w+.039,.031,.076);
  }
  s.box(water,x,y+h-.049,z,w-.13,.014,d-.11);
  for(const side of [-1,1])for(const end of [-1,1])dab(s,'#6f6957',x+side*(w/2-.10),y+h*.67,z+end*d/2,.021,.021,.010);
}
function benchBase(s,r,k){
  const material=k==='maple'?'#8e7661':k==='earthen'?'#706254':cedar;
  const span=r.w*.57;
  for(const side of [-1,1]){
    s.box(material,side*span*.41,.33,-.15,.126,.30,.36);
    s.box('#716452',side*span*.41,.20,-.15,.23,.071,.42);
  }
  s.box('#715c47',0,.43,-.15,span+.025,.102,.36);
  for(let j=0;j<3;j++)s.box(j%2?material:'#b29875',0,.508,-.36+j*.155,span,.082,.142);
}
function stool(s){
  s.box('#a68b69',0,.365,.67,.64,.087,.46);
  for(const side of [-1,1])s.box('#8f785b',side*.215,.256,.67,.091,.211,.35,0,0,side*.085);
}
export function addVillageWash(s,r,k){
  const z=-.22;benchBase(s,r,k);
  if(['earthen','sakura','shore'].includes(k))stool(s);
  if(k==='earthen'){
    pottery(s,-.47,.56,z,.36,.41,'#966447');pottery(s,.41,.56,z,.29,.33,'#81917e');
    pottery(s,.90,.55,z-.061,.18,.24,'#8b7f65');
  }else if(k==='sakura'){
    plankBasin(s,-.18,.56,z,1.52,.55,.29,'#a08361');
    for(let i=0;i<8;i++){
      const x=-.85+i*.115;
      s.stroke('#b39a74',[[x,.83,z-.18],[x+.03,.85,z],[x+.033,.82,z+.18]],[.012,.016,.012],6);
      if(i%2===0)for(let j=0;j<5;j++){
        const a=j*tau/5;dab(s,'#ddaba8',x+.045*cos(a),.86,z+.047*sin(a),.042,.013,.036,0,a);
      }
    }
  }else if(k==='bamboo'){
    // Split culms have an open upper half. One end keeps the natural septum.
    for(let j=0;j<2;j++){
      const w=.17+.04*j,zz=z-.13+.29*j,yr=.73-.035*j;
      s.add(surface(26,20,(u,v)=>{
        const a=PI+u*PI;return [(v-.5)*1.94,yr+w*sin(a)-.05*v,zz+w*cos(a)];
      }),j?'#9d9666':'#9eaa76');
      s.box(water,0,yr-.079,zz,1.83,.015,.22);
      for(const x of [-.72,.55])s.box('#807454',x,.61,zz,.091,.17,.35);
    }
  }else if(k==='sulfur'){
    plankBasin(s,-.30,.55,z,1.62,.46,.21,'#a19872');
    const radius=.23;
    for(let j=0;j<8;j++){
      const a=j*tau/8;dab(s,j%2?'#cdc49b':'#b4a477',-.73+radius*cos(a),.73,z+.11*sin(a),.085,.058,.079);
    }
    for(let n=0;n<2;n++){
      const x=.77+.19*n;pottery(s,x,.56,z,.10,.15,'#a4986f');
      rod(s,'#b59f70',[x,.69,z],[x+.13,.90,z-.11],.016);
    }
  }else if(k==='paddy'){
    plankBasin(s,-.12,.55,z,1.99,.48,.18,'#9e8860');
    for(let j=0;j<7;j++)s.box(j%2?'#97886a':'#ab9a79',-.87+j*.14,.71,z,.086,.061,.38);
    pottery(s,.91,.56,z,.16,.18,'#907e61');
  }else if(k==='shore'){
    // The freshwater cooper keeps two straight-grained cedar pails, a plugged
    // tap, spare folded towels and a smaller ladle on the draining board.
    for(const [x,r,h] of [[-.30,.35,.35],[.59,.25,.29]]){
      const base=.56;
      const profile=[[.76,0],[.79,.04],[1,.96],[.98,1],[.89,1],[.88,.94],[.70,.12],[.01,.12]];
      for(let j=0;j<16;j++)s.add(surface(3,profile.length-1,(u,v)=>{
        const a=-tau*(j+.02+u*.96)/16,[rr,hp]=profile[Math.round(v*(profile.length-1))];
        return [x+rr*r*cos(a),base+h*hp,z+rr*r*sin(a)];
      }),j%3?'#b19a74':'#927b5b');
      for(const y of [.17,.72])line(s,'#7b7965',t=>[x+(r*(.79+.23*y)+.01)*cos(t*tau),base+h*y,z+(r*(.79+.23*y)+.01)*sin(t*tau)],.013,28);
      dab(s,water,x,base+h*.87,z,r*.875,.009,r*.875);
    }
    // A lidded freshwater churn hangs above the rinse counter. A turned
    // stopcock and a short spout fill the nearer pail without a brine line.
    turning(s,'#9f8864',-.78,.57,z-.26,[[.24,0],[.28,.04],[.30,.61],[.29,.65],[.01,.65]],26);
    for(const y of [.68,1.08])turning(s,'#776f57',-.78,y,z-.26,[[.3,0],[.3,.028]],24);
    s.box('#b59a72',-.78,1.24,z-.26,.59,.044,.53);
    rod(s,'#807963',[-.60,1.07,z-.23],[-.39,1.05,z-.08],.034);
    rod(s,'#6a705e',[-.53,1.06,z-.17],[-.51,1.14,z-.17],.025);
    rod(s,'#ae926a',[-.57,1.143,z-.17],[-.45,1.143,z-.17],.018);
    s.stroke('#bfcdb6',[[-.39,1.05,z-.08],[-.37,.993,z-.068],[-.37,.87,z-.067]],[.012,.011,.009],6);
    for(let j=0;j<3;j++)s.box(j===1?'#6a847d':'#cec9aa',.97,.584+j*.041,z,.34,.04,.31);
  }else if(k==='maple'){
    // A carved tsukubai scooped from a broad split stone, with a chisel-cut return.
    const rim=(a)=>.53*(1+.09*sin(3*a)+.055*cos(5*a));
    const rows=[[.71,0],[.97,.079],[1,.23],[.91,.27],[.66,.28],[.56,.24],[.43,.14],[.01,.13]];
    s.add(surface(44,rows.length-1,(u,v)=>{
      const a=tau*u,[rr,h]=rows[Math.round(v*(rows.length-1))];return [-.23+rim(a)*rr*cos(a),.55+h,z+.63*rim(a)*rr*sin(a)];}),'#909789');
    dab(s,water,-.23,.782,z,.294,.011,.186);
    rod(s,'#a5926d',[.32,.62,z+.09],[.99,.66,z-.12],.025);
    pottery(s,1.01,.55,z-.13,.14,.13,'#b7a17f');
  }else{
    // Linen from the low copper warmer is placed on a slatted draining board.
    pottery(s,-.51,.55,z,.33,.28,'#868674');
    turning(s,'#96896c',-.51,.81,z,[[.28,0],[.33,.015],[.32,.047],[.19,.095],[.04,.105],[.001,.105]],30);
    rod(s,'#726949',[-.58,.91,z],[-.44,.91,z],.029);
    for(let i=0;i<5;i++)s.box('#a79271',.38+.11*i,.59,z,.079,.062,.40);
    for(let i=0;i<3;i++)s.box(i%2?'#b3bdad':'#dfdbc0',.55,.635+i*.037,z-.008*i,.43-.025*i,.037,.26,.008*i,0,.007*i);
  }
}
function rinseImplement(k){
  const s=sculpture();
  if(k==='shore'){
    turning(s,'#bb9b6c',0,0,0,[[.001,0],[.105,.005],[.132,.04],[.148,.16],[.145,.171],[.123,.172],[.118,.048],[.09,.029],[.001,.029]],28);
    turning(s,'#777565',0,.116,0,[[.142,0],[.144,.014]],27);
    rod(s,'#9a7f56',[0,.12,.115],[.008,.17,.52],.027,.039);
  }else if(k==='earthen'){
    pottery(s,0,0,0,.195,.12,'#ac8165',false);
    for(const side of [-1,1])line(s,'#9c7655',t=>[side*(.17+.075*sin(PI*t)),.056+.04*cos(PI*t),.075*cos(PI*t)],.016,10);
  }else{
    turning(s,'#bb9972',0,0,0,[[.001,0],[.11,.018],[.147,.096],[.145,.135],[.128,.14],[.115,.093],[.092,.035],[.001,.030]],35);
    rod(s,'#8b7255',[0,.091,.111],[.012,.152,.54],.026,.033);
    for(let j=0;j<5;j++)dab(s,'#be8c88',.137*cos(j*tau/5),.086,.137*sin(j*tau/5),.029,.019,.021);
  }
  return s.finish();
}
export function createVillageRinse(parent,site,r){
  const station=villageStations(site)?.find(q=>q.action==='rinse');
  if(!station)return;
  const mat=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.66,vertexColors:true});
  const head=new T.Mesh(rinseImplement(site.kind),mat);
  head.castShadow=head.receiveShadow=true;parent.add(head);
  const fluid=new T.MeshBasicMaterial({color:'#cfdfcd',transparent:true,opacity:.73,side:T.DoubleSide,depthWrite:false});
  const fillSize=site.kind==='earthen'?.160:site.kind==='shore'?.116:.12;
  const filling=new T.Mesh(new T.CircleGeometry(fillSize,24),fluid);
  filling.rotation.x=-PI/2;
  filling.position.y=site.kind==='shore'?.15:site.kind==='earthen'?.105:.111;
  head.add(filling);
  const stream=new T.Mesh(surface(12,12,(u,t)=>{
    const a=tau*u,width=.029-.013*t;return [width*cos(a)+.05*t,-.41*t*t-.15*t,width*sin(a)+.075*t];
  }),fluid);
  parent.add(stream);stream.visible=false;
  const offset=new T.Vector3(),hand=station.berthV-r.v+1.92;
  return player=>{
    const pose=player.activity==='bath'?player.bathPose:null;
    const t=pose?.id===station.id?station.duration-player.activityTime:0;
    const q=rinseDipperAt(t,!!player.buffs?.full);
    head.position.set(station.berthU-r.u+q.u,q.y-.09,hand+q.v);
    head.rotation.set(q.pitch,-.51,q.roll,'YXZ');
    filling.visible=q.wet>.035;
    filling.scale.set(q.wet,q.wet,1);
    stream.visible=q.pour>.028;
    if(!stream.visible)return;
    offset.set(.07,.11,.067).applyQuaternion(head.quaternion).add(head.position);
    stream.position.copy(offset);stream.scale.set(q.pour,q.pour,q.pour);
  };
}
