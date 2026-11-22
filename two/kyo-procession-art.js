import * as T from './vendor/three.module.min.js';
import { inkVolume } from './scroll-sculpt.js';
import { batchActorParts as paint, makeNPC } from './actors.js';
import { illustratedMesh,scrollPigment } from './kyo-scrollwork.js';

const {sin,cos,PI}=Math,TAU=2*PI,ink='#403a35';
const fur='#a08f78',light='#c4b59b',rust='#a15a45',gold='#c7a169';
function furStroke(b,points,r=.014,col='#796958'){b.stroke(points,r,col,Math.max(6,points.length*3),4);}
// Place dry-brush accents on the actual triangles of the hide. Their width tapers to
// nothing at each end, even across the shoulder where the cross-section is steep.
function washHide(b,stations,base,rows,marks) {
  inkVolume({add(g,color){
    b.add(g,color);
    const pos=g.attributes.position,normal=g.attributes.normal,pts=[],ix=[];
    const acc=new T.Vector3(),vertex=new T.Vector3(),n=new T.Vector3();
    function spot(t,theta) {
      const v=Math.min(rows-.0001,t*rows),q=((theta/TAU+1)%1)*16,
        iv=Math.floor(v),iu=Math.floor(q),dv=v-iv,du=q-iu;
      const a=iv*16+iu,bb=iv*16+(iu+1)%16,cc=a+16,dd=bb+16;
      const ids=du+dv<=1?[a,bb,cc]:[dd,cc,bb];
      const weights=du+dv<=1?[1-du-dv,du,dv]:[du+dv-1,1-du,1-dv];
      acc.set(0,0,0);
      for(let k=0;k<3;k++){
        vertex.fromBufferAttribute(pos,ids[k]);n.fromBufferAttribute(normal,ids[k]);
        vertex.addScaledVector(n,.0052);acc.addScaledVector(vertex,weights[k]);
      }
      return [acc.x,acc.y,acc.z];
    }
    for(const side of [1,-1])for(const [t,a,dt,da,bow,width] of marks){
      const first=pts.length/3;
      for(let j=0;j<=9;j++){
        const v=j/9,curve=Math.sin(v*PI),tt=t+dt*v;
        for(const edge of [-1,1]){
          const angle=a+da*v+bow*curve+edge*width*(.03+.97*curve);
          pts.push(...spot(tt,side===1?angle:PI-angle));
        }
        if(j<9){const off=first+2*j;ix.push(off,off+1,off+2,off+1,off+3,off+2);}
      }
    }
    const pigment=new T.BufferGeometry();
    pigment.setAttribute('position',new T.Float32BufferAttribute(pts,3));pigment.setIndex(ix);
    pigment.computeVertexNormals();b.add(pigment,'#61584e');pigment.dispose();
  }},stations,base,rows);
}
export function pullingOx(b, reins=true) {
  // A single continuous hide follows the barrel, shoulders and lifted nape.
  washHide(b,[[0,1.04,1.96,.036,.10],[0,1.10,2.09,.28,.37],[0,1.12,2.31,.453,.53],
    [0,1.10,2.60,.492,.55],[0,1.12,2.95,.51,.57],[0,1.18,3.21,.493,.595],
    [0,1.27,3.46,.38,.52],[0,1.41,3.68,.29,.37],[0,1.51,3.84,.18,.22]],fur,50,[
    [.2,.76,.13,-.32,.09,.018],[.23,.65,.095,-.26,.03,.014],[.212,.42,.081,-.16,.08,.012],
    [.52,-.42,.10,.33,-.02,.018],[.55,-.37,.07,.26,-.02,.014],[.61,-.45,.06,.30,-.03,.012],
    [.65,.75,.06,-.84,.20,.024],[.68,.76,.044,-.57,.14,.014],[.712,.68,.032,-.46,.10,.013],
    [.34,-.51,.085,-.07,-.06,.012],[.37,-.61,.062,-.049,-.054,.011],
  ]);
  // The slanting brow tapers into a long, pale muzzle.
  washHide(b,[[0,1.51,3.58,.15,.18],[0,1.59,3.69,.25,.30],[0,1.65,3.86,.315,.322],
    [0,1.59,4.04,.281,.282],[0,1.49,4.22,.21,.224],[0,1.39,4.42,.21,.129]],fur,33,[
    [.42,.55,.09,-.33,-.05,.024],[.46,.53,.09,-.29,-.03,.019],[.51,.49,.08,-.22,-.02,.014],
    [.50,-.19,.18,-.29,-.04,.020],[.58,-.19,.14,-.22,-.02,.014],
  ]);
  b.ball(0,1.393,4.394,.232,.142,.185,'#c9b8a0',[-.15,0,0]);
  b.stroke([[-.168,1.354,4.51],[-.07,1.333,4.54],[.06,1.335,4.55],[.159,1.35,4.516]],.009,ink);
  for(const side of [-1,1]){
    b.ball(side*.110,1.416,4.533,.045,.026,.018,ink,[0,side*.15,-side*.18]);
    b.ball(side*.282,1.682,3.992,.054,.051,.068,'#695b4b');
    b.ball(side*.309,1.69,4.003,.029,.027,.035,'#292824');
    b.ball(side*.331,1.703,4.016,.009,.008,.010,'#eee1ba');
    furStroke(b,[[side*.23,1.765,4.04],[side*.284,1.76,3.99],[side*.303,1.734,3.91]],.014,ink);
    b.ball(side*.354,1.736,3.77,.211,.068,.096,fur,[0,side*.17,side*.37]);
    b.ball(side*.432,1.761,3.802,.096,.027,.051,'#83725f',[0,side*.23,side*.29]);
    const horn=[[side*.209,1.855,3.79,.095,.097],[side*.324,1.937,3.776,.081,.079],
      [side*.454,2.023,3.75,.060,.060],[side*.516,2.127,3.779,.036,.034],
      [side*.504,2.220,3.842,.016,.016],[side*.478,2.274,3.885,.002,.002]];
    inkVolume(b,horn,'#d1c0a0',24);
    inkVolume(b,horn.slice(-3),'#62574b',12);
    b.stroke([[side*.167,1.466,4.484],[side*.241,1.50,4.32],[side*.303,1.598,4.11],
      [side*.30,1.71,3.92],[side*.19,1.829,3.75]],.027,rust);
    if(reins)b.stroke([[side*.228,1.49,4.34],[side*.45,1.22,3.72],[side*.56,1.17,3.01],[side*.59,1.3,2.55]],
      .022,'#a58153');
  }
  for(let j=-4;j<=4;j++)
    furStroke(b,[[j*.026,1.915,3.79],[j*.030,1.94,3.86],[j*.033,1.915,3.945],[j*.032,1.865,4.017]],
      .010,j%2?'#5e554b':'#c9b9a0');
  const tail=[[-.029,1.394,2.14],[-.135,1.22,1.996],[-.174,.893,1.94],[-.244,.655,1.92],[-.35,.54,1.85]];
  b.stroke(tail,.038,'#8f7b61');
  b.ball(-.36,.50,1.84,.073,.141,.071,'#564d43',[0,0,-.38]);
  // A plaited breast collar carries inset bronze bells near the shoulder.
  const collar=[[0,1.802,3.16],[.301,1.684,3.19],[.471,1.437,3.25],[.447,1.219,3.39],
    [.352,.966,3.52],[.213,.85,3.55],[0,.811,3.56]];
  b.stroke([...collar.map(([x,y,z])=>[-x,y,z]),...collar.slice(0,-1).reverse()],.031,rust);
  for(const s of [-1,1]){
    b.rod([s*.433,1.115,3.427],[s*.433,1.037,3.427],.015,'#795744');
    b.ball(s*.433,1.01,3.427,.057,.065,.054,gold);
  }
}
export function oxLeg(b,side,front) {
  // The fore cannon falls straight from the knee. The hind shin turns at a
  // projecting hock before both pasterns lean forwards into the cloven hoof.
  const hock=front?-.014:-.096,knee=front?.026:.06;
  inkVolume(b,[[-side*.066,.43,-.03,.063,.082],[-side*.037,.294,-.022,.148,.163],
    [-side*.014,.145,-.015,.145,.154],[0,-.039,-.018,.119,.127],[side*.008,-.191,knee,.091,.097],
    [side*.011,-.285,knee,.089,.089],[side*.01,-.431,hock,.061,.072],
    [side*.005,-.57,hock+.013,.049,.054],[-side*.009,-.637,.006,.059,.064],
    [-side*.012,-.674,.036,.060,.067]],fur,38);
  for(const toe of [-1,1]){
    const x=toe*.035-side*.012;
    inkVolume(b,[[x,-.641,.039,.033,.055],[x,-.674,.051,.045,.077],
      [x+toe*.007,-.713,.067,.046,.088],[x+toe*.011,-.758,.082,.045,.106],
      [x+toe*.011,-.778,.082,.041,.10]],'#514b40',18);
  }
  furStroke(b,[[side*.087,-.19,knee+.012],[side*.086,-.259,knee+.032],
    [side*.073,-.324,knee+.01]],.007,'#736958');
}

export function courtCurtains(b){
  for(const side of [-1,1]){
    for(const end of [-1,1]){
      const z=end<0?-1.56:.51;
      b.stroke([[side*.96,2.823,z-end*.48],[side*1.025,2.72,z-end*.28],
        [side*1.025,2.48,z-end*.10],[side*.99,2.28,z]],.056,'#ab6856');
      b.ball(side*.99,2.20,z,.056,.095,.072,gold);
      for(let i=0;i<3;i++)b.stroke([[side*.99,2.18,z],[side*(1.02+i*.012),2.1,z+.013*i],
        [side*(1.03+i*.009),1.996,z+.024*i]],.011,rust);
    }
    // Gilt botanical roundels are laid into the lacquered lower boards.
    for(let j=0;j<5;j++){
      const z=-1.32+j*.41,x=side*.996,y=1.63;
      for(let k=0;k<5;k++){
        const a=k*TAU/5;
        b.ball(x,y+sin(a)*.049,z+cos(a)*.049,.009,.035,.038,gold,[a,0,0]);
      }
      b.ball(x+side*.008,y,z,.010,.020,.020,'#6e4836');
    }
    for(const y of [1.44,1.83])b.rod([side*.964,y,-1.65],[side*.964,y,.56],.024,gold);
  }
}
// A crouching deckhand propels the skiff with a sculling oar; the hand holding it
// and the oar are one moving pair so the grip stays closed on an uneven swell.
export function ferryCrew(root,index) {
  const type=index===1?'frog':'rabbit';
  const crew=makeNPC({id:'ferry-hand',type,role:'sailor'},root);
  crew.shadow.visible=false;
  const {mesh,limbs}=crew;
  mesh.scale.setScalar(.88);mesh.position.set(.075,.49,-2.12);
  mesh.rotation.y=-.80;
  const arm=limbs['arm1'],free=limbs['arm-1'];
  arm.rotation.x=-1.2;free.rotation.x=-.85;free.rotation.z=-.31;
  const oar=paint(arm,b=>{
    const hand=[.09,-.37,-.04],tip=[-.21,-1.65,1.07];
    b.rod([.235,.29,-.619],tip,.032,'#98774e',.046);
    inkVolume(b,[[tip[0],tip[1]+.12,tip[2]-.10,.042,.042],
      [tip[0]-.034,tip[1]-.09,tip[2]+.11,.054,.091],
      [tip[0]-.091,tip[1]-.43,tip[2]+.34,.035,.151],
      [tip[0]-.117,tip[1]-.59,tip[2]+.49,.019,.096]],'#b09569',16);
    b.ball(...hand,.045,.044,.054,'#c7b69a');
  },'櫓');
  oar.material=scrollPigment();
  const sail=illustratedMesh(root,3,'sail');
  sail.name='波越え兎の荷印';sail.position.set(0,2.345,-.54);sail.scale.set(1.87,1.55,1);
  return (time,near)=>{
    mesh.visible=near;
    if(!near)return;
    const s=sin(time*1.64+index*2), c=cos(time*1.64+index*2);
    limbs.torso.rotation.x=.11+.16*s;limbs.torso.rotation.z=.08*c;
    limbs['leg1'].rotation.x=-.17-.08*s;limbs['leg-1'].rotation.x=.15+.08*s;
    arm.rotation.x=-.74+.33*s;arm.rotation.z=-.24+.085*c;
    free.rotation.x=-.71+.24*s;limbs.head.rotation.y=.17+.22*c;
    for(const side of [-1,1]){
      const ear=limbs['筆穂耳'+side];if(ear)ear.rotation.z=side*(.048+.037*s);
    }
  };
}
