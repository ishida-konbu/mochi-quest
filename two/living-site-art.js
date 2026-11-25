import * as THREE from './vendor/three.module.min.js';
import { MORTAR_PROFILE } from './festival.js';
import { cooksPlatform, HERB_PATCH, MALLET_HANDLE_END, MALLET_RACK, RICE_BASKET, RICE_SHOP, WORKTOPS, marketCooktop } from './living-layout.js';
import { MARKET_STALLS, seeded, terrainContactHeight, terrainHeight } from './terrain.js';

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

function steamerFirebox(f,p) {
  // Ceramic on an insulating stone slab. The iron rice pot hangs by its
  // flange, leaving the firebox open underneath its rounded belly.
  f.part('box',.49,.778,.02,.61,.036,.59,'#967e63',0,0,0,p.stone);
  const yaw=Math.PI-.10;
  f.part('stoveBody',.50,.798,.02,1,1,1,'#a88a72',yaw,0,0,p.stone);
  f.part('round',.50,.806,.02,.186,.010,.186,'#615953',0,0,0,p.stone);
  f.part('waterKettle',.50,.914,.02,1,1,1,'#777974',0,0,0,p.fine);
  // Pierced lugs are cast into either side and take the hooks used to lift
  // the hot pot. Their feet disappear into the flange, outside the basket.
  for(const side of [-1,1])
    f.part('kettleLug',.50+side*.232,.978,.02,1,1,1,'#696c67',0,0,side*-.32,p.fine);
  // Coals sit within the opening. Each fissure is drawn directly across its
  // parent coal, so its concentrated orange does not tint the entire stove.
  for(const [x,z] of [[-.038,-.16],[.06,-.162],[.003,-.18]]) {
    f.part('rock',.50+x,.82,.02+z,.033,.009,.027,'#ba6743',.45,0,0,p.fine,false);
  }
  for(const [i,[x,z,size]] of [[-.061,-.126,.036],[.033,-.112,.047],
    [.087,-.157,.034],[-.025,-.165,.043],[.019,-.195,.031]].entries()) {
    const cx=.50+x, cz=.02+z, cy=.832;
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

// Only the dango seller lends out a charcoal grill. Set the narrow earthen
// brazier on its tile beside the original trays, within the stall counter.
export function dressCharcoalGrill(f,p) {
  const x=1.36, z=.42;
  f.part('box',x,.953,z,.37,.026,.57,'#948776',0,0,0,p.stone);
  f.part('box',x,.992,z,.31,.052,.50,'#7a6452',0,0,0,p.stone);
  for (const u of [-.146,.146])
    f.part('box',x+u,1.047,z,.040,.13,.51,'#a28468',0,0,0,p.stone);
  for (const v of [-.24,.24])
    f.part('box',x,1.047,z+v,.265,.13,.038,'#957c66',0,0,0,p.stone);
  for (let j=0;j<5;j++) {
    const v=z+(j-2)*.083;
    f.part('rock',x,1.037,v,.088,.032,.042,j%2?'#514335':'#6e4a38',j*.32,0,0,p.stone);
    f.line([x-.155,1.122,v],[x+.155,1.122,v],.008,'#565048',p.fine);
  }
  for (const u of [-.14,.14]) f.line([x+u,1.115,z-.21],[x+u,1.115,z+.21],.008,'#58544a',p.fine);
}

function worktop(p,f,t) {
  // A pegged trestle carries the mortar, steamer and the pot for wetting hands.
  for (const u of [-1.12,1.12]) for (const v of [-.35,.35]) {
    f.post(u,v,.69,.072,'#886745',p.wood,true);
    f.part('ball',u,.60,v+Math.sign(v)*.059,.025,.024,.018,'#634930',0,0,0,p.wood);
  }
  for(const v of [-.35,.35]) f.part('box',0,.59,v,2.37,.12,.071,'#935f3d',0,0,0,p.wood);
  for(const u of [-1.12,1.12]) f.part('box',u,.30,0,.08,.082,.77,'#9d8059',0,0,0,p.wood);
  f.part('box',0,.30,0,2.31,.073,.065,'#8f714e',0,0,0,p.wood);
  for(let j=0;j<4;j++) f.part('box',.002*Math.sin(j),.70,(j-1.5)*t.depth/4,t.width,.12,t.depth/4-.004,
    j%2?'#b79b74':'#af9068',0,0,0,p.deck);
}

function cookware(p,art,f,siteId,table) {
  // Keep the parked tools in their own material batches. The animation lifts
  // real replacements from these sockets without hiding nearby shop fittings.
  const parkedWood=p.wood.clone();
  parkedWood.onBeforeCompile=p.wood.onBeforeCompile;
  parkedWood.userData.cookingTools=siteId;
  // A hinged leaf carries the serving tray clear of the mortar and hot stove.
  const edge=-table.width/2;
  for (let j=0;j<3;j++)
    f.part('box',(edge-1.90)/2,.727,-.165+j*.25,edge+1.90,.066,.248,j%2?'#b29a77':'#c1a27d',0,0,0,p.deck);
  for (const z of [-.17,.34])
    f.line([-1.15,.42,z],[-1.79,.687,z],.059,'#997b58',p.wood,true);
  f.part('livingMortar',-.68,.76,0,.72,.72,.72,'#c49a6c',0,0,0,p.wood);
  const [mx,my,mz]=MALLET_RACK;
  // Two saddles keep the cross-head and narrower grip level above the
  // counter. The cook can take the free length of the handle from below.
  f.part('box',mx,.778,mz+.14,.21,.036,.43,'#997b58',0,0,0,p.wood);
  for (const [z,top] of [[mz,my-.071],[mz+.29,my-.038]]) {
    f.part('box',mx,(.796+top)/2,z,.075,top-.796,.056,'#ab8960',0,0,0,p.wood);
    f.part('box',mx,top-.017,z,.14,.034,.07,'#be9b6a',0,0,0,p.wood);
    for(const side of [-1,1])
      f.line([mx+.037*side,top-.020,z],[mx+.062*side,top+.025,z],.009,'#987450',p.wood);
  }
  f.line([mx,my-.013,mz-.07],[mx,my-.013,mz+MALLET_HANDLE_END],.025,'#be975d',parkedWood);
  f.line([mx-.16,my,mz],[mx+.16,my,mz],.071,'#a88254',parkedWood);
  steamerFirebox(f,p);
  f.part('riceSteamer',.50,.987,.02,.61,.38,.61,'#bcaa83',0,0,0,p.wood);
  for(const h of [1.031,1.119]) f.part('steamerHoop',.50,h,.02,1,1,1,'#947958',0,0,0,p.wood);
  // Two small bark stitches secure the overlap in the bent-wood band.
  for (const y of [1.057,1.086]) f.line([.54,y,.274],[.558,y+.004,.271],.0035,'#685239',p.fine);
  f.part('round',.50,1.166,.02,.272,.031,.272,'#ac956d',0,0,0,parkedWood);
  f.line([.42,1.194,.02],[.58,1.194,.02],.024,'#887149',parkedWood);
  f.part('handWaterPot',1.02,.760,.14,1,1,1,'#977d68',0,0,0,p.stone);
  f.part('round',1.02,.874,.14,.150,.003,.150,'#869c92',0,0,0,p.fine,false);
  if (siteId === 'market-mortar') return;
  f.part('box',.13,.543,.477,.39,.31,.046,'#836b51',0,0,0,p.wood);
  f.part('plane',.13,.544,.502,.35,.295,1,'#fff',0,0,0,art.sign('餅'));
}

function dressStandingSteps(p,f,id) {
  for(const {z,depth,width,top} of cooksPlatform(id)) {
    const rows=Math.round(depth/.23);
    for(let j=0;j<rows;j++)
      f.part('box',0,top-.033,z+depth*((j+.5)/rows-.5),width,.066,depth/rows-.007,
        j%2?'#998769':'#a18d6d',0,0,0,p.deck);
    for(const x of [-1.4,0,1.4]) {
      f.part('box',x,top-.10,z,.083,.078,depth,'#8b7354',0,0,0,p.wood);
      for(const side of [-1,1]) f.post(x,z+side*depth*.33,top-.13,.047,'#816346',p.wood,true);
    }
  }
}

export function dressLivingSites(p,art,fixture) {
  p.shapes.livingMortar=turned(MORTAR_PROFILE,48);
  p.shapes.riceSteamer=turned([[.35,0],[.41,.02],[.42,.07],[.42,.44],[.40,.46],[.37,.44],[.36,.06]],40);
  // Matching radial subdivision keeps the two thin bands clear of the rim
  // all the way around; a faceted disk sinks behind a turned wall.
  p.shapes.steamerHoop=turned([[.254,-.007],[.261,-.008],[.264,-.004],[.264,.004],[.261,.008],[.254,.007]],40);
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
  for (const [siteId,t] of Object.entries(WORKTOPS)) {
    const f=fixture(p,t.x,t.z,t.yaw,terrainContactHeight(t.x,t.z));
    worktop(p,f,t);
    cookware(p,art,f,siteId,t);
    dressStandingSteps(p,f,siteId);
  }
  const stall=MARKET_STALLS[4], counter=marketCooktop(stall);
  const shop=fixture(p,counter.x,counter.z,counter.yaw,terrainHeight(stall[0],stall[1])+.18);
  cookware(p,art,shop,'market-mortar',counter);
  dressStandingSteps(p,shop,'market-mortar');
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
