import { SAZAE_BATH } from './ryugu-layout.js';

// All heights are measured up from the palace boards. The outer steps cross
// the turned lip, then three submerged treads descend to the pearl seat.
export const SAZAE_SPRING = {
  ...SAZAE_BATH, id:'ryugu-sazae', name:'栄螺の壺湯', kind:'sazae', region:'ryugu',
  rank:'main', rx:1.36, rz:1.22, level:SAZAE_BATH.y,
};
export const SAZAE_POOL = {
  id:'sazae-mouth', u:0, v:0, rx:1.36, rz:1.22, y:.97, depth:.67, seatY:.30,
  shape:'round', heading:0, action:'jar', name:'栄螺の壺湯', label:'殻口に身を沈める',
  message:'真珠色の殻口に身を沈めると、湯の底から潮騒が聞こえた。',
};
export const SAZAE_POOLS = [SAZAE_POOL];
export const SHELL_STEPS = [
  {v:2.88,w:1.36,d:.57,h:.20}, {v:2.41,w:1.31,d:.54,h:.42},
  {v:1.98,w:1.26,d:.50,h:.64}, {v:1.59,w:1.23,d:.46,h:.85},
  {v:1.23,w:1.21,d:.42,h:1.06}, {v:.91,w:1.19,d:.37,h:.85},
  {v:.62,w:1.14,d:.34,h:.64}, {v:.36,w:1.11,d:.32,h:.43},
];

export function addSazaeBathSolids(put) {
  const {x,z,y,yaw}=SAZAE_SPRING,c=Math.cos(yaw),s=Math.sin(yaw);
  function solid(u,v,w,d,top,kind,support,turn=0) {
    put(x+u*c+v*s,z-u*s+v*c,w/2,d/2,yaw+turn,y+top,kind,support,0,y);
  }
  for(const step of SHELL_STEPS)solid(0,step.v,step.w,step.d,step.h,'box',true);
  solid(0,0,2.51,2.26,.30,'oval',true);
  // The broad spiral bulges behind the opening and narrows toward the apex.
  solid(-1.26,-1.39,2.40,2.0,1.98,'oval',false,-.34);
  solid(-2.17,-1.65,1.12,1.15,2.36,'oval',false);
  solid(1.71,-.79,1.14,.52,1.39,'oval',false,-.38);
  solid(1.85,.65,1.24,.12,.93,'box',false,-.28);
  for(let i=0;i<26;i++) {
    const a=i*Math.PI*2/26,u=1.46*Math.cos(a),v=1.32*Math.sin(a);
    if(v>0 && Math.abs(u)<.88)continue;
    solid(u,v,.45,.22,1.37-.12*Math.sin(a),'box',false,
      Math.atan2(-1.32*Math.cos(a),-1.46*Math.sin(a)));
  }
}
