import * as T from './vendor/three.module.min.js';
import { COURT, COURT_COLUMNS, COURT_STEPS } from './retreat-layout.js';
import { terrainHeight, seeded } from './terrain.js';
import { workshopFrame, inscriptionMaterial, coveredGable, courtLantern } from './civic-art.js';

const cedar='#85654b',beam='#614e3f',floor='#b39b74',ink='#46483e',slate='#656e69',brass='#b8a070';
const {PI}=Math;

function whiteSand() {
  const c=document.createElement('canvas');c.width=c.height=256;
  const g=c.getContext('2d'),rng=seeded(451093);
  g.fillStyle='#d5ceba';g.fillRect(0,0,256,256);
  for(let row=-1;row<35;row++){
    for(const [dy,tint] of [[.7,'#b9b4a3'],[2.1,'#e4deca']]){
      g.beginPath();g.moveTo(0,row*8+dy);
      for(let x=0;x<=256;x+=4)g.lineTo(x,row*8+dy+.94*Math.sin(x*Math.PI/128+row*.45));
      g.strokeStyle=tint;g.lineWidth=1;g.stroke();
    }
  }
  for(let i=0;i<9000;i++){
    g.fillStyle=i%3?'rgba(251,243,220,.21)':'rgba(91,86,72,.15)';
    g.fillRect(rng()*256,rng()*256,.6+rng()*1.5,1);
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(9,5);map.anisotropy=4;
  return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.022,roughness:.97});
}
function vergeTiles(p,f) {
  // Concave pan tiles terminate in moulded rolls. The tomoe end tile is
  // stamped in clay with three spiralling drops of slip.
  const stamp=new T.Shape();stamp.moveTo(0,.53);
  stamp.bezierCurveTo(-.51,.61,-.65,.09,-.35,-.10);
  stamp.bezierCurveTo(-.15,-.26,.05,-.11,.023,.08);
  stamp.bezierCurveTo(.11,.18,.33,.21,.47,.095);
  stamp.bezierCurveTo(.37,.35,.23,.49,0,.53);
  p.shapes.courtTomoe=new T.ExtrudeGeometry(stamp,{depth:.12,bevelEnabled:false,curveSegments:6});
  for(let i=-28;i<=28;i++){
    const u=i*.555;
    f.put('round',u,7.76,8.83,.156,.40,.156,'#5f6762',p.roofs,0,PI/2);
    f.put('round',u,7.76,9.05,.137,.039,.137,'#89908a',p.roofs,0,PI/2);
    if(i%2===0)for(let t=0;t<3;t++)f.put('courtTomoe',u,7.76,9.078,.17,.17,.043,'#606c64',p.fine,0,0,t*PI*2/3);
  }
}
function gate(p,f) {
  const z=23.7,sign=inscriptionMaterial('京の評定所');
  for(const side of [-1,1]){
    for(const v of [-.72,.72]){
      f.put('rock',side*4.15,.16,z+v,.59,.24,.53,'#969587',p.stone);
      f.put('box',side*4.15,2.29,z+v,.44,4.54,.46,beam);
      f.put('box',side*4.15,3.88,z+v,.83,.28,.65,cedar);
    }
    // Open plank leaves retain their black iron straps and bosses.
    f.put('box',side*3.91,1.74,z-.83,.18,3.22,2.0,cedar,p.boarding);
    for(const y of [.62,1.69,2.86]) {
      f.put('box',side*3.8,y,z-.8,.05,.12,2.03,ink,p.bronze);
      for(const dz of [-.72,.06,.76])f.put('ball',side*3.76,y,z-.8+dz,.043,.052,.052,brass,p.bronze);
    }
    f.put('box',side*9.0,1.04,z,9.36,1.93,.48,'#d6ceb2',p.solid);
    f.put('roof',side*9,2.05,z,9.52,.32,1.13,slate,p.roofs);
    f.put('box',side*13.4,1.04,15.5,.37,1.93,16.9,'#d6ceb2',p.solid);
    f.put('roof',side*13.4,2.05,15.5,17.24,.32,1.13,slate,p.roofs,PI/2);
  }
  for(const v of [-.76,.76]) f.put('box',0,4.21,z+v,10,.42,.38,beam);
  f.put('hipRoof',0,4.44,z,11.6,1.83,4.4,slate,p.roofs);
  f.put('courtBarge',0,4.42,z+.2,5.81,1.98,2.2,'#62675a',p.roofs);
  f.put('courtBarge',0,4.35,z+2.39,5.79,1.98,.12,'#c1a47b',p.wood);
  f.put('courtBarge',0,4.38,z+2.53,5.77,1.98,.05,'#665746',p.wood);
  f.put('box',0,3.9,z+1.01,3.9,1.25,.21,brass,p.wood);
  f.put('plane',0,3.9,z+1.125,3.65,1.08,1,'#ffffff',sign);
}

function inkDesk(p,f,u,z,y,wide) {
  f.put('box',u,y+.55,z,wide,.115,.94,'#765440',p.lacquer);
  for(const side of [-1,1])f.put('box',u+side*wide*.39,y+.25,z,.13,.54,.75,beam);
  f.put('box',u+.53,y+.641,z+.02,.57,.07,.37,'#53564d',p.stone);
  f.put('ball',u+.53,y+.682,z+.02,.175,.016,.109,'#302f2a',p.fine);
  for(let i=0;i<2;i++)f.bar([u+.19+i*.073,y+.69,z-.24],[u+.29+i*.073,y+.68,z+.18],.013,cedar);
  f.put('box',u-.57,y+.629,z,.79,.018,.57,'#ede0bf',p.solid);
  for(const dx of [-.41,.41]) f.put('round',u-.57+dx,y+.699,z,.081,.68,.081,'#d8c6a5',p.solid,0,PI/2);
  for(let i=0;i<6;i++)for(let j=0;j<3;j++)
    f.put('box',u-.79+i*.089,y+.642,z-.18+j*.075,.018,.004,.048-.008*((i+j)%3),'#695f4a',p.fine);
}
function hearingRoom(p,f) {
  const image=new T.TextureLoader().load(new URL('./assets/world/hearing-scroll.webp',import.meta.url).href);
  image.colorSpace=T.SRGBColorSpace;image.anisotropy=4;
  const mural=new T.MeshLambertMaterial({map:image});
  f.put('box',0,4.19,-5.70,26.8,6.29,.29,'#d5cbb1',p.solid);
  f.put('box',0,3.42,-5.48,13.55,4.18,.17,beam);
  f.put('plane',0,3.43,-5.376,13.23,3.91,1,'#fff',mural);
  for(let i=-2;i<=2;i++)
    f.put('box',i*2.22,3.43,-5.36,.026,3.91,.022,'#8e8061',p.wood);
  for(const side of [-1,1]){
    f.put('box',side*13.3,4.12,0,.28,6.14,11.42,'#e0d3b8',p.solid);
    for(let k=0;k<3;k++){
      const v=-3.7+k*3.64;
      for(const y of [1.64,2.13,4.94,5.73])
        f.put('box',side*13.08,y,v,.16,.11,3.56,cedar);
      for(let j=-4;j<=4;j++)
        f.put('box',side*13.08,3.53,v+j*.355,.13,2.77,.062,'#806b4d');
    }
    f.put('box',side*9.94,3.01,-5.47,4.82,3.33,.12,'#ac9c78',p.deck);
    for(let i=0;i<12;i++) {
      const u=side*(7.92+i*.368);
      f.put('box',u,3.16,-5.36,.07,3.03,.07,beam);
    }
    // Bundles of case rolls in slotted record racks at each end of the room.
    for(let j=0;j<3;j++) {
      const y=1.67+j*.63;
      f.put('box',side*10.4,y,-4.82,3.76,.10,.84,beam);
      for(let k=0;k<6;k++){
        const u=side*(9.0+k*.51);
        f.put('round',u,y+.19,-4.81,.145,.73,.145,k%3?'#cfc09e':'#b9a880',p.solid,0,PI/2);
        f.put('round',u,y+.19,-4.76,.149,.07,.149,'#76664d',p.lacquer,0,PI/2);
      }
    }
    for(const x of [-1.92,1.92])f.put('box',side*10.4+x,2.26,-4.80,.12,2.4,.89,cedar);
  }
  f.put('box',0,1.20,-2.85,7.6,.30,3.70,cedar,p.deck);
  for(let i=-2;i<=2;i++){
    f.put('box',i*1.46,1.36,-2.89,1.44,.03,3.49,'#b9b68d',p.thatch);
    f.put('box',i*1.46-.69,1.38,-2.89,.074,.025,3.49,'#5c6356',p.deck);
  }
  f.put('box',0,1.45,-3.53,1.50,.15,1.11,'#817371',p.solid);
  inkDesk(p,f,0,-1.93,1.35,3.05);
  inkDesk(p,f,-9,2.90,1.05,2.48);
}

export function dressCourt(p) {
  const f=workshopFrame(p,COURT,terrainHeight(COURT.x,COURT.z));
  coveredGable(p);
  f.put('box',0,.36,0,29,.80,14,'#a9a99b',p.masonry);
  f.put('box',0,.89,0,29,.32,14,floor,p.deck);
  for(const step of COURT_STEPS) f.put('box',0,step.top/2,step.z,7.8,step.top,.61,'#aca99a',p.stone);
  // White sand is raked in the open court with a flagstone walk through it.
  f.put('box',0,.02,16.4,26.68,.07,15.7,'#fff8e6',whiteSand());
  for(let i=0;i<9;i++) for(let j=-1;j<=1;j++){
    const z=10.4+i*1.52;
    f.put('rock',j*1.10+.055*Math.sin(i),.067,z,.71,.085,.94,i%3?'#adad9d':'#b8b8a7',p.stone,.16*Math.sin(3*i+j));
  }
  for(const side of [-1,1])for(const v of [9.7,20.3])courtLantern(p,f,side*7.4,v);
  for(const u of COURT_COLUMNS) for(const v of [-5.55,5.55]) {
    if(v>0 && !u)continue;
    f.put('round',u,1.16,v,.45,.22,.45,'#929583',p.stone);
    f.put('round',u,4.27,v,.285,6.25,.285,cedar);
    for(let j=0;j<3;j++) {
      f.put('box',u,6.77+j*.245,v,.72+j*.43,.26,.81+j*.18,j%2?beam:cedar);
      for(const side of [-1,1])
        f.put('box',u+side*(.23+j*.22),6.92+j*.245,v,.32,.20,.69,cedar);
    }
  }
  for(const v of [-5.55,5.55])for(const y of [5.81,7.53])
    f.put('box',0,y,v,28.6,.36,.42,beam);
  for(const u of COURT_COLUMNS)f.put('box',u,7.52,0,.24,.35,15.55,cedar);
  for(const v of [-1,1])for(let j=-25;j<=25;j++)
    f.bar([j*.60,7.45,v*6.07],[j*.60,7.69,v*8.45],.075,'#ab8f6a',p.wood,true);
  f.put('hipRoof',0,7.74,0,32.4,5.12,17.8,slate,p.roofs);
  f.put('box',0,12.88,0,15.4,.27,.45,'#5d655f',p.roofs);
  vergeTiles(p,f);
  for(const side of [-1,1]) {
    // A bronze cap and a row of onion-finial balusters flank the broad steps.
    for(let i=0;i<6;i++){
      const x=side*(4.81+i*1.72);
      f.put('box',x,1.71,6.78,.16,1.30,.16,beam);
      f.put('finial',x,2.35,6.78,.145,.21,.145,brass,p.bronze);
    }
    for(const y of [1.55,2.05])f.put('box',side*9.10,y,6.78,8.75,.105,.11,cedar,p.lacquer);
    f.put('courtBarge',side*7.38,12.91,-.21,.71,.81,.42,slate,p.roofs);
  }
  const sign=inscriptionMaterial('評定之間');
  f.put('box',0,6.58,5.87,4.58,1.39,.24,brass,p.wood);
  f.put('plane',0,6.58,6.003,4.31,1.16,1,'#fff',sign);
  hearingRoom(p,f);
  gate(p,f);
}
