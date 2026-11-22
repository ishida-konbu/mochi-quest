// Surveyed clearings. Local +Z points towards the path in the forest and the water on the beach.
import { sitePoint } from './retreat-layout.js';

const clearings=[
  ['peach-hearth','charcoal','桃山道の炭焼き小屋',-305,-140,-.319],
  ['snow-hearth','charcoal','湖畔の炭焼き小屋',-132,-217,1.856,65],
  ['capital-hearth','charcoal','京へ上る炭焼き小屋',187,-690,-2.312,66],
  ['temple-hearth','charcoal','大仏道の炭焼き小屋',216,548,2.218,67],
  ['west-beach','fisher','西浜の漁師小屋',-235,-10,-.795,68],
  ['morning-beach','fisher','朝凪の漁師小屋',335,252,2.081,69],
  ['south-cove','fisher','入江の漁師小屋',92,616,-1.390,70],
  ['tsuruga-beach','fisher','敦賀外浜の漁師小屋',557,-1308,2.062,71],
  ['willow-weir','fisher','柳瀬の漁師小屋',-76,31,-3.025,null,'river'],
  ['north-pass-hearth','charcoal','北山越の炭焼き小屋',454,-1059,-1.83],
  ['sweetfish-weir','fisher','鮎瀬の漁師小屋',206,-9,.1584,null,'river'],
];
export const BATH_YARD=[2.35,4.25];
export const KETTLE={widthScale:1.22,radius:1.08,lip:1.15,board:.84,water:1.035};
export const BACK_BOILER={u:-1.07,v:-1.09,r:.43};
export function kettleLidAngle(kind,bank){return bank==='river'?1.16:kind==='fisher'?.81:1.03;}
export const GOEMON_SCREEN=[[1.74,-1.09],[2.15,.17],[2.19,1.58]];
export const KETTLE_STEPS=[
  {z:2.65,top:.23},{z:2.15,top:.46},{z:1.65,top:.69},{z:1.23,top:.92},
];
export const WAYSIDE_HUTS=clearings.map(([id,kind,name,x,z,yaw,inventorySlot,bank],i)=>{
  const hut={id,kind,name,x,z,yaw,inventorySlot,bank,variant:i%4};
  const [bx,bz]=sitePoint(hut,...BATH_YARD);
  hut.bath={x:bx,z:bz,yaw};
  return hut;
});
// Surveyed from the painted road centrelines, with the bench facing passing travellers.
export const CHAYA_SITES=[
  ['川風の団子茶屋',65.65,94.54,2.8259,'桜団子','桜葉茶','#efb4a9'],
  ['峠口の団子茶屋',47.85,-366.70,-1.8649,'きなこ団子','ほうじ茶','#d6ab70'],
  ['薄野の団子茶屋',105.94,336.96,-.5265,'月見団子','番茶','#f7e4b5'],
  ['桃山の団子茶屋',-368.68,-121.03,.3754,'よもぎ団子','山茶','#a0b685'],
  ['稲荷道の団子茶屋',365,-696.22,2.4075,'みたらし団子','煎茶','#c5894b'],
  ['潮見の団子茶屋',385.89,-1380.06,-.9562,'藻塩の焼き団子','玄米茶','#ead5ae'],
  ['堺道の団子茶屋',47.15,-754.94,.6634,'黒ごま団子','煎茶','#91877d'],
  ['桃の間道の団子茶屋',-601.79,-183.72,-1.1071,'花桃団子','番茶','#edb5b1'],
  ['参詣坂の団子茶屋',363.04,795.64,1.8844,'よもぎ団子','ほうじ茶','#a0b685'],
].map(([name,x,z,yaw,dango,tea,dye],i)=>({kind:'chaya',name,x,z,yaw,dango,tea,dye,variant:i%4}));
export const CHAYA_SEAT={x:1.64,z:2.63,width:2.18,depth:.68,top:.48};
// Feet cut a softer bend from the verge into the covered seat.
const teaPathX=v=>CHAYA_SEAT.x-.60*Math.sin(Math.PI*(v-2.9)/7.9);
export const TEA_FOOTPATHS=CHAYA_SITES.map(s=>({
  width:1.48, footpath:true, fadeEnd:.9,
  points:Array.from({length:13},(_,i)=>{
    const v=10.8-i*7.9/12;
    return sitePoint(s,teaPathX(v),v);
  }),
}));
export function onTeaFootpath(s,x,z){
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const v=dx*k+dz*c;
  return v>=2.9 && v<=10.8 && Math.abs(dx*c-dz*k-teaPathX(v))<.65;
}
export const WAYSIDE_SITES=[...WAYSIDE_HUTS,...CHAYA_SITES];
const cells=new Map();
const cell=(x,z)=>Math.floor(x/32)*256+Math.floor(z/32);
for(const s of WAYSIDE_SITES)for(let x=Math.floor((s.x-14)/32);x<=Math.floor((s.x+14)/32);x++)
  for(let z=Math.floor((s.z-14)/32);z<=Math.floor((s.z+14)/32);z++)cells.set(x*256+z,s);
export const nearbyHut=(x,z)=>cells.get(cell(x,z));
export function clearingWeight(s,x,z){
  const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const u=dx*c-dz*k,v=dx*k+dz*c;
  const edge=s.kind==='chaya' ? Math.max(Math.abs(u)-4.15,Math.abs(v-.5)-4.10)
    : Math.max(Math.abs(u)-6.28,Math.abs(v-3.33)-6.40);
  const t=Math.max(0,Math.min(1,edge/2.3));
  return 1-t*t*(3-2*t);
}
export function inHutYard(x,z){
  const hut=nearbyHut(x,z);
  return !!hut && clearingWeight(hut,x,z)>.82;
}
export function hutSolids(height,put){
  for(const s of WAYSIDE_SITES){
    const y=height(s.x,s.z),fisher=s.kind==='fisher',floor=fisher?.52:.08,plate=fisher?2.42:1.99;
    function add(u,v,w,d,top,kind,support=false){
      const [x,z]=sitePoint(s,u,v);
      return put(x,z,w/2,d/2,s.yaw,y+top,kind,support);
    }
    if(s.kind==='chaya'){
      add(0,0,4.9,3.7,.09,'floor',true);
      for(const side of [-1,1])add(side*2.45,0,.12,3.7,2.51,'wall');
      add(0,-1.85,4.9,.14,2.51,'wall');
      add(-2.285,1.85,.33,.12,.96,'wall');
      add(1.945,1.85,1.01,.12,.96,'wall');
      const roof=add(0,0,6.18,4.92,2.31,'roof',true);
      roof.form='hip';roof.roofRise=2.46;roof.thickness=.06;
      add(CHAYA_SEAT.x,CHAYA_SEAT.z,CHAYA_SEAT.width,CHAYA_SEAT.depth,CHAYA_SEAT.top,'floor',true);
      add(-1.515,1.925,1.77,1.43,1.26,'wall');
      add(2.92,2.70,.11,.11,3.96,'wall');
      continue;
    }
    add(0,0,5.1,3.8,floor,'floor',true);
    for(const side of [-1,1]){
      add(side*2.5,0,.11,3.8,plate,'wall');
      add(side*1.625,1.9,1.79,.12,plate,'wall');
    }
    add(0,-1.85,5.1,.15,plate,'wall');
    const roof=add(0,0,6,4.72,fisher?2.30:1.86,'roof',true);
    roof.roofRise=fisher?1.65:2.31;roof.thickness=.045;
    if(!fisher)roof.form='hip';
    if(fisher){
      add(0,2.13,5.10,.56,floor,'floor',true);
      add(0,2.55,1.5,.33,.34,'floor',true);
      add(0,2.87,1.5,.33,.17,'floor',true);
    }else{
      add(-4.35,.30,3.02,2.88,1.65,'oval',true);
    }
    if(!s.bath)continue;
    // A real circular rim leaves a hollow over the submerged wooden footboard.
    const {x,z}=s.bath;
    const scale=KETTLE.widthScale,radius=KETTLE.radius*scale;
    put(x,z,radius,radius,s.yaw,y+KETTLE.lip,'kettleRim',true);
    put(x,z,scale,scale,s.yaw,y+KETTLE.board,'oval',true);
    const [boilerX,boilerZ]=sitePoint(s.bath,BACK_BOILER.u*scale,BACK_BOILER.v*scale);
    put(boilerX,boilerZ,BACK_BOILER.r*scale,BACK_BOILER.r*scale,s.yaw,y+.65,'oval',false);
    // The stored cypress lid leans away from the bathing well. Four thin
    // slabs follow the curved arc, leaving air beneath the raised edge.
    const angle=kettleLidAngle(s.kind,s.bank),rows=4,r=.94;
    for(let i=0;i<rows;i++){
      const t=r*(i+.5)/rows;
      const [px,pz]=sitePoint(s.bath,0,(-1.055-t*Math.cos(angle))*scale);
      put(px,pz,Math.sqrt(r*r-t*t)*scale,(r/rows*.5*Math.cos(angle)+.036)*scale,s.yaw,
        y+.93+t*Math.sin(angle),'ceiling',false);
    }
    for(let bay=1;bay<GOEMON_SCREEN.length;bay++){
      const [ax,az]=GOEMON_SCREEN[bay-1],[bx,bz]=GOEMON_SCREEN[bay];
      const [px,pz]=sitePoint(s.bath,(ax+bx)*scale/2,(az+bz)*scale/2);
      put(px,pz,.055*scale,Math.hypot(bx-ax,bz-az)*scale/2+.04,
        s.yaw+Math.atan2(bx-ax,bz-az),y+1.62,'wall',false);
    }
    for(const step of KETTLE_STEPS){
      const [sx,sz]=sitePoint(s.bath,0,step.z*scale);
      put(sx,sz,.58*scale,.27*scale,s.yaw,y+step.top,'floor',true);
    }
  }
}
