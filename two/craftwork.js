import * as T from './vendor/three.module.min.js';

function paint(w,h,draw) {
  const c=document.createElement('canvas');
  c.width=w; c.height=h;
  draw(c.getContext('2d'),w,h);
  const map=new T.CanvasTexture(c);
  map.colorSpace=T.SRGBColorSpace;
  map.anisotropy=4;
  return map;
}

function line(c,commands,color,width) {
  c.beginPath(); c.moveTo(...commands[0]);
  for(const part of commands.slice(1)) {
    if(part.length===6) c.bezierCurveTo(...part);
    else if(part.length===4) c.quadraticCurveTo(...part);
    else c.lineTo(...part);
  }
  c.lineCap=c.lineJoin='round'; c.strokeStyle=color; c.lineWidth=width; c.stroke();
}
// A hare springs across the curtain, painted in one long spine stroke.
// The frog crouches low on its haunches, with little splayed toes.
function animal(c,hare,color) {
  const pen=(commands,width=2.8)=>line(c,commands,color,width);
  if(hare) {
    pen([[9,56],[13,40,21,35,32,34],[47,31,48,22,61,22],[69,20,72,25,79,28],[82,31,77,34,66,33],[60,40,55,42,50,43]],3.7);
    pen([[63,22],[53,9,47,2,44,3],[43,6,48,17,56,23]],2.4);
    pen([[58,23],[37,13,33,11,34,15],[38,23,46,27,52,27]],2);
    pen([[56,38],[64,43,75,45,88,40],[89,43,80,47,73,48],[61,48,53,46,45,45]]);
    pen([[41,37],[47,50,42,54,29,54],[26,59,20,66,11,66],[8,65,16,61,18,57],[18,53,21,48,26,46]],3);
    pen([[12,56],[5,58,3,53,9,49]],2);
    pen([[67,26],[69,25,69,27]],2.8);
    pen([[72,31],[78,31,81,33]],1);
  } else {
    pen([[14,55],[18,41,33,37,47,36],[48,28,53,23,59,27],[64,23,70,27,72,33],[80,35,84,39,77,42],[67,45,58,43,51,45]],3.6);
    pen([[73,37],[67,40,61,39]],1.9); pen([[57,30],[59,30]],3);
    pen([[46,44],[57,47,58,54,68,55],[76,54,78,55],[72,57],[79,58]],2.7);
    pen([[38,42],[49,52,39,58,24,57],[17,61,16,69,7,66],[13,63,15,57,20,54],[15,52,13,55,12,57]],3.4);
    pen([[43,51],[50,61,59,66,67,64],[72,65],[66,67]],2);
    for(const [x,y] of [[25,44],[31,41],[34,45],[39,39]]) pen([[x,y],[x+2,y-1]],1.3);
  }
}

function waves(c,w,y,color) {
  c.lineWidth=1.8;c.strokeStyle=color;
  for(let row=0;row<2;row++) for(let col=-1;col<=Math.ceil(w/36);col++) {
    const x=col*36+18*(row%2);
    for(const r of [5,10,15]) {c.beginPath();c.arc(x,y+row*10,r,Math.PI,Math.PI*2);c.stroke();}
  }
}
const materials=new Map();
function textile(hare,ground) {
  const key=ground+hare;
  if(materials.has(key))return materials.get(key);
  const map=paint(256,256,(c,w,h)=>{
    c.fillStyle=ground;c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(249,233,199,.12)'; c.lineWidth=1;
    for(let i=0;i<w;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i+.3,h);c.stroke();}
    c.fillStyle='rgba(46,39,33,.13)';
    for(let i=0;i<h;i+=4)c.fillRect(0,i,w,1);
    c.fillStyle='#ddcba8';c.fillRect(0,16,w,3);c.fillRect(0,232,w,3);
    waves(c,w,224,'rgba(232,217,184,.55)');
    c.save();c.translate(10,22);c.scale(2.55,2.55);animal(c,hare,'#f4e5bf');c.restore();
    c.fillStyle='#b26148';c.fillRect(210,166,20,24);
    line(c,[[216,186],[217,174],[225,174],[222,182],[215,180]],'#ead6b0',1.4);
  });
  const mat=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.008,roughness:.96,side:T.DoubleSide});
  materials.set(key,mat);return mat;
}
function clothShape() {
  const g=new T.PlaneGeometry(1,1,22,9),p=g.attributes.position;
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),t=.5-y;
    p.setXYZ(i,x*(1-.023*t),y+.036*t*t*Math.cos(x*7),.078*Math.sin(x*13+.7*t)*(.24+.76*t));
  }
  g.computeVertexNormals();return g;
}
export function noren(p,part,width,wall,depth,kind,index) {
  p.shapes.norenCloth??=clothShape();
  const red=kind==='temple'||kind==='shop'&&index%3===0;
  for(const side of [-1,1]) {
    const u=side*width*.133;
    part('norenCloth',u,wall*.78,depth*.555,width*.122,.83,.88,'#fff',textile(side===1,red?'#865047':'#425c66'));
    for(const offset of [-.043,.043])part('box',u+width*offset,wall*.78+.44,depth*.554,.048,.12,.052,'#af9a73',p.wood);
  }
}

// Pale slip, concentric foot rings, iron freckles and underglaze brushwork.
// The band follows the throwing profile, so it reads correctly in the hand.
export function porcelain(parent,shape,profile,offset=0) {
  const key='ceramic-'+shape;
  if(!materials.has(key)){
    const map=paint(512,192,(c,w,h)=>{
      const glaze=c.createLinearGradient(0,0,0,h);
      glaze.addColorStop(0,'#ebe2c3');glaze.addColorStop(.6,'#d8c8a5');glaze.addColorStop(1,'#c4ad88');
      c.fillStyle=glaze;c.fillRect(0,0,w,h);
      for(let i=0;i<2600;i++) {
        const x=((i*733)%2053)/2053*w,y=((i*467)%1831)/1831*h;
        c.fillStyle=i%5?'rgba(106,84,57,.12)':'rgba(255,244,212,.65)';
        c.fillRect(x,y,1+(i%3)*.5,1.3);
      }
      waves(c,w,145,'#687876');
      for(let i=0;i<4;i++){
        c.save();c.translate(i*128+2,5);c.scale(1.33,1.39);animal(c,i%2===0,'#536978');c.restore();
      }
      for(const y of [4,9,h-20,h-11]) {c.fillStyle='#718184';c.fillRect(0,y,w,y%2?2:3);}
    });
    materials.set(key,new T.MeshPhysicalMaterial({map,roughness:.32,clearcoat:.34,clearcoatRoughness:.24}));
  }
  const g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r+.0028,y)),48);
  const m=new T.Mesh(g,materials.get(key));m.position.x=offset;m.castShadow=true;parent.add(m);
}

export function makeMoonCakes(parent,held=false) {
  let mat=materials.get('rice');
  if(!mat) {
    const grain=paint(192,192,(c,w,h)=>{
      c.fillStyle='#f6e9ce';c.fillRect(0,0,w,h);
      for(let i=0;i<1800;i++) {
        const x=(i*811%1877)/1877*w,y=(i*449%1831)/1831*h;
        c.fillStyle=i%3?'rgba(240,223,192,.62)':'rgba(255,250,225,.72)';
        c.beginPath();c.ellipse(x,y,1.7,.85,i*1.93,0,Math.PI*2);c.fill();
      }
    });
    mat=new T.MeshPhysicalMaterial({map:grain,bumpMap:grain,bumpScale:.007,roughness:.61,clearcoat:.14,emissive:'#e2cfb7',emissiveIntensity:.10});
    materials.set('rice',mat);
  }
  const shape=new T.LatheGeometry([[0,-.90],[.56,-.84],[.88,-.58],[1,-.17],[.98,.23],[.80,.65],[.46,.92],[0,1]].map(a=>new T.Vector2(...a)),24);
  const positions=held?[[0,0,0]]:[];
  if(!held) {
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)positions.push([i*.324,.797,j*.314]);
    for(const i of [-1,1])for(const j of [-1,1])positions.push([i*.163,1.028,j*.151]);
    for(const i of [-1,1])positions.push([i*.153,1.263,0]);
  }
  const mesh=new T.InstancedMesh(shape,mat,positions.length),transform=new T.Object3D();
  positions.forEach(([x,y,z],i)=>{
    transform.position.set(x,y,z);transform.rotation.set(.03*Math.sin(i),i*2.4,.04*Math.cos(i));
    transform.scale.set(.179+.009*Math.cos(i*2),.172,.177);
    transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
  });
  mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
}
