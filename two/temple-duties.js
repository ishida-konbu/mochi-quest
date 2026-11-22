import { KIYOMIZU } from './kiyomizu-layout.js';

export const TEMPLE_MONKS = [
  {duty:'sweep', name:'舞台を掃く小僧餅', size:.89, face:2},
  {duty:'sutra', name:'経を繰る読経餅', size:1.03, face:3},
  {duty:'beads', name:'数珠を携えた巡堂餅', size:.96, face:0},
  {duty:'bell', name:'鐘を守る僧餅', size:1.04, face:1},
];

export function templeMonkPose(monk,time,out={}) {
  let u,v,yaw;
  out.stride=0;
  switch(monk.duty){
    case 'sweep':
      u=-10.8; v=5.8; yaw=-.88;
      break;
    case 'sutra':
      u=-10.5; v=-7.8; yaw=Math.PI*.42;
      break;
    case 'beads': {
      // Keep the walking meditation beside the approach, clear of its entrance
      // and the belfry columns even while the monk turns at either end.
      const t=time*.115;
      const dx=.55*Math.cos(t), dz=-4.1*Math.sin(t);
      u=-4.2+.55*Math.sin(t); v=-19+4.1*Math.cos(t);
      yaw=Math.atan2(dx,dz);
      out.stride=Math.sin(5.4*time)*Math.hypot(dx,dz)/4.1;
      break;
    }
    case 'bell':
      u=-1; v=-23.7; yaw=Math.PI;
      break;
  }
  out.x=KIYOMIZU.x+u; out.y=KIYOMIZU.floor; out.z=KIYOMIZU.z+v; out.yaw=yaw;
  return out;
}
