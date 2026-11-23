import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Scene, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { PARCELS } from '../two/mochiyori-parcels.js';
import { performedScenes } from '../two/mochiyori-scenes.js';
import { createStoryStillLife } from '../two/story-crafts.js';
import { createParcelWorld, parcelFor } from '../two/story-parcel-world.js';

test('both ends of every parcel journey use its actual object in the score',()=>{
  for(const p of PARCELS)for(const e of [p.source,p.target]){
    const key=e.includes('/')?e:'clue/'+e;
    assert.ok(performedScenes.get(key).props.some(s=>parcelFor(key,s)===p.id || s.signedAs===p.id),p.id+' at '+key);
  }
});

function paperCanvas(t){
  const brush={clearRect(){},fillText(){},fillRect(){},save(){},restore(){},beginPath(){},ellipse(){},fill(){},clip(){}};
  globalThis.document={createElement:()=>({getContext:()=>brush})};
  t.after(()=>{delete globalThis.document;});
}

function workshop(t) {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Scene(),group=new Group(),hero=new Group(),roll=new Group();
  roll.name='roll';hero.add(roll);scene.add(group,hero);
  const items=[],delivered=[],book={index:0,inventory:()=>items,deliveredItems:()=>delivered};
  const world=createParcelWorld(group,book,()=>hero);
  function site(region,number){
    const table=createStoryStillLife(number);
    group.add(table);return {site:{number,key:region+'/',region,name:region},table};
  }
  let time=0;
  function settle(){for(let i=0;i<120;i++)world.update(time+=1/60);}
  return {world,hero,book,items,delivered,site,settle,group};
}
const position=o=>o.getWorldPosition(new Vector3());
const parcel=id=>PARCELS.find(p=>p.id===id);

test('the court receipt clears the cloth rim before the clerk lets it settle',t=>{
  paperCanvas(t);
  const {world,book,group}=workshop(t),clerk=new Group(),wrist=new Group();
  group.add(clerk,wrist);book.index=6;
  const court={key:'kyo/court',region:'kyo',place:'court',name:'評定所の白洲'};
  world.visit([],[{site:court,actor:clerk}]);
  const paper=world.pickupObject('submission-check'),socket=paper.parent;
  assert.ok(socket.userData.foldMouth);
  world.claimParcel('receipt-copy',paper);wrist.attach(paper);paper.visible=true;
  wrist.position.y+=.65;
  let delivery;world.releaseParcel('receipt-copy',paper,null,job=>{delivery=job;});
  assert.equal(delivery.parent,socket);assert.equal(delivery.packed,true);
  socket.attach(paper);paper.position.copy(delivery.position);paper.scale.copy(delivery.scale);
  const top=new Box3().setFromObject(paper).max.y-position(socket.parent).y;
  assert.ok(top>.28 && top<.32);
  const release=position(paper);delivery.finish();
  assert.equal(paper.visible,false);
  assert.ok(release.y-position(paper).y>.10);
});

test('the court archive wrap sits on a reserved side tray above the drawer',t=>{
  paperCanvas(t);
  const {world,book,site}=workshop(t),{table}=site('kyo',11);book.index=6;
  for(const side of [-1,1]){
    const tray=new Group();tray.name='引き出し脇の折敷';tray.position.set(side*1.165,0,-.83);
    Object.assign(tray.userData,{width:.98,depth:.55,worktop:.75,storyStorage:true});table.add(tray);
  }
  world.visit([{table,site:{key:'kyo/court',region:'kyo',place:'court',number:11,name:'白洲'}}],[]);
  const wrap=table.getObjectByName('白洲の預かり袋'),tray=wrap.parent;
  assert.equal(tray.name,'引き出し脇の折敷');assert.equal(wrap.userData.storyWorkObstacle,true);
  assert.ok(Math.abs(wrap.position.y-tray.userData.worktop)<.005);
  assert.ok(Math.abs(wrap.position.x)+.30<tray.userData.width*.5);
});

test('one leaf goes from counter to pack, travels, can be inspected and stays with the recipient',t=>{
  const {world,hero,items,delivered,site,settle}=workshop(t),river=site('river',1);
  world.visit([river],[]);
  const flank=hero.getObjectByName('配達人の風呂敷');
  assert.equal(flank.parent.name,'roll');
  assert.deepEqual(flank.position.toArray(),[-.50,.53,-.57]);
  assert.equal(flank.getObjectByProperty('isMesh',true),undefined);
  const leaf=world.pickupObject('leaf-marks'),spot=leaf.parent,home=position(leaf);
  assert.equal(leaf.visible,true);
  world.claimParcel('ferry-leaf',leaf);
  const hand=new Group();hero.add(hand);hand.position.set(-.7,1,.3);hand.add(leaf);leaf.position.set(0,0,0);
  const start=position(leaf);
  items.push(parcel('ferry-leaf'));world.invalidate();
  world.releaseParcel('ferry-leaf',leaf);
  assert.ok(position(leaf).distanceTo(start)<1e-7);
  settle();assert.equal(leaf.visible,false);
  const packed=position(leaf);
  hero.position.x+=6;
  assert.ok(Math.abs(position(leaf).x-packed.x-6)<1e-6);
  world.visit([],[]);assert.equal(world.parcelObject('ferry-leaf'),leaf);
  hero.position.x-=6;world.visit([river],[]);
  world.claimParcel('ferry-leaf',leaf);hand.attach(leaf);
  items.pop();delivered.push(parcel('ferry-leaf'));world.invalidate();world.releaseParcel('ferry-leaf',leaf);settle();
  assert.equal(world.parcelObject('ferry-leaf'),leaf);
  assert.equal(leaf.parent,spot);assert.ok(position(leaf).distanceTo(home)<1e-6);
  assert.equal(leaf.visible,true);
});

test('the recovered rails live in the repaired steamer even after unloading the district',t=>{
  const {world,book,items,delivered,site,settle}=workshop(t);
  book.index=1;const market=site('market',3),spring=site('spring',4),rails=parcel('steamer-bars');
  world.visit([market],[]);const model=world.pickupObject('packing-bars');assert.ok(model.visible);
  items.push(rails);world.invalidate();settle();world.visit([spring],[]);
  items.pop();delivered.push(rails);world.invalidate();settle();
  const steamer=spring.table.children.find(c=>c.userData.storyVariant==='repair-body');
  for(let i=0;i<3;i++){
    const rail=model.getObjectByName('取り外し桟'+i);
    assert.ok(steamer.worldToLocal(position(rail)).distanceTo(new Vector3((i-1)*.213,.169,0))<1e-5);
  }
  assert.equal(steamer.getObjectByName('蒸し箱の上段').position.y,.212);
  const rice=parcel('test-rice'),spec={code:'rice',variant:'same-rice'};
  delivered.push(rice);world.invalidate();settle();
  assert.equal(world.parcelFor('clue/steam-repair',spec,1,spring.site),rice.id);
  assert.equal(world.parcelFor('clue/steam-repair',spec,1,market.site),undefined);
  world.visit([],[]);world.visit([spring],[]);assert.equal(world.parcelObject(rails.id),model);
});

test('the second seal is stamped onto the same paper the courier brought from the inn',t=>{
  paperCanvas(t);
  const {world,book,items,delivered,site,settle}=workshop(t),first=parcel('winter-seal'),signed=parcel('makers-seals');
  book.index=6;items.push(first);world.visit([site('moon',9)],[]);
  const sheet=world.parcelObject(first.id);world.claimParcel(first.id,sheet);
  assert.equal(sheet.getObjectByName('望の薄の印').visible,false);
  items.splice(0,1,signed);delivered.push(first);world.invalidate();world.releaseParcel(first.id,sheet);settle();
  assert.equal(world.parcelObject(signed.id),sheet);assert.equal(world.parcelObject(first.id),null);
  assert.equal(sheet.getObjectByName('望の薄の印').visible,true);
});

test('a resumed festival keeps the wet sample inside the bowl and the dry portion at Sakai',t=>{
  paperCanvas(t);
  const {world,book,items,delivered,site}=workshop(t);
  book.index=7;items.push(parcel('festival-bowl'));delivered.push(parcel('pearl-sample'));
  world.visit([site('sakai',17)],[]);
  const bowl=world.parcelObject('festival-bowl'),plate=world.parcelObject('pearl-sample');
  const wet=bowl.getObjectByName('取り分けた半分');
  assert.equal(wet.parent.name,'水中の餅の置き場');
  assert.equal(bowl.getObjectByName('水鉢の合い蓋').position.length(),0);
  assert.ok(plate.getObjectByName('手元に残る半分'));
  assert.equal(plate.getObjectByName('取り分ける餅').visible,false);
  assert.equal(plate.getObjectByName(wet.name),undefined);
  world.visit([],[]);assert.equal(bowl.getObjectByName(wet.name),wet);
});

test('a parcel stays on its support until a worker takes it, even when ownership changes mid-return',t=>{
  const {world,hero,items,delivered,site,settle}=workshop(t),river=site('river',1);
  world.visit([river],[]);
  const leaf=world.pickupObject('leaf-marks'),counter=leaf.parent;
  const wrist=new Group();hero.add(wrist);wrist.position.set(-.65,1,.4);
  world.claimParcel('ferry-leaf',leaf);wrist.attach(leaf);
  const jobs=[];
  items.push(parcel('ferry-leaf'));world.invalidate();
  world.releaseParcel('ferry-leaf',leaf,undefined,job=>jobs.push(job));
  settle();
  assert.equal(jobs.length,1);assert.equal(jobs[0].courier,true);
  assert.equal(leaf.parent,wrist);assert.equal(leaf.visible,true);
  wrist.position.y+=.12;
  const contact=position(leaf);
  assert.equal(world.claimParcel('ferry-leaf',leaf),true);
  jobs[0].finish();
  assert.equal(leaf.parent,wrist);assert.ok(position(leaf).distanceTo(contact)<1e-7);
  items.pop();delivered.push(parcel('ferry-leaf'));world.invalidate();
  world.releaseParcel('ferry-leaf',leaf,undefined,job=>jobs.push(job));
  assert.equal(jobs.length,2);assert.equal(jobs[1].parent,counter);assert.equal(jobs[1].courier,false);
  jobs[1].finish();jobs[0].finish();settle();
  assert.equal(leaf.parent,counter);assert.equal(leaf.visible,true);
});

test('the shore hinge rests on its two timbers with a free edge for the turtle beak',t=>{
  const {world,book,group}=workshop(t);book.index=4;
  const table=createStoryStillLife(6,0,'shore');group.add(table);
  world.visit([{table,site:{key:'coast/shore',place:'shore',number:6,region:'coast',name:'松原の浜'}}],[]);
  const hinge=world.parcelObject('coast-hinge'),support=table.getObjectByName('蝶番を受ける舟大工の台木');
  table.updateWorldMatrix(true,true);
  const metal=new Box3().setFromObject(hinge),wood=new Box3().setFromObject(support);
  assert.ok(Math.abs(metal.min.y-wood.max.y)<.002);
  assert.ok(metal.max.x>wood.max.x+.025 && metal.min.x<wood.min.x-.025);
  assert.ok(wood.max.y-table.userData.worktop>.12);
});
