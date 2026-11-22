// Surveyed clearings. Local +Z points towards the path in the forest and the water on the beach.
import { sitePoint } from './retreat-layout.js';

const clearings=[
  ['charcoal','桃山道の炭焼き小屋',-305,-140,-.319],
  ['charcoal','雪街道の炭焼き小屋',-132,-217,1.856],
  ['charcoal','京へ上る炭焼き小屋',187,-690,-2.312],
  ['charcoal','大仏道の炭焼き小屋',144,421,2.218],
  ['fisher','西浜の漁師小屋',-235,-10,-.795],
  ['fisher','朝凪の漁師小屋',335,252,2.081],
  ['fisher','入江の漁師小屋',92,616,-1.390],
  ['fisher','敦賀外浜の漁師小屋',557,-1308,2.062],
];
export const BATH_YARD=[2.35,4.25];
export const KETTLE={radius:1.08,lip:1.15,board:.84,water:1.035};
export const KETTLE_STEPS=[
  {z:2.65,top:.23},{z:2.15,top:.46},{z:1.65,top:.69},{z:1.23,top:.92},
];
export const WAYSIDE_HUTS=clearings.map(([kind,name,x,z,yaw],i)=>{
  const hut={kind,name,x,z,yaw,variant:i%4};
  const [bx,bz]=sitePoint(hut,...BATH_YARD);
  hut.bath={x:bx,z:bz,yaw};
  return hut;
});
const cells=new Map();
const cell=(x,z)=>Math.floor(x/32)*256+Math.floor(z/32);
for(const s of WAYSIDE_HUTS)for(let x=Math.floor((s.x-14)/32);x<=Math.floor((s.x+14)/32);x++)
  for(let z=Math.floor((s.z-14)/32);z<=Math.floor((s.z+14)/32);z++)cells.set(x*256+z,s);
export const nearbyHut=(x,z)=>cells.get(cell(x,z));
export function clearingWeight(s,x,z){
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const edge=Math.max(Math.abs(dx*c-dz*k)-6.28,Math.abs(dx*k+dz*c-2.23)-5.30);
  const t=Math.max(0,Math.min(1,edge/2.3));
  return 1-t*t*(3-2*t);
}
export function inHutYard(x,z){
  const hut=nearbyHut(x,z);
  return !!hut && clearingWeight(hut,x,z)>.82;
}
export function hutSolids(height,put){
  for(const s of WAYSIDE_HUTS){
    const y=height(s.x,s.z),fisher=s.kind==='fisher',floor=fisher?.52:.08,plate=fisher?2.42:1.99;
    function add(u,v,w,d,top,kind,support=false){
      const [x,z]=sitePoint(s,u,v);
      return put(x,z,w/2,d/2,s.yaw,y+top,kind,support);
    }
    add(0,0,5.1,3.8,floor,'floor',true);
    for(const side of [-1,1]){
      add(side*2.5,0,.11,3.8,plate,'wall');
      add(side*1.625,1.9,1.79,.12,plate,'wall');
    }
    add(0,-1.85,5.1,.15,plate,'wall');
    add(0,0,5.1,3.8,plate,'ceiling');
    const roof=add(0,0,6,4.72,fisher?2.30:1.86,'roof',true);
    roof.roofRise=fisher?1.65:2.31;
    if(!fisher)roof.form='hip';
    if(fisher){
      add(0,2.13,5.10,.56,floor,'floor',true);
      add(0,2.55,1.5,.33,.34,'floor',true);
      add(0,2.87,1.5,.33,.17,'floor',true);
    }else{
      add(-4.35,.30,3.02,2.88,1.65,'oval',true);
    }
    // A real circular rim leaves a hollow over the submerged wooden footboard.
    const {x,z}=s.bath;
    put(x,z,KETTLE.radius,KETTLE.radius,s.yaw,y+KETTLE.lip,'kettleRim',true);
    put(x,z,1.00,1.00,s.yaw,y+KETTLE.board,'oval',true);
    for(const step of KETTLE_STEPS){
      const [sx,sz]=sitePoint(s.bath,0,step.z);
      put(sx,sz,.58,.27,s.yaw,y+step.top,'floor',true);
    }
  }
}
