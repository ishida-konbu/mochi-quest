import test from 'node:test';
import assert from 'node:assert/strict';
import { MERCHANT_ROUTES, ROAD_MERCHANTS, roadMerchantPose } from '../two/road-merchants.js';
import { cartPosition } from '../two/trade-routes.js';
import { bridgeAt, bridgeHeight, solidHeightAt, terrainHeight, waterDepth } from '../two/terrain.js';

test('each inter-village road carries staggered trading journeys in both directions',()=>{
  assert.equal(MERCHANT_ROUTES.length,11);
  assert.equal(ROAD_MERCHANTS.length,51);
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

test('the entire trading circuit keeps the loads clear of water, scenery and bridge edges',()=>{
  let crossings=0;
  for(const route of MERCHANT_ROUTES){
    const traveller={...ROAD_MERCHANTS.find(m=>m.route===route),offset:0};
    for(let t=0;t<=2*(route.length/traveller.speed+7);t+=.42){
      const {x,z}=roadMerchantPose(traveller,t);
      const bridge=bridgeAt(x,z),floor=bridge?bridgeHeight(bridge,z):terrainHeight(x,z);
      const where=route.origin+'―'+route.destination+' at '+[x,z].map(Math.round);
      const centre=cartPosition(route,t,traveller.speed);
      assert.ok(Math.hypot(x-centre.x,z-centre.z)<route.width/2,where);
      assert.ok(waterDepth(x,z)<.08||bridge,where);
      if(bridge){crossings++;assert.ok(Math.abs(x-bridge.x)+.55<bridge.halfWidth,where);}
      assert.ok(solidHeightAt(x,z,.57,floor)<=floor+.24,where);
    }
  }
  assert.ok(crossings>100);
});
