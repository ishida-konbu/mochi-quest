// Joinery and celadon made for the inkstone court. The front of every carved
// panel is +Z; the wall gallery, wash wing and inlet keep their own datum.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface } from './village-bath-figures.js';
const {PI,sin,cos,abs,sqrt}=Math,tau=2*PI;
const dark='#655544',wood='#ab8c60',heart='#92734f',iron='#535a52',cedar='#b69a70';
function tube(s,col,pts,r,steps=pts.length*2){s.stroke(col,pts,pts.map(()=>r),steps);}
function cut(s,shape,color,z,depth,bevel=.009){
  const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,
    bevelThickness:bevel,bevelSegments:2,curveSegments:10});s.add(g,color,0,0,z);
}
function fishTail(s,x,y,z,flipped){
  const fac=flipped?-1:1,body=new T.Shape(),at=(ax,ay)=>[x+ax*fac,y+ay];
  body.moveTo(...at(-.51,-.06));
  body.bezierCurveTo(...at(-.34,-.034),...at(-.25,.05),...at(-.10,.096));
  body.bezierCurveTo(...at(-.05,.15),...at(-.16,.264),...at(-.185,.336));
  body.bezierCurveTo(...at(-.084,.295),...at(.039,.188),...at(.093,.086));
  body.bezierCurveTo(...at(.209,.049),...at(.191,.161),...at(.283,.152));
  body.quadraticCurveTo(...at(.339,.143),...at(.344,.10));body.lineTo(...at(.493,.065));body.lineTo(...at(.349,.049));
  body.bezierCurveTo(...at(.190,-.023),...at(.053,-.069),...at(-.084,-.066));
  body.bezierCurveTo(...at(-.201,-.056),...at(-.287,-.17),...at(-.412,-.193));
  body.quadraticCurveTo(...at(-.392,-.139),...at(-.346,-.114));body.lineTo(...at(-.533,-.127));body.closePath();
  cut(s,body,wood,z,.049,.007);
  tube(s,heart,[[-.158,.277],[-.080,.148],[.022,.067],[.104,.027]].map(([u,v])=>[...at(u,v),z+.055]),.008,12);
  tube(s,heart,[[-.385,-.152],[-.224,-.095],[-.101,-.087],[.005,-.040]].map(([u,v])=>[...at(u,v),z+.057]),.006,12);
  s.ball(iron,...at(.297,.118),z+.055,.012,.012,.009);
}
function piercedWaves(s,w,z){
  // Real timber ribbons flare at the roots and hook into a deep crest. Air
  // and the painted background remain visible between the carved returns.
  for(let j=0;j<4;j++){
    const cx=(j-1.5)*w*.245,dx=w*.23;
    for(let row=0;row<2;row++){
      const spread=.8+.16*row,base=-.268+.101*row;
      const pts=[[cx-dx*.59,base],[cx-dx*.35,base+.024],[cx-dx*.07,base+.15*spread],
        [cx+dx*.10,base+.24*spread],[cx+dx*.21,base+.24*spread],[cx+dx*.255,base+.174*spread],
        [cx+dx*.215,base+.133*spread],[cx+dx*.179,base+.135*spread]];
      const shape=new T.Shape();shape.moveTo(...pts[0]);
      shape.bezierCurveTo(...pts[1],...pts[2],...pts[3]);shape.bezierCurveTo(...pts[4],...pts[5],...pts[6]);
      shape.quadraticCurveTo(...pts[7],cx+dx*.16,base+.165);
      shape.quadraticCurveTo(cx+dx*.23,base+.197,cx+dx*.146,base+.207*spread);
      shape.bezierCurveTo(cx,base+.23*spread,cx-dx*.1,base+.047,cx-dx*.32,base-.011);shape.closePath();
      cut(s,shape,row?wood:heart,z+.014*row,.049);
    }
  }
}
export function ranma(width,mirror=false){
  const s=sculpture(),w=width;
  for(const side of [-1,1]){
    s.box(dark,0,side*.303,-.05,w,.090,.133);
    s.box(wood,0,side*.255,-.012,w-.038,.018,.073);
    s.box(heart,side*(w/2-.043),0,-.03,.080,.55,.103);
  }
  piercedWaves(s,w,0);
  fishTail(s,mirror?.57:-.73,-.021,.047,mirror);
  fishTail(s,mirror?-.94:.88,-.097,.031,mirror);
  // Slender stems cantilever the fugitives above the wake and link them to
  // the upper rail. Vary the reeds so adjacent bays do not form a wallpaper.
  for(let j=0;j<3;j++){
    const left=(mirror?-1:1)*(1.11+j*.24),sl=mirror?.18:-.18;
    tube(s,cedar,[[left-sl*.4,-.241,-.007],[left+.28*sl,-.080,-.010],[left+sl,.103,-.018],[left+sl*1.59,.292,-.022]],.011,11);
    tube(s,wood,[[left+.32*sl,-.05,.011],[left+.11-sl*.36,.064,.014],[left+.153-sl*.64,.116,.014]],.012,7);
  }
  return s.finish();
}
function bracket(s,x,y,z,dir){
  // A lock-jointed corbel with its lower scroll cut out of the beam end.
  const shape=new T.Shape();shape.moveTo(-.061,0);shape.lineTo(.073,0);
  shape.bezierCurveTo(.092,.078,.200,.16,.242,.169);
  shape.bezierCurveTo(.358,.146,.400,.181,.420,.218);
  shape.quadraticCurveTo(.410,.267,.348,.25);shape.quadraticCurveTo(.335,.212,.310,.218);
  shape.bezierCurveTo(.295,.291,.400,.329,.496,.339);shape.lineTo(.53,.409);shape.lineTo(-.061,.409);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelSize:.014,bevelThickness:.012,bevelSegments:2,curveSegments:9});
  s.add(g,heart,x-.06,y,z,1,1,1,0,dir<0?PI/2:-PI/2);
  s.box(wood,x,y+.452,z+dir*.268,.182,.089,.774);
  s.box(dark,x,y+.405,z+dir*.266,.155,.051,.71);
}
export function pictureEave(){
  const s=sculpture(),hw=3.98,depth=1.014;
  // A cypress-bark pent roof shelters the painting and the duck-headed
  // spout. The packed courses and slight turn-up can be read from the bath.
  const section=(x,v)=>2.99+.387*(1-v)**1.40+.092*(abs(x)/hw)**9+.026*sin(v*PI);
  const roof=(u,v,dy=0)=>{const x=(2*u-1)*(hw+.095*v);return [x,section(x,v)+dy,-.18+depth*v];};
  s.add(surface(46,18,(u,v)=>roof(u,v,.045)),'#857a66');
  for(let row=0;row<16;row++){
    const v=row/16;
    s.add(surface(36,2,(u,h)=>roof(u,Math.min(1,v+h*.066),.052+h*.022)),row%3?'#867a65':'#9c8b70');
  }
  s.add(surface(50,3,(u,v)=>{const a=roof(u,1);a[1]+=.069-v*.153;return a;}),'#735f48');
  for(let i=0;i<3;i++)s.add(surface(42,1,(u,v)=>{const a=roof(u,1);a[1]+=-.046+i*.043+.009*v;a[2]+=.008;return a;}),i===1?'#ad936e':'#8d7759');
  s.add(surface(40,6,(u,v)=>roof(u,v,-.079)),'#9b805f');
  for(let j=-13;j<=13;j++){
    const x=j*.296;
    const pts=Array.from({length:5},(_,i)=>[x,section(x,i/4)-.093,-.170+depth*i/4]);
    tube(s,heart,pts,.033,8);
  }
  for(const x of [-3.64,3.64]){
    s.box('#806a51',x,1.55,-.073,.176,2.91,.184);
    s.box('#bbb099',x,.18,-.072,.230,.276,.249);
    s.box(dark,x,.397,-.070,.181,.189,.192);
    bracket(s,x,2.55,-.068,1);
  }
  for(const x of [-2.15,0,2.15])bracket(s,x,2.63,-.105,1);
  return s.finish();
}
export function washPier(){
  const art=sculpture(),slate='#8f978a';
  const block=(w,d,y,h,tint)=>{
    const g=new T.Shape(),r=.074;g.moveTo(-w/2+r,-d/2);g.lineTo(w/2-r,-d/2);g.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
    g.lineTo(w/2,d/2-r);g.quadraticCurveTo(w/2,d/2,w/2-r,d/2);g.lineTo(-w/2+r,d/2);g.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);
    g.lineTo(-w/2,-d/2+r);g.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);g.closePath();
    art.add(new T.ExtrudeGeometry(g,{depth:h,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2}),tint,0,y,0,1,1,1,-PI/2);
  };
  // A double-ogee, dressed granite pier. The wall panels are recessed into
  // the body, above the toe plinth and below the drained stone worktop.
  block(1.26,.66,.19,.13,'#868e81');block(1.17,.57,.315,.275,'#969b8b');
  block(1.24,.62,.573,.062,slate);block(1.33,.693,.645,.066,'#a5ad9d');
  for(const i of [-1,0,1]){
    const x=i*.361,sh=new T.Shape();sh.moveTo(-.163,.358);sh.quadraticCurveTo(-.180,.464,-.119,.50);sh.lineTo(.119,.50);
    sh.quadraticCurveTo(.180,.479,.161,.358);sh.closePath();
    const rf=new T.ExtrudeGeometry(sh,{depth:.011,bevelEnabled:true,bevelThickness:.003,bevelSize:.005,bevelSegments:1});
    art.add(rf,'#848d80',x,.015,.288);
  }
  for(let i=-3;i<=3;i++){
    const z=.09+.032*(3-abs(i)),x=i*.036;
    tube(art,'#768575',[[x,.722,z],[x,.722,z+.066],[x*1.09,.718,.335]],.006,6);
  }
  return art.finish();
}
function loft(s,points,color,rings=40){
  // Cross sections share tangents along the slip-cast body; they widen and
  // taper continuously from the tail through breast and throat.
  const centres=new T.CatmullRomCurve3(points.map(([z,y,rx,ry])=>new T.Vector3(z,y,rx)),false,'catmullrom',.40);
  const depth=new T.CatmullRomCurve3(points.map(([z,y,rx,ry],i)=>new T.Vector3(i,ry,0)),false,'catmullrom',.40);
  s.add(surface(rings,points.length*5,(u,v)=>{
    const {x:z,y,z:rx}=centres.getPoint(v),ry=Math.max(.002,depth.getPoint(v).y),a=tau*u;
    return [rx*cos(a),y+ry*sin(a),z];
  }),color);
}
export function mandarinDropper(s){
  const bed=new T.LatheGeometry([[.03,.08],[.62,.08],[.67,.112],[.68,.142],[.60,.164],
    [.52,.228],[.54,.31],[.64,.399],[.66,.418],[.637,.44],[.48,.44],[.02,.44]].map(v=>new T.Vector2(...v)),62);
  s.add(bed,'#61706d',0,0,-.185,.97,1,1.04);
  // A double lotus socket replaces the rough plinth. Slip-traced ribs
  // pick out the ridge of each petal along the recessed throat of the foot.
  for(let j=0;j<16;j++){
    const a=tau*j/16;
    const blade=(u,v)=>{
      const angle=a+(u-.5)*.405*sin(v*PI)**.67;
      const r=.535+.091*v+.050*sin(PI*u)*sin(PI*v);
      return [.97*r*cos(angle),.191+.209*v+.022*sin(PI*u)*v,-.185+1.04*r*sin(angle)];};
    s.add(surface(7,9,blade),j%2?'#839086':'#8d998b');
    const p=Array.from({length:7},(_,i)=>blade(.52,.10+.134*i));
    s.stroke('#a4ad9f',p,[.002,.005,.006,.007,.007,.004,.002],9);
  }

  const green='#91a99f',milk='#c1c9b5',sea='#647f7b',iron='#485b58',ochre='#b8a281';
  const quill=(tint,points,width,steps=14)=>s.stroke(tint,points,width,steps);
  loft(s,[[-.99,.714,.006,.013],[-.79,.690,.179,.097],[-.55,.702,.345,.204],[-.25,.702,.467,.332],
    [.048,.698,.479,.356],[.203,.74,.354,.311],[.317,.786,.268,.265],[.422,.842,.161,.192],[.478,.864,.029,.08]],green);
  loft(s,[[.053,.986,.036,.079],[.165,1.043,.167,.199],[.302,1.049,.238,.255],[.46,1.041,.212,.181],
    [.53,1.013,.121,.098],[.585,1.00,.044,.066]],green);
  // The broad crown feathers run behind the head and fall over the nape.
  for(let j=-2;j<=2;j++){
    const k=j/2,pts=[[.10*k,1.237-.034*k*k,.405],[.15*k,1.31-.031*k*k,.303],
      [.153*k,1.277-.045*k*k,.161],[.122*k,1.189-.06*k*k,-.025],[.074*k,1.126-.062*k*k,-.167]];
    quill(j%2?sea:'#859d95',pts,[.006,.034,.040,.030,.002],20);
  }
  // Raised cream eye stripes and a recessed bronze-black pupil follow the
  // duck's curved cheeks. A rubbed iron line tucks under the lower bill.
  for(const dir of [-1,1]){
    const side=(points)=>points.map(([x,y,z])=>[dir*x,y,z]);
    quill(milk,side([[.119,1.071,.525],[.187,1.133,.456],[.219,1.163,.360],[.207,1.151,.258],[.16,1.14,.17],[.101,1.12,.041]]),
      [.003,.028,.033,.024,.014,.002],20);
    quill(iron,side([[.11,1.044,.536],[.181,1.098,.473],[.219,1.112,.377],[.219,1.092,.278]]),[.003,.011,.014,.002]);
    s.ball('#3d4b47',dir*.201,1.105,.435,.030,.033,.020,0,dir*.64);
    s.ball('#e8e7d2',dir*.219,1.119,.446,.008,.008,.006);
    for(let i=0;i<4;i++)quill(i%2?ochre:milk,side([[.144+i*.024,1.005,.515-i*.033],
      [.234+i*.011,.975-i*.007,.406-i*.027],[.269+i*.015,.934-i*.017,.305-i*.036],
      [.257+i*.017,.892-i*.014,.229-i*.040]]),[.006,.027,.018,.002]);
    // An oshidori's upstanding sail feather is broad and wedge-shaped. It
    // has a raised central shaft and ivory fluting on both visible faces.
    const feather=(u,v)=>{
      const width=.203*sin(PI*v)**.74+.038*v,spine=.020*sin(PI*u);
      return [dir*(.315+.094*sin(v*PI)+.064*v+spine),.78+.631*v+.048*sin(PI*u)*v,-.253-.432*v+(2*u-1)*width];};
    s.add(surface(14,19,feather,(u,v)=>new T.Color(ochre).lerp(new T.Color('#978c70'),.47*abs(2*u-1)+.12*v)), '#fff');
    for(const u of [.08,.25,.46,.68,.88]){
      const path=Array.from({length:11},(_,j)=>{const v=.07+j*.089,point=feather(.53+(u-.53)*sqrt(v),v);point[0]+=.006*dir;return point;});
      quill(u===.46?milk:'#c3b28e',path,path.map((_,i)=>i===0||i===10?.002:.008),13);
    }
    // The lower secondaries are overlapping shaped vanes, with separated
    // tips and a fine slip-trailed margin on the leading edge.
    for(let i=0;i<6;i++){
      const wing=(u,v)=>{
        const arch=sin(PI*v),width=(.052+.009*i)*arch**.64;
        return [dir*(.333+.102*sin(v*PI)+.006*i+.012*sin(u*PI)),.746+.041*i+.024*arch+(u-.5)*width*1.6,
          .20-.057*i-v*(.80+.025*i)+.004*(u-.5)];
      };
      s.add(surface(5,13,wing),i%2?sea:'#a2b3a3');
      const ps=Array.from({length:10},(_,j)=>wing(.90,.05+j*.095));quill(milk,ps,ps.map((_,i)=>i===9?.001:.005),11);
    }
  }
  // The bill is a hollow oval nozzle. The lower mandible and its outlet
  // share the water ribbon's physical source at (0,.919,.936).
  const bill=(u,v,outer)=>{
    const a=u*tau,r=.135-.041*v+.014*sin(v*PI),sh=outer?1:.72;
    return [r*sh*cos(a),.991-.068*v+(.056-.014*v)*sh*sin(a),.486+.459*v];};
  s.add(surface(32,18,(u,v)=>bill(u,v,true)),ochre);
  s.add(surface(32,11,(u,v)=>bill(u,.67+.33*v,false)),iron);
  s.add(surface(32,2,(u,v)=>{const a=bill(u,1,true),b=bill(u,1,false);return a.map((y,j)=>y*(1-v)+b[j]*v);}),milk);
  for(const dir of [-1,1])quill(sea,[[.100*dir,1.018,.533],[.109*dir,1.01,.63],[.118*dir,.983,.741],
    [.100*dir,.948,.912]],[.006,.011,.008,.002]);
  // A hollow chrysanthemum collar is the filling port behind the sail.
  const vent=new T.LatheGeometry([[.059,0],[.083,.016],[.086,.035],[.075,.052],[.057,.045],[.050,.009]].map(v=>new T.Vector2(...v)),28);
  s.add(vent,milk,0,1.033,-.17);
  for(let j=0;j<8;j++){const a=tau*j/8;
    s.ball(green,.076*cos(a),1.067,-.17+.076*sin(a),.014,.016,.014);
  }
}
let glazed;
export function celadonGlaze(){
  if(glazed)return glazed;
  glazed=new T.MeshPhysicalMaterial({vertexColors:true,roughness:.31,metalness:.04,
    clearcoat:.48,clearcoatRoughness:.22,side:T.DoubleSide});
  return glazed;
}
// A source-sized stream clears the hollow bill and falls into its measured
// impact ripple. The groove between the two short strands catches the light.
export function suzuriPour(end){
  const paint=new T.Color(),green=new T.Color('#91ada4'),glint=new T.Color('#d0e4dc');
  return surface(25,42,(u,t)=>{
    const a=u*tau,r=(.048+.010*t-.017*sin(PI*t))*(1+.09*cos(3*a+2*t));
    return [r*cos(a)+.004*sin(t*4),.921*(1-t*t)+r*.33*sin(a),
      .937+(end-.937)*t+.80*r*sin(a)];
  },(u,t)=>paint.copy(green).lerp(glint,.14+.64*Math.max(0,cos(u*tau*2+t))**5));
}
