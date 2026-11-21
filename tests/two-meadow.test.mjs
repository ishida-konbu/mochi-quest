import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { WATER_Y, BOUND } from '../two/terrain.js';
import { meadowExclusions, visitMeadowTile, MEADOW_TILES, MEADOW_TILE } from '../two/meadow-layout.js';

test('the seeded meadows reach the density target while leaving water and the bath clear',()=>{
  const masks=meadowExclusions(createGame().state.objects), forms=new Set();
  let total=0;
  for(let i=0;i<MEADOW_TILES;i++)for(let j=0;j<MEADOW_TILES;j++){
    total+=visitMeadowTile(i,j,masks,(x,y,z,w,h,a,form)=>{
      assert.ok(y>WATER_Y);
      assert.ok((x-143)**2+(z-96)**2>=25);
      assert.ok(x>=i*MEADOW_TILE-BOUND && x<(i+1)*MEADOW_TILE-BOUND);
      assert.ok(z>=j*MEADOW_TILE-BOUND && z<(j+1)*MEADOW_TILE-BOUND);
      forms.add(form);
    });
  }
  const earlierRoots=7667;
  assert.ok(total+earlierRoots>=earlierRoots*49 && total+earlierRoots<=earlierRoots*51);
  assert.equal(forms.size,60);
  const sample=()=>{const roots=[];visitMeadowTile(16,18,masks,(...p)=>roots.push(p));return roots;};
  assert.deepEqual(sample(),sample());
});
