// The gate looks north across the avenue. In this survey +u points west
// towards the former dyer, +v towards the street and its existing brazier.
export const SUZURI_COURT={left:-5.98,right:20.55,back:-5.20,front:4.78,gateHalf:1.78};
export const RINSING_HALL={u:14.28,v:-1.46,w:10.45,d:5.34,eave:3.30,rise:1.62};
export const RINSING_SEATS=[10.37,12.33,14.29,16.25];
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
  const ledge=SUZURI_LEDGE;
  add(ledge.u,ledge.v,ledge.w,ledge.d,ledge.top,'floor',true);
  add(ledge.u+ledge.w/2+.19,ledge.v,.40,ledge.d-.18,ledge.tread,'floor',true);
  const r=RINSING_HALL;
  add(r.u,r.v,r.w+.16,r.d+.48,.19,'floor',true);
  add(r.u,r.v+r.d/2+.36,r.w+.12,.51,.093,'floor',true);
  add(r.u,r.v-r.d/2,r.w,.17,r.eave,'wall');
  add(r.u+r.w/2,r.v,.17,r.d,r.eave,'wall');
  add(r.u-r.w/2,r.v-r.d/2+.51,.17,1.02,r.eave,'wall');
  for(const x of [r.u-r.w/2,r.u,r.u+r.w/2])add(x,r.v+r.d/2,.21,.22,r.eave,'wall');
  add(r.u,r.v,r.w+1.12,r.d+1.10,r.eave,'ceiling');
  const roof=add(r.u,r.v,r.w+1.12,r.d+1.1,r.eave,'roof',true);
  roof.form='hip';roof.roofRise=r.rise;
  for(const u of RINSING_SEATS){
    add(u,-3.35,1.25,.68,1.08,'box',true);
    add(u,-1.92,.59,.43,.49,'box',true);
  }
  add(18.32,-3.1,1.28,1.24,1.30,'oval',true);
  // The flush drain and the front aisle are continuous all the way to the bath.
  add(7.45,-3.69,1.28,1.10,.76,'oval',true);
}
