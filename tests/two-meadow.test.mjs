import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { WATER_Y, BOUND, shoreDistance } from '../two/terrain.js';
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
      if(Math.max(Math.abs(x),Math.abs(z))>416) outer++;
    });
  }
  const earlierRoots=7667;
  assert.ok(total-outer >= earlierRoots*48);
  // The enlarged country roads keep the original meadow density. Tiles
  // stream near the traveller, irrespective of the total planting count.
  assert.ok(outer>650000);
  assert.ok(outer/outlyingLand>440 && outer/outlyingLand<670,'root density per outlying land tile');
  assert.ok(Math.abs(MEADOW_TILES*MEADOW_TILE-2*BOUND)<1e-8);
  assert.equal(forms.size,60);
  const sample=()=>{const roots=[];visitMeadowTile(16,18,masks,(...p)=>roots.push(p));return roots;};
  assert.deepEqual(sample(),sample());
});
