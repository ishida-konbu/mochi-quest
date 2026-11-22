import * as THREE from './vendor/three.module.min.js';
import { batchActorParts as paint } from './actors.js';
import { wrapDelta } from './terrain.js';
import { courtCurtains, ferryCrew } from './kyo-procession-art.js';
import { harnessBeast, capitalHorse } from './otsu-travellers.js';
import { OX_SCALE } from './scroll-fauna.js';
import { createRoadMerchants } from './road-merchants.js';
import { illustratedMesh, scrollPigment } from './kyo-scrollwork.js';
import { kosode, silkMaterial, SilkPanels } from './kosode.js';
import { dressedRiceFace } from './mochi-model.js';
import { paintedSilk,townPortrait } from './emaki-costume.js';
import { brushStroke } from './pilgrimage-pigment.js';
import { CARRIAGES, OX_HITCH, RIVER_SKIFFS, SKIFF_SCALE, merchantPose, carriagePose } from './traveller-positions.js';
export {merchantPosition} from './traveller-positions.js';

const { PI, sin, cos }=Math;
const ink='#3c3935', lacquer='#653c31', straw='#b2915b', pine='#526551', gold='#cba861';
const hoop=new THREE.TorusGeometry(1,.072,8,40);

export function traveller(parent,noble){
  const root=new THREE.Group();root.name=noble?'御簾の公達餅':'網代笠の問屋餅';
  parent.add(root);
  const kind=noble?5:6,head=dressedRiceFace(kind,0,noble?townPortrait(kind):null);
  head.scale.set(.43,.352,.351);head.position.set(0,.765,-.009);root.add(head);
  const robe=new THREE.Mesh(kosode(kind),noble?paintedSilk():silkMaterial());robe.castShadow=true;root.add(robe);
  paint(root,b=>{
    for(const side of [-1,1]){
      const forward=side===1?.194:.08;
      b.ball(side*.5,.701,forward+.196,.083,.075,.084,'#efe2cb');
    }
    if(noble){
      // A folded lacquered eboshi rises out of its bound headband, with the
      // ridge of each rear fold visible above the blinds of the carriage.
      const profile=[[.03,0],[.24,.012],[.30,.041],[.299,.084],[.257,.13],
        [.194,.205],[.126,.362],[.089,.445],[.023,.483],[.01,.479]];
      const cap=new THREE.LatheGeometry(profile.map(q=>new THREE.Vector2(...q)),32);
      const pos=cap.attributes.position;
      for(let i=0;i<pos.count;i++){
        const y=pos.getY(i);pos.setZ(i,pos.getZ(i)*.8-.29*y*y);pos.setX(i,pos.getX(i)+.075*y);
      }
      cap.computeVertexNormals();b.add(cap,'#3f393b',[0,1.494,-.032]);
      b.stroke([[-.252,1.548,-.063],[-.190,1.628,-.081],[-.106,1.776,-.119],[.028,1.959,-.141]],.009,'#746f6a');
      b.stroke([[-.487,.767,.174],[-.464,.797,.293],[-.394,.934,.336]],.022,'#b6a17a');
      b.rod([-.395,.924,.332],[-.271,1.206,.37],.024,'#b99c68',.058);
    }else{
      // Bamboo ribs bend into an upturned woven brim. Several concentric
      // stitches bind the plaits; a chin cord passes behind the raised cheek.
      const hat=(t,a)=>{
        const r=.04+.569*t;
        return [r*cos(a),1.854-.314*t+.046*(t**7)+.012*t*sin(2*a),.9*r*sin(a)-.042];
      };
      const crown=new SilkPanels();
      crown.cut(11,48,(u,v)=>hat(v,u*2*PI),4);
      b.add(crown.finish(),straw);
      for(let i=0;i<30;i++){
        const a=i*2*PI/30;
        b.stroke([hat(0,a),hat(.30,a+.013),hat(.72,a+.021),hat(1,a)].map(([x,y,z])=>[x,y+.006,z]),
          .0068,i%3?'#aa9167':'#79694e');
      }
      for(const [t,shade] of [[.22,'#c0ae83'],[.72,'#ad9770'],[.974,'#776449']]){
        const pts=Array.from({length:37},(_,i)=>hat(t,i*2*PI/36));
        b.stroke(pts,.009,shade,48,5);
      }
      for(const side of [-1,1])
        b.add(brushStroke([[side*.401,1.595,.04],[side*.414,1.326,.139],
          [side*.307,1.115,.242],[side*.157,1.025,.269]],[.007,.012,.009,.003],16),'#78654c');
    }
  },'旅装と手回り品').material=scrollPigment();
  return root;
}
function oxCarriage() {
  const root=new THREE.Group(), wheels=[];
  const oxZ=OX_HITCH;
  // The yoke and strap follow the ox; the rear shaft sockets belong to the wagon.
  const onOx=([x,y,z])=>[x*OX_SCALE,y*OX_SCALE,oxZ+z*OX_SCALE];
  const shaftTip=side=>onOx([side*.55,1.48,.345]);
  const wagon=paint(root,b=>{
    b.box(0,1.21,-.54,1.99,.22,2.53,lacquer);
    b.box(0,1.36,-.56,1.88,.12,2.47,straw);
    for(const side of [-1,1]) {
      b.rod([side*.87,1.13,-1.95],shaftTip(side),.065,'#766342');
      b.box(side*.93,1.63,-.53,.09,.45,2.17,pine);
      for(const z of [-1.58,.53]) b.box(side*.93,2.09,z,.086,1.48,.086,lacquer);
      // Rolled misu blinds frame both side windows and leave a view of the passenger.
      for(let i=0;i<4;i++) {
        b.box(side*.95,2.78-i*.039,-.52,.065,.033,2.15,i%2?straw:'#c9ae7d');
      }
      for(const z of [-1.34,.31]) b.box(side*.98,2.43,z,.045,.54,.24,'#8f634a');
      b.box(side*.91,2.80,-.54,.11,.095,2.58,gold);
    }
    for(let i=-6;i<=6;i++) {
      const u=i/6, height=2.99-.18*u*u;
      b.box(u*1.14,height,-.54,.194,.105,2.81,'#50584e',[0,0,-.25*u]);
    }
    for(const z of [-1.97,.90]) b.stroke([[-1.16,2.80,z],[-.55,2.96,z],[0,3.02,z],[.55,2.96,z],[1.16,2.80,z]],.052,lacquer);
    for(const side of [-1,1]){
      b.stroke([[side*1.22,2.923,-2.05],[side*1.18,2.834,-1.56],[side*1.16,2.792,-.53],
        [side*1.18,2.834,.51],[side*1.22,2.923,.97]],.061,lacquer);
      b.stroke([[side*1.22,2.948,-2.05],[side*1.18,2.861,-1.56],[side*1.16,2.825,-.53],
        [side*1.18,2.861,.51],[side*1.22,2.948,.97]],.018,gold);
    }
    for(let j=0;j<12;j++){
      const z=-1.87+j*.237;
      b.stroke([[-1.10,2.85,z],[-.62,2.98,z],[0,3.049,z],[.62,2.98,z],[1.10,2.85,z]],.013,
        j%3?'#6c7164':'#858773');
    }
    for(const z of [-1.8,.761]){
      b.ball(0,3.12,z,.071,.099,.079,gold);
      b.ball(0,3.21,z,.046,.079,.048,lacquer);
    }
    courtCurtains(b);
    b.box(0,1.46,-.12,1.03,.12,1.04,'#a37657');
    const bow=[[-.40,1.625,.365],[-.21,1.86,.375],[0,1.895,.38],[.21,1.86,.375],[.40,1.625,.365]];
    b.stroke([shaftTip(-1),...bow.map(onOx),shaftTip(1)],.0375*OX_SCALE,'#80674d');
    const strap=[[-.545,1.49,.345],[-.485,1.17,.395],[-.34,.885,.44],[0,.735,.45],
      [.34,.885,.44],[.485,1.17,.395],[.545,1.49,.345]];
    b.stroke(strap.map(onOx),.0225*OX_SCALE,'#976c54');
  },'御簾の牛車');
  wagon.material=scrollPigment();
  const noble=traveller(root,true);
  noble.position.set(.13,1.38,-.45);noble.scale.setScalar(.71);noble.rotation.y=.66;
  const back=illustratedMesh(root,2,'curtain');
  back.position.set(0,2.211,-1.619);back.scale.set(1.65,1.03,.38);back.rotation.y=Math.PI;
  for(const side of [-1,1]) {
    wheels.push(paint(root,b=>{
      b.add(hoop,ink,[0,0,0],[.98,.98,.98],[0,PI/2,0]);
      for(let i=0;i<14;i++) {
        const a=i*PI/7;
        b.rod([0,0,0],[0,.90*sin(a),.90*cos(a)],.037,straw,.032);
      }
      b.rod([-.14,0,0],[.14,0,0],.15,lacquer);
    },'車輪',[side*1.055,1.035,-.63]));
  }
  const ox=harnessBeast(root,'ox',OX_SCALE,oxZ);
  return {root,wheels,ox,noble};
}
function boatHull() {
  const v=[],ix=[];
  for(let i=0;i<=24;i++){
    const t=i/12-1, w=.84*(1-Math.abs(t)**2.3)+.018, rise=.26*t*t;
    for(const [x,y] of [[-1,.48],[-.71,.08],[0,-.09],[.71,.08],[1,.48],[.83,.47],[.60,.15],[-.60,.15],[-.83,.47],[-1,.48]])
      v.push(x*w,y+rise,t*3.05);
    if(i<24) for(let j=0;j<9;j++){const k=i*10+j;ix.push(k,k+1,k+10,k+10,k+1,k+11);}
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
function marketBoat(index,skiff) {
  const root=new THREE.Group();
  root.name=skiff?.name ?? '沖の帆掛け問屋';
  if(skiff)root.scale.setScalar(SKIFF_SCALE);
  const hull=paint(root,b=>{
    b.add(boatHull(),'#886e4d');
    for(const side of [-1,1]){
      const gunwale=Array.from({length:13},(_,i)=>{const t=i/6-1; return [side*(.84*(1-Math.abs(t)**2.3)+.018),.50+.26*t*t,t*3.05];});
      b.stroke(gunwale,.045,'#584937');
    }
    for(let i=-4;i<=4;i++) b.box(0,.43,i*.47,1.25*(1-Math.abs(i/5)**2),.07,.44,straw);
    if(!skiff){
      b.rod([0,.42,-.58],[0,3.3,-.58],.047,'#79573a',.031);
      b.rod([-.88,3.15,-.58],[.88,3.15,-.58],.035,'#624e36');
    }
    for(const side of [-1,1]){
      if(!skiff){
        b.stroke([[side*.90,3.15,-.56],[side*.72,2.14,-.30],[side*.78,.54,-1.34]],.014,'#957956');
        b.stroke([[side*.84,3.16,-.56],[side*.92,2.86,-.45],[side*.95,1.58,-.56],[side*.68,.55,.13]],.011,'#7b6750');
        b.rod([side*.86,1.56,-.57],[side*.91,1.61,-.56],.025,straw);
      }
      for(const height of [.14,.28]){
        const seam=Array.from({length:15},(_,i)=>{
          const t=i/7-1;
          return [side*(.84*(1-Math.abs(t)**2.3)+.018)*(.72+height*.58),height+.26*t*t,t*3.05];
        });
        b.stroke(seam,.011,'#5e503f');
      }
    }
    if(skiff){
      // Low cargo and folded covers fit between the piles under all three
      // arched bridges. A cloth, tied in two places, identifies each house.
      b.box(0,.71,-.61,1.21,.46,.95,'#8c7554');
      b.box(0,.95,-.61,1.24,.065,1.01,skiff.color);
      for(const side of [-1,1]){
        b.box(side*.605,.826,-.61,.03,.23,1.01,skiff.color,[0,0,side*.07]);
        b.box(side*.627,.797,-.61,.012,.032,.96,'#d3c4a1');
      }
      for(const z of [-.92,-.29])
        b.stroke([[-.68,.52,z],[-.617,.95,z],[0,.998,z],[.617,.95,z],[.68,.52,z]],.019,'#b6a17a');
      b.rod([-.56,.53,-1.63],[-.55,.56,1.53],.034,'#b0986c');
      if(index===3){
        for(const [x,y,color] of [[-.17,1.06,skiff.color],[.14,1.06,'#a68271'],[0,1.26,'#85856f']])
          b.rod([x,y,-1.01],[x,y,-.26],.148,color);
      }
      if(index===4){
        for(const x of [-.26,.26]){
          b.box(x,1.10,-.61,.42,.25,.67,'#9a895d');
          b.box(x,1.24,-.61,.45,.041,.71,'#bda77d');
          b.box(x,1.268,-.61,.065,.022,.71,skiff.color);
        }
      }
    }else{
      b.rod([-.98,1.57,-.56],[.98,1.57,-.56],.025,'#9d8459');
      for(const z of [-1.05,.85])
        b.stroke([[0,3.2,-.57],[-.035,2.43,z*.34-.35],[.025,.53,z]],.011,'#786954');
    }
    for(const z of [-1.55,1.6]) for(const side of [-1,1]) {
      b.ball(side*.30,.65,z,.26,.28,.39,'#bda172');
      for(const dz of [-.12,.14]) b.loop(side*.30,.66,z+dz,.26,.34,.048,'#7d6b4d');
    }
    if(!skiff)b.rod([-.42,1.25,.78],[-1.24,.04,1.75],.039,lacquer);
  },skiff?'橋をくぐる高瀬舟':'帆掛けの餅問屋');
  hull.material=scrollPigment();
  const merchant=traveller(root,false);merchant.position.set(0,.45,.56);merchant.scale.setScalar(.87);
  const row=ferryCrew(root,index,!skiff);
  return {root,row};
}
export function createTravellers(scene) {
  const horse=capitalHorse(scene), walkers=createRoadMerchants(scene);
  const carts=CARRIAGES.map(journey=>{
    const cart=oxCarriage();
    scene.add(cart.root);
    return {...cart,...journey};
  });
  const boats=[null,null,...RIVER_SKIFFS].map((skiff,i)=>{const boat=marketBoat(i,skiff);scene.add(boat.root);return boat;});
  function place(root,player,x,z,y,yaw){
    const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
    root.visible=dx*dx+dz*dz<155**2;
    if(root.visible){root.position.set(player.x+dx,y,player.z+dz);root.rotation.y=yaw;}
    return root.visible;
  }
  return (time,player,camera)=>{
    walkers(time,player,camera);
    horse(time,player);
    for(const cart of carts){
      const {root,wheels,ox,noble,offset}=cart,q=carriagePose(cart,time);
      if(!place(root,player,q.x,q.z,q.y,q.yaw)) continue;
      root.rotation.order='YXZ';root.rotation.x=-Math.atan(q.grade);
      const look=Math.atan2(wrapDelta(player.x-q.x),wrapDelta(player.z-q.z))-q.yaw;
      noble.rotation.y=Math.max(-1.22,Math.min(1.22,Math.atan2(sin(look),cos(look))))+.08*sin(time*.56);
      noble.rotation.z=.036*cos(time*1.23+offset);
      wheels.forEach(w=>w.rotation.x=q.travelled/.98);
      ox.pose(time,Number(q.moving),q.travelled*3.44/OX_SCALE);
    }
    boats.forEach(({root:m,row},i)=>{
      const a=merchantPose(i,time);
      if(!place(m,player,a.x,a.z,a.y,a.yaw)) return;
      row(time,wrapDelta(a.x-player.x)**2+wrapDelta(a.z-player.z)**2<52**2);
      m.rotation.order='YXZ';m.rotation.x=.022*cos(time*.91+i);m.rotation.z=.034*sin(time*.83+i);
    });
  };
}
