import { ENTRY_TREADS,SUZURI_WELL } from './suzuri-basin-plan.js';
// The gate looks north across the avenue. In this survey +u points west
// towards the former dyer, +v towards the street and its existing brazier.
export const SUZURI_COURT={left:-5.98,right:20.55,back:-5.20,front:4.78,gateHalf:1.78};
export const RINSING_HALL={u:14.28,v:-1.46,w:10.45,d:5.34,eave:3.30,rise:1.62};
export const RINSING_SEATS=[10.37,12.33,14.29,16.25];
export const RINSING_FLOOR={left:9.00,end:17.46,right:19.59,back:-4.11,front:-.32,lip:1.47,drain:-2.62,slot:.095};
export const RINSING_TUB={du:-.12,v:-3.28,base:.568,r:.433,height:.454,water:.951,spoutU:.095,spoutV:-3.44};
// Walkers and the individual flags use the same four drainage planes. The
// fall to the sumps is slight enough to stand a portable hinoki stool level.
export function rinseFloorHeight(u,v){
  const f=RINSING_FLOOR;
  if(u>f.end+.12)return .225;
  if(v>f.front)return .196;
  const channel=.153-.033*Math.min(1,Math.max(0,(u-f.left)/(f.end-f.left)));
  return channel+Math.min(.083,.039*Math.max(0,Math.abs(v-f.drain)-f.slot));
}
// The old dyer's plank aisle leads directly up to the four stools. The
// diagrams and the controller share these seat tops, measured from the water.
export const SUZURI_LEDGE={u:-3.87,v:.22,w:1.54,d:2.96,top:-.19,tread:-.34};
const stations=RINSING_SEATS.map((u,i)=>({
  id:'suzuri-rinse-'+(i+1),action:'rinse',name:'掛け湯の洗い場',label:'檜の腰掛けで掛け湯をする',
  message:'檜の手桶から一杯、肩へそっと掛け湯をする。',
  u,v:-1.42,rx:.88,rz:.91,shape:'rect',berthU:u,berthV:-1.92,seatY:.49,heading:Math.PI,duration:3.2
}));
stations.push({id:'suzuri-seat',action:'seat',name:'硯の腰掛石',label:'腰掛石で半身浴をする',
  message:'硯の浅い腰掛石に座り、足を深みへ伸ばす。',
  u:SUZURI_LEDGE.u,v:SUZURI_LEDGE.v,rx:.82,rz:1.31,shape:'rect',berthU:SUZURI_LEDGE.u,berthV:SUZURI_LEDGE.v,
  seatY:SUZURI_LEDGE.top,heading:Math.PI/2,duration:3.5});
stations.push({id:'suzuri-umi',action:'deep',name:'硯海の深湯',label:'硯海の深みに浸かる',
  message:'彫り下げた硯海に肩を沈めると、磨き陸の溝を伝う湯が足元に届いた。',
  u:SUZURI_WELL.u,v:SUZURI_WELL.v,rx:1.20,rz:1.05,berthU:SUZURI_WELL.u,berthV:SUZURI_WELL.v,
  seatY:-1.04,heading:-Math.PI*.32,duration:3.5});
export function suzuriStations(site){
  return site.shape==='suzuri'?stations:[];
}
const {left,right,front,back,gateHalf}=SUZURI_COURT;
// A straight covered frontage leaves an accessible walk between the gate,
// the rubbing stone and the wash wing. The watch brazier sits on the kerb.
export const SUZURI_WALLS=[
  [left,front,-gateHalf,front,2.24],[gateHalf,front,right,front,2.24],
  [right,front,right,back,2.43],[right,back,4.36,back,2.53],
  [4.36,back,-4.25,back,3.02],[-4.25,back,left,back,2.53],
  [left,back,left,front,2.33],
];
export function suzuriParcel(u,v,pad=0){
  return Math.max(left-u,u-right,back-v,v-front)<pad;
}
export function suzuriTerrace(u,v){
  const edge=Math.max(left-u,u-right,back-v,v-front);
  const t=Math.min(1,Math.max(0,(edge+.14)/1.07));
  return 1-t*t*(3-2*t);
}
export function suzuriSolids(add){
  for(const [u,v,x,z,h] of SUZURI_WALLS){
    const across=u===x;
    add((u+x)/2,(v+z)/2,Math.hypot(x-u,z-v)+.10,.39,h+.28,'wall',false,across?Math.PI/2:0);
  }
  for(const side of [-1,1]){
    for(const v of [front-.57,front+.40])add(side*gateHalf,v,.28,.28,2.91,'wall');
    add(side*2.25,front+.39,.37,.47,1.68,'wall');
  }
  add(0,front,4.85,2.53,2.79,'ceiling');
  add(0,front,2.53,4.85,2.84,'roof',true,Math.PI/2).roofRise=1.38;
  // The bark eave of the rear picture gallery projects above the water.
  // Its high underside leaves the half-bath seat and bath apron open.
  for(let j=0;j<3;j++)add(-.03,SUZURI_COURT.back+.10-.18+(j+.5)*1.014/3,
    7.96,1.014/3,3.31-.125*j,'ceiling');
  // Survey in the site's frame so the carved boundary and the contact
  // tests below the grinding land see the same shoreline.
  add(0,0,11.4,7,0,'suzuriBasin',true);
  for(const q of ENTRY_TREADS)add(0,q.v,q.w,q.d,q.h,'floor',true);
  const ledge=SUZURI_LEDGE;
  add(ledge.u-.125,ledge.v,ledge.w+.25,ledge.d,ledge.top,'floor',true);
  add(ledge.u+ledge.w/2+.19,ledge.v,.40,ledge.d-.18,ledge.tread,'floor',true);
  const r=RINSING_HALL;
  const floor=RINSING_FLOOR;
  // Individual supports approximate the small continuous wash fall to within
  // a few millimetres. The grates support a foot across both drain arms.
  for(let i=0;i<9;i++)for(let j=0;j<15;j++){
    const w=(floor.end+.12-floor.left)/9,d=(floor.front-floor.back)/15;
    const u=floor.left+(i+.5)*w,v=floor.back+(j+.5)*d;
    add(u,v,w+.002,d+.002,rinseFloorHeight(u,v),'floor',true);
  }
  add((floor.right+floor.left)/2,(floor.front+floor.lip)/2,floor.right-floor.left,floor.lip-floor.front,.196,'floor',true);
  add((floor.right+floor.end+.12)/2,(floor.front+floor.back)/2,floor.right-floor.end-.12,floor.front-floor.back,.225,'floor',true);
  add(r.u,r.v+r.d/2+.36,r.w+.12,.51,.093,'floor',true);
  add(r.u,r.v-r.d/2,r.w,.17,r.eave,'wall');
  add(r.u+r.w/2,r.v,.17,r.d,r.eave,'wall');
  add(r.u-r.w/2,r.v-r.d/2+.51,.17,1.02,r.eave,'wall');
  for(const x of [r.u-r.w/2,r.u,r.u+r.w/2])add(x,r.v+r.d/2,.21,.22,r.eave,'wall');
  add(r.u,r.v,r.w+1.12,r.d+1.10,r.eave,'ceiling');
  const roof=add(r.u,r.v,r.w+1.12,r.d+1.1,r.eave,'roof',true);
  roof.form='hip';roof.roofRise=r.rise;
  for(const u of RINSING_SEATS){
    add(u,-3.39,1.68,1.00,.568,'box',true);
    add(u+RINSING_TUB.du,RINSING_TUB.v,.85,.77,1.022,'oval',true);
    add(u,-1.92,.59,.43,.49,'box',true);
  }
  for(let j=0;j<5;j++)add(RINSING_SEATS[0]+(j-.5)*1.96,-3.40,.105,1.14,1.14,'wall');
  add(18.36,-3.43,1.35,1.06,1.91,'box',true);
  add(19.17,-1.66,.57,1.88,1.67,'box',true);
  add(18.04,-1.05,1.05,.48,.59,'box',true);
  // The flush drain and the front aisle are continuous all the way to the bath.
  add(7.45,-3.69,1.28,1.10,.79,'oval',true);
  add(8.35,-4.16,.52,.52,1.67,'wall');
}
