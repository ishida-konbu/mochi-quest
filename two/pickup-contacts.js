// Dimensions are in the drawing's local metres. Sample only the portion of
// a solid that shares the probe's height so a notice can pass below a table,
// between two wheels or above a basket.
import { wrapCoord, wrapDelta } from './terrain.js';

export const PARKED_BIKES = [-.15, .47];
export const PARKING_ANGLE = -.21;
const parkingCos = Math.cos(PARKING_ANGLE), parkingSin = Math.sin(PARKING_ANGLE);

// [centre across, centre along, half width, half depth, bottom, top]
const rack = [
  [-.82,-.25,.19,.18,.007,.167], [-.82,-.25,.10,.075,.10,1.32],
  [-.82,-.23,.19,.075,1.175,1.665],
];
for (const x of [-.16,.47]) {
  for (const side of [-1,1]) rack.push([x+side*.07,-.47,.018,.018,0,.41]);
  rack.push([x,-.47,.088,.018,.392,.428]);
}
const bicycle = [
  [0,-.279,.12,.14,.966,1.064], [0,.433,.32,.077,1.032,1.112],
  [0,.654,.18,.145,.735,.91], [0,-.04,.17,.055,.18,.42],
];
const stand = [[0,0,.47,.315,.307,.373], [.012,0,.36,.24,.373,.396]];
for (const x of [-.363,.363]) for (const z of [-.23,.23]) stand.push([x,z,.0335,.0375,0,.34]);
const sanbo = [[0,0,.77,.60,0,.131], [0,0,.445,.39,.085,.515], [0,0,.64,.58,.516,.644]];
for (const side of [-1,1]) {
  sanbo.push([0,side*.564,.64,.0195,.6125,.7035], [side*.626,0,.0195,.58,.6125,.7035]);
}
const offerings = [];
for (let x=-1;x<=1;x++) for (let z=-1;z<=1;z++) offerings.push([x*.324,z*.314,.797,.182,.172]);
for (const x of [-.163,.163]) for (const z of [-.151,.151]) offerings.push([x,z,1.028,.182,.172]);
for (const x of [-.153,.153]) offerings.push([x,0,1.263,.182,.172]);

function rectangle(u,v,w,d,radius) {
  const a=Math.abs(u)-w,b=Math.abs(v)-d;
  return radius-Math.hypot(Math.max(0,a),Math.max(0,b))-Math.min(0,Math.max(a,b));
}
function boxes(shapes,u,v,lo,hi,radius) {
  let depth=0;
  for (const [x,z,w,d,bottom,top] of shapes) {
    if (lo<top && hi>bottom) depth=Math.max(depth,rectangle(u-x,v-z,w,d,radius));
  }
  return depth;
}
// Horizontal extent of a round solid sliced by the probe's vertical interval.
function section(center,half,lo,hi) {
  const d=Math.max(0,lo-center,center-hi)/half;
  return d>=1 ? 0 : Math.sqrt(1-d*d);
}
const frameTubes = [
  [-.65,.374,-.04,.302,.085], [-.65,.374,-.24,.82,.075],
  [-.04,.302,-.279,.99,.048], [-.23,.85,-.03,.34,.052],
  [-.03,.34,.16,.37,.052], [.16,.37,.48,.855,.052], [.65,.374,.399,1.09,.055],
];
function parkedBike(u,v,lo,hi,radius) {
  let depth=boxes(bicycle,u,v,lo,hi,radius);
  const rim=.387*section(.374,.387,lo,hi);
  if (rim) for (const axle of [-.65,.65]) depth=Math.max(depth,rectangle(u,v-axle,.036,rim,radius));
  for (const [z1,y1,z2,y2,thickness] of frameTubes) {
    if (lo>=Math.max(y1,y2)+thickness || hi<=Math.min(y1,y2)-thickness) continue;
    const t0=Math.max(0,Math.min(1,(lo-thickness-y1)/(y2-y1)));
    const t1=Math.max(0,Math.min(1,(hi+thickness-y1)/(y2-y1)));
    const near=z1+(z2-z1)*t0,far=z1+(z2-z1)*t1;
    depth=Math.max(depth,rectangle(u,v-(near+far)/2,thickness,Math.abs(far-near)/2+thickness,radius));
  }
  return depth;
}
function fixtureContact(o,u,v,lo,hi,radius,time) {
  if (o.type==='port') {
    let depth=boxes(rack,u,v,lo,hi,radius);
    for (let i=0;i<PARKED_BIKES.length && i<o.bikes;i++) {
      const x=u-PARKED_BIKES[i];
      depth=Math.max(depth,parkedBike(x*parkingCos-v*parkingSin,x*parkingSin+v*parkingCos,lo,hi,radius));
    }
    return depth;
  }
  if (o.type==='tsukimi') {
    let depth=boxes(sanbo,u,v,lo,hi,radius); // The wooden offering stand stays when the cakes are eaten.
    if (o.active) for (const [x,z,y,r,h] of offerings) {
      const slice=section(y,h,lo,hi);
      if (slice) depth=Math.max(depth,radius+r*slice-Math.hypot(u-x,v-z));
    }
    return depth;
  }
  const depth=boxes(stand,u,v,lo,hi,radius);
  const lift=.395+.011*Math.sin(time*2+o.x);
  if (hi<=lift) return depth;
  const a=.15*Math.sin(time*.8+o.z),c=Math.cos(a),s=Math.sin(a);
  const x=u*c-v*s,z=u*s+v*c;
  if (o.type==='sake') {
    const bottleR=lo<lift+.32 ? .208 : lo<lift+.44 ? .114 : .09;
    const bottle=lo<lift+.62 ? radius+bottleR-Math.hypot(x+.058,z) : 0;
    const cup=lo<lift+.16 ? radius+.122-Math.hypot(x-.228,z-.109) : 0;
    return Math.max(depth,bottle,cup);
  }
  if (o.type==='manga') return Math.max(depth,lo<lift+.12 ? rectangle(x,z,.386,.265,radius) : 0);
  if (o.type==='ramen' || o.type==='haramaki') {
    const ramen=o.type==='ramen';
    const r=ramen ? Math.min(.371,.217+.7*(hi-lift)) : .274;
    return Math.max(depth,lo<lift+(ramen?.36:.374) ? radius+r-Math.hypot(x,z) : 0);
  }
  return depth;
}

export function createPickupContacts(objects) {
  const cells=new Map(),key=(x,z)=>Math.floor(x/16)+','+Math.floor(z/16);
  for (const o of objects) {
    if (o.type==='onsen' || o.type==='kyoTea' || o.type==='mitarashi') continue;
    const fixture={o,c:Math.cos(o.heading || 0),s:Math.sin(o.heading || 0)};
    for (let i=-1;i<=1;i++) for (let j=-1;j<=1;j++) {
      const k=key(wrapCoord(o.x+i*16),wrapCoord(o.z+j*16));
      if (!cells.has(k)) cells.set(k,[]);
      cells.get(k).push(fixture);
    }
  }
  return (x,z,feet,height,radius,time=0)=>{
    let penetration=0;
    for (const {o,c,s} of cells.get(key(wrapCoord(x),wrapCoord(z)))||[]) {
      if ((!o.active && o.type!=='tsukimi') || feet>=o.y+1.67 || feet+height<=o.y) continue;
      const dx=wrapDelta(x-o.x),dz=wrapDelta(z-o.z);
      if (Math.abs(dx)>1.7+radius || Math.abs(dz)>1.7+radius) continue;
      penetration=Math.max(penetration,fixtureContact(o,dx*c-dz*s,dx*s+dz*c,feet-o.y,feet+height-o.y,radius,time));
    }
    return penetration;
  };
}
