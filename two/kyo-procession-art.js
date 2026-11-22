import { inkVolume } from './scroll-sculpt.js';
import { batchActorParts as paint, makeNPC } from './actors.js';
import { illustratedMesh,scrollPigment } from './kyo-scrollwork.js';

const {sin,cos,PI}=Math,TAU=2*PI;
const rust='#a15a45',gold='#c7a169';

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
