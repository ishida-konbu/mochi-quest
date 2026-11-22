import * as T from './vendor/three.module.min.js';
import { groundHeight, wrapDelta } from './terrain.js';
import { MAX_MERCHANT_SHOULDER, ROAD_MERCHANTS, roadMerchantPose } from './road-merchant-routes.js';
export { MERCHANT_ROUTES, ROAD_MERCHANTS, roadMerchantPose } from './road-merchant-routes.js';
import { batchActorParts } from './actors.js';
import { ancientClothing, townBody, townHeadwear } from './heian-dress.js';
import { paintedSilk, townPortrait } from './emaki-costume.js';
import { dressedRiceFace } from './mochi-model.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { costumeDistance } from './costume-distance.js';

const pi=Math.PI, tau=2*pi;

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
  const drawRadius=140;
  const walkers=ROAD_MERCHANTS.map(merchant=>{
    // Reject a whole itinerary before locating the walker on its arc-length
    // table. Include the shoulder and the turnaround at both ends.
    const {west,east,north,south}=merchant.route.bounds;
    const pad=drawRadius+MAX_MERCHANT_SHOULDER;
    return {merchant,costume:merchant.costume,figure:null,
      cx:(west+east)/2,cz:(north+south)/2,rx:(east-west)/2+pad,rz:(south-north)/2+pad};
  });
  return (time,player,camera)=>{
    distant.begin(time,player,camera);
    for(const walker of walkers){
      if(walker.figure)walker.figure.visible=false;
      if(Math.abs(wrapDelta(player.x-walker.cx))>walker.rx || Math.abs(wrapDelta(player.z-walker.cz))>walker.rz)continue;
      const {merchant}=walker,p=roadMerchantPose(merchant,time),dx=wrapDelta(p.x-player.x),dz=wrapDelta(p.z-player.z);
      if(dx*dx+dz*dz>drawRadius*drawRadius)continue;
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
