import * as T from './vendor/three.module.min.js';
import { sculpture,brushStroke } from './pilgrimage-pigment.js';
import { inscriptionMaterial } from './civic-art.js';
import { regionalSpringLip } from './regional-springs.js';
import { sitePoint } from './retreat-layout.js';
import { terrainMeshHeight } from './terrain.js';
import { SUZURI_COURT,SUZURI_WALLS,RINSING_HALL,RINSING_SEATS } from './kyo-bath-layout.js';
import { dressSuzuriMaple } from './suzuri-courtyard-maple.js';
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
  const h=width/3;
  f.put('box',u,mid,v-.03,width+.30,h+.28,.115,lacquer,p.wood);
  f.put('plane',u,mid,v+.037,width,h,1,'#fff',mat);
  for(const y of [mid-h/2-.045,mid+h/2+.045]){
    f.put('box',u,y,v+.044,width+.17,.068,.053,'#746145',p.wood);
    f.put('box',u,y+.011,v+.080,width+.14,.014,.015,gilt,p.bronze);
  }
  for(const side of [-1,1]){
    f.put('box',u+side*(width/2+.045),mid,v+.041,.07,h+.08,.063,'#706047',p.wood);
    for(const end of [-1,1])f.put('box',u+side*(width/2+.057),mid+end*(h/2+.04),v+.081,.13,.074,.013,gilt,p.bronze);
  }
  for(const i of [-1,0,1])f.put('box',u+width*i/4,mid,v+.051,.014,h,.019,'#907f61',p.wood);
}

function plasterWall(p,f,[u,v,x,z,h]){
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
    place('suzuriLatticeWall',0,0,-.18,1,1,1,'#c7bda6',p.solid);
  }else place('box',0,h*.5-.09,0,length+.08,h+.18,.36,'#c7bda6',p.solid);
  place('box',0,.21,0,length+.12,.45,.43,'#72776c',p.stone);
  const count=Math.ceil(length/1.09);
  for(let j=0;j<2;j++)for(let i=0;i<count;i++){
    const offset=j===0?0:.24*(i!==0 && i!==count-1?1:0);
    const a=((i+.5)/count-.5)*length+offset;
    for(const side of [-1,1])place('box',a,.116+j*.212,side*.222,length/count*.96,.184,.035,
      ['#959a8c','#a1a291','#8a9184','#a6a698'][(i*3+j)%4],p.stone);
  }
  for(const side of [-1,1])for(const y of [h-.48,h-.40,h-.32]){
    place('box',0,y,side*.183,length+.04,.016,.026,'#e2d7be',p.solid);
  }
  place('box',0,h+.007,0,length+.16,.10,.49,'#6d6555',p.wood);
  const cap='suzuriWallCap'+length.toFixed(3);
  p.shapes[cap]??=wallCoping(length+.20);
  place(cap,0,h+.095,0,1,1,1,'#fff',p.stems);
}

function gate(p,f){
  const {front:z,gateHalf}=SUZURI_COURT;
  p.shapes.suzuriKarahafu=karahafu();
  f.put('suzuriKarahafu',0,2.9,z,1,1,1,'#fff',p.stems);
  for(const side of [-1,1]){
    const x=side*gateHalf;
    for(const dz of [-.57,.40]){
      f.put('box',x,.21,z+dz,.49,.41,.49,'#8a9086',p.stone);
      f.put('box',x,1.69,z+dz,.27,2.85,.27,'#805f44',p.wood);
      f.put('box',x,.49,z+dz,.28,.26,.28,'#52554c',p.bronze);
      for(const y of [2.45,2.66,2.79]){
        f.put('box',x,y,z+dz,.37+(y-2.45)*.9,.125,.39+(y-2.45)*.62,wood,p.wood);
      }
    }
    f.put('box',x,2.85,z,.45,.16,1.94,wood,p.wood);
    for(const dz of [-.34,.37]){
      f.bar([x,2.38,z+dz],[x-side*.45,2.78,z+dz],.093,wood,p.wood,true);
      f.put('ball',x,2.57,z+dz+.13,.059,.059,.023,gilt,p.bronze);
    }
    const lamp=f.at(side*2.22,.01,z+.37);
    p.lamps.andon(lamp.x,lamp.y,lamp.z,PI,.88);
  }
  for(const end of [-1,1])f.put('box',0,2.80,z+end*.41,3.99,.20,.18,wood,p.wood);
  f.bar([-1.67,2.46,z+.23],[1.67,2.46,z+.23],.049,cedar);
  const cloth=noren();p.shapes.suzuriNoren=cloth.geo;
  f.put('suzuriNoren',0,2.13,z+.23,3.10,.72,1,'#fff',cloth.material);
  for(const x of [-1.38,-.82,-.39,.39,.82,1.38])f.put('box',x,2.44,z+.23,.076,.14,.073,'#526065',p.solid);
  const plaque=inscriptionMaterial('花京の硯湯',{ground:'#333f3c',ink:'#ead3a1'});
  f.put('box',0,3.11,z+1.34,1.88,.52,.095,'#6a5140',p.wood);
  f.put('plane',0,3.11,z+1.395,1.79,.48,1,'#fff',plaque);
}

function tub(){
  const art=sculpture();
  art.add(turns([[.002,0],[.37,0],[.394,.031],[.442,.46],[.448,.49],[.406,.50],[.372,.08],[.01,.08]]),'#b79b72');
  for(let j=0;j<18;j++){
    const a=TAU*j/18;
    art.stroke(j%3?'#947a50':'#cbb38b',[[.390*sin(a),.035,.390*cos(a)],[.414*sin(a),.241,.414*cos(a)],
      [.443*sin(a),.477,.443*cos(a)]],[.004,.008,.004],4);
  }
  for(const y of [.09,.37]){
    const rad=.396+.093*y;
    art.add(turns([[rad,y-.017],[rad+.006,y-.014],[rad+.009,y+.012],[rad,y+.017]]),'#6e7263');
  }
  art.add(turns([[.002,.32],[.400,.32],[.398,.317],[.002,.317]]),'#899d92');
  return art.finish();
}
function washSet(){
  const art=sculpture(),basin=tub();
  art.box('#aaa492',0,.51,.02,1.29,.39,.65);
  art.box('#797e72',0,.70,.02,1.33,.055,.69);
  art.box('#888e80',0,.96,-.369,1.28,.52,.091);
  art.box('#a5aa99',0,1.222,-.369,1.31,.039,.107);
  art.add(basin,'#fff',.025,.73,.04,.85,.70,.69);
  // A banded bamboo culm is split down the last internode. Its ochre
  // underside extends beyond the upper lip like a cut bamboo scoop.
  const pts=[],idx=[],colors=[],outer=new T.Color('#8f9369'),inner=new T.Color('#c0ab75');
  const n=18,sections=8;
  for(let shell=0;shell<2;shell++)for(let j=0;j<=sections;j++){
    const t=j/sections,open=.035+1.18*Math.max(0,(t-.47)/.53);
    for(let i=0;i<=n;i++){
      const angle=open+(TAU-2*open)*i/n,r=shell?.053:.068,cy=cos(angle),sz=sin(angle);
      pts.push(r*sz,1.235-.068*t+r*cy,-.425+t*.485-.044*cy*t**3);
      const c=shell?inner:outer;colors.push(c.r,c.g,c.b);
      const k=pts.length/3-1;
      if(j<sections && i<n)idx.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);
    }
  }
  const offset=(n+1)*(sections+1);
  for(let i=0;i<n;i++){const k=sections*(n+1)+i;idx.push(k,k+offset,k+1,k+1,k+offset,k+offset+1);}
  for(let j=0;j<sections;j++)for(const k of [j*(n+1),j*(n+1)+n])idx.push(k,k+offset,k+n+1,k+n+1,k+offset,k+n+1+offset);
  const pipe=new T.BufferGeometry();pipe.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  pipe.setAttribute('color',new T.Float32BufferAttribute(colors,3));pipe.setIndex(idx);pipe.computeVertexNormals();art.add(pipe,'#fff');
  art.add(new T.TorusGeometry(.070,.012,5,18), '#6e7856',0,1.211,-.254,1,1,1,.14);
  art.add(new T.TorusGeometry(.068,.008,5,18), '#b09961',0,1.207,-.225,1,1,1,.14);
  art.box('#b29b77',.39,.798,.075,.26,.086,.23);
  art.box('#d5c7a6',.39,.859,.066,.18,.045,.124);
  return art.finish();
}
function bathStool(){
  const s=sculpture();
  const cut=new T.Shape();cut.moveTo(-.168,0);cut.lineTo(-.142,.37);cut.lineTo(.142,.37);cut.lineTo(.168,0);
  cut.lineTo(.081,0);cut.bezierCurveTo(.06,.095,-.07,.095,-.084,0);cut.closePath();
  const g=new T.ExtrudeGeometry(cut,{depth:.086,bevelEnabled:true,bevelThickness:.012,bevelSize:.013,bevelSegments:2});
  for(const side of [-1,1])s.add(g,'#9e825c',side*.216,0,0,1,1,1,0,PI/2,side*.046);
  s.box('#bca27a',0,.33,0,.62,.095,.39);s.box('#876e4d',0,.15,0,.45,.067,.08);
  return s.finish();
}
function brushGarden(){
  const s=sculpture();
  s.add(turns([[.01,0],[.42,.025],[.53,.10],[.57,.41],[.49,.63],[.443,.687],[.368,.66],[.30,.45],[.01,.442]]),'#7c867b');
  s.add(turns([[.01,.551],[.33,.551],[.338,.545],[.01,.545]]),'#a1b2a2');
  for(const [x,z] of [[-.29,-.15],[.26,.14]])s.stroke('#ae926c',[[x-.29,.69,z],[x,.716,z],[x+.31,.69,z]],
    [.024,.027,.024],9);
  s.stroke('#a68d67',[[-.19,.71,-.24],[-.04,.75,0],[.13,.77,.31]],[.014,.02,.018],8);
  s.add(turns([[.002,0],[.09,.01],[.117,.105],[.124,.13],[.112,.134],[.09,.024],[.001,.024]]),'#b29c79',.12,.732,.30);
  const stalks=[[-.49,-.46,1.64],[-.62,-.32,1.27],[-.35,-.63,1.39]];
  for(const [x,z,h] of stalks){
    s.stroke('#797c58',[[x-.10,.04,z],[x,h*.5,z-.02],[x+.084,h,z-.067]],[.021,.027,.009],9);
    for(let j=1;j<=3;j++){
      const side=j%2?1:-1,y=h*j/4,tip=x+side*.28;
      s.stroke('#8b8966',[[x,y,z],[x+side*.09,y+.13,z+.035],[tip,y+.19,z+.08]],[.013,.009,.003],6);
      for(let k=0;k<3;k++){
        const a=side*(.13+.056*k),b=y+.205-.044*k;
        s.stroke(k%2?'#798c6b':'#909a77',[[tip,b,z+.07],[tip+a*.53,b+.029,z+.10+k*.076],
          [tip+a,b-.091+.053*k,z+.132+k*.09]],[.003,.030,.002],6);
      }
    }
  }
  return s.finish();
}

function washingHall(p,f){
  const r=RINSING_HALL,back=r.v-r.d/2,face=r.v+r.d/2;
  p.shapes.suzuriWashRoof=washHallRoof(r.w+1.12,r.d+1.10,r.rise);
  f.put('suzuriWashRoof',r.u,r.eave,r.v,1,1,1,'#fff',p.stems);
  f.put('box',r.u,.043,r.v,r.w+.22,.24,r.d+.46,'#8c9185',p.stone);
  const boards=33;
  for(let j=0;j<boards;j++){
    const w=r.w/boards,x=r.u-r.w/2+(j+.5)*w;
    f.put('box',x,.155,r.v,w-.012,.07,r.d+.43,j%4?'#a99170':'#b59c75',p.deck);
  }
  f.put('box',r.u,.064,face+.39,r.w+.17,.072,.50,'#a19f8e',p.stone);
  f.put('box',r.u,1.63,back,r.w,3.29,.18,'#c1b49a',p.solid);
  for(const side of [-1,1]){
    const x=r.u+side*r.w/2;
    const depth=side<0?1.02:r.d,mid=back+depth/2;
    f.put('box',x,.79,mid,.14,1.42,depth,'#8b7559',p.boarding);
    f.put('box',x,1.48,mid,.21,.11,depth+.12,wood,p.wood);
    f.put('box',x,2.13,mid,.095,1.27,depth,'#fff',p.lamps.shoji);
    const count=Math.ceil(depth/.305);
    for(let k=0;k<=count;k++)f.put('box',x,2.14,back+depth*k/count,.155,1.31,k%4===0?.069:.032,wood,p.wood);
    for(const y of [1.50,1.85,2.35,2.78])f.put('box',x,y,mid,.193,.045,depth+.10,wood,p.wood);
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
  f.put('box',r.u,3.159,r.v,r.w+.91,.050,r.d+.91,'#bb9b70',p.deck);
  for(let j=0;j<=21;j++){
    const x=r.u+(j/21-.5)*(r.w+.61);
    f.put('box',x,3.136,r.v,.095,.108,r.d+1.00,cedar,p.wood);
  }
  paintedPanels(p,f,textured('./assets/world/suzuri-rinsing-scroll.webp'),13.29,back+.128,1.99,6.12);
  p.shapes.suzuriWashSet=washSet();p.shapes.suzuriStool=bathStool();p.shapes.suzuriTub=tub();
  f.put('box',13.29,1.08,-3.92,7.36,.18,.23,'#93866a',p.wood);
  p.shapes.suzuriWashTrickle=brushStroke([[0,1.113,.088],[.002,1.097,.11],[.004,1.061,.129],[.006,.960,.15]],
    [.015,.013,.010,.014],9,7);
  p.shapes.suzuriWashRipple=new T.TorusGeometry(.073,.004,5,22);
  for(const [j,u] of RINSING_SEATS.entries()){
    f.put('suzuriWashSet',u,0,-3.35,1,1,1,'#fff',p.stems);
    if(j<3){
      f.put('suzuriWashTrickle',u,0,-3.35,1,1,1,'#c8ded3',p.springFlow);
      f.put('suzuriWashRipple',u+.006,.957,-3.20,1.02,.73,1,'#d4dccc',p.springFlow,0,PI/2);
    }
    f.put('suzuriStool',u,.19,-1.92,1,.85,1,'#fff',p.stems,j%2?.07:-.08);
  }
  // A wet gutter with removable cedar slats runs along the row of stools.
  f.put('box',13.30,.20,-2.79,7.75,.018,.20,'#5a6056',p.deck);
  for(let j=0;j<52;j++)f.put('box',9.49+j*.148,.217,-2.79,.085,.032,.214,'#978567',p.wood);
  const stackX=18.32;
  for(let j=0;j<3;j++)f.put('suzuriTub',stackX,.19+j*.30,-3.11,1.30-j*.09,.94,1.3-j*.09,'#fff',p.stems,j*.98);
  for(let j=0;j<4;j++)f.put('box',stackX+.01,.50+j*.118,-1.18,.74,.103,.46,j===3?'#72888c':'#d0c6ab',p.solid,j*.035);
  f.put('box',stackX,.350,-1.18,1.01,.23,.63,wood,p.wood);
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

function paving(p,f,s,level){
  // Dressed granite laid in alternating stretcher courses. Cut the paving
  // back from the inkstone's own grinding ledge and its sculpted foundation.
  const {left,right,back,front}=SUZURI_COURT;
  const tints=['#a7a696','#b3b1a1','#a2a492','#b8b5a4','#aaad9b'];
  for(let row=0;row<14;row++){
    const z=back+(row+.5)*.72;
    for(let col=0;col<=24;col++){
      const from=Math.max(left+.18,left+.18+(col-.5*(row%2))*1.13);
      const to=Math.min(right-.18,left+.18+(col+1-.5*(row%2))*1.13);
      if(to-from<.20 || z>front-.13)continue;
      const x=(from+to)/2;
      if(x>9.1 && x<19.65 && z<1.6)continue;
      const a=Math.atan2(z/s.rz,x/s.rx),lip=regionalSpringLip(s.shape,a);
      if(Math.hypot(x/s.rx,z/s.rz)<lip*1.21+.13)continue;
      if(x>3.44 && x<6.92 && z<-1.21 && z>-4.73)continue;
      const y=terrainMeshHeight(...sitePoint(s,x,z))-level;
      f.put('box',x,y+.005,z,to-from-.024,.048,.691,tints[(col*3+row*7)%5],p.stone);
    }
  }
  for(let i=0;i<5;i++){
    const z=front+.35+i*.37,y=terrainMeshHeight(...sitePoint(s,0,z))-level;
    f.put('box',0,y+.008,z,3.41-.12*i,.052,.34,i%2?'#abb0a1':'#a3a699',p.stone);
  }
}

export function dressSuzuriCourt(p,f,s,level){
  paving(p,f,s,level);
  for(const wall of SUZURI_WALLS)plasterWall(p,f,wall);
  const {back}=SUZURI_COURT;
  paintedPanels(p,f,textured('./assets/world/suzuri-wash-scroll.webp'),-.03,back+.20,1.70,6.77);
  gate(p,f);washingHall(p,f);
  p.shapes.suzuriTsukubai=brushGarden();
  f.put('suzuriTsukubai',7.45,.06,-3.69,1,1,1,'#fff',p.stems);
  dressSuzuriMaple(p,f);
  const gardenLamp=f.at(8.03,.045,-4.55);
  p.lamps.stoneLantern(gardenLamp.x,gardenLamp.y,gardenLamp.z,PI,.55);
}
