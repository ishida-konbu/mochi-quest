import * as THREE from './vendor/three.module.min.js';
import { brushWash } from './scroll-sculpt.js';
const {PI,sin,cos}=Math, tau=PI*2;
export const INK='#3e382e', SOOT='#5b5040', PAPER='#ece3ca', WARM='#ceb994', RED='#a6614a';
const tiles={paper:0,scales:1,shell:2,mantle:3,fan:4,cloth:5};
let paint;
function pigments() {
  const map=new THREE.TextureLoader().load(new URL('./assets/bestiary/ryugu-brushwork.webp',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=8;
  return brushWash(new THREE.MeshLambertMaterial({map,vertexColors:true,side:THREE.DoubleSide}),.63);
}
export function pigment(){return paint??=pigments();}
const sphere=new THREE.SphereGeometry(1,22,16),small=new THREE.SphereGeometry(1,12,8);
const dummy=new THREE.Object3D(),vec=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3();
export class InkForm {
  constructor(patches=tiles,columns=3,rows=2) {this.patches=patches;this.columns=columns;this.rows=rows;}
  p=[];n=[];c=[];ix=[];uv=[];
  draw(geo,pos,scale,tint,rotation=[0,0,0],tile='paper',uvMode) {
    dummy.position.fromArray(pos);dummy.scale.fromArray(scale);
    if(rotation.isQuaternion)dummy.quaternion.copy(rotation);else dummy.rotation.set(...rotation);
    dummy.updateMatrix();nm.getNormalMatrix(dummy.matrix);
    const base=this.p.length/3,color=new THREE.Color(tint),id=this.patches[tile],u0=id%this.columns,v0=this.rows-1-Math.floor(id/this.columns);
    const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
    for(let i=0;i<p.count;i++){
      vec.fromBufferAttribute(p,i);
      const a=uvMode==='top' ? .5+vec.x*.49:uv.getX(i), b=uvMode==='top' ? .5+vec.z*.49:uv.getY(i);
      this.uv.push((u0+.015+a*.97)/this.columns,(v0+.014+b*.972)/this.rows);
      vec.applyMatrix4(dummy.matrix);normal.fromBufferAttribute(n,i).applyNormalMatrix(nm);
      this.p.push(vec.x,vec.y,vec.z);this.n.push(normal.x,normal.y,normal.z);this.c.push(color.r,color.g,color.b);
    }
    if(geo.index)for(const i of geo.index.array)this.ix.push(base+i);
    else for(let i=0;i<p.count;i++)this.ix.push(base+i);
  }
  oval(pos,scale,tint,rotation,tile,uvMode) {
    this.draw(Math.max(...scale)<.14?small:sphere,pos,scale,tint,rotation,tile,uvMode);
  }
  // A tapered, curved ink line has real thickness even in profile. Rings are
  // perpendicular to the tangent, giving elbows and curled arms a rounded cap.
  stroke(points,radii,tint,tile='paper',sides=9,samples) {
    if(typeof radii==='number')radii=points.map(()=>radii);
    const pts=points.map(v=>new THREE.Vector3(...v)),curve=new THREE.CatmullRomCurve3(pts),
      count=samples??Math.max(6,(pts.length-1)*4),frames=curve.computeFrenetFrames(count,false);
    const vertices=[],indices=[],uv=[];
    for(let k=0;k<=count;k++){
      const t=k/count,along=t*(radii.length-1),l=Math.min(Math.floor(along),radii.length-2),
        r=THREE.MathUtils.lerp(radii[l],radii[l+1],along-l),center=curve.getPointAt(t);
      for(let j=0;j<=sides;j++){
        const ang=j*tau/sides;
        vec.copy(center).addScaledVector(frames.normals[k],r*cos(ang)).addScaledVector(frames.binormals[k],r*sin(ang));
        vertices.push(vec.x,vec.y,vec.z);uv.push(j/sides,t);
        const i=k*(sides+1)+j;
        if(k<count && j<sides)indices.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);
      }
    }
    this.draw(surface(vertices,indices,uv),[0,0,0],[1,1,1],tint,[0,0,0],tile);
  }
  geometry() {
    const g=surface(this.p,this.ix,this.uv);g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));return g;
  }
}
export function surface(position,index,uv) {
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
// A fin drawn as a pressure-shaped translucent blade, with an inked leading edge.
export function fin(form,outline,tint,spine=[0,0,0],rays=true,tile='paper') {
  const center=outline.reduce((p,q)=>p.map((v,i)=>v+q[i]/outline.length),[0,0,0]);
  const points=[...center],uv=[.5,.5],indices=[];
  const yy=outline.map(p=>p[1]),xx=outline.map(p=>p[0]),zz=outline.map(p=>p[2]);
  const sideways=Math.max(...xx)-Math.min(...xx)>Math.max(...zz)-Math.min(...zz),axis=sideways?0:2,
    lo=Math.min(...(sideways?xx:zz)),width=Math.max(...(sideways?xx:zz))-lo||1,bottom=Math.min(...yy),height=Math.max(...yy)-bottom||1;
  outline.forEach((p,i)=>{
    points.push(...p);uv.push((p[axis]-lo)/width,(p[1]-bottom)/height);indices.push(0,i+1,(i+1)%outline.length+1);
  });
  form.draw(surface(points,indices,uv),[0,0,0],[1,1,1],tint,[0,0,0],tile);
  form.stroke([...outline,outline[0]],.013,SOOT,'paper',6);
  if(rays)for(let i=1;i<outline.length-1;i++)form.stroke([spine,outline[i]],[.014,.0055],SOOT,'paper',6);
}

const prints=new Map();
export function seaPrint(type) {
  if(prints.has(type))return prints.get(type);
  const sheet=document.createElement('canvas');sheet.width=sheet.height=256;
  const p=sheet.getContext('2d');p.scale(2,2);p.lineJoin=p.lineCap='round';
  function paint(d,t,w=2.4) {
    const path=new Path2D(d);
    if(t){p.fillStyle=t;p.fill(path);}
    p.strokeStyle='#484234';p.lineWidth=w;p.stroke(path);
  }
  if(type==='bream'){
    paint('M35 69Q58 27 90 40Q108 42 118 56L109 64Q96 85 69 88Q48 91 36 80L13 98 17 77 9 58Z','#c79d84');
    paint('M43 57L45 44 50 49 52 37 57 44 62 31 67 38 71 29 78 38',null,1.8);
    paint('M91 47Q80 59 85 72M68 65L49 77 57 62M97 47Q105 46 105 53Q103 59 97 56Z','#e9dabb',2);
    for(let i=0;i<3;i++)paint('M'+(43+i*9)+' 62q6 2 4 7',null,1.1);
    paint('M70 75Q74 92 84 88L96 82M44 57Q32 50 32 38L20 15Q36 6 51 20L32 38','#d9be88');
    paint('M33 36L28 18M34 34L35 14M37 34L45 18',null,1);
  }else if(type==='seaTurtle'){
    paint('M16 86Q19 54 38 42Q61 24 82 47Q93 55 91 75Q80 96 48 101Z','#9b9b7e');
    paint('M22 75L38 73 48 51 61 47 74 63 65 82 42 88 34 82M74 63L84 61M65 82L73 88',null,1.7);
    paint('M67 84Q80 75 81 56Q80 43 88 36Q97 28 107 34L117 41 115 49 105 50Q97 51 96 66Q98 80 84 88Z','#c8bd9d');
    paint('M92 36Q98 32 103 38M34 92Q25 98 18 104L28 107 42 99M59 94Q62 106 74 108L79 103',null,2);
    paint('M79 79Q87 68 102 71L111 90Q103 101 87 100Z','#bd886a');
    paint('M82 81L92 98 93 77 104 97 103 74M98 63L107 52',null,1.5);
  }else{
    paint('M40 74Q29 62 36 37Q43 12 65 15Q88 12 95 34Q100 50 90 67L88 77Q106 73 108 62Q110 56 114 58Q118 79 102 83L91 86Q103 94 111 86Q111 99 100 102Q88 101 78 90Q79 111 94 113Q79 120 70 109L65 97Q61 119 48 115Q55 108 55 96Q41 112 30 106Q22 103 24 97Q31 106 47 87Q25 95 19 81Q18 73 22 71Q24 84 40 74Z','#c59983');
    paint('M36 40Q58 31 93 40L92 49Q64 40 36 49Z','#e9dfbd');
    paint('M45 60Q48 53 53 58Q58 67 49 68ZM68 58Q73 51 78 58Q83 64 74 67Z','#ece2bf');
    paint('M58 70Q66 65 69 73Q70 79 62 80Q56 79 58 70Z','#5b4b3b');
    paint('M96 72L112 28 116 24Q120 16 119 12Q112 15 110 21L109 27 95 69Z','#a5916d',1.6);
  }
  prints.set(type,sheet);return sheet;
}
