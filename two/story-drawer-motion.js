// Contact targets are in world space. A worker may need several steps or a
// deeper bend before its solved paw reaches the next part of the movement.
import { Box3, Quaternion, Triangle, Vector3 } from './vendor/three.module.min.js';

const vec=(x=0,y=0,z=0)=>new Vector3(x,y,z);
const CONTACT=.035;
const smooth=t=>t*t*(3-2*t);
const seconds={approachHandle:.15,pull:.48,overRim:.18,aboveItem:.16,reachItem:.21,
  lift:.34,carry:.54,set:.34,clearItem:.16,outsideHandle:.16,reachHandle:.22,push:.46,release:.12};
const scratch=vec(),worldQ=new Quaternion();

// Find a point on the visible article, including openwork baskets and hollow
// trays. A box corner can lie well outside any actual piece of geometry.
function measure(object,worker,drawer,palm){
  object.updateWorldMatrix(true,true);
  const bounds=new Box3(),pieces=[];
  // A packed parcel remains concealed while the wrist travels to its socket.
  // Ignore the root's visibility for measurement; preserve hidden variants
  // (for example an opened letter's alternative folded page).
  function visit(mesh){
    if(mesh!==object && !mesh.visible)return;
    const positions=mesh.geometry?.attributes.position;
    if(positions && mesh.material?.visible!==false){
      if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
      bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
      pieces.push(mesh);
    }
    for(const child of mesh.children)visit(child);
  }
  visit(object);
  if(bounds.isEmpty())return {grip:vec(),bottom:0};
  const center=bounds.getCenter(vec()),size=bounds.getSize(vec());
  const side=drawer ? drawer.front.getWorldDirection(vec()) :
    worker?.getWorldPosition(vec()).sub(center) || vec(0,0,1);
  side.y=0;side.normalize();
  const desired=center.clone().addScaledVector(side,Math.abs(side.x)*size.x*.49+Math.abs(side.z)*size.z*.49);
  desired.y+=size.y*.20;
  if(palm)desired.copy(palm);
  let nearest=Infinity;const grip=center.clone();
  const tri=new Triangle(),boundsOfMesh=new Box3();
  for(const mesh of pieces){
    boundsOfMesh.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
    if(boundsOfMesh.distanceToPoint(desired)**2>=nearest)continue;
    const positions=mesh.geometry.attributes.position,index=mesh.geometry.index;
    const count=index?index.count:positions.count;
    for(let i=0;i+2<count;i+=3){
      tri.a.fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);
      tri.b.fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
      tri.c.fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
      tri.closestPointToPoint(desired,scratch);
      const distance=scratch.distanceToSquared(desired);
      if(distance<nearest){nearest=distance;grip.copy(scratch);}
    }
  }
  return {grip:object.worldToLocal(grip),bottom:object.getWorldPosition(vec()).y-bounds.min.y};
}

function handlePoint(drawer,z=drawer.front.position.z,x=0){
  const point=drawer.handle.position.clone();point.x+=x;point.z+=z;
  return drawer.mount.localToWorld(point);
}
// The forged pull is a crossbar. A paw at either end takes the load
// just as a paw at its midpoint does.
function handleFit(drawer,palm,z){
  const local=drawer.mount.worldToLocal(palm.clone()).sub(drawer.handle.position);
  const x=Math.max(-drawer.halfGrip,Math.min(drawer.halfGrip,local.x));
  const radial=Math.hypot(local.x-x,local.y);
  return {x,travel:local.z,radial,gap:Math.hypot(radial,local.z-z)};
}
function extension(drawer,z){
  drawer.front.position.z=z;
  drawer.runner.position.z=z*.5;
  if(z===0)drawer.shut();
}
function rim(drawer,point){
  const local=drawer.mount.worldToLocal(point.clone());
  local.y=Math.max(.10,local.y);
  return drawer.mount.localToWorld(local);
}
function destination(m){return m.parent.localToWorld(m.end.clone());}
function isStored(object,drawer){
  for(let node=object?.parent;node;node=node.parent)if(node===drawer.front || node===drawer.mount)return true;
  return false;
}
function seat(m){
  m.parent.attach(m.object);m.object.position.copy(m.end);m.object.quaternion.copy(m.rotation);
  if(m.endScale)m.object.scale.copy(m.endScale);
}
function begin(m){
  const {drawer,object,mode}=m;
  const stored=drawer && isStored(object,drawer);
  if(!stored)m.locate?.(m.end);
  if(!object)m.phases=m.onHandle?['push','release']:['outsideHandle','reachHandle','push','release'];
  else if(drawer && mode==='in' && stored)m.phases=drawer.front.position.z>.001?['outsideHandle','reachHandle','push','release']:['release'];
  else{
    const opening=drawer && !m.held && (mode==='in' || stored);
    m.phases=[];
    if(opening && drawer.front.position.z<drawer.travel-.002)m.phases.push('approachHandle','pull');
    if(opening)m.phases.push('overRim');
    if(opening && stored)m.phases.push('aboveItem');
    if(!m.held)m.phases.push('reachItem');
    m.phases.push('lift','carry','set');
    if(drawer && (opening || drawer.front.position.z>.001)){
      if(mode==='in')m.phases.push('clearItem');
      m.phases.push('outsideHandle','reachHandle','push');
    }
    m.phases.push('release');
  }
  m.index=0;m.clock=0;m.stageStart=null;
}
function phaseDuration(m,phase){
  if(phase==='release' && (m.wrist || m.operator.settle))return Math.max(.36,.42*m.tempo);
  return seconds[phase]*m.tempo;
}
// A crowded counter can lose its original approach as witnesses assemble.
// Keep the load in the hand and choose another surveyed clear patch. A
// moving worker continues on the original route while the gap is closing.
function tryAnotherLanding(m,phase,gap,dt){
  if(!m.alternate)return;
  if(m.progressPhase!==phase || m.leastGap==null || gap<m.leastGap-.045){
    m.progressPhase=phase;m.leastGap=gap;m.wait=0;return;
  }
  m.wait+=dt;
  if(m.wait<1.6)return;
  m.wait=0;
  if(m.alternate(m.end)){
    m.index=m.phases.indexOf('carry');m.clock=0;m.stageStart=null;m.leastGap=null;
  }
}
function part(m,phase,dt){
  const {drawer,object}=m;
  if(!m.stageStart){
    const location=object?.getWorldPosition(vec());
    m.stageStart={z:drawer?.front.position.z,point:location,angle:object?.getWorldQuaternion(new Quaternion()),scale:object?.getWorldScale(vec()),palm:m.lastPalm?.clone()};
    if(object && !m.contact){
      const shape=measure(object,m.operator.actor,drawer);
      m.contact=m.grip || shape.grip;m.bottom=shape.bottom;
    }
    if(phase==='lift'){
      const dest=destination(m);
      const rimHeight=drawer?drawer.mount.getWorldPosition(vec()).y+m.bottom+.08:-Infinity;
      m.height=Math.max(location.y+m.lift,dest.y+m.lift,rimHeight);
      m.clearance=drawer?drawer.mount.getWorldPosition(vec()).y+m.bottom+.052:-Infinity;
    }
  }
  const start=m.stageStart;
  // Limit each increment to the remaining reach of a planted hand. When the
  // artisan has to walk, the sleeve and the parcel wait for each other.
  const duration=phaseDuration(m,phase);
  const elapsed=Math.min(duration,m.clock+dt);
  const t=smooth(elapsed/duration);
  const context={dt,phase,object,drawer,heldTool:m.heldTool};
  const reach=target=>m.operator.reach(target,context);
  let target,palm;
  if(phase==='release'){
    // Back the fingers off the handle or article before restoring the arm.
    if(m.operator.settle && !m.handoff)m.endPalm=m.operator.settle(t,context)?.clone();
    else if(m.lastPalm && !m.wrist){
      target=m.lastPalm.clone();
      if(drawer)target.addScaledVector(drawer.mount.getWorldDirection(vec()),.055*t);
      else target.y+=.045*t;
      m.endPalm=reach(target)?.clone();
    }
    if(m.wristFrom){
      // The implement already belongs to this moving wrist. Let the fingers
      // turn it into the familiar working grip as the elbow relaxes.
      object.position.lerpVectors(m.wristFrom.position,m.wrist.position,t);
      object.quaternion.slerpQuaternions(m.wristFrom.rotation,m.wrist.rotation,t);
      object.scale.lerpVectors(m.wristFrom.scale,m.wrist.scale,t);
    }
  }else if(phase==='pull' || phase==='push'){
    const end=phase==='pull'?drawer.travel:0;
    const z=start.z+(end-start.z)*t;
    context.destination=handlePoint(drawer,end,m.handleX);
    target=handlePoint(drawer,z,m.handleX);palm=reach(target);
    if(!palm)return false;
    const fit=handleFit(drawer,palm,z);
    if(fit.radial>CONTACT)return false;
    m.handleX=fit.x;
    const driven=fit.travel;
    const current=drawer.front.position.z;
    extension(drawer,phase==='pull'?Math.max(current,Math.min(z,driven)):Math.min(current,Math.max(z,driven)));
    if(fit.gap>CONTACT)return false;
    if(elapsed===duration)extension(drawer,end);
  }else if(['lift','carry','set'].includes(phase)){
    const dest=destination(m);
    const goal=phase==='lift'?start.point.clone():dest;
    if(phase==='carry' && m.carryFloor){
      const floor=Math.max(dest.y+.06,m.carryFloor(object,dest)+m.bottom+.025);
      m.height=Math.max(floor,m.height-dt*.5);
    }
    if(phase!=='set')goal.y=m.height;
    const walking=phase==='carry' && m.operator.walkWithLoad;
    const aim=walking?goal.clone():start.point.clone().lerp(goal,t);
    let turn=t;
    if(walking){
      const at=object.getWorldPosition(vec()),distance=start.point.distanceTo(goal);
      if(distance>.06)turn=Math.min(t,Math.max(0,1-at.distanceTo(goal)/distance));
    }
    const orientation=start.angle.clone();
    if(phase!=='lift')orientation.slerp(m.parent.getWorldQuaternion(worldQ).multiply(m.rotation),turn);
    const scale=start.scale.clone();
    if(m.endScale && phase!=='lift')scale.lerp(m.parent.getWorldScale(vec()).multiply(m.endScale),turn);
    const offset=m.contact.clone().multiply(scale).applyQuaternion(orientation);
    context.destination=goal.clone().add(offset);
    target=aim.add(offset);palm=reach(target);
    if(!palm)return false;
    // Each article hangs from the solved hand, even while its owner is taking
    // a step. Pausing the hand pauses progression along the planned path.
    const gripToOrigin=palm.clone().sub(offset);
    object.position.copy(m.scene.worldToLocal(gripToOrigin));
    object.quaternion.copy(m.scene.getWorldQuaternion(worldQ).invert()).multiply(orientation);
    if(m.endScale)object.scale.copy(scale).divide(m.scene.getWorldScale(vec()));
    if(elapsed===duration){
      const position=object.getWorldPosition(vec());
      if(phase==='lift'){
        // A tall clerk and a seated potter need not raise a box to the
        // same imaginary waypoint. The rim is a real obstacle.
        if(position.y<m.clearance)return false;
        m.height=Math.min(m.height,position.y);
      }
      if(phase==='carry' && (drawer || walking)){
        const gap=Math.hypot(position.x-goal.x,position.z-goal.z);
        if(gap>.12){tryAnotherLanding(m,phase,gap,dt);return false;}
      }
      if(phase==='set'){
        const gap=palm.distanceTo(target);
        if(gap>CONTACT){tryAnotherLanding(m,phase,gap,dt);return false;}
        if(m.wrist){
          m.wrist.parent.attach(object);
          m.wristFrom={position:object.position.clone(),rotation:object.quaternion.clone(),scale:object.scale.clone()};
        }else seat(m);
        m.held=false;
      }
    }
  }else{
    if(phase==='reachItem' || phase==='aboveItem' || phase==='clearItem'){
      target=object.localToWorld(m.contact.clone());
      if(phase!=='reachItem')target=rim(drawer,target);
    }else{
      target=handlePoint(drawer,drawer.front.position.z,m.handleX);
      if(phase==='outsideHandle' || phase==='overRim'){
        target=rim(drawer,target);
        target.addScaledVector(drawer.mount.getWorldDirection(vec()),.05);
      }
    }
    context.destination=target.clone();
    if(start.palm)target.lerpVectors(start.palm,target,t);
    palm=reach(target);
    if(!palm)return false;
    if(phase==='reachItem' && context.supportingGrip===object.parent){
      // This article was in the recipient's hand when dialogue closed.
      // Its contact travels with that same wrist while the other returns
      // a tool. Pick it up from the present wrist transform.
      m.contact=object.worldToLocal(palm.clone());
      target.copy(palm);
    }
    if(elapsed===duration){
      if(phase==='approachHandle' || phase==='reachHandle'){
        const fit=handleFit(drawer,palm,drawer.front.position.z);
        if(fit.gap>CONTACT)return false;
        m.handleX=fit.x;
      }else if(phase==='reachItem' && palm.distanceTo(target)>CONTACT){
        // Around a crowded bench the available arm may approach a ledger or
        // basket from a different edge. Find the actual paper or wicker under
        // that palm before changing the grip; the article stays on its support.
        m.reachWait=(m.reachWait || 0)+dt;
        if(m.reachWait>.64 && !m.grip && !m.heldTool){
          m.reachWait=0;
          const edge=measure(object,null,null,palm).grip;
          const candidate=object.localToWorld(edge.clone());
          if(palm.distanceTo(candidate)+.008<palm.distanceTo(target))m.contact=edge;
        }
        return false;
      }
      if(drawer && ['overRim','aboveItem','clearItem'].includes(phase) &&
          drawer.mount.worldToLocal(palm.clone()).y<.025)return false;
    }
    if(phase==='reachItem' && elapsed===duration){
      m.pickup={parent:object.parent,end:object.position.clone(),rotation:object.quaternion.clone(),endScale:object.scale.clone()};
      m.scene.attach(object);object.visible=true;m.held=true;
    }
  }
  if(palm)m.lastPalm=palm.clone();
  m.clock=elapsed;
  return elapsed===duration;
}

// Queue by both the worker and the piece of furniture. Cancelling the last
// transfer leaves a real closing job, so an interrupted drawer never snaps.
export function createPropTransfers(scene){
  const jobs=new Set(),byObject=new Map();
  const key=op=>op?.actor || op;
  const shared=(a,b)=>key(a)===key(b) || !!a?.station && a.station===b?.station;
  function remove(m){jobs.delete(m);if(m.object)byObject.delete(m.object);}
  function enqueue(m){jobs.add(m);if(m.object)byObject.set(m.object,m);}
  function closer(m){
    const active=m.phases?.[m.index];
    return {scene,drawer:m.drawer,operator:m.operator,tempo:1,delay:0,
      onHandle:active==='pull' || active==='push',lastPalm:m.endPalm || m.lastPalm};
  }
  function needsCloser(m){
    return m.drawer?.front.position.z>.001 && ![...jobs].some(j=>j.drawer===m.drawer);
  }
  function complete(m){
    remove(m);
    if(m.next)enqueue(m.next);
    if(m.handoff && jobs.has(m.handoff))m.handoff.lastPalm=m.endPalm || m.lastPalm;
    else if(needsCloser(m))enqueue(closer(m));
    else m.operator.release?.();
    m.finish?.();
  }
  function returnHeld(m){
    // The artisan still has this article in their fingers. Put it back on
    // its original support before taking another job with the same hand.
    if(m.recovering)return;
    Object.assign(m,m.pickup,{finish:null,adjust:null,alternate:null,locate:null,carryFloor:null,delay:0,recovering:true,next:null});
    m.mode=m.drawer && m.parent===m.drawer.front?'in':'out';
    begin(m);
  }
  function take(object){
    const m=byObject.get(object);
    if(!m)return;
    m.next=null;
    if(m.held){returnHeld(m);return;}
    remove(m);
    if(needsCloser(m))enqueue(closer(m));
    else if(m.phases)m.operator.release?.();
  }
  return {
    move(object,parent,end,rotation,options){
      const {operator,drawer,mode,grip,scale,heldTool,wrist,lift=.14,duration=.95,delay=0,adjust,finish}=options;
      const m={object,scene,parent:drawer && parent===drawer.mount?drawer.front:parent,
        end:end.clone(),rotation:rotation.clone(),alternate:options.alternate,locate:options.locate,carryFloor:options.carryFloor,operator,drawer,mode,grip:grip?.clone(),endScale:scale?.clone(),heldTool,wrist,lift,tempo:Math.max(.35,duration/.95),delay,adjust,finish};
      const previous=byObject.get(object);
      if(previous?.held){
        if(key(previous.operator)===key(operator) && (!drawer || drawer===previous.drawer && drawer.front.position.z>=drawer.travel-.002)){
          // Reverse in place. Keep this job's scheduler slot and its actual
          // contact point, even if a second parcel is waiting on the bench.
          const openDrawer=previous.drawer;
          Object.assign(previous,m,{drawer:drawer || openDrawer,recovering:false,next:null});
          begin(previous);
        }else{
          returnHeld(previous);previous.next=m;
        }
        return;
      }
      take(object);
      // New work can take over a drawer where its last worker left it.
      if(drawer)for(const j of jobs)if(!j.object && j.drawer===drawer){
        remove(j);
        if(key(j.operator)===key(operator))m.lastPalm=j.endPalm || j.lastPalm;
        else j.operator.release?.();
      }
      enqueue(m);
    },
    take,
    has:object=>byObject.has(object),
    busy:operator=>[...jobs].some(m=>!operator || shared(operator,m.operator)),
    progress(object){
      const m=byObject.get(object);if(!m?.phases)return null;
      return (m.index+m.clock/phaseDuration(m,m.phases[m.index]))/m.phases.length;
    },
    update(dt){
      if(!(dt>0) || !jobs.size)return;
      const drawers=new Set(),workers=new Set(),stations=new Set();
      function reserve(m){
        drawers.add(m.drawer);workers.add(key(m.operator));
        if(m.operator.station)stations.add(m.operator.station);
      }
      for(const m of jobs)if(m.phases)reserve(m);
      for(const m of [...jobs]){
        if(!m.phases){
          if(workers.has(key(m.operator)) || stations.has(m.operator.station) || (m.drawer && drawers.has(m.drawer)))continue;
          if(m.delay>0){m.delay-=dt;if(m.delay>0)continue;}
          begin(m);reserve(m);
        }
        const phase=m.phases[m.index];
        if(part(m,phase,dt)){
          if(phase==='set' && m.drawer){
            const next=[...jobs].find(j=>j!==m && (shared(j.operator,m.operator) || j.drawer===m.drawer));
            if(next?.object && !next.phases && next.drawer===m.drawer && key(next.operator)===key(m.operator)){
              // Clear the fingers but leave the tray supported on its runners
              // while the same worker deals with its next article.
              m.handoff=next;
              m.phases=m.phases.filter(p=>!['outsideHandle','reachHandle','push'].includes(p));
            }
          }
          m.index++;m.clock=0;m.stageStart=null;
          if(m.index===m.phases.length){m.adjust?.(1);complete(m);continue;}
        }
        m.adjust?.(this.progress(m.object));
      }
    },
    // Streaming has already taken this room off screen. Resolve ownership
    // before its furniture and actors are detached.
    finish(){
      while(jobs.size){
        const m=jobs.values().next().value;
        if(m.object){
          if(m.wrist){
            m.wrist.parent.add(m.object);m.object.position.copy(m.wrist.position);
            m.object.quaternion.copy(m.wrist.rotation);m.object.scale.copy(m.wrist.scale);
          }else seat(m);
          m.object.visible=true;
        }
        if(m.drawer)extension(m.drawer,0);
        m.adjust?.(1);complete(m);
      }
    }
  };
}
