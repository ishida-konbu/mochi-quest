import * as THREE from './vendor/three.module.min.js';
import { COOKING_MAT, MALLET_HANDLE_END, WORKTOPS, groundCookware, marketCooktop, worktopPoint } from './living-layout.js';
import { MARKET_STALLS, terrainContactHeight } from './terrain.js';

export function cookingLayout(site) {
  const market=site.id==='market-mortar';
  const table=market ? marketCooktop(MARKET_STALLS[4]) : WORKTOPS[site.id];
  if (!table) return null;
  const y=terrainContactHeight(table.x,table.z)+COOKING_MAT.thickness;
  const stations=groundCookware(table,y,terrainContactHeight);
  function floor(u,v){
    const {left,right,front,back,thickness}=COOKING_MAT;
    const woven=u>=left && u<=right && v>=back && v<=front;
    const {x,z}=worktopPoint(table,u,v);
    return terrainContactHeight(x,z)+(woven?thickness:0)-y;
  }
  return {...table,y,id:site.id,market,floor,groundCookware:stations};
}

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

  const out=new THREE.Vector3(),toolAngle=new THREE.Euler();
  const right=new THREE.Vector3(),up=new THREE.Vector3();
  const target=new THREE.Vector3(), action=new THREE.Vector3(), hero=new THREE.Vector3();
  const desired=new THREE.Vector3(), eye=new THREE.Vector3(), offset=new THREE.Vector3(), subject=new THREE.Vector3();
  const {clamp,lerp}=THREE.MathUtils;
  const {mortar,stove,malletRack,bowlRest}=layout.groundCookware;
  const yard=new THREE.Box3(),yardCorners=[],workSpot=new THREE.Vector3();
  let frontX,frontZ;
  let yardScore,yardIncludesEntry;
  const end=new THREE.Vector3();
  let distance=0,priorDetail=null,priorAspect=null;
  const forecasts=new Map();
  let forecastScore;
  function positionCamera(camera,frame,{detail=false,reducedMotion=false,dt=0,cut:snap=false}={}) {
    action.fromArray(frame.focus);
    hero.fromArray(frame.hero);
    const portrait=camera.aspect<.85;
    // Rest the lens on the work, then follow the raised load in the hands.
    const pounding=frame.phase==='pound';
    const lifting=pounding?frame.handWork[0]:0;
    const piece=frame.piece?.visible?frame.piece:null;
    // Follow the visitor until it reaches the work spot.
    desired.set(lerp(hero.x,action.x,.47),lerp(hero.y+.95,action.y+.13,.43),lerp(hero.z,action.z,.58));
    if (detail) {
      // Keep the load and its destination together as the cook turns.
      const mallet=frame.tools.mallet.position;
      desired.set(action.x,action.y+.10,action.z+.14);
      if(lifting){
        const tool=frame.tools.mallet;
        end.set(0,-.013,MALLET_HANDLE_END/2).applyEuler(toolAngle.set(...tool.rotation));
        end.add(offset.fromArray(mallet));
        desired.lerp(end,.62*lifting);
      }
      if(piece) {
        // Frame both the cake and the destination as the cook carries or lowers it.
        desired.x=lerp(desired.x,piece.position[0],.5*piece.size);
        desired.y=lerp(desired.y,piece.position[1]+.08,.4*piece.size);
        desired.z=lerp(desired.z,piece.position[2]+.10,.5*piece.size);
      }
    }
    // A steady wide shot shows the hands changing stations around the same
    // planted feet. Only the detail shot follows a bowl or cake being turned.
    const fixedView=!detail && (reducedMotion || frame.phase!=='approach');
    if(yardScore!==frame.sampleAt || yardIncludesEntry!==reducedMotion || yard.isEmpty()){
      yardScore=frame.sampleAt;yardIncludesEntry=reducedMotion;
      yard.makeEmpty();
      yardCorners.length=0;
      const pad=(point,rx,rz,low,high)=>{
        const [x,y,z]=point;
        for(const u of [x-rx,x+rx])for(const h of [y+low,y+high])for(const v of [z-rz,z+rz]){
          yardCorners.push([u,h,v]);
          yard.expandByPoint(offset.set(u,h,v));
        }
      };
      const radius=frame.bodyRadius??.86,height=frame.bodyHeight??1.68;
      const working=frame.sampleAt?.(Infinity).hero??frame.hero;
      workSpot.fromArray(working);
      // The two ends of the market kitchen are almost opposite. Bisect
      // their working directions for this cook's reach and grip on the pestle.
      const grill=frame.worktops[1];
      const grillYaw=Math.atan2(grill[0]-workSpot.x,grill[2]-workSpot.z);
      const yaw=layout.market && Number.isFinite(frame.poundHeading)
        ? grillYaw+THREE.MathUtils.euclideanModulo(frame.poundHeading-grillYaw,2*Math.PI)/2
        : 2.215;
      frontX=Math.sin(yaw);frontZ=Math.cos(yaw);
      pad(working,radius,radius,0,height+.12);
      if(reducedMotion)pad(frame.sampleAt?.(0).hero??working,radius,radius,0,height);
      pad(stove,.34,.32,0,.65);
      pad(mortar,.41,.40,0,height+.62);
      pad(malletRack,.35,.30,0,.20);
      pad(bowlRest,.21,.21,-.33,.20);
      for(const [i,point] of frame.worktops.entries()){
        if(i!==1 || layout.market)pad(point,.25,.25,-.10,.18);
      }
    }
    if(fixedView){
      yard.getCenter(desired);
      // Aim along the line through the planted feet so both side-on tasks
      // stay visible at the same angle in portrait and landscape.
      const depth=(desired.x-workSpot.x)*frontX+(desired.z-workSpot.z)*frontZ;
      desired.x=workSpot.x+depth*frontX;desired.z=workSpot.z+depth*frontZ;
    }
    const cut=snap || priorDetail!==detail || priorAspect!==camera.aspect;
    if (cut) target.copy(desired);
    else target.lerp(desired,1-Math.exp(-Math.max(0,dt)*(detail?5.6:2.3)));

    // Look into the inside corner from across the bench and the hearth.
    // Both working faces stay in view while the cook turns between them.
    out.set(frontX,detail?.82:.57,frontZ);
    const fov=detail?38:42,tan=Math.tan(fov*Math.PI/360);
    if(cut || forecastScore!==frame.sampleAt)forecasts.clear();
    forecastScore=frame.sampleAt;
    if(!fixedView && forecastScore){
      const spacing=.18,first=Math.floor(frame.time/spacing)+1,last=first+5;
      for(const index of forecasts.keys())if(index<first || index>last)forecasts.delete(index);
      for(let i=first;i<=last;i++)if(!forecasts.has(i))forecasts.set(i,forecastScore(i*spacing));
    }
    function fitView(){
      out.normalize();right.set(out.z,0,-out.x).normalize();up.crossVectors(out,right);
      let fit=detail?1.66:2.36,required=0;
      const include=(x,y,z,padding=.12)=>{
        offset.set(x-target.x,y-target.y,z-target.z);
        const depth=offset.dot(out);
        fit=Math.max(fit,depth+(Math.abs(offset.dot(right))+padding)/(tan*camera.aspect*.88),
          depth+(Math.abs(offset.dot(up))+padding)/(tan*.78));
        required=Math.max(required,depth+Math.abs(offset.dot(right))/(tan*camera.aspect*.992),
          depth+Math.abs(offset.dot(up))/(tan*.985));
      };
      function includePose(pose){
        const [x,y,z]=pose.hero,[ax,ay,az]=pose.focus;
        if(detail){
          include(ax,ay,az,.32);
          include(ax,Math.max(y+.66,ay),az,.13);
          for(const [i,held] of pose.handWork.entries()){
            if(!held)continue;
            const [hx,hy,hz]=pose.hands[i];
            include(lerp(ax,hx,held),lerp(ay,hy,held),lerp(az,hz,held),.09);
          }
        }else{
          const radius=pose.bodyRadius??.86;
          include(x,y+(pose.bodyHeight??1.68),z,.17);
          include(x-radius,y+.71,z,.14);
          include(x+radius,y+.71,z,.14);
          for(const hand of pose.hands)include(...hand,.105);
          include(x,y+.02,z+.24);
          include(ax-.31,ay,az);
          include(ax+.31,ay,az);
        }
        if(pose.piece?.visible){
          const [cx,cy,cz]=pose.piece.position;
          include(cx-.12,cy,cz,.05);
          include(cx+.12,cy+.06,cz,.05);
        }
        if(pose.phase==='pound' && pose.handWork[0]){
          const held=pose.handWork[0],tool=pose.tools.mallet;
          const [tx,ty,tz]=tool.position;
          toolAngle.set(...tool.rotation);
          // The cook rolls the head as it goes to the rack. The camber of
          // both striking faces and the rotating butt define the full span.
          for(const [dx,dy,dz] of [[-.167,0,0],[.165,0,0],[0,-.013,MALLET_HANDLE_END]]){
            end.set(dx,dy,dz).applyEuler(toolAngle);
            include(lerp(ax,tx+end.x,held),lerp(ay,ty+end.y,held),lerp(az,tz+end.z,held),.08*held);
          }
        }
      }
      if(fixedView){
        for(const point of yardCorners)include(...point);
      }else{
        includePose(frame);
        // Ease out before the next turn, using the known path of the load.
        // Only the current scene determines the minimum visible distance.
        const current=required;
        for(const pose of forecasts.values())includePose(pose);
        required=current;
      }
      fit=Math.max(fit,portrait && !detail ? 3.22 : 0);
      if(cut || !distance)return fit;
      const settle=fit>distance?3.1:1.30;
      const travel=(fit-distance)*(1-Math.exp(-Math.max(0,dt)*settle));
      return Math.max(required,distance+clamp(travel,-2.6*dt,4.2*dt));
    }
    distance=fitView();
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
