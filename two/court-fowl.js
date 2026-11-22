// The two lateral ink studies live in one plate. Section coordinates below are
// measured on that plate in pixels, so each mark stays on the turning bird.
import * as T from './vendor/three.module.min.js';
import { brushWash } from './scroll-sculpt.js';

const TAU = Math.PI * 2;
const paper = '#fffdf5', ink = '#493c32', warm = '#ad9679';
const tints = new Map();
const cock = {
  origin: [467, 896], scale: [.00134, .00127], neck: [569, 485],
  breast: [
    [242,599,602,2],[249,561,644,42],[267,520,691,92],[302,488,718,126],
    [348,462,740,157],[403,455,738,172],[461,440,737,177],[512,417,741,166],
    [554,393,687,152],[607,377,649,137],[656,380,614,109],[689,405,581,81],
    [711,442,533,48],[718,471,493,13],[719,481,483,1],
  ],
  hackle: [
    [170,676,704,4],[179,659,721,39],[193,641,737,64],[207,626,736,74],
    [221,605,724,71],[238,590,705,67],[269,574,683,68],[306,550,682,77],
    [350,534,689,86],[393,510,704,96],[435,485,717,106],[469,493,704,96],
    [497,530,681,69],[507,574,650,22],
  ],
  comb: [[658,184],[632,193],[593,196],[570,157],[602,164],[615,163],[603,116],[625,124],
    [651,146],[645,104],[663,118],[684,142],[682,107],[707,141],[719,148],[728,130],[741,156],
    [739,181],[728,196],[702,176],[679,168]],
  wattle: [[221,704,725,9],[237,695,726,13],[272,694,740,18],[299,698,741,21],[319,709,735,12],[325,722,728,2]],
  tailRoot: [388,476],
  // The four long sickles have different return curves; the innermost plume
  // curls right under the rump. Their vanes spread sideways in a shallow fan.
  tail: [
    [[401,464,15],[392,334,16],[347,236,11],[276,165,11],[210,153,5],[125,182,3],[63,257,1]],
    [[399,452,22],[375,346,23],[321,274,29],[238,261,23],[150,291,20],[69,376,13],[26,477,6],[20,539,1]],
    [[389,452,22],[349,373,28],[286,366,25],[203,396,25],[125,468,16],[57,554,9],[38,621,1]],
    [[375,466,25],[318,444,21],[250,457,25],[168,530,18],[104,620,9],[90,697,5],[131,785,1]],
  ],
};
const hen = {
  origin: [1177, 895], scale: [.00149,.00165], neck: [1320,544],
  breast: [
    [935,579,581,2],[941,555,620,36],[956,527,672,69],[980,511,715,99],
    [1010,494,749,120],[1050,492,773,137],[1110,500,786,146],[1170,503,790,150],
    [1227,504,794,149],[1275,484,761,131],[1322,470,735,116],[1368,490,693,80],
    [1394,528,650,46],[1402,572,610,17],[1403,588,591,2],
  ],
  hackle: [
    [418,1377,1424,4],[426,1358,1452,38],[435,1342,1469,49],[451,1323,1480,58],
    [467,1297,1461,54],[478,1276,1427,60],[498,1248,1417,63],[522,1221,1408,76],
    [553,1244,1407,81],[585,1285,1403,65],[607,1315,1389,42],[616,1343,1375,12],
  ],
  comb: [[1415,416],[1425,414],[1418,396],[1428,393],[1442,401],[1445,388],[1457,394],
    [1466,411],[1471,401],[1481,415],[1484,431],[1478,444],[1462,430],[1440,419]],
  wattle: [[468,1444,1464,7],[479,1439,1459,10],[496,1438,1454,9],[504,1446,1451,2]],
  tailRoot: [1043,546],
  tail: [
    [[1060,554,18],[1036,488,20],[1002,426,18],[973,393,11],[941,374,2]],
    [[1049,561,19],[1011,507,22],[969,457,21],[942,420,15],[922,394,2]],
    [[1044,575,22],[989,550,24],[956,518,23],[923,477,15],[910,434,2]],
    [[1024,591,19],[972,580,22],[936,551,16],[910,521,14],[897,475,2]],
    [[1011,601,15],[968,595,16],[923,571,13],[889,525,2]],
  ],
};
let pigment;
function fowlInk() {
  if (!pigment) {
    const map = new T.TextureLoader().load(new URL('./assets/bestiary/court-fowl.webp', import.meta.url).href);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 8;
    pigment = new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide});
    pigment.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float inkWeight; varying float vInkWeight;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInkWeight = inkWeight;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vInkWeight;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          diffuseColor.rgb = mix(vec3(.966,.919,.796),diffuseColor.rgb,vInkWeight);`);
    };
    brushWash(pigment,0);
  }
  return pigment;
}

class Drawing {
  constructor(study) { this.study=study; }
  positions=[]; colors=[]; texels=[]; weights=[]; faces=[];
  point(px,py,width=0) {
    const {origin,scale}=this.study;
    return new T.Vector3(width*scale[1], (origin[1]-py)*scale[1], (px-origin[0])*scale[0]);
  }
  vertex(p,px,py,tint=paper,weight=1) {
    const id=this.positions.length/3;
    if(!tints.has(tint))tints.set(tint,new T.Color(tint));
    const color=tints.get(tint);
    this.positions.push(p.x,p.y,p.z); this.colors.push(color.r,color.g,color.b);
    this.weights.push(weight); this.texels.push((px+.5)/1536,1-(py+.5)/1024);
    return id;
  }
  // Each ring wraps continuously around the breast or neck. Both flanks
  // inherit the lateral study while the dorsal and ventral strokes meet.
  sections(rows,side=0,lengthwise=false) {
    const outline=new T.CatmullRomCurve3(rows.map(([y,left,right])=>new T.Vector3(y,left,right)),false,'catmullrom',.37);
    const depth=new T.SplineCurve(rows.map((r,i)=>new T.Vector2(i,r[3])));
    const n=26,steps=(rows.length-1)*3,first=this.positions.length/3;
    for(let i=0;i<=steps;i++){
      const t=i/steps, {x:y,y:left,z:right}=outline.getPoint(t), w=Math.max(1,depth.getPoint(t).y);
      for(let j=0;j<n;j++){
        const a=TAU*j/n,section=(left+right+(right-left)*Math.cos(a))*.5;
        const px=lengthwise?y:section,py=lengthwise?section:y;
        const flank=Math.abs(Math.sin(a));
        const end=lengthwise?Math.sin(Math.PI*t)**.48:1;
        const weight=T.MathUtils.smoothstep(flank*end,.09,.76);
        this.vertex(this.point(px,py,side+w*Math.sin(a)),px,py,paper,weight);
        if(i<steps){
          const k=first+i*n+j,next=first+i*n+((j+1)%n);
          if(lengthwise)this.faces.push(k,next,k+n,next,next+n,k+n);
          else this.faces.push(k,k+n,next,next,k+n,next+n);
        }
      }
    }
    for(let j=1;j<n-1;j++)this.faces.push(first,first+j,first+j+1,first+steps*n,first+steps*n+j+1,first+steps*n+j);
  }
  // A comb has an irregular serrated edge and rounded cheeks on either side.
  relief(outline,ridge,tint=paper) {
    const contour=outline.map(p=>new T.Vector2(...p));
    const triangles=T.ShapeUtils.triangulateShape(contour,[]);
    const first=this.positions.length/3,n=outline.length;
    for(const side of [-1,1]){
      for(const [u,v] of outline)this.vertex(this.point(u,v,side*2),u,v,tint);
      // An inset ring rounds the sides without filling the dips between teeth.
      const center=contour.reduce((sum,p)=>sum.add(p),new T.Vector2()).multiplyScalar(1/n);
      for(const p of contour){
        const q=p.clone().lerp(center,.14);
        this.vertex(this.point(q.x,q.y,side*ridge),q.x,q.y,tint);
      }
    }
    for(const [a,b,c] of triangles)this.faces.push(first+n+a,first+n+b,first+n+c,first+3*n+c,first+3*n+b,first+3*n+a);
    for(let i=0;i<n;i++){
      const a=first+i,b=first+(i+1)%n;
      this.faces.push(a,b,b+n,a,b+n,a+n,a+2*n,b+3*n,b+2*n,a+2*n,a+3*n,b+3*n,a,a+2*n,b,b,a+2*n,b+2*n);
    }
  }
  vane(stations,side,layer){
    const arc=new T.CatmullRomCurve3(stations.map(([x,y,r])=>new T.Vector3(x,y,r)),false,'catmullrom',.42);
    const first=this.positions.length/3,N=25,M=7;
    for(let i=0;i<=N;i++){
      const t=i/N,p=arc.getPoint(t),dir=arc.getTangent(t);
      const len=Math.hypot(dir.x,dir.y), dx=-dir.y/len,dy=dir.x/len;
      for(let j=0;j<M;j++){
        const s=j/(M-1)*2-1,px=p.x+dx*s*p.z,py=p.y+dy*s*p.z;
        const fan=Math.sin(Math.PI*t*.73);
        const width=side*(11+layer*14+(20+layer*8)*fan+s*p.z*(.38+fan*.79)+(1-s*s)*7);
        this.vertex(this.point(px,py,width),px,py);
        if(i<N&&j<M-1){
          const k=first+i*M+j;this.faces.push(k,k+1,k+M,k+M,k+1,k+M+1);
        }
      }
    }
  }
  stroke(knots,radii,color) {
    const path=new T.CatmullRomCurve3(knots),steps=3*(knots.length-1);
    const tube=path.computeFrenetFrames(steps,false),n=6,first=this.positions.length/3;
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=path.getPointAt(t),j=t*(knots.length-1),l=Math.min(Math.floor(j),radii.length-2);
      const r=T.MathUtils.lerp(radii[l],radii[l+1],j-l);
      for(let k=0;k<n;k++){
        const a=k*TAU/n, at=p.clone().addScaledVector(tube.normals[i],r*Math.cos(a)).addScaledVector(tube.binormals[i],r*Math.sin(a));
        this.vertex(at,821,125,color);
        if(i<steps){const v=first+i*n+k,h=first+i*n+(k+1)%n;this.faces.push(v,h,v+n,h,h+n,v+n);}
      }
    }
  }
  finish(name,pivot=new T.Vector3()){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(this.texels,2));
    geo.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    geo.setAttribute('inkWeight',new T.Float32BufferAttribute(this.weights,1));
    geo.setIndex(this.faces);geo.translate(-pivot.x,-pivot.y,-pivot.z);geo.computeVertexNormals();
    return {name,pivot:pivot.toArray(),geometry:geo,get material(){return fowlInk();}};
  }
}
// The folded wing stands proud of the ribs. The leading edge lies against
// the flank, while the primaries lift and taper over the rear of the body.
function foldedWing(form,isHen,side) {
  const outline=isHen?
    [[1219,520],[1267,540],[1275,590],[1236,628],[1180,662],[1110,685],[1050,673],[1006,668],[1034,626],[1084,580],[1140,540]]:
    [[547,470],[607,480],[624,508],[609,546],[562,585],[489,621],[411,644],[339,681],[363,622],[405,557],[466,505]];
  const rim=new T.SplineCurve([...outline,outline[0]].map(p=>new T.Vector2(...p)));
  const centre=new T.Vector2(...(isHen?[1149,608]:[484,564]));
  const profile=form.study.breast,first=form.positions.length/3,rows=7,edges=58;
  const surfacePoint=(px,py,r)=>{
    const i=profile.findIndex((row,k)=>k>0&&row[0]>=px),a=profile[i-1],b=profile[i];
    const t=(px-a[0])/(b[0]-a[0]), top=T.MathUtils.lerp(a[1],b[1],t),bottom=T.MathUtils.lerp(a[2],b[2],t);
    const h=T.MathUtils.clamp((2*py-top-bottom)/(bottom-top),-1,1);
    const width=T.MathUtils.lerp(a[3],b[3],t)*Math.sqrt(1-h*h);
    return form.point(px,py,side*(width+4+18*(1-r*r)));
  };
  for(let j=0;j<=rows;j++)for(let i=0;i<edges;i++){
    const r=j/rows, p=centre.clone().lerp(rim.getPoint(i/edges),r);
    form.vertex(surfacePoint(p.x,p.y,r),p.x,p.y);
    if(j<rows){
      const v=first+j*edges+i,h=first+j*edges+(i+1)%edges;
      form.faces.push(v,h,v+edges,h,h+edges,v+edges);
    }
  }
  for(const [start,end] of (isHen?[[.28,.45],[.48,.62]]:[[.27,.40],[.50,.61]])){
    const points=Array.from({length:7},(_,i)=>{const p=rim.getPoint(start+(end-start)*i/6);return surfacePoint(p.x,p.y,1);});
    form.stroke(points,[.0004,.0017,.0023,.0021,.0015,.001,.0004],'#716456');
  }
}
// Upper and lower mandibles share the dark gape. They narrow toward the tip
// across their width as well as in profile, with a nostril on each ridge.
function bill(form,study,isHen) {
  const [u,v]=isHen?[1463,454]:[723,206],length=isHen?43:47;
  const stations=[[0,-11,10,18],[.30,-10,8,17],[.65,-6,5,10],[.87,0,6,5],[1,7,8,1]];
  form.sections(stations.map(([t,top,bottom,width])=>[u+t*length,v+top,v+bottom,width]),0,true);
  for(const side of [-1,1]) {
    const gape=[[0,7,15],[.27,4,17],[.62,2,11],[.87,4,5],[1,7.5,0]];
    form.stroke(gape.map(([t,h,w])=>form.point(u+t*length,v+h,side*w)),[.0005,.0027,.002,.0013,.0004],ink);
    form.stroke([form.point(u+3,v-6,side*12),form.point(u+7,v-7,side*13),form.point(u+10,v-6,side*13)],[.001,.003,.0007],ink);
  }
}
function leg(study,side,isHen){
  const f=new Drawing(study);
  const x=side*(isHen?.082:.091),z=side*.038;
  const hip=new T.Vector3(x,.31,z);
  const points=[[x,.35,z+.006],[x,.235,z-.035],[x,.165,z-.070],[x+side*.011,.055,z-.009],[x+side*.014,.033,z+.008]];
  const brush=(coords,r,c)=>f.stroke(coords.map(p=>new T.Vector3(...p)),r,c);
  brush(points,[.028,.028,.023,.014,.013],warm);
  for(let j=0;j<6;j++){
    const y=.069+.018*j,z1=z-.017-j*.009,x1=x+side*(.010-j*.001);
    brush([[x1-.012,y+.003,z1],[x1,y-.001,z1+.011],[x1+.012,y+.003,z1]],[.0006,.0024,.0006],ink);
  }
  for(const [spread,length] of [[-.065,.084],[0,.123],[.067,.091],[side*.018,-.078]]){
    const start=x+side*.014,heel=z+.008;
    brush([[start,.034,heel],[start+spread*.38,.016,heel+length*.32],[start+spread*.74,.019,heel+length*.71],[start+spread,.010,heel+length]],
      [.012,.009,.006,.002],warm);
    brush([[start+spread*.75,.020,heel+length*.75],[start+spread,.012,heel+length],[start+spread*1.08,.005,heel+length*1.13]],[.003,.0035,.0006],ink);
  }
  return f.finish('foot'+side,hip);
}
export function courtFowl(isHen) {
  const study=isHen?hen:cock, body=new Drawing(study),head=new Drawing(study),tail=new Drawing(study);
  body.sections(study.breast,0,true);
  head.sections(study.hackle);
  head.relief(study.comb,isHen?8:12);
  bill(head,study,isHen);
  for(const side of [-1,1]){
    foldedWing(body,isHen,side);
    head.sections(study.wattle,side*(isHen?6:12));
    study.tail.forEach((r,i)=>tail.vane(r,side,i));
    // Short coverts bridge the folded wing and the bases of the tail vanes.
    for(let i=0;i<3;i++){
      const covert=isHen?[[1065,558,16],[1021,553-i*6,18],[984+i*6,524-i*7,15],[950+i*8,487-i*8,1]]:
        [[407,480,15],[363,469-i*9,20],[324,462-i*12,18],[282,480-i*17,8],[258+i*6,503-i*24,1]];
      tail.vane(covert,side,i+1);
    }
  }
  return [body.finish('body'),head.finish('head',head.point(...study.neck)),tail.finish('sickles',tail.point(...study.tailRoot)),
    leg(study,-1,isHen),leg(study,1,isHen)];
}
