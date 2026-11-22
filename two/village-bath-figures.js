// Small bankside carvings. Tapering sumi lines lie on the forms themselves,
// including inside the ears, across the jowls and between the webbed toes.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { inkVolume } from './scroll-sculpt.js';

const {sin,cos,PI}=Math;
export const ink='#423c33',bone='#e4d6b7',lichen='#a3a17c',wood='#947454',reed='#c2aa7b';
const darkFur='#8d806c',belly='#d1c7a7';

export function surface(cols,rows,sample,tone){
  const vertices=[],indices=[],colors=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows,point=sample(u,v);
    vertices.push(...point);
    if(tone){const c=tone(u,v,point);colors.push(c.r,c.g,c.b);}
    if(i<cols && j<rows){
      const a=i+(cols+1)*j,b=a+cols+1;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
  }
  const g=new T.BufferGeometry();
  g.setIndex(indices);g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  if(tone)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();return g;
}
export function rod(s,paint,a,b,r,tip=r){
  s.stroke(paint,[a,a.map((n,i)=>(n+b[i])*.5),b],[r,(r+tip)*.5,tip],4);
}
const pebbleGeometry=new T.SphereGeometry(1,8,6);
export function dab(s,col,x,y,z,w,h,d,pitch=0,yaw=0,roll=0){
  s.add(pebbleGeometry,col,x,y,z,w,h,d,pitch,yaw,roll);
}
export function turning(s,tint,x,y,z,rows,segments=40,pitch=0,yaw=0,roll=0){
  const g=new T.LatheGeometry(rows.map(([r,h])=>new T.Vector2(r,h)),segments);
  s.add(g,tint,x,y,z,1,1,1,pitch,yaw,roll);
}

function hareMask(s){
  inkVolume(s,[[0,.005,-.25,.017,.025],[0,.045,-.18,.17,.19],
    [0,.07,-.045,.225,.231],[0,.055,.112,.205,.177],[0,.033,.239,.137,.108],
    [0,.040,.339,.069,.062],[0,.057,.364,.029,.027]],bone,23);
  for(const side of [-1,1]){
    s.ball('#c9b99c',side*.043,.001,.302,.063,.050,.066);
    s.stroke(ink,[[side*.018,.021,.357],[side*.047,-.009,.346],[side*.088,-.020,.305],
      [side*.111,-.004,.261]],[.007,.009,.007,.002],7);
    const eye=[[side*.207,.097,.124],[side*.197,.12,.147],[side*.178,.128,.169],[side*.163,.114,.19]];
    s.stroke(ink,eye,[.003,.014,.017,.003],9);
    dab(s,ink,side*.183,.111,.165,.019,.024,.019);
    dab(s,'#efdfbe',side*.193,.121,.171,.007,.006,.006);
    for(let j=0;j<3;j++)s.stroke(darkFur,[[side*(.111+j*.008),.021-j*.012,.270],
      [side*(.176+j*.008),.035-j*.017,.283],[side*(.253+j*.009),.065-j*.032,.264-j*.008]],
      [.002,.005,.0008],6);
    function ear(u,t,inset=0){
      const a=2*PI*u, arch=sin(PI*t)**.7, w=.019+.072*arch;
      return [side*(.105+.155*t+.095*t*t)+cos(a)*w*(1-inset),
        .168+.48*t+(side===1?.16:.025)*t+.082*arch,
        -.095-.37*t-.054*t*t+sin(a)*(.012+.043*arch)+inset*.026];
    }
    s.add(surface(14,19,(u,v)=>ear(u,v)),bone);
    const inside=(u,v)=>{
      const t=.09+.84*v,q=sin(v*PI)**.82*(u-.5)*.38;
      const p=ear(.25+q,t);p[2]+=.009;return p;
    };
    s.add(surface(6,15,inside),'#ad9682');
    s.stroke(darkFur,Array.from({length:7},(_,i)=>inside(.18,.05+i*.14)),[.001,.006,.005,.005,.004,.003,.001],12);
  }
  dab(s,ink,0,.064,.364,.042,.023,.023);
}
function frogMask(s){
  inkVolume(s,[[0,0,-.227,.016,.024],[0,.036,-.15,.236,.13],
    [0,.046,-.027,.322,.171],[0,.058,.099,.306,.139],[0,.064,.205,.249,.084],
    [0,.044,.292,.133,.044],[0,.044,.317,.018,.012]],lichen,22);
  inkVolume(s,[[0,-.04,-.14,.105,.079],[0,-.067,-.01,.241,.135],[0,-.061,.11,.250,.103],
    [0,-.008,.24,.176,.049],[0,.022,.309,.033,.013]],belly,14);
  for(const side of [-1,1]){
    s.ball(lichen,side*.202,.142,.057,.097,.112,.100);
    s.ball('#decfaa',side*.219,.170,.125,.071,.075,.046);
    dab(s,ink,side*.224,.178,.16,.044,.030,.019);
    dab(s,'#ede0bd',side*.232,.189,.174,.009,.009,.005);
    s.stroke('#655f4b',[[side*.288,.170,.089],[side*.258,.228,.106],[side*.210,.244,.102],
      [side*.154,.209,.116]],[.002,.012,.014,.003],9);
    s.stroke('#514e3a',[[side*.30,-.016,.004],[side*.283,-.015,.109],[side*.216,.011,.225],
      [side*.104,.027,.296],[0,.033,.316]],[.003,.014,.011,.008,.004],11);
    dab(s,'#6c7055',side*.111,.101,.237,.018,.010,.011);
  }
}
const masks={};
function mask(kind){
  if(!masks[kind]){
    const s=sculpture();(kind==='hare'?hareMask:frogMask)(s);masks[kind]=s.finish();
  }
  return masks[kind];
}

// Hands are specified in the finished scene so an oar, jar rim or sickle can
// pass exactly between the fingers irrespective of the figure's pose and size.
export function bather(scene,kind,{x=0,y=0,z=0,scale=1,yaw=0,gaze=0,nod=0,reach=[],squat=0,cloth='#7b8278'}={}){
  const s=sculpture(),hare=kind==='hare',skin=hare?bone:lichen,lean=.095*squat,drop=squat*.27;
  const shoulders=.95-drop,skull=1.19-drop,hip=.43-drop*.58;
  inkVolume(s,[[0,hip-.14,-.125,.066,.067],[0,hip-.02,-.12,.245,.245],[0,hip+.19,-.09,.225,.232],
    [0,shoulders-.18,.035+lean,.194,.158],[0,shoulders,.089+lean,.197,.145],[0,skull-.054,.11+lean,.102,.097]],
    skin,20,kind==='hare'?'hare':'frog');
  if(hare)s.ball('#eee2c4',0,hip+.024,-.344,.095,.105,.089,.20);
  s.add(mask(kind),'#fff',0,skull,.13+lean,1,1,1,nod,gaze);
  // A narrow, knotted sash catches the figure at its waist.
  const beltY=hip+.24;
  s.add(surface(25,3,(u,v)=>{
    const a=-u*2*PI;
    return [.233*cos(a),beltY+.067*v-.029*sin(a),-.075+.218*sin(a)];
  }),cloth);
  dab(s,cloth,-.22,beltY+.028,-.034,.085,.058,.061,0,.24,-.36);
  s.stroke(cloth,[[-.23,beltY+.024,-.038],[-.275,beltY-.075,-.056],[-.256,beltY-.174,-.093]], [.035,.045,.014],7);
  for(const side of [-1,1]){
    const forward=side===1?.09:-.08;
    const thigh=[side*.155,hip+.075,-.096],knee=[side*(.263+squat*.11),hip-.13,.105+forward],
      heel=[side*(.23+squat*.14),.084,-.082+forward];
    inkVolume(s,[[...thigh,.070,.079],
      [side*.237,hip+.034,-.073,.141,.151],[...knee,.099,.107],
      [side*(.229+squat*.11),.155,-.04+forward,.067,.078],[...heel,.05,.052]],skin,15);
    const toe=[heel[0]+side*.034,.036,heel[2]+(hare?.242:.157)];
    inkVolume(s,[[...heel,.052,.050],[heel[0],.058,heel[2]+.059,.066,.051],
      [toe[0],toe[1]+.009,toe[2]-.046,.079,.035],[...toe,.028,.018]],skin,10);
    if(!hare)for(let i=-1;i<=1;i++){
      s.stroke(skin,[[toe[0],.039,toe[2]-.034],[toe[0]+i*.045,.028,toe[2]+.060],
        [toe[0]+i*.083,.026,toe[2]+.152-.031*Math.abs(i)]],[.024,.016,.010],6);
    }
    const goal=reach[side<0?0:1],dx=goal?(goal[0]-x)/scale:0,dz=goal?(goal[2]-z)/scale:0;
    const hand=goal?[dx*cos(yaw)-dz*sin(yaw),(goal[1]-y)/scale,dx*sin(yaw)+dz*cos(yaw)]
      :[side*.242,hip+.18,.179];
    const shoulder=[side*.156,shoulders,.083+lean],elbow=[side*.305+.49*hand[0],
      shoulders*.46+hand[1]*.54-.11,.083+hand[2]*.38];
    inkVolume(s,[[...shoulder,.091,.097],[...elbow,.069,.072],
      [hand[0]*.81+elbow[0]*.19,hand[1]*.81+elbow[1]*.19,hand[2]*.81+elbow[2]*.19,.051,.054],
      [...hand,.05,.051]],skin,13);
    dab(s,skin,...hand,.067,.067,.066);
    for(let i=-1;i<=1;i++)s.stroke(skin,[[hand[0]+i*.024,hand[1]+.020,hand[2]+.03],
      [hand[0]+i*.031,hand[1]-.010,hand[2]+.071],[hand[0]+i*.029,hand[1]-.048,hand[2]+.056]],
      [.019,.017,.009],6);
  }
  scene.add(s.finish(),'#fff',x,y,z,scale,scale,scale,0,yaw);
}
