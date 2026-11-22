import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbientContacts } from '../two/ambient-contacts.js';
import { horsePose, CARRIAGES, OX_HITCH, merchantPose } from '../two/traveller-positions.js';
import { cartPosition } from '../two/trade-routes.js';
import { WEDDING_SITES, weddingWalkerPose } from '../two/pilgrimage-layout.js';
import { QUAY_MERCHANTS } from '../two/seaport-layout.js';
import { terrainHeight } from '../two/terrain.js';

test('non-delivery cast occupies the same route, height and facing as their scene models',()=>{
  const probe=createAmbientContacts(), looker={x:0,z:62,h:0,kyoClockOffset:0};
  for(const time of [0,17,133]){
    const trip=CARRIAGES[0],cart=cartPosition(trip.route,time,trip.speed,trip.offset),ox={
      x:cart.x+OX_HITCH*Math.sin(cart.yaw),z:cart.z+OX_HITCH*Math.cos(cart.yaw),
    };
    const fixtures=[horsePose(time),cart,ox,merchantPose(1,time),...QUAY_MERCHANTS,
      ...WEDDING_SITES.map((_,i)=>weddingWalkerPose(i,2,time))];
    for(const q of fixtures){
      const y=q.y??terrainHeight(q.x,q.z);
      assert.ok(probe(q.x,q.z,y+.2,1.25,.35,time,looker),'body at '+[q.x,q.z]);
      assert.equal(probe(q.x,q.z,y+7,1,.15,time,looker),false);
    }
  }
});

test('a dockhand overlap reports decreasing depth all the way to free space',()=>{
  const hit=createAmbientContacts(),q=QUAY_MERCHANTS[0];
  const player={x:q.x,z:q.z,h:0,kyoClockOffset:0};
  const at=d=>hit(q.x+d*Math.cos(q.yaw),q.z-d*Math.sin(q.yaw),q.y+.1,1,.29,22,player,true);
  assert.ok(at(.18)>at(.32) && at(.32)>at(.46));
  assert.equal(at(.72),0);
});
