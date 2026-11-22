import { WORLD_BOUND } from './geography.js';
import { SEAWAYS } from './ocean-voyage.js';
import { portReserved } from './seaport-layout.js';

// Shoals cluster along submarine ridges. Each head is anchored well below the
// tide; the navigable channels have at least a full hull of clearance.
export function offshoreReefs(bed,coast,random){
  const reefs=[];
  const span=2*WORLD_BOUND;
  const distance=(a,b)=>Math.min(Math.abs(a-b),Math.abs(span-Math.abs(a-b)));
  const centers=[[568,-1444],[447,-1482],[181,-1468],[-16,-1418],[-210,-1431],[-385,-1285],
    [-940,-1279],[931,-1178],[983,-948],[593,-1533],[69,-1505],[792,-988],[598,-1103],[154,-1112],[-76,-1101],[-780,-1114],
    [-1010,-972],[-823,-755],[-916,-600],[-730,-539],[-499,-539],[-390,-606],
    [-298,-568],[-1141,-288],[-1096,-83],[-950,52],[-899,282],[-1085,436],
    [-763,527],[-616,639],[-869,808],[-706,962],[-488,1086],[-214,859],
    [47,973],[248,1059],[395,1108],[707,946],[822,668],[902,539],[1044,333],
    [722,132],[572,-99],[830,-227],[998,-509],[569,-777],[419,-1034],[341,-1101]];
  for(const [cx,cz] of centers){
    const yaw=random()*2*Math.PI;
    for(let k=0;k<7;k++){
      const a=k*2.40+random()*.43,r=(2+4*k)*(.7+.37*random());
      const x=cx+r*Math.cos(a),z=cz+r*Math.sin(a),y=bed(x,z);
      const large=k<2,rx=(large?4.4:1.35)*(1+random()),rz=rx*(.51+.38*random());
      if(y>-.9||coast(x,z)>-9||portReserved(x,z))continue;
      if(SEAWAYS.some(lane=>lane.points.some(q=>distance(q[0],x)<rx+17 && distance(q[1],z)<rx+17)))continue;
      const top=large?2.9+5.5*random():.47+1.36*random();
      reefs.push({x,z,rx,rz,h:top-y,yaw:yaw+.17*random(),stratum:k%4,tint:k%2?'#c1bab0':'#a9b2a3',reef:true,top});
    }
  }
  return reefs;
}
