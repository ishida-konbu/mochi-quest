// Freight follows the same painted curves as the player. Only town squares
// and the paved forecourt at the Sakai warehouses need short local links.
import { CONNECTING_ROADS, ROADS } from './terrain.js';
import { measureRoute } from './trade-routes.js';

const highway=id=>CONNECTING_ROADS.find(road=>road.id===id);
function nearest(points,[x,z]){
  let best=0,distance=Infinity;
  points.forEach(([px,pz],i)=>{
    const d=(px-x)**2+(pz-z)**2;
    if(d<distance){distance=d;best=i;}
  });
  return best;
}
function section(road,from,to){
  const points=road.points,a=from?nearest(points,from):0,b=to?nearest(points,to):points.length-1;
  return a<=b?points.slice(a,b+1):points.slice(b,a+1).reverse();
}
function join(...pieces){
  const points=[];
  for(const piece of pieces)for(const p of piece){
    const prev=points.at(-1);
    if(!prev || Math.hypot(prev[0]-p[0],prev[1]-p[1])>.01)points.push(p);
  }
  return points;
}
// A long ox and its shaft sweep around the square. Round the abrupt
// corners where two separately surveyed streets meet inside the junction.
function roundTurns(points){
  const rounded=[];
  let first=0;
  for(let i=2;i<points.length-2;i++){
    const [x,z]=points[i],before=points[i-1],after=points[i+1];
    const ax=x-before[0],az=z-before[1],bx=after[0]-x,bz=after[1]-z;
    if(ax*bx+az*bz>.91*Math.hypot(ax,az)*Math.hypot(bx,bz) || i-2<first)continue;
    const begin=points[i-2],end=points[i+2];
    rounded.push(...points.slice(first,i-1));
    for(let j=1;j<9;j++){
      const t=j/9,u=1-t;
      rounded.push([u*u*begin[0]+2*u*t*x+t*t*end[0],u*u*begin[1]+2*u*t*z+t*t*end[1]]);
    }
    first=i+2;
  }
  return rounded.concat(points.slice(first));
}
function route(id,origin,destination,width,lane,centres){
  const points=roundTurns(centres);
  const bounds={west:Infinity,east:-Infinity,north:Infinity,south:-Infinity};
  for(const [x,z] of points){
    bounds.west=Math.min(bounds.west,x);bounds.east=Math.max(bounds.east,x);
    bounds.north=Math.min(bounds.north,z);bounds.south=Math.max(bounds.south,z);
  }
  return {...measureRoute(points),bounds,id,origin,destination,width,lane};
}
const city='花の京',spring='湯けむり峠',market='蔵町の市',temple='東大寺';
const fork=[31,-353],pass=[144,-107],square=[17,-64],moon=[-55,290];
const localRoad=(x,z,endX,endZ)=>ROADS.find(({points})=>
  points[0][0]===x && points[0][1]===z && points.at(-1)[0]===endX && points.at(-1)[1]===endZ);
const eastWest=localRoad(-154,-85,178,-136),riverRoad=localRoad(7,213,-21,-107);
const moonRoad=localRoad(7,213,-89,313);
const westStreet=ROADS.find(({points})=>points[0][0]===140 && points.at(-1)[0]===140 &&
  points[0][1]<-831 && points.at(-1)[1]>-807);
const fromKyoto=route('kyoto-spring',city,spring,4.6,1.90,join(
  section(highway('inland-road'),[240,-817],fork),highway('spring-pass-road').points,
  section(eastWest,[178,-136],pass)));
const fromPass=route('spring-market',spring,market,4.8,1.90,section(eastWest,pass,square));
const toTemple=route('market-todaiji',market,temple,4.2,1.90,join(
  section(riverRoad,square,[7,213]),section(moonRoad,[7,213],moon),
  highway('temple-road').points));
const toSakai=route('kyoto-sakai',city,'堺',4.4,1.90,join(
  section(westStreet,[140,-830],[140,-807]),
  [[139.9,-805],[139.2,-802.5],[137.8,-800.4]],section(highway('sakai-road'),[136.4,-799.7])));
export const MARKET_HIGHWAYS=[toSakai,fromKyoto,fromPass,toTemple];
export const THROUGH_MARKET_HIGHWAY=route('kyoto-todaiji',city,temple,4.2,1.90,
  join(fromKyoto.points,fromPass.points,toTemple.points));
