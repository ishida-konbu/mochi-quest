// A late-afternoon silhouette in three inks: a broad bark roof, the open
// lattice of the hillside stage, and a small vermilion tower above the gate.
import * as T from './vendor/three.module.min.js';
import { terrainHeight, wrapDelta, seeded } from './terrain.js';
import { KIYOMIZU, KIYOMIZU_BELL as BELL, STAGE, STAGE_RAILS, STAGE_PILES,
  visitStageTies, HALL_COLUMNS, BELL_COLUMNS, OTOWA_ROOFS, OTOWA_LANTERNS, OTOWA_WAYSTONE, PAGODA, GATE } from './kiyomizu-layout.js';
import { BELL_FIRST, BELL_INTERVAL } from './kiyomizu-bell.js';
import { createTempleMonks } from './temple-monks.js';
import { roofProfile, roofSkinDepth } from './architecture.js';
import { roofShell, atticWalls, timberLining } from './roof-shell.js';
import { inscriptionMaterial } from './civic-art.js';
import { scrollPaper, printSurface } from './kyo-scrollwork.js';
import { sculpture } from './pilgrimage-pigment.js';
const floor=KIYOMIZU.floor, turn=Math.PI/2;
const wood='#725342',ink='#403a32',weathered='#997b58',red='#ae5039',plaster='#ebe1c6';
const barkRange=590;

function cypressBark() {
  const c=document.createElement('canvas');c.width=384;c.height=256;
  const g=c.getContext('2d'),rand=seeded(0x68697761);
  g.fillStyle='#6c584b';g.fillRect(0,0,c.width,c.height);
  for(let j=0;j<32;j++){
    const y=j*8;
    for(let x=-30-rand()*45;x<c.width;){
      const w=25+rand()*52,tone=Math.floor(rand()*18);
      g.fillStyle='rgb('+[103+tone,86+tone,72+tone].join(',')+')';
      g.fillRect(x,y,w,8);
      for(let k=0;k<11;k++){
        const yy=y+rand()*7;
        g.fillStyle=k%2?'rgba(237,205,149,.14)':'rgba(28,29,23,.22)';
        g.fillRect(x+rand()*w,yy,2+rand()*7,.6);
      }
      x+=w;
    }
    g.fillStyle='rgba(42,36,31,.58)';g.fillRect(0,y+7,c.width,.9);
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
  return new T.MeshLambertMaterial({map:tex});
}

// These large forms keep their contours across the valley. The small
// fittings use the painter's usual street-scale batches and draw distances.
function frame(p) {
  for(const shape of ['box','round','hipRoof','pagodaCrown']){
    p.shapes['otowa_'+shape]=p.shapes[shape].clone();
    p.shapes['otowa_'+shape].userData.range=barkRange;
  }
  p.shapes.otowaBark=roofShell('barkHip');
  p.shapes.otowaBark.userData.range=barkRange;
  p.shapes.otowaAttic=atticWalls('barkHip',.79,.69);
  p.shapes.otowaAttic.userData.range=barkRange;
  const bark=timberLining(cypressBark(),p.roofTimber), tile=timberLining(p.roofs,p.roofTimber);
  // A pierced six-sided bronze lantern: peaked cap, hanging corner bells,
  // an open frame around the paper, and an inverted lotus below the flame.
  const lantern=sculpture(),hex=points=>new T.LatheGeometry(points.map(([r,y])=>new T.Vector2(r,y)),6);
  lantern.add(hex([[.03,-.59],[.10,-.52],[.22,-.44],[.34,-.39],[.40,-.32],[.30,-.28]]),'#747660');
  lantern.add(hex([[.33,.23],[.49,.22],[.485,.27],[.30,.32],[.16,.48],[.053,.54]]),'#5b685a');
  lantern.add(new T.TorusGeometry(.082,.022,6,12),'#8a8062',0,.60,0);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    lantern.post('#686a55',.31*Math.sin(a),-.03,.31*Math.cos(a),.032,.55,.032);
    lantern.ball('#9a8964',.475*Math.sin(a),.18,.475*Math.cos(a),.039,.075,.039);
  }
  p.shapes.otowaLamp=lantern.finish();p.shapes.otowaLampGlass=hex([[.295,-.29],[.295,.235]]);
  const put=(s,x,y,z,w,h,d,tint,mat=p.wood,yaw=0)=>
    p.part(s,x,y,z,w,h,d,tint,yaw,0,0,mat,true,true);
  const beam=(x,y,z,w,h,d,tint=wood,mat=p.wood)=>put('otowa_box',x,y,z,w,h,d,tint,mat);
  const post=(x,z,bottom,top,r,tint)=>put('otowa_round',x,(bottom+top)/2,z,r,top-bottom,r,tint);
  function roof(r){
    const form=r.form==='barkHip'?'otowaBark':r.form==='pagoda'?'otowa_pagodaCrown':'otowa_hipRoof';
    put(form,r.x,r.eave,r.z,r.width,r.rise,r.depth,r.form==='barkHip'?'#e1d5bf':'#707773',
      r.form==='barkHip'?bark:tile,r.yaw);
  }
  function hangingLamp(x,y,z,hook,floorY){
    put('otowaLamp',x,y,z,1,1,1,'#fff',p.stems);
    put('otowaLampGlass',x,y,z,1,1,1,'#ffdec1',p.lamps.shoji);
    post(x,z,y+.65,hook,.016,'#5d5b4a');
    p.lamps.covered(x,y,z,.38,floorY,false);
  }
  return {put,beam,post,roof,hangingLamp};
}

function hangingStage(p,f) {
  const {beam,post,put}=f,s=STAGE;
  const deckWidth=s.east-s.west,deckDepth=s.south-s.north;
  // Each round zelkova pile sits on a fieldstone at its own elevation.
  // Horizontal nuki run through the posts in two directions on each tier.
  visitStageTies(terrainHeight,(x,y,z,w,h,d)=>beam(x,y,z,w,h,d,weathered));
  for(const [x,z] of STAGE_PILES){
    const ground=terrainHeight(x,z);
    if(ground>floor-.42)continue;
    put('rock',x,ground-.05,z,.84,.38,.77,'#8e9286',p.stone);
    post(x,z,ground-.55,floor-.30,.405,((z+729.15)/4.05|0)%3?wood:'#614b3c');
    if(ground<floor-1.8)beam(x,floor-1.02,z,1.06,.58,.86,'#61503d');
  }
  for(const z of [-729.15,-725.1,-721.05,-717,-712.95,-708.9,-704.85])
    beam(506.5,floor-.64,z,31.05,.68,.44,wood);
  for(const x of [491.38,496.5,500.8,505.1,509.4,513.7,518])
    beam(x,floor-.83,-717,.49,.63,27.47,wood);
  beam((s.west+s.east)/2,floor-.245,-717,deckWidth,.29,deckDepth,ink);
  for(let i=0;i<76;i++){
    const w=deckWidth/76,tone=['#ad906b','#b29570','#ac8e68','#bba07a'][i%4];
    beam(s.west+(i+.5)*w,floor-.06,-717,w-.013,.12,deckDepth,tone,p.deck);
  }
  for(const [x,z,w,d] of STAGE_RAILS){
    const along=w>d, length=Math.max(w,d),count=Math.ceil(length/2.4);
    for(const [y,height,width,color] of [[.24,.14,.12,wood],[.63,.10,.11,weathered],[.96,.13,.23,ink]])
      beam(x,floor+y,z,along?length:width,height,along?width:length,color);
    for(let j=0;j<=count;j++){
      const at=length*(j/count-.5);
      beam(x+(along?at:0),floor+.54,z+(along?0:at),.20,1.14,.20,wood);
    }
  }
}

function barkRafters(p,r) {
  const bottom=roofSkinDepth('barkHip')*r.rise;
  // The hipped roof runs N–S. Rafters follow the actual pitch, including
  // the lifted corner; only the square-cut noses extend beyond the bark.
  for(const end of [false,true])for(const side of [-1,1]){
    const count=end?26:38;
    for(let i=1;i<count;i++){
      const along=2*i/count-1;
      function at(t){
        const span=.46+.54*t;
        const u=end?side*span:along*span,v=end?along*t:side*t;
        const rise=roofProfile('barkHip',Math.max(-1,Math.min(1,u)),Math.max(-1,Math.min(1,v)))*r.rise;
        return new T.Vector3(r.x+v*r.depth/2,r.eave+rise-bottom-.095,r.z-u*r.width/2);
      }
      const tip=at(1.009),mid=at(.90);
      p.link(at(.70),mid,.16,'#795f46',true,true,true,p.wood);
      p.link(mid,tip,.154,'#947452',true,true,true,p.wood);
    }
  }
}

function sanctuary(p,f) {
  const {put,beam,post,roof}=f,r=OTOWA_ROOFS[0];
  roof(r);barkRafters(p,r);
  put('otowaAttic',r.x,r.eave-.06,r.z,r.width,r.rise,r.depth,'#5f4b37',p.boarding,r.yaw);
  beam(r.x,93.05,r.z,.52,.59,16.3,'#493e34',p.lacquer);
  for(const [x,z] of HALL_COLUMNS){
    post(x,z,floor,84.25,.31,'#574537');
    beam(x,82.98,z,.78,.26,.78,ink);
    beam(x,83.32,z,1.15,.43,.62,wood);
    beam(x,83.70,z,.78,.37,1.65,weathered);
  }
  for(const x of [504.9,511.8,520])beam(x,83.9,-717,.49,.59,25.8,wood);
  for(const z of [-728.7,-723,-717,-711,-705.3])beam(512.1,83.89,z,19,.61,.49,wood);
  beam(520.1,80.18,-717,.23,7.36,23.6,plaster,p.solid);
  for(const z of [-728.8,-705.2]){
    beam(516.1,80.18,z,8.14,7.36,.22,plaster,p.solid);
    for(let j=0;j<9;j++)beam(512.2+j*.96,80.2,z,.14,7.36,.25,wood);
  }
  // The two animal scrolls flank closed gilt shrine doors in the rear bay.
  for(const [i,z] of [-724.2,-709.8].entries()){
    const key='otowaEmaki'+i;
    p.shapes[key]=printSurface(i?3:0,'panel');
    beam(519.94,80.0,z,.17,3.64,5.43,ink);
    put(key,519.835,80.0,z,5.20,3.40,1,'#fff6de',scrollPaper(),-turn);
  }
  beam(518.05,floor+.71,-717,2.1,1.43,7.1,'#493d35',p.lacquer);
  beam(518.75,floor+2.86,-717,1.2,2.88,3.1,ink,p.lacquer);
  for(const z of [-717.72,-716.28]){
    beam(518.10,floor+2.85,z,.13,2.55,1.37,'#b39459',p.lacquer);
    beam(518.01,floor+2.85,z,.09,2.20,1.16,'#776345',p.lacquer);
  }
  put('otowa_hipRoof',518.65,floor+4.24,-717,4.3,1.14,2.48,'#594f3f',p.lacquer,turn);
  // Lifted shitomi shutters expose the front aisle; their lower edges catch the sun.
  for(const z of [-725.85,-720,-714,-708.15]){
    beam(505.03,82.13,z,.16,1.7,5.13,'#695541');
    for(let j=0;j<11;j++)beam(504.90,82.15,z+(j-5)*.45,.15,1.58,.064,ink);
    for(const y of [81.55,82.10,82.69])beam(504.86,y,z,.10,.083,5.13,ink);
  }
  for(const z of [-723,-711])f.hangingLamp(506.1,81.25,z,83.74,floor);
  const plaque=inscriptionMaterial('清水寺',{ground:'#33443e',ink:'#e4c789'});
  beam(504.62,82.24,-717,.22,1.35,3.66,'#8d7146');
  put('plane',504.49,82.24,-717,3.39,1.13,1,'#ffffff',plaque,-turn);
  for(const [x,z,y,scale] of [[505.9,-726,floor,.94],[505.9,-708,floor,.94],[517.8,-719.6,floor+1.43,.74],
    [517.8,-714.4,floor+1.43,.74],[512.2,-726.8,floor,1.06],[512.2,-707.2,floor,1.06]])
    p.lamps.candle(x,y,z,scale);
}

function sweptGravel(){
  const c=document.createElement('canvas');c.width=c.height=192;
  const g=c.getContext('2d'),rand=seeded(0x6f746f77);
  g.fillStyle='#c3bba4';g.fillRect(0,0,c.width,c.height);
  for(let j=0;j<24;j++){
    const y=j*8;
    g.strokeStyle=j%3?'rgba(105,98,78,.14)':'rgba(240,231,199,.35)';
    g.beginPath();g.moveTo(0,y);g.bezierCurveTo(60,y-1.4,138,y+2.2,192,y);g.stroke();
  }
  for(let i=0;i<2900;i++){
    const x=rand()*192,y=rand()*192,size=.32+rand()*1.38;
    g.fillStyle=i%4?'rgba(96,91,74,.36)':'rgba(236,226,194,.68)';
    g.fillRect(x,y,size,size*.7);
  }
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
  return new T.MeshLambertMaterial({map:texture});
}

function approaches(p,f){
  const {put,beam,post,roof}=f;
  // A dressed gravel forecourt runs from the bell to the open northern
  // entrance of the stage. A chamfer follows the hillside at the north end.
  const court=new T.Shape();
  const kerb=[[499.3,-731.03],[528.6,-731.03],[528.6,-756.7],[525.9,-757.8],[503.3,-757.8],[499.3,-754.3]];
  kerb.forEach(([x,z],i)=>i?court.lineTo(x-510,-z-745):court.moveTo(x-510,-z-745));
  court.closePath();const paving=new T.ShapeGeometry(court);paving.rotateX(-turn);
  const uv=paving.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.35,uv.getY(i)*.35);
  p.shapes.otowaGravel=paving;
  put('otowaGravel',510,floor+.019,-745,1,1,1,'#ece6d6',sweptGravel());
  for(let i=0;i<7;i++)beam(503,floor+.028,-732.2-i*1.4,2.4,.042,1.14,'#cfc9b6',p.stone);
  const marker=OTOWA_WAYSTONE,my=terrainHeight(marker.x,marker.z);
  beam(marker.x,my+.79,marker.z,.52,1.63,.55,'#abb09f',p.stone);
  put('rock',marker.x,my+.08,marker.z,.55,.21,.53,'#979984',p.stone);
  for(const [i,glyph] of Array.from('清水道').entries())put('plane',marker.x-.266,my+1.29-i*.4,marker.z,
    .36,.40,1,'#ffffff',inscriptionMaterial(glyph,{ground:'#9b9985',ink:'#494b40',square:true}),-turn);
  const base=terrainHeight(GATE.x,GATE.z);
  roof({x:GATE.x,z:GATE.z,width:9.6,depth:6.2,yaw:turn,eave:base+4.1,rise:2.85,form:'hip'});
  for(const u of [-1.45,1.45])for(const v of [-3.1,3.1]){
    const x=GATE.x+u,z=GATE.z+v,y=terrainHeight(x,z);
    put('rock',x,y,z,.69,.33,.62,'#9a9a88',p.stone);
    post(x,z,y,base+4.14,.265,red);
    beam(x,base+3.85,z,.73,.48,.8,'#90503b');
  }
  for(const u of [-1.45,1.45]){
    beam(GATE.x+u,base+3.49,GATE.z,.37,.35,7.2,red);
    beam(GATE.x+u,base+4.12,GATE.z,.5,.35,8.2,ink);
  }
  beam(GATE.x-1.6,base+3.23,GATE.z,.09,.85,2.2,'#66523c');
  put('plane',GATE.x-1.66,base+3.23,GATE.z,2.05,.74,1,'#ffffff',
    inscriptionMaterial('音羽山'),-turn);
  for(const [x,z] of OTOWA_LANTERNS){
    p.lamps.stoneLantern(x,terrainHeight(x,z),z,0,.83);
  }
  const {x,z}=PAGODA;
  beam(x,floor+.055,z,7.75,.19,7.75,'#bcbaa5',p.stone);
  for(let i=0;i<3;i++){
    const span=10.5-1.65*i,w=span*.53,y=floor+3.65*i;
    beam(x,y+1.53,z,w,3.05,w,'#ded0b0',p.solid);
    for(const sign of [-1,1]){
      // The opening and pale plaster between lacquered corner columns.
      for(const axis of [0,1]){
        const xx=x+(axis?0:sign*w*.508),zz=z+(axis?sign*w*.508:0);
        beam(xx,y+1.53,zz,axis?w*.54:.28,1.85,axis?.28:w*.54,'#dcc8a2',p.lamps.shoji);
        const face=w*.508+.15;
        if(sign<0)p.lamps.covered(x+(axis?0:sign*face),y+1.49,z+(axis?sign*face:0),.37,y+.1,false);
        for(let k=-2;k<=2;k++)
          beam(xx+(axis?k*.32:0),y+1.53,zz+(axis?0:k*.32),axis?.08:.32,1.85,axis?.32:.08,red);
        beam(xx,y+.66,zz,axis?w+.23:.37,.25,axis?.37:w+.23,red);
        beam(xx,y+2.51,zz,axis?w+.23:.37,.26,axis?.37:w+.23,red);
      }
      for(const side of [-1,1])post(x+side*w*.50,z+sign*w*.50,y,y+3.05,.15,'#af5238');
    }
    roof({x,z,width:span,depth:span,eave:y+3.02,rise:2.12,yaw:0,form:'pagoda'});
  }
  post(x,z,floor+12.2,floor+16.35,.099,'#554f40');
  for(let j=0;j<9;j++)put('round',x,floor+12.66+j*.29,z,.56-.035*j,.067,.56-.035*j,'#786e52',p.bronze);
  put('finial',x,floor+15.24,z,.24,1.23,.24,'#6f6954',p.bronze);
}

function bellTower(p,f,scene) {
  const {put,beam,roof,post}=f,b=BELL;
  roof(OTOWA_ROOFS[1]);
  for(const [x,z] of BELL_COLUMNS){
    put('rock',x,floor+.04,z,.44,.20,.45,'#a09d88',p.stone);
    post(x,z,floor+.025,80.73,.28,red);
    beam(x,80.05,z,.78,.21,.73,'#45655a');
    beam(x,80.31,z,1.07,.31,.54,red);
    beam(x,80.60,z,.66,.24,1.24,plaster);
    beam(x,80.89,z,1.39,.30,.64,'#784638');
  }
  for(const u of [-3.35,3.35])beam(b.x+u,80.9,b.z,.45,.50,7.3,red);
  for(const v of [-2.65,0,2.65])beam(b.x,80.91,b.z+v,8.32,.52,.42,red);
  beam(b.x,80.50,b.z,.48,.48,6.23,ink);
  beam(b.x,81.0,b.z,7.49,.28,6.78,weathered);

  // One casting with an open mouth, a dark interior, four raised striking
  // plates, three bands of relief, and rows of studs below the shoulder.
  const cast=sculpture(), profile=b.profile;
  const section=[[.16,2.21],[.62,1.94],[.77,.18],[.80,.018],
    ...profile.map(([y,r])=>[r,y]),[.16,2.31],[.16,2.21]];
  const lathe=(points,sides=48)=>new T.LatheGeometry(points.map(([x,y])=>new T.Vector2(x,y)),sides);
  cast.add(lathe(section),'#526357');
  for(const [y,r] of [[.055,.942],[.20,.867],[.72,.831],[.78,.826],[1.77,.766]])
    cast.add(lathe([[r,y-.024],[r+.022,y],[r,y+.038]]),'#837a5a');
  for(let k=0;k<4;k++){
    const axis=k*Math.PI/2;
    for(let j=0;j<4;j++)for(let i=0;i<5;i++){
      const a=axis+(i-2)*.157,y=1.1+j*.16,r=.825-.053*(y-.22);
      cast.ball('#758070',Math.sin(a)*r,y,Math.cos(a)*r,.052,.055,.051);
    }
    for(const m of [-1,1]){
      const a=axis+m*.51;
      cast.post('#73775d',Math.sin(a)*.810,1.11,Math.cos(a)*.810,.018,1.29,.018);
    }
    cast.ball('#877b53',.836*Math.sin(axis),.62,.836*Math.cos(axis),.162,.164,.052,0,axis);
    cast.ball('#605f48',.854*Math.sin(axis),.62,.854*Math.cos(axis),.111,.112,.052,0,axis);
  }
  const ring=new T.TorusGeometry(.237,.072,8,20);
  cast.add(ring,'#697263',0,2.49,0);
  // The upper shackle wraps through the crown ring and disappears into the
  // timber above it. The chain stays attached as the casting quivers.
  put('round',b.x,80.18,b.z,.048,.51,.048,'#6c6956',p.bronze);
  for(const [u,v] of [[-2.1,-2.65],[2.25,2.65]])f.hangingLamp(b.x+u,79.38,b.z+v,80.75,floor);
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.19,side:T.DoubleSide});
  const bronze=new T.Mesh(cast.finish(),mat);
  bronze.castShadow=bronze.receiveShadow=true;
  const root=new T.Group();root.name='清水寺・梵鐘と撞木';
  const crown=new T.Group();crown.position.y=2.72;
  bronze.position.y=-2.72;crown.add(bronze);root.add(crown);
  const striker=new T.Group(),timber=sculpture();
  striker.position.set(0,3.18,2.26);
  timber.post('#896b49',0,-2.46,0,.180,2.55,.18,turn);
  for(const z of [-.86,.86]){
    timber.post('#453e31',0,-2.46,z,.195,.10,.195,turn);
    timber.stroke('#79684d',[[0,-2.38,z],[0,-1.29,z+.12],[0,0,z+.24]],[.035,.031,.036],10);
  }
  timber.post('#be9b69',0,-2.46,-1.285,.165,.026,.165,turn);
  const mallet=new T.Mesh(timber.finish(),new T.MeshLambertMaterial({vertexColors:true}));
  mallet.castShadow=true;striker.add(mallet);root.add(striker);scene.add(root);
  const updateMonks=createTempleMonks(scene),anchor=new T.Vector3();
  const x=b.x,z=b.z;
  return (time,player,event)=>{
    const dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
    root.visible=dx*dx+dz*dz<145*145;
    if(!root.visible){updateMonks(time,player);return;}
    root.position.set(player.x+dx,b.bottom,player.z+dz);
    const t=event ? time-event.time:Infinity;
    const moving=t>=0 && t<9;
    crown.rotation.x=moving ? .014*Math.exp(-t*1.18)*Math.sin(13*t):0;
    const beat=(time+(player.kyoClockOffset??0)-BELL_FIRST)%BELL_INTERVAL;
    const phase=(beat+BELL_INTERVAL)%BELL_INTERVAL,until=BELL_INTERVAL-phase;
    // A slow outward pull, then a quick release so the wood touches bronze
    // exactly on the scheduled sound. A thrown notice moves only the casting.
    const pull=until<2.25 ? Math.sin(Math.PI*Math.min(1,(2.25-until)/1.96)*.5)**2*
      Math.min(1,until/.29):0;
    const contact=until<.29 ? .061*(1-until/.29):
      moving && event.source==='mallet' ? .061*Math.exp(-t*1.55)*Math.cos(t*5.9):0;
    striker.rotation.x=contact-.190*pull;
    const a=striker.rotation.x;
    anchor.set(x,b.bottom+3.18-2.62*Math.cos(a)-1.24*Math.sin(a),z+2.26-2.62*Math.sin(a)+1.24*Math.cos(a));
    updateMonks(time,player,pull,anchor);
  };
}

export function createKiyomizu(scene,p) {
  const f=frame(p);
  hangingStage(p,f);sanctuary(p,f);approaches(p,f);
  return bellTower(p,f,scene);
}
