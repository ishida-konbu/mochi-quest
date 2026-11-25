// Dimensions in metres, measured in the same local frame as the placement
// survey. +Z is the entrance. Timber UVs follow each beam even on the roof.
import * as T from './vendor/three.module.min.js';
import { TREE_FAMILIES } from './forest-forms.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';

const tau = 2*Math.PI;
const wood = '#e4d1ab', pale = '#f3e1bd', grey = '#c6c0b0', dark = '#a99a82';
const iron = '#a19c91', straw = '#bca373', flax = '#ded3ad', indigo = '#647778';
function plank(b,x,y,z,w,h,d,tint=wood,grain='x',bevel=.004) {
  b.box('wood',tint,[x,y,z],[w,h,d],{grain,bevel,seed:x+3*y+7*z});
}
function beam(b,a,c,w,d,tint=wood) {
  b.beam('wood',tint,a,c,w,d,{bevel:.004,seed:c[0]+3*c[2]});
}
// A round spar has its longitudinal grain in the length direction. Rope uses
// the same profile with a soft yarn finish instead of sawn facets.
function spindle(b,a,c,r0,r1,tint,kind='wood',sides=9) {
  const start=new T.Vector3(...a),end=new T.Vector3(...c),axis=end.clone().sub(start);
  const length=axis.length(); axis.normalize();
  const side=new T.Vector3(Math.abs(axis.y)>.85?1:0,Math.abs(axis.y)>.85?0:1,0).cross(axis).normalize();
  const cross=axis.clone().cross(side);
  function ring(p,r,i) {
    const angle=tau*i/sides;
    return p.clone().addScaledVector(side,r*Math.cos(angle)).addScaledVector(cross,r*Math.sin(angle)).toArray();
  }
  for(let i=0;i<sides;i++){
    const a0=ring(start,r0,i),a1=ring(start,r0,i+1),c0=ring(end,r1,i),c1=ring(end,r1,i+1);
    const u=i/sides*tau*r0/.25,du=tau*r0/.25/sides;
    b.face(kind,tint,[a0,a1,c1,c0],{uvs:[[0,u],[0,u+du],[length/.54,u+du],[length/.54,u]]});
  }
  b.face(kind,tint,Array.from({length:sides},(_,i)=>ring(end,r1,i)));
  b.face(kind,tint,Array.from({length:sides},(_,i)=>ring(start,r0,sides-1-i)));
}
function panel(b,finish,color,nx,ny,point,scales=[1,1]) {
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
    const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([u,v])=>[u/nx,v/ny]);
    b.face(finish,typeof color==='function'?color(i,j):color,corners.map(([u,v])=>point(u,v)),
      {uvs:corners.map(([u,v])=>[u*scales[0],v*scales[1]])});
  }
}
function foot(b,x,z,w=.21) {
  // Short tenons seat in earth on level plots or in the heads of fitted hillside piers.
  plank(b,x,-.055,z,w,.31,w,dark,'y',.010);
}
function floor(part) {
  for(const z of [-1.23,1.23]){
    const b=part(z<0?'rear-sill':'fore-sill');
    for(const x of [-1.44,1.44]) foot(b,x,z);
    plank(b,0,.055,Math.sign(z)*1.22,3.14,.15,.13,dark);
  }
  plank(part('joist'),0,.055,0,3.14,.15,.13,dark);
  // Three removable floor sections rest across the sills. Their underside
  // cleats keep the individual boards together while the section is carried.
  for(let section=0;section<3;section++){
    const first=[0,5,9][section], last=[5,9,14][section],b=part('deck-'+section);
    for(let j=first;j<last;j++)
      plank(b,.001*Math.sin(j),.139,(j-6.5)*.2,3.2,.082,.198,j%3===0?grey:wood);
    for(const x of [-.91,.91])plank(b,x,.084,((first+last-1)*.5-6.5)*.2,.072,.032,(last-first)*.2-.04,dark,'z');
  }
}
function posts(part) {
  for(const z of [-1.23,1.23]){
    const b=part(z<0?'rear-bent':'fore-bent');
    for(const x of [-1.44,1.44]){
      plank(b,x,1.24,z,.13,2.12,.13,wood,'y',.006);
      for(const y of [.30,2.11])spindle(b,[x,y,z-.069],[x,y,z+.069],.016,.015,dark,'wood',6);
    }
    plank(b,0,2.20,z,3.13,.105,.14);
  }
  for(const x of [-1.44,1.44])plank(part(x<0?'left-plate':'right-plate'),x,2.27,0,.14,.10,2.62,grey,'z');
}
function wall(part) {
  const lower=part('wainscot'), upper=part('screen');
  for(let i=0;i<13;i++)
    plank(lower,(i-6)*.21,.565,-1.23,.209,.77,.063,i%4===0?grey:wood,'y');
  upper.box('washi','#e5ddba',[0,1.56,-1.23],[2.74,1.26,.043],{grain:'y'});
  for(const z of [-1.269,-1.191]) {
    for(const y of [.249,.901])plank(lower,0,y,z,2.75,.057,.037,dark);
    for(const y of [1.54,2.17])plank(upper,0,y,z,2.75,.057,.037,dark);
    for(let i=-3;i<=3;i++)plank(upper,i*.40,1.54,z,.028,1.22,.027,wood,'y');
    for(const x of [-1.35,1.35])plank(upper,x,1.56,z,.047,1.30,.037,grey,'y');
  }
}
function roof(part,terrain) {
  const ridge=terrain==='snow'?3.39:3.03;
  const height=(v)=>ridge-(ridge-2.23)*(v+.07*Math.sin(Math.PI*v));
  for(const [i,x] of [-1.44,0,1.44].entries()){
    const b=part('trestle-'+i);
    plank(b,x,2.275,0,.105,.105,2.72,dark,'z');
    plank(b,x,(2.30+ridge-.12)/2,0,.1,ridge-.12-2.30,.112,wood,'y');
  }
  plank(part('ridge'),0,ridge-.104,0,3.53,.11,.12,wood);
  for(const side of [-1,1]){
    const point=(u,v,dy=0)=>[u, height(v)+dy,side*1.65*v];
    // Light framed leaves slide up to the ridge. Each third contains its
    // own rafters, shingle bed, lapped courses and two retaining battens.
    for(let section=0;section<3;section++){
      const left=[-1.85,-.608,.608][section], right=[-.608,.608,1.85][section];
      const b=part((side<0?'back-':'front-')+section);
      for(let j=-4;j<=4;j++){
        const x=j*.405;
        if(x>left && x<right)beam(b,point(x,0,-.098),point(x,.989,-.067),.060,.070,grey);
      }
      for(let c=0;c<5;c++){
        const lo=c/5,hi=(c+1)/5+.001;
        const cuts=[-1.85];
        let x=-1.85+(c%2?.12:.21);
        while(x<1.81){cuts.push(x);x+=.205+.058*Math.sin(9.4*x+c);}
        cuts.push(1.85);
        for(let j=0;j<cuts.length-1;j++){
          const a=Math.max(left,cuts[j]),d=Math.min(right-.0005,cuts[j+1]-.001);
          if(d-a<.0002)continue;
          const edge=hi-.003*Math.sin(j*3+c);
          const pts=[point(a,lo,.011),point(d,lo,.011),point(d,edge,.033),point(a,edge,.032)];
          const uv=[[lo*2,a*3],[lo*2,d*3],[edge*2,d*3],[edge*2,a*3]];
          const tone=['#c2b8a6','#d2c5ae','#c9bdad','#d0c4b4'][(j+c*3)%4];
          b.face('bark',tone,pts,{uvs:uv});
          b.face('bark','#ad9f8d',[pts[3],pts[2],point(d,edge,.004),point(a,edge,.004)],{grain:'x'});
        }
      }
      const la=Math.max(left,-1.835),ra=Math.min(right,1.835);
      for(let k=0;k<4;k++){
        const a=k/4,c=(k+1)/4;
        b.face('wood',grey,[point(la,a,-.02),point(ra,a,-.02),point(ra,c,-.02),point(la,c,-.02)]);
      }
      if(section!==1){
        const x=section===0?-1.81:1.81;
        beam(b,point(x,0,-.045),point(x,.998,-.039),.075,.078,dark);
      }
      beam(b,point(la,1,-.024),point(ra,1,-.024),.069,.059,grey);
      for(const v of [.33,.78])spindle(b,point(la,v,.051),point(ra,v,.051),.026,.021,grey);
    }
  }
  spindle(part('ridge-cap'),[-1.84,ridge+.045,0],[1.84,ridge+.045,0],.071,.066,grey);
}
function chest(part) {
  let b=part('base');
  for(let j=0;j<4;j++)plank(b,0,.068,(j-1.5)*.149,1.01,.04,.149,dark);
  for(const x of [-.40,.40])plank(b,x,-.066,0,.14,.282,.56,dark,'z');
  b=part('case');
  for(let i=0;i<4;i++){
    const y=.14+i*.151;
    for(const z of [-.316,.316])plank(b,0,y,z,1.03,.15,.04,i%2?grey:wood);
    for(const x of [-.516,.516])plank(b,x,y,0,.044,.15,.59,wood,'z');
  }
  const lid=part('lid');
  for(let j=0;j<4;j++)plank(lid,0,.716,(j-1.5)*.17,1.12,.085,.168,pale);
  for(const x of [-.348,.348]){
    plank(lid,x,.765,0,.054,.035,.676,dark,'z');
    for(const z of [-.34,.34]) {
      b.box('metal',iron,[x,.43,z],[.055,.68,.016],{grain:'y',bevel:.003});
      for(const y of [.16,.61,.718])spindle(b,[x,y,z],[x,y,z+Math.sign(z)*.014],.014,.010,iron,'metal',6);
    }
  }
  lid.box('metal',iron,[0,.68,.342],[.118,.116,.017],{bevel:.005});
  // A loop of braided cord locks over the wooden turnbutton.
  for(let j=0;j<12;j++){
    const loop=t=>[.037*Math.cos(t),.624+.058*Math.sin(t),.357+.010*Math.sin(t)**2];
    spindle(lid,loop(j*tau/12),loop((j+1)*tau/12),.010,.010,straw,'rope',6);
  }
  plank(b,0,.633,.363,.098,.024,.022,dark);
  for(const side of [-1,1]){
    const x=side*.54;
    // Thread the side handles through a pair of forged eyes. The cord
    // describes a flattened catenary beneath the rim, clear of the lid.
    for(const z of [-.15,.15]){
      b.box('metal',iron,[x,.51,z],[.022,.067,.046],{bevel:.004});
      spindle(b,[x,.51,z],[x+side*.021,.51,z],.018,.014,iron,'metal');
    }
    const path=u=>[x+side*(.024+.022*Math.sin(Math.PI*u)),.51-.096*Math.sin(Math.PI*u),-.15+.30*u];
    for(let j=0;j<12;j++)spindle(b,path(j/12),path((j+1)/12),.012,.012,straw,'rope',7);
  }
}
const fly=(u,v)=>{
  const crown=1-Math.abs(2*u-1);
  return [(u-.5)*1.78,1.982+.10*(1-v)+.16*crown+.024*(1-crown)-.007*Math.sin(2*Math.PI*u)**2*Math.sin(Math.PI*v),-.54+1.08*v];
};
// These boards receive the four canopy staves after the counter is seated.
// Piercing actual mortises keeps the upper timber clear of the board while it
// slides home. Continuous top faces keep the grain across both sockets.
function socketBoard(b,z,holeZ,tint){
  const top=.88,bottom=.806,half=.086,r=.047;
  const outline=[[-.86,z-half],[.86,z-half],[.86,z+half],[-.86,z+half]];
  const holes=[-.75,.75].map(x=>Array.from({length:10},(_,i)=>[
    x+r*Math.cos(tau*i/10),holeZ+r*Math.sin(tau*i/10)
  ]));
  const asVectors=loop=>loop.map(([x,z])=>new T.Vector2(x,z));
  const indices=T.ShapeUtils.triangulateShape(asVectors(outline),holes.map(asVectors));
  const vertices=[...outline,...holes.flat()];
  for(const tri of indices){
    const [a,c,d]=tri.map(i=>vertices[i]);
    const winding=(c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0]);
    if(Math.abs(winding)<1e-8)continue;
    const face=winding>0?[a,d,c]:[a,c,d];
    b.face('wood',tint,face.map(([x,z])=>[x,top,z]));
    b.face('wood',tint,[...face].reverse().map(([x,z])=>[x,bottom,z]));
  }
  for(const [index,loop] of [outline,...holes].entries())for(let j=0;j<loop.length;j++){
    const [x,z]=loop[j],[u,v]=loop[(j+1)%loop.length];
    const wall=[[x,bottom,z],[x,top,z],[u,top,v],[u,bottom,v]];
    b.face('wood',index?dark:tint,index?wall.reverse():wall);
  }
}
function stand(part) {
  const bent=x=>part(x<0?'left-bent':'right-bent'),shade=part('rafters');
  for(const x of [-.75,.75])for(const z of [-.38,.33]){
    const b=bent(x);
    foot(b,x,z,.074);
    spindle(b,[x,.016,z],[x,.805,z],.044,.041,wood);
    spindle(b,[x,.69,z],[x,.736,z],.051,.050,straw,'rope');
    spindle(shade,[x,.806,z],[x,z<0?2.058:1.99,z],.040,.034,wood);
    spindle(shade,[x,1.82,z],[x,1.866,z],.051,.050,straw,'rope');
  }
  const deck=part('counter');
  for(const z of [-.38,.33])plank(deck,0,.745,z,1.62,.12,.066,dark);
  for(const x of [-.75,.75]){
    const b=bent(x);
    plank(b,x,.49,-.024,.059,.062,.84,grey,'z');
    beam(b,[x,.46,-.33],[x,.72,.27],.042,.04);
  }
  let b=shade;
  for(let j=0;j<5;j++){
    const z=-.035+(j-2)*.173,tint=j%2?pale:wood;
    if(j===0 || j===4)socketBoard(deck,z,j===0?-.38:.33,tint);
    else plank(deck,0,.843,z,1.72,.074,.172,tint);
  }
  for(const z of [-.41,.39])spindle(b,[-.862,z<0?2.059:1.991,z],[.862,z<0?2.059:1.991,z],.027,.024,grey);
  for(const x of [-.75,.75])beam(b,[x,2.066,-.52],[x,1.965,.54],.048,.047);
  for(const z of [-.41,.39]){
    const eave=z<0?2.059:1.991;
    for(const side of [-1,1])beam(b,[side*.78,eave,z],[0,eave+.138,z],.037,.035,grey);
  }
  spindle(b,[0,2.213,-.53],[0,2.115,.534],.023,.022,wood);
  b=part('fly');
  panel(b,'paper','#c6ad85',20,8,fly,[2.5,1.8]);
  panel(b,'paper','#ceb793',3,8,(u,v)=>{const p=fly(.477+.046*u,v);p[1]+=.004;return p;},[.13,1.8]);
  for(const u of [0,1]){
    const hem=(v,t)=>{
      const p=fly(u,v);
      p[0]+=(2*u-1)*.012*Math.sin(Math.PI*t);
      p[1]-=.099*t;return p;
    };
    panel(b,'paper','#bca37c',8,2,hem,[2,.32]);
    panel(b,'paper','#896c51',8,1,(v,t)=>{
      const p=hem(v,.74+.11*t);p[0]+=(2*u-1)*.002;return p;
    });
  }
  for(const v of [0,1]){
    const valance=(u,t)=>{const p=fly(u,v);p[1]-=.048*t;return p;};
    panel(b,'paper','#bd9f79',20,1,valance,[2.5,.14]);
  }
  // The curtain has its own horizontal rail below the pitched shade.
  // Cloth loops go around this spar at both shoulders of every panel.
  b=part('curtain');
  spindle(b,[-.88,1.988,.521],[.88,1.988,.521],.016,.016,dark);
  for(let i=0;i<4;i++)for(const offset of [.063,.345]){
    const x=-.867+i*.439+offset;
    panel(b,'paper',indigo,2,12,(u,v)=>[x+(u-.5)*.028,1.989+.020*Math.cos(tau*v),.521+.019*Math.sin(tau*v)]);
  }
  // Split noren strips have a sewn hem, softly curling lower corners and
  // a reserve-dyed rice-grain crest that follows the folds rather than floating.
  for(let i=0;i<4;i++){
    const strip=(u,v,lift=0)=>[-.867+i*.439+u*.418+.007*v*Math.sin(i),1.976-v*(.246+.014*Math.sin(i))-.014*Math.sin(Math.PI*u),
      .534-.032*v+.025*Math.sin(2.4*Math.PI*u+i)*v+lift];
    panel(b,'noren',indigo,14,5,strip);
  }
  // Small slotted cash box at the back right. Four separate lid boards
  // leave a real recess between their lips, with a dark box floor below.
  b=part('cashbox');
  const cx=.57,cz=-.22;
  for(const s of [-1,1]){
    plank(b,cx,.97,cz+s*.095,.29,.18,.022,grey);
    plank(b,cx+s*.135,.97,cz,.020,.18,.17,wood,'z');
    plank(b,cx,1.067,cz+s*.058,.31,.022,.095,pale);
    plank(b,cx+s*.116,1.067,cz,.075,.022,.024,pale);
  }
  plank(b,cx,.908,cz,.258,.02,.175,dark);
  // Shallow bamboo board below the goods. Surface height matches the display.
  b=part('tray');
  for(let j=0;j<7;j++)plank(b,-.17,.896,.02+(j-3)*.083,.96,.03,.082,pale);
  for(const z of [-.279,.319])plank(b,-.17,.918,z,1.00,.044,.026,grey);
  for(const x of [-.658,.318])plank(b,x,.918,.02,.022,.044,.58,grey,'z');
}
function camp(part,terrain,indoors=false) {
  let b=part('bed');
  // Ground runners have buried toes. Indoors their flat soles rest on the floorboards.
  for(const x of [-.44,.44])plank(b,x,indoors?.026:-.08,.06,.127,indoors?.052:.26,1.83,dark,'z');
  // The split-bamboo sleeping platform drains through its interstices.
  for(let i=0;i<18;i++)spindle(b,[-.567,.071,-.75+i*.098],[.567,.071,-.75+i*.098],.047,.045,wood);
  b=part('mat');
  const mat=(u,v,dy=0)=>[(u-.5)*1.09,.125+.007*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+dy,-.75+1.72*v];
  panel(b,'rush','#b9a67b',8,12,mat);
  for(const s of [0,.944])panel(b,'paper','#696f5b',1,12,(u,v)=>mat(s+u*.056,v,.0017),[.22,7]);
  // The pillow is a rolled textile; both ends have recessed spiral seams.
  b=part('pillow');
  const roll=(u,v,r=1)=>{
    const a=tau*v;
    const tie=t=>Math.exp(-((u-t)**2)/.00049);
    const c=.90+.10*Math.sin(Math.PI*u)+.019*Math.sin(4*a+.8*u)-.058*(tie(.16)+tie(.82));
    return [(u-.5)*.925,.266+Math.sin(a)*.129*r*c,-.54+Math.cos(a)*.133*r*c];
  };
  panel(b,'paper','#c7b38d',32,36,roll,[1.3,1.1]);
  for(const end of [0,1]){
    for(let j=0;j<36;j++) {
      const rim=[roll(end,j/36),roll(end,(j+1)/36)];
      if(end===1)rim.reverse();
      const tri=[roll(end,0,0),...rim];
      b.face('paper',straw,tri,{uvs:tri.map(([,y,z])=>[.5+(y-.266)*3,.5+(z+.54)*3])});
    }
    for(let k=0;k<24;k++){
      const p=t=>roll(end,t*1.6,.18+.60*t).map((v,i)=>v+(i===0?(end-.5)*.003:0));
      spindle(b,p(k/24),p((k+1)/24),.004,.004,dark,'rope',5);
    }
  }
  // Rolled selvedge resting against the compression of the outer wrap.
  for(let j=0;j<28;j++){
    const edge=t=>roll(t,.742+.018*Math.sin(8*t),1.011);
    spindle(b,edge(j/28),edge((j+1)/28),.009,.008,straw,'rope',7);
  }
  for(const start of [.14,.80])panel(b,'paper','#827e65',5,36,(u,v)=>roll(start+u*.052,v,1.025));
  if(indoors)return;
  b=part('staff');
  const x=-.78,z=-.72;
  spindle(b,[x,-.21,z],[x,1.79,z],.038,.025,wood);
  spindle(b,[x-.032,1.63,z],[x+.493,1.63,z],.016,.012,wood);
  const pennon=(u,v)=>[x+.041+.39*u,1.63-v*(.48-.16*u)-.012*Math.sin(u*Math.PI),
    z+.020+.054*Math.sin(1.7*Math.PI*u+.9*v)*u];
  panel(b,'paper','#ac7963',10,6,pennon,[1.3,1.4]);
  panel(b,'paper',flax,8,1,(u,v)=>{const p=pennon(u,.22+.044*v);p[2]+=.006;return p;});
  for(const y of [1.60,1.66])spindle(b,[x,y,z],[x,y+.022,z],.043,.042,straw,'rope');
}
function fence(part) {
  // Yotsume-gaki. The slim vertical culms cross the horizontal ones,
  // with crossed palm-fibre lashings on the exposed face of each knot.
  const bamboo='#dbd6a5',aged='#c4b68a',cord='#726448';
  const culms=[[-.84,.045,1.12],[.84,.045,1.10],[-.51,.022,1.00],[-.17,.019,.985],[.17,.022,1.025],[.51,.021,.99]];
  for(const [x,r,h] of culms){
    const end=r>.03,side=x<0?'left':'right';
    let b=part(end?side+'-stake':'lattice');
    const z=end?0:.034;
    spindle(b,[x,-.21,z],[x,h,z],r,r*.82,bamboo);
    for(let j=0;j<4;j++){
      const y=.11+j*.261+.028*Math.sin(x*19);
      if(y>=h)break;
      spindle(b,[x,y,z],[x,y+.018,z],r*1.10,r*1.04,aged,'wood',9);
    }
    // The hollow cut ends show a darker pith within the narrow bright rim.
    spindle(b,[x,h-.001,z],[x,h+.001,z],r*.56,r*.55,dark,'bark',8);
    if(end)b=part(side+'-tie');
    for(const y of [.36,.79]){
      const front=z+r+.009;
      for(const sign of [-1,1]){
        const a=[x-sign*(r+.012),y-.039,-.053];
        const m=[x-sign*(r+.013),y-.034,front];
        const n=[x+sign*(r+.013),y+.032,front];
        spindle(b,a,m,.007,.007,cord,'rope',6);
        spindle(b,m,n,.007,.007,cord,'rope',6);
        spindle(b,n,[x+sign*(r+.012),y+.037,-.050],.007,.007,cord,'rope',6);
      }
    }
  }
  const b=part('lattice');
  for(const y of [.36,.79]){
    spindle(b,[-.90,y,-.025],[.90,y+.003,-.025],.027,.024,bamboo);
    for(let j=0;j<6;j++){
      const x=-.80+j*.31;
      spindle(b,[x,y,-.025],[x+.016,y,-.025],.029,.028,aged);
    }
  }
}
// Match the upper bole to the rooted section at the saw line, including
// the angular wrap, so bark fissures run through the cut until it opens.
export function timberBarkTint(species) {
  if(['moso','bamboo','shrine-bamboo'].includes(species))return '#8b976c';
  return TREE_FAMILIES.find(f=>f[0]===species)?.[7] ?? '#897861';
}
export const timberBarkUV=(height,turn)=>[(height+.13)*(.23/.55),turn*2.6];

function stump(b,terrain,species) {
  if(['moso','bamboo','shrine-bamboo'].includes(species)){
    // The cut lip surrounds a hollow internode. Leave its darker diaphragm
    // below the rim, with a slightly swollen joint on the outer culm.
    const n=20, profile=[[-.12,.30],[.19,.29],[.205,.317],[.22,.302],[.23,.285],[.42,.28],[.42,.225],[.25,.216]];
    for(let i=0;i<n;i++){
      const ring=(k,j)=>{
        const [y,r]=profile[j],a=tau*k/n;
        return [Math.cos(a)*r,y+.004*Math.sin(3*a),Math.sin(a)*r];
      };
      for(let j=0;j<profile.length-1;j++){
        const tint=j===5?'#e5d4a2':j===6?'#817d58':j===1?'#aaa677':timberBarkTint(species);
        const corners=[[i,j],[i,j+1],[i+1,j+1],[i+1,j]];
        const points=corners.map(([k,level])=>ring(k,level));
        const uvs=j===5?points.map(p=>[.5+p[0]/.6,.5+p[2]/.6]):
          corners.map(([k,level])=>timberBarkUV(profile[level][0],k/n));
        b.face(j===5?'culmCut':'culmSkin',tint,points,{uvs});
      }
      const diaphragm=[[0,.247,0],ring(i+1,7),ring(i,7)];
      b.face('culmCut','#8b805a',diaphragm,{uvs:diaphragm.map(p=>[.5+p[0]/.6,.5+p[2]/.6])});
    }
    return;
  }
  const bark=timberBarkTint(species);
  const n=18;
  const point=(a,v,rad=1)=>{
    const r=rad*(1+.087*Math.sin(3*a+.17)+.037*Math.cos(7*a))*(.31+.13*(1-v)**3);
    return [Math.cos(a)*r,-.13+v*.55+v*(.010*Math.cos(a)+.005*Math.sin(5*a)),Math.sin(a)*r];
  };
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){
    const ring=[[i,j],[i,j+1],[i+1,j+1],[i+1,j]];
    b.face('stumpBark',bark,ring.map(([u,v])=>point(tau*u/n,v/4)),
      {uvs:ring.map(([u,v])=>timberBarkUV(-.13+v*.55/4,u/n))});
  }
  for(let i=0;i<n;i++){
    const rim=point(tau*i/n,1),next=point(tau*(i+1)/n,1);
    const triangle=[[0,.42,0],next,rim];
    b.face('endGrain','#f2d8ac',triangle,{uvs:triangle.map(p=>[.49+p[0]*1.15,.49+p[2]*1.15])});
  }
  // Uneven pale chips fall within the root flare instead of occupying a path.
  for(let j=0;j<8;j++){
    const a=j*2.399,r=.37+.087*Math.sin(4*j),x=r*Math.cos(a),z=r*Math.sin(a);
    b.face('wood',pale,[[x-.040,.012,z],[x+.044,.014,z+.048],[x+.035,.020,z-.015],[x-.016,.024,z-.018]]);
  }
}
const builders={camp,floor,posts,wall,roof,chest,stand,fence};
export const HUT_MODULES=['floor','posts','wall','roof'];

// The permanent world batches the complete carpentry into one draw call.
// During construction each removable member is built by the same drawing
// instructions into its own buffer, retaining its joints, grain, and fasteners.
export function drawHomesteadModule(kind,terrain,writer) {
  builders[kind](writer,terrain);
}
export function homesteadGeometry(kind,terrain='plain',species) {
  const b=hokoraCarpentry();
  if(kind==='camp' && species==='indoors')camp(()=>b,terrain,true);
  else if(kind==='stump')stump(b,terrain,species);
  else for(const module of kind==='hut'?HUT_MODULES:[kind])drawHomesteadModule(module,terrain,()=>b);
  return b.finish();
}
