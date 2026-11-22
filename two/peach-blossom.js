import * as T from './vendor/three.module.min.js';
import { seeded } from './terrain.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';

const TAU=Math.PI*2, {cos,sin}=Math;
const vec=(x,y,z)=>new T.Vector3(x,y,z);
// Beni pooled in the throat, a wash over the petal, and paper showing at its tip.
const dyes=[
  ['#971b45','#f23f70','#ff9aac'],
  ['#af2856','#fb6980','#ffd0c6'],
  ['#8e194e','#e63d80','#ff99bc'],
  ['#ac2941','#fa5869','#ffa590'],
  ['#bc405e','#ff8498','#ffdfd3'],
];
const flowers=new Map(),sprigs=new Map();

function colouredMesh(){
  const xyz=[],rgb=[],ix=[],col=new T.Color();
  return {
    point(x,y,z,tint){
      xyz.push(x,y,z);col.set(tint);rgb.push(col.r,col.g,col.b);return xyz.length/3-1;
    },
    face(a,b,c){ix.push(a,b,c);},
    finish(){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
      g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
      g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();return g;
    },
  };
}

// A flower opens around its local Y axis. The shared rim joins the hollow
// upper petal to a convex underside, visible from the path below the tree.
function openFlower(dye,double,detailed) {
  const key=[dye,double,detailed].join('/');
  if(flowers.has(key))return flowers.get(key);
  const [heart,wash,tip]=dyes[dye],m=colouredMesh();
  const reverse=new T.Color(wash).lerp(new T.Color(tip),.24);
  const crease=new T.Color(wash).lerp(new T.Color(heart),.28);
  function ringPoint(angle,radius,height,colour){
    return m.point(cos(angle)*radius,height,sin(angle)*radius,colour);
  }
  const base=m.point(0,0,0,'#863149'),throat=m.point(0,.21,0,'#b54745'),calyx=[];
  for(let j=0;j<5;j++)calyx.push(ringPoint(j*TAU/5,.34,.23+(j%2)*.03,heart));
  for(let j=0;j<5;j++){
    const k=(j+1)%5;m.face(base,calyx[j],calyx[k]);m.face(throat,calyx[k],calyx[j]);
  }

  function petal(a,length,lift,flare){
    const skew=.055*sin(3.8*a),width=.98+.06*cos(a);
    function at(r,w,h,color){
      const u=r*length,v=(w*width+skew*r*r)*length;
      return m.point(cos(a)*u-sin(a)*v,.16+h*length+lift*r*r,sin(a)*u+cos(a)*v,color);
    }
    // A folded midrib and two lifted margins run through each petal.
    // Give the two washes independent normals at their delicate outside lip.
    if(detailed){
      const sections=[[.12,.032],[.35,.205],[.66,.355],[.87,.305],[1,.135],[1.035,.015]];
      const top=[],under=[];
      for(const [r,w] of sections){
        const bell=.028+.26*r*r+.028*sin(r*4.1+a),curl=.15*sin(r*Math.PI);
        const colour=r<.30?heart:r>.9?tip:wash;
        for(const side of [-1,0,1]){
          const h=bell+side*side*curl+side*r*.042;
          top.push(at(r*flare,w*side,h,side===0 && r<.75?crease:colour));
          under.push(at(r*flare,w*side,h-(side===0?.050:0),r<.3?heart:r>.9?tip:reverse));
        }
      }
      for(let j=0;j<sections.length-1;j++){
        for(let k=0;k<2;k++){
          const i=j*3+k;
          m.face(top[i],top[i+1],top[i+3]);m.face(top[i+3],top[i+1],top[i+4]);
          m.face(under[i],under[i+3],under[i+1]);m.face(under[i+3],under[i+4],under[i+1]);
        }
      }
    }else{
      const root=at(.10,0,.024,heart),left=at(.67*flare,-.34,.25,wash);
      const tipL=at(.94*flare,-.22,.28,tip),end=at(1.035*flare,0,.33,tip);
      const tipR=at(.93*flare,.24,.31,tip),right=at(.66*flare,.34,.27,wash);
      const back=at(.56*flare,0,.064,reverse);
      m.face(root,right,tipR);m.face(root,tipR,end);m.face(root,end,tipL);m.face(root,tipL,left);
      m.face(back,left,tipL);m.face(back,tipL,end);m.face(back,end,tipR);m.face(back,tipR,right);
    }
  }
  for(let j=0;j<5;j++)petal(j*TAU/5+.022*sin(j*3.7),.96+.075*sin(j*4.1+dye),.045*cos(j*3),1);
  if(double && detailed)for(let j=0;j<5;j++)petal((j+.5)*TAU/5,.68+.045*cos(j*2.4),.20,.89);

  if(detailed){
    // Fine filaments with separate ochre anthers sit above the red throat.
    for(let j=0;j<6;j++){
      const a=j*2.40,r=.20+.065*sin(j*4),h=.49+.07*cos(j*3.1);
      const foot=ringPoint(a,.088,.19,'#db874e'),neck=[],pollen=[];
      for(let k=0;k<3;k++){
        const b=k*TAU/3;
        neck.push(m.point(cos(a)*r+.026*cos(b),h-.06,sin(a)*r+.026*sin(b),'#ffd990'));
        pollen.push(m.point(cos(a)*r+.055*cos(b),h,sin(a)*r+.055*sin(b),'#ffc160'));
      }
      const cap=ringPoint(a,r,h+.055,'#ffe9a1');
      for(let k=0;k<3;k++){
        const n=(k+1)%3;
        m.face(foot,neck[k],neck[n]);m.face(neck[k],pollen[k],neck[n]);
        m.face(neck[n],pollen[k],pollen[n]);m.face(cap,pollen[n],pollen[k]);
      }
    }
  }else{
    const centre=m.point(0,.45,0,'#ffdb78');
    for(let j=0;j<5;j++)m.face(centre,calyx[(j+1)%5],calyx[j]);
  }
  const g=m.finish();flowers.set(key,g);return g;
}

function newBud(){
  const m=colouredMesh(),base=m.point(0,0,0,'#653941'),tip=m.point(.04,1.22,0,'#ff8c99');
  const lower=[],lip=[];
  for(let j=0;j<6;j++){
    const a=TAU*j/6;
    lower.push(m.point(.43*cos(a),.39,.43*sin(a),j%2?'#924353':'#865e50'));
    lip.push(m.point(.34*cos(a+.16),.88,.34*sin(a+.16),j%2?'#e8486f':'#bc2b59'));
  }
  for(let j=0;j<6;j++){
    const k=(j+1)%6;m.face(base,lower[j],lower[k]);m.face(lower[j],lip[j],lower[k]);
    m.face(lower[k],lip[j],lip[k]);m.face(tip,lip[k],lip[j]);
  }
  return m.finish();
}
function newLeaf(){
  const m=colouredMesh();
  const base=m.point(0,0,0,'#934c4c'),mid=m.point(.49,.12,.015,'#ada46f'),tip=m.point(1,.26,-.09,'#8c8859');
  const left=m.point(.46,.03,-.14,'#746e48'),right=m.point(.52,.06,.15,'#90945e');
  m.face(base,mid,left);m.face(left,mid,tip);m.face(mid,right,tip);m.face(right,mid,base);
  return m.finish();
}
const bud=newBud(),leaf=newLeaf();

// Four shoots fork out of the page and carry flowers directly at their nodes.
// Both detail levels use the very same nodes, orientations and colour choices.
export function peachSprig(form,variant,detailed){
  const key=[form,variant,detailed].join('/');
  if(sprigs.has(key))return sprigs.get(key);
  const rng=seeded(19815+form*2711+variant*1597),s=sculpture();
  const curl=(rng()-.48)*.41,rise=.40+rng()*.26;
  const spine=[vec(0,0,0),vec(.28,.10,curl*.18),vec(.60,rise*.44,curl*.85),vec(.94,rise,curl)];
  const shoots=[spine];
  for(let j=0;j<3;j++){
    const start=spine[j].clone().lerp(spine[j+1],.54+rng()*.29),side=j%2===0?-1:1;
    const reach=.18+rng()*.17,lift=.14+rng()*.22;
    shoots.push([start,start.clone().add(vec(.11,.048,side*reach*.48)),
      start.clone().add(vec(.18+rng()*.12,lift,side*reach))]);
  }
  for(const [i,knots] of shoots.entries()){
    const twig=brushStroke(knots.map(q=>q.toArray()),i===0?[.019,.014,.009,.002]:[.010,.007,.002],
      detailed?(i===0?6:4):knots.length-1,detailed?5:3);
    s.add(twig,i===0?'#613e43':'#78474c');
    for(let j=1;j<knots.length;j++){
      const from=knots[j-1],end=knots[j],count=i===0 || j===2?2:1;
      for(let k=0;k<count;k++){
        // A half-open flower leans down, its neighbour turns up or across.
        const t=(k+.38+rng()*.42)/count,q=from.clone().lerp(end,t);
        const pitch=.50+1.68*rng(),yaw=i*2.19+j*2.51+k*2.84+rng()*.85;
        const size=(.085+.037*rng())*(i===0?1.05:1),dye=rng()<.74?form:Math.floor(rng()*dyes.length);
        const layered=(form===1 || form===4) && rng()<.42;
        s.add(openFlower(dye,layered,detailed),'#ffffff',q.x,q.y,q.z,size,size,size,pitch,yaw);
      }
    }
    const q=knots.at(-1);
    s.add(bud,'#ffffff',q.x,q.y,q.z,.065,.094,.065,.66,rng()*TAU);
    const p=knots[knots.length-2];
    s.add(leaf,'#ffffff',p.x,p.y,p.z,.205,.20,.21,-.35,rng()*TAU,.33);
  }
  const g=s.finish();sprigs.set(key,g);return g;
}
