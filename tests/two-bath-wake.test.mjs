import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { createWake } from '../two/wake.js';

test('a soak clears the swim wake at the bank until the bather gets out', () => {
  const scene = new Group(), wake = createWake(scene);
  const game = createGame(), player = game.state.player;
  const bath = game.state.objects.find(object => object.grand);
  Object.assign(player,{x:bath.x, z:bath.z+7.2, y:bath.y, grounded:true, inWater:true});
  const ripples = () => scene.children.filter(mesh => mesh.visible).length;
  wake(player,game.state.time);
  assert.equal(ripples(),1);

  assert.ok(game.act('interact'));
  wake(player,game.state.time);
  assert.equal(ripples(),0,'removes the existing ring on entry');
  let drift = 0;
  for (let i=0; i<32; i++) {
    game.step(.1);
    assert.equal(player.activity,'bath');
    assert.equal(player.inWater,true);
    drift = Math.max(drift,Math.hypot(player.bathPose.x-player.x,player.bathPose.z-player.z));
    wake(player,game.state.time);
    assert.equal(ripples(),0);
  }
  assert.ok(drift>1,'the visible float moves away from the entry point');
  for (let i=0; i<5; i++) game.step(.1);
  assert.equal(player.activity,null);
  wake(player,game.state.time);
  assert.equal(ripples(),1,'swimming rings resume at the waterline');
});

test('the first crossing of river, lake, sea and spring water throws one crown and secondary ripples', async () => {
  const { riverZ, waterSurfaceAt, SNOW_SPRING } = await import('../two/terrain.js');
  const { lakePoint } = await import('../two/snow-country.js');
  for(const [x,z] of [[20,riverZ(20)],lakePoint(.48,.58),[-430,85],[SNOW_SPRING.x,SNOW_SPRING.z]]){
    const scene=new Group(), wake=createWake(scene), level=waterSurfaceAt(x,z);
    const player={x,z,y:level+1.12,grounded:false,inWater:false,speed:0,vy:-10,vx:0,vz:0};
    const crown=scene.getObjectByName('水冠と波の返し'), drops=scene.getObjectByName('砕ける水玉');
    const marks=scene.getObjectByName('落ち雫の小波');
    wake(player,0);
    player.y=level-.05;wake(player,.12);
    assert.equal(crown.geometry.instanceCount,1);
    assert.ok(drops.geometry.instanceCount>20);
    Object.assign(player,{y:level-.48,grounded:true,inWater:true,vy:0});
    let marked=false;
    for(let i=0;i<75;i++){wake(player,.13+i/60);marked ||= marks.visible;}
    assert.ok(marked,'returning drops should disturb the same water');
    assert.equal(crown.visible,false);
    assert.equal(drops.visible,false);
    Object.assign(player,{diveDepth:2,speed:4,vz:4});
    for(let i=0;i<30;i++)wake(player,1.5+i/60);
    assert.equal(crown.visible,false,'underwater swimming does not stamp the surface');
    player.diveDepth=0;wake(player,2.01);
    assert.equal(crown.geometry.instanceCount,1,'resurfacing displaces the water again');
    player.inWater=false;player.grounded=true;player.x+=70;
    wake(player,.90);
    assert.equal(drops.visible,false,'a photographic clock reset clears particles');
  }
});

test('a running shower intercepts the posed surface before the pool and follows a moving shoulder', async () => {
  const { Mesh,SphereGeometry,Vector3 }=await import('../two/vendor/three.module.min.js');
  const { createJetContact, registerFallingWater,jetContacts }=await import('../two/falling-water-contact.js');
  const { RETREATS }=await import('../two/retreat-layout.js');
  const { springLevel }=await import('../two/terrain.js');
  const site=RETREATS.find(s=>s.id==='inari-magari'),level=springLevel(site);
  const root=new Group(),skin=new Mesh(new SphereGeometry(.68,26,18).translate(0,.68,0));
  root.add(skin);root.position.set(site.x,level-.45,site.z);
  const player={x:site.x,y:root.position.y,z:site.z,grounded:true};
  registerFallingWater(site,'test-shower',[{width:.22,points:[new Vector3(0,2.5,0),new Vector3(0,.01,0)]}]);
  const trace=createJetContact(),hits=[];
  function take(point,normal,ray,width,floor,slot,surfaceY){
    assert.ok(normal.y>.85 && ray.y<-.99);
    assert.ok(Math.abs(surfaceY(point.x,point.z)-point.y)<.001);
    hits.push(point.y);assert.equal(width,.22);assert.equal(floor,level+.01);
  }
  trace(player,skin,take);
  assert.equal(hits.length,1);assert.ok(hits[0]>level+.84);
  skin.scale.y=.65;trace(player,skin,take);
  assert.equal(hits.length,2);assert.ok(hits[1]<hits[0]-.40);
  root.position.x=player.x=site.x+.74;
  let fringe=false;
  trace(player,skin,(point,normal,ray,width)=>{fringe=true;assert.ok(point.x>site.x+.10 && width<.22);});
  assert.ok(fringe,'the edge of the stream touches the shoulder before its centreline does');
  root.position.x=player.x=site.x+2.1;trace(player,skin,take);
  assert.equal(hits.length,2,'no spray beside the stream');
  assert.ok(jetContacts.value.every(hit=>hit.w===0),'the unblocked stream reaches its pool');
});
