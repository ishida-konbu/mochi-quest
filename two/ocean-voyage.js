import { WORLD_BOUND,wrapWorld } from './geography.js';
import { SEAPORTS,OLD_TSURUGA,relocateOldQuay,portPoint,localPoint,DECK_Y,HOLD_Y,FIXED_BERTH } from './seaport-layout.js';

const pi=Math.PI;
const wrap=v=>wrapWorld(v);
const mix=(a,b,t)=>a+(b-a)*t;

// Arc-length samples avoid surging through a turn. In harbour the helm is
// straight for the last few lengths and the gangboard lies against the pier.
function seaLane(id,knots,closed=true){
  const points=[],lengths=[0];let length=0;
  for(let i=0;i<knots.length-(closed?0:1);i++){
    const get=j=>knots[closed?(j+knots.length)%knots.length:Math.max(0,Math.min(knots.length-1,j))];
    const [a,b,c,d]=[get(i-1),get(i),get(i+1),get(i+2)];
    const n=Math.max(12,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/5));
    for(let k=0;k<n;k++) {
      const t=k/n;
      const q=[0,1].map(j=>.5*(2*b[j]+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+
        (-a[j]+3*b[j]-3*c[j]+d[j])*t*t*t));
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
const outerLane=circuit([[640,-1540],[930,-1340],[1038,-1092]],
  [[-962,-1313],[-717,-1515],[-453,-1563],[-150,-1577],[231,-1579]]);
export const SEAWAYS=[{id:'coastal-exchange',points:[...CROSSINGS[0].points,...CROSSINGS[1].points]},outerLane];
function fleet(ports,circuit){
  return [
    ...ports.map((port,i)=>({id:port.id+'-trader',port,lane:null,color:i?'indigo':'red',index:i,moored:true})),
    ...ports.map((port,i)=>({id:port.id+'-voyager',port,exchange:true,speed:serviceSpeed,hold:berthTime,offset:i?crossingTimes[0]:0,color:i?'red':'indigo',index:2+i})),
    ...[0,.45,.72].map((part,i)=>({id:'ocean-trader-'+i,lane:circuit,speed:8.6,hold:0,offset:part*circuit.length/8.6,color:i%2?'indigo':'red',index:4+i})),
  ];
}
export const FLEET=fleet(SEAPORTS,outerLane);
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
    const {hold}=ship;
    let lane=ship.lane,speed=ship.speed,phase;
    if(ship.exchange){
      const round=(time+ship.offset)%(crossingTimes[0]+crossingTimes[1]);
      const leg=round<crossingTimes[0]?0:1;
      lane=lanes[leg];phase=round-(leg?crossingTimes[0]:0);
      speed=lane.length/(crossingTimes[leg]-hold-2);
    }else phase=(time+ship.offset)%(lane.length/speed);
    const travel=lane.length/speed;
    // Cubic end caps ease a laden hull away from and back to her mooring.
    docked=hold>0 && phase<hold;
    const d=Math.max(0,phase-hold),w=2;
    let along=speed*d;
    if(hold){
      if(d<w)along=speed*d*d/(2*w);
      else if(d>travel)along=lane.length-speed*(travel+w-d)**2/(2*w);
      else along=speed*(d-w/2);
    }
    [x,z]=lanePoint(lane,along);
    const a=lanePoint(lane,ship.exchange?Math.max(0,along-1.3):(along-1.3+lane.length)%lane.length);
    const b=lanePoint(lane,ship.exchange?Math.min(lane.length,along+1.3):(along+1.3)%lane.length);
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
function localContact(p,x,z,feet,radius=0,bound=WORLD_BOUND) {
  const dx=wrapWorld(x-p.x,bound),dz=wrapWorld(z-p.z,bound);
  if(Math.abs(dx)>19||Math.abs(dz)>19)return null;
  const local=localPoint({...p,x:0,z:0},dx,dz);
  const [u,v]=local,y=feet-p.y;
  let floor=-Infinity,ceiling=Infinity,solid=-Infinity;
  const gang=p.docked&&u>=-6.35&&u<-3.82&&Math.abs(v)<1.18;
  if(gang && y>=DECK_Y-.46)return {pose:p,u,v,floor:DECK_Y+p.y,ceiling,solid};
  const edge=hullWidth(v);
  if(v< -15.6-radius||v>16+radius||Math.abs(u)>edge+radius)return null;
  const below=y<DECK_Y-.36;
  const stairs=u>hatch.left&&u<hatch.right&&v>hatch.bottom&&v<hatch.top;
  if(stairs){
    const i=Math.min(15,Math.floor((v-hatch.bottom)/stepDepth));
    floor=stairTops[i];
  }else if(!below)floor=DECK_Y;
  else if(y>HOLD_Y-.70)floor=HOLD_Y;
  if(below&&!stairs)ceiling=DECK_Y-.16;
  function wall(condition,top,bottom=-Infinity){
    if(condition&&y+1.33>bottom&&y<top-.05)solid=Math.max(solid,top);
  }
  // Leave an opening in both bulwarks amidships for the boarding plank.
  wall(Math.abs(u)>edge-.18-radius || v>15.65-radius || v< -15.23+radius,
    below||Math.abs(v)>1.42?DECK_Y+.83:DECK_Y-.03);
  if(!below){
    wall(Math.abs(Math.abs(u)-1.37)<.09+radius&&v>hatch.bottom&&v<hatch.top-.06,DECK_Y+.72);
    wall(Math.abs(v-hatch.bottom)<.09+radius&&Math.abs(u)<1.38,DECK_Y+.72);
    const cabin=Math.abs(u)<2.55&&v>-13.6&&v<-8.7;
    wall(cabin&&(Math.abs(u)>2.30-radius || v<-13.3+radius || (v>-8.92-radius&&Math.abs(u)>1.10-radius)),DECK_Y+2.84);
    if(cabin && y<DECK_Y+2.64)ceiling=DECK_Y+2.64;
    for(const mast of [-6.35,8.2])wall(Math.hypot(u,v-mast)<.29+radius,DECK_Y+12.7);
  }else{
    wall(Math.abs(u)>1.76-radius&&Math.abs(u)<3.25+radius&&Math.abs(Math.abs(v)-6.6)<1.48+radius,HOLD_Y+1.45);
    for(const v0 of [-8.35,6.65])wall(Math.abs(v-v0)<.13+radius&&Math.abs(u)>1.02-radius,DECK_Y-.16);
  }
  return {pose:p,u,v,floor:floor+p.y,ceiling:ceiling+p.y,solid:solid+p.y};
}
// Releases seven and eight recorded the position of a passenger in world
// coordinates. Reconstruct the old hull at the saved instant, including hulls
// straddling the former world seam, then carry the passenger's berth and bearing.
const oldBound=416*Math.SQRT2*2;
let legacyRoutes,legacyFleet;
export function restoreHarbourTraveller(player,time){
  if(!legacyFleet){
    legacyRoutes=exchangeLanes(OLD_TSURUGA,
      [[-803,-1122],[-694,-1163],[-508,-1167],[-315,-1166],[-99,-1155],[54,-1132],[146,-1112],[197,-1094],[231,-1075]],
      [[342,-1092],[323,-1121],[184,-1134],[52,-1144],[-130,-1154],[-325,-1163],[-548,-1160],[-745,-1128]]);
    const outer=circuit([[540,-1193],[836,-1030]],[[-820,-1214],[-498,-1225],[-110,-1222],[270,-1225]]);
    legacyFleet=fleet([{...OLD_TSURUGA,id:'tsuruga'},sakai],outer);
  }
  if(player.mode!=='kusa' && !player.diveDepth){
    const feet=player.y-player.h;
    for(const ship of legacyFleet){
      const old=vesselPose(ship,time,{},legacyRoutes,oldBound);
      const hit=localContact(old,player.x,player.z,feet,0,oldBound);
      if(!hit || !Number.isFinite(hit.floor) || Math.abs(feet-hit.floor)>.37)continue;
      const now=vesselPose(FLEET[ship.index],time),[x,z]=portPoint(now,hit.u,hit.v);
      const heading=player.heading+now.yaw-old.yaw;
      return {...player,x:wrap(x),z:wrap(z),y:player.y+now.y-old.y,heading:Math.atan2(Math.sin(heading),Math.cos(heading))};
    }
  }
  const [x,z]=relocateOldQuay(player.x,player.z);
  return x===player.x && z===player.z ? player : {...player,x,z};
}
export function createVoyage(time=0){
  const poses=FLEET.map(s=>vesselPose(s,time)),prior=FLEET.map(s=>vesselPose(s,time));
  function sample(x,z,y,radius=0){
    for(const p of poses){const c=localContact(p,x,z,y,radius);if(c)return c;}return null;
  }
  function update(t,player){
    let rider=null;
    if(player&&player.mode!=='kusa'&&!player.diveDepth){
      rider=sample(player.x,player.z,player.y);
      if(rider && !(player.y>=rider.floor-.12&&player.y-rider.floor<Math.max(.44,player.h+.18)&&player.y>HOLD_Y-.15))rider=null;
    }
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
  function move(x,z,nx,nz,feet,radius=.23){
    const free=(a,b)=>{
      const q=sample(a,b,feet,radius);
      return !q||(q.solid<=feet+.34&&q.ceiling>=feet+1.39&&(q.floor<=feet+.36||feet<HOLD_Y-.35));
    };
    if(free(nx,nz))return {x:nx,z:nz};
    if(free(nx,z))return {x:nx,z};
    if(free(x,nz))return {x,z:nz};
    return {x,z};
  }
  return {poses,sample,update,move};
}
