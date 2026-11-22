// Local profiles used by the bath carpentry, kilns and water fittings.
import * as T from './vendor/three.module.min.js';

export function surface(cols,rows,sample,tone){
  const vertices=[],indices=[],colors=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows,point=sample(u,v);
    vertices.push(...point);
    if(tone){const c=tone(u,v,point);colors.push(c.r,c.g,c.b);}
    if(i<cols && j<rows){
      const a=i+(cols+1)*j,b=a+cols+1;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
  }
  const g=new T.BufferGeometry();
  g.setIndex(indices);g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  if(tone)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();return g;
}
export function rod(s,paint,a,b,r,tip=r){
  s.stroke(paint,[a,a.map((n,i)=>(n+b[i])*.5),b],[r,(r+tip)*.5,tip],4);
}
const pebbleGeometry=new T.SphereGeometry(1,8,6);
export function dab(s,col,x,y,z,w,h,d,pitch=0,yaw=0,roll=0){
  s.add(pebbleGeometry,col,x,y,z,w,h,d,pitch,yaw,roll);
}
export function turning(s,tint,x,y,z,rows,segments=40,pitch=0,yaw=0,roll=0){
  const g=new T.LatheGeometry(rows.map(([r,h])=>new T.Vector2(r,h)),segments);
  s.add(g,tint,x,y,z,1,1,1,pitch,yaw,roll);
}
