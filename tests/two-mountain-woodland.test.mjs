import test from 'node:test';
import assert from 'node:assert/strict';
import {MOUNTAIN_WOODS,woodlandAt,isNishiyamaTree} from '../two/mountain-woodland.js';
import {inMountainStreamClearing} from '../two/mountain-streams.js';
import {CLIFF_PINES,PEACH_TREES} from '../two/pilgrimage-layout.js';
import {TREE_FAMILIES,TREE_FORMS_PER_FAMILY} from '../two/forest-forms.js';
import {DISTRICTS} from '../two/geography.js';
import {terrainHeight,terrainMeshHeight,WATER_Y,TREES} from '../two/terrain.js';
import {inFireMeadow,westRidgeHeight} from '../two/higashiyama.js';
import {reservedScenery} from '../two/retreat-layout.js';
import {inHutYard} from '../two/wayside-hut-layout.js';

test('all watersheds retain groves with space between crowns and fewer new trees at the summit',()=>{
  const trees=[...TREES,...PEACH_TREES,...CLIFF_PINES];
  for(const range of MOUNTAIN_WOODS){
    const present=trees.filter(t=>woodlandAt(t.x,t.z)===range);
    const patches=new Map();
    let lowStems=0,highStems=0,lowArea=0,highArea=0,landArea=0;
    for(const t of present){
      const key=Math.floor(t.x/24)*1024+Math.floor(t.z/24);
      patches.set(key,(patches.get(key)??0)+1);
      if(!t.woodland)continue;
      const ascent=(terrainHeight(t.x,t.z)-range.foot)/(range.crest-range.foot);
      if(ascent<.4)lowStems++;
      if(ascent>.75)highStems++;
    }
    // Area in square metres, excluding sea and adjoining watersheds. Both
    // flowering peaches and evergreens contribute to crowding on a shelf.
    for(let x=range.x-range.rx+3;x<range.x+range.rx;x+=6)
      for(let z=range.z-range.rz+3;z<range.z+range.rz;z+=6){
        if(woodlandAt(x,z)!==range)continue;
        const ground=terrainHeight(x,z);
        if(ground<WATER_Y+.2)continue;
        landArea+=36;
        const ascent=(ground-range.foot)/(range.crest-range.foot);
        if(ascent>=0 && ascent<.4)lowArea+=36;
        if(ascent>.75)highArea+=36;
      }
    const perHectare=present.length*10000/landArea;
    assert.ok(perHectare>25 && perHectare<165,range.id+' trees/ha '+perHectare);
    assert.ok(Math.max(...patches.values())<=22,range.id+' overcrowded patch');
    assert.ok(lowArea && highArea && lowStems/lowArea>highStems/highArea,range.id+' new timberline');
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

test('Kyoto retains its open foothills on both ceremonial sightlines',()=>{
  for(const east of [true,false]){
    const inView=TREES.filter(t=>{
      const dx=t.x-DISTRICTS.kyo.x,dz=t.z-DISTRICTS.kyo.z;
      const depth=east?dx:-dz,side=east?dz:dx;
      return depth>120 && depth<170 && Math.abs(side)<12;
    });
    assert.ok(inView.length<=8,'open grass on the approach beneath the fires');
  }
});
