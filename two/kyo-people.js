import { costumeDistance } from './costume-distance.js';
import { districtPoint, DISTRICTS } from './geography.js';
import * as THREE from './vendor/three.module.min.js';
import { batchActorParts } from './actors.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { kosode, silkMaterial, SilkPanels } from './kosode.js';
import { brushStroke } from './pilgrimage-pigment.js';
import { dressedRiceFace } from './mochi-model.js';
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

function shamisen(b){
  const angle=.666,co=Math.cos(angle),si=Math.sin(angle);
  const at=(x,y,z)=>[.160+co*x-si*y,.682+si*x+co*y,.447+z+.048*y];
  const body=new SilkPanels();
  function rim(u,v,lip=1){
    const a=TAU*u,c=Math.cos(a),s=Math.sin(a),roll=.96+.04*Math.sin(v*Math.PI);
    return at(lip*.176*roll*Math.sign(c)*Math.abs(c)**.55,
      lip*.166*roll*Math.sign(s)*Math.abs(s)**.54,(v-.5)*.148);
  }
  body.cut(5,44,(u,v)=>rim(u,v),4);
  b.add(body.finish(),'#74563f');
  for(const v of [0,1]){
    const skin=new SilkPanels();
    skin.cut(9,44,(u,r)=>{
      const edge=rim(u,v,.971),center=at(0,0,(v-.5)*.174);
      return edge.map((q,k)=>center[k]+(q-center[k])*r);
    },4);
    b.add(skin.finish(),'#eaddc0');
    b.stroke(Array.from({length:41},(_,i)=>rim(i/40,v,.984)),.0046,'#ad9579',44,5);
  }
  b.rod(at(0,.124,.032),at(0,1.035,.032),.025,'#674637',.033);
  b.rod(at(0,.899,.032),at(.024,1.085,.011),.038,'#614133',.043);
  b.rod(at(-.087,-.059,.095),at(.085,-.059,.095),.012,'#b29572');
  for(let i=0;i<3;i++){
    const side=i===1?-1:1,height=.95+i*.051,x=(i-1)*.015;
    b.rod(at(x,-.152,.085),at(x,-.058,.105),.0028,'#9a7950');
    b.rod(at(x,-.058,.105),at(x,1.004,.072),.0023,'#d6bd89');
    b.rod(at(0,height,.032),at(side*.107,height+.025,.03),.0096,ink,.019);
    b.ball(...at(side*.107,height+.025,.03),.020,.016,.014,'#5a453b');
  }
  const pick=new THREE.Shape();
  pick.moveTo(-.025,0);pick.quadraticCurveTo(0,.04,.026,.007);
  pick.lineTo(.020,-.068);pick.quadraticCurveTo(.056,-.12,.073,-.142);
  pick.quadraticCurveTo(0,-.131,-.069,-.145);pick.quadraticCurveTo(-.039,-.110,-.024,-.067);
  pick.closePath();
  const g=new THREE.ExtrudeGeometry(pick,{depth:.012,bevelEnabled:false,curveSegments:7});
  b.add(g,'#d2b993',[.467,.718,.413],[1,1,1],[0,-.13,-.61]);
}

function hair(b,kind){
  const cap=(u,v)=>{
    const a=(u-.5)*TAU,s=Math.sin(a),c=Math.cos(a);
    // The hairline rises at the centre part, drops at the temples, and
    // leaves the white-painted nape exposed below the lacquered side wings.
    const low=1.325+.095*Math.max(0,c)+.045*Math.exp(-11*s*s)*Math.max(0,c);
    const lat=.09+v*1.475, bump=.028*Math.sin(2.7*a+.34)*Math.sin(v*Math.PI);
    return [(.461+bump)*s*Math.cos(lat),low+(1.659-low)*Math.sin(lat),
      -.031+(.351+bump)*c*Math.cos(lat)-.07*v];
  };
  const silk=new SilkPanels();silk.cut(16,56,cap,4);
  b.add(silk.finish(),blackHair);
  // Narrow, slightly separated drawn locks converge into the root of the
  // topknot. A brush lift at either end keeps the highlights below the outline.
  for(let j=0;j<34;j++){
    const u=(j+.28)/34,knots=[];
    for(let k=0;k<5;k++){
      const t=.045+.85*k/4,p=cap(u+.035*Math.sin(t*Math.PI),t);
      p[0]*=1.008;p[2]+=.002*Math.cos((u-.5)*TAU);p[1]+=.002;
      knots.push(p);
    }
    b.add(brushStroke(knots,[.0006,.0024,.0035,.0025,.0005],13,4),j%4?'#4c4146':'#75636a');
  }
  for(const side of [-1,1]){
    const path=[[side*.16,1.572,.085],[side*.31,1.556,-.041],[side*.376,1.504,-.144],
      [side*.324,1.475,-.261],[side*.215,1.520,-.354],[side*.089,1.608,-.337]];
    b.add(brushStroke(path,[.045,.084,.104,.097,.077,.036],21,13),'#3c3035');
    b.stroke(path.map(([x,y,z])=>[x*1.04,y+.063,z]),.0046,'#65515a',19);
  }
  // Binkushi comb and a looped takashimada. The tie narrows the centre;
  // the loop is actually open and can be seen in side and rear three-quarter views.
  const loop=[[0,1.588,-.274],[-.047,1.741,-.217],[-.034,1.808,-.092],
    [0,1.775,-.014],[.057,1.712,-.058],[.073,1.652,-.188],[.045,1.613,-.263]];
  b.add(brushStroke(loop,[.05,.116,.133,.129,.122,.085,.039],32,18),blackHair);
  for(const side of [-1,1])for(let i=0;i<4;i++){
    b.stroke(loop.slice(1,6).map(([x,y,z],k)=>[x+side*(.068+i*.011),y+.035*Math.sin(k*.73),z+.03]),
      .0029,i%2?'#77636b':'#5b4a50',13);
  }
  b.add(brushStroke([[-.15,1.605,-.278],[-.084,1.622,-.329],[0,1.628,-.35],
    [.092,1.620,-.323],[.152,1.597,-.269]],[.011,.020,.023,.02,.012],16),kind===0?'#b95a4c':'#977352');
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
    const forward=side===1?.194:.08;
    b.ball(side*.5,.701,forward+.196,.083,.075,.084,flesh);
  }
  if(kind===0 || kind===2)foldingFan(b,.48,.72,.42,kind===0?.47:.79);
  if(kind===1)shamisen(b);
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
  const points=coords.map(([u,v])=>{
    const [x,z]=districtPoint('kyo',u,v);
    return new THREE.Vector3(x,0,z);
  });
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
  const perKind=5, faces=[],counts=new Uint8Array(outfits.length);
  const distance=costumeDistance(scene,perKind*outfits.length);
  const faceFrame=new THREE.Matrix4().compose(new THREE.Vector3(0,.768,-.011),new THREE.Quaternion(),
    new THREE.Vector3(.423,.352,.347));
  const facePose=new THREE.Matrix4();
  const footwear=instances(crowd,shoes.geometry,shoes.material,outfits.length*perKind*2,'鼻緒と下駄');
  for(let kind=0;kind<outfits.length;kind++){
    const model=batchActorParts(reference,b=>body(b,kind));
    parts.push([
      instances(crowd,model.geometry,scrollPigment(),perKind,outfits[kind].name),
      instances(crowd,kosode(kind),silkMaterial(),perKind,'染め小袖'),
    ]);
    const face=dressedRiceFace(kind,perKind);
    crowd.add(face);faces.push(face);
    for(let i=0;i<perKind;i++){
      const dye=new THREE.Color().setHSL((kind*.18+i*.21)%1,.12,.91);
      const route=routes[(kind+i)%routes.length];
      walkers.push({kind,dye,costume:kind,route,length:route.getLength(),phase:(kind*.203+i*.371)%1,
        pace:.65+.24*((kind*1.7+i*.41)%1),scale:.87+.17*((kind*.31+i*.27)%1),direction:i%2?-1:1});
    }
  }
  const dummy=new THREE.Object3D(), at=new THREE.Vector3(), next=new THREE.Vector3();
  return (time,player,camera)=>{
    distance.begin(time,player,camera);
    const dx=wrapDelta(DISTRICTS.kyo.x-player.x),dz=wrapDelta(DISTRICTS.kyo.z-player.z);
    crowd.visible=dx*dx+dz*dz<134**2;
    if(!crowd.visible){distance.end();return;}
    counts.fill(0);footwear.count=0;
    crowd.position.set(player.x+dx-DISTRICTS.kyo.x,0,player.z+dz-DISTRICTS.kyo.z);
    for(const w of walkers){
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
      const bob=.012+Math.abs(ripple)*.033;
      if(!distance.close(w,at.x+crowd.position.x,y+bob,at.z+crowd.position.z,yaw,w.scale))continue;
      const instance=counts[w.kind]++;
      dummy.position.set(at.x,y+bob,at.z);
      dummy.rotation.set(0,yaw,.026*ripple,'YXZ');dummy.scale.setScalar(w.scale);
      dummy.updateMatrix();
      for(const m of parts[w.kind])m.setMatrixAt(instance,dummy.matrix);
      parts[w.kind][1].setColorAt(instance,w.dye);
      faces[w.kind].setMatrixAt(instance,facePose.multiplyMatrices(dummy.matrix,faceFrame));
      for(const side of [-1,1]){
        const across=side*.17*w.scale, along=Math.cos(gait)*side*.164*w.scale;
        dummy.position.set(at.x+Math.cos(yaw)*across+Math.sin(yaw)*along,y+Math.max(0,ripple*side)*.062,
          at.z-Math.sin(yaw)*across+Math.cos(yaw)*along);
        dummy.rotation.set(-.10*ripple*side,yaw,0,'YXZ');dummy.updateMatrix();
        footwear.setMatrixAt(footwear.count++,dummy.matrix);
      }
    }
    for(let k=0;k<parts.length;k++){
      for(const mesh of [...parts[k],faces[k]]){
        mesh.count=counts[k];mesh.visible=mesh.count>0;
        if(mesh.count){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
      }
    }
    distance.end();
    footwear.instanceMatrix.needsUpdate=true;
  };
}
