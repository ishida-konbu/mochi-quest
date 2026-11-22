// Side projections keep the painter's rump-to-shoulder marks in registration
// on both flanks. Curved sections can also be sampled for ink on the skin.
import * as T from './vendor/three.module.min.js';
import { InkForm, surface } from './ryugu-ink.js';

export const ink='#352f29', grey='#776f61', pale='#fffaf1';
const patches={elephant:0,ox:1,baku:2,horse:3,paper:4,hair:5};
const zero=[0,0,0],unit=[1,1,1],tau=2*Math.PI,sootInk='#554d42';
let pigment;
export function coatMaterial(){
  if(pigment)return pigment;
  const map=new T.TextureLoader().load(new URL('./assets/bestiary/otsu-coats.webp',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  pigment=new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide});
  pigment.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fibrePoint;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfibrePoint=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fibrePoint;')
      .replace('#include <opaque_fragment>',`
        float slope=abs(dot(normalize(normal),normalize(vViewPosition)));
        float pressure=.5+.5*sin(6.*fibrePoint.z+4.*fibrePoint.y+sin(fibrePoint.x*12.));
        float edge=1.-smoothstep(.012,clamp(.09+.11*pressure+1.2*fwidth(slope),.10,.34),slope);
        vec3 rice=diffuseColor.rgb*vec3(1.09,1.105,1.12);
        outgoingLight=mix(rice,outgoingLight,.34);
        outgoingLight=mix(outgoingLight,vec3(.044,.036,.028),edge*(.70+.21*pressure));
        #include <opaque_fragment>`);
  };
  return pigment;
}
export function piece(name,pivot,draw){
  const form=new InkForm(patches,3,2);
  draw(form);
  return {name,pivot,geometry:form.geometry(),get material(){return coatMaterial();}};
}
export function pen(f,points,widths,color=ink){f.stroke(points,widths,color,'paper',5);}
export function stem(f,points,widths,color,tile='paper'){f.stroke(points,widths,color,tile,13);}
const curve=p=>new T.CatmullRomCurve3(p.map(q=>new T.Vector3(...q)),false,'catmullrom',.42);
// Stations are x, height, depth, half-width and section radius. In addition to
// the oval section a small second harmonic flattens the belly or jaw.
export function hide(f,axis,stations,tile,tint=pale,belly=0){
  const spine=curve(stations.map(p=>p.slice(0,3))),sizes=curve(stations.map(p=>[p[3],p[4],0]));
  const v=[],uv=[],ix=[],rows=(stations.length-1)*3,cols=28;
  function at(u,a,lift=0){
    const p=spine.getPoint(Math.max(0,Math.min(1,u))),r=sizes.getPoint(Math.max(0,Math.min(1,u)));
    const c=Math.cos(a),s=Math.sin(a),w=Math.max(.001,r.x)+lift,h=Math.max(.001,r.y)+lift;
    p.x+=s*w*(1-belly*c);
    if(axis==='z')p.y+=c*h;else p.z+=c*h;
    return p.toArray();
  }
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
    const u=i/rows,a=j/cols*tau;
    v.push(...at(u,a));uv.push(axis==='z'?u:.5+.47*Math.cos(a),axis==='z'?.5+.49*Math.cos(a):1-u);
    if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  }
  const geo=surface(v,ix,uv),n=geo.attributes.normal,p=new T.Vector3(),q=new T.Vector3();
  for(let i=0;i<=rows;i++){
    const a=i*(cols+1),b=a+cols;p.fromBufferAttribute(n,a).add(q.fromBufferAttribute(n,b)).normalize();
    n.setXYZ(a,p.x,p.y,p.z);n.setXYZ(b,p.x,p.y,p.z);
  }
  f.draw(geo,zero,unit,tint,zero,tile);
  return at;
}
// An irregular dished leaf with a solid rim. Tip and heel can turn away from
// the base, giving the ears and rolls of hair a silhouette from behind too.
export function leaf(f,outline,root,tint,tile='paper',edge=true){
  const rim=new T.CatmullRomCurve3(outline.map(q=>new T.Vector3(...q)),true,'catmullrom',.32);
  const centre=new T.Vector3(...root),v=[],uv=[],ix=[],steps=28,rings=4;
  for(let j=0;j<=rings;j++)for(let k=0;k<=steps;k++){
    const u=j/rings,t=k/steps,at=rim.getPoint(t),p=at.clone().lerp(centre,1-u);
    p.x+=Math.sign(root[0]||1)*.024*Math.sin(Math.PI*u);
    v.push(...p.toArray());uv.push(.5+.47*u*Math.cos(t*tau),.5+.47*u*Math.sin(t*tau));
    if(j<rings&&k<steps){const a=j*(steps+1)+k;ix.push(a,a+steps+1,a+1,a+1,a+steps+1,a+steps+2);}
  }
  f.draw(surface(v,ix,uv),zero,unit,tint,zero,tile);
  if(edge)pen(f,[...outline,outline[0]],outline.map((_,i)=>i%3===0?.012:.006).concat(.012),grey);
}
export function eye(f,side,at,width,tilt=0){
  const p=(z,y,h)=>[at[0]+side*(h-z*.28),at[1]+y+z*tilt,at[2]+z];
  const outline=[p(-width,0,0),p(-width*.44,width*.49,.008),p(width*.14,width*.51,.011),p(width*.89,width*.12,.003),p(width,0,0),p(width*.50,-width*.34,.006),p(-width*.20,-width*.31,.008)];
  leaf(f,outline,p(0,0,.018),'#fff4d8','paper',false);
  f.oval(p(width*.12,width*.03,.021),[width*.18,width*.39,width*.29],ink,[0,side*.25,0]);
  f.oval(p(width*.18,width*.17,.034),[width*.058,width*.068,width*.069],pale);
  pen(f,outline.slice(0,5),[.003,width*.14,width*.17,width*.08,.002]);
  pen(f,[outline[4],outline[5],outline[6],outline[0]],[.002,width*.072,width*.062,.0015]);
}
export function skinLines(f,at,side,marks,tint=grey){
  for(const [u,a,du,da,bow,width] of marks){
    const points=Array.from({length:6},(_,j)=>{const t=j/5;return at(u+t*du,side*(a+da*t+bow*Math.sin(t*Math.PI)),.006);});
    pen(f,points,[.001,width*.60,width,width*.75,width*.38,.001],tint);
  }
}
// Flowing ribbon of hair, pinched to a hooked tip, with a separate broken
// dark brushstroke along one edge. The cross-section is ridged on both faces.
export function lock(f,points,widths,across,tint='#797263',plane=false){
  const path=curve(points),axis=new T.Vector3(...across),v=[],ix=[],uv=[],contour=[],steps=15,edges=[-.98,-.4,.12,.60,.98];
  for(let i=0;i<=steps;i++){
    const u=i/steps,c=path.getPoint(u),t=path.getTangent(u),wAxis=(plane?axis.clone().cross(t):axis.clone().addScaledVector(t,-axis.dot(t))).normalize();
    const normal=wAxis.clone().cross(t).normalize(),t0=u*(widths.length-1),j=Math.min(Math.floor(t0),widths.length-2),width=T.MathUtils.lerp(widths[j],widths[j+1],t0-j);
    if(plane && (i%2===0 || i===steps))contour.push(c.clone().addScaledVector(wAxis,width*.85).addScaledVector(normal,width*.18).toArray());
    for(const [h,e] of edges.entries()){
      const p=c.clone().addScaledVector(wAxis,width*e).addScaledVector(normal,width*.40*(1-e*e));
      v.push(...p.toArray());uv.push(.1+.8*u,(e+1)/2);
      if(i<steps&&h<edges.length-1){const a=i*edges.length+h;ix.push(a,a+1,a+5,a+1,a+6,a+5);}
    }
  }
  f.draw(surface(v,ix,uv),zero,unit,tint,zero,plane?'paper':'hair');
  if(plane)pen(f,contour,contour.map((_,i)=>.001+.005*Math.sin(i*Math.PI/(contour.length-1))),sootInk);
  pen(f,points,widths.map((w,i)=>Math.max(.001,w*(i===0?.08:.105))),ink);
}

// A crease is drawn from the vertices of the same tube as the nose. Following
// its actual triangular skin prevents the dry ends hovering over a narrow tip.
export function foldedTrunk(f,points,radii){
  const path=curve(points),rows=40,cols=24,v=[],ix=[],uv=[],ring=[],lateral=new T.Vector3(1,0,0);
  for(let i=0;i<=rows;i++){
    const u=i/rows,t=path.getTangent(u),across=lateral.clone().addScaledVector(t,-lateral.dot(t)).normalize();
    const forward=t.clone().cross(across).normalize(),c=path.getPoint(u),idx=u*(radii.length-1),j=Math.min(Math.floor(idx),radii.length-2);
    const r=T.MathUtils.lerp(radii[j],radii[j+1],idx-j);
    for(let k=0;k<=cols;k++){
      const angle=k/cols*tau,p=c.clone().addScaledVector(across,r*Math.sin(angle)).addScaledVector(forward,r*Math.cos(angle));
      v.push(...p.toArray());uv.push(k/cols,1-u);ring.push(p);
      if(k<cols&&i<rows){const a=i*(cols+1)+k;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
    }
  }
  f.draw(surface(v,ix,uv),zero,unit,'#faf5e9',zero,'paper');
  function onSkin(u,angle){
    const at=u*rows,ct=((angle/tau+1)%1)*cols,i=Math.floor(at),j=Math.floor(ct),du=at-i,dv=ct-j,k=i*(cols+1)+j;
    if(du+dv<=1)return ring[k].clone().multiplyScalar(1-du-dv).addScaledVector(ring[k+cols+1],du).addScaledVector(ring[k+1],dv).toArray();
    return ring[k+cols+2].clone().multiplyScalar(du+dv-1).addScaledVector(ring[k+1],1-du).addScaledVector(ring[k+cols+1],1-dv).toArray();
  }
  for(const [i,u] of [.115,.166,.206,.262,.322,.361,.423,.481,.544,.621].entries()){
    const points=Array.from({length:8},(_,j)=>{const a=-.98+.251*j+.16*Math.sin(i);return onSkin(u+.010*Math.cos(a),a);});
    pen(f,points,[.001,.003,.006,.007,.006,.004,.002,.001],i%3?'#80796b':'#695f52');
  }
}
