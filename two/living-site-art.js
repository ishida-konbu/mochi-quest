import * as THREE from './vendor/three.module.min.js';
import { MORTAR_PROFILE } from './festival.js';
import { HERB_PATCH, RICE_BASKET, RICE_SHOP, WORKTOPS } from './living-layout.js';
import { seeded, terrainContactHeight } from './terrain.js';

function turned(profile,segments) {
  return new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
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

function worktop(p,art,f,t) {
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
  f.part('livingMortar',-.68,.76,0,.72,.72,.72,'#c49a6c',0,0,0,p.wood);
  // The yokogine rests on both lips, with the head clear of the visitor's side.
  f.line([-.68,1.327,-.30],[-.68,1.327,.39],.025,'#be975d',p.wood);
  f.line([-.83,1.343,-.28],[-.51,1.343,-.28],.071,'#a88254',p.wood);
  f.part('box',.49,.778,.02,.61,.036,.59,'#967e63',0,0,0,p.stone);
  f.part('stoveBody',.50,.80,.02,.61,.39,.61,'#a38370',0,0,0,p.stone);
  // A blackened mouth and charcoal at the opening under the steamer.
  f.part('plane',.50,.885,.251,.18,.085,1,'#42372e',0,0,0,p.fine);
  for(let i=0;i<3;i++) f.part('rock',.46+i*.044,.856,.247,.028,.016,.025,i%2?'#a75f40':'#5a4b41',0,0,0,p.stone,false);
  f.part('riceSteamer',.50,.987,.02,.61,.38,.61,'#bcaa83',0,0,0,p.wood);
  for(const h of [1.031,1.119]) f.part('steamerHoop',.50,h,.02,1,1,1,'#947958',0,0,0,p.wood);
  // Two small bark stitches secure the overlap in the bent-wood band.
  for (const y of [1.057,1.086]) f.line([.54,y,.274],[.558,y+.004,.271],.0035,'#685239',p.fine);
  f.part('round',.50,1.166,.02,.272,.031,.272,'#ac956d',0,0,0,p.deck);
  f.line([.42,1.194,.02],[.58,1.194,.02],.024,'#887149',p.wood);
  f.part('handWaterPot',1.02,.760,.14,1,1,1,'#977d68',0,0,0,p.stone);
  f.part('round',1.02,.874,.14,.150,.003,.150,'#869c92',0,0,0,p.fine,false);
  f.part('box',.13,.543,.477,.39,.31,.046,'#836b51',0,0,0,p.wood);
  f.part('plane',.13,.544,.502,.35,.295,1,'#fff',0,0,0,art.sign('餅'));
}

export function dressLivingSites(p,art,fixture) {
  p.shapes.livingMortar=turned(MORTAR_PROFILE,48);
  p.shapes.riceSteamer=turned([[.35,0],[.41,.02],[.42,.07],[.42,.44],[.40,.46],[.37,.44],[.36,.06]],40);
  // Matching radial subdivision keeps the two thin bands clear of the rim
  // all the way around; a faceted disk sinks behind a turned wall.
  p.shapes.steamerHoop=turned([[.254,-.007],[.261,-.008],[.264,-.004],[.264,.004],[.261,.008],[.254,.007]],40);
  p.shapes.stoveBody=turned([[.27,0],[.37,.02],[.38,.35],[.35,.45],[.41,.48],[.41,.51],[.32,.51],[.31,.10]],32);
  p.shapes.handWaterPot=turned([[.080,0],[.093,.003],[.094,.012],[.120,.026],[.153,.065],
    [.167,.106],[.167,.125],[.172,.130],[.172,.136],[.166,.140],[.158,.136],[.156,.125],
    [.147,.090],[.123,.047],[.093,.024],[0,.024]],40);
  p.shapes.yomogiBlade=mugwortBlade();
  for (const t of Object.values(WORKTOPS)) {
    const f=fixture(p,t.x,t.z,t.yaw,terrainContactHeight(t.x,t.z));
    worktop(p,art,f,t);
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
