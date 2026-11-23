import { hands as witnessHands } from './story-witness-hands.js';
import { stageWalks, stagePickup, poseStageWalk } from './story-stage-blocking.js';
import { worktopHeadroom } from './story-headroom.js';
import { createToolRests } from './story-work-drawer.js';
import { fitToSocket, placeWithinReach, turnWorkPage, needsSetDown } from './story-prop-socket.js';
import { makeSteam, makeAccessories, sipTea, pourTea, poseStorySteam } from './mochiyori-hand-props.js';
import * as T from './vendor/three.module.min.js';
import { CAST, SCENES } from './mochiyori-story.js';
import { createStoryCharacter, poseStoryCharacter, storyGrip, storyTool, createStoryTool } from './story-models.js';
import * as crafts from './story-crafts.js';
import { batchActorParts } from './actors.js';
import { dividePastry, servingLiner, levelServing, dishRim } from './mochiyori-cut.js';
import { frameStoryHands, sightMesh } from './story-camera-framing.js';
import { bearingHeight, createWorkContact, followStoryGrip, storyBodyCores } from './story-prop-contacts.js';
import { tablePlan } from './story-table-plan.js';
import { makeRiceModel, poseRice, placeRiceGrip, reachRiceGrip } from './mochi-model.js';

const people = new Map(CAST.map(p => [p.name,p]));
const courier = '配達人のお餅';
const vec = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const smooth = t => T.MathUtils.smoothstep(t,0,1);
const box = new T.Box3();
const helpers = {'炭焼き':['蛙','炭を焼く人'],'茶屋の亭主':['兎','茶屋の亭主']};
function buildActor(name,guest,rests) {
  const group = new T.Group();
  group.name = name;
  if (name === courier) {
    const rice = makeRiceModel(group);
    rice.smile=0;
    const neutral={grounded:true,mode:'normal',gestureSample:{time:0,weight:1}};
    // Hand_R/L are wrist bones. Use the padded palm on the rice skin, just in
    // front of each wrist, as the point that meets the edge of a tray.
    const palms=rice.hands.map((bone,i)=>{
      const pad=new T.Group();pad.name=i?'お餅の左掌':'お餅の右掌';
      pad.position.set(i?.15:-.15,-.036,.158);bone.add(pad);return pad;
    });
    const resting=[rice.chest,...rice.hands].map(joint=>({joint,at:joint.position.clone(),rotation:joint.quaternion.clone()}));
    return {group, name, canHold:true, mouth:group.getObjectByName('配達人の口元'),
      idle(t,active,phase,tasting=false) {
        neutral.gestureSample.time=t;neutral.gestureSample.weight=tasting?smooth(phase/.2):1;
        poseRice(rice,neutral,t,0,tasting?'eating':'curious');
        for(const [i,palm] of palms.entries())placeRiceGrip(rice,i,palm);
        for(const j of resting){j.at.copy(j.joint.position);j.rotation.copy(j.joint.quaternion);}
      },
      hand(side) {return palms[side==='right'?0:1];},
      grasp(right,left,tasting=false) {
        for(const j of resting){j.joint.position.copy(j.at);j.joint.quaternion.copy(j.rotation);}
        [right,left].forEach((target,i) => {
          if (!target) return;
          reachRiceGrip(rice,i,palms[i],{point:target,strength:1,taste:tasting,handoff:!tasting && i===0});
        });
      }
    };
  }
  const role=helpers[name] || ['兎','旅の手伝い'];
  const person=people.get(name) || {name,id:'guest_01_02',species:role[0],occupation:role[1]};
  const body=createStoryCharacter(person,{festivalGuest:guest});
  body.userData.storyPerforming=true;
  group.add(body);
  const limb=witnessHands({actor:body,person});
  return {group,name,species:person.species,canHold:!!storyGrip(body),
    idle(t,active,phase,tasting=false,speed=0) {limb.restore();poseStoryCharacter(body,t,active,{phase,speed,effort:active?.8:0});},
    hand(side) {return limb[side];},
    grasp(right,left,tasting,support) {limb.pose(right,left,support,.82);},
    costume(on) {for (const side of ['right','left']) {const tool=storyTool(body,side);if(on)rests.dress(body,tool,storyGrip(body,side));else rests.undress(tool);}}
  };
}
const singleHand = new Set(['point','write','tie','fit','divide']);
function objectFor(spec) {
  if (spec.code === 'tool') return createStoryTool(spec.role,spec.index);
  if (spec.code === 'food') return crafts.createStoryFood(SCENES.findIndex(s => s.region===spec.region)+1);
  return crafts.createStoryEvidence(spec.code,spec.variant);
}
function element(tag, cls, text) {
  const node=document.createElement(tag); node.className=cls;
  if(text) node.textContent=text;
  return node;
}
function control(text,fn) {
  const b=element('button','scene-button',text); b.type='button'; b.onclick=fn; return b;
}
// Props have real pivots at the part being held. The detached tier, for
// instance, can leave the steamer while its pot and hearth stay on the table.
export function createPerformance({scene,camera,dialog,enter,leave,draw}) {
  const rests=createToolRests();
  const basinStand=new T.Group();
  batchActorParts(basinStand,b=>{
    for(let j=0;j<3;j++)b.box(0,.35,(j-1)*.16,.72,.05,.154,j===1?'#ad936a':'#b69a72');
    for(const x of [-.27,.27]) for(const z of [-.15,.15]) b.rod([x*1.08,0,z*1.10],[x,.34,z],.037,'#866f51',.041);
    b.rod([-.28,.16,.15],[.28,.16,.15],.021,'#a28960');
  });
  basinStand.scale.set(1.65,.82,1.65);
  const inspectionLight=new T.PointLight(0xffebd0,1.6,4.5,1.7);
  inspectionLight.position.set(-.70,2.48,1.09);
  let festivalTable;
  const stage=new T.Group(), castCache=new Map(), tableCache=new Map();
  stage.name='現地の所作'; stage.visible=false; scene.add(stage);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const overlay=element('section','scene-player'),top=element('div','scene-top'), caption=element('div','scene-caption');
  const place=element('span','scene-place'), title=element('h2','scene-title'), line=element('p','scene-line'), by=element('span','scene-actor');
  title.id='performance-title'; line.setAttribute('aria-live','polite');
  const back=control('帳面に戻る',()=>finish(false)), prev=control('前の所作',()=>go(index-1)), next=control('次の所作',advance);
  const again=control('もう一度',()=>go(index)), lens=control('手元を拡大',()=>{
    detail=!detail;
    if(reduced.matches) lensProgress=Number(detail);
    lens.textContent=detail?'全景を見る':'手元を拡大';
    redraw();
  });
  const controls=element('div','scene-controls');
  top.append(place,back); controls.append(prev,again,lens,next); caption.append(by,title,line,controls);overlay.append(top,caption);
  let score,cast,items,table,topY,index,beat,player,actor,receiver,handle,node,parent,base,center,size,end,anchor,targetCenter, toolGrip, toolTip, paperAt;
  let participants=[],duration=1.45,elapsed=0,last=0,age=0,detail=false,callback, savedCamera;
  let pageTurn,tea,level,contact,fitting,fitAnchor,nest,lowering;
  let carried,exchange,dishWork;
  const surfaceSpots=new Map();
  const held=new Map();
  let lensProgress=0, workCenter, workWidth, shots;
  const shotCache=new Map();
  let walking={moves:[],span:0}, settling=[], fitYaw=0, steam, accessory, brush, inkMark, cord, stream, onViewed, viewed, otherHalf;
  function start(data,onReturn,onView) {
    if(score || !data?.beats?.length) return false;
    score=data;callback=onReturn;onViewed=onView;viewed=false;age=0;last=0;detail=false;lensProgress=0;
    savedCamera={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,near:camera.near};
    const site=score.site;
    stage.position.set(site.x,site.y,site.z); stage.rotation.y=site.yaw||0; stage.visible=true;
    const chapterNo=/^guest\//.test(data.key)||data.key==='end/festival'?8:0;
    const tk=[data.number,site.place,chapterNo].join('/');
    if(!tableCache.has(tk)) tableCache.set(tk,crafts.createStoryWorktable(data.number,chapterNo,site.place));
    table=tableCache.get(tk); topY=table.userData.worktop; stage.add(table,inspectionLight,basinStand);
    if(data.key==='end/festival'){
      festivalTable ??= crafts.createStoryStillLife(11,8);
      festivalTable.position.set(-2.18,0,-.12);festivalTable.rotation.y=.12;stage.add(festivalTable);
    }
    const names=[...new Set(data.cast)];
    const get=name=>{
      const guest=data.key.startsWith('guest/') || (data.category==='結び' && data.chapter?.id==='festival');
      const key=name+(guest?'/客':'');
      if(!castCache.has(key))castCache.set(key,buildActor(name,guest,rests));
      return castCache.get(key);
    };
    if(data.beats.some(b=>!get(data.cast[b.actor]).canHold) && !names.includes(courier)) names.push(courier);
    participants=names.map(get);cast=data.cast.map(get);
    basinStand.visible=false;
    const plan=tablePlan(data.number,site.place);
    for(const a of participants){
      stage.add(a.group);
      if(a.name!==courier)a.headroom=worktopHeadroom(a.group,table,plan);
    }
    for(const b of data.beats){cast[b.actor]?.costume?.(true);cast[b.partner]?.costume?.(true);}
    steam=makeSteam();stage.add(steam);
    accessory=new T.Group();stage.add(accessory);
    ({brush,inkMark,cord,stream}=makeAccessories(accessory));setupObjects();rememberObjects();
    // The table is the fixed reference for both lenses. Turning a cake or
    // passing a bowl must never move the viewer along with the object.
    const workBounds=new T.Box3();
    for(const item of items)workBounds.union(stageBox(item.o));
    workCenter=workBounds.getCenter(vec());workCenter.y=topY+.17;
    workWidth=Math.max(1.32,workBounds.max.x-workBounds.min.x+.45);
    dialog.dataset.performance='';dialog.setAttribute('aria-labelledby',title.id); dialog.append(overlay);
    place.textContent=data.site.name+'　／　'+data.category;
    document.getElementById('stage').classList.add('performing');
    enter(site);index=-1;
    const shotKey=data.key+'/'+tk;
    if(!shotCache.has(shotKey))shotCache.set(shotKey,planShots());
    shots=shotCache.get(shotKey);go(0);next.focus({preventScroll:true});
    return true;
  }
  function setupObjects(){
    held.clear();
    items=score.props.map((spec,i)=>{
      const o=objectFor(spec);
      if(spec.sealed)crafts.sealCargoNote(o);
      if(spec.variant==='steam-repair')crafts.setEvidencePose(o,'single');
      if(score.beats.some(b=>b.tea && b.target===i))o.getObjectByName('湯呑みの茶面').position.y=.04;
      const bounds=box.setFromObject(o), extent=bounds.getSize(vec()), mid=bounds.getCenter(vec());
      const columns=Math.min(3,score.props.length);
      const span=score.props.length===1?1.12:Math.min(.86,1.99/columns);
      const s=Math.min(1.35,span/Math.max(extent.x,extent.z,.08),.70/Math.max(.06,extent.y));
      const wrap=new T.Group();o.scale.multiplyScalar(s);
      o.position.sub(mid.multiplyScalar(s));o.position.y+=extent.y*s*.5;wrap.add(o);
      wrap.position.set(((i%3)-(columns-1)/2)*.65,topY+.005,-.19+Math.floor(i/3)*.34);
      stage.add(wrap);return {wrap,o,spec,rest:new Map(),liner:spec.code==='food' && servingLiner(o)};
    });
    const body=items.find(i=>i.spec.variant==='repair-body'),bars=items.find(i=>i.spec.variant==='packing-bars');
    if(body && bars){const unit=body.o.scale.x/bars.o.scale.x;bars.o.position.multiplyScalar(unit);bars.o.scale.multiplyScalar(unit);}
    // The port compares the delivered part against an actual life-size imprint.
    // Use a common unit for the object and its receiving box.
    const liner=items.find(item=>['plate-liner','board-liner'].includes(item.spec.variant));
    if(liner){
      const source=items.find(item=>['sakai-boards','tsuruga-plates'].includes(item.spec.variant));
      if(source){
        const factor=liner.o.scale.x/source.o.scale.x;
        source.o.scale.multiplyScalar(factor);source.o.position.multiplyScalar(factor);
      }
    }
  }
  function rememberObjects(){
    for(const item of items){
      item.original=[];
      item.o.traverse(node=>item.original.push({node,parent:node.parent,at:node.position.clone(),
        rotation:node.quaternion.clone(),scale:node.scale.clone(),visible:node.visible}));
    }
  }
  function rewindObjects(){
    parkHandle();lowering=null;carried=null;surfaceSpots.clear();held.clear();
    for(const item of items){
      item.nested?.removeFromParent();item.nested=null;item.split?.removeFromParent();item.split=null;
      for(const state of item.original){
        const {node,parent,at,rotation,scale,visible}=state;
        if(node.parent!==parent)parent.add(node);
        node.position.copy(at);node.quaternion.copy(rotation);node.scale.copy(scale);node.visible=visible;
        if(node.morphTargetInfluences)node.morphTargetInfluences.fill(0);
      }
      item.rest.clear();
    }
  }
  function stageBox(object){
    // Bounds in stage axes even when the location faces a different compass bearing.
    object.updateWorldMatrix(true,true);
    const inv=stage.matrixWorld.clone().invert(), out=new T.Box3(), local=new T.Box3(), matrix=new T.Matrix4();
    object.traverseVisible(n=>{
      if(!n.isMesh || !n.visible) return;
      if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();
      out.union(local.copy(n.geometry.boundingBox).applyMatrix4(matrix.multiplyMatrices(inv,n.matrixWorld)));
    });
    return out;
  }
  function parkHandle(){
    if(handle && node){
      if(beat?.gesture==='taste' && !handle.visible)node.visible=false;
      handle.updateWorldMatrix(true,true);parent.attach(node);handle.removeFromParent();
    }
    handle=node=parent=null;
  }
  // Put a particular patch of the article against a wrist, then measure
  // the clearance of the actual load with the people and worktop in place.
  function parcelAt(point,pad,bodies,turn=0){
    const start=handle.position.clone(),rotation=handle.quaternion.clone();
    if(turn)handle.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(vec(0,1,0),turn));
    const patch=handle.localToWorld(pad.clone());
    handle.position.add(stage.worldToLocal(point.clone()).sub(stage.worldToLocal(patch)));
    contact.clearBodies(bodies,false);contact.lift();
    const gap=point.distanceTo(contact.nearest(point));
    const pose={gap,at:handle.position.clone(),turn:handle.quaternion.clone()};
    handle.position.copy(start);handle.quaternion.copy(rotation);
    return pose;
  }
  function saveLoadedPose(owner){
    const wrist=owner.hand('right'),p=wrist.getWorldPosition(vec());
    if(beat.fromWorktop && owner.species==='狐' && owner.headroom.depth()>.002)return false;
    if(p.distanceTo(contact.nearest(p))>.034)return false;
    if(exchange.support?.owner!==owner){
      const joints=[];
      for(let joint=wrist;joint && joint!==owner.group.parent;joint=joint.parent){
        joints.push({joint,at:vec(),turn:new T.Quaternion(),scale:vec()});
      }
      exchange.support={owner,joints,at:vec(),turn:new T.Quaternion()};
    }
    for(const j of exchange.support.joints){j.at.copy(j.joint.position);j.turn.copy(j.joint.quaternion);j.scale.copy(j.joint.scale);}
    exchange.support.at.copy(handle.position);exchange.support.turn.copy(handle.quaternion);
    return true;
  }
  function layoutActors(){
    const members=participants, active=members.indexOf(player);
    const others=members.filter(a=>a!==player);
    for(const [i,a] of members.entries()){
      const rank=others.indexOf(a), lane=(rank%2===0?1:-1)*(1.03+.65*Math.floor(rank/2));
      const serving=items[beat.prop].spec.code==='food';
      const pos=i===active ? vec(center.x,0,serving?-.90:-.74) : vec(lane,0,-.86-.46*Math.floor(rank/2));
      if(a===actor && a!==player && beat.part==='蒸し箱の上段'){pos.x+=.85;pos.z-=.67;}
      if(a===receiver && a!==player){const pass=beat.gesture==='pass';pos.x=center.x+(center.x>.28?-1:1)*(pass?.85:1.25);pos.z=pass?-.76:-1.04;}
      a.group.rotation.set(0,i===active?(beat.part==='合わせ餅'||serving?.45:.06):-Math.atan2(pos.x,.90)*.74,0);
      if(a.species==='蛸'){
        pos.y=score.site.region==='ryugu'?.41:.307;
        if(i===active){pos.x-=.37;pos.z-=.06;a.group.rotation.y=.58;}
        if(score.site.region!=='ryugu'){basinStand.visible=true;basinStand.position.set(pos.x,0,pos.z);}
      }
      if(a.species==='象' && i===active){pos.x-=.82;pos.z-=.43;a.group.rotation.y=.85;}
      // The boar's low snout leads its forefeet by almost a body length.
      // Leave room for it to watch the work and turn toward the next speaker.
      if(a.species==='猪')pos.z-=.66;
      a.group.position.copy(pos);a.idle(age+.7*i,true,0);a.group.updateWorldMatrix(true,true);
      if(i===active && a.hand('right')){
        const palm=stage.worldToLocal(a.hand('right').getWorldPosition(vec()));
        if(a.hand('left') && !singleHand.has(beat.gesture))palm.lerp(stage.worldToLocal(a.hand('left').getWorldPosition(vec())),.5);
        // Move along the back edge to work with the near hand, including mirrored residents.
        a.group.position.x+=T.MathUtils.clamp(center.x-palm.x,-.66,.66);
        if(beat.part==='合わせ餅' || serving)a.group.position.x-=.16;
        if(a.species==='蛸')a.group.position.x-=.17;
        if(a.species==='象')a.group.position.x-=.31;
      }
    }
  }
  function beginBeat(i) {
    const previousPlaces=i ? participants.map(a=>({point:a.group.position.clone(),yaw:a.group.rotation.y})):null;
    if(lowering){lowering.placement.pose(1);lowering=null;}
    let previousGrip;
    if(node && index>=0 && i>index){
      const holder=beat.gesture==='pass'?exchange?.owner:player, wrist=holder?.hand('right');
      if(wrist && ['pass','lift','turn','present','open','divide','tie'].includes(beat.gesture)){
        const palm=wrist.getWorldPosition(vec());
        if(contact.nearest(palm).distanceTo(palm)<.09){
          previousGrip={node,holder,palm:holder.group.worldToLocal(palm)};
        }
      }
      const previous=node,ground=surfaceSpots.get(node);
      if(nest){
        nest.attach(node);node.position.set(0,0,0);node.quaternion.identity();node.scale.setScalar(.78);
        parent=nest;items[beat.prop].nested=node;
      }
      if(fitAnchor)held.set(node,{follow:followStoryGrip(node,fitAnchor)});
      if(beat.gesture==='pass' && previousGrip?.holder===holder && wrist)held.set(node,{follow:followStoryGrip(node,wrist),holder,palm:previousGrip.palm});
      const upcoming=score.beats[i];
      const keep=player.name===courier && upcoming.prop!==beat.prop && cast[upcoming.actor]!==player &&
        !(upcoming.gesture==='pass' && cast[upcoming.partner]===player) && ['lift','turn','present'].includes(beat.gesture);
      if(keep){
        const wrist=player.hand('right');
        held.set(node,{follow:followStoryGrip(node,wrist),holder:player,palm:player.group.worldToLocal(wrist.getWorldPosition(vec()))});
      }
      const tabletopWork=['point','compare','write'].includes(upcoming.gesture) || upcoming.gesture==='tie' && items[beat.prop].spec.code==='food';
      const returnsToBoard=upcoming.prop===beat.prop && tabletopWork &&
        ['present','lift','turn'].includes(beat.gesture);
      if(!keep && !pageTurn && (needsSetDown(beat,upcoming) || returnsToBoard) && ground && wrist){
        held.delete(previous);
        lowering={holder,placement:placeWithinReach(handle,previous,contact,ground,wrist,true)};
      }
    }
    parkHandle();index=i;beat=score.beats[i];
    actor=cast[beat.actor];
    const foodWork=score.props[beat.prop].code==='food' && ['divide','set'].includes(beat.gesture);
    const simpleGrip=beat.gesture==='pass' || (['lift','present','turn'].includes(beat.gesture) || foodWork) &&
      score.beats.slice(i+1).some(next=>next.gesture==='pass' && next.actor===beat.actor && next.prop===beat.prop);
    player=actor.canHold || simpleGrip?actor:participants.find(a=>a.name===courier);
    receiver=beat.partner!=null?cast[beat.partner]:null;
    const item=items[beat.prop]; const part=beat.part||item.spec.part;
    let semantic;
    item.o.traverse(n=>{
      if(!semantic && n.userData.performPart?.split(' ').includes(beat.gesture))semantic=n;
    });
    const explicit=part && item.o.getObjectByName(part);
    node=beat.wholeDish?item.o:explicit || semantic || item.o;
    otherHalf=null;
    if(node.name==='継ぎ目から離す餅'){
      otherHalf=item.o.getObjectByName('敷き葉に残す餅');
    }else if(item.spec.code==='food' && beat.gesture==='divide'){
      const pastry=item.o.getObjectByName('取り分ける餅') || item.o.children.at(-1);
      item.split ??= dividePastry(pastry,item.spec.region);
      node=item.split.children[1];otherHalf=item.split.children[0];
    }else if(item.split && node.name==='取り分ける餅')node=item.split.children[1];
    if(beat.gesture==='divide' && item.o.getObjectByName('割餅右')){
      node=explicit || item.o.getObjectByName('割餅右');otherHalf=item.o.getObjectByName(node.name==='割餅左'?'割餅右':'割餅左');
    }
    const waiting=held.get(node);
    if(waiting?.holder===player){
      waiting.follow();previousGrip={node,holder:player,palm:waiting.palm};
    }
    for(const part of held.keys())if(part===node || part.getObjectById(node.id) || node.getObjectById(part.id))held.delete(part);
    const serving=beat.gesture==='pass' && score.key.startsWith('food/');
    if(serving)item.liner?.();
    level=serving && levelServing(stage,node);
    inkMark.visible=beat.gesture==='write';
    brush.visible=inkMark.visible && item.spec.code!=='tool';
    cord.visible=beat.gesture==='tie' && item.spec.code!=='food';
    stream.visible=beat.gesture==='pour';
    settling=[];fitYaw=0;
    if(item.spec.code==='food' && node!==item.o){
      if(!item.rest.has(node))item.rest.set(node,{p:node.position.clone(),q:node.quaternion.clone()});
    }else if(item.spec.code==='food' && beat.gesture==='pass'){
      for(const [part,rest] of item.rest){
        const moving=(!part.visible && item.split)?item.split:part;
        settling.push({part:moving,from:moving.position.clone(),q:moving.quaternion.clone(),rest});
      }
    }
    parent=node.parent;stage.updateWorldMatrix(true,true);
    const bounds=stageBox(node);center=bounds.getCenter(vec());size=bounds.getSize(vec());
    if(!surfaceSpots.has(node))surfaceSpots.set(node,node.getWorldQuaternion(new T.Quaternion()));
    carried=null;
    if(previousGrip?.holder===player && previousGrip.node===node){
      const group=player.group;
      carried={group,palm:previousGrip.palm,center:group.worldToLocal(stage.localToWorld(center.clone())),
        orientation:group.getWorldQuaternion(new T.Quaternion()).invert().multiply(stage.getWorldQuaternion(new T.Quaternion()))};
    }
    base=center.clone();handle=new T.Group();handle.position.copy(center);stage.add(handle);handle.attach(node);
    const obstacles = items.filter((other,j)=>other!==item && !(beat.gesture==='fit' && j===beat.target)).map(other=>other.o);
    contact=createWorkContact(handle,node,table,tablePlan(score.number,score.site.place),obstacles);
    exchange=beat.gesture==='pass' && receiver?.hand('right') && receiver!==player?
      {owner:null,at:center.clone(),turn:handle.quaternion.clone(),clock:0,touch:0}:null;
    if(exchange && carried){
      const hand=player.hand('right').getWorldPosition(vec());
      if(hand.distanceTo(contact.nearest(hand))>.034)player.grasp(player.group.localToWorld(carried.palm.clone()),null,false,contact.penetration);
      if(saveLoadedPose(player))exchange.owner=player;
      exchange.carryPalm=carried.palm.clone();
      exchange.pad=handle.worldToLocal(contact.nearest(player.group.localToWorld(carried.palm.clone())));
      exchange.carryTurn=player.group.getWorldQuaternion(new T.Quaternion()).invert().multiply(handle.getWorldQuaternion(new T.Quaternion()));
    }
    const bearing=beat.surface && items[beat.target]?.o.getObjectByName(beat.surface);
    targetCenter=beat.target!=null && items[beat.target]!==item ? stageBox(bearing || items[beat.target].o).getCenter(vec()) : null;
    toolGrip=item.spec.code==='tool'?handle.worldToLocal(node.getWorldPosition(vec())):null;
    toolTip=null;paperAt=null;
    if(toolGrip && beat.gesture==='write' && beat.target!=null){
      toolTip=handle.worldToLocal(node.localToWorld(vec(-.027,-.135,0)));
      const page=stageBox(items[beat.target].o);
      paperAt=page.getCenter(vec()).setY(page.max.y+.003);
    }
    fitting=fitAnchor=nest=null;
    const railFit=beat.gesture==='fit' && beat.part?.startsWith('取り外し桟') && (items[beat.target] || item);
    const chip=beat.gesture==='fit' && beat.part==='欠けた蝶番' && items[beat.target]?.o.getObjectByName('欠けの破片');
    nest=beat.nest && items[beat.target]?.o.getObjectByName(beat.nest);
    const lid=beat.part==='水鉢の合い蓋' && (beat.gesture==='fit'?item.o:beat.socket && item.o.getObjectByName(beat.socket));
    if(railFit || chip || nest || lid){
      fitAnchor=chip || railFit?.o;
      fitting=fitToSocket(handle,node,nest || lid || fitAnchor,railFit ? vec((Number(beat.part.at(-1))-1)*.213,.169,0) : null,nest ? .78 : 1);
    }
    if(node.name==='継ぎ目から離す餅')fitting=fitToSocket(handle,node,parent,vec(.044,0,0));
    if(beat.reseat){
      const original=item.original.find(part=>part.node===node);
      fitting=fitToSocket(handle,node,original.parent,new T.Matrix4().compose(original.at,original.rotation,original.scale));
    }
    if(beat.gesture!=='taste' || !previousPlaces)layoutActors();
    const plan=tablePlan(score.number,score.site.place);
    const benches=[{x:0,z:0,yaw:0,width:plan.width,depth:plan.depth}];
    if(festivalTable?.parent===stage)benches.push({x:festivalTable.position.x,z:festivalTable.position.z,yaw:festivalTable.rotation.y,
      width:plan.width,depth:plan.depth});
    for(const a of participants)a.onStand=a.species==='蛸' && score.site.region!=='ryugu';
    const passStage=beat.gesture==='pass' && player!==receiver && receiver?.hand('right')?{stage,top:topY}:null;
    if(passStage){
      const bodies=participants.map(person=>person.group);
      passStage.pad=exchange.pad || handle.worldToLocal(contact.nearest(player.hand('right').getWorldPosition(vec())));
      passStage.placement=point=>{
        let best;
        for(const turn of [0,Math.PI/2,-Math.PI/2,Math.PI]){
          const test=parcelAt(point,passStage.pad,bodies,turn);
          if(!best || test.gap<best.gap)best=test;
          if(best.gap<.012)break;
        }
        return best;
      };
      passStage.seat=point=>passStage.placement(point).gap;
    }
    let workingPlaces=previousPlaces;
    dishWork=null;
    if(beat.wholeDish){
      const rim=dishRim(node,handle);
      if(rim){
        const pose=stagePickup(player,center,rim,benches,participants,previousPlaces);
        if(pose)dishWork={pose,rim,pad:handle.worldToLocal(pose.patch.clone()),angle:0};
      }
    }
    const collecting=beat.fromWorktop?receiver:player;
    if(passStage && !exchange.owner){
      const desired=participants.map(a=>({point:a.group.position.clone(),yaw:a.group.rotation.y}));
      exchange.pickup=stagePickup(collecting,center,contact,benches,participants,previousPlaces,
        beat.fromWorktop && collecting.species==='狐');
      if(exchange.pickup?.patch)passStage.pad=handle.worldToLocal(exchange.pickup.patch.clone());
      exchange.approach=stageWalks(participants,collecting,null,previousPlaces,benches);
      workingPlaces=participants.map(a=>({point:a.group.position.clone(),yaw:a.group.rotation.y}));
      if(!beat.fromWorktop)for(const [j,a] of participants.entries()){
        a.group.position.copy(desired[j].point);a.group.rotation.y=desired[j].yaw;
      }
    }
    walking=stageWalks(participants,collecting,beat.fromWorktop?null:receiver,workingPlaces,benches,beat.fromWorktop?null:passStage);
    if(passStage && walking.handoffPoint)exchange.deliveryTurn=passStage.placement(walking.handoffPoint).turn;
    for(const a of participants){
      const stand=a.species==='蛸' && basinStand.visible?basinStand:null;
      if(stand)stand.position.set(a.group.position.x,0,a.group.position.z);
    }
    const right=stage.worldToLocal(player.hand('right').getWorldPosition(vec()));
    const left=player.hand('left')?stage.worldToLocal(player.hand('left').getWorldPosition(vec())):right.clone();
    const midpoint=right.clone().lerp(left,.5);
    const holdY=Math.max(topY+.24,Math.min(topY+.54,midpoint.y+.11));
    const hold=vec(center.x,holdY,Math.max(-.47,Math.min(-.16,midpoint.z+.12)));
    if(item.spec.code==='food'){hold.y=Math.max(topY+.16,hold.y-.08);hold.z+=.20;}
    end=hold.clone();
    if(beat.part==='合わせ餅'){end.x+=.055;end.y-=.10;end.z+=.22;}
    anchor=right.x>=left.x?1:-1;
    const g=beat.gesture;
    if(g==='pass' && receiver?.hand('right') && receiver!==player){
      const wrist=receiver.hand('right').getWorldPosition(vec());
      wrist.addScaledVector(receiver.group.getWorldDirection(vec()),.05+Math.min(.28,size.z*.45));
      end.copy(stage.worldToLocal(wrist));end.y+=Math.min(.13,size.y*.4);
      // The recipient raises a low resting wrist to meet the gift above the worktop.
      end.y=Math.max(end.y,topY+size.y*.5+.12);
      if(item.spec.variant==='mended-cloth')end.z=Math.max(end.z,receiver.group.position.z+.45+size.z*.5);
      if(walking.handoffPoint)end.copy(stage.worldToLocal(walking.handoffPoint.clone()));
    }
    if(g==='point'||g==='write'||g==='tie'||g==='divide'||g==='compare'||beat.ricePacket==='fold') end.copy(base);
    if(paperAt)end.copy(paperAt).sub(toolTip);
    if(g==='point' && toolGrip)end.copy(hold);
    if(item.spec.role==='drum' && targetCenter && g==='lift')end.copy(targetCenter).add(vec(0,size.y*.51+.03,.015));
    if(g==='set'||g==='fit'||g==='stack') {
      if(targetCenter) end.copy(targetCenter).setY((bearing?bearingHeight(stage,bearing,targetCenter,size):stageBox(items[beat.target].o).max.y)+size.y*.5+.002);
      else end.set(center.x,topY+size.y*.5+.01,-.17);
      if(beat.offset){end.x+=size.x*beat.offset[0];end.z+=size.z*beat.offset[1];}
    }
    if(beat.part==='蒸し箱の上段'){
      const owner=item.o;
      const dest=beat.pose==='single'?vec(-.48,.25,0):beat.pose==='spaced'?vec(0,.212,0):vec(0,.171,0);
      const source=stage.worldToLocal(node.getWorldPosition(vec()));
      end.copy(center).add(stage.worldToLocal(owner.localToWorld(dest)).sub(source));
    }
    if(beat.part?.startsWith('取り外し桟') && g==='fit'){
      const j=Number(beat.part.slice(-1))||0;
      const receivingModel=items[beat.target]?.o || item.o;
      end.copy(center).add(stage.worldToLocal(receivingModel.localToWorld(vec((j-1)*.213,.169,0))).sub(stage.worldToLocal(node.getWorldPosition(vec()))));
    }
    if(g==='divide' && otherHalf) end.copy(base).add(vec(.105,item.spec.code==='food'?0:.055,.012));
    if(g==='open' && size.y<size.x*.35)end.copy(base).add(vec(0,.085,-size.z*.16));
    if(g==='fit' && beat.part==='欠けた蝶番' && item.o.getObjectByName('欠けの破片')){
      const chip=item.o.getObjectByName('欠けの破片');
      const rest=stage.worldToLocal(item.o.localToWorld(chip.position.clone()));
      end.copy(center).add(rest.sub(stage.worldToLocal(node.getWorldPosition(vec()))));
    }
    if(g==='fit' && beat.part==='水鉢の合い蓋'){
      end.copy(center).add(stage.worldToLocal(item.o.localToWorld(vec(0,0,0))).sub(stage.worldToLocal(node.getWorldPosition(vec()))));
    }
    const liner=items[beat.target]?.o.getObjectByName('中敷き');
    if(g==='fit' && liner){
      const inner=stageBox(liner);
      end.copy(inner.getCenter(vec()));end.y=inner.max.y+size.y*.5+.001;
      fitYaw=(items[beat.target].spec.variant==='board-liner'?Math.PI/2:0)-new T.Euler().setFromQuaternion(stage.getWorldQuaternion(new T.Quaternion()).invert().multiply(node.getWorldQuaternion(new T.Quaternion())),'YXZ').y;
    }

    const priorBeat=score.beats[i-1];
    pageTurn=crafts.readCargoNote(handle,node,item.o,beat.archive) ||
      !(priorBeat?.gesture==='pass' && priorBeat.prop===beat.prop) && turnWorkPage(handle,node,item.spec.code,g);
    tea=g==='sip'?sipTea(handle,node,player.group):beat.tea?pourTea(handle,node,items[beat.target].o.getObjectByName('湯呑み'),stream):null;
    if(beat.beside){end.x=center.x+size.x*1.5;end.z=center.z;}
    if(fitting)end.copy(fitting.position);
    duration=['turn','pass','fit','open','stack','write','divide','pour','tie'].includes(g)?1.8:1.4;
    duration+=walking.span+(exchange?.approach?.span || 0)+(lowering?.placement.span || 0);elapsed=reduced.matches?duration:0; last=0;

  }
  function go(i) {
    if(!score || i<0 || i>=score.beats.length)return;
    if(i<=index) {
      rewindObjects();
      for(let j=0;j<i;j++){beginBeat(j);pose(1);}
    }else if(index>=0)pose(1);
    beginBeat(i);
    by.textContent=(index+1)+' ／ '+score.beats.length+'　'+(actor===player?actor.name:'案内 '+actor.name+'　／　手元 '+player.name);
    title.textContent=score.title;line.textContent=actor!==player && beat.helperCaption ? beat.helperCaption : beat.caption;
    lens.textContent=detail?'全景を見る':'手元を拡大';prev.disabled=index===0;
    next.textContent=index===score.beats.length-1?'場面を結ぶ':'次の所作';
    redraw();
  }
  function pose(t) {
    const delay=lowering?.placement.span || 0,ageOnBeat=t*duration,clock=Math.max(0,ageOnBeat-delay);
    let dt=0;
    if(exchange){
      // Seeking a chapter or reducing motion follows the same sequence
      // of physical contacts as watching each frame.
      const start=(delay+(exchange.approach?.span || 0))/duration,step=1/(duration*24);
      for(let q=Math.max(exchange.clock,start)+step;q<t-.0001;q+=step)pose(q);
      dt=Math.max(0,(t-exchange.clock)*duration);exchange.clock=t;
    }
    for(const who of participants)who.headroom?.restoreNeck();
    const pickup=exchange?.approach,initial=pickup?.span || 0,action=duration-delay-walking.span-initial;
    const close=pickup?action*.30:0,setting=pickup && clock<initial+close;
    const moves=setting?pickup:walking,footTime=setting?clock:Math.max(0,clock-initial-close);
    for(const move of moves.moves)move.person.walkSpeed=poseStageWalk(move,footTime);
    if(exchange?.pickup){
      const q=exchange.pickup,body=(beat.fromWorktop?receiver:player).group;
      const lean=smooth((clock-initial+.10)/.32) * (1-smooth((clock-initial-close)/.38));
      body.rotation.x=q.bend*lean;
      body.scale.y=body.scale.x*T.MathUtils.lerp(1,q.height,lean);
    }
    if(exchange)exchange.carryingStep=!setting && footTime<walking.span;
    t=setting?T.MathUtils.clamp((clock-initial)/action,0,.30):
      T.MathUtils.clamp((clock-initial-walking.span)/action,close/action,1);
    const loweringHand=lowering?.placement.pose(smooth(Math.min(1,ageOnBeat/delay)));
    if(beat.stamp)items[beat.target].o.getObjectByName(beat.stamp).visible=t>=.81;
    const r=smooth((t-.20)/.68), reach=smooth(t/.27), arch=Math.sin(r*Math.PI), g=beat.gesture;
    if(dishWork){
      const lean=smooth(t/.28);
      player.group.rotation.x=dishWork.pose.bend*lean;
      player.group.scale.y=player.group.scale.x*T.MathUtils.lerp(1,dishWork.pose.height,lean);
    }
    const origin=carried?stage.worldToLocal(carried.group.localToWorld(carried.center.clone())):base;
    handle.position.copy(origin).lerp(end,r);
    if(['pass','set','stack','fit','divide'].includes(g))handle.position.y+=.10*arch;
    const angle=g==='turn'?-2.64:g==='open'?-1.05:g==='present'?-.25:g==='pour'?.86:0;
    handle.rotation.set(angle*r,(g==='divide' && otherHalf?-1.24:['point','write','tie','compare'].includes(g)?0:.09)*r,g==='pour'?-.52*r:0);
    if(level)handle.quaternion.identity().slerp(level,smooth(t/.57));
    if(toolGrip && g==='point')handle.rotation.z+=.63*r;
    if(paperAt){
      const u=smooth((t-.40)/.55);handle.rotation.set(0,0,0);
      handle.position.lerpVectors(base,end,smooth(t/.40));
      handle.position.x+=(u-.5)*.13;handle.position.z+=Math.sin(u*11)*.017;
      inkMark.position.copy(paperAt).add(vec(-.065+u*.065,.002,0));
      inkMark.scale.set(Math.max(.001,u)*.13,1,.005);
    }
    if(beat.ricePacket==='fold')handle.quaternion.identity();
    if(fitYaw)handle.rotation.y=fitYaw*r;
    for(const move of settling){
      const fold=smooth(t/.44);
      move.part.position.lerpVectors(move.from,move.rest.p,fold);
      move.part.quaternion.slerpQuaternions(move.q,move.rest.q,fold);
    }
    if(items[beat.prop].spec.code==='food'){
      crafts.poseStoryFood(node,g,r);
    }
    if(beat.ricePacket)crafts.poseRicePackets(items[beat.target??beat.prop].o,beat.ricePacket,r);
    if(g==='open')handle.position.z-=.10*arch;
    if(actor!==player){
      actor.group.rotation.x=.04+.055*Math.sin(r*Math.PI);
      actor.group.rotation.z=.018*Math.sin(r*Math.PI*2);
    }
    if(fitting)fitting.pose(r);
    for(const [j,a] of participants.entries())a.idle(age+.61*j,a===actor || a===player,t,g==='taste' && a===player,a.walkSpeed);
    if(carried){
      const heldAngle=stage.getWorldQuaternion(new T.Quaternion()).invert().multiply(carried.group.getWorldQuaternion(new T.Quaternion())).multiply(carried.orientation);
      handle.quaternion.premultiply(heldAngle.slerp(new T.Quaternion(),r));
    }
    if(g==='taste' && player.mouth){
      const lip=player.mouth.getWorldPosition(vec()).addScaledVector(player.group.getWorldDirection(vec()),.025+size.z*.46);
      const bite=smooth((t-.16)/.52);
      handle.position.lerpVectors(origin,stage.worldToLocal(lip),bite);
      handle.position.y+=Math.sin(bite*Math.PI)*.08;
      handle.scale.setScalar(1-smooth((t-.69)/.23)*.995);handle.visible=t<.92;
    }
    if(beat.wholeDish){
      handle.position.copy(base);handle.rotation.set(0,0,0);
      if(dishWork && g==='turn')handle.rotation.y=.44*smooth((t-.34)/.59);
    }
    const free=['lift','turn','present','pass'].includes(g) && !beat.pose && !beat.archive && beat.ricePacket!=='fold' && !beat.wholeDish;
    const bodies=participants.map(person=>person.group);
    if(free && r>0 && !exchange)contact.clearBodies(bodies);
    if(pageTurn)pageTurn.pose(r);
    else if(beat.unfold){handle.position.copy(base);handle.quaternion.identity();}
    else contact.lift();
    if(fitting)handle.position.lerp(fitting.position,smooth((r-.74)/.26));
    stage.updateWorldMatrix(true,true);
    // Align the near rim and the wrist to the rested jaw throughout the sip.
    if(g==='sip')player.headroom?.clearNeck();
    if(tea)tea(t);
    const radius=Math.min(.22,Math.max(.027,size.x*.38));
    const pt=(side,sy=0)=>handle.localToWorld(vec(side*radius,sy,-size.z*.27));
    const right=contact.edge(anchor),left=contact.edge(-anchor);
    if(otherHalf){const rest=stageBox(otherHalf).getCenter(vec());left.copy(stage.localToWorld(rest));}
    if(g==='pour' && !beat.tea){
      stream.position.copy(stage.worldToLocal(pt(-anchor)));stream.scale.y=.08+.82*arch;
      stream.rotation.z=0;stream.visible=r>0 && r<1;
    }
    if(['point','compare','write','tie','divide'].includes(g) && !otherHalf){
      const mark=g==='write'?Math.sin(r*19)*.044:g==='tie'?Math.cos(r*11)*.035:0;
      right.copy(handle.localToWorld(vec((r-.5)*size.x*.64,size.y*.49+.014,-size.z*.19+mark)));
      if(targetCenter && g==='compare')right.lerp(stage.localToWorld(targetCenter.clone().add(vec(0,.06,0))),r);
    }
    function reachHand(who,side,destination,fraction){
      return who.hand(side).getWorldPosition(vec()).lerp(destination,fraction);
    }
    if(toolGrip && !['compare'].includes(g)){
      right.copy(handle.localToWorld(toolGrip.clone()));
      left.copy(handle.localToWorld(toolGrip.clone().lerp(vec(),.65)));
    }
    if(brush.visible){
      const tip=stage.worldToLocal(right.clone());
      brush.position.copy(tip);brush.rotation.set(-.31,.05,.23);
      brush.updateWorldMatrix(true,true);right.copy(brush.localToWorld(vec(0,.115,0)));
      inkMark.position.copy(base).add(vec(-size.x*.21,size.y*.53+.003,-size.z*.19));
      inkMark.scale.set(Math.max(.001,r)*Math.max(.06,size.x*.44),1,.006);
    }
    if(cord.visible){
      cord.position.copy(handle.position).add(vec(0,.012,0));
      cord.scale.set(Math.max(.035,size.x*.4),Math.max(.012,size.y*.54),Math.max(.038,size.z*.30));
      cord.rotation.y=r*.9;cord.scale.x*=1.18-.18*r;
    }
    if(g==='tie')right.add(vec(.018*Math.sin(r*Math.PI*5),.016*arch,0));
    if(pageTurn){right.copy(pageTurn.corner());left.copy(pageTurn.spine());}
    if(beat.unfold)right.copy(crafts.openLunchLeaf(node,r).getWorldPosition(vec()));
    if(dishWork)right.copy(handle.localToWorld(dishWork.pad.clone()));
    const rGoal=carried?carried.group.localToWorld(carried.palm.clone()).lerp(right,reach):reachHand(player,'right',right,reach);
    const lGoal=!beat.unfold && player.hand('left') && (!singleHand.has(g) || otherHalf)?reachHand(player,'left',left,reach):null;
    if(!exchange)player.grasp(rGoal,dishWork?null:lGoal,g==='taste',contact.penetration);
    if(dishWork && g==='turn'){
      const palm=player.hand('right').getWorldPosition(vec());
      if(palm.distanceTo(right)<=.024)dishWork.angle=handle.rotation.y;
      else handle.rotation.y=t<.34?(dishWork.angle=0):dishWork.angle;
    }
    // Lean or step into the work if the wrist reaches its anatomical limit.
    // Solve from the original standing place on every frame to avoid drift.
    if(player.name!==courier && reach>.1 && !exchange){
      const error=rGoal.clone().sub(player.hand('right').getWorldPosition(vec()));
      if(lGoal)error.lerp(lGoal.clone().sub(player.hand('left').getWorldPosition(vec())),.46);
      const local=stage.worldToLocal(stage.getWorldPosition(vec()).add(error));
      walking.shiftWeight(player,vec(T.MathUtils.clamp(local.x,-.22,.22),0,T.MathUtils.clamp(local.z,-.095,beat.part==='合わせ餅'||items[beat.prop].spec.code==='food'?.115:.27)));
      player.group.updateWorldMatrix(true,true);player.grasp(rGoal,lGoal,false,contact.penetration);
    }
    if(exchange){
      const wrist=person=>person.hand('right').getWorldPosition(vec());
      const gap=person=>{const p=wrist(person);return p.distanceTo(contact.nearest(p));};
      const place=(position,rotation)=>{handle.position.copy(position);handle.quaternion.copy(rotation);};
      const previous=carried && r===0?origin:exchange.at;
      if(!exchange.owner){
        place(previous,exchange.turn);
        const hand=beat.fromWorktop?receiver:player,actual=exchange.pickup?.patch || contact.nearest(wrist(hand));
        hand.grasp(reachHand(hand,'right',actual,reach),null,false,contact.penetration);
        if(reach>.84)hand.grasp(contact.nearest(wrist(hand)),null,false,contact.penetration);
        if((reach>.1 || carried) && gap(hand)<=.033){
          exchange.owner=hand;exchange.pad=handle.worldToLocal(contact.nearest(wrist(hand)));
          exchange.carryPalm=hand.group.worldToLocal(wrist(hand)).add(vec(0,.10,.055));
          exchange.carryTurn=hand.group.getWorldQuaternion(new T.Quaternion()).invert().multiply(handle.getWorldQuaternion(new T.Quaternion()));
          saveLoadedPose(hand);
        }
      }else{
        const owner=exchange.owner;
        if(owner===player && !setting && exchange.carryTurn){
          const turn=stage.getWorldQuaternion(new T.Quaternion()).invert().multiply(player.group.getWorldQuaternion(new T.Quaternion())).multiply(exchange.carryTurn);
          handle.quaternion.slerp(turn,exchange.carryingStep?1:1-smooth((t-.30)/.40));
        }
        if(!setting && !exchange.carryingStep && exchange.deliveryTurn)handle.quaternion.slerp(exchange.deliveryTurn,smooth((t-.30)/.40));
        const patch=handle.localToWorld(exchange.pad.clone()),guide=patch.clone();
        // The chosen meeting point is for the two palms. On a broad tray
        // its centre can be well away from the edge the giver is holding.
        if((owner===player || beat.fromWorktop) && !setting && exchange.carryPalm){
          guide.copy(owner.group.localToWorld(exchange.carryPalm.clone()));
          if(!exchange.carryingStep && walking.handoffPoint)guide.lerp(walking.handoffPoint,smooth((t-.30)/.48));
        }else if(walking.handoffPoint)guide.lerp(walking.handoffPoint,smooth((r-.18)/.52));
        owner.grasp(guide,null,false,contact.penetration);
        const hand=wrist(owner);
        let placement=parcelAt(hand,exchange.pad,bodies);
        if(placement.gap>.024){
          const angle=exchange.angle || 0;
          for(const offset of [0,.18,-.18,.36,-.36]){
            const probe=parcelAt(hand,exchange.pad,bodies,angle+offset);
            if(probe.gap>=placement.gap-.002)continue;
            placement=probe;exchange.angle=angle+offset;
          }
        }else exchange.angle=0;
        place(placement.at,placement.turn);
        owner.grasp(contact.nearest(hand),null,false,contact.penetration);
        if(gap(owner)>.033){
          place(previous,exchange.turn);
          owner.grasp(contact.nearest(wrist(owner)),null,false,contact.penetration);
        }
      }
      if(exchange.owner===player && r>.12){
        const near=contact.nearest(walking.handoffPoint && r>.58?walking.handoffPoint:wrist(receiver));
        receiver.grasp(reachHand(receiver,'right',near,smooth((r-.12)/.27)),null,false,contact.penetration);
        if(r>.55 && !exchange.carryingStep && gap(receiver)>.025){
          const palm=wrist(receiver),edge=contact.nearest(palm);
          const stride=stage.worldToLocal(edge.clone()).sub(stage.worldToLocal(palm)).setY(0);
          walking.shiftWeight(receiver,stride.clampLength(0,.13).multiplyScalar(smooth((r-.55)/.25)));
          receiver.grasp(edge,null,false,contact.penetration);
        }
        const missing=gap(receiver);
        if(r>.64 && !exchange.carryingStep && missing>.025 && missing<.19 && gap(player)<.035){
          // Both are close: the giver eases the gripped edge into the
          // open palm while retaining the weight and table clearance.
          const giver=wrist(player),taker=wrist(receiver),pad=handle.worldToLocal(contact.nearest(giver));
          const at=handle.position.clone(),turn=handle.quaternion.clone();
          const offered=giver.clone().add(taker.clone().sub(contact.nearest(taker)).clampLength(0,.085));
          player.grasp(offered,null,false,contact.penetration);
          const adjusted=parcelAt(wrist(player),pad,bodies);
          place(adjusted.at,adjusted.turn);
          receiver.grasp(contact.nearest(taker),null,false,contact.penetration);
          if(gap(player)>.033 || gap(receiver)>=missing){
            place(at,turn);player.grasp(giver,null,false,contact.penetration);receiver.grasp(contact.nearest(taker),null,false,contact.penetration);
          }
        }
        exchange.touch=gap(player)<=.036 && gap(receiver)<=.033?exchange.touch+dt:0;
        if(exchange.touch>=.075){
          exchange.owner=receiver;exchange.pad=handle.worldToLocal(contact.nearest(wrist(receiver)));
          saveLoadedPose(receiver);
          exchange.touch=0;
        }
      }
      exchange.at.copy(handle.position);exchange.turn.copy(handle.quaternion);contact.rememberSupport();
    }else if(free && reach>0) {
      const shift=player.hand('right').getWorldPosition(vec()).sub(contact.edge(anchor));
      shift.multiplyScalar(smooth((t-.17)/.30));
      handle.position.copy(stage.worldToLocal(handle.getWorldPosition(vec()).add(shift)));
      if(r>0)contact.clearBodies(bodies);
      contact.lift();
      player.grasp(contact.edge(anchor),lGoal?contact.edge(-anchor):null,false,contact.penetration);
    }
    if(free && r>0 && !exchange){
      const gapAt=hand=>{const palm=hand.getWorldPosition(vec());return contact.nearest(palm).distanceTo(palm);};
      let gap=gapAt(player.hand('right'));
      const following=score.beats[index+1];
      if(gap>.025 && following?.gesture==='pass' && following.prop===beat.prop && following.actor===beat.actor){
        const hand=player.hand('right'),palm=hand.getWorldPosition(vec()),pad=handle.worldToLocal(contact.nearest(palm));
        let placing=parcelAt(palm,pad,bodies);
        for(const turn of [.18,-.18]){
          if(placing.gap<.018)break;
          const next=parcelAt(palm,pad,bodies,turn);
          if(next.gap<placing.gap)placing=next;
        }
        if(placing.gap<gap){
          const ease=smooth((t-.23)/.29);
          handle.position.lerp(placing.at,ease);handle.quaternion.slerp(placing.turn,ease);
          player.grasp(contact.nearest(palm),null,false,contact.penetration);
          gap=gapAt(hand);
        }
      }
      if(gap>.035){
        const pads=[player.hand('right').getWorldPosition(vec())];
        contact.restOnWorktop(smooth((gap-.035)/.06)*smooth((t-.16)/.24),bodies,pads);
      }
    }
    if(loweringHand && ageOnBeat<delay)lowering.holder.grasp(loweringHand,null,false);
    // The page rises above the table during a turn. Reserve that space for
    // the article while the reader follows its writing with their eyes.
    const bounds=handle.visible && g!=='taste' && stageBox(node);
    const article=bounds && !bounds.isEmpty() ? {
      x:(bounds.min.x+bounds.max.x)/2,z:(bounds.min.z+bounds.max.z)/2,
      w:(bounds.max.x-bounds.min.x)/2+.017,d:(bounds.max.z-bounds.min.z)/2+.017,y:bounds.max.y+.022
    } : null;
    for(const who of participants){
      if(g==='sip' && who===player)continue;
      const workingWithMuzzle=!who.canHold && (who===player || who===receiver && g==='pass');
      const mouthful=beat.fromWorktop && exchange?.owner===who && who.species==='狐' && who.headroom.depth()>.002;
      who.headroom?.clearNeck(workingWithMuzzle?null:article);
      if(mouthful){
        // Lift the sheet together with the muzzle that guards its edge.
        const pose=parcelAt(who.hand('right').getWorldPosition(vec()),exchange.pad,bodies);
        if(pose.gap<=.033){handle.position.copy(pose.at);exchange.at.copy(pose.at);}
      }
    }
    if(exchange?.owner){
      const owner=exchange.owner;
      if(!saveLoadedPose(owner) && exchange.support?.owner===owner){
        // A turning head or a blocked shoulder must not leave a package
        // hanging where the holder used to stand. Retain the last clear
        // loaded pose until a supported step is available.
        for(const j of exchange.support.joints){j.joint.position.copy(j.at);j.joint.quaternion.copy(j.turn);j.joint.scale.copy(j.scale);}
        handle.position.copy(exchange.support.at);handle.quaternion.copy(exchange.support.turn);
        exchange.at.copy(handle.position);exchange.turn.copy(handle.quaternion);
      }
    }
    for(const {follow,holder,palm} of held.values()){
      if(holder && holder!==player && !(g==='pass' && holder===receiver))holder.grasp(holder.group.localToWorld(palm.clone()),null);
      follow();
    }
    // The arm solve can lean the chest. Seat the rim against the resulting
    // lip position after that final change to the drinker's posture.
    if(g==='sip')tea?.(t);
    poseStorySteam(steam,stage,beat,items[beat.prop],node,handle,size,age,r);

  }
  function planShots(){
    const samples=[],reach=[];
    const initialAge=age;
    const {width,depth}=tablePlan(score.number,score.site.place);
    table.updateWorldMatrix(true,true);
    const inverse=stage.matrixWorld.clone().invert(),architecture=[];
    table.traverseVisible(mesh=>{if(mesh.isMesh)architecture.push(sightMesh(mesh,inverse));});
    const bodies=participants.flatMap(person=>storyBodyCores(person.group).map(core=>core.mesh));
    const envelope=new T.Box3();
    for(let i=0;i<score.beats.length;i++){
      beginBeat(i);
      const beatAge=age;
      for(const t of [0,.35,.50,.68,.84,1]){
        if(!reduced.matches)age=beatAge+duration*t;
        pose(t);
        if(!handle.visible)continue;
        stage.updateWorldMatrix(true,true);
        const bounds=stageBox(node);
        if(bounds.isEmpty())continue;
        const subject=bounds.getCenter(vec());
        const extent=bounds.getSize(vec()),margin=extent.length()*.5;
        const edges=[];
        for(const axis of ['x','y','z'])if(extent[axis]>.045){
          for(const sign of [-1,1]){
            const mark=subject.clone();mark[axis]+=sign*extent[axis]*.32;edges.push(mark);
          }
        }
        if(beat.gesture==='pass')for(const who of [player,receiver]){
          const wrist=who?.hand('right');
          if(!wrist)continue;
          const hand=stage.worldToLocal(wrist.getWorldPosition(vec()));
          if(hand.distanceTo(subject)>margin+.60)continue;
          reach.push(hand);
          // A broad piece can rest beside either hand as the partners walk
          // around the table or slide it down a different edge of the board.
          reach.push(vec(T.MathUtils.clamp(hand.x,-width/2,width/2),topY+.08,T.MathUtils.clamp(hand.z,-depth/2,depth/2)));
        }
        const object=[];
        node.traverseVisible(m=>{if(m.isMesh)object.push(sightMesh(m,inverse));});
        samples.push({subject,edges,margin,object,obstacles:architecture.concat(bodies.map(m=>sightMesh(m,inverse)))});
        envelope.expandByPoint(subject);
      }
    }
    age=initialAge;rewindObjects();index=-1;
    const elephant=participants.some(a=>a.species==='象'),octopus=participants.some(a=>a.species==='蛸');
    const festival=score.key==='end/festival',indoor=['rashomon','bell'].includes(score.site.place);
    const wideDistance=indoor?2.7:festival?4.50:elephant?3.65:3.12;
    const wideWidth=festival?4.45:elephant?3.50:Math.max(2.85,workWidth+.85);
    const nearFocus=workCenter.clone().lerp(envelope.getCenter(vec()),.64);
    const wideFocus=vec(festival?-.66:elephant?-.15:0,topY+(festival?.32:elephant?.42:.25),-.30).lerp(nearFocus,.32);
    const wideYaw=Math.atan2(elephant?1.16:octopus?.82:.32,wideDistance);
    const wide=frameStoryHands(samples,wideFocus,wideDistance,wideWidth,42,wideYaw,[.36,.50,.67,.86],reach);
    const wideAngle=Math.atan2(wide.eye.x-wideFocus.x,wide.eye.z-wideFocus.z);
    const rise=score.beats.some(b=>b.part==='蒸し箱の上段')?.83:.60;
    const near=frameStoryHands(samples,nearFocus,indoor?1.75:2.08,workWidth,34,wideAngle,[rise,.82,1.02,1.20],reach);
    return {wide,near};
  }
  function redraw(){
    if(!score)return;
    pose(Math.min(1,elapsed/duration));
    const {wide,near}=shots,factor=smooth(lensProgress);
    const focus=wide.focus.clone().lerp(near.focus,factor);
    camera.position.copy(stage.localToWorld(wide.eye.clone().lerp(near.eye,factor)));
    camera.near=.045;camera.fov=T.MathUtils.lerp(wide.fov(camera.aspect),near.fov(camera.aspect),factor);
    camera.updateProjectionMatrix();
    camera.lookAt(stage.localToWorld(focus));draw(score.site,age);
    if(!viewed && index===score.beats.length-1 && elapsed>=duration){viewed=true;onViewed?.();}
  }
  function advance(){
    if(elapsed<duration){elapsed=duration;redraw();}
    if(index+1<score.beats.length)go(index+1);else finish(true);
  }
  function finish(complete){
    if(!score)return;
    const done=callback;
    parkHandle();lowering=null;surfaceSpots.clear();for(const item of items)crafts.releaseStoryEvidence(item.o);
    for(const a of participants){a.headroom?.restoreNeck();a.costume?.(false);}
    accessory.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});
    steam.material.dispose();steam.geometry.dispose();
    stage.clear();stage.visible=false;score=null;items=participants=[];steam=null;
    overlay.remove();delete dialog.dataset.performance;dialog.setAttribute('aria-labelledby','dialog-title');
    document.getElementById('stage').classList.remove('performing');
    camera.fov=savedCamera.fov;camera.near=savedCamera.near;camera.position.copy(savedCamera.position);camera.quaternion.copy(savedCamera.quaternion);camera.updateProjectionMatrix();
    leave();done?.(complete);
  }
  dialog.addEventListener('cancel',event=>{if(score){event.preventDefault();finish(false);}});
  return {start,close:()=>finish(false),get active(){return !!score;},frame(now){
    if(last && now-last<30) return;
    const dt=last?Math.min((now-last)/1000,.09):0;last=now;if(!reduced.matches)age+=dt;elapsed+=dt;
    lensProgress=T.MathUtils.clamp(lensProgress+(detail?1:-1)*dt/.65,0,1);
    redraw();
  }};
}
