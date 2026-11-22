// Metres on the western face of Otowa. The stage projects over the timbered
// slope; only the mountainside behind the sanctuary and the forecourt are cut.
import { roofSkinDepth } from './architecture.js';

export const KIYOMIZU={x:510,z:-717,floor:76.5,name:'清水寺'};
// The upper approach belongs to Kyoto even where Fushimi's map pin is
// geographically closer. Its music continues from the city into the precinct.
export const onMountOtowa=(x,z)=>((x-KIYOMIZU.x+16)/59)**2+((z-KIYOMIZU.z+13)/43)**2<1;
const floor=KIYOMIZU.floor;
export const KIYOMIZU_BELL={x:509,z:-745,bottom:77.25,top:79.55,radius:.94,
  profile:[[0,.94],[.13,.94],[.22,.85],[1.76,.77],[2.01,.65],[2.30,.25]]};
export const KIYOMIZU_APPROACH=[
  [340,-785],[357,-785],[381,-776],[401,-760],[426,-754],[446,-746],
  [458,-732],[469,-725],[476,-730],[483,-743],[489,-745],[498,-742],[503,-739],[503,-729],
];
export const STAGE={west:491,east:522,north:-730.7,south:-703.3};
export const OTOWA_ROOFS=[
  {x:512.1,z:-717,width:34.6,depth:23,eave:84.0,rise:9.1,yaw:Math.PI/2,form:'barkHip'},
  {x:509,z:-745,width:11,depth:8.9,eave:81.15,rise:3.58,yaw:Math.PI/2,form:'hip'},
];
export const PAGODA={x:523,z:-751.5};
export const GATE={x:486,z:-744.7};
export const OTOWA_LANTERNS=[[361,-779],[427,-750],[457,-737],[477,-738],[487,-740],[498,-748],[504,-734]];
export const OTOWA_WAYSTONE={x:346,z:-782.25};
export const STAGE_RAILS=[[491.22,-717,.23,26.9],[495.58,-730.47,8.94,.23],
  [506.5,-703.53,30.6,.23]];
export const HALL_COLUMNS=[504.9,511.8,520].flatMap(x=>[-728.7,-723,-717,-711,-705.3].map(z=>[x,z]));
export const BELL_COLUMNS=[-3.35,3.35].flatMap(u=>[-2.65,0,2.65].map(v=>[509+u,-745+v]));
export const STAGE_PILES=[492.2,496.5,500.8,505.1,509.4,513.7,518].flatMap(x=>
  [-729.15,-725.1,-721.05,-717,-712.95,-708.9,-704.85].map(z=>[x,z]));

function shelf(x,z,l,r,n,s,f) {
  const edge=Math.max(l-x,x-r,n-z,z-s,0);
  const t=Math.min(1,edge/f);return 1-t*t*(3-2*t);
}
// The last turns lie on the gravel court itself. Keep the cut clear of the
// open timber stage projecting over the hillside south of the court.
const approachSegments=KIYOMIZU_APPROACH.slice(1,-2).map(([endX,endZ],i)=>{
  const [x,z]=KIYOMIZU_APPROACH[i],dx=endX-x,dz=endZ-z;
  return {x,z,dx,dz,length2:dx*dx+dz*dz};
});
function approachHeight(x,z,native) {
  if(x<340 || x>518 || z< -805 || z> -705)return native;
  let distance=Infinity;
  for(const s of approachSegments){
    const u=x-s.x,v=z-s.z,t=Math.max(0,Math.min(1,(u*s.dx+v*s.dz)/s.length2));
    distance=Math.min(distance,(u-t*s.dx)**2+(v-t*s.dz)**2);
  }
  // A graded earthen approach gains height over the whole length of its
  // western shoulder. Round both ends into the street and the gravel court.
  const along=Math.min(x-340,158),toe=26,crest=12,run=158-(toe+crest)/2;
  const rise=along<toe ? along*along/(2*toe) : along>158-crest ?
    run-(158-along)**2/(2*crest) : along-toe/2;
  const stage=Math.max(0,Math.min(1,(x-479)/12))*Math.max(0,Math.min(1,(z+739)/9));
  const verge=Math.min(1,Math.max(0,(Math.sqrt(distance)-3)/16,stage));
  const end=Math.min(1,(x-340)/8,(518-x)/14);
  return native+(5+(floor-5)*rise/run-native)*(1-verge*verge*(3-2*verge))*end*end*(3-2*end);
}
export function kiyomizuTerrain(x,z,native) {
  native=approachHeight(x,z,native);
  if(x<484||x>542||z< -771||z> -686)return native;
  const court=shelf(x,z,499,529,-758,-730.7,10);
  const rear=shelf(x,z,510,525,-733,-701,11);
  const cut=Math.max(court,rear);
  // A second strip connects the level gravel to the deck's open northern bay.
  return native+(floor-.22-native)*cut+.22*court;
}

export function kiyomizuClearing(x,z) {
  return x>485 && x<534 && z> -762 && z< -697 ||
    Math.abs(x-GATE.x)<4.8 && Math.abs(z-GATE.z)<7;
}
export function kiyomizuViewTree(x,z,top) {
  if(x<350||x>491)return false;
  // Clear only crowns that overtop the actual line from the rail to the city.
  const t=(491-x)/(491-240),rayZ=-717+t*(-848+717);
  return Math.abs(z-rayZ)<15+12*t && top>77.8+t*(9-77.8)-1.6;
}
export function bellRadiusAt(y) {
  const dy=y-KIYOMIZU_BELL.bottom,p=KIYOMIZU_BELL.profile;
  if(dy<0||y>KIYOMIZU_BELL.top)return 0;
  for(let i=1;i<p.length;i++){
    const [h,r]=p[i];if(dy>h)continue;
    const [h0,r0]=p[i-1];return r0+(r-r0)*(dy-h0)/(h-h0);
  }
  return p.at(-1)[1];
}

// Interlocking transverse and longitudinal ties. Survey every course from
// the stone foundations so the valley remains open below the platform.
export function visitStageTies(height,visit){
  for(const [x,z] of STAGE_PILES){
    const ground=height(x,z);
    for(let i=0;i<10;i++){
      const y=floor-1.10-2.55*i;
      if(y<ground-.20)break;
      if(x<517.9)visit(x+2.15,y,z,4.76,.43,.30);
      if(z< -705)visit(x,y+.37,z+2.025,.32,.43,4.56);
    }
  }
}

export function kiyomizuSolids(height,put) {
  function solid(x,z,w,d,top,kind='wall',bottom=-Infinity){
    return put(x,z,w/2,d/2,0,top,kind,kind==='slab',0,bottom);
  }
  function roof(r){
    const item=put(r.x,r.z,r.width/2,r.depth/2,r.yaw,r.eave,'roof',true,r.rise);
    item.form=r.form;if(r.form==='pagoda')item.aperture=0;item.thickness=r.rise*roofSkinDepth(r.form);
  }
  const s=STAGE;
  solid((s.west+s.east)/2,(s.north+s.south)/2,s.east-s.west,s.south-s.north,floor,'slab',floor-.39);
  for(const [x,z,w,d] of STAGE_RAILS)solid(x,z,w,d,floor+1.02,'wall',floor);
  for(const [x,z] of STAGE_PILES)solid(x,z,.81,.81,floor-.39,'oval',height(x,z)-.25);
  visitStageTies(height,(x,y,z,w,h,d)=>solid(x,z,w,d,y+h/2,'slab',y-h/2));
  for(const [x,z] of HALL_COLUMNS)solid(x,z,.62,.62,floor+7.68,'oval',floor);
  solid(520.1,-717,.23,23.6,floor+7.35,'wall',floor);
  for(const z of [-728.8,-705.2])solid(516.1,z,8.14,.22,floor+7.35,'wall',floor);
  solid(518.05,-717,2.1,7.1,floor+1.43,'box',floor);
  for(const [x,z] of OTOWA_LANTERNS){
    const base=height(x,z);
    solid(x,z,.5,.5,base+1.38,'oval');
    solid(x,z,.98,.91,base+2.42,'oval',base+1.35);
  }
  solid(OTOWA_WAYSTONE.x,OTOWA_WAYSTONE.z,.52,.55,height(OTOWA_WAYSTONE.x,OTOWA_WAYSTONE.z)+1.65);
  for(const r of OTOWA_ROOFS)roof(r);
  for(const [x,z] of BELL_COLUMNS)solid(x,z,.56,.56,81.2,'oval',floor-.20);
  const b=KIYOMIZU_BELL;
  const bell=put(b.x,b.z,b.radius,b.radius,0,b.top,'bell',false,0,b.bottom);
  bell.profile=b.profile;
  for(let i=0;i<3;i++){
    const span=10.5-i*1.65,base=floor+i*3.65;
    solid(PAGODA.x,PAGODA.z,span*.53,span*.53,base+3.4,'box',i===0?floor:base-.3);
    roof({x:PAGODA.x,z:PAGODA.z,width:span,depth:span,yaw:0,eave:base+3.02,rise:2.12,form:'pagoda'});
  }
  for(const z of [-3.1,3.1])for(const x of [-1.45,1.45])
    solid(GATE.x+x,GATE.z+z,.53,.53,height(GATE.x,GATE.z)+4.32,'oval');
  roof({x:GATE.x,z:GATE.z,width:9.6,depth:6.2,yaw:Math.PI/2,eave:height(GATE.x,GATE.z)+4.1,rise:2.85,form:'hip'});
}
