import * as THREE from './vendor/three.module.min.js';
import { makeLid, makeLidRest, makeMallet } from './cooking-prop-models.js';
import { LID_REST } from './cooking-motion.js';
import { MORTAR_PROFILE } from './festival.js';
import { benchFrame, COOKING_BENCH, COOKING_MAT, HAND_WATER, groundCookware, HERB_PATCH, MARKET_GRILL_TOP, MARKET_GRILL_X, MARKET_GRILL_Z, RICE_BASKET, RICE_SHOP, WORKTOPS, marketCooktop } from './living-layout.js';
import { MARKET_STALLS, seeded, terrainContactHeight } from './terrain.js';

function turned(profile,segments) {
  return new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
}

// The lower edge of this thick ceramic shell rises into an open firebox.
// Both the inner and outer walls follow the arch, including its underside.
function clayStove() {
  const profile=[
    [.184,.002],[.197,0],[.208,.010],[.222,.067],[.224,.108],
    [.218,.125],[.222,.130],[.219,.137],[.197,.141],
    [.180,.138],[.177,.130],[.182,.105],[.183,.057],[.175,.012],[.178,.003],[.184,.002],
  ];
  const mesh=turned(profile,96), vertices=mesh.attributes.position;
  for(let i=0;i<vertices.count;i++) {
    const angle=Math.atan2(vertices.getX(i),vertices.getZ(i));
    const arc=angle/.57;
    if(Math.abs(arc)>=1)continue;
    const y=vertices.getY(i), arch=.102*Math.sqrt(1-arc*arc);
    vertices.setY(i,y+arch*Math.max(0,1-y/.141));
  }
  mesh.computeVertexNormals();
  return mesh;
}

function steamerFirebox(f,p,[x,y,z]) {
  f.part('box',x,y+.018,z,.61,.036,.59,'#967e63',0,0,0,p.stone);
  f.part('stoveBody',x,y+.038,z,1,1,1,'#a88a72',Math.PI-.10,0,0,p.stone);
  f.part('round',x,y+.046,z,.186,.010,.186,'#615953',0,0,0,p.stone);
  f.part('waterKettle',x,y+.154,z,1,1,1,'#777974',0,0,0,p.fine);
  for(const side of [-1,1])
    f.part('kettleLug',x+side*.232,y+.218,z,1,1,1,'#696c67',0,0,side*-.32,p.fine);
  for(const [u,v] of [[-.038,-.16],[.06,-.162],[.003,-.18]])
    f.part('rock',x+u,y+.06,z+v,.033,.009,.027,'#ba6743',.45,0,0,p.fine,false);
  for(const [i,[u,v,size]] of [[-.061,-.126,.036],[.033,-.112,.047],
    [.087,-.157,.034],[-.025,-.165,.043],[.019,-.195,.031]].entries()) {
    const cx=x+u, cz=z+v, cy=y+.072;
    f.part('rock',cx,cy,cz,size,size*.55,size*.71,i%2?'#423c36':'#59504a',i*.92,0,0,p.stone,false);
    f.line([cx-size*.49,cy+.006,cz-size*.45],[cx+size*.16,cy+.012,cz-size*.53],.0038,
      i%2?'#ce7045':'#a55436',p.fine,false,false);
  }
}

// Toothed blades have a light felted underside, a pronounced midrib and
// pointed, paired side lobes. Twist successive blades around each stem.
function mugwortBlade() {
  const widths=[.012,.025,.029,.10,.026,.148,.045,.172,.075,.14,.057,.084,.036,0];
  const pos=[], colors=[], indices=[];
  widths.forEach((width,i)=>{
    const v=i/(widths.length-1);
    for (const side of [-1,0,1]) {
      const base=.05*Math.sin(Math.PI*v);
      pos.push(side*width,v,base+(side===0?.036:0)+.10*v*v);
      const col=new THREE.Color(side===0?'#d3cf96':side<0?'#81956c':'#a4b28a');
      colors.push(col.r,col.g,col.b);
    }
    if (i) {
      const a=(i-1)*3;
      for (let k=0;k<2;k++) indices.push(a+k,a+k+1,a+k+3,a+k+1,a+k+4,a+k+3);
    }
  });
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function grainPile(f,x,y,z,radius,tint,p,beans=false) {
  // The continuous bed shows tiny individual grains at the silhouette.
  f.part('ball',x,y,z,radius,.06,radius,tint,0,0,0,p.solid,false);
  const rng=seeded(beans?422:370);
  for(let i=0;i<38;i++) {
    const a=i*2.4, r=radius*.92*Math.sqrt((i+.4)/38);
    const h=.052*Math.sqrt(1-(r/radius)**2);
    f.part('ball',x+r*Math.cos(a),y+h,z+r*Math.sin(a),beans?.026:.026,beans?.022:.008,beans?.025:.012,
      beans?(i%4?'#be9662':'#d7b67b'):(i%4?'#ebe0ba':'#fff2cf'),rng()*6,0,0,p.fine,false);
  }
}

export function shareBeans(f,art,p) {
  f.part('basket',-.91,.947,.47,.59,.24,.59,'#f0d5a2',0,0,0,art.wicker);
  grainPile(f,-.91,1.056,.47,.231,'#b79660',p,true);
}

// A masonry plinth carries the dango seller's finishing grill beside the wooden counter.
export function dressCharcoalGrill(f,p) {
  const x=MARKET_GRILL_X,z=MARKET_GRILL_Z,top=MARKET_GRILL_TOP;
  // The stone foot stands clear of the end grain. Two courses and a stone
  // cap carry the iron grate directly over the coals.
  f.part('box',x,(top-.179)/2,z,.35,top-.179,.54,'#91816c',0,0,0,p.stone);
  for(const h of [.16,.33])f.part('box',x,h,z,.356,.012,.546,'#796d5b',0,0,0,p.stone);
  f.part('box',x,top-.177,z,.37,.026,.57,'#948776',0,0,0,p.stone);
  f.part('box',x,top-.138,z,.31,.052,.50,'#7a6452',0,0,0,p.stone);
  for (const u of [-.146,.146])
    f.part('box',x+u,top-.083,z,.040,.13,.51,'#a28468',0,0,0,p.stone);
  for (const v of [-.24,.24])
    f.part('box',x,top-.083,z+v,.265,.13,.038,'#957c66',0,0,0,p.stone);
  for (let j=0;j<5;j++) {
    const v=z+(j-2)*.083;
    f.part('rock',x,top-.093,v,.088,.032,.042,j%2?'#514335':'#6e4a38',j*.32,0,0,p.stone);
    f.line([x-.155,top-.008,v],[x+.155,top-.008,v],.008,'#565048',p.fine);
  }
  for (const u of [-.14,.14]) f.line([x+u,top-.015,z-.21],[x+u,top-.015,z+.21],.008,'#58544a',p.fine);
}

function worktop(p,f) {
  const {left,right,front,back,top}=COOKING_BENCH;
  const x=(left+right)/2,z=(front+back)/2;
  const legs=[left+.20,right-.20],ends=[back+.12,front-.12];
  // One wide slab spans both the portion board and the serving dish. Its
  // grain and apron run uninterrupted above four straight pegged legs.
  f.part('box',x,top-.032,z,right-left,.064,front-back,'#ba9f75',0,0,0,p.deck);
  for(const u of legs)for(const v of ends){
    f.part('box',u,(top-.064)/2,v,.108,top-.064,.108,'#9c7c55',0,0,0,p.wood);
    f.part('ball',u,top-.101,v+Math.sign(v)*.054,.016,.016,.009,'#68553c',0,0,0,p.wood);
  }
  for(const v of ends)f.part('box',x,top-.108,v,right-left-.44,.088,.063,'#a3845e',0,0,0,p.wood);
  for(const u of legs)f.part('box',u,top-.108,z,.063,.088,front-back-.24,'#a3845e',0,0,0,p.wood);
}

// A warp thread crosses tight rows of golden reeds. The two indigo borders
// are bound into the weave. One texture covers the entire ground cloth.
function rushMaterial() {
  // Keep reed rows and binding threads at their original spacing in metres.
  const width=COOKING_MAT.right-COOKING_MAT.left,depth=COOKING_MAT.front-COOKING_MAT.back;
  const w=9*Math.ceil(width/.078),h=4*Math.ceil(depth/.0205);
  const data=new Uint8Array(w*h*4),rand=seeded(1709);
  for(let v=0;v<h;v++)for(let u=0;u<w;u++){
    const edge=Math.min(u,w-1-u), binding=edge<6 || edge>=9 && edge<12;
    const thread=u%9<2 && (Math.floor(v/4)+Math.floor(u/9))%2===0;
    const shade=[-18,6,15,3][v%4]+(thread?-21:0)+7*(rand()-.5)+5*Math.sin(u*.05+Math.floor(v/4));
    const rgb=binding ? [76,89,72] : [195,170,111], i=(v*w+u)*4;
    for(let k=0;k<3;k++)data[i+k]=rgb[k]+shade;
    data[i+3]=255;
  }
  const map=new THREE.DataTexture(data,w,h);
  map.colorSpace=THREE.SRGBColorSpace;
  map.generateMipmaps=true;
  map.minFilter=THREE.LinearMipmapLinearFilter;
  map.magFilter=THREE.LinearFilter;
  map.anisotropy=4;
  map.needsUpdate=true;
  return new THREE.MeshStandardMaterial({map,roughness:1});
}

function layRushMat(p,f,site,stations,material) {
  const {left,right,back,front}=COOKING_MAT, nx=16,nz=16, pos=[],uv=[],tri=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/nz, x=left+(right-left)*u, z=back+(front-back)*v;
    pos.push(x,stations.matHeight(x,z),z);
    uv.push(u,v);
    if(i<nx && j<nz){
      const a=j*(nx+1)+i,b=a+nx+1;
      tri.push(a,b,a+1,a+1,b,b+1);
    }
  }
  const g=new THREE.BufferGeometry(),shape='wovenMat-'+site;
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(tri);
  g.computeVertexNormals();
  p.shapes[shape]=g;
  f.part(shape,0,0,0,1,1,1,'#ffffff',0,0,0,material,false);
  const fringeCount=Math.round((front-back)/.041);
  for(const x of [left,right])for(let j=0;j<fringeCount;j++){
    const z=back+(front-back)*(j+.5)/fringeCount, end=x+(x===left?-1:1)*(.042+.014*Math.sin(7*j));
    f.line([x,stations.matHeight(x,z)-.002,z],[end,stations.matHeight(end,z)-.01,z+.007],
      .007,j%3?'#c7b280':'#baa270',p.fine,false,false);
  }
}

// Where a floor slopes, stone packing meets the woven surface along the
// perimeter and presents a level top directly under the heavy appliance.
function foundation(p,f,shape,foot,[x,y,z],matHeight,lip,tint) {
  const pos=[],uv=[],tri=[];
  for(let i=0;i<foot.length;i++){
    const [u,v]=foot[i],[un,vn]=foot[(i+1)%foot.length];
    const bottom=matHeight(x+u,z+v)-.005, nextBottom=matHeight(x+un,z+vn)-.005;
    const a=pos.length/3;
    pos.push(u,bottom-y,v,un,nextBottom-y,vn,un,lip,vn,u,lip,v,0,lip,0);
    uv.push(0,0,1,0,1,1,0,1,.5,.5);
    tri.push(a,a+1,a+2,a,a+2,a+3,a+3,a+2,a+4);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(tri);
  g.computeVertexNormals();
  p.shapes[shape]=g;
  f.part(shape,x,y,z,1,1,1,tint,0,0,0,p.stone);
}

// Each upright meets the local woven surface, while its joint at the top
// holds the tool horizontal on both the flat riverbank and the market slope.
function groundWorkTools(p,f,site,stations,parkedWood) {
  const {matHeight,malletRack,malletYaw,bowlRest,mortar,stove}=stations;
  const [mx,my,mz]=mortar;
  foundation(p,f,'mortarSole-'+site,stations.mortarFoot,mortar,matHeight,.012,'#93826c');
  foundation(p,f,'stoveSole-'+site,stations.stoveFoot,stove,matHeight,.001,'#897760');
  f.part('livingMortar',mx,my,mz,.72,.72,.72,'#c49a6c',0,0,0,p.wood);
  const [rx,ry,rz]=malletRack, co=Math.cos(malletYaw),si=Math.sin(malletYaw);
  const at=(u,h,v)=>[rx+u*co+v*si,ry+h,rz-u*si+v*co];
  for(const [v,h] of [[0,-.071],[.39,-.038]]){
    const [x,y,z]=at(0,h,v),bottom=matHeight(x,z);
    f.part('box',x,bottom+.021,z,.20,.042,.13,'#987652',malletYaw,0,0,p.wood);
    f.part('box',x,(bottom+y)/2,z,.075,y-bottom,.073,'#ab8960',malletYaw,0,0,p.wood);
    f.part('box',x,y-.017,z,.14,.034,.07,'#be9b6a',malletYaw,0,0,p.wood);
    for(const side of [-1,1])
      f.line(at(.037*side,h-.020,v),at(.062*side,h+.025,v),.009,'#987450',p.wood);
  }
  f.part('parkedMallet',rx,ry,rz,1,1,1,'#ffffff',malletYaw,0,0,parkedWood);
  const [bx,by,bz]=bowlRest;
  const base=matHeight(bx,bz),store=by-base;
  // The rice bowl rests on the fitted lid of its bentwood rice tub.
  f.part('round',bx,base+store/2,bz,.169,store,.169,'#af8f61',0,0,0,p.wood);
  for(const h of [.071,store-.086])
    f.part('round',bx,base+h,bz,.173,.014,.173,'#877452',0,0,0,p.wood);
  f.part('round',bx,by-.013,bz,.185,.026,.185,'#c5aa7b',0,0,0,p.deck);
  const [x,y,z]=stove;
  steamerFirebox(f,p,stove);
  f.part('riceSteamer',x,y+.227,z,.61,.38,.61,'#bcaa83',0,0,0,p.wood);
  for(const h of [.271,.359]) f.part('steamerHoop',x,y+h,z,1,1,1,'#947958',0,0,0,p.wood);
  for(const h of [.297,.326]) f.line([x+.04,y+h,z+.254],[x+.058,y+h+.004,z+.251],.0035,'#685239',p.fine);
  f.part('parkedLid',x,y+.416,z,1,1,1,'#ffffff',0,0,0,parkedWood);
  f.part('parkedLidRest',x+LID_REST[0],y,z+LID_REST[1],1,1,1,'#ffffff',0,0,0,parkedWood);
}

function cookware(p,art,f,bench,siteId,stations,matMaterial,toolMaterial) {
  const parkedWood=toolMaterial.clone();
  parkedWood.onBeforeCompile=toolMaterial.onBeforeCompile;
  parkedWood.customProgramCacheKey=toolMaterial.customProgramCacheKey;
  parkedWood.userData.cookingTools=siteId;
  layRushMat(p,f,siteId,stations,matMaterial);
  groundWorkTools(p,f,siteId,stations,parkedWood);
  worktop(p,bench);
  const {top,front}=COOKING_BENCH;
  const [x,y,z]=HAND_WATER;
  bench.part('handWaterPot',x,y,z,1,1,1,'#977d68',0,0,0,p.stone);
  bench.part('round',x,y+.134,z,.157,.002,.157,'#869c92',0,0,0,p.fine,false);
  if(siteId==='market-mortar')return;
  bench.part('box',.13,top-.17,front-.091,.28,.21,.027,'#836b51',0,0,0,p.wood);
  bench.part('plane',.13,top-.17,front-.076,.25,.18,1,'#fff',0,0,0,art.sign('餅'));
}

export function dressLivingSites(p,art,fixture) {
  p.shapes.livingMortar=turned(MORTAR_PROFILE,48);
  p.shapes.riceSteamer=turned([[.35,0],[.41,.02],[.42,.07],[.42,.44],[.40,.46],[.37,.44],[.36,.06]],40);
  // Matching radial subdivision keeps the two thin bands clear of the rim
  // all the way around; a faceted disk sinks behind a turned wall.
  p.shapes.steamerHoop=turned([[.254,-.007],[.261,-.008],[.264,-.004],[.264,.004],[.261,.008],[.254,.007]],40);
  const lid=makeLid();
  p.shapes.parkedLid=lid.geometry;
  p.shapes.parkedLidRest=makeLidRest().geometry;
  p.shapes.parkedMallet=makeMallet().geometry;
  p.shapes.stoveBody=clayStove();
  p.shapes.kettleLug=new THREE.TorusGeometry(.022,.006,8,24);
  p.shapes.waterKettle=turned([[0,-.046],[.09,-.041],[.152,-.025],[.182,.001],
    [.197,.026],[.204,.032],[.244,.034],[.249,.037],[.246,.041],[.208,.042],
    [.200,.048],[.202,.065],[.214,.068],[.215,.073],[.198,.074],[.192,.067],
    [.187,.041],[.167,.009],[.139,-.013],[.082,-.031],[0,-.034]],56);
  p.shapes.handWaterPot=turned([[.080,0],[.093,.003],[.094,.012],[.120,.026],[.153,.065],
    [.167,.106],[.167,.125],[.172,.130],[.172,.136],[.166,.140],[.158,.136],[.156,.125],
    [.147,.090],[.123,.047],[.093,.024],[0,.024]],40);
  p.shapes.yomogiBlade=mugwortBlade();
  const matMaterial=rushMaterial();
  const kitchens={...WORKTOPS,'market-mortar':marketCooktop(MARKET_STALLS[4])};
  for(const [siteId,kitchen] of Object.entries(kitchens)){
    const y=terrainContactHeight(kitchen.x,kitchen.z)+COOKING_MAT.thickness;
    const stations=groundCookware(kitchen,y,terrainContactHeight);
    const table=benchFrame(kitchen);
    const mat=fixture(p,kitchen.x,kitchen.z,kitchen.yaw,y),bench=fixture(p,table.x,table.z,table.yaw,y);
    cookware(p,art,mat,bench,siteId,stations,matMaterial,lid.material);
    if(siteId==='market-mortar')dressCharcoalGrill(bench,p);
  }
  for(const [pos,scale,sign] of [[RICE_BASKET,.80,'分米'],[RICE_SHOP,.95,'米']]) {
    const f=fixture(p,pos.x,pos.z,0,terrainContactHeight(pos.x,pos.z));
    f.part('basket',0,-.014,0,scale,.65,scale,'#ead0a0',0,0,0,art.wicker);
    grainPile(f,0,.323,0,scale*.435,'#dfd4ad',p);
    // Masu with a hollow rim and visible measure, resting in the rice.
    f.part('box',.14,.363,-.06,.164,.017,.147,'#ccae80',0,0,0,p.wood);
    for(const u of [.066,.214]) f.part('box',u,.396,-.06,.014,.069,.15,'#b49a72',0,0,0,p.wood);
    for(const v of [-.129,.009]) f.part('box',.14,.396,v,.145,.069,.014,'#c1a378',0,0,0,p.wood);
    f.part('plane',0,.198,scale*.448,.18,.20,1,'#fff',0,-.10,0,art.sign(sign));
  }
  const rng=seeded(272);
  for(let i=0;i<23;i++) {
    const rad=Math.sqrt(rng())*.84, phi=i*2.40;
    const x=HERB_PATCH.x+rad*Math.cos(phi),z=HERB_PATCH.z+rad*Math.sin(phi);
    const f=fixture(p,x,z,0,terrainContactHeight(x,z));
    const h=.17+.22*rng(), lean=(rng()-.5)*.15;
    f.line([0,-.015,0],[lean,h,0],.006,'#818557',p.fine,false,false);
    for(let j=0;j<8;j++){
      const row=(j+.3)/8, l=(.22-.09*row)*(.75+.35*rng());
      f.part('yomogiBlade',lean*row,h*row,0,l*1.74,l,l,'#f6f5d7',phi+j*2.399,.99-.54*row,0,p.stems,false);
    }
  }
}
