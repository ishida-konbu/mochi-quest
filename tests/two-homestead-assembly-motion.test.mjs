import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3,Euler,Ray,Triangle,Vector3 } from '../two/vendor/three.module.min.js';
import { terrainContactHeight } from '../two/terrain.js';
import { assemblyParts } from '../two/homestead-assembly-parts.js';
import { placeStructure,surveySite } from '../two/living-build.js';
import { createLivingWorld } from '../two/living-save.js';
import { planAssembly } from '../two/homestead-assembly-motion.js';

const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function job(kind,yaw=0,size=1){
  const site={x:28,z:96,y:terrainContactHeight(28,96)+.03,yaw,kind,terrain:'plain'};
  const player={x:28,z:99.7,y:terrainContactHeight(28,99.7),grounded:true,heading:Math.PI,buffs:{full:size>1?60:0}};
  const parts=assemblyParts(kind,site.terrain);
  return {site,player,parts,plan:planAssembly(player,site,parts)};
}

test('every build kit accepts a fieldwork route with a grounded exit, raised joinery has a stepped work stand',()=>{
  for(const kind of ['stand','camp','floor','posts','wall','roof','fence','chest','hut']){
    const {site,player,parts,plan}=job(kind,kind==='posts'?Math.PI/4:0,kind==='chest'?1.28:1);
    assert.ok(plan,kind);
    assert.equal(plan.staging.length,parts.length);
    const first=plan.sample(0),last=plan.sample(plan.duration);
    assert.ok(Math.abs(first.hero[1]+site.y-player.y)<.035);
    assert.equal(last.installedCount,parts.length);
    assert.ok(Math.abs(plan.endPose.y-terrainContactHeight(plan.endPose.x,plan.endPose.z))<.055);
    assert.ok(Number.isFinite(plan.endPose.heading));
    if(['roof','hut','posts'].includes(kind))assert.ok(plan.platforms.some(b=>b.count>1 && b.height>.55));
    for(const action of plan.actions.slice(1)){
      const a=plan.sample(action.start-.00001),b=plan.sample(action.start+.00001);
      for(const [l,r] of [[a.hero,b.hero],...a.feet.map((v,i)=>[v,b.feet[i]]),...a.hands.map((v,i)=>[v,b.hands[i]])])
        assert.ok(distance(l,r)<.045,kind+' '+action.index+' '+action.type+' '+distance(l,r));
    }
  }
});

test('during loaded travel both hands stay at the authored contacts and a wooden mallet meets its joint firmly',()=>{
  const {plan,parts,player,site}=job('stand');
  for(const action of plan.actions.filter(s=>s.type==='carry')){
    const part=parts[action.index];
    for(let i=0;i<=40;i++){
      const f=plan.sample(action.start+(action.end-action.start)*i/40);
      const rotation=new Euler(...f.rotation,'XYZ');
      for(let j=0;j<2;j++){
        const hand=new Vector3().fromArray(part.handholds[j]).sub(new Vector3(...part.grip)).applyEuler(rotation)
          .add(new Vector3(...part.grip)).add(new Vector3(...f.offset));
        assert.ok(distance(hand.toArray(),f.hands[j])<.001);
      }
    }
  }
  let strikes=0;
  for(const action of plan.actions.filter(s=>s.type==='fasten')){
    const f=plan.sample(action.start+(action.end-action.start)*.65);
    if(f.cue!=='knock')continue;
    const head=new Vector3(0,-.066,0).applyEuler(new Euler(...f.mallet.rotation,'YXZ')).add(new Vector3(...f.mallet.position));
    assert.ok(distance(head.toArray(),parts[f.index].grip)<.002);strikes++;
  }
  assert.ok(strikes>0);
  assert.equal(planAssembly({...player,mount:'bike'},site,parts),null);
  assert.equal(planAssembly(player,site,parts,()=>false),null);
});

function transformedFaces(part,frame) {
  const pos=part.geometry.attributes.position,ix=part.geometry.index.array;
  const origin=new Vector3(...part.grip),rotation=new Euler(...(frame?.rotation??[0,0,0]));
  const final=origin.clone().add(new Vector3(...(frame?.offset??[0,0,0])));
  const vertices=Array.from({length:pos.count},(_,i)=>new Vector3().fromBufferAttribute(pos,i).sub(origin).applyEuler(rotation).add(final));
  const faces=[];
  for(let i=0;i<ix.length;i+=3)faces.push(new Triangle(vertices[ix[i]],vertices[ix[i+1]],vertices[ix[i+2]]));
  return {faces,box:new Box3().setFromPoints(vertices)};
}

function crosses(a,b){
  const overlap=a.box.clone().intersect(b.box);
  if(overlap.isEmpty())return false;
  const left=a.faces.filter(f=>overlap.intersectsTriangle(f)),right=b.faces.filter(f=>overlap.intersectsTriangle(f));
  const ray=new Ray(),dir=new Vector3(),hit=new Vector3();
  function edgeThrough(t,f) {
    for(const [start,end] of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]){
      const length=dir.subVectors(end,start).length();
      if(length<.006)continue;
      ray.set(start,dir.multiplyScalar(1/length));
      if(ray.intersectTriangle(f.a,f.b,f.c,false,hit) &&
          hit.distanceTo(start)>.003 && hit.distanceTo(start)<length-.003)return true;
    }
    return false;
  }
  return left.some(a=>right.some(b=>edgeThrough(a,b)||edgeThrough(b,a)));
}

test('loaded ridge, roof trusses and full wall panels clear the earlier three-dimensional frame throughout transport',()=>{
  const {parts,plan}=job('hut');
  assert.ok(plan);
  const fixed=parts.map(part=>transformedFaces(part));
  const largeMembers=new Set(['wall.wainscot','wall.screen','posts.left-plate','roof.trestle-0','roof.trestle-1','roof.ridge','roof.ridge-cap','roof.back-1']);
  for(const a of plan.actions.filter(a=>a.type==='carry' && largeMembers.has(parts[a.index].id))){
    for(let i=0;i<32;i++){
      const f=plan.sample(a.start+(i+.5)/32*(a.end-a.start)),load=transformedFaces(parts[a.index],f);
      for(let j=0;j<a.index;j++){
        assert.ok(!crosses(load,fixed[j]),parts[a.index].id+' through '+parts[j].id+' at '+Math.round(100*(i+.5)/32)+'%');
      }
    }
  }
});

test('a steep hut keeps hand contacts during sling work and covers any discontinuous station change',()=>{
  const world={...createLivingWorld(),wood:100};
  assert.ok(placeStructure(world,'camp',{x:151,z:128,yaw:0}).ok);
  const site={...surveySite(world,'hut',{x:140,z:132,yaw:.3}),kind:'hut',structures:world.structures};
  assert.ok(site.ok && site.relief>2.4);
  const x=site.x+3.7*Math.sin(site.yaw),z=site.z+3.7*Math.cos(site.yaw);
  const player={x,z,y:terrainContactHeight(x,z),grounded:true,heading:Math.PI};
  const parts=assemblyParts('hut',site.terrain,site),plan=planAssembly(player,site,parts);
  assert.ok(plan?.compact);
  for(const action of plan.actions){
    if(action.cut){
      assert.equal(plan.sample((action.start+action.end)/2).cutOpacity,1);
      continue;
    }
    if(action.type==='carry'){
      const f=plan.sample((action.start+action.end)/2);
      parts[action.index].handholds.forEach((v,i)=>{
        assert.ok(distance(v.map((n,k)=>n+f.offset[k]),f.hands[i])<.001);
      });
    }
    if(action.start){
      const a=plan.sample(action.start-.00001),b=plan.sample(action.start+.00001);
      for(const [i,v] of a.feet.entries())assert.ok(distance(v,b.feet[i])<.034);
    }
  }
  assert.equal(plan.sample(plan.duration).installedCount,parts.length);
  for(const part of parts.filter(s=>s.siteGeometry))part.geometry.dispose();
});
