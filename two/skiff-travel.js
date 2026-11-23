// Local metres on each hull. The bow thwart keeps a passenger clear of the
// merchant, sculler, sacks and rigging while the low river boats pass a bridge.
import { BOATS, HULL_DRAFT, HULL_HEIGHT, halfBreadth, sheerHeight } from './shoreline.js';
import { RIVER_SKIFFS, SKIFF_SCALE, merchantPose } from './traveller-positions.js';
import { WATER_Y, landscapeFloor, wrapCoord, wrapDelta } from './terrain.js';

export const PASSENGER_THWART = {z:2.33,y:.62,width:.73,depth:.36,height:.085};
const moorings=[
  ['sakura-ferry','桜川の渡し舟'],['matsuhama-sail','松浜の帆掛け舟'],
  ['matsuhama-row','松浜の櫓舟'],['snow-fisher','雪浜の網舟'],
];
const itineraries=[
  ['west-merchant','西の沖の帆掛け問屋'],['east-merchant','東の沖の帆掛け問屋'],
  ...RIVER_SKIFFS.map((q,i)=>[['river-rice','river-cloth','river-tea'][i],q.name]),
];
export const SKIFFS=[
  ...BOATS.map((b,i)=>{
    // Sit on one of the three removable cross-benches. At the winter boat
    // the middle bench faces the two net haulers and clears their mast.
    const t=i===3?-.09:.31;
    return {...b,id:moorings[i][0],name:moorings[i][1],seat:[i===3?-.24:0,sheerHeight(t)*HULL_HEIGHT*.78+.057/2,t*b.length/2]};
  }),
  ...itineraries.map(([id,name],index)=>({id,name,index,length:6.1,width:1.716,
    seat:[0,PASSENGER_THWART.y+PASSENGER_THWART.height/2,PASSENGER_THWART.z]})),
];

const poses=new WeakMap();
export function skiffPose(skiff,time) {
  const cached=poses.get(skiff);
  if(cached && (skiff.index===undefined || cached.time===time))return cached;
  const fixed=skiff.index===undefined;
  const q=fixed ? {x:skiff.x,z:skiff.z,y:WATER_Y-HULL_DRAFT,yaw:skiff.yaw,pitch:0,roll:0,scale:1}
    : {...merchantPose(skiff.index,time),pitch:.022*Math.cos(time*.91+skiff.index),roll:.034*Math.sin(time*.83+skiff.index),
      scale:skiff.index>=2?SKIFF_SCALE:1};
  // Columns of the drawing's YXZ rotation: across, up and forward.
  const cy=Math.cos(q.yaw),sy=Math.sin(q.yaw),cx=Math.cos(q.pitch),sx=Math.sin(q.pitch),cz=Math.cos(q.roll),sz=Math.sin(q.roll);
  q.across=[cy*cz+sy*sx*sz,cx*sz,-sy*cz+cy*sx*sz];
  q.up=[-cy*sz+sy*sx*cz,cx*cz,sy*sz+cy*sx*cz];
  q.forward=[sy*cx,-sx,cy*cx];q.time=time;
  poses.set(skiff,q);return q;
}
function worldAt(q,u,h,v) {
  return {x:wrapCoord(q.x+q.scale*(q.across[0]*u+q.up[0]*h+q.forward[0]*v)),
    y:q.y+q.scale*(q.across[1]*u+q.up[1]*h+q.forward[1]*v),
    z:wrapCoord(q.z+q.scale*(q.across[2]*u+q.up[2]*h+q.forward[2]*v))};
}
export function skiffDeck(skiff,time) {
  const q=skiffPose(skiff,time), at=worldAt(q,...skiff.seat);
  at.heading=Math.atan2(-q.forward[0],-q.forward[2]);
  at.pitch=-q.pitch;
  at.roll=-q.roll;
  return at;
}
export function skiffApproaches(skiff,time) {
  const q=skiffPose(skiff,time), side=skiff.width/2+.88/q.scale;
  // A landing might be on the pier side, or on either side of the bow.
  return [[side,skiff.seat[2]],[-side,skiff.seat[2]],[side,0],[-side,0],
    [0,skiff.length/2+.9/q.scale],[0,-skiff.length/2-.9/q.scale]].map(([u,v])=>{
      const at=worldAt(q,u,0,v);
      at.y=landscapeFloor(at.x,at.z);
      return at;
    });
}

export function visitMooredFittings(f,p,{length,width,sail}) {
  const height=HULL_HEIGHT, rope='#b39769',timber='#795d41',PI=Math.PI;

  const half=t=>halfBreadth(t)*width, rim=t=>sheerHeight(t)*height;
  // Removable bottom boards run fore and aft. Their ends fit the taper.
  for(let j=-2;j<=2;j++){
    const u=j*width*.068, span=length*(.61-.09*Math.abs(j));
    f.part('box',u,.128,0,width*.066,.044,span,j%2?'#b19878':'#c1aa83',0,0,0,p.wood);
  }
  // Steam-bent ribs rise from the sole to the gunwale on both sides.
  for(const t of [-.76,-.56,-.31,.01,.31,.56,.76]){
    const v=t*length*.5, w=half(t);
    for(const side of [-1,1]){
      const foot=[side*w*.41,.115+t*t*.11,v],turn=[side*w*.78,.248+Math.abs(t)*.07,v];
      f.line(foot,turn,.030,'#886b4c',p.wood,true);
      f.line(turn,[side*w*.92,rim(t)-.018,v],.031,'#997953',p.wood,true);
    }
  }
  for(let i=0;i<4;i++){
    const t=.68+i*.07;
    f.part('box',0,rim(t)-.036,t*length*.5,half(t+.032)*1.89,.048,length*.032,'#ad906d',0,0,0,p.deck);
  }
  for(let i=0;i<4;i++)f.part('ropeCoil',.055,.154+i*.018,-length*.21,.15,.33,.19,'#b19664',0,0,0,p.wood);
  for (const side of [-1, 1])
    for (let k = 0; k < 11; k++) {
      const u = (k / 11) * 2 - 1,
        n = ((k + 1) / 11) * 2 - 1;
      f.line(
        [side * half(u), rim(u), u * length * 0.5],
        [side * half(n), rim(n), n * length * 0.5],
        0.032,
        '#685139'
      );
      f.line(
        [side * half(u) * 0.9, rim(u) * 0.61, u * length * 0.5],
        [side * half(n) * 0.9, rim(n) * 0.61, n * length * 0.5],
        0.011,
        '#73583f'
      );
    }
  for (let i = 0; i < 3; i++) {
    const t = -0.49 + i * 0.4;
    f.part(
      'box',
      0,
      rim(t) * 0.78,
      t * length * 0.5,
      half(t) * 1.76,
      0.057,
      0.19,
      '#c0a17a',
      0,
      0,
      0,
      p.wood
    );
  }
  f.line([-0.28, 0.62, -length * 0.34], [0.37, 0.56, length * 0.28], 0.029, '#b19b72', p.wood);
  f.part('ball', 0.39, 0.52, length * 0.33, 0.085, 0.034, 0.27, '#ab8960', -0.21);
  if (sail) {
    f.line([0, 0.2, -0.12], [0, 3.55, -0.12], 0.05, '#94774e', p.wood);
    f.line([0, 3.28, -0.12], [-0.23, 0.58, -length * 0.41], 0.009, rope);
    f.line([0, 3.28, -0.12], [0.32, 0.61, length * 0.4], 0.009, rope);
    f.line([-0.05, 3.3, -0.14], [-0.1, 2.92, 1.35], 0.028, timber, p.wood);
    f.part('awning', -0.08, 3.09, 0.58, 0.23, 0.37, 1.42, '#e8ddbc', 0.03, -0.15, 0.22);
    for (let j = 0; j < 6; j++)
      f.part(
        'round',
        -0.08,
        3.07 - j * 0.041,
        0.03 + j * 0.195,
        0.107,
        0.035,
        0.11,
        '#a99870',
        0,
        PI * 0.49,
        0.13
      );
    f.part('box', 0, 3.45, 0.1, 0.014, 0.19, 0.46, '#b8694b', 0, -0.07, 0);
  }
}
export function visitMerchantFittings(b,index,skiff,straw, lacquer) {
  for(const side of [-1,1]){
    const gunwale=Array.from({length:13},(_,i)=>{const t=i/6-1; return [side*(.84*(1-Math.abs(t)**2.3)+.018),.50+.26*t*t,t*3.05];});
    b.stroke(gunwale,.045,'#584937');
  }
  for(let i=-4;i<=4;i++) b.box(0,.43,i*.47,1.25*(1-Math.abs(i/5)**2),.07,.44,straw);
  if(!skiff){
    b.rod([0,.42,-.58],[0,3.3,-.58],.047,'#79573a',.031);
    b.rod([-.88,3.15,-.58],[.88,3.15,-.58],.035,'#624e36');
  }
  for(const side of [-1,1]){
    if(!skiff){
      b.stroke([[side*.90,3.15,-.56],[side*.72,2.14,-.30],[side*.78,.54,-1.34]],.014,'#957956');
      b.stroke([[side*.84,3.16,-.56],[side*.92,2.86,-.45],[side*.95,1.58,-.56],[side*.68,.55,.13]],.011,'#7b6750');
      b.rod([side*.86,1.56,-.57],[side*.91,1.61,-.56],.025,straw);
    }
    for(const height of [.14,.28]){
      const seam=Array.from({length:15},(_,i)=>{
        const t=i/7-1;
        return [side*(.84*(1-Math.abs(t)**2.3)+.018)*(.72+height*.58),height+.26*t*t,t*3.05];
      });
      b.stroke(seam,.011,'#5e503f');
    }
  }
  if(skiff){
    // Low cargo and folded covers fit between the piles under all three
    // arched bridges. A cloth, tied in two places, identifies each house.
    b.box(0,.71,-.61,1.21,.46,.95,'#8c7554');
    b.box(0,.95,-.61,1.24,.065,1.01,skiff.color);
    for(const side of [-1,1]){
      b.box(side*.605,.826,-.61,.03,.23,1.01,skiff.color,[0,0,side*.07]);
      b.box(side*.627,.797,-.61,.012,.032,.96,'#d3c4a1');
    }
    for(const z of [-.92,-.29])
      b.stroke([[-.68,.52,z],[-.617,.95,z],[0,.998,z],[.617,.95,z],[.68,.52,z]],.019,'#b6a17a');
    b.rod([-.56,.53,-1.63],[-.55,.56,1.53],.034,'#b0986c');
    if(index===3){
      for(const [x,y,color] of [[-.17,1.06,skiff.color],[.14,1.06,'#a68271'],[0,1.26,'#85856f']])
        b.rod([x,y,-1.01],[x,y,-.26],.148,color);
    }
    if(index===4){
      for(const x of [-.26,.26]){
        b.box(x,1.10,-.61,.42,.25,.67,'#9a895d');
        b.box(x,1.24,-.61,.45,.041,.71,'#bda77d');
        b.box(x,1.268,-.61,.065,.022,.71,skiff.color);
      }
    }
  }else{
    b.rod([-.98,1.57,-.56],[.98,1.57,-.56],.025,'#9d8459');
    for(const z of [-1.05,.85])
      b.stroke([[0,3.2,-.57],[-.035,2.43,z*.34-.35],[.025,.53,z]],.011,'#786954');
  }
  for(const z of [-1.55,1.6]) for(const side of [-1,1]) {
    b.ball(side*.30,.65,z,.26,.28,.39,'#bda172');
    for(const dz of [-.12,.14]) b.loop(side*.30,.66,z+dz,.26,.34,.048,'#7d6b4d');
  }
  if(!skiff)b.rod([-.42,1.25,.78],[-1.24,.04,1.75],.039,lacquer);
  const seat=PASSENGER_THWART;
  b.box(0,seat.y,seat.z,seat.width,seat.height,seat.depth,'#b59a72');
}

function fittings(skiff) {
  const parts=[];
  function box(x,y,z,width,height,depth,angle=0) {
    parts.push({x,z,low:y-height/2,high:y+height/2,w:width/2,d:depth/2,c:Math.cos(angle),s:Math.sin(angle)});
  }
  function rod(a,b,r) {
    parts.push({a,b,r,low:Math.min(a[1],b[1])-r,high:Math.max(a[1],b[1])+r});
  }
  function ball(x,y,z,w,h,d) {
    parts.push({x,z,low:y-h,high:y+h,w,d,round:true});
  }
  if(skiff.index===undefined) {
    visitMooredFittings({line:rod,part(shape,x,y,z,w,h,d,color,angle=0) {
      if(shape==='ball')ball(x,y,z,w,h,d);
      else if(shape==='round' || shape==='ropeCoil')box(x,y,z,w*2,h*.2,d*2,angle);
      else box(x,y,z,w,h,d,angle);
    }},{},skiff);
    if(skiff.id==='snow-fisher') {
      rod([.12,.15,-.03],[.19,4.62,-.19],.066);
      rod([.12,4.42,-1.26],[.30,4.34,1.14],.027);
      for(const [x,v,high] of [[-.21,-1.43,1.46],[-.29,1.32,1.11]]) {
        ball(x,.145+high*.48,v,.28,high*.49,.26);
      }
      // A billowing four-panel sail with its bottom two metres above the sole.
      for(let i=0;i<4;i++) {
        const t=(i+.5)/4;
        box(.12+.18*t+.18*Math.sin(Math.PI*t),3.17,(t-.5)*2.3-.04,.12,2.53,.59);
      }
    }
  }else{
    const i=skiff.index;
    visitMerchantFittings({box:(x,y,z,w,h,d)=>box(x,y,z,w,h,d),ball,rod,
      stroke(path,r){for(let j=1;j<path.length;j++)rod(path[j-1],path[j],r);},
      loop(x,y,z,w,h,r){ball(x,y,z,w+r,h+r,r);}
    },i,i>=2?RIVER_SKIFFS[i-2]:null);
    ball(0,1.19,.56,.43,.75,.34);
    ball(.075,1.14,-2.12,.37,.68,.26);
    if(i<2)box(0,2.345,-.54,1.87,1.55,.08);
  }
  return parts;
}
const partsBySkiff=new WeakMap();

function fittingDepth(part,u,v,low,high,radius) {
  if(low>=part.high || high<=part.low)return 0;
  if(part.a) {
    const [x,y,z]=part.a,dx=part.b[0]-x,dy=part.b[1]-y,dz=part.b[2]-z;
    let start=0,end=1;
    if(dy!==0) {
      const p=(low-part.r-y)/dy,q=(high+part.r-y)/dy;
      start=Math.max(start,Math.min(p,q));end=Math.min(end,Math.max(p,q));
    }
    const len=dx*dx+dz*dz;
    const t=len ? Math.max(start,Math.min(end,((u-x)*dx+(v-z)*dz)/len)) : 0;
    return radius+part.r-Math.hypot(u-x-t*dx,v-z-t*dz);
  }
  const x=u-part.x,z=v-part.z;
  if(part.round){
    const mid=(part.high+part.low)*.5;
    const y=Math.max(0,low-mid,mid-high)/((part.high-part.low)*.5);
    const slice=Math.sqrt(Math.max(0,1-y*y));
    return (1-Math.hypot(x/(part.w*slice+radius),z/(part.d*slice+radius)))*(Math.min(part.w,part.d)*slice+radius);
  }
  const a=Math.abs(x*part.c-z*part.s)-part.w,b=Math.abs(x*part.s+z*part.c)-part.d;
  return radius-Math.hypot(Math.max(0,a),Math.max(0,b))-Math.min(0,Math.max(a,b));
}

// Slice the keel, lower strakes and gunwales at the traveller's height. The
// well of an empty boat and the water below its keel stay open.
function hullDepth(skiff,u,v,low,high,radius) {
  const end=Math.max(0,Math.abs(v)-skiff.length*.5);
  if(end>radius)return 0;
  const t=Math.max(-1,Math.min(1,2*v/skiff.length)),abs=Math.abs(t);
  const r=Math.sqrt(Math.max(0,radius*radius-end*end)),fixed=skiff.index===undefined;
  const w=fixed ? halfBreadth(t)*skiff.width : .84*(1-abs**2.3)+.018;
  const keel=fixed ? (.035+.15*t*t)*HULL_HEIGHT : -.09+.26*t*t;
  const chine=fixed ? (.285+abs*.1)*HULL_HEIGHT : .08+.26*t*t;
  const rim=fixed ? sheerHeight(t)*HULL_HEIGHT : .48+.26*t*t;
  const sole=fixed ? keel+.059*HULL_HEIGHT : .15+.26*t*t;
  if(high<=keel || low>=rim+.012)return 0;
  const a=Math.abs(u),baseWidth=fixed?.47:0,midWidth=fixed?.87:.71;
  let depth=low<sole ? r+w*(fixed?.47:.60)-a : 0;
  for(const [bottom,top,from,to] of [[keel,chine,baseWidth,midWidth],[chine,rim+.012,midWidth,1]]){
    if(high<=bottom || low>=top)continue;
    const at=y=>w*(from+(to-from)*Math.max(0,Math.min(1,(y-bottom)/(top-bottom))));
    const outer=at(high), inner=at(low)*(fixed?.90:.83);
    depth=Math.max(depth,r-Math.max(a-outer,inner-a));
  }
  return depth;
}

export function skiffContact(x,z,feet,height,radius,time,ignoreId=null) {
  let depth=0;
  for(const skiff of SKIFFS) {
    if(skiff.id===ignoreId)continue;
    const q=skiffPose(skiff,time),dx=wrapDelta(x-q.x),dz=wrapDelta(z-q.z);
    if(Math.abs(dx)>4+radius || Math.abs(dz)>4+radius || feet>q.y+5 || feet+height<q.y-.35)continue;
    const localY=dy=>(dx*q.up[0]+dy*q.up[1]+dz*q.up[2])/q.scale;
    const low=localY(feet-q.y),high=localY(feet+height-q.y),r=radius/q.scale;
    const dy=feet-q.y+height*.5;
    const u=(dx*q.across[0]+dy*q.across[1]+dz*q.across[2])/q.scale;
    const v=(dx*q.forward[0]+dy*q.forward[1]+dz*q.forward[2])/q.scale;
    let partDepth=hullDepth(skiff,u,v,low,high,r);
    if(!partsBySkiff.has(skiff))partsBySkiff.set(skiff,fittings(skiff));
    for(const part of partsBySkiff.get(skiff))
      partDepth=Math.max(partDepth,fittingDepth(part,u,v,low,high,r));
    depth=Math.max(depth,partDepth*q.scale);
  }
  return depth;
}
