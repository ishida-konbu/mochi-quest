// The same outline sets the carved front bargeboard and the swimming contact.
export const TIDE_PORCH={u:0,v:-5.85,w:15.6,d:5.9};
export function tidePorchHeight(u,v) {
  const roof=TIDE_PORCH,x=Math.abs(2*u/roof.w),t=(v-roof.v)/roof.d+.5;
  if(x>1.00001 || t<-.00001 || t>1.00001)return -Infinity;
  return 6.20+2.35*Math.exp(-6.3*x*x)+.41*x**5+.77*(1-t);
}
// Sparse furniture sits in alcoves. The long central crossing stays clear.
export const PALACE_SCREENS=[
  {u:10.7,v:-34.9,h:4,width:5.5,height:2.14,angle:-.19},
  {u:-8.95,v:-32.0,h:14,width:4.85,height:1.83,angle:.36}
];
export function screenLeaves(screen){
  const count=6,length=screen.width/count,bends=[.51,-.51,.51,-.51,.51,-.51];
  let x=screen.u-screen.width*Math.cos(screen.angle)*Math.cos(.51)/2;
  let z=screen.v+screen.width*Math.sin(screen.angle)*Math.cos(.51)/2;
  return bends.map(bend=>{
    const angle=screen.angle+bend,dx=length*Math.cos(angle),dz=-length*Math.sin(angle);
    const leaf={u:x+dx/2,v:z+dz/2,angle,w:length};
    x+=dx;z+=dz;return leaf;
  });
}
export const PEARL_LAMPS=[[ -7.1,-26.9,14 ],[ 3.1,-26.9,14 ],[7.5,-34.5,4]];
export const PALACE_TABLES=[[0,-36.85,9,4.46,.9],[10.6,-32.8,4,3.12,1.05]];
