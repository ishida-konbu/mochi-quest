// These are the bathing installations themselves. All coordinates are in site
// metres above the spring datum, shared with their water, seats and footings.
import * as T from './vendor/three.module.min.js';
import { beam,stroke,surface,turned,wood,cedar,ink } from './pilgrim-roofcraft.js';
import { fittedPilgrimCraft } from './pilgrim-bath-reliefs.js';
import { sculpture } from './pilgrimage-pigment.js';
import { pilgrimPools,pilgrimPoolLip,caskSteps,caskTop,petalTop,dawnBeds,
  steamVaultHeight,steamRoom,inariFall,brineGate,winterRocks } from './pilgrim-bathing-plan.js';

const {PI,sin,cos,abs}=Math,tau=2*PI,ochre='#b9a07c',iron='#5a5548',mortar='#837e71';
const sample=(n,fn)=>Array.from({length:n},(_,i)=>fn(i/(n-1),i));
function band(s,x,y,z,r,w,h,tint){
  turned(s,tint,x,y,z,[[r,-h/2],[r+w,-h*.27],[r+w,h*.27],[r,h/2]],44);
}
function shallowFlume(s,path,half,depth,tint=wood){
  const curve=new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p)),false,'catmullrom',.30);
  const at=(u,v)=>{
    const c=curve.getPoint(u),t=curve.getTangent(u),length=Math.hypot(t.x,t.z);
    const w=(2*v-1)*half;
    return [c.x-t.z*w/length,c.y+.86*depth*(2*v-1)**2,c.z+t.x*w/length];
  };
  surface(s,tint,10,19,at);
  surface(s,'#665242',10,19,(u,v)=>{const [x,y,z]=at(u,v);return [x,y-.085,z];});
  for(const edge of [0,1])stroke(s,ochre,sample(19,u=>at(u,edge)),.040,22);
}
function stone(s,cx,cz,w,d,h,turn,seed,snow=false){
  const heights=[-.52,-.07,.18,.43,.66,.86,.96,1],radii=[.71,.99,1,.91,.89,.71,.54,.025];
  const clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep;
  // Follow the dip of a bed across a face. Both the break in the silhouette
  // and its painted seam take the same winding path round the stone.
  const dip=(a)=>.075*sin(a+.61*seed)+.049*cos(2*a-seed)+.016*sin(5*a+.46*seed);
  const bed=(a,v)=>v-dip(a)*sin(PI*v);
  const at=(t,v,lift=0)=>{
    const y=clamp(v*(heights.length-1),0,heights.length-1.00001),j=Math.floor(y),f=y-j;
    const a=t*tau,l=heights[j]+(heights[j+1]-heights[j])*f,b=bed(a,v);
    const angle=a+.083*sin(2*a+.3*seed)+.051*cos(5*a-seed);
    const bedding=.060*sin(16*PI*b+.59*seed)+.021*sin(37*PI*b-1.5*cos(a*3+seed));
    // The overhanging edge breaks at the end of a bed; the next bed rocks
    // back the other way. Small fractures cut smooth wedges out of the toe.
    const facet=.91+.107*cos(a*3+.29*seed)+.067*sin(5*a+seed)+.034*cos(8*a-.5*seed);
    let r=(radii[j]+(radii[j+1]-radii[j])*f)*(facet+bedding*sin(PI*v)**.65
      +.028*sin(15*a+seed+v*3)*sin(PI*v));
    r+=lift;
    const x=w*(r*cos(angle)+l*.19+.062*sin(1.4*seed)*sin(PI*v));
    const z=d*(r*sin(angle)+l*.13-.06*cos(seed)*sin(PI*v));
    const tilt=h*(.14*cos(a+seed*.43)+.033*cos(4*a-seed))*sin(PI*v);
    return [cx+x*cos(turn)+z*sin(turn),h*l+tilt,cz+z*cos(turn)-x*sin(turn)];
  };
  const damp=new T.Color('#475b58'),dry=new T.Color(snow?'#a2a598':'#a89980');
  const ironWash=new T.Color(snow?'#78857c':'#957552'),graphite=new T.Color('#46504c');
  const calcite=new T.Color('#d2c5a7'),lichen=new T.Color('#a1a27b');
  const ice=new T.Color('#aebfc1'),powder=new T.Color('#ecefe4'),paint=new T.Color();
  const skin=(u,v)=>{
    const a=u*tau,b=bed(a,v),fold=.50+.5*cos(2*a-.6*seed),
      grain=.31*sin(17*a+26*b+seed)+.24*cos(31*a-63*b)+.19*sin(12*a+87*b+.45*cos(a*9))
        +.16*sin(43*a+117*b)+.10*cos(59*a-51*b);
    const channel=.54+.31*cos(3*a+.65*sin(13*v+seed)+seed)+.14*cos(8*a+1.5*sin(9*v+seed));
    const wet=Math.min(1,.60*(1-smooth(v,.27,.67))+.65*smooth(channel,.59,.91)*(1-smooth(v,.62,.89)));
    paint.copy(dry).lerp(damp,wet).lerp(ironWash,.26+.19*fold+.10*grain);
    const seam=.5+.5*cos(16*PI*b+.59*seed+.39*sin(a*6+v));
    paint.lerp(graphite,.33*smooth(seam,.69,.99));
    const vein=.5+.5*cos(16*PI*b+.59*seed-1.1+.28*sin(a*5.0+seed));
    paint.lerp(calcite,.38*smooth(vein,.85,.99)*smooth(cos(a*3+seed)+grain,-.36,.65));
    const moss=smooth(cos(a*4+.8*seed)+.65*sin(v*35)+grain,.86,1.49);
    paint.lerp(lichen,moss*.55*smooth(v,.22,.48));
    const snowline=.74+.090*sin(a*2+seed)+.048*cos(a*6+.38*seed);
    if(snow && v>snowline-.016){
      paint.lerp(ice,smooth(v,snowline-.016,snowline+.017)).lerp(powder,smooth(v,snowline+.017,snowline+.058));
    }
    return [paint,.94+.17*grain+.07*sin(19*a-31*b)*sin(PI*v)];
  };
  surface(s,'#fff',54,78,at,skin);

  // A weathered seam interrupts itself at joints. Its dark undercut lies
  // just below a thin, broken line of mineral deposit on the projecting lip.
  for(let k=0;k<9;k++){
    const start=(.143*k+.081*seed)%1,span=.13+.105*(.5+.5*sin(k*1.68+seed));
    const v0=.29+.055*(k%7);
    const seamAt=(q,dv,lift)=>{
      const t=start+q*span,a=t*tau;
      return at(t,v0+dip(a)*sin(PI*v0)+.007*sin(9*a+seed+k)+dv,lift);
    };
    surface(s,k%4===0?'#887d66':'#677268',2,28,(q,b)=>seamAt(q,-.016*(1-b)*sin(PI*q),.008+.008*b));
    if(k%3!==2){
      const points=sample(13,q=>seamAt(q,.006*sin(PI*q),.018));
      stroke(s,k%3?'#b1ab8e':'#c1b799',points,points.map((_,j)=>.001+.011*sin(j*PI/12)),15);
    }
  }
  // Short, forked shrinkage joints cross a few beds, then turn into them.
  for(let k=0;k<5;k++){
    const start=(k*.213+.047*seed)%1,base=.30+.069*(k%4);
    const fracture=(t,branch=0)=>at(start+.018*sin(t*5+seed+k)+.009*sin(t*13+k)+branch,
      base+.26*t-.017*sin(t*5+k),.011);
    const pts=sample(8,t=>fracture(t));
    stroke(s,graphite,pts,[.003,.010,.014,.009,.013,.009,.006,.001],12);
    stroke(s,'#626759',sample(5,t=>fracture(.58+.24*t,.028*t*t)),[.007,.008,.006,.003,.001],7);
  }
  if(snow)for(let k=0;k<3;k++){
    // Snow only lodges on individual windward shelves. Each lip has a
    // rolled, blue-grey underside and a feathered top that seals to the rock.
    const start=.07+.229*k+.031*seed,span=.13+.036*cos(seed+k),line=.51+.098*k;
    const ledge=(q,b)=>{
      const t=start+span*q,a=t*tau,margin=sin(PI*q)**.69;
      const v=line+dip(a)*sin(PI*line)+.017*sin(a*5+seed);
      const point=at(t,v+margin*(b*.049-.008),margin*.050*sin(PI*b)+.013);
      point[1]+=h*margin*(.013+.011*sin(q*8+seed))*(1-b);
      return point;
    };
    surface(s,'#fff',5,25,ledge,(u,v)=>[v<.22?'#aabbbc':'#e4e9de',.96+.043*cos(18*u+seed)]);
  }
}
function casks(s,site){
  const tubs=pilgrimPools(site);
  for(const p of tubs){
    const y=p.y,x=p.u,r=p.rx,tint=x<0?'#b6956b':'#a37b58',n=x<0?27:31;
    const stave=(a,t,inner=false)=>{
      const h=-.26+(caskTop(p,a)+.26)*t;
      const rr=inner?r-.14*(1-t):r+.165+.055*sin(t*PI)-.13*(1-t);
      return [x+rr*cos(a),h,p.v+rr*sin(a)];
    };
    for(let i=0;i<n;i++){
      const l=(i+.020)*tau/n,end=(i+.983)*tau/n,age=.82+.24*(.5+.5*cos(i*3.74));
      surface(s,'#fff',8,3,(u,v)=>stave(l+(end-l)*u,v),()=>[tint,age]);
      surface(s,'#896b4b',5,3,(u,v)=>stave(l+(end-l)*u,v,true));
      surface(s,'#c9ab81',2,4,(u,v)=>{
        const a=l+(end-l)*u,p1=stave(a,1),p2=stave(a,1,true);return p1.map((q,j)=>q+(p2[j]-q)*v);
      });
      if(i%2===0){
        const points=sample(8,t=>{const a=l+(end-l)*(.42+.07*sin(t*8+i)),[u,h,v]=stave(a,.21+.65*t);
          return [u+.006*cos(a),h,v+.006*sin(a)];});
        stroke(s,'#866a4d',points,[.002,.006,.008,.007,.010,.005,.003,.001],9);
      }
    }
    for(const [t,thick] of [[.25,.054],[.64,.060],[.89,.042]]){
      const ropePts=sample(n*2+1,frac=>{const a=frac*tau,[u,h,v]=stave(a,t);
        return [u+.016*cos(a),h,v+.016*sin(a)];});
      stroke(s,x<0?'#857657':iron,ropePts,thick,ropePts.length,6);
      if(t>.88){
        const [a,h,c]=ropePts[Math.round(n*1.6)];
        s.ball('#bdab80',a,h,c,.068,.058,.069);
      }
    }
    for(const [i,step] of caskSteps(p).entries()){
      s.box(i<3?'#937355':'#827b59',step.u,step.h-.083,step.v,step.w,.166,step.d);
      s.box(ochre,step.u,step.h+.002,step.v+.172,step.w*.95,.012,.035);
      for(const side of [-1,1])s.post(cedar,step.u+side*.48,(step.h-.21)/2,step.v,.072,Math.max(.12,step.h+.25),.071);
    }
    const grip=p.u+(x<0?-1:1)*.67;
    for(const v of [r-.09,r+.85])s.post(wood,grip,y+.26,v,.056,1.08,.056);
    stroke(s,wood,[[grip,y+.81,r-.09],[grip,y+.85,r+.18],[grip,y+.72,r+.62],[grip,y+.60,r+.85]],.061,12);
  }
  // One elevated source fills the flower barrel; an open-necked tube then
  // pours from the upper barrel into the lower, fragrant fruit bath.
  const bx=-2.30,bz=-2.04;
  turned(s,'#b28d61',bx,0,bz,[[.41,-.12],[.56,.07],[.58,.45],[.39,.83],[.24,1.03],
    [.28,1.18],[.40,1.28],[.39,1.51],[.24,1.67],[.18,1.69],[.177,1.58]],28);
  shallowFlume(s,[[bx,1.25,bz],[bx+.04,1.22,bz+.30],[bx+.09,1.17,bz+.65],[bx+.16,1.15,bz+.83]],.16,.099);
  shallowFlume(s,[[-.70,.65,-.19],[-.28,.635,-.175],[.04,.61,-.14],[.39,.56,-.10]],.132,.116);
  for(const u of [-.58,.24]){
    s.post(cedar,u,.314,-.14,.075,.68,.074);
    band(s,u,.56,-.14,.076,.010,.041,ochre);
  }
  for(let j=0;j<4;j++){
    const a=3.83+.28*j,u=2.04+1.75*cos(a),v=1.75*sin(a);
    stroke(s,'#b6a37b',[[u,.60,v],[u-.02,.45,v+.04],[u-.06,.34,v+.08]],[.013,.010,.009],7);
    s.ball(j%2?'#c9a080':'#cb927e',u-.06,.33,v+.08,.116,.104,.12);
  }
}
function lotusPools(s,site){
  for(const pool of pilgrimPools(site)){
    const main=pool.id==='lotus-heart',n=main?8:6,tint=main?'#baab93':'#b8a396';
    function section(a,t){
      const l=pilgrimPoolLip(pool,a),h=petalTop(pool,a);
      const offset=(main?.34:.20)*sin(t*PI*.83)+.06;
      return [pool.u+(pool.rx*l+offset)*cos(a),-.17+(h+.17)*t,pool.v+(pool.rz*l+offset)*sin(a)];
    }
    for(let k=0;k<n;k++){
      const mid=k*tau/n,half=PI/n;
      surface(s,'#fff',13,19,(u,v)=>{
        const a=mid+(2*u-1)*half,p=section(a,v),bulge=.086*sin(PI*u)*sin(PI*v);
        return [p[0]+cos(a)*bulge,p[1],p[2]+sin(a)*bulge];
      },(u,v)=>[tint,.84+.15*sin(PI*u)+.12*v]);
      surface(s,'#aaa18a',8,15,(u,v)=>{
        const a=mid+(2*u-1)*half,p=section(a,v);
        const lathe=(main?.18:.12)+.11*(1-v);
        return [p[0]-lathe*cos(a),p[1]-.022,p[2]-lathe*sin(a)];
      });
      for(const u of [.12,.31,.50,.69,.88]){
        const run=sample(9,t=>{const q=.35+(u-.35)*(.20+.80*t),a=mid+(2*q-1)*half,
          p=section(a,.15+.81*t),bulge=.088*sin(PI*q)*sin(PI*(.15+.81*t));
          return [p[0]+cos(a)*bulge,p[1],p[2]+sin(a)*bulge];});
        stroke(s,u===.5?'#d5c5a8':'#a2957c',run,u===.5?.023:.013,12);
      }
      const crest=sample(17,u=>section(mid+(2*u-1)*half,1));
      stroke(s,'#d3bea2',crest,.060,20,7);
    }
    const base=sample(49,t=>{
      const a=t*tau,l=pilgrimPoolLip(pool,a),r=.14;
      const h= Math.max(-.09,Math.min(.075,petalTop(pool,a)-.13));
      return [pool.u+(pool.rx*l+r)*cos(a),h,pool.v+(pool.rz*l+r)*sin(a)];
    });
    stroke(s,main?'#898d74':'#92977f',base,.091,55,7);
  }
  for(const side of [-1,1]){
    shallowFlume(s,[[side*2.12,.17,-.29],[side*2.34,.155,-.29],[side*2.62,.135,-.30],[side*2.80,.115,-.30]],.145,.10,'#92917b');
  }
  // A lotus bud on the axis has a real cast opening under its curled outer
  // sepal. Its stream is divided between the high heart and the lower cups.
  turned(s,'#879179',0,-.10,-2.89,[[.32,0],[.42,.13],[.30,.26],[.18,.43],[.13,.92],
    [.18,1.01],[.26,1.18],[.297,1.46],[.235,1.63],[.080,1.76],[.016,1.78]],32);
  for(let k=0;k<7;k++){
    const a=k*tau/7;
    surface(s,'#b1a18b',9,9,(u,v)=>{
      const w=.11*sin(PI*v)*(2*u-1),r=.15+.27*sin(v*PI*.75);
      return [r*cos(a)-w*sin(a),.86+.56*v+.26*v*v,-2.89+r*sin(a)+w*cos(a)];
    });
  }
  shallowFlume(s,[[0,1.20,-2.72],[0,1.18,-2.46],[0,1.16,-2.20]],.135,.07,'#9c9783');
}
function dawnRecliners(s){
  const granite=['#a29a83','#aaa18d','#969382'];
  for(const [j,u] of dawnBeds.entries()){
    // Deep channels between warmed slabs carry the spring down the back and
    // out at the feet. From the bath one can look straight out at sunrise.
    const profile=v=>-.24+.06*cos(PI*((v+.08)/1.70))+.24*Math.exp(-(((v+1.32)/.30)**2));
    const bed=(t,q)=>{
      const v=1.88*(2*t-1),edge=(q*2-1)*(.69+.07*cos(t*PI));
      return [u+edge,profile(v)+.047*(2*q-1)**2,v];
    };
    surface(s,granite[j],16,34,(q,t)=>bed(t,q));
    for(const side of [0,1]){
      const pts=sample(32,t=>{
        const [x,y,z]=bed(t,side);
        // The warmed long sides stand an inch proud of the water; the middle
        // stays flooded against the bather's back.
        return [x,.022+.035*cos(t*PI)-.098*(2*t-1)**6,z];
      });
      stroke(s,'#a8a28c',pts,.072,35,7);
      stroke(s,'#c0b499',pts.map(([x,y,z])=>[x+(side?-.021:.021),y+.038,z]),.017,35);
      for(let k=0;k<7;k++){
        const t=.1+.12*k,[x,y,z]=pts[Math.round(t*31)];
        s.ball('#7e806e',x,y+.066,z,.046,.013,.077);
      }
    }
    s.add(new T.CapsuleGeometry(.196,.89,5,14),granite[(j+1)%3],u,.06,-1.34,1,.95,1,0,0,PI/2);
    for(let k=0;k<4;k++){
      const v=-.78+.43*k;
      stroke(s,'#c0b799',[[u-.60,profile(v)+.045,v],[u,profile(v)+.017,v+.061],
        [u+.59,profile(v)+.047,v+.01]],.018,7);
    }
  }
}
function headfall(s){
  const rocks=[[-.81,-2.66,1.07,.69,2.41,.18],[.39,-2.96,.59,.50,2.83,-.16],
    [-1.86,-2.35,.63,.71,1.36,.40],[-1.02,-1.97,.61,.41,.80,.02]];
  for(const [j,[x,z,w,d,h,t]] of rocks.entries())stone(s,x,z,w,d,h,t,j*2.36+.62);
  const path=[[-.37,2.98,-3.20],[-.32,2.98,-2.53],[-.30,2.95,-1.91],
    [-.23,2.91,-1.40],[-.11,2.90,-1.05],[0,inariFall.top,-.78]];
  shallowFlume(s,path,.395,.166,'#9f8565');
  for(const [u,v] of [[-.32,-2.47],[-.21,-1.43]]){
    for(const side of [-1,1]){
      beam(s,cedar,[u+side*.32,1.19,v-.48],[u+side*.32,2.84,v],.09,.10);
      const p=[u+side*.38,2.98,v];s.ball(iron,...p,.045,.054,.043);
    }
    s.box(cedar,u,2.79,v,.93,.12,.17);
  }
  for(const side of [-1,1]){
    stroke(s,'#93785a',[[side*.70,-.32,-.35],[side*.74,.24,-.56],[side*.73,.45,-.82]],
      [.045,.048,.042],6);
  }
}
function tideLock(s){
  const x=brineGate.u,z=-1.72;
  for(const side of [-1,1]){
    const u=x+side*.79;
    s.box('#83705a',u,.27,z+.16,.39,.81,.48);
    s.box(cedar,u,1.28,z,.22,2.55,.29);
    for(const y of [.25,.52,1.88,2.37])s.box(iron,u,y,z,.229,.077,.30);
    s.box(wood,u+side*.05,1.16,z+.165,.12,1.69,.103);
    s.box('#786952',u,.51,z-.59,.21,.99,1.26);
  }
  s.box('#8f8064',x,.562,z-.68,1.73,.16,1.36);
  s.box(wood,x,2.42,z,1.96,.20,.31);
  for(const side of [-1,1]){
    beam(s,iron,[x+side*.20,2.50,z-.03],[x+side*.20,2.72,z+.05],.05,.05);
    s.post('#8f7659',x+side*.20,2.70,z+.08,.103,.11,.103,0,0,PI/2);
  }
  const gauge=x-1.08;
  s.box('#bcae8b',gauge,.93,z+.18,.15,2.26,.11);
  for(let j=0;j<16;j++)s.box(j%4?'#716b56':'#9b5942',gauge-(j%4?.033:.012),.08+.115*j,z+.242,j%4?.06:.12,.019,.010);
}
export function lockLeaf(){
  const s=sculpture();
  for(let i=0;i<5;i++){
    const y=.12+.181*i;
    s.box(i%2?'#866b4f':'#987a57',0,y,0,1.52,.176,.147);
    for(const x of [-.53,.53])s.post(iron,x,y,.086,.024,.019,.024,PI/2);
  }
  for(const u of [-.53,.53])s.box(iron,u,.48,.081,.071,.90,.040);
  stroke(s,'#a28d68',[[-.22,.92,0],[-.22,1.01,0],[.22,1.01,0],[.22,.92,0]],.033,8);
  return s.finish();
}
// A pottery steam chamber: firebrick barrel vault, a potter's flue, radiant
// stove and latticed floor. The upper shell can be lifted from the view when
// the camera is above a player who has actually passed through the arch.
function steamingKiln(s,cover){
  const c=steamRoom,back=c.v-c.d/2,front=c.v+c.d/2,half=c.w/2;
  const brick=['#a3795c','#a88063','#9d765d','#ab8668','#99765b'];
  for(let i=0;i<24;i++){
    const x=(i-11.5)*.22;
    s.box(i%3?'#8b7155':'#9d805f',x,.02,c.v,.185,.055,c.d-.19);
  }
  for(const v of [-1.40,.65])s.box('#695b47',0,-.015,v,c.w-.24,.062,.104);
  for(const side of [-1,1]){
    const u=side*c.seatU;
    for(let i=0;i<4;i++)s.box(i%2?'#b1946e':'#a38462',u+(i-1.5)*.166,c.seatTop-.038,c.seatV,.143,.075,2.28);
    for(const z of [-.91,.91]){
      s.box(cedar,u,.21,c.seatV+z,.51,.34,.15);
      s.box(wood,u,.31,c.seatV+z,.65,.09,.22);
    }
    for(let j=0;j<10;j++){
      const z=c.v+(j-4.5)*.44;
      s.box('#96846a',side*(half-.166),.36,z,.18,.53,.39);
    }
    for(let row=0;row<9;row++)for(let j=0;j<10;j++){
      const cell=c.d/(row%2?10.5:10),z=back+(j+.53+.31*(row%2))*cell;
      const tint=brick[(j*7+row*3+(side<0?1:0))%brick.length];
      // The deep reveal remains legible inside the cutaway. The roof and
      // upper half of the entrance stay whole when the traveller is outside.
      const layer=row<4 || z<c.v-.11?s:cover;
      layer.box(tint,side*(half-.014),.148+.282*row,z,.32,.273,cell-.016);
    }
  }
  s.box('#88715f',0,1.29,back,c.w,2.57,.231);
  for(let row=0;row<8;row++)for(let j=0;j<11;j++){
    const step=c.w/11,u=-half+(j+.5)*step;
    s.box(brick[(j+4*row)%5],u, .18+.304*row,back+.105,step-.015,.289,.095);
  }
  const inner=.5*c.door,wing=half-inner,spring=1.53;
  for(const side of [-1,1]){
    for(let row=0;row<8;row++)for(let j=0;j<3;j++){
      const width=wing/3,u=side*(inner+(j+.5)*width);
      const layer=row<4?s:cover;
      layer.box(brick[(j+2*row)%5],u,.16+row*.306,front,width-.014,.299,.31);
    }
    for(let j=0;j<5;j++){
      const h=spring/5;
      s.box(j%2?'#b38d68':'#a37d5e',side*(inner+.106),(j+.5)*h,front+.067,.21,h-.012,.37);
    }
  }
  // The wedge-shaped voussoirs have front, back and radial reveals. The
  // crown and the stepped clay vault are open on the underside.
  const archR=inner,outerR=archR+.244;
  const arch=(a,r,z)=>[r*cos(a),spring+r*sin(a),z];
  for(let j=0;j<17;j++){
    const lo=PI*(j+.022)/17,hi=PI*(j+.978)/17;
    for(const z of [front-.21,front+.25]){
      surface(cover,brick[(j*3)%5],3,4,(u,v)=>arch(lo+(hi-lo)*u,archR+(outerR-archR)*v,z));
    }
    surface(cover,'#9b7157',3,4,(u,v)=>arch(lo+(hi-lo)*u,archR,front-.21+.46*v));
  }
  const at=(u,v,innerSkin=false)=>{
    const a=u*PI,x=(half+.14)*cos(a),z=back-.12+(c.d+.24)*v;
    const h=steamVaultHeight(cos(a),v)-(innerSkin?.25*sin(a)**.78:0);
    return [x,h,z];
  };
  // A continuous mortar bed ends the pinhole pattern that separate, thin
  // arch tiles made against the far gable. Firing tones follow real courses.
  const joints=(u,v)=>{
    const row=Math.min(15,Math.floor(u*16)),x=(u*16)%1,z=(v*9+.5*(row%2))%1;
    return Math.min(x,1-x,z,1-z);
  };
  surface(cover,'#fff',72,128,(u,v)=>{
    const a=u*PI,p=at(u,v),groove=.037*(1-Math.min(1,joints(u,v)*9));
    p[0]-=groove*cos(a);p[1]-=groove*sin(a);return p;
  },(u,v)=>{
    const row=Math.min(15,Math.floor(u*16)),run=Math.floor(v*9+.5*(row%2));
    const mortar=joints(u,v)<.045;
    return [mortar?'#88715c':brick[(row*7+run*3)%5],.88+.082*sin(PI*u)+.052*cos(v*11+row)];
  });
  surface(cover,'#a17d61',18,30,(u,v)=>at(u,v,true));
  for(const [v,z] of [[0,back-.12],[1,front+.12]]){
    surface(cover,'#a37b5e',8,32,(u,t)=>{
      const [x,h]=at(u,v);
      return [x,h*t+2.43*(1-t),z];
    });
  }
  // The vault is laid in concentric firebrick arches at its gable ends.
  // Courses radiate from the arched door and lighten at their cut faces.
  for(let row=0;row<4;row++){
    const mid=1.31+.246*row;
    for(let i=0;i<15;i++){
      const a=(i+.025)*PI/15,b=(i+.972)*PI/15;
      surface(cover,['#a48266','#a9896c','#96765d'][(i+row)%3],3,5,(u,v)=>{
        const h=a+(b-a)*u,r=mid+.214*v;
        return [r*cos(h),spring+.99*r*sin(h),front+.278+.019*row];
      });
    }
  }
  const vent=[[-.50,3.38],[-.24,3.50],[0,3.53],[.24,3.50],[.50,3.38]];
  for(const [u,h] of vent){
    cover.post('#786657',u,h,front+.235,.084,.116,.082,PI/2);
    cover.post('#514d43',u,h,front+.301,.055,.013,.054,PI/2);
  }
  for(const side of [-1,1]){
    const u=side*(half-.49);
    for(const y of [.44,1.67,2.26])cover.box('#b18f6c',u,y,front+.167,.76,.083,.11);
  }
  // A hollow pottery lantern crowns the oculus where wet vapour escapes.
  const roofY=3.85,ventZ=c.v-.64;
  turned(cover,'#775a49',0,roofY,ventZ,[[.55,0],[.59,.09],[.49,.14],[.40,.23],[.31,.38],[.32,.61],
    [.38,.65],[.40,.74],[.28,.74],[.27,.60]],30);
  cover.post('#494842',0,roofY+.53,ventZ,.27,.035,.27);
  // The dry steam bed is supplied by a bank of ceramic pipes behind a grate.
  const stoveZ=back+.61;
  for(let j=0;j<3;j++){
    const width=1.69-.110*j;
    s.box(j===0?'#796c59':'#766958',0,.13+.185*j,stoveZ,width,.17,.82-j*.039);
    for(let i=0;i<5;i++)s.box(i%2?'#94816a':'#8d7968',(i-2)*width/5,.137+.185*j,
      stoveZ+.404-j*.021,width/5-.019,.15,.063);
  }
  s.post('#514f42',0,.61,stoveZ,.77,.116,.371);
  for(const side of [-1,1]){
    stroke(s,'#6a6253',[[side*.63,.55,stoveZ],[side*.77,.69,stoveZ+.01],[side*.753,.79,stoveZ+.02],
      [side*.63,.82,stoveZ+.03]],.035,9);
  }
  for(let i=-3;i<=3;i++)s.box('#b48962',i*.151,.63,stoveZ+.356,.068,.066,.027);
  for(let k=0;k<11;k++){
    const a=k*2.40,r=.54*Math.sqrt(k/11);
    s.ball(k%3?'#746c60':'#8a7663',r*cos(a),.713+.102*sin(k*3),back+.62+.56*r*sin(a),
      .192+.033*sin(k),.129+.034*cos(k*2.1),.174,-.23*k,.42*k,-.26*k);
  }
  for(let j=0;j<6;j++){
    const x=(j-2.5)*.23;
    s.post('#8c6651',x,1.16,back+.165,.073,.17,.073,PI/2);
    s.post('#514b42',x,1.16,back+.262,.047,.018,.047,PI/2);
  }
  // Ladles and pierced clay vent hoods occupy the rear wall at a safe
  // distance behind the benches. Water hangs in drops at their lower lips.
  for(const side of [-1,1]){
    const u=side*1.72;
    s.box(cedar,u,1.85,back+.18,.71,.102,.13);
    for(let j=0;j<2;j++){
      const x=u+(j-.5)*.29;
      stroke(s,ochre,[[x,1.92,back+.24],[x,1.77,back+.27],[x+side*.08,1.48,back+.29]],.027);
      s.ball('#b3986f',x+side*.09,1.40,back+.30,.098,.122,.053,0,0,.18*side);
    }
    turned(s,'#937762',u,1.01,back+.30,[[.058,0],[.116,.014],[.136,.095],[.123,.17],[.077,.199]],15);
  }
  for(const side of [-1,1]){
    s.box('#c4ab83',side*(half-.32),1.94,c.v-.81,.09,.44,.29);
    for(const y of [1.73,1.91,2.16])s.box(ink,side*(half-.31),y,c.v-.81,.12,.025,.32);
  }

}
function snowShelf(s){
  for(const [i,[x,z,w,d,h,yaw]] of winterRocks.entries())stone(s,x,z,w,d,h,yaw,i*4.2+.54,true);
  const r=snowSourceRim;
  turned(s,'#877d65',r.x,r.y,r.z,[[.18,0],[.33,.023],[.36,.11],[.31,.17],[.24,.18],[.21,.109]],32);
  s.post('#66756b',r.x,r.y+.121,r.z,.22,.021,.22);

}
export const snowSourceRim={x:-4.90,y:1.04,z:.65};

export function pilgrimInstallationGeometry(site){
  const s=sculpture(),upper=sculpture();
  switch(site.kind){
    case 'sakai':steamingKiln(s,upper);break;
    case 'peach':casks(s,site);break;
    case 'temple':lotusPools(s,site);break;
    case 'dawn':dawnRecliners(s);break;
    case 'inari':headfall(s);break;
    case 'tsuruga':tideLock(s);break;
    case 'snow':snowShelf(s);break;
  }
  fittedPilgrimCraft(s,upper,site);
  return {body:s.finish(),roof:site.kind==='sakai'?upper.finish():null};
}
