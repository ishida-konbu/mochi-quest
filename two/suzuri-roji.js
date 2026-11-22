// The formal walk changes from cut nobedan at the gate to river cobbles at
// the hand basin. The paving follows the surveyed ground, including the curb.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { sitePoint } from './retreat-layout.js';
import { regionalSpringLip } from './regional-springs.js';
import { terrainMeshHeight } from './terrain.js';
import { suzuriSurface } from './suzuri-materials.js';

const {PI,cos,sin}=Math,TAU=2*PI;
function sampled(cols,rows,point){
  const pos=[],idx=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    pos.push(...point(i/cols,j/rows));
    const k=j*(cols+1)+i;
    if(i<cols && j<rows)idx.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
function randomGen(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
function dressedStone(poly,ground,thickness,rise){
  const x=poly.reduce((sum,p)=>sum+p[0],0)/poly.length,z=poly.reduce((sum,p)=>sum+p[1],0)/poly.length;
  const pos=[x,ground(x,z)+rise+.008,z],ix=[],n=poly.length;
  for(const [size,h] of [[.963,rise],[1,rise-.021],[.997,rise-thickness]]){
    for(const [px,pz] of poly){
      const u=x+(px-x)*size,v=z+(pz-z)*size;
      pos.push(u,ground(u,v)+h,v);
    }
  }
  for(let i=0;i<n;i++){
    const j=(i+1)%n;
    ix.push(0,1+j,1+i);
    for(let k=1;k<=1+n;k+=n)ix.push(k+i,k+j,k+i+n,k+j,k+j+n,k+i+n);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setIndex(ix);g.computeVertexNormals();return g;
}
function clippedCell(poly,dx,dz,cut){
  const next=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*dx+a[1]*dz-cut,db=b[0]*dx+b[1]*dz-cut;
    if(da<=0)next.push(a);
    if((da<0)!==(db<0)){
      const t=da/(da-db);
      next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
    }
  }
  return next;
}
export function dressSuzuriPaving(p,f,s,level){
  const stone=sculpture(),random=randomGen(1877),palette=['#b7b2a2','#a5a89a','#c2bbac','#acaa9d','#aeb1a1','#b8b6a8'];
  // Interpolate the actual rendered terrain at closely spaced nodes. Adjacent
  // stones share the same earth height along the slopes outside the gate.
  const heights=new Map();
  function corner(i,j){
    const key=i*1000+j;
    if(!heights.has(key))heights.set(key,terrainMeshHeight(...sitePoint(s,i/2,j/2))-level);
    return heights.get(key);
  }
  function ground(x,z){
    const i=Math.floor(x*2),j=Math.floor(z*2),a=x*2-i,b=z*2-j;
    return (1-b)*((1-a)*corner(i,j)+a*corner(i+1,j))+b*((1-a)*corner(i,j+1)+a*corner(i+1,j+1));
  }
  const mainWalk=[[0,6.76],[0,4.01],[4.83,3.97],[8.54,2.95],[10.69,1.92],[18.97,1.92]];
  const segments=mainWalk.slice(1).map((b,i)=>{
    const a=mainWalk[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    return {length,nx:-dz/length,nz:dx/length};
  });
  const miters=mainWalk.map((_,i)=>{
    const before=segments[Math.max(0,i-1)],after=segments[Math.min(segments.length-1,i)];
    const divisor=1+before.nx*after.nx+before.nz*after.nz;
    return [(before.nx+after.nx)/divisor,(before.nz+after.nz)/divisor];
  });
  // Lay long rectangular edge stones either side of the hand-fitted central
  // field. Miter the corners instead of overlapping two rectangular strips.
  for(const [i,seg] of segments.entries()){
    const z0=i===0?.72:.65;
    const map=(d,w)=>{
      const t=d/seg.length;
      return [0,1].map(k=>(1-t)*(mainWalk[i][k]+w*miters[i][k])+t*(mainWalk[i+1][k]+w*miters[i+1][k]));
    };
    const n=Math.ceil(seg.length/1.39);
    for(const side of [-1,1])for(let j=0;j<n;j++){
      const a=j/n*seg.length+.009,b=(j+1)/n*seg.length-.009,w=side*z0,inner=side*(z0-.16);
      stone.add(dressedStone([map(a,Math.min(w,inner)),map(b,Math.min(w,inner)),map(b,Math.max(w,inner)),map(a,Math.max(w,inner))],ground,.082,.065),'#c5c1b2');
    }
    const field=z0-.175,seeds=[],rows=Math.ceil(seg.length/.64);
    for(let j=0;j<rows;j++)for(let k=0;k<2;k++)seeds.push([(j+.19+.60*random())*seg.length/rows,(k-.54+.22*(random()-.5))*field]);
    for(const [a,b] of seeds){
      let poly=[[0,-field],[seg.length,-field],[seg.length,field],[0,field]];
      for(const [c,d] of seeds){
        if(a===c && b===d)continue;
        if(Math.abs(c-a)>2.1)continue;
        poly=clippedCell(poly,c-a,d-b,(c*c+d*d-a*a-b*b)/2);
      }
      if(poly.length>2){
        const snug=poly.map(([x,z])=>map(a+(x-a)*.970,b+(z-b)*.970));
        stone.add(dressedStone(snug,ground,.077,.060),palette[Math.floor(random()*palette.length)]);
      }
    }
  }
  // Additional paving is local to the bath apron and does not fill the roji
  // with tile. Broad irregular slabs form the shoulders where wet feet turn.
  const turnStones=[[-2.16,3.87,1.35,.70],[-3.27,3.58,1.31,.79],[-4.27,3.23,1.04,.72],
    [-4.82,2.66,1.13,.68],[-5.16,1.83,.93,.86],[5.24,2.80,.94,.75],[6.08,2.12,.94,.65],
    [6.57,1.39,.86,.67],[6.91,.63,.91,.70],[7.22,-.14,.91,.69],[7.21,-.85,.79,.66],[7.34,-1.61,1.08,.71]];
  for(const [x,z,w,d] of turnStones){
    const a=Math.atan2(z/s.rz,x/s.rx);
    if(Math.hypot(x/s.rx,z/s.rz)<regionalSpringLip(s.shape,a)*1.10)continue;
    const poly=Array.from({length:9},(_,i)=>{
      const th=i*TAU/9+.14*random(),r=.89+.18*random();
      return [x+cos(th)*w*.55*r,z+sin(th)*d*.55*r];
    });
    stone.add(dressedStone(poly,ground,.095,.072),palette[Math.floor(random()*palette.length)]);
  }
  p.shapes.suzuriNobedan=stone.finish();f.put('suzuriNobedan',0,0,0,1,1,1,'#fff',suzuriSurface('granite'));
}

function turned(profile,n=42){
  return new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),n);
}
function riverRock(seed,cols=14,rows=8){
  return sampled(cols,rows,(u,v)=>{
    const a=TAU*u,b=PI*v,sw=sin(b),q=1+.081*cos(3*a+seed)+.055*cos(5*a-seed)*sw;
    return [cos(a)*sw*q,cos(b)*(.87+.11*cos(3*a)*sw)+.096*sin(a+seed)*sw, sin(a)*sw*q];
  });
}
function waterMaterial(clock){
  const mat=new T.MeshPhysicalMaterial({color:'#5b7c70',roughness:.17,metalness:0,transparent:true,
    opacity:.75,clearcoat:.42,clearcoatRoughness:.18,depthWrite:false,side:T.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.uniforms.gardenTime=clock;
    shader.vertexShader='varying vec3 gardenSurface;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\ngardenSurface=position;');
    shader.fragmentShader='varying vec3 gardenSurface;uniform float gardenTime;\n'+shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec2 delta=gardenSurface.xz-(gardenSurface.y>.4?vec2(.035,.008):vec2(.074,.648));
        float distanceFromDrop=length(delta);
        float ripple=.046*cos(distanceFromDrop*102.-gardenTime*7.2)*exp(-distanceFromDrop*6.);
        vec2 tilt=delta/max(.008,distanceFromDrop)*ripple;
        normal=normalize(normal+mat3(viewMatrix)*vec3(tilt.x,0.,tilt.y));`);
  };
  return mat;
}

// Opposite leaflets taper to a curved tip; all fronds point out of one crown
// in a shaded pocket between the stones.
function fern(model,x,z,scale,seed){
  const random=randomGen(seed),shade=['#697b53','#829263','#758b60','#92a06f'];
  for(let j=0;j<8;j++){
    const a=TAU*(j+.32*random())/8,reach=scale*(.57+.51*random()),height=scale*(.59+.34*random());
    const at=t=>[x+cos(a)*reach*t**1.25,.12+height*(1.42*t-.85*t*t),z+sin(a)*reach*t**1.25];
    const path=Array.from({length:7},(_,i)=>at(i/6));
    model.stroke('#848c5d',path,[.009,.008,.007,.006,.005,.003,.001],9);
    for(let i=1;i<11;i++)for(const side of [-1,1]){
      const t=(i+.22*(side+1))/12,b=at(t),size=reach*(.055+.20*sin(PI*t))*(1-.4*t);
      const la=a+side*(1.08-.51*t);
      const leaf=sampled(2,5,(u,v)=>{
        const spread=(u-.5)*size*.43*sin(PI*v);
        return [b[0]+cos(la)*size*v-sin(la)*spread,b[1]+size*(.35*sin(PI*v)+.12*v+.15*(1-Math.abs(u*2-1))*sin(PI*v)),
          b[2]+sin(la)*size*v+cos(la)*spread];});
      model.add(leaf,shade[(i+j)%4]);
    }
  }
}

export function dressSuzuriRoji(p,f){
  const stone=sculpture(),moss=sculpture(),craft=sculpture(),flow=sculpture(),water=sculpture(),random=randomGen(38104);
  const bx=7.45,bz=-3.69,rockColors=['#6c746c','#747469','#7b8278','#5f675f','#8a877b'];
  const rocks=Array.from({length:6},(_,i)=>riverRock(i+.2));
  const gravel=Array.from({length:6},(_,i)=>riverRock(i+.2,8,4));
  // Hachimae, two attendant stones and a sunken bed of wet river gravel.
  // The top of the foremost stone is level enough to kneel and reach the bowl.
  const pond=(x,z)=>.14*((x-.05)/1.4)**2+.14*((z-.37)/1.09)**2;
  for(let j=0;j<475;j++){
    const a=random()*TAU,r=Math.sqrt(random()),x=.11+r*1.47*cos(a),z=.45+r*1.07*sin(a);
    const size=.044+.054*random(),h=.065+pond(x,z);
    stone.add(gravel[j%6],rockColors[j%5],x,h,z,size,size*(.50+.28*random()),size*(.70+.42*random()),.15,a);
  }
  for(const [x,z,w,h,d,yaw] of [[-.12,1.24,.58,.15,.34,-.20],[-.78,.46,.38,.24,.32,.41],
    [.84,.32,.36,.34,.31,-.38],[1.19,.84,.29,.17,.27,1.12],[-.62,-.44,.35,.22,.29,.74]]){
    stone.add(rocks[Math.floor(random()*6)],'#787f73',x,.10+h*.31,z,w,h,d,0,yaw);
  }
  for(let j=0;j<63;j++){
    const a=random()*TAU,r=.82+.28*random(),x=.04+1.50*r*cos(a),z=.36+1.12*r*sin(a);
    if(z<-.96||x<-.99||x>1.42||z>1.12 && Math.abs(x)<.55)continue;
    const size=.084+.23*random();
    moss.add(rocks[j%6],['#75805b','#8a9067','#747e55','#697451'][j%4],x,.105,z,size,.09+.067*random(),size*(.9+.4*random()),0,a);
  }
  for(const [x,z,size,seed] of [[-.83,-.33,.55,29],[1.17,-.02,.62,32],[1.22,.56,.44,41],[-.98,.18,.34,87]])
    fern(craft,x,z,size,seed);
  // A pocket carved down into a single natural boulder. The slightly lowered
  // lip in front is the overflow; its dark lining remains visible through water.
  const rings=[[.14,.025],[.49,.057],[.60,.21],[.62,.36],[.59,.55],[.55,.68],[.51,.727],[.41,.736],[.349,.694],
    [.335,.60],[.296,.47],[.228,.405],[.10,.384],[.002,.382]];
  const notch=a=>Math.exp(-Math.pow(Math.atan2(sin(a-PI*.46),cos(a-PI*.46))/.195,2));
  const rim=(a,k)=>{
    const [rad,y]=rings[k],rough=.070*cos(3*a+.71)+.043*cos(5*a-.32)+.022*sin(7*a+1.1);
    const exterior=k<8?1:.32,q=rad*(1+rough*exterior);
    const cut=k>=5&&k<=9?notch(a)*[.023,.061,.067,.047,.018][k-5]:0;
    return [q*cos(a),y+.028*(.54*cos(2*a)+.5*cos(3*a+.4))*exterior-cut,q*sin(a)*.92];
  };
  for(let k=0;k<rings.length-1;k++){
    stone.add(sampled(68,1,(u,v)=>{const a=u*TAU,b=rim(a,k),c=rim(a,k+1);return b.map((w,i)=>w+(c[i]-w)*v);}),
      k<4?'#707668':k<9?'#85877b':'#55625d');
  }
  const waterY=.657;
  water.add(turned([[.001,waterY],[.329,waterY],[.348,waterY-.008]],68),'#c1d3c1',0,0,0,1,1,.937);
  // Water escapes through the low notch and darkens the front of the rock.
  // The thin film clings to the face before dropping into a gravel sump.
  const spill=(u,v)=>{
    const a=PI*.46+(u-.5)*(.108-.061*v),k=7-5*v;
    const level=Math.floor(k),b=rim(a,level),c=rim(a,level+1),fract=k-level;
    return [b[0]+(c[0]-b[0])*fract+.002*cos(a),b[1]+(c[1]-b[1])*fract+.002,b[2]+(c[2]-b[2])*fract+.003*sin(a)];
  };
  flow.add(sampled(6,21,spill),'#647d71');
  flow.stroke('#728b7f',[[.072,.217,.552],[.073,.191,.579],[.074,.154,.615],[.075,.102,.648]],[.015,.013,.008,.006],12);
  water.add(turned([[.001,.101],[.459,.101],[.465,.098]],48),'#8eaaa0',.06,0,.727,.74,1,.66);
  // Water is carried from the wall in a bored bamboo culm. It rests in the
  // fork of a bamboo prop; its oblique cut reveals a hollow amber interior.
  const from=new T.Vector3(.93,1.114,-.56),to=new T.Vector3(.102,1.008,-.042),axis=to.clone().sub(from).normalize();
  const right=new T.Vector3(0,1,0).cross(axis).normalize(),up=axis.clone().cross(right),vec=new T.Vector3();
  const point=(u,t,r,cut=0)=>{
    const a=u*TAU;
    vec.copy(from).lerp(to,t).addScaledVector(right,r*cos(a)).addScaledVector(up,r*sin(a)).addScaledVector(axis,cut*sin(a));
    return vec.toArray();
  };
  craft.add(sampled(32,8,(u,v)=>point(u,v,.070-.008*v,-.047*v*v)),'#929269');
  craft.add(sampled(32,3,(u,v)=>point(u,.81+.19*v,.048,-.047*v)),'#756143');
  craft.add(sampled(32,1,(u,v)=>point(u,1,.048+.014*v,-.047)),'#d3bf89');
  for(const t of [.13,.52,.84])craft.add(sampled(32,4,(u,v)=>point(u,t+(v-.5)*.030,.069+.007*sin(PI*v))),'#747a57');
  craft.stroke('#777e58',[[.67,.10,-.38],[.69,.61,-.40],[.69,1.15,-.42]],[.051,.046,.042],10);
  for(let j=0;j<3;j++){
    const q=Array.from({length:15},(_,i)=>[.69+.079*cos(TAU*i/14),1.054+.014*j+.032*sin(TAU*i/14),-.415+.090*sin(TAU*i/14)]);
    craft.stroke('#625542',q,Array(15).fill(.009),16);
  }
  // A ladle lies across two individual rails, with its coopered cup upside down.
  for(const x of [-.24,.23])craft.stroke('#af986e',[[x,.73,-.34],[x,.76,.02],[x+.02,.732,.35]],[.015,.020,.015],10);
  craft.stroke('#b29a6c',[[-.37,.794,.13],[-.07,.801,.11],[.25,.798,.082]],[.019,.014,.011],10);
  craft.add(turned([[.098,.025],[.098,.038],[.078,.137],[.006,.14]]),'#b8a077',.29,.762,.071);
  craft.add(turned([[.092,.049],[.094,.052],[.094,.058],[.092,.06]]),'#766e50',.29,.762,.071);
  flow.stroke('#b8d3c7',[[.10,1.008,-.042],[.076,.967,-.024],[.050,.857,-.007],[.035,waterY,.008]],[.015,.013,.009,.007],17);
  // Openings in the Oribe lantern are pierced right through the stone. Its
  // gently upswept kasa sheds rain beyond the four small corner piers.
  const lx=.90,lz=-.47;
  stone.add(turned([[.25,0],[.28,.053],[.26,.113],[.172,.15],[.15,.25],[.152,.61],[.19,.68],
    [.258,.696],[.281,.74],[.27,.777],[.198,.79]],8),'#818374',lx,.09,lz);
  for(const dx of [-.139,.139])for(const dz of [-.139,.139])stone.box('#888b7e',lx+dx,1.044,lz+dz,.066,.334,.066);
  stone.add(turned([[.198,1.201],[.27,1.225],[.326,1.21],[.338,1.235],[.273,1.297],[.183,1.355],[.106,1.412]],4),
    '#777d70',lx,0,lz,1,1,1,0,PI/4);
  stone.add(turned([[.08,1.392],[.086,1.433],[.055,1.451],[.087,1.50],[.069,1.556],[.006,1.622]],22),'#919281',lx,0,lz);
  craft.add(turned([[.055,.886],[.055,.908],[.039,.913],[.042,1.008],[.007,1.032]],12),'#cdad76',lx,0,lz);
  const pieces=[
    ['suzuriRojiGranite',stone,suzuriSurface('granite')],['suzuriRojiMoss',moss,suzuriSurface('moss')],
    ['suzuriKakehi',craft,p.stems],['suzuriRojiWater',water,waterMaterial(p.sway)],['suzuriRojiDrip',flow,p.springFlow]
  ];
  for(const [name,model,mat] of pieces){
    p.shapes[name]=model.finish();
    f.put(name,bx,.05,bz,1,1,1,model===flow?'#8faea2':'#fff',mat);
  }
}
