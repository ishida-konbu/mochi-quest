import { bathRadius } from './retreat-layout.js';

export const SOAK_SECONDS = 3.5;

// A rounded oblong encloses the wide heels and shoulders in plan view.
const footprint=Array.from({length:72},(_,i)=>{
  const a=i*Math.PI/36,u=Math.cos(a),v=Math.sin(a);
  const r=(Math.abs(u)**3.5+Math.abs(v)**3.5)**(-1/3.5);
  return [u*r,v*r];
});

// Only the visible float drifts inward. The traveller keeps the same footing
// for getting out and the same saved position at the edge of a pool.
export function floatBerth(player, target, snowRadius) {
  if (target.goemon) return { x:target.x, z:target.z, extension:.37, kettle:true };
  const radius=target.retreat ? (x,z)=>bathRadius(target.retreat,x,z) : snowRadius;
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
          radius((x+player.x)*.5,(z+player.z)*.5)<.97)return {x,z,extension};
      }
    }
  }
  return {x:target.x,z:target.z,extension:.4};
}

function ease(value,start,end) {
  const q=Math.max(0,Math.min(1,(value-start)/(end-start)));
  return q*q*(3-2*q);
}

export function bathingPose(player,berth) {
  const left=player.activityTime, age=SOAK_SECONDS-left;
  const recline=ease(age,.025,1.10)*ease(left,.01,.71);
  const melt=ease(age,.32,1.53)*ease(left,.21,.96);
  const settle=ease(age,0,.78)*ease(left,0,.72);
  return {
    x:player.x+(berth.x-player.x)*settle,
    z:player.z+(berth.z-player.z)*settle,
    recline, melt:melt*berth.extension, settle, kettle:!!berth.kettle,
  };
}
