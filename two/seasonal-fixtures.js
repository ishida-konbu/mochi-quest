// Shared placements and local parts of the solid seasonal scenery. The painter
// and the contact index visit these same assemblies, including their rotation.
import { SNOW_TOWN } from './snow-country.js';
import { KADOMATSU, POUNDING } from './festival.js';
import { mountRockContact } from './rock-contact.js';
const {sin,cos}=Math, tau=2*Math.PI;
const chalk = ['#e6eff3', '#eef2ef', '#d9e4ea'];

export function visitSnowFixtures(frame,p,light,daruma,rng,nearRoad,springRadius) {
  const town=SNOW_TOWN;
  // A family made by the townspeople lines the approach to the snow pagoda.
  const family = [
    [6.2, -8.8, 1.02, -.48, false, false], [7.6, -9, .65, -.7, true, true],
    [-4.3, 13, .83, .49, false, true], [17, 0, .66, .91, true, false],
    [-8, -19, .93, .54, false, false],
  ];
  for (const [x, z, scale, yaw, child, indigo] of family) daruma(frame(town.x+x,town.z+z,yaw),scale,child,indigo);
  for (let i = 0; i < 28; i++) {
    const x = town.x + (rng() - 0.5) * 90,
      z = town.z + 3 + (rng() - 0.5) * 70;
    if (nearRoad(x, z, 1.0) || springRadius(x,z)<1.2) continue;
    const s = 0.9 + rng() * 1.6;
    frame(x,z).part(
      'snowLump', 0, -.04, 0,
      s,
      0.15 + rng() * 0.19,
      s * (0.51 + rng() * 0.4),
      chalk[i % 3],
      p.fine, rng() * tau, 0, 0, false,
    );
  }
  // Small snow lanterns have cut-in niches, rounded roofs and an amber candle set back inside.
  // Leave a break in the procession where the bath lane and caravan road cross.
  const lanternRows = [12, 8.4, 4.8, -7.6, -11, -14.4, -17.8];
  for (const [i, z] of lanternRows.entries())
    for (const side of [-1, 1]) {
      const x = side * (4.2 + 0.27 * cos(i));
      if (family.some(([dx,dz,scale]) => Math.hypot(x-dx,z-dz) < .98*scale+.61)) continue;
      const f = frame(town.x+x, town.z+z, side * -0.41);
      f.part('snowLump', 0, 0.38, 0, 0.5, 0.51, 0.47, '#d8e1e8');
      f.part('snowLump', 0, 0.49, 0.345, 0.228, 0.303, 0.092, '#7a858b');
      f.part('snowLump', 0, 0.458, 0.406, 0.168, 0.242, 0.05, '#e9ab61', light);
      f.part('ball', 0, 0.408, 0.461, 0.03, 0.09, 0.02, '#fff2ba', light);
      f.part('snowLump', 0, 0.777, -0.018, 0.504, 0.191, 0.454, chalk[1]);
    }
}
export function visitMoonFixtures(frame,p,light,silverSilk) {
  const vase = frame(-50.46, 285.68);
  vase.part('vase', 0, 0, 0, 0.3, 0.58, 0.3, '#817469', p.stone);
  vase.part('plumes', 0, 0.43, 0, 1, 1.44, 1, '#f9dfaa', silverSilk, 0, 0, 0, false);
  for (const [x, z] of [
    [-58, 285],
    [-50, 282],
    [-61, 294],
    [-48.5, 290],
  ]) {
    const lamp = frame(x, z);
    lamp.part('box', 0, 0.12, 0, 0.55, 0.24, 0.55, '#45494b', p.wood);
    lamp.part('box', 0, 0.46, 0, 0.365, 0.56, 0.365, '#f6bc6a', light);
    for (const dx of [-0.19, 0.19])
      for (const dz of [-0.19, 0.19]) lamp.part('box', dx, 0.46, dz, 0.035, 0.64, 0.035, '#615543', p.wood);
    lamp.part('kasa', 0, 0.76, 0, 0.37, 0.3, 0.37, '#575b64', p.stone);
  }
}
// Boulder groups occupy the maple bank and ravine, beyond the bicycle rack.
export const MAPLE_ROCK_GROUPS=[[280,-101,1.35],[292,-132,.94]];
// The stones keep their surveyed orientation even if a maple sheds more leaves.
const MAPLE_BOULDERS=[
  [280,-101,1.593,4.067],[279.029,-99.868,.891,2.589],[279.493,-102.332,.953,1.217],[281.568,-100.564,1.064,4.550],
  [292,-132,1.109,3.394],[291.029,-130.868,.542,1.974],[291.493,-133.332,.708,2.820],[293.568,-131.564,.543,1.668],
];
export function visitMapleFixtures(frame,p) {
  for (const [x,z,s,yaw] of MAPLE_BOULDERS) {
    const f = frame(x,z,yaw);
    f.part('rock', 0, s * 0.41, 0, s * 1.02, s * 0.84, s * 0.9, '#a7a399', p.stone);
    f.part('snowLump', 0, s * 1.08, 0, s * 0.72, s * 0.15, s * 0.68, '#8c9566', p.stone);
  }
  const f = frame(289, -120, 0.76);
  f.part('vase', 0, 0, 0, 0.56, 0.68, 0.54, '#9a9783', p.stone);
  f.part('round', 0, 0.658, 0, 0.356, 0.012, 0.355, '#81a09c', p.fine);
  f.link([0.88, 0.06, -0.1], [0.74, 1.24, -0.12], 0.072, '#a39464');
  f.link([0.78, 1.1, -0.1], [0.1, 0.97, 0], 0.068, '#b3a16e');
  f.link([0.12, 0.93, 0], [0.12, 0.68, 0], 0.013, '#c5d7ca', p.fine, false);
}
export function visitDawnFixtures(frame,p) {
  const a = frame(342, 164, 0, 0.38),
    b = frame(349.8, 162.9, 0, 0.38);
  a.part('rock', 0, 0.41, 0, 3.15, 3.63, 2.13, '#666c69', p.stone, 0.55, 0.15, -0.16);
  b.part('rock', 0, 0.05, 0, 1.9, 1.95, 1.42, '#77796f', p.stone, -0.6, -0.08, 0.15);
  a.part('rock', 0.0, 3.63, 0.04, 1.04, 0.28, 0.69, '#858667', p.stone, 0.4, 0, -0.2);
  const rope = (q, strand) => {
    const arc = 1.02 * Math.sin(Math.PI * q),
      twist = q * tau * 9 + (strand * tau) / 3;
    return [
      .9 + 6.6 * q,
      3.76 - 1.48 * q - arc + 0.042 * sin(twist),
      -0.94 * q + 0.042 * cos(twist),
    ];
  };
  const strand=frame(342,164,0,0);
  for (let n = 0; n < 3; n++)
    for (let j = 0; j < 45; j++)
      strand.link(
        rope(j / 45, n),
        rope((j + 1) / 45, n),
        0.047,
        ['#b59d69', '#dfc589', '#aa8d5a'][n],
        p.solid, false,
      );
  for (let j = 1; j <= 6; j++) {
    const q = rope(j / 7, 0);
    strand.part('streamer',q[0],q[1]-.16,q[2],.34,.45,1,'#efe8cf',p.fine,.47,0,.08,false);
  }
  // Paired New Year bamboo arrangements flank the celebration.
  for (const [x, z, yaw] of KADOMATSU) {
    const f = frame(x, z, yaw);
    f.part('bucket', 0, 0, 0, 0.36, 0.5, 0.33, '#ab8e59', p.wood);
    for (const y of [0.12, 0.3, 0.44]) f.part('muffler', 0, y, 0, 0.35, 0.032, 0.34, '#8b7350', p.solid);
    for (let j = 0; j < 3; j++) {
      const dx = (j - 1) * 0.137,
        z = 0.032 * (j % 2),
        top = 1.08 + (j === 1 ? 0.38 : 0.08 * j);
      f.part('round', dx, (top + 0.44) / 2, z, 0.088, top - 0.44, 0.088, '#8c9d60', p.wood);
      f.part('ball', dx, top, z, 0.09, 0.057, 0.09, '#d9d2a2', p.fine, 0, 0.51);
      f.part('ball', dx, top + 0.033, z - 0.011, 0.058, 0.026, 0.06, '#838358', p.fine, 0, 0.51);
      f.part('round', dx, top - 0.28, z, 0.091, 0.025, 0.091, '#67794c');
    }
    for (let j = 0; j < 6; j++)
      f.part(
        'plane',
        sin(j) * 0.24,
        0.58,
        cos(j) * 0.19,
        0.52,
        0.63,
        1,
        '#dfe7ce',
        p.sprays?.pine,
        j * 1.58,
        -0.26,
        0,
        false,
      );
  }
}

// Receiver for the same local shapes the seasonal painter instances. Rounded
// solids keep a curved upper and lower face so a swimmer can pass under rock.
export function addSeasonalSolids(put,height,seeded,nearRoad,springRadius) {
  const materials={};
  function frame(x,z,yaw=0,base=height(x,z)) {
    const c=cos(yaw),s=sin(yaw);
    function span(u,v,rx,rz,lo,hi,kind='oval',turn=0) {
      return put(x+c*u+s*v,z-s*u+c*v,rx,rz,yaw+turn,base+hi,kind,false,0,base+lo);
    }
    function part(shape,u,y,v,w,h,d,color,material,turn=0,pitch=0,roll=0) {
      if(shape==='rock') {
        mountRockContact({x:x+c*u+s*v,y:base+y,z:z-s*u+c*v,sx:w,sy:h,sz:d,
          form:'round',yaw:yaw+turn,pitch,roll},put);
      } else if (shape==='ball' || shape==='snowLump') {
        const q=span(u,v,w,d,y-h,y+h,'springRock',turn);
        q.roundHeight=h;
        q.roundBottom=true;
      } else if (shape==='box') {
        span(u,v,w/2,d/2,y-h/2,y+h/2,'box',turn);
      } else if(shape==='round' || shape==='muffler') {
        span(u,v,w,d,y-h/2,y+h/2,'oval',turn);
      } else if(shape==='bucket' || shape==='vase' || shape==='kasa') {
        const profile=shape==='vase' ? [[.05,.75],[.34,.96],[.60,1],[.80,.93],[1,.75]] :
          shape==='kasa' ? [[.13,1],[.27,.78],[.45,.60],[.65,.42],[1,.24]] : [[.5,1],[1,.92]];
        let bottom=0;
        for(const [top,radius] of profile) {
          span(u,v,w*radius,d*radius,y+h*bottom,y+h*top,'oval',turn);
          bottom=top;
        }
      }
    }
    // Cut a sloping pole into short spans. This preserves the opening under
    // the water spout and follows the sag of each twisted strand offshore.
    function link(a,b,r) {
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],run=Math.hypot(dx,dz);
      const pieces=Math.max(1,Math.ceil(Math.min(Math.abs(dy),run)/Math.max(.04,r)));
      for(let i=0;i<pieces;i++) {
        const f=(i+.5)/pieces, yc=a[1]+f*dy, half=Math.abs(dy)/pieces/2+r;
        span(a[0]+f*dx,a[2]+f*dz,r,run/pieces/2+r,yc-half,yc+half,'box',Math.atan2(dx,dz));
      }
    }
    return {part,link,span};
  }
  function daruma(f,s,child) {
    const body=[[0,.08,.62],[.08,.32,.80],[.32,.88,.85],[.88,1.07,.77],
      [1.07,1.24,.62],[1.24,1.73,.655],[1.73,1.97,.55],[1.97,2.08,.32]];
    if(!child)body.push([1.85,1.97,.95],[1.97,2.16,.70],[2.16,2.35,.36]);
    for(const [lo,hi,r] of body)f.span(-.024*(lo+hi)*.5*s,0,r*s,r*.93*s,lo*s,hi*s);
  }
  visitSnowFixtures(frame,materials,null,daruma,seeded(238247),nearRoad,springRadius);
  visitMoonFixtures(frame,materials);
  visitMapleFixtures(frame,materials);
  visitDawnFixtures(frame,materials);
  const mill=frame(POUNDING.x,POUNDING.z,POUNDING.yaw,height(POUNDING.x,POUNDING.z)+.012);
  mill.span(0,0,.473,.473,.015,.22);
  mill.span(0,0,.372,.372,.22,.42);
  mill.span(0,0,.504,.504,.42,.60);
  mill.span(0,0,.46,.46,.60,.757,'kettleRim');
  mill.span(.64,-.63,.194,.194,.014,.351);
  mill.link([.463,.284,-.63],[.50,.547,-.63],.013);
  mill.link([.50,.547,-.63],[.64,.591,-.63],.013);
  mill.link([.64,.591,-.63],[.78,.542,-.63],.013);
  mill.link([.78,.542,-.63],[.82,.284,-.63],.013);
}
