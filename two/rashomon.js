import * as T from './vendor/three.module.min.js';
import { RASHOMON, GATE_STEPS, GATE_STONE, GATE_WING, GATE_LEAF, GATE_FRONT_EAVE } from './kyo-layout.js';
import { drawRashomonStone } from './rashomon-stone.js';
import { terrainHeight,wrapDelta } from './terrain.js';
import { workshopFrame,inscriptionMaterial } from './civic-art.js';
import { sculpture } from './pilgrimage-pigment.js';
import { SilkPanels } from './kosode.js';
import { foldMark,paintedSilk } from './emaki-costume.js';
import { dressedRiceFace } from './mochi-model.js';
import { scrollPigment } from './kyo-scrollwork.js';

const tau=2*Math.PI,{sin,cos}=Math;
function elderPortrait(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384;
  const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.lineJoin=ctx.lineCap='round';
  function line(path,shade,wide=1,fill){
    const p=new Path2D(path);if(fill){ctx.fillStyle=fill;ctx.fill(p);}
    if(shade){ctx.strokeStyle=shade;ctx.lineWidth=wide;ctx.stroke(p);}
  }
  line('M18 45 Q23 39 34 40 Q40 39 44 33 Q42 44 33 45 Q23 44 18 48Z',null,0,'#766c56');
  line('M84 36 Q87 42 96 42 Q106 42 111 49 Q105 46 97 46 Q87 46 84 36Z',null,0,'#746b55');
  line('M22 52 Q30 49 40 50 Q36 57 31 57 Q26 56 22 52Z','#494237',1.35,'#dacba5');
  line('M86 53 Q93 49 105 54 Q98 57 94 58 Q90 57 86 53Z','#494237',1.3,'#dbceaf');
  for(const [x,y] of [[34,52],[98,54]]){ctx.fillStyle='#484336';ctx.beginPath();ctx.ellipse(x,y,2.3,2.7,0,0,tau);ctx.fill();}
  for(const d of ['M19 53Q16 51 13 52','M21 57Q17 57 13 60','M23 60Q31 65 39 59','M88 61Q95 66 104 58','M105 58Q110 58 114 62','M49 36Q55 40 54 45','M61 39Q66 32 76 35','M46 28Q59 31 69 27','M60 56Q62 53 65 56','M44 69Q38 71 35 78','M88 69Q94 72 94 77','M54 86Q63 89 70 84']){
    line(d,'#a1957b',.95);
  }
  line('M46 78 Q55 74 65 74 Q73 75 85 70 Q79 79 67 80 Q53 79 46 78Z','#756052',.8,'#9a7961');
  line('M49 78 Q63 75 69 77 Q79 74 84 71','#52473d',1.2);
  const map=new T.CanvasTexture(canvas);map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
function oldWoman(){
  const root=new T.Group(), p=new SilkPanels(),art=sculpture();
  root.name='羅生門の老婆餅';
  // A hunched shoulders-to-knees drape with patched hemp and a folded
  // reverse at the feet. Hair falls out of the parted hood on both sides.
  function fold(u,v,pad=0){
    const a=(u-.5)*tau,r=.48-.13*v-.14*v**7+.031*(1-v)*cos(9*a+2.3*v)+pad;
    return [r*sin(a),.07+.84*v+.025*(1-v)*cos(4*a),
      .76*r*cos(a)+.041+.22*v**2-.078*sin(Math.PI*v)];
  }
  p.cut(23,48,fold,4,'#69654f');
  // Long silent folds collect at the crouched knees, with a few pale slips
  // where the patched hemp reverses under the old woman's combing hand.
  for(const d of [-1,1])for(let i=0;i<6;i++){
    const u=.5+d*(.044+i*.073),v=.59+.12*cos(i);
    const knots=[[u-.043*d,v],[u-.022*d,v*.71],[u+.014*d,.22],[u+.026*d,.054]];
    foldMark(p,fold,knots,.006+(i%2)*.002,'#514f40',.007);
    if(i%3===1)foldMark(p,fold,knots.slice(1).map(([x,y])=>[x+d*.010,y+.024]),.004,'#958972',.007);
  }
  for(const side of [-1,1]){
    p.cut(13,5,(u,v)=>fold(.5+side*(.197-.28*v)+.026*u,.96-.47*v,.012),4,'#c0ab87');
    p.cut(14,18,(u,v)=>{
      const a=u*tau,r=.116+.034*v;
      return [side*(.24+.188*v)+r*sin(a),.721-.20*v+.14*cos(a),.085+.368*v];
    },4,'#73705a');
    art.ball('#d6c19d',side*.418,.526,.48,.072,.058,.094);
    const lock=[[side*.14,1.446,.29],[side*.32,1.348,.35],[side*.39,1.09,.398],[side*.32,.920,.455],[side*.38,.811,.410]];
    art.stroke('#797873',lock,[.046,.076,.067,.038,.002],21);
    const greys=['#94958c','#c5c0ae','#87877e','#b3b3a5','#ded1ba','#a3a49a'];
    // Parted strands comb over the cap, then separate in front of the ear.
    // The long, asymmetric tips have air between them in profile.
    for(let j=0;j<13;j++){
      const v=j/12,h=side*(.011*sin(j*2.28)),shift=side<0?.009:0;
      const strand=[[side*(.009+.048*v),1.46+.013*v,.269+.041*v],
        [side*(.119+.053*v),1.454-.019*v,.341+.066*v],
        [side*(.242+.060*v),1.398-.031*v,.376+.076*v],
        [side*(.316+.066*v),1.297-.025*v,.405+.07*v],
        [side*(.364+.028*v),1.158-.050*v,.421+.063*v],
        [side*(.350+.042*v)+h,1.041-shift-.102*v,.466+.037*v],
        [side*(.362+.061*sin(j*.9))+h,.936-.109*v,.494+.021*cos(j)]];
      art.stroke(greys[j%greys.length],strand,[.003,.008,.010,.009,.008,.004,.0007],30);
    }
    for(let j=0;j<6;j++){
      const v=j/5;
      art.stroke(j%2?'#b3ada1':'#7e8077',[[side*(.027+.08*v),1.441,.334],
        [side*(.119+.073*v),1.415,.405],[side*(.14+.131*v),1.369-.029*v,.468+.012*v],
        [side*(.192+.104*v),1.318-.015*v,.491+.025*(1-v)],
        [side*(.139+.160*v),1.282-.024*cos(j),.527+.013*(1-v)]],
        [.003,.008,.008,.005,.0008],20);
    }

  }
  for(const [u,v,col] of [[.32,.18,'#9b8f74'],[.65,.54,'#786a58'],[.81,.28,'#a2997e']]){
    p.cut(5,7,(a,b)=>fold(u+.047*a,v+.091*b,.009),4,col);
    for(let i=0;i<5;i++)art.stroke('#c3b398',[fold(u+i*.009,v+.002,.013),fold(u+i*.009+.005,v+.007,.013)],[.002,.002],4);
  }
  const hood=(u,v)=>{
    const a=tau*u,r=.354*cos(v*1.48);
    return [r*sin(a),1.27+.229*sin(v*1.48)+.025*cos(a),.166+.89*r*cos(a)-.101*v];
  };
  p.cut(16,39,hood,4,'#8e8b79');
  for(let k=-4;k<=4;k++){
    const u=.40+.014*k;art.stroke('#c1b8a1',[hood(u,.88),hood(u,.66),hood(u,.40),hood(u,.08)],
      [.001,.003,.006,.002],9);
  }
  const coat=new T.Mesh(p.finish(),paintedSilk());coat.castShadow=true;root.add(coat);
  const head=dressedRiceFace(1,0,elderPortrait());
  head.position.set(0,.618,.20);head.rotation.x=.17;head.scale.set(.37,.32,.32);root.add(head);
  // An asymmetrical brow and crow's feet sit on the original rice face.
  for(const side of [-1,1]){
    const x=side*.17;
    art.stroke('#898372',[[x-side*.054,1.201,.464],[x,1.230,.474],[x+side*.057,1.212,.45]],
      [.004,.012,.002],13);
  }
  const comb='#826441';
  art.box(comb,.30,.56,.528,.24,.05,.029,0,.24,-.14);
  for(let j=0;j<10;j++)art.box(comb,.203+j*.021,.502,.537,.010,.079,.014,0,.24,-.14);
  const trim=new T.Mesh(art.finish(),scrollPigment());trim.castShadow=true;root.add(trim);
  return root;
}
// A second, shallow line of kawara shelters the approach below the balustrade.
// Each half-round cover tile flares with the swept eave and ends over a round seal.
function gateEave(p,f){
  const e=GATE_FRONT_EAVE,rows=6,channels=42,samples=6,cols=channels*samples;
  const xyz=[],uv=[],faces=[];
  function bed(u,v){
    const x=(u-.5)*(e.w-.94*(1-v)),z=e.back+v*(e.front-e.back);
    const upturn=.12*Math.abs(2*u-1)**6*v*v;
    const y=e.low+(e.high-e.low)*(1-v)**1.35+upturn;
    return [x,y,z];
  }
  for(let j=0;j<=rows+1;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=Math.min(j/rows,1),[x,y,z]=bed(u,v);
    const rib=Math.max(0,cos(u*channels*tau))**.7;
    xyz.push(x,y+.083*rib-(j>rows?.095:0),z);
    uv.push(x/3.9,v*1.35);
    if(i<cols && j<=rows){
      const k=j*(cols+1)+i,n=k+cols+1;
      faces.push(k,n,k+1,k+1,n,n+1);
    }
  }
  const roof=new T.BufferGeometry();
  roof.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  roof.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  roof.setIndex(faces);roof.computeVertexNormals();
  p.shapes.rashomonLowerEave=roof;
  f.put('rashomonLowerEave',0,0,0,1,1,1,'#717970',p.roofs);
  for(let i=0;i<=channels;i++){
    const u=i/channels,[x,y,z]=bed(u,1);
    f.put('tileEnd',x,y-.017,z+.008,.095,.096,1,'#dedcce',p.workshopArt.tileEnd);
    if(i%2===1){
      const [bx,by,bz]=bed(u,.05);
      f.bar([bx,by-.17,bz-.31],[x,y-.18,z-.079],.072,'#936549',p.wood,true);
    }
  }
  // Short scarfed segments allow the fascia to rise with the corner rafters.
  for(let i=0;i<12;i++){
    const [x,y,z]=bed(i/12,1),[nx,ny,nz]=bed((i+1)/12,1);
    f.bar([x,y-.136,z-.063],[nx,ny-.136,nz-.063],.085,'#85543e',p.lacquer,true);
  }
}

function gateWings(p,f){
  const {x,z,w,d,eave,roofW,roofD,roofRise}=GATE_WING;
  const footingDepth=GATE_STONE.height;
  for(const side of [-1,1]){
    const cx=side*x;
    // Stagger the bed joints around the end stones where the wall leaves the dais.
    const blocks=[0,.18,.37,.62,.80,1],headers=[0,.10,.31,.53,.73,.93,1];
    for(const [row,cut] of [blocks,headers].entries()){
      for(let i=1;i<cut.length;i++){
        const u=cx+side*((cut[i]+cut[i-1])*.5-.5)*w;
        f.put('box',u,-footingDepth+(row+.5)*footingDepth/2,z,w*(cut[i]-cut[i-1])-.014,
          footingDepth/2-.012,d+.058,i%2?'#96968a':'#a19e90',p.stone);
      }
    }
    f.put('box',cx,.103,z,w+.038,.206,d+.070,'#a7a699',p.stone);
    f.put('box',cx,1.23,z,w,2.17,d-.16,'#e1d6bf',p.workshopArt.clay);
    for(let i=0;i<=3;i++){
      const u=cx+side*(i/3-.5)*(w-.16);
      f.put('box',u,1.255,z,.145,2.20,d-.100,'#99694f',p.lacquer);
      f.put('box',u,.254,z,.174,.125,d-.074,'#715442',p.wood);
    }
    f.put('box',cx,eave-.12,z,w+.14,.235,d,'#846248',p.wood);
    f.put('hipRoof',cx,eave,z,roofW,roofRise,roofD,'#757970',p.roofs);
    f.put('box',cx,eave+roofRise+.025,z,roofW*.466,.108,.205,'#686f67',p.roofs);
    for(let i=-8;i<=8;i++)for(const face of [-1,1]){
      const u=cx+i*roofW/17;
      f.put('round',u,eave+.014,z+face*roofD*.485,.065,.105,.065,'#717970',p.fine,0,Math.PI*.5);
      f.put('tileEnd',u,eave+.014,z+face*(roofD*.485+.053),.063,.063,1,'#d6d8ca',
        p.workshopArt.tileEnd,face===1?0:Math.PI);
    }
  }
}

export function createRashomon(scene,p){
  const groundY=terrainHeight(RASHOMON.x,RASHOMON.z),y=groundY+GATE_STONE.height,floor=RASHOMON.base;
  drawRashomonStone(scene,p,groundY);
  const f=workshopFrame(p,{...RASHOMON,yaw:0},y),put=f.put,bar=f.bar;
  const red='#a36047',black='#55493b',weathered='#a17b58',slate='#68706b';
  gateWings(p,f);
  gateEave(p,f);
  // A dressed granite seat spreads the load of each timber across the pavement.
  p.shapes.rashomonColumnFoot=new T.LatheGeometry([[.53,0],[.54,.04],[.527,.113],
    [.493,.151],[.413,.171],[.370,.205],[.346,.222],[.335,.250],[.008,.250]]
    .map(([r,h])=>new T.Vector2(r,h)),28);
  for(const u of [-7.30,-3.65,3.65,7.30])for(const v of [-2.18,2.18]){
    put('rashomonColumnFoot',u,0,v,1,1,1,'#b5b1a1',p.stone);
    put('round',u,2.60,v,.32,4.70,.32,red,p.lacquer);
    for(let j=0;j<3;j++){
      put('box',u,4.12+j*.255,v,.69+j*.42,.23,.68,weathered,p.wood);
      put('box',u,4.24+j*.21,v,.39,.18,.84+j*.43,red,p.wood);
    }
  }
  for(const side of [-1,1]){
    const door=GATE_LEAF,mid=side*door.x;
    put('box',mid,door.y,door.z,door.w,door.h,door.d,'#806247',p.boarding);
    for(let k=-2;k<=2;k++)put('box',mid+k*.58,1.35,.211,.045,2.46,.056,black,p.wood);
    for(const h of [.64,2.02])put('box',mid,h,.225,3.43,.15,.07,'#5a4f40',p.bronze);
    for(let k=-4;k<=4;k++)put('ball',mid+.32*k,2.03,.274,.052,.058,.021,'#9e9379',p.bronze);
    put('box',0,4.43,side*2.18,16.2,.36,.36,black,p.wood);
    put('box',0,floor-.19,side*3.62,17.5,.32,.27,red,p.wood);
    put('box',side*7.33,floor+1.92,0,.24,3.84,5.12,'#524d43',p.boarding);
    put('box',side*5.61,floor+1.92,2.52,3.63,3.84,.17,'#615a49',p.boarding);
  }
  put('box',0,floor-.088,0,17.6,.176,7.7,'#856c52',p.deck);
  put('box',0,floor+3.99,0,16.4,.18,6.74,'#534b3d',p.boarding);
  put('box',-1.69,floor+1.9,-2.52,11.45,3.8,.21,'#534b3f',p.boarding);
  put('box',6.60,floor+1.9,-2.52,1.62,3.8,.21,'#534b3f',p.boarding);
  // Shitomi hang open under the eave, leaving the room in reflected light.
  for(const u of [-5.53,-1.85,1.85,5.53]){
    put('box',u,floor+3.29,2.89,3.37,.13,.98,'#715e47',p.boarding,0,-.22);
    for(const edge of [-1,1])bar([u+edge*1.42,floor+3.95,2.5],[u+edge*1.42,floor+3.32,3.29],.015,'#625344');
    if(Math.abs(u)>3){
      put('box',u,floor+1.93,2.62,2.32,1.9,.095,'#444437',p.workshopArt.reed);
      for(let j=-4;j<=4;j++)put('box',u+j*.264,floor+1.93,2.69,.057,1.92,.051,'#b28a62',p.wood);
    }
  }
  for(let j=-10;j<=10;j++){
    put('box',j*.82,floor+.57,3.57,.085,1.10,.085,red,p.lacquer);
    for(const side of [-1,1])bar([j*.82,8.84,side*2.65],[j*.82,9.04,side*4.46],.099,'#987658',p.wood,true);
  }
  for(const h of [.34,1.04])put('box',0,floor+h,3.57,17.32,.14,.16,'#80543c',p.lacquer);
  for(const sign of [-1,1])for(const v of [-2.53,2.53])put('round',sign*7.30,floor+2.01,v,.24,3.99,.24,red,p.lacquer);
  for(const v of [-2.53,2.53])for(const u of [-3.66,0,3.66]){
    put('round',u,floor+2.01,v,.22,3.99,.22,red,p.lacquer);
    put('box',u,8.82,v,.97,.24,.66,red,p.wood);
  }
  put('hipRoof',0,9.11,0,19.6,3.15,9.1,slate,p.roofs);
  put('box',0,12.28,0,9.32,.26,.42,'#5c665f',p.roofs);
  for(const side of [-1,1]){
    put('finial',side*4.68,12.40,0,.28,.65,.28,'#897b58',p.bronze);
    for(let k=-10;k<=10;k++)put('round',k*.88,9.12,side*4.54,.113,.23,.113,'#869088',p.roofs,0,Math.PI/2);
  }
  put('box',0,4.1,2.52,3.93,1.20,.23,'#69563c',p.wood);
  put('plane',0,4.1,2.651,3.74,1.045,1,'#fff',inscriptionMaterial('羅生門'));
  put('box',7.30,floor-.09,-4.04,6.34,.18,1.60,'#8b7456',p.deck);
  for(const step of GATE_STEPS)put('box',step.x,step.top-.085,step.z,step.w,.17,step.d,'#a0835e',p.deck);
  for(const index of [1,8,15,22,27]){
    const q=GATE_STEPS[index];put('box',10.52,q.top+.44,q.z,.11,.89,.11,'#796149',p.wood);
  }
  bar([10.52,.98,3.98],[10.52,5.96,-4.0],.071,black,p.wood,true);
  put('box',-2.53,floor+.06,-.70,2.95,.12,1.58,'#777863',p.workshopArt.reed);
  const lampX=-1.69,lampZ=.66;
  put('box',lampX,floor+.15,lampZ,.52,.064,.47,'#785941',p.wood);
  for(const u of [-.18,.18])put('box',lampX+u,floor+.074,lampZ,.069,.13,.35,'#66503f',p.wood);
  const glazed=new T.MeshStandardMaterial({color:'#9c6d4b',roughness:.54,side:T.DoubleSide});
  p.shapes.oilSaucer=new T.LatheGeometry([[.09,0],[.123,.008],[.122,.023],[.142,.032],[.202,.07],[.26,.105],
    [.285,.117],[.281,.137],[.247,.122],[.18,.082],[.128,.062],[.02,.057]].map(([x,h])=>new T.Vector2(x,h)),44);
  put('oilSaucer',lampX,floor+.187,lampZ,1,1,1,'#fff',glazed);
  const oil=new T.MeshStandardMaterial({color:'#69543a',roughness:.28});
  put('round',lampX,floor+.262,lampZ,.177,.006,.177,'#fff',oil);
  bar([lampX-.03,floor+.265,lampZ],[lampX+.188,floor+.302,lampZ+.053],.017,'#574433',p.wood);
  bar([lampX+.174,floor+.300,lampZ+.05],[lampX+.237,floor+.340,lampZ+.071],.017,'#3e3730',p.wood);
  const wick=new T.MeshBasicMaterial({color:'#ffb15b'});
  const ember=new T.MeshBasicMaterial({color:'#ffe9a4'});
  const tongue=(r,h,lean)=>new T.LatheGeometry([[.05,0],[.72,.04],[1,.22],[.78,.48],[.40,.72],[.05,1]]
    .map(([w,y])=>new T.Vector2(r*w,h*y)),18).rotateZ(lean);
  p.shapes.gateFlame=tongue(.038,.17,-.15);p.shapes.gateEmber=tongue(.022,.085,-.13);
  put('gateFlame',lampX+.235,floor+.330,lampZ+.073,1,1,1,'#fff',wick);
  put('gateEmber',lampX+.24,floor+.333,lampZ+.105,1,1,1,'#fff',ember);
  const glow=new T.PointLight('#efa762',.65,3.5,1.7);
  glow.position.set(RASHOMON.x+lampX+.22,y+floor+.53,RASHOMON.z+lampZ+.1);scene.add(glow);
  const woman=oldWoman();
  woman.position.set(RASHOMON.x-2.58,y+floor+.13,RASHOMON.z-.7);woman.rotation.y=.72;woman.scale.setScalar(1.15);
  scene.add(woman);
  return (t,hero)=>{
    const near=Math.hypot(wrapDelta(hero.x-RASHOMON.x),wrapDelta(hero.z-RASHOMON.z))<105;
    woman.visible=near;
    if(near){woman.rotation.y=.72+.089*sin(t*.46);woman.rotation.x=.038+.017*sin(t*1.2);glow.intensity=.64+.09*sin(t*5.43)+.027*cos(t*12.1);}
  };
}
