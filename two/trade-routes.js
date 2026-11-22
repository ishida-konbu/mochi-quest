// The same centrelines guide the road painter, ox drivers and atlas.
export const TRADE_ROADS = [
  { id:'capital-road', destination:'花の京', origin:'雪灯りの都', width:5.3, knots:[[-75,-290],[-58,-289],[-45,-283],[-37,-277],[-22,-278],[-11,-289],[4,-320],[31,-353],[54,-422],[92,-474],[84,-538],[120,-608],[150,-680],[197,-730],[223,-741],[240,-747],[240,-760],[240,-804],[240,-845]] },
  { id:'temple-road', destination:'東大寺', origin:'十五夜の薄野', width:4.7, knots:[[-55,290],[-38,312],[3,330],[51,345],[96,345],[140,384],[173,425],[187,486],[230,544],[254,601],[308,638],[345,706],[369,779],[393,853],[407,874],[423,876],[430,870],[430,853]] },
  { id:'peach-pass', destination:'桃源郷', origin:'竹隠れの社', width:3.6, knots:[[-153,-85],[-171,-80],[-204,-75],[-230,-77],[-261,-97],[-288,-104],[-340,-119],[-409,-100],[-470,-126],[-542,-130],[-606,-168],[-672,-187],[-709,-204],[-737,-197],[-758,-179],[-780,-182]] },
  { id:'inari-road', destination:'伏見稲荷', origin:'花の京', width:4.3, knots:[[240,-744],[273,-747],[290,-745],[340,-730],[390,-690],[438,-678],[490,-680],[540,-640],[540,-590],[540,-540],[545,-482],[543,-460],[532,-435],[512,-419],[431,-417],[402,-425],[405,-434]] },
  { id:'tsuruga-road', destination:'敦賀', origin:'花の京', width:4.8, knots:[[340,-929],[351,-960],[359,-989],[376,-1019],[387,-1046],[397,-1074],[407,-1105],[427,-1135],[447,-1167],[460,-1197],[464,-1225],[459,-1250],[445,-1281],[426,-1307],[405,-1336],[385,-1363],[367,-1387],[347,-1403],[330,-1416],[330,-1430],[329.8,-1446],[330,-1454.8]] },
  { id:'sakai-road', destination:'堺', origin:'花の京', width:4.4, knots:[[147,-805],[114,-788],[77,-766],[45,-740],[2,-729],[-43,-713],[-80,-680],[-117,-649],[-143,-627],[-159,-603]] },
];

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
  const phase=(time+offset)%(2*half), returning=phase>=half;
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
  return {x:ax+(bx-ax)*blend,z:az+(bz-az)*blend,
    yaw:Math.atan2(bx-ax,bz-az)+(returning?Math.PI:0)+turn,distance,moving,
    travelled:Math.floor((time+offset)/half)*route.length+along};
}
