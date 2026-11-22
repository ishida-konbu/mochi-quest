// The kettle sits by a working hut. Its half-height screen follows the outer
// shoulder of the yard, leaving the firemouth and all four stair treads clear.
import * as T from './vendor/three.module.min.js';
import { surface,rod } from './village-bath-figures.js';
import { GOEMON_SCREEN } from './wayside-hut-layout.js';

const {sin,cos,PI}=Math;
export function paintKettleScreen(s,kind,bank,seed){
  const sail=kind==='fisher'&&bank!=='river', river=bank==='river';
  const [first,middle,last]=GOEMON_SCREEN;
  const posts=[first,middle,last];
  const wood=sail?'#8b7862':river?'#868268':'#78664f';
  for(const [x,z] of posts){
    s.ball('#8f8a78',x,.065,z,.15,.11,.14,0,z);
    rod(s,wood,[x,.004,z],[x,1.66+.04*cos(z+seed),z],.055,.047);
  }
  for(let bay=0;bay<2;bay++){
    const [x0,z0]=posts[bay],[x1,z1]=posts[bay+1];
    const at=(u,y,dx=0)=>[x0+(x1-x0)*u+dx,y,z0+(z1-z0)*u];
    const shade=new T.Color(sail?'#b7a88b':river?'#959575':'#a49372');
    for(const y of [.26,1.48])rod(s,wood,at(-.04,y),at(1.04,y+.018),.037,.039);
    if(sail){
      // The luff of a retired sail sags between each pair of reef points.
      const cloth=(u,v)=>at(.035+.93*u,.24+v*1.21-.10*sin(PI*u)*(.26+.74*v)+
        .021*sin(u*PI*7+seed)*(1-v),-.058-.12*sin(PI*u)*sin(v*PI)-.024*sin(u*19+3*v));
      s.add(surface(30,13,cloth,(u,v)=>shade.clone().multiplyScalar(.89+.13*sin(PI*v)+.042*cos(u*30))), '#fff');
      for(const u of [.14,.5,.86]){
        const eye=cloth(u,.94);
        s.stroke('#796d59',[eye,at(u,1.50,-.032),at(u,1.52,.033),at(u,1.40,.06)],
          [.014,.017,.014,.006],8);
      }
      if(bay===0)for(let j=0;j<4;j++){
        const u=.18+j*.16;
        const thread=[cloth(u,.39),cloth(u+.08,.39),cloth(u+.16,.39)].map(([x,y,z])=>[x-.006,y,z]);
        s.stroke('#8f8068',thread,[.004,.008,.002],4);
      }
    }else{
      const count=river?18:12;
      for(let j=0;j<count;j++){
        const u=(j+.5)/count,twist=.018*cos(j*2.3+seed);
        const low=.16+.047*cos(j),tip=1.40+.09*sin(j*1.78+seed);
        s.stroke(j%3?'#a39670':wood,[at(u,low),at(u+twist,.64),at(u-twist,1.07),at(u,tip)],
          [river?.026:.023,.030,.026,river?.020:.013],7);
      }
      for(let row=0;row<(river?3:9);row++){
        const y=.28+row*(river?.48:.126);
        const pts=Array.from({length:count*2+1},(_,i)=>at(i/(2*count),y+.009*sin(i+row),
          .04*cos(i*PI/2+row*PI)));
        s.stroke(row%3?'#958060':'#b29d75',pts,pts.map(()=>river?.014:.023),count*2);
      }
    }
    for(const u of [.02,.98])for(const y of [.26,1.48]){
      const knot=at(u,y,-.046);
      s.stroke('#c3b089',[[knot[0]+.04,y-.045,knot[2]-.05],knot,[knot[0]+.061,y+.04,knot[2]+.035]],
        [.012,.018,.013],5);
    }
  }
  // A folded tenugui wraps around the top spar. The short reverse and long
  // face share a rounded crest; the resist-dyed stripes follow the folds.
  const x=middle[0],z=middle[1]-.20,indigo=new T.Color(river?'#668177':sail?'#647885':'#887664');
  const flax=new T.Color('#d9cdb0');
  const towel=(u,v)=>{
    const fold=sin(u*PI*5+.4*v), side=v<.48?-1:1;
    const drop=v<.48?(.48-v)/.48:(v-.48)/.52;
    return [x+side*(.07+.026*drop)+.027*fold,1.52-drop*(side<0?.48:.29)+.011*fold,
      z+(u-.5)*.43+.022*drop*sin(u*PI)];
  };
  s.add(surface(22,36,towel,(u,v)=>{
    const h=v<.48?v/.48:(1-v)/.52;
    const stripe=(h>.08&&h<.145)||(h>.18&&h<.22);
    return (stripe?indigo:flax).clone().multiplyScalar(.95+.044*cos(u*PI*5));
  }),'#fff');
}
