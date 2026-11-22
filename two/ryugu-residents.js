import { RYUGU } from './ryugu-layout.js';
import { terrainHeight, WATER_Y } from './terrain.js';

// x is across the shoulders, z points towards the face. Letter contacts follow
// the performers' bodies; the fan, raised writing brush and mallets are props.
export const SEA_SPECIES = {
  seaTurtle: { label:'海亀', points:40, center:.88, frame:2.85,
    volumes:[[0,.80,-.13,.57,.63,.58],[0,1.47,.39,.32,.33,.32],[-.60,.74,.13,.27,.32,.34],[.60,.74,.13,.27,.32,.34]] },
  bream: { label:'鯛', points:30, center:.97, frame:2.9,
    volumes:[[0,.95,.02,.31,.52,.72],[0,1.14,.57,.30,.38,.45],[0,.73,-.80,.15,.28,.36]] },
  octopus: { label:'蛸', points:45, center:.94, frame:2.72,
    volumes:[[0,1.13,0,.41,.60,.40],[0,.42,.04,.66,.32,.60],[0,.80,.40,.30,.28,.30]] },
};

// East from the audience hall, the pearl lamps trace two shoals and the
// gate. The side gardens have their own small ensembles outside the galleries.
const seats = [
  [75, 1, 2.0], [49,-3,2.7], [32,4,2.8], [21,0,1.5],
  [8.4,-5.8,1.1], [2.2,2.8,.35], [-3.8,-3.9,.55], [4,12.2,1.1],
  [1,-14.2,.68], [-16,22.7,.64], [-17,-23.5,.77], [-26,4,1.3],
];
const kinds=Object.keys(SEA_SPECIES),tau=2*Math.PI;
export const SEA_ENSEMBLES=seats.length;
export function makeRyuguResidents() {
  const visitors=[];
  for (let seat=0;seat<seats.length;seat++) {
    const [along,across,height]=seats[seat];
    for(let part=0;part<kinds.length;part++) {
      const type=kinds[(seat+part)%kinds.length],a=part*tau/3+seat*.7;
      const x=RYUGU.x+along+Math.cos(a)*2, z=RYUGU.z+across+Math.sin(a)*2.35;
      const stature=.92+.19*(.5+.5*Math.sin(2.71*seat+part*1.63));
      const n={id:'ryugu-'+type+'-'+seat,type,habitat:'ryugu',role:{seaTurtle:'drum',bream:'fan',octopus:'scribe'}[type],
        seaResident:true,homeX:x,homeZ:z,homeY:Math.min(WATER_Y-4,terrainHeight(x,z)+height),stature,
        phase:seat*1.733+part*2.178,bearing:Math.PI/2+(type==='bream'?(seat%2?-.97:.98):0)+.47*Math.sin(seat*.91+part*2.06),
        reach:seat<4?1.30:.61,flash:0,mounted:false};
      updateRyuguResident(n,0);
      visitors.push(n);
    }
  }
  return visitors;
}
export function updateRyuguResident(n,time) {
  const q=time*.265+n.phase,beat=time*(n.type==='seaTurtle'?3.9:n.type==='bream'?2.15:1.79)+n.phase;
  const glide=.5+.5*Math.sin(q*.73),r=n.reach;
  n.x=n.homeX+r*(.73*Math.sin(q)+.18*Math.sin(q*2));
  n.z=n.homeZ+r*.67*Math.cos(q);
  n.y=n.homeY+.15+.093*Math.sin(q*2)+glide*.12;
  n.heading=n.bearing+.59*Math.sin(q)+.19*Math.sin(q*.7);
  n.speed=r*.265*Math.hypot(.73*Math.cos(q)+.36*Math.cos(q*2),.67*Math.sin(q));
  n.beat=beat;n.sampleTime=time;
  // A two-beat accent, then the small pause at the end of each phrase.
  const phrase=((time+n.phase*.31)%7.4)/7.4;
  n.gesture=Math.min(1,Math.max(0,Math.sin(Math.PI*phrase)*2.9-.27));
  return n;
}
