import { DISTRICTS, districtPoint } from './geography.js';
// Each group has a subject: look at the other wrestler, the tea tray, or the
// hand raised in blessing. Positions are offsets on either side of the walk.
import { groundHeight } from './terrain.js';
import { animalRadius, openGround } from './village-paths.js';
import { inariPoint } from './pilgrimage-layout.js';

const tau = Math.PI * 2;
const groups = [];
function scene(habitat, name, x, z, cast) {
  groups.push({ habitat, name, x, z, cast });
}
function districtScene(habitat, name, x, z, cast) {
  scene(habitat, name, ...districtPoint(habitat,x,z), cast);
}
// Species, action, and position in the group. Pairs share their beat.
districtScene('kyo','tea',114.3,-414.3,[
  ['frog','tea',-1.1,0], ['rabbit','bow',1.3,.8], ['monkey','read',-.6,3],
]);
districtScene('kyo','music',126.2,-435.6,[
  ['rabbit','flute',-.8,.1], ['frog','drum',1.5,-.6], ['monkey','listen',2.6,2.6],
]);
districtScene('kyo','gate',117,-381,[
  ['rabbit','lantern',-2,.5], ['frog','fan',.8,2],
]);
districtScene('peach','pass',-350,-101,[
  ['rabbit','porter',-3,0], ['monkey','read',.5,2], ['deer','listen',4,-1],
]);
export const PEACH_BOUT = {x:DISTRICTS.peach.x+6,z:DISTRICTS.peach.z-3};
scene('peach','bout',PEACH_BOUT.x,PEACH_BOUT.z,[
  ['rabbit','sumo',-.94,0], ['frog','sumo',.94,0], ['monkey','listen',-.6,-3.4],
  ['frog','drum',3,-2.8], ['rabbit','cheer',-3.2,-1.9],
]);
districtScene('peach','orchard',-403,-84,[
  ['rabbit','flowers',-2,-.5], ['deer','browse',.7,1.8], ['deer','listen',4.8,1.4],
]);
districtScene('peach','picnic',-422,-103,[
  ['frog','flute',-1.7,0], ['rabbit','fan',1.8,-.2], ['monkey','read',-1.1,3.1],
]);
districtScene('peach','hillside',-375,-117,[
  ['boar','browse',-3,.5], ['boar','browse',1.2,2.9],
]);
districtScene('todaiji','south',194,444,[
  ['deer','bow',-3,-.5], ['rabbit','bow',1,1.4], ['frog','lantern',4.2,-.9],
]);
districtScene('todaiji','steps',211,426,[
  ['deer','bow',-2.6,.8], ['rabbit','bow',1.1,.5], ['monkey','write',-1,4],
]);
districtScene('todaiji','courtyard',222,421,[
  ['rabbit','flowers',-2.4,0], ['frog','flute',1.5,.7], ['deer','listen',4.9,2.5],
]);
districtScene('todaiji','copyists',201,431,[
  ['monkey','write',0,1.3], ['rabbit','scribe',-2.5,-.4], ['frog','lantern',2.4,-1.3],
]);
districtScene('todaiji','grove',237,439,[
  ['deer','browse',-3,-.4], ['deer','browse',1.8,1.5], ['boar','browse',5.5,-2.5],
]);
districtScene('inari','foot',-151,-382,[
  ['fox','greet',-.4,1.1], ['rabbit','lantern',2.5,-.1], ['fox','roam',-.7,-3.1],
]);
// Follow the alternating switchbacks. A fox at the start, another further
// uphill, and pilgrims by a bend keep the long ascent inhabited at every level.
for (let row=0; row<8; row++) {
  for (const [stop, part] of [.21,.68].entries()) {
    const p=inariPoint((row+part)/8), side=(row+stop)%2 ? -1 : 1;
    scene('inari','way-'+row+'-'+stop,p.x,p.z+side*3.9,[
      ['fox',stop ? 'greet' : 'roam',0,0],
      ...(row%3===stop ? [[row%2 ? 'rabbit':'frog',row%2 ? 'lantern':'flute',3.1,side*.6]] : []),
    ]);
  }
}
districtScene('inari','summit',-150,-534,[
  ['fox','greet',-2,1.8], ['fox','listen',2,-1], ['rabbit','bow',3.5,2.4],
]);

const crafts = new Set(['tea','flute','drum','fan','lantern','flowers','scribe']);
let layout;
function arrange() {
  const residents=[];
  for (const [index,group] of groups.entries()) {
    const {habitat,name,x,z,cast}=group;
    for (const [i,[type,action,u,v]] of cast.entries()) {
      const artisan=crafts.has(action);
      const role=artisan || action==='sumo' || action==='porter' ? action :
        type==='rabbit'||type==='frog' ? 'wander' : 'roam';
      const stature = type==='deer' ? 1.12 : .96+.08*((i+index)%3);
      const n = {id:habitat+'-'+name+'-'+(i+1), type, role, habitat, encounter:action, stature,
        side:u<0 ? 1:-1, phase:action==='sumo'?index*.73:(index*.73+i*1.31)%tau,
        build:.98+.045*(i%3), dye:(index+2*i)%6, speed:0, flash:0};
      if(artisan) n.area=habitat;
      const baseX=x+u, baseZ=z+v;
      n.travel=action==='roam' ? 1.65 : action==='browse' ? .64 : action==='sumo' ? .16 : 0;
      const clearance=animalRadius(n)+n.travel;
      // Keep each entire movement inside a clear disc. The authored spot wins
      // when it fits, otherwise find the closest pocket on the same terrace.
      let found=false;
      for(let ring=0;ring<=18 && !found;ring++) {
        const count=Math.max(1,ring*8);
        for(let j=0;j<count;j++) {
          const angle=j*tau/count;
          const px=baseX+ring*.65*Math.cos(angle), pz=baseZ+ring*.65*Math.sin(angle);
          if(!openGround(px,pz,clearance) ||
              residents.some(r=>(r.homeX-px)**2+(r.homeZ-pz)**2<(r.travel+n.travel+1.25)**2)) continue;
          n.homeX=px; n.homeZ=pz; found=true;break;
        }
      }
      if(!found) throw new Error('No clear ground for '+n.id);
      residents.push(n);
    }
    const members=residents.slice(-cast.length);
    for(const [i,n] of members.entries()){
      const partner=members[i===0?1:0];
      n.facing=partner ? Math.atan2(partner.homeX-n.homeX,partner.homeZ-n.homeZ) : (-1)**index*.96;
      n.homeY=groundHeight(n.homeX,n.homeZ);
    }
  }
  return residents;
}

export function makeScrollResidents() {
  layout ??= arrange();
  return layout.map(base=>({...base}));
}

export function updateScrollResident(n,time) {
  const action=n.encounter, beat=time*.82+n.phase;
  n.x=n.homeX; n.z=n.homeZ; n.y=n.homeY; n.speed=0; n.heading=n.facing;
  n.variation=action==='listen' || action==='read' || action==='bow' ? 1:0;
  n.gesture=.54+.44*Math.cos(beat*(action==='write'?1.12:.77));
  if(action==='roam' || action==='browse') {
    const a=beat*(action==='roam'?.61:.36);
    const u=n.travel*Math.sin(a), v=n.travel*.42*Math.cos(a);
    const c=Math.cos(n.facing),s=Math.sin(n.facing);
    n.x+=u*c+v*s; n.z+=v*c-u*s;
    n.heading=n.facing+Math.atan2(Math.cos(a),-.42*Math.sin(a));
    n.speed=n.travel*.45*Math.hypot(Math.cos(a),.42*Math.sin(a));
    n.gesture=1-Math.abs(Math.cos(a))*.8;
  } else if(action==='sumo') {
    const lean=n.travel*Math.sin(beat);
    n.x+=Math.sin(n.facing)*lean; n.z+=Math.cos(n.facing)*lean;
  } else if(action==='bow') {
    // The worshipper returns the deer's bow a moment later.
    n.gesture=(.5+.5*Math.cos(time*1.05+(n.type==='deer'?0:1.25)))**2;
  } else {
    n.heading+=.12*Math.sin(beat*.54);
  }
  if(n.travel) n.y=groundHeight(n.x,n.z);
}
