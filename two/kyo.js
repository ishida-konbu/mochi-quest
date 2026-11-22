import { mountainFires } from './mountain-fires.js';
import { HIGASHIYAMA, KITAYAMA, eastRidgeHeight, northRidgeHeight, fukuFirebeds, daiFirebeds, inFireMeadow } from './higashiyama.js';
import { createRashomon } from './rashomon.js';
import { districtPoint } from './geography.js';
import * as THREE from './vendor/three.module.min.js';
import { KYO_BUILDINGS, KYO_FOOD, KYO_SCREENS, screenFold, kyoNight } from './kyo-layout.js';
import { scrollPaper, printSurface } from './kyo-scrollwork.js';
import { createStreetCrowd } from './kyo-people.js';
import { createStreetWatch } from './street-watch.js';
import { seeded, terrainHeight } from './terrain.js';
import { sculpture } from './pilgrimage-pigment.js';

const TAU=Math.PI*2;
const timber='#775942', lacquer='#874b39', soot='#484840', gilt='#c4a66e';
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
function frame(p,x,z,yaw) {
  const co=Math.cos(yaw),si=Math.sin(yaw),base=terrainHeight(x,z);
  const pos=(u,y,v)=>vec(x+co*u+si*v,base+y,z-si*u+co*v);
  return {
    part(shape,u,y,v,sx,sy,sz,tint,mat=p.solid,angle=0,roll=0){
      const a=pos(u,y,v);
      p.part(shape,a.x,a.y,a.z,sx,sy,sz,tint,yaw+angle,0,roll,mat,true,true);
    },
    stroke(a,b,r,tint,mat=p.wood,rect=false){
      p.link(pos(...a),pos(...b),r,tint,rect,true,true,mat);
    },
    post(u,v,height,r,color=timber) {
      const top=pos(u,height,v);
      p.link(vec(top.x,terrainHeight(top.x,top.z)-.14,top.z),top,r,color,false,true,true,p.wood);
    },
  };
}
function painted(w,h,draw,options={}) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  draw(canvas.getContext('2d'),w,h);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide,...options});
}
// Rain-softened lettering and fabric designs are painted once for every instance.
function cloth(label,bg,fg,vertical=false){
  return painted(vertical?128:320,vertical?256:112,(c,w,h)=>{
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let j=0;j<h;j+=3){
      c.fillStyle=j%2?'rgba(255,244,209,.06)':'rgba(56,39,37,.047)';c.fillRect(0,j,w,1);
    }
    if(vertical){
      const rng=seeded(label.codePointAt(0));
      for(let x=0;x<w;x+=2){
        c.fillStyle=x%6?'rgba(249,233,199,.048)':'rgba(64,47,41,.10)';
        c.fillRect(x,0,1,h);
      }
      for(let j=0;j<230;j++){
        c.fillStyle='rgba(238,225,197,.18)';
        c.fillRect(rng()*w,rng()*h,.7,1+rng()*4.5);
      }
    }
    c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(6,6,w-12,h-12);
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
    c.font='bold '+(vertical?55:62)+'px "Hiragino Mincho ProN","Yu Mincho",serif';
    if(vertical)[...label].forEach((v,i)=>c.fillText(v,w*.5,h*(i+.56)/label.length));
    else c.fillText(label,w*.5,h*.52,w*.86);
    c.fillStyle='#a44333';c.fillRect(w*.81,h*.78,w*.075,h*.109);
    c.strokeStyle='#e4c9a0';c.lineWidth=1;c.strokeRect(w*.825,h*.80,w*.05,h*.071);
  });
}
function hangingBanner() {
  const g=new THREE.PlaneGeometry(1,1,16,12),points=g.attributes.position;
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),drop=.5-y;
    points.setXYZ(i,x+.026*drop*drop,y+.018*drop*drop*Math.sin(8*x),
      (.022+.072*drop)*Math.sin(11*x+.6*drop)+.045*drop*drop);
  }
  g.computeVertexNormals();return g;
}

function ironKettle() {
  const pot=sculpture(),iron='#474c47',patina='#65675a';
  const cast=(profile,tint)=>pot.add(new THREE.LatheGeometry(profile.map(q=>new THREE.Vector2(...q)),38),tint);
  cast([[.02,0],[.18,0],[.235,.043],[.284,.12],[.302,.201],[.284,.28],[.238,.345],[.191,.377],[.16,.38]],iron);
  cast([[.008,.432],[.06,.424],[.134,.406],[.18,.387],[.201,.39],[.201,.373],[.182,.369]],patina);
  pot.ball(iron,0,.465,0,.032,.037,.032);
  pot.stroke(iron,[[-.21,.30,0],[-.236,.44,0],[-.177,.63,.008],[-.01,.695,.022],[.165,.635,.043],[.236,.456,.035],[.206,.30,0]],
    [.019,.022,.025,.026,.023,.020,.016],32);
  pot.stroke(patina,[[-.228,.19,.064],[-.295,.223,.079],[-.343,.306,.09],[-.389,.366,.093],[-.416,.376,.093]],
    [.079,.068,.049,.034,.041],24);
  const stud=new THREE.ConeGeometry(.013,.014,6);
  for(let j=0;j<3;j++)for(let i=0;i<28;i++){
    const a=(i+j*.5)*TAU/28,r=[.285,.298,.300][j];
    pot.add(stud,patina,r*Math.sin(a),.124+j*.036,r*Math.cos(a),1,1,1,Math.PI/2,a);
  }
  return pot.finish();
}
function lanternPaper(){
  return painted(256,144,(c,w,h)=>{
    const wash=c.createLinearGradient(0,0,0,h);
    wash.addColorStop(0,'#b64d37');wash.addColorStop(.48,'#f1a377');wash.addColorStop(1,'#bd5b44');
    c.fillStyle=wash;c.fillRect(0,0,w,h);
    for(let y=6;y<h;y+=10){
      c.strokeStyle='rgba(69,38,31,.48)';c.lineWidth=1.5;
      c.beginPath();c.moveTo(0,y);c.bezierCurveTo(80,y+2,160,y-1,256,y);c.stroke();
    }
    // A blossom crest divided by two strokes like a woodblock printer's seal.
    for(const x of [64,192]){
      c.fillStyle='#ffde9b';c.beginPath();c.arc(x,74,30,0,TAU);c.fill();
      c.strokeStyle='#a6563f';c.lineWidth=2.5;c.stroke();
      c.fillStyle='#ae4938';
      for(let j=0;j<5;j++){
        const a=j*TAU/5;
        c.beginPath();c.ellipse(x+Math.cos(a)*9,74+Math.sin(a)*9,9,5.2,a,0,TAU);c.fill();
      }
      c.fillStyle='#efb170';c.beginPath();c.arc(x,74,3,0,TAU);c.fill();
    }
  },{emissive:'#ffac62',emissiveIntensity:.04});
}
function lantern(f,x,top,z,r,light) {
  const h=r*2.8;
  f.stroke([x,top+.28,z],[x,top,z],.015,'#6b583f');
  f.part('kyoLantern',x,top-h/2,z,r,h,r,'#ffffff',light);
  for(const end of [-1,1])
    f.part('round',x,top-h/2+end*h*.462,z,r*.69,.065,r*.69,soot);
  f.stroke([x,top-h,z],[x,top-h-.125,z],.012,'#87603d');
}
function paintedShutters(p,{x,z,yaw,width:w,height:h,picture}) {
  const f=frame(p,x,z,yaw),base=.34,depth=1.55;
  const mat=scrollPaper();
  f.part('box',0,base-.05,0,w+.24,.16,.68,'#564b3c',p.deck);
  f.part('kyoScreen'+picture,0,base+h*.5,.047,w,h,depth,'#fff',mat);
  for(let i=0;i<4;i++){
    const a=i/4,b=(i+1)/4,x0=(a-.5)*w,x1=(b-.5)*w;
    for(const y of [base-.007,base+h+.009]){
      f.stroke([x0,y,screenFold(a)],[x1,y,screenFold(b)],.066,'#423b30',p.wood,true);
      f.stroke([x0,y+.022,screenFold(a)+.011],[x1,y+.022,screenFold(b)+.011],.013,'#c2a16c');
    }
    if(i)f.stroke([x0,base,screenFold(a)],[x0,base+h,screenFold(a)],.011,'#706248');
  }
  for(const y of [base-.16,base+h+.12])
    f.part('box',0,y,.07,w+.11,.16,.08,'#897448',p.wood);
  for(const side of [-1,1]){
    f.part('box',side*w*.502,base+h*.5,.05,.061,h+.09,.087,'#554534',p.wood);
    f.part('box',side*(w*.5-.12),base+.13,.025,.19,.17,.062,'#76664c',p.bronze);
    f.stroke([side*w*.39,base+h*.62,0],[side*w*.39,.06,-.47],.050,timber,p.wood,true);
  }
}

function shopFronts(p,light,windowPaper){
  const banners={dye:cloth('染','#526777','#eae4c9',true),brew:cloth('酒','#bca273','#574b3a',true),
    tea:cloth('茶','#7f9278','#f4e8cd',true),ink:cloth('書','#65566c','#efe3c7',true),
    rice:cloth('米','#a87656','#f2dfbf',true),lodge:cloth('旅籠','#586b68','#e9dec2',true)};
  for(const [i,entry] of KYO_BUILDINGS.entries()){
    const [x,z,w,d,wall,,yaw,kind,craft]=entry;
    if(kind==='pagoda'||kind==='temple'||kind==='wardShop')continue;
    const f=frame(p,x,z,yaw),end=(i%2?1:-1)*w*.44, front=d*.5+1.16;
    f.stroke([end,wall-.46,front-1.28],[end,wall-.41,front+.20],.055,timber);
    if(i%3){
      lantern(f,end,wall-.53,front,.325,light);
      const offset=-end;
      f.stroke([offset,wall-.34,front-.9],[offset,wall-.34,front+.17],.042,timber);
      f.part('shopBanner',offset,wall-1.08,front-.08,.62,1.28,1,'#fff',banners[craft],.09,.032);
    } else {
      f.part('shopBanner',end,wall-1.14,front,.67,1.35,1,'#fff',banners[craft],.045);
    }
    // Narrow projecting lattice bays, and the bamboo blind rolled beneath each eave.
    const flank=-Math.sign(end)*w*.415, face=d*.50+.198, wide=w*.145;
    f.part('box',flank,1.45,face,wide,1.47,.23,'#514a3c',p.boarding);
    for(let k=0;k<6;k++)f.part('box',flank+wide*(k/5-.5),1.45,face+.134,.046,1.5,.06,'#997958',p.wood);
    f.stroke([flank-wide*.58,2.28,face+.12],[flank+wide*.58,2.28,face+.12],.118,'#b59c70');
    // Slender lattice windows in the gable walls light up the cross streets at night.
    for(const side of [-1,1]){
      // Two pairs of machiya unfold their summer screens onto the stone avenue.
      const screen=KYO_SCREENS.find(q=>q.shop===i && q.side===side);
      if(screen){
        paintedShutters(p,screen);
        continue;
      }
      const sideX=side*(w*.5+.13), sill=1.22, span=d*.50;
      f.part('box',sideX,sill+ .65,0,.12,1.30,span,'#fff',windowPaper);
      for(const h of [sill-.045,sill+.65,sill+1.35])
        f.part('box',sideX+side*.10,h,0,.12,.08,span+.16,timber,p.wood);
      for(let k=0;k<=10;k++)
        f.part('box',sideX+side*.08,sill+.65,span*(k/10-.5),.09,1.37,k%5===0?.083:.032,timber,p.wood);
      f.part('box',sideX+side*.05,sill+1.45,0,.30,.085,span+.40,'#636a61',p.roofs);
    }
  }
}
function foodCounter(p,stand,light) {
  const tea=stand.type==='kyoTea',f=frame(p,stand.x,stand.z,stand.yaw);
  const sign=cloth(tea?'宇治茶':'みたらし',tea?'#596e59':'#8c5642','#f0dfb6');
  const mark=cloth(tea?'茶':'団子',tea?'#7e9376':'#b58661','#fff0cb',true);
  const width=3.25;
  // A three-drop curtain at the back spans the counter. The kettle and the skewer rack
  // remain in front of the painted serving scene, with the sides open to the street.
  f.part('kyoCurtain'+(tea?0:1),0,1.73,-.71,3.04,1.57,.42,'#fff',scrollPaper());
  f.stroke([-1.64,2.53,-.70],[1.64,2.53,-.70],.045,timber);
  for(const x of [-1.57,1.57]) for(const z of [-.78,.66])f.post(x,z,2.58,.068);
  f.part('hipRoof',0,2.56,0,3.95,.79,2.20,'#8e8a72',p.roofs);
  f.part('box',0,2.43,.74,width,.17,.17,timber,p.wood);
  f.part('box',0,2.27,.78,1.6,.53,.13,'#73583e',p.wood);
  f.part('plane',0,2.27,.856,1.52,.46,1,'#fff',sign);
  for(const x of [-1.27,1.27]){
    f.part('shopBanner',x,2.05,.76,.48,.91,1,'#fff',mark,0,x*.014);
    f.part('box',x,.59,.18,.12,1.12,.41,timber,p.wood);
  }
  f.part('box',0,.91,.24,2.98,.105,1.05,'#b9996a',p.deck);
  f.part('box',0,.68,.70,2.69,.33,.074,tea?'#73836a':'#a35f48');
  f.part('box',0,.38,-.29,2.44,.079,.6,timber,p.wood);
  lantern(f,-1.85,2.49,.12,.225,light);
  if(tea){
    f.part('teaKettle',-.68,.969,.23,1,1,1,'#fff',p.stems);
    for(let j=0;j<5;j++){
      const x=.16+j%3*.32, z=.04+Math.floor(j/3)*.29;
      f.part('kyoCup',x,.974,z,.121,.139,.12,j%2?'#e3dbc1':'#9caca0');
      f.part('round',x,1.098,z,.098,.008,.097,'#829452');
    }
  } else {
    f.part('box',-.66,1.045,.20,.88,.165,.51,'#534c40');
    for(let i=0;i<5;i++)f.part('box',-.97+i*.15,1.132,.17,.115,.035,.34,'#ac6240');
    f.part('box',.52,1.008,.27,1.0,.079,.69,'#c4a878',p.deck);
    for(let j=0;j<6;j++){
      const x=-.99+j*.34, z=j<3?.14:.26, y=j<3?1.22:1.112;
      f.stroke([x,y,z-.29],[x,y,z+.42],.012,'#b69560');
      for(let i=0;i<4;i++){
        const zz=z-.22+i*.113;
        f.part('ball',x,y+.032,zz,.080,.077,.078,i%2?'#aa693f':'#bc8049');
        f.part('ball',x-.018,y+.088,zz+.015,.035,.014,.022,'#dbab72');
      }
    }
  }
  // A vermilion felt-covered bench beside the shop.
  f.part('box',2.32,.42,-.19,.76,.12,1.62,'#a04f46');
  for(const z of [-.76,.37])f.part('box',2.32,.22,z,.55,.39,.13,timber,p.wood);
}
function streetLamps(p,light){
  for(const z of [-382,-395,-411,-438,-451,-472]){
    for(const side of [-1,1]){
      const f=frame(p,...districtPoint('kyo',120+side*4.85,z),0);
      f.part('rock',0,.12,0,.38,.20,.36,'#919782',p.stone);
      f.post(0,0,3.10,.076);
      f.stroke([side*.16,3.04,0],[-side*.83,3.04,0],.059,timber);
      f.stroke([0,2.55,0],[-side*.53,3.03,0],.038,timber);
      lantern(f,-side*.70,2.88,0,.235,light);
    }
  }
  // Dyed lanterns mark the crossing between the two market rows.
  const f=frame(p,...districtPoint('kyo',150,-425),0);
  for(const z of [-4.6,4.6])f.post(0,z,4.33,.087);
  const cable=z=>3.48+.81*(z/4.6)**2;
  for(let i=0;i<12;i++){
    const a=-4.6+i*9.2/12,b=a+9.2/12;
    f.stroke([0,cable(a),a],[0,cable(b),b],.018,'#5e5842');
    if(i%2)lantern(f,0,cable(a)-.1,a,.20,light);
  }
}

// The two paved avenues share world-space UVs, so courses continue across the junction.
export function kyoPavingMaterial() {
  const rand=seeded(0x675e5a);
  const stone=painted(768,512,(c,w,h)=>{
    c.fillStyle='#aaa396';c.fillRect(0,0,w,h);
    const palette=['#c6c3b5','#bdbbad','#bfc1b7','#c5bfae','#c0bcae','#c9c6b9'];
    for(let j=0;j<8;j++){
      const top=j*h/8;
      let x=0;
      while(x<w){
        const end=Math.min(w,x+78+rand()*82);
        const left=x+1, right=end-1, y=top+1.1, bottom=top+h/8-1.1;
        const face=c.createLinearGradient(left,y,right,bottom);
        const shade=palette[Math.floor(rand()*palette.length)];
        face.addColorStop(0,shade);face.addColorStop(.65,shade);face.addColorStop(1,'#bcb9ab');
        c.fillStyle=face;
        c.beginPath();c.moveTo(left+3,y+rand()*1.3);c.lineTo(right-3,y);
        c.lineTo(right,y+2);c.lineTo(right,bottom-2-rand()*2);c.lineTo(right-3,bottom);
        c.lineTo(left+3,bottom);c.lineTo(left,bottom-4);c.lineTo(left,y+3);c.closePath();c.fill();
        c.strokeStyle='rgba(247,240,212,.33)';c.lineWidth=1;
        c.beginPath();c.moveTo(left+3,y+1);c.lineTo(right-4,y+1);c.stroke();
        x=end;
      }
    }
    for(let i=0;i<17000;i++){
      c.fillStyle=i%3?'rgba(250,244,223,.16)':'rgba(62,61,54,.17)';
      c.fillRect(rand()*w,rand()*h,.46+rand()*1.9,.55+rand()*2.0);
    }
    for(let i=0;i<180;i++){
      const x=rand()*w,y=rand()*h;
      c.strokeStyle=i%3?'rgba(252,242,217,.13)':'rgba(93,86,69,.14)';c.lineWidth=.8;
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+5,y-1,x+9+rand()*8,y-1.5);c.stroke();
    }
  },{transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  stone.map.wrapS=stone.map.wrapT=THREE.RepeatWrapping;
  return stone;
}

// Clumps, rather than a repeating lawn, set the scale of the cut slopes.
// Washes sit on the earth; broken shale outcrops and swaying susuki plumes
// are drawn with the same tapered brush. The complete slope is one mesh.
function hillsideInk(p,east,hearths) {
  const {x:cx,z:cz}=east?HIGASHIYAMA:KITAYAMA;
  const height=east?eastRidgeHeight:northRidgeHeight;
  const rand=seeded(east?66189:73462), positions=[],colors=[],indices=[];
  const palette=['#5b5b41','#87815b','#aa9569','#c2ad80','#565c50','#8b8872','#a59e83'].map(c=>new THREE.Color(c));
  const point=(a,b)=>[cx+(east?a:b),cz+(east?b:-a)];
  function vertex(x,y,z,ink){
    positions.push(x-cx,y,z-cz);colors.push(ink.r,ink.g,ink.b);
  }
  function brush(x,z,dx,dz,width,ink,curve,lift){
    const len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,base=positions.length/3;
    for(let j=0;j<=5;j++){
      const t=j/5,bow=Math.sin(t*Math.PI),w=width*(.041+.96*bow**.66);
      const xx=x+dx*t+nx*curve*bow,zz=z+dz*t+nz*curve*bow;
      for(const edge of [-w,w]){
        const u=xx+nx*edge,v=zz+nz*edge;
        vertex(u,terrainHeight(u,v)+.19+lift*bow,v,ink);
      }
      if(j<5){const k=base+j*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
  }
  function susuki(x,z,size) {
    const y=terrainHeight(x,z)+.13;
    for(let j=0;j<6;j++){
      const turn=rand()*TAU,dx=Math.cos(turn)*size,dz=Math.sin(turn)*size;
      const base=positions.length/3,ink=palette[j%3],tall=(.43+rand()*.36)*size;
      const lean=.15+rand()*.28;
      vertex(x,y,z,ink);
      vertex(x+dx*.29-dz*.105,y+tall*.69,z+dz*.29+dx*.105,ink);
      vertex(x+dx*.29+dz*.105,y+tall*.69,z+dz*.29-dx*.105,ink);
      vertex(x+dx*.75,y+tall*(.85+lean),z+dz*.75,ink);
      indices.push(base,base+2,base+1,base+1,base+2,base+3);
      if(j%3===0){
        const tip=positions.length/3,straw=palette[3];
        vertex(x+dx*.25,y+tall*.83,z+dz*.25,straw);
        vertex(x+dx*.43+dz*.064,y+tall*1.1,z+dz*.43-dx*.064,straw);
        vertex(x+dx*.43-dz*.064,y+tall*1.1,z+dz*.43+dx*.064,straw);
        vertex(x+dx*.65,y+tall*1.44,z+dz*.65,straw);
        indices.push(tip,tip+1,tip+2,tip+2,tip+1,tip+3);
      }
    }
  }
  for(let i=0;i<1010;i++){
    // Concentrate the brush on the open grade, with occasional sprays and
    // ledges emerging between conifers on the lateral spurs.
    const central=i<640;
    const a=central?-245+rand()*231:(rand()-.53)*427,b=(rand()-.5)*(central?177:550);
    const [x,z]=point(a,b),rise=height(x,z);
    if(rise<8 || !central && inFireMeadow(x,z) && rand()<.5)continue;
    if(hearths.some(([hx,,hz])=>(x-hx)**2+(z-hz)**2<8))continue;
    const stone=Math.sin(b*.071+a*.037)+Math.cos(a*.099-b*.027)>.68 && rise>36;
    // Runs of earth, rock and grass taper along the contour, rarely level.
    const length=(stone?4.1:2.5)+rand()*(stone?9.5:6);
    const across=length*(rand()<.5?-1:1),down=-length*(.16+rand()*.36);
    const dx=east?down:across,dz=east?across:-down;
    const w=stone?.36+rand()*.96:.48+rand()*1.23,curve=(rand()-.5)*2.5;
    brush(x,z,dx,dz,w,palette[stone?4:1],curve,stone?.28:.07);
    if(stone){
      brush(x+.12,z+.13,dx*.81,dz*.81,w*.71,palette[5],curve*.85,.42);
      for(let j=0;j<3;j++){
        const t=rand()*.72;
        brush(x+dx*t,z+dz*t,dx*.28+.10,dz*.28+.10,w*.14,palette[6],.19,.5);
      }
    }else{
      for(let j=0;j<4;j++){
        const t=rand();
        susuki(x+t*dx+(rand()-.5)*1.2,z+t*dz+(rand()-.5)*1.2,.66+rand()*.72);
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  g.userData.range=625;
  const name=east?'eastHillInk':'kyoHillInk';p.shapes[name]=g;
  const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
  p.part(name,cx,0,cz,1,1,1,'#fff',0,0,0,mat,false,true);
}

export function createKyo(scene,painter){
  const p=painter,light=lanternPaper();
  p.shapes.shopBanner=hangingBanner();
  p.shapes.teaKettle=ironKettle();
  light.emissiveMap=light.map;
  p.shapes.kyoLantern=new THREE.LatheGeometry([
    [.48,-.5],[.69,-.47],[.87,-.37],[.97,-.22],[1,.04],[.98,.23],[.89,.36],[.70,.47],[.48,.5],
  ].map(q=>new THREE.Vector2(...q)),18);
  p.shapes.kyoCup=new THREE.LatheGeometry([
    [.47,.01],[.57,.06],[.62,.20],[.93,.84],[1,.96],[.97,1],[.86,.96],[.79,.71],
  ].map(q=>new THREE.Vector2(...q)),16);
  const windowPaper=painted(64,64,(ctx,w,h)=>{
    const sheen=ctx.createLinearGradient(0,0,w,h);
    sheen.addColorStop(0,'#dfd7b9');sheen.addColorStop(1,'#bfb79e');
    ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
  },{emissive:'#f5ae66',emissiveIntensity:0});
  for(let picture=0;picture<4;picture++) p.shapes['kyoScreen'+picture]=printSurface(picture,'screen');
  for(let picture=0;picture<2;picture++) p.shapes['kyoCurtain'+picture]=printSurface(picture,'curtain');
  const gateHouse=createRashomon(scene,p);
  const dai=daiFirebeds(terrainHeight),fuku=fukuFirebeds(terrainHeight);
  hillsideInk(p,false,dai);hillsideInk(p,true,fuku);shopFronts(p,light,windowPaper);
  for(const stand of KYO_FOOD)foodCounter(p,stand,light);
  streetLamps(p,light);
  const crowd=createStreetCrowd(scene);
  const streetWatch=createStreetWatch(scene,p);
  const north=mountainFires(scene,dai,KITAYAMA.x,KITAYAMA.z);
  const east=mountainFires(scene,fuku,HIGASHIYAMA.x,HIGASHIYAMA.z,true);
  return (time,player,camera)=>{
    const night=kyoNight(time,player);
    light.emissiveIntensity=.04+night*.94;
    windowPaper.emissiveIntensity=night*.46;
    streetWatch(time,player);
    gateHouse(time,player);crowd(time,player,camera);north(time,night,player);east(time,night,player);
  };
}
