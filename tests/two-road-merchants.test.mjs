import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCityWalkers } from '../two/city-walkers.js';
import { DISTRICTS, wrapWorld } from '../two/geography.js';
import { INARI_ROUTE } from '../two/pilgrimage-layout.js';
import { QUAY_MERCHANTS } from '../two/seaport-layout.js';
import { FLEET, SEAWAYS, vesselPose } from '../two/ocean-voyage.js';
import { merchantPosition } from '../two/traveller-positions.js';
import { MERCHANT_ROUTES, ROAD_MERCHANTS, roadMerchantPose } from '../two/road-merchant-routes.js';
import { createAmbientContacts } from '../two/ambient-contacts.js';
import { cartPosition } from '../two/trade-routes.js';
import { bridgeAt, bridgeHeight, groundHeight, roadSurfaceHeight, solidHeightAt, waterDepth } from '../two/terrain.js';

test('each inter-village road carries staggered trading journeys in both directions',()=>{
  assert.equal(MERCHANT_ROUTES.length,9);
  assert.equal(ROAD_MERCHANTS.length,37);
  assert.equal(new Set(ROAD_MERCHANTS.map(m=>m.costume)).size,3);
  for(const route of MERCHANT_ROUTES){
    const walkers=ROAD_MERCHANTS.filter(m=>m.route===route);
    assert.ok(walkers.length>=2);
    const {speed}=walkers[0],half=route.length/speed+7;
    const phases=walkers.map(w=>w.offset).sort((a,b)=>a-b);
    for(let i=0;i<phases.length;i++){
      const next=phases[i+1]??phases[0]+2*half;
      assert.ok(Math.abs(next-phases[i]-2*half/phases.length)<1e-8,route.origin);
    }
    const traveller={...walkers[0],offset:0};
    const first=roadMerchantPose(traveller,0),outward=roadMerchantPose(traveller,half*.45);
    const returning=roadMerchantPose(traveller,half+route.length/speed-half*.45);
    assert.ok(Math.abs(outward.distance-returning.distance)<1e-8);
    assert.ok(Math.abs(Math.hypot(outward.x-returning.x,outward.z-returning.z)-2*route.lane)<1e-8);
    const pause=roadMerchantPose(traveller,half-.7);
    const still=roadMerchantPose(traveller,half-.2);
    assert.equal(pause.moving,false);
    assert.ok(Math.hypot(pause.x-still.x,pause.z-still.z)<1e-8);
    const turn=roadMerchantPose(traveller,half-3.6),next=roadMerchantPose(traveller,half-3.4);
    assert.ok(turn.moving && (next.x-turn.x)*Math.sin(turn.yaw)+(next.z-turn.z)*Math.cos(turn.yaw)>0);
    const back=roadMerchantPose(traveller,2*half);
    assert.ok(Math.hypot(back.x-first.x,back.z-first.z)<1e-8);
  }
});

test('merchants keep well away from the peach valley, the sea palace and the entire line of torii',()=>{
  // Keep a full distant-figure draw radius beyond the orchard, palace and
  // gates. Include the road shoulder, turning walkers and the ends of hulls.
  const sites=[
    [DISTRICTS.peach.x,DISTRICTS.peach.z,275],
    [DISTRICTS.ryugu.x,DISTRICTS.ryugu.z,180],
    ...INARI_ROUTE.map(([x,z])=>[x,z,140]),
  ];
  function clear(x,z,margin,label){
    for(const [cx,cz,r] of sites){
      const dx=wrapWorld(x-cx), dz=wrapWorld(z-cz), minimum=r+margin;
      if(Math.abs(dx)<minimum && Math.abs(dz)<minimum)
        assert.ok(dx*dx+dz*dz>minimum*minimum,label+' at '+[x,z]);
    }
  }
  for(const r of MERCHANT_ROUTES)
    for(const [x,z] of r.points)clear(x,z,r.lane+2,r.destination);
  const marketStreets=new Set(makeCityWalkers().filter(w=>w.costume>=2).map(w=>w.route));
  for(const street of marketStreets)
    for(const {x,z} of street.getSpacedPoints(128))clear(x,z,2,'Kyoto street market');
  for(const r of SEAWAYS)
    for(const [x,z] of r.points)clear(x,z,18,r.id);
  for(const ship of FLEET.filter(s=>s.moored)){
    const {x,z}=vesselPose(ship,0);
    clear(x,z,18,ship.id);
  }
  for(const hand of QUAY_MERCHANTS)clear(hand.x,hand.z,1,hand.name);
  for(let i=0;i<3;i++){
    const period=2*Math.PI/(i===2?.04:.021);
    for(let t=0;t<period;t+=.5){
      const {x,z}=merchantPosition(i,t);
      clear(x,z,4,'market boat '+i);
    }
  }
});

test('the entire trading circuit keeps the loads clear of water, scenery and bridge edges',()=>{
  let crossings=0;
  for(const route of MERCHANT_ROUTES){
    const traveller={...ROAD_MERCHANTS.find(m=>m.route===route),offset:0};
    for(let t=0;t<=2*(route.length/traveller.speed+7);t+=.42){
      const {x,z}=roadMerchantPose(traveller,t);
      const bridge=bridgeAt(x,z),floor=bridge?bridgeHeight(bridge,z):roadSurfaceHeight(x,z);
      const where=route.origin+'―'+route.destination+' at '+[x,z].map(Math.round);
      const centre=cartPosition(route,t,traveller.speed);
      assert.ok(Math.hypot(x-centre.x,z-centre.z)<route.width/2,where);
      assert.ok(Math.abs(groundHeight(x,z)-floor)<.18,where);
      assert.ok(waterDepth(x,z)<.08||bridge,where);
      if(bridge){crossings++;assert.ok(Math.abs(x-bridge.x)+.55<bridge.halfWidth,where);}
      // At a step the load can overhang the next tread while the feet
      // still belong to the lower one. Compare with its surveyed top.
      const adjacent=bridge?floor:Math.max(floor,roadSurfaceHeight(x-.57,z),
        roadSurfaceHeight(x+.57,z),roadSurfaceHeight(x,z-.57),roadSurfaceHeight(x,z+.57));
      assert.ok(solidHeightAt(x,z,.57,floor)<=adjacent+.24,where);
    }
  }
  assert.ok(crossings>100);
});

test('the contact solver follows all road traders and the goods they actually carry',()=>{
  const hit=createAmbientContacts(),player={x:0,z:0,h:0,kyoClockOffset:0};
  for(const time of [1.2,73,201.5])for(const trader of ROAD_MERCHANTS){
    const q=roadMerchantPose(trader,time),y=groundHeight(q.x,q.z);
    assert.ok(hit(q.x,q.z,y+.3,1,.16,time,player,true)>0);
    assert.equal(hit(q.x,q.z,y+7,.3,.16,time,player,true),0);
  }
  // Check each load on the northern harbour road, clear of the other actors.
  const pass=MERCHANT_ROUTES.find(route=>route.destination==='敦賀');
  for(const [kind,u,v] of [[2,.24,.675],[3,.05,-.651],[4,.07,-.532]]){
    const trader=ROAD_MERCHANTS.find(m=>m.route===pass && m.costume===kind);
    const leg=pass.length/trader.speed+7,time=(.43*pass.length/trader.speed-trader.offset+2*leg)%(2*leg);
    const q=roadMerchantPose(trader,time),y=groundHeight(q.x,q.z),c=Math.cos(q.yaw),s=Math.sin(q.yaw);
    const x=q.x+(u*c+v*s)*trader.size,z=q.z+(v*c-u*s)*trader.size;
    assert.ok(hit(x,z,y+.74*trader.size,.065,.014,time,player,true)>0,kind);
    assert.equal(hit(x,z,y+.18*trader.size,.085,.014,time,player,true),0,kind);
  }
});

test('merchant contacts on a bridge stay above the water passage beneath the deck',()=>{
  const hit=createAmbientContacts(),trader=ROAD_MERCHANTS[0],player={x:0,z:0,h:0,kyoClockOffset:0};
  let samples=0;
  for(let t=0;t<2*(trader.route.length/trader.speed+7);t+=2){
    const q=roadMerchantPose(trader,t),bridge=bridgeAt(q.x,q.z);
    if(!bridge||waterDepth(q.x,q.z)<1)continue;
    const floor=bridgeHeight(bridge,q.z);
    assert.ok(hit(q.x,q.z,floor+.13,.8,.12,t,player));
    assert.equal(hit(q.x,q.z,floor-.9,.3,.12,t,player),false);
    samples++;
  }
  assert.ok(samples>=10);
});
