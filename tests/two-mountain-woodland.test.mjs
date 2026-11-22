import test from 'node:test';
import assert from 'node:assert/strict';
import {MOUNTAIN_WOODS,woodlandAt} from '../two/mountain-woodland.js';
import {inMountainStreamClearing} from '../two/mountain-streams.js';
import {CLIFF_PINES,PEACH_TREES} from '../two/pilgrimage-layout.js';
import {TREE_FAMILIES} from '../two/forest-forms.js';
import {terrainHeight,terrainMeshHeight,TREES} from '../two/terrain.js';
import {inFireMeadow} from '../two/higashiyama.js';
import {reservedScenery} from '../two/retreat-layout.js';
import {inHutYard} from '../two/wayside-hut-layout.js';

test('each mountain gains two to three times its stand including orchard and cliff trees, thickest at the foot',()=>{
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
    assert.ok(s.lower.includes(family)||s.upper.includes(family));
    assert.ok(!inMountainStreamClearing(t.x,t.z) && !inFireMeadow(t.x,t.z));
    assert.ok(!reservedScenery(t.x,t.z) && !inHutYard(t.x,t.z));
    assert.ok(Math.abs(terrainMeshHeight(t.x,t.z)-terrainHeight(t.x,t.z))<=.14);
  }
});
