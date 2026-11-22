import * as THREE from './vendor/three.module.min.js';
import { wrapDelta } from './terrain.js';
import { SEA_ENSEMBLES, updateRyuguResident } from './ryugu-residents.js';
import { InkForm, fin, pigment, INK, SOOT, PAPER, WARM, RED } from './ryugu-ink.js';
import { brushWash } from './scroll-sculpt.js';
import { skin, skinGeometry, profile, brush, eye, membrane, pointCurve } from './ryugu-sculpt.js';

const {sin,cos,PI}=Math,tau=2*PI,ivory='#ebe3cc',moss='#c8c2a6',umber='#786e5a';
const darker='#655e4f',wash='#b2aa95',indigo='#747770';
const lerp=THREE.MathUtils.lerp;
function part(name,pivot,draw) {
  const form=new InkForm();draw(form);
  return {name,pivot,geometry:form.geometry()};
}

// Sea bream carry their depth high over the shoulder. The mouth turns upward
// ahead of the eye, and the back sinks into a very narrow caudal wrist.
const breamProfile=profile([
  // z, crown, belly, half breadth, centreline offset
  [-.91,-.038,-.09,.007,.06],[-.78,.018,-.155,.081,.056],[-.67,.034,-.18,.095,.039],
  [-.48,.188,-.278,.166,.008],[-.19,.394,-.356,.243,-.032],[.05,.525,-.39,.286,-.043],
  [.26,.59,-.35,.313,-.027],[.45,.553,-.274,.304,-.003],[.59,.432,-.201,.259,.009],
  [.73,.284,-.123,.188,.016],[.83,.196,-.037,.116,.019],[.882,.163,.048,.067,.02],
  [.902,.12,.084,.004,.02],
]);
function fishPoint(z,a,lift=0) {
  const [top,bottom,w,bend]=breamProfile(z),side=sin(a),level=cos(a);
  return [bend+side*(w*(.98+.08*level)+lift),(top+bottom)/2+level*((top-bottom)/2+lift),z];
}

function breamBody(f) {
  skin(f,48,38,(u,v)=>{
    const p=fishPoint(lerp(-.91,.902,v),u*tau);
    return [...p,v,(p[1]+.425)/1.055];
  },'#fffdf3','scales',true,true);
  // The spines share a swept leading edge. The soft rays run on behind them
  // as a lower ruffle rather than another repeated row of saw teeth.
  const root=u=>fishPoint(lerp(-.70,.41,u),0,-.007);
  const tips=pointCurve([[-.003,.12,-.75],[-.021,.22,-.67],[-.05,.27,-.53],
    [-.067,.386,-.43],[-.084,.482,-.32],[-.078,.60,-.20],[-.069,.707,-.07],
    [-.057,.773,.055],[-.058,.797,.159],[-.044,.78,.248],[-.028,.705,.337],[-.009,.58,.41]]);
  const dorsal=u=>{
    const p=tips(u),scallop=sin(PI*u*11)**2;
    p[1]-=.041*scallop*sin(PI*u);p[2]+=.018*scallop;
    return p;
  };
  membrane(f,root,dorsal,11,'#c3baa4',(u,v,k)=>k===0?.021*(u-.3):0);
  membrane(f,u=>fishPoint(lerp(-.55,-.05,u),PI),pointCurve([[.021,-.24,-.59],
    [.003,-.392,-.65],[-.034,-.427,-.51],[-.038,-.437,-.34],[-.044,-.406,-.05]]),6,'#c8bfaa');
  for(const s of [-1,1]){
    const on=(z,a,lift=.005)=>fishPoint(z,s*a,lift);
    eye(f,(u,v,lift)=>on(.658+.094*u,1.20-v*.30,lift));
    // The weight is on the return of the gill flap; leave the cheek open.
    brush(f,[[.483,.68],[.438,1.08],[.392,1.45],[.381,1.86],[.437,2.17],[.53,2.34]]
      .map(([z,a])=>on(z,a)),[.002,.006,.014,.016,.011,.002],SOOT);
    brush(f,[[.408,.92],[.359,1.32],[.325,1.65]].map(([z,a])=>on(z,a)),[.001,.006,.001],darker);
    brush(f,[[.724,1.89],[.768,1.94],[.818,1.97],[.875,1.91],[.896,1.63]]
      .map(([z,a])=>on(z,a,.009)),[.001,.006,.012,.014,.003],INK);
    brush(f,[on(.773,.94),on(.789,.98),on(.806,1.02)],[.002,.011,.002],INK);
    // Broken crescents follow the turn of each flank, tightening over the
    // narrow caudal wrist and leaving the pale belly and the gill plate clear.
    for(let row=0;row<4;row++)for(let column=0;column<7;column++){
      if((row*7+column*3)%5<2)continue;
      const z=-.59+column*.128+(row%2)*.058,a=.93+row*.276-.12*sin(column*.61);
      const h=.130-.03*row,w=.04+.009*cos(row+column);
      brush(f,[on(z+.008,a-h),on(z-w*.65,a-h*.48),on(z-w,a+.028),on(z-.012,a+h)],
        [.001,.004,.0055,.001],row===3?'#a79b83':'#796f5c');
    }
    // Short knotted dance stole; the long flank remains open for the scales.
    skin(f,3,24,(u,v)=>{
      const a=.055+u*.94;
      return on(.30+.072*v+.055*sin(a*1.3),a,.014+.005*sin(v*PI));
    },ivory);
    brush(f,Array.from({length:10},(_,i)=>{const a=.055+i*.94/9;return on(.313+.055*sin(a*1.3),a,.022);}),.005,indigo);
  }
  const streamer=pointCurve([[-.20,.51,.34],[-.34,.56,.228],[-.42,.60,.01],[-.50,.55,-.16]]);
  skin(f,4,20,(u,v)=>{const p=streamer(u);return [p[0]-.017*sin(PI*v),p[1]+(v-.5)*(.09-.071*u),p[2]];},ivory);
}

function bream() {
  const rigs=[part('bream-body',[0,.93,0],breamBody)];
  rigs.push(part('bream-tail',[.055,.87,-.81],f=>{
    const leading=u=>[.014*(1-u),lerp(-.088,.079,u),.047-.025*sin(PI*u)];
    const margin=pointCurve([[.025,-.36,-.515],[.023,-.301,-.494],[.009,-.133,-.41],
      [-.013,-.038,-.255],[-.022,.013,-.245],[-.04,.179,-.394],[-.047,.315,-.473],[-.053,.391,-.471]]);
    membrane(f,leading,margin,12,'#c8bca3',(u,v,k)=>k===0?.036*sin(tau*u):0);
  }));
  for(const s of [-1,1])rigs.push(part(s<0?'bream-fan':'bream-fin',[s*.244,.97,.225],f=>{
    const shoulder=u=>[s*.014,lerp(-.074,.069,u),lerp(-.066,.015,u)];
    const margin=pointCurve([[s*.154,-.092,-.14],[s*.306,-.065,-.24],[s*.443,.015,-.24],
      [s*.479,.107,-.16],[s*.485,.157,-.10],[s*.425,.147,-.083],[s*.14,.058,.004]]);
    membrane(f,shoulder,margin,7,'#d4c8b0',(u,v,k)=>k===1?.04:0);
    if(s<0){
      const pin=[-.447,.137,-.133];
      const outer=u=>{
        const a=lerp(-.80,.70,u),radius=.76+.016*cos(u*PI*16);
        return [pin[0]+radius*sin(a)*.74,pin[1]+radius*cos(a),pin[2]+radius*sin(a)*.67];
      };
      const fold=(u,v)=>{
        const q=lerp(.415,1,v),edge=outer(u),pleat=.029*cos(u*PI*16)*q;
        return [lerp(pin[0],edge[0],q)-pleat*.67,lerp(pin[1],edge[1],q),lerp(pin[2],edge[2],q)+pleat*.74];
      };
      skin(f,7,32,fold,'#fbf6e6','fan');
      for(let i=0;i<=8;i++)brush(f,[pin,fold(i/8,.015),fold(i/8,.985)],[.012,.008,.0028],darker);
      brush(f,Array.from({length:25},(_,i)=>fold(i/24,1)),.0055,SOOT);
    }
  }));
  return rigs;
}
// The throat rises out of the collar into a broad cheek. A shallow stop at the
// bridge and a short blunt cutting edge break the profile of the upper jaw.
const turtleProfile=profile([
  // z, crown, throat, half breadth, centreline offset
  [-.21,-.066,-.42,.099,-.018],[-.105,.031,-.393,.139,-.005],
  [.024,.147,-.277,.128,.012],[.143,.236,-.145,.126,.031],
  [.229,.290,-.066,.154,.047],[.314,.336,-.018,.199,.057],
  [.396,.347,.007,.214,.061],[.465,.334,.030,.190,.062],
  [.523,.303,.049,.166,.063],[.581,.275,.066,.144,.067],
  [.610,.266,.074,.132,.070],[.648,.259,.087,.111,.073],
  [.674,.247,.097,.089,.075],[.690,.225,.108,.060,.076],
  [.697,.196,.122,.034,.077],[.700,.153,.153,0,.077],
]);

function turtleHead() {
  const geometry=skinGeometry(72,56,(u,v)=>{
    const a=u*tau,side=sin(a),level=cos(a);
    // More sections around the two ends keep the blunt muzzle smoothly rounded.
    const along=(1-cos(PI*v))*.5,z=lerp(-.21,.70,along);
    const [crown,throat,width,offset]=turtleProfile(z);
    const sideAngle=Math.acos(level);
    const socket=Math.exp(-(((z-.46)/.095)**2+((sideAngle-1.16)/.47)**2));
    const jaw=Math.exp(-(((z-.56)/.135)**2+((sideAngle-1.91)/.15)**2));
    const breadth=width*(1+.065*level+.063*socket-.024*jaw);
    // Across the bill the upper and lower plates meet in a flatter edge.
    // The cross-section becomes round again where the neck enters the collar.
    const bill=THREE.MathUtils.smoothstep(z,.47,.66);
    const faceSide=Math.sign(side)*Math.abs(side)**(1-.18*bill);
    const faceLevel=Math.sign(level)*Math.abs(level)**(1-.17*bill);
    const x=offset+breadth*faceSide;
    const y=(crown+throat)*.5+(crown-throat)*.5*faceLevel;
    // The lower cutting plate tucks just inside the upper one at the muzzle.
    const jawZ=z-.27*width*bill*Math.max(0,-level);
    return [x,y,jawZ,along,1-u];
  },true,true);
  const map=new THREE.TextureLoader().load(new URL('./assets/bestiary/ryugu-turtle-face.webp',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=8;
  const material=brushWash(new THREE.MeshLambertMaterial({map}),.63);
  return {name:'turtle-head',pivot:[0,1.31,.12],geometry,material};
}

// Both sides of the breastplate meet the same upturned rim. The shell swells
// just below the shoulders and tapers to a pointed, scalloped rear margin.
function shellPoint(a,r,back=true,lift=0){
  const y=r*sin(a),x=r*cos(a),rear=Math.max(0,-sin(a));
  const serration=1+(.011+.018*rear)*cos(18*a+.26)*r**8;
  const dome=Math.sqrt(Math.max(0,1-r*r));
  const keel=.036*dome*cos(a*2)*r;
  return [.008+.551*x*(1+.19*y-.13*y*y)*serration,.652*y+.024*x,
    -.023+.31*y+.025*r**4+(back?-(.424+lift)*dome+keel:(.29+lift)*dome)];
}
function turtleShell(f){
  for(const back of [true,false]){
    skin(f,16,56,(u,v)=>{
      const r=sin(v*.5*PI),a=u*tau;
      return [...shellPoint(a,r,back),.5+.485*r*cos(a),.5+.485*r*sin(a)];
    },back?'#fffaf0':'#d9cfb1',back?'shell':'paper',!back,true);
  }
  brush(f,Array.from({length:69},(_,i)=>shellPoint(i*tau/68,1)),.013,darker);
  // Stagger the marginal scutes so the keel retains a quiet broad wash.
  for(let j=0;j<19;j++){
    const a=j*tau/19;
    brush(f,[shellPoint(a,.864),shellPoint(a+.018,.931),shellPoint(a+.048,.993)],
      [.001,.007,.003],SOOT);
  }
  for(const s of [-1,1]){
    for(const [i,y] of [.32,.07,-.24,-.51].entries()){
      const z=(x,dy)=>{
        const r=Math.hypot(x,dy),p=shellPoint(Math.atan2(dy,x),r,false,.007);return p;
      };
      brush(f,[z(s*.78,y+.09),z(s*.53,y+.01),z(s*.24,y-.04),z(s*.019,y-.066)],
        [.002,.009,.006,.002],i%2?darker:'#89806a');
    }
  }
  const breast=(x,y)=>shellPoint(Math.atan2(y,x),Math.hypot(x,y),false,.009);
  brush(f,[[0,.82],[-.022,.55],[.014,.29],[.016,.016],[-.013,-.27],[.015,-.58],[0,-.84]]
    .map(([x,y])=>breast(x,y)),[.001,.007,.01,.008,.01,.005,.001],darker);
  for(const s of [-1,1])for(let band=0;band<4;band++)for(let j=0;j<3;j++){
    const y=.53-.32*band-.029*j,x=s*(.18+.12*j+.04*(band%2));
    const points=[breast(x,y),breast(x+s*.071,y+.012),breast(x+s*.149,y+.052+.007*j)];
    brush(f,points,[.001,.0045,.001],'#a3987d');
  }
  // A plain folded collar hangs open over the drum. Its two lobes lie
  // against the rim rather than concealing the plates on the back.
  for(const s of [-1,1]){
    const seam=(u,v)=>{
      const a=s>0?lerp(.42*PI,-.25*PI,u):lerp(.58*PI,1.25*PI,u);
      const r=.92+.073*v-.095*sin(PI*u)*(1-v);
      const p=shellPoint(a,r,false,.014+.013*v);
      return [p[0]+s*.013,p[1]-.036*v*u,p[2]+.014];
    };
    skin(f,5,24,seam,'#99a095','cloth');
    brush(f,Array.from({length:16},(_,i)=>seam(i/15,.93)),.008,ivory);
  }
  brush(f,[[-.25,.48,.269],[-.13,.31,.334],[.012,.071,.355],[.247,-.17,.226]],
    [.019,.022,.023,.017],umber);
  brush(f,[[.003,-.44,-.19],[.002,-.617,-.32],[-.018,-.692,-.42]], [.080,.055,.002],moss);
}

// Long, flattened swimming flippers curl around the stick. Sweeping the
// whole profile keeps the elbow and trailing edge connected at every angle.
function flipper(f,s,back=false){
  const leading=pointCurve((back?[[.014,.102,.056],[.082,.003,-.025],[.192,-.082,-.095],
    [.322,-.178,-.227],[.366,-.2,-.30]]:[[.00,.058,-.034],[.147,-.043,.001],
    [.266,-.04,.117],[.391,.009,.247],[.443,.052,.370]]).map(([x,y,z])=>[s*x,y,z]));
  const trailing=pointCurve((back?[[.01,-.041,.021],[.02,-.136,-.061],[.082,-.195,-.139],
    [.239,-.226,-.243],[.366,-.2,-.30]]:[[.002,-.131,-.081],[.099,-.213,-.046],
    [.218,-.176,.028],[.314,-.10,.206],[.443,.052,.370]]).map(([x,y,z])=>[s*x,y,z]));
  const point=(u,a,lift=0)=>{
    const A=leading(u),B=trailing(u),toward=(1+cos(a))*.5;
    const swell=(.029+.059*(1-u))*Math.sqrt(1-u)*sin(a);
    return [lerp(B[0],A[0],toward)+s*swell,lerp(B[1],A[1],toward)-.21*swell,
      lerp(B[2],A[2],toward)+swell+lift];
  };
  skin(f,25,18,(u,v)=>point(v,u*tau),moss,'paper',s<0,true);
  for(let i=0;i<6;i++){
    const u=.17+i*.11;
    brush(f,[point(u,.69,.006),point(u+.027,1.24,.006),point(u+.106,1.97,.006)],
      [.001,.006,.001],darker);
  }
  if(!back){
    const wrist=[s*.407,.018,.34];
    brush(f,[wrist,[s*.451,.043,.38],[s*.448,.071,.374],[s*.428,.078,.36]],
      [.040,.032,.020,.003],ivory);
  }
}
function turtle() {
  const rigs=[part('turtle-shell',[0,.85,-.14],turtleShell),turtleHead()];
  for(const s of [-1,1]){
    rigs.push(part(s<0?'turtle-left':'turtle-right',[s*.34,1.02,.084],f=>{
      flipper(f,s);
      brush(f,[[s*.415,-.061,.37],[s*.43,.28,.50]],[.021,.014],umber);
      f.oval([s*.433,.303,.507],[.042,.069,.045],PAPER,[-.39,0,0]);
    }));
    rigs.push(part(s<0?'turtle-paddle-l':'turtle-paddle-r',[s*.218,.437,-.22],f=>flipper(f,s,true)));
  }
  rigs.push(part('turtle-drum',[0,.835,.47],f=>{
    const shellRadius=profile([[0,.272],[.08,.256],[.23,.213],[.52,.202],[.76,.217],[.92,.265],[1,.277]]);
    const barrel=(u,v,extra=0)=>{
      const a=tau*u,r=shellRadius(v)[0]+extra;
      return [r*cos(a),r*sin(a),lerp(-.008,.29,v)];
    };
    skin(f,15,36,barrel,'#93715e','paper',false,true);
    for(const z of [-.008,.29]){
      const sign=z>0?1:-1;
      skin(f,5,42,(u,v)=>{
        const a=tau*u,r=.284*v;
        return [r*cos(a),r*sin(a),z+sign*(.012+.006*(1-v*v))];
      },ivory);
      for(const [r,w,color] of [[.283,.011,SOOT],[.255,.0028,'#978a70']]){
        brush(f,Array.from({length:39},(_,i)=>[r*cos(tau*i/38),r*sin(tau*i/38),z+sign*.014]),w,color);
      }
    }
    for(let j=0;j<12;j++){
      const a=j/12,b=a+.032;
      const lacing=[barrel(a,.99,.015),barrel(lerp(a,b,.5),.78,.033),
        barrel(b,.51,.029),barrel(lerp(b,a+1/12,.55),.22,.028),barrel(a+1/12,.015,.012)];
      brush(f,lacing,[.009,.007,.008,.006,.008],j%2?WARM:'#b6a37e');
    }
    // Mitsudomoe painted inside the playing rim, each comma thinning into
    // a brush tip. Keep the centre open between the three spiralling heads.
    for(let i=0;i<3;i++){
      const a=tau*i/3+.2;
      const path=[[.011,.079],[.048,.091],[.086,.063],[.109,.018],[.098,-.042],[.082,-.071]];
      brush(f,path.map(([x,y])=>[x*cos(a)-y*sin(a),x*sin(a)+y*cos(a),.313]),
        [.009,.030,.027,.014,.006,.001],SOOT);
    }
  }));
  return rigs;
}
const armRoot=i=>[sin(tau*i/8+.18)*.205,.843,cos(tau*i/8+.18)*.16];
const writingHand=armRoot(1), paperHand=armRoot(7);
const paperCorners=[[-.76,-.22,.42],[-.26,-.06,.48],[-.20,-.36,.58],[-.65,-.49,.55]];
function paperPoint(col,row,lift=0) {
  const [a,b,c,d]=paperCorners;
  const curl=.029*sin(PI*col)*sin(PI*row)+.047*(1-row)**3*(1-col)**3;
  return a.map((v,i)=>lerp(lerp(v,b[i],col),lerp(d[i],c[i],col),row)+(i===2?curl+lift:0));
}
const writing= [
  [[.72,.20],[.77,.26],[.74,.38],[.72,.54],[.65,.65]],
  [[.59,.32],[.50,.43],[.58,.41],[.58,.56],[.48,.68]],
  [[.39,.28],[.42,.37],[.33,.52],[.32,.64],[.23,.68]],
].map(line=>pointCurve(line.map(([col,row])=>paperPoint(col,row,.008))));
const writtenPoint=(line,u)=>writing[line](u);

const octopusProfile=profile([
  // Stance rises from a webbed skirt, pinches behind the eyes, and
  // falls to the scribe's left at the crown of the mantle.
  [-.185,.135,.12,0,.044],[-.115,.302,.255,.006,.051],[-.018,.357,.294,.012,.069],
  [.119,.343,.318,.019,.067],[.207,.304,.292,.011,.024],[.292,.28,.275,-.002,-.026],
  [.405,.314,.338,-.023,-.085],[.57,.377,.362,-.055,-.138],[.73,.36,.321,-.095,-.187],
  [.864,.285,.23,-.141,-.229],[.93,.177,.156,-.169,-.247],[.978,.058,.047,-.201,-.274],
  [.984,.002,.002,-.21,-.281],
]);
function octopusPoint(y,a,lift=0) {
  const [w,d,x,z]=octopusProfile(y);
  const web=Math.max(0,1-(y+.185)/.32),lobe=(1+cos(8*(a-.18)))*.5;
  const flute=1+web*web*(.49+.27*lobe);
  const brow=Math.exp(-Math.pow((y-.12)/.10,2))*cos(3*a+.13)*.010;
  return [x+sin(a)*(w*flute+lift),y+.013*sin(2*a+.5)*sin((y+.18)*PI)-.156*web*web*lobe,
    z+cos(a)*(d*flute+brow+lift)];
}
function octopusMantle(f){
  skin(f,46,48,(u,v)=>octopusPoint(lerp(-.185,.984,v),u*tau-PI),'#fffaf1','mantle',false,true);
  for(const s of [-1,1]){
    const on=(y,a,lift=.005)=>octopusPoint(y,a*s,lift);
    // A low, hooded eye with a horizontal bar of ink, seen in profile as
    // well as from the brush end of the desk.
    eye(f,(u,v,lift)=>on(.14+.083*v,.83+.36*u,lift),-1,true);
    const arch=[[.164,.36],[.203,.52],[.223,.81],[.212,1.02],[.171,1.28]];
    brush(f,arch.map(([y,a])=>on(y,a)),[.001,.010,.017,.010,.001],INK);
    brush(f,[[.191,1.19],[.16,1.39],[.107,1.47]].map(([y,a])=>on(y,a)),[.001,.008,.002],darker);
    brush(f,[[.029,1.15],[.009,1.29],[-.034,1.42]].map(([y,a])=>on(y,a)),[.001,.007,.001],darker);
    // A few incomplete pen strokes turn the nape without striping the face.
    for(let j=0;j<3;j++){
      const y=.49+j*.12,a=1.8+j*.17;
      brush(f,[on(y,a),on(y+.045,a+.07),on(y+.093,a+.12)],[.001,.0038,.0007],wash);
    }
  }
  // The near side of the siphon opens into a rolled lip. The inner passage
  // bends back into the cheek so its rim remains open even at three quarters.
  const axis=pointCurve([[.11,-.057,.204],[.148,-.072,.332],[.187,-.065,.395],
    [.231,-.016,.432],[.26,.033,.464]]);
  const sizes=profile([[0,.129],[.39,.106],[.74,.074],[.90,.082],[1,.086]]);
  const circle=(u,v,inset=0)=>{
    const p=axis(v),r=sizes(v)[0]-inset,a=u*tau;
    return [p[0]+r*.87*cos(a)-.30*r*sin(a),p[1]+r*.73*sin(a),p[2]-.49*r*cos(a)-.58*r*sin(a)];
  };
  skin(f,17,24,(u,v)=>circle(u,v),ivory,'paper',false,true);
  skin(f,4,24,(u,v)=>circle(u,1,.031*v),darker,'paper',false,true);
  skin(f,7,24,(u,v)=>circle(u,.57+.43*v,.032),SOOT,'paper',true,true);
  // Tenugui knots and tails are cut on the bias across the reclining mantle.
  const sash=(u,v)=>{
    const a=u*tau-PI,y=.525+.079*v+.071*sin(a-.32)+.016*sin(2*a);
    return octopusPoint(y,a,.007+.014*sin(PI*v));
  };
  skin(f,7,44,sash,'#9da198','cloth',false,true);
  brush(f,Array.from({length:43},(_,i)=>sash(i/42,.14)),.007,ivory);
  const p=sash(.228,.48);
  for(const s of [-1,1]){
    const spine=pointCurve([p,[p[0]-.074,p[1]+s*.052,p[2]-.034],
      [p[0]-.149,p[1]-.088+s*.052,p[2]-.105],[p[0]-.132+s*.054,p[1]-.205+s*.041,p[2]-.194]]);
    skin(f,4,16,(u,v)=>{
      const q=spine(u),w=.056*(1-.66*u)*sin(PI*(.06+.9*u));
      return [q[0]+w*(v-.5),q[1]+.024*sin(PI*v),q[2]+1.32*w*(v-.5)];
    },s<0?'#b5b5a6':'#868b7e');
  }
}

const armGestures=[
  [[0,0,0],[.06,-.18,.09],[.08,-.33,.26],[.015,-.49,.49],[-.108,-.51,.608],[-.156,-.42,.628],[-.114,-.344,.611],[-.052,-.343,.57]],
  [[0,0,0],[.16,-.13,.112],[.315,-.097,.206],[.439,.013,.194],[.479,.187,.123],[.432,.255,.118],[.369,.235,.164],[.36,.17,.189]],
  [[0,0,0],[.211,-.177,-.035],[.381,-.275,-.074],[.574,-.272,-.106],[.707,-.196,-.093],[.729,-.077,-.051],[.66,-.013,-.028],[.597,-.055,-.035]],
  [[0,0,0],[.153,-.194,-.133],[.29,-.433,-.233],[.425,-.596,-.31],[.552,-.611,-.315],[.631,-.543,-.281],[.616,-.449,-.216]],
  [[0,0,0],[-.042,-.205,-.186],[-.118,-.469,-.322],[-.114,-.591,-.48],[-.023,-.584,-.592],[.038,-.511,-.59],[.029,-.463,-.534]],
  [[0,0,0],[-.146,-.219,-.126],[-.301,-.364,-.265],[-.521,-.375,-.413],[-.618,-.265,-.431],[-.591,-.17,-.399],[-.506,-.17,-.368]],
  [[0,0,0],[-.189,-.217,-.013],[-.311,-.451,.045],[-.415,-.621,.14],[-.577,-.649,.235],[-.701,-.585,.218],[-.739,-.478,.158],[-.683,-.445,.132]],
  [[0,0,0],[-.142,-.173,.109],[-.308,-.264,.267],[-.448,-.259,.38],[-.478,-.181,.43],[-.437,-.145,.47],[-.396,-.151,.467]],
];
function sculptArm(f,index) {
  const curve=new THREE.CatmullRomCurve3(armGestures[index].map(p=>new THREE.Vector3(...p)));
  const steps=36,frames=curve.computeFrenetFrames(steps,false);
  // Carry the softer oral face continuously around the hooked tip. This
  // parallel-transported frame also orients the walls of every suction cup.
  const oral=new THREE.Vector3(.14,-.74,.78).normalize();
  const start=Math.atan2(oral.dot(frames.binormals[0]),oral.dot(frames.normals[0]));
  function frame(t){
    const k=Math.min(steps-1,Math.floor(t*steps)),frac=t*steps-k;
    const n=frames.normals[k].clone().lerp(frames.normals[k+1],frac).normalize();
    const b=frames.binormals[k].clone().lerp(frames.binormals[k+1],frac).normalize();
    const a=start+.52*sin(t*PI)+.43*t*(index%2?1:-1);
    return {p:curve.getPointAt(t),n:n.clone().multiplyScalar(cos(a)).addScaledVector(b,sin(a)),
      b:b.multiplyScalar(cos(a)).addScaledVector(n,-sin(a)),r:.146*(.014+.986*(1-t)**.88)};
  }
  function flesh(q,a,lift=0){
    return q.p.clone().addScaledVector(q.n,(q.r*.86+lift)*cos(a)).addScaledVector(q.b,(q.r*1.10+lift)*sin(a));
  }
  skin(f,steps,16,(u,t)=>{
    const p=flesh(frame(t),tau*u);
    return [p.x,p.y,p.z,.14+.70*u,.33+.38*t+.11*sin(index*1.13)];
  },'#e7dfcd','mantle',false,true);
  // A lobed strip of pale oral skin, and two staggered ranks of recessed cups.
  skin(f,steps,9,(u,t)=>flesh(frame(t),lerp(-1.06,1.06,u),.0018).toArray(),'#e2d8c1');
  for(const s of [-1,1])for(let j=0;j<8;j++){
    const t=.16+j*.093+(s<0?.018:0),q=frame(t),a=s*.56,base=flesh(q,a,.0016);
    const tangent=curve.getTangentAt(t),normal=q.n.clone().multiplyScalar(cos(a)).addScaledVector(q.b,sin(a)).normalize();
    const across=new THREE.Vector3().crossVectors(tangent,normal).normalize(),r=q.r*.35;
    const ring=(u,radius,h)=>base.clone().addScaledVector(normal,r*h)
      .addScaledVector(tangent,r*radius*cos(tau*u)).addScaledVector(across,r*radius*.90*sin(tau*u)).toArray();
    skin(f,3,10,(u,v)=>ring(u,lerp(1,.45,v),.11+.17*sin(PI*v)),'#f0e5ca');
    skin(f,2,10,(u,v)=>ring(u,lerp(.45,.006,v),.11*(1-v)),darker);
  }
}
function octopus() {
  const rigs=[part('octopus-mantle',[0,.86,0],octopusMantle)];
  for(let i=0;i<8;i++){
    const holdsBrush=i===1,holdsPaper=i===7;
    rigs.push(part('octopus-arm-'+i,armRoot(i),f=>{
      sculptArm(f,i);
      if(holdsBrush){
        f.stroke([[.41,.055,.17],[.37,.48,.165],[.32,.87,.14]],[.034,.039,.037],WARM);
        f.stroke([[.32,.865,.14],[.304,.934,.137]],.049,INK);
        f.stroke([[.301,.929,.137],[.282,1.015,.131],[.213,1.155,.135]],[.061,.041,.004],INK);
        f.stroke([[.41,.059,.17],[.417,-.07,.17]],[.033,.017],umber);
      }else if(holdsPaper){
        skin(f,11,16,(u,v)=>paperPoint(u,v),PAPER);
        for(const corner of [0,1]){
          brush(f,Array.from({length:9},(_,i)=>paperPoint(corner,i/8,.002)),.0024,darker);
          brush(f,Array.from({length:9},(_,i)=>paperPoint(i/8,corner,.002)),.0024,darker);
        }
        skin(f,2,3,(u,v)=>paperPoint(.115+.071*u,.70+.16*v,.003),RED);
      }
    }));
  }
  for(let line=0;line<3;line++){
    const start=writtenPoint(line,0);
    rigs.push(part('scribe-stroke-'+line,start.map((v,i)=>v+paperHand[i]),f=>{
      const path=Array.from({length:9},(_,i)=>writtenPoint(line,i/8).map((v,k)=>v-start[k]));
      f.stroke(path,[.001,.006,.008,.003,.005,.007,.005,.003,.001],INK,'paper',6);
    }));
  }
  return rigs;
}
function acknowledgement(){
  return part('letter',[0,1.76,.06],f=>{
    const sheet=[[-.17,-.10,.015],[.14,-.11,.021],[.18,.15,0],[-.13,.17,-.013]];
    fin(f,sheet,'#fff1d1',sheet[0],false);
    for(let j=0;j<2;j++)f.stroke([[.078-j*.068,.091,.018],[.069-j*.068,.057,.020],[.08-j*.068,.029,.026]],[.003,.011,.003],INK,'paper',6);
    f.oval([-.083,-.052,.025],[.027,.025,.006],RED);
  });
}
export function seaPortrait(type) {
  const portrait=new URL(`./assets/bestiary/ryugu-${type}.webp`,import.meta.url);
  if(type==='seaTurtle')portrait.search='v=ink-face-1';
  return portrait.href;
}
const rotationTo=(from,to)=>new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(...from).normalize(),new THREE.Vector3(...to).normalize());
const strikes={};
for(const side of [-1,1]) {
  const mallet=[side*.433,.303,.507];
  strikes[side]=[rotationTo(mallet,[side*.41,.50,.35]),rotationTo(mallet,[-side*.155,-.14,.683])];
}
const nib=new THREE.Vector3(.213,1.155,.135),nibDirection=nib.clone().normalize();
const scratchTip=new THREE.Vector3(),touchPaper=new THREE.Quaternion();
const readyBrush=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.18,0,.15));
function movement(rig,n,t,d) {
  const beat=n.beat,accent=n.gesture,answer=Math.min(1,(n.flash||0)*2.5),name=rig.name;
  d.position.fromArray(rig.pivot);d.scale.setScalar(1);d.rotation.set(0,0,0);
  if(name==='letter'){
    d.position.y+=.21*(1-answer);d.rotation.z=-.18+.08*sin(t*6);
    d.scale.setScalar(answer);
  }else if(name==='bream-tail'){
    d.rotation.y=.42*sin(beat*2.15)*(.56+.44*accent);
  }else if(name==='bream-fan'){
    d.rotation.z=-.12-(.21+.26*sin(beat))*accent-.25*answer;
    d.rotation.y=.21*sin(beat*.52);d.rotation.x=.15*cos(beat);
  }else if(name==='bream-fin'){
    d.rotation.z=.15+accent*.31*cos(beat);d.rotation.y=.30*sin(beat*1.8);
  }else if(name==='turtle-head'){
    d.rotation.x=.07+.14*cos(beat)+answer*.35;
    d.rotation.y=.23*sin(beat*.26);
  }else if(name==='turtle-left'||name==='turtle-right'){
    const s=name==='turtle-left'?-1:1;
    const strike=Math.pow(.5+.5*cos(beat+s*PI/2),3)*accent;
    const [raised,contact]=strikes[s];
    d.quaternion.copy(raised).slerp(contact,strike);
  }else if(name.startsWith('turtle-paddle')){
    d.rotation.x=.30*sin(beat*.6+(name.endsWith('l')?0:2.8));
  }else if(name==='octopus-mantle'){
    d.rotation.z=.06*sin(beat)+.12*answer;
    d.scale.set(.99+.022*sin(beat),1.01-.030*sin(beat),1);
  }else if(name==='octopus-arm-1' || name.startsWith('scribe-stroke')){
    // Descending each column of the sheet, the nib keeps its point on the
    // same ruled position as the growing ink. It lifts between characters.
    const phrase=((t+n.phase*.31)%7.4)/7.4;
    const work=THREE.MathUtils.clamp((phrase-.14)/.69*3,0,3);
    const line=Math.min(2,Math.floor(work)),progress=work-line;
    const stroke=THREE.MathUtils.smoothstep(progress,.12,.88);
    if(name.startsWith('scribe-stroke')){
      const written=Number(name.slice(-1));
      d.scale.setScalar(written<line?1:written===line?stroke:0);
    }else{
      const point=writtenPoint(line,stroke);
      scratchTip.fromArray(point);
      scratchTip.x+=paperHand[0]-writingHand[0];scratchTip.z+=paperHand[2]-writingHand[2];
      scratchTip.y+=.105*(1-Math.sin(PI*progress)**.35);
      const reach=scratchTip.length()/nib.length();
      touchPaper.setFromUnitVectors(nibDirection,scratchTip.normalize());
      const lean=THREE.MathUtils.smoothstep(phrase,.025,.14)*(1-THREE.MathUtils.smoothstep(phrase,.83,.97))*(1-.77*answer);
      d.quaternion.copy(readyBrush).slerp(touchPaper,lean);
      d.scale.setScalar(THREE.MathUtils.lerp(1,reach,lean));
    }
  }else if(name.startsWith('octopus-arm') && name!=='octopus-arm-7'){
    const i=Number(name.slice(-1));
    d.rotation.z=.16*sin(beat+i*1.1);d.rotation.x=.09*cos(beat*.81+i);d.rotation.y=.07*cos(beat+i*.6);
  }
}
export function createRyuguPerformers(scene) {
  const root=new THREE.Group();root.name='竜宮の舞楽と書会';scene.add(root);
  const rigs={},material=pigment(),base=new THREE.Object3D(),limb=new THREE.Object3D(),combined=new THREE.Matrix4(),pose={};
  for(const [kind,make] of Object.entries({bream,seaTurtle:turtle,octopus})) {
    rigs[kind]=[...make(),acknowledgement()].map(r=>{
      const mesh=new THREE.InstancedMesh(r.geometry,r.material||material,SEA_ENSEMBLES);
      mesh.name=kind+' / '+r.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled=false;mesh.count=0;root.add(mesh);
      return {...r,mesh};
    });
  }
  const counts={bream:0,seaTurtle:0,octopus:0};
  const frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),bounds=new THREE.Sphere();
  return (time,player,camera,nearbyNpcs)=>{
    root.visible=!!player.diveDepth;
    if(!root.visible)return;
    counts.bream=counts.seaTurtle=counts.octopus=0;
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    for(const resident of nearbyNpcs) {
      if(!resident.seaResident)continue;
      // During the portrait camera the live clock pauses. Advance a temporary
      // pose so a photographed musician continues to play without moving a hit volume.
      const n=Math.abs(resident.sampleTime-time)>.02 ? updateRyuguResident(Object.assign(pose,resident),time) : resident;
      const dx=wrapDelta(n.x-player.x),dz=wrapDelta(n.z-player.z),dy=n.y-player.y;
      if(dx*dx+dz*dz+dy*dy>68**2)continue;
      bounds.center.set(player.x+dx,n.y+.98*n.stature,player.z+dz);
      bounds.radius=1.62*n.stature;
      if(!frustum.intersectsSphere(bounds))continue;
      const index=counts[n.type]++,answer=Math.min(1,(n.flash||0)*2.5);
      base.position.set(player.x+dx,n.y,player.z+dz);
      base.rotation.set(n.type==='bream'?-.12+.075*sin(n.beat):.04*cos(n.beat*.61)+.10*answer,n.heading,
        n.type==='bream'?.115*sin(n.beat)*n.gesture:.041*sin(n.beat*.84));
      base.scale.setScalar(n.stature);base.updateMatrix();
      for(const r of rigs[n.type]){
        movement(r,n,time,limb);limb.updateMatrix();
        combined.multiplyMatrices(base.matrix,limb.matrix);r.mesh.setMatrixAt(index,combined);
      }
    }
    for(const [type,parts] of Object.entries(rigs)) for(const r of parts) {
      r.mesh.count=counts[type];r.mesh.visible=counts[type]>0;
      if(r.mesh.visible) r.mesh.instanceMatrix.needsUpdate=true;
    }
  };
}
