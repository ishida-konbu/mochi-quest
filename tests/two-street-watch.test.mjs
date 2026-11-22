import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../two/geography.js';
import { kyoClock,kyoNight,KYO_DAY_SECONDS } from '../two/kyo-layout.js';
import { STREET_BEATS,streetWatchPose } from '../two/street-watch-layout.js';
import { terrainHeight,solidHeightAt } from '../two/terrain.js';

test('each Kyoto quarter keeps a day watch and lights both street braziers by hand at dusk',()=>{
  const {x,z}=DISTRICTS.kyo,quadrants=new Set(),times=new Set();
  let central=false;
  for(const beat of STREET_BEATS){
    const {home,hearths,ignition}=beat;
    quadrants.add([Math.sign(home.x-x),Math.sign(home.z-z)].join());
    if(Math.hypot(home.x-x,home.z-z)<12)central=true;
    const day=streetWatchPose(0,beat);
    assert.deepEqual([day.x,day.z,day.walk,day.first,day.second,day.taper],[home.x,home.z,0,0,0,0]);
    assert.ok(kyoNight(ignition[0])>.8);
    assert.ok(ignition[1]-ignition[0]>16);
    for(const [j,t] of ignition.entries()){
      const name=j?'second':'first',q=streetWatchPose(t+.25,beat),hearth=hearths[j];
      times.add(Math.round(t));
      assert.equal(streetWatchPose(t-.1,beat)[name],0);
      assert.ok(q[name]>0 && q[name]<1);
      assert.equal(q.reach,1);assert.equal(q.taper,1);
      // The right hand extends forward at the lowered shoulder.
      const tipX=q.x+.35*Math.cos(q.yaw)+.88*Math.sin(q.yaw);
      const tipZ=q.z-.35*Math.sin(q.yaw)+.88*Math.cos(q.yaw);
      assert.ok(Math.hypot(tipX-hearth.x,tipZ-hearth.z)<.14);
      assert.ok(solidHeightAt(hearth.x,hearth.z)>terrainHeight(hearth.x,hearth.z)+1.48);
    }
    const midnight=streetWatchPose(KYO_DAY_SECONDS/2,beat),morning=streetWatchPose(KYO_DAY_SECONDS*.81,beat);
    assert.deepEqual([midnight.first,midnight.second],[1,1]);
    assert.deepEqual([morning.first,morning.second,morning.x,morning.z],[0,0,home.x,home.z]);
    const time=ignition[1]+.25;
    assert.deepEqual(streetWatchPose(kyoClock(time-72,{kyoClockOffset:72}),beat),streetWatchPose(time,beat));
    const next=streetWatchPose(time+KYO_DAY_SECONDS,beat),same=streetWatchPose(time,beat);
    for(const key of Object.keys(next))assert.ok(Math.abs(next[key]-same[key])<1e-9);
  }
  assert.equal(quadrants.size,4);assert.ok(central);assert.ok(times.size>=10);
});

test('every night-watch route clears walls and fire baskets at walking speed',()=>{
  for(const beat of STREET_BEATS){
    let prev=streetWatchPose(0,beat);
    for(let t=.25;t<KYO_DAY_SECONDS;t+=.25){
      const q=streetWatchPose(t,beat),floor=terrainHeight(q.x,q.z);
      const label=beat.name+' at '+t;
      assert.ok(Number.isFinite(q.yaw) && Number.isFinite(q.walk),label);
      assert.ok(Math.hypot(q.x-prev.x,q.z-prev.z)<.37,label);
      assert.ok(solidHeightAt(q.x,q.z,.26,floor)<floor+.25,label);
      prev=q;
    }
  }
});
