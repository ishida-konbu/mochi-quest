import test from 'node:test';
import assert from 'node:assert/strict';
import { Group,Vector3 } from '../two/vendor/three.module.min.js';
import { createVillageRinse } from '../two/village-wash-furniture.js';
import { villageStations } from '../two/village-bath-courses.js';
import { rinseDipperAt,rinsingPalms } from '../two/bath-gestures.js';

test('both cedar handles and the potter’s ceramic ear track the newly posed hand in the rendered frame',()=>{
  for(const [kind,grasp] of [['shore',[.006,.158,.425]],['sakura',[.009,.139,.425]],['earthen',[.245,.056,0]]]){
    const parent=new Group();parent.position.set(218,7,-103);parent.rotation.y=1.19;
    const site={rank:'main',kind},station=villageStations(site).find(s=>s.action==='rinse');
    const update=createVillageRinse(parent,site,{u:station.u,v:station.v-.67});
    const vessel=parent.getObjectByName(station.name+'の汲み器');
    const hero={activity:'bath',activityTime:1.0,buffs:{full:20},bathPose:{id:station.id,action:'rinse',settle:1}};
    const point=new Vector3(218.15,8.43,-102.99);rinsingPalms.set(hero,point);
    assert.equal(rinseDipperAt(2.2,true).hold,1);
    update(hero);
    point.set(218.02,8.57,-103.24);
    vessel.onBeforeRender();
    const observed=vessel.localToWorld(new Vector3(...grasp));
    assert.ok(observed.distanceTo(point)<1e-6,kind+' keeps the grip through the renderer’s actor update');
    hero.activity=null;update(hero);vessel.onBeforeRender();
    assert.ok(vessel.localToWorld(new Vector3(...grasp)).distanceTo(point)>.16,kind+' returns the implement to the counter');
  }
});
