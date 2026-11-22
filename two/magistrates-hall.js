import * as T from './vendor/three.module.min.js';
import { COURT, COURT_COLUMNS, COURT_STEPS, COURT_GATE_Z } from './retreat-layout.js';
import { COURT_CANDLES } from './lamp-layout.js';
import { dressCourtWatch } from './court-watch.js';
import { sculpture } from './pilgrimage-pigment.js';
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
  for(let i=-40;i<=40;i++){
    const u=i*.555;
    f.put('round',u,8.04,12.48,.156,.40,.156,'#5f6762',p.roofs,0,PI/2);
    f.put('round',u,8.04,12.70,.137,.039,.137,'#89908a',p.roofs,0,PI/2);
    if(i%2===0)for(let t=0;t<3;t++)f.put('courtTomoe',u,8.04,12.728,.17,.17,.043,'#606c64',p.fine,0,0,t*PI*2/3);
  }
}
function gate(p,f) {
  const z=COURT_GATE_Z,sign=inscriptionMaterial('京の評定所');
  for(const side of [-1,1]){
    for(const v of [-.72,.72]){
      f.put('rock',side*4.68,.16,z+v,.59,.24,.53,'#969587',p.stone);
      f.put('box',side*4.68,2.29,z+v,.44,4.54,.46,beam);
      f.put('box',side*4.68,3.88,z+v,.83,.28,.65,cedar);
    }
    // Open plank leaves retain their black iron straps and bosses.
    f.put('box',side*4.42,1.74,z-.83,.18,3.22,2.0,cedar,p.boarding);
    for(const y of [.62,1.69,2.86]) {
      f.put('box',side*4.31,y,z-.8,.05,.12,2.03,ink,p.bronze);
      for(const dz of [-.72,.06,.76])f.put('ball',side*4.27,y,z-.8+dz,.043,.052,.052,brass,p.bronze);
    }
    f.put('box',side*11.98,1.04,z,14.44,1.93,.48,'#d6ceb2',p.solid);
    f.put('roof',side*11.98,2.05,z,14.60,.32,1.13,slate,p.roofs);
    f.put('box',side*19.0,1.04,21.8,.41,1.93,24.0,'#d6ceb2',p.solid);
    f.put('roof',side*19.0,2.05,21.8,24.12,.32,1.13,slate,p.roofs,PI/2);
  }
  for(const v of [-.76,.76]) f.put('box',0,4.21,z+v,11.1,.42,.38,beam);
  f.put('hipRoof',0,4.44,z,12.92,1.91,4.8,slate,p.roofs);
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
  for(let i=0;i<8;i++)for(let j=0;j<3;j++)
    f.put('box',u-.79+i*.089,y+.642,z-.18+j*.075,.018,.004,.048-.008*((i+j)%3),'#695f4a',p.fine);
}
function hearingRoom(p,f) {
  const image=new T.TextureLoader().load(new URL('./assets/world/hearing-scroll.webp',import.meta.url).href);
  image.colorSpace=T.SRGBColorSpace;image.anisotropy=4;
  const mural=new T.MeshLambertMaterial({map:image});
  // The dais candles warm the painted wall even from the opposite doorway,
  // where the two mobile point lights are attending the petitioners.
  mural.onBeforeCompile=shader=>{
    shader.uniforms.lampNight=p.lamps.uniforms.night;shader.uniforms.lampTime=p.lamps.uniforms.clock;
    shader.fragmentShader='uniform float lampNight,lampTime;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      vec2 metres=(vMapUv-.5)*vec2(16.50,5.50);
      float left=length(metres-vec2(-4.36,-1.21));
      float right=length(metres-vec2(4.36,-1.21));
      float pools=(.96+.04*sin(lampTime*4.8))/(1.+left*left*.37)+
                  (.97+.03*sin(lampTime*5.2+.9))/(1.+right*right*.37);
      totalEmissiveRadiance+=diffuseColor.rgb*vec3(.99,.51,.19)*pools*(.06+.60*lampNight);`);
  };
  f.put('box',0,4.35,-8.22,37.9,6.60,.29,'#d5cbb1',p.solid);
  // The painting hangs inside the timber frame. Its complete 3:1 image
  // reads from the approach, without posts, applied mullions or panel seams.
  f.put('box',0,4.32,-7.94,16.88,5.78,.18,beam);
  f.put('box',0,4.32,-7.809,16.69,5.59,.057,'#b79a68',p.lacquer);
  f.put('plane',0,4.32,-7.767,16.50,5.50,1,'#fff',mural);
  for(const side of [-1,1]){
    f.put('box',side*18.9,4.20,0,.30,6.30,16.42,'#e0d3b8',p.solid);
    for(let k=0;k<3;k++){
      const v=-5.42+k*5.37;
      for(const y of [1.64,2.13,4.94,5.73])
        f.put('box',side*18.69,y,v,.16,.11,5.32,cedar);
      for(let j=-4;j<=4;j++)
        f.put('box',side*18.69,3.53,v+j*.526,.13,2.77,.062,'#806b4d');
    }
    f.put('box',side*14.82,3.01,-7.91,6.30,3.33,.12,'#ac9c78',p.deck);
    for(let i=0;i<12;i++) {
      const u=side*(12.14+i*.474);
      f.put('box',u,3.16,-7.82,.07,3.03,.07,beam);
    }
    // Bundles of case rolls in slotted record racks at each end of the room.
    for(let j=0;j<3;j++) {
      const y=1.67+j*.63;
      f.put('box',side*16.0,y,-7.07,3.76,.10,.84,beam);
      for(let k=0;k<6;k++){
        const u=side*(14.59+k*.51);
        f.put('round',u,y+.19,-7.06,.145,.73,.145,k%3?'#cfc09e':'#b9a880',p.solid,0,PI/2);
        f.put('round',u,y+.19,-7.01,.149,.07,.149,'#76664d',p.lacquer,0,PI/2);
      }
    }
    for(const x of [-1.92,1.92])f.put('box',side*16.0+x,2.26,-7.05,.12,2.4,.89,cedar);
  }
  f.put('box',0,1.20,-4.29,10.4,.30,4.85,cedar,p.deck);
  for(let i=-3;i<=3;i++){
    f.put('box',i*1.46,1.36,-4.29,1.44,.03,4.69,'#b9b68d',p.thatch);
    f.put('box',i*1.46-.69,1.38,-4.29,.074,.025,4.69,'#5c6356',p.deck);
  }
  f.put('box',0,1.45,-5.4,1.50,.15,1.11,'#817371',p.solid);
  inkDesk(p,f,0,-2.79,1.35,3.48);
  for(const side of [-1,1])inkDesk(p,f,side*14.9,2.70,1.05,3.45);
}

// A suspended bronze bell marks the hour of a hearing. Its thickened lip,
// dragon loops, studs and striking boss are cast in one continuous silhouette.
function dressInstruments(p,f) {
  const bell=sculpture();
  const profile=[[.006,.08],[.34,.08],[.418,.13],[.43,.17],[.39,.22],[.363,.78],
    [.323,.94],[.24,1.02],[.066,1.06],[.007,1.059]];
  bell.add(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),36),'#736f58');
  for(const y of [.18,.22,.65,.84]){
    const r=y<.24?.40:y<.80?.365:.35;
    bell.add(new T.TorusGeometry(r,.011,5,38),'#9b9066',0,y,0,1,1,1,PI/2);
  }
  for(let row=0;row<3;row++)for(let i=0;i<24;i++){
    const a=(i+.47*(row%2))*PI/12,r=.349-.014*row;
    bell.ball('#958969',r*Math.sin(a),.70+row*.066,r*Math.cos(a),.023,.023,.023);
  }
  for(const side of [-1,1])bell.stroke('#7e765a',
    [[side*.03,1.04,0],[side*.13,1.12,0],[side*.092,1.21,0],[0,1.17,0]],
    [.029,.039,.026,.022],12);
  bell.ball('#a2946d',0,.37,.365,.079,.074,.017);
  p.shapes.courtBell=bell.finish();
  const u=-16,v=21.8;
  for(const end of [-1,1]){
    f.put('rock',u+end, .09,v,.41,.20,.40,'#999b87',p.stone);
    f.put('box',u+end,1.71,v,.20,3.29,.26,beam,p.wood);
    f.bar([u+end,2.41,v],[u+end*.45,3.07,v],.063,cedar,p.wood,true);
  }
  f.put('box',u,3.12,v,2.46,.22,.27,cedar,p.wood);
  f.bar([u,3.02,v],[u,2.52,v],.029,ink);
  f.put('courtBell',u,1.19,v,1.12,1.12,1.12,'#fff',p.stems);
  for(const dx of [-.32,.32])f.bar([u+dx,3.04,v+.14],[u+dx,1.63,v+.64],.019,'#948363');
  f.bar([u-.59,1.59,v+.65],[u+.56,1.59,v+.65],.076,'#745b40',p.wood);

  const shade=inscriptionMaterial('案文',{ground:'#b6a17a',ink:'#514937'});
  for(const side of [-1,1]){
    // Rolled blinds shade the archive aisles. The interval between their
    // inner brackets leaves a full view of the scroll from a side seat.
    const x=side*15.1;
    for(let j=0;j<14;j++)
      f.put('round',x,5.25+j*.077,6.82, .051,6.0,.049,j%3?'#aa9065':'#967c56',p.wood,0,0,PI/2);
    for(const dx of [-2.27,-.84,.84,2.27]){
      f.bar([x+dx,6.46,6.76],[x+dx,5.23,6.93],.022,'#5b5542');
      f.bar([x+dx,6.47,6.82],[x+dx,7.12,6.82],.018,'#645743');
    }
    f.put('round',x,6.43,6.82,.092,6.32,.092,'#876e55',p.wood,0,0,PI/2);
    const desk=side*14.9;
    for(let j=0;j<3;j++){
      const xx=desk+side*(1.82+j*.21),zz=3.08-j*.28;
      f.put('box',xx,1.39+.23*j,zz,.82,.31,.58,'#945f45',p.lacquer);
      f.put('box',xx,1.56+.23*j,zz,.85,.055,.61,'#685345',p.lacquer);
      f.put('box',xx-.17,1.41+.23*j,zz,.041,.34,.59,'#b7a17a',p.wood);
      f.put('box',xx+.17,1.41+.23*j,zz,.041,.34,.59,'#b7a17a',p.wood);
    }
    f.put('plane',side*16.0,2.37,-6.54,1.06,.33,1,'#fff',shade);
    for(const dx of [-.38,.38]){
      f.bar([side*16+dx,2.52,-6.56],[side*16+dx,2.68,-6.90],.014,beam);
    }
  }
  // A roofed bench lets petitioners await their turn on the east margin.
  for(const x of [15.1,17.5])for(const z of [19.85,23.9]){
    f.put('rock',x,.10,z,.29,.17,.29,'#a29f89',p.stone);
    f.put('round',x,1.62,z,.109,3.20,.109,cedar);
    f.bar([x,2.71,z],[x+(16.3-x)*.45,3.16,z],.045,cedar,p.wood,true);
  }
  f.put('hipRoof',16.3,3.12,21.88,6.3,1.17,3.74,slate,p.roofs,PI/2);
  f.put('box',16.87,.62,21.88,.78,.12,3.84,'#9a805b',p.deck);
  for(const z of [20.27,23.45])f.put('box',16.87,.33,z,.67,.56,.19,beam);
}

// Individual planed boards run through the audience hall. Each samples its own
// strip of real cedar; the narrow bevel catches the grazing light at each joint.
function floorboards(p,f) {
  const xyz=[],uv=[],colors=[],ix=[],rng=seeded(14231),rows=35;
  const dark=new T.Color('#594c3d');
  function corner(x,z,y,u,v,c){xyz.push(x,y,z);uv.push(u,v);colors.push(c.r,c.g,c.b);}
  for(let i=0;i<rows;i++){
    const z0=-10+i*20/rows,z1=z0+20/rows;
    let end=-20.5;
    for(let j=0;end<20.499;j++){
      const x0=end,x1=Math.min(20.5,x0+(j?4.25+rng()*2.7:1.31+(i%4)*1.13));
      const k=xyz.length/3,u0=rng(),v0=rng(),w=(x1-x0)/6;
      const color=new T.Color().setHSL(.095+.011*rng(),.16+.067*rng(),.58+.066*rng(),T.SRGBColorSpace);
      const corners=[[x0,z0,u0,v0],[x0,z1,u0,v0+.112],[x1,z1,u0+w,v0+.112],[x1,z0,u0+w,v0]];
      for(const [x,z,u,v] of corners)corner(x,z,0,u,v,dark);
      for(const [x,z,u,v] of corners)corner(x===x0?x+.008:x-.008,z===z0?z+.007:z-.007,.013,u,v,color);
      ix.push(k+4,k+5,k+6,k+4,k+6,k+7);
      for(let e=0;e<4;e++){const n=(e+1)%4;ix.push(k+e,k+n,k+4+n,k+e,k+4+n,k+4+e);}
      end=x1;
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();
  p.shapes.courtBoards=g;
  const wood=p.deck.clone();wood.onBeforeCompile=p.deck.onBeforeCompile;wood.vertexColors=true;
  f.put('courtBoards',0,1.037,0,1,1,1,'#fff',wood);
}

export function dressCourt(p,scene) {
  const f=workshopFrame(p,COURT,terrainHeight(COURT.x,COURT.z));
  coveredGable(p);
  f.put('box',0,.36,0,41,.80,20,'#a9a99b',p.masonry);
  f.put('box',0,.88,0,41,.30,20,floor,p.deck);
  floorboards(p,f);
  for(const step of COURT_STEPS) f.put('box',0,step.top/2,step.z,9.4,step.top,.68,'#aca99a',p.stone);
  // White sand is raked in the open court with a flagstone walk through it.
  f.put('box',0,.070,22.0,37.8,.06,23.42,'#fff8e6',whiteSand());
  for(let i=0;i<13;i++) for(let j=-1;j<=1;j++){
    const z=13.7+i*1.58;
    f.put('rock',j*1.10+.055*Math.sin(i),.114,z,.71,.085,.94,i%3?'#adad9d':'#b8b8a7',p.stone,.16*Math.sin(3*i+j));
  }
  for(const side of [-1,1])for(const v of [13.2,28.5])courtLantern(p,f,side*14.3,v);
  for(const u of COURT_COLUMNS) for(const v of [-8.05,8.05]) {
    f.put('round',u,1.16,v,.45,.22,.45,'#929583',p.stone);
    f.put('round',u,4.36,v,.33,6.49,.33,cedar);
    for(let j=0;j<3;j++) {
      f.put('box',u,7.03+j*.245,v,.72+j*.43,.26,.81+j*.18,j%2?beam:cedar);
      for(const side of [-1,1])
        f.put('box',u+side*(.23+j*.22),7.18+j*.245,v,.32,.20,.69,cedar);
    }
  }
  for(const v of [-8.05,8.05])for(const y of [7.11,7.81])
    f.put('box',0,y,v,39.6,.43,.52,beam);
  for(const u of COURT_COLUMNS)f.put('box',u,7.82,0,.31,.38,22.3,cedar);
  // Paired raking struts sit above the deep audience beams. The crown posts
  // end on these ties and leave the entire floor and painted wall open.
  for(const v of [-7.96,.24,7.96]){
    const rise=v===.24?3.25:.57;
    f.put('box',0,8.12,v,22.3,.49,.45,beam,p.wood);
    f.put('box',0,8.38+rise/2,v,.32,rise,.37,cedar,p.wood);
    for(const side of [-1,1]){
      f.bar([side*10.95,8.29,v],[side*.18,8.39+rise,v],.154,cedar,p.wood,true);
      f.bar([side*5.40,8.32,v],[side*5.40,8.40+rise*.50,v],.082,cedar,p.wood,true);
      for(const dx of [.03,.21])f.put('ball',side*(10.83-dx),8.18,v+.239,.031,.032,.016,ink,p.bronze);
    }
  }
  for(const v of [-1,1])for(let j=-36;j<=36;j++)
    f.bar([j*.60,7.73,v*8.52],[j*.60,7.96,v*12.02],.075,'#ab8f6a',p.wood,true);
  f.put('hipRoof',0,8.02,0,46,5.62,25.08,slate,p.roofs);
  f.put('box',0,13.65,0,21.1,.27,.45,'#5d655f',p.roofs);
  vergeTiles(p,f);
  for(const side of [-1,1]) {
    // A bronze cap and a row of onion-finial balusters flank the broad steps.
    for(let i=0;i<8;i++){
      const x=side*(5.62+i*1.87);
      f.put('box',x,1.71,9.45,.16,1.30,.16,beam);
      f.put('finial',x,2.35,9.45,.145,.21,.145,brass,p.bronze);
    }
    for(const y of [1.55,2.05])f.put('box',side*12.16,y,9.45,13.2,.105,.11,cedar,p.lacquer);
    f.put('courtBarge',side*10.35,13.68,-.21,.71,.81,.42,slate,p.roofs);
  }
  const sign=inscriptionMaterial('評定之間');
  f.put('box',0,7.45,8.32,4.58,.99,.24,brass,p.wood);
  f.put('plane',0,7.45,8.453,4.31,.85,1,'#fff',sign);
  hearingRoom(p,f);
  for(const [u,v,y,scale] of COURT_CANDLES){
    const q=f.at(u,y,v);p.lamps.candle(q.x,q.y,q.z,scale);
  }
  gate(p,f);
  dressInstruments(p,f);
  return dressCourtWatch(scene,p,f);
}
