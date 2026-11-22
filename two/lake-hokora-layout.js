import { LAKE_HOKORA } from './snow-country.js';

export const HOKORA_BASE={x:0,z:0,width:4.0,depth:3.04,top:.54};
export const HOKORA_TREADS=[
  {x:0,z:2.32,width:1.58,depth:.40,top:.17},
  {x:0,z:1.91,width:1.66,depth:.43,top:.35},
  {x:0,z:1.57,width:1.73,depth:.28,top:.54},
];
export const HOKORA_ROOM={x:0,z:-.38,width:1.86,depth:1.35,top:2.69};
export const HOKORA_PINE={x:-3.30,z:-.43};
export const HOKORA_LANTERN={x:2.70,z:.67,radius:.46,height:1.19};
export const HOKORA_EAVES={ridgeZ:-.50,front:2.20,rear:1.16,halfRidge:1.40,halfEave:1.67,skin:.13};
export const roofReach=side=>side===1?HOKORA_EAVES.front:HOKORA_EAVES.rear;
export function hokoraRoofPoint(side,u,t){
  const e=HOKORA_EAVES;
  const half=e.halfRidge+(e.halfEave-e.halfRidge)*t;
  const rise=side===1?1.32:1.03;
  return [u*half,3.79-rise+rise*(1-t)**1.64+.115*Math.abs(u)**3*t**1.7,e.ridgeZ+side*roofReach(side)*t];
}
export function fromHokora(u,v){
  const {x,z,yaw}=LAKE_HOKORA;
  return [x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw)];
}
export function lakeHokoraSolids(put){
  const {y,yaw}=LAKE_HOKORA;
  function piece(u,v,width,depth,top,kind,support,bottom=0,rise=0,turn=0){
    const [x,z]=fromHokora(u,v);
    return put(x,z,width/2,depth/2,yaw+turn,y+top,kind,support,rise,y+bottom);
  }
  for(const s of [HOKORA_BASE,...HOKORA_TREADS])piece(s.x,s.z,s.width,s.depth,s.top,'floor',true,-.22);
  const room=HOKORA_ROOM;
  piece(room.x,room.z,room.width,room.depth,room.top,'wall',false,HOKORA_BASE.top);
  for(const u of [-1.04,1.04])piece(u,1.14,.13,.13,2.47,'box',false,.54);
  piece(HOKORA_PINE.x,HOKORA_PINE.z,.48,.44,1.41,'oval',false,-.14);
  const lamp=HOKORA_LANTERN;
  piece(lamp.x,lamp.z,.65,.65,.82,'oval',false,-.06);
  piece(lamp.x,lamp.z,lamp.radius*2,lamp.radius*2,lamp.height,'oval',false,.82);
  // Use the same bowed long front pitch and short back pitch as the carpenter.
  // Piecewise lean-to sheets retain an underside above the open porch.
  for(const side of [-1,1])for(let j=0;j<8;j++){
    const t0=j/8,t1=(j+1)/8;
    for(let k=0;k<4;k++){
      const u0=-1+k*.5,u1=u0+.5,u=(u0+u1)/2;
      const a=hokoraRoofPoint(side,u,t0),b=hokoraRoofPoint(side,u,t1);
      const left=hokoraRoofPoint(side,u0,(t0+t1)/2)[0],right=hokoraRoofPoint(side,u1,(t0+t1)/2)[0];
      const sheet=piece((left+right)/2,(a[2]+b[2])/2,right-left,Math.abs(b[2]-a[2]),
        b[1],'roof',true,b[1]-HOKORA_EAVES.skin,a[1]-b[1],side===1?0:Math.PI);
      sheet.form='leanTo';sheet.thickness=HOKORA_EAVES.skin;
    }
  }
}
