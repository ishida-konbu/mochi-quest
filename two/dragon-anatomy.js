// All distances are in body units before stature. The mesh lives in the trunk's
// local frame, whose z scale is 1.5. Carve the posterior in physical space first.
import { CatmullRomCurve3, CubicBezierCurve3, Vector3 } from './vendor/three.module.min.js';
import { dragonLengthScale } from './animal-motion.js';

const torsoSections=[
  [-.29,.50,-2.12,.204,.214],[-.28,.90,-1.76,.225,.25],[.02,1.06,-1.46,.249,.262],
  [.39,.96,-1.17,.258,.275],[.54,.66,-.79,.279,.291],[.45,.50,-.35,.301,.318],
  [.10,.52,.04,.315,.323],[-.24,.75,.40,.312,.32],[-.44,1.06,.70,.286,.301],
  [-.45,1.45,.87,.27,.284],[-.35,1.74,1.08,.239,.264],[-.13,1.88,1.42,.214,.243]
];
const torso=new CatmullRomCurve3(torsoSections.map(([x,y,z])=>new Vector3(x,y,z)));
const girth=new CatmullRomCurve3(torsoSections.map(s=>new Vector3(s[3],s[4],0)));
const torsoParameter=t=>(16*t-5)/11;
const hipT=torsoParameter(.407);
const hip=torso.getPoint(hipT), hipRadii=girth.getPoint(hipT);
const localZ=1/dragonLengthScale;

function frame(tangent) {
  const across=new Vector3(1,0,0).addScaledVector(tangent,-tangent.x).normalize();
  return {across,up:tangent.clone().cross(across).normalize()};
}

export function dragonTorsoJoint(i) {
  const station=.05+i*.051, t=torsoParameter(station);
  return {point:torso.getPoint(t),tangent:torso.getTangent(t),radius:torsoSections[Math.round(station*16)-5][4]};
}

// Hip→tip: pelvic muscle, low belly of the sweep, rising whip, narrower
// countercurve, lifted brush. The first handle continues the hip's exact tangent.
// Adjacent spans share tangents, including the small turn back at the very end.
const hipTangent=torso.getTangent(hipT);
hipTangent.z*=dragonLengthScale;
hipTangent.normalize();
const hipWaveSlope=hipTangent.z*localZ;
const handles=[
  [0,0,0],hipTangent.clone().multiplyScalar(-.45).toArray(),[-.43,-.50,-.91],[-.36,-.52,-1.44],
  [-.29,-.54,-1.97],[-.02,-.35,-2.27],[.20,-.12,-2.66],
  [.42,.11,-3.05],[.50,.30,-3.584994],[.31,.41,-3.814994],
  [.12,.52,-4.044994],[-.025,.49,-4.399988],[-.077,.67,-4.529988],
  [-.129,.85,-4.659988],[-.07,.97,-4.629988],[.012,1.01,-4.579988]
].map(p=>new Vector3(...p));
const spans=[];
let tailLength=0;
for(let k=0;k<handles.length-1;k+=3) {
  const curve=new CubicBezierCurve3(...handles.slice(k,k+4));
  curve.arcLengthDivisions=256;
  const length=curve.getLength();
  spans.push({curve,start:tailLength,length});
  tailLength+=length;
}

// Successive flesh sections thin continuously from the leg muscle to the quill.
// C¹ Hermite interpolation lets each adjoining pair share a slope.
const radii=[
  [0,hipRadii.x,hipRadii.y],[.12,.212,.219],[.29,.181,.175],
  [.48,.135,.124],[.65,.100,.088],[.79,.069,.061],[.90,.039,.034],
  [.965,.017,.015],[1,.003,.003]
];
function sectionRadius(f,k,axis) {
  const a=radii[k], b=radii[k+1], step=b[0]-a[0], t=(f-a[0])/step;
  const l=radii[Math.max(0,k-1)], r=radii[Math.min(radii.length-1,k+2)];
  const ma=(b[axis]-l[axis])/(b[0]-l[0]), mb=(r[axis]-a[axis])/(r[0]-a[0]);
  return (1+2*t)*(1-t)**2*a[axis]+t*(1-t)**2*step*ma
    +t*t*(3-2*t)*b[axis]+t*t*(t-1)*step*mb;
}

export function dragonTailSection(distanceFromTip) {
  const d=Math.max(0,Math.min(tailLength,tailLength-distanceFromTip));
  const span=spans.find(s=>d<=s.start+s.length)||spans.at(-1);
  const t=Math.max(0,Math.min(1,(d-span.start)/span.length));
  const p=span.curve.getPointAt(t), tangent=span.curve.getTangentAt(t).negate();
  const {across,up}=frame(tangent);
  across.z*=localZ;up.z*=localZ;tangent.z*=localZ;
  const f=d/tailLength;
  let k=0;
  while(k<radii.length-2 && radii[k+1][0]<f)k++;
  // The hip joins an existing pitched transverse section of the torso.
  // Ease into that original section over the first half body unit.
  if(d<.55) {
    const s=d/.55,blend=1-s*s*(3-2*s),fore=frame(torso.getTangent(hipT));
    across.lerp(fore.across,blend);up.lerp(fore.up,blend);
  }
  return {x:hip.x+p.x,y:hip.y+p.y,z:hip.z+p.z*localZ,
    rx:sectionRadius(f,k,1),ry:sectionRadius(f,k,2),across,up,tangent,distance:tailLength-d,
    // Carry the pulse down the spine even where the tip folds back toward the head.
    waveZ:hip.z-hipWaveSlope*d-.08*d*f};
}

// One skin and one atlas cross the hip. Distance increases from the ink tip
// towards the neck and includes the trunk's z scale before world placement.
export const dragonHipRing=96;
export const dragonRings=Array.from({length:dragonHipRing+1},(_,j)=>dragonTailSection(tailLength*j/dragonHipRing));
for(let j=1;j<=64;j++) {
  const t=hipT+(1-hipT)*j/64,p=torso.getPoint(t),r=girth.getPoint(t),tangent=torso.getTangent(t);
  const prev=dragonRings.at(-1);
  const distance=prev.distance+Math.hypot(p.x-prev.x,p.y-prev.y,(p.z-prev.z)*dragonLengthScale);
  dragonRings.push({x:p.x,y:p.y,z:p.z,rx:r.x,ry:r.y,...frame(tangent),tangent,distance,waveZ:p.z});
}
