// The transverse avenue looks due east at this ridge. Positive z is the
// viewer's right, so the 礻 radical stands on the north side of the slope.
import { DISTRICTS } from './geography.js';

export const HIGASHIYAMA={x:DISTRICTS.kyo.x+184,z:DISTRICTS.kyo.z};
const {x:cx,z:cz}=HIGASHIYAMA;
const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};

export function eastRidgeShore(x,z,shore) {
  const dx=x-cx,dz=z-cz;
  if(Math.abs(dx)>125 || Math.abs(dz)>138)return shore;
  const cape=(1-Math.hypot((dx-6+.13*dz)/85,dz/122))*85
    +2.1*Math.sin(.096*dz)+1.4*Math.cos(.14*dx-.036*dz);
  return Math.max(shore,cape);
}
export function eastRidgeHeight(x,z) {
  const dx=x-cx,dz=z-cz;
  if(dx< -72 || dx>108 || Math.abs(dz)>132)return 0;
  const skirt=ease((dx+72)/34)*ease((108-dx)/27)*ease((132-Math.abs(dz))/33);
  const hump=(u,v)=>Math.exp(-(u*u+v*v));
  const crest=4.3*Math.sin(dz/26)-.105*dz;
  const shield=51*hump((dx-9+.18*dz)/62,dz/101);
  const ridge=54*hump((dx-crest)/35,(dz+7)/66);
  const northPeak=36*hump((dx-8-.15*dz)/24,(dz+60)/28);
  const southSpur=31*hump((dx-20+.26*dz)/29,(dz-53)/35);
  const ramparts=20*hump((dx+14)/27,(dz+61)/22)+15*hump((dx+21)/25,(dz-56)/26);
  const fold=4*Math.sin((dz+.55*dx)/13)*Math.cos(dx/19)
    +2.2*Math.sin(dz/7+dx/13);
  return Math.max(0,shield+ridge+northPeak+southSpur+ramparts+fold)*skirt;
}

// A cut meadow runs from the lower approach to the ridge shoulder. The
// surrounding wood is allowed to follow both flanks but not mask a fire.
export function inFireMeadow(x,z) {
  return x>cx-48 && x<cx-3 && Math.abs(z-cz)<30+(x-cx+74)*.23;
}

// Thirteen brush strokes of 福. The placements are specified on the plane
// seen from the avenue, then each firebed is surveyed onto the real slope.
const strokes=[
  [[.095,.961],[.145,.921],[.184,.866]],
  [[.027,.795],[.273,.821],[.253,.747],[.165,.587],[.078,.483],[.010,.423]],
  [[.165,.586],[.164,.377],[.169,.067]],
  [[.180,.582],[.236,.513],[.293,.446]],
  [[.356,.917],[.605,.930],[.936,.946]],
  [[.416,.801],[.425,.725],[.432,.632]],
  [[.416,.801],[.644,.811],[.874,.822],[.865,.713],[.853,.636]],
  [[.432,.632],[.611,.636],[.853,.646]],
  [[.365,.520],[.376,.314],[.386,.071]],
  [[.369,.511],[.611,.522],[.946,.536],[.934,.315],[.920,.086]],
  [[.649,.516],[.647,.333],[.642,.093]],
  [[.379,.307],[.648,.319],[.926,.330]],
  [[.387,.091],[.655,.098],[.918,.109]],
];
export function fukuFirebeds(height) {
  const eye=DISTRICTS.kyo, eyeY=height(eye.x,eye.z)+1.85;
  const hearths=[];
  function lay(u,v) {
    const bearing=(u-.5)*.357,rise=.211+v*.320;
    // The first crossing is on the western face; another can occur behind
    // the crest. Bisect the last metre for a continuous bed through turns.
    const zAt=x=>eye.z+(x-eye.x)*bearing;
    const intersect=x=>height(x,zAt(x))-eyeY-(x-eye.x)*rise;
    let x=cx-72;
    while(x<cx+14 && intersect(x)<0)x+=1;
    let lo=x-1,hi=x;
    for(let k=0;k<8;k++){const mid=(lo+hi)/2;if(intersect(mid)<0)lo=mid;else hi=mid;}
    x=(hi+lo)/2;
    const z=zAt(x);
    if(!hearths.some(h=>Math.hypot(h[0]-x,h[2]-z)<1.05))
      hearths.push([x,height(x,z)+.38,z]);
  }
  for(const line of strokes){
    const lengths=[0];
    for(let i=1;i<line.length;i++)lengths.push(lengths[i-1]+Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1]));
    const total=lengths.at(-1),n=Math.ceil(total/.034);
    for(let i=0,j=1;i<=n;i++){
      const d=total*i/n;
      while(j<line.length-1 && d>lengths[j])j++;
      const a=line[j-1],b=line[j],t=(d-lengths[j-1])/(lengths[j]-lengths[j-1]);
      lay(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
    }
  }
  return hearths;
}
