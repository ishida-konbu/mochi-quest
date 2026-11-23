import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Quaternion, Texture, TextureLoader, Triangle, Vector3 } from '../two/vendor/three.module.min.js';
import { workDrawer, createPropTransfers, createToolRests } from '../two/story-work-drawer.js';
import { createStoryWorktable } from '../two/story-crafts.js';
import { tablePlan } from '../two/story-table-plan.js';
import { tabletopCarryFloor } from '../two/story-prop-contacts.js';

const point=(x=0,y=0,z=0)=>new Vector3(x,y,z);
const orientation=new Quaternion();
const at=o=>o.getWorldPosition(point());
function fixture(){
  const scene=new Group(),table=new Group(),actor=new Group();
  table.rotation.y=.73;table.position.set(32,2,-71);scene.add(table,actor);
  const drawer=workDrawer(table,.92,1.2,.68);
  const rack=new Group();rack.position.y=.92;table.add(rack);
  function article(x){
    const o=new Mesh(new BoxGeometry(.14,.16,.12),new MeshBasicMaterial());
    o.position.set(x,-drawer.h+.116,-drawer.d*.48);drawer.front.add(o);
    return o;
  }
  const transfers=createPropTransfers(scene),history=[];
  const operator={actor,palm:point(),blocked:false,release(){},reach(target,{phase,object}){
    if(!this.blocked)this.palm.copy(target);
    history.push({phase,object,point:this.palm.clone()});
    return this.palm;
  }};
  function frame(){transfers.update(1/60);}
  function until(done,check){
    for(let frameCount=0;frameCount<3000&&!done();frameCount++){frame();check?.(history.at(-1));}
    assert.ok(done(),'transfer reached its condition');
  }
  return {drawer,rack,actor,article,transfers,history,operator,frame,until};
}

test('a drawer opens only under its handle, supports every parcel, and closes only after the worker sets the article down',()=>{
  const {drawer,rack,article,transfers,operator,frame,until}=fixture();
  assert.ok(drawer.mount.position.z<0 && drawer.mount.rotation.y===Math.PI);
  const picked=article(-.20),neighbor=article(.20),home=neighbor.position.clone(),stored=picked.position.clone();
  const destination=point(-.12,.08,-.08);
  const grip=point(0,.035,.06);
  transfers.move(picked,rack,destination,orientation,{drawer,mode:'out',operator,grip});
  operator.blocked=true;
  for(let i=0;i<120;i++)frame();
  assert.equal(drawer.front.position.z,0);assert.deepEqual(picked.position.toArray(),stored.toArray());
  operator.blocked=false;
  let highest=0,everCarried=false,everPushed=false;
  until(()=>!transfers.has(picked),({phase,point:palm})=>{
    highest=Math.max(highest,drawer.front.position.z);
    assert.ok(neighbor.parent===drawer.front && neighbor.position.distanceTo(home)<1e-9);
    if(phase==='pull' || phase==='push')assert.ok(palm.distanceTo(at(drawer.handle))<1e-7,phase);
    if(phase==='pull')assert.ok(picked.parent===drawer.front && picked.position.distanceTo(stored)<1e-9);
    if(['lift','carry','set'].includes(phase)){
      everCarried=true;assert.ok(picked.localToWorld(grip.clone()).distanceTo(palm)<1e-7,phase);
      assert.ok(Math.abs(drawer.front.position.z-drawer.travel)<1e-7);
    }
    if(phase==='push'){everPushed=true;assert.equal(picked.parent,rack);assert.ok(picked.position.distanceTo(destination)<1e-7);}
  });
  assert.ok(everCarried && everPushed && highest===drawer.travel);assert.equal(drawer.front.position.z,0);
  transfers.move(picked,drawer.front,stored,orientation,{drawer,mode:'in',operator,grip});
  until(()=>!transfers.busy(),({phase,point:palm})=>{
    if(phase==='pull')assert.equal(picked.parent,rack);
    if(['lift','carry','set'].includes(phase))assert.ok(picked.localToWorld(grip.clone()).distanceTo(palm)<1e-7,phase);
    if(phase==='push'){assert.equal(picked.parent,drawer.front);assert.ok(picked.position.distanceTo(stored)<1e-7);}
  });
  assert.equal(drawer.front.position.z,0);assert.ok(picked.position.distanceTo(stored)<1e-7);
});

test('interrupting a pull leaves the boards and supported objects at their current position',()=>{
  const {drawer,rack,article,transfers,operator,until}=fixture();
  const o=article(0),stored=o.position.clone();
  transfers.move(o,rack,point(0,.08,0),orientation,{drawer,mode:'out',operator});
  until(()=>drawer.front.position.z>.14);
  const before=at(o),z=drawer.front.position.z;
  transfers.take(o);
  assert.ok(transfers.busy(operator));assert.ok(at(o).distanceTo(before)<1e-10);assert.equal(drawer.front.position.z,z);
  until(()=>!transfers.busy(operator),({phase})=>{if(phase!=='push' && phase!=='release')assert.equal(drawer.front.position.z,z);});
  assert.equal(drawer.front.position.z,0);assert.equal(o.parent,drawer.front);assert.ok(o.position.distanceTo(stored)<1e-8);
});

test('queued parcels wait on their own supports, and a worker can reverse a delivery in flight',()=>{
  const {drawer,rack,article,transfers,operator,until,frame}=fixture();
  const a=article(-.20),b=article(.18),back=a.position.clone(),seen=[];
  transfers.move(a,rack,point(-.20,.08,0),orientation,{drawer,mode:'out',operator,finish(){seen.push('cancelled');}});
  transfers.move(b,rack,point(.20,.08,0),orientation,{drawer,mode:'out',operator,finish(){seen.push('second');}});
  until(()=>a.parent!==drawer.front,()=>{assert.equal(b.parent,drawer.front);assert.equal(transfers.progress(b),null);});
  for(let i=0;i<30;i++)frame();
  const before=at(a),open=drawer.front.position.z;
  transfers.move(a,drawer.front,back,orientation,{drawer,mode:'in',operator,finish(){seen.push('returned');}});
  assert.ok(at(a).distanceTo(before)<1e-8);assert.equal(drawer.front.position.z,open);
  until(()=>!transfers.busy());
  assert.deepEqual(seen,['returned','second']);assert.equal(b.parent,rack);assert.equal(a.parent,drawer.front);
  assert.equal(drawer.front.position.z,0);assert.ok(a.position.distanceTo(back)<1e-8);
});

test('the receiving socket sets scale in its local space while the grip stays attached',()=>{
  const {rack,article,transfers,operator,until}=fixture();
  const a=article(0);rack.scale.setScalar(.70);
  const grip=point(0,.012,.06),scale=point(.42,.42,.42);
  transfers.move(a,rack,point(0,.08,0),orientation,{operator,grip,scale});
  until(()=>!transfers.busy(),({phase,point:palm})=>{
    if(['lift','carry','set'].includes(phase))assert.ok(a.localToWorld(grip.clone()).distanceTo(palm)<1e-7);
  });
  assert.ok(a.scale.distanceTo(scale)<1e-7);
});

test('a drawer remains open for the next article and a cancelled final collection still shuts it',()=>{
  const {drawer,rack,article,transfers,operator,until,history}=fixture();
  const a=article(-.17),b=article(.17);
  transfers.move(a,rack,point(-.17,.08,0),orientation,{drawer,mode:'out',operator});
  transfers.move(b,rack,point(.17,.08,0),orientation,{drawer,mode:'out',operator});
  until(()=>a.parent===rack);
  assert.ok(drawer.front.position.z===drawer.travel && !history.some(h=>h.phase==='push'));
  transfers.take(b);
  until(()=>!transfers.busy());
  assert.equal(b.parent,drawer.front);
  assert.equal(drawer.front.position.z,0);
});

test('a cancelled midair parcel is kept by the worker until it is back on its support',()=>{
  const {drawer,rack,article,transfers,operator,until,history}=fixture();
  const a=article(0),home=a.position.clone();
  transfers.move(a,rack,point(0,.08,0),orientation,{drawer,mode:'out',operator});
  until(()=>history.at(-1)?.phase==='carry');
  transfers.take(a);
  assert.ok(transfers.busy(operator));
  until(()=>!transfers.busy());
  assert.equal(a.parent,drawer.front);assert.ok(a.position.distanceTo(home)<1e-7);
  assert.equal(drawer.front.position.z,0);
});

test('a packed article appears only after the worker has reached its grip',()=>{
  const {rack,article,transfers,operator,until,frame}=fixture();
  const parcel=article(0);parcel.visible=false;
  transfers.move(parcel,rack,point(0,.08,0),orientation,{operator});
  operator.blocked=true;
  for(let i=0;i<90;i++)frame();
  assert.equal(parcel.visible,false);
  operator.blocked=false;
  until(()=>parcel.visible,({phase})=>assert.equal(phase,'reachItem'));
  assert.ok(operator.palm.distanceTo(at(parcel))>.025,'the grip was measured on the concealed mesh');
  until(()=>!transfers.busy());
  assert.ok(parcel.visible && parcel.parent===rack);
});

test('the working bay clears the timber, oven cheeks and carved decoration of every regional counter',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  for(const [number,place] of [...Array.from({length:17},(_,i)=>[i+1]),[8,'charcoal'],[11,'court']]){
    const plan=tablePlan(number,place),station=new Group(),wood=createStoryWorktable(number,0,place);
    station.add(wood);
    const drawer=workDrawer(station,plan.top,1.16,plan.depth),edge=drawer.mount.position.z;
    const floor=drawer.mount.position.y-drawer.h+.045;
    const bay=new Box3(point(-drawer.w/2+.030,floor+.001,edge+.033),
      point(drawer.w/2-.030,floor+drawer.clearHeight,edge+drawer.d-.033));
    station.updateMatrixWorld(true);
    const tri=new Triangle();
    wood.traverse(mesh=>{
      const vertices=mesh.geometry?.attributes.position;if(!vertices)return;
      const idx=mesh.geometry.index,count=idx?.count || vertices.count;
      for(let i=0;i<count;i+=3){
        tri.setFromAttributeAndIndices(vertices,idx?.getX(i)??i,idx?.getX(i+1)??i+1,idx?.getX(i+2)??i+2);
        tri.a.applyMatrix4(mesh.matrixWorld);tri.b.applyMatrix4(mesh.matrixWorld);tri.c.applyMatrix4(mesh.matrixWorld);
        if(bay.intersectsTriangle(tri))assert.fail(wood.name+' intersects its live storage bay: '+mesh.name);
      }
    });
  }
});

test('a shared work station can reserve a second artisan for the same handoff',()=>{
  const {rack,article,transfers,operator,until}=fixture();
  const a=article(-.20),b=article(.20),actors=[];
  operator.station={};
  const other={...operator,actor:new Group(),reach(t){actors.push('second');return t;}};
  transfers.move(a,rack,point(-.17,.08,0),orientation,{operator,finish(){actors.push('first set');}});
  transfers.move(b,rack,point(.17,.08,0),orientation,{operator:other});
  until(()=>!transfers.busy());
  assert.equal(actors[0],'first set');assert.ok(actors.includes('second'));
});

test('an artisan can carry a parcel around an obstacle without breaking the grip',()=>{
  const {rack,article,transfers,operator,until}=fixture();
  const a=article(0);rack.add(a);a.position.set(-.40,.08,0);
  const grip=point(0,0,.06),start=at(a),waypoints=[];
  operator.walkWithLoad=true;
  let farthest=0,routeStarted=false,lastPhase;
  operator.reach=function(target,{phase,dt}){
    lastPhase=phase;
    if(phase==='carry'){
      if(!routeStarted){
        routeStarted=true;
        waypoints.push(this.palm.clone().add(point(0,0,.55)),target.clone().add(point(0,0,.55)));
      }
      const next=waypoints[0] || target;
      this.palm.add(next.clone().sub(this.palm).clampLength(0,dt*1.1));
      if(waypoints.length && this.palm.distanceTo(next)<1e-6)waypoints.shift();
    }else this.palm.copy(target);
    return this.palm;
  };
  transfers.move(a,rack,point(.4,.08,0),orientation,{operator,grip});
  until(()=>!transfers.busy(),()=>{
    if(lastPhase==='carry'){
      assert.ok(a.localToWorld(grip.clone()).distanceTo(operator.palm)<1e-7);
      farthest=Math.max(farthest,at(a).z-start.z);
    }
  });
  assert.ok(farthest>.51);assert.equal(waypoints.length,0);
});

test('carry height yields to a shorter arm without dropping below the open rim',()=>{
  const {drawer,rack,article,transfers,operator,until}=fixture();
  const a=article(0);
  operator.reach=function(target,{phase}){
    this.palm.copy(target);
    if(phase==='lift' || phase==='carry')this.palm.y-=.045;
    return this.palm;
  };
  transfers.move(a,rack,point(0,.08,0),orientation,{operator,drawer,mode:'out'});
  until(()=>!transfers.busy());
  assert.equal(a.parent,rack);assert.equal(drawer.front.position.z,0);
});

test('the same hand clears a raised stand with a dish and lowers it onto its original worktop',()=>{
  const {rack,article,transfers,operator,until}=fixture();
  const dish=article(0),stand=new Mesh(new BoxGeometry(.32,.60,.3),new MeshBasicMaterial());
  rack.add(dish,stand);stand.position.set(-.46,.30,0);dish.position.set(-.46,.68,0);
  const home=point(.44,.08,0),grip=point(0,0,.06);
  const carryFloor=tabletopCarryFloor(rack,dish,[stand]);
  let phase,previousY,lowered=0,cleared=false;
  operator.walkWithLoad=true;
  operator.reach=function(target,action){
    phase=action.phase;
    if(phase==='carry'){
      const local=rack.worldToLocal(target.clone());
      // The artisan can hold a raised dish against the body, or extend the
      // same arm over the worktop once the dish is at elbow height.
      if(local.y>.42)local.x=Math.min(local.x,.03);
      const step=rack.localToWorld(local).sub(this.palm).clampLength(0,action.dt*1.4);
      this.palm.add(step);
    }else this.palm.copy(target);
    return this.palm;
  };
  transfers.move(dish,rack,home,orientation,{operator,grip,carryFloor});
  until(()=>!transfers.busy(),()=>{
    if(!['lift','carry','set'].includes(phase))return;
    assert.ok(dish.localToWorld(grip.clone()).distanceTo(operator.palm)<1e-7);
    const p=rack.worldToLocal(at(dish));
    if(p.x<-.23)assert.ok(p.y-.08>=.599,'the dish clears the stand with its whole underside');
    else cleared=true;
    if(phase==='carry' && previousY!=null && previousY>p.y+.001){
      assert.ok(previousY-p.y<.025);lowered++;
    }
    previousY=p.y;
  });
  assert.ok(cleared && lowered>12);
  assert.equal(dish.parent,rack);assert.ok(dish.position.distanceTo(home)<1e-8);
  assert.ok(Math.abs(new Box3().setFromObject(dish).min.y-at(rack).y)<1e-7);
});

test('a returned tool binds at the moving wrist without jumping to the old idle pose',()=>{
  const {rack,article,transfers,operator,frame}=fixture();
  const tool=article(0);rack.add(tool);tool.position.set(-.25,.08,0);
  const bone=new Group();rack.add(bone);bone.position.set(.12,.25,0);
  const wrist={parent:bone,position:point(.035,.025,.015),rotation:orientation.clone(),scale:point(1,1,1)};
  operator.settle=t=>{bone.rotation.z=.45*t;return operator.palm;};
  transfers.move(tool,rack,point(.01,.11,0),orientation,{operator,wrist,grip:point(0,0,.05)});
  let bound=false;
  for(let i=0;i<1000 && transfers.busy();i++){
    const old=at(tool),parent=tool.parent;frame();
    if(tool.parent===bone){
      if(parent!==bone){bound=true;assert.ok(old.distanceTo(at(tool))<.02);}
      else assert.ok(old.distanceTo(at(tool))<.04,'the final adjustment is made along the wrist');
    }
  }
  assert.ok(bound && !transfers.busy());
  assert.equal(tool.parent,bone);assert.ok(tool.position.distanceTo(wrist.position)<1e-7);
  assert.ok(tool.quaternion.angleTo(wrist.rotation)<1e-7);
});

test('an archived parcel is visible until the shared drawer actually shuts',()=>{
  const {drawer,rack,article,transfers,operator,until}=fixture();
  const a=article(-.17),b=article(.17),home=a.position.clone();
  rack.add(a);a.position.set(-.16,.08,-.04);
  let archived=false;
  transfers.move(a,drawer.front,home,orientation,{operator,drawer,mode:'in',finish(){drawer.concealWhenShut(a);archived=true;}});
  transfers.move(b,rack,point(.18,.08,0),orientation,{operator,drawer,mode:'out'});
  until(()=>archived);assert.equal(drawer.front.position.z,drawer.travel);assert.equal(a.visible,true);
  until(()=>!transfers.busy(),()=>{if(drawer.front.position.z>.001)assert.equal(a.visible,true);});
  assert.equal(drawer.front.position.z,0);assert.equal(a.visible,false);
});

test('a tool modeled around its owner frame hangs from its handle',()=>{
  const {rack,operator,transfers,until}=fixture(),actor=operator.actor;
  actor.position.copy(at(rack));actor.scale.setScalar(.84);
  const tool=new Group(),grip=new Group();actor.add(tool,grip);
  const mesh=new Mesh(new BoxGeometry(.03,.22,.04),new MeshBasicMaterial());
  mesh.position.set(-.44,1.21,.28);tool.add(mesh);
  grip.position.copy(mesh.position);
  const start=at(grip),tip=tool.worldToLocal(start.clone()),rests=createToolRests(transfers);
  rests.park(actor,tool,operator,grip);
  until(()=>!transfers.busy());
  const keeper=actor.getObjectByName('腰の道具差し');
  assert.equal(tool.parent,keeper);assert.ok(tool.localToWorld(tip.clone()).distanceTo(at(keeper))<1e-8);
  assert.ok(at(keeper).distanceTo(start)<.24);
  rests.return(tool,operator);until(()=>!transfers.busy());
  assert.equal(tool.parent,actor);assert.ok(tool.localToWorld(tip.clone()).distanceTo(start)<1e-8);
});

test('a paw planted near the end of the iron crossbar can pull and close it',()=>{
  const {rack,drawer,article,operator,transfers,until}=fixture(),a=article(0);
  operator.reach=function(target,{phase}){
    this.palm.copy(target);
    if(['approachHandle','pull','reachHandle','push'].includes(phase)){
      const local=drawer.mount.worldToLocal(this.palm);
      local.x=drawer.handle.position.x+.061;
      drawer.mount.localToWorld(local);
    }
    return this.palm;
  };
  transfers.move(a,rack,point(0,.08,0),orientation,{drawer,mode:'out',operator});
  until(()=>!transfers.busy());
  assert.equal(a.parent,rack);assert.equal(drawer.front.position.z,0);
});

test('a blocked approach can choose another clear landing while the article stays in the solved hand',()=>{
  const {drawer,rack,article,transfers,operator,until}=fixture();
  const item=article(.12),grip=point(.01,.03,.05);
  const place=new Group();rack.add(place);place.position.x=.42;
  let changed=0,waiting=0;
  operator.walkWithLoad=true;
  const solve=operator.reach.bind(operator);
  operator.reach=(target,context)=>{
    if(context.phase==='carry' && !changed){waiting++;return solve(operator.palm,context);}
    return solve(target,context);
  };
  transfers.move(item,place,point(0,.08,0),orientation,{operator,drawer,mode:'out',grip,
    alternate(){
      assert.ok(item.localToWorld(grip.clone()).distanceTo(operator.palm)<1e-7);
      changed++;place.position.x=-.18;return true;
    }});
  until(()=>!transfers.has(item));
  assert.equal(changed,1);assert.ok(waiting>60);
  assert.equal(item.parent,place);assert.equal(drawer.front.position.z,0);
});
