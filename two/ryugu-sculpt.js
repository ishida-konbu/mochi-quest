// Sculpt both flanks from a continuous brush profile. Marks share the very same
// surface sampler as the skin, including around the nose and the shell lip.
import * as T from './vendor/three.module.min.js';
import {surface} from './ryugu-ink.js';

const tau=2*Math.PI;
export function skin(form,rows,columns,sample,tint,tile='paper',reverse=false,closed=false) {
  const pos=[],uv=[],index=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const u=i/columns,v=j/rows,[x,y,z,s=u,t=v]=sample(u,v);
    pos.push(x,y,z);uv.push(s,t);
    if(j<rows&&i<columns){
      const a=j*(columns+1)+i,b=a+columns+1;
      if(reverse)index.push(a,b,a+1,a+1,b,b+1);
      else index.push(a,a+1,b,a+1,b+1,b);
    }
  }
  const g=surface(pos,index,uv);
  if(closed){
    const n=g.attributes.normal,a=new T.Vector3(),b=new T.Vector3();
    for(let j=0;j<=rows;j++){
      const lo=j*(columns+1),hi=lo+columns;
      a.fromBufferAttribute(n,lo).add(b.fromBufferAttribute(n,hi)).normalize();
      n.setXYZ(lo,a.x,a.y,a.z);n.setXYZ(hi,a.x,a.y,a.z);
    }
  }
  form.draw(g,[0,0,0],[1,1,1],tint,[0,0,0],tile);
}

// Monotone cubic section interpolation preserves a hooked beak or a narrow
// wrist without ringing at the tip. First entry is the axial coordinate.
export function profile(stations) {
  const slopes=stations.map((row,i)=>row.map((_,k)=>{
    const prev=stations[Math.max(0,i-1)],next=stations[Math.min(i+1,stations.length-1)];
    if(!i || i===stations.length-1)return (next[k]-prev[k])/(next[0]-prev[0]);
    const a=(row[k]-prev[k])/(row[0]-prev[0]),b=(next[k]-row[k])/(next[0]-row[0]);
    return a*b>0?2*a*b/(a+b):0;
  }));
  return value=>{
    const z=T.MathUtils.clamp(value,stations[0][0],stations.at(-1)[0]);
    let i=0;
    while(i<stations.length-2 && stations[i+1][0]<z)i++;
    const a=stations[i],b=stations[i+1],span=b[0]-a[0],u=(z-a[0])/span,u2=u*u,u3=u*u2;
    return a.slice(1).map((v,k)=>v*(2*u3-3*u2+1)+b[k+1]*(3*u2-2*u3)+
      span*((u3-2*u2+u)*slopes[i][k+1]+(u3-u2)*slopes[i+1][k+1]));
  };
}

export function brush(form,points,widths,color) {
  // Rays and anatomical ink lines are thinner than a pixel at play distance.
  // A densely sampled shell rim already describes its curve almost exactly.
  const segments=points.length>12?points.length:Math.max(4,2*(points.length-1));
  form.stroke(points,widths,color,'paper',5,segments);
}

// An almond of paper, swept with an upper eyelid. A flat iris follows the
// viewer around the rounded brow through its surface coordinates.
export function eye(form,point,toward=1,slit=false) {
  const dark='#393630', iris='#292925',pale='#ede6d0';
  function patch(cx,cy,w,h,lift,tint,almond=false) {
    skin(form,5,28,(u,r)=>{
      const a=tau*u,x=Math.cos(a),y=Math.sin(a)*(almond?(.60+.40*(1-Math.abs(x))):1);
      return point(cx+w*r*x,cy+h*r*y,lift+.002*(1-r*r));
    },tint);
  }
  patch(0,0,1,.68,.005,dark,true);
  patch(.012,-.06,.89,.49,.010,pale,true);
  patch(toward*.19,-.08,slit?.50:.21,slit?.16:.37,.015,iris);
  const flick=[[-1.32,-.21],[-.87,.17],[-.39,.56],[.12,.64],[.67,.43],[1.13,.08]];
  brush(form,flick.map(([x,y])=>point(x,y,.012)),[.001,.009,.014,.013,.008,.0015],dark);
}

// A ruled membrane spans the leading and trailing edges. Varying the lengths
// and bow of its rays gives each lobe a different silhouette in a turned pose.
export function membrane(form,root,tip,rays,tint,bend) {
  function point(u,v){
    const a=root(u),b=tip(u),arch=Math.sin(Math.PI*v);
    return a.map((x,k)=>T.MathUtils.lerp(x,b[k],v)+(bend?.(u,v,k)||0)*arch);
  }
  skin(form,7,rays*4,point,tint);
  for(let i=0;i<=rays;i++){
    const u=i/rays;
    const run=[.06,.34,.68,.98].map(v=>point(u,v));
    brush(form,run,[.0045,.0085*(1+.12*Math.sin(i)),.005,.0012],'#615a49');
  }
  brush(form,Array.from({length:rays*3+1},(_,i)=>tip(i/(rays*3))),.0052,'#6a614f');
}

export function pointCurve(pts) {
  const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)));
  return t=>c.getPoint(t).toArray();
}
