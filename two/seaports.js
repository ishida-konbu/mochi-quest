import * as T from './vendor/three.module.min.js';
import { SEAPORTS,PORT_BUILDINGS,DECK_Y,QUAY_Y,FIXED_BERTH,QUAY_CENTER,QUAY_LENGTH } from './seaport-layout.js';
import { roofProfile } from './architecture.js';
import { workshopFrame,inscriptionMaterial } from './civic-art.js';
import { sculpture } from './pilgrimage-pigment.js';
import { ROCKS,WATER_Y } from './terrain.js';

const {PI,sin,cos}=Math,wood='#81654c',dark='#594d3e',bamboo='#b39c70',cord='#91816a';
function portShapes(p){
  p.shapes.tradeJar=new T.LatheGeometry([[.13,0],[.36,.04],[.52,.35],[.55,.63],[.43,.88],[.22,.94],[.17,1.05],[.23,1.07],[.22,1.13],[.14,1.13],[.14,1.04]].map(q=>new T.Vector2(...q)),24);
  const net=sculpture();
  for(let j=-8;j<=8;j++)for(const dir of [-1,1]){
    const knots=[];
    for(let k=0;k<=24;k++){
      const y=k/24,x=j*.14+dir*(y-.5)*.84;
      if(Math.abs(x)>.51)continue;
      knots.push([x,y-.5-.065*(1-4*x*x),.065*sin((x+y)*5)+.075*(1-y)]);
    }
    if(knots.length>1)net.stroke('#7b6c50',knots,knots.map(()=>.0038),12);
  }
  p.shapes.quayNet=net.finish();
  const foam=sculpture();
  for(let k=0;k<12;k++){
    const a=k*.63+.27*sin(k*2.5),r=1.02+.13*sin(k*1.32);
    const points=Array.from({length:8},(_,j)=>[r*cos(a+j*.043),.006,r*sin(a+j*.043)]);
    foam.stroke(k%3?'#d6d9c6':'#efebd7',points,[.001,.007,.014,.016,.014,.009,.006,.001],10);
  }
  p.shapes.shoalLace=foam.finish();
}
function wares(p,f,b){
  const {u,v,w,d,i}=b,y=QUAY_Y+.13,front=v+d*.50-.43;
  if(i===5){
    for(let n=-2;n<=2;n++){
      f.put('box',u+n*2.06,y+.08,v,2.0,.15,3.15,'#b6af82',p.thatch);
      f.put('box',u+n*2.06+.91,y+.165,v,.10,.035,3.15,'#666b57');
    }
    f.put('box',u,y+.38,v,2.15,.12,.90,'#775543',p.lacquer);
    for(let j=0;j<4;j++)f.put('tradeJar',u+j*.36-.65,y+.44,v,.13,.18,.13,'#b8c1ad',p.fine);
    return;
  }
  if(i===0||i===2||i===7){
    for(let j=0;j<7;j++){
      const x=u+((j%3)-1)*.94+(j%2)*.13,z=v+Math.floor(j/3)*.78-.74;
      if(i===7) {
        for(let k=0;k<4;k++)f.put('ropeCoil',x,y+.075+k*.034,z,.49+k*.025,.16,.49+k*.025,cord,p.stems);
      }else{
        f.put('ball',x,y+.36,z,.49,.37,.60,'#baa475',p.thatch);
        for(const n of [-.24,.24])f.put('cargoBand',x,y+.36,z+n,.50,.37,.50,'#7f694b',p.fine);
      }
    }
    if(i===2){
      f.put('box',u+w*.29,y+.69,front-1.1,2.19,.13,.91,dark,p.lacquer);
      for(let k=0;k<4;k++)f.put('round',u+w*.31+k*.19-.42,y+.82,front-1.0,.092,.64,.092,'#dac9a5',p.solid,0,PI/2);
    }
    return;
  }
  f.put('box',u,y+.83,front,3.05,.14,.83,wood,p.deck);
  for(const sign of [-1,1])f.put('box',u+sign*1.3,y+.39,front,.13,.81,.64,dark);
  for(let j=0;j<7;j++){
    const x=u-.97+j*.32,z=front+(.06*sin(j*3));
    if(b.kind==='陶器'||b.kind==='塩'){
      f.put('tradeJar',x,y+.90,z,.27,.41+.14*cos(j*2),.27,b.kind==='塩'?'#a79d83':j%2?'#59736b':'#986347',p.lacquer);
    }else if(b.kind==='麻布'||b.kind==='染布'){
      f.put('round',x,y+1.05,z,.139,.60,.139,['#727e87','#aa7766','#b8ac8d'][j%3],p.thatch,0,PI/2);
    }else if(b.kind==='鍛冶'){
      f.put('box',x,y+.93,z,.09,.045,.43,'#70766f',p.fine);
      f.put('round',x,y+.966,z-.22,.038,.23,.038,wood,p.wood,0,PI/2);
    }else{
      f.put('leaf',x,y+.94,z,.28,.18,.68,b.kind==='昆布'?'#636c4f':'#979e8e',p.fine,.24*sin(j),PI/2);
    }
  }
}
function quayLandmark(p,f,port){
  const y=QUAY_Y;
  if(port.id==='tsuruga'){
    // The lookout on the north quay has an open bell loft. Shingles overlap
    // above a bronze bell, a suspended striking beam and pegged cross braces.
    const u=-40,v=-10;
    for(const a of [-1,1])for(const b of [-1,1]){
      f.put('rock',u+a*1.96,y+.11,v+b*1.83,.36,.26,.39,'#a3a08f',p.stone);
      f.bar([u+a*1.96,y+.11,v+b*1.83],[u+a*1.63,y+8.46,v+b*1.50],.16,wood,p.wood,true);
    }
    for(const a of [-1,1]){
      f.bar([u-1.82,y+.6,v+a*1.71],[u+1.7,y+4.86,v+a*1.71],.11,wood,p.wood,true);
      f.bar([u+1.82,y+.6,v+a*1.71],[u-1.7,y+4.86,v+a*1.71],.11,wood,p.wood,true);
      f.put('box',u,y+4.95,v+a*1.73,4.32,.27,.25,dark);
      f.put('box',u,y+8.10,v+a*1.53,4.63,.23,.24,wood);
    }
    f.put('box',u,y+5.13,v,4.25,.21,4.17,'#ac9472',p.deck);
    f.put('roof',u,y+8.20,v,5.17,1.78,4.95,'#686f6b',p.roofs);
    f.put('portBell',u,y+6.73,v,.82,.96,.82,'#687062',p.bronze);
    f.bar([u,y+7.91,v],[u,y+8.30,v],.08,dark);
    f.bar([u+.73,y+6.70,v-.84],[u+.73,y+6.70,v+.84],.11,wood);
    for(const dz of [-.54,.54])f.bar([u+.73,y+6.80,v+dz],[u+.73,y+8.10,v+dz],.027,cord);
  }else{
    // A glazed-ware yard. The vaulted firing chamber carries a close ring
    // of fired-clay voussoirs around its firemouth; pots cool on tile shelves.
    const u=38,v=-10;
    f.put('ball',u,y+.36,v,2.74,1.93,3.16,'#a07557',p.masonry);
    f.put('box',u,y+.51,v+2.86,1.46,1.16,.25,'#4b443b',p.fine);
    for(let k=0;k<=12;k++){
      const a=k*PI/12;
      f.put('box',u+.84*cos(a),y+.59+.73*sin(a),v+3.0,.27,.43,.34,k%2?'#a37657':'#bc916b',p.stone,0,0,a-PI/2);
    }
    f.put('round',u,y+1.99,v-1.69,.58,1.73,.65,'#a77d63',p.masonry);
    f.put('round',u,y+2.79,v-1.69,.63,.17,.70,'#7c6557',p.stone);
    for(let j=0;j<10;j++){
      const x=u-3.79+.42*(j%2),z=v-2.66+j*.56;
      f.put('tradeJar',x,y+.15,z,.41,.55+.17*sin(j),.41,j%3?'#697e70':'#926a4e',p.lacquer);
    }
    for(let j=0;j<14;j++){
      const x=u+2.26+.27*(j%3),z=v+2.09+.28*(j%5);
      f.put('round',x,y+.18+Math.floor(j/5)*.14,z,.105,1.22,.113,wood,p.wood,0,PI/2);
    }
  }
}
function warehouse(p,f,b){
  const {u,v,w,d,i,high,roof:frame}=b,floor=QUAY_Y,front=v+d*.5;
  const brown=b.p.id==='sakai'?'#a58a68':'#8a806b',roof=i===0||i===2||i===5?p.roofs:p.thatch;
  f.put('box',u,floor-.13,v,w+.35,.30,d+.34,'#a8a395',p.masonry);
  f.put('box',u,floor+.035,v,w,.15,d,'#b29b79',p.deck);
  for(const side of [-1,1]){
    f.put('box',u+side*w*.5,floor+high*.50,v,.16,high,d+.16,'#b6a588',p.boarding);
    f.put('box',u+side*w*.375,floor+high*.5,front,w*.25,high,.15,brown,p.boarding);
    for(let j=0;j<6;j++)f.put('box',u+side*(w*.26+w*.045*j),floor+high*.48,front+.10,.055,high*.81,.048,wood);
    for(let j=0;j<5;j++)f.put('box',u+side*w*.502,floor+high*.48,v+d*(j/4-.5),.13,high,.115,dark);
    f.bar([u+side*w*.51,floor+.32,v-d*.49],[u+side*w*.51,floor+high-.24,v-.3],.062,dark,p.wood,true);
  }
  f.put('box',u,floor+high*.5,v-d*.5,w,high,.16,i===5?'#d3c9ae':brown,p.boarding);
  for(const z of [-d*.5,0,d*.5])for(const side of [-1,1]){
    f.put('box',u+side*w*.49,floor+high*.5,v+z,.211,high,.22,wood);
    f.bar([u+side*w*.46,floor+high-.63,v+z],[u+side*(w*.49-.51),floor+high,v+z],.071,wood,p.wood,true);
  }
  f.put('box',u,floor+high-.10,front,w+.11,.28,.27,dark);
  f.put('box',u,frame.eave-.08,v,w+.14,.16,d+.14,dark,p.deck);
  f.put('gableWalls',u,frame.eave,v,frame.width,frame.rise,frame.depth,i===0||i===5?'#cdc2a9':'#b09b7d',p.boarding);
  for(const side of [-1,1]){
    // The visible gable braces land on the end wall and pass under the ridge.
    const x=u+side*(w*.5+.045);
    f.put('box',x,frame.eave+.49*frame.rise,v,.13,frame.rise,.15,wood,p.wood);
    for(const end of [-1,1]) f.bar([x,frame.eave+.05,v+end*d*.32],
      [x,frame.eave+frame.rise*.69,v],.090,dark,p.wood,true);
  }
  f.put('roof',u,frame.eave,v,frame.width,frame.rise,frame.depth,i===5?'#777a6e':i===3?'#9c8063':'#8b806b',roof);
  for(const side of [-1,1]) for(let j=-4;j<=4;j++){
    const dx=w*j/8,under=frame.eave+frame.rise*(roofProfile('gable',dx*2/frame.width,1)-.04);
    f.bar([u+dx,frame.eave-.10,v+side*d*.49],[u+dx,under,v+side*frame.depth*.49],.08,wood,p.wood,true);
  }
  f.put('box',u,floor+high+2.15,v,frame.width*.87,.19,.25,'#656251',p.wood);
  const tall=high>4;
  if(tall){
    const sill=floor+2.88;
    f.put('box',u,(sill+floor+high)/2,front,w*.53,floor+high-sill,.16,brown,p.boarding);
    f.put('box',u,sill,front,w*.57,.15,.24,dark,p.wood);
    for(let j=0;j<5;j++){
      const x=u+w*(j-2)*.159;
      f.put('box',x,floor+high-.92,front+.054,w*.106,.92,.13,'#5e5849',p.deck);
      for(let k=-2;k<=2;k++)f.put('box',x+k*.124,floor+high-.92,front+.14,.045,.91,.055,bamboo);
    }
    f.put('roof',u,floor+2.63,front+.22,w+.5,.54,2.25,'#817661',p.thatch);
  }
  f.put('box',u+w*.30,floor+2.10,front+.14,1.62,.72,.11,wood);
  f.put('plane',u+w*.30,floor+2.10,front+.206,1.57,.66,1,'#fff',inscriptionMaterial(b.kind));
  if([1,3,4,6,7].includes(i)){
    const dye=b.p.id==='tsuruga'?['#68757b','#777f63','#a68764']:['#966c59','#697e78','#7a7182'];
    for(let k=0;k<3;k++)f.put('tradeCurtain',u+(k-1)*.71,floor+2.13,front+.24,.69,1.00,.67,dye[(i+k)%3],p.thatch);
    f.bar([u-1.23,floor+2.66,front+.23],[u+1.23,floor+2.66,front+.23],.037,bamboo);
  }
  wares(p,f,b);
}
function wharf(p,f,port){
  for(let j=0;j<155;j++){
    const u=QUAY_CENTER+(j-77)*QUAY_LENGTH/155;
    f.put('box',u,DECK_Y-.13,23.7,.678,.26,4.22,j%4?'#a88c6c':'#b09a79',p.deck);
  }
  for(const v of [21.90,25.43]){
    f.put('box',QUAY_CENTER,DECK_Y-.43,v,QUAY_LENGTH,.39,.36,'#6e5d49');
    for(let j=0;j<=21;j++){
      const u=-40+j*5;
      f.put('round',u,1.04,v,.20,5.07,.20,wood);
      if(j%2===0)f.bar([u,.38,v],[u+3,DECK_Y-.34,v],.13,dark,p.wood,true);
    }
  }
  for(const u of [-37,0,37]){
    for(let i=0;i<32;i++){
      const top=QUAY_Y+(DECK_Y-QUAY_Y)*i/31;
      f.put('box',u,top-.11,6.4+i*.49,2.87,.22,.479,i%3?'#ab9274':'#b5a082',p.deck);
    }
    for(const s of [-1,1]){
      for(let j=0;j<5;j++)f.put('round',u+s*1.42,2.21+j*.145,7+j*3.4,.095,2.94,.095,wood);
      f.bar([u+s*1.42,QUAY_Y+1.01,6.7],[u+s*1.42,DECK_Y+1.05,21],.06,wood);
    }
  }
  // Mooring bits, hemp skeins, fish nets and bundles of dunnage sit clear
  // of the two boarding openings at u=±20.
  for(let j=0;j<11;j++){
    const u=-36+j*10;
    f.put('round',u,DECK_Y+.38,25.36,.24,.87,.24,wood);
    for(let k=0;k<3;k++)f.put('ropeCoil',u,DECK_Y+.15+k*.053,25.36,.32,.22,.32,cord,p.stems);
    if(j%2===0)f.put('ropeCoil',u+.89,DECK_Y+.07,24.91,.59,.20,.49,cord,p.stems);
  }
  for(const u of [-30,25]){
    f.put('box',u,QUAY_Y+1.4,5.76,.11,2.88,.11,wood);
    f.put('box',u+3,QUAY_Y+1.4,5.76,.11,2.88,.11,wood);
    f.put('quayNet',u+1.5,QUAY_Y+1.6,5.8,3,2.05,1,'#fff',p.stems);
    f.bar([u-.15,QUAY_Y+2.68,5.75],[u+3.18,QUAY_Y+2.68,5.75],.057,bamboo);
  }
  const destination=port.id==='tsuruga'?'堺行 廻船':'敦賀行 廻船';
  for(const [x,label] of [[-20,destination],[FIXED_BERTH,'港の係船']]){
    f.put('box',x+3.1,DECK_Y+.85,22.03,.14,1.72,.12,dark);
    f.put('box',x+3.1,DECK_Y+1.52,22.0,3.5,.74,.13,wood);
    f.put('plane',x+3.1,DECK_Y+1.52,21.919,3.43,.68,1,'#fff',inscriptionMaterial(label),PI);
  }
  const sign=inscriptionMaterial(port.name),u=port.id==='tsuruga'?-7:4;
  f.put('box',u,QUAY_Y+1.29,4.7,.16,2.70,.19,wood);
  f.put('box',u,QUAY_Y+2.24,4.61,3.31,1.06,.16,dark);
  f.put('plane',u,QUAY_Y+2.24,4.505,3.18,.95,1,'#fff',sign,PI);
}
export function dressSeaports(p){
  portShapes(p);
  p.shapes.portBell=new T.LatheGeometry([[.29,1.14],[.34,1.07],[.46,1.0],[.60,.92],[.72,.58],[.78,.14],[.91,.083],[.93,.02],[.84,0],[.76,.07],[.68,.53]].map(q=>new T.Vector2(...q)),36);
  const curtain=new T.PlaneGeometry(1,1,12,9),pos=curtain.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i);pos.setXYZ(i,x,y+.025*cos(x*7)*(.5-y)**2,.082*sin(10*x+.83*y)*(.8-.4*y));
  }
  curtain.computeVertexNormals();p.shapes.tradeCurtain=curtain;
  p.shapes.ropeCoil=new T.TorusGeometry(1,.076,6,44);p.shapes.ropeCoil.rotateX(PI/2);
  p.shapes.cargoBand=new T.TorusGeometry(1,.028,5,32);
  for(const port of SEAPORTS){
    const f=workshopFrame(p,port,0);
    for(const b of PORT_BUILDINGS.filter(b=>b.p===port))warehouse(p,f,b);
    wharf(p,f,port);quayLandmark(p,f,port);
    // An open hoist on the trading pier. The axle, sheaves, hook and the
    // half-raised cargo basket give the silhouette of a working waterfront.
    const u=port.id==='sakai'?34:-35,v=23.9;
    for(const side of [-1,1])f.bar([u+side*1.17,DECK_Y,v-.58],[u+side*.28,DECK_Y+5.4,v],.16,wood);
    f.bar([u-.49,DECK_Y+4.70,v-.45],[u-.49,DECK_Y+6.04,v+3.09],.15,dark);
    f.bar([u-.49,DECK_Y+6.04,v+3.09],[u-.49,DECK_Y+1.59,v+3.09],.026,cord);
    f.put('tradeJar',u-.49,DECK_Y+.73,v+3.09,.76,.71,.76,'#9d8059',p.thatch);
    for(const z of [-.18,.18])f.put('cargoBand',u-.49,DECK_Y+1.15,v+3.09+z,.48,.54,.51,'#74664e',p.fine);
  }
  for(const r of ROCKS){
    if(!r.reef)continue;
    p.part('shoalLace',r.x,WATER_Y+.085,r.z,r.rx*.97,1,r.rz*.98,'#fff',r.yaw,0,0,p.stems,false,true);
  }
}
