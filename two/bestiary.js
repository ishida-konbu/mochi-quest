// The illustrated menagerie ranges through the same ten districts as the procession.
import { REGIONS, groundHeight, waterDepth, solidHeightAt, terrainHeight, WATER_Y, seeded, wrapCoord, wrapDelta } from './terrain.js';

export const SPECIES = Object.freeze({
  monkey: { count:90, points:30, label:'猿', stature:1, frame:2.7, center:.88 },
  bird:   { count:40, points:30, label:'丹頂', stature:1, frame:3.5, center:.13 },
  fox:    { count:40, points:50, label:'狐', stature:1, frame:2.7, center:.72 },
  tiger:  { count:10, points:100, label:'虎', stature:1.22, frame:3.6, center:.84 },
  dragon: { count:1, points:1000, label:'龍', stature:2.1, frame:6.2, center:1.18 },
  kirin:  { count:1, points:1000, label:'麒麟', stature:1.75, frame:4.9, center:1.72 },
});
export const isFlying = type => type==='bird' || type==='dragon';

let homes;
export function wildlifeHomes(fixed) {
  if (homes) return homes;
  const random=seeded(0x81b6e), result=[];
  for (const [type, species] of Object.entries(SPECIES)) {
    for (let i=0;i<species.count;i++) {
      const region=REGIONS[type==='dragon'?8:type==='kirin'?1:i%REGIONS.length];
      let x,z;
      for (let attempt=0; ;attempt++) {
        if (attempt===2000) throw new Error('No habitat for '+type);
        const a=random()*2*Math.PI, r=17+random()*37;
        x=region.x+Math.sin(a)*r; z=region.z+Math.cos(a)*r;
        if (isFlying(type)) break;
        const h=groundHeight(x,z);
        if(waterDepth(x,z)>.04 || solidHeightAt(x,z,2)>h+.18 ||
           Math.abs(groundHeight(x+1,z-1)-h)>.42 || Math.abs(groundHeight(x-1,z+1)-h)>.42 ||
           fixed.some(n=>(n.x-x)**2+(n.z-z)**2<20) ||
           result.some(n=>(n.x-x)**2+(n.z-z)**2<17)) continue;
        break;
      }
      const phase=random()*Math.PI*2;
      result.push({type,role:'roam',habitat:region.id,x,z,phase,stature:species.stature*(species.count===1?1:.91+random()*.18),
        radius:type==='dragon'?15:type==='bird'?6+random()*5:1.2+random()*1.7,
        cruise:type==='dragon'?.16:type==='bird'?.36+random()*.12:.25+random()*.16});
    }
  }
  homes=result;
  return homes;
}

export function moveWildlife(n,time) {
  const angle=time*n.cruise+n.phase, air=isFlying(n.type);
  const tx=n.homeX+n.radius*(Math.sin(angle)-Math.sin(n.phase));
  const tz=n.homeZ+n.radius*.66*(Math.cos(angle)-Math.cos(n.phase));
  if(!air && (waterDepth(tx,tz)>.12 || solidHeightAt(tx,tz,.65)>groundHeight(tx,tz)+.22)) {
    n.speed=0; return;
  }
  n.x=wrapCoord(tx); n.z=wrapCoord(tz);
  n.heading=Math.atan2(Math.cos(angle),-.66*Math.sin(angle));
  n.speed=n.radius*n.cruise*Math.hypot(Math.cos(angle),.66*Math.sin(angle));
  if (air) {
    const terrain=Math.max(WATER_Y,terrainHeight(n.x,n.z));
    const clearance=n.type==='dragon'?12.5+4.1*Math.sin(angle*.72):3.9+1.35*Math.sin(angle*1.35+n.phase);
    n.y=Math.max(terrain+clearance, solidHeightAt(n.x,n.z,.8)+1.3);
    n.altitude=n.y-terrain;
  } else n.y=groundHeight(n.x,n.z);
}

// Hit volumes are in each drawing's local coordinates (X across, Z toward the face).
// Separate ellipsoids follow the crane wings and the dragon's curved body.
const bodyVolumes = {
  monkey:[[0,.9,0,.45,.88,.39]], fox:[[0,.68,.1,.29,.48,.63],[0,1.05,.56,.22,.26,.34]],
  bird:[[0,.11,0,.32,.24,.76],[-.59,.13,-.09,.55,.31,.37],[.59,.13,-.09,.55,.31,.37],[0,.32,.72,.14,.18,.38]],
  tiger:[[0,.81,.04,.39,.49,.9],[0,1.13,.74,.33,.34,.36]],
  kirin:[[0,1.16,-.07,.35,.53,.95],[0,1.8,.60,.28,.65,.39],[0,2.34,.82,.26,.3,.41]],
  dragon:[[-.59,.60,-2.86,.32,.55,.53],[-.25,.35,-2.27,.33,.39,.64],[-.09,.92,-1.66,.41,.38,.59],
          [.43,.79,-.97,.44,.48,.75],[.27,.54,-.14,.51,.42,.7],[-.28,.88,.51,.42,.53,.55],
          [-.43,1.46,.90,.39,.56,.49],[-.14,1.91,1.62,.49,.45,.83]],
  turtle:[[0,.4,.07,.58,.55,.69]],
};
export function recipientContact(n,shot,dx,dz,length) {
  const rx=wrapDelta(shot.x-n.x),rz=wrapDelta(shot.z-n.z);
  const volumes=bodyVolumes[n.type];
  if (!volumes) {
    if(shot.y<n.y-.1 || shot.y>n.y+2.15) return Infinity;
    const along=Math.max(0,Math.min(length,-rx*dx-rz*dz));
    return (rx+along*dx)**2+(rz+along*dz)**2<.64 ? along : Infinity;
  }
  const scale=n.stature||1, extent=(SPECIES[n.type]?.frame || 2)*scale;
  if(Math.abs(rx)>extent+length || Math.abs(rz)>extent+length || Math.abs(shot.y-n.y)>extent) return Infinity;
  const c=Math.cos(n.heading),s=Math.sin(n.heading);
  const x=(rx*c-rz*s)/scale,z=(rx*s+rz*c)/scale,y=(shot.y-n.y)/scale;
  const vx=(dx*c-dz*s)/scale,vz=(dx*s+dz*c)/scale;
  let first=Infinity;
  for(const [cx,cy,cz,w,h,d] of volumes) {
    // The sheet itself has width and a little flutter at its leading edge.
    const a=w+.105,b=h+.14,e=d+.105, up=(y-cy)/b;
    if(Math.abs(up)>1) continue;
    const xx=(x-cx)/a,zz=(z-cz)/e,ux=vx/a,uz=vz/e;
    const C=xx*xx+zz*zz+up*up-1;
    if(C<=0) return 0;
    const A=ux*ux+uz*uz,B=xx*ux+zz*uz,D=B*B-A*C;
    if(D<0 || B>=0) continue;
    const enter=(-B-Math.sqrt(D))/A;
    if(enter>=0 && enter<=length && enter<first) first=enter;
  }
  return first;
}
