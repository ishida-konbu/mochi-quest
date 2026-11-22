// Signed metres in the inkstone's own frame, relative to the still surface.
// The inkstone is cut from the street (+v) side. Its back is a grinding land,
// with an ink well in front and to the right and a shallow left-hand ledge.
const {PI,cos,sin,abs,max,min,exp}=Math;
const clamp=t=>min(1,max(0,t));
const ease=t=>{const x=clamp(t);return x*x*(3-2*x);};
export const OKA={left:-4.24,right:1.73,back:-3.09};
export const SUZURI_WELL={u:1.92,v:.13,rx:1.69,rz:1.47,depth:1.24};
export const ENTRY_TREADS=[
  {v:3.20,w:1.70,d:.43,h:.038},{v:2.80,w:1.64,d:.41,h:-.104},
  {v:2.41,w:1.60,d:.40,h:-.247},{v:2.03,w:1.55,d:.39,h:-.388},
  {v:1.66,w:1.50,d:.38,h:-.529},{v:1.30,w:1.46,d:.37,h:-.67}
];
export function okaFront(u){
  const a=clamp((u-OKA.left)/(OKA.right-OKA.left));
  const shoulder=sin(PI*a)**.74;
  return -2.94+2.03*shoulder+.071*sin(2*PI*a)+.059*sin(3*PI*a);
}
const runStart=-1.74940,sourceX=-1.91147,exitX=-.95;
export function rillPoint(t){
  const v=runStart+(okaFront(exitX)-runStart)*t;
  return [sourceX+(exitX-sourceX)*t+.108*sin(2*PI*t),.27-.167*t,v];
}
export function okaHeight(u,v){
  const end=okaFront(u),front=ease((end-v)/1.77);
  const crown=.169+.31*front+.029*sin((u+1.6)*1.25)*front*(1-front);
  const swirl=((u+.86)/1.28)**2+((v+2.30)/.67)**2;
  const rubbed=.067*Math.exp(-1.64*swirl);
  const field=crown-rubbed+(.476-crown+rubbed)*ease((-v-2.49)/.39);
  // A shallow circular ink drop well runs into one V-cut, then discharges
  // over the nose. Both the moving film and the stone use this same gouge.
  const t=clamp((v-runStart)/(okaFront(exitX)-runStart));
  const [x,h,z]=rillPoint(t);
  const width=.087+.043*(1-t)+.012*sin(PI*t);
  const distance=Math.hypot((u-x)/width,(v-z)/width);
  const channel=h-.027+(field-h+.027)*ease((distance-.14)/.93);
  const bowl=Math.hypot((u-sourceX)/.41,(v-runStart)/.285);
  const pocket=.218+.060*bowl*bowl+(field-.275)*ease((bowl-.78)/.26);
  return Math.min(field,channel,bowl<1.04?pocket:field);
}
export function onSuzuriLand(u,v){
  return u>OKA.left && u<OKA.right && v>OKA.back-.08 && v<okaFront(u)-.024;
}
export function suzuriBasinFloor(u,v){
  const h=SUZURI_WELL,d=((u-h.u)/h.rx)**2+((v-h.v)/h.rz)**2;
  let y=-.675-(h.depth-.675)*exp(-d*.68);
  // Keep earth beneath the carved front. A separate surveyed surface supports
  // footsteps exactly at the stone top even between the terrain vertices.
  if(u>OKA.left && u<OKA.right)
    y-=.15*ease((okaFront(u)+.25-v)/.40);
  return y;
}

// The final pass of the chisel turns the curved floor up into the dressed
// rim. The mesh and collision share this survey, including the beach.
export function suzuriBedElevation(u,v,r){
  const edge=r>0?Math.hypot(u,v)*(1-1/r):-3.05;
  const edgeHeight=-.52+.65*ease((edge+1.08)/2.38);
  const depth=edgeHeight+(suzuriBasinFloor(u,v)-edgeHeight)*ease((1.05-r)/.2);
  return depth+(.026-depth)*ease((r-.85)/.23);
}
