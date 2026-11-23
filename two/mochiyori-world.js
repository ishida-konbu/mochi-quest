import { Box3, Group, Raycaster, Vector3 } from './vendor/three.module.min.js';
import { storyBodyCores } from './story-prop-contacts.js';
import { createModelContacts } from './story-model-contacts.js';
import { CAST } from './mochiyori-story.js';
import { STORY_SITES } from './story-sites.js';
import { placeKey } from './mochiyori-progress.js';
import { createStoryCharacter, poseStoryCharacter, createStoryStillLife } from './story-models.js';
import { REGIONS, canOccupy, groundHeight, landscapeFloor, staticVolumeAt, wrapDelta } from './terrain.js';

import { tablePlan, workDrawerSize, counterLeaves } from './story-table-plan.js';
import { visitorMark, conversationView, bodySightline, shortRoute, worktopMark, workshopDetour } from './mochiyori-blocking.js';
import { palaceInteriorAt } from './ryugu-layout.js';
import { createFieldwork } from './mochiyori-fieldwork.js';
import { createParcelWorld } from './story-parcel-world.js';

const helpers = [
  {id:'road-tea-host',region:'peach',name:'茶屋の亭主',species:'兎',occupation:'桃山の団子茶屋の亭主',line:'よく歩いたね。茶を一杯どうだい。桃林へ入る道なら、うちの前を通るよ。'},
  {id:'charcoal-burner',region:'peach',name:'炭焼き',species:'蛙',occupation:'山道の炭焼き',line:'炭俵を届けた帰りでね。ひと息ついてから、また山へ戻るよ。'}
];
const residents = [...CAST, ...helpers];
const byName = new Map(residents.map(person => [person.name,person]));
const festivalGuests = ['弥平','八重','桃子','墨八','お澄','ささ','ちよ'];
const residentsAtHome = { おこげ:'rashomon', 宗伯:'court', すずり:'court', ちよ:'teahouse', 玄鐘:'bell', '茶屋の亭主':'road-tea', 炭焼き:'road-tea' };
const locations = new Map(STORY_SITES.map(site => {
  const key = placeKey(site.region,site.place);
  return [key,{...site,key,number:REGIONS.findIndex(r => r.id === site.region)+1}];
}));
export const locationFor = (region, place) => locations.get(placeKey(region, place));
export function peopleAt(site, book) {
  const chapter = book.current();
  const visitors = new Map();
  for (const clue of chapter?.clues || []) {
    const where = placeKey(clue.region, clue.place);
    if (clue.characterId) visitors.set(clue.characterId, where);
  }
  // In the fifth chapter reports along the mountain road must lead to the missing artisan himself.
  if (book.index >= 4) visitors.set(byName.get('弥平').id, placeKey('peach'));
  const summoned = (chapter && book.ready()) ? ({
    mystery_01:['八重'], mystery_02:['楓','八重'], mystery_03:['望','お冬','結','八重'],
    mystery_06:['宗伯','お澄','すずり','勘兵衛','八重'],
    mystery_07:['宗伯','八重','すずり','お澄','勘兵衛','版次','弥平'],
    festival:['おこげ','ささ','弥平','八重','お澄','桃子','墨八','ちよ']
  }[chapter.id] || []) : [];
  for (const name of summoned) visitors.set(byName.get(name).id, placeKey(chapter.verdictRegion,chapter.verdictPlace));
  if (!chapter) for (const name of festivalGuests) visitors.set(byName.get(name).id,placeKey('kyo'));
  // Keep each person's place while a clue is heard. Changing the order on
  // every entry used to make the witness jump to the other side of the table.
  return residents.filter(person => (visitors.get(person.id) || placeKey(person.region,residentsAtHome[person.name])) === site.key);
}
const builtIn = {rashomon:'羅生門の老婆餅', bell:'鐘を守る僧餅'};
const offsets = [[-1.58,-.66],[1.58,-.66],[-.65,-1.69],[.96,-1.93],
  [-3.02,-1.3],[3.10,-1.5],[-2.73,1.0],[2.85,1.0],[-1.50,-3.30],[1.45,-3.30],
  [-4.15,.58],[4.16,.54],[-.3,-3.8],[-3.73,-2.91],[3.92,-2.89]];
const seatCache = new Map();
// Front and rear extents include a lowered muzzle or a long projecting shell.
const silhouettes={'亀':[.61,1.16,1.05],'牛':[.52,1.29,1.13],'象':[.68,1.59,1.26],
  '鹿':[.35,1.04,.94],'猪':[.44,.99,.91],'狐':[.33,.78,.76],
  '鯛':[.52,.76,.68],'蛸':[.55,.64,.60],'海亀':[.51,.70,.58]};
function seatsAt(site,cast) {
  const cacheKey=site.key+'/'+cast.map(c=>c.id).join(',');
  if(seatCache.has(cacheKey))return seatCache.get(cacheKey);
  const seats=[],occupied=[],yaw=site.yaw||0,plan=tablePlan(site.number,site.place);
  const starts=site.region==='river' ? [[-1.76,-.40],[-.32,-.82],[1.79,-.38],...offsets.slice(3)] : offsets;
  const ledges=counterLeaves(plan);
  for(const [i,person] of cast.entries()){
    const [r,front,back]=silhouettes[person.species] || [.35,.41,.40];
    let seat;
    for(let j=0;j<starts.length && !seat;j++){
      const [u,v]=starts[(i+j)%starts.length];
      const outward=Math.atan2(u,v);
      for(const extra of [0,.26,.55,.88,1.28,1.75,2.25]){
        const a=u+Math.sin(outward)*extra,b=v+Math.cos(outward)*extra;
        const angle=-Math.atan2(a,2.9),sn=Math.sin(angle),cs=Math.cos(angle);
        const samples=[r-back,0,front-r].map(offset=>[a+sn*offset,b+cs*offset,r]);
        if(site.place!=='road-tea' && samples.some(([x,z])=>Math.hypot(
            Math.max(0,Math.abs(x)-plan.width*.5),Math.max(0,Math.abs(z)-plan.depth*.5))<r+.055))continue;
        if(site.place!=='road-tea' && samples.some(([x,z])=>{
          // A neighbour's shell, nose or toes also need to clear the open
          // tray while the other resident is working the pull.
          const near=-plan.depth*.5, far=near-workDrawerSize.depth-.11;
          return Math.hypot(Math.max(0,Math.abs(x)-workDrawerSize.width*.5),
            Math.max(0,far-z,z-near))<r+.06;
        }))continue;
        if(site.place!=='road-tea' && samples.some(([x,z])=>ledges.some(ledge=>Math.hypot(
          Math.max(0,Math.abs(x-ledge.x)-ledge.width*.5),Math.max(0,Math.abs(z-ledge.z)-ledge.depth*.5))<r+.06)))continue;
        if(samples.some(([x,z])=>occupied.some(([ox,oz,or])=>Math.hypot(x-ox,z-oz)<r+or+.09)))continue;
        const x=site.x+a*Math.cos(yaw)+b*Math.sin(yaw),z=site.z+b*Math.cos(yaw)-a*Math.sin(yaw);
        const y=groundHeight(x,z,site.y+.4);
        if(Math.abs(y-site.y)>.82 || samples.some(([u,v])=>{
          const sx=site.x+u*Math.cos(yaw)+v*Math.sin(yaw),sz=site.z+v*Math.cos(yaw)-u*Math.sin(yaw);
          return Math.abs(groundHeight(sx,sz,y)-y)>.34 || !canOccupy(sx,sz,y+.04,r,1.55);
        }))continue;
        seat={x,y,z,yaw:yaw+angle};occupied.push(...samples);break;
      }
    }
    if(!seat)throw new Error(site.name+'に'+person.name+'の立ち位置がありません');
    seats.push(seat);
  }
  seatCache.set(cacheKey,seats);return seats;
}

const bounds = new Box3();
const floor = new Vector3();
export function createStoryWorld(scene, book, collisions, getHero = () => null, getPickup = () => null) {
  const group = new Group();
  group.name = 'もち寄り祭の仕事場';
  scene.add(group);
  const tables = new Map(), animals = new Map(), shapes = new WeakMap(), headOffsets = new WeakMap();
  const framingTables=new Map(), footsteps=new WeakMap();
  const parcels = createParcelWorld(group,book,getHero);
  const work = createFieldwork(scene,{...parcels,courierMark});
  function shape(model,skip) {
    if (!shapes.has(model)) shapes.set(model,createModelContacts(model,skip));
    return shapes.get(model);
  }
  let chapter = -1, stations = [], speakers = [], nextSurvey = -Infinity;
  let lastX = Infinity, lastZ = Infinity, lastY = Infinity, revision = 0, drawnRevision = -1;
  let held = null;
  let visitor, blocking, queuedAction;
  const facing = new Vector3();
  function holdSpeaker(id) {
    if(!id && held)work.stop();
    if (blocking && !blocking.host.external && !work.controls(blocking.host.actor)) blocking.host.actor.rotation.y=blocking.homeYaw;
    blocking = queuedAction = null;
    held = id || null;
    const host = held && speakers.find(s => s.person.id === held);
    if (!host || !visitor) return;
    const feet = host.actor.getWorldPosition(new Vector3());
    host.actor.getWorldDirection(facing);
    const yaw = Math.atan2(facing.x, facing.z);
    const frontage = ({'象':1.55,'牛':1.24,'鹿':1.04,'亀':1.04,'猪':.94,'狐':.80})[host.person.species] || .59;
    const full=visitor.buffs?.full > 0, height=full?2.15:1.7;
    // Reserve the rice body on every stride. A saved traveller already
    // brushing a counter can ease out of that overlap on the first step.
    const footing=(radius,departing=false)=>{
      const initial=departing?(collisions?.penetration(visitor.x,visitor.z,visitor.y+.025,height,radius) || 0):0;
      return (x,z,previous)=>{
        const y=groundHeight(x,z,previous),travel=Math.hypot(x-visitor.x,z-visitor.z);
        const allowance=Math.max(0,initial-travel*.65);
        return canOccupy(x,z,y+.025,radius,height) && (collisions?.penetration(x,z,y+.025,height,radius) || 0)<=allowance ? y : NaN;
      };
    };
    const onFoot=visitor.grounded && !visitor.mount && !visitor.activity && !visitor.skiff && !visitor.inWater;
    const bench=framingTables.get(host.site.key)?.table,stand=footing(full?1.05:.86),walk=footing(full?.83:.67,true);
    const point=new Vector3(),plan=bench && (bench.userData.width?bench.userData:tablePlan(host.site.number,host.site.place));
    function audienceSide(x,z,lastY){
      if(bench){
        bench.worldToLocal(point.set(x,lastY,z));
        const back=-plan.depth*.5;
        // Leave room behind the open drawer for the artisan's crouch
        // and the next helper. At the ends there is room for both guests.
        if(point.z<back && point.z>back-1.95 && Math.abs(point.x)<plan.width*.5+.44)return NaN;
      }
      return stand(x,z,lastY);
    }
    let mark=onFoot && visitorMark(visitor,feet,yaw,frontage,walk,audienceSide);
    if(onFoot && !mark && bench){
      const dir=bench.getWorldDirection(new Vector3());
      mark=visitorMark(visitor,bench.getWorldPosition(new Vector3()),Math.atan2(dir.x,dir.z),.40,walk,audienceSide);
      // From directly behind a crowded counter, either end or one step
      // further back may be the only reachable place outside its work aisle.
      if(!mark)for(const back of [-plan.depth*.5-2.09,-plan.depth*.5-.94,0,.56])for(const side of [0,1,-1]){
        const p=bench.localToWorld(new Vector3(side*(plan.width*.5+1.10),0,back));
        p.y=audienceSide(p.x,p.z,visitor.y);
        if(!Number.isFinite(p.y))continue;
        const route=shortRoute(visitor,p,walk);if(!route)continue;
        const length=route.reduce((n,q,i)=>n+Math.hypot(q.x-(i?route[i-1]:visitor).x,q.z-(i?route[i-1]:visitor).z),0);
        if(!mark || length<mark.length)mark={route,to:p,length};
      }
    }
    const stance = mark?.to || visitor;
    const surface = feet.clone().addScaledVector(facing, frontage);
    surface.y = feet.y + Math.min(1.4, (headOffsets.get(host.actor) || 1.7) * .60);
    const viewer = new Vector3(stance.x, stance.y + .95, stance.z);
    blocking={host,feet,frontage,route:mark?.route || [],time:0,homeYaw:host.actor.rotation.y,
      yaw,viewer,surface,settling:onFoot,rest:0,remaining:Infinity,waiting:0};
  }
  let passDetour;
  function courierMark(goal,precise=false){
    const actor=getHero(),p=visitor;
    if(!actor?.userData.storyRestPalm || !p?.grounded || p.activity || p.skiff || p.inWater)return null;
    const palm=actor.worldToLocal(actor.userData.storyRestPalm.clone()),full=p.buffs?.full>0;
    const height=full?2.15:1.7;
    const moving=full?.46:.33,standing=full?.96:.69;
    const initial=collisions?.penetration(p.x,p.z,p.y+.025,height,moving) || 0;
    function floor(x,z,y,r){
      const h=groundHeight(x,z,y),allowance=r===moving?Math.max(0,initial-Math.hypot(x-p.x,z-p.z)*.65):0;
      return canOccupy(x,z,h+.025,r,height) && (collisions?.penetration(x,z,h+.025,height,r) || 0)<=allowance?h:NaN;
    }
    const walk=(x,z,y)=>floor(x,z,y,moving);
    passDetour??=workshopDetour({x:p.x,y:p.y,z:p.z},walk);
    const stance=(x,z,y)=>floor(x,z,y,standing);
    const hand=precise ? actor.getObjectByName('配達人の受け手') : null;
    if(!hand?.userData?.storyAim)return worktopMark(p,goal,palm,walk,stance,passDetour);
    const joints=[];
    for(let joint=hand;joint && joint!==actor.parent;joint=joint.parent){
      joints.push({joint,at:joint.position.clone(),turn:joint.quaternion.clone()});
    }
    // The rice mitt is lateral and the chest stretches differently up and
    // across. Test the actual solved mitt with both feet on each candidate.
    function measure(mark,yaw){
      const feet=new Vector3(mark.x,mark.y,mark.z);
      actor.position.copy(actor.parent?actor.parent.worldToLocal(feet):feet);
      actor.rotation.y=yaw;
      return hand.userData.storyAim({point:goal,strength:1,handoff:true}).distanceTo(goal);
    }
    try{return worktopMark(p,goal,palm,walk,stance,passDetour,measure);}
    finally{
      for(const {joint,at,turn} of joints){joint.position.copy(at);joint.quaternion.copy(turn);}
      actor.updateWorldMatrix(true,true);
    }
  }
  function walkInput(p,dt) {
    const meeting=work.passMark;
    if(meeting && blocking && p.grounded && !p.activity && !p.skiff && !p.inWater){
      const actor=getHero(),goal=meeting.point;
      if(!meeting.route){
        const best=courierMark(goal),palm=actor.worldToLocal(actor.userData.storyRestPalm.clone());
        meeting.route=best?.route || [];
        meeting.yaw=best?.yaw ?? Math.atan2(goal.x-p.x,goal.z-p.z)-Math.atan2(palm.x,palm.z);
      }
      const path=meeting.route;
      while(path.length){
        const tolerance=meeting.precise && path.length===1 ? .012 : .075;
        if(Math.hypot(path[0].x-p.x,path[0].z-p.z)>=tolerance)break;
        path.shift();
      }
      if(path.length){
        const dx=path[0].x-p.x,dz=path[0].z-p.z,gain=Math.min(1.9,.43/Math.max(.05,Math.hypot(dx,dz)));
        return {x:dx*gain,z:dz*gain};
      }
      const turn=Math.atan2(Math.sin(meeting.yaw-p.heading),Math.cos(meeting.yaw-p.heading));
      p.heading+=Math.max(-dt*3.6,Math.min(dt*3.6,turn));
      return {x:0,z:0};
    }
    if (!blocking || !blocking.settling) return null;
    blocking.time+=dt;
    const route=blocking.route;
    while(route.length && Math.hypot(route[0].x-p.x,route[0].z-p.z)<.10){
      route.shift();blocking.remaining=Infinity;blocking.waiting=0;
    }
    if(route.length && p.grounded && !p.inWater){
      const dx=route[0].x-p.x,dz=route[0].z-p.z,remaining=Math.hypot(dx,dz);
      if(remaining<blocking.remaining-.025){blocking.remaining=remaining;blocking.waiting=0;}
      else blocking.waiting+=dt;
      if(blocking.waiting<.72){
        const gain=Math.min(.56/Math.max(.05,remaining),1.9);
        return {x:dx*gain,z:dz*gain};
      }
      // Someone entered the aisle after the survey. Let the host work
      // from the place the traveller actually reached.
      route.length=0;
    }
    blocking.viewer.set(p.x,p.y+.95,p.z);
    const {feet,yaw,frontage}=blocking;
    p.heading=Math.atan2(feet.x+Math.sin(yaw)*frontage-p.x,feet.z+Math.cos(yaw)*frontage-p.z);
    blocking.rest+=dt;
    if (blocking.rest>=.42) blocking.settling=false;
    return {x:0,z:0};
  }
  function conversationShot(aspect, arrivalYaw, closeUp=false, workingPoint=null) {
    if (!blocking || closeUp && !work.focus) return null;
    const {host, surface, yaw} = blocking;
    const viewer = closeUp ? new Vector3(visitor.x,visitor.y+.85,visitor.z) : blocking.viewer;
    const hand = closeUp ? work.focus.clone() : null;
    const pitch = closeUp ? .40 : .25;
    const hero=getHero(), boxes=[];
    const subjects=speakers.filter(s=>s.site===host.site).map(s=>s.actor);
    if(hero)subjects.push(hero);
    const station=framingTables.get(host.site.key),table=station?.table;
    if(table?.children[0])subjects.push(table.children[0]);
    for(const subject of subjects){
      subject.updateWorldMatrix(true,true);
      subject.traverseVisible(mesh=>{
        if(!mesh.isMesh || mesh.material?.visible===false || mesh.material?.transparent && !mesh.material.depthWrite)return;
        if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
        const box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if(box.max.y-box.min.y>.10 && box.max.x-box.min.x>.07 && box.max.z-box.min.z>.07)boxes.push(box);
      });
    }
    // Reserve the courier's final silhouette as well as the place they occupy
    // when E is pressed. The camera stays on its chosen mark while they walk.
    const bodyRadius=visitor.buffs?.full>0?1.05:.84;
    const solid=(x,y,z,margin)=>staticVolumeAt(x,z,y-.07,.10,.16) ||
      ((x-viewer.x)**2+(z-viewer.z)**2)/(bodyRadius+Math.min(.1,margin))**2+((y-viewer.y)/bodyRadius)**2 < 1 ||
      boxes.some(b=>
      x>b.min.x-margin && x<b.max.x+margin && z>b.min.z-margin && z<b.max.z+margin && y>b.min.y-.025 && y<b.max.y+.025);
    const points = [surface, viewer, blocking.feet.clone().setY(surface.y+.52)];
    const sights=hand ? [hand] : workingPoint ? [workingPoint.clone(),surface] : [surface];
    if (table) {
      const plan=table.userData.width ? {width:table.userData.width,depth:table.userData.depth,top:table.userData.worktop}
        : tablePlan(host.site.number,host.site.place);
      // Include both ends of the real counter. A witness may fetch a paper
      // from a drawer at the far end before carrying it back to their hands.
      for (const side of [-1,1]) for (const end of [-1,1]) {
        points.push(table.localToWorld(new Vector3(side*plan.width/2,plan.top+.09,end*plan.depth/2)));
      }
      for(const wing of table.children.filter(o=>o.name==='引き出し脇の折敷')){
        points.push(wing.localToWorld(new Vector3(Math.sign(wing.position.x)*wing.userData.width*.40,wing.userData.worktop+.12,-wing.userData.depth*.5)));
      }
      if(!hand){
        // The first picked-up leaf lies at the opposite end of the counter
        // from the witness. Check the actual objects as well as their hands.
        for(const across of [-.37,0,.37])for(const depth of [-.23,.26]){
          sights.push(table.localToWorld(new Vector3(across*plan.width,plan.top+.09,depth*plan.depth)));
        }
        const loose=station.pickup && parcels.pickupObject(station.pickup.id);
        if(loose && !workingPoint)sights.unshift(new Box3().setFromObject(loose).getCenter(new Vector3()));
      }
    }
    const pull=table?.getObjectByName('引き出しの取っ手');
    let apron;
    if(pull){
      const closed=pull.parent.parent.localToWorld(pull.position.clone());
      const outward=pull.parent.getWorldDirection(new Vector3());
      const open=closed.clone().addScaledVector(outward,table.userData.seated?.31:.585);
      const body=open.clone().addScaledVector(outward,.44);body.y+=.56;
      apron={closed,open,body};
      points.push(open);
    }
    // The shell of a watching turtle can obscure a pull even with the hero
    // and counter in clear profile. Cache the bystanders once per camera mark.
    const neighbours=[];
    for(const who of speakers){
      if(who===host || who.site.key!==host.site.key)continue;
      const extent=new Box3().setFromObject(who.actor);
      const size=extent.getSize(new Vector3()),centre=extent.getCenter(new Vector3());
      centre.y=extent.min.y+size.y*.46;
      neighbours.push({centre,r:Math.max(.17,Math.min(size.x,size.z)*.43),h:Math.max(.20,size.y*.42)});
    }
    const focus = hand || new Box3().setFromPoints(points).getCenter(new Vector3());
    function distanceFor(heading,ratio) {
      if (hand) return Math.max(2.05,1.36/Math.max(.34,ratio));
      const sx=Math.sin(heading), cz=Math.cos(heading);
      const tangent=Math.tan((ratio<1?65:57)*Math.PI/360);
      let range=3.5;
      for (const point of points) {
        const dx=point.x-focus.x, dz=point.z-focus.z;
        const across=Math.abs(dx*cz-dz*sx), depth=dx*sx+dz*cz;
        const horizontal=(across+.42)/(tangent*Math.max(.32,ratio)*.84);
        const vertical=(Math.abs(point.y-focus.y)+.62+.32*Math.abs(depth))/(tangent*.82);
        range=Math.max(range, depth+Math.max(horizontal,vertical));
      }
      return range;
    }
    const palace = palaceInteriorAt(viewer.x,viewer.z,viewer.y-.95);
    function armClearance(angle) {
      const range=distanceFor(angle,aspect), horizontal=Math.cos(pitch)*range;
      const dx=Math.sin(angle)*horizontal, dz=Math.cos(angle)*horizontal, dy=Math.sin(pitch)*range+.62;
      const count=Math.ceil(Math.hypot(horizontal,dy)/.25);
      for (let i=1;i<=count;i++) {
        const t=i/count,x=focus.x+t*dx,y=focus.y+t*dy,z=focus.z+t*dz;
        if (staticVolumeAt(x,z,y-.16,.16,.32) || !palace && landscapeFloor(x,z)+.16>y) return (i-1)/count;
      }
      return 1;
    }
    const probe=hand?distanceFor(yaw,aspect):aspect<.85?5.2:3.8;
    const rise=hand?(Math.sin(pitch)*probe+.62)/(Math.cos(pitch)*probe):.43;
    // Score the actual optical ray from the fitted camera. A camera arm may
    // be completely clear while the foreground courier hides the whole tray.
    const bodyNow=new Vector3(visitor.x,visitor.y+bodyRadius,visitor.z);
    const bodyAtRest=viewer.clone().setY(viewer.y-.95+bodyRadius);
    const eye=new Vector3();
    const ray=new Raycaster(),dir=new Vector3();
    const silhouettes=subjects.filter(o=>o!==table?.children[0]).flatMap(o=>storyBodyCores(o).map(core=>core.mesh));
    if(table?.children[0])table.children[0].traverseVisible(m=>{if(m.isMesh)silhouettes.push(m);});
    function clearSubjects(bearing){
      const range=distanceFor(bearing,aspect),horizontal=Math.cos(pitch)*range;
      eye.set(focus.x+Math.sin(bearing)*horizontal,focus.y+Math.sin(pitch)*range+.62,
        focus.z+Math.cos(bearing)*horizontal);
      let total=0;
      for(const [i,subject] of sights.entries()){
        const weight=i===0?(workingPoint?11:3):1;
        // A bystander's shell or the artisan's brow can cover the exhibit
        // even when the camera can travel unobstructed to this position.
        const extent=dir.subVectors(subject,eye).length();
        ray.set(eye,dir.normalize());ray.far=extent-.12;
        const hidden=ray.intersectObjects(silhouettes,false).length>0;
        total+=weight*(hidden?.12:1)*Math.min(bodySightline(eye,subject,bodyAtRest,bodyRadius,bodyRadius*.98),
          bodySightline(eye,subject,bodyNow,bodyRadius,bodyRadius*.98));
      }
      const wide=total/(sights.length+(workingPoint?10:2));
      if(hand || !apron)return wide;
      // A clear camera arm does not imply a view underneath a solid counter.
      // Include both ends of the actual pull and the artisan leaning over it.
      let handleView=0;
      for(const grip of [apron.closed,apron.open]){
        const distance=dir.subVectors(grip,eye).length();
        ray.set(eye,dir.normalize());ray.far=distance-.035;
        if(ray.intersectObject(table.children[0],true).length)continue;
        let clear=Math.min(bodySightline(eye,grip,apron.body,.42,.71),
          bodySightline(eye,grip,bodyAtRest,bodyRadius,bodyRadius*.98));
        for(const {centre,r,h} of neighbours)clear=Math.min(clear,bodySightline(eye,grip,centre,r,h));
        handleView+=clear;
      }
      return workingPoint?wide*.87+handleView*.065:wide*.54+handleView*.23;
    }
    const heading=conversationView(hand || surface,yaw,viewer,solid,probe,rise,arrivalYaw,armClearance,clearSubjects);
    const fit=ratio=>distanceFor(heading,ratio);
    return {focus, yaw:heading, pitch, distance:fit(aspect), fit};
  }
  function beginAction(key,host) {
    return work.start(key,host,speakers,stations.find(s=>s.site===host.site)?.table,getHero());
  }
  function addSpeaker(actor,person,site,index,external=false) {
    if (!headOffsets.has(actor)) {
      actor.getWorldPosition(floor);
      bounds.setFromObject(actor);
      // Measure once per actual rig. Tall ears, antlers and the sea guests'
      // carrying basin need different headroom above the same floor.
      headOffsets.set(actor,Math.max(.65,Math.min(3.3,bounds.max.y-floor.y))+.12);
    }
    speakers.push({actor,person,site,index,external,anchor:new Vector3()});
  }
  function rebuild(p) {
    group.clear();
    stations = []; speakers = [];
    const fixtures = [];
    for (const site of locations.values()) {
      if (Math.hypot(wrapDelta(p.x-site.x),wrapDelta(p.z-site.z))>45 || Math.abs(p.y-site.y)>25) continue;
      const cast = peopleAt(site,book);
      if (!cast.length) continue;
      if (builtIn[site.place]) {
        // These two residents already have full models in the gate and belfry.
        // A second copy would receive a second silhouette and collision body.
        const actor = scene.getObjectByName(builtIn[site.place]);
        if (actor) addSpeaker(actor,cast[0],site,0,true);
        else drawnRevision = -1; // The temple creates its monks on approach.
        continue;
      }
      const festival = site.key===placeKey('kyo') && !book.current();
      if (site.place!=='road-tea') {
        const edition = festival ? 8 : site.place==='court' && book.index>=5 ? 7 : 0;
        const pickup = getPickup(site);
        const key = site.key+'-'+edition;
        if (!tables.has(key)) tables.set(key,createStoryStillLife(site.number,edition,site.place));
        const table = tables.get(key);
        table.position.set(site.x,site.y,site.z); table.rotation.y=site.yaw;
        group.add(table);
        work.dress(table,site);
        stations.push({table,site,pickup});
      }
      const seats=seatsAt(site,cast);
      for (const [i,person] of cast.entries()) {
        const seat=seats[i];
        const version=person.id+(festival?'/festival':'');
        if (!animals.has(version)) animals.set(version,createStoryCharacter(person,{festivalGuest:festival}));
        const actor=animals.get(version);
        if(work.atHome(actor,seat)){
          actor.position.set(seat.x,seat.y,seat.z);actor.rotation.y=seat.yaw;
        }
        group.add(actor);addSpeaker(actor,person,site,i);
        fixtures.push({...seat,kind:'person',species:person.species,name:person.name,model:actor,modelContact:shape(actor)});
      }
    }
    const stands=new Map();
    for(const speaker of speakers){
      const table=stations.find(s=>s.site===speaker.site)?.table;
      const stand=work.dressResident(speaker,table,speakers,group);
      if(!stand || stands.has(stand))continue;
      stands.set(stand,{table:stand,site:speaker.site});
    }
    framingTables.clear();
    for(const station of [...stations,...stands.values()])framingTables.set(station.site.key,station);
    parcels.visit([...framingTables.values()],speakers);
    for(const {table,site} of stations)fixtures.push({...site,kind:'table',modelContact:shape(table,table.children[0])});
    for(const stand of stands.keys()){
      const point=stand.getWorldPosition(new Vector3());
      fixtures.push({kind:'stand',x:point.x,y:point.y,z:point.z,modelContact:shape(stand)});
    }
    collisions?.update(fixtures);
  }
  return {
    visible(value) { group.visible=value; },
    invalidate(exchange=false) {
      revision++;parcels.invalidate();
      if(exchange)work.stop();
    },
    holdSpeaker, walkInput, conversationShot,
    speakers() { return speakers; },
    playAction(key,personId) {
      const host=speakers.find(s=>s.person.id===personId || s.person.name===personId);
      if(!host)return 0;
      if(chapter!==book.index || drawnRevision!==revision)work.stop();
      if(blocking?.settling || work.tidyingSite || chapter!==book.index || drawnRevision!==revision){
        queuedAction={key,host};return 0;
      }
      return beginAction(key,host);
    },
    stopAction() { queuedAction=null;if(held)work.pause();else work.stop(); },
    get actionPlaying(){return !!queuedAction || work.playing;},
    get actionFocus(){return work.focus;},
    get tidying(){return !!work.tidyingSite;},
    update(time,p) {
      visitor=p;passDetour=null;
      const walked=Math.hypot(p.x-lastX,p.z-lastZ,p.y-lastY);
      const shop=work.tidyingSite;
      const inShop=shop && Math.hypot(wrapDelta(p.x-shop.x),wrapDelta(p.z-shop.z))<11 && Math.abs(p.y-shop.y)<4;
      if ((!held || walked>12) && !inShop && (chapter!==book.index || drawnRevision!==revision ||
          (time>=nextSurvey && walked>5))) {
        chapter=book.index; drawnRevision=revision;
        lastX=p.x;lastY=p.y;lastZ=p.z;nextSurvey=time+.35;
        if(walked>45 || shop && !inShop)work.clear();else work.stop();
        rebuild(p);
      }
      if(blocking?.settling && !blocking.host.external && !work.controls(blocking.host.actor)){
        const {feet,host,yaw,homeYaw}=blocking;
        const toward=Math.atan2(p.x-feet.x,p.z-feet.z)-yaw;
        const turn=Math.max(-.27,Math.min(.27,Math.atan2(Math.sin(toward),Math.cos(toward))));
        host.actor.rotation.y=homeYaw+turn*Math.min(1,blocking.time*3.4);
      }
      if(queuedAction && !blocking?.settling && !work.tidyingSite){
        // A solved clue can summon a witness to this very table. Finish the
        // previous workers' returns, then acquire the new cast before beat 1.
        if(chapter!==book.index || drawnRevision!==revision){
          chapter=book.index;drawnRevision=revision;rebuild(p);
        }
        const {key,host}=queuedAction;queuedAction=null;
        const present=speakers.find(w=>w.site.key===host.site.key && w.person.id===host.person.id);
        if(present)beginAction(key,present);
      }
      for (const {actor,site,index,external} of speakers) {
        if(external)continue;
        const {x,z}=actor.position;
        const steps=footsteps.get(actor) || {x,z,time,speed:0};
        const dt=time-steps.time, travel=Math.hypot(x-steps.x,z-steps.z);
        if(dt>0 && dt<.25 && travel<.55)steps.speed+=(Math.min(1.7,travel/dt)-steps.speed)*(1-Math.exp(-12*dt));
        else steps.speed=0;
        steps.x=x;steps.z=z;steps.time=time;footsteps.set(actor,steps);
        poseStoryCharacter(actor,time+index*.94,Math.hypot(p.x-site.x,p.z-site.z)<7,steps);
      }
      work.update(time);
      parcels.update(time);
      for (const s of speakers) {
        s.actor.getWorldPosition(s.anchor);s.anchor.y+=headOffsets.get(s.actor);
      }
      collisions?.posed();
    },
    nearest(p,preferredId) {
      if (p.activity) return null;
      let best=null;
      for (const speaker of speakers) {
        const {site,person,actor}=speaker;
        actor.getWorldPosition(floor);
        if (Math.abs(p.y-floor.y)>2.25) continue;
        const distance=Math.hypot(wrapDelta(p.x-floor.x),wrapDelta(p.z-floor.z));
        if (distance>3.5) continue;
        if (person.id===preferredId || !best || distance<best.distance) {
          best={site,person,distance,action:'story',label:person.name+'に話しかける'};
          if (person.id===preferredId) break;
        }
      }
      // Tapping a resident's balloon always talks to that resident. At the
      // counter itself, E can pick the actual item up off the writing surface.
      if (!preferredId) for (const {site,pickup} of stations) {
        if (!pickup || book.has(pickup.id) || Math.abs(p.y - site.y) > 1.5) continue;
        const prop=parcels.pickupObject(pickup.id);
        if(!prop)continue;
        prop.getWorldPosition(floor);
        const distance = Math.hypot(wrapDelta(p.x-floor.x),wrapDelta(p.z-floor.z));
        if (distance <= 2.15 && (!best || distance < best.distance)) {
          best = {site, person:pickup.person, distance, action:'story', pickup:pickup.id, label:pickup.label};
        }
      }
      return best;
    }
  };
}
