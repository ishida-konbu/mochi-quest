import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLE_MONKS, templeMonkPose } from '../two/temple-duties.js';
import { createAmbientContacts } from '../two/ambient-contacts.js';
import { groundHeight, canOccupy } from '../two/terrain.js';
import { monasticHabit } from '../two/heian-dress.js';

test('each temple duty is performed on a walkable floor with its body at the same elevation',()=>{
  const contact=createAmbientContacts();
  for(const monk of TEMPLE_MONKS)for(let t=0;t<60;t+=.5){
    const p=templeMonkPose(monk,t);
    assert.ok(Math.abs(groundHeight(p.x,p.z,p.y)-p.y)<.02,monk.name);
    assert.ok(canOccupy(p.x,p.z,p.y,.35,1.6),monk.name);
    assert.ok(contact(p.x,p.z,p.y+.3,1,.18,t,p));
    assert.equal(contact(p.x,p.z,p.y+2,1,.18,t,p),false);
  }
});

test('the patchwork kesa follows the town robe at both shoulders and its sleeves can be articulated',()=>{
  const habit=monasticHabit();
  assert.equal(habit.sleeves.length,2);
  for(const piece of [habit.body,...habit.sleeves]){
    assert.ok(Number.isFinite(piece.boundingSphere.radius));
    assert.ok(piece.attributes.normal.array.every(Number.isFinite));
  }
});
