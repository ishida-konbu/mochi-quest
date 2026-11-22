import { villagePools,villageStations,villagePoolLip } from './village-bath-courses.js';
import { pilgrimPools,pilgrimStations,pilgrimPoolLip,pilgrimCustomInlet } from './pilgrim-bathing-plan.js';
import { isVillageWorkshop } from './village-workshop-plan.js';
import { suzuriStations } from './kyo-bath-layout.js';
import { SAZAE_POOLS } from './ryugu-shell-bath.js';

export function bathPools(site){return site.kind==='sazae'?SAZAE_POOLS:villagePools(site) ?? pilgrimPools(site);}
export function bathStations(site){return villageStations(site) ?? pilgrimStations(site) ?? suzuriStations(site);}
export function hasOwnInlet(site){
  return isVillageWorkshop(site) || pilgrimCustomInlet(site);
}
export function poolLip(pool,a){
  return ['jar','terrace','mineral','shelf','brineVat'].includes(pool.shape)?villagePoolLip(pool,a):pilgrimPoolLip(pool,a);
}
export function bathLocal(site,x,z){
  const dx=x-site.x,dz=z-site.z,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return [dx*c-dz*s,dx*s+dz*c];
}
export function poolRadius(pool,u,v){
  const x=(u-pool.u)/pool.rx,z=(v-pool.v)/pool.rz;
  return Math.hypot(x,z)/poolLip(pool,Math.atan2(z,x));
}
export function stationRadius(q,u,v){
  const x=(u-q.u)/q.rx,z=(v-q.v)/q.rz;
  return q.shape==='rect'?Math.max(Math.abs(x),Math.abs(z)):Math.hypot(x,z);
}
export function poolAt(pools,u,v,limit=1){
  return pools?.find(q=>poolRadius(q,u,v)<=limit);
}
// A feature within a larger bath (stone pillow, cascade) takes precedence.
// Between adjacent steam benches the nearer one wins, including at the door.
export function stationAt(site,u,v,limit=1){
  let best;
  for(const q of bathStations(site)){
    const r=stationRadius(q,u,v);
    if(r<=limit){best=q;limit=r;}
  }
  return best;
}
export const isDryTreatment=q=>q?.action==='steam'||q?.action==='rinse';
