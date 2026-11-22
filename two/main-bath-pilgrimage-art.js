// Bank-side tableaux, in metres. The front edge of the stage faces the water.
// Colour and the tapered marks are baked into each sculpture's single mesh.
import * as T from './vendor/three.module.min.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';
import { inkVolume } from './scroll-sculpt.js';
import { skinGeometry } from './ryugu-sculpt.js';
import { weddingVisage } from './wedding-visages.js';

const {PI,sin,cos,abs}=Math, tau=2*PI;
const soot='#3b3731', smoke='#6b6253', paper='#ede1c6', iron='#474a47';
const ivory='#dfd4b9', brass='#bc985e', wood='#82694c';
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

export function pilgrimageBathArt(s,kind) {
  if(kind==='capital')inkstone(s);
  if(kind==='inari')inariBend(s);
}
