// Furniture is made in the metre frame of the workshop. The trades use the
// same materials as the building: split culms, fired earth, salt or rice straw.
import * as T from './vendor/three.module.min.js';
import { surface, turning, rod, dab } from './village-bath-figures.js';

const {sin,cos,PI}=Math,tau=2*PI;
const rope='#b99c70', timber='#8b6d50', dark='#584d3e', straw='#bd9b5e';
function ribbon(s,tone,points,widths){
  s.stroke(tone,points,widths,Math.max(7,points.length*2));
}
function edge(s,color,fn,r,n=16){
  const points=Array.from({length:n+1},(_,i)=>fn(i/n));
  s.stroke(color,points,points.map(()=>r),n);
}
function oar(s,x,y,z,lean,length){
  const point=t=>[x+lean*t,y+t*length,z-.035*t];
  rod(s,timber,point(.06),point(1),.031,.043);
  s.add(surface(6,18,(u,t)=>{
    const p=point(t*.42);const a=(u-.5)*.29*Math.pow(sin(PI*(.06+.94*t)),.68);
    return [p[0]+a,p[1]-a*lean/length,p[2]+.033*(1-(2*u-1)**2)*sin(PI*t)];
  }),'#b1956a');
}
function cherryPanel(s,x,y,z,size){
  for(let j=0;j<5;j++){
    const a=tau*j/5;
    s.add(surface(4,7,(u,v)=>{
      const w=(u-.5)*size*(sin(PI*v*.83)**.74);
      const l=size*v*(1-.16*sin(PI*u)**9*v**4);
      return [x+l*cos(a)-w*sin(a),y+l*sin(a)+w*cos(a),z+.025*sin(PI*v)];
    }),j%2?'#d5ada3':'#eed4bf');
  }
  dab(s,'#b58f53',x,y,z+.018,.14*size,.14*size,.04);
}
function ferry(s,r){
  const back=-r.d/2+.12;
  for(let i=0;i<4;i++)oar(s,-r.w*.44+i*.22,.23,back+.07+i*.035,.30+.095*i,1.65+.11*i);
  // A hollow, clinker-built ferry half model keeps both pointed ends and
  // the line of every lapstrake. The cross-thwarts sit just below its rim.
  const prow=(u,v,inside=false)=>{
    const t=v*2-1,w=(sin(PI*v)**.68);
    return [.60+1.55*t,.43+.40*t*t+.36*Math.abs(2*u-1)**1.55+(inside?.025:0),
      back+.52+(u-.5)*.73*w*(inside?.92:1)+.045*sin(PI*v)];
  };
  for(let j=0;j<6;j++)s.add(surface(3,36,(u,v)=>prow((j+u)/6,v)),j%2?'#927452':'#a28963');
  s.add(surface(12,34,(u,v)=>prow(u,v,true)),'#bd9e6f');
  for(const side of [0,1])edge(s,dark,t=>prow(side,t),.025,32);
  for(const t of [.24,.46,.68,.84]){
    const a=prow(0,t),b=prow(1,t);
    s.box(timber,a[0],a[1]-.035,(a[2]+b[2])*.5,.16,.06,b[2]-a[2]);
  }
  for(const x of [-.48,1.63]){
    for(const side of [-1,1])rod(s,dark,[x,.20,back+.42+side*.28],[x,.59,back+.42-side*.11],.046);
  }
  // Petal-shaped, pierced cusps below the two ferry-house eaves.
  for(const side of [-1,1]){
    const x=side*r.w/2,z=r.d/2+.019,y=r.eave-.25;
    ribbon(s,timber,[[x-.04*side,y-.47,z],[x-.21*side,y-.27,z],[x-.46*side,y-.25,z],[x-.66*side,y,z]],[.067,.103,.066,.042]);
    for(let i=0;i<3;i++)cherryPanel(s,x-side*(.18+i*.16),y-.21+.09*i,z+.045,.111-i*.015);
  }
}
function bamboo(s,r){
  const back=-r.d/2+.16;
  // A hand-bent basket has a proper open rim, spokes returning beneath
  // its belly, and alternately over/under thin cane bands.
  function basket(cx,cy,cz,sz){
    const radial=t=>(.13+.15*t+.054*sin(PI*t))*sz;
    for(let i=0;i<14;i++){
      const a=tau*i/14;
      edge(s,i%2?'#ac9464':'#ccb380',t=>[cx+radial(t)*cos(a),cy+t*.38*sz,cz+radial(t)*sin(a)],.014*sz,5);
    }
    for(let i=0;i<=7;i++){
      const t=i/7;
      edge(s,i===7?'#7f7250':'#af976c',v=>{
        const a=tau*v,l=radial(t)+.011*sz*cos(7*a+PI*i);
        return [cx+l*cos(a),cy+.38*t*sz,cz+l*sin(a)];
      },(i===7?.025:.014)*sz,30);
    }
    edge(s,timber,t=>[cx+.28*sz*cos(t*PI),cy+.38*sz+.32*sz*sin(t*PI),cz+.018*sin(t*PI)],.020*sz,16);
  }
  for(const [x,y,z,k] of [[-1.72,.20,back+.37,1.18],[-1.18,.20,back+.68,.80],[1.92,.20,back+.4,1.08]])basket(x,y,z,k);
  const z=back+.11;
  for(let i=0;i<7;i++){
    const x=-1.64+.16*i,dx=.40+.08*sin(i),h=1.28+.35*cos(i*.69);
    rod(s,i%2?'#959269':'#bab283',[x,.21,z+.085],[x+dx,h,z],.042+.008*(i%2),.031);
    for(let j=1;j<=3;j++)dab(s,'#756f4e',x+dx*j/4,.21+(h-.21)*j/4,z+.085*(1-j/4),.044,.016,.045);
  }
  const side=r.w/2,zf=r.d/2;
  for(const sg of [-1,1]){
    // A tightly-wound wisteria lashing secures the split-bamboo spandrel.
    for(let j=0;j<4;j++)edge(s,rope,t=>[sg*side+.139*cos(t*tau),r.eave-.35+j*.032+.014*t,zf+.136*sin(t*tau)],.018,14);
  }
}
function jar(s,x,y,z,rad,h,ash){
  const rings=[[.04,0],[.46,0],[.56,.08],[.76,.17],[.97,.39],[1,.61],[.86,.79],[.63,.87],[.58,.93],[.69,.94],[.70,.99],[.64,1],[.55,.98],[.54,.91],[.69,.84],[.81,.71],[.86,.47],[.68,.21],[.21,.14],[.002,.14]];
  const clay=new T.Color('#985f42'),glaze=new T.Color(ash);
  s.add(surface(30,rings.length-1,(u,v)=>{
    const a=-tau*u,[rr,hh]=rings[Math.round(v*(rings.length-1))];
    const rr2=rr*rad*(1+.012*sin(3*a+hh));
    return [x+rr2*cos(a),y+hh*h,z+rr2*sin(a)];
  },(u,v)=>{
    const i=Math.round(v*(rings.length-1)),t=rings[i][1],run=.61+.13*sin(tau*3*u)+.09*cos(tau*5*u)-.19*Math.max(0,cos(tau*7*u))**5;
    return clay.clone().lerp(glaze,T.MathUtils.smoothstep(t,run,run+.09)*(.75+.18*cos(30*u))).multiplyScalar(i>12?.57:.98);
  }),'#fff');
}
function kiln(s,r){
  const z=-r.d/2+.37,x=-r.w/2+.92;
  // The kiln mouth is a genuine opening. Each wedge brick has its own
  // radial faces and deeper return, with a stepped crown of fire-clay.
  for(let j=0;j<11;j++){
    const a=PI*j/11+.009,b=PI*(j+1)/11-.009;
    const shape=new T.Shape();shape.moveTo(.39*cos(a),.39*sin(a));
    shape.lineTo(.68*cos(a),.68*sin(a));shape.absarc(0,0,.68,a,b,false);
    shape.lineTo(.39*cos(b),.39*sin(b));shape.absarc(0,0,.39,b,a,true);
    shape.closePath();
    s.add(new T.ExtrudeGeometry(shape,{depth:.64,bevelEnabled:false,curveSegments:3}),['#935f45','#a37153','#866149'][j%3],x,.48,z-.13);
  }
  for(const side of [-1,1])s.box('#8e6b54',x+side*.535,.34,z+.17,.29,.30,.65);
  s.box('#4b4338',x,.50,z-.12,1.01,.63,.08);
  for(let j=0;j<6;j++){
    const a=j*.64;
    rod(s,'#645040',[x-.26+.045*j,.27,z+.36],[x-.26+.045*j+.23*cos(a),.30+.13*sin(a),z+.56],.056,.047);
  }
  for(const [i,[px,pz,k]] of [[1.41,z+.18,.31],[2.00,z+.13,.38],[2.61,z+.10,.28],[1.77,z+.69,.25],[2.45,z+.70,.22]].entries())
    jar(s,px,.185,pz,k,k*(2.31+.23*(i%2)),i%2?'#a89a74':'#8d9a84');
}
function mineral(s,r){
  const z=-r.d/2+.40;
  // Yunohana grows in long beds under the ventilated shed. A removable
  // screen, the fluted scoops and a wooden rake rest at the drying end.
  const bed=(x,w)=>{
    s.box('#83725e',x,.38,z,w,.27,.67);
    s.box('#c9b896',x,.525,z,w-.09,.05,.55);
    for(let j=0;j<8;j++){
      const a=(j+.5)/8;
      ribbon(s,j%2?'#dfc694':'#bbaa7c',[[x-w*.45+a*w*.87,.555,z-.25],[x-w*.43+a*w*.87,.59+.025*sin(j),z],[x-w*.44+a*w*.87,.557,z+.25]],[.015,.032,.013],5);
    }
    for(const side of [-1,1])s.box(timber,x,.53,z+side*.326,w+.05,.13,.046);
  };
  bed(-1.31,1.6);bed(.57,1.8);
  const x=r.w*.39;
  for(const dx of [-.18,.12]){
    rod(s,timber,[x+dx,.23,z+.18],[x+dx-.35,2.06,z-.12],.031);
    rod(s,dark,[x+dx-.51,1.99,z-.12],[x+dx-.17,2.05,z-.12],.041);
    for(let j=0;j<5;j++)rod(s,'#a08b61',[x+dx-.51+.078*j,1.99+.016*j,z-.12],[x+dx-.52+.078*j,2.13+.014*j,z-.05],.014);
  }
}
function sheaf(s,x,y,z,k){
  const base='#a08b5e';
  for(let j=0;j<7;j++){
    const t=j/6,dx=(t-.5)*.32*k,da=.024*sin(j*2);
    ribbon(s,j%2?straw:base,[[x+.26*dx,y+.08*k,z+da],[x+dx*.45,y-.1*k,z+da],[x+dx,y-.38*k,z+.027],[x+1.65*dx,y-.56*k+.028*cos(j),z+.09]],[.014*k,.019*k,.022*k,.034*k],7);
    for(let n=0;n<3;n++)dab(s,j%2?'#cfb77c':'#b0915f',x+dx*(1.08+n*.22),y-(.39+n*.061)*k,z+.052+n*.019,.020*k,.049*k,.023*k,0,0,-dx*.8);
  }
  rod(s,'#7d704e',[x-.07*k,y-.13*k,z+.041],[x+.07*k,y-.14*k,z+.041],.022*k);
}
function granary(s,r){
  const front=r.d/2,back=-front+.26;
  rod(s,'#796b4e',[-r.w*.46,r.eave-.47,front-.20],[r.w*.46,r.eave-.47,front-.20],.045);
  for(const sign of [-1,1])for(let j=0;j<4;j++)sheaf(s,sign*(r.w/2-.23-j*.21),r.eave-.46,front-.20,1+.12*cos(j*2));
  const x=1.33;
  for(const end of [-1,1])for(const side of [-1,1])rod(s,dark,[x+side*.46,.18,back+.26+end*.28],[x+side*.38,.69,back+.26+end*.14],.056);
  s.box('#a5855c',x,.65,back+.26,.92,.13,.29);
  for(let j=0;j<19;j++)rod(s,'#606159',[x-.38+j*.041,.71,back+.21],[x-.38+j*.041,.976+.018*cos(j),back+.16],.014,.005);
  for(const px of [-1.74,-1.15]){
    const rr=.25;
    s.add(surface(16,12,(u,v)=>{
      const a=u*tau,radius=rr*(.15+.85*sin(PI*v)**.28);
      return [px+radius*cos(a),.48+radius*sin(a),back+.54+.61*(v-.5)];
    }),'#b89e6a');
    for(const off of [-.18,0,.18])edge(s,'#89744f',t=>[px+.252*cos(t*tau),.48+.252*sin(t*tau),back+.54+off],.020,19);
  }
}
function fishing(s,r){
  const bx=-r.w*.45,bz=-r.d/2+.165;
  const net=(u,v)=>[bx+2.05*u,.66+1.3*v-.28*sin(PI*u)*(.4+.6*v),bz+.126*sin(PI*u)+.10*cos(2*PI*u)*(1-v)];
  // Knots in a diamond seine descend to a weighted footrope. Both cork
  // floats and stone sinkers follow the actual sag of the top/bottom lines.
  for(const dir of [-1,1])for(let i=-9;i<=18;i++){
    const c=i/9,lo=Math.max(0,dir===1?-c:c-1),hi=Math.min(1,dir===1?1-c:c);
    if(hi<=lo+.01)continue;
    edge(s,i%3?'#8c8269':'#b0a084',t=>{const v=lo+(hi-lo)*t;return net(c+dir*v,v);},.012,9);
  }
  for(const v of [0,1])edge(s,timber,t=>net(t,v),.027,20);
  for(let i=0;i<8;i++)for(const v of [0,1]){
    const p=net((i+.4)/8,v);
    dab(s,v?'#be9c70':'#797c71',...p,v?.071:.05,v?.045:.069,.041);
  }
  const px=1.34,z=bz+.47;
  // A salt measure, its wicker carrier and an open straw salt bale occupy
  // the selling counter. Its pale crystals catch light below the painted board.
  const rows=[[.29,0],[.39,.09],[.43,.26],[.39,.47],[.33,.53],[.25,.52],[.22,.43]];
  const carrier=(a,t)=>{
    const f=t*(rows.length-1),j=Math.min(rows.length-2,Math.floor(f)),k=f-j;
    const rr=rows[j][0]+(rows[j+1][0]-rows[j][0])*k,hh=rows[j][1]+(rows[j+1][1]-rows[j][1])*k;
    return [px+rr*cos(a),.19+hh,z+.83*rr*sin(a)];
  };
  for(let j=0;j<42;j++)edge(s,j%4?'#ab9470':'#8d7859',t=>carrier(tau*j/42,t),.021,10);
  for(const t of [.22,.59,.90])edge(s,timber,u=>carrier(u*tau,t),.024,30);
  dab(s,'#d6cfb3',px,.66,z,.275,.105,.21);
  for(let j=0;j<18;j++){
    const a=j*2.399,r=.21*Math.sqrt((j+.2)/18);
    dab(s,j%3?'#e5dbc3':'#cbbd9e',px+r*cos(a),.728+.043*cos(r*6.18),z+.81*r*sin(a),.034,.023,.038);
  }
  const mx=px-.68;
  s.box('#a58c65',mx,.36,z,.48,.055,.42);
  for(const side of [-1,1]){
    s.box('#ab9370',mx+side*.22,.47,z,.047,.21,.42);
    s.box('#b79d72',mx,.47,z+side*.19,.48,.21,.043);
  }
  s.box(timber,px-.31,.97,bz+.02,1.49,.091,.21);
  for(const dx of [-.66,-.32,0])oar(s,px+dx,.20,bz+.04,.39+.10*dx,1.97+.11*dx);
}
function maple(s,r){
  const front=r.d/2,axis='#784f39',bark='#765c42';
  // This is a bridge carpenter's gallery: dowelled rails curl back at the
  // end of each bay and an arched brace returns its load to the cornerpost.
  for(const side of [-1,1]){
    const x=side*r.w/2;
    for(const z of [-front,front])for(const dy of [0,.27]){
      ribbon(s,dy?axis:bark,[[x,r.eave-.78+dy,z],[x-.28*side,r.eave-.60+dy,z],[x-.53*side,r.eave-.41+dy,z],[x-.85*side,r.eave-.28+dy,z]],[.098,.098,.065,.038]);
    }
    const z=front+.02;
    ribbon(s,axis,[[x,.80,z],[x-side*.29,.81,z],[x-side*.73,.82,z],[x-side*.95,.91,z]], [.059,.066,.066,.036],10);
    for(let j=0;j<4;j++)rod(s,bark,[x-side*(.12+j*.23),.22,z],[x-side*(.12+j*.23),.82,z],.037);
  }
  const z=-front+.30;
  for(let j=0;j<4;j++){
    const x=.85+j*.23;
    s.box(j%2?'#a88665':'#8a7159',x,.62+.11*j,z,.15,.89+.23*j,.07,0,0,.07*j);
  }
  const p=-1.39;
  for(let i=0;i<2;i++){
    const x=p+.37*i;
    rod(s,timber,[x,.20,z+.24],[x+.28,1.59+.16*i,z],.038);
    s.add(surface(6,8,(u,v)=>[x+.20+.21*v+.12*sin(PI*v)*(u-.5),1.37+.45*v,z-.045+.013*sin(PI*u)]),'#697269');
  }
}
function moon(s,r){
  const z=-r.d/2+.44,x=-1.66;
  const trayX=x+.12,top=.54;
  s.box(timber,trayX,top-.055,z,.91,.108,.55);
  for(const side of [-1,1])s.box(dark,trayX+side*.31,.36,z,.12,.30,.39);
  turning(s,'#817b66',trayX+.10,top,z,[[.07,0],[.12,.035],[.11,.07],[.197,.22],[.193,.25],[.151,.245],[.16,.216],[.095,.10],[.01,.08]],26);
  for(const dx of [-.28,-.09])turning(s,'#beac90',trayX+dx,top,z+.15,[[.072,0],[.080,.018],[.067,.028],[.102,.083],[.10,.104],[.079,.104],[.077,.08],[.034,.045]],20);
  jar(s,-1.91,.19,z+.29,.24,.53,'#7a8880');
  for(let j=0;j<8;j++){
    const sway=.38*sin(j*1.37),h=.74+.54*(.5+.5*cos(1.9*j));
    const p=[-1.91+sway,.66+h,z+.29+.14*cos(j)];
    ribbon(s,'#938863',[[-1.91,.61,z+.29],[-1.93+sway*.17,.96,z+.30],[p[0]-.033*sway,p[1]-.11,p[2]],p],[.012,.014,.011,.005],8);
    for(let i=0;i<6;i++)dab(s,'#cab995',p[0]-.05+.022*i,p[1]-.10+.031*i,p[2]+.008*i,.026,.045,.021,0,0,-.34);
  }
}
const trades={sakura:ferry,bamboo,earthen:kiln,sulfur:mineral,paddy:granary,shore:fishing,maple,susuki:moon};
export function addVillageTrade(s,kind,r){trades[kind](s,r);}
