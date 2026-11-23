import test from 'node:test';
import assert from 'node:assert/strict';
import { createPickupContacts, PARKED_BIKES, PARKING_ANGLE } from '../two/pickup-contacts.js';

test('parked wheel rims, handlebars and the open space under the frame turn with the rack',()=>{
  const port={type:'port',x:31,y:4,z:-12,heading:1.17,active:true,bikes:1};
  const hit=createPickupContacts([port]);
  function at(u,v,y) {
    const a=PARKING_ANGLE,heading=port.heading;
    const x=PARKED_BIKES[0]+u*Math.cos(a)+v*Math.sin(a),z=-u*Math.sin(a)+v*Math.cos(a);
    return hit(port.x+x*Math.cos(heading)+z*Math.sin(heading),port.z-x*Math.sin(heading)+z*Math.cos(heading),port.y+y,.015,.012);
  }
  assert.ok(at(0,1.01,.37)>0,'front edge of the tyre');
  assert.ok(at(.293,.40,1.059)>0,'right handlebar grip');
  assert.equal(at(0,.08,.045),0,'daylight under the frame');
  port.bikes=0;
  assert.equal(at(0,1.01,.37),0);
  assert.equal(at(.293,.40,1.059),0);
});

test('the tabletop, legs, sake bottle, cup and each tier of offerings occupy their own heights',()=>{
  const counter={type:'sake',x:0,y:0,z:0,active:true};
  const hit=createPickupContacts([counter]);
  assert.ok(hit(.363,.23,.09,.04,.02)>0);
  assert.equal(hit(0,0,.09,.04,.02),0);
  assert.ok(hit(.42,0,.34,.02,.01)>0);
  assert.ok(hit(-.057,0,.94,.02,.01)>0);
  assert.equal(hit(.23,.109,.84,.02,.01),0);
  assert.ok(hit(.23,.109,.50,.02,.01)>0);
  counter.active=false;
  assert.equal(hit(-.057,0,.94,.02,.01),0);

  const moon={type:'tsukimi',x:0,y:0,z:0,active:true};
  const cake=createPickupContacts([moon]);
  assert.ok(cake(-.324,.314,.79,.03,.02)>0);
  assert.ok(cake(.163,-.151,1.028,.03,.02)>0);
  assert.ok(cake(-.153,0,1.28,.03,.02)>0);
  moon.active=false;
  assert.equal(cake(-.153,0,1.28,.03,.02),0);
  assert.ok(cake(.70,0,.06,.03,.02)>0,'wooden base stays in the scene');
});
