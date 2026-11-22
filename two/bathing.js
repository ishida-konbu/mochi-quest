import { sluiceOpening } from './pilgrim-bathing-plan.js';
import { bathLocal,bathPools,poolRadius,isDryTreatment } from './bath-places.js';
import { bathRadius,sitePoint } from './retreat-layout.js';

export const SOAK_SECONDS = 3.5;

// A rounded oblong encloses the wide heels and shoulders in plan view.
const footprint=Array.from({length:72},(_,i)=>{
  const a=i*Math.PI/36,u=Math.cos(a),v=Math.sin(a);
  const r=(Math.abs(u)**3.5+Math.abs(v)**3.5)**(-1/3.5);
  return [u*r,v*r];
});

// Only the visible float drifts inward. The traveller keeps the same footing
// for getting out and the same saved position at the edge of a pool.
export function floatBerth(player,target,snowRadius,place=null,level=0) {
  const site=target.retreat || target.site;
  if(place && site){
    const action=place.action,heading=place.heading ?? place.yaw;
    const [x,z]=sitePoint(site,place.berthU??place.u,place.berthV??place.v);
    const wet=!isDryTreatment(place);
    const upright=['seat','jar','steam','deep','rinse','cascade','bamboo'].includes(action);
    const seatY=level+(place.seatY ?? (place.y||0)-(action==='deep'?1.03:action==='jar'?.56:Math.min(place.depth??.56,.65)));
    const facing=heading!=null?site.yaw+heading:undefined;
    if(upright || ['moon','recline','tide'].includes(action)){
      return {x,z,wet,action,id:place.id,heading:facing,seatY,duration:place.duration,
        extension:upright?0:action==='tide'?.58:.80,upright};
    }
  }
  if (target.goemon) return { x:target.x, z:target.z, extension:.37, kettle:true };
  const pool=place && bathPools(site)?.includes(place)?place:null;
  const radius=pool ? (x,z)=>poolRadius(pool,...bathLocal(site,x,z)) : target.retreat ? (x,z)=>bathRadius(target.retreat,x,z) : snowRadius;
  const g=player.buffs.full>0 ? 1.28 : 1;
  const frontX=Math.sin(player.heading), frontZ=Math.cos(player.heading);
  const inward=Math.atan2(target.x-player.x,target.z-player.z);
  for(const extension of [1,.8,.6,.4]){
    const hull=footprint.map(([u,v])=>{
      const along=(.89+1.14*extension)*g*u, across=.99*g*v;
      return [along*frontX+across*frontZ,along*frontZ-across*frontX];
    });
    // The centre of a crescent or the waist of a gourd need not have the
    // most room. Try the closest sheltered water first, in any direction.
    const rings=extension===.4 ? 26 : 11;
    for(let ring=0;ring<=rings;ring++){
      const count=ring?24:1;
      for(let i=0;i<count;i++){
        const a=inward+i*Math.PI*2/count;
        const x=player.x+.31*ring*Math.sin(a), z=player.z+.31*ring*Math.cos(a);
        if(hull.every(([dx,dz])=>radius(x+dx,z+dz)<.94) &&
          radius((x+player.x)*.5,(z+player.z)*.5)<.97)return {x,z,extension,id:place?.id,action:place?.action,duration:place?.duration};
      }
    }
  }
  const [x,z]=pool?sitePoint(site,pool.u,pool.v):[target.x,target.z];
  return {x,z,extension:.4,id:place?.id,action:place?.action,duration:place?.duration};
}

function ease(value,start,end) {
  const q=Math.max(0,Math.min(1,(value-start)/(end-start)));
  return q*q*(3-2*q);
}

export function bathingPose(player,berth,time=0) {
  const left=player.activityTime, age=(berth.duration??SOAK_SECONDS)-left;
  const recline=berth.upright?0:ease(age,.025,1.10)*ease(left,.01,.71);
  const melt=ease(age,.32,1.53)*ease(left,.21,.96);
  const settle=ease(age,0,.78)*ease(left,0,.72);
  const drift=berth.id==='harbor-tide'?.36*sluiceOpening(time):0;
  const across=berth.heading??0;
  return {
    x:player.x+(berth.x-player.x-drift*Math.cos(across))*settle,
    z:player.z+(berth.z-player.z+drift*Math.sin(across))*settle,
    id:berth.id,action:berth.action??'float',wet:berth.wet!==false,heading:berth.heading,seatY:berth.seatY,
    recline, melt:melt*berth.extension, settle, kettle:!!berth.kettle,
  };
}
