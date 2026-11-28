// Tripods use the joiner's coordinates. The worker faces -Z at the far end
// of the bench. Fit the subject to the part of the canvas above the controls.
import {Vector3} from './vendor/three.module.min.js';
import {benchPoint,carpenterStance,PLANING_BOARD} from './build-craft-motion.js';

const up=new Vector3(0,1,0);
const shotNames=['master','eye','low','wide','face'];
const openings=['wide','master','eye'];
const v=(x,y,z)=>new Vector3(x,y,z);

export function craftShotSeed(site,take=0){
  let hash=2166136261;
  const key=[site.kind,Math.round(site.x*10),Math.round(site.z*10),Math.round((site.yaw||0)*100)].join('/');
  for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  // Successive takes cycle starting points even on the very same plot.
  return (hash+Math.imul(take,2654435761))>>>0;
}
export function craftShotOrder(seed,count){
  const other=(list,n)=>list[n%list.length];
  const first=count===1?other(['master','eye','low','wide'],seed):other(openings,seed);
  const shots=[first];
  if(count>1)shots.push(other(['eye','low','face','master'].filter(k=>k!==first),(seed>>>8)+seed%3));
  if(count>2)shots.push(other(shotNames.filter(k=>!shots.includes(k)),seed>>>16));
  return shots;
}
function worldPoint(frame,p){
  const [x,z]=benchPoint(frame,p.x,p.z);
  return v(x,p.y+frame.y,z);
}
function subjectBox(lo,hi){
  const points=[];
  for(const x of [lo.x,hi.x])for(const y of [lo.y,hi.y])for(const z of [lo.z,hi.z])points.push(v(x,y,z));
  return points;
}

// A face insert intentionally crops the soles and shoulders. The mouth and
// eyes stay sharp above the foreground tool. All other shots cover the work.
export function composeCraftLens(style,bench,size,width,height,available,side,sight,stage=[],tool,stacked=false){
  const aspect=width/height,open=Math.max(.24,Math.min(1,available/height));
  const stance=carpenterStance({mode:stacked?'kagami':'normal',buffs:{full:size>1}},tool);
  const face=v(stance.x,(stacked?.76:.89)*size,stance.z-(stacked?.45:.75)*size);
  const hands=style==='hands',close=style==='face',wide=style==='wide' && stage.length>0;
  const planing=tool==='plane',planeInsert=close && planing;
  // A slightly lower angle keeps the orange above the face of the stacked cake.
  const insertSlope=stacked?.46:.59;
  const fov=close?32:wide?43:style==='low'?49:38, tan=Math.tan(fov*Math.PI/360);
  const toolMarks=[v(.31,stance.height+.12,0),v(.31,stance.height+.15,.51),
    v(PLANING_BOARD.x,stance.height+.08,PLANING_BOARD.end),v(.45,stance.height+.28,.62)];
  const eyeSpan=(stacked?.15:.23)*size;
  const faceMarks=[face.clone(),face.clone().add(v(-eyeSpan,0,0)),face.clone().add(v(eyeSpan,0,0))];
  const targets=close?[...faceMarks]:[...faceMarks,...toolMarks];
  if(planing){
    targets.push(face.clone().add(v(0,0,PLANING_BOARD.start-PLANING_BOARD.end)),v(PLANING_BOARD.x,stance.height+.16,PLANING_BOARD.start));
  }
  if(style==='low')for(const x of [-.65*size,.65*size])targets.push(v(x,.72*size,.67*size));
  let focus,points,minDistance;
  if(hands){
    // A low three-quarter view puts the two pads on the skyline of the work.
    // Set focus above the grip, keeping stock, blade, eyes and wrists sharp.
    const x=tool==='plane'?PLANING_BOARD.x:tool==='saw'?.32:.24;
    focus=v(x,stance.height+.42*size,.68);
    points=[...targets,face.clone().add(v(0,.26*size,0)),v(x-.47*size,stance.height,.55),
      v(x+.48*size,stance.height,.75),v(x,stance.height+.11,tool==='saw'?-.54:PLANING_BOARD.start)];
    minDistance=2.50*size;
  }else if(close){
    focus=face.clone();
    points=subjectBox(face.clone().add(v(-.55,-.36,-.16).multiplyScalar(size)),
      face.clone().add(v(.55,.42,.17).multiplyScalar(size)));
    points.push(v(0,.76*size,.24));
    minDistance=1.96*size;
    if(planeInsert){
      focus.z-=.22;focus.lerp(toolMarks[2],.52);
      points.push(...targets);
      minDistance=2.52*size;
    }
  }else if(style==='eye'){
    // A waist-up conversation distance gives the joiner's eyes and grip
    // more of the frame than the full-body master or the low tripod.
    focus=v(0,.98*size,.72*size);
    points=subjectBox(v(stance.x-.88*size,.34*size,.52*size),v(stance.x+.87*size,1.72*size,stance.z+.42*size));
    points.push(...toolMarks,v(.45,.67*size,.76));
    if(planing)points.push(v(stance.x,.015,stance.z),...targets);
    minDistance=2.15*size;
  }else{
    points=subjectBox(v(stance.x-.98*size,-.02,stance.z-.68*size),v(stance.x+.98*size,1.74*size,stance.z+.85*size));
    for(const x of [-.87,.87])for(const z of [-.71,.71])points.push(v(x,.54*size,z));
    focus=v(0,.84*size,.68*size);
    if(planing)points.push(...targets);
    minDistance=2.65*size;
    if(wide){
      const low=v(Infinity,Infinity,Infinity),high=v(-Infinity,-Infinity,-Infinity);
      points.push(...stage);
      for(const p of points){low.min(p);high.max(p);}
      focus=low.add(high).multiplyScalar(.5);
      minDistance=4.0*size;
    }
  }
  const angles=hands?(planing?[.65,.84,.49]:tool==='saw'?[.79,.63,.94]:[.46,.67,.29]):planeInsert?[.28,.43,.14]:planing?[1.23,1.04,1.40,.88]:style==='master'?[.48,.72,.20]:style==='eye'?(tool==='mallet'?[.91,1.03,.055]:[.055,.16,.28]):style==='low'?[.09,.18,.31]:
    style==='wide'?(aspect<.78?[1.94,2.18,1.48,1.19,.90]:[1.24,1.66,1.01,1.94]):[.22,.33,.10];
  // A tall viewport can arrange the workmen and the structure from foot to
  // head of the page. Climb above nearby eaves if the shallower tripod fails.
  const pitches=hands?(planing?[.03,.13,.21]:[.22,.13,.31]):wide?(aspect<.78?[.72,1.05,.41]:[.41,.72,1.05]):[style==='master'?(planing?.25:.76):planeInsert?insertSlope:close?.48:0];
  const sides=hands?[side,-side]:planing?[1]:tool==='mallet' && style==='eye'?[side]:[side,-side];
  for(const slope of pitches)for(const angle of angles)for(const hand of sides){
    const bearing=angle*hand;
    // Dir.y is the slope of the sightline, not the lens height. The eye and
    // low tripods use an absolute height so a narrow handset cannot sink
    // the lens below the earth when it has to pull back.
    let dir=v(Math.sin(bearing),slope,-Math.cos(bearing)).normalize();
    let distance=minDistance;
    const eyeLevel=style==='low'?.67*size:1.0*size;
    for(let pass=0;pass<3;pass++){
      if(style==='eye' || style==='low'){
        const rise=eyeLevel-focus.y,run=Math.sqrt(Math.max(.1,distance*distance-rise*rise));
        dir=v(Math.sin(bearing)*run,rise,-Math.cos(bearing)*run).normalize();
      }
      const right=up.clone().cross(dir).normalize(),vertical=dir.clone().cross(right);
      distance=minDistance;
      for(const p of points){
        const rel=p.clone().sub(focus),front=rel.dot(dir);
        distance=Math.max(distance,front+(Math.abs(rel.dot(right))+.02)/(tan*aspect*.91),
          front+(Math.abs(rel.dot(vertical))+.02)/(tan*open*.92));
      }
    }
    const eye=worldPoint(bench,focus.clone().addScaledVector(dir,distance)),aim=worldPoint(bench,focus);
    if(!targets.every(p=>sight(worldPoint(bench,p),eye)))continue;
    if(wide && !stage.some(p=>sight(worldPoint(bench,p),eye)))continue;
    const worldFace=worldPoint(bench,face);
    return {style,fov,eye,focus:aim,width,height,offset:(height-available)/2,
      faceDistance:close?eye.clone().sub(worldFace).dot(eye.clone().sub(aim).normalize()):0};
  }
  return null;
}
