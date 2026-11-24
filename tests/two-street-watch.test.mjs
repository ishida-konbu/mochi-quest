import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../two/geography.js';
import { watchClock } from '../two/kyo-layout.js';
import { WORLD_DAY_SECONDS, SECONDS_PER_MINUTE, DAY_MINUTES, worldNight } from '../two/world-clock.js';
import { STREET_BEATS,streetWatchPose } from '../two/street-watch-layout.js';
import { terrainHeight,groundHeight,solidHeightAt } from '../two/terrain.js';
import { COURT } from '../two/retreat-layout.js';
import { watchPose } from '../two/court-patrol.js';
import { watchFooting } from '../two/watch-footing.js';

test('each Kyoto quarter keeps a day watch and lights both street braziers by hand at dusk',()=>{
  const {x,z}=DISTRICTS.kyo,quadrants=new Set(),times=new Set();
  let central=false;
  for(const beat of STREET_BEATS){
    const {home,hearths,ignition}=beat;
    quadrants.add([Math.sign(home.x-x),Math.sign(home.z-z)].join());
    if(Math.hypot(home.x-x,home.z-z)<12)central=true;
    const day=streetWatchPose(0,beat);
    assert.deepEqual([day.x,day.z,day.walk,day.first,day.second,day.taper],[home.x,home.z,0,0,0,0]);
    const minute=t=>(720+t/SECONDS_PER_MINUTE)%DAY_MINUTES;
    assert.ok(worldNight(minute(ignition[0]))>.8);
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
    const midnight=streetWatchPose(WORLD_DAY_SECONDS/2,beat),morning=streetWatchPose(WORLD_DAY_SECONDS*.81,beat);
    assert.deepEqual([midnight.first,midnight.second],[1,1]);
    assert.deepEqual([morning.first,morning.second,morning.x,morning.z],[0,0,home.x,home.z]);
    const time=ignition[1]+.25;
    const watch=watchClock(72,{worldMinute:minute(time)});
    assert.ok(Math.abs(watch-time)<1e-9);
    const next=streetWatchPose(time+WORLD_DAY_SECONDS,beat),same=streetWatchPose(time,beat);
    for(const key of Object.keys(next))assert.ok(Math.abs(next[key]-same[key])<1e-9);
  }
  assert.equal(quadrants.size,4);assert.ok(central);assert.ok(times.size>=10);
});

test('every night-watch route clears walls and fire baskets at walking speed',()=>{
  for(const beat of STREET_BEATS){
    let prev=streetWatchPose(0,beat);
    for(let t=.25;t<WORLD_DAY_SECONDS;t+=.25){
      const q=streetWatchPose(t,beat),floor=terrainHeight(q.x,q.z);
      const label=beat.name+' at '+t;
      assert.ok(Number.isFinite(q.yaw) && Number.isFinite(q.walk),label);
      assert.ok(Math.hypot(q.x-prev.x,q.z-prev.z)<.37,label);
      assert.ok(solidHeightAt(q.x,q.z,.26,floor)<floor+.25,label);
      prev=q;
    }
  }
});

test('the sandals hold their planted footprint and clear every tread on entering and leaving the court',()=>{
  const base=terrainHeight(COURT.x,COURT.z);
  const floor=(x,z)=>groundHeight(COURT.x+x,COURT.z+z,base+1.09)-base;
  for(let i=0;i<2;i++){
    const feet=watchFooting((t,q)=>watchPose(t,i,q),floor);
    for(const start of [WORLD_DAY_SECONDS*.22-1,WORLD_DAY_SECONDS*.75-7]){
      let previous;
      for(let frame=0;frame<38*60;frame++){
        const t=start+frame/60, pair=feet(t,i);
        const middle=(pair[0].ground+pair[1].ground)*.5;
        if(previous){
          assert.ok(Math.abs(middle-previous.middle)<.018,'torso rises a step continuously');
          assert.ok(pair.some((f,k)=>Math.hypot(f.x-previous.pair[k].x,f.z-previous.pair[k].z)<.001),'one sole bears weight');
        }
        for(const f of pair)assert.ok(f.y+1e-6>=floor(f.x,f.z),'sandals clear the tread');
        previous={middle,pair:pair.map(f=>({...f}))};
      }
    }
  }
});
