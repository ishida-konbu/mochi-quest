import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { WATER_Y, BOUND, shoreDistance, terrainMeshHeight } from '../two/terrain.js';
import { HERBS, HERB_FORMS } from '../two/meadow-herbs.js';
import { meadowExclusions, visitMeadowTile, MEADOW_TILES, MEADOW_TILE } from '../two/meadow-layout.js';

test('the seeded meadows reach the density target while leaving water and the bath clear',()=>{
  const {state}=createGame(), masks=meadowExclusions(state.objects,state.npcs), forms=new Set();
  let total=0, outer=0, outlyingLand=0;
  for(let i=0;i<MEADOW_TILES;i++)for(let j=0;j<MEADOW_TILES;j++){
    const x=(i+.5)*MEADOW_TILE-BOUND,z=(j+.5)*MEADOW_TILE-BOUND;
    if(Math.max(Math.abs(x),Math.abs(z))>416 && shoreDistance(x,z)>8)outlyingLand++;
    total+=visitMeadowTile(i,j,masks,(x,y,z,w,h,a,form)=>{
      assert.ok(y>WATER_Y);
      assert.ok((x-143)**2+(z-96)**2>=25);
      assert.ok(x>=i*MEADOW_TILE-BOUND && x<(i+1)*MEADOW_TILE-BOUND);
      assert.ok(z>=j*MEADOW_TILE-BOUND && z<(j+1)*MEADOW_TILE-BOUND);
      forms.add(form);
      if(form>=(HERBS.length-1)*HERB_FORMS)assert.ok(shoreDistance(x,z)<27,'beach morning glory grows on the shore');
      if(Math.max(Math.abs(x),Math.abs(z))>416) outer++;
    });
  }
  // Only nearby tiles stream in. Check that planting also reaches the outer provinces.
  assert.ok(total-outer>500000);
  assert.ok(outer>1500000);
  assert.ok(outer/outlyingLand>685 && outer/outlyingLand<885,'root density per outlying land tile');
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
