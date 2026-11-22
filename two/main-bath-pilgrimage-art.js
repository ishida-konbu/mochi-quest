// Bank-side tableaux, in metres. The front edge of the stage faces the water.
// Colour and the tapered marks are baked into each sculpture's single mesh.
import * as T from './vendor/three.module.min.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';
import { inkVolume } from './scroll-sculpt.js';
import { skinGeometry } from './ryugu-sculpt.js';
import { weddingVisage } from './wedding-visages.js';

const {PI,sin}=Math;
const soot='#3b3731',iron='#474a47',brass='#bc985e';
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
  if(kind==='inari')inariBend(s);
}
