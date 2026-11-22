import * as T from './vendor/three.module.min.js';
import { terrainHeight, seeded, wrapDelta } from './terrain.js';
import { DAIBUTSU, PEACH, PEACH_TREES, WEDDING_SITES, weddingPoint, CEDAR_GROVES, MOON_GATE, INARI_GATES, INARI_SANCTUARY, TEMPLE_COLUMNS } from './pilgrimage-layout.js';

const { sin,cos,PI,abs,hypot,min,max } = Math, TAU=PI*2;
const vec=(...v)=>new T.Vector3(...v);
const rice='#efe3c7', ochre='#be9457', vermilion='#a84430';

// Solid painted profiles share one geometry and one draw material per spatial batch.
function sculpture() {
  const vertices=[], normals=[], colors=[], indices=[];
  const obj=new T.Object3D(), nmat=new T.Matrix3(), point=vec(), n=vec(), col=new T.Color();
  const ball=new T.SphereGeometry(1,12,8), cube=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,10);
  function add(geometry, tint, x,y,z, sx,sy,sz, pitch=0,yaw=0,roll=0) {
    obj.position.set(x,y,z);
    obj.rotation.set(pitch,yaw,roll,'YXZ');
    obj.scale.set(sx,sy,sz);
    obj.updateMatrix();
    nmat.getNormalMatrix(obj.matrix);
    const pos=geometry.attributes.position, norm=geometry.attributes.normal, start=vertices.length/3;
    col.set(tint);
    for(let i=0;i<pos.count;i++) {
      point.fromBufferAttribute(pos,i).applyMatrix4(obj.matrix);
      n.fromBufferAttribute(norm,i).applyMatrix3(nmat).normalize();
      vertices.push(point.x,point.y,point.z); normals.push(n.x,n.y,n.z); colors.push(col.r,col.g,col.b);
    }
    if(geometry.index) for(const j of geometry.index.array) indices.push(start+j);
    else for(let j=0;j<pos.count;j++) indices.push(start+j);
  }
  return {
    add, ball:(...args)=>add(ball,...args), box:(...args)=>add(cube,...args),
    post:(...args)=>add(cylinder,...args),
    finish(){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      g.setIndex(indices); g.computeBoundingSphere();
      return g;
    },
  };
}

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
    s.post('#ac4832',d*.356,.39,0,.039,1.20,.039,0,0,d*.018);
    s.post('#413f36',d*.363,-.002,0,.045,.42,.045);
    s.post('#654635',d*.36,.206,0,.046,.036,.046);
    s.box('#913a2b',d*.345,.75,0,.102,.064,.074);
  }
  s.box('#b95134',0,.745,0,.911,.047,.052);
  s.box('#943c2d',0,.84,0,.046,.16,.046);
  // Flared outer ends bend upward in five fitted pieces, keeping the tunnel silhouette light.
  for(const [color,dy,depth,height] of [['#a84931',0,.075,.057],['#3f4037',.042,.097,.034]]){
    for(let j=0;j<5;j++){
      const u=(j-2)*.207, slope=u*.42;
      s.box(color,u,.92+dy+.21*u*u,0,.212,height,depth,0,0,slope);
    }
  }
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
  const pigments=new T.MeshLambertMaterial({vertexColors:true});
  const donation=inscription('奉納',null,'#312b25');
  for(const [i,g] of INARI_GATES.entries()) {
    const y=terrainHeight(g.x,g.z);
    p.part('senbon',g.x,y,g.z,g.width,g.height,g.width,
      ['#fff5dd','#f4cfbb','#ffe7bf','#e7ceb9'][i%4],g.yaw,0,0,pigments,true,true);
    if(i%4===0) {
      const f=frame(p,g.x,g.z,g.yaw,y);
      for(const side of [-1,1]) f.part('plane',side*g.width*.348,g.height*.53,-g.width*.038,
        .20,.68,1,'#ffffff',donation,PI,0,0,false);
    }
    if(i%125===0) yield;
  }
  summit(p);
  weddingPaths(p);
}

// An individual spray carries dry-brushed wood, five-petalled blossoms and buds.
// Transparent gaps between the flowers let the drawing of the branches read against the sky.
function blossomSpray() {
  const rng=seeded(56025);
  const map=drawing(320,256,c=>{
    c.lineCap='round';
    function twig(ax,ay,bx,by,bend,width){
      c.strokeStyle=width>2?'#765d53':'#967267'; c.lineWidth=width;
      c.beginPath();c.moveTo(ax,ay);c.quadraticCurveTo((ax+bx)/2+bend,(ay+by)/2,bx,by);c.stroke();
    }
    function bloom(x,y,r){
      const spin=rng()*TAU;
      for(let k=0;k<5;k++){
        const a=spin+k*TAU/5;
        c.save();c.translate(x,y);c.rotate(a);
        c.fillStyle=['#ffdddf','#ffe9e6','#fff6ee','#edafbc','#f4ccd3'][Math.floor(5*rng())];
        c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-r*.9,-r*.29,-r*.68,-r*1.32,0,-r*1.12);
        c.bezierCurveTo(r*.68,-r*1.32,r*.80,-r*.28,0,0);c.fill();c.restore();
      }
      c.fillStyle='#b6796a';c.beginPath();c.arc(x,y,r*.24,0,TAU);c.fill();
      c.fillStyle='#e6bd74';c.fillRect(x-r*.12,y-r*.12,r*.21,r*.19);
    }
    twig(14,238,299,43,34,4.9);
    for(let j=0;j<33;j++){
      const t=(j+rng())/34;
      const x=20+t*274, y=235-t*193-5*sin(t*PI);
      const side=j%2?1:-1, endX=x+(14+rng()*57)*side, endY=y-14-rng()*62;
      twig(x,y,endX,endY,side*7,1.4+rng());
      for(let k=0;k<10;k++){
        const q=(k+rng())/10, xx=x+(endX-x)*q+(rng()-.5)*19, yy=y+(endY-y)*q+(rng()-.5)*17;
        if(k%6===0){c.fillStyle='#a3a77b';c.beginPath();c.ellipse(xx,yy,2.6,5.1,q*2,0,TAU);c.fill();}
        else bloom(xx,yy,2.8+rng()*3.15);
      }
    }
  });
  return new T.MeshLambertMaterial({map,side:T.DoubleSide,alphaTest:.36,emissive:'#dbbbb7',emissiveIntensity:.34});
}
function* peachGrove(p) {
  const art=blossomSpray();
  const bark=['#6a5849','#7a6254','#614f44'];
  for(const [idx,t] of PEACH_TREES.entries()) {
    const f=frame(p,t.x,t.z,t.turn),s=t.size,r=seeded(t.seed);
    const drift=(r()-.5)*.62;
    f.line([0,-.25,0],[-.14*s,1.40*s,.12*s],.30*s,bark[idx%3]);
    f.line([-.14*s,1.39*s,.12*s],[drift*s,2.58*s,-.16*s],.21*s,bark[(idx+1)%3]);
    for(let i=0;i<6;i++) {
      const a=i*2.4+r()*.46, rad=(1.36+r()*.67)*s, b=1.31*s+i*.185*s;
      const tip=[cos(a)*rad,(2.71+i*.237+r()*.67)*s,sin(a)*rad];
      const joint=[tip[0]*(.40+r()*.39)+drift*s,b+(.18+r()*.79)*s,tip[2]*(.37+r()*.39)];
      f.line([-.12*s,b,.05*s],joint,.13*s,bark[idx%3]);
      f.line(joint,tip,.082*s,bark[(idx+1)%3]);
      const tint=['#fff8ee','#fbddd9','#ffe6e2','#f8e2e5'][idx%4];
      for(let k=0;k<3;k++) {
        const aa=a+(k-1)*.91;
        f.part('plane',tip[0]+cos(aa)*.34*s,tip[1]+(.23+k*.097)*s,tip[2]+sin(aa)*.34*s,
          (2.92+r()*.5)*s,(2.1+r()*.45)*s,1,tint,art,aa,(k-1)*.52+.22,k%2?.15:-.18,false);
      }
    }
    if(idx%26===0) yield;
  }
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
  for(const side of [-1,1]){
    f.part('box',side*4.61,1.73,.027,.38,5.29,.70,'#c6c6b2');
    f.part('box',side*4.64,4.29,.03,.63,.22,.86,'#858a7b');
    for(let i=0;i<3;i++)f.part('box',side*(3.05+.35*i),2.23,.27,.18,.58,.065,'#a7ad99');
  }
}
function fallenBlossoms(p) {
  const rng=seeded(96254), bins=new Map(), colors=['#f1bbb9','#fde1d3','#e7a7ad','#e6c4ae','#fff0db'].map(c=>new T.Color(c));
  const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true,emissive:'#a68b81',emissiveIntensity:.14});
  for(const tree of PEACH_TREES){
    for(let j=0;j<66;j++){
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
function cedarWoods(p){
  // Ragged layered boughs leave a clear view of the red gates between trunks.
  const rng=seeded(90426);
  for(const t of CEDAR_GROVES){
    const f=frame(p,t.x,t.z,t.yaw), h=t.h;
    f.line([0,-.47,0],[.065,h*.94,.045],h*.024,'#6e5946');
    for(let i=0;i<5;i++){
      const frac=.32+i*.127, scale=h*(.29-.038*i);
      for(let j=0;j<4;j++){
        const a=j*PI/2+i*2.4+rng()*.57;
        const reach=scale*(.32+rng()*.14);
        f.part('plane',sin(a)*reach,h*frac,cos(a)*reach,scale*1.83,scale*1.40,1,
          i>2?'#9da28b':'#7f8c72',p.sprays.pine,a,.57+rng()*.27,(rng()-.5)*.3,false);
      }
    }
  }
}

function daibutsuden(p) {
  const {x,z}=DAIBUTSU, f=frame(p,x,z);
  const pillars='#9e5941', beam='#74503a', roof='#5c6862';
  f.part('box',0,-.19,0,34.4,.62,23.4,'#a2a497',p.masonry);
  f.part('box',0,.12,0,33.9,.14,23.2,'#d0baa0',p.deck);
  f.part('box',0,10.25,-11.4,33.1,20.4,.85,'#78776a',p.solid);
  for(let j=-8;j<=8;j++) f.part('box',j*1.89,10.25,-10.96,.064,20.4,.065,'#66675d');
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
    const pos=[],ix=[],col=[],color=new T.Color(cloth?'#78998b':rice);
    const rows=cloth?41:17,sides=76;
    for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){
      const a=TAU*k/sides,t=j/rows,cut=collar(a),y=cloth?4.52+t*(cut-4.52):cut+t*(12.90-cut);
      const q=surface(a,y,cloth), shade=cloth?.94+.055*sin(4.18*y+3*cos(a)+1.14*sin(2*a)):1;
      pos.push(q.x,q.y,q.z);col.push(color.r*shade,color.g*shade,color.b*shade);
      if(j<rows&&k<sides){const i=j*(sides+1)+k;ix.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();
    const name=cloth?'patinatedKesa':'riceShoulder';p.shapes[name]=g;
    f.part(name,0,0,0,1,1,1,'#fff',new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));
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
  const patina='#658278', edge='#bb9b63';
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
  for(const [w,h] of [[6.9,9.35],[6.62,9.06],[5.07,6.35],[4.76,6.02]]){
    f.part('nimbus',0,h>8?10.95:13.62,-3.52,w,h,3.3,'#ba9c5c');
  }
  for(let i=0;i<45;i++){
    const a=(i+.5)*TAU/45, u=sin(a)*6.77,v=10.95+cos(a)*9.25;
    smooth(u,v,-3.51,.19,.29,.086,'#ddbc72',-a);
    if(i%2===0) {
      const tip=[sin(a+.045)*7.35,10.95+cos(a+.045)*10.12,-3.45];
      f.line([u,v,-3.5],[sin(a)*7.21,10.95+cos(a)*9.74,-3.5],.135,edge,p.fine);
      f.line([sin(a)*7.21,10.95+cos(a)*9.74,-3.5],tip,.095,edge,p.fine);
    }
  }
  smooth(0,4.55,.12,5.55,1.71,3.89,patina);
  smooth(-1.85,4.17,1.55,3.85,1.04,2.13,'#708c7e',.085);
  smooth(1.86,4.23,1.71,3.63,.96,1.81,'#849787',-.115);
  vestment(p,f);
  smooth(0,14.63,.09,3.22,3.18,2.48,rice);
  for(const side of [-1,1]){
    smooth(side*3.05,14.42,.22,.48,.91,.47,'#e6d7b8',side*-.14);
    smooth(side*3.09,13.77,.21,.33,.68,.37,'#e3d3b3',side*.12);
    smooth(side*3.19,14.47,.53,.17,.45,.12,'#c5b38d',side*-.18);
  }
  function faceZ(u,v){
    return .09+2.48*Math.sqrt(max(0,1-(u/3.22)**2-((v-14.63)/3.18)**2));
  }
  let stroke=0;
  function faceStroke(coords,r,color){
    const curve=new T.CatmullRomCurve3(coords.map(q=>vec(...q,faceZ(...q)+.049)));
    const name='buddhaBrush'+stroke++;
    p.shapes[name]=new T.TubeGeometry(curve,28,r,7,false);
    f.part(name,0,0,0,1,1,1,color);
  }
  for(const d of [-1,1]){
    faceStroke([[d*.53,14.83],[d*.83,14.72],[d*1.18,14.68],[d*1.5,14.73],[d*1.72,14.86]],.09,'#665947');
    faceStroke([[d*.44,15.48],[d*.79,15.65],[d*1.17,15.7],[d*1.57,15.64],[d*1.80,15.49]],.092,'#70604a');
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
  cedarWoods(painter);
  yield;
  yield* peachGrove(painter);
  fallenBlossoms(painter);
  groveShrine(painter);
  yield;
  greatBuddha(painter);
  yield;
}

function foxHead(s,y,z,scale=1) {
  const fur='#bf8c61', ivory='#f2dfbd', soot='#584638';
  const bulb=(color,x,v,w,rx,ry,rz,roll=0)=>
    s.ball(color,x*scale,y+v*scale,z+w*scale,rx*scale,ry*scale,rz*scale,0,0,roll);
  bulb(fur,0,0,0,.25,.22,.23);
  bulb(ivory,0,-.09,.16,.183,.108,.213);
  bulb(fur,0,-.046,.235,.127,.107,.19);
  bulb(soot,0,-.045,.397,.068,.048,.057);
  const ear=new T.ConeGeometry(1,1,3);
  for(const side of [-1,1]) {
    s.add(ear,fur,side*.167*scale,y+.225*scale,z-.018*scale,.129*scale,.335*scale,.108*scale,0,0,-side*.23);
    s.add(ear,'#7c564b',side*.173*scale,y+.232*scale,z+.044*scale,.073*scale,.204*scale,.056*scale,0,0,-side*.23);
    bulb(ivory,side*.164,-.076,.084,.13,.105,.13,side*-.26);
    bulb(soot,side*.166,.036,.166,.061,.017,.029,-side*.28);
    bulb('#ad614a',side*.188,-.012,.168,.047,.012,.019,-side*.23);
  }
}
function weddingFox(role) {
  const s=sculpture(), bride=role==='bride', groom=role==='groom', parasol=role==='parasol';
  const dye=bride?'#f4ead6':groom?'#4c5e5b':parasol?'#697972':'#977467';
  const contrast=bride?'#ba7861':groom?'#c0afa0':'#dbc19b';
  const robe=new T.LatheGeometry([[.31,0],[.35,.038],[.33,.16],[.215,.79],[.24,1.01],[.174,1.13]]
    .map(([r,y])=>new T.Vector2(r,y)),20);
  s.add(robe,dye,0,.16,0,1,1,.81);
  s.post(contrast,0,.21,0,.346,.063,.285);
  s.post(bride?'#cba362':'#977553',0,.85,0,.252,.149,.222);
  for(const d of [-1,1]){
    s.ball(dye,d*.258,1.01,.009,.14,.285,.194,0,0,d*.24);
    s.ball(contrast,d*.306,.803,.116,.12,.073,.11);
    s.ball('#eadaba',d*.303,.823,.18,.083,.067,.083);
    s.box(bride?'#d6c8ab':'#e5d8b9',d*.077,1.19,.147,.054,.31,.041,-.12,0,-d*.62);
    for(let j=0;j<3;j++) {
      s.ball(contrast,d*(.13+j*.045),.325+j*.082,.217-j*.023,.024,.04,.018,0,0,.48*d);
    }
  }
  s.ball('#c5966d',.10,.73,-.39,.133,.16,.38,-.38,.27);
  s.ball('#f4e7cf',.18,.91,-.69,.106,.116,.183,-.52,.27);
  foxHead(s,1.45,.033,1.06);
  if(bride) {
    // A watabōshi opens in front of the muzzle; a red silk lining borders both cheeks.
    s.ball('#f4ebd9',0,1.61,-.078,.367,.356,.275);
    for(const d of [-1,1]) {
      s.ball('#f8efde',d*.27,1.45,.049,.086,.24,.15,0,0,-d*.22);
      s.ball('#b97160',d*.312,1.64,.129,.041,.065,.042);
    }
  } else if(groom) {
    s.ball('#363e38',0,1.69,-.056,.163,.174,.156,-.12);
    s.ball('#434a40',0,1.84,-.12,.087,.142,.085,-.44);
  } else if(parasol) {
    s.post('#70583f',-.287,1.61,.21,.024,1.59,.024);
    const cap=new T.LatheGeometry([[0,.365],[.10,.362],[.44,.292],[.83,.107],[1,.013],[.99,-.025],[.02,.225]]
      .map(([r,y])=>new T.Vector2(r,y)),24);
    s.add(cap,'#b85641',-.287,2.38,.21,1.01,1.01,1.01);
    for(let i=0;i<16;i++){
      const a=i*TAU/16;
      s.ball('#e1b183',-.287+.66*sin(a),2.52,.21+.66*cos(a),.012,.018,.34,.38,a);
    }
    s.ball('#695b43',-.287,2.77,.21,.06,.085,.06);
  } else {
    s.post('#756045',.34,1.21,.17,.019,.84,.019);
    s.box('#ead09c',.34,1.54,.17,.204,.295,.195);
    for(const b of [1.377,1.703])s.box('#675743',.34,b,.17,.254,.049,.227);
  }
  return s.finish();
}
function wildFox() {
  const s=sculpture();
  s.ball('#be8a5d',0,.53,0,.218,.24,.46,-.02);
  s.ball('#e1c6a2',0,.48,.285,.177,.21,.186);
  foxHead(s,.782,.345,.87);
  s.ball('#b58058',0,.61,-.53,.153,.152,.368,-.38);
  s.ball('#f0dabb',.004,.741,-.79,.127,.126,.17,-.58);
  return s.finish();
}
function foxParties(scene) {
  const material=new T.MeshLambertMaterial({vertexColors:true});
  const obj=new T.Object3D(),groups=new Map(),roles=['lantern','groom','bride','parasol','lantern'];
  const leg=new T.SphereGeometry(1,8,6);
  function batch(key,geo,n,mat=material){
    const mesh=new T.InstancedMesh(geo,mat,n);
    mesh.name='稲荷・'+key;mesh.count=0;mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.castShadow=true;mesh.receiveShadow=true;
    scene.add(mesh);groups.set(key,mesh);
  }
  for(const r of new Set(roles)) batch(r,weddingFox(r),12);
  batch('wild',wildFox(),42);
  batch('feet',leg,240,new T.MeshLambertMaterial({color:'#715a44'}));
  function mark(kind,x,y,z,yaw,pitch,sx,sy,sz){
    const b=groups.get(kind);
    obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);obj.rotation.set(pitch,yaw,0,'YXZ');obj.updateMatrix();
    b.setMatrixAt(b.count++,obj.matrix);
  }
  const rand=seeded(86317);
  const wild=Array.from({length:38},(_,i)=>{
    // The animals cross the clearings between the red corridors.
    const row=i%8;
    return {x:-263+rand()*107,z:-389.56-19.125*row,phase:rand()*TAU,
      rx:1.3+rand()*3.6,rz:1.1+rand()*1.63,size:.71+rand()*.44,rate:.10+rand()*.07};
  });
  function put(kind,wx,wz,yaw,phase,size,player) {
    const x=player.x+wrapDelta(wx-player.x),z=player.z+wrapDelta(wz-player.z);
    if((x-player.x)**2+(z-player.z)**2>90**2) return;
    const y=terrainHeight(wx,wz), stride=sin(phase);
    mark(kind,x,y+.025+abs(stride)*.036*size,z,yaw,0,size,size,size);
    const beast=kind==='wild';
    for(const side of [-1,1])for(const front of (beast?[-1,1]:[1])){
      const step=stride*side*front, u=side*(beast?.127:.131)*size;
      const v=((beast?.265*front:0)+step*(beast?.080:.082))*size;
      mark('feet',x+u*cos(yaw)+v*sin(yaw),y+(beast?.245:.13)*size,
        z-u*sin(yaw)+v*cos(yaw),yaw,step*(beast?.29:.27),.063*size,(beast?.247:.13)*size,.092*size);
    }
  }
  return (time,player,active)=>{
    for(const b of groups.values()) b.count=0;
    if(active){
      for(const [i,q] of WEDDING_SITES.entries()){
        for(const [j,r] of roles.entries()){
          const walked=time*.82+(q.rx-q.rz)*1.04+i*2.2-j*1.22;
          const {x,z,yaw}=weddingPoint(q,walked);
          put(r,x,z,yaw,time*3.32+j*.76,1.08,player);
        }
      }
      for(const w of wild){
        const a=time*w.rate+w.phase,x=w.x+w.rx*sin(a),z=w.z+w.rz*sin(2*a);
        put('wild',x,z,Math.atan2(w.rx*cos(a),2*w.rz*cos(2*a)),time*4.77+w.phase,w.size,player);
      }
    }
    for(const b of groups.values()) {
      b.visible=b.count>0;
      if(!b.visible) continue;
      b.instanceMatrix.clearUpdateRanges();
      b.instanceMatrix.addUpdateRange(0,b.count*16);
      b.instanceMatrix.needsUpdate=true;
    }
  };
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
  for(let j=0;j<210;j++)petals.setColorAt(j,new T.Color(j%3?'#efc0b8':'#f9ded0'));
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
    const x=-358+rng()*284, z=-531+rng()*120, y=36+rng()*8;
    if(terrainHeight(x,z)>y+1.6) continue;
    clouds.push({x,z,y,w:32+rng()*59,h:6+rng()*10});
  }
  for(let i=0;i<32;i++){
    const a=i*2.4,r=28+rng()*45,x=PEACH.x+cos(a)*r,z=PEACH.z+sin(a)*r*.8;
    valley.push({x,z,y:terrainHeight(x,z)+2+rng()*7,w:19+rng()*35,h:3.7+rng()*6});
  }
  const cloud=banks(scene,map,clouds,'#f0ece3',.64), mist=banks(scene,map,valley,'#ead9d0',.47);
  const foxes=foxParties(scene), rain=sunshower(scene), petals=fallingPetals(scene);
  return (time,player)=>{
    const nearInari=abs(wrapDelta(player.x+213))<207 && abs(wrapDelta(player.z+453))<187;
    const nearPeach=hypot(wrapDelta(player.x-PEACH.x),wrapDelta(player.z-PEACH.z))<157;
    cloud(time,player,nearInari);mist(time,player,nearPeach);foxes(time,player,nearInari);
    rain(time,player,nearInari);petals(time,player,nearPeach);
  };
}
