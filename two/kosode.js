// Kosode are cut in panels. Their painted silk, figured linings and cords all
// share an atlas, including the undyed weave on its lower selvedge.
import * as T from './vendor/three.module.min.js';
import { brushWash } from './scroll-sculpt.js';

const tau=2*Math.PI, {sin,cos,abs,pow}=Math;
let silk;
export function silkMaterial(){
  if(!silk){
    const map=new T.TextureLoader().load(new URL('./assets/residents/kosode-silk.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    silk=brushWash(new T.MeshStandardMaterial({map,vertexColors:true,roughness:.86,
      side:T.DoubleSide}),.14);
  }
  return silk;
}

// The front and the turned-back lining can take different cuts of the bolt.
export class SilkPanels {
  xyz=[];uv=[];colors=[];triangles=[];
  cut(rows,cols,point,swatch,tint='#ffffff',uvAt=(u,v)=>[u,v]){
    const base=this.xyz.length/3,c=new T.Color(tint),plain=swatch===4;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const u=i/cols,v=j/rows,[s,t]=uvAt(u,v);
      this.xyz.push(...point(u,v));
      this.colors.push(c.r,c.g,c.b);
      // Two texels of guard around each panel keep seams clean in the mip chain.
      this.uv.push(plain?.005+s*.99:((swatch%2)+.005+s*.99)*.5,
        plain?.004+t*.102:1-((swatch>>1)+1-.005-t*.99)*4/9);
      if(i<cols&&j<rows){
        const k=base+j*(cols+1)+i;
        this.triangles.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);
      }
    }
  }
  finish(){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(this.xyz,3));
    g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));
    g.setIndex(this.triangles);g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
}
const wardrobes=[
  {bolt:0,collar:'#edc7b0',lining:'#a45441',obi:'#cdad6f',cord:'#782e2c',long:.39},
  {bolt:1,collar:'#dedac1',lining:'#b7ada0',obi:'#a07760',cord:'#e3cb93',long:.24},
  {bolt:2,collar:'#e5d5ae',lining:'#867456',obi:'#4d605c',cord:'#bd975b',long:.14},
  {bolt:2,collar:'#c7cdb8',lining:'#6e806f',obi:'#75674f',cord:'#decd94',long:.12},
  {bolt:0,collar:'#e4d2ba',lining:'#896e77',obi:'#ad9273',cord:'#dec599',long:.13},
  {bolt:1,collar:'#e1d7b7',lining:'#8c7466',obi:'#bba374',cord:'#956449',long:.19},
  {bolt:2,collar:'#c6c5a8',lining:'#6e6a50',obi:'#4f635c',cord:'#c4a271',long:.11},
];
const section=new T.SplineCurve([[.1,.422],[.15,.48],[.26,.475],[.42,.450],
  [.57,.405],[.72,.419],[.84,.444],[.93,.418],[1.015,.312],[1.047,.256]].map(([y,r])=>new T.Vector2(r,y)));

const styles=new Map();
export function kosode(kind){
  if(styles.has(kind))return styles.get(kind);
  const p=new SilkPanels(),d=wardrobes[kind],formal=kind<2||kind===5;
  function robe(u,v,lift=0){
    const a=(u-.5)*tau,sec=section.getPoint(v),skirt=(1-v)**1.8,shoulder=sin(Math.PI*v)**2;
    // Pleats converge toward the hip beneath the stiff sash; the outer left
    // front travels diagonally from the throat toward the right-hand hip.
    const fold=(.027*cos(7*a+1.32*v)+.009*cos(12*a-.9*v)+.009*sin(3*a))*skirt+
      shoulder*.012*sin(6*a-1.9*v);
    const w=sec.x+fold+lift;
    return [w*sin(a),sec.y+.023*skirt*sin(3*a+.66)+.009*skirt*cos(7*a),
      (w*.81+lift*.19)*cos(a)-(formal?.085:.02)*skirt*(1-cos(a))*.5];
  }
  p.cut(29,68,robe,d.bolt);
  // Three separately cut padded hems. The open front reveals a glimpse of red silk.
  for(const [v0,v1,lift,color] of [[.007,.039,.005,d.lining],[.045,.056,.004,d.collar]]){
    p.cut(2,68,(u,v)=>robe(u,v0+(v1-v0)*v,lift),4,color);
  }
  const seam=v=>.556+.028*cos(v*1.5)-.092*v;
  p.cut(16,5,(u,v)=>robe(seam(v)+(u-.5)*.012,v*.55,.004+.013*sin(Math.PI*u)),4,d.lining);
  // Inner collar first. The left face is laid on top at the crossover.
  for(const side of [1,-1]){
    const top=side>0?.725:.724;
    for(const [offset,w,thickness,color] of [[0,.044,.018,d.collar],[.023,.026,.025,d.lining]]){
      p.cut(21,5,(u,v)=>{
        const angle=.5+side*(.233*(1-v)-.081*v+offset+(u-.5)*w);
        return robe(angle,1-(1-top)*v,thickness+.009*sin(Math.PI*u)+(side<0?.006:0));
      },4,color);
    }
  }
  // Tensioned obi, darker rolled edges, and a small braided obijime.
  for(const [v0,v1,lift,col] of [[.521,.738,.045,d.obi],[.52,.537,.051,d.lining],
    [.718,.738,.052,d.collar],[.593,.617,.058,d.cord],[.602,.609,.064,d.collar]]){
    p.cut(4,64,(u,v)=>robe(u,v0+(v1-v0)*v,lift+.005*sin(v*Math.PI)),4,col);
  }
  for(const side of [-1,1]){
    const forward=side===1?.194:.080;
    function sleeve(u,v,inside=0){
      const a=(u-.5)*tau,sv=sin(a),cv=cos(a);
      // Long furisode panels hang below the hand. The wrist and shoulder
      // remain high while the bottom edge rounds over its two sewn corners.
      const lat=Math.sign(sv)*pow(abs(sv),.55),height=Math.sign(cv)*pow(abs(cv),.62);
      const width=.127+.037*sin(v*Math.PI)-.018*v-inside*.018;
      const heavy=d.long*(.45+.55*sin(.34+v*1.66)),fall=(1-height)*.5;
      return [side*(.29+.223*v+.055*sin(v*Math.PI))+lat*width,
        .869-.147*v+.12*height-heavy*fall+inside*.016*fall,
        -.025+(.154+forward)*v+.049*sin(v*Math.PI)+.017*cos(5*a-v*1.4)*fall-inside*.041];
    }
    p.cut(16,38,sleeve,d.bolt,'#fff', (u,v)=>[side>0?.03+.86*u:.96-.86*u,.08+.75*(1-v)]);
    // The lower half of the opening is stitched shut across the front of
    // the bag. Only the hand passes through the upper lined slit (sodeguchi).
    function pocket(u,v){
      const a=.22+.28*v,l=sleeve(.5-a,1),r=sleeve(.5+a,1);
      return l.map((q,k)=>q+(r[k]-q)*u+(k===2?.013*sin(Math.PI*u)*sin(Math.PI*v):0));
    }
    p.cut(12,12,pocket,d.bolt,'#fff',(u,v)=>[.12+.75*u,.10+.42*v]);
    p.cut(2,12,(u,v)=>pocket(u,v*.065),4,d.lining);
    p.cut(4,32,(u,v)=>sleeve(.28+.44*u,1,v),4,d.lining);
    p.cut(3,38,(u,v)=>sleeve(u,.964+.031*v,.04),4,d.collar);
  }
  if(kind===0){
    // Darari ends swing free of the skirt. The reverses show under the curled tips.
    for(const side of [-1,1])for(const reverse of [0,1]){
      p.cut(16,8,(u,v)=>{
        const x=side*(.109+.067*v)+(u-.5)*.18;
        return [x,.705-.476*v+.019*sin(tau*(u*.42+.39*v)),
          -.367-.077*v-.038*sin(v*Math.PI)-.024*cos(u*Math.PI*2)+.006*reverse];
      },reverse?4:3,reverse?d.lining:'#ccad79');
    }
  }
  const g=p.finish();styles.set(kind,g);return g;
}
