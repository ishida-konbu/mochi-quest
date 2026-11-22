import test from 'node:test';
import assert from 'node:assert/strict';
import { inariWeatherAt, visitInariShowers } from '../two/inari-weather.js';
import { INARI_SANCTUARY, WEDDING_SITES, inariPoint } from '../two/pilgrimage-layout.js';
import { DISTRICTS, WORLD_BOUND } from '../two/geography.js';
import { REGIONS, regionAt } from '../two/terrain.js';

test('the mountain, woodland and outer Inari district each receive moving bursts between clear spells',()=>{
  const sites = [inariPoint(0),inariPoint(.55),INARI_SANCTUARY,
    {x:275,z:-594},{x:531,z:-589},{x:1100,z:-500}];
  for(const seed of [7343,12345]) for(const {x,z} of sites) {
    assert.equal(REGIONS[regionAt(x,z)].id,'inari');
    let strong=0,clear=0,passes=0,lull=0,longestLull=0;
    const sample={};
    for(let t=0;t<1200;t+=2) {
      const {downpour,rain}=inariWeatherAt(x,z,t,seed,sample);
      assert.ok(rain>=downpour && rain<=1);
      if(downpour>.68) {
        if(lull>0)passes++;
        strong++;lull=0;
      } else {
        lull+=2;longestLull=Math.max(longestLull,lull);
      }
      if(downpour<.04)clear++;
    }
    assert.ok(passes>=8 && strong>=50,'repeated downpours at '+x+','+z);
    assert.ok(clear>80 && longestLull<245,'sunny intervals and returning rain at '+x+','+z);
  }
});

test('a shower moves through the world independently of the observer and agrees with its distant curtain',()=>{
  const {x,z}=INARI_SANCTUARY,seed=574122,t=80;
  const capture=time=>{
    const passes=[];
    visitInariShowers(x,z,time,seed,130,p=>passes.push({
      id:p.id,x:p.x,z:p.z,radius:p.radius,strength:p.strength,
    }));
    return passes;
  };
  const first=capture(t), later=capture(t+1);
  const pass=first.find(p=>p.strength>.85 && later.some(q=>p.id===q.id));
  assert.ok(pass);
  const next=later.find(p=>p.id===pass.id);
  assert.ok(Math.hypot(next.x-pass.x,next.z-pass.z)>1);
  assert.ok(inariWeatherAt(pass.x,pass.z,t,seed).downpour>=pass.strength-.0001);
  const local=inariWeatherAt(x,z,t,seed);
  inariWeatherAt(x,z,t+5000,seed);
  inariWeatherAt(x,z,t,seed+1);
  assert.deepEqual(inariWeatherAt(x,z,t,seed),local);
  assert.deepEqual(inariWeatherAt(x+WORLD_BOUND*2,z,t,seed),local);
  assert.deepEqual(capture(t),first);
  const positions=[];
  visitInariShowers(x,z,t,seed+1,130,p=>positions.push([p.x,p.z]));
  assert.notDeepEqual(positions,first.map(p=>[p.x,p.z]));
});

test('wedding showers persist locally and independent thunderstorms stay inside the district',()=>{
  const scratch={};
  for(let t=0;t<240;t+=3) {
    for(const site of WEDDING_SITES)assert.ok(inariWeatherAt(site.x,site.z,t,81,scratch).rain>=.35);
    for(const {x,z} of [DISTRICTS.kyo,DISTRICTS.peach,{x:0,z:59}]) {
      const {rain,thunder,thunderId}=inariWeatherAt(x,z,t,81,scratch);
      assert.equal(rain,0);assert.equal(thunder,0);assert.equal(thunderId,-1);
    }
  }
});

test('a thunderclap has a single source and arrives later and more softly along the same mountainside',()=>{
  const {x,z}=INARI_SANCTUARY, seed=7343;
  for(let t=0;t<480;t+=.25) {
    const heard=inariWeatherAt(x,z,t,seed);
    if(heard.thunder<.4 || Math.hypot(heard.thunderX-x,heard.thunderZ-z)<45)continue;
    const close=inariWeatherAt(heard.thunderX,heard.thunderZ,t,seed);
    if(close.thunderId!==heard.thunderId)continue;
    assert.ok(heard.thunderAt<=t && heard.thunderAt>close.thunderAt+.05);
    assert.ok(close.thunder>heard.thunder);
    assert.notEqual(inariWeatherAt(x,z,heard.thunderAt-.01,seed).thunderId,heard.thunderId);
    assert.notEqual(inariWeatherAt(x,z,heard.thunderAt+1.7,seed).thunderId,heard.thunderId);
    return;
  }
  assert.fail('no thunderclap crossed both listeners');
});
