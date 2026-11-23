// A mason's path on the southwest bank of the maple bridge. +Z in each
// stone's local frame points downhill. Heights are world elevations.
const head = {x:287.70, z:-117.20, y:12.09};
const turn = {x:282.65, z:-126.18, y:5.13};
const shore = {x:288.50, z:-126.45, y:.58};
const width = 1.05;

function flight(a,b,count,bend) {
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  return {a,b,count,bend,length,sx:dx/length,sz:dz/length,yaw:Math.atan2(dx,dz)};
}
const downBank=flight(head,turn,35,.23), alongBank=flight(turn,shore,23,0);
const middleYaw=(Math.atan2(-downBank.sx,-downBank.sz)+alongBank.yaw)/2-Math.PI/4;

const headstone={...head,width:1.12,depth:.84,yaw:downBank.yaw,isLanding:true};
const turningStone={...turn,width:1.53,depth:1.53,yaw:middleYaw,isLanding:true};
const waterstone={...shore,width:1.09,depth:1.06,yaw:alongBank.yaw,isLanding:true};

function rimDistance(stone,run) {
  const angle=run.yaw-stone.yaw;
  return Math.min(stone.width/(2*Math.abs(Math.sin(angle))),stone.depth/(2*Math.abs(Math.cos(angle))));
}
function steps(run,start,end) {
  const {a,b,count,length,sx,sz,yaw,bend}=run;
  const first=rimDistance(start,run),last=length-rimDistance(end,run);
  const going=(last-first)/count;
  run.gradeStart=first-going/2;
  run.gradeLength=last-first+going;
  return Array.from({length:count},(_,i)=>{
    const distance=first+(i+.5)*going,t=(i+1)/(count+1);
    return {x:a.x+sx*distance,z:a.z+sz*distance,y:a.y+(b.y-a.y)*t*(1-bend+bend*t),
      yaw,width,depth:going+.012,isLanding:false};
  });
}
export const KAEDE_WATER_TREADS=[
  headstone,...steps(downBank,headstone,turningStone),turningStone,
  ...steps(alongBank,turningStone,waterstone),waterstone,
];

export function onKaedeWaterStep(x,z,padding=0) {
  if(x<281-padding || x>290+padding || z< -128-padding || z> -116+padding)return false;
  return KAEDE_WATER_TREADS.some(stone=>{
    const dx=x-stone.x,dz=z-stone.z,s=Math.sin(stone.yaw),c=Math.cos(stone.yaw);
    return Math.abs(dx*c-dz*s)<=stone.width/2+padding && Math.abs(dx*s+dz*c)<=stone.depth/2+padding;
  });
}

// Narrow benches cut into the upper face and bank up the exposed cheek of
// the lower flight. A little earth remains over the submerged riverbed.
const flights=[downBank,alongBank], landings=[headstone,turningStone,waterstone];
export function kaedeStairBed(x,z,native) {
  if(x<280.0 || x>291.0 || z< -129.0 || z> -114.5)return native;
  let nearest=Infinity,height=native;
  for(const stone of landings) {
    const dx=x-stone.x,dz=z-stone.z,s=Math.sin(stone.yaw),c=Math.cos(stone.yaw);
    const distance=Math.hypot(Math.max(0,Math.abs(dx*c-dz*s)-stone.width/2),
      Math.max(0,Math.abs(dx*s+dz*c)-stone.depth/2));
    if(distance<nearest){nearest=distance;height=stone.y;}
  }
  for(const run of flights) {
    const {a,b,sx,sz,bend,gradeStart,gradeLength}=run,dx=x-a.x,dz=z-a.z;
    const along=dx*sx+dz*sz-gradeStart;
    const outside=Math.max(-along,0,along-gradeLength);
    const distance=Math.hypot(Math.max(0,Math.abs(dx*sz-dz*sx)-width/2),outside);
    if(distance<nearest) {
      const t=Math.max(0,Math.min(1,along/gradeLength));
      nearest=distance;height=a.y+(b.y-a.y)*t*(1-bend+bend*t);
    }
  }
  const blend=Math.max(0,Math.min(1,(1.25-nearest)/.95));
  // The top apron runs flush to the headstone; the elbow has a deeper
  // socket where the faces of the two flights meet at different angles.
  const socket=.24+.10*Math.max(0,Math.min(1,12-height))+.08*Math.max(0,1-
    Math.hypot(x-turn.x,z-turn.z)/2.8);
  return native+(height-socket-native)*blend*blend*(3-2*blend);
}
