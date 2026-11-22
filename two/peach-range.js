// The eastern road follows the bed of three interlocking spurs. Metres are
// measured east and south of the moon-gate orchard, as on the district map.
import { DISTRICTS } from './geography.js';

const centre=DISTRICTS.peach;
const {abs,min,max,sin,cos,hypot}=Math;
export const PEACH_RANGE_BOUNDS={
  west:centre.x-330,east:centre.x+366,north:centre.z-253,south:centre.z+198,
};
const localPass=[
  [310,56],[238,52],[174,14],[169,4],[174,-6],[188,-17],[190,-34],[174,-51],[149,-62],[118,-56],
  [99,-39],[94,-17],[99,9],[97,30],[83,48],[65,50],[51,36],[47,17],[34,4],[21,0],[0,0],[-15,0],[-27,0],
];
export const PEACH_APPROACH=[
  [-153,-85],[-171,-80],[-204,-75],[-230,-77],[-261,-97],[-288,-104],[-340,-119],[-409,-100],
  ...localPass.map(([u,v])=>[centre.x+u,centre.z+v]),
];

function ease(a,b,value){
  const t=min(1,max(0,(value-a)/(b-a)));
  return t*t*(3-2*t);
}
const mix=(a,b,t)=>a+(b-a)*t;

// Each surveyed crest carries its own height and breadth down to the toe.
// The two eastern fingers run across one another in projection; their saddles
// face opposite directions so the approach winds through the lower valley.
const crests=[
  [[-236,51,18,81],[-191,18,77,110],[-166,-30,121,130],[-149,-69,111,119],[-99,-106,142,135],[-48,-124,116,119],[-4,-120,134,122],[44,-107,99,129],[84,-110,115,108],[143,-91,83,105],[195,-98,66,93],[260,-72,37,88],[312,-65,11,64]],
  [[-233,-12,41,86],[-227,-74,78,103],[-195,-120,92,104],[-155,-153,85,98],[-100,-186,49,81],[-39,-210,16,59]],
  [[-210,29,43,93],[-166,48,74,110],[-120,86,102,128],[-83,108,83,123],[-42,121,108,133],[2,113,88,136],[48,108,104,132],[100,112,73,118],[156,88,83,101],[210,80,61,101],[263,68,34,87],[319,82,13,57]],
  [[-98,-113,82,112],[-67,-83,68,94],[-48,-65,44,65],[-25,-52,12,37]],
  [[48,-106,76,114],[69,-68,105,97],[77,-46,83,91],[92,-25,77,87],[100,3,62,68],[105,15,28,39]],
  [[141,102,73,116],[154,63,98,107],[140,43,98,100],[134,20,99,98],[138,-5,89,95],[150,-23,56,71],[153,-36,28,51]],
  [[215,-91,52,100],[228,-59,82,109],[214,-35,111,118],[221,-10,99,103],[236,8,76,88],[252,21,37,65]],
  [[-92,93,68,82],[-119,60,64,82],[-118,28,88,107],[-137,-4,106,113],[-163,-29,100,121]],
];

const cells=new Map(),cellSize=40;
const cellKey=(u,v)=>Math.floor(u/cellSize)*128+Math.floor(v/cellSize);
for(const chain of crests)for(let i=1;i<chain.length;i++){
  const [x,z,h,w]=chain[i-1],[ex,ez,eh,ew]=chain[i],dx=ex-x,dz=ez-z,widest=max(w,ew)+7;
  const segment={x,z,dx,dz,h,w,dh:eh-h,dw:ew-w,inv:1/(dx*dx+dz*dz)};
  for(let a=Math.floor((min(x,ex)-widest)/cellSize);a<=Math.floor((max(x,ex)+widest)/cellSize);a++)
    for(let b=Math.floor((min(z,ez)-widest)/cellSize);b<=Math.floor((max(z,ez)+widest)/cellSize);b++){
      const key=a*128+b;
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(segment);
    }
}

// Runoff has carved small coves and fluted secondary spines into the sides
// of the main massifs. The broad foot remains gently convex below the rock.
function divides(u,v){
  const segments=cells.get(cellKey(u,v));
  if(!segments)return 0;
  const x=u+3.9*sin(v*.045+u*.014)+1.7*sin(v*.11-u*.027);
  const z=v+4.1*sin(u*.037-v*.024)+2.1*cos(u*.092+v*.013);
  let rise=0;
  for(const s of segments){
    const a=x-s.x,b=z-s.z,t=min(1,max(0,(a*s.dx+b*s.dz)*s.inv));
    const du=a-t*s.dx,dv=b-t*s.dz,w=s.w+t*s.dw,d2=(du*du+dv*dv)/(w*w);
    if(d2>=1)continue;
    const d=Math.sqrt(d2),flank=1-ease(0,1,d),crown=1-ease(0,.47,d);
    rise=max(rise,(s.h+s.dh*t)*(.80*flank+.20*crown));
  }
  return rise;
}
const streams=localPass.slice(1).map(([ex,ez],i)=>{
  const [x,z]=localPass[i],dx=ex-x,dz=ez-z;
  return {x,z,dx,dz,inv:1/(dx*dx+dz*dz)};
});
function riverbedDistance(u,v){
  let best=Infinity;
  for(const s of streams){
    const a=u-s.x,b=v-s.z,t=min(1,max(0,(a*s.dx+b*s.dz)*s.inv));
    const du=a-s.dx*t,dv=b-s.dz*t;
    best=min(best,du*du+dv*dv);
  }
  return Math.sqrt(best);
}

function terrace(y,bench){
  const d=y-bench;
  return d*(1-ease(4,15,abs(d)));
}

export function peachRangeHeight(x,z,base){
  const u=x-centre.x,v=z-centre.z;
  const fringe=min(ease(-330,-263,u),1-ease(303,366,u),ease(-253,-203,v),1-ease(150,198,v));
  const a=u/123,b=v/108,r=hypot(a,b),floor=5.3+2.2*sin(a*5+.3)*cos(b*6)+3.5*r;
  const hollow=hypot((u+3)/76,v/57);
  const orchard=ease(.53,1.56,hollow);
  let y=mix(floor,base+divides(u,v),orchard);
  if(u>-11 && u<330 && v>-132 && v<155){
    const d=riverbedDistance(u,v);
    // A gravel bottom, colluvial banks, then taller crags. Smooth the
    // junction with the spur so the exposed hillside never has a cut edge.
    const beyond=max(0,d-6.8),bank=beyond*(.52+1.39*ease(0,33,beyond));
    const bed=mix(floor,9.9+.77*sin(.023*u+.016*v),ease(28,112,u));
    const valley=bed+bank,k=max(0,3.2-abs(valley-y));
    const carved=min(valley,y)-k*k/(4*3.2);
    y=mix(y,carved,ease(-11,19,u)*(1-ease(290,330,u)));
  }
  // Tilted alluvial terraces survive in separate pockets on the mountain
  // flanks. Their lower aprons take peach trees; steeper rock separates them.
  if(y>12 && y<120){
    const index=.036*u+.021*v,fold=.043*v-.018*u;
    const cover=.56+.44*ease(-.5,.65,cos(index*.63)+.58*sin(fold*.82));
    const low=24+5.1*sin(index)+3.8*cos(fold);
    const middle=52+7.3*cos(index*.78)-4.6*sin(fold);
    const high=84+7.4*sin(index*.91)+5.3*sin(fold*.72);
    const weight=cover*.83*ease(12,21,y)*(1-ease(108,120,y));
    y-=weight*(terrace(y,low)+terrace(y,middle)+terrace(y,high));
  }
  return mix(base,y,fringe);
}
