// Seven full-scale shelters, each grounded on its own walkable floor. Their
// front galleries look across the bath while the old traffic lanes stay clear.
import * as T from './vendor/three.module.min.js';
import { pilgrimBathInstallation } from './pilgrim-bathing-effects.js';
import { RETREATS,sitePoint } from './retreat-layout.js';
import { SNOW_SPRING,springLevel,wrapDelta } from './terrain.js';
import { bathEnclosure } from './bath-enclosures.js';
import { hasPilgrimBathhouse,lodgeFurniture,yardFixture,snowLamp } from './pilgrim-lodge-plan.js';
import { sculpture } from './pilgrimage-pigment.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { ink,wood,straw,cedar,stroke,beam,turned,surface,lodgeRoof,screenBay } from './pilgrim-roofcraft.js';

const {PI,sin,cos,abs}=Math,tau=2*PI;
const brass='#b39c66',paper='#e6d8b7',slate='#77786b',rope='#b8a17a';
const snowRoom={u:0,v:-8.9,w:8.74,d:3.54,eave:3.56,rise:1.46};
const range=(n,fn)=>Array.from({length:n},(_,i)=>fn(i/(n-1),i));
function cut(s,col,pts,r=.015){
  stroke(s,col,pts,pts.map((_,i)=>.002+r*sin(PI*i/(pts.length-1))**.68),Math.max(6,pts.length*2));
}
function hinge(s,x,y,z,r){
  s.post('#887044',x,y,z,r,.050,r,PI/2);
  s.post('#c9ac73',x,y,z+.035,.59*r,.032,.59*r,PI/2);
}
function frame(s,r,kind){
  const x=r.w/2,z=r.d/2,e=r.eave;
  for(const edge of [-1,1]){
    // The gable walls retain the plan's solid side bays. Face the front with
    // open joinery so both the bathing court and the path remain visible.
    const side=sculpture();
    screenBay(side,-z,z,0,e,kind==='temple'||kind==='dawn'?'paper':'slat');
    s.add(side.finish(),'#fff',edge*x,0,0,1,1,1,0,edge*PI/2);
    for(const end of [-1,1]){
      const u=edge*x,v=end*z,h=.215;
      s.box(slate,u,.13,v,.30,.26,.28);
      s.box(kind==='inari'?'#91513b':cedar,u,e/2+.074,v,.173,e-.13,.172);
      s.box(kind==='inari'?'#51483c':'#725d44',u,.35,v,.182,.24,.181);
      for(const side of [-1,1]){
        const a=[u,e-h-.27,v+side*.024],b=[u-edge*.34,e-.15,v+side*.024];
        beam(s,wood,a,b,.066,.084);
      }
      // Two grain marks flow around the knot, tapered into the sawn face.
      cut(s,'#a48462',[[u-.046,.55,v+.09],[u-.039,.93,v+.09],[u-.069,1.13,v+.09],[u-.054,1.5,v+.09],[u-.043,1.98,v+.09]],.008);
    }
    s.box(cedar,edge*x,e-.131,0,.207,.211,r.d+.29);
    s.box(wood,0,e-.101,edge*z,r.w+.25,.205,.19);
  }
  // Floor and wash bench are built by bath-pavilion-art to match the shared
  // movement surfaces. Each house has its own rear carpentry and equipment.
}
function fanGallery(s,r){
  const z=-r.d/2,e=r.eave,x=r.w/2;
  const cy=.88,rx=x*.93,ry=e-.99;
  // A fanlight across an entire bay: a real linen fan stretched inside its
  // ribs. The sun and mist are pigment on its folds, seen through the joinery.
  const face=(u,v)=>{
    const a=(u-.5)*PI*.92,q=.08+.92*v;
    return [rx*sin(a)*q,cy+ry*cos(a)*q,z+.045+q*(.034*cos(u*PI*28)+.038*q)];
  };
  s.box(cedar,0,.42,z,r.w,.84,.12);
  for(let j=0;j<11;j++)s.box('#9e8a6c',(-.46+.092*j)*r.w,.44,z+.065,.026,.72,.019);
  surface(s,'#fff',20,84,face,(u,v)=>{
    const [px,py]=face(u,v);
    const sun=Math.hypot(px+.66,py-1.80)<.36;
    const mist=1.20+.09*sin(px*3)+.10*sin(px*1.3);
    return [sun?'#b76e4f':py<mist?'#8e9d90':py<mist+.08?'#c7bda3':'#dcc8a3',.91+.085*cos(u*28*PI)];
  });
  for(let i=0;i<=14;i++){
    const a=i/14,points=range(6,q=>face(a,q));
    stroke(s,i===0||i===14?cedar:'#96805d',points.map(([x,y,z])=>[x,y,z+.032]),i===0||i===14?.064:.026,8);
  }
  stroke(s,wood,range(37,q=>face(q,1)),.073,43);
  hinge(s,0,cy+.10,z+.13,.105);
  // A pair of sunbursts under the eave picks up the line of the fan even in
  // silhouette. They support the little gallery at the outer front posts.
  for(const side of [-1,1])for(let j=0;j<4;j++){
    const u=side*(x-.14),v=r.d/2;
    beam(s,j%2?wood:'#997850',[u,e-.66,v],[u-side*(.20+.21*j),e-.105,v],.036,.064);
  }
}
function orchard(s,r){
  const z=-r.d/2,x=r.w/2,e=r.eave;
  // Diagonal splits weave over and under at the crossings of the fruit loft.
  for(let k=0;k<2;k++)for(let j=-12;j<=12;j++){
    const slope=k?1.08:-1.08,base=j*.43,lo=.29,hi=e-.29;
    const u1=Math.max(-x,Math.min(x,(lo-base)/slope)),u2=Math.max(-x,Math.min(x,(hi-base)/slope));
    if(abs(u2-u1)>.05)beam(s,k?'#a58e65':'#807454',[u1,base+slope*u1,z+.050*k],[u2,base+slope*u2,z+.05*k],.056,.030);
  }
  for(const y of [.29,e-.27])s.box(wood,0,y,z,r.w,.12,.16);
  const trunk=[[-x,.14,.38],[-x-.08,.76,.53],[-x+.08,1.36,.59],[-x-.035,2.04,.67],
    [-x+.34,e-.13,.83],[-x+.76,e+.02,.96],[-.58,e+.06,.90],[.14,e+.16,.80],[.79,e+.13,.87]];
  stroke(s,'#76624b',trunk,[.16,.158,.135,.106,.089,.084,.060,.043,.01],35,8);
  // Gnarled boughs train out along the front of the trellis. Sparse blossoms
  // are five-petalled clusters with a visible central calyx, buds and spurs.
  for(let j=0;j<15;j++){
    const t=j/14,u=-x+.20+t*3.08,y=e-.25+.38*sin(t*2.45),v=.78+.13*sin(j*.86);
    const bend=[u+.09,y+.13+.07*cos(j),v+.06],tip=[u+.21+.09*sin(j),y+.25+.15*sin(j*1.8),v+.10];
    stroke(s,cedar,[[u,y,v],bend,tip],[.032,.021,.006],7);
    for(const [n,at] of [bend,tip].entries()){
      const size=n?.095:.062;
      for(let k=0;k<5;k++){
        const a=k*tau/5+.55*j;
        s.ball((j+k)%4?'#dfb2a4':'#c88b88',at[0]+.54*size*cos(a),at[1]+.52*size*sin(a),at[2],
          .64*size,.46*size,.29*size,0,0,a);
      }
      s.ball(brass,at[0],at[1],at[2]+size*.25,.23*size,.19*size,.18*size);
    }
  }
  for(let j=0;j<5;j++){
    const u=x-.48-j*.31,y=e-.43-.16*cos(j*1.7),v=z+.18;
    stroke(s,rope,[[u,e-.14,v],[u+.055,y+.08,v+.012],[u+.035,y,v]],[.016,.014,.011]);
    const scale=.75+.26*sin(j*1.73),ay=y-.52*scale;
    turned(s,j%2?'#b38c5e':'#c19b65',u+.035,ay,v,
      [[.02,0],[.105,.03],[.134,.12],[.121,.20],[.058,.272],[.073,.32],[.083,.37],[.058,.43],[.026,.46],[.020,.52]].map(([a,b])=>[a*scale,b*scale]),16);
  }
}
function bracket(s,u,y,z,sign){
  // A three-step tokyō cluster. Short bearing blocks and deep, upswept hand
  // arms carry one another; the pad at the nose takes the forward purlin.
  for(let j=0;j<3;j++){
    const x=u-sign*.105*j,v=z+.070*j,up=y+.115*j;
    s.box('#82674e',x,up,v,.28+.158*j,.13,.286+.027*j);
    for(const dx of [-1,1])s.box('#a18364',x+dx*(.098+.071*j),up+.088,v,.135,.095,.239);
  }
}
function lantern(s,x,y,z){
  const bronze='#7e806c',amber='#d1bc84';
  stroke(s,bronze,[[x,y+.91,z],[x,y+.65,z],[x,y+.46,z]],.014);
  turned(s,bronze,x,y,z,[[.014,.02],[.10,.065],[.206,.12],[.171,.15],[.16,.182]],6);
  turned(s,amber,x,y,z,[[.145,.143],[.147,.35]],6);
  for(let j=0;j<6;j++){
    const a=j*tau/6;
    beam(s,bronze,[x+.152*sin(a),y+.133,z+.152*cos(a)],[x+.152*sin(a),y+.36,z+.152*cos(a)],.017,.017);
  }
  turned(s,bronze,x,y,z,[[.16,.34],[.224,.368],[.149,.396],[.073,.444],[.038,.47],[.014,.515]],6);
}
function bell(s,q){
  const x=q.x,z=q.z,bronze='#777c68';
  // The mouth is hollow: the lip doubles back to form the sound bow. Rows
  // of bosses catch light above two incised bands and the striking rosette.
  turned(s,bronze,x,.46,z,[[.38,.04],[.410,.015],[.444,.037],[.449,.097],[.427,.16],[.405,.32],[.389,.70],
    [.359,.95],[.32,1.082],[.223,1.131],[.078,1.149],[.035,1.144]],40);
  for(const y of [.13,.24,.71,.94]){
    turned(s,'#95967b',x,.46+y,z,[[.414-.067*y,0],[.422-.067*y,.014],[.414-.067*y,.027]],38);
  }
  for(let j=0;j<18;j++)for(let k=0;k<3;k++){
    const a=j*tau/18,r=.394-k*.008;s.ball(bronze,x+r*cos(a),1.19+.081*k,z+r*sin(a),.035,.036,.035);
  }
  hinge(s,x,.92,z+.412,.085);
  stroke(s,bronze,[[x-.115,1.59,z],[x-.117,1.71,z],[x,1.774,z],[x+.135,1.70,z],[x+.123,1.60,z]],.041,13);
  for(const dx of [-1,1]){
    s.box(cedar,x+dx*.49,1.10,z,.108,2.06,.155);
    beam(s,wood,[x+dx*.49,1.78,z],[x+dx*.23,2.03,z],.067);
  }
  s.box(cedar,x,2.11,z,1.07,.166,.175);
  stroke(s,rope,[[x,2.08,z],[x+.015,1.90,z],[x,1.77,z]],.023);
  for(const dx of [-.27,.27])stroke(s,rope,[[x+dx,2.05,z+.12],[x+dx+.024,1.47,z+.34],[x+dx,.97,z+.49]],.013);
  beam(s,wood,[x-.37,.97,z+.49],[x+.37,.97,z+.49],.070,.070,true);
}
function temple(s,r){
  const x=r.w/2,z=r.d/2,e=r.eave,h=e+r.rise;
  screenBay(s,-x,x,-z,e,'paper');
  for(const side of [-1,1]){
    bracket(s,side*x,e-.39,z,side);
    lantern(s,side*(x-.39),e-.96,z+.18);
  }
  // The square bronze lantern roof caps the actual tower roof collision.
  for(let j=0;j<4;j++){
    surface(s,'#767b71',9,14,(u,v)=>{
      const width=(1-v)*1.28+.17*v,depth=(1-v)*1.03+.18*v,t=2*u-1;
      const [xx,zz]=j===0?[t*width,depth]:j===1?[width,-t*depth]:
        j===2?[-t*width,-depth]:[-width,t*depth];
      return [xx,h-.07+.81*v-.088*sin(PI*v)+.10*abs(t)**3*(1-v),zz];
    });
  }
  turned(s,'#928d6e',0,h+.65,0,[[.22,0],[.25,.065],[.13,.128],[.11,.22],[.13,.28],[.063,.32],
    [.110,.36],[.074,.41],[.13,.48],[.133,.57],[.083,.67],[.018,.77]],26);
  bell(s,lodgeFurniture('temple',r)[0]);
}
function sacredRope(s,r){
  const half=r.w*.46,z=r.d/2+.13,e=r.eave;
  const center=u=>[-half+2*half*u,e-.32-.36*sin(PI*u),z+.042*sin(PI*u)];
  for(let j=0;j<3;j++){
    const points=range(77,u=>{
      const [x,y,z]=center(u),a=u*12*PI+j*tau/3,rad=.040+.025*sin(PI*u);
      return [x,y+rad*cos(a),z+rad*sin(a)];
    });
    stroke(s,j===1?'#b1976c':j===2?'#cab389':'#9c815b',points,.041,78,5);
  }
  for(let j=1;j<=5;j++){
    const [x,y,z]=center(j/6);
    for(let k=-2;k<=2;k++)stroke(s,'#b79a68',[[x,y-.06,z+.012*k],[x+.019*k,y-.19,z+.012*k],[x+.047*k,y-.32-.01*cos(k),z+.024*k]],[.017,.014,.005]);
    if(j===5)continue;
    const [u,v,w]=center((j+.42)/6);
    // Folded shide interleave at the return edge as one zig-zag strip.
    const chain=[[0,0],[-.048,-.076],[.025,-.12],[-.034,-.20],[.043,-.244],[-.014,-.335]];
    surface(s,paper,chain.length-1,1,(a,b)=>{
      const [ox,oy]=chain[Math.round(b*(chain.length-1))];return [u+ox+.083*(a-.5),v+oy-.065,w+.038*a+.013*cos(b*PI*4)];
    });
  }
}
function messengerLodge(s,r){
  const z=-r.d/2,x=r.w/2,e=r.eave;
  screenBay(s,-x,x,z,e,'slat');
  // Ema hang by separate cords, alternating their tilt. The pentagonal
  // front, little ears and tapering eyes depict the fox messengers.
  const ema=new T.Shape();ema.moveTo(-.135,-.123);ema.lineTo(.135,-.123);ema.lineTo(.135,.05);
  ema.lineTo(0,.159);ema.lineTo(-.135,.05);ema.closePath();
  const board=new T.ExtrudeGeometry(ema,{depth:.029,bevelEnabled:false});
  for(let row=0;row<2;row++){
    const y=1.20+.54*row;
    s.box('#93563d',0,y+.30,z+.12,r.w-.47,.074,.082);
    for(let j=0;j<10;j++){
      const u=(j/9-.5)*(r.w-.96),v=z+.16+.020*sin(j);
      const bob=.032*cos(j*2.3+row),col=(j+row)%3?'#cda677':'#d7b98c';
      stroke(s,'#8e6348',[[u-.089,y+.04+bob,v],[u,y+.31,v-.014],[u+.09,y+.043+bob,v]],.013,6);
      s.add(board,col,u,y+bob,v,1,1,1,0,0,.049*sin(j));
      for(const side of [-1,1]){
        cut(s,'#704d39',[[u+side*.098,y+.045+bob,v+.040],[u+side*.064,y+.022+bob,v+.042],[u+side*.030,y+.01+bob,v+.044]],.010);
        cut(s,'#9c5940',[[u+side*.109,y-.013+bob,v+.042],[u+side*.063,y-.034+bob,v+.042],[u+side*.05,y-.033+bob,v+.042]],.007);
      }
    }
  }
  sacredRope(s,r);
  for(const dir of [-1,1]){
    const u=dir*(x-.39),h=e+r.rise,v=0;
    for(const side of [-1,1])beam(s,wood,[u,h-.37,v+side*.48],[u,h+.53,v-side*.28],.112,.116);
  }
}
function boatLoft(s,r){
  const x=r.w/2,z=r.d/2,e=r.eave;
  screenBay(s,-x,x,-z,e,'slat');
  const q=lodgeFurniture('tsuruga',r)[0];
  turned(s,'#6e5943',q.x,.18,q.z,[[.411,.01],[.435,.085],[.322,.15],[.239,.27],[.185,.43],
    [.224,.52],[.284,.62],[.308,.69],[.289,.76],[.125,.78]],26);
  for(let k=0;k<3;k++){
    const a=k*PI/3;
    beam(s,'#90785b',[q.x-.51*cos(a),.861,q.z-.51*sin(a)],[q.x+.51*cos(a),.861,q.z+.51*sin(a)],.036,.036,true);
  }
  for(let k=0;k<5;k++){
    const a=k*2*PI;
    stroke(s,rope,range(21,t=>[q.x+.243*cos(a+tau*t),.47+.038*(k+t),q.z+.243*sin(a+tau*t)]),.022,22);
  }
  // The fishermen have pegged a net to the front purlin to mend it. The
  // crossing strands dip as a single hammock; floats follow its head rope.
  const net=(u,v)=>[x-2.02+1.90*u,e-.19-.67*v-.35*sin(PI*u)*(1-.3*v),
    z+.025+.085*sin(PI*u)+.032*sin(v*PI)];
  for(let side=0;side<2;side++)for(let k=-6;k<=16;k++){
    const slope=side?1:-1,base=k*.10,u1=Math.max(0,Math.min(1,-base/slope)),u2=Math.max(0,Math.min(1,(1-base)/slope));
    if(abs(u2-u1)<.055)continue;
    stroke(s,k%3?'#a29172':'#8b7c63',range(8,a=>{
      const u=u1+(u2-u1)*a;return net(u,base+slope*u);
    }),.011,9);
  }
  for(const edge of [0,1])stroke(s,'#856c50',range(17,u=>net(u,edge)),.025,19);
  for(let j=0;j<8;j++){
    const [x,y,z]=net((j+.5)/8,0);s.ball(j%2?'#bdac86':'#9c7254',x,y,z,.071,.051,.047);
  }
  // Exposed curved ribs descend at each tip of the upturned boat to the two
  // ends of the beam, so the taper of the roof has a physical support.
  for(const side of [-1,1]){
    const u=side*x;
    stroke(s,'#826b51',[[u,e-.16,z],[u,e+.19,z*.72],[u,e+.54,z*.43],[u+.15*side,e+.82,0],
      [u,e+.54,-z*.43],[u,e+.19,-z*.72],[u,e-.16,-z]],[.10,.105,.102,.11,.10,.10,.10],20,7);
  }
}
function fuelBay(s,q,r){
  // A dry stack of split pine serves the single chamber's stoking passage.
  // Logs are split polygons with eccentric annual rings on their cut ends.
  const x=q.x,z=q.z;
  for(const side of [-1,1])for(const end of [-1,1]){
    const u=x+side*.99,v=z+end*.54;
    beam(s,cedar,[u,.10,v],[u,side<0?1.90:1.68,v],.105,.113);
  }
  for(const side of [-1,1])s.box(wood,x,.29,z+side*.51,2.09,.11,.16);
  for(let row=0;row<5;row++)for(let j=0;j<8-row%2;j++){
    const u=x+(j-3.5+row%2*.45)*.246,y=.42+row*.169;
    const theta=(row*1.61+j*.97),length=.92+.15*cos(row*2+j*3),v=z+length/2;
    const cut=(a,rad,h)=>[u+rad*cos(a+theta),y+rad*.79*sin(a+theta),h];
    const n=5;
    for(let k=0;k<n;k++){
      const a=k*tau/n,b=(k+1)*tau/n;
      surface(s,k===0?'#b48e62':k===1?'#987453':'#655541',2,5,(q,t)=>interpLog(cut(a,.137,v-length*t),cut(b,.137,v-length*t),q));
      surface(s,k%2?'#b89569':'#c4a578',2,4,(q,t)=>interpLog(cut(a,.136*t,v+.002),cut(b,.136*t,v+.002),q));
    }
    if(j%2===0)stroke(s,'#836c4e',range(9,t=>cut(t*PI*1.38,.066,v+.009)),.006,11);
  }
  const roof=(u,v)=>[x+(2*u-1)*1.19,1.97-.25*u+.058*sin(PI*u),z+(2*v-1)*.75];
  surface(s,'#897963',7,14,roof);
  for(let j=0;j<11;j++)stroke(s,j%2?'#a6926e':'#76644c',range(8,v=>roof(j/10,v)),.034,11);
  // Flue cleanout: a covered, gently sloping passage under the rear wall
  // connects the external hatch directly to the steam stove.
  const a=[2.62-r.u,.25,-2.69-r.v],b=[x-.85,.30,z+.59];
  beam(s,'#8c6e55',a,b,.38,.28);
  beam(s,'#a68c6c',[a[0],a[1]+.13,a[2]],[b[0],b[1]+.13,b[2]],.43,.075);
  s.box('#81634d',b[0],.40,b[2],.53,.56,.38);
  s.box('#63594b',b[0],.42,b[2]+.21,.375,.32,.028);
  for(let j=-2;j<=2;j++)s.box('#9d8362',b[0]+j*.07,.42,b[2]+.23,.028,.28,.030);
}
function interpLog(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function potters(s,r){
  const x=r.w/2,z=r.d/2,e=r.eave;
  // A throwing bench occupies the washstand's old footprint. The flywheel,
  // spindle and shallow leather-hard vessels belong to the adjoining kiln.
  for(let j=0;j<4;j++)s.box(j%2?'#957255':'#a17e5d',0,.53,-.35+j*.123,r.w*.57,.103,.116);
  for(const side of [-1,1]){
    s.box(cedar,side*r.w*.23,.32,-.15,.151,.40,.40);
    beam(s,wood,[side*r.w*.23,.25,-.30],[side*r.w*.11,.49,-.30],.074,.078);
  }
  const ux=-.67,v=-.15;
  turned(s,'#84745b',ux,.28,v,[[.32,0],[.33,.055],[.29,.095],[.079,.113],[.07,.31],[.33,.327],[.35,.38],[.33,.405]],27);
  turned(s,'#bd9977',ux,.68,v,[[.09,0],[.12,.025],[.17,.15],[.20,.20],[.19,.215],[.158,.194],[.09,.048]],20);
  for(let j=0;j<3;j++)s.ball('#bd9572',.36+j*.237,.628,-.12,.112,.044,.107);
  screenBay(s,-x,x,-z,e,'slat');
  for(const h of [.93,1.56,2.23]){
    const width=r.w*.50;
    s.box('#8b7256',-x+.33+width/2,h,-z+.23,width,.107,.41);
    for(let j=0;j<6;j++){
      const ux=-x+.56+j*(width-.56)/5,sz=.71+.27*cos(h*3.41+.9*j);
      const form=[[.068,0],[.112,.014],[.116,.049],[.161,.12],[.172,.218],[.134,.307],[.078,.349],[.074,.395],
        [.093,.402],[.094,.432],[.067,.435],[.062,.389]];
      turned(s,['#778e82','#ba957d','#c6b797','#72918c'][(j+Math.round(h))%4],ux,h+.054,-z+.24,
        form.map(([a,b])=>[a*sz,b*sz]),18);
    }
  }
}
function snowshoes(s,x,y,z,turn){
  const kit=sculpture();
  const outline=range(37,t=>{
    const a=t*tau,tip=cos(a),w=.22*(.83+.17*tip);
    return [w*sin(a),.45*tip,0];
  });
  stroke(kit,'#9d825f',outline,.032,38);
  // Sine-width lacing stays inside the bent birch hoop. The instep tie and
  // broad toe strap are carried over the net just as on a pair of kanjiki.
  for(let j=-3;j<=3;j++){
    const u=j/4,y=.45*u,half=.22*Math.sqrt(1-u*u)*(.83+.17*u);
    beam(kit,rope,[-half,y,.003],[half,y,.003],.013,.012,true);
  }
  for(let j=-2;j<=2;j++){
    const xx=j*.056,b=.45*Math.sqrt(1-(xx/.18)**2)*.87;
    beam(kit,rope,[xx,-b,.006],[xx,b,.006],.013,.012,true);
  }
  stroke(kit,'#766a53',[[-.16,-.03,.012],[-.12,.05,.07],[0,.10,.09],[.103,.04,.06],[.157,-.03,.016]],.026,9);
  s.add(kit.finish(),'#fff',x,y,z,1,1,1,0,0,turn);
}
function snowTools(s,r){
  const e=r.eave;
  for(let j=0;j<18;j++){
    const u=(j/17-.5)*(r.w+.32),z=(r.d+.65)/2+.13,y=e-.05;
    const len=.11+.34*(.5+.5*sin(j*3.49))+.16*(.5+.5*cos(j*.91));
    stroke(s,j%3?'#c7d7da':'#d8e3e1',[[u,y,z],[u+.006,y-len*.31,z+.019],[u+.017,y-len,z+.027]],
      [.036+.026*(j%2),.026,.002],6,6);
  }
  // An alcove on the mountain side shelters a pair of snowshoes and a
  // wooden shovel. Nothing hangs over the central stairs into the water.
  const z=-1.30;
  for(const side of [-1,1])snowshoes(s,-2.54+.24*side,1.59+.06*side,z+.20,side*.26);
  const px=-3.40;
  beam(s,wood,[px-.07,.40,z+.29],[px+.15,2.13,z+.20],.035,.035,true);
  surface(s,'#a78a66',6,10,(u,v)=>[px+(u-.5)*(.36+.10*v)-.06+.07*v,.23+.51*v+.035*(2*u-1)**2,
    z+.32+.032*cos(PI*u)]);
  for(const side of [-1,1]){
    const u=side*3.67,z=1.06;
    stroke(s,'#977b5b',[[u,e-.64,z],[u-side*.13,e-.51,z],[u-side*.29,e-.47,z],[u-side*.42,e-.32,z],[u-side*.59,e-.26,z]],
      [.084,.086,.074,.067,.048],13,7);
  }
}
function gourdTrellis(s,plan){
  const seg=plan.segments[0],r=plan.room,x=seg.u-r.u,z=seg.v-r.v,span=seg.length*.46;
  for(const i of [-1,0,1]){
    const v=z+i*span;
    s.post(cedar,x,1.07,v,.086,2.18,.090,0,i*.20);
    stroke(s,'#8b714f',[[x-.39,2.26,v],[x-.13,2.35,v],[x+.15,2.34,v],[x+.42,2.24,v]],[.043,.067,.059,.037],9);
  }
  for(const i of [-1,0,1]){
    const u=x+i*.36;
    stroke(s,i===0?cedar:wood,[[u,2.26,z-span-.17],[u+.022,2.29,z],[u,2.23,z+span+.19]],i===0?.061:.047,14);
  }
  const vine=v=>[x+.28+.035*sin(v*2),2.24+.069*sin(v*1.2),z+v];
  stroke(s,'#786246',range(19,t=>vine((2*t-1)*span)),.038,23);
  for(let j=0;j<12;j++){
    const v=(j/11-.5)*1.91*span,[u,y,w]=vine(v),side=j%2?1:-1;
    stroke(s,'#929177',[[u,y,w],[u+side*.081,y+.105,w+.021],[u+side*.151,y+.085,w+.11]],[.019,.016,.01],7);
    surface(s,j%2?'#899379':'#a8ab82',5,6,(a,b)=>{
      const wide=.102*sin(PI*b);return [u+.05*side+.193*b*side,y+.112+.084*sin(PI*b)-.093*b,w+.084*b+wide*(2*a-1)];
    });
    if(j%2===0){
      const bottom=y-.54-.086*cos(j*1.3);
      stroke(s,rope,[[u,y,w],[u+.04,y-.105,w+.019],[u,bottom+.34,w+.04]],[.015,.010,.014]);
      turned(s,j%4?'#b28d5d':'#c3a170',u,bottom,w+.04,[[.02,0],[.094,.025],[.122,.10],[.103,.17],[.053,.21],[.073,.26],[.072,.30],[.034,.34],[.018,.36]],18);
    }
  }
}
function snowNiche(s){
  const x=snowLamp.x,z=snowLamp.z-snowRoom.v,y=-.36,w=snowLamp.w/2,d=snowLamp.d/2,h=2.62;
  // A compacted snow lantern with an excavated alcove facing the path.
  // The arch is cut out of each horizontal course; a recessed second skin
  // bounds its opening and catches the warm light from the wicker lamp.
  const shape=(u,v,inner=0)=>{
    const radius=Math.sqrt(Math.max(.00008,1-v**2));
    const gap=v<.78 ? .49*Math.sqrt(Math.max(0,1-(Math.max(0,v-.40)/.38)**2)):0;
    const angle=Math.asin(Math.min(.85,gap/radius))*(1-2*u)+tau*u;
    const lump=1+.020*sin(angle*5+v)*sin(PI*v)+.014*cos(7*angle-1.5*v);
    const a=sin(angle),b=cos(angle);
    return [x+w*radius*a*lump*(1-.18*inner),y+h*v-inner*(.054+.10*v),
      z+d*radius*b*lump*(1-.26*inner)-.07*inner];
  };
  surface(s,'#fff',29,64,(u,v)=>shape(u,v),(u,v)=>[v>.62?'#e9eeea':'#dbe5e4',.93+.058*cos(PI*u)*sin(v*2.4)+.012*sin(63*u+v*13)]);
  surface(s,'#b1c1c2',23,56,(u,v)=>shape(u,v,1));
  for(const u of [0,1])surface(s,'#d1dcda',20,4,(a,v)=>shape(u,v*.78,a));
  const ox=x+.035,oz=z+.61,oy=y+.81;
  s.ball('#c5d2d3',x,y+.48,z+.24,.84,.48,.80);
  turned(s,'#9c7658',ox,oy,oz,[[.27,0],[.31,.06],[.283,.123],[.219,.17]],9);
  turned(s,'#edb675',ox,oy+.15,oz,[[.222,0],[.226,.41]],9);
  turned(s,'#a18361',ox,oy+.55,oz,[[.22,0],[.302,.044],[.22,.10],[.125,.155]],9);
  for(let i=0;i<9;i++){
    const a=i*tau/9;
    beam(s,wood,[ox+.232*cos(a),oy+.13,oz+.232*sin(a)],[ox+.232*cos(a),oy+.56,oz+.232*sin(a)],.016,.016,true);
  }
  for(const side of [-1,1]){
    const u=x+side*.64;
    stroke(s,'#a4b7b9',[[u,.51,z+d*.82],[u+side*.19,.64,z+d*.76],[u+side*.31,.65,z+d*.69]],[.025,.028,.004]);
  }
}
function garden(s,kind,plan){
  const r=plan.room;
  if(kind==='peach'){gourdTrellis(s,plan);return;}
  if(kind==='snow'){snowNiche(s);return;}
  const q=yardFixture(kind,plan);
  if(kind==='sakai'){fuelBay(s,q,r);return;}
  if(kind==='temple'){
    const x=q.x,z=q.z;
    turned(s,'#8d8d78',x,.03,z,[[.49,0],[.51,.08],[.46,.17],[.30,.22],[.23,.31],[.208,.55],[.17,.59],[.163,.99],
      [.21,1.06],[.285,1.11],[.339,1.22],[.407,1.26],[.409,1.31],[.264,1.38]],8);
    for(let j=0;j<6;j++){
      const a=tau*j/6;
      beam(s,'#747d6d',[x+.272*cos(a),1.39,z+.272*sin(a)],[x+.272*cos(a),1.82,z+.272*sin(a)],.076,.072);
    }
    turned(s,'#a09d83',x,1.38,z,[[.22,0],[.22,.37]],6);
    turned(s,'#888b77',x,1.77,z,[[.26,.01],[.44,.041],[.487,.09],[.354,.14],[.197,.223],[.123,.293],[.094,.313],
      [.076,.373],[.116,.413],[.107,.49],[.053,.55],[.014,.60]],6);
  }
  if(kind==='tsuruga'){
    const a=plan.annex,x=a.u-r.u+.45*a.w,z=a.v-r.v-a.d*.44;
    const v=z+.16;
    beam(s,wood,[x,.23,z],[x-.085,3.54,z],.083,.083,true);
    beam(s,cedar,[x-.092,2.56,v],[x+.14,3.43,v+.88],.059,.059,true);
    const hook=[x+.14,3.42,v+.90];
    stroke(s,rope,[[x-.085,3.57,z],hook,[hook[0],2.49,hook[2]]],.021,12);
    turned(s,'#947f64',hook[0],2.44,hook[2],[[.03,0],[.082,.058],[.077,.145],[.03,.18]],10);
    // Three oiled float gourds hang below the pulley; the long rope is
    // belayed to the same post that supports the harbour's canvas awning.
    for(let i=0;i<3;i++)s.ball(i%2?'#aa8160':'#a69876',hook[0],2.31-i*.19,hook[2],.077,.072,.076);
  }
}

const design={dawn:fanGallery,peach:orchard,temple,inari:messengerLodge,tsuruga:boatLoft,sakai:potters,snow:snowTools};

export function pilgrimBathhouseGeometry(kind,r,plan){
  const s=sculpture();
  lodgeRoof(s,kind,r);
  if(kind!=='snow')frame(s,r,kind);
  design[kind](s,r);
  if(plan)garden(s,kind,plan);
  return s.finish();
}

const inkIndex=['dawn','peach','temple','inari','tsuruga','sakai','snow'];
let sheet;
const scrolls=new Map();
function paintedShutters(kind,w){
  let mat=scrolls.get(kind);
  if(!mat){
    sheet??=new T.TextureLoader().load(new URL('./assets/world/pilgrim-bath-scrolls.webp',import.meta.url).href);
    const i=inkIndex.indexOf(kind),map=sheet.clone(),bleed=.003;
    map.offset.set(i%2*.5+bleed,(3-Math.floor(i/2))*.25+bleed);
    map.repeat.set(.5-2*bleed,.25-2*bleed);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    mat=new T.MeshLambertMaterial({map,side:T.DoubleSide});scrolls.set(kind,mat);
  }
  const h=w*.5,group=new T.Group(),s=sculpture(),boards=4;
  const point=(u,v)=>{
    const fold=.058*(1-abs((u*boards%2)-1));
    return [(u-.5)*w,(v-.5)*h,.021+fold];
  };
  const pos=[],uv=[],idx=[];
  for(let j=0;j<boards;j++){
    const u=(j+.013)/boards,v=(j+.987)/boards,i=pos.length/3;
    for(const [a,b] of [[u,0],[v,0],[u,1],[v,1]]){
      pos.push(...point(a,b));uv.push(a,b);
    }
    idx.push(i,i+1,i+2,i+2,i+1,i+3);
  }
  for(const v of [0,1]){
    for(let j=0;j<boards;j++){
      const a=point(j/boards,v),b=point((j+1)/boards,v);
      a[2]-=.012;b[2]-=.012;beam(s,ink,a,b,.044,.05);
    }
  }
  for(let j=0;j<=boards;j++){
    const u=j/boards,a=point(u,0),b=point(u,1);
    a[2]-=.018;b[2]-=.018;beam(s,j===0||j===boards?ink:'#8b7d62',a,b,j===0||j===boards?.045:.016,.041);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const print=new T.Mesh(g,mat);print.receiveShadow=true;
  group.add(print,new T.Mesh(s.finish(),scrollPigment()));return group;
}
function addScroll(group,site,plan){
  const r=plan.room;
  if(site.kind==='snow'){
    const art=paintedShutters(site.kind,2.40);art.position.set(1.66,1.92,-1.18);group.add(art);return;
  }
  const segment=plan.segments[0],art=paintedShutters(site.kind,plan.closed?2.86:2.32);
  art.position.set(segment.u-r.u+.112,plan.closed?.99:.91,segment.v-r.v+(plan.closed?1.38:0));
  art.rotation.y=PI/2;group.add(art);
}
export function createPilgrimBathhouses(scene){
  const houses=RETREATS.filter(hasPilgrimBathhouse).map(site=>({site,plan:bathEnclosure(site)}));
  houses.push({site:SNOW_SPRING,plan:{room:snowRoom}});
  for(const item of houses){
    const r=item.plan.room,site=item.site;
    [item.x,item.z]=sitePoint(site,r.u,r.v);
    item.y=site.kind==='snow'?site.level+.52:springLevel(site);
  }
  return (player,time=0)=>{
    for(const h of houses){
      const dx=wrapDelta(h.x-player.x),dz=wrapDelta(h.z-player.z);
      if(dx*dx+dz*dz>158**2){if(h.group)h.group.visible=false;continue;}
      if(!h.group){
        const geo=pilgrimBathhouseGeometry(h.site.kind,h.plan.room,h.plan);
        const mesh=new T.Mesh(geo,scrollPigment());mesh.castShadow=mesh.receiveShadow=true;
        h.group=new T.Group();h.group.name=h.site.name+'の湯屋';h.group.add(mesh);
        addScroll(h.group,h.site,h.plan);
        h.installation=pilgrimBathInstallation(h.site);
        const r=h.plan.room;
        h.installation.root.position.set(-r.u,h.site.kind==='snow'?-.52:0,-r.v);
        h.group.add(h.installation.root);
        h.group.rotation.y=h.site.yaw;scene.add(h.group);
      }
      h.group.position.set(player.x+dx,h.y,player.z+dz);h.group.visible=true;
      const c=Math.cos(h.site.yaw),k=Math.sin(h.site.yaw),r=h.plan.room;
      h.installation.update(time,r.u-dx*c+dz*k,r.v-dx*k-dz*c);
    }
  };
}
