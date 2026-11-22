import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';

const {sin,cos,PI}=Math, tau=2*PI;
const fiber=0, cedar=1, clay=2, weave=3;
const ink='#51493b', bark='#695a47', rope='#b4a07b', straw='#c3ae82';
const cache=new Map();
let painted, pigment;

function materials(){
  if(!painted){
    const map=new T.TextureLoader().load(new URL('./assets/world/wayside-crafts.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    painted=new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide});
    pigment=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  }
  return [painted,pigment];
}

// A continuous painted skin over the bowed panels. The four atlas cells
// share a draw call. Inset UVs keep the adjoining ink out of each cut edge.
export function paintedPanels(){
  const xyz=[],uv=[],rgb=[],indices=[],color=new T.Color();
  function panel(tile,tint,cols,rows,point,area=[0,0,1,1]){
    const offset=xyz.length/3, [left,bottom,width,height]=area;
    color.set(tint);
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
      const u=col/cols,v=row/rows;
      xyz.push(...point(u,v));rgb.push(color.r,color.g,color.b);
      uv.push((tile%2+.008+.984*(left+width*u))*.5,(tile<2?.5:0)+(.008+.984*(bottom+height*v))*.5);
      if(row<rows && col<cols){
        const a=offset+row*(cols+1)+col,b=a+cols+1;
        indices.push(a,a+1,b,b,a+1,b+1);
      }
    }
  }
  function finish(){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
  return {panel,finish};
}

function pole(s,a,b,r0,r1=r0,shade='#ccbba2'){
  const start=new T.Vector3(...a),axis=new T.Vector3(...b).sub(start).normalize();
  const normal=new T.Vector3().crossVectors(axis,Math.abs(axis.y)<.85?new T.Vector3(0,1,0):new T.Vector3(1,0,0)).normalize();
  const tangent=new T.Vector3().crossVectors(axis,normal);
  s.panel(cedar,shade,8,3,(u,v)=>{
    const angle=tau*u,rad=(r0+(r1-r0)*v)*(1+.058*cos(3*angle+.74));
    return a.map((p,i)=>p+(b[i]-p)*v+rad*(normal.getComponent(i)*cos(angle)+tangent.getComponent(i)*sin(angle)));
  });
}
function cord(p,knots,width,color=rope,steps=8){
  p.stroke(color,knots,knots.map(()=>width),steps);
}
function lash(p,x,y,z,r,tilt=0){
  for(let j=0;j<3;j++){
    const pts=[];
    for(let i=0;i<=10;i++){
      const a=i*tau/10;pts.push([x+r*cos(a),y+.030*j+.015*sin(a)+tilt*cos(a),z+r*sin(a)]);
    }
    cord(p,pts,.015,rope,11);
  }
}
function earthenWall(s,x0,x1,z0,z1,y0,y1,seed,tile){
  s.panel(tile,'#f1e7d2',8,4,(u,v)=>{
    const ripple=.02*sin(u*11+seed)*sin(v*PI),dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
    return [x0+u*dx-ripple*dz/len,y0+(y1-y0)*v,z0+u*dz+ripple*dx/len];
  });
}
function opening(s,p,front,x0,x1,y0,y1,z){
  for(let i=0;i<5;i++){
    const x=x0+(x1-x0)*(i+.5)/5;
    pole(s,[x,y0,z],[x+.015*sin(i),y1,z],.018,.013,'#cab588');
  }
  for(const y of [y0,y1])pole(s,[x0-.07,y,z+front*.036],[x1+.07,y+.014,z+front*.036],.051,.046);
  for(const x of [x0,x1])pole(s,[x,y0,z+front*.026],[x,y1,z+front*.03],.036,.043);
  cord(p,[[x0,y0+.11,z],[x0+.4,y0+.13,z+.01],[x1,y0+.14,z]],.013,bark);
}
function cabin(s,p,fish,seed){
  const floor=fish?.52:.08,wall=fish?2.42:1.99,front=1.9,door=.72;
  const tile=fish?cedar:clay;
  const face=(x0,x1,y0,y1,z)=>earthenWall(s,x0,x1,z,z,y0,y1,seed,tile);
  // A person can see through the door into the dark room, and out through
  // the split bamboo across the high rear window.
  face(-2.5,-door,floor,wall,front);face(door,2.5,floor,wall,front);
  face(-door,door,floor+1.79,wall,front);
  face(2.5,.55,floor,wall,-1.9);face(-.55,-2.5,floor,wall,-1.9);
  face(.55,-.55,floor,floor+.92,-1.9);face(.55,-.55,floor+1.56,wall,-1.9);
  opening(s,p,-1,-.55,.55,floor+.92,floor+1.56,-1.9);
  for(const side of [-1,1]){
    earthenWall(s,side*2.5,side*2.5,-1.9,1.9,floor,wall,seed+side,tile);
    for(const x of [side*.79,side*2.43]){
      pole(s,[x,floor-.05,1.932],[x+.027*sin(x*seed),wall+.065,1.932],.084,.075);
    }
    for(const z of [-1.84,-.12,1.82]){
      const x=side*2.52;
      pole(s,[x,floor-.1,z],[x+.026*side,wall+.10,z+.035*sin(z+seed)],.082,.072);
    }
    pole(s,[side*2.51,wall-.03,-1.98],[side*2.51,wall+.015,1.98],.095,.082);
    for(const z of [-1.91,1.94])pole(s,[side*door,floor+.035,z],[side*2.49,floor+.04,z],.064,.059);
  }
  pole(s,[-2.62,wall+.016,front+.025],[2.58,wall-.012,front+.025],.109,.082);
  pole(s,[-door-.09,floor+1.80,front+.035],[door+.11,floor+1.81,front+.035],.082,.068);
  for(const x of [-2.42,2.42])lash(p,x,wall-.17,1.935,.096);
  if(fish){
    for(let j=0;j<15;j++){
      const x=-2.5+j/3, zFront=2.43+.04*sin(j*3.2+seed);
      s.panel(cedar,j%4===0?'#d8c7a6':'#eadac4',1,2,(u,v)=>[x+.318*u,.516+.010*sin(j),-1.89+(zFront+1.89)*v]);
      if(j%3===0)p.box(bark,x+.13,.335,2.32,.16,.34,.16);
    }
    for(let i=0;i<2;i++){
      const y=.14+i*.18,z=2.86-i*.26;p.box('#95816a',0,y-.045,z,1.56,.095,.30);
      for(const x of [-.55,.55])p.box(bark,x,y*.45,z,.11,y*.9,.14);
    }
    // Narrow battens stand proud of the shiplapped walls, including their
    // end grain around the doorway.
    for(const side of [-1,1]){
      for(let i=0;i<6;i++){
        const x=side*(.94+i*.265);pole(s,[x,floor,1.918],[x+.017*sin(i+seed),wall-.08,1.927],.023,.021);
      }
      for(let i=0;i<9;i++)pole(s,[side*2.517,floor,-1.63+i*.41],[side*2.52,wall-.10,-1.64+i*.415],.022,.018);
    }
    // A woven shutter rolled unevenly over the wide doorway.
    s.panel(weave,'#dbcca7',14,8,(u,v)=>{
      const a=.14+v*tau;
      return [-.91+1.82*u,floor+1.84+(.13+.025*cos(u*8))*cos(a),1.98+.126*sin(a)];
    });
    for(const x of [-.57,.56])cord(p,[[x,2.48,1.98],[x,2.35,2.16],[x,2.20,2.03],[x,2.28,1.90]],.017,bark);
  }else{
    s.panel(clay,'#b6a589',4,4,(u,v)=>[-2.48+4.96*u,floor,-1.90+3.8*v]);
    for(let i=0;i<4;i++)p.ball('#93836c',-.60+i*.40,.066,2.065,.31,.075,.19);
    for(const side of [-1,1]){
      for(const z of [-1.22,1.27]){
        // The rafters and ties can also be seen from inside the firelit room.
        pole(s,[side*2.50,wall-.05,z],[side*1.48,3.52,z*.28],.095,.069);
      }
    }
  }
}
function charcoalRoof(s,p,seed){
  function shape(side,u,v,hip=false,offset=0){
    const t=2*u-1,spread=3.01-1.49*v;
    const x=hip?side*spread:t*spread;
    const z=(hip?t:side)*2.38*(1-v)-.15*v;
    const loose=.05*sin(x*9.8+z*3.8+seed)+.035*sin(x*14.7-z*12.4+seed);
    const y=1.83+2.27*v-.18*sin(PI*v)+.063*sin(x*1.15+.4*seed)*(.24+.76*v)+loose*(1-v)**4;
    return [x+(hip?side*offset:0),y+offset,z+(hip?0:side*offset)];
  }
  for(const side of [-1,1])for(const hip of [false,true]){
    const at=(u,v,offset=0)=>shape(side,u,v,hip,offset);
    const n=hip?28:40;
    s.panel(fiber,'#f9efd4',n,9,(u,v)=>at(u,v));
    // Dark binding above the combed, broken ends of four overlapping lifts.
    // Each narrow lip is a physical layer with a small cast shadow.
    for(let row=0;row<4;row++){
      const v0=row*.207;
      const edge=u=>v0+.012*sin(u*49+row*1.35+seed)+.008*cos(u*79.5-row);
      s.panel(fiber,row%2?'#ede1c6':'#f5e6c4',n,3,(u,v)=>at(u,edge(u)+v*.125,.044*(1-v)+.004),[0,.005,1,.44]);
      s.panel(fiber,'#a28d6d',n,1,(u,v)=>{
        const a=at(u,edge(u),.044);a[1]-=(1-v)*(.045+.018*sin(u*46+seed));return a;
      },[0,.02,1,.09]);
    }
    const tips=hip?24:40;
    for(let i=0;i<tips;i++){
      const u=(i+.27+.18*sin(i*13.32+seed))/tips;
      const a=at(u,.063,.040),b=at(u+.004,.029,.06),c=at(u+.006,0,.075);
      c[1]-=.07+.075*(.5+.5*sin(i*7.1+seed));p.stroke(i%4?straw:'#927b57',[a,b,c],[.011,.013,.002],4);
    }
    if(!hip){
      for(const u of [.23,.51,.79]){
        const knots=[.02,.24,.5,.76,.99].map(v=>at(u,v,.062));
        cord(p,knots,.024,'#746447',9);
      }
    }
  }
  const points=Array.from({length:9},(_,i)=>[-1.72+i*.43,4.10+.07*sin(i*.55+seed*.4),-.15+.022*cos(i*.7)]);
  p.stroke('#9a8058',points,points.map((_,i)=>i===0||i===8?.12:.185),18);
  for(let i=-3;i<=3;i++){
    const x=i*.43, y=4.12+.058*sin((i+4)*.55+seed*.4);
    cord(p,[[x-.03,y-.125,.10],[x-.016,y+.075,.034],[x,y+.17,-.14],[x+.014,y+.085,-.32],[x+.024,y-.093,-.39]],.026,'#756044',9);
  }
}

function fisherRoof(s,p,seed){
  const ridge=-.27,peak=3.91;
  function at(side,x,v,raise=0){
    const wave=.043*sin(x*1.35+seed*.46)+.023*sin(x*4.1+side);
    return [x,2.29+(peak-2.29)*v-.115*sin(v*PI)+wave+raise,ridge*v+(side*2.40+.047*sin(x*4.52+seed))*(1-v)];
  }
  for(const side of [-1,1]){
    s.panel(cedar,'#a99578',30,7,(u,v)=>at(side,(u-.5)*6.10,v));
    // Two courses of split cedar. The free edge of each plank has its own
    // taper and warp, and the uphill row laps over the lower one.
    for(let row=0;row<2;row++)for(let j=0;j<16;j++){
      const x=-3.02+j*.378+(row?.13:0),left=Math.max(-3.04,x),right=Math.min(3.04,x+.372);
      const toe=row?.505:0,grain=.018*sin(j*3.14+seed+row);
      s.panel(cedar,['#d9cfb4','#bfb7a4','#dbd2bb','#c4baa5'][(j+row+seed)%4],2,4,(u,v)=>{
        const t=toe+v*(row?.495:.548),xx=left+(right-left)*u;
        const q=at(side,xx,t,.035+.025*(1-v)+grain+.013*sin(u*PI));q[2]+=side*.064*sin(j*4.6+seed)*(1-v);return q;
      },[(j%4)*.19,row*.14,.22,.72]);
    }
    // Beach stones retain the laths. Each has a low, irregular silhouette.
    for(const [v,places] of [[.22,[-2.1,-.68,.96,2.43]],[.69,[-1.81,-.23,1.61]]]){
      const rail=[-3.09,-1.72,-.3,1.26,3.11].map(x=>at(side,x,v,.092));
      p.stroke('#867760',rail,[.051,.060,.050,.062,.047],12);
      for(const [i,x] of places.entries()){
        const [px,y,z]=at(side,x+.11*sin(seed+i),v,.165);
        p.ball(i%2?'#847f70':'#9b9786',px,y,z,.22+.025*cos(i+seed),.10+.018*sin(i),.155,0,i*.7,.12*cos(i));
      }
    }
    for(const x of [-2.73,2.66]){
      const beam=[at(side,x,0,-.07),at(side,x,.42,-.067),at(side,x,1,-.07)];
      p.stroke(bark,beam,[.08,.085,.067],8);
    }
    // Both gable ends are closed with bundled reed. Split battens cross
    // their triangular faces and meet at the ridge, forward of the wall.
    const x=2.53*side;
    s.panel(weave,'#d9c8a5',8,4,(u,v)=>[x,2.40+(peak-2.40)*v,(u-.5)*3.78*(1-v)+ridge*v]);
    for(const sign of [-1,1]){
      pole(s,[x+side*.035,2.41,sign*1.91],[x+side*.035,peak-.07,ridge],.062,.046);
      pole(s,[x+side*.035,2.41,sign*.74],[x+side*.035,3.16,sign*.69],.032,.034);
    }
    pole(s,[x+side*.035,2.43,-1.92],[x+side*.035,2.43,1.93],.075,.068);
  }
  pole(s,[-3.13,peak+.10,ridge],[3.18,peak+.13,ridge+.025],.11,.09);
  for(const x of [-2.42,-.29,2.15]){
    const y=peak+.11;
    cord(p,[[x,y-.11,ridge+.12],[x,y+.09,ridge+.07],[x+.01,y+.11,ridge-.06],[x+.015,y-.12,ridge-.14]],.024,bark);
  }
}
function kiln(s,p,seed){
  const cx=-4.30;
  // Sections run down the tunnel. Narrowing the last rings leaves a real
  // firemouth in the front of the clay dome, with a deep charred interior.
  const rings=[[-1.42,.11,.63],[-1.30,.84,1.15],[-.94,1.32,1.67],[-.40,1.50,1.89],
    [.20,1.51,1.82],[.69,1.27,1.58],[1.03,.94,1.27],[1.42,.77,.98],[1.68,.65,.85]];
  function arc(r,a){
    const [z,w,h]=r;
    return [cx+cos(a)*w*(1+.027*sin(3*a+z+seed)),.055+h*Math.pow(Math.max(0,sin(a)),.78)+.025*sin(a*4+z),
      z+.044*sin(a*3+seed)+.019*cos(a+z)];
  }
  for(let i=0;i<rings.length-1;i++){
    const lo=rings[i],hi=rings[i+1];
    s.panel(clay,i>5?'#a68b73':'#c6ad8d',16,3,(u,v)=>{
      const r=lo.map((val,j)=>val+(hi[j]-val)*u);return arc(r,v*PI);
    },[i/8,0,1/8,1]);
  }
  const lip=rings.at(-1),inner=[1.75,.48,.66];
  s.panel(clay,'#af9272',16,2,(u,v)=>arc(inner.map((val,i)=>val+(lip[i]-val)*v),u*PI));
  s.panel(clay,'#514b43',16,4,(u,v)=>arc([1.74-v*.89,.477-.07*v,.651-.14*v],u*PI));
  s.panel(clay,'#413d37',10,3,(u,v)=>{
    const a=arc([.861,.405,.51],PI*u);return [cx+(a[0]-cx)*v,.03+(a[1]-.03)*v,.861];
  });
  p.box('#554a40',cx,.03,1.30,.94,.04,.91);
  for(let i=0;i<9;i++){
    const a=(.15+i*.108)*PI,st=arc(lip,a),ed=arc(inner,a+.015);
    cord(p,[st,[(st[0]+ed[0])*.5,(st[1]+ed[1])*.5,1.73],ed],.012,'#655747',5);
  }
  // Roughly laid river rock retains the foot of the kiln.
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const [z,w]=rings[i+1],a=.19+.09*sin(i);
    p.ball(i%3?'#8b8071':'#9d917f',cx+side*w*.96,.16,z,.23+.06*sin(i*2),a,.28,0,i+seed,.18*sin(i));
  }
  for(let i=0;i<3;i++){
    const y=1.67+i*.18,rad=[.31,.269,.24][i];
    s.panel(clay,i===2?'#998978':'#ac977f',12,2,(u,v)=>[cx-.17+cos(u*tau)*(rad-.036*v),y+v*.22,-.81+sin(u*tau)*(rad-.028*v)]);
  }
  p.ball('#4c453c',cx-.17,2.20,-.81,.192,.012,.191);
  // Charring travels in short radial tongue marks up from the firemouth.
  for(let i=0;i<7;i++){
    const j=(i+1)/8,a=PI*(.16+.70*j),b=arc([1.397,.78,1.008],a),c=arc([1.13,.88,1.18],a+.045);
    p.stroke(i%2?'#89745e':'#786858',[b,[(b[0]+c[0])/2,(b[1]+c[1])/2+.011,(b[2]+c[2])/2],c],[.027,.023,.003],6);
  }
}
function lumber(s,p,seed){
  for(const x of [2.81,4.87])pole(s,[x,.19,-1.43],[x,.16,.64],.094,.09);
  // The split logs expose wedges of sapwood and heartwood on the end wall.
  // Mismatched cross-sections let the stacked billets settle into each other.
  for(let row=0;row<4;row++)for(let col=0;col<6-row;col++){
    const x=2.84+(col+row*.48)*.405,y=.29+.279*row,z=.51+.075*sin(col*7+row*3+seed);
    const end=Array.from({length:7},(_,j)=>{
      const a=(j/7)*tau+.14*sin(row*4+col),r=.205+.031*cos(2*a+col*.4+seed);
      return [x+r*cos(a),y+r*sin(a),z];
    });
    for(let j=0;j<7;j++){
      const a=end[j],b=end[(j+1)%7];
      s.panel(cedar,j%3?'#baa588':'#98816b',1,2,(u,v)=>[
        a[0]+u*(b[0]-a[0])+.055*v,a[1]+u*(b[1]-a[1])+.022*v,z-v*(1.44+.25*cos(row+col))],
        [.11*(j%5),.04,.19,.91]);
      s.panel(clay,'#d8c4a3',1,1,(u,v)=>[x+(a[0]+u*(b[0]-a[0])-x)*v,y+(a[1]+u*(b[1]-a[1])-y)*v,z+.004]);
    }
    if((row+col)%2===0){
      const a=end[2];p.stroke(bark,[[x+.02,y-.03,z+.011],[x+.05,y+.018,z+.010],[a[0],a[1],z+.01]],[.017,.009,.002],4);
    }
  }
}
function tub(s,p,x,z,r,h,seed){
  const side=(a,v)=>[x+(r*(.77+.23*v))*cos(a),.02+h*v,z+(r*(.77+.23*v))*sin(a)];
  s.panel(weave,'#e4d4ad',20,6,(u,v)=>side(u*tau,v));
  s.panel(weave,'#a89b80',18,2,(u,v)=>[x+r*.73*v*cos(u*tau),.035,z+r*.73*v*sin(u*tau)]);
  for(const v of [.15,.68,1.0]){
    const ring=Array.from({length:26},(_,i)=>side(i/25*tau,v));
    cord(p,ring,v===1?.032:.019,v===1?straw:bark,30);
  }
  for(let i=0;i<11;i++){
    const a=i*tau/11+.17*seed,points=[.12,.49,.94].map(v=>side(a+.015*cos(v*PI),v));
    cord(p,points,.010,'#aa9470',6);
  }
}
function fishGear(s,p,seed){
  const x0=3.09,x1=5.83,z0=.85,z1=1.29,height=2.53;
  pole(s,[x0+.04,0,z0],[x0-.13,height+.25,z0+.06],.084,.06);
  pole(s,[x1-.06,0,z1],[x1+.09,height+.12,z1-.05],.083,.059);
  pole(s,[x0-.26,height+.03,z0+.048],[x1+.19,height-.13,z1-.042],.066,.039);
  for(const [x,y,z] of [[x0-.11,height-.12,z0+.04],[x1+.081,height-.25,z1-.04]])lash(p,x,y,z,.081);
  function net(u,v){
    const hanging=sin(u*PI),sag=.268*hanging;
    return [x0+.07+(x1-x0-.10)*u+.055*v*sin(u*5+seed),
      height-.06-.15*u-sag-(1.68+.21*sin(u*4.12+.3*seed))*v+.05*sin(PI*v)*cos(u*4),
      z0+(z1-z0)*u+.23*hanging*sin(PI*v)+.13*v*v+.048*sin(u*8+seed)*v];
  }
  for(const dir of [-1,1]){
    // Each continuous cord crosses the next to form open diamond meshes.
    for(let i=-10;i<=27;i++){
      const swing=.43,u0=i*.0625;
      const lo=Math.max(0,dir===1?-u0/swing:(u0-1)/swing),hi=Math.min(1,dir===1?(1-u0)/swing:u0/swing);
      if(hi-lo<.04)continue;
      const knots=Array.from({length:7},(_,j)=>{
        const v=lo+(hi-lo)*j/6;return net(u0+dir*swing*v,v);
      });cord(p,knots,.0096,dir>0?'#747666':'#656b5d',8);
    }
  }
  for(const v of [0,1])cord(p,Array.from({length:15},(_,i)=>net(i/14,v)),.020,'#83765d',16);
  for(let i=0;i<=9;i++){
    const a=net(i/9,0);
    p.ball(i%4===2?'#947662':'#bfad83',a[0],a[1]+.033,a[2]+.019,.071,.055,.049,0,i*.39,.10*sin(i));
    if(i%3===0){
      const t=net(i/9,1);p.ball('#7b786b',t[0],t[1]-.026,t[2],.040,.069,.041);
    }
  }
  for(const [x,z,r,h] of [[3.26,2.00,.42,.53],[4.07,2.13,.31,.41]])tub(s,p,x,z,r,h,seed);
  // A sculling oar rests against the lee side. The blade is carved on two
  // faces with a convex central rib, rising from the ferruled shaft.
  pole(s,[-2.75,.13,1.88],[-2.38,2.84,.64],.036,.057,'#c1a885');
  s.panel(cedar,'#d1c09f',4,8,(u,v)=>[-2.38+.19*(u-.5)*sin(PI*v)**.43+.12*v,
    2.77+.92*v+.016*sin(PI*u),.67-.40*v+.034*sin(PI*u)*sin(PI*v)]);
  tub(s,p,-2.70,-.54,.48,.60,seed+2);
}
function charcoalGear(s,p,seed){
  tub(s,p,.96,2.32,.36,.52,seed);
  for(let i=0;i<6;i++){
    const a=i*2.4,x=.96+.20*cos(a),z=2.32+.16*sin(a);
    pole(s,[x,.46,z],[x+.08*cos(a),.68+.12*cos(i),z+.10*sin(a)],.073,.039,'#554f44');
  }
  // A split-handled rake and a hooked iron scraper lean on the kiln shoulder.
  p.stroke('#706149',[[-3.00,.15,1.84],[-2.89,.94,1.47],[-2.79,1.97,1.05]],[.039,.041,.031],8);
  for(const x of [-.071,0,.071])p.stroke('#534e43',[[-3.0+x,.23,1.81],[-3.02+x,.12,1.93],[-3.05+x,.10,2.07]],[.024,.019,.012],5);
}

export function buildWaysideHut(kind,variant=0){
  const fish=kind==='fisher', seed=Math.abs(variant|0)%3, key=kind+seed;
  if(!cache.has(key)){
    const s=paintedPanels(),p=sculpture();
    cabin(s,p,fish,seed);
    if(fish){fisherRoof(s,p,seed);fishGear(s,p,seed);}
    else {charcoalRoof(s,p,seed);kiln(s,p,seed);lumber(s,p,seed);charcoalGear(s,p,seed);}
    cache.set(key,[s.finish(),p.finish()]);
  }
  const root=new T.Group(),mats=materials();
  root.name=fish?'漁師小屋':'炭焼き小屋';
  for(const [i,geometry] of cache.get(key).entries()){
    const mesh=new T.Mesh(geometry,mats[i]);mesh.name=i?'筆線と手道具':'木組と屋根の墨絵';
    mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  }
  return root;
}
