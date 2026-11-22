// Fitted work at the waterline. Coordinates are measured against each bath's
// original masonry, water datum and opening on the trail side.
import { beam, stroke, surface, turned } from './pilgrim-roofcraft.js';
import { rimSection } from './main-bath-rims.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brineGate, dawnBeds, pilgrimPools, petalTop, pilgrimPoolLip, steamRoom, steamVaultHeight } from './pilgrim-bathing-plan.js';

const { PI, sin, cos, abs, max, min }=Math;
const turn=2*PI;
const samples=(n,fn)=>Array.from({length:n},(_,i)=>fn(i/(n-1)));
const interp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function line(s,col,at,r,n=17){stroke(s,col,samples(n,at),r,n-1,5);}
function cord(s,at,r=.048,col='#876b46'){
  const axis=samples(43,t=>at(t));
  stroke(s,col,axis,r,60,7);
  for(let j=0;j<2;j++){
    const pts=axis.map((p,i)=>{
      const t=i/(axis.length-1),a=t*PI*18+j*PI;
      const d=axis[min(i+1,axis.length-1)].map((v,k)=>v-axis[max(0,i-1)][k]);
      const l=Math.hypot(...d)||1,x=d[0]/l,y=d[1]/l,z=d[2]/l;
      const horizontal=Math.hypot(x,z)||1,ex=z/horizontal,ez=-x/horizontal;
      return [p[0]+r*(ex*cos(a)+y*ez*sin(a)),p[1]+r*horizontal*sin(a),p[2]+r*(ez*cos(a)-y*ex*sin(a))];
    });
    stroke(s,j?'#b59a68':'#c5a977',pts,.010,65,4);
  }
}

// A back-to-back row of split timber staves follows the two barrels. The
// crest rises from the original hoop, with mortised outer shoulders and a
// woven binding. Each plank has its own hewn face and inner bevel.
function orchard(s,site){
  for(const p of pilgrimPools(site)){
    const blossom=p.u<0,n=blossom?19:21,r=p.rx,angle=t=>(1.02+.96*t)*PI;
    function plank(t,v,outer){
      const a=angle(t),fan=sin(t*PI)**.83;
      const y=p.y+.19+v*(.18+fan*(blossom?.94:.79)+.050*cos((t*n-.5)*turn));
      const flare=(outer?.196:.046)+.13*v*v*fan;
      return [p.u+(r+flare)*cos(a),y,p.v+(r+flare)*sin(a)];
    }
    for(let k=0;k<n;k++){
      const left=(k+.028)/n,right=(k+.972)/n,t=q=>left+(right-left)*q;
      const tint=blossom?['#ab7652','#ad8056','#c29367']:['#7f513d','#99664d','#b07a54'];
      for(const outside of [false,true]){
        surface(s,'#fff',6,5,(q,v)=>plank(t(q),v,outside),(q,v)=>[tint[k%3],.78+.20*v+.09*sin(PI*q)]);
        for(const q of [.28,.72])line(s,outside?'#79553d':'#8b654c',v=>{
          const f=t(q+.095*sin(9*v+k)*sin(PI*v)),a=angle(f),pt=plank(f,.16+.70*v,outside);
          pt[0]+=(outside?.006:-.006)*cos(a);pt[2]+=(outside?.006:-.006)*sin(a);return pt;
        },.009,9);
      }
      surface(s,'#d3aa77',2,5,(q,v)=>interp(plank(t(q),1,false),plank(t(q),1,true),v));
      surface(s,'#77513b',5,2,(q,v)=>interp(plank(left,v,false),plank(left,v,true),q));
    }
    for(const v of [.37,.47])cord(s,t=>{const a=angle(t),pt=plank(t,v,true);pt[0]+=.035*cos(a);pt[2]+=.035*sin(a);return pt;},.034);
    // A flowering branch runs across the joined inside faces in dark lacquer.
    const relief=(t,v)=>{
      const a=angle(t),pt=plank(t,v,false);pt[0]-=.025*cos(a);pt[2]-=.025*sin(a);return pt;
    };
    const height=t=>.46+.14*cos(t*PI*2.6);
    line(s,'#594736',t=>relief(.12+.76*t,height(t)),.027,33);
    for(let j=0;j<5;j++){
      const t=.14+j*.14,v=height((t-.12)/.76),end=t+.08;
      line(s,'#70503b',q=>relief(t+.08*q,v+.25*q-.025*sin(PI*q)),.014,9);
      const at=relief(end,v+.25),a=angle(end);
      if(blossom){
        for(let i=0;i<5;i++){const f=i*turn/5,l=.071*cos(f);
          s.ball('#cd9382',at[0]-sin(a)*l,at[1]+.066*sin(f),at[2]+cos(a)*l,.063,.058,.045,0,-a);}
        s.ball('#d5ad64',...at,.034,.034,.030);
      }else{
        s.ball('#cf9978',...at,.096,.107,.074,0,-a,-.17);
        line(s,'#8a634d',q=>[at[0]-.015,at[1]-.073+.145*q,at[2]+.073+.01*sin(PI*q)],.010,8);
      }
    }
  }
}

// Overlapping whorls: the thin edges turn back to leave a real shadow gap
// between the outer stone petals and the original carved, water-holding cup.
function petals(s,site){
  for(const p of pilgrimPools(site)){
    const main=p.id==='lotus-heart',n=main?11:8;
    for(let i=0;i<n;i++){
      const a=turn*(i+.5)/n,front=sin(a)>.28&&abs(p.rx*cos(a))<(main?1.27:.72);
      const transfer=main&&abs(p.rz*sin(a)+.29)<.61;
      if(front||transfer)continue;
      const h=petalTop(p,a),hTip=h+(main?.21:.12);
      function at(q,v,back=false){
        const w=sin(PI*(.075+.92*v))**.60;
        const theta=a+(q*2-1)*PI/n*1.11*w;
        const lip=pilgrimPoolLip(p,theta),lift=1-(2*q-1)**2;
        const offset=.23+(main?.36:.21)*sin(v*PI*.72)+.12*lift*sin(PI*v)-.09*v+(back?-.082:0);
        return [p.u+(p.rx*lip+offset)*cos(theta),-.09+(hTip+.09)*v+.15*v*v*lift,p.v+(p.rz*lip+offset)*sin(theta)];
      }
      surface(s,'#fff',15,12,(q,v)=>at(q,v),(q,v)=>[v>.78?'#c5ab9c':v>.42?'#af9687':'#8c8e7a',.81+.18*sin(PI*q)+.06*v]);
      surface(s,'#8c8679',11,7,(q,v)=>at(q,v,true));
      for(const edge of [0,1]){
        surface(s,'#d1baa4',12,2,(q,v)=>interp(at(edge,v),at(edge,v,true),q));
        line(s,'#bdae99',v=>at(edge,v),.028,17);
      }
      for(const q of [.17,.33,.50,.67,.83])line(s,q===.5?'#d8b9a1':'#91786b',v=>at(.5+(q-.5)*sin((v*.85+.09)*PI),.07+.88*v),q===.5?.026:.012,15);
    }
  }
  // Flared underside of the lotus leaf that catches and returns the feed.
  for(const side of [-1,1]){
    const at=(q,v)=>{const a=(q*1.68-.80)*PI;
      const r=(.41+.056*sin(5*a))*(.04+.96*v);
      return [side*.24+r*cos(a),1.155+.10*v*v+.047*v*sin(3*a),-2.52+.80*r*sin(a)];};
    surface(s,'#879281',10,26,at);
    line(s,'#b4aa85',q=>at(q,1),.025,32);
    for(let j=0;j<5;j++)line(s,'#aca789',v=>at((j+.5)/5,v),.014,11);
  }
}

function morning(s){
  // The warm feed arrives in a single sun fan and branches UNDER the
  // pillows. Its alternating pleats are visible from the far end of each bed.
  for(const [i,x] of dawnBeds.entries()){
    const y0=.04,z0=-1.83,r=i===1?1.13:.90;
    const at=(a,t,back=0)=>{
      const fold=.027*cos(a*16)*t;
      return [x+(r+.022*cos(16*a))*cos(a)*t,y0+r*.80*sin(a)*t,z0-.19*t+.08*sin(a)*t+fold-back];};
    for(let j=0;j<16;j++){
      const left=PI*j/16,right=PI*(j+1)/16;
      surface(s,'#fff',6,4,(q,v)=>at(left+(right-left)*q,.10+.90*v),(q,v)=>[
        j%2?'#ae8560':'#bf9b71',.78+.16*v+.12*sin(PI*q)]);
    }
    surface(s,'#826e59',8,34,(q,v)=>at(PI*q,.10+.90*v,.089));
    surface(s,'#c9a875',2,34,(q,v)=>interp(at(PI*q,1),at(PI*q,1,.089),v));
    line(s,'#d5b789',q=>at(PI*q,.92),.033,35);
    for(let j=0;j<=8;j++)line(s,'#8a684b',v=>at(PI*j/8,.16+.83*v),.023,14);
    const pivot=[x,.16,z0+.067];
    s.post('#9a6245',...pivot,.14,.15,.14,PI/2);
    s.post('#caad74',x,.16,z0+.16,.083,.044,.083,PI/2);
    for(const side of [-1,1]){
      stroke(s,'#96724e',[[x+side*.59,.16,-1.91],[x+side*.65,.18,-1.64],[x+side*.68,.16,-1.41],[x+side*.70,.11,-1.27]], [.081,.078,.068,.073],12,8);
      s.post('#6e6251',x+side*.70,.112,-1.24,.046,.061,.046,PI/2);
    }
  }
  stroke(s,'#936d47',[[-2.76,.13,-2.12],[-1.32,.15,-2.15],[0,.16,-2.16],[1.47,.14,-2.14],[2.76,.13,-2.11]],.113,26,9);
}

// The shrine's cast water head is pierced all the way through. Surface
// sections contract from the cedar flume to the narrow mouth under the nose.
function foxConduit(s){
  const at=(q,v)=>{
    const a=q*turn,rad=.47-.15*v+.08*sin(PI*v),z=-1.70+.91*v;
    return [-.12*(1-v)+rad*cos(a),3.12+(.26-.10*v)*sin(a)+.033*v,z];};
  surface(s,'#fff',12,36,at,(q,v)=>[v>.80?'#947a53':'#777e67',.80+.18*sin(q*turn)+.12*sin(v*PI)]);
  for(const v of [.04,.24,.96])line(s,'#b8a078',q=>at(q,v),.037,38);
  for(const side of [-1,1]){
    const ear=(q,v,back=0)=>{
      const half=(1-v)*(.22-.045*v),x=side*(.265+.16*v)+(q*2-1)*half;
      return [x,3.245+.74*v-.06*(2*q-1)**2*(1-v),-1.24-.215*v-.06*(2*q-1)**2+back];};
    surface(s,'#fff',12,9,ear,(q,v)=>[abs(q-.5)>.34?'#a18a66':'#735e4d',.83+.18*sin(PI*q)+.09*v]);
    surface(s,'#7f856e',8,7,(q,v)=>ear(q,v,-.15*(1-v)-.045));
    for(const edge of [0,1])line(s,'#bca680',v=>ear(edge,v),.034,15);
    s.ball('#979a7c',side*.29,3.18,-1.05,.21,.18,.266,-.26,side*.19,side*.30);
    stroke(s,'#a99c74',[[side*.09,3.31,-.89],[side*.22,3.36,-1.00],[side*.39,3.36,-1.14],[side*.50,3.30,-1.24]],[.039,.054,.047,.015],13);
    stroke(s,'#464d41',[[side*.14,3.258,-.862],[side*.241,3.281,-.91],[side*.348,3.268,-.982]], [.009,.027,.012],11);
    s.ball('#bbab77',side*.23,3.277,-.893,.029,.014,.02);
    s.ball('#a59873',side*.18,3.11,-.80,.18,.105,.207,-.20,side*.16,side*.11);
    for(let j=0;j<3;j++)stroke(s,'#746a51',[[side*.19,3.12-.033*j,-.644],[side*.29,3.13-.032*j,-.706],[side*(.397+.02*j),3.17-.048*j,-.85]],[.008,.015,.005],8);
    const cheek=[[side*.32,3.05,-.87],[side*.36,2.97,-.89],[side*.33,2.86,-.82],[side*.24,2.865,-.77]];
    stroke(s,'#8b7858',cheek,[.085,.07,.057,.054],9,7);
  }
  s.ball('#504d40',0,3.166,-.675,.118,.073,.093,-.17);
  for(const side of [-1,1])s.ball('#393d34',side*.063,3.18,-.605,.022,.013,.014);
  for(const z of [-1.92,-2.46]){
    cord(s,t=>[-.30+.48*cos(turn*t),2.96+.225*sin(turn*t),z+.085*t],.038);
  }
}

// The bath is fed by three intergrown terraces. The upstream lip touches the
// following dish; only their hot inside stays clear of the mineral crust.
export const winterTerraces=[
  {x:-4.79,z:.67,y:.99,rx:.72,rz:.53,phase:.47},
  {x:-4.29,z:.86,y:.64,rx:.87,rz:.66,phase:1.90},
  {x:-3.77,z:1.00,y:.31,rx:.94,rz:.75,phase:2.64}
];
function travertine(s){
  for(const b of winterTerraces){
    const imprint=a=>1+.117*cos(3*a+b.phase)+.074*sin(5*a-b.phase)+.037*cos(9*a+1.3*b.phase);
    function wall(q,v){
      const a=q*turn,r=imprint(a)*(.74+.25*v)+.027*sin(v*29+2*sin(3*a))+.025*cos(v*47+a);
      const spill=.095*max(0,cos(a-.25))**11;
      return [b.x+b.rx*r*cos(a),b.y-.55+.55*v+.041*v*sin(4*a+b.phase)-spill*v,b.z+b.rz*r*sin(a)];
    }
    surface(s,'#fff',24,53,wall,(q,v)=>{const a=q*turn,stratum=sin(v*29+1.8*cos(3*a+b.phase));
      return [v>.94?'#ddd2ab':v>.80?'#c6be92':stratum>.48?'#ab9f72':v<.40?'#877759':'#bCAE87',.89+.09*sin(4*a+v*9)];});
    for(const v of [.34,.63,.84,.97])line(s,v>.9?'#ded6b2':v>.7?'#c5b88c':'#97865e',q=>wall(q,v),v>.9?.029:.017,52);
    const lip=q=>wall(q,1);
    surface(s,'#d1c49b',5,52,(q,v)=>{
      const [x,h,z]=lip(q),r=1-.16*v;return [b.x+(x-b.x)*r,h-.065*v+.021*sin(PI*v),b.z+(z-b.z)*r];});
    surface(s,'#fff',5,55,(q,v)=>{
      const [x,,z]=lip(q),r=.007+.89*v;return [b.x+(x-b.x)*r,b.y-.073+.003*cos(28*v+q*turn),b.z+(z-b.z)*r];
    },(q,v)=>[v>.85?'#a6b09b':'#789d94',.95+.07*sin(q*26+v*9)]);
    for(let j=0;j<9;j++){
      const t=(j+.21)/9,base=.46+.12*cos(j*4.7);
      line(s,'#b6a47b',v=>wall(t+.006*sin(PI*v),base+.35*v),.014,9);
    }
  }
}

// The line-hauling drum sits behind the wheel and pays the gate rope through
// a real fairlead. The wheel's local XY frame rotates over an immobile axle.
export const windlass={x:brineGate.u-.28,y:2.56,z:-1.32,r:.81};
export function harborWindlass(){
  const s=sculpture(),r=windlass.r;
  const wheel=(a,rr,z)=>[rr*cos(a),rr*sin(a),z];
  for(let i=0;i<8;i++){
    const lo=i*PI/4+.008,hi=(i+1)*PI/4-.008,a=(lo+hi)/2;
    for(const z of [.09,-.09])surface(s,i%2?'#916446':'#a77d53',3,9,(q,v)=>wheel(lo+(hi-lo)*q,r-.12+.12*v,z));
    for(const rr of [r,r-.12])surface(s,rr===r?'#b49165':'#795d46',2,9,(q,v)=>wheel(lo+(hi-lo)*q,rr,-.09+.18*v));
    for(const edge of [lo,hi])surface(s,'#775b42',2,3,(q,v)=>wheel(edge,r-.12+.12*q,-.09+.18*v));
    line(s,'#725840',q=>wheel(lo+(hi-lo)*q,r-.052,.096),.012,9);
    stroke(s,'#936d4c',[wheel(a,.12,0),wheel(a-.073,.28,0),wheel(a-.06,.54,.015),wheel(a,.72,0)],[.073,.067,.048,.068],13,7);
    s.post('#615846',...wheel(a,.752,.103),.028,.028,.028,PI/2);
  }
  for(const z of [-.096,.098])line(s,'#5d5d50',a=>wheel(a*turn,r-.005,z),.026,62);
  s.post('#775b40',0,0,-.25,.29,.49,.29,PI/2);
  s.post('#53594c',0,0,.07,.188,.28,.188,PI/2);
  s.post('#ac8a5d',0,0,.222,.128,.044,.128,PI/2);
  for(let i=0;i<15;i++){
    const a=i*turn/15,b=a+.65*turn/15;
    const profile=[[a,.265],[a-.062,.381],[b-.041,.387],[b,.274]];
    for(const z of [-.14,-.20])surface(s,'#6c6b57',2,3,(q,v)=>{
      const j=Math.round(3*q);return wheel(profile[j][0],.218+(profile[j][1]-.218)*v,z);});
    for(let j=0;j<3;j++)surface(s,'#91886a',2,4,(q,v)=>interp(wheel(...profile[j],-.14-.06*v),wheel(...profile[j+1],-.14-.06*v),q));
  }
  line(s,'#c4a77a',t=>wheel(turn*6*t,.277+.005*cos(t*turn*6),-.51+.29*t),.029,90);
  s.post('#775a3d',...wheel(1.72,.70,.25),.055,.29,.055,PI/2);
  s.post('#bda376',...wheel(1.72,.70,.41),.073,.07,.073,PI/2);
  return s.finish();
}
function clinkerSides(s,site){
  // Fit strakes and inward-turning frames along the wet face of the harbour
  // basin. Both stem ends rise. The gangway on the +v side has no gunwale.
  const railing=(a,h,inside=0)=>{
    const {u,v,top}=rimSection(site,a),outer=Math.hypot(u,v);
    const ux=u/outer,vz=v/outer,sheer=.24+.29*abs(cos(a))**8;
    return [u-ux*(.25+.11*(1-h)+inside),-.22+(top+.22+sheer)*h,v-vz*(.25+.11*(1-h)+inside)];
  };
  for(const [first,last] of [[-PI*.97,-PI*.23],[-PI*.23,.33*PI],[.69*PI,1.04*PI]]){
    for(let k=0;k<4;k++){
      const band=(q,v)=>{const a=first+(last-first)*q,h=.21*k+v*.226;
        return railing(a,h,.042*(1-v)+.011*cos(a*12));};
      surface(s,'#fff',4,36,band,(q,v)=>[k===3?'#9b7958':k===2?'#8a684e':'#78634d',.80+.16*v+.07*cos(q*18+k)]);
      line(s,'#b09872',q=>band(q,.99),.027,37);
      line(s,'#625545',q=>band(q,.06),.021,37);
    }
    for(let j=0;j<7;j++){
      const a=first+(.092+j*.136)*(last-first);
      line(s,'#9e8362',h=>railing(a,.08+.75*h,.12+.13*(1-h)**2),.058,10);
      const [x,y,z]=railing(a,.81,.175);s.ball('#726e58',x,y,z,.032,.034,.032);
    }
    const cap=q=>railing(first+(last-first)*q,.855,.065);
    line(s,'#b69b72',cap,.093,39);
  }
}

function splashShield(s){
  // Fitted wing-stones at either side of the shoulder stream have hollows
  // on their wet faces, with a lower notch returning water to the pool.
  for(const side of [-1,1]){
    const point=(q,v,back=0)=>{
      const f=.5-.5*cos(PI*q),x=side*(.60+.75*f);
      const h=.23+.57*sin(PI*q)**.76+.16*q;
      const z=-1.53+.66*q+.085*sin(q*PI*2);
      return [x,.04+h*v,z-.09*v+.10*sin(PI*v)-back];
    };
    surface(s,'#fff',14,24,(q,v)=>point(q,v),(q,v)=>[v>.85?'#9e9f85':v>.63?'#818875':'#737e70',.83+.17*sin(PI*q)+.085*cos(v*22+q*9)]);
    surface(s,'#797d69',9,21,(q,v)=>point(q,v,.195));
    surface(s,'#a3a18a',3,26,(q,v)=>point(q,1,v*.195));
    for(const q of [0,1])surface(s,'#848673',9,3,(u,v)=>point(q,v,u*.195));
    for(let k=0;k<4;k++)line(s,k%2?'#71776a':'#b3ab90',q=>point(.023+.952*q,.26+.18*k+.045*sin(q*9+k),-.015),.016,25);
  }
}

function winchBearings(s){
  const w=windlass;
  for(const x of [w.x-.56,w.x+.56]){
    beam(s,'#74513e',[x,.61,-2.07],[x,2.51,-1.76],.16,.19);
    beam(s,'#8e6a49',[x,1.21,-2.20],[x,2.39,-1.57],.105,.13);
  }
  s.box('#82634c',w.x,2.51,-1.82,1.51,.20,.29);
  s.post('#514f44',w.x,w.y,-1.69,.095,1.00,.095,PI/2);
  stroke(s,'#525744',[[w.x+.51,2.56,-1.481],[w.x+.47,2.79,-1.48],[w.x+.32,2.83,-1.48],[w.x+.22,2.79,-1.48]],[.046,.058,.04,.021],12);
  const feed=[w.x+.28,2.54,-1.66],x=brineGate.u;
  stroke(s,'#b4976a',[feed,[x+.15,2.69,-1.61],[x+.025,2.71,-1.61],[x,2.65,-1.62]],.030,13);
  for(const side of [-1,1])stroke(s,'#a08c68',[[x+side*.795,.64,-1.54],[x+side*.82,.72,-1.27],[x+side*.89,.69,-1.15]],[.055,.046,.024],8);
}

// Double-boiler furnace and branching smoke ducts. The fire stays behind a
// pierced earthen face. Inside, the steam issues from the kettle and bench
// slots. The cutaway owns only the external arch and the flue above it.
function firingRoom(s,upper){
  const r=steamRoom,back=r.v-r.d/2,front=r.v+r.d/2;
  const brick='#90573e',smoke='#514c3f',ash='#b18a60',green='#758577';
  const kettle=(x,scale)=>{
    const z=back+.62,y=.59;
    const radius=v=>scale*(.264+.26*sin(PI*(.06+.82*v))-.12*v);
    const skin=(q,v)=>{const a=q*turn,rr=radius(v)+.009*cos(v*64);
      return [x+rr*cos(a),y+scale*.76*v,z+rr*sin(a)];};
    surface(s,'#fff',29,37,skin,(q,v)=>{const a=q*turn,edge=.48+.10*sin(4*a)+.065*cos(7*a)-.26*max(0,cos(3*a))**19;
      return [v<edge?'#916448':v<edge+.064?'#78816a':'#51766e',.88+.12*sin(3*a+v*3)+.04*cos(v*67)];});
    for(const v of [.17,.84,.96])line(s,v>.70?'#97a28a':'#ae8662',t=>skin(t,v),.026,35);
    turned(s,'#8d9a83',x,y+.755*scale,z,[[scale*.36,0],[scale*.40,.052],[scale*.39,.083],[scale*.29,.079],[scale*.28,-.03]],28);
    s.post(smoke,x,y+.75*scale,z,scale*.29,.025,scale*.29);
    for(const side of [-1,1])stroke(s,green,[[x+side*.37*scale,y+.61*scale,z],[x+side*.54*scale,y+.68*scale,z],
      [x+side*.59*scale,y+.49*scale,z],[x+side*.44*scale,y+.43*scale,z]],[.051,.060,.060,.047],12,7);
  };
  kettle(-.44,.93);kettle(.44,.71);
  for(const side of [-1,1]){
    const end=side*1.95;
    const pts=[[side*.36,1.44,back+.29],[side*.47,1.65,back+.29],[side*.78,1.71,back+.28],
      [side*1.14,1.73,back+.26],[side*1.39,1.62,back+.26],[side*1.48,1.27,back+.27],
      [side*1.59,1.04,back+.29],[end,1.03,back+.35]];
    stroke(s,'#925f46',pts,[.118,.137,.122,.124,.13,.117,.107,.108],28,10);
    for(const i of [1,3,5])s.ball(i===3?'#AD805B':ash,...pts[i],.145,.137,.141);
    s.post('#97664d',end,1.04,back+.382,.176,.18,.176,PI/2);
    s.post(smoke,end,1.04,back+.48,.143,.024,.143,PI/2);
    for(let j=-1;j<2;j++)s.box('#be8d62',end+j*.071,1.04,back+.505,.026,.18-.036*abs(j),.024);
    // Split cedar slats form a rounded backrest immediately behind each seat.
    for(let j=0;j<7;j++){
      const z=r.seatV+(j-3)*.294,postX=side*(r.seatU+.39);
      stroke(s,j%2?'#986f4f':'#ab815b',[[postX,.36,z],[postX+side*.055,.62,z],[postX+side*.15,.84,z],
        [postX+side*.22,.93+.035*cos(j),z]],[.063,.062,.053,.059],9,6);
    }
    stroke(s,'#bc936b',[[side*(r.seatU+.52),.76,r.seatV-1.0],[side*(r.seatU+.56),.79,r.seatV],
      [side*(r.seatU+.52),.76,r.seatV+1]],.074,14,7);
  }
  // External firing ribs bind the barrel vault. Pigment follows its spring,
  // with pale ash collecting at the crown and soot at the fireward shoulder.
  for(const v of [.035,.32,.66,.97]){
    const vault=(q,shift=0)=>{const a=q*PI,z=back-.12+(r.d+.24)*v+shift;
      return [(r.w/2+.184)*cos(a),steamVaultHeight(cos(a),v)+.051,z];};
    line(upper,'#6b503f',q=>vault(q),.092,48);
    for(const off of [-.061,.061])line(upper,'#ab805b',q=>vault(q,off),.032,48);
  }
  const vent=r.v-.64;
  for(let k=0;k<6;k++){const a=k*turn/6;
    beam(upper,'#695141',[.32*cos(a),4.53,vent+.32*sin(a)],[.31*cos(a),4.85,vent+.31*sin(a)],.105,.099);}
  turned(upper,brick,0,4.79,vent,[[.47,.00],[.49,.065],[.44,.113],[.28,.194],[.16,.243],[.070,.251]],28);
  for(let j=0;j<16;j++){
    const a=j*PI/16,b=(j+1)*PI/16;
    const at=(q,v)=>{const h=a+(b-a)*(.015+.97*q),rr=1.42+.16*v;
      return [rr*cos(h),1.53+rr*sin(h),front+.289+.095*sin(PI*v)];};
    surface(upper,'#fff',5,5,at,(q,v)=>[j%2?'#895d45':'#a07150',.76+.24*sin(PI*v)]);
  }
  // Dry kiln court: a shallow brick apron replaces the former shore outside
  // the doorway. Flanking channels guide condensation away from the sill.
  for(let row=0;row<7;row++)for(let col=0;col<8;col++){
    const w=.33,z=front+.21+row*.238,x=(col-3.5)*w;
    s.box(['#aa8d71','#ad9277','#b49879','#947d67'][(col*3+row*7)%4],x,.002,z,w-.013,.043,.225);
  }
}

export function fittedPilgrimCraft(s,upper,site){
  switch(site.kind){
    case 'dawn':morning(s);break;
    case 'temple':petals(s,site);break;
    case 'peach':orchard(s,site);break;
    case 'inari':foxConduit(s);splashShield(s);break;
    case 'tsuruga':winchBearings(s);clinkerSides(s,site);break;
    case 'snow':travertine(s);break;
    case 'sakai':firingRoom(s,upper);break;
  }
}
