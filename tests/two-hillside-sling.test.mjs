import test from 'node:test';
import assert from 'node:assert/strict';
import { Raycaster,Vector3 } from '../two/vendor/three.module.min.js';
import { assemblyParts } from '../two/homestead-assembly-parts.js';
import { planAssembly } from '../two/homestead-assembly-motion.js';
import { planSling,slingSurface } from '../two/homestead-lifting-sling.js';
import { placeStructure,surveySite } from '../two/living-build.js';
import { createLivingWorld } from '../two/living-save.js';
import { terrainContactHeight } from '../two/terrain.js';

test('portable shear legs and guy lines find real bearings through each stage on a two-metre hillside',()=>{
  const world=createLivingWorld();
  assert.ok(placeStructure(world,'camp',{x:151,z:128,yaw:0}).ok);
  const site=surveySite(world,'hut',{x:140,z:132,yaw:.3});
  assert.ok(site.ok && site.relief>2);
  const px=site.x+3.7*Math.sin(site.yaw),pz=site.z+3.7*Math.cos(site.yaw);
  const player={x:px,z:pz,y:terrainContactHeight(px,pz),grounded:true,heading:site.yaw-Math.PI};
  const steps=assemblyParts('hut',site.terrain,site);
  const plan=planAssembly(player,{...site,kind:'hut',structures:world.structures},steps);
  assert.ok(plan.compact);
  let onStructure=0,projecting=0;
  const done=[],ray=new Raycaster(),axis=new Vector3();
  const fasten=plan.actions.filter(a=>a.type==='fasten');
  for(const [i,step] of steps.entries()){
    const stock=plan.staging[i],[x,y,z]=plan.sample(fasten[i].start+.15).hero;
    const rig=planSling(step,stock,plan.land,done,{x,y,z,size:1});
    const struts=[...rig.legs,rig.guy].map(p=>[p.foot,p.head]);
    if(rig.jib){projecting++;struts.push([rig.jib,rig.hook],[rig.crown,rig.hook]);}
    onStructure+=rig.legs.filter(s=>s.mounted).length;
    const occupied=[...done];
    for(const f of [0,.5,1])
      occupied.push(slingSurface(step.geometry,...stock.offset.map(o=>o*f)));
    for(const [a,b] of struts){
      axis.subVectors(b,a);ray.near=.055;ray.far=axis.length()-.055;
      ray.set(a,axis.normalize());
      assert.equal(ray.intersectObjects(occupied,false).length,0,step.id);
    }
    done.push(slingSurface(step.geometry));
  }
  assert.ok(onStructure>0 && projecting>0);
  for(const step of steps)if(step.siteGeometry)step.geometry.dispose();
});
