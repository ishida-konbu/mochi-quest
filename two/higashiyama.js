// The two ridges face the crossroads in Kyoto. Across a northward view east
// is right; across an eastward view south is right. Distances are metres.
import { DISTRICTS } from './geography.js';

const city=DISTRICTS.kyo;
export const HIGASHIYAMA={x:city.x+380,z:city.z};
export const KITAYAMA={x:city.x-4,z:city.z-372};
export const NISHIYAMA={x:city.x-327,z:city.z-13};
// Nishiyama has a double ridge. Its higher, city-facing summit is east
// of the geographic centre of the divide.
export const KYO_LOOKOUTS=[HIGASHIYAMA,KITAYAMA,{x:NISHIYAMA.x+26,z:NISHIYAMA.z+16}];
// Geographic bounds of the single painted sheet, in metres from its NW corner.
export const KYO_HILL_SHEET={x:-320,z:-1552,width:1216,depth:1056};

// These coastal lobes meet beneath the long aprons, beyond the last visible
// contour. The same shore survey feeds the sea, trekking and atlas painters.
export const FIRE_COAST=[
  [598,-851,320,348],[745,-920,192,232],[568,-1031,205,153],
  [219,-1203,366,211],[91,-1190,205,172],[316,-1102,220,180],
];

function dome(u,v) {
  const r=u*u+v*v;
  if(r>=1)return 0;
  // A raised cosine has a rounded crown and meets grassland on a level tangent.
  return .5+.5*Math.cos(Math.PI*Math.sqrt(r));
}

function watershed(a,b,north) {
  if(a< -315 || a>229 || Math.abs(b)>338)return 0;
  // Two forked buttresses run toward the viewer. Their headwaters cut back
  // into the main divide, leaving a saddle before each subsidiary summit.
  const axis=(north ? -11:14)*Math.sin(b/98)+6*Math.sin(b/49);
  const cross=a-axis;
  const mantle=(north?118:127)*dome(cross/(cross<0?301:207),b/(north?309:316));
  const crest=(north?25:31)*dome((cross-4)/157,(b+9)/207);
  const peak=(north?7:10)*dome((cross+3)/103,(b-9)/91);
  const left=57*dome((a+15-.27*(b+151))/146,(b+151)/127);
  const right=48*dome((a-13+.33*(b-152))/141,(b-152)/134);
  const leftSpur=28*dome((a+109+.64*(b+103))/169,(b+104)/75);
  const rightSpur=24*dome((a+108-.71*(b-116))/156,(b-119)/67);
  const gullies=10*dome((a+85)/142,(b+83+.34*a)/34)+
    8*dome((a+77)/137,(b-99-.30*a)/30);
  // Short, raked shoulders break the skyline beside the two mown firebeds.
  // The two divides have different rock strikes and side valleys.
  const shear=a+(north?.31:-.24)*b;
  const shoulders=north
    ? 25*dome((shear+18)/82,(b-113)/51)+16*dome((shear-38)/67,(b+169)/38)
      -10*dome((shear+49)/93,(b+206)/29)
    : 22*dome((shear-9)/76,(b+113)/52)+19*dome((shear+62)/93,(b-168)/43)
      -13*dome((shear+24)/90,(b+160)/39);
  const relief=mantle+crest+peak+left+right+leftSpur+rightSpur-gullies+shoulders;
  // Slight discontinuities in the beds show in grazing light, without
  // introducing steps in the meadow that holds the ceremonial brushstrokes.
  const folds=1+.016*Math.sin(.034*b+.017*a)*Math.cos(.025*a-.009*b);
  // A narrow crown above the rounded shoulders opens the view back over
  // the basin. The toes, firebed grades and passes retain their survey.
  const crown=Math.abs(a)<60 && Math.abs(b)<85?10*Math.exp(-((a/15)**2+(b/28)**2)):0;
  return Math.max(0,relief)*folds+crown;
}

export const eastRidgeHeight=(x,z)=>watershed(x-HIGASHIYAMA.x,z-HIGASHIYAMA.z,false);
export const northRidgeHeight=(x,z)=>watershed(KITAYAMA.z-z,x-KITAYAMA.x,true);

// A lower, overlapping pair of wooded ridges above the road to Sakai. Their
// southern toes die out on the town side of the pass; the shore stays open.
export function westRidgeHeight(x,z) {
  const u=x-NISHIYAMA.x,v=z-NISHIYAMA.z;
  if(u< -218 || u>250 || v< -209 || v>142)return 0;
  const axis=u+.32*v+14*Math.sin(v*.021);
  const ridge=84*dome(axis/174,(v+18)/190)
    +22*dome((axis+9)/86,(v+41)/64)
    +34*dome((u+80+.46*v)/98,(v+92)/97)
    +46*dome((u-55+.34*v)/100,(v-28)/75)
    +20*dome((u-86+.62*v)/106,(v+51)/45)
    -9*dome((u-27+.47*v)/80,(v+12)/21);
  const foot=Math.min(1,Math.max(0,(142-v)/50));
  const summit=Math.abs(u-26)>33 || Math.abs(v-16)>58?0:1.9*Math.exp(-(((u-26)/9)**2+((v-16)/18)**2));
  return (Math.max(0,ridge)+summit)*foot*foot*(3-2*foot);
}

export const kyoRidgeHeight=(x,z)=>Math.max(eastRidgeHeight(x,z),northRidgeHeight(x,z),westRidgeHeight(x,z));

// Depth is measured out from the crossroads; side is screen-right when
// looking at the hill. The mown strips follow the actual tips of the strokes,
// including the uphill slant of 福 and the separate arms and legs of 大.
const clearingBanks=[
  [[191,-25],[191,-14],[196,-6],[200,17],[201,30],[218,34],[235,36],
   [252,40],[269,35],[285,37],[306,38],[325,48],[331,45],[327,35],
   [310,26],[300,16],[295,6],[295,-12],[297,-31],[284,-41],[275,-45],
   [264,-35],[256,-34],[247,-42],[240,-38],[234,-30],[215,-26]],
  [[167,-24],[166,-16],[177,-9],[184,-3],[183,2],[170,17],[168,25],
   [178,27],[191,21],[202,12],[214,7],[223,15],[229,28],[236,28],
   [239,16],[245,7],[264,7],[276,7],[277,-3],[265,-6],[252,-7],
   [250,-16],[254,-25],[251,-31],[243,-30],[229,-18],[219,-11],
   [213,-10],[202,-15],[190,-20],[178,-26]],
];
function mownBank(depth,side,pad,banks) {
  let inside=false,nearest=Infinity;
  for(let i=0,j=banks.length-1;i<banks.length;j=i++){
    const [a,b]=banks[j],[c,d]=banks[i],dx=c-a,dz=d-b;
    const u=Math.max(0,Math.min(1,((depth-a)*dx+(side-b)*dz)/(dx*dx+dz*dz)));
    nearest=Math.min(nearest,(a+u*dx-depth)**2+(b+u*dz-side)**2);
    if((b>side)!==(d>side) && depth<a+(side-b)*dx/dz)inside=!inside;
  }
  const verge=1.15*Math.sin(depth*.23+side*.12)+.62*Math.sin(side*.41-depth*.072);
  return (inside?-1:1)*Math.sqrt(nearest)<pad+verge;
}
export function inFireMeadow(x,z,pad=0) {
  const east=x-city.x,north=city.z-z;
  if(east>187-pad && east<335+pad && Math.abs(north)<52+pad)
    return mownBank(east,-north,pad,clearingBanks[0]);
  if(north>162-pad && north<281+pad && Math.abs(east)<35+pad)
    return mownBank(north,east,pad,clearingBanks[1]);
  return false;
}

function fireTrail(east,knots) {
  const samples=[];
  // A quadratic fillet turns each hairpin on the inside of its two surveyed
  // legs. At the next bend it meets the straight on the very same tangent.
  let last=knots[0];
  const point=(d,v)=>east?[city.x+d,city.z+v]:[city.x+v,city.z-d];
  samples.push(point(...last));
  function line(to) {
    const [x,z]=last,n=Math.max(1,Math.ceil(Math.hypot(to[0]-x,to[1]-z)/.78));
    for(let i=1;i<=n;i++)samples.push(point(x+(to[0]-x)*i/n,z+(to[1]-z)*i/n));
    last=to;
  }
  for(let i=1;i<knots.length-1;i++){
    const a=knots[i-1],b=knots[i],c=knots[i+1];
    const pre=[b[0]+.23*(a[0]-b[0]),b[1]+.23*(a[1]-b[1])];
    const post=[b[0]+.23*(c[0]-b[0]),b[1]+.23*(c[1]-b[1])];
    line(pre);
    const n=Math.ceil((Math.hypot(b[0]-pre[0],b[1]-pre[1])+Math.hypot(post[0]-b[0],post[1]-b[1]))/.78);
    for(let j=1;j<=n;j++){
      const t=j/n,q=1-t;
      samples.push(point(q*q*pre[0]+2*q*t*b[0]+t*t*post[0],q*q*pre[1]+2*q*t*b[1]+t*t*post[1]));
    }
    last=post;
  }
  line(knots.at(-1));
  return samples;
}
export const FIRE_TRAILS={
  east:fireTrail(true,[[100,41],[109,43],[118,50],[129,63],[141,76],[149,79],
    [154,73],[157,63],[161,48],[166,40],[170,44],[176,57],[181,66],[186,64],
    [190,55],[194,41],[197,31],[198,21],[200,9]]),
  north:fireTrail(false,[[81,-49],[94,-47],[104,-41],[113,-30],[119,-28],
    [124,-34],[130,-47],[138,-58],[144,-62],[148,-57],[152,-46],[158,-34],
    [164,-28],[168,-30],[173,-38],[177,-40],[181,-38],[183,-32],[182,-23]]),
};
const trailCells=new Map(),cell=(x,z)=>Math.floor(x/16)*256+Math.floor(z/16);
for(const line of Object.values(FIRE_TRAILS))for(let i=1;i<line.length;i++){
  const [x,z]=line[i-1],[ex,ez]=line[i],dx=ex-x,dz=ez-z;
  const segment={x,z,dx,dz,inv:1/(dx*dx+dz*dz)};
  for(let col=Math.floor((Math.min(x,ex)-12)/16);col<=Math.floor((Math.max(x,ex)+12)/16);col++)
    for(let row=Math.floor((Math.min(z,ez)-12)/16);row<=Math.floor((Math.max(z,ez)+12)/16);row++){
      const key=col*256+row;
      if(!trailCells.has(key))trailCells.set(key,[]);
      trailCells.get(key).push(segment);
    }
}
export function fireTrailDistance(x,z) {
  const segments=trailCells.get(cell(x,z));
  if(!segments)return Infinity;
  let nearest=Infinity;
  for(const s of segments){
    const u=Math.max(0,Math.min(1,((x-s.x)*s.dx+(z-s.z)*s.dz)*s.inv));
    nearest=Math.min(nearest,(s.x+u*s.dx-x)**2+(s.z+u*s.dz-z)**2);
  }
  return Math.sqrt(nearest);
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
const daiStrokes=[
  [[.135,.645],[.504,.648],[.855,.658]],
  [[.527,.977],[.512,.824],[.484,.641],[.442,.480],[.356,.315],[.231,.174],[.058,.050]],
  [[.480,.564],[.569,.421],[.677,.275],[.797,.154],[.953,.052]],
];

// Each pair is a tangent in the vertical picture plane at the crossroads.
// Intersect rays with the first rising slope so the figures follow both the
// land and their intended brush proportions, including the counters of 福.
export const FIRE_DRAWINGS={
  east:{width:.2924,foot:.18182,height:.19436},
  north:{width:.2666,foot:.15154,height:.19092},
};
function surveyFirebeds(height,east) {
  const viewY=height(city.x,city.z)+1.85,hearths=[];
  const drawing=east?FIRE_DRAWINGS.east:FIRE_DRAWINGS.north;
  function lay(u,v) {
    const bearing=(u-.5)*drawing.width,rise=drawing.foot+v*drawing.height;
    const xAt=d=>city.x+d*(east?1:bearing);
    const zAt=d=>city.z+d*(east?bearing:-1);
    const cut=d=>height(xAt(d),zAt(d))-viewY-d*rise;
    let hi=108;
    while(hi<400 && cut(hi)<0)hi+=2;
    let lo=hi-2;
    for(let k=0;k<10;k++){const mid=(lo+hi)*.5;if(cut(mid)<0)lo=mid;else hi=mid;}
    const d=(hi+lo)*.5,x=xAt(d),z=zAt(d);
    if(!hearths.some(h=>Math.hypot(h[0]-x,h[2]-z)<1.18))
      hearths.push([x,height(x,z)+.38,z]);
  }
  for(const line of east?strokes:daiStrokes){
    const lengths=[0];
    for(let i=1;i<line.length;i++)lengths.push(lengths[i-1]+Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1]));
    const total=lengths.at(-1),n=Math.ceil(total/(east?.028:.024));
    for(let i=0,j=1;i<=n;i++){
      const d=total*i/n;
      while(j<line.length-1 && d>lengths[j])j++;
      const a=line[j-1],b=line[j],t=(d-lengths[j-1])/(lengths[j]-lengths[j-1]);
      lay(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
    }
  }
  return hearths;
}
// Rendering and forest planting must survey precisely the same fires. Cache
// both charts per elevation sampler so the ray/terrain intersections run once.
const fireSurveys=[new WeakMap(),new WeakMap()];
function firebeds(height,east){
  const cache=fireSurveys[east?0:1];
  if(!cache.has(height))cache.set(height,surveyFirebeds(height,east));
  return cache.get(height);
}
export const fukuFirebeds=height=>firebeds(height,true);
export const daiFirebeds=height=>firebeds(height,false);

// Determine the first height at which a crown would cut across a real fire
// stroke. Trees in front can still grow to this level. There is no height cap
// behind the hearths, around the glyph or in gaps between its branches.
export function createFireTreeCeiling(height) {
  const cells=new Map();
  for(const east of [true,false]) {
    const hearths=east?fukuFirebeds(height):daiFirebeds(height);
    for(const offset of [-40,-20,0,22,44,66]){
      const ox=city.x+(east?offset:0),oz=city.z-(east?0:offset),oy=height(ox,oz)+1.85;
      for(const [hx,hy,hz] of hearths){
        const dx=hx-ox,dz=hz-oz,length=Math.hypot(dx,dz);
        const ray={ox,oz,oy,ux:dx/length,uz:dz/length,length,grade:(hy-oy)/length};
        // Index the whole sightline with a margin wider than a mature crown.
        const steps=Math.ceil(length/10),seen=new Set();
        for(let i=0;i<=steps;i++){
          const x=ox+dx*i/steps,z=oz+dz*i/steps;
          for(let col=Math.floor((x-15)/16);col<=Math.floor((x+15)/16);col++)
            for(let row=Math.floor((z-15)/16);row<=Math.floor((z+15)/16);row++){
              const key=col*256+row;
              if(seen.has(key))continue;
              seen.add(key);
              if(!cells.has(key))cells.set(key,[]);
              cells.get(key).push(ray);
            }
        }
      }
    }
  }
  return (x,z,radius=0)=>{
    const rays=cells.get(cell(x,z));
    if(!rays)return Infinity;
    let limit=Infinity;
    const reach=radius+1.35;
    for(const r of rays){
      const dx=x-r.ox,dz=z-r.oz,across=dx*r.uz-dz*r.ux;
      if(Math.abs(across)>reach)continue;
      const depth=dx*r.ux+dz*r.uz;
      const half=Math.sqrt(Math.max(0,reach*reach-across*across));
      if(depth+half<0 || depth-half>r.length)continue;
      limit=Math.min(limit,r.oy+Math.max(0,depth-half)*r.grade-.32);
    }
    return limit;
  };
}
