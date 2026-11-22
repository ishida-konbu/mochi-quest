import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { roundedStone } from './pigments.js';

// The maple grows out of the moss behind the tsukubai. Its longest limb
// leans towards the inkstone; lower branches shade the water basin.
const {sin,cos,PI}=Math;
const tau=2*PI;
function mapleLeaf(){
  const positions=[0,0,0],color=[.93,.96,.90],triangles=[];
  function point(a,r,lift,shade){
    positions.push(r*cos(a),lift,r*sin(a));color.push(shade,shade,shade*.95);
    return positions.length/3-1;
  }
  // The midrib stands proud of each narrow palmate lobe. Shallow teeth
  // interrupt both edges and the bottom two lobes turn back towards the stalk.
  for(let lobe=-3;lobe<=3;lobe++){
    const a=lobe*.545,reach=1-.103*Math.abs(lobe);
    const ridge=point(a,reach*.53,.09,1.18);
    let prev=0;
    for(const [t,angle] of [[.22,-.52],[.38,-.45],[.43,-.25],[.55,-.32],[.58,-.19],
      [.71,-.22],[1,0],[.72,.18],[.66,.15],[.51,.30],[.47,.23],[.35,.42],[.21,.50]]){
      const v=point(a+angle*.54,reach*t,-.11*t*t+.022*cos(lobe),.92+.10*t);
      triangles.push(prev,ridge,v);prev=v;
    }
    triangles.push(prev,ridge,0);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));
  g.setIndex(triangles);g.computeVertexNormals();return g;
}

function maple(s,placeLeaf){
  const palette=['#919151','#939957','#b4a055','#9d934e','#ada55d','#be814c','#9f7348'];
  const point=(x,y,z)=>new T.Vector3(x,y,z);
  let noise=93423;
  const random=()=>{noise=(Math.imul(noise,1664525)+1013904223)>>>0;return noise/4294967296;};
  function limb(knots,radii,shade){
    s.stroke(shade,knots,radii,Math.max(9,knots.length*3));
    return new T.CatmullRomCurve3(knots.map(([x,y,z])=>point(x,y,z)));
  }
  const trunk=limb([[0,-.12,0],[-.09,.32,.015],[.14,.98,.12],[.04,1.42,.17],
    [-.22,1.94,.21],[-.40,2.33,.30],[-.57,2.75,.26]], [.19,.152,.120,.101,.080,.060,.036],'#706858');
  for(let j=0;j<7;j++){
    const a=j*2.399,reach=.25+.25*random();
    limb([[.07*cos(a),.23,.07*sin(a)],[.18*cos(a),.092,.18*sin(a)],
      [reach*cos(a),.033,reach*sin(a)]],[.062,.047,.004],'#766f5c');
    const marks=Array.from({length:7},(_,i)=>{
      const t=.07+i*.121,p=trunk.getPoint(t),w=.150*(1-t)+.04;
      return [p.x+w*cos(a+.31*sin(t*6)),p.y,p.z+w*sin(a+.31*sin(t*6))];});
    s.stroke(j%2?'#8c806c':'#554c40',marks,[.002,.008,.009,.006,.007,.004,.001],12);
  }
  const arms=[
    [.28,-1.53,1.60,.45], [.38,.92,1.97,.52],[.51,-1.85,2.35,.22],
    [.61,.76,2.86,-.16],[.62,-.38,2.62,.92],[.73,-1.71,2.94,.49],
    [.83,-.40,3.38,-.08],[.86,.22,3.37,.55],[.98,-.95,3.52,.30],
  ];
  for(const [j,[t,x,y,z]] of arms.entries()){
    const start=trunk.getPoint(t),end=point(x,y,z),sweep=end.clone().sub(start);
    const joint=start.clone().addScaledVector(sweep,.47);
    joint.y-=.24;joint.z+=.08*cos(j);
    const bough=limb([start.toArray(),joint.toArray(),[x-sweep.x*.19,y-.22,z-.08],end.toArray()],
      [.077-.003*j,.056,.036,.015],'#786d58');
    for(let k=0;k<7;k++){
      const u=.23+.755*k/6,p=bough.getPoint(u),dir=j*2.18+k*2.37;
      const reach=.30+random()*.28,tip=p.clone().add(point(reach*cos(dir),.18+random()*.19,reach*sin(dir)));
      const m=p.clone().lerp(tip,.54);m.y+=.08;
      const fork=limb([p.toArray(),m.toArray(),tip.toArray()],[.019,.014,.004],'#87765b');
      for(let n=0;n<5;n++){
        const base=fork.getPoint(.25+n*.17);
        const a=dir+n*2.399,span=.15+random()*.17,dx=span*cos(a),dz=span*sin(a);
        limb([base.toArray(),[base.x+.62*dx,base.y+.057,base.z+.62*dz],[base.x+dx,base.y+.073,base.z+dz]],
          [.007,.005,.002],'#91735b');
        for(let i=0;i<4;i++){
          const f=.36+i*.21,la=a+(i%2===0?-1:1)*.82;
          const size=.064+random()*.049,stalk=size*.56;
          const lx=base.x+dx*f+stalk*cos(la),lz=base.z+dz*f+stalk*sin(la);
          const isTip=i===3 && (k+j)%3===0;
          const col=palette[isTip?5+(n%2):Math.floor(random()*5)];
          placeLeaf(lx,base.y+.074+.022*sin(i),lz,size,col,-la,.2+.35*random(),.47*(random()-.5));
        }
      }
    }
  }
}

export function dressSuzuriMaple(p,f){
  const s=sculpture();
  const stone=roundedStone(.73);
  for(const [x,z,w,h,d] of [[-.46,.08,.68,.12,.34],[-.78,.16,.31,.22,.24],
    [.20,.14,.70,.115,.42],[.55,-.08,.38,.23,.34],[-.14,.27,.26,.135,.30]]){
    s.add(stone,'#8b8e79',x,h*.31,z,w,h,d,0,x);
    s.add(stone,'#87905c',x-.025,h*.75,z+.012,w*.88,h*.62,d*.90,0,x);
  }
  // Cut the palmate outline once. More than a thousand differently placed
  // and pigmented leaves can share its vertex buffers and a single draw.
  p.shapes.suzuriMapleLeaf=mapleLeaf();
  p.shapes.suzuriMapleLeaf.userData.range=96;
  maple(s,(x,y,z,size,shade,yaw,pitch,roll)=>{
    f.put('suzuriMapleLeaf',7.36+x,.061+y,-4.12+z,size,size,size,shade,p.stems,yaw,pitch,roll);
  });
  p.shapes.suzuriCourtyardTree=s.finish();
  f.put('suzuriCourtyardTree',7.36,.061,-4.12,1,1,1,'#fff',p.stems);
}
