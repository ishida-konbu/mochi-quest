import * as THREE from './vendor/three.module.min.js';
import { batchActorParts } from './actors.js';
import { brushWash } from './scroll-sculpt.js';
import { terrainHeight, wrapDelta } from './terrain.js';

const TAU = 2 * Math.PI;
const ink = '#342d2b', blackHair = '#302b30', skin = '#fff0d3', gold = '#d8b166';
const outfits = [
  { name:'舞妓餅', dye:'#aa423d', hem:'#773543', silk:'#df9a96', obi:'#c4a053', thread:'#faf0b7' },
  { name:'芸妓餅', dye:'#334957', hem:'#263844', silk:'#939aaa', obi:'#af7058', thread:'#f0dab4' },
  { name:'太鼓餅', dye:'#927646', hem:'#514941', silk:'#ccac6f', obi:'#3c5552', thread:'#e1c995' },
  { name:'風呂敷の旅餅', dye:'#6a806e', hem:'#435951', silk:'#acbba0', obi:'#66523c', thread:'#dfcca2' },
  { name:'京の売り餅', dye:'#77708c', hem:'#514d66', silk:'#c4abc4', obi:'#b49366', thread:'#ece0c4' },
];

function flower(c, x, y, r, fill, center) {
  c.fillStyle = fill;
  for (let k=0; k<5; k++) {
    const a=TAU*k/5-.35;
    c.beginPath(); c.ellipse(x+Math.cos(a)*r*.50, y+Math.sin(a)*r*.50, r*.54,r*.36,a,0,TAU); c.fill();
  }
  c.fillStyle=center;
  c.beginPath(); c.arc(x,y,r*.17,0,TAU); c.fill();
}
function robeSilk(kind) {
  const o=outfits[kind], canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=384;
  const c=canvas.getContext('2d'), dye=c.createLinearGradient(0,64,0,384);
  dye.addColorStop(0,o.dye); dye.addColorStop(.62,o.dye); dye.addColorStop(1,o.hem);
  c.fillStyle=dye;c.fillRect(0,0,512,384);
  c.lineCap='round';c.lineJoin='round';
  for (let j=0;j<3;j++) for(let i=-2;i<15;i++) {
    const x=i*46+j*18, y=235+j*49+19*Math.sin(i*1.8+j);
    c.strokeStyle=o.silk;c.lineWidth=1.7;
    if (kind===0) {
      c.beginPath();c.moveTo(x-22,y+24);c.quadraticCurveTo(x-2,y+12,x+11,y-13);c.stroke();
      flower(c,x,y+5,8,o.silk,o.thread);
      flower(c,x+12,y-12,5.2,o.thread,o.hem);
    } else if (kind===1) {
      // Overlapping fine arcs of seigaiha, fading into the indigo ground.
      for(let k=1;k<=4;k++){
        c.beginPath();c.arc(x, y+8, k*6.2, Math.PI*1.07,Math.PI*1.93);c.stroke();
      }
    } else {
      c.beginPath();c.moveTo(x-12,y);c.lineTo(x,y-12);
      c.lineTo(x+12,y);c.lineTo(x,y+12);c.closePath();c.stroke();
      if(kind===3)c.fillRect(x-1,y-1,2,2);
    }
  }
  // Viewed from the front, the wearer's left lapel lies above the right.
  for(const [a,b] of [[193,289],[317,221]]) {
    c.beginPath();c.moveTo(a,-4);c.lineTo(b,183);c.strokeStyle='#efe6ca';c.lineWidth=14;c.stroke();
    c.strokeStyle=o.silk;c.lineWidth=6;c.stroke();
  }
  c.fillStyle=o.obi;c.fillRect(0,150,512,65);
  for(let i=-1;i<34;i++){
    c.strokeStyle=o.thread;c.lineWidth=1.9;
    c.beginPath();c.moveTo(i*17,208);c.lineTo(i*17+16,162);c.lineTo(i*17+34,208);c.stroke();
  }
  c.fillStyle='#493b35'; c.fillRect(0,183,512,7); c.fillStyle=o.thread;c.fillRect(0,184,512,3);
  c.fillStyle=o.silk; c.fillRect(0,368,512,7);
  for(let y=0;y<384;y+=3){c.fillStyle=y%2?'rgba(255,241,220,.038)':'rgba(56,44,37,.047)';c.fillRect(0,y,512,1);}
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return brushWash(new THREE.MeshLambertMaterial({map}),.08);
}

function robeGeometry(kind) {
  const profiles=[
    [.09,.41,.34], [.13,.48,.37], [.23,.47,.36], [.46,.41,.32],
    [.53,.42,.34], [.72,.42,.34], [.84,.44,.34], [.985,.38,.29], [1.02,.25,.21],
  ];
  const p=[],uv=[],ix=[],steps=48;
  for(let j=0;j<profiles.length;j++) {
    const [y,w,d]=profiles[j];
    for(let k=0;k<=steps;k++) {
      const a=(k/steps-.5)*TAU, ripple=.013*Math.cos(9*a+.34)+.008*Math.sin(6*a);
      const skirt=(1-Math.min(1,y/.6));
      p.push((w+ripple*skirt)*Math.sin(a),y+.018*skirt*Math.cos(3*a),
        (d+ripple*skirt)*Math.cos(a) - (kind<2 ? .06*skirt*(1-Math.cos(a)) : 0));
      uv.push(k/steps,(y-.09)/.93);
      if(j<profiles.length-1 && k<steps){
        const n=j*(steps+1)+k;
        ix.push(n,n+1,n+steps+1,n+1,n+steps+2,n+steps+1);
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  return g;
}

function foldingFan(b,x,y,z,turn) {
  const span=1.94, start=turn-span/2, positions=[],indices=[];
  for(let i=0;i<=12;i++){
    const a=start+span*i/12, edge=i%2?.38:.366, ridge=(i%2)*.018;
    positions.push(x+Math.sin(a)*.115,y+Math.cos(a)*.115,z+ridge,x+Math.sin(a)*edge,y+Math.cos(a)*edge,z+ridge);
    if(i<12)indices.push(i*2,i*2+1,i*2+3,i*2,i*2+3,i*2+2);
    b.rod([x,y,z+.004],[x+Math.sin(a)*edge,y+Math.cos(a)*edge,z+.006+ridge],.005,'#9e7947');
    if(i>1&&i<11&&i%2===0)b.ball(x+Math.sin(a)*.29,y+Math.cos(a)*.29,z+.026,.021,.018,.007,'#bb6157');
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();b.add(geo,'#efdbc0');geo.dispose();
}

function hair(b,kind){
  b.ball(0,1.475,-.018,.458,.188,.336,blackHair);
  b.ball(0,1.71,-.104,.255,.145,.205,blackHair);
  b.ball(-.21,1.54,-.188,.207,.142,.172,'#40343a');
  b.ball(.22,1.53,-.18,.20,.137,.167,blackHair);
  b.ball(0,1.62,-.276,.18,.16,.148,blackHair);
  b.ball(-.185,1.445,.212,.21,.092,.106,blackHair,[0,0,.2]);
  b.ball(.181,1.45,.21,.20,.09,.099,blackHair,[0,0,-.18]);
  for(let i=0;i<7;i++)b.stroke([[-.28+i*.093,1.52,.224],[-.294+i*.091,1.59,.14],[-.27+i*.084,1.615,.054]],
    .0038,'#736369',7,4);
  b.rod([.14,1.61,-.08],[.51,1.77,-.13],.012,gold);
  if(kind===0){
    b.ball(-.20,1.666,-.03,.113,.062,.081,'#ce6256');
    for(let k=0;k<3;k++){
      const x=.34+k*.052, high=1.59+.028*Math.sin(k*2);
      for(let j=0;j<5;j++){
        const a=j*TAU/5;
        b.ball(x+.045*Math.cos(a),high+.043*Math.sin(a),.097,.036,.036,.019,j%2?'#ebaaa3':'#efcbb6');
      }
      b.ball(x,high,.119,.022,.02,.018,'#dca754');
      b.rod([x,high-.018,.08],[x+.016,high-.17-k*.035,.104],.006,gold);
      b.ball(x+.016,high-.18-k*.035,.104,.014,.034,.015,'#df9d86');
    }
  } else {
    b.ball(.37,1.68,-.08,.081,.056,.045,'#d5ad70');
    for(let i=0;i<4;i++)b.rod([.30+i*.045,1.68,-.085],[.26+i*.045,1.58,-.06],.006,'#be995b');
  }
}

function body(b,kind) {
  const o=outfits[kind], flesh=kind===4?'#e0bd8a':kind===3?'#d5d5aa':skin;
  // A low, broad mochi face stays visible above the crossed silk collar.
  b.ball(0,1.203,.015,.493,.344,.378,flesh);
  for(const side of [-1,1]){
    b.ball(side*.182,1.233,.353,.028,.042,.015,ink,[0,side*.25,side*.06]);
    b.stroke([[side*.23,1.29,.323],[side*.178,1.31,.337],[side*.143,1.303,.349]],.009,ink);
    b.ball(side*.29,1.176,.31,.057,.024,.013,kind<2?'#dfa195':'#dda98e',[0,side*.49,0]);
  }
  b.stroke([[-.044,1.162,.388],[-.008,1.148,.391],[.035,1.165,.388]],.009,kind<2?'#9f4743':ink);
  if(kind<2)hair(b,kind);
  else if(kind===2) {
    b.ball(0,1.51,-.055,.30,.095,.23,'#67564b');
    b.ball(0,1.623,-.101,.1,.096,.077,'#453c36');
    b.stroke([[-.32,1.42,.16],[-.04,1.47,.28],[.35,1.427,.147]],.034,'#b98b55');
  }else {
    b.ball(0,1.461,-.007,.443,.122,.325,o.hem);
    b.stroke([[-.33,1.40,.191],[0,1.44,.315],[.34,1.405,.186]],.036,o.thread);
    b.ball(-.36,1.44,-.07,.116,.06,.064,o.dye,[0,0,.48]);
  }
  // Padded obi bow. The long darari ends distinguish the apprentice from the geiko.
  b.ball(0,.689,-.33,.185,.101,.104,o.obi);
  for (const side of [-1,1]){
    b.ball(side*.162,.701,-.325,.144,.109,.1,o.obi,[0,0,side*.27]);
    if(kind===0){
      b.box(side*.13,.455,-.383,.155,.42,.062,o.obi,[.11,0,side*.16]);
      b.box(side*.154,.302,-.416,.147,.034,.064,o.thread,[.11,0,side*.16]);
    }
    const x=side*.424, forward=side===1?.194:.08;
    b.ball(x,.738,forward,.198,.278,.184,o.dye,[-.24,0,side*.35]);
    b.ball(side*.491,.68,forward+.143,.125,.098,.105,o.silk);
    b.ball(side*.5,.701,forward+.196,.083,.075,.084,flesh);
    for(let j=0;j<5;j++){
      const a=j*TAU/5;
      b.ball(x+.035*Math.cos(a),.638+.035*Math.sin(a),forward+.171,.026,.025,.012,o.thread);
    }
  }
  if(kind===0 || kind===2)foldingFan(b,.48,.72,.42,kind===0?.47:.79);
  if(kind===1){
    b.ball(.18,.671,.44,.214,.203,.066,'#5b403c',[0,0,-.34]);
    b.box(.18,.678,.45,.32,.281,.141,'#e6d8bf',[0,0,-.34]);
    b.rod([.16,.69,.48],[-.46,1.50,.49],.033,'#614338');
    for(let i=0;i<3;i++){
      b.rod([.245+i*.012,.59,.53],[-.467+i*.013,1.514,.516],.0027,'#dccaa6');
      b.rod([-.393-i*.03,1.45+i*.038,.49],[-.496-i*.03,1.39+i*.038,.49],.012,ink);
    }
  }
  if(kind===2){
    b.rod([-.57,.70,.25],[-.37,.69,.31],.156,'#b76b42');
    for(const [x,z] of [[-.58,.246],[-.359,.314]])
      b.rod([x-.012,.70,z],[x+.008,.70,z+.003],.165,'#e5d0a5');
    for(let j=0;j<8;j++){
      const a=TAU*j/8, a2=a+TAU/8;
      b.rod([-.57,.7+Math.cos(a)*.15,.25+Math.sin(a)*.15],
        [-.37,.69+Math.cos(a2)*.15,.31+Math.sin(a2)*.15],.012,'#675041');
    }
  }
  if(kind>=3){
    b.ball(0,.87,-.42,.25,.189,.196,o.silk);
    b.stroke([[-.4,.89,-.03],[-.25,.85,.27],[0,.69,.367],[.33,.564,.233]],.019,'#b5a074');
  }
}
const lanes=[
  [[118,-385],[118,-462],[121,-462],[121,-385]],
  [[119,-408],[162,-408],[162,-425],[119,-425]],
  [[72,-423],[121,-423],[121,-466],[72,-466]],
  [[119,-426],[162,-426],[162,-466],[119,-466]],
  [[72,-407],[122,-407],[122,-423],[72,-423]],
];
function streetWalk(coords) {
  // Rounded corners avoid snapping around on the heel of a geta.
  const points=coords.map(([x,z])=>new THREE.Vector3(x,0,z));
  const path=new THREE.CurvePath();
  const bend=points.map((p,i)=>{
    const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
    const rad=Math.min(1.6,.33*p.distanceTo(prev),.33*p.distanceTo(next));
    return [
      p.clone().addScaledVector(prev.clone().sub(p).normalize(),rad),
      p.clone().addScaledVector(next.clone().sub(p).normalize(),rad),
    ];
  });
  points.forEach((p,i)=>{
    path.add(new THREE.QuadraticBezierCurve3(bend[i][0],p,bend[i][1]));
    path.add(new THREE.LineCurve3(bend[i][1],bend[(i+1)%points.length][0]));
  });
  return path;
}
function instances(parent,geo,mat,n,name) {
  const m=new THREE.InstancedMesh(geo,mat,n);m.name=name;
  m.frustumCulled=false;m.castShadow=m.receiveShadow=true;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(m);return m;
}

export function createStreetCrowd(scene) {
  const crowd=new THREE.Group(); crowd.name='花街をゆく餅たち';scene.add(crowd);
  const routes=lanes.map(streetWalk), reference=new THREE.Group(), parts=[], walkers=[];
  const shoes=batchActorParts(reference,b=>{
    b.box(0,.059,0,.137,.054,.215,'#79543d');
    for(const z of [-.061,.054])b.box(0,.023,z,.119,.052,.036,'#6f5039');
    b.ball(0,.101,-.006,.059,.038,.096,'#f4e7cb');
    b.stroke([[-.049,.103,-.025],[0,.135,.058],[.048,.103,-.024]],.009,'#9d5a4b');
  });
  const perKind=5;
  const footwear=instances(crowd,shoes.geometry,shoes.material,outfits.length*perKind*2,'鼻緒と下駄');
  for(let kind=0;kind<outfits.length;kind++){
    const model=batchActorParts(reference,b=>body(b,kind));
    parts.push([
      instances(crowd,model.geometry,model.material,perKind,outfits[kind].name),
      instances(crowd,robeGeometry(kind),robeSilk(kind),perKind,'小袖'),
    ]);
    for(let i=0;i<perKind;i++){
      const dye=new THREE.Color().setHSL((kind*.18+i*.21)%1,.12,.91);
      parts[kind][1].setColorAt(i,dye);
      const route=routes[(kind+i)%routes.length];
      walkers.push({kind,index:i,route,length:route.getLength(),phase:(kind*.203+i*.371)%1,
        pace:.65+.24*((kind*1.7+i*.41)%1),scale:.87+.17*((kind*.31+i*.27)%1),direction:i%2?-1:1});
    }
  }
  const dummy=new THREE.Object3D(), at=new THREE.Vector3(), next=new THREE.Vector3();
  return (time,player)=>{
    const dx=wrapDelta(120-player.x),dz=wrapDelta(-424-player.z);
    crowd.visible=dx*dx+dz*dz<134**2;
    if(!crowd.visible)return;
    crowd.position.set(player.x+dx-120,0,player.z+dz+424);
    for(const [i,w] of walkers.entries()){
      const t=THREE.MathUtils.euclideanModulo(w.phase+w.direction*time*w.pace/w.length,1);
      w.route.getPoint(t,at);
      w.route.getPoint(THREE.MathUtils.euclideanModulo(t+w.direction*.001,1),next);
      const yaw=Math.atan2(next.x-at.x,next.z-at.z),co=Math.cos(yaw),si=Math.sin(yaw);
      // Keep to one side and leave room for a traveller who stops to look into a shop.
      at.x+=co*.37;at.z-=si*.37;
      const dx=wrapDelta(player.x-at.x), dz=wrapDelta(player.z-at.z);
      const ahead=dx*si+dz*co,across=dx*co-dz*si;
      if(Math.abs(ahead)<2.7 && Math.abs(across)<1.35 && (player.h||0)<2){
        w.shoulder??=across>0?-1:1;
        const offset=w.shoulder*(1.50-Math.abs(across))*(1-THREE.MathUtils.smoothstep(Math.abs(ahead),.5,2.7));
        at.x+=co*offset;at.z-=si*offset;
      } else w.shoulder=undefined;
      const gait=time*w.pace*8.8+w.phase*TAU, ripple=Math.sin(gait);
      const y=terrainHeight(at.x,at.z);
      dummy.position.set(at.x,y+.012+Math.abs(ripple)*.033,at.z);
      dummy.rotation.set(0,yaw,.026*ripple,'YXZ');dummy.scale.setScalar(w.scale);
      dummy.updateMatrix();
      for(const m of parts[w.kind])m.setMatrixAt(w.index,dummy.matrix);
      for(const [k,side] of [-1,1].entries()){
        const across=side*.17*w.scale, along=Math.cos(gait)*side*.164*w.scale;
        dummy.position.set(at.x+Math.cos(yaw)*across+Math.sin(yaw)*along,y+Math.max(0,ripple*side)*.062,
          at.z-Math.sin(yaw)*across+Math.cos(yaw)*along);
        dummy.rotation.set(-.10*ripple*side,yaw,0,'YXZ');dummy.updateMatrix();
        footwear.setMatrixAt(i*2+k,dummy.matrix);
      }
    }
    for(const pair of parts)for(const m of pair)m.instanceMatrix.needsUpdate=true;
    footwear.instanceMatrix.needsUpdate=true;
  };
}
