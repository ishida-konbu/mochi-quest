import * as THREE from './vendor/three.module.min.js';
import { batchActorParts as paint } from './actors.js';
import { CONNECTING_ROADS, WATER_Y, riverZ, coastX, eastCoastX, terrainHeight, wrapDelta } from './terrain.js';
import { pullingOx, oxLeg, courtCurtains, ferryCrew } from './kyo-procession-art.js';
import { illustratedMesh, scrollPigment } from './kyo-scrollwork.js';
import { measureRoute, cartPosition } from './trade-routes.js';

const { PI, sin, cos }=Math;
const ink='#3c3935', lacquer='#653c31', straw='#b2915b', pine='#526551', gold='#cba861', ivory='#ede4cd';
const hoop=new THREE.TorusGeometry(1,.072,8,40);

function traveller(b,x,y,z,noble) {
  const robe=noble?'#73576f':'#596f70';
  b.ball(x,y+.44,z,.51,.53,.46,robe);
  b.ball(x,y+.77,z,.43,.34,.4,'#fff3d8');
  for(const side of [-1,1]) {
    b.ball(x+side*.145,y+.80,z+.383,.026,.039,.015,ink,[0,side*.31,0]);
    b.ball(x+side*.232,y+.73,z+.337,.059,.024,.019,'#d9a38e',[0,side*.34,0]);
    b.rod([x+side*.31,y+.51,z+.16],[x+side*.22,y+.38,z+.47],.14,robe,.115);
  }
  b.stroke([[x-.068,y+.717,z+.39],[x,y+.698,z+.397],[x+.067,y+.719,z+.39]],.011,ink);
  b.stroke([[x-.23,y+.56,z+.26],[x+.04,y+.34,z+.47],[x+.20,y+.49,z+.37]],.034,ivory);
  if(noble) {
    b.ball(x,y+1.09,z-.015,.29,.135,.28,ink);
    b.ball(x,y+1.29,z-.07,.15,.21,.13,ink,[.32,0,0]);
    b.rod([x+.02,y+.37,z+.47],[x+.16,y+.64,z+.45],.05,gold,.082);
  } else {
    b.rod([x,y+1.035,z],[x,y+1.29,z],.61,straw,.052);
    for(let k=0;k<12;k++){
      const a=k*PI/6;
      b.rod([x+.044*cos(a),y+1.28,z+.044*sin(a)],[x+.60*cos(a),y+1.038,z+.60*sin(a)],.009,'#846a48');
    }
  }
}
function oxCarriage() {
  const root=new THREE.Group(), wheels=[], legs=[];
  const wagon=paint(root,b=>{
    b.box(0,1.21,-.54,1.99,.22,2.53,lacquer);
    b.box(0,1.36,-.56,1.88,.12,2.47,straw);
    for(const side of [-1,1]) {
      b.rod([side*.87,1.13,-1.95],[side*.52,1.26,2.61],.065,'#766342');
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
    b.rod([-.59,1.32,2.57],[.59,1.32,2.57],.078,'#886849');
    pullingOx(b);
  },'御簾の牛車');
  wagon.material=scrollPigment();
  const noble=paint(root,b=>traveller(b,0,0,0,true),'簾を上げて道を眺める公達', [.13,1.39,-.45]);
  noble.material=scrollPigment();noble.rotation.y=.66;
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
    for(const z of [2.40,3.46]) legs.push(paint(root,b=>{
      oxLeg(b,side,z>3);
    },'牛の脚',[side*.28,.8,z]));
  }
  for(const mesh of legs)mesh.material=scrollPigment();
  return {root,wheels,legs,noble};
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
function marketBoat(tint,index) {
  const root=new THREE.Group();
  const hull=paint(root,b=>{
    b.add(boatHull(),'#886e4d');
    for(const side of [-1,1]){
      const gunwale=Array.from({length:13},(_,i)=>{const t=i/6-1; return [side*(.84*(1-Math.abs(t)**2.3)+.018),.50+.26*t*t,t*3.05];});
      b.stroke(gunwale,.045,'#584937');
    }
    for(let i=-4;i<=4;i++) b.box(0,.43,i*.47,1.25*(1-Math.abs(i/5)**2),.07,.44,straw);
    b.rod([0,.42,-.58],[0,3.3,-.58],.047,'#79573a',.031);
    b.rod([-.88,3.15,-.58],[.88,3.15,-.58],.035,'#624e36');
    for(const side of [-1,1]){
      b.stroke([[side*.90,3.15,-.56],[side*.72,2.14,-.30],[side*.78,.54,-1.34]],.014,'#957956');
      b.stroke([[side*.84,3.16,-.56],[side*.92,2.86,-.45],[side*.95,1.58,-.56],[side*.68,.55,.13]],.011,'#7b6750');
      b.rod([side*.86,1.56,-.57],[side*.91,1.61,-.56],.025,straw);
      for(const height of [.14,.28]){
        const seam=Array.from({length:15},(_,i)=>{
          const t=i/7-1;
          return [side*(.84*(1-Math.abs(t)**2.3)+.018)*(.72+height*.58),height+.26*t*t,t*3.05];
        });
        b.stroke(seam,.011,'#5e503f');
      }
    }
    b.rod([-.98,1.57,-.56],[.98,1.57,-.56],.025,'#9d8459');
    for(const z of [-1.05,.85]){
      b.stroke([[0,3.2,-.57],[-.035,2.43,z*.34-.35],[.025,.53,z]],.011,'#786954');
    }
    for(const z of [-1.55,1.6]) for(const side of [-1,1]) {
      b.ball(side*.30,.65,z,.26,.28,.39,'#bda172');
      for(const dz of [-.12,.14]) b.loop(side*.30,.66,z+dz,.26,.34,.048,'#7d6b4d');
    }
    traveller(b,0,.46,.56,false);
    b.rod([-.42,1.25,.78],[-1.24,.04,1.75],.039,lacquer);
  },'帆掛けの餅問屋');
  hull.material=scrollPigment();
  const row=ferryCrew(root,index);
  return {root,row};
}
export function merchantPosition(index,time) {
  const a=time*(index===2?.040:.021)+[0,1.75,2.4][index];
  if(index===2) {
    const x=69+38*sin(a);
    return {x,z:riverZ(x)+3.8*cos(a)};
  }
  const z=(index===0?159:210)+(index===0?83:117)*sin(a);
  const coast=index===0?coastX(z):eastCoastX(z);
  return {x:coast+(index===0?-1:1)*(23+12*cos(a)),z};
}
export function createTravellers(scene) {
  const carts=CONNECTING_ROADS.slice(0,2).map((road,i)=>{
    const cart=oxCarriage();
    scene.add(cart.root);
    return {...cart,route:measureRoute(road.points),speed:i===0?1.85:1.63,offset:i===0?85:30};
  });
  const boats=['#825643','#526775','#7b7051'].map((tint,i)=>{const boat=marketBoat(tint,i);scene.add(boat.root);return boat;});
  function place(root,player,x,z,y,yaw){
    const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
    root.visible=dx*dx+dz*dz<155**2;
    if(root.visible){root.position.set(player.x+dx,y,player.z+dz);root.rotation.y=yaw;}
    return root.visible;
  }
  return (time,player)=>{
    for(const {route,root,wheels,legs,noble,speed,offset} of carts){
      const q=cartPosition(route,time,speed,offset), bed=terrainHeight(q.x,q.z);
      if(!place(root,player,q.x,q.z,bed,q.yaw)) continue;
      const fore=terrainHeight(q.x+3*sin(q.yaw),q.z+3*cos(q.yaw));
      root.rotation.order='YXZ';root.rotation.x=-Math.atan2(fore-bed,3);
      const look=Math.atan2(wrapDelta(player.x-q.x),wrapDelta(player.z-q.z))-q.yaw;
      noble.rotation.y=Math.max(-1.22,Math.min(1.22,Math.atan2(sin(look),cos(look))))+.08*sin(time*.56);
      noble.rotation.z=.036*cos(time*1.23+offset);
      wheels.forEach(w=>w.rotation.x=q.travelled/.98);
      legs.forEach((leg,i)=>leg.rotation.x=q.moving?.30*sin(q.distance*3+(i===0||i===3?0:PI)):0);
    }
    boats.forEach(({root:m,row},i)=>{
      const a=merchantPosition(i,time),b=merchantPosition(i,time+.08);
      if(!place(m,player,a.x,a.z,WATER_Y+.045+.061*sin(time*1.34+i),Math.atan2(b.x-a.x,b.z-a.z))) return;
      row(time,wrapDelta(a.x-player.x)**2+wrapDelta(a.z-player.z)**2<52**2);
      m.rotation.order='YXZ';m.rotation.x=.022*cos(time*.91+i);m.rotation.z=.034*sin(time*.83+i);
    });
  };
}
