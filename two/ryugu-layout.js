// The procession enters from the east. Local u is north, v faces the coast.
import { DISTRICTS } from './geography.js';
export const RYUGU = DISTRICTS.ryugu;
// The same sea lane is printed on the atlas and marked with moored floats.
export const PALACE_APPROACH = [
  [-184,112],[-226,119],[-280,135],[-339,160],[-402,190],
  [-471,215],[-535,243],[-584,258],[RYUGU.x+35,RYUGU.z-7],[RYUGU.x,RYUGU.z],
];
export const HALLS = [
  { u: 0, v: -14, w: 15, d: 7.8, tiers: 3 },
  { u: -14.7, v: -6.8, w: 7.5, d: 6.3, tiers: 2 },
  { u: 14.7, v: -6.8, w: 7.5, d: 6.3, tiers: 2 },
];
export const GATE_V = 14;
// Keep the seawater beneath the eaves and through the arches swimmable.
const solids = [];
function box(u, v, w, d, bottom, top) { solids.push({ u, v, w: w / 2, d: d / 2, bottom, top }); }
for (const {u,v,w,d,tiers} of HALLS) {
  box(u,v,w+.7,d+.7,0,.77);
  box(u,v,w*.74,d*.72,.77,4.65);
  let bottom=4.5;
  for (let i=0;i<tiers;i++) {
    const k=.75**i;
    box(u,v,(w+3.2)*k,(d+3)*k,bottom,bottom+.28);
    box(u,v,w*.56*k,d*.55*k,bottom,bottom+2.6*k);
    bottom+=2.75*k;
  }
}
for(const u of [-4.55,4.55]) box(u,GATE_V,3.8,3.4,0,4.75);
box(0,GATE_V,12.9,3.4,4.75,6.25);
box(0,GATE_V,8.7,3,6.25,8.5);
export function palaceSolid(x,z,y,bed,body=1.25,pad=.25) {
  const u=RYUGU.z-z,v=x-RYUGU.x;
  return Math.abs(u)<23 && Math.abs(v)<23 && solids.some(b=>
    y<bed+b.top && y+body>bed+b.bottom && Math.abs(u-b.u)<b.w+pad && Math.abs(v-b.v)<b.d+pad);
}
