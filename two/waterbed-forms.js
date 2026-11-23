import * as T from './vendor/three.module.min.js';

const {sin,cos,PI,pow}=Math, tau=2*PI;
const colours=new Map();
// Each cross-section carries its own ink value. Thin tissues can turn over in
// the current; the reverse of a blade or valve is real, lit geometry.
class BedDrawing {
  positions=[]; colours=[]; bend=[]; faces=[]; farFaces=[];
  vertex(x,y,z,tint,gain=1,flex=0) {
    if(!colours.has(tint))colours.set(tint,new T.Color(tint));
    const c=colours.get(tint),id=this.bend.length;
    this.positions.push(x,y,z);this.colours.push(c.r*gain,c.g*gain,c.b*gain);
    this.bend.push(flex);
    return id;
  }
  patch(rows,cols,draw,thinBlade=false) {
    const start=this.bend.length;
    // The silhouettes use the same ribs and endpoints in both meshes. Thin
    // stems keep their triangular section; distant tissue omits intermediate ribs.
    const stepU=cols<5 && !thinBlade?1:2,stepV=rows<4?1:2;
    for(let j=0;j<rows;j+=stepV)for(let i=0;i<cols;i+=stepU){
      const a=start+j*(cols+1)+i,u=Math.min(stepU,cols-i),v=Math.min(stepV,rows-j)*(cols+1);
      this.farFaces.push(a,a+v,a+u,a+u,a+v,a+v+u);
    }
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      draw(i/cols,j/rows,i,j);
      if(j<rows && i<cols){
        const a=start+j*(cols+1)+i,b=a+cols+1;
        this.faces.push(a,b,a+1,a+1,b,b+1);
      }
    }
  }
  // A circular stem with a tapered nib. Tangent frames follow twigs and veins.
  stem(points,radii,color,segments=5,flex=0) {
    const dirs=points.map((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(i+1,points.length-1)];
      const axis=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
      const side=new T.Vector3(Math.abs(axis.y)>.91?1:0,Math.abs(axis.y)>.91?0:1,0).cross(axis).normalize();
      return [side,axis.clone().cross(side)];
    });
    this.patch(points.length-1,segments,(u,t,i,j)=>{
      const [a,b]=dirs[j],p=points[j],r=radii[j],c=r*cos(tau*u),s=r*sin(tau*u);
      this.vertex(p[0]+a.x*c+b.x*s,p[1]+a.y*c+b.y*s,p[2]+a.z*c+b.z*s,color,.78+.23*t+.11*cos(tau*u),flex*p[1]);
    });
  }
  finish() {
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
    g.setAttribute('color',new T.Float32BufferAttribute(this.colours,3));
    g.setAttribute('bedFlex',new T.Float32BufferAttribute(this.bend,1));
    g.setIndex(this.faces);g.computeVertexNormals();g.computeBoundingSphere();
    return g;
  }
}

function cobble(s,variant) {
  const levels=[[-.085,.68,.52],[.008,1,.67],[.079,.97,.83],[.132,.76,.97],[.163,.43,1.05],[.169,.003,1.03]];
  const tints=['#898875','#b4a58b','#818d87'];
  s.patch(5,11,(u,t,i,j)=>{
    const a=u*tau,[y,r,v]=levels[j];
    const edge=1+.092*cos(3*a+variant)+.066*sin(5*a-variant)+.037*cos(7*a+.2);
    const shoulder=variant===2?1+.19*sin(a)-.10*cos(a*2):1;
    const x=(variant===2?.57:.42)*r*edge*cos(a)+.055*t;
    const z=(variant===1?.345:.285)*r*edge*sin(a)*shoulder-.047*t;
    const shade=v*(.96+.10*cos(2*a+variant)+.05*sin(6*a+.75*j));
    s.vertex(x,y*(variant===2?.81:1)+.020*r*sin(3*a+.9*j+variant),z,tints[variant],shade);
  });
}

function ribbon(s,at,width,color,midrib,rows,flex=1) {
  // A raised midrib and attenuated margins turn in different planes.
  s.patch(rows,4,(u,t)=>{
    const {x,y,z,yaw,fold=0}=at(t),side=u*2-1;
    const w=width(t),r=Math.abs(side);
    const dx=cos(yaw)*w*side,dz=sin(yaw)*w*side;
    s.vertex(x+dx,y+fold*side+w*.25*(1-r),z+dz,
      r<.1?midrib:color,(.64+.34*(1-r)+.16*t),flex*y);
  },true);
}
function grass(s) {
  for(let n=0;n<7;n++){
    const a=2.39*n,r=n*.013,h=.36+.16*sin(n*4.1),length=.58+.23*cos(n*.9);
    ribbon(s,t=>({
      x:cos(a)*r+t*t*length+.065*sin(t*5+n)*t,
      y:h*sin(t*1.69)+.061*t*t*sin(t*4.7+n),z:sin(a)*(r+.22*t)+.091*sin(t*4.8+n)*t,
      yaw:1.15+.46*sin(n+.5+t),fold:.013*sin(n+.4+5*t)*t,
    }),t=>.025*(1-t*t)+.001,'#657850','#aec29a',6);
  }
}
function pondweed(s) {
  for(let n=0;n<2;n++){
    const a=n*2.34,r=.19,h=[.76,.59,.42][n];
    const point=t=>[cos(a)*r*t+.074*t*t*sin(t*4+a),h*t,sin(a)*r*t+.058*t*t];
    s.stem([point(0),point(.35),point(.69),point(1)],[.018,.015,.011,.004],'#748357',5,1);
    for(let j=1;j<=6;j++){
      const p=point(j*.14),angle=a+j*2.35,len=(.24+.048*sin(j))*(1-j*.073);
      ribbon(s,t=>({x:p[0]+cos(angle)*len*t,y:p[1]+.06*t+.047*sin(PI*t),
        z:p[2]+sin(angle)*len*t,yaw:angle+PI/2+.43*t,fold:.009*sin(3*t+j)}),
      t=>.001+.050*pow(sin(PI*t),.74),'#748658','#b9bb80',5);
    }
  }
}
function kelp(s) {
  // The stipe forks into flat, counter-twisted laminae. A short holdfast at
  // each foot remains still where the blade changes direction in the swell.
  for(let n=0;n<5;n++){
    const a=2.32*n,h=.78+.41*cos(n*1.43),span=.24+.20*sin(n*1.5);
    const base=[.046*cos(a),.018,.046*sin(a)],stipe=[.13*cos(a),.16,.13*sin(a)];
    s.stem([base,stipe],[.022,.015],'#655f40',5,.6);
    ribbon(s,t=>({x:stipe[0]+cos(a)*span*t+.17*t*sin(t*5.1+a),
      y:.16+h*t-.12*t*t,z:stipe[2]+sin(a)*span*t+.11*t*sin(5.7*t+n),
      yaw:a+.82*sin(4.5*t+n)+.30*t,fold:.048*t*sin(13*t+2*n)}),
    t=>(.006+.095*pow(sin(PI*t),.63))*(.87+.13*cos(18*t+n)),
    n%2?'#797545':'#7b8156','#afb277',11);
  }
}
// Hondawara has a wiry branched axis with stalked air vesicles. Its small
// olive blades make a different silhouette beside the wide kombu.
function sargassum(s) {
  for(let n=0;n<2;n++){
    const a=2.28*n+.39,h=.67-.17*n;
    const point=t=>[.12*t*cos(a)+.064*t*sin(5*t),h*t,.24*t*sin(a)+.042*t*t];
    s.stem([point(0),point(.37),point(.73),point(1)],[.016,.012,.009,.002],'#6b663f',5,1);
    for(let j=1;j<=5;j++){
      const t=.16*j,p=point(t),angle=a+j*2.37,len=.23*(1-.37*t);
      const b=[p[0]+.054*cos(angle),p[1]+.047,p[2]+.054*sin(angle)];
      s.stem([p,b],[.009,.005],'#898250',4,1);
      ribbon(s,f=>({x:b[0]+cos(angle)*len*f,y:b[1]+.058*f+.028*sin(PI*f),
        z:b[2]+sin(angle)*len*f,yaw:angle+PI/2+.52*f,fold:.014*sin(8*f+j)}),
      f=>(.002+.040*pow(sin(PI*f),.61))*(.88+.12*cos(f*29)),'#80844e','#b5ae70',5);
      if(j%2===1){
        s.patch(4,6,(u,v)=>{
          const r=.031*sin(PI*v);
          s.vertex(b[0]+r*cos(tau*u),b[1]+.089*v,b[2]+r*sin(tau*u),'#a69b59',.76+.31*v,b[1]+.089*v);
        });
      }
    }
  }
}
function leafDrift(s) {
  for(let n=0;n<5;n++){
    const a=n*2.4,offset=n*.073,w=.035+.011*sin(a),len=.16+.07*cos(a+.5);
    const foot=[offset*cos(a),.024+.006*n,offset*sin(a)];
    ribbon(s,t=>({x:foot[0]+cos(a)*len*t,y:foot[1]+.027*t*t+.012*sin(PI*t),
      z:foot[2]+sin(a)*len*t,yaw:a+PI/2+.37*t,fold:.018*sin(4*t+n)*t}),
    t=>(.001+w*pow(sin(PI*t),.68))*(.88+.12*cos(35*t)),n%2?'#9b7f52':'#a39365','#b8a779',8,.16);
  }
}
function twig(s) {
  const bark='#6d644d',wood='#aea07e';
  const points=[[-.57,.047,-.12],[-.23,.095,-.06],[.04,.14,.011],[.34,.11,.067],[.72,.093,.20]];
  s.stem(points,[.014,.063,.078,.053,.027],bark,8);
  s.stem([points[2],[.16,.20,-.17],[.34,.23,-.24],[.52,.205,-.39]],[.049,.032,.018,.003],bark);
  s.stem([points[1],[-.32,.14,.13],[-.47,.157,.19]],[.035,.018,.003],bark);
  s.stem([[-.28,.14,-.055],[.035,.214,.015],[.35,.155,.063],[.61,.129,.16]],[.005,.013,.008,.001],wood,4);
}
function scallop(s) {
  // Radial ribs grow from the hinge to the scalloped margin. The colour
  // changes at growth checks; a thin turned lip is visible from below.
  s.patch(5,32,(u,t,i)=>{
    const a=(u-.5)*2.14,flute=.5+.5*cos(16*PI*u);
    const radius=(.28+.015*flute)*(t+.003);
    const x=radius*sin(a),z=radius*cos(a)-.12;
    const y=.018+.062*sin(PI*t)*(.55+.45*cos(a))+.018*flute*t+.020*t*t;
    const tone=(.88+.12*flute)*(.98+.12*cos(11*PI*t)-.23*(t>.99));
    s.vertex(x,y,z,i%4===1?'#c5a48b':'#d6c3a5',tone);
  });
}
function mussels(s) {
  for(let n=0;n<2;n++){
    const a=2.13*n-.6,x=.106*cos(a),z=.112*sin(a);
    s.patch(4,10,(u,t)=>{
      const ang=tau*u,r=sin(PI*Math.min(.999,.03+.97*t));
      const along=.201*cos(ang),across=.089*sin(ang)*(.86+.27*cos(ang));
      s.vertex(x+r*(along*cos(a)-across*sin(a)),.104*t-.021,
        z+r*(along*sin(a)+across*cos(a)),t<.45?'#414f50':'#778581',
        .78+.22*t+.07*cos(ang+2*t)+.07*cos(ang*2+24*t));
    });
  }
}
function urchin(s) {
  for(let i=0;i<35;i++){
    const a=i*2.39996,up=(i+.28)/35,r=Math.sqrt(1-up*up),c=cos(a)*r,v=sin(a)*r;
    const len=.123+.07*(.5+.5*sin(3.46*i));
    s.stem([[.056*c,.034+.047*up,.056*v],[.85*len*c,.025+.64*len*up,.85*len*v],
      [len*c,.025+len*up*.80,len*v]],[.023,.007,.001],i%4?'#514b4a':'#756651',4);
  }
}
export function waterbedForms() {
  const forms={};
  const draw={cobble:s=>cobble(s,0),chert:s=>cobble(s,1),slate:s=>cobble(s,2),grass,pondweed,kelp,sargassum,leafDrift,twig,scallop,mussels,urchin};
  for(const [name,paint] of Object.entries(draw)){
    const s=new BedDrawing();paint(s);
    const g=s.finish(),mineral=['cobble','slate','chert'].includes(name),plant=['grass','kelp','pondweed','sargassum'].includes(name);
    g.setAttribute('bedKind',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(mineral?0:plant?1:2),1));
    forms[name]=g;
    if(!['slate','chert'].includes(name)){
      const low=g.clone();low.setIndex(s.farFaces);forms[name+'Far']=low;
    }
  }
  return forms;
}
