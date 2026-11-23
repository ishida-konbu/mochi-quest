import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Quaternion, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { sipTea, pourTea } from '../two/mochiyori-hand-props.js';
import { placeWithinReach, turnWorkPage } from '../two/story-prop-socket.js';
import { createWorkContact } from '../two/story-prop-contacts.js';
import { createStoryEvidence, openLunchLeaf, readCargoNote, sealCargoNote, setEvidencePose } from '../two/story-crafts.js';

test('examining the basket exposes twelve portions without moving the cakes at the ferry', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture());
  const ferry = createStoryEvidence('basket');
  const study = createStoryEvidence('basket', 'joined-cake');
  const cleared = createStoryEvidence('basket', 'leaf-marks');
  const singles = [];
  ferry.traverse(object => { if (object.name === '花筏餅') singles.push(object); });
  assert.equal(singles.length, 10);
  assert.ok(ferry.getObjectByName('合わせ餅'));
  assert.equal(cleared.getObjectByName('合わせ餅'), undefined);
  assert.equal(cleared.getObjectByName('花筏餅'), undefined);

  const joined = study.getObjectByName('合わせ餅');
  const rest = joined.position.clone();
  setEvidencePose(study, 'lift');
  assert.ok(joined.position.y > rest.y + .3);
  assert.ok(new Vector3(0,-1,0).applyQuaternion(joined.quaternion).z > .8);
  assert.deepEqual(ferry.getObjectByName('合わせ餅').position, rest);
  setEvidencePose(study, 'rest');
  assert.deepEqual(joined.position, rest);
});

test('the three loose battens support the upper steamer in the spaced trial', t => {
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture());
  const sample = createStoryEvidence('steamer');
  const upper = sample.getObjectByName('蒸し箱の上段');
  const lower = sample.getObjectByName('蒸し箱の下段');
  const rails = [0,1,2].map(i => sample.getObjectByName('取り外し桟'+i));
  const bounds = mesh => new Box3().setFromObject(mesh);
  setEvidencePose(sample, 'single');
  assert.ok(bounds(upper).max.x < bounds(lower).min.x);

  setEvidencePose(sample, 'stacked');
  const stacked = upper.position.y, side = bounds(lower).max.x;
  assert.ok(rails.every(rail => bounds(rail).min.x > side));
  setEvidencePose(sample, 'spaced');
  const base = bounds(lower), raised = bounds(upper);
  for (const rail of rails) {
    const batten = bounds(rail);
    assert.ok(batten.min.x > base.min.x && batten.max.x < base.max.x);
    assert.ok(Math.abs(batten.min.y-base.max.y) < .007);
    assert.ok(Math.abs(batten.max.y-raised.min.y) < .009);
  }
  assert.ok(upper.position.y > stacked + .03);
  setEvidencePose(sample, 'stacked');
  assert.equal(upper.position.y, stacked);
});

test('the two cakes at the ferry meet along a closed seam and can be lifted independently',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const basket=createStoryEvidence('basket','joined-cake');
  const joined=basket.getObjectByName('合わせ餅'),left=joined.getObjectByName('敷き葉に残す餅'),right=joined.getObjectByName('継ぎ目から離す餅');
  const bounds=part=>new Box3().setFromObject(part);
  const stationary=bounds(left);
  assert.ok(Math.abs(stationary.max.x-bounds(right).min.x)<.01);
  right.position.x+=.044;
  assert.ok(bounds(right).min.x-stationary.max.x>.025);
  assert.ok(bounds(left).equals(stationary));
  for(const [half,outward] of [[left,1],[right,-1]]){
    const {position,normal}=half.geometry.attributes;
    let exposed=0;
    for(let i=0;i<position.count;i++){
      if(Math.abs(position.getX(i))>.004 || Math.abs(position.getZ(i))>.055
        || position.getY(i)<.034 || position.getY(i)>.078)continue;
      assert.ok(outward*normal.getX(i)>.9,'the torn face points toward the other half');
      exposed++;
    }
    assert.ok(exposed>20);
  }
});

test('unfolding either lunch leaf keeps the bitten rice on its liner and its crease on the mat',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const wrap=createStoryEvidence('basket','lunch-wrap');
  const cake=wrap.getObjectByName('ひと口欠けた昼餅'),original=new Box3().setFromObject(cake);
  const inner=wrap.getObjectByName('昼飯を覆う内葉'),outer=wrap.getObjectByName('昼飯を覆う外葉');
  const point=node=>node.getWorldPosition(new Vector3());
  const inside=point(inner.getObjectByName('竹皮をつまむ先'));
  for(const flap of [outer,inner]){
    const crease=point(flap),start=point(flap.getObjectByName('竹皮をつまむ先'));
    for(let i=0;i<=40;i++){
      const tip=point(openLunchLeaf(flap,i/40));
      assert.ok(tip.y>=crease.y-.001);
      assert.ok(point(flap).distanceTo(crease)<1e-8);
      assert.ok(new Box3().setFromObject(cake).equals(original));
      if(flap===outer)assert.ok(point(inner.getObjectByName('竹皮をつまむ先')).equals(inside));
      if(i===40)assert.ok(tip.distanceTo(start)>.25);
    }
  }
});

test('the tea falls from the flask into the actual cup and its near rim reaches the lower lip',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const stage=new Group(),handle=new Group(),stream=new Group(),drinker=new Group(),jaw=new Group();
  stage.position.set(18,4,-9);stage.rotation.y=.72;
  const flask=createStoryEvidence('bowl','mountain-flask'),tea=createStoryEvidence('bowl','rest-wish');
  stage.add(flask,tea,handle,stream,drinker);drinker.add(jaw);jaw.name='喉袋と下あご';
  tea.position.set(.37,.64,-.13);tea.rotation.y=.52;flask.position.set(-.27,.64,0);
  jaw.position.set(.45,1.13,-.47);jaw.rotation.y=-.4;
  const bottle=flask.getObjectByName('山茶の竹筒の胴'),lid=flask.getObjectByName('山茶の栓');
  const cup=tea.getObjectByName('湯呑み'),surface=cup.getObjectByName('湯呑みの茶面');
  const point=node=>node.getWorldPosition(new Vector3());
  const capRest=point(lid),cupRest=point(cup);handle.attach(bottle);
  const pour=pourTea(handle,bottle,cup,stream);
  pour(.65);
  assert.ok(stream.visible);
  assert.ok(point(stream).distanceTo(bottle.localToWorld(new Vector3(0,.282,.074)))<1e-7);
  assert.ok(stream.localToWorld(new Vector3(0,-.25,0)).distanceTo(point(surface))<1e-7);
  assert.ok(point(cup).distanceTo(cupRest)<1e-7 && point(lid).distanceTo(capRest)<1e-7);
  pour(1);assert.equal(stream.visible,false);
  const lift=new Group();stage.add(lift);lift.attach(cup);
  const rim=cup.localToWorld(new Vector3(0,.136,0)).addScaledVector(jaw.getWorldDirection(new Vector3()).setY(0).normalize(),-.094);
  const local=cup.worldToLocal(rim),sip=sipTea(lift,cup,drinker),full=surface.position.y;
  sip(1);
  assert.ok(cup.localToWorld(local).distanceTo(jaw.localToWorld(new Vector3(0,-.020,.373)))<1e-6);
  assert.ok(surface.position.y<full);
  assert.ok(surface.geometry.attributes.normal.getY(1)>.99);
  for(const t of [.62,.74,1]){
    sip(t);
    const ring=Array.from({length:128},(_,i)=>{
      const a=i*2*Math.PI/128;
      return surface.localToWorld(new Vector3(.087*Math.cos(a),.002,.087*Math.sin(a)));
    });
    const levels=ring.map(p=>p.y);
    assert.ok(Math.max(...levels)-Math.min(...levels)<1e-7,'tea remains level as the cup tips');
    const high=Math.max(...ring.map(p=>cup.worldToLocal(p).y));
    assert.ok(high<.1361);
    if(t===1)assert.ok(high>.1359,'tea reaches the lip');
  }
});

test('a clerk turns the free edge of the paper while its crease stays on the rotated desk',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  globalThis.document={createElement:()=>({getContext:()=>({clearRect(){},fillText(){}})})};
  t.after(()=>{delete globalThis.document;});
  for(const [variant,name,bound] of [['old-manifest','書付',false],['withdrawal-cover','見出しの表紙',true]]){
    const desk=new Group(),handle=new Group(),ledger=createStoryEvidence('ledger',variant);
    desk.position.set(-12,4,8);desk.rotation.y=.71;
    desk.add(handle,ledger);ledger.rotation.y=-.38;ledger.position.set(.25,.68,-.1);
    const page=ledger.getObjectByName(name);
    handle.attach(page);
    const turn=turnWorkPage(handle,page,'ledger','open'),fixed=turn.spine(),corner=turn.corner();
    assert.equal(turnWorkPage(handle,page,'ledger','lift'),null);
    for(let i=0;i<=36;i++){
      turn.pose(i/36);
      assert.ok(turn.spine().distanceTo(fixed)<1e-8);
      if(i===18)assert.ok(turn.corner().y>corner.y+.12);
    }
    if(bound)assert.ok(turn.corner().distanceTo(corner)>.25);
    else assert.ok(turn.corner().distanceTo(corner)<1e-8);
  }
});

test('the reader lowers a tilted article onto the closest edge, keeping the same grip as its pivot changes',()=>{
  const room=new Group(),desk=new Group(),handle=new Group(),wrist=new Group();
  room.rotation.y=-.6;room.position.set(9,2,-11);room.add(desk,handle,wrist);
  const article=new Mesh(new BoxGeometry(.21,.04,.31),new MeshBasicMaterial());
  handle.position.set(-.7,1.15,-.47);handle.rotation.x=.8;handle.add(article);
  wrist.position.set(-.72,1.2,-.48);
  const plan={width:2.2,depth:.74,top:.72};
  const rest=desk.getWorldQuaternion(new Quaternion()),contact=createWorkContact(handle,article,desk,plan);
  const original=article.getWorldPosition(new Vector3());
  const pinch=article.worldToLocal(contact.nearest(wrist.getWorldPosition(new Vector3())));
  const place=placeWithinReach(handle,article,contact,rest,wrist);
  assert.ok(article.getWorldPosition(new Vector3()).distanceTo(original)<1e-8);
  desk.attach(article);
  for(let i=0;i<=30;i++){
    const hand=place.pose(i/30);
    assert.ok(hand.distanceTo(article.localToWorld(pinch.clone()))<1e-7);
    const bottom=new Box3().setFromObject(article).min.y-room.position.y;
    assert.ok(bottom>=plan.top-1e-7);
    if(i===30)assert.ok(bottom-plan.top<.008);
  }
  assert.ok(article.getWorldQuaternion(new Quaternion()).angleTo(rest)<1e-6);
  assert.ok(article.position.x<-.65);
});

test('the cargo note fits inside its tube, clears its mouth lengthwise and opens on the desk',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  globalThis.document={createElement:()=>({getContext:()=>({clearRect(){},fillText(){}})})};
  t.after(()=>{delete globalThis.document;});
  const room=new Group(),model=createStoryEvidence('ledger','old-manifest');
  room.position.set(-20,4,6);room.rotation.y=.85;room.add(model);
  const tube=model.getObjectByName('漆の内筒'),note=model.getObjectByName('書付'),cap=tube.getObjectByName('漆筒の栓');
  sealCargoNote(model);
  function vertices(){
    const points=[];
    note.traverse(n=>{
      if(!n.isMesh)return;
      const p=n.geometry.attributes.position;
      for(let i=0;i<p.count;i++)points.push(tube.worldToLocal(n.localToWorld(new Vector3().fromBufferAttribute(p,i))));
    });
    return points;
  }
  assert.ok(vertices().every(p=>Math.hypot(p.x,p.y-.07)<.055 && p.z>-.146 && p.z<.18));
  for(const [part,act] of [[cap,'unplug'],[note,'extract'],[note,'spread']]){
    const handle=new Group(),parent=part.parent;room.add(handle);
    handle.position.copy(room.worldToLocal(part.getWorldPosition(new Vector3())));handle.attach(part);
    const move=readCargoNote(handle,part,model,act);
    move.pose(.43);
    if(act==='extract')assert.ok(vertices().every(p=>p.z<-.14));
    move.pose(1);parent.attach(part);handle.removeFromParent();
  }
  const sheet=new Box3().setFromPoints(vertices());
  assert.ok(sheet.max.y<.013 && sheet.max.x<-.07 && sheet.max.x-sheet.min.x>.435);
});
