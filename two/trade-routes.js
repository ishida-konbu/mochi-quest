import { SNOW_PASS, lakePoint } from './snow-country.js';
import { PEACH_APPROACH } from './peach-range.js';

// The same centrelines guide the road painter, ox drivers and atlas.
export const TRADE_ROADS = [
  { id:'capital-road', destination:'花の京', origin:'雪灯りの街', width:5.3, knots:[
    ...SNOW_PASS.map(([x,z])=>[x,z]),[345,-924],[345,-906],[345,-870],[345,-855],[343,-850],
    [337,-848],[323,-848],[300,-848],[270,-848],[240,-848]] },
  { id:'temple-road', destination:'東大寺', origin:'十五夜の薄野', width:4.7, knots:[[-55,290],[-38,312],[3,330],[51,345],[96,345],[140,384],[173,425],[187,486],[230,544],[254,601],[308,638],[345,706],[369,779],[393,853],[407,874],[423,876],[430,870],[430,853]] },
  { id:'peach-pass', destination:'桃源郷', origin:'竹隠れの社', width:3.6, knots:PEACH_APPROACH },
  { id:'inari-road', destination:'伏見稲荷', origin:'花の京', width:4.3, knots:[[240,-744],[273,-747],[290,-745],[340,-730],[390,-690],[438,-678],[490,-680],[540,-640],[540,-590],[540,-540],[545,-482],[543,-460],[532,-435],[512,-419],[431,-417],[402,-425],[405,-434]] },
  { id:'tsuruga-road', destination:'敦賀', origin:'花の京', width:4.8, knots:[[340,-929],[351,-960],[359,-989],[376,-1019],[387,-1046],[397,-1074],[407,-1105],[427,-1135],[447,-1167],[460,-1197],[464,-1225],[459,-1250],[445,-1281],[426,-1307],[405,-1336],[385,-1363],[367,-1387],[347,-1403],[330,-1416],[330,-1430],[329.8,-1446],[330,-1454.8]] },
  { id:'sakai-road', destination:'堺', origin:'花の京', width:4.4, knots:[[147,-805],[114,-788],[77,-766],[45,-740],[2,-729],[-43,-713],[-80,-680],[-117,-649],[-143,-627],[-159,-603],[-164,-601],[-169,-603.5],[-175,-603.8],[-180,-603.9],[-184,-605],[-187,-606]] },
  // The inland highway skirts the lake, then rejoins the old road to Rashomon.
  { id:'inland-road', destination:'花の京', origin:'蔵町の市', width:4.6, knots:[
    lakePoint(1.96,1.18),lakePoint(1.69,1.17),lakePoint(1.40,1.18),lakePoint(1.13,1.18),
    lakePoint(.84,1.17),lakePoint(.56,1.18),lakePoint(.30,1.18),[17,-296],[16,-317],[31,-353],
    [54,-422],[92,-474],[84,-538],[120,-608],[150,-680],[197,-730],[223,-741],[240,-747],[240,-760],[240,-804],[240,-845]] },
  // A contour road rounds the eastern shoulder above the lake, then uses
  // the north side of the pass to join the existing village highway.
  { id:'spring-pass-road', origin:'花の京', destination:'湯けむり峠', width:5.2, knots:[
    [31,-353],[28,-339],[34,-329],[55,-319],[82,-313],[107,-309],[132,-305],[156,-300],
    [171,-290],[178,-272],[178,-249],[172,-229],[169,-210],[174,-190],[177,-167],[182,-150],[178,-136]] },
];

// Heights in metres along the existing southern approach and the new spur.
// The short diagonal traverses the terrace face at z=-305. Only a road-width
// bench cuts that face; above and below it the original escarpment survives.
const freightGrades=[
  ['inland-road',[[240,-747,5.0],[235,-744.5,5.0],[229,-742.6,5.65],[213,-739,12.9],[198,-730,19.8],[181,-716,24.0]]],
  ['inland-road',[[129,-638,18.5],[121,-609,21.1],[109,-587,29.8],[94,-563,37.6],
    [86,-545,42.4],[84,-522,50.3],[89,-501,57.1],[93,-482,61.7],[91,-472,62.7],
    [83,-457,57.2],[69,-442,49.9],[56,-426,41.8],[47,-405,32.2],[38,-376,21.2],[34,-364,19.3]]],
  ['sakai-road',[[-131,-638,14.8],[-139,-631,14.6],[-146,-623,12.3],[-152,-615,8.65],[-159,-603,3.9],[-164,-601,2.4],[-169,-603.5,2.25]]],
  ['spring-pass-road',[[34,-329,27.8],[46,-322,26.1],[62,-317,22.7],[82,-313,20.4],[105,-310,17.4],
    [121,-307,13.6],[135,-304,9.4],[151,-301,5.5],[166,-295,4.0],[173,-287,4.0]]],
];
export function freightRoadEarthwork(curve) {
  const cells=new Map(),cell=(u,v)=>u*512+v,edge=7.2;
  for(const [id,profile] of freightGrades){
    const {width,knots}=TRADE_ROADS.find(r=>r.id===id);
    const {points}=curve(width,knots);
    const stops=profile.map(([x,z,y])=>{
      let best=0,least=Infinity;
      points.forEach(([u,v],i)=>{const d=(x-u)**2+(z-v)**2;if(d<least){least=d;best=i;}});
      return {i:best,y};
    });
    if(stops[0].i>stops.at(-1).i)stops.reverse();
    const distance=measureRoute(points).distances;
    const elevations=new Map();
    function heightAt(station){
      const k=stops.findIndex(stop=>distance[stop.i]>=station);
      if(k<0)return stops.at(-1).y;
      if(k===0)return stops[0].y;
      const a=stops[k-1],b=stops[k];
      return a.y+(b.y-a.y)*(station-distance[a.i])/(distance[b.i]-distance[a.i]);
    }
    for(let i=stops[0].i;i<=stops.at(-1).i;i++){
      const at=distance[i];
      // Round the changes of gradient over a wheelbase. A sharp summit on
      // a two-metre road polygon otherwise hangs above the painted hillside.
      elevations.set(i,(heightAt(at-3.3)+2*heightAt(at)+heightAt(at+3.3))/4);
    }
    const first=stops[0].i,last=stops.at(-1).i;
    const blend=at=>Math.max(0,Math.min(1,Math.min(at-distance[first],distance[last]-at)/6));
    for(let j=first;j<last;j++){
      const [x,z]=points[j],[xx,zz]=points[j+1],dx=xx-x,dz=zz-z;
      const height=elevations.get(j),length=distance[j+1]-distance[j];
      const segment={x,z,dx,dz,inverse:1/(length*length),height,rise:elevations.get(j+1)-height,
        blend:blend(distance[j]),blendEnd:blend(distance[j+1])};
      for(let u=Math.floor((Math.min(x,xx)-edge)/16);u<=Math.floor((Math.max(x,xx)+edge)/16);u++)
        for(let v=Math.floor((Math.min(z,zz)-edge)/16);v<=Math.floor((Math.max(z,zz)+edge)/16);v++){
          const key=cell(u,v);
          if(!cells.has(key))cells.set(key,[]);
          cells.get(key).push(segment);
        }
    }
  }
  return (x,z,native)=>{
    if(z< -756 || z> -278 || x< -177 || x>249)return native;
    const arcs=cells.get(cell(Math.floor(x/16),Math.floor(z/16)));
    if(!arcs)return native;
    let least=edge*edge,level=native,endBlend=0;
    for(const s of arcs){
      const t=Math.max(0,Math.min(1,((x-s.x)*s.dx+(z-s.z)*s.dz)*s.inverse));
      const d=(x-s.x-t*s.dx)**2+(z-s.z-t*s.dz)**2;
      if(d<least){least=d;level=s.height+t*s.rise;endBlend=s.blend+t*(s.blendEnd-s.blend);}
    }
    const bank=Math.min(1,Math.max(0,(Math.sqrt(least)-3.45)/(edge-3.45)));
    return native+(level-native)*(1-bank*bank*(3-2*bank))*endBlend;
  };
}

export function measureRoute(points) {
  let length=0;
  const distances=[0];
  for (let i=1; i<points.length; i++) {
    length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    distances.push(length);
  }
  return {points, distances, length};
}

// Out-and-back journeys pause at each town, giving walkers time to catch up.
export function cartPosition(route,time,speed,offset=0) {
  const wait=7, travel=route.length/speed, half=travel+wait;
  const clock=time+offset, cycle=clock%(2*half);
  const phase=cycle<0?cycle+2*half:cycle, returning=phase>=half;
  const legTime=phase%half, moving=legTime<travel;
  const along=Math.min(route.length,legTime*speed);
  const distance=returning ? route.length-along : along;
  let lo=1, hi=route.points.length-1;
  while (lo<hi) {
    const mid=(lo+hi)>>1;
    if (route.distances[mid]<distance) lo=mid+1; else hi=mid;
  }
  const [ax,az]=route.points[lo-1], [bx,bz]=route.points[lo];
  const blend=(distance-route.distances[lo-1])/(route.distances[lo]-route.distances[lo-1]);
  const turn=moving ? 0 : Math.PI*Math.min(1,(legTime-travel)/wait);
  const bearing=Math.atan2(bx-ax,bz-az);
  return {x:ax+(bx-ax)*blend,z:az+(bz-az)*blend,bearing,
    yaw:bearing+(returning?Math.PI:0)+turn,distance,moving,
    travelled:Math.floor(clock/half)*route.length+along};
}
