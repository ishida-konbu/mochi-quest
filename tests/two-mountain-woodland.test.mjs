import test from 'node:test';
import assert from 'node:assert/strict';
import {MOUNTAIN_WOODS,woodlandAt,isNishiyamaTree} from '../two/mountain-woodland.js';
import {inMountainStreamClearing} from '../two/mountain-streams.js';
import {CLIFF_PINES,PEACH_TREES} from '../two/pilgrimage-layout.js';
import {TREE_FAMILIES,TREE_FORMS_PER_FAMILY} from '../two/forest-forms.js';
import {DISTRICTS} from '../two/geography.js';
import {terrainHeight,terrainMeshHeight,TREES} from '../two/terrain.js';
import {inFireMeadow,eastRidgeHeight,northRidgeHeight,westRidgeHeight} from '../two/higashiyama.js';
import {reservedScenery} from '../two/retreat-layout.js';
import {inHutYard} from '../two/wayside-hut-layout.js';

test('the established mountain woods persist across the islands, thickest at the foot',()=>{
  const trees=[...TREES,...PEACH_TREES,...CLIFF_PINES];
  for(const range of MOUNTAIN_WOODS){
    const present=trees.filter(t=>woodlandAt(t.x,t.z)===range);
    const before=present.filter(t=>!t.woodland);
    const factor=present.length/before.length;
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
  const additions=TREES.filter(t=>t.woodland);
  for(const t of additions){
    const s=woodlandAt(t.x,t.z);
    const family=Math.floor(t.form/4);
    assert.equal(s.id,t.woodland);assert.equal(TREE_FAMILIES[family][0],t.kind);
    if(t.kind==='moso')assert.equal(s.id,'nishi');
    else assert.ok(s.lower.includes(family)||s.upper.includes(family));
    assert.ok(!inMountainStreamClearing(t.x,t.z) && !inFireMeadow(t.x,t.z));
    assert.ok(!reservedScenery(t.x,t.z) && !inHutYard(t.x,t.z));
    assert.ok(Math.abs(terrainMeshHeight(t.x,t.z)-terrainHeight(t.x,t.z))<=.14);
  }
});

test('four fifths of Nishiyama planting sites carry moso bamboo from foot to crest',()=>{
  const west=TREES.filter(isNishiyamaTree),bamboo=west.filter(t=>t.kind==='moso');
  assert.equal(bamboo.length,Math.round(.8*west.length));
  assert.equal(new Set(bamboo.map(t=>t.form)).size,TREE_FORMS_PER_FAMILY);
  for(const t of bamboo){
    assert.equal(TREE_FAMILIES[Math.floor(t.form/TREE_FORMS_PER_FAMILY)][0],'moso');
  }
  for(const [low,high] of [[0,10],[10,65],[65,Infinity]]){
    const band=TREES.filter(t=>{
      const rise=westRidgeHeight(t.x,t.z);
      return rise>Math.max(.5,low) && rise<=high;
    });
    const share=band.filter(t=>t.kind==='moso').length/band.length;
    assert.ok(share>.70 && share<.90,'western slope '+low+'–'+high+': '+share);
  }
});

test('Kyoto retains its open foothills and the tree density of the earlier survey',()=>{
  // Historical census at 74b9b8a. Buildings, firebeds and mountain paths
  // opened later can displace individual trees without changing the density.
  for(const [id,rise,historical] of [
    ['higashi',eastRidgeHeight,3672],['kita',northRidgeHeight,4118],['nishi',westRidgeHeight,2134],
  ]){
    const count=TREES.filter(t=>rise(t.x,t.z)>.5).length;
    assert.ok(count>=.88*historical && count<=1.08*historical,id+' count '+count);
  }
  for(const east of [true,false]){
    const inView=TREES.filter(t=>{
      const dx=t.x-DISTRICTS.kyo.x,dz=t.z-DISTRICTS.kyo.z;
      const depth=east?dx:-dz,side=east?dz:dx;
      return depth>120 && depth<170 && Math.abs(side)<12;
    });
    assert.ok(inView.length<=8,'open grass on the approach beneath the fires');
  }
});
