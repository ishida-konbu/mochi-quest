import { WORLD_BOUND,wrapWorld } from './geography.js';
import { SEAPORTS,OLD_TSURUGA,relocateOldQuay,portPoint,localPoint,DECK_Y,HOLD_Y,FIXED_BERTH } from './seaport-layout.js';

const pi=Math.PI;
const wrap=v=>wrapWorld(v);
const mix=(a,b,t)=>a+(b-a)*t;

// Arc-length samples avoid surging through a turn. In harbour the helm is
// straight for the last few lengths and the gangboard lies against the pier.
function seaLane(id,knots,closed=true,centripetal=false){
  const points=[],lengths=[0];let length=0;
  for(let i=0;i<knots.length-(closed?0:1);i++){
    const get=j=>knots[closed?(j+knots.length)%knots.length:Math.max(0,Math.min(knots.length-1,j))];
    const [a,b,c,d]=[get(i-1),get(i),get(i+1),get(i+2)];
    const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
    const span=distance(b,c),n=Math.max(12,Math.ceil(span/5));
    // Short harbour soundings merge into long offshore reaches. Centripetal
    // tangents prevent the helm from looping back between unequal soundings.
    const h0=Math.sqrt(distance(a,b)),h=Math.sqrt(span),h2=Math.sqrt(distance(c,d));
    const tangents=[0,1].map(j=>{
      if(!centripetal)return [(c[j]-a[j])/2,(d[j]-b[j])/2];
      const v=c[j]-b[j];
      return [h0 ? v+h*((b[j]-a[j])/h0-(c[j]-a[j])/(h0+h)) : v,
              h2 ? v+h*((d[j]-c[j])/h2-(d[j]-b[j])/(h+h2)) : v];
    });
    for(let k=0;k<n;k++) {
      const t=k/n,s=1-t;
      const q=[0,1].map(j=>(1+2*t)*s*s*b[j]+t*s*s*tangents[j][0]+
        t*t*(3-2*t)*c[j]-t*t*s*tangents[j][1]);
      if(points.length){
        const prev=points.at(-1);length+=Math.hypot(q[0]-prev[0],q[1]-prev[1]);lengths.push(length);
      }
      points.push(q);
    }
  }
  const last=closed?knots[0]:knots.at(-1);
  length+=Math.hypot(last[0]-points.at(-1)[0],last[1]-points.at(-1)[1]);
  points.push(last);lengths.push(length);
  return {id,knots,points,lengths,length};
}
const berth=p=>portPoint(p,-20,31.4),sakai=SEAPORTS[1];
const serviceSpeed=8.4,berthTime=48;
function exchangeLanes(tsuruga,northbound,southbound){
  return [
    seaLane('tsuruga-sakai',[berth(tsuruga),portPoint(tsuruga,-28,31.4),portPoint(tsuruga,-45,31.4),...southbound,
      [-854,-1021],[-866,-854],[-806,-684],[-666,-595],[-505,-553],[-377,-535],[-293,-548],[-260,-577],
      portPoint(sakai,8,34),portPoint(sakai,-5,31.4),portPoint(sakai,-14,31.4),berth(sakai)],false),
    seaLane('sakai-tsuruga',[berth(sakai),portPoint(sakai,-28,31.4),portPoint(sakai,-39,31.4),portPoint(sakai,-40,59),portPoint(sakai,-36,108),
      [-438,-610],[-588,-597],[-752,-644],[-881,-733],[-924,-900],[-893,-1058],...northbound,
      portPoint(tsuruga,9,34),portPoint(tsuruga,-5,31.4),portPoint(tsuruga,-14,31.4),berth(tsuruga)],false),
  ];
}
export const CROSSINGS=exchangeLanes(SEAPORTS[0],
  [[-850,-1212],[-697,-1328],[-483,-1417],[-242,-1493],[5,-1520],[153,-1508],[239,-1497],[294,-1488]],
  [[411,-1518],[392,-1543],[249,-1553],[47,-1551],[-183,-1548],[-419,-1499],[-621,-1409],[-780,-1253]]);
// Preserve the established sailing timetable, even as an extended fairway
// changes a passage's length. Both ports still exchange boats at the same hour.
export const crossingTimes=[330.33738208898944,321.12645907839567];
function circuit(northeast,northwest){
  return seaLane('ocean',[...northeast,[989,-688],[966,-124],[825,387],[754,762],[625,1060],
    [182,1080],[-345,901],[-820,671],[-1047,285],[-1114,-66],[-1100,-447],[-1072,-758],[-1000,-1080],...northwest]);
}

// The long passage rounds the eastern cape and the south of the island. The
// return leg takes the north-west passage. Separate offshore fairways keep
// reciprocal traffic apart; each final approach runs port side to the quay.
const tsuruga=SEAPORTS[0];
function harbourLeg(id,from,waypoints,to){
  const castOff=from===sakai
    ? [[-35,32.3],[-42,34.45],[-47.8,37.6],[-52,42],[-54.9,47.2]]
    : [[-36,32],[-44,33.8],[-52,36.3],[-57,39.3],[-60,43]];
  const approach=[[49,51.5],[36,45.2],[24,39.2],[14,35.2],[4,32.8],[-4,31.65],[-10,31.4],[-15,31.4]];
  return seaLane(id,[berth(from),portPoint(from,-24,31.4),portPoint(from,-28,31.4),
    ...castOff.map(([u,v])=>portPoint(from,u,v)),...waypoints,
    ...approach.map(([u,v])=>portPoint(to,u,v)),berth(to)],false,true);
}
const eastbound=harbourLeg('clockwise-east',tsuruga,[
  portPoint(tsuruga,-69,49),portPoint(tsuruga,-84,52),[465,-1503],[590,-1518],[721,-1480],[926,-1309],[1010,-1070],
  [962,-681],[933,-127],[800,380],[724,756],[604,1035],[181,1054],[-342,875],
  [-798,649],[-1040,267],[-1113,-63],[-1090,-299],[-1052,-394],[-978,-449],[-814,-475],
  [-627,-510],[-489,-544],[-377,-535],[-293,-548],portPoint(sakai,64,78),portPoint(sakai,61,62),
],sakai);
const sakaiChannel=[[-56,52],[-54.4,62],[-48,81],[-40,101],[-36,115]].map(([u,v])=>portPoint(sakai,u,v));
const westbound=harbourLeg('counterclockwise-south',sakai,[
  ...sakaiChannel,[-432,-611],[-591,-585],
  [-811,-522],[-999,-444],[-1135,-302],[-1151,-59],[-1080,305],[-842,702],
  [-360,933],[185,1113],[648,1084],[788,779],[856,392],[1004,-112],
  [1072,-697],[1081,-1066],[960,-1354],[709,-1542],[510,-1562],[339,-1574],
  [187,-1567],[91,-1567],[68,-1563],[51,-1553],[42,-1540],[41,-1527],[49,-1514],[66,-1504],[88,-1501],[128,-1500],[187,-1504],[245,-1510],portPoint(tsuruga,67,58),
],tsuruga);
const northwest=harbourLeg('clockwise-north',sakai,[
  ...sakaiChannel,[-421,-631],[-583,-626],[-739,-669],
  [-857,-743],[-896,-898],[-869,-1050],[-825,-1197],[-683,-1306],[-478,-1396],
  [-239,-1473],[4,-1502],[149,-1504],[236,-1510],portPoint(tsuruga,67,58),
],tsuruga);
const southwest=harbourLeg('counterclockwise-west',tsuruga,[
  portPoint(tsuruga,-68,53),portPoint(tsuruga,-73,66),portPoint(tsuruga,-73,79),
  portPoint(tsuruga,-67,92),portPoint(tsuruga,-55,102),portPoint(tsuruga,-36,109),[249,-1568],[43,-1570],[-195,-1565],[-437,-1523],[-646,-1430],
  [-809,-1264],[-881,-1036],[-896,-850],[-827,-662],[-681,-567],[-522,-530],
  [-387,-516],[-298,-535],portPoint(sakai,67,81),portPoint(sakai,61,62),
],sakai);
// A circuit spans two coastal ferry cycles, so a clear landing slot stays
// clear on every lap. Passage times include the call at the departing quay.
export const oceanPeriod=2*(crossingTimes[0]+crossingTimes[1]);
const northernPassage=372,southernPassage=oceanPeriod-northernPassage;
export const OCEAN_ROUTES=[
  {direction:'clockwise',legs:[eastbound,northwest],times:[southernPassage,northernPassage]},
  {direction:'counterclockwise',legs:[southwest,westbound],times:[northernPassage,southernPassage]},
];
export const SEAWAYS=[{id:'coastal-exchange',points:[...CROSSINGS[0].points,...CROSSINGS[1].points]},
  ...OCEAN_ROUTES.map(r=>({id:r.direction,points:[...r.legs[0].points,...r.legs[1].points]}))];
function fleet(ports,oldCircuit){
  return [
    ...ports.map((port,i)=>({id:port.id+'-trader',port,lane:null,color:i?'indigo':'red',index:i,moored:true})),
    ...ports.map((port,i)=>({id:port.id+'-voyager',port,exchange:true,speed:serviceSpeed,hold:berthTime,offset:i?crossingTimes[0]:0,color:i?'red':'indigo',index:2+i})),
    ...[0,.45,.72].map((part,i)=>({
      id:'ocean-trader-'+i,color:i%2?'indigo':'red',index:4+i,
      ...(oldCircuit?{lane:oldCircuit,speed:8.6,hold:0,offset:part*oldCircuit.length/8.6}:
        {route:OCEAN_ROUTES[i%2],hold:20,offset:[35,76,400][i]}),
    })),
  ];
}
export const FLEET=fleet(SEAPORTS);
function lanePoint(lane,along){
  let lo=0,hi=lane.points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(lane.lengths[mid]<=along)lo=mid;else hi=mid;}
  const a=lane.points[lo],b=lane.points[hi],t=(along-lane.lengths[lo])/(lane.lengths[hi]-lane.lengths[lo]);
  return [mix(a[0],b[0],t),mix(a[1],b[1],t)];
}
export function vesselPose(ship,time,out={},lanes=CROSSINGS,bound=WORLD_BOUND){
  let x,z,yaw,docked=true;
  if(ship.moored){
    [x,z]=portPoint(ship.port,FIXED_BERTH,31.4);
    yaw=ship.port.yaw-pi/2;
  }else{
    const {hold}=ship, easing=ship.route?20:2;
    let lane=ship.lane,speed=ship.speed,phase;
    if(ship.exchange || ship.route){
      const times=ship.route?.times ?? crossingTimes;
      const round=(time+ship.offset)%(times[0]+times[1]);
      const leg=round<times[0]?0:1;
      lane=(ship.route?.legs ?? lanes)[leg];phase=round-(leg?times[0]:0);
      speed=lane.length/(times[leg]-hold-easing);
    }else phase=(time+ship.offset)%(lane.length/speed);
    const travel=lane.length/speed;
    // Ramp the speed linearly while casting off and making fast.
    docked=hold>0 && phase<hold;
    const d=Math.max(0,phase-hold),w=easing;
    let along=speed*d;
    if(hold){
      if(d<w)along=speed*d*d/(2*w);
      else if(d>travel)along=lane.length-speed*(travel+w-d)**2/(2*w);
      else along=speed*(d-w/2);
    }
    [x,z]=lanePoint(lane,along);
    const a=lanePoint(lane,hold?Math.max(0,along-1.3):(along-1.3+lane.length)%lane.length);
    const b=lanePoint(lane,hold?Math.min(lane.length,along+1.3):(along+1.3)%lane.length);
    yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
  }
  Object.assign(out,{ship,x:wrapWorld(x,bound),z:wrapWorld(z,bound),yaw,y:(docked?.018:.058)*Math.sin(time*1.1+ship.index),docked});
  return out;
}
export function hullWidth(v){
  const aft=Math.max(0,(-v-5)/10.6),bow=Math.max(0,(v-4)/12);
  return Math.max(0,4.22-.53*aft-1.31*aft*aft-1.03*bow-2.85*bow*bow);
}
export const hatch={left:-1.24,right:1.24,bottom:-4.5,top:2.5};
export const stairTops=Array.from({length:16},(_,i)=>HOLD_Y+(DECK_Y-HOLD_Y)*i/15);
export const stepDepth=(hatch.top-hatch.bottom)/stairTops.length;
function localContact(p,x,z,feet,radius=0,bound=WORLD_BOUND,bodyHeight=1.33) {
  const dx=wrapWorld(x-p.x,bound),dz=wrapWorld(z-p.z,bound);
  if(Math.abs(dx)>19||Math.abs(dz)>19)return null;
  const local=localPoint({...p,x:0,z:0},dx,dz);
  const [u,v]=local,y=feet-p.y;
  let floor=-Infinity,ceiling=Infinity,solid=-Infinity;
  const gang=p.docked&&u>=-6.35&&u<-3.82&&Math.abs(v)<1.18;
  if(gang && y>=DECK_Y-.46)return {pose:p,u,v,floor:DECK_Y+p.y,ceiling,solid};
  const edge=hullWidth(v);
  if(v< -15.6-radius||v>16+radius||Math.abs(u)>edge+radius)return null;
  const keel=-1.66+.75*(Math.abs(v)/16)**2;
  if(y+bodyHeight<keel)return null;
  // A diver can go beneath the hull. In the narrowing bilge only the
  // breadth of the planks at the swimmer's height blocks the water.
  if(y<HOLD_Y-.34) {
    const depth=Math.min(1,Math.max(0,(y+bodyHeight-keel)/(DECK_Y+.7-keel)));
    if(Math.abs(u)>edge*(.57+.43*depth**.75)+radius)return null;
    return {pose:p,u,v,floor:-Infinity,ceiling:keel+p.y,solid:HOLD_Y+p.y};
  }
  const below=y<DECK_Y-.36;
  const stairs=u>hatch.left&&u<hatch.right&&v>hatch.bottom&&v<hatch.top;
  if(stairs){
    const i=Math.min(15,Math.floor((v-hatch.bottom)/stepDepth));
    floor=stairTops[i];
  }else if(!below)floor=DECK_Y;
  else if(y>HOLD_Y-.70)floor=HOLD_Y;
  if(below&&!stairs)ceiling=DECK_Y-.16;
  function wall(condition,top,bottom=-Infinity){
    if(condition&&y+bodyHeight>bottom&&y<top-.05)solid=Math.max(solid,top);
  }
  // Leave an opening in both bulwarks amidships for the boarding plank.
  wall(Math.abs(u)>edge-.18-radius || v>15.65-radius || v< -15.23+radius,
    below||Math.abs(v)>1.42?DECK_Y+.83:DECK_Y-.03);
  if(!below){
    wall(Math.abs(Math.abs(u)-1.37)<.09+radius&&v>hatch.bottom&&v<hatch.top-.06,DECK_Y+.72);
    wall(Math.abs(v-hatch.bottom)<.09+radius&&Math.abs(u)<1.38,DECK_Y+.72);
    const cabin=Math.abs(u)<2.55&&v>-13.6&&v<-8.7;
    wall(cabin&&(Math.abs(u)>2.30-radius || v<-13.3+radius || (v>-8.92-radius&&Math.abs(u)>1.10-radius)),DECK_Y+2.84);
    if(Math.abs(u)<2.94+radius && Math.abs(v+11.27)<2.94+radius){
      const roof=DECK_Y+3.37-.20*Math.abs(u);
      if(y<roof-.34){ceiling=roof-.18;wall(true,roof,roof-.18);}
      else floor=Math.max(floor,roof);
    }
    wall(Math.hypot(u-1.62,v-10.3)<.28+radius,DECK_Y+1.59,DECK_Y);
    for(const mast of [-6.35,8.2])wall(Math.hypot(u,v-mast)<.29+radius,DECK_Y+(mast<0?9.3:7.15));
  }else{
    wall(Math.abs(u)>1.76-radius&&Math.abs(u)<3.25+radius&&Math.abs(Math.abs(v)-6.6)<1.48+radius,HOLD_Y+1.45);
    for(const v0 of [-8.35,6.65])wall(Math.abs(v-v0)<.13+radius&&Math.abs(u)>1.02-radius,DECK_Y-.16);
  }
  return {pose:p,u,v,floor:floor+p.y,ceiling:ceiling+p.y,solid:solid+p.y};
}
// Reconstruct a saved deck in its original timetable and world size before
// transferring the passenger's local position, storey and bearing to its successor.
const oldBound=416*Math.SQRT2*2;
let legacyRoutes,legacyFleet,previousOceanShips;
export function restoreHarbourTraveller(player,time,edition){
  const movedPort=edition<9;
  if(movedPort && !legacyFleet){
    legacyRoutes=exchangeLanes(OLD_TSURUGA,
      [[-803,-1122],[-694,-1163],[-508,-1167],[-315,-1166],[-99,-1155],[54,-1132],[146,-1112],[197,-1094],[231,-1075]],
      [[342,-1092],[323,-1121],[184,-1134],[52,-1144],[-130,-1154],[-325,-1163],[-548,-1160],[-745,-1128]]);
    const outer=circuit([[540,-1193],[836,-1030]],[[-820,-1214],[-498,-1225],[-110,-1222],[270,-1225]]);
    legacyFleet=fleet([{...OLD_TSURUGA,id:'tsuruga'},sakai],outer);
  }
  if(!movedPort && !previousOceanShips){
    const outer=circuit([[640,-1540],[930,-1340],[1038,-1092]],
      [[-962,-1313],[-717,-1515],[-453,-1563],[-150,-1577],[231,-1579]]);
    previousOceanShips=fleet(SEAPORTS,outer).slice(4);
  }
  if(player.mode!=='kusa' && !player.diveDepth){
    const feet=player.y-player.h,bound=movedPort?oldBound:WORLD_BOUND;
    for(const ship of movedPort?legacyFleet:previousOceanShips){
      const old=vesselPose(ship,time,{},legacyRoutes,bound);
      const hit=localContact(old,player.x,player.z,feet,0,bound);
      if(!hit || !Number.isFinite(hit.floor) || Math.abs(feet-hit.floor)>.37)continue;
      const now=vesselPose(FLEET[ship.index],time),[x,z]=portPoint(now,hit.u,hit.v);
      const heading=player.heading+now.yaw-old.yaw;
      return {...player,x:wrap(x),z:wrap(z),y:player.y+now.y-old.y,heading:Math.atan2(Math.sin(heading),Math.cos(heading))};
    }
  }
  if(!movedPort)return player;
  const [x,z]=relocateOldQuay(player.x,player.z);
  return x===player.x && z===player.z ? player : {...player,x,z};
}
export function createVoyage(time=0){
  const poses=FLEET.map(s=>vesselPose(s,time)),prior=FLEET.map(s=>vesselPose(s,time));
  let boardedShip=null;
  function sample(x,z,y,radius=0,bodyHeight=1.33){
    for(const p of poses){const c=localContact(p,x,z,y,radius,WORLD_BOUND,bodyHeight);if(c)return c;}return null;
  }
  function supportingHull(player){
    if(!player || player.mode==='kusa' || player.diveDepth || player.skiff)return null;
    const hit=sample(player.x,player.z,player.y);
    return hit && player.y>=hit.floor-.12 && player.y-hit.floor<Math.max(.44,player.h+.18) && player.y>HOLD_Y-.15 ? hit : null;
  }
  function aboard(hit,player){
    // Keep a passenger through a jump, but a traveller flying across the masts
    // has not boarded. The taller mast rises 9.3 m above the main deck.
    return hit && (player.y-hit.floor<.44 || (hit.pose.ship===boardedShip && player.y<hit.pose.y+DECK_Y+9.3));
  }
  function passenger(player){
    const hit=supportingHull(player);
    if(!aboard(hit,player))return null;
    const {pose,u,v,floor,ceiling}=hit;
    return {id:pose.ship.id,u,v,docked:pose.docked,exposed:floor>=pose.y+DECK_Y-.36 && !Number.isFinite(ceiling)};
  }
  function update(t,player){
    const rider=supportingHull(player);
    boardedShip=aboard(rider,player) ? rider.pose.ship : null;
    for(let i=0;i<FLEET.length;i++){
      Object.assign(prior[i],poses[i]);vesselPose(FLEET[i],t,poses[i]);
    }
    if(rider){
      const i=rider.pose.ship.index,p=poses[i],old=prior[i],[x,z]=portPoint(p,rider.u,rider.v);
      player.x=wrap(x);player.z=wrap(z);player.y+=p.y-old.y;
      const heading=player.heading+p.yaw-old.yaw;
      player.heading=Math.atan2(Math.sin(heading),Math.cos(heading));
    }
  }
  function move(x,z,nx,nz,feet,radius=.23,bodyHeight=1.39){
    const free=(a,b)=>{
      const q=sample(a,b,feet,radius,bodyHeight);
      return !q||(q.solid<=feet+.34&&q.ceiling>=feet+bodyHeight&&(q.floor<=feet+.36||feet<HOLD_Y-.35));
    };
    const dx=wrap(nx-x),dz=wrap(nz-z),steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.30));
    for(let i=0;i<steps;i++){
      const a=wrap(x+dx/steps),b=wrap(z+dz/steps);
      if(free(a,b)){x=a;z=b;}
      else if(free(a,z))x=a;
      else if(free(x,b))z=b;
    }
    return {x,z};
  }
  return {poses,sample,passenger,update,move};
}
