import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { WATER_Y, BOUND, shoreDistance, terrainMeshHeight } from '../two/terrain.js';
import { FIRE_TRAILS, fireTrailDistance, inFireMeadow } from '../two/higashiyama.js';
import { HERBS, HERB_FORMS } from '../two/meadow-herbs.js';
import { meadowExclusions, visitMeadowTile, MEADOW_TILES, MEADOW_TILE } from '../two/meadow-layout.js';

test('meadows alternate open ground with dense colonies throughout the island',()=>{
  const {state}=createGame(), masks=meadowExclusions(state.objects,state.npcs), forms=new Set();
  let total=0, outer=0, outlyingLand=0;
  let patches=0, open=0, dense=0;
  const rootsPerPatch=new Uint16Array(25);
  for(let i=0;i<MEADOW_TILES;i++)for(let j=0;j<MEADOW_TILES;j++){
    const x=(i+.5)*MEADOW_TILE-BOUND,z=(j+.5)*MEADOW_TILE-BOUND;
    if(Math.max(Math.abs(x),Math.abs(z))>416 && shoreDistance(x,z)>8)outlyingLand++;
    rootsPerPatch.fill(0);
    const planted=visitMeadowTile(i,j,masks,(x,y,z,w,h,a,form)=>{
      assert.ok(y>WATER_Y);
      assert.ok((x-143)**2+(z-96)**2>=25);
      assert.ok(x>=i*MEADOW_TILE-BOUND && x<(i+1)*MEADOW_TILE-BOUND);
      assert.ok(z>=j*MEADOW_TILE-BOUND && z<(j+1)*MEADOW_TILE-BOUND);
      const col=Math.floor(((x+BOUND)/MEADOW_TILE-i)*5);
      const row=Math.floor(((z+BOUND)/MEADOW_TILE-j)*5);
      rootsPerPatch[row*5+col]++;
      forms.add(form);
      if(form>=(HERBS.length-1)*HERB_FORMS)assert.ok(shoreDistance(x,z)<27,'beach morning glory grows on the shore');
      if(Math.max(Math.abs(x),Math.abs(z))>416) outer++;
    });
    total+=planted;
    if(planted && shoreDistance(x,z)>20)for(const roots of rootsPerPatch){
      patches++;
      if(roots<=3)open++;
      if(roots>=17)dense++;
    }
  }
  // In roughly five-metre squares, both a handful of stems and a thicket
  // should be common sights, even far from the district centres.
  assert.ok(open/patches>.17 && dense/patches>.23);
  assert.ok(total-outer>180000 && outer/outlyingLand>240 && outer/outlyingLand<420);
  assert.ok(Math.abs(MEADOW_TILES*MEADOW_TILE-2*BOUND)<1e-8);
  assert.equal(forms.size,HERBS.length*HERB_FORMS);
  const sample=()=>{
    const roots=[],i=Math.floor((45+BOUND)/MEADOW_TILE),j=Math.floor((46+BOUND)/MEADOW_TILE);
    visitMeadowTile(i,j,masks,(...plant)=>roots.push(plant));
    return roots;
  };
  const roots=sample();
  assert.ok(roots.length>100);
  for(const [x,y,z] of roots)assert.ok(Math.abs(y+.022-terrainMeshHeight(x,z))<1e-7);
  assert.deepEqual(roots,sample());
});

test('the mountain paths keep a worn tread and the firebanks stay mown',()=>{
  const masks=meadowExclusions([]);
  for(const trail of Object.values(FIRE_TRAILS)){
    const tiles=new Map();
    for(const [x,z] of trail){
      const i=Math.floor((x+BOUND)/MEADOW_TILE),j=Math.floor((z+BOUND)/MEADOW_TILE);
      tiles.set(i*MEADOW_TILES+j,[i,j]);
    }
    let bankPlants=0;
    for(const [i,j] of tiles.values())visitMeadowTile(i,j,masks,(x,y,z,width)=>{
      assert.ok(!inFireMeadow(x,z));
      const distance=fireTrailDistance(x,z);
      assert.ok(distance>=.54+width*.25);
      if(distance<2)bankPlants++;
    });
    assert.ok(bankPlants>20,'the narrow path retains planted edges');
  }
});
