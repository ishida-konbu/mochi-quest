// The brush travels from nape to nose along a single continuous skull. All
// the eye and cheek marks are registered to that surface in either profile.
import * as T from './vendor/three.module.min.js';
import { sculpture,brushStroke } from './pilgrimage-pigment.js';

const pi=Math.PI, tau=2*pi;
const {sin,cos,abs}=Math;
const smooth=T.MathUtils.smoothstep;
const poses={
  lantern:{ear:.13,brow:.13,gaze:-.10,lid:1,mouth:.09},
  groom:{ear:-.02,brow:-.08,gaze:.17,lid:.79,mouth:.18},
  bride:{ear:-.06,brow:.08,gaze:.12,lid:.78,mouth:.27},
  parasol:{ear:.05,brow:.16,gaze:-.03,lid:1.12,mouth:.04},
  flute:{ear:.12,brow:-.12,gaze:.04,lid:.70,mouth:-.09},
};
function sheet(columns,rows,sample,color) {
  const xyz=[],rgb=[],tri=[],wash=new T.Color();
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const u=i/columns,v=j/rows;
    xyz.push(...sample(u,v));color(u,v,wash);rgb.push(wash.r,wash.g,wash.b);
    if(j<rows&&i<columns){
      const k=j*(columns+1)+i;
      tri.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);
    }
  }
  const g=new T.BufferGeometry();g.setIndex(tri);g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.computeVertexNormals();return g;
}
export function weddingVisage(role) {
  const pose=poses[role],art=sculpture();
  const stations=[
    [-.273,-.006,.008,.012],[-.232,-.002,.133,.125],[-.145,.005,.201,.184],
    [-.042,-.003,.230,.200],[.06,-.008,.218,.176],[.140,-.025,.172,.138],
    [.208,-.039,.125,.097],[.293,-.055,.090,.068],[.378,-.055,.060,.051],
    [.422,-.048,.025,.032],[.437,-.045,.004,.011],
  ];
  const axis=new T.SplineCurve(stations.map(([z,y])=>new T.Vector2(z,y)));
  const width=new T.SplineCurve(stations.map(([z,y,x,h])=>new T.Vector2(x,h)));
  const c=new T.Vector2(),r=new T.Vector2();
  function skin(t,a,pad=0) {
    axis.getPoint(t,c);width.getPoint(t,r);
    const cheek=sin(pi*t)**3*(1-smooth(t,.45,.7))*(.006*cos(a*7)+.008*cos(a*5));
    return [(r.x+cheek+pad)*sin(a),c.y+(r.y+pad)*cos(a),c.x];
  }
  const cream=new T.Color('#e8dcc1'),silver=new T.Color(role==='bride'?'#c8b49c':'#ac9276'),bridle=new T.Color('#776958');
  art.add(sheet(60,42,(u,t)=>skin(t,tau*u),(u,t,wash)=>{
    const a=u*tau,jag=.075*sin(a*19+t*17)+.06*cos(t*53);
    const ivory=smooth(-cos(a)+.33*t+jag,-.34,.57);
    wash.copy(silver).lerp(cream,ivory);
    wash.lerp(bridle,.28*(1-ivory)*(1-smooth(t,.48,.8))*(.45+.55*sin(a*7+t*9)**2));
  }),'#fff');
  const warm='#6f6050',black='#423b32',ivory='#e2d5b9';
  for(const side of [-1,1]) {
    const ear=(u,v,front=1)=>{
      const q=2*u-1;
      const spread=(.089*(1-v)**.78+.003)*q;
      return [side*(.123+.062*v+.032*sin(pi*v)+spread),
        .127+.243*v+.028*abs(q)*(1-v)+.011*sin(v*pi),
        -.102+(front?1:-1)*(.016+.043*(1-v))+.052*spread*side-.056*v*v+
          (front?-.057:.020)*(1-q*q)*sin(pi*(.17+.80*v))+pose.ear*v*(side===1?.44:-.28)];
    };
    art.add(sheet(16,15,(u,v)=>ear(u,v,0),(u,v,w)=>w.copy(silver).lerp(bridle,.37*v)),'#fff');
    art.add(sheet(22,20,(u,v)=>ear(u,v),(u,v,w)=>{
      const margin=smooth(abs(2*u-1),.58,.94);
      w.set('#a88e7a').lerp(cream,margin*.89).lerp(bridle,.48*v*v);
    }),'#fff');
    for(const edge of [0,1]){
      const seam=Array.from({length:8},(_,i)=>ear(edge,i/7));
      art.add(brushStroke(seam,[.001,.0042,.0048,.001],12,4),warm);
      art.add(sheet(2,8,(u,v)=>{
        const a=ear(edge,v),b=ear(edge,v,0);
        return a.map((n,j)=>n+u*(b[j]-n));
      },(u,v,w)=>w.copy(silver).lerp(cream,1-u)),'#fff');
    }
    for(let i=0;i<6;i++) {
      const u=.18+i*.12,pts=[[u,.12],[u*.75+.13,.23],[u*.56+.21,.39+.12*sin(2.8*i)]];
      art.add(brushStroke(pts.map(([x,y])=>ear(x,y)),[.0007,.003,.0004],6,4),i%2?warm:ivory);
    }
    function ink(points,widths,tint,pad=.0025,steps=12) {
      art.add(brushStroke(points.map(([t,a])=>skin(t,a*side,pad)),widths,steps,5),tint);
    }
    // One almond between a heavy upper lid and a vanishing lower lid. The
    // front corner climbs toward the bridge, giving the fox its sly glance.
    const eye=(u,v,lift=.004)=>{
      const t=.344+.263*u,a=1.18-.145*u-pose.brow*(1-u);
      const opening=sin(pi*u)**.74;
      return skin(t,(a+opening*((v-.5)*.48*pose.lid+.032))*side,lift);
    };
    art.add(sheet(16,7,eye,(u,v,w)=>w.set('#eee3c9')),'#fff');
    for(const v of [0,1])art.add(brushStroke(Array.from({length:10},(_,i)=>eye(i/9,v,.008)),
      v?[.0005,.0026,.0031,.001]:[.0006,.006,.007,.004,.0004],15,5),black);
    const pu=.56+pose.gaze;
    art.add(sheet(15,6,(u,v)=>{
      const a=u*tau;
      return eye(pu+.090*v*cos(a),.49+.42*v*sin(a),.010);
    },(u,v,w)=>w.set(black)),'#fff');
    ink([[.307,1.09-pose.brow],[.368,.861-pose.brow],[.446,.842],[.527,.884]], [.0006,.0063,.005,.0006],warm);
    // A few dry guard hairs run from the inner brow back to the crown.
    // These strokes follow the bridge, visible between the two eyes head-on.
    for(let j=0;j<8;j++){
      const a=.22+.060*j,t=.34+.013*sin(j*2.36);
      ink([[t+.19-.012*j,a+.051],[t+.10,a+.016],[t-.006,a-.027],[t-.088,a+.026]],
        [.0005,.0021+.0004*(j%3),.0018,.0004],j%3?'#af997e':'#8c7964',.002,9);
    }
    ink([[.590,.898],[.633,1.017],[.682,1.143],[.726,1.197]],[.0008,.0037,.0024,.0005],'#8c755d',.003);
    ink([[.22,1.62],[.30,1.72],[.377,1.84],[.419,1.77]],[.0004,.0035,.004,.0006],'#9b846a');
    for(let j=0;j<14;j++){
      const row=j%7,col=Math.floor(j/7),t=.21+.102*col+.036*sin(2.2*j),a=1.10+.17*row;
      ink([[t,a],[t-.032,a+.07],[t-.088,a+.12]], [.0004,.0023+.0012*(j%3),.0005],j%4===0?warm:j%2?'#b19c80':'#d9c9a9',.002,6);
    }
    ink([[.88,2.37],[.762,2.46],[.618,2.40],[.537,2.05-pose.mouth],[.534,1.96-pose.mouth]],
      [.001,.0041,.0053,.0022,.0005],black,.0034);
    for(let j=0;j<6;j++){
      const t=.63+.040*(j%3),a=1.68+.21*Math.floor(j/3);
      ink([[t,a],[t+.009,a+.027]],[.0024,.001],warm,.004,3);
    }
    for(let j=0;j<3;j++){
      const from=skin(.69+j*.031,side*(1.65+.16*j),.002);
      art.add(brushStroke([from,[from[0]+side*.070,from[1]+.004,from[2]+.008],
        [from[0]+side*(.134+.011*j),from[1]-.012-j*.010,from[2]-.010-.018*j]],
        [.001,.002,.0004],8,4),warm);
    }
  }
  // Taper the nose into the bridge; the pale two nostril rims break the dark wash.
  art.add(sheet(32,14,(u,v)=>{
    const a=tau*u,b=pi*v,upper=cos(a);
    return [.039*sin(b)*sin(a)*(.83+.15*upper),-.043+.028*sin(b)*upper,.412+.030*cos(b)];
  },(u,v,w)=>w.set('#433c35').lerp(bridle,.5*sin(pi*u)**2*v)),'#fff');
  return art.finish();
}
