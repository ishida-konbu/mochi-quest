// Construction visible from the water. The seven installations are built on
// the same measurements as the outlets, bathing positions and wet banks.
import * as T from './vendor/three.module.min.js';
import { surface,rod,dab } from './village-bath-figures.js';
import { villagePoolsPoint,villageCourseRim } from './village-bath-courses.js';
const {sin,cos,PI}=Math,tau=2*PI;

// A strip follows the warp, crossing above and below consecutive wefts.
function screen(s,at,n,m,warp,weft){
  for(const cross of [false,true]){
    const count=cross?m:n,other=cross?n:m;
    for(let j=0;j<count;j++){
      s.add(surface(other*2,1,(u,v)=>{
        const fixed=(j+.5+(v-.5)*.77)/count;
        const x=cross?u:fixed,z=cross?fixed:u;
        return at(x,z,(cross?-1:1)*.0085*cos(PI*(u*other-.5+j)));
      }),(cross?weft:warp)[j%2]);
    }
  }
}
function basket(s,x,y,z,r,depth,tilt){
  const point=(a,h,offset=0)=>{
    const rad=r*(.50+.50*h**.74)+offset;
    return [x+rad*cos(a),y+depth*h+tilt*rad*sin(a),z+rad*sin(a)];
  };
  for(let j=0;j<27;j++){
    s.add(surface(5,1,(h,t)=>point(tau*(j+(t-.5)*.28)/27,h,.009*cos(12*PI*h+j*PI))),'#c3a16e');
  }
  for(let j=0;j<10;j++){
    s.add(surface(80,1,(u,v)=>point(tau*u,(j+.45+v*.67)/11,.014*cos(27*PI*2*u+j*PI))),j%2?'#a48256':'#91714e');
  }
  const rim=Array.from({length:43},(_,i)=>point(tau*i/42,1));
  s.stroke('#c1a073',rim,rim.map(()=>.033),48);
  screen(s,(u,v,h)=>[x+(u-.5)*r*.68,y+.014+h,z+(v-.5)*r*.68],9,9,['#aa895e','#b79b6e'],['#897454','#a7895e']);
  // Thin petals curl on the slats of the skimmer.
  for(let j=0;j<16;j++){
    const a=j*2.399,dist=r*(.05+.51*j/16),xx=x+dist*cos(a),zz=z+dist*sin(a);
    for(let k=0;k<5;k++){
      const q=a+k*tau/5;
      s.add(surface(4,5,(u,t)=>{
        const w=(u-.5)*.044*sin(PI*t)**.75;
        return [xx+.051*t*cos(q)-w*sin(q),y+.035+.045*(dist/r)**2+.016*t*t,zz+.051*t*sin(q)+w*cos(q)];
      }),k%2?'#dab0a3':'#e6c3b4');
    }
  }
}
function blossomWorks(s){
  const x=-2.58,z=-2.97;
  basket(s,x,.63,z,.49,.17,-.16);
  // A floating cedar spar catches the drift against the reed basket.
  const edge=[[-3.57,.055,-.35],[-3.75,.055,-1.39],[-3.42,.065,-2.20],[x-.34,.11,z+.26]];
  for(let i=1;i<edge.length;i++){
    rod(s,i%2?'#a18c67':'#af996d',edge[i-1],edge[i],.070,.062);
    dab(s,'#6e624a',...edge[i],.074,.072,.075);
  }
}
function bambooCanopy(s){
  const at=(u,v,depth=0)=>[-3.27+3.31*u,2.34+.65*sin(PI*v)**.9-.093*v+.090*cos(tau*u)+depth,-2.71+1.32*v];
  screen(s,at,35,9,['#a8a574','#b9ad7b'],['#727c59','#8a9166']);
  for(let j=0;j<6;j++){
    const u=(j+.13)/5.26;
    const beam=Array.from({length:10},(_,i)=>at(u,i/9,-.049));
    s.stroke('#697755',beam,beam.map(()=>.043),13);
  }
  for(const v of [0,1]){
    const edge=Array.from({length:13},(_,i)=>at(i/12,v));
    s.stroke('#85895d',edge,edge.map(()=>.044),14);
  }
  for(const x of [-3,-.24])for(const v of [0,1]){
    const end=at((x+3.27)/3.31,v);
    rod(s,'#879061',[x,1.99,-2.03],end,.054,.042);
    for(let j=0;j<3;j++)rod(s,'#766846',[x-.073,2.03+.039*j,-2.08],[x+.074,2.10+.039*j,-1.984],.014);
  }
}
function glazedJars(s,pools){
  for(const [i,p] of pools.entries()){
    const hue=['#b38d62','#95a38a','#81847a'][i],rich=['#814d37','#5f7762','#555749'][i];
    // Each glaze falls to a different length over the thrown shoulder.
    for(let j=0;j<29;j++){
      const a=(j+.26+.18*sin(j*3))*tau/29;
      const f=villageCourseRim(p,a);
      if(f.gate<.91)continue;
      const len=.07+.19*(.5+.5*cos(j*2.27+i))**2;
      s.add(surface(7,8,(u,v)=>{
        const angle=a+(u-.5)*.044*(.31+.69*sin(PI*(v*.86+.12)));
        const [x,z]=villagePoolsPoint(p,angle),w=.076+.120*v+.011*sin(u*PI);
        return [x+w*cos(angle),p.y+.22-len*v,z+w*sin(angle)];
      }),j%3?hue:rich);
    }
    // Small lifting lugs are pierced right through. Their ends are pressed
    // back into the soft clay, leaving two thumb marks on each shoulder.
    for(const angle of [PI*.06,PI*.96,PI*1.49]){
      const [x,z]=villagePoolsPoint(p,angle),c=cos(angle),d=sin(angle);
      const arch=Array.from({length:13},(_,j)=>{
        const a=PI*j/12,r=.091+.22*sin(a);
        return [x+c*r-d*.19*cos(a),p.y+.18+.063*sin(a),z+d*r+c*.19*cos(a)];
      });
      s.stroke(p.rim,arch,arch.map((_,j)=>.050+.020*Math.abs(j-6)/6),16);
      for(const j of [0,12])dab(s,rich,...arch[j],.062,.046,.061);
    }
  }
}
function sinterFall(s){
  const chalk=new T.Color('#dfd7b6'),iron=new T.Color('#a28b64');
  // Scalloped dams develop transverse to the direction of the overflow.
  for(const [x,z,y,w,h] of [[-1.53,-3.57,1.13,.94,.58],[-.73,-1.73,.57,1.25,.52]]){
    for(let j=0;j<8;j++){
      const f=j/8,reach=.12+.40*f,span=w*(1-.19*f),elev=y-h*f;
      const front=u=>z+reach+.075*cos(9*u+.62*j)+.035*sin(25*u+.13*j);
      s.add(surface(42,8,(u,t)=>{
        const xx=x+span*(u-.5),edge=front(u),flute=.041*cos(43*u+j*.28);
        return [xx,elev-.055*t-.083*t**4*(.69+.30*cos(41*u+j)),edge-.195*(1-t)**3+.029*sin(t*PI)+flute*t];
      },(u,t)=>iron.clone().lerp(chalk,.28+.63*t+.08*sin(u*48+j))),'#fff');
    }
  }
}
function riceBanks(s,pools){
  for(const [i,p] of pools.entries())for(const side of [-1,1]){
    const mid=side===1?0:PI;
    const point=(t,off=.25)=>{
      const a=mid+(t-.5)*1.61,[x,z]=villagePoolsPoint(p,a);
      return [x+off*cos(a),p.y,z+off*sin(a)];
    };
    for(let j=0;j<7;j++){
      const pts=Array.from({length:33},(_,k)=>{
        const t=k/32,[x,y,z]=point(t,.31+.023*sin(t*tau*5+j));
        return [x,y-.14+j*.049+.012*sin(2*tau*t+j),z];
      });
      s.stroke(j%2?'#997c56':'#816a4b',pts,pts.map(()=>.029),35);
    }
    for(let j=0;j<=10;j++){
      const [x,y,z]=point(j/10,.322);
      rod(s,j%2?'#6b5c46':'#897853',[x,y-.23,z],[x+.032*side,y+.21+.051*sin(j*3+i),z],.037,.030);
    }
  }
}
function autumnTrestle(s){
  // Pierced cloud-shaped knee braces are cut from the same timber as the
  // head beam. Each brace ends in a wedged through tenon below a water box.
  for(const side of [-1,1]){
    const x=side*2.62;
    for(const z of [-2.77,-2.58]){
      s.add(surface(33,1,(u,v)=>{
        const reach=1.13*u,top=2.60-.058*sin(PI*u),bottom=1.64+.90*sin(u*PI*.5)**.72+.035*sin(u*9*PI);
        return [x-side*reach,bottom+(top-bottom)*v,z];
      }),'#836b51');
      rod(s,'#a28d65',[x,2.05,z-.09],[x,2.05,z+.09],.046);
    }
    const trough=new T.Color('#897e68'),light=new T.Color('#ada08b');
    s.add(surface(20,26,(u,t)=>{
      const a=u*PI,half=.21+.049*sin(t*PI);
      return [1.535*side+half*cos(a),2.72-.094*sin(a)-.040*t,-2.84+.77*t];
    },(u,t)=>trough.clone().lerp(light,.19+.53*sin(u*PI)+.07*cos(11*u+t))),'#fff');
  }
}
function moonPillow(s){
  // The channels are longitudinal. Water passes between dressed basalt ribs
  // and over the bolster before it reaches the bather's shoulders.
  const basalt=new T.Color('#696f70'),wash=new T.Color('#a6a99b');
  for(let j=0;j<9;j++)s.add(surface(32,8,(t,u)=>{
    const z=1.15+(j-4)*.12+(u-.5)*.111;
    const y=-.147+.047*cos(t*PI*2)+.114*t*t+.020*sin(u*PI);
    return [-2.96+3.1*t,y,z];
  },(t,u)=>basalt.clone().lerp(wash,.20+.43*sin(u*PI)+.14*t)),'#fff');
  for(let j=-3;j<=3;j++){
    const r=.084,z=1.15+j*.153;
    s.add(surface(22,8,(u,t)=>[.26+.145*cos(tau*u),.048+r*sin(tau*u),z+(t-.5)*.15]),j%2?'#a2a59a':'#acae9f');
  }
}
const workshops={sakura:blossomWorks,bamboo:bambooCanopy,earthen:glazedJars,sulfur:sinterFall,paddy:riceBanks,maple:autumnTrestle,susuki:moonPillow};
export function finishWaterworks(s,kind,pools){workshops[kind]?.(s,pools);}
