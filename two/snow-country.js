// The snow street retains its surveyed lots and faces north, over the winter sea.
export const SNOW_TOWN = { x:713, z:-1123 };
export const FOREST_LAKE = { x:-78, z:-290, rx:75, rz:48, level:.38 };
export function snowPoint(x,z) {
  return [SNOW_TOWN.x+x-FOREST_LAKE.x, SNOW_TOWN.z+z-FOREST_LAKE.z];
}

// Scalloped bays and two long points keep the reflection pool enclosed.
function lakeShore(a) {
  return 1+.095*Math.cos(3*a+.48)+.066*Math.sin(2*a-.73)+.039*Math.sin(5*a+.28);
}
export function lakeRadius(x,z) {
  const u=(x-FOREST_LAKE.x)/FOREST_LAKE.rx, v=(z-FOREST_LAKE.z)/FOREST_LAKE.rz;
  // Only the basin and its apron have a shoreline coordinate. Most terrain
  // samples on the world sheet return before the angle and trigonometry.
  if(Math.abs(u)>2 || Math.abs(v)>2)return Infinity;
  return Math.hypot(u,v)/lakeShore(Math.atan2(v,u));
}
export function lakePoint(a,r=1) {
  const radius=r*lakeShore(a);
  return [FOREST_LAKE.x+FOREST_LAKE.rx*radius*Math.cos(a), FOREST_LAKE.z+FOREST_LAKE.rz*radius*Math.sin(a)];
}
export const lakeRadiusGLSL = `float lakeRadius(vec2 p){
  vec2 uv=(p-vec2(${FOREST_LAKE.x}.,${FOREST_LAKE.z}.))/vec2(${FOREST_LAKE.rx}.,${FOREST_LAKE.rz}.);
  if(dot(uv,uv)<1.e-12)return 0.;
  float a=atan(uv.y,uv.x);
  return length(uv)/(1.+.095*cos(3.*a+.48)+.066*sin(2.*a-.73)+.039*sin(5.*a+.28));
}`;

// The cart road climbs from the sea, crosses the divide, and descends to Kyoto.
// On the seaward face a long hairpin traverses the spur before turning inland.
export const SNOW_PASS = [
  [715,-1123,9], [695,-1123,8.4], [680,-1118,8.3], [666,-1107,10.8],
  [650,-1091,17.4], [641,-1081,21.6], [644,-1072,24.7], [655,-1064,29.1],
  [663,-1055,33.1], [661,-1049,35.2], [652,-1049,38.3], [638,-1056,43.3],
  [617,-1061,48.2], [596,-1065,50.4], [576,-1062,53.7], [549,-1053,55.1],
  [527,-1044,51.0], [511,-1033,45.5], [493,-1027,39.2], [473,-1017,32.6],
  [452,-1003,26.2], [431,-995,21.8], [406,-976,18.1], [386,-954,15.3],
  [367,-946,11.7], [350,-929,6],
];
