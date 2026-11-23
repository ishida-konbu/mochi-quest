// Keep one side of a handoff in view from the first reach to the last set-down.
// The samples and cameras share stage coordinates, even inside a rotated gate.
import { BufferAttribute, BufferGeometry, MathUtils, Mesh, Raycaster, Vector3 } from './vendor/three.module.min.js';

export function sightMesh(mesh,stageInverse) {
  let surface=mesh.geometry;
  if(mesh.isSkinnedMesh || mesh.morphTargetInfluences?.some(value=>value!==0)){
    // Capture the posed silhouette, including the courier's rounded arms.
    // The skeleton will have moved on before the camera tests this sightline.
    const positions=new BufferAttribute(new Float32Array(surface.attributes.position.count*3),3),p=new Vector3();
    for(let i=0;i<positions.count;i++){
      mesh.getVertexPosition(i,p);positions.setXYZ(i,p.x,p.y,p.z);
    }
    const posed=new BufferGeometry();posed.setAttribute('position',positions);posed.setIndex(surface.index);
    posed.groups=surface.groups;posed.drawRange={...surface.drawRange};surface=posed;
  }
  const view=new Mesh(surface,mesh.material);
  view.matrixAutoUpdate=false;
  view.matrixWorld.multiplyMatrices(stageInverse,mesh.matrixWorld);
  return view;
}

export function frameStoryHands(samples,focus,distance,width,minimum,preferredYaw,rises,reach=[]) {
  const ray=new Raycaster(),direction=new Vector3();
  const marks=[...samples.map(sample=>sample.subject),...reach];
  const handWidth=reach.length ? .27 : .11,handHeight=reach.length ? .18 : .10;
  const portraitWidth=.45*Math.tan(MathUtils.degToRad(80)/2),verticalLimit=Math.tan(MathUtils.degToRad(62)/2);
  const forward=new Vector3(),right=new Vector3(),up=new Vector3();
  function viewAxes(eye){
    forward.subVectors(focus,eye).normalize();right.set(-forward.z,0,forward.x).normalize();up.crossVectors(right,forward);
  }
  function dolly(eye){
    viewAxes(eye);
    let back=Math.max(0,width/(2*portraitWidth)-distance);
    for(const mark of marks){
      direction.subVectors(mark,eye);
      const depth=direction.dot(forward),v=direction.dot(up);
      back=Math.max(back,(Math.abs(direction.dot(right))+handWidth)/(.86*portraitWidth)-depth,
        (Math.abs(v)+handHeight)/((v<0?.45:.71)*verticalLimit)-depth);
    }
    eye.addScaledVector(forward,-back);return back;
  }
  function blocked(eye,mark,{obstacles,object,margin}){
    direction.subVectors(mark,eye);
    const range=direction.length();
    ray.set(eye,direction.normalize());ray.far=range+(object?margin:.01);
    const obstruction=ray.intersectObjects(obstacles,false)[0];
    if(!obstruction)return false;
    if(obstruction.distance+.022<range-margin)return true;
    const surface=object?ray.intersectObjects(object,false)[0]?.distance ?? range:range-margin;
    return obstruction.distance+.022<surface;
  }
  let best=null;
  angles: for(const rise of rises)for(const turn of [0,-.32,.32,-.64,.64,-.93,.93,-1.22,1.22,-1.47,1.47]){
    const yaw=preferredYaw+turn;
    const eye=focus.clone().add(new Vector3(Math.sin(yaw)*distance,rise*distance,Math.cos(yaw)*distance));
    // Step back along the same sightline before testing obstructions. Opening
    // an extreme wide-angle lens here would stretch the rim and the near hand.
    const back=dolly(eye);
    let hidden=0;
    const penalty=Math.abs(turn)*.15+Math.abs(rise-rises[0])*.2;
    for(const sample of samples){
      if(blocked(eye,sample.subject,sample)){
        hidden++;
        // Prefer a visible end of the paper or tray when the hand covers its
        // middle. Losing the whole shape also hides who is holding it.
        if(sample.edges?.length && sample.edges.every(mark=>blocked(eye,mark,sample)))hidden+=2;
      }
      if(best && hidden+penalty>=best.cost)break;
    }
    const cost=hidden+penalty;
    if(!best || cost<best.cost)best={cost,eye,back};
    if(!cost)break angles;
  }
  viewAxes(best.eye);
  const framingDistance=distance+best.back;
  let halfWidth=width/(2*framingDistance),halfHeight=Math.tan(MathUtils.degToRad(minimum)*.5)*distance/framingDistance;
  for(const subject of marks){
    direction.subVectors(subject,best.eye);
    const depth=Math.max(.25,direction.dot(forward));
    halfWidth=Math.max(halfWidth,(Math.abs(direction.dot(right))+handWidth)/(.86*depth));
    const vertical=direction.dot(up);
    // The bottom is occupied by the paper caption. Leave room for both the
    // near rim of the bowl and the fingertips above it at the top of the frame.
    halfHeight=Math.max(halfHeight,(Math.abs(vertical)+handHeight)/(depth*(vertical<0?.45:.71)));
  }
  return {eye:best.eye,focus,fov:aspect=>MathUtils.radToDeg(2*Math.atan(Math.max(halfWidth/Math.max(.32,aspect),halfHeight)))};
}
