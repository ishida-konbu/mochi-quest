import { blossomGeometry, peachMaterials, createPeachOrchard } from './flowering-peaches.js';
import { DISTRICTS } from './geography.js';
import { summitJoinery, orchardCarving, kesaMaterial } from './pilgrimage-carving.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';
import { paintPeachCliffs } from './pilgrimage-cliffs.js';
import { foxParties } from './pilgrimage-foxes.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';
import * as T from './vendor/three.module.min.js';
import { terrainHeight, seeded, wrapDelta } from './terrain.js';
import { DAIBUTSU, PEACH, PEACH_TREES, WEDDING_SITES, weddingPoint, MOON_GATE, INARI_GATES, INARI_SANCTUARY, TEMPLE_COLUMNS } from './pilgrimage-layout.js';

const { sin,cos,PI,abs,hypot,min,max } = Math, TAU=PI*2;
const vec=(...v)=>new T.Vector3(...v);
const rice='#efe3c7', ochre='#be9457', vermilion='#cd492d';

function drawing(width,height,paint) {
  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  paint(canvas.getContext('2d'),width,height);
  const tex=new T.CanvasTexture(canvas);
  tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=4;
  return tex;
}
function inscription(glyphs,board,paint='#dec69a') {
  return new T.MeshLambertMaterial({map:drawing(128,256,(c,w,h)=>{
    if(board) {
      c.fillStyle=board; c.fillRect(0,0,w,h);
      c.strokeStyle=paint;c.lineWidth=3;c.strokeRect(5,5,w-10,h-10);
    }
    c.fillStyle=paint; c.font='bold 88px "Hiragino Mincho ProN","Yu Mincho",serif';
    c.textAlign='center';c.textBaseline='middle';
    [...glyphs].forEach((ch,i)=>c.fillText(ch,w/2,h*(i+.5)/glyphs.length));
  }), side:T.DoubleSide, alphaTest:.24});
}
function frame(p,x,z,yaw=0,base=terrainHeight(x,z)){
  const at=(a,b,c)=>vec(x+a*cos(yaw)+c*sin(yaw),base+b,z-a*sin(yaw)+c*cos(yaw));
  return {
    part(shape,a,b,c,sx,sy,sz,color,mat=p.fine,ry=0,rx=0,rz=0,shadow=true){
      const q=at(a,b,c);
      p.part(shape,q.x,q.y,q.z,sx,sy,sz,color,yaw+ry,rx,rz,mat,shadow,true);
    },
    line(a,b,r,tint,mat=p.wood,shadow=true){ p.link(at(...a),at(...b),r,tint,false,shadow,true,mat); },
  };
}

function toriiGeometry() {
  const s=sculpture();
  // Normalised in aperture width and beam height, with buried feet on the mountainside.
  for(const d of [-1,1]){
    s.post('#d64c27',d*.356,.39,0,.039,1.20,.039,0,0,d*.018);
    s.post('#413f36',d*.363,-.002,0,.045,.42,.045);
    s.post('#654635',d*.36,.206,0,.046,.036,.046);
    s.box('#b13620',d*.345,.75,0,.102,.064,.074);
  }
  s.box('#e05a2d',0,.745,0,.911,.047,.052);
  s.box('#c64125',0,.84,0,.046,.16,.046);
  // A crowned kasagi tapers continuously toward either tip. Carry the dark
  // lacquer lip under the eave so the distant corridor reads as a brushed arc.
  function beam(y,thickness,depth,span,color){
    const xyz=[],ix=[],profile=[[-1,-.32],[-.9,-.53],[.84,-.53],[1,-.25],[1,.34],[.74,.55],[-.76,.55],[-1,.27]];
    for(let i=0;i<=10;i++){
      const u=i/10-.5,r=Math.abs(u)*2,rise=.055*r*r+.010*r**5;
      for(const [z,h] of profile) xyz.push(u*span,y+rise+thickness*h,z*depth*(1+.23*r*r));
      if(i===10)continue;
      for(let k=0;k<8;k++){const a=i*8+k,b=i*8+(k+1)%8;ix.push(a,b,a+8,b,b+8,a+8);}
    }
    for(let j=1;j<7;j++) ix.push(0,j+1,j,80,80+j,81+j);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(ix);
    g.computeVertexNormals();s.add(g,color);
  }
  beam(.908,.053,.041,1.032,'#c14827');
  beam(.948,.041,.053,1.078,'#463e35');
  beam(.966,.013,.050,1.082,'#736b52');
  return s.finish();
}

function lantern(f,u,z,scale=1) {
  const s=scale;
  f.part('rock',u,.13*s,z,.62*s,.21*s,.62*s,'#859080');
  f.part('shaft',u,.11*s,z,.38*s,1.16*s,.38*s,'#879284');
  f.part('round',u,1.27*s,z,.45*s,.14*s,.45*s,'#7b8578');
  f.part('box',u,1.56*s,z,.50*s,.48*s,.50*s,'#c7ad79');
  for(const i of [-1,1])for(const j of [-1,1])
    f.part('box',u+i*.265*s,1.56*s,z+j*.265*s,.075*s,.51*s,.075*s,'#576358');
  f.part('kasa',u,1.81*s,z,.65*s,.48*s,.65*s,'#849083');
  f.part('finial',u,2.28*s,z,.19*s,.33*s,.19*s,'#788172');
}
function summit(p) {
  const {x,z}=INARI_SANCTUARY, f=frame(p,x,z);
  f.part('box',0,.35,0,7.7,.8,6.2,'#939183',p.masonry);
  f.part('box',0,2.18,0,6.6,3,5.23,'#c8ac83',p.boarding);
  for(const u of [-3.22,-1.18,1.18,3.22]) f.part('round',u,2.22,2.6,.16,3.66,.16,vermilion);
  f.part('box',0,2.1,2.64,2.08,2.50,.12,'#71533b',p.wood);
  for(const u of [-.6,0,.6]) f.part('box',u,2.15,2.73,.10,2.41,.07,'#bea06c');
  f.part('hipRoof',0,3.97,0,9.1,3.37,7.68,'#6b736b',p.roofs);
  f.part('box',0,7.27,0,3.93,.22,.32,'#a68e62');
  f.part('hipRoof',0,3.34,2.70,5.64,1.44,3.41,'#647066',p.roofs);
  for(const side of [-1,1]){
    f.part('round',side*2.16,1.75,3.53,.12,3.54,.12,vermilion);
    lantern(f,side*5,3.9);
  }
  summitJoinery(p,f);
  const sign=inscription('稲荷','#47554d');
  f.part('plane',0,3.08,2.77,.51,.94,1,'#ffffff',sign);
}
function weddingPaths(p) {
  const sign=inscription('縁結',null,'#eee3c8');
  for(const [idx,s] of WEDDING_SITES.entries()){
    const pos=[],uv=[],indices=[], length=4*(s.rx-s.rz)+TAU*s.rz;
    for(let i=0;i<=100;i++){
      const dist=length*i/100, q=weddingPoint(s,dist);
      for(const side of [-1,1]){
        const w=side*(.67+.083*sin(dist*1.67)+.052*sin(dist*3.09));
        const x=q.x+w*cos(q.yaw),z=q.z-w*sin(q.yaw);
        pos.push(x-s.x,terrainHeight(x,z)+.06,z-s.z);uv.push(side<0?0:1,dist*.47);
      }
      const k=i*2;
      if(i<100) indices.push(k,k+1,k+2,k+1,k+3,k+2);
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(indices);g.computeVertexNormals();
    const name='bridalWalk'+idx;p.shapes[name]=g;p.part(name,s.x,0,s.z,1,1,1,'#b7a68b',0,0,0,p.solid,false,true);
    for(const side of [-1,1]){
      const x=s.x+side*(s.rx+1.8), f=frame(p,x,s.z,.3*side);
      f.line([0,-.15,0],[0,2.67,0],.049,'#87704b');
      f.line([-.04,2.51,0],[.70,2.51,0],.036,'#9b8356');
      f.part('box',.34,1.82,0,.55,1.31,.026,idx%2?'#788779':'#ac6453');
      f.part('plane',.34,1.86,.018,.34,.80,1,'#ffffff',sign);
    }
  }
}
function* inari(p) {
  p.shapes.senbon=toriiGeometry();
  const pigments=surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true}),.19),8);
  const cartouches=['稲荷','白狐','奥社'].map(name=>inscription(name,'#504e3b','#e6c480'));
  const donation=inscription('奉納',null,'#312b25');
  for(const [i,g] of INARI_GATES.entries()) {
    const y=terrainHeight(g.x,g.z);
    p.part('senbon',g.x,y,g.z,g.width,g.height,g.width,
      ['#fff7ef','#f5e0ce','#ffe8cc','#fae1d3'][i%4],g.yaw,0,0,pigments,true,true);
    if(i%4===0) {
      const f=frame(p,g.x,g.z,g.yaw,y);
      for(const side of [-1,1]) f.part('plane',side*g.width*.348,g.height*.53,-g.width*.038,
        .20,.68,1,'#ffffff',donation,PI,0,0,false);
    }
    if(i%125===0 || i===999){
      const f=frame(p,g.x,g.z,g.yaw,y), w=g.width,h=g.height;
      f.part('box',0,h*.833,-.24,.65,.94,.11,'#cba771');
      f.part('plane',0,h*.833,-.307,.56,.85,1,'#fff',cartouches[i===999?2:i?1:0],PI);
      const braid=a=>h*.72-.44*(1-(a/(w*.346))**2);
      for(let n=0;n<18;n++){
        const x0=w*.692*(n/18-.5),x1=w*.692*((n+1)/18-.5);
        f.line([x0,braid(x0),-.236],[x1,braid(x1),-.236],.046,n%2?'#9f8d6d':'#c6b38a');
      }
      for(let n=0;n<5;n++){
        const u=(n-2)*w*.128;
        f.part('streamer',u,braid(u)-.11,-.233,.37,.45,.29,'#f0e6c9',p.fine,0,0,.057*sin(i+n),false);
      }
      yield;
    }
  }
  summit(p);
  weddingPaths(p);
}

// An individual spray carries dry-brushed wood, five-petalled blossoms and buds.
// Transparent gaps between the flowers let the drawing of the branches read against the sky.
function washTexture(file){
  const map=new T.TextureLoader().load(new URL('./assets/world/'+file+'.webp',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace; map.anisotropy=4;return map;
}
function oldPeach(p,art,bloom){
  const {x,z}=MOON_GATE, f=frame(p,x,z,PI/2), tree=sculpture();
  // An old spreading tree takes root beside the moon gate. Its hollowed trunk
  // turns the corner of the roof and the high boughs enclose a patch of sky.
  const timber=[
    [[[5.66,-.92,-.84],[5.73,.69,-.65],[5.32,1.72,-.51],[5.88,3.23,-.62],[5.23,4.58,-.52],[4.16,4.92,-.32],
      [3.65,5.47,-.16],[1.90,5.72,-.11],[.89,5.56,.02],[-.91,6.05,-.29],[-2.35,6.25,-.31]],[.83,.72,.55,.43,.37,.29,.24,.19,.14,.086,.015]],
    [[[5.67,.10,-.26],[5.21,1.08,-.16],[5.47,2.27,-.39],[6.11,3.32,-.51],[6.65,3.92,-.42],[6.80,4.85,-.57],[7.83,5.24,-.68]],[.49,.43,.30,.25,.174,.104,.015]],
    [[[5.68,2.97,-.72],[5.74,4.11,-.87],[5.23,5.59,-1.23],[5.51,6.56,-1.64],[5.23,7.17,-1.91]],[.31,.24,.146,.084,.012]],
    [[[3.81,5.35,-.19],[3.03,6.28,-.33],[2.12,6.80,-.53],[1.62,7.39,-.48]],[.166,.127,.072,.009]],
    [[[2.05,5.70,-.12],[1.47,5.37,.39],[.54,5.18,.74],[-.23,5.25,.72]],[.14,.088,.045,.01]],
    [[[-.82,6.03,-.29],[-1.41,6.57,-.50],[-1.85,6.83,-.66],[-2.06,7.23,-.53]],[.088,.071,.039,.009]],
  ];
  const buds=[];
  for(const [j,[knots,widths]] of timber.entries()){
    tree.stroke(j%2?'#65544d':'#574b42',knots,widths,knots.length*3);
    for(const side of [-1,1]){
      const streak=knots.map(([a,y,b],k)=>[a+side*widths[k]*.23,y,b+widths[k]*.82]);
      tree.stroke(side<0?'#3f3933':'#ac9880',streak,widths.map(w=>w*(side<0?.084:.142)),knots.length*3);
    }
    const tip=knots.at(-1), prev=knots.at(-2);
    buds.push([tip,Math.atan2(-(tip[2]-prev[2]),tip[0]-prev[0])]);
    for(let k=2;k<knots.length-1;k+=2){
      const q=knots[k],a=k*2.23+j;
      const twig=[q,[q[0]+.43*cos(a),q[1]+.60,q[2]+.37*sin(a)],
        [q[0]+1.03*cos(a),q[1]+1.14,q[2]+.83*sin(a)]];
      tree.stroke('#6f5950',twig,[widths[k]*.48,.072,.014],10);buds.push([twig.at(-1),-a]);
    }
  }
  for(let i=0;i<7;i++){
    const a=i*2.4;
    tree.stroke('#6e5b4d',[[5.65,.32,-.76],[5.68+.67*cos(a),-.02,-.77+.56*sin(a)],
      [5.70+1.63*cos(a),-.36,-.82+1.28*sin(a)]],[.28,.25,.041],7);
  }
  p.shapes.gatePeach=tree.finish();
  f.part('gatePeach',0,0,0,1,1,1,'#fff',brushWash(new T.MeshLambertMaterial({vertexColors:true}),.37));
  for(const [i,[tip,yaw]] of buds.entries()){
    for(let j=0;j<4;j++){
      const a=yaw+(j-1.5)*.87,w=2.16+.65*cos(i+j);
      f.part('peachSprig',...tip,w*1.13,w*.77,1,'#fff7ed',j===1?art:bloom,a,.49-.26*j,-.18+.12*j,false);
    }
  }
}
function gateBlossoms(p) {
  p.shapes.peachSprig=blossomGeometry();
  const {ink,flowers}=peachMaterials();
  oldPeach(p,ink,flowers);
}
function groveShrine(p){
  const f=frame(p,MOON_GATE.x,MOON_GATE.z,PI/2);
  // A circular opening is cut all the way through a whitewashed garden wall.
  const wall=new T.Shape();
  wall.moveTo(-4.83,-1);wall.lineTo(4.83,-1);wall.lineTo(4.83,4.64);wall.lineTo(-4.83,4.64);wall.closePath();
  const opening=new T.Path();
  opening.absarc(0,1.75,2.09,0,TAU,true);wall.holes.push(opening);
  p.shapes.gardenMoonWall=new T.ExtrudeGeometry(wall,{depth:.51,bevelEnabled:false,curveSegments:42});
  f.part('gardenMoonWall',0,0,-.26,1,1,1,'#e6ddc6');
  p.shapes.gardenMoonRim=new T.TorusGeometry(2.095,.102,8,61);
  for(const side of [-1,1]) f.part('gardenMoonRim',0,1.75,side*.274,1,1,1,'#858b80');
  f.part('hipRoof',0,4.63,0,10.17,.72,1.37,'#788279',p.roofs);
  orchardCarving(p,f);
  for(const side of [-1,1]){
    f.part('box',side*4.61,1.73,.027,.38,5.29,.70,'#c6c6b2');
    f.part('box',side*4.64,4.29,.03,.63,.22,.86,'#858a7b');
    for(let i=0;i<3;i++)f.part('box',side*(3.05+.35*i),2.23,.27,.18,.58,.065,'#a7ad99');
  }
}
function fallenBlossoms(p) {
  const rng=seeded(96254), bins=new Map(), colors=['#f493a1','#fed3d4','#da788e','#e8a29c','#fff0db'].map(c=>new T.Color(c));
  const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true,emissive:'#a68b81',emissiveIntensity:.14});
  for(const tree of PEACH_TREES){
    for(let j=0;j<(tree.cliff?7:48);j++){
      const a=rng()*TAU,d=(.21+rng()**.7*4.32)*tree.size;
      const x=tree.x+cos(a)*d,z=tree.z+sin(a)*d, key=Math.floor(x/30)+','+Math.floor(z/30);
      if(!bins.has(key))bins.set(key,{x,z,p:[],c:[],idx:[]});
      const b=bins.get(key), k=b.p.length/3, color=colors[Math.floor(rng()*colors.length)];
      const spin=rng()*TAU,len=.045+rng()*.078,wid=len*(.39+rng()*.31),y=terrainHeight(x,z)+.069;
      for(const [u,v] of [[0,-len],[-wid,.09*len],[-wid*.65,.76*len],[0,.60*len],[wid*.65,.78*len],[wid,0]]){
        b.p.push(x-b.x+cos(spin)*u+sin(spin)*v,y+(v>0?.008:0),z-b.z-sin(spin)*u+cos(spin)*v);
        b.c.push(color.r,color.g,color.b);
      }
      b.idx.push(k,k+1,k+3,k+1,k+2,k+3,k,k+3,k+5,k+3,k+4,k+5);
    }
  }
  for(const [key,b] of bins){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setIndex(b.idx);
    g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeVertexNormals();
    const id='peachPetals'+key;p.shapes[id]=g;
    p.part(id,b.x,0,b.z,1,1,1,'#fff',0,0,0,material,false,true);
  }
}
function daibutsuden(p) {
  const {x,z}=DAIBUTSU, f=frame(p,x,z);
  const pillars='#9e5941', beam='#74503a', roof='#5c6862';
  f.part('box',0,-.19,0,34.4,.62,23.4,'#a2a497',p.masonry);
  f.part('box',0,.12,0,33.9,.14,23.2,'#d0baa0',p.deck);
  f.part('box',0,10.25,-11.4,33.1,20.4,.85,'#78776a',p.solid);
  // A continuous offering procession runs behind the openwork aureole, with
  // the lotus-leaf parasol and stretched silk deliberately visible at the sides.
  const painting=washTexture('lotus-offerings');
  const wallArt=new T.MeshLambertMaterial({map:painting,emissiveMap:painting,emissive:'#d4c8af',emissiveIntensity:.35});
  f.part('plane',0,10.33,-10.94,31.1,18.83,1,'#fff',wallArt,0,0,0,false);
  for(const side of [-1,1]){
    f.part('box',side*15.67,10.33,-10.81,.24,19.32,.14,'#64543e');
    f.part('box',0,10.33+side*9.48,-10.81,31.56,.18,.14,'#796b4b');
  }
  for(const [u,v] of TEMPLE_COLUMNS){
    f.part('round',u,.32,v,.89,.36,.89,'#a1a397',p.stone);
    f.part('round',u,11,v,.59,21.8,.59,pillars,p.lacquer);
    for(let k=0;k<3;k++){
      f.part('box',u,20+k*.46,v,1.04+.54*k,.49,.9+.4*k,k%2?'#ad8559':beam,p.wood);
      f.part('box',u,20.12+k*.46,v,.76+.34*k,.24,1.5+k*.84,pillars,p.wood);
    }
  }
  for(const side of [-1,1]){
    f.part('box',side*15.95,19.95,0,.64,.68,23.6,beam,p.wood);
    f.part('box',0,21.62,side*10,35.8,.66,.68,beam,p.wood);
  }
  f.part('hipRoof',0,21.8,0,39.5,5.8,29.4,roof,p.roofs);
  f.part('box',0,25.28,-.7,20.8,3.0,9.9,'#ba9c72',p.boarding);
  f.part('hipRoof',0,26.24,-.7,28.8,5.85,16.4,'#616e68',p.roofs);
  f.part('box',0,32.12,-.7,14.1,.42,.51,'#867a5b',p.wood);
  // The two gilded shibi curl back toward the roof ridge.
  for(const side of [-1,1]){
    const pp=[[side*6.76,32.35,-.7],[side*7.32,32.66,-.7],[side*7.66,33.18,-.7],[side*7.49,33.69,-.7]];
    for(let i=0;i<3;i++) f.line(pp[i],pp[i+1],.24-i*.056,ochre,p.fine);
    for(let k=0;k<4;k++) {
      const u=side*(6.68+k*.17);
      f.part('ball',u,32.54+k*.18,-.7,.2,.38,.15,'#cfac66',p.fine,0,0,-side*.37);
    }
  }
  // Side galleries enclose a level forecourt and leave the sightline to the face open.
  for(const side of [-1,1]){
    f.part('box',side*22,.18,9.2,4.7,.49,30.8,'#a09f8e',p.masonry);
    for(let j=0;j<8;j++) for(const u of [-1.74,1.74])
      f.part('round',side*22+u,2.12,-4.8+j*4,.18,4.1,.18,pillars,p.lacquer);
    f.part('roof',side*22,4.14,9.2,33,2.47,6.8,roof,p.roofs,PI/2);
  }
  for(const u of [-7.1,7.1]) for(const v of [13.6,22.5,31.6]) lantern(f,u,v,1.26);
}
// Tailor the kesa and exposed neck to a common, asymmetric set of sections.
// The folds belong to the surface; their ridges turn into the collar at the shoulder.
function vestment(p,f) {
  const sections=new T.CatmullRomCurve3([[4.5,3.32,2.0],[5.3,3.97,2.39],[6.9,4.18,2.64],
    [8.3,4.01,2.54],[9.65,3.94,2.42],[10.42,3.96,2.29],[11.18,3.48,1.98],
    [11.67,2.79,1.66],[12.05,1.98,1.38],[12.43,1.66,1.29],[12.92,1.55,1.23]]
    .map(([y,w,d])=>vec(w,y,d)));
  const profile=sections.getPoints(88);
  const collar=a=>10.92+1.10*sin(a)-.32*cos(a)+.25*sin(2*a);
  function surface(a,y,clothed){
    const i=profile.findIndex(q=>q.y>=y);
    const hi=profile[i<0?profile.length-1:i],lo=profile[max(0,(i<0?profile.length-1:i)-1)];
    const q=max(0,min(1,(y-lo.y)/(hi.y-lo.y||1)));
    const fold=clothed?.06+.094*sin(4.18*y+3*cos(a)+1.14*sin(2*a)):0;
    return vec(sin(a)*(lo.x+(hi.x-lo.x)*q+fold),y,-.14+cos(a)*(lo.z+(hi.z-lo.z)*q+fold));
  }
  for(const cloth of [true,false]){
    const pos=[],ix=[],col=[],uv=[],color=new T.Color(cloth?'#78998b':rice);
    const rows=cloth?41:17,sides=76;
    for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){
      const a=TAU*k/sides,t=j/rows,cut=collar(a),y=cloth?4.52+t*(cut-4.52):cut+t*(12.90-cut);
      const q=surface(a,y,cloth), shade=cloth?.94+.055*sin(4.18*y+3*cos(a)+1.14*sin(2*a)):1;
      uv.push(k/sides*10,y*.43);
      pos.push(q.x,q.y,q.z);col.push(color.r*shade,color.g*shade,color.b*shade);
      if(j<rows&&k<sides){const i=j*(sides+1)+k;ix.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const name=cloth?'patinatedKesa':'riceShoulder';p.shapes[name]=g;
    f.part(name,0,0,0,1,1,1,'#fff',cloth?kesaMaterial():brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.13));
  }
  const stitch=(points,widths,tint,name)=>{
    p.shapes[name]=brushStroke(points,widths,26);
    f.part(name,0,0,0,1,1,1,tint);
  };
  // A kesa is stitched from rectangular pieces of cloth. Their long edges
  // turn with the body and gather in diagonals below the raised hand.
  for(let j=-3;j<=3;j++){
    const mid=j*.364,lo=5.63+.28*cos(mid*2.4),hi=collar(mid)-.26;
    const path=Array.from({length:12},(_,k)=>{
      const t=k/11,a=mid+.085*sin(t*PI+mid),q=surface(a,lo+(hi-lo)*t,true);
      q.x+=.035*sin(a);q.z+=.035*cos(a);return q.toArray();
    });
    stitch(path,[.007,.050,.038,.011],j%2?'#4d625b':'#a79569','kesaPanel'+j);
    if(j===3)continue;
    for(let k=0;k<2;k++){
      const endpoints=Array.from({length:8},(_,n)=>{
        const t=n/7,a=mid+.36*t+.05,y=lo+(hi-lo)*(.30+.34*k)+.13*sin(a*2);
        const q=surface(a,y,true);q.x+=.035*sin(a);q.z+=.035*cos(a);return q.toArray();
      });
      stitch(endpoints,[.009,.043,.011],'#ad9c75','kesaSeam'+j+'_'+k);
    }
  }
  for(const [offset,r,color] of [[0,.111,'#c4a46c'],[-.20,.054,'#9e926c']]){
    const points=Array.from({length:80},(_,j)=>{const a=TAU*j/80;return surface(a,collar(a)+offset,true);});
    const name=offset?'kesaBraid':'kesaHem';
    p.shapes[name]=new T.TubeGeometry(new T.CatmullRomCurve3(points,true),112,r,8,true);
    f.part(name,0,0,0,1,1,1,color);
  }
}
function greatBuddha(p) {
  const f=frame(p,DAIBUTSU.x,DAIBUTSU.z);
  p.shapes.mochiStone=new T.SphereGeometry(1,36,23);
  p.shapes.nimbus=new T.TorusGeometry(1,.021,7,85);
  const lotus=new T.LatheGeometry([[-1,.015],[-.79,.55],[-.43,.90],[-.08,1],[.23,.92],[.54,.65],[.81,.32],[1,.015]]
    .map(([y,r])=>new T.Vector2(r,y)),16);
  const petals=lotus.attributes.position;
  for(let i=0;i<petals.count;i++){
    const y=petals.getY(i),z=petals.getZ(i);
    petals.setZ(i,z*.81+.32*(1-y*y)+.19*y+.14*(1-Math.abs(petals.getX(i)))*Math.max(0,z));
  }
  lotus.computeVertexNormals();p.shapes.bronzeLotus=lotus;
  const smooth=(u,v,z,w,h,d,tint,roll=0)=>f.part(max(w,h,d)>.9?'mochiStone':'ball',u,v,z,w,h,d,tint,p.fine,0,0,roll);
  const patina='#658278';
  // A double lotus seat on a faceted bronze drum.
  f.part('round',0,.41,0,6.6,.62,5.26,'#687a6b');
  f.part('round',0,.83,0,6.29,.42,5.03,'#b29766');
  f.part('round',0,1.85,0,5.99,1.81,4.78,'#8c927b');
  for(let ring=0;ring<2;ring++)for(let j=0;j<30;j++){
    const a=(j+ring*.5)*TAU/30;
    f.part('bronzeLotus',sin(a)*(5.87+.21*ring),1.41+ring*.75,cos(a)*(4.66+.17*ring),
      .72,.88,.34,ring?'#bba16c':'#889786',p.fine,a,ring?.37:-.27,ring?0:PI);
    f.part('ball',sin(a)*(6.15+.19*ring),1.44+ring*.75,cos(a)*(4.97+.15*ring),
      .038,.60,.037,ring?'#dcc58a':'#b1ad87',p.fine,a,ring?.37:-.27);
  }
  f.part('round',0,2.93,0,6.1,.42,4.9,'#a18e62');
  // Broad, openwork flame aureole. Each upturned tongue is pierced so
  // offering animals on the screen can be seen through the bronze.
  const flame=new T.Shape();
  flame.moveTo(-.29,0);flame.bezierCurveTo(-.57,.65,-.37,1.24,.29,1.86);
  flame.bezierCurveTo(.20,1.47,.25,1.19,.52,1.11);flame.bezierCurveTo(.12,.74,.60,.43,.27,.08);
  flame.quadraticCurveTo(0,-.10,-.29,0);
  const hole=new T.Path();hole.moveTo(.012,.29);hole.bezierCurveTo(-.20,.47,-.15,.81,.06,1.04);
  hole.quadraticCurveTo(-.012,.74,.15,.57);hole.quadraticCurveTo(.22,.41,.012,.29);flame.holes.push(hole);
  p.shapes.haloFlame=new T.ExtrudeGeometry(flame,{depth:.084,bevelEnabled:true,bevelThickness:.017,bevelSize:.017,bevelSegments:1,curveSegments:9});
  for(const [w,h] of [[7.53,8.81],[7.22,8.54],[5.01,5.84],[4.69,5.55]]){
    f.part('nimbus',0,h>8?10.58:14.03,-3.65,w,h,3.25,'#aa864b');
  }
  for(let i=0;i<40;i++){
    const a=(i+.5)*TAU/40,u=sin(a)*7.37,v=10.58+cos(a)*8.71;
    f.part('haloFlame',u,v,-3.59,1.1,i%2?1.05:.81,1,'#ba9b5e',p.fine,0,0,-a);
    smooth(u,v,-3.43,.145,.19,.088,'#d7b474',-a);
  }
  for(let i=0;i<18;i++){
    const a=(i+.5)*TAU/18,u=sin(a)*4.91,v=14.03+cos(a)*5.72;
    f.part('bronzeLotus',u,v,-3.49,.21,.47,.11,'#d5b371',p.fine,0,0,-a);
  }
  smooth(0,4.55,.12,5.55,1.71,3.89,patina);
  smooth(-1.85,4.17,1.55,3.85,1.04,2.13,'#708c7e',.085);
  smooth(1.86,4.23,1.71,3.63,.96,1.81,'#849787',-.115);
  vestment(p,f);
  const head=p.shapes.mochiStone.clone(), face=head.attributes.position;
  const fullness=y=>1+.146*Math.exp(-((y+.24)**2)/.22)-.075*Math.max(0,y);
  for(let i=0;i<face.count;i++)face.setX(i,face.getX(i)*fullness(face.getY(i)));
  head.computeVertexNormals();p.shapes.riceBuddhaFace=head;
  const complexion=brushWash(new T.MeshLambertMaterial({color:'#fff'}),.13);
  f.part('riceBuddhaFace',0,14.63,.09,3.22,3.18,2.48,rice,complexion);
  for(const side of [-1,1]){
    smooth(side*3.05,14.42,.22,.48,.91,.47,'#e6d7b8',side*-.14);
    smooth(side*3.09,13.77,.21,.33,.68,.37,'#e3d3b3',side*.12);
    smooth(side*3.19,14.47,.53,.17,.45,.12,'#c5b38d',side*-.18);
  }
  function faceZ(u,v){
    return .09+2.48*Math.sqrt(max(0,1-(u/(3.22*fullness((v-14.63)/3.18)))**2-((v-14.63)/3.18)**2));
  }
  let stroke=0;
  function faceStroke(coords,r,color){
    const curve=new T.CatmullRomCurve3(coords.map(q=>vec(...q,faceZ(...q)+.049)));
    const name='buddhaBrush'+stroke++;
    p.shapes[name]=brushStroke(curve.getPoints(18).map(q=>q.toArray()),[r*.14,r,r*1.13,r*.74,r*.09],32);
    f.part(name,0,0,0,1,1,1,color);
  }
  for(const d of [-1,1]){
    faceStroke([[d*.53,14.83],[d*.83,14.72],[d*1.18,14.68],[d*1.5,14.73],[d*1.72,14.86]],.132,'#55493c');
    faceStroke([[d*.44,15.48],[d*.79,15.65],[d*1.17,15.7],[d*1.57,15.64],[d*1.80,15.49]],.127,'#695744');
  }
  smooth(0,14.54,2.49,.30,.59,.30,'#e4d3ad');
  smooth(0,15.61,faceZ(0,15.61),.16,.16,.11,'#c7a463');
  faceStroke([[-.69,13.66],[-.4,13.54],[0,13.49],[.41,13.55],[.69,13.68]],.058,'#926c58');
  // Snail curls follow the part line, descending behind the long ears.
  for(let row=0;row<8;row++) {
    const lat=.045+row*.182, count=max(6,Math.floor(35*cos(lat)));
    for(let j=0;j<count;j++){
      const a=(j+(row%2)*.5)*TAU/count;
      if(lat<.65 && cos(a)>.90*lat-.17) continue;
      smooth(sin(a)*3.16*cos(lat),14.66+3.12*sin(lat),.09+cos(a)*2.47*cos(lat),
        .32,.315,.30,row%3===1?'#727a66':'#646e60');
    }
  }
  smooth(0,17.89,0,.99,.87,.95,'#697161');
  for(let k=0;k<12;k++) smooth(sin(k*TAU/12)*.76,18.02,cos(k*TAU/12)*.72,.28,.29,.27,'#737b69');
  smooth(0,18.71,.03,.31,.26,.28,ochre);

  // The right palm gives reassurance. The other rests open above the crossed legs.
  smooth(-3.77,9.09,.92,1.11,2.16,1.16,patina,-.35);
  smooth(-4.44,10.25,1.76,.65,1.49,.74,'#e4d6b6',-.18);
  smooth(-4.65,11.68,2.04,.74,.96,.36,rice,-.12);
  for(let j=0;j<4;j++){
    const u=-5.19+j*.316, y=12.56+.22*sin(j*PI/3);
    smooth(u,y,2.09,.192,.75+.12*sin(j*PI/3),.19,rice,(j-1.4)*-.11);
  }
  smooth(-3.94,11.61,2.14,.24,.57,.24,rice,-.67);
  smooth(3.57,7.43,1.23,1.26,1.79,1.51,'#749183',.45);
  smooth(2.95,6.31,2.53,1.31,.64,.75,'#e3d4b3',.20);
  smooth(2.11,6.37,2.93,.86,.34,.66,rice,.08);
  for(let j=0;j<4;j++) smooth(1.52+j*.09,6.46,2.50+j*.27,.65-j*.034,.16,.16,rice,.17);
  daibutsuden(p);
}

export function* dressPilgrimage(painter) {
  yield* inari(painter);
  yield;
  yield* paintPeachCliffs(painter,washTexture('peach-valley-rock'));
  gateBlossoms(painter);
  fallenBlossoms(painter);
  groveShrine(painter);
  yield;
  greatBuddha(painter);
  yield;
}

function mistTexture() {
  const rng=seeded(616904);
  return drawing(256,92,(c,w,h)=>{
    for(let i=0;i<140;i++){
      const x=10+rng()*(w-20), env=sin(x*PI/w)**.72;
      const y=h*.53+(rng()-.5)*h*.40*env;
      c.save();c.translate(x,y);c.scale(1,.29+rng()*.14);
      const rad=(7+24*rng())*env,gr=c.createRadialGradient(0,0,0,0,0,rad);
      gr.addColorStop(0,'rgba(255,250,232,.30)');gr.addColorStop(.44,'rgba(255,248,237,.21)');
      gr.addColorStop(1,'rgba(255,250,237,0)');c.fillStyle=gr;c.fillRect(-rad,-rad,2*rad,2*rad);c.restore();
    }
  });
}
function banks(scene,map,sites,tint,alpha){
  const mat=new T.MeshBasicMaterial({map,color:tint,transparent:true,opacity:alpha,depthWrite:false});
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='varying float bankDistance;\n'+shader.vertexShader.replace('#include <project_vertex>',`
      vec4 mvPosition=modelViewMatrix*vec4(instanceMatrix[3].xyz,1.);
      bankDistance=smoothstep(5.,31.,length(mvPosition.xyz));
      mvPosition.xy+=position.xy*vec2(instanceMatrix[0][0],instanceMatrix[1][1]);
      gl_Position=projectionMatrix*mvPosition;
    `);
    shader.fragmentShader='varying float bankDistance;\n'+shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n diffuseColor.a*=bankDistance;');
  };
  const batch=new T.InstancedMesh(new T.PlaneGeometry(),mat,sites.length),obj=new T.Object3D();
  batch.frustumCulled=false;batch.count=0;batch.renderOrder=3;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(batch);
  return (time,player,active)=>{
    batch.visible=active;
    if(!active) return;
    let count=0;
    for(const [i,d] of sites.entries()){
      const dx=wrapDelta(d.x-player.x),dz=wrapDelta(d.z-player.z);
      if(dx*dx+dz*dz>179**2)continue;
      obj.position.set(player.x+dx+sin(time*.037+i)*3.4,d.y+.47*cos(time*.089+i),player.z+dz);
      obj.scale.set(d.w,d.h,1);obj.updateMatrix();batch.setMatrixAt(count++,obj.matrix);
    }
    batch.count=count;batch.instanceMatrix.needsUpdate=true;
  };
}
function sunshower(scene){
  const N=170, pos=new Float32Array(N*6), starts=[], rng=seeded(36246);
  for(let j=0;j<N;j++)starts.push([rng(),rng(),rng(),rng()]);
  const g=new T.BufferGeometry(),a=new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage);
  g.setAttribute('position',a);
  const mat=new T.LineBasicMaterial({color:'#e5dabb',transparent:true,opacity:.45,depthWrite:false});
  const rain=new T.LineSegments(g,mat);rain.frustumCulled=false;scene.add(rain);
  return (time,player,active)=>{
    let weight=0;
    if(active) for(const [i,s] of WEDDING_SITES.entries()){
      const dx=wrapDelta(s.x-player.x),dz=wrapDelta(s.z-player.z);
      const blend=T.MathUtils.smoothstep(1-hypot(dx/(s.rx+16),dz/18),0,.55);
      weight=max(weight,blend*(.57+.39*sin(time*.095+i*2.093)));
    }
    rain.visible=weight>.038;
    if(!rain.visible)return;
    mat.opacity=.53*weight;
    rain.position.set(player.x,player.y,player.z);
    for(const [j,[u,v,w,speed]] of starts.entries()){
      const h=((v+time*(-.67-speed*.37))%1+1)%1, x=(u-.5)*19+h*.83, z=(w-.5)*20, y=h*10-.5;
      const idx=j*6;
      pos[idx]=x;pos[idx+1]=y;pos[idx+2]=z;
      pos[idx+3]=x+.043;pos[idx+4]=y+.27+.15*speed;pos[idx+5]=z-.017;
    }
    a.needsUpdate=true;
  };
}
function fallingPetals(scene) {
  const shape=new T.Shape();
  shape.moveTo(0,-.58);shape.bezierCurveTo(-.53,-.1,-.64,.77,0,.46);
  shape.bezierCurveTo(.57,.76,.54,-.04,0,-.58);
  const geo=new T.ShapeGeometry(shape,5),mat=new T.MeshLambertMaterial({side:T.DoubleSide});
  const petals=new T.InstancedMesh(geo,mat,210),obj=new T.Object3D(),rng=seeded(6231);
  const specs=Array.from({length:210},()=>[rng(),rng(),rng(),rng()]);
  for(let j=0;j<210;j++)petals.setColorAt(j,new T.Color(j%3?'#ee8fa3':'#ffd2d4'));
  petals.frustumCulled=false;petals.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(petals);
  return (time,player,active)=>{
    petals.visible=active;if(!active)return;
    const xf=player.x+wrapDelta(PEACH.x-player.x), zf=player.z+wrapDelta(PEACH.z-player.z);
    let count=0;
    for(let i=0;i<specs.length;i++){
      const [u,v,w,s]=specs[i], phase=(time*(.067+s*.045)+w)%1,a=i+time*.91;
      const x=xf+(u-.5)*106+phase*3.5+cos(a)*.71,z=zf+(v-.5)*86+sin(a*.7)*.75;
      if((x-player.x)**2+(z-player.z)**2>46**2)continue;
      obj.position.set(x,terrainHeight(x,z)+.11+(1-phase)*(5.2+s*3),z);
      obj.rotation.set(a,phase*TAU*3,a*.71);
      obj.scale.setScalar((.10+s*.067)*min(1,phase*9,(1-phase)*12));obj.updateMatrix();petals.setMatrixAt(count++,obj.matrix);
    }
    petals.count=count;petals.instanceMatrix.needsUpdate=true;
  };
}
export function pilgrimageLife(scene){
  const map=mistTexture(), rng=seeded(90210);
  const clouds=[], valley=[];
  // Low banks gather just below the ridge. From the ridge top the sanctuary
  // stands clear, with strips of mist still visible in the valley below.
  for(let i=0;i<90;i++) {
    const x=DISTRICTS.inari.x-270+rng()*410, z=DISTRICTS.inari.z-22+rng()*212, y=42+rng()*12;
    if(terrainHeight(x,z)>y+1.6) continue;
    clouds.push({x,z,y,w:32+rng()*59,h:6+rng()*10});
  }
  for(let i=0;i<32;i++){
    const a=i*2.4,r=28+rng()*45,x=PEACH.x+cos(a)*r,z=PEACH.z+sin(a)*r*.8;
    valley.push({x,z,y:terrainHeight(x,z)+2+rng()*7,w:19+rng()*35,h:3.7+rng()*6});
  }
  const cloud=banks(scene,map,clouds,'#f0ece3',.64), mist=banks(scene,map,valley,'#ead9d0',.47);
  const orchard=createPeachOrchard(scene);
  const foxes=foxParties(scene), rain=sunshower(scene), petals=fallingPetals(scene);
  return (time,player,camera)=>{
    orchard(camera);
    const nearInari=abs(wrapDelta(player.x-DISTRICTS.inari.x+60))<260 && abs(wrapDelta(player.z-DISTRICTS.inari.z-82))<217;
    const nearPeach=hypot(wrapDelta(player.x-PEACH.x),wrapDelta(player.z-PEACH.z))<157;
    cloud(time,player,nearInari);mist(time,player,nearPeach);foxes(time,player,nearInari,camera);
    rain(time,player,nearInari);petals(time,player,nearPeach);
  };
}
