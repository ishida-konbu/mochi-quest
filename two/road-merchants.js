// Market traders keep to the road shoulder. Each side of the journey is
// timed from the game clock, so a returning player finds the convoy in place.
import * as T from './vendor/three.module.min.js';
import { ROADS, CONNECTING_ROADS, groundHeight, wrapDelta } from './terrain.js';
import { cartPosition, measureRoute } from './trade-routes.js';
import { batchActorParts } from './actors.js';
import { ancientClothing, townBody, townHeadwear } from './heian-dress.js';
import { paintedSilk, townPortrait } from './emaki-costume.js';
import { dressedRiceFace } from './mochi-model.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { costumeDistance } from './costume-distance.js';

const pi=Math.PI, tau=2*pi, townStop=7;
const innerRoads=[
  [0,'桜川の渡し','蔵町の市',[0,62],[17,-64]],
  [1,'海風の松原','桜川の渡し',[-149,111],[0,62]],
  [2,'海風の松原','竹隠れの社',[-148,112],[-153,-85]],
  [3,'竹隠れの社','湯けむり峠',[-154,-85],[144,-107]],
  [4,'月見の棚田','湯けむり峠',[156,105],[144,-107]],
];

function stopIndex(road,stop) {
  let nearest=0,least=Infinity;
  for(const [i,[x,z]] of road.points.entries()){
    const distance=(x-stop[0])**2+(z-stop[1])**2;
    if(distance<least){least=distance;nearest=i;}
  }
  return nearest;
}
function itinerary(road,origin,destination,lane,first,last) {
  const points=road.points.slice(first?stopIndex(road,first):0,last?stopIndex(road,last)+1:undefined);
  return {...measureRoute(points),origin,destination,lane,width:road.width};
}
export const MERCHANT_ROUTES=[
  ...innerRoads.map(([road,from,to,first,last])=>itinerary(ROADS[road],from,to,1.12,first,last)),
  ...CONNECTING_ROADS.map((road,i)=>itinerary(road,road.origin,road.destination,
    i<2?1.98:i===2?.68:1.12,
    i===5?[142,-802]:null,i===3?[402,-425]:null)),
];

// Same pace on each road keeps neighbours from overtaking in a narrow pass.
// The two halves of each period already contain the outward and return trips.
export const ROAD_MERCHANTS=MERCHANT_ROUTES.flatMap((route,index)=>{
  const count=Math.max(2,Math.ceil(route.length/110)),speed=.94+(index%4)*.09;
  const period=2*(route.length/speed+townStop);
  return Array.from({length:count},(_,i)=>({
    route,speed,offset:period*((.073+index*.317+i/count)%1),
    costume:2+(index+i)%3,size:.90+.03*((index*3+i)%6),stride:.35+.014*((index+i*3)%5),
  }));
});

export function roadMerchantPose(merchant,time) {
  const {route,offset,speed}=merchant,travel=route.length/speed,leg=travel+townStop;
  const clock=time+offset,p=cartPosition(route,time,speed,offset);
  // At each market the laden traveller pauses, walks a small semicircle
  // into the opposing lane, then pauses again before the return journey.
  let turn=0;
  if(!p.moving){
    const waiting=clock%leg-travel;
    turn=T.MathUtils.smoothstep(waiting,1,townStop-1);
    p.yaw-=pi*(waiting/townStop+turn);
    p.moving=turn>0 && turn<1;
  }
  p.travelled+=(Math.floor(clock/leg)+turn)*pi*route.lane;
  p.x+=Math.cos(p.yaw)*route.lane;
  p.z-=Math.sin(p.yaw)*route.lane;
  return p;
}

const names=['籠を携えた市女餅','風呂敷包みの荷商い餅','薬箱を背負った薬売り餅'];
function makeMerchant(kind){
  const root=new T.Group();root.name=names[kind-2];
  const torso=new T.Group(),head=new T.Group();root.add(torso);torso.add(head);
  head.position.y=1.17;
  head.name='行商餅の首';
  const crown=batchActorParts(head,b=>townHeadwear(b,kind));
  crown.position.y=-1.17;crown.material=scrollPigment();
  const robe=new T.Mesh(ancientClothing(kind),paintedSilk());
  robe.castShadow=robe.receiveShadow=true;torso.add(robe);
  batchActorParts(torso,b=>townBody(b,kind),'手荷物と両の手').material=scrollPigment();
  const left=batchActorParts(root,b=>{
    b.ball(0,.042,.009,.098,.031,.156,'#967a50');  // woven straw sole
    b.ball(0,.092,.003,.075,.043,.119,'#e1d4b4');
    for(const side of [-1,1]){
      b.stroke([[0,.107,.096],[side*.038,.132,.048],[side*.075,.095,.003],
        [side*.071,.068,-.082],[side*.043,.088,-.105]],.011,'#8d7655',12,5);
      b.stroke([[side*.047,.083,-.10],[side*.062,.115,-.063],[side*.025,.142,-.028]],.009,'#b39b70',8,4);
    }
    for(let i=0;i<8;i++){
      const z=-.102+.027*i,edge=.091*Math.sqrt(1-(z/.15)**2);
      b.stroke([[-edge,.044,z],[-edge*.5,.031,z+.011],[0,.027,z],
        [edge*.55,.034,z-.009],[edge,.048,z]],.0038,i%2?'#735e44':'#c6ad7e',7,4);
    }
  },'左の草鞋');
  left.material=scrollPigment();
  const right=left.clone();right.name='右の草鞋';root.add(right);
  return root;
}

export function createRoadMerchants(scene) {
  const company=new T.Group();company.name='村々を往来する行商餅';scene.add(company);
  const distant=costumeDistance(company,ROAD_MERCHANTS.length),templates=new Map();
  const walkers=ROAD_MERCHANTS.map(merchant=>({merchant,costume:merchant.costume,figure:null}));
  return (time,player,camera)=>{
    distant.begin(time,player,camera);
    for(const walker of walkers){
      const {merchant}=walker,p=roadMerchantPose(merchant,time),dx=wrapDelta(p.x-player.x),dz=wrapDelta(p.z-player.z);
      if(walker.figure)walker.figure.visible=false;
      if(dx*dx+dz*dz>140**2)continue;
      const x=player.x+dx,z=player.z+dz,y=groundHeight(p.x,p.z),s=merchant.size;
      const phase=pi*p.travelled/merchant.stride,step=p.moving?Math.sin(phase):0;
      const bob=.028*step**2;
      if(!distant.close(walker,x,y+bob,z,p.yaw,s))continue;
      const kind=merchant.costume;
      if(!walker.figure){
        if(!templates.has(kind))templates.set(kind,makeMerchant(kind));
        walker.figure=templates.get(kind).clone();company.add(walker.figure);
        walker.head=walker.figure.getObjectByName('行商餅の首');
        const face=dressedRiceFace(kind,0,townPortrait(kind));
        face.scale.set(.423,.352,.347);face.position.set(0,.768-1.17,-.011);walker.head.add(face);
      }
      const rig=walker.figure,[torso,left,right]=rig.children;
      rig.visible=true;rig.position.set(x,y,z);rig.rotation.y=p.yaw;rig.scale.setScalar(s);
      torso.position.y=bob;
      torso.rotation.set((kind===3?.075:.023)+.010*step**2,0,.022*step);
      const notice=1-T.MathUtils.smoothstep(Math.hypot(dx,dz),1.5,5.5);
      const glance=T.MathUtils.euclideanModulo(Math.atan2(-dx,-dz)-p.yaw+pi,tau)-pi;
      walker.head.rotation.y=.075*Math.sin(time*.78+merchant.offset)+.36*notice*T.MathUtils.clamp(glance,-1,1);
      for(const [side,foot] of [[-1,left],[1,right]]){
        const swing=side*step,forward=merchant.stride*.48*swing;
        const lateral=side*.175,co=Math.cos(p.yaw),si=Math.sin(p.yaw);
        const floor=groundHeight(p.x+s*(co*lateral+si*forward),p.z+s*(-si*lateral+co*forward));
        foot.position.set(lateral,(floor-y)/s+(p.moving?.079*Math.max(0,side*Math.cos(phase)):0),forward);
        foot.rotation.x=p.moving?.12*side*Math.cos(phase):0;
      }
    }
    distant.end();
  };
}
