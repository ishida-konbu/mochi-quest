// Stable additions to the delivery scroll. The location of each ensemble is
// relative to its landmark, including when a journey moves to a larger map.
import { TREES, REGIONS, BUILDINGS, regionAt, terrainHeight, groundHeight, solidHeightAt, nearRoad, WATER_Y } from './terrain.js';
import { DAIBUTSU } from './pilgrimage-layout.js';
import { RYUGU } from './ryugu-layout.js';
import { animalRadius, openGround, canopyHeight, walkCircuit } from './village-paths.js';
import { walkingScore } from './animal-motion.js';
import { forestGeometry } from './forest-mesh.js';

export const SCROLL_FAUNA = {
  elephant:{count:2,label:'象',points:150,stature:3.04,center:1.04,frame:4.0,
    volumes:[[0,1.15,-.05,.60,.68,1.04],[0,1.59,.91,.46,.49,.49],[0,1.02,1.35,.19,.61,.19],
      ...[-.36,.36].flatMap(x=>[-.72,.56].map(z=>[x,.47,z,.155,.47,.16]))]},
  baku:{count:10,label:'獏',points:90,stature:1.10,center:.88,frame:3.4,
    volumes:[[0,.90,-.05,.41,.49,.87],[0,1.16,.69,.29,.34,.42]]},
  hawk:{count:10,label:'鷹',points:70,stature:1.17,center:.38,frame:3.1,
    volumes:[[0,.33,.03,.19,.29,.43],[0,.51,.28,.17,.20,.20]]},
  ox:{count:10,label:'牛',points:65,stature:2.08,center:1.06,frame:3.8,
    volumes:[[0,1.11,-.17,.48,.56,.94],[0,1.55,.90,.28,.31,.52],
      ...[-.28,.28].flatMap(x=>[-.62,.44].map(z=>[x,.40,z,.095,.39,.11]))]},
  chicken:{count:40,label:'鶏',points:25,stature:1.03,center:.56,frame:1.95,
    volumes:[[0,.45,-.04,.25,.25,.43],[0,.75,.24,.15,.23,.20]]},
  fishfolk:{count:10,label:'魚人',points:55,stature:1.02,center:1.07,frame:2.9,
    volumes:[[0,.96,-.01,.39,.56,.27],[0,1.70,.075,.27,.31,.35],[-.43,1.09,.09,.17,.26,.18],[.43,1.09,.09,.17,.26,.18]]},
};
const tau=Math.PI*2, {sin,cos,hypot}=Math;
const kyo=REGIONS.find(r=>r.id==='kyo');
const place=id=>REGIONS.find(r=>r.id===id);
const shapeCache=new Map(), perchCache=new WeakMap(), motion={};
let plan;
function perchOn(tree) {
  if (!shapeCache.has(tree.form)) shapeCache.set(tree.form,forestGeometry(tree.form,true));
  const q=shapeCache.get(tree.form), yaw=tree.seed*2.39996323;
  return {tree,x:tree.x+tree.h*(cos(yaw)*q.x+sin(yaw)*q.z),z:tree.z+tree.h*(-sin(yaw)*q.x+cos(yaw)*q.z),
    y:terrainHeight(tree.x,tree.z)+tree.h*q.y,yaw:q.yaw+yaw};
}
function reachableBough(tree) {
  if(perchCache.has(tree))return perchCache.get(tree);
  const a=perchOn(tree);
  // A low lateral limb may grow into an adjacent cliff. Reserve the ones
  // with space for the talons and a clear, outward launch above the slope.
  let clear=true;
  for(let d=0;d<=14;d+=2){
    const x=a.x+sin(a.yaw)*d,z=a.z+cos(a.yaw)*d;
    if(Math.max(terrainHeight(x,z),solidHeightAt(x,z,.48))+.59>a.y+.58*d){clear=false;break;}
  }
  perchCache.set(tree,clear?a:null);
  return clear?a:null;
}
function hawkRoute(index) {
  // The same tree form and transform as the batched forest. Choose three
  // separate crowns, whose paths spread the ten birds across the scroll.
  const district=place(['river','shrine','coast','autumn','snow','dawn','kyo','peach','todaiji','inari'][index]);
  // In the second cedar and cypress forms the lowest needle fan hangs
  // directly over the landing spur. Other forms leave space for the feet.
  const trees=TREES.filter(t=>t.form!==undefined && t.kind!=='moso' && t.h>4 &&
    !((t.kind==='cedar'||t.kind==='cypress') && t.form%4===1));
  const stops=[];
  for(let j=0;j<3;j++){
    const a=index*2.39996+j*tau/3;
    const x=district.x+cos(a)*(44+j*23),z=district.z+sin(a)*(44+j*23);
    let best,score=Infinity;
    for(const tree of trees) {
      const d=(tree.x-x)**2+(tree.z-z)**2;
      if(d<score && !stops.some(s=>hypot(s.tree.x-tree.x,s.tree.z-tree.z)<32) && reachableBough(tree)) {score=d;best=tree;}
    }
    stops.push(reachableBough(best));
  }
  return stops.map((a,i)=>{
    const b=stops[(i+1)%3],d=hypot(b.x-a.x,b.z-a.z),count=Math.max(32,Math.ceil(d/1.45));
    const points=[],reach=Math.min(12,d*.16);
    for(let k=0;k<=count;k++){
      const t=k/count,s=1-t,arch=sin(Math.PI*t);
      // Climb outwards from the tip before turning towards the next crown.
      const x=s**3*a.x+3*s*s*t*(a.x+sin(a.yaw)*reach)+3*s*t*t*(b.x+sin(b.yaw)*reach)+t**3*b.x;
      const z=s**3*a.z+3*s*s*t*(a.z+cos(a.yaw)*reach)+3*s*t*t*(b.z+cos(b.yaw)*reach)+t**3*b.z;
      const earth=Math.max(WATER_Y,terrainHeight(x,z),solidHeightAt(x,z,.48));
      const floor=Math.max(earth,canopyHeight(x,z,.75));
      const leave=Math.min(1,arch*4);
      points.push({x,z,y:Math.max(earth+.44,Math.max(s*a.y+t*b.y+arch*(12+d*.055),floor+4.8)*leave
        +(s*a.y+t*b.y)*(1-leave))});
    }
    // Ease over high crowns on approach; keep the feet locked to each bough.
    for(let k=1;k<count;k++) points[k].y=Math.max(points[k].y,points[k-1].y-1.7);
    for(let k=count-1;k>0;k--) points[k].y=Math.max(points[k].y,points[k+1].y-1.7);
    // A high pass can be much longer than its projection on the map. Drive
    // the flight by the length in three dimensions, including the landing.
    points[0].y=a.y;points[count].y=b.y;
    const lengths=[0];
    for(let j=1;j<=count;j++){
      const p=points[j-1],q=points[j];
      lengths.push(lengths[j-1]+hypot(q.x-p.x,q.y-p.y,q.z-p.z));
    }
    return {a,b,points,lengths,flight:Math.max(9,lengths.at(-1)/9.4),rest:11+(i+index)%5};
  });
}
function groundOrigin(type,i) {
  if(type==='elephant') return [DAIBUTSU.x+(i?1:-1)*12,DAIBUTSU.z+19];
  if(type==='chicken') {
    // Birds peck in small coveys along four neighbourhood streets.
    const flock=i>>2, angle=(i%4)*1.57+flock;
    const yards=[[-28,19],[35,19],[-43,-26],[42,-25],[-19,-41],[20,-41],[-49,12],[43,28],[-23,-3],[29,1]];
    return [kyo.x+yards[flock][0]+cos(angle)*2.5,kyo.z+yards[flock][1]+sin(angle)*2.5];
  }
  const r=place((type==='baku'?['moon','shrine','autumn','peach','terraces']:['terraces','river','market','todaiji','peach'])[i%5]);
  const a=i*2.4+(type==='baku'?.82:.27),d=type==='baku'?75:33;
  return [r.x+cos(a)*d,r.z+sin(a)*d];
}
function findGround(n,residents) {
  const [cx,cz]=groundOrigin(n.type,n.variant), pad=animalRadius(n),samples=Math.max(14,Math.ceil(tau*n.radius/.55));
  const wilderness=n.type==='baku';
  for(let k=0;k<20000;k++){
    const r=Math.sqrt(k)*(wilderness?1.9:1.1),a=k*2.39996+n.phase;
    n.homeX=cx+cos(a)*r;n.homeZ=cz+sin(a)*r;
    if(n.type==='chicken' && (Math.abs(n.homeX-kyo.x)>52 || Math.abs(n.homeZ-kyo.z)>49))continue;
    if(wilderness && (terrainHeight(n.homeX,n.homeZ)>23 || nearRoad(n.homeX,n.homeZ,10+n.radius) ||
      BUILDINGS.some(b=>hypot(n.homeX-b.x,n.homeZ-b.z)<33+Math.max(b.w,b.d)) ||
      REGIONS.some(p=>p.id!=='ryugu' && hypot(n.homeX-p.x,n.homeZ-p.z)<43)))continue;
    if(residents.some(o=>o.type===n.type && hypot(o.homeX-n.homeX,o.homeZ-n.homeZ)<2*n.radius+pad))continue;
    const spot={};let clear=true;
    for(let j=0;j<samples;j++){
      walkCircuit(n,tau*j/samples,spot);
      const h=terrainHeight(spot.x,spot.z);
      if(!openGround(spot.x,spot.z,pad+.19) || Math.abs(terrainHeight(spot.x+1,spot.z+1)-h)>.9){clear=false;break;}
    }
    if(clear)return;
  }
  throw new Error('Missing habitat for '+n.id);
}
const courtSeats=[[11,-11],[7,7],[-2,-9],[8,3],[-4,8],[5,-11],[-2,12],[9,10],[-7,3],[6,-17]];
export function makeScrollFauna() {
  if(!plan) {
    plan=[];
    for(const [type,spec] of Object.entries(SCROLL_FAUNA)) for(let i=0;i<spec.count;i++){
      const n={type,id:'scroll-'+type+'-'+(i+1),scrollFauna:true,role:'roam',variant:i,phase:(i*2.39996+.43)%tau,
        stature:spec.stature*(.93+.12*(.5+.5*sin(i*2.73))),manner:i%3,flash:0,mounted:false};
      if(type==='hawk') {
        n.route=hawkRoute(i);n.cycle=n.route.reduce((sum,leg)=>sum+leg.rest+leg.flight,0);
        n.homeX=n.route[0].a.x;n.homeZ=n.route[0].a.z;
      }else if(type==='fishfolk'){
        const [x,z]=courtSeats[i];
        n.homeX=RYUGU.x+x;n.homeZ=RYUGU.z+z;
      }else{
        n.radius=type==='chicken'?.79: type==='elephant'?1.42:2.3;
        n.cruise=(type==='chicken'?.48:type==='baku'?.66:.50)/n.radius;
        findGround(n,plan);
      }
      n.habitat=type==='fishfolk'?'ryugu':REGIONS[regionAt(n.homeX,n.homeZ)].id;
      plan.push(n);
    }
  }
  return plan.map(proto=>moveScrollFauna({...proto},0));
}
export function moveScrollFauna(n,time) {
  if(n.type==='hawk'){
    let turn=(time+n.variant*17.59)%n.cycle,leg=n.route[0];
    for(const segment of n.route){
      leg=segment;
      if(turn<leg.rest+leg.flight)break;
      turn-=leg.rest+leg.flight;
    }
    n.perched=turn<leg.rest;n.speed=0;
    if(n.perched){
      const previous=n.route[(n.route.indexOf(leg)+n.route.length-1)%n.route.length].points;
      const tip=previous.at(-1),before=previous.at(-2),after=leg.points[1];
      const arrival=Math.atan2(tip.x-before.x,tip.z-before.z);
      const depart=Math.atan2(after.x-leg.a.x,after.z-leg.a.z);
      const u=turn/leg.rest,turningOut=u>.68;
      // Settle broadside so both feet grip the branch, then turn to take off.
      const broadside=leg.a.yaw+Math.PI/2,from=turningOut?broadside:arrival,to=turningOut?depart:broadside;
      const f=turningOut?Math.min(1,(u-.68)/.29):Math.min(1,u/.23);
      n.x=leg.a.x;n.z=leg.a.z;n.y=leg.a.y;n.spread=0;
      n.heading=from+Math.atan2(sin(to-from),cos(to-from))*f*f*(3-2*f);
    }
    else {
      const t=Math.min(1,Math.max(0,(turn-leg.rest)/leg.flight)),u=t*t*(3-2*t);
      const distance=u*leg.lengths.at(-1);
      let lo=0,hi=leg.points.length-1;
      while(hi-lo>1){const mid=(lo+hi)>>1;if(leg.lengths[mid]<distance)lo=mid;else hi=mid;}
      const p=leg.points[lo],q=leg.points[hi],mix=(distance-leg.lengths[lo])/(leg.lengths[hi]-leg.lengths[lo]);
      n.x=p.x+(q.x-p.x)*mix;n.y=p.y+(q.y-p.y)*mix;n.z=p.z+(q.z-p.z)*mix;
      n.heading=Math.atan2(q.x-p.x,q.z-p.z);
      n.spread=Math.min(1,t*10,(1-t)*9);n.speed=n.spread*8;
    }
    n.altitude=n.y-terrainHeight(n.x,n.z);
    n.bank=sin(time*6.2+n.phase)*(.42+.30*sin(time*.77+n.phase));
    n.habitat=REGIONS[regionAt(n.x,n.z)].id;
  }else if(n.type==='fishfolk'){
    const a=n.phase+time*.37;
    n.x=n.homeX+.33*sin(a);n.z=n.homeZ+.28*cos(a);
    n.y=terrainHeight(n.x,n.z)+.14+.12*(1+sin(a*.92));
    n.heading=1.15+.48*sin(a*.64)+n.phase;n.gesture=.5+.5*cos(a);n.speed=.2;
  }else{
    walkingScore(time,n,motion);
    const a=n.phase+motion.travel*n.cruise;
    walkCircuit(n,a,n);n.y=groundHeight(n.x,n.z);n.heading=Math.atan2(cos(a),-.66*sin(a));
    n.speed=motion.pace*n.cruise*n.radius;n.gesture=motion.gesture;
  }
  return n;
}

// Four movement phases and eight views of every silhouette, including the
// closed wings of a perched hawk and the shorter tail of a hen.
export const FAUNA_SHEET={atlas:'scroll-fauna.webp?v=otsu-eyes-1',columns:16,rows:16,width:144,height:144,poses:4};
export const faunaPrints=['elephant','baku','hawk','ox','chicken','hen','fishfolk','hawk-perched'];
export function faunaDrawing(n) {
  const kind=n.type==='hawk' && n.perched?'hawk-perched':n.type==='chicken' && n.variant%4!==0?'hen':n.type;
  return {start:faunaPrints.indexOf(kind)*32,poses:4};
}
export const faunaFrequency=type=>type==='chicken'?6.5:type==='hawk'?6.2:3.2;
