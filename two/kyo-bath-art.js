import { sitePoint } from './retreat-layout.js';
import { terrainMeshHeight } from './terrain.js';
import { suzuriSurface } from './suzuri-materials.js';
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { inscriptionMaterial } from './civic-art.js';
import { dressSuzuriPaving,dressSuzuriRoji } from './suzuri-roji.js';
import { SUZURI_COURT,SUZURI_WALLS,RINSING_HALL } from './kyo-bath-layout.js';
import { dressSuzuriMaple } from './suzuri-courtyard-maple.js';
import { dressSuzuriWashhouse } from './suzuri-washhouse.js';
import { pictureEave,ranma } from './suzuri-joinery.js';
import { suzuriSeatStone } from './suzuri-bathing-art.js';
import { carvedGable,gateTimberFinish,gateCarpentry,drainStones,earthenPlaster,streetSplashRun,wallStoneRoot } from './kyo-gate-masonry.js';
import { wallCoping,karahafu,washHallRoof } from './kyo-bath-roofs.js';

const {PI,sin,cos}=Math,TAU=2*PI;
const wood='#796048',lacquer='#4f423b',cedar='#a08665',gilt='#b49965',stone='#959584';
const turns=profile=>new T.LatheGeometry(profile.map(pair=>new T.Vector2(...pair)),36);

function textured(url){
  const map=new T.TextureLoader().load(new URL(url,import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  return new T.MeshLambertMaterial({map,side:T.DoubleSide,emissiveMap:map,emissive:'#dbcbae',emissiveIntensity:.15});
}

function noren(){
  const c=document.createElement('canvas');c.width=512;c.height=256;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#384d56';ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<c.height;i+=2){ctx.fillStyle=i%8?'#4a5b5e':'#364b54';ctx.globalAlpha=.40;ctx.fillRect(0,i,512,1);}
  ctx.globalAlpha=.16;
  for(let x=0;x<512;x+=3){ctx.fillStyle=x%2?'#c7c2ac':'#1b282e';ctx.fillRect(x,0,1,256);}
  ctx.globalAlpha=1;ctx.strokeStyle='#c5b898';ctx.lineWidth=2;
  for(const y of [209,218,236]){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(95,y-30,148,y+23,249,y);ctx.bezierCurveTo(351,y-25,411,y+17,512,y-10);ctx.stroke();}
  // A single pale ink drop, mirrored in ripples, is the bath's dyed crest.
  for(const x of [83,256,430]){
    ctx.save();ctx.translate(x,109);
    ctx.beginPath();ctx.arc(0,0,43,0,TAU);ctx.lineWidth=2.3;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,38,0,TAU);ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#e3d5ae';ctx.beginPath();ctx.moveTo(0,-30);ctx.bezierCurveTo(-4,-16,-18,-6,-16,3);
    ctx.bezierCurveTo(-14,23,14,23,16,3);ctx.bezierCurveTo(18,-6,4,-17,0,-30);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,22,25,4,0,.18,PI-.18);ctx.stroke();ctx.restore();
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshLambertMaterial({map,side:T.DoubleSide});
  const pts=[],uv=[],ix=[];
  for(let panel=0;panel<3;panel++){
    const base=pts.length/3;
    for(let j=0;j<=10;j++)for(let i=0;i<=10;i++){
      const v=j/10,t=i/10,u=(panel+t)/3,drop=1-v;
      const gap=(t===0?.009:t===1?-.009:0)*drop;
      pts.push(u-.5+gap,v-.5+.029*drop**2*sin(u*19),(.042+.075*drop)*sin(u*32+.71*drop));
      uv.push(u,v);
      const k=base+j*11+i;
      if(i<10 && j<10)ix.push(k,k+1,k+11,k+11,k+1,k+12);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
  return {geo,material};
}

function paintedPanels(p,f,mat,u,v,mid,width){
  const h=width/3,w=width/4,key='suzuriFusuma'+Math.round(width*100);
  const timber=sculpture(),fit=sculpture(),radius=.048,cy=h*-.117;
  // The panel lies in a shallow second track. UVs are calculated in the
  // full painting's coordinates, including the sliver hidden by each hem.
  // A curve of positive radius is also used to cut the matching paper hole.
  const cup=(a,r)=>[r*(1-.105*cos(4*a))*cos(a),r*(1-.105*cos(4*a))*sin(a)*1.12];
  const cloth='#807a63',cord='#b2a27b',lacquer='#46463e';
  for(let i=0;i<4;i++){
    const x=(i-1.5)*w,face=.075+((i===1||i===2)?.038:0);
    const cx=(i%2===0?1:-1)*(w/2-.106);
    const hw=w/2-.013,hh=h/2-.012;
    const silhouette=new T.Shape();
    silhouette.moveTo(-hw,-hh);silhouette.lineTo(hw,-hh);silhouette.lineTo(hw,hh);
    silhouette.lineTo(-hw,hh);silhouette.closePath();
    const hole=new T.Path();
    for(let j=0;j<=36;j++){
      const [a,b]=cup(-TAU*j/36,radius*.80);
      if(j===0)hole.moveTo(cx+a,cy+b);else hole.lineTo(cx+a,cy+b);
    }
    hole.closePath();silhouette.holes.push(hole);
    const paper=new T.ShapeGeometry(silhouette),pos=paper.attributes.position,uv=paper.attributes.uv;
    for(let j=0;j<pos.count;j++){
      uv.setXY(j,.5+(x+pos.getX(j))/width,.5+pos.getY(j)/h);
    }
    // Four independent wooden leaves have a visible thickness at the
    // meeting stiles. Thin woven edgings turn over their lacquered arrises.
    const name=key+'Leaf'+i;p.shapes[name]=paper;
    timber.box('#827052',x,0,face-.047,w-.010,h+.006,.036);
    f.put(name,u+x,mid,v+face,1,1,1,'#fff',mat);
    for(const d of [-1,1]){
      timber.box(lacquer,x+d*(w/2-.006),0,face-.012,.008,h+.013,.036);
      timber.box(cloth,x+d*(w/2-.013),0,face+.001,.010,h-.009,.005);
      timber.box(cord,x+d*(w/2-.018),0,face+.002,.0028,h-.014,.005);
      timber.box(lacquer,x,d*(h/2+.002),face-.012,w-.006,.011,.037);
      timber.box(cloth,x,d*(h/2-.009),face+.001,w-.015,.014,.005);
      timber.box(cord,x,d*(h/2-.016),face+.002,w-.028,.0028,.005);
    }
    // A shallow, four-lobed bronze hikite is let into the opening. Model
    // the concave cup below the painted plane and a gently rubbed flange.
    const rings=[[.05,-.024],[.49,-.024],[.69,-.018],[.78,-.004],[.82,.002],
      [.87,.005],[.94,.006],[1,.003],[1.025,0]];
    const xyz=[],rgb=[],indices=[],n=36,shades=['#575648','#555646','#646955','#737864',
      '#a09873','#b8aa85','#737968','#a39979','#646954'];
    for(let r=0;r<rings.length;r++){
      const [scale,dz]=rings[r],tint=new T.Color(shades[r]);
      for(let j=0;j<n;j++){
        const a=TAU*j/n,[sx,sy]=cup(a,radius*scale);
        xyz.push(x+cx+sx,cy+sy,face+dz);
        rgb.push(tint.r,tint.g,tint.b);
        if(r){const a=r*n+j,b=r*n+(j+1)%n;indices.push(a-n,a,b-n,b-n,a,b);}
      }
    }
    const bowl=new T.BufferGeometry();bowl.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    bowl.setAttribute('color',new T.Float32BufferAttribute(rgb,3));bowl.setIndex(indices);bowl.computeVertexNormals();
    fit.add(bowl,'#fff');
    for(const d of [-1,1])fit.ball('#8d7957',x+cx+d*.045,cy,face+.006,.0036,.0036,.0025);
  }
  // Cypress sill and lintel capture both tracks. The dark grooves remain
  // visible along their front shoulders when viewed obliquely from the bath.
  for(const d of [-1,1]){
    const y=d*(h/2+.061);
    timber.box('#665540',0,y,.017,width+.24,.099,.23);
    timber.box('#9b855f',0,y-d*.043,.032,width+.17,.016,.217);
    for(const zz of [.071,.108])timber.box('#48493f',0,y-d*.052,zz,width+.12,.004,.013);
    timber.box('#79654c',0,y-d*.025,.139,width+.23,.033,.027);
    timber.box('#61503f',d*(width/2+.061),0,.007,.084,h+.18,.17);
    timber.box('#a18c67',d*(width/2+.017),0,.052,.012,h+.055,.100);
  }
  p.shapes[key+'Frames']=timber.finish();p.shapes[key+'Pulls']=fit.finish();
  f.put(key+'Frames',u,mid,v,1,1,1,'#fff',p.stems);
  f.put(key+'Pulls',u,mid,v,1,1,1,'#fff',p.stems);
}

function plasterWall(p,f,[u,v,x,z,h],site,level){
  const along=u!==x,rotate=along?0:PI/2,length=Math.hypot(u-x,v-z),mx=(u+x)/2,mz=(v+z)/2;
  const place=(shape,a,y,b,w,high,d,tint,mat)=>f.put(shape,mx+(along?a:b),y,mz+(along?b:a),w,high,d,tint,mat,rotate);
  if(along && v===SUZURI_COURT.front && length>16){
    // Two shitaji-mado expose the tied bamboo in the earthen wall. The
    // opening is cut through, so the street sees the shadows of the wash wing.
    const face=new T.Shape(),hw=(length+.08)/2,holes=[10.82-mx,16.93-mx];
    face.moveTo(-hw,-.18);face.lineTo(hw,-.18);face.lineTo(hw,h);face.lineTo(-hw,h);face.closePath();
    for(const cx of holes){
      const win=new T.Path(),a=cx-1.07,b=cx+1.07,lo=1.06,hi=1.82,d=.12;
      win.moveTo(a,lo+d);win.lineTo(a,hi-d);win.quadraticCurveTo(a,hi,a+d,hi);
      win.lineTo(b-d,hi);win.quadraticCurveTo(b,hi,b,hi-d);win.lineTo(b,lo+d);
      win.quadraticCurveTo(b,lo,b-d,lo);win.lineTo(a+d,lo);win.quadraticCurveTo(a,lo,a,lo+d);win.closePath();face.holes.push(win);
      for(let i=0;i<14;i++)place('pole',cx+(i-6.5)*.149,1.44,0,.022,.84,.022,i%3?'#8c795c':'#b09b71',p.wood);
      for(const y of [1.21,1.47,1.70]){
        place('box',cx,y,.012,2.21,.029,.032,'#8c7d60',p.wood);
        for(let i=0;i<14;i+=2)place('box',cx+(i-6.5)*.149,y,.023,.035,.044,.042,'#514a3b',p.wood);
      }
      for(const side of [-1,1]){
        place('box',cx,1.035,side*.18,2.33,.084,.16,'#a3a18c',p.stone);
        place('box',cx,1.88,side*.17,2.34,.054,.19,'#7d765e',p.wood);
      }
    }
    p.shapes.suzuriLatticeWall=new T.ExtrudeGeometry(face,{depth:.36,bevelEnabled:false,curveSegments:6});
    place('suzuriLatticeWall',0,0,-.18,1,1,1,'#fff',earthenPlaster());
  }else place('box',0,h*.5-.09,0,length+.08,h+.18,.36,'#fff',earthenPlaster());
  place('box',0,.21,0,length+.12,.45,.43,'#74776b',p.stone);
  const root='suzuriStoneRoot'+length.toFixed(3);
  p.shapes[root]??=wallStoneRoot(length);
  place(root,0,0,0,1,1,1,'#fff',p.stems);
  if(along && v===SUZURI_COURT.front){
    const gutter='suzuriStreetRain'+length.toFixed(3);
    const ground=(a,b)=>terrainMeshHeight(...sitePoint(site,mx+a,mz+b))-level;
    p.shapes[gutter]??=streetSplashRun(length,ground);
    place(gutter,0,0,0,1,1,1,'#fff',p.stems);
  }
  for(const side of [-1,1])for(const y of [h-.48,h-.40,h-.32]){
    place('box',0,y,side*.183,length+.04,.016,.026,'#e2d7be',p.solid);
  }
  place('box',0,h+.007,0,length+.16,.10,.49,'#6d6555',p.wood);
  const cap='suzuriWallCap'+length.toFixed(3);
  p.shapes[cap]??=wallCoping(length+.20);
  place(cap,0,h+.095,0,1,1,1,'#fff',p.stems);
}

function gate(p,f,site,level){
  const {front:z,gateHalf}=SUZURI_COURT;
  p.shapes.suzuriKarahafu=karahafu();
  p.shapes.suzuriGateCarpentry=gateCarpentry();
  p.shapes.suzuriGableInfill=carvedGable();
  f.put('suzuriGableInfill',0,2.9,z,1,1,1,'#fff',gateTimberFinish());
  p.shapes.suzuriGateDrain=drainStones();
  f.put('suzuriGateCarpentry',0,0,z,1,1,1,'#fff',p.stems);
  for(const offset of [-1.02,1.015]){
    const y=terrainMeshHeight(...sitePoint(site,0,z+offset))-level;
    f.put('suzuriGateDrain',0,y+.014,z+offset,1,1,1,'#fff',p.stems);
  }
  f.put('suzuriKarahafu',0,2.9,z,1,1,1,'#fff',gateTimberFinish());
  for(const side of [-1,1]){
    const x=side*gateHalf;
    for(const dz of [-.57,.40]){
      f.put('box',x,1.57,z+dz,.277,2.50,.277,'#987757',p.wood);
    }
    f.put('box',x,2.94,z,.365,.148,2.06,wood,p.wood);
    const lamp=f.at(side*2.22,.01,z+.37);
    p.lamps.andon(lamp.x,lamp.y,lamp.z,PI,.88);
  }
  for(const end of [-1,1])f.put('box',0,2.80,z+end*.41,3.99,.20,.18,wood,p.wood);
  f.bar([-1.67,2.46,z+.23],[1.67,2.46,z+.23],.049,cedar);
  const cloth=noren();p.shapes.suzuriNoren=cloth.geo;
  f.put('suzuriNoren',0,2.13,z+.23,3.10,.72,1,'#fff',cloth.material);
  for(const x of [-1.38,-.82,-.39,.39,.82,1.38])f.put('box',x,2.44,z+.23,.076,.14,.073,'#526065',p.solid);
  const plaque=inscriptionMaterial('花京の硯湯',{ground:'#333f3c',ink:'#ead3a1'});
  const cy=2.965,v=z+1.365;
  f.put('box',0,cy,v,1.77,.447,.094,'#765e43',p.wood);
  f.put('plane',0,cy,v+.051,1.69,.383,1,'#fff',plaque);
  for(const side of [-1,1]){
    f.put('box',0,cy+side*.201,v+.057,1.77,.022,.023,'#b19c72',p.bronze);
    f.put('box',side*.869,cy,v+.061,.019,.395,.025,'#9d8964',p.bronze);
    for(const end of [-1,1]){
      f.put('box',side*.818,cy+end*.182,v+.073,.105,.024,.014,'#9d9372',p.bronze);
      f.put('ball',side*.84,cy+end*.181,v+.085,.012,.012,.009,'#c3b18c',p.bronze);
    }
  }
}


function washingHall(p,f){
  const r=RINSING_HALL,back=r.v-r.d/2,face=r.v+r.d/2;
  p.shapes.suzuriWashRoof=washHallRoof(r.w+1.12,r.d+1.10,r.rise);
  f.put('suzuriWashRoof',r.u,r.eave,r.v,1,1,1,'#fff',p.stems);
  f.put('box',r.u,-.09,r.v,r.w+.22,.22,r.d+.46,'#747b71',p.stone);
  f.put('box',r.u,.064,face+.39,r.w+.17,.072,.50,'#a19f8e',p.stone);
  f.put('box',r.u,1.63,back,r.w,3.29,.18,'#c1b49a',p.solid);
  for(const side of [-1,1]){
    const x=r.u+side*r.w/2;
    const depth=side<0?1.02:r.d,mid=back+depth/2;
    f.put('box',x,.79,mid,.14,1.42,depth,'#8b7559',p.boarding);
    f.put('box',x,1.48,mid,.21,.11,depth+.12,wood,p.wood);
    if(side<0){
      f.put('box',x,2.13,mid,.095,1.27,depth,'#fff',p.lamps.shoji);
      for(let k=0;k<=4;k++)f.put('box',x,2.14,back+depth*k/4,.155,1.31,k%4===0?.069:.032,wood,p.wood);
      for(const y of [1.50,1.85,2.35,2.78])f.put('box',x,y,mid,.193,.045,depth+.10,wood,p.wood);
    }else{
      // The rear dressing bay is plastered into a deep open lattice. Leave
      // the middle out rather than hiding the outside behind a shoji plane.
      for(const [v0,v1] of [[back,-1.99],[.15,face]])
        f.put('box',x,2.13,(v0+v1)/2,.112,1.29,v1-v0,'#bdb29a',p.solid);
      f.put('box',x,2.918,-.92,.14,.147,2.16,'#bdb29a',p.solid);
    }
    f.put('box',x,3.06,r.v,.19,.16,r.d+.40,wood,p.wood);
    if(side<0)f.put('box',x,1.68,back+depth,.16,3.06,.16,wood,p.wood);
  }
  for(const x of [r.u-r.w/2,r.u,r.u+r.w/2]){
    for(const z of [back,face]){
      f.put('rock',x,.20,z,.21,.13,.21,'#939687',p.stone);
      f.put('box',x,1.74,z,.204,3.02,.204,wood,p.wood);
      for(const side of [-1,1])f.bar([x,2.71,z],[x+side*.43,3.09,z],.084,cedar,p.wood,true);
    }
  }
  for(const z of [back,face])f.put('box',r.u,3.114,z,r.w+.34,.22,.24,wood,p.wood);
  for(let bay=0;bay<2;bay++){
    const name='suzuriWashRanma'+bay;
    p.shapes[name]=ranma(r.w/2-.29,Boolean(bay));
    f.put(name,r.u+(bay-.5)*r.w/2,2.795,face-.02,1,1,1,'#fff',p.stems);
  }
  paintedPanels(p,f,textured('./assets/world/suzuri-rinsing-scroll.webp'),13.29,back+.122,2.238,5.42);
  dressSuzuriWashhouse(p,f);
  // Kusari-doi lead rain from the eave into stone splash dishes.
  p.shapes.suzuriRainCup=turns([[.072,0],[.102,.023],[.157,.162],[.151,.176],[.136,.166],[.071,.021]]);
  for(const side of [-1,1]){
    const x=r.u+side*(r.w/2-.22),z=face+.39;
    p.shapes.suzuriChainLink??=new T.TorusGeometry(.077,.015,5,15);
    for(let j=0;j<9;j++){
      const y=.36+.337*j;
      f.put('suzuriRainCup',x,y,z,.53,.76,.53,'#828b77',p.bronze);
      f.put('suzuriChainLink',x,y+.19,z,.48,1.35,.72,'#727a6a',p.bronze,j%2?0:PI/2);
      f.put('suzuriChainLink',x,y+.285,z,.39,1.03,.70,'#939887',p.bronze,j%2?PI/2:0);
    }
    f.put('rock',x,.14,z,.28,.07,.26,'#858f80',p.stone);
  }
  for(const x of [9.64,17.53]){
    f.put('box',x,1.67,back+.29,.42,.11,.51,wood,p.wood);
    f.bar([x,1.31,back+.09],[x,1.66,back+.40],.085,wood,p.wood,true);
    const lamp=f.at(x,1.73,back+.34);
    p.lamps.andon(lamp.x,lamp.y,lamp.z,PI,.58);
  }
}

export function dressSuzuriCourt(p,f,s,level){
  p.shapes.suzuriBathSeat=suzuriSeatStone();
  f.put('suzuriBathSeat',0,0,0,1,1,1,'#fff',suzuriSurface('inkstone'));
  dressSuzuriPaving(p,f,s,level);
  for(const wall of SUZURI_WALLS)plasterWall(p,f,wall,s,level);
  const {back}=SUZURI_COURT;
  paintedPanels(p,f,textured('./assets/world/suzuri-wash-scroll.webp'),-.03,back+.20,1.70,6.77);
  p.shapes.suzuriGalleryEave=pictureEave();
  f.put('suzuriGalleryEave',-.03,0,back+.10,1,1,1,'#fff',p.stems);
  gate(p,f,s,level);washingHall(p,f);
  dressSuzuriRoji(p,f);
  dressSuzuriMaple(p,f);
}
