import { houseRoof, roofWallContacts, roofSkinDepth } from './architecture.js';
// Local +v points to sea. The shore terrace, landings and timber decks share
// surveyed elevations so a visitor can walk from the market to either vessel.
const pi=Math.PI;
export function portPoint(p,u,v){
  const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  return [p.x+u*c+v*s,p.z-u*s+v*c];
}
export function localPoint(p,x,z){
  const dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  return [dx*c-dz*s,dx*s+dz*c];
}
export const OLD_TSURUGA={x:263,z:-1030,yaw:pi};
export const SEAPORTS=[
  {id:'tsuruga',name:'敦賀の津',x:330,z:-1450,yaw:pi},
  {id:'sakai',name:'堺の津',x:-193,z:-603,yaw:-pi/2},
].map(p=>({...p,port:portPoint(p,7,5.5)}));
export function relocateOldQuay(x,z){
  const [u,v]=localPoint(OLD_TSURUGA,x,z);
  return u>=-45 && u<=67 && v>=-30 && v<=26 ? portPoint(SEAPORTS[0],u,v) : [x,z];
}
export const QUAY_Y=2.38,DECK_Y=3.58,HOLD_Y=.72;
export const QUAY_MERCHANTS=SEAPORTS.flatMap(port=>[[-8.4,4.8],[16.6,-6.5],[-25.3,23.5]].map(([u,v],i)=>{
  const [x,z]=portPoint(port,u,v);
  return {x,z,i,y:v>20?DECK_Y:QUAY_Y,yaw:port.yaw+i*1.57,size:i===1?.79:.91,name:port.name+'・荷改めの商人'};
}));
export const FIXED_BERTH=54,QUAY_CENTER=12.1,QUAY_LENGTH=107.2;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function visit(x,z,f,base){
  for(const p of SEAPORTS){
    if(Math.abs(x-p.x)>106||Math.abs(z-p.z)>106)continue;
    const [u,v]=localPoint(p,x,z);
    const edge=Math.max(-u-43,u-76,-v-28,v-51);
    if(edge<26)return base+(f(u,v)-base)*(1-smooth(edge/26));
  }
  return base;
}
export function portShore(x,z,base){return visit(x,z,(_,v)=>13-v,base);}
export function portTerrain(x,z,base){
  return visit(x,z,(_,v)=>QUAY_Y-.13-(QUAY_Y+6.5)*smooth((v-6)/16),base);
}
export function portReserved(x,z){
  if(!SEAPORTS.some(p=>Math.abs(p.x-x)<84&&Math.abs(p.z-z)<84))return false;
  return SEAPORTS.some(p=>{const [u,v]=localPoint(p,x,z);return u>-53&&u<79&&v>-32&&v<43;});
}
export const PORT_BUILDINGS=[];
for (const p of SEAPORTS) {
  const types=p.id==='tsuruga'?['蔵','昆布','問丸','塩','麻布','客館','干魚','綱場']:['蔵','陶器','問丸','染布','鍛冶','客館','干魚','綱場'];
  const lots=[[-31,-1,12.3,7.8],[-15,-1,9.5,6.2],[9.5,-1,12.5,7.0],[28,-2,10,6.0],[-31,-17,11,7.8],[-12,-17,15.4,8.1],[8,-17,10.6,6.5],[26,-17,12.4,7.7]];
  lots.forEach(([u,v,w,d],i)=>{
    const [x,z]=portPoint(p,u,v);
    const high=i===0||i===5?5.1:3.2;
    const roof=houseRoof(w,d,QUAY_Y+high+.10,2.07,'gable');
    PORT_BUILDINGS.push({p,u,v,w,d,high,roof,kind:types[i],i,x,z});
  });
}
export function portSolids(put){
  for(const p of SEAPORTS){
    function box(u,v,w,d,top,kind='floor',support=true,bottom=-Infinity,yaw=0){
      const [x,z]=portPoint(p,u,v);return put(x,z,w/2,d/2,p.yaw+yaw,top,kind,support,0,bottom);
    }
    box(QUAY_CENTER,23.7,QUAY_LENGTH,4.22,DECK_Y,'slab',true,DECK_Y-.26);
    for (const v of [21.90,25.43]) {
      box(QUAY_CENTER,v,QUAY_LENGTH,.36,DECK_Y-.235,'slab',true,DECK_Y-.625);
      for (let j=0;j<=21;j++) box(-40+j*5,v,.40,.40,3.575,'oval',false,-1.495);
    }
    if(p.id==='tsuruga'){
      for(const a of [-1,1])for(const b of [-1,1])box(-40+a*1.85,-10+b*1.70,.34,.34,QUAY_Y+8.30,'wall',false);
      box(-40,-10,4.25,4.17,QUAY_Y+5.24,'slab',true,QUAY_Y+5.02);
      box(-40,-10,5.17,4.95,QUAY_Y+8.20,'roof',true).roofRise=1.78;
    }else box(38,-10,4.95,5.75,QUAY_Y+1.96,'oval',true);

    for(const u of [-37,0,37]){
      for(let i=0;i<32;i++)box(u,6.4+i*.49,2.85,.52,QUAY_Y+(DECK_Y-QUAY_Y)*i/31,'slab',true,QUAY_Y+(DECK_Y-QUAY_Y)*i/31-.22);
    }
    for(const b of PORT_BUILDINGS.filter(q=>q.p===p)){
      const {u,v,w,d,high,roof}=b,base=QUAY_Y;
      box(u,v,w,d,base+.11);
      for(const side of [-1,1])box(u+w*.5*side,v,.16,d+.16,base+high,'wall',false);
      box(u,v-d*.5,w,.16,base+high,'wall',false);
      for(const side of [-1,1])box(u+side*w*.375,v+d*.5,w*.25,.15,base+high,'wall',false);
      box(u,v+d*.5,w+.11,.27,base+high+.04,'slab',true,base+high-.24);
      box(u,v,w+.14,d+.14,roof.eave,'slab',true,base+high-.06);
      const sheet=box(u,v,roof.width,roof.depth,roof.eave,'roof',true);
      sheet.roofRise=roof.rise;sheet.thickness=roofSkinDepth(roof.form)*roof.rise;
      roofWallContacts(roof,(dx,dz,width,depth)=>{
        const wall=box(u+dx,v+dz,width,depth,roof.eave,'roofWall',false,base+high-.06);
        wall.sheet=sheet;
      });
      const front=v+d/2;
      if(high>4){
        box(u,front,w*.53,.16,base+high,'wall',false,base+2.88-.075);
        box(u,front+.22,w+.5,2.25,base+2.63,'roof',true).roofRise=.54;
      }
      // Keep the centre aisle clear beside the shop tables, just as on the quay.
      if(b.i===5) box(u,v,2.15,.90,base+.57,'slab',true,base+.45);
      else if(b.i===2) box(u+w*.29,front-1.53,2.19,.91,base+.885,'slab',true,base+.755);
      else if(![0,7].includes(b.i)) box(u,front-.43,3.05,.83,base+1.03,'slab',true,base+.89);
    }
  }
}
