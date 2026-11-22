import * as T from './vendor/three.module.min.js';

const vec=(...values)=>new T.Vector3(...values);
// A taper thins to a point at the lift of the brush. Elliptical sections keep
// the side of a trunk or a fold broader than a single pen line.
export function brushStroke(knots,widths,steps=24,sides=8){
  const path=new T.CatmullRomCurve3(knots.map(q=>vec(...q)));
  const frame=path.computeFrenetFrames(steps,false), points=[],faces=[];
  for(let j=0;j<=steps;j++){
    const t=j/steps, o=path.getPointAt(t);
    const k=Math.min(widths.length-2,Math.floor(t*(widths.length-1))), f=t*(widths.length-1)-k;
    const width=Math.max(.0004,widths[k]+(widths[k+1]-widths[k])*f);
    for(let i=0;i<sides;i++){
      const angle=i*2*Math.PI/sides;
      const q=o.clone().addScaledVector(frame.normals[j],Math.cos(angle)*width)
        .addScaledVector(frame.binormals[j],Math.sin(angle)*width*.86);
      points.push(q.x,q.y,q.z);
      const a=j*sides+i,b=j*sides+(i+1)%sides;
      if(j<steps) faces.push(a,b,a+sides,b,b+sides,a+sides);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));
  g.setIndex(faces);g.computeVertexNormals();return g;
}
// Solid painted profiles share one geometry and one draw material per spatial batch.
export function sculpture() {
  const vertices=[], normals=[], colors=[], indices=[];
  const obj=new T.Object3D(), nmat=new T.Matrix3(), point=vec(), n=vec(), col=new T.Color();
  const ball=new T.SphereGeometry(1,12,8), cube=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,10);
  function add(geometry, tint, x=0,y=0,z=0, sx=1,sy=1,sz=1, pitch=0,yaw=0,roll=0) {
    obj.position.set(x,y,z);
    obj.rotation.set(pitch,yaw,roll,'YXZ');
    obj.scale.set(sx,sy,sz);
    obj.updateMatrix();
    nmat.getNormalMatrix(obj.matrix);
    const pos=geometry.attributes.position,norm=geometry.attributes.normal,paint=geometry.attributes.color,start=vertices.length/3;
    col.set(tint);
    for(let i=0;i<pos.count;i++) {
      point.fromBufferAttribute(pos,i).applyMatrix4(obj.matrix);
      n.fromBufferAttribute(norm,i).applyMatrix3(nmat).normalize();
      vertices.push(point.x,point.y,point.z);normals.push(n.x,n.y,n.z);
      if(paint) colors.push(col.r*paint.getX(i),col.g*paint.getY(i),col.b*paint.getZ(i));
      else colors.push(col.r,col.g,col.b);
    }
    if(geometry.index) for(const j of geometry.index.array) indices.push(start+j);
    else for(let j=0;j<pos.count;j++) indices.push(start+j);
  }
  return {
    add,
    get indexCount(){return indices.length;},
    stroke(tint, knots, widths, steps=14){
      add(brushStroke(knots,widths,steps),tint);
    },
    ball:(...args)=>add(ball,...args), box:(...args)=>add(cube,...args),
    post:(...args)=>add(cylinder,...args),
    finish(){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
      g.setIndex(indices); g.computeBoundingSphere();
      return g;
    },
  };
}
