import * as T from './vendor/three.module.min.js';
import { CAST, SCENES } from './mochiyori-story.js';
import { createStoryCharacter, poseStoryCharacter, storyGrip, storyTool, poseStoryHands, createStoryTool } from './story-models.js';
import * as crafts from './story-crafts.js';
import { batchActorParts } from './actors.js';
import { dividePastry } from './mochiyori-cut.js';
import { makeRiceModel, poseRice } from './mochi-model.js';

const people = new Map(CAST.map(p => [p.name,p]));
const courier = '配達人のお餅';
const vec = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
const smooth = t => T.MathUtils.smoothstep(t,0,1);
const box = new T.Box3();
const neutral = {grounded:true,mode:'normal'};
const helpers = {'炭焼き':['蛙','炭を焼く人'],'茶屋の亭主':['兎','茶屋の亭主']};
function buildActor(name,guest) {
  const group = new T.Group();
  group.name = name;
  if (name === courier) {
    group.scale.setScalar(.76);
    const rice = makeRiceModel(group);
    // Hand_R/L are wrist bones. Use the padded palm on the rice skin, just in
    // front of each wrist, as the point that meets the edge of a tray.
    const palms=rice.hands.map((bone,i)=>{
      const pad=new T.Group();pad.name=i?'お餅の左掌':'お餅の右掌';
      pad.position.set(i?.15:-.15,-.036,.158);bone.add(pad);return pad;
    });
    return {group, name, canHold:true,
      idle(t) {poseRice(rice,neutral,t,1/60,'curious');},
      hand(side) {return palms[side==='right'?0:1];},
      grasp(right,left) {
        [right,left].forEach((target,i) => {
          if (!target) return;
          const hand=rice.hands[i];
          const here=hand.parent.worldToLocal(palms[i].getWorldPosition(vec()));
          hand.position.add(hand.parent.worldToLocal(target.clone()).sub(here));
          hand.updateMatrixWorld(true);
        });
      }
    };
  }
  const role=helpers[name] || ['兎','旅の手伝い'];
  const person=people.get(name) || {name,id:'guest_01_02',species:role[0],occupation:role[1]};
  const body=createStoryCharacter(person,{festivalGuest:guest});
  group.add(body);
  return {group,name,species:person.species,canHold:!!storyGrip(body),
    idle(t,active,phase) {poseStoryCharacter(body,t,active,{phase,effort:active?.8:0});},
    hand(side) {return storyGrip(body,side);},
    grasp(right,left) {poseStoryHands(body,{right,left});},
    working(on) {for (const side of ['right','left']) {const tool=storyTool(body,side); if(tool) tool.visible=!on;}}
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
  const footstool=new T.Group();
  batchActorParts(footstool,b=>{
    for(let j=0;j<3;j++)b.box(0,.35,(j-1)*.16,.72,.05,.154,j===1?'#ad936a':'#b69a72');
    for(const x of [-.27,.27]) for(const z of [-.15,.15]) b.rod([x*1.08,0,z*1.10],[x,.34,z],.037,'#866f51',.041);
    b.rod([-.28,.16,.15],[.28,.16,.15],.021,'#a28960');
  });
  const basinStand=footstool.clone(true);basinStand.scale.set(1.65,.82,1.65);
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
  const again=control('もう一度',()=>go(index)), lens=control('手元を拡大',()=>{detail=!detail; lens.textContent=detail?'全景を見る':'手元を拡大'; redraw();});
  const controls=element('div','scene-controls');
  top.append(place,back); controls.append(prev,again,lens,next); caption.append(by,title,line,controls);overlay.append(top,caption);
  let score,cast,items,table,topY,index,beat,player,actor,receiver,handle,node,parent,base,center,size,end,anchor,targetCenter, toolGrip, toolTip, paperAt, lowerTier;
  let participants=[],duration=1.45,elapsed=0,last=0,age=0,detail=false,callback, savedCamera;
  let moves=[], shiftedRails=[], settling=[], fitYaw=0, steam, accessory, brush, inkMark, cord, stream, onViewed, viewed, stance, otherHalf;
  function start(data,onReturn,onView) {
    if(score || !data?.beats?.length) return false;
    score=data;callback=onReturn;onViewed=onView;viewed=false;age=0;last=0;
    savedCamera={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,near:camera.near};
    const site=score.site;
    stage.position.set(site.x,site.y,site.z); stage.rotation.y=site.yaw||0; stage.visible=true;
    const chapterNo=/^guest\//.test(data.key)||data.key==='end/festival'?8:0;
    const tk=[data.number,site.place,chapterNo].join('/');
    if(!tableCache.has(tk)) tableCache.set(tk,crafts.createStoryWorktable(data.number,chapterNo,site.place));
    table=tableCache.get(tk); topY=table.userData.worktop; stage.add(table,inspectionLight,footstool,basinStand);
    if(data.key==='end/festival'){
      festivalTable ??= crafts.createStoryStillLife(11,8);
      festivalTable.position.set(-2.18,0,-.12);festivalTable.rotation.y=.12;stage.add(festivalTable);
    }
    const names=[...new Set(data.cast)];
    const get=name=>{
      const guest=data.key.startsWith('guest/') || (data.category==='結び' && data.chapter?.id==='festival');
      const key=name+(guest?'/客':'');
      if(!castCache.has(key))castCache.set(key,buildActor(name,guest));
      return castCache.get(key);
    };
    if(data.beats.some(b=>!get(data.cast[b.actor]).canHold) && !names.includes(courier)) names.push(courier);
    participants=names.map(get);cast=data.cast.map(get);
    footstool.visible=names.includes(courier);basinStand.visible=false;
    for(const a of participants) stage.add(a.group);
    steam=makeSteam();stage.add(steam);
    accessory=new T.Group();stage.add(accessory);
    ({brush,inkMark,cord,stream}=makeAccessories(accessory));setupObjects();
    dialog.dataset.performance='';dialog.setAttribute('aria-labelledby',title.id); dialog.append(overlay);
    place.textContent=data.site.name+'　／　'+data.category;
    document.getElementById('stage').classList.add('performing');
    enter(site);index=-1;go(0);next.focus({preventScroll:true});
    return true;
  }
  function setupObjects(){
    items=score.props.map((spec,i)=>{
      const o=objectFor(spec);
      const bounds=box.setFromObject(o), extent=bounds.getSize(vec()), mid=bounds.getCenter(vec());
      const columns=Math.min(3,score.props.length);
      const span=score.props.length===1?1.12:Math.min(.86,1.99/columns);
      const s=Math.min(1.35,span/Math.max(extent.x,extent.z,.08),.70/Math.max(.06,extent.y));
      const wrap=new T.Group();o.scale.multiplyScalar(s);
      o.position.sub(mid.multiplyScalar(s));o.position.y+=extent.y*s*.5;wrap.add(o);
      wrap.position.set(((i%3)-(columns-1)/2)*.65,topY+.005,-.19+Math.floor(i/3)*.34);
      stage.add(wrap);return {wrap,o,spec,rest:new Map()};
    });
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
  function stageBox(object){
    // Bounds in stage axes even when the location faces a different compass bearing.
    const inv=stage.matrixWorld.clone().invert(), out=new T.Box3(), local=new T.Box3(), matrix=new T.Matrix4();
    object.updateWorldMatrix(true,true);
    object.traverseVisible(n=>{
      if(!n.isMesh || !n.visible) return;
      if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();
      out.union(local.copy(n.geometry.boundingBox).applyMatrix4(matrix.multiplyMatrices(inv,n.matrixWorld)));
    });
    return out;
  }
  function parkHandle(){
    if(handle && node){
      handle.updateWorldMatrix(true,true);parent.attach(node);handle.removeFromParent();
    }
    handle=node=parent=null;
  }
  function layoutActors(){
    const members=participants, active=members.indexOf(player);
    const others=members.filter(a=>a!==player);
    for(const [i,a] of members.entries()){
      const rank=others.indexOf(a), lane=(rank%2===0?1:-1)*(1.03+.65*Math.floor(rank/2));
      a.working?.(i===active);
      const serving=items[beat.prop].spec.code==='food';
      const pos=i===active ? vec(center.x,0,serving?-.90:-.74) : vec(lane,0,-.86-.46*Math.floor(rank/2));
      if(a===actor && a!==player && beat.part==='蒸し箱の上段'){pos.x+=.85;pos.z-=.67;}
      if(a===receiver && a!==player){const pass=beat.gesture==='pass';pos.x=center.x+(center.x>.28?-1:1)*(pass?.85:1.25);pos.z=pass?-.76:-1.04;}
      a.group.rotation.set(0,i===active?(beat.part==='合わせ餅'||serving?.45:.06):-Math.atan2(pos.x,.90)*.74,0);
      if(a.name===courier){
        pos.y=Math.max(.19,topY-.43);footstool.scale.y=pos.y/.375;
        footstool.position.set(pos.x,0,pos.z);footstool.rotation.y=a.group.rotation.y;
      }
      if(a.species==='蛸'){
        pos.y=score.site.region==='ryugu'?.41:.307;
        if(i===active){pos.x-=.37;pos.z-=.06;a.group.rotation.y=.58;}
        if(score.site.region!=='ryugu'){basinStand.visible=true;basinStand.position.set(pos.x,0,pos.z);}
      }
      if(a.species==='象' && i===active){pos.x-=.82;pos.z-=.43;a.group.rotation.y=.85;}
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
    const previousPlaces=i ? participants.map(a=>a.group.position.clone()):null;
    parkHandle();index=i;beat=score.beats[i];
    actor=cast[beat.actor];player=actor.canHold?actor:participants.find(a=>a.name===courier);
    receiver=beat.partner!=null?cast[beat.partner]:null;
    const item=items[beat.prop]; const part=beat.part||item.spec.part;
    let semantic;
    item.o.traverse(n=>{
      if(!semantic && n.userData.performPart?.split(' ').includes(beat.gesture))semantic=n;
    });
    const explicit=part && item.o.getObjectByName(part);
    node=explicit || semantic || item.o;
    otherHalf=null;
    if(item.spec.code==='food' && beat.gesture==='divide'){
      const pastry=item.o.getObjectByName('取り分ける餅') || item.o.children.at(-1);
      item.split ??= dividePastry(pastry,item.spec.region);
      node=item.split.children[1];otherHalf=item.split.children[0];
    }else if(item.split && node.name==='取り分ける餅')node=item.split.children[1];
    if(beat.gesture==='divide' && item.o.getObjectByName('割餅右')){
      node=explicit || item.o.getObjectByName('割餅右');otherHalf=item.o.getObjectByName(node.name==='割餅左'?'割餅右':'割餅左');
    }
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
    base=center.clone();handle=new T.Group();handle.position.copy(center);stage.add(handle);handle.attach(node);
    lowerTier=beat.part==='蒸し箱の上段'?stage.worldToLocal(item.o.localToWorld(vec(0,.10,0))):null;
    targetCenter=beat.target!=null && items[beat.target]!==item ? stageBox(items[beat.target].o).getCenter(vec()) : null;
    toolGrip=item.spec.code==='tool'?handle.worldToLocal(node.getWorldPosition(vec())):null;
    toolTip=null;paperAt=null;
    if(toolGrip && beat.gesture==='write' && beat.target!=null){
      toolTip=handle.worldToLocal(node.localToWorld(vec(-.027,-.135,0)));
      const page=stageBox(items[beat.target].o);
      paperAt=page.getCenter(vec()).setY(page.max.y+.003);
    }
    shiftedRails=[];
    if(beat.pose==='spaced' && node.name!=='蒸し箱の上段' || beat.gesture==='fit' && node.name.startsWith('取り外し桟')){
      for(let j=0;j<3;j++){
        const rail=item.o.getObjectByName('取り外し桟'+j);
        if(rail && rail!==node) shiftedRails.push({rail,from:rail.position.clone(),to:vec((j-1)*.213,.169,0)});
      }
    }
    layoutActors();stance=player.group.position.clone();
    moves=participants.map((a,j)=>({a,from:previousPlaces?.[j]||a.group.position.clone(),to:a.group.position.clone()}));
    if(player.name===courier)footstool.position.x=stance.x;
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
    if(g==='point'||g==='write'||g==='tie'||g==='divide'||g==='compare') end.copy(base);
    if(paperAt)end.copy(paperAt).sub(toolTip);
    if(g==='point' && toolGrip)end.copy(hold);
    if(item.spec.role==='drum' && targetCenter && g==='lift')end.copy(targetCenter).add(vec(0,size.y*.51+.03,.015));
    if(g==='set'||g==='fit'||g==='stack') {
      if(targetCenter) end.copy(targetCenter).setY(stageBox(items[beat.target].o).max.y+size.y*.5+.008);
      else end.set(center.x,topY+size.y*.5+.01,-.17);
    }
    if(beat.part==='蒸し箱の上段'){
      const owner=item.o;
      const dest=beat.pose==='single'?vec(-.48,.25,0):beat.pose==='spaced'?vec(0,.212,0):vec(0,.171,0);
      const source=stage.worldToLocal(node.getWorldPosition(vec()));
      end.copy(center).add(stage.worldToLocal(owner.localToWorld(dest)).sub(source));
    }
    if(beat.part?.startsWith('取り外し桟') && g==='fit'){
      const j=Number(beat.part.slice(-1))||0;
      end.copy(center).add(stage.worldToLocal(item.o.localToWorld(vec((j-1)*.213,.169,0))).sub(stage.worldToLocal(node.getWorldPosition(vec()))));
    }
    if(g==='divide' && otherHalf) end.copy(base).add(vec(.105,.055,.012));
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
    if(g==='pass' && receiver) end.x+=receiver.group.position.x>center.x?.32:-.32;
    duration=['turn','pass','fit','open','stack','write','divide','pour','tie'].includes(g)?1.8:1.4;
    elapsed=reduced.matches?duration:0; last=0;
    steam.visible=Boolean(beat.pose && ['single','spaced'].includes(beat.pose) && item.spec.code==='steamer');
    steam.position.set(center.x,topY+.19,center.z);
  }
  function go(i) {
    if(!score || i<0 || i>=score.beats.length)return;
    if(i<=index) {
      parkHandle();for(const item of items){crafts.releaseStoryEvidence(item.o);item.wrap.removeFromParent();}setupObjects();
      for(let j=0;j<i;j++){beginBeat(j);pose(1);}
    }else if(index>=0)pose(1);
    beginBeat(i); detail=!!beat.part && ['turn','fit','lift','stack','compare'].includes(beat.gesture);
    by.textContent=(index+1)+' ／ '+score.beats.length+'　'+(actor===player?actor.name:'案内 '+actor.name+'　／　手元 '+player.name);
    title.textContent=score.title;line.textContent=actor!==player && beat.helperCaption ? beat.helperCaption : beat.caption;
    lens.textContent=detail?'全景を見る':'手元を拡大';prev.disabled=index===0;
    next.textContent=index===score.beats.length-1?'場面を結ぶ':'次の所作';
    redraw();
  }
  function pose(t) {
    const r=smooth((t-.20)/.68), reach=smooth(t/.27), arch=Math.sin(r*Math.PI), g=beat.gesture;
    handle.position.copy(base).lerp(end,r);
    if(['pass','set','stack','fit','divide'].includes(g))handle.position.y+=.10*arch;
    const angle=g==='turn'?-2.64:g==='open'?-1.05:g==='present'?-.25:g==='pour'?.86:0;
    handle.rotation.set(angle*r,(g==='divide' && otherHalf?-1.24:['point','write','tie','compare'].includes(g)?0:.09)*r,g==='pour'?-.52*r:0);
    if(toolGrip && g==='point')handle.rotation.z+=.63*r;
    if(paperAt){
      const u=smooth((t-.40)/.55);handle.rotation.set(0,0,0);
      handle.position.lerpVectors(base,end,smooth(t/.40));
      handle.position.x+=(u-.5)*.13;handle.position.z+=Math.sin(u*11)*.017;
      inkMark.position.copy(paperAt).add(vec(-.065+u*.065,.002,0));
      inkMark.scale.set(Math.max(.001,u)*.13,1,.005);
    }
    if(fitYaw)handle.rotation.y=fitYaw*r;
    for(const move of settling){
      const fold=smooth(t/.44);
      move.part.position.lerpVectors(move.from,move.rest.p,fold);
      move.part.quaternion.slerpQuaternions(move.q,move.rest.q,fold);
    }
    if(items[beat.prop].spec.code==='food'){
      crafts.poseStoryFood(node,g,r);
    }
    if(g==='open')handle.position.z-=.10*arch;
    for(const move of moves)move.a.group.position.lerpVectors(move.from,move.to,smooth(t/.26));
    if(actor!==player){
      actor.group.rotation.x=.04+.055*Math.sin(r*Math.PI);
      actor.group.rotation.z=.018*Math.sin(r*Math.PI*2);
    }
    for(const part of shiftedRails)part.rail.position.lerpVectors(part.from,part.to,r);
    for(const [j,a] of participants.entries())a.idle(age+.61*j,a===actor || a===player,t);
    stage.updateWorldMatrix(true,true);
    const radius=Math.min(.22,Math.max(.027,size.x*.38));
    const pt=(side,sy=0)=>handle.localToWorld(vec(side*radius,sy,-size.z*.27));
    const right=pt(anchor),left=pt(-anchor);
    if(otherHalf){const rest=stageBox(otherHalf).getCenter(vec());left.copy(stage.localToWorld(rest));}
    if(g==='pour'){
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
    const rGoal=reachHand(player,'right',right,reach);
    const lGoal=player.hand('left') && (!singleHand.has(g) || otherHalf)?reachHand(player,'left',left,reach):null;
    player.grasp(rGoal,lGoal);
    // Lean or step into the work if the wrist reaches its anatomical limit.
    // Solve from the original standing place on every frame to avoid drift.
    if(player.name!==courier && reach>.1){
      const error=rGoal.clone().sub(player.hand('right').getWorldPosition(vec()));
      if(lGoal)error.lerp(lGoal.clone().sub(player.hand('left').getWorldPosition(vec())),.46);
      const local=stage.worldToLocal(stage.getWorldPosition(vec()).add(error));
      player.group.position.add(vec(T.MathUtils.clamp(local.x,-.22,.22),0,T.MathUtils.clamp(local.z,-.095,beat.part==='合わせ餅'||items[beat.prop].spec.code==='food'?.115:.27)));
      player.group.updateWorldMatrix(true,true);player.grasp(rGoal,lGoal);
    }
    if(receiver?.canHold && receiver!==player && g==='pass') {
      receiver.working?.(true);
      receiver.grasp(reachHand(receiver,'right',left,smooth((r-.46)/.53)),null);
    }
    if(steam.visible) for(const [j,w] of steam.children.entries()){
      const phase=(age*.60+j*.29)%1;
      w.position.set(Math.sin(phase*4+j)*.045+(j-1)*.068,phase*.34,0);
      w.material.opacity=.50*Math.sin(phase*Math.PI)*r;
    }

  }
  function redraw(){
    if(!score) return;
    pose(Math.min(1,elapsed/duration));
    const aspect=camera.aspect, proximity=detail ? .93:1.72;
    const focus=handle.position.clone();focus.y=detail?focus.y-.06:topY+.21;focus.z=detail?focus.z:-.32;
    if(!detail)focus.x*=.46;
    if(detail && lowerTier){focus.lerp(lowerTier,.52);focus.y-=.14;}
    const broad=Math.max(size.x,size.z)>.65;
    const elephant=player.species==='象', octopus=player.species==='蛸', festival=score.key==='end/festival' && !detail;
    if(festival){focus.x-=.70;focus.y+=.20;}
    if(elephant && !detail){focus.y+=.35;focus.x-=.18;}
    if(octopus && !detail){focus.y+=.14;focus.x-=.12;}
    const tiersWidth=lowerTier && detail ? Math.abs(handle.position.x-lowerTier.x)+size.x+.38 : 0;
    const distance=Math.max(tiersWidth/(.61*Math.max(.32,aspect)),detail?(broad?1.84:1.43):festival?4.70:elephant?3.75:2.75,proximity/(Math.max(.36,aspect)*.75));
    const rise=detail?(lowerTier?.92:.48):.31;
    camera.position.copy(stage.localToWorld(focus.clone().add(vec(elephant?1.62:octopus?1.03:detail?(beat.part==='合わせ餅'?.68:.24):.28,distance*rise,distance))));
    camera.near=.045;camera.fov=detail?34:41;camera.updateProjectionMatrix();
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
    parkHandle();for(const item of items)crafts.releaseStoryEvidence(item.o);for(const a of participants)a.working?.(false);
    accessory.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});
    for(const w of steam.children)w.material.dispose();steam.children[0].geometry.dispose();
    stage.clear();stage.visible=false;score=null;items=participants=[];steam=null;
    overlay.remove();delete dialog.dataset.performance;dialog.setAttribute('aria-labelledby','dialog-title');
    document.getElementById('stage').classList.remove('performing');
    camera.fov=savedCamera.fov;camera.near=savedCamera.near;camera.position.copy(savedCamera.position);camera.quaternion.copy(savedCamera.quaternion);camera.updateProjectionMatrix();
    leave();done?.(complete);
  }
  dialog.addEventListener('cancel',event=>{if(score){event.preventDefault();finish(false);}});
  return {start,close:()=>finish(false),get active(){return !!score;},frame(now){
    if(last && now-last<30) return;
    const dt=last?Math.min((now-last)/1000,.09):0;last=now;if(!reduced.matches)age+=dt;elapsed+=dt;redraw();
  }};
}
function makeSteam(){
  const g=new T.Group(), curve=new T.CatmullRomCurve3([vec(0,0,0),vec(.025,.044,0),vec(-.014,.105,.008),vec(.018,.17,.012)]);
  const geometry=new T.TubeGeometry(curve,12,.008,4,false);
  for(let i=0;i<3;i++)g.add(new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xfff4dc,transparent:true,depthWrite:false})));
  return g;
}

function makeAccessories(group){
  function mesh(geo,color,parent,metal=0){
    const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.84,metalness:metal}));
    parent.add(m);return m;
  }
  const brush=new T.Group();group.add(brush);
  const barrel=mesh(new T.CylinderGeometry(.009,.012,.207,12),0xb58950,brush);barrel.position.y=.155;
  const binding=mesh(new T.CylinderGeometry(.013,.012,.031,14),0x534735,brush);binding.position.y=.057;
  const bristles=mesh(new T.LatheGeometry([[.001,0],[.006,.012],[.010,.023],[.011,.043]].map(([x,y])=>new T.Vector2(x,y)),12),0x352e24,brush);
  bristles.rotation.z=-.07;
  const inkMark=mesh(new T.SphereGeometry(.5,12,6),0x514b3a,group);inkMark.geometry.scale(1,.006,1);
  const cord=mesh(new T.TorusGeometry(1,.048,7,42),0x9c7652,group);cord.geometry.rotateX(Math.PI/2);
  const stream=mesh(new T.CylinderGeometry(.009,.005,.25,9),0xab9975,group);stream.geometry.translate(0,-.125,0);
  return {brush,inkMark,cord,stream};
}
