import test from 'node:test';
import assert from 'node:assert/strict';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from '../two/vendor/three.module.min.js';
import { roofShell, atticWalls } from '../two/roof-shell.js';
import { pagodaPlan, roofProfile } from '../two/architecture.js';
import { PORT_BUILDINGS, portPoint, localPoint, QUAY_Y } from '../two/seaport-layout.js';
import { BUILDINGS, groundHeight, landscapeFloor, staticVolumeAt } from '../two/terrain.js';
import { createGame } from '../two/game.js';

test('each roof skin is closed at its verges, hips, ridge and stair aperture',()=>{
  for(const [form,aperture] of [['gable',0],['hip',0],['pagoda',.51],['pagoda',0]]){
    const g=roofShell(form,aperture),pos=g.attributes.position;
    // Split normals and UVs have duplicate vertices. Count triangle edges
    // by their actual position, checking both adjoining faces and winding.
    const keys=Array.from({length:pos.count},(_,i)=>
      [pos.getX(i),pos.getY(i),pos.getZ(i)].map(n=>Math.round(n*1e6)).join(','));
    const edges=new Map(),indices=g.index.array;
    for(let i=0;i<indices.length;i+=3) for(let side=0;side<3;side++){
      const a=keys[indices[i+side]],b=keys[indices[i+(side+1)%3]];
      const key=a<b?a+'|'+b:b+'|'+a;
      const edge=edges.get(key)||{count:0,balance:0};
      edge.count++;edge.balance+=a<b?1:-1;edges.set(key,edge);
    }
    for(const e of edges.values()) assert.deepEqual(e,{count:2,balance:0},form);
    assert.ok(pos.array.every(Number.isFinite));
  }
});

test('the plaster and boards meet the roof underside continuously along each wall',()=>{
  const roofs=[['gable',0,1/1.24,1/1.28],['hip',0,1/1.24,1/1.28],
    ['pagoda',.51,.73/1.33,.73/1.33],['pagoda',.51,.76/1.33,.76/1.33],['pagoda',0,.76/1.33,.76/1.33]];
  const lining=new MeshBasicMaterial({side:DoubleSide}),ray=new Raycaster(),down=new Vector3(0,-1,0);
  for(const [form,aperture,width,depth] of roofs){
    const roof=new Mesh(roofShell(form,aperture),lining),walls=atticWalls(form,width,depth,aperture);
    const points=walls.attributes.position,indices=walls.index.array;
    for(let i=0;i<indices.length;i+=3) for(let edge=0;edge<3;edge++){
      const a=indices[i+edge],b=indices[i+(edge+1)%3];
      if(points.getY(a)<=0 || points.getY(b)<=0) continue;
      const start=new Vector3().fromBufferAttribute(points,a),end=new Vector3().fromBufferAttribute(points,b);
      for(const t of [.01,.25,.5,.75,.99]){
        const p=start.clone().lerp(end,t);
        ray.set(new Vector3(p.x,2,p.z),down);
        const hits=ray.intersectObject(roof);
        assert.ok(hits.length>=2);
        assert.ok(p.y>=hits.at(-1).point.y-1e-5 && p.y<=hits[0].point.y+1e-5,form);
      }
    }
  }
});

test('walls, entrance heads and curved gables close all sixteen harbour buildings',()=>{
  for(const b of PORT_BUILDINGS){
    const {roof,w,d,p,u,v}=b;
    const contact=(dx,dz,y,body=.08)=>staticVolumeAt(...portPoint(p,u+dx,v+dz),y,.015,body);
    assert.ok(contact(w/2,0,QUAY_Y+1));
    assert.ok(contact(0,-d/2,QUAY_Y+1));
    assert.ok(contact(w*.375,d/2,QUAY_Y+1));
    assert.ok(!contact(w*.20,d/2,QUAY_Y+.15,1.66));
    assert.ok(contact(0,d/2,QUAY_Y+b.high-.18));
    for(const side of [-1,1]){
      const pitch=roofProfile('gable',w/roof.width,0);
      assert.ok(contact(side*w/2,0,roof.eave+roof.rise*pitch*.55));
      assert.ok(!contact(side*(w/2+.28),0,roof.eave+roof.rise*pitch*.55));
    }
  }
});

test('normal mochi stops at the harbour gable wall and grass mochi crosses it at walking height',()=>{
  for(const b of PORT_BUILDINGS.filter(b=>b.i===0)){
    const g=createGame(),player=g.state.player,start=b.w/2+1.3;
    const [x,z]=portPoint(b.p,b.u+start,b.v),input={x:-Math.cos(b.p.yaw),z:Math.sin(b.p.yaw)};
    Object.assign(player,{x,z,y:groundHeight(x,z),h:0,grounded:true,vx:0,vz:0});
    for(let i=0;i<60;i++)g.step(1/60,input);
    let [u]=localPoint(b.p,player.x,player.z);
    assert.ok(u-b.u>b.w/2 && u-b.u<start);
    g.act('kusa');
    for(let i=0;i<70;i++)g.step(1/60,input);
    [u]=localPoint(b.p,player.x,player.z);
    assert.ok(u-b.u<b.w/2-2);
    assert.equal(player.y,landscapeFloor(player.x,player.z));
  }
});

test('each pagoda wall reaches its eave while the central stair and gallery doors stay open',()=>{
  for(const b of BUILDINGS.filter(b=>b.kind==='pagoda')){
    for(const [i,level] of pagodaPlan(b).storeys.entries()){
      const {roof:r,wallTop,y}=level;
      const at=(u,v,h)=>staticVolumeAt(b.x+u*b.cos+v*b.sin,b.z-u*b.sin+v*b.cos,b.y+h,.01,.06);
      assert.ok(at(r.wallWidth/2,0,(wallTop+r.eave)/2));
      const pitch=roofProfile('pagoda',r.wallWidth/r.width,0,r.aperture);
      assert.ok(at(r.wallWidth/2,0,r.eave+r.rise*pitch*.53));
      if(i) assert.ok(!at(0,r.wallDepth/2,y+1.2));
      assert.ok(!at(.35,0,r.eave-.28));
      if(i===4) assert.ok(at(.25,0,r.eave+r.rise*roofProfile('pagoda',.5/r.width,0,0)-.04));
    }
  }
});
