// Each entry is one physical object, from its first counter through the
// courier's wrap to its recipient. The notebook supplies its saved owner.
import { Box3, Group, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { createParcelWrap, createStoryEvidence, createStoryFood } from './story-crafts.js';
import { dividePastry } from './mochiyori-cut.js';
import { CHAPTERS } from './mochiyori-story.js';
import { PARCELS } from './mochiyori-parcels.js';
import { tablePlan } from './story-table-plan.js';

const models = {
  'ferry-leaf':['basket','ferry-leaf'], 'test-rice':['rice','same-rice'],
  'steamer-bars':['steamer','packing-bars'], 'wedding-print':['ledger','wedding-print'],
  'trial-print':['ledger','trial-print'], 'trial-cloth':['cloth','mended-cloth'],
  'terrace-inquiry':['ledger','terrace-letter'], 'sakai-date':['ledger','sakai-date'],
  'dawn-date':['ledger','dawn-date'], 'inari-date':['ledger','inari-date'],
  'mountain-tea-flask':['bowl','mountain-flask'], 'coast-hinge':['hinge','broken-hinge'],
  'salvaged-tools':['crate','salvaged-tools'], 'purchase-copy':['ledger','purchase-list'],
  'tool-rubbing':['ledger','tool-rubbing'], 'board-loan':['ledger','loan-slip'],
  'regional-register':['ledger','regional-returns'], 'kyo-return-tag':['tag','kyo-return-tag'],
  'winter-seal':['tag','festival-maker-tag'], 'makers-seals':['tag','signed-maker-tag'],
  'receipt-copy':['ledger','submission-check'], 'print-order':['ledger','omission-copy'],
  'peach-invite':['ledger','peach-invite'], 'palace-invite':['ledger','palace-invite'],
  'peach-reply':['ledger','peach-reply'], 'pearl-sample':['food','ryugu'],
  'festival-bowl':['bowl','lidded-bowl']
};
const sites = new Map();
for (const [chapterIndex, ch] of CHAPTERS.entries()) {
  const verdict = ch.verdictRegion + '/' + (ch.verdictPlace || '');
  sites.set('end/'+ch.id,{key:verdict,chapterIndex});
  // Only the festival request issues parcels, at Kanbei's own storehouse.
  sites.set('request/'+ch.id,{key:verdict,chapterIndex});
  for (const c of ch.clues) sites.set(c.id,{key:c.region+'/'+(c.place || ''),chapterIndex});
}
const byEvent=new Map();
for(const p of PARCELS)for(const event of [p.source,p.target]){
  const key=event.includes('/')?event:'clue/'+event;
  if(!byEvent.has(key))byEvent.set(key,[]);
  byEvent.get(key).push(p);
}
export function parcelFor(key,spec) {
  return byEvent.get(key)?.find(p=>{
    const [code,variant]=models[p.id];
    return spec.code===code && (spec.variant || spec.region)===variant;
  })?.id;
}

function makeItem(item){
  const [code,variant]=models[item.id];
  const model=code==='food'?createStoryFood(13):createStoryEvidence(code,variant);
  if(item.id==='coast-hinge')model.getObjectByName('切れた綱')?.removeFromParent();
  model.name=item.name;
  model.userData.parcelId=item.id;
  const bounds=new Box3().setFromObject(model);
  return {item,model,bounds,claimed:false,home:null,owner:null,handling:null,returnToHome:null};
}
const v=()=>new Vector3();
const q=()=>new Quaternion();
const localBounds=(table,node)=>{
  const inverse=table.matrixWorld.clone().invert(), bounds=new Box3();
  node.traverseVisible(m=>{
    if(!m.isMesh)return;
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    bounds.union(m.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(m.matrixWorld)));
  });
  return bounds;
};
function at(parent,x,y,z,packed=false){
  const socket=new Group();
  socket.position.set(x,y,z);parent.add(socket);
  return {socket,packed,scale:1};
}
function fit(model,location){
  model.position.copy(location.offset || new Vector3());
  model.quaternion.identity();
  model.scale.setScalar(location.scale);
  model.visible=!location.packed;
}
function packedPlace(pouch,rec){
  const size=rec.bounds.getSize(v()),center=rec.bounds.getCenter(v());
  const place=at(pouch,0,.086,0,true);
  place.scale=Math.min(1,.50/size.x,.29/size.z,.255/size.y);
  place.offset=new Vector3(-center.x,-rec.bounds.min.y,-center.z).multiplyScalar(place.scale);
  // The court clerk files this loose receipt in the hanging archive wrap.
  // Its lowest rim is .34 m high. Let go when the sheet is fully inside.
  if(rec.item.id==='receipt-copy'){
    place.release=place.offset.clone();
    place.release.y+=Math.max(0,.30-place.socket.position.y-size.y*place.scale);
  }
  place.socket.userData.foldMouth=true;
  return place;
}

// Keep the open parcels on clear patches of wood. A full counter keeps the
// rest in its cloth pouch; later examinations draw from that same opening.
function storage(site,table,actor,group,residents=[]){
  if(!table){
    const pouch=createParcelWrap();
    pouch.name=site.name+'の文包み';
    // External actors include the seated temple mochi. Use the ground under
    // the resident, irrespective of their model's inherited scale.
    const ground=new Group();group.add(ground);
    const feet=actor.getWorldPosition(v());
    const yaw=actor.getWorldQuaternion(q());
    feet.add(new Vector3(-.66,.012,.34).applyQuaternion(yaw));
    ground.position.copy(ground.parent.worldToLocal(feet));
    ground.add(pouch);
    return {pouch,home:rec=>packedPlace(pouch,rec),ground};
  }
  const plan=table.userData.width && table.userData.depth ? table.userData : tablePlan(site.number,site.place);
  table.updateWorldMatrix(true,true);
  const obstacles=table.children.slice(1).filter(c=>c.visible && !c.userData.storyStorage).map(c=>localBounds(table,c));
  const top=table.userData.worktop;
  const pouch=createParcelWrap();
  pouch.name=site.name+'の預かり袋';pouch.userData.storyStorage=true;
  const workers=residents.map(person=>table.worldToLocal(person.actor.getWorldPosition(v())));
  const nearWorker=(x,z)=>workers.length ? Math.min(...workers.map(p=>Math.hypot(x-p.x,z-p.z))) : Math.abs(x);
  // The keeper hangs the pouch from the staff rail, outside the drawer slide.
  // Pick the end nearest a resident who can unfasten it while standing.
  const end=plan.width*.5-.23,back=-plan.depth*.5-.095;
  pouch.position.set(nearWorker(-end,back)<nearWorker(end,back)?-end:end,top-.40,back);
  const clerkTray=site.place==='court' && table.children.find(o=>
    o.name==='引き出し脇の折敷' && Math.sign(o.position.x)===Math.sign(pouch.position.x));
  if(clerkTray){
    // At the court the receipt book has to pass back and forth frequently.
    // Open the archive wrap on its own tray with clear access from above.
    pouch.userData.storyWorkObstacle=true;
    pouch.position.set(Math.sign(clerkTray.position.x)*.105,clerkTray.userData.worktop+.003,0);
    clerkTray.add(pouch);
  }else table.add(pouch);
  function home(record){
    const {bounds,item}=record, size=bounds.getSize(v()),center=bounds.getCenter(v());
    const scale=Math.min(1,.54/size.x,.39/size.z,.32/size.y);
    const w=size.x*scale,d=size.z*scale;
    const cradle=item.id==='coast-hinge' && site.place==='shore' && table.getObjectByName('蝶番を受ける舟大工の台木');
    if(cradle){
      const place=at(table,cradle.position.x,cradle.position.y+cradle.userData.worktop,cradle.position.z);
      place.scale=scale;place.offset=new Vector3(-center.x,-bounds.min.y,-center.z).multiplyScalar(scale);
      return place;
    }
    const candidates=item.id==='ferry-leaf'?[[.63,.39]]:item.id==='steamer-bars'?[[-.57,.31]]:[];
    const spots=[];
    for(const z of [-plan.depth*.5+d*.5+.025,plan.depth*.5-d*.5-.025,0]){
      for(const x of [-.99,.98,-.51,.48,-.05,-.78,.72,.24,-.28])spots.push([x,z]);
    }
    spots.sort(([x,z],[u,w])=>nearWorker(x,z)-nearWorker(u,w));
    candidates.push(...spots);
    for(const [x,z] of candidates){
      if(Math.abs(x)+w*.5>plan.width*.5-.02 || Math.abs(z)+d*.5>plan.depth*.5-.01)continue;
      const footprint=new Box3(new Vector3(x-w*.5-.014,top+.001,z-d*.5-.014),
        new Vector3(x+w*.5+.014,top+size.y*scale+.018,z+d*.5+.014));
      if(obstacles.some(b=>b.intersectsBox(footprint)))continue;
      obstacles.push(footprint);
      const place=at(table,x,top+.005,z);place.scale=scale;
      place.offset=new Vector3(-center.x,-bounds.min.y,-center.z).multiplyScalar(scale);
      return place;
    }
    return packedPlace(pouch,record);
  }
  return {home,pouch};
}

export function createParcelWorld(group,book,getHero) {
  const records=new Map(), homes=new WeakMap(), repairedSteamers=new WeakMap();
  let nearby=new Map(),bag,heroBody,dirty=true,served=false;
  const bagSlots=new Map();
  function recordFor(id){
    if(!records.has(id))records.set(id,makeItem(PARCELS.find(p=>p.id===id)));
    return records.get(id);
  }
  function settleServing(){
    const bowl=records.get('festival-bowl'),sample=records.get('pearl-sample');
    if(!bowl && !sample)return;
    if(served){
      const vessel=recordFor('festival-bowl').model;
      const socket=vessel.getObjectByName('水中の餅の置き場');
      if(!socket)return;
      if(!socket.getObjectByName('取り分けた半分')){
        const plate=recordFor('pearl-sample').model;
        const cake=plate.getObjectByName('取り分ける餅');
        const cut=plate.getObjectByName('手元に残る半分')?.parent || dividePastry(cake,'ryugu');
        const wet=cut.getObjectByName('取り分けた半分');
        if(wet){socket.add(wet);wet.position.set(0,0,0);wet.quaternion.identity();wet.scale.setScalar(.78);}
      }
      if(!bowl?.claimed){
        const lid=vessel.getObjectByName('水鉢の合い蓋');
        lid.position.set(0,0,0);lid.quaternion.identity();
      }
    }else if(bowl && sample && !bowl.claimed && !sample.claimed && !bowl.handling && !sample.handling){
      const cut=sample.model.getObjectByName('手元に残る半分')?.parent;
      if(cut){
        cut.removeFromParent();
        bowl.model.getObjectByName('取り分けた半分')?.removeFromParent();
        sample.model.getObjectByName('取り分ける餅').visible=true;
      }
    }
  }
  function heroHome(rec){
    const hero=getHero();
    if(!hero)return null;
    if(heroBody!==hero){
      bag?.removeFromParent();
      heroBody=hero;
      // An empty attachment keeps the stowing gesture on the moving flank.
      bag=new Group();
      bag.name='配達人の風呂敷';
      (hero.getObjectByName('roll') || hero).add(bag);
      bag.position.set(-.50,.53,-.57);bag.rotation.y=-2.55;
      bagSlots.clear();
    }
    if(!rec)return null;
    if(!bagSlots.has(rec.item.id))bagSlots.set(rec.item.id,packedPlace(bag,rec));
    return bagSlots.get(rec.item.id);
  }
  function siteHome(site,rec){
    if(rec.item.id==='steamer-bars' && site.site.region==='spring'){
      const fitting=repairedSteamers.get(site.table);
      if(fitting)return fitting;
    }
    let holder=homes.get(site.table || site.actor);
    if(!holder){
      holder=storage(site.site,site.table,site.actor,group,site.residents);holder.spots=new Map();
      homes.set(site.table || site.actor,holder);
    }
    if(!holder.spots.has(rec.item.id))holder.spots.set(rec.item.id,holder.home(rec));
    const home=holder.spots.get(rec.item.id);
    home.socket.name=rec.item.name+'の置き場';
    home.counter=site.table;
    return home;
  }
  function dock(rec,home){
    rec.handling=null;rec.home=home;
    if(!home){rec.model.removeFromParent();return;}
    home.socket.add(rec.model);fit(rec.model,home);
    if(home.counter)home.counter.userData.rigRevision=(home.counter.userData.rigRevision || 0)+1;
    if(rec.item.id==='winter-seal' || rec.item.id==='makers-seals'){
      rec.model.getObjectByName('望の薄の印').visible=rec.item.id==='makers-seals';
    }
    if(home.installed){
      for(let i=0;i<3;i++){
        const rail=rec.model.getObjectByName('取り外し桟'+i);
        rail.position.set((i-1)*.213,.169,0);rail.quaternion.identity();rail.scale.setScalar(1);
      }
      const lid=home.socket.parent.getObjectByName('蒸し箱の上段');
      lid.position.set(0,.212,0);
    }
    if(rec.item.id==='festival-bowl' || rec.item.id==='pearl-sample')settleServing();
  }
  function sendHome(rec,home,adjust) {
    // A scene can give this object a new owner while the resident is still
    // tidying. Only the last handoff may dock it or hide it at the flank.
    rec.handling=null;
    rec.home=home;
    const model=rec.model;
    const position=home?.offset?.clone() || v();
    const streamed=!home || !model.parent || !group.parent ||
      model.getWorldPosition(v()).distanceToSquared(home.socket.localToWorld(position.clone()))>64;
    if(streamed || home.installed || model.parent===home.socket && model.position.distanceToSquared(position)<.000001){
      adjust?.(1);dock(rec,home);return;
    }
    const handling={};
    rec.handling=handling;
    const finish=()=>{
      if(rec.handling!==handling || rec.claimed || rec.home!==home)return;
      adjust?.(1);dock(rec,home);
    };
    if(rec.returnToHome){
      const courier=home.socket.parent===bag;
      rec.returnToHome({model,parent:home.socket,position:!courier && home.release?home.release:position,rotation:q(),scale:v().setScalar(home.scale),
        packed:!!home.packed,courier,adjust,finish});
    }else{
      // Restoring a save or presenting the notebook has no resident on duty.
      // A streamed arrangement is installed together on the next world tick.
      handling.restore=finish;
    }
  }
  function reconcile(){
    dirty=false;
    const carried=new Set(book.inventory().map(p=>p.id));
    const delivered=new Set(book.deliveredItems().map(p=>p.id));
    served=delivered.has('pearl-sample');
    const signed=carried.has('makers-seals') || delivered.has('makers-seals');
    if(signed && records.has('winter-seal')){
      const sheet=records.get('winter-seal'),item=PARCELS.find(p=>p.id==='makers-seals');
      sheet.item=item;sheet.model.name=item.name;sheet.model.userData.parcelId=item.id;
      sheet.model.getObjectByName('望の薄の印').visible=true;
      records.delete('winter-seal');records.set(item.id,sheet);
    }
    for(const item of PARCELS){
      // The second maker stamps the actual sheet brought from the snow inn.
      if(item.id===(signed?'winter-seal':'makers-seals'))continue;
      const phase=delivered.has(item.id)?'destination':carried.has(item.id)?'bag':'source';
      const site=sites.get(phase==='destination'?item.target:item.source);
      const station=nearby.get(site.key);
      const reachable=phase==='bag' || (phase==='destination' || site.chapterIndex===book.index || item.id==='coast-hinge') && station;
      let rec=records.get(item.id);
      if(!reachable && !rec)continue;
      if(!rec)rec=recordFor(item.id);
      const home=!reachable?null:phase==='bag'?heroHome(rec):siteHome(station,rec);
      if(rec.home===home && rec.owner===phase)continue;
      const changing=rec.owner!==null && rec.owner!==phase && !!rec.home;
      rec.owner=phase;
      if(rec.claimed){rec.home=home;continue;}
      if(changing)sendHome(rec,home);else dock(rec,home);
    }
    if(served)settleServing();
  }
  function visit(stations,speakers){
    nearby=new Map(stations.map(s=>[s.site.key,{...s,residents:speakers.filter(w=>w.site.key===s.site.key)}]));
    for(const s of stations){
      if(s.site.place==='shore'){
        const beach=s.table.children.find(n=>n.userData.storyVariant==='broken-hinge');
        if(beach){
          beach.getObjectByName('欠けた蝶番')?.removeFromParent();
          beach.userData.storyVariant='shore-rope';
        }
      }
      if(s.site.region!=='spring' || repairedSteamers.has(s.table))continue;
      const body=s.table.children.find(n=>n.userData.storyVariant==='repair-body');
      if(body){
        const fitting=at(body,0,0,0);fitting.installed=true;fitting.counter=s.table;repairedSteamers.set(s.table,fitting);
      }
    }
    for(const s of speakers)if(!nearby.has(s.site.key))nearby.set(s.site.key,s);
    heroHome();
    for(const s of nearby.values()){
      const store=homes.get(s.table || s.actor);
      if(store?.ground && store.ground.parent!==group)group.add(store.ground);
    }
    reconcile();
  }
  function parcelObject(id){
    const rec=records.get(id);
    return rec?.home && !rec.claimed && rec.model.parent ? rec.model : null;
  }
  function localParcel(key,spec,index,site){
    const authored=parcelFor(key,spec);
    if(authored || !site || !spec.variant)return authored;
    for(const rec of records.values()){
      const [code,variant]=models[rec.item.id];
      if(code!==spec.code || variant!==spec.variant || !rec.home)continue;
      if(rec.owner==='bag' || (rec.owner==='destination' && sites.get(rec.item.target).key===site.key))return rec.item.id;
    }
  }
  function claimParcel(id,obj){
    const rec=records.get(id);
    if(rec?.model!==obj)return false;
    rec.handling=null;rec.claimed=true;
    return true;
  }
  function releaseParcel(id,obj,adjust,returnToHome){
    const rec=records.get(id) || (id==='winter-seal' && records.get('makers-seals'));
    if(rec?.model!==obj)return false;
    if(dirty)reconcile();
    if(returnToHome)rec.returnToHome=returnToHome;
    rec.claimed=false;
    sendHome(rec,rec.home,adjust);
    return true;
  }
  function update(){
    if(dirty)reconcile();
    for(const rec of records.values())rec.handling?.restore?.();
  }
  function pickupObject(event){
    const item=byEvent.get('clue/'+event)?.find(p=>p.source===event);
    return item && parcelObject(item.id);
  }
  return {visit,update,invalidate(){dirty=true;},parcelFor:localParcel,parcelObject,claimParcel,releaseParcel,pickupObject};
}
