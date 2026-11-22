import { groundPrintGLSL } from './ground-print.js';
import { mountainFires } from './mountain-fires.js';
import { HIGASHIYAMA, KITAYAMA, eastRidgeHeight, northRidgeHeight, fukuFirebeds, daiFirebeds, inFireMeadow, FIRE_TRAILS, fireTrailDistance } from './higashiyama.js';
import { createRashomon } from './rashomon.js';
import { districtPoint } from './geography.js';
import * as THREE from './vendor/three.module.min.js';
import { KYO_BUILDINGS, KYO_FOOD, KYO_SCREENS, screenFold, kyoNight } from './kyo-layout.js';
import { scrollPaper, printSurface } from './kyo-scrollwork.js';
import { createStreetCrowd } from './kyo-people.js';
import { createStreetWatch } from './street-watch.js';
import { seeded, terrainHeight, terrainMeshHeight } from './terrain.js';
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
export function kyoPavingMaterial(granite) {
  const stone=new THREE.MeshLambertMaterial({map:granite,side:THREE.DoubleSide,
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  stone.onBeforeCompile=shader=>{
    shader.fragmentShader=groundPrintGLSL+shader.fragmentShader.replace('#include <map_fragment>',`
      vec2 metres=vMapUv, dx=dFdx(metres),dy=dFdy(metres);
      float weather=groundWash(metres*.13);
      // An individual course meanders by a few millimetres. Joint positions
      // are shared by the two neighbouring slabs, including at a crossroads.
      float course=metres.y/.63+.047*groundWash(metres*.72);
      float row=floor(course), along=metres.x/1.37+groundHash(vec2(row,3.)).x;
      float i=floor(along+.35);
      float seam=i+.70*(groundHash(vec2(i,row)).x-.5);
      if(along<seam) i-=1.;
      vec2 seed=groundHash(vec2(i,row));
      float left=(along-i-.70*(seed.x-.5))*1.37;
      float right=(i+1.+.70*(groundHash(vec2(i+1.,row)).x-.5)-along)*1.37;
      vec2 within=vec2(min(left,right),.63*min(fract(course),1.-fract(course)));
      float corner=min(within.x,within.y)+.012*min(1.,max(within.x,within.y)*15.);
      vec3 fleck=textureGrad(map,metres*.62+seed,dx*.62,dy*.62).rgb;
      float grain=dot(fleck,vec3(.30,.54,.16));
      float aa=clamp(max(length(dx),length(dy))*.54,.001,.16);
      float joint=(1.-smoothstep(.011-aa,.024+aa,corner+(grain-.3)*.013))/(1.+aa*17.);
      float lip=1.-smoothstep(.006,.013+aa,abs(min(left,.63*fract(course))-.024));
      vec3 slab=mix(vec3(.46,.446,.395),vec3(.624,.593,.506),seed.y);
      slab=mix(slab,vec3(.43,.463,.424),weather*.21);
      slab*=.86+.32*grain;
      diffuseColor.rgb*=mix(slab+vec3(.033*lip),vec3(.245,.246,.210),joint*.85);
    `);
  };
  return stone;
}

// Two single-file footpaths follow the real ground triangles. Their worn
// centres, pooled brown washes and grassy banks feather into the hill sheet.
function hearthApproaches(p){
  const mat=new THREE.MeshLambertMaterial({map:p.stone.map,vertexColors:true,
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,
    side:THREE.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 gravel=texture2D(map,vMapUv).rgb;
      float grit=dot(gravel,vec3(.30,.54,.16));
      diffuseColor.rgb*=.76+.53*smoothstep(.05,.53,grit);
    `);
  };
  const moss=new THREE.Color('#8e9271'),earth=new THREE.Color('#ad9979'),scrape=new THREE.Color('#c7b89b'),tint=new THREE.Color();
  for(const [side,line] of Object.entries(FIRE_TRAILS)){
    const [cx,cz]=line[0],pos=[],uv=[],colors=[],indices=[];
    let length=0;
    for(let i=0;i<line.length;i++){
      const [x,z]=line[i],previous=line[Math.max(0,i-1)],next=line[Math.min(line.length-1,i+1)];
      length+=Math.hypot(x-previous[0],z-previous[1]);
      const dx=next[0]-previous[0],dz=next[1]-previous[1],span=Math.hypot(dx,dz);
      const width=.54+.045*Math.sin(length*.57)+.042*Math.sin(length*.21+x*.18);
      const endFade=Math.min(1,(line.length-1-i)/7);
      for(let j=0;j<5;j++){
        const t=(j-2)*.5,bank=width+.048*Math.sin(1.7*length+t);
        const xx=x-t*bank*dz/span,zz=z+t*bank*dx/span;
        pos.push(xx-cx,terrainMeshHeight(xx,zz)+.026,zz-cz);
        uv.push(xx*.21+zz*.08,zz*.26-xx*.06);
        const wash=.5+.5*Math.sin(x*.27+z*.17+1.6*Math.sin(z*.69));
        tint.copy(earth).lerp(scrape,wash*.63).lerp(moss,Math.abs(t)*.58);
        colors.push(tint.r,tint.g,tint.b,j===0||j===4?0:(.84+.13*wash)*endFade);
        if(i && j){
          const k=i*5+j;indices.push(k-6,k-5,k-1,k-1,k-5,k);
        }
      }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));
    g.setIndex(indices);g.computeVertexNormals();g.userData.range=190;
    const name=side+'FireFootpath';p.shapes[name]=g;
    p.part(name,cx,0,cz,1,1,1,'#fff',0,0,0,mat,false,true);
  }
}

// Small tufts of cut susuki stand above the mountain painting on the two fire meadows.
function hillsideInk(p,east,hearths) {
  const {x:cx,z:cz}=east?HIGASHIYAMA:KITAYAMA;
  const height=east?eastRidgeHeight:northRidgeHeight;
  const rand=seeded(east?66189:73462), positions=[],colors=[],indices=[];
  const palette=['#716e55','#898264','#a29875','#cdbd91'].map(c=>new THREE.Color(c));
  const point=(a,b)=>[cx+(east?a:b),cz+(east?b:-a)];
  function vertex(x,y,z,ink){
    positions.push(x-cx,y,z-cz);colors.push(ink.r,ink.g,ink.b);
  }
  function susuki(x,z,size) {
    const y=terrainMeshHeight(x,z)-.015;
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
  for(let i=0;i<735;i++){
    const [x,z]=point(-253+rand()*248,(rand()-.5)*180);
    if(!inFireMeadow(x,z,-2) || height(x,z)<8 || fireTrailDistance(x,z)<4 ||
      hearths.some(([hx,,hz])=>(x-hx)**2+(z-hz)**2<12))continue;
    // Mowers leave taller seed heads only on the ragged verge. Between
    // the charcoal beds the remaining blades are sparse stubble.
    const clipped=inFireMeadow(x,z,-7);
    if(clipped && rand()<.68)continue;
    const turn=rand()*TAU,dx=Math.cos(turn),dz=Math.sin(turn);
    for(let j=0,count=clipped?2:2+Math.floor(rand()*3);j<count;j++){
      const along=rand()*(clipped?1.3:2.4),side=(rand()-.5)*.8;
      const xx=x+along*dx-side*dz,zz=z+along*dz+side*dx;
      if(!hearths.some(([hx,,hz])=>(xx-hx)**2+(zz-hz)**2<6))
        susuki(xx,zz,clipped?.10+rand()*.14:.27+rand()*.43);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  // Individual blades project to a pixel here; the unique hill painting
  // carries the grass beyond the close approach to the hearths.
  g.userData.range=78;
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
  hearthApproaches(p);hillsideInk(p,false,dai);hillsideInk(p,true,fuku);shopFronts(p,light,windowPaper);
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
