import * as THREE from './vendor/three.module.min.js';
import { batchActorParts as paint } from './actors.js';
import { CONNECTING_ROADS, WATER_Y, riverZ, coastX, eastCoastX, terrainHeight, wrapDelta } from './terrain.js';
import { measureRoute, cartPosition } from './trade-routes.js';

const { PI, sin, cos }=Math;
const ink='#3c3935', lacquer='#653c31', straw='#b2915b', pine='#526551', gold='#cba861', ivory='#ede4cd';
const hoop=new THREE.TorusGeometry(1,.072,8,40);

function traveller(b,x,y,z,noble) {
  const robe=noble?'#73576f':'#596f70';
  b.ball(x,y+.44,z,.51,.53,.46,robe);
  b.ball(x,y+.77,z,.43,.34,.4,'#fff3d8');
  for(const side of [-1,1]) {
    b.ball(x+side*.145,y+.80,z+.343,.026,.039,.014,ink);
    b.ball(x+side*.232,y+.73,z+.325,.058,.024,.015,'#d9a38e');
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
  paint(root,b=>{
    b.box(0,1.21,-.54,1.99,.22,2.53,lacquer);
    b.box(0,1.36,-.56,1.88,.12,2.47,straw);
    for(const side of [-1,1]) {
      b.rod([side*.87,1.13,-1.95],[side*.52,1.26,2.61],.065,'#766342');
      b.box(side*.93,1.63,-.53,.09,.45,2.17,pine);
      for(const z of [-1.58,.53]) b.box(side*.93,2.09,z,.086,1.48,.086,lacquer);
      // Rolled misu blinds frame both side windows and leave a view of the passenger.
      for(let i=0;i<6;i++) {
        b.box(side*.95,2.72-i*.043,-.52,.065,.037,2.15,i%2?straw:'#c9ae7d');
      }
      for(const z of [-1.34,.31]) b.box(side*.98,2.43,z,.045,.54,.24,'#8f634a');
      b.box(side*.91,2.80,-.54,.11,.095,2.58,gold);
    }
    for(let i=-6;i<=6;i++) {
      const u=i/6, height=2.99-.18*u*u;
      b.box(u*1.14,height,-.54,.194,.105,2.81,'#50584e',[0,0,-.25*u]);
    }
    for(const z of [-1.97,.90]) b.stroke([[-1.16,2.80,z],[-.55,2.96,z],[0,3.02,z],[.55,2.96,z],[1.16,2.80,z]],.052,lacquer);
    b.box(0,1.51,-.52,1.03,.18,1.04,'#a37657');
    traveller(b,0,1.56,-.60,true);
    b.rod([-.59,1.32,2.57],[.59,1.32,2.57],.078,'#886849');
    // The sloping shoulders run into a heavy poll and the white muzzle.
    b.ball(0,1.01,2.93,.47,.58,.93,'#49443a',[.04,0,0]);
    b.ball(0,1.23,3.47,.48,.57,.53,'#4e473b');
    b.ball(0,1.55,3.87,.32,.44,.41,'#47443b',[-.21,0,0]);
    b.ball(0,1.36,4.19,.28,.19,.25,'#ac9b83');
    for(const side of [-1,1]) {
      b.ball(side*.12,1.39,4.40,.038,.026,.019,ink);
      b.ball(side*.248,1.63,4.065,.043,.043,.04,'#231f1b');
      b.ball(side*.38,1.69,3.79,.22,.08,.1,'#4e463d',[0,.17*side,.28*side]);
      b.stroke([[side*.19,1.82,3.85],[side*.35,1.94,3.80],[side*.48,2.09,3.84]],.058,'#d0b68b');
      b.rod([side*.48,2.07,3.84],[side*.56,2.21,3.89],.055,'#ab9474',.006);
      b.stroke([[side*.19,1.42,4.33],[side*.30,1.48,4.11],[side*.28,1.74,3.70]],.026,'#a65a3c');
      b.stroke([[side*.26,1.44,4.11],[side*.55,1.21,3.20],[side*.61,1.3,2.55]],.021,straw);
    }
    b.stroke([[-.34,1.1,2.28],[-.36,.94,1.99],[-.42,.56,1.93]],.036,'#585044');
    b.ball(-.42,.52,1.91,.079,.14,.074,'#302d28');
  },'御簾の牛車');
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
      b.rod([0,0,0],[0,-.36,.065],.114,'#51493b',.087);
      b.rod([0,-.34,.065],[0,-.73,.004],.087,'#6d604e',.067);
      b.ball(0,-.72,.042,.10,.083,.14,ink);
    },'牛の脚',[side*.28,.8,z]));
  }
  return {root,wheels,legs};
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
function marketBoat(tint) {
  const root=new THREE.Group();
  paint(root,b=>{
    b.add(boatHull(),'#886e4d');
    for(const side of [-1,1]){
      const gunwale=Array.from({length:13},(_,i)=>{const t=i/6-1; return [side*(.84*(1-Math.abs(t)**2.3)+.018),.50+.26*t*t,t*3.05];});
      b.stroke(gunwale,.045,'#584937');
    }
    for(let i=-4;i<=4;i++) b.box(0,.43,i*.47,1.25*(1-Math.abs(i/5)**2),.07,.44,straw);
    b.rod([0,.42,-.58],[0,3.3,-.58],.047,'#79573a',.031);
    b.rod([-.88,3.15,-.58],[.88,3.15,-.58],.035,'#624e36');
    for(let j=0;j<9;j++) {
      const t=j/8, next=(j+1)/8, billow=.30*sin(t*PI);
      b.box(0,3.03-t*1.43,-.575+billow,1.54+.18*t,.18,.035,j===1||j===7?tint:ivory,[-Math.atan2(.30*(sin(next*PI)-sin(t*PI)),1.43/8),0,0]);
    }
    // A rice-grain crest on the forward face of the canvas.
    for(const side of [-1,1]) b.ball(side*.12,2.32,-.23,.088,.24,.017,tint,[0,0,-side*.47]);
    for(const z of [-1.55,1.6]) for(const side of [-1,1]) {
      b.ball(side*.30,.65,z,.26,.28,.39,'#bda172');
      for(const dz of [-.12,.14]) b.loop(side*.30,.66,z+dz,.26,.34,.048,'#7d6b4d');
    }
    traveller(b,0,.46,.56,false);
    b.rod([-.42,1.25,.78],[-1.24,.04,1.75],.039,lacquer);
  },'帆掛けの餅問屋');
  return root;
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
  const boats=['#825643','#526775','#7b7051'].map(tint=>{const m=marketBoat(tint);scene.add(m);return m;});
  function place(root,player,x,z,y,yaw){
    const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
    root.visible=dx*dx+dz*dz<155**2;
    if(root.visible){root.position.set(player.x+dx,y,player.z+dz);root.rotation.y=yaw;}
    return root.visible;
  }
  return (time,player)=>{
    for(const {route,root,wheels,legs,speed,offset} of carts){
      const q=cartPosition(route,time,speed,offset), bed=terrainHeight(q.x,q.z);
      if(!place(root,player,q.x,q.z,bed,q.yaw)) continue;
      const fore=terrainHeight(q.x+3*sin(q.yaw),q.z+3*cos(q.yaw));
      root.rotation.order='YXZ';root.rotation.x=-Math.atan2(fore-bed,3);
      wheels.forEach(w=>w.rotation.x=q.travelled/.98);
      legs.forEach((leg,i)=>leg.rotation.x=q.moving?.30*sin(q.distance*3+(i===0||i===3?0:PI)):0);
    }
    boats.forEach((m,i)=>{
      const a=merchantPosition(i,time),b=merchantPosition(i,time+.08);
      if(!place(m,player,a.x,a.z,WATER_Y+.045+.061*sin(time*1.34+i),Math.atan2(b.x-a.x,b.z-a.z))) return;
      m.rotation.order='YXZ';m.rotation.x=.022*cos(time*.91+i);m.rotation.z=.034*sin(time*.83+i);
    });
  };
}
