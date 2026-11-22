// Survey in world metres. Each cross-section records the surface height, half
// width and thalweg depth. The last section meets an existing river or the sea.
const surveys=[
  {id:'maple',name:'楓渓の滝',lip:4,water:[
    [341.5,-146.0,26.92,.40,.19],[338.4,-146.1,26.64,1.50,.56],
    [333.8,-144.7,25.88,1.45,.56],[328.8,-143.2,23.58,1.48,.54],
    [325.5,-140.1,22.00,1.89,.35],[324.0,-135.7,1.03,2.25,1.38],
    [324.8,-133.5,.73,3.56,1.74],[328.2,-131.65,.43,2.67,1.19],
    [332.6,-130.89,.34,1.80,1.07],[337.4,-129.76,.30,.28,.78],
  ]},
  {id:'sakura',name:'白糸の滝',lip:5,water:[
    [-186.6,-64.0,13.97,.36,.15],[-185.0,-61.6,13.19,1.65,.58],
    [-181.3,-59.2,12.63,1.48,.54],[-179.6,-55.1,11.82,1.47,.48],
    [-177.2,-51.1,10.79,1.74,.45],[-175.0,-48.0,10.30,2.27,.32],
    [-173.0,-43.5,3.15,2.58,1.08],[-173.0,-40.1,3.07,3.90,1.54],
    [-175.9,-35.7,2.88,2.57,1.02],[-177.3,-29.3,2.56,1.72,.66],
    [-176.4,-22.4,2.08,1.84,.61],[-177.0,-14.0,1.64,1.75,.58],
    [-180.1,-6.8,1.08,2.02,.62],[-181.6,.1,.57,1.92,.68],
    [-180.7,5.1,.38,1.64,.85],[-178.0,10.0,.34,1.44,1.04],[-175.3,16.6,.28,.32,1.14],
  ]},
  {id:'peach',name:'桃霞の滝',lip:6,water:[
    [-777.9,-53.6,83.62,.39,.18],[-776.7,-50.1,81.89,1.72,.62],
    [-773.4,-46.0,80.65,1.82,.68],[-771.6,-41.8,77.73,1.77,.72],
    [-772.2,-38.0,73.62,1.80,.65],[-769.8,-33.4,66.75,2.02,.58],
    [-766.0,-29.0,58.0,2.52,.45],[-763.0,-21.0,25.0,3.14,1.64],
    [-762.5,-17.6,24.5,4.56,2.14],[-764.6,-12.5,21.55,3.18,1.33],
    [-767.2,-7.0,15.28,2.19,.87],[-764.3,-.7,8.74,2.13,.81],
    [-761.8,5.6,4.76,2.28,.84],[-762.5,11.5,2.28,1.98,.71],
    [-765.8,18.7,1.82,2.02,.75],[-766.4,25.1,1.36,2.10,.72],
    [-763.3,31.8,.91,2.19,.83],[-761.8,38.3,.54,2.28,.92],
    [-762.5,44.8,.38,2.31,1.08],[-764.0,50.9,.28,.45,1.32],
  ]},
];
const clamp01=t=>Math.min(1,Math.max(0,t));
const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
function resample({id,name,lip,water}){
  const stations=[];
  let lipIndex=0;
  for(let i=0;i<water.length-1;i++){
    const a=water[i],b=water[i+1],prev=water[Math.max(0,i-1)],next=water[Math.min(water.length-1,i+2)];
    const count=i===lip?1:Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.2);
    if(i===lip)lipIndex=stations.length;
    for(let j=0;j<count;j++){
      const t=j/count,t2=t*t,t3=t*t2;
      const coord=k=>(2*t3-3*t2+1)*a[k]+(t3-2*t2+t)*(b[k]-prev[k])*.5+
        (-2*t3+3*t2)*b[k]+(t3-t2)*(next[k]-a[k])*.5;
      stations.push({x:coord(0),z:coord(1),y:lerp(a[2],b[2],t),
        width:lerp(a[3],b[3],t),depth:lerp(a[4],b[4],t)});
    }
  }
  const [x,z,y,width,depth]=water.at(-1);
  stations.push({x,z,y,width,depth});
  for(let i=0;i<stations.length;i++){
    const a=stations[Math.max(i-1,0)],b=stations[Math.min(i+1,stations.length-1)];
    const d=Math.hypot(b.x-a.x,b.z-a.z);
    stations[i].nx=(b.z-a.z)/d;stations[i].nz=(a.x-b.x)/d;
  }
  const toeIndex=lipIndex+1;
  return {id,name,stations,lipIndex,toeIndex,fall:{lip:stations[lipIndex],toe:stations[toeIndex]}};
}
export const MOUNTAIN_STREAMS=surveys.map(resample);

// A sparse index keeps the common terrain and collision query independent of
// the total length of the detailed banks. A query never allocates a vector.
const size=16,key=(i,j)=>i*256+j,cells=new Map();
for(const stream of MOUNTAIN_STREAMS){
  const pts=stream.stations;
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const reach=Math.max(a.width,b.width)+6.4;
    const segment={a,b,dx,dz,inv:1/(dx*dx+dz*dz),falling:i===stream.lipIndex,
      first:i===0,last:i===pts.length-2};
    for(let ix=Math.floor((Math.min(a.x,b.x)-reach)/size);ix<=Math.floor((Math.max(a.x,b.x)+reach)/size);ix++)
      for(let iz=Math.floor((Math.min(a.z,b.z)-reach)/size);iz<=Math.floor((Math.max(a.z,b.z)+reach)/size);iz++){
        const k=key(ix,iz);
        if(!cells.has(k))cells.set(k,[]);
        cells.get(k).push(segment);
      }
  }
}
const sample={};
function section(x,z){
  const list=cells.get(key(Math.floor(x/size),Math.floor(z/size)));
  if(!list)return;
  let best=Infinity,nearest,tBest;
  for(const s of list){
    const ux=x-s.a.x,uz=z-s.a.z,t=clamp01((ux*s.dx+uz*s.dz)*s.inv);
    const rx=ux-t*s.dx,rz=uz-t*s.dz,d2=rx*rx+rz*rz;
    if(d2<best){best=d2;nearest=s;tBest=t;}
  }
  const {a,b}=nearest,d=Math.sqrt(best),width=lerp(a.width,b.width,tBest);
  if(d>width+6.4)return;
  sample.d=d;sample.width=width;sample.y=lerp(a.y,b.y,tBest);
  sample.depth=lerp(a.depth,b.depth,tBest);sample.t=tBest;sample.segment=nearest;
  return sample;
}

export function inMountainStreamClearing(x,z) {
  const p=section(x,z);
  return !!p && p.d<p.width+4.8;
}
export function mountainStreamWaterAt(x,z){
  const p=section(x,z);
  if(!p || p.d>=p.width)return -Infinity;
  // The veil falls through air. Swimmers can stand at the lip or in the pool;
  // the airborne arc never becomes a sloping, walkable water surface.
  if(p.segment.falling && p.t>0 && p.t<1)return p.t<.55 ? -Infinity : p.segment.b.y;
  return p.y;
}
export function mountainStreamTerrain(x,z,native){
  const p=section(x,z);
  if(!p)return native;
  const {a,b,falling,first,last}=p.segment;
  const lvl=falling?lerp(a.y,b.y,ease((p.t-.04)/.34)):p.y;
  const edge=p.d-p.width;
  // Leave room for the 2.5 m terrain triangles that interpolate across a bank.
  // A narrow deep groove under the centre remains visible between samples.
  const inset=1-ease((p.d-.47*p.width)/(p.width*.57+.37));
  const bed=lvl-(p.depth+.34)*inset;
  // Graded shoulders retain the channel on a convex slope. Fade both ends
  // into the spring seam and the receiving bed so an outlet never forms a sill.
  const bank=Math.min(native,lvl+1.2+Math.max(0,edge)*.36);
  const smoothBank=lerp(bed,Math.max(bank,lvl+.41),ease((edge+.15)/1.85));
  const grading=1-ease((edge-1.05)/4.3);
  const endFade=(first?ease(p.t):1)*(last?1-ease(p.t):1);
  // At a confluence the older, deeper riverbed continues through the mouth.
  // Do not deposit the little tributary's bank across a fish channel.
  const confluence=ease((2.30-lvl)/.9);
  return lerp(native,lerp(smoothBank,Math.min(native,smoothBank),confluence),grading*endFade);
}
