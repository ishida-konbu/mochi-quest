// Bank-side tableaux, in metres. The front edge of the stage faces the water.
// Colour and the tapered marks are baked into each sculpture's single mesh.
import * as T from './vendor/three.module.min.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';
import { inkVolume } from './scroll-sculpt.js';
import { skinGeometry, profile } from './ryugu-sculpt.js';
import { weddingVisage } from './wedding-visages.js';

const {PI,sin,cos,abs}=Math, tau=2*PI;
const soot='#3b3731', smoke='#6b6253', paper='#ede1c6', reed='#b49767', iron='#474a47';
const ivory='#dfd4b9', brass='#bc985e', wood='#82694c', slip='#bd7858';
const cinnabar='#ac5943';

function line(s,color,path,width,segments=Math.max(5,path.length*2)) {
  const radii=Array.isArray(width)?width:path.map(()=>width);
  s.add(brushStroke(path,radii,segments,5),color);
}
function nib(s,path,r=.014,col=soot) {
  line(s,col,path,path.map((_,i)=>.001+r*sin(PI*i/(path.length-1))**.70));
}
function surface(s,color,rows,cols,at,reverse=false,closed=false) {
  const g=skinGeometry(rows,cols,at,reverse,closed);
  s.add(g,color);
}
function turned(s,tint,x,y,z,rings,sx=1,sy=1,sz=1,pitch=0,yaw=0,roll=0) {
  const g=new T.LatheGeometry(rings.map(([r,h])=>new T.Vector2(r,h)),36);
  s.add(g,tint,x,y,z,sx,sy,sz,pitch,yaw,roll);
}
function relief(s,points,hump,col){
  const rim=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),true,'catmullrom',.32);
  const center=new T.Vector3(...hump);
  surface(s,col,4,24,(u,v)=>rim.getPoint(u).lerp(center,1-v).toArray());
}
function setPiece(s,build,x,y,z,scale=1,yaw=0,pitch=0,roll=0){
  const part=sculpture();build(part);
  s.add(part.finish(),'#fff',x,y,z,scale,scale,scale,pitch,yaw,roll);
}

// A hare kneels on its haunches. The two paws can meet an actual prop in
// different poses, while the jaw, pinnae and whiskers read from both sides.
function kneelingHare(s,frontPaws) {
  const fur='#e1d4b9';
  inkVolume(s,[[0,.08,-.13,.08,.08],[0,.18,-.17,.35,.32],
    [0,.37,-.16,.38,.36],[0,.65,-.08,.29,.28],[0,.87,.04,.235,.22],
    [0,1.06,.13,.164,.147]],fur,20,'hare');
  inkVolume(s,[[0,1.13,-.13,.032,.046],[0,1.19,-.04,.206,.225],
    [0,1.23,.115,.263,.244],[0,1.21,.286,.224,.192],[0,1.177,.441,.165,.137],
    [0,1.156,.56,.104,.087],[0,1.16,.603,.04,.033]],paper,22);
  s.ball(soot,0,1.172,.585,.062,.034,.04);
  s.ball(ivory,0,.334,-.47,.13,.132,.12);
  for(const side of [-1,1]){
    const ss=side,back=ss===1?.08:.22;
    const ear=[[ss*.125,1.34,.038,.071,.046],[ss*.17,1.52,-.009,.108,.062],
      [ss*.236,1.72,-back*.55,.093,.052],[ss*.302,1.88,-back,.063,.03],
      [ss*.326,1.97-(ss<0?.08:0),-back-.06,.008,.005]];
    inkVolume(s,ear,fur,15);
    line(s,'#a39080',ear.slice(1).map(([x,y,z])=>[x,y,z+.025]),[.031,.041,.027,.001],11);
    s.ball(soot,ss*.204,1.261,.334,.038,.043,.049,0,ss*.36,-ss*.20);
    s.ball('#f8efd9',ss*.231,1.276,.352,.012,.012,.012);
    nib(s,[[ss*.233,1.24,.24],[ss*.239,1.31,.281],[ss*.207,1.316,.339],[ss*.180,1.285,.39]]);
    nib(s,[[ss*.045,1.145,.58],[ss*.116,1.125,.541],[ss*.144,1.132,.49]],.009);
    for(let j=0;j<3;j++)nib(s,[[ss*.116,1.157+j*.014,.504],
      [ss*(.215+j*.026),1.173+j*.021,.526],[ss*(.30+j*.026),1.15+j*.034,.518]],.004,smoke);
    s.ball('#cebea2',ss*.246,.254,-.104,.184,.219,.28,.13,ss*.29);
    s.ball(fur,ss*.242,.095,.152,.134,.082,.273,0,ss*.20);
    const hand=frontPaws[ss>0?1:0],elbow=[ss*.40,.653,hand[2]-.16];
    line(s,fur,[[ss*.202,.875,.045],elbow,[hand[0],hand[1]-.025,hand[2]-.035],hand],[.129,.092,.056,.044],15);
    s.ball(fur,...hand,.072,.068,.095,-.25);
    nib(s,[[ss*.282,.469,-.308],[ss*.382,.345,-.278],[ss*.411,.237,-.182]],.011,smoke);
  }
}

function frog(s,hands) {
  const skin='#999d76',paleBelly='#c4b890';
  inkVolume(s,[[0,.13,-.11,.095,.13],[0,.30,-.13,.31,.255],[0,.49,-.09,.337,.279],
    [0,.695,.015,.276,.201],[0,.823,.09,.24,.174]],skin,18,'frog');
  inkVolume(s,[[0,.83,-.20,.155,.12],[0,.885,-.04,.337,.206],
    [0,.866,.15,.36,.204],[0,.833,.31,.30,.154],[0,.823,.403,.167,.086],
    [0,.814,.435,.025,.032]],skin,18);
  s.ball(paleBelly,0,.716,.195,.258,.207,.155);
  for(const side of [-1,1]){
    const x=side*.242,y=1.014,z=.179;
    s.ball(skin,x,y,z,.119,.131,.125);
    s.ball(paper,x,y+.014,z+.075,.089,.077,.056);
    s.ball(soot,x+.012*side,y+.019,z+.12,.061,.025,.019);
    s.ball(paper,x+.023*side,y+.032,z+.135,.012,.009,.007);
    nib(s,[[side*.343,.847,.168],[side*.314,.835,.255],[side*.201,.804,.378],
      [side*.093,.795,.422],[0,.796,.434]],.013);
    s.ball(skin,side*.251,.221,-.15,.188,.179,.285,.24,side*.37);
    line(s,skin,[[side*.36,.262,-.17],[side*.47,.113,-.35],[side*.323,.093,.032]],
      [.109,.070,.041],11);
    const hand=hands[side>0?1:0];
    line(s,skin,[[side*.236,.673,.037],[side*.376,.559,.147],hand],[.087,.062,.041],12);
    for(let j=-1;j<=1;j++){
      line(s,skin,[hand,[hand[0]+j*.036,hand[1]-.007,hand[2]+.041],
        [hand[0]+j*.055,hand[1]+.006,hand[2]+.070-abs(j)*.012]],[.025,.013,.012],5);
      line(s,skin,[[side*.324,.093,.022],[side*.329+j*.076,.066,.134],
        [side*.341+j*.119,.073,.200-abs(j)*.026]],[.030,.019,.008],6);
    }
  }
}

function dawnFan(s){
  // A folding fan built around a single brass rivet; the dawn disc, cloud
  // bands and fluting follow the folded paper instead of floating in front.
  const ox=-.07,oy=.22,oz=-.21,panels=14,angle=2.32;
  const at=(u,v,lift=0)=>{
    const a=(u-.5)*angle,crease=1-abs(2*((u*panels)%1)-1),r=.61+1.12*v;
    return [ox+sin(a)*r,oy+cos(a)*r,oz+.12*r*crease+.025*r*r+lift];
  };
  const g=skinGeometry(26,panels*8,at),rgb=[],color=new T.Color(),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),cloud=.95+.09*sin(x*3)+.055*sin(x*7+.9);
    color.set(Math.hypot((x+.57)*1.02,y-1.36)<.294?'#b66248':
      y<cloud?'#979e90':y<cloud+.038?'#c6b694':y<cloud+.090?'#dbcdb1':'#ead7ae');
    color.multiplyScalar(.94+.058*cos(i%(panels*8+1)/8*2*PI));
    rgb.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));s.add(g,'#fff');
  for(let k=0;k<=panels;k++){
    const u=k/panels,outer=k===0||k===panels;
    line(s,outer?wood:reed,[[ox,oy,oz],at(u,.01,.012),at(u,outer?.998:.65,.008)],
      outer?[.049,.044,.034]:[.025,.020,.006]);
  }
  for(const v of [.014,.969,.997]){
    const count=panels*4+1,points=Array.from({length:count},(_,i)=>at(i/(count-1),v,.006));
    line(s,v===.969?brass:smoke,points,v===.969?.010:.015,count);
  }
  s.ball(brass,ox,oy,oz+.027,.066,.066,.031);
  // An egret has alighted before the painted sunrise; black primaries extend
  // well beyond the wing coverts, the long S-neck turns back toward the disc.
  const b=sculpture();
  inkVolume(b,[[0,.665,-.59,.014,.022],[0,.692,-.406,.129,.082],
    [0,.705,-.151,.201,.182],[0,.762,.092,.183,.182],[0,.80,.237,.092,.111]],paper,19);
  line(b,paper,[[0,.773,.173],[0,.87,.349],[0,1.067,.313],
    [0,1.22,.221],[0,1.319,.267],[0,1.343,.36]],[.11,.079,.062,.054,.057,.055],20);
  b.ball(paper,0,1.343,.37,.081,.088,.125,-.10);
  b.ball(cinnabar,0,1.411,.345,.062,.024,.072);
  line(b,'#746c4b',[[0,1.337,.444],[0,1.33,.571],[0,1.314,.697]],[.042,.025,.001]);
  for(const side of [-1,1]){
    b.ball(soot,side*.064,1.357,.404,.017,.019,.018);
    for(let j=0;j<5;j++){
      const x=side*(.123+.018*sin(j*.76)),z=.035-j*.067;
      relief(b,[[x,.784,z+.10],[x+side*.056,.807,z-.037],[x+side*.017,.710,z-.197],
        [x-side*.045,.619-j*.014,z-.277]],[x+side*.087,.731,z-.038],j>2?iron:ivory);
    }
    line(b,soot,[[side*.076,.615,-.031],[side*.091,.333,-.077],[side*.10,.025,.001]],.021);
    for(const j of [-1,0,1])line(b,smoke,[[side*.10,.028,0],[side*.10+j*.051,.016,.071],
      [side*.10+j*.087,.014,.128-abs(j)*.04]],[.017,.011,.004]);
  }
  s.add(b.finish(),'#fff',.94,.14,.286,.91,.91,.91,0,-1.07);
  s.ball('#939385',1,.06,.34,.47,.12,.35);
  s.box(wood,-.10,.075,-.22,1.22,.15,.43);
}

function inkstone(s){
  // A single hewn block has a raised lip and a sloping rubbing bed (oka)
  // descending into the ink reservoir (umi) at the brush tip.
  const cx=.26,cz=.211;
  function rect(u,w,d){
    const a=u*tau,x=sin(a),z=cos(a);
    return [cx+w*Math.sign(x)*abs(x)**.43,cz+d*Math.sign(z)*abs(z)**.43];
  }
  const bands=[[.96,.40,.06],[1.05,.47,.11],[1.073,.488,.27],[1.045,.48,.39],
    [.992,.436,.437],[.903,.356,.426],[.851,.325,.357],[.79,.27,.310],[.020,.009,.306]];
  surface(s,'#515759',bands.length-1,72,(u,v)=>{
    const [w,d,h]=bands[Math.round(v*(bands.length-1))],[x,z]=rect(u,w,d);
    return [x,h+.032*(x-cx),z];
  },false,true);
  s.ball('#384849',-.044,.356,.217,.394,.027,.256);
  for(const edge of [1,3,4]){
    const [w,d,h]=bands[edge],points=Array.from({length:65},(_,i)=>{
      const [x,z]=rect(i/64,w,d);return [x,h+.032*(x-cx),z];
    });
    line(s,edge===4?'#85877f':'#454948',points,.009,64);
  }
  for(let k=0;k<8;k++){
    const x=.345+k*.077;
    nib(s,[[x,.349+.03*x,-.040],[x+.024,.352+.03*x,.104],
      [x+.022,.351+.03*x,.299],[x+.019,.348+.03*x,.414]],.006,'#777b72');
  }
  // The clerk squats to the left, gripping a single brush in both paws.
  setPiece(s,b=>kneelingHare(b,[[.179,.780,.576],[.310,1.016,.544]]),
    -.776,.07,-.182,1.04,.73,.07);
  const brush=[[.349,2.14,-.307],[.135,1.603,-.090],[-.068,1.055,.091],
    [-.286,.518,.291],[-.32,.378,.342]];
  line(s,wood,brush.slice(0,4),[.068,.065,.066,.058],15);
  const between=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  for(const t of [.1,.22,.29])line(s,brass,[between(brush[0],brush[1],t),between(brush[0],brush[1],t+.034)],.071,3);
  line(s,ivory,[between(brush[2],brush[3],.37),between(brush[2],brush[3],.65),brush[3],brush[4]],
    [.081,.10,.071,.002],12);
  line(s,soot,[between(brush[2],brush[3],.87),brush[3],brush[4]],[.080,.070,.002],7);
  // Ink stick with a gilt maker's device lies on the grinding plane.
  s.box('#383b39',.799,.407,.21,.21,.091,.49,0,-.31);
  for(let k=0;k<3;k++)s.ball(brass,.78+k*.023,.455,.27-k*.075,.043,.007,.019,0,-.31);
}

function peachGourd(s){
  const cx=.20,cz=-.074,base=.072;
  const rings=[[.01,0],[.29,.015],[.475,.093],[.607,.31],[.639,.53],[.59,.74],[.459,.905],
    [.292,1.036],[.234,1.13],[.263,1.237],[.336,1.365],[.337,1.51],[.277,1.637],
    [.158,1.734],[.127,1.82],[.135,1.865],[.164,1.88],[.162,1.938],[.106,1.938],[.097,1.85]];
  turned(s,'#bb9267',cx,base,cz,rings);
  // Actual two-strand braided cord locks the carrying knot at the waist.
  for(let k=0;k<2;k++){
    const points=Array.from({length:65},(_,j)=>{
      const a=j*tau/64,t=a*10+k*PI,r=.244+.015*cos(t);
      return [cx+r*sin(a),base+1.12+.020*sin(t),cz+r*cos(a)];
    });
    line(s,k?smoke:ivory,points,.024,64);
  }
  line(s,smoke,[[cx,1.209,cz+.238],[cx-.12,1.11,cz+.31],[cx-.223,1.081,cz+.33],[cx-.179,1.183,cz+.32],[cx,1.209,cz+.238],
    [cx+.133,1.11,cz+.32],[cx+.172,1.163,cz+.31],[cx+.06,1.203,cz+.275] ],.028,25);
  for(const side of [-1,1]){
    line(s,ivory,[[cx,.072+1.12,cz+.26],[cx+side*.12,1.05,cz+.333],[cx+side*.147,.89,cz+.450]],.017);
    s.ball(slip,cx+side*.146,.85,cz+.46,.047,.093,.044);
  }
  const branch=[[-1.21,.01,-.37],[-1.16,.58,-.41],[-.93,1.015,-.39],[-1.027,1.423,-.40],
    [-.77,1.782,-.39],[-.376,1.965,-.336],[-.073,2.146,-.294]];
  line(s,wood,branch,[.139,.116,.081,.062,.045,.027,.004],28);
  for(const [start,bend,end] of [[branch[2],[-1.28,1.355,-.34],[-1.45,1.55,-.31]],
    [branch[3],[-.741,1.549,-.31],[-.453,1.574,-.175]],
    [branch[4],[-.748,2.013,-.36],[-.866,2.25,-.38]],
    [branch[5],[-.34,2.193,-.32],[-.172,2.34,-.28]],
    [branch[5],[-.123,1.949,-.32],[.123,2.006,-.30]]]){
    line(s,wood,[start,bend,end],[.037,.020,.003],10);
    for(const [k,at] of [bend,end].entries()){
      const [x,y,z]=at;
      for(let i=0;i<5;i++){
        const a=i*tau/5+.72*k;
        s.ball(i%2?'#d9a7a1':'#ebc2b4',x+.065*cos(a),y+.066*sin(a),z+.024,
          .068,.048,.031,-.15,.24,a);
      }
      s.ball(brass,x,y,z+.056,.030,.028,.017);
    }
  }
  setPiece(s,b=>kneelingHare(b,[[-.045,.693,.470],[.099,.728,.454]]),1.04,.06,.27,.62,-.94,-.06);
  s.ball('#ca9188',.79,.55,.47,.106,.099,.09);
  nib(s,[[.782,.643,.485],[.782,.619,.53],[.784,.564,.557],[.790,.516,.545]],.008,'#b97e6b');
  line(s,wood,[[.783,.638,.459],[.764,.681,.45],[.779,.71,.463]],[.017,.012,.004]);
  for(const [x,y,z,side] of [[-.78,1.77,-.39,-1],[-.36,1.96,-.32,1],[-.85,1.29,-.39,1]]){
    const pts=[[x,y,z],[x+side*.12,y+.106,z+.021],[x+side*.229,y+.126,z+.014],
      [x+side*.172,y+.031,z+.045],[x+side*.087,y+.019,z+.055]];
    relief(s,pts,[x+side*.136,y+.067,z+.06],'#929678');
    nib(s,[[x,y,z],[x+side*.105,y+.046,z+.052],[x+side*.21,y+.116,z+.021]],.007,smoke);
  }
}

function templeLotus(s){
  const cx=-.263,cz=-.075;
  turned(s,'#777b68',cx,0,cz,[[.02,.006],[.432,.02],[.49,.069],[.482,.142],
    [.351,.20],[.325,.34],[.405,.398],[.369,.463],[.207,.50]]);
  turned(s,'#abaa83',cx,.47,cz,[[.014,.01],[.25,.01],[.454,.135],[.485,.25],
    [.378,.291],[.216,.29],[.01,.282]]);
  for(let whorl=0;whorl<2;whorl++)for(let k=0;k<9;k++){
    const a=tau*(k+.48*whorl)/9;
    // The light veins are ribs of the petal, radiating from a small raised
    // heel. Each blade has a folded underside and lifts clear of the next.
    const at=(u,v,back=0)=>{
      const spread=.34*(1-.23*whorl)*sin(PI*(.02+.97*v))**.73;
      const q=u*2-1;
      const radius=.20+(.91-.24*whorl)*v+.080*sin(v*PI)
        +.094*q*q*sin(v*PI)+back*.026*sin(v*PI)*sin(u*PI);
      return [cx+radius*sin(a)+spread*q*cos(a),
        .461+(.527+.39*whorl)*v*v+.17*sin(PI*v)-.059*q*q*sin(v*PI)-back*.040*sin(v*PI)*sin(u*PI),
        cz+.72*radius*cos(a)-.72*spread*q*sin(a)];
    };
    surface(s,whorl?'#cdac9d':k%3===1?'#b09d85':'#bda692',10,8,(u,v)=>at(u,v));
    surface(s,'#918b76',8,6,(u,v)=>at(u,v,1),true);
    for(const side of [0,1]){
      const path=Array.from({length:7},(_,i)=>at(side,i/6));
      nib(s,path,.011,'#8b7c6a');
    }
    for(const u of [.27,.50,.73]){
      const points=Array.from({length:5},(_,i)=>at(u,.17+.79*i/4));
      nib(s,points,u===.5?.013:.006,'#e3c9ad');
    }
  }
  turned(s,'#a39362',cx,.64,cz,[[.137,.04],[.198,.22],[.273,.316],[.278,.374],[.238,.402],[.01,.40]]);
  for(let i=0;i<9;i++){
    const a=i*2.4,r=.19*Math.sqrt(i/9);
    s.ball(smoke,cx+r*cos(a),1.041,cz+r*sin(a),.028,.010,.026);
  }
  setPiece(s,b=>frog(b,[[.010,.80,.324],[-.015,.822,.365]]),1.027,.092,.10,.87,-.50);
  const center=[.914,.727,.513];
  for(let j=0;j<14;j++){
    const a=j*tau/14;
    s.ball(j%3?wood:'#b79a71',center[0]+.097*sin(a),center[1]-.121*(1-cos(a)),
      center[2]+.021*sin(a),.026,.026,.026);
  }
  // Unopened bud above a broad, cupped leaf.
  line(s,'#818767',[[-1.14,.014,-.279],[-1.28,.47,-.35],[-1.18,1.09,-.308],[-1.22,1.49,-.33]],[.043,.035,.028,.022],15);
  turned(s,'#c49f94',-1.22,1.425,-.33,[[.018,0],[.097,.05],[.13,.168],
    [.105,.287],[.038,.388],[.005,.442]]);
  for(let j=0;j<5;j++){
    const a=j*tau/5;
    nib(s,[[.079,1.483],[.128,1.603],[.105,1.70],[.016,1.829]].map(([r,y])=>
      [-1.22+r*sin(a),y,-.33+r*cos(a)]),.009,'#9c8775');
  }
}
function inariBend(s){
  // Three gates diminish along a bent path. Their lintels curve up at the
  // ends and the dark foot sleeves wrap each post.
  for(let j=0;j<3;j++){
    const x=-.816+.16*j*j, z=.13-j*.291, scale=1-j*.232;
    setPiece(s,b=>{
      for(const side of [-1,1]){
        b.post(cinnabar,side*.482,.775,0,.090,1.55,.090,0,0,-side*.035);
        b.post(iron,side*.505,.142,0,.096,.284,.096);
      }
      b.box(cinnabar,0,1.191,0,1.34,.121,.14);
      b.box(cinnabar,0,1.377,0,.146,.267,.142);
      const lintel=[[-.755,1.64,0],[-.48,1.587,0],[0,1.566,0],[.48,1.587,0],[.755,1.64,0]];
      for(const [y,c,r] of [[0,cinnabar,.084],[.092,iron,.073]]){
        line(b,c,lintel.map(([x,h,z])=>[x,h+y,z]),r,14);
      }
    },x,0,z,scale,-.17+j*.29);
  }
  setPiece(s,b=>{
    const coat='#b8a386',breast='#ded1b7';
    inkVolume(b,[[0,.135,-.078,.18,.23],[0,.349,-.071,.351,.322],
      [0,.59,-.036,.293,.31],[0,.822,.038,.272,.244],[0,1.069,.083,.24,.217],
      [0,1.285,.101,.187,.161]],coat,22);
    b.add(weddingVisage('lantern'),'#fff',0,1.38,.108,1.14,1.14,1.14,-.06,-.25);
    for(const side of [-1,1]){
      b.ball(coat,side*.239,.367,-.081,.174,.294,.271,.37);
      inkVolume(b,[[side*.160,.864,.14,.111,.101],[side*.175,.649,.175,.096,.093],
        [side*.167,.345,.23,.072,.069],[side*.176,.177,.256,.060,.068],
        [side*.167,.121,.306,.084,.132]],breast,13);
      b.ball(breast,side*.176,.108,.312,.089,.084,.136);
      for(let i=0;i<2;i++)nib(b,[[side*.176+i*.032-.013,.12,.435],
        [side*.176+i*.032-.013,.154,.409],[side*.176+i*.032-.013,.166,.378]],.006);
    }
    const tail=[[.14,.246,-.19],[.45,.29,-.276],[.655,.443,-.23],
      [.733,.73,-.28],[.691,.985,-.352],[.752,1.198,-.395],[.889,1.367,-.38]];
    line(b,coat,tail,[.123,.163,.205,.20,.159,.104,.009],25);
    line(b,breast,tail.slice(-3),[.155,.106,.004],12);
    // Fox messenger's vermilion votive bib, gathered at the throat.
    const bib=[[-.197,1.216,.204],[0,1.139,.333],[.193,1.216,.201],
      [.206,1.033,.255],[.144,.896,.321],[0,.830,.352],[-.151,.897,.331],[-.210,1.019,.277]];
    relief(b,bib,[0,1.027,.377],cinnabar);
    nib(b,bib.slice(3),.014,brass);
    b.ball(brass,0,.853,.357,.034,.043,.024);
  },.623,.09,.02,1.12,-.36);
  s.ball('#828577',.79,.104,-.032,.702,.161,.50);
}

function harborBoat(s){
  // The hull is a hollow double-ended wasen. Its sheer, strakes, thwarts
  // and exposed interior ribs all share the same curved cross-sections.
  function hull(u,v,inside=false){
    const t=u*2-1,a=v*PI,w=(1-abs(t)**1.78)**.66;
    const freeboard=.387+.233*abs(t)**2.25;
    return [1.54*t, .315+freeboard*(1-sin(a))+.132*abs(t)**1.58+(inside?.050:0),
      .006+w*(.401-(inside?.040:0))*cos(a)];
  }
  surface(s,'#887259',20,48,(u,v)=>hull(u,v));
  surface(s,'#b59a70',20,48,(u,v)=>hull(u,v,true),true);
  for(const side of [0,1])for(const v of [0,.15,.29]){
    const points=Array.from({length:29},(_,j)=>hull(j/28,side?1-v:v));
    line(s,v===0?wood:smoke,points,v===0?.033:.014,30);
  }
  for(const u of [.20,.33,.50,.68,.80]){
    const points=Array.from({length:11},(_,i)=>hull(u,i/10,true));
    line(s,wood,points,.023,14);
    const [x,y,z]=points[0];s.box('#ab8c65',x,y-.051,0,.104,.044,z*2);
  }
  s.box(wood,0,.11,0,2.02,.22,.389);
  for(const x of [-.756,.77])s.box(smoke,x,.247,0,.188,.116,.557);
  const mastX=.10,mastZ=-.069;
  line(s,wood,[[mastX,.372,mastZ],[mastX,1.21,mastZ],[mastX-.088,2.171,mastZ]],[.045,.044,.031]);
  const sail=(u,v)=>{
    const x=mastX-.825+1.301*u+.065*v*(.5-u);
    const y=.931+1.017*v+.116*u-.071*sin(u*PI)*(1-v);
    return [x,y,mastZ+.042+.243*sin(PI*u)*sin(PI*(.16+.72*v))+.046*sin(u*5*PI+.3*v)];
  };
  surface(s,'#e2d3b5',17,34,sail);
  for(const u of [0,.20,.40,.60,.80,1]){
    const points=Array.from({length:8},(_,j)=>sail(u,j/7));
    line(s,u===0||u===1?reed:'#bfae92',points,u===0||u===1?.017:.009,10);
  }
  // Two indigo bars make the sail recognisable against a pale sky.
  for(const lo of [.56,.653])surface(s,'#61777a',2,32,(u,v)=>{
    const [x,y,z]=sail(u,lo+v*.040);return [x,y,z+.006];
  });
  const yard=[sail(-.075,1),sail(.50,1),sail(1.07,1)];
  line(s,reed,yard,.026);
  for(const side of [0,1]){
    const corner=yard[side?2:0],end=hull(side?.91:.08,side);
    line(s,smoke,[corner,[.5*(corner[0]+end[0]),.5*(corner[1]+end[1])-.08,-.06],end],.012);
  }
  setPiece(s,b=>frog(b,[[.085,.903,.455],[.248,.72,.489]]),.885,.593,.027,.67,-.85);
  line(s,wood,[[.635,1.36,.166],[.746,1.107,.376],[.974,.689,.567],[1.139,.388,.731]],[.028,.031,.044,.069],12);
}

function sakaiKiln(s){
  const cx=-.29,cz=-.022;
  const stations=[[0,.31],[.05,.359],[.14,.344],[.23,.439],[.43,.595],
    [.68,.698],[.92,.724],[1.16,.674],[1.34,.549],[1.42,.451],
    [1.49,.379],[1.60,.378],[1.626,.441],[1.712,.444],[1.749,.416]];
  const radius=profile(stations);
  function pot(a,h,lift=0){
    const r=radius(h)[0]+lift+.008*sin(4*a+.93*h)+.004*cos(7*a-1.8*h);
    return [cx+r*sin(a),h,cz+r*cos(a)];
  }
  // Uneven ash runs down from the rim. A thicker salt glaze gathers along
  // the shoulders, with buff stoneware exposed below the belly.
  const steps=56,cols=88,g=skinGeometry(steps,cols,(u,v)=>pot(tau*u,1.749*v),false,true);
  const colors=[],shade=new T.Color(),ochre=new T.Color('#a7876c'),green=new T.Color('#92a99a'),dark=new T.Color('#577873');
  for(let j=0;j<=steps;j++)for(let i=0;i<=cols;i++){
    const h=j/steps*1.749,a=i/cols*tau,edge=.643+.10*sin(a*4+.4)+.079*cos(a*7)-.23*Math.max(0,sin(3*a+.1))**8;
    shade.copy(ochre).lerp(green,T.MathUtils.smoothstep(h,edge-.02,edge+.025));
    shade.lerp(dark,.31+.12*sin(4*a+2*h)+.17*Math.max(0,cos(h*48))**5);
    colors.push(shade.r,shade.g,shade.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));s.add(g,'#fff');
  turned(s,'#68867e',cx,0,cz,[[.420,1.749],[.401,1.769],[.349,1.769],
    [.324,1.734],[.323,1.61],[.333,1.488],[.398,1.38],[.008,1.368]]);
  s.ball('#475852',cx,1.383,cz,.39,.018,.39);
  for(const h of [.11,.395,1.335,1.403,1.655,1.711]){
    const points=Array.from({length:51},(_,j)=>pot(tau*j/50,h,.004));
    line(s,h>1.6?'#9eac96':h<.5?'#8d735b':'#6e8c81',points,.013,50);
  }
  // A shoal drawn directly on the throwing profile: tail fork, a single
  // calligraphic gill stroke and scale crescents all follow the turning jar.
  for(let i=0;i<5;i++){
    const at=(x,y)=>pot(tau*i/5+x,.966+y+.044*sin(i*2),.012);
    const path=[[-.38,.025],[-.20,.151],[.043,.18],[.253,.103],[.335,.018],
      [.21,-.063],[.036,-.108],[-.206,-.078],[-.381,-.01],[-.508,-.114],[-.483,.137],[-.38,.025]];
    line(s,'#566e67',path.map(p=>at(...p)),[.007,.014,.022,.012,.009,.014,.016,.012,.01,.013,.015,.007],23);
    nib(s,[[.145,.133],[.102,.078],[.11,0],[.166,-.072]].map(p=>at(...p)),.016,'#566961');
    s.ball('#4c6059',...at(.214,.052),.021,.018,.014);
    for(let j=0;j<3;j++)nib(s,[[-.178+.113*j,.082],[-.218+.113*j,.035],[-.159+.113*j,-.003]].map(p=>at(...p)),.008,'#688077');
  }
  // A fishing kingfisher listens at the jar mouth. Short feet curl over
  // its rolled lip and the bill points down into the dark interior.
  setPiece(s,b=>{
    const blue='#69858b',orange='#b48362';
    inkVolume(b,[[0,.143,-.317,.037,.025],[0,.195,-.137,.12,.144],
      [0,.272,.007,.162,.201],[0,.341,.142,.13,.151]],orange,16);
    b.ball(blue,0,.410,.159,.169,.161,.174);
    for(const side of [-1,1]){
      relief(b,[[side*.104,.326,.083],[side*.154,.361,-.041],[side*.134,.278,-.22],
        [side*.073,.13,-.399],[side*.081,.213,-.145]], [side*.204,.276,-.068],blue);
      nib(b,[[side*.133,.43,.284],[side*.175,.435,.205],[side*.15,.405,.136]],.017,paper);
      b.ball(soot,side*.129,.421,.249,.030,.032,.028);
      line(b,slip,[[side*.063,.117,.027],[side*.07,.036,.010],[side*.08,.020,.081]],.021);
      nib(b,[[side*.072,.204,-.21],[side*.101,.177,-.301],[side*.073,.132,-.405]],.015,iron);
    }
    line(b,iron,[[0,.405,.256],[0,.388,.365],[0,.327,.619]],[.070,.052,.001],10);
  },cx+.301,1.765,cz-.156,1.02,-1.43,.19);
  // Slipped lid, lent little feet by a rush cushion to stop it rolling.
  turned(s,reed,.867,.069,.207,[[.061,0],[.325,.024],[.363,.068],[.297,.107],[.07,.114]],1,1,.78);
  turned(s,'#90a496',.866,.145,.112,[[.017,0],[.326,.023],[.391,.072],[.385,.116],
    [.235,.154],[.142,.177],[.086,.197],[.085,.256],[.045,.287],[.014,.291]],1.12,1.12,1.12,-.20);
}

function snowMonkeys(s){
  function drift(x,y,z,w,h,d,angle){
    const g=new T.IcosahedronGeometry(1,1);
    s.add(g,'#828a87',x,y,z,w,h,d,.13,angle,.053);
    s.add(g,'#e6ebe0',x-.017,y+h*.539,z-.032,w*.96,h*.57,d*.96,.095,angle,.051);
  }
  drift(-.77,.194,-.126,.70,.28,.47,.35);
  drift(.39,.107,-.13,.72,.23,.57,-.46);
  drift(1.045,.19,-.271,.56,.42,.443,.56);
  function macaque(b,arms,young=false){
    const fur=young?'#bbad96':'#ac9d89',face=young?'#c28d78':'#b98478',whisk='#d6c7ab';
    inkVolume(b,[[0,.106,-.049,.164,.205],[0,.236,-.069,.36,.306],[0,.51,-.077,.352,.329],
      [0,.756,-.089,.304,.273],[0,.962,-.027,.278,.229],[0,1.161,.021,.202,.194]],fur,22);
    // The swept ruff leaves a heart-shaped bare face. The bridge, muzzle
    // and lowered lids have distinct heights under the brow.
    sierraHead(b,fur,whisk,face);
    for(const side of [-1,1]){
      b.ball(fur,side*.294,.257,-.024,.211,.23,.269,.06,side*.15);
      b.ball(face,side*.237,.105,.172,.10,.065,.155);
      const hand=arms[side>0?1:0];
      line(b,fur,[[side*.241,.864,.040],[side*.364,.615,.062],[hand[0],hand[1]+.053,hand[2]-.05]], [.132,.105,.071],12);
      b.ball(fur,hand[0],hand[1]+.043,hand[2]-.056,.078,.087,.090,.21,side*.27);
      b.ball(face,...hand,.078,.065,.100,.21,side*.27);
      for(let k=0;k<3;k++){
        const yy=.75-k*.12;
        nib(b,[[side*.27,yy+.107,.113],[side*(.32+.022*k),yy+.017,.12],
          [side*(.34+.016*k),yy-.049,.096]],.012,'#c0b29a');
      }
      for(let j=-1;j<=1;j++)nib(b,[[hand[0]+j*.025,hand[1]+.04,hand[2]+.036],
        [hand[0]+j*.025,hand[1]+.028,hand[2]+.073],[hand[0]+j*.026,hand[1]+.014,hand[2]+.087]],.004,smoke);
    }
  }
  function sierraHead(b,fur,whisk,face){
    b.ball(fur,0,1.233,.051,.274,.32,.260,-.08);
    for(let i=-4;i<=4;i++){
      const x=i*.04,y=1.475-.061*(i/4)**2;
      nib(b,[[x*.69,y-.037,.175],[x*.95,y+.017,.162],[x*1.15,y+.053,.107],
        [x*1.33+.019,y+.047,.051]],.022,i%3===0?'#b7ab97':whisk);
    }
    b.ball(face,0,1.203,.254,.20,.223,.105);
    b.ball(face,0,1.124,.331,.133,.099,.081);
    b.ball('#966e62',0,1.203,.364,.064,.055,.037);
    for(const side of [-1,1]){
      b.ball(fur,side*.235,1.243,.021,.077,.098,.064,0,side*.27);
      b.ball(face,side*.285,1.246,.056,.024,.059,.041);
      b.ball(face,side*.108,1.267,.292,.099,.079,.057,0,side*.40);
      nib(b,[[side*.055,1.264,.351],[side*.099,1.244,.365],[side*.131,1.242,.347],[side*.157,1.257,.327]],.014);
      nib(b,[[side*.051,1.300,.343],[side*.10,1.317,.331],[side*.157,1.31,.319]],.012,'#8b7060');
      b.ball(soot,side*.032,1.199,.393,.013,.008,.009);
      for(let j=0;j<8;j++){
        const y=1.417-.043*j,x=.136+.085*sin(PI*(j+.4)/8),z=.18+.023*sin(j*.54);
        nib(b,[[side*(x-.035),y,z+.06],[side*x,y-.009,z+.037],
          [side*(x+.041),y-.039,z],[side*(x+.062),y-.056,z-.071]],.026-j*.0016,j%3===1?fur:whisk);
      }
    }
    nib(b,[[-.068,1.107,.394],[-.024,1.096,.410],[.018,1.096,.410],[.061,1.105,.395]],.008);
  }
  setPiece(s,b=>macaque(b,[[-.125,.553,.454],[.236,.654,.367]]),-.315,.222,-.068,1.14,.18);
  setPiece(s,b=>macaque(b,[[-.071,.735,.312],[.162,.543,.328]],true),-.04,.338,.228,.55,-.54,-.09);
  // The discarded towel folds over a warm stone, its indigo stripes breaking
  // as the hem turns down the front face.
  const towel=(u,v)=>[.797+.52*u,.64-.205*v**2-.053*sin(PI*u)+.022*cos(3*PI*u)*v,
    -.206+.435*v+.016*cos(u*PI*3)];
  surface(s,paper,9,18,towel);
  for(const t of [.794,.906])surface(s,'#6e8084',2,18,(u,v)=>{
    const [x,y,z]=towel(u,t+.027*v);return [x,y+.004,z+.002];
  });
  // A wind-shaped pine. Snow breaks into pads at the ends of each spray;
  // dark needle tufts show along the underside of the loaded branches.
  const trunk=[[-1.24,.06,-.36],[-1.17,.42,-.35],[-1.29,.83,-.39],
    [-1.181,1.112,-.34],[-1.24,1.41,-.36],[-1.11,1.68,-.35]];
  line(s,wood,trunk,[.081,.068,.059,.043,.031,.011],21);
  for(const [level,dx,dy] of [[1,-.43,.21],[2,.35,.18],[3,-.34,.22],[4,.25,.21],[5,-.18,.075]]){
    const [x,y,z]=trunk[level],dir=Math.sign(dx),fork=[x+.62*dx,y+.044,z+.022];
    line(s,wood,[[x,y,z],fork,[x+dx,y+dy,z+.04]],[.038,.025,.008],9);
    for(let j=0;j<3;j++){
      const xx=x+dx+.078*dir*(j-1),zz=z+(j-1)*.088,yy=y+dy+.039*sin(j*2.72+level);
      line(s,wood,[fork,[xx-.075*dir,yy-.063,zz],[xx,yy,zz]],[.016,.012,.003],7);
      s.ball('#6e7d70',xx,yy,zz,.134,.049,.104,.17*j,.42*j,.061*dir);
      s.ball('#e0e6d9',xx-.012,yy+.024,zz-.008,.126,.060,.089,-.14*j,.42*j,.061*dir);
      for(let k=0;k<4;k++){
        const a=k*1.71+.42*j;
        line(s,'#647467',[[xx+.043*cos(a),yy,zz+.03*sin(a)],
          [xx+.098*cos(a),yy-.025,zz+.071*sin(a)],[xx+.16*cos(a),yy-.057,zz+.114*sin(a)]],
          [.010,.009,.001],4);
      }
    }
  }
}

const scenes={dawn:dawnFan,capital:inkstone,peach:peachGourd,temple:templeLotus,
  inari:inariBend,tsuruga:harborBoat,sakai:sakaiKiln,snow:snowMonkeys};

export function pilgrimageBathArt(s,kind) {
  scenes[kind](s);
}
