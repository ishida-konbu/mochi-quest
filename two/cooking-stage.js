import * as THREE from './vendor/three.module.min.js';
import { WORKTOPS, marketCooktop, worktopPoint } from './living-layout.js';
import { MARKET_STALLS, terrainContactHeight, terrainHeight, groundHeight } from './terrain.js';

export function cookingLayout(site) {
  const market=site.id==='market-mortar';
  const table=market ? marketCooktop(MARKET_STALLS[4]) : WORKTOPS[site.id];
  if (!table) return null;
  const y=market ? terrainHeight(MARKET_STALLS[4][0],MARKET_STALLS[4][1])+.18 : terrainContactHeight(table.x,table.z);
  return {
    ...table,y,id:site.id,market,
    floor(u,v) {
      const {x,z}=worktopPoint(table,u,v);
      return groundHeight(x,z,terrainContactHeight(x,z)+.22)-y;
    },
  };
}

// The operator stays across the worktop, looking into the cook's face and
// hands. At the market, stay between the rear posts and below the canopy.
const viewingDirections = {
  'river-mortar':[.32,.46,-1],
  'terraces-mortar':[.32,.46,-1],
  'market-mortar':[.045,.43,-1],
};

export function createCookingStage(scene,site) {
  const layout=cookingLayout(site);
  if (!layout) return null;
  const group=new THREE.Group();
  group.name=site.name+'の餅仕込み';
  group.rotation.y=layout.yaw;
  group.position.set(layout.x,layout.y,layout.z);
  scene.add(group);
  group.updateMatrixWorld(true);

  const parked=new Map();
  scene.traverse(object=>{
    const mat=object.material;
    if (mat?.userData?.cookingTools===site.id && !parked.has(mat)) {
      parked.set(mat,mat.visible);
      mat.visible=false;
    }
  });

  const out=new THREE.Vector3();
  const right=new THREE.Vector3(),up=new THREE.Vector3();
  const target=new THREE.Vector3(), action=new THREE.Vector3(), hero=new THREE.Vector3();
  const desired=new THREE.Vector3(), eye=new THREE.Vector3(), offset=new THREE.Vector3(), subject=new THREE.Vector3();
  const {clamp,lerp,smoothstep}=THREE.MathUtils;
  let distance=0,priorDetail=null,priorAspect=null;
  function positionCamera(camera,frame,{detail=false,reducedMotion=false,dt=0,cut:snap=false}={}) {
    action.fromArray(frame.focus);
    hero.fromArray(frame.hero);
    const portrait=camera.aspect<.85;
    // Reserve space for the whole stroke as the cook brings the mallet from
    // its rack to the mortar. Changing chapter alone must not move the lens.
    const lifting=frame.phase==='pound'?smoothstep(frame.tools?.mallet?.position[0]??-1.31,-1.31,-.69):0;
    const piece=frame.piece?.visible?frame.piece:null;
    out.fromArray(viewingDirections[layout.id]);
    if(detail)out.set(layout.market?.10:.12,layout.market?.64:.98,-1);
    out.normalize();right.set(out.z,0,-out.x).normalize();up.crossVectors(out,right);
    // Use the bench, not the moving mallet head, to establish the horizon.
    // Follow a sidestep, but damp the small repetitive wrist/shoulder beats.
    desired.set(.53*hero.x+.47*action.x,1.08+.30*hero.y,.52);
    if (detail) {
      // A fixed midpoint between the bowl and the lifted mallet keeps the
      // close view steady through repeated strikes without zooming out.
      const height=lerp(.88+.36*(clamp(action.y,.8,1.75)-.88),1.48,lifting);
      desired.set(action.x,height,.12+.24*action.z);
      if(piece) {
        // The cook can reach back for a paddle while the cake is still on
        // the grill. Keep both the cake and the hand's new destination in shot.
        desired.x=lerp(desired.x,piece.position[0],.5*piece.size);
        desired.y=lerp(desired.y,piece.position[1]+.08,.4*piece.size);
      }
    }
    if (reducedMotion && !detail) desired.set(0,1.20,.46);
    const cut=snap || priorDetail!==detail || priorAspect!==camera.aspect;
    if (cut) target.copy(desired);
    else target.lerp(desired,1-Math.exp(-Math.max(0,dt)*(detail?2.5:1.55)));

    // Fit to the actual frustum: the footprint includes the head at the top
    // of the strike as well as the dish. A phone uses its narrower dimension.
    const fov=detail ? 36 : 42;
    const tan=Math.tan(fov*Math.PI/360);
    let fit=detail ? 1.64 : 2.36;
    const include=(x,y,z,padding=.12)=>{
      offset.set(x-target.x,y-target.y,z-target.z);
      const depth=offset.dot(out);
      fit=Math.max(fit,depth+(Math.abs(offset.dot(right))+padding)/(tan*camera.aspect*.88),
        depth+(Math.abs(offset.dot(up))+padding)/(tan*.78));
    };
    if (detail) {
      include(action.x-.39,.78,action.z-.22,.035);
      include(action.x+.39,Math.max(1.23,action.y),action.z+.14,.035);
      if(piece) include(...piece.position,.13*piece.size);
      if(lifting) include(action.x,lerp(action.y,2.07,lifting),lerp(action.z,.27,lifting));
    } else if (reducedMotion) {
      for(const x of [-1.70,1.46]) {
        include(x,.74,.05);include(x,2.18,.98);
      }
      include(0,.25,1.12);
    } else {
      include(hero.x-.62,hero.y+1.65,hero.z);
      include(hero.x+.62,hero.y+1.65,hero.z);
      for (const hand of frame.hands||[]) include(...hand,.105);
      include(hero.x,hero.y+.24,hero.z+.20);
      include(action.x-.31,Math.max(.83,action.y),action.z);
      include(action.x+.31,Math.max(.83,action.y),action.z);
      if(lifting) include(action.x,lerp(action.y,2.07,lifting),lerp(action.z,.28,lifting));
    }
    fit=Math.max(fit,portrait && !detail ? 3.22 : 0);
    if (cut || !distance) distance=fit;
    else {
      // A hand can cross the bench faster than the pan. Give it headroom now,
      // then settle the lens slowly as the cook returns to the cutting board.
      const settle=fit>distance ? 4.2 : 1.30;
      const damped=lerp(distance,fit,1-Math.exp(-Math.max(0,dt)*settle));
      distance=detail?damped:Math.max(fit*.91,damped);
    }
    priorDetail=detail;priorAspect=camera.aspect;
    eye.copy(out).multiplyScalar(distance).add(target);
    group.localToWorld(eye);group.localToWorld(subject.copy(target));
    if(camera.fov!==fov) { camera.fov=fov;camera.updateProjectionMatrix(); }
    camera.position.copy(eye);camera.lookAt(subject);camera.updateMatrixWorld();
  }
  return {
    group,layout,positionCamera,
    dispose() {
      for(const [mat,visible] of parked) mat.visible=visible;
      parked.clear();
      group.removeFromParent();
    },
  };
}
