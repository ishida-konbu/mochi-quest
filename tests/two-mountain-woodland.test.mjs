import test from 'node:test';
import assert from 'node:assert/strict';
import {MOUNTAIN_WOODS,woodlandAt} from '../two/mountain-woodland.js';
import {inMountainStreamClearing} from '../two/mountain-streams.js';
import {CLIFF_PINES,PEACH_TREES} from '../two/pilgrimage-layout.js';
import {TREE_FAMILIES} from '../two/forest-forms.js';
import {DISTRICTS} from '../two/geography.js';
import {terrainHeight,terrainMeshHeight,TREES} from '../two/terrain.js';
import {inFireMeadow,fireTrailDistance,eastRidgeHeight,northRidgeHeight,westRidgeHeight} from '../two/higashiyama.js';
import {reservedScenery} from '../two/retreat-layout.js';
import {inHutYard} from '../two/wayside-hut-layout.js';

test('the established mountain woods persist across the islands, thickest at the foot',()=>{
  const trees=[...TREES,...PEACH_TREES,...CLIFF_PINES];
  for(const range of MOUNTAIN_WOODS){
    const present=trees.filter(t=>woodlandAt(t.x,t.z)===range);
    const established=present.filter(t=>!t.kyotoRidge);
    const before=established.filter(t=>!t.woodland);
    const factor=established.length/before.length;
    assert.ok(factor>=2 && factor<=3,range.id+' census '+factor);
    const band=(x,z)=>(terrainHeight(x,z)-range.foot)/(range.crest-range.foot);
    let lowTrees=0,highTrees=0,lowArea=0,highArea=0;
    for(const t of present){
      const climb=band(t.x,t.z);
      if(climb<.40)lowTrees++;
      if(climb>.75)highTrees++;
    }
    // Compare density per square metre rather than just counts: a summit
    // occupies less area than the foot of the same hill.
    for(let x=range.x-range.rx+3;x<range.x+range.rx;x+=6)
      for(let z=range.z-range.rz+3;z<range.z+range.rz;z+=6){
        if(woodlandAt(x,z)!==range)continue;
        const climb=band(x,z);
        if(climb<.40)lowArea+=36;
        if(climb>.75)highArea+=36;
      }
    assert.ok(lowArea && highArea && lowTrees/lowArea>1.2*highTrees/highArea,range.id+' timberline');
  }
});

test('new stems follow their local species, visible footing, stream clearings and ceremonial sightlines',()=>{
  const additions=TREES.filter(t=>t.woodland || t.kyotoRidge);
  for(const t of additions){
    const s=t.kyotoRidge ? MOUNTAIN_WOODS.find(r=>r.id===t.kyotoRidge) : woodlandAt(t.x,t.z);
    const family=Math.floor(t.form/4);
    assert.equal(s.id,t.woodland || t.kyotoRidge);assert.equal(TREE_FAMILIES[family][0],t.kind);
    assert.ok(s.lower.includes(family)||s.upper.includes(family)||t.kyotoRidge && s.coppice.includes(family));
    assert.ok(!inMountainStreamClearing(t.x,t.z) && !inFireMeadow(t.x,t.z));
    assert.ok(!reservedScenery(t.x,t.z) && !inHutYard(t.x,t.z));
    assert.ok(Math.abs(terrainMeshHeight(t.x,t.z)-terrainHeight(t.x,t.z))<=.14);
  }
});

test('all three Kyoto divides gain three to four times their surveyed trees, including the skirts',()=>{
  // The earlier survey (74b9b8a) counts actual trees across each mapped
  // ridge above 0.5 m of local relief, including the toe below 10 m.
  for(const [id,rise,before,beforeToe] of [
    ['higashi',eastRidgeHeight,3672,959],['kita',northRidgeHeight,4118,822],['nishi',westRidgeHeight,2134,496],
  ]){
    let total=0,lower=0;
    for(const t of TREES){
      const relief=rise(t.x,t.z);
      if(relief<=.5)continue;
      total++;
      if(relief<10)lower++;
      if(t.kyotoRidge===id){
        assert.ok(!inFireMeadow(t.x,t.z,2));
        assert.ok(fireTrailDistance(t.x,t.z)>=1.25+t.h*.10);
      }
    }
    assert.ok(total>=3*before && total<=4*before,id+' whole range '+total);
    assert.ok(lower>=3*beforeToe,id+' low skirt '+lower);
  }
});

test('short copses cross the two foothills directly beneath the visible fires',()=>{
  for(const east of [true,false]){
    const heights=[];
    for(const t of TREES){
      const dx=t.x-DISTRICTS.kyo.x,dz=t.z-DISTRICTS.kyo.z;
      const depth=east?dx:-dz,side=east?dz:dx;
      if(depth>120 && depth<170 && Math.abs(side)<12)heights.push(t.h);
    }
    // An otherwise densely planted mountain can still leave an empty strip
    // right under the character as viewed from the central street.
    assert.ok(heights.length>=45);
    assert.ok(heights.filter(h=>h>=3 && h<7).length>=28);
  }
});
