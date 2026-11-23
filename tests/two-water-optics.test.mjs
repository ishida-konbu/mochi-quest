import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDepthSurvey } from '../two/water-optics.js';
import { WATER_Y, BOUND, terrainHeight, riverZ, wrapDelta } from '../two/terrain.js';

test('surface transmission samples the local river, shore and wrapped sea at their surveyed heights',()=>{
  const survey=createDepthSurvey(), tex=survey.plate;
  for(const [x,z] of [[40,riverZ(40)],[-202,105],[BOUND-2,134],[-BOUND+2,134]]) {
    survey.update(x,z);
    const {width,data}=tex.image, middle=(width-1)/2;
    for(const [i,j] of [[0,0],[3,-2],[-7,9],[19,18],[-20,-20]]) {
      const px=wrapDelta(survey.centre.x+i*2.5), pz=wrapDelta(survey.centre.y+j*2.5);
      const expected=Math.min(16,Math.max(0,WATER_Y-terrainHeight(px,pz)));
      const sampled=data[(middle+j)*width+middle+i]*16/255;
      assert.ok(Math.abs(sampled-expected)<=8/255+.00001);
    }
  }
  const generation=tex.version;
  survey.update(survey.centre.x+1,survey.centre.y-.5);
  assert.equal(tex.version,generation);
});
