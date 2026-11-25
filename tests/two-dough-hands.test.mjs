import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Group,Texture,TextureLoader,Vector3} from '../two/vendor/three.module.min.js';
import {GLTFLoader} from '../two/vendor/GLTFLoader.min.js';
import {loadRiceModel,poseRice} from '../two/mochi-model.js';
import {makeHero} from '../two/actors.js';
import {makeCookingArms} from '../two/cooking-arms.js';
import {createCookingPerformer} from '../two/cooking-performer.js';
import {createCookingScore} from '../two/cooking-motion.js';
import {BASIC_RECIPE} from '../two/living-craft.js';
import {craftMotion} from '../two/build-craft-motion.js';
import {fellingMotion} from '../two/exploration-felling.js';
import {timberTree} from '../two/living-build.js';
import {terrainContactHeight} from '../two/terrain.js';

async function loadTraveller(t){
  t.mock.method(TextureLoader.prototype,'loadAsync',async()=>new Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const b=await readFile(new URL(url));return this.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  });
  await loadRiceModel();
}

test('the working mitt unrolls from the actual travelling skin, with a smooth taper and a fixed tool contact',async t=>{
  await loadTraveller(t);
  const scene=new Group(),hero=makeHero(),traveller=makeHero(),travelIndex=traveller.rice.body.geometry.index;
  const arms=makeCookingArms(hero),body=hero.rice.body;
  assert.equal(traveller.rice.body.geometry.index,travelIndex);
  assert.ok(body.geometry.index.count<travelIndex.count);
  scene.add(hero.root);
  const probe=new Vector3();
  for(const mode of ['normal','kagami']){
    poseRice(hero.rice,{mode,buffs:{},grounded:true,gestureSample:{time:.2,weight:1}},.2,1/60,'curious',null,false);
    scene.updateMatrixWorld(true);
    for(const arm of arms){
      const {patch}=arm,{tip,perimeter,inside}=patch;
      const source=id=>hero.root.worldToLocal(body.localToWorld(body.getVertexPosition(id,new Vector3())));
      const atRest=source(tip.id);
      arm.update(atRest,1,0,'work');
      for(const v of patch.nodes.filter(v=>v.id!==undefined))assert.ok(v.point.distanceTo(source(v.id))<1e-6);
      const ring=perimeter.reduce((sum,p)=>sum.add(p.point),new Vector3()).divideScalar(perimeter.length);
      const along=atRest.clone().sub(ring).normalize(),end=atRest.clone().addScaledVector(along,1.30);
      arm.update(end,1,1,'work');
      assert.ok(tip.point.distanceTo(end)<1e-8);
      for(const p of perimeter)assert.ok(p.point.distanceTo(source(p.id))<1e-7,'open cheek seam');
      // The working end is a single cap. Sample the sections along a long
      // pull: no secondary swelling to make a palm or narrow wrist joint.
      const radii=[];
      for(const f of [.54,.66,.78,.90,.97]){
        const sample=inside.filter(p=>Math.abs(1-p.r*p.r-f)<.022);
        assert.ok(sample.length>6);
        const axis=sample.reduce((sum,p)=>sum.add(p.point),new Vector3()).divideScalar(sample.length);
        const radiiAt=sample.map(p=>{
          probe.subVectors(p.point,axis);probe.addScaledVector(along,-along.dot(probe));return probe.length();
        }).sort((a,b)=>a-b);
        radii.push(radiiAt[Math.floor(radiiAt.length*.75)]);
      }
      for(let i=1;i<radii.length;i++)assert.ok(radii[i]<=radii[i-1]*1.17,'local bulb on pulled skin: '+radii);
      assert.ok(radii.at(-1)<radii[0]*.85,'round end cap');
      assert.ok(arm.mesh.geometry.attributes.normal.array.every(Number.isFinite));
      const representative=inside.find(p=>Math.abs(p.r-.62)<.008);
      const moved=end.clone().add(new Vector3(-.13,.08,.06));
      arm.update(moved,1,1.016,'work');const trailing=representative.point.clone();
      assert.ok(tip.point.distanceTo(moved)<1e-8);
      for(let i=1;i<=36;i++)arm.update(moved,1,1.016+i/60,'work');
      assert.ok(representative.point.distanceTo(trailing)>.014);
      const settled=representative.point.clone();arm.update(moved,1,0,'new cut');
      assert.ok(representative.point.distanceTo(settled)<.001);
    }
  }
});


test('released mitts are the original posed cheeks and acquired grips meet their tools across actions and sizes',async t=>{
  await loadTraveller(t);
  const probes=makeCookingArms(makeHero()).map(({patch,mesh})=>{
    const tip=patch.samples.indexOf(patch.nodes.indexOf(patch.tip));
    const original=[];
    for(const [i,node] of patch.samples.entries()){
      const id=patch.nodes[node].id;
      if(id!==undefined)original.push([i,id]);
    }
    const faces=[],idx=mesh.geometry.index.array;
    for(let i=0;i<idx.length;i+=3){
      if(patch.nodes[patch.samples[idx[i]]].r<.49)faces.push(idx[i],idx[i+1],idx[i+2]);
    }
    return {tip,tipId:patch.tip.id,rim:patch.perimeter.map(p=>p.id),original,faces,name:mesh.name};
  });
  const tree=timberTree('birch:39941:2333:9507');
  const scene=new Group(),v=new Vector3(),w=new Vector3(),edge=new Vector3(),axis=new Vector3();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const player={mode,buffs:{full},grounded:true,heading:1,x:tree.x-1.7,z:tree.z,y:terrainContactHeight(tree.x-1.7,tree.z)};
    const actor=createCookingPerformer(scene,player),body=actor.group.getObjectByName('Nikkori');
    const build=craftMotion({kind:'hut'},player,{feet:[0,0]}),cook=createCookingScore(BASIC_RECIPE,undefined,{full:Boolean(full)});
    const axe=fellingMotion(tree,player);
    const samples=[...([0,1,4.75,5.75,8.80,9.02,9.04,9.80].map(t=>build.sample(t))),
      cook.sample(0),cook.sample(cook.chapters.find(c=>c.id==='pound').start+1.4),cook.sample(cook.duration),
      axe.sample(0),axe.sample(axe.impactTimes[0]),axe.sample(axe.duration)];
    for(const frame of samples){
      actor.update(frame);scene.updateMatrixWorld(true);
      for(const [side,probe] of probes.entries()){
        const mesh=actor.group.getObjectByName(probe.name),positions=mesh.geometry.attributes.position;
        const sample=i=>v.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
        if(frame.handWork[side]===0){
          for(const [i,id] of probe.original){
            body.getVertexPosition(id,w).applyMatrix4(body.matrixWorld);
            assert.ok(sample(i).distanceTo(w)<.000002,'free cheek pulled into the body at '+frame.time);
          }
        }else if(frame.handWork[side]===1){
          assert.ok(sample(probe.tip).distanceTo(w.fromArray(frame.hands[side]))<.000002,'missed grip at '+frame.time);
        }else if(frame.tool==='mallet'){
          // A bent tube used to fold its upper and lower surfaces across
          // each other during the first 240 ms of the reach. Project the
          // working centre of the actual skin onto the original cheek.
          axis.set(0,0,0);
          for(const id of probe.rim)axis.add(body.getVertexPosition(id,w).applyMatrix4(body.matrixWorld));
          axis.divideScalar(probe.rim.length);
          axis.sub(body.getVertexPosition(probe.tipId,w).applyMatrix4(body.matrixWorld)).negate().normalize();
          let facing=0,folded=0;
          for(let j=0;j<probe.faces.length;j+=3){
            const origin=w.copy(sample(probe.faces[j]));
            edge.copy(sample(probe.faces[j+1])).sub(origin);
            const signed=edge.cross(sample(probe.faces[j+2]).sub(origin)).dot(axis);
            if(signed>0)facing+=signed;
            else folded-=signed;
          }
          assert.ok(folded/facing<.025,'a pocket folded into the cheek at '+frame.time);
        }
      }
    }
    actor.dispose();
  }
});
